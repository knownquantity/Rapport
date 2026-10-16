export const RESERVED_SUBDOMAINS = new Set([
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
  'account',
  'billing',
  'pay',
  'checkout',
  'login',
  'signup',
  'claim',
  'about',
  'terms',
  'privacy',
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

export function normalizeSubdomain(input: string): string {
  return input.trim().toLowerCase();
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
