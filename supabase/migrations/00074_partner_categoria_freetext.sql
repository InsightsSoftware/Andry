-- Categoría de aliados pasa a TEXTO LIBRE (el admin escribe lo que quiera).
-- Antes era un enum fijo via CHECK; lo sacamos.
ALTER TABLE public.partners DROP CONSTRAINT IF EXISTS partners_categoria_check;

-- Renombrar los valores viejos (enum en minúscula) a etiquetas legibles,
-- así los aliados existentes se ven bien con el nuevo esquema de texto libre.
UPDATE public.partners SET categoria = 'Créditos comerciales'      WHERE categoria = 'creditos';
UPDATE public.partners SET categoria = 'Contabilidad'              WHERE categoria = 'contabilidad';
UPDATE public.partners SET categoria = 'Software / automatización' WHERE categoria = 'software';
UPDATE public.partners SET categoria = 'Seguros'                   WHERE categoria = 'seguros';
UPDATE public.partners SET categoria = 'Legal'                     WHERE categoria = 'legal';
UPDATE public.partners SET categoria = 'Flota'                     WHERE categoria = 'flota';
UPDATE public.partners SET categoria = 'Marketing'                 WHERE categoria = 'marketing';
UPDATE public.partners SET categoria = 'Otros'                     WHERE categoria = 'otros';
