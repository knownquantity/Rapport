'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { siteUrl } from '@/lib/site';
import {
  normalizeEmail,
  normalizeSubdomain,
  validateEmail,
  validateSubdomain,
  type ValidationReason,
} from '@/lib/validation';

type Status = 'idle' | 'checking' | 'available' | 'unavailable';

type Check = {
  name: string;
  available: boolean;
  reason: string | null;
};

const REASON_MESSAGES: Record<ValidationReason | 'taken', string> = {
  empty: 'Enter a name.',
  too_short: 'Names need at least 3 characters.',
  too_long: 'Names can be at most 30 characters.',
  invalid_characters: 'Use lowercase letters, numbers, and hyphens only.',
  reserved: 'That name is reserved.',
  taken: 'That name is already claimed.',
};

function reasonMessage(reason: string | null): string {
  if (!reason) return 'Not available.';
  return REASON_MESSAGES[reason as ValidationReason | 'taken'] ?? 'Not available.';
}

function hostSuffix(): string {
  try {
    return `.${new URL(siteUrl()).hostname}`;
  } catch {
    return '.rapport.computer';
  }
}

export default function ClaimForm({
  initialFreeRemaining,
}: {
  initialFreeRemaining: number;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [check, setCheck] = useState<Check | null>(null);
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [freeRemaining, setFreeRemaining] = useState(initialFreeRemaining);

  const normalized = normalizeSubdomain(name);
  const suffix = hostSuffix();

  useEffect(() => {
    let active = true;
    fetch('/api/stats', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data && typeof data.freeRemaining === 'number') {
          setFreeRemaining(data.freeRemaining);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!normalized || !validateSubdomain(normalized).ok) return;

    const controller = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/check?name=${encodeURIComponent(normalized)}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        setCheck({
          name: normalized,
          available: Boolean(data.available),
          reason: data.reason ?? null,
        });
      } catch {
        // aborted or network error; leave status as checking/idle
      }
    }, 300);

    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [normalized]);

  const local = validateSubdomain(normalized);

  let status: Status;
  let reason: string | null = null;

  if (!normalized) {
    status = 'idle';
  } else if (!local.ok) {
    status = 'unavailable';
    reason = local.reason;
  } else if (check && check.name === normalized) {
    status = check.available ? 'available' : 'unavailable';
    reason = check.available ? null : (check.reason ?? 'taken');
  } else {
    status = 'checking';
  }

  const emailValid = validateEmail(email);
  const canSubmit =
    status === 'available' && emailValid && !submitting && normalized !== '';
  const priceLabel = freeRemaining > 0 ? 'Free' : '$5';

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (status !== 'available') return;
    if (!emailValid) {
      setError('Enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: normalized,
        email: normalizeEmail(email),
        bio: bio.trim() || undefined,
      };

      if (freeRemaining > 0) {
        const res = await fetch('/api/claim/free', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (!res.ok) {
          if (data.error === 'taken') {
            setCheck({ name: normalized, available: false, reason: 'taken' });
            setError('That name was just taken. Try another.');
          } else if (data.error === 'free_tier_exhausted') {
            setFreeRemaining(0);
            setError('Free names just ran out — you can claim this one for $5.');
          } else if (data.error === 'invalid_email') {
            setError('Enter a valid email address.');
          } else {
            setError('Something went wrong. Please try again.');
          }
          return;
        }

        router.push(
          `/claim/success?subdomain=${encodeURIComponent(data.subdomain ?? normalized)}`,
        );
        return;
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.checkoutUrl) {
        if (data.error === 'taken') {
          setCheck({ name: normalized, available: false, reason: 'taken' });
          setError('That name was just taken. Try another.');
        } else {
          setError('Could not start checkout. Please try again.');
        }
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
      <div>
        <label
          htmlFor="claim-name"
          className="text-sm font-medium text-[#1a1a1a]/70"
        >
          Your agent&apos;s name
        </label>
        <div className="mt-2 flex items-stretch rounded-2xl border border-[#1a1a1a]/15 bg-white/70 focus-within:border-[#1a1a1a]/40">
          <input
            id="claim-name"
            name="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="yourname"
            className="w-full rounded-2xl bg-transparent px-4 py-3 text-lg outline-none"
          />
          <span className="flex items-center pr-4 text-lg text-[#1a1a1a]/40">
            {suffix}
          </span>
        </div>

        <div className="mt-2 min-h-5 text-sm">
          {status === 'checking' ? (
            <span className="text-[#1a1a1a]/50">Checking…</span>
          ) : null}
          {status === 'available' ? (
            <span className="font-medium text-[#5b6b00]">
              {normalized}
              {suffix} is available — {priceLabel}
            </span>
          ) : null}
          {status === 'unavailable' ? (
            <span className="text-[#a1330a]">{reasonMessage(reason)}</span>
          ) : null}
        </div>
      </div>

      {status === 'available' ? (
        <>
          <div>
            <label
              htmlFor="claim-email"
              className="text-sm font-medium text-[#1a1a1a]/70"
            >
              Email
            </label>
            <input
              id="claim-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-2 w-full rounded-2xl border border-[#1a1a1a]/15 bg-white/70 px-4 py-3 outline-none focus:border-[#1a1a1a]/40"
            />
          </div>

          <div>
            <label
              htmlFor="claim-bio"
              className="text-sm font-medium text-[#1a1a1a]/70"
            >
              Bio <span className="text-[#1a1a1a]/40">(optional)</span>
            </label>
            <textarea
              id="claim-bio"
              name="bio"
              value={bio}
              onChange={(event) => setBio(event.target.value.slice(0, 280))}
              rows={3}
              placeholder="One line about your agent."
              className="mt-2 w-full resize-none rounded-2xl border border-[#1a1a1a]/15 bg-white/70 px-4 py-3 outline-none focus:border-[#1a1a1a]/40"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-full bg-[#1a1a1a] px-6 py-3 text-sm font-medium text-[#F4F7BC] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting
              ? 'Working…'
              : freeRemaining > 0
                ? 'Claim free →'
                : 'Pay $5 →'}
          </button>
        </>
      ) : null}

      {error ? <p className="text-sm text-[#a1330a]">{error}</p> : null}
    </form>
  );
}
