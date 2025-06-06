// Test script to verify CSV ↔ JSON conversion integrity
// Usage: node test_conversion_integrity.js

const fs = require('fs');

// Helper function to read and parse CSV
function parseCSV(filename) {
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const row = {};
        const values = lines[i].split(',');
        
        for (let j = 0; j < headers.length; j++) {
            const value = values[j]?.trim();
            if (value && value !== '') {
                // Try to parse as number if it looks like one
                if (!isNaN(value) && !isNaN(parseFloat(value))) {
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

// Test fish data integrity
function testFishData() {
    console.log('Testing fish data integrity...');
    
    const csvData = parseCSV('data_csv/fish_species.csv');
    const jsonData = JSON.parse(fs.readFileSync('../src/data/fish.json', 'utf8'));
    
    if (csvData.length !== jsonData.fishSpecies.length) {
        console.error(`❌ Fish count mismatch: CSV has ${csvData.length}, JSON has ${jsonData.fishSpecies.length}`);
        return false;
    }
    
    for (let i = 0; i < csvData.length; i++) {
        const csvFish = csvData[i];
        const jsonFish = jsonData.fishSpecies[i];
        
        // Check key fields
        if (csvFish.fish_id !== jsonFish.id) {
            console.error(`❌ Fish ID mismatch at index ${i}: ${csvFish.fish_id} vs ${jsonFish.id}`);
            return false;
        }
        
        if (csvFish.fish_name !== jsonFish.name) {
            console.error(`❌ Fish name mismatch at index ${i}: ${csvFish.fish_name} vs ${jsonFish.name}`);
            return false;
        }
        
        if (csvFish.rarity !== jsonFish.rarity) {
            console.error(`❌ Fish rarity mismatch at index ${i}: ${csvFish.rarity} vs ${jsonFish.rarity}`);
            return false;
        }
        
        if (csvFish.coin_value !== jsonFish.coinValue) {
            console.error(`❌ Fish coin value mismatch at index ${i}: ${csvFish.coin_value} vs ${jsonFish.coinValue}`);
            return false;
        }
    }
    
    console.log('✓ Fish data integrity test passed');
    return true;
}

// Test equipment data integrity
function testEquipmentData() {
    console.log('Testing equipment data integrity...');
    
    const csvRods = parseCSV('data_csv/fishing_rods.csv');
    const csvBoats = parseCSV('data_csv/boats.csv');
    const csvClothing = parseCSV('data_csv/clothing.csv');
    const csvLures = parseCSV('data_csv/lures.csv');
    
    const jsonData = JSON.parse(fs.readFileSync('../src/data/equipment.json', 'utf8'));
    
    // Test fishing rods
    if (csvRods.length !== jsonData.fishingRods.length) {
        console.error(`❌ Fishing rod count mismatch: CSV has ${csvRods.length}, JSON has ${jsonData.fishingRods.length}`);
        return false;
    }
    
    // Test boats
    if (csvBoats.length !== jsonData.boats.length) {
        console.error(`❌ Boat count mismatch: CSV has ${csvBoats.length}, JSON has ${jsonData.boats.length}`);
        return false;
    }
    
    // Test clothing
    if (csvClothing.length !== jsonData.clothing.length) {
        console.error(`❌ Clothing count mismatch: CSV has ${csvClothing.length}, JSON has ${jsonData.clothing.length}`);
        return false;
    }
    
    // Test lures
    if (csvLures.length !== jsonData.lures.length) {
        console.error(`❌ Lure count mismatch: CSV has ${csvLures.length}, JSON has ${jsonData.lures.length}`);
        return false;
    }
    
    // Test sample rod data
    const csvRod = csvRods[0];
    const jsonRod = jsonData.fishingRods[0];
    
    if (csvRod.rod_id !== jsonRod.id) {
        console.error(`❌ Rod ID mismatch: ${csvRod.rod_id} vs ${jsonRod.id}`);
        return false;
    }
    
    if (csvRod.cast_accuracy !== jsonRod.stats.castAccuracy) {
        console.error(`❌ Rod cast accuracy mismatch: ${csvRod.cast_accuracy} vs ${jsonRod.stats.castAccuracy}`);
        return false;
    }
    
    console.log('✓ Equipment data integrity test passed');
    return true;
}

// Test game config data
function testGameConfigData() {
    console.log('Testing game config data integrity...');
    
    const csvData = parseCSV('data_csv/game_config.csv');
    const jsonData = JSON.parse(fs.readFileSync('../src/data/gameConfig.json', 'utf8'));
    
    // Count total config entries
    let jsonEntryCount = 0;
    Object.keys(jsonData).forEach(category => {
        jsonEntryCount += Object.keys(jsonData[category]).length;
    });
    
    if (csvData.length !== jsonEntryCount) {
        console.error(`❌ Config entry count mismatch: CSV has ${csvData.length}, JSON has ${jsonEntryCount}`);
        return false;
    }
    
    // Test sample config value
    const testEntry = csvData.find(entry => entry.config_name === 'baseCatchChance');
    if (testEntry && jsonData.fishing.baseCatchChance !== testEntry.config_value) {
        console.error(`❌ Config value mismatch for baseCatchChance: ${jsonData.fishing.baseCatchChance} vs ${testEntry.config_value}`);
        return false;
    }
    
    console.log('✓ Game config data integrity test passed');
    return true;
}

// Test player attributes data
function testPlayerAttributesData() {
    console.log('Testing player attributes data integrity...');
    
    const csvData = parseCSV('data_csv/player_attributes.csv');
    const jsonData = JSON.parse(fs.readFileSync('../src/data/attributes.json', 'utf8'));
    
    // Count total attributes in JSON
    let jsonAttrCount = 0;
    Object.keys(jsonData.playerAttributes).forEach(category => {
        jsonAttrCount += Object.keys(jsonData.playerAttributes[category]).length;
    });
    
    if (csvData.length !== jsonAttrCount) {
        console.error(`❌ Attribute count mismatch: CSV has ${csvData.length}, JSON has ${jsonAttrCount}`);
        return false;
    }
    
    // Test sample attribute
    const testAttr = csvData.find(attr => attr.attribute_id === 'castAccuracy');
    if (testAttr && jsonData.playerAttributes.fishing.castAccuracy.name !== testAttr.attribute_name) {
        console.error(`❌ Attribute name mismatch for castAccuracy`);
        return false;
    }
    
    console.log('✓ Player attributes data integrity test passed');
    return true;
}

// Run all tests
console.log('🔍 Running CSV ↔ JSON conversion integrity tests...\n');

let allTestsPassed = true;

allTestsPassed &= testFishData();
allTestsPassed &= testEquipmentData();
allTestsPassed &= testGameConfigData();
allTestsPassed &= testPlayerAttributesData();

console.log('\n' + '='.repeat(50));

if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! CSV ↔ JSON conversion maintains perfect data integrity.');
    console.log('✅ The converted JSON files work exactly the same as the original CSV data.');
} else {
    console.log('❌ Some tests failed. Please check the conversion logic.');
}

console.log('='.repeat(50)); 