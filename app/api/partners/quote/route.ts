import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface QuoteRequest {
  product_id: string;
  product_name: string;
  category: string;
  brand: string;
  condition: string;
  purchase_price: number;
  purchase_date: string;
}

interface PartnerQuote {
  id: string;
  partner_name: string;
  partner_logo: string;
  amount: number;
  currency: string;
  payment_speed: string;
  terms: string;
  rating: number;
  is_instant: boolean;
  is_best_offer: boolean;
  affiliate_url: string;
  commission_rate: number;
}

interface QuickCashResponse {
  product_id: string;
  product_name: string;
  estimated_value: number;
  quotes: PartnerQuote[];
  total_partners_checked: number;
  best_offer: PartnerQuote;
  processing_time_ms: number;
}

// Mock partner data - in production, this would come from real partner APIs
const PARTNERS = [
  {
    name: 'Gazelle',
    logo: '/logos/gazelle.svg',
    rating: 4.5,
    commission_rate: 8.5,
    affiliate_url: 'https://www.gazelle.com/trade-in',
    instant_payment: true,
  },
  {
    name: 'Decluttr',
    logo: '/logos/decluttr.svg',
    rating: 4.2,
    commission_rate: 7.5,
    affiliate_url: 'https://www.decluttr.com/sell',
    instant_payment: false,
  },
  {
    name: 'Amazon Trade-In',
    logo: '/logos/amazon.svg',
    rating: 4.7,
    commission_rate: 6.0,
    affiliate_url: 'https://www.amazon.com/trade-in',
    instant_payment: false,
  },
  {
    name: 'Best Buy Trade-In',
    logo: '/logos/bestbuy.svg',
    rating: 4.3,
    commission_rate: 7.0,
    affiliate_url: 'https://www.bestbuy.com/trade-in',
    instant_payment: false,
  },
  {
    name: 'Swappa',
    logo: '/logos/swappa.svg',
    rating: 4.6,
    commission_rate: 5.0,
    affiliate_url: 'https://swappa.com/sell',
    instant_payment: false,
  },
];

// Calculate quote based on product details
function calculateQuote(
  partner: typeof PARTNERS[0],
  product: QuoteRequest
): PartnerQuote {
  const baseValue = product.purchase_price || 0;
  const ageInMonths = Math.max(0, (Date.now() - new Date(product.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 30));
  
  // Depreciation factors
  let depreciationRate = 0.15; // 15% per year
  if (product.category.toLowerCase().includes('phone')) {
    depreciationRate = 0.25; // Phones depreciate faster
  } else if (product.category.toLowerCase().includes('laptop')) {
    depreciationRate = 0.20; // Laptops depreciate moderately
  }
  
  // Condition adjustment
  let conditionMultiplier = 1.0;
  if (product.condition === 'excellent') conditionMultiplier = 0.95;
  else if (product.condition === 'good') conditionMultiplier = 0.85;
  else if (product.condition === 'fair') conditionMultiplier = 0.70;
  else if (product.condition === 'poor') conditionMultiplier = 0.50;
  
  // Partner-specific adjustments
  let partnerMultiplier = 1.0;
  if (partner.name === 'Gazelle') partnerMultiplier = 0.85; // Gazelle offers lower but instant
  else if (partner.name === 'Amazon Trade-In') partnerMultiplier = 0.75; // Amazon offers lower but gift card
  else if (partner.name === 'Swappa') partnerMultiplier = 0.90; // Swappa offers higher but takes time
  
  // Calculate final quote
  const depreciatedValue = baseValue * Math.pow(1 - depreciationRate, ageInMonths / 12);
  const conditionAdjustedValue = depreciatedValue * conditionMultiplier;
  const finalQuote = Math.round(conditionAdjustedValue * partnerMultiplier);
  
  // Ensure minimum quote
  const minQuote = Math.max(10, finalQuote);
  
  return {
    id: `${partner.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    partner_name: partner.name,
    partner_logo: partner.logo,
    amount: minQuote,
    currency: 'USD',
    payment_speed: partner.instant_payment ? 'Instant Payment' : '2-3 business days',
    terms: partner.instant_payment 
      ? 'Get paid instantly via direct deposit'
      : partner.name === 'Amazon Trade-In'
      ? 'Receive Amazon gift card within 2-3 days'
      : 'Payment processed after device inspection',
    rating: partner.rating,
    is_instant: partner.instant_payment,
    is_best_offer: false, // Will be set later
    affiliate_url: partner.affiliate_url,
    commission_rate: partner.commission_rate,
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: QuoteRequest = await request.json();
    
    if (!body.product_id || !body.product_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate quotes from all partners
    const quotes: PartnerQuote[] = PARTNERS.map(partner => 
      calculateQuote(partner, body)
    );

    // Sort by amount (highest first) and mark best offer
    quotes.sort((a, b) => b.amount - a.amount);
    if (quotes.length > 0) {
      quotes[0].is_best_offer = true;
    }

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Log the quote request for analytics
    await supabase.from('quote_requests').insert({
      user_id: user.id,
      product_id: body.product_id,
      product_name: body.product_name,
      category: body.category,
      brand: body.brand,
      condition: body.condition,
      purchase_price: body.purchase_price,
      quotes_generated: quotes.length,
      best_quote_amount: quotes[0]?.amount || 0,
      processing_time_ms: processingTime,
    });

    const response: QuickCashResponse = {
      product_id: body.product_id,
      product_name: body.product_name,
      estimated_value: body.purchase_price || 0,
      quotes,
      total_partners_checked: PARTNERS.length,
      best_offer: quotes[0] || null,
      processing_time_ms: processingTime,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error generating Quick Cash quotes:', error);
    return NextResponse.json(
      { error: 'Failed to generate quotes' },
      { status: 500 }
    );
  }
} 