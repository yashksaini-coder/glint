// Usage: node tools/screenshots.ts   — regenerates docs/img/*.png from the real app in replay mode
// (no camera, no face, no credits). Assumes default settings (phrase row on top, 1.0 s scan speed).
import { mkdirSync } from 'node:fs';
import { launch, sleep } from './cdp.ts';

const OUT = 'docs/img';
mkdirSync(OUT, { recursive: true });
const { call, js, key, shot, close } = await launch(9334);
const viewport = (height: number) => call('Emulation.setDeviceMetricsOverride', { width: 1100, height, deviceScaleFactor: 1, mobile: false });
const DWELL = 1000;
// Highlight index n is reached n dwells after the last select; press 500 ms into it (outside the grace window).
const pick = async (n: number) => { await sleep(n ? n * DWELL + 500 : 50); await key(' ', 'Space'); };
const LETTER_ROW: Record<string, [number, number]> = {}; // letter -> [row, col] on the board, phrase row included
await js(`document.head.append(Object.assign(document.createElement('style'), { textContent: '::-webkit-scrollbar { display: none }' }))`); // cleaner shots

try {
  await viewport(720);
  await shot(`${OUT}/consent.png`);

  await viewport(1180);
  await js(`document.getElementById('settings').open = true; scrollTo(0, document.body.scrollHeight)`);
  await sleep(200);
  await shot(`${OUT}/settings.png`);
  await js(`document.getElementById('settings').open = false; scrollTo(0, 0)`);

  await viewport(900);
  await js(`document.getElementById('go-replay').click()`);
  await sleep(800);
  const rows: string[][] = await js(`[...document.querySelectorAll('.krow')].map(r => [...r.querySelectorAll('.key')].map(k => k.textContent))`);
  rows.forEach((r, ri) => r.forEach((k, ci) => (LETTER_ROW[k] ??= [ri, ci])));
  for (const ch of 'HELLO␣') { const [r, c] = LETTER_ROW[ch]; await pick(r); await pick(c); }
  await pick(1);                      // enter the letters row (␣ E T A O ⌫)
  await sleep(2 * DWELL + 400);       // highlight on T, mid-scan
  await shot(`${OUT}/board.png`);
  console.log(`typed: "${await js(`document.getElementById('output').textContent`)}" → ${OUT}/{consent,settings,board}.png`);
} finally {
  close();
}
