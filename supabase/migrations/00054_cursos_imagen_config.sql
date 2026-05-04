-- Add imagen_config column to cursos table
-- Stores image pan/zoom/text-contrast settings set by admins
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS imagen_config JSONB DEFAULT NULL;

COMMENT ON COLUMN cursos.imagen_config IS
  'Admin-configured image display settings: { x: 0-100, y: 0-100, zoom: 1.0-3.0, textDark: bool }';
