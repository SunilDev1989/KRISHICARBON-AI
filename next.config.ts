import type { NextConfig } from 'next';

/**
 * KrishiCarbon AI — Next.js Configuration
 * Single source of truth (replaces next.config.mjs)
 */
const nextConfig: NextConfig = {
  // Standalone output for Docker/Cloud Run — bundles only what's needed
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/**',
      },
      {
        protocol: 'https',
        hostname: 'openweathermap.org',
        pathname: '/img/wn/**',
      },
    ],
  },

  // Allow large payloads for audio/image uploads to API routes
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Security headers applied to every response
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Referrer policy — don't leak URL to external services
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // HSTS — enforce HTTPS for 1 year
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Permissions policy — disable unnecessary browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=(self)',
          },
          // Content-Security-Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval in dev
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://openweathermap.org",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://power.larc.nasa.gov https://api.openweathermap.org wss://*.firebaseio.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
