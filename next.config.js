/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
    unoptimized: true, // Enable this for external image URLs
  },
  experimental: {
    serverActions: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Ignore TypeScript errors during build
  },
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors during build
  },
  api: {
    // Increase timeout to 2 minutes for image generation
    responseTimeout: 120000,
    // Increase body size limit for image data
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
}

module.exports = nextConfig
