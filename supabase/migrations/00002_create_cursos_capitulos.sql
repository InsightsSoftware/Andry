-- Cursos (courses/modules)
CREATE TABLE IF NOT EXISTS public.cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descripcion TEXT NOT NULL DEFAULT '',
  imagen_url TEXT,
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Capitulos (chapters within courses)
CREATE TABLE IF NOT EXISTS public.capitulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  numero INT NOT NULL,
  pagina_inicio INT NOT NULL DEFAULT 0,
  pagina_fin INT NOT NULL DEFAULT 0,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(curso_id, numero)
);

CREATE INDEX idx_capitulos_curso ON public.capitulos(curso_id);

-- RLS for cursos
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;

-- Active subscribers can read active courses
CREATE POLICY "Subscribers can read active courses"
  ON public.cursos FOR SELECT
  USING (
    activo = true
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND subscription_status = 'activa'
    )
  );

-- Admins have full access to courses
CREATE POLICY "Admins full access to courses"
  ON public.cursos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- RLS for capitulos
ALTER TABLE public.capitulos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers can read chapters"
  ON public.capitulos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND subscription_status = 'activa'
    )
  );

CREATE POLICY "Admins full access to chapters"
  ON public.capitulos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );
