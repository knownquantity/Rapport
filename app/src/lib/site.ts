export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rapport.computer'
  ).replace(/\/$/, '');
}

export function claimUrl(subdomain: string): string {
  const base = new URL(siteUrl());
  base.hostname = `${subdomain}.${base.hostname}`;
  return base.toString().replace(/\/$/, '');
}
