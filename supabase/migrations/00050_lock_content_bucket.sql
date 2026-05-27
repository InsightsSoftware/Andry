-- =======================================================================
-- 00050: Cierra el agujero de seguridad del bucket `contenido-cursos`.
--
-- ANTES: el bucket era public=true. Cualquiera con la URL del archivo
--        podia bajar el video/PDF sin pagar suscripcion. El middleware de
--        Next.js solo protegia rutas de la app, no las URLs publicas
--        del bucket.
--
-- DESPUES: bucket privado + RLS en storage.objects que solo deja a users
--          con suscripcion activa (o admin/mentor) generar signed URLs.
--          El TTL del signed URL lo controla el codigo (default 5 min).
-- =======================================================================

-- 1) Hacer el bucket privado
update storage.buckets
   set public = false
 where id = 'contenido-cursos';

-- 2) Borrar policies viejas si existen
drop policy if exists "subscribers can read content" on storage.objects;
drop policy if exists "admins read all content"     on storage.objects;
drop policy if exists "service_role writes content" on storage.objects;

-- 3) Suscriptores activos pueden SELECT (necesario para createSignedUrl)
create policy "subscribers can read content"
  on storage.objects for select
  using (
    bucket_id = 'contenido-cursos'
    and exists (
      select 1
        from public.profiles p
       where p.id = auth.uid()
         and p.subscription_status = 'activa'
         and (p.subscription_expires_at is null
              or p.subscription_expires_at > now())
    )
  );

-- 4) Admins, root y mentores siempre pueden leer
create policy "admins read all content"
  on storage.objects for select
  using (
    bucket_id = 'contenido-cursos'
    and exists (
      select 1
        from public.profiles p
       where p.id = auth.uid()
         and p.rol in ('admin', 'root', 'mentor')
    )
  );

-- 5) Solo admins/root pueden subir/modificar/borrar (writes via service_role
--    bypasean RLS, asi que el bulk-upload server-side sigue funcionando).
create policy "admins write content"
  on storage.objects for all
  using (
    bucket_id = 'contenido-cursos'
    and exists (
      select 1
        from public.profiles p
       where p.id = auth.uid()
         and p.rol in ('admin', 'root', 'mentor')
    )
  )
  with check (
    bucket_id = 'contenido-cursos'
    and exists (
      select 1
        from public.profiles p
       where p.id = auth.uid()
         and p.rol in ('admin', 'root', 'mentor')
    )
  );
