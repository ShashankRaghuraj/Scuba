/**
 * SearchEngineManager - Handles different search engines and result parsing
 */
class SearchEngineManager {
    constructor() {
        this.currentEngine = 'searxng'; // Default to SearXNG
        this.engines = {
            searxng: {
                name: 'SearXNG',
                baseUrl: 'http://localhost:8080',
                searchPath: '/search',
                apiPath: '/search',
                supportsJson: true,
                icon: '🔍'
            },
            google: {
                name: 'Google',
                baseUrl: 'https://www.google.com',
                searchPath: '/search',
                apiPath: null,
                supportsJson: false,
                icon: '🌐'
            },
            duckduckgo: {
                name: 'DuckDuckGo',
                baseUrl: 'https://duckduckgo.com',
                searchPath: '/',
                apiPath: null,
                supportsJson: false,
                icon: '🦆'
            }
        };
        
        this.setupEventListeners();
        console.log('SearchEngineManager: Initialized with engine:', this.currentEngine);
    }

    setupEventListeners() {
        // Listen for search engine change requests
        document.addEventListener('search-engine-change', (e) => {
            this.setEngine(e.detail.engine);
        });

        // Listen for search requests
        document.addEventListener('search-request', (e) => {
            this.handleSearchRequest(e.detail.query, e.detail.options || {});
        });
    }

    setEngine(engineName) {
        if (this.engines[engineName]) {
            this.currentEngine = engineName;
            console.log('SearchEngineManager: Changed to engine:', engineName);
            
            // Emit engine change event
            document.dispatchEvent(new CustomEvent('search-engine-changed', {
                detail: { 
                    engine: engineName,
                    engineInfo: this.engines[engineName]
                }
            }));
        } else {
            console.warn('SearchEngineManager: Unknown engine:', engineName);
        }
    }

    getCurrentEngine() {
        return this.engines[this.currentEngine];
    }

    getAvailableEngines() {
        return Object.keys(this.engines).map(key => ({
            key,
            ...this.engines[key]
        }));
    }

    /**
     * Generate search URL for current engine
     */
    generateSearchUrl(query) {
        const engine = this.getCurrentEngine();
        const encodedQuery = encodeURIComponent(query);
        
        switch (this.currentEngine) {
            case 'searxng':
                return `${engine.baseUrl}${engine.searchPath}?q=${encodedQuery}`;
            case 'google':
                return `${engine.baseUrl}${engine.searchPath}?q=${encodedQuery}`;
            case 'duckduckgo':
                return `${engine.baseUrl}${engine.searchPath}?q=${encodedQuery}`;
            default:
                return `${engine.baseUrl}${engine.searchPath}?q=${encodedQuery}`;
        }
    }

    /**
     * Generate API URL for engines that support JSON responses
     */
    generateApiUrl(query, options = {}) {
        const engine = this.getCurrentEngine();
        
        if (!engine.supportsJson) {
            return null;
        }

        const encodedQuery = encodeURIComponent(query);
        let apiUrl = `${engine.baseUrl}${engine.apiPath}?q=${encodedQuery}&format=json`;

        // Add additional options
        if (options.category) {
            apiUrl += `&category_${options.category}=1`;
        }
        if (options.language) {
            apiUrl += `&language=${options.language}`;
        }
        if (options.safesearch !== undefined) {
            apiUrl += `&safesearch=${options.safesearch}`;
        }

        return apiUrl;
    }

    /**
     * Handle search request - either return URL for navigation or fetch results
     */
    async handleSearchRequest(query, options = {}) {
        const engine = this.getCurrentEngine();
        
        if (options.returnResults && engine.supportsJson) {
            // Fetch and return parsed results
            return await this.fetchSearchResults(query, options);
        } else {
            // Return URL for navigation
            const url = this.generateSearchUrl(query);
            
            // Emit navigation event
            document.dispatchEvent(new CustomEvent('search-navigation-requested', {
                detail: { 
                    url,
                    query,
                    engine: this.currentEngine
                }
            }));
            
            return { url, navigated: true };
        }
    }

    /**
     * Fetch search results from API-enabled engines
     */
    async fetchSearchResults(query, options = {}) {
        const engine = this.getCurrentEngine();
        
        if (!engine.supportsJson) {
            throw new Error(`Engine ${this.currentEngine} does not support JSON API`);
        }

        const apiUrl = this.generateApiUrl(query, options);
        
        try {
            console.log('SearchEngineManager: Fetching results from:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const parsedResults = this.parseSearchResults(data, this.currentEngine);
            
            // Emit results event
            document.dispatchEvent(new CustomEvent('search-results-received', {
                detail: {
                    query,
                    results: parsedResults,
                    engine: this.currentEngine,
                    raw: data
                }
            }));

            return parsedResults;
            
        } catch (error) {
            console.error('SearchEngineManager: Error fetching results:', error);
            
            // Emit error event
            document.dispatchEvent(new CustomEvent('search-error', {
                detail: {
                    error: error.message,
                    query,
                    engine: this.currentEngine
                }
            }));
            
            throw error;
        }
    }

    /**
     * Parse search results based on engine format
     */
    parseSearchResults(data, engine) {
        switch (engine) {
            case 'searxng':
                return this.parseSearXNGResults(data);
            default:
                return { results: [], total: 0 };
        }
    }

    /**
     * Parse SearXNG JSON response
     */
    parseSearXNGResults(data) {
        const results = (data.results || []).map(result => ({
            title: result.title || 'No Title',
            url: result.url || '',
            description: result.content || result.description || '',
            engine: result.engine || 'unknown',
            category: result.category || 'general',
            thumbnail: result.img_src || result.thumbnail || null,
            publishedDate: result.publishedDate || null,
            score: result.score || 0
        }));

        return {
            results,
            total: results.length,
            query: data.query || '',
            suggestions: data.suggestions || [],
            infoboxes: data.infoboxes || [],
            unresponsiveEngines: data.unresponsive_engines || [],
            engines: data.engines || []
        };
    }

    /**
     * Test if SearXNG is available
     */
    async testSearXNGConnection() {
        try {
            const response = await fetch('http://localhost:8080/', {
                method: 'GET',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            console.warn('SearchEngineManager: SearXNG not available:', error.message);
            return false;
        }
    }

    /**
     * Auto-detect best available engine
     */
    async autoDetectEngine() {
        // Test SearXNG first (preferred)
        const searxngAvailable = await this.testSearXNGConnection();
        
        if (searxngAvailable) {
            this.setEngine('searxng');
            return 'searxng';
        } else {
            // Fallback to Google
            this.setEngine('google');
            return 'google';
        }
    }
}

// Make available globally
window.SearchEngineManager = SearchEngineManager;
