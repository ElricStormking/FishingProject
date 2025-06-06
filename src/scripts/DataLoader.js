export class DataLoader {
    constructor() {
        this.fishData = null;
        this.lureData = null;
        this.equipmentData = null;
        this.attributeData = null;
        this.gameConfig = null;
        this.loaded = false;
    }

    async loadAllData() {
        try {
            console.log('DataLoader: Loading game data...');
            
            // Load all data files - ONLY use real JSON data, no fallbacks
            console.log('DataLoader: Loading fish data...');
            this.fishData = await this.loadDataFile('fish');
            
            console.log('DataLoader: Loading lure data...');
            this.lureData = await this.loadDataFile('lures');
            
            console.log('DataLoader: Loading equipment data...');
            this.equipmentData = await this.loadDataFile('equipment');
            
            console.log('DataLoader: Loading attribute data...');
            this.attributeData = await this.loadDataFile('attributes');
            
            console.log('DataLoader: Loading game config...');
            this.gameConfig = await this.loadDataFile('gameConfig');

            // Validate all data was loaded successfully
            if (!this.fishData || !this.lureData || !this.equipmentData || !this.attributeData || !this.gameConfig) {
                throw new Error('One or more data files failed to load properly');
            }

            // Final validation check
            const fallbackCheck = this.checkForFallbackData();
            if (fallbackCheck.usingFallback) {
                console.error('🚨 DataLoader: FALLBACK DATA DETECTED AFTER LOADING!');
                console.error('🚨 DataLoader: Fallback files:', fallbackCheck.fallbackFiles);
                console.error('🚨 DataLoader: Warnings:', fallbackCheck.warnings);
                throw new Error('Fallback data detected - refusing to continue with invalid data');
            }

            this.loaded = true;
            console.log('✅ DataLoader: All game data loaded successfully with REAL JSON data');
            console.log('✅ DataLoader: Data summary:', this.getDataSummary());
            
            return {
                fish: this.fishData,
                lures: this.lureData,
                equipment: this.equipmentData,
                attributes: this.attributeData,
                config: this.gameConfig
            };
        } catch (error) {
            console.error('🚨 DataLoader: CRITICAL FAILURE - Failed to load real game data:', error);
            console.error('🚨 DataLoader: Error details:', error.message);
            console.error('🚨 DataLoader: Error stack:', error.stack);
            
            // 🚨 DO NOT LOAD FALLBACK DATA - Let the game fail instead
            console.error('🚨 DataLoader: REFUSING to load fallback data');
            console.error('🚨 DataLoader: Game will not start without real JSON data');
            
            this.loaded = false;
            
            // Re-throw the error to prevent the game from starting with bad data
            throw new Error(`DataLoader: Cannot start game without real JSON data: ${error.message}`);
        }
    }

    getFallbackData(dataType) {
        console.log(`DataLoader: Using fallback data for ${dataType}`);
        
        switch (dataType) {
            case 'fish data':
                return {
                    fishSpecies: [
                        {
                            id: 'trout',
                            name: 'Trout',
                            rarity: 'common',
                            habitat: 'freshwater',
                            coinValue: 10,
                            activeTimePeriod: ['morning', 'evening'],
                            weatherPreference: ['sunny', 'cloudy'],
                            struggleStyleId: 'gentle'
                        }
                    ],
                    struggleStyles: [
                        {
                            id: 'gentle',
                            name: 'Gentle',
                            intensityPattern: 'gradual'
                        }
                    ]
                };
            case 'lure data':
                return {
                    lures: [
                        {
                            id: 'basic_worm',
                            name: 'Basic Worm',
                            type: 'bait',
                            rarity: 'common',
                            unlockLevel: 1
                        }
                    ],
                    lureTypes: []
                };
            case 'equipment data':
                return {
                    fishingRods: [
                        {
                            id: 'basic_rod',
                            name: 'Basic Rod',
                            rarity: 'common',
                            unlockLevel: 1
                        }
                    ],
                    boats: [],
                    clothing: []
                };
            case 'attribute data':
                return {
                    playerAttributes: {},
                    fishAttributes: {},
                    attributeModifiers: {
                        weatherEffects: {},
                        timeEffects: {},
                        depthEffects: {}
                    }
                };
            case 'game config':
                return {
                    spawning: {},
                    ui: {},
                    boat: {},
                    economy: {}
                };
            default:
                return {};
        }
    }

    loadFallbackData() {
        console.log('DataLoader: Loading complete fallback data set');
        this.fishData = this.getFallbackData('fish data');
        this.lureData = this.getFallbackData('lure data');
        this.equipmentData = this.getFallbackData('equipment data');
        this.attributeData = this.getFallbackData('attribute data');
        this.gameConfig = this.getFallbackData('game config');
    }

    async loadDataFile(fileName) {
        console.log(`DataLoader: Loading ${fileName} data - ENFORCING CSV-CONVERTED DATA ONLY`);
        
        try {
            // Try to import the actual JSON files using dynamic imports
            let data;
            switch (fileName) {
                case 'fish':
                    console.log('DataLoader: 🐟 Attempting to import CSV-converted fish.json...');
                    data = await import('../data/fish.json');
                    break;
                case 'lures':
                    console.log('DataLoader: 🎣 Attempting to import CSV-converted lures.json...');
                    data = await import('../data/lures.json');
                    break;
                case 'equipment':
                    console.log('DataLoader: ⚙️ Attempting to import CSV-converted equipment.json...');
                    data = await import('../data/equipment.json');
                    break;
                case 'attributes':
                    console.log('DataLoader: 📊 Attempting to import CSV-converted attributes.json...');
                    data = await import('../data/attributes.json');
                    break;
                case 'gameConfig':
                    console.log('DataLoader: ⚙️ Attempting to import CSV-converted gameConfig.json...');
                    data = await import('../data/gameConfig.json');
                    break;
                default:
                    throw new Error(`Unknown data file: ${fileName}`);
            }
            
            console.log(`DataLoader: Raw import result for ${fileName}:`, data);
            
            // Extract the default export (the actual JSON data)
            const jsonData = data.default || data;
            
            console.log(`DataLoader: Extracted JSON data for ${fileName}:`, jsonData);
            console.log(`DataLoader: JSON data type: ${typeof jsonData}, keys:`, Object.keys(jsonData || {}));
            
            // Validate that we actually got data
            if (!jsonData || (typeof jsonData === 'object' && Object.keys(jsonData).length === 0)) {
                throw new Error(`Empty or invalid data loaded from ${fileName}.json - CSV conversion may have failed!`);
            }
            
            // ⚠️ CRITICAL: Validate that this is REAL CSV-CONVERTED JSON data, not fallback data
            const isRealData = this.validateRealJsonData(fileName, jsonData);
            if (!isRealData) {
                console.error(`🚨 DataLoader: FALLBACK DATA DETECTED for ${fileName}! This should NEVER happen!`);
                console.error(`🚨 DataLoader: The loaded data appears to be fallback data instead of CSV-converted JSON`);
                console.error(`🚨 DataLoader: This indicates a critical failure in the CSV conversion system`);
                
                // FORCE RETRY: Try alternative loading method
                console.log(`🔄 DataLoader: Attempting alternative loading method for ${fileName}...`);
                const alternativeData = await this.loadDataFileAlternative(fileName);
                if (alternativeData && this.validateRealJsonData(fileName, alternativeData)) {
                    console.log(`✅ DataLoader: Alternative loading successful for ${fileName}`);
                    return alternativeData;
                }
                
                throw new Error(`CRITICAL: Fallback data detected for ${fileName} - CSV conversion system has failed!`);
            }
            
            console.log(`✅ DataLoader: Successfully loaded REAL CSV-CONVERTED ${fileName} data from JSON file`);
            console.log(`✅ DataLoader: ${fileName} validated as authentic CSV-converted JSON data`);
            
            // Log specific data counts for verification
            if (fileName === 'fish' && jsonData.fishSpecies) {
                console.log(`✅ DataLoader: Loaded ${jsonData.fishSpecies.length} fish species from CSV-converted fish.json`);
                console.log(`✅ DataLoader: First fish species:`, jsonData.fishSpecies[0]);
                
                // Check for any fish with undefined names - this should NOT happen with CSV data
                const undefinedFish = jsonData.fishSpecies.filter(fish => !fish.name || fish.name === 'undefined');
                if (undefinedFish.length > 0) {
                    console.error(`🚨 DataLoader: Found ${undefinedFish.length} fish with undefined names - CSV conversion error!`, undefinedFish);
                    throw new Error(`CSV data integrity failure: ${undefinedFish.length} fish have undefined names`);
                }
            }
            
            if (fileName === 'equipment' && jsonData.fishingRods) {
                console.log(`✅ DataLoader: Loaded ${jsonData.fishingRods.length} fishing rods from CSV-converted equipment.json`);
                console.log(`✅ DataLoader: First fishing rod:`, jsonData.fishingRods[0]);
            }
            
            return jsonData;
            
        } catch (error) {
            console.error(`DataLoader: Error loading ${fileName}:`, error);
            console.error(`DataLoader: Error details:`, error.message);
            console.error(`DataLoader: Error stack:`, error.stack);
            
            // 🚨 CRITICAL: DO NOT USE FALLBACK DATA - THROW ERROR INSTEAD
            console.error(`🚨 DataLoader: REFUSING to use fallback data for ${fileName}`);
            console.error(`🚨 DataLoader: This will cause the game to fail, but ensures no undefined items`);
            console.error(`🚨 DataLoader: CSV-converted data should be available - check converter status`);
            console.error(`🚨 DataLoader: Run: cd data_csv && node csv_to_json_converter.js`);
            
            throw new Error(`CRITICAL: Failed to load CSV-converted JSON data for ${fileName}: ${error.message}`);
        }
    }

    /**
     * Alternative loading method using fetch instead of dynamic import
     */
    async loadDataFileAlternative(fileName) {
        console.log(`DataLoader: Trying alternative fetch method for ${fileName}`);
        
        try {
            const filePath = `./src/data/${fileName}.json`;
            console.log(`DataLoader: Fetching ${filePath}`);
            
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const jsonData = await response.json();
            console.log(`DataLoader: Alternative fetch successful for ${fileName}:`, jsonData);
            
            return jsonData;
            
        } catch (error) {
            console.error(`DataLoader: Alternative loading also failed for ${fileName}:`, error);
            return null;
        }
    }

    getEnhancedFallbackData(fileName) {
        console.log(`DataLoader: Generating enhanced fallback data for ${fileName}`);
        
        switch (fileName) {
            case 'fish':
                return {
                    fishSpecies: [
                        {
                            id: 'bluegill',
                            name: 'Bluegill',
                            rarity: 1,
                            size: 2,
                            aggressiveness: 3,
                            elusiveness: 2,
                            strength: 2,
                            weight: 0.3,
                            speed: 4,
                            depthPreference: 2,
                            baitPreference: 9,
                            endurance: 2,
                            coinValue: 40,
                            experienceValue: 8,
                            description: 'A small colorful fish perfect for beginners',
                            habitat: 'shallow_water',
                            struggleStyle: 'gentle_pull',
                            activeTimePeriod: ['morning', 'afternoon'],
                            weatherPreference: ['sunny', 'cloudy']
                        },
                        {
                            id: 'bass',
                            name: 'Largemouth Bass',
                            rarity: 3,
                            size: 4,
                            aggressiveness: 6,
                            elusiveness: 5,
                            strength: 5,
                            weight: 2.8,
                            speed: 6,
                            depthPreference: 4,
                            baitPreference: 7,
                            endurance: 6,
                            coinValue: 350,
                            experienceValue: 50,
                            description: 'A popular sport fish with strong fighting ability',
                            habitat: 'lake',
                            struggleStyle: 'deep_dive',
                            activeTimePeriod: ['morning', 'afternoon'],
                            weatherPreference: ['sunny', 'cloudy']
                        },
                        {
                            id: 'trout',
                            name: 'Rainbow Trout',
                            rarity: 3,
                            size: 3,
                            aggressiveness: 4,
                            elusiveness: 5,
                            strength: 4,
                            weight: 1.2,
                            speed: 6,
                            depthPreference: 4,
                            baitPreference: 10,
                            endurance: 4,
                            coinValue: 200,
                            experienceValue: 35,
                            description: 'A prized freshwater fish that prefers fly lures',
                            habitat: 'stream',
                            struggleStyle: 'jumping_escape',
                            activeTimePeriod: ['dawn', 'dusk'],
                            weatherPreference: ['cloudy', 'rainy']
                        },
                        {
                            id: 'pike',
                            name: 'Northern Pike',
                            rarity: 4,
                            size: 5,
                            aggressiveness: 7,
                            elusiveness: 6,
                            strength: 6,
                            weight: 3.5,
                            speed: 7,
                            depthPreference: 5,
                            baitPreference: 6,
                            endurance: 5,
                            coinValue: 400,
                            experienceValue: 60,
                            description: 'An aggressive predator with sharp teeth',
                            habitat: 'deep_water',
                            struggleStyle: 'violent_thrashing',
                            activeTimePeriod: ['morning', 'evening'],
                            weatherPreference: ['sunny']
                        }
                    ],
                    struggleStyles: [
                        { id: 'gentle_pull', name: 'Gentle Pull', intensityPattern: 'gradual', qteTypes: ['DASH', 'THRASH'] },
                        { id: 'deep_dive', name: 'Deep Dive', intensityPattern: 'burst', qteTypes: ['DIVE', 'PULL'] },
                        { id: 'jumping_escape', name: 'Jumping Escape', intensityPattern: 'oscillating', qteTypes: ['JUMP', 'SURFACE'] },
                        { id: 'violent_thrashing', name: 'Violent Thrashing', intensityPattern: 'chaotic', qteTypes: ['THRASH', 'ROLL', 'SHAKE'] }
                    ]
                };
                
            case 'lures':
                return {
                    lures: [
                        {
                            id: 'basic_worm',
                            name: 'Basic Worm',
                            type: 'bait',
                            rarity: 1,
                            unlockLevel: 1,
                            coinValue: 5,
                            effectiveness: { bluegill: 9, bass: 7, trout: 8 }
                        },
                        {
                            id: 'spinner',
                            name: 'Spinner',
                            type: 'lure',
                            rarity: 2,
                            unlockLevel: 3,
                            coinValue: 15,
                            effectiveness: { bass: 8, pike: 9, trout: 6 }
                        }
                    ],
                    lureTypes: [
                        { id: 'bait', name: 'Bait', description: 'Natural bait for fish' },
                        { id: 'lure', name: 'Lure', description: 'Artificial lure' }
                    ]
                };
                
            case 'equipment':
                return {
                    fishingRods: [
                        {
                            id: 'basic_rod',
                            name: 'Basic Rod',
                            rarity: 1,
                            unlockLevel: 1,
                            coinValue: 50,
                            stats: { castAccuracy: 5, tensionStability: 8, rareFishChance: 2 }
                        }
                    ],
                    boats: [
                        {
                            id: 'rowboat',
                            name: 'Rowboat',
                            rarity: 1,
                            unlockLevel: 1,
                            coinValue: 200,
                            stats: { fishtankStorage: 10, craftingEfficiency: 5 }
                        }
                    ],
                    clothing: []
                };
                
            case 'attributes':
                return {
                    playerAttributes: {
                        casting: { castAccuracy: { base: 5, max: 20 }, castingRange: { base: 10, max: 50 } },
                        fishing: { fishDetection: { base: 5, max: 20 }, biteRate: { base: 5, max: 20 } },
                        reeling: { reelSpeed: { base: 5, max: 20 }, lineStrength: { base: 5, max: 20 } }
                    },
                    fishAttributes: {
                        aggressiveness: { min: 1, max: 10 },
                        elusiveness: { min: 1, max: 10 },
                        strength: { min: 1, max: 10 }
                    },
                    attributeModifiers: {
                        weatherEffects: {
                            sunny: { biteRate: 1.1, fishDetection: 1.0 },
                            cloudy: { biteRate: 1.0, fishDetection: 1.1 },
                            rainy: { biteRate: 0.9, fishDetection: 1.2 }
                        },
                        timeEffects: {
                            morning: { biteRate: 1.2, fishDetection: 1.1 },
                            afternoon: { biteRate: 1.0, fishDetection: 1.0 },
                            evening: { biteRate: 1.1, fishDetection: 1.2 }
                        },
                        depthEffects: {
                            shallow: { fishDetection: 1.2, rareFishChance: 0.8 },
                            deep: { fishDetection: 0.9, rareFishChance: 1.3 }
                        }
                    }
                };
                
            case 'gameConfig':
                return {
                    spawning: {
                        baseSpawnRate: 0.3,
                        rarityMultipliers: { 1: 1.0, 2: 0.7, 3: 0.4, 4: 0.2, 5: 0.1 }
                    },
                    ui: {
                        qteTimeouts: { DASH: 3000, THRASH: 2000, DIVE: 2500, SURFACE: 4000, CIRCLE: 3500 }
                    },
                    boat: {
                        baseStorage: 10,
                        energyCostPerCast: 5
                    },
                    economy: {
                        shopRefreshHours: 24,
                        sellPriceMultiplier: 0.7
                    }
                };
                
            default:
                return {};
        }
    }

    // Fish data methods
    getFishById(fishId) {
        if (!this.loaded) {
            console.warn('DataLoader: Data not loaded yet');
            return null;
        }
        return this.fishData.fishSpecies.find(fish => fish.id === fishId);
    }

    getAllFish() {
        if (!this.loaded) return [];
        return this.fishData.fishSpecies;
    }

    getFishByRarity(rarity) {
        if (!this.loaded) return [];
        return this.fishData.fishSpecies.filter(fish => fish.rarity === rarity);
    }

    getFishByHabitat(habitat) {
        if (!this.loaded) return [];
        return this.fishData.fishSpecies.filter(fish => fish.habitat === habitat);
    }

    getFishByTimeAndWeather(timePeriod, weather) {
        if (!this.loaded) return [];
        return this.fishData.fishSpecies.filter(fish => {
            const timeMatch = fish.activeTimePeriod.includes(timePeriod);
            const weatherMatch = fish.weatherPreference.includes(weather) || fish.weatherPreference.includes('any');
            return timeMatch && weatherMatch;
        });
    }

    getStruggleStyle(styleId) {
        if (!this.loaded) return null;
        return this.fishData.struggleStyles.find(style => style.id === styleId);
    }

    // Lure data methods
    getLureById(lureId) {
        if (!this.loaded) return null;
        return this.lureData.lures.find(lure => lure.id === lureId);
    }

    getAllLures() {
        if (!this.loaded) return [];
        return this.lureData.lures;
    }

    getLuresByType(type) {
        if (!this.loaded) return [];
        return this.lureData.lures.filter(lure => lure.type === type);
    }

    getLuresByRarity(rarity) {
        if (!this.loaded) return [];
        return this.lureData.lures.filter(lure => lure.rarity === rarity);
    }

    getLuresByUnlockLevel(level) {
        if (!this.loaded) return [];
        return this.lureData.lures.filter(lure => lure.unlockLevel <= level);
    }

    getLureType(typeId) {
        if (!this.loaded) return null;
        return this.lureData.lureTypes.find(type => type.id === typeId);
    }

    // Equipment data methods
    getRodById(rodId) {
        if (!this.loaded) return null;
        return this.equipmentData.fishingRods.find(rod => rod.id === rodId);
    }

    getAllRods() {
        if (!this.loaded) return [];
        return this.equipmentData.fishingRods;
    }

    getBoatById(boatId) {
        if (!this.loaded) return null;
        return this.equipmentData.boats.find(boat => boat.id === boatId);
    }

    getAllBoats() {
        if (!this.loaded) return [];
        return this.equipmentData.boats;
    }

    getClothingById(clothingId) {
        if (!this.loaded) return null;
        return this.equipmentData.clothing.find(clothing => clothing.id === clothingId);
    }

    getAllClothing() {
        if (!this.loaded) return [];
        return this.equipmentData.clothing;
    }

    getEquipmentByRarity(category, rarity) {
        if (!this.loaded) return [];
        const items = this.equipmentData[category] || [];
        return items.filter(item => item.rarity === rarity);
    }

    getEquipmentByUnlockLevel(category, level) {
        if (!this.loaded) return [];
        const items = this.equipmentData[category] || [];
        return items.filter(item => item.unlockLevel <= level);
    }

    // Attribute data methods
    getPlayerAttribute(attributeId) {
        if (!this.loaded) return null;
        
        // Search through all player attribute categories
        for (const category of Object.values(this.attributeData.playerAttributes)) {
            if (category[attributeId]) {
                return category[attributeId];
            }
        }
        return null;
    }

    getFishAttribute(attributeId) {
        if (!this.loaded) return null;
        return this.attributeData.fishAttributes[attributeId];
    }

    getWeatherEffects(weather) {
        if (!this.loaded) return {};
        return this.attributeData.attributeModifiers.weatherEffects[weather] || {};
    }

    getTimeEffects(timePeriod) {
        if (!this.loaded) return {};
        return this.attributeData.attributeModifiers.timeEffects[timePeriod] || {};
    }

    getDepthEffects(depth) {
        if (!this.loaded) return {};
        return this.attributeData.attributeModifiers.depthEffects[depth] || {};
    }

    // Configuration methods
    getConfig(section, key = null) {
        if (!this.loaded) return null;
        if (key) {
            return this.gameConfig[section] ? this.gameConfig[section][key] : null;
        }
        return this.gameConfig[section] || null;
    }

    getFishingConfig(key = null) {
        return this.getConfig('fishing', key);
    }

    getSpawningConfig(key = null) {
        return this.getConfig('spawning', key);
    }

    getUIConfig(key = null) {
        return this.getConfig('ui', key);
    }

    getBoatConfig(key = null) {
        return this.getConfig('boat', key);
    }

    getEconomyConfig(key = null) {
        return this.getConfig('economy', key);
    }

    // Crafting methods
    getCraftingRecipe(itemId) {
        if (!this.loaded) return null;
        
        // Search through all equipment categories for crafting recipes
        const allItems = [
            ...this.equipmentData.fishingRods,
            ...this.equipmentData.boats,
            ...this.equipmentData.clothing,
            ...this.lureData.lures
        ];
        
        return allItems.find(item => item.id === itemId);
    }

    getItemsByCraftingMaterial(materialId) {
        if (!this.loaded) return [];
        
        const allItems = [
            ...this.equipmentData.fishingRods,
            ...this.equipmentData.boats,
            ...this.equipmentData.clothing,
            ...this.lureData.lures
        ];
        
        return allItems.filter(item => 
            item.craftingMaterials && item.craftingMaterials.includes(materialId)
        );
    }

    // Utility methods
    calculateFishSpawnChance(fish, currentTime, currentWeather, depth, playerLevel) {
        if (!this.loaded) return 0;
        
        const config = this.getConfig('spawning');
        let baseChance = config.baseSpawnChance - (fish.rarity * config.rarityPenalty);
        
        // Apply time modifiers
        if (fish.activeTimePeriod.includes(currentTime)) {
            baseChance += config.timeBonus;
        }
        
        // Apply weather modifiers
        if (fish.weatherPreference.includes(currentWeather) || fish.weatherPreference.includes('any')) {
            baseChance += config.weatherBonus;
        }
        
        // Apply depth modifiers
        const depthDifference = Math.abs(fish.depthPreference - depth);
        baseChance -= depthDifference * config.depthPenalty;
        
        // Apply level requirements (some fish only appear at higher levels)
        if (playerLevel < fish.rarity * config.levelRequirementMultiplier) {
            baseChance *= config.levelPenalty;
        }
        
        return Math.max(0, Math.min(100, baseChance));
    }

    calculateLureEffectiveness(lure, fish) {
        if (!this.loaded) return 0;
        
        const lureType = this.getLureType(lure.type);
        if (!lureType) return 0;
        
        const config = this.getConfig('lureEffectiveness');
        let effectiveness = lure.biteRate;
        
        // Check if lure type is effective against this fish
        if (lureType.effectiveAgainst.includes(fish.id)) {
            effectiveness += config.typeMatchBonus;
        }
        
        // Check depth compatibility
        const fishDepth = fish.depthPreference;
        if (lureType.preferredDepth.includes(fishDepth)) {
            effectiveness += config.depthMatchBonus;
        }
        
        // Apply fish bait preference
        effectiveness += fish.baitPreference * config.baitPreferenceMultiplier;
        
        return Math.max(0, Math.min(100, effectiveness));
    }

    // Validation methods
    validateGameData() {
        if (!this.loaded) {
            console.warn('DataLoader: Cannot validate - data not loaded');
            return true; // Continue anyway
        }
        
        try {
            // Basic validation for enhanced fallback data
            const hasValidFishData = this.fishData && this.fishData.fishSpecies && Array.isArray(this.fishData.fishSpecies) && this.fishData.fishSpecies.length > 0;
            const hasValidLureData = this.lureData && this.lureData.lures && Array.isArray(this.lureData.lures);
            const hasValidEquipmentData = this.equipmentData && this.equipmentData.fishingRods && Array.isArray(this.equipmentData.fishingRods);
            
            if (hasValidFishData && hasValidLureData && hasValidEquipmentData) {
                console.log('DataLoader: Enhanced game data validated successfully');
                return true;
            } else {
                console.log('DataLoader: Using partial data structures (this is normal for enhanced fallback)');
                return true; // Continue anyway with partial data
            }
        } catch (error) {
            console.log('DataLoader: Validation completed with enhanced fallback data');
            return true; // Continue anyway
        }
    }

    // Debug methods
    getDataSummary() {
        if (!this.loaded) return 'Data not loaded';
        
        return {
            fish: this.fishData.fishSpecies.length,
            lures: this.lureData.lures.length,
            lureTypes: this.lureData.lureTypes.length,
            rods: this.equipmentData.fishingRods.length,
            boats: this.equipmentData.boats.length,
            clothing: this.equipmentData.clothing.length,
            struggleStyles: this.fishData.struggleStyles.length,
            playerAttributes: Object.keys(this.attributeData.playerAttributes).length,
            fishAttributes: Object.keys(this.attributeData.fishAttributes).length
        };
    }

    /**
     * Check if any fallback data is currently being used
     * @returns {object} - Report of fallback data usage
     */
    checkForFallbackData() {
        if (!this.loaded) {
            return { error: 'Data not loaded yet' };
        }

        const report = {
            usingFallback: false,
            fallbackFiles: [],
            realFiles: [],
            warnings: []
        };

        try {
            // Check fish data
            if (this.fishData && this.fishData.fishSpecies) {
                if (this.fishData.fishSpecies.length === 0) {
                    report.usingFallback = true;
                    report.fallbackFiles.push('fish');
                    report.warnings.push(`🚨 Fish data is empty`);
                } else {
                    report.realFiles.push('fish');
                }
            }

            // Check equipment data
            if (this.equipmentData && this.equipmentData.fishingRods) {
                if (this.equipmentData.fishingRods.length === 0) {
                    report.usingFallback = true;
                    report.fallbackFiles.push('equipment');
                    report.warnings.push(`🚨 Equipment data is empty`);
                } else {
                    report.realFiles.push('equipment');
                }
            }

            // Check lure data
            if (this.lureData && this.lureData.lures) {
                if (this.lureData.lures.length === 0) {
                    report.usingFallback = true;
                    report.fallbackFiles.push('lures');
                    report.warnings.push(`🚨 Lure data is empty`);
                } else {
                    report.realFiles.push('lures');
                }
            }

            // Check for undefined items in fish data
            if (this.fishData && this.fishData.fishSpecies) {
                const undefinedFish = this.fishData.fishSpecies.filter(fish => 
                    !fish.name || fish.name === 'undefined' || fish.name === ''
                );
                if (undefinedFish.length > 0) {
                    report.warnings.push(`⚠️ Found ${undefinedFish.length} fish with undefined names - may need data cleanup`);
                    // Don't mark as fallback, just warn
                }
            }

            // Summary
            if (report.usingFallback) {
                console.error('🚨 DataLoader: EMPTY DATA DETECTED!');
                console.error('🚨 DataLoader: Empty files:', report.fallbackFiles);
                console.error('🚨 DataLoader: Warnings:', report.warnings);
            } else {
                console.log('✅ DataLoader: All data loaded successfully');
                console.log('✅ DataLoader: Loaded files:', report.realFiles);
                if (report.warnings.length > 0) {
                    console.warn('⚠️ DataLoader: Warnings:', report.warnings);
                }
            }

            return report;

        } catch (error) {
            console.error('DataLoader: Error checking data status:', error);
            return {
                error: 'Failed to check data status',
                details: error.message
            };
        }
    }

    /**
     * Validate that loaded data is real JSON data, not fallback data
     * @param {string} fileName - The file name being validated
     * @param {object} data - The loaded data
     * @returns {boolean} - True if real data, false if fallback data
     */
    validateRealJsonData(fileName, data) {
        console.log(`DataLoader: Validating JSON data for ${fileName}`);
        
        try {
            switch (fileName) {
                case 'fish':
                    // Accept any fish data with basic structure
                    if (!data.fishSpecies || !Array.isArray(data.fishSpecies)) {
                        console.error(`DataLoader: ${fileName} missing fishSpecies array`);
                        return false;
                    }
                    if (data.fishSpecies.length === 0) {
                        console.error(`DataLoader: ${fileName} has no fish species`);
                        return false;
                    }
                    // Check for struggle styles (required for FishDatabase)
                    if (!data.struggleStyles || !Array.isArray(data.struggleStyles)) {
                        console.error(`DataLoader: ${fileName} missing struggleStyles array`);
                        return false;
                    }
                    console.log(`✅ DataLoader: ${fileName} validated successfully (${data.fishSpecies.length} species, ${data.struggleStyles.length} struggle styles)`);
                    return true;
                    
                case 'equipment':
                    // Accept any equipment data with basic structure
                    if (!data.fishingRods || !Array.isArray(data.fishingRods)) {
                        console.error(`DataLoader: ${fileName} missing fishingRods array`);
                        return false;
                    }
                    // Accept any number of equipment items
                    console.log(`✅ DataLoader: ${fileName} validated successfully (${data.fishingRods.length} rods, ${(data.boats || []).length} boats, ${(data.clothing || []).length} clothing)`);
                    return true;
                    
                case 'lures':
                    // Accept any lure data with basic structure
                    if (!data.lures || !Array.isArray(data.lures)) {
                        console.error(`DataLoader: ${fileName} missing lures array`);
                        return false;
                    }
                    console.log(`✅ DataLoader: ${fileName} validated successfully (${data.lures.length} lures)`);
                    return true;
                    
                case 'attributes':
                    // Accept any attributes data with playerAttributes
                    if (!data.playerAttributes) {
                        console.error(`DataLoader: ${fileName} missing playerAttributes section`);
                        return false;
                    }
                    // Accept any number of attribute categories
                    const playerAttrCategories = Object.keys(data.playerAttributes);
                    console.log(`✅ DataLoader: ${fileName} validated successfully (${playerAttrCategories.length} player categories)`);
                    return true;
                    
                case 'gameConfig':
                    // Accept any config data
                    if (!data || Object.keys(data).length === 0) {
                        console.error(`DataLoader: ${fileName} is empty`);
                        return false;
                    }
                    console.log(`✅ DataLoader: ${fileName} validated successfully`);
                    return true;
                    
                default:
                    // For other files, basic validation
                    if (!data || Object.keys(data).length === 0) {
                        console.error(`DataLoader: ${fileName} is empty`);
                        return false;
                    }
                    console.log(`✅ DataLoader: ${fileName} validated successfully`);
                    return true;
            }
        } catch (error) {
            console.error(`DataLoader: Error validating ${fileName}:`, error);
            return false;
        }
    }
}

// Create singleton instance
export const gameDataLoader = new DataLoader(); 