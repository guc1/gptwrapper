export default {
  locales: ['en', 'nl'],
  defaultLocale: 'en',
  pathnames: {
    '/api/:path*': {
      locale: false,
    },
  },
};
