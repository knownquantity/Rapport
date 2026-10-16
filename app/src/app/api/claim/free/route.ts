import { NextResponse } from 'next/server';
import { claimUrl, isBlockingClaim } from '@/lib/claims';
import { supabaseServer } from '@/lib/supabase';
import {
  normalizeEmail,
  validateEmail,
  validateSubdomain,
} from '@/lib/validation';

const FREE_TIER_CAP = Number(process.env.FREE_TIER_CAP ?? '100');
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

  const supabase = supabaseServer();

  const { data: existing, error: existingError } = await supabase
    .from('claims')
    .select('id, status, claimed_at')
    .eq('subdomain', nameCheck.name)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: 'lookup_failed' }, { status: 500 });
  }
  if (existing && isBlockingClaim(existing.status, existing.claimed_at)) {
    return NextResponse.json({ error: 'taken' }, { status: 409 });
  }

  const { count, error: countError } = await supabase
    .from('claims')
    .select('id', { count: 'exact', head: true })
    .eq('is_free', true)
    .eq('status', 'active');

  if (countError) {
    return NextResponse.json({ error: 'lookup_failed' }, { status: 500 });
  }
  if ((count ?? 0) >= FREE_TIER_CAP) {
    return NextResponse.json(
      { error: 'free_tier_exhausted', reason: 'free_tier_exhausted' },
      { status: 409 },
    );
  }

  const token = crypto.randomUUID();
  const values = {
    owner_email: email,
    bio,
    is_free: true,
    status: 'active',
    stripe_payment_id: null,
    metadata: { claim_token: token },
  };

  const { data: claim, error: writeError } = existing
    ? await supabase
        .from('claims')
        .update(values)
        .eq('id', existing.id)
        .select('subdomain, claimed_at')
        .maybeSingle()
    : await supabase
        .from('claims')
        .insert({ subdomain: nameCheck.name, ...values })
        .select('subdomain, claimed_at')
        .maybeSingle();

  if (writeError || !claim) {
    if (writeError?.code === '23505') {
      return NextResponse.json({ error: 'taken' }, { status: 409 });
    }
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
  }

  return NextResponse.json(
    {
      url: claimUrl(nameCheck.name),
      subdomain: nameCheck.name,
      token,
      claimed_at: claim?.claimed_at ?? null,
    },
    { status: 201 },
  );
}
