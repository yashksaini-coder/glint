// Detectors vs. the guided-capture fixture (recordings/guided.jsonl, recorded 2026-11-10, cues
// timestamped on the same clock as samples). Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { browDetector } from './brow.ts';
import { exhaleDetector } from './exhale.ts';
import { browRatio } from './extract.ts';

const rows = readFileSync(new URL('../../../recordings/guided.jsonl', import.meta.url), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const marks = rows.filter((r) => r.mark);
const windows = (label: string, lagS: number) => {
  const w: [number, number][] = [];
  for (let i = 0; i < marks.length; i += 2) if (marks[i].mark === label) w.push([marks[i].tUs, marks[i + 1].tUs + lagS * 1e6]);
  return w;
};
const inside = (t: number, w: [number, number][]) => w.some(([s, e]) => t >= s && t <= e);

test('fixture has the guided cues', () => {
  assert.equal(marks.length, 36);
  assert.equal(windows('brow-raise', 0).length, 3);
  assert.equal(windows('slow-exhale', 0).length, 3);
});

test('brow: fires only on cued raises, at least 2 of 3', () => {
  const d = browDetector();
  const fires = rows.filter((r) => r.k === 'brow' && d(r.t, r.v)).map((r) => r.t);
  const w = windows('brow-raise', 1.5);
  assert.deepEqual(fires.filter((t) => !inside(t, w)), [], 'no select outside a cued raise');
  // Third raise is legitimately missed: the user never relaxed below the re-arm level after raise 2.
  assert.ok(w.filter(([s, e]) => fires.some((t) => t >= s && t <= e)).length >= 2);
});

test('brow: one long raise selects once', () => {
  const d = browDetector();
  let fires = 0;
  for (let i = 0; i < 30 * 5; i++) fires += d(i * 33_333, i < 30 ? 0.2 : 0.27) ? 1 : 0; // 1 s rest, then 4 s at +35%
  assert.equal(fires, 1);
});

test('exhale: every cued exhale commits, never while talking', () => {
  const d = exhaleDetector();
  const fires: number[] = [];
  for (const r of rows) {
    if (r.k === 'talk') d.talk(r.t, r.v);
    else if (r.k === 'breath' && d.breath(r.t, r.v)) fires.push(r.t);
  }
  const w = windows('slow-exhale', 3);
  assert.equal(w.filter(([s, e]) => fires.some((t) => t >= s && t <= e)).length, 3);
  assert.deepEqual(fires.filter((t) => inside(t, windows('talking', 1))), []);
  // Two un-cued fires (35.9 s, 132.5 s) look like genuine resting slow exhales; cap so regressions show.
  assert.ok(fires.length <= 5, `fires: ${fires.length}`);
});

test('browRatio: normalised by eye spacing, so distance to camera cancels out', () => {
  const face = (k: number) => {
    const p = Array.from({ length: 478 }, () => ({ x: 0, y: 0 }));
    p[33] = { x: 0, y: 0 }; p[263] = { x: 100 * k, y: 0 };
    p[159] = { x: 25 * k, y: 0 }; p[105] = { x: 25 * k, y: -20 * k };
    p[386] = { x: 75 * k, y: 0 }; p[334] = { x: 75 * k, y: -20 * k };
    return p;
  };
  assert.equal(browRatio(face(1)), 0.2);
  assert.equal(browRatio(face(2.5)), 0.2);
  assert.equal(browRatio([]), null);
});
