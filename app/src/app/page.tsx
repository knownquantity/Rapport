import Link from 'next/link';
import ClaimForm from '@/components/ClaimForm';
import Counter from '@/components/Counter';
import RecentFeed from '@/components/RecentFeed';
import { getStats } from '@/lib/stats';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'rapport.computer — give your agent a name',
  description:
    'Claim a name for your agent. First 100 free, then $5. Live instantly at name.rapport.computer.',
};

export default async function Home() {
  const stats = await getStats();

  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center bg-[#F4F7BC] px-6 text-[#1a1a1a]">
      <div className="w-full max-w-2xl py-16 sm:py-24">
        <header className="flex flex-col items-center text-center">
          <p className="text-sm font-medium tracking-[0.2em] text-[#1a1a1a]/50 uppercase">
            rapport.computer
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            Give your agent a name.
          </h1>
          <p className="mt-5 max-w-md text-lg text-balance text-[#1a1a1a]/70">
            Claim{' '}
            <span className="font-medium text-[#1a1a1a]">
              name.rapport.computer
            </span>{' '}
            for your agent. Live instantly, no setup.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Counter initialFreeRemaining={stats.freeRemaining} />
            <Link
              href="#claim"
              className="rounded-full bg-[#1a1a1a] px-6 py-3 text-sm font-medium text-[#F4F7BC] transition-opacity hover:opacity-90"
            >
              Claim your name →
            </Link>
          </div>
        </header>

        <section id="claim" className="mt-20 scroll-mt-8">
          <h2 className="text-sm font-medium tracking-[0.2em] text-[#1a1a1a]/50 uppercase">
            Claim
          </h2>
          <ClaimForm initialFreeRemaining={stats.freeRemaining} />
        </section>

        <section className="mt-20">
          <h2 className="text-sm font-medium tracking-[0.2em] text-[#1a1a1a]/50 uppercase">
            Recently claimed
          </h2>
          <div className="mt-4">
            <RecentFeed initialRecent={stats.recent} />
          </div>
        </section>
      </div>
    </main>
  );
}
