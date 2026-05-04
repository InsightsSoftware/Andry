-- Add imagen_url column to preguntas table
-- Allows admins to attach an image to each question (shown in exam + results)
ALTER TABLE preguntas
  ADD COLUMN IF NOT EXISTS imagen_url TEXT DEFAULT NULL;
