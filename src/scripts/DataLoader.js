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
            
            // Load all JSON data files
            const [fishResponse, lureResponse, equipmentResponse, attributeResponse, configResponse] = await Promise.all([
                fetch('/src/data/fish.json'),
                fetch('/src/data/lures.json'),
                fetch('/src/data/equipment.json'),
                fetch('/src/data/attributes.json'),
                fetch('/src/data/gameConfig.json')
            ]);

            // Parse JSON data
            this.fishData = await fishResponse.json();
            this.lureData = await lureResponse.json();
            this.equipmentData = await equipmentResponse.json();
            this.attributeData = await attributeResponse.json();
            this.gameConfig = await configResponse.json();

            this.loaded = true;
            console.log('DataLoader: All game data loaded successfully');
            
            return {
                fish: this.fishData,
                lures: this.lureData,
                equipment: this.equipmentData,
                attributes: this.attributeData,
                config: this.gameConfig
            };
        } catch (error) {
            console.error('DataLoader: Failed to load game data:', error);
            throw error;
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
            console.error('DataLoader: Cannot validate - data not loaded');
            return false;
        }
        
        let isValid = true;
        
        // Validate fish data
        for (const fish of this.fishData.fishSpecies) {
            if (!fish.id || !fish.name || !fish.struggleStyle) {
                console.error(`DataLoader: Invalid fish data for ${fish.id || 'unknown'}`);
                isValid = false;
            }
        }
        
        // Validate lure data
        for (const lure of this.lureData.lures) {
            if (!lure.id || !lure.name || !lure.type) {
                console.error(`DataLoader: Invalid lure data for ${lure.id || 'unknown'}`);
                isValid = false;
            }
        }
        
        // Validate equipment data
        const allEquipment = [
            ...this.equipmentData.fishingRods,
            ...this.equipmentData.boats,
            ...this.equipmentData.clothing
        ];
        
        for (const item of allEquipment) {
            if (!item.id || !item.name || !item.stats) {
                console.error(`DataLoader: Invalid equipment data for ${item.id || 'unknown'}`);
                isValid = false;
            }
        }
        
        console.log(`DataLoader: Data validation ${isValid ? 'passed' : 'failed'}`);
        return isValid;
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
}

// Create singleton instance
export const gameDataLoader = new DataLoader(); 