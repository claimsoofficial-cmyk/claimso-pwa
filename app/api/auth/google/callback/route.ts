import { createClient } from '@/lib/supabase/server'; // CORRECT: Import our new server client helper
import { NextResponse, type NextRequest } from 'next/server';

/**
 * OAuth Callback Route Handler (Google, etc.)
 *
 * This route handles the server-side authentication handshake with Supabase
 * after a user completes an OAuth flow.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // If a code is present, exchange it for a session
  if (code) {
    // By using our new helper, all the complex cookie handling is abstracted away.
    // This is much cleaner and less error-prone.
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // On successful exchange, the session is now stored in the cookies.
      // We can safely redirect the user to their dashboard.
      // The trigger in our database will have automatically created their profile.
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // If there's no code or an error occurred during the exchange,
  // redirect the user to an error page with a descriptive message.
  console.error('Authentication callback failed:', { code: !!code });
  return NextResponse.redirect(`${origin}/auth/error?error=auth_failed&message=Could not log you in. Please try again.`);
}