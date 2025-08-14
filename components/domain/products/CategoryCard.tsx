'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Package, Shield, DollarSign } from 'lucide-react';
import type { Product } from '@/lib/types/common';
import ProductCard from './ProductCard';

interface CategoryCardProps {
  category: string;
  products: Product[];
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onFileClaim: (product: Product) => void;
  onQuickCash: (product: Product) => void;
  onWarrantyDatabase: (product: Product) => void;
}

export default function CategoryCard({
  category,
  products,
  onEditProduct,
  onDeleteProduct,
  onFileClaim,
  onQuickCash,
  onWarrantyDatabase
}: CategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Calculate category stats
  const totalValue = products.reduce((sum, p) => sum + (p.purchase_price || 0), 0);
  const activeWarranties = products.filter(p => {
    if (!p.warranties || !Array.isArray(p.warranties)) return false;
    return p.warranties.some(w => {
      if (!w.warranty_end_date) return true;
      return new Date(w.warranty_end_date) > new Date();
    });
  }).length;

  const expiringWarranties = products.filter(p => {
    if (!p.warranties || !Array.isArray(p.warranties)) return false;
    return p.warranties.some(w => {
      if (!w.warranty_end_date) return false;
      const endDate = new Date(w.warranty_end_date);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    });
  }).length;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setCurrentCardIndex(0);
    }
  };

  const handleNextCard = () => {
    if (currentCardIndex < products.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const visibleCards = isExpanded ? products.slice(currentCardIndex, currentCardIndex + 3) : [];
  const remainingCards = products.length - (currentCardIndex + 3);

  return (
    <Card className="mb-4 border-2 border-gray-100 hover:border-blue-200 transition-colors">
      <CardHeader 
        className="cursor-pointer pb-3"
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
              <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
            </div>
            <Badge variant="secondary" className="text-sm">
              {products.length} items
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>${totalValue.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              <span>{activeWarranties} active</span>
            </div>
            {expiringWarranties > 0 && (
              <Badge variant="destructive" className="text-xs">
                {expiringWarranties} expiring
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Card Deck */}
          <div className="relative h-64 mb-4">
            {visibleCards.map((product, index) => (
              <div
                key={product.id}
                className={`absolute top-0 left-0 w-full transition-all duration-300 ${
                  index === 0 ? 'z-30 transform translate-y-0' :
                  index === 1 ? 'z-20 transform translate-y-2 translate-x-2 opacity-80' :
                  'z-10 transform translate-y-4 translate-x-4 opacity-60'
                }`}
                style={{
                  transform: index === 0 ? 'translateY(0)' :
                           index === 1 ? 'translateY(8px) translateX(8px)' :
                           'translateY(16px) translateX(16px)'
                }}
              >
                <ProductCard
                  product={product}
                  onEdit={() => onEditProduct(product)}
                  onDelete={() => onDeleteProduct(product.id)}
                  onFileClaim={() => onFileClaim(product)}
                  onQuickCash={() => onQuickCash(product)}
                  onWarrantyDatabase={() => onWarrantyDatabase(product)}
                />
              </div>
            ))}
            
            {/* Navigation Controls */}
            <div className="absolute bottom-2 right-2 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrevCard}
                disabled={currentCardIndex === 0}
                className="h-8 w-8 p-0"
              >
                ←
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleNextCard}
                disabled={currentCardIndex >= products.length - 3}
                className="h-8 w-8 p-0"
              >
                →
              </Button>
            </div>

            {/* Card Counter */}
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="text-xs">
                {currentCardIndex + 1}-{Math.min(currentCardIndex + 3, products.length)} of {products.length}
              </Badge>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>Tap card for quick actions</span>
            </div>
            {remainingCards > 0 && (
              <span className="text-blue-600">
                +{remainingCards} more cards
              </span>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
