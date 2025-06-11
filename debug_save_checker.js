// Debug Save Checker
// Run this in browser console to see what save data exists

function checkAllSaveData() {
    console.log('=== SAVE DATA CHECKER ===');
    
    const allKeys = Object.keys(localStorage);
    console.log(`Total localStorage keys: ${allKeys.length}`);
    
    if (allKeys.length === 0) {
        console.log('❌ No localStorage data found at all');
        return;
    }
    
    // Check main save file
    const mainSave = localStorage.getItem('luxuryAngler_save');
    if (mainSave) {
        console.log('✅ Main save file found: luxuryAngler_save');
        console.log(`   Size: ${mainSave.length} characters`);
        try {
            const parsed = JSON.parse(mainSave);
            console.log('   Content preview:', Object.keys(parsed));
        } catch (e) {
            console.log('   ⚠️ Could not parse as JSON');
        }
    } else {
        console.log('❌ Main save file not found: luxuryAngler_save');
    }
    
    // Check individual save keys
    const expectedKeys = [
        'playerData',
        'inventoryData', 
        'questData',
        'albumData',
        'gameProgress'
    ];
    
    console.log('\n=== INDIVIDUAL SAVE KEYS ===');
    expectedKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data && data !== 'null' && data !== '{}' && data !== '[]') {
            console.log(`✅ ${key}: ${data.length} characters`);
        } else {
            console.log(`❌ ${key}: missing or empty`);
        }
    });
    
    // Check for any game-related keys
    console.log('\n=== ALL GAME-RELATED KEYS ===');
    const gameKeys = allKeys.filter(key => {
        const lowerKey = key.toLowerCase();
        return lowerKey.includes('luxury') || 
               lowerKey.includes('angler') || 
               lowerKey.includes('fishing') || 
               lowerKey.includes('game') || 
               lowerKey.includes('save') || 
               lowerKey.includes('player') || 
               lowerKey.includes('inventory') || 
               lowerKey.includes('quest');
    });
    
    if (gameKeys.length > 0) {
        gameKeys.forEach(key => {
            const data = localStorage.getItem(key);
            console.log(`📁 ${key}: ${data ? data.length : 0} characters`);
        });
    } else {
        console.log('❌ No game-related keys found');
    }
    
    // Show all keys for reference
    console.log('\n=== ALL LOCALSTORAGE KEYS ===');
    allKeys.forEach(key => {
        const data = localStorage.getItem(key);
        console.log(`   ${key}: ${data ? data.length : 0} characters`);
    });
}

function createTestSaveData() {
    console.log('Creating test save data...');
    
    // Create minimal save data to enable continue button
    const testPlayerData = {
        name: 'Test Player',
        level: 1,
        experience: 0,
        coins: 1000,
        location: 'beginner_lake_dock'
    };
    
    const testInventoryData = {
        items: {
            'basic_rod': 1,
            'basic_reel': 1,
            'basic_line': 1
        },
        equipment: {
            rod: 'basic_rod',
            reel: 'basic_reel',
            line: 'basic_line'
        }
    };
    
    const testGameProgress = {
        tutorialCompleted: true,
        currentChapter: 1,
        unlockedLocations: ['beginner_lake_dock']
    };
    
    localStorage.setItem('playerData', JSON.stringify(testPlayerData));
    localStorage.setItem('inventoryData', JSON.stringify(testInventoryData));
    localStorage.setItem('gameProgress', JSON.stringify(testGameProgress));
    
    console.log('✅ Test save data created!');
    console.log('Refresh the page to see the Continue button enabled.');
}

function clearAllSaveData() {
    const allKeys = Object.keys(localStorage);
    const gameKeys = allKeys.filter(key => {
        const lowerKey = key.toLowerCase();
        return lowerKey.includes('luxury') || 
               lowerKey.includes('angler') || 
               lowerKey.includes('fishing') || 
               lowerKey.includes('game') || 
               lowerKey.includes('save') || 
               lowerKey.includes('player') || 
               lowerKey.includes('inventory') || 
               lowerKey.includes('quest');
    });
    
    gameKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`Removed: ${key}`);
    });
    
    console.log(`Cleared ${gameKeys.length} game-related save keys`);
}

// Make functions available globally
window.checkAllSaveData = checkAllSaveData;
window.createTestSaveData = createTestSaveData;
window.clearAllSaveData = clearAllSaveData;

console.log('Save Data Debug Tools Loaded!');
console.log('Available commands:');
console.log('  checkAllSaveData() - See what save data exists');
console.log('  createTestSaveData() - Create test save to enable Continue button');
console.log('  clearAllSaveData() - Clear all game save data'); 