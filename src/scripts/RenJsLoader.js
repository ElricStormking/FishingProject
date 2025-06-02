/**
 * RenJs Loader - Simplified integration with local RenJs
 */
export class RenJsLoader {
    constructor(scene, dialogManager) {
        this.scene = scene;
        this.dialogManager = dialogManager;
        this.renjsGame = null;
        this.isAvailable = false;
        this.isInitialized = false;
        this.currentContainer = null;
        this.npcConfigs = {};
    }

    /**
     * Check if RenJs is available
     */
    async checkAvailability() {
        try {
            // Check if RenJs script exists
            const response = await fetch('src/libs/renjs/renjs.js');
            this.isAvailable = response.ok;
            console.log('RenJsLoader: Availability check:', this.isAvailable);
            return this.isAvailable;
        } catch (error) {
            console.log('RenJsLoader: Not available locally, will use fallback');
            this.isAvailable = false;
            return false;
        }
    }

    /**
     * Simple RenJs initialization
     */
    async initialize() {
        if (this.isInitialized) {
            return true;
        }

        try {
            // Check availability first
            const available = await this.checkAvailability();
            if (!available) {
                console.log('RenJsLoader: Not available, using fallback');
                return false;
            }

            // Load RenJs script dynamically
            await this.loadScript();
            
            console.log('RenJsLoader: Simple initialization complete');
            this.isInitialized = true;
            return true;
            
        } catch (error) {
            console.error('RenJsLoader: Initialization failed:', error);
            return false;
        }
    }

    /**
     * Load RenJs script
     */
    async loadScript() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.RenJS) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'src/libs/renjs/renjs.js';
            script.onload = () => {
                console.log('RenJsLoader: Script loaded successfully');
                resolve();
            };
            script.onerror = () => {
                console.log('RenJsLoader: Script failed to load');
                reject(new Error('Failed to load RenJs script'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Update NPC configuration (required by DialogScene)
     */
    updateNPCConfig(npcId, npcData) {
        console.log('RenJsLoader: Updating NPC config for:', npcId);
        this.npcConfigs[npcId] = {
            name: npcData.name,
            color: npcData.color || "#FFFFFF",
            dialog: npcData.dialog || "Hello!"
        };
    }

    /**
     * Start dialog - simplified approach
     */
    async startDialog(npcId) {
        console.log('RenJsLoader: Attempting to start dialog for:', npcId);
        
        // Try to initialize if not done
        if (!this.isInitialized) {
            const success = await this.initialize();
            if (!success) {
                console.log('RenJsLoader: Failed to initialize, using fallback');
                return false;
            }
        }

        try {
            // Create container
            this.createContainer();
            
            // Show simple RenJs dialog
            this.showSimpleDialog(npcId);
            
            return true;
            
        } catch (error) {
            console.error('RenJsLoader: Error starting dialog:', error);
            return false;
        }
    }

    /**
     * Create simple container
     */
    createContainer() {
        // Remove existing container
        if (this.currentContainer) {
            this.currentContainer.remove();
        }

        const container = document.createElement('div');
        container.id = 'renjs-simple-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: Arial, sans-serif;
        `;
        
        document.body.appendChild(container);
        this.currentContainer = container;
    }

    /**
     * Show simple dialog interface
     */
    showSimpleDialog(npcId) {
        if (!this.currentContainer) return;

        // Get NPC config if available
        const npcConfig = this.npcConfigs[npcId];
        const npcName = npcConfig?.name || npcId.charAt(0).toUpperCase() + npcId.slice(1);
        const npcColor = npcConfig?.color || "#4ecdc4";

        const dialogs = {
            mia: "Hi! I'm Mia! I love fishing and would love to learn from you!",
            sophie: "Hey there! I'm Sophie. I'm pretty competitive when it comes to fishing.",
            luna: "Greetings... I am Luna. The waters hold many secrets..."
        };

        const dialog = npcConfig?.dialog || dialogs[npcId] || "Hello there!";

        this.currentContainer.innerHTML = `
            <div style="
                background: rgba(20, 30, 40, 0.95);
                border: 2px solid ${npcColor};
                border-radius: 10px;
                padding: 30px;
                max-width: 600px;
                text-align: center;
            ">
                <h2 style="color: ${npcColor}; margin-bottom: 20px;">
                    ${npcName}
                </h2>
                <p style="font-size: 18px; line-height: 1.5; margin-bottom: 30px;">
                    ${dialog}
                </p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="window.renjsChoice('option1')" style="
                        background: ${npcColor};
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        font-size: 14px;
                        cursor: pointer;
                    ">
                        Tell me more
                    </button>
                    <button onclick="window.renjsChoice('option2')" style="
                        background: ${npcColor};
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        font-size: 14px;
                        cursor: pointer;
                    ">
                        Ask about fishing
                    </button>
                    <button onclick="window.renjsClose()" style="
                        background: #e74c3c;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        font-size: 14px;
                        cursor: pointer;
                    ">
                        Goodbye
                    </button>
                </div>
            </div>
        `;

        // Store reference to this for callbacks
        const loaderInstance = this;

        // Set up choice handling
        window.renjsChoice = (choice) => {
            console.log('RenJsLoader: Choice selected:', choice);
            // Trigger romance meter or achievement if dialog manager is available
            if (loaderInstance.dialogManager) {
                try {
                    switch (choice) {
                        case 'option1':
                            if (loaderInstance.dialogManager.increaseRomanceMeter) {
                                loaderInstance.dialogManager.increaseRomanceMeter(npcId, 2);
                            } else {
                                console.log('RenJsLoader: increaseRomanceMeter method not available');
                            }
                            break;
                        case 'option2':
                            if (loaderInstance.dialogManager.increaseRomanceMeter) {
                                loaderInstance.dialogManager.increaseRomanceMeter(npcId, 3);
                            }
                            if (loaderInstance.dialogManager.unlockAchievement) {
                                loaderInstance.dialogManager.unlockAchievement('asked_about_fishing');
                            }
                            break;
                    }
                    if (loaderInstance.dialogManager.unlockAchievement) {
                        loaderInstance.dialogManager.unlockAchievement('first_conversation');
                    }
                } catch (error) {
                    console.error('RenJsLoader: Error in choice handling:', error);
                }
            } else {
                console.log('RenJsLoader: No dialog manager available for choice');
            }
            // Close after choice with safety check
            setTimeout(() => {
                if (typeof window.renjsClose === 'function') {
                    window.renjsClose();
                } else {
                    console.log('RenJsLoader: renjsClose function not available, closing manually');
                    // Fallback: stop dialog manually
                    if (loaderInstance.currentContainer && loaderInstance.currentContainer.parentNode) {
                        loaderInstance.stopDialog();
                        if (loaderInstance.scene && loaderInstance.scene.events) {
                            loaderInstance.scene.events.emit('dialog-ended');
                        }
                    }
                }
            }, 500);
        };

        // Set up close function with safety
        window.renjsClose = () => {
            console.log('RenJsLoader: Closing dialog via renjsClose');
            try {
                loaderInstance.stopDialog();
                if (loaderInstance.scene && loaderInstance.scene.events) {
                    loaderInstance.scene.events.emit('dialog-ended');
                }
            } catch (error) {
                console.error('RenJsLoader: Error in renjsClose:', error);
            }
        };
    }

    /**
     * Stop dialog
     */
    stopDialog() {
        console.log('RenJsLoader: Stopping dialog');
        
        try {
            // Remove container if it exists
            if (this.currentContainer && this.currentContainer.parentNode) {
                this.currentContainer.remove();
            }
            this.currentContainer = null;
            
            // Clean up global functions safely
            if (typeof window.renjsClose === 'function') {
                delete window.renjsClose;
            }
            if (typeof window.renjsChoice === 'function') {
                delete window.renjsChoice;
            }
            
            console.log('RenJsLoader: Dialog stopped and cleaned up');
        } catch (error) {
            console.error('RenJsLoader: Error during stopDialog cleanup:', error);
            // Force cleanup anyway
            this.currentContainer = null;
            try {
                delete window.renjsClose;
                delete window.renjsChoice;
            } catch (cleanupError) {
                console.warn('RenJsLoader: Could not clean up global functions:', cleanupError);
            }
        }
    }

    /**
     * Check if running
     */
    isRunning() {
        return !!(this.currentContainer && this.currentContainer.parentNode);
    }

    /**
     * Get available scenes for NPC (required by some dialog systems)
     */
    getAvailableScenes(npcId) {
        return [`${npcId}_intro`, `${npcId}_conversation`];
    }

    /**
     * Clean up
     */
    destroy() {
        this.stopDialog();
        this.scene = null;
        this.dialogManager = null;
        this.npcConfigs = {};
    }
} 