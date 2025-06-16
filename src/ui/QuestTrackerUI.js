import UITheme from './UITheme.js';
import Logger from '../utils/Logger.js';

export class QuestTrackerUI {
    constructor(scene, questManager, x = 20, y = 100) {
        this.scene = scene;
        this.questManager = questManager;
        this.x = x;
        this.y = y;
        
        // CRITICAL FIX: Track if quest processing is disabled (when questManager is null)
        this.questProcessingDisabled = (questManager === null);
        
        this.isVisible = true;
        this.container = null;
        this.questEntries = new Map();
        this.maxQuestDisplay = 5; // Maximum number of quests to display
        
        console.log('QuestTrackerUI: Initializing with quest processing:', !this.questProcessingDisabled);
        
        this.createTrackerUI();
        this.setupEventListeners();
        this.refreshQuests();
    }

    createTrackerUI() {
        // Create main container
        this.container = this.scene.add.container(this.x, this.y);
        this.container.setDepth(1000); // High depth to stay on top
        
        // Create header
        this.createHeader();
        
        // Create quest entries container
        this.questEntriesContainer = this.scene.add.container(0, 50);
        this.container.add(this.questEntriesContainer);
        
            }

    createHeader() {
        // Header background
        this.headerBg = this.scene.add.graphics();
        this.headerBg.fillStyle(UITheme.colors.primary, 0.9);
        this.headerBg.fillRoundedRect(0, 0, 280, 40, 8);
        this.headerBg.lineStyle(2, UITheme.colors.primaryLight, 0.8);
        this.headerBg.strokeRoundedRect(0, 0, 280, 40, 8);
        this.container.add(this.headerBg);
        
        // Header text
        this.headerText = UITheme.createText(this.scene, 140, 20, '📜 ACTIVE QUESTS', 'headerSmall');
        this.headerText.setOrigin(0.5);
        this.headerText.setColor(UITheme.colors.gold);
        this.headerText.setFontStyle('bold');
        this.container.add(this.headerText);
        
        // Toggle button (minimize/maximize)
        this.toggleButton = this.scene.add.rectangle(260, 20, 20, 20, UITheme.colors.secondary, 0.8);
        this.toggleButton.setStrokeStyle(1, UITheme.colors.secondaryLight);
        this.toggleButton.setInteractive({ useHandCursor: true });
        this.container.add(this.toggleButton);
        
        this.toggleButtonText = this.scene.add.text(260, 20, '−', {
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(this.toggleButtonText);
        
        // Toggle functionality
        this.toggleButton.on('pointerdown', () => {
            this.toggleVisibility();
        });
        
        this.toggleButton.on('pointerover', () => {
            this.toggleButton.setFillStyle(UITheme.colors.secondaryLight, 0.9);
        });
        
        this.toggleButton.on('pointerout', () => {
            this.toggleButton.setFillStyle(UITheme.colors.secondary, 0.8);
        });
    }

    setupEventListeners() {
        // CRITICAL FIX: Don't set up any event listeners if quest processing is disabled
        if (this.questProcessingDisabled) {
            console.log('QuestTrackerUI: 🚫 Quest processing disabled - skipping ALL event listener setup');
            return;
        }
        
        if (!this.questManager) {
            console.log('QuestTrackerUI: No questManager available - skipping event listener setup');
            return;
        }
        
                // Use the global event bus for all listeners
        this.scene.game.events.on('quest-started', this.onQuestStarted, this);
        this.scene.game.events.on('quest-completed', this.onQuestCompleted, this);
        this.scene.game.events.on('quest-objective-completed', this.onObjectiveCompleted, this);
        this.scene.game.events.on('quest-objective-updated', this.onObjectiveUpdated, this);
        this.scene.game.events.on('quest-progress-updated', this.onQuestProgressUpdated, this);
        
        // Listen for fishing events to trigger UI updates (e.g., for fishing-related objectives)
        this.scene.game.events.on('fishing:castComplete', this.refreshOnFishingEvent, this);
        this.scene.game.events.on('fishing:catchSuccess', this.refreshOnFishingEvent, this);

            }

    refreshQuests() {
        if (!this.questEntriesContainer) {
                        return;
        }
        
        // CRITICAL FIX: If quest processing is disabled, show "No active quests" message
        if (this.questProcessingDisabled) {
            console.log('QuestTrackerUI: Quest processing disabled - showing no quests message');
            this.clearQuestEntries();
            this.showNoQuestsMessage();
            return;
        }
        
        if (!this.questManager) {
            console.log('QuestTrackerUI: Cannot refresh - questManager not available');
            this.clearQuestEntries();
            this.showNoQuestsMessage();
            return;
        }
        
                        try {
            // Get active quests with detailed logging
            const activeQuests = this.questManager.getActiveQuests();
                        if (activeQuests.length === 0) {
                console.log('QuestTrackerUI: No active quests to display');
                this.clearQuestEntries();
                this.showNoQuestsMessage();
                return;
            }
            
            // Log detailed quest information
            activeQuests.forEach((quest, index) => {
                console.log(`QuestTrackerUI: Quest ${index + 1}: ${quest.title} (ID: ${quest.id})`);
                if (quest.objectives) {
                    quest.objectives.forEach((obj, objIndex) => {
                        console.log(`  Objective ${objIndex + 1}: ${obj.description} (completed: ${obj.completed})`);
                    });
                } else {
                    console.log('  No objectives found for this quest');
                }
            });
            
            // Clear current quest entries before rebuilding
            this.clearQuestEntries();
            
            // Sort quests by priority (tutorial quests first)
            const sortedQuests = activeQuests.sort((a, b) => {
                const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
                const aPriority = priorityOrder[a.priority] || 1;
                const bPriority = priorityOrder[b.priority] || 1;
                return bPriority - aPriority;
            });
            
            // Limit to maximum display count
            const questsToDisplay = sortedQuests.slice(0, this.maxQuestDisplay);
            console.log(`QuestTrackerUI: Displaying ${questsToDisplay.length} quests (max: ${this.maxQuestDisplay})`);
            
            // Create quest entries
            questsToDisplay.forEach((quest, index) => {
                this.createQuestEntry(quest, index);
            });
            
                    } catch (error) {
            console.error('QuestTrackerUI: Error refreshing quests:', error);
            this.showErrorMessage('Error loading quests');
        }
    }

    onQuestStarted(data) {
                if (this.scene.time) {
            this.scene.time.delayedCall(100, () => this.refreshQuests());
        }
    }
    
    onQuestCompleted(data) {
                if (this.scene.time) {
            this.scene.time.delayedCall(100, () => this.refreshQuests());
        }
    }
    
    onObjectiveCompleted(data) {
                if (this.scene.time) {
            this.scene.time.delayedCall(100, () => this.refreshQuests());
        }
    }

    onObjectiveUpdated(data) {
                if (this.scene.time) {
            this.scene.time.delayedCall(100, () => this.refreshQuests());
        }
    }

    onQuestProgressUpdated(data) {
                if (this.scene.time) {
            this.scene.time.delayedCall(100, () => this.refreshQuests());
        }
    }

    refreshOnFishingEvent() {
        if (!this.questProcessingDisabled && this.questManager && this.questManager.activeQuests && this.questManager.activeQuests.size > 0) {
                        if (this.scene.time) {
                this.scene.time.delayedCall(100, () => this.refreshQuests());
            }
        } else {
            console.log('QuestTrackerUI: Fishing event but quest processing disabled or no active quests, skipping refresh');
        }
    }

    getActiveQuests() {
        if (!this.questManager || !this.questManager.activeQuests) {
            return [];
        }
        
        const quests = [];
        this.questManager.activeQuests.forEach((quest, questId) => {
            if (quest && !quest.completed) {
                quests.push({ id: questId, ...quest });
            }
        });
        
        return quests.sort((a, b) => a.priority || 0 - b.priority || 0);
    }

    createQuestEntry(quest, index) {
        const entryY = index * 90;
        const entryContainer = this.scene.add.container(0, entryY);
        
        // Quest entry background
        const entryBg = this.scene.add.graphics();
        entryBg.fillStyle(UITheme.colors.backgroundDark, 0.8);
        entryBg.fillRoundedRect(0, 0, 280, 80, 6);
        entryBg.lineStyle(1, UITheme.colors.border, 0.6);
        entryBg.strokeRoundedRect(0, 0, 280, 80, 6);
        entryContainer.add(entryBg);
        
        // Quest type indicator
        const typeIndicator = this.scene.add.circle(15, 15, 6, this.getQuestTypeColor(quest.type));
        entryContainer.add(typeIndicator);
        
        // Quest title
        const title = UITheme.createText(this.scene, 30, 10, quest.title || quest.name || quest.id, 'bodyMedium');
        title.setColor(UITheme.colors.text);
        title.setFontStyle('bold');
        title.setWordWrapWidth(240);
        entryContainer.add(title);
        
        // Quest description/objective
        const description = this.getQuestDescription(quest);
        const descText = UITheme.createText(this.scene, 30, 30, description, 'bodySmall');
        descText.setColor(UITheme.colors.textSecondary);
        descText.setWordWrapWidth(240);
        descText.setMaxLines(2);
        entryContainer.add(descText);
        
        // Progress bar if applicable
        const progress = this.getQuestProgress(quest);
        if (progress !== null) {
            this.createProgressBar(entryContainer, progress);
        }
        
        // Store entry reference
        this.questEntries.set(quest.id, entryContainer);
        this.questEntriesContainer.add(entryContainer);
    }

    getQuestDescription(quest) {
        // Get current objective description
        if (quest.currentObjectives && quest.currentObjectives.length > 0) {
            const currentObj = quest.currentObjectives[0];
            return currentObj.description || currentObj.id || 'Complete objective';
        }
        
        if (quest.objectives && quest.objectives.length > 0) {
            const incompleteObj = quest.objectives.find(obj => !obj.completed);
            if (incompleteObj) {
                return incompleteObj.description || incompleteObj.id || 'Complete objective';
            }
        }
        
        return quest.description || 'Complete this quest';
    }

    getQuestProgress(quest) {
        if (!quest.objectives || quest.objectives.length === 0) return null;
        
        const completedObjectives = quest.objectives.filter(obj => obj.completed).length;
        const totalObjectives = quest.objectives.length;
        
        return { current: completedObjectives, total: totalObjectives };
    }

    createProgressBar(container, progress) {
        const progressBg = this.scene.add.graphics();
        progressBg.fillStyle(UITheme.colors.backgroundLight, 0.5);
        progressBg.fillRoundedRect(30, 55, 220, 6, 3);
        container.add(progressBg);
        
        const progressPercent = progress.total > 0 ? progress.current / progress.total : 0;
        const progressFill = this.scene.add.graphics();
        progressFill.fillStyle(UITheme.colors.success, 0.8);
        progressFill.fillRoundedRect(30, 55, 220 * progressPercent, 6, 3);
        container.add(progressFill);
        
        // Progress text
        const progressText = UITheme.createText(this.scene, 250, 58, `${progress.current}/${progress.total}`, 'bodySmall');
        progressText.setOrigin(1, 0.5);
        progressText.setColor(UITheme.colors.textSecondary);
        container.add(progressText);
    }

    getQuestTypeColor(type) {
        switch (type) {
            case 'story':
            case 'main':
                return UITheme.colors.primary;
            case 'side':
                return UITheme.colors.secondary;
            case 'daily':
                return UITheme.colors.warning;
            case 'tutorial':
                return UITheme.colors.info;
            default:
                return UITheme.colors.text;
        }
    }

    showNoQuestsMessage() {
        const messageContainer = this.scene.add.container(0, 0);
        
        const messageBg = this.scene.add.graphics();
        messageBg.fillStyle(UITheme.colors.backgroundDark, 0.6);
        messageBg.fillRoundedRect(0, 0, 280, 60, 6);
        messageBg.lineStyle(1, UITheme.colors.border, 0.4);
        messageBg.strokeRoundedRect(0, 0, 280, 60, 6);
        messageContainer.add(messageBg);
        
        const messageText = UITheme.createText(this.scene, 140, 30, 'No active quests', 'bodyMedium');
        messageText.setOrigin(0.5);
        messageText.setColor(UITheme.colors.textSecondary);
        messageText.setFontStyle('italic');
        messageContainer.add(messageText);
        
        this.questEntriesContainer.add(messageContainer);
        this.questEntries.set('no-quests', messageContainer);
    }

    clearQuestEntries() {
        this.questEntries.forEach(entry => {
            entry.destroy();
        });
        this.questEntries.clear();
    }

    updateContainerHeight(questCount) {
        const headerHeight = 50;
        const entryHeight = 90;
        const minHeight = questCount === 0 ? 60 : questCount * entryHeight;
        
        // Update header background to match container
        if (this.headerBg) {
            this.headerBg.clear();
            this.headerBg.fillStyle(UITheme.colors.primary, 0.9);
            this.headerBg.fillRoundedRect(0, 0, 280, 40, 8);
            this.headerBg.lineStyle(2, UITheme.colors.primaryLight, 0.8);
            this.headerBg.strokeRoundedRect(0, 0, 280, 40, 8);
        }
    }

    toggleVisibility() {
        if (this.questEntriesContainer.visible) {
            // Hide quest entries
            this.questEntriesContainer.setVisible(false);
            this.toggleButtonText.setText('+');
        } else {
            // Show quest entries
            this.questEntriesContainer.setVisible(true);
            this.toggleButtonText.setText('−');
            this.refreshQuests(); // Refresh when showing
        }
    }

    show() {
        if (this.container) {
            this.container.setVisible(true);
            this.isVisible = true;
            this.refreshQuests();
        }
    }

    hide() {
        if (this.container) {
            this.container.setVisible(false);
            this.isVisible = false;
        }
    }

    setPosition(x, y) {
        if (this.container) {
            this.container.setPosition(x, y);
            this.x = x;
            this.y = y;
        }
    }

    destroy() {
                if (this.container) {
            this.clearQuestEntries();
            this.container.destroy();
            this.container = null;
        }
        
        // Remove global event listeners
        if (this.scene && this.scene.game && this.scene.game.events) {
            this.scene.game.events.off('quest-started', this.onQuestStarted, this);
            this.scene.game.events.off('quest-completed', this.onQuestCompleted, this);
            this.scene.game.events.off('quest-objective-completed', this.onObjectiveCompleted, this);
            this.scene.game.events.off('quest-objective-updated', this.onObjectiveUpdated, this);
            this.scene.game.events.off('quest-progress-updated', this.onQuestProgressUpdated, this);
            this.scene.game.events.off('fishing:castComplete', this.refreshOnFishingEvent, this);
            this.scene.game.events.off('fishing:catchSuccess', this.refreshOnFishingEvent, this);
        }
        
        console.log('QuestTrackerUI: ✅ Destroyed quest tracker UI and cleaned up ALL event listeners');
    }

    /**
     * Update QuestManager reference and enable quest processing
     * Used when QuestManager becomes available after UI creation
     */
    updateQuestManager(questManager) {
        console.log('QuestTrackerUI: Updating QuestManager reference...');
        console.log('QuestTrackerUI: Previous quest processing disabled:', this.questProcessingDisabled);
        console.log('QuestTrackerUI: New QuestManager available:', !!questManager);
        
        if (questManager && this.questProcessingDisabled) {
            console.log('QuestTrackerUI: Enabling quest processing with new QuestManager');
            
            this.questManager = questManager;
            this.questProcessingDisabled = false;
            
            // Set up event listeners now that we have a QuestManager
            this.setupEventListeners();
            
            // Refresh quests immediately
            this.refreshQuests();
            
            console.log('QuestTrackerUI: ✅ Quest processing enabled with updated QuestManager');
        } else if (!questManager) {
            console.log('QuestTrackerUI: Cannot enable quest processing - no QuestManager provided');
        } else {
            console.log('QuestTrackerUI: Quest processing already enabled');
        }
    }
} 