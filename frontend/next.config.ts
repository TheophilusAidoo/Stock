import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Netlify requires trailingSlash for proper routing
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Remove output: 'standalone' - let Netlify plugin handle it
  /* config options here */
};

export default nextConfig;
