import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseServer } from '@/lib/supabase';

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get('stripe-signature');

  if (!secret || !signature) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const subdomain = session.metadata?.subdomain;
    const claimId = session.metadata?.claim_id;

    if (claimId || subdomain) {
      const paymentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : (session.payment_intent?.id ?? session.id);

      let query = supabaseServer()
        .from('claims')
        .update({ status: 'active', stripe_payment_id: paymentId })
        .eq('status', 'pending');

      query = claimId
        ? query.eq('id', claimId)
        : query.eq('subdomain', subdomain as string);

      const { error } = await query;

      if (error) {
        return NextResponse.json({ error: 'update_failed' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
