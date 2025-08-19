'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Settings,
  RefreshCw,
  Package,
  Shield,
  Link,
  DollarSign,
  Bot,
  Wifi,
  WifiOff,
  AlertCircle,
  BarChart3,
  TrendingUp,
  PieChart,
  Calendar,
  FileText,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  Clock,
  Users,
  Globe
} from 'lucide-react';
import type { Product, UserConnection } from '@/lib/types/common';
import ProductGrid from '@/components/products/ProductGrid';
import ViewToggle from '@/components/products/ViewToggle';
import AgentDashboard from '@/components/shared/AgentDashboard';
import QuickCashModal from '@/components/domain/products/QuickCashModal';
import WarrantyDatabaseModal from '@/components/domain/products/WarrantyDatabaseModal';
import RetailerConnect from '@/components/shared/RetailerConnect';
import { toast } from 'sonner';

// Demo data - realistic product portfolio
const DEMO_PRODUCTS: Product[] = [
  {
    id: '1',
    user_id: 'demo-user',
    product_name: 'MacBook Pro 16" M3 Max',
    brand: 'Apple',
    category: 'Electronics',
    purchase_price: 3499,
    purchase_date: '2024-01-15',
    currency: 'USD',
    condition: 'new',
    notes: 'M3 Max chip, 1TB SSD, 32GB RAM',
    purchase_location: 'Apple Store',
    serial_number: 'C02XYZ123456',
    is_archived: false,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
          warranties: [
        {
          id: 'w1',
          warranty_type: 'manufacturer',
          warranty_start_date: '2024-01-15',
          warranty_end_date: '2027-01-15',
          warranty_duration_months: 36,
          coverage_details: '3-year AppleCare+ coverage',
          claim_process: 'Contact Apple Support or visit Apple Store',
          contact_info: 'Apple Support: 1-800-APL-CARE',
          snapshot_data: {
            covers: ['Hardware defects', 'Battery issues', 'Screen damage'],
            does_not_cover: ['Accidental damage', 'Cosmetic damage'],
            key_terms: ['3-year coverage', 'AppleCare+ protection'],
            claim_requirements: ['Proof of purchase', 'Device serial number']
          },
          ai_confidence_score: 0.95,
          last_analyzed_at: '2024-01-15T10:00:00Z',
          data_source: 'apple_care'
        }
      ]
  },
  {
    id: '2',
    user_id: 'demo-user',
    product_name: 'Sony WH-1000XM5 Headphones',
    brand: 'Sony',
    category: 'Electronics',
    purchase_price: 399,
    purchase_date: '2024-02-20',
    currency: 'USD',
    condition: 'new',
    notes: 'Wireless noise-canceling headphones',
    purchase_location: 'Best Buy',
    serial_number: 'SN123456789',
    is_archived: false,
    created_at: '2024-02-20T14:30:00Z',
    updated_at: '2024-02-20T14:30:00Z',
          warranties: [
        {
          id: 'w2',
          warranty_type: 'manufacturer',
          warranty_start_date: '2024-02-20',
          warranty_end_date: '2026-02-20',
          warranty_duration_months: 24,
          coverage_details: '2-year manufacturer warranty',
          claim_process: 'Contact Sony Support or authorized service center',
          contact_info: 'Sony Support: 1-800-222-7669',
          snapshot_data: {
            covers: ['Manufacturing defects', 'Audio quality issues'],
            does_not_cover: ['Physical damage', 'Water damage'],
            key_terms: ['2-year coverage', 'Manufacturer warranty'],
            claim_requirements: ['Proof of purchase', 'Product registration']
          },
          ai_confidence_score: 0.92,
          last_analyzed_at: '2024-02-20T14:30:00Z',
          data_source: 'sony_warranty'
        }
      ]
  },
  {
    id: '3',
    user_id: 'demo-user',
    product_name: 'Dyson V15 Detect Absolute',
    brand: 'Dyson',
    category: 'Appliances',
    purchase_price: 749,
    purchase_date: '2024-03-10',
    currency: 'USD',
    condition: 'new',
    notes: 'Cordless vacuum with laser detection',
    purchase_location: 'Target',
    serial_number: 'DY123456789',
    is_archived: false,
    created_at: '2024-03-10T09:15:00Z',
    updated_at: '2024-03-10T09:15:00Z',
          warranties: [
        {
          id: 'w3',
          warranty_type: 'manufacturer',
          warranty_start_date: '2024-03-10',
          warranty_end_date: '2026-03-10',
          warranty_duration_months: 24,
          coverage_details: '2-year warranty on motor and battery',
          claim_process: 'Contact Dyson Support or visit authorized service center',
          contact_info: 'Dyson Support: 1-866-693-9766',
          snapshot_data: {
            covers: ['Motor defects', 'Battery issues', 'Suction problems'],
            does_not_cover: ['Normal wear and tear', 'Filter replacement'],
            key_terms: ['2-year coverage', 'Motor and battery warranty'],
            claim_requirements: ['Proof of purchase', 'Product registration']
          },
          ai_confidence_score: 0.89,
          last_analyzed_at: '2024-03-10T09:15:00Z',
          data_source: 'dyson_warranty'
        }
      ]
  },
  {
    id: '4',
    user_id: 'demo-user',
    product_name: 'Nike Air Max 270',
    brand: 'Nike',
    category: 'Fashion',
    purchase_price: 150,
    purchase_date: '2024-01-25',
    currency: 'USD',
    condition: 'new',
    notes: 'Comfortable running shoes with Air Max technology',
    purchase_location: 'Nike Store',
    serial_number: 'NK987654321',
    is_archived: false,
    created_at: '2024-01-25T16:45:00Z',
    updated_at: '2024-01-25T16:45:00Z',
          warranties: [
        {
          id: 'w4',
          warranty_type: 'manufacturer',
          warranty_start_date: '2024-01-25',
          warranty_end_date: '2025-01-25',
          warranty_duration_months: 12,
          coverage_details: '1-year warranty on manufacturing defects',
          claim_process: 'Return to Nike store or contact customer service',
          contact_info: 'Nike Support: 1-800-344-6453',
          snapshot_data: {
            covers: ['Manufacturing defects', 'Material defects'],
            does_not_cover: ['Normal wear and tear', 'Accidental damage'],
            key_terms: ['1-year coverage', 'Manufacturing defects only'],
            claim_requirements: ['Proof of purchase', 'Original packaging']
          },
          ai_confidence_score: 0.87,
          last_analyzed_at: '2024-01-25T16:45:00Z',
          data_source: 'nike_warranty'
        }
      ]
  },
  {
    id: '5',
    user_id: 'demo-user',
    product_name: 'Samsung 65" QLED 4K TV',
    brand: 'Samsung',
    category: 'Electronics',
    purchase_price: 1299,
    purchase_date: '2024-02-05',
    currency: 'USD',
    condition: 'new',
    notes: '4K QLED Smart TV with HDR',
    purchase_location: 'Costco',
    serial_number: 'SM123456789',
    is_archived: false,
    created_at: '2024-02-05T11:20:00Z',
    updated_at: '2024-02-05T11:20:00Z',
          warranties: [
        {
          id: 'w5',
          warranty_type: 'manufacturer',
          warranty_start_date: '2024-02-05',
          warranty_end_date: '2026-02-05',
          warranty_duration_months: 24,
          coverage_details: '2-year manufacturer warranty',
          claim_process: 'Contact Samsung Support or visit authorized service center',
          contact_info: 'Samsung Support: 1-800-SAMSUNG',
          snapshot_data: {
            covers: ['Hardware defects', 'Display issues', 'Audio problems'],
            does_not_cover: ['Physical damage', 'Water damage'],
            key_terms: ['2-year coverage', 'Manufacturer warranty'],
            claim_requirements: ['Proof of purchase', 'Product registration']
          },
          ai_confidence_score: 0.91,
          last_analyzed_at: '2024-02-05T11:20:00Z',
          data_source: 'samsung_warranty'
        }
      ]
  },
  {
    id: '6',
    user_id: 'demo-user',
    product_name: 'KitchenAid Stand Mixer',
    brand: 'KitchenAid',
    category: 'Appliances',
    purchase_price: 449,
    purchase_date: '2024-03-15',
    currency: 'USD',
    condition: 'new',
    notes: 'Professional stand mixer for baking',
    purchase_location: 'Williams-Sonoma',
    serial_number: 'KA123456789',
    is_archived: false,
    created_at: '2024-03-15T13:10:00Z',
    updated_at: '2024-03-15T13:10:00Z',
          warranties: [
        {
          id: 'w6',
          warranty_type: 'manufacturer',
          warranty_start_date: '2024-03-15',
          warranty_end_date: '2026-03-15',
          warranty_duration_months: 24,
          coverage_details: '2-year warranty on motor and mechanical parts',
          claim_process: 'Contact KitchenAid Support or visit authorized service center',
          contact_info: 'KitchenAid Support: 1-800-422-1230',
          snapshot_data: {
            covers: ['Motor defects', 'Mechanical parts', 'Performance issues'],
            does_not_cover: ['Normal wear and tear', 'Cosmetic damage'],
            key_terms: ['2-year coverage', 'Motor and mechanical warranty'],
            claim_requirements: ['Proof of purchase', 'Product registration']
          },
          ai_confidence_score: 0.88,
          last_analyzed_at: '2024-03-15T13:10:00Z',
          data_source: 'kitchenaid_warranty'
        }
      ]
  },
  {
    id: '7',
    user_id: 'demo-user',
    product_name: 'iPhone 15 Pro Max',
    brand: 'Apple',
    category: 'Electronics',
    purchase_price: 1199,
    purchase_date: '2024-01-30',
    currency: 'USD',
    condition: 'new',
    notes: '256GB, Titanium finish, Pro camera system',
    purchase_location: 'Verizon Store',
    serial_number: 'IP123456789',
    is_archived: false,
    created_at: '2024-01-30T15:30:00Z',
    updated_at: '2024-01-30T15:30:00Z',
          warranties: [
        {
          id: 'w7',
          warranty_type: 'manufacturer',
          warranty_start_date: '2024-01-30',
          warranty_end_date: '2026-01-30',
          warranty_duration_months: 24,
          coverage_details: '2-year AppleCare+ coverage',
          claim_process: 'Contact Apple Support or visit Apple Store',
          contact_info: 'Apple Support: 1-800-APL-CARE',
          snapshot_data: {
            covers: ['Hardware defects', 'Battery issues', 'Screen damage'],
            does_not_cover: ['Accidental damage', 'Cosmetic damage'],
            key_terms: ['2-year coverage', 'AppleCare+ protection'],
            claim_requirements: ['Proof of purchase', 'Device serial number']
          },
          ai_confidence_score: 0.94,
          last_analyzed_at: '2024-01-30T15:30:00Z',
          data_source: 'apple_care'
        }
      ]
  },
  {
    id: '8',
    user_id: 'demo-user',
    product_name: 'Patagonia Down Jacket',
    brand: 'Patagonia',
    category: 'Fashion',
    purchase_price: 299,
    purchase_date: '2024-02-12',
    currency: 'USD',
    condition: 'new',
    notes: 'Waterproof down jacket for outdoor activities',
    purchase_location: 'REI',
    serial_number: 'PT123456789',
    is_archived: false,
    created_at: '2024-02-12T12:00:00Z',
    updated_at: '2024-02-12T12:00:00Z',
          warranties: [
        {
          id: 'w8',
          warranty_type: 'manufacturer',
          warranty_start_date: '2024-02-12',
          warranty_end_date: '2025-02-12',
          warranty_duration_months: 12,
          coverage_details: '1-year warranty on materials and workmanship',
          claim_process: 'Contact Patagonia customer service or visit store',
          contact_info: 'Patagonia Support: 1-800-638-6464',
          snapshot_data: {
            covers: ['Material defects', 'Workmanship issues', 'Zipper problems'],
            does_not_cover: ['Normal wear and tear', 'Accidental damage'],
            key_terms: ['1-year coverage', 'Materials and workmanship'],
            claim_requirements: ['Proof of purchase', 'Product photos']
          },
          ai_confidence_score: 0.85,
          last_analyzed_at: '2024-02-12T12:00:00Z',
          data_source: 'patagonia_warranty'
        }
      ]
  }
];

const DEMO_CONNECTIONS: UserConnection[] = [
  {
    id: '1',
    user_id: 'demo-user',
    provider: 'amazon',
    retailer: 'Amazon',
    status: 'connected',
    last_synced_at: '2024-03-20T10:30:00Z',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-03-20T10:30:00Z'
  },
  {
    id: '2',
    user_id: 'demo-user',
    provider: 'bestbuy',
    retailer: 'Best Buy',
    status: 'connected',
    last_synced_at: '2024-03-19T14:20:00Z',
    created_at: '2024-02-01T12:00:00Z',
    updated_at: '2024-03-19T14:20:00Z'
  },
  {
    id: '3',
    user_id: 'demo-user',
    provider: 'target',
    retailer: 'Target',
    status: 'connected',
    last_synced_at: '2024-03-18T09:15:00Z',
    created_at: '2024-02-15T16:30:00Z',
    updated_at: '2024-03-18T09:15:00Z'
  }
];

export default function DemoPage() {
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [userConnections, setUserConnections] = useState<UserConnection[]>(DEMO_CONNECTIONS);
  const [showAgentDashboard, setShowAgentDashboard] = useState(false);
  const [showInsights, setShowInsights] = useState(true); // Show insights by default in demo
  const [showRetailerConnect, setShowRetailerConnect] = useState(false);
  
  // Modal states
  const [quickCashModalOpen, setQuickCashModalOpen] = useState(false);
  const [warrantyModalOpen, setWarrantyModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Demo stats
  const stats = {
    totalProducts: products.length,
    totalValue: products.reduce((sum, p) => sum + (p.purchase_price || 0), 0),
    activeWarranties: products.filter(p => {
      if (!p.warranties || !Array.isArray(p.warranties)) return false;
      return p.warranties.some(w => {
        if (!w.warranty_end_date) return true;
        return new Date(w.warranty_end_date) > new Date();
      });
    }).length,
    expiringWarranties: products.filter(p => {
      if (!p.warranties || !Array.isArray(p.warranties)) return false;
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return p.warranties.some(w => {
        if (!w.warranty_end_date) return false;
        const endDate = new Date(w.warranty_end_date);
        return endDate > new Date() && endDate <= thirtyDaysFromNow;
      });
    }).length,
    connectedRetailers: userConnections.filter(c => c.status === 'connected').length
  };

  const handleProductAction = async (productId: string, action: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    switch (action) {
      case 'view':
        toast.success(`Viewing ${product.product_name} details`);
        break;
      case 'edit':
        toast.success(`Editing ${product.product_name}`);
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this product?')) {
          setProducts(prev => prev.filter(p => p.id !== productId));
          toast.success('Product removed from demo');
        }
        break;
      case 'quick_cash':
        setSelectedProduct(product);
        setQuickCashModalOpen(true);
        break;
      case 'warranty':
        setSelectedProduct(product);
        setWarrantyModalOpen(true);
        break;
      case 'claim':
        toast.success('Warranty claim analysis initiated! Our AI agent will review your product and identify claim opportunities.');
        break;
      case 'calendar':
        toast.success('Calendar events added! Check your calendar app.');
        break;
      default:
        console.warn('Unknown action:', action);
    }
  };

  const handleRefresh = () => {
    toast.success('Demo data refreshed! All AI agents are actively monitoring your products.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Demo Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              <span className="font-semibold">DEMO MODE</span>
            </div>
            <span className="text-blue-100 text-sm">
              Enterprise-level Claimso platform demonstration
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-300" />
              <span>AI Agents Active</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Demo User</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome to Claimso Enterprise Demo! 🚀
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Experience the future of purchase management with AI-powered automation
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      <Wifi className="h-3 w-3 mr-1" />
                      AI Agents Connected
                    </Badge>
                    <Badge variant="outline" className="text-blue-600 border-blue-300">
                      <Globe className="h-3 w-3 mr-1" />
                      Multi-Retailer Sync
                    </Badge>
                    <Badge variant="outline" className="text-purple-600 border-purple-300">
                      <Shield className="h-3 w-3 mr-1" />
                      Warranty Protection
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setShowRetailerConnect(!showRetailerConnect)}
                    variant={showRetailerConnect ? "default" : "outline"}
                    className="flex items-center gap-2"
                  >
                    <Link className="h-4 w-4" />
                    {showRetailerConnect ? 'Hide' : 'Connect'} Retailers
                  </Button>
                  <Button
                    onClick={() => setShowInsights(!showInsights)}
                    variant={showInsights ? "default" : "outline"}
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    {showInsights ? 'Hide' : 'View'} Insights
                  </Button>
                  <Button
                    onClick={() => setShowAgentDashboard(!showAgentDashboard)}
                    variant={showAgentDashboard ? "default" : "outline"}
                    className="flex items-center gap-2"
                  >
                    <Bot className="h-4 w-4" />
                    {showAgentDashboard ? 'Hide' : 'Monitor'} AI Agents
                  </Button>
                  <Button 
                    onClick={handleRefresh} 
                    variant="outline" 
                    size="icon"
                    title="Refresh demo data"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total Products</p>
                    <p className="text-3xl font-bold text-blue-900">{stats.totalProducts}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Portfolio Value</p>
                    <p className="text-3xl font-bold text-green-900">
                      ${stats.totalValue.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Active Warranties</p>
                    <p className="text-3xl font-bold text-purple-900">{stats.activeWarranties}</p>
                  </div>
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Connected Retailers</p>
                    <p className="text-3xl font-bold text-orange-900">{stats.connectedRetailers}</p>
                  </div>
                  <Link className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Agent Dashboard */}
          {showAgentDashboard && (
            <AgentDashboard />
          )}

          {/* Retailer Connect Section */}
          {showRetailerConnect && (
            <Card>
              <CardContent className="pt-6">
                <RetailerConnect 
                  connectedRetailers={userConnections.map(conn => conn.provider)}
                  onConnect={(retailerId) => {
                    toast.success(`Connected to ${retailerId}!`);
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Insights Section */}
          {showInsights && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      AI-Powered Product Insights
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Real-time analytics and intelligent recommendations
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Total Value */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-700">Total Portfolio Value</p>
                        <p className="text-2xl font-bold text-blue-900">
                          ${stats.totalValue.toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>

                  {/* Category Distribution */}
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700">Categories</p>
                        <p className="text-2xl font-bold text-green-900">
                          {new Set(products.map(p => p.category)).size}
                        </p>
                      </div>
                      <PieChart className="h-8 w-8 text-green-600" />
                    </div>
                  </div>

                  {/* Warranty Coverage */}
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-700">Warranty Coverage</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {products.filter(p => p.warranties && p.warranties.length > 0).length}/{products.length}
                        </p>
                      </div>
                      <Shield className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>

                  {/* Top Brand */}
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-700">Top Brand</p>
                        <p className="text-lg font-bold text-orange-900">
                          {(() => {
                            const brandCounts = products.reduce((acc, p) => {
                              if (p.brand) acc[p.brand] = (acc[p.brand] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);
                            const topBrand = Object.entries(brandCounts).sort(([,a], [,b]) => b - a)[0];
                            return topBrand ? topBrand[0] : 'N/A';
                          })()}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-orange-600" />
                    </div>
                  </div>

                  {/* Average Price */}
                  <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-700">Average Price</p>
                        <p className="text-lg font-bold text-red-900">
                          ${(() => {
                            const prices = products.map(p => p.purchase_price).filter((price): price is number => price !== null && price !== undefined);
                            return prices.length > 0 
                              ? (prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(0)
                              : '0';
                          })()}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-red-600" />
                    </div>
                  </div>

                  {/* Cash Opportunities */}
                  <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-yellow-700">Cash Opportunities</p>
                        <p className="text-lg font-bold text-yellow-900">
                          {products.filter(p => p.category && !['Groceries', 'Consumables'].includes(p.category)).length}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-yellow-600" />
                    </div>
                  </div>
                </div>

                {/* AI Agent Insights */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    AI Agent Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 mb-2">
                        <strong>WarrantyClaimAgent:</strong> Continuously monitoring your products for warranty claim opportunities
                      </p>
                      <p className="text-gray-600 mb-2">
                        <strong>CashExtractionAgent:</strong> Scanning for cash-back and trade-in opportunities
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-2">
                        <strong>ProductIntelligenceAgent:</strong> Enriching product data and identifying maintenance needs
                      </p>
                      <p className="text-gray-600 mb-2">
                        <strong>EmailMonitoringAgent:</strong> Automatically capturing new purchases from email receipts
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Your Product Portfolio</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {products.length} premium products with full warranty coverage
                  </p>
                </div>
                <ViewToggle />
              </div>
            </CardHeader>
            <CardContent>
              <ProductGrid 
                products={products} 
                onActionClick={handleProductAction}
                isLoading={false}
              />
            </CardContent>
          </Card>

          {/* Demo Features Showcase */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Enterprise Features Demo
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Experience the full power of Claimso's AI-driven platform
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-blue-900">Warranty Protection</h3>
                  </div>
                  <p className="text-blue-700 text-sm mb-4">
                    Automatic warranty tracking and claim assistance for all your products
                  </p>
                  <Button variant="outline" size="sm" className="border-blue-300 text-blue-700">
                    View Warranties
                  </Button>
                </div>

                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-green-900">Cash Extraction</h3>
                  </div>
                  <p className="text-green-700 text-sm mb-4">
                    Maximize value through trade-ins, cash-back, and resale opportunities
                  </p>
                  <Button variant="outline" size="sm" className="border-green-300 text-green-700">
                    Explore Options
                  </Button>
                </div>

                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
                      <Bot className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-purple-900">AI Automation</h3>
                  </div>
                  <p className="text-purple-700 text-sm mb-4">
                    Intelligent agents continuously monitor and optimize your portfolio
                  </p>
                  <Button variant="outline" size="sm" className="border-purple-300 text-purple-700">
                    Monitor Agents
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modals */}
          <QuickCashModal
            isOpen={quickCashModalOpen}
            onClose={() => {
              setQuickCashModalOpen(false);
              setSelectedProduct(null);
            }}
            product={selectedProduct}
          />

          <WarrantyDatabaseModal
            isOpen={warrantyModalOpen}
            onClose={() => {
              setWarrantyModalOpen(false);
              setSelectedProduct(null);
            }}
            product={selectedProduct}
          />
        </div>
      </div>
    </div>
  );
}
