import { signIn } from '@/app/(auth)/auth';
import { isDevelopmentEnvironment } from '@/lib/constants';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isValidUUID } from '@/lib/utils';

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

  const cookieStore = await cookies();
  const storedId = cookieStore.get('guestUserId')?.value ?? null;
  const guestUserId = isValidUUID(storedId) ? storedId : undefined;

  return signIn('guest', {
    redirect: true,
    redirectTo: redirectUrl,
    guestUserId,
  });
}
