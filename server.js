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
    console.log('✅ Email: SendGrid konfiguriert');

  } else if (process.env.SMTP_HOST) {
    // Custom SMTP
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD
      }
    });
    console.log(`✅ Email: SMTP ${process.env.SMTP_HOST} konfiguriert`);

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
    console.log('✅ Email: Gmail konfiguriert mit', process.env.EMAIL_USER);

  } else {
    // Test-Modus
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  EMAIL NOCH NICHT KONFIGURIERT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 So richtest du es ein:');
    console.log('   1. Öffne .env Datei');
    console.log('   2. Trage deine Gmail-Adresse ein');
    console.log('   3. Erstelle App-Passwort: https://myaccount.google.com/apppasswords');
    console.log('   4. Trage das App-Passwort ein');
    console.log('   5. Starte Server neu: node server.js');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
      console.log('🧪 Läuft im TEST-MODUS (Ethereal)');
      console.log('📧 Test-Emails ansehen: https://ethereal.email');
      console.log('📧 Login:', testAccount.user);
      console.log('📧 Passwort:', testAccount.pass);
      console.log('');
    } catch (err) {
      console.error('❌ Test-Account Fehler:', err.message);
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
        message: 'Bitte fülle alle Pflichtfelder aus.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Bitte gib eine gültige E-Mail-Adresse ein.'
      });
    }

    // Email to MASESites
    const mailToCompany = {
      from: process.env.EMAIL_USER || 'noreply@masesites.ch',
      to: 'info@masesites.ch',
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
            Gesendet über MASESites Kontaktformular<br>
            ${new Date().toLocaleString('de-CH')}
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailToCompany);
    console.log('✅ Email an MASESites gesendet:', info.messageId);

    if (info.preview) {
      console.log('📧 Vorschau:', nodemailer.getTestMessageUrl(info));
    }

    // Confirmation email to user
    const mailToUser = {
      from: process.env.EMAIL_USER || 'noreply@masesites.ch',
      to: email,
      subject: 'Deine Anfrage bei MASESites AG',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6aa9ff;">Vielen Dank für deine Anfrage!</h2>
          
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
            <p style="margin: 5px 0;">📧 <a href="mailto:info@masesites.ch" style="color: #6aa9ff; text-decoration: none;">info@masesites.ch</a></p>
            <p style="margin: 5px 0;">📱 <a href="tel:+41782158922" style="color: #6aa9ff; text-decoration: none;">078 215 89 22</a></p>
            <p style="margin: 5px 0;">🌐 <a href="https://www.masesites.ch" style="color: #6aa9ff; text-decoration: none;">www.masesites.ch</a></p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #64748b;">
            Mit freundlichen Grüssen,<br>
            <strong style="color: #334155;">Matteo & Severin</strong><br>
            MASESites AG
          </p>
          
          <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
            Diese Email wurde automatisch generiert. Bitte antworte nicht direkt auf diese Email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailToUser);
    console.log('✅ Bestätigungs-Email an User gesendet');

    res.json({
      success: true,
      message: 'Nachricht erfolgreich gesendet! Wir melden uns in 24-48h.'
    });

  } catch (error) {
    console.error('❌ Email Error:', error);
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
  console.log(`\n✅ Server läuft auf http://localhost:${PORT}`);
  console.log(`📧 Email-Empfänger: info@masesites.ch`);
  console.log(`📖 Setup-Anleitung: EMAIL-SETUP.md\n`);
});

