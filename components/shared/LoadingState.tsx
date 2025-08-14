'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Loader2, 
  Package, 
  Shield, 
  FileText, 
  BarChart3,
  Sparkles
} from 'lucide-react';

interface LoadingStateProps {
  type?: 'products' | 'warranties' | 'claims' | 'analytics' | 'general';
  message?: string;
  showIcon?: boolean;
  skeletonCount?: number;
  className?: string;
}

export default function LoadingState({
  type = 'general',
  message,
  showIcon = true,
  skeletonCount = 6,
  className = ''
}: LoadingStateProps) {
  const getIcon = () => {
    switch (type) {
      case 'products':
        return <Package className="w-8 h-8 text-blue-600" />;
      case 'warranties':
        return <Shield className="w-8 h-8 text-green-600" />;
      case 'claims':
        return <FileText className="w-8 h-8 text-orange-600" />;
      case 'analytics':
        return <BarChart3 className="w-8 h-8 text-purple-600" />;
      default:
        return <Sparkles className="w-8 h-8 text-blue-600" />;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'products':
        return 'Loading your products...';
      case 'warranties':
        return 'Loading warranty information...';
      case 'claims':
        return 'Loading claim details...';
      case 'analytics':
        return 'Calculating insights...';
      default:
        return 'Loading...';
    }
  };

  const finalMessage = message || getDefaultMessage();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Loading Header */}
      <div className="text-center">
        {showIcon && (
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              {getIcon()}
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              </div>
            </div>
          </div>
        )}
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {finalMessage}
        </h3>
        <p className="text-sm text-gray-600">
          This should only take a moment...
        </p>
      </div>

      {/* Skeleton Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(skeletonCount)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Icon skeleton */}
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                
                {/* Title skeleton */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                
                {/* Content skeleton */}
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
                
                {/* Button skeleton */}
                <div className="flex gap-2 pt-2">
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading Animation */}
      <div className="flex items-center justify-center">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}
