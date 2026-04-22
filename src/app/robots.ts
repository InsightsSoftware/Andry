import type { MetadataRoute } from 'next'

const SITE_URL = 'https://andry.onrender.com'

/**
 * Tells bots what they can crawl. Public marketing pages are open;
 * anything under /panel, /estudio, /comunidad, /aliados, /perfil,
 * /admin, and /api is off-limits (auth gated anyway, but this avoids
 * wasted crawl budget and leaked preview snippets).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/panel/',
          '/estudio/',
          '/comunidad/',
          '/aliados/',
          '/perfil/',
          '/admin/',
          '/api/',
          '/pago/simular',
          '/pago/exito',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
