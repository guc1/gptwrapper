import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { auth } from '@/app/(auth)/auth';

const PRICE_MAP: Record<string, string | undefined> = {
  'basic-model': process.env.STRIPE_PRICE_BASIC_ID,
  'gemiddeld-model': process.env.STRIPE_PRICE_GEMIDDELD_ID,
  'top-model': process.env.STRIPE_PRICE_TOP_ID,
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { planId } = await req.json();
  const priceId = PRICE_MAP[planId];
  if (!priceId) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=true`,
    customer_email: session.user.email ?? undefined,
    metadata: { userId: session.user.id, planId },
  });

  return NextResponse.json({ url: checkout.url });
}
