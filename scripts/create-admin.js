// Legt einen Admin-Account an und stellt sicher, dass das Gate-Passwort gesetzt ist.
// Nutzung:
//   npm run create-admin                       (interaktiv)
//   npm run create-admin -- <user> <passwort>  (direkt)
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import bcrypt from 'bcryptjs';
import * as users from '../src/models/users.js';
import * as settings from '../src/models/settings.js';
import { config } from '../src/config/env.js';

async function prompt(question) {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

async function ensureGatePassword() {
  const existing = settings.get('gate_password_hash');
  if (existing) {
    console.log('• Gate-Passwort ist bereits gesetzt (unverändert).');
    return;
  }
  const bootstrap = config.gatePasswordBootstrap;
  if (bootstrap) {
    const hash = await bcrypt.hash(bootstrap, config.bcryptRounds);
    settings.set('gate_password_hash', hash);
    console.log('• Gate-Passwort aus .env (GATE_PASSWORD) gesetzt.');
  } else {
    const pw = await prompt('Zugangs-Passwort für die Seite (Gate) festlegen: ');
    if (pw.length < 6) throw new Error('Gate-Passwort muss mindestens 6 Zeichen haben.');
    const hash = await bcrypt.hash(pw, config.bcryptRounds);
    settings.set('gate_password_hash', hash);
    console.log('• Gate-Passwort gesetzt.');
  }
}

async function main() {
  let [, , username, password] = process.argv;

  if (!username) username = await prompt('Admin-Benutzername: ');
  if (!password) password = await prompt('Admin-Passwort (min. 8 Zeichen): ');

  if (!username || username.length < 3) throw new Error('Benutzername zu kurz (min. 3 Zeichen).');
  if (!password || password.length < 8) throw new Error('Passwort zu kurz (min. 8 Zeichen).');

  if (users.findByUsername(username)) {
    throw new Error(`Benutzer "${username}" existiert bereits.`);
  }

  const id = await users.create(username, password);
  console.log(`✓ Admin "${username}" angelegt (ID ${id}).`);

  await ensureGatePassword();
  console.log('\nFertig. Starte den Server mit: npm run dev');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fehler:', err.message);
    process.exit(1);
  });
