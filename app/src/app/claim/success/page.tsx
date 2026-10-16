import Link from 'next/link';
import { claimUrl, siteUrl } from '@/lib/claims';

export const metadata = {
  title: 'Your name is live — rapport.computer',
};

export default async function Page(props: PageProps<'/claim/success'>) {
  const { subdomain } = await props.searchParams;
  const name = typeof subdomain === 'string' ? subdomain : null;
  const url = name ? claimUrl(name) : siteUrl();

  const shareText = name
    ? `${name}.rapport.computer is claimed`
    : 'Claimed on rapport.computer';
  const shareHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;

  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-[#F4F7BC] px-6 py-16 text-center text-[#1a1a1a]">
      <p className="text-sm font-medium tracking-[0.2em] text-[#1a1a1a]/50 uppercase">
        Paid
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
        Your name is live
      </h1>
      <p className="mt-3 max-w-md text-balance text-[#1a1a1a]/70">
        It can take a few seconds for your page to appear.
      </p>

      {name ? (
        <Link
          href={url}
          className="mt-8 text-lg font-medium break-all underline decoration-[#1a1a1a]/30 underline-offset-4 hover:decoration-[#1a1a1a]"
        >
          {name}.rapport.computer
        </Link>
      ) : null}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <a
          href={shareHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#1a1a1a] px-6 py-3 text-sm font-medium text-[#F4F7BC] transition-opacity hover:opacity-90"
        >
          Share on X
        </a>
        <Link
          href={siteUrl()}
          className="rounded-full border border-[#1a1a1a]/20 px-6 py-3 text-sm font-medium transition-colors hover:bg-[#1a1a1a]/5"
        >
          Claim another
        </Link>
      </div>
    </main>
  );
}
