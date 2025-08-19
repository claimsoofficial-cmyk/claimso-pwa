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
  BarChart3,
  TrendingUp,
  PieChart,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  Globe,
  Smartphone,
  Tablet,
  Monitor,
  ChevronDown,
  ChevronUp,
  Menu,
  X
} from 'lucide-react';
import type { Product, UserConnection } from '@/lib/types/common';
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
        id: 'w4',
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
  const [showInsights, setShowInsights] = useState(true);
  const [showRetailerConnect, setShowRetailerConnect] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  
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
        toast.success(`Quick cash analysis for ${product.product_name}`);
        break;
      case 'warranty':
        toast.success(`Warranty details for ${product.product_name}`);
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

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleFeatureClick = (feature: string) => {
    switch (feature) {
      case 'warranty':
        toast.success('Warranty Protection: Automatic tracking and claim assistance for all your products');
        break;
      case 'cash':
        toast.success('Cash Extraction: Maximize value through trade-ins, cash-back, and resale opportunities');
        break;
      case 'ai':
        toast.success('AI Automation: Intelligent agents continuously monitor and optimize your portfolio');
        break;
      case 'connect':
        setShowRetailerConnect(!showRetailerConnect);
        break;
      case 'agents':
        setShowAgentDashboard(!showAgentDashboard);
        break;
      case 'insights':
        setShowInsights(!showInsights);
        break;
      default:
        toast.success('Feature activated successfully!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Mobile-Optimized Demo Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              <span className="font-semibold text-sm sm:text-base">DEMO MODE</span>
            </div>
            <span className="text-blue-100 text-xs sm:text-sm hidden sm:block">
              Enterprise-level Claimso platform
            </span>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-green-300" />
                <span>AI Agents Active</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Demo User</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="sm:hidden text-white hover:bg-white/20"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex flex-col gap-3 text-sm">
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
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Mobile-Optimized Header */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Welcome to Claimso Enterprise Demo! 🚀
              </h1>
              <p className="text-gray-600 text-sm sm:text-base mb-4">
                Experience the future of purchase management with AI-powered automation
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                  <Wifi className="h-3 w-3 mr-1" />
                  AI Agents Connected
                </Badge>
                <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  Multi-Retailer Sync
                </Badge>
                <Badge variant="outline" className="text-purple-600 border-purple-300 text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Warranty Protection
                </Badge>
              </div>
              
              {/* Mobile Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                <Button
                  onClick={() => handleFeatureClick('connect')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-xs"
                >
                  <Link className="h-3 w-3" />
                  Connect Retailers
                </Button>
                <Button
                  onClick={() => handleFeatureClick('insights')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-xs"
                >
                  <BarChart3 className="h-3 w-3" />
                  View Insights
                </Button>
                <Button
                  onClick={() => handleFeatureClick('agents')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-xs"
                >
                  <Bot className="h-3 w-3" />
                  Monitor AI Agents
                </Button>
                <Button 
                  onClick={handleRefresh} 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile-Optimized Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700">Total Products</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalProducts}</p>
                </div>
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700">Portfolio Value</p>
                  <p className="text-lg font-bold text-green-900">
                    ${(stats.totalValue / 1000).toFixed(1)}k
                  </p>
                </div>
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-700">Active Warranties</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.activeWarranties}</p>
                </div>
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-orange-700">Connected Retailers</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.connectedRetailers}</p>
                </div>
                <Link className="h-6 w-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Collapsible Sections */}
        <div className="space-y-4">
          {/* Insights Section */}
          <Card>
            <CardHeader 
              className="cursor-pointer p-4"
              onClick={() => toggleSection('insights')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h2>
                </div>
                {expandedSections.has('insights') ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </CardHeader>
            
            {expandedSections.has('insights') && (
              <CardContent className="pt-0 px-4 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-blue-700">Portfolio Value</p>
                        <p className="text-lg font-bold text-blue-900">
                          ${stats.totalValue.toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>

                  <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-green-700">Categories</p>
                        <p className="text-lg font-bold text-green-900">
                          {new Set(products.map(p => p.category)).size}
                        </p>
                      </div>
                      <PieChart className="h-6 w-6 text-green-600" />
                    </div>
                  </div>

                  <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-purple-700">Warranty Coverage</p>
                        <p className="text-lg font-bold text-purple-900">
                          {products.filter(p => p.warranties && p.warranties.length > 0).length}/{products.length}
                        </p>
                      </div>
                      <Shield className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                    <Bot className="h-4 w-4" />
                    AI Agent Insights
                  </h3>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><strong>WarrantyClaimAgent:</strong> Monitoring products for warranty claim opportunities</p>
                    <p><strong>CashExtractionAgent:</strong> Scanning for cash-back and trade-in opportunities</p>
                    <p><strong>ProductIntelligenceAgent:</strong> Enriching product data and identifying maintenance needs</p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Products Section */}
          <Card>
            <CardHeader 
              className="cursor-pointer p-4"
              onClick={() => toggleSection('products')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Product Portfolio</h2>
                  <Badge variant="secondary" className="text-xs">
                    {products.length} items
                  </Badge>
                </div>
                {expandedSections.has('products') ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </CardHeader>
            
            {expandedSections.has('products') && (
              <CardContent className="pt-0 px-4 pb-4">
                <div className="space-y-3">
                  {products.map((product) => (
                    <div key={product.id} className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm">{product.product_name}</h3>
                          <p className="text-xs text-gray-600 mb-2">{product.brand} • {product.category}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>${product.purchase_price?.toLocaleString()}</span>
                            <span>{product.purchase_location}</span>
                            <span>{product.warranties?.length || 0} warranties</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleProductAction(product.id, 'view')}
                          >
                            <Package className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleProductAction(product.id, 'warranty')}
                          >
                            <Shield className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleProductAction(product.id, 'quick_cash')}
                          >
                            <DollarSign className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Features Section */}
          <Card>
            <CardHeader 
              className="cursor-pointer p-4"
              onClick={() => toggleSection('features')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Enterprise Features</h2>
                </div>
                {expandedSections.has('features') ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </CardHeader>
            
            {expandedSections.has('features') && (
              <CardContent className="pt-0 px-4 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center">
                        <Shield className="h-4 w-4 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-blue-900 text-sm">Warranty Protection</h3>
                    </div>
                    <p className="text-blue-700 text-xs mb-3">
                      Automatic warranty tracking and claim assistance
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-blue-300 text-blue-700 text-xs"
                      onClick={() => handleFeatureClick('warranty')}
                    >
                      View Warranties
                    </Button>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-green-900 text-sm">Cash Extraction</h3>
                    </div>
                    <p className="text-green-700 text-xs mb-3">
                      Maximize value through trade-ins and cash-back
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-green-300 text-green-700 text-xs"
                      onClick={() => handleFeatureClick('cash')}
                    >
                      Explore Options
                    </Button>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-purple-200 rounded-lg flex items-center justify-center">
                        <Bot className="h-4 w-4 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-purple-900 text-sm">AI Automation</h3>
                    </div>
                    <p className="text-purple-700 text-xs mb-3">
                      Intelligent agents monitor and optimize
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-purple-300 text-purple-700 text-xs"
                      onClick={() => handleFeatureClick('ai')}
                    >
                      Monitor Agents
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Mobile-Optimized Footer */}
        <Card className="border-0 bg-gradient-to-r from-gray-50 to-gray-100">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">Claimso</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Enterprise-level purchase management platform
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
              <span>AI-Powered</span>
              <span>•</span>
              <span>Multi-Retailer</span>
              <span>•</span>
              <span>Warranty Protection</span>
              <span>•</span>
              <span>Cash Extraction</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
