import type { PartnerCategoria } from '@/types/database'

/**
 * User-facing labels for partner categories. Kept in a non-server-action
 * module so it can be imported from client components (server action
 * files can only export async functions — all other exports are stripped
 * from the client bundle).
 */
export const CATEGORIA_LABELS: Record<PartnerCategoria, string> = {
  creditos: 'Créditos comerciales',
  contabilidad: 'Contabilidad',
  software: 'Software / automatización',
  seguros: 'Seguros',
  legal: 'Legal',
  flota: 'Flota / taxis',
  marketing: 'Marketing',
  otros: 'Otros',
}

/** Short labels for filter pills and tight UI slots. */
export const CATEGORIA_LABELS_SHORT: Record<PartnerCategoria, string> = {
  creditos: 'Créditos',
  contabilidad: 'Contabilidad',
  software: 'Software',
  seguros: 'Seguros',
  legal: 'Legal',
  flota: 'Flota',
  marketing: 'Marketing',
  otros: 'Otros',
}
