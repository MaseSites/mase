import db from '../config/db.js';
import { customAlphabet } from 'nanoid';

const refId = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

const insertStmt = db.prepare(`
  INSERT INTO orders (reference, customer_name, email, address, items, total_cents, status, payment_status)
  VALUES (@reference, @customer_name, @email, @address, @items, @total_cents, @status, @payment_status)
`);
const listStmt = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200');
const byRefStmt = db.prepare('SELECT * FROM orders WHERE reference = ?');

export function create({ customer_name, email, address, items, total_cents }) {
  const reference = 'ABJ-' + refId();
  insertStmt.run({
    reference,
    customer_name,
    email,
    address: address ?? '',
    items: JSON.stringify(items ?? []),
    total_cents: total_cents ?? 0,
    status: 'neu',
    payment_status: 'offen',
  });
  return reference;
}

export function list() {
  return listStmt.all().map((r) => ({ ...r, items: JSON.parse(r.items || '[]') }));
}

export function getByReference(reference) {
  const r = byRefStmt.get(reference);
  return r ? { ...r, items: JSON.parse(r.items || '[]') } : null;
}

const updateStatusStmt = db.prepare(
  'UPDATE orders SET status = ?, payment_status = ? WHERE reference = ?'
);

export function updateStatus(reference, status, paymentStatus) {
  return updateStatusStmt.run(status, paymentStatus, reference).changes > 0;
}

// Aggregierte Umsatzkennzahlen + Tagesreihe (letzte N Tage) für das Dashboard.
export function stats(days = 7) {
  const totalRevenue = db
    .prepare("SELECT COALESCE(SUM(total_cents),0) AS c FROM orders WHERE payment_status = 'bezahlt'")
    .get().c;
  const openCount = db.prepare("SELECT COUNT(*) AS n FROM orders WHERE payment_status <> 'bezahlt'").get().n;

  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = db
      .prepare(
        `SELECT COUNT(*) AS orders, COALESCE(SUM(total_cents),0) AS revenue
         FROM orders WHERE date(created_at) = date('now', ?)`
      )
      .get(`-${i} days`);
    series.push({ dayOffset: i, orders: day.orders, revenue: day.revenue });
  }
  const maxOrders = Math.max(1, ...series.map((s) => s.orders));
  return { totalRevenue, openCount, series, maxOrders };
}
