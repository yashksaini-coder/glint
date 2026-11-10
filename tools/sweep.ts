// Usage: node tools/sweep.ts [fixture.jsonl] — grid-search detector options against guided-capture cues.
// Score: hits (cued gestures that fired) minus 2 × false fires; prints the top settings per detector.
import { readFileSync } from 'node:fs';
import { browDetector, BROW_DEFAULTS } from '../src/renderer/gestures/brow.ts';
import { exhaleDetector, EXHALE_DEFAULTS } from '../src/renderer/gestures/exhale.ts';

const rows = readFileSync(process.argv[2] ?? 'recordings/guided.jsonl', 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const marks = rows.filter((r) => r.mark);
const win = (label: string, lag: number) => {
  const w = [];
  for (let i = 0; i < marks.length; i += 2) if (marks[i].mark === label) w.push([marks[i].tUs, marks[i + 1].tUs + lag * 1e6]);
  return w;
};
const score = (fires: number[], w: number[][]) => {
  const hit = w.filter(([s, e]) => fires.some((t) => t >= s && t <= e)).length;
  const fp = fires.filter((t) => !w.some(([s, e]) => t >= s && t <= e)).length;
  return { hit, fp, score: hit - 2 * fp };
};
const grid = (axes: Record<string, number[]>) => Object.entries(axes).reduce<Record<string, number>[]>(
  (acc, [k, vs]) => acc.flatMap((a) => vs.map((v) => ({ ...a, [k]: v }))), [{}]);

const browRows = rows.filter((r) => r.k === 'brow'), bw = win('brow-raise', 1.5);
const browRes = grid({ rise: [0.16, 0.18, 0.2, 0.22, 0.25, 0.28], rearm: [0.06, 0.08, 0.1, 0.12], holdMs: [100, 200, 300, 400], smoothAlpha: [0.15, 0.3, 0.5] })
  .map((g) => { const d = browDetector({ ...BROW_DEFAULTS, ...g }); return { g, ...score(browRows.filter((r) => d(r.t, r.v)).map((r) => r.t), bw) }; });
const breathRows = rows.filter((r) => r.k === 'breath' || r.k === 'talk'), ew = win('slow-exhale', 3);
const exRes = grid({ minDrop: [4, 5, 6, 7], minMs: [1000, 1500, 2000, 2500], alpha: [0.1, 0.15, 0.25], talkMax: [0.3, 0.5] })
  .map((g) => { const d = exhaleDetector({ ...EXHALE_DEFAULTS, ...g }); const f: number[] = [];
    for (const r of breathRows) { if (r.k === 'talk') d.talk(r.t, r.v); else if (d.breath(r.t, r.v)) f.push(r.t); }
    return { g, ...score(f, ew) }; });
for (const [name, res, n] of [['brow (3 cued)', browRes, 3], ['exhale (3 cued)', exRes, 3]] as const) {
  const sorted = [...res].sort((a, b) => b.score - a.score);
  console.log(`\n${name}: ${res.length} settings, ${res.filter((r) => r.hit === n && r.fp === 0).length} perfect`);
  for (const r of sorted.slice(0, 6)) console.log(`  hit ${r.hit} fp ${r.fp}  ${JSON.stringify(r.g)}`);
}
