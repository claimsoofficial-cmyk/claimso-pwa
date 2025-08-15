import { ScheduledEvent } from 'aws-lambda';
import { supabase } from '../shared/database';
import { logAgentActivity } from '../shared/utils';

export const handler = async (event: ScheduledEvent): Promise<void> => {
  const agentName = 'WarrantyClaimAgent';
  
  try {
    logAgentActivity(agentName, 'Starting daily warranty claim scan', { 
      timestamp: new Date().toISOString(),
      eventSource: event.source
    });

    // Get all products with active warranties
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .not('warranty_length_months', 'eq', 0)
      .not('is_archived', 'eq', true);

    if (error) {
      logAgentActivity(agentName, 'Error fetching products', { error: error.message });
      return;
    }

    logAgentActivity(agentName, 'Found products to analyze', { count: products?.length || 0 });

    let totalOpportunities = 0;
    let totalClaimsIdentified = 0;

    for (const product of products || []) {
      try {
        const opportunities = await analyzeWarrantyOpportunities(product);
        
        if (opportunities.length > 0) {
          totalOpportunities += opportunities.length;
          
          // Create warranty claim opportunities in database
          for (const opportunity of opportunities) {
            const success = await createWarrantyOpportunity(product.user_id, product.id, opportunity);
            if (success) {
              totalClaimsIdentified++;
            }
          }

          logAgentActivity(agentName, 'Found warranty opportunities', {
            productId: product.id,
            productName: product.product_name,
            opportunitiesCount: opportunities.length
          });
        }

      } catch (error) {
        logAgentActivity(agentName, 'Error analyzing product', {
          productId: product.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logAgentActivity(agentName, 'Completed warranty claim scan', {
      productsAnalyzed: products?.length || 0,
      totalOpportunities,
      totalClaimsIdentified
    });

  } catch (error) {
    logAgentActivity(agentName, 'Fatal error in warranty claim agent', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

async function analyzeWarrantyOpportunities(product: any): Promise<any[]> {
  const agentName = 'WarrantyClaimAgent';
  const opportunities: any[] = [];

  try {
    const purchaseDate = new Date(product.purchase_date);
    const currentDate = new Date();
    const monthsSincePurchase = (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const warrantyEndDate = new Date(purchaseDate.getTime() + (product.warranty_length_months * 30 * 24 * 60 * 60 * 1000));
    const daysUntilWarrantyExpires = (warrantyEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);

    // Check if warranty is expiring soon (within 30 days)
    if (daysUntilWarrantyExpires <= 30 && daysUntilWarrantyExpires > 0) {
      opportunities.push({
        type: 'warranty_expiring',
        title: 'Warranty Expiring Soon',
        description: `Your warranty for ${product.product_name} expires in ${Math.round(daysUntilWarrantyExpires)} days. Consider filing any claims before expiration.`,
        priority: 'high',
        potentialValue: product.purchase_price * 0.3, // 30% of purchase price
        actionRequired: 'Review product for any issues and file warranty claims if needed',
        urgency: 'high'
      });
    }

    // Check for common issues based on product type
    const commonIssues = await identifyCommonIssues(product);
    if (commonIssues.length > 0) {
      opportunities.push({
        type: 'common_issues_detected',
        title: 'Potential Warranty Claims Available',
        description: `Common issues detected for ${product.product_name} that may be covered under warranty.`,
        priority: 'medium',
        potentialValue: product.purchase_price * 0.2, // 20% of purchase price
        actionRequired: 'Review common issues and check if your product exhibits any of these problems',
        urgency: 'medium',
        issues: commonIssues
      });
    }

    // Check if product is approaching warranty expiration (within 90 days)
    if (daysUntilWarrantyExpires <= 90 && daysUntilWarrantyExpires > 30) {
      opportunities.push({
        type: 'warranty_approaching_expiry',
        title: 'Warranty Expiring in 3 Months',
        description: `Your warranty for ${product.product_name} expires in ${Math.round(daysUntilWarrantyExpires)} days.`,
        priority: 'medium',
        potentialValue: product.purchase_price * 0.15, // 15% of purchase price
        actionRequired: 'Consider preventive maintenance or extended warranty options',
        urgency: 'medium'
      });
    }

    // Check for extended warranty opportunities
    if (product.warranty_info?.extended_warranty_recommendations?.recommended) {
      opportunities.push({
        type: 'extended_warranty_recommended',
        title: 'Extended Warranty Recommended',
        description: `Consider purchasing extended warranty for ${product.product_name} to protect your investment.`,
        priority: 'low',
        potentialValue: product.purchase_price * 0.1, // 10% of purchase price
        actionRequired: 'Review extended warranty options and pricing',
        urgency: 'low',
        providers: product.warranty_info.extended_warranty_recommendations.providers
      });
    }

    logAgentActivity(agentName, 'Analyzed warranty opportunities', {
      productId: product.id,
      opportunitiesFound: opportunities.length,
      daysUntilExpiry: Math.round(daysUntilWarrantyExpires)
    });

    return opportunities;

  } catch (error) {
    logAgentActivity(agentName, 'Error analyzing warranty opportunities', {
      productId: product.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return [];
  }
}

async function identifyCommonIssues(product: any): Promise<string[]> {
  const commonIssues: string[] = [];
  
  // Common issues by product category
  const issueDatabase: { [key: string]: string[] } = {
    'Mobile Phones': [
      'Battery not holding charge',
      'Screen cracks or damage',
      'Charging port issues',
      'Speaker problems',
      'Camera malfunction'
    ],
    'Laptops': [
      'Battery degradation',
      'Keyboard issues',
      'Fan noise or overheating',
      'Screen flickering',
      'Hard drive problems'
    ],
    'TVs & Home Theater': [
      'Screen dead pixels',
      'Audio issues',
      'Remote control problems',
      'Power supply issues',
      'Smart TV interface problems'
    ],
    'Audio': [
      'Battery life issues',
      'Connectivity problems',
      'Audio quality degradation',
      'Charging case issues',
      'Fit problems'
    ],
    'Electronics': [
      'Power issues',
      'Connectivity problems',
      'Performance degradation',
      'Software glitches',
      'Hardware defects'
    ]
  };

  const category = product.category || 'Electronics';
  const issues = issueDatabase[category] || issueDatabase['Electronics'];
  
  // Randomly select 1-3 issues to simulate detection
  const numIssues = Math.floor(Math.random() * 3) + 1;
  const shuffled = issues.sort(() => 0.5 - Math.random());
  
  return shuffled.slice(0, numIssues);
}

async function createWarrantyOpportunity(userId: string, productId: string, opportunity: any): Promise<boolean> {
  try {
    // In a real implementation, this would create a record in a warranty_opportunities table
    // For now, we'll just log the opportunity
    logAgentActivity('WarrantyClaimAgent', 'Created warranty opportunity', {
      userId,
      productId,
      opportunityType: opportunity.type,
      title: opportunity.title,
      potentialValue: opportunity.potentialValue
    });

    // Simulate database insertion
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  } catch (error) {
    logAgentActivity('WarrantyClaimAgent', 'Error creating warranty opportunity', {
      userId,
      productId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}
