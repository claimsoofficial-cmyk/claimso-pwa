import { QuickCashPartner, CashQuote, QuoteRequest, QuoteResponse } from '@/lib/types/partners';

// ==============================================================================
// QUICK CASH PARTNER NETWORK SERVICE
// ==============================================================================

// Partner database - in production, this would be in Supabase
export const QUICK_CASH_PARTNERS: QuickCashPartner[] = [
  {
    id: 'gazelle',
    name: 'Gazelle',
    logo: '/logos/gazelle.svg',
    website: 'https://www.gazelle.com',
    categories: ['phones', 'tablets', 'laptops', 'electronics'],
    instant_quote: true,
    pickup_service: true,
    payment_speed: '24h',
    commission_rate: 0.10,
    user_rating: 4.5,
    min_value: 5,
    max_value: 1000,
    supported_conditions: ['excellent', 'good', 'fair']
  },
  {
    id: 'decluttr',
    name: 'Decluttr',
    logo: '/logos/decluttr.svg',
    website: 'https://www.decluttr.com',
    categories: ['phones', 'tablets', 'laptops', 'games', 'books'],
    instant_quote: true,
    pickup_service: false,
    payment_speed: '3-5days',
    commission_rate: 0.08,
    user_rating: 4.3,
    min_value: 1,
    max_value: 500,
    supported_conditions: ['excellent', 'good', 'fair', 'poor']
  },
  {
    id: 'swappa',
    name: 'Swappa',
    logo: '/logos/swappa.svg',
    website: 'https://www.swappa.com',
    categories: ['phones', 'tablets', 'laptops', 'electronics'],
    instant_quote: false,
    pickup_service: false,
    payment_speed: 'instant',
    commission_rate: 0.03,
    user_rating: 4.7,
    min_value: 10,
    max_value: 2000,
    supported_conditions: ['excellent', 'good']
  },
  {
    id: 'amazon_trade_in',
    name: 'Amazon Trade-In',
    logo: '/logos/amazon.svg',
    website: 'https://www.amazon.com/tradein',
    categories: ['phones', 'tablets', 'laptops', 'books', 'games'],
    instant_quote: true,
    pickup_service: false,
    payment_speed: 'instant',
    commission_rate: 0.05,
    user_rating: 4.6,
    min_value: 5,
    max_value: 1500,
    supported_conditions: ['excellent', 'good', 'fair']
  },
  {
    id: 'best_buy_trade_in',
    name: 'Best Buy Trade-In',
    logo: '/logos/bestbuy.svg',
    website: 'https://www.bestbuy.com/tradein',
    categories: ['phones', 'tablets', 'laptops', 'electronics'],
    instant_quote: true,
    pickup_service: true,
    payment_speed: 'instant',
    commission_rate: 0.07,
    user_rating: 4.4,
    min_value: 10,
    max_value: 1000,
    supported_conditions: ['excellent', 'good', 'fair']
  }
];

/**
 * Get instant cash quotes for a product
 */
export async function getInstantQuotes(request: QuoteRequest): Promise<QuoteResponse> {
  const startTime = Date.now();
  const quotes: CashQuote[] = [];
  
  try {
    // Filter partners that support this product category
    const eligiblePartners = QUICK_CASH_PARTNERS.filter(partner => 
      partner.categories.includes(request.category.toLowerCase()) &&
      partner.supported_conditions.includes(request.condition)
    );

    // Generate quotes for each eligible partner
    for (const partner of eligiblePartners) {
      const quote = await generatePartnerQuote(request, partner);
      if (quote) {
        quotes.push(quote);
      }
    }

    // Sort quotes by amount (highest first)
    quotes.sort((a, b) => b.amount - a.amount);

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      quotes,
      best_offer: quotes[0] || null,
      total_partners_checked: eligiblePartners.length,
      processing_time: processingTime
    };

  } catch (error) {
    console.error('Error getting instant quotes:', error);
    return {
      success: false,
      quotes: [],
      best_offer: undefined,
      total_partners_checked: 0,
      processing_time: Date.now() - startTime
    };
  }
}

/**
 * Generate a quote for a specific partner
 */
async function generatePartnerQuote(request: QuoteRequest, partner: QuickCashPartner): Promise<CashQuote | null> {
  try {
    // Calculate base value based on product and condition
    const baseValue = calculateBaseValue(request);
    
    // Apply partner-specific adjustments
    const adjustedValue = applyPartnerAdjustments(baseValue, partner, request);
    
    // Check if value is within partner's range
    if (adjustedValue < partner.min_value || adjustedValue > partner.max_value) {
      return null;
    }

    // Generate quote
    const quote: CashQuote = {
      partner_id: partner.id,
      partner_name: partner.name,
      partner_logo: partner.logo,
      amount: Math.round(adjustedValue * 100) / 100, // Round to 2 decimal places
      currency: 'USD',
      condition: request.condition,
      payment_speed: partner.payment_speed,
      pickup_available: partner.pickup_service,
      terms: generateTerms(partner, request),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    return quote;

  } catch (error) {
    console.error(`Error generating quote for ${partner.name}:`, error);
    return null;
  }
}

/**
 * Calculate base value for a product
 */
function calculateBaseValue(request: QuoteRequest): number {
  const ageInMonths = getAgeInMonths(request.purchase_date);
  const conditionMultiplier = getConditionMultiplier(request.condition);
  const categoryMultiplier = getCategoryMultiplier(request.category);
  
  // Base depreciation: 15% per year
  const depreciationRate = 0.15;
  const depreciationFactor = Math.pow(1 - depreciationRate, ageInMonths / 12);
  
  return request.purchase_price * depreciationFactor * conditionMultiplier * categoryMultiplier;
}

/**
 * Apply partner-specific adjustments
 */
function applyPartnerAdjustments(baseValue: number, partner: QuickCashPartner, request: QuoteRequest): number {
  let adjustedValue = baseValue;
  
  // Partner-specific adjustments
  switch (partner.id) {
    case 'gazelle':
      // Gazelle typically offers 60-80% of market value
      adjustedValue *= 0.7;
      break;
    case 'decluttr':
      // Decluttr offers lower prices but accepts more conditions
      adjustedValue *= 0.6;
      break;
    case 'swappa':
      // Swappa is peer-to-peer, so higher values
      adjustedValue *= 0.85;
      break;
    case 'amazon_trade_in':
      // Amazon offers competitive prices
      adjustedValue *= 0.75;
      break;
    case 'best_buy_trade_in':
      // Best Buy offers store credit, so slightly lower
      adjustedValue *= 0.65;
      break;
  }
  
  return adjustedValue;
}

/**
 * Get age of product in months
 */
function getAgeInMonths(purchaseDate: string): number {
  const purchase = new Date(purchaseDate);
  const now = new Date();
  return (now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 30);
}

/**
 * Get condition multiplier
 */
function getConditionMultiplier(condition: string): number {
  switch (condition) {
    case 'excellent': return 1.0;
    case 'good': return 0.8;
    case 'fair': return 0.6;
    case 'poor': return 0.3;
    default: return 0.7;
  }
}

/**
 * Get category multiplier
 */
function getCategoryMultiplier(category: string): number {
  switch (category.toLowerCase()) {
    case 'phones': return 1.0;
    case 'tablets': return 0.9;
    case 'laptops': return 0.8;
    case 'electronics': return 0.7;
    case 'games': return 0.6;
    case 'books': return 0.3;
    default: return 0.7;
  }
}

/**
 * Generate terms for the quote
 */
function generateTerms(partner: QuickCashPartner, request: QuoteRequest): string {
  const terms = [];
  
  if (partner.pickup_service) {
    terms.push('Free pickup available');
  } else {
    terms.push('Shipping label provided');
  }
  
  terms.push(`Payment within ${partner.payment_speed}`);
  terms.push('Condition verification required');
  terms.push('Offer valid for 24 hours');
  
  return terms.join('. ');
}

/**
 * Get partner by ID
 */
export function getPartnerById(partnerId: string): QuickCashPartner | null {
  return QUICK_CASH_PARTNERS.find(partner => partner.id === partnerId) || null;
}

/**
 * Get all partners
 */
export function getAllPartners(): QuickCashPartner[] {
  return QUICK_CASH_PARTNERS;
} 