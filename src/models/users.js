import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { config } from '../config/env.js';

const byNameStmt = db.prepare('SELECT * FROM users WHERE username = ?');
const byIdStmt = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?');
const insertStmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
const updatePwStmt = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
const countStmt = db.prepare('SELECT COUNT(*) AS n FROM users');

const SALT_ROUNDS = config.bcryptRounds;

export function count() {
  return countStmt.get().n;
}

export function findByUsername(username) {
  return byNameStmt.get(username);
}

export function findById(id) {
  return byIdStmt.get(id);
}

export async function create(username, password) {
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const info = insertStmt.run(username, hash);
  return info.lastInsertRowid;
}

export async function verify(username, password) {
  const user = byNameStmt.get(username);
  if (!user) {
    // Timing-Angleichung: trotzdem einen Hash-Vergleich durchführen
    await bcrypt.compare(password, '$2a$12$0000000000000000000000000000000000000000000000000000');
    return null;
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? { id: user.id, username: user.username } : null;
}

export async function changePassword(id, newPassword) {
  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  updatePwStmt.run(hash, id);
}
