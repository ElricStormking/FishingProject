/**
 * FishSpawner.js - Comprehensive Fish Spawning System for 50 Locations
 * Handles fish distribution, rarity calculations, and boss spawning
 */

import { LOCATION_DATA, getLocationById } from '../data/LocationData.js';

export class FishSpawner {
    constructor(fishDatabase) {
        this.fishDatabase = fishDatabase;
        this.bossSpawnChance = 0.02; // 2% chance for boss fish
        this.rarityThresholds = {
            common: 0.5,      // 50%
            uncommon: 0.75,   // 25%
            rare: 0.90,       // 15%
            epic: 0.97,       // 7%
            legendary: 0.995, // 2.5%
            transcendent: 1.0 // 0.5%
        };
        
        // Boss fish locations (one boss per map)
        this.bossLocations = {
            'beginner_waters': 'beginner_fallen_tree',
            'coastal_harbor': 'harbor_breakwater', 
            'mountain_streams': 'mountain_alpine_tarn',
            'midnight_lakes': 'midnight_void_drop',
            'championship_waters': 'championship_hall_of_fame'
        };
        
        console.log('FishSpawner: Initialized for 50 locations with boss system');
    }

    /**
     * Spawn a fish at a specific location
     * @param {string} locationId - Location identifier
     * @param {object} conditions - Environmental conditions
     * @returns {object|null} Spawned fish data
     */
    spawnFish(locationId, conditions = {}) {
        const location = getLocationById(locationId);
        if (!location) {
            console.warn(`FishSpawner: Unknown location ${locationId}`);
            return null;
        }

        // Check for boss fish spawn
        if (this.shouldSpawnBoss(locationId)) {
            return this.spawnBossFish(locationId);
        }

        // Get available fish for this location
        const availableFish = this.getLocationFish(locationId, conditions);
        if (availableFish.length === 0) {
            console.warn(`FishSpawner: No fish available for location ${locationId}`);
            return null;
        }

        // Select fish based on rarity and conditions
        const selectedFish = this.selectFishByRarity(availableFish, location, conditions);
        
        // Generate fish instance with variations
        return this.generateFishInstance(selectedFish, location, conditions);
    }

    /**
     * Get fish available at a specific location
     * @param {string} locationId - Location identifier
     * @param {object} conditions - Environmental conditions
     * @returns {array} Available fish species
     */
    getLocationFish(locationId, conditions = {}) {
        const location = getLocationById(locationId);
        if (!location || !location.fishPopulation) return [];

        const availableFish = [];
        
        location.fishPopulation.forEach(fishId => {
            const fish = this.fishDatabase.getFish(fishId);
            if (fish && this.isFishAvailable(fish, conditions)) {
                availableFish.push(fish);
            }
        });

        return availableFish;
    }

    /**
     * Check if fish is available under current conditions
     * @param {object} fish - Fish data
     * @param {object} conditions - Environmental conditions
     * @returns {boolean} Availability
     */
    isFishAvailable(fish, conditions) {
        const { timePeriod = 'afternoon', weather = 'sunny', playerLevel = 1 } = conditions;

        // Check time period
        if (fish.activeTimePeriod && !fish.activeTimePeriod.includes(timePeriod)) {
            return false;
        }

        // Check weather preference
        if (fish.weatherPreference && fish.weatherPreference[0] !== 'any' && 
            !fish.weatherPreference.includes(weather)) {
            return false;
        }

        // Check level requirement (rarity-based)
        const minLevel = Math.max(1, (fish.rarity - 1) * 3);
        if (playerLevel < minLevel) {
            return false;
        }

        return true;
    }

    /**
     * Select fish based on rarity distribution
     * @param {array} availableFish - Available fish
     * @param {object} location - Location data
     * @param {object} conditions - Environmental conditions
     * @returns {object} Selected fish
     */
    selectFishByRarity(availableFish, location, conditions) {
        // Apply location rarity modifiers
        const modifiedFish = availableFish.map(fish => ({
            ...fish,
            spawnWeight: this.calculateSpawnWeight(fish, location, conditions)
        }));

        // Sort by spawn weight and select randomly
        const totalWeight = modifiedFish.reduce((sum, fish) => sum + fish.spawnWeight, 0);
        let random = Math.random() * totalWeight;

        for (const fish of modifiedFish) {
            random -= fish.spawnWeight;
            if (random <= 0) {
                return fish;
            }
        }

        // Fallback to first fish
        return modifiedFish[0] || availableFish[0];
    }

    /**
     * Calculate spawn weight for fish based on location and conditions
     * @param {object} fish - Fish data
     * @param {object} location - Location data
     * @param {object} conditions - Environmental conditions
     * @returns {number} Spawn weight
     */
    calculateSpawnWeight(fish, location, conditions) {
        let weight = 1.0;

        // Base rarity weight (higher rarity = lower weight)
        const rarityWeights = { 1: 10, 2: 6, 3: 3, 4: 1.5, 5: 0.8, 6: 0.4, 7: 0.2, 8: 0.1, 9: 0.05, 10: 0.02 };
        weight *= rarityWeights[fish.rarity] || 1.0;

        // Apply location rarity modifiers
        if (location.rarityModifiers) {
            const rarityNames = ['', 'common', 'uncommon', 'rare', 'epic', 'legendary', 'transcendent'];
            const rarityName = rarityNames[Math.min(fish.rarity, 6)] || 'common';
            weight *= location.rarityModifiers[rarityName] || 1.0;
        }

        // Time period bonus
        const { timePeriod = 'afternoon' } = conditions;
        if (fish.activeTimePeriod && fish.activeTimePeriod.includes(timePeriod)) {
            weight *= 1.5;
        }

        // Weather bonus
        const { weather = 'sunny' } = conditions;
        if (fish.weatherPreference && fish.weatherPreference.includes(weather)) {
            weight *= 1.3;
        }

        return Math.max(0.01, weight);
    }

    /**
     * Generate fish instance with variations
     * @param {object} baseFish - Base fish data
     * @param {object} location - Location data
     * @param {object} conditions - Environmental conditions
     * @returns {object} Fish instance
     */
    generateFishInstance(baseFish, location, conditions) {
        const fish = { ...baseFish };

        // Size variation (±20%)
        const sizeVariation = 0.8 + (Math.random() * 0.4);
        fish.size = Math.round(baseFish.size * sizeVariation * 10) / 10;

        // Weight variation (±25%)
        const weightVariation = 0.75 + (Math.random() * 0.5);
        fish.weight = Math.round(baseFish.weight * weightVariation * 100) / 100;

        // Apply location modifiers
        if (location.fishingModifiers) {
            fish.catchDifficulty = this.calculateCatchDifficulty(fish, location);
        }

        // Add location and spawn info
        fish.spawnLocation = location.id;
        fish.spawnTime = Date.now();
        fish.spawnConditions = { ...conditions };

        // Generate unique ID
        fish.instanceId = this.generateFishId();

        return fish;
    }

    /**
     * Calculate catch difficulty based on fish and location
     * @param {object} fish - Fish data
     * @param {object} location - Location data
     * @returns {number} Catch difficulty
     */
    calculateCatchDifficulty(fish, location) {
        let difficulty = fish.rarity * 0.5 + fish.elusiveness * 0.3 + fish.strength * 0.2;

        // Apply location modifiers
        const modifiers = location.fishingModifiers;
        if (modifiers.lineStrength < 1.0) difficulty *= 1.2;
        if (modifiers.castDistance < 1.0) difficulty *= 1.1;

        return Math.max(1, Math.min(10, difficulty));
    }

    /**
     * Check if boss fish should spawn
     * @param {string} locationId - Location identifier
     * @returns {boolean} Should spawn boss
     */
    shouldSpawnBoss(locationId) {
        // Only spawn bosses at designated boss locations
        const isBossLocation = Object.values(this.bossLocations).includes(locationId);
        if (!isBossLocation) return false;

        return Math.random() < this.bossSpawnChance;
    }

    /**
     * Spawn boss fish for location
     * @param {string} locationId - Location identifier
     * @returns {object} Boss fish instance
     */
    spawnBossFish(locationId) {
        const bossData = this.getBossDataForLocation(locationId);
        if (!bossData) return null;

        const location = getLocationById(locationId);
        
        // Create boss fish instance
        const bossFish = {
            ...bossData,
            isBoss: true,
            size: bossData.size * (1.5 + Math.random() * 0.5), // 150-200% size
            weight: bossData.weight * (2 + Math.random()), // 200-300% weight
            coinValue: bossData.coinValue * 3,
            experienceValue: bossData.experienceValue * 4,
            catchDifficulty: 9 + Math.random(),
            spawnLocation: locationId,
            spawnTime: Date.now(),
            instanceId: this.generateFishId(),
            bossTitle: this.generateBossTitle(bossData.name)
        };

        console.log(`FishSpawner: Boss fish spawned - ${bossFish.bossTitle} at ${location.name}`);
        return bossFish;
    }

    /**
     * Get boss data for specific location
     * @param {string} locationId - Location identifier
     * @returns {object|null} Boss fish data
     */
    getBossDataForLocation(locationId) {
        const bossMap = {
            'beginner_fallen_tree': {
                id: 'ancient_bass_king',
                name: 'Ancient Bass King',
                rarity: 8,
                size: 12,
                weight: 15.5,
                aggressiveness: 9,
                elusiveness: 8,
                strength: 10,
                coinValue: 2500,
                experienceValue: 500,
                description: 'A legendary bass that has ruled these waters for decades',
                habitat: 'deep_structure',
                struggleStyle: 'boss_rampage'
            },
            'harbor_breakwater': {
                id: 'titan_striper',
                name: 'Titan Striper',
                rarity: 9,
                size: 18,
                weight: 35.2,
                aggressiveness: 10,
                elusiveness: 9,
                strength: 10,
                coinValue: 5000,
                experienceValue: 750,
                description: 'A massive striped bass that patrols the breakwater',
                habitat: 'saltwater_structure',
                struggleStyle: 'oceanic_fury'
            },
            'mountain_alpine_tarn': {
                id: 'golden_emperor',
                name: 'Golden Emperor Trout',
                rarity: 9,
                size: 8,
                weight: 4.8,
                aggressiveness: 7,
                elusiveness: 10,
                strength: 8,
                coinValue: 7500,
                experienceValue: 1000,
                description: 'The rarest golden trout, found only in pristine alpine waters',
                habitat: 'alpine_pristine',
                struggleStyle: 'ethereal_dance'
            },
            'midnight_void_drop': {
                id: 'void_leviathan',
                name: 'Void Leviathan',
                rarity: 10,
                size: 25,
                weight: 50.0,
                aggressiveness: 10,
                elusiveness: 10,
                strength: 10,
                coinValue: 15000,
                experienceValue: 2000,
                description: 'An otherworldly creature from the deepest darkness',
                habitat: 'mystical_abyss',
                struggleStyle: 'dimensional_chaos'
            },
            'championship_hall_of_fame': {
                id: 'champion_kraken',
                name: 'Champion Kraken',
                rarity: 10,
                size: 30,
                weight: 75.0,
                aggressiveness: 10,
                elusiveness: 10,
                strength: 10,
                coinValue: 25000,
                experienceValue: 5000,
                description: 'The ultimate fishing challenge - a legendary tournament beast',
                habitat: 'championship_arena',
                struggleStyle: 'legendary_battle'
            }
        };

        return bossMap[locationId] || null;
    }

    /**
     * Generate boss title
     * @param {string} baseName - Base fish name
     * @returns {string} Boss title
     */
    generateBossTitle(baseName) {
        const titles = [
            'The Legendary', 'The Ancient', 'The Mighty', 'The Colossal',
            'The Eternal', 'The Mythical', 'The Supreme', 'The Ultimate'
        ];
        
        const title = titles[Math.floor(Math.random() * titles.length)];
        return `${title} ${baseName}`;
    }

    /**
     * Generate unique fish ID
     * @returns {string} Unique identifier
     */
    generateFishId() {
        return `fish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get spawn statistics for location
     * @param {string} locationId - Location identifier
     * @returns {object} Spawn statistics
     */
    getLocationSpawnStats(locationId) {
        const location = getLocationById(locationId);
        if (!location) return null;

        const fishCount = location.fishPopulation.length;
        const isBossLocation = Object.values(this.bossLocations).includes(locationId);
        
        return {
            locationName: location.name,
            fishSpecies: fishCount,
            difficulty: location.difficulty,
            unlockLevel: location.unlockLevel,
            hasBoss: isBossLocation,
            environment: location.environment,
            uniqueFeatures: location.uniqueFeatures || []
        };
    }

    /**
     * Get all spawn locations summary
     * @returns {object} Complete spawn system summary
     */
    getSpawnSystemSummary() {
        const locations = Object.keys(LOCATION_DATA);
        const maps = {};
        let totalFishSpecies = 0;
        let totalBossLocations = 0;

        locations.forEach(locationId => {
            const location = getLocationById(locationId);
            const mapId = location.mapId;
            
            if (!maps[mapId]) {
                maps[mapId] = {
                    name: mapId,
                    locations: 0,
                    fishSpecies: 0,
                    bossLocations: 0,
                    difficulty: location.difficulty
                };
            }
            
            maps[mapId].locations++;
            maps[mapId].fishSpecies += location.fishPopulation.length;
            totalFishSpecies += location.fishPopulation.length;
            
            if (Object.values(this.bossLocations).includes(locationId)) {
                maps[mapId].bossLocations++;
                totalBossLocations++;
            }
        });

        return {
            totalLocations: locations.length,
            totalMaps: Object.keys(maps).length,
            totalFishSpecies,
            totalBossLocations,
            bossSpawnChance: this.bossSpawnChance,
            maps
        };
    }
} 