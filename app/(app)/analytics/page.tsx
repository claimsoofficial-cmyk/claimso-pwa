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
import { 
  QuickStatsGrid, 
  SpendingTrendChart, 
  CategoryBreakdownChart, 
  WarrantyCoverageChart 
} from '@/components/analytics/ChartComponents';
import DataExport from '@/components/analytics/DataExport';
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
      <QuickStatsGrid 
        stats={{
          totalSpent: analyticsData.totalSpent,
          totalProducts: analyticsData.totalProducts,
          activeWarranties: analyticsData.activeWarranties,
          avgProductValue: analyticsData.totalProducts > 0 ? analyticsData.totalSpent / analyticsData.totalProducts : 0
        }}
      />

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <CategoryBreakdownChart 
          data={analyticsData.categoryBreakdown.map(cat => ({
            category: cat.category,
            amount: cat.totalSpent
          }))}
        />

        {/* Warranty Coverage */}
        <WarrantyCoverageChart 
          covered={analyticsData.warrantyCoverage.covered}
          uncovered={analyticsData.warrantyCoverage.uncovered}
          expiring={analyticsData.warrantyCoverage.expiringSoon}
        />
      </div>

      {/* Monthly Spending Chart */}
      <SpendingTrendChart data={analyticsData.monthlySpending} />

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

      {/* Data Export */}
      <DataExport 
        data={{
          products: products || [],
          warranties: warranties || [],
          analytics: analyticsData,
          claims: []
        }}
        onExport={(format, data) => {
          console.log(`Exported data as ${format}`, data);
        }}
      />
    </div>
  );
}
