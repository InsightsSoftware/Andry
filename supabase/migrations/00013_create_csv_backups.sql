-- ═══════════════════════════════════════════════════════════════
-- CSV Backups — copia del archivo original de preguntas subido,
-- con metadata para poder restaurarlo.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.csv_backups (
  id uuid primary key default gen_random_uuid(),
  capitulo_id uuid not null references public.capitulos(id) on delete cascade,
  archivo_path text not null,
  archivo_nombre text not null,
  cantidad_preguntas int not null default 0,
  subido_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_csv_backups_capitulo
  on public.csv_backups (capitulo_id, created_at desc);

-- ═══════════════════════════════════════════════════════════════
-- RLS — solo admin/root pueden ver y manipular
-- ═══════════════════════════════════════════════════════════════

alter table public.csv_backups enable row level security;

drop policy if exists "csv_backups: admin read" on public.csv_backups;
create policy "csv_backups: admin read"
on public.csv_backups for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol in ('admin', 'root')
  )
);

drop policy if exists "csv_backups: admin insert" on public.csv_backups;
create policy "csv_backups: admin insert"
on public.csv_backups for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol in ('admin', 'root')
  )
);

drop policy if exists "csv_backups: admin delete" on public.csv_backups;
create policy "csv_backups: admin delete"
on public.csv_backups for delete
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.rol in ('admin', 'root')
  )
);
