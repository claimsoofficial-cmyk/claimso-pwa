import { type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { PKPass } from 'passkit-generator';



// ==============================================================================
// CONFIGURATION & ENVIRONMENT VALIDATION
// ==============================================================================

const PASSKIT_CERT = process.env.PASSKIT_CERT;
const PASSKIT_KEY = process.env.PASSKIT_KEY;
const PASSKIT_KEY_PASSPHRASE = process.env.PASSKIT_KEY_PASSPHRASE;
const WWDR_CERT = process.env.WWDR_CERT; // Apple's WWDR intermediate certificate
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!PASSKIT_CERT || !PASSKIT_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required environment variables for pass generation');
}

// ==============================================================================
// TYPESCRIPT INTERFACES
// ==============================================================================

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
}

interface PassAssets {
  passJson: Record<string, unknown>;
  iconBuffer: Buffer;
  logoBuffer?: Buffer;
  icon2xBuffer?: Buffer;
  logo2xBuffer?: Buffer;
}

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

/**
 * Loads pass template and assets from file system or environment
 */
async function loadPassAssets(): Promise<PassAssets> {
  try {
    // Define the base pass template
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: process.env.PASS_TYPE_IDENTIFIER || 'pass.com.claimso.smartpass',
      teamIdentifier: process.env.APPLE_TEAM_ID || 'YOUR_TEAM_ID',
      organizationName: 'CLAIMSO',
      description: 'CLAIMSO Smart Pass - Personal Warranty Assistant',
      logoText: 'CLAIMSO',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(37, 99, 235)', // Blue-600
      labelColor: 'rgb(255, 255, 255)',
      generic: {
        primaryFields: [
          {
            key: 'title',
            label: 'Smart Pass',
            value: 'Personal Warranty Assistant'
          }
        ],
        secondaryFields: [
          {
            key: 'status',
            label: 'Status',
            value: 'Active'
          },
          {
            key: 'products',
            label: 'Products Protected',
            value: 'Loading...'
          }
        ],
        auxiliaryFields: [
          {
            key: 'member-since',
            label: 'Member Since',
            value: new Date().getFullYear().toString()
          }
        ],
        backFields: [
          {
            key: 'description',
            label: 'About CLAIMSO Smart Pass',
            value: 'Your personal warranty assistant that helps you track purchases, manage warranties, and file claims with confidence.'
          },
          {
            key: 'features',
            label: 'Features',
            value: '• Real-time warranty notifications\n• Automatic receipt processing\n• Smart claim assistance\n• Universal product tracking'
          },
          {
            key: 'support',
            label: 'Support',
            value: 'Need help? Visit claimso.com/support or email hello@claimso.com'
          }
        ]
      },
      barcodes: [
        {
          message: '', // Will be populated with user ID
          format: 'PKBarcodeFormatQR',
          messageEncoding: 'iso-8859-1'
        }
      ],
      locations: [], // Could add relevant locations in the future
      maxDistance: 1000,
      relevantDate: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)).toISOString(), // Valid for 1 year
      expirationDate: new Date(Date.now() + (2 * 365 * 24 * 60 * 60 * 1000)).toISOString(), // Expires in 2 years
    };

    // Load or generate icon (in production, these should be proper image files)
    // For now, we'll create a simple SVG-based icon as fallback
    const iconBuffer = await generateDefaultIcon();
    
    return {
      passJson,
      iconBuffer,
      // Additional assets can be added here
      // logoBuffer: await fs.promises.readFile(path.join(process.cwd(), 'assets/pass/logo.png')),
      // icon2xBuffer: await fs.promises.readFile(path.join(process.cwd(), 'assets/pass/icon@2x.png')),
    };
  } catch (error) {
    console.error('Error loading pass assets:', error);
    throw new Error('Failed to load pass assets');
  }
}

/**
 * Generates a simple default icon as a fallback
 * In production, this should be replaced with proper branded assets
 */
async function generateDefaultIcon(): Promise<Buffer> {
  // Simple SVG icon as base64 encoded PNG would be better in production
  const svgIcon = `
    <svg width="29" height="29" viewBox="0 0 29 29" xmlns="http://www.w3.org/2000/svg">
      <rect width="29" height="29" rx="6" fill="#2563eb"/>
      <path d="M14.5 7L19 11.5L14.5 16L10 11.5L14.5 7Z" fill="white"/>
      <rect x="10" y="17" width="9" height="2" rx="1" fill="white"/>
      <rect x="12" y="20" width="5" height="1.5" rx="0.75" fill="white"/>
    </svg>
  `;
  
  // In production, you'd convert SVG to PNG buffer or use actual PNG files
  // For now, return the SVG as a buffer (this is a simplified approach)
  return Buffer.from(svgIcon, 'utf-8');
}

/**
 * Gets user's product count for display on pass
 */
async function getUserProductCount(userId: string, supabase: Record<string, unknown>): Promise<number> {
  try {
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_archived', false);
    
    return count || 0;
  } catch (error) {
    console.error('Error fetching user product count:', error);
    return 0;
  }
}

// ==============================================================================
// MAIN API HANDLER
// ==============================================================================

/**
 * GET handler for Apple Wallet pass generation
 * 
 * Security: Requires authenticated user session
 * Output: .pkpass file with proper headers for wallet integration
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // ==============================================================================
    // AUTHENTICATION & USER VALIDATION
    // ==============================================================================

    // Get cookies for session management
    const cookieStore = cookies();

    // Create server-side Supabase client
    const supabase = createServerClient(
      SUPABASE_URL!,
      SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(_name: string, _value: string, _options: CookieOptions) {
            // Server components are read-only, so we don't set cookies here
          },
          remove(_name: string, _options: CookieOptions) {
            // Server components are read-only, so we don't remove cookies here
          },
        },
      }
    );

    // Check for authenticated user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('Unauthorized pass generation attempt');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const userProfile: UserProfile = {
      id: profile.id,
      full_name: profile.full_name,
      email: user.email || '',
    };

    console.log(`Generating pass for user: ${userProfile.id}`);

    // ==============================================================================
    // PASS GENERATION
    // ==============================================================================

    // Load pass assets and template
    const assets = await loadPassAssets();
    
    // Get user's product count for display
    const productCount = await getUserProductCount(userProfile.id, supabase);

    // Customize pass with user data
    const customizedPassJson = {
      ...assets.passJson,
      serialNumber: userProfile.id, // Use user ID as serial number
      generic: {
        ...assets.passJson.generic,
        secondaryFields: [
          ...assets.passJson.generic.secondaryFields.filter((field: Record<string, unknown>) => field.key !== 'products'),
          {
            key: 'products',
            label: 'Products Protected',
            value: productCount.toString()
          }
        ],
        backFields: [
          ...assets.passJson.generic.backFields,
          {
            key: 'user-info',
            label: 'Vault Owner',
            value: `${userProfile.full_name || 'User'}\n${userProfile.email}`
          }
        ]
      },
      barcodes: [
        {
          ...assets.passJson.barcodes[0],
          message: userProfile.id // QR code contains user ID
        }
      ]
    };

    // Decode certificates from environment variables (base64 encoded)
    const certificates = {
      signerCert: Buffer.from(PASSKIT_CERT, 'base64'),
      signerKey: Buffer.from(PASSKIT_KEY, 'base64'),
      signerKeyPassphrase: PASSKIT_KEY_PASSPHRASE || '',
      // Apple's WWDR certificate (if provided)
      ...(WWDR_CERT && { wwdr: Buffer.from(WWDR_CERT, 'base64') })
    };

    // Create the pass
    const pass = new PKPass(
      customizedPassJson,
      {
        'icon.png': assets.iconBuffer,
        // Add more assets as needed
        ...(assets.logoBuffer && { 'logo.png': assets.logoBuffer }),
        ...(assets.icon2xBuffer && { 'icon@2x.png': assets.icon2xBuffer }),
        ...(assets.logo2xBuffer && { 'logo@2x.png': assets.logo2xBuffer }),
      },
      certificates
    );

    // Generate the pass buffer
    const passBuffer = pass.getAsBuffer();

    const processingTime = Date.now() - startTime;
    console.log(`Pass generated successfully in ${processingTime}ms for user: ${userProfile.id}`);

    // ==============================================================================
    // RESPONSE WITH PROPER HEADERS
    // ==============================================================================

    // Return the pass with proper headers for Apple Wallet
    return new NextResponse(passBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': 'attachment; filename="CLAIMSO-SmartPass.pkpass"',
        'Content-Length': passBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Pass generation error:', error);

    // Log error details for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        processingTime
      });
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate pass',
        message: 'Please try again later or contact support if the issue persists.'
      },
      { status: 500 }
    );
  }
}

// ==============================================================================
// OPTIONAL: POST HANDLER FOR PASS UPDATES
// ==============================================================================

/**
 * POST handler for updating existing passes (future enhancement)
 * This would be called by Apple's pass update service
 */
export async function POST(_request: NextRequest): Promise<NextResponse> {
  // TODO: Implement pass update logic
  // This would handle requests from Apple's servers to update passes
  // when users' data changes (e.g., new products added)
  
  return NextResponse.json(
    { message: 'Pass updates not implemented yet' },
    { status: 501 }
  );
}

// ==============================================================================
// HEALTH CHECK
// ==============================================================================

/**
 * Simple health check endpoint
 */
export async function HEAD(_request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}