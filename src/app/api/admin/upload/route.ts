import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiLimiter } from '@/lib/rate-limit'
import { CONTENIDO_BUCKET, getSignedContentUrl } from '@/lib/supabase/storage'

// Max file sizes by type
const MAX_SIZES: Record<string, number> = {
  pdf: 100 * 1024 * 1024,   // 100MB for PDFs
  audio: 300 * 1024 * 1024, // 300MB for audio
  video: 500 * 1024 * 1024, // 500MB for video
}

// Allowed MIME types by content category
const ALLOWED_MIMES: Record<string, string[]> = {
  pdf: ['application/pdf'],
  audio: [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
    'audio/aac', 'audio/mp4', 'audio/x-m4a',
  ],
  video: [
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
  ],
}

export async function POST(request: Request) {
  try {
    // 1. Verify admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Rate limit
    const { success: withinLimit } = apiLimiter.check(user.id)
    if (!withinLimit) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Espera un momento.' },
        { status: 429 }
      )
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (profile?.rol !== 'admin' && profile?.rol !== 'root') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // 2. Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const tipo = formData.get('tipo') as string // pdf, audio, video
    const folder = formData.get('folder') as string || 'general' // course/chapter folder

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 })
    }

    if (!tipo || !ALLOWED_MIMES[tipo]) {
      return NextResponse.json({ error: 'Tipo de contenido inválido' }, { status: 400 })
    }

    // 3. Validate file type
    if (!ALLOWED_MIMES[tipo].includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido: ${file.type}. Permitidos: ${ALLOWED_MIMES[tipo].join(', ')}` },
        { status: 400 }
      )
    }

    // 4. Validate file size
    const maxSize = MAX_SIZES[tipo] || 100 * 1024 * 1024
    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024))
      return NextResponse.json(
        { error: `El archivo es demasiado grande. Máximo: ${maxMB}MB` },
        { status: 400 }
      )
    }

    // 5. Generate safe filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const safeName = file.name
      .replace(/\.[^.]+$/, '') // remove extension
      .replace(/[^a-zA-Z0-9_-]/g, '_') // sanitize
      .substring(0, 60) // limit length
    const timestamp = Date.now()
    const filePath = `${folder}/${safeName}_${timestamp}.${ext}`

    // 6. Upload to Supabase Storage using admin client
    const adminSupabase = createAdminClient()
    const buffer = Buffer.from(await file.arrayBuffer())

    // Ensure bucket exists (auto-create as PRIVATE if missing)
    const { data: buckets, error: listErr } = await adminSupabase.storage.listBuckets()

    if (listErr) {
      console.error('Storage list error:', listErr)
      return NextResponse.json(
        { error: 'No se pudo conectar al almacenamiento de Supabase. Verifica que Storage esté habilitado en tu proyecto.' },
        { status: 500 }
      )
    }

    const bucketExists = buckets?.some((b) => b.id === CONTENIDO_BUCKET)
    if (!bucketExists) {
      // Create as PRIVATE with size limit and MIME whitelist across all content types
      const allMimes = [
        ...ALLOWED_MIMES.pdf,
        ...ALLOWED_MIMES.audio,
        ...ALLOWED_MIMES.video,
      ]
      const { error: createErr } = await adminSupabase.storage.createBucket(CONTENIDO_BUCKET, {
        public: false,
        fileSizeLimit: 500 * 1024 * 1024, // 500 MB hard cap (video limit)
        allowedMimeTypes: allMimes,
      })
      if (createErr) {
        console.error('Bucket creation error:', JSON.stringify(createErr))
        return NextResponse.json(
          { error: `No se pudo crear el bucket. Error: ${createErr.message}. Ve a Supabase Dashboard → Storage y crea un bucket privado llamado "${CONTENIDO_BUCKET}".` },
          { status: 500 }
        )
      }
    }

    const { data, error } = await adminSupabase.storage
      .from(CONTENIDO_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('Storage upload error:', error)
      // Provide specific error messages
      const msg = error.message?.includes('mime')
        ? `Tipo de archivo no permitido por Supabase: ${file.type}`
        : error.message?.includes('size')
          ? 'El archivo excede el tamaño máximo permitido'
          : `Error al subir archivo: ${error.message || 'Intenta de nuevo'}`
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    // 7. Generate a short-lived signed URL (1h) so the admin UI can preview
    //    the file right after upload. The DB record stores only the path —
    //    the player pages regenerate signed URLs on every view.
    const signedUrl = await getSignedContentUrl(adminSupabase, data.path, 3600)

    return NextResponse.json({
      success: true,
      url: signedUrl,
      path: data.path,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
