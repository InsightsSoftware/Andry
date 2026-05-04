import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  turbopack: {
    resolveAlias: {
      // react-pdf: canvas not needed for SSR
      canvas: { browser: './empty-module.js' },
    },
  },
  webpack: (config) => {
    // react-pdf: fallback for webpack builds
    config.resolve.alias.canvas = false
    return config
  },
}

export default nextConfig
