-- Pagos (payment records)
CREATE TABLE IF NOT EXISTS public.pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT NOT NULL,
  stripe_checkout_session_id TEXT,
  monto_centavos INT NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'usd',
  plan TEXT NOT NULL CHECK (plan IN ('basico', 'premium')),
  estado TEXT NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pagos_user ON public.pagos(user_id);
CREATE INDEX idx_pagos_stripe ON public.pagos(stripe_payment_intent_id);

-- RLS for pagos
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

-- Users can read own payments
CREATE POLICY "Users can read own payments"
  ON public.pagos FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all payments
CREATE POLICY "Admins can read all payments"
  ON public.pagos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Only service role can insert/update payments (via webhook)
-- No INSERT/UPDATE policies for regular users — payments are managed server-side
