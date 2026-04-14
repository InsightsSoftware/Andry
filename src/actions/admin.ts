'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// Helper: verify caller is admin
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

  if (profile?.rol !== 'admin') throw new Error('No autorizado')
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

export async function updateUserRole(userId: string, rol: 'estudiante' | 'admin') {
  await requireAdmin()
  const admin = createAdminClient()

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
    explicacion: string
    pagina_libro: number
  }[]
) {
  await requireAdmin()
  const admin = createAdminClient()

  const rows = questions.map((q) => ({
    capitulo_id: capituloId,
    texto: q.texto,
    opcion_a: q.opcion_a,
    opcion_b: q.opcion_b,
    opcion_c: q.opcion_c,
    opcion_d: q.opcion_d,
    respuesta_correcta: q.respuesta_correcta.toLowerCase(),
    explicacion: q.explicacion,
    pagina_libro: q.pagina_libro,
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

  const { error } = await admin.from('contenido').insert(contentData)

  if (error) {
    console.error('Error creating content:', error)
    return { error: 'Error al crear contenido: ' + error.message }
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
