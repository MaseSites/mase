import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { parseSizes } from '@/lib/inventory';

export const runtime = 'nodejs';

async function storeImage(file: File | null) {
  if (!file || file.size === 0) {
    return null;
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadsDir, { recursive: true });

  const extension = path.extname(file.name) || '.png';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`;
  const filePath = path.join(uploadsDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return `/uploads/${fileName}`;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await request.formData();
  const image = await storeImage(formData.get('image') as File | null);
  const data: Record<string, unknown> = {
    name: String(formData.get('name') ?? '').trim(),
    category: String(formData.get('category') ?? '').trim(),
    stock: Number(formData.get('stock') ?? 0),
    price: Number(formData.get('price') ?? 0),
    sizes: JSON.stringify(parseSizes(formData.get('sizes'))),
  };

  if (image) {
    data.imagePath = image;
  }

  const product = await db.product.update({ where: { id }, data });
  return NextResponse.json(product);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
