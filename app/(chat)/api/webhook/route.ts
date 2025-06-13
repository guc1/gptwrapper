import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import stripeLib from '@/lib/stripe';
import { addUserModel } from '@/lib/db/queries';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  let event: Stripe.Event;
  try {
    event = stripeLib.webhooks.constructEvent(
      body,
      signature || '',
      process.env.STRIPE_WEBHOOK_SECRET || '',
    );
  } catch (err) {
    console.warn('Stripe webhook verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice;
    const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
    if (subId) {
      const subscription = await stripeLib.subscriptions.retrieve(subId);
      const userId = subscription.metadata.userId;
      const planId = subscription.metadata.planId;
      if (userId && planId) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        await addUserModel({ userId, modelId: planId, expiresAt });
      }
    }
  }

  return NextResponse.json({ received: true });
}
