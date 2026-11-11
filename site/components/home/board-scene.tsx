// An isometric Glint board, drawn in code. The highlight really scans: rows, then keys, then a select,
// which lifts the eyebrow. Pure SVG and CSS, so it needs no JavaScript, and it holds a single still
// frame under prefers-reduced-motion.

const ROWS = [
  ['␣', 'E', 'T', 'A', 'O', '⌫'],
  ['I', 'N', 'S', 'H', 'R', 'D'],
  ['L', 'C', 'U', 'M', 'W', 'F'],
  ['G', 'Y', 'P', 'B', 'V', 'K'],
];
const COS = Math.cos(Math.PI / 6), SIN = 0.5, U = 46, OX = 268, OY = 196;
const n = (v: number) => Math.round(v * 100) / 100;
const iso = (x: number, y: number, z = 0): [number, number] => [n(OX + (x - y) * COS * U), n(OY + (x + y) * SIN * U - z * U)];
const poly = (pts: [number, number][]) => pts.map((p) => p.join(',')).join(' ');

function slab(x: number, y: number, w: number, d: number, z: number, h: number) {
  const top: [number, number][] = [iso(x, y, z + h), iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x, y + d, z + h)];
  const left: [number, number][] = [iso(x, y + d, z + h), iso(x + w, y + d, z + h), iso(x + w, y + d, z), iso(x, y + d, z)];
  const right: [number, number][] = [iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x + w, y + d, z), iso(x + w, y, z)];
  return { top: poly(top), left: poly(left), right: poly(right) };
}

function Slab({ s, className }: { s: ReturnType<typeof slab>; className?: string }) {
  return (
    <g className={className}>
      <polygon points={s.left} className="g-iso-dark" />
      <polygon points={s.right} className="g-iso-mid" />
      <polygon points={s.top} className="g-iso-top" />
    </g>
  );
}

const KEY = 0.84, GAP = 1, KZ = 0.1, KH = 0.14, PAD = 0.32;
const keyAt = (r: number, c: number) => slab(c * GAP + PAD, r * GAP + PAD, KEY, KEY, KZ, KH);

// The scan: one step per second over a 12 second loop. Picks "H", then "E".
type Step = { row: number; col?: number };
const STEPS: Step[] = [
  { row: 0 }, { row: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 },
  { row: 0 }, { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1 }, { row: 2 }, { row: 3 },
];
const SELECTS = [5, 8]; // steps where the eyebrow rises and a letter is typed
const STILL = 5;

function letterMatrix(r: number, c: number) {
  const [x, y] = iso(c * GAP + PAD + KEY / 2, r * GAP + PAD + KEY / 2, KZ + KH);
  return `matrix(${n(COS)} ${SIN} ${n(-COS)} ${SIN} ${x} ${y})`;
}

export function BoardScene() {
  const W = ROWS[0].length, D = ROWS.length;
  const plate = slab(0, 0, W * GAP + PAD * 2 - (GAP - KEY), D * GAP + PAD * 2 - (GAP - KEY), -0.2, 0.2);
  const label = (y: number, num: string, title: string, sub: string) => (
    <g transform={`translate(574 ${y})`}>
      <circle r="2.5" className="g-iso-dot" />
      <line x1="4" x2="26" className="g-iso-lead" />
      <text x="32" y="-3" className="g-iso-label"><tspan className="g-iso-num">{num}</tspan>{'  '}{title}</text>
      <text x="32" y="13" className="g-iso-sub">{sub}</text>
    </g>
  );
  const breath = Array.from({ length: 61 }, (_, i) => {
    const t = i / 60;
    return `${i ? 'L' : 'M'}${n(66 + t * 372)} ${n(66 + Math.sin(t * Math.PI * 4) * 15)}`;
  }).join(' ');

  return (
    <svg viewBox="40 10 740 490" className="g-iso" role="img" aria-label="An isometric keyboard. A highlight moves across it, and a raised eyebrow selects a key.">
      <path d={breath} className="g-iso-breath" />
      <text x="66" y="28" className="g-iso-eyebrow">Breath</text>

      <g className="g-iso-brow">
        <path d="M204 150 Q268 92 332 150" className="g-iso-arc" />
      </g>

      <Slab s={plate} />
      {ROWS.map((row, r) => row.map((k, c) => (
        <g key={`${r}-${c}`}>
          <Slab s={keyAt(r, c)} />
          <text transform={letterMatrix(r, c)} className="g-iso-key" textAnchor="middle" dominantBaseline="central">{k}</text>
        </g>
      )))}

      {STEPS.map((s, i) => {
        const delay = { animationDelay: `${i}s` };
        const still = i === STILL ? ' g-iso-still' : '';
        return s.col === undefined ? (
          <polygon
            key={i}
            style={delay}
            className={`g-iso-step g-iso-rowlit${still}`}
            points={poly([iso(PAD - 0.08, s.row + PAD - 0.08, KZ + KH), iso(W - 0.08 + PAD - (GAP - KEY), s.row + PAD - 0.08, KZ + KH), iso(W - 0.08 + PAD - (GAP - KEY), s.row + PAD + KEY + 0.08, KZ + KH), iso(PAD - 0.08, s.row + PAD + KEY + 0.08, KZ + KH)])}
          />
        ) : (
          <g key={i} style={delay} className={`g-iso-step${still}`}>
            <polygon points={keyAt(s.row, s.col).top} className="g-iso-keylit" />
            <text transform={letterMatrix(s.row, s.col)} className="g-iso-key g-iso-key-on" textAnchor="middle" dominantBaseline="central">{ROWS[s.row][s.col]}</text>
          </g>
        );
      })}

      {SELECTS.map((i) => <circle key={i} cx="268" cy="118" r="7" className="g-iso-step g-iso-flash" style={{ animationDelay: `${i}s` }} />)}

      {label(66, '01', 'BREATHE OUT', 'Speaks the sentence')}
      {label(128, '02', 'RAISE EYEBROWS', 'Selects what is lit')}
      {label(262, '03', 'THE BOARD', 'Scans by itself')}
      {label(410, '04', 'ON THIS DEVICE', 'Video never leaves')}
    </svg>
  );
}
