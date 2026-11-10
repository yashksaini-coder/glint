// electron tools/diagram/render.cjs <page.html> <out.png> <width> <height>
// Rasterizes the diagram page at 2x. Electron, not rsvg: GitHub won't load web fonts in an SVG <img>,
// and rsvg ignores @font-face, so the PNG is the published artifact.
const { app, BrowserWindow } = require('electron');
app.commandLine.appendSwitch('force-device-scale-factor', '2');
const { writeFileSync } = require('node:fs');
const path = require('node:path');
// Resolve against the caller's cwd: loadFile would resolve relative paths against this script's folder.
const [inFile, outFile] = process.argv.slice(-4, -2).map((p) => path.resolve(p));
const [w, h] = process.argv.slice(-2);
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: +w, height: +h, useContentSize: true, webPreferences: { zoomFactor: 1 } });
  await win.loadFile(inFile);
  await win.webContents.executeJavaScript('document.fonts.ready.then(() => new Promise(r => setTimeout(r, 300)))');
  win.webContents.setZoomFactor(1);
  const img = await win.webContents.capturePage({ x: 0, y: 0, width: +w, height: +h });
  writeFileSync(outFile, img.toPNG());
  console.log(`${outFile} written (${img.getSize().width}x${img.getSize().height})`);
  app.quit();
}).catch((e) => { console.error(e); app.exit(1); }); // never hang on a bad path
