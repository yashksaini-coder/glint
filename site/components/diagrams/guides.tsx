// Figures for people using Glint. Each export is usable directly in MDX, e.g. <BoardMapFigure />.
// Every number here comes from the repo; the source is named next to it.
import type { ReactNode } from 'react';
import { Figure } from './kit';

const INK = 'var(--gd-ink)';
const MUTED = 'var(--gd-muted)';
const LINE = 'var(--gd-line)';
const SURFACE = 'var(--gd-surface)';
const SURFACE_2 = 'var(--gd-surface-2)';
const BLUE = 'var(--gd-blue)';
const GOLD = 'var(--gd-gold)';
const GREEN = 'var(--gd-green)';
const RED = 'var(--gd-red)';

function Svg({ h, label, children }: { h: number; label: string; children: ReactNode }) {
  return (
    <svg className="gg" viewBox={`0 0 720 ${h}`} role="img" aria-label={label}>
      {children}
    </svg>
  );
}

/** Stacked text lines. `cls` takes the gg-* classes from diagrams-guides.css. */
function Lines({ x, y, lines, cls, lh = 18, anchor }: { x: number; y: number; lines: string[]; cls?: string; lh?: number; anchor?: 'middle' | 'end' }) {
  return (
    <>
      {lines.map((l, i) => (
        <text key={l} x={x} y={y + i * lh} className={cls} textAnchor={anchor}>
          {l}
        </text>
      ))}
    </>
  );
}

function Arrow({ x1, y1, x2, y2, color = MUTED, dashed, both }: { x1: number; y1: number; x2: number; y2: number; color?: string; dashed?: boolean; both?: boolean }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const head = (x: number, y: number, t: number) => {
    const p = (d: number) => `${x - 9 * Math.cos(t + d)},${y - 9 * Math.sin(t + d)}`;
    return <polygon points={`${x},${y} ${p(0.45)} ${p(-0.45)}`} fill={color} />;
  };
  return (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.5} strokeDasharray={dashed ? '5 4' : undefined} />
      {head(x2, y2, a)}
      {both && head(x1, y1, a + Math.PI)}
    </>
  );
}

// ---- use/setup ---------------------------------------------------------------------------------

function Seat({ x, good }: { x: number; good: boolean }) {
  const body = { fill: SURFACE_2, stroke: INK, strokeWidth: 1.5 };
  return (
    <g transform={`translate(${x} 0)`}>
      <line x1={8} y1={285} x2={345} y2={285} stroke={LINE} strokeWidth={1.5} />
      {/* what the camera sees */}
      <polygon points="324,104 52,54 52,214" fill={BLUE} fillOpacity={0.12} stroke={BLUE} strokeWidth={1} strokeDasharray="5 4" />
      <text x={198} y={122} className="gg-s gg-m" textAnchor="middle">camera view</text>
      {/* chair, person facing right */}
      <path d="M50 150 V240 H128 M58 240 V285 M122 240 V285" fill="none" stroke={MUTED} strokeWidth={2.5} />
      <rect x={86} y={118} width={18} height={20} {...body} />
      <rect x={68} y={130} width={52} height={112} rx={22} {...body} />
      <rect x={96} y={222} width={86} height={22} rx={11} {...body} />
      <rect x={160} y={230} width={22} height={55} rx={10} {...body} />
      <path d="M120 96 L129 107 L120 110" {...body} />
      <circle cx={95} cy={100} r={26} {...body} />
      {good ? (
        <path d="M95 74 A26 26 0 0 1 95 126 Z" fill={GOLD} fillOpacity={0.55} />
      ) : (
        // Hatching, not a dark fill: --gd-ink is light in dark mode, so a fill would read as lit.
        <path d="M100 75 V125 M106 77 V123 M112 80 V120 M118 88 V112" stroke={INK} strokeWidth={1.5} />
      )}
      <circle cx={110} cy={96} r={3} fill={INK} />
      {/* desk and laptop */}
      <rect x={195} y={168} width={150} height={7} {...body} />
      <path d="M206 175 V285 M334 175 V285" stroke={MUTED} strokeWidth={2.5} />
      <rect x={256} y={162} width={62} height={6} {...body} />
      <line x1={316} y1={162} x2={327} y2={100} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <circle cx={324} cy={104} r={5} fill={BLUE} />
      <text x={338} y={90} className="gg-s" textAnchor="end">Camera</text>
      {good ? (
        <>
          <path d="M342 168 V38 H308" fill="none" stroke={MUTED} strokeWidth={2.5} />
          <polygon points="318,34 292,34 282,58 328,58" fill={GOLD} stroke={INK} strokeWidth={1.5} />
          <g stroke={GOLD} strokeWidth={2} strokeDasharray="6 5">
            <line x1={284} y1={62} x2={132} y2={84} />
            <line x1={296} y1={64} x2={134} y2={100} />
            <line x1={308} y1={64} x2={132} y2={116} />
          </g>
          <text x={276} y={47} className="gg-s" textAnchor="end">Lamp or window</text>
        </>
      ) : (
        <>
          <path d="M16 285 V54" fill="none" stroke={MUTED} strokeWidth={2.5} />
          <polygon points="8,44 8,76 36,86 36,36" fill={GOLD} stroke={INK} strokeWidth={1.5} />
          <g stroke={GOLD} strokeWidth={2} strokeDasharray="6 5">
            <line x1={40} y1={60} x2={72} y2={88} />
            <line x1={40} y1={76} x2={66} y2={104} />
          </g>
          <text x={46} y={52} className="gg-s">Lamp or window behind</text>
        </>
      )}
    </g>
  );
}

export function SeatingFigure() {
  return (
    <Figure caption="Side view, not to scale. The only difference between the two is where the light is. The camera needs your face and upper chest in frame, and it must not move.">
      <Svg h={350} label="Two side views of a person seated at a desk facing a laptop camera. On the left a lamp in front lights the face, and the camera view covers the face and upper chest. On the right the light is behind the person, the face is in shadow, and the SDK hint says Increase light on face.">
        <text x={0} y={18} className="gg-h gg-g">Light in front</text>
        <text x={370} y={18} className="gg-h gg-r">Light behind</text>
        <Seat x={0} good />
        <Seat x={370} good={false} />
        <Lines x={0} y={316} lines={['Face lit, upper chest in frame.', 'The SDK can read you.']} cls="gg-s" />
        <Lines x={370} y={316} lines={['Face in shadow.', 'SDK hint: “Increase light on face”.']} cls="gg-s" />
      </Svg>
    </Figure>
  );
}

// ---- use/gestures ------------------------------------------------------------------------------

function Face({ cx, up }: { cx: number; up: boolean }) {
  const cy = 58, brow = cy - (up ? 26 : 14);
  return (
    <g fill="none" stroke={INK} strokeLinecap="round">
      <circle cx={cx} cy={cy} r={38} fill={SURFACE} strokeWidth={1.5} />
      <ellipse cx={cx - 14} cy={cy + 2} rx={5} ry={up ? 6 : 4.5} fill={INK} stroke="none" />
      <ellipse cx={cx + 14} cy={cy + 2} rx={5} ry={up ? 6 : 4.5} fill={INK} stroke="none" />
      <g stroke={up ? BLUE : INK} strokeWidth={4}>
        <path d={`M${cx - 24} ${brow + 3} Q${cx - 15} ${brow - 4} ${cx - 6} ${brow + 1}`} />
        <path d={`M${cx + 24} ${brow + 3} Q${cx + 15} ${brow - 4} ${cx + 6} ${brow + 1}`} />
      </g>
      <path d={`M${cx - 10} ${cy + 20} Q${cx} ${cy + 23} ${cx + 10} ${cy + 20}`} strokeWidth={2} />
    </g>
  );
}

export function BrowRelaxFigure() {
  // brow.ts: fires above baseline +28% once held 200 ms, re-arms only below baseline +10%.
  const y = (pct: number) => 305 - pct * 3.2;
  const peak = y(38);
  const steps: { x: number; up: boolean; at: number; lines: string[]; cls?: string }[] = [
    { x: 135, up: false, at: y(0), lines: ['At rest', 'baseline'] },
    { x: 240, up: true, at: peak, lines: ['Raised', 'select fires'], cls: 'gg-g' },
    { x: 365, up: true, at: peak, lines: ['Still up', 'no second select'], cls: 'gg-r' },
    { x: 505, up: false, at: y(0), lines: ['Relaxed', 'ready again'] },
    { x: 625, up: true, at: peak, lines: ['Raised', 'select fires'], cls: 'gg-g' },
  ];
  return (
    <Figure caption="An illustrated shape, not recorded data. On the test recording one of three raises was missed because the eyebrows stayed at +10.9% to +28.9% after the raise before it, never dropping under the +10% line.">
      <Svg h={330} label="Five faces along a timeline above a curve of eyebrow height. At rest, then raised past the plus 28 percent line, which fires select. Staying up fires nothing more. Dropping under the plus 10 percent line makes it ready, and the next raise fires select again.">
        {steps.map((s) => (
          <g key={s.x}>
            <line x1={s.x} y1={146} x2={s.x} y2={s.at} stroke={LINE} strokeWidth={1.5} />
            <Face cx={s.x} up={s.up} />
            <text x={s.x} y={116} className="gg-b" textAnchor="middle">{s.lines[0]}</text>
            <text x={s.x} y={136} className={`gg-s ${s.cls ?? 'gg-m'}`} textAnchor="middle">{s.lines[1]}</text>
          </g>
        ))}
        <line x1={100} y1={y(28)} x2={715} y2={y(28)} stroke={GOLD} strokeWidth={1.5} strokeDasharray="6 5" />
        <line x1={100} y1={y(10)} x2={715} y2={y(10)} stroke={MUTED} strokeWidth={1.5} strokeDasharray="6 5" />
        <line x1={100} y1={y(0)} x2={715} y2={y(0)} stroke={LINE} strokeWidth={1.5} />
        <Lines x={0} y={y(28) - 3} lines={['+28%', 'select line']} cls="gg-s" lh={16} />
        <Lines x={0} y={y(10) - 3} lines={['+10%', 'relax line']} cls="gg-s" lh={16} />
        <text x={0} y={166} className="gg-s gg-m">Eyebrow height</text>
        <path
          d={`M100 ${y(0)} H180 C200 ${y(0)} 205 ${peak} 230 ${peak} H400 C425 ${peak} 430 ${y(0)} 455 ${y(0)} H560 C575 ${y(0)} 585 ${peak} 605 ${peak} H650 C670 ${peak} 675 ${y(0)} 700 ${y(0)}`}
          fill="none"
          stroke={BLUE}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <circle cx={240} cy={peak} r={6} fill={GREEN} />
        <circle cx={625} cy={peak} r={6} fill={GREEN} />
      </Svg>
    </Figure>
  );
}

type Pt = [number, number]; // seconds, trace units below the peak

function BreathPanel({ x, title, verdict, cls, text, pts, fall, fire, talk }: { x: number; title: string; verdict: string; cls: string; text: string[]; pts: Pt[]; fall: number; fire?: Pt; talk?: boolean }) {
  const px = (t: number) => x + 8 + t * 36;
  const py = (v: number) => 54 - v * 7;
  return (
    <g>
      <text x={x} y={18} className="gg-h">{title}</text>
      <rect x={x} y={34} width={214} height={126} fill={SURFACE} />
      <polyline points={pts.map(([t, v]) => `${px(t)},${py(v)}`).join(' ')} fill="none" stroke={BLUE} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      {fire && (
        <>
          <line x1={px(fire[0])} y1={py(fire[1])} x2={px(fire[0])} y2={176} stroke={GREEN} strokeWidth={1.5} strokeDasharray="4 3" />
          <circle cx={px(fire[0])} cy={py(fire[1])} r={6} fill={GREEN} />
          <text x={px(fire[0]) + 10} y={py(fire[1]) - 8} className="gg-s gg-g">fires</text>
        </>
      )}
      {/* the 2.5 s minimum, drawn from where the fall starts */}
      <rect x={px(fall)} y={174} width={2.5 * 36} height={6} fill={GOLD} />
      <text x={px(fall) + 45} y={198} className="gg-s" textAnchor="middle">2.5 s minimum</text>
      {talk && (
        <>
          <rect x={px(0.2)} y={142} width={5.3 * 36} height={8} fill={RED} fillOpacity={0.6} />
          <text x={px(5.5)} y={136} className="gg-s" textAnchor="end">talking detected</text>
        </>
      )}
      <text x={x} y={226} className={`gg-b ${cls}`}>{verdict}</text>
      <Lines x={x} y={246} lines={text} cls="gg-s" />
    </g>
  );
}

export function BreathShapesFigure() {
  // exhale.ts: fall >= 6 units for >= 2500 ms at <= 5 units/s, and not talking.
  return (
    <Figure caption="Illustrated shapes on one shared scale, not recorded data. The 2.5 s limit is the detector's. On the test recording, cued slow exhales fell for 2.9 to 6.1 s, while natural breaths and speech fell for 2.4 s or less.">
      <Svg h={280} label="Three breathing traces on the same scale, each with a 2.5 second bar under it. A slow breath out falls gently for longer than the bar and fires. A normal breath falls for less than the bar and does not fire. Speech falls steeply in short drops while talking is detected and does not fire.">
        <BreathPanel
          x={0}
          title="Slow breath out"
          verdict="Counts"
          cls="gg-g"
          text={['Falls for at least 2.5 s,', 'gently.']}
          pts={[[0, -5], [0.4, -1.2], [0.7, 0], [1, -0.4], [1.3, -1.2], [2, -3.3], [3.8, -8.7], [4.4, -10.5], [4.8, -11.2], [5.1, -10.8], [5.5, -8.5]]}
          fall={1.23}
          fire={[3.73, -8.5]}
        />
        <BreathPanel
          x={253}
          title="Normal breath"
          verdict="Too short"
          cls="gg-r"
          text={['Turns back up before', 'the 2.5 s are over.']}
          pts={[[0, -3], [0.5, -0.6], [0.8, 0], [1.1, -0.5], [1.4, -1.5], [2.8, -5], [3.1, -5.4], [3.4, -4.9], [4.5, -1], [4.9, -0.2], [5.2, -0.4], [5.5, -1.2]]}
          fall={1.25}
        />
        <BreathPanel
          x={506}
          title="Speech"
          verdict="Too steep"
          cls="gg-r"
          text={['Short, fast drops. Talking', 'also blocks the gesture.']}
          pts={[[0, -2], [0.3, 0], [0.5, -0.5], [1.6, -8.6], [1.8, -9], [2.1, -7], [2.5, -1.5], [2.7, -1], [3.6, -8], [3.8, -8.3], [4.1, -6], [4.5, -1], [4.7, -0.8], [5.5, -6.8]]}
          fall={0.6}
          talk
        />
      </Svg>
    </Figure>
  );
}

// ---- use/board ---------------------------------------------------------------------------------

// Copied from src/renderer/board/layouts.ts and DEFAULT_PHRASES in src/shared/settings.ts, because
// site/ builds on its own. The ↩ on the end of each row is added by the scanner.
const DEL = '⌫';
const BACK = '↩';
const PHRASES = [['Yes'], ['No'], ['I need', 'water'], ['I need', 'help'], ['Thank', 'you'], ['Please', 'wait']];
const LETTERS = ['␣ E T A O ⌫', 'I N S H R D', 'L C U M W F', 'G Y P B V K', 'J X Q Z . ?'].map((r) => r.split(' '));
const MOST_MOVES = 11;

function Key({ r, c, label }: { r: number; c: number; label: string[] }) {
  const x = 112 + c * 86;
  const y = r === 0 ? 8 : 74 + (r - 1) * 58;
  const moves = r + c; // rows are stepped through first, then the keys of the row
  const key = label[0];
  const outline = key === DEL ? GOLD : key === BACK ? RED : LINE;
  return (
    <g>
      <rect x={x} y={y} width={82} height={54} fill={BLUE} fillOpacity={0.04 + 0.36 * (1 - moves / MOST_MOVES)} stroke={outline} strokeWidth={outline === LINE ? 1 : 2.5} />
      {r === 0 && c < 6 ? (
        <Lines x={x + 34} y={label.length === 2 ? y + 25 : y + 33} lines={label} cls="gg-s gg-b" lh={16} anchor="middle" />
      ) : (
        <text x={x + 38} y={y + 36} className="gg-k" textAnchor="middle">{key}</text>
      )}
      <text x={x + 76} y={y + 17} className="gg-s" textAnchor="end">{moves}</text>
    </g>
  );
}

export function BoardMapFigure() {
  const rows = [PHRASES, ...LETTERS.map((row) => row.map((k) => [k]))];
  return (
    <Figure caption="The default board, drawn as a map. The number on each key is how many times the highlight has to move to reach it from the top of the board: row number plus position in the row. At the default speed each move takes 1 second, and you also make two selects. With the phrase row removed, every letter is one move closer.">
      <Svg h={430} label="Map of the board. The top row holds six phrases, costing 0 to 5 highlight moves. Five rows of letters follow, most common first, from space at 1 move and E at 2 to the question mark at 10. Delete is at the end of the first letter row and costs 6 moves. Every row ends in a back key.">
        <text x={0} y={32} className="gg-b">Phrases</text>
        <text x={0} y={50} className="gg-s gg-m">speak at once</text>
        <path d="M100 76 H106 V358 H100" fill="none" stroke={MUTED} strokeWidth={1.5} />
        <text x={0} y={206} className="gg-b">Letters</text>
        <Lines x={0} y={224} lines={['most common', 'first']} cls="gg-s gg-m" lh={16} />
        {rows.map((row, r) => [...row, [BACK]].map((label, c) => <Key key={`${r}-${c}`} r={r} c={c} label={label} />))}

        <rect x={0} y={382} width={34} height={34} fill="none" stroke={GOLD} strokeWidth={2.5} />
        <text x={17} y={405} className="gg-k" textAnchor="middle">{DEL}</text>
        <Lines x={44} y={396} lines={['Delete: removes the', 'last character']} cls="gg-s" lh={16} />

        <rect x={230} y={382} width={34} height={34} fill="none" stroke={RED} strokeWidth={2.5} />
        <text x={247} y={405} className="gg-k" textAnchor="middle">{BACK}</text>
        <Lines x={274} y={396} lines={['Back: leaves the row', 'without typing']} cls="gg-s" lh={16} />

        {[0, 3, 7, 11].map((m, i) => (
          <rect key={m} x={470 + i * 60.5} y={382} width={60.5} height={16} fill={BLUE} fillOpacity={0.04 + 0.36 * (1 - m / MOST_MOVES)} stroke={LINE} />
        ))}
        <text x={470} y={416} className="gg-s gg-m">fewer moves</text>
        <text x={712} y={416} className="gg-s gg-m" textAnchor="end">more moves</text>
      </Svg>
    </Figure>
  );
}

// ---- use/settings ------------------------------------------------------------------------------

export function ScanSpeedFigure() {
  // dwellMs range is 500-3000 (sanitize in settings.ts). E is 2 moves, Z is 8 (see BoardMapFigure).
  const speeds = [
    { s: 0.5, name: '0.5 s' },
    { s: 1, name: '1 s (default)' },
    { s: 2, name: '2 s' },
    { s: 3, name: '3 s' },
  ];
  const w = 22;
  return (
    <Figure caption="Time for the highlight to reach E (2 moves) and Z (8 moves) from the top of the board with the default phrase row. Your own eyebrow raises add to this.">
      <Svg h={214} label="Bars comparing the time to reach E and Z at each scan speed. At 0.5 seconds, 1 and 4 seconds. At 1 second, 2 and 8 seconds. At 2 seconds, 4 and 16 seconds. At 3 seconds, 6 and 24 seconds.">
        <text x={0} y={16} className="gg-s gg-m">Scan speed</text>
        <text x={120} y={16} className="gg-s gg-m">Seconds until the highlight reaches the key</text>
        {speeds.map(({ s, name }, i) => {
          const y = 34 + i * 45;
          return (
            <g key={s}>
              <text x={0} y={y + 22} className="gg-b">{name}</text>
              <rect x={120} y={y} width={2 * s * w} height={16} fill={BLUE} />
              <text x={126 + 2 * s * w} y={y + 13} className="gg-s">E: {2 * s} s</text>
              <rect x={120} y={y + 18} width={8 * s * w} height={16} fill={GOLD} />
              <text x={126 + 8 * s * w} y={y + 31} className="gg-s">Z: {8 * s} s</text>
            </g>
          );
        })}
      </Svg>
    </Figure>
  );
}

// ---- privacy -----------------------------------------------------------------------------------

function Node({ x, y, w, h, title, text, tint }: { x: number; y: number; w: number; h: number; title: string; text: string[]; tint?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={tint ?? SURFACE} fillOpacity={tint ? 0.14 : 1} stroke={tint ?? LINE} strokeWidth={1.5} />
      <text x={x + 10} y={y + 22} className="gg-b">{title}</text>
      <Lines x={x + 10} y={y + 41} lines={text} cls="gg-s gg-m" lh={17} />
    </g>
  );
}

export function PrivacyFlowFigure() {
  return (
    <Figure caption="Everything inside the dashed line stays on your computer. Presage states that all metric computation runs on the device. The arrows crossing the line are the SDK contacts described on this page. Glint itself makes no other network requests.">
      <Svg h={462} label="Data flow. Inside your computer: the camera sends video to the SDK, which holds it in memory and produces numbers, which feed the detectors and on-screen traces, then your text, then the clipboard and speech. Only settings.json is saved. Crossing to Presage servers are an API key and subscription check and a model download. A third path, telemetry, is off by default.">
        <rect x={2} y={2} width={430} height={458} fill="none" stroke={INK} strokeWidth={1.5} strokeDasharray="7 5" />
        <text x={16} y={28} className="gg-h">Your computer</text>

        <Node x={16} y={70} w={150} h={70} title="Camera" text={['Only after you agree']} />
        <Node x={248} y={46} w={170} h={124} title="Presage SDK" text={['Processes video in', 'memory. Glint never', 'saves or sends it.']} tint={BLUE} />
        <Arrow x1={166} y1={105} x2={246} y2={105} />
        <text x={206} y={97} className="gg-s" textAnchor="middle">video</text>

        <Node x={248} y={204} w={170} h={86} title="Signals" text={['Landmarks, breathing,', 'pulse. Held in memory.']} />
        <Arrow x1={333} y1={170} x2={333} y2={202} />
        <text x={342} y={191} className="gg-s">numbers</text>

        <Node x={16} y={204} w={170} h={86} title="Detectors" text={['And the on-screen', 'traces. Not saved.']} />
        <Arrow x1={248} y1={247} x2={188} y2={247} />

        <Node x={16} y={316} w={170} h={70} title="What you type" text={['Not saved.']} />
        <Arrow x1={101} y1={290} x2={101} y2={314} />

        <Node x={248} y={316} w={170} h={70} title="Clipboard, speech" text={['Other apps can read', 'the clipboard.']} />
        <Arrow x1={186} y1={351} x2={246} y2={351} />

        <rect x={16} y={404} width={402} height={44} fill={GREEN} fillOpacity={0.14} stroke={GREEN} strokeWidth={1.5} />
        <text x={26} y={423} className="gg-b">settings.json: the only thing saved</text>
        <text x={26} y={440} className="gg-s gg-m">Scan speed, phrases, telemetry choice</text>

        <rect x={560} y={46} width={156} height={124} fill={SURFACE} stroke={LINE} strokeWidth={1.5} />
        <Lines x={638} y={100} lines={['Presage', 'servers']} cls="gg-h" lh={20} anchor="middle" />

        <text x={490} y={64} className="gg-s" textAnchor="middle">Key check</text>
        <Arrow x1={420} y1={72} x2={558} y2={72} color={BLUE} both />
        <text x={490} y={101} className="gg-s" textAnchor="middle">Models</text>
        <Arrow x1={558} y1={109} x2={420} y2={109} color={BLUE} />
        <text x={490} y={136} className="gg-s gg-m" textAnchor="middle">Telemetry: off</text>
        <line x1={420} y1={152} x2={468} y2={152} stroke={MUTED} strokeWidth={1.5} strokeDasharray="5 4" />
        <line x1={512} y1={152} x2={558} y2={152} stroke={MUTED} strokeWidth={1.5} strokeDasharray="5 4" />
        <rect x={470} y={144} width={40} height={16} rx={8} fill={SURFACE_2} stroke={MUTED} strokeWidth={1.5} />
        <circle cx={479} cy={152} r={5} fill={MUTED} />

        <text x={452} y={210} className="gg-b">Only if you turn telemetry on</text>
        <Lines
          x={452}
          y={232}
          lines={['Session summaries and device', 'readiness reports go to Presage.', 'No video frames, no measured', 'vitals. Not anonymous: they can', 'be linked to the account that', 'owns the API key.']}
          cls="gg-s"
        />
        <text x={452} y={364} className="gg-b">Glint itself</text>
        <Lines x={452} y={386} lines={['Makes no other network', 'requests. No analytics, no', 'account, no AI service.']} cls="gg-s" />
      </Svg>
    </Figure>
  );
}

// ---- scope -------------------------------------------------------------------------------------

const SCOPE: { head: string; cls: string; color: string; items: [string[], string[]][] }[] = [
  {
    head: 'Tested',
    cls: 'gg-g',
    color: GREEN,
    items: [
      [['Board, scanner,', 'settings'], ['Unit and end-to-end', 'tests']],
      [['Linux build'], ['Unpacked build: CI', 'smoke test. AppImage:', 'run locally only']],
    ],
  },
  {
    head: 'Partly tested',
    cls: '',
    color: GOLD,
    items: [
      [['Eyebrow and', 'exhale detectors'], ['One recording of', 'one person']],
      [['SDK signals on a', 'live camera'], ['In an early prototype']],
    ],
  },
  {
    head: 'Not tested',
    cls: 'gg-r',
    color: RED,
    items: [
      [['Finished app on', 'a real camera'], ['Simulated camera', 'only']],
      [['Use by disabled', 'people'], ['Nobody who needs it', 'has tried Glint']],
      [['Windows installer'], ['Builds in CI, never', 'installed or run']],
    ],
  },
  {
    head: 'Not built',
    cls: 'gg-m',
    color: MUTED,
    items: [
      [['macOS build'], ['No packaging']],
      [['Calibration'], ['Same thresholds', 'for everyone']],
      [['Word prediction'], []],
    ],
  },
];

export function ScopeFigure() {
  return (
    <Figure caption="Version 0.1 at a glance. The table below has the detail for each item.">
      <Svg h={376} label="Four columns. Tested: board, scanner and settings, and the Linux build in replay mode, smoke-tested unpacked in CI with the AppImage run only locally. Partly tested: the eyebrow and exhale detectors on one recording, and SDK signals in an early prototype. Not tested: the finished app on a real camera, use by disabled people, and the Windows installer. Not built: macOS build, calibration, word prediction.">
        {SCOPE.map((col, i) => {
          const x = i * 182;
          return (
            <g key={col.head}>
              <rect x={x} y={0} width={174} height={5} fill={col.color} />
              <text x={x} y={30} className={`gg-h ${col.cls}`}>{col.head}</text>
              {col.items.map(([title, note], j) => {
                const y = 44 + j * 110;
                return (
                  <g key={title[0]}>
                    <rect x={x} y={y} width={174} height={102} fill={SURFACE} />
                    <Lines x={x + 10} y={y + 23} lines={title} cls="gg-b" />
                    <Lines x={x + 10} y={y + 23 + title.length * 18 + 4} lines={note} cls="gg-s gg-m" lh={17} />
                  </g>
                );
              })}
            </g>
          );
        })}
      </Svg>
    </Figure>
  );
}

// ---- use/troubleshooting -----------------------------------------------------------------------

const CHECKS: { q: string[]; exit: 'Yes' | 'No'; fix: string[] }[] = [
  { q: ['Is a Paused bar showing?'], exit: 'Yes', fix: ['Fix what the bar says.', 'Scanning resumes by itself.'] },
  { q: ['When you raise your eyebrows, does the', 'Eyebrows trace cross the dashed line?'], exit: 'No', fix: ['Raise higher, or put', 'more light on your face.'] },
  { q: ['Did your eyebrows drop fully', 'after the last select?'], exit: 'No', fix: ['Relax completely.', 'One raise selects only once.'] },
];

export function NotRespondingFlow() {
  return (
    <Figure caption="Work down from the top. Pressing Space selects without using the camera, so it is a quick way to tell a tracking problem from anything else.">
      <Svg h={372} label="Decision flow for a board that is not responding. If a Paused bar is showing, fix what it says. If the Eyebrows trace does not cross the dashed line, raise higher or add light. If your eyebrows did not drop fully after the last select, relax completely. Otherwise press Stop and start a new session.">
        {CHECKS.map(({ q, exit, fix }, i) => {
          const y = 4 + i * 94;
          const next = exit === 'Yes' ? 'No' : 'Yes';
          return (
            <g key={q[0]}>
              <rect x={2} y={y} width={390} height={64} fill={SURFACE} stroke={LINE} strokeWidth={1.5} />
              <Lines x={197} y={q.length === 2 ? y + 28 : y + 37} lines={q} anchor="middle" />
              <Arrow x1={392} y1={y + 32} x2={478} y2={y + 32} />
              <text x={434} y={y + 24} className="gg-s gg-b" textAnchor="middle">{exit}</text>
              <rect x={480} y={y} width={238} height={64} fill={GREEN} fillOpacity={0.14} stroke={GREEN} strokeWidth={1.5} />
              <Lines x={599} y={y + 28} lines={fix} cls="gg-s" anchor="middle" />
              <Arrow x1={197} y1={y + 64} x2={197} y2={y + 92} />
              <text x={207} y={y + 83} className="gg-s gg-b">{next}</text>
            </g>
          );
        })}
        <rect x={2} y={286} width={390} height={80} fill={BLUE} fillOpacity={0.14} stroke={BLUE} strokeWidth={1.5} />
        <Lines x={197} y={320} lines={['Press Stop and start again.', 'A new session resets the eyebrow baseline.']} anchor="middle" />
      </Svg>
    </Figure>
  );
}

// ---- installation ------------------------------------------------------------------------------

export function KeyLookupFigure() {
  // src/main/index.ts: environment first, then .env in the app path, then .env in userData.
  const places = [
    { n: '1', title: 'Environment', text: ['PRESAGE_API_KEY', 'set in your shell'] },
    { n: '2', title: '.env by the sources', text: ['Used when you run', 'npm start'] },
    { n: '3', title: '.env in the data folder', text: ['Used by an', 'installed app'] },
  ];
  return (
    <Figure caption="Glint stops at the first place that has the key. If none does, the camera will not start and you see “No Presage API key”.">
      <Svg h={110} label="Three places Glint looks for the API key, in order: the environment, a .env file by the sources, and a .env file in the app's data folder. It moves to the next only if the key is not set.">
        {places.map((p, i) => {
          const x = 2 + i * 256;
          return (
            <g key={p.n}>
              <Node x={x} y={6} w={204} h={96} title={`${p.n}. ${p.title}`} text={p.text} />
              {i < 2 && (
                <>
                  <Arrow x1={x + 204} y1={54} x2={x + 254} y2={54} />
                  <Lines x={x + 228} y={30} lines={['not', 'set']} cls="gg-s gg-m" lh={14} anchor="middle" />
                </>
              )}
            </g>
          );
        })}
      </Svg>
    </Figure>
  );
}
