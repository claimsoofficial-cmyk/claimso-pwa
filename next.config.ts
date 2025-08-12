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
    
    // Reduce memory usage during build
    memoryBasedWorkers: false,
    
    // Disable heavy optimizations that consume memory
    optimizeCss: false,
  },
  
  // Reduce memory usage
  swcMinify: true,
  
  // Disable source maps to save memory
  productionBrowserSourceMaps: false,
  
  // Reduce bundle analysis overhead
  webpack: (config: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
    if (!dev && !isServer) {
      // Reduce memory usage in production builds
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 244000, // 244KB chunks
          cacheGroups: {
            default: false,
            vendors: false,
            // Create smaller vendor chunks
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
              maxSize: 244000,
            },
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;