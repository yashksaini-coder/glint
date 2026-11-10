// Raw decoded SDK metrics -> the three signals Glint uses. Detectors only ever see these samples,
// so they run the same on live sessions, replays and test fixtures.

export type Sample =
  | { k: 'brow'; t: number; v: number }   // brow-to-eye distance / inter-ocular distance (landmarks)
  | { k: 'breath'; t: number; v: number; s: boolean } // breathing.upperTrace: rises on inhale, falls on exhale; s = stable
  | { k: 'talk'; t: number; v: boolean }; // face.talking.detected

type Pt = { x: number; y: number };
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

// MediaPipe 478-point numbering: 105/334 brow mid, 159/386 upper eyelid, 33/263 outer eye corners.
export function browRatio(p: Pt[]): number | null {
  if (p.length < 468) return null;
  const iod = dist(p[33], p[263]);
  if (iod < 1) return null;
  return (dist(p[105], p[159]) + dist(p[334], p[386])) / 2 / iod;
}

// `m` is Metrics.toObject(decodeMetrics(buf), { longs: Number }); timestamps are epoch µs.
export function extract(m: any): Sample[] {
  const out: Sample[] = [];
  for (const l of m.face?.landmarks ?? []) {
    const v = browRatio(l.value ?? []);
    if (v !== null) out.push({ k: 'brow', t: l.timestamp, v });
  }
  for (const x of m.breathing?.upperTrace ?? []) out.push({ k: 'breath', t: x.timestamp, v: x.value ?? 0, s: !!x.stable });
  for (const x of m.face?.talking ?? []) out.push({ k: 'talk', t: x.timestamp, v: !!x.detected });
  return out;
}
