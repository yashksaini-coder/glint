# Glint

Type, speak, and control a screen with your eyes and your breath. Built on the [Presage SmartSpectra](https://smartspectra.presagetech.com/docs/nodejs) Node SDK.

Glint is a switch-access keyboard for people who can't reliably use their hands or voice. A highlight scans the board; **raise your eyebrows** to select, **breathe out slowly** to speak the sentence aloud and copy it. Back/delete are keys on the board (`↩`, `⌫`). A keyboard or physical switch works too: `Space` select, `Enter` speak, `Esc` stop.

The top row holds **quick phrases** ("Yes", "I need water", …): selecting one speaks it straight away. A carer can edit them, the scan speed and SDK telemetry (off by default) under **Settings** on the start screen. Settings are the only thing Glint stores (`settings.json` in the app's user-data folder); **Forget everything** deletes it.

Work in progress (Presage SmartSpectra challenge entry).

## Run

Needs Node ≥ 20 and a free API key from [physiology.presagetech.com](https://physiology.presagetech.com/auth/login).

```bash
npm install
cp .env.example .env   # put your key in PRESAGE_API_KEY
npm start              # GLINT_DEVTOOLS=1 npm start shows the console
```

No key or camera? Choose **Try a recorded session** on the first screen: it replays a recorded session (numbers only, no video) through the same gesture detectors.

Linux speech: Chromium has no built-in voice on most distros, so Glint falls back to `espeak-ng` (`sudo pacman -S espeak-ng` / `sudo apt install espeak-ng`). Without it, text is still copied.

## Develop

```bash
npm test         # gesture detectors (on recordings/guided.jsonl) + scanner
npm run smoke    # launches the app, replays, types and speaks via simulated switch presses
```

Linux x64 (glibc ≥ 2.35), Windows x64 and macOS arm64 are supported by the SDK.
