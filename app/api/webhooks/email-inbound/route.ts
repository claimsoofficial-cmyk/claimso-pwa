import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ==============================================================================
// TYPESCRIPT INTERFACES
// ==============================================================================

interface ParsedEmailContent {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
}

interface AIProcessedProduct {
  product_name: string;
  brand?: string;
  model?: string;
  category?: string;
  purchase_date?: string;
  purchase_price?: number;
  currency?: string;
  purchase_location?: string;
  serial_number?: string;
  condition?: 'new' | 'used' | 'refurbished';
  notes?: string;
}

interface OrderStatusUpdate {
  order_id: string;
  status: string;
  tracking_number?: string;
  estimated_delivery?: string;
  notes?: string;
}

interface ProductUpdateData {
  updated_at: string;
  shipping_status?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  delivery_date?: string;
  return_status?: string;
  return_date?: string;
  notes?: string;
}

interface EmailParseResponse {
  intent: 'PURCHASE' | 'RETURN' | 'SHIPMENT_UPDATE';
  data: AIProcessedProduct | OrderStatusUpdate;
}

// ==============================================================================
// CONFIGURATION & ENVIRONMENT VALIDATION
// ==============================================================================

function initializeClients() {
  const WEBHOOK_SECRET = process.env.EMAIL_WEBHOOK_SECRET;
  const SERVICES_URL = process.env.SERVICES_URL;
  const SERVICES_API_KEY = process.env.SERVICES_API_KEY;
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!WEBHOOK_SECRET || !SERVICES_URL || !SERVICES_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing required environment variables for email webhook');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  return { WEBHOOK_SECRET, SERVICES_URL, SERVICES_API_KEY, supabase };
}

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

/**
 * Validates that a string is a valid UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Extracts user_id from email address in format: [user_id]@vault.claimso.com
 */
function extractUserIdFromEmail(email: string): string | null {
  const match = email.match(/^([^@]+)@vault\.claimso\.com$/);
  if (!match) return null;
  
  const userId = match[1];
  return isValidUUID(userId) ? userId : null;
}

/**
 * Parses multipart/form-data from SendGrid webhook
 */
async function parseMultipartFormData(request: NextRequest): Promise<ParsedEmailContent | null> {
  try {
    const formData = await request.formData();
    
    const to = formData.get('to') as string;
    const from = formData.get('from') as string;
    const subject = formData.get('subject') as string;
    const text = formData.get('text') as string;
    const html = formData.get('html') as string;

    if (!to || !from || !subject || !text) {
      console.error('Missing required email fields:', { to: !!to, from: !!from, subject: !!subject, text: !!text });
      return null;
    }

    return { to, from, subject, text, html };
  } catch (error) {
    console.error('Error parsing multipart form data:', error);
    return null;
  }
}

/**
 * Calls the microservice to parse email content
 */
async function parseEmailWithService(emailContent: ParsedEmailContent, servicesUrl: string, apiKey: string): Promise<EmailParseResponse | null> {
  try {
    const response = await fetch(`${servicesUrl}/email-parser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(emailContent),
    });

    if (!response.ok) {
      throw new Error(`Service responded with status: ${response.status}`);
    }

    const result = await response.json() as EmailParseResponse;
    return result;
  } catch (error) {
    console.error('Service call error:', error);
    return null;
  }
}

/**
 * Triggers warranty analysis for a newly created product
 */
async function triggerWarrantyAnalysis(supabase: any, productId: string, _userId: string): Promise<void> {
  try {
    // Check if the product has any warranty documents
    const { data: documents } = await supabase
      .from('documents')
      .select('id, document_type')
      .eq('product_id', productId)
      .in('document_type', ['warranty_pdf', 'insurance']);

    // Only proceed with warranty analysis if there are actual warranty documents
    if (!documents || documents.length === 0) {
      console.log(`No warranty documents found for product ${productId}, skipping warranty analysis`);
      return;
    }

    // Create a basic warranty record for analysis
          const { data: _warranty, error: warrantyError } = await supabase
      .from('warranties')
      .insert({
        product_id: productId,
        warranty_type: 'manufacturer',
        warranty_start_date: new Date().toISOString().split('T')[0],
        warranty_duration_months: 12,
        ai_confidence_score: null,
        last_analyzed_at: null
      })
      .select('id')
      .single();

    if (warrantyError) {
      console.warn('Failed to create warranty record:', warrantyError);
      return;
    }

    // Call the warranty analysis API
    const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/warranty/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal-key'}`,
      },
      body: JSON.stringify({ productId }),
    });

    if (!analysisResponse.ok) {
      throw new Error(`Warranty analysis API responded with status: ${analysisResponse.status}`);
    }

    console.log(`Warranty analysis triggered for product ${productId}`);
  } catch (error) {
    console.error('Error triggering warranty analysis:', error);
    throw error;
  }
}

// ==============================================================================
// DATABASE OPERATIONS
// ==============================================================================

/**
 * Validates and sanitizes AI-processed product data
 */
function validateAndSanitizeProductData(data: AIProcessedProduct, userId: string): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {
    user_id: userId,
    product_name: data.product_name?.substring(0, 255) || 'Unknown Product',
    currency: 'USD',
    condition: 'new',
    is_archived: false,
  };

  if (data.brand) sanitized.brand = data.brand.substring(0, 100);
  if (data.model) sanitized.model = data.model.substring(0, 100);
  if (data.category) sanitized.category = data.category.substring(0, 100);
  if (data.purchase_location) sanitized.purchase_location = data.purchase_location.substring(0, 255);
  if (data.serial_number) sanitized.serial_number = data.serial_number.substring(0, 100);
  if (data.notes) sanitized.notes = data.notes.substring(0, 1000);

  if (data.purchase_date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(data.purchase_date)) {
      const date = new Date(data.purchase_date);
      if (!isNaN(date.getTime())) {
        sanitized.purchase_date = data.purchase_date;
      }
    }
  }

  if (typeof data.purchase_price === 'number' && data.purchase_price > 0) {
    sanitized.purchase_price = Math.round(data.purchase_price * 100) / 100;
  }

  if (data.currency && /^[A-Z]{3}$/.test(data.currency)) {
    sanitized.currency = data.currency;
  }

  if (data.condition && ['new', 'used', 'refurbished', 'damaged'].includes(data.condition)) {
    sanitized.condition = data.condition;
  }

  return sanitized;
}

/**
 * Creates a new product record in the database
 */
async function createNewProduct(supabase: any, productData: AIProcessedProduct, userId: string): Promise<{ id: string; product_name: string }> {
  const sanitizedData = validateAndSanitizeProductData(productData, userId);
  
  const { data, error } = await supabase
    .from('products')
    .insert(sanitizedData)
    .select('id, product_name')
    .single();

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`);
  }

  // Trigger warranty analysis for the new product
  try {
    await triggerWarrantyAnalysis(supabase, data.id, userId);
  } catch (analysisError) {
    console.warn(`Warranty analysis failed for product ${data.id}:`, analysisError);
    // Don't fail the product creation if warranty analysis fails
  }

  return data as { id: string; product_name: string };
}

/**
 * Updates an existing product record with status information
 */
async function updateExistingProduct(supabase: any, statusUpdate: OrderStatusUpdate, userId: string): Promise<{ id: string; product_name: string }> {
  const { data: existingProducts, error: searchError } = await supabase
    .from('products')
    .select('id, product_name, notes')
    .eq('user_id', userId)
    .or(`order_id.eq.${statusUpdate.order_id},notes.ilike.%${statusUpdate.order_id}%`)
    .limit(5);

  if (searchError) {
    throw new Error(`Failed to search for existing product: ${searchError.message}`);
  }

  if (!existingProducts || existingProducts.length === 0) {
    throw new Error(`No existing product found for order ID: ${statusUpdate.order_id}`);
  }

  const targetProduct = existingProducts[0];

  const updateData: ProductUpdateData = {
    updated_at: new Date().toISOString(),
  };

  switch (statusUpdate.status.toLowerCase()) {
    case 'shipped':
    case 'out_for_delivery':
      updateData.shipping_status = statusUpdate.status;
      if (statusUpdate.tracking_number) {
        updateData.tracking_number = statusUpdate.tracking_number.substring(0, 100);
      }
      if (statusUpdate.estimated_delivery) {
        updateData.estimated_delivery = statusUpdate.estimated_delivery;
      }
      break;
    
    case 'delivered':
      updateData.shipping_status = 'delivered';
      updateData.delivery_date = new Date().toISOString().split('T')[0];
      if (statusUpdate.tracking_number) {
        updateData.tracking_number = statusUpdate.tracking_number.substring(0, 100);
      }
      break;
    
    case 'returned':
    case 'refunded':
      updateData.return_status = statusUpdate.status;
      updateData.return_date = new Date().toISOString().split('T')[0];
      break;
    
    default:
      updateData.shipping_status = statusUpdate.status;
  }

  if (statusUpdate.notes) {
    const existingNotes = (targetProduct.notes as string) || '';
    const newNote = `[${new Date().toISOString().split('T')[0]}] ${statusUpdate.notes}`;
    const combinedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;
    updateData.notes = combinedNotes.substring(0, 1000);
  }

  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', targetProduct.id)
    .eq('user_id', userId)
    .select('id, product_name')
    .single();

  if (error) {
    throw new Error(`Failed to update product: ${error.message}`);
  }

  return data as { id: string; product_name: string };
}

// ==============================================================================
// BACKGROUND PROCESSING
// ==============================================================================

/**
 * Background processing function
 */
async function processEmailInBackground(supabase: any, emailContent: ParsedEmailContent, userId: string, servicesUrl: string, apiKey: string): Promise<void> {
  try {
    console.log(`Processing email for user ${userId}: ${emailContent.subject}`);

    // Call microservice to parse email
    const parseResult = await parseEmailWithService(emailContent, servicesUrl, apiKey);
    
    if (!parseResult) {
      throw new Error('Failed to parse email with service');
    }

    console.log(`Email classified as: ${parseResult.intent}`);

    let result: { id: string; product_name: string };

    switch (parseResult.intent) {
      case 'PURCHASE':
        const productData = parseResult.data as AIProcessedProduct;
        result = await createNewProduct(supabase, productData, userId);
        console.log(`Successfully created product ${result.id} for user ${userId}: ${result.product_name}`);
        break;

      case 'RETURN':
      case 'SHIPMENT_UPDATE':
        const statusUpdate = parseResult.data as OrderStatusUpdate;
        result = await updateExistingProduct(supabase, statusUpdate, userId);
        console.log(`Successfully updated product ${result.id} for user ${userId}: ${result.product_name}`);
        break;

      default:
        throw new Error(`Unsupported email intent: ${parseResult.intent}`);
    }

  } catch (error) {
    console.error('Background processing error:', error);
  }
}

// ==============================================================================
// MAIN WEBHOOK HANDLER
// ==============================================================================

/**
 * POST handler for SendGrid inbound email webhook
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Step 1: Initialize clients
    const { WEBHOOK_SECRET, SERVICES_URL, SERVICES_API_KEY, supabase } = initializeClients();

    // Step 2: Security Validation
    const { searchParams } = new URL(request.url);
    const providedSecret = searchParams.get('secret');

    if (!providedSecret || providedSecret !== WEBHOOK_SECRET) {
      console.warn('Unauthorized webhook attempt:', {
        providedSecret: providedSecret ? '[PROVIDED]' : '[MISSING]',
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      });
      
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Step 3: Parse Email Content
    const emailContent = await parseMultipartFormData(request);
    
    if (!emailContent) {
      console.error('Failed to parse email content');
      return NextResponse.json(
        { error: 'Invalid email format' }, 
        { status: 400 }
      );
    }

    // Step 4: Extract and Validate User ID
    const userId = extractUserIdFromEmail(emailContent.to);
    
    if (!userId) {
      console.warn('Invalid destination email format:', emailContent.to);
      return NextResponse.json(
        { error: 'Invalid destination email' }, 
        { status: 400 }
      );
    }

    // Step 5: Verify User Exists
    const { data: userExists } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!userExists) {
      console.warn('Email sent to non-existent user:', userId);
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    // Step 6: Return Success Immediately (for SendGrid)
    const responseTime = Date.now() - startTime;
    console.log(`Webhook processed successfully in ${responseTime}ms for user: ${userId}`);

    // Step 7: Process Email in Background (fire-and-forget)
    processEmailInBackground(supabase, emailContent, userId, SERVICES_URL, SERVICES_API_KEY).catch(error => {
      console.error('Background processing failed:', error);
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Email received and processing started',
        processing_time_ms: responseTime
      }, 
      { status: 200 }
    );

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Webhook error:', error);
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Email received',
        processing_time_ms: responseTime 
      }, 
      { status: 200 }
    );
  }
}

// ==============================================================================
// HEALTH CHECK
// ==============================================================================

export async function GET(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { 
      status: 'healthy', 
      service: 'email-inbound-webhook-refactored',
      timestamp: new Date().toISOString()
    }, 
    { status: 200 }
  );
}