'use client';

import React from 'react';
import ProductCard from './ProductCard';
import { useUIState } from '../layout/UIStateContext';

import type { Product } from '@/lib/types/common';

interface ProductGridProps {
  products: Product[];
  onActionClick: (productId: string, action: string) => void;
  isLoading?: boolean;
}

export default function ProductGrid({ products, onActionClick, isLoading = false }: ProductGridProps) {
  const { viewMode, isMobile, isTablet, isDesktop } = useUIState();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 animate-pulse">
            <div className="w-full aspect-video bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded flex-1" />
                <div className="h-8 bg-gray-200 rounded w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-500 mb-6">Start by adding your first product to your vault.</p>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Add Your First Product
        </button>
      </div>
    );
  }

  // Determine grid columns based on screen size and view mode
  const getGridCols = () => {
    if (viewMode === 'list') {
      return 'grid-cols-1';
    }
    
    if (isMobile) {
      return 'grid-cols-1';
    }
    
    if (isTablet) {
      return 'grid-cols-2';
    }
    
    if (isDesktop) {
      return 'grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
    }
    
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
  };

  return (
    <div className={`grid ${getGridCols()} gap-4`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onActionClick={onActionClick}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
}
