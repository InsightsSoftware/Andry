-- Make 'pendiente' the default shipment status for every new profile.
--
-- The handle_new_user() trigger inserts a profile row the moment an auth user
-- is created, using only (id, email, nombre_completo). Until now envio_estado
-- fell back to its column default of 'no_aplica', so a brand-new user briefly
-- showed "N/A" before completePurchase upserted 'pendiente' over it.
--
-- Switching the default guarantees that ANY path that creates a profile (the
-- signup trigger, a manual admin insert, etc.) starts as 'pendiente' — the app
-- only creates users after they pay, and every paying user needs the physical
-- material shipped. Existing rows are untouched.
ALTER TABLE profiles
  ALTER COLUMN envio_estado SET DEFAULT 'pendiente';
