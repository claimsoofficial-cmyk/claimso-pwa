import axios, { AxiosInstance } from 'axios';

// Amazon SP-API Client for real order data
export class AmazonAPIClient {
  private client: AxiosInstance;
  private accessToken: string;
  private region: string;

  constructor(accessToken: string, region: string = 'us-east-1') {
    this.accessToken = accessToken;
    this.region = region;
    
    this.client = axios.create({
      baseURL: 'https://sellingpartner-api.amazon.com',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Claimso-Amazon-Integration/1.0'
      }
    });
  }

  // Get orders from Amazon SP-API
  async getOrders(params: {
    marketplaceIds: string[];
    createdAfter?: Date;
    createdBefore?: Date;
    maxResults?: number;
  }): Promise<AmazonOrder[]> {
    try {
      const response = await this.client.get('/orders/v0/orders', {
        params: {
          MarketplaceIds: params.marketplaceIds.join(','),
          CreatedAfter: params.createdAfter?.toISOString(),
          CreatedBefore: params.createdBefore?.toISOString(),
          MaxResults: params.maxResults || 50,
          OrderStatuses: 'Shipped,Delivered,PartiallyShipped'
        }
      });

      return response.data.Orders || [];
    } catch (error) {
      console.error('Amazon API getOrders error:', error);
      throw new Error(`Failed to fetch Amazon orders: ${error}`);
    }
  }

  // Get order items for a specific order
  async getOrderItems(orderId: string): Promise<AmazonOrderItem[]> {
    try {
      const response = await this.client.get(`/orders/v0/orders/${orderId}/orderItems`);
      return response.data.OrderItems || [];
    } catch (error) {
      console.error('Amazon API getOrderItems error:', error);
      throw new Error(`Failed to fetch order items for ${orderId}: ${error}`);
    }
  }

  // Get product details
  async getProductDetails(asin: string): Promise<AmazonProduct> {
    try {
      const response = await this.client.get(`/catalog/v0/items/${asin}`, {
        params: {
          includedData: 'attributes,images,summaries'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Amazon API getProductDetails error:', error);
      throw new Error(`Failed to fetch product details for ${asin}: ${error}`);
    }
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      const response = await axios.post('https://api.amazon.com/auth/o2/token', {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.AMAZON_CLIENT_ID,
        client_secret: process.env.AMAZON_CLIENT_SECRET
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      console.error('Amazon API refreshToken error:', error);
      throw new Error(`Failed to refresh Amazon token: ${error}`);
    }
  }
}

// TypeScript interfaces for Amazon API responses
export interface AmazonOrder {
  AmazonOrderId: string;
  SellerOrderId?: string;
  PurchaseDate: string;
  LastUpdateDate: string;
  OrderStatus: string;
  FulfillmentChannel: string;
  SalesChannel: string;
  OrderChannel: string;
  ShipServiceLevel: string;
  OrderTotal?: {
    CurrencyCode: string;
    Amount: string;
  };
  NumberOfItemsShipped: number;
  NumberOfItemsUnshipped: number;
  PaymentMethod: string;
  MarketplaceId: string;
  ShipmentServiceLevelCategory: string;
  OrderType: string;
  EarliestShipDate: string;
  LatestShipDate: string;
  EarliestDeliveryDate: string;
  LatestDeliveryDate: string;
  IsBusinessOrder: boolean;
  IsPrime: boolean;
  IsGlobalExpressEnabled: boolean;
  IsReplacementOrder: boolean;
  IsAccessPointOrder: boolean;
}

export interface AmazonOrderItem {
  ASIN: string;
  SellerSKU: string;
  OrderItemId: string;
  Title: string;
  QuantityOrdered: number;
  QuantityShipped: number;
  ProductInfo?: {
    NumberOfItems: number;
  };
  PointsGranted?: {
    PointsNumber: number;
    PointsMonetaryValue: {
      CurrencyCode: string;
      Amount: number;
    };
  };
  ItemPrice?: {
    CurrencyCode: string;
    Amount: number;
  };
  ShippingPrice?: {
    CurrencyCode: string;
    Amount: number;
  };
  ItemTax?: {
    CurrencyCode: string;
    Amount: number;
  };
  ShippingTax?: {
    CurrencyCode: string;
    Amount: number;
  };
  ShippingDiscount?: {
    CurrencyCode: string;
    Amount: number;
  };
  ShippingDiscountTax?: {
    CurrencyCode: string;
    Amount: number;
  };
  PromotionDiscount?: {
    CurrencyCode: string;
    Amount: number;
  };
  PromotionDiscountTax?: {
    CurrencyCode: string;
    Amount: number;
  };
  PromotionIds?: string[];
  CODFee?: {
    CurrencyCode: string;
    Amount: number;
  };
  CODFeeDiscount?: {
    CurrencyCode: string;
    Amount: number;
  };
  IsGift: boolean;
  ConditionNote?: string;
  ConditionId?: string;
  ConditionSubtypeId?: string;
  ScheduledDeliveryStartDate?: string;
  ScheduledDeliveryEndDate?: string;
  PriceDesignation?: string;
  TaxCollection?: {
    Model: string;
    ResponsibleParty: string;
  };
  SerialNumberRequired: boolean;
  IsTransparency: boolean;
}

export interface AmazonProduct {
  asin: string;
  attributes?: {
    brand?: string;
    color?: string;
    size?: string;
    title?: string;
    description?: string;
  };
  images?: Array<{
    link: string;
    height: number;
    width: number;
  }>;
  summaries?: Array<{
    marketplaceId: string;
    brandName?: string;
    browseNode?: string;
    colorName?: string;
    itemName?: string;
    manufacturer?: string;
    sizeName?: string;
  }>;
}

// Utility functions for Amazon data processing
export function mapAmazonOrderToRetailerOrder(amazonOrder: AmazonOrder, items: AmazonOrderItem[]): RetailerOrder {
  return {
    orderId: amazonOrder.AmazonOrderId,
    orderDate: amazonOrder.PurchaseDate,
    totalAmount: parseFloat(amazonOrder.OrderTotal?.Amount || '0'),
    currency: amazonOrder.OrderTotal?.CurrencyCode || 'USD',
    status: amazonOrder.OrderStatus.toLowerCase(),
    items: items.map(item => ({
      productId: item.ASIN,
      productName: item.Title,
      brand: extractBrandFromTitle(item.Title),
      model: extractModelFromTitle(item.Title),
      category: 'Electronics', // Will be enriched by Product Intelligence Agent
      price: parseFloat(item.ItemPrice?.Amount?.toString() || '0'),
      quantity: item.QuantityOrdered,
      serialNumber: item.SellerSKU
    }))
  };
}

function extractBrandFromTitle(title: string): string {
  const brands = [
    'Sony', 'Samsung', 'Apple', 'LG', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Microsoft',
    'Nike', 'Adidas', 'Under Armour', 'Puma', 'Reebok', 'New Balance',
    'KitchenAid', 'Cuisinart', 'Ninja', 'Instant Pot', 'Breville',
    'Dyson', 'Shark', 'Bissell', 'Hoover', 'Eureka'
  ];
  
  for (const brand of brands) {
    if (title.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return 'Unknown';
}

function extractModelFromTitle(title: string): string {
  // Extract model numbers or names
  const modelPatterns = [
    /[A-Z]{2,3}-\d{4}/, // WH-1000XM4
    /[A-Z]{2,3}\d{4}/,  // WH1000XM4
    /[A-Z]{2,3}\s\d{4}/, // WH 1000XM4
    /iPhone\s\d{1,2}/,   // iPhone 15
    /iPad\s[A-Za-z]+/,   // iPad Pro
    /MacBook\s[A-Za-z]+/, // MacBook Pro
    /Galaxy\s[A-Za-z]+/, // Galaxy S23
  ];
  
  for (const pattern of modelPatterns) {
    const match = title.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return 'Unknown';
}

// Re-export types for use in other modules
export interface RetailerOrder {
  orderId: string;
  orderDate: string;
  totalAmount: number;
  currency: string;
  status: string;
  items: RetailerOrderItem[];
}

export interface RetailerOrderItem {
  productId: string;
  productName: string;
  brand: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  serialNumber: string;
}
