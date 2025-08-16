'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ProductGrid from './ProductGrid';

import type { Product } from '@/lib/types/common';

interface InfiniteScrollListProps {
  initialProducts: Product[];
  onActionClick: (productId: string, action: string) => void;
  onLoadMore: () => Promise<Product[]>;
  hasMore: boolean;
  isLoading?: boolean;
}

export default function InfiniteScrollList({ 
  initialProducts, 
  onActionClick, 
  onLoadMore, 
  hasMore, 
  isLoading = false 
}: InfiniteScrollListProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [hasMoreItems, setHasMoreItems] = useState(hasMore);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // Load more products when loading element comes into view
  const loadMore = useCallback(async () => {
    if (loading || !hasMoreItems) return;

    setLoading(true);
    try {
      const newProducts = await onLoadMore();
      setProducts(prev => [...prev, ...newProducts]);
      setHasMoreItems(newProducts.length > 0);
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMoreItems, onLoadMore]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreItems && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMoreItems, loading]);

  // Update products when initialProducts change
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Update hasMoreItems when hasMore prop changes
  useEffect(() => {
    setHasMoreItems(hasMore);
  }, [hasMore]);

  return (
    <div className="space-y-6">
      <ProductGrid 
        products={products} 
        onActionClick={onActionClick} 
        isLoading={isLoading && products.length === 0}
      />
      
      {/* Loading indicator for infinite scroll */}
      {hasMoreItems && (
        <div 
          ref={loadingRef}
          className="flex items-center justify-center py-8"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading more products...</span>
            </div>
          ) : (
            <div className="h-4" /> // Invisible element to trigger intersection
          )}
        </div>
      )}
      
      {/* End of list indicator */}
      {!hasMoreItems && products.length > 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-px bg-gray-200 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">You&apos;ve reached the end of your products</p>
        </div>
      )}
    </div>
  );
}
