// Architecture-style figures for the docs. Each export is usable directly in MDX, e.g. <ScreenStates />.
// Every label here is a claim about the repo: check the source named in the comment before changing one.
import type { ReactNode } from 'react';
import { Figure } from './kit';

type Pt = [number, number];

function T({ x, y, c, a, children }: { x: number; y: number; c?: string; a?: 'middle' | 'end'; children: ReactNode }) {
  return <text x={x} y={y} className={c ? `gcp-t ${c}` : 'gcp-t'} textAnchor={a}>{children}</text>;
}

function Box({ x, y, w, h, c = 'gcp-box' }: { x: number; y: number; w: number; h: number; c?: string }) {
  return <rect x={x} y={y} width={w} height={h} className={c} />;
}

/** Orthogonal arrow through `p`; `both` adds a head at the start too. Colour comes from a gcp-* class. */
function Arrow({ p, c = 'gcp-ink', both, dash }: { p: Pt[]; c?: string; both?: boolean; dash?: boolean }) {
  const head = ([x, y]: Pt, [fx, fy]: Pt) => {
    const a = Math.atan2(y - fy, x - fx), l = 9, s = 0.45;
    const q = (d: number) => `${x - l * Math.cos(a + d)},${y - l * Math.sin(a + d)}`;
    return <polygon points={`${x},${y} ${q(s)} ${q(-s)}`} />;
  };
  return (
    <g className={`gcp-arrow ${c}`}>
      <polyline points={p.map((q) => q.join(',')).join(' ')} strokeDasharray={dash ? '5 4' : undefined} />
      {head(p.at(-1)!, p.at(-2)!)}
      {both && head(p[0], p[1])}
    </g>
  );
}

/** Title plus muted sub-lines, centred in a box. */
function Node({ x, y, w, h, title, sub = [], mono, c }: { x: number; y: number; w: number; h: number; title: string; sub?: string[]; mono?: boolean; c?: string }) {
  const top = y + h / 2 - (sub.length * 18) / 2 + 5;
  return (
    <g>
      <Box x={x} y={y} w={w} h={h} c={c} />
      <T x={x + w / 2} y={top} a="middle" c={mono ? 'gcp-mono' : 'gcp-b'}>{title}</T>
      {sub.map((s, i) => <T key={s} x={x + w / 2} y={top + 18 * (i + 1)} a="middle" c="gcp-muted">{s}</T>)}
    </g>
  );
}

// src/renderer/gestures/extract.ts, app.ts onSample(), onValidation(), schedule(), select(), commit()
export function Pipeline() {
  const sig: [number, string, string[]][] = [
    [62, 'Landmarks', ['brow ratio']],
    [126, 'Breathing trace', []],
    [186, 'Talking', []],
    [246, 'Pulse rate', []],
    [306, 'Validation', ['OK, or a hint']],
  ];
  return (
    <Figure caption="From a frame to speech. Only the brow ratio, the breathing trace and talking make decisions. Pulse is only shown, and failing validation only pauses the board.">
      <svg viewBox="0 0 720 344" role="img" aria-label="Pipeline. Webcam frames go into the SmartSpectra SDK, which sends landmarks, the breathing trace, talking, pulse rate and validation to the renderer. The brow ratio from the landmarks feeds browDetector, which drives the scanner. The breathing trace and talking feed exhaleDetector, which speaks and copies the text. The phrase row speaks at once. Pulse is shown on screen only. Failing validation pauses scanning, selecting and speaking.">
        <T x={16} y={24} c="gcp-muted">camera</T>
        <T x={136} y={24} c="gcp-muted">SDK</T>
        <T x={286} y={24} c="gcp-muted">renderer receives</T>
        <T x={470} y={24} c="gcp-muted">decides</T>
        <T x={612} y={24} c="gcp-muted">output</T>

        <Node x={16} y={160} w={84} h={48} title="Webcam" />
        <Arrow p={[[100, 184], [136, 184]]} />
        <Node x={136} y={38} w={120} h={292} title="SmartSpectra" sub={['SDK', 'frames to', 'metrics']} />

        {sig.map(([y, title, sub]) => (
          <g key={title}>
            <Arrow p={[[256, y], [286, y]]} />
            <Node x={286} y={y - 24} w={150} h={48} title={title} sub={sub} />
          </g>
        ))}

        <Arrow p={[[436, 62], [470, 62]]} c="gcp-blue" />
        <Node x={470} y={40} w={120} h={44} title="browDetector" mono />
        <Arrow p={[[590, 62], [612, 62]]} c="gcp-blue" />
        <Node x={612} y={40} w={98} h={44} title="scanner" mono />

        <Arrow p={[[436, 126], [470, 126]]} c="gcp-gold" />
        <Arrow p={[[436, 186], [470, 186]]} c="gcp-gold" />
        <Node x={470} y={104} w={120} h={104} title="exhaleDetector" mono sub={['talking blocks it']} />
        <Arrow p={[[590, 156], [612, 156]]} c="gcp-gold" />
        <Node x={612} y={130} w={98} h={52} title="Speak" sub={['and copy']} />
        <Arrow p={[[661, 84], [661, 130]]} c="gcp-blue" />
        <T x={654} y={112} a="end" c="gcp-muted">phrases</T>

        <Arrow p={[[436, 246], [470, 246]]} c="gcp-muted" dash />
        <Node x={470} y={222} w={240} h={48} title="On screen only" sub={['never used for decisions']} />
        <Arrow p={[[436, 306], [470, 306]]} c="gcp-red" />
        <Node x={470} y={282} w={240} h={48} title="Not OK: the board pauses" sub={['no scanning, select or speech']} />
      </svg>
    </Figure>
  );
}

// src/main/index.ts, src/preload/index.ts, @smartspectra/node-sdk/{preload,main}, docs/privacy.mdx
export function ProcessBoundaries() {
  return (
    <Figure caption="The preload shares the renderer's process but not its JavaScript world. Only named functions and one SDK message port reach the main process.">
      <svg viewBox="0 0 720 600" role="img" aria-label="Trust boundaries. The renderer process holds a sandboxed page and an isolated preload. Glint's window.glint functions, including two dev-recording channels the app does not use, and the SDK's message port cross IPC into the main process, which owns the disk, clipboard and speech and loads the native runtime through koffi. Only the native side contacts Presage's servers.">
        <Box x={10} y={10} w={700} h={212} c="gcp-zone" />
        <T x={24} y={33} c="gcp-b">Renderer process</T>
        <T x={696} y={33} a="end" c="gcp-mono gcp-muted">sandbox: true</T>
        <Node x={30} y={46} w={315} h={60} title="Page: screens, detectors, scanner" sub={['no Node, no file access']} />
        <Node x={375} y={46} w={315} h={60} title="SDK renderer module" sub={['camera stream; API key in memory']} />
        <line x1={24} y1={127} x2={696} y2={127} className="gcp-boundary gcp-gold" />
        <T x={360} y={121} a="middle" c="gcp-mono gcp-muted">contextIsolation: true</T>
        <Arrow p={[[187, 106], [187, 148]]} both />
        <Arrow p={[[532, 106], [532, 148]]} both />
        <Node x={30} y={148} w={315} h={60} title="window.glint" mono sub={['contextBridge: named functions only']} />
        <Node x={375} y={148} w={315} h={60} title="__smartspectraBridge" mono sub={["holds the SDK's MessagePort"]} />

        <line x1={10} y1={243} x2={710} y2={243} className="gcp-boundary gcp-red" />
        <T x={704} y={237} a="end" c="gcp-b">Process boundary: IPC</T>
        <Arrow p={[[140, 208], [140, 348]]} both />
        <Arrow p={[[405, 208], [405, 348]]} both />
        <T x={154} y={256}>apiKey, settings, copy,</T>
        <T x={154} y={272}>speak, replay</T>
        <T x={154} y={288} c="gcp-muted">record, frame: unused dev tool</T>
        <T x={154} y={304} c="gcp-muted">each one a fixed channel</T>
        <T x={419} y={266}>to main: frames, start, stop</T>
        <T x={419} y={284}>to page: metrics, validation,</T>
        <T x={419} y={302}>errors</T>

        <Box x={10} y={312} w={700} h={186} c="gcp-zone" />
        <T x={24} y={335} c="gcp-b">Main process</T>
        <T x={696} y={335} a="end" c="gcp-muted">full Node access</T>
        <Box x={30} y={348} w={315} h={136} />
        <T x={46} y={372} c="gcp-mono">ipcMain handlers</T>
        <T x={46} y={396} c="gcp-muted">settings sanitized in and out</T>
        <T x={46} y={416} c="gcp-muted">replay reads one fixed path</T>
        <T x={46} y={436} c="gcp-muted">espeak-ng with an args array, no shell</T>
        <T x={46} y={456} c="gcp-muted">permissions: camera, own page only</T>
        <Node x={375} y={348} w={315} h={52} title="bindSmartSpectraIpc" mono sub={['clamps every payload']} />
        <Arrow p={[[532, 400], [532, 432]]} both />
        <T x={544} y={421} c="gcp-mono gcp-muted">koffi FFI</T>
        <Node x={375} y={432} w={315} h={52} title="Native runtime" sub={['libsmartspectra_capi: frames to metrics']} />

        <Arrow p={[[187, 484], [187, 538]]} both />
        <Arrow p={[[532, 484], [532, 538]]} both />
        <Node x={30} y={538} w={315} h={54} title="This computer" sub={['settings.json, clipboard, espeak-ng']} />
        <Node x={375} y={538} w={315} h={54} title="Presage servers" sub={['key check, models; telemetry only if on']} c="gcp-box gcp-outside" />
      </svg>
    </Figure>
  );
}

// src/renderer/app.ts: start(), stop(), maybeReady(), onValidation(), the keydown handler
export function ScreenStates() {
  return (
    <Figure caption="Every path back to consent goes through stop(), which releases the camera. Esc only works on the board. Failing validation pauses the board without leaving it.">
      <svg viewBox="0 0 720 262" role="img" aria-label="State machine with three screens. Consent goes to setup on Start camera, and straight to board on Try a recorded session. Setup goes to board once the face has been OK for 1.5 seconds and more than 30 brow samples have arrived. Stop, a failed start or a fatal SDK error return setup to consent; Stop, Esc or a fatal SDK error return board to consent. A missing key or bad recording stays on consent. Failing validation pauses the board.">
        <Arrow p={[[115, 92], [115, 32], [600, 32], [600, 92]]} c="gcp-gold" />
        <T x={358} y={24} a="middle">Try a recorded session</T>
        <Arrow p={[[650, 92], [650, 66], [688, 66], [688, 92]]} c="gcp-muted" dash />
        <T x={712} y={44} a="end" c="gcp-muted">validation fails:</T>
        <T x={712} y={60} a="end" c="gcp-muted">paused</T>

        <Node x={20} y={92} w={130} h={60} title="consent" sub={['camera off']} />
        <Node x={295} y={92} w={130} h={60} title="setup" sub={['camera on']} />
        <Node x={570} y={92} w={130} h={60} title="board" sub={['camera or replay']} />

        <Arrow p={[[150, 122], [295, 122]]} c="gcp-blue" />
        <T x={222} y={113} a="middle">Start camera</T>
        <T x={222} y={141} a="middle" c="gcp-muted">API key found</T>
        <Arrow p={[[425, 122], [570, 122]]} c="gcp-blue" />
        <T x={497} y={113} a="middle">face OK for 1.5 s</T>
        <T x={497} y={141} a="middle" c="gcp-muted">over 30 brow samples</T>

        <Arrow p={[[35, 152], [35, 180], [75, 180], [75, 152]]} c="gcp-muted" dash />
        <T x={20} y={200} c="gcp-muted">no API key,</T>
        <T x={20} y={216} c="gcp-muted">bad recording:</T>
        <T x={20} y={232} c="gcp-muted">message shown</T>

        <Arrow p={[[635, 152], [635, 200], [115, 200], [115, 152]]} c="gcp-red" />
        <line x1={360} y1={152} x2={360} y2={200} className="gcp-wire gcp-red" />
        <T x={132} y={222}>From setup: Stop, failed start,</T>
        <T x={132} y={240}>fatal SDK error</T>
        <T x={700} y={222} a="end">From board: Stop, Esc, fatal SDK error</T>
        <T x={700} y={240} a="end" c="gcp-muted">camera released on every red path</T>
      </svg>
    </Figure>
  );
}

// src/renderer/signals/{presage,replay,source}.ts, gestures/extract.ts, app.ts onSample()
export function SourceConvergence() {
  const out: [number, string, string[]][] = [
    [50, 'browDetector', ['brow: select']],
    [112, 'exhaleDetector', ['breath, talk: speak']],
    [174, 'On-screen only', ['traces, pulse']],
  ];
  return (
    <Figure caption="The recording stores samples that were already extracted, so replay skips the SDK and enters at the same point as live data. Everything to the right of that point runs the same code.">
      <svg viewBox="0 0 720 262" role="img" aria-label="Two inputs feeding one stream. Live: webcam to SmartSpectra SDK to extract. Replay: guided.jsonl to replaySource. Both deliver samples to onSample, which feeds the eyebrow detector, the exhale detector and the on-screen display.">
        <T x={16} y={32} c="gcp-b">Live</T>
        <Node x={16} y={50} w={90} h={56} title="Webcam" />
        <Arrow p={[[106, 78], [136, 78]]} />
        <Node x={136} y={50} w={130} h={56} title="SDK" sub={['metrics events']} />
        <Arrow p={[[266, 78], [296, 78]]} />
        <Node x={296} y={50} w={100} h={56} title="extract()" mono />
        <T x={16} y={124} c="gcp-muted">The SDK also sends validation, errors</T>
        <T x={16} y={140} c="gcp-muted">and the camera preview.</T>

        <T x={16} y={166} c="gcp-b">Replay</T>
        <Node x={16} y={174} w={220} h={56} title="recordings/guided.jsonl" mono sub={['numbers only, no video']} />
        <Arrow p={[[236, 202], [266, 202]]} />
        <Node x={266} y={174} w={130} h={56} title="replaySource" mono sub={['real time, loops']} />
        <T x={16} y={254} c="gcp-muted">Validation is reported as OK once, at the start.</T>

        <Arrow p={[[396, 78], [430, 78]]} c="gcp-blue" />
        <Arrow p={[[396, 202], [430, 202]]} c="gcp-gold" />
        <Box x={430} y={50} w={104} h={180} c="gcp-box gcp-strong" />
        <T x={482} y={126} a="middle" c="gcp-b">Samples</T>
        <T x={482} y={148} a="middle" c="gcp-mono">onSample</T>

        {out.map(([y, title, sub]) => (
          <g key={title}>
            <Arrow p={[[534, y + 28], [570, y + 28]]} />
            <Node x={570} y={y} w={140} h={56} title={title} mono={title !== 'On-screen only'} sub={sub} />
          </g>
        ))}
      </svg>
    </Figure>
  );
}

// src/renderer/board/scanner.ts with the default dwellMs (1000) and default phrases.
// Replaying these calls through createScanner gives row 1, then key T.
export function ScanTimeline() {
  const X = (ms: number) => 140 + ms * 0.112;
  const Y = (lane: number) => 44 + lane * 36;
  const lanes = ['row: phrases', 'row: ␣ E T A O ⌫', 'row: I N S H R D', 'key: ␣', 'key: E', 'key: T'];
  const bars: Pt[] = [[0, 1000], [1000, 2000], [2000, 2200], [2200, 3200], [3200, 4200], [4200, 4600]];
  const grace: [number, number][] = [[1, 1000], [2, 2000], [4, 3200], [5, 4200]];
  const mid = (lane: number) => Y(lane) + 11;
  return (
    <Figure caption="Typing T at the default 1 s step. The first raise lands 200 ms after the highlight moved, so the scanner takes the previous row. The second lands after the window has closed, so it takes the key still highlighted.">
      <svg viewBox="0 0 720 292" role="img" aria-label="Timeline of a scan over five seconds. The highlight steps through the phrases row, the row starting with space and E, then the row starting with I. A select at 2.2 seconds, 200 milliseconds after the last step and inside the 350 millisecond grace window, picks the previous row. The highlight then steps through space, E and T, and a select at 4.6 seconds, 400 milliseconds after the step, types T.">
        <Box x={140} y={8} w={22} h={13} c="gcp-bar" />
        <T x={168} y={20}>highlight</T>
        <Box x={250} y={8} w={22} h={13} c="gcp-grace" />
        <T x={278} y={20}>350 ms grace window</T>
        <circle cx={451} cy={14} r={6} className="gcp-dot" />
        <T x={464} y={20}>eyebrow raise (select)</T>

        {[0, 1, 2, 3, 4, 5].map((s) => (
          <g key={s}>
            <line x1={X(s * 1000)} y1={36} x2={X(s * 1000)} y2={262} className="gcp-grid" />
            <T x={X(s * 1000)} y={282} a="middle" c="gcp-muted">{s} s</T>
          </g>
        ))}
        <line x1={14} y1={Y(3) - 7} x2={706} y2={Y(3) - 7} className="gcp-grid gcp-dash" />
        {lanes.map((l, i) => <T key={l} x={130} y={mid(i) + 5} a="end" c={i === 1 || i === 5 ? 'gcp-b' : 'gcp-muted'}>{l}</T>)}

        {bars.map(([a, b], i) => <Box key={a} x={X(a)} y={Y(i)} w={X(b) - X(a)} h={22} c="gcp-bar" />)}
        {grace.map(([lane, a]) => <Box key={a} x={X(a)} y={Y(lane)} w={350 * 0.112} h={22} c="gcp-grace" />)}

        <Arrow p={[[X(2200), mid(2)], [X(2200), mid(1)], [X(2000) + 2, mid(1)]]} c="gcp-red" />
        <circle cx={X(2200)} cy={mid(2)} r={6} className="gcp-dot" />
        <T x={X(2200) + 16} y={mid(2) + 5}>+200 ms, in the window: previous row</T>
        <T x={X(3200) + 8} y={mid(3) + 5} c="gcp-muted">timer restarted: a full 1 s</T>
        <circle cx={X(4600)} cy={mid(5)} r={6} className="gcp-dot" />
        <T x={X(4200) - 8} y={mid(5) + 5} a="end">+400 ms, past the window: T is typed</T>
      </svg>
    </Figure>
  );
}

// package.json "build" (--external:@smartspectra/node-sdk), src/main/native-path.ts,
// checked against out/linux-unpacked/resources and the require() calls in dist/main.cjs
export function PackageLayout() {
  return (
    <Figure caption="The Linux build. The main bundle requires the SDK, the SDK loads koffi, and koffi loads the native library. A Windows build has the same shape, with smartspectra_capi.dll in place of the .so file.">
      <svg viewBox="0 0 720 344" role="img" aria-label="Contents of the resources folder. app.asar is one archive holding the bundled JavaScript, the SDK's JavaScript package and the recording. Beside it, app.asar.unpacked holds koffi as real files, and smartspectra holds this platform's native library as real files. The main bundle requires the SDK, the SDK requires koffi, koffi loads the native library, and the main bundle sets SMARTSPECTRA_CAPI_PATH to point at it.">
        <T x={16} y={22} c="gcp-mono gcp-b">resources/</T>

        <Box x={16} y={34} w={260} h={252} c="gcp-zone" />
        <T x={30} y={58} c="gcp-mono gcp-b">app.asar</T>
        <T x={30} y={76} c="gcp-muted">one archive file</T>
        <Box x={30} y={88} w={130} h={30} c="gcp-box gcp-strong" />
        <T x={95} y={108} a="middle" c="gcp-mono">dist/main.cjs</T>
        <Arrow p={[[95, 118], [95, 146]]} c="gcp-blue" />
        <T x={105} y={137} c="gcp-muted">require</T>
        <Box x={30} y={146} w={200} h={30} c="gcp-box gcp-strong" />
        <T x={130} y={166} a="middle" c="gcp-mono">@smartspectra/node-sdk</T>
        {['dist/preload.cjs', 'dist/renderer.js', 'src/renderer/index.html', 'recordings/guided.jsonl'].map((f, i) => (
          <T key={f} x={30} y={198 + i * 18} c="gcp-mono">{f}</T>
        ))}
        <T x={30} y={274} c="gcp-muted">the OS loader cannot read inside</T>

        <Box x={292} y={34} w={188} h={252} c="gcp-zone" />
        <T x={306} y={58} c="gcp-mono gcp-b">app.asar.unpacked</T>
        <T x={306} y={76} c="gcp-muted">real files</T>
        <Box x={306} y={146} w={160} h={30} c="gcp-box gcp-strong" />
        <T x={386} y={166} a="middle" c="gcp-mono">node_modules/koffi</T>
        <T x={306} y={198}>asarUnpack: koffi's</T>
        <T x={306} y={216}>native addon</T>
        <T x={306} y={234}>must be a real file</T>

        <Box x={496} y={34} w={208} h={252} c="gcp-zone" />
        <T x={510} y={58} c="gcp-mono gcp-b">smartspectra/</T>
        <T x={510} y={76} c="gcp-muted">real files</T>
        <Box x={504} y={146} w={192} h={30} c="gcp-box gcp-strong" />
        <T x={600} y={166} a="middle" c="gcp-mono">libsmartspectra_capi.so</T>
        <T x={510} y={198} c="gcp-mono">graph/</T>
        <T x={510} y={216}>and its dependent libraries</T>
        <T x={510} y={244}>extraResources: this</T>
        <T x={510} y={262}>platform's runtime only</T>

        <Arrow p={[[230, 161], [306, 161]]} c="gcp-blue" />
        <Arrow p={[[466, 161], [504, 161]]} c="gcp-blue" />

        <Arrow p={[[95, 286], [95, 310], [600, 310], [600, 286]]} c="gcp-gold" />
        <T x={347} y={332} a="middle">native-path.ts sets SMARTSPECTRA_CAPI_PATH before the SDK is required</T>
      </svg>
    </Figure>
  );
}

// src/renderer/signals/presage.ts, docs/sdk-notes.md "Renderer camera lock never released"
export function ExposureLock() {
  type Step = [string, string[], string, string];
  const row = (y: number, label: string, steps: Step[]) => (
    <g>
      <T x={16} y={y} c="gcp-b">{label}</T>
      {steps.map(([title, sub, mode, c], i) => {
        const x = 16 + i * 176;
        return (
          <g key={title}>
            <Node x={x} y={y + 12} w={160} h={78} title={title} sub={sub} />
            <Box x={x} y={y + 96} w={160} h={26} c={`gcp-state ${c}`} />
            <T x={x + 80} y={y + 114} a="middle">{mode}</T>
            {i < 3 && <Arrow p={[[x + 160, y + 51], [x + 176, y + 51]]} />}
          </g>
        );
      })}
    </g>
  );
  return (
    <Figure caption="The band under each step is the camera's exposure mode. On Linux the driver holds that setting after the app exits, so the fix is to hand the camera back in automatic mode.">
      <svg viewBox="0 0 720 306" role="img" aria-label="Two sequences. Without the workaround, the SDK sets the camera to manual, nothing sets it back, and the next session in any app starts almost black. With the workaround, Glint sets the camera to automatic and waits 1.5 seconds, the SDK locks it to manual, Glint sets it to automatic before release, and the next session starts from automatic.">
        {row(20, 'If the SDK opens the camera', [
          ['Session starts', ['camera as found'], 'auto', 'gcp-s-auto'],
          ['SDK running', ['locks exposure, white', 'balance and focus'], 'manual', 'gcp-s-manual'],
          ['App exits', ['nothing restores', 'the camera'], 'still manual', 'gcp-s-manual'],
          ['Next session', ['any app: starts', 'almost black'], 'still manual', 'gcp-s-bad'],
        ])}
        {row(170, 'When Glint owns the stream', [
          ['Glint opens it', ['sets continuous,', 'waits 1.5 s'], 'auto', 'gcp-s-auto'],
          ['SDK gets stream', ['useMediaStream,', 'then locks as before'], 'manual', 'gcp-s-manual'],
          ['Session ends', ['sets continuous,', 'then releases'], 'auto', 'gcp-s-auto'],
          ['Next session', ['starts from', 'automatic'], 'auto', 'gcp-s-auto'],
        ])}
      </svg>
    </Figure>
  );
}

// The Timing table in content/docs/reference/sdk-signals.mdx: change them together.
export function StartupTiming() {
  const X = (s: number) => 190 + s * 6.8;
  const rows: [string, number, number, number][] = [
    ['Landmarks', 1, 3, 46],
    ['Breathing trace', 1, 3, 46],
    ['Blink, talking', 4, 4, 36],
    ['Expression', 6, 9, 48],
    ['Pulse', 13, 32, 60],
    ['Trace stable', 34, 66, 51],
  ];
  return (
    <Figure caption="Seconds until each signal first arrives, measured on one laptop. The first session of the day is slower for everything except the stable trace, whose warm range already reaches past it.">
      <svg viewBox="0 0 720 348" role="img" aria-label="Range chart of signal arrival time. Warm start against first session of the day: landmarks and breathing trace 1 to 3 seconds against 46; blink and talking 4 against 36; expression 6 to 9 against 48; pulse 13 to 32 against 60; breathing trace stable 34 to 66 against 51.">
        <Box x={190} y={9} w={22} h={8} c="gcp-warm" />
        <T x={218} y={19}>Warm start</T>
        <circle cx={320} cy={13} r={5} className="gcp-cold" />
        <T x={332} y={19}>First session of the day</T>

        {[0, 10, 20, 30, 40, 50, 60, 70].map((s) => (
          <g key={s}>
            <line x1={X(s)} y1={32} x2={X(s)} y2={316} className="gcp-grid" />
            <T x={X(s)} y={336} a="middle" c="gcp-muted">{s} s</T>
          </g>
        ))}
        {rows.map(([label, lo, hi, cold], i) => {
          const y = 36 + i * 47;
          return (
            <g key={label}>
              <T x={178} y={y + 25} a="end">{label}</T>
              {lo === hi
                ? <rect x={X(lo) - 3} y={y + 7} width={6} height={10} className="gcp-warm" />
                : <rect x={X(lo)} y={y + 7} width={X(hi) - X(lo)} height={10} className="gcp-warm" />}
              <T x={X(hi) + 9} y={y + 17} c="gcp-muted">{lo === hi ? `${lo} s` : `${lo}–${hi} s`}</T>
              <circle cx={X(cold)} cy={y + 31} r={5} className="gcp-cold" />
              <T x={X(cold) + 10} y={y + 36} c="gcp-muted">{cold} s</T>
            </g>
          );
        })}
      </svg>
    </Figure>
  );
}

// board/scanner.ts, board/layouts.ts (H and I share a row; applyKey lowercases), app.ts commit()
export function GestureCost() {
  const keys = ['I', 'N', 'S', 'H', 'R', 'D'];
  const steps: { on: number | 'row'; text: string }[] = [
    { on: 'row', text: '' },
    { on: 3, text: 'h' },
    { on: 'row', text: 'h' },
    { on: 0, text: 'hi' },
  ];
  const col = (i: number) => 12 + i * 140;
  return (
    <Figure caption="Typing and saying “hi”. Each letter takes two raises, one for its row and one for its key. Between raises you wait for the highlight to get there.">
      <svg viewBox="0 0 720 196" role="img" aria-label="Five steps. Raise eyebrows to enter the row I N S H R D. Raise again to pick H, and the text is h. Raise to enter the row again, raise to pick I, and the text is hi. A slow breath out says hi, copies it and clears the text.">
        {steps.map(({ on, text }, i) => {
          const x = col(i), cx = x + 62;
          return (
            <g key={i}>
              <path d={`M${cx - 20} 34 Q${cx} 12 ${cx + 20} 34`} className="gcp-brow" />
              <ellipse cx={cx} cy={50} rx={20} ry={9} className="gcp-eye" />
              <circle cx={cx} cy={50} r={4.5} className="gcp-pupil" />
              <T x={cx} y={84} a="middle">{i % 2 ? 'raise: key' : 'raise: row'}</T>
              {keys.map((k, j) => (
                <g key={k}>
                  <rect x={x + j * 21} y={98} width={20} height={26} className={on === 'row' || on === j ? 'gcp-key gcp-key-on' : 'gcp-key'} />
                  <T x={x + j * 21 + 10} y={116} a="middle">{k}</T>
                </g>
              ))}
              <T x={cx} y={156} a="middle" c="gcp-mono">{text ? `“${text}”` : '“”'}</T>
            </g>
          );
        })}
        <path d={`M${col(4) + 18} 18 C${col(4) + 50} 18 ${col(4) + 70} 56 ${col(4) + 118} 60`} className="gcp-breath" />
        <T x={col(4) + 68} y={84} a="middle">slow breath out</T>
        <T x={col(4) + 68} y={116} a="middle" c="gcp-b">says “hi”</T>
        <T x={col(4) + 68} y={156} a="middle" c="gcp-mono">“”</T>
        <T x={col(4) + 68} y={178} a="middle" c="gcp-muted">copied, cleared</T>
      </svg>
    </Figure>
  );
}
