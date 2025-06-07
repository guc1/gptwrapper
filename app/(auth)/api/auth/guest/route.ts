import { signIn, auth } from '@/app/(auth)/auth';
import { isDevelopmentEnvironment } from '@/lib/constants';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get('redirectUrl') || '/';

  const cookieStore = await cookies();
  const existingGuestId = cookieStore.get('guest-user-id')?.value;

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  await signIn('guest', {
    redirect: false,
    redirectTo: redirectUrl,
    guestId: existingGuestId,
  });

  const session = await auth();
  if (session?.user?.id) {
    cookieStore.set('guest-user-id', session.user.id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
