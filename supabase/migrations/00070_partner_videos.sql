-- ═══════════════════════════════════════════════════════════════
-- Partner Videos — varios videos por aliado (empresa).
-- La card del grid sigue mostrando un preview; al abrir el modal
-- estilo YouTube se ven todos los videos de esa empresa: el
-- principal grande (orden más bajo) + el resto en la lista lateral.
--
-- partners.video_url se mantiene como fallback / preview de la card.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.partner_videos (
  id          uuid primary key default gen_random_uuid(),
  partner_id  uuid not null references public.partners(id) on delete cascade,
  titulo      text not null,
  descripcion text,
  video_url   text not null,            -- YouTube URL o path de Supabase storage
  orden       int  not null default 0,  -- 0 = video principal
  created_at  timestamptz not null default now()
);

create index if not exists idx_partner_videos_partner
  on public.partner_videos (partner_id, orden);

-- ═══════════════════════════════════════════════════════════════
-- RLS — mismo patrón que public.partners
-- ═══════════════════════════════════════════════════════════════

alter table public.partner_videos enable row level security;

-- Suscriptores activos (o admin/root) pueden leer videos de aliados activos.
drop policy if exists "PartnerVideos: subscribers can read" on public.partner_videos;
create policy "PartnerVideos: subscribers can read"
on public.partner_videos for select
to authenticated
using (
  exists (
    select 1 from public.partners pa
    where pa.id = partner_videos.partner_id and pa.activo = true
  )
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.rol in ('admin', 'root') or p.subscription_status = 'activa')
  )
);

-- Admin/root ven todo (incluyendo de aliados inactivos).
drop policy if exists "PartnerVideos: admin read all" on public.partner_videos;
create policy "PartnerVideos: admin read all"
on public.partner_videos for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol in ('admin', 'root')
  )
);

drop policy if exists "PartnerVideos: admin insert" on public.partner_videos;
create policy "PartnerVideos: admin insert"
on public.partner_videos for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol in ('admin', 'root')
  )
);

drop policy if exists "PartnerVideos: admin update" on public.partner_videos;
create policy "PartnerVideos: admin update"
on public.partner_videos for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol in ('admin', 'root')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol in ('admin', 'root')
  )
);

drop policy if exists "PartnerVideos: admin delete" on public.partner_videos;
create policy "PartnerVideos: admin delete"
on public.partner_videos for delete
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol in ('admin', 'root')
  )
);
