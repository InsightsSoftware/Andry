-- ═══════════════════════════════════════════════════════════════
-- Partners (Aliados) — empresas recomendadas que aparecen como
-- videos dentro de la plataforma. Modelo de monetización secundario:
-- Andry cobra a los partners por aparecer.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique,
  descripcion text not null,
  categoria text not null check (categoria in (
    'creditos',
    'contabilidad',
    'software',
    'seguros',
    'legal',
    'flota',
    'marketing',
    'otros'
  )),
  logo_url text,
  video_url text not null,
  sitio_web text,
  cta_text text not null default 'Contactar',
  orden int not null default 0,
  destacado boolean not null default false,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_partners_activo on public.partners (activo, orden);
create index if not exists idx_partners_categoria on public.partners (categoria);

-- updated_at trigger
create or replace function public.touch_partners_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists partners_touch_updated_at on public.partners;
create trigger partners_touch_updated_at
before update on public.partners
for each row execute function public.touch_partners_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════

alter table public.partners enable row level security;

-- Any authenticated user with an active subscription can read active
-- partners. Gates are already handled by the proxy middleware, but we
-- enforce it at the DB level too.
drop policy if exists "Partners: subscribers can read active" on public.partners;
create policy "Partners: subscribers can read active"
on public.partners for select
to authenticated
using (
  activo = true
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (
        p.rol in ('admin', 'root')
        or p.subscription_status = 'activa'
      )
  )
);

-- Admins/root can see all (including inactive) and manage everything.
drop policy if exists "Partners: admin read all" on public.partners;
create policy "Partners: admin read all"
on public.partners for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol in ('admin', 'root')
  )
);

drop policy if exists "Partners: admin insert" on public.partners;
create policy "Partners: admin insert"
on public.partners for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol in ('admin', 'root')
  )
);

drop policy if exists "Partners: admin update" on public.partners;
create policy "Partners: admin update"
on public.partners for update
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

drop policy if exists "Partners: admin delete" on public.partners;
create policy "Partners: admin delete"
on public.partners for delete
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol in ('admin', 'root')
  )
);
