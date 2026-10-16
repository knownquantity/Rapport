'use client';

import { useEffect, useState } from 'react';

const POLL_MS = 30_000;

export default function Counter({
  initialFreeRemaining,
}: {
  initialFreeRemaining: number;
}) {
  const [freeRemaining, setFreeRemaining] = useState(initialFreeRemaining);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch('/api/stats', { cache: 'no-store' });
        if (!res.ok) return;
        const data: { freeRemaining?: number } = await res.json();
        if (active && typeof data.freeRemaining === 'number') {
          setFreeRemaining(data.freeRemaining);
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

  const exhausted = freeRemaining <= 0;

  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-[#1a1a1a]/15 bg-white/60 px-4 py-2 text-sm font-medium text-[#1a1a1a]/80">
      <span
        aria-hidden
        className={`h-2 w-2 rounded-full ${exhausted ? 'bg-[#1a1a1a]/30' : 'bg-[#7a8f00]'}`}
      />
      {exhausted
        ? 'The first 100 are claimed — $5 each now'
        : `${freeRemaining} free names left`}
    </p>
  );
}
