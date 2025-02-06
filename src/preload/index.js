import { contextBridge, ipcRenderer } from 'electron'

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
