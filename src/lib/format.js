// Formatierungs-Helfer für Views.

export function formatPrice(cents, currency = 'EUR') {
  const value = (Number(cents) || 0) / 100;
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(value);
}

// Wandelt eine Preis-Eingabe ("19,99" / "19.99" / 19.99) in Cents um.
export function parsePriceToCents(input) {
  if (input == null || input === '') return null;
  const normalized = String(input).replace(/\s/g, '').replace(',', '.');
  const num = Number(normalized);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}

export function discountPercent(price, salePrice) {
  if (!salePrice || !price || salePrice >= price) return 0;
  return Math.round((1 - salePrice / price) * 100);
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c])
  );
}

// Erzeugt einen seriösen, deterministischen SVG-Platzhalter (data:-URI) für
// Produkte ohne eigenes Bild – einheitliches, dunkles Indigo-Monochrom.
export function placeholder(name = '') {
  const str = String(name || '').trim();
  const initial = escapeXml((str[0] || '?').toUpperCase());
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">` +
    `<defs>` +
    `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#16161a"/>` +
    `<stop offset="1" stop-color="#0c0c0e"/>` +
    `</linearGradient>` +
    `<radialGradient id="r" cx="0.5" cy="0.0" r="0.9">` +
    `<stop offset="0" stop-color="rgba(99,102,241,0.22)"/>` +
    `<stop offset="1" stop-color="rgba(99,102,241,0)"/>` +
    `</radialGradient>` +
    `</defs>` +
    `<rect width="600" height="750" fill="url(#g)"/>` +
    `<rect width="600" height="750" fill="url(#r)"/>` +
    `<text x="300" y="430" font-family="Segoe UI,Arial,sans-serif" font-size="300" font-weight="800" ` +
    `fill="rgba(229,231,235,0.9)" text-anchor="middle">${initial}</text>` +
    `</svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
