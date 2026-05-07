-- Allow image MIME types in the contenido-cursos bucket
-- Needed for category cover images in the video categories system
UPDATE storage.buckets
SET allowed_mime_types = array_cat(
  COALESCE(allowed_mime_types, ARRAY[]::text[]),
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/jpg']::text[]
)
WHERE id = 'contenido-cursos'
  AND NOT (COALESCE(allowed_mime_types, ARRAY[]::text[]) @> ARRAY['image/png']::text[]);
