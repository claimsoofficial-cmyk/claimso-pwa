export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface CredentialedScrapeRequest {
  retailer: string;
  username: string;
  password: string;
}

interface ScrapedProduct {
  external_id: string;
  name: string;
  price: number;
  purchase_date: string;
  image_url?: string;
  retailer: string;
  category?: string;
}

interface ScraperResponse {
  success: boolean;
  retailer: string;
  products: ScrapedProduct[];
  count: number;
  error?: string;
  type?: string;
  recoverable?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = await createClient();

    // Get the current user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to continue.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse and validate the request body
    let body: CredentialedScrapeRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body. Expected JSON.' },
        { status: 400 }
      );
    }

    const { retailer, username, password } = body;

    // Validate required fields
    if (!retailer || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: retailer, username, and password are required.' },
        { status: 400 }
      );
    }

    // Validate retailer is supported
    const supportedRetailers = ['walmart', 'target', 'bestbuy'];
    if (!supportedRetailers.includes(retailer.toLowerCase())) {
      return NextResponse.json(
        { error: `Unsupported retailer: ${retailer}. Supported retailers: ${supportedRetailers.join(', ')}` },
        { status: 400 }
      );
    }

    // Get scraper service configuration
    const scraperServiceUrl = process.env.SCRAPER_SERVICE_URL;
    const scraperApiKey = process.env.SCRAPER_API_KEY;
    
    if (!scraperServiceUrl || !scraperApiKey) {
      console.error('Missing scraper service configuration');
      return NextResponse.json(
        { error: 'Scraper service unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    let scrapedProducts: ScrapedProduct[] = [];

    // Call the scraper microservice
    try {
      const scraperResponse = await fetch(scraperServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${scraperApiKey}`
        },
        body: JSON.stringify({
          retailer: retailer.toLowerCase(),
          auth: {
            type: 'credentials',
            username: username,
            password: password
          }
        })
      });

      if (!scraperResponse.ok) {
        const errorData = await scraperResponse.json().catch(() => ({}));
        
        // Handle specific scraper service errors with user-friendly messages
        if (scraperResponse.status === 401) {
          return NextResponse.json(
            { error: 'Login failed. Please check your username and password.' },
            { status: 401 }
          );
        }
        
        if (scraperResponse.status === 422) {
          return NextResponse.json(
            { error: 'Two-factor authentication or CAPTCHA detected. Please try again later.' },
            { status: 422 }
          );
        }

        throw new Error(`Scraper service error: ${scraperResponse.status} - ${errorData.error || 'Unknown error'}`);
      }

      const scraperData: ScraperResponse = await scraperResponse.json();
      
      if (!scraperData.success) {
        throw new Error(scraperData.error || 'Unknown scraping error');
      }

      scrapedProducts = scraperData.products;

    } catch (scraperError) {
      console.error(`Scraper error for ${retailer}:`, scraperError);
      
      // Handle common scraper errors with user-friendly messages
      const errorMessage = scraperError instanceof Error ? scraperError.message : 'Unknown scraper error';
      
      if (errorMessage.includes('login') || errorMessage.includes('authentication')) {
        return NextResponse.json(
          { error: 'Login failed. Please check your username and password.' },
          { status: 401 }
        );
      }
      
      if (errorMessage.includes('2FA') || errorMessage.includes('captcha')) {
        return NextResponse.json(
          { error: 'Two-factor authentication or CAPTCHA detected. Please try again later.' },
          { status: 422 }
        );
      }

      if (errorMessage.includes('Scraper service error')) {
        return NextResponse.json(
          { error: 'Scraper service unavailable. Please try again later.' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: `Failed to import from ${retailer}. Please try again later.` },
        { status: 500 }
      );
    }

    // Insert scraped products into the database
    if (scrapedProducts.length > 0) {
      const productsToInsert = scrapedProducts.map((product) => ({
        external_id: product.external_id,
        product_name: product.name,
        brand: product.category || 'Unknown',
        category: product.category || 'imported',
        purchase_date: product.purchase_date,
        purchase_price: product.price,
        currency: 'USD',
        purchase_location: product.retailer,
        product_image: product.image_url || '',
        notes: `Imported from ${product.retailer}`,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { data: insertedProducts, error: insertError } = await supabase
        .from('products')
        .insert(productsToInsert)
        .select('id, product_name, purchase_location');

      if (insertError) {
        console.error('Database insertion error:', insertError);
        return NextResponse.json(
          { error: 'Failed to save imported products. Please try again.' },
          { status: 500 }
        );
      }

      // Update user_connections table to mark as connected
      const { error: connectionError } = await supabase
        .from('user_connections')
        .upsert({
          user_id: userId,
          retailer: retailer.toLowerCase(),
          status: 'connected',
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (connectionError) {
        console.error('Connection update error:', connectionError);
        // Don't fail the request if connection update fails
      }

      return NextResponse.json({
        success: true,
        message: `Successfully imported ${scrapedProducts.length} products from ${retailer}`,
        imported_count: scrapedProducts.length,
        products: insertedProducts,
      });
    } else {
      // No products found, but connection was successful
      const { error: connectionError } = await supabase
        .from('user_connections')
        .upsert({
          user_id: userId,
          retailer: retailer.toLowerCase(),
          status: 'connected',
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (connectionError) {
        console.error('Connection update error:', connectionError);
      }

      return NextResponse.json({
        success: true,
        message: `Connected to ${retailer} successfully, but no products were found in your purchase history.`,
        imported_count: 0,
        products: [],
      });
    }
  } catch (error) {
    console.error('Credentialed scrape API error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}