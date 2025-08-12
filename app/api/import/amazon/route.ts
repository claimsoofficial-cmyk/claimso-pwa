// Vercel configuration for extended execution
export const maxDuration = 300 // 5 minutes
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Export configuration object for Vercel
export const config = {
  maxDuration: 300,
  memory: 1024
}

// TypeScript interfaces
interface ImportRequest {
  user_id: string
  access_token: string
  date_range?: {
    start_date: string
    end_date: string
  }
  import_options?: {
    include_returns: boolean
    include_digital: boolean
    include_subscriptions: boolean
  }
}

interface ImportResponse {
  success: boolean
  message: string
  data?: {
    total_orders: number
    imported_orders: number
    skipped_orders: number
    processing_time_ms: number
    import_id: string
  }
  error?: {
    code: string
    details: string
  }
}

interface ScrapedProduct {
  external_id: string
  name: string
  price: number
  purchase_date: string
  image_url?: string
  retailer: string
  category?: string
}

interface ScraperResponse {
  success: boolean
  retailer: string
  products: ScrapedProduct[]
  count: number
  error?: string
  type?: string
  recoverable?: boolean
}

// Utility functions
function sanitizeString(input: string): string {
  if (!input) return ''
  
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/[^\w\s\-.,()]/g, '')
    .substring(0, 255)
}

function extractBrandFromName(productName: string): string {
  const words = productName.split(' ')
  return words[0] || 'Unknown'
}

// Validation helper
function validateImportRequest(body: Record<string, unknown>): ImportRequest | null {
  if (!body || typeof body !== 'object') {
    return null
  }
  
  // Security check: reject credential fields
  if (body.amazon_email || body.amazon_password || body.email || body.password) {
    throw new Error('INSECURE_REQUEST: Credential fields are not allowed in OAuth2 flow')
  }
  
  if (!body.user_id || typeof body.user_id !== 'string') {
    return null
  }
  
  if (!body.access_token || typeof body.access_token !== 'string') {
    return null
  }
  
  if (!body.access_token.match(/^[A-Za-z0-9\-._~+/]+=*$/)) {
    throw new Error('INVALID_TOKEN_FORMAT: Access token format is invalid')
  }
  
  const validatedRequest: ImportRequest = {
    user_id: body.user_id,
    access_token: body.access_token
  }
  
  if (body.date_range) {
    const dateRange = body.date_range as {
      start_date: string;
      end_date: string;
    }
    if (!dateRange.start_date || !dateRange.end_date) {
      return null
    }
    
    const startDate = new Date(dateRange.start_date)
    const endDate = new Date(dateRange.end_date)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return null
    }
    
    validatedRequest.date_range = {
      start_date: dateRange.start_date,
      end_date: dateRange.end_date
    }
  }
  
  if (body.import_options) {
    const options = body.import_options as {
      include_returns?: boolean;
      include_digital?: boolean;
      include_subscriptions?: boolean;
    }
    validatedRequest.import_options = {
      include_returns: Boolean(options.include_returns),
      include_digital: Boolean(options.include_digital),
      include_subscriptions: Boolean(options.include_subscriptions)
    }
  }
  
  return validatedRequest
}

// Main import function - now a lightweight controller
async function importAmazonHistory(request: ImportRequest): Promise<ImportResponse> {
  const startTime = Date.now()
  
  const result: ImportResponse = {
    success: false,
    message: "Amazon order history import failed",
    data: {
      total_orders: 0,
      imported_orders: 0,
      skipped_orders: 0,
      processing_time_ms: 0,
      import_id: `oauth_import_${Date.now()}_${request.user_id}`
    }
  }

  try {
    // Get scraper service URL and API key from environment
    const scraperServiceUrl = process.env.SCRAPER_SERVICE_URL
    const scraperApiKey = process.env.SCRAPER_API_KEY
    
    if (!scraperServiceUrl || !scraperApiKey) {
      throw new Error('Scraper service configuration missing')
    }
    
    // Call the scraper microservice
    const scraperResponse = await fetch(scraperServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${scraperApiKey}`
      },
      body: JSON.stringify({
        retailer: 'amazon',
        auth: {
          type: 'oauth',
          token: request.access_token
        },
        date_range: request.date_range,
        import_options: request.import_options
      })
    })
    
    if (!scraperResponse.ok) {
      const errorData = await scraperResponse.json().catch(() => ({}))
      throw new Error(`Scraper service error: ${scraperResponse.status} - ${errorData.error || 'Unknown error'}`)
    }
    
    const scraperData: ScraperResponse = await scraperResponse.json()
    
    if (!scraperData.success) {
      throw new Error(`Scraping failed: ${scraperData.error || 'Unknown scraping error'}`)
    }
    
    // Process and store the scraped products in Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    let imported = 0
    let skipped = 0
    
    // Process products in batches
    const batchSize = 10
    const products = scraperData.products
    
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)
      
      for (const product of batch) {
        try {
          // Check for existing products to avoid duplicates
          const { data: existing } = await supabase
            .from('products')
            .select('id')
            .eq('user_id', request.user_id)
            .eq('product_name', product.name)
            .eq('purchase_date', product.purchase_date)
            .single()
            
          if (existing) {
            skipped++
            continue
          }
          
          // Prepare product data for insertion
          const productData = {
            user_id: request.user_id,
            product_name: sanitizeString(product.name),
            brand: extractBrandFromName(product.name),
            category: product.category || 'imported',
            purchase_date: product.purchase_date,
            purchase_price: product.price,
            currency: 'USD',
            purchase_location: 'Amazon',
            notes: `Imported from Amazon. Order #${product.external_id}`,
            product_url: '',
            product_image: product.image_url || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          // Insert into database
          const { error } = await supabase
            .from('products')
            .insert([productData])
            
          if (error) {
            console.error(`Database insertion failed for ${product.name}: ${error.message}`)
          } else {
            imported++
          }
          
        } catch (error) {
          console.error(`Error processing product: ${(error as Error).message}`)
        }
      }
      
      // Rate limiting between batches
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    // Update user's import history
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      await supabase
        .from('import_history')
        .insert([{
          user_id: request.user_id,
          import_type: 'amazon_oauth',
          total_items: products.length,
          imported_items: imported,
          skipped_items: skipped,
          error_count: 0,
          import_id: result.data!.import_id,
          created_at: new Date().toISOString()
        }])
      
      await supabase
        .from('users')
        .update({ 
          last_amazon_import: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', request.user_id)
    }
    
    // Compile final results
    result.success = true
    result.message = "Amazon order history imported successfully using OAuth2"
    result.data!.total_orders = products.length
    result.data!.imported_orders = imported
    result.data!.skipped_orders = skipped
    result.data!.processing_time_ms = Date.now() - startTime
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    
    console.error('Amazon OAuth2 import error:', error)
    
    result.success = false
    result.data!.processing_time_ms = processingTime
    
    // Determine specific error type and message
    if ((error as Error).message.includes('CAPTCHA')) {
      result.message = "Amazon requires CAPTCHA verification. Please try again later."
      result.error = {
        code: 'CAPTCHA_REQUIRED',
        details: 'Amazon presented a CAPTCHA challenge'
      }
    } else if ((error as Error).message.includes('AUTH_FAILED') || (error as Error).message.includes('401')) {
      result.message = "Failed to authenticate with Amazon. Please check your access token."
      result.error = {
        code: 'AUTH_FAILED',
        details: 'Authentication with Amazon failed'
      }
    } else if ((error as Error).message.includes('timeout')) {
      result.message = "Import operation timed out. Please try again with fewer pages."
      result.error = {
        code: 'TIMEOUT',
        details: 'Operation exceeded maximum execution time'
      }
    } else if ((error as Error).message.includes('Scraper service')) {
      result.message = "Scraper service unavailable. Please try again later."
      result.error = {
        code: 'SERVICE_UNAVAILABLE',
        details: (error as Error).message
      }
    } else {
      result.message = "Failed to import Amazon order history via OAuth2"
      result.error = {
        code: error instanceof Error ? error.name : 'OAUTH_IMPORT_ERROR',
        details: error instanceof Error ? error.message : 'OAuth2 import failed'
      }
    }
    
    // Clear access_token from memory immediately after use (security measure)
    request.access_token = '[CLEARED]'
  }

  return result
}

// POST handler
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate request method
    if (request.method !== 'POST') {
      return NextResponse.json(
        { 
          success: false, 
          message: "Method not allowed",
          error: { code: 'METHOD_NOT_ALLOWED', details: 'Only POST requests are accepted' }
        },
        { status: 405 }
      )
    }
    
    // Parse request body
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON in request body",
          error: { code: 'INVALID_JSON', details: 'Request body must be valid JSON' }
        },
        { status: 400 }
      )
    }

    // Validate request body structure and security constraints
    let validatedRequest: ImportRequest
    try {
      const validated = validateImportRequest(body)
      if (!validated) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid request format",
            error: { 
              code: 'INVALID_REQUEST', 
              details: 'Missing required fields: user_id, access_token' 
            }
          },
          { status: 400 }
        )
      }
      validatedRequest = validated
    } catch (securityError) {
      const errorMessage = securityError instanceof Error 
        ? securityError.message 
        : 'Request contains prohibited fields'
        
      return NextResponse.json(
        {
          success: false,
          message: "Security validation failed",
          error: { 
            code: 'SECURITY_VIOLATION', 
            details: errorMessage
          }
        },
        { status: 400 }
      )
    }
    
    // Call the main import function
    const result = await importAmazonHistory(validatedRequest)
    
    // Clear sensitive data from memory
    validatedRequest.access_token = '[CLEARED]'
    
    // Return appropriate HTTP status based on success
    const statusCode = result.success ? 200 : 500
    
    return NextResponse.json(result, { status: statusCode })
    
  } catch (error) {
    console.error('OAuth2 API route error:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error during OAuth2 import",
        error: {
          code: 'INTERNAL_ERROR',
          details: 'An unexpected error occurred while processing the OAuth2 import request'
        }
      },
      { status: 500 }
    )
  }
}