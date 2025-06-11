import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import createIntlMiddleware from 'next-intl/middleware';
import i18nConfig from './next-intl.config';
import { guestRegex, isDevelopmentEnvironment } from './lib/constants';

const intlMiddleware = createIntlMiddleware(i18nConfig);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const intlResponse = intlMiddleware(request);

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    const res = new Response('pong', { status: 200 });
    res.headers.set('X-NEXT-INTL-LOCALE', intlResponse.headers.get('X-NEXT-INTL-LOCALE') ?? '');
    return res;
  }

  if (pathname.includes('/api/auth')) {
    return intlResponse;
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (!token) {
    const redirectUrl = encodeURIComponent(request.url);

    const res = NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url),
    );
    res.headers.set('X-NEXT-INTL-LOCALE', intlResponse.headers.get('X-NEXT-INTL-LOCALE') ?? '');
    return res;
  }

  const isGuest = guestRegex.test(token?.email ?? '');

  if (token && !isGuest && ['/login', '/register'].includes(pathname)) {
    const res = NextResponse.redirect(new URL('/', request.url));
    res.headers.set('X-NEXT-INTL-LOCALE', intlResponse.headers.get('X-NEXT-INTL-LOCALE') ?? '');
    return res;
  }
  return intlResponse;
}

export const config = {
  matcher: [
    '/',
    '/chat/:id',
    '/api/:path*',
    '/login',
    '/register',

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
