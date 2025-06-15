// LocationData.js - Location Utility Functions
// This file contains utility functions for location management
// Location data is now stored in locations.json

import locationsData from './locations.json';

// Extract location data from JSON
const LOCATION_DATA = locationsData.locations;

// Utility Functions for Location Management

/**
 * Get a specific location by its ID
 * @param {string} locationId - The unique identifier for the location
 * @returns {Object|null} The location object or null if not found
 */
export function getLocationById(locationId) {
    return LOCATION_DATA[locationId] || null;
}

/**
 * Get all available locations as an array
 * @returns {Array} Array of all location objects with their IDs included
 */
export function getAllLocations() {
    return Object.entries(LOCATION_DATA).map(([id, location]) => ({
        id,
        ...location
    }));
}

/**
 * Get locations that are unlocked for the player based on level and achievements
 * @param {number} playerLevel - Current player level
 * @param {Array} achievements - Array of unlocked achievement IDs
 * @returns {Array} Array of unlocked location objects
 */
export function getUnlockedLocations(playerLevel, achievements = []) {
    return getAllLocations().filter(location => {
        // Check level requirement
        if (playerLevel < (location.unlockLevel || 1)) {
            return false;
        }
        
        // Check achievement requirements
        const unlockRequirements = location.unlockRequirements || [];
        if (unlockRequirements.length > 0) {
            return unlockRequirements.every(req => achievements.includes(req));
        }
        
        return true;
    });
}

/**
 * Get all locations within a specific map/region
 * @param {string} mapId - The map identifier
 * @returns {Array} Array of locations in the specified map
 */
export function getLocationsByMapId(mapId) {
    return getAllLocations().filter(location => location.mapId === mapId);
}

/**
 * Get locations by difficulty level
 * @param {number} difficulty - The difficulty level to filter by
 * @returns {Array} Array of locations with the specified difficulty
 */
export function getLocationsByDifficulty(difficulty) {
    return getAllLocations().filter(location => location.difficulty === difficulty);
}

/**
 * Get locations by environment type
 * @param {string} environment - The environment type (freshwater, saltwater, etc.)
 * @returns {Array} Array of locations with the specified environment
 */
export function getLocationsByEnvironment(environment) {
    return getAllLocations().filter(location => location.environment === environment);
}

/**
 * Get locations that contain a specific fish species
 * @param {string} fishSpecies - The fish species to search for
 * @returns {Array} Array of locations that contain the specified fish
 */
export function getLocationsByFishSpecies(fishSpecies) {
    return getAllLocations().filter(location => 
        location.fishPopulation && location.fishPopulation.includes(fishSpecies)
    );
}

/**
 * Get locations within a difficulty range
 * @param {number} minDifficulty - Minimum difficulty level
 * @param {number} maxDifficulty - Maximum difficulty level
 * @returns {Array} Array of locations within the difficulty range
 */
export function getLocationsByDifficultyRange(minDifficulty, maxDifficulty) {
    return getAllLocations().filter(location => 
        location.difficulty >= minDifficulty && location.difficulty <= maxDifficulty
    );
}

/**
 * Get locations suitable for a player level range
 * @param {number} playerLevel - Current player level
 * @param {number} levelRange - How many levels above/below to include (default: 2)
 * @returns {Array} Array of locations suitable for the player level
 */
export function getLocationsByPlayerLevel(playerLevel, levelRange = 2) {
    const minLevel = Math.max(1, playerLevel - levelRange);
    const maxLevel = playerLevel + levelRange;
    
    return getAllLocations().filter(location => 
        location.unlockLevel >= minLevel && location.unlockLevel <= maxLevel
    );
}

/**
 * Search locations by name or description
 * @param {string} searchTerm - The term to search for
 * @returns {Array} Array of locations matching the search term
 */
export function searchLocations(searchTerm) {
    const term = searchTerm.toLowerCase();
    return getAllLocations().filter(location => 
        location.name.toLowerCase().includes(term) ||
        location.description.toLowerCase().includes(term)
    );
}

/**
 * Get location statistics for analysis
 * @returns {Object} Statistics about all locations
 */
export function getLocationStatistics() {
    const locations = getAllLocations();
    
    return {
        totalLocations: locations.length,
        byEnvironment: locations.reduce((acc, loc) => {
            acc[loc.environment] = (acc[loc.environment] || 0) + 1;
            return acc;
        }, {}),
        byDifficulty: locations.reduce((acc, loc) => {
            acc[loc.difficulty] = (acc[loc.difficulty] || 0) + 1;
            return acc;
        }, {}),
        byMapId: locations.reduce((acc, loc) => {
            acc[loc.mapId] = (acc[loc.mapId] || 0) + 1;
            return acc;
        }, {}),
        averageDifficulty: locations.reduce((sum, loc) => sum + loc.difficulty, 0) / locations.length,
        unlockLevelRange: {
            min: Math.min(...locations.map(loc => loc.unlockLevel)),
            max: Math.max(...locations.map(loc => loc.unlockLevel))
        }
    };
}

// Export the location data for backward compatibility
export { LOCATION_DATA };