import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RESERVED = new Set([
  'www',
  'api',
  'admin',
  'app',
  'mail',
  'email',
  'support',
  'help',
  'blog',
  'docs',
  'status',
  'test',
  'staging',
  'dev',
  'dashboard',
]);

function getRootDomain(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rapport.computer';
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return 'rapport.computer';
  }
}

export function proxy(request: NextRequest) {
  const root = getRootDomain();
  const host = (request.headers.get('host') ?? '')
    .toLowerCase()
    .replace(/\.$/, '')
    .split(':')[0];

  if (!host || host === root || !host.endsWith(`.${root}`)) {
    return NextResponse.next();
  }

  const label = host.slice(0, host.length - root.length - 1);
  if (!label || label.includes('.') || RESERVED.has(label)) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();
  url.pathname = pathname === '/' ? `/u/${label}` : `/u/${label}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
};
