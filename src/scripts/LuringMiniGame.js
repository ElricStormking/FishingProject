import Phaser from 'phaser';
import { gameDataLoader } from './DataLoader.js';

// Lure Minigame - Enhanced rhythm-based fish attraction
export class LuringMiniGame {
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;
        this.isActive = false;
        this.currentPhase = 0;
        this.maxPhases = 4;
        this.fishShadow = null;
        this.shadowInterest = 50;
        this.lureType = null;
        this.inputSequence = [];
        this.requiredInputs = [];
        
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

    start(castAccuracy, availableFish, lureStats) {
        this.isActive = true;
        this.castAccuracy = castAccuracy;
        this.availableFish = availableFish;
        this.lureStats = lureStats;
        this.currentPhase = 0;
        this.shadowInterest = 50;
        
        // Apply equipment effects to luring
        this.applyEquipmentEffects();
        
        // Select fish based on cast accuracy and available fish
        this.selectTargetFish();
        
        // Determine lure type and input pattern
        this.setupLurePattern();
        
        // Create Lure Simulation UI
        this.createLureSimulationUI();
        
        // Create fish shadow
        this.createFishShadow();
        
        // Start first phase
        this.startPhase();
        
        // Set up input handling for lure controls
        this.setupLureControls();
        
        console.log(`LuringMiniGame: Started with ${this.targetFish.name}, lure type: ${this.lureType}`);
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
        
        // UI dimensions and position (upper right corner)
        const uiWidth = 300;
        const uiHeight = 200;
        const uiX = width - uiWidth - 20;
        const uiY = 20;
        
        // Create main container
        this.simulationContainer = this.scene.add.container(uiX, uiY);
        this.simulationContainer.setDepth(1000);
        
        // Background panel
        const background = this.scene.add.graphics();
        background.fillStyle(0x001122, 0.9);
        background.lineStyle(3, 0x00aaff, 1);
        background.fillRoundedRect(0, 0, uiWidth, uiHeight, 10);
        background.strokeRoundedRect(0, 0, uiWidth, uiHeight, 10);
        this.simulationContainer.add(background);
        
        // Title
        const title = this.scene.add.text(uiWidth / 2, 15, 'LURE SIMULATION', {
            fontSize: '16px',
            fill: '#00aaff',
            fontWeight: 'bold'
        }).setOrigin(0.5, 0);
        this.simulationContainer.add(title);
        
        // Water area within the UI
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
        
        // Fish body
        fish.graphic.fillStyle(fish.color);
        fish.graphic.fillEllipse(0, 0, fish.size * 2, fish.size);
        
        // Fish tail
        fish.graphic.fillTriangle(-fish.size, 0, -fish.size * 1.5, -fish.size * 0.5, -fish.size * 1.5, fish.size * 0.5);
        
        // Eye
        fish.graphic.fillStyle(0xFFFFFF);
        fish.graphic.fillCircle(fish.size * 0.3, -fish.size * 0.2, fish.size * 0.3);
        fish.graphic.fillStyle(0x000000);
        fish.graphic.fillCircle(fish.size * 0.3, -fish.size * 0.2, fish.size * 0.15);
        
        // Interest indicator (if interested)
        if (fish.interested) {
            fish.graphic.lineStyle(2, 0x00FF00, 0.8);
            fish.graphic.strokeCircle(0, 0, fish.size * 3);
        }
        
        // Bubbles (if observing)
        if (fish.bubbling) {
            for (let i = 0; i < 3; i++) {
                fish.graphic.fillStyle(0x87CEEB, 0.6);
                fish.graphic.fillCircle(
                    Phaser.Math.Between(-fish.size, fish.size),
                    -fish.size * 2 - i * 5,
                    1 + i * 0.5
                );
            }
        }
    }

    startFishMovement(fish, uiWidth) {
        // Fish swimming behavior
        const moveToTarget = () => {
            if (!this.isActive) return;
            
            // Move towards target
            const dx = fish.targetX - fish.x;
            const distance = Math.abs(dx);
            
            if (distance > 5) {
                fish.x += Math.sign(dx) * Math.min(fish.speed * 0.016, distance);
            } else {
                // Reached target, set new target
                fish.targetX = Phaser.Math.Between(20, uiWidth - 20);
            }
            
            this.updateFishVisual(fish);
        };
        
        // Update fish position every frame
        fish.moveTimer = this.scene.time.addEvent({
            delay: 16, // ~60 FPS
            callback: moveToTarget,
            loop: true
        });
        
        // Randomly change direction
        fish.directionTimer = this.scene.time.addEvent({
            delay: Phaser.Math.Between(2000, 5000),
            callback: () => {
                if (this.isActive) {
                    fish.targetX = Phaser.Math.Between(20, uiWidth - 20);
                }
            },
            loop: true
        });
    }

    createControlInstructions(uiWidth, uiHeight) {
        // Control scheme instructions based on lure type
        const controlTexts = {
            spinner: 'Pulse Tap: Tap repeatedly',
            soft_plastic: 'Drag & Pause: Hold then release',
            fly: 'Swipe Flick: Quick directional swipes',
            popper: 'Tap & Hold Burst: Tap then hold',
            spoon: 'Circular Trace: Move in circles'
        };
        
        const instructionText = this.scene.add.text(
            uiWidth / 2, uiHeight - 15,
            controlTexts[this.lureType] || 'Use WASD to control lure',
            {
                fontSize: '12px',
                fill: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5, 0);
        
        this.simulationContainer.add(instructionText);
    }

    setupLureControls() {
        // Set up WASD controls for lure movement
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.wasd = this.scene.input.keyboard.addKeys('W,S,A,D');
        
        // Handle input based on lure type with high priority
        // Use prependOnceListener to ensure this handler runs before others
        this.scene.input.keyboard.on('keydown', this.handleLureInput, this);
        
        console.log('LuringMiniGame: Lure controls set up with spacebar override');
    }

    handleLureInput(event) {
        if (!this.isActive || this.inputCooldown) return;
        
        const key = event.key.toLowerCase();
        const code = event.code;
        let inputHandled = false;
        
        // Prevent event propagation for spacebar to stop it from triggering casting
        // Check both event.key (' ') and event.code ('Space')
        if (key === ' ' || code === 'Space') {
            event.preventDefault();
            event.stopPropagation();
            console.log('LuringMiniGame: Prevented spacebar event propagation');
        }
        
        // Regular lure control as specified in GDD
        if (key === 'w') {
            // Lure swims up quickly
            this.moveLureUp();
            inputHandled = true;
        } else if (key === 'a' || key === 'd') {
            // Lure swims upper right towards boat (right side)
            this.moveLureTowardsBoat();
            inputHandled = true;
        }
        
        // Lure-specific controls
        switch (this.lureType) {
            case 'spinner':
                if (key === ' ' || code === 'Space') { // Spacebar for pulse tap
                    this.handleSpinnerPulse();
                    inputHandled = true;
                    console.log('LuringMiniGame: Spinner pulse tap executed');
                }
                break;
                
            case 'soft_plastic':
                if (key === 's') { // S for drag down
                    this.handleSoftPlasticDrag();
                    inputHandled = true;
                }
                break;
                
            case 'fly':
                if (['w', 'a', 's', 'd'].includes(key)) {
                    this.handleFlySwipe(key);
                    inputHandled = true;
                }
                break;
                
            case 'popper':
                if (key === ' ' || code === 'Space') { // Spacebar for tap and hold
                    this.handlePopperBurst();
                    inputHandled = true;
                    console.log('LuringMiniGame: Popper burst executed');
                }
                break;
                
            case 'spoon':
                if (['w', 'a', 's', 'd'].includes(key)) {
                    this.handleSpoonTrace(key);
                    inputHandled = true;
                }
                break;
        }
        
        // If spacebar was used for lure control, mark it as handled to prevent casting
        if ((key === ' ' || code === 'Space') && (this.lureType === 'spinner' || this.lureType === 'popper')) {
            inputHandled = true;
            console.log('LuringMiniGame: Spacebar consumed for lure control, preventing casting');
        }
        
        if (inputHandled) {
            this.startInputCooldown();
            this.checkFishInterest();
        }
    }

    moveLureUp() {
        // Move lure up quickly
        this.lurePosition.y = Math.max(45, this.lurePosition.y - 20);
        this.updateLureVisual();
        this.updateFishingLineVisual(300);
        
        // Add upward motion effect
        this.scene.tweens.add({
            targets: this.simulationLure,
            y: this.lurePosition.y - 5,
            duration: 200,
            yoyo: true,
            ease: 'Power2.easeOut'
        });
    }

    moveLureTowardsBoat() {
        // Move lure upper right towards boat (right side of screen)
        this.lurePosition.x = Math.min(280, this.lurePosition.x + 15);
        this.lurePosition.y = Math.max(45, this.lurePosition.y - 10);
        this.updateLureVisual();
        this.updateFishingLineVisual(300);
        
        // Add diagonal motion effect
        this.scene.tweens.add({
            targets: this.simulationLure,
            x: this.lurePosition.x + 3,
            y: this.lurePosition.y - 3,
            duration: 300,
            yoyo: true,
            ease: 'Power2.easeOut'
        });
    }

    handleSpinnerPulse() {
        // Spinner: Quick pulsing motion
        this.scene.tweens.add({
            targets: this.simulationLure,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 150,
            yoyo: true,
            ease: 'Power2.easeOut'
        });
        
        // Add rotation effect
        this.scene.tweens.add({
            targets: this.simulationLure,
            rotation: this.simulationLure.rotation + Math.PI,
            duration: 300,
            ease: 'Power2.easeOut'
        });
    }

    handleSoftPlasticDrag() {
        // Soft Plastic: Drag down then pause
        const originalY = this.lurePosition.y;
        this.lurePosition.y = Math.min(180, this.lurePosition.y + 25);
        this.updateLureVisual();
        this.updateFishingLineVisual(300);
        
        // Pause effect
        this.scene.time.delayedCall(500, () => {
            if (this.isActive) {
                this.lurePosition.y = originalY;
                this.updateLureVisual();
                this.updateFishingLineVisual(300);
            }
        });
    }

    handleFlySwipe(direction) {
        // Fly: Quick flick movements
        let deltaX = 0, deltaY = 0;
        
        switch (direction) {
            case 'w': deltaY = -15; break;
            case 's': deltaY = 15; break;
            case 'a': deltaX = -15; break;
            case 'd': deltaX = 15; break;
        }
        
        // Quick flick motion
        this.scene.tweens.add({
            targets: this.simulationLure,
            x: this.lurePosition.x + deltaX,
            y: this.lurePosition.y + deltaY,
            duration: 100,
            yoyo: true,
            ease: 'Power3.easeOut'
        });
    }

    handlePopperBurst() {
        // Popper: Surface burst effect
        this.lurePosition.y = Math.max(45, this.lurePosition.y - 30);
        this.updateLureVisual();
        this.updateFishingLineVisual(300);
        
        // Create splash effect
        const splash = this.scene.add.graphics();
        splash.setDepth(1003);
        splash.fillStyle(0x87CEEB, 0.6);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            splash.fillCircle(
                this.lurePosition.x + Math.cos(angle) * 10,
                this.lurePosition.y + Math.sin(angle) * 10,
                2
            );
        }
        this.simulationContainer.add(splash);
        
        // Remove splash after animation
        this.scene.tweens.add({
            targets: splash,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 500,
            onComplete: () => splash.destroy()
        });
    }

    handleSpoonTrace(direction) {
        // Spoon: Circular tracing motion
        const radius = 15;
        const angle = this.simulationLure.rotation || 0;
        let newAngle = angle;
        
        switch (direction) {
            case 'w': newAngle += Math.PI / 4; break;
            case 's': newAngle -= Math.PI / 4; break;
            case 'a': newAngle += Math.PI / 2; break;
            case 'd': newAngle -= Math.PI / 2; break;
        }
        
        const centerX = 150;
        const centerY = 100;
        const newX = centerX + Math.cos(newAngle) * radius;
        const newY = centerY + Math.sin(newAngle) * radius;
        
        this.lurePosition.x = Math.max(20, Math.min(280, newX));
        this.lurePosition.y = Math.max(45, Math.min(180, newY));
        this.simulationLure.rotation = newAngle;
        
        this.updateLureVisual();
        this.updateFishingLineVisual(300);
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
            
            // Use equipment effects for attraction radius and interest chance
            const attractionRadius = this.equipmentEffects?.attractionRadius || 100;
            const baseInterestChance = 0.3;
            const equipmentBonus = (this.lureStats.biteRate || 5) * 0.05; // 5% per bite rate point
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
        
        // Define input patterns for each lure type
        const lurePatterns = {
            spinner: ['tap', 'tap', 'hold'],
            soft_plastic: ['drag', 'pause', 'drag'],
            fly: ['swipe', 'flick', 'swipe'],
            popper: ['tap', 'hold', 'burst'],
            spoon: ['circle', 'trace', 'circle']
        };
        
        this.requiredInputs = lurePatterns[this.lureType] || lurePatterns.spinner;
        this.maxPhases = this.requiredInputs.length;
    }

    createFishShadow() {
        const shadowSize = this.getShadowSize();
        
        this.fishShadow = {
            x: Phaser.Math.Between(100, this.scene.cameras.main.width - 100),
            y: Phaser.Math.Between(
                this.scene.cameras.main.height * 0.4,
                this.scene.cameras.main.height * 0.7
            ),
            size: shadowSize,
            speed: this.targetFish.speed || 3,
            aggressiveness: this.targetFish.aggressiveness || 5,
            elusiveness: this.targetFish.elusiveness || 5,
            approaching: false,
            distance: 200
        };
    }

    getShadowSize() {
        const fishSize = this.targetFish.size || 5;
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
        
        // Make fish shadow approach
        this.fishShadow.approaching = true;
        this.fishShadow.distance = 200 - (this.currentPhase * 40);
        
        console.log(`LuringMiniGame: Phase ${this.currentPhase + 1} - Input: ${requiredInput}`);
        
        // Emit phase start event
        this.scene.events.emit('fishing:lurePhase', {
            phase: this.currentPhase + 1,
            maxPhases: this.maxPhases,
            requiredInput: requiredInput,
            difficulty: difficulty,
            shadowInterest: this.shadowInterest,
            fishShadow: this.fishShadow
        });
        
        // Set phase timeout
        this.phaseTimeout = this.scene.time.delayedCall(3000 + difficulty * 1000, () => {
            this.phaseTimeout = null;
            this.handlePhaseFailure();
        });
    }

    calculatePhaseDifficulty() {
        // Later phases are harder, modified by fish elusiveness
        const baseDifficulty = this.currentPhase * 0.5;
        const fishDifficulty = (this.targetFish.elusiveness || 5) / 10;
        return Math.min(2, baseDifficulty + fishDifficulty);
    }

    handleInput(inputType, inputData) {
        if (!this.isActive || this.currentPhase >= this.maxPhases) return false;

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
        // Basic input validation - can be expanded for more complex patterns
        if (inputType === requiredInput) {
            // Additional validation based on input type
            switch (inputType) {
                case 'tap':
                    return true; // Simple tap always valid
                case 'hold':
                    return inputData.duration >= 500; // Must hold for 500ms
                case 'drag':
                    return inputData.distance >= 50; // Must drag at least 50 pixels
                case 'swipe':
                    return inputData.speed >= 100; // Must swipe fast enough
                case 'circle':
                    return inputData.completeness >= 0.8; // Must complete 80% of circle
                default:
                    return true;
            }
        }
        return false;
    }

    handlePhaseSuccess() {
        // Clear timeout
        if (this.phaseTimeout) {
            this.phaseTimeout.destroy();
            this.phaseTimeout = null;
        }

        // Increase shadow interest
        this.shadowInterest = Math.min(100, this.shadowInterest + 20);
        
        // Apply lure success bonus
        const lureBonus = this.lureStats.lureSuccess || 0;
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
        // Final hooking attempt based on accumulated interest
        const hookChance = this.shadowInterest / 100;
        const biteRateBonus = (this.lureStats.biteRate || 0) / 100;
        const finalChance = Math.min(0.95, hookChance + biteRateBonus);
        
        const success = Math.random() < finalChance;
        
        console.log(`LuringMiniGame: Hook attempt - Chance: ${(finalChance * 100).toFixed(1)}%, Success: ${success}`);
        
        if (success) {
            this.complete(true, this.targetFish);
        } else {
            this.complete(false, null);
        }
    }

    complete(success, fishHooked) {
        this.isActive = false;
        
        // IMMEDIATELY clean up input handling to prevent interference with next phase
        this.scene.input.keyboard.off('keydown', this.handleLureInput, this);
        
        // Clean up timers
        if (this.phaseTimeout) {
            this.phaseTimeout.destroy();
        }
        
        if (this.fishObservationTimer) {
            this.fishObservationTimer.destroy();
        }

        // Emit completion event
        this.scene.events.emit('fishing:lureComplete', {
            success: success,
            fishHooked: fishHooked,
            finalInterest: this.shadowInterest
        });
    }

    destroy() {
        this.isActive = false;
        
        // Clean up input handling
        this.scene.input.keyboard.off('keydown', this.handleLureInput, this);
        
        // Clean up timers
        if (this.phaseTimeout) {
            this.phaseTimeout.destroy();
        }
        
        if (this.fishObservationTimer) {
            this.fishObservationTimer.destroy();
        }
        
        // Clean up fish timers
        this.simulationFish.forEach(fish => {
            if (fish.moveTimer) fish.moveTimer.destroy();
            if (fish.directionTimer) fish.directionTimer.destroy();
        });
        
        // Clean up UI
        if (this.simulationContainer) {
            this.simulationContainer.destroy();
        }
    }
} 