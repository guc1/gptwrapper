import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    turbo: {},
  },
  i18n: {
    locales: ['en', 'nl'],
    defaultLocale: 'en',
  },
  env: {
    NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET
      ? 'true'
      : 'false',
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
      {
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
