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
// ICS FILE GENERATOR
// ==============================================================================

/**
 * Generates ICS calendar file content for warranty expiry
 */
function generateICSContent(product: CalendarProduct): string {
  const purchaseDate = new Date(product.purchase_date);
  const warrantyEndDate = new Date(purchaseDate);
  warrantyEndDate.setMonth(warrantyEndDate.getMonth() + product.warranty_length_months);
  
  // Create 30-day reminder
  const reminderDate = new Date(warrantyEndDate);
  reminderDate.setDate(reminderDate.getDate() - 30);
  
  const now = new Date();
  const eventId = `warranty-${product.id}-${Date.now()}@claimso.com`;
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Claimso//Warranty Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    '',
    'BEGIN:VEVENT',
    `UID:${eventId}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(warrantyEndDate)}`,
    `DTEND:${formatICSDate(new Date(warrantyEndDate.getTime() + 24 * 60 * 60 * 1000))}`,
    `SUMMARY:Warranty Expires - ${product.product_name}`,
    `DESCRIPTION:Your warranty for ${product.product_name} expires today. Consider filing a claim if you have any issues.`,
    'CATEGORIES:WARRANTY',
    'PRIORITY:1',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    '',
    'BEGIN:VEVENT',
    `UID:${eventId}-reminder`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(reminderDate)}`,
    `DTEND:${formatICSDate(new Date(reminderDate.getTime() + 24 * 60 * 60 * 1000))}`,
    `SUMMARY:Warranty Expires Soon - ${product.product_name}`,
    `DESCRIPTION:Your warranty for ${product.product_name} expires in 30 days. Consider filing a claim if you have any issues.`,
    'CATEGORIES:WARRANTY',
    'PRIORITY:2',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    '',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return icsContent;
}

/**
 * Formats date for ICS format
 */
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// ==============================================================================
// MAIN HANDLER
// ==============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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
      .select('id, product_name, purchase_date, user_id, warranties')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!product.purchase_date) {
      return NextResponse.json({ error: 'Product missing purchase date' }, { status: 400 });
    }

    // Calculate warranty length from warranties or use default
    let warrantyLengthMonths = 12; // Default 1 year
    if (product.warranties && product.warranties.length > 0) {
      const primaryWarranty = product.warranties[0];
      if (primaryWarranty.warranty_duration_months) {
        warrantyLengthMonths = primaryWarranty.warranty_duration_months;
      }
    }

    // Prepare product data
    const calendarProduct: CalendarProduct = {
      id: product.id,
      product_name: product.product_name,
      purchase_date: product.purchase_date,
      warranty_length_months: warrantyLengthMonths
    };

    console.log('Generating calendar event for product:', product.id);

    // Generate ICS content
    const icsContent = generateICSContent(calendarProduct);
    
    // Generate safe filename
    const safeProductName = product.product_name.replace(/[^a-zA-Z0-9\-_]/g, '_');
    const filename = `claimso_warranty_${safeProductName}.ics`;

    console.log('Successfully generated calendar file:', {
      productId: product.id,
      filename,
      sizeBytes: icsContent.length
    });

    // Return ICS file with proper headers
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
    return NextResponse.json(
      { 
        error: 'Failed to generate calendar event',
        message: 'Please try again later or contact support if the issue persists.'
      },
      { status: 500 }
    );
  }
}