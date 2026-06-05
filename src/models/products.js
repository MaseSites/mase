import db from '../config/db.js';

function rowToProduct(row) {
  if (!row) return null;
  return {
    ...row,
    sizes: safeParse(row.sizes, []),
    option_groups: safeParse(row.option_groups, []),
    images: safeParse(row.images, []),
    is_bestseller: !!row.is_bestseller,
    is_active: !!row.is_active,
  };
}


function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

export function slugify(name) {
  const base = String(name)
    .toLowerCase()
    // Deutsche Umlaute zuerst transliterieren (vor der NFKD-Zerlegung)
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    // Übrige Akzente (é, ñ, ...) zerlegen und Diakritika entfernen
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'produkt';
  return base;
}

export function uniqueSlug(name, excludeId = null) {
  let slug = slugify(name);
  let candidate = slug;
  let i = 2;
  const exists = db.prepare('SELECT id FROM products WHERE slug = ? AND id IS NOT ?');
  while (exists.get(candidate, excludeId)) {
    candidate = `${slug}-${i++}`;
  }
  return candidate;
}

const listActiveStmt = db.prepare(
  'SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC'
);
const listAllStmt = db.prepare('SELECT * FROM products ORDER BY created_at DESC');
const byIdStmt = db.prepare('SELECT * FROM products WHERE id = ?');
const bySlugStmt = db.prepare('SELECT * FROM products WHERE slug = ?');
const bestsellersStmt = db.prepare(
  'SELECT * FROM products WHERE is_active = 1 AND is_bestseller = 1 ORDER BY created_at DESC LIMIT ?'
);
const categoriesStmt = db.prepare(
  "SELECT DISTINCT category FROM products WHERE is_active = 1 AND category <> '' ORDER BY category"
);

export function listPublic({ category = null } = {}) {
  const rows = category
    ? db.prepare('SELECT * FROM products WHERE is_active = 1 AND category = ? ORDER BY created_at DESC').all(category)
    : listActiveStmt.all();
  return rows.map(rowToProduct);
}

export function listAll() {
  return listAllStmt.all().map(rowToProduct);
}

export function getById(id) {
  return rowToProduct(byIdStmt.get(id));
}

export function getBySlug(slug) {
  return rowToProduct(bySlugStmt.get(slug));
}

export function bestsellers(limit = 4) {
  return bestsellersStmt.all(limit).map(rowToProduct);
}

export function categories() {
  return categoriesStmt.all().map((r) => r.category);
}

const insertStmt = db.prepare(`
  INSERT INTO products
    (slug, name, description, category, price_cents, sale_price_cents, sizes, option_groups, images, stock, is_bestseller, is_active)
  VALUES
    (@slug, @name, @description, @category, @price_cents, @sale_price_cents, @sizes, @option_groups, @images, @stock, @is_bestseller, @is_active)
`);

const updateStmt = db.prepare(`
  UPDATE products SET
    slug = @slug, name = @name, description = @description, category = @category,
    price_cents = @price_cents, sale_price_cents = @sale_price_cents,
    sizes = @sizes, option_groups = @option_groups, images = @images, stock = @stock,
    is_bestseller = @is_bestseller, is_active = @is_active,
    updated_at = datetime('now')
  WHERE id = @id
`);

const deleteStmt = db.prepare('DELETE FROM products WHERE id = ?');

function serialize(p) {
  return {
    slug: p.slug,
    name: p.name,
    description: p.description ?? '',
    category: p.category ?? 'Allgemein',
    price_cents: p.price_cents ?? 0,
    sale_price_cents: p.sale_price_cents ?? null,
    sizes: JSON.stringify(p.sizes ?? []),
    option_groups: JSON.stringify(p.option_groups ?? []),
    images: JSON.stringify(p.images ?? []),
    stock: p.stock ?? 0,
    is_bestseller: p.is_bestseller ? 1 : 0,
    is_active: p.is_active ? 1 : 0,
  };
}

export function create(p) {
  const slug = uniqueSlug(p.name);
  const info = insertStmt.run({ ...serialize({ ...p, slug }) });
  return getById(info.lastInsertRowid);
}

export function update(id, p) {
  const slug = uniqueSlug(p.name, id);
  updateStmt.run({ id, ...serialize({ ...p, slug }) });
  return getById(id);
}

export function remove(id) {
  return deleteStmt.run(id).changes > 0;
}

// Volltext-ähnliche Suche (Name/Kategorie/Beschreibung), nur aktive Produkte.
export function search({ q = '', category = null } = {}) {
  const term = `%${String(q).trim().toLowerCase()}%`;
  let sql = `SELECT * FROM products WHERE is_active = 1
    AND (lower(name) LIKE @term OR lower(category) LIKE @term OR lower(description) LIKE @term)`;
  const params = { term };
  if (category) {
    sql += ' AND category = @category';
    params.category = category;
  }
  sql += ' ORDER BY is_bestseller DESC, created_at DESC';
  return db.prepare(sql).all(params).map(rowToProduct);
}

// Verwandte Produkte (gleiche Kategorie), ohne das aktuelle Produkt.
export function related(category, excludeId, limit = 4) {
  const rows = db
    .prepare(
      `SELECT * FROM products WHERE is_active = 1 AND category = ? AND id <> ?
       ORDER BY is_bestseller DESC, created_at DESC LIMIT ?`
    )
    .all(category, excludeId, limit);
  if (rows.length >= limit) return rows.map(rowToProduct);
  // Auffüllen mit weiteren aktiven Produkten
  const extra = db
    .prepare(
      `SELECT * FROM products WHERE is_active = 1 AND id <> ? AND category <> ?
       ORDER BY created_at DESC LIMIT ?`
    )
    .all(excludeId, category, limit - rows.length);
  return [...rows, ...extra].map(rowToProduct);
}

// Schlanke Liste für die öffentliche API (Suche/Wunschliste).
export function listLite() {
  return listActiveStmt.all().map((r) => {
    const p = rowToProduct(r);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      price_cents: p.price_cents,
      sale_price_cents: p.sale_price_cents,
      image: p.images?.[0]?.src || null,
      stock: p.stock,
    };
  });
}
