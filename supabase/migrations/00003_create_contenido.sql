-- Contenido (content items: PDFs, audio, video)
CREATE TABLE IF NOT EXISTS public.contenido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capitulo_id UUID NOT NULL REFERENCES public.capitulos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('pdf', 'audio', 'video')),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  archivo_url TEXT NOT NULL,
  duracion_segundos INT,
  orden INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contenido_capitulo ON public.contenido(capitulo_id);

-- Progreso de estudio
CREATE TABLE IF NOT EXISTS public.progreso_estudio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contenido_id UUID NOT NULL REFERENCES public.contenido(id) ON DELETE CASCADE,
  progreso_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progreso_porcentaje >= 0 AND progreso_porcentaje <= 100),
  ultima_posicion TEXT,
  completado BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, contenido_id)
);

CREATE TRIGGER progreso_updated_at
  BEFORE UPDATE ON public.progreso_estudio
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS for contenido
ALTER TABLE public.contenido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers can read content"
  ON public.contenido FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND subscription_status = 'activa'
    )
  );

CREATE POLICY "Admins full access to content"
  ON public.contenido FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- RLS for progreso_estudio
ALTER TABLE public.progreso_estudio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress"
  ON public.progreso_estudio FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all progress"
  ON public.progreso_estudio FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );
