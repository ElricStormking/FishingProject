import Phaser from 'phaser';
import { RenJsLoader } from '../scripts/RenJsLoader.js';
import UITheme from '../ui/UITheme.js';

/**
 * DialogScene - Enhanced visual novel interface for NPC story dialogs
 * Features: NPC portraits, nameplates, choice buttons, dialog history, skip/auto mode
 */
export default class DialogScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DialogScene' });
        this.currentNPCId = null;
        this.currentScript = null;
        this.isDialogActive = false;
        this.dialogContainer = null;
        this.dialogElements = [];
        this.renjsLoader = null;
        this.callingScene = null;
        this.externalDialogManager = null;
    }

    init(data) {
        console.log('DialogScene: Initializing with data:', data);
        this.currentNPCId = data.npcId || 'mia';
        this.currentScript = data.script || null;
        this.callingScene = data.callingScene || 'GameScene';
        this.externalDialogManager = data.dialogManager || null;
    }

    preload() {
        // Load dialog UI assets with error handling
        this.load.on('loaderror', (file) => {
            console.warn('DialogScene: Failed to load asset:', file.src || file.key);
            // Don't throw errors for missing assets, just log and continue
        });

        // Try to load our custom dialog assets (these may not exist, that's ok)
        try {
            this.load.image('dialog-bg', 'assets/ui/dialog-background.png');
            this.load.image('dialog-box', 'assets/ui/dialog-box.png');
            this.load.image('choice-button', 'assets/ui/choice-button.png');
            this.load.image('nameplate', 'assets/ui/nameplate.png');
            
            // Load NPC portraits (may not exist)
            this.load.image('portrait-mia', 'assets/npcs/mia-portrait.png');
            this.load.image('portrait-sophie', 'assets/npcs/sophie-portrait.png');
            this.load.image('portrait-luna', 'assets/npcs/luna-portrait.png');
            
            // Load UI icons (may not exist)
            this.load.image('skip-icon', 'assets/ui/skip-icon.png');
            this.load.image('auto-icon', 'assets/ui/auto-icon.png');
            this.load.image('history-icon', 'assets/ui/history-icon.png');
            this.load.image('close-icon', 'assets/ui/close-icon.png');
        } catch (error) {
            console.warn('DialogScene: Error setting up asset loading:', error);
        }

        // Remove error listener after load completes
        this.load.once('complete', () => {
            console.log('DialogScene: Asset loading complete (some assets may be missing, that\'s ok)');
        });
    }

    create() {
        console.log('DialogScene: Creating dialog interface...');
        
        // Create semi-transparent background overlay using UITheme
        const overlay = this.add.graphics();
        overlay.fillStyle(UITheme.colors.overlay, 0.7);
        overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        overlay.setInteractive();
        
        // Add ESC key to close dialog
        this.input.keyboard.on('keydown-ESC', () => {
            this.closeDialog();
        });

        // Initialize dialog system
        this.initializeDialogSystem();

        this.isDialogActive = true;
    }

    /**
     * Get DialogManager from various sources with fallback logic
     * @returns {Object|null} DialogManager instance or null if not found
     */
    getDialogManager() {
        // Try external first
        if (this.externalDialogManager) {
            return this.externalDialogManager;
        }
        
        // Try GameScene
        const gameScene = this.scene.get('GameScene');
        if (gameScene?.dialogManager) {
            return gameScene.dialogManager;
        }
        
        // Try BoatMenuScene
        const boatMenuScene = this.scene.get('BoatMenuScene');
        if (boatMenuScene?.dialogManager) {
            return boatMenuScene.dialogManager;
        }
        
        // Try global gameState
        try {
            if (typeof window !== 'undefined' && window.gameState?.dialogManager) {
                return window.gameState.dialogManager;
            }
        } catch (error) {
            console.warn('DialogScene: Could not access global gameState:', error);
        }
        
        return null;
    }

    async initializeDialogSystem() {
        // Get the dialog manager using fallback logic
        const dialogManager = this.getDialogManager();
        
        if (!dialogManager) {
            console.error('DialogScene: DialogManager not found in any source (external, GameScene, BoatMenuScene, or GameState)');
            this.closeDialog();
            return;
        }

        console.log('DialogScene: Using DialogManager from', this.externalDialogManager ? 'external source' : 'GameScene');

        // Initialize RenJs loader
        this.renjsLoader = new RenJsLoader(this, dialogManager);

        // Try to initialize RenJs first
        const renjsInitialized = await this.renjsLoader.initialize();
        
        if (renjsInitialized) {
            console.log('DialogScene: Using RenJs for dialog');
            await this.startRenJsDialog();
        } else {
            console.log('DialogScene: Falling back to custom dialog system');
            this.startCustomDialog();
        }
    }

    async startRenJsDialog() {
        try {
            // Get NPC data for configuration - use same DialogManager retrieval logic
            let dialogManager = this.getDialogManager();
            
            const npcData = dialogManager?.getNPCData(this.currentNPCId);
            
            if (npcData) {
                // Update RenJs configuration with current NPC data
                this.renjsLoader.updateNPCConfig(this.currentNPCId, npcData);
            }

            // Start the dialog
            const dialogStarted = this.renjsLoader.startDialog(this.currentNPCId);
            
            if (!dialogStarted) {
                console.warn('DialogScene: Failed to start RenJs dialog, falling back to custom');
                this.startCustomDialog();
            } else {
                // Listen for dialog end from RenJs
                this.events.on('dialog-ended', () => {
                    this.closeDialog();
                });
            }
            
        } catch (error) {
            console.error('DialogScene: Error starting RenJs dialog:', error);
            this.startCustomDialog();
        }
    }

    startCustomDialog() {
        // Get the dialog manager and NPC data - use same DialogManager retrieval logic
        let dialogManager = this.getDialogManager();
        
        if (!dialogManager) {
            console.error('DialogScene: DialogManager not found');
            this.closeDialog();
            return;
        }

        const npcData = dialogManager.getNPCData(this.currentNPCId);
        if (!npcData) {
            console.error('DialogScene: NPC data not found for:', this.currentNPCId);
            this.closeDialog();
            return;
        }

        // Create enhanced custom dialog
        this.createEnhancedCustomDialog(npcData);
    }

    createEnhancedCustomDialog(npcData) {
        console.log('DialogScene: Creating enhanced custom dialog for:', npcData.name);
        
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Main dialog container
        this.dialogContainer = this.add.container(centerX, centerY);

        // Background dialog box using UITheme
        const dialogBg = UITheme.createPanel(this, -400, -150, 800, 300, 'primary');
        this.dialogContainer.add(dialogBg);

        // NPC Portrait
        this.createNPCPortrait(npcData, -350, -100);

        // Name plate using UITheme
        const namePlate = UITheme.createPanel(this, -200, -140, 200, 40, 'secondary');
        this.dialogContainer.add(namePlate);

        // Character name using UITheme
        const nameText = UITheme.createText(this, -100, -120, npcData.name, 'headerSmall');
        nameText.setOrigin(0.5);
        nameText.setColor(npcData.color || UITheme.colors.text);
        this.dialogContainer.add(nameText);

        // Dialog text area
        const dialogText = this.createDialogText(npcData);
        this.dialogContainer.add(dialogText);

        // Control buttons
        this.createControlButtons();

        // Choice buttons (if applicable)
        this.createChoiceButtons(npcData);

        // Add entrance animation using UITheme
        this.dialogContainer.setScale(0.8);
        this.dialogContainer.setAlpha(0);
        this.tweens.add({
            targets: this.dialogContainer,
            scale: 1,
            alpha: 1,
            duration: UITheme.animations.medium,
            ease: UITheme.animations.easing.easeOut
        });
    }

    createNPCPortrait(npcData, x, y) {
        const portraitKey = `portrait-${npcData.id}`;
        
        if (this.textures.exists(portraitKey)) {
            const portrait = this.add.image(x, y, portraitKey);
            portrait.setDisplaySize(120, 150);
            portrait.setOrigin(0.5);
            this.dialogContainer.add(portrait);
        } else {
            // Create placeholder portrait
            const placeholder = this.add.graphics();
            placeholder.fillStyle(0x34495e, 0.8);
            placeholder.lineStyle(2, 0x95a5a6, 1);
            placeholder.fillRoundedRect(x - 60, y - 75, 120, 150, 10);
            placeholder.strokeRoundedRect(x - 60, y - 75, 120, 150, 10);
            
            const placeholderText = this.add.text(x, y, npcData.name[0], {
                font: '48px Arial',
                fill: '#ecf0f1',
                fontStyle: 'bold'
            });
            placeholderText.setOrigin(0.5);
            
            this.dialogContainer.add(placeholder);
            this.dialogContainer.add(placeholderText);
        }
    }

    createDialogText(npcData) {
        // Get dialog content based on current script or default
        const content = this.getDialogContent(npcData);
        
        // Create dialog text using UITheme
        const dialogText = UITheme.createText(this, -80, -50, content, 'bodyLarge');
        dialogText.setWordWrapWidth(460);
        dialogText.setLineSpacing(5);
        
        // Typewriter effect
        this.showTextWithTypewriter(dialogText, content);
        
        return dialogText;
    }

    getDialogContent(npcData) {
        if (this.currentScript) {
            // Parse custom script
            return this.parseCustomScript(this.currentScript, npcData);
        }
        
        // Default dialog based on NPC
        const defaultDialogs = {
            'mia': "Hello there! I'm Mia, your friendly fishing guide. Welcome to our beautiful fishing village! Would you like to learn some basic fishing techniques?",
            'sophie': "Hey! I'm Sophie! *bounces excitedly* I absolutely LOVE fishing! The thrill of the catch, the peaceful water... it's amazing! Want to hear about my latest adventure?",
            'luna': "Greetings, fellow seeker of the depths... I am Luna. The waters whisper secrets to those who listen carefully. Perhaps... you seek wisdom beyond the surface?"
        };
        
        return defaultDialogs[npcData.id] || "Hello! Nice to meet you.";
    }

    parseCustomScript(script, npcData) {
        // Simple script parsing - take first dialog line
        const lines = script.split('\n').filter(line => line.trim());
        for (const line of lines) {
            if (line.includes(': ')) {
                const [, dialog] = line.split(': ', 2);
                return dialog.replace(/"/g, '');
            }
        }
        return "Hello! How can I help you?";
    }

    showTextWithTypewriter(textObject, fullText) {
        textObject.setText('');
        
        let i = 0;
        const typewriterTimer = this.time.addEvent({
            delay: 30,
            callback: () => {
                textObject.setText(fullText.substr(0, i + 1));
                i++;
                if (i >= fullText.length) {
                    typewriterTimer.destroy();
                    this.showContinueIndicator();
                }
            },
            loop: true
        });
    }

    showContinueIndicator() {
        // Add blinking continue indicator using UITheme
        const indicator = UITheme.createText(this, 350, 100, '▼', 'bodyMedium');
        indicator.setOrigin(0.5);
        indicator.setColor(UITheme.colors.primary);
        this.dialogContainer.add(indicator);
        
        // Blinking animation using UITheme
        this.tweens.add({
            targets: indicator,
            alpha: 0.3,
            duration: UITheme.animations.slow,
            yoyo: true,
            repeat: -1
        });
    }

    createControlButtons() {
        // Close button using UITheme
        const closeButton = UITheme.createText(this, 380, -130, '✕', 'headerMedium');
        closeButton.setOrigin(0.5);
        closeButton.setColor(UITheme.colors.error);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.on('pointerdown', () => this.closeDialog());
        closeButton.on('pointerover', () => closeButton.setScale(1.2));
        closeButton.on('pointerout', () => closeButton.setScale(1));
        this.dialogContainer.add(closeButton);
    }

    createChoiceButtons(npcData) {
        // Add some basic interaction choices
        const choices = [
            { text: "Tell me about fishing", action: () => this.handleChoice('fishing', npcData) },
            { text: "Ask about the village", action: () => this.handleChoice('village', npcData) },
            { text: "Say goodbye", action: () => this.handleChoice('goodbye', npcData) }
        ];

        choices.forEach((choice, index) => {
            const buttonX = -200 + (index * 140);
            const buttonY = 80;
            const buttonWidth = 130;
            const buttonHeight = 40;
            
            // Create choice button using UITheme
            const uiButton = UITheme.createButton(this, buttonX, buttonY, buttonWidth, buttonHeight, choice.text, choice.action, 'secondary');
            
            // Add button components to the dialog container
            this.dialogContainer.add(uiButton.button);
            this.dialogContainer.add(uiButton.text);
            // Add the hitArea if createButton returns it and it's necessary for interaction
            if (uiButton.hitArea) {
                this.dialogContainer.add(uiButton.hitArea);
            }
        });
    }

    handleChoice(choiceType, npcData) {
        console.log('DialogScene: Choice selected:', choiceType, 'with NPC:', npcData.name);
        
        // Get dialog manager - use same retrieval logic as other methods
        let dialogManager = this.externalDialogManager;
        if (!dialogManager) {
            const gameScene = this.scene.get('GameScene');
            dialogManager = gameScene?.dialogManager;
        }
        
        if (dialogManager) {
            // Trigger appropriate dialog manager events
            switch (choiceType) {
                case 'fishing':
                    if (dialogManager.increaseRomanceMeter) {
                        dialogManager.increaseRomanceMeter(npcData.id, 3);
                    }
                    if (dialogManager.unlockAchievement) {
                        dialogManager.unlockAchievement('asked_about_fishing');
                    }
                    break;
                case 'village':
                    if (dialogManager.increaseRomanceMeter) {
                        dialogManager.increaseRomanceMeter(npcData.id, 2);
                    }
                    if (dialogManager.unlockAchievement) {
                        dialogManager.unlockAchievement('local_curiosity');
                    }
                    break;
                case 'goodbye':
                    if (dialogManager.increaseRomanceMeter) {
                        dialogManager.increaseRomanceMeter(npcData.id, 1);
                    }
                    break;
            }
            
            // Always unlock first conversation achievement
            if (dialogManager.unlockAchievement) {
                dialogManager.unlockAchievement('first_conversation');
            }
        } else {
            console.warn('DialogScene: No DialogManager available for choice handling');
        }
        
        // Close dialog after choice
        this.time.delayedCall(500, () => {
            this.closeDialog();
        });
    }

    closeDialog() {
        console.log('DialogScene: Closing dialog');
        
        // Clean up RenJs if it was used
        if (this.renjsLoader) {
            this.renjsLoader.stopDialog();
            this.renjsLoader.destroy();
            this.renjsLoader = null;
        }
        
        // Clean up custom dialog elements
        if (this.dialogElements && this.dialogElements.length > 0) {
            this.dialogElements.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            this.dialogElements = [];
        }

        // Clean up dialog container
        if (this.dialogContainer) {
            this.dialogContainer.destroy();
            this.dialogContainer = null;
        }

        this.isDialogActive = false;
        
        // Return to the proper calling scene
        this.scene.stop('DialogScene');
        
        // Resume the calling scene (CabinScene, GameScene, etc.)
        if (this.callingScene && this.scene.isActive(this.callingScene)) {
            this.scene.resume(this.callingScene);
        } else {
            // Fallback to GameScene if calling scene not available
            this.scene.resume('GameScene');
        }
    }

    update() {
        // Handle any ongoing dialog updates
        if (!this.isDialogActive) {
            return;
        }

        // Add SPACE key to advance dialog
        if (this.input.keyboard.addKey('SPACE').isDown) {
            // Could implement dialog advancement here
        }
    }

    destroy() {
        this.closeDialog();
        super.destroy();
    }
} 