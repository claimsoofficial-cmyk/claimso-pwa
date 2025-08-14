'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Settings,
  RefreshCw,
  Package,
  Shield,
  Link,
  DollarSign
} from 'lucide-react';
import type { Product, UserConnection } from '@/lib/types/common';
import LivingCard from '@/components/domain/products/LivingCard';
import EmptyState from '@/components/shared/EmptyState';

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
        setDisplayName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');
        
        // Fetch profile data
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

          if (profile?.full_name) {
            setDisplayName(profile.full_name);
          }
        } catch (profileError) {
          console.warn('Profile fetch failed, using default name:', profileError);
        }
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
      
      // First, fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('❌ Error fetching products:', productsError);
        setError('Failed to fetch products: ' + productsError.message);
        return;
      }

      console.log('✅ Products fetched successfully:', productsData?.length);

      // Then, fetch warranties separately and merge them
      const { data: warrantiesData, error: warrantiesError } = await supabase
        .from('warranties')
        .select('*')
        .eq('user_id', user.id);

      if (warrantiesError) {
        console.error('❌ Error fetching warranties:', warrantiesError);
      } else {
        console.log('✅ Warranties fetched successfully:', warrantiesData?.length);
      }

      // Merge products with their warranties
      const productsWithWarranties = (productsData || []).map(product => {
        const productWarranties = (warrantiesData || []).filter(w => w.product_id === product.id);
        return {
          ...product,
          warranties: productWarranties
        };
      });

      console.log('📊 Final products with warranties:', productsWithWarranties.map(p => ({
        name: p.product_name,
        warranties: p.warranties.length
      })));
      
      setProducts(productsWithWarranties);
    } catch (error) {
      console.error('💥 Exception in fetchProducts:', error);
      setError('Failed to fetch products: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const fetchUserConnections = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: connectionsData, error: connError } = await supabase
        .from('user_connections')
        .select('retailer, status, last_synced_at, user_id')
        .eq('user_id', user.id);
      
      if (connError) {
        console.error('Error fetching connections:', connError);
      } else {
        setUserConnections(connectionsData || []);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  }, [supabase]);

  // ==============================================================================
  // HELPER FUNCTIONS
  // ==============================================================================

  // Calculate dashboard stats
  const stats = {
    totalProducts: products.length,
    totalValue: products.reduce((sum, p) => sum + (p.purchase_price || 0), 0),
    activeWarranties: products.filter(p => {
      if (!p.warranties || !Array.isArray(p.warranties)) return false;
      return p.warranties.some(w => {
        if (!w.warranty_end_date) return true;
        return new Date(w.warranty_end_date) > new Date();
      });
    }).length,
    expiringWarranties: products.filter(p => {
      if (!p.warranties || !Array.isArray(p.warranties)) return false;
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return p.warranties.some(w => {
        if (!w.warranty_end_date) return false;
        const endDate = new Date(w.warranty_end_date);
        return endDate > new Date() && endDate <= thirtyDaysFromNow;
      });
    }).length,
    connectedRetailers: userConnections.filter(c => c.status === 'connected').length
  };

  // ==============================================================================
  // HANDLERS
  // ==============================================================================

  const handleAddProduct = () => {
    // TODO: Implement add product functionality
    console.log('Add product clicked');
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    fetchProducts();
    fetchUserConnections();
  };

  const handleEditProduct = (product: Product) => {
    // TODO: Implement edit product functionality
    console.log('Edit product:', product.id);
  };

  const handleDeleteProduct = (productId: string) => {
    // TODO: Implement delete product functionality
    console.log('Delete product:', productId);
  };

  const handleFileClaim = (product: Product) => {
    // TODO: Implement file claim functionality
    console.log('File claim for product:', product.id);
  };

  const handleQuickCash = (product: Product) => {
    // TODO: Implement quick cash functionality
    console.log('Quick cash for product:', product.id);
  };

  const handleWarrantyDatabase = (product: Product) => {
    // TODO: Implement warranty database functionality
    console.log('Warranty database for product:', product.id);
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

  // Real-time updates
  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to products changes
      const productsSubscription = supabase
        .channel('products-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'products',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            console.log('🔄 Products changed, refreshing...');
            fetchProducts();
          }
        )
        .subscribe();

      // Subscribe to warranties changes
      const warrantiesSubscription = supabase
        .channel('warranties-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'warranties',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            console.log('🔄 Warranties changed, refreshing...');
            fetchProducts();
          }
        )
        .subscribe();

      return () => {
        productsSubscription.unsubscribe();
        warrantiesSubscription.unsubscribe();
      };
    };

    setupRealtime();
  }, [supabase, fetchProducts]);

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
      {/* Header */}
      <Card>
        <CardHeader>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {displayName}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your products and track your warranties
            </p>
          </div>
        </CardHeader>
      </Card>



      {/* Products Section */}
      <Card>
                <CardContent className="p-0">
          {products.length === 0 ? (
            <EmptyState
              type="products"
              primaryAction={{
                label: "Add Product",
                onClick: handleAddProduct
              }}
            />
          ) : (
            <LivingCard products={products} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}