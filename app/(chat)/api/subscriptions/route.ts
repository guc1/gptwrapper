import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getUserSubscriptions } from '@/lib/db/queries';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subs = await getUserSubscriptions({ userId: session.user.id });
  return NextResponse.json({ subscriptions: subs });
}
