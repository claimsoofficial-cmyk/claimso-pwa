'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  DollarSign,
  Package,
  ArrowRight,
  Plus,
  Search,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Claim {
  id: string;
  claim_type: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress';
  description: string;
  claim_amount: number | null;
  created_at: string;
  updated_at: string;
  products: {
    id: string;
    product_name: string;
    brand: string | null;
    category: string | null;
  };
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const supabase = createClient();

  useEffect(() => {
    fetchClaims();
  }, []);

  useEffect(() => {
    filterClaims();
  }, [claims, searchQuery, selectedStatus]);

  const fetchClaims = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: claimsData, error } = await supabase
        .from('claims')
        .select(`
          *,
          products (
            id,
            product_name,
            brand,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching claims:', error);
        toast.error('Failed to load claims');
      } else {
        setClaims(claimsData || []);
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
      toast.error('Failed to load claims');
    } finally {
      setIsLoading(false);
    }
  };

  const filterClaims = () => {
    let filtered = claims;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(claim =>
        claim.products.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.products.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.claim_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(claim => claim.status === selectedStatus);
    }

    setFilteredClaims(filtered);
  };

  const getStatusInfo = (status: string) => {
    const statusMap = {
      pending: {
        label: 'Pending',
        color: 'bg-yellow-100 text-yellow-700',
        icon: Clock
      },
      approved: {
        label: 'Approved',
        color: 'bg-green-100 text-green-700',
        icon: CheckCircle
      },
      rejected: {
        label: 'Rejected',
        color: 'bg-red-100 text-red-700',
        icon: XCircle
      },
      in_progress: {
        label: 'In Progress',
        color: 'bg-blue-100 text-blue-700',
        icon: AlertTriangle
      }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const getClaimTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      repair: 'Repair',
      replacement: 'Replacement',
      refund: 'Refund',
      partial_refund: 'Partial Refund',
      extended_warranty: 'Extended Warranty'
    };
    return labels[type] || type;
  };

  const getStats = () => {
    const pending = claims.filter(c => c.status === 'pending').length;
    const approved = claims.filter(c => c.status === 'approved').length;
    const rejected = claims.filter(c => c.status === 'rejected').length;
    const inProgress = claims.filter(c => c.status === 'in_progress').length;
    const totalAmount = claims.reduce((sum, c) => sum + (c.claim_amount || 0), 0);

    return { pending, approved, rejected, inProgress, totalAmount };
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
            </div>
          </CardContent>
        </Card>

        {/* Claims Skeleton */}
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
          <h1 className="text-3xl font-bold text-gray-900">Claims</h1>
          <p className="text-gray-600 mt-1">
            Track and manage your warranty claims
          </p>
        </div>
        
        <Button 
          onClick={() => window.location.href = '/claims/new'}
          className="hover-lift"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Claim
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
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
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-purple-600" />
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
                placeholder="Search claims..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Claims List */}
      {filteredClaims.length > 0 ? (
        <div className="space-y-4">
          {filteredClaims.map((claim) => {
            const statusInfo = getStatusInfo(claim.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card key={claim.id} className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {claim.products.product_name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {claim.products.brand} • {getClaimTypeLabel(claim.claim_type)}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(claim.created_at).toLocaleDateString()}
                          </span>
                          {claim.claim_amount && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              ${claim.claim_amount.toLocaleString()}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            {claim.products.category}
                          </span>
                        </div>
                        {claim.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {claim.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/claims/${claim.id}`}
                        className="hover-lift"
                      >
                        View Details
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
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || selectedStatus !== 'all' ? 'No claims found' : 'No claims yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || selectedStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'File your first warranty claim to get started'
              }
            </p>
            <Button 
              onClick={() => window.location.href = '/claims/new'}
              className="hover-lift"
            >
              <Plus className="w-4 h-4 mr-2" />
              File a Claim
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {filteredClaims.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Showing {filteredClaims.length} of {claims.length} claims
                </p>
                <p className="text-sm text-gray-600">
                  Total claim value: ${filteredClaims.reduce((sum, c) => sum + (c.claim_amount || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/help'}
                  className="hover-lift"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Get Help
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/analytics'}
                  className="hover-lift"
                >
                  View Analytics
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
