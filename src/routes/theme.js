import express from 'express';
import * as settings from '../models/settings.js';

const router = express.Router();

// Validiert einen Hex-Farbwert, sonst Fallback.
function safeColor(value, fallback) {
  return /^#[0-9a-fA-F]{3,8}$/.test(String(value || '')) ? value : fallback;
}

// Erlaubt nur sichere Bildquellen (lokale Pfade oder HTTPS-URLs).
function safeImage(value) {
  const v = String(value || '').trim();
  if (/^\/(assets|uploads)\/[\w\-./]+\.(jpe?g|png|webp|avif|svg)$/i.test(v)) return v;
  if (/^https:\/\/[^\s"')]+$/i.test(v)) return v;
  return null;
}

// Dynamisches Theme-Stylesheet (echte CSS-Datei -> CSP-konform).
router.get('/theme.css', (req, res) => {
  const accent = safeColor(settings.get('accent'), '#B89C67');
  const accent2 = safeColor(settings.get('accent_2'), '#B89C67');
  const accent3 = safeColor(settings.get('accent_3'), '#CDB27E');
  const heroImage = safeImage(settings.get('hero_image'));

  const css = `:root{
  --accent:${accent};
  --accent-2:${accent2};
  --accent-3:${accent3};
  --grad:linear-gradient(135deg, ${accent3} 0%, ${accent} 100%);
  --grad-soft:linear-gradient(135deg, ${accent}1a, ${accent}0a);
  --glow:0 24px 60px -28px rgba(0,0,0,.9);
  ${heroImage ? `--hero-image:url("${heroImage}");` : ''}
}`;

  res.type('text/css');
  res.set('Cache-Control', 'no-cache');
  res.send(css);
});

export default router;
