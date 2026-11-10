// Must be the first import of main/index.ts: the SDK resolves its native library when it is
// required, and a .so/.dll/.dylib cannot be loaded from inside app.asar. Packaged builds ship the
// platform runtime as an extra resource at resources/smartspectra/ (package.json build config).
// Set unconditionally when packaged, so the native library path can't be redirected via the environment.
import { app } from 'electron';
import path from 'node:path';

const LIB: Record<string, string> = {
  linux: 'libsmartspectra_capi.so',
  win32: 'smartspectra_capi.dll',
  darwin: 'libsmartspectra_capi.dylib',
};
if (app.isPackaged && LIB[process.platform]) {
  process.env.SMARTSPECTRA_CAPI_PATH = path.join(process.resourcesPath, 'smartspectra', LIB[process.platform]);
}
