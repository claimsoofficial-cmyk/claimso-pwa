import { NextConfig } from 'next';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // This is a workaround for a build issue with chrome-aws-lambda.
    // The library is not fully compatible with modern bundlers like Webpack,
    // causing errors when it tries to parse non-JS files (.map files).
    // By marking it as an "external" module, we tell Next.js not to
    // bundle it during the build process. The dependency will be
    // available in the Vercel serverless runtime.
    
    // We only want to apply this rule for the server-side build, not the client-side.
    if (isServer) {
      config.externals = [...config.externals, 'chrome-aws-lambda'];
    }

    return config;
  },
};

export default nextConfig;