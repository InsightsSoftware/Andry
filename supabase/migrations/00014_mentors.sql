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

-- NOTE: oficio is free text (English license names like "General Contractor", etc.)
-- The original restrictive check constraint was removed because the registration form
-- uses full English license type names, not the short Spanish identifiers.
-- Drop the constraint if it somehow exists from a previous run.
alter table public.profiles drop constraint if exists profiles_oficio_check;

create index if not exists idx_profiles_es_mentor
  on public.profiles (es_mentor) where es_mentor = true;
