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

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rapport.computer').replace(
    /\/$/,
    '',
  );
}

export function formatClaimedAt(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(iso));
}
