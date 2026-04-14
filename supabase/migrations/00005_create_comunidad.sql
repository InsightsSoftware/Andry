-- Posts de comunidad
CREATE TABLE IF NOT EXISTS public.posts_comunidad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('duda', 'trabajo')),
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  capitulo_id UUID REFERENCES public.capitulos(id) ON DELETE SET NULL,
  ubicacion TEXT,
  presupuesto TEXT,
  resuelto BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_tipo ON public.posts_comunidad(tipo);
CREATE INDEX idx_posts_user ON public.posts_comunidad(user_id);
CREATE INDEX idx_posts_capitulo ON public.posts_comunidad(capitulo_id);

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON public.posts_comunidad
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Comentarios
CREATE TABLE IF NOT EXISTS public.comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts_comunidad(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  parent_id UUID REFERENCES public.comentarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comentarios_post ON public.comentarios(post_id);

-- RLS for posts_comunidad
ALTER TABLE public.posts_comunidad ENABLE ROW LEVEL SECURITY;

-- All authenticated subscribers can read posts
CREATE POLICY "Subscribers can read posts"
  ON public.posts_comunidad FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND subscription_status = 'activa'
    )
  );

-- Job posts require premium for non-owners
CREATE POLICY "Premium or owner can read job posts"
  ON public.posts_comunidad FOR SELECT
  USING (
    tipo = 'trabajo'
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND subscription_plan = 'premium'
        AND subscription_status = 'activa'
      )
    )
  );

-- Users can create posts
CREATE POLICY "Subscribers can create posts"
  ON public.posts_comunidad FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND subscription_status = 'activa'
    )
  );

-- Users can update own posts
CREATE POLICY "Users can update own posts"
  ON public.posts_comunidad FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete own posts
CREATE POLICY "Users can delete own posts"
  ON public.posts_comunidad FOR DELETE
  USING (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins full access to posts"
  ON public.posts_comunidad FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- RLS for comentarios
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers can read comments"
  ON public.comentarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND subscription_status = 'activa'
    )
  );

CREATE POLICY "Subscribers can create comments"
  ON public.comentarios FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND subscription_status = 'activa'
    )
  );

CREATE POLICY "Users can delete own comments"
  ON public.comentarios FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins full access to comments"
  ON public.comentarios FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );
