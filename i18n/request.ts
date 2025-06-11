import { getRequestConfig, requestLocale } from 'next-intl/server';

export default getRequestConfig(async () => {
  const locale = await requestLocale();
  return {
    locale,
    messages: (await import(`../locales/${locale}.json`)).default,
  };
});
