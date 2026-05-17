require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('[DEBUG] Konfiguration:');
console.log('  SMTP_HOST:', process.env.SMTP_HOST);
console.log('  SMTP_PORT:', process.env.SMTP_PORT);
console.log('  SMTP_USER:', process.env.SMTP_USER);
console.log('  SMTP_TLS_SERVERNAME:', process.env.SMTP_TLS_SERVERNAME);

const port = parseInt(process.env.SMTP_PORT, 10) || 587;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: port,
  secure: port === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  tls: process.env.SMTP_TLS_SERVERNAME
    ? { servername: process.env.SMTP_TLS_SERVERNAME }
    : undefined
});

console.log('\n[TEST] Verbinde zu SMTP...');

transporter.verify((err, ok) => {
  if (err) {
    console.error('[FEHLER] SMTP-Verbindung fehlgeschlagen:');
    console.error('  ', err.message);
    process.exit(1);
  }
  console.log('[OK] SMTP-Verbindung erfolgreich!');
  process.exit(0);
});
