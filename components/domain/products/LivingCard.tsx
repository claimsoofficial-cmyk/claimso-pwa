'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';

import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  Plus,
  FileText,
  Camera,
  CalendarPlus,
  MoreHorizontal,
  Share2,
  ExternalLink,
  Wrench,
  ArrowDown,
  ShieldCheck,
  Zap,
  Info,
  Archive,
  Sparkles,
  MonitorSpeaker,
  Phone,
  Download,
  CheckCircle,
  ArrowRight
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
import { hasEnhancedProtection, getWarrantyPair } from '@/lib/warranty-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
  data_source?: string;
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

/**
 * Helper function to get human-readable data source labels
 */
function getDataSourceLabel(dataSource: string): string {
  const sourceLabels: Record<string, string> = {
    'user_documents': 'User uploaded documents',
    'manufacturer_lookup': 'Manufacturer database',
    'retailer_data': 'Retailer purchase history',
    'internet_search': 'Internet search results',
    'purchase_history': 'Purchase history analysis',
    'ai': 'AI analysis',
    'user_upload': 'User uploaded documents',
    'partner_data': 'Partner data'
  };
  
  return sourceLabels[dataSource] || 'Unknown source';
}

/**
 * Smart issue detection based on product category
 */
function getSmartIssueOptions(product: Product): Array<{
  type: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  action: 'call' | 'download' | 'online' | 'repair';
  priority: number;
}> {
  const category = product.category?.toLowerCase() || '';
  
  // Base issue types for all products
  const baseIssues = [
    {
      type: 'not_working',
      label: 'Not Working',
      description: 'Device won\'t turn on or function properly',
      icon: AlertTriangle,
      color: 'bg-red-50 hover:bg-red-100 border-red-200 text-red-800',
      action: 'call' as const,
      priority: 1
    },
    {
      type: 'damaged',
      label: 'Physical Damage',
      description: 'Cracks, dents, or visible damage',
      icon: AlertTriangle,
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-800',
      action: 'call' as const,
      priority: 2
    }
  ];

  // Category-specific issues
  const categoryIssues = [];
  
  if (category.includes('phone') || category.includes('mobile')) {
    categoryIssues.push(
      {
        type: 'screen_issue',
        label: 'Screen Problem',
        description: 'Cracked screen, won\'t respond to touch',
        icon: MonitorSpeaker,
        color: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800',
        action: 'repair' as const,
        priority: 1
      },
      {
        type: 'battery_issue',
        label: 'Battery Problem',
        description: 'Won\'t charge or drains too fast',
        icon: Zap,
        color: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-800',
        action: 'call' as const,
        priority: 2
      }
    );
  } else if (category.includes('laptop') || category.includes('computer')) {
    categoryIssues.push(
      {
        type: 'performance_issue',
        label: 'Slow Performance',
        description: 'Very slow, freezing, or overheating',
        icon: MonitorSpeaker,
        color: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-800',
        action: 'online' as const,
        priority: 1
      },
      {
        type: 'hardware_issue',
        label: 'Hardware Problem',
        description: 'Keyboard, trackpad, or ports not working',
        icon: Wrench,
        color: 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800',
        action: 'repair' as const,
        priority: 2
      }
    );
  } else if (category.includes('appliance')) {
    categoryIssues.push(
      {
        type: 'not_working',
        label: 'Appliance Not Working',
        description: 'Won\'t start or function properly',
        icon: Wrench,
        color: 'bg-red-50 hover:bg-red-100 border-red-200 text-red-800',
        action: 'call' as const,
        priority: 1
      },
      {
        type: 'noise_issue',
        label: 'Unusual Noise',
        description: 'Making strange sounds or vibrations',
        icon: AlertTriangle,
        color: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-800',
        action: 'repair' as const,
        priority: 2
      }
    );
  }

  // Combine and sort by priority
  return [...baseIssues, ...categoryIssues].sort((a, b) => a.priority - b.priority);
}

/**
 * Get resolution action for issue type
 */
function getResolutionAction(issueType: string, product: Product): {
  action: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  url?: string;
} {
  const category = product.category?.toLowerCase() || '';
  const brand = product.brand?.toLowerCase() || '';
  
  // Default resolution actions
  const actions = {
    call: {
      action: 'Call Support',
      description: 'Speak with a specialist',
      icon: Phone,
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `tel:1-800-${brand.toUpperCase()}-SUPPORT`
    },
    download: {
      action: 'Download Claim Form',
      description: 'Complete documentation',
      icon: Download,
      color: 'bg-green-600 hover:bg-green-700',
      url: `/api/resolution/generate-packet?productId=${product.id}`
    },
    online: {
      action: 'Online Support',
      description: 'Self-service tools',
      icon: MonitorSpeaker,
      color: 'bg-purple-600 hover:bg-purple-700',
      url: `https://support.${brand}.com`
    },
    repair: {
      action: 'Find Repair',
      description: 'Local repair services',
      icon: Wrench,
      color: 'bg-orange-600 hover:bg-orange-700',
      url: `https://repair.claimso.com?product=${encodeURIComponent(product.product_name)}`
    }
  };

  // Smart action selection based on issue and product
  if (issueType.includes('screen') || issueType.includes('damage')) {
    return actions.repair;
  } else if (issueType.includes('performance') || issueType.includes('software')) {
    return actions.online;
  } else if (category.includes('appliance') || category.includes('electronics')) {
    return actions.call;
  } else {
    return actions.download;
  }
}

/**
 * Helper function to determine if product needs extended warranty
 */
function needsExtendedWarranty(product: Product): boolean {
  // Check if product has extended warranty
  const hasExtended = product.warranties?.some(w => 
    w.warranty_type === 'extended' || w.warranty_type === 'insurance'
  );
  
  // Check if warranty is expired or expiring soon
  const primaryWarranty = product.warranties?.[0];
  if (primaryWarranty?.warranty_end_date) {
    const endDate = new Date(primaryWarranty.warranty_end_date);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Show extended warranty option if warranty expires within 30 days or is expired
    return !hasExtended && (daysUntilExpiry <= 30 || daysUntilExpiry < 0);
  }
  
  return !hasExtended;
}

/**
 * Helper function to get resale options
 */
function getResaleOptions(product: Product): Array<{
  name: string;
  description: string;
  estimatedValue: string;
  affiliateUrl: string;
  rating: number;
}> {
  const price = product.purchase_price || 0;
  const estimatedResaleValue = Math.round(price * 0.6); // 60% of original price
  
  return [
    {
      name: 'eBay',
      description: 'Sell to millions of buyers worldwide',
      estimatedValue: `$${estimatedResaleValue}`,
      affiliateUrl: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(product.product_name)}&_sacat=0&ref=claimso`,
      rating: 4.7
    },
    {
      name: 'Facebook Marketplace',
      description: 'Sell locally to people in your area',
      estimatedValue: `$${estimatedResaleValue}`,
      affiliateUrl: `https://www.facebook.com/marketplace/search?query=${encodeURIComponent(product.product_name)}&ref=claimso`,
      rating: 4.5
    }
  ];
}



/**
 * Helper function to get extended warranty options
 */
function getExtendedWarrantyOptions(product: Product): Array<{
  name: string;
  description: string;
  price: string;
  coverage: string;
  affiliateUrl: string;
  rating: number;
}> {
  const price = product.purchase_price || 0;
  
  return [
    {
      name: 'SquareTrade Protection Plan',
      description: 'Comprehensive coverage for accidental damage',
      price: `$${Math.round(price * 0.15)}/year`,
      coverage: '3 years coverage',
      affiliateUrl: `https://www.squaretrade.com/protection?product=${encodeURIComponent(product.product_name)}&ref=claimso`,
      rating: 4.8
    },
    {
      name: 'Asurion Home+ Protection',
      description: 'Home protection for all your devices',
      price: `$${Math.round(price * 0.12)}/year`,
      coverage: '2 years coverage',
      affiliateUrl: `https://www.asurion.com/home-plus?product=${encodeURIComponent(product.product_name)}&ref=claimso`,
      rating: 4.6
    },
    {
      name: 'Warranty Group Extended',
      description: 'Manufacturer-authorized extended warranty',
      price: `$${Math.round(price * 0.18)}/year`,
      coverage: '4 years coverage',
      affiliateUrl: `https://www.warrantygroup.com/extended?product=${encodeURIComponent(product.product_name)}&ref=claimso`,
      rating: 4.7
    }
  ];
}

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
  onAddDocuments,
  onRequestRepairQuote
}: LivingCardProps) {
  // Internal state for warranty analysis and modals
  const [isAnalyzingWarranty, setIsAnalyzingWarranty] = useState(false);
  const [showExtendedWarrantyModal, setShowExtendedWarrantyModal] = useState(false);
  const [showResolutionOptions, setShowResolutionOptions] = useState(false);
  const [selectedIssueType, setSelectedIssueType] = useState<string | null>(null);
  
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

  // Check for enhanced protection
  const hasEnhanced = hasEnhancedProtection(product.warranties || []);
  const { primary, extended } = getWarrantyPair(product.warranties || []);

  // Check if calendar feature is available
  const canCreateCalendarEvent = !!(
    product.purchase_date && 
    primaryWarranty?.warranty_duration_months &&
    primaryWarranty?.warranty_end_date
  );

  // Handle calendar download
  const handleCalendarDownload = async () => {
    try {
      const response = await fetch(`/api/calendar/generate-ics?productId=${product.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate calendar event');
      }
      
      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || 'warranty_event.ics';
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Calendar event downloaded', { 
        description: 'Warranty reminder added to your calendar' 
      });
    } catch (error) {
      console.error('Calendar download error:', error);
      toast.error('Failed to download calendar event', {
        description: 'Please try again later'
      });
    }
  };

  // Handle warranty analysis
  const handleWarrantyAnalysis = async () => {
    if (!primaryWarranty) return;
    
    setIsAnalyzingWarranty(true);
    try {
      const response = await fetch('/api/warranty/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId: product.id }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Warranty analysis complete', {
          description: 'AI has analyzed your warranty documents'
        });
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        toast.error('Analysis failed', {
          description: result.error || 'Please try again later'
        });
      }
    } catch (error) {
      console.error('Warranty analysis error:', error);
      toast.error('Analysis failed', {
        description: 'Please try again later'
      });
    } finally {
      setIsAnalyzingWarranty(false);
    }
  };

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
  // DEFAULT/ACTIONABLE/EXPIRED STATE
  // ==============================================================================
  return (
    <>
      <Card className={`overflow-hidden ${
        isWarrantyExpired 
          ? 'opacity-75 shadow-lg shadow-red-200 dark:shadow-red-900/20 border-red-200 dark:border-red-800' 
          : ''
      }`}>
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
              priority={false}
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
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

          {/* Enhanced Protection Badge */}
          {hasEnhanced && (
            <Badge variant="secondary" className="gap-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
              <ShieldCheck className="h-3 w-3" />
              Enhanced Protection
            </Badge>
          )}

          {/* Extended Warranty Button (Pulsing) */}
          {needsExtendedWarranty(product) && (
            <button
              onClick={() => setShowExtendedWarrantyModal(true)}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs rounded-full animate-pulse hover:animate-none transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Sparkles className="h-3 w-3" />
              Get Extended Warranty
            </button>
          )}

          {/* Resale Button */}
          <button
            onClick={() => {
              const resaleOptions = getResaleOptions(product);
              const bestOption = resaleOptions[0];
              window.open(bestOption.affiliateUrl, '_blank');
            }}
            className="inline-flex items-center gap-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-full transition-colors"
            title="Sell this item"
          >
            <DollarSign className="h-3 w-3" />
            Sell
          </button>

          {/* Archive Button */}
          <button
            onClick={() => {
              // Archive functionality would be implemented here
              toast.success('Item archived', { description: 'Item moved to archive' });
            }}
            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded-full transition-colors"
            title="Archive this item"
          >
            <Archive className="h-3 w-3" />
            Archive
          </button>

          {/* Linked Products Indicator */}
          {product.warranties && product.warranties.length > 1 && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {product.warranties.length} warranty{product.warranties.length > 1 ? 's' : ''} linked
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
                        <DollarSign className="h-5 w-5 text-purple-600" />
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
        ) : null}

        {/* Warranty Snapshot - Enhanced for multiple warranties */}
        {primaryWarranty && primary && (
          <div className="space-y-3 mt-4">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {hasEnhanced ? 'Enhanced Warranty Coverage' : 'Warranty Coverage'}
                </h4>
                <div className="flex items-center gap-2">
                  {hasEnhanced && (
                    <Badge variant="outline" className="text-xs">
                      {product.warranties?.length || 1} Layer{product.warranties && product.warranties.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {primaryWarranty.ai_confidence_score && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      {Math.round(primaryWarranty.ai_confidence_score * 100)}% AI confident
                    </Badge>
                  )}
                  {primaryWarranty.data_source && (
                    <button
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                      title={`Data source: ${getDataSourceLabel(primaryWarranty.data_source)}`}
                    >
                      <Info className="w-3 h-3 text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* AI Warranty Snapshot */}
              {primaryWarranty.snapshot_data && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="grid gap-3">
                    {primaryWarranty.snapshot_data.covers && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Covers
                        </h5>
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
                        <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Does Not Cover
                        </h5>
                        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                          {primaryWarranty.snapshot_data.does_not_cover.slice(0, 2).map((item, index) => (
                            <li key={index} className="flex items-start gap-1">
                              • {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {primaryWarranty.snapshot_data.key_terms && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Key Terms
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {primaryWarranty.snapshot_data.key_terms.slice(0, 4).map((term, index) => (
                            <Badge key={index} variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                              {term}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Loading State for Warranty Analysis */}
              {primaryWarranty && !primaryWarranty.snapshot_data && (isLoadingWarranty || isAnalyzingWarranty) && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                    <span className="text-sm text-yellow-800 dark:text-yellow-200">
                      {isAnalyzingWarranty ? 'Analyzing warranty documents...' : 'Loading warranty analysis...'}
                    </span>
                  </div>
                </div>
              )}

              {/* No Warranty Data Available - Show Analysis Button */}
              {primaryWarranty && !primaryWarranty.snapshot_data && !isLoadingWarranty && !isAnalyzingWarranty && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Warranty analysis not available
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleWarrantyAnalysis}
                      disabled={isAnalyzingWarranty}
                      className="text-xs"
                    >
                      {isAnalyzingWarranty ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                          Analyzing...
                        </>
                      ) : (
                        'Analyze Warranty'
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Primary Warranty */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Primary Coverage</span>
                  <span className="font-medium capitalize">{primary.warranty_type}</span>
                </div>
                {primary.warranty_duration_months && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Duration</span>
                    <span className="font-medium">{primary.warranty_duration_months} months</span>
                  </div>
                )}
                {primary.warranty_end_date && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Expires</span>
                    <span className="font-medium">{new Date(primary.warranty_end_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Extended Warranty (if exists) */}
              {extended && (
                <>
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Extended Coverage</span>
                      <span className="font-medium capitalize">{extended.warranty_type}</span>
                    </div>
                    {extended.warranty_duration_months && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Additional</span>
                        <span className="font-medium">+{extended.warranty_duration_months} months</span>
                      </div>
                    )}
                    {extended.warranty_end_date && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Extended Until</span>
                        <span className="font-medium">{new Date(extended.warranty_end_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Total Coverage Summary */}
              {hasEnhanced && (
                <>
                  <Separator className="my-3" />
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span className="text-blue-800 dark:text-blue-300">Total Protection</span>
                      <span className="text-blue-800 dark:text-blue-300">
                        {((primary.warranty_duration_months || 0) + (extended?.warranty_duration_months || 0))} months
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Enhanced coverage with multiple warranty layers
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="justify-start h-8 text-xs"
                    onClick={handleCalendarDownload}
                  >
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
            onClick={() => setShowResolutionOptions(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
            size="default"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            I have a problem
          </Button>
        )}
      </CardFooter>
    </Card>

    {/* Extended Warranty Modal */}
    {showExtendedWarrantyModal && (
      <Dialog open={showExtendedWarrantyModal} onOpenChange={setShowExtendedWarrantyModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Extended Warranty Options
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Protect your {product.product_name} with extended warranty coverage. We&apos;ve ranked the best options for you:
            </p>
            
            <div className="grid gap-3">
              {getExtendedWarrantyOptions(product).map((option, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{option.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {option.rating}★
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600 font-medium">{option.price}</span>
                        <span className="text-gray-500">{option.coverage}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        window.open(option.affiliateUrl, '_blank');
                        setShowExtendedWarrantyModal(false);
                      }}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Get Quote
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-xs text-gray-500 text-center">
              * Prices and coverage may vary. We earn a commission on qualifying purchases.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )}

    {/* Smart Resolution Options Modal */}
    {showResolutionOptions && (
      <Dialog open={showResolutionOptions} onOpenChange={setShowResolutionOptions}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
                                  What&apos;s the issue with your {product.product_name}?
            </DialogTitle>
            <DialogDescription>
              Select the problem you&apos;re experiencing and we&apos;ll get you the right help immediately.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Issue Type Selection */}
            {!selectedIssueType ? (
              <div className="grid gap-3">
                {getSmartIssueOptions(product).map((issue) => {
                  const IconComponent = issue.icon;
                  return (
                    <Button
                      key={issue.type}
                      variant="outline"
                      size="lg"
                      onClick={() => setSelectedIssueType(issue.type)}
                      className={`h-auto p-4 justify-start text-left transition-all duration-200 ${issue.color}`}
                    >
                      <div className="flex items-center gap-4 w-full">
                        <IconComponent className="w-6 h-6 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{issue.label}</div>
                          <div className="text-sm opacity-80 mt-1">
                            {issue.description}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 flex-shrink-0 opacity-60" />
                      </div>
                    </Button>
                  );
                })}
              </div>
            ) : (
              /* Resolution Action */
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-blue-900">
                        {getSmartIssueOptions(product).find(opt => opt.type === selectedIssueType)?.label}
                      </h4>
                      <p className="text-sm text-blue-800">
                        We&apos;ve identified the best resolution for your issue.
                      </p>
                    </div>
                  </div>
                </div>
                
                {(() => {
                  const resolution = getResolutionAction(selectedIssueType, product);
                  const IconComponent = resolution.icon;
                  return (
                    <Button
                      onClick={() => {
                        if (resolution.url) {
                          if (resolution.url.startsWith('tel:')) {
                            window.location.href = resolution.url;
                          } else if (resolution.url.startsWith('http')) {
                            window.open(resolution.url, '_blank');
                          } else {
                            window.open(resolution.url, '_blank');
                          }
                        }
                        setShowResolutionOptions(false);
                        setSelectedIssueType(null);
                        toast.success('Resolution initiated', {
                          description: `Opening ${resolution.action.toLowerCase()}...`
                        });
                      }}
                      size="lg"
                      className={`w-full ${resolution.color} text-white`}
                    >
                      <IconComponent className="w-5 h-5 mr-2" />
                      {resolution.action}
                    </Button>
                  );
                })()}
                
                <p className="text-sm text-gray-600 text-center">
                  {getResolutionAction(selectedIssueType, product).description}
                </p>
                
                <Button
                  variant="outline"
                  onClick={() => setSelectedIssueType(null)}
                  className="w-full"
                >
                  Choose Different Issue
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )}
  </>
  );
}