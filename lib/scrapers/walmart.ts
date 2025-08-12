import { chromium, Browser, Page } from 'playwright';

interface ScrapedProduct {
  external_id: string;
  name: string;
  price: number;
  purchase_date: string;
  image_url?: string;
  retailer: string;
  category?: string;
}

interface WalmartOrderItem {
  productName: string;
  price: string;
  orderDate: string;
  imageUrl?: string;
  orderId: string;
}

/**
 * Scrapes Walmart purchase history using provided credentials
 * @param username - Walmart account username/email
 * @param password - Walmart account password
 * @returns Promise<ScrapedProduct[]> - Array of scraped products
 */
export async function importFromWalmart(
  username: string,
  password: string
): Promise<ScrapedProduct[]> {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // Launch browser with security-focused options
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images', // Speed up loading
      ],
    });

    // Create context with user agent and viewport settings
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 }
    });

    page = await context.newPage();

    // Step 1: Navigate to Walmart login page
    console.log('Navigating to Walmart login page...');
    await page.goto('https://www.walmart.com/account/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Step 2: Fill in login credentials
    console.log('Filling in login credentials...');
    
    // Wait for email input and fill it
    const emailSelector = 'input[name="email"], input[type="email"], #email';
    await page.waitForSelector(emailSelector, { timeout: 10000 });
    await page.fill(emailSelector, username);

    // Wait for password input and fill it
    const passwordSelector = 'input[name="password"], input[type="password"], #password';
    await page.waitForSelector(passwordSelector, { timeout: 10000 });
    await page.fill(passwordSelector, password);

    // Step 3: Submit login form
    console.log('Submitting login form...');
    const loginButtonSelector = 'button[type="submit"], button[data-automation-id="signin-submit-btn"], .login-submit-btn';
    
    // Click the login button
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }),
      page.click(loginButtonSelector)
    ]);

    // Step 4: Check for login success or handle errors
    await page.waitForTimeout(3000); // Give page time to load

    // Check if we're still on login page (indicating failed login)
    const currentUrl = page.url();
    if (currentUrl.includes('/account/login') || currentUrl.includes('/signin')) {
      // Look for error messages
      const errorSelectors = [
        '.error-message',
        '.field-error',
        '[data-automation-id="generic-error"]',
        '.notification-error'
      ];
      
      for (const selector of errorSelectors) {
        const errorElement = await page.$(selector);
        if (errorElement) {
          const errorText = await errorElement.textContent();
          if (errorText?.includes('password') || errorText?.includes('email')) {
            throw new Error('Invalid login credentials');
          }
        }
      }
      
      throw new Error('Login failed - please check your credentials');
    }

    // Check for 2FA or CAPTCHA
    const pageContent = await page.textContent('body');
    if (pageContent?.includes('verification code') || 
        pageContent?.includes('two-factor') || 
        pageContent?.includes('captcha') ||
        pageContent?.includes('security check')) {
      throw new Error('Two-factor authentication or CAPTCHA detected. This is not currently supported.');
    }

    // Step 5: Navigate to purchase history/orders page
    console.log('Navigating to purchase history...');
    await page.goto('https://www.walmart.com/orders', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Step 6: Scrape order data
    console.log('Scraping order data...');
    const orders = await scrapeWalmartOrders(page);

    // Step 7: Convert to our standard format
    const products: ScrapedProduct[] = orders.map((item, index) => ({
      external_id: `walmart_${item.orderId}_${index}`,
      name: item.productName,
      price: parsePrice(item.price),
      purchase_date: formatDate(item.orderDate),
      image_url: item.imageUrl,
      retailer: 'walmart',
      category: 'General', // Walmart doesn't always provide clear categories
    }));

    console.log(`Successfully scraped ${products.length} products from Walmart`);
    return products;

  } catch (error) {
    console.error('Walmart scraper error:', error);
    
    if (error instanceof Error) {
      // Re-throw with more context if needed
      throw error;
    } else {
      throw new Error('Unknown error occurred during Walmart import');
    }
  } finally {
    // Always cleanup browser resources
    if (page) {
      try {
        await page.close();
      } catch (closeError) {
        console.error('Error closing page:', closeError);
      }
    }
    
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
}

/**
 * Scrapes order items from the Walmart orders page
 */
async function scrapeWalmartOrders(page: Page): Promise<WalmartOrderItem[]> {
  const orders: WalmartOrderItem[] = [];

  try {
    // Wait for orders to load
    await page.waitForSelector('[data-testid="orders-list"], .orders-container, .order-card', {
      timeout: 15000,
    });

    // Scrape orders using multiple possible selectors
    const orderItems = await page.$$eval(
      '.order-card, [data-testid="order-card"], .order-item, .purchase-history-item',
      (elements) => {
        return elements.map((element) => {
          // Extract product name
          const nameElement = element.querySelector(
            '.product-name, [data-testid="product-name"], .item-name, h3, h4'
          );
          const productName = nameElement?.textContent?.trim() || 'Unknown Product';

          // Extract price
          const priceElement = element.querySelector(
            '.price, [data-testid="price"], .cost, .amount, .total'
          );
          const price = priceElement?.textContent?.trim() || '$0.00';

          // Extract order date
          const dateElement = element.querySelector(
            '.order-date, [data-testid="order-date"], .date, .purchase-date'
          );
          const orderDate = dateElement?.textContent?.trim() || new Date().toISOString();

          // Extract image URL
          const imageElement = element.querySelector('img');
          const imageUrl = imageElement?.src || imageElement?.getAttribute('data-src') || '';

          // Extract order ID
          const orderIdElement = element.querySelector(
            '.order-id, [data-testid="order-id"], .order-number'
          );
          const orderId = orderIdElement?.textContent?.trim() || 
                          `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          return {
            productName,
            price,
            orderDate,
            imageUrl,
            orderId,
          };
        });
      }
    );

    orders.push(...orderItems);

    // Try to load more orders if there's a "Load More" button
    const loadMoreButton = await page.$('.load-more, [data-testid="load-more"], .show-more');
    if (loadMoreButton) {
      try {
        await loadMoreButton.click();
        await page.waitForTimeout(2000);
        // Recursively scrape additional orders
        const additionalOrders = await scrapeWalmartOrders(page);
        orders.push(...additionalOrders);
      } catch (loadMoreError) {
        console.log('Could not load more orders:', loadMoreError);
      }
    }

  } catch (scrapeError) {
    console.error('Error scraping Walmart orders:', scrapeError);
    // Don't throw here, return what we have
  }

  return orders;
}

/**
 * Parse price string to number
 */
function parsePrice(priceString: string): number {
  if (!priceString) return 0;
  
  // Remove currency symbols and extract number
  const cleanPrice = priceString.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleanPrice);
  
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format date to ISO string
 */
function formatDate(dateString: string): string {
  if (!dateString) return new Date().toISOString();
  
  try {
    // Try to parse the date string
    const parsed = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(parsed.getTime())) {
      return new Date().toISOString();
    }
    
    return parsed.toISOString();
  } catch (dateError) {
    console.error('Error parsing date:', dateError);
    return new Date().toISOString();
  }
}