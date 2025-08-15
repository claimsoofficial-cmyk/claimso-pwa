import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createProduct } from '../shared/database';
import { generateOrderNumber, logAgentActivity } from '../shared/utils';
import { PurchaseEvent } from '../shared/types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const agentName = 'MobileAppAgent';
  
  try {
    logAgentActivity(agentName, 'Received mobile app receipt upload', { 
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
    const requiredFields = ['userId', 'receiptImageUrl'];
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

    // Process receipt image (OCR simulation)
    const receiptData = await processReceiptImage(requestBody.receiptImageUrl);
    
    if (!receiptData) {
      logAgentActivity(agentName, 'Failed to process receipt image', { 
        receiptImageUrl: requestBody.receiptImageUrl 
      });
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          message: 'Failed to process receipt image'
        })
      };
    }

    // Create purchase event from receipt data
    const purchaseEvent: PurchaseEvent = {
      id: generateOrderNumber(),
      userId: requestBody.userId,
      productName: receiptData.productName || 'Unknown Product',
      productDescription: receiptData.description || '',
      purchasePrice: receiptData.totalAmount || 0,
      purchaseDate: receiptData.purchaseDate || new Date().toISOString(),
      retailer: receiptData.retailer || 'Unknown Retailer',
      orderNumber: receiptData.orderNumber || generateOrderNumber(),
      receiptImageUrl: requestBody.receiptImageUrl,
      source: 'mobile',
      rawData: { ...requestBody, receiptData }
    };

    logAgentActivity(agentName, 'Processing receipt data', {
      userId: purchaseEvent.userId,
      productName: purchaseEvent.productName,
      price: purchaseEvent.purchasePrice,
      retailer: purchaseEvent.retailer
    });

    // Create product in database
    const productId = await createProductFromPurchaseEvent(purchaseEvent);
    
    if (!productId) {
      logAgentActivity(agentName, 'Failed to create product from receipt', { purchaseEvent });
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

    logAgentActivity(agentName, 'Successfully created product from receipt', {
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
        message: 'Receipt processed successfully',
        data: {
          productId,
          receiptData: {
            productName: purchaseEvent.productName,
            price: purchaseEvent.purchasePrice,
            retailer: purchaseEvent.retailer,
            orderNumber: purchaseEvent.orderNumber,
            items: receiptData.items || []
          }
        }
      })
    };

  } catch (error) {
    logAgentActivity(agentName, 'Fatal error in mobile app agent', {
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

async function processReceiptImage(receiptImageUrl: string): Promise<any> {
  // This is a simulation of OCR processing
  // In production, this would use:
  // - AWS Textract for OCR
  // - Google Vision API
  // - Azure Computer Vision
  
  logAgentActivity('MobileAppAgent', 'Processing receipt image with OCR', { receiptImageUrl });
  
  // Simulate OCR processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulated OCR results based on common receipt patterns
  const mockReceiptData = {
    retailer: 'Walmart',
    purchaseDate: new Date().toISOString(),
    totalAmount: 127.89,
    productName: 'Grocery Items',
    description: 'Various grocery items including produce, dairy, and household goods',
    orderNumber: 'WM-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    items: [
      { name: 'Organic Bananas', price: 3.99, quantity: 1 },
      { name: 'Whole Milk', price: 4.49, quantity: 1 },
      { name: 'Chicken Breast', price: 12.99, quantity: 1 },
      { name: 'Paper Towels', price: 8.99, quantity: 1 }
    ]
  };
  
  return mockReceiptData;
}

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
    purchase_location: 'In-Store',
    serial_number: '',
    condition: 'new',
    notes: purchaseEvent.productDescription || '',
    is_archived: false,
    warranty_length_months: 0, // Groceries typically don't have warranties
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
  
  if (lowerName.includes('grocery') || lowerName.includes('food') || lowerName.includes('produce')) {
    return 'Groceries';
  }
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
  
  return 'General';
}
