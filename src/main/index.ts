import { app, BrowserWindow, clipboard, ipcMain, session } from 'electron';
import { execFile } from 'node:child_process';
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { bindSmartSpectraIpc } from '@smartspectra/node-sdk/main';

try { process.loadEnvFile(path.join(app.getAppPath(), '.env')); } catch { /* no .env: key check below reports it */ }

const recordDir = path.join(app.getAppPath(), 'recordings');
let recordFile: string | null = null;

ipcMain.handle('glint:apiKey', () => process.env.PRESAGE_API_KEY ?? '');
ipcMain.handle('glint:record', (_e, on: boolean) => {
  if (!on) return (recordFile = null);
  mkdirSync(recordDir, { recursive: true });
  recordFile = path.join(recordDir, `session-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`);
  return recordFile;
});
ipcMain.handle('glint:copy', (_e, text: string) => clipboard.writeText(String(text)));
// Fixed path only: the renderer cannot ask for arbitrary files.
ipcMain.handle('glint:replay', () => readFileSync(path.join(app.getAppPath(), 'recordings/guided.jsonl'), 'utf8'));
// Fallback when the OS exposes no Web Speech voice (stock Linux): espeak-ng if installed. Args array, no shell.
ipcMain.handle('glint:speak', (_e, text: string) => new Promise<boolean>((resolve) =>
  execFile('espeak-ng', ['--', String(text).slice(0, 500)], (err) => resolve(!err))));
ipcMain.on('glint:frame', (_e, line: string) => { if (recordFile) appendFileSync(recordFile, line + '\n'); });

app.whenReady().then(() => {
  // Camera only, video only, only our own file:// page.
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb, details) => {
    const url = (details as { requestingUrl?: string }).requestingUrl || wc.getURL();
    const types = (details as { mediaTypes?: string[] }).mediaTypes ?? [];
    cb(permission === 'media' && types.length === 1 && types[0] === 'video' && url.startsWith('file://'));
  });

  const win = new BrowserWindow({
    width: 1100, height: 760, backgroundColor: '#101218',
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
