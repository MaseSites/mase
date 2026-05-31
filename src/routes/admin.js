import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import * as products from '../models/products.js';
import * as settings from '../models/settings.js';
import * as users from '../models/users.js';
import * as orders from '../models/orders.js';
import * as newsletter from '../models/newsletter.js';
import * as messages from '../models/messages.js';
import * as inventory from '../models/inventory.js';
import { validateBody } from '../middleware/validate.js';
import { formatPrice } from '../lib/format.js';
import { config } from '../config/env.js';

const router = express.Router();

// Dashboard-Übersicht
router.get('/', (req, res) => {
  const all = products.listAll();
  const allOrders = orders.list();
  const ostats = orders.stats(7);
  const lowStockItems = inventory.lowStock();
  const outOfStock = all.filter((p) => p.stock <= 0 && p.is_active);

  res.render('admin/dashboard', {
    title: 'Dashboard',
    stats: {
      products: all.length,
      active: all.filter((p) => p.is_active).length,
      orders: allOrders.length,
      revenue: formatPrice(ostats.totalRevenue, settings.get('currency')),
      open: ostats.openCount,
      subscribers: newsletter.count(),
      messages: messages.unreadCount(),
      lowStock: lowStockItems.length,
      outOfStock: outOfStock.length,
    },
    chart: ostats,
    recentOrders: allOrders.slice(0, 6),
    lowStockWarnings: lowStockItems.slice(0, 5),
  });
});

// ---------------------------------------------------------------------------
// Lager-Tab
// ---------------------------------------------------------------------------

router.get('/lager', (req, res) => {
  const all = inventory.allInventory();
  const warnings = inventory.lowStock();
  res.render('admin/inventory', {
    title: 'Lager',
    items: all,
    warnings,
    products: products.listAll(),
  });
});

// Einzelprodukt-Lagerbestand bearbeiten
router.get('/lager/:productId', (req, res, next) => {
  const id = Number(req.params.productId);
  const product = products.getById(id);
  if (!product) return next();
  const rows = inventory.byProduct(id);
  res.render('admin/inventory-product', {
    title: `Lager · ${product.name}`,
    product,
    rows,
  });
});

const inventoryRowSchema = z.object({
  size: z.string().max(50).optional().default(''),
  color: z.string().max(50).optional().default(''),
  sku: z.string().max(100).optional().default(''),
  stock: z.coerce.number().int().min(0).max(1000000),
  min_stock: z.coerce.number().int().min(0).max(1000).default(3),
  next_delivery: z.string().max(30).optional().default(''),
  notes: z.string().max(500).optional().default(''),
});

const inventoryBatchSchema = z.object({
  product_id: z.coerce.number().int().positive(),
  // Varianten kommen als JSON-String (aus JS serialisiert)
  variants: z.string().max(50000),
});

router.post('/lager/speichern', validateBody(inventoryBatchSchema), (req, res) => {
  if (req.validationErrors) {
    return res.status(400).json({ error: 'Validierungsfehler', issues: req.validationErrors });
  }
  const { product_id, variants: variantsRaw } = req.valid;
  const product = products.getById(product_id);
  if (!product) return res.status(404).json({ error: 'Produkt nicht gefunden.' });

  let variantsParsed;
  try {
    variantsParsed = JSON.parse(variantsRaw);
    if (!Array.isArray(variantsParsed)) throw new Error();
  } catch {
    return res.status(400).json({ error: 'Ungültige Variantendaten.' });
  }

  const rows = [];
  for (const v of variantsParsed) {
    const parsed = inventoryRowSchema.safeParse(v);
    if (!parsed.success) continue;
    rows.push({ product_id, ...parsed.data });
  }

  inventory.upsertMany(rows);

  // Produkt-Gesamt-Bestand synchronisieren (für schnelle Abfragen)
  const totalStock = rows.reduce((s, r) => s + (r.stock || 0), 0);
  products.update(product_id, { ...product, stock: totalStock });

  if (req.accepts('json') && !req.accepts('html')) {
    return res.json({ ok: true });
  }
  res.redirect('/admin/lager/' + product_id);
});

// ---------------------------------------------------------------------------
// Kontakt-Nachrichten
// ---------------------------------------------------------------------------

router.get('/nachrichten', (req, res) => {
  res.render('admin/messages', { title: 'Nachrichten', messages: messages.list() });
});

const msgReadSchema = z.object({ id: z.coerce.number().int().positive() });
router.post('/nachrichten/gelesen', validateBody(msgReadSchema), (req, res) => {
  if (!req.validationErrors && req.valid) messages.markRead(req.valid.id);
  res.redirect('/admin/nachrichten');
});

// Produktliste
router.get('/produkte', (req, res) => {
  res.render('admin/products-list', {
    title: 'Produkte',
    items: products.listAll(),
  });
});

// Neues Produkt – Formular
router.get('/produkte/neu', (req, res) => {
  res.render('admin/product-form', {
    title: 'Neues Produkt',
    product: null,
    formAction: '/admin/api/products',
    method: 'POST',
  });
});

// Produkt bearbeiten – Formular
router.get('/produkte/:id/bearbeiten', (req, res, next) => {
  const product = products.getById(Number(req.params.id));
  if (!product) return next();
  res.render('admin/product-form', {
    title: 'Produkt bearbeiten',
    product,
    formAction: `/admin/api/products/${product.id}`,
    method: 'PUT',
  });
});

// Bestellungen
router.get('/bestellungen', (req, res) => {
  res.render('admin/orders', {
    title: 'Bestellungen',
    orders: orders.list(),
  });
});

router.get('/bestellungen/:reference', (req, res, next) => {
  const order = orders.getByReference(req.params.reference);
  if (!order) return next();
  res.render('admin/order-detail', { title: 'Bestellung ' + order.reference, order });
});

const orderStatusSchema = z.object({
  status: z.enum(['neu', 'in_bearbeitung', 'versendet', 'storniert']),
  payment_status: z.enum(['offen', 'bezahlt', 'erstattet']),
});

router.post('/bestellungen/:reference/status', validateBody(orderStatusSchema), (req, res) => {
  if (!req.validationErrors && req.valid) {
    orders.updateStatus(req.params.reference, req.valid.status, req.valid.payment_status);
  }
  res.redirect('/admin/bestellungen/' + encodeURIComponent(req.params.reference));
});

// Newsletter-Abonnenten
router.get('/newsletter', (req, res) => {
  res.render('admin/newsletter', { title: 'Newsletter', subscribers: newsletter.list() });
});

// Einstellungen
router.get('/einstellungen', (req, res) => {
  res.render('admin/settings', {
    title: 'Einstellungen',
    settings: settings.all(),
    notice: req.query.ok ? 'Gespeichert.' : null,
    error: null,
  });
});

const hexColor = z.string().regex(/^#[0-9a-fA-F]{3,8}$/, 'Ungültige Farbe').max(9);
const settingsSchema = z.object({
  shop_name: z.string().min(1).max(120),
  tagline: z.string().max(200).optional().default(''),
  hero_title: z.string().max(200).optional().default(''),
  hero_subtitle: z.string().max(400).optional().default(''),
  sale_ends_at: z.string().max(40).optional().default(''),
  members_count: z.coerce.number().int().min(0).max(100000000).optional().default(0),
  ratings_count: z.coerce.number().int().min(0).max(100000000).optional().default(0),
  contact_email: z.string().email().max(200),
  announcement: z.string().max(200).optional().default(''),
  hero_image: z.string().max(400).optional().default(''),
  accent: hexColor.optional().default('#8b5cf6'),
  accent_2: hexColor.optional().default('#ec4899'),
  accent_3: hexColor.optional().default('#22d3ee'),
});

router.post('/einstellungen', validateBody(settingsSchema), (req, res) => {
  if (req.validationErrors) {
    return res.status(400).render('admin/settings', {
      title: 'Einstellungen',
      settings: { ...settings.all(), ...req.body },
      notice: null,
      error: req.validationErrors.map((e) => `${e.field}: ${e.message}`).join(' · '),
    });
  }
  settings.setMany(req.valid);
  res.redirect('/admin/einstellungen?ok=1');
});

// Passwörter ändern (Admin-Passwort + Gate-Passwort)
const passwordSchema = z.object({
  which: z.enum(['admin', 'gate']),
  new_password: z.string().min(6, 'Mindestens 6 Zeichen.').max(200),
});

router.post('/passwort', validateBody(passwordSchema), async (req, res) => {
  if (req.validationErrors) {
    return res.redirect('/admin/einstellungen');
  }
  const { which, new_password } = req.valid;
  if (which === 'admin') {
    await users.changePassword(req.session.adminId, new_password);
  } else {
    const hash = await bcrypt.hash(new_password, config.bcryptRounds);
    settings.set('gate_password_hash', hash);
  }
  res.redirect('/admin/einstellungen?ok=1');
});

export default router;
