// ==============================================================================
// COMPREHENSIVE WARRANTY DATABASE TYPES
// ==============================================================================

export interface WarrantyDatabaseEntry {
  id: string;
  brand: string;
  model: string;
  category: string;
  release_date: string;
  warranty_terms: {
    manufacturer: {
      duration: number; // months
      coverage: string[];
      exclusions: string[];
      requirements: string[];
      limitations: string[];
    };
    extended_options: {
      provider: string;
      duration: number;
      cost: number;
      coverage: string[];
      exclusions: string[];
    }[];
  };
  common_issues: {
    issue: string;
    frequency: number; // percentage
    average_repair_cost: number;
    covered_by_warranty: boolean;
    component: string;
  }[];
  reliability_score: number; // 0-1
  user_ratings: number; // 0-5
  data_quality: {
    source: 'manufacturer' | 'retailer' | 'user' | 'ai_generated';
    confidence_score: number; // 0-1
    last_verified: string;
    verification_method: string;
    data_points: number;
  };
  market_data: {
    msrp: number;
    current_price: number;
    depreciation_rate: number;
    resale_value: number;
  };
}

export interface WarrantySearchRequest {
  brand?: string;
  model?: string;
  category?: string;
  min_confidence?: number;
  include_extended?: boolean;
}

export interface WarrantySearchResponse {
  success: boolean;
  results: WarrantyDatabaseEntry[];
  total_count: number;
  search_time: number;
  confidence_threshold: number;
}

export interface WarrantyDatabaseStats {
  total_products: number;
  brands_covered: number;
  categories_covered: number;
  average_confidence: number;
  last_updated: string;
  data_sources: {
    manufacturer: number;
    retailer: number;
    user: number;
    ai_generated: number;
  };
} 