// Bundled by esbuild: a sandboxed preload can only require('electron'), so the SDK bridge is inlined.
import '@smartspectra/node-sdk/preload';
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('glint', {
  apiKey: (): Promise<string> => ipcRenderer.invoke('glint:apiKey'),
  record: (on: boolean): Promise<string | null> => ipcRenderer.invoke('glint:record', on),
  frame: (line: string) => ipcRenderer.send('glint:frame', line),
});
