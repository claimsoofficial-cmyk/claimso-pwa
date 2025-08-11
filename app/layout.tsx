import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AuthenticatedNavbar from '@/components/shared/AuthenticatedNavbar';

// ==============================================================================
// AUTHENTICATED LAYOUT COMPONENT
// ==============================================================================

/**
 * Authenticated Layout - Wrapper for all authenticated app pages
 * 
 * This layout ensures:
 * - User authentication is checked server-side
 * - Shared navigation is included
 * - Unauthenticated users are redirected
 * - User profile data is passed to navbar
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ==============================================================================
  // SERVER-SIDE AUTHENTICATION CHECK
  // ==============================================================================
  
  // Get cookies for session management
  const cookieStore = cookies();

  // Create server-side Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Server components are read-only, so we don't set cookies here
        },
        remove(name: string, options: any) {
          // Server components are read-only, so we don't remove cookies here
        },
      },
    }
  );

  // Check for authenticated user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // Redirect unauthenticated users to homepage
  if (authError || !user) {
    console.log('No authenticated user found in layout, redirecting to homepage');
    redirect('/');
  }

  // Fetch user profile for navbar
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single();

  // ==============================================================================
  // RENDER AUTHENTICATED LAYOUT
  // ==============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Authenticated Navigation */}
      <AuthenticatedNavbar user={user} profile={profile} />
      
      {/* Page Content */}
      <main>
        {children}
      </main>
    </div>
  );
}