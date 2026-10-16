import { cache } from 'react';
import { supabaseServer } from '@/lib/supabase';

export type Claim = {
  subdomain: string;
  bio: string | null;
  claimed_at: string;
  status: string;
};

export const getClaim = cache(
  async (subdomain: string): Promise<Claim | null> => {
    const { data, error } = await supabaseServer()
      .from('claims')
      .select('subdomain, bio, claimed_at, status')
      .eq('subdomain', subdomain)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
);

export const PENDING_TTL_MS = 24 * 60 * 60 * 1000;

export function isBlockingClaim(
  status: string,
  claimedAt: string,
  now: number = Date.now(),
): boolean {
  if (status === 'active') return true;
  if (status === 'pending') return now - Date.parse(claimedAt) < PENDING_TTL_MS;
  return false;
}

export { claimUrl, siteUrl } from '@/lib/site';

export function formatClaimedAt(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(iso));
}
