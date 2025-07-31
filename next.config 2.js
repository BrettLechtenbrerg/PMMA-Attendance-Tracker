/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['images.leadconnectorhq.com', 'assets.cdn.filesafe.space'],
  },
}

module.exports = nextConfig