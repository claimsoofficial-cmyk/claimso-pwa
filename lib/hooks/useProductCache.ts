import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { Product, Warranty, UserConnection } from '@/lib/types/common';
import { createClient } from '@/lib/supabase/client';
import { useState, useCallback } from 'react';

// Query keys for different data types
export const queryKeys = {
  products: (userId?: string) => ['products', userId],
  product: (id: string) => ['product', id],
  warranties: (productId?: string) => ['warranties', productId],
  warranty: (id: string) => ['warranty', id],
  userConnections: (userId?: string) => ['userConnections', userId],
  userConnection: (id: string) => ['userConnection', id],
  productStats: (userId?: string) => ['productStats', userId],
  warrantyStats: (userId?: string) => ['warrantyStats', userId],
  opportunities: (userId?: string) => ['opportunities', userId],
  notifications: (userId?: string) => ['notifications', userId],
} as const;

// Stale time configurations (how long data is considered fresh)
const STALE_TIMES = {
  products: 5 * 60 * 1000, // 5 minutes
  product: 10 * 60 * 1000, // 10 minutes
  warranties: 15 * 60 * 1000, // 15 minutes
  userConnections: 30 * 60 * 1000, // 30 minutes
  stats: 2 * 60 * 1000, // 2 minutes
  opportunities: 1 * 60 * 1000, // 1 minute
  notifications: 30 * 1000, // 30 seconds
} as const;

// Cache time configurations (how long data stays in cache)
const CACHE_TIMES = {
  products: 30 * 60 * 1000, // 30 minutes
  product: 60 * 60 * 1000, // 1 hour
  warranties: 60 * 60 * 1000, // 1 hour
  userConnections: 2 * 60 * 60 * 1000, // 2 hours
  stats: 10 * 60 * 1000, // 10 minutes
  opportunities: 5 * 60 * 1000, // 5 minutes
  notifications: 5 * 60 * 1000, // 5 minutes
} as const;

// API functions for data fetching
const api = {
  // Products
  async getProducts(userId?: string): Promise<Product[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getProduct(id: string): Promise<Product> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteProduct(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Warranties
  async getWarranties(productId?: string): Promise<Warranty[]> {
    const supabase = createClient();
    let query = supabase.from('warranties').select('*');
    
    if (productId) {
      query = query.eq('product_id', productId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getWarranty(id: string): Promise<Warranty> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('warranties')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // User Connections
  async getUserConnections(userId?: string): Promise<UserConnection[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Stats
  async getProductStats(userId?: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const products = data || [];
    return {
      total: products.length,
      byCategory: products.reduce((acc, product) => {
        const category = product.category || 'Unknown';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalValue: products.reduce((sum, product) => sum + (product.purchase_price || 0), 0),
      averageValue: products.length > 0 ? products.reduce((sum, product) => sum + (product.purchase_price || 0), 0) / products.length : 0,
    };
  },

  async getWarrantyStats(userId?: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('warranties')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const warranties = data || [];
    return {
      total: warranties.length,
      active: warranties.filter(w => new Date(w.expiry_date) > new Date()).length,
      expiringSoon: warranties.filter(w => {
        const expiry = new Date(w.expiry_date);
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return expiry > now && expiry <= thirtyDaysFromNow;
      }).length,
    };
  },
};

// Custom hooks for data fetching with caching
export const useProducts = (userId?: string, options?: UseQueryOptions<Product[]>) => {
  return useQuery({
    queryKey: queryKeys.products(userId),
    queryFn: () => api.getProducts(userId),
    staleTime: STALE_TIMES.products,
    gcTime: CACHE_TIMES.products,
    enabled: !!userId,
    ...options,
  });
};

export const useProduct = (id: string, options?: UseQueryOptions<Product>) => {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => api.getProduct(id),
    staleTime: STALE_TIMES.product,
    gcTime: CACHE_TIMES.product,
    enabled: !!id,
    ...options,
  });
};

export const useWarranties = (productId?: string, options?: UseQueryOptions<Warranty[]>) => {
  return useQuery({
    queryKey: queryKeys.warranties(productId),
    queryFn: () => api.getWarranties(productId),
    staleTime: STALE_TIMES.warranties,
    gcTime: CACHE_TIMES.warranties,
    enabled: !!productId,
    ...options,
  });
};

export const useWarranty = (id: string, options?: UseQueryOptions<Warranty>) => {
  return useQuery({
    queryKey: queryKeys.warranty(id),
    queryFn: () => api.getWarranty(id),
    staleTime: STALE_TIMES.warranties,
    gcTime: CACHE_TIMES.warranties,
    enabled: !!id,
    ...options,
  });
};

export const useUserConnections = (userId?: string, options?: UseQueryOptions<UserConnection[]>) => {
  return useQuery({
    queryKey: queryKeys.userConnections(userId),
    queryFn: () => api.getUserConnections(userId),
    staleTime: STALE_TIMES.userConnections,
    gcTime: CACHE_TIMES.userConnections,
    enabled: !!userId,
    ...options,
  });
};

export const useProductStats = (userId?: string, options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: queryKeys.productStats(userId),
    queryFn: () => api.getProductStats(userId),
    staleTime: STALE_TIMES.stats,
    gcTime: CACHE_TIMES.stats,
    enabled: !!userId,
    ...options,
  });
};

export const useWarrantyStats = (userId?: string, options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: queryKeys.warrantyStats(userId),
    queryFn: () => api.getWarrantyStats(userId),
    staleTime: STALE_TIMES.stats,
    gcTime: CACHE_TIMES.stats,
    enabled: !!userId,
    ...options,
  });
};

// Mutation hooks for data updates
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createProduct,
    onSuccess: (newProduct) => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: queryKeys.products(newProduct.user_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.productStats(newProduct.user_id) });
      
      // Add the new product to the cache
      queryClient.setQueryData(
        queryKeys.products(newProduct.user_id),
        (old: Product[] | undefined) => old ? [newProduct, ...old] : [newProduct]
      );
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) =>
      api.updateProduct(id, updates),
    onSuccess: (updatedProduct) => {
      // Update the specific product in cache
      queryClient.setQueryData(queryKeys.product(updatedProduct.id), updatedProduct);
      
      // Update the product in the products list
      queryClient.setQueryData(
        queryKeys.products(updatedProduct.user_id),
        (old: Product[] | undefined) =>
          old?.map(product => product.id === updatedProduct.id ? updatedProduct : product)
      );
      
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: queryKeys.productStats(updatedProduct.user_id) });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deleteProduct,
    onSuccess: (_, deletedId) => {
      // Remove the product from all caches
      queryClient.removeQueries({ queryKey: queryKeys.product(deletedId) });
      
      // Update products lists by removing the deleted product
      queryClient.setQueriesData(
        { queryKey: queryKeys.products() },
        (old: Product[] | undefined) => old?.filter(product => product.id !== deletedId)
      );
    },
  });
};

// Cache management utilities
export const useCacheManagement = () => {
  const queryClient = useQueryClient();
  
  return {
    // Clear all cache
    clearAllCache: () => queryClient.clear(),
    
    // Clear specific cache
    clearCache: (queryKey: string[]) => queryClient.removeQueries({ queryKey }),
    
    // Prefetch data
    prefetchProducts: (userId: string) =>
      queryClient.prefetchQuery({
        queryKey: queryKeys.products(userId),
        queryFn: () => api.getProducts(userId),
        staleTime: STALE_TIMES.products,
        gcTime: CACHE_TIMES.products,
      }),
    
    // Get cache size
    getCacheSize: () => queryClient.getQueryCache().getAll().length,
    
    // Get cache statistics
    getCacheStats: () => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      
      return {
        totalQueries: queries.length,
        activeQueries: queries.filter(q => q.isActive()).length,
        staleQueries: queries.filter(q => q.isStale()).length,
        fetchingQueries: queries.filter(q => q.state.status === 'pending').length,
      };
    },
  };
};

// Performance monitoring hook
export const useCachePerformance = () => {
  const [metrics, setMetrics] = useState({
    cacheHits: 0,
    cacheMisses: 0,
    averageQueryTime: 0,
    totalQueries: 0,
  });

  const recordQuery = useCallback((queryTime: number, fromCache: boolean) => {
    setMetrics(prev => ({
      cacheHits: prev.cacheHits + (fromCache ? 1 : 0),
      cacheMisses: prev.cacheMisses + (fromCache ? 0 : 1),
      totalQueries: prev.totalQueries + 1,
      averageQueryTime: (prev.averageQueryTime * prev.totalQueries + queryTime) / (prev.totalQueries + 1),
    }));
  }, []);

  return { metrics, recordQuery };
};
