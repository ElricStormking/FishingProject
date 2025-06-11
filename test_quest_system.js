/**
 * Quick test to verify Quest System integration
 * Run this in browser console on the game page to test
 */

function testQuestSystem() {
    console.log('🧪 TESTING QUEST SYSTEM INTEGRATION');
    console.log('===================================');
    
    // Test 1: Check if QuestManager is accessible
    let questManager;
    try {
        // Try accessing via scene
        const boatScene = window.game?.scene?.scenes?.find(s => s.scene?.key === 'BoatMenuScene');
        if (boatScene?.questManager) {
            questManager = boatScene.questManager;
            console.log('✅ QuestManager found via BoatMenuScene');
        } else {
            console.log('❌ QuestManager not found via scene');
            return false;
        }
    } catch (error) {
        console.error('❌ Error accessing QuestManager:', error);
        return false;
    }
    
    // Test 2: Check quest system status
    try {
        questManager.debugQuestSystemStatus();
        console.log('✅ Quest system status check passed');
    } catch (error) {
        console.error('❌ Quest system status check failed:', error);
        return false;
    }
    
    // Test 3: Test reward UI display
    try {
        console.log('🎯 Testing reward UI display...');
        questManager.debugTestRewardUI();
        console.log('✅ Reward UI test executed');
    } catch (error) {
        console.error('❌ Reward UI test failed:', error);
        return false;
    }
    
    // Test 4: Test quest completion flow
    try {
        console.log('🎯 Testing quest completion flow...');
        questManager.debugCompleteQuest('story_001_tutorial');
        console.log('✅ Quest completion test executed');
    } catch (error) {
        console.error('❌ Quest completion test failed:', error);
        return false;
    }
    
    console.log('✅ ALL QUEST SYSTEM TESTS PASSED!');
    console.log('===================================');
    return true;
}

// Run test
testQuestSystem(); 