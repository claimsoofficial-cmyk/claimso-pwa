// ==============================================================================
// CENTRALIZED TYPE DEFINITIONS
// ==============================================================================

export interface Product {
  id: string;
  product_name: string;
  brand: string | null;
  category: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  currency: string;
  serial_number: string | null;
  condition: 'new' | 'used' | 'refurbished' | 'damaged';
  notes: string | null;
  created_at: string;
  updated_at?: string;
  user_id: string;
  is_archived: boolean;
  warranties?: Warranty[];
  documents?: Document[];
  // New fields for enhanced functionality
  payment_method?: 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'paypal' | 'apple_pay' | 'google_pay' | 'amazon_pay' | 'other';
  purchase_location?: string | null;
  retailer_url?: string | null;
  affiliate_id?: string | null;
  source?: string | null;
  capture_method?: string | null;
  maintenance_records?: MaintenanceRecord[];
}

export interface Warranty {
  id: string;
  warranty_start_date: string | null;
  warranty_end_date: string | null;
  warranty_duration_months: number | null;
  warranty_type: 'manufacturer' | 'extended' | 'store' | 'insurance';
  coverage_details: string | null;
  claim_process: string | null;
  contact_info: string | null;
  snapshot_data: {
    covers?: string[];
    does_not_cover?: string[];
    key_terms?: string[];
    claim_requirements?: string[];
  };
  ai_confidence_score: number | null;
  last_analyzed_at: string | null;
  data_source?: string;
}

export interface Document {
  id: string;
  file_name: string;
  file_url: string;
  document_type: 'receipt' | 'warranty_pdf' | 'manual' | 'insurance' | 'photo' | 'other';
  is_primary: boolean;
  created_at: string;
}

export interface UserConnection {
  retailer: string;
  status: string;
  last_synced_at?: string;
  user_id: string;
}

export interface AnalyticsData {
  totalProducts: number;
  totalValue: number;
  activeWarranties: number;
  expiringWarranties: number;
  connectedRetailers: number;
  categoryBreakdown: Record<string, number>;
  brandBreakdown: Record<string, number>;
  monthlyTrends: Array<{
    month: string;
    products: number;
    value: number;
  }>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MaintenanceRecord {
  id: string;
  product_id: string;
  service_date: string;
  service_type: 'routine' | 'repair' | 'upgrade' | 'cleaning' | 'inspection';
  provider_name: string;
  provider_contact?: string;
  cost: number;
  currency: string;
  description: string;
  next_service_date?: string;
  created_at: string;
  updated_at?: string;
}
