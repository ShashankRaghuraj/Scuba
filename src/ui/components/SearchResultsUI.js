/**
 * SearchResultsUI - Beautiful card-based search results interface
 */
class SearchResultsUI {
    constructor(tabId = null) {
        this.isVisible = false;
        this.currentResults = null;
        this.currentQuery = '';
        this.currentCategory = 'general'; // Default category
        this.tabId = tabId || Date.now(); // Unique identifier
        this.categoryResults = new Map(); // Store results per category
        this.processedResults = new Map(); // Store processed/rendered results per category
        
        // Tab-specific state - ensure completely clean state
        this.isInitialized = false;
        this.hasSearched = false;
        
        // Initialize with clean state
        this.init();
        
        console.log(`SearchResultsUI created for tab ${this.tabId} with clean state`);
    }

    init() {
        console.log('SearchResultsUI initialized');
        this.createResultsInterface();
        this.setupEventListeners();
    }

    createResultsInterface() {
        // Create the results container with unique ID
        this.resultsContainer = document.createElement('div');
        this.resultsContainer.id = `search-results-ui-${this.tabId}`;
        this.resultsContainer.className = 'search-results-ui hidden';
        
        // Create the results interface HTML
        this.resultsContainer.innerHTML = `
            <div class="search-results-layout">
                <!-- Left Sidebar Navigation -->
                <div class="search-sidebar">
                    <div class="search-header">
                        <div class="search-query-display">
                            <span class="query-text"></span>
                            <button class="new-search-btn" title="New Search">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="11" cy="11" r="8"/>
                                    <path d="M21 21l-4.35-4.35"/>
                                </svg>
                            </button>
                        </div>
                        <div class="search-meta">
                            <span class="results-count"></span>
                        </div>
                    </div>
                    
                    <div class="search-categories">
                        <button class="category-tab active" data-category="general">
                            <span class="category-icon">📄</span>
                            <span class="category-label">All</span>
                        </button>
                        <button class="category-tab" data-category="images">
                            <span class="category-icon">🖼️</span>
                            <span class="category-label">Images</span>
                        </button>
                        <button class="category-tab" data-category="videos">
                            <span class="category-icon">🎥</span>
                            <span class="category-label">Videos</span>
                        </button>
                        <button class="category-tab" data-category="news">
                            <span class="category-icon">📰</span>
                            <span class="category-label">News</span>
                        </button>
                        <button class="category-tab" data-category="map">
                            <span class="category-icon">🗺️</span>
                            <span class="category-label">Maps</span>
                        </button>
                        <button class="category-tab" data-category="music">
                            <span class="category-icon">🎵</span>
                            <span class="category-label">Music</span>
                        </button>
                        <button class="category-tab" data-category="it">
                            <span class="category-icon">💻</span>
                            <span class="category-label">IT</span>
                        </button>
                    </div>
                    
                    <div class="search-engines-info">
                        <span class="search-engines"></span>
                    </div>
                </div>
                
                <!-- Right Results Area -->
                <div class="search-results-main">
                    <div class="search-results-content">
                        <div class="search-results-grid"></div>
                        <div class="search-results-loading">
                            <div class="loading-spinner"></div>
                            <p>Searching across multiple engines...</p>
                        </div>
                        <div class="search-results-error hidden">
                            <div class="error-icon">⚠️</div>
                            <p>Unable to fetch search results</p>
                            <button class="retry-search-btn">Try Again</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Append to content area (same as webviews)
        const contentArea = document.getElementById('content-area');
        if (contentArea) {
            contentArea.appendChild(this.resultsContainer);
        } else {
            // Fallback to body if content area not found
            document.body.appendChild(this.resultsContainer);
        }
    }

    setupEventListeners() {
        // New search button
        const newSearchBtn = this.resultsContainer.querySelector('.new-search-btn');
        newSearchBtn.addEventListener('click', () => {
            this.hide();
            document.dispatchEvent(new CustomEvent('show-search-interface'));
        });

        // Retry search button
        const retryBtn = this.resultsContainer.querySelector('.retry-search-btn');
        retryBtn.addEventListener('click', () => {
            if (this.currentQuery) {
                this.performSearch(this.currentQuery);
            }
        });

        // Listen for search results
        document.addEventListener('search-results-received', (e) => {
            this.displayResults(e.detail.results, e.detail.query);
        });

        // Listen for search errors
        document.addEventListener('search-error', (e) => {
            this.showError();
        });

        // ESC key to go back to search
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
                document.dispatchEvent(new CustomEvent('show-search-interface'));
            }
        });

        // Category tab switching - only for this specific instance
        this.resultsContainer.addEventListener('click', (e) => {
            if (e.target.closest('.category-tab')) {
                const categoryTab = e.target.closest('.category-tab');
                const category = categoryTab.dataset.category;
                console.log(`📱 Category tab clicked in tab ${this.tabId}: ${category}`);
                this.switchCategory(category);
            }
        });
    }

    show() {
        this.resultsContainer.classList.remove('hidden');
        this.isVisible = true;
        
        // Hide other interfaces
        document.dispatchEvent(new CustomEvent('hide-search-interface'));
        document.dispatchEvent(new CustomEvent('hide-welcome-screen'));
        
        // Hide webviews to show results in the webview area - use visibility for faster switching
        const webviews = document.querySelectorAll('webview');
        webviews.forEach(webview => {
            webview.style.visibility = 'hidden';
            webview.style.zIndex = '1';
        });
        
        // Hide welcome screen if visible
        const welcomeScreen = document.getElementById('welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.classList.add('hidden');
        }
    }

    hide() {
        this.resultsContainer.classList.add('hidden');
        this.isVisible = false;
        
        // Show webviews again with immediate visibility
        const webviews = document.querySelectorAll('webview');
        webviews.forEach(webview => {
            // Only show the active webview
            if (webview.classList.contains('active')) {
                webview.style.visibility = 'visible';
                webview.style.zIndex = '10';
            }
        });
    }

    showLoading(message = 'Searching across multiple engines...') {
        const loading = this.resultsContainer.querySelector('.search-results-loading');
        const error = this.resultsContainer.querySelector('.search-results-error');
        const grid = this.resultsContainer.querySelector('.search-results-grid');
        
        // Update loading message
        const loadingText = loading.querySelector('p');
        if (loadingText) {
            loadingText.textContent = message;
        }
        
        loading.classList.remove('hidden');
        error.classList.add('hidden');
        grid.innerHTML = '';
    }

    hideLoading() {
        const loading = this.resultsContainer.querySelector('.search-results-loading');
        loading.classList.add('hidden');
    }

    showError() {
        const loading = this.resultsContainer.querySelector('.search-results-loading');
        const error = this.resultsContainer.querySelector('.search-results-error');
        
        loading.classList.add('hidden');
        error.classList.remove('hidden');
    }

    async performSearch(query) {
        this.currentQuery = query;
        this.show();
        
        // Use the main loading screen for better UX
        if (window.scuba && window.scuba.loadingManager) {
            window.scuba.loadingManager.show('Searching across all categories...');
        } else {
            this.showLoading(); // Fallback to local loading
        }
        
        // Update header
        this.resultsContainer.querySelector('.query-text').textContent = query;
        
        try {
            if (window.scuba && window.scuba.searchEngineManager) {
                // Only load the general search initially for faster loading
                console.log('🚀 Loading general search results...');
                
                const generalResults = await window.scuba.searchEngineManager.handleSearchRequest(query, { returnResults: true });
                
                // Cache the general results
                this.categoryResults.set('general', generalResults);
                
                // Hide loading screen
                if (window.scuba && window.scuba.loadingManager) {
                    window.scuba.loadingManager.hide();
                } else {
                    this.hideLoading();
                }
                
                        // Display the general results using the caching system
        this.displayResults(generalResults, query);
                
                console.log('✅ General search results loaded! Other categories will load on-demand.');
            } else {
                throw new Error('SearchEngineManager not available');
            }
        } catch (error) {
            console.error('Search failed:', error);
            
            // Hide loading screen on error
            if (window.scuba && window.scuba.loadingManager) {
                window.scuba.loadingManager.hide();
            }
            
            this.showError();
        }
    }

    displayResults(results, query) {
        this.hideLoading();
        this.currentResults = results;
        this.currentQuery = query;
        this.hasSearched = true; // Mark this tab as having searched
        
        // Update tab title to reflect the search query
        this.updateTabTitle(query);
        
        // Clear processed results cache for new search
        this.processedResults.clear();
        
        // Store results for general category
        this.categoryResults.set('general', results);
        
        // Update header info
        const resultsCount = this.resultsContainer.querySelector('.results-count');
        const searchEngines = this.resultsContainer.querySelector('.search-engines');
        
        resultsCount.textContent = `${results.total} results`;
        
        if (results.engines && results.engines.length > 0) {
            searchEngines.textContent = `from ${results.engines.join(', ')}`;
        }
        
        // Display results for current category using the caching system
        this.displayCategoryResults('general');

        // Add suggestions if available
        if (results.suggestions && results.suggestions.length > 0) {
            this.addSuggestions(results.suggestions);
        }

        // Add infoboxes if available
        if (results.infoboxes && results.infoboxes.length > 0) {
            this.addInfoboxes(results.infoboxes);
        }
    }

    createResultCard(result, index) {
        const card = document.createElement('div');
        card.className = 'search-result-card';
        card.style.animationDelay = `${index * 50}ms`;
        
        // Extract domain from URL
        let domain = '';
        try {
            domain = new URL(result.url).hostname.replace('www.', '');
        } catch (e) {
            domain = result.url;
        }

        // Format date if available
        let dateStr = '';
        if (result.publishedDate) {
            try {
                const date = new Date(result.publishedDate);
                dateStr = date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
            } catch (e) {
                // Ignore date formatting errors
            }
        }

        card.innerHTML = `
            <div class="result-header">
                <div class="result-favicon">
                    <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=16" 
                         alt="" 
                         onerror="this.style.display='none'">
                </div>
                <div class="result-domain">${domain}</div>
                ${dateStr ? `<div class="result-date">${dateStr}</div>` : ''}
                <div class="result-engine">${result.engine || ''}</div>
            </div>
            
            <h3 class="result-title">
                <a href="${result.url}" target="_blank" rel="noopener noreferrer">
                    ${this.highlightQuery(result.title, this.currentQuery)}
                </a>
            </h3>
            
            ${result.description ? `
                <p class="result-description">
                    ${this.highlightQuery(this.truncateText(result.description, 160), this.currentQuery)}
                </p>
            ` : ''}
            
            <div class="result-url">
                <a href="${result.url}" target="_blank" rel="noopener noreferrer">
                    ${result.url}
                </a>
            </div>
            
            ${result.thumbnail ? `
                <div class="result-thumbnail">
                    <img src="${result.thumbnail}" alt="" loading="lazy">
                </div>
            ` : ''}
        `;

        // Add click handler to navigate within Scuba browser
        card.addEventListener('click', (e) => {
            if (e.target.tagName !== 'A') {
                const link = card.querySelector('.result-title a');
                if (link) {
                    // Add immediate visual feedback
                    card.style.transform = 'scale(0.98) translateY(1px)';
                    card.style.transition = 'transform 0.1s ease';
                    
                    // Navigate in current Scuba tab instead of opening external browser
                    setTimeout(() => {
                        this.navigateToUrl(link.href);
                    }, 50); // Small delay for visual feedback
                }
            }
        });

        // Also handle direct link clicks to stay within Scuba
        const links = card.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Add immediate visual feedback
                card.style.transform = 'scale(0.98) translateY(1px)';
                card.style.transition = 'transform 0.1s ease';
                
                // Navigate with slight delay for feedback
                setTimeout(() => {
                    this.navigateToUrl(link.href);
                }, 50);
            });
        });

        return card;
    }

    createImageCard(result, index) {
        const card = document.createElement('div');
        card.className = 'image-result-card';
        card.style.animationDelay = `${index * 30}ms`;
        
        const imageUrl = result.img_src || result.thumbnail || result.url;
        const title = result.title || 'Image';
        
        card.innerHTML = `
            <div class="image-container">
                <img src="${imageUrl}" alt="${title}" loading="lazy" class="result-image">
            </div>
        `;

        // Add click handler for direct navigation
        card.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Immediate visual feedback
            card.style.transform = 'scale(0.98)';
            card.style.transition = 'transform 0.1s ease';
            
            setTimeout(() => {
                this.navigateToUrl(result.url);
            }, 50);
        });

        return card;
    }

    createVideoCard(result, index) {
        const card = document.createElement('div');
        card.className = 'video-result-card';
        card.style.animationDelay = `${index * 40}ms`;
        
        const thumbnail = result.thumbnail || result.img_src;
        const title = result.title || 'Video';
        const domain = this.extractDomain(result.url);
        const duration = result.length || '';
        
        card.innerHTML = `
            <div class="video-thumbnail">
                ${thumbnail ? `<img src="${thumbnail}" alt="${title}" loading="lazy">` : ''}
                <div class="video-play-overlay">
                    <div class="play-button">▶</div>
                </div>
                ${duration ? `<div class="video-duration">${duration}</div>` : ''}
            </div>
            <div class="video-info">
                <h3 class="video-title">${this.highlightQuery(title, this.currentQuery)}</h3>
                <div class="video-meta">
                    <span class="video-domain">${domain}</span>
                    ${result.publishedDate ? `<span class="video-date">${this.formatDate(result.publishedDate)}</span>` : ''}
                </div>
                ${result.content ? `<p class="video-description">${this.truncateText(result.content, 100)}</p>` : ''}
            </div>
        `;

        // Add click handler
        card.addEventListener('click', (e) => {
            card.style.transform = 'scale(0.98)';
            card.style.transition = 'transform 0.1s ease';
            
            setTimeout(() => {
                this.navigateToUrl(result.url);
            }, 50);
        });

        return card;
    }

    extractDomain(url) {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch (e) {
            return url;
        }
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        } catch (e) {
            return dateString;
        }
    }

    addSuggestions(suggestions) {
        const grid = this.resultsContainer.querySelector('.search-results-grid');
        
        const suggestionsCard = document.createElement('div');
        suggestionsCard.className = 'search-suggestions-card';
        
        suggestionsCard.innerHTML = `
            <h4>Related Searches</h4>
            <div class="suggestions-list">
                ${suggestions.slice(0, 6).map(suggestion => `
                    <button class="suggestion-item" data-query="${suggestion}">
                        ${suggestion}
                    </button>
                `).join('')}
            </div>
        `;

        // Add click handlers for suggestions
        suggestionsCard.querySelectorAll('.suggestion-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const query = btn.dataset.query;
                this.performSearch(query);
            });
        });

        grid.appendChild(suggestionsCard);
    }

    addInfoboxes(infoboxes) {
        const grid = this.resultsContainer.querySelector('.search-results-grid');
        
        infoboxes.forEach(infobox => {
            const infoCard = document.createElement('div');
            infoCard.className = 'search-infobox-card';
            
            infoCard.innerHTML = `
                <div class="infobox-header">
                    ${infobox.img_src ? `<img src="${infobox.img_src}" alt="${infobox.infobox}" class="infobox-image">` : ''}
                    <h3>${infobox.infobox}</h3>
                </div>
                <p class="infobox-content">${infobox.content}</p>
                ${infobox.urls ? `
                    <div class="infobox-links">
                        ${infobox.urls.slice(0, 3).map(url => `
                            <a href="${url.url}" target="_blank" rel="noopener noreferrer" class="infobox-link">
                                ${url.title}
                            </a>
                        `).join('')}
                    </div>
                ` : ''}
            `;

            // Insert at the beginning of results
            grid.insertBefore(infoCard, grid.firstChild);
        });
    }

    highlightQuery(text, query) {
        if (!query || !text) return text;
        
        const words = query.toLowerCase().split(' ').filter(word => word.length > 2);
        let highlightedText = text;
        
        words.forEach(word => {
            const regex = new RegExp(`(${word})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        });
        
        return highlightedText;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
    }

    updateTabTitle(query) {
        // Update tab title to show search query
        if (window.scuba && window.scuba.tabManager && this.tabId) {
            const truncatedQuery = this.truncateText(query, 30); // Limit title length
            window.scuba.tabManager.updateTabTitle(this.tabId, truncatedQuery);
            
            // Also update window title if this is the active tab
            const activeTab = window.scuba.tabManager.getActiveTab();
            if (activeTab && activeTab.id === this.tabId) {
                document.title = `${truncatedQuery} - Scuba`;
            }
        }
    }

    resetTabTitle() {
        // Reset tab title to "New Tab" when no search has been performed
        if (window.scuba && window.scuba.tabManager && this.tabId) {
            window.scuba.tabManager.updateTabTitle(this.tabId, 'New Tab');
            
            // Also update window title if this is the active tab
            const activeTab = window.scuba.tabManager.getActiveTab();
            if (activeTab && activeTab.id === this.tabId) {
                document.title = 'Scuba';
            }
        }
    }

    // Public API
    search(query) {
        this.performSearch(query);
    }

    isShowing() {
        return this.isVisible;
    }

    getCurrentQuery() {
        return this.currentQuery;
    }

    getCurrentResults() {
        return this.currentResults;
    }

    // Legacy method for backward compatibility - redirects to performSearch
    async search(query) {
        return this.performSearch(query);
    }

    // Switch between search categories - NOW INSTANT!
    switchCategory(category) {
        if (category === this.currentCategory) {
            console.log(`⚠️ Already on category '${category}' - no switch needed`);
            return;
        }
        
        console.log(`🔄 Switching from '${this.currentCategory}' to '${category}'`);
        this.currentCategory = category;
        
        // Update active tab styling with smooth transition
        const tabs = this.resultsContainer.querySelectorAll('.category-tab');
        tabs.forEach(tab => {
            const isActive = tab.dataset.category === category;
            tab.classList.toggle('active', isActive);
            
            // Add smooth scaling effect
            if (isActive) {
                tab.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    tab.style.transform = '';
                }, 150);
            }
        });
        
        // Check if category is already cached for instant display
        if (this.categoryResults.has(category)) {
            console.log(`✅ Category '${category}' already cached, displaying instantly`);
            this.displayCategoryResults(category);
        } else {
            console.log(`🔄 Loading '${category}' category on-demand...`);
            
            // Add loading state to the tab
            const activeTab = this.resultsContainer.querySelector(`.category-tab[data-category="${category}"]`);
            if (activeTab) {
                activeTab.classList.add('loading');
                // Remove loading state after search completes, regardless of current tab
                this.searchCategory(this.currentQuery, category).then(() => {
                    // Always remove loading state from the tab that was loading
                    activeTab.classList.remove('loading');
                }).catch(() => {
                    // Always remove loading state on error
                    activeTab.classList.remove('loading');
                });
            } else {
                this.searchCategory(this.currentQuery, category);
            }
        }
    }

    // Search specific category (fallback for missing categories)
    async searchCategory(query, category) {
        // Use local loading for category switches (only in results area)
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        this.showLoading(`Loading ${categoryName} results...`);
        
        try {
            if (window.scuba && window.scuba.searchEngineManager) {
                // Use SearchEngineManager with category parameter
                const results = await window.scuba.searchEngineManager.handleSearchRequest(query, { 
                    returnResults: true,
                    category: category === 'general' ? null : category
                });
                
                // Cache results for this category
                this.categoryResults.set(category, results);
                
                // Only display results if user is still on this category tab
                // This prevents race conditions when switching tabs during loading
                if (this.currentCategory === category && this.isVisible) {
                    console.log(`✅ Category '${category}' loaded and user is still on this tab - displaying results`);
                    this.hideLoading();
                    this.displayCategoryResults(category);
                } else {
                    console.log(`⚠️ Category '${category}' loaded but user switched to '${this.currentCategory}' - results cached but not displayed`);
                    this.hideLoading();
                }
            }
        } catch (error) {
            console.error('Category search failed:', error);
            
            // Only show error if user is still on this category and this tab is visible
            if (this.currentCategory === category && this.isVisible) {
                this.hideLoading();
                this.showError();
            } else {
                this.hideLoading();
            }
        }
    }

    // Display results for specific category - NOW INSTANT AND SMOOTH!
    displayCategoryResults(category) {
        const results = this.categoryResults.get(category);
        if (!results) return;
        
        this.hideLoading();
        
        // Get the grid container
        const grid = this.resultsContainer.querySelector('.search-results-grid');
        
        // Check if we have processed results cached
        console.log(`🔍 Checking cache for category '${category}' in tab ${this.tabId}`);
        console.log(`📊 Cache has ${this.processedResults.size} categories: [${Array.from(this.processedResults.keys()).join(', ')}]`);
        
        if (this.processedResults.has(category)) {
            console.log(`✅ Using cached processed results for category '${category}' in tab ${this.tabId}`);
            // Use cached processed HTML - no reprocessing!
            const cachedHTML = this.processedResults.get(category);
            
            // Smooth fade out current results
            grid.style.opacity = '0';
            grid.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                grid.innerHTML = cachedHTML.html;
                grid.className = cachedHTML.className;
                
                // Smooth fade in cached results
                requestAnimationFrame(() => {
                    grid.style.opacity = '1';
                    grid.style.transform = 'translateY(0)';
                });
            }, 100);
            return;
        }
        
        console.log(`🔄 Processing and caching results for category '${category}' in tab ${this.tabId}`);
        
        // Smooth fade out current results
        grid.style.opacity = '0';
        grid.style.transform = 'translateY(10px)';
        
        // After fade out, process and cache results
        setTimeout(() => {
            // Clear existing results
            grid.innerHTML = '';
            
            // Create appropriate cards based on category
            if (category === 'images') {
                this.displayImageResults(results);
            } else if (category === 'videos') {
                this.displayVideoResults(results);
            } else {
                this.displayGeneralResults(results);
            }
            
            // Cache the processed HTML for instant future display
            this.processedResults.set(category, {
                html: grid.innerHTML,
                className: grid.className
            });
            
            // Smooth fade in new results
            requestAnimationFrame(() => {
                grid.style.opacity = '1';
                grid.style.transform = 'translateY(0)';
            });
        }, 100); // Quick transition
    }

    // Display image results as image cards
    displayImageResults(results) {
        const grid = this.resultsContainer.querySelector('.search-results-grid');
        grid.className = 'search-results-grid images-grid';
        
        // Filter, deduplicate and sort image results by score
        const imageResults = results.results
            .filter(result => result.img_src || result.thumbnail)
            .sort((a, b) => {
                const scoreA = parseFloat(a.score) || 0;
                const scoreB = parseFloat(b.score) || 0;
                return scoreB - scoreA; // Highest score first
            })
            // Remove duplicate images
            .filter((result, index, array) => {
                return this.isUniqueResult(result, array.slice(0, index));
            })
            .slice(0, 30); // Show more images since they're visual
        
        imageResults.forEach((result, index) => {
            const imageCard = this.createImageCard(result, index);
            grid.appendChild(imageCard);
        });
    }

    // Display video results
    displayVideoResults(results) {
        const grid = this.resultsContainer.querySelector('.search-results-grid');
        grid.className = 'search-results-grid videos-grid';
        
        // Filter, deduplicate and sort video results by score
        const videoResults = [...results.results]
            .sort((a, b) => {
                const scoreA = parseFloat(a.score) || 0;
                const scoreB = parseFloat(b.score) || 0;
                return scoreB - scoreA; // Highest score first
            })
            // Remove duplicate videos
            .filter((result, index, array) => {
                return this.isUniqueResult(result, array.slice(0, index));
            })
            .slice(0, 20); // Limit to top unique videos
        
        videoResults.forEach((result, index) => {
            const videoCard = this.createVideoCard(result, index);
            grid.appendChild(videoCard);
        });
    }

    // Display general results (existing functionality)
    displayGeneralResults(results) {
        const grid = this.resultsContainer.querySelector('.search-results-grid');
        grid.className = 'search-results-grid general-grid';
        
        // Filter, deduplicate and sort results for best quality
        const qualityResults = [...results.results]
            // Filter out low-quality results
            .filter(result => {
                const score = parseFloat(result.score) || 0;
                // Only show results with decent scores and proper URLs
                return score > 0.05 && result.url && result.title && result.title.trim().length > 0;
            })
            // Sort by score (highest first) for better relevance
            .sort((a, b) => {
                const scoreA = parseFloat(a.score) || 0;
                const scoreB = parseFloat(b.score) || 0;
                return scoreB - scoreA; // Descending order (highest score first)
            })
            // Remove duplicates and similar results
            .filter((result, index, array) => {
                return this.isUniqueResult(result, array.slice(0, index));
            })
            // Limit to top 15 unique results
            .slice(0, 15);
        
        // Separate Wikipedia results for priority display
        const wikipediaResult = this.findWikipediaResult(qualityResults);
        const otherResults = qualityResults.filter(result => !this.isWikipediaResult(result));
        
        // Add Wikipedia card first if available
        if (wikipediaResult) {
            const wikipediaCard = this.createWikipediaCard(wikipediaResult);
            grid.appendChild(wikipediaCard);
        }
        
        // Add other results
        otherResults.forEach((result, index) => {
            const card = this.createResultCard(result, index + (wikipediaResult ? 1 : 0));
            grid.appendChild(card);
        });
    }

    // Check if a result is from Wikipedia
    isWikipediaResult(result) {
        if (!result || !result.url) return false;
        
        const url = result.url.toLowerCase();
        return url.includes('wikipedia.org') || 
               (result.engine && result.engine.toLowerCase().includes('wikipedia'));
    }
    
    // Find the best Wikipedia result from the results array
    findWikipediaResult(results) {
        return results.find(result => this.isWikipediaResult(result));
    }
    
    // Create a special Wikipedia card with enhanced styling
    createWikipediaCard(result) {
        const card = document.createElement('div');
        card.className = 'search-result-card wikipedia-card';
        
        const favicon = this.getFavicon(result.url);
        const domain = this.extractDomain(result.url);
        const highlightedTitle = this.highlightQuery(result.title, this.currentQuery);
        const highlightedDescription = this.highlightQuery(
            this.truncateText(result.description, 200), 
            this.currentQuery
        );
        
        card.innerHTML = `
            <div class="wikipedia-header">
                <div class="wikipedia-badge">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L2 22h20L12 2z"/>
                        <path d="M12 6v10"/>
                        <path d="M8 14l8-8"/>
                        <path d="M16 14l-8-8"/>
                    </svg>
                    <span>Wikipedia</span>
                </div>
                <div class="result-source">
                    <img src="${favicon}" alt="${domain}" class="favicon" onerror="this.style.display='none'">
                    <span class="domain">${domain}</span>
                </div>
            </div>
            <h3 class="result-title">${highlightedTitle}</h3>
            <p class="result-description">${highlightedDescription}</p>
        `;
        
        card.addEventListener('click', () => {
            if (this.tabId && window.webviewManager) {
                window.webviewManager.loadURL(this.tabId, result.url);
            } else {
                window.open(result.url, '_blank', 'noopener,noreferrer');
            }
        });
        
        // Add enhanced animation delay for Wikipedia card
        card.style.animationDelay = '0.1s';
        
        return card;
    }

    // Check if a result is unique compared to previous results
    isUniqueResult(result, previousResults) {
        const normalizeUrl = (url) => {
            try {
                const parsed = new URL(url);
                // Remove common variations
                let normalized = parsed.hostname.replace(/^www\./, '') + parsed.pathname;
                // Remove trailing slashes and common parameters
                normalized = normalized.replace(/\/$/, '').replace(/\?.*$/, '').replace(/#.*$/, '');
                return normalized.toLowerCase();
            } catch (e) {
                return url.toLowerCase();
            }
        };

        const normalizeTitle = (title) => {
            return title.toLowerCase()
                .replace(/[^\w\s]/g, ' ') // Remove special characters
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();
        };

        const getDomainName = (url) => {
            try {
                const parsed = new URL(url);
                return parsed.hostname.replace(/^www\./, '').toLowerCase();
            } catch (e) {
                return '';
            }
        };

        const currentUrl = normalizeUrl(result.url);
        const currentTitle = normalizeTitle(result.title);
        const currentDomain = getDomainName(result.url);

        // Count how many results we already have from this domain
        const domainCount = previousResults.filter(prev => 
            getDomainName(prev.url) === currentDomain
        ).length;

        return !previousResults.some(prev => {
            const prevUrl = normalizeUrl(prev.url);
            const prevTitle = normalizeTitle(prev.title);
            const prevDomain = getDomainName(prev.url);
            
            // Check for exact URL match
            if (currentUrl === prevUrl) return true;
            
            // More aggressive domain limiting - max 2 results per domain
            if (currentDomain === prevDomain && domainCount >= 2) return true;
            
            // Check for very similar URLs (same domain + similar path)
            if (currentDomain === prevDomain) {
                const pathSimilarity = this.calculateStringSimilarity(currentUrl, prevUrl);
                if (pathSimilarity > 0.7) return true; // More aggressive threshold
            }
            
            // Check for very similar titles (likely duplicates)
            const titleSimilarity = this.calculateStringSimilarity(currentTitle, prevTitle);
            if (titleSimilarity > 0.75) return true; // More aggressive threshold
            
            // Special case: if titles contain similar key phrases, likely duplicate
            const titleWords = currentTitle.split(' ').filter(w => w.length > 3);
            const prevTitleWords = prevTitle.split(' ').filter(w => w.length > 3);
            const commonWords = titleWords.filter(word => prevTitleWords.includes(word));
            if (commonWords.length >= Math.min(titleWords.length, prevTitleWords.length) * 0.6) {
                return true;
            }
            
            return false;
        });
    }

    // Calculate string similarity (0-1, where 1 is identical)
    calculateStringSimilarity(str1, str2) {
        if (str1 === str2) return 1;
        if (str1.length === 0 || str2.length === 0) return 0;
        
        // Use Levenshtein distance for similarity
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        const maxLength = Math.max(str1.length, str2.length);
        return 1 - (matrix[str2.length][str1.length] / maxLength);
    }



    // Navigate within Scuba browser
    navigateToUrl(url) {
        // Show loading immediately for better UX
        if (window.scuba && window.scuba.loadingManager) {
            window.scuba.loadingManager.showPageLoad();
        }
        
        // Hide search results immediately
        this.hide();
        
        // Navigate to URL in current tab with immediate feedback
        document.dispatchEvent(new CustomEvent('navigate-to-url', {
            detail: { url, immediate: true }
        }));
        
        // Also trigger direct webview navigation for faster loading
        if (window.scuba && window.scuba.webviewManager) {
            const activeTab = window.scuba.tabManager.getActiveTab();
            if (activeTab) {
                window.scuba.webviewManager.navigateWebview(activeTab.id, url);
            }
        }
    }
}

// Make available globally
window.SearchResultsUI = SearchResultsUI;
