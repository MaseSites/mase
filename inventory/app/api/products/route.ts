import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureSeedData, parseSizes, parseStoredSizes } from '@/lib/inventory';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

async function storeImage(file: File | null) {
  if (!file || file.size === 0) {
    return '/sample/placeholder.svg';
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

export async function GET() {
  await ensureSeedData();
  const products = await db.product.findMany({ orderBy: { createdAt: 'desc' } });

  return NextResponse.json(
    products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      imagePath: product.imagePath,
      stock: product.stock,
      price: product.price,
      sizes: parseStoredSizes(product.sizes),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    })),
  );
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const imagePath = await storeImage(formData.get('image') as File | null);
  const sizes = parseSizes(formData.get('sizes'));
  const stock = Number(formData.get('stock') ?? 0);

  const product = await db.$transaction(async (transaction) => {
    const createdProduct = await transaction.product.create({
      data: {
        name: String(formData.get('name') ?? '').trim(),
        category: String(formData.get('category') ?? '').trim(),
        imagePath,
        stock,
        price: Number(formData.get('price') ?? 0),
        sizes: JSON.stringify(sizes),
      },
    });

    if (stock > 0) {
      await transaction.movement.create({
        data: {
          productId: createdProduct.id,
          productName: createdProduct.name,
          category: createdProduct.category,
          kind: 'restock',
          quantity: stock,
        },
      });
    }

    return createdProduct;
  });

  return NextResponse.json(product, { status: 201 });
}
