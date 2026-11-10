// Slow deliberate exhale -> `commit`. Input: breathing.upperTrace (rises on inhale, falls on exhale,
// verified on the guided recording) and face.talking. Fires when the smoothed trace has fallen at
// least minDrop from its last peak, falling for at least minMs, gently (≤ maxSlope), and the user
// has not been talking. Slow and long is what separates a deliberate exhale from breathing and speech.

export const EXHALE_DEFAULTS = {
  alpha: 0.15,      // EMA on the raw ~30 Hz trace
  minDrop: 6,       // trace units; cued exhales fell 8.6–19
  minMs: 2500,      // cued slow exhales fell for 2.9–6.1 s; natural breaths and speech fell ≤ 2.4 s
  maxSlope: 5,      // trace units / s at fire time; cued 2.4–3.1, speech 6.5–8.6
  maxMs: 6000,      // a peak older than this is stale: slow drift is not an exhale
  fallHysteresis: 1, // the fall clock starts once the trace is this far below the peak (skips plateaus)
  talkWindowMs: 1000,
  talkMax: 0.5,     // suppress if talking.detected in more than this fraction of the last window
};
export type ExhaleOpts = typeof EXHALE_DEFAULTS;

export function exhaleDetector(o: ExhaleOpts = EXHALE_DEFAULTS) {
  let ema: number | null = null;
  let peak = { v: -Infinity, t: 0 };
  let fallStart: number | null = null;
  let trough = Infinity;
  let armed = true;
  const talk: [number, boolean][] = [];

  const talking = (t: number) => {
    while (talk.length && t - talk[0][0] > o.talkWindowMs * 1000) talk.shift();
    return talk.length > 0 && talk.filter((x) => x[1]).length / talk.length > o.talkMax;
  };

  return {
    talk(t: number, v: boolean) { talk.push([t, v]); },
    breath(t: number, v: number): boolean { // t in µs
      ema = ema === null ? v : o.alpha * v + (1 - o.alpha) * ema;
      if (!armed) { // wait for the next inhale before another commit can fire
        trough = Math.min(trough, ema);
        if (ema - trough >= o.minDrop / 2) { armed = true; peak = { v: ema, t }; fallStart = null; }
        return false;
      }
      if (ema >= peak.v || (t - peak.t) / 1000 > o.maxMs) { peak = { v: ema, t }; fallStart = null; return false; }
      const drop = peak.v - ema;
      if (drop < o.fallHysteresis) { fallStart = null; return false; }
      fallStart ??= t;
      const fallS = (t - fallStart) / 1e6;
      if (drop < o.minDrop || fallS * 1000 < o.minMs || drop / fallS > o.maxSlope || talking(t)) return false;
      armed = false; trough = ema;
      return true;
    },
  };
}
