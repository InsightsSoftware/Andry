-- Lista de espera: correos de interesados cuando los cupos están agotados.
-- Se inserta desde un Server Action con el service role (admin client), por eso
-- RLS queda activado SIN policies: nadie puede leer/escribir desde el cliente,
-- y el admin client bypasea RLS. Andry consulta/exporta desde el dashboard.
CREATE TABLE IF NOT EXISTS public.lista_espera (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Un mismo correo no se anota dos veces (case-insensitive).
CREATE UNIQUE INDEX IF NOT EXISTS lista_espera_email_unique
  ON public.lista_espera (lower(email));

ALTER TABLE public.lista_espera ENABLE ROW LEVEL SECURITY;
