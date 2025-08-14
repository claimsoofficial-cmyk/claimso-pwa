'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Shield,
  Package
} from 'lucide-react';

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface LineChartProps {
  data: ChartDataPoint[];
  title: string;
  subtitle?: string;
  height?: number;
  showGrid?: boolean;
}

interface BarChartProps {
  data: ChartDataPoint[];
  title: string;
  subtitle?: string;
  height?: number;
  horizontal?: boolean;
}

interface PieChartProps {
  data: ChartDataPoint[];
  title: string;
  subtitle?: string;
  size?: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
}

// Simple Line Chart Component
export function LineChart({ data, title, subtitle, height = 200, showGrid = true }: LineChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height }}>
          {/* Grid Lines */}
          {showGrid && (
            <div className="absolute inset-0 flex flex-col justify-between">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border-b border-gray-100" />
              ))}
            </div>
          )}

          {/* Chart Area */}
          <div className="relative h-full flex items-end justify-between px-4 pb-4">
            {data.map((point, index) => {
              const percentage = range > 0 ? ((point.value - minValue) / range) * 100 : 50;
              const height = `${percentage}%`;
              
              return (
                <div key={index} className="flex flex-col items-center">
                  {/* Data Point */}
                  <div 
                    className="w-2 h-2 bg-blue-600 rounded-full mb-1"
                    style={{ 
                      height: Math.max(8, percentage * 0.8),
                      width: Math.max(8, percentage * 0.8)
                    }}
                  />
                  
                  {/* Label */}
                  <span className="text-xs text-gray-600 text-center">
                    {point.label}
                  </span>
                  
                  {/* Value */}
                  <span className="text-xs font-medium text-gray-900">
                    {typeof point.value === 'number' ? point.value.toLocaleString() : point.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simple Bar Chart Component
export function BarChart({ data, title, subtitle, height = 200, horizontal = false }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((point, index) => {
            const percentage = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
            const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
            const color = colors[index % colors.length];
            
            return (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {point.label}
                    </span>
                    <span className="text-sm text-gray-600">
                      {typeof point.value === 'number' ? point.value.toLocaleString() : point.value}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${color} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Simple Pie Chart Component
export function PieChart({ data, title, subtitle, size = 200 }: PieChartProps) {
  const total = data.reduce((sum, point) => sum + point.value, 0);
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Chart */}
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={size / 2 - 10}
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="20"
              />
              {data.map((point, index) => {
                const percentage = total > 0 ? (point.value / total) * 100 : 0;
                const circumference = 2 * Math.PI * (size / 2 - 10);
                const strokeDasharray = (percentage / 100) * circumference;
                const strokeDashoffset = index === 0 ? 0 : 
                  data.slice(0, index).reduce((sum, p) => 
                    sum + ((p.value / total) * circumference), 0
                  );
                
                return (
                  <circle
                    key={index}
                    cx={size / 2}
                    cy={size / 2}
                    r={size / 2 - 10}
                    fill="none"
                    stroke={colors[index % colors.length]}
                    strokeWidth="20"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
            
            {/* Center Label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {total.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {data.map((point, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-sm text-gray-900">{point.label}</span>
                <span className="text-sm text-gray-600 ml-auto">
                  {total > 0 ? ((point.value / total) * 100).toFixed(1) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Metric Card Component
export function MetricCard({ title, value, change, changeLabel, icon: Icon, trend }: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  const getChangeColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon()}
                <span className={`text-sm font-medium ${getChangeColor()}`}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
                {changeLabel && (
                  <span className="text-sm text-gray-600">vs {changeLabel}</span>
                )}
              </div>
            )}
          </div>
          {Icon && (
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-blue-600" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Spending Trend Chart
export function SpendingTrendChart({ data }: { data: Array<{ month: string; amount: number }> }) {
  return (
    <LineChart
      data={data.map(d => ({ label: d.month, value: d.amount }))}
      title="Monthly Spending Trend"
      subtitle="Track your spending patterns over time"
      height={250}
    />
  );
}

// Category Breakdown Chart
export function CategoryBreakdownChart({ data }: { data: Array<{ category: string; amount: number }> }) {
  return (
    <BarChart
      data={data.map(d => ({ label: d.category, value: d.amount }))}
      title="Spending by Category"
      subtitle="See where your money goes"
      height={300}
    />
  );
}

// Warranty Coverage Chart
export function WarrantyCoverageChart({ 
  covered, 
  uncovered, 
  expiring 
}: { 
  covered: number; 
  uncovered: number; 
  expiring: number; 
}) {
  const data = [
    { label: 'Covered', value: covered, color: '#10B981' },
    { label: 'Expiring Soon', value: expiring, color: '#F59E0B' },
    { label: 'Uncovered', value: uncovered, color: '#EF4444' }
  ].filter(item => item.value > 0);

  return (
    <PieChart
      data={data}
      title="Warranty Coverage"
      subtitle="Overview of your product protection"
      size={180}
    />
  );
}

// Quick Stats Grid
export function QuickStatsGrid({ stats }: {
  stats: {
    totalSpent: number;
    totalProducts: number;
    activeWarranties: number;
    avgProductValue: number;
  };
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Spent"
        value={`$${stats.totalSpent.toLocaleString()}`}
        icon={DollarSign}
      />
      <MetricCard
        title="Total Products"
        value={stats.totalProducts}
        icon={Package}
      />
      <MetricCard
        title="Active Warranties"
        value={stats.activeWarranties}
        icon={Shield}
      />
      <MetricCard
        title="Avg. Product Value"
        value={`$${stats.avgProductValue.toLocaleString()}`}
        icon={DollarSign}
      />
    </div>
  );
}
