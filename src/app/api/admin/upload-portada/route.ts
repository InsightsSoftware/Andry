import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60
export const runtime = 'nodejs'

const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: Request) {
  try {
    // 1. Verify admin session
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

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
    const bucket = formData.get('bucket') as string | null  // 'cursos-portadas' | 'capitulos-portadas'
    const path = formData.get('path') as string | null      // e.g. '{id}/portada.jpg'

    if (!file || !bucket || !path) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // 3. Validate
    if (!ALLOWED_MIMES.includes(file.type)) {
      return NextResponse.json({ error: 'Solo se aceptan imágenes (jpg, png, webp, gif)' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Máximo 5 MB por imagen' }, { status: 400 })
    }
    // Whitelist buckets
    if (!['cursos-portadas', 'capitulos-portadas'].includes(bucket)) {
      return NextResponse.json({ error: 'Bucket no permitido' }, { status: 400 })
    }

    // 4. Upload via admin client (bypasses RLS — safe since we already verified role above)
    const admin = createAdminClient()
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(path, buffer, { upsert: true, contentType: file.type })

    if (uploadError) throw uploadError

    const { data } = admin.storage.from(bucket).getPublicUrl(path)

    return NextResponse.json({ success: true, url: data.publicUrl })
  } catch (err: any) {
    console.error('upload-portada error:', err)
    return NextResponse.json({ error: err?.message || 'Error al subir' }, { status: 500 })
  }
}
