// Scuba Browser - Preload script for enhanced security
const { contextBridge, ipcRenderer } = require('electron');

// Input validation helper
function validateInput(input, type = 'string', maxLength = 1000) {
    if (typeof input !== type) return false;
    if (type === 'string' && input.length > maxLength) return false;
    return true;
}

// URL validation helper
function isValidUrl(url) {
    try {
        const urlObj = new URL(url);
        return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
        return false;
    }
}

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('scubaAPI', {
    // Window controls
    windowControls: {
        minimize: () => ipcRenderer.invoke('window-minimize'),
        maximize: () => ipcRenderer.invoke('window-maximize'),
        close: () => ipcRenderer.invoke('window-close'),
        isMaximized: () => ipcRenderer.invoke('window-is-maximized')
    },
    
    // Navigation (with validation)
    navigate: (url) => {
        if (!validateInput(url, 'string', 2048) || !isValidUrl(url)) {
            throw new Error('Invalid URL provided');
        }
        return ipcRenderer.invoke('navigate-to', url);
    },
    
    // Settings (with validation)
    getSettings: () => ipcRenderer.invoke('get-settings'),
    setSetting: (key, value) => {
        if (!validateInput(key, 'string', 100)) {
            throw new Error('Invalid setting key');
        }
        return ipcRenderer.invoke('set-setting', key, value);
    },
    
    // Browser info
    getBrowserInfo: () => ({
        name: 'Scuba Browser',
        version: '1.0.0',
        userAgent: navigator.userAgent,
        platform: process.platform,
        isDevelopment: process.argv.includes('--dev')
    }),
    
    // Utility functions
    utils: {
        sanitizeHtml: (html) => {
            // Basic HTML sanitization
            return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                      .replace(/javascript:/gi, '')
                      .replace(/on\w+\s*=/gi, '');
        },
        escapeHtml: (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }
});

// Enhanced security - completely isolate the renderer
Object.freeze(contextBridge);
Object.freeze(ipcRenderer);

// Remove any potential Node.js globals
delete window.require;
delete window.exports;
delete window.module;
delete window.process;
delete window.__dirname;
delete window.__filename;
delete window.global;
delete window.Buffer;
