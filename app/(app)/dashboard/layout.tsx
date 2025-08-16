import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UIStateProvider } from '@/components/layout/UIStateContext';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';
import BottomNavBar from '@/components/layout/BottomNavBar';

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

  // Fetch user stats for navigation badges (without claims table)
  let stats = {
    totalProducts: 0,
    activeWarranties: 0,
    pendingClaims: 0,
    notifications: 0
  };

  try {
    const { data: products } = await supabase
      .from('products')
      .select('id, warranties(*)')
      .eq('user_id', user.id)
      .eq('is_archived', false);

    if (products) {
      stats = {
        totalProducts: products.length,
        activeWarranties: products.filter(p => {
          if (!p.warranties || !Array.isArray(p.warranties)) return false;
          return p.warranties.some(w => {
            if (!w.warranty_end_date) return true;
            return new Date(w.warranty_end_date) > new Date();
          });
        }).length,
        pendingClaims: 0, // Claims table doesn't exist yet
        notifications: 0
      };
    }
  } catch (error) {
    console.warn('Stats fetch failed:', error);
  }

  return (
    <UIStateProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <Header 
          user={user} 
          profile={profile} 
          stats={stats}
        />
        
        {/* Sidebar */}
        <Sidebar stats={stats} />
        
        {/* Main Content */}
        <MainContent>
          {children}
        </MainContent>
        
        {/* Bottom Navigation (Mobile) */}
        <BottomNavBar stats={stats} />
      </div>
    </UIStateProvider>
  );
}