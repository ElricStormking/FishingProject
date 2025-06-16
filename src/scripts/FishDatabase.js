import fishData from '../data/fish.json';
import Logger from '../utils/Logger.js';

export class FishDatabase {
    constructor(gameState) {
        this.gameState = gameState;
        this.fishSpecies = {};
        this.struggleStyles = {};
        this.fishCollection = {};
        this.discoveredFish = new Set();
        
        this.loadFishData();
        this.initializeCollection();
    }

    /**
     * Load fish data from JSON
     */
    loadFishData() {
        // Load fish species
        fishData.fishSpecies.forEach(fish => {
            this.fishSpecies[fish.id] = { ...fish };
        });
        
        // Load struggle styles
        fishData.struggleStyles.forEach(style => {
            this.struggleStyles[style.id] = { ...style };
        });
        
                    }

    /**
     * Initialize fish collection tracking
     */
    initializeCollection() {
        // Load saved collection from game state
        const savedCollection = this.gameState.fishCollection || {};
        
        // Initialize collection for all fish
        Object.keys(this.fishSpecies).forEach(fishId => {
            this.fishCollection[fishId] = savedCollection[fishId] || {
                caught: false,
                timesCaught: 0,
                firstCaughtDate: null,
                largestWeight: 0,
                totalWeight: 0
            };
            
            if (this.fishCollection[fishId].caught) {
                this.discoveredFish.add(fishId);
            }
        });
        
        console.log('FishDatabase: Collection initialized, discovered:', this.discoveredFish.size);
    }

    /**
     * Get fish by ID
     * @param {string} fishId - Fish ID
     * @returns {object|null} Fish data
     */
    getFish(fishId) {
        return this.fishSpecies[fishId] || null;
    }

    /**
     * Get struggle style by ID
     * @param {string} styleId - Struggle style ID
     * @returns {object|null} Struggle style data
     */
    getStruggleStyle(styleId) {
        return this.struggleStyles[styleId] || null;
    }

    /**
     * Get available fish for current conditions
     * @param {string} location - Current fishing location
     * @param {string} timePeriod - Current time period
     * @param {string} weather - Current weather
     * @param {number} playerLevel - Player level
     * @returns {array} Available fish
     */
    getAvailableFish(location, timePeriod, weather, playerLevel = 1) {
        const availableFish = [];
        
        Object.values(this.fishSpecies).forEach(fish => {
            // Check if fish is active in current time period
            if (!fish.activeTimePeriod.includes(timePeriod)) {
                return;
            }
            
            // Check weather preference (any means all weather)
            if (fish.weatherPreference[0] !== 'any' && !fish.weatherPreference.includes(weather)) {
                return;
            }
            
            // Check location compatibility (simplified for now)
            if (!this.isLocationCompatible(location, fish.habitat)) {
                return;
            }
            
            // Check player level requirement (rarity-based)
            const minLevelRequired = Math.max(1, (fish.rarity - 1) * 5);
            if (playerLevel < minLevelRequired) {
                return;
            }
            
            availableFish.push(fish);
        });
        
        return availableFish;
    }

    /**
     * Check if location is compatible with fish habitat
     * @param {string} location - Current location
     * @param {string} habitat - Fish habitat
     * @returns {boolean} Compatibility
     */
    isLocationCompatible(location, habitat) {
        // Location to habitat mapping
        const locationHabitats = {
            'beginner_lake': ['shallow_water', 'mid_water', 'lake', 'stream', 'muddy_bottom', 'deep_water'],
            'ocean_harbor': ['saltwater', 'open_ocean', 'deep_ocean', 'river_mouth'],
            'mountain_stream': ['mountain_stream', 'stream', 'shallow_water'],
            'midnight_pond': ['mystical_pond', 'shallow_water', 'mid_water', 'lake'],
            'champions_cove': ['tournament_waters', 'saltwater', 'open_ocean', 'deep_ocean'],
            
            // Legacy compatibility
            'Starting Port': ['shallow_water', 'mid_water'],
            'Coral Cove': ['shallow_water', 'mid_water', 'stream'],
            'Deep Abyss': ['deep_water', 'deep_abyss', 'abyss', 'ocean_trench'],
            'Tropical Lagoon': ['shallow_water', 'lake', 'moonlit_lake'],
            'Open Waters': ['open_ocean', 'deep_ocean', 'river_mouth'],
            'Training Lagoon': ['shallow_water', 'mid_water', 'lake'],
            'Muddy Marsh': ['muddy_bottom', 'shallow_water']
        };
        
        const habitats = locationHabitats[location] || [];
        return habitats.includes(habitat);
    }

    /**
     * Select a fish from available fish based on weights
     * @param {array} availableFish - Available fish array
     * @param {number} rareFishBonus - Rare fish chance bonus (0-100)
     * @returns {object|null} Selected fish
     */
    selectFishByWeight(availableFish, rareFishBonus = 0) {
        if (availableFish.length === 0) return null;
        
        // Calculate spawn weights based on rarity
        const weights = availableFish.map(fish => {
            // Base weight inversely proportional to rarity
            let weight = 100 / fish.rarity;
            
            // Apply rare fish bonus
            if (fish.rarity >= 5) {
                weight *= (1 + rareFishBonus / 100);
            }
            
            return weight;
        });
        
        // Select fish based on weighted random
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < availableFish.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return availableFish[i];
            }
        }
        
        return availableFish[availableFish.length - 1];
    }

    /**
     * Record a fish catch
     * @param {string} fishId - Fish ID
     * @param {number} weight - Actual weight caught
     * @returns {object} Catch statistics
     */
    recordCatch(fishId, weight = null) {
        const fish = this.getFish(fishId);
        if (!fish) return null;
        
        const collection = this.fishCollection[fishId];
        const isFirstCatch = !collection.caught;
        
        // Update collection stats
        collection.caught = true;
        collection.timesCaught++;
        
        if (!collection.firstCaughtDate) {
            collection.firstCaughtDate = new Date().toISOString();
        }
        
        // Calculate actual weight with variation
        const actualWeight = weight || this.calculateFishWeight(fish);
        
        if (actualWeight > collection.largestWeight) {
            collection.largestWeight = actualWeight;
        }
        
        collection.totalWeight += actualWeight;
        
        // Mark as discovered
        this.discoveredFish.add(fishId);
        
        // Save to game state
        this.saveCollection();
        
        return {
            fish: fish,
            weight: actualWeight,
            isFirstCatch: isFirstCatch,
            isRecord: actualWeight === collection.largestWeight,
            collection: { ...collection }
        };
    }

    /**
     * Calculate actual fish weight with variation
     * @param {object} fish - Fish data
     * @returns {number} Actual weight
     */
    calculateFishWeight(fish) {
        // Base weight with ±20% variation
        const variation = 0.8 + Math.random() * 0.4;
        let weight = fish.weight * variation;
        
        // Small chance for trophy size (5%)
        if (Math.random() < 0.05) {
            weight *= 1.5;
        }
        
        return Math.round(weight * 10) / 10;
    }

    /**
     * Get fish collection statistics
     * @returns {object} Collection stats
     */
    getCollectionStats() {
        const stats = {
            totalSpecies: Object.keys(this.fishSpecies).length,
            discovered: this.discoveredFish.size,
            totalCaught: 0,
            totalWeight: 0,
            rarest: null,
            heaviest: null,
            mostCaught: null
        };
        
        let maxRarity = 0;
        let maxWeight = 0;
        let maxCaught = 0;
        
        Object.entries(this.fishCollection).forEach(([fishId, collection]) => {
            if (!collection.caught) return;
            
            const fish = this.getFish(fishId);
            stats.totalCaught += collection.timesCaught;
            stats.totalWeight += collection.totalWeight;
            
            // Track rarest caught
            if (fish.rarity > maxRarity) {
                maxRarity = fish.rarity;
                stats.rarest = fish;
            }
            
            // Track heaviest caught
            if (collection.largestWeight > maxWeight) {
                maxWeight = collection.largestWeight;
                stats.heaviest = {
                    fish: fish,
                    weight: collection.largestWeight
                };
            }
            
            // Track most caught
            if (collection.timesCaught > maxCaught) {
                maxCaught = collection.timesCaught;
                stats.mostCaught = {
                    fish: fish,
                    count: collection.timesCaught
                };
            }
        });
        
        stats.completionPercent = Math.round((stats.discovered / stats.totalSpecies) * 100);
        stats.totalWeight = Math.round(stats.totalWeight * 10) / 10;
        
        return stats;
    }

    /**
     * Get fish by rarity level
     * @param {number} minRarity - Minimum rarity
     * @param {number} maxRarity - Maximum rarity
     * @returns {array} Fish array
     */
    getFishByRarity(minRarity, maxRarity = 10) {
        return Object.values(this.fishSpecies).filter(fish => 
            fish.rarity >= minRarity && fish.rarity <= maxRarity
        );
    }

    /**
     * Get undiscovered fish
     * @returns {array} Undiscovered fish
     */
    getUndiscoveredFish() {
        return Object.values(this.fishSpecies).filter(fish => 
            !this.discoveredFish.has(fish.id)
        );
    }

    /**
     * Check if player has caught specific fish
     * @param {string} fishId - Fish ID
     * @returns {boolean} Has caught
     */
    hasCaughtFish(fishId) {
        return this.fishCollection[fishId]?.caught || false;
    }

    /**
     * Get fish collection entry
     * @param {string} fishId - Fish ID
     * @returns {object} Collection entry
     */
    getFishCollection(fishId) {
        return this.fishCollection[fishId] || null;
    }

    /**
     * Save collection to game state
     */
    saveCollection() {
        this.gameState.fishCollection = { ...this.fishCollection };
        this.gameState.markDirty();
    }

    /**
     * Debug method to unlock all fish
     */
    debugUnlockAllFish() {
        Object.keys(this.fishSpecies).forEach(fishId => {
            this.recordCatch(fishId);
        });
        console.log('FishDatabase: All fish unlocked for debugging');
    }

    /**
     * Get fish value multiplier based on conditions
     * @param {object} fish - Fish data
     * @param {boolean} perfectCatch - Was it a perfect catch
     * @returns {number} Value multiplier
     */
    getFishValueMultiplier(fish, perfectCatch = false) {
        let multiplier = 1.0;
        
        // Rarity bonus
        if (fish.rarity >= 7) multiplier *= 1.5;
        else if (fish.rarity >= 5) multiplier *= 1.25;
        
        // Perfect catch bonus
        if (perfectCatch) multiplier *= 1.2;
        
        // First catch bonus
        if (!this.hasCaughtFish(fish.id)) multiplier *= 2.0;
        
        return multiplier;
    }
}

export default FishDatabase; 