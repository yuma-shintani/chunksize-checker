import { contextBridge, ipcRenderer } from 'electron'

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      selectFiles: () => ipcRenderer.invoke('select-files'), // 複数ファイル選択
      processFile: (filePath) => ipcRenderer.invoke('process-file', filePath)
    })
  } catch (error) {
    console.error(error)
  }
}
