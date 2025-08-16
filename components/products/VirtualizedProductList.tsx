'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import ProductCard from './ProductCard';
import { Product } from '@/lib/types/common';
import { useInView } from 'react-intersection-observer';

interface VirtualizedProductListProps {
  products: Product[];
  itemHeight?: number;
  containerHeight?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  onActionClick?: (productId: string, action: string) => void;
}

const ITEM_HEIGHT = 280; // Height of each product card
const CONTAINER_HEIGHT = 600; // Default container height

export const VirtualizedProductList: React.FC<VirtualizedProductListProps> = ({
  products,
  itemHeight = ITEM_HEIGHT,
  containerHeight = CONTAINER_HEIGHT,
  onLoadMore,
  hasMore = false,
  loading = false,
  onActionClick
}) => {
  const [listRef, setListRef] = useState<List | null>(null);
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  // Trigger load more when the last item comes into view
  useEffect(() => {
    if (inView && hasMore && !loading && onLoadMore) {
      onLoadMore();
    }
  }, [inView, hasMore, loading, onLoadMore]);

  // Memoize the row renderer to prevent unnecessary re-renders
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const product = products[index];
    
    if (!product) {
      return (
        <div style={style} className="flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 rounded-lg w-full h-64"></div>
        </div>
      );
    }

    return (
      <div style={style} className="px-2 py-1">
        <ProductCard 
          product={product} 
          onActionClick={onActionClick || (() => {})}
        />
      </div>
    );
  }, [products]);

  // Memoize the item data to prevent unnecessary re-renders
  const itemData = useMemo(() => products, [products]);

  // Handle scroll to top
  const scrollToTop = useCallback(() => {
    if (listRef) {
      listRef.scrollToItem(0);
    }
  }, [listRef]);

  // Handle scroll to specific item
  const scrollToItem = useCallback((index: number) => {
    if (listRef && index >= 0 && index < products.length) {
      listRef.scrollToItem(index, 'center');
    }
  }, [listRef, products.length]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!listRef) return;
    
    switch (event.key) {
      case 'Home':
        event.preventDefault();
        scrollToTop();
        break;
      case 'End':
        event.preventDefault();
        scrollToItem(products.length - 1);
        break;
    }
  }, [listRef, scrollToItem, scrollToTop, products.length]);

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-400 text-lg">No products found</div>
          <div className="text-gray-300 text-sm">Add your first product to get started</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="virtualized-product-list"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <List
        ref={setListRef}
        height={containerHeight}
        width="100%"
        itemCount={products.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={5} // Render 5 items outside the viewport for smooth scrolling
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {Row}
      </List>
      
      {/* Load more trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="h-4 flex items-center justify-center">
          {loading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-500">Loading more products...</span>
            </div>
          )}
        </div>
      )}
      
      {/* Scroll to top button */}
      {products.length > 10 && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="Scroll to top"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Performance monitoring hook
export const useVirtualizedListPerformance = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    scrollPerformance: 0,
    memoryUsage: 0
  });

  const measurePerformance = useCallback((callback: () => void) => {
    const startTime = performance.now();
    callback();
    const endTime = performance.now();
    
    setMetrics(prev => ({
      ...prev,
      renderTime: endTime - startTime
    }));
  }, []);

  return { metrics, measurePerformance };
};
