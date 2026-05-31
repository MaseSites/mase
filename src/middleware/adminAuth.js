// Schutz für das Admin-Dashboard (separates Login vom Gate-Passwort).

export function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) return next();
  if (req.accepts('json') && !req.accepts('html')) {
    return res.status(401).json({ error: 'Nicht angemeldet.' });
  }
  return res.redirect('/admin/login');
}

// Macht Admin-Status in allen Views verfügbar.
export function exposeAdmin(req, res, next) {
  res.locals.isAdmin = !!(req.session && req.session.adminId);
  res.locals.adminUsername = req.session?.adminUsername || null;
  next();
}
