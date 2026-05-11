-- Allow admins to pin posts so they appear at the top of the community feed

ALTER TABLE public.posts_comunidad
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS posts_comunidad_pinned_idx
  ON public.posts_comunidad (pinned DESC, created_at DESC);
