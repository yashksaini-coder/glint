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
  await js(`document.getElementById('go-replay').click()`);
  await sleep(800);
  assert.equal(await js(`document.getElementById('board').hidden`), false, 'replay goes straight to the board');

  // Type "e": row 0 is highlighted first; select it, wait 1 dwell (→ col 1 'E'), select.
  await key(' ', 'Space');            // enter row 0
  await sleep(1500);                  // highlight moved to col 1 = E at 1000 ms; 500 ms later is past the 350 ms grace
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
