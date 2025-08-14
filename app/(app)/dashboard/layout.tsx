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

  // Fetch user profile for navbar
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single();

  // Fetch user stats for navigation badges
  const { data: products } = await supabase
    .from('products')
    .select('id, warranties(*)')
    .eq('user_id', user.id)
    .eq('is_archived', false);

  const { data: claims } = await supabase
    .from('claims')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('status', 'pending');

  // Calculate stats
  const stats = {
    totalProducts: products?.length || 0,
    activeWarranties: products?.filter(p => p.warranties?.some(w => {
      if (!w.warranty_end_date) return true;
      return new Date(w.warranty_end_date) > new Date();
    })).length || 0,
    pendingClaims: claims?.length || 0,
    notifications: 0 // TODO: Implement notification count
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