-- Add likes_comunidad table and likes_count column on posts
-- Composite PK (user_id, post_id) enforces one like per user per post

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

-- Index for quick per-post count lookups
CREATE INDEX IF NOT EXISTS likes_comunidad_post_id_idx
  ON public.likes_comunidad (post_id);

-- Denormalised counter to avoid expensive COUNT(*) on every render
ALTER TABLE public.posts_comunidad
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;
