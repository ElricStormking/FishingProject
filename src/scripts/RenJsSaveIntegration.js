/**
 * RenJs Save Integration - Links RenJs save system to game save architecture
 * Part of RenJs Integration Final Polish task implementation
 */
export class RenJsSaveIntegration {
    constructor(gameState, questManager, dialogManager) {
        this.gameState = gameState;
        this.questManager = questManager;
        this.dialogManager = dialogManager;
        
        this.saveKey = 'luxury_angler_renjs_save';
        this.backupKey = 'luxury_angler_renjs_backup';
        this.maxBackups = 5;
        
        // Save data structure
        this.saveData = {
            version: '1.0.0',
            timestamp: Date.now(),
            renjs: {
                dialogStates: {},
                choiceHistory: [],
                flags: {},
                variables: {}
            },
            quests: {
                activeQuests: {},
                completedQuests: [],
                questProgress: {},
                questFlags: {}
            },
            achievements: {
                unlockedAchievements: [],
                achievementProgress: {},
                achievementStats: {}
            },
            romance: {
                meterValues: {},
                relationshipStates: {},
                unlockedDialogs: {}
            },
            gameProgress: {
                currentChapter: 1,
                storyFlags: {},
                playerChoices: {}
            }
        };
        
        this.initializeSaveIntegration();
        console.log('RenJsSaveIntegration: Save/load system initialized');
    }

    /**
     * Initialize save integration with existing systems
     */
    initializeSaveIntegration() {
        // Set up periodic auto-save
        this.setupAutoSave();
        
        // Register event listeners for save triggers
        this.setupSaveEventListeners();
        
        // Expose save/load methods globally for RenJs access
        this.exposeGlobalSaveMethods();
        
        // Load existing save data if available
        this.loadGameSave();
    }

    /**
     * Setup automatic saving triggers
     */
    setupAutoSave() {
        // Auto-save every 30 seconds during dialog
        this.autoSaveInterval = setInterval(() => {
            if (this.isDialogActive()) {
                this.saveGameState('auto');
            }
        }, 30000);
        
        // Save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveGameState('emergency');
        });
    }

    /**
     * Setup event listeners for save triggers
     */
    setupSaveEventListeners() {
        // Save on dialog choice made
        if (this.dialogManager) {
            this.dialogManager.on?.('choice-made', (choiceData) => {
                this.onDialogChoiceMade(choiceData);
                this.saveGameState('choice');
            });
            
            this.dialogManager.on?.('dialog-ended', () => {
                this.saveGameState('dialog-end');
            });
        }
        
        // Save on quest progress
        if (this.questManager) {
            this.questManager.on?.('quest-started', (questData) => {
                this.onQuestStarted(questData);
                this.saveGameState('quest');
            });
            
            this.questManager.on?.('quest-completed', (questData) => {
                this.onQuestCompleted(questData);
                this.saveGameState('quest');
            });
            
            this.questManager.on?.('achievement-unlocked', (achievementData) => {
                this.onAchievementUnlocked(achievementData);
                this.saveGameState('achievement');
            });
        }
        
        // Save on romance meter changes
        if (this.gameState) {
            this.gameState.on?.('romance-meter-changed', (romanceData) => {
                this.onRomanceMeterChanged(romanceData);
                this.saveGameState('romance');
            });
        }
    }

    /**
     * Expose save/load methods for RenJs global access
     */
    exposeGlobalSaveMethods() {
        window.LuxuryAnglerSave = {
            save: (slotId = 'current') => this.saveGameState('manual', slotId),
            load: (slotId = 'current') => this.loadGameState(slotId),
            getSaveData: () => this.getSaveData(),
            setSaveData: (data) => this.setSaveData(data),
            exportSave: () => this.exportSave(),
            importSave: (saveString) => this.importSave(saveString),
            
            // RenJs specific methods
            saveRenJsState: (renjsData) => this.saveRenJsState(renjsData),
            loadRenJsState: () => this.loadRenJsState(),
            updateRenJsFlags: (flags) => this.updateRenJsFlags(flags),
            getRenJsFlags: () => this.getRenJsFlags()
        };
        
        console.log('RenJsSaveIntegration: Global save methods exposed');
    }

    /**
     * Check if dialog is currently active
     */
    isDialogActive() {
        return document.getElementById('renjs-simple-container') !== null ||
               this.dialogManager?.isDialogActive ||
               false;
    }

    /**
     * Save current game state
     */
    saveGameState(saveType = 'manual', slotId = 'current') {
        try {
            // Update save data with current state
            this.updateSaveData();
            
            // Create backup before saving
            this.createBackup();
            
            // Save to localStorage
            const saveKey = slotId === 'current' ? this.saveKey : `${this.saveKey}_${slotId}`;
            localStorage.setItem(saveKey, JSON.stringify(this.saveData));
            
            // Also save to game state if available
            if (this.gameState?.saveGame) {
                this.gameState.saveGame();
            }
            
            console.log(`RenJsSaveIntegration: Game saved (${saveType}) to slot: ${slotId}`);
            return true;
        } catch (error) {
            console.error('RenJsSaveIntegration: Error saving game:', error);
            return false;
        }
    }

    /**
     * Update save data with current game state
     */
    updateSaveData() {
        this.saveData.timestamp = Date.now();
        
        // Update RenJs state
        this.updateRenJsSaveData();
        
        // Update quest state
        this.updateQuestSaveData();
        
        // Update achievement state
        this.updateAchievementSaveData();
        
        // Update romance state
        this.updateRomanceSaveData();
        
        // Update general game progress
        this.updateGameProgressSaveData();
    }

    /**
     * Update RenJs specific save data
     */
    updateRenJsSaveData() {
        // Get RenJs state if available
        if (window.LuxuryAnglerGame) {
            const renjsState = window.LuxuryAnglerGame.getRenJsState?.() || {};
            this.saveData.renjs = {
                ...this.saveData.renjs,
                ...renjsState
            };
        }
        
        // Save current dialog flags
        this.saveData.renjs.flags = this.getRenJsFlags();
        
        // Save dialog choice history
        if (this.dialogManager?.choiceHistory) {
            this.saveData.renjs.choiceHistory = [...this.dialogManager.choiceHistory];
        }
    }

    /**
     * Update quest save data
     */
    updateQuestSaveData() {
        if (this.questManager) {
            this.saveData.quests = {
                activeQuests: this.questManager.getActiveQuests?.() || {},
                completedQuests: this.questManager.getCompletedQuests?.() || [],
                questProgress: this.questManager.getQuestProgress?.() || {},
                questFlags: this.questManager.getQuestFlags?.() || {}
            };
        }
    }

    /**
     * Update achievement save data
     */
    updateAchievementSaveData() {
        if (this.questManager) {
            this.saveData.achievements = {
                unlockedAchievements: this.questManager.getUnlockedAchievements?.() || [],
                achievementProgress: this.questManager.getAchievementProgress?.() || {},
                achievementStats: this.questManager.getAchievementStats?.() || {}
            };
        }
    }

    /**
     * Update romance save data
     */
    updateRomanceSaveData() {
        if (this.gameState) {
            this.saveData.romance = {
                meterValues: this.gameState.getRomanceMeterValues?.() || {},
                relationshipStates: this.gameState.getRelationshipStates?.() || {},
                unlockedDialogs: this.gameState.getUnlockedDialogs?.() || {}
            };
        }
    }

    /**
     * Update general game progress save data
     */
    updateGameProgressSaveData() {
        if (this.gameState) {
            this.saveData.gameProgress = {
                currentChapter: this.gameState.currentChapter || 1,
                storyFlags: this.gameState.getStoryFlags?.() || {},
                playerChoices: this.gameState.getPlayerChoices?.() || {}
            };
        }
    }

    /**
     * Load game state from save
     */
    loadGameState(slotId = 'current') {
        try {
            const saveKey = slotId === 'current' ? this.saveKey : `${this.saveKey}_${slotId}`;
            const savedData = localStorage.getItem(saveKey);
            
            if (!savedData) {
                console.log('RenJsSaveIntegration: No save data found');
                return false;
            }
            
            this.saveData = JSON.parse(savedData);
            
            // Apply save data to game systems
            this.applySaveData();
            
            console.log(`RenJsSaveIntegration: Game loaded from slot: ${slotId}`);
            return true;
        } catch (error) {
            console.error('RenJsSaveIntegration: Error loading game:', error);
            return false;
        }
    }

    /**
     * Apply save data to game systems
     */
    applySaveData() {
        // Apply RenJs state
        this.applyRenJsSaveData();
        
        // Apply quest state
        this.applyQuestSaveData();
        
        // Apply achievement state
        this.applyAchievementSaveData();
        
        // Apply romance state
        this.applyRomanceSaveData();
        
        // Apply general game progress
        this.applyGameProgressSaveData();
    }

    /**
     * Apply RenJs save data
     */
    applyRenJsSaveData() {
        if (this.saveData.renjs) {
            // Set RenJs flags
            this.setRenJsFlags(this.saveData.renjs.flags);
            
            // Restore dialog choice history
            if (this.dialogManager && this.saveData.renjs.choiceHistory) {
                this.dialogManager.choiceHistory = [...this.saveData.renjs.choiceHistory];
            }
            
            // Apply RenJs state to window object if available
            if (window.LuxuryAnglerGame?.setRenJsState) {
                window.LuxuryAnglerGame.setRenJsState(this.saveData.renjs);
            }
        }
    }

    /**
     * Apply quest save data
     */
    applyQuestSaveData() {
        if (this.questManager && this.saveData.quests) {
            this.questManager.loadQuestState?.(this.saveData.quests);
        }
    }

    /**
     * Apply achievement save data
     */
    applyAchievementSaveData() {
        if (this.questManager && this.saveData.achievements) {
            this.questManager.loadAchievementState?.(this.saveData.achievements);
        }
    }

    /**
     * Apply romance save data
     */
    applyRomanceSaveData() {
        if (this.gameState && this.saveData.romance) {
            this.gameState.loadRomanceState?.(this.saveData.romance);
        }
    }

    /**
     * Apply general game progress save data
     */
    applyGameProgressSaveData() {
        if (this.gameState && this.saveData.gameProgress) {
            this.gameState.loadGameProgress?.(this.saveData.gameProgress);
        }
    }

    /**
     * Event handlers for automatic saving
     */
    onDialogChoiceMade(choiceData) {
        // Store choice in save data
        if (!this.saveData.renjs.choiceHistory) {
            this.saveData.renjs.choiceHistory = [];
        }
        
        this.saveData.renjs.choiceHistory.push({
            timestamp: Date.now(),
            npcId: choiceData.npcId,
            dialogId: choiceData.dialogId,
            choiceId: choiceData.choiceId,
            choiceText: choiceData.choiceText
        });
        
        // Keep only last 100 choices
        if (this.saveData.renjs.choiceHistory.length > 100) {
            this.saveData.renjs.choiceHistory = this.saveData.renjs.choiceHistory.slice(-100);
        }
    }

    onQuestStarted(questData) {
        if (import.meta.env.DEV) console.log('RenJsSaveIntegration: Quest started, updating save data:', questData.id);
    }

    onQuestCompleted(questData) {
        if (import.meta.env.DEV) console.log('RenJsSaveIntegration: Quest completed, updating save data:', questData.id);
    }

    onAchievementUnlocked(achievementData) {
        if (import.meta.env.DEV) console.log('RenJsSaveIntegration: Achievement unlocked, updating save data:', achievementData.id);
    }

    onRomanceMeterChanged(romanceData) {
        console.log('RenJsSaveIntegration: Romance meter changed, updating save data:', romanceData.npcId);
    }

    /**
     * Create backup save
     */
    createBackup() {
        try {
            const backups = this.getBackups();
            backups.push({
                timestamp: Date.now(),
                data: JSON.stringify(this.saveData)
            });
            
            // Keep only last N backups
            if (backups.length > this.maxBackups) {
                backups.splice(0, backups.length - this.maxBackups);
            }
            
            localStorage.setItem(this.backupKey, JSON.stringify(backups));
        } catch (error) {
            console.error('RenJsSaveIntegration: Error creating backup:', error);
        }
    }

    /**
     * Get all backups
     */
    getBackups() {
        try {
            const backupData = localStorage.getItem(this.backupKey);
            return backupData ? JSON.parse(backupData) : [];
        } catch (error) {
            console.error('RenJsSaveIntegration: Error getting backups:', error);
            return [];
        }
    }

    /**
     * Restore from backup
     */
    restoreFromBackup(backupIndex = 0) {
        try {
            const backups = this.getBackups();
            if (backups.length > backupIndex) {
                const backup = backups[backups.length - 1 - backupIndex];
                this.saveData = JSON.parse(backup.data);
                this.applySaveData();
                console.log('RenJsSaveIntegration: Restored from backup');
                return true;
            }
            return false;
        } catch (error) {
            console.error('RenJsSaveIntegration: Error restoring backup:', error);
            return false;
        }
    }

    /**
     * RenJs flag management
     */
    getRenJsFlags() {
        return this.saveData.renjs.flags || {};
    }

    setRenJsFlags(flags) {
        this.saveData.renjs.flags = { ...flags };
    }

    updateRenJsFlags(flags) {
        this.saveData.renjs.flags = { ...this.saveData.renjs.flags, ...flags };
    }

    setRenJsFlag(flagName, value) {
        if (!this.saveData.renjs.flags) {
            this.saveData.renjs.flags = {};
        }
        this.saveData.renjs.flags[flagName] = value;
    }

    getRenJsFlag(flagName) {
        return this.saveData.renjs.flags?.[flagName];
    }

    /**
     * Save data management
     */
    getSaveData() {
        return JSON.parse(JSON.stringify(this.saveData));
    }

    setSaveData(data) {
        this.saveData = JSON.parse(JSON.stringify(data));
        this.applySaveData();
    }

    /**
     * Export/Import functionality
     */
    exportSave() {
        this.updateSaveData();
        return btoa(JSON.stringify(this.saveData));
    }

    importSave(saveString) {
        try {
            const saveData = JSON.parse(atob(saveString));
            this.saveData = saveData;
            this.applySaveData();
            this.saveGameState('import');
            console.log('RenJsSaveIntegration: Save imported successfully');
            return true;
        } catch (error) {
            console.error('RenJsSaveIntegration: Error importing save:', error);
            return false;
        }
    }

    /**
     * Get save slots
     */
    getSaveSlots() {
        const slots = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.saveKey)) {
                const slotId = key === this.saveKey ? 'current' : key.replace(`${this.saveKey}_`, '');
                const saveData = JSON.parse(localStorage.getItem(key));
                slots.push({
                    slotId,
                    timestamp: saveData.timestamp,
                    chapter: saveData.gameProgress?.currentChapter || 1,
                    playtime: saveData.gameProgress?.playtime || 0
                });
            }
        }
        return slots.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Delete save slot
     */
    deleteSaveSlot(slotId) {
        const saveKey = slotId === 'current' ? this.saveKey : `${this.saveKey}_${slotId}`;
        localStorage.removeItem(saveKey);
        console.log(`RenJsSaveIntegration: Deleted save slot: ${slotId}`);
    }

    /**
     * Load game save on initialization
     */
    loadGameSave() {
        // Try to load current save
        if (this.loadGameState('current')) {
                    } else {
            console.log('RenJsSaveIntegration: No existing save found, starting fresh');
        }
    }

    /**
     * RenJs state management methods
     */
    saveRenJsState(renjsData) {
        this.saveData.renjs = { ...this.saveData.renjs, ...renjsData };
        this.saveGameState('renjs-update');
    }

    loadRenJsState() {
        return this.saveData.renjs || {};
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        // Final save before cleanup
        this.saveGameState('cleanup');
        
            }
} 