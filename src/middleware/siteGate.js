// Seitenweite "Coming Soon"-Sperre.
// Besucher müssen zuerst das Zugangs-Passwort eingeben (req.session.gateOk),
// bevor sie irgendeinen Shop-Inhalt sehen.

const ALLOWED_PREFIXES = [
  '/gate',
  '/css',
  '/js',
  '/assets',
  '/favicon.ico',
];

export function siteGate(req, res, next) {
  if (req.session.gateOk) return next();
  if (ALLOWED_PREFIXES.some((p) => req.path === p || req.path.startsWith(p + '/') || req.path === p)) {
    return next();
  }
  // Admin-Login ist ebenfalls erst nach dem Gate sichtbar (bewusst privat).
  // Statische Uploads sind ebenfalls gesperrt.
  return res.redirect('/gate');
}
