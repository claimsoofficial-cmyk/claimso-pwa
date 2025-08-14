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
  Activity,
  Wrench,
  ShoppingCart,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Product } from '@/lib/types/common';
import RetailerConnect from './RetailerConnect';
import QuickCashModal from './QuickCashModal';
import ClaimFilingModal from './ClaimFilingModal';
import WarrantyDatabaseModal from './WarrantyDatabaseModal';
import MaintenanceModal from './MaintenanceModal';
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
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceProduct, setMaintenanceProduct] = useState<Product | null>(null);
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

  const handleRebuy = (product: Product) => {
    // Generate affiliate link based on product and retailer
    const retailer = product.purchase_location?.toLowerCase() || 'amazon';
    const productName = encodeURIComponent(product.product_name || '');
    const affiliateId = product.affiliate_id || 'claimso-20';
    
    let affiliateUrl = '';
    
    switch (retailer) {
      case 'amazon':
        affiliateUrl = `https://www.amazon.com/s?k=${productName}&tag=${affiliateId}`;
        break;
      case 'best buy':
        affiliateUrl = `https://www.bestbuy.com/site/searchpage.jsp?st=${productName}`;
        break;
      case 'walmart':
        affiliateUrl = `https://www.walmart.com/search?q=${productName}`;
        break;
      default:
        affiliateUrl = `https://www.amazon.com/s?k=${productName}&tag=${affiliateId}`;
    }
    
    window.open(affiliateUrl, '_blank');
    toast.success('Opening retailer website...');
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

    // Payment method analytics
    const paymentMethodBreakdown = products.reduce((acc, product) => {
      const method = product.payment_method || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const paymentMethodSpending = products.reduce((acc, product) => {
      const method = product.payment_method || 'unknown';
      acc[method] = (acc[method] || 0) + (product.purchase_price || 0);
      return acc;
    }, {} as Record<string, number>);

    // Monthly spending analysis
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlySpending = products.reduce((acc, product) => {
      if (product.purchase_date) {
        const purchaseDate = new Date(product.purchase_date);
        if (purchaseDate.getMonth() === currentMonth && purchaseDate.getFullYear() === currentYear) {
          acc += product.purchase_price || 0;
        }
      }
      return acc;
    }, 0);

    const yearlySpending = products.reduce((acc, product) => {
      if (product.purchase_date) {
        const purchaseDate = new Date(product.purchase_date);
        if (purchaseDate.getFullYear() === currentYear) {
          acc += product.purchase_price || 0;
        }
      }
      return acc;
    }, 0);

    return {
      totalProducts,
      totalValue,
      activeWarranties,
      expiringWarranties,
      expiredWarranties,
      noWarranty,
      categoryBreakdown,
      brandBreakdown,
      paymentMethodBreakdown,
      paymentMethodSpending,
      monthlySpending,
      yearlySpending
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
            {/* Search and Filter Controls */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
            
            {/* Products Grid - Large Feature Cards */}
            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
              {filteredProducts.map((product) => {
                const warrantyStatus = getWarrantyStatus(product);
                const daysUntilExpiry = getDaysUntilExpiry(product);
                
                return (
                  <Card 
                    key={product.id} 
                    className="min-w-[450px] w-[450px] flex-shrink-0 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer border-2 border-gray-100 hover:border-blue-200"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <CardContent className="p-6">
                      {/* Product Header with Image */}
                      <div className="flex items-start gap-4 mb-6">
                        {/* Product Image Placeholder */}
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-8 h-8 text-blue-600" />
                        </div>
                        
                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                            {product.product_name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            {product.brand && (
                              <>
                                <span className="font-semibold text-gray-700">{product.brand}</span>
                                <span className="text-gray-400">•</span>
                              </>
                            )}
                            <span className="capitalize">{product.category || 'General'}</span>
                          </div>
                          {product.purchase_date && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Purchased {new Date(product.purchase_date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          )}
                        </div>
                        
                        {/* Warranty Status Badge */}
                        <Badge 
                          className={cn(
                            "ml-2 px-3 py-1 text-sm font-medium",
                            warrantyStatus.color === 'green' && "bg-green-100 text-green-800 border-green-200",
                            warrantyStatus.color === 'orange' && "bg-orange-100 text-orange-800 border-orange-200",
                            warrantyStatus.color === 'red' && "bg-red-100 text-red-800 border-red-200",
                            warrantyStatus.color === 'gray' && "bg-gray-100 text-gray-800 border-gray-200"
                          )}
                        >
                          {warrantyStatus.label}
                        </Badge>
                      </div>
                      
                      {/* Product Details Section */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <div className="grid grid-cols-2 gap-4">
                          {product.purchase_price && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Purchase Price</p>
                                <p className="font-bold text-lg text-gray-900">
                                  ${product.purchase_price.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {product.serial_number && (
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-blue-600" />
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Serial Number</p>
                                <p className="font-mono text-sm font-medium text-gray-700">
                                  {product.serial_number}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {product.condition && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-purple-600" />
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Condition</p>
                                <p className="text-sm font-medium capitalize text-gray-700">
                                  {product.condition}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-orange-600" />
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Warranties</p>
                              <p className="font-bold text-lg text-gray-900">
                                {product.warranties?.length || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {daysUntilExpiry !== null && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-orange-600" />
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Warranty Status</p>
                                <p className={cn(
                                  "font-bold text-lg",
                                  daysUntilExpiry <= 7 ? "text-red-600" :
                                  daysUntilExpiry <= 30 ? "text-orange-600" : "text-green-600"
                                )}>
                                  {daysUntilExpiry} days left
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons - Icon Only with Hover Descriptions */}
                      <div className="flex flex-wrap gap-2 justify-center mt-4">
                        {/* Edit */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-10 h-10 relative group"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/products/${product.id}`;
                          }}
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            Edit Product
                          </div>
                        </Button>

                        {/* Claim */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-10 h-10 relative group"
                          onClick={(e) => {
                            e.stopPropagation();
                            setClaimFilingProduct(product);
                            setIsClaimFilingModalOpen(true);
                          }}
                          title="File Claim"
                        >
                          <FileText className="w-4 h-4" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            File Claim
                          </div>
                        </Button>

                        {/* Get Cash - Green with shine effect */}
                        <Button
                          variant="default"
                          size="icon"
                          className="w-10 h-10 relative group bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickCashProduct(product);
                            setIsQuickCashModalOpen(true);
                          }}
                          title="Get Cash Offer"
                        >
                          <DollarSign className="w-4 h-4" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            Get Cash Offer
                          </div>
                        </Button>

                        {/* Warranty */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-10 h-10 relative group"
                          onClick={(e) => {
                            e.stopPropagation();
                            setWarrantyDatabaseProduct(product);
                            setIsWarrantyDatabaseModalOpen(true);
                          }}
                          title="Warranty Info"
                        >
                          <Shield className="w-4 h-4" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            Warranty Info
                          </div>
                        </Button>

                        {/* Maintenance */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-10 h-10 relative group"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMaintenanceProduct(product);
                            setIsMaintenanceModalOpen(true);
                          }}
                          title="Maintenance & Service"
                        >
                          <Wrench className="w-4 h-4" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            Maintenance & Service
                          </div>
                        </Button>

                        {/* Re-buy */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-10 h-10 relative group"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRebuy(product);
                          }}
                          title="Re-buy from Retailer"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            Re-buy from Retailer
                          </div>
                        </Button>

                        {/* Calendar */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-10 h-10 relative group"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadCalendar(product);
                          }}
                          title="Download Calendar"
                        >
                          <Calendar className="w-4 h-4" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            Download Calendar
                          </div>
                        </Button>

                        {/* Help - Simplified */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-10 h-10 relative group"
                          onClick={(e) => {
                            e.stopPropagation();
                            setResolutionFlowProduct(product);
                            setIsResolutionFlowOpen(true);
                          }}
                          title="Get Help"
                        >
                          <HelpCircle className="w-4 h-4" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            Get Help
                          </div>
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
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">This Month</p>
                      <p className="text-2xl font-bold text-gray-900">${analyticsData.monthlySpending.toLocaleString()}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">This Year</p>
                      <p className="text-2xl font-bold text-gray-900">${analyticsData.yearlySpending.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
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
                    <CreditCard className="w-5 h-5" />
                    Payment Method Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analyticsData.paymentMethodBreakdown)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([method, count]) => {
                        const totalSpent = analyticsData.paymentMethodSpending[method] || 0;
                        const percentage = (count / analyticsData.totalProducts) * 100;
                        return (
                          <div key={method} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-600 capitalize">
                                  {method.replace('_', ' ')}
                                </span>
                                <span className="text-sm font-medium">${totalSpent.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500">{count} items</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
      
      <MaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        product={maintenanceProduct}
      />
      
      <ResolutionFlow
        isOpen={isResolutionFlowOpen}
        onClose={() => setIsResolutionFlowOpen(false)}
        product={resolutionFlowProduct}
      />
    </Card>
  );
}