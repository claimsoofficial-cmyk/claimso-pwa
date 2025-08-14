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
      // Fetch all products with warranties
      const { data: productsData, error } = await supabase
        .from('products')
        .select(`
          *,
          warranties (
            id,
            warranty_type,
            warranty_start_date,
            warranty_end_date,
            warranty_duration_months,
            coverage_details,
            claim_process,
            contact_info,
            snapshot_data,
            ai_confidence_score,
            last_analyzed_at,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      console.log('📊 Products query result:', { data: productsData?.length, error });

      if (error) {
        console.error('❌ Error fetching products:', error);
        setError('Failed to fetch products: ' + error.message);
      } else {
        console.log('✅ Products fetched successfully:', productsData?.length);
        setProducts(productsData || []);
      }
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
    activeWarranties: 0, // Simplified for now
    expiringWarranties: 0, // Simplified for now
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {displayName}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your products and track your warranties
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleAddProduct} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Warranties</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.warranties?.some(w => {
                    if (!w.warranty_end_date) return true;
                    return new Date(w.warranty_end_date) > new Date();
                  })).length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Connected Retailers</p>
                <p className="text-2xl font-bold text-gray-900">{userConnections.length}</p>
              </div>
              <Link className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${products.reduce((sum, p) => sum + (p.purchase_price || 0), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Your Products</h2>
              <p className="text-gray-600 mt-1">
                {products.length} product{products.length !== 1 ? 's' : ''} in your collection
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <EmptyState
              type="products"
              primaryAction={{
                label: "Add Product",
                onClick: handleAddProduct
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.product_name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {product.notes || 'No description available'}
                  </p>
                  <div className="text-xs text-gray-500">
                    Product ID: {product.id}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}