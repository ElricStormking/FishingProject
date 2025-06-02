import GameState from './GameState.js';

export default class SceneManager {
    constructor() {
        this.gameState = GameState.getInstance();
        this.currentScene = null;
        this.previousScene = null;
        this.sceneHistory = [];
        this.transitionData = {};
        
        console.log('SceneManager initialized');
    }

    // Static instance for singleton pattern
    static getInstance() {
        if (!SceneManager.instance) {
            SceneManager.instance = new SceneManager();
        }
        return SceneManager.instance;
    }

    // Set current scene reference
    setCurrentScene(scene) {
        this.previousScene = this.currentScene;
        this.currentScene = scene;
        
        if (this.previousScene) {
            const prevKey = this.previousScene.scene ? this.previousScene.scene.key : this.previousScene.key;
            if (prevKey) {
                this.sceneHistory.push(prevKey);
            }
        }
        
        const currentKey = scene.scene ? scene.scene.key : scene.key;
        console.log(`SceneManager: Current scene set to ${currentKey || 'Unknown'}`);
    }

    // Start a new scene with optional data
    startScene(fromScene, targetSceneKey, data = {}) {
        const fromKey = fromScene.scene ? fromScene.scene.key : fromScene.key || 'Unknown';
        console.log(`SceneManager: Transitioning from ${fromKey} to ${targetSceneKey}`);
        
        // Store transition data
        this.transitionData[targetSceneKey] = data;
        
        // Save game state before transition
        this.gameState.save();
        
        // Perform scene transition
        fromScene.scene.start(targetSceneKey, data);
        
        // Update scene tracking
        this.setCurrentScene({ key: targetSceneKey });
        
        // Trigger scene change event
        this.gameState.emit('sceneChanged', {
            from: fromKey,
            to: targetSceneKey,
            data: data
        });
    }

    // Switch to scene (keeps current scene active)
    switchToScene(fromScene, targetSceneKey, data = {}) {
        const fromKey = fromScene.scene ? fromScene.scene.key : fromScene.key || 'Unknown';
        console.log(`SceneManager: Switching from ${fromKey} to ${targetSceneKey}`);
        
        this.transitionData[targetSceneKey] = data;
        fromScene.scene.switch(targetSceneKey);
        
        this.gameState.emit('sceneSwitched', {
            from: fromKey,
            to: targetSceneKey,
            data: data
        });
    }

    // Launch scene as overlay
    launchScene(fromScene, targetSceneKey, data = {}) {
        const fromKey = fromScene.scene ? fromScene.scene.key : fromScene.key || 'Unknown';
        console.log(`SceneManager: Launching ${targetSceneKey} as overlay from ${fromKey}`);
        
        this.transitionData[targetSceneKey] = data;
        fromScene.scene.launch(targetSceneKey, data);
        
        this.gameState.emit('sceneLaunched', {
            from: fromKey,
            to: targetSceneKey,
            data: data
        });
    }

    // Stop/close a scene
    stopScene(fromScene, targetSceneKey) {
        const fromKey = fromScene.scene ? fromScene.scene.key : fromScene.key || 'Unknown';
        console.log(`SceneManager: Stopping scene ${targetSceneKey} from ${fromKey}`);
        
        fromScene.scene.stop(targetSceneKey);
        
        this.gameState.emit('sceneStopped', {
            from: fromKey,
            stopped: targetSceneKey
        });
    }

    // Go back to previous scene
    goBack(fromScene, data = {}) {
        if (this.sceneHistory.length > 0) {
            const previousSceneKey = this.sceneHistory.pop();
            console.log(`SceneManager: Going back to ${previousSceneKey}`);
            
            this.startScene(fromScene, previousSceneKey, data);
        } else {
            console.warn('SceneManager: No previous scene to go back to');
            // Default to menu scene
            this.startScene(fromScene, 'MenuScene', data);
        }
    }

    // Get transition data for current scene
    getTransitionData(sceneKey) {
        return this.transitionData[sceneKey] || {};
    }

    // Clear transition data
    clearTransitionData(sceneKey) {
        delete this.transitionData[sceneKey];
    }

    // Scene-specific transition methods
    goToMenu(fromScene, data = {}) {
        this.startScene(fromScene, 'MenuScene', data);
    }

    goToGame(fromScene, data = {}) {
        this.startScene(fromScene, 'GameScene', data);
    }

    goToShop(fromScene, data = {}) {
        this.startScene(fromScene, 'ShopScene', data);
    }

    goToSettings(fromScene, data = {}) {
        this.launchScene(fromScene, 'SettingsScene', data);
    }

    goToInventory(fromScene, data = {}) {
        // Instead of launching a scene, show inventory UI overlay
        console.log('SceneManager: Opening inventory UI overlay');
        
        // Create inventory UI if it doesn't exist on the scene
        if (!fromScene.inventoryUI) {
            // Import InventoryUI and create it
            import('../ui/InventoryUI.js').then((module) => {
                fromScene.inventoryUI = new module.InventoryUI(fromScene, 100, 50, 800, 600);
                fromScene.inventoryUI.show();
            }).catch((error) => {
                console.error('SceneManager: Failed to load InventoryUI:', error);
            });
        } else {
            fromScene.inventoryUI.show();
        }
    }

    // HUD management
    showHUD(fromScene) {
        this.launchScene(fromScene, 'HUDScene');
    }

    hideHUD(fromScene) {
        this.stopScene(fromScene, 'HUDScene');
    }

    // Pause/Resume functionality
    pauseGame(fromScene) {
        console.log('SceneManager: Pausing game');
        
        // Pause current scene
        fromScene.scene.pause();
        
        // Launch pause menu
        this.launchScene(fromScene, 'PauseScene');
        
        this.gameState.emit('gamePaused');
    }

    resumeGame(fromScene) {
        console.log('SceneManager: Resuming game');
        
        // Stop pause menu
        this.stopScene(fromScene, 'PauseScene');
        
        // Resume game scene
        fromScene.scene.resume('GameScene');
        
        this.gameState.emit('gameResumed');
    }

    // Scene state management
    saveSceneState(sceneKey, state) {
        const sceneStates = this.gameState.getSceneStates();
        sceneStates[sceneKey] = state;
        this.gameState.setSceneStates(sceneStates);
        console.log(`SceneManager: Saved state for ${sceneKey}`);
    }

    loadSceneState(sceneKey) {
        const sceneStates = this.gameState.getSceneStates();
        return sceneStates[sceneKey] || {};
    }

    clearSceneState(sceneKey) {
        const sceneStates = this.gameState.getSceneStates();
        delete sceneStates[sceneKey];
        this.gameState.setSceneStates(sceneStates);
        console.log(`SceneManager: Cleared state for ${sceneKey}`);
    }

    // Transition effects (can be expanded)
    fadeTransition(fromScene, targetSceneKey, duration = 500, data = {}) {
        console.log(`SceneManager: Fade transition to ${targetSceneKey}`);
        
        // Create fade overlay
        const fadeOverlay = fromScene.add.rectangle(
            fromScene.cameras.main.centerX,
            fromScene.cameras.main.centerY,
            fromScene.cameras.main.width,
            fromScene.cameras.main.height,
            0x000000,
            0
        );
        
        // Use scene's depth management if available, otherwise use high depth for transitions
        const overlayDepth = fromScene.getUIDepth ? fromScene.getUIDepth('modals') : 2000;
        fadeOverlay.setDepth(overlayDepth);
        
        // Fade out
        fromScene.tweens.add({
            targets: fadeOverlay,
            alpha: 1,
            duration: duration / 2,
            onComplete: () => {
                // Switch scene
                this.startScene(fromScene, targetSceneKey, data);
            }
        });
    }

    // Get scene history
    getSceneHistory() {
        return [...this.sceneHistory];
    }

    // Clear scene history
    clearSceneHistory() {
        this.sceneHistory = [];
        console.log('SceneManager: Scene history cleared');
    }

    // Debug information
    getDebugInfo() {
        return {
            currentScene: this.currentScene?.scene?.key || 'None',
            previousScene: this.previousScene?.scene?.key || 'None',
            sceneHistory: this.sceneHistory,
            transitionDataKeys: Object.keys(this.transitionData)
        };
    }
} 