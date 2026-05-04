-- Add contact fields to partners table
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS whatsapp       TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_contacto TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS telefono       TEXT DEFAULT NULL;
