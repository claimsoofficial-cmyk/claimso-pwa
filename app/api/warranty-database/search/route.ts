import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchWarrantyDatabase } from '@/lib/services/warranty-database-service';
import { WarrantySearchRequest } from '@/lib/types/warranty-database';

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
    const searchRequest: WarrantySearchRequest = {
      brand: searchParams.get('brand') || undefined,
      model: searchParams.get('model') || undefined,
      category: searchParams.get('category') || undefined,
      min_confidence: searchParams.get('min_confidence') ? 
        parseFloat(searchParams.get('min_confidence')!) : undefined,
      include_extended: searchParams.get('include_extended') === 'true'
    };

    // Search warranty database
    const response = await searchWarrantyDatabase(searchRequest);

    if (!response.success) {
      return NextResponse.json({ 
        error: 'Failed to search warranty database' 
      }, { status: 500 });
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in warranty database search API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 