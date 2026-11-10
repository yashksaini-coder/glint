// Usage: node guided.mjs <guided-recording.jsonl>
// Per cued window [start, end + 0.8 s] report what each candidate signal did, vs. the un-cued baseline.
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

const SURPRISE = 8, LAG = 0.8e6;
const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const S = { blink: [], talk: [], surprise: [], ear: [], brow: [], up: [] }; // [tUs, value]
const marks = [];
for await (const line of createInterface({ input: createReadStream(process.argv[2]) })) {
  const o = JSON.parse(line);
  if (o.mark) { marks.push(o); continue; }
  const m = o.m;
  for (const x of m.face?.blinking ?? []) S.blink.push([x.timestamp, x.detected ? 1 : 0]);
  for (const x of m.face?.talking ?? []) S.talk.push([x.timestamp, x.detected ? 1 : 0]);
  for (const x of m.face?.expression ?? []) S.surprise.push([x.timestamp, x.scores?.find((s) => s.type === SURPRISE)?.confidence ?? 0]);
  for (const x of m.breathing?.upperTrace ?? []) S.up.push([x.timestamp, x.value ?? 0]);
  for (const l of m.face?.landmarks ?? []) {
    const p = l.value; if (p?.length !== 478) continue;
    S.ear.push([l.timestamp, (d(p[159], p[145]) / d(p[33], p[133]) + d(p[386], p[374]) / d(p[362], p[263])) / 2]);
    S.brow.push([l.timestamp, (d(p[105], p[159]) + d(p[334], p[386])) / 2 / d(p[33], p[263])]);
  }
}
for (const k in S) S[k].sort((a, b) => a[0] - b[0]);
const windows = [];
for (let i = 0; i < marks.length; i += 2) windows.push({ label: marks[i].mark, s: marks[i].tUs, e: marks[i + 1].tUs });
const t0 = Math.min(S.blink[0]?.[0] ?? Infinity, S.ear[0]?.[0] ?? Infinity);
const rel = (t) => ((t - t0) / 1e6).toFixed(1);
const inAny = (t) => windows.some((w) => t >= w.s - 0.5e6 && t <= w.e + LAG + 2e6);
const median = (xs) => [...xs].sort((a, b) => a - b)[xs.length >> 1] ?? NaN;
const base = (k) => median(S[k].filter(([t]) => !inAny(t)).map((e) => e[1]));
const earBase = base('ear'), browBase = base('brow');
const slice = (k, a, b) => S[k].filter(([t]) => t >= a && t <= b);
const longestRun = (xs, pred) => { let best = 0, st = null;
  for (const [t, v] of xs) { if (pred(v)) { st ??= t; best = Math.max(best, t - st); } else st = null; } return best / 1000; };

console.log(`baselines (un-cued): EAR ${earBase.toFixed(3)}  brow ${browBase.toFixed(3)}  surprise ${base('surprise').toFixed(1)}  talking ${(S.talk.filter(([t]) => !inAny(t)).reduce((a, e) => a + e[1], 0) / S.talk.filter(([t]) => !inAny(t)).length * 100).toFixed(0)}% of frames`);
console.log('\nwindow          @s     dur | SDKblink frac/longest ms | EAR min%  closed>=50% ms | surprise max  >=30 ms | brow max%  >=+20% ms | talk frac | upTrace Δ (EMA)');
let ema = null; const upS = S.up.map(([t, v]) => [t, (ema = ema === null ? v : 0.15 * v + 0.85 * ema)]);
const upAt = (t) => { let best = upS[0]; for (const e of upS) { if (e[0] > t) break; best = e; } return best?.[1] ?? NaN; };
for (const w of windows) {
  const a = w.s, b = w.e + LAG;
  const bl = slice('blink', a, b), ea = slice('ear', a, b), su = slice('surprise', a, b), br = slice('brow', a, b), ta = slice('talk', a, b);
  const frac = (xs) => xs.length ? (xs.reduce((s, e) => s + e[1], 0) / xs.length).toFixed(2) : '-';
  console.log(
    w.label.padEnd(12), rel(w.s).padStart(6), ((w.e - w.s) / 1e6).toFixed(1).padStart(5), '|',
    frac(bl).padStart(5), longestRun(bl, (v) => v === 1).toFixed(0).padStart(6), '|',
    (Math.min(...ea.map((e) => e[1])) / earBase * 100).toFixed(0).padStart(6), longestRun(ea, (v) => v < 0.5 * earBase).toFixed(0).padStart(9), '|',
    Math.max(0, ...su.map((e) => e[1])).toFixed(0).padStart(9), longestRun(su, (v) => v >= 30).toFixed(0).padStart(8), '|',
    ((Math.max(...br.map((e) => e[1])) / browBase - 1) * 100).toFixed(0).padStart(7), longestRun(br, (v) => v > browBase * 1.2).toFixed(0).padStart(9), '|',
    frac(ta).padStart(6), '|',
    (w.label === 'slow-exhale' ? `inhale ${(upAt(w.s) - upAt(w.s - 3e6)).toFixed(1)} → exhale ${(upAt(w.e + LAG) - upAt(w.s)).toFixed(1)}` : `${(upAt(b) - upAt(a)).toFixed(1)}`),
  );
}
// false-positive check: un-cued time with each candidate firing
const fp = (k, pred, minMs) => { let n = 0, st = null, last = null;
  for (const [t, v] of S[k]) { if (inAny(t)) { st = null; continue; } if (pred(v)) { st ??= t; last = t; } else if (st !== null) { if ((last - st) / 1000 >= minMs) n++; st = null; } }
  return n; };
const unCuedS = (S.ear.at(-1)[0] - S.ear[0][0]) / 1e6 - windows.reduce((s, w) => s + (w.e - w.s + LAG + 2.5e6) / 1e6, 0);
console.log(`\nfalse positives in ~${unCuedS.toFixed(0)} s un-cued: EAR closed>=300ms ${fp('ear', (v) => v < 0.5 * earBase, 300)}, brow>=+20% for>=300ms ${fp('brow', (v) => v > browBase * 1.2, 300)}, SDK blink>=200ms ${fp('blink', (v) => v === 1, 200)}`);
