'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createProduct } from '@/lib/actions/product-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Plus, 
  Download, 
  Settings, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Upload,
  FileText,
  Hash
} from 'lucide-react';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import CredentialConnectModal from '@/components/onboarding/CredentialConnectModal';
import LivingCard from '@/components/domain/products/LivingCard';

import ProductTour from '@/components/shared/ProductTour';
import { detectWarrantyLinkages, bundleLinkedProducts } from '@/lib/warranty-utils';

// ==============================================================================
// TYPESCRIPT INTERFACES
// ==============================================================================

interface ProductWithRelations {
  id: string;
  product_name: string;
  brand: string | null;
  category: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  currency: string;
  serial_number: string | null;
  condition: 'new' | 'used' | 'refurbished' | 'damaged';
  notes: string | null;
  created_at: string;
  warranties?: Array<{
    id: string;
    warranty_start_date: string | null;
    warranty_end_date: string | null;
    warranty_duration_months: number | null;
    warranty_type: 'manufacturer' | 'extended' | 'store' | 'insurance';
    coverage_details: string | null;
    ai_confidence_score: number | null;
  }>;
  documents?: Array<{
    id: string;
    file_name: string;
    file_url: string;
    document_type: 'receipt' | 'warranty_pdf' | 'manual' | 'insurance' | 'photo' | 'other';
    is_primary: boolean;
  }>;
}

interface UserConnection {
  retailer: string;
  status: string;
  last_synced_at?: string;
}

interface EmailScrapeStatus {
  last_check: string;
  new_products: number;
  status: 'idle' | 'processing' | 'completed' | 'error';
}

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================

export default function DashboardPage() {
  // State management
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isCredModalOpen, setIsCredModalOpen] = useState(false);
  const [isAddDetailsModalOpen, setIsAddDetailsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [credRetailer, setCredRetailer] = useState<string>('walmart');
  const [userConnections, setUserConnections] = useState<UserConnection[]>([]);
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [userId, setUserId] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [emailScrapeStatus, setEmailScrapeStatus] = useState<EmailScrapeStatus>({
    last_check: '',
    new_products: 0,
    status: 'idle'
  });

  // Initialize Supabase client
  const supabase = createClient();

  // ==============================================================================
  // DATA FETCHING
  // ==============================================================================

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        // Fetch all data in parallel for better performance
        await Promise.all([
          fetchUserData(),
          fetchProducts(),
          fetchUserConnections(),
          fetchEmailScrapeStatus()
        ]);
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setDisplayName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');
        
        // Fetch profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (profile?.full_name) {
          setDisplayName(profile.full_name);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: productsData, error } = await supabase
        .from('products')
        .select(`
          *,
          warranties (*),
          documents (*)
        `)
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(productsData || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserConnections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: connectionsData, error: connError } = await supabase
        .from('user_connections')
        .select('retailer, status, last_synced_at')
        .eq('user_id', user.id);
      
      if (connError) {
        console.error('Error fetching connections:', connError);
      } else {
        setUserConnections(connectionsData || []);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const fetchEmailScrapeStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch recent email processing activity
      const { data: recentActivity } = await supabase
        .from('products')
        .select('created_at, source')
        .eq('user_id', user.id)
        .eq('source', 'email_import')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (recentActivity) {
        setEmailScrapeStatus({
          last_check: recentActivity[0]?.created_at || '',
          new_products: recentActivity.length,
          status: recentActivity.length > 0 ? 'completed' : 'idle'
        });
      }
    } catch (error) {
      console.error('Error fetching email scrape status:', error);
    }
  };

  // ==============================================================================
  // HELPER FUNCTIONS
  // ==============================================================================

  // Helper function to format last synced timestamp
  const formatLastSynced = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  // Group products by category
  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, ProductWithRelations[]>);

  // Detect warranty linkages and bundle products
  const warrantyLinkages = detectWarrantyLinkages(products);
  const bundledProducts = useMemo(() => {
    if (!products.length) return [];
    const warrantyLinkages = detectWarrantyLinkages(products);
    return bundleLinkedProducts(products, warrantyLinkages);
  }, [products]);

  // Show notification for enhanced protection products
  useEffect(() => {
    const enhancedProducts = bundledProducts.filter(bundle => bundle.hasEnhancedProtection);
    if (enhancedProducts.length > 0) {
      toast.success('Enhanced Protection Detected', {
        description: `Found ${enhancedProducts.length} product${enhancedProducts.length > 1 ? 's' : ''} with extended warranty coverage.`
      });
    }
  }, [bundledProducts]);

  // Group bundled products by category
  const groupedBundledProducts = bundledProducts.reduce((acc, bundle) => {
    const category = bundle.mainProduct.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(bundle);
    return acc;
  }, {} as Record<string, typeof bundledProducts>);

  // Separate warranty-worthy items from non-warranty items
  const warrantyWorthyProducts = bundledProducts.filter(bundle => isWarrantyWorthy(bundle.mainProduct));
  const nonWarrantyProducts = bundledProducts.filter(bundle => !isWarrantyWorthy(bundle.mainProduct));

  // Group warranty-worthy products by category
  const groupedWarrantyProducts = useMemo(() => {
    const warrantyWorthyProducts = bundledProducts.filter(bundle => isWarrantyWorthy(bundle.mainProduct));
    return warrantyWorthyProducts.reduce((acc, bundle) => {
      const category = bundle.mainProduct.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(bundle);
      return acc;
    }, {} as Record<string, typeof warrantyWorthyProducts>);
  }, [bundledProducts]);

  // Group non-warranty products by category
  const groupedNonWarrantyProducts = useMemo(() => {
    const nonWarrantyProducts = bundledProducts.filter(bundle => !isWarrantyWorthy(bundle.mainProduct));
    return nonWarrantyProducts.reduce((acc, bundle) => {
      const category = bundle.mainProduct.category || 'Other Items';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(bundle);
      return acc;
    }, {} as Record<string, typeof nonWarrantyProducts>);
  }, [bundledProducts]);

  // Memoize user connections status
  const connectedRetailers = useMemo(() => {
    return userConnections.filter(c => c.status === 'connected').length;
  }, [userConnections]);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  /**
   * Helper function to determine if product is warranty-worthy
   */
  function isWarrantyWorthy(product: any): boolean {
    const category = product.category?.toLowerCase() || '';
    const price = product.purchase_price || 0;
    
    // Non-warranty categories
    const nonWarrantyCategories = [
      'clothing', 'apparel', 'fashion', 'shoes', 'accessories',
      'bedding', 'linens', 'towels', 'curtains', 'home decor',
      'food', 'beverages', 'groceries', 'consumables',
      'books', 'magazines', 'media', 'digital content',
      'cosmetics', 'beauty', 'personal care', 'hygiene'
    ];
    
    // Check if category is non-warranty
    if (nonWarrantyCategories.some(cat => category.includes(cat))) {
      return false;
    }
    
    // Low-value items typically don't need warranty
    if (price < 25) {
      return false;
    }
    
    return true;
  }

  // ==============================================================================
  // EVENT HANDLERS
  // ==============================================================================

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await createProduct(formData);
    if (result.success) {
      setIsAddProductModalOpen(false);
      toast.success('Product added', { description: `${result.product?.product_name || 'New product'} created.` });
      fetchProducts();
    } else {
      toast.error(result.error || 'Failed to create product');
    }
  };

  const handleCredentialConnect = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('/api/import/credentialed-scrape', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setIsCredModalOpen(false);
        toast.success('Connection successful', { 
          description: `Imported ${result.products?.length || 0} products from ${credRetailer}` 
        });
        fetchProducts();
        fetchUserConnections();
      } else {
        toast.error(result.error || 'Connection failed');
      }
    } catch (error) {
      console.error('Credential connect error:', error);
      toast.error('Connection failed. Please try again.');
    }
  };

  const handleAddDetails = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      // Handle serial number update
      const serialNumber = formData.get('serialNumber') as string;
      if (serialNumber && selectedProductId) {
        const { error } = await supabase
          .from('products')
          .update({ serial_number: serialNumber })
          .eq('id', selectedProductId);
        
        if (error) throw error;
      }

      // Handle receipt upload (simplified - would need file upload logic)
      const receiptFile = formData.get('receipt') as File;
      if (receiptFile && selectedProductId) {
        // File upload logic would go here
        toast.success('Receipt uploaded successfully');
      }

      setIsAddDetailsModalOpen(false);
      setSelectedProductId(null);
      toast.success('Product details updated');
      fetchProducts();
    } catch (error) {
      console.error('Error updating product details:', error);
      toast.error('Failed to update product details');
    }
  };

  // ==============================================================================
  // RENDER
  // ==============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductTour />
      
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {displayName}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {products.length} products • {connectedRetailers} retailers connected
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Floating Retailer Icons */}
            <div className="flex items-center gap-2">
              {[
                { id: 'amazon', label: 'Amazon', logo: '/logos/amazon.svg', type: 'oauth' },
                { id: 'walmart', label: 'Walmart', logo: '/logos/walmart.svg', type: 'cred' },
                { id: 'target', label: 'Target', logo: '/logos/target.svg', type: 'cred' },
                { id: 'bestbuy', label: 'Best Buy', logo: '/logos/bestbuy.svg', type: 'cred' },
              ].map(r => {
                const connection = userConnections.find(c => c.retailer === r.id && c.status === 'connected');
                const isConnected = !!connection;
                
                return (
                  <button
                    key={r.id}
                    className={`relative p-2 rounded-full transition-all ${
                      isConnected 
                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    onClick={() => {
                      if (r.type === 'oauth') {
                        toast.message('Redirecting to Amazon...', { description: 'Complete the sign-in to connect.' });
                        window.location.href = `https://www.amazon.com/ap/oa?client_id=${encodeURIComponent(process.env.NEXT_PUBLIC_AMAZON_CLIENT_ID || '')}&response_type=code&scope=profile&redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/amazon/auth')}&state=${Math.random().toString(16).slice(2)}`;
                      } else {
                        setCredRetailer(r.id);
                        setIsCredModalOpen(true);
                      }
                    }}
                    title={`${isConnected ? 'Connected' : 'Connect'} ${r.label}`}
                  >
                    <img src={r.logo} alt={r.label} className="w-5 h-5" />
                    {isConnected && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Install Extension Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast.message('Extension Installation', { 
                  description: 'Redirecting to Chrome Web Store...' 
                });
                // window.open('https://chrome.google.com/webstore/detail/claimso/...', '_blank');
              }}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Install Extension
            </Button>

            {/* Settings Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/settings/account'}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Email Scrape Status */}
        {emailScrapeStatus.status === 'completed' && emailScrapeStatus.new_products > 0 && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Email processing complete! Found {emailScrapeStatus.new_products} new products.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Quick Actions */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            onClick={() => setIsConnectionModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Connect Account
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setIsAddProductModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Products Section */}
        <div className="space-y-6">
          {/* Warranty-Worthy Products */}
          {Object.entries(groupedWarrantyProducts).map(([category, categoryBundles]) => (
            <div key={category} className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                  <Badge variant="secondary">{categoryBundles.length}</Badge>
                </div>
                {expandedCategories.has(category) ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {expandedCategories.has(category) && (
                <div className="border-t border-gray-200 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryBundles.map((bundle, index) => (
                      <div key={bundle.mainProduct.id} id={`product-card-${index}`}>
                        <LivingCard
                          product={bundle.mainProduct as any}
                          onAddSerialNumber={(productId) => {
                            setSelectedProductId(productId);
                            setIsAddDetailsModalOpen(true);
                          }}
                          onAddDocuments={(productId) => {
                            setSelectedProductId(productId);
                            setIsAddDetailsModalOpen(true);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Non-Warranty Items Section */}
          {Object.keys(groupedNonWarrantyProducts).length > 0 && (
            <div className="bg-gray-50 rounded-lg border border-gray-200">
              <button
                onClick={() => toggleCategory('non-warranty')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-700">Other Items</h3>
                  <Badge variant="outline" className="text-gray-600">
                    {nonWarrantyProducts.length} items
                  </Badge>
                  <span className="text-sm text-gray-500">(Low warranty priority)</span>
                </div>
                {expandedCategories.has('non-warranty') ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {expandedCategories.has('non-warranty') && (
                <div className="border-t border-gray-200 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nonWarrantyProducts.map((bundle, index) => (
                      <div key={bundle.mainProduct.id} className="opacity-75">
                        <LivingCard
                          product={bundle.mainProduct as any}
                          onAddSerialNumber={(productId) => {
                            setSelectedProductId(productId);
                            setIsAddDetailsModalOpen(true);
                          }}
                          onAddDocuments={(productId) => {
                            setSelectedProductId(productId);
                            setIsAddDetailsModalOpen(true);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Dialog open={isConnectionModalOpen} onOpenChange={setIsConnectionModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Connect Your Accounts</DialogTitle>
          </DialogHeader>
          <OnboardingFlow userId={userId} />
        </DialogContent>
      </Dialog>

      <Dialog open={isAddProductModalOpen} onOpenChange={setIsAddProductModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div>
              <Label htmlFor="product_name">Product Name</Label>
              <Input id="product_name" name="product_name" required />
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" name="brand" />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" />
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="flex-1">Add Product</Button>
              <Button type="button" variant="outline" onClick={() => setIsAddProductModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCredModalOpen} onOpenChange={setIsCredModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {credRetailer.charAt(0).toUpperCase() + credRetailer.slice(1)}</DialogTitle>
          </DialogHeader>
          <CredentialConnectModal 
            isOpen={isCredModalOpen}
            onClose={() => setIsCredModalOpen(false)}
            retailerName={credRetailer}
            onConnect={async ({ username, password }) => {
              const formData = new FormData();
              formData.append('retailer', credRetailer);
              formData.append('username', username);
              formData.append('password', password);
              await handleCredentialConnect({ currentTarget: { formData } } as any);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDetailsModalOpen} onOpenChange={setIsAddDetailsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Product Details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDetails} className="space-y-4">
            <div>
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input id="serialNumber" name="serialNumber" placeholder="Enter serial number" />
            </div>
            <div>
              <Label htmlFor="receipt">Upload Receipt</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <Input 
                  id="receipt" 
                  name="receipt" 
                  type="file" 
                  accept="image/*,.pdf"
                  className="mt-2"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="flex-1">Save Details</Button>
              <Button type="button" variant="outline" onClick={() => setIsAddDetailsModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}