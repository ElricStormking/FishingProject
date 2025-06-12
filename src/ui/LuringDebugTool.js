import Phaser from 'phaser';
import UITheme from './UITheme.js';
import { gameDataLoader } from '../scripts/DataLoader.js';

export class LuringDebugTool {
    constructor(scene) {
        this.scene = scene;
        this.isVisible = false;
        this.container = null;
        this.selectedLure = null;
        this.selectedFish = null;
        
        // Define all lure types with their mechanics
        this.lureTypes = {
            spinner: {
                id: 'spinner',
                name: 'Spinner',
                type: 'spinner',
                control: 'Pulse Tap',
                description: 'Press SPACEBAR for quick pulses',
                phases: ['pulse', 'pulse', 'pulse'],
                instructions: 'TAP SPACEBAR when fish approaches!',
                stats: { attractionRadius: 100, lureSuccess: 5, lureControl: 5, biteRate: 5 }
            },
            soft_plastic: {
                id: 'soft_plastic',
                name: 'Soft Plastic',
                type: 'soft_plastic',
                control: 'Drag and Pause',
                description: 'Press S to drag down, then pause',
                phases: ['drag', 'pause', 'drag'],
                instructions: 'DRAG DOWN (S) then PAUSE!',
                stats: { attractionRadius: 120, lureSuccess: 7, lureControl: 6, biteRate: 6 }
            },
            fly: {
                id: 'fly',
                name: 'Fly',
                type: 'fly',
                control: 'Swipe Flick Combo',
                description: 'Use WASD for quick flick movements',
                phases: ['flick', 'swipe', 'combo'],
                instructions: 'FLICK with WASD directions!',
                stats: { attractionRadius: 80, lureSuccess: 8, lureControl: 9, biteRate: 7 }
            },
            popper: {
                id: 'popper',
                name: 'Popper',
                type: 'popper',
                control: 'Tap and Hold Burst',
                description: 'SPACEBAR for surface bursts',
                phases: ['tap', 'hold', 'burst'],
                instructions: 'TAP and HOLD SPACEBAR for bursts!',
                stats: { attractionRadius: 150, lureSuccess: 6, lureControl: 5, biteRate: 8 }
            },
            spoon: {
                id: 'spoon',
                name: 'Spoon',
                type: 'spoon',
                control: 'Circular Trace',
                description: 'Use WASD in circular motions',
                phases: ['trace', 'circle', 'trace'],
                instructions: 'TRACE CIRCLES with WASD!',
                stats: { attractionRadius: 110, lureSuccess: 7, lureControl: 8, biteRate: 6 }
            }
        };
        
        // Test fish for debugging
        this.testFish = [
            { id: 'test_easy', name: 'Easy Test Fish', size: 3, rarity: 1, aggressiveness: 8, elusiveness: 2 },
            { id: 'test_medium', name: 'Medium Test Fish', size: 5, rarity: 3, aggressiveness: 5, elusiveness: 5 },
            { id: 'test_hard', name: 'Hard Test Fish', size: 8, rarity: 5, aggressiveness: 3, elusiveness: 8 },
            { id: 'test_extreme', name: 'Extreme Test Fish', size: 10, rarity: 6, aggressiveness: 2, elusiveness: 10 }
        ];
        
        this.create();
    }
    
    create() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Main container
        this.container = this.scene.add.container(width / 2, height / 2);
        this.container.setDepth(10000);
        this.container.setVisible(false);
        
        // Background overlay
        this.overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.8);
        this.overlay.setOrigin(0.5);
        this.container.add(this.overlay);
        
        // Panel
        const panelWidth = 600;
        const panelHeight = 500;
        this.panel = UITheme.createPanel(this.scene, 0, 0, panelWidth, panelHeight, 'primary');
        this.container.add(this.panel);
        
        // Title
        const title = UITheme.createText(this.scene, 0, -panelHeight/2 + 30, 'LURING DEBUG TOOL', 'header');
        title.setOrigin(0.5);
        this.container.add(title);
        
        // Instructions
        const instructions = UITheme.createText(
            this.scene, 
            0, 
            -panelHeight/2 + 60, 
            'Test all lure types and their QTE mechanics', 
            'bodyMedium'
        );
        instructions.setOrigin(0.5);
        instructions.setColor('#aaaaaa');
        this.container.add(instructions);
        
        // Lure selection section
        const lureLabel = UITheme.createText(this.scene, -panelWidth/2 + 40, -100, 'Select Lure Type:', 'bodyLarge');
        lureLabel.setOrigin(0, 0.5);
        this.container.add(lureLabel);
        
        // Create lure buttons
        this.createLureButtons(panelWidth, panelHeight);
        
        // Fish difficulty selection
        const fishLabel = UITheme.createText(this.scene, -panelWidth/2 + 40, 50, 'Select Fish Difficulty:', 'bodyLarge');
        fishLabel.setOrigin(0, 0.5);
        this.container.add(fishLabel);
        
        // Create fish difficulty buttons
        this.createFishButtons(panelWidth, panelHeight);
        
        // Selected lure info display
        this.selectedLureInfo = UITheme.createText(this.scene, 0, 150, 'No lure selected', 'bodyMedium');
        this.selectedLureInfo.setOrigin(0.5);
        this.selectedLureInfo.setWordWrapWidth(panelWidth - 80);
        this.container.add(this.selectedLureInfo);
        
        // Start button
        this.startButton = UITheme.createButton(
            this.scene,
            0,
            panelHeight/2 - 60,
            200,
            50,
            'START TEST',
            () => this.startLuringTest(),
            'success'
        );
        this.startButton.button.setAlpha(0.5);
        this.startButton.button.setInteractive(false);
        this.container.add([this.startButton.button, this.startButton.text]);
        
        // Close button
        const closeButton = UITheme.createButton(
            this.scene,
            panelWidth/2 - 30,
            -panelHeight/2 + 30,
            40,
            40,
            'X',
            () => this.hide(),
            'danger'
        );
        this.container.add([closeButton.button, closeButton.text]);
        
        // Keyboard shortcut info
        const shortcutText = UITheme.createText(
            this.scene,
            0,
            panelHeight/2 - 20,
            'Press Y to toggle this tool',
            'bodySmall'
        );
        shortcutText.setOrigin(0.5);
        shortcutText.setColor('#666666');
        this.container.add(shortcutText);
    }
    
    createLureButtons(panelWidth, panelHeight) {
        const startX = -panelWidth/2 + 40;
        const startY = -50;
        const buttonWidth = 100;
        const buttonHeight = 35;
        const spacing = 10;
        
        let x = 0;
        let y = 0;
        
        Object.values(this.lureTypes).forEach((lure, index) => {
            // Calculate position (5 buttons in a row)
            x = startX + (index % 5) * (buttonWidth + spacing);
            y = startY + Math.floor(index / 5) * (buttonHeight + spacing);
            
            const button = UITheme.createButton(
                this.scene,
                x + buttonWidth/2,
                y + buttonHeight/2,
                buttonWidth,
                buttonHeight,
                lure.name,
                () => this.selectLure(lure),
                'secondary'
            );
            
            // Store reference for highlighting
            lure.button = button;
            
            this.container.add([button.button, button.text]);
        });
    }
    
    createFishButtons(panelWidth, panelHeight) {
        const startX = -panelWidth/2 + 40;
        const startY = 90;
        const buttonWidth = 120;
        const buttonHeight = 35;
        const spacing = 10;
        
        this.testFish.forEach((fish, index) => {
            const x = startX + (index % 4) * (buttonWidth + spacing);
            const y = startY + Math.floor(index / 4) * (buttonHeight + spacing);
            
            // Color code by difficulty
            const colors = ['success', 'primary', 'warning', 'danger'];
            const style = colors[index] || 'secondary';
            
            const button = UITheme.createButton(
                this.scene,
                x + buttonWidth/2,
                y + buttonHeight/2,
                buttonWidth,
                buttonHeight,
                fish.name,
                () => this.selectFish(fish),
                style
            );
            
            // Store reference
            fish.button = button;
            
            this.container.add([button.button, button.text]);
        });
    }
    
    selectLure(lure) {
        // Deselect previous
        if (this.selectedLure && this.selectedLure.button) {
            this.selectedLure.button.button.setAlpha(1);
        }
        
        this.selectedLure = lure;
        
        // Highlight selected
        if (lure.button) {
            lure.button.button.setAlpha(0.7);
        }
        
        // Update info display
        this.updateSelectedInfo();
        
        // Enable start button if both lure and fish selected
        this.checkStartButton();
    }
    
    selectFish(fish) {
        // Deselect previous
        if (this.selectedFish && this.selectedFish.button) {
            this.selectedFish.button.button.setAlpha(1);
        }
        
        this.selectedFish = fish;
        
        // Highlight selected
        if (fish.button) {
            fish.button.button.setAlpha(0.7);
        }
        
        // Update info display
        this.updateSelectedInfo();
        
        // Enable start button if both lure and fish selected
        this.checkStartButton();
    }
    
    updateSelectedInfo() {
        if (!this.selectedLure && !this.selectedFish) {
            this.selectedLureInfo.setText('No lure or fish selected');
            return;
        }
        
        let infoText = '';
        
        if (this.selectedLure) {
            infoText += `LURE: ${this.selectedLure.name}\n`;
            infoText += `Control: ${this.selectedLure.control}\n`;
            infoText += `${this.selectedLure.description}\n`;
            infoText += `Phases: ${this.selectedLure.phases.join(' → ')}\n\n`;
        }
        
        if (this.selectedFish) {
            infoText += `FISH: ${this.selectedFish.name}\n`;
            infoText += `Aggressiveness: ${this.selectedFish.aggressiveness}/10\n`;
            infoText += `Elusiveness: ${this.selectedFish.elusiveness}/10`;
        }
        
        this.selectedLureInfo.setText(infoText);
    }
    
    checkStartButton() {
        if (this.selectedLure && this.selectedFish) {
            this.startButton.button.setInteractive(true);
            this.startButton.button.setAlpha(1);
        } else {
            this.startButton.button.setInteractive(false);
            this.startButton.button.setAlpha(0.5);
        }
    }
    
    startLuringTest() {
        if (!this.selectedLure || !this.selectedFish) {
            console.warn('LuringDebugTool: Cannot start test without lure and fish selected');
            return;
        }
        
        console.log('LuringDebugTool: Starting test with:', {
            lure: this.selectedLure.name,
            fish: this.selectedFish.name
        });
        
        // Hide the debug tool but don't re-enable controls yet
        // We'll keep the regular fishing controls disabled during the luring test
        this.isVisible = false;
        this.container.setVisible(false);
        
        if (this.scene.physics) {
            this.scene.physics.resume();
        }
        
        console.log('LuringDebugTool: Hidden but keeping fishing controls disabled for test');
        
        // Prepare test data
        const testOptions = {
            castAccuracy: 80, // Good cast for testing
            availableFish: [this.selectedFish],
            selectedFish: this.selectedFish,
            fishId: this.selectedFish.id,
            lureStats: this.selectedLure.stats,
            castType: 'debug',
            hitAccurateSection: true,
            debugMode: true
        };
        
        // Check if we have the necessary components
        if (!this.scene.playerController) {
            console.error('LuringDebugTool: PlayerController not available');
            this.show(); // Show tool again
            return;
        }
        
        if (!this.scene.gameState) {
            console.error('LuringDebugTool: GameState not available');
            this.show(); // Show tool again
            return;
        }
        
        try {
            // Import LuringMiniGame if needed
            if (!this.scene.playerController.lureMinigame) {
                // Import the LuringMiniGame class
                import('../scripts/LuringMiniGame.js').then(({ LuringMiniGame }) => {
                    // Create a new LuringMiniGame instance
                    this.scene.playerController.lureMinigame = new LuringMiniGame(this.scene, {});
                    
                    // Now start the test
                    this.startLuringTestWithMinigame(testOptions);
                }).catch(importError => {
                    console.error('LuringDebugTool: Error importing LuringMiniGame:', importError);
                    this.show(); // Show tool again
                });
            } else {
                // LuringMiniGame already exists, start test directly
                this.startLuringTestWithMinigame(testOptions);
            }
        } catch (error) {
            console.error('LuringDebugTool: Error starting luring test:', error);
            this.show(); // Show tool again
        }
    }
    
    startLuringTestWithMinigame(testOptions) {
        try {
            // Temporarily override the lure type
            const originalGetEquipped = this.scene.gameState.getEquippedItem;
            this.scene.gameState.getEquippedItem = (category) => {
                if (category === 'lures') {
                    return this.selectedLure;
                }
                return originalGetEquipped.call(this.scene.gameState, category);
            };
            
            // Start the luring minigame
            this.scene.playerController.lureMinigame.start(testOptions);
            
            // Restore original function after a delay
            this.scene.time.delayedCall(100, () => {
                this.scene.gameState.getEquippedItem = originalGetEquipped;
            });
            
            // Listen for completion
            this.scene.events.once('fishing:lureComplete', (result) => {
                console.log('LuringDebugTool: Luring test completed:', result);
                
                // Show results for 5 seconds before proceeding
                this.showResultOverlay(result);
                
                // Wait 5 seconds before enabling controls and proceeding
                this.scene.time.delayedCall(5000, () => {
                    // Re-enable regular fishing controls now that test is complete
                    this.enableRegularControls();
                    
                    if (!result.success) {
                        console.log('LuringDebugTool: Fish got away. Test failed.');
                        // Show the tool again for another test after delay
                        this.scene.time.delayedCall(500, () => {
                            this.show();
                        });
                    } else {
                        console.log('LuringDebugTool: Fish hooked! Proceeding to reeling phase...');
                        // The game will automatically transition to reeling
                    }
                });
            });
        } catch (error) {
            console.error('LuringDebugTool: Error in startLuringTestWithMinigame:', error);
            this.show(); // Show tool again
        }
    }
    
    show() {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.container.setVisible(true);
        
        // Pause game if physics exists
        if (this.scene.physics) {
            this.scene.physics.pause();
        }
        
        // Disable regular fishing controls
        this.disableRegularControls();
        
        console.log('LuringDebugTool: Shown');
    }
    
    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        this.container.setVisible(false);
        
        // Resume game if physics exists
        if (this.scene.physics) {
            this.scene.physics.resume();
        }
        
        // Re-enable regular fishing controls
        this.enableRegularControls();
        
        console.log('LuringDebugTool: Hidden');
    }
    
    disableRegularControls() {
        console.log('LuringDebugTool: Disabling regular fishing controls');
        
        // Store original event listeners to restore them later
        if (this.scene.playerController) {
            this.originalInputEnabled = this.scene.playerController.inputEnabled;
            this.scene.playerController.inputEnabled = false;
            console.log('LuringDebugTool: Disabled player controller input');
        }
        
        // Disable cast input in GameScene
        if (this.scene.input && this.scene.input.keyboard) {
            // Save original key handlers
            this.savedKeyHandlers = {};
            
            // Disable common fishing control keys temporarily
            const keysToDisable = ['SPACE', 'W', 'A', 'S', 'D', 'C', 'R', 'Q', 'E', 'F'];
            
            keysToDisable.forEach(keyCode => {
                const key = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[keyCode]);
                if (key && key.enabled) {
                    this.savedKeyHandlers[keyCode] = {
                        key: key,
                        enabled: key.enabled
                    };
                    key.enabled = false;
                }
            });
            
            console.log('LuringDebugTool: Disabled regular fishing key controls');
        }
    }
    
    enableRegularControls() {
        console.log('LuringDebugTool: Re-enabling regular fishing controls');
        
        // Restore player controller input
        if (this.scene.playerController && typeof this.originalInputEnabled !== 'undefined') {
            this.scene.playerController.inputEnabled = this.originalInputEnabled;
            console.log('LuringDebugTool: Restored player controller input');
        }
        
        // Re-enable keyboard keys
        if (this.scene.input && this.scene.input.keyboard && this.savedKeyHandlers) {
            // Restore saved key handlers
            Object.keys(this.savedKeyHandlers).forEach(keyCode => {
                const keyInfo = this.savedKeyHandlers[keyCode];
                if (keyInfo.key) {
                    keyInfo.key.enabled = keyInfo.enabled;
                }
            });
            
            console.log('LuringDebugTool: Restored regular fishing key controls');
            this.savedKeyHandlers = {};
        }
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    destroy() {
        // Make sure to re-enable controls before destroying
        if (this.isVisible) {
            this.enableRegularControls();
        }
        
        // Clear any event listeners
        if (this.scene && this.scene.events) {
            this.scene.events.off('fishing:lureComplete');
        }
        
        // Clean up result overlay if it exists
        if (this.resultOverlay) {
            this.resultOverlay.destroy();
            this.resultOverlay = null;
        }
        
        if (this.countdownTimer) {
            this.countdownTimer.remove();
            this.countdownTimer = null;
        }
        
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        
        console.log('LuringDebugTool: Destroyed and controls restored');
    }
    
    showResultOverlay(result) {
        console.log('LuringDebugTool: Showing test result overlay');
        
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Create overlay container with high depth
        this.resultOverlay = this.scene.add.container(width/2, height/2);
        this.resultOverlay.setDepth(10100); // Higher than the debug tool itself
        
        // Add background overlay
        const bg = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7);
        bg.setOrigin(0.5);
        this.resultOverlay.add(bg);
        
        // Create result panel
        const panelWidth = 600;
        const panelHeight = 400;
        const panel = UITheme.createPanel(this.scene, 0, 0, panelWidth, panelHeight, result.success ? 'success' : 'danger');
        this.resultOverlay.add(panel);
        
        // Add header text
        const headerText = UITheme.createText(
            this.scene, 
            0, 
            -panelHeight/2 + 60, 
            result.success ? 'LURING TEST SUCCESS!' : 'LURING TEST FAILED!',
            'headerLarge'
        );
        headerText.setOrigin(0.5);
        headerText.setColor(result.success ? '#00FF88' : '#FF4444');
        this.resultOverlay.add(headerText);
        
        // Add fish info if success
        if (result.success && result.fishHooked) {
            const fishInfo = UITheme.createText(
                this.scene,
                0,
                -50,
                `Fish Caught: ${result.fishHooked.name}\nSize: ${result.fishHooked.size}/10\nRarity: ${result.fishHooked.rarity}/6`,
                'bodyLarge'
            );
            fishInfo.setOrigin(0.5);
            fishInfo.setAlign('center');
            this.resultOverlay.add(fishInfo);
        }
        
        // Add interest level info
        const interestInfo = UITheme.createText(
            this.scene,
            0,
            50,
            `Final Interest Level: ${result.finalInterest}%`,
            'bodyLarge'
        );
        interestInfo.setOrigin(0.5);
        this.resultOverlay.add(interestInfo);
        
        // Add countdown timer
        this.countdownText = UITheme.createText(
            this.scene,
            0,
            panelHeight/2 - 60,
            'Continuing in 5...',
            'bodyMedium'
        );
        this.countdownText.setOrigin(0.5);
        this.resultOverlay.add(this.countdownText);
        
        // Create countdown timer
        this.countdownValue = 5;
        this.countdownTimer = this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                this.countdownValue--;
                if (this.countdownText && this.countdownText.active) {
                    this.countdownText.setText(`Continuing in ${this.countdownValue}...`);
                }
                
                if (this.countdownValue <= 0) {
                    this.hideResultOverlay();
                }
            },
            callbackScope: this,
            repeat: 4
        });
        
        // Add appear animation
        this.resultOverlay.setScale(0.8);
        this.resultOverlay.setAlpha(0);
        this.scene.tweens.add({
            targets: this.resultOverlay,
            scale: 1,
            alpha: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }
    
    hideResultOverlay() {
        if (!this.resultOverlay) return;
        
        // Fade out animation
        this.scene.tweens.add({
            targets: this.resultOverlay,
            alpha: 0,
            scale: 0.9,
            duration: 300,
            ease: 'Power2.easeIn',
            onComplete: () => {
                if (this.resultOverlay) {
                    this.resultOverlay.destroy();
                    this.resultOverlay = null;
                }
                if (this.countdownTimer) {
                    this.countdownTimer.remove();
                    this.countdownTimer = null;
                }
            }
        });
    }
} 