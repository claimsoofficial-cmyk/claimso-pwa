// file: next.config.ts

import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@supabase/ssr'], // Changed from experimental.serverComponentsExternalPackages
};

export default nextConfig;