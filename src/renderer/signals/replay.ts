// Replay source: plays a recorded fixture (numbers only, no video) at real-time speed, looping.
// Lets the app be built, tested, and tried by anyone without a camera or SDK credits.
import type { Sample } from '../gestures/extract.ts';
import type { SignalSource, SourceEvents } from './source.ts';

export function replaySource(jsonl: string): SignalSource {
  const samples: Sample[] = jsonl.trim().split('\n').map((l) => JSON.parse(l)).filter((r) => r.k);
  let timer: ReturnType<typeof setInterval> | null = null;

  return {
    kind: 'replay',
    async start(ev: SourceEvents) {
      if (!samples.length) throw new Error('recording has no samples');
      const t0 = samples[0].t, span = samples.at(-1)!.t - t0;
      let i = 0, loop = 0;
      const wall0 = performance.now();
      ev.validation(true, 'kOk', '');
      timer = setInterval(() => { // emit everything due, shifted so replayed timestamps keep increasing across loops
        const due = t0 + (performance.now() - wall0) * 1000 - loop * (span + 1e6);
        while (i < samples.length && samples[i].t <= due) {
          const s = samples[i++];
          ev.sample({ ...s, t: s.t + loop * (span + 1e6) } as Sample);
        }
        if (i >= samples.length) { i = 0; loop++; }
      }, 33);
    },
    async stop() { if (timer) clearInterval(timer); timer = null; },
  };
}
