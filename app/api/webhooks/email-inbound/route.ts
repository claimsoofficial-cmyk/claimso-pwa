import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

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

interface EmailIntent {
  intent: 'PURCHASE' | 'RETURN' | 'SHIPMENT_UPDATE';
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

// ==============================================================================
// CONFIGURATION & ENVIRONMENT VALIDATION (Moved to function)
// ==============================================================================

function initializeClients() {
  const WEBHOOK_SECRET = process.env.EMAIL_WEBHOOK_SECRET;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!WEBHOOK_SECRET || !OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing required environment variables for email webhook');
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  return { WEBHOOK_SECRET, openai, supabase };
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

    // Validate required fields
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

// ==============================================================================
// AI PROCESSING FUNCTIONS - STAGE 1: CLASSIFICATION
// ==============================================================================

/**
 * AI prompt for email intent classification
 */
const EMAIL_CLASSIFICATION_PROMPT = `You are an expert at classifying email types from retailers and e-commerce platforms.

Your task is to analyze the provided email content and determine the intent. Return ONLY a valid JSON object with this structure:

{
  "intent": "PURCHASE" | "RETURN" | "SHIPMENT_UPDATE"
}

Classification rules:
- PURCHASE: New purchase confirmations, order confirmations, receipts for new purchases
- RETURN: Return confirmations, refund notifications, return shipping labels
- SHIPMENT_UPDATE: Shipping notifications, delivery updates, tracking information, "your order has shipped" emails

Return only the JSON object with the intent field. Do not include any other text or explanation.

Email content to classify:`;

/**
 * Calls OpenAI to classify email intent (Stage 1)
 */
async function classifyEmailIntent(openai: OpenAI, subject: string, text: string): Promise<EmailIntent | null> {
  try {
    const emailContent = `Subject: ${subject}\n\nBody:\n${text}`;
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: EMAIL_CLASSIFICATION_PROMPT
        },
        {
          role: 'user',
          content: emailContent
        }
      ],
      temperature: 0.1,
      max_tokens: 50,
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      throw new Error('No response from OpenAI classification');
    }

    const parsed = JSON.parse(responseText) as EmailIntent;
    
    // Validate intent field
    if (!parsed.intent || !['PURCHASE', 'RETURN', 'SHIPMENT_UPDATE'].includes(parsed.intent)) {
      throw new Error('Invalid intent in classification response');
    }

    return parsed;
  } catch (error) {
    console.error('Email classification error:', error);
    return null;
  }
}

// ==============================================================================
// AI PROCESSING FUNCTIONS - STAGE 2A: PURCHASE EXTRACTION
// ==============================================================================

/**
 * AI parsing prompt for receipt data extraction (existing function)
 */
const RECEIPT_PARSING_PROMPT = `You are an expert at parsing receipt and purchase confirmation emails. 

Your task is to analyze the provided email content and extract product purchase information. Return ONLY a valid JSON object with the following structure:

{
  "product_name": "string (required - the main product name)",
  "brand": "string (optional - brand/manufacturer)",
  "model": "string (optional - specific model number)",
  "category": "string (optional - product category like 'Electronics', 'Clothing', etc.)",
  "purchase_date": "string (optional - ISO date format YYYY-MM-DD)",
  "purchase_price": "number (optional - price as number without currency symbols)",
  "currency": "string (optional - currency code like 'USD', 'EUR')",
  "purchase_location": "string (optional - store name or website)",
  "serial_number": "string (optional - if mentioned in email)",
  "condition": "string (optional - 'new', 'used', 'refurbished')",
  "notes": "string (optional - any additional relevant details)"
}

Rules:
- If you cannot identify a clear product purchase, return: {"product_name": "Unknown Purchase"}
- Only include fields where you have confidence in the data
- For purchase_price, extract only the numeric value (e.g., 29.99 not "$29.99")
- For purchase_date, convert to YYYY-MM-DD format if possible
- Be conservative - don't guess if you're not confident about a field

Email content to analyze:`;

/**
 * Calls OpenAI to parse receipt content using AI (existing function)
 */
async function parseReceiptWithAI(openai: OpenAI, subject: string, text: string): Promise<AIProcessedProduct | null> {
  try {
    const emailContent = `Subject: ${subject}\n\nBody:\n${text}`;
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: RECEIPT_PARSING_PROMPT
        },
        {
          role: 'user',
          content: emailContent
        }
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(responseText) as AIProcessedProduct;
    
    if (!parsed.product_name) {
      throw new Error('No product_name in AI response');
    }

    return parsed;
  } catch (error) {
    console.error('AI parsing error:', error);
    return {
      product_name: `Email Purchase: ${subject}`,
      notes: `Automated extraction failed. Original content: ${text.substring(0, 500)}...`,
    };
  }
}

// ==============================================================================
// AI PROCESSING FUNCTIONS - STAGE 2B: STATUS UPDATE EXTRACTION
// ==============================================================================

/**
 * AI prompt for order status update extraction
 */
const STATUS_UPDATE_PARSING_PROMPT = `You are an expert at parsing shipping and return status emails from retailers.

Your task is to analyze the provided email content and extract order status information. Return ONLY a valid JSON object with the following structure:

{
  "order_id": "string (required - order number, confirmation number, or return ID)",
  "status": "string (required - current status like 'shipped', 'delivered', 'returned', 'refunded')",
  "tracking_number": "string (optional - tracking/reference number if provided)",
  "estimated_delivery": "string (optional - delivery date in YYYY-MM-DD format)",
  "notes": "string (optional - additional status details)"
}

Rules:
- Extract the most specific order identifier available (order number, confirmation code, etc.)
- For status, use clear terms like: 'shipped', 'delivered', 'out_for_delivery', 'returned', 'refunded', 'processing'
- Only include fields where you have confidence in the data
- Be conservative - don't guess if you're not confident about a field

Email content to analyze:`;

/**
 * Calls OpenAI to parse status update content
 */
async function parseStatusUpdateWithAI(openai: OpenAI, subject: string, text: string): Promise<OrderStatusUpdate | null> {
  try {
    const emailContent = `Subject: ${subject}\n\nBody:\n${text}`;
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: STATUS_UPDATE_PARSING_PROMPT
        },
        {
          role: 'user',
          content: emailContent
        }
      ],
      temperature: 0.1,
      max_tokens: 300,
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      throw new Error('No response from OpenAI status parsing');
    }

    const parsed = JSON.parse(responseText) as OrderStatusUpdate;
    
    if (!parsed.order_id || !parsed.status) {
      throw new Error('Missing required fields in status update response');
    }

    return parsed;
  } catch (error) {
    console.error('AI status parsing error:', error);
    return null;
  }
}

// ==============================================================================
// DATABASE OPERATIONS
// ==============================================================================

/**
 * Validates and sanitizes AI-processed product data (existing function)
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

  return data as { id: string; product_name: string };
}

/**
 * Updates an existing product record with status information
 */
async function updateExistingProduct(supabase: any, statusUpdate: OrderStatusUpdate, userId: string): Promise<{ id: string; product_name: string }> {
  // First, find the product by order ID and user ID
  // This assumes we store order IDs in a field like 'order_id' or 'notes'
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

  // Use the first match (most likely candidate)
  const targetProduct = existingProducts[0];

  // Prepare update data with proper typing
  const updateData: ProductUpdateData = {
    updated_at: new Date().toISOString(),
  };

  // Map status to appropriate fields
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

  // Add notes if provided
  if (statusUpdate.notes) {
    const existingNotes = (targetProduct.notes as string) || '';
    const newNote = `[${new Date().toISOString().split('T')[0]}] ${statusUpdate.notes}`;
    const combinedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;
    updateData.notes = combinedNotes.substring(0, 1000); // Limit length
  }

  // Update the product
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
 * Background processing function with two-stage AI processing
 */
async function processEmailInBackground(openai: OpenAI, supabase: any, emailContent: ParsedEmailContent, userId: string): Promise<void> {
  try {
    console.log(`Processing email for user ${userId}: ${emailContent.subject}`);

    // Stage 1: Classify Email Intent
    const intentResult = await classifyEmailIntent(openai, emailContent.subject, emailContent.text);
    
    if (!intentResult) {
      throw new Error('Failed to classify email intent');
    }

    console.log(`Email classified as: ${intentResult.intent}`);

    // Stage 2: Process Based on Intent
    let result: { id: string; product_name: string };

    switch (intentResult.intent) {
      case 'PURCHASE':
        // Extract product data and create new record
        const productData = await parseReceiptWithAI(openai, emailContent.subject, emailContent.text);
        if (!productData) {
          throw new Error('Failed to extract product data');
        }
        result = await createNewProduct(supabase, productData, userId);
        console.log(`Successfully created product ${result.id} for user ${userId}: ${result.product_name}`);
        break;

      case 'RETURN':
      case 'SHIPMENT_UPDATE':
        // Extract status update and update existing record
        const statusUpdate = await parseStatusUpdateWithAI(openai, emailContent.subject, emailContent.text);
        if (!statusUpdate) {
          throw new Error('Failed to extract status update data');
        }
        result = await updateExistingProduct(supabase, statusUpdate, userId);
        console.log(`Successfully updated product ${result.id} for user ${userId}: ${result.product_name}`);
        break;

      default:
        throw new Error(`Unsupported email intent: ${intentResult.intent}`);
    }

    // TODO: Trigger Smart Pass push notification based on action type
    // await sendPushNotification(userId, `Email processed: ${intentResult.intent}`);

  } catch (error) {
    console.error('Background processing error:', error);
    // TODO: Log to error monitoring service (Sentry, etc.)
    // TODO: Store failed processing attempts for retry
  }
}

// ==============================================================================
// MAIN WEBHOOK HANDLER
// ==============================================================================

/**
 * POST handler for SendGrid inbound email webhook
 * 
 * Security: Protected by secret query parameter
 * Performance: Returns 200 immediately, processes in background
 * Error handling: Comprehensive logging and graceful failures
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Step 1: Initialize clients (moved from top-level)
    const { WEBHOOK_SECRET, openai, supabase } = initializeClients();

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
    processEmailInBackground(openai, supabase, emailContent, userId).catch(error => {
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
      service: 'email-inbound-webhook-v2',
      features: ['two-stage-ai-processing', 'intent-classification', 'status-updates'],
      timestamp: new Date().toISOString()
    }, 
    { status: 200 }
  );
}