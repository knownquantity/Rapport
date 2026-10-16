import Link from 'next/link';
import ShareButton from '@/components/ShareButton';
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

      <div className="mt-10 flex flex-col items-center gap-4">
        <ShareButton url={url} text={shareText} />
        <Link
          href={siteUrl()}
          className="text-sm font-medium text-[#1a1a1a]/60 underline decoration-[#1a1a1a]/25 underline-offset-4 transition-colors hover:text-[#1a1a1a]"
        >
          Claim another
        </Link>
      </div>
    </main>
  );
}
