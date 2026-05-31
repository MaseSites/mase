import express from 'express';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import * as products from '../models/products.js';
import { parsePriceToCents } from '../lib/format.js';
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
  sizes: z.string().max(400).optional().default(''),
  stock: z.coerce.number().int().min(0).max(1000000).optional().default(0),
  is_bestseller: z.preprocess((v) => v === '1' || v === 'on' || v === true, z.boolean()).optional(),
  is_active: z.preprocess((v) => v === '1' || v === 'on' || v === true, z.boolean()).optional(),
  image_urls: z.string().max(4000).optional().default(''),
  existing_images: z.string().max(20000).optional().default('[]'),
});

function parseSizes(input) {
  return String(input)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);
}

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

  const priceCents = parsePriceToCents(data.price) ?? 0;
  const salePriceCents = data.sale_price ? parsePriceToCents(data.sale_price) : null;

  const uploaded = (files || []).map((f) => ({
    type: 'upload',
    src: publicUploadPath(f.filename),
  }));

  const images = [
    ...parseExistingImages(data.existing_images),
    ...uploaded,
    ...parseImageUrls(data.image_urls),
  ].slice(0, 12);

  return {
    name: data.name.trim(),
    description: sanitizeHtml(data.description, SANITIZE_OPTS),
    category: (data.category || 'Allgemein').trim() || 'Allgemein',
    price_cents: priceCents,
    sale_price_cents:
      salePriceCents != null && salePriceCents < priceCents ? salePriceCents : null,
    sizes: parseSizes(data.sizes),
    images,
    stock: data.stock ?? 0,
    is_bestseller: !!data.is_bestseller,
    is_active: data.is_active === undefined ? true : !!data.is_active,
  };
}

// CREATE
router.post(
  '/products',
  uploadImages.array('images', 8),
  handleUploadErrors,
  verifyUploadedImages,
  (req, res) => {
    try {
      const product = assembleProduct(req.body, req.files);
      const created = products.create(product);
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
  uploadImages.array('images', 8),
  handleUploadErrors,
  verifyUploadedImages,
  (req, res) => {
    const id = Number(req.params.id);
    if (!products.getById(id)) return res.status(404).json({ error: 'Nicht gefunden.' });
    try {
      const product = assembleProduct(req.body, req.files);
      const updated = products.update(id, product);
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
