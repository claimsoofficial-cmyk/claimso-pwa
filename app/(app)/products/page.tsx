'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List,
  Package,
  Shield,
  Calendar,
  DollarSign
} from 'lucide-react';
import LivingCard from '@/components/domain/products/LivingCard';
import EmptyState from '@/components/shared/EmptyState';
import ContextualHelp from '@/components/shared/ContextualHelp';
import LoadingState from '@/components/shared/LoadingState';
import { toast } from 'sonner';

interface Product {
  id: string;
  product_name: string;
  brand: string | null;
  category: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  condition: 'new' | 'used' | 'refurbished' | 'damaged';
  warranties?: Array<{
    id: string;
    warranty_end_date: string | null;
    warranty_type: string;
  }>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'price'>('name');

  const supabase = createClient();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchQuery, selectedCategory, sortBy]);

  const fetchProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: productsData, error } = await supabase
        .from('products')
        .select(`
          *,
          warranties (*)
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
  };

  const filterAndSortProducts = () => {
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
          return new Date(b.purchase_date || '').getTime() - new Date(a.purchase_date || '').getTime();
        case 'price':
          return (b.purchase_price || 0) - (a.purchase_price || 0);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  };

  const getCategories = () => {
    const categories = products.map(p => p.category).filter(Boolean) as string[];
    return ['all', ...Array.from(new Set(categories))];
  };

  const getWarrantyStatus = (product: Product) => {
    if (!product.warranties || product.warranties.length === 0) {
      return { status: 'no-warranty', label: 'No Warranty', color: 'bg-gray-100 text-gray-600' };
    }

    const activeWarranty = product.warranties.find(w => {
      if (!w.warranty_end_date) return true;
      return new Date(w.warranty_end_date) > new Date();
    });

    if (activeWarranty) {
      return { status: 'active', label: 'Active', color: 'bg-green-100 text-green-700' };
    } else {
      return { status: 'expired', label: 'Expired', color: 'bg-red-100 text-red-700' };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
        </div>
        <LoadingState type="products" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Help Button */}
      <div className="absolute top-4 right-4 z-40">
        <ContextualHelp feature="products" />
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
          <p className="text-gray-600 mt-1">
            {filteredProducts.length} of {products.length} products
          </p>
        </div>
        <Button onClick={() => window.location.href = '/products/add'}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date</option>
              <option value="price">Sort by Price</option>
            </select>

            {/* View Mode */}
            <div className="flex border border-gray-300 rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <EmptyState 
          type={searchQuery || selectedCategory !== 'all' ? 'search' : 'products'}
          title={searchQuery || selectedCategory !== 'all' ? 'No products found' : undefined}
          description={searchQuery || selectedCategory !== 'all' 
            ? 'Try adjusting your search or filters to find what you\'re looking for.'
            : undefined
          }
          showOnboarding={!searchQuery && selectedCategory === 'all'}
        />
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          : "space-y-4"
        }>
          {filteredProducts.map((product) => {
            const warrantyStatus = getWarrantyStatus(product);
            
            if (viewMode === 'list') {
              return (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{product.product_name}</h3>
                          <p className="text-sm text-gray-600">
                            {product.brand} • {product.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          {product.purchase_price && (
                            <p className="font-medium text-gray-900">
                              ${product.purchase_price.toLocaleString()}
                            </p>
                          )}
                          {product.purchase_date && (
                            <p className="text-sm text-gray-600">
                              {new Date(product.purchase_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Badge className={warrantyStatus.color}>
                          {warrantyStatus.label}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return (
              <div key={product.id}>
                <LivingCard
                  product={product as any}
                  onAddSerialNumber={() => {}}
                  onAddDocuments={() => {}}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
