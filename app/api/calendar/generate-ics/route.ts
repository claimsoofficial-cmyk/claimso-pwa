import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Our server client

import { createEvent } from 'ics';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    // Get authenticated user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract productId from search parameters
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Fetch product and verify ownership
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, product_name, purchase_date, warranty_length_months, user_id') // Assuming you add warranty_length_months to your products table
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

    // --- (The rest of the ICS generation logic is perfect and remains unchanged) ---

    const purchaseDate = new Date(product.purchase_date);
    const expirationDate = new Date(purchaseDate);
    expirationDate.setMonth(expirationDate.getMonth() + product.warranty_length_months);

    const event = {
      start: [ expirationDate.getFullYear(), expirationDate.getMonth() + 1, expirationDate.getDate() ] as [number, number, number],
      duration: { hours: 1 }, // <--- ADD THIS LINE
      title: `Warranty Expiration: ${product.product_name}`,
      description: `Your warranty for ${product.product_name} expires today.`,
      alarms: [{
          action: 'display' as const,
          description: `Reminder: Warranty expires in 1 week for ${product.product_name}`,
          trigger: { weeks: 1, before: true }
      }]
    };

    const { error: icsError, value: icsContent } = createEvent(event);

    if (icsError || !icsContent) {
        console.error('ICS generation error:', icsError);
        return NextResponse.json({ error: 'Failed to generate calendar event' }, { status: 500 });
    }
    
    const safeProductName = product.product_name.replace(/[^a-zA-Z0-9\-_]/g, '_');
    const filename = `claimso_warranty_${safeProductName}.ics`;

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    });

  } catch (error) {
    console.error('Calendar generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}