/**
 * WebviewManager - Handles webview creation, navigation, and lifecycle
 */
class WebviewManager {
    constructor() {
        this.webviews = new Map();
        this.activeWebviewId = null;
        this.loadingManager = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen to tab manager events
        document.addEventListener('tab-manager-tab-created', (e) => {
            this.createWebview(e.detail.tabId, e.detail.url);
        });

        document.addEventListener('tab-manager-tab-closed', (e) => {
            this.destroyWebview(e.detail.tabId);
        });

        document.addEventListener('tab-manager-tab-switched', (e) => {
            this.switchWebview(e.detail.tabId, e.detail.previousTabId);
        });

        // Window resize handling
        window.addEventListener('resize', () => {
            this.updateWebviewSizes();
        });
    }

    createWebview(tabId, url = null) {
        console.log('WebviewManager: Creating webview for tab', tabId, 'with URL:', url);
        const contentArea = document.getElementById('content-area');
        const webview = document.createElement('webview');
        
        webview.id = `webview-${tabId}`;
        webview.className = 'webview';
        
        // Set webview attributes
        this.configureWebview(webview);
        
        // Set webview styles for proper sizing
        this.applyWebviewStyles(webview);
        
        contentArea.appendChild(webview);

        // Store webview data
        this.webviews.set(tabId, {
            id: tabId,
            element: webview,
            url: url || '',
            isLoading: false,
            canGoBack: false,
            canGoForward: false
        });

        // Setup webview event listeners
        this.setupWebviewEvents(webview, tabId);

        // Set as active webview if this matches the current activeWebviewId or is the first one
        if (this.activeWebviewId === tabId || !this.activeWebviewId) {
            this.activeWebviewId = tabId;
            webview.classList.add('active');
            console.log('WebviewManager: Set active webview to:', tabId);
        } else {
            console.log('WebviewManager: Created webview for tab', tabId, 'but not setting as active (activeWebviewId:', this.activeWebviewId, ')');
        }

        // Load URL if provided - optimized timing
        if (url) {
            // Use requestAnimationFrame for better performance
            requestAnimationFrame(() => {
                setTimeout(() => {
                    this.navigateWebview(tabId, url);
                }, 100); // Reduced timeout for faster loading
            });
        }

        return webview;
    }

    configureWebview(webview) {
        webview.setAttribute('enableremotemodule', 'false');
        webview.setAttribute('webpreferences', 'experimentalFeatures=true,v8CacheOptions=code,backgroundThrottling=false');
        webview.setAttribute('useragent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Scuba/1.0.0');
        webview.setAttribute('disablewebsecurity', 'true');
        webview.setAttribute('allowpopups', 'true');
    }

    applyWebviewStyles(webview) {
        // Set webview to fill entire content area with absolute positioning
        webview.style.setProperty('width', '100%', 'important');
        webview.style.setProperty('height', '100%', 'important');
        webview.style.setProperty('flex', '1 1 auto', 'important');
        webview.style.setProperty('border', 'none', 'important');
        webview.style.setProperty('outline', 'none', 'important');
        webview.style.setProperty('margin', '0', 'important');
        webview.style.setProperty('padding', '0', 'important');
        webview.style.setProperty('min-width', '100%', 'important');
        webview.style.setProperty('min-height', '100%', 'important');
        webview.style.setProperty('position', 'absolute', 'important');
        webview.style.setProperty('top', '0', 'important');
        webview.style.setProperty('left', '0', 'important');
        webview.style.setProperty('right', '0', 'important');
        webview.style.setProperty('bottom', '0', 'important');
        webview.style.setProperty('z-index', '1', 'important');
    }

    setupWebviewEvents(webview, tabId) {
        // Navigation events
        webview.addEventListener('did-start-loading', () => {
            this.handleLoadingStart(tabId);
        });

        webview.addEventListener('did-stop-loading', () => {
            this.handleLoadingStop(tabId);
        });

        webview.addEventListener('did-finish-load', () => {
            this.handleLoadFinished(tabId);
        });

        webview.addEventListener('did-fail-load', (e) => {
            this.handleLoadFailed(tabId, e);
        });

        webview.addEventListener('page-title-updated', (e) => {
            this.handleTitleUpdated(tabId, e.title);
        });

        webview.addEventListener('did-navigate', (e) => {
            this.handleNavigated(tabId, e.url);
        });

        webview.addEventListener('did-navigate-in-page', (e) => {
            this.handleNavigated(tabId, e.url);
        });

        // New window handling
        webview.addEventListener('new-window', (e) => {
            this.handleNewWindow(e.url);
        });
    }

    destroyWebview(tabId) {
        const webviewData = this.webviews.get(tabId);
        if (!webviewData) return;

        // Remove webview element
        webviewData.element.remove();
        
        // Remove from webviews map
        this.webviews.delete(tabId);

        // Clear active webview if this was it
        if (this.activeWebviewId === tabId) {
            this.activeWebviewId = null;
        }
    }

    switchWebview(tabId, previousTabId) {
        console.log('WebviewManager: Switching webview from', previousTabId, 'to', tabId);
        
        // Batch DOM operations for better performance
        requestAnimationFrame(() => {
            // Hide previous webview
            if (previousTabId && this.webviews.has(previousTabId)) {
                const previousWebview = this.webviews.get(previousTabId);
                previousWebview.element.classList.remove('active');
            }

            // Show current webview if it exists
            const currentWebview = this.webviews.get(tabId);
            if (currentWebview) {
                currentWebview.element.classList.add('active');
                this.activeWebviewId = tabId;
                console.log('WebviewManager: Active webview set to:', this.activeWebviewId);
                
                // Update navigation state
                this.updateNavigationState(tabId);
            } else {
                // Webview doesn't exist yet, but we should still update activeWebviewId
                // so that when it's created, it will be set as active
                console.log('WebviewManager: No webview found for tab', tabId, '- will be created as active');
                this.activeWebviewId = tabId;
            }
        });
    }

    navigateWebview(tabId, url) {
        const webviewData = this.webviews.get(tabId);
        if (!webviewData) return;

        const webview = webviewData.element;
        
        // Show loading animation immediately for navigation
        if (tabId === this.activeWebviewId && this.loadingManager) {
            // Show different loading message for search vs navigation
            if (url.includes('google.com/search') || url.includes(' ')) {
                this.loadingManager.showSearch();
            } else {
                this.loadingManager.showPageLoad();
            }
        }
        
        // Format URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            // Check if it looks like a search query
            if (url.includes(' ') || !url.includes('.')) {
                url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
            } else {
                url = 'https://' + url;
            }
        }

        // Update webview data
        webviewData.url = url;

        // Load URL
        const loadURL = () => {
            console.log('WebviewManager: Loading URL in webview:', url);
            try {
                if (webview.loadURL) {
                    webview.loadURL(url);
                } else {
                    webview.src = url;
                }
            } catch (error) {
                console.error('Error loading URL in webview:', error);
                webview.src = url;
            }
        };

        // Check if webview is ready and attached to DOM
        const attemptLoad = () => {
            try {
                if (webview.getWebContentsId) {
                    // Webview is ready
                    loadURL();
                } else {
                    // Wait for dom-ready
                    console.log('WebviewManager: Webview not ready, waiting for dom-ready event');
                    webview.addEventListener('dom-ready', loadURL, { once: true });
                }
            } catch (error) {
                console.log('WebviewManager: Webview not attached, waiting for dom-ready event');
                webview.addEventListener('dom-ready', loadURL, { once: true });
            }
        };

        // Optimized DOM attachment detection
        if (document.body.contains(webview)) {
            // Use requestAnimationFrame for smoother timing
            requestAnimationFrame(() => {
                setTimeout(attemptLoad, 50);
            });
        } else {
            // Wait for DOM attachment
            console.log('WebviewManager: Webview not yet attached to DOM, waiting...');
            setTimeout(attemptLoad, 100);
        }
    }

    // Navigation methods
    goBack(tabId = this.activeWebviewId) {
        const webviewData = this.webviews.get(tabId);
        if (webviewData && webviewData.element.canGoBack) {
            webviewData.element.goBack();
        }
    }

    goForward(tabId = this.activeWebviewId) {
        const webviewData = this.webviews.get(tabId);
        if (webviewData && webviewData.element.canGoForward) {
            webviewData.element.goForward();
        }
    }

    reload(tabId = this.activeWebviewId) {
        const webviewData = this.webviews.get(tabId);
        if (webviewData) {
            // Show reload loading animation
            if (tabId === this.activeWebviewId && this.loadingManager) {
                this.loadingManager.showReload();
            }
            webviewData.element.reload();
        }
    }

    // Initialize loading manager
    setLoadingManager(loadingManager) {
        this.loadingManager = loadingManager;
    }

    // Event handlers
    handleLoadingStart(tabId) {
        console.log('WebviewManager: Loading started for tab', tabId, 'activeWebviewId:', this.activeWebviewId);
        const webviewData = this.webviews.get(tabId);
        if (webviewData) {
            webviewData.isLoading = true;
            
            // Show loading animation only for active tab
            if (tabId === this.activeWebviewId && this.loadingManager) {
                console.log('WebviewManager: Showing loading animation for active tab');
                this.loadingManager.showPageLoad();
            } else {
                console.log('WebviewManager: Not showing loading - tabId:', tabId, 'activeWebviewId:', this.activeWebviewId, 'loadingManager:', !!this.loadingManager);
            }
            
            this.emit('loading-started', { tabId });
        }
    }

    handleLoadingStop(tabId) {
        const webviewData = this.webviews.get(tabId);
        if (webviewData) {
            webviewData.isLoading = false;
            
            // Hide loading animation only for active tab
            if (tabId === this.activeWebviewId && this.loadingManager) {
                this.loadingManager.hide();
            }
            
            this.emit('loading-stopped', { tabId });
        }
    }

    handleLoadFinished(tabId) {
        this.updateNavigationState(tabId);
        this.emit('load-finished', { tabId });
    }

    handleLoadFailed(tabId, event) {
        console.error('Webview load failed:', event);
        this.emit('load-failed', { tabId, event });
    }

    handleTitleUpdated(tabId, title) {
        const webviewData = this.webviews.get(tabId);
        if (webviewData) {
            this.emit('title-updated', { tabId, title });
        }
    }

    handleNavigated(tabId, url) {
        const webviewData = this.webviews.get(tabId);
        if (webviewData) {
            webviewData.url = url;
            this.updateNavigationState(tabId);
            this.emit('navigated', { tabId, url });
        }
    }

    handleNewWindow(url) {
        this.emit('new-window-requested', { url });
    }

    updateNavigationState(tabId) {
        const webviewData = this.webviews.get(tabId);
        if (!webviewData) return;

        const webview = webviewData.element;
        
        try {
            webviewData.canGoBack = webview.canGoBack();
            webviewData.canGoForward = webview.canGoForward();
        } catch (error) {
            // Webview might not be ready yet
            webviewData.canGoBack = false;
            webviewData.canGoForward = false;
        }

        if (tabId === this.activeWebviewId) {
            this.emit('navigation-state-changed', {
                tabId,
                canGoBack: webviewData.canGoBack,
                canGoForward: webviewData.canGoForward
            });
        }
    }

    updateWebviewSizes() {
        this.webviews.forEach((webviewData) => {
            const webview = webviewData.element;
            if (webview) {
                this.applyWebviewStyles(webview);
            }
        });
    }

    getActiveWebview() {
        return this.webviews.get(this.activeWebviewId);
    }

    getCurrentUrl() {
        const activeWebview = this.getActiveWebview();
        return activeWebview ? activeWebview.url : '';
    }

    // Simple event emitter functionality
    emit(eventName, data) {
        const event = new CustomEvent(`webview-manager-${eventName}`, { 
            detail: data 
        });
        document.dispatchEvent(event);
    }

    on(eventName, callback) {
        document.addEventListener(`webview-manager-${eventName}`, (e) => {
            callback(e.detail);
        });
    }
}

// Export for use in other modules
window.WebviewManager = WebviewManager;
