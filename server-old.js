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

// WICHTIG: Serve static files from current directory
app.use(express.static(__dirname));

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/leistungen', (req, res) => {
  res.sendFile(path.join(__dirname, 'leistungen.html'));
});

app.get('/preise', (req, res) => {
  res.sendFile(path.join(__dirname, 'preise.html'));
});

app.get('/ki-assistent', (req, res) => {
  res.sendFile(path.join(__dirname, 'ki-assistent.html'));
});

app.get('/ueber-uns', (req, res) => {
  res.sendFile(path.join(__dirname, 'ueber-uns.html'));
});

app.get('/kontakt', (req, res) => {
  res.sendFile(path.join(__dirname, 'kontakt.html'));
});

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Zu viele Anfragen. Bitte versuche es spÃ¤ter erneut.'
});

// Email Transporter Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Contact Form Endpoint
app.post('/api/contact', limiter, async (req, res) => {
  try {
    const { name, email, company, projectType, message, privacy, honeypot } = req.body;

    // Honeypot check (spam protection)
    if (honeypot) {
      return res.status(400).json({ success: false, message: 'Spam detected' });
    }

    // Validation
    if (!name || !email || !message || !privacy) {
      return res.status(400).json({
        success: false,
        message: 'Bitte fÃ¼lle alle Pflichtfelder aus.'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Bitte gib eine gÃ¼ltige E-Mail-Adresse ein.'
      });
    }

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'info@masesites.ch',
      subject: `Neue Kontaktanfrage von ${name} - MASESites`,
      html: `
        <h2>Neue Kontaktanfrage</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>E-Mail:</strong> ${email}</p>
        ${company ? `<p><strong>Firma:</strong> ${company}</p>` : ''}
        ${projectType ? `<p><strong>Projektart:</strong> ${projectType}</p>` : ''}
        <p><strong>Nachricht:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><small>Gesendet Ã¼ber MASESites Kontaktformular</small></p>
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email gesendet:', info.messageId);
    if (info.preview) {
      console.log('📧 Vorschau URL:', nodemailer.getTestMessageUrl(info));
    }

    // Send confirmation email to user
    const confirmationMailOptions = {
      from: process.env.EMAIL_USER || 'noreply@masesites.ch',
      to: email,
      subject: 'Deine Anfrage bei MASESites',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6aa9ff;">Vielen Dank für deine Anfrage!</h2>
          <p>Hallo ${name},</p>
          <p>wir haben deine Nachricht erhalten und melden uns innerhalb von 24-48 Stunden bei dir.</p>
          
          <div style="background: #f6f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Deine Nachricht:</strong></p>
            <p style="color: #64748b;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #64748b;">
            Mit freundlichen Grüssen,<br>
            <strong>Matteo & Severin</strong><br>
            MASESites
          </p>
          
          <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
            📧 <a href="mailto:info@masesites.ch" style="color: #6aa9ff;">info@masesites.ch</a><br>
            📱 078 215 89 22<br>
            🌐 <a href="https://www.masesites.ch" style="color: #6aa9ff;">www.masesites.ch</a>
          </p>
        </div>
      `
    };

    await transporter.sendMail(confirmationMailOptions);

    res.json({
      success: true,
      message: 'Nachricht erfolgreich gesendet! Wir melden uns in 24-48h.'
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Ein Fehler ist aufgetreten. Bitte versuche es spÃ¤ter erneut.'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`âœ… Server running on http://localhost:${PORT}`);
  console.log(`ðŸ“§ Email configured for: ${process.env.EMAIL_USER}`);
});

