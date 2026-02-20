require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('SMTP Host:', process.env.SMTP_HOST);
console.log('SMTP User:', process.env.SMTP_USER);

// Das Zertifikat gilt für masesites.ch – tls.rejectUnauthorized auf false setzen
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

transporter.verify((err, ok) => {
  if (err) {
    console.log('FEHLER:', err.message);
    return;
  }
  console.log('OK: SMTP Verbindung erfolgreich!');

  // Test-Email senden
  transporter.sendMail({
    from: 'info@masesites.ch',
    to: 'info@masesites.ch',
    subject: 'Test - Absender info@masesites.ch',
    html: '<p>Dieser Versand kommt von <strong>info@masesites.ch</strong> via eigenem SMTP.</p>'
  }, (err, info) => {
    if (err) {
      console.log('SENDE-FEHLER:', err.message);
    } else {
      console.log('Email gesendet! ID:', info.messageId);
    }
  });
});

