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
  }
}

module.exports = nextConfig
