import Link from 'next/link';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import RemoveClaimButton from '@/app/admin/RemoveClaimButton';
import { formatClaimedAt } from '@/lib/claims';
import { supabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin — rapport.computer',
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 50;

type ClaimRow = {
  id: string;
  subdomain: string;
  owner_email: string;
  is_free: boolean;
  status: string;
  claimed_at: string;
  stripe_payment_id: string | null;
};

async function removeClaim(formData: FormData) {
  'use server';

  const expected = process.env.ADMIN_TOKEN;
  const token = String(formData.get('token') ?? '');
  if (!expected || token !== expected) return;

  const id = String(formData.get('id') ?? '');
  if (!id) return;

  await supabaseServer().from('claims').update({ status: 'removed' }).eq('id', id);
  revalidatePath('/admin');
}

export default async function AdminPage(props: PageProps<'/admin'>) {
  const searchParams = await props.searchParams;
  const token = typeof searchParams.token === 'string' ? searchParams.token : '';
  const headerList = await headers();
  const headerToken = headerList.get('x-admin-token') ?? '';

  const expected = process.env.ADMIN_TOKEN ?? '';
  if (!expected || (token !== expected && headerToken !== expected)) {
    return (
      <main className="flex min-h-dvh flex-1 items-center justify-center bg-[#F4F7BC] px-6 text-[#1a1a1a]">
        <p className="text-sm text-[#1a1a1a]/60">Not found.</p>
      </main>
    );
  }

  const parsedPage = Number(searchParams.page ?? 1);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = supabaseServer();
  const [list, total, active, free, paid, pending] = await Promise.all([
    supabase
      .from('claims')
      .select(
        'id, subdomain, owner_email, is_free, status, claimed_at, stripe_payment_id',
      )
      .order('claimed_at', { ascending: false })
      .range(from, to),
    supabase.from('claims').select('id', { count: 'exact', head: true }),
    supabase
      .from('claims')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('claims')
      .select('id', { count: 'exact', head: true })
      .eq('is_free', true),
    supabase
      .from('claims')
      .select('id', { count: 'exact', head: true })
      .eq('is_free', false),
    supabase
      .from('claims')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);

  if (list.error) {
    return (
      <main className="flex min-h-dvh flex-1 items-center justify-center bg-[#F4F7BC] px-6 text-[#1a1a1a]">
        <p className="text-sm text-[#a1330a]">Failed to load claims.</p>
      </main>
    );
  }

  const claims = (list.data ?? []) as ClaimRow[];
  const totalCount = total.count ?? 0;
  const hasNext = to + 1 < totalCount;

  const counts: [string, number][] = [
    ['Total', totalCount],
    ['Active', active.count ?? 0],
    ['Free', free.count ?? 0],
    ['Paid', paid.count ?? 0],
    ['Pending', pending.count ?? 0],
  ];

  return (
    <main className="min-h-dvh flex-1 bg-[#F4F7BC] px-6 py-12 text-[#1a1a1a]">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-2xl font-semibold tracking-tight">Claims</h1>

        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          {counts.map(([label, value]) => (
            <div key={label} className="flex items-baseline gap-2">
              <dt className="text-[#1a1a1a]/50">{label}</dt>
              <dd className="font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a]/20 text-[#1a1a1a]/50">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Claimed</th>
                <th className="py-2 pr-4 font-medium">Payment</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {claims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-[#1a1a1a]/50">
                    No claims yet.
                  </td>
                </tr>
              ) : (
                claims.map((claim) => (
                  <tr key={claim.id} className="border-b border-[#1a1a1a]/10">
                    <td className="py-2 pr-4 font-medium">{claim.subdomain}</td>
                    <td className="py-2 pr-4 text-[#1a1a1a]/70">
                      {claim.owner_email}
                    </td>
                    <td className="py-2 pr-4">{claim.status}</td>
                    <td className="py-2 pr-4">
                      {claim.is_free ? 'free' : 'paid'}
                    </td>
                    <td className="py-2 pr-4 text-[#1a1a1a]/70">
                      {formatClaimedAt(claim.claimed_at)}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs text-[#1a1a1a]/50">
                      {claim.stripe_payment_id ?? '—'}
                    </td>
                    <td className="py-2">
                      {claim.status === 'removed' ? null : (
                        <RemoveClaimButton
                          action={removeClaim}
                          id={claim.id}
                          token={token}
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center gap-4 text-sm">
          {page > 1 ? (
            <Link
              href={`/admin?token=${encodeURIComponent(token)}&page=${page - 1}`}
              className="underline decoration-[#1a1a1a]/25 underline-offset-4 hover:decoration-[#1a1a1a]"
            >
              ← Prev
            </Link>
          ) : null}
          <span className="text-[#1a1a1a]/50">
            Page {page} of {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
          </span>
          {hasNext ? (
            <Link
              href={`/admin?token=${encodeURIComponent(token)}&page=${page + 1}`}
              className="underline decoration-[#1a1a1a]/25 underline-offset-4 hover:decoration-[#1a1a1a]"
            >
              Next →
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
