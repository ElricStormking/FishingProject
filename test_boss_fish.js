// Boss Fish Test Script
// Run this in the browser console when in GameScene to test boss encounters

function testBossFish(bossId) {
    const scene = window.game?.scene?.getScene('GameScene');
    if (!scene) {
        console.error('GameScene not found');
        return;
    }

    const fishDatabase = scene.gameState?.fishDatabase;
    if (!fishDatabase) {
        console.error('Fish database not found');
        return;
    }

    // Get the boss fish data
    const bossFish = fishDatabase.getFishById(bossId);
    if (!bossFish) {
        console.error(`Boss fish ${bossId} not found`);
        return;
    }

    console.log(`Testing boss fish: ${bossFish.name}`);
    
    // Force select this fish for the next catch
    scene.gameState.selectedFish = bossFish;
    
    // Start reeling minigame directly
    if (scene.reelingMiniGame) {
        scene.reelingMiniGame.destroy();
    }
    
    scene.reelingMiniGame = new ReelingMiniGame(scene, bossFish);
    scene.reelingMiniGame.start();
    
    console.log(`Boss fight started! ${bossFish.name} - Stamina: ${bossFish.stamina}`);
}

// Test all boss fish
function testAllBosses() {
    const bosses = [
        'giant_bass',
        'giant_pike', 
        'electric_eel',
        'coelacanth',
        'giant_marlin',
        'tiger_shark',
        'whale',
        'megalodon',
        'mosasaurus',
        'leviathan'
    ];
    
    console.log('Available boss tests:');
    bosses.forEach((boss, index) => {
        console.log(`${index + 1}. testBossFish('${boss}')`);
    });
}

// Quick test functions
window.testBoss = testBossFish;
window.testAllBosses = testAllBosses;

console.log('Boss fish test functions loaded!');
console.log('Usage: testBoss("giant_bass") or testAllBosses() to see all options'); 