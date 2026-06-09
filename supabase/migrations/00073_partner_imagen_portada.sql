-- Imagen de portada opcional para la card del aliado.
-- Si está cargada, la card la usa como miniatura/banner; si no, se cae al
-- frame del video (thumbnail de YouTube o primer frame del MP4).
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS imagen_portada TEXT;
