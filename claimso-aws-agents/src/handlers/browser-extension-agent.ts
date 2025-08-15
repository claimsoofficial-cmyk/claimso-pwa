import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createProduct } from '../shared/database';
import { generateOrderNumber, logAgentActivity } from '../shared/utils';
import { PurchaseEvent } from '../shared/types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const agentName = 'BrowserExtensionAgent';
  
  try {
    logAgentActivity(agentName, 'Received browser extension event', { 
      timestamp: new Date().toISOString(),
      method: event.httpMethod,
      path: event.path
    });

    // Parse the request body
    let requestBody: any;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      logAgentActivity(agentName, 'Error parsing request body', { error: parseError });
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          message: 'Invalid JSON in request body'
        })
      };
    }

    // Validate required fields
    const requiredFields = ['userId', 'productName', 'purchasePrice', 'retailer'];
    const missingFields = requiredFields.filter(field => !requestBody[field]);
    
    if (missingFields.length > 0) {
      logAgentActivity(agentName, 'Missing required fields', { missingFields });
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        })
      };
    }

    // Create purchase event
    const purchaseEvent: PurchaseEvent = {
      id: generateOrderNumber(),
      userId: requestBody.userId,
      productName: requestBody.productName,
      productDescription: requestBody.productDescription || '',
      purchasePrice: parseFloat(requestBody.purchasePrice),
      purchaseDate: requestBody.purchaseDate || new Date().toISOString(),
      retailer: requestBody.retailer,
      orderNumber: requestBody.orderNumber || generateOrderNumber(),
      receiptImageUrl: requestBody.receiptImageUrl,
      source: 'browser',
      rawData: requestBody
    };

    logAgentActivity(agentName, 'Processing purchase event', {
      userId: purchaseEvent.userId,
      productName: purchaseEvent.productName,
      price: purchaseEvent.purchasePrice,
      retailer: purchaseEvent.retailer
    });

    // Create product in database
    const productId = await createProductFromPurchaseEvent(purchaseEvent);
    
    if (!productId) {
      logAgentActivity(agentName, 'Failed to create product', { purchaseEvent });
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          message: 'Failed to create product in database'
        })
      };
    }

    logAgentActivity(agentName, 'Successfully created product', {
      productId,
      userId: purchaseEvent.userId,
      productName: purchaseEvent.productName
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Purchase event processed successfully',
        data: {
          productId,
          purchaseEvent: {
            id: purchaseEvent.id,
            productName: purchaseEvent.productName,
            price: purchaseEvent.purchasePrice,
            retailer: purchaseEvent.retailer,
            orderNumber: purchaseEvent.orderNumber
          }
        }
      })
    };

  } catch (error) {
    logAgentActivity(agentName, 'Fatal error in browser extension agent', {
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
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

async function createProductFromPurchaseEvent(purchaseEvent: PurchaseEvent): Promise<string | null> {
  const product = {
    user_id: purchaseEvent.userId,
    product_name: purchaseEvent.productName,
    brand: extractBrandFromProduct(purchaseEvent.productName),
    model: extractModelFromProduct(purchaseEvent.productName),
    category: determineCategory(purchaseEvent.productName),
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

  return await createProduct(product);
}

function extractBrandFromProduct(productName: string): string {
  const brands = ['Apple', 'Samsung', 'Sony', 'LG', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Microsoft', 'Nike', 'Adidas', 'Canon', 'Nikon'];
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

function determineCategory(productName: string): string {
  const lowerName = productName.toLowerCase();
  
  if (lowerName.includes('phone') || lowerName.includes('iphone') || lowerName.includes('samsung')) {
    return 'Mobile Phones';
  }
  if (lowerName.includes('laptop') || lowerName.includes('macbook') || lowerName.includes('dell') || lowerName.includes('hp')) {
    return 'Laptops';
  }
  if (lowerName.includes('tv') || lowerName.includes('television')) {
    return 'TVs & Home Theater';
  }
  if (lowerName.includes('headphone') || lowerName.includes('airpod') || lowerName.includes('earbud')) {
    return 'Audio';
  }
  if (lowerName.includes('camera') || lowerName.includes('canon') || lowerName.includes('nikon')) {
    return 'Cameras';
  }
  if (lowerName.includes('shoe') || lowerName.includes('nike') || lowerName.includes('adidas')) {
    return 'Footwear';
  }
  
  return 'Electronics';
}
