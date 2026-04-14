-- Fix: RLS infinite recursion in profiles policies
-- Problem: Policies on profiles table were querying profiles table inline,
-- causing infinite recursion (error 42P17).
-- Solution: SECURITY DEFINER helper functions bypass RLS for admin/subscription checks.

-- Helper functions (SECURITY DEFINER = runs as owner, bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_active_subscription()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND subscription_status = 'activa'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_premium()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND subscription_plan = 'premium'
    AND subscription_status = 'activa'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT rol FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_subscription_status()
RETURNS TEXT AS $$
  SELECT subscription_status FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_subscription_plan()
RETURNS TEXT AS $$
  SELECT subscription_plan FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Fix profiles policies (remove self-referencing queries)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND rol = public.get_my_role()
    AND subscription_status = public.get_my_subscription_status()
    AND subscription_plan = public.get_my_subscription_plan()
  );

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- Fix cursos policies
DROP POLICY IF EXISTS "Subscribers can read active courses" ON public.cursos;
DROP POLICY IF EXISTS "Admins full access to courses" ON public.cursos;
CREATE POLICY "Subscribers can read active courses"
  ON public.cursos FOR SELECT
  USING (activo = true AND public.has_active_subscription());
CREATE POLICY "Admins full access to courses"
  ON public.cursos FOR ALL
  USING (public.is_admin());

-- Fix capitulos policies
DROP POLICY IF EXISTS "Subscribers can read chapters" ON public.capitulos;
DROP POLICY IF EXISTS "Admins full access to chapters" ON public.capitulos;
CREATE POLICY "Subscribers can read chapters"
  ON public.capitulos FOR SELECT
  USING (public.has_active_subscription());
CREATE POLICY "Admins full access to chapters"
  ON public.capitulos FOR ALL
  USING (public.is_admin());

-- Fix contenido policies
DROP POLICY IF EXISTS "Subscribers can read content" ON public.contenido;
DROP POLICY IF EXISTS "Admins full access to content" ON public.contenido;
CREATE POLICY "Subscribers can read content"
  ON public.contenido FOR SELECT
  USING (public.has_active_subscription());
CREATE POLICY "Admins full access to content"
  ON public.contenido FOR ALL
  USING (public.is_admin());

-- Fix progreso policies
DROP POLICY IF EXISTS "Admins can read all progress" ON public.progreso_estudio;
CREATE POLICY "Admins can read all progress"
  ON public.progreso_estudio FOR SELECT
  USING (public.is_admin());

-- Fix preguntas policies
DROP POLICY IF EXISTS "Subscribers can read questions" ON public.preguntas;
DROP POLICY IF EXISTS "Admins full access to questions" ON public.preguntas;
CREATE POLICY "Subscribers can read questions"
  ON public.preguntas FOR SELECT
  USING (public.has_active_subscription());
CREATE POLICY "Admins full access to questions"
  ON public.preguntas FOR ALL
  USING (public.is_admin());

-- Fix sesiones_examen policies
DROP POLICY IF EXISTS "Admins read all exam sessions" ON public.sesiones_examen;
CREATE POLICY "Admins read all exam sessions"
  ON public.sesiones_examen FOR SELECT
  USING (public.is_admin());

-- Fix respuestas_usuario policies
DROP POLICY IF EXISTS "Admins read all answers" ON public.respuestas_usuario;
CREATE POLICY "Admins read all answers"
  ON public.respuestas_usuario FOR SELECT
  USING (public.is_admin());

-- Fix posts_comunidad policies
DROP POLICY IF EXISTS "Subscribers can read posts" ON public.posts_comunidad;
DROP POLICY IF EXISTS "Premium or owner can read job posts" ON public.posts_comunidad;
DROP POLICY IF EXISTS "Subscribers can create posts" ON public.posts_comunidad;
DROP POLICY IF EXISTS "Admins full access to posts" ON public.posts_comunidad;
CREATE POLICY "Subscribers can read posts"
  ON public.posts_comunidad FOR SELECT
  USING (public.has_active_subscription());
CREATE POLICY "Premium or owner can read job posts"
  ON public.posts_comunidad FOR SELECT
  USING (tipo = 'trabajo' AND (user_id = auth.uid() OR public.has_premium()));
CREATE POLICY "Subscribers can create posts"
  ON public.posts_comunidad FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_active_subscription());
CREATE POLICY "Admins full access to posts"
  ON public.posts_comunidad FOR ALL
  USING (public.is_admin());

-- Fix comentarios policies
DROP POLICY IF EXISTS "Subscribers can read comments" ON public.comentarios;
DROP POLICY IF EXISTS "Subscribers can create comments" ON public.comentarios;
DROP POLICY IF EXISTS "Admins full access to comments" ON public.comentarios;
CREATE POLICY "Subscribers can read comments"
  ON public.comentarios FOR SELECT
  USING (public.has_active_subscription());
CREATE POLICY "Subscribers can create comments"
  ON public.comentarios FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_active_subscription());
CREATE POLICY "Admins full access to comments"
  ON public.comentarios FOR ALL
  USING (public.is_admin());

-- Fix pagos policies
DROP POLICY IF EXISTS "Admins can read all payments" ON public.pagos;
CREATE POLICY "Admins can read all payments"
  ON public.pagos FOR SELECT
  USING (public.is_admin());
