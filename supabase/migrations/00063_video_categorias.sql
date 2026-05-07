-- Create video categories table
CREATE TABLE video_categorias (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT        NOT NULL,
  descripcion TEXT,
  imagen_url  TEXT,
  orden       INTEGER     NOT NULL DEFAULT 0,
  activo      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE video_categorias ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active categories
CREATE POLICY "video_categorias_read" ON video_categorias
  FOR SELECT TO authenticated
  USING (activo = TRUE);

-- Service role has full access (admin panel)
CREATE POLICY "video_categorias_admin" ON video_categorias
  FOR ALL TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Add nullable category FK to contenido
ALTER TABLE contenido
  ADD COLUMN IF NOT EXISTS video_categoria_id UUID
    REFERENCES video_categorias(id)
    ON DELETE SET NULL;
