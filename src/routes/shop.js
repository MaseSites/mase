import express from 'express';
import { z } from 'zod';
import * as products from '../models/products.js';
import * as settings from '../models/settings.js';
import * as newsletter from '../models/newsletter.js';
import * as messages from '../models/messages.js';
import * as inventory from '../models/inventory.js';
import { validateBody } from '../middleware/validate.js';
import { discountPercent } from '../lib/format.js';
import { legalPages } from '../lib/legal.js';

const router = express.Router();

router.get('/', (req, res) => {
  const featured = products.bestsellers(8);
  const latest = products.listPublic().slice(0, 8);
  res.render('shop/home', {
    title: settings.get('shop_name'),
    featured,
    latest,
    categories: products.categories(),
    settings_hero_title: settings.get('hero_title'),
    settings_hero_sub: settings.get('hero_subtitle'),
    saleEndsAt: settings.get('sale_ends_at') || '',
    membersCount: settings.get('members_count') || '0',
    ratingsCount: settings.get('ratings_count') || '0',
    newsletterDone: req.query.news === '1',
    discountPercent,
  });
});

router.get('/shop', (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category : null;
  const q = typeof req.query.q === 'string' ? req.query.q.slice(0, 80) : '';

  const all = q.trim() ? products.search({ q, category }) : products.listPublic({ category });

  // Sortierung
  const sort = typeof req.query.sort === 'string' ? req.query.sort : '';
  const eff = (p) => (p.sale_price_cents ?? p.price_cents);
  if (sort === 'preis-auf') all.sort((a, b) => eff(a) - eff(b));
  else if (sort === 'preis-ab') all.sort((a, b) => eff(b) - eff(a));
  else if (sort === 'name') all.sort((a, b) => a.name.localeCompare(b.name, 'de'));
  // sonst: Standardreihenfolge (neueste zuerst)

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const perPage = 12;
  const totalPages = Math.max(1, Math.ceil(all.length / perPage));
  const items = all.slice((page - 1) * perPage, page * perPage);

  res.render('shop/shop', {
    title: q.trim() ? `Suche: ${q}` : 'Shop',
    items,
    total: all.length,
    query: q,
    categories: products.categories(),
    activeCategory: category,
    sort,
    page,
    totalPages,
    discountPercent,
  });
});

router.get('/produkt/:slug', (req, res, next) => {
  const product = products.getBySlug(req.params.slug);
  if (!product || !product.is_active) return next(); // -> 404

  // Bestand pro Grösse aus Inventory holen
  const invRows = inventory.byProduct(product.id);
  const inventoryMap = {};
  for (const row of invRows) {
    const key = row.size || '__nosize__';
    const avail = Math.max(0, row.stock - row.reserved);
    inventoryMap[key] = (inventoryMap[key] || 0) + avail;
  }

  res.render('shop/product', {
    title: product.name,
    product,
    related: products.related(product.category, product.id, 4),
    discountPercent,
    inventoryMap,
    errorParam: req.query.error || null,
  });
});

router.get('/wunschliste', (req, res) => {
  res.render('shop/wishlist', { title: 'Wunschliste' });
});

// Rechtsseiten (Impressum, Datenschutz, AGB, Widerruf)
router.get('/:legal(impressum|datenschutz|agb|widerruf)', (req, res, next) => {
  const pages = legalPages(settings.all());
  const page = pages[req.params.legal];
  if (!page) return next();
  res.render('shop/legal', { title: page.title, page });
});

router.get('/kontakt', (req, res) => {
  res.render('shop/contact', {
    title: 'Kontakt',
    contactEmail: settings.get('contact_email'),
    sent: req.query.sent === '1',
    errors: null,
    values: {},
  });
});

const contactSchema = z.object({
  name: z.string().min(2, 'Bitte Namen angeben.').max(120),
  email: z.string().email('Bitte gültige E-Mail angeben.').max(200),
  message: z.string().min(5, 'Bitte Nachricht eingeben.').max(2000),
});

router.post('/kontakt', validateBody(contactSchema), (req, res) => {
  if (req.validationErrors) {
    return res.status(400).render('shop/contact', {
      title: 'Kontakt',
      contactEmail: settings.get('contact_email'),
      sent: false,
      errors: req.validationErrors,
      values: req.body,
    });
  }
  messages.create({ name: req.valid.name, email: req.valid.email, body: req.valid.message });
  res.redirect('/kontakt?sent=1');
});

const newsletterSchema = z.object({
  email: z.string().email().max(200),
});

router.post('/newsletter', validateBody(newsletterSchema), (req, res) => {
  if (!req.validationErrors && req.valid) {
    newsletter.subscribe(req.valid.email);
  }
  // Bei AJAX als JSON antworten, sonst zurück zur Startseite.
  if (req.accepts('json') && !req.accepts('html')) {
    return res.json({ ok: true });
  }
  res.redirect('/?news=1#newsletter');
});

export default router;
