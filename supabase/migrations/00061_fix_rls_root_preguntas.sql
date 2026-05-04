-- Fix: include root role in all preguntas/sesiones/respuestas policies
-- root was missing from admin checks, causing queries to return empty via user client

-- preguntas
DROP POLICY IF EXISTS "Admins full access to questions" ON public.preguntas;
CREATE POLICY "Admins full access to questions"
  ON public.preguntas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol IN ('admin', 'root')
    )
  );

-- sesiones_examen
DROP POLICY IF EXISTS "Admins read all exam sessions" ON public.sesiones_examen;
CREATE POLICY "Admins read all exam sessions"
  ON public.sesiones_examen FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol IN ('admin', 'root')
    )
  );

-- respuestas_usuario
DROP POLICY IF EXISTS "Admins read all answers" ON public.respuestas_usuario;
CREATE POLICY "Admins read all answers"
  ON public.respuestas_usuario FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol IN ('admin', 'root')
    )
  );
