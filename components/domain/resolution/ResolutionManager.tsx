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

interface Product {
  id: string;
  name: string;
  category?: string | null; // CORRECTED: Now accepts string, null, or undefined
  serial_number?: string | null;
  order_number?: string | null;
  notes?: string | null;
  purchase_date?: string | null;
  warranty_length_months?: number | null;
  product_image_url?: string | null;
  retailer?: string | null;
  price?: number | null;
  warranties?: Record<string, unknown>[];
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

export default function ResolutionManager({ 
  product, 
  onProductUpdate 
}: ResolutionManagerProps) {
  // Modal state management
  const [isResolutionFlowOpen, setIsResolutionFlowOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Resolution flow state
  const [resolutionStep, setResolutionStep] = useState<'form' | 'processing' | 'result'>('form');
  const [resolutionData, setResolutionData] = useState<ResolutionFlowData | null>(null);
  const [resolutionPath, setResolutionPath] = useState<TriageResponse['recommended_path'] | null>(null);
  const [triageResponse, setTriageResponse] = useState<TriageResponse | null>(null);


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
    setIsProcessingTriage(false);
  };

  // Handle ResolutionFlow completion
  const handleResolutionComplete = async (data: ResolutionFlowData) => {
    setResolutionData(data);
    setResolutionStep('processing');
    setIsProcessingTriage(true);

    try {
      // Make fetch call to triage API
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

      if (result.success) {
        setTriageResponse(result);
        setResolutionPath(result.recommended_path);
        setResolutionStep('result');
        
        toast.success('Resolution Path Identified', {
          description: `We've found the best way to help with your ${product.name}.`,
          icon: <CheckCircle className="h-4 w-4" />,
        });
      } else {
        throw new Error(result.error || 'Triage analysis failed');
      }
    } catch (error) {
      console.error('Triage API error:', error);
      
      toast.error('Resolution Analysis Failed', {
        description: 'Unable to analyze your issue. Please try again or contact support.',
        duration: 6000,
      });
      
      // Reset to form step to allow retry
      setResolutionStep('form');
    } finally {
      setIsProcessingTriage(false);
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
    onProductUpdate?.();
  };

  // Render different steps of the resolution flow
  const renderResolutionContent = () => {
    switch (resolutionStep) {
      case 'form':
        return (
          <ResolutionFlow
            product={product}
            onComplete={handleResolutionComplete}
            onCancel={handleResolutionCancel}
          />
        );

      case 'processing':
        return (
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

      case 'result':
        return renderResolutionResult();

      default:
        return null;
    }
  };

  // Render the resolution result based on triage response
  const renderResolutionResult = () => {
    if (!resolutionPath || !resolutionData || !triageResponse) return null;

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
              Based on your <Badge variant="outline">{product.category}</Badge> issue:{' '}
              <span className="font-medium">{resolutionData.issueType.replace('_', ' ')}</span>
            </p>
          </div>
        </div>

        {/* Resolution Action Card */}
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3">
              {resolutionPath === 'phone_call' && (
                <>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  Direct Phone Support
                </>
              )}
              {resolutionPath === 'claim_packet' && (
                <>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <FileText className="h-5 w-5 text-orange-600" />
                  </div>
                  Claim Documentation
                </>
              )}
              {resolutionPath === 'online_support' && (
                <>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Download className="h-5 w-5 text-green-600" />
                  </div>
                  Online Support
                </>
              )}
            </CardTitle>
            <CardDescription>
              {resolutionPath === 'phone_call' && 'Connect with a specialist for immediate assistance'}
              {resolutionPath === 'claim_packet' && 'Complete documentation for warranty/insurance processing'}
              {resolutionPath === 'online_support' && 'Access self-service tools and guides'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {resolutionPath === 'phone_call' && (
              <CallAssistant 
                product={product}
                issueDescription={resolutionData.problemDescription}
                issueType={resolutionData.issueType}
              />
            )}

            {resolutionPath === 'claim_packet' && (
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-900 mb-1">
                        Documentation Required
                      </h4>
                      <p className="text-sm text-orange-800">
                        Your {product.category} issue requires formal claim documentation. 
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
            )}

            {resolutionPath === 'online_support' && (
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
            )}
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

  return (
    <div className="space-y-6">
      {/* Main Living Card */}
      <LivingCard
        product={product}
        onProblemClick={handleProblemClick}
        onEditClick={handleEditClick}
      />

      {/* Resolution Flow Modal */}
      <Dialog open={isResolutionFlowOpen} onOpenChange={setIsResolutionFlowOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {resolutionStep === 'form' && 'Report an Issue'}
              {resolutionStep === 'processing' && 'Analyzing Issue'}
              {resolutionStep === 'result' && 'Resolution Ready'}
            </DialogTitle>
            <DialogDescription>
              {resolutionStep === 'form' && `Let's help resolve your issue with ${product.name}`}
              {resolutionStep === 'processing' && 'Finding the best resolution path for your specific situation'}
              {resolutionStep === 'result' && 'Here\'s your personalized resolution plan'}
            </DialogDescription>
          </DialogHeader>
          
          {renderResolutionContent()}
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        product={product}
        onSuccess={handleProductUpdateSuccess}
      />
    </div>
  );
}