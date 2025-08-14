import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TopNavigation from '@/components/shared/TopNavigation';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check for authenticated user session
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch user profile for navbar (simplified)
  let profile = null;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();
    profile = data;
  } catch (error) {
    console.warn('Profile fetch failed:', error);
  }

  // Simplified stats to avoid complex queries
  const stats = {
    totalProducts: 0,
    activeWarranties: 0,
    pendingClaims: 0,
    notifications: 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Top Navigation */}
      <TopNavigation 
        user={user} 
        profile={profile} 
        stats={stats}
      />
      
      {/* Main Content Area */}
      <div className="min-h-screen">
        {/* Page Content */}
        <main className="p-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}