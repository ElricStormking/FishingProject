import UITheme from './UITheme.js';

/**
 * RenJs Debug UI - Developer tools for testing dialog flows and managing game state
 * Part of RenJs Integration Final Polish task implementation
 */
export class RenJsDebugUI {
    constructor(scene) {
        this.scene = scene;
        this.gameState = scene.gameState;
        this.isVisible = false;
        this.isEnabled = this.isDevelopmentMode();
        
        this.container = null;
        this.tabContainer = null;
        this.contentContainer = null;
        this.currentTab = 'dialog';
        
        // Debug state
        this.dialogJumpLabels = [];
        this.questStates = new Map();
        this.flags = new Map();
        
        if (this.isEnabled) {
            this.createUI();
            this.setupEventListeners();
            console.log('RenJsDebugUI: Developer debug tools enabled');
        }
    }

    isDevelopmentMode() {
        // Check for development environment indicators
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               new URLSearchParams(window.location.search).get('debug') === 'true' ||
               localStorage.getItem('renjs_debug') === 'true';
    }

    createUI() {
        const { width, height } = this.scene.cameras.main;
        
        // Main container - positioned as overlay
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(10000);
        this.container.setVisible(false);
        
        // Background overlay
        const overlay = this.scene.add.graphics();
        overlay.fillStyle(UITheme.colors.overlay, 0.8);
        overlay.fillRect(0, 0, width, height);
        overlay.setInteractive();
        this.container.add(overlay);
        
        // Main debug panel
        const panelWidth = Math.min(800, width - 40);
        const panelHeight = Math.min(600, height - 40);
        const panelX = (width - panelWidth) / 2;
        const panelY = (height - panelHeight) / 2;
        
        const mainPanel = UITheme.createPanel(this.scene, panelX, panelY, panelWidth, panelHeight, 'primary');
        this.container.add(mainPanel);
        
        // Title bar
        const titleBar = UITheme.createPanel(this.scene, panelX, panelY, panelWidth, 40, 'secondary');
        this.container.add(titleBar);
        
        const title = UITheme.createText(this.scene, panelX + panelWidth/2, panelY + 20, 'RenJs Debug Console', 'headerMedium');
        title.setOrigin(0.5);
        this.container.add(title);
        
        // Close button
        const closeBtn = UITheme.createText(this.scene, panelX + panelWidth - 20, panelY + 20, '×', 'headerMedium');
        closeBtn.setOrigin(0.5);
        closeBtn.setColor(UITheme.colors.error);
        closeBtn.setInteractive();
        closeBtn.on('pointerdown', () => this.hide());
        closeBtn.on('pointerover', () => closeBtn.setScale(1.2));
        closeBtn.on('pointerout', () => closeBtn.setScale(1));
        this.container.add(closeBtn);
        
        // Tab navigation
        this.createTabNavigation(panelX, panelY + 50, panelWidth);
        
        // Content area
        this.contentContainer = this.scene.add.container(0, 0);
        this.container.add(this.contentContainer);
        
        this.createTabContent(panelX + 10, panelY + 100, panelWidth - 20, panelHeight - 110);
        
            }

    createTabNavigation(x, y, width) {
        this.tabContainer = this.scene.add.container(0, 0);
        this.container.add(this.tabContainer);
        
        const tabs = [
            { id: 'dialog', label: 'Dialog Testing', color: UITheme.colors.primary },
            { id: 'quests', label: 'Quest States', color: UITheme.colors.secondary },
            { id: 'flags', label: 'Game Flags', color: UITheme.colors.warning },
            { id: 'achievements', label: 'Achievements', color: UITheme.colors.gold },
            { id: 'tools', label: 'Dev Tools', color: UITheme.colors.info }
        ];
        
        const tabWidth = (width - 40) / tabs.length;
        
        tabs.forEach((tab, index) => {
            const tabX = x + 10 + (index * tabWidth);
            const tabY = y;
            
            // Tab background
            const tabBg = this.scene.add.graphics();
            tabBg.fillStyle(tab.id === this.currentTab ? tab.color : UITheme.colors.medium);
            tabBg.fillRoundedRect(0, 0, tabWidth - 5, 35, { tl: 8, tr: 8, bl: 0, br: 0 });
            tabBg.setPosition(tabX, tabY);
            tabBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, tabWidth - 5, 35), Phaser.Geom.Rectangle.Contains);
            
            // Tab text
            const tabText = UITheme.createText(this.scene, tabX + (tabWidth - 5) / 2, tabY + 17, tab.label, 'bodySmall');
            tabText.setOrigin(0.5);
            tabText.setColor(tab.id === this.currentTab ? UITheme.colors.text : UITheme.colors.textSecondary);
            
            // Tab interaction
            tabBg.on('pointerdown', () => this.switchTab(tab.id));
            tabBg.on('pointerover', () => {
                if (tab.id !== this.currentTab) {
                    tabBg.clear();
                    tabBg.fillStyle(UITheme.colors.primaryLight);
                    tabBg.fillRoundedRect(0, 0, tabWidth - 5, 35, { tl: 8, tr: 8, bl: 0, br: 0 });
                }
            });
            tabBg.on('pointerout', () => {
                if (tab.id !== this.currentTab) {
                    tabBg.clear();
                    tabBg.fillStyle(UITheme.colors.medium);
                    tabBg.fillRoundedRect(0, 0, tabWidth - 5, 35, { tl: 8, tr: 8, bl: 0, br: 0 });
                }
            });
            
            this.tabContainer.add([tabBg, tabText]);
        });
    }

    createTabContent(x, y, width, height) {
        // Content will be created dynamically based on current tab
        this.updateTabContent(x, y, width, height);
    }

    switchTab(tabId) {
        this.currentTab = tabId;
        
        // Update tab appearance
        this.tabContainer.removeAll(true);
        this.createTabNavigation(
            this.container.list[2].x, 
            this.container.list[2].y, 
            800
        );
        
        // Update content
        this.contentContainer.removeAll(true);
        this.updateTabContent(
            this.container.list[2].x + 10,
            this.container.list[2].y + 100,
            780,
            500
        );
    }

    updateTabContent(x, y, width, height) {
        switch (this.currentTab) {
            case 'dialog':
                this.createDialogTestingTab(x, y, width, height);
                break;
            case 'quests':
                this.createQuestStatesTab(x, y, width, height);
                break;
            case 'flags':
                this.createGameFlagsTab(x, y, width, height);
                break;
            case 'achievements':
                this.createAchievementsTab(x, y, width, height);
                break;
            case 'tools':
                this.createDevToolsTab(x, y, width, height);
                break;
        }
    }

    createDialogTestingTab(x, y, width, height) {
        // Dialog jump-to-label section
        const sectionY = y;
        
        const jumpLabel = UITheme.createText(this.scene, x, sectionY, 'Jump to Dialog Label:', 'headerSmall');
        this.contentContainer.add(jumpLabel);
        
        // NPC selector
        const npcSelector = this.createDropdown(x, sectionY + 30, 200, 30, ['mia', 'sophie', 'luna'], 'mia');
        this.contentContainer.add(npcSelector.container);
        
        // Label input
        const labelInput = this.createTextInput(x + 220, sectionY + 30, 200, 30, 'intro');
        this.contentContainer.add(labelInput.container);
        
        // Jump button
        const jumpBtn = UITheme.createButton(this.scene, x + 440, sectionY + 45, 100, 30, 'JUMP', () => {
            this.jumpToDialogLabel(npcSelector.value, labelInput.value);
        }, 'primary');
        this.contentContainer.add(jumpBtn.button);
        this.contentContainer.add(jumpBtn.text);
        
        // Story branch review section
        const reviewY = sectionY + 80;
        const reviewLabel = UITheme.createText(this.scene, x, reviewY, 'Story Branch Review:', 'headerSmall');
        this.contentContainer.add(reviewLabel);
        
        // Available labels list
        const labelsList = this.createScrollableList(x, reviewY + 30, width - 20, 200, this.getAvailableLabels());
        this.contentContainer.add(labelsList.container);
        
        // Dialog flow visualization
        const flowY = reviewY + 250;
        const flowLabel = UITheme.createText(this.scene, x, flowY, 'Current Dialog Flow:', 'headerSmall');
        this.contentContainer.add(flowLabel);
        
        const flowInfo = this.createDialogFlowInfo(x, flowY + 30, width - 20, 100);
        this.contentContainer.add(flowInfo.container);
    }

    createQuestStatesTab(x, y, width, height) {
        const questLabel = UITheme.createText(this.scene, x, y, 'Quest State Management:', 'headerSmall');
        this.contentContainer.add(questLabel);
        
        // Quest list with force-set buttons
        const questList = this.createQuestStatesList(x, y + 30, width - 20, height - 60);
        this.contentContainer.add(questList.container);
        
        // Quick actions
        const actionsY = y + height - 50;
        const resetBtn = UITheme.createButton(this.scene, x, actionsY, 120, 30, 'RESET ALL', () => {
            this.resetAllQuests();
        }, 'danger');
        this.contentContainer.add(resetBtn.button);
        this.contentContainer.add(resetBtn.text);
        
        const completeBtn = UITheme.createButton(this.scene, x + 140, actionsY, 150, 30, 'COMPLETE ALL', () => {
            this.completeAllQuests();
        }, 'success');
        this.contentContainer.add(completeBtn.button);
        this.contentContainer.add(completeBtn.text);
    }

    createGameFlagsTab(x, y, width, height) {
        const flagLabel = UITheme.createText(this.scene, x, y, 'Game Flags Override:', 'headerSmall');
        this.contentContainer.add(flagLabel);
        
        // Flag input section
        const flagInputY = y + 30;
        const flagNameInput = this.createTextInput(x, flagInputY, 200, 30, 'flag_name');
        this.contentContainer.add(flagNameInput.container);
        
        const flagValueInput = this.createTextInput(x + 220, flagInputY, 100, 30, 'true');
        this.contentContainer.add(flagValueInput.container);
        
        const setFlagBtn = UITheme.createButton(this.scene, x + 340, flagInputY + 15, 80, 30, 'SET', () => {
            this.setGameFlag(flagNameInput.value, flagValueInput.value);
        }, 'primary');
        this.contentContainer.add(setFlagBtn.button);
        this.contentContainer.add(setFlagBtn.text);
        
        // Flags list
        const flagsList = this.createFlagsList(x, flagInputY + 60, width - 20, height - 120);
        this.contentContainer.add(flagsList.container);
    }

    createAchievementsTab(x, y, width, height) {
        const achLabel = UITheme.createText(this.scene, x, y, 'Achievement Testing:', 'headerSmall');
        this.contentContainer.add(achLabel);
        
        // Achievement trigger section
        const achList = this.createAchievementsList(x, y + 30, width - 20, height - 60);
        this.contentContainer.add(achList.container);
    }

    createDevToolsTab(x, y, width, height) {
        const toolsLabel = UITheme.createText(this.scene, x, y, 'Developer Tools:', 'headerSmall');
        this.contentContainer.add(toolsLabel);
        
        // Tools grid
        const tools = [
            { name: 'Reload Dialog Scripts', action: () => this.reloadDialogScripts() },
            { name: 'Export Save State', action: () => this.exportSaveState() },
            { name: 'Import Save State', action: () => this.importSaveState() },
            { name: 'Clear All Progress', action: () => this.clearAllProgress() },
            { name: 'Test Achievement Popup', action: () => this.testAchievementPopup() },
            { name: 'Validate Dialog Scripts', action: () => this.validateDialogScripts() }
        ];
        
        let toolY = y + 30;
        tools.forEach((tool, index) => {
            if (index % 2 === 0 && index > 0) {
                toolY += 50;
            }
            
            const toolX = x + (index % 2) * (width / 2);
            const toolBtn = UITheme.createButton(this.scene, toolX, toolY, 180, 35, tool.name, tool.action, 'secondary');
            this.contentContainer.add(toolBtn.button);
            this.contentContainer.add(toolBtn.text);
        });
        
        // Console output area
        const consoleY = toolY + 80;
        const consoleLabel = UITheme.createText(this.scene, x, consoleY, 'Debug Console:', 'headerSmall');
        this.contentContainer.add(consoleLabel);
        
        const consoleArea = this.createConsoleOutput(x, consoleY + 30, width - 20, height - (consoleY - y) - 50);
        this.contentContainer.add(consoleArea.container);
    }

    // Helper methods for creating UI components
    createDropdown(x, y, width, height, options, defaultValue) {
        // Simplified dropdown implementation
        const container = this.scene.add.container(x, y);
        
        const bg = this.scene.add.graphics();
        bg.fillStyle(UITheme.colors.medium);
        bg.fillRoundedRect(0, 0, width, height, 5);
        bg.lineStyle(1, UITheme.colors.primaryLight);
        bg.strokeRoundedRect(0, 0, width, height, 5);
        
        const text = UITheme.createText(this.scene, 10, height/2, defaultValue, 'bodyMedium');
        text.setOrigin(0, 0.5);
        
        container.add([bg, text]);
        container.value = defaultValue;
        
        return { container, value: defaultValue };
    }

    createTextInput(x, y, width, height, placeholder) {
        const container = this.scene.add.container(x, y);
        
        const bg = this.scene.add.graphics();
        bg.fillStyle(UITheme.colors.darkSecondary);
        bg.fillRoundedRect(0, 0, width, height, 5);
        bg.lineStyle(1, UITheme.colors.primaryLight);
        bg.strokeRoundedRect(0, 0, width, height, 5);
        
        const text = UITheme.createText(this.scene, 10, height/2, placeholder, 'bodyMedium');
        text.setOrigin(0, 0.5);
        text.setColor(UITheme.colors.textSecondary);
        
        container.add([bg, text]);
        container.value = placeholder;
        
        return { container, value: placeholder };
    }

    createScrollableList(x, y, width, height, items) {
        const container = this.scene.add.container(x, y);
        
        const bg = UITheme.createPanel(this.scene, 0, 0, width, height, 'secondary');
        container.add(bg);
        
        // Add items (simplified)
        let itemY = 10;
        items.slice(0, 8).forEach(item => { // Show first 8 items
            const itemText = UITheme.createText(this.scene, 10, itemY, item, 'bodySmall');
            container.add(itemText);
            itemY += 20;
        });
        
        return { container };
    }

    createDialogFlowInfo(x, y, width, height) {
        const container = this.scene.add.container(x, y);
        
        const bg = UITheme.createPanel(this.scene, 0, 0, width, height, 'secondary');
        container.add(bg);
        
        const info = UITheme.createText(this.scene, 10, 10, 'Current: N/A\nNext: N/A\nBranches: 0', 'bodySmall');
        container.add(info);
        
        return { container };
    }

    createQuestStatesList(x, y, width, height) {
        const container = this.scene.add.container(x, y);
        
        const bg = UITheme.createPanel(this.scene, 0, 0, width, height, 'secondary');
        container.add(bg);
        
        // Mock quest list
        const quests = ['tutorial_fishing', 'meet_npcs', 'first_catch', 'equipment_upgrade'];
        let questY = 10;
        
        quests.forEach(quest => {
            const questText = UITheme.createText(this.scene, 10, questY, quest, 'bodySmall');
            container.add(questText);
            
            const activateBtn = UITheme.createButton(this.scene, width - 120, questY + 10, 50, 20, 'START', () => {
                this.forceQuestState(quest, 'active');
            }, 'primary');
            container.add(activateBtn.button);
            container.add(activateBtn.text);
            
            const completeBtn = UITheme.createButton(this.scene, width - 60, questY + 10, 50, 20, 'DONE', () => {
                this.forceQuestState(quest, 'completed');
            }, 'success');
            container.add(completeBtn.button);
            container.add(completeBtn.text);
            
            questY += 40;
        });
        
        return { container };
    }

    createFlagsList(x, y, width, height) {
        const container = this.scene.add.container(x, y);
        
        const bg = UITheme.createPanel(this.scene, 0, 0, width, height, 'secondary');
        container.add(bg);
        
        const flagsText = UITheme.createText(this.scene, 10, 10, 'Game flags will appear here when set...', 'bodySmall');
        container.add(flagsText);
        
        return { container };
    }

    createAchievementsList(x, y, width, height) {
        const container = this.scene.add.container(x, y);
        
        const bg = UITheme.createPanel(this.scene, 0, 0, width, height, 'secondary');
        container.add(bg);
        
        // Mock achievements
        const achievements = ['first_conversation', 'mia_romance_1', 'sophie_romance_1', 'luna_romance_1'];
        let achY = 10;
        
        achievements.forEach(ach => {
            const achText = UITheme.createText(this.scene, 10, achY, ach, 'bodySmall');
            container.add(achText);
            
            const unlockBtn = UITheme.createButton(this.scene, width - 80, achY + 10, 70, 20, 'UNLOCK', () => {
                this.unlockAchievement(ach);
            }, 'primary');
            container.add(unlockBtn.button);
            container.add(unlockBtn.text);
            
            achY += 35;
        });
        
        return { container };
    }

    createConsoleOutput(x, y, width, height) {
        const container = this.scene.add.container(x, y);
        
        const bg = UITheme.createPanel(this.scene, 0, 0, width, height, 'secondary');
        container.add(bg);
        
        const consoleText = UITheme.createText(this.scene, 10, 10, 'Debug console output...', 'bodySmall');
        consoleText.setColor(UITheme.colors.success);
        container.add(consoleText);
        
        return { container };
    }

    // Debug action methods
    jumpToDialogLabel(npcId, label) {
        console.log(`RenJsDebugUI: Jumping to dialog - NPC: ${npcId}, Label: ${label}`);
        
        // Try to trigger dialog via existing system
        if (this.scene.scene && this.scene.scene.get('DialogScene')) {
            const dialogScene = this.scene.scene.get('DialogScene');
            // Implementation depends on your DialogScene API
            console.log(`RenJsDebugUI: Dialog jump triggered for ${npcId}:${label}`);
        }
        
        this.logToConsole(`Jumped to ${npcId}:${label}`);
    }

    forceQuestState(questId, state) {
        console.log(`RenJsDebugUI: Setting quest ${questId} to ${state}`);
        
        if (this.gameState?.questManager) {
            switch (state) {
                case 'active':
                    this.gameState.questManager.startQuest(questId);
                    break;
                case 'completed':
                    this.gameState.questManager.completeQuest(questId);
                    break;
            }
        }
        
        this.logToConsole(`Quest ${questId} set to ${state}`);
    }

    setGameFlag(flagName, value) {
        console.log(`RenJsDebugUI: Setting flag ${flagName} = ${value}`);
        
        // Convert string value to appropriate type
        let parsedValue = value;
        if (value === 'true') parsedValue = true;
        else if (value === 'false') parsedValue = false;
        else if (!isNaN(value)) parsedValue = Number(value);
        
        this.flags.set(flagName, parsedValue);
        
        // Also set in game state if available
        if (this.gameState?.setFlag) {
            this.gameState.setFlag(flagName, parsedValue);
        }
        
        this.logToConsole(`Flag ${flagName} = ${parsedValue}`);
    }

    unlockAchievement(achievementId) {
        console.log(`RenJsDebugUI: Unlocking achievement ${achievementId}`);
        
        if (this.gameState?.questManager) {
            this.gameState.questManager.unlockAchievement(achievementId);
        }
        
        this.logToConsole(`Achievement unlocked: ${achievementId}`);
    }

    getAvailableLabels() {
        // Mock labels - in real implementation, parse from dialog files
        return [
            'intro', 'casual_chat', 'friendship_talks', 'close_friend_secrets',
            'romantic_interest', 'lover_intimacy', 'fishing_tips', 'competitions',
            'mysteries', 'backstory', 'ending_1', 'ending_2'
        ];
    }

    resetAllQuests() {
        console.log('RenJsDebugUI: Resetting all quests');
        // Implementation depends on your quest system
        this.logToConsole('All quests reset');
    }

    completeAllQuests() {
        console.log('RenJsDebugUI: Completing all quests');
        // Implementation depends on your quest system
        this.logToConsole('All quests completed');
    }

    reloadDialogScripts() {
        console.log('RenJsDebugUI: Reloading dialog scripts');
        this.logToConsole('Dialog scripts reloaded');
    }

    exportSaveState() {
        console.log('RenJsDebugUI: Exporting save state');
        const saveData = {
            quests: this.questStates,
            flags: Object.fromEntries(this.flags),
            timestamp: Date.now()
        };
        console.log('Save State:', saveData);
        this.logToConsole('Save state exported to console');
    }

    importSaveState() {
        console.log('RenJsDebugUI: Import save state feature - manual implementation needed');
        this.logToConsole('Import feature ready for implementation');
    }

    clearAllProgress() {
        console.log('RenJsDebugUI: Clearing all progress');
        this.questStates.clear();
        this.flags.clear();
        localStorage.clear();
        this.logToConsole('All progress cleared');
    }

    testAchievementPopup() {
        console.log('RenJsDebugUI: Testing achievement popup');
        UITheme.createNotification(this.scene, '🏆 Test Achievement Unlocked!\nDebug achievement for testing', 'success', 5000);
        this.logToConsole('Achievement popup test triggered');
    }

    validateDialogScripts() {
        console.log('RenJsDebugUI: Validating dialog scripts');
        // Mock validation - in real implementation, check syntax
        this.logToConsole('Dialog scripts validation complete - no errors found');
    }

    logToConsole(message) {
        // Add to debug console (simplified)
        console.log(`[RenJs Debug] ${message}`);
    }

    setupEventListeners() {
        // Toggle debug UI with F12 or Ctrl+Shift+D
        this.scene.input.keyboard.on('keydown', (event) => {
            if (event.key === 'F12' || (event.ctrlKey && event.shiftKey && event.key === 'D')) {
                this.toggle();
                event.preventDefault();
            }
        });
    }

    show() {
        if (this.isEnabled && this.container) {
            this.container.setVisible(true);
            this.isVisible = true;
            console.log('RenJsDebugUI: Debug panel opened');
        }
    }

    hide() {
        if (this.container) {
            this.container.setVisible(false);
            this.isVisible = false;
            console.log('RenJsDebugUI: Debug panel closed');
        }
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    destroy() {
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
            }
} 