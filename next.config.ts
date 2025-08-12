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
  },
  
  // Move heavy libraries to server-side only (updated for Next.js 15)
  serverExternalPackages: ['pdf-lib', 'passkit-generator'],
};

export default nextConfig;