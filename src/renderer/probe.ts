// Day-0 probe: consent gate -> live SDK session -> show each signal, log when it first arrives,
// optionally record decoded metrics (numbers only) to JSONL for replay.
import {
  SmartSpectraSDK, ValidationCode, ProcessingStatus, breathingMetrics, cardioMetrics, faceMetrics,
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
    requestedMetrics: [...breathingMetrics, ...cardioMetrics, ...faceMetrics],
  });
  sdk.on('streamAvailable', (s) => { $<HTMLVideoElement>('preview').srcObject = s; });
  sdk.on('processingStatus', (s) => console.log('[glint] status', nameOf(ProcessingStatus, s)));
  sdk.on('validationStatus', (code, _ts, hint) => {
    $('hint').textContent = code === ValidationCode.kOk ? '' : `${nameOf(ValidationCode, code)}: ${hint}`;
  });
  sdk.on('error', (code, msg, retryable) => { $('hint').textContent = `error ${code}: ${msg} (retryable=${retryable})`; });
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
  t0 = performance.now();
  await sdk.start();
  $<HTMLButtonElement>('start').disabled = true; $<HTMLButtonElement>('stop').disabled = false;
};

$('stop').onclick = async () => {
  await sdk?.stop(); sdk?.destroy(); sdk = null;
  await window.glint.record(false);
  $<HTMLVideoElement>('preview').srcObject = null;
  $<HTMLButtonElement>('start').disabled = false; $<HTMLButtonElement>('stop').disabled = true;
};
