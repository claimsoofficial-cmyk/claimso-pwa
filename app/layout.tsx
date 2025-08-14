// file: app/layout.tsx

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Claimso - Smart Warranty Management',
  description: 'Track warranties, manage claims, and get cash for your products with Claimso. The smart way to manage your purchases and protect your investments.',
  keywords: 'warranty management, product tracking, warranty claims, extended warranty, product protection',
  authors: [{ name: 'Claimso Team' }],
  creator: 'Claimso',
  publisher: 'Claimso',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://claimso.com',
    title: 'Claimso - Smart Warranty Management',
    description: 'Track warranties, manage claims, and get cash for your products with Claimso.',
    siteName: 'Claimso',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Claimso - Smart Warranty Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Claimso - Smart Warranty Management',
    description: 'Track warranties, manage claims, and get cash for your products with Claimso.',
    images: ['/images/og-image.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Claimso',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Claimso" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Claimso" />
        <meta name="description" content="Smart warranty management for your products" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Favicon */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#2563eb" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Performance Monitoring Scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Page Load Time
              window.addEventListener('load', function() {
                const loadTime = performance.now();
                console.log('Page load time:', loadTime + 'ms');
                
                // Send to analytics if available
                if (window.gtag) {
                  gtag('event', 'timing_complete', {
                    name: 'load',
                    value: Math.round(loadTime)
                  });
                }
              });
              
              // Core Web Vitals
              if ('PerformanceObserver' in window) {
                // Largest Contentful Paint (LCP)
                new PerformanceObserver((list) => {
                  const entries = list.getEntries();
                  const lastEntry = entries[entries.length - 1];
                  console.log('LCP:', lastEntry.startTime + 'ms');
                  
                  if (window.gtag) {
                    gtag('event', 'largest_contentful_paint', {
                      value: Math.round(lastEntry.startTime)
                    });
                  }
                }).observe({ entryTypes: ['largest-contentful-paint'] });
                
                // First Input Delay (FID)
                new PerformanceObserver((list) => {
                  const entries = list.getEntries();
                  entries.forEach((entry) => {
                    console.log('FID:', entry.processingStart - entry.startTime + 'ms');
                    
                    if (window.gtag) {
                      gtag('event', 'first_input_delay', {
                        value: Math.round(entry.processingStart - entry.startTime)
                      });
                    }
                  });
                }).observe({ entryTypes: ['first-input'] });
                
                // Cumulative Layout Shift (CLS)
                let clsValue = 0;
                new PerformanceObserver((list) => {
                  const entries = list.getEntries();
                  entries.forEach((entry) => {
                    if (!entry.hadRecentInput) {
                      clsValue += entry.value;
                      console.log('CLS:', clsValue);
                      
                      if (window.gtag) {
                        gtag('event', 'cumulative_layout_shift', {
                          value: Math.round(clsValue * 1000) / 1000
                        });
                      }
                    }
                  });
                }).observe({ entryTypes: ['layout-shift'] });
              }
            `,
          }}
        />
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} h-full`}>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  )
}