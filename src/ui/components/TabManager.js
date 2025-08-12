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

            // Setup simplified drag and drop
            this.setupSimpleDragDrop(tabsContainer);
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

    // Super Simple Drag and Drop Implementation
    setupSimpleDragDrop(container) {
        console.log('Setting up simple drag and drop');
        
        // Simple drag state
        this.isDragging = false;
        this.draggedTab = null;
        this.dragStartIndex = -1;

        // Add drag to existing tabs
        this.enableDragOnAllTabs();

        // Watch for new tabs
        const observer = new MutationObserver(() => {
            this.enableDragOnAllTabs();
        });
        observer.observe(container, { childList: true });

        // Global mouse handlers
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e, container));
        document.addEventListener('mouseup', () => this.handleMouseUp(container));
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
        
        this.isDragging = true;
        this.draggedTab = tabElement;
        
        // Get current position in tab list
        const tabs = Array.from(tabElement.parentElement.children).filter(el => el.classList.contains('tab'));
        this.dragStartIndex = tabs.indexOf(tabElement);
        
        // Style the dragged tab
        tabElement.classList.add('dragging');
        tabElement.style.cursor = 'grabbing';
        tabElement.style.position = 'fixed';
        tabElement.style.zIndex = '9999';
        tabElement.style.pointerEvents = 'none';
        
        // Position tab at mouse cursor (centered)
        const rect = tabElement.getBoundingClientRect();
        tabElement.style.left = (e.clientX - rect.width / 2) + 'px';
        tabElement.style.top = (e.clientY - rect.height / 2) + 'px';
        
        console.log('Started dragging tab at index', this.dragStartIndex);
    }

    handleMouseMove(e, container) {
        if (!this.isDragging || !this.draggedTab) return;
        
        // Move tab with mouse (centered on cursor)
        const rect = this.draggedTab.getBoundingClientRect();
        this.draggedTab.style.left = (e.clientX - rect.width / 2) + 'px';
        this.draggedTab.style.top = (e.clientY - rect.height / 2) + 'px';
        
        // Find insertion point
        const tabs = Array.from(container.children).filter(el => el.classList.contains('tab') && el !== this.draggedTab);
        let insertIndex = tabs.length;
        
        for (let i = 0; i < tabs.length; i++) {
            const tabRect = tabs[i].getBoundingClientRect();
            if (e.clientX < tabRect.left + tabRect.width / 2) {
                insertIndex = i;
                break;
            }
        }
        
        // Move tab in DOM if position changed
        if (insertIndex === 0) {
            container.insertBefore(this.draggedTab, container.firstChild);
        } else if (insertIndex >= tabs.length) {
            container.appendChild(this.draggedTab);
        } else {
            container.insertBefore(this.draggedTab, tabs[insertIndex]);
        }
    }

    handleMouseUp(container) {
        if (!this.isDragging || !this.draggedTab) return;
        
        // Reset styles
        this.draggedTab.classList.remove('dragging');
        this.draggedTab.style.cursor = 'grab';
        this.draggedTab.style.position = '';
        this.draggedTab.style.left = '';
        this.draggedTab.style.top = '';
        this.draggedTab.style.zIndex = '';
        this.draggedTab.style.pointerEvents = '';
        
        // Log final order
        const tabs = Array.from(container.children).filter(el => el.classList.contains('tab'));
        const newOrder = tabs.map(el => parseInt(el.dataset.tabId));
        console.log('Final tab order:', newOrder);
        
        // Clean up
        this.isDragging = false;
        this.draggedTab = null;
        this.dragStartIndex = -1;
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

