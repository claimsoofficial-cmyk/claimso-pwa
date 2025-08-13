'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AmazonConnectButtonProps {
  userId: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
  children?: React.ReactNode
}

/**
 * Amazon Connect Button Component
 * Initiates "Login with Amazon" OAuth flow for importing purchase history
 */
export default function AmazonConnectButton({ 
  userId, 
  variant = 'default',
  size = 'default',
  className,
  children 
}: AmazonConnectButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  /**
   * Generates a secure random state parameter for CSRF protection
   */
  const generateStateParameter = (): string => {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Constructs the Amazon OAuth authorization URL
   */
  const constructAmazonAuthUrl = (): string => {
    const clientId = process.env.NEXT_PUBLIC_AMAZON_CLIENT_ID
    const redirectUri = process.env.NEXT_PUBLIC_AMAZON_REDIRECT_URI
    
    if (!clientId || !redirectUri) {
      console.error('Missing Amazon OAuth configuration:', { clientId: !!clientId, redirectUri: !!redirectUri })
      throw new Error('Amazon OAuth not configured')
    }

    const state = generateStateParameter()
    
    // Store state in sessionStorage for verification after redirect
    sessionStorage.setItem('amazon_oauth_state', state)
    sessionStorage.setItem('amazon_oauth_user_id', userId)
    
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      scope: 'profile', // Minimal scope for now, can be expanded for order history access
      redirect_uri: `${window.location.origin}/api/auth/amazon/auth`,
      state: state
    })

    return `https://www.amazon.com/ap/oa?${params.toString()}`
  }

  /**
   * Handles the Amazon connection flow initiation
   */
  const handleAmazonConnect = async () => {
    try {
      setIsConnecting(true)

      // Construct the Amazon OAuth URL
      const amazonAuthUrl = constructAmazonAuthUrl()
      
      console.log('Initiating Amazon OAuth flow:', {
        userId,
        redirectUrl: amazonAuthUrl.split('?')[0] // Log base URL only for security
      })

      // Redirect to Amazon OAuth
      window.location.href = amazonAuthUrl

    } catch (error) {
      console.error('Error initiating Amazon connection:', error)
      setIsConnecting(false)
      
      // Show user-friendly error message
      alert('Failed to connect to Amazon. Please try again or contact support if the issue persists.')
    }
  }

  // Button styling variants
  const buttonVariants = {
    default: 'bg-[#FF9900] hover:bg-[#FF9900]/90 text-white border-[#FF9900]',
    outline: 'border-[#FF9900] text-[#FF9900] hover:bg-[#FF9900] hover:text-white',
    ghost: 'text-[#FF9900] hover:bg-[#FF9900]/10'
  }

  const buttonSizes = {
    sm: 'h-9 px-3 text-sm',
    default: 'h-11 px-6',
    lg: 'h-12 px-8 text-lg'
  }

  return (
    <button
      onClick={handleAmazonConnect}
      disabled={isConnecting}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9900] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        // Variant styles
        buttonVariants[variant],
        // Size styles
        buttonSizes[size],
        // Custom className
        className
      )}
    >
      {isConnecting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          {/* Amazon Logo SVG */}
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            className="shrink-0"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M.045 18.02c.072-.116.187-.18.295-.186.096 0 .2.04.295.186l3.876 6.155a.245.245 0 0 0 .295.186c.117 0 .234-.07.295-.186l3.876-6.155c.095-.146.2-.186.295-.186.108.006.223.07.295.186L12.96 24.175c.072.116.187.18.295.186.096 0 .2-.04.295-.186l3.876-6.155a.245.245 0 0 1 .295-.186c.117 0 .234.07.295.186l3.876 6.155c.095.146.2.186.295.186.108-.006.223-.07.295-.186L24 18.02c.072-.116.029-.21-.087-.21H.132c-.116 0-.159.094-.087.21zM8.4 9.047c0-.464.356-.82.82-.82h5.56c.464 0 .82.356.82.82v6.967c0 .464-.356.82-.82.82H9.22c-.464 0-.82-.356-.82-.82V9.047zm1.147 5.82h4.266V9.84H9.547v5.027zM2.013 6.109L.045 18.02h23.91L21.987 6.109a.82.82 0 0 0-.808-.7H2.821a.82.82 0 0 0-.808.7z"
            />
          </svg>

          {children || 'Connect Amazon Account'}
        </>
      )}
    </button>
  )
}

/**
 * Preset variants for common use cases
 */
export const AmazonConnectVariants = {
  /**
   * Primary CTA for empty states and main connection flow
   */
  Primary: (props: Omit<AmazonConnectButtonProps, 'variant' | 'size'>) => (
    <AmazonConnectButton {...props} variant="default" size="lg">
      <span className="flex items-center gap-2">
        Sync My Amazon Purchases
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded">FREE</span>
      </span>
    </AmazonConnectButton>
  ),

  /**
   * Secondary CTA for settings or additional connections
   */
  Settings: (props: Omit<AmazonConnectButtonProps, 'variant' | 'size'>) => (
    <AmazonConnectButton {...props} variant="outline" size="default">
      Connect Amazon
    </AmazonConnectButton>
  ),

  /**
   * Compact version for tight spaces
   */
  Compact: (props: Omit<AmazonConnectButtonProps, 'variant' | 'size'>) => (
    <AmazonConnectButton {...props} variant="ghost" size="sm">
      + Amazon
    </AmazonConnectButton>
  )
}