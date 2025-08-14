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
  SortDesc,
  HelpCircle,
  Download,
  TrendingUp,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Product } from '@/lib/types/common';
import RetailerConnect from './RetailerConnect';
import QuickCashModal from './QuickCashModal';
import ClaimFilingModal from './ClaimFilingModal';
import WarrantyDatabaseModal from './WarrantyDatabaseModal';
import ResolutionFlow from '../resolution/ResolutionFlow';

interface LivingCardProps {
  className?: string;
}

type FilterType = 'all' | 'active-warranties' | 'expiring-soon' | 'expired' | 'no-warranty';
type SortType = 'name' | 'date' | 'value' | 'warranty';

export default function LivingCard({ className = '' }: LivingCardProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isQuickCashModalOpen, setIsQuickCashModalOpen] = useState(false);
  const [quickCashProduct, setQuickCashProduct] = useState<Product | null>(null);
  const [isClaimFilingModalOpen, setIsClaimFilingModalOpen] = useState(false);
  const [claimFilingProduct, setClaimFilingProduct] = useState<Product | null>(null);
  const [isWarrantyDatabaseModalOpen, setIsWarrantyDatabaseModalOpen] = useState(false);
  const [warrantyDatabaseProduct, setWarrantyDatabaseProduct] = useState<Product | null>(null);
  const [isResolutionFlowOpen, setIsResolutionFlowOpen] = useState(false);
  const [resolutionFlowProduct, setResolutionFlowProduct] = useState<Product | null>(null);

  const supabase = createClient();

  // ==============================================================================
  // CALENDAR FUNCTIONALITY
  // ==============================================================================

  const downloadCalendar = async (product: Product) => {
    try {
      toast.loading('Generating calendar file...');
      
      const response = await fetch(`/api/calendar/generate-ics?productId=${product.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate calendar');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `claimso_warranty_${product.product_name?.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Calendar file downloaded!');
    } catch (error) {
      console.error('Error downloading calendar:', error);
      toast.error('Failed to download calendar file');
    }
  };

  // ==============================================================================
  // DATA FETCHING
  // ==============================================================================

  const fetchProducts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

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
  // HELPER FUNCTIONS
  // ==============================================================================

  const getWarrantyStatus = (product: Product) => {
    const warranties = product.warranties || [];
    const activeWarranties = warranties.filter(w => {
      if (!w.warranty_end_date) return true;
      return new Date(w.warranty_end_date) > new Date();
    });

    if (activeWarranties.length === 0) {
      return { label: 'No Warranty', color: 'gray' };
    }

    const expiringWarranties = activeWarranties.filter(w => {
      if (!w.warranty_end_date) return false;
      const daysUntilExpiry = Math.ceil((new Date(w.warranty_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30;
    });

    if (expiringWarranties.length > 0) {
      return { label: 'Expiring Soon', color: 'orange' };
    }

    return { label: 'Active', color: 'green' };
  };

  const getDaysUntilExpiry = (product: Product) => {
    const warranties = product.warranties || [];
    const activeWarranties = warranties.filter(w => w.warranty_end_date);
    
    if (activeWarranties.length === 0) return null;
    
    const earliestExpiry = activeWarranties.reduce((earliest, current) => {
      if (!current.warranty_end_date) return earliest;
      if (!earliest) return current.warranty_end_date;
      return new Date(current.warranty_end_date) < new Date(earliest) ? current.warranty_end_date : earliest;
    }, null as string | null);
    
    if (!earliestExpiry) return null;
    
    const daysUntilExpiry = Math.ceil((new Date(earliestExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 ? daysUntilExpiry : 0;
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    let filtered = [...products];
    
    switch (filter) {
      case 'active-warranties':
        filtered = products.filter(p => getWarrantyStatus(p).color === 'green');
        break;
      case 'expiring-soon':
        filtered = products.filter(p => getWarrantyStatus(p).color === 'orange');
        break;
      case 'expired':
        filtered = products.filter(p => getWarrantyStatus(p).color === 'red');
        break;
      case 'no-warranty':
        filtered = products.filter(p => getWarrantyStatus(p).color === 'gray');
        break;
      default:
        filtered = products;
    }
    
    setFilteredProducts(filtered);
  };

  const handleSort = (sort: SortType) => {
    setSortBy(sort);
    const sorted = [...filteredProducts].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sort) {
        case 'name':
          aValue = a.product_name || '';
          bValue = b.product_name || '';
          break;
        case 'date':
          aValue = new Date(a.created_at || '');
          bValue = new Date(b.created_at || '');
          break;
        case 'value':
          aValue = a.purchase_price || 0;
          bValue = b.purchase_price || 0;
          break;
        case 'warranty':
          aValue = getDaysUntilExpiry(a) || 999;
          bValue = getDaysUntilExpiry(b) || 999;
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
    
    setFilteredProducts(sorted);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      handleFilterChange(activeFilter);
      return;
    }
    
    const filtered = products.filter(product =>
      product.product_name?.toLowerCase().includes(query.toLowerCase()) ||
      product.brand?.toLowerCase().includes(query.toLowerCase()) ||
      product.category?.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredProducts(filtered);
  };

  // ==============================================================================
  // ANALYTICS DATA
  // ==============================================================================

  const getAnalyticsData = () => {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.purchase_price || 0), 0);
    const activeWarranties = products.filter(p => getWarrantyStatus(p).color === 'green').length;
    const expiringWarranties = products.filter(p => getWarrantyStatus(p).color === 'orange').length;
    const expiredWarranties = products.filter(p => getWarrantyStatus(p).color === 'red').length;
    const noWarranty = products.filter(p => getWarrantyStatus(p).color === 'gray').length;
    
    const categoryBreakdown = products.reduce((acc, product) => {
      const category = product.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const brandBreakdown = products.reduce((acc, product) => {
      const brand = product.brand || 'Unknown';
      acc[brand] = (acc[brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalProducts,
      totalValue,
      activeWarranties,
      expiringWarranties,
      expiredWarranties,
      noWarranty,
      categoryBreakdown,
      brandBreakdown
    };
  };

  // ==============================================================================
  // INITIALIZATION
  // ==============================================================================

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    handleSort(sortBy);
  }, [sortBy, sortOrder, products]);

  // ==============================================================================
  // RENDER
  // ==============================================================================

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Products</CardTitle>
              <p className="text-sm text-gray-500">Manage your warranties and claims</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const analyticsData = getAnalyticsData();

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Products</CardTitle>
            <p className="text-sm text-gray-500">Manage your warranties and claims</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            
            <select
              value={activeFilter}
              onChange={(e) => handleFilterChange(e.target.value as FilterType)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Products ({filteredProducts.length})
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            {/* Products Grid - Horizontal Scrollable */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {filteredProducts.map((product) => {
                const warrantyStatus = getWarrantyStatus(product);
                const daysUntilExpiry = getDaysUntilExpiry(product);
                
                return (
                  <Card 
                    key={product.id} 
                    className="cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 min-w-[320px] flex-shrink-0"
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
                      
                      <div className="space-y-2 mb-4">
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
                      
                      {/* Action Buttons - Restructured */}
                      <div className="space-y-2">
                        {/* Primary Actions Row */}
                        <div className="flex gap-2">
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
                              setClaimFilingProduct(product);
                              setIsClaimFilingModalOpen(true);
                            }}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Claim
                          </Button>
                        </div>
                        
                        {/* Secondary Actions Row */}
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickCashProduct(product);
                              setIsQuickCashModalOpen(true);
                            }}
                          >
                            <DollarSign className="w-3 h-3 mr-1" />
                            Get Cash
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setWarrantyDatabaseProduct(product);
                              setIsWarrantyDatabaseModalOpen(true);
                            }}
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            Warranty
                          </Button>
                        </div>
                        
                        {/* Tertiary Actions Row */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadCalendar(product);
                            }}
                          >
                            <Calendar className="w-3 h-3 mr-1" />
                            Calendar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setResolutionFlowProduct(product);
                              setIsResolutionFlowOpen(true);
                            }}
                          >
                            <HelpCircle className="w-3 h-3 mr-1" />
                            Help
                          </Button>
                        </div>
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

          <TabsContent value="insights" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Products</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.totalProducts}</p>
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
                      <p className="text-2xl font-bold text-gray-900">${analyticsData.totalValue.toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Warranties</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.activeWarranties}</p>
                    </div>
                    <Shield className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.expiringWarranties}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Warranty Status Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active Warranties</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(analyticsData.activeWarranties / analyticsData.totalProducts) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{analyticsData.activeWarranties}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Expiring Soon</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full" 
                            style={{ width: `${(analyticsData.expiringWarranties / analyticsData.totalProducts) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{analyticsData.expiringWarranties}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Expired</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full" 
                            style={{ width: `${(analyticsData.expiredWarranties / analyticsData.totalProducts) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{analyticsData.expiredWarranties}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">No Warranty</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gray-600 h-2 rounded-full" 
                            style={{ width: `${(analyticsData.noWarranty / analyticsData.totalProducts) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{analyticsData.noWarranty}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Top Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analyticsData.categoryBreakdown)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{category}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(count / analyticsData.totalProducts) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Modals */}
      <QuickCashModal
        isOpen={isQuickCashModalOpen}
        onClose={() => setIsQuickCashModalOpen(false)}
        product={quickCashProduct}
      />
      
      <ClaimFilingModal
        isOpen={isClaimFilingModalOpen}
        onClose={() => setIsClaimFilingModalOpen(false)}
        product={claimFilingProduct}
      />
      
      <WarrantyDatabaseModal
        isOpen={isWarrantyDatabaseModalOpen}
        onClose={() => setIsWarrantyDatabaseModalOpen(false)}
        product={warrantyDatabaseProduct}
      />
      
      <ResolutionFlow
        isOpen={isResolutionFlowOpen}
        onClose={() => setIsResolutionFlowOpen(false)}
        product={resolutionFlowProduct}
      />
    </Card>
  );
}