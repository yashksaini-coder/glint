// Usage: node tools/board-gif.ts   — records docs/img/board.gif from the real app in replay mode
// (no camera, no face, no credits): the highlight scans and "hi" is typed with simulated switch presses.
// It stops before speaking, because a GIF has no sound to show it with.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { launch, sleep } from './cdp.ts';

const FPS = 8, W = 1000, H = 760, DWELL = 1000;
const frames = mkdtempSync(join(tmpdir(), 'glint-gif-'));
const { call, js, key, close } = await launch(9336);
let n = 0, recording = true;
const recorder = (async () => {
  while (recording) {
    const t = Date.now();
    const shot = await call('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(frames, `f${String(n++).padStart(4, '0')}.png`), Buffer.from(shot.data, 'base64'));
    await sleep(Math.max(0, 1000 / FPS - (Date.now() - t)));
  }
})();
// Press 500 ms into a highlight step, outside the scanner's 350 ms grace window.
const pick = async (steps: number) => { await sleep(steps ? steps * DWELL + 500 : 50); await key(' ', 'Space'); };

try {
  await call('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await js(`document.head.append(Object.assign(document.createElement('style'), { textContent: '::-webkit-scrollbar { display: none }' }))`);
  const pos: Record<string, [number, number]> = {};
  await js(`document.getElementById('go-replay').click()`);
  // The scanner starts at row 0 when the board opens, so step counts run from this moment.
  (await js(`[...document.querySelectorAll('.krow')].map(r => [...r.querySelectorAll('.key')].map(k => k.textContent))`) as string[][])
    .forEach((row, r) => row.forEach((k, c) => (pos[k] ??= [r, c])));
  for (const ch of 'HI') { const [r, c] = pos[ch]; await pick(r); await pick(c); }
  await sleep(2500);                          // hold on the result
} finally {
  recording = false; await recorder; close();
}

const out = 'docs/img/board.gif';
mkdirSync('docs/img', { recursive: true });
const palette = join(frames, 'palette.png');
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', join(frames, 'f%04d.png'), '-vf', 'scale=760:-1:flags=lanczos,palettegen=stats_mode=diff', palette]);
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', join(frames, 'f%04d.png'), '-i', palette, '-lavfi', 'scale=760:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4', '-loop', '0', out]);
rmSync(frames, { recursive: true, force: true });
console.log(`${out}: ${n} frames at ${FPS} fps`);
