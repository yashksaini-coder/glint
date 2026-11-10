// Usage: node tools/smoke.ts [screenshot.png]
// End-to-end check with no camera and no credits: launches the app, chooses the recorded session,
// types with simulated switch presses (Space), commits (Enter), asserts, and saves a screenshot.
import assert from 'node:assert/strict';
import { launch, sleep } from './cdp.ts';

const { js, key, shot, close } = await launch();
try {
  await sleep(500);
  assert.equal(await js(`document.getElementById('consent').hidden`), false, 'starts on consent');
  // Settings round trip through main's sanitize + file; ends with Forget so no file is left behind.
  await js(`(() => { document.getElementById('settings').open = true; const d = document.getElementById('dwell'); d.value = '1700'; d.dispatchEvent(new Event('input'));
    document.getElementById('phrases').value = 'Hello\\n\\n  Call   my nurse  '; document.getElementById('settings-save').click(); })()`);
  await sleep(400);
  assert.equal(await js(`document.getElementById('dwell-label').textContent`), '1.7 s');
  assert.equal(await js(`document.getElementById('phrases').value`), 'Hello\nCall my nurse', 'phrases sanitized by main');
  await shot((process.argv[2] ?? 'smoke.png').replace(/\.png$/, '-settings.png'));
  await js(`document.getElementById('settings-forget').click()`);
  await sleep(400);
  assert.equal(await js(`document.getElementById('dwell-label').textContent`), '1.0 s', 'forget restores defaults');
  assert.match(await js(`document.getElementById('phrases').value`), /^Yes\nNo/);

  await js(`document.getElementById('go-replay').click()`);
  await sleep(800);
  assert.equal(await js(`document.getElementById('board').hidden`), false, 'replay goes straight to the board');

  // Quick phrase: row 0 is the phrase row; enter it and take its first phrase straight away.
  const phrase = await js(`document.querySelector('.krow.phrases .key')?.textContent`);
  assert.ok(phrase, 'phrase row is shown');
  await key(' ', 'Space');            // enter phrase row
  await key(' ', 'Space');            // first phrase
  await sleep(600);
  assert.equal(await js(`document.getElementById('last').textContent`), `Last: “${phrase}”`, 'a phrase speaks at once');
  assert.equal(await js(`document.getElementById('output').textContent`), '', 'and does not touch the text');

  // Type "e": wait one dwell (highlight → letters row 1), enter it, wait one dwell (→ col 1 'E'), select.
  // Each wait is 500 ms past the step, i.e. outside the 350 ms grace window.
  await sleep(900);                   // 1500 ms since the last select
  await key(' ', 'Space');
  await sleep(1500);
  await key(' ', 'Space');
  assert.equal(await js(`document.getElementById('output').textContent`), 'e');

  await key('Enter', 'Enter');
  await sleep(600);
  assert.equal(await js(`document.getElementById('output').textContent`), '', 'commit clears the text');
  assert.match(await js(`document.getElementById('last').textContent`), /“e”/);
  assert.match(await js(`document.getElementById('toast').textContent`), /copied to clipboard/i);

  await sleep(5000); // let replayed signals fill the strip
  await shot(process.argv[2] ?? 'smoke.png');
  await key('Escape', 'Escape');
  await sleep(300);
  assert.equal(await js(`document.getElementById('consent').hidden`), false, 'Esc returns to consent');
  console.log('smoke OK');
} finally {
  close();
}
