// ==============================================================================
// QUICK CASH PARTNER NETWORK TYPES
// ==============================================================================

export interface QuickCashPartner {
  id: string;
  name: string;
  logo: string;
  website: string;
  categories: string[];
  instant_quote: boolean;
  pickup_service: boolean;
  payment_speed: 'instant' | '24h' | '3-5days';
  commission_rate: number;
  user_rating: number;
  min_value: number;
  max_value: number;
  supported_conditions: ('excellent' | 'good' | 'fair' | 'poor')[];
  api_endpoint?: string;
  api_key?: string;
}

export interface CashQuote {
  partner_id: string;
  partner_name: string;
  partner_logo: string;
  amount: number;
  currency: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  payment_speed: 'instant' | '24h' | '3-5days';
  pickup_available: boolean;
  shipping_label?: string;
  terms: string;
  expires_at: string;
}

export interface QuoteRequest {
  product_id: string;
  product_name: string;
  brand: string;
  category: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  purchase_price: number;
  purchase_date: string;
  serial_number?: string;
  user_id: string;
}

export interface QuoteResponse {
  success: boolean;
  quotes: CashQuote[];
  best_offer: CashQuote | undefined;
  total_partners_checked: number;
  processing_time: number;
} 