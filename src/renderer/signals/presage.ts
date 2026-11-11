// Live source: SmartSpectra SDK on the webcam. The camera is opened here and nowhere else, and only
// after the consent state (see app.ts). Video stays in memory; only decoded numbers leave this file.
import { SmartSpectraSDK, ValidationCode, ProcessingStatus, MetricType, breathingMetrics, faceMetrics } from '@smartspectra/node-sdk/renderer';
import { decodeMetrics, Metrics } from '@smartspectra/node-sdk/messages';
import { extract } from '../gestures/extract.ts';
import type { SignalSource, SourceEvents } from './source.ts';

const nameOf = (v: number) => Object.keys(ValidationCode).find((k) => (ValidationCode as Record<string, number>)[k] === v) ?? String(v);

// The SDK locks exposure/white balance/focus to 'manual' once Running and never unlocks them; on Linux
// (V4L2) that lock outlives the process and the next session starts dark. So we own the stream: start
// every session from auto, and hand the camera back in auto.
const AUTO = { advanced: [{ exposureMode: 'continuous' }, { whiteBalanceMode: 'continuous' }, { focusMode: 'continuous' }] } as unknown as MediaTrackConstraints; // Image Capture keys, not in TS DOM lib
const toAuto = (s: MediaStream) => Promise.all(s.getVideoTracks().map((t) => t.applyConstraints(AUTO).catch(() => {})));

export function liveSource(apiKey: string, opts: { record?: boolean; telemetry?: boolean } = {}): SignalSource {
  let sdk: SmartSpectraSDK | null = null;
  let stream: MediaStream | null = null;

  async function stop() {
    const s = sdk; sdk = null;
    try { await s?.stop(); } catch { /* already stopped or errored */ }
    s?.destroy();
    if (stream) {
      await toAuto(stream);
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    if (opts.record) await window.glint.record(false);
  }

  return {
    kind: 'live',
    stop,
    async start(ev: SourceEvents) {
      try {
        sdk = new SmartSpectraSDK({
          apiKey,
          enableTelemetry: opts.telemetry ?? false,
          // Only what Glint uses. cardioMetrics would also pull the BP-trace and HRV models.
          requestedMetrics: [...breathingMetrics, MetricType.PULSE_RATE, ...faceMetrics],
        });
        sdk.on('validationStatus', (code, _ts, hint) => ev.validation(code === ValidationCode.kOk, nameOf(code), hint));
        let lastError = 'The SDK stopped with an error.';
        sdk.on('error', (code, msg, retryable) => { lastError = `SDK error ${code}: ${msg}`; ev.error(lastError, !retryable); });
        // kError ends the session whatever the last error claimed; frames sent after it are only dropped.
        sdk.on('processingStatus', (status) => { if (status === ProcessingStatus.kError) ev.error(lastError, true); });
        sdk.on('metrics', (buf) => {
          const m = Metrics.toObject(decodeMetrics(buf), { longs: Number, defaults: false });
          if (opts.record) window.glint.frame(JSON.stringify({ m }));
          for (const s of extract(m)) ev.sample(s);
        });
        if (opts.record) await window.glint.record(true);
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, frameRate: 30 } });
        await toAuto(stream);
        await new Promise((r) => setTimeout(r, 1500)); // ponytail: fixed AE settle time; poll brightness if dim rooms need longer
        if (!sdk) throw new Error('stopped');
        ev.stream?.(stream);
        sdk.useMediaStream(stream);
        await sdk.start();
      } catch (e) {
        await stop(); // fail closed: never leave the camera on
        throw e;
      }
    },
  };
}
