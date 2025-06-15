/**
 * DialogManager - Handles integration between RenJs dialogs and game systems
 * This class manages callbacks from dialog scripts to affect game state
 */
export default class DialogManager {
    constructor(gameScene) {
        this.gameScene = gameScene;
        this.npcs = new Map();
        this.activeDialogs = new Set();
        
        // Initialize NPC data
        this.initializeNPCs();
        
        console.log('DialogManager initialized');
    }

    /**
     * Initialize NPC data and romance meters
     */
    initializeNPCs() {
        // Define NPCs and their initial romance meter values
        const npcData = [
            {
                id: 'mia',
                name: 'Bikini Assistant Mia',
                portrait: 'npc-assistant-1',
                romanceMeter: 0,
                maxRomance: 100,
                relationship: 'stranger',
                dialogScript: 'mia_romance.md',
                description: 'A cheerful and helpful fishing guide who loves spending time by the water. Always ready to help with a bright smile!',
                personality: 'Friendly, enthusiastic, and knowledgeable about fishing techniques',
                specialties: ['Beginner fishing tips', 'Equipment recommendations', 'Local fishing spots']
            },
            {
                id: 'sophie',
                name: 'Bikini Assistant Sophie',
                portrait: 'npc-assistant-2',
                romanceMeter: 0,
                maxRomance: 100,
                relationship: 'stranger',
                dialogScript: 'assistant_sophie.md',
                description: 'An energetic and competitive fishing enthusiast who gets excited about big catches and challenges.',
                personality: 'Energetic, competitive, and passionate about the thrill of fishing',
                specialties: ['Advanced techniques', 'Competition fishing', 'Rare fish knowledge']
            },
            {
                id: 'luna',
                name: 'Bikini Assistant Luna',
                portrait: 'npc-assistant-3',
                romanceMeter: 0,
                maxRomance: 100,
                relationship: 'stranger',
                dialogScript: 'assistant_luna.md',
                description: 'A mysterious and wise fishing guide with deep knowledge of the ocean\'s secrets and ancient fishing wisdom.',
                personality: 'Mysterious, wise, and spiritually connected to the ocean',
                specialties: ['Deep sea fishing', 'Ocean folklore', 'Meditation and patience']
            }
        ];

        npcData.forEach(npc => {
            this.npcs.set(npc.id, npc);
        });
    }

    /**
     * Get NPC data by ID with fallback creation
     * @param {string} npcId - The ID of the NPC
     * @returns {Object} NPC data object
     */
    getNPC(npcId) {
        let npc = this.npcs.get(npcId);
        
        // If NPC doesn't exist, create a placeholder
        if (!npc) {
            console.warn(`DialogManager: NPC '${npcId}' not found, creating placeholder`);
            npc = this.createPlaceholderNPC(npcId);
            this.npcs.set(npcId, npc);
        }
        
        return npc;
    }

    /**
     * Create a placeholder NPC for missing NPCs
     * @param {string} npcId - The ID of the missing NPC
     * @returns {Object} Placeholder NPC data
     */
    createPlaceholderNPC(npcId) {
        const placeholderNames = {
            'captain': 'Captain Rodriguez',
            'fisherman': 'Old Fisherman Joe',
            'merchant': 'Marina Merchant',
            'guide': 'Fishing Guide Sam',
            'instructor': 'Instructor Maria'
        };
        
        const name = placeholderNames[npcId] || `${npcId.charAt(0).toUpperCase() + npcId.slice(1)} (Placeholder)`;
        
        return {
            id: npcId,
            name: name,
            portrait: 'placeholder-npc',
            romanceMeter: 0,
            maxRomance: 100,
            relationship: 'stranger',
            dialogScript: 'placeholder_dialog.md',
            description: `A placeholder character for ${name}. This NPC is not fully implemented yet.`,
            personality: 'Friendly and helpful, but still being developed',
            specialties: ['General assistance', 'Placeholder interactions'],
            isPlaceholder: true
        };
    }

    /**
     * Get NPC data by ID (alias for compatibility)
     * @param {string} npcId - The ID of the NPC
     * @returns {Object} NPC data object
     */
    getNPCData(npcId) {
        return this.getNPC(npcId);
    }

    /**
     * Start a dialog with an NPC
     * @param {string} npcId - The ID of the NPC to dialog with
     * @param {string} callingScene - The scene that initiated the dialog
     * @param {string} specificDialog - Optional specific dialog ID to use
     */
    startDialog(npcId, callingScene = 'GameScene', specificDialog = null) {
        try {
            // Validate inputs
            if (!npcId || typeof npcId !== 'string') {
                console.error('DialogManager: Invalid npcId provided to startDialog:', npcId);
                return false;
            }

            const npc = this.getNPC(npcId);
            if (!npc) {
                console.error(`DialogManager: Failed to get or create NPC with ID '${npcId}'`);
                return false;
            }

            // Check if scene manager is available
            if (!this.gameScene || !this.gameScene.scene) {
                console.error('DialogManager: GameScene or scene manager not available');
                return false;
            }

            console.log(`DialogManager: Starting dialog with ${npc.name} from ${callingScene}`);
            
            // CRITICAL FIX: Handle placeholder NPCs with Phaser dialog
            if (npc.isPlaceholder) {
                console.log(`DialogManager: NPC ${npcId} is a placeholder, showing Phaser dialog`);
                return this.showPlaceholderDialog(npc, callingScene, specificDialog);
            }
            
            // Determine dialog script to use
            let dialogScript = npc.dialogScript;
            let useRenJs = false;
            
            // Check for specific story dialogs that should use RenJs
            if (specificDialog) {
                if (specificDialog === 'Story03' || specificDialog === 'story_003_companion_intro') {
                    dialogScript = 'story03_mia_meeting.yaml';
                    useRenJs = true;
                    console.log('DialogManager: Using RenJs format for Story03');
                }
                // Add more story dialogs here as needed
                else if (specificDialog.startsWith('Story') && parseInt(specificDialog.slice(5)) >= 3) {
                    // Use RenJs for Story03 and above
                    useRenJs = true;
                    console.log(`DialogManager: Using RenJs format for ${specificDialog}`);
                }
            }
            
            // Pause the main GameScene to prevent background updates
            if (this.gameScene.scene.isSleeping('GameScene')) {
                this.gameScene.scene.wake('GameScene');
            }
            // Only pause GameScene if it's the calling scene
            if (callingScene === 'GameScene') {
                this.gameScene.scene.pause('GameScene');
            }

            // Add to active dialogs
            this.activeDialogs.add(npcId);

            // Start the dialog scene with error handling
            try {
                const dialogData = {
                    npcId: npcId,
                    script: dialogScript,
                    callingScene: callingScene,
                    dialogManager: this,
                    useRenJs: useRenJs,
                    specificDialog: specificDialog
                };
                
                if (useRenJs) {
                    // Launch RenJs-compatible dialog scene
                    console.log('DialogManager: Launching RenJs dialog scene');
                    this.gameScene.scene.launch('DialogScene', dialogData);
                } else {
                    // Launch standard dialog scene
                    this.gameScene.scene.launch('DialogScene', dialogData);
                }
            } catch (sceneError) {
                console.error('DialogManager: Error launching DialogScene:', sceneError);
                this.activeDialogs.delete(npcId); // Clean up on error
                
                // Fallback to placeholder dialog
                console.log('DialogManager: Falling back to placeholder dialog due to scene error');
                return this.showPlaceholderDialog(npc, callingScene, specificDialog);
            }

            // Set up event listeners for this dialog
            this.setupDialogListeners(npcId, callingScene);
            
            return true;
            
        } catch (error) {
            console.error('DialogManager: Error in startDialog:', error);
            
            // Try to show placeholder dialog as final fallback
            try {
                const npc = this.getNPC(npcId);
                if (npc) {
                    return this.showPlaceholderDialog(npc, callingScene, specificDialog);
                }
            } catch (fallbackError) {
                console.error('DialogManager: Fallback placeholder dialog also failed:', fallbackError);
            }
            
            return false;
        }
    }

    /**
     * Show a Phaser-based placeholder dialog for missing NPCs or dialog errors
     * @param {Object} npc - NPC data
     * @param {string} callingScene - The calling scene name
     * @param {string} specificDialog - Optional specific dialog ID
     */
    showPlaceholderDialog(npc, callingScene = 'GameScene', specificDialog = null) {
        try {
            console.log(`DialogManager: Creating placeholder dialog for ${npc.name}`);
            
            const scene = this.gameScene;
            const width = scene.cameras.main.width;
            const height = scene.cameras.main.height;
            
            // Create overlay container
            const overlay = scene.add.container(0, 0);
            overlay.setDepth(10000); // Ensure it's on top
            
            // Background
            const bg = scene.add.rectangle(0, 0, width, height, 0x000000, 0.7);
            bg.setOrigin(0);
            bg.setInteractive();
            overlay.add(bg);
            
            // Dialog panel
            const panelWidth = Math.min(600, width - 40);
            const panelHeight = Math.min(400, height - 40);
            const centerX = width / 2;
            const centerY = height / 2;
            
            const panel = scene.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x2c3e50, 0.95);
            panel.setStrokeStyle(3, 0x3498db);
            overlay.add(panel);
            
            // NPC name
            const nameText = scene.add.text(centerX, centerY - panelHeight/2 + 40, npc.name, {
                fontSize: '24px',
                fill: '#3498db',
                fontStyle: 'bold',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
            overlay.add(nameText);
            
            // Dialog content based on context
            let dialogContent = this.getPlaceholderDialogContent(npc, specificDialog);
            
            const contentText = scene.add.text(centerX, centerY - 50, dialogContent, {
                fontSize: '16px',
                fill: '#FFFFFF',
                fontFamily: 'Arial',
                align: 'center',
                wordWrap: { width: panelWidth - 60 }
            }).setOrigin(0.5);
            overlay.add(contentText);
            
            // Character description
            if (npc.description) {
                const descText = scene.add.text(centerX, centerY + 50, npc.description, {
                    fontSize: '14px',
                    fill: '#CCCCCC',
                    fontFamily: 'Arial',
                    align: 'center',
                    wordWrap: { width: panelWidth - 60 }
                }).setOrigin(0.5);
                overlay.add(descText);
            }
            
            // Close button
            const closeButton = scene.add.rectangle(centerX, centerY + panelHeight/2 - 40, 120, 35, 0x3498db, 0.9);
            closeButton.setStrokeStyle(2, 0xFFFFFF);
            const closeText = scene.add.text(centerX, centerY + panelHeight/2 - 40, 'Close', {
                fontSize: '16px',
                fill: '#FFFFFF',
                fontStyle: 'bold',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
            
            overlay.add(closeButton);
            overlay.add(closeText);
            
            // Make interactive
            closeButton.setInteractive({ useHandCursor: true });
            closeButton.on('pointerdown', () => {
                console.log('DialogManager: Closing placeholder dialog');
                overlay.destroy();
                this.endDialog(npc.id, callingScene);
            });
            
            // Also allow clicking background to close
            bg.on('pointerdown', () => {
                console.log('DialogManager: Closing placeholder dialog (background click)');
                overlay.destroy();
                this.endDialog(npc.id, callingScene);
            });
            
            // Animate in
            overlay.setAlpha(0);
            scene.tweens.add({
                targets: overlay,
                alpha: 1,
                duration: 300,
                ease: 'Power2'
            });
            
            // Add hover effects to close button
            closeButton.on('pointerover', () => {
                closeButton.setFillStyle(0x5dade2);
                closeText.setScale(1.05);
            });
            
            closeButton.on('pointerout', () => {
                closeButton.setFillStyle(0x3498db);
                closeText.setScale(1.0);
            });
            
            // Add to active dialogs
            this.activeDialogs.add(npc.id);
            
            console.log('DialogManager: Placeholder dialog created successfully');
            return true;
            
        } catch (error) {
            console.error('DialogManager: Error creating placeholder dialog:', error);
            return false;
        }
    }

    /**
     * Get appropriate dialog content for placeholder NPCs
     * @param {Object} npc - NPC data
     * @param {string} specificDialog - Optional specific dialog ID
     * @returns {string} Dialog content
     */
    getPlaceholderDialogContent(npc, specificDialog) {
        if (specificDialog) {
            const storyDialogs = {
                'Story02': "\"Welcome to the waters, young angler! I see great potential in you. Keep practicing your fishing skills and you'll become a master in no time!\"",
                'Story03': "\"Ah, I see you've met one of our fishing assistants! They're wonderful guides who can teach you advanced techniques. Listen to their advice carefully.\"",
                'Story04': "\"The ocean holds many secrets, and you're just beginning to discover them. Each new area you explore will bring new challenges and rewards.\"",
                'Story05': "\"I've heard tales of legendary fish in these waters. With your growing skills, you might just be the one to catch them!\"",
                'Story06': "\"You've come far, angler. The biggest challenges still await, but I have faith in your abilities.\""
            };
            
            return storyDialogs[specificDialog] || `"This is a placeholder dialog for ${specificDialog}. The full story content is still being developed."`;
        }
        
        const genericDialogs = [
            `"Hello there! I'm ${npc.name}. I'm still getting settled in around here, but I'm happy to meet you!"`,
            `"Welcome to our fishing community! I'm ${npc.name}, and while I'm still learning the ropes myself, I'm here to help however I can."`,
            `"Greetings, angler! ${npc.name} at your service. I may be new here, but I'm eager to assist with your fishing adventures!"`,
            `"Nice to meet you! I'm ${npc.name}. I'm still being introduced to the area, but I look forward to getting to know you better."`
        ];
        
        return genericDialogs[Math.floor(Math.random() * genericDialogs.length)];
    }

    /**
     * Set up event listeners for dialog callbacks
     * @param {string} npcId - The NPC ID
     * @param {string} callingScene - The calling scene name
     */
    setupDialogListeners(npcId, callingScene) {
        try {
            // Get the scene manager
            const sceneManager = this.gameScene.scene;

            // Use a delayed call on the scene manager's game object, which is always running
            const timerScene = sceneManager.get('DialogScene') || this.gameScene;

            // Wait a bit for DialogScene to be fully initialized
            if (timerScene && timerScene.time) {
            timerScene.time.delayedCall(100, () => {
                const dialogScene = sceneManager.get('DialogScene');
                if (!dialogScene) {
                    console.warn('DialogManager: DialogScene not found when setting up listeners');
                    // Retry or handle error
                    return;
                }

                // Listen for romance meter changes
                dialogScene.events.on('romance-update', (data) => {
                    try {
                        this.updateRomanceMeter(data);
                    } catch (error) {
                            console.warn('DialogManager: Romance meter update failed:', error.message);
                    }
                });

                // Listen for quest updates
                dialogScene.events.on('quest-update', (data) => {
                    try {
                        this.updateQuest(data);
                    } catch (error) {
                            console.warn('DialogManager: Quest update failed:', error.message);
                    }
                });

                // Listen for achievement unlocks
                dialogScene.events.on('achievement-unlock', (data) => {
                    try {
                        this.unlockAchievement(data);
                    } catch (error) {
                            console.warn('DialogManager: Achievement unlock failed:', error.message);
                    }
                });

                // Listen for inventory changes
                dialogScene.events.on('inventory-update', (data) => {
                    try {
                        this.updateInventory(data);
                    } catch (error) {
                            console.warn('DialogManager: Inventory update failed:', error.message);
                    }
                });

                // Listen for dialog end
                    dialogScene.events.on('dialog-ended', (data) => {
                        this.endDialog(npcId, callingScene);
                    });
                });
            }
        } catch (error) {
            console.warn('DialogManager: Error setting up dialog listeners:', error.message);
        }
    }

    /**
     * Update NPC romance meter
     * @param {Object} data - Romance meter update data
     */
    updateRomanceMeter(data) {
        try {
        const { npc: npcId, amount } = data;
        const npc = this.getNPC(npcId);
        
        if (!npc) {
            console.error(`Cannot update romance meter: NPC '${npcId}' not found`);
            return;
        }

        // Update romance meter
        const oldMeter = npc.romanceMeter;
        npc.romanceMeter = Math.max(0, Math.min(npc.maxRomance, npc.romanceMeter + amount));
        
            console.log(`${npc.name} romance meter: ${oldMeter} -> ${npc.romanceMeter} (+${amount})`);

        // Check for relationship level changes
        this.checkRelationshipLevelUp(npc, oldMeter);

            // Save the updated data immediately
        this.saveNPCData(npcId);

        // Emit event for UI updates
            if (this.gameScene && this.gameScene.events) {
        this.gameScene.events.emit('romance-meter-updated', {
            npcId: npcId,
            oldValue: oldMeter,
            newValue: npc.romanceMeter,
            maxValue: npc.maxRomance
        });
            }
            
            console.log(`DialogManager: Romance meter update completed for ${npc.name}`);
        } catch (error) {
            console.error('DialogManager: Error updating romance meter:', error);
            console.error('DialogManager: Romance meter data:', data);
        }
    }

    /**
     * Check if NPC relationship level should change
     * @param {Object} npc - NPC data
     * @param {number} oldMeter - Previous romance meter value
     */
    checkRelationshipLevelUp(npc, oldMeter) {
        const thresholds = {
            stranger: 0,
            acquaintance: 20,
            friend: 40,
            close_friend: 60,
            romantic_interest: 80,
            lover: 100
        };

        let newLevel = 'stranger';
        for (const [level, threshold] of Object.entries(thresholds)) {
            if (npc.romanceMeter >= threshold) {
                newLevel = level;
            }
        }

        if (newLevel !== npc.relationship) {
            const oldLevel = npc.relationship;
            npc.relationship = newLevel;
            
            console.log(`${npc.name} relationship: ${oldLevel} -> ${newLevel}`);
            
            // Unlock HCG or special content based on relationship level
            this.unlockRelationshipContent(npc, newLevel);
            
            // Emit relationship change event
            this.gameScene.events.emit('relationship-changed', {
                npcId: npc.id,
                oldLevel: oldLevel,
                newLevel: newLevel,
                romanceMeter: npc.romanceMeter
            });
        }
    }

    /**
     * Unlock relationship-specific content (HCG, dialog options, etc.)
     * @param {Object} npc - NPC data
     * @param {string} relationshipLevel - New relationship level
     */
    unlockRelationshipContent(npc, relationshipLevel) {
        const contentMap = {
            acquaintance: [`${npc.id}_intro_hcg`],
            friend: [`${npc.id}_friend_hcg`, `${npc.id}_casual_outfit`],
            close_friend: [`${npc.id}_closeup_hcg`, `${npc.id}_swimsuit_variant`],
            romantic_interest: [`${npc.id}_romantic_hcg`, `${npc.id}_date_scene`],
            lover: [`${npc.id}_intimate_hcg`, `${npc.id}_special_ending`]
        };

        const unlockedContent = contentMap[relationshipLevel];
        if (unlockedContent) {
            unlockedContent.forEach(contentId => {
                this.unlockHCG(contentId);
            });
        }
    }

    /**
     * Unlock HCG (image) content
     * @param {string} hcgId - The HCG content ID
     */
    unlockHCG(hcgId) {
        console.log(`Unlocking HCG: ${hcgId}`);
        
        // Add to player's collection (this would integrate with Album system)
        if (this.gameScene.albumManager) {
            this.gameScene.albumManager.unlockContent(hcgId);
        }

        // Show unlock notification
        this.gameScene.events.emit('hcg-unlocked', {
            hcgId: hcgId,
            message: `New image unlocked in Album!`
        });
    }

    /**
     * Update quest progress
     * @param {Object} data - Quest update data
     */
    updateQuest(data) {
        console.log('Updating quest:', data);
        
        if (this.gameScene.questManager) {
            this.gameScene.questManager.updateQuest(data);
        }
    }

    /**
     * Unlock achievement
     * @param {Object} data - Achievement data
     */
    unlockAchievement(data) {
        console.log('Unlocking achievement:', data);
        
        if (this.gameScene.playerProgression) {
            this.gameScene.playerProgression.unlockAchievement(data.achievement);
        }
    }

    /**
     * Update player inventory
     * @param {Object} data - Inventory update data
     */
    updateInventory(data) {
        console.log('Updating inventory:', data);
        
        if (this.gameScene.inventoryManager) {
            if (data.action === 'add') {
                this.gameScene.inventoryManager.addItem(data.item, data.quantity);
            } else if (data.action === 'remove') {
                this.gameScene.inventoryManager.removeItem(data.item, data.quantity);
            }
        }
    }

    /**
     * End the dialog with an NPC
     * @param {string} npcId - The NPC ID
     * @param {string} callingScene - The scene that called the dialog
     */
    endDialog(npcId, callingScene = 'GameScene') {
        console.log(`Ending dialog with ${npcId}, returning to ${callingScene}`);
        
        // Remove from active dialogs
        this.activeDialogs.delete(npcId);

        // Trigger quest manager hooks if available
        const questManager = this.gameScene.questManager;
        if (questManager) {
            questManager.onDialogCompleted(npcId, { /* dialog choice data if needed */ });
        }

        // Emit event for game systems
        this.gameScene.events.emit('dialog-completed', {
            npcId: npcId,
            timestamp: Date.now()
        });

        // Resume the calling Scene
        if (this.gameScene.scene.isPaused(callingScene)) {
            this.gameScene.scene.resume(callingScene);
        }

        // Save dialog completion state
        this.saveDialogCompletionState(npcId);
    }

    /**
     * Save dialog completion state for tracking
     * @param {string} npcId - The NPC ID
     */
    saveDialogCompletionState(npcId) {
        try {
            const completionData = JSON.parse(localStorage.getItem('dialogCompletions') || '{}');
            const today = new Date().toDateString();
            
            if (!completionData[npcId]) {
                completionData[npcId] = [];
            }
            
            completionData[npcId].push({
                date: today,
                timestamp: Date.now()
            });
            
            localStorage.setItem('dialogCompletions', JSON.stringify(completionData));
        } catch (error) {
            console.error('Error saving dialog completion state:', error);
        }
    }

    /**
     * Save NPC data to localStorage
     * @param {string} npcId - The NPC ID
     */
    saveNPCData(npcId) {
        const npc = this.getNPC(npcId);
        if (npc) {
            const saveData = {
                romanceMeter: npc.romanceMeter,
                relationship: npc.relationship
            };
            
            localStorage.setItem(`npc_${npcId}`, JSON.stringify(saveData));
        }
    }

    /**
     * Load NPC data from localStorage
     * @param {string} npcId - The NPC ID
     */
    loadNPCData(npcId) {
        try {
            const saveData = localStorage.getItem(`npc_${npcId}`);
            if (saveData) {
                const data = JSON.parse(saveData);
                const npc = this.getNPC(npcId);
                if (npc) {
                    npc.romanceMeter = data.romanceMeter || 0;
                    npc.relationship = data.relationship || 'stranger';
                }
            }
        } catch (error) {
            console.error(`Failed to load NPC data for ${npcId}:`, error);
        }
    }

    /**
     * Load all NPC data
     */
    loadAllNPCData() {
        for (const npcId of this.npcs.keys()) {
            this.loadNPCData(npcId);
        }
    }

    /**
     * Get romance meter status for UI display
     * @param {string} npcId - The NPC ID
     * @returns {Object} Romance meter display data
     */
    getRomanceMeterStatus(npcId) {
        const npc = this.getNPC(npcId);
        if (!npc) return null;

        return {
            npcId: npcId,
            name: npc.name,
            romanceMeter: npc.romanceMeter,
            maxRomance: npc.maxRomance,
            relationship: npc.relationship,
            percentage: Math.floor((npc.romanceMeter / npc.maxRomance) * 100)
        };
    }

    /**
     * Check if any dialogs are currently active
     * @returns {boolean} True if any dialog is active
     */
    isDialogActive() {
        return this.activeDialogs.size > 0;
    }

    /**
     * Get all NPC romance meter statuses
     * @returns {Array} Array of romance meter status objects
     */
    getAllRomanceStatuses() {
        const statuses = [];
        for (const npcId of this.npcs.keys()) {
            statuses.push(this.getRomanceMeterStatus(npcId));
        }
        return statuses;
    }

    /**
     * Increase NPC romance meter (quest system hook)
     * @param {string} npcId - The NPC ID
     * @param {number} amount - Amount to increase
     */
    increaseRomanceMeter(npcId, amount) {
        this.updateRomanceMeter({ npc: npcId, amount: amount });
        
        // Trigger quest manager hooks if available
        const questManager = this.gameScene.questManager;
        if (questManager) {
            const npc = this.getNPC(npcId);
            if (npc) {
                questManager.onRomanceMeterChanged(npcId, npc.romanceMeter);
            }
        }
    }

    /**
     * Decrease NPC romance meter (quest system hook)
     * @param {string} npcId - The NPC ID
     * @param {number} amount - Amount to decrease
     */
    decreaseRomanceMeter(npcId, amount) {
        this.updateRomanceMeter({ npc: npcId, amount: -amount });
        
        // Trigger quest manager hooks if available
        const questManager = this.gameScene.questManager;
        if (questManager) {
            const npc = this.getNPC(npcId);
            if (npc) {
                questManager.onRomanceMeterChanged(npcId, npc.romanceMeter);
            }
        }
    }

    /**
     * Unlock quest (helper method)
     * @param {string} questId - The quest ID
     */
    unlockQuest(questId) {
        this.updateQuest({ action: 'unlock', questId: questId });
    }

    /**
     * Complete quest (helper method)
     * @param {string} questId - The quest ID
     */
    completeQuest(questId) {
        this.updateQuest({ action: 'complete', questId: questId });
    }

    /**
     * Add inventory item (helper method)
     * @param {string} itemId - The item ID
     * @param {number} quantity - Quantity to add
     */
    addInventoryItem(itemId, quantity = 1) {
        this.updateInventory({ action: 'add', item: itemId, quantity: quantity });
    }

    /**
     * Remove inventory item (helper method)
     * @param {string} itemId - The item ID
     * @param {number} quantity - Quantity to remove
     */
    removeInventoryItem(itemId, quantity = 1) {
        this.updateInventory({ action: 'remove', item: itemId, quantity: quantity });
    }

    /**
     * Unlock achievement (helper method)
     * @param {string} achievementId - The achievement ID
     */
    unlockAchievement(achievementId) {
        // Call the underlying achievement system
        console.log('Unlocking achievement:', achievementId);
        
        if (this.gameScene.playerProgression) {
            this.gameScene.playerProgression.unlockAchievement(achievementId);
        }
    }

    /**
     * RenJs Integration Methods
     */

    /**
     * Execute RenJs quest command through QuestManager
     * @param {string} command - Quest command
     * @param {...any} args - Command arguments
     * @returns {any} Command result
     */
    executeRenJsQuestCommand(command, ...args) {
        if (this.questManager) {
            return this.questManager.executeRenJsCommand(command, ...args);
        } else {
            console.warn('DialogManager: Cannot execute quest command - QuestManager not available');
            return false;
        }
    }

    /**
     * Get quest state for RenJs scripts
     * @param {string} stateKey - State key to query
     * @returns {any} State value
     */
    getRenJsQuestState(stateKey) {
        if (this.questManager) {
            return this.questManager.getQuestStateForRenJs(stateKey);
        } else {
            console.warn('DialogManager: Cannot get quest state - QuestManager not available');
            return null;
        }
    }

    /**
     * Process RenJs dialog choice for quest progression
     * @param {string} dialogId - Dialog identifier
     * @param {string} choiceId - Choice identifier
     * @param {string} npcId - NPC identifier
     * @param {Object} choiceData - Additional choice data
     */
    processRenJsChoice(dialogId, choiceId, npcId, choiceData = {}) {
        console.log(`DialogManager: Processing RenJs choice - Dialog: ${dialogId}, Choice: ${choiceId}, NPC: ${npcId}`);

        // Update romance meter based on choice
        this.processRomanceChoice(choiceId, npcId, choiceData);

        // Process quest objectives
        if (this.questManager) {
            this.questManager.onRenJsChoiceMade(dialogId, choiceId, npcId);
        }

        // Unlock choice-specific achievements
        this.processChoiceAchievements(choiceId, npcId, choiceData);

        // Emit event for other systems
        this.gameScene.events.emit('renjs-choice-processed', {
            dialogId,
            choiceId,
            npcId,
            choiceData
        });
    }

    /**
     * Process romance meter changes from RenJs choices
     * @param {string} choiceId - Choice identifier
     * @param {string} npcId - NPC identifier
     * @param {Object} choiceData - Choice data
     */
    processRomanceChoice(choiceId, npcId, choiceData) {
        let romanceChange = 0;

        // Determine romance impact based on choice type
        if (choiceId.includes('romantic') || choiceId.includes('flirt')) {
            romanceChange = choiceData.romanceBonus || 5;
        } else if (choiceId.includes('helpful') || choiceId.includes('kind')) {
            romanceChange = choiceData.romanceBonus || 3;
        } else if (choiceId.includes('rude') || choiceId.includes('dismiss')) {
            romanceChange = choiceData.romancePenalty || -2;
        } else if (choiceId.includes('neutral')) {
            romanceChange = 1;
        }

        // Apply romance change
        if (romanceChange !== 0) {
            this.updateRomanceMeter({
                npc: npcId,
                amount: romanceChange
            });
        }
    }

    /**
     * Process achievements from RenJs choices
     * @param {string} choiceId - Choice identifier
     * @param {string} npcId - NPC identifier
     * @param {Object} choiceData - Choice data
     */
    processChoiceAchievements(choiceId, npcId, choiceData) {
        // First conversation achievement
        this.unlockAchievement('first_conversation');

        // Choice-specific achievements
        if (choiceData.achievement) {
            this.unlockAchievement(choiceData.achievement);
        }

        // NPC-specific achievements
        if (choiceId.includes('romantic')) {
            this.unlockAchievement(`${npcId}_romantic_choice`);
        }

        if (choiceId.includes('gift')) {
            this.unlockAchievement(`${npcId}_gift_given`);
        }

        if (choiceId.includes('fishing_tips')) {
            this.unlockAchievement('fishing_mentor');
        }
    }

    /**
     * Create RenJs-compatible quest state object
     * @returns {Object} Quest state for RenJs
     */
    createRenJsQuestState() {
        const questState = {};

        // Quest states (assuming this.questManager exists and has these properties)
        if (this.gameScene.questManager) {
            questState.tutorial_completed = this.gameScene.questManager.completedQuests?.has('story_001_tutorial') || false;
            questState.first_companion_met = this.gameScene.questManager.completedQuests?.has('story_002_first_companion') || false;
            
            // Active quest states
            this.npcs.forEach(npc => {
                questState[`${npc.id}_quest_active`] = this.gameScene.questManager.activeQuests?.has(`npc_${npc.id}_001`) || false;
            });

            // Quest progress examples (adapt as needed)
            questState.species_collected = this.gameScene.questManager.getQuestProgress?.('fishing_001_species_collector', 'catch_10_species') || 0;
            questState.rare_fish_caught = this.gameScene.questManager.getQuestProgress?.('side_001_master_angler', 'catch_rare_fish') || 0;
        } else {
            // Default quest states if questManager is not available
            questState.tutorial_completed = false;
            questState.first_companion_met = false;
            this.npcs.forEach(npc => {
                questState[`${npc.id}_quest_active`] = false;
            });
            questState.species_collected = 0;
            questState.rare_fish_caught = 0;
        }

        // Romance states and detailed relationship flags
        this.npcs.forEach(npc => {
            const npcData = this.getNPC(npc.id);
            questState[`${npc.id}_romance_level`] = npcData?.romanceMeter || 0;
            const currentRelationship = npcData?.relationship || 'stranger';
            questState[`${npc.id}_relationship`] = currentRelationship;

            // Detailed boolean flags for relationships
            const relationships = ['stranger', 'acquaintance', 'friend', 'close_friend', 'romantic_interest', 'lover'];
            let relationshipIndex = relationships.indexOf(currentRelationship);
            if (relationshipIndex === -1) relationshipIndex = 0; // Default to stranger if unknown

            relationships.forEach((level, index) => {
                questState[`${npc.id}_is_${level}`] = (currentRelationship === level);
                questState[`${npc.id}_is_${level}_or_higher`] = (relationshipIndex >= index);
            });
        });

        // Player stats (placeholder - needs integration with GameState or PlayerProgression)
        // This assumes GameState is accessible via this.gameScene.gameState
        const gameState = this.gameScene.gameState; // Or however GameState is accessed
        questState.player = {
            level: gameState?.player?.level || 1,
            money: gameState?.player?.money || 0,
            fishing_skill: gameState?.player?.attributes?.fishDetection || 5, // Example: using fishDetection as fishing_skill
            has_item_master_rod: gameState?.inventoryManager?.hasItem('master_rod') || false, // Example check
            // Add other relevant player stats here
        };
        
        // Add any other global game flags needed by RenJS
        questState.current_day_of_week = new Date().getDay(); // 0 for Sunday, 1 for Monday, etc.
        questState.is_raining = this.gameScene.weatherManager?.isRaining() || false; // Example

        return questState;
    }

    /**
     * Export dialog manager state for RenJs
     * @returns {Object} Exported functions and state
     */
    exportForRenJs() {
        return {
            // Quest integration
            executeQuestCommand: (command, ...args) => this.executeRenJsQuestCommand(command, ...args),
            getQuestState: (stateKey) => this.getRenJsQuestState(stateKey),
            processChoice: (dialogId, choiceId, npcId, choiceData) => this.processRenJsChoice(dialogId, choiceId, npcId, choiceData),
            
            // NPC state
            getNPCData: (npcId) => this.getNPC(npcId),
            getRomanceLevel: (npcId) => this.getNPC(npcId)?.romanceMeter || 0,
            getRelationship: (npcId) => this.getNPC(npcId)?.relationship || 'stranger',
            
            // Actions
            increaseRomance: (npcId, amount) => this.increaseRomanceMeter(npcId, amount),
            decreaseRomance: (npcId, amount) => this.decreaseRomanceMeter(npcId, amount),
            unlockAchievement: (achievementId) => this.unlockAchievement(achievementId),
            giveItem: (itemId, quantity) => this.addInventoryItem(itemId, quantity),
            
            // State queries
            getQuestStates: () => this.createRenJsQuestState(),
            getAllRomanceStates: () => this.getAllRomanceStatuses()
        };
    }

    /**
     * Initialize RenJs global integration
     */
    initializeRenJsGlobalIntegration() {
        if (typeof window !== 'undefined') {
            // Expose DialogManager for RenJs access
            window.LuxuryAnglerDialog = this.exportForRenJs();
            console.log('DialogManager: Exposed globally as window.LuxuryAnglerDialog');
            
            // Create combined quest and dialog interface
            window.LuxuryAnglerGame = {
                ...this.exportForRenJs(),
                ...(this.questManager?.exportForRenJs() || {}),
                
                // Unified command interface
                execute: (command, ...args) => {
                    // Try quest commands first, then dialog commands
                    if (this.questManager?.renjsCallbacks.has(command)) {
                        return this.executeRenJsQuestCommand(command, ...args);
                    } else {
                        console.warn(`Unknown RenJs command: ${command}`);
                        return false;
                    }
                }
            };
            
            console.log('DialogManager: Unified RenJs interface created as window.LuxuryAnglerGame');
        }
    }
} 