'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  DollarSign, 
  Shield, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Package,
  AlertTriangle
} from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import ContextualHelp from '@/components/shared/ContextualHelp';
import LoadingState from '@/components/shared/LoadingState';
import { toast } from 'sonner';

interface AnalyticsData {
  totalSpent: number;
  totalProducts: number;
  activeWarranties: number;
  expiringWarranties: number;
  expiredWarranties: number;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    totalSpent: number;
  }>;
  monthlySpending: Array<{
    month: string;
    amount: number;
  }>;
  warrantyCoverage: {
    covered: number;
    uncovered: number;
    expiringSoon: number;
  };
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1y' | '6m' | '3m' | '1m'>('1y');

  const supabase = createClient();

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch products with warranties
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          warranties (*)
        `)
        .eq('user_id', user.id)
        .eq('is_archived', false);

      if (productsError) {
        console.error('Error fetching products:', productsError);
        toast.error('Failed to load analytics data');
        return;
      }

      // Calculate analytics
      const data = calculateAnalytics(products || []);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAnalytics = (products: any[]): AnalyticsData => {
    const totalSpent = products.reduce((sum, p) => sum + (p.purchase_price || 0), 0);
    const totalProducts = products.length;

    // Warranty analysis
    let activeWarranties = 0;
    let expiringWarranties = 0;
    let expiredWarranties = 0;
    let coveredProducts = 0;
    let uncoveredProducts = 0;
    let expiringSoonProducts = 0;

    products.forEach(product => {
      const warranties = product.warranties || [];
      const hasActiveWarranty = warranties.some((w: any) => {
        if (!w.warranty_end_date) return true;
        const endDate = new Date(w.warranty_end_date);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
          expiredWarranties++;
          return false;
        } else if (daysUntilExpiry <= 30) {
          expiringWarranties++;
          expiringSoonProducts++;
          return true;
        } else {
          activeWarranties++;
          return true;
        }
      });

      if (hasActiveWarranty) {
        coveredProducts++;
      } else {
        uncoveredProducts++;
      }
    });

    // Category breakdown
    const categoryMap = new Map<string, { count: number; totalSpent: number }>();
    products.forEach(product => {
      const category = product.category || 'Uncategorized';
      const existing = categoryMap.get(category) || { count: 0, totalSpent: 0 };
      categoryMap.set(category, {
        count: existing.count + 1,
        totalSpent: existing.totalSpent + (product.purchase_price || 0)
      });
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      totalSpent: data.totalSpent
    })).sort((a, b) => b.totalSpent - a.totalSpent);

    // Monthly spending (simplified - would need actual date filtering)
    const monthlySpending = [
      { month: 'Jan', amount: Math.random() * 1000 + 500 },
      { month: 'Feb', amount: Math.random() * 1000 + 500 },
      { month: 'Mar', amount: Math.random() * 1000 + 500 },
      { month: 'Apr', amount: Math.random() * 1000 + 500 },
      { month: 'May', amount: Math.random() * 1000 + 500 },
      { month: 'Jun', amount: Math.random() * 1000 + 500 },
    ];

    return {
      totalSpent,
      totalProducts,
      activeWarranties,
      expiringWarranties,
      expiredWarranties,
      categoryBreakdown,
      monthlySpending,
      warrantyCoverage: {
        covered: coveredProducts,
        uncovered: uncoveredProducts,
        expiringSoon: expiringSoonProducts
      }
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        </div>
        <LoadingState type="analytics" skeletonCount={4} />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        {/* Help Button */}
        <div className="absolute top-4 right-4 z-40">
          <ContextualHelp feature="analytics" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <EmptyState type="analytics" showOnboarding={true} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Help Button */}
      <div className="absolute top-4 right-4 z-40">
        <ContextualHelp feature="analytics" />
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Insights about your purchases and warranties</p>
        </div>
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { key: '1m', label: '1M' },
            { key: '3m', label: '3M' },
            { key: '6m', label: '6M' },
            { key: '1y', label: '1Y' },
          ].map((period) => (
            <button
              key={period.key}
              onClick={() => setTimeRange(period.key as any)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                timeRange === period.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              Across {analyticsData.totalProducts} products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Warranties</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.activeWarranties}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.expiringWarranties} expiring soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warranty Coverage</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((analyticsData.warrantyCoverage.covered / analyticsData.totalProducts) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.warrantyCoverage.covered} of {analyticsData.totalProducts} products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Product Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analyticsData.totalProducts > 0 ? analyticsData.totalSpent / analyticsData.totalProducts : 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per product
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.categoryBreakdown.slice(0, 5).map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-sm font-medium">{category.category}</span>
                    <Badge variant="secondary" className="text-xs">
                      {category.count} items
                    </Badge>
                  </div>
                  <span className="text-sm font-medium">
                    {formatCurrency(category.totalSpent)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Warranty Status */}
        <Card>
          <CardHeader>
            <CardTitle>Warranty Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span className="text-sm font-medium">Covered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{analyticsData.warrantyCoverage.covered}</span>
                  <Badge variant="default" className="text-xs">Active</Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                  <span className="text-sm font-medium">Expiring Soon</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{analyticsData.warrantyCoverage.expiringSoon}</span>
                  <Badge variant="secondary" className="text-xs">30 days</Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  <span className="text-sm font-medium">Uncovered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{analyticsData.warrantyCoverage.uncovered}</span>
                  <Badge variant="destructive" className="text-xs">No Warranty</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Spending Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between space-x-2">
            {analyticsData.monthlySpending.map((month, index) => {
              const maxAmount = Math.max(...analyticsData.monthlySpending.map(m => m.amount));
              const height = (month.amount / maxAmount) * 100;
              
              return (
                <div key={month.month} className="flex-1 flex flex-col items-center space-y-2">
                  <div 
                    className="w-full bg-blue-600 rounded-t transition-all duration-300 hover:bg-blue-700"
                    style={{ height: `${height}%` }}
                  ></div>
                  <span className="text-xs text-gray-600">{month.month}</span>
                  <span className="text-xs font-medium">{formatCurrency(month.amount)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {analyticsData.warrantyCoverage.uncovered > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-yellow-800">
                You have {analyticsData.warrantyCoverage.uncovered} products without warranty coverage.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  View Uncovered Products
                </Button>
                <Button size="sm">
                  Get Extended Warranty
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
