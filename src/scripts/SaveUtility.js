/**
 * SaveUtility.js - Comprehensive game state save/load/reset utility
 * Consolidates and enhances save functionality across the game
 */
export class SaveUtility {
    constructor(gameState) {
        this.gameState = gameState;
        this.saveKey = 'luxuryAngler_save';
        this.backupKey = 'luxuryAngler_backups';
        this.settingsKey = 'luxuryAngler_settings';
        this.maxBackups = 5;
        this.maxSaveSlots = 10;
        
        // Save compression settings
        this.enableCompression = true;
        
        // Auto-save settings
        this.autoSaveEnabled = true;
        this.autoSaveInterval = 30000; // 30 seconds
        this.autoSaveTimer = null;
        
        console.log('SaveUtility: Comprehensive save utility initialized');
    }

    /**
     * ==============================
     * CORE SAVE OPERATIONS
     * ==============================
     */

    /**
     * Save game state to specified slot
     */
    async saveGame(slot = 'main', options = {}) {
        try {
            const saveData = this.prepareSaveData(options);
            const slotKey = this.getSaveSlotKey(slot);
            
            // Create backup before saving
            if (options.createBackup !== false) {
                await this.createBackup(slot);
            }
            
            // Compress data if enabled
            const finalData = this.enableCompression ? 
                this.compressData(saveData) : saveData;
            
            // Save to localStorage
            localStorage.setItem(slotKey, JSON.stringify(finalData));
            
            // Update game state save tracking
            this.gameState.session.lastSave = Date.now();
            this.gameState.session.totalSaves++;
            
            const saveInfo = {
                slot: slot,
                timestamp: Date.now(),
                size: JSON.stringify(finalData).length,
                compressed: this.enableCompression,
                saveNumber: this.gameState.session.totalSaves
            };
            
            console.log(`SaveUtility: Game saved to slot '${slot}' (${saveInfo.size} bytes)`);
            this.gameState.emit('gameSaved', saveInfo);
            
            return { success: true, info: saveInfo };
        } catch (error) {
            console.error('SaveUtility: Save failed:', error);
            this.gameState.emit('saveError', { error: error.message, slot });
            return { success: false, error: error.message };
        }
    }

    /**
     * Load game state from specified slot
     */
    async loadGame(slot = 'main', options = {}) {
        try {
            const slotKey = this.getSaveSlotKey(slot);
            const saveDataStr = localStorage.getItem(slotKey);
            
            if (!saveDataStr) {
                throw new Error(`No save data found in slot '${slot}'`);
            }
            
            let saveData = JSON.parse(saveDataStr);
            
            // Decompress if needed
            if (this.isCompressedData(saveData)) {
                saveData = this.decompressData(saveData);
            }
            
            // Validate save data
            if (!this.validateSaveData(saveData)) {
                throw new Error('Save data validation failed');
            }
            
            // Apply save data to game state
            await this.applySaveData(saveData, options);
            
            const loadInfo = {
                slot: slot,
                timestamp: Date.now(),
                saveTimestamp: saveData.timestamp,
                version: saveData.version
            };
            
            console.log(`SaveUtility: Game loaded from slot '${slot}'`);
            this.gameState.emit('gameLoaded', loadInfo);
            
            return { success: true, info: loadInfo };
        } catch (error) {
            console.error('SaveUtility: Load failed:', error);
            this.gameState.emit('loadError', { error: error.message, slot });
            
            // Try to load from backup
            if (options.tryBackup !== false) {
                return await this.loadFromBackup(slot, 0);
            }
            
            return { success: false, error: error.message };
        }
    }

    /**
     * Reset game to initial state
     */
    async resetGame(options = {}) {
        try {
            // Create backup before reset if requested
            if (options.createBackup) {
                await this.createBackup('pre-reset');
            }
            
            // Reset game state
            this.gameState.initializeState();
            
            // Clear save data unless preserving settings
            if (!options.preserveSettings) {
                this.deleteSave('main');
                localStorage.removeItem(this.settingsKey);
            }
            
            // Clear backups unless preserving them
            if (!options.preserveBackups) {
                localStorage.removeItem(this.backupKey);
            }
            
            // Reset specific systems
            if (this.gameState.settingsManager && !options.preserveSettings) {
                this.gameState.settingsManager.resetToDefaults();
            }
            
            const resetInfo = {
                timestamp: Date.now(),
                preservedSettings: options.preserveSettings || false,
                preservedBackups: options.preserveBackups || false
            };
            
            console.log('SaveUtility: Game reset to initial state');
            this.gameState.emit('gameReset', resetInfo);
            
            return { success: true, info: resetInfo };
        } catch (error) {
            console.error('SaveUtility: Reset failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * ==============================
     * SAVE SLOT MANAGEMENT
     * ==============================
     */

    /**
     * Get list of all save slots
     */
    getSaveSlots() {
        const slots = [];
        
        for (let i = 0; i < this.maxSaveSlots; i++) {
            const slotId = i === 0 ? 'main' : `slot_${i}`;
            const slotKey = this.getSaveSlotKey(slotId);
            const saveData = localStorage.getItem(slotKey);
            
            if (saveData) {
                try {
                    let data = JSON.parse(saveData);
                    if (this.isCompressedData(data)) {
                        data = this.decompressData(data);
                    }
                    
                    slots.push({
                        id: slotId,
                        name: data.saveSlotName || `Save ${i + 1}`,
                        timestamp: data.timestamp,
                        playerLevel: data.player?.level || 1,
                        playerName: data.player?.name || 'Angler',
                        playtime: data.player?.totalPlayTime || 0,
                        fishCaught: data.player?.fishCaught || 0,
                        dataSize: saveData.length,
                        version: data.version
                    });
                } catch (error) {
                    console.warn(`SaveUtility: Invalid save data in slot ${slotId}`);
                }
            } else {
                slots.push({
                    id: slotId,
                    name: `Save ${i + 1}`,
                    empty: true
                });
            }
        }
        
        return slots;
    }

    /**
     * Delete save slot
     */
    deleteSave(slot) {
        const slotKey = this.getSaveSlotKey(slot);
        localStorage.removeItem(slotKey);
        console.log(`SaveUtility: Deleted save slot '${slot}'`);
        this.gameState.emit('saveDeleted', { slot });
    }

    /**
     * Copy save from one slot to another
     */
    copySave(fromSlot, toSlot) {
        try {
            const fromKey = this.getSaveSlotKey(fromSlot);
            const toKey = this.getSaveSlotKey(toSlot);
            const saveData = localStorage.getItem(fromKey);
            
            if (!saveData) {
                throw new Error(`No save data found in slot '${fromSlot}'`);
            }
            
            localStorage.setItem(toKey, saveData);
            console.log(`SaveUtility: Copied save from '${fromSlot}' to '${toSlot}'`);
            return true;
        } catch (error) {
            console.error('SaveUtility: Copy failed:', error);
            return false;
        }
    }

    /**
     * ==============================
     * BACKUP SYSTEM
     * ==============================
     */

    /**
     * Create backup of current save
     */
    async createBackup(label = 'auto') {
        try {
            const saveData = this.prepareSaveData();
            const backup = {
                label: label,
                timestamp: Date.now(),
                data: saveData,
                size: JSON.stringify(saveData).length
            };
            
            const backups = this.getBackups();
            backups.push(backup);
            
            // Keep only recent backups
            if (backups.length > this.maxBackups) {
                backups.splice(0, backups.length - this.maxBackups);
            }
            
            localStorage.setItem(this.backupKey, JSON.stringify(backups));
            console.log(`SaveUtility: Backup created with label '${label}'`);
            return true;
        } catch (error) {
            console.error('SaveUtility: Backup creation failed:', error);
            return false;
        }
    }

    /**
     * Load from backup
     */
    async loadFromBackup(slot, backupIndex = 0) {
        try {
            const backups = this.getBackups();
            if (backups.length <= backupIndex) {
                throw new Error(`No backup at index ${backupIndex}`);
            }
            
            const backup = backups[backups.length - 1 - backupIndex];
            await this.applySaveData(backup.data);
            
            console.log(`SaveUtility: Loaded from backup '${backup.label}'`);
            this.gameState.emit('gameLoadedFromBackup', { 
                label: backup.label, 
                timestamp: backup.timestamp 
            });
            
            return { success: true, backup: backup };
        } catch (error) {
            console.error('SaveUtility: Backup load failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get list of backups
     */
    getBackups() {
        try {
            return JSON.parse(localStorage.getItem(this.backupKey) || '[]');
        } catch (error) {
            console.warn('SaveUtility: Invalid backup data');
            return [];
        }
    }

    /**
     * Delete backup
     */
    deleteBackup(index) {
        const backups = this.getBackups();
        if (index < backups.length) {
            backups.splice(index, 1);
            localStorage.setItem(this.backupKey, JSON.stringify(backups));
            console.log(`SaveUtility: Deleted backup at index ${index}`);
            return true;
        }
        return false;
    }

    /**
     * ==============================
     * IMPORT/EXPORT SYSTEM
     * ==============================
     */

    /**
     * Export save data as downloadable string
     */
    exportSave(slot = 'main', options = {}) {
        try {
            const slotKey = this.getSaveSlotKey(slot);
            const saveData = localStorage.getItem(slotKey);
            
            if (!saveData) {
                throw new Error(`No save data found in slot '${slot}'`);
            }
            
            let data = JSON.parse(saveData);
            if (this.isCompressedData(data)) {
                data = this.decompressData(data);
            }
            
            const exportData = {
                ...data,
                exportInfo: {
                    exportedAt: Date.now(),
                    exportedFrom: slot,
                    gameVersion: data.version || '1.0.0',
                    utilityVersion: '1.0.0'
                }
            };
            
            const exportString = options.format === 'compact' ? 
                JSON.stringify(exportData) : 
                JSON.stringify(exportData, null, 2);
            
            console.log(`SaveUtility: Save exported from slot '${slot}'`);
            return {
                success: true,
                data: exportString,
                filename: `luxury-angler-save-${slot}-${Date.now()}.json`
            };
        } catch (error) {
            console.error('SaveUtility: Export failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Import save data from string
     */
    async importSave(saveString, targetSlot = 'main', options = {}) {
        try {
            const saveData = JSON.parse(saveString);
            
            // Validate imported data
            if (!this.validateSaveData(saveData)) {
                throw new Error('Invalid save data format');
            }
            
            // Create backup before import
            if (options.createBackup !== false) {
                await this.createBackup('pre-import');
            }
            
            // Apply version migration if needed
            if (saveData.version !== '1.0.0') {
                this.migrateSaveData(saveData);
            }
            
            // Save to target slot
            const slotKey = this.getSaveSlotKey(targetSlot);
            localStorage.setItem(slotKey, JSON.stringify(saveData));
            
            // Load if importing to current slot
            if (targetSlot === 'main' || options.loadAfterImport) {
                await this.applySaveData(saveData);
            }
            
            console.log(`SaveUtility: Save imported to slot '${targetSlot}'`);
            this.gameState.emit('saveImported', { 
                slot: targetSlot, 
                originalTimestamp: saveData.timestamp 
            });
            
            return { success: true, slot: targetSlot };
        } catch (error) {
            console.error('SaveUtility: Import failed:', error);
            this.gameState.emit('importError', { error: error.message });
            return { success: false, error: error.message };
        }
    }

    /**
     * ==============================
     * AUTO-SAVE SYSTEM
     * ==============================
     */

    /**
     * Start auto-save timer
     */
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        if (!this.autoSaveEnabled) return;
        
        this.autoSaveTimer = setInterval(async () => {
            if (this.gameState.session.isDirty) {
                await this.saveGame('main', { 
                    createBackup: false, 
                    autoSave: true 
                });
            }
        }, this.autoSaveInterval);
        
        console.log('SaveUtility: Auto-save started');
    }

    /**
     * Stop auto-save timer
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
        console.log('SaveUtility: Auto-save stopped');
    }

    /**
     * Configure auto-save settings
     */
    configureAutoSave(enabled, interval = 30000) {
        this.autoSaveEnabled = enabled;
        this.autoSaveInterval = interval;
        
        if (enabled) {
            this.startAutoSave();
        } else {
            this.stopAutoSave();
        }
    }

    /**
     * ==============================
     * UTILITY METHODS
     * ==============================
     */

    /**
     * Prepare comprehensive save data
     */
    prepareSaveData(options = {}) {
        return {
            // Core game data
            player: this.gameState.player,
            inventory: this.gameState.inventory,
            world: this.gameState.world,
            locations: this.gameState.locations,
            shop: this.gameState.shop,
            sceneStates: this.gameState.sceneStates,
            
            // System data
            crafting: this.gameState.craftingManager?.save() || null,
            time: this.gameState.timeManager?.getTimeData() || null,
            weather: this.gameState.weatherManager?.getWeatherData() || null,
            progression: this.gameState.playerProgression?.getSaveData() || null,
            locationManager: this.gameState.locationManager?.getSaveData() || null,
            
            // Session data
            session: {
                ...this.gameState.session,
                savedAt: Date.now(),
                autoSave: options.autoSave || false
            },
            
            // Statistics
            gameStats: this.gameState.getGameStats(),
            
            // Metadata
            version: '1.0.0',
            timestamp: Date.now(),
            saveSlotName: options.name || null,
            saveMetadata: {
                compressionEnabled: this.enableCompression,
                utilityVersion: '1.0.0'
            }
        };
    }

    /**
     * Apply save data to game state
     */
    async applySaveData(saveData, options = {}) {
        // Merge with current state
        Object.assign(this.gameState.player, saveData.player || {});
        Object.assign(this.gameState.inventory, saveData.inventory || {});
        Object.assign(this.gameState.world, saveData.world || {});
        Object.assign(this.gameState.locations, saveData.locations || {});
        Object.assign(this.gameState.shop, saveData.shop || {});
        Object.assign(this.gameState.sceneStates, saveData.sceneStates || {});
        Object.assign(this.gameState.session, saveData.session || {});
        
        // Load system data
        if (this.gameState.craftingManager && saveData.crafting) {
            this.gameState.craftingManager.load(saveData.crafting);
        }
        
        if (this.gameState.timeManager && saveData.time) {
            this.gameState.timeManager.loadTimeData(saveData.time);
        }
        
        if (this.gameState.weatherManager && saveData.weather) {
            this.gameState.weatherManager.loadWeatherData(saveData.weather);
        }
        
        if (this.gameState.playerProgression && saveData.progression) {
            this.gameState.playerProgression.loadSaveData(saveData.progression);
        }
        
        if (this.gameState.locationManager && saveData.locationManager) {
            this.gameState.locationManager.loadSaveData(saveData.locationManager);
        }
        
        // Update game state
        this.gameState.markDirty();
    }

    /**
     * Validate save data structure
     */
    validateSaveData(data) {
        if (!data || typeof data !== 'object') return false;
        
        // Check required fields
        const requiredFields = ['player', 'inventory', 'world', 'version', 'timestamp'];
        for (const field of requiredFields) {
            if (!(field in data)) {
                console.warn(`SaveUtility: Missing required field: ${field}`);
                return false;
            }
        }
        
        // Check player structure
        if (!data.player.level || !data.player.experience) {
            console.warn('SaveUtility: Invalid player data');
            return false;
        }
        
        return true;
    }

    /**
     * Migrate save data for version compatibility
     */
    migrateSaveData(data) {
        console.log('SaveUtility: Migrating save data...');
        
        // Add missing fields with defaults
        if (!data.session) {
            data.session = {
                startTime: Date.now(),
                lastSave: data.timestamp || Date.now(),
                totalSaves: 1
            };
        }
        
        if (!data.player.statistics) {
            data.player.statistics = {
                totalCasts: 0,
                successfulCasts: 0,
                fishCaught: data.player.fishCaught || 0
            };
        }
        
        // Update version
        data.version = '1.0.0';
        
        console.log('SaveUtility: Migration completed');
    }

    /**
     * Data compression methods
     */
    compressData(data) {
        // Simple compression implementation
        return {
            compressed: true,
            data: btoa(JSON.stringify(data)),
            originalSize: JSON.stringify(data).length,
            timestamp: Date.now()
        };
    }

    decompressData(compressedData) {
        if (!compressedData.compressed) return compressedData;
        return JSON.parse(atob(compressedData.data));
    }

    isCompressedData(data) {
        return data && data.compressed === true;
    }

    /**
     * Get save slot storage key
     */
    getSaveSlotKey(slot) {
        return slot === 'main' ? this.saveKey : `${this.saveKey}_${slot}`;
    }

    /**
     * Get save statistics
     */
    getSaveStats() {
        const slots = this.getSaveSlots();
        const backups = this.getBackups();
        
        return {
            totalSlots: this.maxSaveSlots,
            usedSlots: slots.filter(s => !s.empty).length,
            totalBackups: backups.length,
            maxBackups: this.maxBackups,
            autoSaveEnabled: this.autoSaveEnabled,
            autoSaveInterval: this.autoSaveInterval,
            compressionEnabled: this.enableCompression
        };
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        this.stopAutoSave();
        console.log('SaveUtility: Utility destroyed');
    }
}

// Export singleton instance creator
export const createSaveUtility = (gameState) => {
    return new SaveUtility(gameState);
}; 