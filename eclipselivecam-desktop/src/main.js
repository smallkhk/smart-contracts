const { app, BrowserWindow, session, shell, Menu } = require('electron');
const path = require('path');

const APP_URL  = 'https://eclipselivecam.com';
const APP_NAME = 'EclipseLiveCam';

let mainWindow = null;
let splashWindow = null;

// ── PERMISSIONS ─────────────────────────────────────────────────────────────
// Auto-grant camera, microphone, and display-capture so the live feature works
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['media', 'camera', 'microphone', 'display-capture', 'notifications'];
    callback(allowed.includes(permission));
  });
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    const allowed = ['media', 'camera', 'microphone', 'display-capture', 'notifications'];
    return allowed.includes(permission);
  });
  createSplash();
});

// ── SPLASH WINDOW ────────────────────────────────────────────────────────────
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 320,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    center: true,
    skipTaskbar: true,
    webPreferences: { contextIsolation: true },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.once('ready-to-show', () => splashWindow.show());

  // After 3 seconds, open main window
  setTimeout(createMain, 3000);
}

// ── MAIN WINDOW ──────────────────────────────────────────────────────────────
function createMain() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: APP_NAME,
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#050810',
      symbolColor: '#38bdf8',
      height: 36,
    },
    backgroundColor: '#050810',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      // Allow camera/mic in renderer
      allowRunningInsecureContent: false,
    },
  });

  // Remove default menu bar (keeps it clean like a real app)
  Menu.setApplicationMenu(buildMenu());

  // Load your live site
  mainWindow.loadURL(APP_URL);

  // Show window once page starts loading (looks smooth after splash)
  mainWindow.webContents.once('did-start-loading', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
  });

  // Fallback: show after 8 seconds even if loading is slow
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
      mainWindow.show();
    }
  }, 8000);

  // Open external links in system browser, not inside the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── MENU ─────────────────────────────────────────────────────────────────────
function buildMenu() {
  return Menu.buildFromTemplate([
    {
      label: APP_NAME,
      submenu: [
        { label: 'About EclipseLiveCam', click: () => shell.openExternal(APP_URL) },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', click: () => mainWindow?.webContents.reloadIgnoringCache() },
        { type: 'separator' },
        { label: 'Zoom In',  accelerator: 'CmdOrCtrl+Plus',  click: () => { const z = mainWindow?.webContents.getZoomFactor(); mainWindow?.webContents.setZoomFactor(Math.min(z + 0.1, 3)); } },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-',     click: () => { const z = mainWindow?.webContents.getZoomFactor(); mainWindow?.webContents.setZoomFactor(Math.max(z - 0.1, 0.5)); } },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0',  click: () => mainWindow?.webContents.setZoomFactor(1) },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', accelerator: 'F11', click: () => mainWindow?.setFullScreen(!mainWindow.isFullScreen()) },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Minimize', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: 'Close',    accelerator: 'CmdOrCtrl+W', role: 'close' },
      ],
    },
  ]);
}

// ── APP LIFECYCLE ─────────────────────────────────────────────────────────────
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMain();
});
