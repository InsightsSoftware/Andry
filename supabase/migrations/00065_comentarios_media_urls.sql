-- Upgrade comments to support multiple media images (like posts)
-- Keep imagen_url for backward-compat with existing comments
ALTER TABLE comentarios
  ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT NULL;
