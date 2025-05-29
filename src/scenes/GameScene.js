import Phaser from 'phaser';
import InputManager from '../scripts/InputManager.js';
import GameState from '../scripts/GameState.js';
import PlayerController from '../scripts/PlayerController.js';
import SceneManager from '../scripts/SceneManager.js';
import { gameDataLoader } from '../scripts/DataLoader.js';
import { InventoryUI } from '../ui/InventoryUI.js';
import { TimeWeatherUI } from '../ui/TimeWeatherUI.js';
import { PlayerProgressionUI } from '../ui/PlayerProgressionUI.js';
import { FishCollectionUI } from '../ui/FishCollectionUI.js';
import { CraftingUI } from '../ui/CraftingUI.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Get game state instance and scene manager
        this.gameState = GameState.getInstance();
        this.gameState.startAutoSave();
        this.sceneManager = SceneManager.getInstance();
        this.sceneManager.setCurrentScene(this);

        // Initialize audio manager for this scene
        this.audioManager = this.gameState.getAudioManager(this);
        if (this.audioManager) {
            this.audioManager.setSceneAudio('GameScene');
            console.log('GameScene: Audio manager initialized');
        }

        // Initialize time and weather systems
        this.gameState.initializeTimeWeather(this);
        console.log('GameScene: Time and weather systems initialized');

        // Create sky background (top portion)
        const skyGradient = this.add.graphics();
        skyGradient.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xE0F6FF, 0xE0F6FF, 1);
        skyGradient.fillRect(0, 0, width, height * 0.3);

        // Create water background (most of the screen)
        const waterGradient = this.add.graphics();
        waterGradient.fillGradientStyle(0x006699, 0x006699, 0x004466, 0x004466, 1);
        waterGradient.fillRect(0, height * 0.3, width, height * 0.7);
        
        // Add water ripple effects
        for (let x = 0; x < width; x += 80) {
            for (let y = height * 0.3; y < height * 0.85; y += 60) {
                const ripple = this.add.circle(x + Phaser.Math.Between(-20, 20), y + Phaser.Math.Between(-10, 10), 
                    Phaser.Math.Between(2, 8), 0xffffff, 0.1);
                
                // Animate ripples
                this.tweens.add({
                    targets: ripple,
                    scaleX: 1.5,
                    scaleY: 1.5,
                    alpha: 0,
                    duration: Phaser.Math.Between(2000, 4000),
                    repeat: -1,
                    delay: Phaser.Math.Between(0, 2000)
                });
            }
        }

        // Create boat at bottom of screen (first-person view)
        this.createBoat(width, height);

        // Player position (conceptual - for casting origin)
        this.playerPosition = { x: width / 2, y: height - 80 };

        // Initialize input manager and player controller
        this.inputManager = new InputManager(this);
        this.playerController = new PlayerController(this);

        // Add some fish in the water (swimming in the distance) using configuration
        this.fishGroup = this.physics.add.group();
        
        // Create permanent hotspot first
        this.createPermanentHotspot();
        
        // Then create fish population with more fish near hotspot
        this.createFishPopulation();

        // UI Elements
        this.add.text(16, 16, 'SPACE: Start Fishing | ESC: Menu | I: Inventory | P: Progression | Mouse: Aim & Click', {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        });

        // Create inventory UI
        this.inventoryUI = new InventoryUI(this, 100, 50, 800, 600);

        // Create time and weather UI
        this.timeWeatherUI = new TimeWeatherUI(this, 20, 20);

        // Create player progression UI
        this.playerProgressionUI = new PlayerProgressionUI(this, 50, 50, 900, 700);

        // Create fish collection UI
        this.fishCollectionUI = new FishCollectionUI(this, 50, 50, 900, 650);

        // Create Player button in lower right corner
        this.createPlayerButton();

        // Create Collection button next to Player button
        this.createCollectionButton();

        // Crosshair for aiming using configuration
        this.createCrosshair();

        // Listen for input events
        this.events.on('input:menu', () => {
            this.sceneManager.goToMenu(this);
        });

        // Add inventory key binding
        this.input.keyboard.on('keydown-I', () => {
            this.inventoryUI.toggle();
        });

        // Add progression key binding
        this.input.keyboard.on('keydown-P', () => {
            this.playerProgressionUI.toggle();
        });

        // PlayerController now handles casting
        // Remove old cast event listener as PlayerController manages this

        // Start HUD scene
        this.scene.launch('HUDScene');

        console.log('Game Scene: Fishing environment created');
    }

    update() {
        // Update input manager and player controller
        this.inputManager.update();
        this.playerController.update();

        // Update crosshair position based on mouse
        const pointer = this.input.activePointer;
        if (pointer.x > 0 && pointer.y > 0) {
            // Limit crosshair to water area (not too close to boat)
            const maxY = this.cameras.main.height * 0.8;
            const minY = this.cameras.main.height * 0.35;
            
            this.crosshair.setPosition(
                Phaser.Math.Clamp(pointer.x, 50, this.cameras.main.width - 50),
                Phaser.Math.Clamp(pointer.y, minY, maxY)
            );
        }

        // Update time and weather systems
        this.gameState.updateTimeWeather(this.game.loop.delta);
    }

    // Casting and fish catching now handled by PlayerController

    createFishPopulation() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const fishingConfig = gameDataLoader.getFishingConfig();
        
        // Create regular fish scattered around the water
        const regularFishCount = Math.floor(fishingConfig.fishCount * 0.6); // 60% regular fish
        let hotspotFishCount = 0; // Initialize hotspot fish count
        
        for (let i = 0; i < regularFishCount; i++) {
            const fish = this.fishGroup.create(
                Phaser.Math.Between(100, width - 100),
                Phaser.Math.Between(height * fishingConfig.fishWaterAreaTop, height * fishingConfig.fishWaterAreaBottom),
                'fish'
            );
            
            fish.setVelocity(
                Phaser.Math.Between(fishingConfig.fishSpeedRange.min, fishingConfig.fishSpeedRange.max),
                Phaser.Math.Between(fishingConfig.fishVerticalSpeedRange.min, fishingConfig.fishVerticalSpeedRange.max)
            );
            
            fish.setBounce(fishingConfig.fishBounce);
            fish.setCollideWorldBounds(true);
            fish.setScale(fishingConfig.fishScale);
            fish.fishData = this.generateRandomFishData();
            fish.fishType = 'regular';
        }
        
        // Create hotspot fish - more fish near the hotspot
        if (this.hotspotPosition) {
            hotspotFishCount = Math.floor(fishingConfig.fishCount * 0.4); // 40% hotspot fish
            
            for (let i = 0; i < hotspotFishCount; i++) {
                // Position fish near the hotspot with some variance
                const angle = Phaser.Math.Between(0, 360) * Math.PI / 180;
                const distance = Phaser.Math.Between(50, 150); // Within 150px of hotspot
                const fishX = this.hotspotPosition.x + Math.cos(angle) * distance;
                const fishY = this.hotspotPosition.y + Math.sin(angle) * distance;
                
                // Ensure fish stays within water bounds
                const clampedX = Phaser.Math.Clamp(fishX, 100, width - 100);
                const clampedY = Phaser.Math.Clamp(fishY, height * fishingConfig.fishWaterAreaTop, height * fishingConfig.fishWaterAreaBottom);
                
                const fish = this.fishGroup.create(clampedX, clampedY, 'fish');
                
                // Hotspot fish move slower and more randomly
                fish.setVelocity(
                    Phaser.Math.Between(-30, 30),
                    Phaser.Math.Between(-20, 20)
                );
                
                fish.setBounce(fishingConfig.fishBounce);
                fish.setCollideWorldBounds(true);
                fish.setScale(fishingConfig.fishScale * 1.2); // Slightly larger fish near hotspot
                fish.fishData = this.generateHotspotFishData(); // Better fish near hotspot
                fish.fishType = 'hotspot';
                
                // Add attraction behavior to hotspot
                this.addHotspotAttraction(fish);
            }
        }
        
        console.log(`GameScene: Created ${regularFishCount} regular fish and ${hotspotFishCount} hotspot fish`);
    }

    generateRandomFishData() {
        const allFish = gameDataLoader.getAllFish();
        if (allFish.length === 0) {
            return { id: 'basic_fish', name: 'Basic Fish', rarity: 1 };
        }
        return Phaser.Utils.Array.GetRandom(allFish);
    }

    generateHotspotFishData() {
        const allFish = gameDataLoader.getAllFish();
        if (allFish.length === 0) {
            return { id: 'rare_fish', name: 'Rare Fish', rarity: 5 };
        }
        
        // Filter for higher rarity fish (rarity 4+) for hotspot
        const rareFish = allFish.filter(fish => fish.rarity >= 4);
        if (rareFish.length > 0) {
            return Phaser.Utils.Array.GetRandom(rareFish);
        }
        
        // Fallback to any fish
        return Phaser.Utils.Array.GetRandom(allFish);
    }

    addHotspotAttraction(fish) {
        // Create a behavior that makes fish occasionally swim toward the hotspot
        const attractionTimer = this.time.addEvent({
            delay: Phaser.Math.Between(3000, 8000), // Every 3-8 seconds
            callback: () => {
                if (fish.active && this.hotspotPosition) {
                    // Calculate direction to hotspot
                    const dx = this.hotspotPosition.x - fish.x;
                    const dy = this.hotspotPosition.y - fish.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // If fish is far from hotspot, attract it
                    if (distance > 200) {
                        const speed = 40;
                        fish.setVelocity(
                            (dx / distance) * speed,
                            (dy / distance) * speed
                        );
                    } else {
                        // If close to hotspot, swim in circles around it
                        const angle = Phaser.Math.Angle.Between(this.hotspotPosition.x, this.hotspotPosition.y, fish.x, fish.y);
                        const circleSpeed = 30;
                        fish.setVelocity(
                            Math.cos(angle + Math.PI/2) * circleSpeed,
                            Math.sin(angle + Math.PI/2) * circleSpeed
                        );
                    }
                }
            },
            loop: true
        });
        
        // Store timer reference for cleanup
        fish.attractionTimer = attractionTimer;
    }

    createCrosshair() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const uiConfig = gameDataLoader.getUIConfig();
        
        this.crosshair = this.add.graphics();
        this.crosshair.lineStyle(uiConfig.crosshairLineWidth, parseInt(uiConfig.crosshairColor), uiConfig.crosshairAlpha);
        this.crosshair.strokeCircle(0, 0, uiConfig.crosshairSize);
        this.crosshair.moveTo(-uiConfig.crosshairLineLength, 0);
        this.crosshair.lineTo(uiConfig.crosshairLineLength, 0);
        this.crosshair.moveTo(0, -uiConfig.crosshairLineLength);
        this.crosshair.lineTo(0, uiConfig.crosshairLineLength);
        this.crosshair.setPosition(width / 2, height / 2);
    }

    createBoat(width, height) {
        const boatConfig = gameDataLoader.getBoatConfig();
        
        // Boat deck (visible at bottom of screen in first-person view)
        const boatDeck = this.add.graphics();
        boatDeck.fillStyle(parseInt(boatConfig.deckColor));
        boatDeck.fillRect(0, height * (1 - boatConfig.deckHeight), width, height * boatConfig.deckHeight);
        
        // Boat sides (perspective view)
        const leftSide = this.add.graphics();
        leftSide.fillStyle(parseInt(boatConfig.sideColor));
        leftSide.fillRect(0, height * 0.82, boatConfig.sideWidth, height * 0.18);
        
        const rightSide = this.add.graphics();
        rightSide.fillStyle(parseInt(boatConfig.sideColor));
        rightSide.fillRect(width - boatConfig.sideWidth, height * 0.82, boatConfig.sideWidth, height * 0.18);
        
        // Boat front edge
        const frontEdge = this.add.graphics();
        frontEdge.fillStyle(parseInt(boatConfig.frontEdgeColor));
        frontEdge.fillRect(boatConfig.sideWidth, height * 0.82, width - (boatConfig.sideWidth * 2), boatConfig.frontEdgeHeight);
        
        // Wood planks texture
        for (let x = 50; x < width - 50; x += boatConfig.plankSpacing) {
            const plank = this.add.graphics();
            plank.lineStyle(1, parseInt(boatConfig.plankColor), boatConfig.plankAlpha);
            plank.moveTo(x, height * 0.85);
            plank.lineTo(x, height);
        }
        
        // Fishing rod holder (visible in first-person)
        const rodHolder = this.add.graphics();
        rodHolder.fillStyle(parseInt(boatConfig.rodHolderColor));
        rodHolder.fillCircle(width / 2 + 100, height * 0.88, boatConfig.rodHolderRadius);
        rodHolder.fillRect(width / 2 + 95, height * 0.88, 10, boatConfig.rodHolderHeight);
        
        // Tackle box
        const tackleBox = this.add.graphics();
        tackleBox.fillStyle(parseInt(boatConfig.tackleBoxColor));
        tackleBox.fillRect(width / 2 - 150, height * 0.87, boatConfig.tackleBoxWidth, boatConfig.tackleBoxHeight);
        tackleBox.lineStyle(2, parseInt(boatConfig.tackleBoxBorderColor));
        tackleBox.strokeRect(width / 2 - 150, height * 0.87, boatConfig.tackleBoxWidth, boatConfig.tackleBoxHeight);
        
        // Create the main fishing rod (this will be used by the casting minigame)
        this.createFishingRod(width, height);
    }

    createFishingRod(width, height) {
        // Get equipped rod stats for visual appearance
        const equippedRod = this.gameState.getEquippedItem('rods');
        const equippedLure = this.gameState.getEquippedItem('lures');
        
        // Rod positioning
        const rodStartX = width / 2;
        const rodStartY = height - 50;
        const rodEndX = rodStartX + 20;
        const rodEndY = rodStartY - 120;
        const rodTipX = rodEndX + 5;
        const rodTipY = rodEndY - 10;
        
        // Create fishing rod graphics
        this.fishingRod = this.add.graphics();
        this.fishingRod.setDepth(200);
        
        // Rod appearance based on equipped rod
        let rodColor = 0x404040; // Default gray
        let rodWidth = 4;
        
        if (equippedRod) {
            switch (equippedRod.id) {
                case 'carbon_rod':
                    rodColor = 0x2C2C2C; // Dark carbon
                    rodWidth = 3;
                    break;
                case 'pro_rod':
                    rodColor = 0x1A1A1A; // Black pro rod
                    rodWidth = 5;
                    break;
                default:
                    rodColor = 0x8B4513; // Brown basic rod
                    rodWidth = 4;
            }
        }
        
        // Rod handle (brown grip)
        this.fishingRod.lineStyle(8, 0x8B4513);
        this.fishingRod.lineBetween(rodStartX, rodStartY, rodStartX + 5, rodStartY - 30);
        
        // Rod shaft (based on equipped rod)
        this.fishingRod.lineStyle(rodWidth, rodColor);
        this.fishingRod.lineBetween(rodStartX + 5, rodStartY - 30, rodEndX, rodEndY);
        
        // Rod tip (lighter color)
        this.fishingRod.lineStyle(2, rodColor + 0x404040);
        this.fishingRod.lineBetween(rodEndX, rodEndY, rodTipX, rodTipY);
        
        // Store rod tip position for casting minigame
        this.rodTipPosition = { x: rodTipX, y: rodTipY };
        
        // Create fishing line (initially hanging down)
        this.fishingLine = this.add.graphics();
        this.fishingLine.setDepth(190);
        
        // Create lure at end of line
        this.createLure(rodTipX, rodTipY + 30, equippedLure);
        
        // Draw initial fishing line
        this.updateFishingLine(rodTipX, rodTipY + 30);
        
        console.log('GameScene: Fishing rod and lure created');
    }

    createLure(x, y, equippedLure) {
        // Create lure graphics
        this.lure = this.add.graphics();
        this.lure.setDepth(180);
        this.lure.setPosition(x, y);
        
        // Lure appearance based on equipped lure
        let lureColor = 0xFFD700; // Default gold
        let lureSize = 4;
        let lureShape = 'circle';
        
        if (equippedLure) {
            switch (equippedLure.id) {
                case 'spoon_lure':
                    lureColor = 0xC0C0C0; // Silver spoon
                    lureSize = 6;
                    lureShape = 'oval';
                    break;
                case 'fly_lure':
                    lureColor = 0xFF6B6B; // Red fly
                    lureSize = 3;
                    lureShape = 'feather';
                    break;
                case 'deep_diver':
                    lureColor = 0x4ECDC4; // Teal deep diver
                    lureSize = 5;
                    lureShape = 'torpedo';
                    break;
                default:
                    lureColor = 0xFFD700; // Gold basic lure
                    lureSize = 4;
                    lureShape = 'circle';
            }
        }
        
        // Draw lure based on type
        switch (lureShape) {
            case 'oval':
                this.lure.fillStyle(lureColor);
                this.lure.fillEllipse(0, 0, lureSize * 2, lureSize);
                break;
            case 'feather':
                this.lure.fillStyle(lureColor);
                this.lure.fillCircle(0, 0, lureSize);
                // Add feather details
                this.lure.lineStyle(1, 0xFF0000);
                this.lure.moveTo(-lureSize, 0);
                this.lure.lineTo(lureSize, 0);
                break;
            case 'torpedo':
                this.lure.fillStyle(lureColor);
                this.lure.fillEllipse(0, 0, lureSize, lureSize * 2);
                break;
            default: // circle
                this.lure.fillStyle(lureColor);
                this.lure.fillCircle(0, 0, lureSize);
        }
        
        // Add subtle swaying animation to the lure
        this.tweens.add({
            targets: this.lure,
            x: x + 3,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Store initial lure position
        this.lurePosition = { x: x, y: y };
    }

    updateFishingLine(lureX, lureY) {
        if (!this.fishingLine || !this.rodTipPosition) return;
        
        this.fishingLine.clear();
        this.fishingLine.lineStyle(2, 0x404040, 0.8);
        this.fishingLine.lineBetween(
            this.rodTipPosition.x, 
            this.rodTipPosition.y, 
            lureX, 
            lureY
        );
    }

    createPermanentHotspot() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Fixed hotspot position in the center-left area of water
        const hotspotX = width * 0.3;
        const hotspotY = height * 0.5;
        
        // Create permanent hotspot area
        this.permanentHotspot = this.add.graphics();
        this.permanentHotspot.setDepth(50);
        
        // Outer glow (larger, more transparent)
        this.permanentHotspot.fillStyle(0x00ffff, 0.2);
        this.permanentHotspot.fillCircle(hotspotX, hotspotY, 100);
        
        // Middle ring
        this.permanentHotspot.fillStyle(0x00ffff, 0.3);
        this.permanentHotspot.fillCircle(hotspotX, hotspotY, 70);
        
        // Inner circle
        this.permanentHotspot.fillStyle(0x00ffff, 0.4);
        this.permanentHotspot.fillCircle(hotspotX, hotspotY, 40);
        
        // Center dot
        this.permanentHotspot.fillStyle(0xffffff, 0.6);
        this.permanentHotspot.fillCircle(hotspotX, hotspotY, 15);
        
        // Add gentle pulsing animation
        this.tweens.add({
            targets: this.permanentHotspot,
            scaleX: 1.1,
            scaleY: 1.1,
            alpha: 0.8,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Store hotspot position for other systems to use
        this.hotspotPosition = { x: hotspotX, y: hotspotY, radius: 100 };
        
        // Add hotspot label
        this.add.text(hotspotX, hotspotY - 130, 'FISHING HOTSPOT', {
            fontSize: '16px',
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5);
        
        console.log('GameScene: Permanent hotspot created at', hotspotX, hotspotY);
    }

    createPlayerButton() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Button dimensions and position
        const buttonWidth = 80;
        const buttonHeight = 40;
        const buttonX = width - buttonWidth - 20;
        const buttonY = height - buttonHeight - 20;
        
        // Create button background
        this.playerButton = this.add.graphics();
        this.playerButton.setDepth(1500);
        
        // Button styling
        this.playerButton.fillStyle(0x4a90e2, 0.9);
        this.playerButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
        this.playerButton.lineStyle(2, 0x6bb6ff, 0.8);
        this.playerButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
        
        // Button text
        this.playerButtonText = this.add.text(buttonX + buttonWidth/2, buttonY + buttonHeight/2, '👤 Player', {
            fontSize: '14px',
            fontWeight: 'bold',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.playerButtonText.setDepth(1501);
        
        // Make button interactive
        const buttonHitArea = this.add.rectangle(buttonX + buttonWidth/2, buttonY + buttonHeight/2, buttonWidth, buttonHeight, 0x000000, 0);
        buttonHitArea.setDepth(1502);
        buttonHitArea.setInteractive({ useHandCursor: true });
        
        // Button hover effects
        buttonHitArea.on('pointerover', () => {
            this.playerButton.clear();
            this.playerButton.fillStyle(0x5ba0f2, 0.9);
            this.playerButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
            this.playerButton.lineStyle(2, 0x7bc6ff, 0.8);
            this.playerButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
            this.playerButtonText.setScale(1.05);
        });
        
        buttonHitArea.on('pointerout', () => {
            this.playerButton.clear();
            this.playerButton.fillStyle(0x4a90e2, 0.9);
            this.playerButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
            this.playerButton.lineStyle(2, 0x6bb6ff, 0.8);
            this.playerButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
            this.playerButtonText.setScale(1.0);
        });
        
        // Button click handler
        buttonHitArea.on('pointerdown', () => {
            // Visual feedback
            this.playerButton.clear();
            this.playerButton.fillStyle(0x3a80d2, 0.9);
            this.playerButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
            this.playerButton.lineStyle(2, 0x5ba0f2, 0.8);
            this.playerButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
            this.playerButtonText.setScale(0.95);
            
            // Open progression UI
            this.playerProgressionUI.show();
            
            // Reset button appearance after click
            this.time.delayedCall(100, () => {
                this.playerButton.clear();
                this.playerButton.fillStyle(0x4a90e2, 0.9);
                this.playerButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
                this.playerButton.lineStyle(2, 0x6bb6ff, 0.8);
                this.playerButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
                this.playerButtonText.setScale(1.0);
            });
        });
        
        // Store references for cleanup
        this.playerButtonHitArea = buttonHitArea;
        
        console.log('GameScene: Player button created in lower right corner');
    }

    createCollectionButton() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Button dimensions and position (next to Player button)
        const buttonWidth = 90;
        const buttonHeight = 40;
        const buttonX = width - buttonWidth - 110; // 110 = 80 (player button width) + 20 (margin) + 10 (spacing)
        const buttonY = height - buttonHeight - 20;
        
        // Create button background
        this.collectionButton = this.add.graphics();
        this.collectionButton.setDepth(1500);
        
        // Button styling
        this.collectionButton.fillStyle(0xe24a90, 0.9); // Different color to distinguish from Player button
        this.collectionButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
        this.collectionButton.lineStyle(2, 0xff6bb6, 0.8);
        this.collectionButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
        
        // Button text
        this.collectionButtonText = this.add.text(buttonX + buttonWidth/2, buttonY + buttonHeight/2, '🐟 Collection', {
            fontSize: '14px',
            fontWeight: 'bold',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.collectionButtonText.setDepth(1501);
        
        // Make button interactive
        const buttonHitArea = this.add.rectangle(buttonX + buttonWidth/2, buttonY + buttonHeight/2, buttonWidth, buttonHeight, 0x000000, 0);
        buttonHitArea.setDepth(1502);
        buttonHitArea.setInteractive({ useHandCursor: true });
        
        // Button hover effects
        buttonHitArea.on('pointerover', () => {
            this.collectionButton.clear();
            this.collectionButton.fillStyle(0xf25ba0, 0.9);
            this.collectionButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
            this.collectionButton.lineStyle(2, 0xff7bc6, 0.8);
            this.collectionButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
            this.collectionButtonText.setScale(1.05);
        });
        
        buttonHitArea.on('pointerout', () => {
            this.collectionButton.clear();
            this.collectionButton.fillStyle(0xe24a90, 0.9);
            this.collectionButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
            this.collectionButton.lineStyle(2, 0xff6bb6, 0.8);
            this.collectionButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
            this.collectionButtonText.setScale(1.0);
        });
        
        // Button click handler
        buttonHitArea.on('pointerdown', () => {
            // Visual feedback
            this.collectionButton.clear();
            this.collectionButton.fillStyle(0xd23a80, 0.9);
            this.collectionButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
            this.collectionButton.lineStyle(2, 0xf25ba0, 0.8);
            this.collectionButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
            this.collectionButtonText.setScale(0.95);
            
            // Open fish collection UI
            this.fishCollectionUI.show();
            
            // Reset button appearance after click
            this.time.delayedCall(100, () => {
                this.collectionButton.clear();
                this.collectionButton.fillStyle(0xe24a90, 0.9);
                this.collectionButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
                this.collectionButton.lineStyle(2, 0xff6bb6, 0.8);
                this.collectionButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
                this.collectionButtonText.setScale(1.0);
            });
        });
        
        // Store references for cleanup
        this.collectionButtonHitArea = buttonHitArea;
        
        console.log('GameScene: Collection button created next to Player button');
    }
} 