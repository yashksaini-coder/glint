# SDK notes

Where the brief, the docs and the installed package (`@smartspectra/node-sdk@3.5.0`) disagree, the package `.d.ts` wins.

Verified 2026-11-10.

| Topic | Brief said | Package / docs say | Impact |
|---|---|---|---|
| Version | 3.4.0 | `latest` is **3.5.0** (`npm view`), `SmartSpectraSDK.version` → `3.5.0` | Pinned 3.5.0 |
| `face.expression` shape | probabilities over named emotions | `Expression { stable, timestamp, scores: [{ type: ExpressionType, confidence }] }`, `confidence` in **0–100**, `SURPRISE = 8` (`data-types.md`, `messages/generated.d.ts`) | `browTau` defaults become 60 / re-arm 30, not 0.6 / 0.3 |
| Telemetry contents | "aggregate, no vitals, no video, no identifiers" | `index.d.ts` `enableTelemetry`: "Reports can contain free text, paths and platform context, and authenticated requests can correlate them with an account/device. No raw frames or measured vitals are sent." Default **true**. | Post must not say "no identifiers". We pass `enableTelemetry: false`. |
| `upperTrace` stability | (unknown) | No confidence of its own; `stable` is inherited from the breathing-rate verdict (confidence ≥ 45) | Exhale detector can run on unstable samples with a "low confidence" badge; probe measures first arrival |
| Renderer bundling | n/a | Renderer SDK must be bundled (sample uses esbuild IIFE); the `messages` subpath is renderer-safe | esbuild for main, preload, renderer |
| API key path | n/a | `bindSmartSpectraIpc(win, { logger })` takes no key; the renderer SDK sends `options.apiKey` over IPC | Key lives in `.env`, main returns it via `glint:apiKey`; it sits in renderer memory during a session |
| Sandboxed preload | `require('@smartspectra/node-sdk/preload')` | A sandboxed preload can only `require('electron')`, so our preload is bundled with the SDK preload inlined (it only needs `contextBridge`, `ipcRenderer`) | `dist/preload.js` |
| Linux camera | n/a | `availableCameras()` reports `facing: unknown` on this HP webcam | Renderer path uses `getUserMedia`, unaffected |

## Still to verify on the first live run (Day 0)

- Credits per minute (portal / MCP `usage.get_plan`): before, run 5 min, after.
- Time to first `breathing.upperTrace` sample vs first `stable` one (probe prints "first seen").
- Sign of `upperTrace` on inhale vs exhale.
- Blink sample rate: is `face.blinking` per frame, or does it only update on change? This decides how the blink-duration timer works.

## Day-0 live run, 2026-11-10 (recording `session-2026-11-10T14-11-21-033Z.jsonl`, 276 s, not committed)

Analysed with throwaway scripts (`analyze.mjs`, `landmarks.mjs`).

- **Delivery:** `metrics` fires at ~30 Hz. Blink, talking, expression, landmarks and upperTrace each carry 1–2 *new* samples per message (0 duplicate timestamps). Rate is ~0.3 Hz, pulse ~0.9 Hz.
- **Warm-up (warm camera, second session):** landmarks 3.3 s, upperTrace 3.4 s, blink 4.1 s, expression 8.7 s, breathing rate 16.8 s, pulse 31.8 s, upperTrace `stable` 33.9 s. upperTrace arrives ~30 s before it is stable, so exhale detection can start early with a low-confidence badge.
- **Cold start (first session of the day):** blink 35.7 s, landmarks 46.1 s, `stable` 51.4 s. This is mostly model download time.
- **`face.blinking`:** the longest true-run was 268 ms over 71 runs. Default `blinkMin` 400 ms would never fire. Pending ground truth: did the user hold long blinks?
- **`surprise` confidence:** median 2, peaks 61–73, never ≥ 60 for two consecutive samples. The "≥ τ for 3 frames" spec would never fire.
- **`talking.detected`:** 50 runs over 276 s. If that is mostly non-speech, suppressing exhale on talking blocks too much.
- **upperTrace:** range about ±50, noisy (median monotonic segment 0.33 s), so it needs heavier smoothing than a 5-sample EMA.
- **Recording size:** 74 MB per 5 min, mostly landmarks. Keep only the eye and brow points before committing fixtures.

## SDK issues to raise on Discord

1. **Transient 503 `{"detail":"Model not available. Please retry."}`** for `phasic-bp-inference` and `expressions-inference`, 2026-11-10 19:30 IST. The graph went to `kError` about 50 s in. It worked on retry 10 min later.
2. **Renderer camera lock never released.** `_tryLockCameraParameters` (`js/renderer/index.js:438`) sets exposure, white balance and focus to `manual` and nothing restores `continuous`. On Linux (V4L2) the lock persists on the device, so the next session (any app) starts dark (`kTooDark`; `v4l2-ctl` showed `auto_exposure=1 (Manual Mode)`). Glint works around it by owning the stream (`useMediaStream`), setting `continuous` before start and again before releasing.

## Credit budget (measured 2026-11-10)

Portal: **1 credit = 30 s of live measurement**, free tier 100 credits, renews 2026-12-10 (after the deadline). Day 0 used 13 credits (about 6.5 min across 5 starts). **87 left, about 43 min.**

| Reserve | Credits | Minutes |
|---|---|---|
| Guided ground-truth capture (1–2 runs) | 10 | 5 |
| Live checks of gestures, Days 2–7 | 20 | 10 |
| Demo video takes | 35 | 17 |
| Clean-machine / packaged-build test | 8 | 4 |
| Slack | 14 | 7 |

Everything else runs on replay. Stop live testing if the balance falls below 45 before Day 9.
