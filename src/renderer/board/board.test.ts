import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScanner, BACK } from './scanner.ts';
import { applyKey, DEL, SPACE, LETTERS } from './layouts.ts';

const rows = [['a', 'b'], ['c', 'd'], ['e', 'f']];

test('row then column select returns the key and restarts at the top', () => {
  const s = createScanner(rows);
  let t = 0;
  s.tick((t += 1000));                     // row 1
  assert.equal(s.select((t += 1000)), null); // enter row 1
  assert.deepEqual(s.state(), { mode: 'cols', row: 1, col: 0 });
  s.tick((t += 1000));                     // col 1 = 'd'
  assert.equal(s.select((t += 1000)), 'd');
  assert.deepEqual(s.state(), { mode: 'rows', row: 0, col: 0 });
});

test('a select just after the highlight moved picks the previous item', () => {
  const s = createScanner(rows);
  s.tick(1000);                              // highlight moves to row 1 …
  assert.equal(s.select(1100), null);        // … but the user reacted to row 0
  assert.equal(s.state().row, 0);
  s.tick(2000);                              // col 1 'b'
  s.tick(3000);                              // col 2 BACK
  assert.equal(s.select(3200), 'b');         // late again: previous column
});

test('BACK leaves the row without typing; unselected rows time out', () => {
  const s = createScanner(rows);
  s.select(0);                               // enter row 0
  s.tick(1000); s.tick(2000);                // a, b, BACK
  assert.equal(s.keysOf(0)[s.state().col], BACK);
  assert.equal(s.select(3000), null);
  assert.equal(s.state().mode, 'rows');

  const s2 = createScanner(rows);
  s2.select(0);
  for (let i = 1; i <= 6; i++) s2.tick(i * 1000); // 2 full passes over a, b, BACK
  assert.equal(s2.state().mode, 'rows');
});

test('applyKey edits the text', () => {
  assert.equal(applyKey('hi', SPACE), 'hi ');
  assert.equal(applyKey('hi', DEL), 'h');
  assert.equal(applyKey('', DEL), '');
  assert.equal(applyKey('h', 'I'), 'hi');
  assert.ok(LETTERS.flat().includes(DEL) && LETTERS.flat().includes(SPACE));
});
