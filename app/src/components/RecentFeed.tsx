'use client';

import { useEffect, useState } from 'react';
import { claimUrl } from '@/lib/site';
import type { RecentClaim } from '@/lib/stats';

const POLL_MS = 30_000;

const dateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

function hostLabel(subdomain: string): string {
  try {
    return new URL(claimUrl(subdomain)).host;
  } catch {
    return subdomain;
  }
}

export default function RecentFeed({
  initialRecent,
}: {
  initialRecent: RecentClaim[];
}) {
  const [recent, setRecent] = useState(initialRecent);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch('/api/stats', { cache: 'no-store' });
        if (!res.ok) return;
        const data: { recent?: RecentClaim[] } = await res.json();
        if (active && Array.isArray(data.recent)) {
          setRecent(data.recent);
        }
      } catch {
        // transient network errors are ignored; next poll will retry
      }
    };

    const id = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (recent.length === 0) {
    return (
      <p className="text-sm text-[#1a1a1a]/60">
        No names claimed yet. Be the first.
      </p>
    );
  }

  return (
    <ul className="flex w-full flex-col divide-y divide-[#1a1a1a]/10">
      {recent.map((claim) => (
        <li key={claim.subdomain} className="flex items-center justify-between gap-4 py-3">
          <a
            href={claimUrl(claim.subdomain)}
            className="font-medium break-all underline decoration-[#1a1a1a]/25 underline-offset-4 transition-colors hover:decoration-[#1a1a1a]"
          >
            {hostLabel(claim.subdomain)}
          </a>
          <span className="shrink-0 text-sm text-[#1a1a1a]/50">
            {dateFmt.format(new Date(claim.claimed_at))}
          </span>
        </li>
      ))}
    </ul>
  );
}
