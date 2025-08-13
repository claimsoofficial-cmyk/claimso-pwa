import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateProductPerformanceData } from '@/lib/services/analytics-service';

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');

    if (!productId) {
      return NextResponse.json({ 
        error: 'Missing required parameter: product_id' 
      }, { status: 400 });
    }

    // Verify product ownership
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('user_id', session.user.id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Generate product performance data
    const data = await generateProductPerformanceData(productId);

    // Add metadata
    const response = {
      success: true,
      data,
      metadata: {
        data_points: 200, // Estimated data points used
        confidence_score: 0.88,
        last_updated: new Date().toISOString(),
        source: 'claimso_analytics_engine',
        product_id: productId
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in product performance API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 