import express from 'express';
import * as products from '../models/products.js';
import * as inventory from '../models/inventory.js';
import { formatPrice } from '../lib/format.js';
import * as settings from '../models/settings.js';

const router = express.Router();

// Schlanke Produktliste (für Live-Suche & Wunschliste im Browser).
router.get('/produkte', (req, res) => {
  const currency = settings.get('currency');
  const items = products.listLite().map((p) => ({
    ...p,
    priceText: formatPrice(p.sale_price_cents ?? p.price_cents, currency),
    oldPriceText: p.sale_price_cents ? formatPrice(p.price_cents, currency) : null,
    url: '/produkt/' + p.slug,
  }));
  res.set('Cache-Control', 'no-store');
  res.json({ items });
});

// Verfügbarer Bestand pro Variante (für AJAX auf der Produktdetail-Seite).
// Gibt Map: { size -> availableQty } zurück.
router.get('/bestand/:productId', (req, res) => {
  const id = Number(req.params.productId);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'Ungültige Produkt-ID.' });
  }
  const rows = inventory.byProduct(id);
  const stockMap = {};
  for (const row of rows) {
    const key = row.size || '__nosize__';
    const avail = Math.max(0, row.stock - row.reserved);
    stockMap[key] = (stockMap[key] || 0) + avail;
  }
  res.set('Cache-Control', 'no-store');
  res.json({ productId: id, stock: stockMap });
});

export default router;
