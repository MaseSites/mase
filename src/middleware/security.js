import crypto from 'node:crypto';
import session from 'express-session';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import SqliteStoreFactory from 'better-sqlite3-session-store';
import { config } from '../config/env.js';
import db from '../config/db.js';

const SqliteStore = SqliteStoreFactory(session);

// --- Session (nutzt die vorhandene better-sqlite3-Instanz) ---
export const sessionMiddleware = session({
  store: new SqliteStore({
    client: db,
    expired: { clear: true, intervalMs: 15 * 60 * 1000 },
  }),
  name: 'abj.sid',
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: 1000 * 60 * 60 * 8, // 8 Stunden
  },
});

// --- Sicherheits-Header (Helmet + strenge CSP) ---
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      // Produktbilder dürfen auch von externen HTTPS-URLs kommen
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: config.isProd ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// --- Rate-Limiter ---
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Zu viele Versuche. Bitte später erneut versuchen.',
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// --- CSRF (session-basierter Synchronizer-Token) ---
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function csrfMiddleware(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  // Token in Views verfügbar machen
  res.locals.csrfToken = req.session.csrfToken;

  if (SAFE_METHODS.has(req.method)) return next();

  const submitted =
    (req.body && req.body._csrf) ||
    req.headers['x-csrf-token'] ||
    req.headers['x-xsrf-token'];

  const expected = req.session.csrfToken;
  if (
    typeof submitted === 'string' &&
    submitted.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(submitted), Buffer.from(expected))
  ) {
    return next();
  }

  res.status(403);
  if (req.accepts('json') && !req.accepts('html')) {
    return res.json({ error: 'Ungültiges oder fehlendes CSRF-Token.' });
  }
  return res.render('errors/error', {
    title: 'Sitzung abgelaufen',
    message: 'Ungültiges oder fehlendes Sicherheits-Token. Bitte Seite neu laden und erneut versuchen.',
    status: 403,
  });
}
