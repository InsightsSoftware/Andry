-- Add 'comunidad' to the profiles.rol CHECK constraint
-- Previous constraint: ('estudiante', 'admin', 'root')
-- This was causing UPDATE to fail silently when assigning the 'comunidad' role

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_rol_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_rol_check
  CHECK (rol IN ('estudiante', 'admin', 'root', 'comunidad'));
