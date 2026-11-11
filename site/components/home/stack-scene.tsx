// Glint's pipeline as an exploded isometric stack: you, webcam + SDK, detectors, board, speech.
// Pure SVG and CSS (app/hero.css). The markup is a complete still frame; the animation only exists
// under prefers-reduced-motion: no-preference. The 15 s loop: the closed stack opens, the signal runs
// down it, the stack closes. Timings below are seconds after it has opened.
import type { CSSProperties, ReactNode } from 'react';
import { GlintGlyph } from '@/components/logo';

type Pt = [number, number];
const COS = Math.cos(Math.PI / 6), SIN = 0.5, U = 30, CX = 176, LABEL_X = 418;
const n = (v: number) => Math.round(v * 100) / 100;
const iso = (x: number, y: number, z = 0): Pt => [n(CX + (x - y) * COS * U), n((x + y) * SIN * U - z * U)];
const poly = (pts: Pt[]) => pts.map((p) => p.join(',')).join(' ');
const line = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.join(' ')}`).join(' ');
const vars = (v: Record<string, string | number>) => v as CSSProperties;
const at = (s: number) => vars({ '--at': `${s}s` });
// Sample f over t in [0, 1] into a path lying flat at height z.
const flat = (f: (t: number) => [number, number], z = 0, steps = 32) =>
  line(Array.from({ length: steps + 1 }, (_, i) => { const [x, y] = f(i / steps); return iso(x, y, z); }));

function slab(x: number, y: number, w: number, d: number, z: number, h: number) {
  return {
    top: poly([iso(x, y, z + h), iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x, y + d, z + h)]),
    left: poly([iso(x, y + d, z + h), iso(x + w, y + d, z + h), iso(x + w, y + d, z), iso(x, y + d, z)]),
    right: poly([iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x + w, y + d, z), iso(x + w, y, z)]),
  };
}
function Slab({ s }: { s: ReturnType<typeof slab> }) {
  return (
    <g>
      <polygon points={s.left} className="g-iso-dark" />
      <polygon points={s.right} className="g-iso-mid" />
      <polygon points={s.top} className="g-iso-top" />
    </g>
  );
}

// The plates. `on` and `win` are when each one lights: s short, b board, e end (see hero.css).
const SMALL = { w: 4.4, d: 3.6 };
const LAYERS = [
  { y: 122, ...SMALL, on: 0, win: 's', title: 'YOU', sub: 'Raise your eyebrows, breathe out' },
  { y: 216, ...SMALL, on: 1, win: 's', title: 'WEBCAM + SDK', sub: 'Landmarks and breath, on-device' },
  { y: 308, ...SMALL, on: 2.1, win: 's', title: 'DETECTORS', sub: 'Eyebrow selects, slow exhale speaks' },
  { y: 450, w: 6.48, d: 4.48, on: 3.2, win: 'b', title: 'THE BOARD', sub: 'Scans rows, then keys' },
  { y: 570, ...SMALL, on: 9.3, win: 'e', title: 'SPEAK + COPY', sub: 'Reads aloud, copies to clipboard' },
];
// When the pulse sets off down each gap. A hop takes 0.8 s, so it lands as the next plate lights.
const PULSE_LEAVES = [0.3, 1.3, 2.4, 8.5];
const closedY = (i: number) => 340 + (i - 2) * 24; // where each plate sits when the stack is shut
const RAIL_POSTS: Pt[] = [iso(SMALL.w / 2, -SMALL.d / 2), iso(-SMALL.w / 2, SMALL.d / 2)];

function Layer({ i, children }: { i: number; children: ReactNode }) {
  const L = LAYERS[i], next = LAYERS[i + 1];
  const edge = iso(L.w / 2, -L.d / 2, -0.1);
  const lit = `g-iso-lit g-iso-w-${L.win}`;
  const plate = slab(-L.w / 2, -L.d / 2, L.w, L.d, -0.2, 0.2);
  return (
    <g transform={`translate(0 ${L.y})`}>
      <g className="g-iso-in" style={vars({ '--d': `${closedY(i) - L.y}px`, '--i': i })}>
        <g className="g-iso-float" style={vars({ '--i': i })}>
          {next && (
            <g>
              <g className="g-iso-rails">
                {RAIL_POSTS.map(([x, y]) => <line key={x} x1={x} x2={x} y1={y} y2={y + next.y - L.y} className="g-iso-rail" />)}
              </g>
              {RAIL_POSTS.map(([x, y]) => (
                <g key={x} className="g-iso-pulse" style={vars({ '--at': `${PULSE_LEAVES[i]}s`, '--dy': `${next.y - L.y}px` })}>
                  <line x1={x} x2={x} y1={y - 26} y2={y} className="g-iso-streak" />
                  <circle cx={x} cy={y} r="16" className="g-iso-glow" />
                  <circle cx={x} cy={y} r="5" className="g-iso-core" />
                </g>
              ))}
            </g>
          )}
          <g className={`g-iso-lift g-iso-lift-${L.win}`} style={at(L.on)}>
            <Slab s={plate} />
            <polygon points={plate.top} className={`${lit} g-iso-plate-on`} style={at(L.on)} />
            {children}
            <g className="g-iso-tags">
              <line x1={edge[0]} x2={LABEL_X - 10} y1={edge[1]} y2={edge[1]} className="g-iso-lead" />
              <line x1={edge[0]} x2={LABEL_X - 10} y1={edge[1]} y2={edge[1]} className={`${lit} g-iso-lead-on`} style={at(L.on)} />
              <circle cx={edge[0]} cy={edge[1]} r="3" className="g-iso-dot" />
              <g className={`g-iso-label g-iso-w-${L.win}`} style={at(L.on)}>
                <text x={LABEL_X} y={edge[1] - 3} className="g-iso-title"><tspan className="g-iso-num">{`0${i + 1}`}</tspan>{` ${L.title}`}</text>
                <text x={LABEL_X} y={edge[1] + 15} className="g-iso-sub">{L.sub}</text>
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}

function You() {
  return (
    <>
      <path d={`${flat((t) => [Math.cos(t * 6.283) * 0.95, Math.sin(t * 6.283) * 0.95])} Z`} className="g-iso-shadow" />
      <g transform="translate(-0.4 -136) translate(176 0) scale(0.3) translate(-256 0)">
        <GlintGlyph arcClassName="g-iso-brow" starClassName="g-iso-star" />
      </g>
    </>
  );
}

// A face seen from above the plate: outline, brows, eyes, mouth. Brows are the landmarks Glint reads.
const FX = 1.05, FY = -0.45, FS = 1.3;
const FACE: Pt[] = [
  ...Array.from({ length: 14 }, (_, i): Pt => [Math.cos(i * 0.449) * 0.62, Math.sin(i * 0.449) * 0.82]),
  [-0.22, -0.1], [0.22, -0.1], [-0.14, 0.42], [0, 0.46], [0.14, 0.42],
];
const BROWS: Pt[] = [[-0.36, -0.36], [-0.22, -0.44], [-0.08, -0.36], [0.08, -0.36], [0.22, -0.44], [0.36, -0.36]];
const Dots = ({ pts, r }: { pts: Pt[]; r: number }) => <>{pts.map(([x, y]) => { const [a, b] = iso(FX + x * FS, FY + y * FS); return <circle key={`${x},${y}`} cx={a} cy={b} r={r} />; })}</>;
const TRACE = flat((t) => [-1.9 + t * 3.8, 1.2 + Math.sin(t * Math.PI * 4) * 0.25], 0, 60);

function Webcam() {
  const [lx, ly] = iso(-1.2, 0.4, 0.31);
  const lens = `matrix(${n(COS)} ${SIN} 0 1 ${lx} ${ly})`;
  return (
    <>
      <Slab s={slab(-1.8, -0.4, 1.2, 0.8, 0, 0.62)} />
      <g transform={lens}><circle r="7.5" className="g-iso-lens" /><circle r="3.5" className="g-iso-lens-in" /></g>
      <g className="g-iso-dots"><Dots pts={FACE} r={1.8} /></g>
      <g className="g-iso-brows"><Dots pts={BROWS} r={2.2} /></g>
      <path d={TRACE} className="g-iso-trace" />
    </>
  );
}

function Detectors() {
  const brow = slab(-1.85, -0.85, 1.6, 1.7, 0, 0.3), exhale = slab(0.25, -0.85, 1.6, 1.7, 0, 0.3);
  return (
    <>
      <Slab s={brow} />
      <polygon points={brow.top} className="g-iso-flash g-iso-module-on" />
      <path d={flat((t) => [-1.55 + t, 0.3 - Math.sin(t * Math.PI) * 0.65], 0.3)} className="g-iso-icon" />
      <Slab s={exhale} />
      <polygon points={exhale.top} className="g-iso-lit g-iso-w-s g-iso-module-on" style={at(8.1)} />
      {/* ordinary breaths, then the long gentle fall the detector looks for */}
      <path d={flat((t) => [0.45 + t * 1.2, t < 0.5 ? -0.3 + Math.sin(t * Math.PI * 4) * 0.22 : -0.3 + (t - 0.5) * 1.5], 0.3)} className="g-iso-icon" />
    </>
  );
}

// The first four rows of src/renderer/board/layouts.ts.
const ROWS = [
  ['␣', 'E', 'T', 'A', 'O', '⌫'],
  ['I', 'N', 'S', 'H', 'R', 'D'],
  ['L', 'C', 'U', 'M', 'W', 'F'],
  ['G', 'Y', 'P', 'B', 'V', 'K'],
];
const KEY = 0.84, KZ = 0.02, KH = 0.14, PAD = 0.32, TOP = KZ + KH, BW = LAYERS[3].w, BD = LAYERS[3].d;
const keyX = (c: number) => -BW / 2 + PAD + c, keyY = (r: number) => -BD / 2 + PAD + r;
const keySlab = (r: number, c: number) => slab(keyX(c), keyY(r), KEY, KEY, KZ, KH);
function Letter({ r, c, on }: { r: number; c: number; on?: boolean }) {
  const [x, y] = iso(keyX(c) + KEY / 2, keyY(r) + KEY / 2, TOP);
  return <text transform={`matrix(${n(COS)} ${SIN} ${n(-COS)} ${SIN} ${x} ${y})`} className={on ? 'g-iso-key g-iso-key-on' : 'g-iso-key'} textAnchor="middle" dominantBaseline="central">{ROWS[r][c]}</text>;
}
const rowBand = (r: number) => poly([
  iso(keyX(0) - 0.08, keyY(r) - 0.08, TOP), iso(keyX(5) + KEY + 0.08, keyY(r) - 0.08, TOP),
  iso(keyX(5) + KEY + 0.08, keyY(r) + KEY + 0.08, TOP), iso(keyX(0) - 0.08, keyY(r) + KEY + 0.08, TOP),
]);
// As the real scanner does it: rows until a raise enters row 1, then its keys until a raise picks H.
const SCAN: { t: number; row: number; col?: number }[] = [
  { t: 3.4, row: 0 }, { t: 4, row: 1 },
  { t: 4.6, row: 1, col: 0 }, { t: 5.2, row: 1, col: 1 }, { t: 5.8, row: 1, col: 2 }, { t: 6.4, row: 1, col: 3 },
];
const PICK = { t: 6.9, row: 1, col: 3 };

function Board() {
  return (
    <>
      {ROWS.map((row, r) => row.map((_, c) => (
        <g key={`${r}-${c}`}><Slab s={keySlab(r, c)} /><Letter r={r} c={c} /></g>
      )))}
      {SCAN.map((s) => s.col === undefined ? (
        <polygon key={s.t} points={rowBand(s.row)} className="g-iso-step g-iso-rowlit" style={at(s.t)} />
      ) : (
        <g key={s.t} className="g-iso-step" style={at(s.t)}>
          <polygon points={keySlab(s.row, s.col).top} className="g-iso-keyscan" />
          <Letter r={s.row} c={s.col} on />
        </g>
      ))}
      <g className="g-iso-gold" style={at(PICK.t)}>
        <polygon points={keySlab(PICK.row, PICK.col).top} className="g-iso-keylit" />
        <Letter r={PICK.row} c={PICK.col} on />
      </g>
    </>
  );
}

const RIPPLES = [18, 31, 44];
function Output() {
  const [sx, sy] = iso(-1.3, -0.15, 0.47);
  return (
    <>
      <Slab s={slab(-1.85, -1, 1.1, 0.85, 0, 0.95)} />
      <g transform={`matrix(${n(COS)} ${SIN} 0 1 ${sx} ${sy})`}><circle r="11" className="g-iso-lens" /><circle r="5" className="g-iso-lens-in" /></g>
      <g transform={`matrix(${n(-COS)} ${SIN} 0 1 ${sx} ${sy})`}>
        {RIPPLES.map((r, i) => {
          const dx = n(r * 0.64), dy = n(r * 0.77);
          return <path key={r} d={`M${dx} ${-dy} A${r} ${r} 0 0 1 ${dx} ${dy}`} className="g-iso-ripple" style={at(9.5 + i * 0.16)} />;
        })}
      </g>
      <Slab s={slab(0.25, -1.15, 1.55, 2.2, 0, 0.08)} />
      <Slab s={slab(0.75, -1.3, 0.55, 0.3, 0.08, 0.08)} />
      {[-0.55, -0.15, 0.25, 0.65].map((y, i) => (
        <path key={y} d={line([iso(0.5, y, 0.08), iso(i === 3 ? 1.05 : 1.55, y, 0.08)])} className="g-iso-paper" />
      ))}
    </>
  );
}

const CONTENT = [You, Webcam, Detectors, Board, Output];

export function StackScene() {
  return (
    <svg
      viewBox="0 -14 680 664"
      className="g-iso"
      role="img"
      aria-label="An exploded stack of five layers. From the top: you, with the Glint eyebrow mark; the webcam and SDK; the eyebrow and exhale detectors; the scanning letter board with the key H selected; and speech and clipboard output."
    >
      {/* painted bottom-up, so each plate covers what is behind it */}
      {[4, 3, 2, 1, 0].map((i) => { const C = CONTENT[i]; return <Layer key={i} i={i}><C /></Layer>; })}
    </svg>
  );
}
