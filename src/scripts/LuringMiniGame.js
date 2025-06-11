import Phaser from 'phaser';
import { gameDataLoader } from './DataLoader.js';
import UITheme from '../ui/UITheme.js';

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
        
        console.log('LuringMiniGame: Initialized');
    }

    start(options = {}) {
        if (this.isActive) {
            console.warn('LuringMiniGame: Start called while already active. Ignoring.');
            return;
        }

        console.log('LuringMiniGame: Starting luring phase with options:', options);
        
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
        
        // Get selected fish from options
        this.selectedFish = options.selectedFish || null;
        this.fishId = options.fishId || null;
        
        // If we have a selected fish from database, use its properties
        if (this.selectedFish) {
            console.log('LuringMiniGame: Using selected fish:', this.selectedFish.name);
            
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
        console.log('LuringMiniGame: Showing tutorial panel in bottom right corner');
        
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
        
        console.log('LuringMiniGame: Tutorial panel created in bottom right corner');
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
            console.log('LuringMiniGame: Tutorial input handling setup (ESC to dismiss)');
        } else {
            console.warn('LuringMiniGame: Could not setup tutorial input - keyboard not available');
        }
    }

    hideTutorialPanel() {
        if (!this.tutorialActive) return;
        
        console.log('LuringMiniGame: Hiding tutorial panel');
        
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
        console.log('LuringMiniGame: Starting actual luring minigame');
        
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
            console.log('LuringMiniGame: Input handling setup');
        } else {
            console.warn('LuringMiniGame: No keyboard input available');
        }
    }

    handleLureInput(event) {
        if (!this.isActive) return;
        
        const key = event.key.toLowerCase();
        console.log('LuringMiniGame: Input received:', key);
        
        // Handle different input types based on key
        let inputType = 'unknown';
        let inputData = {};
        
        switch (key) {
            case ' ': // Spacebar
                inputType = 'tap';
                break;
            case 'w':
                inputType = 'flick';
                inputData = { direction: 'up', speed: 120 };
                break;
            case 'a':
                inputType = 'flick';
                inputData = { direction: 'left', speed: 120 };
                break;
            case 's':
                inputType = 'drag';
                inputData = { direction: 'down', speed: 120 };
                break;
            case 'd':
                inputType = 'flick';
                inputData = { direction: 'right', speed: 120 };
                break;
        }
        
        if (inputType !== 'unknown') {
            this.handleInput(inputType, inputData);
        }
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
        
        console.log('LuringMiniGame: Equipment effects applied:', this.equipmentEffects);
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
        
        console.log('LuringMiniGame: Lure Simulation UI created');
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
        console.log(`LuringMiniGame: Starting fish approach phase ${this.currentPhase + 1}/${this.totalPhases}`);
        
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
        
        console.log('LuringMiniGame: Fish is now observing the lure');
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
            
            console.log('LuringMiniGame: Fish lost interest and swam away');
        }
    }

    handleFishBite(fish) {
        console.log('LuringMiniGame: Fish bit the lure!');
        
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
        
        console.log(`LuringMiniGame: Setup ${this.lurePattern.name} lure with ${this.maxPhases} phases`);
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
        
        console.log('LuringMiniGame: Fish shadow created with size:', shadowSize);
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
        
        console.log(`LuringMiniGame: Phase ${this.currentPhase + 1}/${this.maxPhases} - Input: ${requiredInput}, Difficulty: ${difficulty.toFixed(1)}`);
        
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
        
        // Set phase timeout with difficulty scaling
        const timeLimit = Math.max(2000, 4000 - (difficulty * 500)); // 2-4 seconds based on difficulty
        this.phaseTimeout = this.scene.time.delayedCall(timeLimit, () => {
            this.phaseTimeout = null;
            console.log(`LuringMiniGame: Phase ${this.currentPhase + 1} timed out`);
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

        const requiredInput = this.requiredInputs[this.currentPhase];
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
        console.log(`LuringMiniGame: Validating ${inputType} against ${requiredInput}`);
        
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
                // Fly: Quick WASD directional inputs
                return inputType === 'flick' && inputData?.speed >= 100;
                
            case 'swipe':
                // Fly: Longer WASD movements
                return inputType === 'swipe' && inputData?.distance >= 30;
                
            case 'combo':
                // Fly: Combination of flick movements
                return inputType === 'combo' || (inputType === 'flick' && inputData?.sequence);
                
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
                // Spoon: Circular WASD movements
                return inputType === 'trace' && inputData?.pattern === 'circular';
                
            case 'circle':
                // Spoon: Complete circular motion
                return inputType === 'circle' && inputData?.completeness >= 0.7;
                
            default:
                // Fallback to basic validation
                console.log(`LuringMiniGame: Using fallback validation for ${requiredInput}`);
                return inputType === requiredInput || inputType === 'tap'; // Accept tap as fallback
        }
    }

    handlePhaseSuccess() {
        // Clear timeout
        if (this.phaseTimeout) {
            this.phaseTimeout.destroy();
            this.phaseTimeout = null;
        }

        // Play phase success audio
        this.audioManager?.playSFX('lure_success');

        // Increase shadow interest
        this.shadowInterest = Math.min(100, this.shadowInterest + 20);
        
        // Apply lure success bonus (with null checking)
        const lureBonus = this.lureStats?.lureSuccess || 0;
        this.shadowInterest += lureBonus;
        
        console.log(`LuringMiniGame: Phase ${this.currentPhase + 1} success! Interest: ${this.shadowInterest}`);
        
        // Move to next phase
        this.currentPhase++;
        
        // Emit success event
        this.scene.events.emit('fishing:lurePhaseSuccess', {
            phase: this.currentPhase,
            shadowInterest: this.shadowInterest
        });
        
        // Start next phase after brief delay
        this.scene.time.delayedCall(500, () => {
            this.startPhase();
        });
    }

    handlePhaseFailure() {
        // Clear timeout
        if (this.phaseTimeout) {
            this.phaseTimeout.destroy();
            this.phaseTimeout = null;
        }

        // Decrease shadow interest
        this.shadowInterest = Math.max(0, this.shadowInterest - 30);
        
        console.log(`LuringMiniGame: Phase ${this.currentPhase + 1} failed! Interest: ${this.shadowInterest}`);
        
        // Check if fish loses interest completely
        if (this.shadowInterest <= 0) {
            this.complete(false, null);
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
            this.scene.time.delayedCall(1000, () => {
                this.startPhase();
            });
        } else {
            this.attemptHook();
        }
    }

    attemptHook() {
        // Prevent duplicate hook attempts
        if (this.isCompleted) {
            console.log('LuringMiniGame: Already completed, ignoring hook attempt');
            return;
        }
        
        // Final hooking attempt based on accumulated interest
        const hookChance = this.shadowInterest / 100;
        const biteRateBonus = (this.lureStats?.biteRate || 0) / 100;
        const finalChance = Math.min(0.95, hookChance + biteRateBonus);
        
        const success = Math.random() < finalChance;
        
        console.log(`LuringMiniGame: Hook attempt - Chance: ${(finalChance * 100).toFixed(1)}%, Success: ${success}`);
        
        if (success) {
            this.complete(true, this.selectedFish);
        } else {
            this.complete(false, null);
        }
    }

    complete(success, fishHooked) {
        // Prevent multiple completions
        if (this.isCompleted) {
            console.log('LuringMiniGame: Already completed, ignoring duplicate completion call');
            return;
        }
        
        this.isCompleted = true;
        this.isActive = false;
        
        console.log('LuringMiniGame: Complete called with:', { success, fishHooked });
        
        // IMMEDIATELY clean up input handling to prevent interference with next phase
        this.scene.input.keyboard.off('keydown', this.handleLureInput, this);
        
        // Clean up timers
        if (this.phaseTimeout) {
            this.phaseTimeout.destroy();
        }
        
        if (this.fishObservationTimer) {
            this.fishObservationTimer.destroy();
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
        
        console.log('LuringMiniGame: Emitting lureComplete event with validated data:', {
            success,
            fishHooked: validatedFishHooked,
            finalInterest: this.shadowInterest
        });

        // Emit completion event
        this.scene.events.emit('fishing:lureComplete', {
            success: success,
            fishHooked: validatedFishHooked,
            finalInterest: this.shadowInterest
        });
    }

    destroy() {
        console.log('LuringMiniGame: Starting destroy process');
        
        this.isActive = false;
        this.tutorialActive = false;
        
        // Clean up tutorial panel first
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
        
        // Clean up game timers
        if (this.phaseTimeout && !this.phaseTimeout.hasDispatched) {
            try {
                this.phaseTimeout.destroy();
            } catch (error) {
                console.warn('LuringMiniGame: Error destroying phase timeout:', error);
            }
            this.phaseTimeout = null;
        }
        
        if (this.fishObservationTimer && !this.fishObservationTimer.hasDispatched) {
            try {
                this.fishObservationTimer.destroy();
            } catch (error) {
                console.warn('LuringMiniGame: Error destroying fish observation timer:', error);
            }
            this.fishObservationTimer = null;
        }
        
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
                } catch (error) {
                    console.warn(`LuringMiniGame: Error destroying fish ${index} timers:`, error);
                }
            });
        }
        
        // Clean up UI
        if (this.simulationContainer && this.simulationContainer.active) {
            try {
                this.simulationContainer.destroy();
            } catch (error) {
                console.warn('LuringMiniGame: Error destroying simulation container:', error);
            }
            this.simulationContainer = null;
        }
        
        console.log('LuringMiniGame: Destroy process completed');
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
        
        let instruction = 'Get ready...';
        
        if (currentPhase < this.maxPhases) {
            switch (requiredInput) {
                case 'pulse':
                    instruction = '⚡ TAP SPACEBAR quickly!';
                    break;
                case 'drag':
                    instruction = '⬇️ PRESS S to drag down!';
                    break;
                case 'pause':
                    instruction = '⏸️ WAIT... don\'t press anything!';
                    break;
                case 'flick':
                    instruction = '💨 QUICK WASD movements!';
                    break;
                case 'swipe':
                    instruction = '↗️ SWIPE with WASD!';
                    break;
                case 'combo':
                    instruction = '🔥 COMBO! Multiple quick inputs!';
                    break;
                case 'tap':
                    instruction = '👆 TAP SPACEBAR!';
                    break;
                case 'hold':
                    instruction = '⏳ HOLD SPACEBAR down!';
                    break;
                case 'burst':
                    instruction = '💥 RELEASE for burst!';
                    break;
                case 'trace':
                    instruction = '🔄 TRACE with WASD!';
                    break;
                case 'circle':
                    instruction = '⭕ COMPLETE the circle!';
                    break;
                default:
                    instruction = `Phase ${currentPhase + 1}: ${requiredInput}`;
            }
        } else {
            instruction = '🎣 Ready to hook!';
        }
        
        this.phaseInstructionText.setText(instruction);
        
        // Use UITheme colors
        if (currentPhase === 0) {
            this.phaseInstructionText.setColor(UITheme.colors.success); // Green for first phase
        } else if (currentPhase === this.maxPhases - 1) {
            this.phaseInstructionText.setColor(UITheme.colors.warning); // Orange for final phase
        } else {
            this.phaseInstructionText.setColor(UITheme.colors.info);    // Yellow/Info for middle phases
        }
    }

    completePhase(success) {
        console.log(`LuringMiniGame: Phase ${this.currentPhase + 1} complete. Success:`, success);
        
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
        console.log('LuringMiniGame: Fish swims away due to failed phase');
        
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
            console.log('LuringMiniGame: Already completed, ignoring hook fish call');
            return;
        }
        
        console.log('LuringMiniGame: Fish hooked successfully!');
        
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
                console.log('LuringMiniGame: Completion prevented during delayed call');
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
        console.log('LuringMiniGame: Skipping background creation to keep scene visible');
    }

    createLureSimulation() {
        // Create the lure simulation UI
        this.createLureSimulationUI();
        
        // Set up lure pattern and equipment effects
        this.setupLurePattern();
        this.applyEquipmentEffects();
        
        console.log('LuringMiniGame: Lure simulation created');
    }

    createUI() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Instructions text using UITheme
        // Assuming a style like 'overlayNotification' or a new 'lureInstruction' style from UITheme
        this.phaseInstructionText = UITheme.createText(
            this.scene, 
            width / 2, 
            height - 100, 
            'Get ready to lure the fish...', 
            'overlayNotification' // This style should handle background, padding, alignment
        );
        this.phaseInstructionText.setOrigin(0.5).setDepth(1005);
        // Color will be set dynamically by updatePhaseInstructions
        
        console.log('LuringMiniGame: UI created');
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
        
        console.log(`LuringMiniGame: Phase display updated - ${this.currentPhase + 1}/${this.totalPhases}`);
    }

    startObservation() {
        console.log('LuringMiniGame: Fish is observing the lure');
        
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
        
        console.log('LuringMiniGame: Current lure info:', currentLureInfo);
        return currentLureInfo;
    }
} 