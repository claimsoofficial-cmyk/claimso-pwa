import type { NextConfig } from 'next'

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // Optimize build process for memory efficiency
  experimental: {
    // Reduce package import optimization to save memory
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu'
    ],
    // Disable memory-intensive features
    webVitalsAttribution: ['CLS', 'LCP'],
  },
  
  // Disable source maps in production to save memory
  productionBrowserSourceMaps: false,
  
  // Optimize webpack configuration
  webpack: (config, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
    // Reduce memory usage during build
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Separate vendor chunks to reduce memory pressure
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name: 'lib',
              priority: 30,
              chunks: 'all',
            },
          },
        },
      };
    }
    
    // Reduce memory usage for large dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      // Alias heavy dependencies to reduce bundle size
    };
    
    return config;
  },
  
  // Reduce build output
  compress: true,
  
  // Optimize static generation
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  
  // Disable features that aren't needed
  poweredByHeader: false,
  
  // Configure output to reduce memory usage
  output: 'standalone',
  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;