// Usage: node tools/site-charts.ts
// Replays recordings/guided.jsonl through the real detectors and writes the small JSON the docs
// charts draw from (site/components/diagrams/chart-data.json). Reads the fixture, writes only that file.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { BROW_DEFAULTS as B, browDetector } from '../src/renderer/gestures/brow.ts';
import { EXHALE_DEFAULTS as X, exhaleDetector } from '../src/renderer/gestures/exhale.ts';

const BROW_FROM = 72, BROW_TO = 90, BREATH_HZ = 6;
const BROW_LAG = 1.5, EXHALE_LAG = 3; // same cue-to-gesture allowances as gestures.test.ts

const rows = readFileSync(new URL('../recordings/guided.jsonl', import.meta.url), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const samples = rows.filter((r) => r.k);
const marks = rows.filter((r) => r.mark);
const t0 = samples[0].t;
const sec = (us: number) => (us - t0) / 1e6;
const r1 = (n: number) => Math.round(n * 10) / 10, r2 = (n: number) => Math.round(n * 100) / 100, r3 = (n: number) => Math.round(n * 1000) / 1000;

const cues: { mark: string; start: number; end: number }[] = [];
for (let i = 0; i < marks.length; i += 2) cues.push({ mark: marks[i].mark, start: r2(sec(marks[i].tUs)), end: r2(sec(marks[i + 1].tUs)) });
const cuesOf = (m: string) => cues.filter((c) => c.mark === m);

// The detectors keep their smoothed value and baseline private, so this mirrors brow.ts to expose them.
// The assert below fails if the mirror ever stops matching the real detector.
const real = browDetector();
const browFires: number[] = [];
const trace: { t: number; r: number; armed: boolean }[] = [];
const mirrorFires: number[] = [];
{
  let base: number | null = null, sm = 0, upSince: number | null = null, armed = true, lastFire = -Infinity;
  for (const s of samples) {
    if (s.k !== 'brow') continue;
    if (real(s.t, s.v)) browFires.push(s.t);
    if (base === null) { base = sm = s.v; continue; }
    if (s.v / base - 1 > B.glitch) continue;
    sm = B.smoothAlpha * s.v + (1 - B.smoothAlpha) * sm;
    const r = sm / base - 1;
    if (r < B.rearm) { base += B.baselineAlpha * (sm - base); armed = true; }
    if (r < B.rise) upSince = null;
    else {
      const since = (upSince ??= s.t);
      if (armed && (s.t - since) / 1000 >= B.holdMs && (s.t - lastFire) / 1000 >= B.refractoryMs) { armed = false; lastFire = s.t; mirrorFires.push(s.t); }
    }
    trace.push({ t: sec(s.t), r, armed });
  }
}
assert.deepEqual(mirrorFires, browFires, 'brow mirror diverged from src/renderer/gestures/brow.ts');

const at = (t: number) => trace.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a));
const peakIn = (s: number, e: number) => Math.max(...trace.filter((p) => p.t >= s && p.t <= e).map((p) => p.r));
const inCue = (t: number, c: { start: number; end: number }, lag: number) => t >= c.start && t <= c.end + lag;

const browFireS = browFires.map(sec);
// A raise's peak is taken during its cue only: after raise 3 re-armed, a ~100 ms spike at 86.9 s
// would otherwise count as that raise's peak. Blinks keep the lag, the cautious choice for them.
const peakLag = (mark: string) => (mark === 'brow-raise' ? 0 : BROW_LAG);
const browCues = cuesOf('brow-raise').map((c) => ({ ...c, peak: r3(peakIn(c.start, c.end)), fired: browFireS.some((t) => inCue(t, c, BROW_LAG)) }));
const shown = trace.filter((p) => p.t >= BROW_FROM && p.t <= BROW_TO);
const armedSpans: [number, number][] = [];
shown.forEach((p, i) => {
  if (!p.armed) return;
  if (i && shown[i - 1].armed) armedSpans.at(-1)![1] = r2(p.t);
  else armedSpans.push([r2(p.t), r2(p.t)]);
});
const [, c2, c3] = browCues;
const gap = trace.filter((p) => p.t >= c2.end && p.t <= c3.start).map((p) => p.r);
// Why raise 3 did not fire: its peak during the cue, when the detector re-armed, and its longest stretch above the fire line.
const c3Trace = trace.filter((p) => inCue(p.t, c3, BROW_LAG));
const c3Peak = trace.filter((p) => inCue(p.t, c3, 0)).reduce((a, b) => (b.r > a.r ? b : a));
let runStart: number | null = null, longestRun = 0;
for (const p of c3Trace) {
  if (p.r < B.rise) { runStart = null; continue; }
  runStart ??= p.t;
  longestRun = Math.max(longestRun, p.t - runStart);
}
assert.ok(c3Trace.filter((p) => inCue(p.t, c3, 0)).every((p) => !p.armed), 'raise 3 is expected to be un-armed for its whole cue');

// Breath: the EMA is one line of exhale.ts; the fires come from the real detector.
const ex = exhaleDetector();
const breath: { t: number; v: number }[] = [];
const exFires: { t: number; v: number }[] = [];
let ema: number | null = null;
for (const s of samples) {
  if (s.k === 'talk') ex.talk(s.t, s.v);
  if (s.k !== 'breath') continue;
  const v: number = ema === null ? s.v : X.alpha * s.v + (1 - X.alpha) * ema;
  ema = v;
  breath.push({ t: sec(s.t), v });
  if (ex.breath(s.t, s.v)) exFires.push({ t: sec(s.t), v });
}
const thinned: typeof breath = [];
for (const p of breath) if (!thinned.length || p.t - thinned.at(-1)!.t >= 1 / BREATH_HZ) thinned.push(p);
const exCues = cuesOf('slow-exhale');
const talkCue = cuesOf('talking')[0];

const data = {
  durationS: r1(sec(samples.at(-1).t)),
  cues,
  options: { rise: B.rise, rearm: B.rearm, holdMs: B.holdMs, minDrop: X.minDrop, minMs: X.minMs, maxSlope: X.maxSlope },
  brow: {
    from: BROW_FROM, to: BROW_TO,
    t: shown.map((p) => r2(p.t)), r: shown.map((p) => r3(p.r)),
    armedSpans,
    fires: browFireS.map((t) => ({ t: r2(t), r: r3(at(t).r) })),
    cues: browCues,
    gapMin: r3(Math.min(...gap)), gapMax: r3(Math.max(...gap)),
    third: { peakT: r2(c3Peak.t), peak: r3(c3Peak.r), rearmAt: armedSpans.find(([s]) => s > c3.start)![0], longestRunMs: Math.round(longestRun * 1000) },
  },
  breath: {
    t: thinned.map((p) => r2(p.t)), v: thinned.map((p) => r2(p.v)),
    fires: exFires.map((f) => ({ t: r2(f.t), v: r2(f.v), cued: exCues.some((c) => inCue(f.t, c, EXHALE_LAG)), duringTalk: inCue(f.t, talkCue, 1) })),
  },
  // Peak smoothed brow rise per cue: blinks from cue start to 1.5 s after its end, raises during the cue.
  cuePeaks: cues.filter((c) => ['long-blink', 'quick-blink', 'brow-raise'].includes(c.mark)).map((c) => ({ mark: c.mark, peak: r3(peakIn(c.start, c.end + peakLag(c.mark))), fired: browFireS.some((t) => inCue(t, c, BROW_LAG)) })),
};

const out = new URL('../site/components/diagrams/chart-data.json', import.meta.url);
writeFileSync(out, JSON.stringify(data) + '\n');
console.log(`brow fires ${browFireS.map(r1).join(', ')} | cued ${browCues.filter((c) => c.fired).length}/${browCues.length}`);
console.log(`exhale fires ${exFires.map((f) => r1(f.t)).join(', ')} | un-cued ${data.breath.fires.filter((f) => !f.cued).map((f) => f.t).join(', ')}`);
console.log(`${JSON.stringify(data).length} bytes`);
