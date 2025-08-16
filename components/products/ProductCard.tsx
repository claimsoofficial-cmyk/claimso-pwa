'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  DollarSign, 
  Shield, 
  Edit, 
  Eye,
  Share2,
  Trash2
} from 'lucide-react';

import type { Product } from '@/lib/types/common';

interface ProductCardProps {
  product: Product;
  onActionClick: (productId: string, action: string) => void;
  viewMode?: 'grid' | 'list';
}

export default function ProductCard({ product, onActionClick, viewMode = 'grid' }: ProductCardProps) {
  const isList = viewMode === 'list';
  
  // Calculate warranty status from warranties array
  const getWarrantyStatus = () => {
    if (!product.warranties || product.warranties.length === 0) return 'unknown';
    
    const hasActiveWarranty = product.warranties.some(w => {
      if (!w.warranty_end_date) return true;
      return new Date(w.warranty_end_date) > new Date();
    });
    
    return hasActiveWarranty ? 'active' : 'expired';
  };

  const warrantyStatus = getWarrantyStatus();

  if (isList) {
    return (
      <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
        <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          <div className="flex items-center justify-center w-full h-full text-gray-400">
            <Shield className="h-8 w-8" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {product.product_name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            {product.brand && <span>{product.brand}</span>}
            {product.purchase_price && (
              <span className="font-medium text-green-600">
                {new Intl.NumberFormat('en-US', { 
                  style: 'currency', 
                  currency: product.currency || 'USD' 
                }).format(product.purchase_price)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onActionClick(product.id, 'quick_cash')}
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Quick Cash
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onActionClick(product.id, 'view')}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onActionClick(product.id, 'edit')}>
                Edit Product
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onActionClick(product.id, 'warranty')}>
                Warranty Info
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group border border-gray-200">
      <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
        <div className="flex items-center justify-center w-full h-full text-gray-400">
          <Shield className="h-12 w-12" />
        </div>
        
        {warrantyStatus === 'expired' && (
          <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
            Expired
          </Badge>
        )}

        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/90 hover:bg-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onActionClick(product.id, 'view')}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onActionClick(product.id, 'edit')}>
                Edit Product
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onActionClick(product.id, 'warranty')}>
                Warranty Info
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
          {product.product_name}
        </h3>
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {product.brand && (
              <span className="font-medium">{product.brand}</span>
            )}
          </div>
          
          {product.purchase_price && (
            <span className="font-semibold text-green-600">
              {new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency: product.currency || 'USD' 
              }).format(product.purchase_price)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onActionClick(product.id, 'quick_cash')}
            className="flex-1"
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Quick Cash
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onActionClick(product.id, 'warranty')}
          >
            <Shield className="h-4 w-4 mr-1" />
            Warranty
          </Button>
        </div>
      </div>
    </div>
  );
}
