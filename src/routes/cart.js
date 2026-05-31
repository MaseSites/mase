import express from 'express';
import { z } from 'zod';
import * as products from '../models/products.js';
import * as orders from '../models/orders.js';
import * as inventory from '../models/inventory.js';
import * as settings from '../models/settings.js';
import { validateBody } from '../middleware/validate.js';
import { paymentProvider } from '../services/payments.js';
import { formatPrice, placeholder } from '../lib/format.js';

const router = express.Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCart(req) {
  if (!req.session.cart) req.session.cart = [];
  return req.session.cart;
}

/**
 * Baut den Warenkorb-View anhand frischer DB-Daten auf.
 * Preise und Lagerbestand kommen immer vom Server – nie vom Client.
 */
function buildCartView(cart) {
  const items = [];
  let total = 0;
  const warnings = [];

  for (const line of cart) {
    const p = products.getById(line.productId);
    if (!p || !p.is_active) {
      warnings.push({ productId: line.productId, type: 'unavailable' });
      continue;
    }

    const unit = p.sale_price_cents ?? p.price_cents;
    const avail = inventory.stockForVariant(line.productId, line.size || '', '');
    const safeQty = Math.min(line.qty, Math.max(0, avail));

    if (safeQty === 0) {
      warnings.push({
        productId: line.productId,
        name: p.name,
        size: line.size,
        type: 'sold_out',
        message: `"${p.name}"${line.size ? ` (${line.size})` : ''} ist ausverkauft.`,
      });
      // Linie trotzdem mit qty=0 mitgeben, damit sie im HTML als gesperrt erscheint
    }

    const lineTotal = unit * safeQty;
    total += lineTotal;
    items.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      size: line.size,
      qty: safeQty,
      originalQty: line.qty,
      unitCents: unit,
      lineCents: lineTotal,
      image: p.images?.[0]?.src || null,
      stock: avail,
      maxQty: avail,
      isSoldOut: safeQty === 0,
      wasReduced: safeQty < line.qty,
    });
  }

  return { items, total, warnings };
}

function cartStateJson(req) {
  const view = buildCartView(getCart(req));
  const currency = settings.get('currency');
  return {
    count: view.items.reduce((n, it) => n + it.qty, 0),
    totalText: formatPrice(view.total, currency),
    warnings: view.warnings,
    items: view.items.map((it) => ({
      productId: it.productId,
      slug: it.slug,
      name: it.name,
      size: it.size,
      qty: it.qty,
      maxQty: it.maxQty,
      image: it.image || placeholder(it.name),
      lineText: formatPrice(it.lineCents, currency),
      url: '/produkt/' + it.slug,
      isSoldOut: it.isSoldOut,
      wasReduced: it.wasReduced,
    })),
  };
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const addSchema = z.object({
  productId: z.coerce.number().int().positive(),
  size: z.string().max(50).optional().default(''),
  qty: z.coerce.number().int().min(1).max(100).default(1),
});

const updateSchema = z.object({
  index: z.coerce.number().int().min(0),
  qty: z.coerce.number().int().min(0).max(100),
});

// ---------------------------------------------------------------------------
// Warenkorb – HTML-Routen
// ---------------------------------------------------------------------------

router.get('/warenkorb', (req, res) => {
  const view = buildCartView(getCart(req));
  res.render('shop/cart', { title: 'Warenkorb', ...view });
});

router.post('/warenkorb/add', validateBody(addSchema), (req, res) => {
  if (req.validationErrors) return res.redirect('back');
  const { productId, size, qty } = req.valid;
  const p = products.getById(productId);
  if (!p || !p.is_active) return res.redirect('/shop');

  // Grösse pflichtprüfung (Server-seitig)
  if (p.sizes && p.sizes.length > 0 && !size) {
    return res.redirect(`/produkt/${p.slug}?error=size`);
  }

  const avail = inventory.stockForVariant(productId, size, '');
  if (avail <= 0) return res.redirect(`/produkt/${p.slug}?error=soldout`);

  const cart = getCart(req);
  const existing = cart.find((l) => l.productId === productId && l.size === size);
  if (existing) {
    existing.qty = Math.min(avail, existing.qty + qty);
  } else {
    cart.push({ productId, size, qty: Math.min(avail, qty) });
  }
  res.redirect('/warenkorb');
});

router.post('/warenkorb/update', validateBody(updateSchema), (req, res) => {
  if (req.validationErrors) return res.redirect('/warenkorb');
  const cart = getCart(req);
  const { index, qty } = req.valid;
  if (index < cart.length) {
    if (qty === 0) {
      cart.splice(index, 1);
    } else {
      const line = cart[index];
      const avail = inventory.stockForVariant(line.productId, line.size || '', '');
      cart[index].qty = Math.min(avail, qty);
    }
  }
  res.redirect('/warenkorb');
});

router.post('/warenkorb/clear', (req, res) => {
  req.session.cart = [];
  res.redirect('/warenkorb');
});

// ---------------------------------------------------------------------------
// AJAX-Endpunkte
// ---------------------------------------------------------------------------

router.get('/warenkorb/api/state', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(cartStateJson(req));
});

router.post('/warenkorb/api/add', validateBody(addSchema), (req, res) => {
  if (req.validationErrors) {
    return res.status(400).json({ error: 'Ungültige Eingabe.', issues: req.validationErrors });
  }
  const { productId, size, qty } = req.valid;
  const p = products.getById(productId);
  if (!p || !p.is_active) return res.status(404).json({ error: 'Produkt nicht verfügbar.' });

  if (p.sizes && p.sizes.length > 0 && !size) {
    return res.status(400).json({ error: 'Bitte Grösse wählen.' });
  }

  const avail = inventory.stockForVariant(productId, size, '');
  if (avail <= 0) {
    return res.status(409).json({ error: 'Produkt ist ausverkauft.' });
  }

  const cart = getCart(req);
  const existing = cart.find((l) => l.productId === productId && l.size === size);
  const safeQty = Math.min(avail, qty);

  if (existing) {
    const newQty = Math.min(avail, existing.qty + safeQty);
    if (newQty === existing.qty) {
      return res.status(409).json({ error: `Nur noch ${avail} Stück verfügbar.` });
    }
    existing.qty = newQty;
  } else {
    cart.push({ productId, size, qty: safeQty });
  }

  const state = cartStateJson(req);
  res.json({ ok: true, added: p.name, ...state });
});

router.post('/warenkorb/api/update', validateBody(updateSchema), (req, res) => {
  if (req.validationErrors) return res.status(400).json({ error: 'Ungültige Eingabe.' });
  const cart = getCart(req);
  const { index, qty } = req.valid;
  if (index < cart.length) {
    if (qty === 0) {
      cart.splice(index, 1);
    } else {
      const line = cart[index];
      const avail = inventory.stockForVariant(line.productId, line.size || '', '');
      cart[index].qty = Math.min(avail, qty);
    }
  }
  res.json({ ok: true, ...cartStateJson(req) });
});

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

router.get('/kasse', (req, res) => {
  const view = buildCartView(getCart(req));
  if (view.items.length === 0) return res.redirect('/warenkorb');
  res.render('shop/checkout', { title: 'Kasse', ...view, errors: null, values: {} });
});

const checkoutSchema = z.object({
  name: z.string().min(2, 'Bitte Namen angeben.').max(120),
  email: z.string().email('Bitte gültige E-Mail angeben.').max(200),
  address: z.string().min(5, 'Bitte Adresse angeben.').max(500),
});

router.post('/kasse', validateBody(checkoutSchema), async (req, res) => {
  const cart = getCart(req);
  const view = buildCartView(cart);

  if (view.items.length === 0) return res.redirect('/warenkorb');

  // Finale Bestandsprüfung direkt vor Speichern (Race-Condition-Schutz)
  const stockIssues = inventory.validateCart(
    view.items.map((it) => ({ productId: it.productId, size: it.size, name: it.name, qty: it.qty }))
  );
  if (stockIssues.length > 0) {
    return res.status(409).render('shop/checkout', {
      title: 'Kasse',
      ...view,
      errors: stockIssues.map((i) => ({ message: i.message })),
      values: req.body,
    });
  }

  if (req.validationErrors) {
    return res.status(400).render('shop/checkout', {
      title: 'Kasse',
      ...view,
      errors: req.validationErrors,
      values: req.body,
    });
  }

  const { name, email, address } = req.valid;

  // Bestand abbuchen
  inventory.deductStock(view.items);

  const reference = orders.create({
    customer_name: name,
    email,
    address,
    items: view.items,
    total_cents: view.total,
  });

  const payment = await paymentProvider.createCheckout({ reference, total: view.total });

  req.session.cart = [];

  if (payment.redirectUrl) return res.redirect(payment.redirectUrl);

  res.render('shop/order-confirmation', {
    title: 'Bestellung eingegangen',
    reference,
    contactEmail: settings.get('contact_email'),
  });
});

export default router;
