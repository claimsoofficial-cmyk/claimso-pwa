// file: next.config.ts

import { NextConfig } from 'next';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  experimental: {
    // This is the definitive fix for the server-side build memory error.
    // It tells Next.js to not bundle the Supabase SSR library, as it will be
    // available in the Vercel runtime. This prevents the build process from
    // getting stuck analyzing Supabase's complex dependencies.
    serverComponentsExternalPackages: ['@supabase/ssr'],
  },
  // We do not need a custom webpack config for this issue.
  // The `serverComponentsExternalPackages` option is the modern, targeted solution.
};

export default nextConfig;