import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'

// Define public API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/webhooks',
  '/api/health',
  // Add other public routes as needed
]

// Helper function to check if an API route is public
function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))
}

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
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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
    const isPublicRoute = isPublicApiRoute(pathname)
    
    if (!isPublicRoute && !isLoggedIn) {
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
    if (!isPublicRoute && isLoggedIn) {
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
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https: wss:; frame-src 'self' https:;"
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