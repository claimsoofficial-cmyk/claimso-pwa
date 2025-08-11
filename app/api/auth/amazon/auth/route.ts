import { NextRequest, NextResponse } from 'next/server'

// Amazon token endpoint
const AMAZON_TOKEN_URL = 'https://api.amazon.com/auth/o2/token'

// TypeScript interfaces for Amazon OAuth2 response
interface AmazonTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope?: string
}

interface AmazonTokenError {
  error: string
  error_description?: string
}

// GET handler for Amazon OAuth2 callback
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract search parameters from the callback URL
    const { searchParams } = new URL(request.url)
    const authCode = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    // Handle OAuth2 error responses from Amazon
    if (error) {
      console.error('Amazon OAuth2 error:', {
        error,
        error_description: errorDescription
      })
      
      return NextResponse.redirect(
        new URL(`/auth/error?error=amazon_oauth_error&message=${encodeURIComponent(errorDescription || error)}`, request.url)
      )
    }
    
    // Validate that authorization code is present
    if (!authCode) {
      console.error('Missing authorization code in callback')
      return NextResponse.redirect(
        new URL('/auth/error?error=missing_code&message=No authorization code received from Amazon', request.url)
      )
    }
    
    // Read OAuth2 credentials from environment variables
    const clientId = process.env.AMAZON_CLIENT_ID
    const clientSecret = process.env.AMAZON_CLIENT_SECRET
    const redirectUri = process.env.AMAZON_REDIRECT_URI || `${new URL(request.url).origin}/api/auth/amazon/callback`
    
    // Validate environment variables are configured
    if (!clientId || !clientSecret) {
      console.error('Missing Amazon OAuth2 environment variables')
      return NextResponse.redirect(
        new URL('/auth/error?error=config_error&message=OAuth2 configuration is incomplete', request.url)
      )
    }
    
    // TODO: Validate state parameter to prevent CSRF attacks
    // The state should match what was sent in the initial authorization request
    // Example:
    // const expectedState = await getStoredState(request) // from session/cookie
    // if (state !== expectedState) {
    //   return NextResponse.redirect(
    //     new URL('/auth/error?error=invalid_state&message=State parameter mismatch', request.url)
    //   )
    // }
    
    // Prepare form data for token exchange
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri
    })
    
    console.log('Exchanging authorization code for access token')
    
    // Make server-to-server request to Amazon's token endpoint
    const tokenResponse = await fetch(AMAZON_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'ClaimSO-Amazon-Integration/1.0'
      },
      body: tokenRequestBody.toString()
    })
    
    // Parse token response
    const tokenData = await tokenResponse.json()
    
    // Handle token exchange errors
    if (!tokenResponse.ok) {
      const errorData = tokenData as AmazonTokenError
      console.error('Amazon token exchange failed:', {
        status: tokenResponse.status,
        error: errorData.error,
        description: errorData.error_description
      })
      
      return NextResponse.redirect(
        new URL(`/auth/error?error=token_exchange_failed&message=${encodeURIComponent(errorData.error_description || errorData.error)}`, request.url)
      )
    }
    
    // Validate token response structure
    const tokens = tokenData as AmazonTokenResponse
    if (!tokens.access_token || !tokens.refresh_token) {
      console.error('Invalid token response from Amazon:', tokens)
      return NextResponse.redirect(
        new URL('/auth/error?error=invalid_token_response&message=Amazon returned invalid token data', request.url)
      )
    }
    
    console.log('Successfully received tokens from Amazon', {
      token_type: tokens.token_type,
      expires_in: tokens.expires_in,
      scope: tokens.scope,
      // NOTE: Never log actual token values
      has_access_token: !!tokens.access_token,
      has_refresh_token: !!tokens.refresh_token
    })
    
    // TODO: Get current user from session
    // Extract the authenticated user from the current session
    // Example:
    // const session = await getSession(request)
    // if (!session?.user?.id) {
    //   return NextResponse.redirect(
    //     new URL('/auth/error?error=no_session&message=User session not found', request.url)
    //   )
    // }
    // const userId = session.user.id
    
    // TODO: CRITICAL - Securely store tokens in database with encryption
    // The access_token and refresh_token are highly sensitive and must be encrypted at rest
    // Recommended approach using Supabase with pgsodium encryption:
    // 
    // import { createClient } from '@supabase/supabase-js'
    // const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    // 
    // const { error: dbError } = await supabase
    //   .from('user_amazon_tokens')
    //   .upsert({
    //     user_id: userId,
    //     // Encrypt tokens using pgsodium before storage
    //     access_token_encrypted: supabase.rpc('encrypt_secret', { 
    //       secret: tokens.access_token,
    //       key_id: process.env.ENCRYPTION_KEY_ID 
    //     }),
    //     refresh_token_encrypted: supabase.rpc('encrypt_secret', { 
    //       secret: tokens.refresh_token,
    //       key_id: process.env.ENCRYPTION_KEY_ID 
    //     }),
    //     token_type: tokens.token_type,
    //     expires_in: tokens.expires_in,
    //     expires_at: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
    //     scope: tokens.scope,
    //     created_at: new Date().toISOString(),
    //     updated_at: new Date().toISOString()
    //   })
    // 
    // if (dbError) {
    //   console.error('Failed to store Amazon tokens:', dbError)
    //   return NextResponse.redirect(
    //     new URL('/auth/error?error=storage_failed&message=Failed to save Amazon connection', request.url)
    //   )
    // }
    
    // TODO: Update user profile to indicate Amazon is connected
    // const { error: profileError } = await supabase
    //   .from('user_profiles')
    //   .update({
    //     amazon_connected: true,
    //     amazon_connected_at: new Date().toISOString(),
    //     last_updated: new Date().toISOString()
    //   })
    //   .eq('user_id', userId)
    
    // TODO: Log successful connection for audit trail
    // await supabase
    //   .from('user_activity_log')
    //   .insert({
    //     user_id: userId,
    //     action: 'amazon_oauth_connected',
    //     details: {
    //       token_type: tokens.token_type,
    //       expires_in: tokens.expires_in,
    //       scope: tokens.scope
    //     },
    //     created_at: new Date().toISOString()
    //   })
    
    // Clear sensitive data from memory
    tokens.access_token = '[CLEARED]'
    tokens.refresh_token = '[CLEARED]'
    
    console.log('Amazon OAuth2 connection completed successfully')
    
    // Redirect to dashboard with success status
    return NextResponse.redirect(
      new URL('/dashboard?status=amazon-connected&message=Amazon account successfully connected', request.url)
    )
    
  } catch (error) {
    console.error('Unexpected error in Amazon OAuth2 callback:', error)
    
    // Generic error redirect for unexpected failures
    return NextResponse.redirect(
      new URL('/auth/error?error=unexpected_error&message=An unexpected error occurred during Amazon authentication', request.url)
    )
  }
}

// Optional: Export configuration for Vercel
export const dynamic = 'force-dynamic'