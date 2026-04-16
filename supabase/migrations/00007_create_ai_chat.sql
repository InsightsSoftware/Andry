-- Conversaciones de IA
CREATE TABLE IF NOT EXISTS public.conversaciones_ai (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER conversaciones_updated_at
  BEFORE UPDATE ON public.conversaciones_ai
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Mensajes de IA
CREATE TABLE IF NOT EXISTS public.mensajes_ai (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversacion_id UUID NOT NULL REFERENCES public.conversaciones_ai(id) ON DELETE CASCADE,
  rol TEXT NOT NULL CHECK (rol IN ('user', 'assistant')),
  contenido TEXT NOT NULL,
  paginas_referencia INT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mensajes_conversacion ON public.mensajes_ai(conversacion_id);

-- RLS
ALTER TABLE public.conversaciones_ai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes_ai ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own conversations"
  ON public.conversaciones_ai FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own messages"
  ON public.mensajes_ai FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.conversaciones_ai
      WHERE id = conversacion_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversaciones_ai
      WHERE id = conversacion_id AND user_id = auth.uid()
    )
  );
