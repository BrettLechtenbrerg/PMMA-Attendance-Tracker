/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
<<<<<<< HEAD
    domains: ['images.leadconnectorhq.com', 'assets.cdn.filesafe.space'],
  },
}

module.exports = nextConfig
=======
    domains: ['images.leadconnectorhq.com']
  },
  // Temporarily disable PWA for Vercel deployment
  experimental: {
    workerThreads: false,
    cpus: 1
  }
};

module.exports = nextConfig;
>>>>>>> 3ce416773f59c772f8bf649a8433106ff38cacf0
