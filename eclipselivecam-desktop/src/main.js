const { app, BrowserWindow, session, shell, Menu, ipcMain, nativeTheme } = require('electron');
const path = require('path');
const fs   = require('fs');

const APP_URL      = 'https://eclipselivecam.com/studio.html';
const APP_NAME     = 'EclipseLiveCam';
const VERSION      = app.getVersion();
const LICENSE_API  = 'http://54.241.57.251:4000';

let mainWindow = null;
let splashWindow = null;

// ── SETTINGS STORE ────────────────────────────────────────────────────────────
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
function loadSettings() {
  try { return JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch(e) { return {}; }
}
function saveSettings(s) {
  fs.writeFileSync(settingsPath, JSON.stringify(s, null, 2));
}

// ── IPC HANDLERS ─────────────────────────────────────────────────────────────
ipcMain.handle('get-settings', () => loadSettings());
ipcMain.handle('save-settings', (e, s) => { saveSettings(s); return true; });
ipcMain.handle('get-version', () => VERSION);
ipcMain.handle('get-app-url', () => APP_URL);
ipcMain.handle('minimize',    () => mainWindow?.minimize());
ipcMain.handle('maximize',    () => { mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize(); });
ipcMain.handle('close',       () => mainWindow?.close());
ipcMain.handle('is-maximized',() => mainWindow?.isMaximized() ?? false);
ipcMain.handle('reload-studio',()=> mainWindow?.webContents.send('reload-studio'));
ipcMain.handle('clear-cache', async () => { await session.defaultSession.clearCache(); return true; });
ipcMain.handle('open-external', (e, url) => shell.openExternal(url));
ipcMain.handle('get-cameras', async () => {
  try {
    const sources = await mainWindow?.webContents.executeJavaScript(
      'navigator.mediaDevices.enumerateDevices().then(d=>d.filter(x=>x.kind==="videoinput").map(x=>({deviceId:x.deviceId,label:x.label})))'
    );
    return sources || [];
  } catch(e) { return []; }
});
ipcMain.handle('toggle-always-on-top', (e, val) => mainWindow?.setAlwaysOnTop(val));

// ── ACTIVATION ────────────────────────────────────────────────────────────────
ipcMain.handle('activate-key', async (e, key) => {
  try {
    const res = await fetch(`${LICENSE_API}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    const data = await res.json();
    if (data.valid) {
      const s = loadSettings();
      s.activationKey = key;
      saveSettings(s);
    }
    return data;
  } catch(e) {
    return { valid: false, reason: 'Could not reach activation server. Check your internet connection.' };
  }
});

ipcMain.handle('activation-success', () => {
  mainWindow?.loadFile(path.join(__dirname, 'app.html'));
});

// ── PERMISSIONS ───────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  const ALLOWED = ['media','camera','microphone','display-capture','notifications','desktopCapture'];

  session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => cb(ALLOWED.includes(permission)));
  session.defaultSession.setPermissionCheckHandler((wc, permission) => ALLOWED.includes(permission));

  const webviewSession = session.fromPartition('persist:eclipse');
  webviewSession.setPermissionRequestHandler((wc, permission, cb) => cb(ALLOWED.includes(permission)));
  webviewSession.setPermissionCheckHandler((wc, permission) => ALLOWED.includes(permission));

  webviewSession.setDevicePermissionHandler(() => true);
  session.defaultSession.setDevicePermissionHandler(() => true);

  const s = loadSettings();
  if (s.alwaysOnTop) app.once('browser-window-created', (e, win) => win.setAlwaysOnTop(true));

  createSplash();
});

// ── SPLASH ────────────────────────────────────────────────────────────────────
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 480, height: 320, frame: false, transparent: true,
    alwaysOnTop: true, resizable: false, center: true, skipTaskbar: true,
    webPreferences: { contextIsolation: true },
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.once('ready-to-show', () => splashWindow.show());
  setTimeout(createMain, 3000);
}

// ── MAIN WINDOW ───────────────────────────────────────────────────────────────
function createMain() {
  const s = loadSettings();
  mainWindow = new BrowserWindow({
    width:     s.width    || 1440,
    height:    s.height   || 860,
    minWidth:  1200,
    minHeight: 700,
    show: false,
    frame: false,
    title: APP_NAME,
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    backgroundColor: '#0c0c0e',
    alwaysOnTop: !!s.alwaysOnTop,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      webSecurity: false,
      partition: 'persist:eclipse',
    },
  });

  mainWindow.on('resized', () => {
    const [w, h] = mainWindow.getSize();
    const cs = loadSettings(); cs.width = w; cs.height = h; saveSettings(cs);
  });

  // Show activation screen if not yet activated
  const activated = !!loadSettings().activationKey;
  if (activated) {
    mainWindow.loadFile(path.join(__dirname, 'app.html'));
  } else {
    mainWindow.loadFile(path.join(__dirname, 'activate.html'));
  }

  mainWindow.webContents.once('did-finish-load', () => {
    if (splashWindow && !splashWindow.isDestroyed()) { splashWindow.close(); splashWindow = null; }
    mainWindow.show();
    if (s.startMaximized) mainWindow.maximize();
  });
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      if (splashWindow && !splashWindow.isDestroyed()) { splashWindow.close(); splashWindow = null; }
      mainWindow.show();
    }
  }, 9000);

  mainWindow.on('maximize',   () => mainWindow.webContents.send('maximized', true));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('maximized', false));
  mainWindow.on('closed', () => { mainWindow = null; });

  Menu.setApplicationMenu(null);
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMain(); });
