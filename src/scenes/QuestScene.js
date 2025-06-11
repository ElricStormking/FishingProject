import { QuestManager } from '../scripts/QuestManager.js';

/**
 * Quest Scene - UI for displaying and managing all quest types
 */
export default class QuestScene extends Phaser.Scene {
    constructor() {
        super({ key: 'QuestScene' });
    }

    init(data) {
        this.fromScene = data?.fromScene || 'GameScene';
        this.questManager = null;
        this.selectedQuest = null;
        this.currentFilter = 'all';
        this.questElements = [];
    }

    preload() {
        // Skip loading quest UI assets since they don't exist yet
        // We'll use procedural graphics instead
        console.log('QuestScene: Using procedural graphics for UI elements');
        
        // Create placeholder assets programmatically
        this.createPlaceholderAssets();
    }

    create() {
        console.log('QuestScene: Initializing Quest UI');
        
        // Hide fish button when quest UI is opened
        if (this.scene.get('BoatMenuScene') && this.scene.get('BoatMenuScene').hideFishButton) {
            this.scene.get('BoatMenuScene').hideFishButton();
        }
        
        // Get quest manager from game state or create one
        try {
            // CRITICAL FIX: First try to get GameState reference
            const gameScene = this.scene.get('GameScene');
            const boatMenuScene = this.scene.get('BoatMenuScene');
            let gameState = null;
            
            // Get GameState reference from any available scene
            if (gameScene && gameScene.gameState) {
                gameState = gameScene.gameState;
                console.log('QuestScene: GameState found from GameScene');
            } else if (boatMenuScene && boatMenuScene.gameState) {
                gameState = boatMenuScene.gameState;
                console.log('QuestScene: GameState found from BoatMenuScene');
            }
            
            // CRITICAL FIX: Try to get QuestManager from GameState first
            if (gameState && gameState.questManager) {
                this.questManager = gameState.questManager;
                console.log('QuestScene: ✅ QuestManager found from GameState');
                console.log('QuestScene: QuestManager active quests:', Array.from(this.questManager.activeQuests.keys()));
            } else {
                // Fallback: Try to get it from a running GameScene
                if (gameScene && gameScene.questManager) {
                    this.questManager = gameScene.questManager;
                    console.log('QuestScene: QuestManager found from GameScene direct reference');
                } else if (boatMenuScene && boatMenuScene.questManager) {
                    this.questManager = boatMenuScene.questManager;
                    console.log('QuestScene: QuestManager found from BoatMenuScene');
                } else {
                    // CRITICAL FIX: Create a new QuestManager AND store it in GameState
                    console.log('QuestScene: Creating new QuestManager instance');
                    this.questManager = new QuestManager(this);
                    console.log('QuestScene: QuestManager created successfully');
                    
                    // CRITICAL FIX: Store the new QuestManager in GameState for other scenes to use
                    if (gameState) {
                        gameState.questManager = this.questManager;
                        console.log('QuestScene: ✅ QuestManager stored in GameState for other scenes');
                    } else {
                        console.warn('QuestScene: Could not store QuestManager in GameState - GameState not available');
                    }
                }
            }
        } catch (error) {
            console.error('QuestScene: Error accessing QuestManager:', error);
            this.questManager = null;
        }
        
        if (!this.questManager) {
            console.error('QuestScene: QuestManager not available - showing placeholder UI');
            this.createPlaceholderQuestUI();
            return;
        }

        this.createUI();
        this.setupEventListeners();
        this.refreshQuestDisplay();
        
        // Input handling
        this.input.keyboard.addKey('Q').on('down', () => this.returnToGame());
        this.input.keyboard.addKey('ESC').on('down', () => this.returnToGame());
    }

    createPlaceholderAssets() {
        // Create simple colored rectangles as placeholders
        if (!this.textures.exists('quest-bg')) {
            const bg = this.add.graphics();
            bg.fillStyle(0x1a1a2e, 0.95);
            bg.fillRect(0, 0, 800, 600);
            bg.generateTexture('quest-bg', 800, 600);
            bg.destroy();
        }
    }

    createPlaceholderQuestUI() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // Main container
        this.questContainer = this.add.container(0, 0);
        
        // Background
        const bg = this.add.graphics();
        bg.fillStyle(0x0f1419, 0.98);
        bg.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.questContainer.add(bg);
        
        // Title
        const titleText = this.add.text(centerX, 100, 'QUEST SYSTEM', {
            font: '32px Arial',
            fill: '#64b5f6',
            fontStyle: 'bold'
        });
        titleText.setOrigin(0.5);
        this.questContainer.add(titleText);
        
        // Placeholder message
        const messageText = this.add.text(centerX, centerY, 'Quest System Not Available\n\nThe quest manager is not initialized.\nPlease start from the Game Scene first.', {
            font: '18px Arial',
            fill: '#ffffff',
            align: 'center',
            lineSpacing: 10
        });
        messageText.setOrigin(0.5);
        this.questContainer.add(messageText);
        
        // Close button
        this.createCloseButton();
        
        // Input handling
        this.input.keyboard.addKey('Q').on('down', () => this.returnToGame());
        this.input.keyboard.addKey('ESC').on('down', () => this.returnToGame());
    }

    createUI() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // Main container
        this.questContainer = this.add.container(0, 0);
        
        // Background
        const bg = this.add.graphics();
        bg.fillStyle(0x0f1419, 0.98);
        bg.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.questContainer.add(bg);
        
        // Title
        const titleText = this.add.text(centerX, 50, 'QUEST LOG', {
            font: '32px Arial',
            fill: '#64b5f6',
            fontStyle: 'bold'
        });
        titleText.setOrigin(0.5);
        this.questContainer.add(titleText);
        
        // Filter buttons
        this.createFilterButtons();
        
        // Quest list panel
        this.createQuestListPanel();
        
        // Quest details panel
        this.createQuestDetailsPanel();
        
        // Close button
        this.createCloseButton();
        
        // Quest stats
        this.createQuestStats();
    }

    createFilterButtons() {
        const centerX = this.cameras.main.width / 2;
        const buttonY = 100;
        const buttonSpacing = 120;
        
        const filters = [
            { key: 'all', label: 'All', color: 0x64b5f6 },
            { key: 'main_story', label: 'Story', color: 0xe74c3c },
            { key: 'side_event', label: 'Events', color: 0xf39c12 },
            { key: 'npc_chatroom', label: 'NPCs', color: 0xe91e63 },
            { key: 'fishing', label: 'Fishing', color: 0x2ecc71 }
        ];
        
        this.filterButtons = [];
        
        filters.forEach((filter, index) => {
            const x = centerX - (filters.length - 1) * buttonSpacing / 2 + index * buttonSpacing;
            
            const button = this.add.graphics();
            const isActive = this.currentFilter === filter.key;
            
            // Position the button graphics at origin, we'll position the whole thing later
            button.fillStyle(isActive ? filter.color : 0x2c3e50, isActive ? 1 : 0.7);
            button.lineStyle(2, filter.color, 1);
            button.fillRoundedRect(-50, -15, 100, 30, 5);
            button.strokeRoundedRect(-50, -15, 100, 30, 5);
            button.setPosition(x, buttonY);
            
            const text = this.add.text(x, buttonY, filter.label, {
                font: '14px Arial',
                fill: isActive ? '#ffffff' : '#ecf0f1',
                fontStyle: 'bold'
            });
            text.setOrigin(0.5);
            
            // Make interactive - position hit area at the same coordinates as button
            const hitArea = this.add.zone(x, buttonY, 100, 30);
            hitArea.setInteractive({ useHandCursor: true });
            hitArea.on('pointerdown', () => {
                console.log(`QuestScene: Filter clicked: ${filter.key}`);
                this.setFilter(filter.key);
            });
            hitArea.on('pointerover', () => {
                if (this.currentFilter !== filter.key) {
                    button.clear();
                    button.fillStyle(filter.color, 0.5);
                    button.lineStyle(2, filter.color, 1);
                    button.fillRoundedRect(-50, -15, 100, 30, 5);
                    button.strokeRoundedRect(-50, -15, 100, 30, 5);
                }
            });
            hitArea.on('pointerout', () => {
                if (this.currentFilter !== filter.key) {
                    button.clear();
                    button.fillStyle(0x2c3e50, 0.7);
                    button.lineStyle(2, filter.color, 1);
                    button.fillRoundedRect(-50, -15, 100, 30, 5);
                    button.strokeRoundedRect(-50, -15, 100, 30, 5);
                }
            });
            
            this.filterButtons.push({ button, text, hitArea, filter, x, y: buttonY });
            this.questContainer.add(button);
            this.questContainer.add(text);
            this.questContainer.add(hitArea);
        });
    }

    createQuestListPanel() {
        const panelX = 50;
        const panelY = 150;
        const panelWidth = 350;
        const panelHeight = 380;
        
        // Panel background
        const panel = this.add.graphics();
        panel.fillStyle(0x2c3e50, 0.9);
        panel.lineStyle(2, 0x34495e, 1);
        panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        this.questContainer.add(panel);
        
        // Panel title
        const panelTitle = this.add.text(panelX + 20, panelY + 20, 'Quests', {
            font: '18px Arial',
            fill: '#ecf0f1',
            fontStyle: 'bold'
        });
        this.questContainer.add(panelTitle);
        
        // Scrollable quest list container
        this.questListContainer = this.add.container(0, 0);
        this.questContainer.add(this.questListContainer);
        
        // Store panel bounds for quest list
        this.questListBounds = {
            x: panelX + 10,
            y: panelY + 50,
            width: panelWidth - 20,
            height: panelHeight - 60
        };
    }

    createQuestDetailsPanel() {
        const panelX = 420;
        const panelY = 150;
        const panelWidth = 350;
        const panelHeight = 380;
        
        // Panel background
        const detailPanel = this.add.graphics();
        detailPanel.fillStyle(0x2c3e50, 0.9);
        detailPanel.lineStyle(2, 0x34495e, 1);
        detailPanel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        detailPanel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        this.questContainer.add(detailPanel);
        
        // Panel title
        this.detailPanelTitle = this.add.text(panelX + 20, panelY + 20, 'Quest Details', {
            font: '18px Arial',
            fill: '#ecf0f1',
            fontStyle: 'bold'
        });
        this.questContainer.add(this.detailPanelTitle);
        
        // Details container
        this.questDetailsContainer = this.add.container(0, 0);
        this.questContainer.add(this.questDetailsContainer);
        
        // Store panel bounds for details
        this.questDetailBounds = {
            x: panelX + 10,
            y: panelY + 50,
            width: panelWidth - 20,
            height: panelHeight - 60
        };
    }

    createQuestStats() {
        const statsY = 550;
        const centerX = this.cameras.main.width / 2;
        
        this.statsText = this.add.text(centerX, statsY, '', {
            font: '14px Arial',
            fill: '#95a5a6',
            align: 'center'
        });
        this.statsText.setOrigin(0.5);
        this.questContainer.add(this.statsText);
    }

    createCloseButton() {
        const closeX = this.cameras.main.width - 50;
        const closeY = 50;
        
        const closeButton = this.add.text(closeX, closeY, '✕', {
            font: '24px Arial',
            fill: '#e74c3c',
            fontStyle: 'bold'
        });
        closeButton.setOrigin(0.5);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.on('pointerdown', () => this.returnToGame());
        closeButton.on('pointerover', () => closeButton.setScale(1.2));
        closeButton.on('pointerout', () => closeButton.setScale(1));
        
        this.questContainer.add(closeButton);
    }

    setFilter(filterKey) {
        console.log(`QuestScene: Setting filter to: ${filterKey} (was: ${this.currentFilter})`);
        this.currentFilter = filterKey;
        this.updateFilterButtons();
        this.refreshQuestDisplay();
    }

    updateFilterButtons() {
        this.filterButtons.forEach(({ button, text, filter }) => {
            const isActive = this.currentFilter === filter.key;
            
            button.clear();
            button.fillStyle(isActive ? filter.color : 0x2c3e50, isActive ? 1 : 0.7);
            button.lineStyle(2, filter.color, 1);
            button.fillRoundedRect(-50, -15, 100, 30, 5);
            button.strokeRoundedRect(-50, -15, 100, 30, 5);
            
            // Update text color based on active state
            text.setStyle({
                fill: isActive ? '#ffffff' : '#ecf0f1'
            });
        });
    }

    refreshQuestDisplay() {
        this.clearQuestList();
        
        // Check if questManager is available and has required methods
        if (!this.questManager) {
            console.warn('QuestScene: QuestManager not available for refresh');
            return;
        }
        
        let quests = [];
        
        try {
            if (this.currentFilter === 'all') {
                const activeQuests = this.questManager.getActiveQuests ? this.questManager.getActiveQuests() : [];
                const availableQuests = this.questManager.getAvailableQuests ? this.questManager.getAvailableQuests() : [];
                
                // Combine active and available quests, but filter out any that are completed
                const allQuests = [...activeQuests, ...availableQuests];
                
                // Remove duplicates and filter out completed quests
                const questMap = new Map();
                allQuests.forEach(quest => {
                    // Multiple checks to ensure completed quests are never shown
                    const isCompleted = quest.status === 'completed' || 
                                      this.questManager.completedQuests.has(quest.id) ||
                                      (quest.template && quest.template.status === 'completed');
                    
                    // Only add if not completed and not already in map
                    if (!isCompleted && !questMap.has(quest.id)) {
                        questMap.set(quest.id, quest);
                        console.log(`QuestScene: Adding quest to display: ${quest.id} - ${quest.title}`);
                    } else if (isCompleted) {
                        console.log(`QuestScene: Filtering out completed quest: ${quest.id} - ${quest.title}`);
                    }
                });
                
                quests = Array.from(questMap.values());
            } else {
                quests = this.questManager.getQuestsByType ? this.questManager.getQuestsByType(this.currentFilter) : [];
                
                // Additional safety filter to remove completed quests with multiple checks
                quests = quests.filter(quest => {
                    const isCompleted = quest.status === 'completed' || 
                                      this.questManager.completedQuests.has(quest.id) ||
                                      (quest.template && quest.template.status === 'completed');
                    
                    if (isCompleted) {
                        console.log(`QuestScene: Filtering out completed quest (by type): ${quest.id} - ${quest.title}`);
                        return false;
                    }
                    
                    console.log(`QuestScene: Including quest (by type): ${quest.id} - ${quest.title}`);
                    return true;
                });
            }
            
            // Sort quests by priority and status
            quests.sort((a, b) => {
                const statusOrder = { 'active': 0, 'available': 1, 'completed': 2 };
                return statusOrder[a.status] - statusOrder[b.status];
            });
            
            console.log(`QuestScene: Displaying ${quests.length} quests for filter '${this.currentFilter}'`);
            console.log('QuestScene: Quest IDs:', quests.map(q => q.id));
            console.log('QuestScene: Completed quest IDs:', Array.from(this.questManager.completedQuests));
            
            this.displayQuestList(quests);
            this.updateQuestStats();
        } catch (error) {
            console.error('QuestScene: Error refreshing quest display:', error);
            // Show error message in quest list area
            this.displayErrorMessage('Error loading quests. Please try again.');
        }
    }

    displayQuestList(quests) {
        const startY = this.questListBounds.y;
        const itemHeight = 60;
        
        quests.forEach((quest, index) => {
            const y = startY + index * itemHeight;
            
            if (y + itemHeight > this.questListBounds.y + this.questListBounds.height) {
                return; // Skip if outside visible area
            }
            
            this.createQuestListItem(quest, this.questListBounds.x, y, this.questListBounds.width);
        });
    }

    createQuestListItem(quest, x, y, width) {
        const height = 55;
        
        // Background
        const bg = this.add.graphics();
        const isSelected = this.selectedQuest?.id === quest.id;
        bg.fillStyle(isSelected ? 0x3498db : 0x34495e, isSelected ? 0.7 : 0.5);
        bg.lineStyle(1, this.getQuestTypeColor(quest.type), 0.8);
        bg.fillRoundedRect(x, y, width, height, 5);
        bg.strokeRoundedRect(x, y, width, height, 5);
        
        // Status icon
        const statusIcon = this.add.text(x + 10, y + 10, this.getQuestStatusIcon(quest.status), {
            font: '16px Arial',
            fill: this.getQuestStatusColor(quest.status)
        });
        
        // Quest title
        const title = this.add.text(x + 35, y + 10, quest.title, {
            font: '14px Arial',
            fill: '#ecf0f1',
            fontStyle: 'bold',
            wordWrap: { width: width - 50, useAdvancedWrap: true }
        });
        
        // Quest type
        const typeText = this.add.text(x + 35, y + 30, this.getQuestTypeLabel(quest.type), {
            font: '11px Arial',
            fill: this.getQuestTypeColor(quest.type)
        });
        
        // Progress bar for active quests
        if (quest.status === 'active') {
            const progress = this.calculateQuestProgress(quest);
            const progressBarWidth = width - 50;
            const progressBar = this.add.graphics();
            progressBar.fillStyle(0x2c3e50, 0.8);
            progressBar.fillRect(x + 35, y + 42, progressBarWidth, 8);
            progressBar.fillStyle(0x27ae60, 0.9);
            progressBar.fillRect(x + 35, y + 42, progressBarWidth * progress, 8);
        }
        
        // Make interactive
        const hitArea = this.add.zone(x + width/2, y + height/2, width, height);
        hitArea.setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', () => this.selectQuest(quest));
        hitArea.on('pointerover', () => {
            if (!isSelected) {
                bg.clear();
                bg.fillStyle(0x3498db, 0.3);
                bg.lineStyle(1, this.getQuestTypeColor(quest.type), 0.8);
                bg.fillRoundedRect(x, y, width, height, 5);
                bg.strokeRoundedRect(x, y, width, height, 5);
            }
        });
        hitArea.on('pointerout', () => {
            if (!isSelected) {
                bg.clear();
                bg.fillStyle(0x34495e, 0.5);
                bg.lineStyle(1, this.getQuestTypeColor(quest.type), 0.8);
                bg.fillRoundedRect(x, y, width, height, 5);
                bg.strokeRoundedRect(x, y, width, height, 5);
            }
        });
        
        this.questListContainer.add([bg, statusIcon, title, typeText, hitArea]);
        this.questElements.push({ bg, statusIcon, title, typeText, hitArea, quest });
    }

    selectQuest(quest) {
        this.selectedQuest = quest;
        this.displayQuestDetails(quest);
        this.refreshQuestDisplay(); // Refresh to update selection styling
    }

    displayQuestDetails(quest) {
        this.clearQuestDetails();
        
        const x = this.questDetailBounds.x;
        let y = this.questDetailBounds.y;
        const width = this.questDetailBounds.width;
        
        // Quest title
        const title = this.add.text(x, y, quest.title, {
            font: '16px Arial',
            fill: '#ecf0f1',
            fontStyle: 'bold',
            wordWrap: { width: width, useAdvancedWrap: true }
        });
        y += title.height + 10;
        
        // Quest description
        const description = this.add.text(x, y, quest.description, {
            font: '12px Arial',
            fill: '#bdc3c7',
            wordWrap: { width: width, useAdvancedWrap: true }
        });
        y += description.height + 15;
        
        // Objectives
        const objectivesTitle = this.add.text(x, y, 'Objectives:', {
            font: '14px Arial',
            fill: '#e74c3c',
            fontStyle: 'bold'
        });
        y += objectivesTitle.height + 5;
        
        quest.objectives.forEach(objective => {
            const checkmark = objective.completed ? '✓' : '○';
            const color = objective.completed ? '#27ae60' : '#95a5a6';
            
            let objectiveText = `${checkmark} ${objective.description}`;
            if (objective.target) {
                objectiveText += ` (${objective.progress || 0}/${objective.target})`;
            }
            
            const objText = this.add.text(x, y, objectiveText, {
                font: '11px Arial',
                fill: color,
                wordWrap: { width: width, useAdvancedWrap: true }
            });
            y += objText.height + 3;
            
            this.questDetailsContainer.add(objText);
        });
        
        y += 10;
        
        // Rewards
        if (quest.rewards) {
            const rewardsTitle = this.add.text(x, y, 'Rewards:', {
                font: '14px Arial',
                fill: '#f39c12',
                fontStyle: 'bold'
            });
            y += rewardsTitle.height + 5;
            
            if (quest.rewards.coins) {
                const coinText = this.add.text(x, y, `💰 ${quest.rewards.coins} Coins`, {
                    font: '11px Arial',
                    fill: '#f1c40f'
                });
                y += coinText.height + 3;
                this.questDetailsContainer.add(coinText);
            }
            
            if (quest.rewards.experience) {
                const expText = this.add.text(x, y, `⭐ ${quest.rewards.experience} Experience`, {
                    font: '11px Arial',
                    fill: '#3498db'
                });
                y += expText.height + 3;
                this.questDetailsContainer.add(expText);
            }
            
            if (quest.rewards.items) {
                quest.rewards.items.forEach(item => {
                    const itemText = this.add.text(x, y, `🎁 ${item}`, {
                        font: '11px Arial',
                        fill: '#e91e63'
                    });
                    y += itemText.height + 3;
                    this.questDetailsContainer.add(itemText);
                });
            }
            
            this.questDetailsContainer.add(rewardsTitle);
        }
        
        // Action button
        if (quest.status === 'available') {
            const startButton = this.createActionButton(x, y + 10, 'Start Quest', 0x27ae60, () => {
                try {
                    if (this.questManager && this.questManager.startQuest) {
                        this.questManager.startQuest(quest.id);
                        this.refreshQuestDisplay();
                        console.log(`QuestScene: Started quest ${quest.id}`);
                    } else {
                        console.warn('QuestScene: Cannot start quest - QuestManager not available');
                    }
                } catch (error) {
                    console.error('QuestScene: Error starting quest:', error);
                }
            });
            this.questDetailsContainer.add(startButton);
        }
        
        this.questDetailsContainer.add([title, description, objectivesTitle]);
    }

    createActionButton(x, y, text, color, callback) {
        const button = this.add.graphics();
        button.fillStyle(color, 0.8);
        button.lineStyle(2, color, 1);
        button.fillRoundedRect(x, y, 120, 30, 5);
        button.strokeRoundedRect(x, y, 120, 30, 5);
        
        const buttonText = this.add.text(x + 60, y + 15, text, {
            font: '12px Arial',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);
        
        const hitArea = this.add.zone(x + 60, y + 15, 120, 30);
        hitArea.setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', callback);
        
        return [button, buttonText, hitArea];
    }

    clearQuestList() {
        this.questElements.forEach(element => {
            Object.values(element).forEach(obj => {
                if (obj && obj.destroy) obj.destroy();
            });
        });
        this.questElements = [];
        this.questListContainer.removeAll(true);
    }

    clearQuestDetails() {
        this.questDetailsContainer.removeAll(true);
    }

    calculateQuestProgress(quest) {
        if (!quest.objectives.length) return 0;
        
        const completedObjectives = quest.objectives.filter(obj => obj.completed).length;
        return completedObjectives / quest.objectives.length;
    }

    updateQuestStats() {
        try {
            if (this.questManager && this.questManager.getQuestStats) {
                const stats = this.questManager.getQuestStats();
                this.statsText.setText(`Active: ${stats.active} | Available: ${stats.available} | Completed: ${stats.completed}`);
            } else {
                this.statsText.setText('Quest stats not available');
            }
        } catch (error) {
            console.error('QuestScene: Error updating quest stats:', error);
            this.statsText.setText('Error loading quest stats');
        }
    }

    displayErrorMessage(message) {
        const centerX = this.questListBounds.x + this.questListBounds.width / 2;
        const centerY = this.questListBounds.y + this.questListBounds.height / 2;
        
        const errorText = this.add.text(centerX, centerY, message, {
            font: '16px Arial',
            fill: '#e74c3c',
            align: 'center'
        });
        errorText.setOrigin(0.5);
        this.questListContainer.add(errorText);
    }

    getQuestTypeColor(type) {
        const colors = {
            'main_story': '#e74c3c',
            'side_event': '#f39c12',
            'npc_chatroom': '#e91e63',
            'fishing': '#2ecc71',
            'crafting': '#9b59b6'
        };
        return colors[type] || '#64b5f6';
    }

    getQuestTypeLabel(type) {
        const labels = {
            'main_story': 'Main Story',
            'side_event': 'Side Event',
            'npc_chatroom': 'NPC Quest',
            'fishing': 'Fishing',
            'crafting': 'Crafting'
        };
        return labels[type] || 'Quest';
    }

    getQuestStatusIcon(status) {
        const icons = {
            'active': '▶',
            'available': '○',
            'completed': '✓',
            'failed': '✗',
            'locked': '🔒'
        };
        return icons[status] || '?';
    }

    getQuestStatusColor(status) {
        const colors = {
            'active': '#3498db',
            'available': '#f39c12',
            'completed': '#27ae60',
            'failed': '#e74c3c',
            'locked': '#95a5a6'
        };
        return colors[status] || '#ffffff';
    }

    setupEventListeners() {
        // Listen for quest events from QuestManager
        this.events.on('quest-started', this.onQuestStarted, this);
        this.events.on('quest-completed', this.onQuestCompleted, this);
        this.events.on('quest-objective-updated', this.onQuestObjectiveUpdated, this);
    }
    
    onQuestStarted(data) {
        console.log('QuestScene: Quest started event received:', data.questId);
        this.refreshQuestDisplay();
    }
    
    onQuestCompleted(data) {
        console.log('QuestScene: Quest completed event received:', data.questId);
        // Force cleanup and refresh when quest is completed
        if (this.questManager) {
            this.questManager.cleanupQuestStates();
        }
        this.refreshQuestDisplay();
        
        // Clear selection if the completed quest was selected
        if (this.selectedQuest && this.selectedQuest.id === data.questId) {
            this.selectedQuest = null;
            this.clearQuestDetails();
        }
    }
    
    onQuestObjectiveUpdated(data) {
        console.log('QuestScene: Quest objective updated event received:', data.questId, data.objectiveId);
        this.refreshQuestDisplay();
    }

    returnToGame() {
        console.log('QuestScene: Returning to game');
        
        // Show fish button when quest UI is closed
        if (this.scene.get('BoatMenuScene') && this.scene.get('BoatMenuScene').showFishButton) {
            this.scene.get('BoatMenuScene').showFishButton();
        }
        
        this.scene.stop('QuestScene');
        this.scene.resume(this.fromScene);
    }

    destroy() {
        // Show fish button when quest scene is destroyed
        if (this.scene.get('BoatMenuScene') && this.scene.get('BoatMenuScene').showFishButton) {
            this.scene.get('BoatMenuScene').showFishButton();
        }
        
        this.clearQuestList();
        this.clearQuestDetails();
        super.destroy();
    }
} 