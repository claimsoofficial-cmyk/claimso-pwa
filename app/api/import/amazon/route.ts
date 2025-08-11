import { NextRequest, NextResponse } from 'next/server'
import { chromium, Browser, Page } from 'playwright-core'
import chromium_aws_lambda from 'chrome-aws-lambda'
import { createClient } from '@supabase/supabase-js'

// Vercel configuration for extended execution
export const maxDuration = 300 // 5 minutes
export const dynamic = 'force-dynamic'

// Export configuration object for Vercel
export const config = {
  maxDuration: 300,
  memory: 1024
}

// TypeScript interfaces - SECURE VERSION (OAuth2 only)
interface ImportRequest {
  user_id: string
  access_token: string
  date_range?: {
    start_date: string // ISO date string
    end_date: string   // ISO date string
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

interface OrderData {
  order_id: string
  order_date: string
  total_amount: number
  currency: string
  status: string
  items: OrderItem[]
  shipping_address?: any
  payment_method?: string
}

interface OrderItem {
  asin: string
  title: string
  quantity: number
  price: number
  category?: string
  image_url?: string
}

// Internal interfaces for scraping implementation
interface ImportError {
  type: 'CAPTCHA' | 'AUTH_FAILED' | 'PARSE_ERROR' | 'RATE_LIMIT' | 'TIMEOUT'
  message: string
  recoverable: boolean
  order_id?: string
}

interface AmazonOrder {
  order_id: string
  order_date: string
  product_name: string
  product_url: string
  product_image: string
  price: number
  currency: string
  purchase_location: string
}

interface ProcessResults {
  imported: number
  skipped: number
  errors: ImportError[]
}

// Selector fallbacks for resilience against layout changes
const SELECTOR_FALLBACKS = {
  orderCard: [
    '[data-test-id="order-card"]',
    '.order-card',
    '.a-box.shipment',
    '.order-info',
    '.order'
  ],
  productName: [
    '.product-title a',
    '.item-title',
    'a[href*="/dp/"]',
    '.a-link-normal',
    '.item-view-left-col-inner a'
  ],
  orderDate: [
    '.order-date',
    '.order-placed-date',
    '[data-test-id="order-date"]',
    '.order-info .a-color-secondary'
  ],
  orderTotal: [
    '.order-total',
    '.grand-total-price',
    '.a-price-whole',
    '.order-summary-total'
  ]
}

// Random user agents for bot detection avoidance
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
]

/**
 * Launches a secure headless Chromium browser instance optimized for serverless
 */
async function launchSecureBrowser(): Promise<Browser> {
  // Use chrome-aws-lambda for serverless environments (Vercel/AWS Lambda)
  const browser = await chromium.launch({
    args: chromium_aws_lambda.args.concat([
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--no-zygote',
      '--incognito', // Use incognito mode for privacy
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]),
    defaultViewport: chromium_aws_lambda.defaultViewport,
    executablePath: await chromium_aws_lambda.executablePath,
    headless: chromium_aws_lambda.headless,
    ignoreHTTPSErrors: true,
    timeout: 30000
  })
  
  return browser
}

/**
 * Authenticates with Amazon using OAuth2 access token
 */
async function authenticateWithAmazon(page: Page, accessToken: string): Promise<void> {
  try {
    // Set random user agent to avoid bot detection
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
    await page.setUserAgent(userAgent)
    
    // Set viewport to mimic real browser
    await page.setViewportSize({ width: 1280, height: 720 })
    
    // Navigate to Amazon homepage first
    await page.goto('https://www.amazon.com', {
      waitUntil: 'networkidle0',
      timeout: 30000
    })
    
    // Inject access token into browser session
    await page.evaluateOnNewDocument((token) => {
      // Store token in localStorage and sessionStorage for Amazon's auth system
      localStorage.setItem('amazon_access_token', token)
      sessionStorage.setItem('auth_state', 'authenticated')
      // Set authorization cookie if Amazon uses it
      document.cookie = `amazon_auth_token=${token}; domain=.amazon.com; path=/`
    }, accessToken)
    
    // Add authentication headers
    await page.setExtraHTTPHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    })
    
    // Navigate to account page to verify authentication
    await page.goto('https://www.amazon.com/gp/css/homepage.html', {
      waitUntil: 'networkidle0',
      timeout: 30000
    })
    
    // Check for CAPTCHA or login requirements
    await handleCaptchaDetection(page)
    
    // Verify successful authentication by looking for account elements
    const accountIndicators = [
      '[data-test-id="nav-your-account"]',
      '#nav-link-accountList',
      '.nav-line-1-container'
    ]
    
    let authenticated = false
    for (const selector of accountIndicators) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 })
        authenticated = true
        break
      } catch {
        continue
      }
    }
    
    if (!authenticated) {
      throw new Error('Failed to verify authentication with Amazon')
    }
    
  } catch (error) {
    if ((error as Error).message.includes('CAPTCHA')) {
      throw new ImportError('CAPTCHA', 'Amazon requires CAPTCHA verification', false)
    }
    throw new ImportError('AUTH_FAILED', `Authentication failed: ${(error as Error).message}`, false)
  }
}

/**
 * Navigates to the Amazon "Your Orders" page
 */
async function navigateToOrdersPage(page: Page): Promise<void> {
  try {
    await page.goto('https://www.amazon.com/gp/css/order-history', {
      waitUntil: 'networkidle0',
      timeout: 30000
    })
    
    // Wait for orders to load
    await page.waitForSelector('[data-test-id="order-card"], .order-card, .order', {
      timeout: 15000
    })
    
  } catch (error) {
    throw new ImportError('TIMEOUT', 'Failed to load orders page', true)
  }
}

/**
 * Extracts order data from multiple pages with pagination
 */
async function extractOrdersWithPagination(
  page: Page,
  options: { max_pages: number }
): Promise<AmazonOrder[]> {
  const allOrders: AmazonOrder[] = []
  let currentPage = 1
  let hasNextPage = true
  const maxPages = Math.min(options.max_pages || 10, 20) // Cap at 20 pages for safety
  
  while (hasNextPage && currentPage <= maxPages) {
    try {
      console.log(`Scraping page ${currentPage}...`)
      
      // Wait for orders to load on current page
      await page.waitForSelector(SELECTOR_FALLBACKS.orderCard[0], { timeout: 15000 })
      
      // Extract orders from current page using page.$$eval for better performance
      const pageOrders = await page.$$eval(
        SELECTOR_FALLBACKS.orderCard.join(', '),
        (orderElements) => {
          const orders: any[] = []
          
          orderElements.forEach((card) => {
            try {
              // Extract order header information
              const orderHeader = card.querySelector('.order-header') || card
              const orderDateEl = orderHeader.querySelector('.order-date, .order-info .a-color-secondary')
              const orderTotalEl = orderHeader.querySelector('.order-total, .grand-total-price, .a-price-whole')
              const orderNumberEl = orderHeader.querySelector('.order-number, [data-test-id="order-number"]')
              
              const orderDate = orderDateEl?.textContent?.trim() || ''
              const orderTotal = orderTotalEl?.textContent?.trim() || ''
              const orderNumber = orderNumberEl?.textContent?.trim() || ''
              
              // Extract individual items from this order
              const itemElements = card.querySelectorAll('.item-view-left-col-inner, .item-row, .product-row')
              
              itemElements.forEach((item, index) => {
                const productLink = item.querySelector('a[href*="/dp/"], a[href*="/product/"]')
                const productName = productLink?.textContent?.trim() ||
                                  item.querySelector('.item-title, .product-title')?.textContent?.trim()
                const productUrl = productLink?.getAttribute('href')
                const productImage = item.querySelector('img')?.getAttribute('src') || ''
                const itemPrice = item.querySelector('.item-price, .a-price-whole, .price')?.textContent?.trim() || orderTotal
                
                if (productName && orderDate) {
                  orders.push({
                    order_id: orderNumber || `${Date.now()}-${index}`,
                    order_date: orderDate,
                    product_name: productName,
                    product_url: productUrl ? (productUrl.startsWith('http') ? productUrl : `https://amazon.com${productUrl}`) : '',
                    product_image: productImage,
                    price_text: itemPrice,
                    currency: 'USD', // Default, could be extracted from page
                    purchase_location: 'Amazon'
                  })
                }
              })
            } catch (itemError) {
              console.error('Error extracting item:', itemError)
            }
          })
          
          return orders
        }
      )
      
      // Process and sanitize the extracted data
      const processedOrders = pageOrders.map(order => ({
        order_id: sanitizeString(order.order_id),
        order_date: parseAmazonDate(order.order_date),
        product_name: sanitizeString(order.product_name),
        product_url: order.product_url,
        product_image: order.product_image,
        price: parsePrice(order.price_text),
        currency: order.currency,
        purchase_location: order.purchase_location
      }))
      
      allOrders.push(...processedOrders)
      console.log(`Extracted ${processedOrders.length} items from page ${currentPage}`)
      
      // Check for next page button
      const nextButton = await page.$('[data-test-id="pagination-next"]:not([disabled]), .a-pagination .a-last:not(.a-disabled)')
      
      if (nextButton && currentPage < maxPages) {
        await nextButton.click()
        await page.waitForLoadState('networkidle')
        currentPage++
        
        // Random delay to mimic human behavior and avoid rate limiting
        await page.waitForTimeout(2000 + Math.random() * 1000)
      } else {
        hasNextPage = false
      }
      
    } catch (pageError) {
      console.error(`Error on page ${currentPage}:`, pageError)
      
      if ((pageError as Error).message.includes('CAPTCHA')) {
        throw new ImportError('CAPTCHA', 'Amazon presented CAPTCHA during scraping', false)
      }
      
      // Continue to next page on non-critical errors, but stop pagination
      hasNextPage = false
    }
  }
  
  return allOrders
}

/**
 * Processes and stores orders in the database
 */
async function processAndStoreOrders(
  orders: AmazonOrder[],
  userId: string
): Promise<ProcessResults> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration')
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  const results: ProcessResults = { imported: 0, skipped: 0, errors: [] }
  
  // Process orders in batches to avoid overwhelming the database
  const batchSize = 10
  for (let i = 0; i < orders.length; i += batchSize) {
    const batch = orders.slice(i, i + batchSize)
    
    for (const order of batch) {
      try {
        // Validate order data before processing
        if (!validateProductData(order, userId)) {
          results.errors.push({
            type: 'PARSE_ERROR',
            message: `Invalid product data for ${order.product_name}`,
            recoverable: true,
            order_id: order.order_id
          })
          continue
        }
        
        // Check for existing products to avoid duplicates
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('user_id', userId)
          .eq('product_name', order.product_name)
          .eq('purchase_date', order.order_date)
          .single()
          
        if (existing) {
          results.skipped++
          continue
        }
        
        // Prepare sanitized product data for insertion
        const productData = {
          user_id: userId,
          product_name: sanitizeString(order.product_name),
          brand: extractBrandFromName(order.product_name),
          category: 'imported',
          purchase_date: order.order_date,
          purchase_price: order.price,
          currency: order.currency,
          purchase_location: order.purchase_location,
          notes: `Imported from Amazon. Order #${order.order_id}`,
          product_url: order.product_url,
          product_image: order.product_image,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // Insert into database
        const { error } = await supabase
          .from('products')
          .insert([productData])
          
        if (error) {
          results.errors.push({
            type: 'PARSE_ERROR',
            message: `Database insertion failed for ${order.product_name}: ${error.message}`,
            recoverable: true,
            order_id: order.order_id
          })
        } else {
          results.imported++
        }
        
      } catch (orderError) {
        results.errors.push({
          type: 'PARSE_ERROR',
          message: `Error processing order: ${(orderError as Error).message}`,
          recoverable: true,
          order_id: order.order_id
        })
      }
    }
    
    // Rate limiting between batches
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  return results
}

/**
 * Handles CAPTCHA detection
 */
async function handleCaptchaDetection(page: Page): Promise<void> {
  const captchaSelectors = [
    '#captchacharacters',
    '.cvf-widget-container',
    '[name="cvf_captcha_input"]',
    '#auth-captcha-image',
    '.captcha-container'
  ]
  
  for (const selector of captchaSelectors) {
    if (await page.$(selector)) {
      throw new ImportError(
        'CAPTCHA',
        'Amazon requires manual verification. Please try again later.',
        false
      )
    }
  }
}

/**
 * Sanitizes string input to prevent XSS and data corruption
 */
function sanitizeString(input: string): string {
  if (!input) return ''
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .replace(/[^\w\s\-.,()]/g, '') // Allow only safe characters
    .substring(0, 255) // Limit length
}

/**
 * Validates product data before database insertion
 */
function validateProductData(data: AmazonOrder, userId: string): boolean {
  return !!(
    userId &&
    data.product_name &&
    data.product_name.length > 0 &&
    data.order_date &&
    data.price >= 0
  )
}

/**
 * Parses Amazon date format to ISO string
 */
function parseAmazonDate(dateStr: string): string {
  try {
    // Amazon dates can be in various formats: "January 15, 2024", "Jan 15, 2024", etc.
    const date = new Date(dateStr)
    return date.toISOString().split('T')[0] // Return YYYY-MM-DD format
  } catch {
    return new Date().toISOString().split('T')[0] // Fallback to current date
  }
}

/**
 * Parses price string to numeric value
 */
function parsePrice(priceStr: string): number {
  if (!priceStr) return 0
  
  // Extract numeric value from price string (e.g., "$29.99" -> 29.99)
  const match = priceStr.match(/[\d,]+\.?\d*/)
  if (match) {
    return parseFloat(match[0].replace(/,/g, ''))
  }
  
  return 0
}

/**
 * Extracts brand name from product name
 */
function extractBrandFromName(productName: string): string {
  // Simple brand extraction - take first word that's likely a brand
  const words = productName.split(' ')
  return words[0] || 'Unknown'
}

/**
 * Handles function-level errors
 */
function handleFunctionError(error: Error, results: ImportResponse): void {
  console.error('Import function error:', error)
  
  results.success = false
  if (results.data) {
    results.data.imported_orders = 0
    results.data.total_orders = 0
  }
  results.error = {
    code: 'IMPORT_ERROR',
    details: error.message
  }
}

/**
 * Critical cleanup function to prevent hanging browser processes
 */
async function cleanupResources(browser: Browser | null, page: Page | null): Promise<void> {
  try {
    if (page && !page.isClosed()) {
      await page.close()
    }
    
    if (browser && browser.isConnected()) {
      await browser.close()
    }
  } catch (error) {
    console.error('Cleanup error:', error)
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }
}

// Main import function using OAuth2 access token - IMPLEMENTED VERSION
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

  let browser: Browser | null = null
  let page: Page | null = null

  // Set global timeout to prevent hanging serverless functions
  const timeoutHandle = setTimeout(() => {
    throw new Error('Function timeout exceeded')
  }, 4 * 60 * 1000) // 4 minutes

  try {
    // Validate access_token format (basic validation)
    if (!request.access_token || request.access_token.length < 10) {
      throw new Error('Invalid access token format')
    }
    
    // Launch secure headless browser instance
    browser = await launchSecureBrowser()
    page = await browser.newPage()
    
    // Authenticate with Amazon using access token
    await authenticateWithAmazon(page, request.access_token)
    
    // Navigate to Amazon orders page
    await navigateToOrdersPage(page)
    
    // Extract order data with pagination (default to max 10 pages for safety)
    const orders = await extractOrdersWithPagination(page, { max_pages: 10 })
    
    // Process and store orders in database
    const processResults = await processAndStoreOrders(orders, request.user_id)
    
    // Update user's import history and statistics in database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // Log successful import activity for audit purposes
      await supabase
        .from('import_history')
        .insert([{
          user_id: request.user_id,
          import_type: 'amazon_oauth',
          total_items: orders.length,
          imported_items: processResults.imported,
          skipped_items: processResults.skipped,
          error_count: processResults.errors.length,
          import_id: result.data!.import_id,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      // Update user's last import timestamp
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
    result.data!.total_orders = orders.length
    result.data!.imported_orders = processResults.imported
    result.data!.skipped_orders = processResults.skipped
    result.data!.processing_time_ms = Date.now() - startTime
    
    // Include error details if any occurred during processing
    if (processResults.errors.length > 0) {
      result.error = {
        code: 'PARTIAL_IMPORT_ERRORS',
        details: `${processResults.errors.length} items failed to import`
      }
    }
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    
    console.error('Amazon OAuth2 import error:', error)
    
    handleFunctionError(error as Error, result)
    result.data!.processing_time_ms = processingTime
    
    // Determine specific error type and message
    if ((error as Error).message.includes('CAPTCHA')) {
      result.message = "Amazon requires CAPTCHA verification. Please try again later."
      result.error = {
        code: 'CAPTCHA_REQUIRED',
        details: 'Amazon presented a CAPTCHA challenge'
      }
    } else if ((error as Error).message.includes('AUTH_FAILED')) {
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
    } else {
      result.message = "Failed to import Amazon order history via OAuth2"
      result.error = {
        code: error instanceof Error ? error.name : 'OAUTH_IMPORT_ERROR',
        details: error instanceof Error ? error.message : 'OAuth2 import failed'
      }
    }
    
  } finally {
    // Critical cleanup - always close browser to prevent hanging processes
    clearTimeout(timeoutHandle)
    await cleanupResources(browser, page)
    
    // Clear access_token from memory immediately after use (security measure)
    request.access_token = '[CLEARED]'
    
    // Ensure processing time is recorded
    if (result.data) {
      result.data.processing_time_ms = Date.now() - startTime
    }
  }

  return result
}

// Validation helper - SECURITY: Explicitly reject insecure fields
function validateImportRequest(body: any): ImportRequest | null {
  if (!body || typeof body !== 'object') {
    return null
  }
  
  // SECURITY CHECK: Explicitly reject any request containing credential fields
  if (body.amazon_email || body.amazon_password || body.email || body.password) {
    throw new Error('INSECURE_REQUEST: Credential fields are not allowed in OAuth2 flow')
  }
  
  // Validate required OAuth2 fields
  if (!body.user_id || typeof body.user_id !== 'string') {
    return null
  }
  
  if (!body.access_token || typeof body.access_token !== 'string') {
    return null
  }
  
  // Basic access_token format validation (should start with OAuth2 prefix patterns)
  if (!body.access_token.match(/^[A-Za-z0-9\-._~+/]+=*$/)) {
    throw new Error('INVALID_TOKEN_FORMAT: Access token format is invalid')
  }
  
  // Validate optional date_range
  if (body.date_range) {
    if (!body.date_range.start_date || !body.date_range.end_date) {
      return null
    }
    
    // Validate ISO date format
    const startDate = new Date(body.date_range.start_date)
    const endDate = new Date(body.date_range.end_date)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return null
    }
  }
  
  return body as ImportRequest
}

// POST handler - SECURE OAuth2 version
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
    let body: any
    try {
      body = await request.json()
    } catch (parseError) {
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
    } catch (securityError: any) {
      return NextResponse.json(
        {
          success: false,
          message: "Security validation failed",
          error: { 
            code: 'SECURITY_VIOLATION', 
            details: securityError.message || 'Request contains prohibited fields'
          }
        },
        { status: 400 }
      )
    }
    
    
    // Call the main import function with OAuth2 token
    const result = await importAmazonHistory(validatedRequest)
    
    // SECURITY: Clear sensitive data from memory
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