require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const mail = {
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_TO || 'info@masesites.ch',
  subject: 'Test - MASESites Kontaktformular',
  html: `
    <h2>Test Email</h2>
    <p>Der Email-Versand funktioniert! Kontaktformular ist aktiv.</p>
    <p><strong>Name:</strong> Max Muster</p>
    <p><strong>Email:</strong> test@test.ch</p>
    <p><strong>Nachricht:</strong> Das ist eine Test-Nachricht.</p>
    <hr>
    <small>MASESites AG - ${new Date().toLocaleString('de-CH')}</small>
  `
};

transporter.sendMail(mail, (err, info) => {
  if (err) {
    console.log('FEHLER:', err.message);
  } else {
    console.log('OK: Email gesendet an', process.env.EMAIL_USER);
    console.log('Message ID:', info.messageId);
  }
});

