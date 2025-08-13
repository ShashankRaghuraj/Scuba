/**
 * App - Main application component that orchestrates all other components
 */
class App {
    constructor() {
        this.tabManager = null;
        this.webviewManager = null;
        this.navigationBar = null;
        this.uiManager = null;
        this.loadingManager = null;
        this.performanceMonitor = null;
        
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Scuba Browser components...');
            
            // Initialize all components
            this.tabManager = new TabManager();
            console.log('TabManager initialized');
            
            this.webviewManager = new WebviewManager();
            console.log('WebviewManager initialized');
            
            this.navigationBar = new NavigationBar();
            console.log('NavigationBar initialized');
            
            this.uiManager = new UIManager();
            console.log('UIManager initialized');
            
            this.loadingManager = new LoadingManager();
            console.log('LoadingManager initialized');

            // Initialize performance monitor
            this.performanceMonitor = new PerformanceMonitor();
            console.log('PerformanceMonitor initialized');

            // Connect loading manager to webview manager
            this.webviewManager.setLoadingManager(this.loadingManager);

            // Setup inter-component communication
            this.setupEventHandlers();
            console.log('Event handlers setup complete');

            // Create initial tab
            this.createInitialTab();
            console.log('Initial tab setup complete');

            // Mark as initialized
            this.isInitialized = true;

            console.log('Scuba Browser initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Scuba Browser:', error);
        }
    }

    setupEventHandlers() {
        // UI Manager events
        this.uiManager.on('navigate-to-url', (data) => {
            this.handleNavigateToUrl(data);
        });

        this.uiManager.on('go-back', () => {
            this.webviewManager.goBack();
        });

        this.uiManager.on('go-forward', () => {
            this.webviewManager.goForward();
        });

        this.uiManager.on('refresh', () => {
            this.webviewManager.reload();
        });

        this.uiManager.on('create-new-tab', (data) => {
            this.createNewTab(data?.url);
        });

        this.uiManager.on('close-current-tab', () => {
            this.closeCurrentTab();
        });

        this.uiManager.on('focus-address-bar', () => {
            this.navigationBar.focusAddressBar();
        });

        this.uiManager.on('show-welcome-screen', () => {
            this.showWelcomeScreen();
        });

        // Tab Manager events
        this.tabManager.on('tab-created', (data) => {
            // TabManager and WebviewManager communicate directly
            // App can listen for additional coordination if needed
            
            // Optimize performance after tab creation
            if (this.performanceMonitor) {
                this.performanceMonitor.optimizeTabSwitching();
            }
        });

        this.tabManager.on('tab-switched', (data) => {
            this.handleTabSwitched(data);
        });

        this.tabManager.on('no-tabs-remaining', () => {
            this.handleNoTabsRemaining();
        });

        // Webview Manager events
        this.webviewManager.on('title-updated', (data) => {
            this.handleTitleUpdated(data);
        });

        this.webviewManager.on('navigated', (data) => {
            this.handleNavigated(data);
        });

        this.webviewManager.on('navigation-state-changed', (data) => {
            this.handleNavigationStateChanged(data);
        });

        this.webviewManager.on('loading-started', (data) => {
            this.navigationBar.setLoading(true);
        });

        this.webviewManager.on('loading-stopped', (data) => {
            this.navigationBar.setLoading(false);
        });

        this.webviewManager.on('new-window-requested', (data) => {
            this.createNewTab(data.url);
        });

        // Navigation Bar events are handled by UI Manager
        // which then forwards to appropriate handlers above
    }

    // Event handlers
    handleNavigateToUrl({ url }) {
        console.log('App: Handling navigation to:', url);
        const activeTab = this.tabManager.getActiveTab();
        console.log('App: Active tab:', activeTab);
        console.log('App: Total tabs:', this.tabManager.getTabCount());
        
        if (activeTab) {
            console.log('App: Navigating existing tab to:', url);
            this.webviewManager.navigateWebview(activeTab.id, url);
            this.hideWelcomeScreen();
        } else {
            console.log('App: No active tab found, creating new tab with URL:', url);
            // Create new tab if none exists
            this.createNewTab(url);
        }
    }

    handleTabSwitched({ tabId, tab }) {
        // Update navigation bar with current tab's state
        const webviewData = this.webviewManager.webviews.get(tabId);
        if (webviewData && webviewData.url) {
            this.navigationBar.setUrl(webviewData.url);
            this.navigationBar.setNavigationState(
                webviewData.canGoBack,
                webviewData.canGoForward
            );
            this.hideWelcomeScreen();
        } else {
            // For empty tabs, clear address bar and show welcome screen
            this.navigationBar.setUrl('');
            this.navigationBar.setNavigationState(false, false);
            this.showWelcomeScreen();
        }
    }

    handleTitleUpdated({ tabId, title }) {
        // Update tab title
        this.tabManager.updateTabTitle(tabId, title);

        // Update window title if this is the active tab
        const activeTab = this.tabManager.getActiveTab();
        if (activeTab && activeTab.id === tabId) {
            document.title = title ? `${title} - Scuba` : 'Scuba';
        }
    }

    handleNavigated({ tabId, url }) {
        // Update tab URL
        this.tabManager.updateTabUrl(tabId, url);

        // Update navigation bar if this is the active tab
        const activeTab = this.tabManager.getActiveTab();
        if (activeTab && activeTab.id === tabId) {
            this.navigationBar.setUrl(url);
        }

        // Hide welcome screen when navigating
        this.hideWelcomeScreen();
    }

    handleNavigationStateChanged({ tabId, canGoBack, canGoForward }) {
        // Update navigation bar if this is the active tab
        const activeTab = this.tabManager.getActiveTab();
        if (activeTab && activeTab.id === tabId) {
            this.navigationBar.setNavigationState(canGoBack, canGoForward);
        }
    }

    handleNoTabsRemaining() {
        // Show welcome screen and reset window title
        this.showWelcomeScreen();
        document.title = 'Scuba';
        this.navigationBar.setUrl('');
        this.navigationBar.setNavigationState(false, false);
    }

    // Tab management
    createInitialTab() {
        // Check if we should show welcome screen or create a tab with URL
        const urlParams = new URLSearchParams(window.location.search);
        const initialUrl = urlParams.get('url');

        if (initialUrl) {
            this.createNewTab(initialUrl);
        } else {
            // Just show welcome screen, don't create an empty tab
            this.showWelcomeScreen();
        }
    }

    createNewTab(url = null) {
        const tabId = this.tabManager.createTab(url);
        
        if (url) {
            this.hideWelcomeScreen();
        } else {
            // For new empty tabs, show welcome screen and clear address bar
            this.showWelcomeScreen();
            this.navigationBar.setUrl('');
        }

        return tabId;
    }

    closeCurrentTab() {
        const activeTab = this.tabManager.getActiveTab();
        if (activeTab) {
            this.tabManager.closeTab(activeTab.id);
        }
    }

    // UI state management
    showWelcomeScreen() {
        this.navigationBar.showWelcomeScreen();
    }

    hideWelcomeScreen() {
        this.navigationBar.hideWelcomeScreen();
    }

    // Public API for external control
    navigate(url) {
        this.handleNavigateToUrl({ url });
    }

    newTab(url = null) {
        return this.createNewTab(url);
    }

    closeTab(tabId = null) {
        if (tabId) {
            this.tabManager.closeTab(tabId);
        } else {
            this.closeCurrentTab();
        }
    }

    getCurrentTab() {
        return this.tabManager.getActiveTab();
    }

    getCurrentUrl() {
        return this.webviewManager.getCurrentUrl();
    }

    getAllTabs() {
        return this.tabManager.getAllTabs();
    }

    // Development helpers
    debugInfo() {
        return {
            isInitialized: this.isInitialized,
            activeTabId: this.tabManager?.activeTabId,
            tabCount: this.tabManager?.getTabCount() || 0,
            currentUrl: this.getCurrentUrl(),
            webviewCount: this.webviewManager?.webviews.size || 0,
            components: {
                tabManager: !!this.tabManager,
                webviewManager: !!this.webviewManager,
                navigationBar: !!this.navigationBar,
                uiManager: !!this.uiManager,
                loadingManager: !!this.loadingManager,
                performanceMonitor: !!this.performanceMonitor
            },
            performance: this.performanceMonitor?.exportMetrics() || null
        };
    }

    // Test methods for debugging
    testLoading() {
        console.log('Testing loading animation...');
        if (this.loadingManager) {
            this.loadingManager.show();
            setTimeout(() => {
                this.loadingManager.hide();
            }, 5000);
        }
    }

    forceCreateTab() {
        console.log('Force creating new tab...');
        return this.createNewTab();
    }

    // Cleanup
    destroy() {
        // Clean up all components
        if (this.tabManager) {
            // Close all tabs
            const tabs = this.tabManager.getAllTabs();
            tabs.forEach(tab => this.tabManager.closeTab(tab.id));
        }

        // Reset references
        this.tabManager = null;
        this.webviewManager = null;
        this.navigationBar = null;
        this.uiManager = null;
        this.isInitialized = false;
    }
}

// Make App available globally for debugging
window.ScubaApp = App;

// Export for use in other modules
window.App = App;
