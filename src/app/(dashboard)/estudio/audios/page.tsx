import { createClient } from '@/lib/supabase/server'
import { getSignedContentUrl } from '@/lib/supabase/storage'
import { AudioPicker, type AudioCurso, type AudioCapitulo } from '@/components/estudio/audio-picker'

export const metadata = { title: 'Audios' }

export default async function AudiosPage() {
  const supabase = await createClient()

  // Check admin role
  const { data: { user } } = await supabase.auth.getUser()
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('rol').eq('id', user.id).single()
    isAdmin = profile?.rol === 'admin' || profile?.rol === 'root'
  }

  // ── Fetch data ────────────────────────────────────────────────────────────

  // Active courses in order
  const { data: cursos } = await supabase
    .from('cursos')
    .select('id, nombre, slug')
    .eq('activo', true)
    .order('orden')

  const cursoIds = (cursos || []).map((c) => c.id)

  const { data: capitulos } = cursoIds.length
    ? await supabase
        .from('capitulos')
        .select('id, curso_id, numero, nombre')
        .in('curso_id', cursoIds)
        .order('numero')
    : { data: [] }

  const capituloIds = (capitulos || []).map((c) => c.id)

  const { data: audios } = capituloIds.length
    ? await supabase
        .from('contenido')
        .select('*')
        .eq('tipo', 'audio')
        .in('capitulo_id', capituloIds)
        .order('orden')
    : { data: [] }

  // Progress (user already fetched above)

  const audioIds = (audios || []).map((a) => a.id)
  const { data: progreso } =
    user && audioIds.length
      ? await supabase
          .from('progreso_estudio')
          .select('contenido_id, progreso_porcentaje, ultima_posicion, completado')
          .eq('user_id', user.id)
          .in('contenido_id', audioIds)
      : { data: [] }

  const progresoMap = new Map(
    (progreso || []).map((p) => [p.contenido_id, p])
  )

  // ── Build signed URLs ─────────────────────────────────────────────────────
  const urlMap = new Map<string, string>()
  await Promise.all(
    (audios || []).map(async (a) => {
      try {
        const url = await getSignedContentUrl(supabase, a.archivo_url, 3600)
        urlMap.set(a.id, url)
      } catch {
        // skip broken entries
      }
    })
  )

  // ── Nest: cursos → capitulos → tracks ─────────────────────────────────────
  const capMap = new Map((capitulos || []).map((c) => [c.id, c]))

  // Group audios by capitulo
  const audiosByCapitulo = new Map<string, typeof audios>()
  for (const a of audios || []) {
    const arr = audiosByCapitulo.get(a.capitulo_id) ?? []
    arr.push(a)
    audiosByCapitulo.set(a.capitulo_id, arr)
  }

  // Build nested structure
  const cursosConCapitulos: AudioCurso[] = (cursos || []).map((curso) => {
    const caps = (capitulos || []).filter((c) => c.curso_id === curso.id)

    const audioCapitulos: AudioCapitulo[] = caps
      .map((cap) => {
        const rawTracks = audiosByCapitulo.get(cap.id) ?? []
        const tracks = rawTracks
          .sort((a, b) => a.orden - b.orden)
          .map((a) => {
            const prog = progresoMap.get(a.id) ?? null
            return {
              id: a.id,
              titulo: a.titulo,
              codigo: deriveCodigo(a.archivo_url),
              orden: a.orden,
              url: urlMap.get(a.id) ?? '',
              duracionSegundos: a.duracion_segundos,
              capituloId: cap.id,
              capituloNumero: cap.numero,
              capituloNombre: cap.nombre,
              cursoId: curso.id,
              cursoNombre: curso.nombre,
              progresoPct: prog?.progreso_porcentaje ?? 0,
              completado: prog?.completado ?? false,
            }
          })

        return { id: cap.id, numero: cap.numero, nombre: cap.nombre, tracks }
      })
      // Only show chapters that have at least one audio
      .filter((cap) => cap.tracks.length > 0)

    return { id: curso.id, nombre: curso.nombre, capitulos: audioCapitulos }
  })
  // Only show courses that have at least one chapter with audio
  .filter((c) => c.capitulos.length > 0)

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Audios
      </h1>
      <p className="mb-6 text-neutral-500 dark:text-neutral-400">
        {cursosConCapitulos.length === 0
          ? 'Sin audios disponibles todavía.'
          : cursosConCapitulos.length === 1
            ? cursosConCapitulos[0].nombre
            : `${cursosConCapitulos.length} cursos disponibles`}
      </p>

      {cursosConCapitulos.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <p className="text-neutral-500 dark:text-neutral-400">
            Los audios se están preparando. Pronto tendrás contenido disponible.
          </p>
        </div>
      ) : (
        <AudioPicker cursos={cursosConCapitulos} isAdmin={isAdmin} />
      )}
    </div>
  )
}

function deriveCodigo(archivoUrl: string): string {
  const name = archivoUrl.split('/').pop() ?? ''
  const base = name.replace(/\.(mp3|wav|m4a|ogg|aac)$/i, '')
  return base.toUpperCase().replace(/_/g, ' ')
}
