// Launch the app with remote debugging and drive its page over the Chrome DevTools Protocol.
// Shared by tools/smoke.ts and tools/screenshots.ts. No camera, no credits: callers use replay.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function launch(port = 9333) {
  const proc = spawn('npx', ['electron', '.', `--remote-debugging-port=${port}`], { stdio: 'ignore', detached: true });
  let target: { webSocketDebuggerUrl: string } | undefined;
  for (let i = 0; i < 40 && !target; i++) {
    await sleep(500);
    target = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json())
      .then((ts) => ts.find((t: { type: string }) => t.type === 'page')).catch(() => undefined);
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
  const shot = async (file: string) => writeFileSync(file, Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  const close = () => { ws.close(); try { process.kill(-proc.pid!, 'SIGTERM'); } catch { /* already gone */ } };
  await sleep(500);
  return { call, js, key, shot, close };
}
