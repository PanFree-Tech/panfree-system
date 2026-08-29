/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
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
})

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
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
