import { supabaseServer } from '@/lib/supabase';

export type RecentClaim = {
  subdomain: string;
  claimed_at: string;
};

export type Stats = {
  freeRemaining: number;
  freeTierCap: number;
  totalClaims: number;
  recent: RecentClaim[];
};

export const FREE_TIER_CAP = Number(process.env.FREE_TIER_CAP ?? '100');

export async function getStats(): Promise<Stats> {
  const supabase = supabaseServer();

  const [active, free, recent] = await Promise.all([
    supabase
      .from('claims')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('claims')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('is_free', true),
    supabase
      .from('claims')
      .select('subdomain, claimed_at')
      .eq('status', 'active')
      .order('claimed_at', { ascending: false })
      .limit(20),
  ]);

  if (active.error || free.error || recent.error) {
    throw active.error ?? free.error ?? recent.error;
  }

  const freeCount = free.count ?? 0;

  return {
    freeRemaining: Math.max(0, FREE_TIER_CAP - freeCount),
    freeTierCap: FREE_TIER_CAP,
    totalClaims: active.count ?? 0,
    recent: (recent.data ?? []) as RecentClaim[],
  };
}
