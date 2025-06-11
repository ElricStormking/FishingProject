import Phaser from 'phaser';
import GameState from '../scripts/GameState.js';
import GameLoop from '../scripts/GameLoop.js';
import SceneManager from '../scripts/SceneManager.js';
import TournamentManager from '../scripts/TournamentManager.js';
import { QuestManager } from '../scripts/QuestManager.js';
import { QuestTrackerUI } from '../ui/QuestTrackerUI.js';
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
        const { width, height } = this.cameras.main;
        
        console.log('BoatMenuScene: Creating scene with dimensions:', width, 'x', height);
        console.log('BoatMenuScene: Scene data received:', data);
        
        // CRITICAL: Clean up any leftover DOM buttons from previous sessions
        this.forceCleanupAllDOMButtons();
        
        // Store data for later use
        this.gameStateData = data;
        
        // Handle return from fishing session
        if (data?.returnedFromFishing) {
            console.log('BoatMenuScene: Returned from fishing session');
            if (data.fishingSessionData) {
                console.log('BoatMenuScene: Processing fishing session results:', data.fishingSessionData);
                this.processFishingSessionResults(data.fishingSessionData);
            }
            
            if (data.errorRecovery) {
                console.log('BoatMenuScene: Scene loaded in error recovery mode');
                this.showInfoMessage('Returned to boat (error recovery mode)');
            } else {
                this.showSuccessMessage('Welcome back! Fishing session completed.');
            }
        }
        
        // Get game state
        this.gameState = GameState.getInstance();
            
        // Initialize quest manager and ensure it has scene context
        console.log('BoatMenuScene: Initializing QuestManager...');
        
        // CRITICAL FIX: Auto-create QuestManager when BoatMenuScene loads - don't wait for manual quest button press
        this.questManager = null;
        this.boatMenuAccessed = true; // Track that boat menu was accessed for retroactive quest completion
        
        if (this.gameState.questManager) {
            console.log('BoatMenuScene: Using existing QuestManager from GameState');
            console.log('BoatMenuScene: QuestManager active quests:', Array.from(this.gameState.questManager.activeQuests.keys()));
            console.log('BoatMenuScene: QuestManager quest templates count:', this.gameState.questManager.questTemplates.size);
            this.questManager = this.gameState.questManager;
            
            // Complete boat menu quest objective immediately since QuestManager is available
            this.completeBoatMenuQuestObjective();
        } else {
            console.log('BoatMenuScene: 🔄 Auto-creating QuestManager for immediate availability...');
            
            // CRITICAL FIX: Create QuestManager automatically instead of waiting
            try {
                console.log('BoatMenuScene: Creating QuestManager directly (import already available)');
                
                // Create QuestManager and store in GameState immediately
                this.questManager = new QuestManager(this);
                this.gameState.questManager = this.questManager;
                
                console.log('BoatMenuScene: ✅ QuestManager auto-created and stored in GameState');
                
                // CRITICAL FIX: Wait for QuestManager initialization before processing objectives
                this.time.delayedCall(300, () => {
                    console.log('BoatMenuScene: QuestManager initialization complete, checking active quests...');
                    console.log('BoatMenuScene: QuestManager active quests:', Array.from(this.questManager.activeQuests.keys()));
                    console.log('BoatMenuScene: QuestManager templates count:', this.questManager.questTemplates.size);
                    
                    // Complete boat menu quest objective now that QuestManager is available
                    this.completeBoatMenuQuestObjective();
                    
                    // CRITICAL FIX: Set up quest event listeners on GameScene if available
                    const gameScene = this.scene.get('GameScene');
                    if (gameScene && gameScene.setupQuestEventListeners) {
                        console.log('BoatMenuScene: Setting up quest event listeners on GameScene...');
                        gameScene.questManager = this.questManager;
                        gameScene.setupQuestEventListeners();
                        console.log('BoatMenuScene: ✅ Quest event listeners set up on GameScene');
                    } else {
                        console.log('BoatMenuScene: GameScene not available for quest listener setup');
                    }
                });
                
                // Update Quest Tracker UI to use the new QuestManager (use delay to ensure it's created)
                this.time.delayedCall(100, () => {
                    if (this.questTrackerUI && this.questTrackerUI.questProcessingDisabled) {
                        console.log('BoatMenuScene: Enabling quest processing on existing QuestTrackerUI...');
                        this.questTrackerUI.updateQuestManager(this.questManager);
                    } else if (this.questTrackerUI) {
                        console.log('BoatMenuScene: QuestTrackerUI already has active quest processing, refreshing...');
                        this.questTrackerUI.refreshQuests();
                    } else {
                        console.log('BoatMenuScene: QuestTrackerUI not available yet for updating');
                    }
                });
                
            } catch (error) {
                console.error('BoatMenuScene: Error auto-creating QuestManager:', error);
                
                // Fallback: Set up timer as backup
                this.questManagerCheckTimer = this.time.addEvent({
                    delay: 1000,
                    callback: this.checkForQuestManagerAndCompleteObjective,
                    callbackScope: this,
                    repeat: 10
                });
            }
        }
            
        // Initialize audio manager for this scene
            this.audioManager = this.gameState.getAudioManager(this);
            if (this.audioManager) {
                this.audioManager.setSceneAudio('BoatMenuScene');
            console.log('BoatMenuScene: Audio manager initialized');
        }
        
        // Create visual elements
        this.createSceneBackground(width, height);
        this.createStatusDisplay(width, height);
        this.createActionButtons(width, height); // Creates all DOM buttons
        this.createProgressDisplay(width, height);
        this.createPlayerButton(width, height); // Now just logs (DOM buttons created above)
        this.createCollectionButton(width, height); // Now just logs (DOM buttons created above)
        
        // ADD MIA'S PORTRAIT IN THE MIDDLE
        this.createMiaPortraitDisplay(width, height);
        
        // All buttons including FISH are now created as part of the DOM button system above
        
        // Setup interactions
        this.setupEventListeners();
        
        // Initialize components
        this.ensureUIsCreated();
        this.initializePlayerStats();
        this.createUIComponents();
        
        // Create Quest Tracker UI
        try {
            console.log('BoatMenuScene: Creating Quest Tracker UI...');
            
            // CRITICAL FIX: Only create QuestTrackerUI if we have a valid QuestManager
            if (this.questManager) {
                // Check if tutorial is completed through QuestManager
                const tutorialCompleted = this.questManager.completedQuests.has('story_001_tutorial');
                console.log('BoatMenuScene: Tutorial completion status:', tutorialCompleted);
                
                if (tutorialCompleted) {
                    console.log('BoatMenuScene: 🚫 Tutorial completed - creating QuestTrackerUI with disabled quest processing');
                    this.questTrackerUI = new QuestTrackerUI(this, null, 20, 100);
                } else {
                    console.log('BoatMenuScene: ✅ Tutorial not completed - creating QuestTrackerUI with active quest processing');
                    this.questTrackerUI = new QuestTrackerUI(this, this.questManager, 20, 100);
                }
                console.log('BoatMenuScene: Quest Tracker UI created successfully');
            } else {
                console.log('BoatMenuScene: No QuestManager available - creating QuestTrackerUI with disabled quest processing');
                this.questTrackerUI = new QuestTrackerUI(this, null, 20, 100);
            }
        } catch (error) {
            console.error('BoatMenuScene: Error creating Quest Tracker UI:', error);
            this.questTrackerUI = null;
        }
        
        // Note: Quest objective completion is now handled in the QuestManager initialization logic above
        // Either completed immediately if QuestManager is available, or retroactively via timer
        
        // Also trigger reward UI check in case quest was already completed
        this.time.delayedCall(1000, () => {
            this.checkAndShowCompletedQuestRewards();
        });
        
        console.log('BoatMenuScene: Scene created successfully');
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
        // Create DOM-based action buttons with improved styling and responsive positioning
        // Organize buttons in proper grid layout in the lower right area
        const buttonWidth = 130;
        const buttonHeight = 50;
        const spacing = 10;
        const rightMargin = 20;
        const bottomMargin = 80;
        const yOffset = 100; // Move all buttons 100 pixels down
        
        // Calculate starting positions for a 4x2 grid in lower right
        const startX = width - (4 * buttonWidth + 3 * spacing + rightMargin);
        const startY = height - (2 * buttonHeight + spacing + bottomMargin) + yOffset;
        
        const buttonConfigs = [
            // First row of buttons (top row)
            { id: 'travel', text: '🗺️ Travel', callback: () => this.openTravelMenu(), 
              x: startX + 0 * (buttonWidth + spacing), y: startY, width: buttonWidth },
            { id: 'fish', text: '🎣 Fish', callback: () => this.startFishing(), 
              x: startX + 1 * (buttonWidth + spacing), y: startY, width: buttonWidth },
            { id: 'cabin', text: '🏠 Cabin', callback: () => this.openCabin(), 
              x: startX + 2 * (buttonWidth + spacing), y: startY, width: buttonWidth },
            { id: 'inventory', text: '🎒 Inventory', callback: () => this.openInventory(), 
              x: startX + 3 * (buttonWidth + spacing), y: startY, width: buttonWidth },
            
            // Second row of buttons (bottom row)
            { id: 'shop', text: '🏪 Shop', callback: () => this.openShop(), 
              x: startX + 0 * (buttonWidth + spacing), y: startY + buttonHeight + spacing, width: buttonWidth },
            { id: 'quests', text: '📜 Quests', callback: () => this.openQuest(), 
              x: startX + 1 * (buttonWidth + spacing), y: startY + buttonHeight + spacing, width: buttonWidth },
            { id: 'crafting', text: '🔨 Crafting', callback: () => this.openCrafting(), 
              x: startX + 2 * (buttonWidth + spacing), y: startY + buttonHeight + spacing, width: buttonWidth },
            { id: 'tournament', text: '🏆 Tournament', callback: () => this.openTournamentMenu(), 
              x: startX + 3 * (buttonWidth + spacing), y: startY + buttonHeight + spacing, width: buttonWidth },
        ];

        // Create DOM buttons container
        this.domButtonsContainer = document.createElement('div');
        this.domButtonsContainer.id = 'boat-menu-buttons-container';
        this.domButtonsContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
        `;

        // Store DOM button references
        this.domButtons = {};

        // Create each button
        buttonConfigs.forEach(config => {
            this.domButtons[config.id] = this.createDOMButton(config);
        });

        // Create return to port button (initially hidden) - centered at bottom
        this.domButtons.returnToPort = this.createDOMButton({
            id: 'returnToPort',
            text: '⚓ Return to Port',
            callback: () => this.returnToPort(),
            x: (width - 180) / 2,
            y: height - 25 + yOffset,
            icon: '⚓',
            width: 180,
            height: 40,
            visible: false
        });

        // Create player level button (bottom left corner)
        this.domButtons.playerLevel = this.createDOMButton({
            id: 'playerLevel',
            text: '👤 Lvl 1',
            callback: () => this.openPlayerProgression(),
            x: 190,
            y: height - 50 + yOffset,
            icon: '👤',
            width: 90,
            height: 40
        });

        // Create collection button (near but not overlapping with main buttons)
        this.domButtons.collection = this.createDOMButton({
            id: 'collection',
            text: '📚 Collection',
            callback: () => this.openFishCollection(),
            x: width - 140,
            y: height - 25 + yOffset,
            icon: '📚',
            width: 120,
            height: 40
        });

        // Add container to document
        document.body.appendChild(this.domButtonsContainer);
        console.log('BoatMenuScene: DOM button system created with', Object.keys(this.domButtons).length, 'buttons');
    }

    /**
     * Create a single DOM button with enhanced styling and functionality
     */
    createDOMButton(config) {
        const button = document.createElement('button');
        button.id = `boatmenu-${config.id}-button`;
        button.innerHTML = config.text;
        
        // Enhanced button styling with underwater/boat theme
        const baseStyles = {
            position: 'absolute',
            left: config.x + 'px',
            top: config.y + 'px',
            width: (config.width || 120) + 'px',
            height: (config.height || 50) + 'px',
            fontSize: '14px',
            fontWeight: 'bold',
            fontFamily: 'Arial Black, Arial, sans-serif',
            color: '#ffffff',
            background: 'linear-gradient(135deg, #003366 0%, #004080 50%, #0066cc 100%)',
            border: '2px solid #00bfff',
            borderRadius: '12px',
            cursor: 'pointer',
            zIndex: '1001',
            pointerEvents: 'auto',
            boxShadow: '0 4px 12px rgba(0, 63, 102, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2)',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
            transform: 'translateX(0)',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            overflow: 'hidden',
            userSelect: 'none',
            outline: 'none'
        };

        // Apply base styles
        Object.assign(button.style, baseStyles);

        // Add button-specific styling based on type
        this.applyButtonTypeStyles(button, config.id);

        // Enhanced hover effects
        button.addEventListener('mouseenter', () => {
            Object.assign(button.style, {
                transform: 'translateY(-2px) scale(1.05)',
                boxShadow: '0 6px 16px rgba(0, 191, 255, 0.6), inset 0 3px 6px rgba(255, 255, 255, 0.3)',
                background: 'linear-gradient(135deg, #0066cc 0%, #0080ff 50%, #00bfff 100%)',
                borderColor: '#40e0d0'
            });
        });

        button.addEventListener('mouseleave', () => {
            Object.assign(button.style, {
                transform: 'translateY(0) scale(1)',
                boxShadow: '0 4px 12px rgba(0, 63, 102, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2)',
                background: 'linear-gradient(135deg, #003366 0%, #004080 50%, #0066cc 100%)',
                borderColor: '#00bfff'
            });
        });

        // Active/pressed effect
        button.addEventListener('mousedown', () => {
            Object.assign(button.style, {
                transform: 'translateY(1px) scale(0.98)',
                boxShadow: '0 2px 8px rgba(0, 63, 102, 0.6), inset 0 1px 3px rgba(0, 0, 0, 0.3)',
                background: 'linear-gradient(135deg, #002244 0%, #003366 50%, #004080 100%)'
            });
        });

        button.addEventListener('mouseup', () => {
            Object.assign(button.style, {
                transform: 'translateY(-2px) scale(1.05)',
                boxShadow: '0 6px 16px rgba(0, 191, 255, 0.6), inset 0 3px 6px rgba(255, 255, 255, 0.3)',
                background: 'linear-gradient(135deg, #0066cc 0%, #0080ff 50%, #00bfff 100%)'
            });
        });

        // Click event
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`BoatMenuScene: DOM button '${config.id}' clicked`);
            
            // Add click animation
            button.style.animation = 'buttonPulse 0.3s ease-out';
            setTimeout(() => {
                button.style.animation = '';
            }, 300);
            
            // Execute callback
            if (config.callback) {
                config.callback();
            }
        });

        // Handle visibility
        if (config.visible === false) {
            button.style.display = 'none';
        }

        // Add to container
        this.domButtonsContainer.appendChild(button);

        // Add pulse animation keyframes if not already added
        this.addButtonAnimations();

        console.log(`BoatMenuScene: Created DOM button '${config.id}' at (${config.x}, ${config.y})`);
        
        return button;
    }

    /**
     * Apply button-specific styling based on button type
     */
    applyButtonTypeStyles(button, buttonId) {
        const typeStyles = {
            travel: {
                background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 50%, #4caf50 100%)',
                borderColor: '#81c784'
            },
            fish: {
                background: 'linear-gradient(135deg, #0077be 0%, #0099cc 50%, #00bfff 100%)',
                borderColor: '#40e0d0'
            },
            cabin: {
                background: 'linear-gradient(135deg, #5d4037 0%, #6d4c41 50%, #8d6e63 100%)',
                borderColor: '#a1887f'
            },
            inventory: {
                background: 'linear-gradient(135deg, #7b1fa2 0%, #8e24aa 50%, #ab47bc 100%)',
                borderColor: '#ce93d8'
            },
            shop: {
                background: 'linear-gradient(135deg, #f57c00 0%, #ff9800 50%, #ffb74d 100%)',
                borderColor: '#ffcc02'
            },
            quests: {
                background: 'linear-gradient(135deg, #c62828 0%, #d32f2f 50%, #f44336 100%)',
                borderColor: '#ef5350'
            },
            crafting: {
                background: 'linear-gradient(135deg, #455a64 0%, #546e7a 50%, #607d8b 100%)',
                borderColor: '#90a4ae'
            },
            tournament: {
                background: 'linear-gradient(135deg, #e65100 0%, #ff6f00 50%, #ff8f00 100%)',
                borderColor: '#ffb300'
            },
            returnToPort: {
                background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #2196f3 100%)',
                borderColor: '#64b5f6'
            },
            playerLevel: {
                background: 'linear-gradient(135deg, #4527a0 0%, #512da8 50%, #673ab7 100%)',
                borderColor: '#9575cd'
            },
            collection: {
                background: 'linear-gradient(135deg, #00695c 0%, #00796b 50%, #009688 100%)',
                borderColor: '#4db6ac'
            }
        };

        if (typeStyles[buttonId]) {
            Object.assign(button.style, typeStyles[buttonId]);
        }
    }

    /**
     * Add CSS animations for buttons
     */
    addButtonAnimations() {
        if (document.querySelector('#boat-menu-button-animations')) {
            return; // Already added
        }

        const style = document.createElement('style');
        style.id = 'boat-menu-button-animations';
        style.textContent = `
            @keyframes buttonPulse {
                0% { transform: translateY(-2px) scale(1.05); }
                50% { transform: translateY(-4px) scale(1.1); box-shadow: 0 8px 20px rgba(0, 191, 255, 0.8); }
                100% { transform: translateY(-2px) scale(1.05); }
            }

            @keyframes buttonGlow {
                0%, 100% { box-shadow: 0 4px 12px rgba(0, 63, 102, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2); }
                50% { box-shadow: 0 6px 16px rgba(0, 191, 255, 0.8), inset 0 3px 6px rgba(255, 255, 255, 0.4); }
            }

            .button-disabled {
                opacity: 0.5 !important;
                pointer-events: none !important;
                cursor: not-allowed !important;
            }

            .button-highlight {
                animation: buttonGlow 2s ease-in-out infinite !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Update DOM button states based on game conditions
     */
    updateDOMButtonStates(data) {
        if (!this.domButtons) return;

        const currentLocation = data.location || this.gameState?.player?.currentLocation || 'Starting Port';
        const isAtStartingPort = currentLocation === 'Starting Port';
        
        // Determine available actions based on location and game state
        let availableActions = ['fish', 'cabin', 'inventory', 'travel', 'crafting', 'quests']; // Base actions always available
        
        // Only add shop if actually at Starting Port
        if (isAtStartingPort) {
            availableActions.push('shop');
        }
        
        // Use provided actions if available, otherwise use calculated actions
        const actions = data.availableActions || availableActions;

        // Update button states
        Object.keys(this.domButtons).forEach(buttonId => {
            const button = this.domButtons[buttonId];
            if (!button) return;

            const isEnabled = actions.includes(buttonId) || 
                              ['playerLevel', 'collection', 'returnToPort'].includes(buttonId);

            if (isEnabled) {
                button.classList.remove('button-disabled');
                button.disabled = false;
            } else {
                button.classList.add('button-disabled');
                button.disabled = true;
            }
        });

        // Special handling for specific buttons
        if (this.domButtons.shop) {
            if (isAtStartingPort) {
                this.domButtons.shop.classList.remove('button-disabled');
                this.domButtons.shop.disabled = false;
            } else {
                this.domButtons.shop.classList.add('button-disabled');
                this.domButtons.shop.disabled = true;
            }
        }

        // Show/hide tournament button based on mode
        const inTournamentMode = this.gameLoop?.currentMode === 'tournament';
        if (this.domButtons.tournament) {
            this.domButtons.tournament.style.display = inTournamentMode ? 'block' : 'block'; // Always show for now
        }

        // Show/hide return button - only show if NOT at Starting Port
        const shouldShowReturn = !isAtStartingPort;
        if (this.domButtons.returnToPort) {
            this.domButtons.returnToPort.style.display = shouldShowReturn ? 'block' : 'none';
        }

        // Update player level button text
        if (this.domButtons.playerLevel && this.gameState?.player?.level) {
            this.domButtons.playerLevel.innerHTML = `👤 Lvl ${this.gameState.player.level}`;
        }

        console.log(`BoatMenuScene: Updated DOM button states - Location: ${currentLocation}, Shop available: ${!this.domButtons.shop?.disabled}, Return button: ${shouldShowReturn}`);
    }

    /**
     * Destroy all DOM buttons
     */
    destroyDOMButtons() {
        console.log('BoatMenuScene: Starting DOM button destruction process');
        
        // Remove main container
        if (this.domButtonsContainer && this.domButtonsContainer.parentNode) {
            this.domButtonsContainer.parentNode.removeChild(this.domButtonsContainer);
            console.log('BoatMenuScene: Main DOM button container removed');
        }
        
        // Remove animations style
        const animationStyle = document.querySelector('#boat-menu-button-animations');
        if (animationStyle && animationStyle.parentNode) {
            animationStyle.parentNode.removeChild(animationStyle);
            console.log('BoatMenuScene: DOM button animations style removed');
        }
        
        // Force cleanup of any orphaned DOM buttons from this scene
        this.forceCleanupAllDOMButtons();
        
        this.domButtonsContainer = null;
        this.domButtons = {};
        console.log('BoatMenuScene: DOM buttons destroyed completely');
    }

    /**
     * Force cleanup of all DOM buttons regardless of their state
     * This is a safety net to ensure no DOM buttons are left behind
     */
    forceCleanupAllDOMButtons() {
        console.log('BoatMenuScene: Force cleaning up all DOM buttons');
        
        // Remove all boat menu button containers
        const containers = document.querySelectorAll('#boat-menu-buttons-container');
        containers.forEach((container, index) => {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
                console.log(`BoatMenuScene: Force removed container ${index + 1}`);
            }
        });
        
        // Remove all boat menu buttons by ID pattern
        const buttons = document.querySelectorAll('[id^="boatmenu-"]');
        buttons.forEach((button, index) => {
            if (button.parentNode) {
                button.parentNode.removeChild(button);
                console.log(`BoatMenuScene: Force removed button ${button.id}`);
            }
        });
        
        // Remove animation styles
        const animationStyles = document.querySelectorAll('#boat-menu-button-animations');
        animationStyles.forEach(style => {
            if (style.parentNode) {
                style.parentNode.removeChild(style);
                console.log('BoatMenuScene: Force removed animation style');
            }
        });
        
        console.log('BoatMenuScene: Force cleanup completed');
    }

    /**
     * Hide all DOM buttons
     */
    hideDOMButtons() {
        if (this.domButtonsContainer) {
            this.domButtonsContainer.style.display = 'none';
        }
    }

    /**
     * Show all DOM buttons
     */
    showDOMButtons() {
        if (this.domButtonsContainer) {
            this.domButtonsContainer.style.display = 'block';
        }
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

        this.expText = this.add.text(width - 20, 30, 'EXP: 0/100', { fontSize: '14px', fill: '#ffffff', fontFamily: 'Arial' }).setOrigin(1, 0.5);
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
        
        // Debug: Add F9 key to test reward UI
        this.input.keyboard.on('keydown-F9', () => {
            console.log('BoatMenuScene: F9 pressed - testing reward UI');
            try {
                // Try to get or initialize QuestManager
                const questManager = this.questManager || this.gameState.getQuestManager(this);
                if (questManager) {
                    // Ensure scene context is set
                    questManager.scene = this;
                    questManager.debugTestRewardUI();
                    console.log('BoatMenuScene: Reward UI test executed');
                } else {
                    console.error('BoatMenuScene: QuestManager not available for F9 test');
                    this.showErrorMessage('QuestManager not available - cannot test reward UI');
                }
            } catch (error) {
                console.error('BoatMenuScene: Error in F9 reward UI test:', error);
                this.showErrorMessage('Error testing reward UI: ' + error.message);
            }
        });
        
        // Debug: Add F10 key to force complete tutorial quest
        this.input.keyboard.on('keydown-F10', () => {
            console.log('BoatMenuScene: F10 pressed - force completing tutorial quest');
            try {
                // Try to get or initialize QuestManager
                const questManager = this.questManager || this.gameState.getQuestManager(this);
                if (questManager) {
                    // Ensure scene context is set
                    questManager.scene = this;
                    questManager.debugCompleteQuest('story_001_tutorial');
                    console.log('BoatMenuScene: Tutorial quest completion executed');
                } else {
                    console.error('BoatMenuScene: QuestManager not available for F10 test');
                    this.showErrorMessage('QuestManager not available - cannot complete quest');
                }
            } catch (error) {
                console.error('BoatMenuScene: Error in F10 quest completion:', error);
                this.showErrorMessage('Error completing quest: ' + error.message);
            }
        });

        // Debug: Add F11 key to force simple reward UI test
        this.input.keyboard.on('keydown-F11', () => {
            console.log('BoatMenuScene: F11 pressed - force simple reward UI test');
            try {
                // Try to get or initialize QuestManager
                const questManager = this.questManager || this.gameState.getQuestManager(this);
                if (questManager) {
                    // Force test with this scene
                    const success = questManager.forceShowTestRewardUI(this);
                    if (success) {
                        console.log('BoatMenuScene: Force reward UI test succeeded');
                        this.showSuccessMessage('Simple reward UI test completed');
                    } else {
                        console.error('BoatMenuScene: Force reward UI test failed');
                        this.showErrorMessage('Force reward UI test failed');
                    }
                } else {
                    console.error('BoatMenuScene: QuestManager not available for F11 test');
                    this.showErrorMessage('QuestManager not available');
                }
            } catch (error) {
                console.error('BoatMenuScene: Error in F11 force test:', error);
                this.showErrorMessage('Error in force test: ' + error.message);
            }
        });
        
        // Debug: Add F12 key to show direct reward UI (bypassing QuestManager entirely)
        this.input.keyboard.on('keydown-F12', () => {
            console.log('BoatMenuScene: F12 pressed - direct reward UI test (no QuestManager needed)');
            try {
                this.showDirectRewardUI();
                this.showSuccessMessage('Direct reward UI test completed');
            } catch (error) {
                console.error('BoatMenuScene: Error in F12 direct test:', error);
                this.showErrorMessage('Error in direct test: ' + error.message);
            }
        });

        // Quest tracker toggle (Ctrl+Q)
        this.input.keyboard.on('keydown', (event) => {
            if (event.code === 'KeyQ' && event.ctrlKey && !event.shiftKey) {
                event.preventDefault();
                if (this.questTrackerUI) {
                    this.questTrackerUI.toggleVisibility();
                }
            }
        });
    }

    // Action handlers
    openTravelMenu() {
        console.log('BoatMenuScene: Opening travel menu');
        this.audioManager?.playSFX('button');
        
        // Hide DOM buttons when opening UI
        this.hideDOMButtons();
        console.log('BoatMenuScene: DOM buttons hidden for travel UI');
        
        if (this.mapSelectionUI) {
            // Set up close callback to show buttons again
            if (!this.mapSelectionUI.closeCallbackSet) {
                const originalHide = this.mapSelectionUI.hide;
                this.mapSelectionUI.hide = () => {
                    originalHide.call(this.mapSelectionUI);
                    this.showDOMButtons();
                    console.log('BoatMenuScene: DOM buttons shown after travel close');
                };
                this.mapSelectionUI.closeCallbackSet = true;
            }
            
            this.mapSelectionUI.show();
            console.log('BoatMenuScene: MapSelectionUI opened successfully');
        } else {
            console.error('BoatMenuScene: MapSelectionUI not available');
            this.showErrorMessage('Map selection not available - MapSelectionUI failed to initialize');
            // Show buttons again on error
            this.showDOMButtons();
        }
    }

    startFishing() {
        console.log('BoatMenuScene: Starting fishing');
        this.audioManager?.playSFX('button');
        
        try {
            // CRITICAL: Hide all DOM buttons before scene transition
            this.hideDOMButtons();
            console.log('BoatMenuScene: DOM buttons hidden before fishing scene transition');
            
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
                // Show buttons again on error since we're not transitioning
                this.showDOMButtons();
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
            
            // Clean up legacy DOM FISH button before scene transition
            if (this.domFishButton) {
                this.domFishButton.remove();
                this.domFishButton = null;
            }
            
                            // Transition to GameScene for fishing with proper data
                this.time.delayedCall(1000, () => {
                    // Hide loading before scene transition
                    if (this.loadingStateManager) {
                        this.loadingStateManager.hideLoading('fishing_operation');
                    }
                    
                    // ENSURE DOM buttons are completely destroyed before scene transition
                    this.destroyDOMButtons();
                    console.log('BoatMenuScene: DOM buttons destroyed before GameScene transition');
                    
                    // Pass quest manager reference to maintain quest context
                    this.scene.start('GameScene', {
                        callingScene: 'BoatMenuScene',
                        mode: this.gameLoop?.currentMode || 'story',
                        location: this.gameState.player.currentLocation,
                        fishingSession: true,
                        questManager: this.questManager, // Pass quest manager reference
                        questContext: this.questManager ? {
                            sceneKey: this.scene.key,
                            questManagerState: this.questManager.getState ? this.questManager.getState() : null
                        } : null
                    });
                    console.log('BoatMenuScene: Transitioned to GameScene for fishing with quest context');
                });
            
        } catch (error) {
            console.error('BoatMenuScene: Error starting fishing:', error);
            
            // Hide loading on error
            if (this.loadingStateManager) {
                this.loadingStateManager.hideLoading('fishing_operation');
            }
            
            this.audioManager?.playSFX('fail');
            this.showErrorMessage('Failed to start fishing: ' + error.message);
            
            // Show buttons again on error since we're not transitioning
            this.showDOMButtons();
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
            
            // Define main fishing areas (partial match will work for sub-areas)
            const fishableAreas = [
                'Beginner Lake',      // Allows "Beginner Lake - Shallow Waters", etc.
                'Ocean Harbor',       // Allows "Ocean Harbor - Deep Waters", etc.
                'Mountain Stream',    // Allows "Mountain Stream - Rapids", etc.
                'Midnight Pond',      // Allows "Midnight Pond - Moonlit Shore", etc.
                'Champion\'s Cove',   // Allows "Champion's Cove - Crystal Bay", etc.
                'Starting Port',      // Exact match for port
                'Coral Cove',         // Story mode locations
                'Deep Abyss',
                'Tropical Lagoon',
                'Arctic Waters',
                'Volcanic Depths',
                'Training Lagoon',    // Practice mode locations
                'Open Waters',
                'Skill Harbor'
            ];
            
            // Check if current location starts with any of the fishable areas
            const isValidLocation = fishableAreas.some(area => currentLocation.startsWith(area));
            
            if (!isValidLocation) {
                console.log('BoatMenuScene: Invalid fishing location:', currentLocation);
                console.log('BoatMenuScene: Valid areas:', fishableAreas);
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
            // Hide DOM buttons when opening cabin scene
            this.hideDOMButtons();
            console.log('BoatMenuScene: DOM buttons hidden for cabin scene');
            
            // Set up event listener for when cabin scene closes
            this.events.once('resume', () => {
                this.showDOMButtons();
                console.log('BoatMenuScene: DOM buttons shown after cabin scene resume');
            });
            
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
            // Show buttons again on error
            this.showDOMButtons();
        }
    }

    openInventory() {
        console.log('BoatMenuScene: Opening inventory');
        
        try {
            // Hide DOM buttons when opening UI
            this.hideDOMButtons();
            console.log('BoatMenuScene: DOM buttons hidden for inventory UI');
            
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
            
            // 🚨 FORCE CLEAN: Remove any undefined items immediately on scene start
            try {
                if (this.gameState.inventoryManager && this.gameState.inventoryManager.forceCleanAllUndefinedItems) {
                    const cleanedCount = this.gameState.inventoryManager.forceCleanAllUndefinedItems();
                    if (cleanedCount > 0) {
                        console.log(`BoatMenuScene: ✅ Cleaned ${cleanedCount} undefined items from inventory`);
                        this.gameState.save(); // Save immediately after cleaning
                    }
                }
            } catch (cleanError) {
                console.error('BoatMenuScene: Error cleaning undefined items:', cleanError);
            }
            
            // 🚨 DISABLED: Automatic sample item generation to prevent undefined items
            // Sample items can be added manually through the inventory UI debug buttons if needed
            console.log('BoatMenuScene: Automatic sample item generation disabled to prevent undefined items');
            
            // Ensure both UIs are created and cross-referenced
            this.ensureUIsCreated();
            
            // Set up close callback to show buttons again
            if (this.inventoryUI && !this.inventoryUI.closeCallbackSet) {
                const originalHide = this.inventoryUI.hide;
                this.inventoryUI.hide = () => {
                    originalHide.call(this.inventoryUI);
                    this.showDOMButtons();
                    console.log('BoatMenuScene: DOM buttons shown after inventory close');
                };
                this.inventoryUI.closeCallbackSet = true;
            }
            
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
            
            // Show buttons again on error
            this.showDOMButtons();
            
            // Play error sound if available
            if (this.audioManager && typeof this.audioManager.playSFX === 'function') {
                this.audioManager.playSFX('fail');
            }
        }
    }

    openCrafting() {
        console.log('BoatMenuScene: Opening crafting workshop');
        this.audioManager?.playSFX('button');
        
        // Hide DOM buttons when opening UI
        this.hideDOMButtons();
        console.log('BoatMenuScene: DOM buttons hidden for crafting UI');
        
        // Ensure both UIs are created and cross-referenced
        this.ensureUIsCreated();
        
        // Set up close callback to show buttons again
        if (this.craftingUI && !this.craftingUI.closeCallbackSet) {
            const originalHide = this.craftingUI.hide;
            this.craftingUI.hide = () => {
                originalHide.call(this.craftingUI);
                this.showDOMButtons();
                console.log('BoatMenuScene: DOM buttons shown after crafting close');
            };
            this.craftingUI.closeCallbackSet = true;
        }
        
        // Show the crafting UI
        this.craftingUI.show();
    }

    openShop() {
        console.log('BoatMenuScene: Opening shop');
        
        // Check if at Starting Port before allowing shop access
        const currentLocation = this.gameState?.player?.currentLocation || 'Starting Port';
        if (currentLocation !== 'Starting Port') {
            console.log('BoatMenuScene: Shop not available - not at Starting Port. Current location:', currentLocation);
            this.audioManager?.playSFX('fail');
            this.showErrorMessage('Shop only available at Starting Port!\nCurrent location: ' + currentLocation);
            return;
        }
        
        this.audioManager?.playSFX('button');
        
        // Hide DOM buttons when opening UI
        this.hideDOMButtons();
        console.log('BoatMenuScene: DOM buttons hidden for shop UI');
        
        if (this.shopUI) {
            // Set up close callback to show buttons again
            if (!this.shopUI.closeCallbackSet) {
                const originalHide = this.shopUI.hide;
                this.shopUI.hide = () => {
                    originalHide.call(this.shopUI);
                    this.showDOMButtons();
                    console.log('BoatMenuScene: DOM buttons shown after shop close');
                };
                this.shopUI.closeCallbackSet = true;
            }
            
            this.shopUI.show();
            console.log('BoatMenuScene: ShopUI opened successfully');
        } else {
            console.error('BoatMenuScene: ShopUI not available');
            this.showErrorMessage('Shop interface not available - ShopUI failed to initialize');
            // Show buttons again on error
            this.showDOMButtons();
        }
    }

    openQuest() {
        console.log('BoatMenuScene: Opening quest log');
        this.audioManager?.playSFX('button');
        
        try {
            // Hide DOM buttons when opening quest scene
            this.hideDOMButtons();
            console.log('BoatMenuScene: DOM buttons hidden for quest scene');
            
            // Set up event listener for when this scene resumes (quest scene closes)
            this.events.once('resume', () => {
                this.showDOMButtons();
                console.log('BoatMenuScene: DOM buttons shown after quest scene close');
            });
            
            // Check if QuestScene exists before launching
            const questScene = this.scene.manager.getScene('QuestScene');
            if (!questScene) {
                console.warn('BoatMenuScene: QuestScene not found in scene manager');
                console.log('BoatMenuScene: Available scenes:', this.scene.manager.scenes.map(s => s.scene.key));
                this.showErrorMessage('Quest scene not available. Quest functionality may not be loaded.');
                this.showDOMButtons();
                return;
            }
            
            console.log('BoatMenuScene: QuestScene found, proceeding to launch');
            
            // Pause current scene and launch quest scene
            this.scene.pause('BoatMenuScene');
            this.scene.launch('QuestScene', { fromScene: 'BoatMenuScene' });
            console.log('BoatMenuScene: Quest log opened successfully');
        } catch (error) {
            console.error('BoatMenuScene: Error opening quest log:', error);
            this.audioManager?.playSFX('fail');
            this.showErrorMessage('Failed to open quest log: ' + error.message);
            // Show buttons again on error
            this.showDOMButtons();
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

    openPlayerProgression() {
        console.log('BoatMenuScene: Opening player progression');
        this.audioManager?.playSFX('button');
        
        // Hide DOM buttons when opening UI
        this.hideDOMButtons();
        console.log('BoatMenuScene: DOM buttons hidden for player progression UI');
        
        // Ensure UI is created
        this.ensureUIsCreated();
        
        if (this.playerProgressionUI) {
            // Set up close callback if not already set
            if (!this.playerProgressionUI.closeCallbackSet) {
                const originalHide = this.playerProgressionUI.hide;
                this.playerProgressionUI.hide = () => {
                    originalHide.call(this.playerProgressionUI);
                    this.showDOMButtons();
                    console.log('BoatMenuScene: DOM buttons shown after player progression close');
                };
                this.playerProgressionUI.closeCallbackSet = true;
            }
            
            this.playerProgressionUI.show();
            console.log('BoatMenuScene: Player progression UI opened successfully');
        } else {
            console.error('BoatMenuScene: Player progression UI not available');
            this.showErrorMessage('Player progression interface not available');
            // Show buttons again on error
            this.showDOMButtons();
        }
    }

    openFishCollection() {
        console.log('BoatMenuScene: Opening fish collection');
        this.audioManager?.playSFX('button');
        
        // Hide DOM buttons when opening UI
        this.hideDOMButtons();
        console.log('BoatMenuScene: DOM buttons hidden for fish collection UI');
        
        // Ensure UI is created
        this.ensureUIsCreated();
        
        if (this.fishCollectionUI) {
            // Set up close callback if not already set
            if (!this.fishCollectionUI.closeCallbackSet) {
                const originalHide = this.fishCollectionUI.hide;
                this.fishCollectionUI.hide = () => {
                    originalHide.call(this.fishCollectionUI);
                    this.showDOMButtons();
                    console.log('BoatMenuScene: DOM buttons shown after fish collection close');
                };
                this.fishCollectionUI.closeCallbackSet = true;
            }
            
            this.fishCollectionUI.show();
            console.log('BoatMenuScene: Fish collection UI opened successfully');
        } else {
            console.error('BoatMenuScene: Fish collection UI not available');
            this.showErrorMessage('Fish collection interface not available');
            // Show buttons again on error
            this.showDOMButtons();
        }
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
        // Hide DOM buttons when showing tournament overlay
        this.hideDOMButtons();
        console.log('BoatMenuScene: DOM buttons hidden for tournament overlay');
        
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
            const enterButton = this._createStyledButton(panelX + 150, buttonY, 'ENTER TOURNAMENT', () => {
                this.enterTournament(tournamentInfo);
                this.closeTournamentOverlay();
            }, 'tournament', { width: 300, height: 50 });
            enterButton.setDepth(2002);
        }
        
        // Leaderboard button
        const leaderboardButton = this._createStyledButton(panelX + 300, buttonY, 'LEADERBOARD', () => {
            this.showTournamentLeaderboard();
        }, 'tournament', { width: 300, height: 50 });
        leaderboardButton.setDepth(2002);
        
        // Close button
        const closeButton = this._createStyledButton(panelX + 450, buttonY, 'CLOSE', () => {
            this.closeTournamentOverlay();
        }, 'tournament', { width: 100, height: 50 });
        closeButton.setDepth(2002);
        
        // Store overlay elements for cleanup
        this.tournamentOverlay = { overlay, panel, title, info, buttons: [closeButton] };
        if (tournamentInfo.active) {
            this.tournamentOverlay.buttons.push(enterButton);
        }
        this.tournamentOverlay.buttons.push(leaderboardButton);
    }

    enterTournament(tournamentInfo) {
        if (this.tournamentManager.isEntering) return;
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
        const closeButton = this._createStyledButton(panelX + panelWidth/2, panelY + panelHeight - 50, 'CLOSE', () => {
            this.closeLeaderboardOverlay();
        }, 'tournament', { width: 100, height: 50 });
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
            
            // Show DOM buttons again when tournament overlay closes
            this.showDOMButtons();
            console.log('BoatMenuScene: DOM buttons shown after tournament overlay close');
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
            
            // Show DOM buttons again when leaderboard overlay closes
            this.showDOMButtons();
            console.log('BoatMenuScene: DOM buttons shown after leaderboard overlay close');
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

        // Fix location synchronization - ensure both location properties are synchronized
        const currentLocation = statusData.location || this.gameState?.player?.currentLocation || 'Starting Port';
        
        // Sync both location properties to avoid mismatches
        if (this.gameState) {
            if (!this.gameState.world) {
                this.gameState.world = {};
            }
            this.gameState.player.currentLocation = currentLocation;
            this.gameState.world.currentLocation = currentLocation;
        }
        
        this.locationText.setText(`Location: ${currentLocation}`);
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
        // Use the new DOM button system
        this.updateDOMButtonStates(data);
        
        // Also update the original DOM FISH button if it exists
        const currentLocation = data.location || this.gameState?.player?.currentLocation || 'Starting Port';
        let availableActions = ['fish', 'cabin', 'inventory', 'travel', 'crafting', 'quests'];
        
        if (currentLocation === 'Starting Port') {
            availableActions.push('shop');
        }
        
        const actions = data.availableActions || availableActions;
        
        // FISH button is now part of the DOM button system and handled by updateDOMButtonStates
        
        console.log(`BoatMenuScene: Updated button states using DOM system - Location: ${currentLocation}`);
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
        // Player button is now created as part of the DOM button system in createActionButtons
        console.log('BoatMenuScene: Player button created as DOM button in createActionButtons');
    }

    createCollectionButton(width, height) {
        // Collection button is now created as part of the DOM button system in createActionButtons
        console.log('BoatMenuScene: Collection button created as DOM button in createActionButtons');
    }

    update() {
        // Update game loop
        if (this.gameLoop) {
            this.gameLoop.update();
        }
    }

    destroy() {
        console.log('BoatMenuScene: Destroying scene and cleaning up DOM buttons');
        
        // CRITICAL: Clean up all DOM buttons before scene destruction
        this.destroyDOMButtons();
        
        // Clean up any remaining standalone DOM FISH button (legacy)
        if (this.domFishButton) {
            this.domFishButton.remove();
            this.domFishButton = null;
        }
        
        // Clean up all DOM button containers to ensure no orphaned elements
        const existingContainers = document.querySelectorAll('#boat-menu-buttons-container');
        existingContainers.forEach(container => {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
                console.log('BoatMenuScene: Removed orphaned DOM button container');
            }
        });
        
        // Clean up any individual DOM buttons that might have escaped
        const existingButtons = document.querySelectorAll('[id^="boatmenu-"]');
        existingButtons.forEach(button => {
            if (button.parentNode) {
                button.parentNode.removeChild(button);
                console.log('BoatMenuScene: Removed orphaned DOM button:', button.id);
            }
        });
        
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
        if (this.questManager) {
            // QuestManager doesn't have a destroy method, just clear the reference
            this.questManager = null;
        }
        
        // Clean up Quest Tracker UI
        if (this.questTrackerUI) {
            try {
                this.questTrackerUI.destroy();
                this.questTrackerUI = null;
                console.log('BoatMenuScene: Quest Tracker UI cleaned up');
            } catch (error) {
                console.warn('BoatMenuScene: Error cleaning up Quest Tracker UI:', error);
            }
        }
        
        // Clean up quest manager check timer
        if (this.questManagerCheckTimer) {
            this.questManagerCheckTimer.destroy();
            this.questManagerCheckTimer = null;
            console.log('BoatMenuScene: Cleaned up QuestManager check timer');
        }
        
        console.log('BoatMenuScene: Scene destruction completed');
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
            
            // Set up close callback for player progression UI
            if (this.playerProgressionUI && !this.playerProgressionUI.closeCallbackSet) {
                const originalHide = this.playerProgressionUI.hide;
                this.playerProgressionUI.hide = () => {
                    originalHide.call(this.playerProgressionUI);
                    this.showDOMButtons();
                    console.log('BoatMenuScene: DOM buttons shown after player progression close');
                };
                this.playerProgressionUI.closeCallbackSet = true;
            }
            
            console.log('BoatMenuScene: PlayerProgressionUI created successfully');
        } catch (error) {
            console.error('BoatMenuScene: Error creating PlayerProgressionUI:', error);
            this.playerProgressionUI = null;
        }
        
        try {
            this.fishCollectionUI = new FishCollectionUI(this, 50, 50, 900, 650);
            
            // Set up close callback for fish collection UI
            if (this.fishCollectionUI && !this.fishCollectionUI.closeCallbackSet) {
                const originalHide = this.fishCollectionUI.hide;
                this.fishCollectionUI.hide = () => {
                    originalHide.call(this.fishCollectionUI);
                    this.showDOMButtons();
                    console.log('BoatMenuScene: DOM buttons shown after fish collection close');
                };
                this.fishCollectionUI.closeCallbackSet = true;
            }
            
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
    
    /**
     * Complete quest objective for accessing boat menu
     */
    completeBoatMenuQuestObjective() {
        console.log('BoatMenuScene: Attempting to complete boat menu quest objective...');
        
        try {
            // CRITICAL FIX: Use shared QuestManager from GameState instead of local instance
            const questManager = this.gameState.questManager;
        
        if (!questManager) {
            console.warn('BoatMenuScene: No QuestManager available in GameState - cannot complete quest objective');
            this.time.delayedCall(1000, () => {
                this.showInfoMessage('Boat menu accessed\n(QuestManager not available)');
            });
            return;
        }
        
        console.log('BoatMenuScene: QuestManager found, processing quest objective...');
        console.log('BoatMenuScene: Active quests before processing:', Array.from(questManager.activeQuests.keys()));
        console.log('BoatMenuScene: Completed quests:', Array.from(questManager.completedQuests));
        console.log('BoatMenuScene: Available quests:', Array.from(questManager.availableQuests.keys()));
        console.log('BoatMenuScene: Quest templates count:', questManager.questTemplates.size);
        
        // Debug: Check if tutorial quest is in templates
        const tutorialTemplate = questManager.questTemplates.get('story_001_tutorial');
        if (tutorialTemplate) {
            console.log('BoatMenuScene: Tutorial template found:', {
                id: tutorialTemplate.id,
                title: tutorialTemplate.title,
                status: tutorialTemplate.status,
                autoStart: tutorialTemplate.autoStart
            });
        } else {
            console.warn('BoatMenuScene: Tutorial template NOT found in questTemplates');
            console.log('BoatMenuScene: Available templates:', Array.from(questManager.questTemplates.keys()));
        }
        
        // CRITICAL FIX: Check if tutorial quest is actually active before processing
        let tutorialQuest = questManager.activeQuests.get('story_001_tutorial');
        if (!tutorialQuest) {
            console.warn('BoatMenuScene: Tutorial quest not found in active quests - checking if it can be started');
            
            // Check if tutorial quest exists in quest templates
            const tutorialTemplate = questManager.questTemplates.get('story_001_tutorial');
            if (tutorialTemplate) {
                console.log('BoatMenuScene: Tutorial quest template found, attempting to start quest');
                
                // Try to start the tutorial quest
                const questStarted = questManager.startQuest('story_001_tutorial');
                if (questStarted) {
                    console.log('BoatMenuScene: ✅ Tutorial quest started successfully');
                    tutorialQuest = questManager.activeQuests.get('story_001_tutorial');
                } else {
                    console.error('BoatMenuScene: ❌ Failed to start tutorial quest');
                }
            } else {
                console.error('BoatMenuScene: Tutorial quest template not found in quest templates');
            }
            
            // If still no tutorial quest, show fallback message
            if (!tutorialQuest) {
                console.warn('BoatMenuScene: Cannot start or find tutorial quest - showing fallback message');
                this.time.delayedCall(1000, () => {
                    this.showInfoMessage('Boat menu accessed\n(Tutorial quest could not be started)');
                });
                return;
            }
        }
        
        console.log('BoatMenuScene: Tutorial quest found, checking objectives:', tutorialQuest.objectives);
        
        // Check if visit_boat_menu objective exists and is not completed
        const boatMenuObjective = tutorialQuest.objectives.find(obj => obj.id === 'visit_boat_menu');
        if (!boatMenuObjective) {
            console.warn('BoatMenuScene: visit_boat_menu objective not found in tutorial quest');
            this.time.delayedCall(1000, () => {
                this.showInfoMessage('Boat menu accessed\n(Objective not found)');
            });
            return;
        }
        
        if (boatMenuObjective.completed) {
            console.log('BoatMenuScene: visit_boat_menu objective already completed');
            this.time.delayedCall(1000, () => {
                this.showInfoMessage('Boat menu accessed\n(Objective already completed)');
            });
            return;
        }
        
        console.log('BoatMenuScene: visit_boat_menu objective found and incomplete, proceeding...');
        
        // CRITICAL FIX: Emit the event GLOBALLY using the game's event bus
        console.log('BoatMenuScene: Emitting boat:menuAccessed event GLOBALLY...');
        this.game.events.emit('boat:menuAccessed');
        
        // CRITICAL FIX: Wait for quest processing to complete, then verify completion
        this.time.delayedCall(300, () => {
            console.log('BoatMenuScene: Verifying quest objective completion...');
            
            // Re-check the objective to see if it was completed
            const updatedQuest = questManager.activeQuests.get('story_001_tutorial');
            if (updatedQuest) {
                const updatedObjective = updatedQuest.objectives.find(obj => obj.id === 'visit_boat_menu');
                if (updatedObjective && updatedObjective.completed) {
                    console.log('BoatMenuScene: ✅ visit_boat_menu objective confirmed as completed');
                    this.showSuccessMessage('✅ Quest Objective Complete!\nAccessed the boat menu');
                    
                    // Trigger UI refresh for quest tracker
                    if (this.questTrackerUI) {
                        console.log('BoatMenuScene: Refreshing quest tracker UI');
                        this.questTrackerUI.refreshQuests();
                    }
                } else {
                    console.warn('BoatMenuScene: ❌ visit_boat_menu objective was not completed after processing');
                    
                    // MANUAL FIX: Try to complete the objective directly
                    console.log('BoatMenuScene: Attempting manual objective completion...');
                    const manualResult = questManager.completeObjective('story_001_tutorial', 'visit_boat_menu');
                    
                    if (manualResult) {
                        console.log('BoatMenuScene: ✅ Manual objective completion successful');
                        this.showSuccessMessage('✅ Quest Objective Complete!\nAccessed the boat menu');
                        
                        // Trigger UI refresh for quest tracker
                        if (this.questTrackerUI) {
                            this.questTrackerUI.refreshQuests();
                        }
                    } else {
                        console.error('BoatMenuScene: ❌ Manual objective completion failed');
                        this.showInfoMessage('Boat menu accessed\n❌ Quest objective not completed');
                    }
                }
            } else {
                console.warn('BoatMenuScene: Tutorial quest no longer active - may have been completed');
                this.showInfoMessage('Boat menu accessed\n(Quest may have completed)');
            }
        });
        
    } catch (error) {
        console.error('BoatMenuScene: Error completing boat menu quest objective:', error);
        this.time.delayedCall(1000, () => {
            this.showInfoMessage('Boat menu accessed\n(Quest error: ' + error.message + ')');
        });
    }
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
            
            // Recreate DOM FISH button if it was removed during fishing
            if (!this.domFishButton) {
                const width = this.cameras.main.width;
                const height = this.cameras.main.height;
                const buttonY = height * 0.75;
                const buttonSpacing = (width - 100) / 6;
                this.createDOMFishButton(50 + buttonSpacing * 1, buttonY);
            }
            
            console.log('BoatMenuScene: Fishing session results processed successfully');
            
        } catch (error) {
            console.error('BoatMenuScene: Error processing fishing session results:', error);
        }
    }

    /**
     * Create DOM-based FISH button for enhanced interaction
     */
    createDOMFishButton(x, y) {
        console.log('BoatMenuScene: Creating DOM FISH button at', x, y);
        
        // Remove existing button if it exists
        if (this.domFishButton) {
            this.domFishButton.remove();
            this.domFishButton = null;
        }
        
        // Create the DOM button
        this.domFishButton = document.createElement('button');
        this.domFishButton.innerHTML = '🎣 FISH';
        this.domFishButton.id = 'boatmenu-fish-button';
        
        // Enhanced styling for underwater theme
        Object.assign(this.domFishButton.style, {
            position: 'absolute',
            left: x + 'px',
            top: y + 'px',
            width: '120px',
            height: '50px',
            fontSize: '16px',
            fontWeight: 'bold',
            fontFamily: 'Arial Black, Arial, sans-serif',
            color: '#ffffff',
            background: 'linear-gradient(135deg, #0077be 0%, #004d7a 50%, #002a44 100%)',
            border: '3px solid #00bfff',
            borderRadius: '15px',
            cursor: 'pointer',
            zIndex: '1000',
            boxShadow: '0 6px 15px rgba(0, 119, 190, 0.4), inset 0 2px 5px rgba(255, 255, 255, 0.2)',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
            transform: 'translateX(-50%)',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            backgroundSize: '200% 200%',
            animation: 'ocean-wave 3s ease-in-out infinite alternate'
        });
        
        // Add ocean wave animation
        const waveAnimation = `
            @keyframes ocean-wave {
                0% { background-position: 0% 50%; }
                100% { background-position: 100% 50%; }
            }
        `;
        
        if (!document.querySelector('#ocean-wave-animation')) {
            const style = document.createElement('style');
            style.id = 'ocean-wave-animation';
            style.textContent = waveAnimation;
            document.head.appendChild(style);
        }
        
        // Enhanced hover effects
        this.domFishButton.addEventListener('mouseenter', () => {
            Object.assign(this.domFishButton.style, {
                transform: 'translateX(-50%) translateY(-3px) scale(1.05)',
                boxShadow: '0 8px 20px rgba(0, 191, 255, 0.6), inset 0 3px 8px rgba(255, 255, 255, 0.3)',
                background: 'linear-gradient(135deg, #00bfff 0%, #0077be 50%, #004d7a 100%)',
                borderColor: '#40e0d0'
            });
        });
        
        this.domFishButton.addEventListener('mouseleave', () => {
            Object.assign(this.domFishButton.style, {
                transform: 'translateX(-50%) translateY(0) scale(1)',
                boxShadow: '0 6px 15px rgba(0, 119, 190, 0.4), inset 0 2px 5px rgba(255, 255, 255, 0.2)',
                background: 'linear-gradient(135deg, #0077be 0%, #004d7a 50%, #002a44 100%)',
                borderColor: '#00bfff'
            });
        });
        
        // Click event
        this.domFishButton.addEventListener('click', () => {
            console.log('BoatMenuScene: DOM FISH button clicked');
            this.startFishing();
        });
        
        // Add to document
        document.body.appendChild(this.domFishButton);
        console.log('BoatMenuScene: DOM FISH button created and added to document');
    }

    /**
     * Create Mia's portrait display in the center of the screen
     */
    createMiaPortraitDisplay(width, height) {
        console.log('BoatMenuScene: Creating Mia portrait display on right side');
        
        // Right side position
        const portraitX = width - 150;  // 150px from right edge
        const portraitY = height / 2;   // Centered vertically
        
        // Create background frame for the portrait
        const portraitFrame = this.add.graphics();
        portraitFrame.fillStyle(0xffd700, 0.9); // Gold frame
        portraitFrame.fillRoundedRect(portraitX - 102, portraitY - 152, 204, 304, 15);
        portraitFrame.lineStyle(4, 0xb8860b, 1);
        portraitFrame.strokeRoundedRect(portraitX - 102, portraitY - 152, 204, 304, 15);
        portraitFrame.setDepth(5000);
        
        // Inner frame
        const innerFrame = this.add.graphics();
        innerFrame.fillStyle(0x8B4513, 0.8);
        innerFrame.fillRoundedRect(portraitX - 95, portraitY - 145, 190, 290, 10);
        innerFrame.setDepth(5001);
        
        // Try to load Mia's actual portrait
        const portraitKeys = [
            'mia-portrait', 
            'portrait-mia', 
            'mia-full',
            'mia-portrait-alt',
            'mia-portrait-public'
        ];
        let portraitAdded = false;
        
        // Debug: Check all available textures
        console.log('BoatMenuScene: All available textures:', Object.keys(this.textures.list));
        console.log('BoatMenuScene: Checking for Mia portrait keys:', portraitKeys);
        
        for (const key of portraitKeys) {
            console.log(`BoatMenuScene: Checking texture key '${key}' - exists: ${this.textures.exists(key)}`);
            if (this.textures.exists(key)) {
                try {
                    console.log(`🎯 BoatMenuScene: Creating Mia portrait with key '${key}'`);
                    
                    // Get texture info for debugging
                    const texture = this.textures.get(key);
                    console.log(`🔍 BoatMenuScene: Texture '${key}' info:`, {
                        source: texture.source?.[0]?.image?.src || 'unknown',
                        width: texture.source?.[0]?.width || 'unknown',
                        height: texture.source?.[0]?.height || 'unknown',
                        type: texture.source?.[0]?.image ? 'image' : 'canvas'
                    });
                    
                    const miaPortrait = this.add.image(portraitX, portraitY, key);
                    miaPortrait.setDisplaySize(180, 280);
                    miaPortrait.setOrigin(0.5);
                    miaPortrait.setDepth(5002);
                    miaPortrait.setVisible(true);
                    miaPortrait.setAlpha(1);
                    
                    console.log(`✅ BoatMenuScene: Mia portrait '${key}' created successfully on right side - size: ${miaPortrait.displayWidth}x${miaPortrait.displayHeight}, position: (${miaPortrait.x}, ${miaPortrait.y}), depth: ${miaPortrait.depth}`);
                    
                    portraitAdded = true;
                    break;
            } catch (error) {
                    console.error(`❌ BoatMenuScene: Error creating portrait with key '${key}':`, error);
                }
            }
        }
        
        // Fallback if no actual portrait found
        if (!portraitAdded) {
            console.log('BoatMenuScene: No actual portrait found, creating fallback');
            const fallbackText = this.add.text(portraitX, portraitY, 'MIA', {
                fontSize: '64px',
                fontFamily: 'Georgia, serif',
                fill: '#ffd700',
                fontStyle: 'bold',
                stroke: '#8B4513',
                strokeThickness: 3
            });
            fallbackText.setOrigin(0.5);
            fallbackText.setDepth(5002);
        }
        
        // Add title below the portrait
        const titleText = this.add.text(portraitX, portraitY + 180, 'Bikini Assistant Mia', {
            fontSize: '24px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700',
            fontStyle: 'bold',
            stroke: '#8B4513',
            strokeThickness: 2
        });
        titleText.setOrigin(0.5);
        titleText.setDepth(5003);
        
        console.log('BoatMenuScene: Mia portrait display created on right side of screen');
    }

    hideFishButton() {
        if (this.domFishButton) {
            this.domFishButton.style.display = 'none';
        }
    }

    showFishButton() {
        if (this.domFishButton) {
            this.domFishButton.style.display = 'block';
        }
    }

    /**
     * Check and show reward UI for completed quests
     */
    checkAndShowCompletedQuestRewards() {
        try {
            console.log('BoatMenuScene: Checking for pending quest rewards...');
            
            if (this.questManager) {
                // Use the new reward queue system
                const pendingRewards = this.questManager.getAndClearPendingRewards();
                
                if (pendingRewards.length > 0) {
                    console.log(`BoatMenuScene: Found ${pendingRewards.length} quests with pending rewards.`);
                    
                    // Process each pending reward
                    pendingRewards.forEach((questId, index) => {
                        const questData = this.questManager.getQuestData(questId);
                        if (questData) {
                            console.log(`BoatMenuScene: Showing reward UI for quest: ${questData.title}`);
                            // Use a delay to show multiple reward popups one after another
                            this.time.delayedCall(index * 2000, () => {
                                this.questManager.showQuestRewardUI(questData);
                            });
                        } else {
                            console.warn(`BoatMenuScene: Could not find quest data for completed quest ID: ${questId}`);
                        }
                    });
                } else {
                    console.log('BoatMenuScene: No pending quest rewards to show.');
                }
            } else {
                console.warn('BoatMenuScene: QuestManager not available for reward check');
            }
        } catch (error) {
            console.error('BoatMenuScene: Error checking completed quest rewards:', error);
        }
    }

    /**
     * Show direct reward UI without QuestManager (for testing)
     */
    showDirectRewardUI() {
        console.log('BoatMenuScene: Creating direct reward UI');
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create overlay
        const overlay = this.add.container(0, 0);
        
        // Background
        const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.8);
        bg.setOrigin(0);
        bg.setInteractive();
        overlay.add(bg);
        
        // Panel
        const panelWidth = Math.min(600, width - 40);
        const panelHeight = Math.min(500, height - 40);
        const centerX = width / 2;
        const centerY = height / 2;
        
        const panel = this.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x1a1a1a, 0.95);
        panel.setStrokeStyle(3, 0xFFD700);
        overlay.add(panel);
        
        // Title
        const title = this.add.text(centerX, centerY - panelHeight/2 + 40, '🎉 QUEST COMPLETED! 🎉', {
            fontSize: '28px',
            fill: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        overlay.add(title);
        
        // Quest name
        const questName = this.add.text(centerX, centerY - panelHeight/2 + 80, 'Welcome to Luxury Angling', {
            fontSize: '20px',
            fill: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        overlay.add(questName);
        
        // Rewards display
        let currentY = centerY - 60;
        
        // Experience
        const expText = this.add.text(centerX, currentY, '📈 Experience: +100', {
            fontSize: '16px',
            fill: '#00FF00'
        }).setOrigin(0.5);
        overlay.add(expText);
        currentY += 30;
        
        // Coins
        const coinText = this.add.text(centerX, currentY, '💰 Coins: +500', {
            fontSize: '16px',
            fill: '#FFD700'
        }).setOrigin(0.5);
        overlay.add(coinText);
        currentY += 30;
        
        // Items
        const itemText = this.add.text(centerX, currentY, '🎁 Items: Basic Rod, Basic Lure', {
            fontSize: '16px',
            fill: '#FFFFFF'
        }).setOrigin(0.5);
        overlay.add(itemText);
        currentY += 30;
        
        // Progress
        const progressText = this.add.text(centerX, currentY, 'Quest Progress: 1 quest completed', {
            fontSize: '14px',
            fill: '#888888',
            fontStyle: 'italic'
        }).setOrigin(0.5);
        overlay.add(progressText);
        
        // Close button
        const closeButton = this.add.rectangle(centerX, centerY + panelHeight/2 - 40, 150, 40, 0xFFD700, 0.9);
        closeButton.setStrokeStyle(2, 0xFFFFFF);
        const closeText = this.add.text(centerX, centerY + panelHeight/2 - 40, 'Continue', {
            fontSize: '16px',
            fill: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        overlay.add(closeButton);
        overlay.add(closeText);
        
        // Make interactive
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.on('pointerdown', () => {
            console.log('BoatMenuScene: Closing direct reward overlay');
            overlay.destroy();
        });
        
        bg.on('pointerdown', () => {
            console.log('BoatMenuScene: Closing direct reward overlay (background click)');
            overlay.destroy();
        });
        
        overlay.setDepth(10000);
        
        // Animate in
        overlay.setAlpha(0);
        this.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
        
        console.log('BoatMenuScene: Direct reward UI created successfully');
    }

    // --- LEGACY PHASER BUTTON METHODS REMOVED ---
    // All buttons are now DOM-based for better interaction and styling

    /**
     * Check if QuestManager has become available and complete boat menu objective retroactively
     */
    checkForQuestManagerAndCompleteObjective() {
        console.log('BoatMenuScene: Checking for available QuestManager...');
        console.log('BoatMenuScene: GameState QuestManager exists:', !!this.gameState.questManager);
        console.log('BoatMenuScene: Current QuestManager reference:', !!this.questManager);
        
        // ENHANCED FIX: Check all possible sources for QuestManager
        let foundQuestManager = null;
        
        // Priority 1: GameState QuestManager
        if (this.gameState.questManager) {
            foundQuestManager = this.gameState.questManager;
            console.log('BoatMenuScene: QuestManager found in GameState');
        } else {
            // Priority 2: Check other running scenes
            const gameScene = this.scene.get('GameScene');
            const questScene = this.scene.get('QuestScene');
            
            if (gameScene && gameScene.questManager) {
                foundQuestManager = gameScene.questManager;
                console.log('BoatMenuScene: QuestManager found in GameScene');
                
                // Store it in GameState for future use
                this.gameState.questManager = foundQuestManager;
                console.log('BoatMenuScene: QuestManager stored in GameState from GameScene');
            } else if (questScene && questScene.questManager) {
                foundQuestManager = questScene.questManager;
                console.log('BoatMenuScene: QuestManager found in QuestScene');
                
                // Store it in GameState for future use
                this.gameState.questManager = foundQuestManager;
                console.log('BoatMenuScene: QuestManager stored in GameState from QuestScene');
            }
        }
        
        if (foundQuestManager && !this.questManager) {
            console.log('BoatMenuScene: 🎉 QuestManager now available! Setting up retroactive quest completion...');
            
            // Set the QuestManager reference
            this.questManager = foundQuestManager;
            
            // Debug QuestManager state
            console.log('BoatMenuScene: QuestManager active quests:', Array.from(this.questManager.activeQuests.keys()));
            console.log('BoatMenuScene: QuestManager quest templates count:', this.questManager.questTemplates.size);
            
            // Complete the boat menu quest objective
            console.log('BoatMenuScene: Attempting retroactive boat menu objective completion...');
            this.completeBoatMenuQuestObjective();
            
            // Update QuestTrackerUI if it exists and was created with null QuestManager
            if (this.questTrackerUI && this.questTrackerUI.questProcessingDisabled) {
                console.log('BoatMenuScene: Updating QuestTrackerUI with newly available QuestManager...');
                try {
                    // Check if tutorial is completed
                    const tutorialCompleted = this.questManager.completedQuests.has('story_001_tutorial');
                    console.log('BoatMenuScene: Tutorial completed status:', tutorialCompleted);
                    
                    if (!tutorialCompleted) {
                        // Use the new updateQuestManager method instead of recreating
                        console.log('BoatMenuScene: Enabling quest processing on existing QuestTrackerUI...');
                        this.questTrackerUI.updateQuestManager(this.questManager);
                        console.log('BoatMenuScene: ✅ QuestTrackerUI updated with active quest processing');
                    } else {
                        console.log('BoatMenuScene: Tutorial already completed, keeping QuestTrackerUI disabled');
                    }
                } catch (error) {
                    console.error('BoatMenuScene: Error updating QuestTrackerUI:', error);
                }
            } else if (this.questTrackerUI) {
                console.log('BoatMenuScene: QuestTrackerUI already has quest processing enabled, refreshing...');
                this.questTrackerUI.refreshQuests();
            }
            
            // Stop the timer since we found the QuestManager
            if (this.questManagerCheckTimer) {
                this.questManagerCheckTimer.destroy();
                this.questManagerCheckTimer = null;
                console.log('BoatMenuScene: ✅ Stopped QuestManager check timer - retroactive setup complete');
            }
            
        } else if (!foundQuestManager) {
            console.log('BoatMenuScene: QuestManager still not available, will check again...');
        } else if (this.questManager) {
            console.log('BoatMenuScene: QuestManager already set, stopping check timer');
            if (this.questManagerCheckTimer) {
                this.questManagerCheckTimer.destroy();
                this.questManagerCheckTimer = null;
                console.log('BoatMenuScene: Stopped redundant QuestManager check timer');
            }
        }
    }
}