-- Add media_urls column to posts_comunidad
ALTER TABLE posts_comunidad
  ADD COLUMN IF NOT EXISTS media_urls TEXT[] NOT NULL DEFAULT '{}';

-- Create comunidad-media storage bucket (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comunidad-media',
  'comunidad-media',
  true,
  104857600, -- 100 MB max per file
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/quicktime', 'video/webm', 'video/mov'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS: public read
CREATE POLICY "Public read comunidad-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'comunidad-media');

-- RLS: authenticated users can upload to their own folder
CREATE POLICY "Auth users upload comunidad-media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'comunidad-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: users can delete their own uploads
CREATE POLICY "Auth users delete own comunidad-media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'comunidad-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
