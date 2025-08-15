import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getActiveUsers, createProduct } from '../shared/database';
import { PurchaseEvent, generateOrderNumber, logAgentActivity } from '../shared/utils';

// Global retailer configurations
const RETAILER_CONFIGS = {
  amazon: {
    name: 'Amazon',
    regions: ['US', 'UK', 'DE', 'FR', 'IT', 'ES', 'JP', 'IN', 'CA', 'AU'],
    oauthUrl: 'https://www.amazon.com/ap/oa',
    apiBaseUrl: 'https://sellingpartner-api.amazon.com',
    scopes: ['read_orders', 'read_items'],
    refreshInterval: 3600, // 1 hour
  },
  apple: {
    name: 'Apple',
    regions: ['US', 'UK', 'DE', 'FR', 'IT', 'ES', 'JP', 'IN', 'CA', 'AU'],
    oauthUrl: 'https://appleid.apple.com/auth/authorize',
    apiBaseUrl: 'https://api.storekit.itunes.apple.com',
    scopes: ['orders', 'purchases'],
    refreshInterval: 3600,
  },
  bestbuy: {
    name: 'Best Buy',
    regions: ['US', 'CA'],
    oauthUrl: 'https://api.bestbuy.com/oauth/authorize',
    apiBaseUrl: 'https://api.bestbuy.com',
    scopes: ['orders', 'purchases'],
    refreshInterval: 3600,
  },
  target: {
    name: 'Target',
    regions: ['US'],
    oauthUrl: 'https://auth.target.com/oauth/authorize',
    apiBaseUrl: 'https://api.target.com',
    scopes: ['orders', 'purchases'],
    refreshInterval: 3600,
  },
  walmart: {
    name: 'Walmart',
    regions: ['US', 'CA', 'MX'],
    oauthUrl: 'https://marketplace.walmartapis.com/v3/authorization',
    apiBaseUrl: 'https://marketplace.walmartapis.com',
    scopes: ['orders', 'purchases'],
    refreshInterval: 3600,
  },
  flipkart: {
    name: 'Flipkart',
    regions: ['IN'],
    oauthUrl: 'https://api.flipkart.net/oauth/authorize',
    apiBaseUrl: 'https://api.flipkart.net',
    scopes: ['orders', 'purchases'],
    refreshInterval: 3600,
  },
  aliexpress: {
    name: 'AliExpress',
    regions: ['Global'],
    oauthUrl: 'https://api.aliexpress.com/oauth/authorize',
    apiBaseUrl: 'https://api.aliexpress.com',
    scopes: ['orders', 'purchases'],
    refreshInterval: 3600,
  },
  shopee: {
    name: 'Shopee',
    regions: ['SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'TW', 'BR'],
    oauthUrl: 'https://partner.shopeemobile.com/api/v2/oauth/authorize',
    apiBaseUrl: 'https://partner.shopeemobile.com/api/v2',
    scopes: ['orders', 'purchases'],
    refreshInterval: 3600,
  }
};

interface RetailerConnection {
  userId: string;
  retailer: string;
  region: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  lastSync: string;
  isActive: boolean;
}

interface RetailerOrder {
  orderId: string;
  orderDate: string;
  totalAmount: number;
  currency: string;
  status: string;
  items: RetailerOrderItem[];
}

interface RetailerOrderItem {
  productId: string;
  productName: string;
  brand: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  serialNumber?: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const agentName = 'RetailerAPIAgent';

  try {
    logAgentActivity(agentName, 'Starting retailer API sync', {});

    // Get all active users
    const users = await getActiveUsers();
    
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
          productsCreated: 0
        })
      };
    }

    let totalProductsCreated = 0;
    let totalUsersProcessed = 0;

    // Process each user's retailer connections
    for (const user of users) {
      try {
        logAgentActivity(agentName, 'Processing user retailer connections', {
          userId: user.id,
          userEmail: user.email
        });

        // Get user's retailer connections
        const connections = await getUserRetailerConnections(user.id);
        
        if (!connections || connections.length === 0) {
          logAgentActivity(agentName, 'No retailer connections found for user', {
            userId: user.id
          });
          continue;
        }

        // Process each retailer connection
        for (const connection of connections) {
          if (!connection.isActive) continue;

          try {
            const productsCreated = await syncRetailerOrders(user.id, connection);
            totalProductsCreated += productsCreated;

            logAgentActivity(agentName, 'Completed retailer sync', {
              userId: user.id,
              retailer: connection.retailer,
              region: connection.region,
              productsCreated
            });

          } catch (error) {
            logAgentActivity(agentName, 'Error syncing retailer', {
              userId: user.id,
              retailer: connection.retailer,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        totalUsersProcessed++;

      } catch (error) {
        logAgentActivity(agentName, 'Error processing user', {
          userId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logAgentActivity(agentName, 'Completed retailer API sync', {
      usersProcessed: totalUsersProcessed,
      productsCreated: totalProductsCreated
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Retailer API sync completed',
        usersProcessed: totalUsersProcessed,
        productsCreated: totalProductsCreated
      })
    };

  } catch (error) {
    logAgentActivity(agentName, 'Fatal error in retailer API agent', {
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

async function getUserRetailerConnections(userId: string): Promise<RetailerConnection[]> {
  // TODO: Implement database query to get user's retailer connections
  // For now, return mock data
  return [
    {
      userId,
      retailer: 'amazon',
      region: 'US',
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      lastSync: new Date().toISOString(),
      isActive: true
    }
  ];
}

async function syncRetailerOrders(userId: string, connection: RetailerConnection): Promise<number> {
  const agentName = 'RetailerAPIAgent';
  let productsCreated = 0;

  try {
    // Check if token needs refresh
    if (new Date(connection.expiresAt) <= new Date()) {
      await refreshRetailerToken(connection);
    }

    // Get orders from retailer API
    const orders = await fetchRetailerOrders(connection);
    
    if (!orders || orders.length === 0) {
      logAgentActivity(agentName, 'No new orders found', {
        userId,
        retailer: connection.retailer
      });
      return 0;
    }

    // Process each order
    for (const order of orders) {
      // Check if order already exists (duplicate detection)
      const orderExists = await checkOrderExists(userId, order.orderId);
      
      if (orderExists) {
        logAgentActivity(agentName, 'Order already exists, skipping', {
          userId,
          orderId: order.orderId
        });
        continue;
      }

      // Process each item in the order
      for (const item of order.items) {
        try {
          const purchaseEvent: PurchaseEvent = {
            id: generateOrderNumber(),
            userId,
            productName: item.productName,
            productDescription: `${item.brand} ${item.model} - ${item.category}`,
            purchasePrice: item.price,
            purchaseDate: order.orderDate,
            retailer: connection.retailer,
            orderNumber: order.orderId,
            source: 'retailer_api',
            rawData: {
              order,
              item,
              connection
            }
          };

          const productId = await createProductFromPurchaseEvent(purchaseEvent);
          
          if (productId) {
            productsCreated++;
            logAgentActivity(agentName, 'Created product from retailer API', {
              productId,
              userId,
              productName: item.productName,
              retailer: connection.retailer,
              orderId: order.orderId
            });
          }

        } catch (error) {
          logAgentActivity(agentName, 'Error creating product from order item', {
            userId,
            orderId: order.orderId,
            productName: item.productName,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    // Update last sync time
    await updateLastSyncTime(connection);

  } catch (error) {
    logAgentActivity(agentName, 'Error syncing retailer orders', {
      userId,
      retailer: connection.retailer,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }

  return productsCreated;
}

async function refreshRetailerToken(connection: RetailerConnection): Promise<void> {
  // TODO: Implement OAuth2 token refresh for each retailer
  // This will vary by retailer - some use standard OAuth2, others have custom flows
  
  const config = RETAILER_CONFIGS[connection.retailer as keyof typeof RETAILER_CONFIGS];
  if (!config) {
    throw new Error(`Unknown retailer: ${connection.retailer}`);
  }

  // Mock implementation - in reality, this would make API calls to refresh tokens
  logAgentActivity('RetailerAPIAgent', 'Refreshing retailer token', {
    retailer: connection.retailer,
    userId: connection.userId
  });

  // Update connection with new token
  connection.accessToken = 'new_mock_access_token';
  connection.expiresAt = new Date(Date.now() + 3600000).toISOString();
}

async function fetchRetailerOrders(connection: RetailerConnection): Promise<RetailerOrder[]> {
  // TODO: Implement actual API calls to each retailer
  // This will vary significantly by retailer - each has different APIs
  
  const config = RETAILER_CONFIGS[connection.retailer as keyof typeof RETAILER_CONFIGS];
  if (!config) {
    throw new Error(`Unknown retailer: ${connection.retailer}`);
  }

  // Mock implementation - simulate API response
  return [
    {
      orderId: `ORDER-${Date.now()}`,
      orderDate: new Date().toISOString(),
      totalAmount: 299.99,
      currency: 'USD',
      status: 'delivered',
      items: [
        {
          productId: 'PROD-001',
          productName: 'Wireless Headphones',
          brand: 'Sony',
          model: 'WH-1000XM4',
          category: 'Electronics',
          price: 299.99,
          quantity: 1,
          serialNumber: 'SN123456789'
        }
      ]
    }
  ];
}

async function checkOrderExists(userId: string, orderId: string): Promise<boolean> {
  // TODO: Implement database check for existing order
  // This prevents duplicate products from the same order
  
  // Mock implementation
  return false;
}

async function updateLastSyncTime(connection: RetailerConnection): Promise<void> {
  // TODO: Update the last sync time in the database
  connection.lastSync = new Date().toISOString();
}

async function createProductFromPurchaseEvent(purchaseEvent: PurchaseEvent): Promise<string | null> {
  try {
    const product = {
      user_id: purchaseEvent.userId,
      product_name: purchaseEvent.productName,
      brand: extractBrandFromProduct(purchaseEvent.productName),
      model: extractModelFromProduct(purchaseEvent.productName),
      category: 'Electronics', // Will be enriched by Product Intelligence Agent
      purchase_date: purchaseEvent.purchaseDate,
      purchase_price: purchaseEvent.purchasePrice,
      currency: 'USD',
      purchase_location: purchaseEvent.retailer,
      serial_number: '',
      condition: 'new',
      notes: '',
      is_archived: false,
      warranty_length_months: 12, // Default, will be updated by Warranty Agent
      payment_method: 'online',
      retailer_url: '',
      affiliate_id: '',
      name: purchaseEvent.productName,
      description: purchaseEvent.productDescription,
      retailer: purchaseEvent.retailer,
      order_number: purchaseEvent.orderNumber || generateOrderNumber(),
      warranty_info: {},
      market_value: purchaseEvent.purchasePrice, // Will be updated by Market Value Agent
      source: purchaseEvent.source
    };

    return await createProduct(product);
  } catch (error) {
    console.error('Error creating product from purchase event:', error);
    return null;
  }
}

function extractBrandFromProduct(productName: string): string {
  const brands = ['Sony', 'Samsung', 'Apple', 'LG', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Microsoft'];
  for (const brand of brands) {
    if (productName.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return 'Unknown';
}

function extractModelFromProduct(productName: string): string {
  // Extract model number or name from product name
  const modelMatch = productName.match(/[A-Z]{2,3}-\d{4}|[A-Z]{2,3}\d{4}|[A-Z]{2,3}\s\d{4}/);
  return modelMatch ? modelMatch[0] : 'Unknown';
}
