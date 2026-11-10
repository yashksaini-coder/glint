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

## Guided capture, 2026-11-10 20:15 IST (`session-2026-11-10T14-45-31-468Z.jsonl`, about 5 credits)

Run with `node tools/guided.mjs <file>` and `node tools/blinkcheck.mjs <file>`. Cue clock and sample clock agree: brow windows line up to within one frame.

| Gesture (cued) | SDK signal | Landmarks | Verdict |
|---|---|---|---|
| Long eye closure, 1 s ×5 | `blinking.detected` 0 frames (1 of 4096 frames all session) | EAR never below 75% of baseline (min 0.229 vs 0.304; lid gap ≥ 10 px). Face mesh did not register a closed eye | **Not detectable in this run**; pending: were eyes fully closed? lighting? |
| Quick blink ×5 | 0 | no dip | same |
| Brow raise 1.5 s ×3 | surprise peak 76–84, ≥ 30 for only 36–264 ms | brow/IOD +40% every time, held 500–830 ms | **Landmark brow ratio works**; surprise is a weak confirm |
| Slow exhale 4 s ×3 | upperTrace (EMA 0.15): inhale +2.4…+7.9, exhale −6.0…−14.6 | — | **Trace rises on inhale, falls on exhale**, consistent 3/3, even before `stable` |
| Talking 10 s | `talking` 81% of frames | — | usable with a 1 s majority window |
| Silent 10 s | `talking` 20% of frames (30% in one exhale window) | — | raw per-frame `talking` too noisy for hard suppression |

Un-cued false positives (about 36 s): brow +20% held ≥ 300 ms ×3, so the threshold must sit nearer +30%.

## Camera check, 2026-11-10 20:27 IST (ffmpeg, no SDK session, frame deleted after)

- The camera already runs at its best mode: **1280×720 MJPG at 30 fps**. YUYV tops out at 640×480, and we request 1280×720.
- No filter: contrast, saturation, gamma and sharpness are at their defaults, auto white balance is on and auto exposure is on. Low average saturation (5.4) comes from the grey wall and grey shirt; colours elsewhere are normal.
- **The light is the limit:** mean luma 53.7 on a 16–235 scale, with the face in shadow from an overhead or behind light source, at the auto-exposure ceiling (1/30 s, gain 0).
- **Thick-framed glasses** sit over the upper eyelid line. Together with the shadow, this is the likely reason the face mesh never registered a closed eye. The brow ratio still works because landmarks 105/334 sit above the frame.

## Gesture decision (user, 2026-11-10)

Eye closure was not detectable on the guided recording, so the gesture set is now: **brow raise = select**, **slow exhale = commit (speak + copy)**, **back = a ⌫ / ↩ item on the scanned board**.

Detectors (`src/renderer/gestures/`), tuned on `recordings/guided.jsonl` with `tools/sweep.ts` and checked with `npm test`:

- **brow:** smoothed brow/IOD ratio, rise 28%, re-arm below 10%, hold 200 ms. **2/3 cued raises, 0 false selects.** The third was missed because the brow stayed at +14–26% after raise 2, so the detector never re-armed. Relaxing between selects is required by design.
- **exhale:** EMA trace fall ≥ 6 units over ≥ 2.5 s at ≤ 5 units/s, and not talking (> 50% of the last 1 s). **3/3 cued exhales, 0 during speech**, plus 2 un-cued fires that look like genuine resting slow exhales (35.9 s, 132.5 s). The product guard is that commit does nothing while the text buffer is empty.
