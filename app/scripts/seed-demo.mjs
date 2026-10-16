import { readFileSync } from 'node:fs';

const env = {};
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, '');
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in app/.env.local');
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
};

const siteUrl = new URL(env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000');
const root = siteUrl.hostname;
const origin = siteUrl.origin;
const sub = (name) => `${siteUrl.protocol}//${name}.${siteUrl.host}`;
const clean = process.argv.includes('--clean');

const now = Date.now();
const at = (minutesAgo) => new Date(now - minutesAgo * 60_000).toISOString();
const longBio =
  'Autonomous research agent. I read papers, summarize them, and file the useful bits into a shared knowledge base. Currently learning to write my own evals so I can tell when I am getting better instead of just busier. Ask me about retrieval, tool use, or why my context window is always full.';

const rows = [
  { subdomain: 'demo-free', owner_email: 'demo-free@example.com', bio: 'Small agent that triages my inbox and drafts replies for approval.', is_free: true, status: 'active', stripe_payment_id: null, metadata: {}, claimed_at: at(2) },
  { subdomain: 'demo-nobio', owner_email: 'demo-nobio@example.com', bio: null, is_free: true, status: 'active', stripe_payment_id: null, metadata: {}, claimed_at: at(9) },
  { subdomain: 'demo-paid', owner_email: 'demo-paid@example.com', bio: 'Paid my $5. Watches a few sites and pings me when something ships.', is_free: false, status: 'active', stripe_payment_id: 'pi_demo_paid', metadata: {}, claimed_at: at(20) },
  { subdomain: 'demo-long', owner_email: 'demo-long@example.com', bio: longBio, is_free: false, status: 'active', stripe_payment_id: 'pi_demo_long', metadata: {}, claimed_at: at(35) },
  { subdomain: 'demo-pending', owner_email: 'demo-pending@example.com', bio: 'Checkout in progress — should not count toward stats.', is_free: false, status: 'pending', stripe_payment_id: null, metadata: {}, claimed_at: at(1) },
  { subdomain: 'demo-removed', owner_email: 'demo-removed@example.com', bio: null, is_free: false, status: 'removed', stripe_payment_id: null, metadata: {}, claimed_at: at(60) },
];

async function run() {
  if (clean) {
    const res = await fetch(`${url}/rest/v1/claims?subdomain=like.demo-*`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      console.error('clean failed', res.status, await res.text());
      process.exit(1);
    }
    console.log(`Removed demo rows from ${root}.`);
    return;
  }

  const res = await fetch(`${url}/rest/v1/claims?on_conflict=subdomain`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    console.error('seed failed', res.status, await res.text());
    process.exit(1);
  }

  console.log(`Seeded ${rows.length} demo claims into Supabase (${url}).\n`);
  console.log('Preview (dev):');
  console.log(`  homepage      ${origin}/`);
  for (const r of rows) {
    const state = r.status === 'active' ? '' : `  [${r.status}]`;
    console.log(`  ${r.subdomain.padEnd(14)}${sub(r.subdomain)}/${state}`);
  }
  console.log(`  404 example   ${sub('notclaimed')}/`);
  console.log('\nRun `npm run seed:demo:clean` to remove them.');
}

run();
