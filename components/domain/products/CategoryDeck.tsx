'use client';

import React from 'react';
import type { Product } from '@/lib/types/common';
import CategoryCard from './CategoryCard';

interface CategoryDeckProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onFileClaim: (product: Product) => void;
  onQuickCash: (product: Product) => void;
  onWarrantyDatabase: (product: Product) => void;
}

export default function CategoryDeck({
  products,
  onEditProduct,
  onDeleteProduct,
  onFileClaim,
  onQuickCash,
  onWarrantyDatabase
}: CategoryDeckProps) {
  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    const category = product.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Sort categories by priority (products with expiring warranties first)
  const sortedCategories = Object.entries(productsByCategory).sort(([, productsA], [, productsB]) => {
    const getExpiringCount = (products: Product[]) => {
      return products.filter(p => {
        if (!p.warranties || !Array.isArray(p.warranties)) return false;
        return p.warranties.some(w => {
          if (!w.warranty_end_date) return false;
          const endDate = new Date(w.warranty_end_date);
          const now = new Date();
          const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
        });
      }).length;
    };

    const expiringA = getExpiringCount(productsA);
    const expiringB = getExpiringCount(productsB);

    // Sort by expiring warranties first, then by total value
    if (expiringA !== expiringB) {
      return expiringB - expiringA;
    }

    const totalValueA = productsA.reduce((sum, p) => sum + (p.purchase_price || 0), 0);
    const totalValueB = productsB.reduce((sum, p) => sum + (p.purchase_price || 0), 0);
    return totalValueB - totalValueA;
  });

  return (
    <div className="space-y-4">
      {sortedCategories.map(([category, categoryProducts]) => (
        <CategoryCard
          key={category}
          category={category}
          products={categoryProducts}
          onEditProduct={onEditProduct}
          onDeleteProduct={onDeleteProduct}
          onFileClaim={onFileClaim}
          onQuickCash={onQuickCash}
          onWarrantyDatabase={onWarrantyDatabase}
        />
      ))}
    </div>
  );
}
