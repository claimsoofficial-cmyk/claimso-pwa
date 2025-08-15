'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Clock, 
  ExternalLink, 
  Star, 
  Loader2,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/lib/types/common';

interface QuickCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

interface PartnerQuote {
  id: string;
  partner_name: string;
  partner_logo: string;
  amount: number;
  currency: string;
  payment_speed: string;
  terms: string;
  rating: number;
  is_instant: boolean;
  is_best_offer: boolean;
  affiliate_url: string;
  commission_rate: number;
}

interface QuickCashData {
  product_id: string;
  product_name: string;
  estimated_value: number;
  quotes: PartnerQuote[];
  total_partners_checked: number;
  best_offer: PartnerQuote;
  processing_time_ms: number;
}

export default function QuickCashModal({ isOpen, onClose, product }: QuickCashModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [quickCashData, setQuickCashData] = useState<QuickCashData | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<PartnerQuote | null>(null);

  useEffect(() => {
    if (isOpen && product) {
      fetchQuickCashQuotes();
    }
  }, [isOpen, product]);

  const fetchQuickCashQuotes = async () => {
    if (!product) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/partners/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.product_name,
          category: product.category || 'Unknown',
          brand: product.brand || 'Unknown',
          condition: product.condition || 'used',
          purchase_price: product.purchase_price || 0,
          purchase_date: product.purchase_date || new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quotes');
      }

      const data = await response.json();
      setQuickCashData(data);
      toast.success('Quick Cash quotes loaded!');
    } catch (error) {
      console.error('Error fetching Quick Cash quotes:', error);
      toast.error('Failed to load quotes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuoteClick = (quote: PartnerQuote) => {
    setSelectedQuote(quote);
    // Track affiliate click
    window.open(quote.affiliate_url, '_blank');
    toast.success(`Redirecting to ${quote.partner_name}...`);
  };

  const getPartnerIcon = (partnerName: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Gazelle': <TrendingUp className="w-5 h-5" />,
      'Decluttr': <Zap className="w-5 h-5" />,
      'Amazon Trade-In': <Shield className="w-5 h-5" />,
      'Best Buy Trade-In': <DollarSign className="w-5 h-5" />,
      'Swappa': <Star className="w-5 h-5" />,
    };
    return icons[partnerName] || <DollarSign className="w-5 h-5" />;
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            Quick Cash Offers
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {product.product_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {product.brand || 'Unknown Brand'} • {product.category || 'Uncategorized'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Estimated Value</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${product.purchase_price?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Finding the best cash offers...</p>
            </div>
          )}

          {/* Quotes */}
          {!isLoading && quickCashData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">
                  Cash Offers ({quickCashData.quotes.length})
                </h4>
                <Badge variant="outline" className="text-xs">
                  {quickCashData.total_partners_checked} partners checked
                </Badge>
              </div>

              {/* Best Offer */}
              {quickCashData.best_offer && (
                <Card className="border-2 border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-600 text-white">
                          🏆 BEST OFFER
                        </Badge>
                        {getPartnerIcon(quickCashData.best_offer.partner_name)}
                        <span className="font-semibold">
                          {quickCashData.best_offer.partner_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(quickCashData.best_offer.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-3xl font-bold text-green-600">
                          ${quickCashData.best_offer.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {quickCashData.best_offer.payment_speed}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Commission</p>
                        <p className="text-sm font-medium text-blue-600">
                          {quickCashData.best_offer.commission_rate}%
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                      {quickCashData.best_offer.terms}
                    </p>

                    <Button
                      onClick={() => handleQuoteClick(quickCashData.best_offer)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Get ${quickCashData.best_offer.amount.toLocaleString()} Now
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Other Offers */}
              <div className="space-y-3">
                {quickCashData.quotes
                  .filter(quote => quote.id !== quickCashData.best_offer?.id)
                  .map((quote) => (
                    <Card key={quote.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getPartnerIcon(quote.partner_name)}
                            <span className="font-medium">{quote.partner_name}</span>
                            {quote.is_instant && (
                              <Badge variant="secondary" className="text-xs">
                                <Zap className="w-3 h-3 mr-1" />
                                Instant
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(quote.rating)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xl font-bold text-gray-900">
                              ${quote.amount.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-3 h-3" />
                              {quote.payment_speed}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Commission</p>
                            <p className="text-sm font-medium text-blue-600">
                              {quote.commission_rate}%
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">
                          {quote.terms}
                        </p>

                        <Button
                          variant="outline"
                          onClick={() => handleQuoteClick(quote)}
                          className="w-full"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Get Quote
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>

              {/* Processing Info */}
              <div className="text-center text-xs text-gray-500">
                Quotes generated in {quickCashData.processing_time_ms}ms
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && !quickCashData && (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No quotes available
              </h3>
                             <p className="text-gray-500 mb-4">
                 We couldn&apos;t find any cash offers for this product right now.
               </p>
              <Button onClick={fetchQuickCashQuotes} variant="outline">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
