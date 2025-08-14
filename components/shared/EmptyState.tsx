'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Shield, 
  FileText, 
  BarChart3, 
  Plus, 
  ArrowRight,
  Lightbulb,
  Sparkles,
  Zap
} from 'lucide-react';

interface EmptyStateProps {
  type: 'products' | 'warranties' | 'claims' | 'analytics' | 'search' | 'general';
  title?: string;
  description?: string;
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryActions?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  }>;
  tips?: string[];
  showOnboarding?: boolean;
}

export default function EmptyState({
  type,
  title,
  description,
  primaryAction,
  secondaryActions = [],
  tips = [],
  showOnboarding = false
}: EmptyStateProps) {
  const getDefaultContent = (): {
    icon: React.ComponentType<{ className?: string }>;
    defaultTitle: string;
    defaultDescription: string;
    defaultPrimaryAction: {
      label: string;
      href?: string;
      onClick?: () => void;
    };
    defaultSecondaryActions: Array<{
      label: string;
      href?: string;
      onClick?: () => void;
      icon?: React.ComponentType<{ className?: string }>;
    }>;
    defaultTips: string[];
  } => {
    switch (type) {
      case 'products':
        return {
          icon: Package,
          defaultTitle: 'No products yet',
          defaultDescription: 'Start by adding your first product to track warranties and manage your purchases.',
          defaultPrimaryAction: {
            label: 'Add Your First Product',
            href: '/products/add'
          },
          defaultSecondaryActions: [
            {
              label: 'Connect Retailer',
              href: '/dashboard',
              icon: Zap
            },
            {
              label: 'Import from Email',
              href: '/settings/connections',
              icon: Shield
            }
          ],
          defaultTips: [
            'Connect your Amazon, Walmart, or other retail accounts to automatically import purchases',
            'Add serial numbers and photos to make warranty claims easier',
            'Use categories to organize your products by type or room'
          ]
        };
      
      case 'warranties':
        return {
          icon: Shield,
          defaultTitle: 'No warranties found',
          defaultDescription: 'Add products to see their warranty information and track expiration dates.',
          defaultPrimaryAction: {
            label: 'Add Products',
            href: '/products/add'
          },
          defaultSecondaryActions: [
            {
              label: 'View All Products',
              href: '/products',
              icon: Package
            },
            {
              label: 'Get Extended Warranty',
              href: '/warranties/extended',
              icon: Shield
            }
          ],
          defaultTips: [
            'Products with active warranties will appear here automatically',
            'Set up email forwarding to capture warranty information from receipts',
            'Get notifications when warranties are about to expire'
          ]
        };
      
      case 'claims':
        return {
          icon: FileText,
          defaultTitle: 'No warranty claims',
          defaultDescription: 'When you need to file a warranty claim, we\'ll guide you through the process step by step.',
          defaultPrimaryAction: {
            label: 'File New Claim',
            href: '/claims/new'
          },
          defaultSecondaryActions: [
            {
              label: 'View Products',
              href: '/products',
              icon: Package
            },
            {
              label: 'Learn About Claims',
              href: '/help',
              icon: FileText
            }
          ],
          defaultTips: [
            'Claims are automatically created when you report issues with products',
            'We\'ll help you gather all necessary documentation',
            'Track claim status and get updates on resolution'
          ]
        };
      
      case 'analytics':
        return {
          icon: BarChart3,
          defaultTitle: 'No analytics data yet',
          defaultDescription: 'Add products and track warranties to see spending patterns and coverage insights.',
          defaultPrimaryAction: {
            label: 'Add Products',
            href: '/products/add'
          },
          defaultSecondaryActions: [
            {
              label: 'View Products',
              href: '/products',
              icon: Package
            },
            {
              label: 'Connect Accounts',
              href: '/dashboard',
              icon: Zap
            }
          ],
          defaultTips: [
            'Analytics are automatically generated from your product data',
            'Track spending patterns and warranty coverage over time',
            'Get personalized recommendations for extended warranties'
          ]
        };
      
      case 'search':
        return {
          icon: Package,
          defaultTitle: 'No search results',
          defaultDescription: 'Try adjusting your search terms or filters to find what you\'re looking for.',
          defaultPrimaryAction: {
            label: 'View All Products',
            href: '/products'
          },
          defaultSecondaryActions: [
            {
              label: 'Clear Filters',
              onClick: () => window.location.reload(),
              icon: Zap
            }
          ],
          defaultTips: [
            'Search works across product names, brands, and categories',
            'Use filters to narrow down results by warranty status or category',
            'Try searching for partial product names or brand names'
          ]
        };
      
      default:
        return {
          icon: Package,
          defaultTitle: 'Nothing here yet',
          defaultDescription: 'Get started by adding your first product or connecting your accounts.',
          defaultPrimaryAction: {
            label: 'Get Started',
            href: '/dashboard'
          },
          defaultSecondaryActions: [],
          defaultTips: [
            'Connect your retail accounts to automatically import purchases',
            'Add products manually to track warranties and documents',
            'Set up email forwarding for automatic receipt capture'
          ]
        };
    }
  };

  const content = getDefaultContent();
  const Icon = content.icon;

  const finalTitle = title || content.defaultTitle;
  const finalDescription = description || content.defaultDescription;
  const finalPrimaryAction = primaryAction || content.defaultPrimaryAction;
  const finalSecondaryActions = secondaryActions.length > 0 ? secondaryActions : content.defaultSecondaryActions;
  const finalTips = tips.length > 0 ? tips : content.defaultTips;

  const handlePrimaryAction = () => {
    if (finalPrimaryAction.onClick) {
      finalPrimaryAction.onClick();
    } else if (finalPrimaryAction.href) {
      window.location.href = finalPrimaryAction.href;
    }
  };

  const handleSecondaryAction = (action: any) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      window.location.href = action.href;
    }
  };

  return (
    <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
      <CardContent className="p-8 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-blue-600" />
        </div>

        {/* Title and Description */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {finalTitle}
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {finalDescription}
        </p>

        {/* Primary Action */}
        <div className="mb-6">
          <Button onClick={handlePrimaryAction} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            {finalPrimaryAction.label}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Secondary Actions */}
        {finalSecondaryActions.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {finalSecondaryActions.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSecondaryAction(action)}
                  className="flex items-center gap-2"
                >
                  {ActionIcon && <ActionIcon className="w-4 h-4" />}
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}

        {/* Tips Section */}
        {finalTips.length > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              <h4 className="font-medium text-gray-900">Pro Tips</h4>
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              {finalTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Onboarding CTA */}
        {showOnboarding && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">New to Claimso?</span>
            </div>
            <p className="text-sm text-blue-800 mb-3">
              Take our quick tour to learn about all the features and get the most out of your warranty management.
            </p>
            <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
              Start Tour
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
