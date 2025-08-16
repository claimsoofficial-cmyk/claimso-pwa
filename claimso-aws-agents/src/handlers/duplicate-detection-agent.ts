import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getActiveUsers, getProductsByUserId, updateProduct, type AgentType } from '../shared/database';
import { PurchaseEvent, generateOrderNumber, logAgentActivity } from '../shared/utils';

const AGENT_TYPE: AgentType = 'duplicate-detection';

interface DuplicateCheckResult {
  isDuplicate: boolean;
  confidence: number;
  existingProductId?: string;
  reason?: string;
  metadata?: {
    nameSimilarity: number;
    priceSimilarity: number;
    dateSimilarity: number;
    retailerSimilarity: number;
  };
}

interface ProductFingerprint {
  nameHash: string;
  priceHash: string;
  dateHash: string;
  retailerHash: string;
  combinedHash: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const agentName = 'DuplicateDetectionAgent';

  try {
    logAgentActivity(agentName, 'Starting duplicate detection scan', {});

    // Get all active users
    const users = await getActiveUsers(AGENT_TYPE);
    
    if (!users || users.length === 0) {
      logAgentActivity(agentName, 'No active users found', {});
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          message: 'No active users to process',
          usersProcessed: 0,
          duplicatesFound: 0
        })
      };
    }

    let totalDuplicatesFound = 0;
    let totalUsersProcessed = 0;

    // Process each user's products for duplicate detection
    for (const user of users) {
      try {
        logAgentActivity(agentName, 'Processing user products for duplicates', {
          userId: user.id,
          userEmail: user.email
        });

        // Get user's existing products
        const existingProducts = await getProductsByUserId(AGENT_TYPE, user.id);
        
        if (!existingProducts || existingProducts.length === 0) {
          logAgentActivity(agentName, 'No existing products found for user', {
            userId: user.id
          });
          continue;
        }

        // Find duplicates within user's products
        const duplicates = await findDuplicates(existingProducts);
        
        if (duplicates.length > 0) {
          totalDuplicatesFound += duplicates.length;
          
          logAgentActivity(agentName, 'Found duplicates for user', {
            userId: user.id,
            duplicateCount: duplicates.length
          });

          // Process duplicates (merge, flag, or delete)
          await processDuplicates(duplicates, user.id);
        }

        totalUsersProcessed++;

      } catch (error) {
        logAgentActivity(agentName, 'Error processing user for duplicates', {
          userId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logAgentActivity(agentName, 'Completed duplicate detection scan', {
      usersProcessed: totalUsersProcessed,
      duplicatesFound: totalDuplicatesFound
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Duplicate detection scan completed',
        usersProcessed: totalUsersProcessed,
        duplicatesFound: totalDuplicatesFound
      })
    };

  } catch (error) {
    logAgentActivity(agentName, 'Fatal error in duplicate detection agent', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

// Main function to check if a new purchase event is a duplicate
export async function checkForDuplicate(purchaseEvent: PurchaseEvent): Promise<DuplicateCheckResult> {
  try {
    // Get user's existing products
    const existingProducts = await getProductsByUserId(AGENT_TYPE, purchaseEvent.userId);
    
    if (!existingProducts || existingProducts.length === 0) {
      return {
        isDuplicate: false,
        confidence: 0
      };
    }

    // Check against each existing product
    for (const existingProduct of existingProducts) {
      const duplicateResult = await compareProducts(purchaseEvent, existingProduct);
      
      if (duplicateResult.isDuplicate && duplicateResult.confidence > 0.8) {
        return duplicateResult;
      }
    }

    return {
      isDuplicate: false,
      confidence: 0
    };

  } catch (error) {
    logAgentActivity('DuplicateDetectionAgent', 'Error checking for duplicate', {
      userId: purchaseEvent.userId,
      productName: purchaseEvent.productName,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Default to not duplicate if error occurs
    return {
      isDuplicate: false,
      confidence: 0
    };
  }
}

async function findDuplicates(products: any[]): Promise<any[][]> {
  const duplicates: any[][] = [];
  const processed = new Set<string>();

  for (let i = 0; i < products.length; i++) {
    if (processed.has(products[i].id)) continue;

    const productGroup = [products[i]];
    processed.add(products[i].id);

    for (let j = i + 1; j < products.length; j++) {
      if (processed.has(products[j].id)) continue;

      const duplicateResult = await compareProducts(products[i], products[j]);
      
      if (duplicateResult.isDuplicate && duplicateResult.confidence > 0.8) {
        productGroup.push(products[j]);
        processed.add(products[j].id);
      }
    }

    if (productGroup.length > 1) {
      duplicates.push(productGroup);
    }
  }

  return duplicates;
}

async function compareProducts(product1: any, product2: any): Promise<DuplicateCheckResult> {
  // Generate fingerprints for both products
  const fingerprint1 = generateProductFingerprint(product1);
  const fingerprint2 = generateProductFingerprint(product2);

  // Calculate similarity scores
  const nameSimilarity = calculateNameSimilarity(product1.product_name, product2.product_name);
  const priceSimilarity = calculatePriceSimilarity(product1.purchase_price, product2.purchase_price);
  const dateSimilarity = calculateDateSimilarity(product1.purchase_date, product2.purchase_date);
  const retailerSimilarity = calculateRetailerSimilarity(product1.retailer, product2.retailer);

  // Calculate overall confidence
  const confidence = calculateOverallConfidence({
    nameSimilarity,
    priceSimilarity,
    dateSimilarity,
    retailerSimilarity
  });

  // Determine if it's a duplicate
  const isDuplicate = confidence > 0.8;

  return {
    isDuplicate,
    confidence,
    existingProductId: product2.id,
    reason: isDuplicate ? generateDuplicateReason({
      nameSimilarity,
      priceSimilarity,
      dateSimilarity,
      retailerSimilarity
    }) : undefined,
    metadata: {
      nameSimilarity,
      priceSimilarity,
      dateSimilarity,
      retailerSimilarity
    }
  };
}

function generateProductFingerprint(product: any): ProductFingerprint {
  // Normalize product name
  const normalizedName = normalizeProductName(product.product_name);
  const nameHash = generateHash(normalizedName);
  
  // Normalize price (round to nearest dollar for comparison)
  const normalizedPrice = Math.round(product.purchase_price);
  const priceHash = generateHash(normalizedPrice.toString());
  
  // Normalize date (round to nearest day)
  const purchaseDate = new Date(product.purchase_date);
  const normalizedDate = purchaseDate.toISOString().split('T')[0];
  const dateHash = generateHash(normalizedDate);
  
  // Normalize retailer
  const normalizedRetailer = normalizeRetailerName(product.retailer);
  const retailerHash = generateHash(normalizedRetailer);
  
  // Combined hash
  const combinedHash = generateHash(`${nameHash}-${priceHash}-${dateHash}-${retailerHash}`);

  return {
    nameHash,
    priceHash,
    dateHash,
    retailerHash,
    combinedHash
  };
}

function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

function normalizeRetailerName(retailer: string): string {
  const retailerMappings: { [key: string]: string } = {
    'amazon': 'amazon',
    'amazon.com': 'amazon',
    'amzn': 'amazon',
    'apple': 'apple',
    'apple.com': 'apple',
    'best buy': 'bestbuy',
    'bestbuy': 'bestbuy',
    'target': 'target',
    'target.com': 'target',
    'walmart': 'walmart',
    'walmart.com': 'walmart'
  };

  const normalized = retailer.toLowerCase().trim();
  return retailerMappings[normalized] || normalized;
}

function calculateNameSimilarity(name1: string, name2: string): number {
  const normalized1 = normalizeProductName(name1);
  const normalized2 = normalizeProductName(name2);

  // Exact match
  if (normalized1 === normalized2) return 1.0;

  // Check if one contains the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 0.9;
  }

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  return Math.max(0, 1 - (distance / maxLength));
}

function calculatePriceSimilarity(price1: number, price2: number): number {
  const diff = Math.abs(price1 - price2);
  const avgPrice = (price1 + price2) / 2;
  
  if (avgPrice === 0) return 1.0;
  
  const percentageDiff = diff / avgPrice;
  
  // 100% similar if within 5%
  if (percentageDiff <= 0.05) return 1.0;
  
  // 90% similar if within 10%
  if (percentageDiff <= 0.10) return 0.9;
  
  // 80% similar if within 20%
  if (percentageDiff <= 0.20) return 0.8;
  
  // Linear decrease after 20%
  return Math.max(0, 0.8 - (percentageDiff - 0.20) * 2);
}

function calculateDateSimilarity(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  const diffDays = Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
  
  // Same day
  if (diffDays === 0) return 1.0;
  
  // Within 1 day
  if (diffDays <= 1) return 0.95;
  
  // Within 3 days
  if (diffDays <= 3) return 0.9;
  
  // Within 7 days
  if (diffDays <= 7) return 0.8;
  
  // Within 30 days
  if (diffDays <= 30) return 0.6;
  
  // More than 30 days
  return 0.3;
}

function calculateRetailerSimilarity(retailer1: string, retailer2: string): number {
  const normalized1 = normalizeRetailerName(retailer1);
  const normalized2 = normalizeRetailerName(retailer2);
  
  if (normalized1 === normalized2) return 1.0;
  
  // Check if retailers are related (e.g., different domains of same company)
  const retailerGroups = {
    'amazon': ['amazon', 'amzn', 'amazon.com'],
    'apple': ['apple', 'apple.com', 'itunes'],
    'bestbuy': ['best buy', 'bestbuy', 'bestbuy.com'],
    'target': ['target', 'target.com'],
    'walmart': ['walmart', 'walmart.com']
  };
  
  for (const [group, variants] of Object.entries(retailerGroups)) {
    if (variants.includes(normalized1) && variants.includes(normalized2)) {
      return 0.95;
    }
  }
  
  return 0.0;
}

function calculateOverallConfidence(similarities: {
  nameSimilarity: number;
  priceSimilarity: number;
  dateSimilarity: number;
  retailerSimilarity: number;
}): number {
  // Weighted average based on importance
  const weights = {
    nameSimilarity: 0.4,    // Most important
    priceSimilarity: 0.3,   // Very important
    dateSimilarity: 0.2,    // Important
    retailerSimilarity: 0.1 // Least important
  };
  
  return (
    similarities.nameSimilarity * weights.nameSimilarity +
    similarities.priceSimilarity * weights.priceSimilarity +
    similarities.dateSimilarity * weights.dateSimilarity +
    similarities.retailerSimilarity * weights.retailerSimilarity
  );
}

function generateDuplicateReason(similarities: {
  nameSimilarity: number;
  priceSimilarity: number;
  dateSimilarity: number;
  retailerSimilarity: number;
}): string {
  const reasons: string[] = [];
  
  if (similarities.nameSimilarity > 0.9) {
    reasons.push('identical product name');
  }
  if (similarities.priceSimilarity > 0.9) {
    reasons.push('identical price');
  }
  if (similarities.dateSimilarity > 0.9) {
    reasons.push('same purchase date');
  }
  if (similarities.retailerSimilarity > 0.9) {
    reasons.push('same retailer');
  }
  
  return reasons.join(', ');
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

function generateHash(str: string): string {
  // Simple hash function for fingerprinting
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

async function processDuplicates(duplicates: any[][], userId: string): Promise<void> {
  const agentName = 'DuplicateDetectionAgent';
  
  for (const duplicateGroup of duplicates) {
    try {
      logAgentActivity(agentName, 'Processing duplicate group', {
        userId,
        duplicateCount: duplicateGroup.length,
        productNames: duplicateGroup.map(p => p.product_name)
      });

      // Sort by creation date (keep the oldest as primary)
      duplicateGroup.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      const primaryProduct = duplicateGroup[0];
      const duplicateProducts = duplicateGroup.slice(1);

      // Merge duplicate products into primary
      await mergeDuplicateProducts(primaryProduct, duplicateProducts);

    } catch (error) {
      logAgentActivity(agentName, 'Error processing duplicate group', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

async function mergeDuplicateProducts(primaryProduct: any, duplicateProducts: any[]): Promise<void> {
  // TODO: Implement database merge logic
  // This would:
  // 1. Keep the primary product
  // 2. Merge any unique data from duplicates into primary
  // 3. Mark duplicates as archived
  // 4. Update any references to point to primary product
  
  logAgentActivity('DuplicateDetectionAgent', 'Merging duplicate products', {
    primaryProductId: primaryProduct.id,
    duplicateCount: duplicateProducts.length
  });
}
