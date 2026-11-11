// Glint renderer: consent -> setup -> board. The camera can only be opened from the consent screen's
// "Start camera" button; every exit path (Stop, Esc, error, window close) releases it.
import { browDetector, BROW_DEFAULTS } from './gestures/brow.ts';
import { exhaleDetector } from './gestures/exhale.ts';
import type { Sample } from './gestures/extract.ts';
import { createScanner, BACK } from './board/scanner.ts';
import { LETTERS, applyKey } from './board/layouts.ts';
import { liveSource } from './signals/presage.ts';
import { replaySource } from './signals/replay.ts';
import type { SignalSource } from './signals/source.ts';
import { DEFAULT_SETTINGS, type Settings } from '../shared/settings.ts';

let settings: Settings = DEFAULT_SETTINGS;
const boardRows = () => (settings.phrases.length ? [settings.phrases, ...LETTERS] : LETTERS);
const PHRASE_ROW = 0; // only when settings.phrases is non-empty

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
type Phase = 'consent' | 'setup' | 'board';
let phase: Phase = 'consent';
const go = (p: Phase) => {
  phase = p;
  for (const id of ['consent', 'setup', 'board'] as const) $(id).hidden = id !== p;
};

// ---- session state ---------------------------------------------------------------------------
let source: SignalSource | null = null;
let brow = browDetector();
let exhale = exhaleDetector();
let validationOk = false;
let okSince = 0;
let text = '';
let scanner = createScanner(boardRows());
const hist = { brow: [] as [number, number][], breath: [] as [number, number][] };
let browBase: number | null = null;
let breathStable = false, firstBreathAt = 0, lastTalk = false, pulse: number | null = null;

function resetSession() {
  brow = browDetector(); exhale = exhaleDetector();
  validationOk = false; okSince = 0; text = ''; scanner = createScanner(boardRows());
  hist.brow = []; hist.breath = []; browBase = null;
  breathStable = false; firstBreathAt = 0; lastTalk = false; pulse = null;
}

async function start(kind: 'live' | 'replay') {
  if (source) return;
  $('consent-error').textContent = '';
  resetSession();
  try {
    if (kind === 'live') {
      const key = await window.glint.apiKey();
      if (!key) throw new Error('No Presage API key: put PRESAGE_API_KEY in .env (see README).');
      source = liveSource(key, { telemetry: settings.telemetry });
      go('setup');
    } else {
      source = replaySource(await window.glint.replay());
    }
    $('src-label').textContent = kind === 'live' ? 'live camera' : 'replaying a recorded session';
    await source.start({
      sample: onSample,
      validation: onValidation,
      error: (msg, fatal) => {
        if (fatal) { void stop().then(() => { $('consent-error').textContent = msg; }); return; } // fail closed: the camera goes off
        $('setup-hint').textContent = msg; showPaused(msg);
      },
      stream: (s) => { $<HTMLVideoElement>('setup-video').srcObject = s; $<HTMLVideoElement>('board-video').srcObject = s; },
    });
    $('board-video').hidden = kind !== 'live';
    if (kind === 'replay') enterBoard();
  } catch (e) {
    await stop();
    $('consent-error').textContent = (e as Error).message;
  }
}

async function stop() {
  const s = source; source = null;
  clearTimeout(scanTimer);
  await s?.stop();
  $<HTMLVideoElement>('setup-video').srcObject = null;
  $<HTMLVideoElement>('board-video').srcObject = null;
  $('paused').hidden = true;
  go('consent');
}

// ---- signals -> gestures -----------------------------------------------------------------------
function onValidation(ok: boolean, _code: string, hint: string) {
  if (ok && !validationOk) okSince = performance.now();
  validationOk = ok;
  $('setup-hint').textContent = ok ? 'Looking good — hold still…' : hint;
  if (phase === 'board') ok ? hidePaused() : showPaused(hint);
}

function onSample(s: Sample) {
  const sec = s.t / 1e6;
  if (s.k === 'brow') {
    browBase = browBase === null ? s.v : browBase + 0.01 * (s.v - browBase); // display baseline only
    push(hist.brow, sec, s.v);
    if (brow(s.t, s.v) && phase === 'board' && validationOk) select();
    if (phase === 'setup') maybeReady();
  } else if (s.k === 'breath') {
    firstBreathAt ||= performance.now();
    breathStable ||= s.s;
    push(hist.breath, sec, s.v);
    if (exhale.breath(s.t, s.v) && phase === 'board' && validationOk) void commit();
  } else if (s.k === 'talk') {
    exhale.talk(s.t, s.v); lastTalk = s.v;
  } else if (s.k === 'pulse') {
    pulse = s.v;
  }
}
const push = (h: [number, number][], t: number, v: number) => { h.push([t, v]); while (h.length && t - h[0][0] > 10) h.shift(); };

function maybeReady() {
  const faceOk = validationOk && performance.now() - okSince > 1500;
  const browOk = hist.brow.length > 30;
  $('chk-face').classList.toggle('done', faceOk);
  $('chk-brow').classList.toggle('done', browOk);
  $('chk-breath').classList.toggle('done', hist.breath.length > 0);
  if (faceOk && browOk) enterBoard();
}

// ---- board ------------------------------------------------------------------------------------
let scanTimer: ReturnType<typeof setTimeout> | undefined;
const schedule = () => {
  clearTimeout(scanTimer);
  scanTimer = setTimeout(() => {
    if (validationOk) scanner.tick(performance.now()); // scanning pauses while the SDK can't see the user
    renderBoard(); schedule();
  }, settings.dwellMs);
};

function enterBoard() {
  if (phase === 'board') return;
  go('board'); buildGrid(); renderBoard(); schedule();
}

function select() {
  const { mode, row } = scanner.state();
  const key = scanner.select(performance.now());
  if (key && mode === 'cols' && row === PHRASE_ROW && settings.phrases.length) void say(key); // phrases speak at once
  else if (key) text = applyKey(text, key);
  renderBoard(); schedule(); // any gesture restarts the dwell timer
}

async function commit() {
  const t = text.trim();
  if (!t) return; // guard: a stray exhale with nothing composed does nothing
  text = ''; renderBoard();
  await say(t);
}

async function say(t: string) {
  await window.glint.copy(t);
  const spoken = await speak(t);
  $('last').textContent = `Last: “${t}”`;
  toast(spoken ? 'Spoken · copied to clipboard' : 'Copied to clipboard (no speech voice installed)');
}

async function speak(t: string): Promise<boolean> {
  if (speechSynthesis.getVoices().length) { speechSynthesis.speak(new SpeechSynthesisUtterance(t)); return true; }
  return window.glint.speak(t); // stock Linux has no Web Speech voice; main tries espeak-ng
}

// Built with DOM nodes + textContent: phrases are user-entered text.
function buildGrid() {
  const grid = $('grid');
  grid.replaceChildren(...boardRows().map((row, r) => {
    const el = document.createElement('div');
    el.className = 'krow' + (r === PHRASE_ROW && settings.phrases.length ? ' phrases' : '');
    el.dataset.r = String(r);
    el.style.gridTemplateColumns = `repeat(${row.length + 1}, 1fr)`;
    el.append(...[...row, BACK].map((k, c) => {
      const key = document.createElement('div');
      key.className = 'key' + (k === BACK ? ' back' : '');
      key.dataset.c = String(c);
      key.textContent = k;
      return key;
    }));
    return el;
  }));
}

function renderBoard() {
  const { mode, row, col } = scanner.state();
  document.querySelectorAll<HTMLElement>('.krow').forEach((el) => {
    const r = Number(el.dataset.r);
    el.classList.toggle('on', mode === 'rows' && r === row);
    el.querySelectorAll<HTMLElement>('.key').forEach((k) => k.classList.toggle('on', mode === 'cols' && r === row && Number(k.dataset.c) === col));
  });
  $('output').textContent = text;
}

// ---- feedback ---------------------------------------------------------------------------------
const showPaused = (hint: string) => { $('paused').textContent = `Paused: ${hint}`; $('paused').hidden = false; };
const hidePaused = () => { $('paused').hidden = true; };
let toastTimer: ReturnType<typeof setTimeout> | undefined;
function toast(msg: string) {
  $('toast').textContent = msg; $('toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => ($('toast').hidden = true), 2500);
}

function draw(id: string, h: [number, number][], line?: number) {
  const c = $<HTMLCanvasElement>(id), dpr = devicePixelRatio;
  c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr;
  const g = c.getContext('2d')!;
  if (h.length < 2) return;
  const vs = h.map((p) => p[1]).concat(line ?? []);
  const lo = Math.min(...vs), hi = Math.max(...vs), span = hi - lo || 1, tEnd = h.at(-1)![0];
  const X = (t: number) => c.width * (1 - (tEnd - t) / 10), Y = (v: number) => c.height * (1 - (v - lo) / span) * 0.9 + c.height * 0.05;
  if (line !== undefined) { g.strokeStyle = '#ffd16688'; g.setLineDash([4 * dpr, 4 * dpr]); g.beginPath(); g.moveTo(0, Y(line)); g.lineTo(c.width, Y(line)); g.stroke(); g.setLineDash([]); }
  g.strokeStyle = '#7fd1ff'; g.lineWidth = 2 * dpr; g.beginPath();
  h.forEach(([t, v], i) => (i ? g.lineTo(X(t), Y(v)) : g.moveTo(X(t), Y(v)))); g.stroke();
}
setInterval(() => {
  if (phase !== 'board') return;
  draw('c-brow', hist.brow, browBase === null ? undefined : browBase * (1 + BROW_DEFAULTS.rise));
  draw('c-breath', hist.breath);
  $('breath-badge').textContent = breathStable ? 'steady' : `warming up ${Math.min(30, Math.round((performance.now() - firstBreathAt) / 1000))} / 30 s`;
  $('breath-badge').hidden = breathStable;
  $('talk').textContent = lastTalk ? 'yes' : 'no';
  $('pulse').textContent = pulse ? `${Math.round(pulse)} bpm` : '–';
}, 100);

// ---- settings ---------------------------------------------------------------------------------
function showSettings(s: Settings) {
  settings = s;
  $<HTMLInputElement>('dwell').value = String(s.dwellMs);
  $('dwell-label').textContent = `${(s.dwellMs / 1000).toFixed(1)} s`;
  $<HTMLTextAreaElement>('phrases').value = s.phrases.join('\n');
  $<HTMLInputElement>('telemetry').checked = s.telemetry;
}
$('dwell').oninput = () => { $('dwell-label').textContent = `${(Number($<HTMLInputElement>('dwell').value) / 1000).toFixed(1)} s`; };
$('settings-save').onclick = async () => {
  showSettings(await window.glint.settings.set({
    dwellMs: Number($<HTMLInputElement>('dwell').value),
    phrases: $<HTMLTextAreaElement>('phrases').value.split('\n'),
    telemetry: $<HTMLInputElement>('telemetry').checked,
  }));
  $('settings-status').textContent = 'Saved.';
};
$('settings-forget').onclick = async () => {
  showSettings(await window.glint.settings.forget());
  $('settings-status').textContent = 'Deleted. Back to defaults.';
};
window.glint.settings.get().then(showSettings);

// ---- inputs -----------------------------------------------------------------------------------
$('go-live').onclick = () => start('live');
$('go-replay').onclick = () => start('replay');
$('setup-stop').onclick = $('board-stop').onclick = () => stop();
addEventListener('keydown', (e) => {
  if (phase !== 'board') return;
  if (e.key === ' ') { e.preventDefault(); select(); }       // a physical switch usually sends Space
  else if (e.key === 'Enter') { e.preventDefault(); void commit(); }
  else if (e.key === 'Escape') void stop();
});
addEventListener('beforeunload', () => { void source?.stop(); });
