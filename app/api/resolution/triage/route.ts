// file: app/api/resolution/triage/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

interface TriageRequest {
  productId: string;
  issueType: 'hardware_malfunction' | 'physical_damage' | 'software_issue' | 'other';
}

interface TriageResponse {
  success: boolean;
  recommended_path: 'phone_call' | 'claim_packet' | 'live_chat';
  // Additional data can be returned to help the frontend
  support_phone_number?: string;
  support_chat_url?: string;
}

// The "Resolution Matrix" Logic
function getResolutionPath(
  productCategory: string | null | undefined,
  issueType: TriageRequest['issueType']
): TriageResponse['recommended_path'] {
  const category = productCategory?.toLowerCase() || 'unknown';

  // Rule 1: Physical damage almost always requires a formal claim packet
  if (issueType === 'physical_damage') {
    return 'claim_packet';
  }

  // Rule 2: Electronics with hardware issues are often best handled by phone
  if (category.includes('electronics') && issueType === 'hardware_malfunction') {
    return 'phone_call';
  }
  
  // Rule 3: Software issues are best for live chat
  if (issueType === 'software_issue') {
      return 'live_chat';
  }

  // Default Fallback: The safest path for all other cases
  return 'claim_packet';
}


export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    // 1. Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. Validate the request body
    const body: TriageRequest = await request.json();
    const { productId, issueType } = body;

    if (!productId || !issueType) {
      return NextResponse.json({ error: 'Missing productId or issueType' }, { status: 400 });
    }

    // 3. CRITICAL: Verify product ownership
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, user_id, category, brand') // Select only the necessary columns
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.user_id !== userId) {
      // Log this as a potential security event
      console.warn(`SECURITY: User ${userId} attempted to access product ${productId} owned by ${product.user_id}.`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Run the triage logic
    const recommended_path = getResolutionPath(product.category, issueType);
    
    // 5. Prepare the response
    const responseData: TriageResponse = {
      success: true,
      recommended_path,
    };
    
    // (Optional) Add contextual data to the response
    if (recommended_path === 'phone_call') {
      // In a real app, this would come from a database of support numbers
      responseData.support_phone_number = `1-800-${product.brand?.toUpperCase() || 'SUPPORT'}`;
    }
    if (recommended_path === 'live_chat') {
        responseData.support_chat_url = `https://support.${product.brand?.toLowerCase()}.com/chat`;
    }

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Triage API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}