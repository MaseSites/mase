import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Projekt-Wurzel (zwei Ebenen über src/config)
export const ROOT_DIR = path.resolve(__dirname, '..', '..');
export const SRC_DIR = path.join(ROOT_DIR, 'src');
export const PUBLIC_DIR = path.join(SRC_DIR, 'public');
export const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');
export const VIEWS_DIR = path.join(SRC_DIR, 'views');
export const DATA_DIR = path.join(ROOT_DIR, 'data');

const isProd = process.env.NODE_ENV === 'production';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    if (isProd) {
      throw new Error(`Fehlende Umgebungsvariable: ${name}. Bitte in .env setzen.`);
    }
    return fallback;
  }
  return value;
}

export const config = {
  isProd,
  port: Number(process.env.PORT) || 3000,
  sessionSecret: required('SESSION_SECRET', 'dev-only-session-secret-change-me'),
  csrfSecret: required('CSRF_SECRET', 'dev-only-csrf-secret-change-me'),
  // Bootstrap-Gate-Passwort nur falls in DB noch keines gesetzt ist
  gatePasswordBootstrap: process.env.GATE_PASSWORD || '',
  cookieSecure: process.env.COOKIE_SECURE === 'true' || isProd,
  // bcrypt-Kostenfaktor. Standard 12 (sicher, CI/Prod). Lokal via BCRYPT_ROUNDS=4
  // senkbar für schnellere Tests. Untergrenze 4, Obergrenze 15.
  bcryptRounds: Math.min(15, Math.max(4, Number(process.env.BCRYPT_ROUNDS) || 12)),
  paths: { ROOT_DIR, SRC_DIR, PUBLIC_DIR, UPLOADS_DIR, VIEWS_DIR, DATA_DIR },
};

// Frühwarnung bei unsicheren Default-Secrets in Produktion
if (isProd) {
  if (config.sessionSecret.startsWith('dev-only') || config.csrfSecret.startsWith('dev-only')) {
    throw new Error('SESSION_SECRET/CSRF_SECRET müssen in Produktion gesetzt werden.');
  }
}
