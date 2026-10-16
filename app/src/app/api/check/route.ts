import { NextResponse } from 'next/server';
import { isBlockingClaim } from '@/lib/claims';
import { supabaseServer } from '@/lib/supabase';
import { validateSubdomain } from '@/lib/validation';

export async function GET(request: Request) {
  const input = new URL(request.url).searchParams.get('name') ?? '';
  const result = validateSubdomain(input);

  if (!result.ok) {
    return NextResponse.json({ available: false, reason: result.reason });
  }

  const { data, error } = await supabaseServer()
    .from('claims')
    .select('status, claimed_at')
    .eq('subdomain', result.name)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { available: false, reason: 'error' },
      { status: 500 },
    );
  }

  const taken = data ? isBlockingClaim(data.status, data.claimed_at) : false;

  return taken
    ? NextResponse.json({ available: false, reason: 'taken' })
    : NextResponse.json({ available: true });
}
