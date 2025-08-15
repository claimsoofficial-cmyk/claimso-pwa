import { v4 as uuidv4 } from 'uuid';

export interface PurchaseEvent {
  id: string;
  userId: string;
  productName: string;
  productDescription: string;
  purchasePrice: number;
  purchaseDate: string;
  retailer: string;
  orderNumber: string;
  receiptImageUrl?: string;
  source: 'email' | 'browser' | 'mobile' | 'bank' | 'retailer_api' | 'manual' | 'unknown';
  rawData?: any;
}

export function generateId(): string {
  return uuidv4();
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export function parseEmailContent(emailContent: string): any {
  // Enhanced email parsing logic
  const purchaseKeywords = [
    'order confirmation',
    'purchase confirmation',
    'thank you for your order',
    'your order has been placed',
    'order details',
    'your amazon order',
    'order #',
    'order number'
  ];

  const hasPurchaseKeywords = purchaseKeywords.some(keyword => 
    emailContent.toLowerCase().includes(keyword.toLowerCase())
  );

  if (!hasPurchaseKeywords) {
    return null;
  }

  // Extract order number
  const orderNumberMatch = emailContent.match(/order #([A-Z0-9-]+)/i) || 
                          emailContent.match(/order number:?\s*([A-Z0-9-]+)/i) ||
                          emailContent.match(/order:?\s*([A-Z0-9-]+)/i);
  
  // Extract price - look for multiple price patterns
  const priceMatches = emailContent.match(/\$[\d,]+\.?\d*/g);
  const totalPrice = priceMatches ? 
    Math.max(...priceMatches.map(p => parseFloat(p.replace('$', '').replace(',', '')))) : null;
  
  // Extract date - multiple date formats
  const dateMatch = emailContent.match(/(\d{1,2}\/\d{1,2}\/\d{4})|(\d{4}-\d{2}-\d{2})|(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i);
  
  // Extract product name from subject or content
  const productMatch = emailContent.match(/(iphone|samsung|apple|airpods|tv|macbook|ipad|watch)/i);
  
  console.log('Email parsing results:', {
    hasPurchaseKeywords,
    orderNumber: orderNumberMatch ? orderNumberMatch[1] : null,
    totalPrice,
    date: dateMatch ? dateMatch[0] : null,
    productHint: productMatch ? productMatch[1] : null
  });
  
  return {
    isPurchase: true,
    orderNumber: orderNumberMatch ? orderNumberMatch[1] : null,
    price: totalPrice,
    date: dateMatch ? dateMatch[0] : null,
    productHint: productMatch ? productMatch[1] : null,
    rawContent: emailContent
  };
}

export function calculateMarketValue(originalPrice: number, purchaseDate: string, category: string): number {
  // Basic depreciation calculation
  // This will be enhanced with real market data later
  
  const purchaseTime = new Date(purchaseDate).getTime();
  const currentTime = Date.now();
  const monthsSincePurchase = (currentTime - purchaseTime) / (1000 * 60 * 60 * 24 * 30);
  
  // Simple depreciation model
  const depreciationRate = 0.02; // 2% per month
  const depreciatedValue = originalPrice * Math.pow(1 - depreciationRate, monthsSincePurchase);
  
  return Math.max(depreciatedValue, originalPrice * 0.1); // Minimum 10% of original value
}

export function logAgentActivity(agentName: string, action: string, details: any): void {
  console.log(`[${new Date().toISOString()}] [${agentName}] ${action}:`, details);
}
