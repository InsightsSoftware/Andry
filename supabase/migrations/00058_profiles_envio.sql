-- Track physical shipment status for each user
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS envio_estado TEXT DEFAULT 'no_aplica'
    CHECK (envio_estado IN ('pendiente', 'enviado', 'no_aplica'));

-- When a user already has an active subscription at migration time, mark as pending
UPDATE profiles
SET envio_estado = 'pendiente'
WHERE subscription_status = 'activa'
  AND envio_estado = 'no_aplica';
