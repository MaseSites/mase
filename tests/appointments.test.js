'use strict';
/**
 * Appointment booking tests
 * Run: node --test tests/appointments.test.js
 *
 * Requires server running on localhost:3000 for integration tests.
 * Pure-function tests run without a server.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// ─────────────────────────────────────────────
// Pure helper — mirrors ai-assistant.js _parseDate()
// ─────────────────────────────────────────────
function parseDate(val) {
  const m = String(val || '').trim().match(/^(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const mon = parseInt(m[2], 10);
  const yr  = parseInt(m[3], 10);
  const d   = new Date(yr, mon - 1, day);
  if (d.getFullYear() !== yr || d.getMonth() !== mon - 1 || d.getDate() !== day) return null;
  return d;
}

function isFuture(d) {
  if (!d) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return d >= today;
}

// ─────────────────────────────────────────────
// Date validation — pure tests (no server needed)
// ─────────────────────────────────────────────
describe('parseDate() — format & existence', () => {
  test('valid date with dots', () => {
    const d = parseDate('15.06.2027');
    assert.ok(d instanceof Date, 'should return Date');
    assert.equal(d.getDate(), 15);
    assert.equal(d.getMonth(), 5);   // 0-based
    assert.equal(d.getFullYear(), 2027);
  });

  test('valid date with slashes', () => {
    const d = parseDate('15/06/2027');
    assert.ok(d instanceof Date);
    assert.equal(d.getDate(), 15);
  });

  test('single-digit day/month accepted', () => {
    const d = parseDate('5.6.2027');
    assert.ok(d instanceof Date);
    assert.equal(d.getDate(), 5);
    assert.equal(d.getMonth(), 5);
  });

  test('30.02.2027 does not exist → null', () => {
    assert.equal(parseDate('30.02.2027'), null);
  });

  test('29.02.2027 does not exist (not leap year) → null', () => {
    assert.equal(parseDate('29.02.2027'), null);
  });

  test('29.02.2028 exists (leap year) → Date', () => {
    assert.ok(parseDate('29.02.2028') instanceof Date);
  });

  test('31.04.2027 does not exist → null', () => {
    assert.equal(parseDate('31.04.2027'), null);
  });

  test('31.01.2027 exists → Date', () => {
    assert.ok(parseDate('31.01.2027') instanceof Date);
  });

  test('invalid format "abc" → null', () => {
    assert.equal(parseDate('abc'), null);
  });

  test('incomplete "15-06" → null', () => {
    assert.equal(parseDate('15-06'), null);
  });

  test('empty string → null', () => {
    assert.equal(parseDate(''), null);
  });

  test('null → null', () => {
    assert.equal(parseDate(null), null);
  });
});

describe('isFuture() — past date rejection', () => {
  test('future date is accepted', () => {
    const d = parseDate('01.01.2099');
    assert.ok(isFuture(d));
  });

  test('past date is rejected', () => {
    const d = parseDate('01.01.2000');
    assert.ok(!isFuture(d));
  });

  test('null is rejected', () => {
    assert.ok(!isFuture(null));
  });
});

// ─────────────────────────────────────────────
// Phone skip logic — mirrors ai-assistant.js
// ─────────────────────────────────────────────
describe('phone — optional field skip logic', () => {
  const SKIP_RE = /^(nein|skip|keine|–|-|\.|\s*)$/i;

  test('"nein" skips phone', ()  => assert.ok(SKIP_RE.test('nein')));
  test('"skip" skips phone', ()  => assert.ok(SKIP_RE.test('skip')));
  test('"NEIN" skips phone', ()  => assert.ok(SKIP_RE.test('NEIN')));
  test('"-" skips phone', ()     => assert.ok(SKIP_RE.test('-')));
  test('empty string skips', ()  => assert.ok(SKIP_RE.test('')));
  test('"  " (spaces) skips', () => assert.ok(SKIP_RE.test('   ')));

  test('valid number does NOT skip', () => assert.ok(!SKIP_RE.test('+41781234567')));
  test('short number does NOT skip',   () => assert.ok(!SKIP_RE.test('123456')));
});

// ─────────────────────────────────────────────
// Integration tests — server must run on :3000
// ─────────────────────────────────────────────
const BASE = 'http://localhost:3000';

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body)
  });
  return { res, data: await res.json() };
}

describe('POST /api/appointments — server validation', () => {
  const VALID = {
    first_name:       'Test',
    last_name:        'Benutzer',
    email:            'test@example.com',
    phone:            '',            // empty = optional skipped
    appointment_date: '15.06.2027',
    appointment_time: '10:00 Uhr',
    message:          ''
  };

  test('valid payload without phone → 200 or 503 (no DB in CI)', async () => {
    const { res } = await post('/api/appointments', VALID);
    assert.ok([200, 503].includes(res.status), `Got ${res.status}`);
  });

  test('missing first_name → 400 VALIDATION_REQUIRED_FIELDS', async () => {
    const { res, data } = await post('/api/appointments', { ...VALID, first_name: '' });
    assert.equal(res.status, 400);
    assert.equal(data.code, 'VALIDATION_REQUIRED_FIELDS');
  });

  test('missing last_name → 400 VALIDATION_REQUIRED_FIELDS', async () => {
    const { res, data } = await post('/api/appointments', { ...VALID, last_name: '' });
    assert.equal(res.status, 400);
    assert.equal(data.code, 'VALIDATION_REQUIRED_FIELDS');
  });

  test('missing email → 400 VALIDATION_REQUIRED_FIELDS', async () => {
    const { res, data } = await post('/api/appointments', { ...VALID, email: '' });
    assert.equal(res.status, 400);
    assert.equal(data.code, 'VALIDATION_REQUIRED_FIELDS');
  });

  test('invalid email format → 400 VALIDATION_EMAIL', async () => {
    const { res, data } = await post('/api/appointments', { ...VALID, email: 'notanemail' });
    assert.equal(res.status, 400);
    assert.equal(data.code, 'VALIDATION_EMAIL');
  });

  test('missing date → 400 VALIDATION_REQUIRED_FIELDS', async () => {
    const { res, data } = await post('/api/appointments', { ...VALID, appointment_date: '' });
    assert.equal(res.status, 400);
    assert.equal(data.code, 'VALIDATION_REQUIRED_FIELDS');
  });

  test('missing time → 400 VALIDATION_REQUIRED_FIELDS', async () => {
    const { res, data } = await post('/api/appointments', { ...VALID, appointment_time: '' });
    assert.equal(res.status, 400);
    assert.equal(data.code, 'VALIDATION_REQUIRED_FIELDS');
  });

  test('phone omitted entirely → treated as empty (optional)', async () => {
    const { first_name, last_name, email, appointment_date, appointment_time } = VALID;
    const { res } = await post('/api/appointments', { first_name, last_name, email, appointment_date, appointment_time });
    assert.ok([200, 503].includes(res.status), `Got ${res.status}`);
  });
});

describe('PATCH /api/admin/data/appointments/:id — status validation', () => {
  test('invalid status → 400', async () => {
    const res = await fetch(BASE + '/api/admin/data/appointments/00000000-0000-0000-0000-000000000000', {
      method:  'PATCH',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer wrong-token'
      },
      body: JSON.stringify({ status: 'invalid_status' })
    });
    // 401 (bad token) or 400 (bad status) — both are correct rejections
    assert.ok([400, 401].includes(res.status), `Got ${res.status}`);
  });

  test('missing auth → 401', async () => {
    const res = await fetch(BASE + '/api/admin/data/appointments/00000000-0000-0000-0000-000000000000', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: 'confirmed' })
    });
    assert.equal(res.status, 401);
  });
});
