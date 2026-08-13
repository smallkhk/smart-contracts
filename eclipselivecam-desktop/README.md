# EclipseLiveCam Desktop App

Wraps https://eclipselivecam.com into a native Windows desktop app (.exe installer).

## What you need on your PC

- **Node.js** (v18 or newer) — https://nodejs.org  
  Download the LTS version and install it. Just click Next through the installer.

- **That's it.** Everything else installs automatically.

---

## Build steps (5 minutes)

### 1. Install Node.js
Go to https://nodejs.org and download the **LTS** version. Install it.

### 2. Open this folder in a terminal
- Right-click inside the `eclipselivecam-desktop` folder
- Click **"Open in Terminal"** (or **"Open PowerShell window here"**)

### 3. Install dependencies
```
npm install
```
Wait for it to finish (downloads Electron — about 100MB).

### 4. Test it first (optional)
```
npm start
```
This opens the app without building. Make sure it looks right.

### 5. Build the .exe
```
npm run build
```

### 6. Get your installer
Find it at:
```
dist/EclipseLiveCam Setup 1.0.0.exe
```

That's the installer you can distribute. It installs EclipseLiveCam like any normal Windows app, with a Start Menu shortcut and desktop icon.

---

## File structure

```
eclipselivecam-desktop/
├── src/
│   ├── main.js          ← Electron main process (window, splash, permissions)
│   ├── splash.html      ← Animated splash screen shown at startup
│   └── installer.nsh    ← NSIS installer customization
├── assets/
│   ├── icon.ico         ← App icon (all sizes included)
│   └── icon.svg         ← Source SVG icon
├── package.json         ← App config & build settings
└── README.md            ← This file
```

---

## What the app does

- Shows an animated **EclipseLiveCam splash screen** for 3 seconds on startup
- Opens a full desktop window loading **https://eclipselivecam.com**
- **Camera and microphone are auto-approved** — no browser permission popups
- Clean title bar with the app name
- Zoom in/out with Ctrl+Plus / Ctrl+Minus
- Fullscreen with F11
- External links open in the system browser

---

## Updating the app

Since the app loads your live website, **any updates you make to the site
automatically appear in the app** — no rebuild needed. You only need to
rebuild the .exe if you want to change the app itself (icon, splash, window size).

---

## Changing the app icon

Replace `assets/icon.ico` with your own .ico file (must include 256x256 size),
then run `npm run build` again.

You can create a .ico from any image at: https://icoconvert.com
