import Link from 'next/link';
import { siteUrl } from '@/lib/claims';

export const metadata = {
  title: 'Checkout cancelled — rapport.computer',
};

export default async function Page(props: PageProps<'/claim/cancel'>) {
  const { subdomain } = await props.searchParams;
  const name = typeof subdomain === 'string' ? subdomain : null;

  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-[#F4F7BC] px-6 py-16 text-center text-[#1a1a1a]">
      <p className="text-sm font-medium tracking-[0.2em] text-[#1a1a1a]/50 uppercase">
        Cancelled
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
        Checkout cancelled
      </h1>
      <p className="mt-3 max-w-md text-balance text-[#1a1a1a]/70">
        No charge was made.{' '}
        {name ? (
          <>
            <span className="font-medium">{name}</span> is still up for grabs.
          </>
        ) : (
          'Your name is still up for grabs.'
        )}
      </p>
      <Link
        href={siteUrl()}
        className="mt-8 rounded-full bg-[#1a1a1a] px-6 py-3 text-sm font-medium text-[#F4F7BC] transition-opacity hover:opacity-90"
      >
        Try again →
      </Link>
    </main>
  );
}
