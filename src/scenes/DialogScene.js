import Phaser from 'phaser';
import MarkdownDialogParser from '../scripts/MarkdownDialogParser.js';

export default class DialogScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DialogScene' });
        this.dialogManager = null;
        this.currentNPCId = null;
        this.callingScene = null;
        this.dialogData = null;
        this.currentSection = null;
        this.parser = new MarkdownDialogParser();
        
        // UI elements
        this.dialogContainer = null;
        this.portraitImage = null;
        this.dialogText = null;
        this.choiceButtons = [];
        this.romanceMeter = null;
        this.romanceText = null;
    }

    init(data) {
        try {
            console.log('DialogScene: INIT called with data:', data);
            
            // Validate input data
            if (!data || typeof data !== 'object') {
                console.warn('DialogScene: Invalid or missing data, using defaults');
                data = {};
            }
            
            this.callingScene = data?.callingScene || 'CabinScene';
            this.currentNPCId = data?.npcId || null;
            this.dialogManager = data?.dialogManager || null;
            this.scriptFile = data?.script || 'mia_romance.md';
            
            // Validate critical data
            if (!this.currentNPCId) {
                console.warn('DialogScene: No NPC ID provided, defaulting to mia');
                this.currentNPCId = 'mia';
            }
            
            if (!this.dialogManager) {
                console.warn('DialogScene: No DialogManager provided, will create fallback');
            }
            
            console.log('DialogScene: Initialized with:', {
                callingScene: this.callingScene,
                npcId: this.currentNPCId,
                scriptFile: this.scriptFile,
                hasDialogManager: !!this.dialogManager
            });
        } catch (error) {
            console.error('DialogScene: Error in init method:', error);
            // Set safe defaults
            this.callingScene = 'CabinScene';
            this.currentNPCId = 'mia';
            this.dialogManager = null;
            this.scriptFile = 'mia_romance.md';
        }
    }

    async create() {
        console.log('DialogScene: CREATE called');
        
        try {
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;
            
            console.log('DialogScene: Camera dimensions:', { width, height });
            
            // Force scene to top
            this.scene.bringToTop();
            
            // Load dialog content first
            await this.loadDialogContent();
            
            // Create UI
            this.createDialogInterface(width, height);
            
            // Start dialog
            this.startDialog();
            
            console.log('DialogScene: Dialog interface created successfully');
            
        } catch (error) {
            console.error('DialogScene: Error in create:', error);
            console.error('DialogScene: Error stack:', error.stack);
            this.createErrorFallback(error);
        }
    }
    
    async loadDialogContent() {
        console.log('DialogScene: Loading dialog content for', this.currentNPCId, 'with script', this.scriptFile);
        
        try {
            if (this.scriptFile && this.scriptFile.endsWith('.md')) {
                // Load markdown file
                this.dialogData = await this.parser.loadAndParseFile(this.scriptFile, this.currentNPCId);
                console.log('DialogScene: Loaded markdown dialog data:', this.dialogData);
            } else if (this.scriptFile && this.scriptFile.endsWith('.json')) {
                // Load JSON dialog file
                this.dialogData = await this.loadJSONDialogFile(this.scriptFile);
                console.log('DialogScene: Loaded JSON dialog data:', this.dialogData);
            } else if (typeof this.scriptFile === 'object') {
                // Direct JSON dialog data passed
                this.dialogData = this.processJSONDialogData(this.scriptFile);
                console.log('DialogScene: Using direct JSON dialog data:', this.dialogData);
            } else {
                // Fallback to basic dialog
                this.dialogData = this.createFallbackDialogData();
                console.log('DialogScene: Using fallback dialog data');
            }
        } catch (error) {
            console.error('DialogScene: Error loading dialog content:', error);
            this.dialogData = this.createFallbackDialogData();
        }
    }
    
    /**
     * Load JSON dialog file from assets
     * @param {string} filename - JSON file name
     * @returns {Object} Processed dialog data
     */
    async loadJSONDialogFile(filename) {
        const possiblePaths = [
            `assets/dialog/${filename}`,
            `./assets/dialog/${filename}`,
            `/assets/dialog/${filename}`,
            `public/assets/dialog/${filename}`,
            `./public/assets/dialog/${filename}`,
            `/public/assets/dialog/${filename}`,
            filename // Direct path
        ];
        
        for (const path of possiblePaths) {
            try {
                console.log(`DialogScene: Attempting to load JSON from: ${path}`);
                const response = await fetch(path);
                
                if (response.ok) {
                    const jsonData = await response.json();
                    console.log(`DialogScene: Successfully loaded JSON from: ${path}`);
                    return this.processJSONDialogData(jsonData);
                }
            } catch (error) {
                console.warn(`DialogScene: Failed to load from ${path}:`, error.message);
                continue;
            }
        }
        
        throw new Error(`Could not load JSON dialog file: ${filename}`);
    }
    
    /**
     * Process JSON dialog data into DialogScene format
     * @param {Object} jsonData - Raw JSON dialog data
     * @returns {Object} Processed dialog data
     */
    processJSONDialogData(jsonData) {
        // Handle different JSON dialog formats
        let dialogData = jsonData;
        
        // If it's a dialog collection, find the specific dialog for this NPC
        if (jsonData.dialogSamples || jsonData.dialogs) {
            const dialogs = jsonData.dialogSamples || jsonData.dialogs;
            
            // Look for NPC-specific dialogs
            if (dialogs.romanticNPCDialogs && dialogs.romanticNPCDialogs[this.currentNPCId]) {
                // Find the first available dialog for this NPC
                const npcDialogs = dialogs.romanticNPCDialogs[this.currentNPCId];
                const dialogKeys = Object.keys(npcDialogs);
                if (dialogKeys.length > 0) {
                    dialogData = npcDialogs[dialogKeys[0]]; // Use first dialog
                }
            } else if (dialogs.storyDialogs) {
                // Use first story dialog as fallback
                const storyKeys = Object.keys(dialogs.storyDialogs);
                if (storyKeys.length > 0) {
                    dialogData = dialogs.storyDialogs[storyKeys[0]];
                }
            }
        }
        
        // Convert JSON dialog format to DialogScene format
        return {
            id: dialogData.id || 'json_dialog',
            speaker: dialogData.speaker || this.dialogManager?.getNPC(this.currentNPCId)?.name || 'NPC',
            text: dialogData.text || 'Hello! How can I help you today?',
            choices: this.processJSONChoices(dialogData.choices || []),
            effects: this.processJSONEffects(dialogData.effects || {}),
            type: dialogData.type || 'conversation',
            title: dialogData.title || 'Dialog'
        };
    }
    
    /**
     * Process JSON choices into DialogScene format
     * @param {Array} choices - Array of choice objects
     * @returns {Array} Processed choices
     */
    processJSONChoices(choices) {
        return choices.map(choice => ({
            id: choice.id || 'choice',
            text: choice.text || 'Continue...',
            effects: this.processJSONEffects(choice.effects || {}),
            target: choice.target || null,
            romanceChange: choice.effects?.romance ? Object.values(choice.effects.romance)[0] : 0,
            action: choice.action || null
        }));
    }
    
    /**
     * Process JSON effects into DialogScene format
     * @param {Object} effects - Effects object
     * @returns {Array} Array of effect objects
     */
    processJSONEffects(effects) {
        const processedEffects = [];
        
        // Handle romance effects
        if (effects.romance) {
            for (const [npcId, amount] of Object.entries(effects.romance)) {
                processedEffects.push({
                    command: 'romance_meter_increase',
                    params: { npc: npcId, amount: amount }
                });
            }
        }
        
        // Handle quest effects
        if (effects.questProgress) {
            processedEffects.push({
                command: 'quest_progress',
                params: { questId: effects.questProgress }
            });
        }
        
        if (effects.unlockQuest) {
            processedEffects.push({
                command: 'unlock_quest',
                params: { questId: effects.unlockQuest }
            });
        }
        
        // Handle experience and coins
        if (effects.experience) {
            processedEffects.push({
                command: 'add_experience',
                params: { amount: effects.experience }
            });
        }
        
        if (effects.coins) {
            processedEffects.push({
                command: 'add_coins',
                params: { amount: effects.coins }
            });
        }
        
        // Handle items
        if (effects.items) {
            for (const [itemId, quantity] of Object.entries(effects.items)) {
                processedEffects.push({
                    command: 'add_item',
                    params: { itemId: itemId, quantity: quantity }
                });
            }
        }
        
        // Handle UI effects
        if (effects.openUI) {
            processedEffects.push({
                command: 'open_ui',
                params: { uiType: effects.openUI }
            });
        }
        
        if (effects.closeDialog) {
            processedEffects.push({
                command: 'dialog_end'
            });
        }
        
        return processedEffects;
    }
    
    createDialogInterface(width, height) {
        // Dark background
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        bg.fillRect(0, 0, width, height);
        bg.setDepth(1000);
        bg.setInteractive();
        bg.on('pointerdown', () => this.closeDialog());
        
        // Main dialog container
        this.dialogContainer = this.add.container(width/2, height/2);
        this.dialogContainer.setDepth(1001);
        
        // Dialog box
        const dialogWidth = Math.min(900, width - 100);
        const dialogHeight = Math.min(500, height - 100);
        
        const dialogBg = this.add.graphics();
        dialogBg.fillStyle(0x2c3e50, 0.95);
        dialogBg.lineStyle(3, 0xf39c12, 1);
        dialogBg.fillRoundedRect(-dialogWidth/2, -dialogHeight/2, dialogWidth, dialogHeight, 15);
        dialogBg.strokeRoundedRect(-dialogWidth/2, -dialogHeight/2, dialogWidth, dialogHeight, 15);
        this.dialogContainer.add(dialogBg);
        
        // Title bar
        const npcName = this.dialogManager?.getNPC(this.currentNPCId)?.name || 'Dialog System';
        const titleText = this.add.text(-dialogWidth/2 + 20, -dialogHeight/2 + 20, `💬 ${npcName}`, {
            fontSize: '20px',
            fill: '#f39c12',
            fontWeight: 'bold'
        });
        this.dialogContainer.add(titleText);
        
        // Close button
        const closeBtn = this.add.text(dialogWidth/2 - 30, -dialogHeight/2 + 20, '×', {
            fontSize: '24px',
            fill: '#e74c3c',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        closeBtn.setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.closeDialog());
        this.dialogContainer.add(closeBtn);
        
        // Create portrait area
        this.createPortraitArea(-dialogWidth/2 + 20, -dialogHeight/2 + 60);
        
        // Create dialog text area
        this.createDialogTextArea(-dialogWidth/2 + 140, -dialogHeight/2 + 60, dialogWidth - 180, 200);
        
        // Create choice area
        this.createChoiceArea(-dialogWidth/2 + 140, -dialogHeight/2 + 280, dialogWidth - 180);
        
        // Create romance meter
        this.createRomanceMeterDisplay(-dialogWidth/2 + 140, -dialogHeight/2 + 400, 200);
    }
    
    createPortraitArea(x, y) {
        // Portrait background
        const portraitBg = this.add.graphics();
        portraitBg.fillStyle(0x34495e, 0.8);
        portraitBg.lineStyle(2, 0xf39c12, 0.8);
        portraitBg.fillRoundedRect(x, y, 100, 120, 10);
        portraitBg.strokeRoundedRect(x, y, 100, 120, 10);
        this.dialogContainer.add(portraitBg);
        
        // Try to load Mia's portrait
        const portraitKeys = [
            'mia-portrait', 
            'mia-normal', 
            'mia-happy',
            'mia-excited',
            'mia-shy'
        ];
        
        let portraitAdded = false;
        
        for (const key of portraitKeys) {
            if (this.textures.exists(key)) {
                try {
                    this.portraitImage = this.add.image(x + 50, y + 60, key);
                    this.portraitImage.setDisplaySize(90, 110);
                    this.portraitImage.setOrigin(0.5);
                    this.dialogContainer.add(this.portraitImage);
                    portraitAdded = true;
                    break;
                } catch (error) {
                    // Silently continue to next portrait key
                    continue;
                }
            }
        }
        
        // Fallback portrait
        if (!portraitAdded) {
            const fallbackPortrait = this.add.text(x + 50, y + 60, '💃\nMIA', {
                fontSize: '16px',
                fill: '#f39c12',
                fontWeight: 'bold',
                align: 'center'
            }).setOrigin(0.5);
            this.dialogContainer.add(fallbackPortrait);
        }
    }
    
    createDialogTextArea(x, y, width, height) {
        // Text background
        const textBg = this.add.graphics();
        textBg.fillStyle(0x34495e, 0.6);
        textBg.fillRoundedRect(x, y, width, height, 8);
        this.dialogContainer.add(textBg);
        
        // Dialog text
        this.dialogText = this.add.text(x + 15, y + 15, '', {
            fontSize: '16px',
            fill: '#ecf0f1',
            wordWrap: { width: width - 30 },
            lineSpacing: 5
        });
        this.dialogContainer.add(this.dialogText);
    }
    
    createChoiceArea(x, y, width) {
        // This will be populated dynamically with choices
        this.choiceAreaX = x;
        this.choiceAreaY = y;
        this.choiceAreaWidth = width;
    }
    
    createRomanceMeterDisplay(x, y, width) {
        if (!this.dialogManager || !this.currentNPCId) return;
        
        const npc = this.dialogManager.getNPC(this.currentNPCId);
        if (!npc) return;
        
        // Romance meter background
        const meterBg = this.add.graphics();
        meterBg.fillStyle(0x34495e, 0.8);
        meterBg.fillRoundedRect(x, y, width, 20, 10);
        this.dialogContainer.add(meterBg);
        
        // Romance meter fill
        const fillPercent = npc.romanceMeter / npc.maxRomance;
        const fillWidth = fillPercent * (width - 4);
        
        let fillColor = 0x95a5a6;
        if (fillPercent >= 0.8) fillColor = 0xe74c3c;
        else if (fillPercent >= 0.6) fillColor = 0xe67e22;
        else if (fillPercent >= 0.4) fillColor = 0xf39c12;
        else if (fillPercent >= 0.2) fillColor = 0x27ae60;
        
        this.romanceMeter = this.add.graphics();
        this.romanceMeter.fillStyle(fillColor, 1);
        this.romanceMeter.fillRoundedRect(x + 2, y + 2, fillWidth, 16, 8);
        this.dialogContainer.add(this.romanceMeter);
        
        // Romance meter text
        this.romanceText = this.add.text(x + width/2, y + 30, `💕 Romance: ${npc.romanceMeter}/${npc.maxRomance} (${npc.relationship})`, {
            fontSize: '12px',
            fill: '#f39c12',
            fontWeight: 'bold'
        }).setOrigin(0.5, 0);
        this.dialogContainer.add(this.romanceText);
    }
    
    startDialog() {
        if (!this.dialogData) {
            console.error('DialogScene: No dialog data available');
            return;
        }
        
        console.log('DialogScene: Starting dialog with data:', this.dialogData);
        
        // The parser returns a single dialog object with sections array
        // Start with the main dialog data (which represents the START section)
        this.currentSection = this.dialogData;
        this.displayCurrentSection();
    }
    
    displayCurrentSection() {
        if (!this.currentSection) {
            console.error('DialogScene: No current section to display');
            return;
        }
        
        console.log('DialogScene: Displaying section:', this.currentSection);
        
        // Update dialog text
        const speaker = this.currentSection.speaker || this.dialogManager?.getNPC(this.currentNPCId)?.name || 'Mia';
        const text = this.currentSection.text || this.currentSection.message || 'Hello! How are you today?';
        
        this.dialogText.setText(`${speaker}:\n\n"${text}"`);
        
        // Clear previous choices
        this.clearChoices();
        
        // Apply any effects from the current section BEFORE creating choices
        if (this.currentSection.effects && this.currentSection.effects.length > 0) {
            console.log('DialogScene: Applying section effects:', this.currentSection.effects);
            this.applyEffects(this.currentSection.effects);
        }
        
        // Create choice buttons
        if (this.currentSection.choices && this.currentSection.choices.length > 0) {
            this.createChoiceButtons(this.currentSection.choices);
        } else {
            // Create default close button if no choices
            this.createChoiceButtons([{
                text: "Continue...",
                action: () => this.closeDialog()
            }]);
        }
    }
    
    clearChoices() {
        this.choiceButtons.forEach(button => {
            if (button.container) {
                button.container.destroy();
            }
        });
        this.choiceButtons = [];
    }
    
    createChoiceButtons(choices) {
        choices.forEach((choice, index) => {
            const buttonY = this.choiceAreaY + (index * 35);
            
            // Button container
            const buttonContainer = this.add.container(this.choiceAreaX, buttonY);
            this.dialogContainer.add(buttonContainer);
            
            // Button background
            const button = this.add.graphics();
            button.fillStyle(0x3498db, 0.8);
            button.lineStyle(2, 0x2980b9, 1);
            button.fillRoundedRect(0, 0, this.choiceAreaWidth - 20, 30, 5);
            button.strokeRoundedRect(0, 0, this.choiceAreaWidth - 20, 30, 5);
            button.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.choiceAreaWidth - 20, 30), Phaser.Geom.Rectangle.Contains);
            buttonContainer.add(button);
            
            // Button text
            const buttonText = this.add.text(10, 15, choice.text, {
                fontSize: '14px',
                fill: '#ffffff',
                fontWeight: 'bold'
            }).setOrigin(0, 0.5);
            buttonContainer.add(buttonText);
            
            // Button interaction
            button.on('pointerdown', () => {
                if (choice.action) {
                    choice.action();
                } else if (choice.target) {
                    this.handleChoiceTarget(choice.target);
                } else {
                    this.makeChoice(choice.id || 'default', choice);
                }
            });
            
            // Hover effects
            button.on('pointerover', () => {
                button.clear();
                button.fillStyle(0x3498db, 1);
                button.lineStyle(2, 0x2980b9, 1);
                button.fillRoundedRect(0, 0, this.choiceAreaWidth - 20, 30, 5);
                button.strokeRoundedRect(0, 0, this.choiceAreaWidth - 20, 30, 5);
            });
            
            button.on('pointerout', () => {
                button.clear();
                button.fillStyle(0x3498db, 0.8);
                button.lineStyle(2, 0x2980b9, 1);
                button.fillRoundedRect(0, 0, this.choiceAreaWidth - 20, 30, 5);
                button.strokeRoundedRect(0, 0, this.choiceAreaWidth - 20, 30, 5);
            });
            
            this.choiceButtons.push({
                container: buttonContainer,
                choice: choice
            });
        });
    }
    
    handleChoiceTarget(target) {
        console.log('DialogScene: Handling choice target:', target);
        
        // Find the target section in dialog data
        if (this.dialogData.sections) {
            const targetSection = this.dialogData.sections.find(section => 
                section.label === target || section.id === target
            );
            
            if (targetSection) {
                // Convert section to dialog format
                this.currentSection = {
                    speaker: targetSection.speaker || this.dialogData.speaker,
                    text: targetSection.text,
                    choices: targetSection.choices || [],
                    effects: targetSection.effects || []
                };
                this.displayCurrentSection();
                return;
            }
        }
        
        // If target not found, provide a graceful fallback
        console.log('DialogScene: Target section not found, providing fallback response');
        this.currentSection = {
            speaker: this.dialogData.speaker || 'Mia',
            text: "That's interesting! Let's continue our conversation.",
            choices: [{
                text: "Continue...",
                action: () => this.closeDialog()
            }],
            effects: []
        };
        this.displayCurrentSection();
    }
    
    makeChoice(choiceId, choiceData) {
        console.log('DialogScene: Choice made:', choiceId, choiceData);
        
        // Apply romance changes based on choice data first
        if (choiceData.romanceChange) {
            this.updateRomanceMeter(choiceData.romanceChange);
        }
        
        // Apply effects if the choice has them
        if (choiceData.effects) {
            if (Array.isArray(choiceData.effects)) {
                this.applyEffects(choiceData.effects);
            } else if (choiceData.effects.romanceIncrease) {
                this.updateRomanceMeter(choiceData.effects.romanceIncrease);
            }
        }
        
        // Default romance increases for different choice types (fallback)
        let romanceChange = 0;
        if (choiceId.includes('romantic') || choiceData.text.toLowerCase().includes('romantic')) {
            romanceChange = 3;
        } else if (choiceId.includes('compliment') || choiceData.text.toLowerCase().includes('beautiful')) {
            romanceChange = 2;
        } else {
            romanceChange = 1;
        }
        
        // Only apply default romance change if no specific effects were applied
        if (!choiceData.romanceChange && !choiceData.effects?.romanceIncrease) {
            this.updateRomanceMeter(romanceChange);
        }
        
        // Close dialog after choice (for now) - unless it's a continuing conversation
        if (!choiceData.effects?.followUpChoices) {
            this.time.delayedCall(500, () => this.closeDialog());
        }
    }
    
    updateRomanceMeter(amount) {
        try {
            if (!this.dialogManager || !this.currentNPCId) {
                console.warn('DialogScene: Cannot update romance meter - missing DialogManager or NPC ID');
                return;
            }
            
            console.log(`DialogScene: Updating romance meter for ${this.currentNPCId} by ${amount}`);
            
            // Get current NPC data before update
            const npc = this.dialogManager.getNPC(this.currentNPCId);
            if (!npc) {
                console.warn(`DialogScene: NPC ${this.currentNPCId} not found`);
                return;
            }
            
            const oldMeter = npc.romanceMeter;
            
            // Update romance meter through DialogManager
            this.dialogManager.updateRomanceMeter({
                npc: this.currentNPCId,
                amount: amount
            });
            
            // Get updated NPC data
            const updatedNpc = this.dialogManager.getNPC(this.currentNPCId);
            const newMeter = updatedNpc.romanceMeter;
            
            console.log(`DialogScene: Romance meter updated from ${oldMeter} to ${newMeter}`);
            
            // Update visual romance meter in dialog interface
            if (this.romanceMeter) {
                const fillPercent = newMeter / updatedNpc.maxRomance;
                const fillWidth = fillPercent * 196; // width - 4
                
                let fillColor = 0x95a5a6;
                if (fillPercent >= 0.8) fillColor = 0xe74c3c;
                else if (fillPercent >= 0.6) fillColor = 0xe67e22;
                else if (fillPercent >= 0.4) fillColor = 0xf39c12;
                else if (fillPercent >= 0.2) fillColor = 0x3498db;
                
                this.romanceMeter.clear();
                this.romanceMeter.fillStyle(0x34495e, 0.8);
                this.romanceMeter.fillRoundedRect(0, 0, 200, 20, 10);
                this.romanceMeter.fillStyle(fillColor, 1);
                this.romanceMeter.fillRoundedRect(2, 2, fillWidth, 16, 8);
                
                console.log(`DialogScene: Visual romance meter updated - ${fillPercent * 100}% (${newMeter}/${updatedNpc.maxRomance})`);
            }
            
            // Also update the romance text if it exists
            if (this.romanceText) {
                this.romanceText.setText(`💕 Romance: ${newMeter}/${updatedNpc.maxRomance} (${updatedNpc.relationship})`);
            }
            
            // Emit event to notify CabinScene
            this.events.emit('romance-meter-updated', {
                npcId: this.currentNPCId,
                oldValue: oldMeter,
                newValue: newMeter,
                maxValue: updatedNpc.maxRomance
            });
            
            // Also emit to calling scene directly
            const callingScene = this.scene.get(this.callingScene);
            if (callingScene && callingScene.events) {
                callingScene.events.emit('romance-meter-updated', {
                    npcId: this.currentNPCId,
                    oldValue: oldMeter,
                    newValue: newMeter,
                    maxValue: updatedNpc.maxRomance
                });
            }
            
            console.log(`DialogScene: Romance meter update completed for ${this.currentNPCId}`);
        } catch (error) {
            console.error('DialogScene: Error updating romance meter:', error);
            console.error('DialogScene: Romance meter amount:', amount);
        }
    }
    
    applyEffects(effects) {
        effects.forEach(effect => {
            console.log('DialogScene: Applying effect:', effect);
            
            switch (effect.command) {
                case 'romance_meter_increase':
                    const amount = effect.params?.amount || 5;
                    const npcId = effect.params?.npc || this.currentNPCId;
                    console.log(`DialogScene: Increasing romance meter for ${npcId} by ${amount}`);
                    this.updateRomanceMeter(amount);
                    break;
                    
                case 'achievement_unlock':
                    if (this.dialogManager && effect.params?.achievement) {
                        console.log('DialogScene: Unlocking achievement:', effect.params.achievement);
                        this.dialogManager.unlockAchievement(effect.params.achievement);
                    }
                    break;
                    
                case 'quest_progress':
                    if (this.dialogManager && effect.params?.questId) {
                        console.log('DialogScene: Progressing quest:', effect.params.questId);
                        // Emit quest progress event to GameScene
                        const gameScene = this.scene.get('GameScene');
                        if (gameScene && gameScene.questManager) {
                            gameScene.questManager.progressQuest(effect.params.questId);
                        }
                    }
                    break;
                    
                case 'unlock_quest':
                    if (this.dialogManager && effect.params?.questId) {
                        console.log('DialogScene: Unlocking quest:', effect.params.questId);
                        const gameScene = this.scene.get('GameScene');
                        if (gameScene && gameScene.questManager) {
                            gameScene.questManager.unlockQuest(effect.params.questId);
                        }
                    }
                    break;
                    
                case 'add_experience':
                    if (effect.params?.amount) {
                        console.log('DialogScene: Adding experience:', effect.params.amount);
                        const gameScene = this.scene.get('GameScene');
                        if (gameScene && gameScene.gameState) {
                            gameScene.gameState.addExperience(effect.params.amount);
                        }
                    }
                    break;
                    
                case 'add_coins':
                    if (effect.params?.amount) {
                        console.log('DialogScene: Adding coins:', effect.params.amount);
                        const gameScene = this.scene.get('GameScene');
                        if (gameScene && gameScene.gameState) {
                            gameScene.gameState.addCoins(effect.params.amount);
                        }
                    }
                    break;
                    
                case 'add_item':
                    if (effect.params?.itemId) {
                        const quantity = effect.params.quantity || 1;
                        console.log(`DialogScene: Adding item ${effect.params.itemId} x${quantity}`);
                        const gameScene = this.scene.get('GameScene');
                        if (gameScene && gameScene.gameState) {
                            gameScene.gameState.addInventoryItem(effect.params.itemId, quantity);
                        }
                    }
                    break;
                    
                case 'open_ui':
                    if (effect.params?.uiType) {
                        console.log('DialogScene: Opening UI:', effect.params.uiType);
                        // Close dialog first, then open UI
                        this.time.delayedCall(500, () => {
                            this.closeDialog();
                            // Emit event to calling scene to open specific UI
                            const callingScene = this.scene.get(this.callingScene);
                            if (callingScene && callingScene.events) {
                                callingScene.events.emit('open-ui', { uiType: effect.params.uiType });
                            }
                        });
                    }
                    break;
                    
                case 'dialog_end':
                    console.log('DialogScene: Dialog end effect triggered');
                    this.time.delayedCall(1000, () => this.closeDialog());
                    break;
                    
                default:
                    console.log('DialogScene: Unknown effect command:', effect.command);
            }
        });
    }
    
    createFallbackDialogData() {
        const npcName = this.dialogManager?.getNPC(this.currentNPCId)?.name || 'Mia';
        
        return {
            speaker: npcName,
            text: "Hello! It's so nice to spend some quiet time together. How are you feeling today?",
            choices: [
                { text: "💬 Chat casually", action: () => this.makeChoice('casual') },
                { text: "💕 Say something romantic", action: () => this.makeChoice('romantic') },
                { text: "🎁 Give compliment", action: () => this.makeChoice('compliment') }
            ]
        };
    }
    
    createErrorFallback(error) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        this.add.text(width/2, height/2, 
            `Dialog Error: ${error.message}\n\nClick anywhere to close.`, {
            fontSize: '16px',
            fill: '#e74c3c',
            align: 'center'
        }).setOrigin(0.5).setDepth(1000);
        
        this.input.on('pointerdown', () => this.closeDialog());
    }
    
    closeDialog() {
        try {
            console.log('DialogScene: Closing dialog');
            
            // Store final romance meter data before closing
            let finalRomanceData = null;
            if (this.dialogManager && this.currentNPCId) {
                const npc = this.dialogManager.getNPC(this.currentNPCId);
                if (npc) {
                    finalRomanceData = {
                        npcId: this.currentNPCId,
                        newValue: npc.romanceMeter,
                        maxValue: npc.maxRomance,
                        relationship: npc.relationship
                    };
                    console.log('DialogScene: Final romance data:', finalRomanceData);
                }
            }
            
            // Get calling scene reference before stopping
            const callingSceneRef = this.scene.get(this.callingScene);
            
            // Emit events BEFORE stopping the scene to avoid timer issues
            if (finalRomanceData && callingSceneRef) {
                try {
                    if (callingSceneRef.events && typeof callingSceneRef.events.emit === 'function') {
                        console.log('DialogScene: Emitting romance meter update to calling scene');
                        callingSceneRef.events.emit('romance-meter-updated', finalRomanceData);
                        
                        // Also emit dialog-ended event
                        callingSceneRef.events.emit('dialog-ended', {
                            npcId: finalRomanceData.npcId,
                            romanceMeter: finalRomanceData.newValue,
                            relationship: finalRomanceData.relationship
                        });
                    }
                    
                    // Call the onRomanceMeterUpdated method directly as a fallback
                    if (callingSceneRef.onRomanceMeterUpdated && typeof callingSceneRef.onRomanceMeterUpdated === 'function') {
                        console.log('DialogScene: Calling onRomanceMeterUpdated directly');
                        callingSceneRef.onRomanceMeterUpdated(finalRomanceData);
                    }
                } catch (emitError) {
                    console.warn('DialogScene: Error emitting events to calling scene:', emitError);
                }
            }
            
            // Stop this scene first
            if (this.scene && typeof this.scene.stop === 'function') {
                this.scene.stop();
            }
            
            // Resume calling scene
            if (this.callingScene && this.scene && typeof this.scene.resume === 'function') {
                try {
                    this.scene.resume(this.callingScene);
                    console.log('DialogScene: Successfully resumed', this.callingScene);
                } catch (resumeError) {
                    console.warn('DialogScene: Could not resume calling scene:', resumeError);
                    // Try alternative method
                    if (callingSceneRef && callingSceneRef.scene && callingSceneRef.scene.resume) {
                        callingSceneRef.scene.resume();
                    }
                }
            }
            
            console.log('DialogScene: Dialog closed successfully');
        } catch (error) {
            console.error('DialogScene: Error closing dialog:', error);
            // Force close anyway
            try {
                this.scene.stop();
            } catch (stopError) {
                console.error('DialogScene: Could not stop scene:', stopError);
            }
        }
    }
}
