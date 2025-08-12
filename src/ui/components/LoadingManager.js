/**
 * LoadingManager - Handles animated loading states with fun swimming-themed messages
 */
class LoadingManager {
    constructor() {
        this.loadingOverlay = null;
        this.messageElement = null;
        this.messageIndex = 0;
        this.messageInterval = null;
        this.isVisible = false;
        this.usedMessages = new Set(); // Track used messages for better randomization
        
        // Fun swimming-themed loading messages
        this.messages = [
            "Penguins are swimming for the information...",
            "Diving deep into the digital ocean...",
            "Surfing the waves of data...",
            "Our aquatic team is fetching your content...",
            "Swimming through cyberspace currents...",
            "Dolphins are guiding us to your page...",
            "Navigating the sea of information...",
            "Fishing for the perfect results...",
            "Riding the tide of technology...",
            "Our submarine is exploring the web depths...",
            "Whales are singing your page into existence...",
            "Floating through the digital archipelago...",
            "Synchronized swimming with servers...",
            "Casting nets in the ocean of knowledge...",
            "Seals are delivering your data...",
            "Making waves in the information stream..."
        ];
        
        this.init();
    }
    
    init() {
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.messageElement = document.getElementById('loading-message');
        
        if (!this.loadingOverlay || !this.messageElement) {
            console.error('Loading overlay elements not found');
            return;
        }
        
        console.log('LoadingManager initialized successfully');
        
        // Start with a random message
        this.messageIndex = Math.floor(Math.random() * this.messages.length);
        this.messageElement.textContent = this.messages[this.messageIndex];
        this.usedMessages.add(this.messageIndex);
        
        // Add a test method to window for debugging
        window.testLoading = () => {
            console.log('Testing loading animation...');
            this.show();
            setTimeout(() => {
                this.hide();
            }, 5000);
        };
    }
    
    show() {
        if (!this.loadingOverlay || this.isVisible) return;
        
        console.log('LoadingManager: Showing loading overlay');
        this.isVisible = true;
        
        // Use requestAnimationFrame for smoother transitions
        requestAnimationFrame(() => {
            this.loadingOverlay.classList.remove('hidden');
            this.loadingOverlay.classList.add('visible');
        });
        
        // Start rotating messages
        this.startMessageRotation();
        
        // Add some variety - occasionally change the penguin
        this.addPenguinVariety();
    }
    
    hide() {
        if (!this.loadingOverlay || !this.isVisible) return;
        
        console.log('LoadingManager: Hiding loading overlay');
        this.isVisible = false;
        
        // Use requestAnimationFrame for smoother transitions
        requestAnimationFrame(() => {
            this.loadingOverlay.classList.remove('visible');
            this.loadingOverlay.classList.add('hidden');
        });
        
        // Stop rotating messages
        this.stopMessageRotation();
    }
    
    startMessageRotation() {
        // Change message every 2 seconds (faster rotation)
        this.messageInterval = setInterval(() => {
            this.rotateMessage();
        }, 2000);
    }
    
    stopMessageRotation() {
        if (this.messageInterval) {
            clearInterval(this.messageInterval);
            this.messageInterval = null;
        }
        // Reset to first message
        this.messageIndex = 0;
        if (this.messageElement) {
            this.messageElement.textContent = this.messages[0];
        }
    }
    
    rotateMessage() {
        if (!this.messageElement) return;
        
        // Fade out current message (faster transition)
        this.messageElement.style.opacity = '0';
        this.messageElement.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            // Get random message (avoid repeating recent messages)
            let newIndex;
            let attempts = 0;
            do {
                newIndex = Math.floor(Math.random() * this.messages.length);
                attempts++;
            } while (this.usedMessages.has(newIndex) && attempts < 10);
            
            // Reset used messages if we've used too many
            if (this.usedMessages.size >= Math.floor(this.messages.length * 0.7)) {
                this.usedMessages.clear();
            }
            
            this.usedMessages.add(newIndex);
            this.messageIndex = newIndex;
            this.messageElement.textContent = this.messages[this.messageIndex];
            
            // Fade in new message (faster transition)
            this.messageElement.style.opacity = '1';
            this.messageElement.style.transform = 'translateY(0)';
        }, 200); // Reduced from 300ms to 200ms
    }
    
    addPenguinVariety() {
        const penguin = document.querySelector('.penguin');
        if (!penguin) return;
        
        const aquaticAnimals = ['🐧', '🐋', '🐠', '🐡', '🦈', '🐙', '🦭', '🐬'];
        let animalIndex = 0;
        
        // Change the swimming animal every 8 seconds
        const animalInterval = setInterval(() => {
            if (!this.isVisible) {
                clearInterval(animalInterval);
                penguin.textContent = '🐧'; // Reset to penguin
                return;
            }
            
            animalIndex = (animalIndex + 1) % aquaticAnimals.length;
            penguin.textContent = aquaticAnimals[animalIndex];
        }, 8000);
    }
    
    // Method to show loading with a custom message
    showWithMessage(customMessage) {
        if (customMessage && this.messageElement) {
            this.messageElement.textContent = customMessage;
        }
        this.show();
    }
    
    // Quick show/hide methods for different loading scenarios
    showPageLoad() {
        this.showWithMessage("Swimming to your destination...");
    }
    
    showSearch() {
        this.showWithMessage("Diving for search results...");
    }
    
    showReload() {
        this.showWithMessage("Refreshing the digital waters...");
    }
}

// Export for use in other modules
window.LoadingManager = LoadingManager;
