import { signIn } from '@/app/(auth)/auth';
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
  const guestUserId = cookieStore.get('guest_user_id')?.value;

  const signInOptions: Record<string, any> = {
    redirect: true,
    redirectTo: redirectUrl,
  };

  if (guestUserId) {
    signInOptions.guestUserId = guestUserId;
  }

  return signIn('guest', signInOptions);
}
