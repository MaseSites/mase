import express from 'express';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import * as products from '../models/products.js';
import * as inventory from '../models/inventory.js';
import { parsePriceToCents } from '../lib/format.js';
import { buildCombinations, buildVariantTitle, parseOptionGroups } from '../lib/variant-options.js';
import {
  uploadImages,
  verifyUploadedImages,
  handleUploadErrors,
  publicUploadPath,
} from '../middleware/upload.js';

const router = express.Router();

const SANITIZE_OPTS = {
  allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['https', 'mailto'],
};

// Text-/Zahlenfelder (Bilder werden separat zusammengesetzt)
const productSchema = z.object({
  name: z.string().min(1, 'Name erforderlich').max(160),
  description: z.string().max(8000).optional().default(''),
  category: z.string().max(80).optional().default('Allgemein'),
  price: z.string().optional().default(''),
  sale_price: z.string().optional().default(''),
  stock: z.coerce.number().int().min(0).max(1000000).optional().default(0),
  is_bestseller: z.preprocess((v) => v === '1' || v === 'on' || v === true, z.boolean()).optional(),
  is_active: z.preprocess((v) => v === '1' || v === 'on' || v === true, z.boolean()).optional(),
  has_variants: z.preprocess((v) => v === '1' || v === 'on' || v === true, z.boolean()).optional().default(false),
  image_urls: z.string().max(4000).optional().default(''),
  existing_images: z.string().max(20000).optional().default('[]'),
  option_groups: z.string().max(20000).optional().default('[]'),
  variants: z.string().max(20000).optional().default(''),
});

function parseImageUrls(input) {
  return String(input)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((u) => /^https:\/\/[^\s]+$/i.test(u)) // nur HTTPS erlaubt
    .slice(0, 12)
    .map((src) => ({ type: 'url', src }));
}

function parseExistingImages(input) {
  try {
    const arr = JSON.parse(input);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((i) => i && typeof i.src === 'string')
      .filter((i) =>
        i.type === 'upload'
          ? i.src.startsWith('/uploads/')
          : /^https:\/\//i.test(i.src)
      )
      .slice(0, 12)
      .map((i) => ({ type: i.type === 'upload' ? 'upload' : 'url', src: i.src }));
  } catch {
    return [];
  }
}

function assembleProduct(body, files) {
  const data = productSchema.parse(body);

  const priceCents = parsePriceToCents(data.price);
  if (priceCents == null) {
    throw new z.ZodError([{ code: 'custom', path: ['price'], message: 'Bitte gib einen gültigen Preis ein.' }]);
  }

  const salePriceCents = data.sale_price ? parsePriceToCents(data.sale_price) : null;
  if (data.sale_price && salePriceCents == null) {
    throw new z.ZodError([{ code: 'custom', path: ['sale_price'], message: 'Bitte gib einen gültigen Sale-Preis ein.' }]);
  }

  const uploaded = (files || []).map((f) => ({
    type: 'upload',
    src: publicUploadPath(f.filename),
    thumb: f.thumbFilename ? publicUploadPath(f.thumbFilename) : null,
  }));

  const images = [
    ...parseExistingImages(data.existing_images),
    ...uploaded,
    ...parseImageUrls(data.image_urls),
  ].slice(0, 12);

  const optionGroups = parseOptionGroups(data.option_groups);

  return {
    name: data.name.trim(),
    description: sanitizeHtml(data.description, SANITIZE_OPTS),
    category: (data.category || 'Allgemein').trim() || 'Allgemein',
    price_cents: priceCents,
    sale_price_cents:
      salePriceCents != null && salePriceCents < priceCents ? salePriceCents : null,
    sizes: [],
    option_groups: optionGroups,
    images,
    stock: data.stock ?? 0,
    is_bestseller: !!data.is_bestseller,
    is_active: data.is_active === undefined ? true : !!data.is_active,
    has_variants: !!data.has_variants,
  };
}

function parseVariantOverrides(input) {
  try {
    const parsed = JSON.parse(input || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function validateVariantImageUrl(url) {
  const value = String(url || '').trim();
  return !value || /^https:\/\/[^\s]+$/i.test(value) ? value : '';
}

function buildVariantRows({ productId, productName, optionGroups, overrides = [], baseImages = [], basePriceCents = 0 }) {
  const combos = buildCombinations(optionGroups);
  if (!combos.length) return [];

  const overrideMap = new Map(overrides.map((row) => [String(row.signature || row.size || '').trim(), row]));
  const defaultSignature = String(overrides.find((row) => row.is_default)?.signature || combos[0].signature);

  return combos.map((combo, index) => {
    const row = overrideMap.get(combo.signature) || {};
    const imageUrl = validateVariantImageUrl(row.image_url);
    const images = imageUrl ? [{ type: 'url', src: imageUrl }] : baseImages.slice(0, 1);
    const variantPrice = row.variant_price_cents !== undefined && row.variant_price_cents !== null && row.variant_price_cents !== ''
      ? Math.max(0, Number(row.variant_price_cents) || 0)
      : null;
    return {
      product_id: productId,
      sku: String(row.sku || '').trim(),
      size: combo.signature,
      color: '',
      option_values: combo.values,
      stock: Math.max(0, Number(row.stock) || 0),
      reserved: 0,
      min_stock: Math.max(0, Number(row.min_stock) || 3),
      next_delivery: String(row.next_delivery || ''),
      notes: String(row.notes || ''),
      title: buildVariantTitle(productName, combo),
      images,
      variant_price_cents: variantPrice,
      is_default: combo.signature === defaultSignature || (!defaultSignature && index === 0),
    };
  });
}

function simpleInventoryRow(product) {
  return {
    product_id: product.id,
    sku: '',
    size: '',
    color: '',
    option_values: [],
    stock: Math.max(0, Number(product.stock) || 0),
    reserved: 0,
    min_stock: 3,
    next_delivery: '',
    notes: '',
    title: product.name,
    images: product.images || [],
    variant_price_cents: null,
    is_default: true,
  };
}

function syncProductFromVariants(product, rows, fallbackImages = []) {
  if (!rows.length) return product;
  const defaultRow = rows.find((row) => row.is_default) || rows[0];
  const images = (defaultRow.images && defaultRow.images.length ? defaultRow.images : fallbackImages).slice(0, 12);
  const priceCents = defaultRow.variant_price_cents != null ? defaultRow.variant_price_cents : product.price_cents;
  const stock = rows.reduce((sum, row) => sum + Math.max(0, Number(row.stock) || 0), 0);
  return {
    ...product,
    price_cents: priceCents,
    sale_price_cents: null,
    images,
    stock,
  };
}

// CREATE
router.post(
  '/products',
  uploadImages.any(),
  handleUploadErrors,
  verifyUploadedImages,
  (req, res) => {
    try {
        const product = assembleProduct(req.body, req.files);
        const created = products.create(product);

        const hasVariants = !!product.has_variants;
        const optionGroups = parseOptionGroups(req.body.option_groups);
        if (hasVariants && !optionGroups.length) {
          return res.status(400).json({ error: 'Bitte füge mindestens eine Option mit Werten hinzu.' });
        }
        if (hasVariants) {
          const overrides = parseVariantOverrides(req.body.variants);
          const rows = buildVariantRows({
            productId: created.id,
            productName: created.name,
            optionGroups,
            overrides,
            baseImages: created.images || [],
          });
          if (!rows.length) {
            return res.status(400).json({ error: 'Bitte lege mindestens eine Variante an.' });
          }
          inventory.deleteByProduct(created.id);
          inventory.upsertMany(rows);
          products.update(created.id, syncProductFromVariants(created, rows, created.images || []));
        } else {
          inventory.deleteByProduct(created.id);
          inventory.upsert(simpleInventoryRow(created));
        }
      res.status(201).json({ ok: true, id: created.id, slug: created.slug });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validierungsfehler', issues: err.issues });
      }
      throw err;
    }
  }
);

// UPDATE
router.put(
  '/products/:id',
  uploadImages.any(),
  handleUploadErrors,
  verifyUploadedImages,
  (req, res) => {
    const id = Number(req.params.id);
    if (!products.getById(id)) return res.status(404).json({ error: 'Nicht gefunden.' });
    try {
      const product = assembleProduct(req.body, req.files);
      const updated = products.update(id, product);

      // Varianten per Option-Gruppen generieren
      const hasVariants = !!product.has_variants;
      const optionGroups = parseOptionGroups(req.body.option_groups);
      if (hasVariants && !optionGroups.length) {
        return res.status(400).json({ error: 'Bitte füge mindestens eine Option mit Werten hinzu.' });
      }
      if (hasVariants) {
        const overrides = parseVariantOverrides(req.body.variants);
        const rows = buildVariantRows({
          productId: id,
          productName: updated.name,
          optionGroups,
          overrides,
          baseImages: updated.images || [],
        });
        if (!rows.length) {
          return res.status(400).json({ error: 'Bitte lege mindestens eine Variante an.' });
        }
        inventory.deleteByProduct(id);
        inventory.upsertMany(rows);
        products.update(id, syncProductFromVariants(updated, rows, updated.images || []));
      } else {
        inventory.deleteByProduct(id);
        inventory.upsert(simpleInventoryRow(updated));
      }
      
      res.json({ ok: true, id: updated.id, slug: updated.slug });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validierungsfehler', issues: err.issues });
      }
      throw err;
    }
  }
);

// DELETE
router.delete('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const ok = products.remove(id);
  if (!ok) return res.status(404).json({ error: 'Nicht gefunden.' });
  res.json({ ok: true });
});

export default router;
