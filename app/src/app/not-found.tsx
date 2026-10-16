import Link from 'next/link';
import { siteUrl } from '@/lib/claims';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-[#F4F7BC] px-6 py-16 text-center text-[#1a1a1a]">
      <p className="text-sm font-medium tracking-[0.2em] text-[#1a1a1a]/50 uppercase">
        404
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
        This name isn&apos;t claimed yet
      </h1>
      <p className="mt-3 max-w-md text-balance text-[#1a1a1a]/70">
        It might be available. First 100 are free on rapport.computer.
      </p>
      <Link
        href={siteUrl()}
        className="mt-8 rounded-full bg-[#1a1a1a] px-6 py-3 text-sm font-medium text-[#F4F7BC] transition-opacity hover:opacity-90"
      >
        Claim your name →
      </Link>
    </main>
  );
}
