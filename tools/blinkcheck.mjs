import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const blink = [], ear = [], marks = []; let firstMsgWall = null;
for await (const line of createInterface({ input: createReadStream(process.argv[2]) })) {
  const o = JSON.parse(line);
  if (o.mark) { marks.push(o); continue; }
  firstMsgWall ??= o.ts;
  for (const x of o.m.face?.blinking ?? []) blink.push([x.timestamp, x.detected ? 1 : 0]);
  for (const l of o.m.face?.landmarks ?? []) { const p = l.value; if (p?.length === 478) ear.push([l.timestamp, (d(p[159], p[145]) / d(p[33], p[133]) + d(p[386], p[374]) / d(p[362], p[263])) / 2, d(p[159], p[145]), d(p[33], p[133])]); }
}
blink.sort((a, b) => a[0] - b[0]); ear.sort((a, b) => a[0] - b[0]);
const t0 = ear[0][0], rel = (t) => ((t - t0) / 1e6).toFixed(2);
console.log('metrics-event ts vs sample ts (first):', firstMsgWall, ear[0][0], blink[0][0]);
const det = blink.filter((b) => b[1]); console.log(`SDK blink detected frames: ${det.length}/${blink.length}`, det.slice(0, 20).map((b) => rel(b[0])).join(' '));
const sorted = [...ear].sort((a, b) => a[1] - b[1]);
console.log('lowest-EAR frames (t, EAR, lidGap px, eyeWidth px):'); for (const e of sorted.slice(0, 12)) console.log(' ', rel(e[0]), e[1].toFixed(3), e[2].toFixed(1), e[3].toFixed(1));
console.log('eye width px median', [...ear.map((e) => e[3])].sort((a, b) => a - b)[ear.length >> 1].toFixed(1));
const lb = marks.filter((m) => m.mark === 'long-blink' && m.phase === 'start').map((m) => m.tUs);
console.log('long-blink cue starts (rel s):', lb.map(rel).join(' '));
// EAR trace around first long-blink cue, -1 s .. +3 s, 100 ms bins
const c = lb[0]; const bins = [];
for (let s = -1; s < 3; s += 0.2) { const xs = ear.filter((e) => e[0] >= c + s * 1e6 && e[0] < c + (s + 0.2) * 1e6).map((e) => e[1]); bins.push(`${s.toFixed(1)}:${xs.length ? Math.min(...xs).toFixed(2) : '--'}`); }
console.log('EAR min per 200ms bin around cue 1:', bins.join(' '));
