'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Hash, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  Plus,
  FileText,
  Camera,
  Download,
  CalendarPlus,
  MoreHorizontal,
  Share2,
  ExternalLink,
  Wrench,
  ArrowDown,
  DollarSign as ResaleIcon,
  ShieldCheck,
  Zap
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

// ==============================================================================
// TYPESCRIPT INTERFACES
// ==============================================================================

/**
 * Warranty data structure matching our Supabase schema
 */
interface Warranty {
  id: string;
  warranty_start_date: string | null;
  warranty_end_date: string | null;
  warranty_duration_months: number | null;
  warranty_type: 'manufacturer' | 'extended' | 'store' | 'insurance';
  coverage_details: string | null;
  claim_process: string | null;
  contact_info: string | null;
  snapshot_data: {
    covers?: string[];
    does_not_cover?: string[];
    key_terms?: string[];
    claim_requirements?: string[];
  };
  ai_confidence_score: number | null;
  last_analyzed_at: string | null;
}

/**
 * Document data structure matching our Supabase schema
 */
interface Document {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  document_type: 'receipt' | 'warranty_pdf' | 'manual' | 'insurance' | 'photo' | 'other';
  description: string | null;
  is_primary: boolean;
  upload_date: string;
}

/**
 * Product data structure with nested warranties and documents
 */
interface Product {
  id: string;
  user_id: string;
  product_name: string;
  brand: string | null;
  model: string | null;
  category: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  currency: string;
  purchase_location: string | null;
  serial_number: string | null;
  condition: 'new' | 'used' | 'refurbished' | 'damaged';
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  warranties?: Warranty[];
  documents?: Document[];
}

/**
 * Props for the LivingCard component
 */
interface LivingCardProps {
  /** Product data with nested warranties and documents */
  product: Product;
  /** Loading state for AI warranty analysis */
  isLoadingWarranty?: boolean;
  /** Callback when user wants to add serial number */
  onAddSerialNumber?: (productId: string) => void;
  /** Callback when user reports a problem */
  onReportProblem?: (productId: string) => void;
  /** Callback when user wants to add documents */
  onAddDocuments?: (productId: string) => void;
  /** Callback when user requests a repair quote */
  onRequestRepairQuote?: (productId: string) => void;
}

// Marketplace partner configuration
interface MarketplacePartner {
  repairNetwork: boolean;
  extendedWarranty: boolean;
  resalePartner: boolean;
}

// Category-based partner availability
const MARKETPLACE_PARTNERS: Record<string, MarketplacePartner> = {
  'Electronics': {
    repairNetwork: true,
    extendedWarranty: true,
    resalePartner: true
  },
  'Appliances': {
    repairNetwork: true,
    extendedWarranty: true,
    resalePartner: false
  },
  'Automotive': {
    repairNetwork: true,
    extendedWarranty: false,
    resalePartner: true
  },
  'Home & Garden': {
    repairNetwork: false,
    extendedWarranty: true,
    resalePartner: true
  },
  // Default fallback
  'General': {
    repairNetwork: false,
    extendedWarranty: false,
    resalePartner: true
  }
};

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================

/**
 * LivingCard - Smart product display component with multiple visual states
 * 
 * This component serves as the centerpiece of the UI, dynamically changing
 * its appearance based on the product's warranty status and data completeness.
 * 
 * Visual States:
 * 1. Loading - Skeleton while AI analyzes warranty
 * 2. Default - Product info with warranty snapshot
 * 3. Actionable - Claim readiness with action buttons
 * 4. Problem - UI for warranty claims and resolution
 * 5. Expired - Warranty expired with repair service options
 */
export default function LivingCard({
  product,
  isLoadingWarranty = false,
  onAddSerialNumber,
  onReportProblem,
  onAddDocuments,
  onRequestRepairQuote
}: LivingCardProps) {
  // Internal state for problem reporting UI
  const [showProblemState, setShowProblemState] = useState(false);
  
  // Ref for scrolling to Next Steps section
  const nextStepsRef = useRef<HTMLDivElement>(null);

  // Get primary warranty and document
  const primaryWarranty = product.warranties?.[0];
  const primaryImage = product.documents?.find(doc => 
    doc.document_type === 'photo' && doc.is_primary
  );
  const hasReceipt = product.documents?.some(doc => 
    doc.document_type === 'receipt'
  );

  // Check if calendar feature is available
  const canCreateCalendarEvent = !!(
    product.purchase_date && 
    primaryWarranty?.warranty_duration_months
  );

  // Calculate warranty status and expiration
  const calculateWarrantyStatus = () => {
    if (!primaryWarranty) return { isActive: false, isExpired: false };

    // Use warranty_end_date if available
    if (primaryWarranty.warranty_end_date) {
      const endDate = new Date(primaryWarranty.warranty_end_date);
      const now = new Date();
      return {
        isActive: endDate > now,
        isExpired: endDate <= now
      };
    }

    // Calculate from purchase date and warranty duration
    if (product.purchase_date && primaryWarranty.warranty_duration_months) {
      const purchaseDate = new Date(product.purchase_date);
      const expirationDate = new Date(purchaseDate);
      expirationDate.setMonth(expirationDate.getMonth() + primaryWarranty.warranty_duration_months);
      
      const now = new Date();
      return {
        isActive: expirationDate > now,
        isExpired: expirationDate <= now
      };
    }

    return { isActive: false, isExpired: false };
  };

  const { isActive: isWarrantyActive, isExpired: isWarrantyExpired } = calculateWarrantyStatus();

  // Determine claim readiness score
  const claimReadinessItems = [
    { key: 'serial', label: 'Serial Number', complete: !!product.serial_number },
    { key: 'receipt', label: 'Purchase Receipt', complete: hasReceipt },
    { key: 'warranty', label: 'Warranty Info', complete: !!primaryWarranty },
  ];
  const completedItems = claimReadinessItems.filter(item => item.complete).length;
  const readinessPercentage = Math.round((completedItems / claimReadinessItems.length) * 100);

  // Handle sharing functionality
  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/share/product/${product.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy link. Please try again.');
    }
  };

  // Get marketplace partner availability for this product category
  const getMarketplacePartners = (): MarketplacePartner => {
    const category = product.category || 'General';
    return MARKETPLACE_PARTNERS[category] || MARKETPLACE_PARTNERS['General'];
  };

  const partners = getMarketplacePartners();

  // Generate affiliate URLs with proper referral codes
  const getExtendedWarrantyUrl = () => {
    const productName = encodeURIComponent(product.product_name);
    const brand = encodeURIComponent(product.brand || '');
    // Example affiliate URL - replace with actual partner
    return `https://partner-warranty.com/plans?product=${productName}&brand=${brand}&ref=claimso_affiliate`;
  };

  const getResaleValueUrl = () => {
    const searchQuery = encodeURIComponent(`${product.brand || ''} ${product.product_name}`);
    // Example eBay affiliate URL - replace with actual affiliate ID
    return `https://www.ebay.com/sch/i.html?_nkw=${searchQuery}&_sacat=0&_odkw=&_osacat=0&_trksid=claimso_affiliate`;
  };

  // Handle repair quote request
  const handleRepairQuote = () => {
    if (onRequestRepairQuote) {
      onRequestRepairQuote(product.id);
    } else {
      // Fallback to direct action
      toast.success('Repair quote request initiated');
    }
  };

  // Scroll to Next Steps section
  const scrollToNextSteps = () => {
    nextStepsRef.current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  };

  // ==============================================================================
  // LOADING STATE
  // ==============================================================================
  if (isLoadingWarranty) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <Skeleton className="h-20 w-20 rounded-lg" />
            <div className="flex-1 ml-4">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <div className="flex gap-2 mb-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  // ==============================================================================
  // PROBLEM STATE
  // ==============================================================================
  if (showProblemState) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                Resolution Engine
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                We'll help you resolve issues with your {product.product_name}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              What type of problem are you experiencing?
            </h4>
            <div className="grid gap-3">
              <Button
                variant="outline"
                onClick={() => onReportProblem?.(product.id)}
              >
                <div className="flex items-start gap-3 text-left">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Product Defect</div>
                    <div className="text-sm text-gray-500">Hardware or software issue</div>
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => onReportProblem?.(product.id)}
              >
                <div className="flex items-start gap-3 text-left">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Damage</div>
                    <div className="text-sm text-gray-500">Accidental or wear damage</div>
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => onReportProblem?.(product.id)}
              >
                <div className="flex items-start gap-3 text-left">
                  <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Other Issue</div>
                    <div className="text-sm text-gray-500">Something else needs attention</div>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setShowProblemState(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onReportProblem?.(product.id)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Continue
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // ==============================================================================
  // DEFAULT/ACTIONABLE/EXPIRED STATE
  // ==============================================================================
  return (
    <Card className={`overflow-hidden ${isWarrantyExpired ? 'opacity-75' : ''}`}>
      {/* Product Image */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {primaryImage ? (
            <Image
              src={primaryImage.file_url}
              alt={product.product_name}
              width={80}
              height={80}
              className={`rounded-lg object-cover ${isWarrantyExpired ? 'grayscale' : ''}`}
            />
          ) : (
            <div className={`w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center ${isWarrantyExpired ? 'grayscale' : ''}`}>
              <Camera className="h-8 w-8 text-gray-400" />
              <span className="sr-only">No image</span>
            </div>
          )}
          
          {/* Warranty Status Badge */}
          {primaryWarranty && (
            <div className="flex flex-col items-end gap-2">
              {isWarrantyExpired ? (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Warranty Expired
                </Badge>
              ) : isWarrantyActive ? (
                <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  <Shield className="h-3 w-3" />
                  Protected
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Expired
                </Badge>
              )}
            </div>
          )}

          {/* More Options Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Product Details */}
        <div className="mb-4">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
            {product.product_name}
          </h3>
          <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
            {product.brand && (
              <span className="font-medium">{product.brand}</span>
            )}
            {product.purchase_price && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                ${product.purchase_price.toLocaleString()}
              </span>
            )}
            {product.purchase_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(product.purchase_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        {/* AI Warranty Snapshot, Claim Readiness, or Next Steps Marketplace */}
        {isWarrantyExpired ? (
          /* Next Steps Marketplace Section */
          <div ref={nextStepsRef} className="space-y-4">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-orange-600" />
                <h4 className="font-semibold text-orange-900 dark:text-orange-100">
                  Next Steps
                </h4>
                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
                  Trusted Partners
                </Badge>
              </div>
              
              <p className="text-sm text-orange-800 dark:text-orange-200 mb-4">
                Your warranty has expired, but we can still help you get the most out of your {product.product_name}.
              </p>

              <div className="grid gap-3">
                {/* Repair Quote Button */}
                {partners.repairNetwork && (
                  <Button
                    onClick={handleRepairQuote}
                    variant="outline"
                    className="justify-start h-auto p-4 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-800 dark:hover:border-blue-700 dark:hover:bg-blue-900/20"
                  >
                    <div className="flex items-start gap-3 text-left w-full">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Wrench className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-blue-900 dark:text-blue-100">
                          Get a Repair Quote
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          Connect with certified repair technicians in your area
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          • Free estimates • Trusted partners • Local service
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-blue-500 mt-1" />
                    </div>
                  </Button>
                )}

                {/* Extended Warranty Button */}
                {partners.extendedWarranty && (
                  <Button
                    asChild
                    variant="outline"
                    className="justify-start h-auto p-4 border-2 border-green-200 hover:border-green-300 hover:bg-green-50 dark:border-green-800 dark:hover:border-green-700 dark:hover:bg-green-900/20"
                  >
                    <a
                      href={getExtendedWarrantyUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 text-left w-full"
                    >
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-green-900 dark:text-green-100">
                          Explore Protection Plans
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Extend your protection with comprehensive coverage
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                          • Accident protection • Extended coverage • Peace of mind
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-green-500 mt-1" />
                    </a>
                  </Button>
                )}

                {/* Resale Value Button */}
                {partners.resalePartner && (
                  <Button
                    asChild
                    variant="outline"
                    className="justify-start h-auto p-4 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 dark:border-purple-800 dark:hover:border-purple-700 dark:hover:bg-purple-900/20"
                  >
                    <a
                      href={getResaleValueUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 text-left w-full"
                    >
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <ResaleIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-purple-900 dark:text-purple-100">
                          Check Resale Value
                        </div>
                        <div className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                          See what your {product.product_name} is worth today
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                          • Market pricing • Instant estimates • Easy selling
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-purple-500 mt-1" />
                    </a>
                  </Button>
                )}
              </div>

              {/* Trust indicators */}
              <div className="mt-4 pt-3 border-t border-orange-200 dark:border-orange-700">
                <p className="text-xs text-orange-700 dark:text-orange-300 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  All partners are vetted and trusted by CLAIMSO
                </p>
              </div>
            </div>
          </div>
        ) : primaryWarranty?.snapshot_data ? (
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    Warranty Snapshot
                  </span>
                </div>
                {primaryWarranty.ai_confidence_score && (
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(primaryWarranty.ai_confidence_score * 100)}% confident
                  </Badge>
                )}
              </div>

              {/* Coverage Details */}
              <div className="grid gap-3">
                {primaryWarranty.snapshot_data.covers && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Covers
                    </h4>
                    <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      {primaryWarranty.snapshot_data.covers.slice(0, 3).map((item, index) => (
                        <li key={index} className="flex items-start gap-1">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {primaryWarranty.snapshot_data.does_not_cover && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Does Not Cover
                    </h4>
                    <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      {primaryWarranty.snapshot_data.does_not_cover.slice(0, 2).map((item, index) => (
                        <li key={index} className="flex items-start gap-1">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Claim Readiness Section - Hidden for expired warranties */}
        {!isWarrantyExpired && (
          <div className="space-y-3 mt-4">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Claim Readiness
                </h4>
                <Badge variant="outline">
                  {readinessPercentage}% Ready
                </Badge>
              </div>

              {/* Action Items */}
              <div className="space-y-2">
                {!product.serial_number && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddSerialNumber?.(product.id)}
                    className="justify-start h-8 text-xs"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Serial Number
                  </Button>
                )}

                {!hasReceipt && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddDocuments?.(product.id)}
                    className="justify-start h-8 text-xs"
                  >
                    <FileText className="mr-1 h-3 w-3" />
                    Add Receipt
                  </Button>
                )}

                {product.documents && product.documents.length < 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddDocuments?.(product.id)}
                    className="justify-start h-8 text-xs"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Documents
                  </Button>
                )}

                {canCreateCalendarEvent && (
                  <Button variant="ghost" size="sm" className="justify-start h-8 text-xs">
                    <CalendarPlus className="mr-1 h-3 w-3" />
                    Add to Calendar
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Main Call-to-Action */}
      <CardFooter>
        {isWarrantyExpired ? (
          <Button
            onClick={scrollToNextSteps}
            className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-medium py-2.5"
            size="default"
          >
            <ArrowDown className="mr-2 h-4 w-4" />
            View Resolution Options
          </Button>
        ) : (
          <Button
            onClick={() => setShowProblemState(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
            size="default"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            I have a problem
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}