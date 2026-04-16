-- ============================================
-- Storage Buckets for course content
-- ============================================

-- Create the bucket for course content (PDFs, audio, video)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contenido-cursos',
  'contenido-cursos',
  true,  -- public read access (authenticated users need subscription, handled at app level)
  524288000, -- 500MB max per file (for large videos)
  ARRAY[
    'application/pdf',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/mp4',
    'audio/x-m4a',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo'
  ]
) ON CONFLICT (id) DO NOTHING;

-- ── RLS Policies ──────────────────────────────────────────────────

-- Anyone can READ files (content is gated at the app level by subscription)
CREATE POLICY "Public read access for contenido-cursos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'contenido-cursos');

-- Only admins can UPLOAD files
CREATE POLICY "Admin upload for contenido-cursos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'contenido-cursos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND rol = 'admin'
    )
  );

-- Only admins can UPDATE files
CREATE POLICY "Admin update for contenido-cursos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'contenido-cursos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND rol = 'admin'
    )
  );

-- Only admins can DELETE files
CREATE POLICY "Admin delete for contenido-cursos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'contenido-cursos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND rol = 'admin'
    )
  );
