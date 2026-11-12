// Renders the share images from the built site (run `npm run build` first, without NEXT_PUBLIC_BASE_PATH).
//   npm run og      (uses the app's Electron: the repo root has it)
// Writes public/og.png (1200x630, docs) and ../docs/img/social-preview.png (1280x640, GitHub repo preview).
// Reduced motion is forced, so the hero stack is its complete still frame.
const { app, BrowserWindow } = require('electron');
const { createServer } = require('node:http');
const { existsSync, readFileSync, statSync, writeFileSync } = require('node:fs');
const path = require('node:path');

app.commandLine.appendSwitch('force-prefers-reduced-motion');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const out = path.join(__dirname, '..', 'out');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };

app.whenReady().then(async () => {
  const server = createServer((q, r) => {
    const p = decodeURIComponent(q.url.split('?')[0]);
    for (const c of [p, p + '.html', path.join(p, 'index.html')]) {
      const f = path.join(out, c);
      if (existsSync(f) && statSync(f).isFile()) { r.writeHead(200, { 'content-type': types[path.extname(f)] ?? 'application/octet-stream' }); return r.end(readFileSync(f)); }
    }
    r.writeHead(404); r.end();
  }).listen(0);
  try {
    const port = server.address().port;
    const win = new BrowserWindow({ show: false, width: 1400, height: 900, useContentSize: true, webPreferences: { backgroundThrottling: false, offscreen: true } });
    await win.loadURL(`http://localhost:${port}/og-card`);
    await win.webContents.executeJavaScript('document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 800)))');
    const targets = { docs: path.join(__dirname, '..', 'public', 'og.png'), repo: path.join(__dirname, '..', '..', 'docs', 'img', 'social-preview.png') };
    for (const [id, file] of Object.entries(targets)) {
      // The window is clamped to the screen, so bring each card into view before measuring it.
      const rect = await win.webContents.executeJavaScript(`(() => { const el = document.getElementById('${id}'); el.scrollIntoView({ block: 'start' }); const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }; })()`);
      await new Promise((r) => setTimeout(r, 400));
      const img = await win.webContents.capturePage(rect);
      writeFileSync(file, img.toPNG());
      console.log(`${path.relative(process.cwd(), file)} ${img.getSize().width}x${img.getSize().height}`);
    }
    app.exit(0);
  } catch (e) { console.error(e); app.exit(1); } finally { server.close(); }
});
