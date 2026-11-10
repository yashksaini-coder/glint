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
