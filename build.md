# build.md — Rapport Computer

Step-by-step implementation guide for the claim experience described in plan.md.
Independent, actionable, ordered. One task at a time. Check off as done.

## Pre-flight (before coding)

1. Confirm you own `rapport.computer` and have Cloudflare / registrar admin access.
2. Decide the free-tier cap final number (default 100).
3. Pick a Stripe account + set a way to receive $1 payouts (or decide to hold until a batch).
4. Create a repo: `github.com/knownquantity/rapport-computer` (already exists; this will replace the current static page over time).
5. Create a Vercel project linked to the repo.
6. Create a Supabase project (Postgres + JS client). Note URL + anon key + service role key.
7. Create Stripe account (or use existing) + create product "Agent Name Claim" price $1 one-time. Note API keys.
8. Ensure Node.js 18+ and pnpm / npm installed locally.
9. Local dev tools: `vercel`, `supabase` CLIs optional but recommended.

## Phase 0 — Project scaffold

1. `npx create-next-app@latest rapport-computer --typescript --tailwind --app --src-dir --import-alias @/*`.
2. cd in; confirm `npm run dev` works.
3. Set `.env.local` with placeholders: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL=https://rapport.computer`, `BYPASS_ADMIN_TOKEN`.
4. Install deps: `pnpm add @supabase/supabase-js stripe`. Dev: `pnpm add -D @types/node`.
5. Create `lib/supabase.ts` exporting a browser client (anon key) and a server client (service role).
6. Create `lib/stripe.ts` exporting the Stripe client (secret key).
7. Commit: "Scaffold Next.js + deps".
8. Push to main; set root env vars in Vercel dashboard (Production + Preview).

## Phase 1 — Database

1. In Supabase SQL editor, create `claims` table with columns: `id uuid primary key default gen_random_uuid()`, `subdomain text unique not null`, `owner_email text not null`, `bio text`, `claimed_at timestamptz not null default now()`, `is_free boolean not null default false`, `stripe_payment_id text`, `metadata jsonb not null default '{}'::jsonb`, `status text not null default 'active'`.
2. Add index `create index idx_claims_claimed_at on claims(claimed_at desc);` and `create index idx_claims_status on claims(status);`.
3. Enable Row Level Security. Policy: public read on `subdomain, bio, claimed_at, status` only (anon). All writes go through service role (bypass RLS server-side).
4. Create a view `free_claims_count` = `select count(*) from claims where is_free = true and status='active';` or just query count.
5. Optional: DB function `next_free_slot()` returning boolean if free count < cap (read from a `config` table). Simpler: query count in API.
6. Add a `config` table? Optional. Cap can hardcode 100 in code for weekend; move to config later.
7. Note: timezone / timestamptz. All timestamps UTC.
8. Run a smoke SQL insert + select to verify RLS; then delete test row.

## Phase 2 — Wildcard DNS + Vercel

1. In Vercel: Project → Domains → add `rapport.computer` and `*.rapport.computer`.
2. In Cloudflare (or registrar): A/CNAME records as Vercel instructs. Add apex A and wildcard CNAME.
3. Wait for SSL provisioning (minutes).
4. Verify a preview deploy attaches the wildcard (deploy any change; visit `test.rapport.computer`).
5. Keep DNS proxy setting appropriate for Vercel (DNS-only recommended for wildcards).
6. Document in RUNBOOK how to revoke a subdomain (delete row + purge cache).

## Phase 3 — Middleware + subdomain routing

1. Create `middleware.ts` at repo root.
2. Extract host from request; strip port.
3. If host ends in `rapport.computer` and has exactly one subdomain label before rapport.computer (i.e. `name.rapport.computer`), rewrite to `/u/[name]` internally.
4. Apex (`rapport.computer`) and `www.rapport.computer` pass through normally.
5. Pass through API and static assets unchanged.
6. Handle case-insensitivity: lowercase the subdomain before rewrite.
7. Add unit tests? Optional; at least manually test `foo.rapport.computer`, `rapport.computer`, `www.rapport.computer`.
8. Commit.

## Phase 4 — Public profile page

1. Create route `app/u/[subdomain]/page.tsx`.
2. Server component: fetch claim by subdomain from Supabase (service role or anon via RLS). If not found, return 404 page.
3. Render: name (as `name.rapport.computer`), bio (if present), claim date (formatted), owner link (if present), status.
4. `generateMetadata` for title/description/Og image (simple, or static image).
5. Add a "share" affordance later.
6. Keep styling minimal / screenshot-friendly. Tailwind.
7. If `status != 'active'`, show pending/removed page.
8. Test by inserting a fake claim row and visiting `jake.rapport.computer` (via hosts file if needed before wildcard ready) — use `curl`.

## Phase 5 — Claim availability API

1. `app/api/check/route.ts` (GET `?name=...`).
2. Validate: lowercase, trim, regex `^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$` (3-30 chars, no leading/trailing hyphen). Reserve reserved words (`www`, `api`, `admin`, `app`, `mail`, etc.).
3. Query Supabase for existing subdomain.
4. Return `{ available: boolean, reason?: string }`.
5. Rate-limit lightly (optional: in-memory per IP; skip for weekend or use Vercel's built-in if available).
6. CORS not needed (same origin).

## Phase 6 — Free claim API

1. `app/api/claim/free/route.ts` (POST `{ name, email, bio? }`).
2. Re-validate name + email; check availability again (race).
3. Count existing free claims where status='active'. If < 100: insert with `is_free=true, status='active'`. Else reject with `{ reason: "free_tier_exhausted" }`.
4. Send confirmation email? For weekend: simple token-based flow OR just insert and return success (account creation optional). Plan says "email + claim token". Implement minimal: insert claim, generate a claim token (uuid) stored in `metadata.claim_token`, return `{ url, token }`. Add a verification step later if desired.
5. Return the live URL.
6. Error handling: duplicate name → 409; invalid → 400.
7. Test via curl.

## Phase 7 — Stripe paid claim

1. `app/api/checkout/route.ts` (POST `{ name, email, bio? }`).
2. Validate name + email + availability.
3. Create pending claim row (`status='pending'`, `is_free=false`) to reserve name. Store token.
4. Create Stripe Checkout session: price $1, customer email prefill, metadata `{ subdomain, claim_id }`, success_url, cancel_url.
5. Return `{ checkoutUrl }`.
6. `app/api/webhook/stripe/route.ts`: verify signature, on `checkout.session.completed`, update claim to `status='active'`, set `stripe_payment_id`. Use idempotency (check status first).
7. Success page: `app/claim/success/page.tsx` — shows live URL + share button.
8. Cancel page: `app/claim/cancel/page.tsx`.
9. Configure webhook in Stripe dashboard → endpoint URL. Set secret in env.
10. Test with Stripe test card; verify webhook locally via Stripe CLI `stripe listen --forward-to localhost:3000/api/webhook/stripe`.

## Phase 8 — Counter + recent feed

1. `app/api/stats/route.ts`: returns `{ freeRemaining, totalClaims, recent: [...] }` (recent last 20 claims: subdomain, claimed_at).
2. `components/Counter.tsx`: fetches /api/stats every 30s; shows "X free names left".
3. `components/RecentFeed.tsx`: renders recent claims as links.
4. Homepage (`app/page.tsx`) composes counter + feed + claim form CTA.
5. Add ISR or client-side polling. Client poll 30s fine for weekend.
6. Cap `recent` at 20; add basic cache (no need for advanced).

## Phase 9 — Claim form UI

1. `components/ClaimForm.tsx`: input subdomain, validate client-side, call /api/check on blur/debounce 300ms.
2. Show availability status + price indicator.
3. Email + optional bio fields shown only when name available.
4. "Claim free" button if free; "Pay $1" button routes to checkout.
5. Loading states + error messages.
6. Tailwind. Mobile-friendly.
7. Success redirect to /claim/success with ID in query.

## Phase 10 — One-click share

1. Success page renders pre-filled X intent URL: `https://twitter.com/intent/tweet?text=...`.
2. Include the live URL + a share card image (static OG image or generated via next/og).
3. Optional: a simple card component that's screenshot-friendly.
4. Add `navigator.share` button if supported.

## Phase 11 — Admin view

1. `app/admin/page.tsx`, protected by `?token=` query or header `x-admin-token` matching env `ADMIN_TOKEN`. Minimal, no real auth for weekend.
2. List all claims (paginated), with status, email, dates, free/paid, payment ID.
3. Show counts (total, free, paid, pending).
4. Ability to soft-delete (set status='removed') via a button + confirm.
5. No fancy UI. Table.

## Phase 12 — Validation + edge cases

1. Duplicate claim race: DB unique constraint handles it; API catches 23505 → 409.
2. Payment failure / abandoned checkout: pending rows older than 24h can be purged by a cron or manual. For weekend, manual admin delete.
3. Subdomain normalization: lowercase, trim, strip trailing dots.
4. Reserved names list expanded (api, www, admin, mail, support, help, blog, etc.).
5. Email validation basic regex.
6. Test `name` with unicode / emojis → reject.
7. Test middleware host parsing with `:3000` ports (strip).

## Phase 13 — Styling + polish

1. Tailwind config with a brand color. Consider the `#F4F7BC` cream from the existing landing page.
2. Typography: a single font family. (Current: Audiowide for rapport.computer wordmark; for body/UI use Inter or system-ui.)
3. Ensure 404 page looks on-brand.
4. Add favicon + og image.
5. Lighthouse: aim > 90 on mobile.
6. Verify the static rapport.computer landing page: keep `index.html` OR replace with the Next.js homepage. Decision: replace; keep old static file in git history.

## Phase 14 — Launch prep

1. Soft launch to a few friends; collect 3-5 real claims.
2. Verify `name.rapport.computer` resolves and renders end-to-end for a free claim + a paid claim.
3. Write launch post (X thread): problem, demo, claim link.
4. Set up basic analytics (Vercel Analytics or Plausible) — optional.
5. Monitor Stripe dashboard + Supabase for first 48h.
6. Post-mortem doc after weekend: what surprised.

## Env var checklist

- `NEXT_PUBLIC_SITE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID` (the $1 price)
- `ADMIN_TOKEN`
- `FREE_TIER_CAP` (e.g. 100)

## Folder structure (target)

    .
    ├── middleware.ts
    ├── app/
    │   ├── page.tsx
    │   ├── layout.tsx
    │   ├── u/[subdomain]/page.tsx
    │   ├── claim/success/page.tsx
    │   ├── claim/cancel/page.tsx
    │   ├── admin/page.tsx
    │   └── api/
    │       ├── check/route.ts
    │       ├── claim/free/route.ts
    │       ├── checkout/route.ts
    │       ├── webhook/stripe/route.ts
    │       └── stats/route.ts
    ├── components/
    │   ├── ClaimForm.tsx
    │   ├── Counter.tsx
    │   ├── RecentFeed.tsx
    │   └── ShareButton.tsx
    ├── lib/
    │   ├── supabase.ts
    │   ├── stripe.ts
    │   └── validation.ts
    ├── styles/
    └── ...

## Non-goals for the weekend (do not build)

- User accounts / proper auth
- /.well-known / API
- Agent self-update API keys
- Mutual "in rapport with" links
- x402 agent payments
- Fancy dashboard / charts
- Email verification flow beyond minimal
- CAPTCHA (add if spam appears)

## Definition of done (weekend)

- A brand-new user can visit rapport.computer, claim a free name (if < 100 claimed), see `name.rapport.computer` live immediately.
- A user can pay $1 and see their name live after webhook completes.
- Counter reflects remaining free count.
- Recent claims feed updates.
- Share button opens a pre-filled tweet with the live URL.
- Admin URL (token-gated) lists all claims.
- All of the above on mobile + desktop, no console errors.
