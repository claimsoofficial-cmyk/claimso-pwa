'use client';

import React, { useState, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  X, 
  ArrowRight, 
  ArrowLeft,
  Lightbulb,
  BookOpen,
  Video,
  MessageCircle
} from 'lucide-react';

interface HelpItem {
  id: string;
  title: string;
  content: string;
  category: 'feature' | 'tip' | 'tutorial' | 'faq';
  targetElement?: string;
  videoUrl?: string;
  relatedLinks?: string[];
}

interface ContextualHelpProps {
  feature?: string;
  showHelpButton?: boolean;
  className?: string;
}

export default function ContextualHelp({ 
  feature, 
  showHelpButton = true, 
  className = '' 
}: ContextualHelpProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [currentHelpItem, setCurrentHelpItem] = useState<HelpItem | null>(null);

  // Help content database
  const helpItems: HelpItem[] = [
    {
      id: 'dashboard-overview',
      title: 'Dashboard Overview',
      content: 'Your dashboard shows all your products organized by warranty status. Products with active warranties are highlighted, while expired warranties show repair and resale options.',
      category: 'feature',
      relatedLinks: ['products', 'warranties', 'analytics']
    },
    {
      id: 'add-product',
      title: 'Adding Products',
      content: 'You can add products manually or connect your retail accounts to automatically import purchases. Each product can have multiple warranties and documents attached.',
      category: 'feature',
      relatedLinks: ['products/add', 'settings/connections']
    },
    {
      id: 'warranty-tracking',
      title: 'Warranty Tracking',
      content: 'Claimso automatically tracks warranty expiration dates and sends you reminders. You can also manually add warranty information and documents.',
      category: 'feature',
      relatedLinks: ['warranties', 'notifications']
    },
    {
      id: 'quick-cash',
      title: 'Quick Cash Feature',
      content: 'When warranties expire, use our Quick Cash partner network to get instant quotes for selling your items. We partner with trusted buyback services.',
      category: 'feature',
      relatedLinks: ['analytics', 'products']
    },
    {
      id: 'email-sync',
      title: 'Email Receipt Sync',
      content: 'Forward receipts to your personal Claimso email address to automatically capture new purchases. Our AI extracts product and warranty information.',
      category: 'feature',
      relatedLinks: ['settings/connections']
    },
    {
      id: 'product-organization',
      title: 'Product Organization Tips',
      content: 'Use categories to organize your products. Add serial numbers and photos to make warranty claims easier. Archive sold or discarded items.',
      category: 'tip',
      relatedLinks: ['products']
    },
    {
      id: 'warranty-claims',
      title: 'Filing Warranty Claims',
      content: 'When you need to file a warranty claim, Claimso provides step-by-step guidance and can generate claim packets with all necessary documentation.',
      category: 'feature',
      relatedLinks: ['claims', 'products']
    },
    {
      id: 'analytics-insights',
      title: 'Analytics Insights',
      content: 'Track your spending patterns, warranty coverage, and get recommendations for extended warranties or product replacements.',
      category: 'feature',
      relatedLinks: ['analytics']
    }
  ];

  // Get help items for current feature
  const getRelevantHelp = () => {
    if (!feature) return helpItems;
    return helpItems.filter(item => 
      item.id.includes(feature) || 
      item.relatedLinks?.some(link => link.includes(feature))
    );
  };

  const relevantHelp = getRelevantHelp();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'feature':
        return <BookOpen className="w-4 h-4" />;
      case 'tip':
        return <Lightbulb className="w-4 h-4" />;
      case 'tutorial':
        return <Video className="w-4 h-4" />;
      case 'faq':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feature':
        return 'bg-blue-100 text-blue-700';
      case 'tip':
        return 'bg-yellow-100 text-yellow-700';
      case 'tutorial':
        return 'bg-purple-100 text-purple-700';
      case 'faq':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'feature':
        return 'Feature';
      case 'tip':
        return 'Tip';
      case 'tutorial':
        return 'Tutorial';
      case 'faq':
        return 'FAQ';
      default:
        return 'Help';
    }
  };

  if (!showHelpButton) {
    return null;
  }

  return (
    <>
      {/* Help Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHelpOpen(true)}
              className={`w-8 h-8 p-0 ${className}`}
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Get help with this feature</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      {currentHelpItem ? currentHelpItem.title : 'Help & Support'}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {currentHelpItem ? 'Feature details' : 'Find answers and learn about features'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsHelpOpen(false);
                    setCurrentHelpItem(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {currentHelpItem ? (
                // Individual help item view
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(currentHelpItem.category)}>
                      {getCategoryIcon(currentHelpItem.category)}
                      <span className="ml-1">{getCategoryLabel(currentHelpItem.category)}</span>
                    </Badge>
                  </div>
                  
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {currentHelpItem.content}
                    </p>
                  </div>

                  {currentHelpItem.videoUrl && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Watch Tutorial</h4>
                      <Button variant="outline" size="sm">
                        <Video className="w-4 h-4 mr-2" />
                        Play Video
                      </Button>
                    </div>
                  )}

                  {currentHelpItem.relatedLinks && currentHelpItem.relatedLinks.length > 0 && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium mb-2 text-blue-900">Related Topics</h4>
                      <div className="space-y-1">
                        {currentHelpItem.relatedLinks.map((link, index) => (
                          <button
                            key={index}
                            className="block text-sm text-blue-700 hover:text-blue-900 hover:underline"
                            onClick={() => {
                              // Navigate to related page
                              window.location.href = `/${link}`;
                            }}
                          >
                            {link.split('/').pop()?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentHelpItem(null)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Help
                    </Button>
                    <Button className="flex-1">
                      Contact Support
                    </Button>
                  </div>
                </div>
              ) : (
                // Help index view
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {relevantHelp.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => setCurrentHelpItem(item)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {getCategoryIcon(item.category)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900">{item.title}</h3>
                              <Badge className={`text-xs ${getCategoryColor(item.category)}`}>
                                {getCategoryLabel(item.category)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {item.content}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Still need help?</h3>
                    <div className="flex gap-3">
                      <Button variant="outline" size="sm">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contact Support
                      </Button>
                      <Button variant="outline" size="sm">
                        <Video className="w-4 h-4 mr-2" />
                        Watch Tutorials
                      </Button>
                      <Button variant="outline" size="sm">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Documentation
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
