import { NextResponse } from 'next/server';
import { resetInventoryData } from '@/lib/inventory';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (body.password !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await resetInventoryData();
  return NextResponse.json({ ok: true });
}
