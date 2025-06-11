// Debug New Game Test Script
// Run this in browser console to test new game functionality

function testNewGameReset() {
    console.log('=== NEW GAME RESET TEST ===');
    
    // Check current state before reset
    const gameState = window.game?.scene?.getScene('MenuScene')?.gameState;
    if (!gameState) {
        console.error('❌ GameState not found');
        return;
    }
    
    console.log('📊 BEFORE RESET:');
    console.log(`   Player Level: ${gameState.player.level}`);
    console.log(`   Player Experience: ${gameState.player.experience}`);
    console.log(`   Player Money: ${gameState.player.money}`);
    console.log(`   Fish Caught: ${gameState.player.fishCaught}`);
    console.log(`   Inventory Items: ${Object.keys(gameState.inventory.items || {}).length}`);
    
    // Check localStorage before
    const saveDataBefore = localStorage.getItem('luxuryAngler_save');
    console.log(`   Save Data Exists: ${!!saveDataBefore}`);
    
    // Simulate new game
    console.log('\n🔄 SIMULATING NEW GAME...');
    
    // Clear localStorage
    localStorage.clear();
    console.log('✅ localStorage cleared');
    
    // Reset GameState
    gameState.reset();
    console.log('✅ GameState reset called');
    
    // Check state after reset
    console.log('\n📊 AFTER RESET:');
    console.log(`   Player Level: ${gameState.player.level}`);
    console.log(`   Player Experience: ${gameState.player.experience}`);
    console.log(`   Player Money: ${gameState.player.money}`);
    console.log(`   Fish Caught: ${gameState.player.fishCaught}`);
    console.log(`   Inventory Items: ${Object.keys(gameState.inventory.items || {}).length}`);
    
    // Check localStorage after
    const saveDataAfter = localStorage.getItem('luxuryAngler_save');
    console.log(`   Save Data Exists: ${!!saveDataAfter}`);
    
    // Verify reset worked
    const resetWorked = (
        gameState.player.level === 1 &&
        gameState.player.experience === 0 &&
        gameState.player.money === 100 &&
        gameState.player.fishCaught === 0 &&
        !saveDataAfter
    );
    
    if (resetWorked) {
        console.log('\n✅ NEW GAME RESET SUCCESSFUL!');
        console.log('   All values returned to initial state');
    } else {
        console.log('\n❌ NEW GAME RESET FAILED!');
        console.log('   Some values did not reset properly');
    }
    
    return resetWorked;
}

function checkCurrentGameState() {
    console.log('=== CURRENT GAME STATE ===');
    
    const gameState = window.game?.scene?.getScene('MenuScene')?.gameState;
    if (!gameState) {
        console.error('❌ GameState not found');
        return;
    }
    
    console.log('📊 PLAYER DATA:');
    console.log(`   Name: ${gameState.player.name}`);
    console.log(`   Level: ${gameState.player.level}`);
    console.log(`   Experience: ${gameState.player.experience}/${gameState.player.experienceToNext}`);
    console.log(`   Money: ${gameState.player.money}`);
    console.log(`   Fish Caught: ${gameState.player.fishCaught}`);
    console.log(`   Total Play Time: ${gameState.player.totalPlayTime}`);
    
    console.log('\n📦 INVENTORY:');
    console.log(`   Items: ${Object.keys(gameState.inventory.items || {}).length}`);
    console.log(`   Fish: ${(gameState.inventory.fish || []).length}`);
    console.log(`   Equipment: ${Object.keys(gameState.inventory.equipment || {}).length}`);
    
    console.log('\n💾 SAVE DATA:');
    const saveData = localStorage.getItem('luxuryAngler_save');
    if (saveData) {
        try {
            const parsed = JSON.parse(saveData);
            console.log(`   Save exists: ${saveData.length} characters`);
            console.log(`   Save timestamp: ${new Date(parsed.timestamp).toLocaleString()}`);
            console.log(`   Save version: ${parsed.version}`);
        } catch (e) {
            console.log('   Save exists but could not parse');
        }
    } else {
        console.log('   No save data found');
    }
    
    return gameState;
}

function forceNewGameState() {
    console.log('=== FORCE NEW GAME STATE ===');
    
    const gameState = window.game?.scene?.getScene('MenuScene')?.gameState;
    if (!gameState) {
        console.error('❌ GameState not found');
        return;
    }
    
    // Manually set to new game values
    gameState.player.level = 1;
    gameState.player.experience = 0;
    gameState.player.experienceToNext = 100;
    gameState.player.money = 100;
    gameState.player.fishCaught = 0;
    gameState.player.totalPlayTime = 0;
    gameState.player.achievements = [];
    
    // Reset inventory
    gameState.inventory.items = {};
    gameState.inventory.fish = [];
    gameState.inventory.equipment = {};
    
    // Clear save data
    localStorage.clear();
    
    console.log('✅ Forced new game state');
    console.log('🔄 Refresh the page to see changes');
    
    return gameState;
}

// Make functions available globally
window.testNewGameReset = testNewGameReset;
window.checkCurrentGameState = checkCurrentGameState;
window.forceNewGameState = forceNewGameState;

console.log('New Game Debug Tools Loaded!');
console.log('Available commands:');
console.log('  testNewGameReset() - Test the new game reset functionality');
console.log('  checkCurrentGameState() - Check current player/save state');
console.log('  forceNewGameState() - Force reset to new game state'); 