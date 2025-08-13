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
        this.init();
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

        // Category tab switching
        document.addEventListener('click', (e) => {
            if (e.target.closest('.category-tab') && this.isVisible) {
                const categoryTab = e.target.closest('.category-tab');
                const category = categoryTab.dataset.category;
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

    showLoading() {
        const loading = this.resultsContainer.querySelector('.search-results-loading');
        const error = this.resultsContainer.querySelector('.search-results-error');
        const grid = this.resultsContainer.querySelector('.search-results-grid');
        
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
                // Start all searches simultaneously for instant tab switching
                const searchPromises = [
                    // General search (All tab)
                    window.scuba.searchEngineManager.handleSearchRequest(query, { returnResults: true }),
                    // Images search
                    window.scuba.searchEngineManager.handleSearchRequest(query, { returnResults: true, category: 'images' }),
                    // Videos search  
                    window.scuba.searchEngineManager.handleSearchRequest(query, { returnResults: true, category: 'videos' }),
                    // News search
                    window.scuba.searchEngineManager.handleSearchRequest(query, { returnResults: true, category: 'news' }),
                    // Maps search
                    window.scuba.searchEngineManager.handleSearchRequest(query, { returnResults: true, category: 'map' }),
                    // Music search
                    window.scuba.searchEngineManager.handleSearchRequest(query, { returnResults: true, category: 'music' }),
                    // IT search
                    window.scuba.searchEngineManager.handleSearchRequest(query, { returnResults: true, category: 'it' }),
                ];
                
                console.log('🚀 Starting parallel search across all 7 categories...');
                
                // Wait for all searches to complete
                const [generalResults, imageResults, videoResults, newsResults, mapResults, musicResults, itResults] = await Promise.all(searchPromises);
                
                // Cache all results immediately
                this.categoryResults.set('general', generalResults);
                this.categoryResults.set('images', imageResults);
                this.categoryResults.set('videos', videoResults);
                this.categoryResults.set('news', newsResults);
                this.categoryResults.set('map', mapResults);
                this.categoryResults.set('music', musicResults);
                this.categoryResults.set('it', itResults);
                
                // Hide loading screen
                if (window.scuba && window.scuba.loadingManager) {
                    window.scuba.loadingManager.hide();
                } else {
                    this.hideLoading();
                }
                
                // Display the general results by default
                this.displayResults(generalResults, query);
                
                console.log('✅ All 7 search categories loaded and cached for instant switching!');
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
        
        // Store results for general category
        this.categoryResults.set('general', results);
        
        // Update header info
        const resultsCount = this.resultsContainer.querySelector('.results-count');
        const searchEngines = this.resultsContainer.querySelector('.search-engines');
        
        resultsCount.textContent = `${results.total} results`;
        
        if (results.engines && results.engines.length > 0) {
            searchEngines.textContent = `from ${results.engines.join(', ')}`;
        }
        
        // Display results for current category
        this.displayGeneralResults(results);

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
        if (category === this.currentCategory) return;
        
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
        
        // Results should already be cached - instant display!
        if (this.categoryResults.has(category)) {
            this.displayCategoryResults(category);
        } else {
            console.warn(`Category ${category} not preloaded, loading now...`);
            this.searchCategory(this.currentQuery, category);
        }
    }

    // Search specific category (fallback for missing categories)
    async searchCategory(query, category) {
        // Use main loading screen for consistency
        if (window.scuba && window.scuba.loadingManager) {
            window.scuba.loadingManager.show(`Loading ${category} results...`);
        } else {
            this.showLoading();
        }
        
        try {
            if (window.scuba && window.scuba.searchEngineManager) {
                // Use SearchEngineManager with category parameter
                const results = await window.scuba.searchEngineManager.handleSearchRequest(query, { 
                    returnResults: true,
                    category: category === 'general' ? null : category
                });
                
                // Cache results for this category
                this.categoryResults.set(category, results);
                
                // Hide loading screen
                if (window.scuba && window.scuba.loadingManager) {
                    window.scuba.loadingManager.hide();
                } else {
                    this.hideLoading();
                }
                
                this.displayCategoryResults(category);
            }
        } catch (error) {
            console.error('Category search failed:', error);
            
            // Hide loading screen on error
            if (window.scuba && window.scuba.loadingManager) {
                window.scuba.loadingManager.hide();
            }
            
            this.showError();
        }
    }

    // Display results for specific category - NOW INSTANT AND SMOOTH!
    displayCategoryResults(category) {
        const results = this.categoryResults.get(category);
        if (!results) return;
        
        this.hideLoading();
        
        // Get the grid container
        const grid = this.resultsContainer.querySelector('.search-results-grid');
        
        // Smooth fade out current results
        grid.style.opacity = '0';
        grid.style.transform = 'translateY(10px)';
        
        // After fade out, change content and fade in
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
        
        qualityResults.forEach((result, index) => {
            const card = this.createResultCard(result, index);
            grid.appendChild(card);
        });
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
