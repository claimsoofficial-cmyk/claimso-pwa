'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Plus, 
  Download, 
  Settings, 
  CheckCircle, 
  Package,
  Shield,
  FileText,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Zap,
  DollarSign,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ==============================================================================
// TYPESCRIPT INTERFACES
// ==============================================================================

interface Product {
  id: string;
  product_name: string;
  brand: string | null;
  category: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  currency: string;
  serial_number: string | null;
  condition: 'new' | 'used' | 'refurbished' | 'damaged';
  notes: string | null;
  created_at: string;
  warranties?: Array<{
    id: string;
    warranty_start_date: string | null;
    warranty_end_date: string | null;
    warranty_duration_months: number | null;
    warranty_type: 'manufacturer' | 'extended' | 'store' | 'insurance';
    coverage_details: string | null;
    ai_confidence_score: number | null;
  }>;
  documents?: Array<{
    id: string;
    file_name: string;
    file_url: string;
    document_type: 'receipt' | 'warranty_pdf' | 'manual' | 'insurance' | 'photo' | 'other';
    is_primary: boolean;
  }>;
}

interface UserConnection {
  retailer: string;
  status: string;
  last_synced_at?: string;
}

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [userConnections, setUserConnections] = useState<UserConnection[]>([]);

  const supabase = createClient();

  // ==============================================================================
  // DATA FETCHING
  // ==============================================================================
  
  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDisplayName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');
        
        // Fetch profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profile?.full_name) {
          setDisplayName(profile.full_name);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: productsData, error } = await supabase
        .from('products')
        .select(`
          *,
          warranties (*),
          documents (*)
        `)
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(productsData || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserConnections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: connectionsData, error: connError } = await supabase
        .from('user_connections')
        .select('retailer, status, last_synced_at')
        .eq('user_id', user.id);
      
      if (connError) {
        console.error('Error fetching connections:', connError);
      } else {
        setUserConnections(connectionsData || []);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  // ==============================================================================
  // HELPER FUNCTIONS
  // ==============================================================================

  // Calculate dashboard stats
  const stats = {
    totalProducts: products.length,
    totalValue: products.reduce((sum, p) => sum + (p.purchase_price || 0), 0),
    activeWarranties: products.filter(p => p.warranties?.some(w => {
      if (!w.warranty_end_date) return true;
      return new Date(w.warranty_end_date) > new Date();
    })).length,
    expiringWarranties: products.filter(p => p.warranties?.some(w => {
      if (!w.warranty_end_date) return false;
      const endDate = new Date(w.warranty_end_date);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    })).length,
    connectedRetailers: userConnections.filter(c => c.status === 'connected').length
  };

  // Get recent products
  const recentProducts = products.slice(0, 3);

  // Get products needing attention
  const productsNeedingAttention = products.filter(p => {
    const hasWarranty = p.warranties && p.warranties.length > 0;
    const hasSerialNumber = !!p.serial_number;
    const hasDocuments = p.documents && p.documents.length > 0;
    return !hasWarranty || !hasSerialNumber || !hasDocuments;
  }).slice(0, 3);

  // ==============================================================================
  // INITIALIZATION
  // ==============================================================================

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchUserData(),
          fetchProducts(),
          fetchUserConnections()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

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
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Welcome back, {displayName}!
              </h1>
              <p className="text-gray-600">
                {stats.totalProducts} products • {stats.connectedRetailers} retailers connected
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/products/add'}
                className="hover-lift"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
              
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => window.location.href = '/settings/account'}
                className="hover-lift"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalValue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Warranties</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeWarranties}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900">{stats.expiringWarranties}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Products */}
        <Card className="card-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Recent Products
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/products'}
                className="hover-lift"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentProducts.length > 0 ? (
              <div className="space-y-4">
                {recentProducts.map((product) => (
                  <div 
                    key={product.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/products/${product.id}`}
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {product.product_name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {product.brand} • {product.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${product.purchase_price?.toLocaleString() || '0'}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {product.warranties?.length || 0} warranty{product.warranties?.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-500 mb-4">Start by adding your first product</p>
                <Button 
                  onClick={() => window.location.href = '/products/add'}
                  className="hover-lift"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="gradient" 
                className="w-full justify-start h-12"
                onClick={() => window.location.href = '/products/add'}
              >
                <Plus className="w-5 h-5 mr-3" />
                Add New Product
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start h-12"
                onClick={() => window.location.href = '/claims/new'}
              >
                <FileText className="w-5 h-5 mr-3" />
                File a Claim
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start h-12"
                onClick={() => window.location.href = '/analytics'}
              >
                <BarChart3 className="w-5 h-5 mr-3" />
                View Analytics
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start h-12"
                onClick={() => window.location.href = '/warranties'}
              >
                <Shield className="w-5 h-5 mr-3" />
                Check Warranties
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Needing Attention */}
      {productsNeedingAttention.length > 0 && (
        <Card className="card-hover border-orange-200 bg-orange-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              Products Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {productsNeedingAttention.map((product) => (
                <div 
                  key={product.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/80 hover:bg-white transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/products/${product.id}`}
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {product.product_name}
                    </h4>
                    <div className="flex gap-2 mt-1">
                      {!product.warranties?.length && (
                        <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300">
                          No Warranty
                        </Badge>
                      )}
                      {!product.serial_number && (
                        <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
                          No Serial
                        </Badge>
                      )}
                      {!product.documents?.length && (
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                          No Docs
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/products/${product.id}`;
                    }}
                  >
                    Fix
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Retailer Connections */}
      {stats.connectedRetailers > 0 && (
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              Connected Retailers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {[
                { id: 'amazon', label: 'Amazon', logo: '/logos/amazon.svg' },
                { id: 'walmart', label: 'Walmart', logo: '/logos/walmart.svg' },
                { id: 'target', label: 'Target', logo: '/logos/target.svg' },
                { id: 'bestbuy', label: 'Best Buy', logo: '/logos/bestbuy.svg' },
              ].map(r => {
                const connection = userConnections.find(c => c.retailer === r.id && c.status === 'connected');
                const isConnected = !!connection;
                
                return (
                  <div
                    key={r.id}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl transition-all duration-200",
                      isConnected 
                        ? "bg-green-100 text-green-700" 
                        : "bg-gray-100 text-gray-400"
                    )}
                  >
                    <Image src={r.logo} alt={r.label} width={24} height={24} className="w-6 h-6" />
                    <span className="text-sm font-medium">{r.label}</span>
                    {isConnected && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}