import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'orgbling.s3.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;
