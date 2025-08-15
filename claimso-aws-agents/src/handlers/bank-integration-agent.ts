import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getActiveUsers, createProduct } from '../shared/database';
import { PurchaseEvent, generateOrderNumber, logAgentActivity } from '../shared/utils';

// Global bank integration providers
const BANK_PROVIDERS = {
  // North America
  plaid: {
    name: 'Plaid',
    regions: ['US', 'CA'],
    apiUrl: 'https://api.plaid.com',
    features: ['transactions', 'accounts', 'balance', 'identity'],
    supportedBanks: 11000,
    pricing: 'per API call',
    webhookSupport: true
  },
  mx: {
    name: 'MX',
    regions: ['US', 'CA'],
    apiUrl: 'https://api.mx.com',
    features: ['transactions', 'accounts', 'categorization'],
    supportedBanks: 16000,
    pricing: 'per API call',
    webhookSupport: true
  },
  finicity: {
    name: 'Finicity',
    regions: ['US', 'CA'],
    apiUrl: 'https://api.finicity.com',
    features: ['transactions', 'accounts', 'payroll'],
    supportedBanks: 10000,
    pricing: 'per API call',
    webhookSupport: true
  },

  // Europe
  tink: {
    name: 'Tink',
    regions: ['EU', 'UK', 'SE', 'NO', 'DK', 'FI'],
    apiUrl: 'https://api.tink.com',
    features: ['transactions', 'accounts', 'categorization', 'insights'],
    supportedBanks: 3400,
    pricing: 'per API call',
    webhookSupport: true
  },
  saltedge: {
    name: 'Salt Edge',
    regions: ['EU', 'UK', 'CA', 'AU'],
    apiUrl: 'https://www.saltedge.com/api/v5',
    features: ['transactions', 'accounts', 'categorization'],
    supportedBanks: 5000,
    pricing: 'per API call',
    webhookSupport: true
  },
  truelayer: {
    name: 'TrueLayer',
    regions: ['UK', 'EU'],
    apiUrl: 'https://api.truelayer.com',
    features: ['transactions', 'accounts', 'payments'],
    supportedBanks: 2000,
    pricing: 'per API call',
    webhookSupport: true
  },

  // Asia Pacific
  yodlee: {
    name: 'Yodlee',
    regions: ['US', 'IN', 'AU', 'SG'],
    apiUrl: 'https://api.yodlee.com',
    features: ['transactions', 'accounts', 'categorization'],
    supportedBanks: 15000,
    pricing: 'per API call',
    webhookSupport: true
  },
  upi: {
    name: 'UPI (India)',
    regions: ['IN'],
    apiUrl: 'https://api.upi.org',
    features: ['transactions', 'payments'],
    supportedBanks: 400,
    pricing: 'per transaction',
    webhookSupport: true
  },

  // Latin America
  belvo: {
    name: 'Belvo',
    regions: ['MX', 'BR', 'CO', 'AR', 'PE'],
    apiUrl: 'https://api.belvo.com',
    features: ['transactions', 'accounts', 'payments'],
    supportedBanks: 100,
    pricing: 'per API call',
    webhookSupport: true
  },

  // Southeast Asia
  xendit: {
    name: 'Xendit',
    regions: ['ID', 'PH', 'MY', 'SG', 'TH', 'VN'],
    apiUrl: 'https://api.xendit.co',
    features: ['transactions', 'payments', 'e-wallets'],
    supportedBanks: 200,
    pricing: 'per transaction',
    webhookSupport: true
  }
};

interface BankConnection {
  userId: string;
  provider: string;
  region: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  lastSync: string;
  isActive: boolean;
  bankName: string;
  accountId: string;
}

interface BankTransaction {
  transactionId: string;
  accountId: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  merchantName: string;
  merchantCategory: string;
  transactionType: 'purchase' | 'refund' | 'transfer' | 'other';
  location?: {
    city: string;
    state: string;
    country: string;
  };
}

interface PurchaseDetection {
  transactionId: string;
  productName: string;
  retailer: string;
  amount: number;
  currency: string;
  date: string;
  confidence: number;
  category: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const agentName = 'BankIntegrationAgent';

  try {
    logAgentActivity(agentName, 'Starting bank integration sync', {});

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

    // Process each user's bank connections
    for (const user of users) {
      try {
        logAgentActivity(agentName, 'Processing user bank connections', {
          userId: user.id,
          userEmail: user.email
        });

        // Get user's bank connections
        const connections = await getUserBankConnections(user.id);
        
        if (!connections || connections.length === 0) {
          logAgentActivity(agentName, 'No bank connections found for user', {
            userId: user.id
          });
          continue;
        }

        // Process each bank connection
        for (const connection of connections) {
          if (!connection.isActive) continue;

          try {
            const productsCreated = await syncBankTransactions(user.id, connection);
            totalProductsCreated += productsCreated;

            logAgentActivity(agentName, 'Completed bank sync', {
              userId: user.id,
              provider: connection.provider,
              bankName: connection.bankName,
              productsCreated
            });

          } catch (error) {
            logAgentActivity(agentName, 'Error syncing bank', {
              userId: user.id,
              provider: connection.provider,
              bankName: connection.bankName,
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

    logAgentActivity(agentName, 'Completed bank integration sync', {
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
        message: 'Bank integration sync completed',
        usersProcessed: totalUsersProcessed,
        productsCreated: totalProductsCreated
      })
    };

  } catch (error) {
    logAgentActivity(agentName, 'Fatal error in bank integration agent', {
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

async function getUserBankConnections(userId: string): Promise<BankConnection[]> {
  // TODO: Implement database query to get user's bank connections
  // For now, return mock data
  return [
    {
      userId,
      provider: 'plaid',
      region: 'US',
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      lastSync: new Date().toISOString(),
      isActive: true,
      bankName: 'Chase Bank',
      accountId: 'chase_checking_123'
    }
  ];
}

async function syncBankTransactions(userId: string, connection: BankConnection): Promise<number> {
  const agentName = 'BankIntegrationAgent';
  let productsCreated = 0;

  try {
    // Check if token needs refresh
    if (new Date(connection.expiresAt) <= new Date()) {
      await refreshBankToken(connection);
    }

    // Get transactions from bank API
    const transactions = await fetchBankTransactions(connection);
    
    if (!transactions || transactions.length === 0) {
      logAgentActivity(agentName, 'No new transactions found', {
        userId,
        provider: connection.provider,
        bankName: connection.bankName
      });
      return 0;
    }

    // Detect purchases from transactions
    const purchases = await detectPurchases(transactions);
    
    if (!purchases || purchases.length === 0) {
      logAgentActivity(agentName, 'No purchases detected in transactions', {
        userId,
        provider: connection.provider,
        transactionCount: transactions.length
      });
      return 0;
    }

    // Process each detected purchase
    for (const purchase of purchases) {
      try {
        // Check if transaction already exists (duplicate detection)
        const transactionExists = await checkTransactionExists(userId, purchase.transactionId);
        
        if (transactionExists) {
          logAgentActivity(agentName, 'Transaction already exists, skipping', {
            userId,
            transactionId: purchase.transactionId
          });
          continue;
        }

        const purchaseEvent: PurchaseEvent = {
          id: generateOrderNumber(),
          userId,
          productName: purchase.productName,
          productDescription: `Purchase from ${purchase.retailer}`,
          purchasePrice: purchase.amount,
          purchaseDate: purchase.date,
          retailer: purchase.retailer,
          orderNumber: purchase.transactionId,
          source: 'bank',
          rawData: {
            purchase,
            connection
          }
        };

        const productId = await createProductFromPurchaseEvent(purchaseEvent);
        
        if (productId) {
          productsCreated++;
          logAgentActivity(agentName, 'Created product from bank transaction', {
            productId,
            userId,
            productName: purchase.productName,
            retailer: purchase.retailer,
            transactionId: purchase.transactionId,
            confidence: purchase.confidence
          });
        }

      } catch (error) {
        logAgentActivity(agentName, 'Error creating product from purchase', {
          userId,
          transactionId: purchase.transactionId,
          productName: purchase.productName,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Update last sync time
    await updateLastSyncTime(connection);

  } catch (error) {
    logAgentActivity(agentName, 'Error syncing bank transactions', {
      userId,
      provider: connection.provider,
      bankName: connection.bankName,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }

  return productsCreated;
}

async function refreshBankToken(connection: BankConnection): Promise<void> {
  // TODO: Implement OAuth2 token refresh for each bank provider
  // This will vary by provider - Plaid, Tink, etc. have different flows
  
  const provider = BANK_PROVIDERS[connection.provider as keyof typeof BANK_PROVIDERS];
  if (!provider) {
    throw new Error(`Unknown bank provider: ${connection.provider}`);
  }

  // Mock implementation - in reality, this would make API calls to refresh tokens
  logAgentActivity('BankIntegrationAgent', 'Refreshing bank token', {
    provider: connection.provider,
    bankName: connection.bankName,
    userId: connection.userId
  });

  // Update connection with new token
  connection.accessToken = 'new_mock_access_token';
  connection.expiresAt = new Date(Date.now() + 3600000).toISOString();
}

async function fetchBankTransactions(connection: BankConnection): Promise<BankTransaction[]> {
  // TODO: Implement actual API calls to each bank provider
  // This will vary significantly by provider - each has different APIs
  
  const provider = BANK_PROVIDERS[connection.provider as keyof typeof BANK_PROVIDERS];
  if (!provider) {
    throw new Error(`Unknown bank provider: ${connection.provider}`);
  }

  // Mock implementation - simulate API response
  return [
    {
      transactionId: `TXN-${Date.now()}`,
      accountId: connection.accountId,
      amount: 299.99,
      currency: 'USD',
      date: new Date().toISOString(),
      description: 'AMAZON.COM AMZN.COM/BILL WA',
      merchantName: 'Amazon.com',
      merchantCategory: 'Online Shopping',
      transactionType: 'purchase',
      location: {
        city: 'Seattle',
        state: 'WA',
        country: 'US'
      }
    },
    {
      transactionId: `TXN-${Date.now() + 1}`,
      accountId: connection.accountId,
      amount: 1299.99,
      currency: 'USD',
      date: new Date().toISOString(),
      description: 'APPLE.COM/BILL',
      merchantName: 'Apple Inc',
      merchantCategory: 'Electronics',
      transactionType: 'purchase',
      location: {
        city: 'Cupertino',
        state: 'CA',
        country: 'US'
      }
    }
  ];
}

async function detectPurchases(transactions: BankTransaction[]): Promise<PurchaseDetection[]> {
  const purchases: PurchaseDetection[] = [];

  // AI-powered purchase detection logic
  for (const transaction of transactions) {
    if (transaction.transactionType !== 'purchase') continue;

    // Skip small amounts (likely not products)
    if (transaction.amount < 10) continue;

    // Skip known non-product categories
    const nonProductCategories = [
      'Restaurants', 'Food & Drink', 'Transportation', 'Utilities',
      'Healthcare', 'Insurance', 'Entertainment', 'Travel'
    ];
    
    if (nonProductCategories.some(cat => 
      transaction.merchantCategory.toLowerCase().includes(cat.toLowerCase())
    )) {
      continue;
    }

    // Detect product purchases based on merchant and amount
    const purchase = await analyzeTransactionForPurchase(transaction);
    
    if (purchase) {
      purchases.push(purchase);
    }
  }

  return purchases;
}

async function analyzeTransactionForPurchase(transaction: BankTransaction): Promise<PurchaseDetection | null> {
  // AI-powered analysis to determine if transaction is a product purchase
  // This would use machine learning models trained on transaction data
  
  const productKeywords = [
    'amazon', 'apple', 'best buy', 'target', 'walmart', 'home depot',
    'lowes', 'costco', 'samsung', 'sony', 'lg', 'dell', 'hp', 'lenovo'
  ];

  const merchantName = transaction.merchantName.toLowerCase();
  const description = transaction.description.toLowerCase();

  // Check if merchant is known for selling products
  const isProductMerchant = productKeywords.some(keyword => 
    merchantName.includes(keyword) || description.includes(keyword)
  );

  if (!isProductMerchant) {
    return null;
  }

  // Determine product name and retailer
  let productName = 'Unknown Product';
  let retailer = transaction.merchantName;
  let confidence = 0.7; // Base confidence

  // Extract product information from transaction description
  if (description.includes('amazon')) {
    retailer = 'Amazon';
    confidence = 0.9;
    // Try to extract product name from description
    const productMatch = description.match(/amazon\.com\s+(.+)/i);
    if (productMatch) {
      productName = productMatch[1].replace(/\s+wa$/, '').trim();
    }
  } else if (description.includes('apple')) {
    retailer = 'Apple';
    confidence = 0.9;
    productName = 'Apple Product';
  } else if (description.includes('best buy')) {
    retailer = 'Best Buy';
    confidence = 0.8;
    productName = 'Electronics Product';
  }

  // Adjust confidence based on amount (higher amounts = more likely to be products)
  if (transaction.amount > 500) {
    confidence += 0.1;
  }

  return {
    transactionId: transaction.transactionId,
    productName,
    retailer,
    amount: transaction.amount,
    currency: transaction.currency,
    date: transaction.date,
    confidence: Math.min(confidence, 1.0),
    category: transaction.merchantCategory
  };
}

async function checkTransactionExists(userId: string, transactionId: string): Promise<boolean> {
  // TODO: Implement database check for existing transaction
  // This prevents duplicate products from the same bank transaction
  
  // Mock implementation
  return false;
}

async function updateLastSyncTime(connection: BankConnection): Promise<void> {
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
      payment_method: 'bank_transfer',
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
