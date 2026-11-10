// Usage: node tools/smoke.ts [screenshot.png]
// End-to-end check with no camera and no credits: launches the app, chooses the recorded session,
// types with simulated switch presses (Space), commits (Enter), asserts, and saves a screenshot.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT = 9333;
const app = spawn('npx', ['electron', '.', `--remote-debugging-port=${PORT}`], { stdio: 'ignore', detached: true });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
try {
  let target: { webSocketDebuggerUrl: string } | undefined;
  for (let i = 0; i < 40 && !target; i++) {
    await sleep(500);
    target = await fetch(`http://127.0.0.1:${PORT}/json`).then((r) => r.json()).then((ts) => ts.find((t: any) => t.type === 'page')).catch(() => undefined);
  }
  assert.ok(target, 'app window did not appear');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const call = (method: string, params: object = {}) => new Promise<any>((resolve) => {
    const my = ++id;
    const on = (ev: MessageEvent) => { const m = JSON.parse(ev.data); if (m.id === my) { ws.removeEventListener('message', on); resolve(m.result); } };
    ws.addEventListener('message', on);
    ws.send(JSON.stringify({ id: my, method, params }));
  });
  const js = async (expr: string) => (await call('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.value;
  const key = (k: string, code: string) => js(`dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(k)}, code: ${JSON.stringify(code)} }))`);

  await sleep(500);
  assert.equal(await js(`document.getElementById('consent').hidden`), false, 'starts on consent');
  // Settings round trip through main's sanitize + file; ends with Forget so no file is left behind.
  await js(`(() => { document.getElementById('settings').open = true; const d = document.getElementById('dwell'); d.value = '1700'; d.dispatchEvent(new Event('input'));
    document.getElementById('phrases').value = 'Hello\\n\\n  Call   my nurse  '; document.getElementById('settings-save').click(); })()`);
  await sleep(400);
  assert.equal(await js(`document.getElementById('dwell-label').textContent`), '1.7 s');
  assert.equal(await js(`document.getElementById('phrases').value`), 'Hello\nCall my nurse', 'phrases sanitized by main');
  const settingsShot = await call('Page.captureScreenshot', { format: 'png' });
  writeFileSync((process.argv[2] ?? 'smoke.png').replace(/\.png$/, '-settings.png'), Buffer.from(settingsShot.data, 'base64'));
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
  const shot = await call('Page.captureScreenshot', { format: 'png' });
  writeFileSync(process.argv[2] ?? 'smoke.png', Buffer.from(shot.data, 'base64'));
  await key('Escape', 'Escape');
  await sleep(300);
  assert.equal(await js(`document.getElementById('consent').hidden`), false, 'Esc returns to consent');
  console.log('smoke OK');
  ws.close();
} finally {
  process.kill(-app.pid!, 'SIGTERM');
}
