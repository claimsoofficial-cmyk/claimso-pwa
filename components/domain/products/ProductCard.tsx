'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Shield, 
  DollarSign, 
  Calendar,
  Edit,
  Trash2,
  FileText,
  Zap,
  Database,
  MoreHorizontal
} from 'lucide-react';
import type { Product } from '@/lib/types/common';

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onFileClaim: () => void;
  onQuickCash: () => void;
  onWarrantyDatabase: () => void;
}

export default function ProductCard({
  product,
  onEdit,
  onDelete,
  onFileClaim,
  onQuickCash,
  onWarrantyDatabase
}: ProductCardProps) {
  const [showActions, setShowActions] = useState(false);

  // Calculate warranty status
  const activeWarranties = product.warranties?.filter(w => {
    if (!w.warranty_end_date) return true;
    return new Date(w.warranty_end_date) > new Date();
  }) || [];

  const expiringWarranties = product.warranties?.filter(w => {
    if (!w.warranty_end_date) return false;
    const endDate = new Date(w.warranty_end_date);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  }) || [];

  const expiredWarranties = product.warranties?.filter(w => {
    if (!w.warranty_end_date) return false;
    return new Date(w.warranty_end_date) <= new Date();
  }) || [];

  const getWarrantyStatus = () => {
    if (expiringWarranties.length > 0) return 'expiring';
    if (expiredWarranties.length > 0 && activeWarranties.length === 0) return 'expired';
    if (activeWarranties.length > 0) return 'active';
    return 'none';
  };

  const warrantyStatus = getWarrantyStatus();

  const getWarrantyBadge = () => {
    switch (warrantyStatus) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'expiring':
        return <Badge className="bg-yellow-100 text-yellow-800">Expiring Soon</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      default:
        return <Badge variant="secondary">No Warranty</Badge>;
    }
  };

  return (
    <Card className="h-full bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {product.product_name}
            </h3>
            {product.brand && (
              <p className="text-sm text-gray-600">{product.brand}</p>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="h-8 w-8 p-0"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Actions Menu */}
        {showActions && (
          <div className="absolute top-12 right-2 bg-white border rounded-lg shadow-lg z-50 p-2 min-w-32">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
                setShowActions(false);
              }}
              className="w-full justify-start"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onFileClaim();
                setShowActions(false);
              }}
              className="w-full justify-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              File Claim
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onQuickCash();
                setShowActions(false);
              }}
              className="w-full justify-start"
            >
              <Zap className="h-4 w-4 mr-2" />
              Quick Cash
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onWarrantyDatabase();
                setShowActions(false);
              }}
              className="w-full justify-start"
            >
              <Database className="h-4 w-4 mr-2" />
              Warranty DB
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setShowActions(false);
              }}
              className="w-full justify-start text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}

        {/* Product Info */}
        <div className="space-y-2 mb-3">
          {/* Price */}
          {product.purchase_price && (
            <div className="flex items-center gap-1 text-sm">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-medium">${product.purchase_price.toLocaleString()}</span>
            </div>
          )}

          {/* Purchase Date */}
          {product.purchase_date && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{new Date(product.purchase_date).toLocaleDateString()}</span>
            </div>
          )}

          {/* Category */}
          {product.category && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Package className="h-4 w-4" />
              <span>{product.category}</span>
            </div>
          )}
        </div>

        {/* Warranty Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4 text-blue-600" />
            {getWarrantyBadge()}
          </div>
          
          {/* Warranty Count */}
          {product.warranties && product.warranties.length > 0 && (
            <span className="text-xs text-gray-500">
              {product.warranties.length} warranty{product.warranties.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Expiring Warning */}
        {expiringWarranties.length > 0 && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            ⚠️ {expiringWarranties.length} warranty{expiringWarranties.length !== 1 ? 's' : ''} expiring soon
          </div>
        )}
      </CardContent>
    </Card>
  );
}
