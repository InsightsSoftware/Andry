-- Add optional image attachment to community comments
ALTER TABLE comentarios
  ADD COLUMN IF NOT EXISTS imagen_url TEXT DEFAULT NULL;
