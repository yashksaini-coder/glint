// Bundled by esbuild: a sandboxed preload can only require('electron'), so the SDK bridge is inlined.
import '@smartspectra/node-sdk/preload';
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('glint', {
  apiKey: (): Promise<string> => ipcRenderer.invoke('glint:apiKey'),
  record: (on: boolean): Promise<string | null> => ipcRenderer.invoke('glint:record', on),
  frame: (line: string) => ipcRenderer.send('glint:frame', line),
  copy: (text: string): Promise<void> => ipcRenderer.invoke('glint:copy', text),
  replay: (): Promise<string> => ipcRenderer.invoke('glint:replay'),
  speak: (text: string): Promise<boolean> => ipcRenderer.invoke('glint:speak', text),
  settings: {
    get: () => ipcRenderer.invoke('glint:settings:get'),
    set: (s: unknown) => ipcRenderer.invoke('glint:settings:set', s),
    forget: () => ipcRenderer.invoke('glint:settings:forget'),
  },
});
