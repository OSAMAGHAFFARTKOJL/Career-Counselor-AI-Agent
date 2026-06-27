import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typedRoutes: true,
  serverExternalPackages: ['mammoth', 'pdf-parse'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  },
};

export default nextConfig;
