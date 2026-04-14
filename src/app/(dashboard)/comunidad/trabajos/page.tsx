import { createClient } from '@/lib/supabase/server'
import { CommunityPage } from '@/components/comunidad/community-page'

export const metadata = { title: 'Comunidad - Trabajos' }

export default async function TrabajosPage() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('posts_comunidad')
    .select(
      `
      id, titulo, contenido, tipo, ubicacion, presupuesto, resuelto, created_at,
      profiles:user_id ( nombre_completo ),
      comentarios ( id, contenido, created_at, profiles:user_id ( nombre_completo ) )
    `
    )
    .eq('tipo', 'trabajo')
    .order('created_at', { ascending: false })
    .limit(50)

  return <CommunityPage tipo="trabajo" posts={(posts as never[]) || []} />
}
