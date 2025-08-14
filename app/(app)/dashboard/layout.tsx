import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SidebarNavigation from '@/components/shared/SidebarNavigation';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import MobileBottomNav from '@/components/shared/MobileBottomNav';

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
      {/* Sidebar Navigation */}
      <SidebarNavigation 
        user={user} 
        profile={profile} 
        stats={stats}
      />
      
      {/* Main Content Area */}
      <div className="lg:pl-80">
        <div className="min-h-screen">
          {/* Top Bar with Breadcrumbs */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4 sticky top-0 z-30">
            <Breadcrumbs />
          </div>
          
          {/* Page Content */}
          <main className="p-6 max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav stats={stats} />
    </div>
  );
}