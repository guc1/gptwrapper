import { getRequestConfig, requestLocale } from 'next-intl/server';

export default getRequestConfig(async () => {
  const locale = await requestLocale();
  return {
    messages: (await import(`../locales/${locale}.json`)).default,
  };
});
