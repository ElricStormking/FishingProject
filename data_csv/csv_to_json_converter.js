// CSV to JSON converter for Luxury Angler data files
// Usage: node csv_to_json_converter.js
// Converts all CSV files back to original JSON structure

const fs = require('fs');
const path = require('path');

// Helper function to read and parse CSV
function parseCSV(filename) {
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const row = {};
        const values = lines[i].split(',');
        
        for (let j = 0; j < headers.length; j++) {
            const value = values[j]?.trim().replace(/\r/g, '');
            if (value && value !== '') {
                // Don't parse hex values as numbers
                if (value.startsWith('0x')) {
                    row[headers[j]] = value;
                } else if (!isNaN(value) && !isNaN(parseFloat(value))) {
                    // Try to parse as number if it looks like one
                    row[headers[j]] = parseFloat(value);
                } else {
                    row[headers[j]] = value;
                }
            }
        }
        data.push(row);
    }
    
    return data;
}

// Convert player attributes back to attributes.json
function convertPlayerAttributes() {
    const data = parseCSV('player_attributes.csv');
    const attributes = {
        playerAttributes: {
            fishing: {},
            core: {},
            skill: {},
            equipment: {},
            social: {},
            crafting: {},
            automation: {},
            travel: {},
            economy: {},
            survival: {},
            storage: {}
        },
        // Add required fishAttributes section for DataLoader validation
        fishAttributes: {
            aggressiveness: { min: 1, max: 10 },
            elusiveness: { min: 1, max: 10 },
            strength: { min: 1, max: 10 },
            size: { min: 1, max: 10 },
            speed: { min: 1, max: 10 },
            endurance: { min: 1, max: 10 },
            depthPreference: { min: 1, max: 10 },
            baitPreference: { min: 1, max: 10 }
        },
        // Add required attributeModifiers section for DataLoader validation
        attributeModifiers: {
            weatherEffects: {
                sunny: { biteRate: 1.1, fishDetection: 1.0 },
                cloudy: { biteRate: 1.0, fishDetection: 1.1 },
                rainy: { biteRate: 0.9, fishDetection: 1.2 },
                storm: { biteRate: 0.7, fishDetection: 1.3 }
            },
            timeEffects: {
                dawn: { biteRate: 1.2, fishDetection: 1.1 },
                morning: { biteRate: 1.1, fishDetection: 1.0 },
                afternoon: { biteRate: 1.0, fishDetection: 1.0 },
                evening: { biteRate: 1.1, fishDetection: 1.2 },
                dusk: { biteRate: 1.2, fishDetection: 1.1 },
                night: { biteRate: 0.8, fishDetection: 1.3 }
            },
            depthEffects: {
                shallow: { fishDetection: 1.2, rareFishChance: 0.8 },
                mid: { fishDetection: 1.0, rareFishChance: 1.0 },
                deep: { fishDetection: 0.9, rareFishChance: 1.3 }
            }
        }
    };
    
    data.forEach(attr => {
        const category = attr.category;
        if (!attributes.playerAttributes[category]) {
            attributes.playerAttributes[category] = {};
        }
        
        attributes.playerAttributes[category][attr.attribute_id] = {
            name: attr.attribute_name,
            category: attr.category,
            description: attr.description,
            baseValue: attr.base_value || undefined,
            maxValue: attr.max_value || undefined,
            improvementPerLevel: attr.improvement_per_level || undefined,
            maxLevelBonus: attr.max_level_bonus || undefined,
            unit: attr.unit || undefined
        };
    });
    
    fs.writeFileSync('../src/data/attributes.json', JSON.stringify(attributes, null, 2));
    console.log('✓ Converted attributes.json');
}

// Convert fish species back to fish.json
function convertFishSpecies() {
    const data = parseCSV('fish_species.csv');
    
    // Get struggle patterns data to include as struggle styles
    const strugglePatternsData = JSON.parse(fs.readFileSync('../src/data/strugglePatterns.json', 'utf8'));
    
    const fishData = {
        fishSpecies: data.map(fish => ({
            id: fish.fish_id,
            name: fish.fish_name,
            rarity: fish.rarity,
            size: fish.size,
            aggressiveness: fish.aggressiveness,
            elusiveness: fish.elusiveness,
            strength: fish.strength,
            weight: fish.weight,
            speed: fish.speed,
            depthPreference: fish.depth_preference,
            baitPreference: fish.bait_preference,
            endurance: fish.endurance,
            activeTimePeriod: [fish.active_time_1, fish.active_time_2, fish.active_time_3].filter(t => t),
            weatherPreference: fish.weather_preference ? fish.weather_preference.split('|') : [],
            coinValue: fish.coin_value,
            experienceValue: fish.xp_value,
            description: fish.description,
            habitat: fish.habitat,
            struggleStyle: fish.struggle_style
        })),
        
        // Include struggle styles for FishDatabase compatibility
        struggleStyles: strugglePatternsData.strugglePatterns.map(pattern => ({
            id: pattern.id,
            name: pattern.name,
            description: pattern.description,
            intensityPattern: 'variable', // Default pattern
            qteTypes: ['DASH', 'THRASH'], // Default QTE types
            patterns: pattern.patterns
        }))
    };
    
    fs.writeFileSync('../src/data/fish.json', JSON.stringify(fishData, null, 2));
    console.log('✓ Converted fish.json');
}

// Convert equipment files back to equipment.json
function convertEquipment() {
    const rods = parseCSV('fishing_rods.csv');
    const boats = parseCSV('boats.csv');
    const clothing = parseCSV('clothing.csv');
    const lures = parseCSV('lures.csv');
    
    const equipment = {
        fishingRods: rods.map(rod => ({
            id: rod.rod_id,
            name: rod.rod_name,
            rarity: rod.rarity,
            equipSlot: rod.equip_slot,
            stats: {
                castAccuracy: rod.cast_accuracy,
                tensionStability: rod.tension_stability,
                rareFishChance: rod.rare_fish_chance,
                castingRange: rod.casting_range,
                reelSpeed: rod.reel_speed,
                struggleResistance: rod.struggle_resistance
            },
            cost: rod.cost,
            craftingMaterials: [rod.crafting_material_1, rod.crafting_material_2].filter(m => m),
            craftingTime: rod.crafting_time,
            description: rod.description,
            unlockLevel: rod.unlock_level
        })),
        
        boats: boats.map(boat => ({
            id: boat.boat_id,
            name: boat.boat_name,
            rarity: boat.rarity,
            equipSlot: boat.equip_slot,
            stats: {
                craftingEfficiency: boat.crafting_efficiency,
                autoFishingYield: boat.auto_fishing_yield,
                fishDetection: boat.fish_detection,
                hotspotStability: boat.hotspot_stability,
                companionSlots: boat.companion_slots,
                autoFishingEfficiency: boat.auto_fishing_efficiency,
                boatDurability: boat.boat_durability,
                fishtankStorage: boat.fishtank_storage
            },
            cost: boat.cost,
            craftingMaterials: [boat.crafting_material_1, boat.crafting_material_2, boat.crafting_material_3].filter(m => m),
            craftingTime: boat.crafting_time,
            description: boat.description,
            unlockLevel: boat.unlock_level
        })),
        
        clothing: clothing.map(item => ({
            id: item.clothing_id,
            name: item.clothing_name,
            rarity: item.rarity,
            equipSlot: item.equip_slot,
            stats: {
                [item.stat_1_name]: item.stat_1_value,
                [item.stat_2_name]: item.stat_2_value,
                [item.stat_3_name]: item.stat_3_value,
                [item.stat_4_name]: item.stat_4_value
            },
            cost: item.cost,
            craftingMaterials: [item.crafting_material_1, item.crafting_material_2].filter(m => m),
            craftingTime: item.crafting_time,
            description: item.description,
            unlockLevel: item.unlock_level
        })),
        
        lures: lures.map(lure => ({
            id: lure.lure_id,
            name: lure.lure_name,
            lureType: lure.lure_type,
            rarity: lure.rarity,
            equipSlot: lure.equip_slot,
            stats: {
                biteRate: lure.bite_rate,
                lureSuccess: lure.lure_success,
                durability: lure.durability,
                precision: lure.precision
            },
            cost: lure.cost,
            craftingMaterials: [lure.crafting_material_1, lure.crafting_material_2].filter(m => m),
            craftingTime: lure.crafting_time,
            description: lure.description,
            unlockLevel: lure.unlock_level
        }))
    };
    
    fs.writeFileSync('../src/data/equipment.json', JSON.stringify(equipment, null, 2));
    console.log('✓ Converted equipment.json');
}

// Convert locations back to LocationData.js
function convertLocations() {
    const data = parseCSV('locations.csv');
    const locationData = {};
    
    data.forEach(loc => {
        locationData[loc.location_id] = {
            name: loc.location_name,
            mapId: loc.map_id,
            spotNumber: loc.spot_number,
            description: loc.description,
            environment: loc.environment,
            difficulty: loc.difficulty,
            unlockLevel: loc.unlock_level,
            fishingModifiers: {
                biteRate: loc.bite_rate_mod,
                lineStrength: loc.line_strength_mod,
                castDistance: loc.cast_distance_mod,
                lureEffectiveness: loc.lure_effectiveness_mod,
                experienceBonus: loc.xp_bonus_mod
            },
            fishPopulation: [
                loc.fish_population_1,
                loc.fish_population_2,
                loc.fish_population_3,
                loc.fish_population_4,
                loc.fish_population_5
            ].filter(f => f),
            uniqueFeatures: [
                loc.unique_feature_1,
                loc.unique_feature_2,
                loc.unique_feature_3
            ].filter(f => f)
        };
    });
    
    const jsContent = `// Location data for Luxury Angler
export const LOCATION_DATA = ${JSON.stringify(locationData, null, 2)};

// Utility functions for location management
export function getLocationById(locationId) {
    return LOCATION_DATA[locationId] ? { id: locationId, ...LOCATION_DATA[locationId] } : null;
}

export function getAllLocations() {
    return Object.keys(LOCATION_DATA).map(id => ({ id, ...LOCATION_DATA[id] }));
}

export function getUnlockedLocations(playerLevel, achievements = []) {
    return getAllLocations().filter(location => {
        // Check level requirement
        if (playerLevel < (location.unlockLevel || 1)) {
            return false;
        }
        
        // Check achievement requirements (if any)
        const unlockRequirements = location.unlockRequirements || [];
        if (unlockRequirements.length > 0) {
            return unlockRequirements.every(req => achievements.includes(req));
        }
        
        return true;
    });
}

export function getLocationsByMapId(mapId) {
    return getAllLocations().filter(location => location.mapId === mapId);
}

export function getLocationsByDifficulty(difficulty) {
    return getAllLocations().filter(location => location.difficulty === difficulty);
}

export function getLocationsByEnvironment(environment) {
    return getAllLocations().filter(location => location.environment === environment);
}`;
    
    fs.writeFileSync('../src/data/LocationData.js', jsContent);
    console.log('✓ Converted LocationData.js');
}

// Convert game config to JSON
function convertGameConfig() {
    const data = parseCSV('game_config.csv');
    const config = {};
    
    data.forEach(item => {
        if (!config[item.config_category]) {
            config[item.config_category] = {};
        }
        
        let value = item.config_value;
        
        // Convert values to proper types
        if (typeof value === 'string' && value.startsWith('0x')) {
            // Hex color - keep as string for now, GameScene will parse it
            value = value;
        } else if (!isNaN(value) && value !== '' && value !== null && value !== undefined) {
            // Numeric value
            value = String(value).includes('.') ? parseFloat(value) : parseInt(value);
        }
        // Otherwise keep as string
        
        config[item.config_category][item.config_name] = value;
    });
    
    fs.writeFileSync('../src/data/gameConfig.json', JSON.stringify(config, null, 2));
    console.log('✓ Converted gameConfig.json');
}

// Convert lure types to JSON
function convertLureTypes() {
    const data = parseCSV('lure_types.csv');
    const lureTypes = {
        lureTypes: data.map(type => ({
            id: type.lure_type_id,
            name: type.lure_type_name,
            controlScheme: type.control_scheme,
            description: type.description,
            baseAttraction: type.base_attraction,
            preferredDepths: [
                type.preferred_depth_1,
                type.preferred_depth_2,
                type.preferred_depth_3,
                type.preferred_depth_4
            ].filter(d => d),
            effectiveAgainst: [
                type.effective_against_1,
                type.effective_against_2,
                type.effective_against_3
            ].filter(f => f)
        }))
    };
    
    fs.writeFileSync('../src/data/lureTypes.json', JSON.stringify(lureTypes, null, 2));
    console.log('✓ Converted lureTypes.json');
}

// Convert struggle patterns to JSON
function convertStrugglePatterns() {
    const data = parseCSV('struggle_patterns.csv');
    const patterns = {
        strugglePatterns: data.map(pattern => ({
            id: pattern.struggle_id,
            name: pattern.struggle_name,
            description: pattern.description,
            patterns: [
                {
                    direction: pattern.pattern_1_direction,
                    intensity: pattern.pattern_1_intensity,
                    duration: pattern.pattern_1_duration
                },
                pattern.pattern_2_direction ? {
                    direction: pattern.pattern_2_direction,
                    intensity: pattern.pattern_2_intensity,
                    duration: pattern.pattern_2_duration
                } : null,
                pattern.pattern_3_direction ? {
                    direction: pattern.pattern_3_direction,
                    intensity: pattern.pattern_3_intensity,
                    duration: pattern.pattern_3_duration
                } : null,
                pattern.pattern_4_direction ? {
                    direction: pattern.pattern_4_direction,
                    intensity: pattern.pattern_4_intensity,
                    duration: pattern.pattern_4_duration
                } : null
            ].filter(p => p)
        }))
    };
    
    fs.writeFileSync('../src/data/strugglePatterns.json', JSON.stringify(patterns, null, 2));
    console.log('✓ Converted strugglePatterns.json');
}

// Convert reference files to JSON
function convertReferenceFiles() {
    // Rarity reference
    const rarityData = parseCSV('rarity_reference.csv');
    const rarity = {
        rarityLevels: rarityData.map(r => ({
            level: r.rarity_level,
            name: r.rarity_name,
            color: r.rarity_color,
            description: r.description,
            coinMultiplier: r.coin_multiplier,
            xpMultiplier: r.xp_multiplier,
            spawnChanceModifier: r.spawn_chance_modifier
        }))
    };
    fs.writeFileSync('../src/data/rarityReference.json', JSON.stringify(rarity, null, 2));
    
    // Weather modifiers
    const weatherData = parseCSV('weather_modifiers.csv');
    const weather = {
        weatherModifiers: weatherData.map(w => ({
            type: w.weather_type,
            fishDetectionMod: w.fish_detection_mod,
            biteRateMod: w.bite_rate_mod,
            visibilityMod: w.visibility_mod,
            rareFishChanceMod: w.rare_fish_chance_mod,
            description: w.description
        }))
    };
    fs.writeFileSync('../src/data/weatherModifiers.json', JSON.stringify(weather, null, 2));
    
    // Time modifiers
    const timeData = parseCSV('time_modifiers.csv');
    const time = {
        timeModifiers: timeData.map(t => ({
            period: t.time_period,
            biteRateMod: t.bite_rate_mod,
            rareFishChanceMod: t.rare_fish_chance_mod,
            fishDetectionMod: t.fish_detection_mod,
            description: t.description
        }))
    };
    fs.writeFileSync('../src/data/timeModifiers.json', JSON.stringify(time, null, 2));
    
    console.log('✓ Converted reference files');
}

// Main conversion
console.log('Converting CSV files to JSON...\n');

try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync('../src/data')) {
        fs.mkdirSync('../src/data', { recursive: true });
    }
    
    // Convert struggle patterns FIRST so fish conversion can use it
    convertStrugglePatterns();
    convertPlayerAttributes();
    convertFishSpecies();
    convertEquipment();
    convertLocations();
    convertGameConfig();
    convertLureTypes();
    convertReferenceFiles();
    
    console.log('\n✅ All CSV to JSON conversions complete!');
    console.log('\nConverted files:');
    console.log('- ../src/data/attributes.json');
    console.log('- ../src/data/fish.json');
    console.log('- ../src/data/equipment.json');
    console.log('- ../src/data/LocationData.js');
    console.log('- ../src/data/gameConfig.json');
    console.log('- ../src/data/lureTypes.json');
    console.log('- ../src/data/strugglePatterns.json');
    console.log('- ../src/data/rarityReference.json');
    console.log('- ../src/data/weatherModifiers.json');
    console.log('- ../src/data/timeModifiers.json');
} catch (error) {
    console.error('❌ Error during conversion:', error.message);
    console.error(error.stack);
} 