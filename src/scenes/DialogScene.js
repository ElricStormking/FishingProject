import Phaser from 'phaser';
import { RenJsLoader } from '../scripts/RenJsLoader.js';
import { DialogDataConverter } from '../scripts/DialogDataConverter.js';
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
        this.currentDialogData = null;
        this.isDialogActive = false;
        this.dialogContainer = null;
        this.dialogElements = [];
        this.renjsLoader = null;
        this.dialogConverter = null;
        this.callingScene = null;
        this.externalDialogManager = null;
        this.useRenJs = false;
    }

    init(data) {
        console.log('DialogScene: Initializing with data:', data);
        this.currentNPCId = data.npcId || 'mia';
        this.currentScript = data.script || null;
        this.currentDialogData = data.dialogData || null;
        this.callingScene = data.callingScene || 'GameScene';
        this.externalDialogManager = data.dialogManager || null;
        this.useRenJs = data.useRenJs !== undefined ? data.useRenJs : false;
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
        
        // Try CabinScene
        const cabinScene = this.scene.get('CabinScene');
        if (cabinScene?.dialogManager) {
            return cabinScene.dialogManager;
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
            console.error('DialogScene: DialogManager not found in any source (external, GameScene, CabinScene, BoatMenuScene, or GameState)');
            this.closeDialog();
            return;
        }

        console.log('DialogScene: Using DialogManager from', this.externalDialogManager ? 'external source' : 'GameScene');

        // Initialize dialog converter for hybrid system with error handling
        try {
            this.dialogConverter = new DialogDataConverter();
        } catch (error) {
            console.warn('DialogScene: Failed to initialize DialogDataConverter:', error);
            this.dialogConverter = null;
        }

        // Get dialog data - either passed directly or from DialogManager
        let dialogData = this.currentDialogData;
        if (!dialogData && this.currentNPCId) {
            dialogData = await this.loadDialogData(this.currentNPCId);
        }

        if (!dialogData) {
            console.error('DialogScene: No dialog data available');
            this.closeDialog();
            return;
        }

        // Determine which system to use based on dialog type and availability
        const shouldUseRenJs = this.useRenJs && this.dialogConverter && this.dialogConverter.shouldUseRenJs(dialogData);
        
        if (shouldUseRenJs) {
            // Initialize RenJs loader with error handling
            try {
        this.renjsLoader = new RenJsLoader(this, dialogManager);
        const renjsInitialized = await this.renjsLoader.initialize();
        
        if (renjsInitialized) {
            console.log('DialogScene: Using RenJs for dialog');
                    await this.startRenJsDialog(dialogData);
                    return;
        } else {
                    console.log('DialogScene: RenJs failed to initialize, falling back to custom');
                }
            } catch (error) {
                console.warn('DialogScene: Error initializing RenJs:', error);
            console.log('DialogScene: Falling back to custom dialog system');
            }
        }

        console.log('DialogScene: Using custom dialog system');
        this.startCustomDialog(dialogData);
    }

    /**
     * Load dialog data from various sources
     */
    async loadDialogData(npcId) {
        const dialogManager = this.getDialogManager();
        
        // Try to get dialog data from DialogManager
        if (dialogManager && dialogManager.getDialogData) {
            const dialogData = await dialogManager.getDialogData(npcId);
            if (dialogData) return dialogData;
        }

        // Try to load from dialog samples JSON
        try {
            const response = await fetch('./src/data/dialog_samples.json');
            if (response.ok) {
                const dialogSamples = await response.json();
                
                // Handle the nested structure properly
                let allDialogs = [];
                
                if (dialogSamples && dialogSamples.dialogSamples) {
                    // Extract dialogs from all categories
                    const categories = dialogSamples.dialogSamples;
                    for (const categoryName in categories) {
                        const category = categories[categoryName];
                        if (category && typeof category === 'object') {
                            // Add all dialogs from this category
                            for (const dialogKey in category) {
                                const dialog = category[dialogKey];
                                if (dialog && dialog.speaker) {
                                    allDialogs.push(dialog);
                                }
                            }
                        }
                    }
                } else if (dialogSamples && Array.isArray(dialogSamples)) {
                    // Handle array format
                    allDialogs = dialogSamples;
                } else if (dialogSamples) {
                    // Handle flat object format
                    allDialogs = Object.values(dialogSamples).filter(item => item && item.speaker);
                }
                
                // Find dialog for this NPC
                const npcDisplayName = this.getNPCDisplayName(npcId);
                const npcDialogs = allDialogs.filter(dialog => 
                    dialog.speaker === npcDisplayName ||
                    dialog.speaker === npcId ||
                    (dialog.id && dialog.id.toLowerCase().includes(npcId.toLowerCase()))
                );
                
                if (npcDialogs.length > 0) {
                    console.log(`DialogScene: Found ${npcDialogs.length} dialogs for ${npcId}`);
                    // Return the first available dialog for this NPC
                    return npcDialogs[0];
                }
                
                console.log(`DialogScene: No specific dialogs found for ${npcId}, using fallback`);
            }
        } catch (error) {
            console.warn('DialogScene: Could not load dialog samples:', error);
        }

        // Fallback: create basic dialog data
        return this.createFallbackDialogData(npcId);
    }

    /**
     * Get display name for NPC ID
     */
    getNPCDisplayName(npcId) {
        const nameMap = {
            'mia': 'Mia',
            'sophie': 'Sophie', 
            'luna': 'Luna',
            'captain': 'Captain'
        };
        return nameMap[npcId.toLowerCase()] || npcId;
    }

    /**
     * Create fallback dialog data when no other source is available
     */
    createFallbackDialogData(npcId) {
        const displayName = this.getNPCDisplayName(npcId);
        return {
            id: `${npcId}_fallback`,
            type: 'tutorial',
            title: `Conversation with ${displayName}`,
            speaker: displayName,
            text: `Hello! I'm ${displayName}. How can I help you today?`,
            choices: [
                {
                    id: 'continue',
                    text: 'Thanks for talking with me!',
                    effects: {
                        dialogue: 'Anytime! Feel free to come back and chat.'
                    }
                }
            ]
        };
    }

    async startRenJsDialog(dialogData) {
        try {
            // Convert dialog data to RenJs format
            const renjsFormat = this.dialogConverter.getDialogForSystem(dialogData, true);
            
            if (renjsFormat.format === 'renjs') {
                // Set up RenJs callbacks for game integration
                this.renjsLoader.setCallbacks(renjsFormat.callbacks);
                
                // Load the converted script into RenJs
                const scriptLoaded = await this.renjsLoader.loadScript(dialogData.id, renjsFormat.script);
                
                if (scriptLoaded) {
                    // Start the dialog
                    const dialogStarted = this.renjsLoader.startDialog(dialogData.id);
                    
                    if (dialogStarted) {
                // Listen for dialog end from RenJs
                this.events.on('dialog-ended', () => {
                    this.closeDialog();
                });
                        return;
                    }
                }
            }
            
            console.warn('DialogScene: Failed to start RenJs dialog, falling back to custom');
            this.startCustomDialog(dialogData);
            
        } catch (error) {
            console.error('DialogScene: Error starting RenJs dialog:', error);
            this.startCustomDialog(dialogData);
        }
    }

    startCustomDialog(dialogData) {
        if (!dialogData) {
            console.error('DialogScene: No dialog data provided for custom dialog');
            this.closeDialog();
            return;
        }

        // Create enhanced custom dialog using JSON data
        this.createEnhancedCustomDialog(dialogData);
    }

    createEnhancedCustomDialog(dialogData) {
        console.log('DialogScene: Creating enhanced custom dialog for:', dialogData.speaker);
        
        try {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Main dialog container
        this.dialogContainer = this.add.container(centerX, centerY);

            // Background dialog box using UITheme with fallback
            let dialogBg;
            try {
                dialogBg = UITheme.createPanel(this, -400, -150, 800, 300, 'primary');
            } catch (error) {
                console.warn('DialogScene: UITheme.createPanel failed, using fallback:', error);
                dialogBg = this.add.graphics();
                dialogBg.fillStyle(0x2c3e50, 0.9);
                dialogBg.fillRoundedRect(-400, -150, 800, 300, 10);
                dialogBg.lineStyle(2, 0x3498db, 1);
                dialogBg.strokeRoundedRect(-400, -150, 800, 300, 10);
            }
        this.dialogContainer.add(dialogBg);

        // NPC Portrait
            this.createNPCPortrait(dialogData, -350, -100);

            // Name plate using UITheme with fallback
            let namePlate;
            try {
                namePlate = UITheme.createPanel(this, -200, -140, 200, 40, 'secondary');
            } catch (error) {
                console.warn('DialogScene: UITheme.createPanel for nameplate failed, using fallback:', error);
                namePlate = this.add.graphics();
                namePlate.fillStyle(0x34495e, 0.8);
                namePlate.fillRoundedRect(-200, -140, 200, 40, 5);
            }
        this.dialogContainer.add(namePlate);

            // Character name using UITheme with fallback
            let nameText;
            try {
                nameText = UITheme.createText(this, -100, -120, dialogData.speaker, 'headerSmall');
                nameText.setOrigin(0.5);
                nameText.setColor(UITheme.colors.text);
            } catch (error) {
                console.warn('DialogScene: UITheme.createText failed, using fallback:', error);
                nameText = this.add.text(-100, -120, dialogData.speaker, {
                    fontSize: '18px',
                    fill: '#ffffff',
                    fontWeight: 'bold'
                });
        nameText.setOrigin(0.5);
            }
        this.dialogContainer.add(nameText);

        // Dialog text area
            const dialogText = this.createDialogText(dialogData);
        this.dialogContainer.add(dialogText);

        // Control buttons
        this.createControlButtons();

        // Choice buttons (if applicable)
            this.createChoiceButtons(dialogData);

            // Add entrance animation using UITheme with fallback
        this.dialogContainer.setScale(0.8);
        this.dialogContainer.setAlpha(0);
            
            try {
        this.tweens.add({
            targets: this.dialogContainer,
            scale: 1,
            alpha: 1,
            duration: UITheme.animations.medium,
            ease: UITheme.animations.easing.easeOut
        });
            } catch (error) {
                console.warn('DialogScene: UITheme animation failed, using fallback:', error);
                this.tweens.add({
                    targets: this.dialogContainer,
                    scale: 1,
                    alpha: 1,
                    duration: 300,
                    ease: 'Power2'
                });
            }
            
        } catch (error) {
            console.error('DialogScene: Error creating enhanced custom dialog:', error);
            // Create a simple fallback dialog
            this.createSimpleFallbackDialog(dialogData);
        }
    }

    createNPCPortrait(dialogData, x, y) {
        const speakerName = dialogData.speaker.toLowerCase();
        const portraitKey = `portrait-${speakerName}`;
        
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
            
            const placeholderText = this.add.text(x, y, dialogData.speaker[0], {
                font: '48px Arial',
                fill: '#ecf0f1',
                fontStyle: 'bold'
            });
            placeholderText.setOrigin(0.5);
            
            this.dialogContainer.add(placeholder);
            this.dialogContainer.add(placeholderText);
        }
    }

    createDialogText(dialogData) {
        try {
            // Get dialog content from dialog data
            const content = dialogData.text || "Hello! How can I help you?";
            
            // Create dialog text using UITheme with fallback
            let dialogText;
            try {
                dialogText = UITheme.createText(this, -80, -50, content, 'bodyLarge');
        dialogText.setWordWrapWidth(460);
        dialogText.setLineSpacing(5);
            } catch (uiError) {
                console.warn('DialogScene: UITheme.createText failed for dialog text, using fallback:', uiError);
                // Create fallback dialog text
                dialogText = this.add.text(-80, -50, content, {
                    fontSize: '16px',
                    fill: '#ffffff',
                    wordWrap: { width: 460 },
                    lineSpacing: 5
                });
            }
        
        // Typewriter effect
        this.showTextWithTypewriter(dialogText, content);
        
        return dialogText;
        } catch (error) {
            console.error('DialogScene: Error creating dialog text:', error);
            // Return a simple fallback text
            const fallbackText = this.add.text(-80, -50, 'Hello!', {
                fontSize: '16px',
                fill: '#ffffff'
            });
            return fallbackText;
        }
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
        try {
            // Add blinking continue indicator using UITheme with fallback
            try {
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
            } catch (uiError) {
                console.warn('DialogScene: UITheme failed for continue indicator, using fallback:', uiError);
                // Create fallback continue indicator
                const indicator = this.add.text(350, 100, '▼', {
                    fontSize: '18px',
                    fill: '#3498db',
                    fontWeight: 'bold'
                });
                indicator.setOrigin(0.5);
                this.dialogContainer.add(indicator);
                
                // Simple blinking animation
                this.tweens.add({
                    targets: indicator,
                    alpha: 0.3,
                    duration: 800,
                    yoyo: true,
                    repeat: -1
                });
            }
        } catch (error) {
            console.error('DialogScene: Error creating continue indicator:', error);
        }
    }

    createControlButtons() {
        try {
            // Close button using UITheme with fallback
            try {
        const closeButton = UITheme.createText(this, 380, -130, '✕', 'headerMedium');
        closeButton.setOrigin(0.5);
        closeButton.setColor(UITheme.colors.error);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.on('pointerdown', () => this.closeDialog());
        closeButton.on('pointerover', () => closeButton.setScale(1.2));
        closeButton.on('pointerout', () => closeButton.setScale(1));
        this.dialogContainer.add(closeButton);
            } catch (uiError) {
                console.warn('DialogScene: UITheme.createText failed for close button, using fallback:', uiError);
                // Create fallback close button
                const closeButton = this.add.text(380, -130, '✕', {
                    fontSize: '24px',
                    fill: '#ff4444',
                    fontWeight: 'bold'
                });
                closeButton.setOrigin(0.5);
                closeButton.setInteractive({ useHandCursor: true });
                closeButton.on('pointerdown', () => this.closeDialog());
                closeButton.on('pointerover', () => closeButton.setScale(1.2));
                closeButton.on('pointerout', () => closeButton.setScale(1));
                this.dialogContainer.add(closeButton);
            }
        } catch (error) {
            console.error('DialogScene: Error creating control buttons:', error);
        }
    }

    createChoiceButtons(dialogData) {
        try {
            // Use choices from dialog data if available, otherwise use default choices
            let choices = [];
            
            if (dialogData.choices && dialogData.choices.length > 0) {
                choices = dialogData.choices.map(choice => ({
                    text: choice.text,
                    action: () => this.handleDialogChoice(choice, dialogData)
                }));
            } else {
                // Default interaction choices
                choices = [
                    { text: "Tell me about fishing", action: () => this.handleChoice('fishing', dialogData) },
                    { text: "Ask about the village", action: () => this.handleChoice('village', dialogData) },
                    { text: "Say goodbye", action: () => this.handleChoice('goodbye', dialogData) }
                ];
            }

        choices.forEach((choice, index) => {
                try {
            const buttonX = -200 + (index * 140);
            const buttonY = 80;
            const buttonWidth = 130;
            const buttonHeight = 40;
            
                    // Try to create choice button using UITheme
                    try {
            const uiButton = UITheme.createButton(this, buttonX, buttonY, buttonWidth, buttonHeight, choice.text, choice.action, 'secondary');
            
            // Add button components to the dialog container
                        if (uiButton && uiButton.button) {
            this.dialogContainer.add(uiButton.button);
                        }
                        if (uiButton && uiButton.text) {
            this.dialogContainer.add(uiButton.text);
                        }
                        if (uiButton && uiButton.hitArea) {
                this.dialogContainer.add(uiButton.hitArea);
            }
                    } catch (uiError) {
                        console.warn('DialogScene: UITheme.createButton failed, using fallback:', uiError);
                        // Create fallback button
                        this.createFallbackChoiceButton(buttonX, buttonY, buttonWidth, buttonHeight, choice.text, choice.action);
                    }
                } catch (choiceError) {
                    console.error('DialogScene: Error creating choice button:', choiceError);
                }
            });
        } catch (error) {
            console.error('DialogScene: Error in createChoiceButtons:', error);
            // Create a simple continue button as fallback
            this.createFallbackContinueButton();
        }
    }

    /**
     * Create a fallback choice button when UITheme fails
     */
    createFallbackChoiceButton(x, y, width, height, text, action) {
        // Simple button background
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x2c3e50, 0.8);
        buttonBg.fillRoundedRect(x - width/2, y - height/2, width, height, 5);
        buttonBg.lineStyle(2, 0x3498db, 1);
        buttonBg.strokeRoundedRect(x - width/2, y - height/2, width, height, 5);
        this.dialogContainer.add(buttonBg);

        // Button text
        const buttonText = this.add.text(x, y, text, {
            fontSize: '14px',
            fill: '#ffffff',
            fontWeight: 'bold',
            wordWrap: { width: width - 10 },
            align: 'center'
        });
        buttonText.setOrigin(0.5);
        this.dialogContainer.add(buttonText);

        // Interactive area
        const hitArea = this.add.rectangle(x, y, width, height, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', action);
        hitArea.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x34495e, 0.9);
            buttonBg.fillRoundedRect(x - width/2, y - height/2, width, height, 5);
            buttonBg.lineStyle(2, 0x5dade2, 1);
            buttonBg.strokeRoundedRect(x - width/2, y - height/2, width, height, 5);
        });
        hitArea.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x2c3e50, 0.8);
            buttonBg.fillRoundedRect(x - width/2, y - height/2, width, height, 5);
            buttonBg.lineStyle(2, 0x3498db, 1);
            buttonBg.strokeRoundedRect(x - width/2, y - height/2, width, height, 5);
        });
        this.dialogContainer.add(hitArea);
    }

    /**
     * Create a simple continue button as last resort fallback
     */
    createFallbackContinueButton() {
        const buttonX = 0;
        const buttonY = 80;
        const buttonWidth = 120;
        const buttonHeight = 40;

        // Simple continue button
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x27ae60, 0.8);
        buttonBg.fillRoundedRect(buttonX - buttonWidth/2, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);
        buttonBg.lineStyle(2, 0x2ecc71, 1);
        buttonBg.strokeRoundedRect(buttonX - buttonWidth/2, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);
        this.dialogContainer.add(buttonBg);

        const buttonText = this.add.text(buttonX, buttonY, 'Continue', {
            fontSize: '16px',
            fill: '#ffffff',
            fontWeight: 'bold'
        });
        buttonText.setOrigin(0.5);
        this.dialogContainer.add(buttonText);

        const hitArea = this.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', () => this.closeDialog());
        this.dialogContainer.add(hitArea);
    }

    /**
     * Handle choices from JSON dialog data
     */
    handleDialogChoice(choice, dialogData) {
        console.log('DialogScene: Dialog choice selected:', choice.text);
        
        const dialogManager = this.getDialogManager();
        
        if (choice.effects && dialogManager) {
            // Apply all effects from the choice
            this.applyDialogEffects(choice.effects, dialogManager);
        }
        
        // Show response dialogue if available
        if (choice.effects && choice.effects.dialogue) {
            // Update dialog text with response
            const dialogText = this.dialogContainer.list.find(child => 
                child.type === 'Text' && child.text.length > 50
            );
            if (dialogText) {
                this.showTextWithTypewriter(dialogText, choice.effects.dialogue);
            }
            
            // Close dialog after showing response
            this.time.delayedCall(2000, () => {
                this.closeDialog();
            });
        } else {
            // Close dialog immediately if no response
            this.time.delayedCall(500, () => {
                this.closeDialog();
            });
        }
    }

    /**
     * Apply dialog effects to game systems
     */
    applyDialogEffects(effects, dialogManager) {
        // Romance effects
        if (effects.romance) {
            Object.entries(effects.romance).forEach(([npcId, points]) => {
                if (dialogManager.increaseRomanceMeter) {
                    dialogManager.increaseRomanceMeter(npcId, points);
                }
            });
        }

        // Quest progression
        if (effects.questProgress && dialogManager.progressQuest) {
            dialogManager.progressQuest(effects.questProgress);
        }

        // Unlock quests
        if (effects.unlockQuest && dialogManager.startQuest) {
            dialogManager.startQuest(effects.unlockQuest);
        }

        // Experience rewards
        if (effects.experience) {
            console.log('DialogScene: Adding experience:', effects.experience);
            // Add experience handling here when available
        }

        // Coin rewards
        if (effects.coins) {
            console.log('DialogScene: Adding coins:', effects.coins);
            // Add coin handling here when available
        }

        // Item rewards
        if (effects.items && dialogManager.giveItem) {
            effects.items.forEach(item => {
                dialogManager.giveItem(item, 1);
            });
        }

        // Achievement unlocks
        if (effects.unlockAchievement && dialogManager.unlockAchievement) {
            dialogManager.unlockAchievement(effects.unlockAchievement);
        }

        // Map unlocks
        if (effects.unlockMap) {
            console.log('DialogScene: Unlocking map:', effects.unlockMap);
            // Add map unlock handling here when available
        }

        // Boss unlocks
        if (effects.unlockBoss) {
            console.log('DialogScene: Unlocking boss:', effects.unlockBoss);
            // Add boss unlock handling here when available
        }

        // Minigame starts
        if (effects.startMinigame) {
            console.log('DialogScene: Starting minigame:', effects.startMinigame);
            // Add minigame start handling here when available
        }

        // UI opens
        if (effects.openUI) {
            console.log('DialogScene: Opening UI:', effects.openUI);
            // Add UI opening handling here when available
        }
    }

    handleChoice(choiceType, dialogData) {
        console.log('DialogScene: Choice selected:', choiceType, 'with speaker:', dialogData.speaker);
        
        // Get dialog manager - use same retrieval logic as other methods
        let dialogManager = this.externalDialogManager;
        if (!dialogManager) {
            const gameScene = this.scene.get('GameScene');
            dialogManager = gameScene?.dialogManager;
        }
        
        if (dialogManager) {
            // Trigger appropriate dialog manager events
            const speakerName = dialogData.speaker.toLowerCase();
            switch (choiceType) {
                case 'fishing':
                    if (dialogManager.increaseRomanceMeter) {
                        dialogManager.increaseRomanceMeter(speakerName, 3);
                    }
                    if (dialogManager.unlockAchievement) {
                        dialogManager.unlockAchievement('asked_about_fishing');
                    }
                    break;
                case 'village':
                    if (dialogManager.increaseRomanceMeter) {
                        dialogManager.increaseRomanceMeter(speakerName, 2);
                    }
                    if (dialogManager.unlockAchievement) {
                        dialogManager.unlockAchievement('local_curiosity');
                    }
                    break;
                case 'goodbye':
                    if (dialogManager.increaseRomanceMeter) {
                        dialogManager.increaseRomanceMeter(speakerName, 1);
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
        if (!this.isDialogActive) return;

        console.log('DialogScene: Closing dialog');
        this.isDialogActive = false;

        // Emit dialog ended event for DialogManager
        this.events.emit('dialog-ended', { npcId: this.currentNPCId });

        // Clean up RenJs if it was used
        if (this.renjsLoader && this.renjsLoader.isInitialized) {
            this.renjsLoader.stopDialog();
        }

        // Add exit animation with UITheme
        if (this.dialogContainer) {
            this.tweens.add({
                targets: this.dialogContainer,
                scale: 0.8,
                alpha: 0,
                duration: UITheme.animations.fast,
                ease: UITheme.animations.easing.easeIn,
                onComplete: () => {
                    this.scene.stop();
                }
            });
        } else {
            // Stop the scene if no container to animate
            this.scene.stop();
        }
        
        // Resume the calling scene if it's paused
        if (this.callingScene && this.scene.isPaused(this.callingScene)) {
            this.scene.resume(this.callingScene);
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

    /**
     * Create a simple fallback dialog when UITheme fails
     */
    createSimpleFallbackDialog(dialogData) {
        console.log('DialogScene: Creating simple fallback dialog for:', dialogData.speaker);
        
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Main dialog container
        this.dialogContainer = this.add.container(centerX, centerY);

        // Simple background
        const dialogBg = this.add.graphics();
        dialogBg.fillStyle(0x000000, 0.8);
        dialogBg.fillRoundedRect(-300, -100, 600, 200, 10);
        dialogBg.lineStyle(2, 0xffffff, 1);
        dialogBg.strokeRoundedRect(-300, -100, 600, 200, 10);
        this.dialogContainer.add(dialogBg);

        // Character name
        const nameText = this.add.text(0, -70, dialogData.speaker, {
            fontSize: '24px',
            fill: '#ffffff',
            fontWeight: 'bold'
        });
        nameText.setOrigin(0.5);
        this.dialogContainer.add(nameText);

        // Dialog text
        const dialogText = this.add.text(0, -20, dialogData.text || 'Hello!', {
            fontSize: '16px',
            fill: '#ffffff',
            wordWrap: { width: 500 },
            align: 'center'
        });
        dialogText.setOrigin(0.5);
        this.dialogContainer.add(dialogText);

        // Close button
        const closeButton = this.add.text(280, -80, '✕', {
            fontSize: '20px',
            fill: '#ff4444',
            fontWeight: 'bold'
        });
        closeButton.setOrigin(0.5);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.on('pointerdown', () => this.closeDialog());
        this.dialogContainer.add(closeButton);

        // Continue button
        const continueButton = this.add.text(0, 60, 'Continue', {
            fontSize: '18px',
            fill: '#44ff44',
            fontWeight: 'bold'
        });
        continueButton.setOrigin(0.5);
        continueButton.setInteractive({ useHandCursor: true });
        continueButton.on('pointerdown', () => this.closeDialog());
        this.dialogContainer.add(continueButton);

        // Simple fade in
        this.dialogContainer.setAlpha(0);
        this.tweens.add({
            targets: this.dialogContainer,
            alpha: 1,
            duration: 300
        });
    }
} 