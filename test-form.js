require('dotenv').config();
const http = require('http');

const data = JSON.stringify({
  name: 'Test Benutzer',
  email: 'test@test.ch',
  message: 'Das ist eine Testanfrage vom Kontaktformular.',
  privacy: true
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/contact',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Antwort:', body);
  });
});

req.on('error', (e) => {
  console.error('Fehler:', e.message);
});

req.write(data);
req.end();

