// Usage: node landmarks.mjs <recording.jsonl>  — eye-aspect-ratio closures and brow-raise peaks from landmarks
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pts = [];
for await (const line of createInterface({ input: createReadStream(process.argv[2]) })) {
  const { m } = JSON.parse(line);
  for (const l of m.face?.landmarks ?? []) {
    const p = l.value; if (p?.length !== 478) continue;
    const ear = (d(p[159], p[145]) / d(p[33], p[133]) + d(p[386], p[374]) / d(p[362], p[263])) / 2;
    const iod = d(p[33], p[263]);
    const brow = (d(p[105], p[159]) + d(p[334], p[386])) / 2 / iod;
    pts.push({ t: l.timestamp, ear, brow });
  }
}
pts.sort((a, b) => a.t - b.t);
const t0 = pts[0].t, rel = (t) => ((t - t0) / 1e6).toFixed(1);
const median = (xs) => [...xs].sort((a, b) => a - b)[xs.length >> 1];
const earMed = median(pts.map((p) => p.ear)), browMed = median(pts.map((p) => p.brow));
const browMad = median(pts.map((p) => Math.abs(p.brow - browMed)));
console.log(`${pts.length} landmark frames over ${rel(pts.at(-1).t)} s; EAR median ${earMed.toFixed(3)}, brow median ${browMed.toFixed(3)} (MAD ${browMad.toFixed(4)})`);

const runs = (pred) => { const out = []; let s = null, last = null;
  for (const p of pts) { if (pred(p)) { s ??= p; last = p; } else if (s) { out.push({ s, e: last }); s = null; } }
  return out; };

const closures = runs((p) => p.ear < 0.5 * earMed).map((r) => ({ at: rel(r.s.t), ms: (r.e.t - r.s.t) / 1000 }));
const hist = { '<150': 0, '150-400': 0, '400-1200': 0, '>1200': 0 };
for (const c of closures) hist[c.ms < 150 ? '<150' : c.ms < 400 ? '150-400' : c.ms <= 1200 ? '400-1200' : '>1200']++;
console.log(`\neye closures (EAR < 50% of median): ${closures.length}`, hist);
for (const c of closures.filter((c) => c.ms >= 250)) console.log(`  ${c.at.padStart(6)} s  ${c.ms.toFixed(0)} ms`);

const raises = runs((p) => p.brow > browMed + 6 * browMad)
  .map((r) => ({ at: rel(r.s.t), ms: (r.e.t - r.s.t) / 1000, peak: Math.max(...pts.filter((p) => p.t >= r.s.t && p.t <= r.e.t).map((p) => p.brow)) }))
  .filter((r) => r.ms >= 200);
console.log(`\nbrow raises (brow > median + 6·MAD for >= 200 ms): ${raises.length}`);
for (const r of raises) console.log(`  ${r.at.padStart(6)} s  ${r.ms.toFixed(0).padStart(5)} ms  +${(((r.peak - browMed) / browMed) * 100).toFixed(0)}%`);
