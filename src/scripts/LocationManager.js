// LocationManager.js - Centralized Location Management System
import { 
    LOCATION_DATA, 
    getLocationById, 
    getAllLocations, 
    getUnlockedLocations,
    getLocationsByMapId,
    getLocationsByDifficulty,
    getLocationsByEnvironment,
    getLocationsByFishSpecies,
    getLocationsByDifficultyRange,
    getLocationsByPlayerLevel,
    searchLocations,
    getLocationStatistics
} from '../data/LocationData.js';

export class LocationManager {
    constructor(gameState) {
        this.gameState = gameState;
        
        // Current location state
        this.currentLocationId = 'beginner_lake_dock'; // Start at beginner lake dock (new system)
        this.currentLocation = null;
        
        // Location progress tracking
        this.locationProgress = new Map();
        this.visitedLocations = new Set();
        this.unlockedLocations = new Set(['beginner_lake_dock']); // Always start with beginner lake dock
        
        // Travel system
        this.isTransitioning = false;
        this.transitionCallbacks = [];
        
        // Location-specific state
        this.locationStats = new Map();
        this.locationAchievements = new Map();
        
        // Events
        this.callbacks = {
            locationChanged: [],
            locationUnlocked: [],
            firstVisit: []
        };
        
        this.initialize();
    }
    
    initialize() {
        // Set up current location
        this.currentLocation = getLocationById(this.currentLocationId);
        this.visitedLocations.add(this.currentLocationId);
        
        // Initialize location progress for all locations
        getAllLocations().forEach(location => {
            this.initializeLocationProgress(location.id);
        });
        
            }
    
    initializeLocationProgress(locationId) {
        if (!this.locationProgress.has(locationId)) {
            this.locationProgress.set(locationId, {
                timesVisited: 0,
                timeSpent: 0,
                fishCaught: 0,
                speciesCaught: new Set(),
                bestFish: null,
                totalXpEarned: 0,
                achievementsUnlocked: [],
                lastVisited: null,
                masteryLevel: 0,
                masteryProgress: 0
            });
        }
        
        if (!this.locationStats.has(locationId)) {
            this.locationStats.set(locationId, {
                successfulCasts: 0,
                perfectCasts: 0,
                fishLost: 0,
                rareFishCaught: 0,
                totalCastingAccuracy: 0,
                castCount: 0,
                averageAccuracy: 0
            });
        }
    }
    
    // Location Access and Unlocking
    getCurrentLocation() {
        return this.currentLocation;
    }
    
    getCurrentLocationId() {
        return this.currentLocationId;
    }
    
    isLocationUnlocked(locationId) {
        return this.unlockedLocations.has(locationId);
    }
    
    getUnlockedLocationsList() {
        const playerLevel = this.gameState.player.level || 1;
        const achievements = this.gameState.playerProgression?.getUnlockedAchievements() || [];
        
        return getUnlockedLocations(playerLevel, achievements);
    }
    
    checkAndUnlockLocations() {
        try {
            const playerLevel = this.gameState.player.level || 1;
            const playerProgression = this.gameState.playerProgression;
            const achievements = playerProgression ? playerProgression.getUnlockedAchievements() : [];
            
            const newlyUnlocked = [];
            
            getAllLocations().forEach(location => {
                try {
                    if (!this.unlockedLocations.has(location.id)) {
                        // Check level requirement
                        if (playerLevel >= (location.unlockLevel || 1)) {
                            // Check achievement requirements with null safety
                            const unlockRequirements = location.unlockRequirements || [];
                            const hasRequiredAchievements = unlockRequirements.length === 0 || 
                                unlockRequirements.every(req => achievements.includes(req));
                            
                            if (hasRequiredAchievements) {
                                this.unlockLocation(location.id);
                                newlyUnlocked.push(location);
                            }
                        }
                    }
                } catch (locationError) {
                    console.error(`LocationManager: Error checking unlock for location ${location.id}:`, locationError);
                }
            });
            
            return newlyUnlocked;
        } catch (error) {
            console.error('LocationManager: Error in checkAndUnlockLocations:', error);
            return [];
        }
    }
    
    unlockLocation(locationId) {
        if (!this.unlockedLocations.has(locationId)) {
            this.unlockedLocations.add(locationId);
            const location = getLocationById(locationId);
            
            if (location) {
                console.log(`LocationManager: Unlocked location: ${location.name}`);
                
                // Trigger unlock callbacks
                this.callbacks.locationUnlocked.forEach(callback => {
                    try {
                        callback(location);
                    } catch (error) {
                        console.error('LocationManager: Error in location unlock callback:', error);
                    }
                });
                
                // Award exploration XP
                if (this.gameState.playerProgression) {
                    this.gameState.playerProgression.addExperience(100, 'location_unlock');
                }
                
                return true;
            }
        }
        return false;
    }
    
    // Travel System
    canTravelTo(locationId) {
        return this.isLocationUnlocked(locationId) && locationId !== this.currentLocationId && !this.isTransitioning;
    }
    
    async travelTo(locationId) {
        if (!this.canTravelTo(locationId)) {
            console.warn(`LocationManager: Cannot travel to ${locationId}`);
            return false;
        }
        
        const newLocation = getLocationById(locationId);
        if (!newLocation) {
            console.error(`LocationManager: Location ${locationId} not found`);
            return false;
        }
        
        this.isTransitioning = true;
        
        try {
            // Update location progress for current location
            this.updateLocationProgress();
            
            // Record travel
            const oldLocationId = this.currentLocationId;
            const oldLocation = this.currentLocation;
            
            // Update current location
            this.currentLocationId = locationId;
            this.currentLocation = newLocation;
            
            // Mark as visited
            const isFirstVisit = !this.visitedLocations.has(locationId);
            this.visitedLocations.add(locationId);
            
            // Update location progress
            const progress = this.locationProgress.get(locationId);
            progress.timesVisited++;
            progress.lastVisited = Date.now();
            
            console.log(`LocationManager: Traveled from ${oldLocation?.name} to ${newLocation.name}`);
            
            // Trigger callbacks
            this.callbacks.locationChanged.forEach(callback => {
                try {
                    callback(oldLocation, newLocation);
                } catch (error) {
                    console.error('LocationManager: Error in location change callback:', error);
                }
            });
            
            if (isFirstVisit) {
                this.callbacks.firstVisit.forEach(callback => {
                    try {
                        callback(newLocation);
                    } catch (error) {
                        console.error('LocationManager: Error in first visit callback:', error);
                    }
                });
                
                // Award exploration XP for first visit
                if (this.gameState.playerProgression) {
                    this.gameState.playerProgression.addExperience(150, 'location_discovery');
                }
            }
            
            // Update weather and time for new location
            this.updateLocationEnvironment();
            
            this.isTransitioning = false;
            return true;
            
        } catch (error) {
            console.error('LocationManager: Error during travel:', error);
            this.isTransitioning = false;
            return false;
        }
    }
    
    updateLocationEnvironment() {
        // Update weather manager with location-specific patterns
        if (this.gameState.weatherManager && this.currentLocation) {
            this.gameState.weatherManager.setLocationWeatherPatterns(
                this.currentLocation.id,
                this.currentLocation.weatherPatterns
            );
        }
        
        // Update any location-specific environmental effects
        if (this.gameState.scene && this.gameState.scene.updateLocationVisuals) {
            this.gameState.scene.updateLocationVisuals(this.currentLocation);
        }
    }
    
    // Progress Tracking
    updateLocationProgress() {
        if (!this.currentLocationId) return;
        
        const progress = this.locationProgress.get(this.currentLocationId);
        if (progress) {
            // Time tracking would be updated elsewhere during gameplay
            // This is called when leaving a location
        }
    }
    
    recordFishCaught(fish, xpEarned = 0) {
        if (!this.currentLocationId) return;
        
        const progress = this.locationProgress.get(this.currentLocationId);
        const stats = this.locationStats.get(this.currentLocationId);
        
        if (progress && fish) {
            progress.fishCaught++;
            progress.speciesCaught.add(fish.species || fish.name);
            progress.totalXpEarned += xpEarned;
            
            // Update best fish
            if (!progress.bestFish || (fish.rarity > progress.bestFish.rarity)) {
                progress.bestFish = { ...fish };
            }
            
            // Update mastery progress
            this.updateMasteryProgress(this.currentLocationId);
        }
        
        if (stats && fish) {
            if (fish.rarity >= 3) { // Rare or better
                stats.rareFishCaught++;
            }
        }
    }
    
    recordCastingStats(accuracy, isPerfect = false) {
        if (!this.currentLocationId) return;
        
        const stats = this.locationStats.get(this.currentLocationId);
        if (stats) {
            stats.castCount++;
            stats.totalCastingAccuracy += accuracy;
            stats.averageAccuracy = stats.totalCastingAccuracy / stats.castCount;
            
            if (isPerfect) {
                stats.perfectCasts++;
            }
            if (accuracy >= 0.8) {
                stats.successfulCasts++;
            }
        }
    }
    
    recordFishLost() {
        if (!this.currentLocationId) return;
        
        const stats = this.locationStats.get(this.currentLocationId);
        if (stats) {
            stats.fishLost++;
        }
    }
    
    updateMasteryProgress(locationId) {
        const progress = this.locationProgress.get(locationId);
        const stats = this.locationStats.get(locationId);
        const location = getLocationById(locationId);
        
        if (!progress || !stats || !location) return;
        
        // Calculate mastery based on various factors
        let masteryPoints = 0;
        
        // Fish caught contributes to mastery
        masteryPoints += progress.fishCaught * 2;
        
        // Species variety
        masteryPoints += progress.speciesCaught.size * 10;
        
        // Casting accuracy
        masteryPoints += stats.averageAccuracy * 50;
        
        // Perfect casts
        masteryPoints += stats.perfectCasts * 5;
        
        // Rare fish bonus
        masteryPoints += stats.rareFishCaught * 15;
        
        // Time spent (converted from milliseconds to hours)
        masteryPoints += (progress.timeSpent / (1000 * 60 * 60)) * 3;
        
        // Calculate mastery level (every 100 points = 1 level, max 10)
        const newLevel = Math.min(Math.floor(masteryPoints / 100), 10);
        const newProgress = (masteryPoints % 100) / 100;
        
        if (newLevel > progress.masteryLevel) {
            const oldLevel = progress.masteryLevel;
            progress.masteryLevel = newLevel;
            console.log(`LocationManager: ${location.name} mastery increased to level ${newLevel}`);
            
            // Award mastery achievement
            if (this.gameState.playerProgression) {
                this.gameState.playerProgression.addExperience(25 * newLevel, 'location_mastery');
            }
        }
        
        progress.masteryProgress = newProgress;
    }
    
    // Location Information
    getLocationProgress(locationId) {
        return this.locationProgress.get(locationId) || null;
    }
    
    getLocationStats(locationId) {
        return this.locationStats.get(locationId) || null;
    }
    
    getLocationInfo(locationId) {
        const location = getLocationById(locationId);
        const progress = this.getLocationProgress(locationId);
        const stats = this.getLocationStats(locationId);
        
        return {
            location,
            progress,
            stats,
            isUnlocked: this.isLocationUnlocked(locationId),
            isVisited: this.visitedLocations.has(locationId),
            isCurrent: locationId === this.currentLocationId
        };
    }
    
    // Location Effects
    getLocationFishingModifiers() {
        if (!this.currentLocation) return {};
        
        const baseModifiers = this.currentLocation.fishingModifiers || {};
        const masteryProgress = this.locationProgress.get(this.currentLocationId);
        
        // Apply mastery bonuses
        if (masteryProgress && masteryProgress.masteryLevel > 0) {
            const masteryBonus = masteryProgress.masteryLevel * 0.02; // 2% per mastery level
            return {
                ...baseModifiers,
                biteRate: (baseModifiers.biteRate || 1.0) * (1 + masteryBonus),
                experienceBonus: (baseModifiers.experienceBonus || 1.0) * (1 + masteryBonus * 0.5)
            };
        }
        
        return baseModifiers;
    }
    
    getLocationWeatherEffects(weatherType) {
        if (!this.currentLocation || !weatherType) return {};
        
        return this.currentLocation.weatherEffects?.[weatherType] || {};
    }
    
    getLocationFishPopulation() {
        return this.currentLocation?.fishPopulation || [];
    }
    
    // Event System
    onLocationChanged(callback) {
        this.callbacks.locationChanged.push(callback);
    }
    
    onLocationUnlocked(callback) {
        this.callbacks.locationUnlocked.push(callback);
    }
    
    onFirstVisit(callback) {
        this.callbacks.firstVisit.push(callback);
    }
    
    // Save/Load System
    getSaveData() {
        return {
            currentLocationId: this.currentLocationId,
            unlockedLocations: Array.from(this.unlockedLocations),
            visitedLocations: Array.from(this.visitedLocations),
            locationProgress: Object.fromEntries(
                Array.from(this.locationProgress.entries()).map(([key, value]) => [
                    key,
                    {
                        ...value,
                        speciesCaught: Array.from(value.speciesCaught)
                    }
                ])
            ),
            locationStats: Object.fromEntries(this.locationStats.entries())
        };
    }
    
    loadSaveData(saveData) {
        if (!saveData) return;
        
        try {
            this.currentLocationId = saveData.currentLocationId || 'beginner_lake_dock';
            this.currentLocation = getLocationById(this.currentLocationId);
            
            this.unlockedLocations = new Set(saveData.unlockedLocations || ['beginner_lake_dock']);
            this.visitedLocations = new Set(saveData.visitedLocations || [this.currentLocationId]);
            
            // Load location progress
            this.locationProgress.clear();
            if (saveData.locationProgress) {
                Object.entries(saveData.locationProgress).forEach(([locationId, progress]) => {
                    this.locationProgress.set(locationId, {
                        ...progress,
                        speciesCaught: new Set(progress.speciesCaught || [])
                    });
                });
            }
            
            // Load location stats
            this.locationStats.clear();
            if (saveData.locationStats) {
                Object.entries(saveData.locationStats).forEach(([locationId, stats]) => {
                    this.locationStats.set(locationId, stats);
                });
            }
            
            // Ensure all locations have progress entries
            getAllLocations().forEach(location => {
                this.initializeLocationProgress(location.id);
            });
            
            console.log('LocationManager: Save data loaded successfully');
        } catch (error) {
            console.error('LocationManager: Error loading save data:', error);
            this.initialize(); // Fallback to initialization
        }
    }
    
    // Enhanced Location Discovery and Search
    
    /**
     * Find locations suitable for the player's current level and skills
     * @param {number} levelRange - How many levels above/below to include
     * @returns {Array} Array of suitable locations
     */
    getSuitableLocations(levelRange = 2) {
        const playerLevel = this.gameState.player.level || 1;
        return getLocationsByPlayerLevel(playerLevel, levelRange)
            .filter(location => this.isLocationUnlocked(location.id));
    }
    
    /**
     * Find locations that contain specific fish species
     * @param {string} fishSpecies - The fish species to search for
     * @returns {Array} Array of locations containing the fish
     */
    getLocationsWithFish(fishSpecies) {
        return getLocationsByFishSpecies(fishSpecies)
            .filter(location => this.isLocationUnlocked(location.id));
    }
    
    /**
     * Search for locations by name or description
     * @param {string} searchTerm - The search term
     * @returns {Array} Array of matching locations
     */
    searchAvailableLocations(searchTerm) {
        return searchLocations(searchTerm)
            .filter(location => this.isLocationUnlocked(location.id));
    }
    
    /**
     * Get locations by environment type that are unlocked
     * @param {string} environment - Environment type
     * @returns {Array} Array of unlocked locations in that environment
     */
    getUnlockedLocationsByEnvironment(environment) {
        return getLocationsByEnvironment(environment)
            .filter(location => this.isLocationUnlocked(location.id));
    }
    
    /**
     * Get locations within a difficulty range that are unlocked
     * @param {number} minDifficulty - Minimum difficulty
     * @param {number} maxDifficulty - Maximum difficulty
     * @returns {Array} Array of unlocked locations in difficulty range
     */
    getUnlockedLocationsByDifficultyRange(minDifficulty, maxDifficulty) {
        return getLocationsByDifficultyRange(minDifficulty, maxDifficulty)
            .filter(location => this.isLocationUnlocked(location.id));
    }
    
    /**
     * Get all locations in the same map as current location
     * @returns {Array} Array of locations in current map
     */
    getCurrentMapLocations() {
        if (!this.currentLocation) return [];
        return getLocationsByMapId(this.currentLocation.mapId)
            .filter(location => this.isLocationUnlocked(location.id));
    }
    
    /**
     * Get recommended next locations based on player progress
     * @returns {Array} Array of recommended locations
     */
    getRecommendedLocations() {
        const playerLevel = this.gameState.player.level || 1;
        const currentDifficulty = this.currentLocation?.difficulty || 1;
        
        // Get locations slightly above current difficulty
        const nextDifficultyLocations = this.getUnlockedLocationsByDifficultyRange(
            currentDifficulty, 
            currentDifficulty + 2
        );
        
        // Get locations suitable for player level
        const levelSuitableLocations = this.getSuitableLocations(1);
        
        // Combine and deduplicate
        const recommended = new Map();
        
        [...nextDifficultyLocations, ...levelSuitableLocations].forEach(location => {
            if (!recommended.has(location.id) && location.id !== this.currentLocationId) {
                recommended.set(location.id, location);
            }
        });
        
        return Array.from(recommended.values()).slice(0, 5); // Top 5 recommendations
    }
    
    /**
     * Get location statistics and analytics
     * @returns {Object} Comprehensive location statistics
     */
    getLocationAnalytics() {
        const baseStats = getLocationStatistics();
        const playerStats = {
            unlockedCount: this.unlockedLocations.size,
            visitedCount: this.visitedLocations.size,
            currentLocation: this.currentLocation?.name || 'None',
            masteryLevels: {},
            totalFishCaught: 0,
            totalTimeSpent: 0
        };
        
        // Calculate mastery and progress stats
        this.locationProgress.forEach((progress, locationId) => {
            const location = getLocationById(locationId);
            if (location) {
                playerStats.masteryLevels[location.name] = progress.masteryLevel;
                playerStats.totalFishCaught += progress.fishCaught;
                playerStats.totalTimeSpent += progress.timeSpent;
            }
        });
        
        return {
            ...baseStats,
            player: playerStats
        };
    }
    
    /**
     * Get location completion percentage
     * @param {string} locationId - Location to check
     * @returns {number} Completion percentage (0-100)
     */
    getLocationCompletionPercentage(locationId) {
        const location = getLocationById(locationId);
        const progress = this.locationProgress.get(locationId);
        
        if (!location || !progress) return 0;
        
        let completionFactors = 0;
        let maxFactors = 0;
        
        // Mastery level (0-10)
        completionFactors += progress.masteryLevel;
        maxFactors += 10;
        
        // Species variety (percentage of available species caught)
        if (location.fishPopulation && location.fishPopulation.length > 0) {
            const speciesCaughtPercent = (progress.speciesCaught.size / location.fishPopulation.length) * 10;
            completionFactors += Math.min(speciesCaughtPercent, 10);
            maxFactors += 10;
        }
        
        // Visit frequency (capped at 10 visits = 100%)
        completionFactors += Math.min(progress.timesVisited, 10);
        maxFactors += 10;
        
        return maxFactors > 0 ? Math.round((completionFactors / maxFactors) * 100) : 0;
    }
    
    /**
     * Get locations that need more exploration
     * @param {number} completionThreshold - Minimum completion percentage (default: 50)
     * @returns {Array} Array of locations needing exploration
     */
    getLocationsNeedingExploration(completionThreshold = 50) {
        return Array.from(this.visitedLocations)
            .map(locationId => ({
                location: getLocationById(locationId),
                completion: this.getLocationCompletionPercentage(locationId)
            }))
            .filter(item => item.completion < completionThreshold)
            .sort((a, b) => a.completion - b.completion)
            .map(item => item.location);
    }

    // Cleanup
    destroy() {
        this.callbacks.locationChanged = [];
        this.callbacks.locationUnlocked = [];
        this.callbacks.firstVisit = [];
        this.transitionCallbacks = [];
    }
} 