'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Phone, Download, CheckCircle, AlertTriangle, Loader2, Clock, FileText } from 'lucide-react';
import LivingCard from '@/components/domain/products/LivingCard';
import ResolutionFlow from '@/components/domain/resolution/ResolutionFlow';
import CallAssistant from '@/components/domain/resolution/CallAssistant';
import EditProductModal from '@/components/domain/products/EditProductModal';

// Base Product interface that accommodates all component requirements
interface Product {
  id: string;
  name: string;
  category?: string;
  serial_number?: string;
  order_number?: string;
  notes?: string;
  purchase_date?: string;
  warranty_length_months?: number;
  product_image_url?: string;
  retailer?: string;
  price?: number;
  warranties?: Record<string, unknown>[];
  // Additional fields for component compatibility
  user_id?: string;
  product_name?: string;
  brand?: string;
  model?: string;
  // Additional fields required by LivingCard
  purchase_price?: number;
  currency?: string;
  purchase_location?: string;
  condition?: 'new' | 'used' | 'refurbished' | 'damaged';
  warranty_status?: string;
  last_service_date?: string;
  next_service_due?: string;
  // Database fields
  is_archived?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Warranty interface to match LivingCard expectations
interface Warranty {
  id: string;
  warranty_start_date: string;
  warranty_end_date: string;
  warranty_duration_months: number;
  warranty_type: 'manufacturer' | 'extended' | 'store' | 'insurance';
  warranty_provider: string;
  warranty_terms: string;
  warranty_status: string;
  created_at: string;
  updated_at: string;
  product_id: string;
  // Additional properties required by LivingCard
  coverage_details: string;
  claim_process: string;
  contact_info: string;
  snapshot_data: Record<string, unknown>;
  // Additional required properties
  warranty_cost?: number;
  warranty_document_url?: string;
  ai_confidence_score: number;
  last_analyzed_at: string;
}

// LivingCard compatible product type
interface LivingCardProduct {
  id: string;
  name: string;
  category: string;
  serial_number: string | null;
  order_number?: string;
  notes: string | null;
  purchase_date: string | null;
  warranty_length_months?: number;
  product_image_url?: string;
  retailer?: string;
  price?: number;
  warranties?: Warranty[];
  user_id: string;
  product_name: string;
  brand: string;
  model: string;
  purchase_price: number;
  currency: string;
  purchase_location: string;
  condition: 'new' | 'used' | 'refurbished' | 'damaged';
  warranty_status: string;
  last_service_date?: string;
  next_service_due?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface ResolutionFlowData {
  issueType: string;
  problemDescription: string;
  urgency?: 'low' | 'medium' | 'high';
}

interface TriageResponse {
  success: boolean;
  recommended_path: 'phone_call' | 'claim_packet' | 'online_support';
  product?: {
    id: string;
    name: string;
    category: string;
  };
  timestamp?: string;
  error?: string;
}

interface ResolutionManagerProps {
  product: Product;
  onProductUpdate?: () => void;
}

type ResolutionStep = 'form' | 'processing' | 'result';

// Constants for better maintainability
const RESOLUTION_PATHS = {
  PHONE_CALL: 'phone_call',
  CLAIM_PACKET: 'claim_packet',
  ONLINE_SUPPORT: 'online_support',
} as const;

const STEP_TITLES = {
  form: 'Report an Issue',
  processing: 'Analyzing Issue', 
  result: 'Resolution Ready',
} as const;

const STEP_DESCRIPTIONS = {
  form: (productName: string) => `Let's help resolve your issue with ${productName}`,
  processing: 'Finding the best resolution path for your specific situation',
  result: 'Here\'s your personalized resolution plan',
} as const;

export default function ResolutionManager({ 
  product, 
  onProductUpdate 
}: ResolutionManagerProps) {
  // Modal state management
  const [isResolutionFlowOpen, setIsResolutionFlowOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Resolution flow state
  const [resolutionStep, setResolutionStep] = useState<ResolutionStep>('form');
  const [resolutionData, setResolutionData] = useState<ResolutionFlowData | null>(null);
  const [resolutionPath, setResolutionPath] = useState<TriageResponse['recommended_path'] | null>(null);
  const [triageResponse, setTriageResponse] = useState<TriageResponse | null>(null);

  // Create a compatible product object for LivingCard
  const createLivingCardProduct = (): LivingCardProduct => ({
    // Required fields
    id: product.id,
    name: product.name,
    user_id: product.user_id || product.id,
    product_name: product.product_name || product.name,
    brand: product.brand || 'Unknown',
    model: product.model || 'Unknown',
    category: product.category || 'General',
    purchase_price: product.purchase_price || product.price || 0,
    currency: product.currency || 'USD',
    purchase_location: product.purchase_location || product.retailer || 'Unknown',
    condition: (product.condition as 'new' | 'used' | 'refurbished' | 'damaged') || 'used',
    warranty_status: product.warranty_status || 'Active',
    is_archived: product.is_archived || false,
    created_at: product.created_at || new Date().toISOString(),
    updated_at: product.updated_at || new Date().toISOString(),
    // Convert undefined to null for LivingCard compatibility
    purchase_date: product.purchase_date || null,
    serial_number: product.serial_number || null,
    notes: product.notes || null,
    // Optional fields (pass through as-is)
    order_number: product.order_number,
    warranty_length_months: product.warranty_length_months,
    product_image_url: product.product_image_url,
    retailer: product.retailer,
    price: product.price,
    warranties: product.warranties as Warranty[] | undefined,
    last_service_date: product.last_service_date,
    next_service_due: product.next_service_due,
  });

  // Create a compatible product object for ResolutionFlow
  const createResolutionFlowProduct = (): Product => ({
    ...product,
    user_id: product.user_id || product.id,
    product_name: product.product_name || product.name,
    brand: product.brand || 'Unknown',
    model: product.model || 'Unknown',
    category: product.category || 'General',
    serial_number: product.serial_number || undefined,
  });

  // Create a compatible product object for EditProductModal
  const createEditModalProduct = (): Product & { category: string } => ({
    ...product,
    // Ensure category is required (not optional) for EditProductModal
    category: product.category || 'General',
    user_id: product.user_id || product.id,
    product_name: product.product_name || product.name,
    brand: product.brand || 'Unknown',
    model: product.model || 'Unknown',
    serial_number: product.serial_number || undefined,
  });

  // Handle "I have a problem" click from LivingCard
  const handleProblemClick = () => {
    setIsResolutionFlowOpen(true);
    resetResolutionFlow();
  };

  // Handle "Add Serial Number" or edit click from LivingCard
  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  // Reset resolution flow to initial state
  const resetResolutionFlow = () => {
    setResolutionStep('form');
    setResolutionData(null);
    setResolutionPath(null);
    setTriageResponse(null);
  };

  // Handle triage API call
  const performTriageAnalysis = async (data: ResolutionFlowData): Promise<TriageResponse> => {
    const response = await fetch('/api/resolution/triage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: product.id,
        issueType: data.issueType,
        problemDescription: data.problemDescription,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result: TriageResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Triage analysis failed');
    }

    return result;
  };

  // Handle ResolutionFlow completion - compatible with component interface
  const handleResolutionComplete = async (issueType: string, description: string) => {
    const data: ResolutionFlowData = {
      issueType,
      problemDescription: description,
    };
    
    setResolutionData(data);
    setResolutionStep('processing');

    try {
      const result = await performTriageAnalysis(data);
      
      setTriageResponse(result);
      setResolutionPath(result.recommended_path);
      setResolutionStep('result');
      
      toast.success('Resolution Path Identified', {
        description: `We've found the best way to help with your ${product.name}.`,
        icon: <CheckCircle className="h-4 w-4" />,
      });
    } catch (error) {
      console.error('Triage API error:', error);
      
      toast.error('Resolution Analysis Failed', {
        description: 'Unable to analyze your issue. Please try again or contact support.',
        duration: 6000,
      });
      
      setResolutionStep('form');
    }
  };

  // Handle canceling resolution flow
  const handleResolutionCancel = () => {
    setIsResolutionFlowOpen(false);
    resetResolutionFlow();
  };

  // Handle closing resolution result
  const handleResolutionClose = () => {
    setIsResolutionFlowOpen(false);
    resetResolutionFlow();
  };

  // Handle product update success
  const handleProductUpdateSuccess = () => {
    if (onProductUpdate) {
      onProductUpdate();
    }
  };

  // Render loading state
  const renderProcessingStep = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="relative">
        <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
        <Clock className="h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-700" />
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Analyzing Your Issue</h3>
        <p className="text-muted-foreground max-w-md">
          Our resolution engine is determining the best support path for your{' '}
          <span className="font-medium">{product.name}</span>...
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        Processing...
      </div>
    </div>
  );

  // Render phone call resolution
  const renderPhoneCallResolution = () => {
    if (!resolutionData) return null;
    
    return (
      <CallAssistant 
        product={createResolutionFlowProduct()}
        problemDescription={resolutionData.problemDescription}
      />
    );
  };

  // Render claim packet resolution
  const renderClaimPacketResolution = () => {
    const compatibleProduct = createResolutionFlowProduct();
    
    return (
      <div className="space-y-4">
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-900 mb-1">
                Documentation Required
              </h4>
              <p className="text-sm text-orange-800">
                Your {compatibleProduct.category} issue requires formal claim documentation. 
                This ensures proper processing and faster resolution.
              </p>
            </div>
          </div>
        </div>
        
        <Button className="w-full" size="lg">
          <Download className="mr-2 h-4 w-4" />
          Download Claim Packet
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          Complete and return within 30 days for expedited processing
        </p>
      </div>
    );
  };

  // Render online support resolution
  const renderOnlineSupportResolution = () => (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900 mb-1">
              Self-Service Available
            </h4>
            <p className="text-sm text-green-800">
              Your issue can likely be resolved using our online tools and guides.
            </p>
          </div>
        </div>
      </div>
      
      <Button className="w-full" size="lg">
        <Download className="mr-2 h-4 w-4" />
        Access Support Tools
      </Button>
    </div>
  );

  // Get resolution path configuration
  const getResolutionPathConfig = (path: TriageResponse['recommended_path']) => {
    const configs = {
      [RESOLUTION_PATHS.PHONE_CALL]: {
        icon: Phone,
        title: 'Direct Phone Support',
        description: 'Connect with a specialist for immediate assistance',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        component: renderPhoneCallResolution,
      },
      [RESOLUTION_PATHS.CLAIM_PACKET]: {
        icon: FileText,
        title: 'Claim Documentation',
        description: 'Complete documentation for warranty/insurance processing',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        component: renderClaimPacketResolution,
      },
      [RESOLUTION_PATHS.ONLINE_SUPPORT]: {
        icon: Download,
        title: 'Online Support',
        description: 'Access self-service tools and guides',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        component: renderOnlineSupportResolution,
      },
    };

    return configs[path];
  };

  // Render the resolution result based on triage response
  const renderResolutionResult = () => {
    if (!resolutionPath || !resolutionData || !triageResponse) return null;

    const config = getResolutionPathConfig(resolutionPath);
    const IconComponent = config.icon;
    const compatibleProduct = createResolutionFlowProduct();

    return (
      <div className="space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold">Resolution Path Ready</h3>
            <p className="text-muted-foreground">
              Based on your <Badge variant="outline">{compatibleProduct.category}</Badge> issue:{' '}
              <span className="font-medium">{resolutionData.issueType.replace('_', ' ')}</span>
            </p>
          </div>
        </div>

        {/* Resolution Action Card */}
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3">
              <div className={`p-2 ${config.iconBg} rounded-lg`}>
                <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
              </div>
              {config.title}
            </CardTitle>
            <CardDescription>
              {config.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {config.component()}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleResolutionClose}>
            Close
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setResolutionStep('form')}
          >
            Report Another Issue
          </Button>
        </div>
      </div>
    );
  };

  // Render different steps of the resolution flow
  const renderResolutionContent = () => {
    switch (resolutionStep) {
      case 'form':
        return (
          <ResolutionFlow
            product={createResolutionFlowProduct()}
            onComplete={handleResolutionComplete}
            onCancel={handleResolutionCancel}
          />
        );

      case 'processing':
        return renderProcessingStep();

      case 'result':
        return renderResolutionResult();

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Living Card */}
              <LivingCard
          product={createLivingCardProduct()}
          onAddSerialNumber={() => handleEditClick()}
          onAddDocuments={() => handleEditClick()}
          onRequestRepairQuote={() => toast.success('Repair quote request initiated')}
        />

      {/* Resolution Flow Modal */}
      <Dialog open={isResolutionFlowOpen} onOpenChange={setIsResolutionFlowOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {STEP_TITLES[resolutionStep]}
            </DialogTitle>
            <DialogDescription>
              {resolutionStep === 'form' 
                ? STEP_DESCRIPTIONS.form(product.name)
                : STEP_DESCRIPTIONS[resolutionStep]
              }
            </DialogDescription>
          </DialogHeader>
          
          {renderResolutionContent()}
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        product={createEditModalProduct()}
        onSuccess={handleProductUpdateSuccess}
      />
    </div>
  );
}