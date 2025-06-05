// Simple JSON to CSV converter for Luxury Angler data files
// Usage: node json_to_csv_converter.js

const fs = require('fs');
const path = require('path');

// Convert player attributes
function convertPlayerAttributes() {
    const data = JSON.parse(fs.readFileSync('../src/data/attributes.json', 'utf8'));
    let csv = 'attribute_id,attribute_name,category,description,base_value,max_value,improvement_per_level,max_level_bonus,unit\n';
    
    // Process all attribute categories
    Object.entries(data.playerAttributes).forEach(([category, attributes]) => {
        Object.entries(attributes).forEach(([id, attr]) => {
            csv += `${id},${attr.name},${attr.category},${attr.description},${attr.baseValue || ''},${attr.maxValue || ''},${attr.improvementPerLevel || ''},${attr.maxLevelBonus || ''},${attr.unit || ''}\n`;
        });
    });
    
    fs.writeFileSync('player_attributes.csv', csv);
    console.log('✓ Converted player_attributes.csv');
}

// Convert fish species
function convertFishSpecies() {
    const data = JSON.parse(fs.readFileSync('../src/data/fish.json', 'utf8'));
    let csv = 'fish_id,fish_name,rarity,size,aggressiveness,elusiveness,strength,weight,speed,depth_preference,bait_preference,endurance,active_time_1,active_time_2,active_time_3,weather_preference,coin_value,xp_value,description,habitat,struggle_style\n';
    
    data.fishSpecies.forEach(fish => {
        const activeTimes = fish.activeTimePeriod || [];
        const weatherPref = Array.isArray(fish.weatherPreference) ? fish.weatherPreference.join('|') : fish.weatherPreference;
        
        csv += `${fish.id},${fish.name},${fish.rarity},${fish.size},${fish.aggressiveness},${fish.elusiveness},${fish.strength},${fish.weight},${fish.speed},${fish.depthPreference},${fish.baitPreference},${fish.endurance},${activeTimes[0] || ''},${activeTimes[1] || ''},${activeTimes[2] || ''},${weatherPref},${fish.coinValue},${fish.experienceValue},${fish.description},${fish.habitat},${fish.struggleStyle}\n`;
    });
    
    fs.writeFileSync('fish_species.csv', csv);
    console.log('✓ Converted fish_species.csv');
}

// Convert equipment
function convertEquipment() {
    const data = JSON.parse(fs.readFileSync('../src/data/equipment.json', 'utf8'));
    
    // Fishing Rods
    let rodsCSV = 'rod_id,rod_name,rarity,equip_slot,cast_accuracy,tension_stability,rare_fish_chance,casting_range,reel_speed,struggle_resistance,cost,crafting_material_1,crafting_material_2,crafting_time,description,unlock_level\n';
    
    data.fishingRods.forEach(rod => {
        const mats = rod.craftingMaterials || [];
        rodsCSV += `${rod.id},${rod.name},${rod.rarity},${rod.equipSlot},${rod.stats.castAccuracy},${rod.stats.tensionStability},${rod.stats.rareFishChance},${rod.stats.castingRange},${rod.stats.reelSpeed},${rod.stats.struggleResistance},${rod.cost},${mats[0] || ''},${mats[1] || ''},${rod.craftingTime},${rod.description},${rod.unlockLevel}\n`;
    });
    
    fs.writeFileSync('fishing_rods.csv', rodsCSV);
    console.log('✓ Converted fishing_rods.csv');
}

// Convert locations
function convertLocations() {
    const data = require('../src/data/LocationData.js').LOCATION_DATA;
    let csv = 'location_id,location_name,map_id,spot_number,description,environment,difficulty,unlock_level,bite_rate_mod,line_strength_mod,cast_distance_mod,lure_effectiveness_mod,xp_bonus_mod,fish_population_1,fish_population_2,fish_population_3,fish_population_4,fish_population_5,unique_feature_1,unique_feature_2,unique_feature_3\n';
    
    Object.entries(data).forEach(([id, loc]) => {
        const mods = loc.fishingModifiers || {};
        const pop = loc.fishPopulation || [];
        const features = loc.uniqueFeatures || [];
        
        csv += `${id},${loc.name},${loc.mapId},${loc.spotNumber},${loc.description},${loc.environment},${loc.difficulty},${loc.unlockLevel},${mods.biteRate || 1},${mods.lineStrength || 1},${mods.castDistance || 1},${mods.lureEffectiveness || 1},${mods.experienceBonus || 1},${pop[0] || ''},${pop[1] || ''},${pop[2] || ''},${pop[3] || ''},${pop[4] || ''},${features[0] || ''},${features[1] || ''},${features[2] || ''}\n`;
    });
    
    fs.writeFileSync('locations.csv', csv);
    console.log('✓ Converted locations.csv');
}

// Main conversion
console.log('Converting JSON files to CSV...\n');

try {
    convertPlayerAttributes();
    convertFishSpecies();
    convertEquipment();
    convertLocations();
    
    console.log('\n✅ All conversions complete!');
} catch (error) {
    console.error('❌ Error during conversion:', error.message);
} 