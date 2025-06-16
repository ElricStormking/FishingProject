import Phaser from 'phaser';
import { gameDataLoader } from './DataLoader.js';
import UITheme from '../ui/UITheme.js';
import Logger from '../utils/Logger.js';

// Lure Minigame - Enhanced rhythm-based fish attraction
export class LuringMiniGame {
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;
        this.isActive = false;
        this.isCompleted = false; // Add completion flag to prevent duplicate completions
        this.currentPhase = 0;
        this.maxPhases = 4;
        this.fishShadow = null;
        this.shadowInterest = 50;
        this.lureType = null;
        this.inputSequence = [];
        this.requiredInputs = [];
        
        // Tutorial state
        this.tutorialActive = false;
        this.tutorialContainer = null;
        
        // Initialize audio manager safely
        this.audioManager = scene.audioManager || null;
        if (!this.audioManager) {
            console.warn('LuringMiniGame: No audio manager available from scene');
        }
        
        // Lure Simulation UI elements
        this.simulationUI = null;
        this.simulationContainer = null;
        this.simulationLure = null;
        this.simulationFish = [];
        this.observingFish = null;
        this.lurePosition = { x: 0, y: 0 };
        this.inputCooldown = false;
        this.fishObservationTimer = null;
        
            }

    start(options = {}) {
        if (this.isActive) {
            console.warn('LuringMiniGame: Start called while already active. Ignoring.');
            return;
        }

                this.isActive = true; // Set active state manually instead of calling super
        this.isCompleted = false; // Reset completion flag for new session
        
        // Handle different calling patterns for backwards compatibility
        if (typeof options === 'number') {
            // Old calling pattern: start(castAccuracy, availableFish, lureStats)
            console.warn('LuringMiniGame: Using deprecated calling pattern, please update to options object');
            const castAccuracy = arguments[0];
            const availableFish = arguments[1];
            const lureStats = arguments[2];
            
            // Convert to new format
            options = {
                castAccuracy: castAccuracy,
                availableFish: availableFish,
                lureStats: lureStats,
                selectedFish: availableFish && availableFish.length > 0 ? Phaser.Utils.Array.GetRandom(availableFish) : null
            };
        }
        
        // Extract options
        this.castAccuracy = options.castAccuracy || 50;
        this.availableFish = options.availableFish || [];
        this.lureStats = options.lureStats || { attractionRadius: 100, lureSuccess: 5, lureControl: 5, biteRate: 5 };
        this.castType = options.castType || 'normal';
        this.hitAccurateSection = options.hitAccurateSection || false;
        this.debugMode = options.debugMode || false; // Track if we're in debug mode
        
        // Get selected fish from options
        this.selectedFish = options.selectedFish || null;
        this.fishId = options.fishId || null;
        
        // If we have a selected fish from database, use its properties
        if (this.selectedFish) {
                        // Determine fish shadow size based on fish size attribute
            if (this.selectedFish.size <= 3) {
                this.fishShadowSize = 'small';
            } else if (this.selectedFish.size <= 6) {
                this.fishShadowSize = 'medium';
            } else {
                this.fishShadowSize = 'large';
            }
            
            // Set fish behavior based on attributes
            this.fishAggressiveness = this.selectedFish.aggressiveness || 5;
            this.fishElusiveness = this.selectedFish.elusiveness || 5;
            
            // Adjust phase count based on elusiveness (3-4 phases)
            this.totalPhases = this.fishElusiveness >= 7 ? 4 : 3;
            
        } else {
            // Fallback to random fish shadow
            const shadowSizes = ['small', 'medium', 'large'];
            this.fishShadowSize = shadowSizes[Math.floor(Math.random() * shadowSizes.length)];
            this.totalPhases = Math.random() < 0.3 ? 4 : 3;
            this.fishAggressiveness = 5;
            this.fishElusiveness = 5;
        }
        
        this.currentPhase = 0;
        this.phaseSuccesses = [];
        
        // Initialize missing properties
        this.simulationFish = [];
        this.lureType = 'spinner'; // Default lure type
        this.shadowInterest = 50; // Starting interest level
        
        // Initialize phaseSuccesses array to match totalPhases
        this.phaseSuccesses = new Array(this.totalPhases).fill(false);
        
        // Set up lure pattern first (needed for tutorial display)
        this.setupLurePattern();
        
        // Start the luring minigame immediately
        this.startLuringMinigame();
        
        // Show tutorial as a corner panel (non-blocking)
        this.showTutorialPanel();
    }

    showTutorialPanel() {
                this.tutorialActive = true;
        
        // Create tutorial panel in bottom right corner
        this.createTutorialPanel();
        
        // Auto-hide tutorial after 8 seconds
        this.tutorialTimer = this.scene.time.delayedCall(8000, () => {
            this.hideTutorialPanel();
        });
    }

    createTutorialPanel() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Panel dimensions - compact for corner placement
        const panelWidth = 320;
        const panelHeight = 240;
        
        // Position in bottom right corner with margin
        const panelX = width - panelWidth/2 - 20;
        const panelY = height - panelHeight/2 - 20;
        
        // Create tutorial container
        this.tutorialContainer = this.scene.add.container(panelX, panelY);
        this.tutorialContainer.setDepth(1500); // Above game elements but not blocking
        
        // Panel background - custom graphics for better control
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(0x1a1a2e, 0.85); // Dark blue-gray, semi-transparent
        panelBg.lineStyle(2, 0x4a9eff, 0.7); // Light blue border
        panelBg.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 12);
        panelBg.strokeRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 12);
        this.tutorialContainer.add(panelBg);
        
        // Add subtle inner glow effect
        const innerGlow = this.scene.add.graphics();
        innerGlow.fillStyle(0x4a9eff, 0.1); // Very subtle inner glow
        innerGlow.fillRoundedRect(-panelWidth/2 + 2, -panelHeight/2 + 2, panelWidth - 4, panelHeight - 4, 10);
        this.tutorialContainer.add(innerGlow);
        
        // Title
        const title = UITheme.createText(this.scene, 0, -panelHeight/2 + 25, 'LURE CONTROLS', 'headerSmall');
        title.setOrigin(0.5);
        title.setColor('#FFD700'); // Gold color for visibility
        this.tutorialContainer.add(title);
        
        // Get current lure info
        const currentLure = this.getCurrentLureInfo();
        
        // Lure icon and name
        const iconText = this.scene.add.text(-60, -panelHeight/2 + 55, currentLure.icon, {
            fontSize: '24px'
        }).setOrigin(0.5);
        this.tutorialContainer.add(iconText);
        
        const nameText = UITheme.createText(this.scene, 0, -panelHeight/2 + 55, currentLure.name, 'bodyLarge');
        nameText.setOrigin(0.5);
        nameText.setColor('#00FF88'); // Bright green for lure name
        this.tutorialContainer.add(nameText);
        
        // Control type
        const controlText = UITheme.createText(this.scene, 0, -panelHeight/2 + 80, currentLure.control, 'bodyMedium');
        controlText.setOrigin(0.5);
        controlText.setColor('#FFA726'); // Orange for control type
        this.tutorialContainer.add(controlText);
        
        // Description
        const descText = UITheme.createText(this.scene, 0, -panelHeight/2 + 105, currentLure.description, 'bodySmall');
        descText.setOrigin(0.5);
        descText.setColor('#FFFFFF'); // White for description
        descText.setWordWrapWidth(panelWidth - 40);
        this.tutorialContainer.add(descText);
        
        // Instructions - emphasized
        const instrText = UITheme.createText(this.scene, 0, -panelHeight/2 + 140, currentLure.instructions, 'bodySmall');
        instrText.setOrigin(0.5);
        instrText.setColor('#00BFFF'); // Bright blue for instructions
        instrText.setWordWrapWidth(panelWidth - 40);
        instrText.setFontStyle('bold');
        this.tutorialContainer.add(instrText);
        
        // Dismiss instruction
        const dismissText = UITheme.createText(this.scene, 0, panelHeight/2 - 30, 'Press ESC to hide', 'bodySmall');
        dismissText.setOrigin(0.5);
        dismissText.setColor('#CCCCCC'); // Light gray
        dismissText.setAlpha(0.8);
        this.tutorialContainer.add(dismissText);
        
        // Auto-hide timer display
        this.timerText = UITheme.createText(this.scene, 0, panelHeight/2 - 15, 'Auto-hide in 8s', 'bodySmall');
        this.timerText.setOrigin(0.5);
        this.timerText.setColor('#AAAAAA'); // Gray
        this.timerText.setAlpha(0.6);
        this.tutorialContainer.add(this.timerText);
        
        // Slide in animation from right
        this.tutorialContainer.setX(width + panelWidth/2);
        this.scene.tweens.add({
            targets: this.tutorialContainer,
            x: panelX,
            duration: 500,
            ease: 'Power2.easeOut'
        });
        
        // Set up input handling for manual dismiss
        this.setupTutorialInput();
        
        // Update timer display
        this.updateTimerDisplay();
        
            }

    updateTimerDisplay() {
        if (!this.tutorialActive || !this.timerText || !this.tutorialTimer) return;
        
        // Check if timer is still valid
        if (this.tutorialTimer.hasDispatched || !this.tutorialTimer.delay) {
            return;
        }
        
        const timeLeft = Math.max(0, Math.ceil((this.tutorialTimer.delay - this.tutorialTimer.elapsed) / 1000));
        
        if (timeLeft > 0 && this.timerText && this.timerText.active) {
            this.timerText.setText(`Auto-hide in ${timeLeft}s`);
            
            // Schedule next update only if tutorial is still active
            if (this.tutorialActive && this.scene && this.scene.time) {
                this.scene.time.delayedCall(1000, () => {
                    this.updateTimerDisplay();
                });
            }
        }
    }

    setupTutorialInput() {
        // Set up input handling for manual tutorial dismissal
        this.tutorialKeyHandler = (event) => {
            if (!this.tutorialActive || !this.scene) return;
            
            const key = event.key.toLowerCase();
            
            if (key === 'escape') {
                // Manually hide tutorial
                this.hideTutorialPanel();
            }
        };
        
        if (this.scene && this.scene.input && this.scene.input.keyboard) {
            this.scene.input.keyboard.on('keydown', this.tutorialKeyHandler);
                    } else {
            console.warn('LuringMiniGame: Could not setup tutorial input - keyboard not available');
        }
    }

    hideTutorialPanel() {
        if (!this.tutorialActive) return;
        
                this.tutorialActive = false;
        
        // Clear timer first to prevent updates
        if (this.tutorialTimer && !this.tutorialTimer.hasDispatched) {
            try {
                this.tutorialTimer.destroy();
            } catch (error) {
                console.warn('LuringMiniGame: Error destroying tutorial timer:', error);
            }
            this.tutorialTimer = null;
        }
        
        // Clear timer text reference
        if (this.timerText) {
            this.timerText = null;
        }
        
        // Remove input handler
        if (this.tutorialKeyHandler) {
            try {
                this.scene.input.keyboard.off('keydown', this.tutorialKeyHandler);
            } catch (error) {
                console.warn('LuringMiniGame: Error removing tutorial input handler:', error);
            }
            this.tutorialKeyHandler = null;
        }
        
        // Slide out animation to right
        if (this.tutorialContainer && this.tutorialContainer.active) {
            const width = this.scene.cameras.main.width;
            const panelWidth = 320;
            
            this.scene.tweens.add({
                targets: this.tutorialContainer,
                x: width + panelWidth/2,
                alpha: 0.7,
                duration: 300,
                ease: 'Power2.easeIn',
                onComplete: () => {
                    try {
                        if (this.tutorialContainer && this.tutorialContainer.active) {
                            this.tutorialContainer.destroy();
                        }
                    } catch (error) {
                        console.warn('LuringMiniGame: Error destroying tutorial container:', error);
                    }
                    this.tutorialContainer = null;
                }
            });
        } else {
            // If container is already destroyed or inactive, just clear reference
            this.tutorialContainer = null;
        }
    }

    startLuringMinigame() {
                // Apply equipment effects
        this.applyEquipmentEffects();
        
        // Initialize UI elements
        this.createBackground();
        this.createLureSimulation();
        this.createFishShadow();
        this.createUI();
        
        // Start the first approach
        this.startFishApproach();
        
        // Set up input handling
        this.setupInputHandling();
    }

    setupInputHandling() {
        // Set up keyboard input handling
        if (this.scene.input && this.scene.input.keyboard) {
            this.scene.input.keyboard.on('keydown', this.handleLureInput, this);
                    } else {
            console.warn('LuringMiniGame: No keyboard input available');
        }
    }

    handleLureInput(event) {
        if (!this.isActive) return;
        
        const key = event.key.toLowerCase();
                // Handle different input types based on key
        let inputType = 'unknown';
        let inputData = {};
        
        // First determine the current lure phase type
        const requiredInput = this.requiredInputs[this.currentPhase];
        const isSequenceInput = ['flick', 'swipe', 'combo', 'trace', 'circle'].includes(requiredInput);
        
        switch (key) {
            case ' ': // Spacebar
                inputType = 'tap';
                this.showInputFeedback('SPACEBAR', '#00FF88');
                break;
            case 'w':
                // Handle direction-specific logic
                if (isSequenceInput) {
                    // Let sequence handler manage this - don't call handleInput directly
                    inputType = 'sequence';
                    this.showInputFeedback('W', '#4A9EFF');
                    this.updateSequenceProgress('w');
                } else {
                    // Standard handling
                inputType = 'flick';
                    inputData = { direction: 'up', speed: 120, key: 'w' };
                    this.showInputFeedback('W', '#4A9EFF');
                }
                break;
            case 'a':
                if (isSequenceInput) {
                    inputType = 'sequence';
                    this.showInputFeedback('A', '#4A9EFF');
                    this.updateSequenceProgress('a');
                } else {
                inputType = 'flick';
                    inputData = { direction: 'left', speed: 120, key: 'a' };
                    this.showInputFeedback('A', '#4A9EFF');
                }
                break;
            case 's':
                if (isSequenceInput) {
                    inputType = 'sequence';
                    this.showInputFeedback('S', '#FF6600');
                    this.updateSequenceProgress('s');
                } else {
                inputType = 'drag';
                    inputData = { direction: 'down', speed: 120, key: 's' };
                    this.showInputFeedback('S', '#FF6600');
                }
                break;
            case 'd':
                if (isSequenceInput) {
                    inputType = 'sequence';
                    this.showInputFeedback('D', '#4A9EFF');
                    this.updateSequenceProgress('d');
                } else {
                inputType = 'flick';
                    inputData = { direction: 'right', speed: 120, key: 'd' };
                    this.showInputFeedback('D', '#4A9EFF');
                }
                break;
        }
        
        // Only pass to handleInput for non-sequence or unknown inputs
        if (inputType !== 'unknown' && inputType !== 'sequence') {
            this.handleInput(inputType, inputData);
        }
    }
    
    showInputFeedback(key, color) {
        // Create temporary feedback for key press
        if (this.keyDisplayText) {
            // Flash the key display
            this.scene.tweens.add({
                targets: this.keyDisplayText,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 100,
                yoyo: true,
                ease: 'Power2.easeOut'
            });
            
            // Temporarily change color
            const originalColor = this.keyDisplayText.style.color;
            this.keyDisplayText.setColor(color);
            
            this.scene.time.delayedCall(200, () => {
                if (this.keyDisplayText) {
                    this.keyDisplayText.setColor(originalColor);
                }
            });
        }
    }
    
    updateSequenceProgress(pressedKey) {
        const requiredInput = this.requiredInputs[this.currentPhase];
        
        // Handle Fly lure sequences (step by step)
        if ((requiredInput === 'flick' || requiredInput === 'swipe' || requiredInput === 'combo') && this.flySequence) {
            if (this.currentFlyStep < this.flySequence.length) {
                const expectedKey = this.flySequence[this.currentFlyStep].toLowerCase();
                
                // Check if the right key was pressed
                if (pressedKey === expectedKey) {
                    // Check timing for success - use a larger perfect zone for sequences
                    const isGoodTiming = this.isGoodTiming();
                    
                    if (isGoodTiming) {
                        // Good timing - advance sequence
                        this.currentFlyStep++;
                                                if (this.currentFlyStep < this.flySequence.length) {
                            // Show next key in sequence
                            const nextKey = this.flySequence[this.currentFlyStep].toUpperCase();
                            const stepText = `PRESS ${nextKey} NEXT! (${this.currentFlyStep + 1}/${this.flySequence.length})`;
                            this.showSingleKeyIndicator(nextKey, stepText, '#00FF88');
                        } else {
                            // Sequence complete!
                            this.showSingleKeyIndicator('✓', 'SEQUENCE COMPLETE!', '#00FF00');
                            this.scene.time.delayedCall(500, () => {
                                this.handlePhaseSuccess();
                            });
                        }
                    } else {
                        // Bad timing but correct key
                        const currentKeyUpper = this.flySequence[this.currentFlyStep].toUpperCase();
                        this.showSingleKeyIndicator(currentKeyUpper, `BAD TIMING! TRY AGAIN!`, '#FF8800');
                                            }
                } else {
                    // Wrong key pressed
                    const expectedKeyUpper = this.flySequence[this.currentFlyStep].toUpperCase();
                    this.showSingleKeyIndicator(expectedKeyUpper, `WRONG! PRESS ${expectedKeyUpper}!`, '#FF4444');
                }
            }
            return;
        }
        
        // Handle Spoon lure sequences (step by step)
        if ((requiredInput === 'trace' || requiredInput === 'circle') && this.spoonSequence) {
            if (this.currentSpoonStep < this.spoonSequence.length) {
                const expectedKey = this.spoonSequence[this.currentSpoonStep].toLowerCase();
                
                // Check if the right key is pressed
                if (pressedKey === expectedKey) {
                    // Check timing for success - use a larger perfect zone for sequences
                    const isGoodTiming = this.isGoodTiming();
                    
                    if (isGoodTiming) {
                        // Good timing - advance sequence
                        this.currentSpoonStep++;
                                                if (this.currentSpoonStep < this.spoonSequence.length) {
                            // Show next key in sequence
                            const nextKey = this.spoonSequence[this.currentSpoonStep].toUpperCase();
                            const stepText = `PRESS ${nextKey} NEXT! (${this.currentSpoonStep + 1}/${this.spoonSequence.length})`;
                            this.showSingleKeyIndicator(nextKey, stepText, '#C0C0C0');
                        } else {
                            // Sequence complete!
                            this.showSingleKeyIndicator('✓', 'CIRCLE COMPLETE!', '#00FF00');
                            this.scene.time.delayedCall(500, () => {
                                this.handlePhaseSuccess();
                            });
                        }
                    } else {
                        // Bad timing but correct key
                        const currentKeyUpper = this.spoonSequence[this.currentSpoonStep].toUpperCase();
                        this.showSingleKeyIndicator(currentKeyUpper, `BAD TIMING! TRY AGAIN!`, '#FF8800');
                                            }
                } else {
                    // Wrong key pressed
                    const expectedKeyUpper = this.spoonSequence[this.currentSpoonStep].toUpperCase();
                    this.showSingleKeyIndicator(expectedKeyUpper, `WRONG! PRESS ${expectedKeyUpper}!`, '#FF4444');
                }
            }
            return;
        }
        
        // Legacy sequence tracking for other lures
        if (!this.currentSequence) {
            this.currentSequence = [];
            this.sequenceStep = 0;
        }
        
        this.currentSequence.push(pressedKey);
    }

    applyEquipmentEffects() {
        // Apply lure stats to fishing mechanics
        const attractionRadius = this.lureStats.attractionRadius || 100;
        const lureSuccess = this.lureStats.lureSuccess || 5;
        const lureControl = this.lureStats.lureControl || 5;
        const biteRate = this.lureStats.biteRate || 5;
        
        // Modify fish interest mechanics based on equipment
        this.equipmentEffects = {
            attractionRadius: attractionRadius,
            interestTime: Math.max(3, 8 - (lureSuccess * 0.2)), // Better lure = faster fish interest
            controlPrecision: 1 + (lureControl * 0.1), // Better control = more precise lure movement
            biteChance: Math.min(95, 30 + (biteRate * 5)), // Better bite rate = higher chance
            rareFishBonus: this.lureStats.rareFishChance || 0,
            criticalChance: this.lureStats.criticalChance || 0
        };
        
            }

    createLureSimulationUI() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        const uiWidth = 300;
        const uiHeight = 200;
        const uiX = width - uiWidth - 20;
        const uiY = 20;
        
        this.simulationContainer = this.scene.add.container(uiX, uiY);
        this.simulationContainer.setDepth(1000);
        
        // Background panel using UITheme
        // Assuming a style like 'simulationPanel' or adapt 'panelStyles.primary' or 'secondary'
        const background = UITheme.createPanel(this.scene, 0, 0, uiWidth, uiHeight, 'primary'); 
        this.simulationContainer.add(background);
        
        // Title using UITheme
        const title = UITheme.createText(this.scene, uiWidth / 2, 15, 'LURE SIMULATION', 'headerSmall');
        title.setOrigin(0.5, 0);
        // title.setColor(UITheme.colors.info); // headerSmall style might already define this or use a specific color
        this.simulationContainer.add(title);
        
        // Water area within the UI (keep as graphics for specific look)
        const waterArea = this.scene.add.graphics();
        waterArea.fillStyle(0x004466, 0.8);
        waterArea.fillRoundedRect(10, 35, uiWidth - 20, uiHeight - 45, 5);
        this.simulationContainer.add(waterArea);
        
        // Create lure in simulation
        this.createSimulationLure(uiWidth, uiHeight);
        
        // Create fish in simulation
        this.createSimulationFish(uiWidth, uiHeight);
        
        // Control instructions
        this.createControlInstructions(uiWidth, uiHeight);
        
            }

    createSimulationLure(uiWidth, uiHeight) {
        // Initial lure position (center of water area)
        this.lurePosition.x = uiWidth / 2;
        this.lurePosition.y = (uiHeight - 45) / 2 + 35;
        
        // Create lure graphics based on type
        this.simulationLure = this.scene.add.graphics();
        this.simulationLure.setDepth(1002);
        this.updateLureVisual();
        this.simulationContainer.add(this.simulationLure);
        
        // Fishing line from top to lure
        this.simulationLine = this.scene.add.graphics();
        this.simulationLine.setDepth(1001);
        this.updateFishingLineVisual(uiWidth);
        this.simulationContainer.add(this.simulationLine);
    }

    updateLureVisual() {
        if (!this.simulationLure) return;
        
        this.simulationLure.clear();
        this.simulationLure.setPosition(this.lurePosition.x, this.lurePosition.y);
        
        // Draw lure based on type
        switch (this.lureType) {
            case 'spinner':
                // Spinner lure - circular with spinning effect
                this.simulationLure.fillStyle(0xFFD700);
                this.simulationLure.fillCircle(0, 0, 4);
                this.simulationLure.lineStyle(2, 0xC0C0C0);
                this.simulationLure.strokeCircle(0, 0, 6);
                break;
                
            case 'soft_plastic':
                // Soft plastic - worm-like shape
                this.simulationLure.fillStyle(0x8B4513);
                this.simulationLure.fillEllipse(0, 0, 3, 12);
                break;
                
            case 'fly':
                // Fly lure - feathery appearance
                this.simulationLure.fillStyle(0xFF6B6B);
                this.simulationLure.fillCircle(0, 0, 3);
                this.simulationLure.lineStyle(1, 0xFF0000);
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2;
                    this.simulationLure.lineBetween(0, 0, Math.cos(angle) * 8, Math.sin(angle) * 8);
                }
                break;
                
            case 'popper':
                // Popper lure - larger, surface lure
                this.simulationLure.fillStyle(0x00FF00);
                this.simulationLure.fillEllipse(0, 0, 6, 4);
                this.simulationLure.fillStyle(0xFFFFFF);
                this.simulationLure.fillCircle(-2, 0, 1);
                break;
                
            case 'spoon':
                // Spoon lure - metallic, curved
                this.simulationLure.fillStyle(0xC0C0C0);
                this.simulationLure.fillEllipse(0, 0, 8, 3);
                this.simulationLure.lineStyle(1, 0x808080);
                this.simulationLure.strokeEllipse(0, 0, 8, 3);
                break;
                
            default:
                // Default lure
                this.simulationLure.fillStyle(0xFFD700);
                this.simulationLure.fillCircle(0, 0, 4);
        }
    }

    updateFishingLineVisual(uiWidth) {
        if (!this.simulationLine) return;
        
        this.simulationLine.clear();
        this.simulationLine.lineStyle(2, 0x404040, 0.8);
        this.simulationLine.lineBetween(
            uiWidth / 2, 35, // From top of water area
            this.lurePosition.x, this.lurePosition.y
        );
    }

    createSimulationFish(uiWidth, uiHeight) {
        // Create 3-4 fish swimming at the bottom of the simulation
        const fishCount = Phaser.Math.Between(3, 4);
        const bottomY = uiHeight - 25; // Near bottom of UI
        
        for (let i = 0; i < fishCount; i++) {
            const fish = {
                x: Phaser.Math.Between(20, uiWidth - 20),
                y: bottomY,
                targetX: Phaser.Math.Between(20, uiWidth - 20),
                speed: Phaser.Math.Between(10, 30),
                size: Phaser.Math.Between(2, 4),
                color: Phaser.Utils.Array.GetRandom([0x4169E1, 0x32CD32, 0xFF6347, 0xFFD700]),
                interested: false,
                observing: false,
                bubbling: false
            };
            
            this.simulationFish.push(fish);
            
            // Create fish visual
            fish.graphic = this.scene.add.graphics();
            fish.graphic.setDepth(1001);
            this.updateFishVisual(fish);
            this.simulationContainer.add(fish.graphic);
            
            // Start fish movement
            this.startFishMovement(fish, uiWidth);
        }
    }

    updateFishVisual(fish) {
        if (!fish.graphic) return;
        
        fish.graphic.clear();
        fish.graphic.setPosition(fish.x, fish.y);
        
        // Fish size and color based on type and state
        const baseSize = fish.size || 8;
        let fishColor = fish.color || 0x4488ff;
        let glowColor = null;
        let showBubbles = false;
        
        // State-based visual changes
        if (fish.interested) {
            fishColor = 0x00ff88; // Green when interested
            glowColor = 0x88ffaa;
            showBubbles = true;
        } else if (fish.nearLure) {
            fishColor = 0xffaa00; // Orange when near lure
            glowColor = 0xffcc66;
        } else if (fish.observing) {
            fishColor = 0xff6600; // Red when observing
            glowColor = 0xff9966;
            showBubbles = true;
        }
        
        // Draw fish body
        fish.graphic.fillStyle(fishColor);
        fish.graphic.fillEllipse(0, 0, baseSize * 2, baseSize);
        
        // Fish tail
        const tailDirection = fish.direction || 1;
        fish.graphic.fillTriangle(
            tailDirection * baseSize, 0,
            tailDirection * baseSize * 1.5, -baseSize * 0.5,
            tailDirection * baseSize * 1.5, baseSize * 0.5
        );
        
        // Fish eye
        fish.graphic.fillStyle(0xFFFFFF);
        fish.graphic.fillCircle(baseSize * 0.3 * -tailDirection, -baseSize * 0.2, baseSize * 0.3);
        fish.graphic.fillStyle(0x000000);
        fish.graphic.fillCircle(baseSize * 0.3 * -tailDirection, -baseSize * 0.2, baseSize * 0.15);
        
        // Glow effect for special states
        if (glowColor) {
            fish.graphic.lineStyle(2, glowColor, 0.8);
            fish.graphic.strokeEllipse(0, 0, baseSize * 2.5, baseSize * 1.5);
        }
        
        // Bubbles for interested/observing fish
        if (showBubbles && fish.bubbling) {
            this.createFishBubbles(fish);
        }
        
        // Interest indicator above fish
        if (fish.interested || fish.observing) {
            this.createInterestIndicator(fish);
        }
    }

    createFishBubbles(fish) {
        // Create bubble effect above fish
        if (!fish.bubbleTimer) {
            fish.bubbleTimer = this.scene.time.addEvent({
                delay: 500,
                callback: () => {
                    if (fish.bubbling && fish.graphic && fish.graphic.active) {
                        const bubble = this.scene.add.graphics();
                        bubble.setDepth(1003);
                        bubble.fillStyle(0x87CEEB, 0.6);
                        bubble.fillCircle(
                            fish.x + Phaser.Math.Between(-5, 5),
                            fish.y - 15,
                            Phaser.Math.Between(2, 4)
                        );
                        this.simulationContainer.add(bubble);
                        
                        // Animate bubble rising
                        this.scene.tweens.add({
                            targets: bubble,
                            y: fish.y - 30,
                            alpha: 0,
                            duration: 1000,
                            ease: 'Power2.easeOut',
                            onComplete: () => bubble.destroy()
                        });
                    }
                },
                loop: true
            });
        }
    }

    createInterestIndicator(fish) {
        // Create interest level indicator
        if (!fish.interestIndicator) {
            // Using a Phaser Container for the indicator to group elements
            fish.interestIndicatorContainer = this.scene.add.container(fish.x, fish.y - 25);
            fish.interestIndicatorContainer.setDepth(1004);
            this.simulationContainer.add(fish.interestIndicatorContainer);

            // Interest meter background using UITheme
            const barBg = UITheme.createPanel(this.scene, -15, -3, 30, 6, 'secondary'); // Small, dark panel
            fish.interestIndicatorContainer.add(barBg);
            fish.interestIndicatorBg = barBg; // Store if needed for direct manipulation

            // Interest level bar (graphics for dynamic fill)
            fish.interestIndicatorFill = this.scene.add.graphics();
            fish.interestIndicatorContainer.add(fish.interestIndicatorFill);
        
            // Interest percentage text using UITheme
            const interestText = UITheme.createText(this.scene, 0, -15, `0%`, 'tiny'); // Using 'tiny' or a custom small style
            interestText.setOrigin(0.5);
            fish.interestIndicatorContainer.add(interestText);
            fish.interestIndicatorText = interestText; // Store for updates
        }
        
        // Update position of the container
        fish.interestIndicatorContainer.setPosition(fish.x, fish.y - 25);
        
        // Clear and redraw fill
        fish.interestIndicatorFill.clear();
        const interestLevel = this.shadowInterest / 100;
        const barWidth = 26 * interestLevel; // Max width 26 (inside a 30 wide bg)
        
        let barColor = UITheme.colors.error; // Use UITheme color
        if (interestLevel > 0.7) barColor = UITheme.colors.success;
        else if (interestLevel > 0.3) barColor = UITheme.colors.warning;
        
        fish.interestIndicatorFill.fillStyle(barColor);
        fish.interestIndicatorFill.fillRoundedRect(-13, -2, barWidth, 4, 1); // Position relative to container
        
        // Update text
        fish.interestIndicatorText.setText(`${Math.round(this.shadowInterest)}%`);
    }

    startFishApproach() {
                // Reset phase state
        this.phaseActive = true;
        this.phaseComplete = false;
        this.fishInterested = false;
        
        // Calculate approach speed based on aggressiveness
        const baseSpeed = 100;
        const speedMultiplier = 0.5 + (this.fishAggressiveness / 10) * 1.5; // 0.5x to 2x
        const approachSpeed = baseSpeed * speedMultiplier;
        
        // Calculate interest threshold based on elusiveness
        this.interestThreshold = 3 + Math.floor(this.fishElusiveness / 3); // 3-6 bubbles needed
        
        // Start the luring phase instead of complex fish positioning
        this.startPhase();
        
        // Update phase display
        this.updatePhaseDisplay();
    }

    startInputCooldown() {
        this.inputCooldown = true;
        this.scene.time.delayedCall(1000, () => {
            this.inputCooldown = false;
        });
    }

    checkFishInterest() {
        // Check if any fish should become interested in the lure
        this.simulationFish.forEach(fish => {
            const distance = Phaser.Math.Distance.Between(
                fish.x, fish.y,
                this.lurePosition.x, this.lurePosition.y
            );
            
            // Use equipment effects for attraction radius and interest chance (with null checking)
            const attractionRadius = this.equipmentEffects?.attractionRadius || 100;
            const baseInterestChance = 0.3;
            const equipmentBonus = (this.lureStats?.biteRate || 5) * 0.05; // 5% per bite rate point
            const interestChance = Math.min(0.8, baseInterestChance + equipmentBonus);
            
            if (distance < attractionRadius && !fish.interested && Math.random() < interestChance) {
                this.makeFishInterested(fish);
            }
        });
    }

    makeFishInterested(fish) {
        fish.interested = true;
        fish.observing = true;
        fish.bubbling = true;
        this.observingFish = fish;
        
        // Stop fish movement and make it observe
        if (fish.moveTimer) fish.moveTimer.destroy();
        if (fish.directionTimer) fish.directionTimer.destroy();
        
        this.updateFishVisual(fish);
        
        // Fish observes for 5 seconds as specified in GDD
        this.fishObservationTimer = this.scene.time.delayedCall(5000, () => {
            this.resolveFishObservation(fish);
        });
        
            }

    resolveFishObservation(fish) {
        if (!fish.observing) return;
        
        // Fish decides whether to bite based on lure performance
        const biteChance = this.shadowInterest / 100;
        const willBite = Math.random() < biteChance;
        
        if (willBite) {
            // Fish bites!
            this.handleFishBite(fish);
        } else {
            // Fish swims away
            fish.interested = false;
            fish.observing = false;
            fish.bubbling = false;
            this.observingFish = null;
            
            // Resume fish movement
            this.startFishMovement(fish, 300);
            this.updateFishVisual(fish);
            
                    }
    }

    handleFishBite(fish) {
                // Play fish bite audio
        this.audioManager?.playSFX('fish_bite');
        
        // Create bite effect
        const biteEffect = this.scene.add.graphics();
        biteEffect.setDepth(1004);
        biteEffect.fillStyle(0xFFFF00, 0.8);
        biteEffect.fillCircle(this.lurePosition.x, this.lurePosition.y, 15);
        this.simulationContainer.add(biteEffect);
        
        this.scene.tweens.add({
            targets: biteEffect,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => biteEffect.destroy()
        });
        
        // Proceed to next phase or complete
        this.handlePhaseSuccess();
    }

    selectTargetFish() {
        // Higher cast accuracy increases chance of rare fish
        const rarityBonus = this.castAccuracy / 100;
        const weightedFish = this.availableFish.map(fish => ({
            ...fish,
            weight: (1 / fish.rarity) + rarityBonus
        }));
        
        this.targetFish = Phaser.Utils.Array.GetRandom(weightedFish);
    }

    setupLurePattern() {
        // Get equipped lure type or default
        const equippedLure = this.scene.gameState?.getEquippedItem('lures');
        this.lureType = equippedLure?.type || 'spinner';
        
        // Define input patterns for each lure type according to GDD
        const lurePatterns = {
            spinner: {
                name: 'Spinner',
                control: 'Pulse Tap',
                description: 'Press SPACEBAR for quick pulses',
                phases: ['pulse', 'pulse', 'pulse'],
                instructions: 'TAP SPACEBAR when fish approaches!'
            },
            soft_plastic: {
                name: 'Soft Plastic',
                control: 'Drag and Pause',
                description: 'Press S to drag down, then pause',
                phases: ['drag', 'pause', 'drag'],
                instructions: 'DRAG DOWN (S) then PAUSE!'
            },
            fly: {
                name: 'Fly',
                control: 'Swipe Flick Combo',
                description: 'Use WASD for quick flick movements',
                phases: ['flick', 'swipe', 'combo'],
                instructions: 'FLICK with WASD directions!'
            },
            popper: {
                name: 'Popper',
                control: 'Tap and Hold Burst',
                description: 'SPACEBAR for surface bursts',
                phases: ['tap', 'hold', 'burst'],
                instructions: 'TAP and HOLD SPACEBAR for bursts!'
            },
            spoon: {
                name: 'Spoon',
                control: 'Circular Trace',
                description: 'Use WASD in circular motions',
                phases: ['trace', 'circle', 'trace'],
                instructions: 'TRACE CIRCLES with WASD!'
            }
        };
        
        this.lurePattern = lurePatterns[this.lureType] || lurePatterns.spinner;
        this.requiredInputs = this.lurePattern.phases;
        this.maxPhases = Math.min(4, Math.max(3, this.requiredInputs.length)); // 3-4 opportunities as per GDD
        
            }

    createFishShadow() {
        // Create fish shadow representation (using selectedFish data if available)
        const shadowSize = this.fishShadowSize || 'medium';
        
        // Create visual fish shadow (this will be used in the simulation)
        this.fishShadow = {
            size: shadowSize,
            aggressiveness: this.fishAggressiveness,
            elusiveness: this.fishElusiveness,
            x: 0,
            y: 0,
            visible: false,
            approaching: false,
            distance: 200,
            approachSpeed: 1 + (this.fishAggressiveness / 10),
            fleeChance: this.fishElusiveness / 20
        };
        
            }

    getShadowSize() {
        const fishSize = this.selectedFish?.size || 5;
        if (fishSize <= 3) return 'small';
        if (fishSize <= 7) return 'medium';
        return 'large';
    }

    startPhase() {
        if (this.currentPhase >= this.maxPhases) {
            this.attemptHook();
            return;
        }

        const requiredInput = this.requiredInputs[this.currentPhase];
        const difficulty = this.calculatePhaseDifficulty();
        
        // Update phase instructions
        this.updatePhaseInstructions();
        
        // Enhanced fish shadow approach mechanics
        this.fishShadow.approaching = true;
        this.fishShadow.distance = Math.max(50, 200 - (this.currentPhase * 40));
        
        // Fish behavior based on aggressiveness and elusiveness
        const aggressiveness = this.fishAggressiveness || 5;
        const elusiveness = this.fishElusiveness || 5;
        
        // Aggressive fish approach faster
        this.fishShadow.approachSpeed = 1 + (aggressiveness / 10);
        
        // Elusive fish are more likely to flee on mistakes
        this.fishShadow.fleeChance = elusiveness / 20;
        
                // Create visual fish shadow approach animation
        this.animateFishShadowApproach();
        
        // Emit phase start event with enhanced data
        this.scene.events.emit('fishing:lurePhase', {
            phase: this.currentPhase + 1,
            maxPhases: this.maxPhases,
            requiredInput: requiredInput,
            difficulty: difficulty,
            shadowInterest: this.shadowInterest,
            fishShadow: this.fishShadow,
            lureType: this.lureType,
            instructions: this.lurePattern.instructions
        });
        
        // Set phase timeout with difficulty scaling - longer for sequences
        const isSequencePhase = requiredInput === 'flick' || requiredInput === 'swipe' || requiredInput === 'combo' || requiredInput === 'trace' || requiredInput === 'circle';
        const baseTime = isSequencePhase ? 8000 : 4000; // 8 seconds for sequences, 4 for others
        const timeLimit = Math.max(3000, baseTime - (difficulty * 500)); // 3-8 seconds based on type and difficulty
        this.phaseTimeout = this.scene.time.delayedCall(timeLimit, () => {
            this.phaseTimeout = null;
                        this.handlePhaseFailure();
        });
        
        // Show phase progress
        this.updatePhaseProgress();
    }

    animateFishShadowApproach() {
        // Find a fish in the simulation to animate as approaching
        const approachingFish = this.simulationFish.find(fish => !fish.interested);
        if (approachingFish) {
            // Stop current movement
            if (approachingFish.moveTimer) approachingFish.moveTimer.destroy();
            
            // Animate approach towards lure
            const targetX = this.lurePosition.x + Phaser.Math.Between(-30, 30);
            const targetY = this.lurePosition.y + Phaser.Math.Between(-20, 20);
            
            // Use default approach speed if not set
            const approachSpeed = this.fishShadow?.approachSpeed || 1;
            
            this.scene.tweens.add({
                targets: approachingFish,
                x: targetX,
                y: targetY,
                duration: 2000 / approachSpeed,
                ease: 'Power2.easeInOut',
                onComplete: () => {
                    // Fish reaches lure area
                    approachingFish.nearLure = true;
                    this.updateFishVisual(approachingFish);
                }
            });
        }
    }

    updatePhaseProgress() {
        if (!this.phaseProgressContainer) {
            this.phaseProgressContainer = this.scene.add.container(150, 40); // Position relative to simulationContainer top-left
            this.phaseProgressContainer.setDepth(1005);
            // Ensure this container is added to simulationContainer IF it's part of that UI block
            // If it's a global UI element, it might be added directly to the scene or another main UI container.
            // Assuming it's part of the simulationContainer based on context:
            if (this.simulationContainer) {
            this.simulationContainer.add(this.phaseProgressContainer);
            } else {
                this.scene.add.existing(this.phaseProgressContainer); // Fallback if no simulationContainer
            }
        }
        
        this.phaseProgressContainer.removeAll(true);
        
        for (let i = 0; i < this.maxPhases; i++) {
            const dot = this.scene.add.graphics();
            const x = i * 20;
            const y = 0;
            
            if (i < this.currentPhase) {
                dot.fillStyle(UITheme.colors.success); // Use UITheme color
                dot.fillCircle(x, y, 6);
            } else if (i === this.currentPhase) {
                dot.fillStyle(UITheme.colors.warning); // Use UITheme color (e.g., yellow/orange)
                dot.fillCircle(x, y, 8);
                this.scene.tweens.add({
                    targets: dot,
                    scaleX: 1.3,
                    scaleY: 1.3,
                    duration: UITheme.animations.medium, // Use themed duration
                    yoyo: true,
                    repeat: -1,
                    ease: UITheme.animations.easing.easeInOut // Use themed easing
                });
            } else {
                dot.fillStyle(UITheme.colors.medium); // Use UITheme color (e.g., gray)
                dot.fillCircle(x, y, 5);
            }
            this.phaseProgressContainer.add(dot);
        }
        
        // Phase label using UITheme
        const phaseLabel = UITheme.createText(this.scene, 0, -20, `Phase ${this.currentPhase + 1}/${this.maxPhases}`, 'bodySmall');
        phaseLabel.setOrigin(0, 0.5);
        // phaseLabel.setColor(UITheme.colors.text); // bodySmall might define this
        this.phaseProgressContainer.add(phaseLabel);
    }

    calculatePhaseDifficulty() {
        // Later phases are harder, modified by fish elusiveness
        const baseDifficulty = this.currentPhase * 0.5;
        const fishDifficulty = (this.fishElusiveness || 5) / 10;
        return Math.min(2, baseDifficulty + fishDifficulty);
    }

    handleInput(inputType, inputData) {
        if (!this.isActive || this.currentPhase >= this.maxPhases) return false;

        // Ensure requiredInputs is available
        if (!this.requiredInputs || this.requiredInputs.length === 0) {
            console.warn('LuringMiniGame: No required inputs defined, using default validation');
            // Accept any input as success for now
            this.handlePhaseSuccess();
            return true;
        }

        // Check for sequence-based inputs (Fly and Spoon lures) - different validation flow
        const requiredInput = this.requiredInputs[this.currentPhase];
        const isSequenceInput = ['flick', 'swipe', 'combo', 'trace', 'circle'].includes(requiredInput);
        
        // For sequence inputs, let updateSequenceProgress handle it rather than immediate success/failure
        if (isSequenceInput) {
            // Don't trigger success/failure directly - sequence updates are handled in updateSequenceProgress
                        return true;
        }
        
        // Standard validation for non-sequence lures
        const success = this.validateInput(inputType, requiredInput, inputData);
        
        if (success) {
            this.handlePhaseSuccess();
        } else {
            this.handlePhaseFailure();
        }
        
        return true;
    }

    validateInput(inputType, requiredInput, inputData) {
        // Enhanced input validation for each lure type
                // Handle case where requiredInput is undefined
        if (!requiredInput) {
            console.warn('LuringMiniGame: No required input specified, accepting any input');
            return true;
        }
        
        switch (requiredInput) {
            case 'pulse':
                // Spinner: Quick spacebar taps
                return inputType === 'pulse' || inputType === 'tap';
                
            case 'drag':
                // Soft Plastic: S key drag down
                return inputType === 'drag' && inputData?.direction === 'down';
                
            case 'pause':
                // Soft Plastic: Brief pause (no input for 1 second)
                return inputType === 'pause' || inputType === 'wait';
                
            case 'flick':
                // Fly: Step-by-step WASD sequence (handled in updateSequenceProgress)
                return this.currentFlyStep >= this.flySequence?.length;
                
            case 'swipe':
                // Fly: Step-by-step WASD sequence (handled in updateSequenceProgress)
                return this.currentFlyStep >= this.flySequence?.length;
                
            case 'combo':
                // Fly: Step-by-step WASD sequence (handled in updateSequenceProgress)
                return this.currentFlyStep >= this.flySequence?.length;
                
            case 'tap':
                // Popper: Single spacebar tap
                return inputType === 'tap';
                
            case 'hold':
                // Popper: Hold spacebar for burst
                return inputType === 'hold' && inputData?.duration >= 500;
                
            case 'burst':
                // Popper: Release for surface burst
                return inputType === 'burst' || inputType === 'release';
                
            case 'trace':
                // Spoon: Step-by-step circular sequence (handled in updateSequenceProgress)
                return this.currentSpoonStep >= this.spoonSequence?.length;
                
            case 'circle':
                // Spoon: Step-by-step circular sequence (handled in updateSequenceProgress)
                return this.currentSpoonStep >= this.spoonSequence?.length;
                
            default:
                // Fallback to basic validation
                                return inputType === requiredInput || inputType === 'tap'; // Accept tap as fallback
        }
    }

    handlePhaseSuccess() {
        // Clear timeout
        if (this.phaseTimeout) {
            this.phaseTimeout.destroy();
            this.phaseTimeout = null;
        }
        
        // Stop timing meter
        this.stopTimingMeter();

        // Play phase success audio
        this.audioManager?.playSFX('lure_success');

        // Calculate success bonus based on timing accuracy
        const timingAccuracy = this.getTimingAccuracy();
        let baseBonus = 20;
        let timingBonus = Math.floor(baseBonus * timingAccuracy);

        // Increase shadow interest
        this.shadowInterest = Math.min(100, this.shadowInterest + timingBonus);
        
        // Apply lure success bonus (with null checking)
        const lureBonus = this.lureStats?.lureSuccess || 0;
        this.shadowInterest += lureBonus;
        
                // Show success feedback
        this.showPhaseSuccessFeedback(timingAccuracy);
        
        // Move to next phase
        this.currentPhase++;
        
        // Emit success event
        this.scene.events.emit('fishing:lurePhaseSuccess', {
            phase: this.currentPhase,
            shadowInterest: this.shadowInterest,
            timingAccuracy: timingAccuracy
        });
        
        // Start next phase or attempt hook after brief delay
        this.scene.time.delayedCall(1500, () => {
            // Clear previous UI elements before proceeding
            this.hideAllInputIndicators();
            
            if (this.currentPhase < this.maxPhases) {
            this.startPhase();
            } else {
                this.attemptHook();
            }
        });
    }
    
    showPhaseSuccessFeedback(timingAccuracy) {
        // Update instruction text with success feedback
        let feedbackText = '';
        let feedbackColor = '';
        
        if (timingAccuracy >= 1.0) {
            feedbackText = '🎯 PERFECT TIMING! +' + Math.floor(20 * timingAccuracy) + ' Interest';
            feedbackColor = '#00FF00';
        } else if (timingAccuracy >= 0.7) {
            feedbackText = '✅ GOOD TIMING! +' + Math.floor(20 * timingAccuracy) + ' Interest';
            feedbackColor = '#FFFF00';
        } else {
            feedbackText = '⚠️ OKAY TIMING +' + Math.floor(20 * timingAccuracy) + ' Interest';
            feedbackColor = '#FF6666';
        }
        
        if (this.phaseInstructionText) {
            this.phaseInstructionText.setText(feedbackText);
            this.phaseInstructionText.setColor(feedbackColor);
        }
        
        if (this.inputPromptText) {
            this.inputPromptText.setText('Moving to next phase...');
            this.inputPromptText.setColor('#AAAAAA');
        }
        
        // Update interest meter
        this.updateInterestMeter();
        
        // Create success particle effect
        this.createSuccessEffect();
    }
    
    createSuccessEffect() {
        // Create a simple success effect
        if (this.uiContainer) {
            const successText = this.scene.add.text(0, -100, '✨ SUCCESS! ✨', {
                fontSize: '24px',
                fill: '#00FF88',
                fontStyle: 'bold'
            });
            successText.setOrigin(0.5);
            this.uiContainer.add(successText);
            
            // Animate the success text
            this.scene.tweens.add({
                targets: successText,
                y: -150,
                alpha: 0,
                scale: 1.5,
                duration: 1000,
                ease: 'Power2.easeOut',
                onComplete: () => {
                    successText.destroy();
                }
            });
        }
    }

    handlePhaseFailure() {
        // Clear timeout
        if (this.phaseTimeout) {
            this.phaseTimeout.destroy();
            this.phaseTimeout = null;
        }
        
        // Stop timing meter
        this.stopTimingMeter();

        // Decrease shadow interest
        this.shadowInterest = Math.max(0, this.shadowInterest - 30);
        
                // Show failure feedback
        this.showPhaseFailureFeedback();
        
        // Check if fish loses interest completely
        if (this.shadowInterest <= 0) {
            this.scene.time.delayedCall(1500, () => {
            this.complete(false, null);
            });
            return;
        }
        
        // Move to next phase (fish gives another chance)
        this.currentPhase++;
        
        // Emit failure event
        this.scene.events.emit('fishing:lurePhaseFailure', {
            phase: this.currentPhase,
            shadowInterest: this.shadowInterest
        });
        
        // Continue if phases remain
        if (this.currentPhase < this.maxPhases) {
            this.scene.time.delayedCall(1500, () => {
                this.startPhase();
            });
        } else {
            this.scene.time.delayedCall(1500, () => {
            this.attemptHook();
            });
        }
    }
    
    showPhaseFailureFeedback() {
        // Update instruction text with failure feedback
        if (this.phaseInstructionText) {
            this.phaseInstructionText.setText('❌ MISSED! Fish loses interest');
            this.phaseInstructionText.setColor('#FF4444');
        }
        
        if (this.inputPromptText) {
            if (this.shadowInterest <= 0) {
                this.inputPromptText.setText('Fish swam away...');
            } else {
                this.inputPromptText.setText('Try again in next phase...');
            }
            this.inputPromptText.setColor('#FF6666');
        }
        
        // Update interest meter
        this.updateInterestMeter();
        
        // Create failure effect
        this.createFailureEffect();
    }
    
    createFailureEffect() {
        // Create a failure effect
        if (this.uiContainer) {
            const failureText = this.scene.add.text(0, -100, '💔 MISSED!', {
                fontSize: '24px',
                fill: '#FF4444',
                fontStyle: 'bold'
            });
            failureText.setOrigin(0.5);
            this.uiContainer.add(failureText);
            
            // Animate the failure text
            this.scene.tweens.add({
                targets: failureText,
                y: -150,
                alpha: 0,
                scale: 1.2,
                duration: 1000,
                ease: 'Power2.easeOut',
                onComplete: () => {
                    failureText.destroy();
                }
            });
            
            // Screen shake effect
            this.scene.cameras.main.shake(200, 0.01);
        }
    }

    attemptHook() {
        // Prevent duplicate hook attempts
        if (this.isCompleted) {
                        return;
        }
        
        // Hide all indicators immediately for clean transition
        this.hideAllInputIndicators();
        
        // Final hooking attempt based on accumulated interest
        const hookChance = this.shadowInterest / 100;
        const biteRateBonus = (this.lureStats?.biteRate || 0) / 100;
        const finalChance = Math.min(0.95, hookChance + biteRateBonus);
        
        const success = Math.random() < finalChance;
        
        if (import.meta.env.DEV) console.log('Debug statement');
        if (import.meta.env.DEV) console.log('Debug statement');
        // Show hook attempt message before transition
        if (this.phaseInstructionText) {
            // Make the result message large and prominent
            this.phaseInstructionText.setText(success ? '🎣 FISH HOOKED!' : '💔 FISH GOT AWAY!');
            this.phaseInstructionText.setColor(success ? '#00FF88' : '#FF4444');
            this.phaseInstructionText.setFontSize('36px');
            
            // Add animation to make it more noticeable
            this.scene.tweens.add({
                targets: this.phaseInstructionText,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 200,
                yoyo: true,
                repeat: 1
            });
        }
        
        // Use longer delay in debug mode to keep the result visible
        const delayTime = this.debugMode ? 1000 : 300;
        
        // Slightly delay the completion to allow for the message to be seen
        this.scene.time.delayedCall(delayTime, () => {
        if (success) {
            this.complete(true, this.selectedFish);
        } else {
            this.complete(false, null);
        }
        });
    }

    complete(success, fishHooked) {
        // Prevent multiple completions
        if (this.isCompleted) {
                        return;
        }
        
        this.isCompleted = true;
        this.isActive = false;
        
                // IMMEDIATELY clean up input handling to prevent interference with next phase
        if (this.scene && this.scene.input && this.scene.input.keyboard) {
        this.scene.input.keyboard.off('keydown', this.handleLureInput, this);
            
            // In debug mode, don't restore regular game controls - LuringDebugTool will handle that
            // This prevents issues with both systems trying to manage controls
                    }
        
        // Clean up timers
        if (this.phaseTimeout) {
            this.phaseTimeout.destroy();
            this.phaseTimeout = null;
        }
        
        if (this.fishObservationTimer) {
            this.fishObservationTimer.destroy();
            this.fishObservationTimer = null;
        }

        // Hide UI elements immediately
        this.hideAllInputIndicators();
        
        // Hide tutorial if it's still active
        if (this.tutorialActive) {
            this.hideTutorialPanel();
        }
        
        // Clean up UI for transition
        if (this.uiContainer) {
            // Fade out UI container
            this.scene.tweens.add({
                targets: this.uiContainer,
                alpha: 0,
                duration: 300,
                ease: 'Power2.easeOut',
                onComplete: () => {
                    if (this.uiContainer && this.uiContainer.active) {
                        this.uiContainer.visible = false;
                    }
                }
            });
        }

        // Validate and ensure fish data has required properties
        let validatedFishHooked = null;
        
        if (success && fishHooked && typeof fishHooked === 'object') {
            // Ensure fish object has all required properties
            validatedFishHooked = {
                id: fishHooked.id || 'unknown_fish',
                name: fishHooked.name || 'Unknown Fish',
                size: fishHooked.size || 5,
                rarity: fishHooked.rarity || 1,
                aggressiveness: fishHooked.aggressiveness || 5,
                elusiveness: fishHooked.elusiveness || 5,
                strength: fishHooked.strength || 5,
                speed: fishHooked.speed || 5,
                endurance: fishHooked.endurance || 5,
                // Preserve any additional properties
                ...fishHooked
            };
        }
        
                // Schedule emission of completion event after cleanup
        this.scene.time.delayedCall(100, () => {
        // Emit completion event
        this.scene.events.emit('fishing:lureComplete', {
            success: success,
            fishHooked: validatedFishHooked,
            finalInterest: this.shadowInterest
            });
        });
        
        // Force a cleanup after a delay to ensure everything is removed
        this.scene.time.delayedCall(500, () => {
            this.performCleanup();
        });
    }
    
    performCleanup() {
                // Stop all animations/tweens on UI elements
        this.stopAllIndicatorAnimations();
        
        // Hide all UI elements
        if (this.uiContainer && this.uiContainer.active) {
            this.uiContainer.visible = false;
        }
        
        if (this.interestMeterContainer && this.interestMeterContainer.active) {
            this.interestMeterContainer.visible = false;
        }
        
        if (this.simulationContainer && this.simulationContainer.active) {
            this.simulationContainer.visible = false;
        }
    }

    destroy() {
                this.isActive = false;
        this.isCompleted = true; // Mark as completed to prevent duplicate calls
        this.tutorialActive = false;
        
        // Force a cleanup first to hide all UI elements
        this.performCleanup();
        
        // Stop all tweens related to this game
        if (this.scene && this.scene.tweens) {
            // Try to stop all tweens associated with our UI containers
            const containers = [
                this.uiContainer, 
                this.tutorialContainer, 
                this.interestMeterContainer, 
                this.simulationContainer,
                this.keyDisplayText,
                this.keyDisplayBg,
                this.actionDescriptionText,
                this.holdDurationContainer,
                this.sequenceContainer,
                this.successZone
            ];
            
            containers.forEach(container => {
                if (container) {
                    try {
                        this.scene.tweens.killTweensOf(container);
                    } catch (error) {
                        // Ignore errors, just continue cleanup
                    }
                }
            });
        }
        
        // Clean up tutorial panel 
        if (this.tutorialTimer && !this.tutorialTimer.hasDispatched) {
            try {
                this.tutorialTimer.destroy();
            } catch (error) {
                console.warn('LuringMiniGame: Error destroying tutorial timer:', error);
            }
            this.tutorialTimer = null;
        }
        
        // Clear timer text reference
        if (this.timerText) {
            this.timerText = null;
        }
        
        if (this.tutorialKeyHandler && this.scene && this.scene.input && this.scene.input.keyboard) {
            try {
                this.scene.input.keyboard.off('keydown', this.tutorialKeyHandler);
            } catch (error) {
                console.warn('LuringMiniGame: Error removing tutorial key handler:', error);
            }
            this.tutorialKeyHandler = null;
        }
        
        if (this.tutorialContainer && this.tutorialContainer.active) {
            try {
                this.tutorialContainer.destroy();
            } catch (error) {
                console.warn('LuringMiniGame: Error destroying tutorial container:', error);
            }
            this.tutorialContainer = null;
        }
        
        // Clean up main game input handling
        if (this.scene && this.scene.input && this.scene.input.keyboard) {
            try {
                this.scene.input.keyboard.off('keydown', this.handleLureInput, this);
            } catch (error) {
                console.warn('LuringMiniGame: Error removing lure input handler:', error);
            }
        }
        
        // Clean up all timers
        const timers = [
            { name: 'phaseTimeout', timer: this.phaseTimeout },
            { name: 'fishObservationTimer', timer: this.fishObservationTimer },
            { name: 'timingTimer', timer: this.timingTimer },
            { name: 'holdTimer', timer: this.holdTimer }
        ];
        
        timers.forEach(({ name, timer }) => {
            if (timer && !timer.hasDispatched) {
                try {
                    timer.destroy();
            } catch (error) {
                    console.warn(`LuringMiniGame: Error destroying ${name}:`, error);
                }
            }
        });
        
        this.phaseTimeout = null;
            this.fishObservationTimer = null;
        this.timingTimer = null;
        this.holdTimer = null;
        
        // Clean up fish timers
        if (this.simulationFish && Array.isArray(this.simulationFish)) {
            this.simulationFish.forEach((fish, index) => {
                try {
                    if (fish.moveTimer && !fish.moveTimer.hasDispatched) {
                        fish.moveTimer.destroy();
                    }
                    if (fish.directionTimer && !fish.directionTimer.hasDispatched) {
                        fish.directionTimer.destroy();
                    }
                    if (fish.bubbleTimer && !fish.bubbleTimer.hasDispatched) {
                        fish.bubbleTimer.destroy();
                    }
                    
                    // Destroy fish graphics
                    if (fish.graphic && fish.graphic.active) {
                        fish.graphic.destroy();
                    }
                    
                    // Destroy interest indicators
                    if (fish.interestIndicatorContainer && fish.interestIndicatorContainer.active) {
                        fish.interestIndicatorContainer.destroy();
                    }
                } catch (error) {
                    console.warn(`LuringMiniGame: Error cleaning up fish ${index}:`, error);
                }
            });
            
            // Clear the fish array
            this.simulationFish = [];
        }
        
        // Stop all indicator animations and destroy any active animations
        this.stopAllIndicatorAnimations();
        
        // Force destroy all UI containers - more thorough than just hiding
        const uiContainers = [
            { name: 'uiContainer', container: this.uiContainer },
            { name: 'interestMeterContainer', container: this.interestMeterContainer },
            { name: 'simulationContainer', container: this.simulationContainer },
            { name: 'inputIndicatorContainer', container: this.inputIndicatorContainer },
            { name: 'holdDurationContainer', container: this.holdDurationContainer },
            { name: 'sequenceContainer', container: this.sequenceContainer },
            { name: 'phaseProgressContainer', container: this.phaseProgressContainer }
        ];
        
        uiContainers.forEach(({ name, container }) => {
            if (container && container.active) {
                try {
                    // Set visibility to false first
                    container.visible = false;
                    // Then destroy
                    container.destroy();
            } catch (error) {
                    console.warn(`LuringMiniGame: Error destroying ${name}:`, error);
                }
            }
        });
        
                 // Clear all references
         this.uiContainer = null;
         this.interestMeterContainer = null;
         this.simulationContainer = null;
         this.inputIndicatorContainer = null;
         this.holdDurationContainer = null;
         this.sequenceContainer = null;
         this.phaseProgressContainer = null;
         this.keyDisplayText = null;
         this.keyDisplayBg = null;
         this.actionDescriptionText = null;
         this.instructionPanel = null;
         this.phaseIndicatorText = null;
         this.phaseInstructionText = null;
         this.timingMeterBg = null;
         this.timingMeterFill = null;
         this.successZone = null;
         this.successZoneLabel = null;
         this.timingLabel = null;
         this.arrowLeft = null;
         this.arrowRight = null;
         this.arrowLeftTween = null;
         this.arrowRightTween = null;
        
            }

    detectCircularPattern() {
        if (!this.spoonPattern || this.spoonPattern.length < 4) return false;
        
        // Get last 4 inputs
        const recent = this.spoonPattern.slice(-4).map(input => input.key);
        
        // Check for circular patterns
        const clockwise = ['w', 'd', 's', 'a'];
        const counterclockwise = ['w', 'a', 's', 'd'];
        
        // Check if recent inputs match circular pattern
        for (let i = 0; i <= clockwise.length - recent.length; i++) {
            const slice = clockwise.slice(i, i + recent.length);
            if (JSON.stringify(slice) === JSON.stringify(recent)) return true;
        }
        
        for (let i = 0; i <= counterclockwise.length - recent.length; i++) {
            const slice = counterclockwise.slice(i, i + recent.length);
            if (JSON.stringify(slice) === JSON.stringify(recent)) return true;
        }
        
        return false;
    }

    calculateCircularCompleteness() {
        if (!this.spoonPattern || this.spoonPattern.length < 2) return 0;
        
        const uniqueDirections = new Set(this.spoonPattern.map(input => input.key));
        const completeness = uniqueDirections.size / 4; // 4 directions = 100%
        
        return Math.min(1, completeness);
    }

    updatePhaseInstructions() {
        if (!this.phaseInstructionText || !this.isActive) return;
        
        const currentPhase = this.currentPhase;
        const requiredInput = this.requiredInputs[currentPhase];
        
        // Update phase indicator
        if (this.phaseIndicatorText) {
            this.phaseIndicatorText.setText(`Phase ${currentPhase + 1}/${this.maxPhases}`);
        }
        
        let instruction = 'Get ready...';
        
        if (currentPhase < this.maxPhases) {
            switch (requiredInput) {
                case 'pulse':
                    instruction = '⚡ SPINNER LURE - Quick Pulses';
                    this.showKeyIndicator('SPACEBAR', 'TAP RAPIDLY!', '#00FF88');
                    break;
                case 'drag':
                    instruction = '🪱 SOFT PLASTIC - Drag Down';
                    this.showHoldIndicator('S', 'HOLD TO DRAG DOWN', 1500);
                    break;
                case 'pause':
                    instruction = '⏸️ SOFT PLASTIC - Pause';
                    this.showKeyIndicator('WAIT', 'DON\'T PRESS ANYTHING!', '#FFAA00');
                    break;
                case 'flick':
                    instruction = '🦋 FLY LURE - Quick Flicks';
                    this.showSingleKeyIndicator('W', 'PRESS W FIRST!', '#00FF88');
                    this.currentFlyStep = 0;
                    this.flySequence = ['W', 'A', 'S', 'D'];
                    break;
                case 'swipe':
                    instruction = '🦋 FLY LURE - Swipe Motion';
                    this.showSingleKeyIndicator('W', 'PRESS W FIRST!', '#00FF88');
                    this.currentFlyStep = 0;
                    this.flySequence = ['W', 'A', 'S', 'D'];
                    break;
                case 'combo':
                    instruction = '🦋 FLY LURE - Combo Moves';
                    this.showSingleKeyIndicator('W', 'PRESS W FIRST!', '#00FF88');
                    this.currentFlyStep = 0;
                    this.flySequence = ['W', 'A', 'S', 'D'];
                    break;
                case 'tap':
                    instruction = '💥 POPPER LURE - Surface Tap';
                    this.showKeyIndicator('SPACEBAR', 'TAP ONCE!', '#FF6600');
                    break;
                case 'hold':
                    instruction = '💥 POPPER LURE - Hold Burst';
                    this.showHoldIndicator('SPACEBAR', 'HOLD FOR BURST', 2000);
                    break;
                case 'burst':
                    instruction = '💥 POPPER LURE - Release Burst';
                    this.showKeyIndicator('RELEASE', 'LET GO OF SPACEBAR!', '#FF0000');
                    break;
                case 'trace':
                    instruction = '🥄 SPOON LURE - Trace Motion';
                    this.showSingleKeyIndicator('W', 'PRESS W FIRST!', '#00FF88');
                    this.currentSpoonStep = 0;
                    this.spoonSequence = ['W', 'A', 'S', 'D'];
                    break;
                case 'circle':
                    instruction = '🥄 SPOON LURE - Circular Motion';
                    this.showSingleKeyIndicator('W', 'PRESS W FIRST!', '#00FF88');
                    this.currentSpoonStep = 0;
                    this.spoonSequence = ['W', 'D', 'S', 'A'];
                    break;
                default:
                    instruction = `Phase ${currentPhase + 1}: ${requiredInput}`;
                    this.showKeyIndicator('?', 'Follow the pattern!', '#FFFFFF');
            }
        } else {
            instruction = '🎣 Fish is interested!';
            this.hideAllInputIndicators();
        }
        
        this.phaseInstructionText.setText(instruction);
        
        // Update interest meter
        this.updateInterestMeter();
        
        // Start timing meter for this phase
        this.startTimingMeter();
        
        // Use UITheme colors
        if (currentPhase === 0) {
            this.phaseInstructionText.setColor('#00FF88'); // Green for first phase
        } else if (currentPhase === this.maxPhases - 1) {
            this.phaseInstructionText.setColor('#FFD700'); // Gold for final phase
        } else {
            this.phaseInstructionText.setColor('#4A9EFF'); // Blue for middle phases
        }
    }
    
    startTimingMeter() {
        if (!this.timingMeterFill) return;
        
        // Clear previous meter
        this.timingMeterFill.clear();
        
        // Start timing animation
        this.timingProgress = 0;
        this.timingDirection = 1; // 1 for forward, -1 for backward
        
        // Create timing loop
        if (this.timingTimer) {
            this.timingTimer.destroy();
        }
        
        this.timingTimer = this.scene.time.addEvent({
            delay: 50, // Update every 50ms
            callback: this.updateTimingMeter,
            callbackScope: this,
            loop: true
        });
    }
    
    updateTimingMeter() {
        if (!this.timingMeterFill || !this.isActive) return;
        
        // Update progress - much slower for easier timing
        this.timingProgress += this.timingDirection * 0.8; // 0.8% per update (much slower)
        
        // Bounce back and forth
        if (this.timingProgress >= 100) {
            this.timingProgress = 100;
            this.timingDirection = -1;
        } else if (this.timingProgress <= 0) {
            this.timingProgress = 0;
            this.timingDirection = 1;
        }
        
        // Clear and redraw meter
        this.timingMeterFill.clear();
        
        // Determine color based on position - larger success zones
        let fillColor = 0xFF0000; // Red for bad timing
        let glowColor = 0xFF4444; // Red glow
        if (this.timingProgress >= 35 && this.timingProgress <= 65) {
            fillColor = 0x00FF00; // Green for perfect timing (larger zone)
            glowColor = 0x44FF44; // Green glow
        } else if (this.timingProgress >= 20 && this.timingProgress <= 80) {
            fillColor = 0xFFFF00; // Yellow for okay timing (much larger zone)
            glowColor = 0xFFFF44; // Yellow glow
        }
        
        // Draw the moving indicator - larger and more visible
        const indicatorWidth = 15;
        const meterWidth = 396; // 400 - 4 (padding)
        const indicatorX = -198 + (this.timingProgress / 100) * meterWidth - indicatorWidth / 2;
        
        // Draw glow effect first
        this.timingMeterFill.fillStyle(glowColor, 0.4);
        this.timingMeterFill.fillRoundedRect(indicatorX - 3, 57, indicatorWidth + 6, 36, 12);
        
        // Draw main indicator
        this.timingMeterFill.fillStyle(fillColor, 0.9);
        this.timingMeterFill.fillRoundedRect(indicatorX, 60, indicatorWidth, 30, 10);
        
        // Add white highlight for better visibility
        this.timingMeterFill.fillStyle(0xFFFFFF, 0.6);
        this.timingMeterFill.fillRoundedRect(indicatorX + 2, 62, indicatorWidth - 4, 8, 4);
    }
    
    stopTimingMeter() {
        if (this.timingTimer) {
            this.timingTimer.destroy();
            this.timingTimer = null;
        }
    }
    
    getTimingAccuracy() {
        if (!this.timingProgress) return 0.5; // Default to 50% if no timing
        
        // Perfect timing is 35-65% (larger zone)
        if (this.timingProgress >= 35 && this.timingProgress <= 65) {
            return 1.0; // Perfect
        } else if (this.timingProgress >= 20 && this.timingProgress <= 80) {
            return 0.8; // Good (better reward for larger zone)
        } else {
            return 0.4; // Poor (less harsh penalty)
        }
    }
    
    isGoodTiming() {
        // Check if the current timing is within acceptable range
        if (!this.timingProgress) return true; // Default to true if no timing system
        
        // For sequence lures, be EXTREMELY forgiving - almost any timing is fine
        const requiredInput = this.requiredInputs[this.currentPhase];
        const isSequenceInput = ['flick', 'swipe', 'combo', 'trace', 'circle'].includes(requiredInput);
        
        if (isSequenceInput) {
            // Accept timing in a huge window (10-90%) for sequences to reduce frustration
            return this.timingProgress >= 10 && this.timingProgress <= 90;
        } else {
            // Regular lures use the normal timing window (20-80%)
            return this.timingProgress >= 20 && this.timingProgress <= 80;
        }
    }

    completePhase(success) {
        if (import.meta.env.DEV) console.log('LuringMiniGame: Completing phase with success:', success);
        this.phaseComplete = true;
        this.phaseActive = false;
        this.phaseSuccesses[this.currentPhase] = success;
        
        if (success) {
            // Show success feedback
            this.createSuccessFeedback();
            
            // Check if all phases complete
            if (this.currentPhase >= this.totalPhases - 1) {
                // All phases complete - hook the fish!
                this.hookFish();
            } else {
                // Move to next phase
                this.currentPhase++;
                this.scene.time.delayedCall(1500, () => {
                    this.startFishApproach();
                });
            }
        } else {
            // Phase failed - fish swims away
            this.fishSwimAway();
        }
    }

    createSuccessFeedback() {
        if (this.phaseInstructionText) {
            this.phaseInstructionText.setText('✅ SUCCESS! Fish is interested!');
            this.phaseInstructionText.setColor(UITheme.colors.success); // Use UITheme color
        }
    }

    fishSwimAway() {
                // Complete the minigame as failure
        this.scene.time.delayedCall(1000, () => {
            this.complete(false, null);
        });
    }

    createHookAnimation() {
        if (this.phaseInstructionText) {
            this.phaseInstructionText.setText('🎣 FISH HOOKED! Transitioning to reeling...');
            this.phaseInstructionText.setColor(UITheme.colors.gold); // Use UITheme color (gold for hook)
        }
    }

    hookFish() {
        // Prevent duplicate hook calls
        if (this.isCompleted) {
                        return;
        }
        
        if (import.meta.env.DEV) console.log('Debug statement');
        if (import.meta.env.DEV) console.log('Debug statement');
        // Create hook animation
        this.createHookAnimation();
        
        // Play hook sound with null checking
        if (this.scene && this.scene.gameState) {
            const audioManager = this.scene.gameState.getAudioManager(this.scene);
            audioManager?.playSFX('hook_set');
        } else {
            console.warn('LuringMiniGame: Cannot play hook sound - gameState not available');
        }
        
        // Transition to reeling minigame
        this.scene.time.delayedCall(1500, () => {
            // Check again before completing to prevent race conditions
            if (this.isCompleted) {
                                return;
            }
            
            // Ensure we have a valid fish object to pass
            const fishToPass = this.selectedFish || {
                id: 'fallback_fish',
                name: 'Mystery Fish',
                size: 5,
                rarity: 3,
                aggressiveness: 5,
                elusiveness: 5
            };
            
            this.complete(true, fishToPass);
        });
    }

    createBackground() {
        // Don't create a dark background overlay - let the fishing scene remain visible
        // The luring minigame UI has its own containers and backgrounds
            }

    createLureSimulation() {
        // Create the lure simulation UI
        this.createLureSimulationUI();
        
        // Set up lure pattern and equipment effects
        this.setupLurePattern();
        this.applyEquipmentEffects();
        
            }

    createUI() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Create main UI container
        this.uiContainer = this.scene.add.container(width / 2, height - 200);
        this.uiContainer.setDepth(1005);
        
        // Background panel for instructions - larger for more indicators
        this.instructionPanel = this.scene.add.graphics();
        this.instructionPanel.fillStyle(0x000000, 0.9);
        this.instructionPanel.lineStyle(3, 0x4a9eff, 0.8);
        this.instructionPanel.fillRoundedRect(-400, -120, 800, 240, 15);
        this.instructionPanel.strokeRoundedRect(-400, -120, 800, 240, 15);
        this.uiContainer.add(this.instructionPanel);
        
        // Phase indicator
        this.phaseIndicatorText = UITheme.createText(
            this.scene, 
            0, 
            -100, 
            'Phase 1/3', 
            'headerSmall'
        );
        this.phaseIndicatorText.setOrigin(0.5);
        this.phaseIndicatorText.setColor('#FFD700');
        this.uiContainer.add(this.phaseIndicatorText);
        
        // Main instruction text
        this.phaseInstructionText = UITheme.createText(
            this.scene, 
            0, 
            -70, 
            'Get ready to lure the fish...', 
            'bodyLarge'
        );
        this.phaseInstructionText.setOrigin(0.5);
        this.phaseInstructionText.setColor('#FFFFFF');
        this.uiContainer.add(this.phaseInstructionText);
        
        // Create enhanced input indicator system
        this.createInputIndicator();
        
        // Timing meter background - larger and more visible
        this.timingMeterBg = this.scene.add.graphics();
        this.timingMeterBg.fillStyle(0x333333, 0.9);
        this.timingMeterBg.lineStyle(2, 0x666666);
        this.timingMeterBg.fillRoundedRect(-200, 60, 400, 30, 15);
        this.timingMeterBg.strokeRoundedRect(-200, 60, 400, 30, 15);
        this.uiContainer.add(this.timingMeterBg);
        
        // Timing meter fill
        this.timingMeterFill = this.scene.add.graphics();
        this.uiContainer.add(this.timingMeterFill);
        
        // Success zone indicator - MUCH larger and more prominent
        this.successZone = this.scene.add.graphics();
        this.successZone.fillStyle(0x00FF00, 0.4);
        this.successZone.lineStyle(3, 0x00FF00, 0.8);
        this.successZone.fillRoundedRect(-120, 60, 240, 30, 15); // Huge success zone (20-80%)
        this.successZone.strokeRoundedRect(-120, 60, 240, 30, 15);
        
        // Add animated arrows pointing to success zone
        this.arrowLeft = this.scene.add.text(-130, 75, '▶', { 
            fontSize: '24px', 
            fontStyle: 'bold',
            color: '#FFFF00' 
        });
        this.arrowLeft.setOrigin(0.5);
        this.arrowLeftTween = this.scene.tweens.add({
            targets: this.arrowLeft,
            x: '-=10',
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        this.arrowRight = this.scene.add.text(130, 75, '◀', { 
            fontSize: '24px', 
            fontStyle: 'bold',
            color: '#FFFF00' 
        });
        this.arrowRight.setOrigin(0.5);
        this.arrowRightTween = this.scene.tweens.add({
            targets: this.arrowRight,
            x: '+=10',
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        this.uiContainer.add([this.successZone, this.arrowLeft, this.arrowRight]);
        
        // Success zone label
        this.successZoneLabel = UITheme.createText(this.scene, 0, 75, 'PERFECT', 'bodySmall');
        this.successZoneLabel.setOrigin(0.5);
        this.successZoneLabel.setColor('#00FF00');
        this.successZoneLabel.setFontStyle('bold');
        this.uiContainer.add(this.successZoneLabel);
        
        // Timing meter label
        this.timingLabel = UITheme.createText(this.scene, 0, 40, 'TIMING METER', 'bodySmall');
        this.timingLabel.setOrigin(0.5);
        this.timingLabel.setColor('#CCCCCC');
        this.uiContainer.add(this.timingLabel);
        
        // Interest meter
        this.createInterestMeter();
        
            }
    
    createInputIndicator() {
        // Container for input indicators
        this.inputIndicatorContainer = this.scene.add.container(0, -40);
        this.uiContainer.add(this.inputIndicatorContainer);
        
        // Key display area - shows which key to press
        this.keyDisplayBg = this.scene.add.graphics();
        this.keyDisplayBg.fillStyle(0x1a1a2e, 0.9);
        this.keyDisplayBg.lineStyle(3, 0x4a9eff, 0.8);
        this.keyDisplayBg.fillRoundedRect(-60, -25, 120, 50, 10);
        this.keyDisplayBg.strokeRoundedRect(-60, -25, 120, 50, 10);
        this.inputIndicatorContainer.add(this.keyDisplayBg);
        
        // Key text - shows the actual key to press
        this.keyDisplayText = UITheme.createText(this.scene, 0, 0, '', 'headerLarge');
        this.keyDisplayText.setOrigin(0.5);
        this.keyDisplayText.setColor('#FFFFFF');
        this.keyDisplayText.setFontStyle('bold');
        this.inputIndicatorContainer.add(this.keyDisplayText);
        
        // Action description below key
        this.actionDescriptionText = UITheme.createText(this.scene, 0, 35, '', 'bodyMedium');
        this.actionDescriptionText.setOrigin(0.5);
        this.actionDescriptionText.setColor('#00FF88');
        this.inputIndicatorContainer.add(this.actionDescriptionText);
        
        // Hold duration bar (for hold actions)
        this.holdDurationContainer = this.scene.add.container(150, 0);
        this.inputIndicatorContainer.add(this.holdDurationContainer);
        
        // Hold duration background
        this.holdDurationBg = this.scene.add.graphics();
        this.holdDurationBg.fillStyle(0x333333, 0.8);
        this.holdDurationBg.lineStyle(2, 0x666666);
        this.holdDurationBg.fillRoundedRect(-50, -10, 100, 20, 10);
        this.holdDurationBg.strokeRoundedRect(-50, -10, 100, 20, 10);
        this.holdDurationContainer.add(this.holdDurationBg);
        
        // Hold duration fill
        this.holdDurationFill = this.scene.add.graphics();
        this.holdDurationContainer.add(this.holdDurationFill);
        
        // Hold duration label
        this.holdDurationLabel = UITheme.createText(this.scene, 0, -25, 'HOLD DURATION', 'bodySmall');
        this.holdDurationLabel.setOrigin(0.5);
        this.holdDurationLabel.setColor('#CCCCCC');
        this.holdDurationContainer.add(this.holdDurationLabel);
        
        // Sequence indicator (for combo actions like WASD circles)
        this.sequenceContainer = this.scene.add.container(-150, 0);
        this.inputIndicatorContainer.add(this.sequenceContainer);
        
        // Sequence background
        this.sequenceBg = this.scene.add.graphics();
        this.sequenceBg.fillStyle(0x2a1a3e, 0.8);
        this.sequenceBg.lineStyle(2, 0x9a4aff);
        this.sequenceBg.fillRoundedRect(-60, -25, 120, 50, 10);
        this.sequenceBg.strokeRoundedRect(-60, -25, 120, 50, 10);
        this.sequenceContainer.add(this.sequenceBg);
        
        // Sequence text
        this.sequenceText = UITheme.createText(this.scene, 0, 0, '', 'bodyMedium');
        this.sequenceText.setOrigin(0.5);
        this.sequenceText.setColor('#9a4aff');
        this.sequenceText.setFontStyle('bold');
        this.sequenceContainer.add(this.sequenceText);
        
        // Sequence progress
        this.sequenceProgressText = UITheme.createText(this.scene, 0, 35, '', 'bodySmall');
        this.sequenceProgressText.setOrigin(0.5);
        this.sequenceProgressText.setColor('#CCCCCC');
        this.sequenceContainer.add(this.sequenceProgressText);
        
        // Initially hide all indicators
        this.hideAllInputIndicators();
    }
    
    hideAllInputIndicators() {
        if (this.keyDisplayBg) {
            this.keyDisplayBg.setVisible(false);
            this.keyDisplayBg.setAlpha(1); // Reset alpha
        }
        if (this.keyDisplayText) {
            this.keyDisplayText.setVisible(false);
            this.keyDisplayText.setFontSize('32px'); // Reset to default size
            this.keyDisplayText.setScale(1); // Reset scale
        }
        if (this.actionDescriptionText) {
            this.actionDescriptionText.setVisible(false);
            this.actionDescriptionText.setFontSize('16px'); // Reset to default size
        }
        if (this.holdDurationContainer) this.holdDurationContainer.setVisible(false);
        if (this.sequenceContainer) this.sequenceContainer.setVisible(false);
    }
    
    showKeyIndicator(key, action, color = '#FFFFFF') {
        this.hideAllInputIndicators();
        
        if (this.keyDisplayBg) this.keyDisplayBg.setVisible(true);
        if (this.keyDisplayText) {
            this.keyDisplayText.setVisible(true);
            this.keyDisplayText.setText(key);
            this.keyDisplayText.setColor(color);
        }
        if (this.actionDescriptionText) {
            this.actionDescriptionText.setVisible(true);
            this.actionDescriptionText.setText(action);
        }
        
        // Add pulsing animation to key display
        if (this.keyDisplayText) {
            this.scene.tweens.add({
                targets: this.keyDisplayText,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Power2.easeInOut'
            });
        }
    }
    
    showSingleKeyIndicator(key, action, color = '#FFFFFF') {
        this.hideAllInputIndicators();
        
        if (this.keyDisplayBg) {
            this.keyDisplayBg.setVisible(true);
            // Make the background more prominent for single keys
            this.keyDisplayBg.clear();
            this.keyDisplayBg.fillStyle(0x1a1a2e, 0.95);
            this.keyDisplayBg.lineStyle(4, parseInt(color.replace('#', '0x')), 0.9);
            this.keyDisplayBg.fillRoundedRect(-80, -35, 160, 70, 15);
            this.keyDisplayBg.strokeRoundedRect(-80, -35, 160, 70, 15);
        }
        
        if (this.keyDisplayText) {
            this.keyDisplayText.setVisible(true);
            this.keyDisplayText.setText(key);
            this.keyDisplayText.setColor(color);
            this.keyDisplayText.setFontSize('48px'); // Larger font for single keys
        }
        
        if (this.actionDescriptionText) {
            this.actionDescriptionText.setVisible(true);
            this.actionDescriptionText.setText(action);
            this.actionDescriptionText.setFontSize('20px'); // Larger action text
        }
        
        // Add more prominent pulsing animation
        if (this.keyDisplayText) {
            this.scene.tweens.add({
                targets: this.keyDisplayText,
                scaleX: 1.4,
                scaleY: 1.4,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Power2.easeInOut'
            });
        }
        
        // Add glow effect to background
        if (this.keyDisplayBg) {
            this.scene.tweens.add({
                targets: this.keyDisplayBg,
                alpha: 0.7,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Power2.easeInOut'
            });
        }
    }
    
    showHoldIndicator(key, action, duration = 2000) {
        this.showKeyIndicator(key, action, '#FFAA00');
        
        if (this.holdDurationContainer) {
            this.holdDurationContainer.setVisible(true);
        }
        
        // Start hold duration animation
        this.holdProgress = 0;
        this.holdMaxDuration = duration;
        this.updateHoldDuration();
        
        // Create hold timer
        if (this.holdTimer) this.holdTimer.destroy();
        this.holdTimer = this.scene.time.addEvent({
            delay: 50,
            callback: () => {
                this.holdProgress += 50;
                this.updateHoldDuration();
                
                if (this.holdProgress >= this.holdMaxDuration) {
                    this.holdTimer.destroy();
                    this.holdTimer = null;
                }
            },
            loop: true
        });
    }
    
    updateHoldDuration() {
        if (!this.holdDurationFill) return;
        
        this.holdDurationFill.clear();
        
        const progress = Math.min(1, this.holdProgress / this.holdMaxDuration);
        const fillWidth = 96 * progress; // 96 = 100 - 4 (padding)
        
        let fillColor = 0xFF0000; // Red for start
        if (progress > 0.8) {
            fillColor = 0x00FF00; // Green when almost complete
        } else if (progress > 0.5) {
            fillColor = 0xFFFF00; // Yellow for middle
        }
        
        this.holdDurationFill.fillStyle(fillColor, 0.8);
        this.holdDurationFill.fillRoundedRect(-48, -8, fillWidth, 16, 8);
    }
    
    showSequenceIndicator(sequence, currentStep = 0) {
        this.hideAllInputIndicators();
        
        if (this.sequenceContainer) {
            this.sequenceContainer.setVisible(true);
        }
        
        if (this.sequenceText) {
            this.sequenceText.setVisible(true);
            
            // Highlight current step in sequence
            let displayText = '';
            sequence.forEach((key, index) => {
                if (index === currentStep) {
                    displayText += `[${key.toUpperCase()}]`;
                } else if (index < currentStep) {
                    displayText += `✓`;
                } else {
                    displayText += key.toUpperCase();
                }
                if (index < sequence.length - 1) displayText += ' → ';
            });
            
            this.sequenceText.setText(displayText);
        }
        
        if (this.sequenceProgressText) {
            this.sequenceProgressText.setVisible(true);
            this.sequenceProgressText.setText(`Step ${currentStep + 1}/${sequence.length}`);
        }
    }
    
    stopAllIndicatorAnimations() {
        // Stop all tweens on indicator elements
        if (this.keyDisplayText) {
            this.scene.tweens.killTweensOf(this.keyDisplayText);
            this.keyDisplayText.setScale(1);
        }
        
        if (this.keyDisplayBg) {
            this.scene.tweens.killTweensOf(this.keyDisplayBg);
            this.keyDisplayBg.setAlpha(1);
        }
        
        // Stop arrow animations
        if (this.arrowLeftTween) {
            this.arrowLeftTween.stop();
            if (this.arrowLeft) this.scene.tweens.killTweensOf(this.arrowLeft);
        }
        
        if (this.arrowRightTween) {
            this.arrowRightTween.stop();
            if (this.arrowRight) this.scene.tweens.killTweensOf(this.arrowRight);
        }
        
        if (this.holdTimer) {
            this.holdTimer.destroy();
            this.holdTimer = null;
        }
    }
    
    createInterestMeter() {
        // Interest meter container
        this.interestMeterContainer = this.scene.add.container(50, -200);
        this.interestMeterContainer.setDepth(1006);
        
        // Interest meter background
        const meterBg = this.scene.add.graphics();
        meterBg.fillStyle(0x333333, 0.8);
        meterBg.lineStyle(2, 0x666666);
        meterBg.fillRoundedRect(-15, -100, 30, 200, 15);
        meterBg.strokeRoundedRect(-15, -100, 30, 200, 15);
        this.interestMeterContainer.add(meterBg);
        
        // Interest meter fill
        this.interestMeterFill = this.scene.add.graphics();
        this.interestMeterContainer.add(this.interestMeterFill);
        
        // Interest meter label
        const interestLabel = UITheme.createText(this.scene, 0, -120, 'FISH INTEREST', 'bodySmall');
        interestLabel.setOrigin(0.5);
        interestLabel.setColor('#FFFFFF');
        this.interestMeterContainer.add(interestLabel);
        
        // Interest percentage text
        this.interestPercentText = UITheme.createText(this.scene, 0, 120, '50%', 'bodyMedium');
        this.interestPercentText.setOrigin(0.5);
        this.interestPercentText.setColor('#FFD700');
        this.interestMeterContainer.add(this.interestPercentText);
        
        // Add to scene
        this.scene.add.existing(this.interestMeterContainer);
    }
    
    updateInterestMeter() {
        if (!this.interestMeterFill || !this.interestPercentText) return;
        
        this.interestMeterFill.clear();
        
        const fillHeight = (this.shadowInterest / 100) * 196; // 196 = 200 - 4 (padding)
        let fillColor = 0xFF0000; // Red for low interest
        
        if (this.shadowInterest > 70) {
            fillColor = 0x00FF00; // Green for high interest
        } else if (this.shadowInterest > 40) {
            fillColor = 0xFFFF00; // Yellow for medium interest
        }
        
        this.interestMeterFill.fillStyle(fillColor, 0.8);
        this.interestMeterFill.fillRoundedRect(-13, 98 - fillHeight, 26, fillHeight, 13);
        
        this.interestPercentText.setText(`${Math.round(this.shadowInterest)}%`);
        this.interestPercentText.setColor(fillColor === 0x00FF00 ? '#00FF00' : fillColor === 0xFFFF00 ? '#FFFF00' : '#FF6666');
    }

    startFishMovement(fish, uiWidth) {
        // Stop existing timers
        if (fish.moveTimer) fish.moveTimer.destroy();
        if (fish.directionTimer) fish.directionTimer.destroy();
        
        // Set new target position
        fish.targetX = Phaser.Math.Between(20, uiWidth - 20);
        fish.direction = fish.targetX > fish.x ? -1 : 1; // Face direction of movement
        
        // Move towards target
        fish.moveTimer = this.scene.time.addEvent({
            delay: 50,
            callback: () => {
                if (!fish.interested && !fish.observing) {
                    const distance = fish.targetX - fish.x;
                    if (Math.abs(distance) > 2) {
                        fish.x += Math.sign(distance) * fish.speed * 0.05;
                        this.updateFishVisual(fish);
                    } else {
                        // Reached target, set new target
                        fish.targetX = Phaser.Math.Between(20, uiWidth - 20);
                        fish.direction = fish.targetX > fish.x ? -1 : 1;
                    }
                }
            },
            loop: true
        });
        
        // Change direction randomly
        fish.directionTimer = this.scene.time.addEvent({
            delay: Phaser.Math.Between(2000, 5000),
            callback: () => {
                if (!fish.interested && !fish.observing) {
                    fish.targetX = Phaser.Math.Between(20, uiWidth - 20);
                    fish.direction = fish.targetX > fish.x ? -1 : 1;
                }
            },
            loop: true
        });
    }

    createControlInstructions(uiWidth, uiHeight) {
        const instructionY = uiHeight - 15;
        
        // Control instructions text using UITheme
        const instructions = UITheme.createText(
            this.scene, 
            uiWidth / 2, 
            instructionY, 
            'Use WASD or SPACEBAR to control lure', 
            'tiny' // Using 'tiny' or 'caption' style
        );
        instructions.setOrigin(0.5);
        // instructions.setColor(UITheme.colors.textSecondary); // If tiny style doesn't set a muted color
        
        if (this.simulationContainer) {
        this.simulationContainer.add(instructions);
        } else {
            this.scene.add.existing(instructions); // Fallback if no simulationContainer
        }
    }

    updatePhaseDisplay() {
        // Update the phase display in the UI
        if (this.phaseInstructionText) {
            this.updatePhaseInstructions();
        }
        
            }

    startObservation() {
                // Find a fish to make interested
        const availableFish = this.simulationFish.find(fish => !fish.interested && !fish.observing);
        if (availableFish) {
            this.makeFishInterested(availableFish);
        } else {
            // If no fish available, proceed to next phase
            this.scene.time.delayedCall(2000, () => {
                this.handlePhaseSuccess();
            });
        }
    }

    getCurrentLureInfo() {
        // Map current lure pattern to display information
        const lureInfoMap = {
            'Spinner': {
                name: 'Spinner',
                control: 'Pulse Tap',
                description: 'Press SPACEBAR for quick pulses',
                instructions: 'TAP SPACEBAR when fish approaches!',
                color: 0xFFD700,
                icon: '🎣'
            },
            'Soft Plastic': {
                name: 'Soft Plastic',
                control: 'Drag and Pause',
                description: 'Press S to drag down, then pause',
                instructions: 'DRAG DOWN (S) then PAUSE!',
                color: 0x8B4513,
                icon: '🪱'
            },
            'Fly': {
                name: 'Fly',
                control: 'Swipe Flick Combo',
                description: 'Use WASD for quick flick movements',
                instructions: 'FLICK with WASD directions!',
                color: 0xFF6B6B,
                icon: '🦋'
            },
            'Popper': {
                name: 'Popper',
                control: 'Tap and Hold Burst',
                description: 'SPACEBAR for surface bursts',
                instructions: 'TAP and HOLD SPACEBAR for bursts!',
                color: 0x00FF00,
                icon: '💥'
            },
            'Spoon': {
                name: 'Spoon',
                control: 'Circular Trace',
                description: 'Use WASD in circular motions',
                instructions: 'TRACE CIRCLES with WASD!',
                color: 0xC0C0C0,
                icon: '🥄'
            }
        };
        
        // Get current lure info or fallback to Spinner
        const currentLureInfo = lureInfoMap[this.lurePattern.name] || lureInfoMap['Spinner'];
        
                return currentLureInfo;
    }
} 