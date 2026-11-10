// Usage: node tools/make-fixture.ts <raw-recording.jsonl> <out.jsonl>
// Shrinks a raw recording (tens of MB, mostly landmarks) to the samples the detectors consume,
// plus guided-capture marks. The output is safe to commit: numbers only, no images, no full face mesh.
import { createReadStream, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { extract, type Sample } from '../src/renderer/gestures/extract.ts';

const [src, dst] = process.argv.slice(2);
const samples: Sample[] = [];
const marks: object[] = [];
for await (const line of createInterface({ input: createReadStream(src) })) {
  const o = JSON.parse(line);
  if (o.mark) marks.push(o); else samples.push(...extract(o.m));
}
samples.sort((a, b) => a.t - b.t);
const round = (s: Sample) => (s.k === 'talk' ? s : { ...s, v: Math.round(s.v * 1e4) / 1e4 });
writeFileSync(dst, [...marks, ...samples.map(round)].map((o) => JSON.stringify(o)).join('\n') + '\n');
console.log(`${marks.length} marks, ${samples.length} samples -> ${dst}`);
