-- Link a post to the comment that resolved it
ALTER TABLE posts_comunidad
  ADD COLUMN IF NOT EXISTS resolucion_comment_id UUID REFERENCES comentarios(id) ON DELETE SET NULL;
