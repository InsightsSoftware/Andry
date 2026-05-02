import { createClient } from '@/lib/supabase/server'
import { CommunityPage } from '@/components/comunidad/community-page'
import { CommunityStats } from '@/components/comunidad/community-stats'

export const metadata = { title: 'Comunidad - Trabajos' }

export default async function TrabajosPage() {
  const supabase = await createClient()

  const [
    { data: posts },
    { data: { user } },
  ] = await Promise.all([
    supabase
      .from('posts_comunidad')
      .select(
        `
        id, user_id, titulo, contenido, tipo, ubicacion, presupuesto, resuelto, created_at,
        profiles:user_id ( nombre_completo, es_mentor, oficio, ubicacion ),
        comentarios ( id, contenido, created_at, profiles:user_id ( nombre_completo, es_mentor, oficio, ubicacion ) )
      `
      )
      .eq('tipo', 'trabajo')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.auth.getUser(),
  ])

  // Check admin role
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.rol === 'admin' || profile?.rol === 'root'
  }

  return (
    <>
      <CommunityStats />
      <CommunityPage
        tipo="trabajo"
        posts={(posts as never[]) || []}
        currentUserId={user?.id}
        isAdmin={isAdmin}
      />
    </>
  )
}
