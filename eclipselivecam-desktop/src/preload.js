const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('eclipseApp', {
  getSettings:      ()    => ipcRenderer.invoke('get-settings'),
  saveSettings:     (s)   => ipcRenderer.invoke('save-settings', s),
  getVersion:       ()    => ipcRenderer.invoke('get-version'),
  getAppUrl:        ()    => ipcRenderer.invoke('get-app-url'),
  minimize:         ()    => ipcRenderer.invoke('minimize'),
  maximize:         ()    => ipcRenderer.invoke('maximize'),
  close:            ()    => ipcRenderer.invoke('close'),
  isMaximized:      ()    => ipcRenderer.invoke('is-maximized'),
  clearCache:       ()    => ipcRenderer.invoke('clear-cache'),
  openExternal:     (url) => ipcRenderer.invoke('open-external', url),
  toggleAlwaysOnTop:(val) => ipcRenderer.invoke('toggle-always-on-top', val),
  activateKey:      (key) => ipcRenderer.invoke('activate-key', key),
  activationSuccess:()    => ipcRenderer.invoke('activation-success'),
  onMaximized:      (cb)  => ipcRenderer.on('maximized', (e, val) => cb(val)),
  onReloadStudio:   (cb)  => ipcRenderer.on('reload-studio', cb),
});
