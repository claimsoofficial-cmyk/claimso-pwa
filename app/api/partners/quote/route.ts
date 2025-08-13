import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getInstantQuotes } from '@/lib/services/partner-service';
import { QuoteRequest } from '@/lib/types/partners';

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { product_id, condition } = body;

    if (!product_id || !condition) {
      return NextResponse.json({ 
        error: 'Missing required fields: product_id, condition' 
      }, { status: 400 });
    }

    // Get product details from database
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('user_id', session.user.id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Prepare quote request
    const quoteRequest: QuoteRequest = {
      product_id: product.id,
      product_name: product.product_name,
      brand: product.brand || 'Unknown',
      category: product.category || 'electronics',
      condition: condition as 'excellent' | 'good' | 'fair' | 'poor',
      purchase_price: product.purchase_price || 0,
      purchase_date: product.purchase_date || new Date().toISOString(),
      serial_number: product.serial_number,
      user_id: session.user.id
    };

    // Get instant quotes
    const quoteResponse = await getInstantQuotes(quoteRequest);

    if (!quoteResponse.success) {
      return NextResponse.json({ 
        error: 'Failed to get quotes' 
      }, { status: 500 });
    }

    // Log the quote request for analytics
    try {
      await supabase
        .from('quote_requests')
        .insert({
          user_id: session.user.id,
          product_id: product.id,
          condition: condition,
          quotes_received: quoteResponse.quotes.length,
          best_offer: quoteResponse.best_offer?.amount || 0,
          processing_time: quoteResponse.processing_time,
          created_at: new Date().toISOString()
        });
      console.log('Quote request logged');
    } catch (err) {
      console.warn('Failed to log quote request:', err);
    }

    return NextResponse.json(quoteResponse);

  } catch (error) {
    console.error('Error in quote API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 