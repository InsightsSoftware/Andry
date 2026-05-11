-- Likes on posts (likes_comunidad) and comments (likes_comentarios)
-- Composite PKs enforce one like per user per item

-- ── Post likes ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.likes_comunidad (
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id   uuid NOT NULL REFERENCES public.posts_comunidad(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

ALTER TABLE public.likes_comunidad ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON public.likes_comunidad FOR SELECT USING (true);

CREATE POLICY "Auth users can insert own like"
  ON public.likes_comunidad FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own like"
  ON public.likes_comunidad FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS likes_comunidad_post_id_idx
  ON public.likes_comunidad (post_id);

ALTER TABLE public.posts_comunidad
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

-- ── Comment likes ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.likes_comentarios (
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comentario_id  uuid NOT NULL REFERENCES public.comentarios(id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, comentario_id)
);

ALTER TABLE public.likes_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comment likes"
  ON public.likes_comentarios FOR SELECT USING (true);

CREATE POLICY "Auth users can insert own comment like"
  ON public.likes_comentarios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comment like"
  ON public.likes_comentarios FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS likes_comentarios_comentario_id_idx
  ON public.likes_comentarios (comentario_id);

ALTER TABLE public.comentarios
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;
