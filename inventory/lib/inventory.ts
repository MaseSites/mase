import { db } from './db';
import type {
  CategoryPoint,
  DashboardPayload,
  MovementPoint,
  ProductRecord,
  ProfitPoint,
  RevenuePoint,
  SaleRecord,
} from './types';
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

function toNumber(value: Prisma.Decimal | number) {
  return typeof value === 'number' ? value : value.toNumber();
}

function serializeProduct(product: {
  id: string;
  name: string;
  category: string;
  imagePath: string;
  stock: number;
  price: Prisma.Decimal | number;
  cost: Prisma.Decimal | number;
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
    price: toNumber(product.price),
    cost: toNumber(product.cost ?? 0),
    sizes: parseStoredSizes(product.sizes),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
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

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
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
      .reduce((sum, sale) => sum + toNumber(sale.revenue), 0)
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
        const price = toNumber(product.price);
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

// ──────────────────────────────────────────────────────────────
// SAMPLE DATA — seeds a realistic reselling catalogue + sales
// history the first time the database is empty, so the dashboard
// never looks empty for a demo / fresh deploy.
// ──────────────────────────────────────────────────────────────
const SAMPLE_PRODUCTS = [
  { name: 'Nike Dunk Low Panda', category: 'Sneakers', cost: 95, price: 159, stock: 12, image: '/sample/shirt.svg', sizes: ['40', '41', '42', '43', '44'] },
  { name: 'Jordan 1 Retro High OG', category: 'Sneakers', cost: 140, price: 249, stock: 6, image: '/sample/shirt.svg', sizes: ['41', '42', '43', '44'] },
  { name: 'Yeezy Boost 350 V2', category: 'Sneakers', cost: 180, price: 269, stock: 3, image: '/sample/shirt.svg', sizes: ['42', '43', '44'] },
  { name: 'New Balance 550', category: 'Sneakers', cost: 90, price: 145, stock: 0, image: '/sample/shirt.svg', sizes: ['40', '41', '42', '43'] },
  { name: 'Supreme Box Logo Hoodie', category: 'Streetwear', cost: 220, price: 420, stock: 4, image: '/sample/hoodie.svg', sizes: ['S', 'M', 'L', 'XL'] },
  { name: 'Trapstar Shooters Jacket', category: 'Streetwear', cost: 110, price: 210, stock: 9, image: '/sample/hoodie.svg', sizes: ['S', 'M', 'L', 'XL'] },
  { name: 'Corteiz Cargo Pants', category: 'Streetwear', cost: 70, price: 135, stock: 14, image: '/sample/pants.svg', sizes: ['S', 'M', 'L'] },
  { name: 'Stüssy Basic Tee', category: 'Streetwear', cost: 25, price: 65, stock: 22, image: '/sample/shirt.svg', sizes: ['S', 'M', 'L', 'XL'] },
  { name: 'Nike Tech Fleece Cap', category: 'Accessoires', cost: 18, price: 45, stock: 2, image: '/sample/cap.svg', sizes: ['One Size'] },
  { name: 'Louis Vuitton Belt', category: 'Accessoires', cost: 240, price: 390, stock: 5, image: '/sample/cap.svg', sizes: ['85', '90', '95'] },
];

let seedInFlight: Promise<void> | null = null;

export async function ensureSeedData() {
  const count = await db.product.count();
  if (count > 0) return;
  if (seedInFlight) return seedInFlight;

  seedInFlight = (async () => {
    const now = Date.now();
    let rngState = 20260529;
    const rng = () => {
      rngState = (rngState * 1103515245 + 12345) & 0x7fffffff;
      return rngState / 0x7fffffff;
    };

    for (const sample of SAMPLE_PRODUCTS) {
      const product = await db.product.create({
        data: {
          name: sample.name,
          category: sample.category,
          imagePath: sample.image,
          stock: sample.stock,
          price: sample.price,
          cost: sample.cost,
          sizes: JSON.stringify(sample.sizes),
        },
      });

      // initial restock movement
      await db.movement.create({
        data: { productId: product.id, productName: product.name, category: product.category, kind: 'restock', quantity: sample.stock + 10 },
      });

      // 4–9 sales spread over the last 32 days
      const saleCount = 4 + Math.floor(rng() * 6);
      for (let i = 0; i < saleCount; i += 1) {
        const daysAgo = Math.floor(rng() * 32);
        const qty = 1 + Math.floor(rng() * 2);
        const createdAt = new Date(now - daysAgo * 86_400_000 - Math.floor(rng() * 80_000_000));
        await db.sale.create({
          data: {
            productId: product.id,
            productName: product.name,
            category: product.category,
            kind: 'sale',
            quantity: qty,
            unitPrice: sample.price,
            revenue: Number((qty * sample.price).toFixed(2)),
            createdAt,
          },
        });
        await db.movement.create({
          data: { productId: product.id, productName: product.name, category: product.category, kind: 'sale', quantity: qty, createdAt },
        });
      }
    }
  })();

  try {
    await seedInFlight;
  } finally {
    seedInFlight = null;
  }
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
  const todayStart = startOfToday();

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
  const costFor = (productId: string) => productMap.get(productId)?.cost ?? 0;
  const profitOfSale = (sale: { productId: string; kind: string; quantity: number; revenue: Prisma.Decimal | number }) => {
    const revenue = toNumber(sale.revenue);
    if (sale.kind === 'adjustment') return revenue; // pure margin adjustment
    return Number((revenue - costFor(sale.productId) * sale.quantity).toFixed(2));
  };

  const buckets = buildBuckets(range);
  const revenueBucket = new Map<string, number>();
  const profitBucket = new Map<string, number>();
  const movementBucket = new Map<string, { restock: number; sale: number }>();

  buckets.forEach((bucket) => {
    revenueBucket.set(bucket.key, 0);
    profitBucket.set(bucket.key, 0);
    movementBucket.set(bucket.key, { restock: 0, sale: 0 });
  });

  sales.forEach((sale) => {
    const key = getBucketKey(sale.createdAt, range);
    if (revenueBucket.has(key)) {
      revenueBucket.set(key, (revenueBucket.get(key) ?? 0) + toNumber(sale.revenue));
      profitBucket.set(key, (profitBucket.get(key) ?? 0) + profitOfSale(sale));
    }
  });

  movements.forEach((movement) => {
    const key = getBucketKey(movement.createdAt, range);
    const current = movementBucket.get(key);
    if (!current) return;
    if (movement.kind === 'restock') current.restock += movement.quantity;
    else current.sale += movement.quantity;
    movementBucket.set(key, current);
  });

  const revenueSeries: RevenuePoint[] = buckets.map((bucket) => ({
    label: bucket.label,
    revenue: Number((revenueBucket.get(bucket.key) ?? 0).toFixed(2)),
  }));

  const profitSeries: ProfitPoint[] = buckets.map((bucket) => ({
    label: bucket.label,
    profit: Number((profitBucket.get(bucket.key) ?? 0).toFixed(2)),
  }));

  const movementSeries: MovementPoint[] = buckets.map((bucket) => {
    const value = movementBucket.get(bucket.key) ?? { restock: 0, sale: 0 };
    return { label: bucket.label, restock: value.restock, sale: value.sale };
  });

  const categoryRevenue = new Map<string, number>();
  const bestseller = new Map<string, { revenue: number; quantity: number }>();

  sales.forEach((sale) => {
    categoryRevenue.set(sale.category, (categoryRevenue.get(sale.category) ?? 0) + toNumber(sale.revenue));
    if (sale.kind === 'sale') {
      const current = bestseller.get(sale.productId) ?? { revenue: 0, quantity: 0 };
      current.revenue += toNumber(sale.revenue);
      current.quantity += sale.quantity;
      bestseller.set(sale.productId, current);
    }
  });

  const categorySeries: CategoryPoint[] = Array.from(categoryRevenue.entries())
    .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
    .sort((left, right) => right.value - left.value);

  const bestsellerSeries = Array.from(bestseller.entries())
    .map(([productId, value]) => ({
      name: productMap.get(productId)?.name ?? 'Unbekannt',
      revenue: Number(value.revenue.toFixed(2)),
      quantity: value.quantity,
    }))
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 6);

  const recentSales: SaleRecord[] = [...sales]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8)
    .map((sale) => ({
      id: sale.id,
      productName: sale.productName,
      category: sale.category,
      kind: sale.kind,
      quantity: sale.quantity,
      unitPrice: toNumber(sale.unitPrice),
      revenue: toNumber(sale.revenue),
      createdAt: sale.createdAt.toISOString(),
    }));

  const totalRevenue = Number(sales.reduce((sum, sale) => sum + toNumber(sale.revenue), 0).toFixed(2));
  const totalProfit = Number(sales.reduce((sum, sale) => sum + profitOfSale(sale), 0).toFixed(2));
  const totalStock = productRecords.reduce((sum, product) => sum + product.stock, 0);
  const totalInventoryValue = Number(productRecords.reduce((sum, product) => sum + product.stock * product.price, 0).toFixed(2));
  const lowStockCount = productRecords.filter((product) => product.stock > 0 && product.stock < 10).length;
  const currentMonthRevenue = sumSalesBetween(sales, currentMonthStart, now);
  const previousMonthRevenue = sumSalesBetween(sales, previousMonthStart, comparisonPoint);
  const previousInventoryValue = calculateInventoryValueAtDate(products, movements, comparisonPoint);

  const monthProfit = Number(
    sales.filter((s) => s.createdAt >= currentMonthStart && s.createdAt <= now).reduce((sum, s) => sum + profitOfSale(s), 0).toFixed(2),
  );
  const previousMonthProfit = Number(
    sales.filter((s) => s.createdAt >= previousMonthStart && s.createdAt <= comparisonPoint).reduce((sum, s) => sum + profitOfSale(s), 0).toFixed(2),
  );
  const todayRevenue = sumSalesBetween(sales, todayStart, now);
  const salesCountMonth = sales.filter((s) => s.kind === 'sale' && s.createdAt >= currentMonthStart).length;
  const openSales = sales.filter((s) => s.kind === 'sale' && s.createdAt >= todayStart).reduce((sum, s) => sum + s.quantity, 0);

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
      todayRevenue,
      monthProfit,
      previousMonthProfit,
      totalProfit,
      salesCountMonth,
      openSales,
    },
    revenueSeries,
    profitSeries,
    movementSeries,
    bestsellerSeries,
    categorySeries,
    recentSales,
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
