/**
 * UIManager - Handles UI state, keyboard shortcuts, and general interface management
 */
class UIManager {
    constructor() {
        this.isFullscreen = false;
        this.platform = this.detectPlatform();
        this.setupEventListeners();
        this.initializePlatformSpecificStyles();
    }

    detectPlatform() {
        if (navigator.platform.indexOf('Mac') !== -1) {
            return 'darwin';
        } else if (navigator.platform.indexOf('Win') !== -1) {
            return 'win32';
        } else {
            return 'linux';
        }
    }

    initializePlatformSpecificStyles() {
        document.body.classList.add(`platform-${this.platform}`);
    }

    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Window focus/blur
        window.addEventListener('focus', () => {
            this.handleWindowFocus();
        });

        window.addEventListener('blur', () => {
            this.handleWindowBlur();
        });

        // Fullscreen changes
        document.addEventListener('fullscreenchange', () => {
            this.handleFullscreenChange();
        });

        // Context menu prevention (optional)
        document.addEventListener('contextmenu', (e) => {
            // Allow context menu in development mode
            if (!process.argv?.includes('--dev')) {
                e.preventDefault();
            }
        });

        // Drag and drop handling
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleFileDrop(e);
        });

        // Listen to component events
        this.setupComponentEventListeners();
    }

    setupComponentEventListeners() {
        // Navigation bar events
        document.addEventListener('navigation-bar-navigate-requested', (e) => {
            this.emit('navigate-to-url', e.detail);
        });

        document.addEventListener('navigation-bar-go-back-requested', () => {
            this.emit('go-back');
        });

        document.addEventListener('navigation-bar-go-forward-requested', () => {
            this.emit('go-forward');
        });

        document.addEventListener('navigation-bar-refresh-requested', () => {
            this.emit('refresh');
        });

        document.addEventListener('navigation-bar-new-tab-requested', (e) => {
            this.emit('create-new-tab', e.detail);
        });

        // Tab manager events
        document.addEventListener('tab-manager-no-tabs-remaining', () => {
            this.handleNoTabsRemaining();
        });

        // Webview manager events
        document.addEventListener('webview-manager-title-updated', (e) => {
            this.handleTitleUpdate(e.detail);
        });
    }

    handleKeyboardShortcuts(e) {
        const isMac = this.platform === 'darwin';
        const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

        // New tab (Ctrl/Cmd + T)
        if (ctrlOrCmd && e.key === 't') {
            e.preventDefault();
            this.emit('create-new-tab');
        }

        // Close tab (Ctrl/Cmd + W)
        if (ctrlOrCmd && e.key === 'w') {
            e.preventDefault();
            this.emit('close-current-tab');
        }

        // Refresh (Ctrl/Cmd + R or F5)
        if ((ctrlOrCmd && e.key === 'r') || e.key === 'F5') {
            e.preventDefault();
            this.emit('refresh');
        }

        // Hard refresh (Ctrl/Cmd + Shift + R)
        if (ctrlOrCmd && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            this.emit('hard-refresh');
        }

        // Back (Alt + Left Arrow)
        if (e.altKey && e.key === 'ArrowLeft') {
            e.preventDefault();
            this.emit('go-back');
        }

        // Forward (Alt + Right Arrow)
        if (e.altKey && e.key === 'ArrowRight') {
            e.preventDefault();
            this.emit('go-forward');
        }

        // Focus address bar (Ctrl/Cmd + L)
        if (ctrlOrCmd && e.key === 'l') {
            e.preventDefault();
            this.emit('focus-address-bar');
        }

        // Toggle fullscreen (F11)
        if (e.key === 'F11') {
            e.preventDefault();
            this.toggleFullscreen();
        }

        // Developer tools (F12 or Ctrl/Cmd + Shift + I)
        if (e.key === 'F12' || (ctrlOrCmd && e.shiftKey && e.key === 'I')) {
            e.preventDefault();
            this.emit('toggle-dev-tools');
        }

        // Zoom in (Ctrl/Cmd + Plus)
        if (ctrlOrCmd && (e.key === '+' || e.key === '=')) {
            e.preventDefault();
            this.emit('zoom-in');
        }

        // Zoom out (Ctrl/Cmd + Minus)
        if (ctrlOrCmd && e.key === '-') {
            e.preventDefault();
            this.emit('zoom-out');
        }

        // Reset zoom (Ctrl/Cmd + 0)
        if (ctrlOrCmd && e.key === '0') {
            e.preventDefault();
            this.emit('zoom-reset');
        }

        // Tab switching (Ctrl/Cmd + Number)
        if (ctrlOrCmd && e.key >= '1' && e.key <= '9') {
            e.preventDefault();
            const tabIndex = parseInt(e.key) - 1;
            this.emit('switch-to-tab-index', { index: tabIndex });
        }

        // Next tab (Ctrl/Cmd + Tab)
        if (ctrlOrCmd && e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            this.emit('next-tab');
        }

        // Previous tab (Ctrl/Cmd + Shift + Tab)
        if (ctrlOrCmd && e.key === 'Tab' && e.shiftKey) {
            e.preventDefault();
            this.emit('previous-tab');
        }
    }

    handleWindowFocus() {
        this.emit('window-focused');
    }

    handleWindowBlur() {
        this.emit('window-blurred');
    }

    handleFullscreenChange() {
        this.isFullscreen = !!document.fullscreenElement;
        this.emit('fullscreen-changed', { isFullscreen: this.isFullscreen });
    }

    handleFileDrop(e) {
        const files = Array.from(e.dataTransfer.files);
        const urls = [];

        files.forEach(file => {
            if (file.type.startsWith('text/') || file.name.endsWith('.html')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target.result;
                    const blob = new Blob([content], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    urls.push(url);
                };
                reader.readAsText(file);
            }
        });

        if (urls.length > 0) {
            this.emit('files-dropped', { urls });
        }
    }

    handleNoTabsRemaining() {
        // Show welcome screen when no tabs are left
        this.emit('show-welcome-screen');
    }

    handleTitleUpdate({ tabId, title }) {
        // Update window title if this is the active tab
        this.emit('update-window-title', { tabId, title });
    }

    // UI state management
    toggleFullscreen() {
        if (this.isFullscreen) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        // Create a simple notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });

        // Remove after duration
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    // Theme management (for future use)
    setTheme(theme) {
        document.body.dataset.theme = theme;
        localStorage.setItem('scuba-theme', theme);
    }

    getTheme() {
        return localStorage.getItem('scuba-theme') || 'default';
    }

    // Window management
    minimizeWindow() {
        this.emit('minimize-window');
    }

    maximizeWindow() {
        this.emit('maximize-window');
    }

    closeWindow() {
        this.emit('close-window');
    }

    // Utility methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Simple event emitter functionality
    emit(eventName, data) {
        const event = new CustomEvent(`ui-manager-${eventName}`, { 
            detail: data 
        });
        document.dispatchEvent(event);
    }

    on(eventName, callback) {
        document.addEventListener(`ui-manager-${eventName}`, (e) => {
            callback(e.detail);
        });
    }
}

// Export for use in other modules
window.UIManager = UIManager;

