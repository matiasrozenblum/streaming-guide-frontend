// next.config.js

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Let next-pwa generate the service worker automatically
  runtimeCaching: [
    {
      urlPattern: /^https?.*/, 
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // appDir is now stable in Next.js 15, no need for experimental flag
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'luzutv.com.ar',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'gelatina.com.ar',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.luzutv.com.ar',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.gelatina.com.ar',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'acdn-us.mitiendanube.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fotos.perfil.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'yt3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'bjfgpzfszvcfzuiisocj.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'dwtkmfahaokhtpuafhsc.supabase.co',
        pathname: '/**',
      },
    ],
  },
};

module.exports = withPWA(nextConfig);
