-- ═══════════════════════════════════════════════════════════════
-- SECURITY AUDIT — Y Exam Prep
-- ═══════════════════════════════════════════════════════════════
-- Ejecutá este archivo completo en el SQL Editor de Supabase.
-- Cada sección te da un reporte de qué está bien y qué no.
--
-- INTERPRETACIÓN:
--   ✅ OK      → está bien, seguir
--   ⚠️  REVISAR → funciona pero conviene mirar
--   ❌ CRÍTICO → tenés que arreglar antes de producción
-- ═══════════════════════════════════════════════════════════════


-- ─── 1. ¿Todas las tablas tienen RLS activo? ──────────────────
-- Esto es lo MÁS importante. Sin RLS activo, cualquiera con la
-- anon key puede leer/escribir lo que quiera.

SELECT
  schemaname,
  tablename,
  CASE
    WHEN rowsecurity = true THEN '✅ RLS ACTIVO'
    ELSE '❌ CRÍTICO — RLS DESACTIVADO'
  END AS status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity ASC, tablename;


-- ─── 2. ¿Cuántas policies tiene cada tabla? ────────────────────
-- Tablas con 0 policies + RLS activo = NADIE puede leer/escribir
-- Tablas con 0 policies + RLS inactivo = TODOS pueden (MAL)

SELECT
  t.tablename,
  CASE WHEN t.rowsecurity THEN '✅' ELSE '❌' END AS rls,
  COUNT(p.policyname) AS num_policies,
  CASE
    WHEN t.rowsecurity AND COUNT(p.policyname) = 0 THEN '⚠️  RLS on pero sin policies — NADIE accede'
    WHEN NOT t.rowsecurity AND COUNT(p.policyname) = 0 THEN '❌ CRÍTICO — acceso público total'
    WHEN t.rowsecurity AND COUNT(p.policyname) > 0 THEN '✅ OK'
    ELSE '⚠️  RLS off pero hay policies (ignoradas)'
  END AS status
FROM pg_tables t
LEFT JOIN pg_policies p
  ON p.tablename = t.tablename AND p.schemaname = t.schemaname
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY num_policies ASC;


-- ─── 3. Detalle de cada policy (para auditoría profunda) ──────
-- Mirá si alguna tiene `USING (true)` sin filtro por user_id o
-- rol — eso suele ser un hueco de seguridad.

SELECT
  tablename,
  policyname,
  cmd AS operation,
  CASE
    WHEN qual = 'true' AND cmd = 'SELECT' THEN '⚠️  SELECT público — OK solo si es contenido público'
    WHEN qual = 'true' THEN '❌ CRÍTICO — operación sin filtro'
    ELSE '✅ con filtro'
  END AS security_check,
  qual AS using_clause,
  with_check AS with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;


-- ─── 4. ¿Hay tablas de auth expuestas al cliente? ─────────────
-- auth.users NO debería ser accesible desde el anon role.
-- Si ves algo, es agujero grave.

SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type,
  CASE
    WHEN grantee IN ('anon', 'authenticated') AND table_schema = 'auth'
    THEN '❌ CRÍTICO — auth.* accesible desde cliente'
    ELSE '✅ OK'
  END AS status
FROM information_schema.role_table_grants
WHERE table_schema = 'auth'
  AND grantee IN ('anon', 'authenticated', 'public');


-- ─── 5. Storage buckets — ¿son privados o públicos? ────────────
-- Buckets públicos: contenido accesible por URL directa sin auth.
-- Para un LMS pago, casi todos deberían ser PRIVADOS.

SELECT
  id AS bucket_name,
  CASE
    WHEN public = true THEN '⚠️  PÚBLICO — accesible sin auth'
    ELSE '✅ PRIVADO'
  END AS visibility,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
ORDER BY public DESC;


-- ─── 6. Storage policies — ¿hay policies en los buckets? ──────
-- Si un bucket es privado pero no tiene policies, NADIE
-- puede subir/bajar archivos (ni siquiera tu app).

SELECT
  bucket_id,
  COUNT(*) AS num_policies,
  CASE
    WHEN COUNT(*) = 0 THEN '⚠️  REVISAR — sin policies, inaccesible'
    ELSE '✅ OK'
  END AS status
FROM storage.objects
FULL OUTER JOIN (
  SELECT DISTINCT
    regexp_replace(qual::text, '.*bucket_id\s*=\s*''([^'']+)''.*', '\1') AS bucket_id
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects'
) AS buckets_with_policies
  ON storage.objects.bucket_id = buckets_with_policies.bucket_id
WHERE storage.objects.bucket_id IS NOT NULL
GROUP BY storage.objects.bucket_id;


-- ─── 7. Configuración del rol `profiles.rol` ──────────────────
-- Verificar que no haya usuarios con rol null o inválido.

SELECT
  rol,
  COUNT(*) AS cantidad,
  CASE
    WHEN rol IS NULL THEN '⚠️  REVISAR — usuarios sin rol'
    WHEN rol NOT IN ('estudiante', 'admin', 'root') THEN '❌ rol inválido'
    ELSE '✅ OK'
  END AS status
FROM public.profiles
GROUP BY rol;


-- ─── 8. ¿Hay usuarios con subscription_status raros? ──────────
-- Solo debería haber: 'inactiva', 'activa', 'cancelada', 'expirada'.

SELECT
  subscription_status,
  subscription_plan,
  COUNT(*) AS cantidad
FROM public.profiles
GROUP BY subscription_status, subscription_plan
ORDER BY cantidad DESC;


-- ─── 9. Email confirmations habilitadas? ──────────────────────
-- Si no, cualquiera puede registrarse con email ajeno.
-- Esto se configura en Auth → Settings, pero verificamos indirecto:

SELECT
  COUNT(*) FILTER (WHERE email_confirmed_at IS NULL) AS sin_confirmar,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) AS confirmados,
  CASE
    WHEN COUNT(*) FILTER (WHERE email_confirmed_at IS NULL) > 0
    THEN '⚠️  REVISAR — hay usuarios sin email confirmado'
    ELSE '✅ OK — todos confirmados'
  END AS status
FROM auth.users;


-- ─── 10. Resumen final ─────────────────────────────────────────

SELECT
  'RLS cobertura' AS check_name,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true)::text
  || ' de '
  || (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public')::text
  || ' tablas con RLS' AS valor
UNION ALL
SELECT
  'Total policies',
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public')::text
UNION ALL
SELECT
  'Buckets privados',
  (SELECT COUNT(*) FROM storage.buckets WHERE public = false)::text
  || ' de '
  || (SELECT COUNT(*) FROM storage.buckets)::text
UNION ALL
SELECT
  'Total usuarios',
  (SELECT COUNT(*) FROM auth.users)::text
UNION ALL
SELECT
  'Admins',
  (SELECT COUNT(*) FROM public.profiles WHERE rol IN ('admin', 'root'))::text;
