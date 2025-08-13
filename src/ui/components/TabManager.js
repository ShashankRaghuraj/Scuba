/**
 * TabManager - Handles tab creation, switching, and management
 */
class TabManager {
    constructor() {
        this.tabs = new Map();
        this.activeTabId = null;
        this.tabCounter = 0;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // New tab button
        const newTabBtn = document.getElementById('new-tab-btn');
        if (newTabBtn) {
            newTabBtn.addEventListener('click', () => this.createTab());
        }

        // Tab container for click events
        const tabsContainer = document.getElementById('tabs-container');
        if (tabsContainer) {
            tabsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('tab-close')) {
                    const tabElement = e.target.closest('.tab');
                    const tabId = parseInt(tabElement.dataset.tabId);
                    this.closeTab(tabId);
                } else if (e.target.closest('.tab')) {
                    const tabElement = e.target.closest('.tab');
                    const tabId = parseInt(tabElement.dataset.tabId);
                    this.switchToTab(tabId);
                }
            });

            // Setup improved drag and drop with click detection
            this.setupImprovedDragDrop(tabsContainer);
        }
    }

    createTab(url = null) {
        this.tabCounter++;
        const tabId = this.tabCounter;
        
        // Create tab element
        const tabElement = this.createTabElement(tabId);
        
        // Add to tabs container
        const tabsContainer = document.getElementById('tabs-container');
        tabsContainer.appendChild(tabElement);
        
        // Store tab data
        this.tabs.set(tabId, {
            id: tabId,
            element: tabElement,
            url: url || '',
            title: 'New Tab',
            isLoading: false,
            webview: null
        });

        // Switch to new tab
        this.switchToTab(tabId);
        
        // Emit event for webview creation
        this.emit('tab-created', { tabId, url });
        
        return tabId;
    }

    createTabElement(tabId) {
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.dataset.tabId = tabId;
        
        tab.innerHTML = `
            <span class="tab-title">New Tab</span>
            <button class="tab-close">×</button>
        `;
        
        return tab;
    }

    closeTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        // Remove tab element
        tab.element.remove();
        
        // Emit event for webview cleanup
        this.emit('tab-closed', { tabId });
        
        // Remove from tabs map
        this.tabs.delete(tabId);

        // Handle active tab switching
        if (this.activeTabId === tabId) {
            const remainingTabs = Array.from(this.tabs.keys());
            if (remainingTabs.length > 0) {
                this.switchToTab(remainingTabs[remainingTabs.length - 1]);
            } else {
                this.activeTabId = null;
                this.emit('no-tabs-remaining');
            }
        }
    }

    switchToTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        // Update active tab ID
        const previousTabId = this.activeTabId;
        this.activeTabId = tabId;

        // Update tab UI
        this.updateTabUI();
        
        // Emit event for webview switching
        this.emit('tab-switched', { 
            tabId, 
            previousTabId,
            tab 
        });
    }

    updateTabUI() {
        // Batch DOM operations for better performance
        requestAnimationFrame(() => {
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });

            // Add active class to current tab
            const activeTab = this.tabs.get(this.activeTabId);
            if (activeTab) {
                activeTab.element.classList.add('active');
            }
        });
    }

    updateTabTitle(tabId, title) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        tab.title = title;
        const titleElement = tab.element.querySelector('.tab-title');
        if (titleElement) {
            titleElement.textContent = title || 'Untitled';
        }
    }

    updateTabUrl(tabId, url) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        tab.url = url;
    }

    getActiveTab() {
        return this.tabs.get(this.activeTabId);
    }

    getAllTabs() {
        return Array.from(this.tabs.values());
    }

    getTabCount() {
        return this.tabs.size;
    }

    // Manual method to enable drag on all tabs (for debugging)
    enableDragOnAllTabsNow() {
        console.log('Manually enabling drag on all tabs...');
        const tabs = document.querySelectorAll('.tab');
        console.log('Found', tabs.length, 'tabs');
        tabs.forEach((tab, index) => {
            console.log(`Enabling drag on tab ${index}:`, tab.dataset.tabId);
            this.enableDragOnTab(tab);
        });
    }

    // Improved Drag and Drop Implementation with Click Detection
    setupImprovedDragDrop(container) {
        console.log('Setting up improved drag and drop');
        
        // Drag state
        this.isDragging = false;
        this.draggedTab = null;
        this.dragClone = null;
        this.currentDropIndicator = null;
        this.dragStartIndex = -1;
        this.dragStartTime = 0;
        this.dragStartPos = { x: 0, y: 0 };
        this.clickThreshold = 5; // pixels
        this.dragDelay = 150; // milliseconds

        // Add drag to existing tabs
        this.enableDragOnAllTabs();

        // Watch for new tabs
        const observer = new MutationObserver(() => {
            this.enableDragOnAllTabs();
        });
        observer.observe(container, { childList: true });

        // Global mouse handlers
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e, container));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e, container));
        
        // Handle window blur to cancel drag operations
        window.addEventListener('blur', () => {
            if (this.isDragging) {
                this.cancelDrag();
            }
        });
        
        // Handle escape key to cancel drag
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isDragging) {
                this.cancelDrag();
            }
        });
    }

    enableDragOnAllTabs() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => this.enableDragOnTab(tab));
    }

    enableDragOnTab(tabElement) {
        // Skip if already enabled
        if (tabElement.dataset.dragEnabled) return;
        tabElement.dataset.dragEnabled = 'true';

        const tabId = parseInt(tabElement.dataset.tabId);
        tabElement.style.cursor = 'grab';

        // Prevent close button interference
        const closeBtn = tabElement.querySelector('.tab-close');
        if (closeBtn) {
            closeBtn.addEventListener('mousedown', (e) => e.stopPropagation());
        }

        tabElement.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('tab-close')) return;
            
            e.preventDefault();
            this.startDrag(tabElement, e);
        });
    }

    startDrag(tabElement, e) {
        if (this.isDragging) return;
        
        // Record start position and time
        this.dragStartTime = Date.now();
        this.dragStartPos = { x: e.clientX, y: e.clientY };
        
        // Get current position in tab list
        const tabs = Array.from(tabElement.parentElement.children).filter(el => el.classList.contains('tab'));
        this.dragStartIndex = tabs.indexOf(tabElement);
        
        // Don't start dragging immediately - wait for movement or time threshold
        this.draggedTab = tabElement;
        
        console.log('Mouse down on tab at index', this.dragStartIndex);
    }

    handleMouseMove(e, container) {
        if (!this.draggedTab) return;
        
        // Check if we should start dragging
        if (!this.isDragging) {
            const deltaX = Math.abs(e.clientX - this.dragStartPos.x);
            const deltaY = Math.abs(e.clientY - this.dragStartPos.y);
            const timeElapsed = Date.now() - this.dragStartTime;
            
            // Start dragging if mouse moved enough or enough time passed
            if (deltaX > this.clickThreshold || deltaY > this.clickThreshold || timeElapsed > this.dragDelay) {
                this.beginDrag();
            }
            return;
        }
        
        // Move clone with mouse (centered on cursor)
        if (this.dragClone) {
            const rect = this.draggedTab.getBoundingClientRect();
            this.dragClone.style.left = (e.clientX - rect.width / 2) + 'px';
            this.dragClone.style.top = (e.clientY - rect.height / 2) + 'px';
        }
        
        // Find insertion point and show drop indicator
        try {
            const tabs = Array.from(container.children).filter(el => el.classList.contains('tab') && el !== this.draggedTab);
            let insertIndex = tabs.length;
            let dropTarget = null;
            
            for (let i = 0; i < tabs.length; i++) {
                const tabRect = tabs[i].getBoundingClientRect();
                if (e.clientX < tabRect.left + tabRect.width / 2) {
                    insertIndex = i;
                    dropTarget = tabs[i];
                    break;
                }
            }
            
            // Show drop indicator
            this.showDropIndicator(container, insertIndex, dropTarget);
            
            // Move tab in DOM if position changed
            if (insertIndex === 0) {
                container.insertBefore(this.draggedTab, container.firstChild);
            } else if (insertIndex >= tabs.length) {
                container.appendChild(this.draggedTab);
            } else {
                container.insertBefore(this.draggedTab, tabs[insertIndex]);
            }
        } catch (error) {
            console.error('Error during drag operation:', error);
        }
    }

    beginDrag() {
        if (this.isDragging) return;
        
        this.isDragging = true;
        console.log('Started dragging tab at index', this.dragStartIndex);
        
        // Create a clone for dragging that follows the mouse
        this.dragClone = this.draggedTab.cloneNode(true);
        this.dragClone.classList.add('drag-clone');
        this.dragClone.style.position = 'fixed';
        this.dragClone.style.zIndex = '9999';
        this.dragClone.style.pointerEvents = 'none';
        this.dragClone.style.opacity = '0.8';
        this.dragClone.style.transform = 'rotate(2deg) scale(1.02)';
        this.dragClone.style.boxShadow = '0 8px 25px rgba(140, 156, 227, 0.3)';
        
        // Add the clone to the body
        document.body.appendChild(this.dragClone);
        
        // Style the original tab (make it semi-transparent but keep it in place)
        this.draggedTab.classList.add('dragging');
        this.draggedTab.style.cursor = 'grabbing';
        this.draggedTab.style.opacity = '0.3';
        
        // Position clone at mouse cursor (centered)
        const rect = this.draggedTab.getBoundingClientRect();
        this.dragClone.style.left = (this.dragStartPos.x - rect.width / 2) + 'px';
        this.dragClone.style.top = (this.dragStartPos.y - rect.height / 2) + 'px';
    }

    handleMouseUp(e, container) {
        if (!this.draggedTab) return;
        
        // If we never started dragging, this was a click
        if (!this.isDragging) {
            const tabId = parseInt(this.draggedTab.dataset.tabId);
            this.switchToTab(tabId);
            this.draggedTab = null;
            return;
        }
        
        // Remove drag clone
        if (this.dragClone) {
            this.dragClone.remove();
            this.dragClone = null;
        }
        
        // Remove drop indicators
        this.removeDropIndicators();
        
        // Reset original tab styles
        this.draggedTab.classList.remove('dragging');
        this.draggedTab.style.cursor = 'grab';
        this.draggedTab.style.opacity = '';
        
        // Log final order
        const tabs = Array.from(container.children).filter(el => el.classList.contains('tab'));
        const newOrder = tabs.map(el => parseInt(el.dataset.tabId));
        console.log('Final tab order:', newOrder);
        
        // Clean up
        this.isDragging = false;
        this.draggedTab = null;
        this.dragClone = null;
        this.currentDropIndicator = null;
        this.dragStartIndex = -1;
        this.dragStartTime = 0;
        this.dragStartPos = { x: 0, y: 0 };
    }

    showDropIndicator(container, insertIndex, dropTarget) {
        // Remove existing drop indicators
        this.removeDropIndicators();
        
        // Create drop indicator
        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator';
        indicator.style.cssText = `
            position: absolute;
            height: 2px;
            background: linear-gradient(90deg, #4CAF50, #8BC34A);
            border-radius: 1px;
            z-index: 1000;
            pointer-events: none;
            transition: all 0.15s ease;
        `;
        
        if (insertIndex === 0) {
            // Place at the beginning
            indicator.style.left = '0px';
            indicator.style.width = '4px';
            container.insertBefore(indicator, container.firstChild);
        } else if (dropTarget) {
            // Place before the target tab
            const targetRect = dropTarget.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            indicator.style.left = (targetRect.left - containerRect.left - 2) + 'px';
            indicator.style.width = '4px';
            container.insertBefore(indicator, dropTarget);
        } else {
            // Place at the end
            indicator.style.left = (container.scrollWidth - 4) + 'px';
            indicator.style.width = '4px';
            container.appendChild(indicator);
        }
        
        this.currentDropIndicator = indicator;
    }
    
    removeDropIndicators() {
        if (this.currentDropIndicator) {
            this.currentDropIndicator.remove();
            this.currentDropIndicator = null;
        }
        
        // Also remove any other drop indicators that might exist
        document.querySelectorAll('.drop-indicator').forEach(indicator => indicator.remove());
    }
    
    cancelDrag() {
        if (!this.isDragging) return;
        
        console.log('Cancelling drag operation');
        
        // Remove drag clone
        if (this.dragClone) {
            this.dragClone.remove();
            this.dragClone = null;
        }
        
        // Remove drop indicators
        this.removeDropIndicators();
        
        // Reset original tab styles
        if (this.draggedTab) {
            this.draggedTab.classList.remove('dragging');
            this.draggedTab.style.cursor = 'grab';
            this.draggedTab.style.opacity = '';
        }
        
        // Clean up
        this.isDragging = false;
        this.draggedTab = null;
        this.dragStartIndex = -1;
        this.dragStartTime = 0;
        this.dragStartPos = { x: 0, y: 0 };
    }

    getDragAfterElement(container, x) {
        const draggableElements = [...container.querySelectorAll('.tab:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Simple event emitter functionality
    emit(eventName, data) {
        const event = new CustomEvent(`tab-manager-${eventName}`, { 
            detail: data 
        });
        document.dispatchEvent(event);
    }

    on(eventName, callback) {
        document.addEventListener(`tab-manager-${eventName}`, (e) => {
            callback(e.detail);
        });
    }
}

// Export for use in other modules
window.TabManager = TabManager;

