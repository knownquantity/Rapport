# RUNBOOK — rapport.computer

Operational guide for the claim experience: people claim `name.rapport.computer` for their agent (first 100 free, then $5 via Stripe).

## Stack

- **Next.js 16** (App Router, Turbopack, TypeScript, Tailwind v4) — app lives in [`app/`](./app).
- **Supabase** (Postgres) — project `jtcjncueadhtfazoxvdd`.
- **Stripe** — Checkout (payment) + webhook.
- **Vercel** — hosting + wildcard domains. `src/proxy.ts` rewrites `name.<root>` → `/u/[name]`.

## Key concepts

- Root domain is derived from `NEXT_PUBLIC_SITE_URL`. Dev = `localhost` (`*.localhost`), prod = `rapport.computer`.
- `claims` statuses: `active` (live), `pending` (reserved during paid checkout), `removed` (soft-deleted).
- A name is **blocking** (unavailable) when `active`, or `pending` and less than 24h old. `removed` / stale `pending` names are reclaimable (`isBlockingClaim` in `app/src/lib/claims.ts`).
- All server reads/writes use the Supabase **service-role** key. Public profile reads are also exposed to `anon` under an RLS policy (active rows, public columns only).

## Local development

```bash
cd app
npm install
npm run dev            # http://localhost:3000
```

Environment: create `app/.env.local` (gitignored). Required keys:

| Var | Notes |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` in dev |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role key (server only) |
| `STRIPE_SECRET_KEY` | `sk_test_…` in dev |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` (see Stripe CLI below) |
| `STRIPE_PRICE_ID` | the $5 one-time price |
| `ADMIN_TOKEN` | token for `/admin` |
| `FREE_TIER_CAP` | e.g. `100` |

### Stripe webhooks locally

The Stripe CLI is installed at `~/.local/stripe/stripe` (not on `PATH`). To forward test events:

```bash
~/.local/stripe/stripe login --api-key "$STRIPE_SECRET_KEY"   # one-time
~/.local/stripe/stripe listen \
  --api-key "$STRIPE_SECRET_KEY" \
  --events checkout.session.completed \
  --forward-to localhost:3000/api/webhook/stripe
```

The printed `whsec_…` must match `STRIPE_WEBHOOK_SECRET`. Pay with test card `4242 4242 4242 4242`.

### Test subdomains locally

`*.<root>` resolves to loopback, so `http://smith.localhost:3000/` renders `smith`'s profile (via `proxy.ts`).

### Admin locally

`http://localhost:3000/admin?token=<ADMIN_TOKEN>` (or header `x-admin-token`).

## Database

Table `claims`: `id uuid`, `subdomain text unique`, `owner_email text`, `bio text`, `claimed_at timestamptz default now()`, `is_free bool`, `stripe_payment_id text`, `metadata jsonb` (holds `claim_token`), `status text default 'active'`.

Indexes: `claims(claimed_at desc)`, `claims(status)`.

RLS policy (run once in the Supabase SQL editor):

```sql
create policy "Public read active claims"
on public.claims
for select
to anon
using (status = 'active');
```

## Deployment (Vercel)

1. Import `github.com/knownquantity/rapport-computer`; set **Root Directory** to `app`.
2. Set the production env vars (same keys as local) with:
   - `NEXT_PUBLIC_SITE_URL=https://rapport.computer`
   - **live** Stripe keys + live price id + production webhook secret.
3. Add domains `rapport.computer` and `*.rapport.computer`.
4. DNS (Cloudflare): apex per Vercel's target, and a wildcard `CNAME * → cname.vercel-dns.com` (DNS-only recommended until validated). Wait for SSL.
5. Verify `https://test.rapport.computer` attaches the wildcard, then delete `index.html` (see below).

## Stripe

- Product **Agent Name Claim**, one **$5 USD one-time** price (`STRIPE_PRICE_ID`). Test price: `price_1UR2eFHkPJy9vO8MCvXHNbZS` (account `acct_1UR1RCHkPJy9vO8M`).
- Webhook endpoint: `https://rapport.computer/api/webhook/stripe`, event `checkout.session.completed`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET` (production). For local forwarding use the Stripe CLI.

## Go-live checklist

- [ ] Vercel project linked, root dir `app`.
- [ ] Production env vars set (Supabase + **live** Stripe).
- [ ] `rapport.computer` + `*.rapport.computer` resolving with SSL.
- [ ] `STRIPE_PRICE_ID` is the **live** $5 price; webhook endpoint created + secret set.
- [ ] Free claim works end-to-end at `name.rapport.computer`.
- [ ] Paid claim works with a real test card on the live site.
- [ ] `index.html` (old static landing page) removed once the Next homepage is live.
- [ ] `/admin?token=…` reachable and lists claims.

## Operations

### Revoke / free a subdomain

Soft-delete via admin (Remove button) → sets `status='removed'`, freeing the name. To purge stale reservations, use **Purge stale pending** in `/admin` (`pending` older than 24h → `removed`). Hard delete only if the row should disappear entirely.

### Rotate the admin token

Update `ADMIN_TOKEN` in the environment (Vercel project settings / `.env.local`) and redeploy/restart.

### Abandoned checkouts

A `pending` row from an abandoned checkout blocks the name for 24h, then becomes reclaimable and can be purged from `/admin`.

## Known advisories

- **`braces` stack-exhaustion DoS — `CVE-2026-93687` / `GHSA-vfj7-8cjw-p6xm`** (high, availability-only). Affects `braces <= 3.0.3`; **no patched version exists**. Present only via dev tooling: `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`. `npm audit --omit=dev` reports **0 vulnerabilities** — it is not in the production bundle or runtime, and our brace patterns come from our own ESLint config (not network input), so it is not reachable. Accepted risk; re-check when upstream ships a fix. (`npm audit fix --force` only downgrades `eslint-config-next` and does not remove it.)

## Troubleshooting

- **Subdomain 404s**: confirm `*.rapport.computer` resolves and `NEXT_PUBLIC_SITE_URL` hostname matches the root domain used by `proxy.ts`.
- **Webhook 400 `invalid_signature`**: `STRIPE_WEBHOOK_SECRET` doesn't match the endpoint (or CLI session). Re-copy it.
- **Names always "taken"**: a `pending` (≤24h) or `active` row exists; check `/admin`.
- **Payment succeeded but name not live**: check webhook delivery in the Stripe dashboard; the handler only activates rows still `pending`.
