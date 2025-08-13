import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ==============================================================================
// TYPESCRIPT INTERFACES
// ==============================================================================

interface Product {
  id: string
  name: string
  brand?: string
  serial_number?: string
  purchase_date?: string
  order_number?: string
  retailer?: string
  price?: number
  currency?: string
  category?: string
  user_id: string
}

interface GeneratePacketRequest {
  product: Product
  problemDescription: string
  user: {
    name: string
    email: string
  }
}

interface GeneratePacketResponse {
  success: boolean
  message: string
  error?: {
    code: string
    details: string
  }
}

// ==============================================================================
// CONFIGURATION
// ==============================================================================

function getServiceConfig() {
  const SERVICES_URL = process.env.SERVICES_URL
  const SERVICES_API_KEY = process.env.SERVICES_API_KEY

  if (!SERVICES_URL || !SERVICES_API_KEY) {
    throw new Error('Missing required service configuration: SERVICES_URL or SERVICES_API_KEY')
  }

  return { SERVICES_URL, SERVICES_API_KEY }
}

// ==============================================================================
// VALIDATION HELPERS
// ==============================================================================

function isValidProduct(obj: unknown): obj is Product {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }
  
  const product = obj as Record<string, unknown>
  return (
    typeof product.id === 'string' &&
    typeof product.name === 'string' &&
    typeof product.user_id === 'string'
  )
}

function isValidUser(obj: unknown): obj is { name: string; email: string } {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }
  
  const user = obj as Record<string, unknown>
  return (
    typeof user.name === 'string' &&
    typeof user.email === 'string'
  )
}

function validateGeneratePacketRequest(body: unknown): GeneratePacketRequest | null {
  if (!body || typeof body !== 'object') {
    return null
  }
  
  const requestBody = body as Record<string, unknown>
  
  if (!isValidProduct(requestBody.product)) {
    return null
  }
  
  if (!requestBody.problemDescription || typeof requestBody.problemDescription !== 'string') {
    return null
  }
  
  if (!isValidUser(requestBody.user)) {
    return null
  }
  
  return {
    product: requestBody.product,
    problemDescription: requestBody.problemDescription,
    user: requestBody.user
  }
}

// ==============================================================================
// SERVICE COMMUNICATION
// ==============================================================================

/**
 * Calls the microservice to generate PDF
 */
async function generatePdfWithService(request: GeneratePacketRequest, servicesUrl: string, apiKey: string): Promise<Response> {
  const response = await fetch(`${servicesUrl}/pdf-generator`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`Service responded with status: ${response.status}`)
  }

  return response
}

// ==============================================================================
// MAIN HANDLER
// ==============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Step 1: Initialize services
    const { SERVICES_URL, SERVICES_API_KEY } = getServiceConfig()
    const supabase = await createClient()

    // Step 2: Authentication check
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Step 3: Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON in request body",
          error: { code: 'INVALID_JSON', details: 'Request body must be valid JSON' }
        } as GeneratePacketResponse,
        { status: 400 }
      )
    }
    
    const validatedRequest = validateGeneratePacketRequest(body)
    if (!validatedRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request format",
          error: { 
            code: 'INVALID_REQUEST', 
            details: 'Missing required fields: product (with id, name), problemDescription, user (with name, email)' 
          }
        } as GeneratePacketResponse,
        { status: 400 }
      )
    }

    // Step 4: Verify product ownership
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, product_name as name, brand, serial_number, purchase_date, retailer, purchase_price as price, currency, category, user_id')
      .eq('id', validatedRequest.product.id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
          error: { code: 'PRODUCT_NOT_FOUND', details: 'The specified product does not exist' }
        } as GeneratePacketResponse,
        { status: 404 }
      )
    }

    if (product.user_id !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied",
          error: { code: 'FORBIDDEN', details: 'You do not have permission to access this product' }
        } as GeneratePacketResponse,
        { status: 403 }
      )
    }

    // Step 5: Prepare request for microservice
    const serviceRequest: GeneratePacketRequest = {
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        serial_number: product.serial_number,
        purchase_date: product.purchase_date,
        retailer: product.retailer,
        price: product.price,
        currency: product.currency,
        category: product.category,
        user_id: product.user_id
      },
      problemDescription: validatedRequest.problemDescription,
      user: validatedRequest.user
    }

    console.log('Generating warranty claim packet for product:', product.id)

    // Step 6: Call microservice to generate PDF
    const pdfResponse = await generatePdfWithService(serviceRequest, SERVICES_URL, SERVICES_API_KEY)
    
    // Step 7: Get PDF data and generate filename
    const pdfBuffer = await pdfResponse.arrayBuffer()
    const safeProductName = product.name.replace(/[^a-zA-Z0-9\-_]/g, '_')
    const filename = `Claimso-Packet-${safeProductName}.pdf`

    console.log('Successfully generated PDF packet:', {
      productId: product.id,
      filename,
      sizeBytes: pdfBuffer.byteLength
    })

    // Step 8: Return PDF with proper headers
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('PDF generation error:', error)
    
    // Check if it's a service communication error
    if (error instanceof Error && error.message.includes('Service responded with status:')) {
      return NextResponse.json(
        {
          success: false,
          message: "Service temporarily unavailable",
          error: {
            code: 'SERVICE_ERROR',
            details: 'PDF generation service is currently unavailable. Please try again later.'
          }
        } as GeneratePacketResponse,
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate warranty claim packet",
        error: {
          code: 'INTERNAL_ERROR',
          details: error instanceof Error ? error.message : 'An unexpected error occurred during PDF generation'
        }
      } as GeneratePacketResponse,
      { status: 500 }
    )
  }
}

// ==============================================================================
// EXPORT CONFIGURATION
// ==============================================================================

export const dynamic = 'force-dynamic'