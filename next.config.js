/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.leadconnectorhq.com']
  },
  // Temporarily disable PWA for Vercel deployment
  experimental: {
    workerThreads: false,
    cpus: 1
  }
};

module.exports = nextConfig;