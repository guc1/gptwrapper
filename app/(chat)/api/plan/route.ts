import { NextResponse } from 'next/server';
import { auth, unstable_update } from '@/app/(auth)/auth';
import { db } from '@/lib/db/drizzle-client';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const PLAN_MAP: Record<string, 'basic' | 'gemiddeld' | 'top' | undefined> = {
  'basic-model': 'basic',
  'gemiddeld-model': 'gemiddeld',
  'top-model': 'top',
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { planId } = await req.json();
  const type = PLAN_MAP[planId];
  if (!type) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  await db.update(user).set({ type }).where(eq(user.id, session.user.id));
  await unstable_update({ user: { type } });

  return NextResponse.json({ success: true });
}
