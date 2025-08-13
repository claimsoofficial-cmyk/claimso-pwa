// ==============================================================================
// WARRANTY LINKAGE UTILITIES
// ==============================================================================

/**
 * Warranty data structure for linkage detection
 */
export interface WarrantyData {
  id: string;
  warranty_type: 'manufacturer' | 'extended' | 'store' | 'insurance';
  warranty_start_date: string | null;
  warranty_end_date: string | null;
  warranty_duration_months: number | null;
  coverage_details: string | null;
  ai_confidence_score: number | null;
}

/**
 * Product data structure for warranty linkage
 */
export interface ProductWithWarranties {
  id: string;
  product_name: string;
  brand: string | null;
  category: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  warranties?: WarrantyData[];
}

/**
 * Detects if a product has enhanced protection (multiple warranty types)
 */
export function hasEnhancedProtection(warranties: WarrantyData[] = []): boolean {
  if (warranties.length < 2) return false;
  
  // Check if there are different warranty types
  const warrantyTypes = new Set(warranties.map(w => w.warranty_type));
  return warrantyTypes.size > 1;
}

/**
 * Gets the primary warranty (usually manufacturer) and extended warranty
 */
export function getWarrantyPair(warranties: WarrantyData[] = []): {
  primary?: WarrantyData;
  extended?: WarrantyData;
  hasEnhanced: boolean;
} {
  if (warranties.length === 0) {
    return { hasEnhanced: false };
  }

  // Sort warranties by type priority
  const sortedWarranties = [...warranties].sort((a, b) => {
    const typePriority = {
      'manufacturer': 1,
      'store': 2,
      'extended': 3,
      'insurance': 4
    };
    return (typePriority[a.warranty_type] || 5) - (typePriority[b.warranty_type] || 5);
  });

  const primary = sortedWarranties[0];
  const extended = sortedWarranties.length > 1 ? sortedWarranties[1] : undefined;
  
  return {
    primary,
    extended,
    hasEnhanced: hasEnhancedProtection(warranties)
  };
}

/**
 * Detects warranty linkages between products based on common identifiers
 */
export function detectWarrantyLinkages(products: ProductWithWarranties[]): Map<string, string[]> {
  const linkages = new Map<string, string[]>();
  
  for (let i = 0; i < products.length; i++) {
    const productA = products[i];
    const linkedProducts: string[] = [];
    
    for (let j = i + 1; j < products.length; j++) {
      const productB = products[j];
      
      if (isWarrantyLinked(productA, productB)) {
        linkedProducts.push(productB.id);
        const existingLinks = linkages.get(productB.id) || [];
        linkages.set(productB.id, [...existingLinks, productA.id]);
      }
    }
    
    if (linkedProducts.length > 0) {
      linkages.set(productA.id, linkedProducts);
    }
  }
  
  return linkages;
}

/**
 * Determines if two products are warranty-linked
 */
function isWarrantyLinked(productA: ProductWithWarranties, productB: ProductWithWarranties): boolean {
  // Check for exact same product name and brand
  if (productA.product_name === productB.product_name && 
      productA.brand === productB.brand) {
    return true;
  }
  
  // Check for serial number match
  if (productA.serial_number && 
      productA.serial_number === productB.serial_number) {
    return true;
  }
  
  // Check for similar product names (one might be "Extended Warranty" version)
  const nameA = productA.product_name.toLowerCase();
  const nameB = productB.product_name.toLowerCase();
  
  // Check if one contains the other (e.g., "iPhone 13" and "iPhone 13 Extended Warranty")
  if (nameA.includes(nameB) || nameB.includes(nameA)) {
    return true;
  }
  
  // Check for warranty-specific keywords
  const warrantyKeywords = ['warranty', 'protection', 'care', 'extended', 'premium'];
  const hasWarrantyKeyword = warrantyKeywords.some(keyword => 
    nameA.includes(keyword) || nameB.includes(keyword)
  );
  
  if (hasWarrantyKeyword) {
    // Additional check: similar brand and purchase date proximity
    if (productA.brand === productB.brand && 
        productA.purchase_date && productB.purchase_date) {
      const dateA = new Date(productA.purchase_date);
      const dateB = new Date(productB.purchase_date);
      const daysDiff = Math.abs(dateA.getTime() - dateB.getTime()) / (1000 * 60 * 60 * 24);
      
      // If purchased within 30 days, likely related
      if (daysDiff <= 30) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Bundles linked products together for display
 */
export function bundleLinkedProducts(
  products: ProductWithWarranties[], 
  linkages: Map<string, string[]>
): Array<{
  mainProduct: ProductWithWarranties;
  linkedProducts: ProductWithWarranties[];
  hasEnhancedProtection: boolean;
}> {
  const processed = new Set<string>();
  const bundles: Array<{
    mainProduct: ProductWithWarranties;
    linkedProducts: ProductWithWarranties[];
    hasEnhancedProtection: boolean;
  }> = [];
  
  for (const product of products) {
    if (processed.has(product.id)) continue;
    
    const linkedIds = linkages.get(product.id) || [];
    const linkedProducts = products.filter(p => linkedIds.includes(p.id));
    
    // Combine all warranties from linked products
    const allWarranties = [
      ...(product.warranties || []),
      ...linkedProducts.flatMap(p => p.warranties || [])
    ];
    
    const hasEnhanced = hasEnhancedProtection(allWarranties);
    
    bundles.push({
      mainProduct: {
        ...product,
        warranties: allWarranties
      },
      linkedProducts,
      hasEnhancedProtection: hasEnhanced
    });
    
    // Mark all linked products as processed
    processed.add(product.id);
    linkedProducts.forEach(p => processed.add(p.id));
  }
  
  // Add remaining unlinked products
  for (const product of products) {
    if (!processed.has(product.id)) {
      bundles.push({
        mainProduct: product,
        linkedProducts: [],
        hasEnhancedProtection: hasEnhancedProtection(product.warranties)
      });
    }
  }
  
  return bundles;
} 