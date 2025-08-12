import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Fixed webhook payload interface
interface SupabaseWebhookPayload {
  type: string;
  table: string;
  record: {
    id: string;
    email?: string;
    raw_user_meta_data?: Record<string, unknown>;
    [key: string]: unknown; // Changed from Record<string, unknown> to unknown
  };
  schema: string;
  old_record?: Record<string, unknown>;
}

// Configuration validation
interface WebhookConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  webhookSecret: string;
}

function validateConfig(): WebhookConfig | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;

  if (!supabaseUrl || !supabaseServiceKey || !webhookSecret) {
    console.error('Server configuration error: Missing required environment variables', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasWebhookSecret: !!webhookSecret
    });
    return null;
  }

  return { supabaseUrl, supabaseServiceKey, webhookSecret };
}

function validateAuthorizationHeader(authHeader: string | null, webhookSecret: string): boolean {
  if (!authHeader) {
    console.warn('Webhook security violation: Missing Authorization header');
    return false;
  }

  const token = authHeader.replace('Bearer ', '');
  
  if (token !== webhookSecret) {
    console.warn('Webhook security violation: Invalid token', {
      timestamp: new Date().toISOString()
    });
    return false;
  }

  return true;
}

function validatePayload(payload: unknown): payload is SupabaseWebhookPayload {
  if (!payload || typeof payload !== 'object') {
    console.error('Invalid webhook payload structure:', payload);
    return false;
  }

  const p = payload as Partial<SupabaseWebhookPayload>;
  
  if (!p.type || !p.record || !p.record.id) {
    console.error('Invalid webhook payload: missing required fields', {
      hasType: !!p.type,
      hasRecord: !!p.record,
      hasId: !!(p.record?.id)
    });
    return false;
  }

  return true;
}

async function syncUserProfile(userId: string, config: WebhookConfig): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const { error } = await supabase
      .rpc('sync_user_profile', { user_id: userId })
      .single();

    if (error) {
      console.error('Profile sync RPC error:', {
        error: error.message,
        code: error.code,
        details: error.details,
        userId
      });
      
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    console.error('Database operation failed:', {
      error: errorMessage,
      userId
    });
    
    return { success: false, error: errorMessage };
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validate configuration
    const config = validateConfig();
    if (!config) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Validate authorization
    const authHeader = request.headers.get('authorization');
    if (!validateAuthorizationHeader(authHeader, config.webhookSecret)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate payload
    let payload: unknown;
    try {
      payload = await request.json();
    } catch (parseError) {
      console.error('Webhook payload parsing error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    if (!validatePayload(payload)) {
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

    const userId = payload.record.id;
    const userMetadata = payload.record.raw_user_meta_data || {};

    console.log('Processing USER.UPDATED event:', {
      userId,
      hasMetadata: Object.keys(userMetadata).length > 0,
      metadataKeys: Object.keys(userMetadata)
    });

    // Sync user profile
    const syncResult = await syncUserProfile(userId, config);
    
    if (!syncResult.success) {
      return NextResponse.json(
        { error: 'Profile sync failed', details: syncResult.error },
        { status: 500 }
      );
    }

    const processingTime = Date.now() - startTime;

    console.log('Profile sync successful:', {
      userId,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString()
    });

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
const methodNotAllowed = () => NextResponse.json(
  { error: 'Method not allowed. This webhook only accepts POST requests.' },
  { status: 405 }
);

export async function GET() {
  return methodNotAllowed();
}

export async function PUT() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}