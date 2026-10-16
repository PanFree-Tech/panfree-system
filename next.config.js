/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  customWorkerDir: 'worker',
  buildExcludes: [
    /app-build-manifest\.json$/,
    /_middlewareManifest\.js$/,
    /middleware-manifest\.json$/,
    /react-loadable-manifest\.json$/,
    /_ssgManifest\.js$/,
    /_buildManifest\.js$/,
    /server\/.*$/,
    /dynamic-css-manifest\.json$/,
  ],
  publicExcludes: ['!npl/**/*', '!api/**/*'],
  runtimeCaching: [
    {
      // HTML: NetworkFirst para evitar servir HTML viejo cacheado
      urlPattern: ({ request }) => request.destination === 'document',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'html-cache',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
    {
      // Estaticos de Next.js (con hash): CacheFirst es seguro
      urlPattern: /^\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    {
      // Imagenes Cloudinary: StaleWhileRevalidate
      urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'cloudinary-images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },
  ],
})

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['@axiomantic/llmlingua-2', '@huggingface/transformers', 'onnxruntime-node', 'web-push'],
  },
  images: {
    domains: ['res.cloudinary.com', 'images.unsplash.com', 'picsum.photos'],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
    ],
  },
}

module.exports = withPWA(nextConfig)
