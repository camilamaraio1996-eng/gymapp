import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  experimental: {
    allowedRevalidateHeaderKeys: [],
  },
  serverExternalPackages: [],
}

// @ts-ignore
nextConfig.allowedDevOrigins = ['192.168.0.2', '127.0.0.1', 'localhost']

export default nextConfig
