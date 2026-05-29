const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://localhost:3000',
  'https://www.masesites.ch',
  'https://masesites.ch'
].concat(
  (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

// ============================================================
// TRUST PROXY — true on Railway/cloud (behind reverse proxy).
// Prevents X-Forwarded-For spoofing to bypass rate limits.
// ============================================================
app.set('trust proxy', process.env.TRUST_PROXY === 'true' || process.env.RAILWAY_ENVIRONMENT ? 1 : false);

// ============================================================
// SECURITY HEADERS — replaces helmet for zero-dependency setup
// ============================================================
app.disable('x-powered-by');
app.use((req, res, next) => {
  // Prevent clickjacking
  res.set('X-Frame-Options', 'DENY');
  // Prevent MIME-type sniffing
  res.set('X-Content-Type-Options', 'nosniff');
  // HSTS — only activate on production (HTTPS)
  if (process.env.NODE_ENV === 'production') {
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  // Referrer policy
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions policy — deny unnecessary browser features
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  // Content-Security-Policy
  res.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://kxeorjgabvtplmdygbph.supabase.co https://api.openai.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  );
  next();
});

// Block direct access to sensitive server-side files and archive directories.
// Do NOT add supabase-config.js or tracker.js — they are public frontend assets.
const BLOCKED_FILES = [
  /^\/server(-old)?\.js$/i,
  /^\/package(-lock)?\.json$/i,
  /^\/\.env/i,
  /^\/test-.*\.js$/i,
  /^\/design[0-9]*-import\//i,      // archive / import directories — not web assets
  /^\/OPENAI-SETUP-COMPLETE\.md$/i, // docs with key references
];
app.use((req, res, next) => {
  const p = req.path;
  if (BLOCKED_FILES.some(re => re.test(p))) {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
});

// /admin/index.html is the login page — publicly accessible.
// Security is provided by:
//   1. POST /api/admin/auth (server-side password check, rate-limited)
//   2. Supabase service_role key required for all data queries
// No token-gate needed here; blocking the HTML breaks the login form.

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin/server-to-server calls without Origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error(`CORS_NOT_ALLOWED: ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
}));
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));

app.use((err, req, res, next) => {
  if (err && typeof err.message === 'string' && err.message.indexOf('CORS_NOT_ALLOWED:') === 0) {
    const deniedOrigin = err.message.replace('CORS_NOT_ALLOWED: ', '');
    console.error('[FEHLER] CORS blockiert Origin:', deniedOrigin);
    return res.status(403).json({
      success: false,
      code: 'CORS_NOT_ALLOWED',
      message: 'Origin ist für diese API nicht erlaubt.'
    });
  }
  return next(err);
});

app.use('/api/contact', (req, res, next) => {
  console.log(`[API] ${req.method} /api/contact from ${req.headers.origin || 'same-origin/no-origin'}`);
  next();
});

// Cache-Control für konsistente Live-Darstellung (verhindert stale CSS/JS/HTML nach Deploys)
app.use((req, res, next) => {
  const reqPath = req.path || '';
  if (/\.(css|js|mjs|map)$/i.test(reqPath)) {
    res.set('Cache-Control', 'public, max-age=0, must-revalidate');
  } else if (!path.extname(reqPath) || /\.html$/i.test(reqPath)) {
    res.set('Cache-Control', 'no-store');
  }
  next();
});

// 301 Weiterleitungen: .html URLs -> saubere URLs (VOR static middleware, wichtig für SEO)
app.get('/leistungen.html', (req, res) => res.redirect(301, '/leistungen'));
app.get('/preise.html', (req, res) => res.redirect(301, '/preise'));
app.get('/ki-assistent.html', (req, res) => res.redirect(301, '/ki-assistent'));
app.get('/ueber-uns.html', (req, res) => res.redirect(301, '/ueber-uns'));
app.get('/kontakt.html', (req, res) => res.redirect(301, '/kontakt'));

// Serve static files (CSS, JS, images – aber keine .html direkt)
app.use(express.static(__dirname, { extensions: [] }));

// Serve HTML files (clean URLs)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/leistungen', (req, res) => res.sendFile(path.join(__dirname, 'leistungen.html')));
app.get('/preise', (req, res) => res.sendFile(path.join(__dirname, 'preise.html')));
app.get('/ki-assistent', (req, res) => res.sendFile(path.join(__dirname, 'ki-assistent.html')));
app.get('/ueber-uns', (req, res) => res.sendFile(path.join(__dirname, 'ueber-uns.html')));
app.get('/kontakt', (req, res) => res.sendFile(path.join(__dirname, 'kontakt.html')));


// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      code: 'RATE_LIMITED',
      message: 'Zu viele Anfragen. Bitte versuche es später erneut.'
    });
  }
});

// Email Transporter Setup
let transporter;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeBoolean(value) {
  return value === true || value === 'true' || value === 'on' || value === '1' || value === 1;
}

function sanitizeText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

async function setupEmailTransporter() {
  if (process.env.SENDGRID_API_KEY) {
    // SendGrid
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
    console.log('[OK] Email: SendGrid konfiguriert');

  } else if (process.env.SMTP_HOST) {
    // Custom SMTP
    const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 587;
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPassword = process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;

    if (!smtpUser || !smtpPassword) {
      throw new Error('SMTP_USER/EMAIL_USER und SMTP_PASSWORD/EMAIL_PASSWORD müssen gesetzt sein.');
    }

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword
      },
      tls: process.env.SMTP_TLS_SERVERNAME
        ? { servername: process.env.SMTP_TLS_SERVERNAME }
        : undefined
    });
    console.log(`[OK] Email: SMTP ${process.env.SMTP_HOST} konfiguriert`);
    console.log(`     Absender : ${smtpUser}`);
    console.log(`     Empfänger: ${process.env.EMAIL_TO}`);

  } else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD &&
             process.env.EMAIL_USER !== 'deine-gmail@gmail.com' &&
             !process.env.EMAIL_PASSWORD.includes('xxxx')) {
    // Gmail
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    console.log('[OK] Email: Gmail konfiguriert mit', process.env.EMAIL_USER);

  } else {
    // Test-Modus
    console.log('');
    console.log('-------------------------------------------');
    console.log('[!] EMAIL NOCH NICHT KONFIGURIERT');
    console.log('-------------------------------------------');
    console.log('So richtest du es ein:');
    console.log('   1. Öffne .env Datei');
    console.log('   2. Trage SMTP_HOST, SMTP_USER, SMTP_PASSWORD ein');
    console.log('   3. Starte Server neu: node server.js');
    console.log('-------------------------------------------');
    console.log('');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('[TEST] Läuft im TEST-MODUS (Ethereal)');
      console.log('[TEST] Test-Emails ansehen: https://ethereal.email');
      console.log('[TEST] Login:', testAccount.user);
      console.log('[TEST] Passwort:', testAccount.pass);
      console.log('');
    } catch (err) {
      console.error('[FEHLER] Test-Account Fehler:', err.message);
    }
  }

  if (transporter) {
    await transporter.verify();
    console.log('[OK] Email-Transport Verbindung geprüft');
  }
}

// Initialize transporter
setupEmailTransporter().catch((err) => {
  transporter = null;
  console.error('[FEHLER] Email Transporter Setup fehlgeschlagen:', err.message);
});

// Contact Form Endpoint
app.post('/api/contact', limiter, async (req, res) => {
  try {
    const {
      name: rawName,
      email: rawEmail,
      company: rawCompany,
      projectType: rawProjectType,
      message: rawMessage,
      privacy: rawPrivacy,
      honeypot: rawHoneypot,
      pricingSelection: rawPricingSelection
    } = req.body || {};

    console.log('[API] /api/contact payload received:', {
      hasName: !!rawName,
      hasEmail: !!rawEmail,
      hasCompany: !!rawCompany,
      hasProjectType: !!rawProjectType,
      messageLength: String(rawMessage || '').length,
      privacy: rawPrivacy,
      hasHoneypot: !!rawHoneypot,
      hasPricingSelection: !!rawPricingSelection
    });

    if (!transporter) {
      return res.status(503).json({
        success: false,
        code: 'EMAIL_NOT_CONFIGURED',
        message: 'Email-Dienst ist aktuell nicht verfügbar. Bitte versuche es später erneut.'
      });
    }

    const name = sanitizeText(rawName, 120);
    const email = sanitizeText(rawEmail, 254).toLowerCase();
    const company = sanitizeText(rawCompany, 120);
    const projectType = sanitizeText(rawProjectType, 100);
    const message = sanitizeText(rawMessage, 4000);
    const privacy = normalizeBoolean(rawPrivacy);
    const honeypot = sanitizeText(rawHoneypot, 200);
    const pricingSelection = sanitizeText(rawPricingSelection, 2000);

    if (honeypot) {
      return res.status(400).json({ success: false, code: 'SPAM_DETECTED', message: 'Spam erkannt.' });
    }

    if (!name || !email || !message || !privacy) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_REQUIRED_FIELDS',
        message: 'Bitte fülle alle Pflichtfelder aus.'
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_NAME',
        message: 'Bitte gib einen gültigen Namen ein.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_EMAIL',
        message: 'Bitte gib eine gültige E-Mail-Adresse ein.'
      });
    }

    if (message.length < 10) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_MESSAGE',
        message: 'Bitte gib eine aussagekräftige Nachricht mit mindestens 10 Zeichen ein.'
      });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeCompany = escapeHtml(company);
    const safeProjectType = escapeHtml(projectType);
    const safeMessage = escapeHtml(message);
    const safePricingSelection = escapeHtml(pricingSelection);
    const safeSubjectName = name.replace(/[\r\n]+/g, ' ').slice(0, 80);

    // Email to MASESites
    const pricingSelectionBlock = pricingSelection
      ? `
            <tr>
              <td style="padding: 10px 0; font-weight: bold; vertical-align: top;">Auswahl:</td>
              <td style="padding: 10px 0; white-space: pre-line;">${safePricingSelection}</td>
            </tr>`
      : '';

    const mailToCompany = {
      from: `"MASESites" <${process.env.SMTP_USER || 'info@masesites.ch'}>`,
      to: process.env.EMAIL_TO || 'info@masesites.ch',
      cc: process.env.EMAIL_CC || 'matteo.cocetrone@gmx.ch',
      replyTo: email,
      subject: `Neue Kontaktanfrage von ${safeSubjectName} - MASESites`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6aa9ff; border-bottom: 2px solid #6aa9ff; padding-bottom: 10px;">
            Neue Kontaktanfrage
          </h2>
          <table style="width: 100%; margin: 20px 0;">
            <tr>
              <td style="padding: 10px 0; font-weight: bold; width: 150px;">Name:</td>
              <td style="padding: 10px 0;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold;">E-Mail:</td>
              <td style="padding: 10px 0;"><a href="mailto:${safeEmail}">${safeEmail}</a></td>
            </tr>
            ${company ? `
            <tr>
              <td style="padding: 10px 0; font-weight: bold;">Firma:</td>
              <td style="padding: 10px 0;">${safeCompany}</td>
            </tr>` : ''}
            ${projectType ? `
            <tr>
              <td style="padding: 10px 0; font-weight: bold;">Projektart:</td>
              <td style="padding: 10px 0;">${safeProjectType}</td>
            </tr>` : ''}
            ${pricingSelectionBlock}
          </table>
          <div style="background: #f6f9ff; padding: 20px; border-left: 4px solid #6aa9ff; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold;">Nachricht:</p>
            <p style="margin: 0; color: #334155; white-space: pre-line;">${safeMessage}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="font-size: 12px; color: #94a3b8;">
            Gesendet über MASESites Kontaktformular<br>
            ${new Date().toLocaleString('de-CH')}
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailToCompany);
    console.log('[OK] Email an MASESites gesendet:', info.messageId);

    if (info.preview) {
      console.log('[INFO] Vorschau:', nodemailer.getTestMessageUrl(info));
    }

    // Bestätigung an User
    const userPricingSection = pricingSelection
      ? `
          <div style="background: #f6f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #334155;">Deine gewählten Pakete:</p>
            <p style="margin: 0; color: #64748b; white-space: pre-line;">${safePricingSelection}</p>
          </div>`
      : '';

    const mailToUser = {
      from: `"MASESites" <${process.env.SMTP_USER || 'info@masesites.ch'}>`,
      to: email,
      subject: 'Deine Anfrage bei MASESites',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6aa9ff;">Vielen Dank für deine Anfrage!</h2>
          <p>Hallo ${safeName},</p>
          <p>wir haben deine Nachricht erhalten und melden uns innerhalb von <strong>24-48 Stunden</strong> bei dir.</p>
          <div style="background: #f6f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #334155;">Deine Nachricht:</p>
            <p style="margin: 0; color: #64748b; white-space: pre-line;">${safeMessage}</p>
          </div>
          ${userPricingSection}
          <p style="color: #64748b;">
            Falls du noch Fragen hast, erreichst du uns jederzeit:
          </p>
          <div style="background: white; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;">E-Mail: <a href="mailto:info@masesites.ch" style="color: #6aa9ff; text-decoration: none;">info@masesites.ch</a></p>
            <p style="margin: 5px 0;">Telefon: <a href="tel:+41782158922" style="color: #6aa9ff; text-decoration: none;">078 215 89 22</a></p>
            <p style="margin: 5px 0;">Website: <a href="https://www.masesites.ch" style="color: #6aa9ff; text-decoration: none;">www.masesites.ch</a></p>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="color: #64748b;">
            Mit freundlichen Grüßen,<br>
            <strong style="color: #334155;">Matteo &amp; Severin</strong><br>
            MASESites
          </p>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
            Diese Email wurde automatisch generiert. Bitte antworte nicht direkt auf diese Email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailToUser);
    console.log('[OK] Bestätigung an User gesendet');

    res.status(200).json({
      success: true,
      code: 'CONTACT_SENT',
      message: 'Nachricht erfolgreich gesendet! Wir melden uns in 24-48h.'
    });

  } catch (error) {
    console.error('[FEHLER] Email Error:', {
      message: error && error.message,
      code: error && error.code,
      stack: error && error.stack
    });

    var statusCode = 500;
    var errorCode = 'MAIL_SEND_FAILED';
    var errorMessage = 'Ein Fehler ist aufgetreten. Bitte schreibe direkt an info@masesites.ch oder rufe an: 078 215 89 22';

    if (error && (error.code === 'EAUTH' || error.code === 'ESOCKET' || error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT')) {
      statusCode = 502;
      errorCode = 'SMTP_CONNECTION_FAILED';
      errorMessage = 'SMTP-Verbindung fehlgeschlagen. Bitte prüfe die E-Mail-Konfiguration auf dem Server.';
    }

    res.status(statusCode).json({
      success: false,
      code: errorCode,
      message: errorMessage
    });
  }
});

// ============================================================
// ADMIN AUTH — server-side constant-time password check
// POST /api/admin/auth  { password: string }
// Returns { ok: true, token: string } on success (token = ADMIN_TOKEN env var)
// ============================================================
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: (req, res) => res.status(429).json({ ok: false, error: 'Too many attempts.' })
});

app.post('/api/admin/auth', adminAuthLimiter, (req, res) => {
  const password  = String((req.body && req.body.password) || '').trim();
  const adminPass = process.env.ADMIN_PASSWORD || '';
  const adminToken = process.env.ADMIN_TOKEN || '';

  if (!adminPass) {
    return res.status(503).json({ ok: false, error: 'Admin auth not configured.' });
  }

  // Constant-time comparison to prevent timing attacks
  const providedBuf = Buffer.from(
    crypto.createHash('sha256').update(password).digest('hex')
  );
  const expectedBuf = Buffer.from(
    crypto.createHash('sha256').update(adminPass).digest('hex')
  );

  if (providedBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return res.status(401).json({ ok: false, error: 'Invalid password.' });
  }

  res.json({ ok: true, token: adminToken });
});

// ============================================================
// ADMIN DATA PROXY — server-side Supabase proxy (service_role key never leaves server)
// All endpoints require:  Authorization: Bearer <ADMIN_TOKEN>
// ============================================================

const ALLOWED_TABLES = new Set([
  'mase_chat_messages',
  'mase_leads',
  'mase_page_views',
  'mase_events',
  'mase_appointments'
]);

const SUPABASE_URL   = process.env.SUPABASE_URL || 'https://kxeorjgabvtplmdygbph.supabase.co';
const adminDataLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  handler: (req, res) => res.status(429).json({ error: 'Too many requests.' })
});

function validateAdminToken(req, res) {
  const adminToken = process.env.ADMIN_TOKEN || '';
  const auth = req.headers['authorization'] || '';
  const provided = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!adminToken || !provided) {
    res.status(401).json({ error: 'Unauthorized.' });
    return false;
  }
  const a = Buffer.from(crypto.createHash('sha256').update(provided).digest('hex'));
  const b = Buffer.from(crypto.createHash('sha256').update(adminToken).digest('hex'));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    res.status(401).json({ error: 'Unauthorized.' });
    return false;
  }
  return true;
}

// GET /api/admin/data/:table?<supabase query params>
app.get('/api/admin/data/:table', adminDataLimiter, async (req, res) => {
  if (!validateAdminToken(req, res)) return;

  const table = req.params.table;
  if (!ALLOWED_TABLES.has(table)) {
    return res.status(400).json({ error: 'Table not allowed.' });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_KEY || '';
  if (!serviceKey) {
    return res.status(503).json({ error: 'Service key not configured. Add SUPABASE_SERVICE_KEY to .env' });
  }

  // Forward query string to Supabase REST API
  const qs = req.url.split('?')[1] || '';
  const upstreamUrl = `${SUPABASE_URL}/rest/v1/${table}${qs ? '?' + qs : ''}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        'apikey': serviceKey,
        'Authorization': 'Bearer ' + serviceKey,
        'Content-Type': 'application/json'
      }
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data });
    }
    res.json(data);
  } catch (err) {
    console.error('[proxy] GET error:', err.message);
    res.status(502).json({ error: 'Upstream error.' });
  }
});

// PATCH /api/admin/data/leads/:id  { status: string }
app.patch('/api/admin/data/leads/:id', adminDataLimiter, async (req, res) => {
  if (!validateAdminToken(req, res)) return;

  const id = req.params.id;
  if (!id || !/^[0-9a-f-]{36}$|^\d+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid id.' });
  }

  const ALLOWED_STATUSES = new Set(['new','in_progress','contacted','done','qualified','closed','lost']);
  const { status } = req.body || {};
  if (!status || !ALLOWED_STATUSES.has(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_KEY || '';
  if (!serviceKey) {
    return res.status(503).json({ error: 'Service key not configured.' });
  }

  const upstreamUrl = `${SUPABASE_URL}/rest/v1/mase_leads?id=eq.${encodeURIComponent(id)}`;
  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'PATCH',
      headers: {
        'apikey': serviceKey,
        'Authorization': 'Bearer ' + serviceKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ status })
    });
    if (!upstream.ok) {
      const data = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json({ error: data });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[proxy] PATCH error:', err.message);
    res.status(502).json({ error: 'Upstream error.' });
  }
});

// ============================================================
// APPOINTMENTS — public endpoint (called from AI chat widget)
// POST /api/appointments  { first_name, last_name, email, phone,
//                          appointment_date, appointment_time, message }
// ============================================================
const appointmentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10,
  handler: (req, res) => res.status(429).json({ success: false, code: 'RATE_LIMITED', message: 'Zu viele Anfragen.' })
});

app.post('/api/appointments', appointmentLimiter, async (req, res) => {
  const b = req.body || {};
  const first_name       = sanitizeText(b.first_name, 100);
  const last_name        = sanitizeText(b.last_name, 100);
  const email            = sanitizeText(b.email, 254).toLowerCase();
  const phone            = sanitizeText(b.phone, 50);
  const appointment_date = sanitizeText(b.appointment_date, 30);
  const appointment_time = sanitizeText(b.appointment_time, 20);
  const message          = sanitizeText(b.message, 1000);

  if (!first_name || !last_name || !email || !phone || !appointment_date || !appointment_time) {
    return res.status(400).json({ success: false, code: 'VALIDATION_REQUIRED_FIELDS', message: 'Pflichtfelder fehlen.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, code: 'VALIDATION_EMAIL', message: 'Ungültige E-Mail-Adresse.' });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_KEY || '';
  if (!serviceKey) {
    return res.status(503).json({ success: false, code: 'DB_NOT_CONFIGURED', message: 'Datenbankverbindung nicht konfiguriert.' });
  }

  try {
    const upstream = await fetch(`${SUPABASE_URL}/rest/v1/mase_appointments`, {
      method: 'POST',
      headers: {
        'apikey':        serviceKey,
        'Authorization': 'Bearer ' + serviceKey,
        'Content-Type':  'application/json',
        'Prefer':        'return=minimal'
      },
      body: JSON.stringify({ first_name, last_name, email, phone, appointment_date, appointment_time, message, status: 'pending' })
    });
    if (!upstream.ok) {
      const d = await upstream.json().catch(() => ({}));
      console.error('[appointments] Supabase error:', d);
      return res.status(502).json({ success: false, code: 'DB_ERROR', message: 'Fehler beim Speichern.' });
    }
    console.log(`[OK] Neuer Termin: ${first_name} ${last_name} — ${appointment_date} ${appointment_time}`);
    res.json({ success: true, code: 'APPOINTMENT_CREATED' });
  } catch (err) {
    console.error('[appointments]', err.message);
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Serverfehler.' });
  }
});

// PATCH /api/admin/data/appointments/:id — status update (admin auth required)
app.patch('/api/admin/data/appointments/:id', adminDataLimiter, async (req, res) => {
  if (!validateAdminToken(req, res)) return;

  const id = req.params.id;
  if (!id || !/^[0-9a-f-]{36}$|^\d+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid id.' });
  }

  const { status } = req.body || {};
  if (!status || !['pending', 'confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Allowed: pending, confirmed, cancelled' });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_KEY || '';
  if (!serviceKey) return res.status(503).json({ error: 'Service key not configured.' });

  try {
    const upstream = await fetch(`${SUPABASE_URL}/rest/v1/mase_appointments?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'apikey':        serviceKey,
        'Authorization': 'Bearer ' + serviceKey,
        'Content-Type':  'application/json',
        'Prefer':        'return=minimal'
      },
      body: JSON.stringify({ status, updated_at: new Date().toISOString() })
    });
    if (!upstream.ok) {
      const d = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json({ error: d });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[appointments PATCH]', err.message);
    res.status(502).json({ error: 'Upstream error.' });
  }
});

// Health check — do not expose internal state in production
app.get('/api/health', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.json({ status: 'OK' });
  }
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    emailConfigured: !!transporter
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n[OK] Server laeuft auf http://localhost:${PORT}`);
  console.log(`[OK] Email-Empfaenger: ${process.env.EMAIL_TO || 'info@masesites.ch'}`);
  console.log(`[OK] Email-Absender  : ${process.env.SMTP_USER || 'info@masesites.ch'}\n`);
});

