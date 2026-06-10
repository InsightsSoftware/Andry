import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CommunityPage } from '@/components/comunidad/community-page'
import { CommunityStats } from '@/components/comunidad/community-stats'
import { Skeleton, CardSkeleton } from '@/components/ui/skeleton'

export const metadata = { title: 'Comunidad - Trabajos' }

// ── Skeleton fallbacks ─────────────────────────────────────────────────────

function StatsFallback() {
  return (
    <div className="mb-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950 p-4">
      <div className="mb-3 grid grid-cols-3 gap-2 sm:gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="h-7 w-52" />
    </div>
  )
}

function PostsFallback() {
  return (
    <div className="space-y-4">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  )
}

// ── Async streaming components ─────────────────────────────────────────────

async function TrabajosStats() {
  return <CommunityStats />
}

async function TrabajosContent() {
  const supabase = await createClient()
  const admin = createAdminClient()

  // getSession() reads cookies locally (no network round-trip) so we can
  // extract the userId and fire all three queries in parallel below.
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id

  const [
    { data: posts },
    { data: { user } },
    profileResult,
  ] = await Promise.all([
    admin
      .from('posts_comunidad')
      .select(
        `
        id, user_id, titulo, contenido, tipo, ubicacion, presupuesto, resuelto, created_at, media_urls, pinned, likes_count, resolucion_comment_id,
        profiles:user_id ( nombre_completo, avatar_url, es_mentor, oficio, ubicacion, rol ),
        comentarios!comentarios_post_id_fkey ( id, user_id, parent_id, contenido, imagen_url, media_urls, created_at, destacado, likes_count,
          profiles:user_id ( nombre_completo, avatar_url, es_mentor, oficio, ubicacion, rol )
        )
      `
      )
      .eq('tipo', 'trabajo')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.auth.getUser(),
    userId
      ? supabase.from('profiles').select('rol, nombre_completo, avatar_url').eq('id', userId).single()
      : Promise.resolve({ data: null, error: null }),
  ])

  const profile = profileResult.data as { rol?: string; nombre_completo?: string; avatar_url?: string } | null
  const isAdmin = profile?.rol === 'admin' || profile?.rol === 'root'

  // Fetch which posts/comments the current user already liked so the UI
  // shows the correct liked state on first render (not just after interaction).
  const postIds = (posts || []).map((p: { id: string }) => p.id)
  const commentIds = (posts || []).flatMap((p: { comentarios?: { id: string }[] }) =>
    (p.comentarios || []).map((c) => c.id)
  )

  const [likedPostsResult, likedCommentsResult] = userId && postIds.length > 0
    ? await Promise.all([
        supabase.from('likes_comunidad').select('post_id').eq('user_id', userId).in('post_id', postIds),
        commentIds.length > 0
          ? supabase.from('likes_comentarios').select('comentario_id').eq('user_id', userId).in('comentario_id', commentIds)
          : Promise.resolve({ data: [] }),
      ])
    : [{ data: [] }, { data: [] }]

  const likedPostIds = ((likedPostsResult.data || []) as { post_id: string }[]).map((l) => l.post_id)
  const likedCommentIds = ((likedCommentsResult.data || []) as { comentario_id: string }[]).map((l) => l.comentario_id)

  return (
    <CommunityPage
      tipo="trabajo"
      posts={(posts as never[]) || []}
      currentUserId={user?.id}
      currentUserName={profile?.nombre_completo ?? undefined}
      currentUserAvatar={profile?.avatar_url ?? undefined}
      isAdmin={isAdmin}
      likedPostIds={likedPostIds}
      likedCommentIds={likedCommentIds}
    />
  )
}

// ── Page shell — renders immediately, streams content in ───────────────────

export default function TrabajosPage() {
  return (
    <>
      <Suspense fallback={<StatsFallback />}>
        <TrabajosStats />
      </Suspense>
      <Suspense fallback={<PostsFallback />}>
        <TrabajosContent />
      </Suspense>
    </>
  )
}
