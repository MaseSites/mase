import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.json();
  const productId = String(body.productId ?? '');
  const amount = Number(body.amount ?? 0);
  const reason = String(body.reason ?? '').trim();

  if (!productId) {
    return NextResponse.json({ error: 'Produkt fehlt' }, { status: 400 });
  }

  if (!Number.isFinite(amount) || amount === 0) {
    return NextResponse.json({ error: 'Korrekturbetrag fehlt' }, { status: 400 });
  }

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: 'Produkt nicht gefunden' }, { status: 404 });
  }

  await db.sale.create({
    data: {
      productId: product.id,
      productName: product.name,
      category: product.category,
      kind: 'adjustment',
      quantity: 0,
      unitPrice: 0,
      revenue: Number(amount.toFixed(2)),
      reason: reason || null,
    },
  });

  return NextResponse.json({ ok: true });
}
