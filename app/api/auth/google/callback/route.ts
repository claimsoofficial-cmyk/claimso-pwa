import { createClient } from '@/lib/supabase/server'; // CORRECT: Import our new server client helper
import { NextResponse, type NextRequest } from 'next/server';

/**
 * OAuth Callback Route Handler (Google, etc.)
 *
 * This route handles the server-side authentication handshake with Supabase
 * after a user completes an OAuth flow.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('OAuth callback received:', { 
      code: code ? 'present' : 'missing', 
      error, 
      errorDescription,
      origin 
    });

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        `${origin}/auth/error?error=${error}&message=${encodeURIComponent(errorDescription || 'Authentication failed')}`
      );
    }

    // If a code is present, exchange it for a session
    if (code) {
      try {
        const supabase = await createClient();
        console.log('Exchanging code for session...');
        
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('Session exchange error:', exchangeError);
          return NextResponse.redirect(
            `${origin}/auth/error?error=exchange_failed&message=${encodeURIComponent('Failed to complete authentication')}`
          );
        }

        if (data.user) {
          console.log('Authentication successful for user:', data.user.email);
          // On successful exchange, the session is now stored in the cookies.
          // We can safely redirect the user to their dashboard.
          return NextResponse.redirect(`${origin}/dashboard`);
        } else {
          console.error('No user data received after exchange');
          return NextResponse.redirect(
            `${origin}/auth/error?error=no_user&message=${encodeURIComponent('No user data received')}`
          );
        }
      } catch (exchangeError) {
        console.error('Unexpected error during session exchange:', exchangeError);
        return NextResponse.redirect(
          `${origin}/auth/error?error=unexpected&message=${encodeURIComponent('An unexpected error occurred')}`
        );
      }
    }

    // If there's no code, redirect to error page
    console.error('No authentication code received');
    return NextResponse.redirect(
      `${origin}/auth/error?error=no_code&message=${encodeURIComponent('No authentication code received')}`
    );
  } catch (error) {
    console.error('OAuth callback route error:', error);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/auth/error?error=route_error&message=${encodeURIComponent('Route error occurred')}`
    );
  }
}