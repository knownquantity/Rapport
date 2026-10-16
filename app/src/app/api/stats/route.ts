import { NextResponse } from 'next/server';
import { getStats } from '@/lib/stats';

export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch {
    return NextResponse.json({ error: 'stats_failed' }, { status: 500 });
  }
}
