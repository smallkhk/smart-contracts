const { app, BrowserWindow, session, shell, Menu, ipcMain, nativeTheme } = require('electron');
const path = require('path');
const fs   = require('fs');

const APP_URL  = 'https://eclipselivecam.com/studio.html';
const APP_NAME = 'EclipseLiveCam';
const VERSION  = app.getVersion();

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
ipcMain.handle('toggle-always-on-top', (e, val) => mainWindow?.setAlwaysOnTop(val));

// ── PERMISSIONS ───────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => {
    cb(['media','camera','microphone','display-capture','notifications'].includes(permission));
  });
  session.defaultSession.setPermissionCheckHandler((wc, permission) => {
    return ['media','camera','microphone','display-capture','notifications'].includes(permission);
  });

  // Apply saved settings
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
    width:     s.width    || 1300,
    height:    s.height   || 840,
    minWidth:  940,
    minHeight: 620,
    show: false,
    frame: false,          // we draw our own title bar
    title: APP_NAME,
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    backgroundColor: '#0c0c0e',
    alwaysOnTop: !!s.alwaysOnTop,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
    },
  });

  // Save window size on resize
  mainWindow.on('resized', () => {
    const [w, h] = mainWindow.getSize();
    const cs = loadSettings(); cs.width = w; cs.height = h; saveSettings(cs);
  });

  mainWindow.loadFile(path.join(__dirname, 'app.html'));

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

  Menu.setApplicationMenu(null); // no menu bar
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMain(); });
