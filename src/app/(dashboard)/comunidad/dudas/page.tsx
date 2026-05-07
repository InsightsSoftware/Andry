import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CommunityPage } from '@/components/comunidad/community-page'
import { CommunityStats } from '@/components/comunidad/community-stats'

export const metadata = { title: 'Comunidad - Dudas' }

export default async function DudasPage() {
  const supabase = await createClient()
  // Use admin client for the posts query so profiles of ALL users (not just
  // the current user) are returned even if RLS restricts profile reads.
  const admin = createAdminClient()

  const [
    { data: posts },
    { data: { user } },
  ] = await Promise.all([
    admin
      .from('posts_comunidad')
      .select(
        `
        id, user_id, titulo, contenido, tipo, ubicacion, presupuesto, resuelto, resolucion_comment_id, created_at, media_urls,
        profiles:user_id ( nombre_completo, avatar_url, es_mentor, oficio, ubicacion ),
        comentarios ( id, contenido, imagen_url, media_urls, created_at, destacado, profiles:user_id ( nombre_completo, avatar_url, es_mentor, oficio, ubicacion ) )
      `
      )
      .eq('tipo', 'duda')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.auth.getUser(),
  ])

  // Check admin role + fetch profile for avatar
  let isAdmin = false
  let currentUser: { nombre_completo: string; avatar_url?: string | null } | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol, nombre_completo, avatar_url')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.rol === 'admin' || profile?.rol === 'root'
    if (profile?.nombre_completo) {
      currentUser = { nombre_completo: profile.nombre_completo, avatar_url: profile.avatar_url }
    }
  }

  return (
    <>
      <CommunityStats currentUser={currentUser} />
      <CommunityPage
        tipo="duda"
        posts={(posts as never[]) || []}
        currentUserId={user?.id}
        isAdmin={isAdmin}
      />
    </>
  )
}
