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
