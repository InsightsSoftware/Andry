-- Preguntas (question bank)
CREATE TABLE IF NOT EXISTS public.preguntas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capitulo_id UUID NOT NULL REFERENCES public.capitulos(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  opcion_a TEXT NOT NULL,
  opcion_b TEXT NOT NULL,
  opcion_c TEXT NOT NULL,
  opcion_d TEXT NOT NULL,
  respuesta_correcta TEXT NOT NULL CHECK (respuesta_correcta IN ('a', 'b', 'c', 'd')),
  explicacion TEXT NOT NULL DEFAULT '',
  pagina_libro INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_preguntas_capitulo ON public.preguntas(capitulo_id);

-- Sesiones de examen
CREATE TABLE IF NOT EXISTS public.sesiones_examen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('practica', 'examen')),
  capitulo_id UUID REFERENCES public.capitulos(id) ON DELETE SET NULL,
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  total_preguntas INT NOT NULL,
  respuestas_correctas INT NOT NULL DEFAULT 0,
  tiempo_limite_segundos INT,
  tiempo_usado_segundos INT,
  completado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalizado_at TIMESTAMPTZ
);

CREATE INDEX idx_sesiones_user ON public.sesiones_examen(user_id);

-- Respuestas de usuario por sesión
CREATE TABLE IF NOT EXISTS public.respuestas_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id UUID NOT NULL REFERENCES public.sesiones_examen(id) ON DELETE CASCADE,
  pregunta_id UUID NOT NULL REFERENCES public.preguntas(id) ON DELETE CASCADE,
  respuesta_seleccionada TEXT CHECK (respuesta_seleccionada IN ('a', 'b', 'c', 'd')),
  es_correcta BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_respuestas_sesion ON public.respuestas_usuario(sesion_id);

-- RLS for preguntas
ALTER TABLE public.preguntas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers can read questions"
  ON public.preguntas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND subscription_status = 'activa'
    )
  );

CREATE POLICY "Admins full access to questions"
  ON public.preguntas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- RLS for sesiones_examen
ALTER TABLE public.sesiones_examen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own exam sessions"
  ON public.sesiones_examen FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all exam sessions"
  ON public.sesiones_examen FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- RLS for respuestas_usuario
ALTER TABLE public.respuestas_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own answers"
  ON public.respuestas_usuario FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sesiones_examen
      WHERE id = sesion_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sesiones_examen
      WHERE id = sesion_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins read all answers"
  ON public.respuestas_usuario FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );
