import './native-path.ts'; // first: tells the SDK where the packaged native runtime lives
import { app, BrowserWindow, clipboard, ipcMain, session, shell } from 'electron';
import { execFile } from 'node:child_process';
import { appendFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { bindSmartSpectraIpc } from '@smartspectra/node-sdk/main';
import { sanitize } from '../shared/settings.ts';
import { buildSendUrl, SEND_PREFIXES } from '../shared/send.ts';

// API key: PRESAGE_API_KEY from the environment, else a .env next to the sources (npm start),
// else a .env in the user-data folder (installed app). Never bundled into the package.
for (const dir of [app.getAppPath(), app.getPath('userData')]) {
  if (process.env.PRESAGE_API_KEY) break;
  try { process.loadEnvFile(path.join(dir, '.env')); } catch { /* not there */ }
}

const recordDir = path.join(app.getAppPath(), 'recordings');
let recordFile: string | null = null;

ipcMain.handle('glint:apiKey', () => process.env.PRESAGE_API_KEY ?? '');
ipcMain.handle('glint:record', (_e, on: boolean) => {
  if (!on) return (recordFile = null);
  mkdirSync(recordDir, { recursive: true });
  recordFile = path.join(recordDir, `session-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`);
  return recordFile;
});
// Settings: the only thing Glint persists. Always sanitized at this boundary, in and out.
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
const readSettings = () => {
  try { return sanitize(JSON.parse(readFileSync(settingsFile(), 'utf8'))); } catch { return sanitize(null); }
};
ipcMain.handle('glint:settings:get', readSettings);
ipcMain.handle('glint:settings:set', (_e, x: unknown) => {
  const s = sanitize(x);
  mkdirSync(path.dirname(settingsFile()), { recursive: true });
  writeFileSync(settingsFile(), JSON.stringify(s, null, 2));
  return s;
});
ipcMain.handle('glint:settings:forget', () => { rmSync(settingsFile(), { force: true }); return sanitize(null); });
// Send: the renderer passes only the text. Target and recipient come from the settings file, and the
// URL is built and prefix-checked here, so the renderer cannot open an arbitrary link.
ipcMain.handle('glint:send', async (_e, text: unknown) => {
  const s = readSettings();
  const url = buildSendUrl(s, String(text ?? ''));
  if (!url) return { ok: false, reason: s.sendTarget === 'none' ? 'no send target set' : 'nothing to send' };
  if (!SEND_PREFIXES.some((p) => url.startsWith(p))) return { ok: false, reason: 'refused' };
  if (process.env.GLINT_NO_EXTERNAL === '1') return { ok: true, target: s.sendTarget, url }; // tools/smoke.ts only
  try { await shell.openExternal(url); } catch (err) { return { ok: false, reason: (err as Error).message }; }
  return { ok: true, target: s.sendTarget };
});
ipcMain.handle('glint:copy', (_e, text: string) => clipboard.writeText(String(text)));
// Fixed path only: the renderer cannot ask for arbitrary files.
ipcMain.handle('glint:replay', () => readFileSync(path.join(app.getAppPath(), 'recordings/guided.jsonl'), 'utf8'));
// Fallback when the OS exposes no Web Speech voice (stock Linux): espeak-ng if installed. Args array, no shell.
// Resolves once espeak-ng starts (not when it finishes talking), so the board does not wait on the audio.
ipcMain.handle('glint:speak', (_e, text: string) => new Promise<boolean>((resolve) => {
  const p = execFile('espeak-ng', ['--', String(text).slice(0, 500)], () => {});
  p.once('spawn', () => resolve(true)).once('error', () => resolve(false));
}));
ipcMain.on('glint:frame', (_e, line: string) => { if (recordFile) appendFileSync(recordFile, line + '\n'); });

app.whenReady().then(() => {
  // Camera only, video only, only our own file:// page.
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb, details) => {
    const url = (details as { requestingUrl?: string }).requestingUrl || wc.getURL();
    const types = (details as { mediaTypes?: string[] }).mediaTypes ?? [];
    cb(permission === 'media' && types.length === 1 && types[0] === 'video' && url.startsWith('file://'));
  });

  const win = new BrowserWindow({
    width: 1100, height: 760, backgroundColor: '#101218', title: 'Glint',
    icon: path.join(app.getAppPath(), 'build/icon.png'), // Linux taskbar; installers use build/ via electron-builder
    webPreferences: { preload: path.join(app.getAppPath(), 'dist/preload.cjs'), contextIsolation: true, sandbox: true },
  });
  bindSmartSpectraIpc(win);
  win.webContents.on('console-message', (e) => { if (e.message.startsWith('[glint]')) console.log(e.message); });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.loadFile(path.join(app.getAppPath(), 'src/renderer/index.html'));
  if (process.env.GLINT_DEVTOOLS === '1') win.webContents.openDevTools({ mode: 'detach' });
});

app.on('window-all-closed', () => app.quit());
