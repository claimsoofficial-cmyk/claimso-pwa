'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Settings,
  RefreshCw,
  Package,
  Shield,
  Link,
  DollarSign,
  Bot,
  Wifi,
  WifiOff,
  AlertCircle
} from 'lucide-react';
import type { Product, UserConnection } from '@/lib/types/common';
import ProductGrid from '@/components/products/ProductGrid';
import ViewToggle from '@/components/products/ViewToggle';
import EmptyState from '@/components/shared/EmptyState';
import AgentDashboard from '@/components/shared/AgentDashboard';
import QuickCashModal from '@/components/domain/products/QuickCashModal';
import WarrantyDatabaseModal from '@/components/domain/products/WarrantyDatabaseModal';
import { toast } from 'sonner';

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [userConnections, setUserConnections] = useState<UserConnection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAgentDashboard, setShowAgentDashboard] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Modal states
  const [quickCashModalOpen, setQuickCashModalOpen] = useState(false);
  const [warrantyModalOpen, setWarrantyModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const supabase = createClient();

  // Real-time sync state
  const [syncStatus, setSyncStatus] = useState({ isConnected: true, errors: [] });
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  
  const forceSync = () => {
    fetchProducts();
    fetchUserConnections();
  };

  // ==============================================================================
  // DATA FETCHING
  // ==============================================================================
  
  const fetchUserData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
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

  const handleAddProduct = async () => {
    try {
      // Trigger EmailMonitoringAgent to scan for new purchases
      const emailResponse = await fetch('/api/ai-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger_agent',
          agent: 'email_monitoring',
          userId: userId,
          data: { scanEmails: true }
        })
      });

      // Trigger RetailerAPIAgent to check connected accounts
      const retailerResponse = await fetch('/api/ai-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger_agent',
          agent: 'retailer_api',
          userId: userId,
          data: { checkConnections: true }
        })
      });

      // Show success message
      toast.success('AI agents are scanning for your purchases...');
      
      // Refresh products after a short delay
      setTimeout(() => {
        fetchProducts();
        forceSync();
      }, 2000);

    } catch (error) {
      console.error('Error triggering agents:', error);
      toast.error('Failed to trigger purchase scanning');
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    
    // Trigger ProductIntelligenceAgent to enrich existing products
    fetch('/api/ai-integration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'trigger_agent',
        agent: 'product_intelligence',
        userId: userId,
        data: { enrichProducts: true }
      })
    }).then(() => {
      fetchProducts();
      fetchUserConnections();
      forceSync();
    }).catch((error) => {
      console.error('Error refreshing:', error);
      setError('Failed to refresh data');
    }).finally(() => {
      setIsLoading(false);
    });
  };

  const handleProductAction = async (productId: string, action: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    switch (action) {
      case 'view':
        window.location.href = `/products/${productId}`;
        break;
      case 'edit':
        window.location.href = `/products/${productId}/edit`;
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this product?')) {
          try {
            const { error } = await supabase
              .from('products')
              .update({ is_archived: true })
              .eq('id', productId);

            if (error) throw error;
            
            toast.success('Product archived successfully');
            fetchProducts();
          } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product');
          }
        }
        break;
      case 'quick_cash':
        // Open Quick Cash modal
        setSelectedProduct(product);
        setQuickCashModalOpen(true);
        break;
      case 'warranty':
        // Open Warranty Database modal
        setSelectedProduct(product);
        setWarrantyModalOpen(true);
        break;
      default:
        console.warn('Unknown action:', action);
    }
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {displayName}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your products and track your warranties
              </p>
              {/* Agent status */}
              <div className="flex items-center gap-2 mt-2">
                <Wifi className="h-4 w-4 text-green-600" />
                <Badge variant="outline" className="text-xs text-green-600">
                  AI Agents Connected
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowAgentDashboard(!showAgentDashboard)}
                variant={showAgentDashboard ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                <Bot className="h-4 w-4" />
                {showAgentDashboard ? 'Hide' : 'Monitor'} AI Agents
              </Button>
              <Button 
                onClick={() => {
                  handleRefresh();
                  forceSync();
                }} 
                variant="outline" 
                size="icon"
                title="Refresh data and sync with agents"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* New Products Notification */}
      {newProducts.length > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Plus className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">
                    {newProducts.length} New Product{newProducts.length > 1 ? 's' : ''} Detected!
                  </h3>
                  <p className="text-sm text-green-700">
                    Your AI agents automatically captured these purchases
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setProducts(prev => [...newProducts, ...prev]);
                  // Clear new products
                  window.dispatchEvent(new CustomEvent('clear-new-products'));
                }}
                variant="outline"
                size="sm"
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                View All
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {newProducts.slice(0, 3).map((product, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-green-200">
                  <div>
                    <p className="font-medium text-sm">{product.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.purchase_location} • ${product.purchase_price} • Agent Detected
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    New
                  </Badge>
                </div>
              ))}
              {newProducts.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{newProducts.length - 3} more products...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Agent Dashboard */}
      {showAgentDashboard && (
        <AgentDashboard />
      )}

      {/* Products Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Your Products</h2>
              <p className="text-sm text-gray-600 mt-1">
                {products.length} product{products.length !== 1 ? 's' : ''} in your vault
              </p>
            </div>
            <ViewToggle />
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
            <ProductGrid 
              products={products} 
              onActionClick={handleProductAction}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <QuickCashModal
        isOpen={quickCashModalOpen}
        onClose={() => {
          setQuickCashModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />

      <WarrantyDatabaseModal
        isOpen={warrantyModalOpen}
        onClose={() => {
          setWarrantyModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />
    </div>
  );
}