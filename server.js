const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(__dirname));

// Serve HTML files
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
  message: 'Zu viele Anfragen. Bitte versuche es später erneut.'
});

// Email Transporter Setup
let transporter;

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
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    console.log(`[OK] Email: SMTP ${process.env.SMTP_HOST} konfiguriert`);
    console.log(`     Absender : ${process.env.SMTP_USER}`);
    console.log(`     Empfaenger: ${process.env.EMAIL_TO}`);

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
    console.log('   1. Oeffne .env Datei');
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
      console.log('[TEST] Laeuft im TEST-MODUS (Ethereal)');
      console.log('[TEST] Test-Emails ansehen: https://ethereal.email');
      console.log('[TEST] Login:', testAccount.user);
      console.log('[TEST] Passwort:', testAccount.pass);
      console.log('');
    } catch (err) {
      console.error('[FEHLER] Test-Account Fehler:', err.message);
    }
  }
}

// Initialize transporter
setupEmailTransporter();

// Contact Form Endpoint
app.post('/api/contact', limiter, async (req, res) => {
  try {
    const { name, email, company, projectType, message, privacy, honeypot } = req.body;

    // Spam check
    if (honeypot) {
      return res.status(400).json({ success: false, message: 'Spam detected' });
    }

    // Validation
    if (!name || !email || !message || !privacy) {
      return res.status(400).json({
        success: false,
        message: 'Bitte fuelle alle Pflichtfelder aus.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Bitte gib eine gueltige E-Mail-Adresse ein.'
      });
    }

    // Email to MASESites
    const mailToCompany = {
      from: `"MASESites AG" <${process.env.SMTP_USER || 'info@masesites.ch'}>`,
      to: process.env.EMAIL_TO || 'info@masesites.ch',
      replyTo: email,
      subject: `Neue Kontaktanfrage von ${name} - MASESites`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6aa9ff; border-bottom: 2px solid #6aa9ff; padding-bottom: 10px;">
            Neue Kontaktanfrage
          </h2>
          <table style="width: 100%; margin: 20px 0;">
            <tr>
              <td style="padding: 10px 0; font-weight: bold; width: 150px;">Name:</td>
              <td style="padding: 10px 0;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold;">E-Mail:</td>
              <td style="padding: 10px 0;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            ${company ? `
            <tr>
              <td style="padding: 10px 0; font-weight: bold;">Firma:</td>
              <td style="padding: 10px 0;">${company}</td>
            </tr>` : ''}
            ${projectType ? `
            <tr>
              <td style="padding: 10px 0; font-weight: bold;">Projektart:</td>
              <td style="padding: 10px 0;">${projectType}</td>
            </tr>` : ''}
          </table>
          <div style="background: #f6f9ff; padding: 20px; border-left: 4px solid #6aa9ff; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold;">Nachricht:</p>
            <p style="margin: 0; color: #334155; white-space: pre-line;">${message}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="font-size: 12px; color: #94a3b8;">
            Gesendet ueber MASESites Kontaktformular<br>
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

    // Bestaetigung an User
    const mailToUser = {
      from: `"MASESites AG" <${process.env.SMTP_USER || 'info@masesites.ch'}>`,
      to: email,
      subject: 'Deine Anfrage bei MASESites AG',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6aa9ff;">Vielen Dank fuer deine Anfrage!</h2>
          <p>Hallo ${name},</p>
          <p>wir haben deine Nachricht erhalten und melden uns innerhalb von <strong>24-48 Stunden</strong> bei dir.</p>
          <div style="background: #f6f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #334155;">Deine Nachricht:</p>
            <p style="margin: 0; color: #64748b; white-space: pre-line;">${message}</p>
          </div>
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
            Mit freundlichen Gruessen,<br>
            <strong style="color: #334155;">Matteo &amp; Severin</strong><br>
            MASESites AG
          </p>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
            Diese Email wurde automatisch generiert. Bitte antworte nicht direkt auf diese Email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailToUser);
    console.log('[OK] Bestaetigung an User gesendet');

    res.json({
      success: true,
      message: 'Nachricht erfolgreich gesendet! Wir melden uns in 24-48h.'
    });

  } catch (error) {
    console.error('[FEHLER] Email Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Ein Fehler ist aufgetreten. Bitte schreibe direkt an info@masesites.ch oder rufe an: 078 215 89 22'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
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

