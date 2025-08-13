const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  console.log('Creating window...');
  
  const iconPath = path.join(__dirname, 'ui', 'icon.png');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Remove default title bar for browser-like look
    titleBarStyle: 'hidden', // Hide title bar but keep traffic lights on macOS
    icon: iconPath, // Set custom icon
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      webviewTag: true, // Enable webview for the browser functionality
      preload: path.join(__dirname, 'ui', 'preload.js')
    },
    show: false, // Don't show until ready to prevent flash
    backgroundColor: '#8C9CE3'
  });

  console.log('Loading HTML file...');
  mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));
  
  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus on address bar when window opens
    mainWindow.webContents.executeJavaScript(`
      if (document.getElementById('address-bar')) {
        document.getElementById('address-bar').focus();
      }
    `);
  });
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // Development tools for debugging
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
  
  console.log('Window created successfully!');
}

console.log('App starting...');

app.whenReady().then(() => {
  console.log('App ready, creating window...');
  createWindow();
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Custom window controls for frameless window
ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});
