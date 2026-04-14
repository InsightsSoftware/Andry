import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that require authentication
const PROTECTED_ROUTES = ['/panel', '/estudio', '/ia', '/comunidad', '/perfil']
// Routes that require admin role
const ADMIN_ROUTES = ['/admin']
// Routes only for unauthenticated users
const AUTH_ROUTES = ['/login', '/registro', '/recuperar']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Update Supabase session and get user
  let user = null
  let supabase = null
  let response = NextResponse.next({ request })

  try {
    const session = await updateSession(request)
    user = session.user
    supabase = session.supabase
    response = session.supabaseResponse
  } catch {
    // Supabase not configured yet — allow public routes, block protected
  }

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  // Redirect authenticated users away from auth pages
  if (user && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone()
    url.pathname = '/panel'
    return NextResponse.redirect(url)
  }

  // Check if route requires authentication
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  )
  const isAdmin = ADMIN_ROUTES.some((route) => pathname.startsWith(route))

  if (isProtected || isAdmin) {
    // Not authenticated — redirect to login
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // Get user profile for subscription and role check
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol, subscription_status, subscription_plan')
      .eq('id', user.id)
      .single()

    // Check subscription for protected routes
    if (isProtected && profile?.subscription_status !== 'activa') {
      const url = request.nextUrl.clone()
      url.pathname = '/precios'
      url.searchParams.set('reason', 'subscription')
      return NextResponse.redirect(url)
    }

    // Check admin role
    if (isAdmin && profile?.rol !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/panel'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - api/webhooks (webhooks need raw body)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/webhooks).*)',
  ],
}
