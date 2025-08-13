// ==============================================================================
// COMPREHENSIVE DATA ANALYTICS TYPES
// ==============================================================================

// A. Consumer Behavior Intelligence
export interface ConsumerBehaviorData {
  user_segment: string;
  brand_preferences: {
    brand_ranking: Record<string, number>;
    loyalty_score: number;
    switching_frequency: number;
    price_sensitivity: number;
  };
  upgrade_behavior: {
    product_category: string;
    average_upgrade_cycle: number;
    upgrade_triggers: string[];
    price_sensitivity: number;
    brand_loyalty_impact: number;
  };
  warranty_insights: {
    purchase_rate: number;
    claim_frequency: number;
    satisfaction_score: number;
    renewal_rate: number;
    average_warranty_value: number;
  };
  purchase_patterns: {
    seasonal_trends: Record<string, number>;
    category_preferences: Record<string, number>;
    price_ranges: Record<string, number>;
    retailer_preferences: Record<string, number>;
  };
}

// B. Product Performance Analytics
export interface ProductPerformanceData {
  product_model: string;
  brand: string;
  category: string;
  failure_rates: {
    overall_rate: number;
    time_to_failure: number;
    common_failures: string[];
    repair_costs: number;
    failure_by_component: Record<string, number>;
  };
  market_analysis: {
    competitor_coverage: Record<string, WarrantyTerms>;
    pricing_analysis: Record<string, number>;
    feature_gaps: string[];
    market_share: Record<string, number>;
    customer_satisfaction: number;
  };
  sentiment_analysis: {
    product_satisfaction: number;
    warranty_satisfaction: number;
    repair_experience: number;
    recommendation_score: number;
    sentiment_trends: Record<string, number>;
  };
  reliability_metrics: {
    reliability_score: number;
    durability_rating: number;
    quality_consistency: number;
    defect_rate: number;
  };
}

// C. Financial Intelligence
export interface FinancialIntelligenceData {
  depreciation_analysis: {
    product_category: string;
    depreciation_rate: number;
    resale_value: number;
    warranty_impact: number;
    market_volatility: number;
  };
  cost_analysis: {
    total_cost_of_ownership: number;
    repair_vs_replace: number;
    warranty_roi: number;
    insurance_benefits: number;
    maintenance_costs: number;
  };
  market_trends: {
    price_fluctuations: number[];
    demand_patterns: string[];
    seasonal_variations: number[];
    economic_impact: number;
    supply_chain_effects: number;
  };
  investment_insights: {
    product_appreciation: number;
    collectible_potential: number;
    market_demand: number;
    future_value_prediction: number;
  };
}

// API Response Types
export interface AnalyticsResponse {
  success: boolean;
  data: ConsumerBehaviorData | ProductPerformanceData | FinancialIntelligenceData;
  metadata: {
    data_points: number;
    confidence_score: number;
    last_updated: string;
    source: string;
  };
}

export interface WarrantyTerms {
  duration: number;
  coverage: string[];
  exclusions: string[];
  requirements: string[];
  limitations: string[];
}

// API Pricing Tiers
export interface ApiPricingTier {
  tier: 'basic' | 'advanced' | 'enterprise';
  price: number;
  rate_limit: string;
  features: string[];
  data_access: string[];
} 