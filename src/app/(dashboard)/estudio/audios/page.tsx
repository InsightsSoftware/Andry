import { createClient } from '@/lib/supabase/server'
import { getSignedContentUrl } from '@/lib/supabase/storage'
import { AudiosPlaylist } from '@/components/estudio/audios-playlist'

export const metadata = { title: 'Audios' }

/**
 * Playlist view: 2-col desktop layout (track list + persistent player).
 * Data fetched server-side, passed fully hydrated to the client.
 *
 * All audios are fetched with context (capítulo, curso) and each gets a
 * pre-computed public URL so the player can just set src and play
 * without round-trips.
 */
export default async function AudiosPage() {
  const supabase = await createClient()

  const { data: audios } = await supabase
    .from('contenido')
    .select('*')
    .eq('tipo', 'audio')
    .order('orden')

  const capituloIds = Array.from(
    new Set((audios || []).map((a) => a.capitulo_id))
  )
  const { data: capitulos } = capituloIds.length
    ? await supabase.from('capitulos').select('*').in('id', capituloIds)
    : { data: [] }

  const cursoIds = Array.from(
    new Set((capitulos || []).map((c) => c.curso_id))
  )
  const { data: cursos } = cursoIds.length
    ? await supabase.from('cursos').select('*').in('id', cursoIds)
    : { data: [] }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const audioIds = (audios || []).map((a) => a.id)
  const { data: progreso } =
    user && audioIds.length
      ? await supabase
          .from('progreso_estudio')
          .select('contenido_id, progreso_porcentaje, ultima_posicion, completado')
          .eq('user_id', user.id)
          .in('contenido_id', audioIds)
      : { data: [] }

  const capituloMap = new Map((capitulos || []).map((c) => [c.id, c]))
  const cursoMap = new Map((cursos || []).map((c) => [c.id, c]))
  const progresoMap = new Map(
    (progreso || []).map((p) => [p.contenido_id, p])
  )

  // Build flat list of tracks with full context + public URL
  const tracks = await Promise.all(
    (audios || []).map(async (a) => {
      const cap = capituloMap.get(a.capitulo_id) ?? null
      const curso = cap ? cursoMap.get(cap.curso_id) ?? null : null
      const prog = progresoMap.get(a.id) ?? null
      const url = await getSignedContentUrl(supabase, a.archivo_url, 3600)
      return {
        id: a.id,
        titulo: a.titulo,
        codigo: deriveCodigo(a.archivo_url),
        orden: a.orden,
        url,
        duracionSegundos: a.duracion_segundos,
        capituloId: cap?.id ?? null,
        capituloNumero: cap?.numero ?? 0,
        capituloNombre: cap?.nombre ?? 'Sin capítulo',
        cursoId: curso?.id ?? null,
        cursoNombre: curso?.nombre ?? 'Sin curso',
        progresoPct: prog?.progreso_porcentaje ?? 0,
        posicionInicial: prog?.ultima_posicion ?? '0',
        completado: prog?.completado ?? false,
      }
    })
  )

  // Sort: chapter ascending → orden ascending
  tracks.sort((a, b) => {
    if (a.capituloNumero !== b.capituloNumero)
      return a.capituloNumero - b.capituloNumero
    return a.orden - b.orden
  })

  // Group chapters for the selector
  const capitulosList = Array.from(
    new Map(
      tracks
        .filter((t) => t.capituloId)
        .map((t) => [
          t.capituloId,
          {
            id: t.capituloId!,
            numero: t.capituloNumero,
            nombre: t.capituloNombre,
          },
        ])
    ).values()
  ).sort((a, b) => a.numero - b.numero)

  return <AudiosPlaylist tracks={tracks} capitulos={capitulosList} />
}

/**
 * Derives a short display code like "CAP-01-MOD-03" from a storage path.
 * Used as the small-caps subtitle above each track title.
 */
function deriveCodigo(archivoUrl: string): string {
  const name = archivoUrl.split('/').pop() ?? ''
  const base = name.replace(/\.(mp3|wav|m4a|ogg|aac)$/i, '')
  return base.toUpperCase().replace(/_/g, ' ')
}
