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
        
        console.log('ReelingMiniGame: Starting with options:', options);
        
        // Get selected fish from luring result
        this.selectedFish = options.selectedFish || null;
        this.fishId = options.fishId || null;
        
        // Configure fish behavior based on database
        if (this.selectedFish && this.gameState.fishDatabase) {
            console.log('ReelingMiniGame: Using selected fish:', this.selectedFish.name);
            
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
                aggressiveness: this.selectedFish.aggressiveness
            };
            
            // Calculate fish stamina based on endurance
            this.fishStamina = 50 + (this.selectedFish.endurance * 15); // 65-200 stamina
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
        this.maxQTEs = 2 + Math.floor(this.fishProperties.aggressiveness / 4); // 2-4 QTEs
        
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
        progressBg.setDepth(1001);
        progressBg.fillStyle(0x333333, 0.8);
        progressBg.fillRoundedRect(progressBarX - progressBarWidth/2, progressBarY - progressBarHeight/2, progressBarWidth, progressBarHeight, 5);
        progressBg.lineStyle(2, 0x666666, 1);
        progressBg.strokeRoundedRect(progressBarX - progressBarWidth/2, progressBarY - progressBarHeight/2, progressBarWidth, progressBarHeight, 5);
        this.uiContainer.add(progressBg);
        
        // Progress bar fill
        this.progressBar = this.scene.add.graphics();
        this.progressBar.setDepth(1002);
        this.uiContainer.add(this.progressBar);
        
        // Progress text
        this.progressText = this.scene.add.text(progressBarX, progressBarY, '0%', {
            fontSize: '14px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            fontWeight: 'bold'
        }).setOrigin(0.5);
        this.progressText.setDepth(1003);
        this.uiContainer.add(this.progressText);
        
        // Instructions
        const instructions = this.scene.add.text(width / 2, height - 50, 
            'Click and Hold to REEL | Release to reduce TENSION | Complete QTEs!', {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        this.uiContainer.add(instructions);
        
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
        
        // Create fishing line from rod tip to fish
        this.fishingLine = this.scene.add.graphics();
        this.fishingLine.setDepth(190);
        this.updateFishingLine();
        
        // Create fish stamina bar
        this.createStaminaBar();
        
        console.log('ReelingMiniGame: Fish visuals created');
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
        const barX = this.fishPosition.x - barWidth / 2;
        const barY = this.fishPosition.y - 40;
        
        // Stamina bar background
        this.staminaBarBg = this.scene.add.graphics();
        this.staminaBarBg.setDepth(250);
        this.staminaBarBg.fillStyle(0x000000, 0.7);
        this.staminaBarBg.fillRoundedRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 2);
        
        // Stamina bar
        this.staminaBar = this.scene.add.graphics();
        this.staminaBar.setDepth(251);
        this.updateStaminaBar();
        
        this.uiContainer.add(this.staminaBarBg);
        this.uiContainer.add(this.staminaBar);
    }

    updateStaminaBar() {
        if (!this.staminaBar) return;
        
        const barWidth = 100;
        const barHeight = 8;
        const barX = this.fishPosition.x - barWidth / 2;
        const barY = this.fishPosition.y - 40;
        
        this.staminaBar.clear();
        
        // Calculate stamina percentage
        const staminaPercent = this.fishStamina / this.maxFishStamina;
        const currentBarWidth = barWidth * staminaPercent;
        
        // Color based on stamina level
        let barColor = 0x00FF00; // Green
        if (staminaPercent < 0.3) {
            barColor = 0xFF0000; // Red
        } else if (staminaPercent < 0.6) {
            barColor = 0xFFFF00; // Yellow
        }
        
        this.staminaBar.fillStyle(barColor);
        this.staminaBar.fillRoundedRect(barX, barY, currentBarWidth, barHeight, 2);
        
        // Update position to follow fish
        this.staminaBarBg.setPosition(
            this.fishPosition.x - barWidth / 2 - 2,
            this.fishPosition.y - 42
        );
        this.staminaBar.setPosition(0, 0);
    }

    createTensionMeter() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Tension meter position (right side of screen)
        const meterX = width - 80;
        const meterY = height * 0.3;
        const meterWidth = 30;
        const meterHeight = 300;
        
        // Tension meter background with gradient
        this.tensionMeterBg = this.scene.add.graphics();
        this.tensionMeterBg.setDepth(1001);
        
        // Background with depth effect
        this.tensionMeterBg.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x333333, 0x333333);
        this.tensionMeterBg.fillRoundedRect(meterX - meterWidth/2, meterY - meterHeight/2, meterWidth, meterHeight, 8);
        
        // Border with glow
        this.tensionMeterBg.lineStyle(3, 0x00aaff, 0.8);
        this.tensionMeterBg.strokeRoundedRect(meterX - meterWidth/2, meterY - meterHeight/2, meterWidth, meterHeight, 8);
        
        // Inner border
        this.tensionMeterBg.lineStyle(1, 0xffffff, 0.3);
        this.tensionMeterBg.strokeRoundedRect(meterX - meterWidth/2 + 2, meterY - meterHeight/2 + 2, meterWidth - 4, meterHeight - 4, 6);
        
        this.uiContainer.add(this.tensionMeterBg);
        
        // Create danger zones
        this.createTensionZones(meterX, meterY, meterWidth, meterHeight);
        
        // Safe zone indicator (green zone)
        this.tensionSafeZoneGraphic = this.scene.add.graphics();
        this.tensionSafeZoneGraphic.setDepth(1002);
        
        const safeZoneStart = meterY - meterHeight/2 + ((100 - this.tensionSafeZone.max) / 100) * meterHeight;
        const safeZoneEnd = meterY - meterHeight/2 + ((100 - this.tensionSafeZone.min) / 100) * meterHeight;
        const safeZoneHeight = safeZoneEnd - safeZoneStart;
        
        // Glowing green safe zone
        this.tensionSafeZoneGraphic.fillGradientStyle(0x00ff44, 0x00ff44, 0x00aa22, 0x00aa22);
        this.tensionSafeZoneGraphic.fillRoundedRect(meterX - meterWidth/2 + 3, safeZoneStart, meterWidth - 6, safeZoneHeight, 4);
        
        // Safe zone glow effect
        this.tensionSafeZoneGraphic.lineStyle(2, 0x88ff88, 0.6);
        this.tensionSafeZoneGraphic.strokeRoundedRect(meterX - meterWidth/2 + 2, safeZoneStart - 1, meterWidth - 4, safeZoneHeight + 2, 4);
        
        this.uiContainer.add(this.tensionSafeZoneGraphic);
        
        // Tension indicator (moving element)
        this.tensionIndicator = this.scene.add.graphics();
        this.tensionIndicator.setDepth(1003);
        this.uiContainer.add(this.tensionIndicator);
        
        // Tension meter label
        const meterLabel = this.scene.add.text(meterX, meterY - meterHeight/2 - 30, '⚡ TENSION', {
            fontSize: '14px',
            fill: '#00aaff',
            align: 'center',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        this.uiContainer.add(meterLabel);
        
        // Safe zone label with animation
        this.safeZoneLabel = this.scene.add.text(meterX + 40, (safeZoneStart + safeZoneEnd) / 2, '✓ SAFE', {
            fontSize: '12px',
            fill: '#00ff88',
            stroke: '#004422',
            strokeThickness: 1,
            fontWeight: 'bold'
        }).setOrigin(0, 0.5);
        this.uiContainer.add(this.safeZoneLabel);
        
        // Animate safe zone label
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
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        this.uiContainer.add(this.tensionValueText);
        
        // Line integrity warning
        this.lineIntegrityText = this.scene.add.text(meterX, meterY + meterHeight/2 + 45, 'LINE: 100%', {
            fontSize: '12px',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 1,
            align: 'center'
        }).setOrigin(0.5);
        this.uiContainer.add(this.lineIntegrityText);
        
        console.log('ReelingMiniGame: Enhanced tension meter created');
    }

    createTensionZones(meterX, meterY, meterWidth, meterHeight) {
        // Create visual zones for different tension levels
        const zones = [
            { start: 0, end: 30, color: 0xff4444, alpha: 0.3, label: 'DANGER' },
            { start: 30, end: 70, color: 0x44ff44, alpha: 0.3, label: 'SAFE' },
            { start: 70, end: 100, color: 0xff4444, alpha: 0.3, label: 'DANGER' }
        ];
        
        zones.forEach((zone, index) => {
            const zoneStart = meterY - meterHeight/2 + ((100 - zone.end) / 100) * meterHeight;
            const zoneEnd = meterY - meterHeight/2 + ((100 - zone.start) / 100) * meterHeight;
            const zoneHeight = zoneEnd - zoneStart;
            
            const zoneGraphic = this.scene.add.graphics();
            zoneGraphic.setDepth(1001);
            zoneGraphic.fillStyle(zone.color, zone.alpha);
            zoneGraphic.fillRoundedRect(meterX - meterWidth/2 + 3, zoneStart, meterWidth - 6, zoneHeight, 3);
            this.uiContainer.add(zoneGraphic);
            
            // Zone labels
            if (index !== 1) { // Don't label safe zone here, we have a special label
                const labelY = zoneStart + zoneHeight / 2;
                const zoneLabel = this.scene.add.text(meterX + 35, labelY, zone.label, {
                    fontSize: '10px',
                    fill: zone.color === 0xff4444 ? '#ff4444' : '#44ff44',
                    fontWeight: 'bold'
                }).setOrigin(0, 0.5);
                this.uiContainer.add(zoneLabel);
            }
        });
    }

    setupInputHandling() {
        // Mouse input for reeling
        this.mouseHandler = (pointer) => {
            if (!this.isActive) return;
            this.handleInput('reel', { pointer: pointer });
        };
        
        // Keyboard input for QTEs
        this.keyHandler = (event) => {
            if (!this.isActive || !this.activeQTE) return;
            
            switch (event.code) {
                case 'Space':
                    event.preventDefault();
                    if (this.activeQTE.type === 'tap') {
                        this.handleInput('tap');
                    } else if (this.activeQTE.type === 'timing') {
                        this.handleInput('tap');
                    }
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    this.handleInput('direction', { direction: 'up' });
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    this.handleInput('direction', { direction: 'down' });
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    this.handleInput('direction', { direction: 'left' });
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    this.handleInput('direction', { direction: 'right' });
                    break;
            }
        };
        
        // Hold detection for hold QTEs
        this.keyDownHandler = (event) => {
            if (!this.isActive || !this.activeQTE) return;
            if (event.code === 'Space' && this.activeQTE.type === 'hold') {
                event.preventDefault();
                this.handleInput('holdStart');
            }
        };
        
        this.keyUpHandler = (event) => {
            if (!this.isActive || !this.activeQTE) return;
            if (event.code === 'Space' && this.activeQTE.type === 'hold') {
                event.preventDefault();
                this.handleInput('holdEnd');
            }
        };
        
        this.scene.input.on('pointerdown', this.mouseHandler);
        this.scene.input.keyboard.on('keydown', this.keyDownHandler);
        this.scene.input.keyboard.on('keyup', this.keyUpHandler);
        document.addEventListener('keydown', this.keyHandler);
        
        console.log('ReelingMiniGame: Input handling set up');
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
            activeQTE: this.activeQTE
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
            timeLimit: 3000 - (difficulty * 500), // 3s to 1.5s
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
                this.activeQTE.holdDuration = 1000 + (difficulty * 500);
                this.activeQTE.holdStartTime = null;
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
        
        // Clean up any existing QTE visuals first
        this.destroyQTEVisuals();
        
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Create QTE container
        this.qteContainer = this.scene.add.container(width / 2, height / 2);
        this.qteContainer.setDepth(2000);
        
        // Create background panel
        this.qteBackground = this.scene.add.graphics();
        this.qteBackground.fillStyle(0x000000, 0.8);
        this.qteBackground.fillRoundedRect(-150, -80, 300, 160, 10);
        this.qteBackground.lineStyle(3, 0xFFFFFF, 0.8);
        this.qteBackground.strokeRoundedRect(-150, -80, 300, 160, 10);
        this.qteContainer.add(this.qteBackground);
        
        // Create QTE-specific visuals
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
            `TAP SPACEBAR ${this.activeQTE.requiredTaps} TIMES!`, {
            fontSize: '16px',
            fill: '#ffffff',
            fontWeight: 'bold',
            align: 'center'
        }).setOrigin(0.5);
        this.qteContainer.add(this.qteInstructions);
        
        // Tap indicator
        this.qteTapIndicator = this.scene.add.graphics();
        this.qteTapIndicator.fillStyle(0xFFFFFF);
        this.qteTapIndicator.fillRoundedRect(-30, -10, 60, 20, 5);
        this.qteContainer.add(this.qteTapIndicator);
        
        // Tap indicator text
        const tapText = this.scene.add.text(0, 0, 'SPACE', {
            fontSize: '12px',
            fill: '#000000',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        this.qteContainer.add(tapText);
        
        // Tap counter
        const tapCounter = this.scene.add.text(0, 25, 
            `${this.activeQTE.currentTaps}/${this.activeQTE.requiredTaps}`, {
            fontSize: '20px',
            fill: '#00ff00',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        this.qteContainer.add(tapCounter);
        
        // Animate tap indicator
        this.scene.tweens.add({
            targets: this.qteTapIndicator,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 300,
            yoyo: true,
            repeat: -1,
            ease: 'Power2.easeInOut'
        });
    }

    createHoldQTEVisuals() {
        // Instructions
        this.qteInstructions = this.scene.add.text(0, -50, 
            'HOLD SPACEBAR!', {
            fontSize: '16px',
            fill: '#ffffff',
            fontWeight: 'bold',
            align: 'center'
        }).setOrigin(0.5);
        this.qteContainer.add(this.qteInstructions);
        
        // Hold indicator
        this.qteTapIndicator = this.scene.add.graphics();
        this.qteTapIndicator.fillStyle(0xFF6600);
        this.qteTapIndicator.fillRoundedRect(-40, -15, 80, 30, 8);
        this.qteTapIndicator.lineStyle(2, 0xFFFFFF);
        this.qteTapIndicator.strokeRoundedRect(-40, -15, 80, 30, 8);
        this.qteContainer.add(this.qteTapIndicator);
        
        // Hold text
        const holdText = this.scene.add.text(0, 0, 'HOLD SPACE', {
            fontSize: '12px',
            fill: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        this.qteContainer.add(holdText);
        
        // Hold duration bar
        const holdBar = this.scene.add.graphics();
        holdBar.fillStyle(0x00FF00);
        holdBar.fillRect(-35, 20, 70, 8);
        this.qteContainer.add(holdBar);
    }

    createSequenceQTEVisuals() {
        // Instructions
        this.qteInstructions = this.scene.add.text(0, -50, 
            'FOLLOW THE SEQUENCE!', {
            fontSize: '16px',
            fill: '#ffffff',
            fontWeight: 'bold',
            align: 'center'
        }).setOrigin(0.5);
        this.qteContainer.add(this.qteInstructions);
        
        // Create arrow indicators
        const arrowSpacing = 40;
        const startX = -(this.activeQTE.sequence.length - 1) * arrowSpacing / 2;
        
        this.qteArrows = [];
        this.activeQTE.sequence.forEach((direction, index) => {
            const arrow = this.createDirectionArrow(direction, startX + index * arrowSpacing, 0);
            
            // Highlight current arrow
            if (index === this.activeQTE.currentIndex) {
                this.drawArrow(arrow, direction, 0x00FF00);
                this.scene.tweens.add({
                    targets: arrow,
                    scaleX: 1.3,
                    scaleY: 1.3,
                    duration: 200,
                    yoyo: true,
                    repeat: -1
                });
            } else if (index < this.activeQTE.currentIndex) {
                this.drawArrow(arrow, direction, 0x666666); // Completed arrows
            } else {
                this.drawArrow(arrow, direction, 0xFFFFFF); // Future arrows
            }
            
            this.qteArrows.push(arrow);
            this.qteContainer.add(arrow);
        });
        
        // Progress indicator
        const progressText = this.scene.add.text(0, 35, 
            `${this.activeQTE.currentIndex}/${this.activeQTE.sequence.length}`, {
            fontSize: '14px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.qteContainer.add(progressText);
    }

    createDirectionArrow(direction, x, y) {
        const arrow = this.scene.add.graphics();
        arrow.setPosition(x, y);
        
        // Store direction and color for redrawing
        arrow.direction = direction;
        arrow.currentColor = 0xFFFFFF;
        
        // Draw the arrow
        this.drawArrow(arrow, direction, 0xFFFFFF);
        
        return arrow;
    }

    drawArrow(arrow, direction, color) {
        arrow.clear();
        arrow.fillStyle(color);
        
        switch (direction) {
            case 'up':
                arrow.fillTriangle(0, -10, -8, 5, 8, 5);
                break;
            case 'down':
                arrow.fillTriangle(0, 10, -8, -5, 8, -5);
                break;
            case 'left':
                arrow.fillTriangle(-10, 0, 5, -8, 5, 8);
                break;
            case 'right':
                arrow.fillTriangle(10, 0, -5, -8, -5, 8);
                break;
        }
        
        arrow.currentColor = color;
    }

    createTimingQTEVisuals() {
        // Instructions
        this.qteInstructions = this.scene.add.text(0, -50, 
            'HIT SPACEBAR AT THE RIGHT TIME!', {
            fontSize: '16px',
            fill: '#ffffff',
            fontWeight: 'bold',
            align: 'center'
        }).setOrigin(0.5);
        this.qteContainer.add(this.qteInstructions);
        
        // Timing bar background
        const timingBarBg = this.scene.add.graphics();
        timingBarBg.fillStyle(0x333333);
        timingBarBg.fillRoundedRect(-100, -10, 200, 20, 5);
        this.qteContainer.add(timingBarBg);
        
        // Target zone
        const targetPercent = this.activeQTE.targetTime / this.activeQTE.timeLimit;
        const targetX = -100 + (targetPercent * 200);
        const targetWidth = (this.activeQTE.tolerance * 2 / this.activeQTE.timeLimit) * 200;
        
        this.qteTimingTarget = this.scene.add.graphics();
        this.qteTimingTarget.fillStyle(0x00FF00, 0.7);
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
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.qteContainer.add(instructionText);
    }

    createQTEProgressBar() {
        // Time remaining bar
        const progressBarBg = this.scene.add.graphics();
        progressBarBg.fillStyle(0x333333);
        progressBarBg.fillRect(-140, 60, 280, 8);
        this.qteContainer.add(progressBarBg);
        
        this.qteProgressBar = this.scene.add.graphics();
        this.qteProgressBar.fillStyle(0xFF6600);
        this.qteProgressBar.fillRect(-140, 60, 280, 8);
        this.qteContainer.add(this.qteProgressBar);
        
        // Animate progress bar
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
        
        // Clean up arrows
        if (this.qteArrows) {
            this.qteArrows.forEach(arrow => {
                if (arrow && arrow.active) {
                    this.scene.tweens.killTweensOf(arrow);
                }
            });
            this.qteArrows = [];
        }
        
        this.qteInstructions = null;
        this.qteProgressBar = null;
        this.qteTimingTarget = null;
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
                    qte.holdStartTime = this.scene.time.now;
                    // Visual feedback for hold start
                    if (this.qteTapIndicator && this.qteTapIndicator.active) {
                        this.qteTapIndicator.clear();
                        this.qteTapIndicator.fillStyle(0x00FF00);
                        this.qteTapIndicator.fillRoundedRect(-40, -15, 80, 30, 8);
                        this.qteTapIndicator.lineStyle(2, 0xFFFFFF);
                        this.qteTapIndicator.strokeRoundedRect(-40, -15, 80, 30, 8);
                    }
                } else if (inputType === 'holdEnd' && qte.holdStartTime) {
                    const holdDuration = this.scene.time.now - qte.holdStartTime;
                    if (holdDuration >= qte.holdDuration) {
                        success = true;
                    } else {
                        // Failed to hold long enough
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
                fill: '#ff0000',
                fontWeight: 'bold'
            }
        ).setOrigin(0.5);
        
        damageText.setDepth(300);
        
        // Animate damage text
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 30,
            alpha: 0,
            duration: 1000,
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
                // Red flash removed to prevent visual problems
                // const flashOverlay = this.scene.add.graphics();
                // flashOverlay.fillStyle(0xFF0000, 0.3);
                // flashOverlay.fillRoundedRect(-150, -80, 300, 160, 10);
                // this.qteContainer.add(flashOverlay);
                // 
                // this.scene.time.delayedCall(200, () => {
                //     if (flashOverlay && flashOverlay.active) {
                //         flashOverlay.destroy();
                //     }
                // });
                
                // Shake animation removed to prevent visual problems
                // this.scene.tweens.add({
                //     targets: this.qteContainer,
                //     x: this.qteContainer.x + 10,
                //     duration: 50,
                //     yoyo: true,
                //     repeat: 3,
                //     ease: 'Power2.easeInOut',
                //     onComplete: () => {
                //         this.destroyQTEVisuals();
                //     }
                // });
                
                // Simple cleanup without visual effects
                this.destroyQTEVisuals();
            }
        }
        
        // Emit QTE completion event
        this.scene.events.emit('fishing:qteComplete', {
            qte: this.activeQTE,
            success: success,
            newTension: this.tension
        });
        
        this.activeQTE = null;
        
        // Schedule next QTE
        this.scheduleNextQTE();
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

    complete(success, result) {
        this.isActive = false;
        
        // Play completion audio based on result
        if (success) {
            this.audioManager?.playSFX('reel_success');
        } else {
            switch (result) {
                case 'line_break':
                    this.audioManager?.playSFX('line_break');
                    break;
                case 'fish_escape':
                    this.audioManager?.playSFX('fish_escape');
                    break;
                default:
                    this.audioManager?.playSFX('reel_fail');
                    break;
            }
        }
        
        // Clean up timers
        if (this.reelingTimer) {
            this.reelingTimer.destroy();
        }
        if (this.struggleTimer) {
            this.struggleTimer.destroy();
        }
        if (this.qteTimer) {
            this.qteTimer.destroy();
        }
        
        console.log(`ReelingMiniGame: ${success ? 'Success' : 'Failed'} - ${result}`);
        
        // Handle fish catch data properly
        let fishData = null;
        let reason = result;
        
        if (success && typeof result === 'object' && result.caught) {
            // Fish was caught successfully - extract fish data
            fishData = result.fishData || this.selectedFish || {
                name: 'Unknown Fish',
                id: 'unknown',
                weight: 2.5,
                rarity: 1
            };
            reason = 'fish_caught';
        }
        
        // Emit completion event
        this.scene.events.emit('fishing:reelComplete', {
            success: success,
            reason: reason,
            fish: fishData, // Pass the actual fish data instead of this.fish (which is null)
            finalStats: {
                tension: this.tension,
                lineIntegrity: this.lineIntegrity,
                reelProgress: this.reelProgress,
                fishStamina: this.fishStamina,
                qteSuccess: this.qteSuccess,
                qteFails: this.qteFails
            },
            // Include catch result for additional data
            catchResult: (typeof result === 'object' && result.catchResult) ? result.catchResult : null
        });
    }

    destroy() {
        this.isActive = false;
        
        // Clean up timers
        if (this.reelingTimer) {
            this.reelingTimer.destroy();
        }
        if (this.struggleTimer) {
            this.struggleTimer.destroy();
        }
        if (this.qteTimer) {
            this.qteTimer.destroy();
        }
        
        // Clean up input handling
        if (this.mouseHandler) {
            this.scene.input.off('pointerdown', this.mouseHandler);
        }
        if (this.keyDownHandler) {
            this.scene.input.keyboard.off('keydown', this.keyDownHandler);
        }
        if (this.keyUpHandler) {
            this.scene.input.keyboard.off('keyup', this.keyUpHandler);
        }
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
        
        // Clean up QTE visuals
        this.destroyQTEVisuals();
        
        // Clean up visual elements
        if (this.fishGraphic) {
            this.fishGraphic.destroy();
        }
        if (this.fishingLine) {
            this.fishingLine.destroy();
        }
        if (this.staminaBar) {
            this.staminaBar.destroy();
        }
        if (this.staminaBarBg) {
            this.staminaBarBg.destroy();
        }
        if (this.tensionMeter) {
            this.tensionMeter.destroy();
        }
        if (this.tensionMeterBg) {
            this.tensionMeterBg.destroy();
        }
        if (this.tensionIndicator) {
            this.tensionIndicator.destroy();
        }
        if (this.uiContainer) {
            this.uiContainer.destroy();
        }
        
        // Clean up splash effects
        this.splashEffects.forEach(splash => {
            if (splash && splash.active) {
                splash.destroy();
            }
        });
        this.splashEffects = [];
        
        // Clean up celebration container
        if (this.celebrationContainer) {
            this.scene.tweens.killTweensOf(this.celebrationContainer);
            this.celebrationContainer.destroy();
            this.celebrationContainer = null;
        }
        
        console.log('ReelingMiniGame: All visual elements destroyed');
    }

    fishCaught() {
        // Prevent multiple calls to fishCaught
        if (!this.isActive || this.fishCaughtCalled) {
            return;
        }
        
        this.fishCaughtCalled = true;
        this.isActive = false; // Immediately stop the game loop to prevent multiple calls
        
        console.log('ReelingMiniGame: Fish caught successfully!');
        
        // Calculate actual weight based on fish properties
        let actualWeight = 2.5; // Default weight
        
        if (this.selectedFish && this.gameState.fishDatabase) {
            // Use FishDatabase to calculate weight with variation
            actualWeight = this.gameState.fishDatabase.calculateFishWeight(this.selectedFish);
        } else if (this.fishProperties) {
            // Fallback to fish properties
            actualWeight = this.fishProperties.weight || 2.5;
        }
        
        // Determine if it was a perfect catch based on QTE performance
        const perfectCatch = this.qteSuccess > 0 && this.qteFails === 0;
        
        // Create comprehensive fish data for GameState
        const fishData = {
            fishId: this.fishId || this.selectedFish?.id || 'unknown',
            name: this.selectedFish?.name || this.fishProperties?.name || 'Unknown Fish',
            weight: actualWeight,
            rarity: Math.min(this.selectedFish?.rarity || 1, 6), // Cap rarity at 6
            value: this.selectedFish?.coinValue || 100,
            isPerfectCatch: perfectCatch,
            qtePerformance: {
                successes: this.qteSuccess,
                failures: this.qteFails,
                totalQTEs: this.qteSuccess + this.qteFails
            },
            catchStats: {
                finalTension: this.tension,
                lineIntegrity: this.lineIntegrity,
                timeToReel: this.scene.time.now - this.startTime
            }
        };
        
        console.log('ReelingMiniGame: Fish data being processed:', fishData);
        console.log('ReelingMiniGame: Selected fish original data:', this.selectedFish);
        
        // Let GameState handle the catch with FishDatabase
        const catchResult = this.gameState.catchFish(fishData, perfectCatch);
        
        // Award perfect reel bonus if applicable
        if (perfectCatch) {
            this.gameState.trackPerfectReel();
        }
        
        // Show catch celebration
        this.showCatchCelebration(catchResult);
        
        // Complete the minigame
        this.scene.time.delayedCall(2000, () => {
            this.complete(true, {
                caught: true,
                catchResult: catchResult,
                fishData: fishData
            });
        });
    }
    
    showCatchCelebration(catchResult) {
        if (!catchResult || !catchResult.fish) {
            console.warn('ReelingMiniGame: No catch result or fish data for celebration');
            return;
        }
        
        const fish = catchResult.fish;
        const weight = catchResult.weight || 0;
        const rewards = catchResult.rewards || { coins: 0, experience: 0 };
        
        console.log('ReelingMiniGame: Showing celebration for:', { fish, weight, rewards });
        
        // Validate fish data
        if (!fish.name) {
            console.warn('ReelingMiniGame: Fish missing name, using fallback');
            fish.name = 'Unknown Fish';
        }
        
        if (!fish.rarity || fish.rarity < 1) {
            console.warn('ReelingMiniGame: Invalid fish rarity, using fallback');
            fish.rarity = 1;
        }
        
        // Cap rarity for display
        const displayRarity = Math.min(fish.rarity, 6);
        
        // Create celebration UI
        const celebrationContainer = this.scene.add.container(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2
        );
        celebrationContainer.setDepth(3000);
        
        // Background panel
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x000000, 0.9);
        bg.fillRoundedRect(-200, -150, 400, 300, 20);
        bg.lineStyle(3, 0xFFD700, 1);
        bg.strokeRoundedRect(-200, -150, 400, 300, 20);
        celebrationContainer.add(bg);
        
        // Title
        const title = this.scene.add.text(0, -120, 'FISH CAUGHT!', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        celebrationContainer.add(title);
        
        // Fish name and rarity
        const rarityColors = ['#888888', '#FFFFFF', '#00FF00', '#0080FF', '#FF00FF', 
                            '#FF8000', '#FF0000', '#FFD700', '#FF1493', '#00FFFF'];
        const rarityColor = rarityColors[Math.min(displayRarity - 1, rarityColors.length - 1)];
        
        const fishName = this.scene.add.text(0, -60, fish.name, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: rarityColor,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        celebrationContainer.add(fishName);
        
        // Weight
        const weightText = this.scene.add.text(0, -20, `Weight: ${weight} kg`, {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        celebrationContainer.add(weightText);
        
        // Special badges
        let badgeY = 20;
        
        if (catchResult.isFirstCatch) {
            const firstCatchBadge = this.scene.add.text(0, badgeY, '⭐ FIRST CATCH! ⭐', {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#FFD700',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            celebrationContainer.add(firstCatchBadge);
            badgeY += 30;
        }
        
        if (catchResult.isRecord) {
            const recordBadge = this.scene.add.text(0, badgeY, '🏆 NEW RECORD! 🏆', {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#FF6B6B',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            celebrationContainer.add(recordBadge);
            badgeY += 30;
        }
        
        if (catchResult.isPerfectCatch) {
            const perfectBadge = this.scene.add.text(0, badgeY, '✨ PERFECT CATCH! ✨', {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#00FFFF',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            celebrationContainer.add(perfectBadge);
            badgeY += 30;
        }
        
        // Rewards
        const coinsText = this.scene.add.text(-80, 90, `+${rewards.coins || 0} 🪙`, {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        celebrationContainer.add(coinsText);
        
        const expText = this.scene.add.text(80, 90, `+${rewards.experience || 0} XP`, {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#00FF00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        celebrationContainer.add(expText);
        
        // Animate celebration
        celebrationContainer.setScale(0);
        this.scene.tweens.add({
            targets: celebrationContainer,
            scaleX: 1,
            scaleY: 1,
            duration: 500,
            ease: 'Back.easeOut'
        });
        
        // Pulse animation for title
        this.scene.tweens.add({
            targets: title,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Store reference for cleanup
        this.celebrationContainer = celebrationContainer;
    }
} 