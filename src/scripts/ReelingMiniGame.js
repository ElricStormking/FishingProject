import Phaser from 'phaser';
import { gameDataLoader } from './DataLoader.js';

// Reel Minigame - Tension management and QTE system
export class ReelingMiniGame {
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;
        this.isActive = false;
        this.fish = null;
        this.playerStats = null;
        this.rodStats = null;
        this.fishCaughtCalled = false; // Flag to prevent multiple fish caught calls
        
        // Initialize audio manager safely
        this.audioManager = scene.audioManager || null;
        if (!this.audioManager) {
            console.warn('ReelingMiniGame: No audio manager available from scene');
        }
        
        // Tension system
        this.tension = 50; // 0-100, safe zone 30-70
        this.tensionSafeZone = { min: 30, max: 70 };
        this.lineIntegrity = 100; // 0-100, breaks at 0
        this.reelProgress = 0; // 0-100, win at 100
        
        // Fish state
        this.fishStamina = 100;
        this.fishStruggling = false;
        this.struggleType = null;
        this.struggleTimer = null;
        
        // QTE system
        this.activeQTE = null;
        this.qteTimer = null;
        this.qteTypes = ['tap', 'hold', 'sequence', 'timing'];
        this.qteSuccess = 0;
        this.qteFails = 0;
        this.holdCompleted = false; // Track hold QTE completion
        
        // Visual elements
        this.fishGraphic = null;
        this.fishingLine = null;
        this.staminaBar = null;
        this.staminaBarBg = null;
        this.tensionMeter = null;
        this.tensionMeterBg = null;
        this.tensionIndicator = null;
        this.splashEffects = [];
        this.uiContainer = null;
        
        // QTE Visual elements
        this.qteContainer = null;
        this.qteBackground = null;
        this.qteInstructions = null;
        this.qteProgressBar = null;
        this.qteArrows = [];
        this.qteTapIndicator = null;
        this.qteTimingIndicator = null;
        this.qteTimingTarget = null;
        
        // Fish movement
        this.fishPosition = { x: 0, y: 0 };
        this.fishTargetPosition = { x: 0, y: 0 };
        this.fishMovementSpeed = 2;
        this.fishDirection = 1; // 1 for right, -1 for left
        
        console.log('ReelingMiniGame: Initialized');
    }

    start(options = {}) {
        this.isActive = true;
        this.startTime = this.scene.time.now;
        this.gameState = this.scene.gameState;
        this.fishCaughtCalled = false; // Reset the flag for new session
        this.isCompleted = false; // Add additional completion flag
        
        console.log('ReelingMiniGame: Starting with options:', options);
        
        // Get selected fish from luring result
        this.selectedFish = options.selectedFish || null;
        this.fishId = options.fishId || null;
        
        // Configure fish behavior based on database
        if (this.selectedFish && this.gameState.fishDatabase) {
            console.log('ReelingMiniGame: Using selected fish:', this.selectedFish.name);
            
            // Check if this is a boss fish
            this.isBoss = this.selectedFish.isBoss || false;
            
            // Get struggle style data
            const struggleStyle = this.gameState.fishDatabase.getStruggleStyle(this.selectedFish.struggleStyle);
            if (struggleStyle) {
                console.log('ReelingMiniGame: Using struggle style:', struggleStyle.name);
                this.struggleStyle = struggleStyle;
            }
            
            // Set fish properties
            this.fishProperties = {
                name: this.selectedFish.name,
                size: this.selectedFish.size,
                strength: this.selectedFish.strength,
                speed: this.selectedFish.speed,
                endurance: this.selectedFish.endurance,
                weight: this.gameState.fishDatabase.calculateFishWeight(this.selectedFish),
                aggressiveness: this.selectedFish.aggressiveness,
                isBoss: this.isBoss
            };
            
            // Calculate fish stamina - bosses have much higher stamina
            if (this.isBoss) {
                this.fishStamina = this.selectedFish.stamina || 300; // Boss stamina from data
                console.log(`ReelingMiniGame: BOSS FIGHT! ${this.selectedFish.name} with ${this.fishStamina} stamina`);
            } else {
                this.fishStamina = 50 + (this.selectedFish.endurance * 15); // 65-200 stamina for normal fish
            }
            this.maxFishStamina = this.fishStamina;
            
            // Calculate tension rates based on struggle style and fish strength
            this.baseTensionIncrease = (struggleStyle?.tensionIncrease || 15) * (1 + this.selectedFish.strength / 20);
            this.tensionDecreaseRate = 0.5 + (this.selectedFish.speed / 20); // Faster fish = harder to manage tension
            
        } else {
            // Fallback to default fish properties
            console.log('ReelingMiniGame: Using default fish properties');
            
            this.fishProperties = {
                name: 'Unknown Fish',
                size: 5,
                strength: 5,
                speed: 5,
                endurance: 5,
                weight: 2.5,
                aggressiveness: 5
            };
            
            this.fishStamina = 100;
            this.maxFishStamina = 100;
            this.baseTensionIncrease = 15;
            this.tensionDecreaseRate = 0.75;
            
            this.struggleStyle = {
                id: 'steady_pull',
                name: 'Steady Pull',
                qteType: 'hold_and_release',
                difficulty: 3,
                tensionIncrease: 10
            };
        }
        
        // Initialize game state
        this.tension = 50;
        this.maxTension = 100;
        this.reelSpeed = 1;
        this.lineIntegrity = 100;
        this.isReeling = false;
        this.fishStruggling = false;
        this.qteActive = false;
        this.qteCount = 0;
        
        // Boss fights have more QTEs and phases
        if (this.isBoss) {
            this.maxQTEs = 8 + Math.floor(this.fishProperties.aggressiveness / 2); // 8-13 QTEs for bosses
            this.bossPhase = 1;
            this.maxBossPhases = 4;
            this.bossSpecialAttackTimer = 0;
            this.bossSpecialAttackCooldown = 15000; // 15 seconds between special attacks
        } else {
            this.maxQTEs = 2 + Math.floor(this.fishProperties.aggressiveness / 4); // 2-4 QTEs for normal fish
        }
        
        // Apply equipment bonuses
        this.applyEquipmentBonuses();
        
        // Create UI elements
        this.createBackground();
        this.createFishingLine();
        this.createFish();
        this.createTensionMeter();
        this.createStaminaBar();
        this.createUI();
        
        // Set up controls
        this.setupInputHandling();
        
        // Start the reeling phase
        this.scene.time.delayedCall(500, () => {
            this.startReeling();
        });
    }

    applyEquipmentBonuses() {
        // Get equipped rod stats
        const equippedRod = this.gameState.getEquippedItem('rods');
        this.rodStats = equippedRod?.stats || {
            reelSpeed: 5,
            lineStrength: 5,
            tensionStability: 5
        };
        
        // Apply rod and equipment stats to reeling mechanics
        const reelSpeed = this.rodStats.reelSpeed || 5;
        const lineStrength = this.rodStats.lineStrength || 5;
        const tensionControl = this.rodStats.tensionStability || 5;
        
        // Calculate equipment effects
        this.equipmentEffects = {
            reelSpeedMultiplier: 1 + (reelSpeed * 0.1), // 10% faster reeling per point
            maxTension: 100,
            tensionRecovery: 1 + (tensionControl * 0.05), // 5% faster tension recovery per point
            staminaDrainRate: 1,
            qteTimeWindow: 2,
            lineBreakThreshold: 80 + (lineStrength * 2), // Higher line strength = more tension tolerance
            criticalChance: 0,
            experienceBonus: 0
        };
        
        console.log('ReelingMiniGame: Equipment effects applied:', this.equipmentEffects);
    }

    createBackground() {
        // Create water background
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        const waterBg = this.scene.add.graphics();
        waterBg.setDepth(10);
        waterBg.fillGradientStyle(0x001a33, 0x001a33, 0x004080, 0x004080);
        waterBg.fillRect(0, height * 0.3, width, height * 0.7);
        
        // Add wave effect
        for (let i = 0; i < 5; i++) {
            const wave = this.scene.add.graphics();
            wave.setDepth(11);
            wave.lineStyle(2, 0x0066cc, 0.3);
            wave.beginPath();
            wave.moveTo(0, height * 0.3 + i * 20);
            
            for (let x = 0; x < width; x += 20) {
                wave.lineTo(x, height * 0.3 + i * 20 + Math.sin(x * 0.05) * 5);
            }
            
            wave.strokePath();
        }
    }

    createFish() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Create UI container if not exists
        if (!this.uiContainer) {
            this.uiContainer = this.scene.add.container(0, 0);
            this.uiContainer.setDepth(1000);
        }
        
        // Initial fish position (center-left of water area)
        this.fishPosition.x = width * 0.3;
        this.fishPosition.y = height * 0.6;
        this.fishTargetPosition.x = this.fishPosition.x;
        this.fishTargetPosition.y = this.fishPosition.y;
        
        // Create struggling fish graphic
        this.fishGraphic = this.scene.add.graphics();
        this.fishGraphic.setDepth(200);
        this.drawFish();
        
        // Create fish name label
        this.createFishNameLabel();
        
        console.log('ReelingMiniGame: Fish created');
    }

    createUI() {
        // Additional UI elements
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Reel progress bar
        const progressBarX = width / 2;
        const progressBarY = 50;
        const progressBarWidth = 300;
        const progressBarHeight = 20;
        
        // Progress bar background
        const progressBg = this.scene.add.graphics();
        progressBg.fillStyle(0x2c3e50);
        progressBg.fillRoundedRect(progressBarX - progressBarWidth/2, progressBarY - progressBarHeight/2, progressBarWidth, progressBarHeight, 5);
        progressBg.lineStyle(2, 0x34495e);
        progressBg.strokeRoundedRect(progressBarX - progressBarWidth/2, progressBarY - progressBarHeight/2, progressBarWidth, progressBarHeight, 5);
        progressBg.setDepth(1001);
        this.uiContainer.add(progressBg);
        
        // Progress bar fill
        this.progressBar = this.scene.add.graphics();
        this.progressBar.setDepth(1002);
        this.uiContainer.add(this.progressBar);
        
        // Progress text
        this.progressText = this.scene.add.text(progressBarX, progressBarY, '0%', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        this.progressText.setOrigin(0.5);
        this.progressText.setDepth(1003);
        this.uiContainer.add(this.progressText);
        
        // Instructions
        const instructions = this.scene.add.text(width / 2, height - 50, 
            'Click and Hold to REEL | Release to reduce TENSION | Use WASD for QTEs!', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            align: 'center'
        });
        instructions.setOrigin(0.5);
        instructions.setDepth(1005);
        this.uiContainer.add(instructions);
        
        // Add visual indicator that reeling is active and ready for mouse input
        this.reelingActiveIndicator = this.scene.add.text(
            width - 20,
            height - 100,
            '🎣 REELING ACTIVE\n🖱️ LEFT CLICK to REEL!',
            {
                fontSize: '14px',
                fill: '#00ff00',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: { x: 8, y: 4 },
                align: 'right'
            }
        ).setOrigin(1, 0).setDepth(2000);
        this.uiContainer.add(this.reelingActiveIndicator);
        
        // Animate the active indicator to make it more visible
        if (this.scene.tweens) {
            this.scene.tweens.add({
                targets: this.reelingActiveIndicator,
                alpha: 0.7,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        this.updateProgressBar();
    }

    updateProgressBar() {
        if (!this.progressBar) return;
        
        const width = this.scene.cameras.main.width;
        const progressBarX = width / 2;
        const progressBarY = 50;
        const progressBarWidth = 300;
        const progressBarHeight = 20;
        
        this.progressBar.clear();
        
        // Calculate fill width
        const fillWidth = (this.reelProgress / 100) * (progressBarWidth - 4);
        
        // Color based on progress
        let fillColor = 0x00ff00;
        if (this.reelProgress < 30) {
            fillColor = 0xff0000;
        } else if (this.reelProgress < 70) {
            fillColor = 0xffaa00;
        }
        
        this.progressBar.fillStyle(fillColor);
        this.progressBar.fillRoundedRect(
            progressBarX - progressBarWidth/2 + 2,
            progressBarY - progressBarHeight/2 + 2,
            fillWidth,
            progressBarHeight - 4,
            3
        );
        
        // Update progress text
        if (this.progressText) {
            this.progressText.setText(`${Math.round(this.reelProgress)}%`);
        }
    }

    createFishVisuals() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Create UI container
        this.uiContainer = this.scene.add.container(0, 0);
        this.uiContainer.setDepth(1000);
        
        // Initial fish position (center-left of water area)
        this.fishPosition.x = width * 0.3;
        this.fishPosition.y = height * 0.6;
        this.fishTargetPosition.x = this.fishPosition.x;
        this.fishTargetPosition.y = this.fishPosition.y;
        
        // Create struggling fish graphic
        this.fishGraphic = this.scene.add.graphics();
        this.fishGraphic.setDepth(200);
        this.drawFish();
        
        // Create fish name text above the fish
        const fishName = this.selectedFish?.name || 'Unknown Fish';
        this.fishNameText = this.scene.add.text(
            this.fishPosition.x, 
            this.fishPosition.y - 40, // Position above the fish
            fishName,
            {
                fontSize: '18px',
                fill: '#ffffff',
                fontWeight: 'bold',
                stroke: '#000000',
                strokeThickness: 3,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 4,
                    fill: true
                }
            }
        );
        this.fishNameText.setOrigin(0.5);
        this.fishNameText.setDepth(210); // Above the fish graphic
        
        // Create fishing line from rod tip to fish
        this.fishingLine = this.scene.add.graphics();
        this.fishingLine.setDepth(190);
        this.updateFishingLine();
        
        // Create fish stamina bar
        this.createStaminaBar();
        
        console.log('ReelingMiniGame: Fish visuals created with name:', fishName);
    }

    drawFish() {
        if (!this.fishGraphic) return;
        
        this.fishGraphic.clear();
        this.fishGraphic.setPosition(this.fishPosition.x, this.fishPosition.y);
        
        // Fish size based on fish attributes
        const fishSize = (this.fishProperties?.size || 5) * 2;
        const fishColor = this.getFishColor();
        
        // Fish body (ellipse)
        this.fishGraphic.fillStyle(fishColor);
        this.fishGraphic.fillEllipse(0, 0, fishSize * 2, fishSize);
        
        // Fish tail (triangle)
        const tailDirection = this.fishDirection > 0 ? -1 : 1;
        this.fishGraphic.fillTriangle(
            tailDirection * fishSize, 0,
            tailDirection * fishSize * 1.5, -fishSize * 0.5,
            tailDirection * fishSize * 1.5, fishSize * 0.5
        );
        
        // Fish eye
        this.fishGraphic.fillStyle(0xFFFFFF);
        this.fishGraphic.fillCircle(fishSize * 0.3 * this.fishDirection, -fishSize * 0.2, fishSize * 0.3);
        this.fishGraphic.fillStyle(0x000000);
        this.fishGraphic.fillCircle(fishSize * 0.3 * this.fishDirection, -fishSize * 0.2, fishSize * 0.15);
        
        // Struggle effect (if struggling)
        if (this.fishStruggling) {
            this.fishGraphic.lineStyle(3, 0xFF0000, 0.8);
            this.fishGraphic.strokeEllipse(0, 0, fishSize * 2.5, fishSize * 1.5);
        }
    }

    getFishColor() {
        // Different colors based on fish rarity/type
        const rarity = this.selectedFish?.rarity || this.fishProperties?.rarity || 1;
        const colors = [
            0x8B4513, // Brown (common)
            0x4169E1, // Blue
            0x32CD32, // Green
            0xFF6347, // Red
            0xFFD700, // Gold
            0x9370DB, // Purple
            0xFF1493, // Pink
            0x00CED1, // Turquoise
            0xFF4500, // Orange
            0xDC143C  // Crimson (legendary)
        ];
        return colors[Math.min(rarity - 1, colors.length - 1)];
    }

    createFishingLine() {
        // Create fishing line graphic
        this.fishingLine = this.scene.add.graphics();
        this.fishingLine.setDepth(190);
        
        // Store the rod tip position (from GameScene or default position)
        this.scene.rodTipPosition = this.scene.rodTipPosition || {
            x: this.scene.cameras.main.width / 2,
            y: this.scene.cameras.main.height * 0.9
        };
        
        // Initial line drawing
        this.updateFishingLine();
        
        console.log('ReelingMiniGame: Fishing line created');
    }

    updateFishingLine() {
        if (!this.fishingLine || !this.scene.rodTipPosition) return;
        
        this.fishingLine.clear();
        this.fishingLine.lineStyle(3, 0x404040, 0.9);
        this.fishingLine.lineBetween(
            this.scene.rodTipPosition.x,
            this.scene.rodTipPosition.y,
            this.fishPosition.x,
            this.fishPosition.y
        );
    }

    createStaminaBar() {
        const barWidth = 100;
        const barHeight = 8;
        // Position will be updated in updateStaminaBar to follow the fish
        const initialX = this.fishPosition.x - barWidth / 2;
        const initialY = this.fishPosition.y - 40;
        
        // Stamina bar background
        this.staminaBarBg = this.scene.add.graphics();
        this.staminaBarBg.fillStyle(0x2c3e50);
        this.staminaBarBg.fillRoundedRect(initialX - 2, initialY - 2, barWidth + 4, barHeight + 4, 2);
        this.staminaBarBg.setDepth(250);
        
        // Stamina bar fill
        this.staminaBar = this.scene.add.graphics();
        this.staminaBar.setDepth(251);
        
        this.uiContainer.add(this.staminaBarBg);
        this.uiContainer.add(this.staminaBar);
        
        this.updateStaminaBar(); // Initial draw and position update
    }

    createFishNameLabel() {
        // Get fish name from fishProperties (set in start method)
        const fishName = this.fishProperties?.name || this.selectedFish?.name || 'Unknown Fish';
        
        // Create fish name text with attractive styling
        this.fishNameText = this.scene.add.text(
            this.fishPosition.x,
            this.fishPosition.y - 65, // Position above stamina bar
            fishName,
            {
                fontSize: '16px',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 4,
                    fill: true
                },
                align: 'center'
            }
        );
        
        this.fishNameText.setOrigin(0.5);
        this.fishNameText.setDepth(252); // Above stamina bar
        
        // Add to UI container
        this.uiContainer.add(this.fishNameText);
        
        // Add subtle glow effect based on fish rarity
        const rarity = this.selectedFish?.rarity || 1;
        let glowColor = '#ffffff';
        
        switch (rarity) {
            case 5: glowColor = '#ff6b6b'; break; // Legendary - Red
            case 4: glowColor = '#ffd93d'; break; // Epic - Gold
            case 3: glowColor = '#6bcf7f'; break; // Rare - Green
            case 2: glowColor = '#4ecdc4'; break; // Uncommon - Cyan
            default: glowColor = '#ffffff'; break; // Common - White
        }
        
        // Add subtle pulsing animation for higher rarity fish
        if (rarity >= 3) {
            this.scene.tweens.add({
                targets: this.fishNameText,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        console.log(`ReelingMiniGame: Fish name label created: ${fishName} (Rarity: ${rarity})`);
    }

    updateStaminaBar() {
        if (!this.staminaBarBg || !this.staminaBar) return;
        
        const barWidth = 100;
        const barHeight = 8;
        const currentX = this.fishPosition.x - barWidth / 2;
        const currentY = this.fishPosition.y - 40;
        
        // Update stamina bar background position
        this.staminaBarBg.clear();
        this.staminaBarBg.fillStyle(0x2c3e50);
        this.staminaBarBg.fillRoundedRect(currentX - 2, currentY - 2, barWidth + 4, barHeight + 4, 2);
        
        // Update stamina bar fill
        this.staminaBar.clear();
        const staminaPercentage = this.fishStamina / this.maxFishStamina;
        const fillWidth = barWidth * staminaPercentage;
        
        // Color based on stamina level
        let staminaColor = 0x27ae60; // Green
        if (staminaPercentage < 0.3) {
            staminaColor = 0xe74c3c; // Red
        } else if (staminaPercentage < 0.6) {
            staminaColor = 0xf39c12; // Orange
        }
        
        this.staminaBar.fillStyle(staminaColor);
        this.staminaBar.fillRoundedRect(currentX, currentY, fillWidth, barHeight, 2);
        
        // Update fish name label position
        if (this.fishNameText) {
            this.fishNameText.setPosition(this.fishPosition.x, this.fishPosition.y - 65);
        }
    }

    createTensionMeter() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        const meterX = width - 80;
        const meterY = height * 0.3;
        const meterWidth = 30;
        const meterHeight = 300;
        
        // Tension meter background
        this.tensionMeterBg = this.scene.add.graphics();
        this.tensionMeterBg.fillStyle(0x2c3e50);
        this.tensionMeterBg.fillRoundedRect(meterX - meterWidth/2, meterY - meterHeight/2, meterWidth, meterHeight, 5);
        this.tensionMeterBg.lineStyle(2, 0x34495e);
        this.tensionMeterBg.strokeRoundedRect(meterX - meterWidth/2, meterY - meterHeight/2, meterWidth, meterHeight, 5);
        this.tensionMeterBg.setDepth(1001);
        this.uiContainer.add(this.tensionMeterBg);
        
        // Create danger/safe zones
        this.createTensionZones(meterX, meterY, meterWidth, meterHeight);
        
        // Safe zone indicator
        this.tensionSafeZoneGraphic = this.scene.add.graphics();
        this.tensionSafeZoneGraphic.setDepth(1002);
        const safeZoneStart = meterY - meterHeight/2 + ((100 - this.tensionSafeZone.max) / 100) * meterHeight;
        const safeZoneEnd = meterY - meterHeight/2 + ((100 - this.tensionSafeZone.min) / 100) * meterHeight;
        const safeZoneHeight = safeZoneEnd - safeZoneStart;
        this.tensionSafeZoneGraphic.fillStyle(0x27ae60, 0.5);
        this.tensionSafeZoneGraphic.fillRoundedRect(meterX - meterWidth/2 + 3, safeZoneStart, meterWidth - 6, safeZoneHeight, 4);
        this.tensionSafeZoneGraphic.lineStyle(1, 0x27ae60, 0.8);
        this.tensionSafeZoneGraphic.strokeRoundedRect(meterX - meterWidth/2 + 2, safeZoneStart - 1, meterWidth - 4, safeZoneHeight + 2, 4);
        this.uiContainer.add(this.tensionSafeZoneGraphic);
        
        // Tension indicator (moving element)
        this.tensionIndicator = this.scene.add.graphics();
        this.tensionIndicator.setDepth(1003);
        this.uiContainer.add(this.tensionIndicator);
        
        // Tension meter label
        const meterLabel = this.scene.add.text(meterX, meterY - meterHeight/2 - 30, '⚡ TENSION', {
            fontSize: '14px',
            fill: '#3498db',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        meterLabel.setOrigin(0.5);
        this.uiContainer.add(meterLabel);
        
        // Safe zone label
        this.safeZoneLabel = this.scene.add.text(meterX + 40, (safeZoneStart + safeZoneEnd) / 2, '✓ SAFE', {
            fontSize: '12px',
            fill: '#27ae60',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        this.safeZoneLabel.setOrigin(0, 0.5);
        this.uiContainer.add(this.safeZoneLabel);
        
        this.scene.tweens.add({
            targets: this.safeZoneLabel,
            alpha: 0.7,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Tension value display
        this.tensionValueText = this.scene.add.text(meterX, meterY + meterHeight/2 + 20, '50%', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        this.tensionValueText.setOrigin(0.5);
        this.uiContainer.add(this.tensionValueText);
        
        // Line integrity warning
        this.lineIntegrityText = this.scene.add.text(meterX, meterY + meterHeight/2 + 45, 'LINE: 100%', {
            fontSize: '12px',
            fill: '#27ae60',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        this.lineIntegrityText.setOrigin(0.5);
        this.uiContainer.add(this.lineIntegrityText);
        
        console.log('ReelingMiniGame: Tension meter created with standard Phaser graphics');
    }

    createTensionZones(meterX, meterY, meterWidth, meterHeight) {
        // Create visual zones for different tension levels
        const zones = [
            { start: 0, end: 30, color: 0xe74c3c, alpha: 0.3, label: 'DANGER' },
            { start: 30, end: 70, color: 0x27ae60, alpha: 0.3, label: 'SAFE' },
            { start: 70, end: 100, color: 0xe74c3c, alpha: 0.3, label: 'DANGER' }
        ];
        
        zones.forEach((zone, index) => {
            const zoneStart = meterY - meterHeight/2 + ((100 - zone.end) / 100) * meterHeight;
            const zoneEnd = meterY - meterHeight/2 + ((100 - zone.start) / 100) * meterHeight;
            const zoneHeight = zoneEnd - zoneStart;
            
            // Create zone panel
            const zonePanel = this.scene.add.graphics();
            zonePanel.fillStyle(zone.color, zone.alpha);
            zonePanel.fillRoundedRect(meterX - meterWidth/2 + 3, zoneStart, meterWidth - 6, zoneHeight, 3);
            zonePanel.setDepth(1001);
            this.uiContainer.add(zonePanel);
            
            // Zone labels
            if (index !== 1) { // Don't label safe zone here, we have a special label for it
                const labelY = zoneStart + zoneHeight / 2;
                const zoneLabel = this.scene.add.text(meterX + 35, labelY, zone.label, {
                    fontSize: '10px',
                    fill: zone.color === 0xe74c3c ? '#e74c3c' : '#27ae60',
                    fontFamily: 'Arial',
                    fontWeight: 'bold'
                });
                zoneLabel.setOrigin(0, 0.5);
                this.uiContainer.add(zoneLabel);
            }
        });
    }

    setupInputHandling() {
        // Mouse input for reeling with enhanced debugging
        this.mouseHandler = (pointer) => {
            console.log('ReelingMiniGame: Mouse click detected! Pointer:', pointer);
            console.log('ReelingMiniGame: Current state - isActive:', this.isActive, 'activeQTE:', !!this.activeQTE);
            
            if (!this.isActive) {
                console.log('ReelingMiniGame: Mouse click ignored - game not active');
                return;
            }
            
            console.log('ReelingMiniGame: Processing mouse click for reeling');
            this.handleInput('reel', { pointer: pointer });
        };
        
        // CONSOLIDATED keyboard input - use DOM events for consistency with QTEDebugTool
        this.keyDownHandler = (event) => {
            if (!this.isActive || !this.activeQTE) return;
            
            // Ignore key repeat events to prevent hold time corruption
            if (event.repeat) {
                console.log('ReelingMiniGame: Ignoring key repeat event for', event.code);
                return;
            }
            
            // Add debugging for hold QTEs
            if (this.activeQTE.type === 'hold') {
                console.log('ReelingMiniGame: KeyDown event for HOLD QTE:', event.code, 'at time:', this.scene.time.now);
            }
            
            switch (event.code) {
                case 'Space':
                    event.preventDefault();
                    if (this.activeQTE.type === 'hold') {
                        console.log('ReelingMiniGame: HOLD START detected at time:', this.scene.time.now);
                        this.handleInput('holdStart');
                    } else if (this.activeQTE.type === 'tap') {
                        this.handleInput('tap');
                    } else if (this.activeQTE.type === 'timing') {
                        this.handleInput('tap');
                    }
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    event.preventDefault();
                    this.handleInput('direction', { direction: 'up' });
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    event.preventDefault();
                    this.handleInput('direction', { direction: 'down' });
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    event.preventDefault();
                    this.handleInput('direction', { direction: 'left' });
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    event.preventDefault();
                    this.handleInput('direction', { direction: 'right' });
                    break;
            }
        };
        
        this.keyUpHandler = (event) => {
            if (!this.isActive || !this.activeQTE) return;
            
            if (event.code === 'Space' && this.activeQTE.type === 'hold') {
                event.preventDefault();
                console.log('ReelingMiniGame: HOLD END detected at time:', this.scene.time.now);
                this.handleInput('holdEnd');
            }
        };
        
        // Enhanced input setup with debugging
        try {
            console.log('ReelingMiniGame: Setting up input handlers...');
            console.log('ReelingMiniGame: Scene input object:', this.scene.input);
            console.log('ReelingMiniGame: Scene input enabled:', this.scene.input?.enabled);
            
            // Ensure scene input is enabled
            if (this.scene.input && !this.scene.input.enabled) {
                console.log('ReelingMiniGame: Scene input was disabled, enabling it...');
                this.scene.input.enabled = true;
            }
            
            // Attach mouse handler
            if (this.scene.input) {
                this.scene.input.on('pointerdown', this.mouseHandler);
                console.log('ReelingMiniGame: Mouse handler attached successfully');
                
                // Test if input is working by adding a temporary test listener
                const testHandler = (pointer) => {
                    console.log('ReelingMiniGame: TEST - Input working! Pointer at:', pointer.x, pointer.y);
                    console.log('ReelingMiniGame: TEST - Pointer button:', pointer.button);
                    console.log('ReelingMiniGame: TEST - Pointer isDown:', pointer.isDown);
                };
                this.scene.input.once('pointerdown', testHandler);
                console.log('ReelingMiniGame: Test input listener added');
            } else {
                console.error('ReelingMiniGame: Scene input not available');
            }
            
            // Add global click test for debugging
            this.globalClickTest = (event) => {
                console.log('ReelingMiniGame: GLOBAL CLICK TEST - DOM click detected at:', event.clientX, event.clientY);
                // Try to manually trigger the handleInput method
                if (this.isActive) {
                    console.log('ReelingMiniGame: Manually triggering reel input from DOM event');
                    this.handleInput('reel', { pointer: { x: event.clientX, y: event.clientY, button: 0 } });
                }
            };
            document.addEventListener('click', this.globalClickTest);
            console.log('ReelingMiniGame: Global DOM click listener added for testing');
            
            // Use DOM events for keyboard input to match QTEDebugTool implementation
            document.addEventListener('keydown', this.keyDownHandler);
            document.addEventListener('keyup', this.keyUpHandler);
            
            console.log('ReelingMiniGame: Consolidated input handling set up with DOM events and enhanced debugging');
        } catch (error) {
            console.error('ReelingMiniGame: Error setting up input handlers:', error);
        }
    }

    updateTensionMeter() {
        if (!this.tensionIndicator) return;
        
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const meterX = width - 80;
        const meterY = height * 0.3;
        const meterWidth = 30;
        const meterHeight = 300;
        
        // Clear and redraw tension indicator
        this.tensionIndicator.clear();
        
        // Calculate indicator position (inverted - 100% tension at top)
        const tensionPercent = Math.max(0, Math.min(100, this.tension));
        const indicatorY = meterY + meterHeight/2 - (tensionPercent / 100) * meterHeight;
        
        // Determine indicator color and effects based on tension level
        let indicatorColor = 0x00ff00; // Default green
        let glowColor = 0x88ff88;
        let pulseEffect = false;
        // Screen shake removed to prevent visual problems
        // let screenShake = false;
        
        if (tensionPercent < this.tensionSafeZone.min || tensionPercent > this.tensionSafeZone.max) {
            // Danger zone - red with pulsing
            indicatorColor = 0xff0000;
            glowColor = 0xff8888;
            pulseEffect = true;
            
            // Screen shake removed to prevent visual problems
            // if (tensionPercent > 85 || tensionPercent < 15) {
            //     screenShake = true;
            //     indicatorColor = 0xff4444;
            //     glowColor = 0xffaaaa;
            // }
            
            // Keep color changes for extreme danger without screen shake
            if (tensionPercent > 85 || tensionPercent < 15) {
                indicatorColor = 0xff4444;
                glowColor = 0xffaaaa;
            }
        } else {
            // Safe zone - green
            indicatorColor = 0x00ff00;
            glowColor = 0x88ff88;
        }
        
        // Draw main indicator bar
        const indicatorHeight = 8;
        this.tensionIndicator.fillStyle(indicatorColor);
        this.tensionIndicator.fillRoundedRect(
            meterX - meterWidth/2 - 5, 
            indicatorY - indicatorHeight/2, 
            meterWidth + 10, 
            indicatorHeight, 
            4
        );
        
        // Glow effect
        this.tensionIndicator.lineStyle(3, glowColor, 0.8);
        this.tensionIndicator.strokeRoundedRect(
            meterX - meterWidth/2 - 7, 
            indicatorY - indicatorHeight/2 - 2, 
            meterWidth + 14, 
            indicatorHeight + 4, 
            6
        );
        
        // Indicator arrows pointing to current tension
        this.tensionIndicator.fillStyle(indicatorColor);
        this.tensionIndicator.fillTriangle(
            meterX - meterWidth/2 - 12, indicatorY,
            meterX - meterWidth/2 - 5, indicatorY - 5,
            meterX - meterWidth/2 - 5, indicatorY + 5
        );
        this.tensionIndicator.fillTriangle(
            meterX + meterWidth/2 + 12, indicatorY,
            meterX + meterWidth/2 + 5, indicatorY - 5,
            meterX + meterWidth/2 + 5, indicatorY + 5
        );
        
        // Update tension value text with color coding
        if (this.tensionValueText) {
            this.tensionValueText.setText(`${Math.round(tensionPercent)}%`);
            
            if (tensionPercent < this.tensionSafeZone.min || tensionPercent > this.tensionSafeZone.max) {
                this.tensionValueText.setFill('#ff4444');
                if (pulseEffect) {
                    // Add pulsing effect for danger
                    this.scene.tweens.killTweensOf(this.tensionValueText);
                    this.scene.tweens.add({
                        targets: this.tensionValueText,
                        scaleX: 1.2,
                        scaleY: 1.2,
                        duration: 200,
                        yoyo: true,
                        ease: 'Power2'
                    });
                }
            } else {
                this.tensionValueText.setFill('#00ff88');
                this.scene.tweens.killTweensOf(this.tensionValueText);
                this.tensionValueText.setScale(1);
            }
        }
        
        // Update line integrity display
        if (this.lineIntegrityText) {
            const integrityPercent = Math.round(this.lineIntegrity);
            this.lineIntegrityText.setText(`LINE: ${integrityPercent}%`);
            
            if (integrityPercent < 30) {
                this.lineIntegrityText.setFill('#ff0000');
                // Keep text visible without blinking
                this.scene.tweens.killTweensOf(this.lineIntegrityText);
                this.lineIntegrityText.setAlpha(1);
            } else if (integrityPercent < 60) {
                this.lineIntegrityText.setFill('#ffaa00');
                this.scene.tweens.killTweensOf(this.lineIntegrityText);
                this.lineIntegrityText.setAlpha(1);
            } else {
                this.lineIntegrityText.setFill('#00ff00');
                this.scene.tweens.killTweensOf(this.lineIntegrityText);
                this.lineIntegrityText.setAlpha(1);
            }
        }
        
        // Screen shake for extreme tension
        // if (screenShake) {
        //     this.scene.cameras.main.shake(100, 2);
        // }
        
        // Create tension warning particles in danger zones
        if (tensionPercent > 90 || tensionPercent < 10) {
            this.createTensionWarningEffects(meterX, indicatorY);
        }
    }

    createTensionWarningEffects(x, y) {
        // Create warning particles for extreme tension
        for (let i = 0; i < 3; i++) {
            const particle = this.scene.add.graphics();
            particle.fillStyle(0xff4444, 0.8);
            particle.fillCircle(0, 0, Phaser.Math.Between(2, 4));
            particle.setPosition(x + Phaser.Math.Between(-20, 20), y + Phaser.Math.Between(-10, 10));
            
            // Animate warning particle
            this.scene.tweens.add({
                targets: particle,
                y: y - 30,
                alpha: 0,
                scaleX: 0.1,
                scaleY: 0.1,
                duration: 800,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    startReeling() {
        // Start main reeling loop
        this.reelingTimer = this.scene.time.addEvent({
            delay: 100, // Update every 100ms
            callback: this.updateReeling,
            callbackScope: this,
            loop: true
        });
        
        // Schedule first fish struggle
        this.scheduleNextStruggle();
        
        // Schedule first QTE
        this.scheduleNextQTE();
    }

    updateReeling() {
        if (!this.isActive) return;
        
        // Update boss mechanics if this is a boss fight
        if (this.isBoss) {
            this.updateBossMechanics();
        }
        
        // Update fish movement
        this.updateFishMovement();
        
        // Update tension based on current state
        this.updateTension();
        
        // Update reel progress
        this.updateReelProgress();
        
        // Update visual elements
        this.updateVisuals();
        
        // Check win/lose conditions
        this.checkWinLoseConditions();
        
        // Emit update event for UI
        this.scene.events.emit('fishing:reelUpdate', {
            tension: this.tension,
            lineIntegrity: this.lineIntegrity,
            reelProgress: this.reelProgress,
            fishStamina: this.fishStamina,
            fishStruggling: this.fishStruggling,
            activeQTE: this.activeQTE,
            isBoss: this.isBoss,
            bossPhase: this.bossPhase
        });
    }

    updateFishMovement() {
        if (!this.isActive) return;
        
        // Fish movement behavior
        if (this.fishStruggling) {
            // Erratic movement during struggle
            this.updateStruggleMovement();
        } else {
            // Normal swimming movement
            this.updateNormalMovement();
        }
        
        // Move fish towards target position
        const dx = this.fishTargetPosition.x - this.fishPosition.x;
        const dy = this.fishTargetPosition.y - this.fishPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            const moveX = (dx / distance) * this.fishMovementSpeed;
            const moveY = (dy / distance) * this.fishMovementSpeed;
            
            this.fishPosition.x += moveX;
            this.fishPosition.y += moveY;
            
            // Update fish direction based on movement
            if (Math.abs(moveX) > 0.1) {
                this.fishDirection = moveX > 0 ? 1 : -1;
            }
        }
        
        // Keep fish within water bounds
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        this.fishPosition.x = Phaser.Math.Clamp(this.fishPosition.x, 50, width - 50);
        this.fishPosition.y = Phaser.Math.Clamp(this.fishPosition.y, height * 0.4, height * 0.8);
    }

    updateStruggleMovement() {
        // Rapid, erratic movement during struggle
        const intensity = this.calculateStruggleIntensity();
        const moveDistance = 30 + intensity * 20;
        
        // Random direction changes
        if (Math.random() < 0.1) {
            const width = this.scene.cameras.main.width;
            const height = this.scene.cameras.main.height;
            
            this.fishTargetPosition.x = Phaser.Math.Between(
                Math.max(50, this.fishPosition.x - moveDistance),
                Math.min(width - 50, this.fishPosition.x + moveDistance)
            );
            this.fishTargetPosition.y = Phaser.Math.Between(
                Math.max(height * 0.4, this.fishPosition.y - moveDistance/2),
                Math.min(height * 0.8, this.fishPosition.y + moveDistance/2)
            );
            
            this.fishMovementSpeed = 3 + intensity;
        }
        
        // Create splash effects during intense struggles
        if (Math.random() < 0.3) {
            this.createSplashEffect();
        }
    }

    updateNormalMovement() {
        // Gentle swimming movement
        if (Math.random() < 0.05) {
            const width = this.scene.cameras.main.width;
            const moveDistance = 40;
            
            this.fishTargetPosition.x = Phaser.Math.Between(
                Math.max(50, this.fishPosition.x - moveDistance),
                Math.min(width - 50, this.fishPosition.x + moveDistance)
            );
            
            this.fishMovementSpeed = 1;
        }
    }

    createSplashEffect() {
        const splash = this.scene.add.graphics();
        splash.setDepth(210);
        splash.setPosition(this.fishPosition.x, this.fishPosition.y);
        
        // Create water droplets
        const dropletCount = Phaser.Math.Between(3, 6);
        for (let i = 0; i < dropletCount; i++) {
            const angle = (i / dropletCount) * Math.PI * 2;
            const distance = Phaser.Math.Between(10, 25);
            const size = Phaser.Math.Between(2, 5);
            
            splash.fillStyle(0x87CEEB, 0.8);
            splash.fillCircle(
                Math.cos(angle) * distance,
                Math.sin(angle) * distance,
                size
            );
        }
        
        // Animate splash
        this.scene.tweens.add({
            targets: splash,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 500,
            ease: 'Power2.easeOut',
            onComplete: () => {
                splash.destroy();
            }
        });
        
        this.splashEffects.push(splash);
        
        // Clean up old splash effects
        this.splashEffects = this.splashEffects.filter(effect => effect.active);
    }

    updateVisuals() {
        // Update fish graphic
        this.drawFish();
        
        // Update fish name text position to follow the fish
        if (this.fishNameText) {
            this.fishNameText.setPosition(this.fishPosition.x, this.fishPosition.y - 40);
        }
        
        // Update fishing line
        this.updateFishingLine();
        
        // Update stamina bar
        this.updateStaminaBar();
        
        // Update tension meter
        this.updateTensionMeter();
    }

    updateTension() {
        let tensionChange = 0;
        
        // Base tension increase over time
        tensionChange += 0.5;
        
        // Fish struggling increases tension
        if (this.fishStruggling) {
            const struggleIntensity = this.calculateStruggleIntensity();
            tensionChange += struggleIntensity;
        }
        
        // Player in safe zone reduces tension
        if (this.tension >= this.tensionSafeZone.min && this.tension <= this.tensionSafeZone.max) {
            tensionChange -= 1;
        }
        
        // Successful QTEs reduce tension
        if (this.qteSuccess > this.qteFails) {
            tensionChange -= 0.5;
        }
        
        // Apply tension change
        this.tension = Phaser.Math.Clamp(this.tension + tensionChange, 0, 100);
        
        // High tension damages line integrity
        if (this.tension > this.tensionSafeZone.max) {
            const damage = (this.tension - this.tensionSafeZone.max) * 0.1;
            this.lineIntegrity = Math.max(0, this.lineIntegrity - damage);
        }
    }

    updateReelProgress() {
        let progressChange = 0;
        
        // Base reel speed
        const reelSpeed = this.rodStats?.reelSpeed || 1;
        progressChange += reelSpeed * 0.1;
        
        // Tension affects progress
        if (this.tension >= this.tensionSafeZone.min && this.tension <= this.tensionSafeZone.max) {
            progressChange *= 1.5; // Bonus for staying in safe zone
        } else if (this.tension > this.tensionSafeZone.max) {
            progressChange *= 0.5; // Penalty for high tension
        }
        
        // Fish struggling reduces progress
        if (this.fishStruggling) {
            progressChange *= 0.3;
        }
        
        // Apply progress change
        this.reelProgress = Phaser.Math.Clamp(this.reelProgress + progressChange, 0, 100);
        
        // Reduce fish stamina as we make progress
        if (progressChange > 0) {
            this.fishStamina = Math.max(0, this.fishStamina - progressChange * 0.5);
        }
        
        // Update progress bar visual
        this.updateProgressBar();
    }

    calculateStruggleIntensity() {
        const fishSize = this.fishProperties?.size || 5;
        const fishAggressiveness = this.fishProperties?.aggressiveness || 5;
        const baseIntensity = (fishSize + fishAggressiveness) / 2;
        
        // Different struggle types have different intensities
        const struggleMultipliers = {
            'dash': 3.0,
            'thrash': 2.5,
            'dive': 2.0,
            'surface': 1.5,
            'circle': 1.8,
            'jump': 2.2,
            'roll': 1.6,
            'shake': 1.4,
            'pull': 2.8,
            'spiral': 2.0
        };
        
        const multiplier = struggleMultipliers[this.struggleType] || 2.0;
        return baseIntensity * multiplier * 0.1;
    }

    scheduleNextStruggle() {
        if (!this.isActive) return;
        
        // Random delay between struggles (2-8 seconds)
        const delay = Phaser.Math.Between(2000, 8000);
        
        this.struggleTimer = this.scene.time.delayedCall(delay, () => {
            this.startFishStruggle();
        });
    }

    startFishStruggle() {
        if (!this.isActive) return;
        
        // Select random struggle type
        const struggleTypes = ['dash', 'thrash', 'dive', 'surface', 'circle', 'jump', 'roll', 'shake', 'pull', 'spiral'];
        this.struggleType = Phaser.Utils.Array.GetRandom(struggleTypes);
        this.fishStruggling = true;
        
        // Play fish struggle audio
        this.audioManager?.playSFX('fish_struggle');
        
        console.log(`ReelingMiniGame: Fish struggling - ${this.struggleType}`);
        
        // Emit struggle event
        this.scene.events.emit('fishing:fishStruggle', {
            struggleType: this.struggleType,
            intensity: this.calculateStruggleIntensity()
        });
        
        // Struggle lasts 2-4 seconds
        const struggleDuration = Phaser.Math.Between(2000, 4000);
        
        this.scene.time.delayedCall(struggleDuration, () => {
            this.fishStruggling = false;
            this.struggleType = null;
            
            // Schedule next struggle
            this.scheduleNextStruggle();
        });
    }

    scheduleNextQTE() {
        if (!this.isActive || this.activeQTE) return;
        
        // Random delay between QTEs (3-6 seconds)
        const delay = Phaser.Math.Between(3000, 6000);
        
        this.qteTimer = this.scene.time.delayedCall(delay, () => {
            if (this.isActive && !this.activeQTE) {
                this.startQTE();
            }
        });
    }

    startQTE() {
        if (!this.isActive) return;
        
        // Select QTE type based on current situation
        let qteType = Phaser.Utils.Array.GetRandom(this.qteTypes);
        
        // Adjust QTE difficulty based on fish elusiveness
        const elusiveness = this.selectedFish?.elusiveness || this.fishProperties?.elusiveness || 5;
        const difficulty = Math.min(3, Math.max(1, elusiveness / 3));
        
        this.activeQTE = {
            type: qteType,
            difficulty: difficulty,
            timeLimit: qteType === 'hold' ? 3000 : (3000 - (difficulty * 500)), // Fixed 3s for hold, variable for others
            startTime: this.scene.time.now,
            completed: false,
            success: false
        };
        
        // Generate QTE-specific data
        switch (qteType) {
            case 'tap':
                this.activeQTE.requiredTaps = difficulty + 2;
                this.activeQTE.currentTaps = 0;
                break;
            case 'hold':
                this.activeQTE.holdDuration = 1500; // Fixed 1.5 seconds
                this.activeQTE.holdStartTime = null;
                this.holdCompleted = false; // Reset hold completion flag
                break;
            case 'sequence':
                this.activeQTE.sequence = this.generateInputSequence(difficulty + 2);
                this.activeQTE.currentIndex = 0;
                break;
            case 'timing':
                this.activeQTE.targetTime = this.activeQTE.timeLimit * 0.7; // Hit at 70% of time limit
                this.activeQTE.tolerance = 200; // ±200ms tolerance
                break;
        }
        
        console.log(`ReelingMiniGame: QTE started - ${qteType}, difficulty ${difficulty}`);
        
        // Create visual QTE elements
        this.createQTEVisuals();
        
        // Emit QTE start event
        this.scene.events.emit('fishing:qteStart', {
            qte: this.activeQTE
        });
        
        // Set QTE timeout
        this.scene.time.delayedCall(this.activeQTE.timeLimit, () => {
            if (this.activeQTE && !this.activeQTE.completed) {
                this.completeQTE(false);
            }
        });
    }

    generateInputSequence(length) {
        const inputs = ['up', 'down', 'left', 'right'];
        const sequence = [];
        for (let i = 0; i < length; i++) {
            sequence.push(Phaser.Utils.Array.GetRandom(inputs));
        }
        return sequence;
    }

    createQTEVisuals() {
        if (!this.activeQTE || !this.isActive) return;
        
        this.destroyQTEVisuals();
        
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        this.qteContainer = this.scene.add.container(width / 2, height / 2);
        this.qteContainer.setDepth(2000);
        
        // Create background panel
        this.qteBackground = this.scene.add.graphics();
        this.qteBackground.fillStyle(0x2c3e50, 0.95);
        this.qteBackground.fillRoundedRect(-150, -80, 300, 160, 10);
        this.qteBackground.lineStyle(3, 0x3498db);
        this.qteBackground.strokeRoundedRect(-150, -80, 300, 160, 10);
        this.qteContainer.add(this.qteBackground);
        
        switch (this.activeQTE.type) {
            case 'tap':
                this.createTapQTEVisuals();
                break;
            case 'hold':
                this.createHoldQTEVisuals();
                break;
            case 'sequence':
                this.createSequenceQTEVisuals();
                break;
            case 'timing':
                this.createTimingQTEVisuals();
                break;
        }
        
        // Create progress bar
        this.createQTEProgressBar();
        
        // Add pulsing animation to container
        this.scene.tweens.add({
            targets: this.qteContainer,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createTapQTEVisuals() {
        // Instructions
        this.qteInstructions = this.scene.add.text(0, -50, 
            `TAP SPACE ${this.activeQTE.requiredTaps} TIMES!`, {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        this.qteInstructions.setOrigin(0.5);
        this.qteContainer.add(this.qteInstructions);
        
        // Tap indicator
        this.qteTapIndicator = this.scene.add.graphics();
        this.qteTapIndicator.fillStyle(0x3498db);
        this.qteTapIndicator.fillRoundedRect(-30, -10, 60, 20, 5);
        this.qteTapIndicator.lineStyle(2, 0x2980b9);
        this.qteTapIndicator.strokeRoundedRect(-30, -10, 60, 20, 5);
        this.qteContainer.add(this.qteTapIndicator);
        
        // Tap indicator text
        const tapText = this.scene.add.text(0, 0, 'SPACE', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        tapText.setOrigin(0.5);
        this.qteContainer.add(tapText);
        
        // Tap counter
        const tapCounter = this.scene.add.text(0, 25, 
            `${this.activeQTE.currentTaps}/${this.activeQTE.requiredTaps}`, {
            fontSize: '18px',
            fill: '#27ae60',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        tapCounter.setOrigin(0.5);
        this.qteContainer.add(tapCounter);
        
        this.scene.tweens.add({
            targets: [this.qteTapIndicator, tapText],
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createHoldQTEVisuals() {
        // Instructions
        this.qteInstructions = this.scene.add.text(0, -50, 
            'HOLD SPACEBAR FOR 1.5 SECONDS!', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        this.qteInstructions.setOrigin(0.5);
        this.qteContainer.add(this.qteInstructions);
        
        // Hold indicator panel
        this.qteTapIndicator = this.scene.add.graphics();
        this.qteTapIndicator.fillStyle(0x3498db);
        this.qteTapIndicator.fillRoundedRect(-40, -15, 80, 30, 5);
        this.qteTapIndicator.lineStyle(2, 0x2980b9);
        this.qteTapIndicator.strokeRoundedRect(-40, -15, 80, 30, 5);
        this.qteContainer.add(this.qteTapIndicator);
        
        // Hold text
        const holdText = this.scene.add.text(0, 0, 'HOLD SPACE', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        holdText.setOrigin(0.5);
        this.qteContainer.add(holdText);
        
        // Hold duration bar background
        const holdBarBg = this.scene.add.graphics();
        holdBarBg.fillStyle(0x2c3e50);
        holdBarBg.fillRoundedRect(-75, 20, 150, 8, 3);
        holdBarBg.lineStyle(1, 0x34495e);
        holdBarBg.strokeRoundedRect(-75, 20, 150, 8, 3);
        this.qteContainer.add(holdBarBg);

        // Hold duration bar fill
        this.holdBarFill = this.scene.add.graphics();
        this.qteContainer.add(this.holdBarFill);
        
        // Add hold timer to update progress bar
        this.holdProgressTimer = this.scene.time.addEvent({
            delay: 50,
            callback: this.updateHoldProgress,
            callbackScope: this,
            loop: true
        });
    }

    createSequenceQTEVisuals() {
        // Instructions
        this.qteInstructions = this.scene.add.text(0, -50, 
            'PRESS ARROW KEYS OR WASD IN ORDER!', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        this.qteInstructions.setOrigin(0.5);
        this.qteContainer.add(this.qteInstructions);
        
        const arrowSpacing = 40;
        const startX = -(this.activeQTE.sequence.length - 1) * arrowSpacing / 2;
        
        this.qteArrows = [];
        this.activeQTE.sequence.forEach((direction, index) => {
            const arrow = this.createDirectionArrow(direction, startX + index * arrowSpacing, 0);
            
            if (index === this.activeQTE.currentIndex) {
                this.drawArrow(arrow, direction, 0x27ae60); // Green
                this.scene.tweens.add({
                    targets: arrow,
                    scaleX: 1.3,
                    scaleY: 1.3,
                    duration: 500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            } else if (index < this.activeQTE.currentIndex) {
                this.drawArrow(arrow, direction, 0x666666); // Gray
            } else {
                this.drawArrow(arrow, direction, 0xffffff); // White
            }
            
            this.qteArrows.push(arrow);
            this.qteContainer.add(arrow);
            
            // Add the key text to the container as well
            if (arrow.keyText) {
                this.qteContainer.add(arrow.keyText);
            }
        });
        
        // Progress indicator
        const progressText = this.scene.add.text(0, 35, 
            `${this.activeQTE.currentIndex}/${this.activeQTE.sequence.length}`, {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        progressText.setOrigin(0.5);
        this.qteContainer.add(progressText);
    }

    createDirectionArrow(direction, x, y) {
        const arrow = this.scene.add.graphics();
        arrow.setPosition(x, y);
        
        // Store direction and color for redrawing
        arrow.direction = direction;
        arrow.currentColor = 0xFFFFFF;
        
        // Draw the WASD key
        this.drawArrow(arrow, direction, 0xFFFFFF);
        
        return arrow;
    }

    drawArrow(arrow, direction, color) {
        arrow.clear();
        
        // Draw WASD key indicators instead of arrows
        const keySize = 20;
        const keyRadius = 3;
        
        // Draw key background
        arrow.fillStyle(0x444444);
        arrow.fillRoundedRect(-keySize/2, -keySize/2, keySize, keySize, keyRadius);
        
        // Draw key border
        arrow.lineStyle(2, color);
        arrow.strokeRoundedRect(-keySize/2, -keySize/2, keySize, keySize, keyRadius);
        
        // Get the arrow symbol for this direction
        let keySymbol = '';
        switch (direction) {
            case 'up':
                keySymbol = '↑';
                break;
            case 'down':
                keySymbol = '↓';
                break;
            case 'left':
                keySymbol = '←';
                break;
            case 'right':
                keySymbol = '→';
                break;
        }
        
        // Clean up existing text if it exists
        if (arrow.keyText) {
            arrow.keyText.destroy();
        }
        
        // Create text object for the letter using relative positioning to the container
        const colorHex = '#' + color.toString(16).padStart(6, '0');
        arrow.keyText = arrow.scene.add.text(0, 0, keySymbol, {
            fontSize: '14px',
            fill: colorHex,
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        arrow.keyText.setOrigin(0.5);
        arrow.keyText.setPosition(arrow.x, arrow.y);
        arrow.keyText.setDepth(arrow.depth + 1);
        
        // Store reference for cleanup
        arrow.currentColor = color;
    }

    createTimingQTEVisuals() {
        // Instructions
        this.qteInstructions = this.scene.add.text(0, -50, 
            'HIT SPACEBAR AT THE RIGHT TIME!', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        this.qteInstructions.setOrigin(0.5);
        this.qteContainer.add(this.qteInstructions);
        
        // Timing bar background
        const timingBarBg = this.scene.add.graphics();
        timingBarBg.fillStyle(0x2c3e50);
        timingBarBg.fillRoundedRect(-100, -10, 200, 20, 5);
        timingBarBg.lineStyle(2, 0x34495e);
        timingBarBg.strokeRoundedRect(-100, -10, 200, 20, 5);
        this.qteContainer.add(timingBarBg);
        
        const targetPercent = this.activeQTE.targetTime / this.activeQTE.timeLimit;
        const targetX = -100 + (targetPercent * 200);
        const targetWidth = (this.activeQTE.tolerance * 2 / this.activeQTE.timeLimit) * 200;
        
        // Target zone
        this.qteTimingTarget = this.scene.add.graphics();
        this.qteTimingTarget.fillStyle(0x27ae60, 0.7); // Green with alpha
        this.qteTimingTarget.fillRoundedRect(targetX - targetWidth/2, -10, targetWidth, 20, 5);
        this.qteContainer.add(this.qteTimingTarget);
        
        // Moving indicator
        this.qteTimingIndicator = this.scene.add.graphics();
        this.qteTimingIndicator.fillStyle(0xFF0000);
        this.qteTimingIndicator.fillRect(-2, -15, 4, 30);
        this.qteTimingIndicator.setPosition(-100, 0);
        this.qteContainer.add(this.qteTimingIndicator);
        
        // Animate indicator
        this.scene.tweens.add({
            targets: this.qteTimingIndicator,
            x: 100,
            duration: this.activeQTE.timeLimit,
            ease: 'Linear'
        });
        
        // Instructions
        const instructionText = this.scene.add.text(0, 25, 
            'Hit SPACE when the red line is in the GREEN zone!', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        this.qteContainer.add(instructionText);
    }

    createQTEProgressBar() {
        // Time remaining bar background
        const progressBarBg = this.scene.add.graphics();
        progressBarBg.fillStyle(0x2c3e50);
        progressBarBg.fillRoundedRect(-140, 60, 280, 8, 3);
        progressBarBg.lineStyle(1, 0x34495e);
        progressBarBg.strokeRoundedRect(-140, 60, 280, 8, 3);
        this.qteContainer.add(progressBarBg);
        
        // QTE Progress bar fill
        this.qteProgressBar = this.scene.add.graphics();
        this.qteProgressBar.fillStyle(0xf39c12); // Orange for time running out
        this.qteProgressBar.fillRect(-140, 60, 280, 8); // Initial full fill
        this.qteContainer.add(this.qteProgressBar);
        
        this.scene.tweens.add({
            targets: this.qteProgressBar,
            scaleX: 0,
            duration: this.activeQTE.timeLimit,
            ease: 'Linear'
        });
    }

    updateQTEVisuals() {
        if (!this.activeQTE || !this.qteContainer) return;
        
        switch (this.activeQTE.type) {
            case 'tap':
                this.updateTapQTEVisuals();
                break;
            case 'sequence':
                this.updateSequenceQTEVisuals();
                break;
        }
    }

    updateTapQTEVisuals() {
        if (!this.qteContainer || !this.activeQTE) return;
        
        // Update tap counter
        const tapCounter = this.qteContainer.list.find(child => 
            child.type === 'Text' && child.text && child.text.includes('/'));
        if (tapCounter) {
            tapCounter.setText(`${this.activeQTE.currentTaps}/${this.activeQTE.requiredTaps}`);
            
            // Flash on successful tap
            if (this.activeQTE.currentTaps > 0) {
                this.scene.tweens.add({
                    targets: tapCounter,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 100,
                    yoyo: true,
                    ease: 'Power2.easeOut'
                });
            }
        }
    }

    updateSequenceQTEVisuals() {
        if (!this.qteContainer || !this.activeQTE || !this.qteArrows) return;
        
        // Update arrow highlighting
        this.qteArrows.forEach((arrow, index) => {
            if (arrow && arrow.active && arrow.direction) {
                let color;
                if (index === this.activeQTE.currentIndex) {
                    color = 0x00FF00; // Current arrow - green
                } else if (index < this.activeQTE.currentIndex) {
                    color = 0x666666; // Completed arrows - gray
                } else {
                    color = 0xFFFFFF; // Future arrows - white
                }
                
                // Only redraw if color changed
                if (arrow.currentColor !== color) {
                    this.drawArrow(arrow, arrow.direction, color);
                }
            }
        });
        
        // Update progress text
        const progressText = this.qteContainer.list.find(child => 
            child.type === 'Text' && child.text && child.text.includes('/'));
        if (progressText) {
            progressText.setText(`${this.activeQTE.currentIndex}/${this.activeQTE.sequence.length}`);
        }
    }

    destroyQTEVisuals() {
        // Clean up hold progress timer
        if (this.holdProgressTimer) {
            this.holdProgressTimer.destroy();
            this.holdProgressTimer = null;
        }
        
        // Reset hold completion flag
        this.holdCompleted = false;
        
        // Stop any ongoing tweens on QTE elements
        if (this.qteContainer) {
            this.scene.tweens.killTweensOf(this.qteContainer);
            this.qteContainer.destroy();
            this.qteContainer = null;
        }
        
        // Clean up individual QTE elements
        if (this.qteBackground) {
            this.scene.tweens.killTweensOf(this.qteBackground);
            this.qteBackground = null;
        }
        
        if (this.qteTapIndicator) {
            this.scene.tweens.killTweensOf(this.qteTapIndicator);
            this.qteTapIndicator = null;
        }
        
        if (this.qteTimingIndicator) {
            this.scene.tweens.killTweensOf(this.qteTimingIndicator);
            this.qteTimingIndicator = null;
        }
        
        // Clean up arrows and their text
        if (this.qteArrows) {
            this.qteArrows.forEach(arrow => {
                if (arrow && arrow.active) {
                    this.scene.tweens.killTweensOf(arrow);
                    // Clean up the associated key text
                    if (arrow.keyText && arrow.keyText.active) {
                        arrow.keyText.destroy();
                    }
                }
            });
            this.qteArrows = [];
        }
        
        this.qteInstructions = null;
        this.qteProgressBar = null;
        this.qteTimingTarget = null;
        this.holdBarFill = null;
    }

    handleInput(inputType, inputData) {
        if (!this.isActive) return false;
        
        // Handle QTE input
        if (this.activeQTE && !this.activeQTE.completed) {
            return this.handleQTEInput(inputType, inputData);
        }
        
        // Handle general reeling input
        return this.handleReelingInput(inputType, inputData);
    }

    handleQTEInput(inputType, inputData) {
        const qte = this.activeQTE;
        let success = false;
        
        switch (qte.type) {
            case 'tap':
                if (inputType === 'tap') {
                    qte.currentTaps++;
                    this.updateQTEVisuals(); // Update visual feedback
                    
                    // Flash effect removed to prevent visual problems
                    // if (this.qteTapIndicator && this.qteTapIndicator.active) {
                    //     this.scene.tweens.add({
                    //         targets: this.qteTapIndicator,
                    //         scaleX: 1.5,
                    //         scaleY: 1.5,
                    //         duration: 100,
                    //         yoyo: true,
                    //         ease: 'Power2.easeOut'
                    //     });
                    // }
                    
                    if (qte.currentTaps >= qte.requiredTaps) {
                        success = true;
                    }
                }
                break;
                
            case 'hold':
                if (inputType === 'holdStart') {
                    // Only set holdStartTime if it's not already set (prevent key repeat from overwriting)
                    if (!qte.holdStartTime) {
                    qte.holdStartTime = this.scene.time.now;
                        console.log('ReelingMiniGame: Hold started at time:', qte.holdStartTime);
                        
                    // Visual feedback for hold start
                    if (this.qteTapIndicator && this.qteTapIndicator.active) {
                        this.qteTapIndicator.clear();
                        this.qteTapIndicator.fillStyle(0x00FF00);
                        this.qteTapIndicator.fillRoundedRect(-40, -15, 80, 30, 8);
                        this.qteTapIndicator.lineStyle(2, 0xFFFFFF);
                        this.qteTapIndicator.strokeRoundedRect(-40, -15, 80, 30, 8);
                            console.log('ReelingMiniGame: Visual feedback updated for hold start');
                        }
                    } else {
                        console.log('ReelingMiniGame: Hold start ignored (key repeat) - already holding since:', qte.holdStartTime);
                    }
                } else if (inputType === 'holdEnd') {
                    const currentTime = this.scene.time.now;
                    console.log('ReelingMiniGame: Hold end detected at time:', currentTime);
                    console.log('ReelingMiniGame: Hold start time was:', qte.holdStartTime);
                    
                    if (qte.holdStartTime) {
                        const holdDuration = currentTime - qte.holdStartTime;
                        console.log('ReelingMiniGame: Hold ended. Duration:', holdDuration, 'ms. Required: 1500ms');
                        
                    if (holdDuration >= 1500) { // Fixed 1.5 seconds
                        success = true;
                            console.log('ReelingMiniGame: Hold QTE SUCCESS! Duration was sufficient.');
                    } else {
                        // Failed to hold long enough
                            console.log('ReelingMiniGame: Hold QTE FAILED - too short. Actual:', holdDuration, 'ms');
                            this.completeQTE(false);
                            return true;
                        }
                    } else {
                        console.log('ReelingMiniGame: Hold QTE FAILED - no start time recorded!');
                        this.completeQTE(false);
                        return true;
                    }
                }
                break;
                
            case 'sequence':
                if (inputType === 'direction' && inputData.direction === qte.sequence[qte.currentIndex]) {
                    qte.currentIndex++;
                    this.updateQTEVisuals(); // Update arrow highlighting
                    
                    // Flash effects removed to prevent visual problems
                    // Success flash for correct input
                    // if (this.qteArrows && this.qteArrows[qte.currentIndex - 1] && this.qteArrows[qte.currentIndex - 1].active) {
                    //     const arrow = this.qteArrows[qte.currentIndex - 1];
                    //     // Flash the arrow with a bright green
                    //     this.drawArrow(arrow, arrow.direction, 0x00FF88);
                    //     
                    //     this.scene.tweens.add({
                    //         targets: arrow,
                    //         scaleX: 1.5,
                    //         scaleY: 1.5,
                    //         duration: 150,
                    //         yoyo: true,
                    //         ease: 'Power2.easeOut',
                    //         onComplete: () => {
                    //             // Restore normal color after animation
                    //             if (arrow && arrow.active) {
                    //                 this.drawArrow(arrow, arrow.direction, 0x666666);
                    //             }
                    //         }
                    //     });
                    // }
                    
                    if (qte.currentIndex >= qte.sequence.length) {
                        success = true;
                    }
                } else if (inputType === 'direction') {
                    // Flash effects removed to prevent visual problems
                    // Wrong input, flash red and fail QTE
                    // if (this.qteArrows && this.qteArrows[qte.currentIndex] && this.qteArrows[qte.currentIndex].active) {
                    //     const arrow = this.qteArrows[qte.currentIndex];
                    //     this.drawArrow(arrow, arrow.direction, 0xFF0000);
                    //     
                    //     this.scene.tweens.add({
                    //         targets: arrow,
                    //         scaleX: 1.3,
                    //         scaleY: 1.3,
                    //         duration: 200,
                    //         yoyo: true,
                    //         ease: 'Power2.easeOut'
                    //     });
                    // }
                    this.completeQTE(false);
                    return true;
                }
                break;
                
            case 'timing':
                if (inputType === 'tap') {
                    const currentTime = this.scene.time.now - qte.startTime;
                    const timeDiff = Math.abs(currentTime - qte.targetTime);
                    
                    // Flash effects removed to prevent visual problems
                    // Visual feedback based on timing accuracy
                    // if (this.qteTimingIndicator && this.qteTimingIndicator.active) {
                    //     if (timeDiff <= qte.tolerance) {
                    //         // Perfect timing - green flash
                    //         this.qteTimingIndicator.clear();
                    //         this.qteTimingIndicator.fillStyle(0x00FF00);
                    //         this.qteTimingIndicator.fillRect(-2, -15, 4, 30);
                    //         success = true;
                    //     } else {
                    //         // Bad timing - red flash
                    //         this.qteTimingIndicator.clear();
                    //         this.qteTimingIndicator.fillStyle(0xFF0000);
                    //         this.qteTimingIndicator.fillRect(-2, -15, 4, 30);
                    //     }
                    //     
                    //     this.scene.tweens.add({
                    //         targets: this.qteTimingIndicator,
                    //         scaleX: 2,
                    //         scaleY: 2,
                    //         duration: 200,
                    //         yoyo: true,
                    //         ease: 'Power2.easeOut'
                    //     });
                    // }
                    
                    // Simple success check without visual effects
                    if (timeDiff <= qte.tolerance) {
                        success = true;
                    }
                    
                    if (!success) {
                        this.completeQTE(false);
                        return true;
                    }
                }
                break;
        }
        
        if (success) {
            this.completeQTE(true);
        }
        
        return true;
    }

    handleReelingInput(inputType, inputData) {
        // Handle general reeling controls
        switch (inputType) {
            case 'reel':
                // Increase reel progress but also tension
                this.reelProgress += 0.5;
                this.tension += 2;
                
                // Reduce fish stamina when reeling
                this.fishStamina = Math.max(0, this.fishStamina - 1);
                
                // Show stamina damage popup
                this.showStaminaDamage(1);
                
                console.log('ReelingMiniGame: Reeling - tension increased, fish stamina reduced');
                break;
            case 'release':
                // Reduce tension but slow progress
                this.tension -= 2;
                break;
        }
        
        return true;
    }

    showStaminaDamage(damage) {
        // Create floating damage text
        const damageText = this.scene.add.text(
            this.fishPosition.x + Phaser.Math.Between(-20, 20),
            this.fishPosition.y - 20,
            `-${damage}`,
            {
                fontSize: '16px',
                fill: '#e74c3c',
                fontFamily: 'Arial',
                fontWeight: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        damageText.setOrigin(0.5).setDepth(300);
        
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 30,
            alpha: 0,
            duration: 800,
            ease: 'Power2.easeOut',
            onComplete: () => {
                damageText.destroy();
            }
        });
    }

    completeQTE(success) {
        if (!this.activeQTE) return;
        
        this.activeQTE.completed = true;
        this.activeQTE.success = success;
        
        // Emit QTE completion event for debug tool
        this.scene.events.emit('fishing:qteComplete', {
            qte: this.activeQTE,
            success: success
        });
        
        // Play audio feedback for QTE result
        if (success) {
            this.audioManager?.playSFX('qte_success');
        } else {
            this.audioManager?.playSFX('qte_fail');
        }
        
        // Show success/failure feedback
        if (success) {
            this.qteSuccess++;
            // Reduce tension on successful QTE
            this.tension = Math.max(0, this.tension - 10);
            console.log(`ReelingMiniGame: QTE success! Tension reduced.`);
            
            // Success visual feedback
            if (this.qteContainer) {
                this.scene.tweens.add({
                    targets: this.qteContainer,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 200,
                    yoyo: true,
                    ease: 'Power2.easeOut',
                    onComplete: () => {
                        this.destroyQTEVisuals();
                    }
                });
            }
        } else {
            this.qteFails++;
            // Increase tension on failed QTE
            this.tension = Math.min(100, this.tension + 15);
            console.log(`ReelingMiniGame: QTE failed! Tension increased.`);
            
            // Failure visual feedback - flash effects removed to prevent visual problems
            if (this.qteContainer) {
                this.scene.tweens.add({
                    targets: this.qteContainer,
                    scaleX: 0.8,
                    scaleY: 0.8,
                    duration: 200,
                    yoyo: true,
                    ease: 'Power2.easeIn',
                    onComplete: () => {
                        this.destroyQTEVisuals();
                    }
                });
            }
        }
        
        // Remove QTE and schedule next one
        this.activeQTE = null;
        this.qteCount++;
        
        // Schedule next QTE if game is still active
        if (this.isActive && this.qteCount < this.maxQTEs) {
            this.scheduleNextQTE();
        }
    }

    // Debug tool integration methods
    /**
     * Force trigger a specific QTE type for debugging
     * @param {string} qteType - The type of QTE to trigger ('tap', 'hold', 'sequence', 'timing')
     * @param {number} difficulty - Difficulty level (1-5)
     */
    debugTriggerQTE(qteType, difficulty = 3) {
        if (!this.isActive) {
            console.warn('ReelingMiniGame: Cannot trigger debug QTE - game not active');
            return false;
        }
        
        if (this.activeQTE) {
            console.warn('ReelingMiniGame: Cannot trigger debug QTE - QTE already active');
            return false;
        }
        
        console.log(`ReelingMiniGame: Debug triggering QTE - ${qteType}, difficulty ${difficulty}`);
        
        // Clear any existing QTE timer
        if (this.qteTimer) {
            this.qteTimer.destroy();
            this.qteTimer = null;
        }
        
        // Create debug QTE
        this.activeQTE = {
            type: qteType,
            difficulty: difficulty,
            timeLimit: qteType === 'hold' ? 3000 : (3000 - (difficulty * 500)),
            startTime: this.scene.time.now,
            completed: false,
            success: false,
            isDebugQTE: true // Mark as debug QTE
        };
        
        // Generate QTE-specific data
        switch (qteType) {
            case 'tap':
                this.activeQTE.requiredTaps = difficulty + 2;
                this.activeQTE.currentTaps = 0;
                break;
            case 'hold':
                this.activeQTE.holdDuration = 1500;
                this.activeQTE.holdStartTime = null;
                break;
            case 'sequence':
                this.activeQTE.sequence = this.generateInputSequence(difficulty + 2);
                this.activeQTE.currentIndex = 0;
                break;
            case 'timing':
                this.activeQTE.targetTime = this.activeQTE.timeLimit * 0.7;
                this.activeQTE.tolerance = 200;
                break;
        }
        
        // Create visual QTE elements
        this.createQTEVisuals();
        
        // Emit QTE start event for debug tool
        this.scene.events.emit('fishing:qteStart', {
            qte: this.activeQTE
        });
        
        // Set QTE timeout
        this.scene.time.delayedCall(this.activeQTE.timeLimit, () => {
            if (this.activeQTE && !this.activeQTE.completed) {
                this.completeQTE(false);
            }
        });
        
        return true;
    }

    /**
     * Force trigger a specific fish struggle pattern for debugging
     * @param {string} struggleType - The struggle pattern to trigger
     * @param {number} intensity - Struggle intensity (1-10)
     */
    debugTriggerStruggle(struggleType, intensity = 5) {
        if (!this.isActive) {
            console.warn('ReelingMiniGame: Cannot trigger debug struggle - game not active');
            return false;
        }
        
        console.log(`ReelingMiniGame: Debug triggering struggle - ${struggleType}, intensity ${intensity}`);
        
        // Clear any existing struggle timer
        if (this.struggleTimer) {
            this.struggleTimer.destroy();
            this.struggleTimer = null;
        }
        
        // Set struggle state
        this.fishStruggling = true;
        this.struggleType = struggleType;
        this.struggleIntensity = intensity;
        this.isDebugStruggle = true;
        
        // Emit struggle event for debug tool
        this.scene.events.emit('fishing:fishStruggle', {
            struggleType: struggleType,
            intensity: intensity
        });
        
        // Start struggle-specific behavior
        this.applyStruggleEffects(struggleType, intensity);
        
        // Schedule QTE based on struggle type
        const qteDelay = Math.max(500, 2000 - (intensity * 200)); // Faster QTEs for higher intensity
        this.scene.time.delayedCall(qteDelay, () => {
            if (this.isActive && !this.activeQTE) {
                const qteType = this.getQTETypeForStruggle(struggleType);
                this.debugTriggerQTE(qteType, Math.min(5, Math.max(1, Math.floor(intensity / 2))));
            }
        });
        
        // End struggle after duration
        const struggleDuration = 3000 + (intensity * 500); // Longer struggles for higher intensity
        this.scene.time.delayedCall(struggleDuration, () => {
            if (this.isDebugStruggle) {
                this.endDebugStruggle();
            }
        });
        
        return true;
    }

    /**
     * Apply struggle-specific effects for debugging
     * @param {string} struggleType - The struggle pattern
     * @param {number} intensity - Struggle intensity
     */
    applyStruggleEffects(struggleType, intensity) {
        const baseEffect = intensity * 2;
        
        switch (struggleType) {
            case 'dash':
                // Sudden tension spike
                this.tension += baseEffect * 2;
                this.fishPosition.x += intensity * 10; // Move fish quickly
                break;
            case 'thrash':
                // Erratic tension changes
                this.tension += baseEffect;
                // Start erratic movement
                this.startErraticMovement(intensity);
                break;
            case 'dive':
                // Gradual tension increase
                this.tension += baseEffect * 1.5;
                this.fishPosition.y += intensity * 5; // Move fish down
                break;
            case 'surface':
                // Reduce tension temporarily
                this.tension -= baseEffect;
                this.fishPosition.y -= intensity * 5; // Move fish up
                break;
            case 'circle':
                // Moderate tension with circular movement
                this.tension += baseEffect;
                this.startCircularMovement(intensity);
                break;
            case 'jump':
                // Brief high tension spike
                this.tension += baseEffect * 3;
                this.createJumpEffect(intensity);
                break;
            case 'roll':
                // Rolling tension pattern
                this.startRollingTension(intensity);
                break;
            case 'shake':
                // Quick tension fluctuations
                this.startShakePattern(intensity);
                break;
            case 'pull':
                // Steady high tension
                this.tension += baseEffect * 1.5;
                this.reelProgress -= intensity; // Pull line out
                break;
            case 'spiral':
                // Complex movement with moderate tension
                this.tension += baseEffect;
                this.startSpiralMovement(intensity);
                break;
        }
        
        // Clamp tension to valid range
        this.tension = Phaser.Math.Clamp(this.tension, 0, 100);
        
        console.log(`ReelingMiniGame: Applied ${struggleType} effects - tension: ${this.tension}`);
    }

    /**
     * Get appropriate QTE type for struggle pattern
     * @param {string} struggleType - The struggle pattern
     * @returns {string} QTE type
     */
    getQTETypeForStruggle(struggleType) {
        const qteMap = {
            'dash': 'tap',       // Rapid tapping to counter burst
            'thrash': 'sequence', // Sequence to counter erratic movement
            'dive': 'timing',    // Timing to counter dive momentum
            'surface': 'timing', // Timing to maintain control
            'circle': 'hold',    // Hold to maintain steady pressure
            'jump': 'timing',    // Timing to react to jump
            'roll': 'sequence',  // Sequence to counter rolling
            'shake': 'tap',      // Rapid tapping to counter shaking
            'pull': 'hold',      // Hold to counter steady pull
            'spiral': 'sequence' // Sequence to counter complex movement
        };
        
        return qteMap[struggleType] || 'tap';
    }

    /**
     * End debug struggle state
     */
    endDebugStruggle() {
        this.fishStruggling = false;
        this.struggleType = null;
        this.isDebugStruggle = false;
        
        // Stop all struggle-related movement patterns
        this.stopAllMovementPatterns();
        
        console.log('ReelingMiniGame: Debug struggle ended');
    }

    /**
     * Start erratic movement pattern
     * @param {number} intensity - Movement intensity
     */
    startErraticMovement(intensity) {
        this.erraticMovementTimer = this.scene.time.addEvent({
            delay: 200,
            callback: () => {
                if (this.fishStruggling && this.struggleType === 'thrash') {
                    this.fishPosition.x += Phaser.Math.Between(-intensity * 5, intensity * 5);
                    this.fishPosition.y += Phaser.Math.Between(-intensity * 3, intensity * 3);
                }
            },
            repeat: 10,
            callbackScope: this
        });
    }

    /**
     * Start circular movement pattern
     * @param {number} intensity - Movement intensity
     */
    startCircularMovement(intensity) {
        let angle = 0;
        const radius = intensity * 3;
        const centerX = this.fishPosition.x;
        const centerY = this.fishPosition.y;
        
        this.circularMovementTimer = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                if (this.fishStruggling && this.struggleType === 'circle') {
                    angle += 0.2;
                    this.fishPosition.x = centerX + Math.cos(angle) * radius;
                    this.fishPosition.y = centerY + Math.sin(angle) * radius;
                }
            },
            repeat: 30,
            callbackScope: this
        });
    }

    /**
     * Create jump effect
     * @param {number} intensity - Jump intensity
     */
    createJumpEffect(intensity) {
        const originalY = this.fishPosition.y;
        const jumpHeight = intensity * 8;
        
        this.scene.tweens.add({
            targets: this.fishPosition,
            y: originalY - jumpHeight,
            duration: 300,
            ease: 'Power2.easeOut',
            yoyo: true,
            onComplete: () => {
                this.fishPosition.y = originalY;
            }
        });
    }

    /**
     * Start rolling tension pattern
     * @param {number} intensity - Pattern intensity
     */
    startRollingTension(intensity) {
        let tensionBase = this.tension;
        let phase = 0;
        
        this.rollingTensionTimer = this.scene.time.addEvent({
            delay: 300,
            callback: () => {
                if (this.fishStruggling && this.struggleType === 'roll') {
                    phase += 0.5;
                    this.tension = tensionBase + Math.sin(phase) * intensity * 2;
                    this.tension = Phaser.Math.Clamp(this.tension, 0, 100);
                }
            },
            repeat: 10,
            callbackScope: this
        });
    }

    /**
     * Start shake pattern
     * @param {number} intensity - Shake intensity
     */
    startShakePattern(intensity) {
        this.shakePatternTimer = this.scene.time.addEvent({
            delay: 150,
            callback: () => {
                if (this.fishStruggling && this.struggleType === 'shake') {
                    this.tension += Phaser.Math.Between(-intensity, intensity * 2);
                    this.tension = Phaser.Math.Clamp(this.tension, 0, 100);
                    
                    // Visual shake effect
                    this.fishPosition.x += Phaser.Math.Between(-2, 2);
                    this.fishPosition.y += Phaser.Math.Between(-2, 2);
            }
            },
            repeat: 15,
            callbackScope: this
        });
        }
        
    /**
     * Start spiral movement pattern
     * @param {number} intensity - Movement intensity
     */
    startSpiralMovement(intensity) {
        let angle = 0;
        let radius = intensity;
        const centerX = this.fishPosition.x;
        const centerY = this.fishPosition.y;
        
        this.spiralMovementTimer = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                if (this.fishStruggling && this.struggleType === 'spiral') {
                    angle += 0.3;
                    radius += 0.5;
                    this.fishPosition.x = centerX + Math.cos(angle) * radius;
                    this.fishPosition.y = centerY + Math.sin(angle) * radius;
                }
            },
            repeat: 25,
            callbackScope: this
        });
    }

    /**
     * Stop all movement patterns
     */
    stopAllMovementPatterns() {
        [
            'erraticMovementTimer',
            'circularMovementTimer', 
            'rollingTensionTimer',
            'shakePatternTimer',
            'spiralMovementTimer'
        ].forEach(timerName => {
            if (this[timerName]) {
                this[timerName].destroy();
                this[timerName] = null;
            }
        });
    }

    /**
     * Get current debug state for debug tool
     * @returns {Object} Debug state information
     */
    getDebugState() {
        return {
            isActive: this.isActive,
            tension: this.tension,
            fishStamina: this.fishStamina,
            reelProgress: this.reelProgress,
            lineIntegrity: this.lineIntegrity,
            fishStruggling: this.fishStruggling,
            struggleType: this.struggleType,
            activeQTE: this.activeQTE ? {
                type: this.activeQTE.type,
                difficulty: this.activeQTE.difficulty,
                timeRemaining: this.activeQTE.timeLimit - (this.scene.time.now - this.activeQTE.startTime),
                completed: this.activeQTE.completed,
                success: this.activeQTE.success
            } : null,
            qteStats: {
                success: this.qteSuccess,
                fails: this.qteFails,
                total: this.qteSuccess + this.qteFails
            },
            fishProperties: this.fishProperties
        };
    }

    checkWinLoseConditions() {
        // Lose condition: Line breaks
        if (this.lineIntegrity <= 0) {
            this.complete(false, 'line_break');
            return;
        }
        
        // Win condition: Fish stamina depleted OR reel progress complete
        if (this.fishStamina <= 0 || this.reelProgress >= 100) {
            // Fish caught! Call the fishCaught method
            this.fishCaught();
            return;
        }
        
        // Lose condition: Fish escapes (very rare, based on elusiveness)
        const elusiveness = this.selectedFish?.elusiveness || this.fishProperties?.elusiveness || 5;
        if (this.fishStruggling && Math.random() < (elusiveness / 1000)) {
            this.complete(false, 'fish_escape');
            return;
        }
    }

    complete(success, result, fishData, stats) {
        // Prevent multiple completions
        if (this.isCompleted) {
            console.log('ReelingMiniGame: Already completed, ignoring duplicate completion call');
            return;
        }
        
        this.isCompleted = true;
        
        // Clean up timers first to prevent any further calls
        try {
            if (this.reelingTimer) {
                this.reelingTimer.destroy();
                this.reelingTimer = null;
            }
            if (this.struggleTimer) {
                this.struggleTimer.destroy();
                this.struggleTimer = null;
            }
            if (this.qteTimer) {
                this.qteTimer.destroy();
                this.qteTimer = null;
            }
        } catch (error) {
            console.warn('ReelingMiniGame: Error cleaning up timers:', error);
        }
        
        console.log(`ReelingMiniGame: ${success ? 'Success' : 'Failed'} - ${result}`);
        
        // Clean up input handlers to prevent interference with main game controls
        try {
            if (this.scene.input) {
                // Remove only our specific handlers instead of all listeners
                if (this.mouseHandler) {
                    this.scene.input.off('pointerdown', this.mouseHandler);
                    this.mouseHandler = null;
                }
                
                if (this.scene.input.keyboard) {
                    if (this.keyDownHandler) {
                        this.scene.input.keyboard.off('keydown', this.keyDownHandler);
                        this.keyDownHandler = null;
                    }
                    if (this.keyUpHandler) {
                        this.scene.input.keyboard.off('keyup', this.keyUpHandler);
                        this.keyUpHandler = null;
                    }
                }
                
                // Remove document listener
                if (this.keyHandler && document) {
                    document.removeEventListener('keydown', this.keyHandler);
                    this.keyHandler = null;
                }
            }
        } catch (error) {
            console.warn('ReelingMiniGame: Error cleaning up input handlers:', error);
        }
        
        // Prepare the final stats object with safe defaults
        const finalStats = stats || {
            tension: this.tension || 0,
            lineIntegrity: this.lineIntegrity || 100,
            reelProgress: this.reelProgress || 0,
            fishStamina: this.fishStamina || 100,
            qteSuccess: this.qteSuccess || 0,
            qteFails: this.qteFails || 0
        };
        
        // Ensure fishData has safe defaults
        const safeFishData = fishData || {
            name: 'Unknown Fish',
            weight: 2.5,
            rarity: 1,
            value: 100
        };
        
        // Emit completion event with error handling
        try {
            this.scene.events.emit('fishing:reelComplete', {
                success: success,
                reason: result,
                fish: safeFishData,
                finalStats: finalStats
            });
        } catch (error) {
            console.error('ReelingMiniGame: Error emitting completion event:', error);
        }
    }

    destroy() {
        console.log('ReelingMiniGame: Destroying minigame');
        
        this.isActive = false;
        
        // Clear all timers
        if (this.struggleTimer) {
            this.struggleTimer.destroy();
            this.struggleTimer = null;
        }
        
        if (this.qteTimer) {
            this.qteTimer.destroy();
            this.qteTimer = null;
        }
        
        if (this.tensionTimer) {
            this.tensionTimer.destroy();
            this.tensionTimer = null;
        }
        
        if (this.celebrationCloseTimer) {
            this.celebrationCloseTimer.destroy();
            this.celebrationCloseTimer = null;
        }
        
        // Clear input handling more thoroughly but only our own handlers
        if (this.scene.input) {
            // Remove only our specific handlers instead of all listeners
            if (this.mouseHandler) {
                this.scene.input.off('pointerdown', this.mouseHandler);
                this.mouseHandler = null;
            }
        }
        
        // Clean up DOM event listeners
        if (this.keyDownHandler && document) {
            document.removeEventListener('keydown', this.keyDownHandler);
            this.keyDownHandler = null;
        }
        
        if (this.keyUpHandler && document) {
            document.removeEventListener('keyup', this.keyUpHandler);
            this.keyUpHandler = null;
        }
        
        // Clean up global click test listener
        if (this.globalClickTest && document) {
            document.removeEventListener('click', this.globalClickTest);
            this.globalClickTest = null;
            console.log('ReelingMiniGame: Global click test listener removed');
        }
        
        console.log('ReelingMiniGame: Input event listeners cleaned up');
        
        // Clear tweens first to prevent issues during destruction
        if (this.scene.tweens) {
            this.scene.tweens.killTweensOf(this);
            if (this.fishNameText) {
                this.scene.tweens.killTweensOf(this.fishNameText);
            }
            if (this.celebrationContainer) {
                this.scene.tweens.killTweensOf(this.celebrationContainer);
                // Kill tweens of all children in celebration container
                this.celebrationContainer.list.forEach(child => {
                    this.scene.tweens.killTweensOf(child);
                });
            }
        }
        
        // Destroy celebration container first (if it exists)
        if (this.celebrationContainer) {
            try {
                this.celebrationContainer.destroy();
                this.celebrationContainer = null;
            } catch (error) {
                console.warn('ReelingMiniGame: Error destroying celebration container:', error);
            }
        }
        
        // Destroy visual elements
        if (this.fishGraphic) {
            this.fishGraphic.destroy();
            this.fishGraphic = null;
        }
        
        if (this.fishingLine) {
            this.fishingLine.destroy();
            this.fishingLine = null;
        }
        
        if (this.progressContainer) {
            this.progressContainer.destroy();
            this.progressContainer = null;
        }
        
        if (this.staminaBarBg) {
            this.staminaBarBg.destroy();
            this.staminaBarBg = null;
        }
        
        if (this.staminaBar) {
            this.staminaBar.destroy();
            this.staminaBar = null;
        }
        
        if (this.fishNameText) {
            this.fishNameText.destroy();
            this.fishNameText = null;
        }
        
        if (this.tensionMeterContainer) {
            this.tensionMeterContainer.destroy();
            this.tensionMeterContainer = null;
        }
        
        if (this.uiContainer) {
            this.uiContainer.destroy();
            this.uiContainer = null;
        }
        
        // Destroy QTE visuals
        this.destroyQTEVisuals();
        
        // Clear particle systems
        if (this.particleSystems) {
            this.particleSystems.forEach(system => {
                if (system && system.destroy) {
                    system.destroy();
                }
            });
            this.particleSystems = [];
        }
        
        // Clear splash effects
        if (this.splashEffects) {
            this.splashEffects.forEach(effect => {
                if (effect && effect.destroy) {
                    effect.destroy();
                }
            });
            this.splashEffects = [];
        }
        
        console.log('ReelingMiniGame: Cleanup completed');
    }

    fishCaught() {
        // Prevent multiple calls to fishCaught with enhanced checking
        if (!this.isActive || this.fishCaughtCalled || this.isCompleted) {
            console.log('ReelingMiniGame: Preventing duplicate fishCaught call - active:', this.isActive, 'fishCaughtCalled:', this.fishCaughtCalled, 'isCompleted:', this.isCompleted);
            return;
        }
        
        this.fishCaughtCalled = true;
        this.isActive = false; // Immediately stop the game loop to prevent multiple calls
        
        console.log('ReelingMiniGame: Fish caught successfully!');
        
        // Calculate actual weight based on fish properties
        let actualWeight = 2.5; // Default weight
        
        try {
            if (this.selectedFish && this.gameState?.fishDatabase) {
                // Use FishDatabase to calculate weight with variation
                actualWeight = this.gameState.fishDatabase.calculateFishWeight(this.selectedFish);
            } else if (this.fishProperties) {
                // Fallback to fish properties
                actualWeight = this.fishProperties.weight || 2.5;
            }
        } catch (error) {
            // Only log unexpected errors, not just missing methods
            if (error.name !== 'TypeError') {
                console.warn('ReelingMiniGame: Unexpected error calculating fish weight:', error);
            }
            actualWeight = 2.5;
        }
        
        // Determine if it was a perfect catch based on QTE performance
        const perfectCatch = this.qteSuccess > 0 && this.qteFails === 0;
        
        // Create comprehensive fish data for GameState with proper validation
        const fishData = {
            fishId: this.fishId || this.selectedFish?.id || 'unknown',
            name: this.selectedFish?.name || this.fishProperties?.name || 'Unknown Fish',
            weight: actualWeight,
            rarity: Math.min(Math.max(1, this.selectedFish?.rarity || 1), 6), // Ensure rarity is between 1-6
            value: Math.max(1, this.selectedFish?.coinValue || 100), // Ensure positive value
            isPerfectCatch: perfectCatch,
            qtePerformance: {
                successes: this.qteSuccess || 0,
                failures: this.qteFails || 0,
                totalQTEs: (this.qteSuccess || 0) + (this.qteFails || 0)
            },
            catchStats: {
                finalTension: this.tension || 0,
                lineIntegrity: this.lineIntegrity || 100,
                timeToReel: this.scene.time.now - (this.startTime || this.scene.time.now)
            }
        };
        
        console.log('ReelingMiniGame: Fish data being processed:', fishData);
        console.log('ReelingMiniGame: Selected fish original data:', this.selectedFish);
        
        // Let GameState handle the catch with error handling
        let catchResult;
        try {
            catchResult = this.gameState.catchFish(fishData, perfectCatch);
        } catch (error) {
            console.error('ReelingMiniGame: Error in GameState.catchFish:', error);
            console.error('ReelingMiniGame: Error stack:', error.stack);
            
            // Create fallback catch result with proper structure
            catchResult = {
                success: true,
                fish: {
                    id: fishData.fishId,
                    name: fishData.name,
                    rarity: fishData.rarity,
                    weight: fishData.weight,
                    value: fishData.value
                },
                weight: fishData.weight,
                rewards: { 
                    coins: fishData.value, 
                    experience: Math.max(1, fishData.rarity * 10) 
                },
                isFirstCatch: false,
                isRecord: false,
                isPerfectCatch: perfectCatch
            };
        }
        
        // Validate catch result structure
        if (!catchResult || typeof catchResult !== 'object') {
            console.error('ReelingMiniGame: Invalid catch result from GameState');
            catchResult = {
                success: true,
                fish: fishData,
                weight: fishData.weight,
                rewards: { coins: fishData.value, experience: 10 },
                isFirstCatch: false,
                isRecord: false,
                isPerfectCatch: perfectCatch
            };
        }
        
        // Award perfect reel bonus if applicable (silent fallback)
        try {
            if (perfectCatch && this.gameState?.trackPerfectReel) {
                this.gameState.trackPerfectReel();
            }
        } catch (error) {
            // Only log unexpected errors, not just missing methods
            if (error.name !== 'TypeError') {
                console.warn('ReelingMiniGame: Unexpected error tracking perfect reel:', error);
            }
        }
        
        // Show catch celebration with error handling
        try {
            this.showCatchCelebration(catchResult);
        } catch (error) {
            // Only log if it's a critical error
            console.warn('ReelingMiniGame: Could not show celebration, continuing...:', error.message);
        }
        
        // Complete the minigame with proper fish data structure
        this.scene.time.delayedCall(2000, () => {
            try {
                // Ensure fish data has proper structure for completion
                const completionFishData = catchResult.fish || fishData;
                
                // Pass the catch result and fish data properly to complete
                this.complete(true, 'fish_caught', completionFishData, {
                    tension: this.tension || 0,
                    lineIntegrity: this.lineIntegrity || 100,
                    reelProgress: this.reelProgress || 100,
                    fishStamina: this.fishStamina || 0,
                    qteSuccess: this.qteSuccess || 0,
                    qteFails: this.qteFails || 0,
                    catchResult: catchResult // Include the full catch result
                });
            } catch (error) {
                console.error('ReelingMiniGame: Error completing minigame:', error);
                console.error('ReelingMiniGame: Error stack:', error.stack);
                
                // Fallback completion with minimal data
                try {
                    this.complete(true, 'fish_caught', fishData, {
                        catchResult: catchResult
                    });
                } catch (fallbackError) {
                    console.error('ReelingMiniGame: Fallback completion also failed:', fallbackError);
                    // Just emit the completion event manually
                    try {
                        this.scene.events.emit('fishing:reelComplete', {
                            success: true,
                            reason: 'fish_caught',
                            fish: fishData,
                            finalStats: {}
                        });
                    } catch (emitError) {
                        console.error('ReelingMiniGame: Manual event emission failed:', emitError);
                    }
                }
            }
        });
    }
    
    showCatchCelebration(catchResult) {
        if (!catchResult || !catchResult.fish) {
            // Silent fallback - celebration is optional
            return;
        }
        
        const fish = catchResult.fish;
        const weight = catchResult.weight || 0;
        const rewards = catchResult.rewards || { coins: 0, experience: 0 };
        
        if (!fish.name) fish.name = 'Unknown Fish';
        if (!fish.rarity || fish.rarity < 1) fish.rarity = 1;
        const displayRarity = Math.min(fish.rarity, 6);
        
        this.celebrationContainer = this.scene.add.container(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2
        );
        this.celebrationContainer.setDepth(3000);
        
        // Background panel
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x2d5016, 0.95);
        bg.fillRoundedRect(-200, -150, 400, 300, 15);
        bg.lineStyle(3, 0x4a7c59);
        bg.strokeRoundedRect(-200, -150, 400, 300, 15);
        this.celebrationContainer.add(bg);
        
        // Title
        const title = this.scene.add.text(0, -120, 'FISH CAUGHT!', {
            fontSize: '32px',
            fill: '#ffff00',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        });
        title.setOrigin(0.5);
        this.celebrationContainer.add(title);
        
        // Fish name with rarity color
        const rarityColors = ['#8B4513', '#4169E1', '#32CD32', '#FF6347', '#FFD700', '#9370DB'];
        const rarityColor = rarityColors[Math.min(displayRarity - 1, rarityColors.length - 1)];
        const fishName = this.scene.add.text(0, -60, fish.name, {
            fontSize: '24px',
            fill: rarityColor,
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        });
        fishName.setOrigin(0.5);
        this.celebrationContainer.add(fishName);
        
        // Weight
        const weightText = this.scene.add.text(0, -20, `Weight: ${weight.toFixed(1)} kg`, {
            fontSize: '18px',
            fill: '#ffffff',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        });
        weightText.setOrigin(0.5);
        this.celebrationContainer.add(weightText);
        
        let badgeY = 20;
        const createBadge = (text, color, yOffset) => {
            const badge = this.scene.add.text(0, yOffset, text, {
                fontSize: '16px',
                fill: color,
                fontWeight: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            });
            badge.setOrigin(0.5);
            this.celebrationContainer.add(badge);
            return badge;
        };
        
        if (catchResult.isFirstCatch) {
            createBadge('⭐ FIRST CATCH! ⭐', '#ffff00', badgeY);
            badgeY += 30;
        }
        if (catchResult.isRecord) {
            createBadge('🏆 NEW RECORD! 🏆', '#9370DB', badgeY);
            badgeY += 30;
        }
        if (catchResult.isPerfectCatch) {
            createBadge('✨ PERFECT CATCH! ✨', '#00ffff', badgeY);
            badgeY += 30;
        }
        
        // Rewards
        const coinsText = this.scene.add.text(-80, 90, `+${rewards.coins || 0} 🪙`, {
            fontSize: '18px',
            fill: '#ffff00',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        });
        coinsText.setOrigin(0.5);
        this.celebrationContainer.add(coinsText);
        
        const expText = this.scene.add.text(80, 90, `+${rewards.experience || 0} XP`, {
            fontSize: '18px',
            fill: '#00ff00',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        });
        expText.setOrigin(0.5);
        this.celebrationContainer.add(expText);
        
        // Animate celebration
        this.celebrationContainer.setScale(0);
        this.scene.tweens.add({
            targets: this.celebrationContainer,
            scaleX: 1,
            scaleY: 1,
            duration: 500,
            ease: 'Back.easeOut'
        });
        
        const titleTween = this.scene.tweens.add({
            targets: title,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Auto-close celebration after 4 seconds to prevent getting stuck
        this.celebrationCloseTimer = this.scene.time.delayedCall(4000, () => {
            console.log('ReelingMiniGame: Auto-closing celebration dialog');
            
            // Stop the title animation
            if (titleTween) {
                titleTween.destroy();
            }
            
            // Fade out and destroy celebration
            if (this.celebrationContainer && this.celebrationContainer.active) {
                this.scene.tweens.add({
                    targets: this.celebrationContainer,
                    alpha: 0,
                    scaleX: 0.8,
                    scaleY: 0.8,
                    duration: 300,
                    ease: 'Sine.easeIn',
                    onComplete: () => {
                        if (this.celebrationContainer) {
                            this.celebrationContainer.destroy();
                            this.celebrationContainer = null;
                        }
                    }
                });
            }
        });
        
        // Make celebration clickable to close early
        bg.setInteractive();
        bg.on('pointerdown', () => {
            console.log('ReelingMiniGame: Celebration clicked, closing early');
            
            // Cancel auto-close timer
            if (this.celebrationCloseTimer) {
                this.celebrationCloseTimer.destroy();
                this.celebrationCloseTimer = null;
            }
            
            // Stop the title animation
            if (titleTween) {
                titleTween.destroy();
            }
            
            // Immediate close
            if (this.celebrationContainer && this.celebrationContainer.active) {
                this.celebrationContainer.destroy();
                this.celebrationContainer = null;
            }
        });
    }

    updateHoldProgress() {
        if (!this.activeQTE || this.activeQTE.type !== 'hold' || !this.holdBarFill) return;
        
        this.holdBarFill.clear();
        
        if (this.activeQTE.holdStartTime) {
            const holdTime = this.scene.time.now - this.activeQTE.holdStartTime;
            const progress = Math.min(holdTime / 1500, 1); // 1.5 seconds
            const barWidth = 150 * progress;
            
            // Change color based on progress
            let barColor = 0xf39c12; // Orange (warning)
            if (progress >= 1) {
                barColor = 0x27ae60; // Green (success)
            } else if (progress >= 0.5) {
                barColor = 0x3498db; // Blue (info)
            }
            
            this.holdBarFill.fillStyle(barColor);
            this.holdBarFill.fillRect(-75, 20, barWidth, 8);
            
            // Debug logging every 250ms to track progress
            if (Math.floor(holdTime / 250) !== Math.floor((holdTime - 50) / 250)) {
                console.log(`ReelingMiniGame: Hold progress: ${(progress * 100).toFixed(1)}% (${holdTime.toFixed(0)}ms / 1500ms)`);
            }
            
            // Visual feedback when complete
            if (progress >= 1 && !this.holdCompleted) {
                this.holdCompleted = true;
                console.log('ReelingMiniGame: Hold duration reached! Player can release now.');
                
                // Flash the indicator green to show completion
                if (this.qteTapIndicator && this.qteTapIndicator.active) {
                    this.scene.tweens.add({
                        targets: this.qteTapIndicator,
                        alpha: 0.5,
                        duration: 150,
                        yoyo: true,
                        repeat: 3,
                        ease: 'Power2'
                    });
                }
            }
        } else {
            // No hold started yet - draw empty bar
            this.holdBarFill.fillStyle(0x666666, 0.5);
            this.holdBarFill.fillRect(-75, 20, 150, 8);
        }
    }

    updateBossMechanics() {
        if (!this.isBoss) return;
        
        // Update boss phase based on stamina percentage
        const staminaPercent = (this.fishStamina / this.maxFishStamina) * 100;
        let newPhase = 1;
        
        if (staminaPercent <= 25) {
            newPhase = 4; // Final phase
        } else if (staminaPercent <= 50) {
            newPhase = 3;
        } else if (staminaPercent <= 75) {
            newPhase = 2;
        }
        
        // Phase transition effects
        if (newPhase !== this.bossPhase) {
            this.bossPhase = newPhase;
            this.onBossPhaseChange();
        }
        
        // Boss special attacks
        this.bossSpecialAttackTimer += 100; // Update every 100ms
        if (this.bossSpecialAttackTimer >= this.bossSpecialAttackCooldown) {
            this.triggerBossSpecialAttack();
            this.bossSpecialAttackTimer = 0;
        }
        
        // Boss-specific mechanics based on fish type
        this.updateBossSpecificMechanics();
    }

    onBossPhaseChange() {
        console.log(`ReelingMiniGame: Boss phase changed to ${this.bossPhase}`);
        
        // Visual effects for phase change
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(500, 5);
        }
        
        // Increase difficulty in later phases
        if (this.bossPhase >= 3) {
            this.baseTensionIncrease *= 1.5;
        }
        if (this.bossPhase === 4) {
            this.baseTensionIncrease *= 2;
            // Final phase: more aggressive QTE scheduling
            this.qteTimer?.destroy();
            this.scheduleNextQTE();
        }
    }

    triggerBossSpecialAttack() {
        if (!this.isBoss || !this.selectedFish) return;
        
        const fishId = this.selectedFish.id;
        
        switch (fishId) {
            case 'giant_bass':
                this.bassFuryAttack();
                break;
            case 'giant_pike':
                this.pikeAmbushAttack();
                break;
            case 'electric_eel':
                this.eelShockAttack();
                break;
            case 'coelacanth':
                this.ancientWisdomAttack();
                break;
            case 'giant_marlin':
                this.marlinSpeedAttack();
                break;
            case 'tiger_shark':
                this.sharkFrenzyAttack();
                break;
            case 'whale':
                this.whaleDepthAttack();
                break;
            case 'megalodon':
                this.megalodonDestroyerAttack();
                break;
            case 'mosasaurus':
                this.mosasaurusAncientAttack();
                break;
            case 'leviathan':
                this.leviathanChaosAttack();
                break;
        }
    }

    updateBossSpecificMechanics() {
        if (!this.isBoss || !this.selectedFish) return;
        
        const fishId = this.selectedFish.id;
        
        // Continuous boss-specific effects
        switch (fishId) {
            case 'coelacanth':
                // Regenerate stamina slowly
                if (Math.random() < 0.01) { // 1% chance per update
                    this.fishStamina = Math.min(this.maxFishStamina, this.fishStamina + 5);
                }
                break;
            case 'whale':
                // Slower reel progress due to massive size
                this.reelProgress *= 0.5;
                break;
            case 'electric_eel':
                // Random tension spikes
                if (Math.random() < 0.02) { // 2% chance per update
                    this.tension = Math.min(100, this.tension + 20);
                }
                break;
        }
    }

    // Boss Special Attack Methods
    bassFuryAttack() {
        console.log('ReelingMiniGame: Giant Bass - Bass Fury Attack!');
        this.tension = Math.min(100, this.tension + 30);
        this.fishStruggling = true;
        this.struggleType = 'jump';
        
        // Force a QTE
        this.scene.time.delayedCall(500, () => {
            if (!this.activeQTE) {
                this.debugTriggerQTE('timing', 4);
            }
        });
    }

    pikeAmbushAttack() {
        console.log('ReelingMiniGame: Giant Pike - Ambush Attack!');
        // Sudden line damage
        this.lineIntegrity = Math.max(0, this.lineIntegrity - 15);
        this.tension = Math.min(100, this.tension + 25);
        
        // Force sequence QTE
        this.scene.time.delayedCall(300, () => {
            if (!this.activeQTE) {
                this.debugTriggerQTE('sequence', 5);
            }
        });
    }

    eelShockAttack() {
        console.log('ReelingMiniGame: Electric Eel - Shock Attack!');
        // Control reversal effect (simulated by making QTEs harder)
        this.controlsReversed = true;
        this.tension = Math.min(100, this.tension + 20);
        
        // Remove reversal after 5 seconds
        this.scene.time.delayedCall(5000, () => {
            this.controlsReversed = false;
        });
    }

    ancientWisdomAttack() {
        console.log('ReelingMiniGame: Coelacanth - Ancient Wisdom Attack!');
        // Increase QTE difficulty
        this.qteSuccess = Math.max(0, this.qteSuccess - 1);
        this.fishStamina = Math.min(this.maxFishStamina, this.fishStamina + 10);
    }

    marlinSpeedAttack() {
        console.log('ReelingMiniGame: Giant Marlin - Speed Attack!');
        // Multiple quick QTEs
        for (let i = 0; i < 3; i++) {
            this.scene.time.delayedCall(i * 1000, () => {
                if (!this.activeQTE) {
                    this.debugTriggerQTE('tap', 3);
                }
            });
        }
    }

    sharkFrenzyAttack() {
        console.log('ReelingMiniGame: Tiger Shark - Frenzy Attack!');
        // Increase all subsequent QTE difficulty
        this.tension = Math.min(100, this.tension + 35);
        this.fishStruggling = true;
        this.struggleType = 'thrash';
    }

    whaleDepthAttack() {
        console.log('ReelingMiniGame: Whale - Deep Sound Attack!');
        // Long hold QTE required
        this.scene.time.delayedCall(1000, () => {
            if (!this.activeQTE) {
                this.debugTriggerQTE('hold', 5);
            }
        });
    }

    megalodonDestroyerAttack() {
        console.log('ReelingMiniGame: Megalodon - Destroyer Attack!');
        // Potential boat damage (reduce all effectiveness)
        this.tension = Math.min(100, this.tension + 40);
        this.lineIntegrity = Math.max(0, this.lineIntegrity - 20);
        
        // Screen shake effect
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(1000, 10);
        }
    }

    mosasaurusAncientAttack() {
        console.log('ReelingMiniGame: Mosasaurus - Ancient Attack!');
        // Complex sequence QTE
        this.scene.time.delayedCall(800, () => {
            if (!this.activeQTE) {
                this.debugTriggerQTE('sequence', 6);
            }
        });
    }

    leviathanChaosAttack() {
        console.log('ReelingMiniGame: Leviathan - Chaos Attack!');
        // Ultimate challenge - random QTE type
        const qteTypes = ['tap', 'hold', 'sequence', 'timing'];
        const randomType = Phaser.Utils.Array.GetRandom(qteTypes);
        
        this.scene.time.delayedCall(1200, () => {
            if (!this.activeQTE) {
                this.debugTriggerQTE(randomType, 7);
            }
        });
        
        // Reality warp effect - UI distortion
        if (this.uiContainer) {
            this.scene.tweens.add({
                targets: this.uiContainer,
                scaleX: 1.1,
                scaleY: 0.9,
                duration: 2000,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }
    }
} 