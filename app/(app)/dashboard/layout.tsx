import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AuthenticatedNavbar from '@/components/shared/AuthenticatedNavbar';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check for authenticated user session
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // This check is now redundant because our middleware handles it,
    // but it provides an extra layer of "defense in depth."
    redirect('/');
  }

  // Fetch user profile for navbar
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen">
      {/* The navbar for logged-in users */}
      <AuthenticatedNavbar user={user} profile={profile} />
      
      {/* The page content (e.g., the dashboard) will be rendered here */}
      <main>
        {children}
      </main>
    </div>
  );
}