import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import stripe from '@/lib/stripe';
import { cancelUserModel } from '@/lib/db/queries';

const PRICE_MAP: Record<string, string | undefined> = {
  'basis-model': process.env.STRIPE_PRICE_BASIS_ID,
  'plus-model': process.env.STRIPE_PRICE_PLUS_ID,
  'top-model': process.env.STRIPE_PRICE_TOP_ID,
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { planId, reason } = await req.json();
  const priceId = PRICE_MAP[planId];
  if (!priceId) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  // Attempt to find subscription by customer email and price
  const customers = await stripe.customers.list({ email: session.user.email || undefined });
  if (customers.data.length > 0) {
    const customerId = customers.data[0].id;
    const subs = await stripe.subscriptions.list({ customer: customerId });
    const sub = subs.data.find((s) =>
      s.items.data.some((item) => item.price.id === priceId),
    );
    if (sub) {
      await stripe.subscriptions.update(sub.id, {
        cancel_at_period_end: true,
      });
    }
  }

  await cancelUserModel({ userId: session.user.id, modelId: planId });
  return NextResponse.json({ success: true });
}
