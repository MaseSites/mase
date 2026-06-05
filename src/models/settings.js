import db from '../config/db.js';

const getStmt = db.prepare('SELECT value FROM settings WHERE key = ?');
const upsertStmt = db.prepare(`
  INSERT INTO settings (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`);
const allStmt = db.prepare('SELECT key, value FROM settings');

const DEFAULTS = {
  shop_name: 'ABJ Store',
  tagline: 'Authentifizierte Designer- & Streetwear-Pieces',
  currency: 'EUR',
  hero_title: 'Premium Streetwear & Designer',
  hero_subtitle: 'Kuratierte, authentifizierte Pieces der gefragtesten Marken – sicher geliefert in ganz Europa.',
  sale_ends_at: '', // ISO-Datum, z.B. 2026-06-30T23:59:59
  members_count: '20000',
  ratings_count: '1000',
  contact_email: 'kontakt@example.com',
  announcement: 'Authentizität garantiert  ·  Versicherter Versand in der EU  ·  Käuferschutz',
  gate_password_hash: '', // wird beim Bootstrap gesetzt
  // Theme: Luxury Schwarz/Gold
  accent: '#B89C67',
  accent_2: '#B89C67',
  accent_3: '#CDB27E',
  // Hero-Hintergrundbild (lokaler Pfad /img/... oder HTTPS-URL)
  hero_image: '/img/img.png',
};

export function get(key) {
  const row = getStmt.get(key);
  if (row && row.value !== null) return row.value;
  return DEFAULTS[key] ?? null;
}

export function set(key, value) {
  upsertStmt.run(key, value == null ? '' : String(value));
}

export function all() {
  const stored = Object.fromEntries(allStmt.all().map((r) => [r.key, r.value]));
  return { ...DEFAULTS, ...stored };
}

export function setMany(obj) {
  const tx = db.transaction((entries) => {
    for (const [k, v] of entries) upsertStmt.run(k, v == null ? '' : String(v));
  });
  tx(Object.entries(obj));
}
