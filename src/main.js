const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialize electron store for settings
const store = new Store();

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window with maximum performance optimizations
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // Allow loading external content
      allowRunningInsecureContent: true,
      // Performance optimizations
      enableRemoteModule: false,
      experimentalFeatures: true,
      v8CacheOptions: 'code',
      // Hardware acceleration
      offscreen: false,
      // Memory optimizations
      backgroundThrottling: false,
      // Smooth scrolling
      scrollBounce: true,
      // Preload optimizations
      preload: path.join(__dirname, 'ui', 'preload.js'),
      // Enable webview
      webviewTag: true,
      // Additional performance optimizations
      enableWebCodecs: true,
      enableBlinkFeatures: 'WebCodecs,WebGPU,WebAssemblyStreaming',
      // Memory management
      maxActiveWebContents: 10,
      // Rendering optimizations
      enableAcceleratedLayers: true
    },
    titleBarStyle: 'hiddenInset', // Clean title bar on macOS
    frame: process.platform !== 'darwin', // Frameless on macOS
    show: false, // Don't show until ready
    backgroundColor: '#8C9CE3',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    // Additional performance flags
    transparent: false, // Better performance than transparent
    hasShadow: true,
    thickFrame: false, // Reduce window chrome
    // Compositor optimizations
    paintWhenInitiallyHidden: false
  });

  // Load the main UI
  mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus on address bar when window opens
    mainWindow.webContents.executeJavaScript(`
      document.getElementById('address-bar').focus();
    `);
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Development tools
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

// Performance command line switches for maximum smoothness
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('enable-hardware-overlays');
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,VaapiVideoEncoder');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('enable-gpu-memory-buffer-compositor-resources');
app.commandLine.appendSwitch('enable-gpu-memory-buffer-video-frames');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-features', 'TranslateUI');
app.commandLine.appendSwitch('enable-smooth-scrolling');
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
app.commandLine.appendSwitch('enable-accelerated-video-decode');

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for browser functionality
ipcMain.handle('navigate-to', async (event, url) => {
  try {
    // Validate and format URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return { success: true, url };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-settings', async () => {
  return store.get('settings', {
    homepage: 'https://www.google.com',
    searchEngine: 'https://www.google.com/search?q=',
    theme: 'light'
  });
});

ipcMain.handle('set-setting', async (event, key, value) => {
  store.set(`settings.${key}`, value);
  return true;
});

// Create application menu
const template = [
  {
    label: 'Scuba',
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'close' }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
