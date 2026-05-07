-- Allow videos without chapter association (for "Videos Generales" section)
ALTER TABLE public.contenido ALTER COLUMN capitulo_id DROP NOT NULL;

-- Allow admins to highlight comments as "best answer"
ALTER TABLE public.comentarios ADD COLUMN IF NOT EXISTS destacado BOOLEAN NOT NULL DEFAULT false;
