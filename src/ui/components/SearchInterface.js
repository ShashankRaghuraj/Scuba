/**
 * SearchInterface - Handles search interface displayed in webview area
 */
class SearchInterface {
    constructor() {
        this.isVisible = false;
        this.currentQuery = '';
        this.searchResults = [];
        this.isSearching = false;
        this.init();
    }

    init() {
        console.log('SearchInterface initialized');
        this.createSearchInterface();
        this.setupEventListeners();
    }

    createSearchInterface() {
        // Create the search interface container
        this.searchContainer = document.createElement('div');
        this.searchContainer.id = 'search-interface';
        this.searchContainer.className = 'search-interface hidden';
        
        // Create the search interface HTML
        this.searchContainer.innerHTML = `
            <div class="search-interface-content">
                <div class="search-title-container">
                    <h1 class="search-title">
                        Scuba <span class="bobbing-penguin">🐧</span>
                    </h1>
                </div>
                
                <div class="search-input-container">
                    <input 
                        type="text" 
                        id="search-interface-input" 
                        class="search-interface-input"
                        placeholder="Search or type URL"
                        autocomplete="off"
                        spellcheck="false"
                    >

                </div>
                
                <div class="search-shortcuts">
                    <button class="shortcut-box" data-url="https://www.google.com">
                        <div class="shortcut-icon">G</div>
                        <div class="shortcut-label">Google</div>
                    </button>
                    <button class="shortcut-box" data-url="https://www.youtube.com">
                        <div class="shortcut-icon">Y</div>
                        <div class="shortcut-label">YouTube</div>
                    </button>
                </div>
            </div>
        `;
        
        // Add to the content area
        const contentArea = document.getElementById('content-area');
        if (contentArea) {
            contentArea.appendChild(this.searchContainer);
        }
    }

    setupEventListeners() {
        // Search input handling
        const searchInput = document.getElementById('search-interface-input');
        
        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
            
            searchInput.addEventListener('input', (e) => {
                this.currentQuery = e.target.value;
            });
            
            searchInput.addEventListener('focus', () => {
                searchInput.select();
            });
        }
        
        // Shortcut boxes
        this.searchContainer.addEventListener('click', (e) => {
            const shortcutBox = e.target.closest('.shortcut-box');
            if (shortcutBox) {
                const url = shortcutBox.dataset.url;
                if (url) {
                    this.navigateToUrl(url);
                }
            }
        });


    }

    performSearch() {
        if (!this.currentQuery.trim()) return;
        
        const query = this.currentQuery.trim();
        
        // Add to recent searches
        this.addToRecentSearches(query);
        
        // Check if it's a URL
        if (query.startsWith('http://') || query.startsWith('https://')) {
            // Always navigate for URLs
            this.navigateToUrl(query);
            return;
        }
        
        // Check if it looks like a domain
        if (!query.includes(' ') && query.includes('.')) {
            // Navigate to URL
            this.navigateToUrl('https://' + query);
            return;
        }
        
        // Use SearchResultsUI for card-based results
        if (window.scuba && window.scuba.searchResultsUI) {
            // Hide search interface first
            this.hide();
            // Use performSearch which handles loading screen properly
            window.scuba.searchResultsUI.performSearch(query);
        } else {
            // Fallback to browser search
            this.performBrowserSearch(query);
        }
    }

    performBrowserSearch(query) {
        let url;
        if (window.scuba && window.scuba.searchEngineManager) {
            url = window.scuba.searchEngineManager.generateSearchUrl(query);
        } else {
            // Fallback to Google
            url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        }
        this.navigateToUrl(url);
    }



    navigateToUrl(url) {
        // Hide search interface
        this.hide();
        
        // Emit navigation event
        this.emit('navigate-to-url', { url });
    }

    addToRecentSearches(query) {
        // Simple localStorage storage without UI updates
        let recentSearches = JSON.parse(localStorage.getItem('scuba-recent-searches') || '[]');
        recentSearches = recentSearches.filter(item => item !== query);
        recentSearches.unshift(query);
        recentSearches = recentSearches.slice(0, 10);
        localStorage.setItem('scuba-recent-searches', JSON.stringify(recentSearches));
    }

    show(query = '') {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.searchContainer.classList.remove('hidden');
        
        // Hide all webviews when search interface is shown
        this.hideAllWebviews();
        
        const searchInput = document.getElementById('search-interface-input');
        
        // Set query if provided, otherwise clear the input
        if (query) {
            this.currentQuery = query;
            if (searchInput) {
                searchInput.value = query;
                searchInput.focus();
                searchInput.select();
            }
        } else {
            // Clear the search input for new tabs
            this.currentQuery = '';
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
        }
        
        console.log('SearchInterface shown');
    }

    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        this.searchContainer.classList.add('hidden');
        
        console.log('SearchInterface hidden');
    }

    isCurrentlyVisible() {
        return this.isVisible;
    }

    hideAllWebviews() {
        // Hide all webviews when search interface is shown
        const webviews = document.querySelectorAll('.webview');
        webviews.forEach(webview => {
            webview.classList.remove('active');
        });
    }

    // Simple event emitter functionality
    emit(eventName, data) {
        const event = new CustomEvent(`search-interface-${eventName}`, { 
            detail: data 
        });
        document.dispatchEvent(event);
    }

    on(eventName, callback) {
        document.addEventListener(`search-interface-${eventName}`, (e) => {
            callback(e.detail);
        });
    }

    // Cleanup
    destroy() {
        if (this.searchContainer) {
            this.searchContainer.remove();
        }
        this.isVisible = false;
    }
}

// Export for use in other modules
window.SearchInterface = SearchInterface;
