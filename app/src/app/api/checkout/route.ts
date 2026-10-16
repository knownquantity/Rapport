import { NextResponse } from 'next/server';
import { siteUrl } from '@/lib/claims';
import { stripe } from '@/lib/stripe';
import { supabaseServer } from '@/lib/supabase';
import {
  normalizeEmail,
  validateEmail,
  validateSubdomain,
} from '@/lib/validation';

const BIO_MAX = 280;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const input = (body ?? {}) as {
    name?: unknown;
    email?: unknown;
    bio?: unknown;
  };

  const nameCheck = validateSubdomain(String(input.name ?? ''));
  if (!nameCheck.ok) {
    return NextResponse.json(
      { error: 'invalid_name', reason: nameCheck.reason },
      { status: 400 },
    );
  }

  const email = normalizeEmail(String(input.email ?? ''));
  if (!validateEmail(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  const bio =
    typeof input.bio === 'string' && input.bio.trim()
      ? input.bio.trim().slice(0, BIO_MAX)
      : null;

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: 'checkout_unavailable' }, { status: 500 });
  }

  const supabase = supabaseServer();

  const { data: existing, error: existingError } = await supabase
    .from('claims')
    .select('id, status')
    .eq('subdomain', nameCheck.name)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: 'lookup_failed' }, { status: 500 });
  }
  if (existing && existing.status === 'active') {
    return NextResponse.json({ error: 'taken' }, { status: 409 });
  }

  const token = crypto.randomUUID();

  let claimId: string;

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from('claims')
      .update({
        owner_email: email,
        bio,
        is_free: false,
        status: 'pending',
        metadata: { claim_token: token },
      })
      .eq('id', existing.id)
      .select('id')
      .maybeSingle();

    if (updateError || !updated) {
      return NextResponse.json({ error: 'reserve_failed' }, { status: 500 });
    }
    claimId = updated.id;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('claims')
      .insert({
        subdomain: nameCheck.name,
        owner_email: email,
        bio,
        is_free: false,
        status: 'pending',
        metadata: { claim_token: token },
      })
      .select('id')
      .maybeSingle();

    if (insertError || !inserted) {
      if (insertError?.code === '23505') {
        return NextResponse.json({ error: 'taken' }, { status: 409 });
      }
      return NextResponse.json({ error: 'reserve_failed' }, { status: 500 });
    }
    claimId = inserted.id;
  }

  const base = siteUrl();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      metadata: {
        subdomain: nameCheck.name,
        claim_id: claimId,
        claim_token: token,
      },
      success_url: `${base}/claim/success?subdomain=${encodeURIComponent(nameCheck.name)}`,
      cancel_url: `${base}/claim/cancel?subdomain=${encodeURIComponent(nameCheck.name)}`,
    });

    if (!session.url) throw new Error('missing checkout url');

    return NextResponse.json({ checkoutUrl: session.url });
  } catch {
    return NextResponse.json({ error: 'checkout_failed' }, { status: 500 });
  }
}
