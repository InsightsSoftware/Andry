-- Add imagen_url column to cursos (if not already present)
ALTER TABLE public.cursos
  ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- Public bucket for course cover images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cursos-portadas',
  'cursos-portadas',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view (public bucket)
CREATE POLICY "Public read cursos-portadas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cursos-portadas');

-- Only admins can upload / update / delete
CREATE POLICY "Admin insert cursos-portadas"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cursos-portadas'
    AND (auth.jwt() ->> 'role') IN ('admin', 'root')
  );

CREATE POLICY "Admin update cursos-portadas"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'cursos-portadas'
    AND (auth.jwt() ->> 'role') IN ('admin', 'root')
  );

CREATE POLICY "Admin delete cursos-portadas"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'cursos-portadas'
    AND (auth.jwt() ->> 'role') IN ('admin', 'root')
  );
