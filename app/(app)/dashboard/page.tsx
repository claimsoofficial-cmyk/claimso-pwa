'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Settings
} from 'lucide-react';
import type { Product, UserConnection } from '@/lib/types/common';
import LivingCard from '@/components/domain/products/LivingCard';

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [userConnections, setUserConnections] = useState<UserConnection[]>([]);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // ==============================================================================
  // DATA FETCHING
  // ==============================================================================
  
  const fetchUserData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDisplayName(user.email?.split('@')[0] || 'User');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to fetch user data');
    }
  }, [supabase]);

  const fetchProducts = useCallback(async () => {
    try {
      console.log('🔍 Starting fetchProducts...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 User:', user?.id);
      if (!user) {
        console.log('❌ No user found');
        return;
      }

      console.log('📦 Fetching products for user:', user.id);
      // Even simpler - just count products
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_archived', false);

      console.log('📊 Products count result:', { count, error });

      if (error) {
        console.error('❌ Error counting products:', error);
        setError('Failed to count products: ' + error.message);
      } else {
        console.log('✅ Products counted successfully:', count);
        setProducts([]); // Set empty array for now
      }
    } catch (error) {
      console.error('💥 Exception in fetchProducts:', error);
      setError('Failed to fetch products: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const fetchUserConnections = useCallback(async () => {
    // Temporarily disabled for debugging
    setUserConnections([]);
  }, []);

  // ==============================================================================
  // HELPER FUNCTIONS
  // ==============================================================================

  // Calculate dashboard stats
  const stats = {
    totalProducts: products.length,
    totalValue: products.reduce((sum, p) => sum + (p.purchase_price || 0), 0),
    activeWarranties: 0, // Simplified for now
    expiringWarranties: 0, // Simplified for now
    connectedRetailers: userConnections.filter(c => c.status === 'connected').length
  };

  // ==============================================================================
  // INITIALIZATION
  // ==============================================================================

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchUserData(),
          fetchProducts(),
          fetchUserConnections()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Failed to initialize dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [fetchUserData, fetchProducts, fetchUserConnections]);

  // ==============================================================================
  // ERROR STATE
  // ==============================================================================

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Dashboard Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==============================================================================
  // LOADING STATE
  // ==============================================================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
          </CardHeader>
        </Card>
        
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-6 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ==============================================================================
  // RENDER
  // ==============================================================================

  return (
    <div className="space-y-6">
      {/* Living Card - Unified Product Management */}
      {/* Temporarily disabled for debugging */}
      <div className="p-6 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold">Dashboard Content</h2>
        <p>LivingCard temporarily disabled for debugging</p>
        <p>Products loaded: {products.length}</p>
        <p>User: {displayName}</p>
      </div>
      {/* <LivingCard /> */}
    </div>
  );
}