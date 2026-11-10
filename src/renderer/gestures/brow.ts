// Brow raise -> `select`. Input: brow ratio samples (extract.ts). Fires once per raise, while the brow
// is still up (rise held for holdMs), then waits for the brow to come back down before re-arming.

export const BROW_DEFAULTS = {
  rise: 0.28,         // fire above baseline × (1 + rise) on the smoothed ratio; cued raises reached +29…+41%
  rearm: 0.1,         // re-arm once back below baseline × (1 + rearm): the user must relax between raises
  holdMs: 200,
  refractoryMs: 800,
  baselineAlpha: 0.01, // per-sample EMA (~3 s at 30 Hz); only adapts while the brow is down
  glitch: 1.0,        // ignore samples above baseline × (1 + glitch): face-mesh tracking jumps
  smoothAlpha: 0.5,   // per-sample EMA on the ratio; raw face-mesh brow height jitters ±10% frame to frame
};
export type BrowOpts = typeof BROW_DEFAULTS;

export function browDetector(o: BrowOpts = BROW_DEFAULTS) {
  let base: number | null = null;
  let upSince: number | null = null;
  let armed = true;
  let lastFire = -Infinity;
  let sm: number | null = null;
  return (t: number, raw: number): boolean => { // t in µs
    if (base === null) { base = sm = raw; return false; }
    if (raw / base - 1 > o.glitch) return false;
    const v = (sm = o.smoothAlpha * raw + (1 - o.smoothAlpha) * sm!);
    const r = v / base - 1;
    if (r < o.rearm) { base += o.baselineAlpha * (v - base); armed = true; }
    if (r < o.rise) { upSince = null; return false; }
    upSince ??= t;
    if (!armed || (t - upSince) / 1000 < o.holdMs || (t - lastFire) / 1000 < o.refractoryMs) return false;
    armed = false; lastFire = t;
    return true;
  };
}
