// Day-0 probe: consent gate -> live SDK session -> show each signal, log when it first arrives,
// optionally record decoded metrics (numbers only) to JSONL for replay.
import {
  SmartSpectraSDK, ValidationCode, ProcessingStatus, MetricType, breathingMetrics, faceMetrics,
} from '@smartspectra/node-sdk/renderer';
import { decodeMetrics, Metrics } from '@smartspectra/node-sdk/messages';

declare global {
  interface Window {
    glint: { apiKey(): Promise<string>; record(on: boolean): Promise<string | null>; frame(line: string): void };
  }
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const nameOf = (table: Record<string, number>, v: number) => Object.keys(table).find((k) => table[k] === v) ?? String(v);
const SURPRISE = 8; // ExpressionType.SURPRISE; confidence is 0..100, not 0..1

$('agree').onclick = () => { $('consent').hidden = true; $('probe').hidden = false; };

let sdk: SmartSpectraSDK | null = null;
let stream: MediaStream | null = null;

// The SDK locks exposure/white balance/focus to 'manual' once Running and never unlocks them. On Linux
// (V4L2) that lock outlives the process, so the next session starts dark. We own the stream so we can
// start every session from auto and hand the camera back in auto.
const AUTO = { advanced: [{ exposureMode: 'continuous' }, { whiteBalanceMode: 'continuous' }, { focusMode: 'continuous' }] } as unknown as MediaTrackConstraints; // Image Capture keys, not in TS DOM lib
const toAuto = (s: MediaStream) => Promise.all(s.getVideoTracks().map((t) => t.applyConstraints(AUTO).catch(() => {})));
async function openCamera() {
  const s = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, frameRate: 30 } });
  await toAuto(s);
  await new Promise((r) => setTimeout(r, 1500)); // ponytail: fixed settle time; poll brightness if 1.5 s is not enough in dim rooms
  return s;
}
async function closeCamera() {
  if (!stream) return;
  await toAuto(stream);
  stream.getTracks().forEach((t) => t.stop());
  stream = null;
}
let t0 = 0;
const firstSeen: Record<string, number> = {};
const seen = (k: string, has: unknown) => {
  if (has && !(k in firstSeen)) { firstSeen[k] = (performance.now() - t0) / 1000; console.log(`[glint] first ${k} at ${firstSeen[k].toFixed(1)} s`); }
};

$('start').onclick = async () => {
  const apiKey = await window.glint.apiKey();
  if (!apiKey) { $('hint').textContent = 'PRESAGE_API_KEY is missing from .env'; return; }
  sdk = new SmartSpectraSDK({
    apiKey, enableTelemetry: false,
    // Only what Glint uses: cardioMetrics would also pull the BP-trace and HRV models.
    requestedMetrics: [...breathingMetrics, MetricType.PULSE_RATE, ...faceMetrics],
  });
  sdk.on('processingStatus', (s) => console.log('[glint] status', nameOf(ProcessingStatus, s)));
  sdk.on('validationStatus', (code, _ts, hint) => {
    $('hint').textContent = code === ValidationCode.kOk ? '' : `${nameOf(ValidationCode, code)}: ${hint}`;
  });
  sdk.on('error', (code, msg, retryable) => { console.log(`[glint] error ${code}: ${msg} retryable=${retryable}`); $('hint').textContent = `error ${code}: ${msg} (retryable=${retryable})`; });
  sdk.on('metrics', (buf, ts) => {
    const m = Metrics.toObject(decodeMetrics(buf), { longs: Number, defaults: false }) as any;
    window.glint.frame(JSON.stringify({ ts, m }));
    const f = m.face ?? {}, b = m.breathing ?? {}, c = m.cardio ?? {};
    for (const k of ['landmarks', 'blinking', 'talking', 'expression']) seen(`face.${k}`, f[k]?.length);
    for (const k of ['upperTrace', 'lowerTrace', 'rate']) seen(`breathing.${k}`, b[k]?.length);
    seen('breathing.upperTrace(stable)', b.upperTrace?.some((s: any) => s.stable));
    seen('cardio.pulseRate', c.pulseRate?.length);
    const surprise = f.expression?.at(-1)?.scores?.find((s: any) => s.type === SURPRISE)?.confidence;
    $('out').textContent = [
      `t+${((performance.now() - t0) / 1000).toFixed(1)} s`,
      `blink ${f.blinking?.at(-1)?.detected ?? '-'}   talking ${f.talking?.at(-1)?.detected ?? '-'}   surprise ${surprise?.toFixed(0) ?? '-'}`,
      `upperTrace n=${b.upperTrace?.length ?? 0} last=${b.upperTrace?.at(-1)?.value?.toFixed(3) ?? '-'} stable=${b.upperTrace?.at(-1)?.stable ?? '-'}`,
      `breathing rate ${b.rate?.at(-1)?.value?.toFixed(1) ?? '-'}   pulse (display only) ${c.pulseRate?.at(-1)?.value?.toFixed(0) ?? '-'}`,
      `landmarks per sample ${f.landmarks?.at(-1)?.value?.length ?? '-'}`,
      '', 'first seen (s):', ...Object.entries(firstSeen).map(([k, v]) => `  ${k.padEnd(30)} ${v.toFixed(1)}`),
    ].join('\n');
  });
  const file = await window.glint.record($<HTMLInputElement>('rec').checked);
  if (file) console.log('[glint] recording to', file);
  stream = await openCamera();
  $<HTMLVideoElement>('preview').srcObject = stream;
  sdk.useMediaStream(stream);
  t0 = performance.now();
  await sdk.start();
  $<HTMLButtonElement>('start').disabled = true; $<HTMLButtonElement>('stop').disabled = false;
};

// Guided capture: on-screen cues, each written to the JSONL as {mark, phase, tUs} on the same
// epoch-µs clock as SDK sample timestamps, so analysis knows exactly when each gesture was asked for.
const STEPS: [label: string, cue: string, seconds: number, reps: number, restSeconds: number][] = [
  ['long-blink', 'CLOSE EYES & HOLD', 1, 5, 3],
  ['quick-blink', 'quick normal blink', 0.5, 5, 2.5],
  ['brow-raise', 'RAISE EYEBROWS & HOLD', 1.5, 3, 3],
  ['slow-exhale', 'SLOW BREATH OUT…', 4, 3, 0], // preceded by an inhale cue below
  ['talking', 'say anything aloud', 10, 1, 2],
  ['silent', 'sit still, mouth closed', 10, 1, 0],
];
const sleep = (s: number) => new Promise((r) => setTimeout(r, s * 1000));
const mark = (label: string, phase: 'start' | 'end') => window.glint.frame(JSON.stringify({ mark: label, phase, tUs: Date.now() * 1000 }));
const cue = (text: string) => { $('cue').textContent = text; };

$('guided').onclick = async () => {
  $<HTMLInputElement>('rec').checked = true;
  $<HTMLButtonElement>('guided').disabled = true;
  await ($('start').onclick as () => Promise<void>)();
  cue('sit still, breathe normally (warming up)');
  const settleStart = performance.now(); // wait for a stable breathing trace, at most 40 s
  while (!('breathing.upperTrace(stable)' in firstSeen) && performance.now() - settleStart < 40_000) await sleep(0.5);
  for (const [label, text, secs, reps, rest] of STEPS) {
    for (let i = 1; i <= reps; i++) {
      if (label === 'slow-exhale') { cue('breathe in…'); await sleep(3); }
      cue(reps > 1 ? `${text}  (${i}/${reps})` : text);
      mark(label, 'start'); await sleep(secs); mark(label, 'end');
      cue(''); await sleep(rest || 2);
    }
  }
  cue('done ✓');
  await ($('stop').onclick as () => Promise<void>)();
  $<HTMLButtonElement>('guided').disabled = false;
};

$('stop').onclick = async () => {
  await sdk?.stop(); sdk?.destroy(); sdk = null;
  await closeCamera();
  await window.glint.record(false);
  $<HTMLVideoElement>('preview').srcObject = null;
  $<HTMLButtonElement>('start').disabled = false; $<HTMLButtonElement>('stop').disabled = true;
};
