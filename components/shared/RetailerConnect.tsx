'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ShoppingBag, 
  ExternalLink, 
  CheckCircle, 
  XCircle,
  Loader2,
  Store,
  CreditCard,
  Smartphone
} from 'lucide-react';

// Top 20 Global Retailers Configuration
const TOP_RETAILERS = [
  {
    id: 'amazon',
    name: 'Amazon',
    description: 'World\'s largest online marketplace',
    logo: '/logos/amazon.svg',
    color: '#FF9900',
    status: 'available',
    type: 'marketplace',
    regions: ['US', 'UK', 'DE', 'FR', 'IT', 'ES', 'JP', 'IN', 'CA', 'AU'],
    features: ['Order History', 'Product Details', 'Warranty Info']
  },
  {
    id: 'apple',
    name: 'Apple',
    description: 'Premium electronics and services',
    logo: '/logos/apple.svg',
    color: '#000000',
    status: 'available',
    type: 'electronics',
    regions: ['US', 'UK', 'DE', 'FR', 'IT', 'ES', 'JP', 'IN', 'CA', 'AU'],
    features: ['Purchase History', 'Device Registration', 'AppleCare']
  },
  {
    id: 'bestbuy',
    name: 'Best Buy',
    description: 'Electronics and appliances retailer',
    logo: '/logos/bestbuy.svg',
    color: '#0046BE',
    status: 'available',
    type: 'electronics',
    regions: ['US', 'CA'],
    features: ['Order History', 'Geek Squad Services', 'Rewards Program']
  },
  {
    id: 'target',
    name: 'Target',
    description: 'General merchandise and grocery',
    logo: '/logos/target.svg',
    color: '#CC0000',
    status: 'available',
    type: 'general',
    regions: ['US'],
    features: ['Order History', 'RedCard Benefits', 'Store Pickup']
  },
  {
    id: 'walmart',
    name: 'Walmart',
    description: 'Everyday low prices retailer',
    logo: '/logos/walmart.svg',
    color: '#0071CE',
    status: 'available',
    type: 'general',
    regions: ['US', 'CA', 'MX'],
    features: ['Order History', 'Walmart+ Benefits', 'Store Services']
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    description: 'India\'s leading e-commerce platform',
    logo: '/logos/flipkart.svg',
    color: '#2874F0',
    status: 'available',
    type: 'marketplace',
    regions: ['IN'],
    features: ['Order History', 'Flipkart Plus', 'Local Services']
  },
  {
    id: 'mediamarkt',
    name: 'MediaMarkt',
    description: 'European electronics retailer',
    logo: '/logos/mediamarkt.svg',
    color: '#FF0000',
    status: 'available',
    type: 'electronics',
    regions: ['DE', 'AT', 'NL', 'BE', 'IT', 'ES'],
    features: ['Order History', 'Expert Services', 'Warranty Support']
  },
  {
    id: 'johnlewis',
    name: 'John Lewis',
    description: 'UK department store and services',
    logo: '/logos/johnlewis.svg',
    color: '#000000',
    status: 'available',
    type: 'department',
    regions: ['UK'],
    features: ['Order History', 'Partnership Card', 'Home Services']
  },
  {
    id: 'swappa',
    name: 'Swappa',
    description: 'Safe marketplace for tech devices',
    logo: '/logos/swappa.svg',
    color: '#00C851',
    status: 'available',
    type: 'marketplace',
    regions: ['US'],
    features: ['Device History', 'Trade-in Values', 'Safe Transactions']
  },
  {
    id: 'gazelle',
    name: 'Gazelle',
    description: 'Electronics trade-in and resale',
    logo: '/logos/gazelle.svg',
    color: '#00A651',
    status: 'available',
    type: 'trade-in',
    regions: ['US'],
    features: ['Trade-in History', 'Device Values', 'Cash Offers']
  },
  {
    id: 'decluttr',
    name: 'Decluttr',
    description: 'Sell your tech for cash',
    logo: '/logos/decluttr.svg',
    color: '#FF6B35',
    status: 'available',
    type: 'trade-in',
    regions: ['US', 'UK'],
    features: ['Sell History', 'Instant Quotes', 'Free Shipping']
  },
  {
    id: 'ebay',
    name: 'eBay',
    description: 'Global online marketplace',
    logo: '/logos/ebay.svg',
    color: '#86D4F3',
    status: 'coming_soon',
    type: 'marketplace',
    regions: ['US', 'UK', 'DE', 'FR', 'IT', 'ES', 'AU'],
    features: ['Purchase History', 'Seller Tools', 'Protection Programs']
  },
  {
    id: 'etsy',
    name: 'Etsy',
    description: 'Handmade and vintage marketplace',
    logo: '/logos/etsy.svg',
    color: '#F56400',
    status: 'coming_soon',
    type: 'marketplace',
    regions: ['US', 'UK', 'DE', 'FR', 'IT', 'ES'],
    features: ['Purchase History', 'Seller Tools', 'Custom Orders']
  },
  {
    id: 'wayfair',
    name: 'Wayfair',
    description: 'Home goods and furniture',
    logo: '/logos/wayfair.svg',
    color: '#4A90E2',
    status: 'coming_soon',
    type: 'home',
    regions: ['US', 'CA', 'UK', 'DE'],
    features: ['Order History', 'Room Planning', 'Assembly Services']
  },
  {
    id: 'home_depot',
    name: 'Home Depot',
    description: 'Home improvement retailer',
    logo: '/logos/home_depot.svg',
    color: '#FF6600',
    status: 'coming_soon',
    type: 'home',
    regions: ['US', 'CA', 'MX'],
    features: ['Order History', 'Pro Services', 'Tool Rental']
  },
  {
    id: 'lowes',
    name: 'Lowe\'s',
    description: 'Home improvement and hardware',
    logo: '/logos/lowes.svg',
    color: '#004990',
    status: 'coming_soon',
    type: 'home',
    regions: ['US', 'CA'],
    features: ['Order History', 'Pro Services', 'Installation']
  },
  {
    id: 'costco',
    name: 'Costco',
    description: 'Membership warehouse club',
    logo: '/logos/costco.svg',
    color: '#E31837',
    status: 'coming_soon',
    type: 'warehouse',
    regions: ['US', 'CA', 'UK', 'MX', 'JP', 'KR'],
    features: ['Order History', 'Executive Rewards', 'Travel Services']
  },
  {
    id: 'sams_club',
    name: 'Sam\'s Club',
    description: 'Membership warehouse club',
    logo: '/logos/sams_club.svg',
    color: '#0071CE',
    status: 'coming_soon',
    type: 'warehouse',
    regions: ['US', 'MX'],
    features: ['Order History', 'Plus Benefits', 'Fuel Savings']
  },
  {
    id: 'microsoft',
    name: 'Microsoft Store',
    description: 'Microsoft products and services',
    logo: '/logos/microsoft.svg',
    color: '#00A4EF',
    status: 'coming_soon',
    type: 'electronics',
    regions: ['US', 'UK', 'DE', 'FR', 'IT', 'ES'],
    features: ['Purchase History', 'Xbox Services', 'Office 365']
  },
  {
    id: 'google',
    name: 'Google Store',
    description: 'Google hardware and services',
    logo: '/logos/google.svg',
    color: '#4285F4',
    status: 'coming_soon',
    type: 'electronics',
    regions: ['US', 'UK', 'DE', 'FR', 'IT', 'ES'],
    features: ['Purchase History', 'Google Services', 'Device Support']
  }
];

interface RetailerConnectProps {
  onConnect?: (retailerId: string) => void;
  connectedRetailers?: string[];
}

export default function RetailerConnect({ onConnect, connectedRetailers = [] }: RetailerConnectProps) {
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (retailerId: string) => {
    if (connecting) return;
    
    setConnecting(retailerId);
    
    try {
      // Handle different retailer connections
      switch (retailerId) {
        case 'amazon':
          await connectAmazon();
          break;
        case 'apple':
          await connectApple();
          break;
        case 'bestbuy':
          await connectBestBuy();
          break;
        default:
          toast.info(`${TOP_RETAILERS.find(r => r.id === retailerId)?.name} integration coming soon!`);
      }
      
      onConnect?.(retailerId);
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect. Please try again.');
    } finally {
      setConnecting(null);
    }
  };

  const connectAmazon = async () => {
    // Redirect to Amazon OAuth
    const amazonAuthUrl = `https://www.amazon.com/ap/oa?client_id=${process.env.NEXT_PUBLIC_AMAZON_CLIENT_ID}&scope=read_orders&response_type=code&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_AMAZON_REDIRECT_URI || 'https://claimso-pwa.vercel.app/api/auth/amazon/auth')}`;
    
    window.location.href = amazonAuthUrl;
  };

  const connectApple = async () => {
    toast.info('Apple integration coming soon! We\'ll support Apple ID authentication and purchase history.');
  };

  const connectBestBuy = async () => {
    toast.info('Best Buy integration coming soon! We\'ll support Best Buy account authentication and order history.');
  };

  const getStatusIcon = (status: string, isConnected: boolean) => {
    if (isConnected) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'available') return <ExternalLink className="h-4 w-4 text-blue-500" />;
    return <XCircle className="h-4 w-4 text-gray-400" />;
  };

  const getStatusBadge = (status: string, isConnected: boolean) => {
    if (isConnected) return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
    if (status === 'available') return <Badge variant="secondary">Available</Badge>;
    return <Badge variant="outline">Coming Soon</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Connect Your Retailers</h2>
        <p className="text-muted-foreground mt-2">
          Connect your accounts to automatically import purchases and track warranties
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOP_RETAILERS.map((retailer) => {
          const isConnected = connectedRetailers.includes(retailer.id);
          const isConnecting = connecting === retailer.id;
          
          return (
            <Card key={retailer.id} className="relative hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: retailer.color }}
                    >
                      <Store className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{retailer.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {retailer.description}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusIcon(retailer.status, isConnected)}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(retailer.status, isConnected)}
                    <div className="text-xs text-muted-foreground">
                      {retailer.regions.length} regions
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Features:</div>
                    <div className="flex flex-wrap gap-1">
                      {retailer.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleConnect(retailer.id)}
                    disabled={isConnected || retailer.status === 'coming_soon' || isConnecting}
                    className="w-full"
                    variant={isConnected ? "outline" : "default"}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : isConnected ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Connected
                      </>
                    ) : retailer.status === 'coming_soon' ? (
                      'Coming Soon'
                    ) : (
                      <>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Connect
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>More retailers coming soon! We're working to support all major global retailers.</p>
      </div>
    </div>
  );
}
