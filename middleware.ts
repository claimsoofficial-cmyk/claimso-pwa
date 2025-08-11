import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl
  const isLoggedIn = !!session && !error

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth',
    '/auth/login',
    '/auth/register',
    '/auth/error',
    '/auth/callback',
    '/privacy',
    '/terms',
    '/about',
    '/contact'
  ]

  // Define public API routes that don't require authentication
  const publicApiRoutes = [
    '/api/auth/callback',
    '/api/auth/amazon/callback',
    '/api/health',
    '/api/public'
  ]

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // Check if the current path is a public API route
  const isPublicApiRoute = publicApiRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // Handle dashboard routes - redirect to homepage if not authenticated
  if (pathname.startsWith('/dashboard')) {
    if (!isLoggedIn) {
      console.log('Unauthenticated user attempted to access dashboard:', pathname)
      
      // Redirect to homepage with a query parameter indicating login is required
      const redirectUrl = new URL('/', request.url)
      redirectUrl.searchParams.set('auth_required', 'true')
      redirectUrl.searchParams.set('redirect_to', pathname)
      
      return NextResponse.redirect(redirectUrl)
    }
    
    // User is authenticated, allow access to dashboard
    console.log('Authenticated user accessing dashboard:', pathname, 'User ID:', session?.user?.id)
  }

  // Handle API routes - return 401 for unauthenticated requests (except public routes)
  if (pathname.startsWith('/api/')) {
    if (!isPublicApiRoute && !isLoggedIn) {
      console.log('Unauthenticated API request blocked:', pathname)
      
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required',
          error: {
            code: 'UNAUTHENTICATED',
            details: 'You must be logged in to access this API endpoint'
          }
        },
        { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer',
            'Cache-Control': 'no-store'
          }
        }
      )
    }
    
    // Log successful API access for monitoring
    if (!isPublicApiRoute && isLoggedIn) {
      console.log('Authenticated API request:', pathname, 'User ID:', session?.user?.id)
    }
  }

  // Handle auth pages - redirect logged-in users away from auth pages
  if (pathname.startsWith('/auth/') && isLoggedIn) {
    // Don't redirect from callback or error pages
    if (!pathname.includes('/callback') && !pathname.includes('/error')) {
      console.log('Logged-in user redirected from auth page:', pathname)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Additional security headers for all responses
  const response = supabaseResponse
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Add CSP header for additional security (adjust as needed for your app)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-src 'self' https:;"
  )

  // Log session refresh for debugging (in development only)
  if (process.env.NODE_ENV === 'development' && session) {
    console.log('Session refreshed for user:', session.user?.email, 'Expires:', session.expires_at)
  }

  return response
}

// Configure which routes the middleware should run on
export const config = {
  /*
   * This matcher defines all the routes that will run through our middleware.
   * We are using an "allow-list" approach for maximum security. Any new route
   * will be public by default until it is explicitly added here.
   */
  matcher: [
    // --- Application Routes ---
    // Protect the core authenticated user experience
    '/', // Protect the homepage to redirect logged-in users to the dashboard
    '/dashboard',
    '/dashboard/:path*',
    '/settings/:path*', // Assuming a future settings page

    // --- API Routes ---
    // Protect API routes that handle sensitive user data or actions.
    // NOTE: Auth and webhook routes are INTENTIONALLY excluded as they have their own security.
    '/api/import/:path*',
    '/api/resolution/:path*',
    '/api/products/:path*', // Assuming a future API for managing products
  ],
};