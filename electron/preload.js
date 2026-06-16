// Preload script — runs in an isolated context with access to Node APIs and
// exposes only a tiny, explicit surface to the renderer via contextBridge.
// This lets us keep contextIsolation on and nodeIntegration off in the renderer.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cvmate', {
  // Trigger the native "save as PDF" flow handled in the main process.
  exportPdf: () => ipcRenderer.invoke('export-pdf'),
  // Marker so the renderer can reliably detect it's running inside Electron.
  isElectron: true
});
