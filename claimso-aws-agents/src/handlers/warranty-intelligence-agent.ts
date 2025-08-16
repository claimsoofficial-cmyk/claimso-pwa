import { SQSEvent, SQSRecord } from 'aws-lambda';
import { getActiveUsers, getProductsByUserId, updateProduct, type AgentType } from '../shared/database';
import { logAgentActivity } from '../shared/utils';

const AGENT_TYPE: AgentType = 'warranty-intelligence';

export const handler = async (event: SQSEvent): Promise<void> => {
  const agentName = 'WarrantyIntelligenceAgent';
  
  try {
    logAgentActivity(agentName, 'Processing warranty research messages', { 
      messageCount: event.Records.length,
      timestamp: new Date().toISOString()
    });

    for (const record of event.Records) {
      try {
        await processWarrantyResearch(record);
      } catch (error) {
        logAgentActivity(agentName, 'Error processing warranty record', {
          messageId: record.messageId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        // Continue processing other records
      }
    }

    logAgentActivity(agentName, 'Completed warranty research for all messages', {
      processedCount: event.Records.length
    });

  } catch (error) {
    logAgentActivity(agentName, 'Fatal error in warranty intelligence agent', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

async function processWarrantyResearch(record: SQSRecord): Promise<void> {
  const agentName = 'WarrantyIntelligenceAgent';
  
  try {
    // Parse the SQS message
    const messageBody = JSON.parse(record.body);
    const { productId, userId, productName, brand, category, purchasePrice } = messageBody;

    logAgentActivity(agentName, 'Starting warranty research', {
      productId,
      userId,
      productName,
      brand,
      category
    });

    // Research warranty information
    const warrantyData = await researchWarrantyInfo(productName, brand, category, purchasePrice);
    
    if (!warrantyData) {
      logAgentActivity(agentName, 'No warranty data found', { productName });
      return;
    }

    // Update product with warranty information
    const updateSuccess = await updateProduct(AGENT_TYPE, productId, {
      warranty_info: warrantyData,
      warranty_length_months: warrantyData.manufacturer_warranty_months || 12
    });

    if (updateSuccess) {
      logAgentActivity(agentName, 'Successfully updated warranty information', {
        productId,
        productName,
        warrantyLength: warrantyData.manufacturer_warranty_months,
        extendedWarrantyAvailable: warrantyData.extended_warranty_available
      });
    } else {
      logAgentActivity(agentName, 'Failed to update warranty information', { productId });
    }

  } catch (error) {
    logAgentActivity(agentName, 'Error in warranty research', {
      messageId: record.messageId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

async function researchWarrantyInfo(productName: string, brand: string, category: string, purchasePrice: number): Promise<any> {
  const agentName = 'WarrantyIntelligenceAgent';
  
  logAgentActivity(agentName, 'Researching warranty information', { 
    productName, 
    brand, 
    category, 
    purchasePrice 
  });
  
  // Simulate warranty research time
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock warranty data based on brand and category
  const warrantyDatabase: { [key: string]: any } = {
    'Apple': {
      manufacturer_warranty: '1 year limited warranty',
      manufacturer_warranty_months: 12,
      coverage: 'Hardware defects and manufacturing issues',
      applecare_available: true,
      applecare_plus_available: true,
      extended_warranty_available: true,
      extended_warranty_providers: ['AppleCare+', 'SquareTrade', 'Asurion'],
      claim_process: 'Contact Apple Support or visit Apple Store',
      contact_info: {
        phone: '1-800-275-2273',
        website: 'https://support.apple.com',
        chat_available: true
      },
      common_issues_covered: [
        'Battery replacement',
        'Screen repair',
        'Hardware defects',
        'Manufacturing issues'
      ],
      exclusions: [
        'Accidental damage (without AppleCare+)',
        'Water damage (without AppleCare+)',
        'Cosmetic damage',
        'Software issues'
      ]
    },
    'Samsung': {
      manufacturer_warranty: '1 year limited warranty',
      manufacturer_warranty_months: 12,
      coverage: 'Parts and labor for manufacturing defects',
      extended_warranty_available: true,
      extended_warranty_providers: ['Samsung Care+', 'SquareTrade', 'Asurion'],
      claim_process: 'Contact Samsung Support or authorized service center',
      contact_info: {
        phone: '1-800-726-7864',
        website: 'https://www.samsung.com/us/support/',
        chat_available: true
      },
      common_issues_covered: [
        'Hardware defects',
        'Manufacturing issues',
        'Parts replacement',
        'Software issues'
      ],
      exclusions: [
        'Accidental damage',
        'Water damage',
        'Cosmetic damage',
        'Unauthorized modifications'
      ]
    },
    'Dell': {
      manufacturer_warranty: '1 year limited warranty',
      manufacturer_warranty_months: 12,
      coverage: 'Hardware defects and manufacturing issues',
      extended_warranty_available: true,
      extended_warranty_providers: ['Dell Premium Support', 'SquareTrade', 'Asurion'],
      claim_process: 'Contact Dell Support or schedule on-site service',
      contact_info: {
        phone: '1-800-624-9897',
        website: 'https://www.dell.com/support',
        chat_available: true
      },
      common_issues_covered: [
        'Hardware defects',
        'Manufacturing issues',
        'Parts replacement',
        'On-site service (with Premium Support)'
      ],
      exclusions: [
        'Accidental damage',
        'Software issues',
        'Cosmetic damage',
        'Unauthorized modifications'
      ]
    },
    'HP': {
      manufacturer_warranty: '1 year limited warranty',
      manufacturer_warranty_months: 12,
      coverage: 'Hardware defects and manufacturing issues',
      extended_warranty_available: true,
      extended_warranty_providers: ['HP Care Pack', 'SquareTrade', 'Asurion'],
      claim_process: 'Contact HP Support or visit authorized service center',
      contact_info: {
        phone: '1-800-474-6836',
        website: 'https://support.hp.com',
        chat_available: true
      },
      common_issues_covered: [
        'Hardware defects',
        'Manufacturing issues',
        'Parts replacement',
        'Software support'
      ],
      exclusions: [
        'Accidental damage',
        'Cosmetic damage',
        'Unauthorized modifications',
        'Third-party software issues'
      ]
    },
    'Nike': {
      manufacturer_warranty: '2 year limited warranty',
      manufacturer_warranty_months: 24,
      coverage: 'Manufacturing defects in materials and workmanship',
      extended_warranty_available: false,
      claim_process: 'Return to Nike store or contact customer service',
      contact_info: {
        phone: '1-800-344-6453',
        website: 'https://www.nike.com/help',
        chat_available: true
      },
      common_issues_covered: [
        'Material defects',
        'Workmanship issues',
        'Sole separation',
        'Stitching problems'
      ],
      exclusions: [
        'Normal wear and tear',
        'Accidental damage',
        'Improper care',
        'Custom modifications'
      ]
    },
    'Adidas': {
      manufacturer_warranty: '2 year limited warranty',
      manufacturer_warranty_months: 24,
      coverage: 'Manufacturing defects in materials and workmanship',
      extended_warranty_available: false,
      claim_process: 'Return to Adidas store or contact customer service',
      contact_info: {
        phone: '1-800-982-9337',
        website: 'https://www.adidas.com/us/help',
        chat_available: true
      },
      common_issues_covered: [
        'Material defects',
        'Workmanship issues',
        'Sole separation',
        'Stitching problems'
      ],
      exclusions: [
        'Normal wear and tear',
        'Accidental damage',
        'Improper care',
        'Custom modifications'
      ]
    }
  };

  // Get brand-specific warranty info
  const brandWarranty = warrantyDatabase[brand] || {
    manufacturer_warranty: '1 year limited warranty',
    manufacturer_warranty_months: 12,
    coverage: 'Manufacturing defects and hardware issues',
    extended_warranty_available: true,
    extended_warranty_providers: ['SquareTrade', 'Asurion', 'Warranty Solutions'],
    claim_process: 'Contact manufacturer support',
    contact_info: {
      phone: 'Contact manufacturer',
      website: 'Manufacturer website',
      chat_available: false
    },
    common_issues_covered: [
      'Hardware defects',
      'Manufacturing issues',
      'Parts replacement'
    ],
    exclusions: [
      'Accidental damage',
      'Cosmetic damage',
      'Unauthorized modifications'
    ]
  };

  // Calculate extended warranty recommendations
  const extendedWarrantyRecommendations = calculateExtendedWarrantyRecommendations(
    category, 
    purchasePrice, 
    brandWarranty.manufacturer_warranty_months
  );

  return {
    ...brandWarranty,
    extended_warranty_recommendations: extendedWarrantyRecommendations,
    warranty_value_score: calculateWarrantyValueScore(category, purchasePrice),
    last_updated: new Date().toISOString()
  };
}

function calculateExtendedWarrantyRecommendations(category: string, purchasePrice: number, manufacturerWarrantyMonths: number): any {
  const recommendations: {
    recommended: boolean;
    reason: string;
    cost_range: string;
    value_proposition: string;
    providers: string[];
  } = {
    recommended: false,
    reason: '',
    cost_range: '',
    value_proposition: '',
    providers: []
  };

  // Electronics typically benefit from extended warranties
  if (category.includes('Electronics') || category.includes('Mobile Phones') || category.includes('Laptops')) {
    if (purchasePrice > 500) {
      recommendations.recommended = true;
      recommendations.reason = 'High-value electronics benefit from extended protection';
      recommendations.cost_range = `$${Math.round(purchasePrice * 0.1)} - $${Math.round(purchasePrice * 0.15)}`;
      recommendations.value_proposition = 'Covers accidental damage, extends coverage beyond manufacturer warranty';
      recommendations.providers = ['SquareTrade', 'Asurion', 'AppleCare+ (if applicable)'];
    }
  }

  // Appliances and TVs
  if (category.includes('TVs') || category.includes('Appliances')) {
    if (purchasePrice > 300) {
      recommendations.recommended = true;
      recommendations.reason = 'Large appliances have expensive repair costs';
      recommendations.cost_range = `$${Math.round(purchasePrice * 0.08)} - $${Math.round(purchasePrice * 0.12)}`;
      recommendations.value_proposition = 'Covers expensive repairs and extends useful life';
      recommendations.providers = ['SquareTrade', 'Asurion', 'Warranty Solutions'];
    }
  }

  // Groceries and consumables don't need extended warranties
  if (category.includes('Groceries') || category.includes('Consumables')) {
    recommendations.recommended = false;
    recommendations.reason = 'Consumable items don\'t benefit from extended warranties';
    recommendations.cost_range = 'N/A';
    recommendations.value_proposition = 'Not applicable for consumable items';
    recommendations.providers = [];
  }

  return recommendations;
}

function calculateWarrantyValueScore(category: string, purchasePrice: number): number {
  let score = 50; // Base score

  // Higher value items get higher scores
  if (purchasePrice > 1000) score += 20;
  else if (purchasePrice > 500) score += 15;
  else if (purchasePrice > 200) score += 10;

  // Electronics get higher scores
  if (category.includes('Electronics') || category.includes('Mobile Phones') || category.includes('Laptops')) {
    score += 20;
  }

  // Appliances get moderate scores
  if (category.includes('TVs') || category.includes('Appliances')) {
    score += 15;
  }

  // Groceries get low scores
  if (category.includes('Groceries') || category.includes('Consumables')) {
    score -= 30;
  }

  return Math.min(Math.max(score, 0), 100); // Clamp between 0-100
}
