import { type CookieOptions, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// ==============================================================================
// TYPESCRIPT INTERFACES
// ==============================================================================

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  productCount: number;
}

// ==============================================================================
// CONFIGURATION & ENVIRONMENT VALIDATION
// ==============================================================================

function getRequiredConfig() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const SERVICES_URL = process.env.SERVICES_URL;
  const SERVICES_API_KEY = process.env.SERVICES_API_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICES_URL || !SERVICES_API_KEY) {
    throw new Error('Missing required environment variables for pass generation');
  }

  return { SUPABASE_URL, SUPABASE_ANON_KEY, SERVICES_URL, SERVICES_API_KEY };
}

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

/**
 * Gets user's product count for display on pass
 */
async function getUserProductCount(userId: string, supabase: SupabaseClient): Promise<number> {
  try {
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_archived', false);
    
    return count || 0;
  } catch (error) {
    console.error('Error fetching user product count:', error);
    return 0;
  }
}

/**
 * Calls the microservice to generate Apple Wallet pass
 */
async function generatePassWithService(userProfile: UserProfile, servicesUrl: string, apiKey: string): Promise<Response> {
  const response = await fetch(`${servicesUrl}/pass-generator`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(userProfile),
  });

  if (!response.ok) {
    throw new Error(`Service responded with status: ${response.status}`);
  }

  return response;
}

// ==============================================================================
// MAIN API HANDLER
// ==============================================================================

/**
 * GET handler for Apple Wallet pass generation
 * 
 * Security: Requires authenticated user session
 * Output: .pkpass file with proper headers for wallet integration
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Step 1: Initialize configuration
    const { SUPABASE_URL, SUPABASE_ANON_KEY, SERVICES_URL, SERVICES_API_KEY } = getRequiredConfig();

    // Step 2: Set up Supabase client for authentication
    const cookieStore = await cookies();

    const supabase = createServerClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(_name: string, _value: string, _options: CookieOptions) {
            // Server components are read-only, so we don't set cookies here
          },
          remove(_name: string, _options: CookieOptions) {
            // Server components are read-only, so we don't remove cookies here
          },
        },
      }
    );

    // Step 3: Check for authenticated user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('Unauthorized pass generation attempt');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Step 4: Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Step 5: Get user's product count
    const productCount = await getUserProductCount(profile.id, supabase);

    const userProfile: UserProfile = {
      id: profile.id,
      full_name: profile.full_name,
      email: user.email || '',
      productCount
    };

    console.log(`Generating pass for user: ${userProfile.id}`);

    // Step 6: Call microservice to generate pass
    const passResponse = await generatePassWithService(userProfile, SERVICES_URL, SERVICES_API_KEY);
    
    // Step 7: Get pass data
    const passBuffer = await passResponse.arrayBuffer();

    const processingTime = Date.now() - startTime;
    console.log(`Pass generated successfully in ${processingTime}ms for user: ${userProfile.id}`);

    // Step 8: Return the pass with proper headers for Apple Wallet
    return new NextResponse(new Uint8Array(passBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': 'attachment; filename="CLAIMSO-SmartPass.pkpass"',
        'Content-Length': passBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Pass generation error:', error);

    // Log error details for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        processingTime
      });
    }

    // Check if it's a service communication error
    if (error instanceof Error && error.message.includes('Service responded with status:')) {
      return NextResponse.json(
        { 
          error: 'Pass generation service temporarily unavailable',
          message: 'Please try again later or contact support if the issue persists.'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate pass',
        message: 'Please try again later or contact support if the issue persists.'
      },
      { status: 500 }
    );
  }
}

// ==============================================================================
// OPTIONAL: POST HANDLER FOR PASS UPDATES
// ==============================================================================

/**
 * POST handler for updating existing passes (future enhancement)
 * This would be called by Apple's pass update service
 */
export async function POST(_request: NextRequest): Promise<NextResponse> {
  // TODO: Implement pass update logic
  // This would handle requests from Apple's servers to update passes
  // when users' data changes (e.g., new products added)
  
  return NextResponse.json(
    { message: 'Pass updates not implemented yet' },
    { status: 501 }
  );
}

// ==============================================================================
// HEALTH CHECK
// ==============================================================================

/**
 * Simple health check endpoint
 */
export async function HEAD(_request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}