import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import bcrypt from 'bcryptjs';

process.env.NODE_ENV = 'test';
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'abj-shop-test-'));
process.env.BCRYPT_ROUNDS = '4';

const { default: db } = await import('../src/config/db.js');

const gateHash = await bcrypt.hash('zugang-abj-2026', 4);
db.prepare(`
  INSERT INTO settings(key, value) VALUES(?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`).run('gate_password_hash', gateHash);
