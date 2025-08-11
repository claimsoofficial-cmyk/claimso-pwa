import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { importFromWalmart } from '@/lib/scrapers/walmart';
// Import other scrapers as needed
// import { importFromTarget } from '@/lib/scrapers/target';

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

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

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

    let scrapedProducts: ScrapedProduct[] = [];

    // Call the appropriate scraper function based on retailer
    try {
      switch (retailer.toLowerCase()) {
        case 'walmart':
          scrapedProducts = await importFromWalmart(username, password);
          break;
        case 'target':
          // scrapedProducts = await importFromTarget(username, password);
          throw new Error('Target scraper not yet implemented');
        case 'bestbuy':
          // scrapedProducts = await importFromBestBuy(username, password);
          throw new Error('Best Buy scraper not yet implemented');
        default:
          throw new Error(`No scraper available for ${retailer}`);
      }
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

      return NextResponse.json(
        { error: `Failed to import from ${retailer}. Please try again later.` },
        { status: 500 }
      );
    }

    // Insert scraped products into the database
    if (scrapedProducts.length > 0) {
      const productsToInsert = scrapedProducts.map((product) => ({
        ...product,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { data: insertedProducts, error: insertError } = await supabase
        .from('products')
        .insert(productsToInsert)
        .select('id, name, retailer');

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