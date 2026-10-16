import Link from 'next/link';
import { notFound } from 'next/navigation';
import { claimUrl, formatClaimedAt, getClaim, siteUrl } from '@/lib/claims';

export async function generateMetadata(props: PageProps<'/u/[subdomain]'>) {
  const { subdomain } = await props.params;
  const claim = await getClaim(subdomain);
  const name = `${subdomain}.rapport.computer`;

  if (!claim || claim.status !== 'active') {
    return { title: { absolute: `${name} — not available` } };
  }

  const description = claim.bio ?? `${name} is claimed on rapport.computer.`;
  const ogImage = `${siteUrl()}/api/og?name=${encodeURIComponent(subdomain)}${
    claim.bio ? `&bio=${encodeURIComponent(claim.bio)}` : ''
  }`;

  return {
    title: { absolute: name },
    description,
    openGraph: {
      title: name,
      description,
      url: claimUrl(subdomain),
      images: [{ url: ogImage, width: 1200, height: 630, alt: name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description,
      images: [ogImage],
    },
  };
}

export default async function Page(props: PageProps<'/u/[subdomain]'>) {
  const { subdomain } = await props.params;
  const claim = await getClaim(subdomain);

  if (!claim) notFound();

  if (claim.status !== 'active') {
    return (
      <Frame>
        <p className="text-2xl font-semibold">This name isn&apos;t available.</p>
        <p className="mt-3 text-[#1a1a1a]/70">
          <span className="font-medium">{claim.subdomain}</span> is {claim.status}.
        </p>
        <ClaimCta />
      </Frame>
    );
  }

  return (
    <Frame>
      <h1 className="text-center text-4xl font-semibold tracking-tight break-all sm:text-5xl">
        {claim.subdomain}
        <span className="text-[#1a1a1a]/45">.rapport.computer</span>
      </h1>

      {claim.bio ? (
        <p className="mt-5 max-w-xl text-center text-lg text-balance text-[#1a1a1a]/80">
          {claim.bio}
        </p>
      ) : null}

      <p className="mt-8 text-sm text-[#1a1a1a]/60">
        Claimed {formatClaimedAt(claim.claimed_at)}
      </p>

      <ClaimCta />
    </Frame>
  );
}

function Frame({ children }: { children?: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-[#F4F7BC] px-6 py-16 text-[#1a1a1a]">
      {children}
    </main>
  );
}

function ClaimCta() {
  return (
    <Link
      href={siteUrl()}
      className="mt-10 rounded-full border border-[#1a1a1a]/20 px-5 py-2 text-sm font-medium transition-colors hover:bg-[#1a1a1a]/5"
    >
      Claim your own name →
    </Link>
  );
}
