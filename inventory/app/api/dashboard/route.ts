import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/inventory';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = (url.searchParams.get('range') ?? 'month') as 'day' | 'week' | 'month' | 'year';
  const payload = await getDashboardData(range);

  return NextResponse.json(payload);
}
