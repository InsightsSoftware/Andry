'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { csvQuestionRowSchema } from '@/lib/validations'
import { z } from 'zod'

// Helper: verify caller is admin or root
async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.rol !== 'admin' && profile?.rol !== 'root') throw new Error('No autorizado')
  return { ...user, rol: profile.rol as string }
}

// Helper: verify caller is root
async function requireRoot() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.rol !== 'root') throw new Error('No autorizado — se requiere rol root')
  return user
}

// ── Dashboard metrics ──────────────────────────────────────────────

export async function getAdminMetrics() {
  await requireAdmin()
  const admin = createAdminClient()

  const [users, courses, questions, payments] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('cursos').select('id', { count: 'exact', head: true }).eq('activo', true),
    admin.from('preguntas').select('id', { count: 'exact', head: true }),
    admin
      .from('pagos')
      .select('monto_centavos')
      .gte(
        'created_at',
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      ),
  ])

  const monthlyRevenue = (payments.data || []).reduce(
    (sum, p) => sum + (p.monto_centavos || 0),
    0
  )

  // Subscription breakdown
  const { data: subData } = await admin
    .from('profiles')
    .select('subscription_status')

  const activeSubscriptions = (subData || []).filter(
    (p) => p.subscription_status === 'activa'
  ).length

  // Recent signups (last 7 days)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const { count: recentSignups } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', weekAgo.toISOString())

  return {
    totalUsers: users.count || 0,
    activeCourses: courses.count || 0,
    totalQuestions: questions.count || 0,
    monthlyRevenue: monthlyRevenue / 100,
    activeSubscriptions,
    recentSignups: recentSignups || 0,
  }
}

// ── User management ────────────────────────────────────────────────

export async function getUsers() {
  await requireAdmin()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('profiles')
    .select(
      'id, email, nombre_completo, rol, subscription_status, subscription_plan, subscription_expires_at, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching users:', error)
    return { users: [] }
  }

  return { users: data || [] }
}

export async function getCurrentUserRole() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { rol: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .maybeSingle()

  return { rol: profile?.rol || null, userId: user.id }
}

export async function updateUserRole(userId: string, rol: 'estudiante' | 'admin') {
  const currentUser = await requireAdmin()
  const admin = createAdminClient()

  // Prevent self-demotion
  if (userId === currentUser.id) {
    return { error: 'No puedes cambiar tu propio rol' }
  }

  // Only root can modify other admins/root users
  const { data: targetProfile } = await admin
    .from('profiles')
    .select('rol')
    .eq('id', userId)
    .maybeSingle()

  if (targetProfile?.rol === 'root') {
    return { error: 'No se puede modificar un usuario root' }
  }

  if (targetProfile?.rol === 'admin' && currentUser.rol !== 'root') {
    return { error: 'Solo root puede modificar administradores' }
  }

  const { error } = await admin
    .from('profiles')
    .update({ rol })
    .eq('id', userId)

  if (error) {
    console.error('Error updating role:', error)
    return { error: 'Error al actualizar rol' }
  }

  revalidatePath('/admin/usuarios')
  return { success: true }
}

export async function deleteUser(userId: string) {
  const currentUser = await requireRoot()
  const admin = createAdminClient()

  // Cannot delete yourself
  if (userId === currentUser.id) {
    return { error: 'No puedes eliminar tu propia cuenta' }
  }

  // Cannot delete other root users
  const { data: targetProfile } = await admin
    .from('profiles')
    .select('rol')
    .eq('id', userId)
    .maybeSingle()

  if (targetProfile?.rol === 'root') {
    return { error: 'No se puede eliminar un usuario root' }
  }

  // Delete from Supabase Auth (CASCADE will delete profile)
  const { error } = await admin.auth.admin.deleteUser(userId)

  if (error) {
    console.error('Error deleting user:', error)
    return { error: 'Error al eliminar usuario' }
  }

  revalidatePath('/admin/usuarios')
  return { success: true }
}

// ── Question management ────────────────────────────────────────────

export async function getQuestions() {
  await requireAdmin()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('preguntas')
    .select('id, texto, respuesta_correcta, pagina_libro, capitulo_id, capitulos(nombre, cursos(nombre))')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching questions:', error)
    return { questions: [] }
  }

  return { questions: data || [] }
}

export async function uploadQuestions(
  capituloId: string,
  questions: {
    texto: string
    opcion_a: string
    opcion_b: string
    opcion_c: string
    opcion_d: string
    respuesta_correcta: string
    explicacion?: string
    pagina_libro?: number
  }[]
) {
  await requireAdmin()
  const admin = createAdminClient()

  // Validate capituloId
  if (!capituloId || !z.string().uuid().safeParse(capituloId).success) {
    return { error: 'ID de capítulo inválido' }
  }

  // Validate each question with Zod
  const validatedQuestions = []
  for (let i = 0; i < questions.length; i++) {
    const result = csvQuestionRowSchema.safeParse(questions[i])
    if (!result.success) {
      return {
        error: `Pregunta ${i + 1}: ${result.error.issues[0]?.message || 'datos inválidos'}`,
      }
    }
    validatedQuestions.push(result.data)
  }

  if (validatedQuestions.length === 0) {
    return { error: 'No hay preguntas para subir' }
  }

  const rows = validatedQuestions.map((q) => ({
    capitulo_id: capituloId,
    texto: q.texto,
    opcion_a: q.opcion_a,
    opcion_b: q.opcion_b,
    opcion_c: q.opcion_c || '',
    opcion_d: q.opcion_d || '',
    respuesta_correcta: q.respuesta_correcta.toLowerCase(),
    explicacion: q.explicacion || '',
    pagina_libro: q.pagina_libro || 0,
  }))

  const { error } = await admin.from('preguntas').insert(rows)

  if (error) {
    console.error('Error uploading questions:', error)
    return { error: 'Error al subir preguntas: ' + error.message }
  }

  revalidatePath('/admin/preguntas')
  return { success: true, count: rows.length }
}

export async function deleteQuestion(questionId: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin.from('preguntas').delete().eq('id', questionId)

  if (error) {
    console.error('Error deleting question:', error)
    return { error: 'Error al eliminar pregunta' }
  }

  revalidatePath('/admin/preguntas')
  return { success: true }
}

// ── Content management ─────────────────────────────────────────────

export async function getCourses() {
  await requireAdmin()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('cursos')
    .select('*')
    .order('orden')

  if (error) {
    console.error('Error fetching courses:', error)
    return { courses: [] }
  }

  return { courses: data || [] }
}

// ── Curso CRUD ────────────────────────────────────────────────────

export async function createCourse(input: {
  nombre: string
  slug: string
  descripcion: string
  orden?: number
  activo?: boolean
}) {
  await requireAdmin()

  const nombre = input.nombre.trim()
  const slug = input.slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
  const descripcion = input.descripcion.trim()

  if (!nombre || nombre.length < 3) return { error: 'Nombre inválido' }
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return { error: 'Slug inválido (solo minúsculas, números, guiones)' }
  }
  if (!descripcion) return { error: 'Descripción obligatoria' }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('cursos')
    .insert({
      nombre,
      slug,
      descripcion,
      orden: input.orden ?? 0,
      activo: input.activo ?? true,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'Ya existe un curso con ese slug' }
    return { error: error.message }
  }

  revalidatePath('/admin/contenido')
  revalidatePath('/estudio')
  return { success: true, curso: data }
}

export async function deleteCourse(cursoId: string) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('cursos').delete().eq('id', cursoId)
  if (error) return { error: error.message }
  revalidatePath('/admin/contenido')
  revalidatePath('/estudio')
  return { success: true }
}

// ── Capítulo CRUD ─────────────────────────────────────────────────

export async function createChapter(input: {
  curso_id: string
  nombre: string
  numero: number
  descripcion?: string
  pagina_inicio?: number
  pagina_fin?: number
}) {
  await requireAdmin()

  const nombre = input.nombre.trim()
  if (!nombre || nombre.length < 3) return { error: 'Nombre inválido' }
  if (!input.curso_id) return { error: 'Curso inválido' }
  if (!Number.isFinite(input.numero) || input.numero < 1) {
    return { error: 'Número de capítulo inválido' }
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('capitulos')
    .insert({
      curso_id: input.curso_id,
      nombre,
      numero: input.numero,
      descripcion: input.descripcion?.trim() || null,
      pagina_inicio: input.pagina_inicio ?? 0,
      pagina_fin: input.pagina_fin ?? 0,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/admin/contenido')
  revalidatePath('/estudio')
  return { success: true, capitulo: data }
}

export async function deleteChapter(capituloId: string) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('capitulos').delete().eq('id', capituloId)
  if (error) return { error: error.message }
  revalidatePath('/admin/contenido')
  revalidatePath('/estudio')
  return { success: true }
}

export async function getChapters(cursoId: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('capitulos')
    .select('*')
    .eq('curso_id', cursoId)
    .order('numero')

  if (error) {
    console.error('Error fetching chapters:', error)
    return { chapters: [] }
  }

  return { chapters: data || [] }
}

export async function getContent(capituloId: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('contenido')
    .select('*')
    .eq('capitulo_id', capituloId)
    .order('orden')

  if (error) {
    console.error('Error fetching content:', error)
    return { content: [] }
  }

  return { content: data || [] }
}

export async function createContent(contentData: {
  capitulo_id: string
  tipo: 'pdf' | 'audio' | 'video'
  titulo: string
  descripcion?: string
  archivo_url: string
  duracion_segundos?: number
  orden?: number
}) {
  await requireAdmin()
  const admin = createAdminClient()

  // Validate URL — only allow https:// URLs (Supabase storage or trusted CDN)
  try {
    const url = new URL(contentData.archivo_url)
    if (!['https:'].includes(url.protocol)) {
      return { error: 'Solo se permiten URLs con HTTPS' }
    }
  } catch {
    return { error: 'URL de archivo inválida' }
  }

  // Validate content type
  if (!['pdf', 'audio', 'video'].includes(contentData.tipo)) {
    return { error: 'Tipo de contenido inválido' }
  }

  const { error } = await admin.from('contenido').insert(contentData)

  if (error) {
    console.error('Error creating content:', error)
    return { error: 'Error al crear contenido' }
  }

  revalidatePath('/admin/contenido')
  return { success: true }
}

export async function deleteContent(contentId: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin.from('contenido').delete().eq('id', contentId)

  if (error) {
    console.error('Error deleting content:', error)
    return { error: 'Error al eliminar contenido' }
  }

  revalidatePath('/admin/contenido')
  return { success: true }
}

// ── Payments ───────────────────────────────────────────────────────

export async function getPayments() {
  await requireAdmin()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('pagos')
    .select('*, profiles(nombre_completo, email)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching payments:', error)
    return { payments: [] }
  }

  return { payments: data || [] }
}
