import Phaser from 'phaser';
import GameState from '../scripts/GameState.js';
import GameLoop from '../scripts/GameLoop.js';
import SceneManager from '../scripts/SceneManager.js';
import { InventoryUI } from '../ui/InventoryUI.js';
import { CraftingUI } from '../ui/CraftingUI.js';
import { PlayerProgressionUI } from '../ui/PlayerProgressionUI.js';
import { FishCollectionUI } from '../ui/FishCollectionUI.js';

export default class BoatMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BoatMenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        try {
            // Get instances
            this.gameState = GameState.getInstance();
            this.gameLoop = new GameLoop(this);
            this.sceneManager = SceneManager.getInstance();

            // Initialize audio for this scene
            this.audioManager = this.gameState.getAudioManager(this);
            if (this.audioManager) {
                this.audioManager.setSceneAudio('BoatMenuScene');
            } else {
                console.warn('BoatMenuScene: Audio manager not available');
            }

            // Background
            this.createBackground(width, height);
            
            // UI Elements
            this.createStatusDisplay(width, height);
            this.createActionButtons(width, height);
            this.createProgressDisplay(width, height);
            
            // Create UI components with error handling
            try {
                this.playerProgressionUI = new PlayerProgressionUI(this, 50, 50, 900, 700);
                console.log('BoatMenuScene: PlayerProgressionUI created successfully');
            } catch (error) {
                console.error('BoatMenuScene: Error creating PlayerProgressionUI:', error);
                this.playerProgressionUI = null;
            }
            
            try {
                this.fishCollectionUI = new FishCollectionUI(this, 50, 50, 900, 650);
                console.log('BoatMenuScene: FishCollectionUI created successfully');
            } catch (error) {
                console.error('BoatMenuScene: Error creating FishCollectionUI:', error);
                this.fishCollectionUI = null;
            }
            
            // Create Player button in lower right corner
            this.createPlayerButton(width, height);
            
            // Create Collection button next to Player button
            this.createCollectionButton(width, height);
            
            // Event listeners
            this.setupEventListeners();
            
            // Initialize game loop
            if (this.gameLoop) {
                this.gameLoop.startGameLoop();
                console.log('BoatMenuScene: GameLoop started successfully');
            } else {
                console.error('BoatMenuScene: GameLoop is null, cannot start');
            }
            
            // Initialize UI with current game state
            this.updateStatus();
            
            console.log('BoatMenuScene: Central game loop hub created with audio integration');
        } catch (error) {
            console.error('BoatMenuScene: Critical error during scene creation:', error);
            // Try to show an error message to the user
            this.add.text(width / 2, height / 2, 'Error loading Boat Menu\nCheck console for details', {
                fontSize: '24px',
                fill: '#ff0000',
                align: 'center',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5);
        }
    }

    createBackground(width, height) {
        // Create a more dynamic ocean background with multiple layers
        // Deep ocean layer
        const deepOcean = this.add.graphics();
        deepOcean.fillGradientStyle(0x001a33, 0x001a33, 0x003366, 0x003366, 1);
        deepOcean.fillRect(0, 0, width, height);
        
        // Add wave patterns
        for (let i = 0; i < 5; i++) {
            const waveY = height * 0.2 + (i * 40);
            const wave = this.add.graphics();
            wave.lineStyle(2, 0x0066cc, 0.3);
            
            // Create wavy pattern
            let wavePoints = [];
            for (let x = 0; x < width + 20; x += 20) {
                wavePoints.push(new Phaser.Math.Vector2(
                    x, 
                    waveY + Math.sin(x * 0.01) * 10
                ));
            }
            
            wave.strokePoints(wavePoints);
        }
        
        // Boat deck with wood texture effect
        const boatDeck = this.add.graphics();
        boatDeck.fillStyle(0x8B4513);
        boatDeck.fillRect(0, height * 0.7, width, height * 0.3);
        
        // Add wood grain texture to deck
        for (let i = 0; i < 15; i++) {
            const grainLine = this.add.graphics();
            grainLine.lineStyle(1, 0x654321, 0.5);
            grainLine.lineBetween(
                0, 
                height * 0.7 + (i * 15), 
                width, 
                height * 0.7 + (i * 15) + Math.sin(i) * 5
            );
        }
        
        // Boat railing with metallic effect
        const boatRailing = this.add.graphics();
        boatRailing.fillStyle(0x8B4513);
        boatRailing.fillRect(0, height * 0.7, width, 12);
        
        // Add metallic highlights to railing
        const railingHighlight = this.add.graphics();
        railingHighlight.fillStyle(0xA67D5D, 0.7);
        railingHighlight.fillRect(0, height * 0.7 + 2, width, 3);
        
        // Title with glow effect
        const titleGlow = this.add.graphics();
        titleGlow.fillStyle(0x00aaff, 0.2);
        titleGlow.fillCircle(width / 2, 60, 120);
        
        const title = this.add.text(width / 2, 60, 'LUXURY ANGLER', {
            fontSize: '36px',
            fill: '#ffffff',
            fontFamily: 'Georgia, serif',
            fontStyle: 'bold',
            stroke: '#003366',
            strokeThickness: 4,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 5, fill: true }
        }).setOrigin(0.5);
        
        // Animate title
        this.tweens.add({
            targets: title,
            y: 65,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        this.add.text(width / 2, 105, 'Boat Command Center', {
            fontSize: '20px',
            fill: '#aaddff',
            fontFamily: 'Arial',
            fontStyle: 'italic'
        }).setOrigin(0.5);
    }

    createStatusDisplay(width, height) {
        // Create a more stylish status panel with rounded corners and transparency
        const statusPanel = this.add.graphics();
        statusPanel.fillStyle(0x001a33, 0.8);
        statusPanel.fillRoundedRect(20, 130, width - 40, 120, 15);
        statusPanel.lineStyle(3, 0x00aaff);
        statusPanel.strokeRoundedRect(20, 130, width - 40, 120, 15);
        
        // Add panel header
        const panelHeader = this.add.graphics();
        panelHeader.fillStyle(0x00aaff, 0.8);
        panelHeader.fillRoundedRect(20, 130, width - 40, 25, { tl: 15, tr: 15, bl: 0, br: 0 });
        
        this.add.text(width / 2, 142, 'VESSEL STATUS', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Status icons and text with improved styling
        const textY = 165;
        
        // Location icon and text
        const locationIcon = this.add.graphics();
        locationIcon.fillStyle(0x00aaff);
        locationIcon.fillCircle(40, textY + 10, 8);
        locationIcon.lineStyle(2, 0xffffff);
        locationIcon.lineBetween(40, textY + 5, 40, textY + 15);
        locationIcon.lineBetween(35, textY + 10, 45, textY + 10);
        
        this.locationText = this.add.text(60, textY, 'Location: Starting Port', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        // Time icon and text
        const timeIcon = this.add.graphics();
        timeIcon.fillStyle(0x00aaff);
        timeIcon.fillCircle(40, textY + 35, 8);
        timeIcon.lineStyle(2, 0xffffff);
        timeIcon.lineBetween(40, textY + 35, 40 + 5, textY + 35);
        timeIcon.lineBetween(40, textY + 35, 40, textY + 30);
        
        this.timeText = this.add.text(60, textY + 25, 'Time: Dawn', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        // Weather icon and text
        const weatherIcon = this.add.graphics();
        weatherIcon.fillStyle(0x00aaff);
        weatherIcon.fillCircle(40, textY + 60, 8);
        weatherIcon.fillStyle(0xffff00);
        weatherIcon.fillCircle(40, textY + 60, 4);
        
        this.weatherText = this.add.text(60, textY + 50, 'Weather: Sunny', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        // Energy icon and text
        const energyIcon = this.add.graphics();
        energyIcon.fillStyle(0x00aaff);
        energyIcon.fillCircle(40, textY + 85, 8);
        energyIcon.fillStyle(0xffff00);
        energyIcon.fillRect(37, textY + 80, 6, 10);
        
        this.energyText = this.add.text(60, textY + 75, 'Energy: 100/100', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        // Right side status with icons
        // Fishtank icon and text
        const fishtankIcon = this.add.graphics();
        fishtankIcon.fillStyle(0x00aaff);
        fishtankIcon.fillCircle(width - 180, textY + 10, 8);
        fishtankIcon.lineStyle(2, 0xffffff);
        fishtankIcon.strokeCircle(width - 180, textY + 10, 5);
        
        this.fishtankText = this.add.text(width - 160, textY, 'Fishtank: 0/10', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        // Level icon and text
        const levelIcon = this.add.graphics();
        levelIcon.fillStyle(0x00aaff);
        levelIcon.fillCircle(width - 180, textY + 35, 8);
        levelIcon.lineStyle(2, 0xffffff);
        levelIcon.lineBetween(width - 184, textY + 35, width - 176, textY + 35);
        levelIcon.lineBetween(width - 180, textY + 31, width - 180, textY + 39);
        
        this.levelText = this.add.text(width - 160, textY + 25, 'Level: 1', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        // Money icon and text
        const moneyIcon = this.add.graphics();
        moneyIcon.fillStyle(0x00aaff);
        moneyIcon.fillCircle(width - 180, textY + 60, 8);
        moneyIcon.lineStyle(2, 0xffff00);
        moneyIcon.strokeCircle(width - 180, textY + 60, 5);
        
        this.moneyText = this.add.text(width - 160, textY + 50, 'Coins: 1000', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        // Mode icon and text
        const modeIcon = this.add.graphics();
        modeIcon.fillStyle(0x00aaff);
        modeIcon.fillCircle(width - 180, textY + 85, 8);
        modeIcon.lineStyle(2, 0xffffff);
        modeIcon.lineBetween(width - 184, textY + 81, width - 176, textY + 89);
        modeIcon.lineBetween(width - 184, textY + 89, width - 176, textY + 81);
        
        this.modeText = this.add.text(width - 160, textY + 75, 'Mode: Story', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
    }

    createActionButtons(width, height) {
        const buttonY = height * 0.75;
        const buttonSpacing = (width - 100) / 5;
        
        // Create a button container for visual grouping
        const buttonContainer = this.add.graphics();
        buttonContainer.fillStyle(0x001a33, 0.7);
        buttonContainer.fillRoundedRect(20, buttonY - 30, width - 40, 70, 15);
        buttonContainer.lineStyle(2, 0x00aaff);
        buttonContainer.strokeRoundedRect(20, buttonY - 30, width - 40, 70, 15);
        
        // Action buttons with improved styling
        this.buttons = {};
        
        // Travel button
        this.buttons.travel = this.createActionButton(50 + buttonSpacing * 0, buttonY, 'TRAVEL', () => {
            this.openTravelMenu();
        }, 0x00aaff);
        
        // Fish button
        this.buttons.fish = this.createActionButton(50 + buttonSpacing * 1, buttonY, 'FISH', () => {
            this.startFishing();
        }, 0x00cc66);
        
        // Chatroom button
        this.buttons.chatroom = this.createActionButton(50 + buttonSpacing * 2, buttonY, 'CHAT', () => {
            this.openChatroom();
        }, 0xff9900);
        
        // Inventory button
        this.buttons.inventory = this.createActionButton(50 + buttonSpacing * 3, buttonY, 'INVENTORY', () => {
            this.openInventory();
        }, 0xcc66ff);
        
        // Crafting button - Now accessed through Inventory UI
        /* this.buttons.crafting = this.createActionButton(50 + buttonSpacing * 4, buttonY, 'CRAFT', () => {
            this.openCrafting();
        }, 0xff6666); */
        
        // Shop button
        this.buttons.shop = this.createActionButton(50 + buttonSpacing * 4, buttonY, 'SHOP', () => {
            this.openShop();
        }, 0xffcc00);
        
        // Mode toggle button with improved styling
        this.modeButton = this.createActionButton(width / 2, buttonY + 60, 'STORY MODE', () => {
            this.toggleMode();
        }, 0x9933cc);
        
        // Return to port button (conditional)
        this.returnButton = this.createActionButton(width / 2, buttonY + 100, 'RETURN TO PORT', () => {
            this.returnToPort();
        }, 0xff3333);
        this.returnButton.button.setVisible(false);
        this.returnButton.text.setVisible(false);
    }

    createProgressDisplay(width, height) {
        // Progress panel with improved styling
        const progressPanel = this.add.graphics();
        progressPanel.fillStyle(0x001a33, 0.8);
        progressPanel.fillRoundedRect(20, height - 150, width - 40, 80, 15);
        progressPanel.lineStyle(3, 0x00cc66);
        progressPanel.strokeRoundedRect(20, height - 150, width - 40, 80, 15);
        
        // Add panel header
        const progressHeader = this.add.graphics();
        progressHeader.fillStyle(0x00cc66, 0.8);
        progressHeader.fillRoundedRect(20, height - 150, width - 40, 25, { tl: 15, tr: 15, bl: 0, br: 0 });
        
        this.add.text(width / 2, height - 138, 'PROGRESSION STATUS', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Progress bars with improved styling
        this.levelProgressBar = this.createProgressBar(40, height - 115, width - 80, 'Level Progress', 0x00aaff);
        this.collectionProgressBar = this.createProgressBar(40, height - 95, width - 80, 'Fish Collection', 0xff9900);
    }

    createActionButton(x, y, text, callback, color = 0x3498db) {
        const button = this.add.graphics();
        button.fillStyle(color);
        button.fillRoundedRect(-60, -20, 120, 40, 10);
        
        // Add gradient effect
        const highlight = this.add.graphics();
        highlight.fillStyle(0xffffff, 0.2);
        highlight.fillRoundedRect(-60, -20, 120, 20, { tl: 10, tr: 10, bl: 0, br: 0 });
        highlight.setPosition(x, y);
        
        // Add shadow
        const shadow = this.add.graphics();
        shadow.fillStyle(0x000000, 0.3);
        shadow.fillRoundedRect(-58, -18, 116, 38, 8);
        shadow.setPosition(x + 2, y + 2);
        
        // Create darker colors manually using bit operations
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;
        
        const darkerColor = (Math.max(0, r - 40) << 16) | (Math.max(0, g - 40) << 8) | Math.max(0, b - 40);
        const darkestColor = (Math.max(0, r - 80) << 16) | (Math.max(0, g - 80) << 8) | Math.max(0, b - 80);
        
        button.lineStyle(2, darkerColor);
        button.strokeRoundedRect(-60, -20, 120, 40, 10);
        button.setPosition(x, y);
        
        const buttonText = this.add.text(x, y, text, {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        
        // Make interactive with improved hover effects
        button.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);
        
        button.on('pointerover', () => {
            button.clear();
            button.fillStyle(darkerColor);
            button.fillRoundedRect(-60, -20, 120, 40, 10);
            button.lineStyle(2, darkestColor);
            button.strokeRoundedRect(-60, -20, 120, 40, 10);
            
            // Scale up slightly
            button.setScale(1.05);
            buttonText.setScale(1.05);
            highlight.setScale(1.05);
        });
        
        button.on('pointerout', () => {
            button.clear();
            button.fillStyle(color);
            button.fillRoundedRect(-60, -20, 120, 40, 10);
            button.lineStyle(2, darkerColor);
            button.strokeRoundedRect(-60, -20, 120, 40, 10);
            
            // Reset scale
            button.setScale(1);
            buttonText.setScale(1);
            highlight.setScale(1);
        });
        
        button.on('pointerdown', () => {
            try {
                // Press effect
                button.setScale(0.95);
                buttonText.setScale(0.95);
                highlight.setScale(0.95);
                
                // Call the callback after a short delay for button press effect
                this.time.delayedCall(100, () => {
                    button.setScale(1);
                    buttonText.setScale(1);
                    highlight.setScale(1);
                    callback();
                });
            } catch (error) {
                console.error('BoatMenuScene: Error in button click:', error);
                this.showErrorMessage('Error processing button action');
            }
        });
        
        return { button, text: buttonText, highlight };
    }

    createProgressBar(x, y, width, label, color = 0x27ae60) {
        // Background with rounded corners
        const bg = this.add.graphics();
        bg.fillStyle(0x2c3e50);
        bg.fillRoundedRect(x, y, width, 15, 7);
        bg.lineStyle(1, 0x34495e);
        bg.strokeRoundedRect(x, y, width, 15, 7);
        
        // Progress fill with rounded corners
        const fill = this.add.graphics();
        fill.fillStyle(color);
        
        // Label with improved styling
        const labelText = this.add.text(x, y - 18, label, {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        
        return { bg, fill, label: labelText, x, y, width, radius: 7, color };
    }

    setupEventListeners() {
        // Game loop events
        this.events.on('gameloop:boatMenu', (data) => {
            this.updateStatus(data);
        });
        
        this.events.on('gameloop:travel', (data) => {
            this.showTravelFeedback(data);
        });
        
        this.events.on('gameloop:fishCaught', (data) => {
            this.showFishCaughtFeedback(data);
        });
        
        this.events.on('gameloop:levelUp', (data) => {
            this.showLevelUpFeedback(data);
        });
        
        this.events.on('gameloop:fishtankFull', () => {
            this.showFiretankFullWarning();
        });
        
        this.events.on('gameloop:lowEnergy', () => {
            this.showLowEnergyWarning();
        });
        
        this.events.on('gameloop:weatherChange', (data) => {
            this.showWeatherChange(data);
        });
        
        // Input events
        this.input.keyboard.on('keydown-ESC', () => {
            this.sceneManager.goToMenu(this);
        });
        
        // Debug: Add F5 key to reset fish inventory for testing
        this.input.keyboard.on('keydown-F5', () => {
            console.log('BoatMenuScene: F5 pressed - resetting fish inventory for testing');
            this.gameState.forceResetFishInventory();
            this.showSuccessMessage('Fish inventory reset! 5 trout cards added.');
            
            // Refresh inventory UI if open
            if (this.inventoryUI && this.inventoryUI.isVisible) {
                this.inventoryUI.refreshItems();
            }
            
            // Refresh crafting UI if open
            if (this.craftingUI && this.craftingUI.isVisible) {
                this.craftingUI.refreshRecipes();
            }
        });
        
        // Debug: Add F6 key to debug current fish inventory
        this.input.keyboard.on('keydown-F6', () => {
            console.log('BoatMenuScene: F6 pressed - debugging fish inventory');
            const fishInventory = this.gameState.debugFishInventory();
            this.showInfoMessage(`Fish inventory: ${fishInventory.length} types. Check console for details.`);
        });
        
        // Debug: Add F7 key to add 50,000 coins for testing
        this.input.keyboard.on('keydown-F7', () => {
            console.log('BoatMenuScene: F7 pressed - adding 50,000 coins for testing');
            const newTotal = this.gameState.forceAddTestingCoins();
            this.showSuccessMessage(`Added 50,000 coins! Total: ${newTotal}`);
            
            // Update the money display immediately
            this.updateStatus();
        });
        
        // Debug: Add F8 key to set player level to 15 for testing
        this.input.keyboard.on('keydown-F8', () => {
            console.log('BoatMenuScene: F8 pressed - setting player level to 15 for testing');
            const newLevel = this.gameState.forceSetTestingLevel();
            this.showSuccessMessage(`Player level set to ${newLevel}!`);
            
            // Update the level display immediately
            this.updateStatus();
            
            // Refresh crafting UI if open to update craft button states
            if (this.craftingUI && this.craftingUI.isVisible) {
                this.craftingUI.refreshRecipes();
            }
        });
    }

    // Action handlers
    openTravelMenu() {
        console.log('BoatMenuScene: Opening travel menu');
        this.audioManager?.playSFX('button');
        
        // Create travel selection overlay
        this.createTravelOverlay();
    }

    startFishing() {
        console.log('BoatMenuScene: Starting fishing');
        this.audioManager?.playSFX('button');
        
        if (this.gameLoop.initiateFishing(this.gameLoop.currentMode)) {
            // Switch to game scene for fishing
            this.scene.start('GameScene');
        } else {
            this.audioManager?.playSFX('fail');
            this.showErrorMessage('Cannot fish: Check energy, location, or fishtank capacity');
        }
    }

    openChatroom() {
        console.log('BoatMenuScene: Opening chatroom');
        this.audioManager?.playSFX('button');
        this.gameLoop.enterChatroom();
        // TODO: Implement chatroom scene or overlay
        this.showInfoMessage('Chatroom feature coming soon!');
    }

    openInventory() {
        console.log('BoatMenuScene: Opening inventory');
        this.audioManager?.playSFX('button');
        this.gameLoop.enterInventory();
        
        // Add sample items for testing (only if inventory is mostly empty)
        const totalItems = Object.values(this.gameState.inventory).reduce((sum, items) => sum + items.length, 0);
        if (totalItems < 10) {
            console.log('BoatMenuScene: Adding sample items for testing');
            this.gameState.inventoryManager.addSampleItems();
        }
        
        // Ensure both UIs are created and cross-referenced
        this.ensureUIsCreated();
        
        // Show the inventory UI
        this.inventoryUI.show();
    }

    openCrafting() {
        console.log('BoatMenuScene: Opening crafting workshop');
        this.audioManager?.playSFX('button');
        
        // Ensure both UIs are created and cross-referenced
        this.ensureUIsCreated();
        
        // Show the crafting UI
        this.craftingUI.show();
    }

    openShop() {
        console.log('BoatMenuScene: Opening shop');
        this.audioManager?.playSFX('button');
        
        if (this.gameLoop.enterShop()) {
            this.scene.start('ShopScene');
        } else {
            this.audioManager?.playSFX('fail');
            this.showErrorMessage('Shop only available at Starting Port');
        }
    }

    toggleMode() {
        this.audioManager?.playSFX('button');
        this.gameLoop.currentMode = this.gameLoop.currentMode === 'story' ? 'practice' : 'story';
        this.modeButton.text.setText(this.gameLoop.currentMode.toUpperCase() + ' MODE');
        this.modeText.setText(`Mode: ${this.gameLoop.currentMode.charAt(0).toUpperCase() + this.gameLoop.currentMode.slice(1)}`);
        
        console.log(`BoatMenuScene: Switched to ${this.gameLoop.currentMode} mode`);
    }

    returnToPort() {
        console.log('BoatMenuScene: Returning to port');
        this.audioManager?.playSFX('button');
        this.gameLoop.initiateTravel('Starting', 'Port');
    }

    // UI update methods
    updateStatus(data) {
        // Provide default values if data is missing
        const statusData = data || {};
        
        this.locationText.setText(`Location: ${statusData.location || 'Starting Port'}`);
        this.timeText.setText(`Time: ${statusData.time || 'Dawn'}`);
        this.weatherText.setText(`Weather: ${statusData.weather || 'Sunny'}`);
        const maxEnergy = this.gameState.getPlayerAttribute('energy') || 100; // Use player attribute or default
        this.energyText.setText(`Energy: ${statusData.energy || this.gameState.player.energy || 100}/${maxEnergy}`);
        
        const fishtankCount = this.gameState.inventory.fish.length;
        const fishtankMax = this.gameState.getBoatAttribute('fishtankStorage') || 10;
        this.fishtankText.setText(`Fishtank: ${fishtankCount}/${fishtankMax}`);
        
        this.levelText.setText(`Level: ${this.gameState.player.level}`);
        this.moneyText.setText(`Coins: ${this.gameState.player.money}`);
        
        // Update button availability
        this.updateButtonStates(statusData);
        
        // Update progress bars
        this.updateProgressBars();
    }

    updateButtonStates(data) {
        // Enable/disable buttons based on available actions
        const actions = data.availableActions || ['travel', 'fish', 'chatroom', 'inventory', 'shop']; // Default to all actions available
        
        this.buttons.travel.button.setAlpha(actions.includes('travel') ? 1 : 0.5);
        this.buttons.fish.button.setAlpha(actions.includes('fish') ? 1 : 0.5);
        this.buttons.shop.button.setAlpha(actions.includes('shop') ? 1 : 0.5);
        
        // Show/hide return button
        const canShop = data.canShop !== undefined ? data.canShop : true; // Default to can shop
        const location = data.location || 'Starting Port';
        const shouldShowReturn = !canShop && location !== 'Starting Port';
        this.returnButton.button.setVisible(shouldShowReturn);
        this.returnButton.text.setVisible(shouldShowReturn);
    }

    updateProgressBars() {
        // Calculate progression manually since getProgressionStatus doesn't exist
        const player = this.gameState.player;
        
        // Level progress (experience towards next level)
        const levelProgress = player.experience / (player.experience + player.experienceToNext);
        
        // Collection progress (fish caught vs some target)
        const fishCaught = this.gameState.inventory.fish.length;
        const collectionTarget = 50; // Arbitrary target for now
        const collectionProgress = Math.min(fishCaught / collectionTarget, 1);
        
        // Update progress bars
        this.updateProgressBar(this.levelProgressBar, levelProgress);
        this.updateProgressBar(this.collectionProgressBar, collectionProgress);
    }

    updateProgressBar(progressBar, progress) {
        progressBar.fill.clear();
        progressBar.fill.fillStyle(progressBar.color);
        
        // Only use rounded corners if progress is enough to show them
        if (progress * progressBar.width > progressBar.radius * 2) {
            progressBar.fill.fillRoundedRect(
                progressBar.x, 
                progressBar.y, 
                progressBar.width * progress, 
                15, 
                progressBar.radius
            );
        } else {
            progressBar.fill.fillRect(
                progressBar.x, 
                progressBar.y, 
                progressBar.width * progress, 
                15
            );
        }
        
        // Add shimmer effect
        if (progress > 0.05) {
            const shimmer = this.add.graphics();
            shimmer.fillStyle(0xffffff, 0.3);
            shimmer.fillRect(
                progressBar.x, 
                progressBar.y, 
                2, 
                15
            );
            
            // Animate the shimmer
            this.tweens.add({
                targets: shimmer,
                x: progressBar.x + (progressBar.width * progress) - 2,
                duration: 1000,
                ease: 'Sine.easeInOut',
                onComplete: () => shimmer.destroy()
            });
        }
    }

    // Feedback methods
    showTravelFeedback(data) {
        this.audioManager?.playSFX('notification');
        this.showInfoMessage(`Traveling to ${data.destination}...`);
    }

    showFishCaughtFeedback(data) {
        this.audioManager?.playSFX('catch');
        this.audioManager?.playSFX('coin');
        this.showSuccessMessage(`Caught ${data.fish.name}! +${data.fish.coinValue} coins`);
    }

    showLevelUpFeedback(data) {
        this.audioManager?.playSFX('levelup');
        this.showSuccessMessage(`LEVEL UP! Now level ${data.newLevel}!`);
    }

    showFiretankFullWarning() {
        this.audioManager?.playSFX('notification');
        this.showWarningMessage('Fishtank is full! Return to port to sell fish.');
    }

    showLowEnergyWarning() {
        this.audioManager?.playSFX('notification');
        this.showWarningMessage('Energy is low! Consider resting or using energy items.');
    }

    showWeatherChange(data) {
        this.showInfoMessage(`Weather changed to ${data.newWeather}`);
    }

    // Message system
    showInfoMessage(text) {
        this.showMessage(text, 0x3498db);
    }

    showSuccessMessage(text) {
        this.showMessage(text, 0x27ae60);
    }

    showWarningMessage(text) {
        this.showMessage(text, 0xf39c12);
    }

    showErrorMessage(text) {
        this.showMessage(text, 0xe74c3c);
    }

    showMessage(text, color) {
        // Create message container with improved styling
        const messageContainer = this.add.graphics();
        messageContainer.fillStyle(color, 0.9);
        messageContainer.fillRoundedRect(-200, -40, 400, 80, 15);
        messageContainer.lineStyle(3, 0xffffff, 0.5);
        messageContainer.strokeRoundedRect(-200, -40, 400, 80, 15);
        messageContainer.setPosition(this.cameras.main.width / 2, this.cameras.main.height / 2);
        
        // Add highlight effect
        const highlight = this.add.graphics();
        highlight.fillStyle(0xffffff, 0.2);
        highlight.fillRoundedRect(-200, -40, 400, 20, { tl: 15, tr: 15, bl: 0, br: 0 });
        highlight.setPosition(this.cameras.main.width / 2, this.cameras.main.height / 2);
        
        const message = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            text,
            {
                fontSize: '18px',
                fill: '#ffffff',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2,
                align: 'center',
                wordWrap: { width: 380 }
            }
        );
        message.setOrigin(0.5);

        // Animate in
        messageContainer.setAlpha(0);
        highlight.setAlpha(0);
        message.setAlpha(0);
        
        this.tweens.add({
            targets: [messageContainer, highlight, message],
            alpha: 1,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // Then animate out
                this.tweens.add({
                    targets: [messageContainer, highlight, message],
                    alpha: 0,
                    y: '-=50',
                    duration: 2000,
                    delay: 1000,
                    ease: 'Power2',
                    onComplete: () => {
                        messageContainer.destroy();
                        highlight.destroy();
                        message.destroy();
                    }
                });
            }
        });
    }

    createTravelOverlay() {
        // Create travel destination selection overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.8);
        overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        
        const panel = this.add.graphics();
        panel.fillStyle(0x2c3e50);
        panel.fillRect(100, 100, this.cameras.main.width - 200, this.cameras.main.height - 200);
        panel.lineStyle(2, 0x3498db);
        panel.strokeRect(100, 100, this.cameras.main.width - 200, this.cameras.main.height - 200);
        
        this.add.text(this.cameras.main.width / 2, 150, 'SELECT DESTINATION', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Travel destinations
        const destinations = [
            'Starting Port',
            'Coral Cove, Spot 1',
            'Deep Abyss, Spot 1',
            'Tropical Lagoon, Spot 1',
            'Training Lagoon, Spot 1'
        ];
        
        destinations.forEach((dest, index) => {
            const button = this.createActionButton(
                this.cameras.main.width / 2,
                200 + index * 50,
                dest,
                () => {
                    const [map, spot] = dest.split(', ');
                    this.gameLoop.initiateTravel(map, spot || 'Port');
                    overlay.destroy();
                    panel.destroy();
                }
            );
        });
        
        // Close button
        this.createActionButton(
            this.cameras.main.width / 2,
            this.cameras.main.height - 150,
            'CLOSE',
            () => {
                overlay.destroy();
                panel.destroy();
            }
        );
    }

    createPlayerButton(width, height) {
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
            try {
                // Visual feedback
                this.playerButton.clear();
                this.playerButton.fillStyle(0x3a80d2, 0.9);
                this.playerButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
                this.playerButton.lineStyle(2, 0x5ba0f2, 0.8);
                this.playerButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
                this.playerButtonText.setScale(0.95);
                
                // Open progression UI with null check
                if (this.playerProgressionUI && this.playerProgressionUI.show) {
                    this.playerProgressionUI.show();
                } else {
                    console.error('BoatMenuScene: PlayerProgressionUI not available');
                    this.showErrorMessage('Player progression UI not available');
                }
                
                // Reset button appearance after click
                this.time.delayedCall(100, () => {
                    this.playerButton.clear();
                    this.playerButton.fillStyle(0x4a90e2, 0.9);
                    this.playerButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
                    this.playerButton.lineStyle(2, 0x6bb6ff, 0.8);
                    this.playerButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
                    this.playerButtonText.setScale(1.0);
                });
            } catch (error) {
                console.error('BoatMenuScene: Error in player button click:', error);
                this.showErrorMessage('Error opening player progression');
            }
        });
        
        // Store references for cleanup
        this.playerButtonHitArea = buttonHitArea;
        
        console.log('BoatMenuScene: Player button created in lower right corner');
    }

    createCollectionButton(width, height) {
        // Button dimensions and position (next to Player button)
        const buttonWidth = 90;
        const buttonHeight = 40;
        const buttonX = width - buttonWidth - 110; // 110 = 80 (player button width) + 20 (margin) + 10 (spacing)
        const buttonY = height - buttonHeight - 20;
        
        // Create button background
        this.collectionButton = this.add.graphics();
        this.collectionButton.setDepth(1500);
        
        // Button styling (different color from Player button)
        this.collectionButton.fillStyle(0xe24a90, 0.9);
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
            try {
                // Visual feedback
                this.collectionButton.clear();
                this.collectionButton.fillStyle(0xd23a80, 0.9);
                this.collectionButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
                this.collectionButton.lineStyle(2, 0xf25ba0, 0.8);
                this.collectionButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
                this.collectionButtonText.setScale(0.95);
                
                // Open fish collection UI with null check
                if (this.fishCollectionUI && this.fishCollectionUI.show) {
                    this.fishCollectionUI.show();
                } else {
                    console.error('BoatMenuScene: FishCollectionUI not available');
                    this.showErrorMessage('Fish collection UI not available');
                }
                
                // Reset button appearance after click
                this.time.delayedCall(100, () => {
                    this.collectionButton.clear();
                    this.collectionButton.fillStyle(0xe24a90, 0.9);
                    this.collectionButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
                    this.collectionButton.lineStyle(2, 0xff6bb6, 0.8);
                    this.collectionButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
                    this.collectionButtonText.setScale(1.0);
                });
            } catch (error) {
                console.error('BoatMenuScene: Error in collection button click:', error);
                this.showErrorMessage('Error opening fish collection');
            }
        });
        
        // Store references for cleanup
        this.collectionButtonHitArea = buttonHitArea;
        
        console.log('BoatMenuScene: Collection button created next to Player button');
    }

    update() {
        // Update game loop
        if (this.gameLoop) {
            this.gameLoop.update();
        }
    }

    destroy() {
        if (this.inventoryUI) {
            this.inventoryUI.destroy();
        }
        if (this.craftingUI) {
            this.craftingUI.destroy();
        }
        if (this.playerProgressionUI) {
            this.playerProgressionUI.destroy();
        }
        if (this.fishCollectionUI) {
            this.fishCollectionUI.destroy();
        }
        if (this.gameLoop) {
            this.gameLoop.destroy();
        }
        super.destroy();
    }

    ensureUIsCreated() {
        // Create inventory UI if it doesn't exist
        if (!this.inventoryUI) {
            this.inventoryUI = new InventoryUI(this, 100, 50, 800, 600);
        }
        
        // Create crafting UI if it doesn't exist
        if (!this.craftingUI) {
            this.craftingUI = new CraftingUI(this, 50, 50, 900, 600);
        }
        
        // Create fish collection UI if it doesn't exist
        if (!this.fishCollectionUI) {
            this.fishCollectionUI = new FishCollectionUI(this, 50, 50, 900, 650);
        }
        
        // Establish cross-references so UIs can access each other
        // This allows the inventory UI to open crafting UI and vice versa
        console.log('BoatMenuScene: Establishing UI cross-references');
    }
}