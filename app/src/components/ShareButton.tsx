'use client';

import { useState, useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};
const getCanNativeShare = () =>
  typeof navigator !== 'undefined' && typeof navigator.share === 'function';
const getServerSnapshot = () => false;

export default function ShareButton({
  url,
  text,
}: {
  url: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);
  const canNativeShare = useSyncExternalStore(
    emptySubscribe,
    getCanNativeShare,
    getServerSnapshot,
  );

  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    text,
  )}&url=${encodeURIComponent(url)}`;

  async function handleNativeShare() {
    try {
      await navigator.share({ title: text, text, url });
    } catch {
      // user dismissed the share sheet
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  const secondaryClass =
    'rounded-full border border-[#1a1a1a]/20 px-6 py-3 text-sm font-medium transition-colors hover:bg-[#1a1a1a]/5';

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <a
        href={xHref}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-[#1a1a1a] px-6 py-3 text-sm font-medium text-[#F4F7BC] transition-opacity hover:opacity-90"
      >
        Share on X
      </a>
      {canNativeShare ? (
        <button type="button" onClick={handleNativeShare} className={secondaryClass}>
          Share…
        </button>
      ) : (
        <button type="button" onClick={handleCopy} className={secondaryClass}>
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      )}
    </div>
  );
}
