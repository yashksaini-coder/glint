import type { Sample } from '../gestures/extract.ts';

export type SourceEvents = {
  sample(s: Sample): void;
  /** ok = SDK validation is OK; hint is the SDK's own text, shown verbatim. */
  validation(ok: boolean, code: string, hint: string): void;
  /** fatal = the session is over and the camera must be released; otherwise the app only pauses. */
  error(message: string, fatal: boolean): void;
  /** Live camera preview (live source only). */
  stream?(s: MediaStream): void;
};

export type SignalSource = {
  readonly kind: 'live' | 'replay';
  start(ev: SourceEvents): Promise<void>;
  stop(): Promise<void>;
};
