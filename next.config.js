/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.leadconnectorhq.com', 'assets.cdn.filesafe.space'],
  },
  eslint: {
    // Only run ESLint on these directories during production builds
    dirs: ['src'],
  },
  typescript: {
    // Only run TypeScript checking on these directories during production builds
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig