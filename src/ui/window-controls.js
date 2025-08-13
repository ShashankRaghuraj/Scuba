// Window Controls Handler for Custom Title Bar
// Note: Using contextBridge API instead of direct ipcRenderer access

class WindowControls {
    constructor() {
        this.initializeControls();
    }

    initializeControls() {
        // Get window control buttons
        const minimizeBtn = document.getElementById('minimize-btn');
        const maximizeBtn = document.getElementById('maximize-btn');
        const closeBtn = document.getElementById('close-btn');

        // Add event listeners
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                if (window.scubaAPI && window.scubaAPI.windowControls) {
                    window.scubaAPI.windowControls.minimize();
                }
            });
        }

        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', async () => {
                if (window.scubaAPI && window.scubaAPI.windowControls) {
                    await window.scubaAPI.windowControls.maximize();
                    this.updateMaximizeButton();
                }
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (window.scubaAPI && window.scubaAPI.windowControls) {
                    window.scubaAPI.windowControls.close();
                }
            });
        }

        // Update maximize button state
        this.updateMaximizeButton();
    }

    async updateMaximizeButton() {
        const maximizeBtn = document.getElementById('maximize-btn');
        if (!maximizeBtn) return;

        try {
            const isMaximized = await window.scubaAPI.windowControls.isMaximized();
            
            // Clear existing content safely
            maximizeBtn.textContent = '';
            
            // Create SVG element safely
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '12');
            svg.setAttribute('height', '12');
            svg.setAttribute('viewBox', '0 0 12 12');
            
            if (isMaximized) {
                // Create restore icon
                const rect1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect1.setAttribute('x', '1');
                rect1.setAttribute('y', '3');
                rect1.setAttribute('width', '6');
                rect1.setAttribute('height', '6');
                rect1.setAttribute('fill', 'none');
                rect1.setAttribute('stroke', 'currentColor');
                rect1.setAttribute('stroke-width', '1');
                
                const rect2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect2.setAttribute('x', '3');
                rect2.setAttribute('y', '1');
                rect2.setAttribute('width', '6');
                rect2.setAttribute('height', '6');
                rect2.setAttribute('fill', 'none');
                rect2.setAttribute('stroke', 'currentColor');
                rect2.setAttribute('stroke-width', '1');
                
                svg.appendChild(rect1);
                svg.appendChild(rect2);
                maximizeBtn.title = 'Restore';
            } else {
                // Create maximize icon
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', '2');
                rect.setAttribute('y', '2');
                rect.setAttribute('width', '8');
                rect.setAttribute('height', '8');
                rect.setAttribute('fill', 'none');
                rect.setAttribute('stroke', 'currentColor');
                rect.setAttribute('stroke-width', '1');
                
                svg.appendChild(rect);
                maximizeBtn.title = 'Maximize';
            }
            
            maximizeBtn.appendChild(svg);
        } catch (error) {
            console.error('Failed to update maximize button:', error);
            // Fallback to text content
            maximizeBtn.textContent = '⬜';
        }
    }
}

// Initialize window controls when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WindowControls();
});

// Export for potential use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WindowControls;
}
