// Usage: node analyze.mjs <recording.jsonl>
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

const SURPRISE = 8;
const fields = {
  blink: (m) => m.face?.blinking, talk: (m) => m.face?.talking, expr: (m) => m.face?.expression,
  lm: (m) => m.face?.landmarks, up: (m) => m.breathing?.upperTrace, rate: (m) => m.breathing?.rate,
  pulse: (m) => m.cardio?.pulseRate,
};
const stats = Object.fromEntries(Object.keys(fields).map((k) => [k, { msgs: 0, samples: 0, maxPerMsg: 0, dup: 0 }]));
const seenTs = Object.fromEntries(Object.keys(fields).map((k) => [k, new Set()]));
const series = { blink: new Map(), talk: new Map(), surprise: new Map(), up: new Map(), upStable: new Map() };
let n = 0, firstTs = null, lastTs = null, bytes = 0;

const rl = createInterface({ input: createReadStream(process.argv[2]) });
for await (const line of rl) {
  bytes += line.length; n++;
  const { ts, m } = JSON.parse(line);
  firstTs ??= ts; lastTs = ts;
  for (const [k, get] of Object.entries(fields)) {
    const arr = get(m); if (!arr?.length) continue;
    const s = stats[k]; s.msgs++; s.samples += arr.length; s.maxPerMsg = Math.max(s.maxPerMsg, arr.length);
    for (const x of arr) { if (seenTs[k].has(x.timestamp)) s.dup++; else seenTs[k].add(x.timestamp); }
  }
  for (const x of m.face?.blinking ?? []) series.blink.set(x.timestamp, !!x.detected);
  for (const x of m.face?.talking ?? []) series.talk.set(x.timestamp, !!x.detected);
  for (const x of m.face?.expression ?? []) series.surprise.set(x.timestamp, x.scores?.find((s) => s.type === SURPRISE)?.confidence ?? 0);
  for (const x of m.breathing?.upperTrace ?? []) { series.up.set(x.timestamp, x.value ?? 0); series.upStable.set(x.timestamp, !!x.stable); }
}

const sorted = (map) => [...map.entries()].sort((a, b) => a[0] - b[0]);
const t0 = Math.min(...sorted(series.blink).slice(0, 1).map((e) => e[0]), ...sorted(series.up).slice(0, 1).map((e) => e[0]));
const rel = (us) => ((us - t0) / 1e6).toFixed(1);
const runs = (map) => { // true-runs as [start, end, durMs]
  const out = []; let s = null, prev = null;
  for (const [t, v] of sorted(map)) { if (v && s === null) s = t; if (!v && s !== null) { out.push([s, prev, (prev - s) / 1000]); s = null; } prev = t; }
  return out;
};
const rateHz = (map) => { const t = sorted(map).map((e) => e[0]); return t.length > 1 ? ((t.length - 1) / ((t.at(-1) - t[0]) / 1e6)).toFixed(1) : '-'; };

console.log(`messages ${n}, span ${((lastTs - firstTs) / 1e6).toFixed(1)} s (ts unit check: first=${firstTs}), avg line ${(bytes / n / 1024).toFixed(1)} KiB`);
console.log('field   msgs  samples  maxPerMsg  dupSamples  uniqueHz');
for (const [k, s] of Object.entries(stats)) console.log(k.padEnd(7), String(s.msgs).padStart(5), String(s.samples).padStart(8), String(s.maxPerMsg).padStart(10), String(s.dup).padStart(11), String(k in series ? rateHz(series[k]) : rateHz(new Map([...seenTs[k]].map((t) => [t, 1])))).padStart(9));

console.log('\nblink runs (start s, duration ms):');
for (const [s, , d] of runs(series.blink)) console.log(`  ${rel(s).padStart(6)}  ${d.toFixed(0).padStart(5)}`);
console.log('\ntalking runs (start s, duration ms):');
for (const [s, , d] of runs(series.talk)) if (d > 200) console.log(`  ${rel(s).padStart(6)}  ${d.toFixed(0).padStart(5)}`);

const sur = sorted(series.surprise);
console.log(`\nsurprise: samples ${sur.length}, median ${[...sur.map((e) => e[1])].sort((a, b) => a - b)[sur.length >> 1]?.toFixed(1)}, runs >= 60:`);
for (const [s, , d] of runs(new Map(sur.map(([t, v]) => [t, v >= 60])))) {
  const peak = Math.max(...sur.filter(([t]) => t >= s && t <= s + d * 1000).map((e) => e[1]));
  console.log(`  ${rel(s).padStart(6)}  ${d.toFixed(0).padStart(5)} ms  peak ${peak.toFixed(0)}`);
}

const up = sorted(series.up);
const vals = up.map((e) => e[1]);
console.log(`\nupperTrace: ${up.length} samples, range [${Math.min(...vals).toFixed(3)}, ${Math.max(...vals).toFixed(3)}], first stable at ${rel(sorted(series.upStable).find((e) => e[1])?.[0] ?? t0)} s`);
// monotonic segments on EMA-smoothed trace, longest 10
let ema = vals[0]; const sm = vals.map((v) => (ema = 0.3 * v + 0.7 * ema));
const segs = []; let st = 0;
for (let i = 1; i < sm.length; i++) {
  const dir = Math.sign(sm[i] - sm[i - 1]), prevDir = Math.sign(sm[i - 1] - sm[Math.max(0, i - 2)]);
  if (i > 1 && dir !== prevDir && dir !== 0) { segs.push([st, i - 1]); st = i - 1; }
}
segs.push([st, sm.length - 1]);
const desc = segs.map(([a, b]) => ({ start: up[a][0], dur: (up[b][0] - up[a][0]) / 1e6, amp: sm[b] - sm[a] }))
  .filter((s) => s.dur > 0).sort((a, b) => b.dur - a.dur).slice(0, 12).sort((a, b) => a.start - b.start);
console.log('longest monotonic segments (start s, dur s, amplitude):');
for (const s of desc) console.log(`  ${rel(s.start).padStart(6)}  ${s.dur.toFixed(2).padStart(5)}  ${s.amp >= 0 ? '+' : ''}${s.amp.toFixed(3)}`);
const durs = segs.map(([a, b]) => (up[b][0] - up[a][0]) / 1e6).filter((d) => d > 0).sort((a, b) => a - b);
console.log(`segment duration median ${durs[durs.length >> 1]?.toFixed(2)} s over ${durs.length} segments`);
