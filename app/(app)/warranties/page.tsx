'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Plus
} from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import ContextualHelp from '@/components/shared/ContextualHelp';
import LoadingState from '@/components/shared/LoadingState';
import { toast } from 'sonner';

interface Warranty {
  id: string;
  warranty_type: 'manufacturer' | 'extended' | 'store' | 'insurance';
  warranty_start_date: string | null;
  warranty_end_date: string | null;
  warranty_duration_months: number | null;
  coverage_details: string | null;
  products: {
    id: string;
    product_name: string;
    brand: string | null;
    category: string | null;
  };
}

export default function WarrantiesPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'expiring'>('all');

  const supabase = createClient();

  useEffect(() => {
    fetchWarranties();
  }, []);

  const fetchWarranties = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: warrantiesData, error } = await supabase
        .from('warranties')
        .select(`
          *,
          products (
            id,
            product_name,
            brand,
            category
          )
        `)
        .order('warranty_end_date', { ascending: true });

      if (error) {
        console.error('Error fetching warranties:', error);
        toast.error('Failed to load warranties');
      } else {
        setWarranties(warrantiesData || []);
      }
    } catch (error) {
      console.error('Error fetching warranties:', error);
      toast.error('Failed to load warranties');
    } finally {
      setIsLoading(false);
    }
  };

  const getWarrantyStatus = (warranty: Warranty) => {
    if (!warranty.warranty_end_date) {
      return { status: 'active', label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle };
    }

    const endDate = new Date(warranty.warranty_end_date);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Expired', color: 'bg-red-100 text-red-700', icon: XCircle };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', label: 'Expiring Soon', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle };
    } else {
      return { status: 'active', label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle };
    }
  };

  const getFilteredWarranties = () => {
    switch (filter) {
      case 'active':
        return warranties.filter(w => getWarrantyStatus(w).status === 'active');
      case 'expired':
        return warranties.filter(w => getWarrantyStatus(w).status === 'expired');
      case 'expiring':
        return warranties.filter(w => getWarrantyStatus(w).status === 'expiring');
      default:
        return warranties;
    }
  };

  const getWarrantyTypeLabel = (type: string) => {
    switch (type) {
      case 'manufacturer':
        return 'Manufacturer';
      case 'extended':
        return 'Extended';
      case 'store':
        return 'Store';
      case 'insurance':
        return 'Insurance';
      default:
        return type;
    }
  };

  const getDaysUntilExpiry = (warranty: Warranty) => {
    if (!warranty.warranty_end_date) return null;
    
    const endDate = new Date(warranty.warranty_end_date);
    const now = new Date();
    const days = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days < 0) {
      return `${Math.abs(days)} days ago`;
    } else if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Tomorrow';
    } else {
      return `${days} days`;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Warranties</h1>
        </div>
        <LoadingState type="warranties" />
      </div>
    );
  }

  const filteredWarranties = getFilteredWarranties();

  return (
    <div className="space-y-6">
      {/* Help Button */}
      <div className="absolute top-4 right-4 z-40">
        <ContextualHelp feature="warranties" />
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Warranties</h1>
          <p className="text-gray-600 mt-1">
            {filteredWarranties.length} of {warranties.length} warranties
          </p>
        </div>
        <Button onClick={() => window.location.href = '/warranties/extended'}>
          <Plus className="w-4 h-4 mr-2" />
          Get Extended Warranty
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'all', label: 'All', count: warranties.length },
          { key: 'active', label: 'Active', count: warranties.filter(w => getWarrantyStatus(w).status === 'active').length },
          { key: 'expiring', label: 'Expiring', count: warranties.filter(w => getWarrantyStatus(w).status === 'expiring').length },
          { key: 'expired', label: 'Expired', count: warranties.filter(w => getWarrantyStatus(w).status === 'expired').length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Warranties Grid */}
      {filteredWarranties.length === 0 ? (
        <EmptyState 
          type="warranties"
          title={filter !== 'all' ? 'No warranties found' : undefined}
          description={filter !== 'all' 
            ? 'No warranties match your current filter. Try adjusting your filter settings.'
            : undefined
          }
          showOnboarding={filter === 'all'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWarranties.map((warranty) => {
            const status = getWarrantyStatus(warranty);
            const StatusIcon = status.icon;
            const daysUntilExpiry = getDaysUntilExpiry(warranty);

            return (
              <Card key={warranty.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600">
                        {getWarrantyTypeLabel(warranty.warranty_type)}
                      </span>
                    </div>
                    <Badge className={status.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Product Info */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">
                      {warranty.products.product_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {warranty.products.brand} • {warranty.products.category}
                    </p>
                  </div>

                  {/* Coverage Details */}
                  {warranty.coverage_details && (
                    <div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {warranty.coverage_details}
                      </p>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="space-y-2">
                    {warranty.warranty_start_date && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Started: {new Date(warranty.warranty_start_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {warranty.warranty_end_date && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          {status.status === 'expired' ? 'Expired: ' : 'Expires: '}
                          {new Date(warranty.warranty_end_date).toLocaleDateString()}
                          {daysUntilExpiry && (
                            <span className="ml-1 text-xs">
                              ({daysUntilExpiry})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.location.href = `/products/${warranty.products.id}`}
                    >
                      View Product
                    </Button>
                    {status.status === 'expired' && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => window.location.href = '/warranties/extended'}
                      >
                        Get Extended
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
