import Phaser from 'phaser';
import GameState from '../scripts/GameState.js';
import GameLoop from '../scripts/GameLoop.js';
import SceneManager from '../scripts/SceneManager.js';
import TournamentManager from '../scripts/TournamentManager.js';
import { InventoryUI } from '../ui/InventoryUI.js';
import { CraftingUI } from '../ui/CraftingUI.js';
import { PlayerProgressionUI } from '../ui/PlayerProgressionUI.js';
import { FishCollectionUI } from '../ui/FishCollectionUI.js';
import { MapSelectionUI } from '../ui/MapSelectionUI.js';
import { ShopUI } from '../ui/ShopUI.js';
import { LoadingStateManager } from '../ui/LoadingStateManager.js';

export default class BoatMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BoatMenuScene' });
    }

    create(data) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        console.log('BoatMenuScene: Created with data:', data);
        
        // Handle return from fishing session
        if (data && data.returnedFromFishing) {
            console.log('BoatMenuScene: Returned from fishing session');
            
            // Handle error recovery mode
            if (data.errorRecovery) {
                console.log('BoatMenuScene: Running in error recovery mode');
                this.showErrorMessage('Returned from fishing due to an error. Game state may have been restored.');
            }
            
            // Process fishing session data if available
            if (data.fishingSessionData) {
                console.log('BoatMenuScene: Processing fishing session data:', data.fishingSessionData);
                this.processFishingSessionResults(data.fishingSessionData);
            }
        }
        
        // Get game state and managers with error handling
        try {
            this.gameState = GameState.getInstance();
            
            // Validate game state
            if (!this.gameState) {
                throw new Error('Failed to get GameState instance');
            }
            
            console.log('BoatMenuScene: GameState obtained successfully');
            
            // Initialize player stats to prevent undefined errors
            this.initializePlayerStats();
            
            // Restart auto-save if it was stopped
            this.gameState.startAutoSave();
            
        } catch (gameStateError) {
            console.error('BoatMenuScene: Critical error with GameState:', gameStateError);
            this.showErrorMessage('Game state error: ' + gameStateError.message);
            
            // Try to recover by reloading the page as last resort
            this.time.delayedCall(3000, () => {
                console.log('BoatMenuScene: Attempting page reload for recovery');
                window.location.reload();
            });
            return;
        }
        
        // Initialize managers with error handling
        try {
            this.sceneManager = SceneManager.getInstance();
            this.sceneManager.setCurrentScene(this);
            console.log('BoatMenuScene: SceneManager initialized');
        } catch (sceneManagerError) {
            console.error('BoatMenuScene: Error initializing SceneManager:', sceneManagerError);
            this.sceneManager = null;
        }
        
        try {
            this.gameLoop = new GameLoop(this);
            console.log('BoatMenuScene: GameLoop initialized');
        } catch (gameLoopError) {
            console.error('BoatMenuScene: Error initializing GameLoop:', gameLoopError);
            this.gameLoop = null;
        }
        
        try {
            this.tournamentManager = new TournamentManager(this.gameState);
            console.log('BoatMenuScene: TournamentManager initialized');
            
            // Emit tournament manager ready event for achievement system
            this.events.emit('tournamentManagerReady', this.tournamentManager);
        } catch (tournamentError) {
            console.error('BoatMenuScene: Error initializing TournamentManager:', tournamentError);
            this.tournamentManager = null;
        }
        
        // Initialize audio manager
        try {
            this.audioManager = this.gameState.getAudioManager(this);
            if (this.audioManager) {
                this.audioManager.setSceneAudio('BoatMenuScene');
                console.log('BoatMenuScene: AudioManager initialized');
            }
        } catch (audioError) {
            console.error('BoatMenuScene: Error initializing AudioManager:', audioError);
            this.audioManager = null;
        }
        
        // Initialize LoadingStateManager with error handling
        try {
            this.loadingStateManager = new LoadingStateManager(this);
            console.log('BoatMenuScene: LoadingStateManager initialized');
        } catch (loadingError) {
            console.error('BoatMenuScene: Error initializing LoadingStateManager:', loadingError);
            this.loadingStateManager = null;
        }
        
        // Create scene visuals
        this.createSceneBackground(width, height);
        
        // UI Elements
        this.createStatusDisplay(width, height);
        this.createActionButtons(width, height);
        this.createProgressDisplay(width, height);
        
        // Create UI components with enhanced error handling
        this.createUIComponents();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Create action buttons
        this.createPlayerButton(width, height);
        this.createCollectionButton(width, height);
        
        // Initialize game loop
        if (this.gameLoop) {
            this.gameLoop.enterBoatMenu();
        }
        
        // Show welcome back message if returning from fishing
        if (data && data.returnedFromFishing && !data.errorRecovery) {
            this.time.delayedCall(1000, () => {
                this.showSuccessMessage('Welcome back from your fishing trip!');
            });
        }
        
        console.log('BoatMenuScene: Scene creation completed');
    }

    createSceneBackground(width, height) {
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
        const buttonSpacing = (width - 100) / 6;
        
        // Create a button container for visual grouping
        const buttonContainer = this.add.graphics();
        buttonContainer.fillStyle(0x001a33, 0.7);
        buttonContainer.fillRoundedRect(20, buttonY - 30, width - 40, 70, 15);
        buttonContainer.lineStyle(2, 0x00aaff);
        buttonContainer.strokeRoundedRect(20, buttonY - 30, width - 40, 70, 15);
        
        // Action buttons with improved styling - 6 main action buttons including quest
        this.buttons = {};
        
        // Travel button
        this.buttons.travel = this.createActionButton(50 + buttonSpacing * 0, buttonY, 'TRAVEL', () => {
            this.openTravelMenu();
        }, 0x00aaff);
        
        // Fish button
        this.buttons.fish = this.createActionButton(50 + buttonSpacing * 1, buttonY, 'FISH', () => {
            this.startFishing();
        }, 0x00cc66);
        
        // Cabin button
        this.buttons.cabin = this.createActionButton(50 + buttonSpacing * 2, buttonY, 'CABIN', () => {
            this.openCabin();
        }, 0xff9900);
        
        // Quest button - NEW
        this.buttons.quest = this.createActionButton(50 + buttonSpacing * 3, buttonY, 'QUEST', () => {
            this.openQuest();
        }, 0x9933ff);
        
        // Inventory button
        this.buttons.inventory = this.createActionButton(50 + buttonSpacing * 4, buttonY, 'INVENTORY', () => {
            this.openInventory();
        }, 0xcc66ff);
        
        // Shop button
        this.buttons.shop = this.createActionButton(50 + buttonSpacing * 5, buttonY, 'SHOP', () => {
            this.openShop();
        }, 0xffcc00);
        
        // Tournament button (positioned to avoid overlap, only visible in tournament mode)
        this.buttons.tournament = this.createActionButton(width - 140, buttonY - 60, 'TOURNAMENT', () => {
            this.openTournamentMenu();
        }, 0xff6600);
        
        // Mode toggle button - positioned below main buttons with proper spacing
        this.modeButton = this.createActionButton(width / 2, buttonY + 80, 'STORY MODE', () => {
            this.toggleMode();
        }, 0x9933cc);
        
        // Return to port button (conditional) - positioned below mode button
        this.returnButton = this.createActionButton(width / 2, buttonY + 130, 'RETURN TO PORT', () => {
            this.returnToPort();
        }, 0xff3333);
        this.returnButton.button.setVisible(false);
        this.returnButton.text.setVisible(false);
        
        // Hide tournament button initially (shown only in tournament mode)
        this.buttons.tournament.button.setVisible(false);
        this.buttons.tournament.text.setVisible(false);
    }

    createProgressDisplay(width, height) {
        // Progress panel with improved styling - positioned at left bottom corner to avoid button conflicts
        const panelWidth = 300; // Smaller width to avoid blocking buttons
        const panelHeight = 80;
        const panelX = 20; // Left side of screen
        const panelY = height - panelHeight - 20; // Bottom of screen with margin
        
        const progressPanel = this.add.graphics();
        progressPanel.fillStyle(0x001a33, 0.8);
        progressPanel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 15);
        progressPanel.lineStyle(3, 0x00cc66);
        progressPanel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 15);
        
        // Add panel header
        const progressHeader = this.add.graphics();
        progressHeader.fillStyle(0x00cc66, 0.8);
        progressHeader.fillRoundedRect(panelX, panelY, panelWidth, 25, { tl: 15, tr: 15, bl: 0, br: 0 });
        
        this.add.text(panelX + panelWidth / 2, panelY + 12, 'PROGRESSION STATUS', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Progress bars with improved styling - positioned within the left panel
        this.levelProgressBar = this.createProgressBar(panelX + 10, panelY + 35, panelWidth - 20, 'Level Progress', 0x00aaff);
        this.collectionProgressBar = this.createProgressBar(panelX + 10, panelY + 55, panelWidth - 20, 'Fish Collection', 0xff9900);
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
        
        if (this.mapSelectionUI) {
            this.mapSelectionUI.show();
            console.log('BoatMenuScene: MapSelectionUI opened successfully');
        } else {
            console.error('BoatMenuScene: MapSelectionUI not available');
            this.showErrorMessage('Map selection not available - MapSelectionUI failed to initialize');
        }
    }

    startFishing() {
        console.log('BoatMenuScene: Starting fishing');
        this.audioManager?.playSFX('button');
        
        try {
            // Show loading for fishing preparation
            if (this.loadingStateManager) {
                this.loadingStateManager.showFishingLoading('Preparing fishing equipment...');
            }
            
            // Validate player can fish
            const canFish = this.validateFishingConditions();
            if (!canFish.canFish) {
                // Hide loading on error
                if (this.loadingStateManager) {
                    this.loadingStateManager.hideLoading('fishing_operation');
                }
                
                this.audioManager?.playSFX('fail');
                this.showErrorMessage(canFish.reason);
                return;
            }
            
            // Update loading progress
            if (this.loadingStateManager) {
                this.loadingStateManager.updateProgress('fishing_operation', 50, 'Validating equipment...');
            }
            
            // Update game state for fishing session
            this.prepareFishingSession();
            
            // Show transition message
            this.showSuccessMessage('Preparing fishing equipment...');
            
            // Final loading update
            if (this.loadingStateManager) {
                this.loadingStateManager.updateProgress('fishing_operation', 100, 'Starting fishing session...');
            }
            
            // Transition to GameScene for fishing with proper data
            this.time.delayedCall(1000, () => {
                // Hide loading before scene transition
                if (this.loadingStateManager) {
                    this.loadingStateManager.hideLoading('fishing_operation');
                }
                
                this.scene.start('GameScene', {
                    callingScene: 'BoatMenuScene',
                    mode: this.gameLoop?.currentMode || 'story',
                    location: this.gameState.player.currentLocation,
                    fishingSession: true
                });
                console.log('BoatMenuScene: Transitioned to GameScene for fishing');
            });
            
        } catch (error) {
            console.error('BoatMenuScene: Error starting fishing:', error);
            
            // Hide loading on error
            if (this.loadingStateManager) {
                this.loadingStateManager.hideLoading('fishing_operation');
            }
            
            this.audioManager?.playSFX('fail');
            this.showErrorMessage('Failed to start fishing: ' + error.message);
        }
    }

    validateFishingConditions() {
        try {
            // Validate gameState exists
            if (!this.gameState || !this.gameState.player) {
                return { canFish: false, reason: 'Game state not properly initialized' };
            }
            
            // Initialize player energy if it doesn't exist
            if (typeof this.gameState.player.energy === 'undefined' || this.gameState.player.energy === null) {
                console.log('BoatMenuScene: Initializing player energy to 100');
                this.gameState.player.energy = 100;
            }
            
            // Check energy
            const playerEnergy = this.gameState.player.energy;
            console.log('BoatMenuScene: Checking player energy:', playerEnergy);
            if (playerEnergy < 10) {
                return { canFish: false, reason: `Not enough energy to fish! Energy: ${playerEnergy}/100` };
            }
            
            // Check fishtank capacity
            const fishtankCount = this.gameState.inventory?.fish?.length || 0;
            const fishtankMax = (typeof this.gameState.getBoatAttribute === 'function') 
                ? this.gameState.getBoatAttribute('fishtankStorage') || 10 
                : 10;
            if (fishtankCount >= fishtankMax) {
                return { canFish: false, reason: 'Fishtank is full! Return to port to sell fish.' };
            }
            
            // Check location allows fishing
            const currentLocation = this.gameState.player.currentLocation || 'Unknown';
            const fishableLocations = ['Beginner Lake', 'Ocean Harbor', 'Mountain Stream', 'Midnight Pond', 'Champion\'s Cove', 'Starting Port'];
            if (!fishableLocations.includes(currentLocation)) {
                return { canFish: false, reason: 'Cannot fish at this location: ' + currentLocation };
            }
            
            // Check if player has fishing equipment (optional check since equipment might not be implemented)
            if (typeof this.gameState.getEquippedItem === 'function') {
                const equippedRod = this.gameState.getEquippedItem('rods');
                if (!equippedRod) {
                    console.warn('BoatMenuScene: No fishing rod equipped, but allowing fishing to continue');
                    // Don't block fishing if equipment system isn't fully implemented
                }
            } else {
                console.warn('BoatMenuScene: Equipment system not available, skipping rod check');
            }
            
            return { canFish: true };
            
        } catch (error) {
            console.error('BoatMenuScene: Error validating fishing conditions:', error);
            return { canFish: false, reason: 'Error checking fishing conditions: ' + error.message };
        }
    }

    prepareFishingSession() {
        try {
            // Validate gameState exists
            if (!this.gameState) {
                throw new Error('GameState not available');
            }
            
            // Validate player exists
            if (!this.gameState.player) {
                throw new Error('Player data not available');
            }
            
            // Update player status with safety checks
            this.gameState.player.lastActivity = 'fishing';
            this.gameState.player.currentActivity = 'fishing';
            
            // Save current state before fishing (check if method exists)
            if (typeof this.gameState.save === 'function') {
                this.gameState.save();
                console.log('BoatMenuScene: Game state saved before fishing');
            } else {
                console.warn('BoatMenuScene: save method not available, skipping save');
            }
            
            // Set up fishing session data with safe property access
            const fishingData = {
                startTime: Date.now(),
                location: this.gameState.player.currentLocation || 'Unknown Location',
                mode: this.gameLoop?.currentMode || 'story',
                weather: this.gameState.weather || 'sunny',
                timeOfDay: this.gameState.timeOfDay || 'morning'
            };
            
            // Store fishing session data
            this.gameState.currentFishingSession = fishingData;
            
            console.log('BoatMenuScene: Fishing session prepared successfully:', fishingData);
            
        } catch (error) {
            console.error('BoatMenuScene: Error preparing fishing session:', error);
            throw new Error('Failed to prepare fishing session: ' + error.message);
        }
    }

    openCabin() {
        console.log('BoatMenuScene: Opening cabin');
        this.audioManager?.playSFX('button');
        
        try {
            // Pause current scene and launch Cabin scene to preserve audio state
            // This prevents the audio manager from being destroyed and recreated
            this.scene.pause('BoatMenuScene');
            this.scene.launch('CabinScene', {
                callingScene: 'BoatMenuScene'
            });
            console.log('BoatMenuScene: CabinScene launched (scene paused)');
        } catch (error) {
            console.error('BoatMenuScene: Error launching CabinScene:', error);
            this.showErrorMessage('Failed to open cabin. Check console for details.');
        }
    }

    openInventory() {
        console.log('BoatMenuScene: Opening inventory');
        
        try {
            // Play sound safely
            if (this.audioManager && typeof this.audioManager.playSFX === 'function') {
                this.audioManager.playSFX('button');
            }
            
            // Ensure game loop is properly set up
            if (this.gameLoop && typeof this.gameLoop.enterInventory === 'function') {
                this.gameLoop.enterInventory();
            } else {
                console.warn('BoatMenuScene: GameLoop not available or enterInventory method missing');
            }
            
            // Add sample items for testing (only if inventory is mostly empty)
            try {
                const totalItems = Object.values(this.gameState.inventory || {}).reduce((sum, items) => sum + (items?.length || 0), 0);
                if (totalItems < 10 && this.gameState.inventoryManager && typeof this.gameState.inventoryManager.addSampleItems === 'function') {
                    console.log('BoatMenuScene: Adding sample items for testing');
                    this.gameState.inventoryManager.addSampleItems();
                }
            } catch (sampleError) {
                console.warn('BoatMenuScene: Error adding sample items:', sampleError);
            }
            
            // Ensure both UIs are created and cross-referenced
            this.ensureUIsCreated();
            
            // Show the inventory UI with error handling
            if (this.inventoryUI && typeof this.inventoryUI.show === 'function') {
                // Check if UI is not destroyed before showing
                if (!this.inventoryUI.isDestroyed) {
                    this.inventoryUI.show();
                    console.log('BoatMenuScene: Inventory UI shown successfully');
                } else {
                    console.warn('BoatMenuScene: Inventory UI is destroyed, recreating...');
                    // Recreate the inventory UI
                    this.inventoryUI = null;
                    this.ensureUIsCreated();
                    if (this.inventoryUI && !this.inventoryUI.isDestroyed) {
                        this.inventoryUI.show();
                    } else {
                        throw new Error('Failed to recreate inventory UI');
                    }
                }
            } else {
                throw new Error('Inventory UI not available or show method missing');
            }
            
        } catch (error) {
            console.error('BoatMenuScene: Error opening inventory:', error);
            this.showErrorMessage('Failed to open inventory: ' + error.message);
            
            // Play error sound if available
            if (this.audioManager && typeof this.audioManager.playSFX === 'function') {
                this.audioManager.playSFX('fail');
            }
        }
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
        
        if (this.shopUI) {
            this.shopUI.show();
            console.log('BoatMenuScene: ShopUI opened successfully');
        } else {
            console.error('BoatMenuScene: ShopUI not available');
            this.showErrorMessage('Shop interface not available - ShopUI failed to initialize');
        }
    }

    openQuest() {
        console.log('BoatMenuScene: Opening quest log');
        this.audioManager?.playSFX('button');
        
        try {
            // Pause current scene and launch quest scene
            this.scene.pause('BoatMenuScene');
            this.scene.launch('QuestScene', { fromScene: 'BoatMenuScene' });
            console.log('BoatMenuScene: Quest log opened successfully');
        } catch (error) {
            console.error('BoatMenuScene: Error opening quest log:', error);
            this.audioManager?.playSFX('fail');
            this.showErrorMessage('Failed to open quest log');
        }
    }

    toggleMode() {
        this.audioManager?.playSFX('button');
        this.gameLoop.currentMode = this.gameLoop.currentMode === 'story' ? 'tournament' : 'story';
        this.modeButton.text.setText(this.gameLoop.currentMode.toUpperCase() + ' MODE');
        this.modeText.setText(`Mode: ${this.gameLoop.currentMode.charAt(0).toUpperCase() + this.gameLoop.currentMode.slice(1)}`);
        
        // Update button states to show/hide tournament button
        this.updateButtonStates({});
        
        // Show tournament status if in tournament mode
        if (this.gameLoop.currentMode === 'tournament') {
            this.showTournamentStatus();
        }
        
        console.log(`BoatMenuScene: Switched to ${this.gameLoop.currentMode} mode`);
    }

    returnToPort() {
        console.log('BoatMenuScene: Returning to port');
        this.audioManager?.playSFX('button');
        this.gameLoop.initiateTravel('Starting', 'Port');
    }

    openTournamentMenu() {
        console.log('BoatMenuScene: Opening tournament menu');
        this.audioManager?.playSFX('button');
        
        // Check if tournament is available
        if (!this.isTournamentAvailable()) {
            this.showErrorMessage('Tournament only available at Champion\'s Cove!');
            return;
        }
        
        // Show tournament selection overlay
        this.showTournamentSelectionOverlay();
    }

    showTournamentStatus() {
        // Get current tournament information from TournamentManager
        const currentTournament = this.tournamentManager.getCurrentTournament();
        
        if (currentTournament.active) {
            this.showInfoMessage(`Active Tournament: ${currentTournament.tournament.name}\nTime Remaining: ${currentTournament.timeRemaining}`);
        } else {
            const nextTournament = this.tournamentManager.getNextTournament();
            this.showInfoMessage(`Next Tournament: ${nextTournament.tournament.name}\nStarts in: ${nextTournament.startsIn}`);
        }
    }

    isTournamentAvailable() {
        // Tournament only available at Champion's Cove
        const currentLocation = this.gameState.player.currentLocation;
        return currentLocation === 'Champion\'s Cove' || currentLocation === 'Champions Cove';
    }

    getTournamentInfo() {
        const currentTournament = this.tournamentManager.getCurrentTournament();
        
        if (currentTournament.active) {
            return {
                active: true,
                name: currentTournament.tournament.name,
                timeRemaining: currentTournament.timeRemaining,
                type: currentTournament.tournament.type,
                tournament: currentTournament.tournament
            };
        } else {
            const nextTournament = this.tournamentManager.getNextTournament();
            return {
                active: false,
                next: nextTournament.tournament.name,
                startsIn: nextTournament.startsIn,
                tournament: nextTournament.tournament
            };
        }
    }

    showTournamentSelectionOverlay() {
        // Create tournament overlay background
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.8);
        overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        overlay.setDepth(2000);
        
        // Tournament panel
        const panelWidth = 600;
        const panelHeight = 500;
        const panelX = (this.cameras.main.width - panelWidth) / 2;
        const panelY = (this.cameras.main.height - panelHeight) / 2;
        
        const panel = this.add.graphics();
        panel.fillStyle(0x1a1a2e, 0.95);
        panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);
        panel.lineStyle(3, 0xff6600);
        panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);
        panel.setDepth(2001);
        
        // Title
        const title = this.add.text(panelX + panelWidth/2, panelY + 40, '🏆 TOURNAMENT CENTER', {
            fontSize: '28px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#ff6600',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        title.setDepth(2002);
        
        // Tournament info
        const tournamentInfo = this.getTournamentInfo();
        let infoText = '';
        
        if (tournamentInfo.active) {
            infoText = `🔥 ACTIVE TOURNAMENT 🔥\n\n${tournamentInfo.name}\nTime Remaining: ${tournamentInfo.timeRemaining}\n\nClick ENTER TOURNAMENT to compete!`;
        } else {
            infoText = `⏰ UPCOMING TOURNAMENT ⏰\n\n${tournamentInfo.next}\nStarts in: ${tournamentInfo.startsIn}\n\nCheck back when tournament begins!`;
        }
        
        const info = this.add.text(panelX + panelWidth/2, panelY + 150, infoText, {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);
        info.setDepth(2002);
        
        // Buttons
        const buttonY = panelY + panelHeight - 80;
        
        // Enter Tournament button (only if tournament is active)
        if (tournamentInfo.active) {
            const enterButton = this.createTournamentButton(panelX + 150, buttonY, 'ENTER TOURNAMENT', () => {
                this.enterTournament(tournamentInfo);
                this.closeTournamentOverlay();
            }, 0x00aa00);
            enterButton.setDepth(2002);
        }
        
        // Leaderboard button
        const leaderboardButton = this.createTournamentButton(panelX + 300, buttonY, 'LEADERBOARD', () => {
            this.showTournamentLeaderboard();
        }, 0x0066aa);
        leaderboardButton.setDepth(2002);
        
        // Close button
        const closeButton = this.createTournamentButton(panelX + 450, buttonY, 'CLOSE', () => {
            this.closeTournamentOverlay();
        }, 0xaa0000);
        closeButton.setDepth(2002);
        
        // Store overlay elements for cleanup
        this.tournamentOverlay = { overlay, panel, title, info, buttons: [closeButton] };
        if (tournamentInfo.active) {
            this.tournamentOverlay.buttons.push(enterButton);
        }
        this.tournamentOverlay.buttons.push(leaderboardButton);
    }

    createTournamentButton(x, y, text, callback, color) {
        const button = this.add.graphics();
        button.fillStyle(color);
        button.fillRoundedRect(-60, -20, 120, 40, 10);
        button.lineStyle(2, 0xffffff, 0.5);
        button.strokeRoundedRect(-60, -20, 120, 40, 10);
        button.setPosition(x, y);
        
        const buttonText = this.add.text(x, y, text, {
            fontSize: '12px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        button.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);
        button.on('pointerdown', callback);
        
        // Hover effects
        button.on('pointerover', () => {
            button.setScale(1.05);
            buttonText.setScale(1.05);
        });
        
        button.on('pointerout', () => {
            button.setScale(1);
            buttonText.setScale(1);
        });
        
        return { button, text: buttonText };
    }

    enterTournament(tournamentInfo) {
        console.log('BoatMenuScene: Entering tournament:', tournamentInfo.name);
        
        const tournament = tournamentInfo.tournament;
        const result = this.tournamentManager.enterTournament(tournament);
        
        if (!result.success) {
            this.showErrorMessage('Cannot enter tournament:\n' + result.errors.join('\n'));
            return;
        }
        
        this.showSuccessMessage(`Entered ${tournamentInfo.name}!\nEntry fee: ${tournament.entryFee} coins\nGood luck, angler!`);
        
        // Start fishing automatically
        this.time.delayedCall(1500, () => {
            this.startFishing();
        });
    }

    checkTournamentEntry() {
        // This method is now handled by TournamentManager.canEnterTournament()
        // Keeping for backwards compatibility
        const currentTournament = this.tournamentManager.getCurrentTournament();
        if (!currentTournament.active) {
            return false;
        }
        
        const canEnter = this.tournamentManager.canEnterTournament(currentTournament.tournament);
        return canEnter.canEnter;
    }

    showTournamentLeaderboard() {
        console.log('BoatMenuScene: Showing tournament leaderboard');
        
        // Close current overlay
        this.closeTournamentOverlay();
        
        // Create leaderboard overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.8);
        overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        overlay.setDepth(2000);
        
        const panelWidth = 500;
        const panelHeight = 600;
        const panelX = (this.cameras.main.width - panelWidth) / 2;
        const panelY = (this.cameras.main.height - panelHeight) / 2;
        
        const panel = this.add.graphics();
        panel.fillStyle(0x1a1a2e, 0.95);
        panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);
        panel.lineStyle(3, 0x0066aa);
        panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);
        panel.setDepth(2001);
        
        // Title
        const title = this.add.text(panelX + panelWidth/2, panelY + 40, '🏆 TOURNAMENT LEADERBOARD', {
            fontSize: '24px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#0066aa'
        }).setOrigin(0.5);
        title.setDepth(2002);
        
        // Get leaderboard data from TournamentManager
        const currentTournament = this.tournamentManager.getCurrentTournament();
        const leaderboardType = currentTournament.active ? currentTournament.tournament.type : 'current';
        const leaderboard = this.tournamentManager.getLeaderboard(leaderboardType);
        
        let leaderboardText = '';
        leaderboard.forEach(entry => {
            const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '  ';
            leaderboardText += `${medal} ${entry.rank}. ${entry.name}\n    Score: ${entry.score} | Best: ${entry.fish}\n\n`;
        });
        
        const leaderboardDisplay = this.add.text(panelX + 30, panelY + 100, leaderboardText, {
            fontSize: '14px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            lineSpacing: 5
        });
        leaderboardDisplay.setDepth(2002);
        
        // Close button
        const closeButton = this.createTournamentButton(panelX + panelWidth/2, panelY + panelHeight - 50, 'CLOSE', () => {
            this.closeLeaderboardOverlay();
        }, 0xaa0000);
        closeButton.button.setDepth(2002);
        closeButton.text.setDepth(2002);
        
        // Store for cleanup
        this.leaderboardOverlay = { overlay, panel, title, leaderboardDisplay, closeButton };
    }

    closeTournamentOverlay() {
        if (this.tournamentOverlay) {
            this.tournamentOverlay.overlay.destroy();
            this.tournamentOverlay.panel.destroy();
            this.tournamentOverlay.title.destroy();
            this.tournamentOverlay.info.destroy();
            this.tournamentOverlay.buttons.forEach(btn => {
                btn.button.destroy();
                btn.text.destroy();
            });
            this.tournamentOverlay = null;
        }
    }

    closeLeaderboardOverlay() {
        if (this.leaderboardOverlay) {
            this.leaderboardOverlay.overlay.destroy();
            this.leaderboardOverlay.panel.destroy();
            this.leaderboardOverlay.title.destroy();
            this.leaderboardOverlay.leaderboardDisplay.destroy();
            this.leaderboardOverlay.closeButton.button.destroy();
            this.leaderboardOverlay.closeButton.text.destroy();
            this.leaderboardOverlay = null;
        }
    }

    // UI update methods
    updateStatus(data) {
        // Provide default values if data is missing
        const statusData = data || {};
        
        // Initialize player energy if it doesn't exist (ensure consistency)
        if (this.gameState && this.gameState.player && 
            (typeof this.gameState.player.energy === 'undefined' || this.gameState.player.energy === null)) {
            this.gameState.player.energy = 100;
        }
        
        this.locationText.setText(`Location: ${statusData.location || this.gameState?.player?.currentLocation || 'Starting Port'}`);
        this.timeText.setText(`Time: ${statusData.time || 'Dawn'}`);
        this.weatherText.setText(`Weather: ${statusData.weather || 'Sunny'}`);
        
        // Use actual player energy value (no fallbacks to avoid UI/validation mismatch)
        const playerEnergy = this.gameState?.player?.energy || 0;
        const maxEnergy = (typeof this.gameState?.getPlayerAttribute === 'function') 
            ? this.gameState.getPlayerAttribute('energy') || 100 
            : 100;
        this.energyText.setText(`Energy: ${playerEnergy}/${maxEnergy}`);
        
        const fishtankCount = this.gameState.inventory?.fish?.length || 0;
        const fishtankMax = (typeof this.gameState?.getBoatAttribute === 'function')
            ? this.gameState.getBoatAttribute('fishtankStorage') || 10
            : 10;
        this.fishtankText.setText(`Fishtank: ${fishtankCount}/${fishtankMax}`);
        
        this.levelText.setText(`Level: ${this.gameState?.player?.level || 1}`);
        this.moneyText.setText(`Coins: ${this.gameState?.player?.money || 0}`);
        
        // Update button availability
        this.updateButtonStates(statusData);
        
        // Update progress bars
        this.updateProgressBars();
    }

    updateButtonStates(data) {
        // Enable/disable buttons based on available actions
        const actions = data.availableActions || ['travel', 'fish', 'cabin', 'inventory', 'shop']; // Default to all actions available
        
        this.buttons.travel.button.setAlpha(actions.includes('travel') ? 1 : 0.5);
        this.buttons.fish.button.setAlpha(actions.includes('fish') ? 1 : 0.5);
        this.buttons.shop.button.setAlpha(actions.includes('shop') ? 1 : 0.5);
        
        // Show/hide tournament button based on mode
        const inTournamentMode = this.gameLoop.currentMode === 'tournament';
        this.buttons.tournament.button.setVisible(inTournamentMode);
        this.buttons.tournament.text.setVisible(inTournamentMode);
        
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

    createPlayerButton(width, height) {
        // Button dimensions and position - adjusted to avoid conflicts
        const buttonWidth = 80;
        const buttonHeight = 40;
        const buttonX = width - buttonWidth - 20;
        const buttonY = height - buttonHeight - 40; // Moved up to avoid progress panel conflict
        
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
        // Button dimensions and position (next to Player button) - adjusted spacing
        const buttonWidth = 90;
        const buttonHeight = 40;
        const buttonX = width - buttonWidth - 110; // 110 = 80 (player button width) + 20 (margin) + 10 (spacing)
        const buttonY = height - buttonHeight - 40; // Moved up to match Player button
        
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
        if (this.mapSelectionUI) {
            this.mapSelectionUI.destroy();
        }
        if (this.gameLoop) {
            this.gameLoop.destroy();
        }
        if (this.shopUI) {
            this.shopUI.destroy();
        }
        super.destroy();
    }

    ensureUIsCreated() {
        console.log('BoatMenuScene: Ensuring UIs are created');
        
        try {
            // Create inventory UI if it doesn't exist or is destroyed
            if (!this.inventoryUI || this.inventoryUI.isDestroyed) {
                try {
                    console.log('BoatMenuScene: Creating InventoryUI');
                    this.inventoryUI = new InventoryUI(this, 100, 50, 800, 600);
                    console.log('BoatMenuScene: InventoryUI created successfully');
                } catch (error) {
                    console.error('BoatMenuScene: Error creating InventoryUI:', error);
                    this.inventoryUI = null;
                }
            }
            
            // Create crafting UI if it doesn't exist or is destroyed
            if (!this.craftingUI || this.craftingUI.isDestroyed) {
                try {
                    console.log('BoatMenuScene: Creating CraftingUI');
                    this.craftingUI = new CraftingUI(this, 50, 50, 900, 600);
                    console.log('BoatMenuScene: CraftingUI created successfully');
                } catch (error) {
                    console.error('BoatMenuScene: Error creating CraftingUI:', error);
                    this.craftingUI = null;
                }
            }
            
            // Create fish collection UI if it doesn't exist or is destroyed
            if (!this.fishCollectionUI || this.fishCollectionUI.isDestroyed) {
                try {
                    console.log('BoatMenuScene: Creating FishCollectionUI');
                    this.fishCollectionUI = new FishCollectionUI(this, 50, 50, 900, 650);
                    console.log('BoatMenuScene: FishCollectionUI created successfully');
                } catch (error) {
                    console.error('BoatMenuScene: Error creating FishCollectionUI:', error);
                    this.fishCollectionUI = null;
                }
            }
            
            // Create map selection UI if it doesn't exist or is destroyed
            if (!this.mapSelectionUI || this.mapSelectionUI.isDestroyed) {
                try {
                    console.log('BoatMenuScene: Creating MapSelectionUI');
                    this.mapSelectionUI = new MapSelectionUI(this, this.gameState.locationManager, this.gameState);
                    console.log('BoatMenuScene: MapSelectionUI created successfully');
                } catch (error) {
                    console.error('BoatMenuScene: Error creating MapSelectionUI:', error);
                    this.mapSelectionUI = null;
                }
            }
            
            // Create shop UI if it doesn't exist or is destroyed
            if (!this.shopUI || this.shopUI.isDestroyed) {
                try {
                    console.log('BoatMenuScene: Creating ShopUI');
                    this.shopUI = new ShopUI(this, 50, 50, 900, 600);
                    console.log('BoatMenuScene: ShopUI created successfully');
                } catch (error) {
                    console.error('BoatMenuScene: Error creating ShopUI:', error);
                    this.shopUI = null;
                }
            }
            
            // Establish cross-references so UIs can access each other
            // This allows the inventory UI to open crafting UI and vice versa
            console.log('BoatMenuScene: Establishing UI cross-references');
            
            // Set up cross-references with error handling
            try {
                if (this.inventoryUI && this.craftingUI) {
                    // Allow inventory to access crafting
                    this.inventoryUI.craftingUI = this.craftingUI;
                    this.craftingUI.inventoryUI = this.inventoryUI;
                    console.log('BoatMenuScene: Inventory-Crafting cross-reference established');
                }
            } catch (crossRefError) {
                console.error('BoatMenuScene: Error establishing cross-references:', crossRefError);
            }
            
            console.log('BoatMenuScene: UI creation process completed');
            
        } catch (error) {
            console.error('BoatMenuScene: Critical error in ensureUIsCreated:', error);
        }
    }

    initializePlayerStats() {
        try {
            if (!this.gameState || !this.gameState.player) {
                console.warn('BoatMenuScene: Cannot initialize player stats - gameState or player not available');
                return;
            }

            // Initialize energy if not set
            if (typeof this.gameState.player.energy === 'undefined' || this.gameState.player.energy === null) {
                this.gameState.player.energy = 100;
                console.log('BoatMenuScene: Initialized player energy to 100');
            }

            // Initialize other essential stats if not set
            if (typeof this.gameState.player.level === 'undefined' || this.gameState.player.level === null) {
                this.gameState.player.level = 1;
                console.log('BoatMenuScene: Initialized player level to 1');
            }

            if (typeof this.gameState.player.money === 'undefined' || this.gameState.player.money === null) {
                this.gameState.player.money = 100;
                console.log('BoatMenuScene: Initialized player money to 100');
            }

            if (typeof this.gameState.player.currentLocation === 'undefined' || this.gameState.player.currentLocation === null) {
                this.gameState.player.currentLocation = 'Starting Port';
                console.log('BoatMenuScene: Initialized player location to Starting Port');
            }

            // Initialize inventory if not set
            if (!this.gameState.inventory) {
                this.gameState.inventory = {
                    fish: [],
                    rods: [],
                    lures: [],
                    items: []
                };
                console.log('BoatMenuScene: Initialized player inventory');
            }

            console.log('BoatMenuScene: Player stats initialized successfully');
            
        } catch (error) {
            console.error('BoatMenuScene: Error initializing player stats:', error);
        }
    }

    createUIComponents() {
        console.log('BoatMenuScene: Creating UI components');
        
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
        
        try {
            this.mapSelectionUI = new MapSelectionUI(this, this.gameState.locationManager, this.gameState);
            console.log('BoatMenuScene: MapSelectionUI created successfully');
        } catch (error) {
            console.error('BoatMenuScene: Error creating MapSelectionUI:', error);
            this.mapSelectionUI = null;
        }
        
        try {
            this.shopUI = new ShopUI(this, 50, 50, 900, 600);
            console.log('BoatMenuScene: ShopUI created successfully');
        } catch (error) {
            console.error('BoatMenuScene: Error creating ShopUI:', error);
            this.shopUI = null;
        }
        
        try {
            this.inventoryUI = new InventoryUI(this, 100, 50, 800, 600);
            console.log('BoatMenuScene: InventoryUI created successfully');
        } catch (error) {
            console.error('BoatMenuScene: Error creating InventoryUI:', error);
            this.inventoryUI = null;
        }
        
        try {
            this.craftingUI = new CraftingUI(this, 50, 50, 900, 600);
            console.log('BoatMenuScene: CraftingUI created successfully');
        } catch (error) {
            console.error('BoatMenuScene: Error creating CraftingUI:', error);
            this.craftingUI = null;
        }
        
        console.log('BoatMenuScene: UI components creation completed');
    }
    
    processFishingSessionResults(sessionData) {
        try {
            console.log('BoatMenuScene: Processing fishing session results:', sessionData);
            
            if (!sessionData) {
                console.warn('BoatMenuScene: No session data to process');
                return;
            }
            
            // Calculate session duration
            const duration = sessionData.duration || (sessionData.endTime - sessionData.startTime);
            const durationMinutes = Math.floor(duration / (1000 * 60));
            
            // Show session summary
            const summaryMessage = `Fishing session completed!\n` +
                                 `Location: ${sessionData.location}\n` +
                                 `Duration: ${durationMinutes} minutes\n` +
                                 `Mode: ${sessionData.mode}`;
            
            this.time.delayedCall(1500, () => {
                this.showInfoMessage(summaryMessage);
            });
            
            // Clear the current fishing session from game state
            if (this.gameState) {
                this.gameState.currentFishingSession = null;
            }
            
            console.log('BoatMenuScene: Fishing session results processed successfully');
            
        } catch (error) {
            console.error('BoatMenuScene: Error processing fishing session results:', error);
        }
    }
}