const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  windowControl: (action) => ipcRenderer.send('window-control', action),
  popoutPanel: (panelName, channelId) => ipcRenderer.send('popout-panel', { panelName, channelId }),
  
  sendStateSync: (payload) => ipcRenderer.send('sync-state', payload),
  onStateSync: (callback) => {
    const handler = (event, payload) => callback(payload);
    ipcRenderer.on('sync-state', handler);
    return () => ipcRenderer.removeListener('sync-state', handler);
  },
  
  onWindowMaximized: (callback) => {
    const handler = (event, isMaximized) => callback(isMaximized);
    ipcRenderer.on('window-maximized', handler);
    return () => ipcRenderer.removeListener('window-maximized', handler);
  }
});
