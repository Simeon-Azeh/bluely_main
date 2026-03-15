import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // API proxy for development
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return {
        beforeFiles: [
          {
            source: '/api/:path*',
            destination: `${process.env.API_URL || 'http://localhost:5000'}/api/:path*`,
          },
        ],
      };
    }
    return {
      beforeFiles: [],
    };
  },
};

export default nextConfig;
