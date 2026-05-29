export type SizeValue = 'XS' | 'S' | 'M' | 'L' | 'XL';

export type ProductRecord = {
  id: string;
  name: string;
  category: string;
  imagePath: string;
  stock: number;
  price: number;
  sizes: string[];
  createdAt: string;
  updatedAt: string;
};

export type DashboardStats = {
  totalRevenue: number;
  totalInventoryValue: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  totalInventoryValuePreviousMonth: number;
  totalStock: number;
  productCount: number;
  lowStockCount: number;
};

export type MovementPoint = {
  label: string;
  restock: number;
  sale: number;
};

export type RevenuePoint = {
  label: string;
  revenue: number;
};

export type CategoryPoint = {
  name: string;
  value: number;
};

export type BestsellerPoint = {
  name: string;
  revenue: number;
  quantity: number;
};

export type DashboardPayload = {
  range: 'day' | 'week' | 'month' | 'year';
  products: ProductRecord[];
  stats: DashboardStats;
  revenueSeries: RevenuePoint[];
  movementSeries: MovementPoint[];
  bestsellerSeries: BestsellerPoint[];
  categorySeries: CategoryPoint[];
};
