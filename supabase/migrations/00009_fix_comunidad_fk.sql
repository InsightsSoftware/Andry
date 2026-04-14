-- Fix: PostgREST can't find relationship between posts_comunidad/comentarios and profiles
-- Problem: user_id references auth.users(id) but queries join to profiles(id).
-- PostgREST needs an explicit FK to public.profiles for the join syntax to work.
-- PostgreSQL allows multiple FKs on the same column.

ALTER TABLE public.posts_comunidad
ADD CONSTRAINT fk_posts_comunidad_profiles
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.comentarios
ADD CONSTRAINT fk_comentarios_profiles
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
