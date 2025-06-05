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
                dialogScript: 'sample_assistant.md',
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
     * Get NPC data by ID
     * @param {string} npcId - The ID of the NPC
     * @returns {Object} NPC data object
     */
    getNPC(npcId) {
        return this.npcs.get(npcId);
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
     */
    startDialog(npcId, callingScene = 'GameScene') {
        try {
            // Validate inputs
            if (!npcId || typeof npcId !== 'string') {
                console.error('DialogManager: Invalid npcId provided to startDialog:', npcId);
                return false;
            }

            const npc = this.getNPC(npcId);
            if (!npc) {
                console.error(`DialogManager: NPC with ID '${npcId}' not found`);
                return false;
            }

            // Check if scene manager is available
            if (!this.gameScene || !this.gameScene.scene) {
                console.error('DialogManager: GameScene or scene manager not available');
                return false;
            }

            console.log(`DialogManager: Starting dialog with ${npc.name} from ${callingScene}`);
            
            // Add to active dialogs
            this.activeDialogs.add(npcId);

            // Start the dialog scene with error handling
            try {
                this.gameScene.scene.launch('DialogScene', {
                    npcId: npcId, // Use npcId instead of npc for consistency
                    script: npc.dialogScript,
                    callingScene: callingScene,
                    dialogManager: this // Pass DialogManager reference
                });
            } catch (sceneError) {
                console.error('DialogManager: Error launching DialogScene:', sceneError);
                this.activeDialogs.delete(npcId); // Clean up on error
                return false;
            }

            // Set up event listeners for this dialog
            this.setupDialogListeners(npcId, callingScene);
            
            return true;
            
        } catch (error) {
            console.error('DialogManager: Error in startDialog:', error);
            return false;
        }
    }

    /**
     * Set up event listeners for dialog callbacks
     * @param {string} npcId - The NPC ID
     * @param {string} callingScene - The calling scene name
     */
    setupDialogListeners(npcId, callingScene) {
        try {
            // Wait a bit for DialogScene to be fully initialized
            this.gameScene.time.delayedCall(100, () => {
                const dialogScene = this.gameScene.scene.get('DialogScene');
                if (!dialogScene) {
                    console.warn('DialogManager: DialogScene not found when setting up listeners');
                    return;
                }

                // Listen for romance meter changes
                dialogScene.events.on('romance-update', (data) => {
                    try {
                        this.updateRomanceMeter(data);
                    } catch (error) {
                        console.error('DialogManager: Error updating romance meter:', error);
                    }
                });

                // Listen for quest updates
                dialogScene.events.on('quest-update', (data) => {
                    try {
                        this.updateQuest(data);
                    } catch (error) {
                        console.error('DialogManager: Error updating quest:', error);
                    }
                });

                // Listen for achievement unlocks
                dialogScene.events.on('achievement-unlock', (data) => {
                    try {
                        this.unlockAchievement(data);
                    } catch (error) {
                        console.error('DialogManager: Error unlocking achievement:', error);
                    }
                });

                // Listen for inventory changes
                dialogScene.events.on('inventory-update', (data) => {
                    try {
                        this.updateInventory(data);
                    } catch (error) {
                        console.error('DialogManager: Error updating inventory:', error);
                    }
                });

                // Listen for dialog end
                dialogScene.events.once('dialog-ended', () => {
                    try {
                        this.endDialog(npcId);
                    } catch (error) {
                        console.error('DialogManager: Error ending dialog:', error);
                    }
                });
                
                console.log(`DialogManager: Event listeners set up for ${npcId} dialog`);
            });
        } catch (error) {
            console.error('DialogManager: Error setting up dialog listeners:', error);
        }
    }

    /**
     * Update NPC romance meter
     * @param {Object} data - Romance meter update data
     */
    updateRomanceMeter(data) {
        const { npc: npcId, amount } = data;
        const npc = this.getNPC(npcId);
        
        if (!npc) {
            console.error(`Cannot update romance meter: NPC '${npcId}' not found`);
            return;
        }

        // Update romance meter
        const oldMeter = npc.romanceMeter;
        npc.romanceMeter = Math.max(0, Math.min(npc.maxRomance, npc.romanceMeter + amount));
        
        console.log(`${npc.name} romance meter: ${oldMeter} -> ${npc.romanceMeter}`);

        // Check for relationship level changes
        this.checkRelationshipLevelUp(npc, oldMeter);

        // Save the updated data
        this.saveNPCData(npcId);

        // Emit event for UI updates
        this.gameScene.events.emit('romance-meter-updated', {
            npcId: npcId,
            oldValue: oldMeter,
            newValue: npc.romanceMeter,
            maxValue: npc.maxRomance
        });
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
     */
    endDialog(npcId) {
        console.log(`Ending dialog with ${npcId}`);
        
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