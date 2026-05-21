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
      'id, email, nombre_completo, rol, subscription_status, subscription_plan, subscription_expires_at, created_at, telefono, direccion, envio_estado, oficio, numero_licencia'
    )
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('Error fetching users:', error)
    return { users: [] }
  }

  return { users: data || [] }
}

export async function updateUserLicencia(userId: string, numero_licencia: string) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ numero_licencia: numero_licencia.trim() || null })
    .eq('id', userId)
  if (error) return { error: error.message }
  return { success: true }
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

export async function updateUserRole(userId: string, rol: 'estudiante' | 'admin' | 'comunidad') {
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

export async function updateEnvioEstado(
  userId: string,
  estado: 'pendiente' | 'enviado' | 'no_aplica'
) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({ envio_estado: estado })
    .eq('id', userId)

  if (error) {
    console.error('Error updating envio_estado:', error)
    return { error: 'Error al actualizar estado de envío' }
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
    .select('id, texto, respuesta_correcta, pagina_libro, capitulo_id, imagen_url, opcion_a_imagen_url, opcion_b_imagen_url, opcion_c_imagen_url, opcion_d_imagen_url, capitulos(nombre, cursos(nombre))')
    .order('capitulo_id', { ascending: true })
    .limit(2000)

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
  }[],
  /** The raw CSV text — if provided, we archive it to Storage + record a
   *  backup row so the admin can re-import it later (undo). */
  csvText?: string,
  csvFilename?: string
) {
  const user = await requireAdmin()
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

  // Best-effort: archive the CSV for restore later. Failures here don't
  // block the upload — the questions are already in.
  if (csvText) {
    // Opportunistic cleanup of >7d backups before adding a new one, so
    // storage stays bounded without any external cron.
    await cleanupOldBackups(admin)

    const timestamp = Date.now()
    const safeName = (csvFilename || 'preguntas.csv')
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 60)
    const path = `csv-backups/${capituloId}/${safeName}_${timestamp}.csv`

    const { error: upErr } = await admin.storage
      .from('contenido-cursos')
      .upload(path, new Blob([csvText], { type: 'text/csv;charset=utf-8' }), {
        contentType: 'text/csv',
        upsert: false,
      })

    if (!upErr) {
      await admin.from('csv_backups').insert({
        capitulo_id: capituloId,
        archivo_path: path,
        archivo_nombre: csvFilename || 'preguntas.csv',
        cantidad_preguntas: rows.length,
        subido_por: user.id,
      })
    } else {
      console.error('CSV backup failed (non-fatal):', upErr.message)
    }
  }

  revalidatePath('/admin/preguntas')
  return { success: true, count: rows.length }
}

// ── CSV backups: list, download, restore, delete ──────────────────

/**
 * How long a backup stays around before it's auto-deleted.
 * If you change this, also update BACKUP_TTL_DAYS in
 * src/components/admin/csv-backups-list.tsx.
 */
const CSV_BACKUP_TTL_DAYS = 7

/**
 * Lazy cleanup: deletes backups older than CSV_BACKUP_TTL_DAYS, both
 * from Storage and from the `csv_backups` table. Runs at the start of
 * every list/create call, so the storage stays bounded without any
 * external cron. Best-effort — errors are logged but don't bubble up.
 */
async function cleanupOldBackups(admin: ReturnType<typeof createAdminClient>) {
  const cutoff = new Date(
    Date.now() - CSV_BACKUP_TTL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()

  const { data: old, error: listErr } = await admin
    .from('csv_backups')
    .select('id, archivo_path')
    .lt('created_at', cutoff)

  if (listErr) {
    console.error('cleanupOldBackups list error:', listErr.message)
    return 0
  }
  if (!old?.length) return 0

  // Bulk delete storage files
  const paths = old.map((b) => b.archivo_path).filter(Boolean) as string[]
  if (paths.length) {
    const { error: remErr } = await admin.storage
      .from('contenido-cursos')
      .remove(paths)
    if (remErr) {
      // Not fatal — storage might have been cleaned already. We still
      // drop the rows below so the UI doesn't show dead entries.
      console.error('cleanupOldBackups storage error:', remErr.message)
    }
  }

  // Bulk delete rows
  const ids = old.map((b) => b.id)
  const { error: delErr } = await admin
    .from('csv_backups')
    .delete()
    .in('id', ids)
  if (delErr) {
    console.error('cleanupOldBackups delete error:', delErr.message)
    return 0
  }

  console.log(`cleanupOldBackups: removed ${ids.length} stale backup(s)`)
  return ids.length
}

export async function listCsvBackups() {
  await requireAdmin()
  const admin = createAdminClient()

  // Run cleanup first so the list doesn't include stale entries
  await cleanupOldBackups(admin)

  const { data, error } = await admin
    .from('csv_backups')
    .select(
      'id, capitulo_id, archivo_nombre, archivo_path, cantidad_preguntas, created_at, capitulos(nombre, numero, cursos(nombre))'
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error listing backups:', error)
    return { backups: [] }
  }
  return { backups: data || [] }
}

export async function getCsvBackupDownloadUrl(backupId: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: backup, error: fetchErr } = await admin
    .from('csv_backups')
    .select('archivo_path, archivo_nombre')
    .eq('id', backupId)
    .single()

  if (fetchErr || !backup) return { error: 'Backup no encontrado' }

  const { data, error } = await admin.storage
    .from('contenido-cursos')
    .createSignedUrl(backup.archivo_path, 600, {
      download: backup.archivo_nombre,
    })

  if (error || !data?.signedUrl) {
    return { error: 'No se pudo generar URL de descarga' }
  }

  return { success: true, url: data.signedUrl }
}

/**
 * Restore from a backup: re-parse the archived CSV and re-insert its
 * questions into the same chapter. By default, preserves existing
 * questions; pass `replace=true` to delete current ones first.
 */
export async function restoreCsvBackup(backupId: string, replace = false) {
  const user = await requireAdmin()
  const admin = createAdminClient()

  const { data: backup, error: fetchErr } = await admin
    .from('csv_backups')
    .select('capitulo_id, archivo_path, archivo_nombre')
    .eq('id', backupId)
    .single()

  if (fetchErr || !backup) return { error: 'Backup no encontrado' }

  // Download the archived CSV
  const { data: fileData, error: dlErr } = await admin.storage
    .from('contenido-cursos')
    .download(backup.archivo_path)

  if (dlErr || !fileData) {
    return { error: 'No se pudo descargar el archivo: ' + dlErr?.message }
  }

  const csvText = await fileData.text()

  const { parseQuestionsCsv } = await import('@/lib/csv-parser')
  const { parsed: questions, errors: parseErrors } = parseQuestionsCsv(csvText)

  if (parseErrors.length > 0 && questions.length === 0) {
    return {
      error: `Error al parsear CSV: ${parseErrors[0]}`,
    }
  }

  if (replace) {
    const { error: delErr } = await admin
      .from('preguntas')
      .delete()
      .eq('capitulo_id', backup.capitulo_id)
    if (delErr) return { error: 'Error limpiando preguntas: ' + delErr.message }
  }

  const rows = questions.map((q) => ({
    capitulo_id: backup.capitulo_id,
    texto: q.texto,
    opcion_a: q.opcion_a,
    opcion_b: q.opcion_b,
    opcion_c: q.opcion_c || '',
    opcion_d: q.opcion_d || '',
    respuesta_correcta: q.respuesta_correcta.toLowerCase(),
    explicacion: q.explicacion || '',
    pagina_libro: q.pagina_libro || 0,
  }))

  const { error: insErr } = await admin.from('preguntas').insert(rows)
  if (insErr) return { error: 'Error insertando: ' + insErr.message }

  // Record the restore as a fresh backup row (so you can undo an undo)
  await admin.from('csv_backups').insert({
    capitulo_id: backup.capitulo_id,
    archivo_path: backup.archivo_path,
    archivo_nombre: `[restaurado] ${backup.archivo_nombre}`,
    cantidad_preguntas: rows.length,
    subido_por: user.id,
  })

  revalidatePath('/admin/preguntas')
  return { success: true, count: rows.length, replaced: replace }
}

export async function deleteCsvBackup(backupId: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: backup } = await admin
    .from('csv_backups')
    .select('archivo_path')
    .eq('id', backupId)
    .single()

  if (backup?.archivo_path) {
    // Best-effort — if the file is already gone we still delete the row
    await admin.storage
      .from('contenido-cursos')
      .remove([backup.archivo_path])
  }

  const { error } = await admin.from('csv_backups').delete().eq('id', backupId)
  if (error) return { error: error.message }

  revalidatePath('/admin/preguntas')
  return { success: true }
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

export async function deleteQuestions(questionIds: string[]) {
  if (!questionIds.length) return { success: true }
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin.from('preguntas').delete().in('id', questionIds)

  if (error) {
    console.error('Error deleting questions:', error)
    return { error: 'Error al eliminar preguntas' }
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

export async function updateChapterImage(capituloId: string, imagenUrl: string | null) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin
    .from('capitulos')
    .update({ imagen_url: imagenUrl })
    .eq('id', capituloId)
  if (error) return { error: error.message }
  revalidatePath('/admin/contenido')
  revalidatePath('/estudio')
  return { success: true }
}

export async function updateCursoImage(cursoId: string, imagenUrl: string | null) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin
    .from('cursos')
    .update({ imagen_url: imagenUrl })
    .eq('id', cursoId)
  if (error) return { error: error.message }
  revalidatePath('/estudio')
  return { success: true }
}

export interface ImagenConfig {
  x: number       // 0–100  horizontal object-position
  y: number       // 0–100  vertical   object-position
  zoom: number    // 1.0–3.0 scale
  textDark: boolean // true → dark text on bright image
}

export async function updateCursoImageConfig(cursoId: string, config: ImagenConfig) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin
    .from('cursos')
    .update({ imagen_config: config })
    .eq('id', cursoId)
  if (error) return { error: error.message }
  revalidatePath('/estudio')
  return { success: true }
}

// ── Question image ─────────────────────────────────────────────────────────────

/**
 * Generate a signed upload URL so the browser can POST an image for a
 * question directly to Supabase Storage without body-size issues.
 */
export async function createQuestionImageUploadUrl(preguntaId: string, filename: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
  const safe = filename
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 40)
  const timestamp = Date.now()
  const path = `preguntas/${preguntaId}/${safe}_${timestamp}.${ext}`

  const { data, error } = await admin.storage
    .from('contenido-cursos')
    .createSignedUploadUrl(path)

  if (error || !data) {
    return { error: `No se pudo generar URL: ${error?.message || 'desconocido'}` }
  }

  return { success: true as const, signedUrl: data.signedUrl, path }
}

/**
 * Persist the public URL (or storage path) of a question's image after
 * the browser finishes the direct-to-storage upload.
 */
export async function updateQuestionImage(preguntaId: string, imagenUrl: string | null) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin
    .from('preguntas')
    .update({ imagen_url: imagenUrl })
    .eq('id', preguntaId)
  if (error) return { error: error.message }
  revalidatePath('/estudio')
  revalidatePath('/practica')
  return { success: true }
}

// ── Option images ───────────────────────────────────────────────────────────────

const OPCION_COL = {
  a: 'opcion_a_imagen_url',
  b: 'opcion_b_imagen_url',
  c: 'opcion_c_imagen_url',
  d: 'opcion_d_imagen_url',
} as const

export async function createOptionImageUploadUrl(
  preguntaId: string,
  opcion: 'a' | 'b' | 'c' | 'd',
  filename: string
) {
  await requireAdmin()
  const admin = createAdminClient()

  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
  const safe = filename.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40)
  const path = `preguntas/${preguntaId}/opcion_${opcion}_${safe}_${Date.now()}.${ext}`

  const { data, error } = await admin.storage
    .from('contenido-cursos')
    .createSignedUploadUrl(path)

  if (error || !data?.signedUrl) {
    return { error: `No se pudo generar URL: ${error?.message || 'desconocido'}` }
  }
  return { success: true as const, signedUrl: data.signedUrl, path }
}

export async function updateOptionImage(
  preguntaId: string,
  opcion: 'a' | 'b' | 'c' | 'd',
  imagenUrl: string | null
) {
  await requireAdmin()
  const admin = createAdminClient()
  const col = OPCION_COL[opcion]
  const { error } = await admin
    .from('preguntas')
    .update({ [col]: imagenUrl })
    .eq('id', preguntaId)
  if (error) return { error: error.message }
  revalidatePath('/estudio')
  revalidatePath('/practica')
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
  capitulo_id: string | null
  tipo: 'pdf' | 'audio' | 'video'
  titulo: string
  descripcion?: string
  archivo_url: string
  duracion_segundos?: number
  orden?: number
  video_categoria_id?: string | null
}) {
  await requireAdmin()
  const admin = createAdminClient()

  // Validate archivo_url. This column stores one of:
  //   - a bare storage path (e.g. "negocios-y-finanzas/capitulo-01/audio/x.mp3")
  //     produced by the bulk uploader / single-file uploader via /api/admin/upload
  //   - an https:// URL (external trusted source)
  //
  // Reject empty strings and explicit http:// (non-TLS external), everything
  // else is passed through — getSignedContentUrl() at read-time handles the
  // bare-path case and treats external URLs correctly.
  const urlOrPath = contentData.archivo_url.trim()
  if (!urlOrPath) {
    return { error: 'Falta el archivo' }
  }
  if (urlOrPath.toLowerCase().startsWith('http://')) {
    return { error: 'Solo se permiten URLs con HTTPS' }
  }
  if (urlOrPath.includes('://')) {
    try {
      const url = new URL(urlOrPath)
      if (url.protocol !== 'https:') {
        return { error: 'Solo se permiten URLs con HTTPS' }
      }
    } catch {
      return { error: 'URL de archivo inválida' }
    }
  }
  // Otherwise treated as a bare storage path — no extra validation here,
  // the API route that produced it has already validated size + MIME type.

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
  revalidatePath('/admin/audios')
  revalidatePath('/admin/videos')
  revalidatePath('/admin/pdfs')
  revalidatePath('/estudio')
  revalidatePath('/estudio/audios')
  revalidatePath('/estudio/videos')
  revalidatePath('/estudio/pdfs')
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
  revalidatePath('/admin/audios')
  revalidatePath('/admin/videos')
  revalidatePath('/estudio/audios')
  revalidatePath('/estudio/videos')
  return { success: true }
}

/**
 * Generate a signed upload URL so the browser can POST the file bytes
 * DIRECTLY to Supabase Storage without round-tripping through a Next.js
 * Route Handler. Bypasses Next.js FormData body-size limits (we were
 * seeing 'Failed to parse body as FormData' for PDFs > 10 MB).
 *
 * Validation that the Route Handler used to do (MIME + size) is now
 * enforced at the STORAGE layer via the bucket config (500 MB cap +
 * MIME whitelist). RLS + this admin check still gate upload access.
 */
export async function createUploadSignedUrl(input: {
  tipo: 'pdf' | 'audio' | 'video' | 'image'
  folder: string
  filename: string
}) {
  await requireAdmin()
  const admin = createAdminClient()

  // Sanitize filename — same rules as the old Route Handler so paths stay
  // consistent with what's already in storage.
  const ext = input.filename.split('.').pop()?.toLowerCase() || 'bin'
  const safe = input.filename
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 60)
  const timestamp = Date.now()
  const jitter = Math.random().toString(36).slice(2, 7)
  const path = `${input.folder}/${safe}_${timestamp}_${jitter}.${ext}`

  const { data, error } = await admin.storage
    .from('contenido-cursos')
    .createSignedUploadUrl(path)

  if (error || !data) {
    console.error('createSignedUploadUrl error:', error)
    return {
      error: `No se pudo generar URL de subida: ${error?.message || 'desconocido'}`,
    }
  }

  return {
    success: true as const,
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
  }
}

/**
 * Bulk-reorder a list of content items. Assigns new orden values in the
 * given sequence (starts at 10, spacing of 10 so future single-item
 * inserts can slot in between without another bulk reorder).
 * Used by the drag-and-drop reordering in MediaManager.
 */
export async function reorderContent(orderedIds: string[]) {
  await requireAdmin()
  const admin = createAdminClient()

  const updates = orderedIds.map((id, idx) => ({ id, orden: (idx + 1) * 10 }))
  for (const u of updates) {
    const { error } = await admin
      .from('contenido')
      .update({ orden: u.orden })
      .eq('id', u.id)
    if (error) {
      console.error('Error reordering content:', error)
      return { error: `Error al reordenar (${u.id}): ${error.message}` }
    }
  }

  revalidatePath('/admin/contenido')
  revalidatePath('/admin/audios')
  revalidatePath('/admin/videos')
  revalidatePath('/admin/pdfs')
  revalidatePath('/estudio')
  revalidatePath('/estudio/audios')
  revalidatePath('/estudio/videos')
  revalidatePath('/estudio/pdfs')
  return { success: true }
}

/**
 * Update an existing content row (title, description, duration, order).
 * Used by the dedicated /admin/audios and /admin/videos managers to let
 * the admin rename auto-seeded "Módulo N" titles to descriptive ones.
 */
export async function updateContent(
  contentId: string,
  patch: {
    titulo?: string
    descripcion?: string | null
    duracion_segundos?: number | null
    orden?: number
  }
) {
  await requireAdmin()
  const admin = createAdminClient()

  // Strip undefined keys so we don't accidentally null out unspecified columns
  const clean: Record<string, unknown> = {}
  if (patch.titulo !== undefined) {
    const t = patch.titulo.trim()
    if (!t) return { error: 'El título no puede estar vacío' }
    clean.titulo = t
  }
  if (patch.descripcion !== undefined) {
    clean.descripcion = patch.descripcion?.trim() || null
  }
  if (patch.duracion_segundos !== undefined) {
    clean.duracion_segundos = patch.duracion_segundos
  }
  if (patch.orden !== undefined) {
    clean.orden = patch.orden
  }

  const { error } = await admin
    .from('contenido')
    .update(clean)
    .eq('id', contentId)

  if (error) {
    console.error('Error updating content:', error)
    return { error: 'Error al actualizar contenido' }
  }

  revalidatePath('/admin/contenido')
  revalidatePath('/admin/audios')
  revalidatePath('/admin/videos')
  revalidatePath('/estudio/audios')
  revalidatePath('/estudio/videos')
  return { success: true }
}

/**
 * Fetches ALL content of a given type across every course/chapter PLUS
 * every active curso + capítulo. Used by the dedicated /admin/audios,
 * /admin/videos and /admin/pdfs managers so:
 *   - the list shows all existing content items of that type
 *   - the upload dropdowns always show every available chapter, even
 *     ones that don't yet have content of this type (otherwise the
 *     first upload becomes impossible — the dropdown is empty).
 */
export async function getAllContentByType(tipo: 'audio' | 'video' | 'pdf') {
  await requireAdmin()
  const admin = createAdminClient()

  const [contentRes, cursosRes, capitulosRes] = await Promise.all([
    admin
      .from('contenido')
      .select(
        'id, capitulo_id, tipo, titulo, descripcion, archivo_url, duracion_segundos, orden, created_at'
      )
      .eq('tipo', tipo)
      .order('created_at', { ascending: false }),
    admin
      .from('cursos')
      .select('id, nombre, slug')
      .eq('activo', true)
      .order('orden'),
    admin
      .from('capitulos')
      .select('id, curso_id, numero, nombre')
      .order('numero'),
  ])

  if (contentRes.error) {
    console.error('Error fetching content by type:', contentRes.error)
    return { items: [], capitulos: [], cursos: [] }
  }

  return {
    items: contentRes.data || [],
    capitulos: capitulosRes.data || [],
    cursos: cursosRes.data || [],
  }
}

// ── Payments ───────────────────────────────────────────────────────

export async function renameCurso(id: string, nombre: string) {
  await requireAdmin()
  if (!nombre.trim()) return { error: 'El nombre no puede estar vacío' }
  const admin = createAdminClient()
  const { error } = await admin.from('cursos').update({ nombre: nombre.trim() }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/estudio')
  return { success: true }
}

export async function renameCapitulo(id: string, nombre: string) {
  await requireAdmin()
  if (!nombre.trim()) return { error: 'El nombre no puede estar vacío' }
  const admin = createAdminClient()
  const { error } = await admin.from('capitulos').update({ nombre: nombre.trim() }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/estudio')
  return { success: true }
}

export async function inviteUser(email: string, rol: 'comunidad' | 'estudiante' = 'comunidad') {
  await requireAdmin()
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { rol },
  })
  if (error) return { error: error.message }
  return { success: true, userId: data.user?.id }
}

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
