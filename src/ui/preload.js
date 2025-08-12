// Scuba Browser - Preload script for webview security
const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the webview content
contextBridge.exposeInMainWorld('scubaAPI', {
    // Navigation
    navigate: (url) => ipcRenderer.invoke('navigate-to', url),
    
    // Settings
    getSettings: () => ipcRenderer.invoke('get-settings'),
    setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
    
    // Browser info
    getBrowserInfo: () => ({
        name: 'Scuba Browser',
        version: '1.0.0',
        userAgent: navigator.userAgent
    })
});

// Enhanced security - prevent node integration in webview content
delete window.require;
delete window.exports;
delete window.module;
