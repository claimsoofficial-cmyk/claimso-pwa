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
  Zap,
  ExternalLink,
  Settings,
  RefreshCw,
  Activity,
  PieChart,
  LineChart,
  Bell,
  Mail,
  Camera,
  CreditCard,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  Wrench,
  Clock,
  MapPin,
  Upload,
  FileText,
  CheckSquare,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';

// Enhanced demo data with SVG icons and cash opportunities
const DEMO_PRODUCTS = [
  {
    id: '1',
    name: 'MacBook Pro 16" M3 Max',
    brand: 'Apple',
    price: 3499,
    category: 'Electronics',
    warranty: '3-year AppleCare+',
    location: 'Apple Store',
    icon: '💻',
    cashOpportunities: [
      { type: 'Trade-in', value: 2800, platform: 'Apple Store' },
      { type: 'Resale', value: 3200, platform: 'eBay' },
      { type: 'Cash-back', value: 175, platform: 'Rakuten' }
    ],
    repairOptions: [
      { type: 'Screen Repair', cost: 299, duration: '2-3 days', location: 'Apple Store' },
      { type: 'Battery Replacement', cost: 129, duration: 'Same day', location: 'Apple Store' },
      { type: 'Logic Board Repair', cost: 599, duration: '5-7 days', location: 'Apple Service Center' }
    ]
  },
  {
    id: '2',
    name: 'Sony WH-1000XM5 Headphones',
    brand: 'Sony',
    price: 399,
    category: 'Electronics',
    warranty: '2-year warranty',
    location: 'Best Buy',
    icon: '🎧',
    cashOpportunities: [
      { type: 'Trade-in', value: 250, platform: 'Best Buy' },
      { type: 'Resale', value: 320, platform: 'Facebook Marketplace' },
      { type: 'Cash-back', value: 20, platform: 'Rakuten' }
    ],
    repairOptions: [
      { type: 'Ear Pad Replacement', cost: 49, duration: '1-2 days', location: 'Sony Service Center' },
      { type: 'Battery Replacement', cost: 89, duration: '3-5 days', location: 'Sony Service Center' },
      { type: 'Noise Cancellation Fix', cost: 149, duration: '5-7 days', location: 'Sony Service Center' }
    ]
  },
  {
    id: '3',
    name: 'Dyson V15 Detect Absolute',
    brand: 'Dyson',
    price: 749,
    category: 'Appliances',
    warranty: '2-year warranty',
    location: 'Target',
    icon: '🧹',
    cashOpportunities: [
      { type: 'Trade-in', value: 400, platform: 'Dyson' },
      { type: 'Resale', value: 550, platform: 'OfferUp' },
      { type: 'Cash-back', value: 37, platform: 'Target Circle' }
    ],
    repairOptions: [
      { type: 'Motor Replacement', cost: 199, duration: '3-5 days', location: 'Dyson Service Center' },
      { type: 'Battery Replacement', cost: 149, duration: '2-3 days', location: 'Dyson Service Center' },
      { type: 'Filter Replacement', cost: 29, duration: 'Same day', location: 'Dyson Service Center' }
    ]
  },
  {
    id: '4',
    name: 'iPhone 15 Pro Max',
    brand: 'Apple',
    price: 1199,
    category: 'Electronics',
    warranty: '2-year AppleCare+',
    location: 'Verizon Store',
    icon: '📱',
    cashOpportunities: [
      { type: 'Trade-in', value: 800, platform: 'Apple Store' },
      { type: 'Resale', value: 950, platform: 'Swappa' },
      { type: 'Cash-back', value: 60, platform: 'Verizon' }
    ],
    repairOptions: [
      { type: 'Screen Repair', cost: 399, duration: '2-3 days', location: 'Apple Store' },
      { type: 'Battery Replacement', cost: 89, duration: 'Same day', location: 'Apple Store' },
      { type: 'Camera Repair', cost: 199, duration: '3-5 days', location: 'Apple Service Center' }
    ]
  },
  {
    id: '5',
    name: 'Samsung 65" QLED 4K TV',
    brand: 'Samsung',
    price: 1299,
    category: 'Electronics',
    warranty: '2-year warranty',
    location: 'Costco',
    icon: '📺',
    cashOpportunities: [
      { type: 'Trade-in', value: 600, platform: 'Best Buy' },
      { type: 'Resale', value: 900, platform: 'Craigslist' },
      { type: 'Cash-back', value: 65, platform: 'Costco' }
    ],
    repairOptions: [
      { type: 'Panel Replacement', cost: 799, duration: '5-7 days', location: 'Samsung Service Center' },
      { type: 'Power Supply Repair', cost: 199, duration: '3-5 days', location: 'Samsung Service Center' },
      { type: 'Remote Replacement', cost: 49, duration: 'Same day', location: 'Samsung Service Center' }
    ]
  }
];

const NOTIFICATIONS = [
  {
    id: '1',
    type: 'warranty',
    title: 'Warranty Expiring Soon',
    message: 'Your Sony headphones warranty expires in 30 days',
    product: 'Sony WH-1000XM5 Headphones',
    time: '2 hours ago',
    icon: '🛡️'
  },
  {
    id: '2',
    type: 'cash',
    title: 'Cash Opportunity Found',
    message: 'Trade-in value increased for your MacBook Pro',
    product: 'MacBook Pro 16" M3 Max',
    time: '1 day ago',
    icon: '💰'
  },
  {
    id: '3',
    type: 'price',
    title: 'Price Drop Alert',
    message: 'Samsung TV price dropped by $200',
    product: 'Samsung 65" QLED 4K TV',
    time: '3 days ago',
    icon: '📉'
  },
  {
    id: '4',
    type: 'receipt',
    title: 'Receipt Processed',
    message: 'New purchase added from Amazon',
    product: 'Amazon Purchase',
    time: '1 week ago',
    icon: '📄'
  }
];

const EMAIL_RECEIPTS = [
  {
    id: '1',
    from: 'receipts@amazon.com',
    subject: 'Your Amazon.com order #123-4567890-1234567',
    date: '2024-03-20',
    status: 'processed',
    products: ['MacBook Pro 16" M3 Max'],
    total: 3499,
    retailer: 'Amazon'
  },
  {
    id: '2',
    from: 'receipts@bestbuy.com',
    subject: 'Best Buy Receipt - Order #BB123456',
    date: '2024-03-19',
    status: 'processed',
    products: ['Sony WH-1000XM5 Headphones'],
    total: 399,
    retailer: 'Best Buy'
  },
  {
    id: '3',
    from: 'receipts@target.com',
    subject: 'Target Receipt - Transaction #TGT789012',
    date: '2024-03-18',
    status: 'pending',
    products: ['Dyson V15 Detect Absolute'],
    total: 749,
    retailer: 'Target'
  },
  {
    id: '4',
    from: 'receipts@verizon.com',
    subject: 'Verizon Wireless Receipt #VZW456789',
    date: '2024-03-17',
    status: 'processed',
    products: ['iPhone 15 Pro Max'],
    total: 1199,
    retailer: 'Verizon'
  }
];

const CALENDAR_EVENTS = [
  {
    id: '1',
    type: 'warranty',
    title: 'Sony Headphones Warranty Expires',
    date: '2024-04-20',
    time: 'All day',
    product: 'Sony WH-1000XM5 Headphones',
    description: '2-year manufacturer warranty expires',
    color: 'red'
  },
  {
    id: '2',
    type: 'service',
    title: 'MacBook Pro Battery Check',
    date: '2024-03-25',
    time: '10:00 AM',
    product: 'MacBook Pro 16" M3 Max',
    description: 'Recommended battery health check',
    color: 'blue'
  },
  {
    id: '3',
    type: 'maintenance',
    title: 'Dyson Filter Replacement',
    date: '2024-03-30',
    time: '2:00 PM',
    product: 'Dyson V15 Detect Absolute',
    description: 'Filter replacement reminder',
    color: 'green'
  },
  {
    id: '4',
    type: 'price',
    title: 'iPhone Trade-in Value Check',
    date: '2024-04-05',
    time: 'All day',
    product: 'iPhone 15 Pro Max',
    description: 'Check updated trade-in values',
    color: 'purple'
  }
];

const DOCUMENTS = [
  {
    id: '1',
    type: 'receipt',
    name: 'Amazon MacBook Pro Receipt',
    product: 'MacBook Pro 16" M3 Max',
    date: '2024-01-15',
    size: '245 KB',
    status: 'processed',
    icon: '📄'
  },
  {
    id: '2',
    type: 'warranty',
    name: 'AppleCare+ Warranty Document',
    product: 'MacBook Pro 16" M3 Max',
    date: '2024-01-15',
    size: '1.2 MB',
    status: 'active',
    icon: '🛡️'
  },
  {
    id: '3',
    type: 'manual',
    name: 'Sony Headphones User Manual',
    product: 'Sony WH-1000XM5 Headphones',
    date: '2024-02-10',
    size: '3.1 MB',
    status: 'archived',
    icon: '📖'
  },
  {
    id: '4',
    type: 'service',
    name: 'Dyson Service Record',
    product: 'Dyson V15 Detect Absolute',
    date: '2024-03-01',
    size: '567 KB',
    status: 'processed',
    icon: '🔧'
  },
  {
    id: '5',
    type: 'receipt',
    name: 'Best Buy Headphones Receipt',
    product: 'Sony WH-1000XM5 Headphones',
    date: '2024-02-10',
    size: '189 KB',
    status: 'processed',
    icon: '📄'
  },
  {
    id: '6',
    type: 'warranty',
    name: 'Sony Extended Warranty',
    product: 'Sony WH-1000XM5 Headphones',
    date: '2024-02-10',
    size: '892 KB',
    status: 'active',
    icon: '🛡️'
  }
];

const PRICE_ALERTS = [
  {
    id: '1',
    product: 'Samsung 65" QLED 4K TV',
    currentPrice: 1299,
    originalPrice: 1499,
    priceDrop: 200,
    percentage: 13,
    retailer: 'Best Buy',
    status: 'active',
    icon: '📺'
  },
  {
    id: '2',
    product: 'Sony WH-1000XM5 Headphones',
    currentPrice: 349,
    originalPrice: 399,
    priceDrop: 50,
    percentage: 13,
    retailer: 'Amazon',
    status: 'active',
    icon: '🎧'
  },
  {
    id: '3',
    product: 'Dyson V15 Detect Absolute',
    currentPrice: 649,
    originalPrice: 749,
    priceDrop: 100,
    percentage: 13,
    retailer: 'Target',
    status: 'expired',
    icon: '🧹'
  },
  {
    id: '4',
    product: 'iPhone 15 Pro Max',
    currentPrice: 1099,
    originalPrice: 1199,
    priceDrop: 100,
    percentage: 8,
    retailer: 'Verizon',
    status: 'active',
    icon: '📱'
  }
];

const MAINTENANCE_RECORDS = [
  {
    id: '1',
    product: 'MacBook Pro 16" M3 Max',
    serviceType: 'routine',
    serviceDate: '2024-01-15',
    providerName: 'Apple Store',
    providerContact: '1-800-APL-CARE',
    cost: 0,
    currency: 'USD',
    description: 'Battery health check and system diagnostics',
    nextServiceDate: '2024-07-15',
    icon: '💻'
  },
  {
    id: '2',
    product: 'Dyson V15 Detect Absolute',
    serviceType: 'cleaning',
    serviceDate: '2024-02-01',
    providerName: 'Dyson Service Center',
    providerContact: '1-866-DYSON-US',
    cost: 29,
    currency: 'USD',
    description: 'Filter replacement and deep cleaning',
    nextServiceDate: '2024-05-01',
    icon: '🧹'
  },
  {
    id: '3',
    product: 'Sony WH-1000XM5 Headphones',
    serviceType: 'inspection',
    serviceDate: '2024-02-15',
    providerName: 'Sony Support',
    providerContact: '1-800-222-7669',
    cost: 0,
    currency: 'USD',
    description: 'Audio quality inspection and firmware update',
    nextServiceDate: '2024-08-15',
    icon: '🎧'
  },
  {
    id: '4',
    product: 'iPhone 15 Pro Max',
    serviceType: 'upgrade',
    serviceDate: '2024-03-01',
    providerName: 'Apple Store',
    providerContact: '1-800-APL-CARE',
    cost: 0,
    currency: 'USD',
    description: 'iOS update and security patch installation',
    nextServiceDate: '2024-06-01',
    icon: '📱'
  }
];

const RETAILERS = [
  { name: 'Amazon', status: 'connected', icon: '🛒', lastSync: '2 hours ago' },
  { name: 'Best Buy', status: 'connected', icon: '📱', lastSync: '1 day ago' },
  { name: 'Target', status: 'connected', icon: '🎯', lastSync: '3 days ago' },
  { name: 'Walmart', status: 'disconnected', icon: '🏪', lastSync: 'Never' },
  { name: 'Apple Store', status: 'disconnected', icon: '🍎', lastSync: 'Never' }
];

const AI_AGENTS = [
  { name: 'Warranty Monitor', status: 'active', activity: 'Scanning for expiring warranties', icon: '🛡️' },
  { name: 'Cash Extractor', status: 'active', activity: 'Finding trade-in opportunities', icon: '💰' },
  { name: 'Price Tracker', status: 'active', activity: 'Monitoring price drops', icon: '📊' },
  { name: 'Receipt Scanner', status: 'idle', activity: 'Waiting for new receipts', icon: '📄' }
];

export default function DemoPage() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [activePanel, setActivePanel] = useState<'main' | 'retailers' | 'insights' | 'agents'>('main');
  const [showQuickCashModal, setShowQuickCashModal] = useState(false);
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [showEmailReceiptModal, setShowEmailReceiptModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showPriceTrackingModal, setShowPriceTrackingModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
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
        const product = DEMO_PRODUCTS.find(p => p.name === productName);
        setSelectedProduct(product);
        setShowWarrantyModal(true);
        break;
      case 'cash':
        const cashProduct = DEMO_PRODUCTS.find(p => p.name === productName);
        setSelectedProduct(cashProduct);
        setShowQuickCashModal(true);
        break;
      case 'repair':
        const repairProduct = DEMO_PRODUCTS.find(p => p.name === productName);
        setSelectedProduct(repairProduct);
        setShowRepairModal(true);
        break;
      case 'email':
        setShowEmailReceiptModal(true);
        break;
      case 'calendar':
        setShowCalendarModal(true);
        break;
      case 'documents':
        setShowDocumentsModal(true);
        break;
      case 'prices':
        setShowPriceTrackingModal(true);
        break;
      case 'maintenance':
        setShowMaintenanceModal(true);
        break;
      case 'connect':
        setActivePanel('retailers');
        break;
      case 'insights':
        setActivePanel('insights');
        break;
      case 'agents':
        setActivePanel('agents');
        break;
      case 'refresh':
        toast.success('Data refreshed! All systems operational.');
        break;
      case 'notifications':
        setShowNotifications(!showNotifications);
        break;
      default:
        toast.success('Action completed successfully!');
    }
  };

  const RetailersPanel = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Connected Retailers</h2>
        <Button variant="outline" onClick={() => setActivePanel('main')}>
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RETAILERS.map((retailer) => (
          <Card key={retailer.name} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{retailer.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{retailer.name}</h3>
                    <p className="text-sm text-gray-500">Last sync: {retailer.lastSync}</p>
                  </div>
                </div>
                <Badge variant={retailer.status === 'connected' ? 'default' : 'secondary'}>
                  {retailer.status === 'connected' ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              
              {retailer.status === 'connected' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Automatically syncing purchases</span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Connection
                  </Button>
                </div>
              ) : (
                <Button size="sm" className="w-full">
                  <Globe className="h-4 w-4 mr-2" />
                  Connect Account
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const InsightsPanel = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Portfolio Insights</h2>
        <Button variant="outline" onClick={() => setActivePanel('main')}>
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-blue-700">Portfolio Growth</p>
                <p className="text-2xl font-bold text-blue-900">+23%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="h-20 bg-blue-200 rounded flex items-center justify-center">
              <LineChart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-green-700">Category Breakdown</p>
                <p className="text-2xl font-bold text-green-900">3</p>
              </div>
              <PieChart className="h-8 w-8 text-green-600" />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Electronics</span>
                <span className="font-semibold">80%</span>
              </div>
              <div className="flex justify-between">
                <span>Appliances</span>
                <span className="font-semibold">20%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-purple-700">Warranty Coverage</p>
                <p className="text-2xl font-bold text-purple-900">100%</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-sm text-purple-700">
              All products have active warranties
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">New purchase synced from Amazon</span>
              <span className="text-xs text-gray-500 ml-auto">2 hours ago</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Warranty claim opportunity detected</span>
              <span className="text-xs text-gray-500 ml-auto">1 day ago</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">Price drop alert for Samsung TV</span>
              <span className="text-xs text-gray-500 ml-auto">3 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AgentsPanel = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">AI Agents</h2>
        <Button variant="outline" onClick={() => setActivePanel('main')}>
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AI_AGENTS.map((agent) => (
          <Card key={agent.name} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{agent.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                    <p className="text-sm text-gray-500">{agent.activity}</p>
                  </div>
                </div>
                <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                  {agent.status === 'active' ? 'Active' : 'Idle'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className={agent.status === 'active' ? 'text-green-600' : 'text-gray-500'}>
                    {agent.status === 'active' ? 'Monitoring your portfolio' : 'Waiting for activity'}
                  </span>
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bot className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">AI Agent Summary</h3>
              <p className="text-sm text-green-700">All agents are running smoothly</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-900">3</p>
              <p className="text-xs text-green-700">Active</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900">1</p>
              <p className="text-xs text-green-700">Idle</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900">0</p>
              <p className="text-xs text-green-700">Issues</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Quick Cash Modal
  const QuickCashModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Cash Extraction Analysis</h2>
            <Button variant="ghost" onClick={() => setShowQuickCashModal(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          {selectedProduct && (
            <div className="mt-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
                {selectedProduct.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedProduct.name}</h3>
                <p className="text-sm text-gray-600">Original Price: ${selectedProduct.price.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {selectedProduct?.cashOpportunities.map((opportunity: any, index: number) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      ${opportunity.value.toLocaleString()}
                    </div>
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {opportunity.type}
                    </div>
                    <div className="text-xs text-gray-600 mb-3">
                      via {opportunity.platform}
                    </div>
                    <Button size="sm" className="w-full">
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Get Cash
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Repair Modal
  const RepairModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Repair Services</h2>
            <Button variant="ghost" onClick={() => setShowRepairModal(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          {selectedProduct && (
            <div className="mt-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
                {selectedProduct.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedProduct.name}</h3>
                <p className="text-sm text-gray-600">Find repair services near you</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {selectedProduct?.repairOptions.map((repair: any, index: number) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 text-sm">{repair.type}</h4>
                      <Badge variant="outline" className="text-xs">
                        {repair.duration}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{repair.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-blue-600">
                        ${repair.cost}
                      </div>
                      <Button size="sm" className="text-xs">
                        <Wrench className="h-4 w-4 mr-2" />
                        Schedule Repair
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Repair Summary</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <p className="text-2xl font-bold text-blue-900">
                  {selectedProduct?.repairOptions.length}
                </p>
                <p className="text-blue-700">Available Services</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">
                  ${Math.min(...selectedProduct?.repairOptions.map((r: any) => r.cost) || [0])}
                </p>
                <p className="text-blue-700">Starting Price</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">Same Day</p>
                <p className="text-blue-700">Fastest Service</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Warranty Modal
  const WarrantyModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Warranty Analysis</h2>
            <Button variant="ghost" onClick={() => setShowWarrantyModal(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          {selectedProduct && (
            <div className="mt-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
                {selectedProduct.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedProduct.name}</h3>
                <p className="text-sm text-gray-600">Warranty: {selectedProduct.warranty}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Coverage Status</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Hardware Defects</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between">
                    <span>Battery Issues</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between">
                    <span>Screen Damage</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between">
                    <span>Accidental Damage</span>
                    <X className="h-4 w-4 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Claim Opportunities</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span>Warranty expires in 6 months</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Eligible for extended warranty</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Free repair available</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900">AI Recommendation</h3>
            </div>
            <p className="text-sm text-purple-700 mb-3">
              Consider filing a warranty claim for the minor screen issue detected. This could result in a free replacement or repair.
            </p>
            <Button className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              File Warranty Claim
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Maintenance Tracking Modal
  const MaintenanceModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Maintenance Tracking</h2>
            <Button variant="ghost" onClick={() => setShowMaintenanceModal(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-gray-600 mt-2">
            Track service history, maintenance schedules, and keep your products in top condition
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Maintenance Setup */}
            <Card className="bg-indigo-50 border-indigo-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Wrench className="h-8 w-8 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-indigo-900">Service Types</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-sm font-medium text-gray-900 mb-2">Tracked services:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Routine maintenance</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Repairs & upgrades</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Cleaning services</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Inspections</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-sm font-medium text-gray-900 mb-2">Auto-reminders:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Service Due</Badge>
                      <Badge variant="outline">Warranty Expiry</Badge>
                      <Badge variant="outline">Filter Changes</Badge>
                      <Badge variant="outline">Software Updates</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Stats */}
            <Card className="bg-teal-50 border-teal-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="h-8 w-8 text-teal-600" />
                  <h3 className="text-lg font-semibold text-teal-900">Maintenance Stats</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-2xl font-bold text-teal-900">4</div>
                      <div className="text-xs text-teal-700">Service Records</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-2xl font-bold text-orange-900">$29</div>
                      <div className="text-xs text-orange-700">Total Spent</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-2xl font-bold text-blue-900">2</div>
                      <div className="text-xs text-blue-700">Due Soon</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-2xl font-bold text-purple-900">100%</div>
                      <div className="text-xs text-purple-700">Uptime</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Records */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <h3 className="text-lg font-semibold">Service History</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {MAINTENANCE_RECORDS.map((record) => (
                    <div key={record.id} className="p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-2xl">{record.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{record.product}</h4>
                          <p className="text-xs text-gray-600">{record.providerName}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {record.serviceType}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-gray-600">{record.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Service Date: {record.serviceDate}</span>
                          <span className="font-medium">${record.cost}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Next Service: {record.nextServiceDate}</span>
                          <span className="text-blue-600">{record.providerContact}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Schedule
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-xs">
                          <Wrench className="h-3 w-3 mr-1" />
                          Service
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  // Price Tracking Modal
  const PriceTrackingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Price Tracking</h2>
            <Button variant="ghost" onClick={() => setShowPriceTrackingModal(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-gray-600 mt-2">
            Monitor price drops and get alerts when your wishlist items go on sale
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Price Alerts Setup */}
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <h3 className="text-lg font-semibold text-orange-900">Price Alerts</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-sm font-medium text-gray-900 mb-2">Alert settings:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Email notifications</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Push notifications</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Price drop alerts</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-sm font-medium text-gray-900 mb-2">Tracked retailers:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Amazon</Badge>
                      <Badge variant="outline">Best Buy</Badge>
                      <Badge variant="outline">Target</Badge>
                      <Badge variant="outline">Walmart</Badge>
                      <Badge variant="outline">+20 more</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Tracking Stats */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-900">Tracking Stats</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-2xl font-bold text-green-900">4</div>
                      <div className="text-xs text-green-700">Active Alerts</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-2xl font-bold text-orange-900">$450</div>
                      <div className="text-xs text-orange-700">Total Savings</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-2xl font-bold text-blue-900">12%</div>
                      <div className="text-xs text-blue-700">Avg. Drop</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-2xl font-bold text-purple-900">8</div>
                      <div className="text-xs text-purple-700">Alerts Today</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Alerts List */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <h3 className="text-lg font-semibold">Active Price Alerts</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PRICE_ALERTS.map((alert) => (
                    <div key={alert.id} className="p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-2xl">{alert.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{alert.product}</h4>
                          <p className="text-xs text-gray-600">{alert.retailer}</p>
                        </div>
                        <Badge variant={alert.status === 'active' ? 'default' : 'secondary'}>
                          {alert.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Current Price:</span>
                          <span className="font-bold text-green-600">${alert.currentPrice}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Original Price:</span>
                          <span className="text-gray-600 line-through">${alert.originalPrice}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">You Save:</span>
                          <span className="font-bold text-orange-600">${alert.priceDrop} ({alert.percentage}%)</span>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 text-xs">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Deal
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-xs">
                          <Bell className="h-3 w-3 mr-1" />
                          Set Alert
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  // Documents Modal
  const DocumentsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Document Vault</h2>
            <Button variant="ghost" onClick={() => setShowDocumentsModal(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-gray-600 mt-2">
            All your receipts, warranties, manuals, and service records in one secure place
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Document Upload */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Upload className="h-8 w-8 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-900">Upload Documents</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-dashed border-gray-300">
                    <div className="text-center">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-900 mb-1">Drop files here or click to upload</p>
                      <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-sm font-medium text-gray-900 mb-2">Supported document types:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Receipts</Badge>
                      <Badge variant="outline">Warranties</Badge>
                      <Badge variant="outline">Manuals</Badge>
                      <Badge variant="outline">Service Records</Badge>
                      <Badge variant="outline">Invoices</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Stats */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">Document Stats</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-2xl font-bold text-blue-900">6</div>
                      <div className="text-xs text-blue-700">Total Documents</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-2xl font-bold text-green-900">4</div>
                      <div className="text-xs text-green-700">Processed</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-2xl font-bold text-purple-900">2</div>
                      <div className="text-xs text-purple-700">Active Warranties</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-2xl font-bold text-orange-900">6.2 MB</div>
                      <div className="text-xs text-orange-700">Total Size</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document List */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <h3 className="text-lg font-semibold">All Documents</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {DOCUMENTS.map((doc) => (
                    <div key={doc.id} className="p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-2xl">{doc.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{doc.name}</h4>
                          <p className="text-xs text-gray-600">{doc.product}</p>
                        </div>
                        <Badge variant={doc.status === 'active' ? 'default' : doc.status === 'processed' ? 'secondary' : 'outline'}>
                          {doc.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{doc.date}</span>
                        <span>{doc.size}</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-xs">
                          <Upload className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  // Calendar Modal
  const CalendarModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Smart Calendar</h2>
            <Button variant="ghost" onClick={() => setShowCalendarModal(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-gray-600 mt-2">
            Never miss warranty expirations, service appointments, or price drops
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar Integration */}
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="h-8 w-8 text-purple-600" />
                  <h3 className="text-lg font-semibold text-purple-900">Calendar Sync</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-sm font-medium text-gray-900 mb-2">Connected calendars:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Google Calendar</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Apple Calendar</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Outlook Calendar</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-sm font-medium text-gray-900 mb-2">Auto-sync events:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Warranty Expirations</Badge>
                      <Badge variant="outline">Service Reminders</Badge>
                      <Badge variant="outline">Price Alerts</Badge>
                      <Badge variant="outline">Maintenance</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Upcoming Events</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {CALENDAR_EVENTS.map((event) => (
                    <div key={event.id} className={`p-3 rounded-lg border-l-4 border-${event.color}-500 bg-gray-50`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {event.title}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {event.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{event.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{event.date} • {event.time}</span>
                        <span className="font-medium">{event.product}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-900 mb-1">1</div>
                <div className="text-sm text-red-700">Warranty Expiring</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-900 mb-1">1</div>
                <div className="text-sm text-blue-700">Service Due</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-900 mb-1">1</div>
                <div className="text-sm text-green-700">Maintenance</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-900 mb-1">1</div>
                <div className="text-sm text-purple-700">Price Alert</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  // Email Receipt Modal
  const EmailReceiptModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Email Receipt Processing</h2>
            <Button variant="ghost" onClick={() => setShowEmailReceiptModal(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-gray-600 mt-2">
            Forward your receipts to receipts@claimso.com and we'll automatically process them
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email Setup */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="h-8 w-8 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">Email Setup</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-sm font-medium text-gray-900 mb-2">Forward receipts to:</p>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        receipts@claimso.com
                      </code>
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-sm font-medium text-gray-900 mb-2">Supported retailers:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Amazon</Badge>
                      <Badge variant="outline">Best Buy</Badge>
                      <Badge variant="outline">Target</Badge>
                      <Badge variant="outline">Walmart</Badge>
                      <Badge variant="outline">Apple</Badge>
                      <Badge variant="outline">+50 more</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Receipts */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Recent Receipts</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {EMAIL_RECEIPTS.map((receipt) => (
                    <div key={receipt.id} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {receipt.retailer}
                          </span>
                        </div>
                        <Badge variant={receipt.status === 'processed' ? 'default' : 'secondary'}>
                          {receipt.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{receipt.subject}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{receipt.date}</span>
                        <span className="font-medium">${receipt.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Processing Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-900 mb-1">3</div>
                <div className="text-sm text-green-700">Processed Today</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-900 mb-1">1</div>
                <div className="text-sm text-blue-700">Pending</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-900 mb-1">95%</div>
                <div className="text-sm text-purple-700">Success Rate</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  // Notifications Panel
  const NotificationsPanel = () => (
    <div className="fixed top-20 right-4 bg-white rounded-lg shadow-xl border max-w-sm w-full z-40">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowNotifications(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {NOTIFICATIONS.map((notification) => (
          <div key={notification.id} className="p-4 border-b hover:bg-gray-50 cursor-pointer">
            <div className="flex items-start gap-3">
              <span className="text-xl">{notification.icon}</span>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (activePanel !== 'main') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {activePanel === 'retailers' && <RetailersPanel />}
          {activePanel === 'insights' && <InsightsPanel />}
          {activePanel === 'agents' && <AgentsPanel />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Clean Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              <span className="font-semibold text-sm sm:text-base">CLAIMSO DEMO</span>
            </div>
            <span className="text-blue-100 text-xs sm:text-sm hidden sm:block">
              Your smart purchase management platform
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
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 relative"
                onClick={() => handleAction('notifications')}
              >
                <Bell className="h-4 w-4" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </Button>
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
                Welcome to Claimso 🚀
              </h1>
              <p className="text-gray-600 text-lg mb-6 max-w-2xl">
                Never lose a receipt, warranty, or purchase again. Claimso automatically captures,
                organizes, and protects everything you buy.
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
                  onClick={() => handleAction('email')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Email Receipts
                </Button>
                <Button
                  onClick={() => handleAction('calendar')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Calendar
                </Button>
                <Button
                  onClick={() => handleAction('documents')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Documents
                </Button>
                <Button
                  onClick={() => handleAction('prices')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Price Tracking
                </Button>
                <Button
                  onClick={() => handleAction('maintenance')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Wrench className="h-4 w-4" />
                  Maintenance
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
                <h2 className="text-xl font-semibold text-gray-900">Your Products</h2>
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
                  <div key={product.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      <span className="text-6xl">{product.icon}</span>
                    </div>
                    <div className="p-4">
                      <div className="mb-3">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">{product.name}</h3>
                        <p className="text-xs text-gray-600">{product.brand} • {product.category}</p>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Price:</span>
                          <span className="font-semibold">${product.price.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Warranty:</span>
                          <span className="text-green-600">{product.warranty}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Location:</span>
                          <span className="text-blue-600">{product.location}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => handleAction('warranty', product.name)}
                        >
                          Warranty
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => handleAction('cash', product.name)}
                        >
                          Cash
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => handleAction('repair', product.name)}
                        >
                          Repair
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => handleAction('view', product.name)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Features */}
        <Card className="shadow-lg">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('features')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-yellow-600" />
                <h2 className="text-xl font-semibold text-gray-900">What Claimso Does</h2>
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
                    Never wonder if something is still under warranty. Get instant visibility into protection status.
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
                    Maximize value through trade-ins, cash-back, and resale opportunities.
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
                    Intelligent agents continuously monitor and optimize your portfolio.
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

        {/* Footer */}
        <Card className="border-0 bg-gradient-to-r from-gray-50 to-gray-100 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Claimso</span>
            </div>
            <p className="text-lg text-gray-600 mb-6">
              Your smart purchase management platform
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

      {/* Modals and Notifications */}
      {showQuickCashModal && <QuickCashModal />}
      {showWarrantyModal && <WarrantyModal />}
      {showRepairModal && <RepairModal />}
      {showEmailReceiptModal && <EmailReceiptModal />}
      {showCalendarModal && <CalendarModal />}
      {showDocumentsModal && <DocumentsModal />}
      {showPriceTrackingModal && <PriceTrackingModal />}
      {showMaintenanceModal && <MaintenanceModal />}
      {showNotifications && <NotificationsPanel />}
    </div>
  );
}
