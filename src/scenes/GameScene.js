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
import { TimeManager } from '../scripts/TimeManager.js';
import { WeatherManager } from '../scripts/WeatherManager.js';
import { AudioManager } from '../scripts/AudioManager.js';
// import { MapSelectionUI } from '../ui/MapSelectionUI.js';
import { EquipmentEnhancer } from '../scripts/EquipmentEnhancer.js';
import { EquipmentEnhancementUI } from '../ui/EquipmentEnhancementUI.js';
import DialogManager from '../scripts/DialogManager.js';
import { QuestManager } from '../scripts/QuestManager.js';
import UITheme from '../ui/UITheme.js';
import { LoadingStateManager } from '../ui/LoadingStateManager.js';
import { RenJsDebugUI } from '../ui/RenJsDebugUI.js';
import { AchievementPopupSystem } from '../ui/AchievementPopupSystem.js';
import { RenJsSaveIntegration } from '../scripts/RenJsSaveIntegration.js';
import { QTEDebugTool } from '../ui/QTEDebugTool.js';
import { QuestTrackerUI } from '../ui/QuestTrackerUI.js';
import Logger from '../utils/Logger.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        // Define depth layers for consistent UI layering
        this.DEPTH_LAYERS = {
            BACKGROUND: -100,           // Background elements
            WATER_EFFECTS: -50,         // Water ripples, effects
            OVERLAYS: -10,              // Dark overlays, background panels
            FISHING_SPOTS: 50,          // Fishing spots and hotspots
            GAME_ELEMENTS: 100,         // Crosshair, fishing rod, lure
            FISHING_LINE: 190,          // Fishing line
            FISHING_ROD: 200,           // Fishing rod
            UI_PANELS: 1000,            // UI panels and containers
            UI_BUTTONS: 1500,           // UI buttons
            UI_TEXT: 1501,              // UI button text
            UI_INTERACTIVE: 1502,       // Interactive areas
            MODALS: 2000,               // Modal dialogs
            TOOLTIPS: 2500,             // Tooltips and notifications
            DEBUG: 3000                 // Debug overlays
        };
    }

    async create(data) {
                // Initialize async components in the background
        this.initializeAsyncComponents(data).catch(error => {
            console.error('GameScene: Async component initialization failed, but scene will continue:', error);
        });
        
        // Continue with synchronous initialization
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Store scene transition data
        this.sceneData = data || {};
        this.callingScene = this.sceneData.callingScene || null;
        this.fishingSession = this.sceneData.fishingSession || false;
        
                // Get game state instance and scene manager
        this.gameState = GameState.getInstance();
        this.gameState.startAutoSave();
        this.sceneManager = SceneManager.getInstance();
        this.sceneManager.setCurrentScene(this);

        // Initialize LoadingStateManager first (Priority 2.0 - RenJs Component 4)
        try {
            this.loadingStateManager = new LoadingStateManager(this);
                    } catch (error) {
            console.error('GameScene: Error initializing LoadingStateManager:', error);
            this.loadingStateManager = null;
        }

        // Initialize RenJs Integration Components (Priority 2.0 Final Polish)
        try {
                        // Initialize Debug UI (Component 1)
            this.renJsDebugUI = new RenJsDebugUI(this);
            
            // Initialize Achievement Popup System (Component 2)
            this.achievementPopupSystem = new AchievementPopupSystem(this);
            
            // Initialize QTE Debug Tool for testing and debugging
            this.qteDebugTool = new QTEDebugTool(this);
            
            // Initialize Save Integration (Component 3) - will be completed after other managers
            
                    } catch (error) {
            console.error('GameScene: Error initializing RenJs integration:', error);
            this.renJsDebugUI = null;
            this.achievementPopupSystem = null;
            this.qteDebugTool = null;
        }

        // Initialize audio manager for this scene
        this.audioManager = this.gameState.getAudioManager(this);
        if (this.audioManager) {
            this.audioManager.setSceneAudio('GameScene');
                    }

        // Show loading for scene initialization
        if (this.loadingStateManager) {
            this.loadingStateManager.showLoading('scene_init', {
                type: 'progress',
                message: 'Initializing Fishing Scene...',
                position: 'center'
            });
        }

        // Initialize Time & Weather Systems (Priority 1.4) with error handling
        try {
                        // Update loading progress
            if (this.loadingStateManager) {
                this.loadingStateManager.updateProgress('scene_init', 20, 'Setting up time and weather...');
            }
            
            // Initialize TimeManager first (it's more stable)
            this.timeManager = new TimeManager(this, this.gameState);
                        // Store TimeManager in gameState for access by other systems
            this.gameState.timeManager = this.timeManager;
            
            // Try to initialize WeatherManager separately with additional error handling
            try {
                this.weatherManager = new WeatherManager(this, this.gameState, this.timeManager);
                this.gameState.weatherManager = this.weatherManager;
                            } catch (weatherError) {
                console.error('GameScene: WeatherManager initialization failed:', weatherError);
                console.error('GameScene: WeatherManager error details:', weatherError.message);
                
                // Continue without WeatherManager but keep TimeManager
                this.weatherManager = null;
                this.gameState.weatherManager = null;
                
                console.warn('GameScene: Continuing with TimeManager only (WeatherManager disabled)');
            }
            
                    } catch (error) {
            console.error('GameScene: Critical error in Time & Weather systems initialization:', error);
            console.error('GameScene: Error stack:', error.stack);
            
            // Disable both systems if TimeManager fails
            this.timeManager = null;
            this.weatherManager = null;
            this.gameState.timeManager = null;
            this.gameState.weatherManager = null;
            
            console.warn('GameScene: Time & Weather systems completely disabled due to initialization errors');
        }

        // Update loading progress
        if (this.loadingStateManager) {
            this.loadingStateManager.updateProgress('scene_init', 40, 'Creating game environment...');
        }

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
                ripple.setDepth(this.DEPTH_LAYERS.WATER_EFFECTS);
                
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

        // Initialize quest manager with proper context from BoatMenuScene
        this.initializeQuestManager(data);
        
        // Set up quest event listeners for active quest processing
        if (this.questManager) {
                        this.setupQuestEventListeners();
        }
        
        // Initialize input manager and player controller
        this.inputManager = new InputManager(this);
        this.playerController = new PlayerController(this);

        // Add some fish in the water (swimming in the distance) using configuration
        try {
            this.fishGroup = this.physics.add.group();
            
            // Create permanent hotspot first
            this.createPermanentHotspot();
            
            // Create additional fishing spots system
            this.createFishingSpots();
            
            // Then create fish population with more fish near hotspot
            this.createFishPopulation();
        } catch (error) {
            console.error('GameScene: Error creating fish population:', error);
            // Create empty group as fallback
            this.fishGroup = this.physics.add.group();
        }

        // Update loading progress
        if (this.loadingStateManager) {
            this.loadingStateManager.updateProgress('scene_init', 60, 'Initializing game systems...');
        }

        // UI Elements - Update help text to include Return to Boat option
        const helpTextContent = this.fishingSession ? 
            'SPACEBAR: Cast | WASD: Control Lure | SPACEBAR: Reel | ESC: Return to Boat\n' +
            'I: Inventory | P: Progression | T: Time & Weather | E: Equipment Enhancement\n' +
            'B: Dialog (Mia) | F: Dialog (Sophie) | G: Dialog (Luna) | Q: Quest Log | Ctrl+Q: Quest Tracker | H: Toggle Help\n' +
            'F9 or Ctrl+Shift+Q: QTE Debug Tool | U: Fish Tuning Tool | Y: Luring Debug Tool' :
            'SPACEBAR: Cast | WASD: Control Lure | SPACEBAR: Reel\n' +
            'I: Inventory | P: Progression | T: Time & Weather | M: Map Selection | E: Equipment Enhancement\n' +
            'B: Dialog (Mia) | F: Dialog (Sophie) | G: Dialog (Luna) | Q: Quest Log | Ctrl+Q: Quest Tracker | Mouse: Navigate UI | H: Toggle Help\n' +
            'F9 or Ctrl+Shift+Q: QTE Debug Tool | U: Fish Tuning Tool | Y: Luring Debug Tool';
            
        this.helpText = this.add.text(10, 10, helpTextContent, {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });

        // Initialize Equipment Enhancement System (Priority 1.7) - BEFORE InventoryUI
        try {
                                                // Validate prerequisites
            if (!this.gameState) {
                throw new Error('GameState not available for Equipment Enhancement system');
            }
            
            if (!this.gameState.inventoryManager) {
                console.warn('GameScene: InventoryManager not available, Equipment Enhancement may have limited functionality');
            }
            
            // Create EquipmentEnhancer
            this.equipmentEnhancer = new EquipmentEnhancer(this.gameState, this.gameState.inventoryManager);
                        // Store enhancer in gameState for access by other systems
            this.gameState.equipmentEnhancer = this.equipmentEnhancer;
            
            // Create Equipment Enhancement UI
                        this.equipmentEnhancementUI = new EquipmentEnhancementUI(this, 50, 50, 800, 550);
                                                                    } catch (error) {
            console.error('GameScene: Error initializing Equipment Enhancement system:', error);
            console.error('GameScene: Equipment Enhancement error details:', error.message);
            console.error('GameScene: Error stack:', error.stack);
            
            // Set to null to prevent further errors
            this.equipmentEnhancer = null;
            this.equipmentEnhancementUI = null;
            
            console.warn('GameScene: Equipment Enhancement system disabled due to initialization error');
        }

        // Update loading progress
        if (this.loadingStateManager) {
            this.loadingStateManager.updateProgress('scene_init', 80, 'Creating user interfaces...');
        }

        // Create inventory UI AFTER Equipment Enhancement UI
        this.inventoryUI = new InventoryUI(this, 100, 50, 800, 600);

        // Create time and weather UI with proper managers (with safety checks)
        if (this.timeManager) {
            try {
                // Initialize TimeWeatherUI with available managers
                if (this.weatherManager) {
                    // Both TimeManager and WeatherManager available
                    this.timeWeatherUI = new TimeWeatherUI(this, this.timeManager, this.weatherManager, this.gameState);
                                    } else {
                    // Only TimeManager available (WeatherManager failed)
                    console.warn('GameScene: WeatherManager not available, initializing TimeWeatherUI with TimeManager only');
                    this.timeWeatherUI = new TimeWeatherUI(this, this.timeManager, null, this.gameState);
                                    }
                
                this.timeWeatherUI.show(); // Show by default
                            } catch (error) {
                console.error('GameScene: Error initializing TimeWeatherUI:', error);
                console.error('GameScene: TimeWeatherUI error details:', error.message);
                this.timeWeatherUI = null;
            }
        } else {
            console.warn('GameScene: TimeWeatherUI skipped - TimeManager not available');
            this.timeWeatherUI = null;
        }
        
        // Create map selection UI
        try {
            // this.mapSelectionUI = new MapSelectionUI(this, this.gameState.locationManager, this.gameState);
                    } catch (error) {
            console.error('GameScene: Error initializing MapSelectionUI:', error);
            this.mapSelectionUI = null;
        }

        // Create player progression UI
        this.playerProgressionUI = new PlayerProgressionUI(this, 50, 50, 900, 700);

        // Initialize Enhanced Achievement System (Priority 1.9)
        // This will be properly initialized when tournament manager becomes available
        try {
                        // Listen for when tournament manager becomes available (typically when transitioning to boat menu)
            this.events.on('tournamentManagerReady', (tournamentManager) => {
                try {
                    if (this.gameState.playerProgression && !this.gameState.playerProgression.achievementEnhancer) {
                                                if (this.gameState.playerProgression.initializeAchievementEnhancer) {
                            this.gameState.playerProgression.initializeAchievementEnhancer(tournamentManager);
                        }
                        
                        // Set up enhanced achievement event handling with error checking
                        if (this.gameState.playerProgression.on && typeof this.gameState.playerProgression.on === 'function') {
                            this.gameState.playerProgression.on('achievementUnlocked', (data) => {
                                if (this.playerProgressionUI && this.playerProgressionUI.showAchievementNotification) {
                                    this.playerProgressionUI.showAchievementNotification(data);
                                }
                            });
                            
                            this.gameState.playerProgression.on('achievementChainCompleted', (data) => {
                                if (this.playerProgressionUI && this.playerProgressionUI.showAchievementNotification) {
                                    // Show chain completion notification
                                    this.playerProgressionUI.showAchievementNotification({
                                        achievement: {
                                            name: `${data.chain.name} Complete!`,
                                            description: data.chain.description,
                                            icon: '🔗',
                                            tier: 'legendary',
                                            rewards: data.chain.rewards
                                        }
                                    });
                                }
                            });
                        }
                        
                                            }
                } catch (achievementError) {
                    console.error('GameScene: Error initializing enhanced achievement system:', achievementError);
                }
            });
            
                    } catch (error) {
            console.error('GameScene: Error setting up enhanced achievement system:', error);
        }

        // Create fish collection UI
        this.fishCollectionUI = new FishCollectionUI(this, 50, 50, 900, 650);

        // Initialize Dialog System for NPC interactions
        try {
                        // Validate prerequisites
            if (!this.gameState) {
                throw new Error('GameState not available for Dialog system');
            }
            
            this.dialogManager = new DialogManager(this);
                        // Load NPC data from save
            try {
                this.dialogManager.loadAllNPCData();
                            } catch (npcError) {
                console.warn('GameScene: Error loading NPC data, using defaults:', npcError.message);
            }
            
            // Set up dialog event listeners
            this.events.on('romance-meter-updated', (data) => {
                                // Could trigger UI updates or achievement checks here
            });
            
            this.events.on('relationship-changed', (data) => {
                                // Could show relationship level up notification
            });
            
            this.events.on('hcg-unlocked', (data) => {
                                // Show HCG unlock notification
            });
            
            // Store dialog manager in gameState for access by other systems
            this.gameState.dialogManager = this.dialogManager;
            
                    } catch (error) {
            console.error('GameScene: Error initializing Dialog system:', error);
            console.error('GameScene: Dialog system error details:', error.message);
            this.dialogManager = null;
            
            console.warn('GameScene: Dialog system disabled due to initialization error');
        }

        // Quest Manager will be initialized asynchronously in initializeAsyncComponents

        // Complete RenJs Save Integration (Component 3) - after all managers are initialized
        try {
                        this.renJsSaveIntegration = new RenJsSaveIntegration(
                this.gameState,
                this.questManager,
                this.dialogManager
            );
            
            // Store in gameState for global access
            this.gameState.renJsSaveIntegration = this.renJsSaveIntegration;
            
            // Link achievement system to save integration with proper error handling
            if (this.achievementPopupSystem && this.questManager) {
                try {
                    // Check if questManager has event capabilities
                    if (this.questManager.on && typeof this.questManager.on === 'function') {
                        this.questManager.on('quest-completed', (questData) => {
                            this.achievementPopupSystem.onQuestCompleted(questData.id, questData);
                        });
                                            } else {
                        // Alternative approach: store reference for manual calling
                        this.questManager.achievementPopupSystem = this.achievementPopupSystem;
                                            }
                } catch (eventError) {
                    console.warn('GameScene: Could not link achievement system to quest events:', eventError.message);
                    // Fallback: store reference for manual calling
                    if (this.questManager) {
                        this.questManager.achievementPopupSystem = this.achievementPopupSystem;
                    }
                }
            }
            
                    } catch (error) {
            console.error('GameScene: Error completing RenJs Save Integration:', error);
            this.renJsSaveIntegration = null;
        }

        // Initialize Fish Tuning Tool for testing fish AI and reeling difficulty
        try {
                        // Import the Fish Tuning Tool
            import('../ui/FishTuningTool.js').then(({ FishTuningTool }) => {
                this.fishTuningTool = new FishTuningTool(this, this.playerController);
                            }).catch(importError => {
                console.error('GameScene: Error importing Fish Tuning Tool:', importError);
                this.fishTuningTool = null;
            });
        } catch (error) {
            console.error('GameScene: Error initializing Fish Tuning Tool:', error);
            this.fishTuningTool = null;
        }

        // Initialize Luring Debug Tool for testing lure mechanics
        try {
                        // Import the Luring Debug Tool
            import('../ui/LuringDebugTool.js').then(({ LuringDebugTool }) => {
                this.luringDebugTool = new LuringDebugTool(this);
                            }).catch(importError => {
                console.error('GameScene: Error importing Luring Debug Tool:', importError);
                this.luringDebugTool = null;
            });
        } catch (error) {
            console.error('GameScene: Error initializing Luring Debug Tool:', error);
            this.luringDebugTool = null;
        }

        // Final loading progress update and completion
        if (this.loadingStateManager) {
            this.loadingStateManager.updateProgress('scene_init', 100, 'Scene ready!');
            
            // Hide loading after brief delay
            this.time.delayedCall(500, () => {
                this.loadingStateManager.hideLoading('scene_init');
                            });
        }

        // Event listeners and final setup
        this.setupEventListeners();
        this.createActionButtons(width, height);
        
        // Show fishing session status if this is a fishing session
        if (this.fishingSession) {
            this.showFishingSessionStatus();
        }

            }

    setupEventListeners() {
        // Keyboard shortcuts
        this.input.keyboard.on('keydown-H', () => {
            this.helpText.visible = !this.helpText.visible;
        });

        this.input.keyboard.on('keydown-I', () => {
            if (this.inventoryUI) {
                this.inventoryUI.toggle();
            }
        });

        this.input.keyboard.on('keydown-P', () => {
            if (this.playerProgressionUI) {
                this.playerProgressionUI.toggle();
            }
        });

        this.input.keyboard.on('keydown-T', () => {
            if (this.timeWeatherUI) {
                this.timeWeatherUI.toggle();
            }
        });

        this.input.keyboard.on('keydown-F', () => {
            if (this.fishCollectionUI) {
                this.fishCollectionUI.toggle();
            }
        });

        this.input.keyboard.on('keydown-C', () => {
            if (this.craftingUI) {
                this.craftingUI.toggle();
            }
        });

        this.input.keyboard.on('keydown-E', () => {
            if (this.equipmentEnhancementUI) {
                this.equipmentEnhancementUI.toggle();
            }
        });

        this.input.keyboard.on('keydown-Q', () => {
            if (this.questManager) {
                this.questManager.showQuestLog();
            }
        });

        // Quest tracker toggle (Ctrl+Q)
        this.input.keyboard.on('keydown', (event) => {
            if (event.code === 'KeyQ' && event.ctrlKey && !event.shiftKey) {
                event.preventDefault();
                if (this.questTrackerUI) {
                    this.questTrackerUI.toggleVisibility();
                } else {
                                        // Fallback initialization if async hasn't completed
                    this.initializeQuestTrackerUIFallback();
                }
            }
        });

        // QTE Debug Tool shortcut (F9 or CTRL+SHIFT+Q)
        this.input.keyboard.on('keydown-F9', () => {
            if (this.qteDebugTool) {
                this.qteDebugTool.toggle();
            }
        });

        // Alternative debug shortcut (CTRL+SHIFT+Q)
        this.input.keyboard.addCapture('Q');
        this.input.keyboard.on('keydown', (event) => {
            if (event.code === 'KeyQ' && event.ctrlKey && event.shiftKey) {
                event.preventDefault();
                if (this.qteDebugTool) {
                    this.qteDebugTool.toggle();
                }
            }
        });

        // Dialog shortcuts
        this.input.keyboard.on('keydown-B', () => {
                        this.openMiaDialog();
        });

        this.input.keyboard.on('keydown-F', () => {
                        if (this.dialogManager) {
                this.dialogManager.startDialog('sophie', 'GameScene');
            }
        });

        this.input.keyboard.on('keydown-G', () => {
                        if (this.dialogManager) {
                this.dialogManager.startDialog('luna', 'GameScene');
            }
        });

        // Fish Tuning Tool shortcut (U key)
        this.input.keyboard.on('keydown-U', () => {
            if (this.fishTuningTool) {
                this.fishTuningTool.toggle();
            }
        });

        // Luring Debug Tool shortcut (Y key)
        this.input.keyboard.on('keydown-Y', () => {
            if (this.luringDebugTool) {
                // If there's an active result overlay being shown, don't toggle
                if (this.luringDebugTool.resultOverlay) {
                                        return;
                }
                this.luringDebugTool.toggle();
            }
        });

        // Return to boat (ESC or fishing session)
        this.input.keyboard.on('keydown-ESC', () => {
                        if (this.fishingSession) {
                this.returnToBoat();
            } else {
                this.sceneManager.goToMenu(this);
            }
        });

            }

    /**
     * Ensure proper depth ordering for overlays and UI elements
     * This method can be called by UI components to set overlay depths correctly
     */
    setOverlayDepth(overlayElement, type = 'modal') {
        if (!overlayElement) return;
        
        const depthMap = {
            'background': this.DEPTH_LAYERS.OVERLAYS,
            'modal': this.DEPTH_LAYERS.MODALS,
            'tooltip': this.DEPTH_LAYERS.TOOLTIPS,
            'debug': this.DEPTH_LAYERS.DEBUG
        };
        
        const depth = depthMap[type] || this.DEPTH_LAYERS.OVERLAYS;
        
        if (overlayElement.setDepth) {
            overlayElement.setDepth(depth);
        }
        
                return depth;
    }

    /**
     * Get the appropriate depth for UI elements
     * This helps ensure consistent layering across all UI components
     */
    getUIDepth(elementType) {
        const depthMap = {
            'background': this.DEPTH_LAYERS.BACKGROUND,
            'water_effects': this.DEPTH_LAYERS.WATER_EFFECTS,
            'overlay': this.DEPTH_LAYERS.OVERLAYS,
            'fishing_spots': this.DEPTH_LAYERS.FISHING_SPOTS,
            'game_elements': this.DEPTH_LAYERS.GAME_ELEMENTS,
            'fishing_line': this.DEPTH_LAYERS.FISHING_LINE,
            'fishing_rod': this.DEPTH_LAYERS.FISHING_ROD,
            'ui_panels': this.DEPTH_LAYERS.UI_PANELS,
            'ui_buttons': this.DEPTH_LAYERS.UI_BUTTONS,
            'ui_text': this.DEPTH_LAYERS.UI_TEXT,
            'ui_interactive': this.DEPTH_LAYERS.UI_INTERACTIVE,
            'modals': this.DEPTH_LAYERS.MODALS,
            'tooltips': this.DEPTH_LAYERS.TOOLTIPS,
            'debug': this.DEPTH_LAYERS.DEBUG
        };
        
        return depthMap[elementType] || this.DEPTH_LAYERS.UI_PANELS;
    }

    createActionButtons(width, height) {
        // Create Player button in lower right corner
        this.createPlayerButton();
        
        // Create Collection button next to Player button
        this.createCollectionButton();

        // Create Enhancement button next to Collection button  
        this.createEnhancementButton();

        // Create Quest UI button
        this.createQuestButton();
        
        // Create Test Mia button for debugging
        this.createTestMiaButton();

        // Crosshair for aiming using configuration
        this.createCrosshair();

        // Create Return to Boat button - always available in fishing scene
        // Whether you started from BoatMenuScene or directly, you should be able to return
        this.createReturnToBoatButton();

        // Start HUD scene
        this.scene.launch('HUDScene');

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
            
            const clampedX = Phaser.Math.Clamp(pointer.x, 50, this.cameras.main.width - 50);
            const clampedY = Phaser.Math.Clamp(pointer.y, minY, maxY);
            
            this.crosshair.setPosition(clampedX, clampedY);
            
            // Update distance text based on position
            const distance = Phaser.Math.Distance.Between(
                this.playerPosition.x, this.playerPosition.y,
                clampedX, clampedY
            );
            
            // Convert distance to meters (scaled)
            const distanceInMeters = Math.floor(distance / 10);
            this.distanceText.setText(`${distanceInMeters}m`);
            
            // Change color based on distance
            if (distanceInMeters > 30) {
                this.distanceText.setColor('#ff5722'); // Too far
            } else if (distanceInMeters > 20) {
                this.distanceText.setColor('#ffa726'); // Far but possible
            } else {
                this.distanceText.setColor('#4caf50'); // Good distance
            }
            
            // Update targeting text based on proximity to hotspot
            if (this.hotspotPosition) {
                const distanceToHotspot = Phaser.Math.Distance.Between(
                    clampedX, clampedY,
                    this.hotspotPosition.x, this.hotspotPosition.y
                );
                
                if (distanceToHotspot < this.hotspotPosition.radius) {
                    this.targetingText.setText('HOTSPOT');
                    this.targetingText.setColor('#00ffff');
                } else {
                    this.targetingText.setText('TARGETING');
                    this.targetingText.setColor(UITheme.colors.text);
                }
            }
        }

        // Time & Weather systems update automatically through their own event timers
    }

    // Casting and fish catching now handled by PlayerController

    createFishPopulation() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const fishingConfig = gameDataLoader.getFishingConfig();
        
        // Use configuration from DataLoader only
        const config = {
            fishCount: fishingConfig?.fishCount || 8,
            fishWaterAreaTop: fishingConfig?.fishWaterAreaTop || 0.35,
            fishWaterAreaBottom: fishingConfig?.fishWaterAreaBottom || 0.85,
            fishSpeedRange: fishingConfig?.fishSpeedRange || { min: -50, max: 50 },
            fishVerticalSpeedRange: fishingConfig?.fishVerticalSpeedRange || { min: -20, max: 20 },
            fishBounce: fishingConfig?.fishBounce || 1,
            fishScale: fishingConfig?.fishScale || 0.8
        };
        
                // Create fish sprites using graphics (no texture dependency)
        const createFishSprite = (x, y) => {
            try {
                // Create a graphics fish sprite
                const fish = this.add.graphics();
                fish.fillStyle(0x4ECDC4, 1);
                fish.fillEllipse(0, 0, 20, 10);
                fish.fillStyle(0x2C3E50, 1);
                fish.fillCircle(5, 0, 2); // Eye
                fish.setPosition(x, y);
                
                // Add physics body and verify it was created
                this.physics.add.existing(fish);
                
                // Ensure physics body was created properly
                if (!fish.body) {
                    console.warn('GameScene: Failed to create physics body for fish, skipping...');
                    fish.destroy();
                    return null;
                }
                
                this.fishGroup.add(fish);
                return fish;
            } catch (error) {
                console.error('GameScene: Error creating fish sprite:', error);
                return null;
            }
        };
        
        // Create regular fish scattered around the water
        const regularFishCount = Math.floor(config.fishCount * 0.6); // 60% regular fish
        let hotspotFishCount = 0; // Initialize hotspot fish count
        
        for (let i = 0; i < regularFishCount; i++) {
            const fish = createFishSprite(
                Phaser.Math.Between(100, width - 100),
                Phaser.Math.Between(height * config.fishWaterAreaTop, height * config.fishWaterAreaBottom)
            );
            
            // Only proceed if fish was created successfully with physics body
            if (fish && fish.body && typeof fish.setVelocity === 'function') {
                try {
                    fish.setVelocity(
                        Phaser.Math.Between(config.fishSpeedRange.min, config.fishSpeedRange.max),
                        Phaser.Math.Between(config.fishVerticalSpeedRange.min, config.fishVerticalSpeedRange.max)
                    );
                    
                    fish.setBounce(config.fishBounce);
                    fish.setCollideWorldBounds(true);
                    fish.setScale(config.fishScale);
                    fish.fishData = this.generateRandomFishData();
                    fish.fishType = 'regular';
                } catch (error) {
                    console.warn('GameScene: Error setting up regular fish:', error);
                    fish.destroy();
                }
            } else if (fish) {
                // Clean up fish that couldn't be properly configured
                fish.destroy();
            }
        }
        
        // Create hotspot fish - more fish near the hotspot
        if (this.hotspotPosition) {
            hotspotFishCount = Math.floor(config.fishCount * 0.4); // 40% hotspot fish
            
            for (let i = 0; i < hotspotFishCount; i++) {
                // Position fish near the hotspot with some variance
                const angle = Phaser.Math.Between(0, 360) * Math.PI / 180;
                const distance = Phaser.Math.Between(50, 150); // Within 150px of hotspot
                const fishX = this.hotspotPosition.x + Math.cos(angle) * distance;
                const fishY = this.hotspotPosition.y + Math.sin(angle) * distance;
                
                // Ensure fish stays within water bounds
                const clampedX = Phaser.Math.Clamp(fishX, 100, width - 100);
                const clampedY = Phaser.Math.Clamp(fishY, height * config.fishWaterAreaTop, height * config.fishWaterAreaBottom);
                
                const fish = createFishSprite(clampedX, clampedY);
                
                if (fish && fish.body && typeof fish.setVelocity === 'function') {
                    try {
                        // Hotspot fish move slower and more randomly
                        fish.setVelocity(
                            Phaser.Math.Between(-30, 30),
                            Phaser.Math.Between(-20, 20)
                        );
                        
                        fish.setBounce(config.fishBounce);
                        fish.setCollideWorldBounds(true);
                        fish.setScale(config.fishScale * 1.2); // Slightly larger fish near hotspot
                        fish.fishData = this.generateHotspotFishData(); // Better fish near hotspot
                        fish.fishType = 'hotspot';
                        
                        // Add attraction behavior to hotspot
                        this.addHotspotAttraction(fish);
                    } catch (error) {
                        console.warn('GameScene: Error setting up hotspot fish:', error);
                        fish.destroy();
                    }
                } else if (fish) {
                    fish.destroy();
                }
            }
        }
        
        // Create fishing spot fish - fish near active fishing spots
        if (this.fishingSpots) {
            const activeSpots = this.fishingSpots.filter(spot => spot.isActive);
            const spotFishCount = Math.floor(config.fishCount * 0.2); // 20% spot fish
            
            activeSpots.forEach(spot => {
                const fishPerSpot = Math.floor(spotFishCount / Math.max(activeSpots.length, 1));
                
                for (let i = 0; i < fishPerSpot; i++) {
                    // Position fish near the spot with some variance
                    const angle = Phaser.Math.Between(0, 360) * Math.PI / 180;
                    const distance = Phaser.Math.Between(30, 80); // Within 80px of spot
                    const fishX = spot.x + Math.cos(angle) * distance;
                    const fishY = spot.y + Math.sin(angle) * distance;
                    
                    // Ensure fish stays within water bounds
                    const clampedX = Phaser.Math.Clamp(fishX, 100, width - 100);
                    const clampedY = Phaser.Math.Clamp(fishY, height * config.fishWaterAreaTop, height * config.fishWaterAreaBottom);
                    
                    const fish = createFishSprite(clampedX, clampedY);
                    
                    if (fish && fish.body && typeof fish.setVelocity === 'function') {
                        try {
                            // Spot fish move in patterns based on spot type
                            const baseSpeed = spot.type === 'current_break' ? 40 : 25;
                            fish.setVelocity(
                                Phaser.Math.Between(-baseSpeed, baseSpeed),
                                Phaser.Math.Between(-15, 15)
                            );
                            
                            fish.setBounce(config.fishBounce);
                            fish.setCollideWorldBounds(true);
                            fish.setScale(config.fishScale * 1.1); // Slightly larger fish near spots
                            fish.fishData = this.generateSpotFishData(spot); // Spot-specific fish
                            fish.fishType = 'spot';
                            fish.spotId = spot.id;
                            
                            // Add attraction behavior to spot
                            this.addSpotAttraction(fish, spot);
                        } catch (error) {
                            console.warn('GameScene: Error setting up spot fish:', error);
                            fish.destroy();
                        }
                    } else if (fish) {
                        fish.destroy();
                    }
                }
            });
        }
        
            }

    generateRandomFishData() {
        try {
            const allFish = gameDataLoader.getAllFish();
            if (!allFish || allFish.length === 0) {
                console.error('GameScene: 🚨 No fish data available from DataLoader - CSV conversion may have failed!');
                console.error('GameScene: 🚨 This should NOT happen if CSV data is properly loaded');
                return null;
            }
            const selectedFish = Phaser.Utils.Array.GetRandom(allFish);
                        return selectedFish;
        } catch (error) {
            console.error('GameScene: Error generating random fish data:', error);
            return null;
        }
    }

    generateHotspotFishData() {
        try {
            const allFish = gameDataLoader.getAllFish();
            if (!allFish || allFish.length === 0) {
                console.error('GameScene: 🚨 No fish data available for hotspot - CSV conversion may have failed!');
                return null;
            }
            
            // Filter for higher rarity fish (rarity 4+) for hotspot
            const rareFish = allFish.filter(fish => fish.rarity >= 4);
            if (rareFish.length > 0) {
                const selectedFish = Phaser.Utils.Array.GetRandom(rareFish);
                                return selectedFish;
            }
            
            // Use any available fish if no rare fish found
            const selectedFish = Phaser.Utils.Array.GetRandom(allFish);
                        return selectedFish;
        } catch (error) {
            console.error('GameScene: Error generating hotspot fish data:', error);
            return null;
        }
    }

    generateSpotFishData(spot) {
        try {
            const allFish = gameDataLoader.getAllFish();
            if (!allFish || allFish.length === 0) {
                console.error('GameScene: 🚨 No fish data available for fishing spot - CSV conversion may have failed!');
                return null;
            }
            const selectedFish = Phaser.Utils.Array.GetRandom(allFish);
                        return selectedFish;
        } catch (error) {
            console.error('GameScene: Error generating spot fish data:', error);
            return null;
        }
    }

    addHotspotAttraction(fish) {
        // Create a behavior that makes fish occasionally swim toward the hotspot
        const attractionTimer = this.time.addEvent({
            delay: Phaser.Math.Between(3000, 8000), // Every 3-8 seconds
            callback: () => {
                try {
                    if (fish.active && fish.body && this.hotspotPosition && typeof fish.setVelocity === 'function') {
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
                } catch (error) {
                    console.warn('GameScene: Error in hotspot attraction behavior:', error);
                }
            },
            loop: true
        });
        
        // Store timer reference for cleanup
        fish.attractionTimer = attractionTimer;
    }

    addSpotAttraction(fish, spot) {
        // Create a behavior that makes fish occasionally swim toward the spot
        const attractionTimer = this.time.addEvent({
            delay: Phaser.Math.Between(3000, 8000), // Every 3-8 seconds
            callback: () => {
                try {
                    if (fish.active && fish.body && spot && typeof fish.setVelocity === 'function') {
                        // Calculate direction to spot
                        const dx = spot.x - fish.x;
                        const dy = spot.y - fish.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        // If fish is far from spot, attract it
                        if (distance > 200) {
                            const speed = 40;
                            fish.setVelocity(
                                (dx / distance) * speed,
                                (dy / distance) * speed
                            );
                        } else {
                            // If close to spot, swim in circles around it
                            const angle = Phaser.Math.Angle.Between(spot.x, spot.y, fish.x, fish.y);
                            const circleSpeed = 30;
                            fish.setVelocity(
                                Math.cos(angle + Math.PI/2) * circleSpeed,
                                Math.sin(angle + Math.PI/2) * circleSpeed
                            );
                        }
                    }
                } catch (error) {
                    console.warn('GameScene: Error in spot attraction behavior:', error);
                }
            },
            loop: true
        });
        
        // Store timer reference for cleanup
        fish.spotAttractionTimer = attractionTimer;
    }

    createCrosshair() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const uiConfig = gameDataLoader.getUIConfig();
        
        // Use UI configuration from DataLoader only
        const config = {
            crosshairSize: uiConfig?.crosshairSize || 10,
            crosshairLineLength: uiConfig?.crosshairLineLength || 15,
            crosshairColor: uiConfig?.crosshairColor || 0xffffff,
            crosshairAlpha: uiConfig?.crosshairAlpha || 0.8,
            crosshairLineWidth: uiConfig?.crosshairLineWidth || 2
        };
        
        // Create a more advanced crosshair with animated elements
        this.crosshair = this.add.container(width / 2, height / 2);
        this.crosshair.setDepth(this.DEPTH_LAYERS.GAME_ELEMENTS);
        
        // Outer ring
        const outerRing = this.add.graphics();
        outerRing.lineStyle(config.crosshairLineWidth, parseInt(config.crosshairColor), config.crosshairAlpha);
        outerRing.strokeCircle(0, 0, config.crosshairSize + 5);
        this.crosshair.add(outerRing);
        
        // Inner circle
        const innerCircle = this.add.graphics();
        innerCircle.lineStyle(config.crosshairLineWidth, parseInt(config.crosshairColor), config.crosshairAlpha);
        innerCircle.strokeCircle(0, 0, config.crosshairSize);
        this.crosshair.add(innerCircle);
        
        // Crosshair lines
        const lines = this.add.graphics();
        lines.lineStyle(config.crosshairLineWidth, parseInt(config.crosshairColor), config.crosshairAlpha);
        lines.moveTo(-config.crosshairLineLength, 0);
        lines.lineTo(config.crosshairLineLength, 0);
        lines.moveTo(0, -config.crosshairLineLength);
        lines.lineTo(0, config.crosshairLineLength);
        this.crosshair.add(lines);
        
        // Add a dot in the center
        const centerDot = this.add.graphics();
        centerDot.fillStyle(parseInt(config.crosshairColor), config.crosshairAlpha);
        centerDot.fillCircle(0, 0, 2);
        this.crosshair.add(centerDot);
        
        // Add subtle animation to the outer ring
        this.tweens.add({
            targets: outerRing,
            scaleX: 1.1,
            scaleY: 1.1,
            alpha: 0.5,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Add a targeting text indicator
        this.targetingText = this.add.text(0, -config.crosshairSize - 20, 'TARGETING', {
            fontSize: '12px',
            fontFamily: UITheme.fonts.primary,
            color: UITheme.colors.text,
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5);
        this.targetingText.setAlpha(0.7);
        this.crosshair.add(this.targetingText);
        
        // Add distance indicator
        this.distanceText = this.add.text(0, config.crosshairSize + 15, '0m', {
            fontSize: '12px',
            fontFamily: UITheme.fonts.primary,
            color: UITheme.colors.text,
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5);
        this.distanceText.setAlpha(0.7);
        this.crosshair.add(this.distanceText);
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
        this.fishingRod.setDepth(this.DEPTH_LAYERS.FISHING_ROD);
        
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
        this.fishingLine.setDepth(this.DEPTH_LAYERS.FISHING_LINE);
        
        // Create lure at end of line
        this.createLure(rodTipX, rodTipY + 30, equippedLure);
        
        // Draw initial fishing line
        this.updateFishingLine(rodTipX, rodTipY + 30);
        
            }

    createLure(x, y, equippedLure) {
        // Create lure graphics
        this.lure = this.add.graphics();
        this.lure.setDepth(this.DEPTH_LAYERS.GAME_ELEMENTS);
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
        
        // Create permanent hotspot area with improved visuals
        this.permanentHotspot = this.add.container(hotspotX, hotspotY);
        this.permanentHotspot.setDepth(this.DEPTH_LAYERS.FISHING_SPOTS);
        
        // Outer glow (larger, more transparent)
        const outerGlow = this.add.graphics();
        outerGlow.fillStyle(0x00ffff, 0.15);
        outerGlow.fillCircle(0, 0, 110);
        this.permanentHotspot.add(outerGlow);
        
        // Middle ring with gradient effect using fillGradientStyle
        const middleRing = this.add.graphics();
        middleRing.fillGradientStyle(0x00ffff, 0x00ffff, 0x0088aa, 0x0088aa, 0.25);
        middleRing.fillCircle(0, 0, 80);
        this.permanentHotspot.add(middleRing);
        
        // Inner circle
        const innerCircle = this.add.graphics();
        innerCircle.fillStyle(0x00ffff, 0.35);
        innerCircle.fillCircle(0, 0, 50);
        this.permanentHotspot.add(innerCircle);
        
        // Center dot
        const centerDot = this.add.graphics();
        centerDot.fillStyle(0xffffff, 0.6);
        centerDot.fillCircle(0, 0, 15);
        this.permanentHotspot.add(centerDot);
        
        // Add ripple effect
        this.createHotspotRipples(hotspotX, hotspotY);
        
        // Add gentle pulsing animation
        this.tweens.add({
            targets: this.permanentHotspot,
            scaleX: 1.05,
            scaleY: 1.05,
            alpha: 0.9,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Add fish icons that occasionally appear and disappear
        this.createHotspotFishIndicators(hotspotX, hotspotY);
        
        // Add hotspot label with improved styling
        const hotspotLabel = this.add.container(hotspotX, hotspotY - 130);
        
        // Label background
        const labelBg = this.add.graphics();
        labelBg.fillStyle(0x004466, 0.7);
        labelBg.fillRoundedRect(-80, -15, 160, 30, 10);
        labelBg.lineStyle(2, 0x00ffff, 0.8);
        labelBg.strokeRoundedRect(-80, -15, 160, 30, 10);
        hotspotLabel.add(labelBg);
        
        // Label text
        const labelText = this.add.text(0, 0, 'FISHING HOTSPOT', {
            fontSize: '16px',
            fontFamily: UITheme.fonts.primary,
            color: '#00ffff',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5);
        hotspotLabel.add(labelText);
        
        // Add subtle animation to the label
        this.tweens.add({
            targets: hotspotLabel,
            y: hotspotY - 135,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Store hotspot position for other systems to use
        this.hotspotPosition = { x: hotspotX, y: hotspotY, radius: 100 };
        
            }

    createFishingSpots() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Initialize fishing spots array
        this.fishingSpots = [];
        this.activeSpots = new Set();
        
        // Define different spot types with their characteristics
        const spotTypes = {
            kelp_beds: {
                name: 'Kelp Beds',
                color: 0x228B22,
                rarityBonus: 15,
                description: 'Dense kelp provides cover for fish',
                fishTypes: ['bass', 'rockfish', 'kelp_bass'],
                duration: 45000, // 45 seconds
                cooldown: 120000 // 2 minutes
            },
            rocky_outcrop: {
                name: 'Rocky Outcrop',
                color: 0x696969,
                rarityBonus: 20,
                description: 'Rocky structures attract predatory fish',
                fishTypes: ['striped_bass', 'black_sea_bass', 'lingcod'],
                duration: 30000, // 30 seconds
                cooldown: 150000 // 2.5 minutes
            },
            current_break: {
                name: 'Current Break',
                color: 0x00BFFF,
                rarityBonus: 25,
                description: 'Where currents meet, baitfish gather',
                fishTypes: ['tuna', 'salmon', 'mackerel'],
                duration: 60000, // 1 minute
                cooldown: 180000 // 3 minutes
            },
            thermal_vent: {
                name: 'Thermal Vent',
                color: 0xFF4500,
                rarityBonus: 30,
                description: 'Warm water attracts exotic species',
                fishTypes: ['rare_tropical', 'exotic_bass', 'warm_water_species'],
                duration: 40000, // 40 seconds
                cooldown: 200000 // 3.3 minutes
            },
            debris_field: {
                name: 'Debris Field',
                color: 0x8B4513,
                rarityBonus: 10,
                description: 'Floating debris creates artificial reef',
                fishTypes: ['scavenger_fish', 'small_bass', 'minnows'],
                duration: 90000, // 1.5 minutes
                cooldown: 90000 // 1.5 minutes
            }
        };
        
        // Create 6-8 potential fishing spot locations
        const spotLocations = [
            // Top area spots
            { x: width * 0.15, y: height * 0.35, type: 'kelp_beds' },
            { x: width * 0.85, y: height * 0.4, type: 'rocky_outcrop' },
            
            // Middle area spots (avoid permanent hotspot area)
            { x: width * 0.6, y: height * 0.5, type: 'current_break' },
            { x: width * 0.1, y: height * 0.6, type: 'debris_field' },
            
            // Bottom area spots
            { x: width * 0.4, y: height * 0.75, type: 'thermal_vent' },
            { x: width * 0.8, y: height * 0.7, type: 'kelp_beds' },
            
            // Additional spots for variety
            { x: width * 0.2, y: height * 0.45, type: 'rocky_outcrop' },
            { x: width * 0.7, y: height * 0.35, type: 'debris_field' }
        ];
        
        // Create fishing spot objects
        spotLocations.forEach((location, index) => {
            const spotType = spotTypes[location.type];
            const spot = {
                id: `spot_${index}`,
                x: location.x,
                y: location.y,
                type: location.type,
                config: spotType,
                isActive: false,
                lastActivation: 0,
                visual: null,
                label: null,
                particles: null
            };
            
            this.fishingSpots.push(spot);
        });
        
        // Start the spot activation system
        this.startSpotRotation();
        
            }

    startSpotRotation() {
        // Activate 2-3 spots initially
        this.activateRandomSpots(3);
        
        // Set up rotation timer - activate new spots every 30-60 seconds
        this.spotRotationTimer = this.time.addEvent({
            delay: Phaser.Math.Between(30000, 60000), // 30-60 seconds
            callback: () => {
                this.rotateActiveSpots();
            },
            loop: true
        });
        
            }

    activateRandomSpots(count) {
        // Get inactive spots that are off cooldown
        const availableSpots = this.fishingSpots.filter(spot => 
            !spot.isActive && 
            (Date.now() - spot.lastActivation) > spot.config.cooldown
        );
        
        if (availableSpots.length === 0) return;
        
        // Randomly select spots to activate
        const spotsToActivate = Phaser.Utils.Array.Shuffle(availableSpots).slice(0, count);
        
        spotsToActivate.forEach(spot => this.activateFishingSpot(spot));
    }

    activateFishingSpot(spot) {
        if (spot.isActive) return;
        
        spot.isActive = true;
        spot.lastActivation = Date.now();
        this.activeSpots.add(spot.id);
        
        // Create visual elements
        this.createSpotVisuals(spot);
        
        // Schedule deactivation
        this.time.delayedCall(spot.config.duration, () => {
            this.deactivateFishingSpot(spot);
        });
        
            }

    createSpotVisuals(spot) {
        const config = spot.config;
        
        // Create main spot visual container
        spot.visual = this.add.container(spot.x, spot.y);
        spot.visual.setDepth(this.DEPTH_LAYERS.FISHING_SPOTS - 5); // Slightly below permanent hotspot
        
        // Outer glow ring
        const outerGlow = this.add.graphics();
        outerGlow.fillStyle(config.color, 0.1);
        outerGlow.fillCircle(0, 0, 80);
        spot.visual.add(outerGlow);
        
        // Middle ring with spot-specific color
        const middleRing = this.add.graphics();
        middleRing.fillStyle(config.color, 0.2);
        middleRing.fillCircle(0, 0, 60);
        spot.visual.add(middleRing);
        
        // Inner active area
        const innerCircle = this.add.graphics();
        innerCircle.fillStyle(config.color, 0.3);
        innerCircle.fillCircle(0, 0, 40);
        spot.visual.add(innerCircle);
        
        // Center marker
        const centerDot = this.add.graphics();
        centerDot.fillStyle(0xffffff, 0.7);
        centerDot.fillCircle(0, 0, 8);
        spot.visual.add(centerDot);
        
        // Add type-specific visual effects
        this.addSpotTypeEffects(spot);
        
        // Create label
        this.createSpotLabel(spot);
        
        // Add pulsing animation
        this.tweens.add({
            targets: spot.visual,
            scaleX: 1.1,
            scaleY: 1.1,
            alpha: 0.8,
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    addSpotTypeEffects(spot) {
        const config = spot.config;
        
        switch (spot.type) {
            case 'kelp_beds':
                // Add swaying kelp-like strands
                for (let i = 0; i < 5; i++) {
                    const kelp = this.add.graphics();
                    kelp.lineStyle(2, 0x228B22, 0.6);
                    const startX = (i - 2) * 8;
                    kelp.lineBetween(startX, 20, startX + 2, -20);
                    spot.visual.add(kelp);
                    
                    // Sway animation
                    this.tweens.add({
                        targets: kelp,
                        rotation: 0.2,
                        duration: 2000 + i * 200,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
                break;
                
            case 'rocky_outcrop':
                // Add rock formations
                for (let i = 0; i < 4; i++) {
                    const rock = this.add.graphics();
                    rock.fillStyle(0x696969, 0.8);
                    const size = 6 + Math.random() * 4;
                    rock.fillCircle((i - 1.5) * 10, 0, size);
                    spot.visual.add(rock);
                }
                break;
                
            case 'current_break':
                // Add flowing water lines
                for (let i = 0; i < 6; i++) {
                    const currentLine = this.add.graphics();
                    currentLine.lineStyle(1, 0x00BFFF, 0.4);
                    const y = (i - 2.5) * 6;
                    currentLine.lineBetween(-30, y, 30, y);
                    spot.visual.add(currentLine);
                    
                    // Flowing animation
                    this.tweens.add({
                        targets: currentLine,
                        x: 15,
                        duration: 1500,
                        yoyo: true,
                        repeat: -1,
                        delay: i * 100
                    });
                }
                break;
                
            case 'thermal_vent':
                // Add heat shimmer effect
                for (let i = 0; i < 8; i++) {
                    const bubble = this.add.circle(
                        Phaser.Math.Between(-20, 20),
                        20,
                        2 + Math.random() * 3,
                        0xFF4500,
                        0.6
                    );
                    spot.visual.add(bubble);
                    
                    // Rising bubble animation
                    this.tweens.add({
                        targets: bubble,
                        y: -30,
                        alpha: 0,
                        duration: 2000 + Math.random() * 1000,
                        repeat: -1,
                        delay: i * 250
                    });
                }
                break;
                
            case 'debris_field':
                // Add floating debris
                for (let i = 0; i < 6; i++) {
                    const debris = this.add.graphics();
                    debris.fillStyle(0x8B4513, 0.7);
                    const size = 3 + Math.random() * 5;
                    debris.fillRect(-size/2, -size/2, size, size, size/2);
                    debris.setPosition(
                        Phaser.Math.Between(-25, 25),
                        Phaser.Math.Between(-25, 25)
                    );
                    spot.visual.add(debris);
                    
                    // Gentle floating animation
                    this.tweens.add({
                        targets: debris,
                        y: debris.y + 5,
                        duration: 3000 + Math.random() * 2000,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
                break;
        }
    }

    createSpotLabel(spot) {
        const config = spot.config;
        
        // Create label container
        spot.label = this.add.container(spot.x, spot.y - 100);
        spot.label.setDepth(this.DEPTH_LAYERS.FISHING_SPOTS - 4);
        
        // Label background
        const labelBg = this.add.graphics();
        labelBg.fillStyle(0x000000, 0.7);
        labelBg.fillRoundedRect(-60, -12, 120, 24, 6);
        labelBg.lineStyle(1, config.color, 0.8);
        labelBg.strokeRoundedRect(-60, -12, 120, 24, 6);
        spot.label.add(labelBg);
        
        // Label text
        const labelText = this.add.text(0, 0, config.name, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: Phaser.Display.Color.IntegerToColor(config.color).rgba,
            stroke: '#000000',
            strokeThickness: 1,
            align: 'center'
        }).setOrigin(0.5);
        spot.label.add(labelText);
        
        // Rarity bonus indicator
        const bonusText = this.add.text(0, 15, `+${config.rarityBonus}% Rare`, {
            fontSize: '10px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 1,
            align: 'center'
        }).setOrigin(0.5);
        spot.label.add(bonusText);
        
        // Gentle floating animation for label
        this.tweens.add({
            targets: spot.label,
            y: spot.y - 105,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    deactivateFishingSpot(spot) {
        if (!spot.isActive) return;
        
        spot.isActive = false;
        this.activeSpots.delete(spot.id);
        
        // Animate out and destroy visuals
        if (spot.visual) {
            this.tweens.add({
                targets: [spot.visual, spot.label],
                alpha: 0,
                scale: 0.8,
                duration: 1000,
                onComplete: () => {
                    if (spot.visual) {
                        spot.visual.destroy();
                        spot.visual = null;
                    }
                    if (spot.label) {
                        spot.label.destroy();
                        spot.label = null;
                    }
                }
            });
        }
        
            }

    rotateActiveSpots() {
        // Deactivate some current spots (25% chance each)
        this.fishingSpots.filter(spot => spot.isActive).forEach(spot => {
            if (Math.random() < 0.25) {
                this.deactivateFishingSpot(spot);
            }
        });
        
        // Activate new spots to maintain 2-4 active
        const currentActiveCount = Array.from(this.activeSpots).length;
        const targetCount = Phaser.Math.Between(2, 4);
        
        if (currentActiveCount < targetCount) {
            this.activateRandomSpots(targetCount - currentActiveCount);
        }
        
            }

    // Method to check if a cast location hits any fishing spot
    checkFishingSpotHit(x, y) {
        for (const spot of this.fishingSpots) {
            if (!spot.isActive) continue;
            
            const distance = Phaser.Math.Distance.Between(x, y, spot.x, spot.y);
            if (distance <= 50) { // Hit radius
                return {
                    hit: true,
                    spot: spot,
                    distance: distance,
                    rarityBonus: spot.config.rarityBonus,
                    fishTypes: spot.config.fishTypes
                };
            }
        }
        
        return { hit: false };
    }

    createHotspotRipples(x, y) {
        // Create water ripple effects around the hotspot
        for (let i = 0; i < 5; i++) {
            const ripple = this.add.graphics();
            ripple.lineStyle(1, 0x00ffff, 0.4);
            ripple.strokeCircle(0, 0, 20);
            ripple.setPosition(x, y);
            
            // Randomize starting scale and alpha
            ripple.setScale(0.5 + Math.random() * 0.5);
            ripple.setAlpha(0.1 + Math.random() * 0.3);
            
            // Animate ripples
            this.tweens.add({
                targets: ripple,
                scaleX: 3,
                scaleY: 3,
                alpha: 0,
                duration: 3000 + Math.random() * 2000,
                repeat: -1,
                delay: i * 600,
                ease: 'Sine.easeOut'
            });
        }
    }

    createHotspotFishIndicators(x, y) {
        // Create fish silhouettes that occasionally appear in the hotspot
        const fishTypes = ['🐟', '🐠', '🐡'];
        
        for (let i = 0; i < 3; i++) {
            const fishIcon = this.add.text(0, 0, fishTypes[i % fishTypes.length], {
                fontSize: '20px'
            });
            fishIcon.setOrigin(0.5);
            fishIcon.setAlpha(0);
            
            // Position fish randomly within hotspot
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 70;
            fishIcon.setPosition(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance);
            
            // Create appearing/disappearing animation
            this.time.addEvent({
                delay: 5000 + Math.random() * 10000,
                callback: () => {
                    // New random position
                    const newAngle = Math.random() * Math.PI * 2;
                    const newDistance = Math.random() * 70;
                    const newX = x + Math.cos(newAngle) * newDistance;
                    const newY = y + Math.sin(newAngle) * newDistance;
                    
                    // Move fish to new position
                    this.tweens.add({
                        targets: fishIcon,
                        x: newX,
                        y: newY,
                        alpha: 0.7,
                        scale: 1,
                        duration: 1000,
                        ease: 'Sine.easeInOut',
                        onComplete: () => {
                            // Wait a bit then fade out
                            this.time.delayedCall(1500, () => {
                                this.tweens.add({
                                    targets: fishIcon,
                                    alpha: 0,
                                    scale: 0.8,
                                    duration: 1000,
                                    ease: 'Sine.easeIn'
                                });
                            });
                        }
                    });
                },
                loop: true
            });
        }
    }

    createPlayerButton() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Button dimensions and position (lower right corner)
        const buttonWidth = 90;
        const buttonHeight = 40;
        const buttonX = width - buttonWidth - 20;
        const buttonY = height - buttonHeight - 20;
        
        // Create button using UITheme
        const playerBtn = UITheme.createButton(
            this, 
            buttonX + buttonWidth/2, 
            buttonY + buttonHeight/2, 
            buttonWidth, 
            buttonHeight, 
            '👤 Player', 
            () => {
                if (this.playerProgressionUI) {
                    this.playerProgressionUI.show();
                }
            },
            'primary'
        );
        
        // Set depth for proper layering
        playerBtn.button.setDepth(this.DEPTH_LAYERS.UI_BUTTONS);
        playerBtn.text.setDepth(this.DEPTH_LAYERS.UI_TEXT);
        playerBtn.text.setFontStyle('bold');
        
        // Store references for cleanup
        this.playerButton = playerBtn.button;
        this.playerButtonText = playerBtn.text;
        
            }

    createCollectionButton() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Button dimensions and position (next to Player button)
        const buttonWidth = 90;
        const buttonHeight = 40;
        const buttonX = width - buttonWidth - 120; // 120 = 90 (player button width) + 20 (margin) + 10 (spacing)
        const buttonY = height - buttonHeight - 20;
        
        // Create button using UITheme
        const collectionBtn = UITheme.createButton(
            this, 
            buttonX + buttonWidth/2, 
            buttonY + buttonHeight/2, 
            buttonWidth, 
            buttonHeight, 
            '🐟 Collection', 
            () => {
                if (this.fishCollectionUI) {
                    this.fishCollectionUI.show();
                }
            },
            'secondary'
        );
        
        // Set depth for proper layering
        collectionBtn.button.setDepth(this.DEPTH_LAYERS.UI_BUTTONS);
        collectionBtn.text.setDepth(this.DEPTH_LAYERS.UI_TEXT);
        collectionBtn.text.setFontStyle('bold');
        
        // Store references for cleanup
        this.collectionButton = collectionBtn.button;
        this.collectionButtonText = collectionBtn.text;
        
            }

    createEnhancementButton() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Button dimensions and position (next to Collection button)
        const buttonWidth = 100;
        const buttonHeight = 40;
        const buttonX = width - buttonWidth - 120; // 120 = 90 (collection button width) + 20 (margin) + 10 (spacing)
        const buttonY = height - buttonHeight - 20;
        
        // Create button background using UITheme
        this.enhancementButton = this.add.graphics();
        this.enhancementButton.setDepth(this.DEPTH_LAYERS.UI_BUTTONS);
        
        // Button styling using UITheme
        this.enhancementButton.fillStyle(UITheme.colors.primary, 0.9);
        this.enhancementButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, UITheme.borders.radius.medium);
        this.enhancementButton.lineStyle(UITheme.borders.width.medium, UITheme.colors.primaryLight, 0.8);
        this.enhancementButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, UITheme.borders.radius.medium);
        
        // Button text using UITheme
        this.enhancementButtonText = UITheme.createText(this, buttonX + buttonWidth/2, buttonY + buttonHeight/2, '🔧 Enhancement', 'bodyMedium');
        this.enhancementButtonText.setOrigin(0.5);
        this.enhancementButtonText.setFontStyle('bold');
        this.enhancementButtonText.setDepth(this.DEPTH_LAYERS.UI_TEXT);
        
        // Make button interactive
        const buttonHitArea = this.add.rectangle(buttonX + buttonWidth/2, buttonY + buttonHeight/2, buttonWidth, buttonHeight, 0x000000, 0);
        buttonHitArea.setDepth(this.DEPTH_LAYERS.UI_INTERACTIVE);
        buttonHitArea.setInteractive({ useHandCursor: true });
        
        // Hover effects using UITheme
        buttonHitArea.on('pointerover', () => {
            this.enhancementButton.clear();
            this.enhancementButton.fillStyle(UITheme.colors.primaryLight, 0.9);
            this.enhancementButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, UITheme.borders.radius.medium);
            this.enhancementButton.lineStyle(UITheme.borders.width.medium, UITheme.colors.highlight, 0.8);
            this.enhancementButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, UITheme.borders.radius.medium);
            this.enhancementButtonText.setScale(1.05);
        });
        
        buttonHitArea.on('pointerout', () => {
            this.enhancementButton.clear();
            this.enhancementButton.fillStyle(UITheme.colors.primary, 0.9);
            this.enhancementButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, UITheme.borders.radius.medium);
            this.enhancementButton.lineStyle(UITheme.borders.width.medium, UITheme.colors.primaryLight, 0.8);
            this.enhancementButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, UITheme.borders.radius.medium);
            this.enhancementButtonText.setScale(1.0);
        });
        
        // Button click handler using UITheme
        buttonHitArea.on('pointerdown', () => {
            // Visual feedback using UITheme
            this.enhancementButton.clear();
            this.enhancementButton.fillStyle(UITheme.colors.primaryDark, 0.9);
            this.enhancementButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, UITheme.borders.radius.medium);
            this.enhancementButton.lineStyle(UITheme.borders.width.medium, UITheme.colors.primaryLight, 0.8);
            this.enhancementButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, UITheme.borders.radius.medium);
            this.enhancementButtonText.setScale(0.95);
            
            // Open equipment enhancement UI
            this.equipmentEnhancementUI.show();
            
            // Reset button appearance after click using UITheme animation timing
            this.time.delayedCall(UITheme.animations.fast, () => {
                this.enhancementButton.clear();
                this.enhancementButton.fillStyle(UITheme.colors.primary, 0.9);
                this.enhancementButton.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, UITheme.borders.radius.medium);
                this.enhancementButton.lineStyle(UITheme.borders.width.medium, UITheme.colors.primaryLight, 0.8);
                this.enhancementButton.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, UITheme.borders.radius.medium);
                this.enhancementButtonText.setScale(1.0);
            });
        });
        
        // Store references for cleanup
        this.enhancementButtonHitArea = buttonHitArea;
        
            }

    createQuestButton() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Button dimensions and position (next to Enhancement button)
        const buttonWidth = 80;
        const buttonHeight = 40;
        const buttonX = width - buttonWidth - 230; // 230 = 90 (player) + 10 + 90 (collection) + 10 + 100 (enhancement) + 10 + 10 (spacing)
        const buttonY = height - buttonHeight - 20;
        
        // Create button using UITheme
        const questBtn = UITheme.createButton(
            this, 
            buttonX + buttonWidth/2, 
            buttonY + buttonHeight/2, 
            buttonWidth, 
            buttonHeight, 
            '📜 Quest', 
            () => {
                if (this.questManager) {
                    this.questManager.showQuestLog();
                }
            },
            'primary'
        );
        
        // Set depth for proper layering
        questBtn.button.setDepth(this.DEPTH_LAYERS.UI_BUTTONS);
        questBtn.text.setDepth(this.DEPTH_LAYERS.UI_TEXT);
        questBtn.text.setFontStyle('bold');
        
        // Store references for cleanup
        this.questButton = questBtn.button;
        this.questButtonText = questBtn.text;
        
            }

    /**
     * Initialize Quest Manager with proper context from scene transition
     */
    initializeQuestManager(data) {
        try {
                        // Check if quest manager was passed from BoatMenuScene
            if (data && data.questManager) {
                                this.questManager = data.questManager;
                // Ensure the scene context is updated
                this.questManager.scene = this;
            } else {
                // Fallback to getting from GameState
                                this.questManager = this.gameState.getQuestManager(this);
                
                if (!this.questManager) {
                    console.warn('GameScene: QuestManager not available, creating new instance');
                    // Import QuestManager if not already available
                    try {
                        import('../scripts/QuestManager.js').then((module) => {
                            const { QuestManager } = module;
                            this.questManager = new QuestManager(this);
                                                    }).catch(importError => {
                            console.error('GameScene: Failed to import QuestManager:', importError);
                            this.questManager = null;
                        });
                    } catch (importError) {
                        console.error('GameScene: Failed to import QuestManager:', importError);
                        this.questManager = null;
                    }
                }
            }
            
            // Restore quest context if provided
            if (data && data.questContext && this.questManager) {
                                if (this.questManager.setState && data.questContext.questManagerState) {
                    this.questManager.setState(data.questContext.questManagerState);
                }
            }
            
                    } catch (error) {
            console.error('GameScene: Error initializing QuestManager:', error);
            this.questManager = null;
        }
    }

    /**
     * Setup event listeners to connect fishing events to QuestManager
     * This was the MISSING PIECE preventing quest completion!
     */
    setupQuestEventListeners() {
                if (!this.questManager) {
            console.warn('GameScene: Cannot setup quest event listeners - QuestManager not available');
            return;
        }

        // Debug current state before setup
                        this.logger?.debug('GameScene: Completed quests before setup:', Array.from(this.questManager.completedQuests)) || Logger.debug(this.constructor.name, 'GameScene: Completed quests before setup:', Array.from(this.questManager.completedQuests));

        // CRITICAL FIX: NEVER skip quest listener setup if there are ANY active quests
        // Only skip if both no active quests AND all story quests are genuinely completed
        const hasActiveQuests = this.questManager.activeQuests.size > 0;
        const allStoryQuestsCompleted = this.questManager.completedQuests.has('story_001_tutorial') && 
                                       this.questManager.completedQuests.has('story_002_first_companion');
        
        if (!hasActiveQuests && allStoryQuestsCompleted) {
                        this.removeQuestEventListeners();
            return;
        }

        // CRITICAL: ALWAYS set up boat menu listener if tutorial quest is active
        const tutorialActive = this.questManager.activeQuests.has('story_001_tutorial');
        if (tutorialActive) {
                    }

        // CRITICAL: Check if listeners are already set up to prevent duplicates
        if (this.questEventHandlers && this.events.listenerCount('boat:menuAccessed') > 0) {
                        this.logger?.debug('GameScene: Current boat:menuAccessed listeners:', this.events.listenerCount('boat:menuAccessed')) || Logger.debug(this.constructor.name, 'GameScene: Current boat:menuAccessed listeners:', this.events.listenerCount('boat:menuAccessed'));
            
            // If tutorial is active but boat menu listener is missing, force re-setup
            if (tutorialActive && this.events.listenerCount('boat:menuAccessed') === 0) {
                                this.removeQuestEventListeners(); // Clear and restart
            } else {
                return; // Already set up properly
            }
        }

        // ADDITIONAL CHECK: Remove any existing quest listeners first
        this.removeQuestEventListeners();

                // Store quest event handler references for cleanup
        this.questEventHandlers = {
            castComplete: (data) => {
                if (this.questManager.activeQuests && this.questManager.activeQuests.size > 0) {
                                        this.questManager.onCast(data);
                } else {
                                    }
            },

            fishCaught: (data) => {
                if (this.questManager.activeQuests && this.questManager.activeQuests.size > 0) {
                                        // Forward to QuestManager with fish data
                    this.questManager.onFishCaught(data.fish || data);
                } else {
                                    }
            },

            boatMenuAccessed: () => {
                                if (this.questManager) {
                                                                                try {
                                                this.questManager.onBoatMenuAccessed();
                                            } catch (error) {
                        console.error('GameScene: ❌ Error calling QuestManager.onBoatMenuAccessed():', error);
                        console.error('GameScene: Error stack:', error.stack);
                    }
                } else {
                                    }
            },

            dialogCompleted: (data) => {
                if (this.questManager.activeQuests && this.questManager.activeQuests.size > 0) {
                                        this.questManager.onDialogCompleted(data.npcId, data);
                } else {
                                    }
            },

            romanceMeterChanged: (data) => {
                if (this.questManager.activeQuests && this.questManager.activeQuests.size > 0) {
                                        this.questManager.onRomanceMeterChanged(data.npcId, data.newValue);
                } else {
                                    }
            },

            questCompleted: (data) => {
                                // The reward UI is now shown automatically by QuestManager.completeQuest()
                // But we can add additional GameScene-specific handling here if needed
                
                // Update Quest Tracker UI
                if (this.questTrackerUI) {
                                        this.questTrackerUI.refreshQuests();
                }
                
                // Play completion sound effect if available
                if (this.audioManager) {
                    try {
                        this.audioManager.playSound('quest_complete');
                    } catch (audioError) {
                                            }
                }
                
                // Show brief success message
                this.showQuestCompletionMessage(data.quest);
            }
        };

        // Set up the event listeners
        this.game.events.on('fishing:castComplete', this.questEventHandlers.castComplete);
        this.game.events.on('fishing:catchSuccess', this.questEventHandlers.fishCaught);
        this.game.events.on('boat:menuAccessed', this.questEventHandlers.boatMenuAccessed);
        this.game.events.on('dialog:completed', this.questEventHandlers.dialogCompleted);
        this.game.events.on('romance:meterChanged', this.questEventHandlers.romanceMeterChanged);
        this.game.events.on('quest-completed', this.questEventHandlers.questCompleted);

        // Listen for quest completion to remove event listeners
        this.game.events.on('quest-completed', (questData) => {
                        // Only remove listeners if genuinely NO active quests remain
            if (this.questManager.activeQuests.size === 0) {
                                this.removeQuestEventListeners();
            }
        });

                        // Debug: Log current event listener status
        this.debugEventListeners();
    }

    /**
     * Debug method to log current event listener status
     */
    debugEventListeners() {
                                                this.logger?.debug('Completed quests:', this.questManager ? Array.from(this.questManager.completedQuests) : []) || Logger.debug(this.constructor.name, 'Completed quests:', this.questManager ? Array.from(this.questManager.completedQuests) : []);
            }

    /**
     * Remove quest event listeners when all quests are completed
     */
    removeQuestEventListeners() {
                // CRITICAL FIX: Only remove listeners, DON'T disable the entire quest system
                // Remove ALL instances of quest-related event listeners (not just specific handlers)
        this.game.events.removeAllListeners('fishing:castComplete');
        this.game.events.removeAllListeners('fishing:catchSuccess'); 
        this.game.events.removeAllListeners('boat:menuAccessed');
        this.game.events.removeAllListeners('dialog:completed');
        this.game.events.removeAllListeners('romance:meterChanged');
        this.game.events.removeAllListeners('quest-completed');
        this.game.events.removeAllListeners('tutorial-quests-completed');
        
                // CRITICAL FIX: Clean up QuestTrackerUI listeners to prevent duplicate fish
        if (this.questTrackerUI) {
                        try {
                // Force QuestTrackerUI to remove its event listeners
                this.questTrackerUI.destroy();
                this.questTrackerUI = null;
                            } catch (error) {
                console.error('GameScene: Error destroying QuestTrackerUI:', error);
            }
        }

        // If we have specific handlers, try to remove them too (double cleanup)
        if (this.questEventHandlers) {
            try {
                // Additional specific removal for safety
                this.game.events.off('fishing:castComplete', this.questEventHandlers.castComplete);
                this.game.events.off('fishing:catchSuccess', this.questEventHandlers.fishCaught);
                this.game.events.off('boat:menuAccessed', this.questEventHandlers.boatMenuAccessed);
                this.game.events.off('dialog:completed', this.questEventHandlers.dialogCompleted);
                this.game.events.off('romance:meterChanged', this.questEventHandlers.romanceMeterChanged);
                this.game.events.off('quest-completed', this.questEventHandlers.questCompleted);
                            } catch (error) {
                console.warn('GameScene: Error removing specific handlers (expected after removeAllListeners):', error.message);
            }
        }

        // Clear the handler references
        this.questEventHandlers = null;

        // CRITICAL FIX: DO NOT mark quest system as disabled - let it complete naturally
        // This was the main bug causing objectives to never complete!
                // Final verification - debug what listeners remain
        if (import.meta.env.DEV) {
            this.logger?.debug('  - fishing:catchSuccess:', this.game.events.listenerCount('fishing:catchSuccess')) || Logger.debug(this.constructor.name, '  - fishing:catchSuccess:', this.game.events.listenerCount('fishing:catchSuccess'));
        }
        this.logger?.debug('  - fishing:castComplete:', this.game.events.listenerCount('fishing:castComplete')) || Logger.debug(this.constructor.name, '  - fishing:castComplete:', this.game.events.listenerCount('fishing:castComplete'));
        this.logger?.debug('  - boat:menuAccessed:', this.game.events.listenerCount('boat:menuAccessed')) || Logger.debug(this.constructor.name, '  - boat:menuAccessed:', this.game.events.listenerCount('boat:menuAccessed'));
        this.logger?.debug('  - dialog:completed:', this.game.events.listenerCount('dialog:completed')) || Logger.debug(this.constructor.name, '  - dialog:completed:', this.game.events.listenerCount('dialog:completed'));
        this.logger?.debug('  - quest-completed:', this.game.events.listenerCount('quest-completed')) || Logger.debug(this.constructor.name, '  - quest-completed:', this.game.events.listenerCount('quest-completed'));
    }

    /**
     * Setup RenJs integration with QuestManager
     */
    setupRenJsQuestIntegration() {
        if (!this.questManager) {
            console.warn('GameScene: Cannot setup RenJs integration - QuestManager not available');
            return;
        }

                // Expose QuestManager globally for RenJs access
        if (typeof window !== 'undefined') {
            window.LuxuryAnglerQuests = this.questManager.exportForRenJs();
                    }

        // Setup DialogManager integration with QuestManager
        if (this.dialogManager) {
            // Add quest integration methods to DialogManager
            this.dialogManager.questManager = this.questManager;
            
            // Setup event listeners for RenJs dialog events
            this.setupDialogQuestEvents();
            
            // Initialize DialogManager's RenJs global integration
            this.dialogManager.initializeRenJsGlobalIntegration();
            
                    }

        // Setup RenJs command integration for DialogScene
        this.events.on('dialog-scene-ready', (dialogScene) => {
            this.integrateQuestManagerWithDialogScene(dialogScene);
        });

            }

    /**
     * Setup event listeners for dialog-quest integration
     */
    setupDialogQuestEvents() {
        try {
            // Listen for dialog completion events
            this.events.on('dialog-completed', (data) => {
                const { npcId, choiceData } = data;
                
                // Trigger quest manager hooks
                if (this.questManager && this.questManager.onDialogCompleted) {
                    this.questManager.onDialogCompleted(npcId, choiceData);
                    
                    // If RenJs choice data is available, process it
                    if (choiceData?.renjsData) {
                        const { dialogId, choiceId } = choiceData.renjsData;
                        if (this.questManager.onRenJsChoiceMade) {
                            this.questManager.onRenJsChoiceMade(dialogId, choiceId, npcId);
                        }
                    }
                }
            });

            // Listen for romance meter changes
            this.events.on('romance-meter-updated', (data) => {
                if (this.questManager && this.questManager.onRomanceMeterChanged) {
                    this.questManager.onRomanceMeterChanged(data.npcId, data.newValue);
                }
            });

            // Listen for RenJs quest commands
            this.events.on('renjs-quest-command', (data) => {
                                // Update UI if quest log is open
                try {
                    const questScene = this.scene.get('QuestScene');
                    if (questScene && questScene.scene.isActive()) {
                        if (questScene.refreshQuestDisplay) {
                            questScene.refreshQuestDisplay();
                        }
                    }
                } catch (uiError) {
                    console.warn('GameScene: Could not update quest UI:', uiError.message);
                }
            });

                    } catch (error) {
            console.error('GameScene: Error setting up dialog-quest event listeners:', error);
        }
    }

    /**
     * Integrate QuestManager with DialogScene for RenJs commands
     * @param {DialogScene} dialogScene - The dialog scene instance
     */
    integrateQuestManagerWithDialogScene(dialogScene) {
        if (!this.questManager || !dialogScene) {
            console.warn('GameScene: Cannot integrate QuestManager with DialogScene');
            return;
        }

                // Expose quest manager methods to dialog scene
        dialogScene.questManager = this.questManager;
        
        // Add RenJs command handlers
        dialogScene.addRenJsCommandHandler = (command, callback) => {
            this.questManager.renjsCallbacks.set(command, callback);
        };

        // Add quest state query method
        dialogScene.getQuestState = (stateKey) => {
            return this.questManager.getQuestStateForRenJs(stateKey);
        };

        // Add quest command execution method
        dialogScene.executeQuestCommand = (command, ...args) => {
            return this.questManager.executeRenJsCommand(command, ...args);
        };

            }

    /**
     * RenJs hook for quest system - called from dialog scripts
     * @param {string} command - Quest command
     * @param {...any} args - Command arguments
     * @returns {any} Command result
     */
    executeQuestCommand(command, ...args) {
        if (this.questManager) {
            return this.questManager.executeRenJsCommand(command, ...args);
        } else {
            console.warn('GameScene: Cannot execute quest command - QuestManager not available');
            return false;
        }
    }

    /**
     * Get quest state for RenJs scripts
     * @param {string} stateKey - State key to query
     * @returns {any} State value
     */
    getQuestState(stateKey) {
        if (this.questManager) {
            return this.questManager.getQuestStateForRenJs(stateKey);
        } else {
            console.warn('GameScene: Cannot get quest state - QuestManager not available');
            return null;
        }
    }

    createReturnToBoatButton() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Button dimensions and position (top center area for visibility)
        const buttonWidth = 140;
        const buttonHeight = 40;
        const buttonX = (width - buttonWidth) / 2;
        const buttonY = 20;
        
        // Create button using UITheme
        const returnBtn = UITheme.createButton(
            this, 
            buttonX + buttonWidth/2, 
            buttonY + buttonHeight/2, 
            buttonWidth, 
            buttonHeight, 
            '🚤 Return to Boat', 
            () => {
                this.returnToBoat();
            },
            'danger'
        );
        
        // Set depth for proper layering
        returnBtn.button.setDepth(this.DEPTH_LAYERS.UI_BUTTONS);
        returnBtn.text.setDepth(this.DEPTH_LAYERS.UI_TEXT);
        returnBtn.text.setFontStyle('bold');
        
        // Store references for cleanup
        this.returnToBoatButton = returnBtn.button;
        this.returnToBoatButtonText = returnBtn.text;
        
            }

    showFishingSessionStatus() {
        const sessionData = this.gameState.currentFishingSession;
        if (sessionData) {
            // Create a more attractive fishing session status panel
            const statusContainer = this.add.container(20, this.cameras.main.height - 120);
            statusContainer.setDepth(this.DEPTH_LAYERS.UI_PANELS);
            
            // Background panel
            const statusBg = UITheme.createPanel(this, 0, 0, 200, 100, 'primary');
            statusBg.setAlpha(0.85);
            statusContainer.add(statusBg);
            
            // Session title
            const titleText = UITheme.createText(this, 100, 10, 'FISHING SESSION', 'headerSmall');
            titleText.setOrigin(0.5, 0);
            titleText.setColor(UITheme.colors.gold);
            statusContainer.add(titleText);
            
            // Location with icon
            const locationIcon = this.add.text(10, 35, '📍', { fontSize: '16px' });
            const locationText = UITheme.createText(this, 35, 35, sessionData.location, 'bodyMedium');
            statusContainer.add([locationIcon, locationText]);
            
            // Weather with icon
            const weatherIcon = this.add.text(10, 60, this.getWeatherEmoji(sessionData.weather), { fontSize: '16px' });
            const weatherText = UITheme.createText(this, 35, 60, `${sessionData.weather} • ${sessionData.timeOfDay}`, 'bodyMedium');
            statusContainer.add([weatherIcon, weatherText]);
            
            // Add subtle animation
            this.tweens.add({
                targets: statusContainer,
                y: this.cameras.main.height - 125,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            // Store reference
            this.fishingStatusContainer = statusContainer;
        }
    }

    getWeatherEmoji(weather) {
        if (weather.includes('Rain')) return '🌧️';
        if (weather.includes('Cloud')) return '☁️';
        if (weather.includes('Storm')) return '⛈️';
        if (weather.includes('Clear')) return '☀️';
        if (weather.includes('Fog')) return '🌫️';
        if (weather.includes('Wind')) return '💨';
        return '🌤️'; // Default
    }

    createTestMiaButton() {
        const { width, height } = this.cameras.main;
        
        // Create test button for Mia
        const testMiaButton = this.add.rectangle(width - 150, 80, 120, 35, 0x9c27b0, 0.9);
        testMiaButton.setStrokeStyle(2, 0xe91e63, 1);
        testMiaButton.setDepth(this.getUIDepth('ui_buttons'));
        testMiaButton.setInteractive();
        
        const testMiaText = this.add.text(width - 150, 80, '💗 Meet Mia', {
            fontSize: '14px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        testMiaText.setDepth(this.getUIDepth('ui_text'));
        
        testMiaButton.on('pointerdown', () => {
                        this.scene.launch('CabinScene', {
                callingScene: 'GameScene',
                selectedNPC: 'mia'
            });
        });
        
        testMiaButton.on('pointerover', () => {
            testMiaButton.setFillStyle(0xad36b0, 1);
        });
        
        testMiaButton.on('pointerout', () => {
            testMiaButton.setFillStyle(0x9c27b0, 0.9);
        });
        
            }

    openMiaDialog() {
                try {
            // Check if DialogManager is available
            if (!this.dialogManager) {
                console.warn('GameScene: DialogManager not available, launching DialogScene directly');
                this.scene.launch('DialogScene', {
                    npc: 'mia',
                    script: 'sample_assistant.md',
                    callingScene: 'GameScene'
                });
                return;
            }
            
            // Use DialogManager to start dialog
            this.dialogManager.startDialog('mia', 'GameScene');
            
        } catch (error) {
            console.error('GameScene: Error opening Mia dialog:', error);
            // Fallback: Launch CabinScene with Mia selected
                        this.scene.launch('CabinScene', {
                callingScene: 'GameScene',
                selectedNPC: 'mia'
            });
        }
    }

    returnToBoat() {
                if (this.isReturning) {
            console.warn('GameScene: Return to boat already in progress.');
            return;
        }
        this.isReturning = true;

        // 1. Stop all scene activities
        this.physics.pause();
        this.time.removeAllEvents();
        this.tweens.killAll();
                // 2. Clean up all UI and game objects
        try {
            // Destroy UI Panels
            if (this.inventoryUI) this.inventoryUI.destroy();
            if (this.playerProgressionUI) this.playerProgressionUI.destroy();
            if (this.fishCollectionUI) this.fishCollectionUI.destroy();
            if (this.craftingUI) this.craftingUI.destroy();
            if (this.equipmentEnhancementUI) this.equipmentEnhancementUI.destroy();
            if (this.timeWeatherUI) this.timeWeatherUI.destroy();
            if (this.renJsDebugUI) this.renJsDebugUI.destroy();
            if (this.qteDebugTool) this.qteDebugTool.destroy();
            if (this.fishTuningTool) this.fishTuningTool.destroy();
            if (this.luringDebugTool) this.luringDebugTool.destroy();
            
            // Destroy buttons and other graphics
            this.playerButton?.destroy();
            this.playerButtonText?.destroy();
            this.collectionButton?.destroy();
            this.collectionButtonText?.destroy();
            this.enhancementButton?.destroy();
            this.enhancementButtonText?.destroy();
            this.enhancementButtonHitArea?.destroy();
            this.questButton?.destroy();
            this.questButtonText?.destroy();
            this.returnToBoatButton?.destroy();
            this.returnToBoatButtonText?.destroy();

            // Destroy game elements
            this.crosshair?.destroy();
            this.fishingRod?.destroy();
            this.fishingLine?.destroy();
            this.lure?.destroy();
            this.fishGroup?.destroy(true, true);
            this.permanentHotspot?.destroy();
            this.fishingSpots?.forEach(spot => {
                spot.visual?.destroy();
                spot.label?.destroy();
            });

                    } catch (e) {
            console.error('GameScene: Error during cleanup, continuing transition...', e);
        }

        // 3. Finalize game state
        if (this.gameState) {
            this.gameState.stopAutoSave();
            if (this.gameState.currentFishingSession) {
                this.gameState.currentFishingSession.endTime = Date.now();
            }
            this.gameState.player.currentActivity = 'boat';
            this.gameState.save();
                    }

        // 4. Transition to BoatMenuScene
                this.scene.start('BoatMenuScene', {
            returnedFromFishing: true,
            fishingSessionData: this.gameState?.currentFishingSession || null
        });
    }

    destroy() {
                try {
            // Set flag to prevent new operations
            this.destroying = true;
            
            // Clean up quest event listeners FIRST
            this.removeQuestEventListeners();
            
            // Stop auto-save first
            if (this.gameState) {
                this.gameState.stopAutoSave();
            }
            
            // Clean up input handling
            try {
                if (this.inputManager) {
                    this.inputManager.destroy();
                    this.inputManager = null;
                }
                
                if (this.playerController) {
                    this.playerController.destroy();
                    this.playerController = null;
                }
            } catch (inputError) {
                console.warn('GameScene: Error cleaning up input systems:', inputError);
            }
            
            // Clean up achievement and enhancement systems
            try {
                if (this.achievementEnhancer) {
                    this.achievementEnhancer.cleanup?.();
                    this.achievementEnhancer = null;
                }
                
                if (this.achievementPopupSystem) {
                    this.achievementPopupSystem.cleanup?.();
                    this.achievementPopupSystem = null;
                }
            } catch (enhancementError) {
                console.warn('GameScene: Error cleaning up enhancement systems:', enhancementError);
            }
            
            // Clean up time and weather systems
            try {
                if (this.timeManager) {
                    this.timeManager.cleanup?.();
                    this.timeManager = null;
                }
                
                if (this.weatherManager) {
                    this.weatherManager.cleanup?.();
                    this.weatherManager = null;
                }
            } catch (timeWeatherError) {
                console.warn('GameScene: Error cleaning up time/weather systems:', timeWeatherError);
            }
            
            // Clean up fishing spots system
            try {
                if (this.fishingSpots) {
                    this.fishingSpots.forEach(spot => {
                        if (spot.visual) spot.visual.destroy();
                        if (spot.label) spot.label.destroy();
                        if (spot.timer) spot.timer.destroy();
                    });
                    this.fishingSpots = [];
                }
            } catch (spotsError) {
                console.warn('GameScene: Error cleaning up fishing spots:', spotsError);
            }
            
            // Clean up timers
            try {
                if (this.spotRotationTimer) {
                    this.spotRotationTimer.destroy();
                    this.spotRotationTimer = null;
                }
            } catch (timerError) {
                console.warn('GameScene: Error cleaning up timers:', timerError);
            }
            
            // Clean up fish attraction timers
            try {
                if (this.fishGroup) {
                    this.fishGroup.children.entries.forEach(fish => {
                        if (fish.attractionTimer) {
                            fish.attractionTimer.destroy();
                        }
                        if (fish.spotAttractionTimer) {
                            fish.spotAttractionTimer.destroy();
                        }
                    });
                    this.fishGroup.destroy();
                    this.fishGroup = null;
                }
            } catch (fishError) {
                console.warn('GameScene: Error cleaning up fish systems:', fishError);
            }
            
            // Clean up audio
            try {
                if (this.audioManager) {
                    this.audioManager.cleanup?.();
                    this.audioManager = null;
                }
            } catch (audioError) {
                console.warn('GameScene: Error cleaning up audio:', audioError);
            }
            
            // Clean up loading manager
            try {
                if (this.loadingStateManager) {
                    this.loadingStateManager.cleanup?.();
                    this.loadingStateManager = null;
                }
            } catch (loadingError) {
                console.warn('GameScene: Error cleaning up loading manager:', loadingError);
            }
            
            // Kill all tweens
            try {
                this.tweens.killAll();
            } catch (tweenError) {
                console.warn('GameScene: Error killing tweens:', tweenError);
            }
            
            // Clear scene references from gameState
            try {
                if (this.gameState) {
                    this.gameState.timeManager = null;
                    this.gameState.weatherManager = null;
                }
            } catch (stateError) {
                console.warn('GameScene: Error clearing gameState references:', stateError);
            }
            
            // Clean up QTE Debug Tool
            try {
                if (this.qteDebugTool) {
                    this.qteDebugTool.destroy();
                    this.qteDebugTool = null;
                }
            } catch (debugToolError) {
                console.warn('GameScene: Error cleaning up QTE debug tool:', debugToolError);
            }
            
            // Clean up Fish Tuning Tool
            try {
                if (this.fishTuningTool) {
                    this.fishTuningTool.destroy();
                    this.fishTuningTool = null;
                }
            } catch (fishTuningError) {
                console.warn('GameScene: Error cleaning up Fish Tuning Tool:', fishTuningError);
            }
            
            // Clean up Luring Debug Tool
            try {
                if (this.luringDebugTool) {
                    this.luringDebugTool.destroy();
                    this.luringDebugTool = null;
                }
            } catch (luringDebugError) {
                console.warn('GameScene: Error cleaning up Luring Debug Tool:', luringDebugError);
            }
            
            // Clean up Quest Tracker UI
            try {
                if (this.questTrackerUI) {
                    this.questTrackerUI.destroy();
                    this.questTrackerUI = null;
                }
            } catch (questTrackerError) {
                console.warn('GameScene: Error cleaning up Quest Tracker UI:', questTrackerError);
            }
            
                    } catch (error) {
            console.error('GameScene: Error during destroy cleanup:', error);
            console.error('GameScene: Destroy error stack:', error.stack);
        }
        
        // Call parent destroy
        try {
            super.destroy();
        } catch (superError) {
            console.error('GameScene: Error in parent destroy:', superError);
        }
        
            }

    /**
     * Show a brief quest completion message
     */
    showQuestCompletionMessage(quest) {
                try {
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;
            
            // Create a brief notification
            const notification = this.add.container(width / 2, 100);
            notification.setDepth(9999); // High depth but below reward UI
            
            // Background
            const bg = this.add.rectangle(0, 0, 300, 60, 0x2c3e50, 0.9);
            bg.setStrokeStyle(2, 0xf39c12);
            notification.add(bg);
            
            // Text
            const text = this.add.text(0, 0, `✅ Quest Complete!\n${quest.title}`, {
                fontSize: '14px',
                fill: '#ffffff',
                fontStyle: 'bold',
                align: 'center',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
            notification.add(text);
            
            // Animate in
            notification.setAlpha(0);
            notification.setScale(0.8);
            
            this.tweens.add({
                targets: notification,
                alpha: 1,
                scaleX: 1,
                scaleY: 1,
                duration: 300,
                ease: 'Back.easeOut',
                onComplete: () => {
                    // Hold for a moment, then fade out
                    this.time.delayedCall(2000, () => {
                        this.tweens.add({
                            targets: notification,
                            alpha: 0,
                            scaleX: 0.8,
                            scaleY: 0.8,
                            duration: 300,
                            ease: 'Power2.easeIn',
                            onComplete: () => {
                                notification.destroy();
                            }
                        });
                    });
                }
            });
            
                    } catch (error) {
            console.error('GameScene: Error creating quest completion message:', error);
        }
    }

    /**
     * Initialize async components in the background without blocking scene creation
     */
    async initializeAsyncComponents(data) {
        try {
                        // Initialize Quest Manager asynchronously
            await this.initializeQuestManagerAsync();
            
                    } catch (error) {
            console.error('GameScene: Error in async component initialization:', error);
        }
    }
    
    /**
     * Initialize QuestManager asynchronously
     */
    async initializeQuestManagerAsync() {
        try {
                        // CRITICAL FIX: Ensure gameState is available before proceeding
            if (!this.gameState) {
                                this.gameState = GameState.getInstance();
                if (!this.gameState) {
                    console.error('GameScene: Failed to get GameState instance');
                    return;
                }
                            }
            
            if (this.gameState.questManager) {
                                this.questManager = this.gameState.questManager;
                
                // Update scene reference
                this.questManager.scene = this;
                
                // Ensure it's initialized
                if (!this.questManager.isInitialized) {
                                        const initResult = await this.questManager.initialize();
                    if (initResult) {
                                            } else {
                        console.error('GameScene: ❌ QuestManager initialization failed');
                        return;
                    }
                }
            } else {
                                this.questManager = new QuestManager(this);
                this.gameState.questManager = this.questManager;
                
                // Initialize the QuestManager asynchronously
                                const initResult = await this.questManager.initialize();
                if (initResult) {
                                    } else {
                    console.error('GameScene: ❌ QuestManager initialization failed');
                    return;
                }
            }
            
            // Set up quest event listeners after QuestManager is ready
            this.setupQuestEventListeners();
            
            // Initialize Quest Tracker UI after QuestManager is ready
            try {
                                const { QuestTrackerUI } = await import('../ui/QuestTrackerUI.js');
                this.questTrackerUI = new QuestTrackerUI(this, this.questManager);
                            } catch (trackerError) {
                console.error('GameScene: Error initializing Quest Tracker UI:', trackerError);
                this.questTrackerUI = null;
            }
            
                    } catch (error) {
            console.error('GameScene: Error initializing Quest Manager:', error);
            console.error('GameScene: Error stack:', error.stack);
            this.questManager = null;
        }
    }

    /**
     * Fallback method to initialize Quest Tracker UI if async initialization hasn't completed
     */
    async initializeQuestTrackerUIFallback() {
        try {
                        // Wait for QuestManager if it's still initializing
            if (!this.questManager && this.gameState?.questManager) {
                this.questManager = this.gameState.questManager;
                            }
            
            if (!this.questManager) {
                console.warn('GameScene: QuestManager not available for Quest Tracker UI fallback');
                return;
            }
            
            // Initialize Quest Tracker UI
            const { QuestTrackerUI } = await import('../ui/QuestTrackerUI.js');
            this.questTrackerUI = new QuestTrackerUI(this, this.questManager);
                        // Now toggle it since user requested it
            this.questTrackerUI.toggleVisibility();
            
        } catch (error) {
            console.error('GameScene: Quest Tracker UI fallback initialization failed:', error);
        }
    }
} 