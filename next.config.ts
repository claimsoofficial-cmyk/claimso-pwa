/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal config to reduce memory usage
  experimental: {
    // Only keep essential optimizations
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-avatar',
      '@radix-ui/react-toast',
      '@radix-ui/react-label',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot'
    ],
  },
  
  // Disable heavy features that consume memory
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Reduce static generation overhead
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
};

export default nextConfig;