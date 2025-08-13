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
        this.searchInterface = null;
        this.searchEngineManager = null;
        this.searchResultsUI = null;
        this.searchResultsInstances = new Map(); // Per-tab search results
        
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

            // Initialize search engine manager
            this.searchEngineManager = new SearchEngineManager();
            console.log('SearchEngineManager initialized');

            // Initialize search results UI
            this.searchResultsUI = new SearchResultsUI();
            console.log('SearchResultsUI initialized');

            // Initialize search interface
            this.searchInterface = new SearchInterface();
            console.log('SearchInterface initialized');

            // Auto-detect best search engine
            await this.searchEngineManager.autoDetectEngine();

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

        // Search Interface events
        this.searchInterface.on('navigate-to-url', (data) => {
            this.handleNavigateToUrl(data);
        });

        // Search Engine Manager events
        document.addEventListener('search-navigation-requested', (e) => {
            this.handleNavigateToUrl({ url: e.detail.url });
        });

        document.addEventListener('search-engine-changed', (e) => {
            console.log('App: Search engine changed to:', e.detail.engine);
        });

        // Search Results UI events
        document.addEventListener('show-search-interface', () => {
            this.showSearchInterface();
        });

        document.addEventListener('hide-search-interface', () => {
            this.hideSearchInterface();
        });

        document.addEventListener('hide-welcome-screen', () => {
            this.hideWelcomeScreen();
        });

        // Handle navigation from search results
        document.addEventListener('navigate-to-url', (e) => {
            this.handleNavigateToUrl({ url: e.detail.url });
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
            
            // Create SearchResultsUI instance for this tab
            if (data.tabId) {
                const searchResultsUI = new SearchResultsUI(data.tabId);
                this.searchResultsInstances.set(data.tabId, searchResultsUI);
            }
            
            // Optimize performance after tab creation
            if (this.performanceMonitor) {
                this.performanceMonitor.optimizeTabSwitching();
            }
        });

        this.tabManager.on('tab-switched', (data) => {
            this.handleTabSwitched(data);
            
            // Switch active SearchResultsUI instance
            if (data.tabId && this.searchResultsInstances.has(data.tabId)) {
                // Hide all search results
                this.searchResultsInstances.forEach((instance) => {
                    if (instance.tabId !== data.tabId) {
                        instance.hide();
                    }
                });
                
                // Update current instance reference
                this.searchResultsUI = this.searchResultsInstances.get(data.tabId);
            }
        });

        this.tabManager.on('no-tabs-remaining', () => {
            this.handleNoTabsRemaining();
        });

        this.tabManager.on('tab-closed', (data) => {
            // Clean up SearchResultsUI instance for closed tab
            if (data.tabId && this.searchResultsInstances.has(data.tabId)) {
                const instance = this.searchResultsInstances.get(data.tabId);
                instance.hide();
                // Remove the DOM element
                if (instance.resultsContainer && instance.resultsContainer.parentNode) {
                    instance.resultsContainer.parentNode.removeChild(instance.resultsContainer);
                }
                this.searchResultsInstances.delete(data.tabId);
            }
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
            this.hideSearchInterface();
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
            this.hideSearchInterface();
        } else {
            // For empty tabs, clear address bar and show search interface
            this.navigationBar.setUrl('');
            this.navigationBar.setNavigationState(false, false);
            this.showSearchInterface();
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
        // Automatically create a new tab instead of showing search interface
        this.createNewTab();
        document.title = 'Scuba';
    }

    // Tab management
    createInitialTab() {
        // Check if we should create a tab with URL or create an empty tab
        const urlParams = new URLSearchParams(window.location.search);
        const initialUrl = urlParams.get('url');

        if (initialUrl) {
            this.createNewTab(initialUrl);
        } else {
            // Create an empty tab which will show the search interface
            this.createNewTab();
        }
    }

    createNewTab(url = null) {
        const tabId = this.tabManager.createTab(url);
        
        // Ensure SearchResultsUI instance exists for this tab
        if (tabId && !this.searchResultsInstances.has(tabId)) {
            const searchResultsUI = new SearchResultsUI(tabId);
            this.searchResultsInstances.set(tabId, searchResultsUI);
            
            // Set as current instance if this is the active tab
            this.searchResultsUI = searchResultsUI;
        }
        
        if (url) {
            this.hideWelcomeScreen();
            this.hideSearchInterface();
        } else {
            // For new empty tabs, show search interface and clear address bar
            this.showSearchInterface();
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

    showSearchInterface() {
        if (this.searchInterface) {
            this.searchInterface.show();
        }
    }

    hideSearchInterface() {
        if (this.searchInterface) {
            this.searchInterface.hide();
        }
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
                performanceMonitor: !!this.performanceMonitor,
                searchInterface: !!this.searchInterface,
                searchEngineManager: !!this.searchEngineManager,
                searchResultsUI: !!this.searchResultsUI
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
        this.loadingManager = null;
        this.performanceMonitor = null;
        this.searchInterface = null;
        this.searchEngineManager = null;
        this.searchResultsUI = null;
        
        // Clean up all search results instances
        if (this.searchResultsInstances) {
            this.searchResultsInstances.forEach((instance) => {
                instance.hide();
                if (instance.resultsContainer && instance.resultsContainer.parentNode) {
                    instance.resultsContainer.parentNode.removeChild(instance.resultsContainer);
                }
            });
            this.searchResultsInstances.clear();
        }
        
        this.isInitialized = false;
    }
}

// Make App available globally for debugging
window.ScubaApp = App;

// Export for use in other modules
window.App = App;
