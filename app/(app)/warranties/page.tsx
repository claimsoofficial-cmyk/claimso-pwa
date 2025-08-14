'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  DollarSign,
  Package,
  ArrowRight,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Warranty {
  id: string;
  warranty_start_date: string | null;
  warranty_end_date: string | null;
  warranty_duration_months: number | null;
  warranty_type: 'manufacturer' | 'extended' | 'store' | 'insurance';
  coverage_details: string | null;
  ai_confidence_score: number | null;
  products: {
    id: string;
    product_name: string;
    brand: string | null;
    category: string | null;
    purchase_price: number | null;
  };
}

export default function WarrantiesPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [filteredWarranties, setFilteredWarranties] = useState<Warranty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'expired' | 'expiring'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const supabase = createClient();

  useEffect(() => {
    fetchWarranties();
  }, []);

  useEffect(() => {
    filterWarranties();
  }, [warranties, searchQuery, selectedStatus, selectedType]);

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
            category,
            purchase_price
          )
        `)
        .eq('products.user_id', user.id)
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

  const filterWarranties = () => {
    let filtered = warranties;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(warranty =>
        warranty.products.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        warranty.products.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        warranty.coverage_details?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(warranty => {
        const status = getWarrantyStatus(warranty);
        return status.status === selectedStatus;
      });
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(warranty => warranty.warranty_type === selectedType);
    }

    setFilteredWarranties(filtered);
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
      return { status: 'expiring', label: 'Expiring Soon', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle };
    } else {
      return { status: 'active', label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle };
    }
  };

  const getWarrantyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      manufacturer: 'Manufacturer',
      extended: 'Extended',
      store: 'Store',
      insurance: 'Insurance'
    };
    return labels[type] || type;
  };

  const getWarrantyTypes = () => {
    const types = warranties.map(w => w.warranty_type);
    return ['all', ...Array.from(new Set(types))];
  };

  const getStats = () => {
    const active = warranties.filter(w => getWarrantyStatus(w).status === 'active').length;
    const expired = warranties.filter(w => getWarrantyStatus(w).status === 'expired').length;
    const expiring = warranties.filter(w => getWarrantyStatus(w).status === 'expiring').length;
    const totalValue = warranties.reduce((sum, w) => sum + (w.products.purchase_price || 0), 0);

    return { active, expired, expiring, totalValue };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-6 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>

        {/* Warranties Skeleton */}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div>
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Warranties</h1>
          <p className="text-gray-600 mt-1">
            Track and manage your warranty coverage
          </p>
        </div>
        
        <Button 
          onClick={() => window.location.href = '/products/add'}
          className="hover-lift"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Warranties</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900">{stats.expiring}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalValue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search warranties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expiring">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              {getWarrantyTypes().slice(1).map(type => (
                <option key={type} value={type}>
                  {getWarrantyTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Warranties List */}
      {filteredWarranties.length > 0 ? (
        <div className="space-y-4">
          {filteredWarranties.map((warranty) => {
            const status = getWarrantyStatus(warranty);
            const StatusIcon = status.icon;
            const daysUntilExpiry = warranty.warranty_end_date 
              ? Math.ceil((new Date(warranty.warranty_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <Card key={warranty.id} className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {warranty.products.product_name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {warranty.products.brand} • {getWarrantyTypeLabel(warranty.warranty_type)} Warranty
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {warranty.warranty_start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Started: {new Date(warranty.warranty_start_date).toLocaleDateString()}
                            </span>
                          )}
                          {warranty.warranty_end_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {daysUntilExpiry && daysUntilExpiry > 0 
                                ? `${daysUntilExpiry} days left`
                                : daysUntilExpiry === 0 
                                  ? 'Expires today'
                                  : 'Expired'
                              }
                            </span>
                          )}
                          {warranty.products.purchase_price && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              ${warranty.products.purchase_price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={status.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/products/${warranty.products.id}`}
                        className="hover-lift"
                      >
                        View Product
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || selectedStatus !== 'all' || selectedType !== 'all' ? 'No warranties found' : 'No warranties yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || selectedStatus !== 'all' || selectedType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add products to start tracking warranty coverage'
              }
            </p>
            <Button 
              onClick={() => window.location.href = '/products/add'}
              className="hover-lift"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {filteredWarranties.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Showing {filteredWarranties.length} of {warranties.length} warranties
                </p>
                <p className="text-sm text-gray-600">
                  Protected value: ${filteredWarranties.reduce((sum, w) => sum + (w.products.purchase_price || 0), 0).toLocaleString()}
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/analytics'}
                className="hover-lift"
              >
                View Analytics
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
