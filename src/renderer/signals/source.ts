import type { Sample } from '../gestures/extract.ts';

export type SourceEvents = {
  sample(s: Sample): void;
  /** ok = SDK validation is OK; hint is the SDK's own text, shown verbatim. */
  validation(ok: boolean, code: string, hint: string): void;
  error(message: string): void;
  /** Live camera preview (live source only). */
  stream?(s: MediaStream): void;
};

export type SignalSource = {
  readonly kind: 'live' | 'replay';
  start(ev: SourceEvents): Promise<void>;
  stop(): Promise<void>;
};
