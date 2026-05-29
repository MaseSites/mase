import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.json();
  const productId = String(body.productId ?? '');
  const quantity = Math.max(1, Number(body.quantity ?? 1));
  const kind = body.kind === 'sale' ? 'sale' : 'restock';
  const product = await db.product.findUnique({ where: { id: productId } });

  if (!product) {
    return NextResponse.json({ error: 'Produkt nicht gefunden' }, { status: 404 });
  }

  if (kind === 'sale' && product.stock < quantity) {
    return NextResponse.json({ error: 'Nicht genügend Bestand verfügbar' }, { status: 409 });
  }

  const result = await db.$transaction(async (transaction) => {
    const nextStock = kind === 'restock' ? product.stock + quantity : product.stock - quantity;
    const updatedProduct = await transaction.product.update({
      where: { id: productId },
      data: { stock: nextStock },
    });

    await transaction.movement.create({
      data: {
        productId: product.id,
        productName: product.name,
        category: product.category,
        kind,
        quantity,
      },
    });

    if (kind === 'sale') {
      await transaction.sale.create({
        data: {
          productId: product.id,
          productName: product.name,
          category: product.category,
          kind: 'sale',
          quantity,
          unitPrice: product.price,
          revenue: Number((quantity * product.price).toFixed(2)),
        },
      });
    }

    return updatedProduct;
  });

  return NextResponse.json(result);
}
