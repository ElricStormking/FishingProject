import { gameDataLoader } from './DataLoader.js';
import InventoryManager from './InventoryManager.js';
import CraftingManager from './CraftingManager.js';
import { SettingsManager } from './SettingsManager.js';
import { AudioManager } from './AudioManager.js';
import { WeatherManager } from './WeatherManager.js';
import { PlayerProgression } from './PlayerProgression.js';
import FishDatabase from './FishDatabase.js';
import { LocationManager } from './LocationManager.js';

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
        
        // Time & Weather managers will be initialized when scene is available
        this.timeManager = null;
        this.weatherManager = null;
        
        // Initialize player progression system
        this.playerProgression = new PlayerProgression(this);
        
        // Initialize progression data (achievements, skills, etc.)
        this.playerProgression.initializeProgression();
        
        // Initialize inventory manager after state is set up
        this.inventoryManager = new InventoryManager(this);
        
        // Initialize crafting manager
        this.craftingManager = new CraftingManager(this, this.inventoryManager);
        
        // Initialize FishDatabase  
        this.fishDatabase = new FishDatabase(this);
        
        // Initialize LocationManager
        this.locationManager = new LocationManager(this);
        
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
                    equipSlot: 'boat',
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
                { id: 'trout', name: 'Trout', rarity: 2, quantity: 5, owned: true },
                { id: 'pike', name: 'Pike', rarity: 3, quantity: 2, owned: true },
                { id: 'salmon', name: 'Salmon', rarity: 3, quantity: 2, owned: true },
                { id: 'sardine', name: 'Sardine', rarity: 1, quantity: 6, owned: true },
                { id: 'bass', name: 'Bass', rarity: 2, quantity: 4, owned: true },
                { id: 'catfish', name: 'Catfish', rarity: 2, quantity: 3, owned: true }
            ],
            consumables: [],
            materials: [],
            clothing: [],
            bikini_assistants: []
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
        try {
            if (this.listeners[event]) {
                this.listeners[event].forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error(`GameState: Error in event callback for ${event}:`, error);
                        console.error('GameState: Data that caused error:', data);
                        console.error('GameState: Callback:', callback.toString().substring(0, 100));
                    }
                });
            }
        } catch (error) {
            console.error(`GameState: Error emitting event ${event}:`, error);
        }
    }

    // Player methods
    addExperience(amount, source = 'unknown', details = {}) {
        // Use the comprehensive progression system
        return this.playerProgression.addExperience(amount, source, details);
    }

    levelUp() {
        // This is now handled automatically by PlayerProgression
        // Keep this method for backward compatibility
        console.log('GameState: levelUp() called - now handled by PlayerProgression system');
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
    /**
     * Process fish catch
     * @param {object} fishData - Fish information including fishId, weight, etc.
     * @param {boolean} isPerfectCatch - Whether it was a perfect catch
     */
    catchFish(fishData, isPerfectCatch = false) {
        console.log('GameState: Catching fish:', fishData);
        
        // Validate input fish data
        if (!fishData || typeof fishData !== 'object') {
            console.error('GameState: Invalid fish data provided:', fishData);
            return {
                success: false,
                error: 'Invalid fish data',
                fish: null,
                weight: 0,
                rewards: { coins: 0, experience: 0 },
                isFirstCatch: false,
                isRecord: false,
                isPerfectCatch: false
            };
        }
        
        // Ensure fish data has required properties with defaults
        const safeFishData = {
            fishId: fishData.fishId || 'unknown',
            name: fishData.name || 'Unknown Fish',
            weight: Math.max(0.1, fishData.weight || 2.5),
            rarity: Math.min(Math.max(1, fishData.rarity || 1), 6),
            value: Math.max(1, fishData.value || 100),
            isPerfectCatch: !!isPerfectCatch,
            ...fishData // Spread original data but keep safe defaults for essential props
        };
        
        console.log('GameState: Processing safe fish data:', safeFishData);
        
        let catchResult = null;
        
        // Use FishDatabase if available
        if (this.fishDatabase && safeFishData.fishId && safeFishData.fishId !== 'unknown') {
            try {
                // Record catch in database
                catchResult = this.fishDatabase.recordCatch(safeFishData.fishId, safeFishData.weight);
                
                if (catchResult && catchResult.fish) {
                    const fish = catchResult.fish;
                    
                    try {
                        const multiplier = this.fishDatabase.getFishValueMultiplier(fish, isPerfectCatch);
                        
                        // Calculate rewards with safe defaults
                        const coinReward = Math.floor((fish.coinValue || safeFishData.value) * (multiplier || 1));
                        const expReward = Math.floor((fish.experienceValue || (safeFishData.rarity * 10)) * (multiplier || 1));
                        
                        // Award coins and experience
                        this.player.money += coinReward;
                        
                        // Add experience through PlayerProgression with error handling
                        if (this.playerProgression && this.playerProgression.addExperience) {
                            try {
                                const fishRarity = Math.min(Math.max(1, fish.rarity || safeFishData.rarity), 6);
                                const rarityMultiplier = this.playerProgression.getRarityMultiplier ? 
                                    this.playerProgression.getRarityMultiplier(fishRarity) : 1.0;
                                
                                this.playerProgression.addExperience(expReward * rarityMultiplier, 'fishCaught', {
                                    fishId: fish.id || safeFishData.fishId,
                                    name: fish.name || safeFishData.name,
                                    rarity: fishRarity,
                                    weight: catchResult.weight || safeFishData.weight,
                                    value: coinReward
                                });
                                
                                // Award bonus for first catch
                                if (catchResult.isFirstCatch) {
                                    this.playerProgression.addExperience(50, 'firstTimeSpecies', {
                                        species: fish.name || safeFishData.name
                                    });
                                }
                                
                            } catch (progressionError) {
                                console.error('GameState: Error adding experience through PlayerProgression:', progressionError);
                                // Continue execution but log the error
                            }
                        } else {
                            console.warn('GameState: PlayerProgression not available for experience calculation');
                        }
                        
                        // Create properly structured fish card for inventory
                        const fishCard = {
                            id: `fish_${fish.id || safeFishData.fishId}_${Date.now()}`,
                            fishId: fish.id || safeFishData.fishId,
                            name: fish.name || safeFishData.name,
                            rarity: Math.min(Math.max(1, fish.rarity || safeFishData.rarity), 6),
                            weight: catchResult.weight || safeFishData.weight,
                            value: coinReward,
                            description: fish.description || `A ${fish.name || safeFishData.name} weighing ${(catchResult.weight || safeFishData.weight).toFixed(1)}kg`,
                            caughtAt: new Date().toISOString(),
                            quantity: 1,
                            owned: true
                        };
                        
                        console.log('GameState: Adding fish card to inventory:', fishCard);
                        
                        // Add to inventory with error handling
                        try {
                            if (this.inventoryManager && this.inventoryManager.addItem) {
                                const addResult = this.inventoryManager.addItem('fish', fishCard);
                                if (!addResult) {
                                    console.error('GameState: Failed to add fish card to inventory');
                                }
                            } else {
                                console.error('GameState: InventoryManager not available for adding fish');
                            }
                        } catch (inventoryError) {
                            console.error('GameState: Error adding fish to inventory:', inventoryError);
                        }
                        
                        console.log('GameState: Fish caught successfully:', {
                            fish: fish.name || safeFishData.name,
                            weight: catchResult.weight || safeFishData.weight,
                            coins: coinReward,
                            exp: expReward,
                            isFirstCatch: catchResult.isFirstCatch,
                            isRecord: catchResult.isRecord
                        });
                        
                        this.markDirty();
                        return {
                            success: true,
                            fish: fish,
                            weight: catchResult.weight || safeFishData.weight,
                            rewards: {
                                coins: coinReward,
                                experience: expReward
                            },
                            isFirstCatch: !!catchResult.isFirstCatch,
                            isRecord: !!catchResult.isRecord,
                            isPerfectCatch: !!isPerfectCatch
                        };
                        
                    } catch (processingError) {
                        console.error('GameState: Error processing fish database result:', processingError);
                        // Fall through to legacy behavior
                    }
                } else {
                    console.warn('GameState: Fish database did not return valid catch result');
                }
            } catch (databaseError) {
                console.error('GameState: Error with fish database:', databaseError);
                // Fall through to legacy behavior
            }
        }
        
        console.log('GameState: Using legacy fish catching behavior');
        
        // Fallback to legacy behavior if FishDatabase not available or failed
        try {
            this.player.fishCaught = (this.player.fishCaught || 0) + 1;
            
            // Legacy fish data structure with proper validation
            const fish = {
                id: `fish_${Date.now()}`,
                fishId: safeFishData.fishId,
                name: safeFishData.name,
                rarity: safeFishData.rarity,
                weight: safeFishData.weight,
                value: safeFishData.value,
                description: `A ${safeFishData.name} weighing ${safeFishData.weight.toFixed(1)}kg`,
                caughtAt: new Date().toISOString(),
                quantity: 1,
                owned: true
            };
            
            // Add to inventory with error handling
            try {
                if (this.inventoryManager && this.inventoryManager.addItem) {
                    const addResult = this.inventoryManager.addItem('fish', fish);
                    if (!addResult) {
                        console.error('GameState: Failed to add fish to inventory (legacy)');
                    }
                } else {
                    console.error('GameState: InventoryManager not available (legacy)');
                }
            } catch (inventoryError) {
                console.error('GameState: Error adding fish to inventory (legacy):', inventoryError);
            }
            
            // Award money and experience (legacy)
            this.player.money = (this.player.money || 0) + fish.value;
            
            if (this.playerProgression && this.playerProgression.addExperience) {
                try {
                    this.playerProgression.addExperience(Math.max(1, fish.value / 10), 'fishCaught', {
                        fishId: fish.fishId,
                        name: fish.name,
                        rarity: fish.rarity,
                        weight: fish.weight,
                        value: fish.value
                    });
                } catch (progressionError) {
                    console.error('GameState: Error adding experience (legacy):', progressionError);
                }
            }
            
            console.log('GameState: Fish caught (legacy):', fish);
            this.markDirty();
            
            return {
                success: true,
                fish: fish,
                weight: fish.weight,
                rewards: {
                    coins: fish.value,
                    experience: Math.max(1, fish.value / 10)
                },
                isFirstCatch: false,
                isRecord: false,
                isPerfectCatch: !!isPerfectCatch
            };
            
        } catch (legacyError) {
            console.error('GameState: Error in legacy fish catching:', legacyError);
            
            // Final fallback - just return a basic success result
            return {
                success: true,
                fish: safeFishData,
                weight: safeFishData.weight,
                rewards: {
                    coins: safeFishData.value,
                    experience: safeFishData.rarity * 5
                },
                isFirstCatch: false,
                isRecord: false,
                isPerfectCatch: !!isPerfectCatch
            };
        }
    }

    // Simplified fish adding method
    addFish(fishData) {
        this.catchFish(fishData);
    }

    // Shop methods
    canAccessShop() {
        // Shop is only available at Starting Port
        return this.player.currentLocation === 'Starting Port';
    }

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

    getAudioManager(scene) {
        // Initialize audio if not already done
        if (!this.audioManager) {
            return this.initializeAudio(scene);
        }
        return this.audioManager;
    }

    setSceneAudio(sceneKey) {
        if (this.audioManager) {
            this.audioManager.setSceneAudio(sceneKey);
        }
    }

    // Time & Weather management
    initializeTimeWeather(scene) {
        // Note: TimeManager and WeatherManager are now initialized in GameScene
        // This method is kept for compatibility but doesn't create managers
        console.log('GameState: Time & Weather initialization handled by GameScene');
    }

    setupTimeWeatherEvents() {
        if (this.timeManager) {
            this.timeManager.onTimeChange((currentTime, timeString, timePeriod) => {
                console.log(`Time period changed to ${timePeriod}`);
                this.emit('timePeriodChanged', { currentTime, timeString, timePeriod });
            });
            
            this.timeManager.onPeriodChange((oldPeriod, newPeriod, effects) => {
                console.log(`Time period changed: ${oldPeriod} → ${newPeriod}`);
                this.emit('timePeriodChanged', { oldPeriod, newPeriod, effects });
                
                // Update fish behavior based on time
                this.updateFishBehaviorForTime(effects);
            });
        }
        
        // Weather events will be handled when WeatherManager is available
        console.log('GameState: Time & Weather events setup (managers may not be ready yet)');
    }

    updateTimeWeather(deltaTime) {
        // Update time manager if available
        if (this.timeManager && this.timeManager.updateTime) {
            this.timeManager.updateTime();
        }
        
        // Update weather manager if available
        if (this.weatherManager && this.weatherManager.onTimeUpdate) {
            // WeatherManager updates are handled by TimeManager callbacks
        }
    }

    updateFishBehaviorForTime(timeEffects) {
        // Apply time-based modifiers to fish behavior
        // This will be used by fishing minigames
        this.currentTimeEffects = timeEffects;
        this.emit('fishBehaviorUpdated', { source: 'time', effects: timeEffects });
    }

    updateFishBehaviorForWeather(weatherEffects) {
        // Apply weather-based modifiers to fish behavior
        // This will be used by fishing minigames
        this.currentWeatherEffects = weatherEffects;
        this.emit('fishBehaviorUpdated', { source: 'weather', effects: weatherEffects });
    }

    onNewDay() {
        // Reset daily energy
        this.player.attributes.energy = 100;
        
        // Update shop inventory
        this.refreshShopInventory();
        
        // Reset daily achievements/bonuses
        this.resetDailyProgress();
        
        this.markDirty();
    }

    refreshShopInventory() {
        // Add logic to refresh shop items daily
        console.log('GameState: Shop inventory refreshed for new day');
    }

    resetDailyProgress() {
        // Reset any daily progress tracking
        console.log('GameState: Daily progress reset');
    }

    getCurrentTimeInfo() {
        if (this.timeManager && this.timeManager.getTimeString) {
            return {
                timeString: this.timeManager.getTimeString(),
                currentPeriod: this.timeManager.getCurrentPeriod(),
                currentTime: this.timeManager.currentTime
            };
        }
        return null;
    }

    getCurrentWeatherInfo() {
        if (this.weatherManager && this.weatherManager.getCurrentWeather) {
            return this.weatherManager.getCurrentWeather();
        }
        return null;
    }

    getFishingConditions() {
        const conditions = {
            time: this.timeManager ? this.timeManager.getFishActivityModifiers() : null,
            weather: this.weatherManager ? this.weatherManager.getWeatherEffects() : null,
            combined: {
                fishActivity: 1.0,
                biteRate: 1.0,
                rareChance: 1.0,
                visibility: 1.0,
                castAccuracy: 1.0,
                isOptimal: false
            }
        };
        
        // Combine time and weather effects
        if (conditions.time && conditions.weather) {
            conditions.combined = {
                fishActivity: conditions.time.activity * conditions.weather.fishActivity,
                biteRate: conditions.time.biteFast * conditions.weather.biteRate,
                rareChance: conditions.time.rareChance * (conditions.weather.rareChance || 1.0),
                visibility: Math.min(1.0, conditions.weather.lineVisibility || 1.0),
                castAccuracy: Math.min(1.0, conditions.weather.playerVisibility || 1.0),
                isOptimal: (conditions.time.activity >= 1.2 && conditions.weather.fishActivity >= 1.2)
            };
        } else if (conditions.time) {
            conditions.combined = {
                fishActivity: conditions.time.activity,
                biteRate: conditions.time.biteFast,
                rareChance: conditions.time.rareChance,
                visibility: 1.0,
                castAccuracy: 1.0,
                isOptimal: conditions.time.activity >= 1.2
            };
        } else if (conditions.weather) {
            conditions.combined = {
                fishActivity: conditions.weather.fishActivity,
                biteRate: conditions.weather.biteRate,
                rareChance: conditions.weather.rareChance || 1.0,
                visibility: conditions.weather.lineVisibility || 1.0,
                castAccuracy: conditions.weather.playerVisibility || 1.0,
                isOptimal: conditions.weather.fishActivity >= 1.2
            };
        }
        
        return conditions;
    }

    getWeatherForecast() {
        if (this.weatherManager && this.weatherManager.getForecast) {
            return this.weatherManager.getForecast();
        }
        return [];
    }

    getOptimalFishingTimes() {
        if (this.timeManager && this.timeManager.timePeriods) {
            // Return periods with high fish activity
            const optimalPeriods = [];
            Object.entries(this.timeManager.fishActivityModifiers).forEach(([period, modifiers]) => {
                if (modifiers.activity >= 1.2) {
                    optimalPeriods.push({
                        period: period,
                        name: this.timeManager.timePeriods[period]?.name || period,
                        activity: modifiers.activity,
                        rareChance: modifiers.rareChance
                    });
                }
            });
            return optimalPeriods;
        }
        return [];
    }

    // Manual time/weather control (for testing/debugging)
    setTime(hours, minutes = 0) {
        if (this.timeManager && this.timeManager.setTime) {
            this.timeManager.setTime(hours, minutes);
        } else {
            console.warn('GameState: TimeManager not available for setTime');
        }
    }

    setTimeSpeed(speed) {
        if (this.timeManager && this.timeManager.setTimeSpeed) {
            this.timeManager.setTimeSpeed(speed);
        } else {
            console.warn('GameState: TimeManager not available for setTimeSpeed');
        }
    }

    setWeather(weatherType, duration = null) {
        if (this.weatherManager && this.weatherManager.setWeather) {
            this.weatherManager.setWeather(weatherType, duration);
        } else {
            console.warn('GameState: WeatherManager not available for setWeather');
        }
    }

    // Session tracking methods
    trackCastAttempt() {
        this.player.statistics.totalCasts++;
        this.session.sessionStats.castsAttempted++;
        this.markDirty();
    }

    trackPerfectCast() {
        this.trackCastAttempt();
        this.session.sessionStats.successfulCasts++;
        
        // Award experience for perfect cast
        const expGained = this.addExperience(
            this.playerProgression.experienceSources.perfectCast,
            'perfectCast'
        );
        
        this.emit('perfectCast', { experienceGained: expGained });
        console.log('GameState: Perfect cast! +' + expGained + ' experience');
    }

    trackPerfectLure() {
        // Award experience for perfect lure
        const expGained = this.addExperience(
            this.playerProgression.experienceSources.perfectLure,
            'perfectLure'
        );
        
        this.emit('perfectLure', { experienceGained: expGained });
        console.log('GameState: Perfect lure! +' + expGained + ' experience');
    }

    trackPerfectReel() {
        // Award experience for perfect reel
        const expGained = this.addExperience(
            this.playerProgression.experienceSources.perfectReel,
            'perfectReel'
        );
        
        this.emit('perfectReel', { experienceGained: expGained });
        console.log('GameState: Perfect reel! +' + expGained + ' experience');
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
            time: this.timeManager ? this.timeManager.getTimeData() : null,
            weather: this.weatherManager ? this.weatherManager.getWeatherData() : null,
            progression: this.playerProgression ? this.playerProgression.getSaveData() : null,
            locationManager: this.locationManager ? this.locationManager.getSaveData() : null,
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
                
                // Load time and weather data
                if (this.timeManager && data.time) {
                    this.timeManager.loadTimeData(data.time);
                }
                if (this.weatherManager && data.weather) {
                    this.weatherManager.loadWeatherData(data.weather);
                }
                
                // Load progression data
                if (this.playerProgression && data.progression) {
                    this.playerProgression.loadSaveData(data.progression);
                }
                
                // Load location data
                if (this.locationManager && data.locationManager) {
                    this.locationManager.loadSaveData(data.locationManager);
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
                
                // Load time and weather data from backup
                if (this.timeManager && backup.time) {
                    this.timeManager.loadTimeData(backup.time);
                }
                if (this.weatherManager && backup.weather) {
                    this.weatherManager.loadWeatherData(backup.weather);
                }
                
                // Load progression data from backup
                if (this.playerProgression && backup.progression) {
                    this.playerProgression.loadSaveData(backup.progression);
                }
                
                // Load location data from backup
                if (this.locationManager && backup.locationManager) {
                    this.locationManager.loadSaveData(backup.locationManager);
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

    // Debug and testing methods
    debugFishInventory() {
        console.log('GameState: Current fish inventory:', this.inventory.fish);
        return this.inventory.fish;
    }

    debugProgressionSystem() {
        console.log('GameState: Testing progression system...');
        
        // Add some experience
        this.addExperience(500, 'debug', { reason: 'Testing progression' });
        
        // Add skill points
        this.playerProgression.debugAddSkillPoints(10);
        
        // Show progression summary
        const summary = this.playerProgression.getProgressionSummary();
        console.log('Progression Summary:', summary);
        
        return summary;
    }

    debugTestPerfectActions() {
        console.log('GameState: Testing perfect action tracking...');
        
        // Test perfect actions
        this.trackPerfectCast();
        this.trackPerfectLure();
        this.trackPerfectReel();
        
        return {
            perfectCasts: this.player.progression.perfectCasts,
            perfectLures: this.player.progression.perfectLures,
            perfectReels: this.player.progression.perfectReels
        };
    }

    forceResetFishInventory() {
        console.log('GameState: Force resetting fish inventory to default values');
        this.inventory.fish = [
            // Sample fish cards for testing crafting
            { id: 'minnow', name: 'Minnow', rarity: 1, quantity: 5, owned: true },
            { id: 'perch', name: 'Perch', rarity: 1, quantity: 4, owned: true },
            { id: 'trout', name: 'Trout', rarity: 2, quantity: 5, owned: true },
            { id: 'pike', name: 'Pike', rarity: 3, quantity: 2, owned: true },
            { id: 'salmon', name: 'Salmon', rarity: 3, quantity: 2, owned: true },
            { id: 'sardine', name: 'Sardine', rarity: 1, quantity: 6, owned: true },
            { id: 'bass', name: 'Bass', rarity: 2, quantity: 4, owned: true },
            { id: 'catfish', name: 'Catfish', rarity: 2, quantity: 3, owned: true }
        ];
        this.markDirty();
        this.save();
        console.log('GameState: Fish inventory reset and saved');
        return this.inventory.fish;
    }

    forceAddTestingCoins() {
        console.log('GameState: Adding 50,000 coins for testing');
        this.player.money += 50000;
        this.markDirty();
        this.save();
        console.log('GameState: Player now has', this.player.money, 'coins');
        return this.player.money;
    }

    forceSetTestingLevel() {
        console.log('GameState: Setting player level to 15 for testing');
        this.player.level = 15;
        this.player.experience = 0;
        this.player.experienceToNext = 1000;
        this.markDirty();
        this.save();
        console.log('GameState: Player is now level', this.player.level);
        return this.player.level;
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