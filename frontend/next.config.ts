import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporarily commented out for dev server - uncomment for production static export
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  /* config options here */
};

export default nextConfig;
