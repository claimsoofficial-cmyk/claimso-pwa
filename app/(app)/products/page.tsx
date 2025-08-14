'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Search, 
  Grid, 
  List,
  Package,
  Calendar,
  DollarSign,
  Eye,
  ArrowRight,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { Product } from '@/lib/types/common';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'price'>('date');

  const supabase = createClient();

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
        toast.error('Failed to load products');
      } else {
        setProducts(productsData || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filterAndSortProducts = useCallback(() => {
    let filtered = products;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.product_name.localeCompare(b.product_name);
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'price':
          return (b.purchase_price || 0) - (a.purchase_price || 0);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory, sortBy]);

  useEffect(() => {
    filterAndSortProducts();
  }, [filterAndSortProducts]);

  const getCategories = () => {
    const categories = products.map(p => p.category).filter(Boolean) as string[];
    return ['all', ...Array.from(new Set(categories))];
  };

  const getWarrantyStatus = (product: Product) => {
    const warranties = product.warranties || [];
    if (warranties.length === 0) {
      return { status: 'none', label: 'No Warranty', color: 'bg-red-100 text-red-700' };
    }

    const activeWarranty = warranties.find(w => {
      if (!w.warranty_end_date) return true;
      return new Date(w.warranty_end_date) > new Date();
    });

    if (activeWarranty) {
      return { status: 'active', label: 'Protected', color: 'bg-green-100 text-green-700' };
    } else {
      return { status: 'expired', label: 'Expired', color: 'bg-orange-100 text-orange-700' };
    }
  };

  const getPrimaryImage = (product: Product) => {
    const documents = product.documents || [];
    return documents.find(doc => 
      doc.document_type === 'photo' && doc.is_primary
    )?.file_url;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Filters Skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Products Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-48 w-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">
            Manage your product inventory and warranty coverage
          </p>
        </div>
        
        <Button 
          onClick={() => window.location.href = '/products/add'}
          className="hover-lift"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {getCategories().map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'price')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Date Added</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
            </select>

            {/* View Mode */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid/List */}
      {filteredProducts.length > 0 ? (
        <div className={cn(
          "gap-6",
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
            : "space-y-4"
        )}>
          {filteredProducts.map((product) => {
            const warrantyStatus = getWarrantyStatus(product);
            const primaryImage = getPrimaryImage(product);
            
            return (
              <Card 
                key={product.id} 
                className={cn(
                  "card-hover cursor-pointer",
                  viewMode === 'list' && "flex"
                )}
                onClick={() => window.location.href = `/products/${product.id}`}
              >
                <CardContent className={cn(
                  "p-6",
                  viewMode === 'list' && "flex items-center gap-6 w-full"
                )}>
                  {/* Product Image */}
                  <div className={cn(
                    "relative overflow-hidden rounded-lg",
                    viewMode === 'grid' ? "h-48 mb-4" : "w-24 h-24 flex-shrink-0"
                  )}>
                    {primaryImage ? (
                      <Image
                        src={primaryImage}
                        alt={product.product_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className={cn(
                    "flex-1",
                    viewMode === 'list' && "flex items-center justify-between"
                  )}>
                    <div className={viewMode === 'list' ? "flex-1" : ""}>
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                        {product.product_name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {product.brand} • {product.category}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        {product.purchase_price && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {product.purchase_price.toLocaleString()}
                          </span>
                        )}
                        {product.purchase_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(product.purchase_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={warrantyStatus.color}>
                          {warrantyStatus.label}
                        </Badge>
                        {product.warranties && product.warranties.length > 1 && (
                          <Badge variant="outline" className="text-xs">
                            {product.warranties.length} warranties
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {viewMode === 'list' && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/products/${product.id}`;
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/products/${product.id}/edit`;
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || selectedCategory !== 'all' ? 'No products found' : 'No products yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Start by adding your first product to track warranties and manage claims'
              }
            </p>
            <Button 
              onClick={() => window.location.href = '/products/add'}
              className="hover-lift"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Product
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {filteredProducts.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Showing {filteredProducts.length} of {products.length} products
                </p>
                <p className="text-sm text-gray-600">
                  Total value: ${filteredProducts.reduce((sum, p) => sum + (p.purchase_price || 0), 0).toLocaleString()}
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/analytics'}
                className="hover-lift"
              >
                View Analytics
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
