import { db } from './db';
import type { CategoryPoint, DashboardPayload, MovementPoint, ProductRecord, RevenuePoint } from './types';
import { Prisma } from '@prisma/client';
import { mkdir, readdir, unlink } from 'fs/promises';
import path from 'path';

export function parseStoredSizes(value: string | null | undefined) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function serializeProduct(product: {
  id: string;
  name: string;
  category: string;
  imagePath: string;
  stock: number;
  price: Prisma.Decimal | number;
  sizes: string;
  createdAt: Date;
  updatedAt: Date;
}): ProductRecord {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    imagePath: product.imagePath,
    stock: product.stock,
    price: typeof product.price === 'number' ? product.price : product.price.toNumber(),
    sizes: parseStoredSizes(product.sizes),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

function startOfRange(range: DashboardPayload['range']) {
  const now = new Date();
  const start = new Date(now);

  if (range === 'day') {
    start.setHours(0, 0, 0, 0);
  }
  if (range === 'week') {
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  }
  if (range === 'month') {
    start.setDate(now.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  }
  if (range === 'year') {
    start.setMonth(now.getMonth() - 11, 1);
    start.setHours(0, 0, 0, 0);
  }

  return start;
}

function formatBucketLabel(date: Date, range: DashboardPayload['range']) {
  if (range === 'day') {
    return `${String(date.getHours()).padStart(2, '0')}:00`;
  }
  if (range === 'week') {
    return new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(date);
  }
  if (range === 'month') {
    return `${date.getDate()}.${date.getMonth() + 1}.`;
  }
  return new Intl.DateTimeFormat('de-DE', { month: 'short' }).format(date);
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function shiftMonths(date: Date, months: number) {
  const shifted = new Date(date);
  const targetMonth = shifted.getMonth() + months;
  const targetYear = shifted.getFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const day = shifted.getDate();
  const result = new Date(targetYear, normalizedMonth + 1, 0, shifted.getHours(), shifted.getMinutes(), shifted.getSeconds(), shifted.getMilliseconds());
  result.setDate(Math.min(day, result.getDate()));
  return result;
}

function sumSalesBetween(sales: { createdAt: Date; revenue: Prisma.Decimal | number }[], start: Date, end: Date) {
  return Number(
    sales
      .filter((sale) => sale.createdAt >= start && sale.createdAt <= end)
      .reduce((sum, sale) => sum + (typeof sale.revenue === 'number' ? sale.revenue : sale.revenue.toNumber()), 0)
      .toFixed(2),
  );
}

function calculateInventoryValueAtDate(
  products: { id: string; price: Prisma.Decimal | number; stock: number }[],
  movements: { productId: string; kind: string; quantity: number; createdAt: Date }[],
  targetDate: Date,
) {
  const stockByProduct = new Map(products.map((product) => [product.id, product.stock]));

  movements
    .filter((movement) => movement.createdAt > targetDate)
    .forEach((movement) => {
      const currentStock = stockByProduct.get(movement.productId) ?? 0;
      stockByProduct.set(movement.productId, movement.kind === 'restock' ? currentStock - movement.quantity : currentStock + movement.quantity);
    });

  return Number(
    products
      .reduce((sum, product) => {
        const price = typeof product.price === 'number' ? product.price : product.price.toNumber();
        return sum + (stockByProduct.get(product.id) ?? 0) * price;
      }, 0)
      .toFixed(2),
  );
}

function buildBuckets(range: DashboardPayload['range']) {
  const buckets: { key: string; label: string; date: Date }[] = [];
  const now = new Date();

  if (range === 'day') {
    for (let hour = 0; hour < 24; hour += 1) {
      const date = new Date(now);
      date.setHours(hour, 0, 0, 0);
      buckets.push({ key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${hour}`, label: formatBucketLabel(date, range), date });
    }
    return buckets;
  }

  if (range === 'week') {
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - offset);
      date.setHours(0, 0, 0, 0);
      buckets.push({ key: localDateKey(date), label: formatBucketLabel(date, range), date });
    }
    return buckets;
  }

  if (range === 'month') {
    for (let offset = 29; offset >= 0; offset -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - offset);
      date.setHours(0, 0, 0, 0);
      buckets.push({ key: localDateKey(date), label: formatBucketLabel(date, range), date });
    }
    return buckets;
  }

  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    buckets.push({ key: `${date.getFullYear()}-${date.getMonth()}`, label: formatBucketLabel(date, range), date });
  }

  return buckets;
}

function getBucketKey(date: Date, range: DashboardPayload['range']) {
  if (range === 'day') {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
  }
  if (range === 'year') {
    return `${date.getFullYear()}-${date.getMonth()}`;
  }
  return localDateKey(date);
}

export async function ensureSeedData() {
  return;
}

async function clearUploads() {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

  try {
    await mkdir(uploadsDir, { recursive: true });
    const files = await readdir(uploadsDir);
    await Promise.all(files.map((fileName) => unlink(path.join(uploadsDir, fileName))));
  } catch {
    return;
  }
}

export async function resetInventoryData() {
  await db.$transaction([
    db.sale.deleteMany(),
    db.movement.deleteMany(),
    db.product.deleteMany(),
  ]);

  await clearUploads();
}

export async function getDashboardData(range: DashboardPayload['range']): Promise<DashboardPayload> {
  await ensureSeedData();

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const previousMonthStart = shiftMonths(currentMonthStart, -1);
  const comparisonPoint = shiftMonths(now, -1);

  const [products, sales, movements] = await Promise.all([
    db.product.findMany({ orderBy: { createdAt: 'desc' } }),
    db.sale.findMany({
      where: { createdAt: { gte: previousMonthStart, lte: now } },
      orderBy: { createdAt: 'asc' },
    }),
    db.movement.findMany({
      where: { createdAt: { gte: previousMonthStart, lte: now } },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const productRecords = products.map(serializeProduct);
  const productMap = new Map(productRecords.map((product) => [product.id, product]));
  const buckets = buildBuckets(range);
  const revenueBucket = new Map<string, number>();
  const movementBucket = new Map<string, { restock: number; sale: number }>();

  buckets.forEach((bucket) => {
    revenueBucket.set(bucket.key, 0);
    movementBucket.set(bucket.key, { restock: 0, sale: 0 });
  });

  sales.forEach((sale) => {
    const key = getBucketKey(sale.createdAt, range);
    revenueBucket.set(key, (revenueBucket.get(key) ?? 0) + sale.revenue);
  });

  movements.forEach((movement) => {
    const key = getBucketKey(movement.createdAt, range);
    const current = movementBucket.get(key) ?? { restock: 0, sale: 0 };
    if (movement.kind === 'restock') {
      current.restock += movement.quantity;
    } else {
      current.sale += movement.quantity;
    }
    movementBucket.set(key, current);
  });

  const revenueSeries: RevenuePoint[] = buckets.map((bucket) => ({
    label: bucket.label,
    revenue: Number((revenueBucket.get(bucket.key) ?? 0).toFixed(2)),
  }));

  const movementSeries: MovementPoint[] = buckets.map((bucket) => {
    const value = movementBucket.get(bucket.key) ?? { restock: 0, sale: 0 };
    return {
      label: bucket.label,
      restock: value.restock,
      sale: value.sale,
    };
  });

  const categoryRevenue = new Map<string, number>();
  const categorySales = new Map<string, number>();
  const bestseller = new Map<string, { revenue: number; quantity: number }>();

  sales.forEach((sale) => {
    categoryRevenue.set(sale.category, (categoryRevenue.get(sale.category) ?? 0) + sale.revenue);
    if (sale.kind === 'sale') {
      categorySales.set(sale.category, (categorySales.get(sale.category) ?? 0) + sale.quantity);

      const current = bestseller.get(sale.productId) ?? { revenue: 0, quantity: 0 };
      current.revenue += sale.revenue;
      current.quantity += sale.quantity;
      bestseller.set(sale.productId, current);
    }
  });

  const categorySeries: CategoryPoint[] = Array.from(categoryRevenue.entries())
    .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
    .sort((left, right) => right.value - left.value);

  const bestsellerSeries = Array.from(bestseller.entries())
    .map(([productId, value]) => ({
      name: productMap.get(productId)?.name ?? 'Unknown',
      revenue: Number(value.revenue.toFixed(2)),
      quantity: value.quantity,
    }))
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 5);

  const totalRevenue = Number(sales.reduce((sum, sale) => sum + sale.revenue, 0).toFixed(2));
  const totalStock = productRecords.reduce((sum, product) => sum + product.stock, 0);
  const totalInventoryValue = Number(productRecords.reduce((sum, product) => sum + product.stock * product.price, 0).toFixed(2));
  const lowStockCount = productRecords.filter((product) => product.stock < 10).length;
  const currentMonthRevenue = sumSalesBetween(sales, currentMonthStart, now);
  const previousMonthRevenue = sumSalesBetween(sales, previousMonthStart, comparisonPoint);
  const previousInventoryValue = calculateInventoryValueAtDate(products, movements, comparisonPoint);

  return {
    range,
    products: productRecords,
    stats: {
      totalRevenue,
      totalStock,
      totalInventoryValue,
      currentMonthRevenue,
      previousMonthRevenue,
      totalInventoryValuePreviousMonth: previousInventoryValue,
      productCount: productRecords.length,
      lowStockCount,
    },
    revenueSeries,
    movementSeries,
    bestsellerSeries,
    categorySeries,
  };
}

export function parseSizes(input: FormDataEntryValue | null) {
  if (typeof input !== 'string' || !input.trim()) {
    return [] as string[];
  }

  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
