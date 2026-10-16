export const RESERVED_SUBDOMAINS = new Set([
  'www',
  'www2',
  'api',
  'admin',
  'app',
  'mail',
  'email',
  'smtp',
  'pop',
  'imap',
  'webmail',
  'mx',
  'dns',
  'ns',
  'ns1',
  'ns2',
  'support',
  'help',
  'blog',
  'docs',
  'status',
  'test',
  'demo',
  'sandbox',
  'staging',
  'dev',
  'dashboard',
  'account',
  'billing',
  'pay',
  'checkout',
  'login',
  'signin',
  'signup',
  'register',
  'auth',
  'sso',
  'oauth',
  'token',
  'claim',
  'about',
  'terms',
  'privacy',
  'legal',
  'security',
  'abuse',
  'noc',
  'internal',
  'intranet',
  'portal',
  'client',
  'clients',
  'partners',
  'investors',
  'careers',
  'jobs',
  'press',
  'news',
  'shop',
  'store',
  'cdn',
  'static',
  'assets',
  'img',
  'images',
  'media',
  'vpn',
  'ftp',
  'm',
  'mobile',
  'web',
  'my',
]);

const SUBDOMAIN_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

export const SUBDOMAIN_MIN = 3;
export const SUBDOMAIN_MAX = 30;

export type ValidationResult =
  | { ok: true; name: string }
  | { ok: false; reason: ValidationReason };

export type ValidationReason =
  | 'empty'
  | 'too_short'
  | 'too_long'
  | 'invalid_characters'
  | 'reserved';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeSubdomain(input: string): string {
  return input.trim().toLowerCase().replace(/\.+$/, '');
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function validateEmail(input: string): boolean {
  const email = normalizeEmail(input);
  return email.length <= 254 && EMAIL_RE.test(email);
}

export function validateSubdomain(input: string): ValidationResult {
  const name = normalizeSubdomain(input);

  if (!name) return { ok: false, reason: 'empty' };
  if (name.length < SUBDOMAIN_MIN) return { ok: false, reason: 'too_short' };
  if (name.length > SUBDOMAIN_MAX) return { ok: false, reason: 'too_long' };
  if (!SUBDOMAIN_RE.test(name)) return { ok: false, reason: 'invalid_characters' };
  if (RESERVED_SUBDOMAINS.has(name)) return { ok: false, reason: 'reserved' };

  return { ok: true, name };
}
