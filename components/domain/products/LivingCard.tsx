'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Shield, 
  FileText, 
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  Filter,
  Search,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types/common';

interface LivingCardProps {
  className?: string;
}

type FilterType = 'all' | 'active-warranties' | 'expiring-soon' | 'expired' | 'no-warranty';
type SortType = 'name' | 'date' | 'value' | 'warranty';

export default function LivingCard({ className = '' }: LivingCardProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const supabase = createClient();

  // ==============================================================================
  // DATA FETCHING
  // ==============================================================================

  const fetchProducts = useCallback(async () => {
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
        setFilteredProducts(productsData || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // ==============================================================================
  // FILTERING AND SORTING
  // ==============================================================================

  useEffect(() => {
    let filtered = [...products];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    switch (activeFilter) {
      case 'active-warranties':
        filtered = filtered.filter(product => 
          product.warranties?.some(w => {
            if (!w.warranty_end_date) return true;
            return new Date(w.warranty_end_date) > new Date();
          })
        );
        break;
      case 'expiring-soon':
        filtered = filtered.filter(product =>
          product.warranties?.some(w => {
            if (!w.warranty_end_date) return false;
            const endDate = new Date(w.warranty_end_date);
            const now = new Date();
            const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
          })
        );
        break;
      case 'expired':
        filtered = filtered.filter(product =>
          product.warranties?.some(w => {
            if (!w.warranty_end_date) return false;
            return new Date(w.warranty_end_date) < new Date();
          })
        );
        break;
      case 'no-warranty':
        filtered = filtered.filter(product => 
          !product.warranties || product.warranties.length === 0
        );
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.product_name.toLowerCase();
          bValue = b.product_name.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'value':
          aValue = a.purchase_price || 0;
          bValue = b.purchase_price || 0;
          break;
        case 'warranty':
          aValue = a.warranties?.length || 0;
          bValue = b.warranties?.length || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProducts(filtered);
  }, [products, activeFilter, sortBy, sortOrder, searchQuery]);

  // ==============================================================================
  // HELPER FUNCTIONS
  // ==============================================================================

  const getWarrantyStatus = (product: Product) => {
    if (!product.warranties || product.warranties.length === 0) {
      return { status: 'no-warranty', label: 'No Warranty', color: 'gray' };
    }

    const activeWarranties = product.warranties.filter(w => {
      if (!w.warranty_end_date) return true;
      return new Date(w.warranty_end_date) > new Date();
    });

    const expiringWarranties = product.warranties.filter(w => {
      if (!w.warranty_end_date) return false;
      const endDate = new Date(w.warranty_end_date);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    });

    if (expiringWarranties.length > 0) {
      return { status: 'expiring', label: 'Expiring Soon', color: 'orange' };
    } else if (activeWarranties.length > 0) {
      return { status: 'active', label: 'Active', color: 'green' };
    } else {
      return { status: 'expired', label: 'Expired', color: 'red' };
    }
  };

  const getDaysUntilExpiry = (product: Product) => {
    if (!product.warranties || product.warranties.length === 0) return null;

    const activeWarranty = product.warranties.find(w => {
      if (!w.warranty_end_date) return false;
      const endDate = new Date(w.warranty_end_date);
      return endDate > new Date();
    });

    if (!activeWarranty?.warranty_end_date) return null;

    const endDate = new Date(activeWarranty.warranty_end_date);
    const now = new Date();
    return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  // ==============================================================================
  // INITIALIZATION
  // ==============================================================================

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ==============================================================================
  // RENDER
  // ==============================================================================

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Product Vault
          </CardTitle>
          <Button 
            variant="gradient" 
            size="sm"
            onClick={() => window.location.href = '/products/add'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Products ({filteredProducts.length})
            </TabsTrigger>
            <TabsTrigger value="warranties" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Warranties
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value as FilterType)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Products</option>
                  <option value="active-warranties">Active Warranties</option>
                  <option value="expiring-soon">Expiring Soon</option>
                  <option value="expired">Expired</option>
                  <option value="no-warranty">No Warranty</option>
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="date">Date Added</option>
                  <option value="name">Name</option>
                  <option value="value">Value</option>
                  <option value="warranty">Warranty Status</option>
                </select>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const warrantyStatus = getWarrantyStatus(product);
                const daysUntilExpiry = getDaysUntilExpiry(product);
                
                return (
                  <Card 
                    key={product.id} 
                    className="cursor-pointer hover:shadow-md transition-all duration-200 border-l-4"
                    style={{ borderLeftColor: warrantyStatus.color === 'green' ? '#10b981' : 
                           warrantyStatus.color === 'orange' ? '#f59e0b' : 
                           warrantyStatus.color === 'red' ? '#ef4444' : '#6b7280' }}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {product.product_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {product.brand} • {product.category}
                          </p>
                        </div>
                        <Badge 
                          variant={warrantyStatus.color === 'green' ? 'default' : 
                                  warrantyStatus.color === 'orange' ? 'secondary' : 
                                  warrantyStatus.color === 'red' ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {warrantyStatus.label}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Value:</span>
                          <span className="font-medium">
                            ${product.purchase_price?.toLocaleString() || '0'}
                          </span>
                        </div>
                        
                        {daysUntilExpiry !== null && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Warranty:</span>
                            <span className={cn(
                              "font-medium",
                              daysUntilExpiry <= 7 ? "text-red-600" :
                              daysUntilExpiry <= 30 ? "text-orange-600" : "text-green-600"
                            )}>
                              {daysUntilExpiry} days left
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Warranties:</span>
                          <span className="font-medium">
                            {product.warranties?.length || 0}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/products/${product.id}`;
                          }}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle claim filing
                          }}
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Claim
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery || activeFilter !== 'all' ? 'No products found' : 'No products yet'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || activeFilter !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Start by adding your first product'}
                </p>
                <Button 
                  onClick={() => window.location.href = '/products/add'}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="warranties" className="mt-6">
            {/* Warranty Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Warranties</p>
                      <p className="text-2xl font-bold text-green-600">
                        {products.filter(p => getWarrantyStatus(p).status === 'active').length}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {products.filter(p => getWarrantyStatus(p).status === 'expiring').length}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Expired</p>
                      <p className="text-2xl font-bold text-red-600">
                        {products.filter(p => getWarrantyStatus(p).status === 'expired').length}
                      </p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Warranty Details */}
            <div className="space-y-4">
              {products
                .filter(p => p.warranties && p.warranties.length > 0)
                .map(product => (
                  <Card key={product.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{product.product_name}</h3>
                        <Badge variant={getWarrantyStatus(product).color === 'green' ? 'default' : 'secondary'}>
                          {getWarrantyStatus(product).label}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {product.warranties?.map(warranty => (
                          <div key={warranty.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                              {warranty.warranty_type || 'Standard'} Warranty
                            </span>
                            <span className="font-medium">
                              {warranty.warranty_end_date 
                                ? new Date(warranty.warranty_end_date).toLocaleDateString()
                                : 'Lifetime'
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Products</p>
                      <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                    </div>
                    <Package className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Value</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${products.reduce((sum, p) => sum + (p.purchase_price || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Value</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${products.length > 0 
                          ? Math.round(products.reduce((sum, p) => sum + (p.purchase_price || 0), 0) / products.length).toLocaleString()
                          : '0'
                        }
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Coverage</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {products.length > 0 
                          ? Math.round((products.filter(p => getWarrantyStatus(p).status === 'active').length / products.length) * 100)
                          : 0
                        }%
                      </p>
                    </div>
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    products.reduce((acc, product) => {
                      const category = product.category || 'Uncategorized';
                      acc[category] = (acc[category] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  )
                  .sort(([,a], [,b]) => b - a)
                  .map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(count / products.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}