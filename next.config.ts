/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable telemetry for faster builds
  experimental: {
    // Reduce build time by optimizing package imports
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-avatar',
      '@radix-ui/react-toast',
      '@radix-ui/react-label',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot'
    ],
    
    // Move heavy libraries to server-side only
    serverComponentsExternalPackages: ['pdf-lib', 'passkit-generator'],
  },
  
  // Optimize bundle size
  swcMinify: true,
  
  // Reduce static generation overhead
  output: 'standalone',
  
  // Disable source maps in production for faster builds
  productionBrowserSourceMaps: false,
};

export default nextConfig;