/**
 * NavigationBar - Handles address bar, navigation buttons, and URL input
 */
class NavigationBar {
    constructor() {
        this.currentUrl = '';
        this.isLoading = false;
        this.canGoBack = false;
        this.canGoForward = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Navigation buttons
        const backBtn = document.getElementById('back-btn');
        const forwardBtn = document.getElementById('forward-btn');
        const refreshBtn = document.getElementById('refresh-btn');
        const goBtn = document.getElementById('go-btn');

        if (backBtn) {
            backBtn.addEventListener('click', () => this.goBack());
        }

        if (forwardBtn) {
            forwardBtn.addEventListener('click', () => this.goForward());
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refresh());
        }

        if (goBtn) {
            goBtn.addEventListener('click', () => this.navigate());
        }

        // Address bar
        const addressBar = document.getElementById('address-bar');
        if (addressBar) {
            addressBar.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.navigate();
                }
            });

            addressBar.addEventListener('focus', () => {
                this.handleAddressBarFocus();
            });

            addressBar.addEventListener('blur', () => {
                this.handleAddressBarBlur();
            });
        }

        // Welcome screen search bar
        const welcomeSearchBar = document.getElementById('welcome-search-bar');
        if (welcomeSearchBar) {
            welcomeSearchBar.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.navigateFromWelcome();
                }
            });
        }

        // Quick links
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-link')) {
                e.preventDefault();
                const url = e.target.dataset.url;
                if (url) {
                    this.emit('navigate-requested', { url });
                }
            }
        });

        // Listen to webview manager events
        this.setupWebviewEventListeners();
    }

    setupWebviewEventListeners() {
        document.addEventListener('webview-manager-loading-started', (e) => {
            this.handleLoadingStart();
        });

        document.addEventListener('webview-manager-loading-stopped', (e) => {
            this.handleLoadingStop();
        });

        document.addEventListener('webview-manager-navigated', (e) => {
            this.handleNavigated(e.detail.url);
        });

        document.addEventListener('webview-manager-title-updated', (e) => {
            this.handleTitleUpdated(e.detail.title);
        });

        document.addEventListener('webview-manager-navigation-state-changed', (e) => {
            this.handleNavigationStateChanged(e.detail);
        });

        document.addEventListener('webview-manager-new-window-requested', (e) => {
            this.handleNewWindowRequested(e.detail.url);
        });
    }

    navigate() {
        const addressBar = document.getElementById('address-bar');
        if (!addressBar) return;

        const url = addressBar.value.trim();
        if (!url) return;

        // Check if it's a search query or URL
        let finalUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            if (url.includes(' ') || !url.includes('.')) {
                // Treat as search query
                finalUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
            } else {
                // Treat as URL
                finalUrl = 'https://' + url;
            }
        }

        this.emit('navigate-requested', { url: finalUrl });
    }

    navigateFromWelcome() {
        const welcomeSearchBar = document.getElementById('welcome-search-bar');
        if (!welcomeSearchBar) return;

        const query = welcomeSearchBar.value.trim();
        if (!query) return;

        let url = query;
        
        // Check if it's a search query or URL
        if (!query.startsWith('http://') && !query.startsWith('https://')) {
            if (query.includes(' ') || !query.includes('.')) {
                // Treat as search query
                url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            } else {
                // Treat as URL
                url = 'https://' + query;
            }
        }

        this.emit('navigate-requested', { url });
    }

    goBack() {
        this.emit('go-back-requested');
    }

    goForward() {
        this.emit('go-forward-requested');
    }

    refresh() {
        this.emit('refresh-requested');
    }

    // Event handlers
    handleLoadingStart() {
        this.isLoading = true;
        this.updateLoadingIndicator(true);
    }

    handleLoadingStop() {
        this.isLoading = false;
        this.updateLoadingIndicator(false);
    }

    handleNavigated(url) {
        this.currentUrl = url;
        this.updateAddressBar(url);
    }

    handleTitleUpdated(title) {
        // Title updates are handled by TabManager
        // This could be used for additional UI updates if needed
    }

    handleNavigationStateChanged({ canGoBack, canGoForward }) {
        this.canGoBack = canGoBack;
        this.canGoForward = canGoForward;
        this.updateNavigationButtons();
    }

    handleNewWindowRequested(url) {
        // Request new tab creation
        this.emit('new-tab-requested', { url });
    }

    handleAddressBarFocus() {
        const addressBar = document.getElementById('address-bar');
        if (addressBar) {
            // Select all text on focus for easy editing
            addressBar.select();
        }
    }

    handleAddressBarBlur() {
        const addressBar = document.getElementById('address-bar');
        if (addressBar && this.currentUrl) {
            // Restore current URL if user didn't navigate
            addressBar.value = this.formatUrlForDisplay(this.currentUrl);
        }
    }

    // UI update methods
    updateAddressBar(url) {
        const addressBar = document.getElementById('address-bar');
        if (addressBar && document.activeElement !== addressBar) {
            addressBar.value = this.formatUrlForDisplay(url);
        }
    }

    updateNavigationButtons() {
        const backBtn = document.getElementById('back-btn');
        const forwardBtn = document.getElementById('forward-btn');

        if (backBtn) {
            backBtn.disabled = !this.canGoBack;
        }

        if (forwardBtn) {
            forwardBtn.disabled = !this.canGoForward;
        }
    }

    updateLoadingIndicator(isLoading) {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            if (isLoading) {
                loadingIndicator.classList.add('loading');
            } else {
                loadingIndicator.classList.remove('loading');
            }
        }
    }

    formatUrlForDisplay(url) {
        if (!url) return '';
        
        // Remove protocol for cleaner display
        return url.replace(/^https?:\/\//, '');
    }

    // Welcome screen management (disabled - using search interface instead)
    showWelcomeScreen() {
        // Disabled - we now use the search interface instead
        const welcomeScreen = document.getElementById('welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.classList.add('hidden');
        }
    }

    hideWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.classList.add('hidden');
        }
    }

    // Public methods for external control
    setUrl(url) {
        this.currentUrl = url;
        this.updateAddressBar(url);
    }

    setNavigationState(canGoBack, canGoForward) {
        this.canGoBack = canGoBack;
        this.canGoForward = canGoForward;
        this.updateNavigationButtons();
    }

    setLoading(isLoading) {
        this.isLoading = isLoading;
        this.updateLoadingIndicator(isLoading);
    }

    getCurrentUrl() {
        return this.currentUrl;
    }

    focusAddressBar() {
        const addressBar = document.getElementById('address-bar');
        if (addressBar) {
            addressBar.focus();
            addressBar.select();
        }
    }

    // Simple event emitter functionality
    emit(eventName, data) {
        const event = new CustomEvent(`navigation-bar-${eventName}`, { 
            detail: data 
        });
        document.dispatchEvent(event);
    }

    on(eventName, callback) {
        document.addEventListener(`navigation-bar-${eventName}`, (e) => {
            callback(e.detail);
        });
    }
}

// Export for use in other modules
window.NavigationBar = NavigationBar;
