/**
 * PerformanceMonitor - Tracks and optimizes browser performance
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            tabSwitchTime: [],
            pageLoadTime: [],
            webviewCreationTime: [],
            memoryUsage: [],
            frameRate: []
        };
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.init();
    }

    init() {
        console.log('PerformanceMonitor initialized');
        this.startMonitoring();
    }

    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        
        // Monitor frame rate
        this.monitorFrameRate();
        
        // Monitor memory usage
        this.monitorMemoryUsage();
        
        // Monitor tab switching performance
        this.monitorTabSwitching();
        
        // Monitor webview creation performance
        this.monitorWebviewCreation();
        
        console.log('Performance monitoring started');
    }

    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        console.log('Performance monitoring stopped');
    }

    monitorFrameRate() {
        let lastTime = performance.now();
        let frameCount = 0;
        
        const measureFrameRate = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                this.metrics.frameRate.push({
                    timestamp: currentTime,
                    fps: fps
                });
                
                // Keep only last 100 measurements
                if (this.metrics.frameRate.length > 100) {
                    this.metrics.frameRate.shift();
                }
                
                // Log low frame rates
                if (fps < 30) {
                    console.warn(`Low frame rate detected: ${fps} FPS`);
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            if (this.isMonitoring) {
                requestAnimationFrame(measureFrameRate);
            }
        };
        
        requestAnimationFrame(measureFrameRate);
    }

    monitorMemoryUsage() {
        this.monitoringInterval = setInterval(() => {
            if (performance.memory) {
                const memory = performance.memory;
                const used = Math.round(memory.usedJSHeapSize / 1048576);
                const total = Math.round(memory.totalJSHeapSize / 1048576);
                
                this.metrics.memoryUsage.push({
                    timestamp: performance.now(),
                    used: used,
                    total: total
                });
                
                // Keep only last 100 measurements
                if (this.metrics.memoryUsage.length > 100) {
                    this.metrics.memoryUsage.shift();
                }
                
                // Warn about high memory usage
                if (used > 200) {
                    console.warn(`High memory usage: ${used}MB / ${total}MB`);
                }
            }
        }, 5000); // Check every 5 seconds
    }

    monitorTabSwitching() {
        document.addEventListener('tab-manager-tab-switched', (e) => {
            const startTime = performance.now();
            
            // Measure the time it takes for the webview to become visible
            const checkWebviewVisible = () => {
                const webview = document.querySelector(`#webview-${e.detail.tabId}`);
                if (webview && webview.classList.contains('active')) {
                    const endTime = performance.now();
                    const switchTime = endTime - startTime;
                    
                    this.metrics.tabSwitchTime.push({
                        timestamp: endTime,
                        tabId: e.detail.tabId,
                        switchTime: switchTime
                    });
                    
                    // Keep only last 50 measurements
                    if (this.metrics.tabSwitchTime.length > 50) {
                        this.metrics.tabSwitchTime.shift();
                    }
                    
                    // Log slow tab switches
                    if (switchTime > 100) {
                        console.warn(`Slow tab switch detected: ${switchTime.toFixed(2)}ms`);
                    }
                } else {
                    // Check again in the next frame
                    requestAnimationFrame(checkWebviewVisible);
                }
            };
            
            requestAnimationFrame(checkWebviewVisible);
        });
    }

    monitorWebviewCreation() {
        document.addEventListener('tab-manager-tab-created', (e) => {
            const startTime = performance.now();
            
            // Measure webview creation time
            const checkWebviewCreated = () => {
                const webview = document.querySelector(`#webview-${e.detail.tabId}`);
                if (webview) {
                    const endTime = performance.now();
                    const creationTime = endTime - startTime;
                    
                    this.metrics.webviewCreationTime.push({
                        timestamp: endTime,
                        tabId: e.detail.tabId,
                        creationTime: creationTime
                    });
                    
                    // Keep only last 50 measurements
                    if (this.metrics.webviewCreationTime.length > 50) {
                        this.metrics.webviewCreationTime.shift();
                    }
                    
                    // Log slow webview creation
                    if (creationTime > 200) {
                        console.warn(`Slow webview creation detected: ${creationTime.toFixed(2)}ms`);
                    }
                } else {
                    // Check again in the next frame
                    requestAnimationFrame(checkWebviewCreated);
                }
            };
            
            requestAnimationFrame(checkWebviewCreated);
        });
    }

    // Performance optimization methods
    optimizeTabSwitching() {
        // Preload adjacent tabs
        const activeTab = document.querySelector('.tab.active');
        if (activeTab) {
            const tabs = Array.from(document.querySelectorAll('.tab'));
            const activeIndex = tabs.indexOf(activeTab);
            
            // Preload next tab
            if (activeIndex < tabs.length - 1) {
                const nextTab = tabs[activeIndex + 1];
                const nextTabId = parseInt(nextTab.dataset.tabId);
                this.preloadTab(nextTabId);
            }
            
            // Preload previous tab
            if (activeIndex > 0) {
                const prevTab = tabs[activeIndex - 1];
                const prevTabId = parseInt(prevTab.dataset.tabId);
                this.preloadTab(prevTabId);
            }
        }
    }

    preloadTab(tabId) {
        // This would implement tab preloading logic
        // For now, just log the intention
        console.log(`Preloading tab ${tabId} for faster switching`);
    }

    // Get performance statistics
    getStats() {
        const stats = {
            averageTabSwitchTime: this.calculateAverage(this.metrics.tabSwitchTime, 'switchTime'),
            averageWebviewCreationTime: this.calculateAverage(this.metrics.webviewCreationTime, 'creationTime'),
            averageFrameRate: this.calculateAverage(this.metrics.frameRate, 'fps'),
            averageMemoryUsage: this.calculateAverage(this.metrics.memoryUsage, 'used'),
            totalTabsSwitched: this.metrics.tabSwitchTime.length,
            totalWebviewsCreated: this.metrics.webviewCreationTime.length
        };
        
        return stats;
    }

    calculateAverage(array, key) {
        if (array.length === 0) return 0;
        const sum = array.reduce((acc, item) => acc + item[key], 0);
        return Math.round((sum / array.length) * 100) / 100;
    }

    // Performance recommendations
    getRecommendations() {
        const stats = this.getStats();
        const recommendations = [];
        
        if (stats.averageTabSwitchTime > 100) {
            recommendations.push('Tab switching is slow. Consider reducing tab content complexity.');
        }
        
        if (stats.averageWebviewCreationTime > 200) {
            recommendations.push('Webview creation is slow. Consider optimizing webview initialization.');
        }
        
        if (stats.averageFrameRate < 30) {
            recommendations.push('Frame rate is low. Consider reducing animations or complex layouts.');
        }
        
        if (stats.averageMemoryUsage > 200) {
            recommendations.push('Memory usage is high. Consider closing unused tabs.');
        }
        
        return recommendations;
    }

    // Export metrics for debugging
    exportMetrics() {
        return {
            metrics: this.metrics,
            stats: this.getStats(),
            recommendations: this.getRecommendations()
        };
    }

    // Cleanup
    destroy() {
        this.stopMonitoring();
        this.metrics = null;
    }
}

// Export for use in other modules
window.PerformanceMonitor = PerformanceMonitor;
