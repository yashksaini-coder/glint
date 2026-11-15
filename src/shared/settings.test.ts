import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitize, DEFAULT_SETTINGS } from './settings.ts';

test('garbage in, defaults out', () => {
  for (const x of [null, undefined, 42, 'x', [], {}]) assert.deepEqual(sanitize(x), DEFAULT_SETTINGS);
});

test('values are clamped, typed and trimmed', () => {
  const s = sanitize({ dwellMs: '99999', telemetry: 'yes', phrases: ['  hi   there ', '', 7, 'x'.repeat(80), 'a', 'b', 'c', 'd', 'e'] });
  assert.equal(s.dwellMs, 3000);
  assert.equal(s.telemetry, false, 'only literal true enables telemetry');
  assert.deepEqual(s.phrases.slice(0, 3), ['hi there', '7', 'x'.repeat(40)]);
  assert.equal(s.phrases.length, 6);
  assert.equal(sanitize({ dwellMs: 10 }).dwellMs, 500);
  assert.equal(sanitize({ telemetry: true }).telemetry, true);
  assert.deepEqual(sanitize({ phrases: [] }).phrases, [], 'an emptied phrase list stays empty (no phrase row)');
});

test('send target and recipient are coerced strictly', () => {
  assert.deepEqual([sanitize({ sendTarget: 'sms' }).sendTarget, sanitize({}).sendTo], ['none', '']);
  const to = (sendTarget: string, sendTo: unknown) => sanitize({ sendTarget, sendTo }).sendTo;
  assert.equal(to('whatsapp', '+1 (555) 010-0123'), '15550100123');
  assert.equal(to('whatsapp', ''), '');
  assert.equal(to('whatsapp', '1234567890123456'), '', 'over 15 digits is not a phone number');
  assert.equal(to('whatsapp', '555 call me'), '');
  assert.equal(to('email', ' me@example.org '), 'me@example.org');
  for (const bad of ['a b@x.org', 'a@b@x.org', 'a@x.org?cc=b@y.org', 'a@x.org&x', 'a@x#.org', 'a%40@x.org', 'a@x.org\nb', 'a@x', 'a@x.org,b@y.org', 42])
    assert.equal(to('email', bad), '', String(bad));
  assert.equal(to('telegram', '15550100'), '', 'telegram share links cannot preset a chat');
  assert.equal(to('none', 'me@example.org'), '');
});
