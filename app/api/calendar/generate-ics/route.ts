import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ==============================================================================
// TYPESCRIPT INTERFACES
// ==============================================================================

interface CalendarProduct {
  id: string;
  product_name: string;
  purchase_date: string;
  warranty_length_months: number;
}

// ==============================================================================
// CONFIGURATION
// ==============================================================================

function getServiceConfig() {
  const SERVICES_URL = process.env.SERVICES_URL;
  const SERVICES_API_KEY = process.env.SERVICES_API_KEY;

  if (!SERVICES_URL || !SERVICES_API_KEY) {
    throw new Error('Missing required service configuration: SERVICES_URL or SERVICES_API_KEY');
  }

  return { SERVICES_URL, SERVICES_API_KEY };
}

// ==============================================================================
// SERVICE COMMUNICATION
// ==============================================================================

/**
 * Calls the microservice to generate ICS calendar file
 */
async function generateCalendarWithService(product: CalendarProduct, servicesUrl: string, apiKey: string): Promise<Response> {
  const response = await fetch(`${servicesUrl}/calendar-generator`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    throw new Error(`Service responded with status: ${response.status}`);
  }

  return response;
}

// ==============================================================================
// MAIN HANDLER
// ==============================================================================

export async function GET(request: NextRequest) {
  try {
    // Step 1: Initialize services
    const { SERVICES_URL, SERVICES_API_KEY } = getServiceConfig();
    const supabase = await createClient();

    // Step 2: Get authenticated user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 3: Extract productId from search parameters
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Step 4: Fetch product and verify ownership
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, product_name, purchase_date, warranty_length_months, user_id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!product.purchase_date || !product.warranty_length_months) {
      return NextResponse.json({ error: 'Product missing warranty information' }, { status: 400 });
    }

    // Step 5: Prepare product data for service
    const calendarProduct: CalendarProduct = {
      id: product.id,
      product_name: product.product_name,
      purchase_date: product.purchase_date,
      warranty_length_months: product.warranty_length_months
    };

    console.log('Generating calendar event for product:', product.id);

    // Step 6: Call microservice to generate ICS
    const icsResponse = await generateCalendarWithService(calendarProduct, SERVICES_URL, SERVICES_API_KEY);
    
    // Step 7: Get ICS content
    const icsContent = await icsResponse.text();
    
    // Step 8: Generate safe filename
    const safeProductName = product.product_name.replace(/[^a-zA-Z0-9\-_]/g, '_');
    const filename = `claimso_warranty_${safeProductName}.ics`;

    console.log('Successfully generated calendar file:', {
      productId: product.id,
      filename,
      sizeBytes: icsContent.length
    });

    // Step 9: Return ICS file with proper headers
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': icsContent.length.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Calendar generation error:', error);

    // Check if it's a service communication error
    if (error instanceof Error && error.message.includes('Service responded with status:')) {
      return NextResponse.json(
        { 
          error: 'Calendar generation service temporarily unavailable',
          message: 'Please try again later or contact support if the issue persists.'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate calendar event',
        message: 'Please try again later or contact support if the issue persists.'
      },
      { status: 500 }
    );
  }
}