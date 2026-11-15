// Bridge exposed by src/preload/index.ts.
interface Window {
  glint: {
    apiKey(): Promise<string>;
    record(on: boolean): Promise<string | null>;
    frame(line: string): void;
    copy(text: string): Promise<void>;
    replay(): Promise<string>;
    speak(text: string): Promise<boolean>;
    /** Opens the app picked in settings with the text filled in. url is set only under GLINT_NO_EXTERNAL=1. */
    send(text: string): Promise<{ ok: true; target: string; url?: string } | { ok: false; reason: string }>;
    settings: {
      get(): Promise<import('../shared/settings.ts').Settings>;
      set(s: unknown): Promise<import('../shared/settings.ts').Settings>;
      forget(): Promise<import('../shared/settings.ts').Settings>;
    };
  };
}
