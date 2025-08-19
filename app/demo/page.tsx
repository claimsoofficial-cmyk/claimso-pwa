'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield,
  DollarSign,
  Bot,
  Wifi,
  BarChart3,
  Package,
  Star,
  Users,
  Globe,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  TrendingUp,
  CheckCircle,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

// Simplified demo data
const DEMO_PRODUCTS = [
  {
    id: '1',
    name: 'MacBook Pro 16" M3 Max',
    brand: 'Apple',
    price: 3499,
    category: 'Electronics',
    warranty: '3-year AppleCare+',
    location: 'Apple Store'
  },
  {
    id: '2',
    name: 'Sony WH-1000XM5 Headphones',
    brand: 'Sony',
    price: 399,
    category: 'Electronics',
    warranty: '2-year warranty',
    location: 'Best Buy'
  },
  {
    id: '3',
    name: 'Dyson V15 Detect Absolute',
    brand: 'Dyson',
    price: 749,
    category: 'Appliances',
    warranty: '2-year warranty',
    location: 'Target'
  },
  {
    id: '4',
    name: 'iPhone 15 Pro Max',
    brand: 'Apple',
    price: 1199,
    category: 'Electronics',
    warranty: '2-year AppleCare+',
    location: 'Verizon Store'
  },
  {
    id: '5',
    name: 'Samsung 65" QLED 4K TV',
    brand: 'Samsung',
    price: 1299,
    category: 'Electronics',
    warranty: '2-year warranty',
    location: 'Costco'
  }
];

export default function DemoPage() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  
  const totalValue = DEMO_PRODUCTS.reduce((sum, p) => sum + p.price, 0);
  const activeWarranties = DEMO_PRODUCTS.length;

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleAction = (action: string, productName?: string) => {
    switch (action) {
      case 'view':
        toast.success(`Viewing ${productName} details`);
        break;
      case 'warranty':
        toast.success(`Warranty details for ${productName}`);
        break;
      case 'cash':
        toast.success(`Cash extraction analysis for ${productName}`);
        break;
      case 'connect':
        toast.success('Connecting to retailer...');
        break;
      case 'insights':
        toast.success('Loading AI-powered insights...');
        break;
      case 'agents':
        toast.success('AI agents are actively monitoring your portfolio');
        break;
      case 'refresh':
        toast.success('Data refreshed! All systems operational.');
        break;
      default:
        toast.success('Action completed successfully!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enterprise Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              <span className="font-semibold text-sm sm:text-base">ENTERPRISE DEMO</span>
            </div>
            <span className="text-blue-100 text-xs sm:text-sm hidden sm:block">
              Claimso Platform - AI-Powered Purchase Management
            </span>
          </div>
          
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
        {/* Hero Section */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-white to-blue-50">
          <CardContent className="p-8">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Welcome to Claimso Enterprise 🚀
              </h1>
              <p className="text-gray-600 text-lg mb-6 max-w-2xl">
                Experience the future of purchase management with AI-powered automation, 
                warranty protection, and intelligent cash extraction.
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 mb-6">
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
              
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                <Button
                  onClick={() => handleAction('connect')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Connect Retailers
                </Button>
                <Button
                  onClick={() => handleAction('insights')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  View Insights
                </Button>
                <Button
                  onClick={() => handleAction('agents')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Bot className="h-4 w-4" />
                  Monitor AI Agents
                </Button>
                <Button 
                  onClick={() => handleAction('refresh')} 
                  variant="outline" 
                  size="sm"
                >
                  <Zap className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Products</p>
                  <p className="text-3xl font-bold text-blue-900">{DEMO_PRODUCTS.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Portfolio Value</p>
                  <p className="text-3xl font-bold text-green-900">
                    ${(totalValue / 1000).toFixed(1)}k
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Active Warranties</p>
                  <p className="text-3xl font-bold text-purple-900">{activeWarranties}</p>
                </div>
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Connected Retailers</p>
                  <p className="text-3xl font-bold text-orange-900">3</p>
                </div>
                <Globe className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Portfolio */}
        <Card className="shadow-lg">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('products')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Product Portfolio</h2>
                <Badge variant="secondary">
                  {DEMO_PRODUCTS.length} items
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
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DEMO_PRODUCTS.map((product) => (
                  <div key={product.id} className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.brand} • {product.category}</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-semibold">${product.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Warranty:</span>
                        <span className="text-green-600">{product.warranty}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Location:</span>
                        <span className="text-blue-600">{product.location}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleAction('view', product.name)}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleAction('warranty', product.name)}
                      >
                        Warranty
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleAction('cash', product.name)}
                      >
                        Cash
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Enterprise Features */}
        <Card className="shadow-lg">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('features')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-yellow-600" />
                <h2 className="text-xl font-semibold text-gray-900">Enterprise Features</h2>
              </div>
              {expandedSections.has('features') ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </CardHeader>
          
          {expandedSections.has('features') && (
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                      <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-blue-900">Warranty Protection</h3>
                  </div>
                  <p className="text-blue-700 text-sm mb-4">
                    Automatic warranty tracking and claim assistance for all your products
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-blue-300 text-blue-700"
                    onClick={() => handleAction('warranty')}
                  >
                    View Warranties
                  </Button>
                </div>

                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-green-900">Cash Extraction</h3>
                  </div>
                  <p className="text-green-700 text-sm mb-4">
                    Maximize value through trade-ins, cash-back, and resale opportunities
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-green-300 text-green-700"
                    onClick={() => handleAction('cash')}
                  >
                    Explore Options
                  </Button>
                </div>

                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                      <Bot className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-purple-900">AI Automation</h3>
                  </div>
                  <p className="text-purple-700 text-sm mb-4">
                    Intelligent agents continuously monitor and optimize your portfolio
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-purple-300 text-purple-700"
                    onClick={() => handleAction('agents')}
                  >
                    Monitor Agents
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Enterprise Footer */}
        <Card className="border-0 bg-gradient-to-r from-gray-50 to-gray-100 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Claimso</span>
            </div>
            <p className="text-lg text-gray-600 mb-6">
              Enterprise-level purchase management platform
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                AI-Powered
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Multi-Retailer
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-purple-500" />
                Warranty Protection
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-green-500" />
                Cash Extraction
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
