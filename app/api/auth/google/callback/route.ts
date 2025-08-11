import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * OAuth Callback Route Handler
 * 
 * This route handles the server-side authentication handshake with Supabase
 * after a user completes OAuth authentication (e.g., Google sign-in).
 * 
 * Flow:
 * 1. User clicks "Continue with Google" in ConnectionModal
 * 2. Supabase redirects to this callback with an auth code
 * 3. We exchange the code for a session server-side
 * 4. Redirect user to dashboard on success, or error page on failure
 */
export async function GET(request: NextRequest) {
  try {
    // Extract the authorization code from the URL search parameters
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    
    // Log the callback attempt for debugging (remove in production)
    console.log('Auth callback received:', { 
      hasCode: !!code,
      origin,
      searchParams: Object.fromEntries(searchParams)
    });

    // If no code is present, redirect to error page
    if (!code) {
      console.warn('No authorization code found in callback URL');
      return NextResponse.redirect(
        new URL('/auth/auth-code-error?error=no_code', origin)
      );
    }

    // Get the cookies from the request for session management
    const cookieStore = cookies();

    // Create a server-side Supabase client
    // This client has the necessary permissions for exchangeCodeForSession
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // Cookie handling functions for server-side auth
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Handle cookie setting errors gracefully
              console.error('Failed to set cookie:', error);
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // Handle cookie removal errors gracefully
              console.error('Failed to remove cookie:', error);
            }
          },
        },
      }
    );

    // Exchange the authorization code for a session
    // This is the critical server-to-server handshake
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    // Handle exchange errors
    if (exchangeError) {
      console.error('Failed to exchange code for session:', exchangeError);
      return NextResponse.redirect(
        new URL(`/auth/auth-code-error?error=${encodeURIComponent(exchangeError.message)}`, origin)
      );
    }

    // Verify we have a valid session and user
    if (!sessionData?.session || !sessionData?.user) {
      console.error('No session or user found after code exchange');
      return NextResponse.redirect(
        new URL('/auth/auth-code-error?error=invalid_session', origin)
      );
    }

    // Log successful authentication (remove user details in production)
    console.log('Authentication successful:', {
      userId: sessionData.user.id,
      email: sessionData.user.email,
      provider: sessionData.user.app_metadata?.provider
    });

    // Successful authentication - redirect to dashboard
    // The session cookies are automatically set by the Supabase client
    return NextResponse.redirect(new URL('/dashboard', origin));

  } catch (error) {
    // Handle any unexpected errors during the auth process
    console.error('Unexpected error in auth callback:', error);
    
    // Get origin for redirect even if URL parsing failed
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    return NextResponse.redirect(
      new URL('/auth/auth-code-error?error=unexpected_error', origin)
    );
  }
}

/**
 * Optional: Handle OPTIONS requests for CORS if needed
 * This is typically not required for OAuth callbacks, but included for completeness
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}