import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    turbo: {},
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

const withNextIntl = createNextIntlPlugin('./next-intl.config.mjs');

export default withNextIntl(nextConfig);
