-- ═══════════════════════════════════════════════════════════════
-- Mentors — perfiles que Andry (y socios) controlan para aparecer
-- como contratistas graduados que responden dudas y comparten tips.
-- Da la sensación de comunidad activa sin hacer astroturfing: son
-- voces OFICIALES de Y Exam Prep etiquetadas como "Mentor".
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists es_mentor boolean not null default false,
  add column if not exists oficio text,
  add column if not exists ubicacion text;

-- Constraint: oficio solo puede ser uno de los conocidos (o null)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_oficio_check'
  ) then
    alter table public.profiles
      add constraint profiles_oficio_check
      check (
        oficio is null or oficio in (
          'electricidad',
          'plomeria',
          'hvac',
          'general',
          'finanzas',
          'legal',
          'estructura',
          'techos',
          'pintura'
        )
      );
  end if;
end $$;

create index if not exists idx_profiles_es_mentor
  on public.profiles (es_mentor) where es_mentor = true;
