// Charts of the recorded guided session. chart-data.json comes from tools/site-charts.ts, which replays
// recordings/guided.jsonl through the real detectors; every number shown here is read from it.
// The two *Sketch figures at the bottom are schematics and hold no recorded data.
import { Figure } from './kit';
import data from './chart-data.json';

const { brow, breath, cues, cuePeaks, options } = data;

const scale = (d0: number, d1: number, r0: number, r1: number) => (v: number) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
const points = (xs: number[], ys: number[]) => xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
const pct = (r: number) => `${r < 0 ? '' : '+'}${(r * 100).toFixed(1)}%`;
const whole = (r: number) => `+${Math.round(r * 100)}%`;
const secs = (t: number) => `${t.toFixed(1)} s`;
const smooth = (u: number) => { const c = Math.min(1, Math.max(0, u)); return c * c * (3 - 2 * c); };

const Fire = ({ x, y, title }: { x: number; y: number; title: string }) => (
  <circle className="gc-fire" cx={x} cy={y} r={7}><title>{title}</title></circle>
);
const Hollow = ({ x, y, title }: { x: number; y: number; title: string }) => (
  <path className="gc-hollow" d={`M${x} ${y - 8}l8 8l-8 8l-8-8z`}><title>{title}</title></path>
);
const Bracket = ({ x0, x1, y }: { x0: number; x1: number; y: number }) => (
  <path className="gc-bracket" d={`M${x0} ${y - 5}v5H${x1}v-5`} />
);

export function BrowRecordingChart() {
  const L = 56, R = 708, T = 40, B = 238;
  const x = scale(brow.from, brow.to, L, R);
  const y = scale(-0.06, 0.4, B, T);
  const c3 = brow.cues[2];
  const fired = brow.cues.filter((c) => c.fired).length;
  const { third } = brow;
  const ticks = Array.from({ length: (brow.to - brow.from) / 2 + 1 }, (_, i) => brow.from + i * 2);
  const notArmed = brow.armedSpans.slice(0, -1).map(([, end], i) => [end, brow.armedSpans[i + 1][0]]);
  return (
    <Figure
      caption={`One recorded session of one person. The detector fired on ${fired} of ${brow.cues.length} cued raises, at ${brow.fires.map((f) => secs(f.t)).join(' and ')}. Between raises 2 and 3 the smoothed ratio stayed between ${pct(brow.gapMin)} and ${pct(brow.gapMax)}, never below the ${whole(options.rearm)} re-arm line, so the detector was not armed during raise 3 (peak ${pct(third.peak)}) and re-armed only at ${secs(third.rearmAt)}, after the cue ended. No stretch above the fire line in that raise lasted the ${options.holdMs} ms hold either; the longest was ${third.longestRunMs} ms.`}
    >
      <svg viewBox="0 0 720 324" role="img" aria-label={`Line chart of the smoothed brow ratio as a percentage above the resting baseline, from ${brow.from} to ${brow.to} seconds, with three shaded cue windows. Raises 1 and 2 cross the plus 28 percent fire line and fire at ${secs(brow.fires[0].t)} and ${secs(brow.fires[1].t)}. The ratio then stays above the plus 10 percent re-arm line, so raise 3 peaks at ${pct(third.peak)} while the detector is not armed, and it does not fire. The detector re-arms at ${secs(third.rearmAt)}.`}>
        {brow.cues.map((c, i) => (
          <g key={c.start}>
            <rect className="gc-cue" x={x(c.start)} y={T} width={x(c.end) - x(c.start)} height={B - T} />
            <text className="gc-t" x={(x(c.start) + x(c.end)) / 2} y={T - 10} textAnchor="middle">{`Raise ${i + 1}: ${c.fired ? 'fired' : 'no fire'}`}</text>
          </g>
        ))}
        {[[0, ''], [options.rearm, `Re-arm line ${whole(options.rearm)}`], [options.rise, `Fire line ${whole(options.rise)}`]].map(([v, label]) => (
          <g key={v}>
            <line className={v === options.rise ? 'gc-rule-strong' : 'gc-rule'} x1={L} x2={R} y1={y(v as number)} y2={y(v as number)} />
            <text className="gc-t gc-m" x={L - 8} y={y(v as number) + 4} textAnchor="end">{`${Math.round((v as number) * 100)}%`}</text>
            {v !== 0 && <text className="gc-t gc-m" x={L + 6} y={y(v as number) - 6}>{label}</text>}
          </g>
        ))}
        <text className="gc-t gc-m" x={x(77)} y={y(0) + 18}>Resting baseline</text>
        <polyline className="gc-trace" points={points(brow.t.map(x), brow.r.map(y))} />
        {brow.fires.map((f) => (
          <g key={f.t}>
            <Fire x={x(f.t)} y={y(f.r)} title={`Fired at ${secs(f.t)}, ${pct(f.r)}`} />
            <text className="gc-t" x={x(f.t) + 12} y={y(f.r) - 8}>{`Fired ${secs(f.t)}`}</text>
          </g>
        ))}
        <Hollow x={x(third.peakT)} y={y(third.peak)} title={`Peak ${pct(third.peak)} while not armed`} />
        <text className="gc-t" x={x(third.peakT)} y={y(third.peak) - 14} textAnchor="middle">{`${pct(third.peak)}, not armed`}</text>
        <text className="gc-t" x={x(third.rearmAt) + 12} y={y(0) + 18}>{`Re-armed ${secs(third.rearmAt)}`}</text>
        {brow.armedSpans.map(([s, e]) => (
          <g key={s}>
            <rect className="gc-armed" x={x(s)} y={B + 10} width={x(e) - x(s)} height={22} />
            <text className="gc-t gc-on" x={(x(s) + x(e)) / 2} y={B + 26} textAnchor="middle">armed</text>
          </g>
        ))}
        {notArmed.map(([s, e]) => (
          <g key={s}>
            <rect className="gc-unarmed" x={x(s)} y={B + 10} width={x(e) - x(s)} height={22} />
            <text className="gc-t gc-m" x={(x(s) + x(e)) / 2} y={B + 26} textAnchor="middle">not armed</text>
          </g>
        ))}
        {ticks.map((t) => <text key={t} className="gc-t gc-m" x={x(t)} y={B + 52} textAnchor="middle">{t}</text>)}
        <text className="gc-t gc-m" x={(L + R) / 2} y={B + 76} textAnchor="middle">Seconds into the recording. Vertical axis: smoothed brow ratio above baseline.</text>
      </svg>
    </Figure>
  );
}

export function ExhaleRecordingChart() {
  const FROM = 30, TO = data.durationS, L = 44, R = 708, T = 44, B = 248;
  const x = scale(FROM, TO, L, R);
  const y = scale(-15, 12, B, T);
  const shown = breath.t.map((t, i) => ({ t, v: breath.v[i] })).filter((p) => p.t >= FROM);
  const exhales = cues.filter((c) => c.mark === 'slow-exhale');
  const talking = cues.find((c) => c.mark === 'talking')!;
  const silent = cues.find((c) => c.mark === 'silent')!;
  const eyeBrow = cues.filter((c) => ['long-blink', 'quick-blink', 'brow-raise'].includes(c.mark));
  const cued = breath.fires.filter((f) => f.cued);
  const uncued = breath.fires.filter((f) => !f.cued);
  const span = (s: number, e: number, label: string) => (
    <g>
      <Bracket x0={x(s)} x1={x(e)} y={T - 6} />
      <text className="gc-t gc-m" x={(x(s) + x(e)) / 2} y={T - 16} textAnchor="middle">{label}</text>
    </g>
  );
  return (
    <Figure
      caption={`One recorded session of one person; the first ${FROM} s hold no fires and are not shown. The detector fired ${breath.fires.length} times: on all ${cued.length} of ${exhales.length} cued exhales, ${breath.fires.filter((f) => f.duringTalk).length} during talking, and ${uncued.length} with no cue, at ${uncued.map((f) => secs(f.t)).join(' and ')}. Fires with no cue are shown as they happened, not removed.`}
    >
      <svg viewBox="0 0 720 334" role="img" aria-label={`Line chart of the smoothed breathing trace from ${FROM} to ${Math.round(TO)} seconds. Three cued slow exhales are shaded and each has a fire marker. The ten second talking section has large fast swings and no fire. Two hollow markers show fires with no cue, at ${uncued.map((f) => secs(f.t)).join(' and ')}.`}>
        {exhales.map((c) => <rect key={c.start} className="gc-cue" x={x(c.start)} y={T} width={x(c.end) - x(c.start)} height={B - T} />)}
        <rect className="gc-talk" x={x(talking.start)} y={T} width={x(talking.end) - x(talking.start)} height={B - T} />
        {span(eyeBrow[0].start, eyeBrow.at(-1)!.end, 'Blink and brow cues')}
        {span(exhales[0].start, exhales.at(-1)!.end, 'Cued exhales ×3')}
        {span(talking.start, talking.end, 'Talking')}
        {span(silent.start, silent.end, 'Silent')}
        {[-10, 0, 10].map((v) => (
          <g key={v}>
            <line className="gc-rule" x1={L} x2={R} y1={y(v)} y2={y(v)} />
            <text className="gc-t gc-m" x={L - 8} y={y(v) + 4} textAnchor="end">{v}</text>
          </g>
        ))}
        <polyline className="gc-trace" points={points(shown.map((p) => x(p.t)), shown.map((p) => y(p.v)))} />
        {cued.map((f) => <Fire key={f.t} x={x(f.t)} y={y(f.v)} title={`Fired at ${secs(f.t)} during a cue`} />)}
        {uncued.map((f) => (
          <g key={f.t}>
            <Hollow x={x(f.t)} y={y(f.v)} title={`Fired at ${secs(f.t)} with no cue`} />
            {x(f.t) > 600 && <line className="gc-rule" x1={x(f.t)} x2={x(f.t)} y1={y(f.v) + 9} y2={B - 24} />}
            <text className="gc-t" x={x(f.t) > 600 ? R : x(f.t)} y={x(f.t) > 600 ? B - 8 : y(f.v) + 26} textAnchor={x(f.t) > 600 ? 'end' : 'middle'}>{`No cue, ${secs(f.t)}`}</text>
          </g>
        ))}
        {[40, 60, 80, 100, 120].map((t) => <text key={t} className="gc-t gc-m" x={x(t)} y={B + 22} textAnchor="middle">{t}</text>)}
        <text className="gc-t gc-m" x={L} y={B + 46}>Seconds into the recording. Vertical axis: smoothed trace units.</text>
        <Fire x={L + 7} y={B + 72} title="Fired during a cue" />
        <text className="gc-t" x={L + 20} y={B + 77}>Fired during a cue</text>
        <Hollow x={L + 185} y={B + 72} title="Fired with no cue" />
        <text className="gc-t" x={L + 199} y={B + 77}>Fired with no cue</text>
      </svg>
    </Figure>
  );
}

export function CuePeaksChart() {
  const L = 200, R = 590, T = 26, rowH = 62;
  const x = scale(0, 0.4, L, R);
  const rows = [
    { mark: 'long-blink', label: 'Close eyes, 1 s' },
    { mark: 'quick-blink', label: 'Quick blink' },
    { mark: 'brow-raise', label: 'Raise eyebrows' },
  ].map((r) => ({ ...r, peaks: cuePeaks.filter((c) => c.mark === r.mark) }));
  const B = T + rowH * rows.length;
  const blinkMax = Math.max(...rows.slice(0, 2).flatMap((r) => r.peaks.map((p) => p.peak)));
  const raise = rows[2].peaks.map((p) => p.peak);
  return (
    <Figure
      caption={`One recorded session of one person. Each dot is one cue: the highest smoothed brow ratio, relative to the detector's baseline, from the cue's start to 1.5 s after its end for blinks and during the cue for raises. Blink cues moved it by at most ${pct(blinkMax)}; raises reached ${pct(Math.min(...raise))} to ${pct(Math.max(...raise))}. The recording kept no eye-openness samples, so the blink result itself is only in the table above.`}
    >
      <svg viewBox="0 0 720 268" role="img" aria-label={`Strip plot of peak brow ratio per cue for three gestures. Five close-eyes cues and five quick-blink cues all stay at or below ${pct(blinkMax)}, under the plus 28 percent fire line. Three eyebrow raises reach ${pct(Math.min(...raise))} to ${pct(Math.max(...raise))}, above it.`}>
        {[0, 0.1, 0.2, 0.3, 0.4].map((v) => (
          <g key={v}>
            <line className="gc-rule" x1={x(v)} x2={x(v)} y1={T} y2={B} />
            <text className="gc-t gc-m" x={x(v)} y={B + 22} textAnchor="middle">{`${v * 100}%`}</text>
          </g>
        ))}
        <line className="gc-rule-strong" x1={x(options.rise)} x2={x(options.rise)} y1={T - 6} y2={B} />
        <text className="gc-t gc-m" x={x(options.rise)} y={T - 12} textAnchor="middle">{`Fire line ${whole(options.rise)}`}</text>
        {rows.map((r, i) => {
          const cy = T + rowH * (i + 0.5);
          const n = r.peaks.filter((p) => p.fired).length;
          return (
            <g key={r.mark}>
              <text className="gc-t" x={L - 16} y={cy + 5} textAnchor="end">{`${r.label} ×${r.peaks.length}`}</text>
              {r.peaks.map((p, j) => <circle key={j} className="gc-dot" cx={x(p.peak)} cy={cy + (j - (r.peaks.length - 1) / 2) * 9} r={6}><title>{`${r.label}, cue ${j + 1}: ${pct(p.peak)}`}</title></circle>)}
              <text className="gc-t" x={R + 16} y={cy + 5}>{`${n} of ${r.peaks.length} fired`}</text>
            </g>
          );
        })}
        <text className="gc-t gc-m" x={(L + R) / 2} y={B + 46} textAnchor="middle">Peak smoothed brow ratio above baseline</text>
      </svg>
    </Figure>
  );
}

const SCHEMATIC = 'Schematic, not data and not to scale. The curve only shows what each option measures.';

export function BrowOptionsSketch() {
  const L = 24, R = 696, T = 30, B = 222;
  const x = scale(0, 10, L, R);
  const y = scale(-0.04, 0.46, B, T);
  const f = (t: number) => 0.4 * smooth((t - 1.2) / 1.6) * (1 - smooth((t - 6) / 2.4));
  const ts = Array.from({ length: 201 }, (_, i) => i / 20);
  const up = ts.find((t) => f(t) >= options.rise)!;
  const fire = up + 1.2; // holdMs drawn wider than its true length so the bracket is legible
  const rearm = ts.find((t) => t > fire && f(t) < options.rearm)!;
  return (
    <Figure caption={`${SCHEMATIC} A raise must stay above the rise line for holdMs before it fires, and must drop below the rearm line before another can fire.`}>
      <svg viewBox="0 0 720 262" role="img" aria-label="Schematic of a brow raise curve. It crosses the rise line, stays above it for holdMs, and fires. It then falls below the lower rearm line, where the detector re-arms.">
        <text className="gc-t gc-m" x={R} y={18} textAnchor="end">Schematic, not data</text>
        {[[0, 'Baseline'], [options.rearm, `rearm: baseline × ${1 + options.rearm}`], [options.rise, `rise: baseline × ${1 + options.rise}`]].map(([v, label]) => (
          <g key={label}>
            <line className={v === options.rise ? 'gc-rule-strong' : 'gc-rule'} x1={L} x2={R} y1={y(v as number)} y2={y(v as number)} />
            <text className="gc-t gc-m" x={R} y={y(v as number) - 6} textAnchor="end">{label}</text>
          </g>
        ))}
        <polyline className="gc-trace" points={points(ts.map(x), ts.map((t) => y(f(t))))} />
        <Bracket x0={x(up)} x1={x(fire)} y={y(options.rise) + 16} />
        <text className="gc-t" x={(x(up) + x(fire)) / 2} y={y(options.rise) + 34} textAnchor="middle">{`holdMs: ${options.holdMs} ms`}</text>
        <Fire x={x(fire)} y={y(f(fire))} title="Fires" />
        <text className="gc-t" x={x(fire)} y={y(f(fire)) - 14} textAnchor="middle">Fires</text>
        <Hollow x={x(rearm)} y={y(f(rearm))} title="Re-arms" />
        <text className="gc-t" x={x(rearm) - 14} y={y(f(rearm)) + 20} textAnchor="end">Re-arms</text>
        <text className="gc-t gc-m" x={L} y={B + 30}>Time</text>
      </svg>
    </Figure>
  );
}

export function ExhaleOptionsSketch() {
  const L = 24, R = 696, T = 30, B = 240;
  const x = scale(0, 10, L, R);
  const y = scale(-13, 1.5, B, T);
  const peakT = 1.5, fall = 12, dur = 6;
  const f = (t: number) => (t < peakT ? -4 * (1 - smooth(t / peakT)) : -fall * smooth((t - peakT) / dur));
  const ts = Array.from({ length: 401 }, (_, i) => i / 40);
  const start = ts.find((t) => t > peakT && f(t) <= -1)!;
  const fire = start + options.minMs / 1000;
  return (
    <Figure caption={`${SCHEMATIC} All three must hold at once. maxSlope is the average fall so far, the drop from the peak divided by the time since the fall clock started.`}>
      <svg viewBox="0 0 720 280" role="img" aria-label="Schematic of a breath curve falling from its peak. The fall clock starts one unit below the peak. After minMs the curve has passed the minDrop line, and the dashed average slope from the peak level to that point is below maxSlope, so the detector fires.">
        <text className="gc-t gc-m" x={R} y={18} textAnchor="end">Schematic, not data</text>
        <line className="gc-rule" x1={L} x2={R} y1={y(0)} y2={y(0)} />
        <text className="gc-t gc-m" x={x(9.9)} y={y(0) + 18} textAnchor="end">Last peak</text>
        <line className="gc-rule-strong" x1={L} x2={R} y1={y(-options.minDrop)} y2={y(-options.minDrop)} />
        <text className="gc-t gc-m" x={L} y={y(-options.minDrop) - 6}>{`minDrop: ${options.minDrop} units below the peak`}</text>
        <polyline className="gc-trace" points={points(ts.map(x), ts.map((t) => y(f(t))))} />
        <line className="gc-chord" x1={x(start)} y1={y(0)} x2={x(fire)} y2={y(f(fire))} />
        <text className="gc-t" x={x(start) + 108} y={y(-2.6)}>{`maxSlope: this line no steeper than ${options.maxSlope} units/s`}</text>
        <Bracket x0={x(start)} x1={x(fire)} y={y(-10.4)} />
        <text className="gc-t" x={(x(start) + x(fire)) / 2} y={y(-10.4) + 18} textAnchor="middle">{`minMs: falling for ${options.minMs / 1000} s`}</text>
        <Hollow x={x(start)} y={y(f(start))} title="Fall clock starts" />
        <text className="gc-t" x={x(start) - 12} y={y(f(start)) + 24} textAnchor="end">Fall clock starts</text>
        <Fire x={x(fire)} y={y(f(fire))} title="Fires" />
        <text className="gc-t" x={x(fire) + 14} y={y(f(fire)) + 5}>Fires</text>
        <text className="gc-t gc-m" x={L} y={B + 30}>Time</text>
      </svg>
    </Figure>
  );
}
