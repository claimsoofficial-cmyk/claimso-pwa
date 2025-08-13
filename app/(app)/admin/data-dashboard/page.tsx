'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  BarChart3, 
  Database, 
  Bell,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface QuickCashData {
  success: boolean;
  quotes: any[];
  best_offer: any;
  total_partners_checked: number;
  processing_time: number;
}

interface AnalyticsData {
  success: boolean;
  data: any;
  metadata: any;
}

interface WarrantyData {
  success: boolean;
  results: any[];
  total_count: number;
  search_time: number;
  confidence_threshold: number;
}

interface NotificationData {
  success: boolean;
  data: any[];
}

export default function DataDashboard() {
  const [quickCashData, setQuickCashData] = useState<QuickCashData | null>(null);
  const [consumerBehaviorData, setConsumerBehaviorData] = useState<AnalyticsData | null>(null);
  const [productPerformanceData, setProductPerformanceData] = useState<AnalyticsData | null>(null);
  const [financialData, setFinancialData] = useState<AnalyticsData | null>(null);
  const [warrantyData, setWarrantyData] = useState<WarrantyData | null>(null);
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    fetchUserProducts();
  }, []);

  const fetchUserProducts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', session.user.id)
        .limit(5);

      setProducts(products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const generateQuickCashData = async () => {
    if (products.length === 0) {
      toast.error('No products available for testing');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/partners/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: products[0].id,
          condition: 'good'
        })
      });

      const data = await response.json();
      setQuickCashData(data);
      toast.success('Quick Cash data generated');
    } catch (error) {
      console.error('Error generating Quick Cash data:', error);
      toast.error('Failed to generate Quick Cash data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateConsumerBehaviorData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/analytics/consumer-behavior');
      const data = await response.json();
      setConsumerBehaviorData(data);
      toast.success('Consumer behavior data generated');
    } catch (error) {
      console.error('Error generating consumer behavior data:', error);
      toast.error('Failed to generate consumer behavior data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateProductPerformanceData = async () => {
    if (products.length === 0) {
      toast.error('No products available for testing');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics/product-performance?product_id=${products[0].id}`);
      const data = await response.json();
      setProductPerformanceData(data);
      toast.success('Product performance data generated');
    } catch (error) {
      console.error('Error generating product performance data:', error);
      toast.error('Failed to generate product performance data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateFinancialData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/analytics/financial-intelligence?category=phones');
      const data = await response.json();
      setFinancialData(data);
      toast.success('Financial intelligence data generated');
    } catch (error) {
      console.error('Error generating financial data:', error);
      toast.error('Failed to generate financial data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateWarrantyData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/warranty-database/search?brand=Apple&category=phones');
      const data = await response.json();
      setWarrantyData(data);
      toast.success('Warranty database data generated');
    } catch (error) {
      console.error('Error generating warranty data:', error);
      toast.error('Failed to generate warranty data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNotificationData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      setNotificationData(data);
      toast.success('Notification data generated');
    } catch (error) {
      console.error('Error generating notification data:', error);
      toast.error('Failed to generate notification data');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadData = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Data Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          Admin View
        </Badge>
      </div>

      <Tabs defaultValue="quick-cash" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="quick-cash" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Quick Cash
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="warranty" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Warranty DB
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="raw" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Raw Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick-cash" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Quick Cash Partner Network Data
                <div className="flex gap-2">
                  <Button 
                    onClick={generateQuickCashData} 
                    disabled={isLoading}
                    size="sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Generate Data
                  </Button>
                  {quickCashData && (
                    <Button 
                      onClick={() => downloadData(quickCashData, 'quick-cash-data.json')}
                      size="sm"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {quickCashData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-600">Total Partners Checked</div>
                      <div className="text-2xl font-bold text-green-700">{quickCashData.total_partners_checked}</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-600">Processing Time</div>
                      <div className="text-2xl font-bold text-blue-700">{quickCashData.processing_time}ms</div>
                    </div>
                  </div>
                  
                  {quickCashData.best_offer && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2">Best Offer</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-yellow-600">Partner:</span>
                          <div className="font-medium">{quickCashData.best_offer.partner_name}</div>
                        </div>
                        <div>
                          <span className="text-yellow-600">Amount:</span>
                          <div className="font-medium">${quickCashData.best_offer.amount}</div>
                        </div>
                        <div>
                          <span className="text-yellow-600">Payment Speed:</span>
                          <div className="font-medium">{quickCashData.best_offer.payment_speed}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-semibold">All Quotes ({quickCashData.quotes.length})</h4>
                    {quickCashData.quotes.map((quote, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{quote.partner_name}</div>
                            <div className="text-sm text-gray-600">{quote.terms}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">${quote.amount}</div>
                            <div className="text-sm text-gray-500">{quote.payment_speed}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                                     <div className="text-center py-8 text-gray-500">
                       Click &quot;Generate Data&quot; to see Quick Cash partner network data
                     </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Consumer Behavior
                  <Button 
                    onClick={generateConsumerBehaviorData} 
                    disabled={isLoading}
                    size="sm"
                  >
                    Generate
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {consumerBehaviorData ? (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>User Segment:</strong> {consumerBehaviorData.data.user_segment}
                    </div>
                    <div className="text-sm">
                      <strong>Brand Loyalty:</strong> {(consumerBehaviorData.data.brand_preferences.loyalty_score * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm">
                      <strong>Warranty Purchase Rate:</strong> {(consumerBehaviorData.data.warranty_insights.purchase_rate * 100).toFixed(1)}%
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">Click Generate to see data</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Product Performance
                  <Button 
                    onClick={generateProductPerformanceData} 
                    disabled={isLoading}
                    size="sm"
                  >
                    Generate
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {productPerformanceData ? (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Reliability Score:</strong> {(productPerformanceData.data.reliability_metrics.reliability_score * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm">
                      <strong>Failure Rate:</strong> {(productPerformanceData.data.failure_rates.overall_rate * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm">
                      <strong>Customer Satisfaction:</strong> {(productPerformanceData.data.sentiment_analysis.product_satisfaction * 100).toFixed(1)}%
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">Click Generate to see data</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Financial Intelligence
                  <Button 
                    onClick={generateFinancialData} 
                    disabled={isLoading}
                    size="sm"
                  >
                    Generate
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {financialData ? (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Depreciation Rate:</strong> {(financialData.data.depreciation_analysis.depreciation_rate * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm">
                      <strong>Resale Value:</strong> {(financialData.data.depreciation_analysis.resale_value * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm">
                      <strong>Warranty ROI:</strong> {(financialData.data.cost_analysis.warranty_roi * 100).toFixed(1)}%
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">Click Generate to see data</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="warranty" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Warranty Database Data
                <div className="flex gap-2">
                  <Button 
                    onClick={generateWarrantyData} 
                    disabled={isLoading}
                    size="sm"
                  >
                    Generate
                  </Button>
                  {warrantyData && (
                    <Button 
                      onClick={() => downloadData(warrantyData, 'warranty-data.json')}
                      size="sm"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {warrantyData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-600">Total Results</div>
                      <div className="text-2xl font-bold text-blue-700">{warrantyData.total_count}</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-600">Search Time</div>
                      <div className="text-2xl font-bold text-green-700">{warrantyData.search_time}ms</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-sm text-purple-600">Confidence Threshold</div>
                      <div className="text-2xl font-bold text-purple-700">{(warrantyData.confidence_threshold * 100).toFixed(0)}%</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Warranty Entries</h4>
                    {warrantyData.results.map((entry, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{entry.brand} {entry.model}</div>
                            <div className="text-sm text-gray-600">{entry.category}</div>
                            <div className="text-sm text-gray-500">
                              Reliability: {(entry.reliability_score * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              Confidence: {(entry.data_quality.confidence_score * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500">
                              Source: {entry.data_quality.source}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                                 <div className="text-center py-8 text-gray-500">
                   Click &quot;Generate&quot; to see warranty database data
                 </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Notification System Data
                <div className="flex gap-2">
                  <Button 
                    onClick={generateNotificationData} 
                    disabled={isLoading}
                    size="sm"
                  >
                    Generate
                  </Button>
                  {notificationData && (
                    <Button 
                      onClick={() => downloadData(notificationData, 'notification-data.json')}
                      size="sm"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notificationData ? (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-600">Total Notifications</div>
                    <div className="text-2xl font-bold text-blue-700">{notificationData.data.length}</div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Notification Details</h4>
                    {notificationData.data.map((notification, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">{notification.title}</div>
                            <div className="text-sm text-gray-600 mt-1">{notification.message}</div>
                            <div className="flex gap-2 mt-2">
                              <Badge variant={notification.priority === 'high' ? 'destructive' : 'secondary'}>
                                {notification.priority}
                              </Badge>
                              <Badge variant="outline">{notification.status}</Badge>
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                                 <div className="text-center py-8 text-gray-500">
                   Click &quot;Generate&quot; to see notification system data
                 </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Raw Data Export</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    onClick={() => quickCashData && downloadData(quickCashData, 'quick-cash-raw.json')}
                    disabled={!quickCashData}
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <DollarSign className="h-6 w-6" />
                    <span className="text-sm">Quick Cash</span>
                  </Button>
                  
                  <Button 
                    onClick={() => consumerBehaviorData && downloadData(consumerBehaviorData, 'consumer-behavior-raw.json')}
                    disabled={!consumerBehaviorData}
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-sm">Consumer Behavior</span>
                  </Button>
                  
                  <Button 
                    onClick={() => warrantyData && downloadData(warrantyData, 'warranty-raw.json')}
                    disabled={!warrantyData}
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <Database className="h-6 w-6" />
                    <span className="text-sm">Warranty DB</span>
                  </Button>
                  
                  <Button 
                    onClick={() => notificationData && downloadData(notificationData, 'notifications-raw.json')}
                    disabled={!notificationData}
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <Bell className="h-6 w-6" />
                    <span className="text-sm">Notifications</span>
                  </Button>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Available Products for Testing</h4>
                  <div className="space-y-2">
                    {products.map((product, index) => (
                      <div key={index} className="text-sm p-2 bg-white rounded border">
                        <strong>{product.product_name}</strong> - {product.brand} ({product.category})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 