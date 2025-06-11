// Debug New Game Fix Test
// Run this in browser console to test the fixed new game functionality

function testNewGameFix() {
    console.log('=== NEW GAME FIX TEST ===');
    
    // Get the game scene and state
    const menuScene = window.game?.scene?.getScene('MenuScene');
    if (!menuScene) {
        console.error('❌ MenuScene not found');
        return false;
    }
    
    const gameState = menuScene.gameState;
    if (!gameState) {
        console.error('❌ GameState not found');
        return false;
    }
    
    console.log('📊 BEFORE NEW GAME:');
    console.log(`   Player Level: ${gameState.player.level}`);
    console.log(`   Player Experience: ${gameState.player.experience}`);
    console.log(`   Player Money: ${gameState.player.money}`);
    console.log(`   Fish Caught: ${gameState.player.fishCaught}`);
    
    // Test the startNewGame function directly
    console.log('\n🔄 TESTING startNewGame() function...');
    
    try {
        // Call the fixed startNewGame method
        menuScene.startNewGame();
        
        // Wait a moment for the reset to complete
        setTimeout(() => {
            console.log('\n📊 AFTER NEW GAME:');
            console.log(`   Player Level: ${gameState.player.level}`);
            console.log(`   Player Experience: ${gameState.player.experience}`);
            console.log(`   Player Money: ${gameState.player.money}`);
            console.log(`   Fish Caught: ${gameState.player.fishCaught}`);
            
            // Check if reset worked
            const resetWorked = (
                gameState.player.level === 1 &&
                gameState.player.experience === 0 &&
                gameState.player.money === 100 &&
                gameState.player.fishCaught === 0
            );
            
            if (resetWorked) {
                console.log('\n✅ NEW GAME FIX SUCCESSFUL!');
                console.log('   All values properly reset to initial state');
            } else {
                console.log('\n❌ NEW GAME FIX FAILED!');
                console.log('   Some values did not reset properly');
            }
            
            // Check localStorage
            const saveData = localStorage.getItem('luxuryAngler_save');
            console.log(`   Save Data Cleared: ${!saveData}`);
            
            return resetWorked;
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error testing startNewGame():', error);
        return false;
    }
}

function quickResetTest() {
    console.log('=== QUICK RESET TEST ===');
    
    const gameState = window.game?.scene?.getScene('MenuScene')?.gameState;
    if (!gameState) {
        console.error('❌ GameState not found');
        return;
    }
    
    // Manually set some values to test reset
    gameState.player.level = 10;
    gameState.player.experience = 5000;
    gameState.player.money = 50000;
    gameState.player.fishCaught = 100;
    
    console.log('📊 SET TEST VALUES:');
    console.log(`   Player Level: ${gameState.player.level}`);
    console.log(`   Player Experience: ${gameState.player.experience}`);
    console.log(`   Player Money: ${gameState.player.money}`);
    console.log(`   Fish Caught: ${gameState.player.fishCaught}`);
    
    // Test reset
    console.log('\n🔄 CALLING gameState.reset()...');
    gameState.reset();
    
    console.log('\n📊 AFTER RESET:');
    console.log(`   Player Level: ${gameState.player.level}`);
    console.log(`   Player Experience: ${gameState.player.experience}`);
    console.log(`   Player Money: ${gameState.player.money}`);
    console.log(`   Fish Caught: ${gameState.player.fishCaught}`);
    
    const resetWorked = (
        gameState.player.level === 1 &&
        gameState.player.experience === 0 &&
        gameState.player.money === 100 &&
        gameState.player.fishCaught === 0
    );
    
    if (resetWorked) {
        console.log('\n✅ RESET FUNCTION WORKS!');
    } else {
        console.log('\n❌ RESET FUNCTION FAILED!');
    }
    
    return resetWorked;
}

function checkManagersAfterReset() {
    console.log('=== MANAGER STATUS CHECK ===');
    
    const gameState = window.game?.scene?.getScene('MenuScene')?.gameState;
    if (!gameState) {
        console.error('❌ GameState not found');
        return;
    }
    
    console.log('🔧 MANAGER STATUS:');
    console.log(`   InventoryManager: ${!!gameState.inventoryManager}`);
    console.log(`   CraftingManager: ${!!gameState.craftingManager}`);
    console.log(`   LocationManager: ${!!gameState.locationManager}`);
    console.log(`   PlayerProgression: ${!!gameState.playerProgression}`);
    
    if (gameState.inventoryManager) {
        const inventory = gameState.inventory;
        console.log(`   Inventory Items: ${Object.keys(inventory.items || {}).length}`);
        console.log(`   Inventory Fish: ${(inventory.fish || []).length}`);
    }
    
    if (gameState.craftingManager) {
        const queue = gameState.craftingManager.getCraftingQueue();
        console.log(`   Crafting Queue: ${queue.length} items`);
    }
    
    if (gameState.locationManager) {
        const currentLocation = gameState.locationManager.getCurrentLocationId();
        console.log(`   Current Location: ${currentLocation}`);
    }
}

// Make functions available globally
window.testNewGameFix = testNewGameFix;
window.quickResetTest = quickResetTest;
window.checkManagersAfterReset = checkManagersAfterReset;

console.log('New Game Fix Test Tools Loaded!');
console.log('Available commands:');
console.log('  testNewGameFix() - Test the complete new game functionality');
console.log('  quickResetTest() - Quick test of the reset function');
console.log('  checkManagersAfterReset() - Check manager status after reset'); 