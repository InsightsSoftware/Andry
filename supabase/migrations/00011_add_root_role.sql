-- Add 'root' role to the profiles table CHECK constraint
-- Root users can delete other users and have full system access

-- Drop and recreate the CHECK constraint to include 'root'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_rol_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_rol_check CHECK (rol IN ('estudiante', 'admin', 'root'));

-- Update RLS policies to include root role alongside admin

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Recreate with root included
CREATE POLICY "Admins and root can read all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol IN ('admin', 'root')
    )
  );

CREATE POLICY "Admins and root can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol IN ('admin', 'root')
    )
  );

-- Root can delete profiles (for user deletion)
CREATE POLICY "Root can delete profiles"
  ON public.profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'root'
    )
  );

-- Promote the root user by email
UPDATE public.profiles SET rol = 'root' WHERE email = 'valentintoledo970@gmail.com';
