-- Add imagen_url column to capitulos
ALTER TABLE public.capitulos
  ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- Public bucket for chapter cover images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'capitulos-portadas',
  'capitulos-portadas',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view (public bucket)
CREATE POLICY "Public read capitulos-portadas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'capitulos-portadas');

-- Only admins can upload / update / delete
CREATE POLICY "Admin insert capitulos-portadas"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'capitulos-portadas'
    AND (auth.jwt() ->> 'role') IN ('admin', 'root')
  );

CREATE POLICY "Admin update capitulos-portadas"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'capitulos-portadas'
    AND (auth.jwt() ->> 'role') IN ('admin', 'root')
  );

CREATE POLICY "Admin delete capitulos-portadas"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'capitulos-portadas'
    AND (auth.jwt() ->> 'role') IN ('admin', 'root')
  );
