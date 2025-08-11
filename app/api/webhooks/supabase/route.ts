import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Webhook payload interface
interface SupabaseWebhookPayload {
  type: string;
  table: string;
  record: {
    id: string;
    email?: string;
    raw_user_meta_data?: Record<string, any>;
    [key: string]: any;
  };
  schema: string;
  old_record?: any;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // SECURITY CHECK: Validate Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      console.warn('Webhook security violation: Missing Authorization header');
      return NextResponse.json(
        { error: 'Unauthorized: Missing authorization header' },
        { status: 401 }
      );
    }

    // Extract Bearer token
    const token = authHeader.replace('Bearer ', '');
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Server configuration error: SUPABASE_WEBHOOK_SECRET not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // CRITICAL SECURITY: Compare webhook secret
    if (token !== webhookSecret) {
      console.warn('Webhook security violation: Invalid token', {
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    let payload: SupabaseWebhookPayload;
    try {
      payload = await request.json();
    } catch (parseError) {
      console.error('Webhook payload parsing error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validate payload structure
    if (!payload || typeof payload !== 'object') {
      console.error('Invalid webhook payload structure:', payload);
      return NextResponse.json(
        { error: 'Invalid payload structure' },
        { status: 400 }
      );
    }

    // Check if this is a USER.UPDATED event
    if (payload.type !== 'USER.UPDATED') {
      console.log('Ignoring non-USER.UPDATED event:', payload.type);
      return NextResponse.json(
        { status: 'ok', message: 'Event type ignored' },
        { status: 200 }
      );
    }

    // Extract user data from payload
    const { record } = payload;
    
    if (!record || !record.id) {
      console.error('Invalid USER.UPDATED payload: missing record or id', {
        hasRecord: !!record,
        hasId: !!(record?.id)
      });
      return NextResponse.json(
        { error: 'Invalid user record in payload' },
        { status: 400 }
      );
    }

    const userId = record.id;
    const userMetadata = record.raw_user_meta_data || {};

    console.log('Processing USER.UPDATED event:', {
      userId,
      hasMetadata: Object.keys(userMetadata).length > 0,
      metadataKeys: Object.keys(userMetadata)
    });

    // Create Supabase service role client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Server configuration error: Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Call the sync_user_profile RPC function
    const { data, error } = await supabase.rpc('sync_user_profile', {
      user_id: userId,
      user_metadata: userMetadata
    });

    if (error) {
      console.error('Profile sync RPC error:', {
        error: error.message,
        code: error.code,
        details: error.details,
        userId
      });
      
      return NextResponse.json(
        { error: 'Profile sync failed', details: error.message },
        { status: 500 }
      );
    }

    const processingTime = Date.now() - startTime;
    
    console.log('Profile sync successful:', {
      userId,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString()
    });

    // Return success response
    return NextResponse.json(
      { 
        status: 'ok',
        message: 'Profile synced successfully',
        userId,
        processingTimeMs: processingTime
      },
      { status: 200 }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error('Webhook handler error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle unsupported HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. This webhook only accepts POST requests.' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. This webhook only accepts POST requests.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. This webhook only accepts POST requests.' },
    { status: 405 }
  );
}