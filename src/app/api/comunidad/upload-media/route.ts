import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadLimiter } from '@/lib/rate-limit'

const BUCKET = 'comunidad-media'
const MAX_IMAGE_SIZE = 10 * 1024 * 1024   // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024  // 100 MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/mov']
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]

export async function POST(request: Request) {
  // Verify authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Rate limit: 30 uploads per hour per user
  const { success, resetAt } = uploadLimiter.check(user.id)
  if (!success) {
    const waitMin = Math.ceil((resetAt - Date.now()) / 60_000)
    return NextResponse.json(
      { error: `Límite de subidas alcanzado. Volvé a intentarlo en ${waitMin} min.` },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
  }

  // Validate MIME type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Tipo de archivo no permitido. Solo imágenes (jpg, png, webp, gif) y videos (mp4, mov, webm).' },
      { status: 400 }
    )
  }

  // Validate size
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
  if (file.size > maxSize) {
    const limit = isVideo ? '100 MB' : '10 MB'
    return NextResponse.json(
      { error: `El archivo supera el límite de ${limit}` },
      { status: 400 }
    )
  }

  // Build storage path: {userId}/{timestamp}-{sanitized-name}
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const timestamp = Date.now()
  const path = `${user.id}/${timestamp}.${ext}`

  // Upload via admin client (bypasses RLS)
  const admin = createAdminClient()
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 })
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({ success: true, url: data.publicUrl })
}
