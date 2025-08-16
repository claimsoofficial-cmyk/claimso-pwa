import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getActiveUsers, getProductsByUserId, updateProduct, type AgentType } from '../shared/database';
import { logAgentActivity } from '../shared/utils';

const AGENT_TYPE: AgentType = 'cash-extraction';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const agentName = 'CashExtractionAgent';
  
  try {
    logAgentActivity(agentName, 'Starting daily cash extraction scan', { 
      timestamp: new Date().toISOString(),
      eventSource: event.requestContext?.stage || 'unknown'
    });

    // Get all active users first
    const activeUsers = await getActiveUsers(AGENT_TYPE);
    
    if (!activeUsers || activeUsers.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No active users found' })
      };
    }

    let totalOpportunities = 0;
    let totalHighValueOpportunities = 0;

    // Process each user's products
    for (const user of activeUsers) {
      try {
        const products = await getProductsByUserId(AGENT_TYPE, user.id);
        
        // Filter out groceries and consumables
        const eligibleProducts = products.filter(product => 
          product.category !== 'Groceries' && 
          product.category !== 'Consumables' && 
          !product.is_archived
        );

        logAgentActivity(agentName, 'Found eligible products for cash extraction', { 
          userId: user.id, 
          totalProducts: products.length,
          eligibleProducts: eligibleProducts.length
        });

        for (const product of eligibleProducts) {
          try {
            const opportunities = await analyzeCashExtractionOpportunities(product);
            
            if (opportunities.length > 0) {
              totalOpportunities += opportunities.length;
              
              // Count high-value opportunities (>$100 potential)
              const highValueOpportunities = opportunities.filter(opp => opp.potentialValue > 100);
              totalHighValueOpportunities += highValueOpportunities.length;
              
              // Create cash extraction opportunities in database
              for (const opportunity of opportunities) {
                await createCashExtractionOpportunity(product.user_id, product.id, opportunity);
              }

              logAgentActivity(agentName, 'Found cash extraction opportunities', {
                productId: product.id,
                productName: product.product_name,
                opportunitiesCount: opportunities.length,
                highValueCount: highValueOpportunities.length
              });
            }

          } catch (error) {
            logAgentActivity(agentName, 'Error analyzing product for cash extraction', {
              productId: product.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      } catch (error) {
        logAgentActivity(agentName, 'Error processing user products for cash extraction', {
          userId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logAgentActivity(agentName, 'Completed cash extraction scan', {
      usersProcessed: activeUsers.length,
      totalOpportunities,
      totalHighValueOpportunities
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Cash extraction scan completed', 
        usersProcessed: activeUsers.length,
        totalOpportunities, 
        totalHighValueOpportunities 
      })
    };

  } catch (error) {
    logAgentActivity(agentName, 'Fatal error in cash extraction agent', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Fatal error in cash extraction agent', error: error instanceof Error ? error.message : 'Unknown error' })
    };
  }
};

async function analyzeCashExtractionOpportunities(product: any): Promise<any[]> {
  const agentName = 'CashExtractionAgent';
  const opportunities: any[] = [];

  try {
    const purchaseDate = new Date(product.purchase_date);
    const currentDate = new Date();
    const monthsSincePurchase = (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    // Get current market value
    const currentMarketValue = await getCurrentMarketValue(product);
    const potentialProfit = currentMarketValue - product.purchase_price;
    const profitPercentage = (potentialProfit / product.purchase_price) * 100;

    // Check for high-value selling opportunities (profit > 20%)
    if (profitPercentage > 20 && potentialProfit > 50) {
      opportunities.push({
        type: 'high_value_selling',
        title: 'High-Value Selling Opportunity',
        description: `Your ${product.product_name} has increased in value by ${profitPercentage.toFixed(1)}%. Consider selling for maximum profit.`,
        priority: 'high',
        potentialProfit: potentialProfit,
        currentMarketValue: currentMarketValue,
        profitPercentage: profitPercentage,
        actionRequired: 'List item for sale on recommended platforms',
        urgency: 'medium',
        recommendedPlatforms: getRecommendedPlatforms(product.category)
      });
    }

    // Check for upgrade timing opportunities
    const upgradeOpportunity = await checkUpgradeTiming(product, monthsSincePurchase);
    if (upgradeOpportunity) {
      opportunities.push(upgradeOpportunity);
    }

    // Check for seasonal selling opportunities
    const seasonalOpportunity = await checkSeasonalOpportunities(product);
    if (seasonalOpportunity) {
      opportunities.push(seasonalOpportunity);
    }

    // Check for warranty expiration selling (sell before warranty expires)
    const warrantySellingOpportunity = await checkWarrantySellingOpportunity(product);
    if (warrantySellingOpportunity) {
      opportunities.push(warrantySellingOpportunity);
    }

    // Check for market trend opportunities
    const marketTrendOpportunity = await checkMarketTrends(product);
    if (marketTrendOpportunity) {
      opportunities.push(marketTrendOpportunity);
    }

    logAgentActivity(agentName, 'Analyzed selling opportunities', {
      productId: product.id,
      opportunitiesFound: opportunities.length,
      currentMarketValue,
      potentialProfit,
      profitPercentage: profitPercentage.toFixed(1)
    });

    return opportunities;

  } catch (error) {
    logAgentActivity(agentName, 'Error analyzing selling opportunities', {
      productId: product.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return [];
  }
}

async function getCurrentMarketValue(product: any): Promise<number> {
  // Simulate market value research
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const baseValue = product.purchase_price;
  const monthsSincePurchase = (Date.now() - new Date(product.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  // Market value changes based on product type and time
  const valueMultipliers: { [key: string]: number } = {
    'Mobile Phones': 0.85, // Phones depreciate quickly
    'Laptops': 0.75, // Laptops depreciate moderately
    'TVs & Home Theater': 0.70, // TVs depreciate significantly
    'Audio': 0.80, // Audio equipment holds some value
    'Electronics': 0.75, // General electronics
    'Footwear': 0.60, // Shoes depreciate quickly
    'Cameras': 0.70 // Cameras depreciate moderately
  };

  const multiplier = valueMultipliers[product.category] || 0.75;
  const depreciationFactor = Math.pow(multiplier, monthsSincePurchase / 12);
  
  // Add some market volatility (±15%)
  const volatility = 0.85 + (Math.random() * 0.3);
  
  return Math.round(baseValue * depreciationFactor * volatility);
}

async function checkUpgradeTiming(product: any, monthsSincePurchase: number): Promise<any | null> {
  const upgradeCycles: { [key: string]: number } = {
    'Mobile Phones': 24, // 2 years
    'Laptops': 36, // 3 years
    'TVs & Home Theater': 60, // 5 years
    'Audio': 48, // 4 years
    'Electronics': 36, // 3 years
    'Cameras': 48 // 4 years
  };

  const upgradeCycle = upgradeCycles[product.category] || 36;
  
  if (monthsSincePurchase >= upgradeCycle * 0.8) { // 80% of upgrade cycle
    return {
      type: 'upgrade_timing',
      title: 'Upgrade Timing Opportunity',
      description: `Your ${product.product_name} is approaching the typical upgrade cycle. Consider selling before new models are released.`,
      priority: 'medium',
      potentialProfit: product.purchase_price * 0.3,
      currentMarketValue: product.purchase_price * 0.7,
      actionRequired: 'Monitor for new model releases and sell before announcement',
      urgency: 'low',
      upgradeCycle: upgradeCycle,
      monthsUntilUpgrade: Math.max(0, upgradeCycle - monthsSincePurchase)
    };
  }

  return null;
}

async function checkSeasonalOpportunities(product: any): Promise<any | null> {
  const currentMonth = new Date().getMonth();
  
  const seasonalOpportunities: { [key: string]: { months: number[], reason: string } } = {
    'Mobile Phones': {
      months: [8, 9], // September - iPhone release
      reason: 'New iPhone release creates demand for older models'
    },
    'Laptops': {
      months: [7, 8], // August - Back to school
      reason: 'Back to school season increases laptop demand'
    },
    'TVs & Home Theater': {
      months: [10, 11], // November - Black Friday
      reason: 'Holiday season increases TV demand'
    },
    'Audio': {
      months: [11, 12], // December - Holiday gifts
      reason: 'Holiday season increases audio equipment demand'
    }
  };

  const seasonal = seasonalOpportunities[product.category];
  if (seasonal && seasonal.months.includes(currentMonth)) {
    return {
      type: 'seasonal_opportunity',
      title: 'Seasonal Selling Opportunity',
      description: `Seasonal demand for ${product.product_name} is high. Consider selling now for better prices.`,
      priority: 'medium',
      potentialProfit: product.purchase_price * 0.2,
      currentMarketValue: product.purchase_price * 0.9,
      actionRequired: 'List item for sale during peak demand period',
      urgency: 'high',
      seasonalReason: seasonal.reason
    };
  }

  return null;
}

async function checkWarrantySellingOpportunity(product: any): Promise<any | null> {
  const purchaseDate = new Date(product.purchase_date);
  const warrantyEndDate = new Date(purchaseDate.getTime() + (product.warranty_length_months * 30 * 24 * 60 * 60 * 1000));
  const daysUntilWarrantyExpires = (warrantyEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

  // If warranty expires within 30 days, it's a good time to sell
  if (daysUntilWarrantyExpires <= 30 && daysUntilWarrantyExpires > 0) {
    return {
      type: 'warranty_expiring_sell',
      title: 'Sell Before Warranty Expires',
      description: `Your ${product.product_name} warranty expires in ${Math.round(daysUntilWarrantyExpires)} days. Items with active warranties sell for higher prices.`,
      priority: 'high',
      potentialProfit: product.purchase_price * 0.25,
      currentMarketValue: product.purchase_price * 0.85,
      actionRequired: 'Sell quickly while warranty is still active',
      urgency: 'high',
      daysUntilExpiry: Math.round(daysUntilWarrantyExpires)
    };
  }

  return null;
}

async function checkMarketTrends(product: any): Promise<any | null> {
  // Simulate market trend analysis
  const marketTrends: { [key: string]: { trend: 'up' | 'down' | 'stable', reason: string } } = {
    'Mobile Phones': { trend: 'up', reason: '5G adoption driving demand' },
    'Laptops': { trend: 'stable', reason: 'Remote work demand stabilizing' },
    'TVs & Home Theater': { trend: 'down', reason: 'Market saturation' },
    'Audio': { trend: 'up', reason: 'Wireless audio popularity' },
    'Electronics': { trend: 'stable', reason: 'General market stability' }
  };

  const trend = marketTrends[product.category] || { trend: 'stable', reason: 'No specific trend data' };
  
  if (trend.trend === 'up') {
    return {
      type: 'market_trend_up',
      title: 'Favorable Market Trend',
      description: `Market demand for ${product.product_name} is increasing. Consider selling while demand is high.`,
      priority: 'medium',
      potentialProfit: product.purchase_price * 0.15,
      currentMarketValue: product.purchase_price * 0.9,
      actionRequired: 'Monitor market prices and sell during peak demand',
      urgency: 'medium',
      trendReason: trend.reason
    };
  }

  return null;
}

function getRecommendedPlatforms(category: string): string[] {
  const platformMap: { [key: string]: string[] } = {
    'Mobile Phones': ['Swappa', 'eBay', 'Facebook Marketplace', 'Craigslist'],
    'Laptops': ['eBay', 'Swappa', 'Facebook Marketplace', 'Craigslist'],
    'TVs & Home Theater': ['Facebook Marketplace', 'Craigslist', 'eBay', 'OfferUp'],
    'Audio': ['eBay', 'Swappa', 'Facebook Marketplace', 'Reddit r/AVexchange'],
    'Electronics': ['eBay', 'Facebook Marketplace', 'Craigslist', 'OfferUp'],
    'Footwear': ['eBay', 'Poshmark', 'Mercari', 'Facebook Marketplace']
  };

  return platformMap[category] || ['eBay', 'Facebook Marketplace', 'Craigslist'];
}

async function createCashExtractionOpportunity(userId: string, productId: string, opportunity: any): Promise<boolean> {
  try {
    // In a real implementation, this would create a record in a selling_opportunities table
    logAgentActivity('CashExtractionAgent', 'Created cash extraction opportunity', {
      userId,
      productId,
      opportunityType: opportunity.type,
      title: opportunity.title,
      potentialProfit: opportunity.potentialProfit
    });

    // Simulate database insertion
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  } catch (error) {
    logAgentActivity('CashExtractionAgent', 'Error creating cash extraction opportunity', {
      userId,
      productId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}
