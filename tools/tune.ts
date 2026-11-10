// Usage: node tools/tune.ts [fixture.jsonl]  — replay a fixture through both detectors and show every
// fire against the guided-capture cue windows.
import { readFileSync } from 'node:fs';
import { browDetector } from '../src/renderer/gestures/brow.ts';
import { exhaleDetector } from '../src/renderer/gestures/exhale.ts';

const rows = readFileSync(process.argv[2] ?? 'recordings/guided.jsonl', 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const marks = rows.filter((r) => r.mark);
const windows: { label: string; s: number; e: number }[] = [];
for (let i = 0; i < marks.length; i += 2) windows.push({ label: marks[i].mark, s: marks[i].tUs, e: marks[i + 1].tUs });
const t0 = rows.find((r) => r.k).t;
const where = (t: number, lagS: number) => windows.find((w) => t >= w.s && t <= w.e + lagS * 1e6)?.label ?? 'UNCUED';

const brow = browDetector(), exhale = exhaleDetector();
for (const r of rows) {
  if (r.k === 'brow' && brow(r.t, r.v)) console.log(`brow   fire @${((r.t - t0) / 1e6).toFixed(1)}s  in ${where(r.t, 1.5)}`);
  if (r.k === 'talk') exhale.talk(r.t, r.v);
  if (r.k === 'breath' && exhale.breath(r.t, r.v)) console.log(`exhale fire @${((r.t - t0) / 1e6).toFixed(1)}s  in ${where(r.t, 3)}`);
}
