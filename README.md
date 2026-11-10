# Glint

Type, speak, and control a screen with your eyes and your breath. Built on the [Presage SmartSpectra](https://smartspectra.presagetech.com/docs/nodejs) Node SDK.

Work in progress. Right now this is the Day-0 probe: a consent screen, then a live readout of the SDK signals.

## Run

Needs Node ≥ 20 and a free API key from [physiology.presagetech.com](https://physiology.presagetech.com/auth/login).

```bash
npm install
cp .env.example .env   # put your key in PRESAGE_API_KEY
npm start              # GLINT_DEVTOOLS=1 npm start shows the console
```

Linux x64 (glibc ≥ 2.35), Windows x64 and macOS arm64 are supported by the SDK.
