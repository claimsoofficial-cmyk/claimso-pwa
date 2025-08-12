import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib'

// TypeScript interfaces
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
  user_id?: string // Critical for security validation
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

// Type guard functions
function isValidProduct(obj: unknown): obj is Product {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }
  
  const product = obj as Record<string, unknown>
  return (
    typeof product.id === 'string' &&
    typeof product.name === 'string'
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

// Text sanitization function to prevent PDF injection
function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }
  
  // Remove potential harmful characters and normalize whitespace
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[<>{}]/g, '') // Remove potential markup characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 1000) // Limit length to prevent abuse
}

// Generate safe filename from product name
function generateSafeFilename(productName: string): string {
  const safeName = productName
    .replace(/[^a-zA-Z0-9\-_\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .substring(0, 50) // Limit length
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
  
  return `Claimso-Packet-${safeName || 'Product'}.pdf`
}

// Main PDF generation function
async function generateWarrantyClaimPacket(request: GeneratePacketRequest): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create()
  
  // Add a page with standard letter size
  const page = pdfDoc.addPage(PageSizes.Letter)
  const { width, height } = page.getSize()
  
  // Load fonts
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  
  // Colors
  const blackColor = rgb(0, 0, 0)
  const grayColor = rgb(0.4, 0.4, 0.4)
  const blueColor = rgb(0.2, 0.4, 0.8)
  
  let yPosition = height - 50 // Start from top with margin
  
  // Helper function to add text and update position
  const addText = (text: string, x: number, fontSize: number, font = regularFont, color = blackColor) => {
    page.drawText(text, {
      x,
      y: yPosition,
      size: fontSize,
      font,
      color,
    })
    yPosition -= fontSize + 5 // Move down for next line
  }
  
  // Helper function to add section spacing
  const addSectionSpacing = (spacing: number = 20) => {
    yPosition -= spacing
  }
  
  // 1. Header Section
  addText('WARRANTY CLAIM PACKET', 50, 24, boldFont, blueColor)
  addText('CLAIMSO', width - 150, 16, boldFont, grayColor)
  addSectionSpacing(10)
  
  // Add a horizontal line
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: grayColor,
  })
  addSectionSpacing(20)
  
  // 2. Generation Date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  addText(`Generated: ${currentDate}`, 50, 12, regularFont, grayColor)
  addSectionSpacing()
  
  // 3. Prepared For Section
  addText('PREPARED FOR:', 50, 14, boldFont)
  addText(sanitizeText(request.user.name), 70, 12)
  addText(sanitizeText(request.user.email), 70, 12, regularFont, grayColor)
  addSectionSpacing()
  
  // 4. Product Details Section
  addText('PRODUCT DETAILS:', 50, 14, boldFont)
  addSectionSpacing(5)
  
  const productDetails = [
    ['Product Name:', sanitizeText(request.product.name)],
    ['Brand:', sanitizeText(request.product.brand || 'N/A')],
    ['Category:', sanitizeText(request.product.category || 'N/A')],
    ['Serial Number:', sanitizeText(request.product.serial_number || 'N/A')],
  ]
  
  productDetails.forEach(([label, value]) => {
    page.drawText(label, { x: 70, y: yPosition, size: 11, font: boldFont })
    page.drawText(value, { x: 200, y: yPosition, size: 11, font: regularFont })
    yPosition -= 16
  })
  addSectionSpacing()
  
  // 5. Purchase Information Section
  addText('PURCHASE INFORMATION:', 50, 14, boldFont)
  addSectionSpacing(5)
  
  const purchaseInfo = [
    ['Purchase Date:', sanitizeText(request.product.purchase_date || 'N/A')],
    ['Retailer:', sanitizeText(request.product.retailer || 'N/A')],
    ['Order Number:', sanitizeText(request.product.order_number || 'N/A')],
    ['Price:', request.product.price ? `${request.product.currency || '$'}${request.product.price}` : 'N/A'],
  ]
  
  purchaseInfo.forEach(([label, value]) => {
    page.drawText(label, { x: 70, y: yPosition, size: 11, font: boldFont })
    page.drawText(value, { x: 200, y: yPosition, size: 11, font: regularFont })
    yPosition -= 16
  })
  addSectionSpacing()
  
  // 6. Problem Description Section
  addText('PROBLEM DESCRIPTION:', 50, 14, boldFont)
  addSectionSpacing(5)
  
  // Wrap long text for problem description
  const sanitizedDescription = sanitizeText(request.problemDescription)
  const maxLineWidth = width - 140
  const words = sanitizedDescription.split(' ')
  let currentLine = ''
  
  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word
    const lineWidth = regularFont.widthOfTextAtSize(testLine, 11)
    
    if (lineWidth > maxLineWidth && currentLine) {
      addText(`"${currentLine}"`, 70, 11, regularFont)
      currentLine = word
    } else {
      currentLine = testLine
    }
  })
  
  if (currentLine) {
    addText(`"${currentLine}"`, 70, 11, regularFont)
  }
  addSectionSpacing()
  
  // 7. Supporting Evidence Section
  addText('SUPPORTING EVIDENCE:', 50, 14, boldFont)
  addSectionSpacing(5)
  addText('Photos/videos available upon request.', 70, 11, regularFont, grayColor)
  addText('Additional documentation can be provided as needed.', 70, 11, regularFont, grayColor)
  addSectionSpacing()
  
  // 8. Footer
  yPosition = 50 // Position at bottom
  page.drawLine({
    start: { x: 50, y: yPosition + 20 },
    end: { x: width - 50, y: yPosition + 20 },
    thickness: 1,
    color: grayColor,
  })
  
  page.drawText('Generated by CLAIMSO', {
    x: 50,
    y: yPosition,
    size: 10,
    font: regularFont,
    color: grayColor,
  })
  
  page.drawText(`Document ID: ${request.product.id}-${Date.now()}`, {
    x: width - 200,
    y: yPosition,
    size: 10,
    font: regularFont,
    color: grayColor,
  })
  
  // Serialize the PDF document
  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

// Validation helper function
function validateGeneratePacketRequest(body: unknown): GeneratePacketRequest | null {
  if (!body || typeof body !== 'object') {
    return null
  }
  
  const requestBody = body as Record<string, unknown>
  
  // Validate product object using type guard
  if (!isValidProduct(requestBody.product)) {
    return null
  }
  
  // Validate problem description
  if (!requestBody.problemDescription || typeof requestBody.problemDescription !== 'string') {
    return null
  }
  
  // Validate user object using type guard
  if (!isValidUser(requestBody.user)) {
    return null
  }
  
  return {
    product: requestBody.product,
    problemDescription: requestBody.problemDescription,
    user: requestBody.user
  }
}

// POST handler
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
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
    
    // Validate request body structure
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
    
    console.log('Generating warranty claim packet for product:', validatedRequest.product.id)
    
    // Generate the PDF
    const pdfBytes = await generateWarrantyClaimPacket(validatedRequest)
    
    // Generate safe filename
    const filename = generateSafeFilename(validatedRequest.product.name)
    
    console.log('Successfully generated PDF packet:', {
      productId: validatedRequest.product.id,
      filename,
      sizeBytes: pdfBytes.length
    })
    
    // Return PDF response with proper headers
    return new NextResponse(new Uint8Array(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBytes.length.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('PDF generation error:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate warranty claim packet",
        error: {
          code: 'PDF_GENERATION_ERROR',
          details: error instanceof Error ? error.message : 'An unexpected error occurred during PDF generation'
        }
      } as GeneratePacketResponse,
      { status: 500 }
    )
  }
}

// Export configuration for Vercel
export const dynamic = 'force-dynamic'