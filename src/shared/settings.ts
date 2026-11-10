// Settings shape + validation, shared by main (which owns the file) and renderer (which edits it).
// Stored as JSON in Electron's userData folder; "Forget everything" deletes that file.

export const DEFAULT_PHRASES = ['Yes', 'No', 'I need water', 'I need help', 'Thank you', 'Please wait'];
export const MAX_PHRASES = 6;
export const MAX_PHRASE_LEN = 40;

export const DEFAULT_SETTINGS = {
  dwellMs: 1000,
  telemetry: false, // SDK telemetry: off unless the user turns it on
  phrases: DEFAULT_PHRASES,
};
export type Settings = typeof DEFAULT_SETTINGS;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Coerce anything (file contents, renderer input) into valid settings. */
export function sanitize(x: unknown): Settings {
  const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
  const dwell = Number(o.dwellMs);
  return {
    dwellMs: Number.isFinite(dwell) ? Math.round(clamp(dwell, 500, 3000)) : DEFAULT_SETTINGS.dwellMs,
    telemetry: o.telemetry === true,
    phrases: Array.isArray(o.phrases)
      ? o.phrases.map((p) => String(p).replace(/\s+/g, ' ').trim().slice(0, MAX_PHRASE_LEN)).filter(Boolean).slice(0, MAX_PHRASES)
      : DEFAULT_PHRASES,
  };
}
