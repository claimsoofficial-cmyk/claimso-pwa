import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getActiveUsers, createProduct, type AgentType } from '../shared/database';
import { parseEmailContent, generateOrderNumber, logAgentActivity } from '../shared/utils';
import { PurchaseEvent } from '../shared/types';

const AGENT_TYPE: AgentType = 'email-monitoring';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const agentName = 'EmailMonitoringAgent';
  
  try {
    logAgentActivity(agentName, 'Starting email monitoring cycle', { timestamp: new Date().toISOString() });

    // Step 1: Get all active users
    const activeUsers = await getActiveUsers(AGENT_TYPE);
    logAgentActivity(agentName, 'Fetched active users', { count: activeUsers.length });

    let totalProcessed = 0;
    let totalProductsCreated = 0;

    // Step 2: Process each user's emails
    for (const user of activeUsers) {
      if (!user.settings?.email_monitoring_enabled) {
        logAgentActivity(agentName, 'Skipping user - email monitoring disabled', { userId: user.id });
        continue;
      }

      try {
        const result = await processUserEmails(user.id, user.email);
        totalProcessed++;
        totalProductsCreated += result.productsCreated;
        
        logAgentActivity(agentName, 'Processed user emails', {
          userId: user.id,
          emailsProcessed: result.emailsProcessed,
          productsCreated: result.productsCreated
        });
      } catch (error) {
        logAgentActivity(agentName, 'Error processing user emails', {
          userId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logAgentActivity(agentName, 'Email monitoring cycle completed', {
      usersProcessed: totalProcessed,
      totalProductsCreated,
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Email monitoring completed successfully',
        data: {
          usersProcessed: totalProcessed,
          totalProductsCreated
        }
      })
    };

  } catch (error) {
    logAgentActivity(agentName, 'Fatal error in email monitoring', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        message: 'Email monitoring failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

async function processUserEmails(userId: string, userEmail: string): Promise<{ emailsProcessed: number; productsCreated: number }> {
  const agentName = 'EmailMonitoringAgent';
  
  // Step 1: Simulate fetching emails (this will be replaced with actual email API integration)
  const emails = await simulatePurchaseEmailDetection(userEmail);
  
  let productsCreated = 0;
  
  // Step 2: Process each email
  for (const email of emails) {
    try {
      // Step 3: Parse email content
      const parsedData = parseEmailContent(email.content);
      
      if (parsedData) {
        // Step 4: Create product from email data
        const productId = await createProduct(AGENT_TYPE, {
          user_id: userId,
          product_name: parsedData.productName,
          brand: parsedData.brand,
          model: parsedData.model,
          category: parsedData.category,
          purchase_date: parsedData.purchaseDate,
          purchase_price: parsedData.purchasePrice,
          currency: parsedData.currency,
          purchase_location: parsedData.retailer,
          serial_number: parsedData.serialNumber || '',
          condition: 'new',
          notes: `Purchased via email confirmation from ${parsedData.retailer}`,
          is_archived: false,
          warranty_length_months: parsedData.warrantyLength || 12,
          payment_method: parsedData.paymentMethod || 'unknown',
          retailer_url: parsedData.retailerUrl || '',
          affiliate_id: parsedData.affiliateId || '',
          name: parsedData.productName,
          description: parsedData.description || '',
          retailer: parsedData.retailer,
          order_number: generateOrderNumber(),
          warranty_info: parsedData.warrantyInfo || {},
          market_value: parsedData.purchasePrice,
          source: 'email'
        }, userId);

        if (productId) {
          productsCreated++;
          logAgentActivity(agentName, 'Created product from email', {
            userId,
            productId,
            productName: parsedData.productName
          });
        }
      }
    } catch (error) {
      logAgentActivity(agentName, 'Error processing email', {
        userId,
        emailId: email.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return {
    emailsProcessed: emails.length,
    productsCreated
  };
}

async function simulatePurchaseEmailDetection(userEmail: string): Promise<any[]> {
  // This is a simulation - in production, this would integrate with:
  // - Gmail API
  // - Outlook API
  // - IMAP/POP3
  // - Email webhooks
  
  const mockEmails = [
    {
      id: 'email-1',
      subject: 'Your Amazon Order #123-4567890-1234567',
      content: `Thank you for your order!

Order #123-4567890-1234567
Order Date: January 15, 2025
Total: $299.99

Items:
- Apple AirPods Pro (2nd Generation) - $249.99
- AppleCare+ for AirPods - $50.00

Estimated delivery: January 18-20, 2025

Track your package: [LINK TO TRACKING]

Thank you for shopping with Amazon!`,
      from: 'shipment-tracking@amazon.com',
      timestamp: new Date().toISOString()
    },
    {
      id: 'email-2',
      subject: 'Order Confirmation - iPhone 15 Pro',
      content: `Your order has been confirmed!

Order Number: W123456789
Date: January 14, 2025
Total: $1,199.00

Product: iPhone 15 Pro 256GB - Natural Titanium
Price: $1,199.00

Your iPhone will be delivered on January 16, 2025.

Thank you for choosing Apple!`,
      from: 'orders@apple.com',
      timestamp: new Date().toISOString()
    },
    {
      id: 'email-3',
      subject: 'Your Best Buy Order #BBY123456789',
      content: `Order Confirmation

Order #BBY123456789
Order Date: January 13, 2025
Total: $899.99

Items:
- Samsung 65" Class QLED 4K UHD Q60C Series - $899.99

Estimated pickup: January 15, 2025

Thank you for shopping at Best Buy!`,
      from: 'orders@bestbuy.com',
      timestamp: new Date().toISOString()
    }
  ];

  // Simulate some delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return mockEmails;
}

function extractRetailerFromEmail(email: any): string {
  // Extract retailer from email address or content
  const emailDomain = email.from?.split('@')[1] || '';
  
  const retailerMap: { [key: string]: string } = {
    'apple.com': 'Apple',
    'bestbuy.com': 'Best Buy',
    'amazon.com': 'Amazon',
    'walmart.com': 'Walmart',
    'target.com': 'Target'
  };

  return retailerMap[emailDomain] || 'Unknown Retailer';
}

async function createProductFromPurchaseEvent(purchaseEvent: PurchaseEvent): Promise<string | null> {
  const product = {
    user_id: purchaseEvent.userId,
    product_name: purchaseEvent.productName,
    brand: extractBrandFromProduct(purchaseEvent.productName),
    model: extractModelFromProduct(purchaseEvent.productName),
    category: 'Electronics', // Default category
    purchase_date: purchaseEvent.purchaseDate,
    purchase_price: purchaseEvent.purchasePrice,
    currency: 'USD', // Default currency
    purchase_location: 'Online',
    serial_number: '',
    condition: 'new',
    notes: purchaseEvent.productDescription || '',
    is_archived: false,
    warranty_length_months: 12, // Default warranty
    payment_method: 'Credit Card',
    retailer_url: '',
    affiliate_id: '',
    name: purchaseEvent.productName, // Keep for compatibility
    description: purchaseEvent.productDescription || '',
    retailer: purchaseEvent.retailer,
    order_number: purchaseEvent.orderNumber || generateOrderNumber(),
    warranty_info: {},
    market_value: purchaseEvent.purchasePrice, // Will be updated by market value agent
    source: purchaseEvent.source // Track the capture source
  };

  return await createProduct(AGENT_TYPE, product, purchaseEvent.userId);
}

function extractBrandFromProduct(productName: string): string {
  const brands = ['Apple', 'Samsung', 'Sony', 'LG', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Microsoft'];
  for (const brand of brands) {
    if (productName.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return 'Unknown';
}

function extractModelFromProduct(productName: string): string {
  // Extract model from product name (e.g., "iPhone 15 Pro" -> "15 Pro")
  const modelMatch = productName.match(/(\d+[A-Za-z\s]*)/);
  return modelMatch ? modelMatch[1].trim() : 'Unknown';
}
