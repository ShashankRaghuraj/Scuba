/**
 * Scuba Browser - Main Renderer Process
 * Clean, component-based architecture
 */

// Global app instance
let app = null;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Scuba Browser starting...');
    
    try {
        // Create main app instance
        app = new App();
        
        // Make app globally accessible for debugging
        window.scuba = app;
        
        console.log('Scuba Browser started successfully');
        
        // Optional: Show debug info in development
        if (process.argv?.includes('--dev')) {
            console.log('Debug info:', app.debugInfo());
            
            // Add debug tools to window
            window.debug = {
                app: app,
                components: {
                    tabs: app.tabManager,
                    webviews: app.webviewManager,
                    navigation: app.navigationBar,
                    ui: app.uiManager,
                    loading: app.loadingManager,
                    performance: app.performanceMonitor,
                    search: app.searchInterface,
                    searchEngine: app.searchEngineManager,
                    searchResults: app.searchResultsUI
                },
                info: () => app.debugInfo(),
                navigate: (url) => app.navigate(url),
                newTab: (url) => app.newTab(url),
                closeTab: (id) => app.closeTab(id),
                searchEngines: () => app.searchEngineManager?.getAvailableEngines() || [],
                setSearchEngine: (engine) => app.searchEngineManager?.setEngine(engine),
                testSearch: async (query) => {
                    if (app.searchEngineManager) {
                        try {
                            return await app.searchEngineManager.handleSearchRequest(query, { returnResults: true });
                        } catch (error) {
                            console.error('Search test failed:', error);
                            return null;
                        }
                    }
                }
            };
            
            console.log('Debug tools available at window.debug');
        }
        
    } catch (error) {
        console.error('Failed to start Scuba Browser:', error);
        
        // Show error message to user
        showErrorMessage('Failed to initialize browser. Please restart the application.');
    }
});

// Handle application shutdown
window.addEventListener('beforeunload', () => {
    if (app) {
        console.log('Shutting down Scuba Browser...');
        app.destroy();
    }
});

// Error handling
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
    
    // Only show user-facing errors in production
    if (!process.argv?.includes('--dev')) {
        showErrorMessage('An unexpected error occurred. Please try refreshing the page.');
    }
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    
    // Prevent the default browser behavior
    e.preventDefault();
});

// Utility functions
function showErrorMessage(message) {
    // Create a simple error overlay
    const errorOverlay = document.createElement('div');
    errorOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 16px;
        z-index: 10000;
        text-align: center;
        padding: 40px;
    `;
    
    const errorContent = document.createElement('div');
    errorContent.innerHTML = `
        <h2 style="margin-bottom: 20px; color: #ff6b6b;">Something went wrong</h2>
        <p style="margin-bottom: 30px; line-height: 1.5;">${message}</p>
        <button onclick="location.reload()" style="
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            transition: background 0.2s;
        " onmouseover="this.style.background='#45a049'" onmouseout="this.style.background='#4CAF50'">
            Reload Application
        </button>
    `;
    
    errorOverlay.appendChild(errorContent);
    document.body.appendChild(errorOverlay);
}

// Performance monitoring (development only)
if (process.argv?.includes('--dev')) {
    // Monitor performance
    const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
            if (entry.duration > 100) { // Log slow operations
                console.warn(`Slow operation detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
            }
        });
    });
    
    observer.observe({ entryTypes: ['measure', 'navigation'] });
    
    // Memory usage monitoring
    setInterval(() => {
        if (performance.memory) {
            const memory = performance.memory;
            const used = Math.round(memory.usedJSHeapSize / 1048576);
            const total = Math.round(memory.totalJSHeapSize / 1048576);
            
            if (used > 100) { // Warn if using more than 100MB
                console.warn(`High memory usage: ${used}MB / ${total}MB`);
            }
        }
    }, 30000); // Check every 30 seconds
}

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { app };
}

