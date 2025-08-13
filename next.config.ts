/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is the definitive fix for Vercel's build tracer getting
  // confused by Supabase's complex, isomorphic dependencies.
  // It tells the build process to treat @supabase/ssr as an external
  // package that will be available in the runtime.
  serverExternalPackages: ['@supabase/ssr'],
};

export default nextConfig;