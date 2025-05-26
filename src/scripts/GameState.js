import { gameDataLoader } from './DataLoader.js';
import InventoryManager from './InventoryManager.js';
import CraftingManager from './CraftingManager.js';
import { SettingsManager } from './SettingsManager.js';
import { AudioManager } from './AudioManager.js';

class GameState {
    constructor() {
        if (GameState.instance) {
            return GameState.instance;
        }
        
        GameState.instance = this;
        this.initializeState();
        
        // Initialize settings manager
        this.settingsManager = new SettingsManager();
        
        // Initialize audio manager (will be properly initialized when first scene loads)
        this.audioManager = null;
        
        // Initialize inventory manager after state is set up
        this.inventoryManager = new InventoryManager(this);
        
        // Initialize crafting manager
        this.craftingManager = new CraftingManager(this, this.inventoryManager);
        
        this.loadFromStorage();
    }

    initializeState() {
        // Player data
        this.player = {
            name: 'Angler',
            level: 1,
            experience: 0,
            experienceToNext: 100,
            money: 100,
            fishCaught: 0,
            totalPlayTime: 0,
            achievements: [],
            statistics: {
                totalCasts: 0,
                successfulCasts: 0,
                fishCaught: 0,
                biggestFish: null,
                rarest: null,
                totalValue: 0
            },
            // Initialize player attributes with base values
            attributes: {
                castAccuracy: 5,
                fishDetection: 5,
                reelSpeed: 5,
                lineStrength: 5,
                biteRate: 5,
                rareFishChance: 5,
                qtePrecision: 5,
                lureSuccess: 5,
                castingRange: 5,
                energy: 100
            }
        };

        // Inventory and equipment - Enhanced structure supporting all item types
        this.inventory = {
            rods: [
                { 
                    id: 'bamboo_rod', 
                    name: 'Bamboo Rod', 
                    rarity: 1,
                    owned: true, 
                    equipped: true, 
                    condition: 100,
                    durability: 100,
                    stats: { 
                        castAccuracy: 5,
                        tensionStability: 8,
                        rareFishChance: 2,
                        castingRange: 10,
                        reelSpeed: 5,
                        struggleResistance: 3
                    },
                    description: 'Traditional bamboo rod for beginners',
                    unlockLevel: 1
                }
            ],
            lures: [
                { 
                    id: 'basic_spinner', 
                    name: 'Basic Spinner', 
                    type: 'spinner',
                    rarity: 1,
                    owned: true, 
                    equipped: true, 
                    quantity: 5,
                    condition: 100,
                    durability: 100,
                    stats: { 
                        biteRate: 20,
                        lureSuccess: 15,
                        lureDurability: 5,
                        lurePrecision: 5
                    },
                    description: 'Simple spinning lure for beginners',
                    unlockLevel: 1
                }
            ],
            bait: [],
            boats: [
                {
                    id: 'rowboat',
                    name: 'Rowboat',
                    rarity: 1,
                    owned: true,
                    equipped: true,
                    condition: 100,
                    durability: 100,
                    stats: {
                        craftingEfficiency: 5,
                        autoFishingYield: 8,
                        fishDetection: 3,
                        hotspotStability: 10,
                        companionSlotCapacity: 1,
                        autoFishingEfficiency: 5,
                        boatDurability: 15,
                        fishtankStorage: 10
                    },
                    description: 'Basic wooden rowboat',
                    unlockLevel: 1
                }
            ],
            upgrades: [],
            fish: [
                // Sample fish cards for testing crafting
                { id: 'minnow', name: 'Minnow', rarity: 1, quantity: 5, owned: true },
                { id: 'perch', name: 'Perch', rarity: 1, quantity: 4, owned: true },
                { id: 'trout', name: 'Trout', rarity: 2, quantity: 3, owned: true },
                { id: 'pike', name: 'Pike', rarity: 3, quantity: 2, owned: true },
                { id: 'salmon', name: 'Salmon', rarity: 3, quantity: 2, owned: true },
                { id: 'sardine', name: 'Sardine', rarity: 1, quantity: 6, owned: true },
                { id: 'bass', name: 'Bass', rarity: 2, quantity: 4, owned: true },
                { id: 'catfish', name: 'Catfish', rarity: 2, quantity: 3, owned: true }
            ],
            consumables: [],
            materials: []
        };

        // Game settings
        this.settings = {
            audio: {
                masterVolume: 1.0,
                musicVolume: 0.8,
                sfxVolume: 1.0,
                muted: false
            },
            graphics: {
                quality: 'high',
                fullscreen: false,
                vsync: true
            },
            gameplay: {
                autoSave: true,
                difficulty: 'normal',
                showTutorials: true
            }
        };

        // Game world state
        this.world = {
            currentLocation: 'lake_beginner',
            timeOfDay: 'morning', // morning, afternoon, evening, night
            weather: 'sunny', // sunny, cloudy, rainy, stormy
            season: 'spring', // spring, summer, autumn, winter
            gameTime: 0, // in-game minutes
            realPlayTime: 0 // real-world milliseconds
        };

        // Locations and their states
        this.locations = {
            lake_beginner: {
                name: 'Beginner Lake',
                unlocked: true,
                visited: false,
                fishPopulation: this.generateFishPopulation('lake_beginner'),
                weather: 'sunny',
                pollution: 0
            }
        };

        // Shop and economy
        this.shop = {
            rods: [
                { id: 'carbon_rod', name: 'Carbon Rod', price: 50, unlocked: true, description: 'Lighter and stronger' },
                { id: 'pro_rod', name: 'Pro Rod', price: 150, unlocked: false, description: 'Professional grade equipment' }
            ],
            lures: [
                { id: 'spoon_lure', name: 'Spoon Lure', price: 15, unlocked: true, description: 'Attracts medium fish' },
                { id: 'fly_lure', name: 'Fly Lure', price: 25, unlocked: true, description: 'Perfect for surface fishing' },
                { id: 'deep_diver', name: 'Deep Diver', price: 40, unlocked: false, description: 'Reaches deep waters' }
            ],
            upgrades: [
                { id: 'line_strength', name: 'Line Strength', price: 30, unlocked: true, description: 'Stronger fishing line' },
                { id: 'reel_speed', name: 'Reel Speed', price: 45, unlocked: true, description: 'Faster reeling action' },
                { id: 'cast_distance', name: 'Cast Distance', price: 60, unlocked: false, description: 'Throw lures further' }
            ]
        };

        // Current session data
        this.session = {
            startTime: Date.now(),
            currentScene: 'MenuScene',
            lastSave: Date.now(),
            autoSaveInterval: 30000, // 30 seconds
            isDirty: false, // needs saving
            totalSaves: 0,
            sessionStats: {
                fishCaught: 0,
                coinsEarned: 0,
                experienceGained: 0,
                castsAttempted: 0,
                successfulCasts: 0,
                itemsCrafted: 0,
                timeSpentFishing: 0,
                locationsVisited: new Set(),
                achievementsUnlocked: []
            }
        };

        // Scene states for persistence
        this.sceneStates = {};

        // Event listeners for state changes
        this.listeners = {};
    }

    // Event system for state changes
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    // Player methods
    addExperience(amount) {
        this.player.experience += amount;
        this.session.sessionStats.experienceGained += amount;
        this.markDirty();
        
        // Check for level up
        while (this.player.experience >= this.player.experienceToNext) {
            this.levelUp();
        }
        
        this.emit('experienceGained', { amount, total: this.player.experience });
    }

    levelUp() {
        this.player.experience -= this.player.experienceToNext;
        this.player.level++;
        this.player.experienceToNext = Math.floor(this.player.experienceToNext * 1.2);
        
        this.emit('levelUp', { level: this.player.level });
    }

    addMoney(amount) {
        this.player.money += amount;
        if (amount > 0) {
            this.session.sessionStats.coinsEarned += amount;
        }
        this.markDirty();
        this.emit('moneyChanged', { amount, total: this.player.money });
    }

    spendMoney(amount) {
        if (this.player.money >= amount) {
            this.player.money -= amount;
            this.markDirty();
            this.emit('moneyChanged', { amount: -amount, total: this.player.money });
            return true;
        }
        return false;
    }

    spendEnergy(amount) {
        if (this.player.energy >= amount) {
            this.player.energy -= amount;
            this.markDirty();
            this.emit('energyChanged', { amount: -amount, total: this.player.energy });
            return true;
        }
        return false;
    }

    addEnergy(amount) {
        const maxEnergy = this.getPlayerAttribute('energy') || 100;
        this.player.energy = Math.min(this.player.energy + amount, maxEnergy);
        this.markDirty();
        this.emit('energyChanged', { amount, total: this.player.energy });
    }

    advanceTime(hours) {
        this.world.gameTime += hours * 60; // Convert hours to minutes
        
        // Update time of day
        const hour = Math.floor(this.world.gameTime / 60) % 24;
        if (hour >= 6 && hour < 12) this.world.timeOfDay = 'morning';
        else if (hour >= 12 && hour < 18) this.world.timeOfDay = 'afternoon';
        else if (hour >= 18 && hour < 22) this.world.timeOfDay = 'evening';
        else this.world.timeOfDay = 'night';
        
        this.markDirty();
        this.emit('timeAdvanced', { 
            hours, 
            gameTime: this.world.gameTime, 
            timeOfDay: this.world.timeOfDay 
        });
    }

    // Inventory methods
    addItem(category, item) {
        if (!this.inventory[category]) {
            this.inventory[category] = [];
        }
        
        // Check if item already exists (for stackable items)
        const existing = this.inventory[category].find(i => i.id === item.id);
        if (existing && item.quantity) {
            existing.quantity += item.quantity;
        } else {
            this.inventory[category].push(item);
        }
        
        this.markDirty();
        this.emit('itemAdded', { category, item });
    }

    removeItem(category, itemId, quantity = 1) {
        const items = this.inventory[category];
        const itemIndex = items.findIndex(i => i.id === itemId);
        
        if (itemIndex !== -1) {
            const item = items[itemIndex];
            if (item.quantity && item.quantity > quantity) {
                item.quantity -= quantity;
            } else {
                items.splice(itemIndex, 1);
            }
            
            this.markDirty();
            this.emit('itemRemoved', { category, itemId, quantity });
            return true;
        }
        return false;
    }

    equipItem(category, itemId) {
        const items = this.inventory[category];
        
        // Unequip current item
        items.forEach(item => item.equipped = false);
        
        // Equip new item
        const item = items.find(i => i.id === itemId);
        if (item) {
            item.equipped = true;
            this.markDirty();
            this.emit('itemEquipped', { category, item });
            return true;
        }
        return false;
    }

    getEquippedItem(category) {
        if (!this.inventory[category]) return null;
        return this.inventory[category].find(item => item.equipped);
    }

    // Fish catching
    catchFish(fishData) {
        // Update basic statistics
        this.player.fishCaught++;
        this.player.statistics.fishCaught++;
        this.player.statistics.fishingAttempts = (this.player.statistics.fishingAttempts || 0) + 1;
        this.player.statistics.totalValue += fishData.coinValue || fishData.value || 50;
        
        // Update session statistics
        this.session.sessionStats.fishCaught++;
        this.session.sessionStats.successfulCasts++;
        
        // Update biggest fish
        if (!this.player.statistics.biggestFish || fishData.weight > this.player.statistics.biggestFish.weight) {
            this.player.statistics.biggestFish = { ...fishData };
        }
        
        // Update rarest fish
        if (!this.player.statistics.rarest || fishData.rarity > this.player.statistics.rarest.rarity) {
            this.player.statistics.rarest = { ...fishData };
        }
        
        // Track fish species collection
        if (!this.player.statistics.speciesCaught) {
            this.player.statistics.speciesCaught = {};
        }
        this.player.statistics.speciesCaught[fishData.id] = (this.player.statistics.speciesCaught[fishData.id] || 0) + 1;
        
        // Add to inventory with proper fish card format
        const fishCard = {
            ...fishData,
            quantity: 1,
            catchTime: Date.now(),
            catchLocation: this.world.currentLocation || 'Unknown'
        };
        this.addItem('fish', fishCard);
        
        // Add money and experience
        const coinValue = fishData.coinValue || fishData.value || 50;
        const expValue = fishData.experienceValue || fishData.experience || 10;
        this.addMoney(coinValue);
        this.addExperience(expValue);
        
        // Check for progression milestones
        this.checkProgressionMilestones(fishData);
        
        this.markDirty();
        this.emit('fishCaught', {
            fish: fishData,
            rewards: { coins: coinValue, experience: expValue },
            milestones: this.getRecentMilestones()
        });
    }

    // Simplified fish adding method
    addFish(fishData) {
        this.catchFish(fishData);
    }

    // Shop methods
    buyItem(category, itemId) {
        const shopItem = this.shop[category].find(item => item.id === itemId);
        if (!shopItem || !shopItem.unlocked) return false;
        
        if (this.spendMoney(shopItem.price)) {
            const item = { ...shopItem, owned: true };
            delete item.price;
            delete item.unlocked;
            
            this.addItem(category, item);
            this.emit('itemPurchased', { category, item });
            return true;
        }
        return false;
    }

    // World state methods
    setLocation(locationId) {
        if (this.locations[locationId] && this.locations[locationId].unlocked) {
            this.world.currentLocation = locationId;
            this.locations[locationId].visited = true;
            this.session.sessionStats.locationsVisited.add(locationId);
            this.markDirty();
            this.emit('locationChanged', { locationId });
            return true;
        }
        return false;
    }

    // Audio management
    initializeAudio(scene) {
        if (!this.audioManager) {
            this.audioManager = new AudioManager(scene);
            this.audioManager.initialize();
            
            // Apply current audio settings
            const audioSettings = this.settingsManager.get('audio');
            if (audioSettings) {
                Object.entries(audioSettings).forEach(([key, value]) => {
                    this.audioManager.updateAudioSettings(key, value);
                });
            }
            
            console.log('GameState: Audio manager initialized');
        }
        return this.audioManager;
    }

    setSceneAudio(sceneKey) {
        if (this.audioManager) {
            this.audioManager.setSceneAudio(sceneKey);
        }
    }

    // Session tracking methods
    trackCastAttempt() {
        this.player.statistics.totalCasts++;
        this.session.sessionStats.castsAttempted++;
        this.markDirty();
    }

    trackCraftingActivity(itemId) {
        this.session.sessionStats.itemsCrafted++;
        this.markDirty();
    }

    trackFishingTime(minutes) {
        this.session.sessionStats.timeSpentFishing += minutes;
        this.markDirty();
    }

    getSessionSummary() {
        const sessionDuration = Date.now() - this.session.startTime;
        const sessionHours = Math.round(sessionDuration / (1000 * 60 * 60) * 100) / 100;
        
        return {
            duration: sessionDuration,
            durationHours: sessionHours,
            stats: {
                ...this.session.sessionStats,
                locationsVisited: Array.from(this.session.sessionStats.locationsVisited)
            },
            efficiency: {
                fishPerHour: sessionHours > 0 ? Math.round(this.session.sessionStats.fishCaught / sessionHours * 100) / 100 : 0,
                coinsPerHour: sessionHours > 0 ? Math.round(this.session.sessionStats.coinsEarned / sessionHours * 100) / 100 : 0,
                castSuccessRate: this.session.sessionStats.castsAttempted > 0 ? 
                    Math.round(this.session.sessionStats.successfulCasts / this.session.sessionStats.castsAttempted * 100) : 0
            }
        };
    }

    updateTime(deltaTime) {
        this.world.realPlayTime += deltaTime;
        this.player.totalPlayTime += deltaTime;
        
        // Update in-game time (1 real minute = 1 game hour)
        const gameMinutesPerRealMinute = 60;
        this.world.gameTime += (deltaTime / 60000) * gameMinutesPerRealMinute;
        
        // Update time of day
        const hour = Math.floor(this.world.gameTime / 60) % 24;
        if (hour >= 6 && hour < 12) this.world.timeOfDay = 'morning';
        else if (hour >= 12 && hour < 18) this.world.timeOfDay = 'afternoon';
        else if (hour >= 18 && hour < 22) this.world.timeOfDay = 'evening';
        else this.world.timeOfDay = 'night';
        
        this.emit('timeUpdated', { 
            gameTime: this.world.gameTime, 
            timeOfDay: this.world.timeOfDay 
        });
    }

    checkProgressionMilestones(fishData) {
        this.recentMilestones = [];
        
        // Level progression milestone
        const oldLevel = this.player.level;
        this.updatePlayerLevel();
        if (this.player.level > oldLevel) {
            this.recentMilestones.push({
                type: 'level_up',
                message: `Level Up! You are now level ${this.player.level}`,
                rewards: { coins: this.player.level * 100, gems: Math.floor(this.player.level / 5) }
            });
        }
        
        // Fish collection milestones
        const uniqueSpecies = Object.keys(this.player.statistics.speciesCaught || {}).length;
        const milestoneThresholds = [5, 10, 25, 50, 100];
        
        for (const threshold of milestoneThresholds) {
            if (uniqueSpecies === threshold) {
                this.recentMilestones.push({
                    type: 'collection_milestone',
                    message: `Collection Milestone! ${threshold} unique species caught`,
                    rewards: { coins: threshold * 50, gems: Math.floor(threshold / 10) }
                });
                break;
            }
        }
        
        // Rarity milestones
        if (fishData.rarity >= 8 && !this.player.statistics.firstLegendary) {
            this.player.statistics.firstLegendary = true;
            this.recentMilestones.push({
                type: 'first_legendary',
                message: `First Legendary Fish! Caught ${fishData.name}`,
                rewards: { coins: 1000, gems: 5 }
            });
        }
        
        // Apply milestone rewards
        this.recentMilestones.forEach(milestone => {
            if (milestone.rewards.coins) this.addMoney(milestone.rewards.coins);
            if (milestone.rewards.gems) this.addGems(milestone.rewards.gems);
        });
    }

    updatePlayerLevel() {
        // Calculate level based on experience
        const baseExp = 100;
        const expMultiplier = 1.5;
        let requiredExp = baseExp;
        let level = 1;
        
        while (this.player.experience >= requiredExp && level < 50) {
            level++;
            requiredExp = Math.floor(baseExp * Math.pow(expMultiplier, level - 1));
        }
        
        this.player.level = level;
        this.player.experienceToNext = requiredExp - this.player.experience;
    }

    getRecentMilestones() {
        return this.recentMilestones || [];
    }

    addGems(amount) {
        this.player.gems = (this.player.gems || 0) + amount;
        this.markDirty();
        console.log(`GameState: Added ${amount} gems (total: ${this.player.gems})`);
    }

    // Save/Load methods
    markDirty() {
        this.session.isDirty = true;
    }

    save() {
        const saveData = {
            player: this.player,
            inventory: this.inventory,
            world: this.world,
            locations: this.locations,
            shop: this.shop,
            sceneStates: this.sceneStates,
            crafting: this.craftingManager ? this.craftingManager.save() : null,
            session: {
                ...this.session,
                totalSaves: (this.session.totalSaves || 0) + 1,
                lastSave: Date.now()
            },
            gameStats: this.getGameStats(),
            version: '1.0.0',
            timestamp: Date.now()
        };
        
        try {
            // Save main game data
            localStorage.setItem('luxuryAngler_save', JSON.stringify(saveData));
            
            // Save backup (keep last 3 saves)
            this.saveBackup(saveData);
            
            // Update session info
            this.session.lastSave = Date.now();
            this.session.isDirty = false;
            this.session.totalSaves = saveData.session.totalSaves;
            
            console.log(`GameState: Game saved successfully (Save #${this.session.totalSaves})`);
            this.emit('gameSaved', { 
                timestamp: this.session.lastSave,
                saveNumber: this.session.totalSaves,
                dataSize: JSON.stringify(saveData).length
            });
            return true;
        } catch (error) {
            console.error('GameState: Failed to save game:', error);
            this.emit('saveError', { error: error.message });
            return false;
        }
    }

    saveBackup(saveData) {
        try {
            // Get existing backups
            const backups = JSON.parse(localStorage.getItem('luxuryAngler_backups') || '[]');
            
            // Add current save to backups
            backups.unshift({
                ...saveData,
                backupTimestamp: Date.now()
            });
            
            // Keep only last 3 backups
            if (backups.length > 3) {
                backups.splice(3);
            }
            
            localStorage.setItem('luxuryAngler_backups', JSON.stringify(backups));
            console.log(`GameState: Backup saved (${backups.length} backups total)`);
        } catch (error) {
            console.warn('GameState: Failed to save backup:', error);
        }
    }

    loadFromStorage() {
        try {
            const saveData = localStorage.getItem('luxuryAngler_save');
            if (saveData) {
                const data = JSON.parse(saveData);
                
                // Validate save data version
                if (!this.validateSaveData(data)) {
                    console.warn('GameState: Save data validation failed, attempting migration');
                    this.migrateSaveData(data);
                }
                
                // Merge saved data with current state
                this.player = { ...this.player, ...data.player };
                this.inventory = { ...this.inventory, ...data.inventory };
                this.world = { ...this.world, ...data.world };
                this.locations = { ...this.locations, ...data.locations };
                this.shop = { ...this.shop, ...data.shop };
                this.sceneStates = { ...this.sceneStates, ...(data.sceneStates || {}) };
                this.session = { ...this.session, ...(data.session || {}) };
                
                // Load crafting data
                if (this.craftingManager && data.crafting) {
                    this.craftingManager.load(data.crafting);
                }
                
                // Calculate play time since last save
                const timeSinceLastSave = Date.now() - (data.timestamp || Date.now());
                console.log(`GameState: Game loaded successfully (${Math.round(timeSinceLastSave / 1000)}s since last save)`);
                
                this.emit('gameLoaded', {
                    ...data,
                    timeSinceLastSave,
                    loadTimestamp: Date.now()
                });
                return true;
            }
        } catch (error) {
            console.error('GameState: Failed to load game:', error);
            this.emit('loadError', { error: error.message });
            
            // Try to load from backup
            return this.loadFromBackup();
        }
        return false;
    }

    loadFromBackup(backupIndex = 0) {
        try {
            const backups = JSON.parse(localStorage.getItem('luxuryAngler_backups') || '[]');
            if (backups.length > backupIndex) {
                const backup = backups[backupIndex];
                console.log(`GameState: Loading from backup ${backupIndex + 1}/${backups.length}`);
                
                // Use the backup data
                this.player = { ...this.player, ...backup.player };
                this.inventory = { ...this.inventory, ...backup.inventory };
                this.world = { ...this.world, ...backup.world };
                this.locations = { ...this.locations, ...backup.locations };
                this.shop = { ...this.shop, ...backup.shop };
                this.sceneStates = { ...this.sceneStates, ...(backup.sceneStates || {}) };
                
                if (this.craftingManager && backup.crafting) {
                    this.craftingManager.load(backup.crafting);
                }
                
                this.emit('gameLoadedFromBackup', { 
                    backupIndex, 
                    backupTimestamp: backup.backupTimestamp 
                });
                return true;
            }
        } catch (error) {
            console.error('GameState: Failed to load from backup:', error);
        }
        return false;
    }

    validateSaveData(data) {
        // Check for required fields
        const requiredFields = ['player', 'inventory', 'world', 'version'];
        for (const field of requiredFields) {
            if (!data[field]) {
                console.warn(`GameState: Missing required field: ${field}`);
                return false;
            }
        }
        
        // Check version compatibility
        if (data.version !== '1.0.0') {
            console.warn(`GameState: Version mismatch: ${data.version} vs 1.0.0`);
            return false;
        }
        
        return true;
    }

    migrateSaveData(data) {
        // Handle save data migration for different versions
        console.log('GameState: Migrating save data...');
        
        // Add missing fields with defaults
        if (!data.session) {
            data.session = {
                startTime: Date.now(),
                currentScene: 'MenuScene',
                lastSave: data.timestamp || Date.now(),
                autoSaveInterval: 30000,
                isDirty: false,
                totalSaves: 1
            };
        }
        
        // Ensure player statistics exist
        if (!data.player.statistics) {
            data.player.statistics = {
                totalCasts: 0,
                successfulCasts: 0,
                fishCaught: data.player.fishCaught || 0,
                biggestFish: null,
                rarest: null,
                totalValue: 0
            };
        }
        
        console.log('GameState: Save data migration completed');
    }

    // Save management utilities
    getSaveInfo() {
        try {
            const saveData = localStorage.getItem('luxuryAngler_save');
            const backups = JSON.parse(localStorage.getItem('luxuryAngler_backups') || '[]');
            
            if (saveData) {
                const data = JSON.parse(saveData);
                return {
                    exists: true,
                    timestamp: data.timestamp,
                    version: data.version,
                    playerLevel: data.player?.level || 1,
                    playerName: data.player?.name || 'Angler',
                    totalPlayTime: data.player?.totalPlayTime || 0,
                    fishCaught: data.player?.fishCaught || 0,
                    saveNumber: data.session?.totalSaves || 1,
                    dataSize: JSON.stringify(data).length,
                    backupCount: backups.length
                };
            }
            
            return {
                exists: false,
                backupCount: backups.length
            };
        } catch (error) {
            console.error('GameState: Failed to get save info:', error);
            return { exists: false, error: error.message };
        }
    }

    exportSave() {
        try {
            const saveData = localStorage.getItem('luxuryAngler_save');
            if (saveData) {
                const data = JSON.parse(saveData);
                return JSON.stringify({
                    ...data,
                    exportTimestamp: Date.now(),
                    exportVersion: '1.0.0'
                }, null, 2);
            }
            return null;
        } catch (error) {
            console.error('GameState: Failed to export save:', error);
            return null;
        }
    }

    importSave(saveJson) {
        try {
            const data = JSON.parse(saveJson);
            
            // Validate imported data
            if (!this.validateSaveData(data)) {
                throw new Error('Invalid save data format');
            }
            
            // Create backup of current save before importing
            const currentSave = localStorage.getItem('luxuryAngler_save');
            if (currentSave) {
                this.saveBackup(JSON.parse(currentSave));
            }
            
            // Import the new save
            localStorage.setItem('luxuryAngler_save', JSON.stringify(data));
            this.loadFromStorage();
            
            console.log('GameState: Save imported successfully');
            this.emit('saveImported', data);
            return true;
        } catch (error) {
            console.error('GameState: Failed to import save:', error);
            this.emit('importError', { error: error.message });
            return false;
        }
    }

    deleteSave() {
        try {
            localStorage.removeItem('luxuryAngler_save');
            localStorage.removeItem('luxuryAngler_backups');
            console.log('GameState: Save data deleted');
            this.emit('saveDeleted');
            return true;
        } catch (error) {
            console.error('GameState: Failed to delete save:', error);
            return false;
        }
    }

    getStorageUsage() {
        try {
            const saveData = localStorage.getItem('luxuryAngler_save');
            const backups = localStorage.getItem('luxuryAngler_backups');
            const settings = localStorage.getItem('luxuryAngler_settings');
            const inventory = localStorage.getItem('luxuryAngler_inventory');
            const inputBindings = localStorage.getItem('inputBindings');
            
            const usage = {
                save: saveData ? saveData.length : 0,
                backups: backups ? backups.length : 0,
                settings: settings ? settings.length : 0,
                inventory: inventory ? inventory.length : 0,
                inputBindings: inputBindings ? inputBindings.length : 0
            };
            
            usage.total = Object.values(usage).reduce((sum, size) => sum + size, 0);
            usage.totalKB = Math.round(usage.total / 1024 * 100) / 100;
            
            return usage;
        } catch (error) {
            console.error('GameState: Failed to calculate storage usage:', error);
            return { total: 0, totalKB: 0, error: error.message };
        }
    }

    reset() {
        this.initializeState();
        this.deleteSave();
        this.settingsManager?.resetToDefaults();
        this.emit('gameReset');
        console.log('GameState: Game reset to initial state');
    }

    // Auto-save functionality
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(() => {
            if (this.session.isDirty && this.settings.gameplay.autoSave) {
                this.save();
            }
        }, this.session.autoSaveInterval);
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    // Utility methods
    generateFishPopulation(locationId) {
        // Generate fish population based on location
        const populations = {
            lake_beginner: [
                { species: 'bass', count: 20, rarity: 1 },
                { species: 'trout', count: 15, rarity: 2 },
                { species: 'pike', count: 5, rarity: 3 }
            ]
        };
        
        return populations[locationId] || [];
    }

    getGameStats() {
        return {
            player: this.player,
            statistics: this.player.statistics,
            playTime: this.player.totalPlayTime,
            currentLocation: this.world.currentLocation,
            timeOfDay: this.world.timeOfDay,
            weather: this.world.weather
        };
    }

    // Scene state management
    getSceneStates() {
        return this.sceneStates;
    }

    setSceneStates(states) {
        this.sceneStates = states;
        this.markDirty();
    }

    getSceneState(sceneKey) {
        return this.sceneStates[sceneKey] || {};
    }

    setSceneState(sceneKey, state) {
        this.sceneStates[sceneKey] = state;
        this.markDirty();
    }

    clearSceneState(sceneKey) {
        delete this.sceneStates[sceneKey];
        this.markDirty();
    }

    // Player attribute methods
    getPlayerAttribute(attributeId) {
        // First check if player has the attribute
        if (this.player.attributes && this.player.attributes[attributeId] !== undefined) {
            return this.player.attributes[attributeId];
        }
        
        // Fallback to data loader for base values
        const attributeData = gameDataLoader.getPlayerAttribute(attributeId);
        if (attributeData) {
            return attributeData.baseValue || 5;
        }
        
        // Ultimate fallback
        return 5;
    }

    setPlayerAttribute(attributeId, value) {
        if (!this.player.attributes) {
            this.player.attributes = {};
        }
        this.player.attributes[attributeId] = value;
        this.markDirty();
    }

    addPlayerAttribute(attributeId, amount) {
        const currentValue = this.getPlayerAttribute(attributeId);
        this.setPlayerAttribute(attributeId, currentValue + amount);
    }

    // Boat attribute methods
    getBoatAttribute(attributeId) {
        // Get equipped boat or use default values
        const equippedBoat = this.getEquippedItem('boats');
        if (equippedBoat && equippedBoat.stats && equippedBoat.stats[attributeId] !== undefined) {
            return equippedBoat.stats[attributeId];
        }
        
        // Default boat attributes
        const defaultBoatAttributes = {
            fishtankStorage: 10,
            speed: 5,
            stability: 5,
            fuelEfficiency: 5
        };
        
        return defaultBoatAttributes[attributeId] || 5;
    }

    // Singleton getter
    static getInstance() {
        if (!GameState.instance) {
            new GameState();
        }
        return GameState.instance;
    }
}

export default GameState; 