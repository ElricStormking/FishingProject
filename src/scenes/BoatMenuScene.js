import Phaser from 'phaser';
import GameState from '../scripts/GameState.js';
import GameLoop from '../scripts/GameLoop.js';
import SceneManager from '../scripts/SceneManager.js';
import { InventoryUI } from '../ui/InventoryUI.js';
import { CraftingUI } from '../ui/CraftingUI.js';

export default class BoatMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BoatMenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Get instances
        this.gameState = GameState.getInstance();
        this.gameLoop = new GameLoop(this);
        this.sceneManager = SceneManager.getInstance();

        // Background
        this.createBackground(width, height);
        
        // UI Elements
        this.createStatusDisplay(width, height);
        this.createActionButtons(width, height);
        this.createProgressDisplay(width, height);
        
        // Event listeners
        this.setupEventListeners();
        
        // Initialize game loop
        this.gameLoop.startGameLoop();
        
        // Initialize UI with current game state
        this.updateStatus();
        
        console.log('BoatMenuScene: Central game loop hub created');
    }

    createBackground(width, height) {
        // Ocean background
        const oceanGradient = this.add.graphics();
        oceanGradient.fillGradientStyle(0x006699, 0x006699, 0x004466, 0x004466, 1);
        oceanGradient.fillRect(0, 0, width, height);
        
        // Boat deck (bottom portion)
        const boatDeck = this.add.graphics();
        boatDeck.fillStyle(0x8B4513);
        boatDeck.fillRect(0, height * 0.7, width, height * 0.3);
        
        // Boat details
        const boatRailing = this.add.graphics();
        boatRailing.fillStyle(0x654321);
        boatRailing.fillRect(0, height * 0.7, width, 8);
        
        // Title
        this.add.text(width / 2, 60, 'LUXURY ANGLER', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.add.text(width / 2, 95, 'Boat Command Center', {
            fontSize: '18px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    createStatusDisplay(width, height) {
        // Status panel background
        const statusPanel = this.add.graphics();
        statusPanel.fillStyle(0x2c3e50, 0.9);
        statusPanel.fillRect(20, 130, width - 40, 120);
        statusPanel.lineStyle(2, 0x3498db);
        statusPanel.strokeRect(20, 130, width - 40, 120);
        
        // Status text elements
        this.locationText = this.add.text(40, 150, 'Location: Starting Port', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        this.timeText = this.add.text(40, 175, 'Time: Dawn', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        this.weatherText = this.add.text(40, 200, 'Weather: Sunny', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        this.energyText = this.add.text(40, 225, 'Energy: 100/100', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        // Right side status
        this.fishtankText = this.add.text(width - 40, 150, 'Fishtank: 0/10', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(1, 0);
        
        this.levelText = this.add.text(width - 40, 175, 'Level: 1', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(1, 0);
        
        this.moneyText = this.add.text(width - 40, 200, 'Coins: 1000', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(1, 0);
        
        this.modeText = this.add.text(width - 40, 225, 'Mode: Story', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(1, 0);
    }

    createActionButtons(width, height) {
        const buttonY = height * 0.75;
        const buttonSpacing = (width - 100) / 6; // Changed from 5 to 6 to accommodate crafting button
        
        // Action buttons
        this.buttons = {};
        
        // Travel button
        this.buttons.travel = this.createActionButton(50 + buttonSpacing * 0, buttonY, 'TRAVEL', () => {
            this.openTravelMenu();
        });
        
        // Fish button
        this.buttons.fish = this.createActionButton(50 + buttonSpacing * 1, buttonY, 'FISH', () => {
            this.startFishing();
        });
        
        // Chatroom button
        this.buttons.chatroom = this.createActionButton(50 + buttonSpacing * 2, buttonY, 'CHAT', () => {
            this.openChatroom();
        });
        
        // Inventory button
        this.buttons.inventory = this.createActionButton(50 + buttonSpacing * 3, buttonY, 'INVENTORY', () => {
            this.openInventory();
        });
        
        // Crafting button
        this.buttons.crafting = this.createActionButton(50 + buttonSpacing * 4, buttonY, 'CRAFT', () => {
            this.openCrafting();
        });
        
        // Shop button
        this.buttons.shop = this.createActionButton(50 + buttonSpacing * 5, buttonY, 'SHOP', () => {
            this.openShop();
        });
        
        // Mode toggle button
        this.modeButton = this.createActionButton(width / 2, buttonY + 60, 'STORY MODE', () => {
            this.toggleMode();
        });
        
        // Return to port button (conditional)
        this.returnButton = this.createActionButton(width / 2, buttonY + 100, 'RETURN TO PORT', () => {
            this.returnToPort();
        });
        this.returnButton.button.setVisible(false);
        this.returnButton.text.setVisible(false);
    }

    createProgressDisplay(width, height) {
        // Progress panel
        const progressPanel = this.add.graphics();
        progressPanel.fillStyle(0x34495e, 0.9);
        progressPanel.fillRect(20, height - 150, width - 40, 80);
        progressPanel.lineStyle(2, 0x27ae60);
        progressPanel.strokeRect(20, height - 150, width - 40, 80);
        
        this.add.text(width / 2, height - 140, 'PROGRESSION STATUS', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Progress bars
        this.levelProgressBar = this.createProgressBar(40, height - 115, width - 80, 'Level Progress');
        this.collectionProgressBar = this.createProgressBar(40, height - 95, width - 80, 'Fish Collection');
    }

    createActionButton(x, y, text, callback) {
        const button = this.add.graphics();
        button.fillStyle(0x3498db);
        button.fillRoundedRect(-60, -20, 120, 40, 8);
        button.lineStyle(2, 0x2980b9);
        button.strokeRoundedRect(-60, -20, 120, 40, 8);
        button.setPosition(x, y);
        
        const buttonText = this.add.text(x, y, text, {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Make interactive
        button.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);
        button.on('pointerover', () => {
            button.clear();
            button.fillStyle(0x2980b9);
            button.fillRoundedRect(-60, -20, 120, 40, 8);
            button.lineStyle(2, 0x3498db);
            button.strokeRoundedRect(-60, -20, 120, 40, 8);
        });
        
        button.on('pointerout', () => {
            button.clear();
            button.fillStyle(0x3498db);
            button.fillRoundedRect(-60, -20, 120, 40, 8);
            button.lineStyle(2, 0x2980b9);
            button.strokeRoundedRect(-60, -20, 120, 40, 8);
        });
        
        button.on('pointerdown', callback);
        
        return { button, text: buttonText };
    }

    createProgressBar(x, y, width, label) {
        // Background
        const bg = this.add.graphics();
        bg.fillStyle(0x2c3e50);
        bg.fillRect(x, y, width, 15);
        bg.lineStyle(1, 0x34495e);
        bg.strokeRect(x, y, width, 15);
        
        // Progress fill
        const fill = this.add.graphics();
        fill.fillStyle(0x27ae60);
        
        // Label
        const labelText = this.add.text(x, y - 18, label, {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        return { bg, fill, label: labelText, x, y, width };
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
    }

    // Action handlers
    openTravelMenu() {
        console.log('BoatMenuScene: Opening travel menu');
        
        // Create travel selection overlay
        this.createTravelOverlay();
    }

    startFishing() {
        console.log('BoatMenuScene: Starting fishing');
        
        if (this.gameLoop.initiateFishing(this.gameLoop.currentMode)) {
            // Switch to game scene for fishing
            this.scene.start('GameScene');
        } else {
            this.showErrorMessage('Cannot fish: Check energy, location, or fishtank capacity');
        }
    }

    openChatroom() {
        console.log('BoatMenuScene: Opening chatroom');
        this.gameLoop.enterChatroom();
        // TODO: Implement chatroom scene or overlay
        this.showInfoMessage('Chatroom feature coming soon!');
    }

    openInventory() {
        console.log('BoatMenuScene: Opening inventory');
        this.gameLoop.enterInventory();
        
        // Create inventory UI overlay if it doesn't exist
        if (!this.inventoryUI) {
            this.inventoryUI = new InventoryUI(this, 100, 50, 800, 600);
        }
        
        // Show the inventory UI
        this.inventoryUI.show();
    }

    openCrafting() {
        console.log('BoatMenuScene: Opening crafting workshop');
        
        // Create crafting UI overlay if it doesn't exist
        if (!this.craftingUI) {
            this.craftingUI = new CraftingUI(this, 50, 50, 900, 600);
        }
        
        // Show the crafting UI
        this.craftingUI.show();
    }

    openShop() {
        console.log('BoatMenuScene: Opening shop');
        
        if (this.gameLoop.enterShop()) {
            this.scene.start('ShopScene');
        } else {
            this.showErrorMessage('Shop only available at Starting Port');
        }
    }

    toggleMode() {
        this.gameLoop.currentMode = this.gameLoop.currentMode === 'story' ? 'practice' : 'story';
        this.modeButton.text.setText(this.gameLoop.currentMode.toUpperCase() + ' MODE');
        this.modeText.setText(`Mode: ${this.gameLoop.currentMode.charAt(0).toUpperCase() + this.gameLoop.currentMode.slice(1)}`);
        
        console.log(`BoatMenuScene: Switched to ${this.gameLoop.currentMode} mode`);
    }

    returnToPort() {
        console.log('BoatMenuScene: Returning to port');
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
        const levelProgress = player.experience / player.experienceToNext;
        
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
        progressBar.fill.fillStyle(0x27ae60);
        progressBar.fill.fillRect(progressBar.x, progressBar.y, progressBar.width * progress, 15);
    }

    // Feedback methods
    showTravelFeedback(data) {
        this.showInfoMessage(`Traveling to ${data.destination}...`);
    }

    showFishCaughtFeedback(data) {
        this.showSuccessMessage(`Caught ${data.fish.name}! +${data.fish.coinValue} coins`);
    }

    showLevelUpFeedback(data) {
        this.showSuccessMessage(`LEVEL UP! Now level ${data.newLevel}!`);
    }

    showFiretankFullWarning() {
        this.showWarningMessage('Fishtank is full! Return to port to sell fish.');
    }

    showLowEnergyWarning() {
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
        const message = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            text,
            {
                fontSize: '18px',
                fill: '#ffffff',
                fontFamily: 'Arial',
                backgroundColor: Phaser.Display.Color.IntegerToColor(color).rgba,
                padding: { x: 16, y: 8 }
            }
        );
        message.setOrigin(0.5);

        this.tweens.add({
            targets: message,
            alpha: 0,
            y: message.y - 50,
            duration: 3000,
            ease: 'Power2',
            onComplete: () => message.destroy()
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
        if (this.gameLoop) {
            this.gameLoop.destroy();
        }
        super.destroy();
    }
} 