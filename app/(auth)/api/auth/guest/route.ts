import { signIn, auth } from '@/app/(auth)/auth';
import { isDevelopmentEnvironment } from '@/lib/constants';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get('redirectUrl') || '/';

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const cookieStore = cookies();
  const existingGuestId = cookieStore.get('guest-id')?.value;

  const signInOptions: Record<string, any> = {
    redirect: false,
    redirectTo: redirectUrl,
  };
  if (existingGuestId) signInOptions.id = existingGuestId;

  const url = await signIn('guest', signInOptions);

  const session = await auth();
  if (session?.user?.id && session.user.type === 'guest') {
    cookieStore.set('guest-id', session.user.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return NextResponse.redirect(url);
}
