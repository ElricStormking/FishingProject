import { QuestDataLoader } from './QuestDataLoader.js';
import Logger from '../utils/Logger.js';

/**
 * Quest Manager - Handles all quest types: main story, side events, NPC quests
 * Integrates with DialogManager and other game systems
 * Now loads quest data from JSON files via QuestDataLoader
 */
export class QuestManager {
    constructor(scene) {
        this.scene = scene;
        this.gameState = scene.gameState;
        
        // Quest storage
        this.activeQuests = new Map();
        this.completedQuests = new Set();
        this.availableQuests = new Map();
        this.questTemplates = new Map();
        
        // Quest status constants
        this.QUEST_STATUS = {
            AVAILABLE: 'available',
            ACTIVE: 'active',
            COMPLETED: 'completed',
            FAILED: 'failed'
        };
        
        // RenJs integration
        this.renjsCallbacks = new Map();
        this.questStateExports = new Map();
        
        // Reward queue
        this.rewardsToShow = [];
        
        // Quest data loader reference - create new instance
        this.questDataLoader = new QuestDataLoader();
        
        // Tutorial completion tracking
        this.tutorialQuestsCompleted = false;
        
        // Initialization state
        this.isInitialized = false;
        this.initializationPromise = null;
        
            }

    /**
     * Create a minimal quest system as last resort
     */
    createMinimalQuestSystem() {
        console.log('QuestManager: Creating minimal quest system...');
        
        // Create a basic tutorial quest manually
        const basicTutorialQuest = {
            id: 'story_001_tutorial',
            type: 'main_story',
            title: 'Welcome to Luxury Angling',
            description: 'Learn the basics of fishing.',
            status: 'available',
            autoStart: true,
            objectives: [
                {
                    id: 'visit_boat_menu',
                    description: 'Access the boat menu',
                    type: 'ui_interaction',
                    target: 1,
                    progress: 0,
                    completed: false
                },
                {
                    id: 'cast_first_time',
                    description: 'Cast your line for the first time',
                    type: 'action',
                    target: 1,
                    progress: 0,
                    completed: false
                }
            ],
            rewards: {
                coins: 100,
                experience: 50
            },
            requirements: [],
            category: 'story'
        };
        
        // Add to quest templates
        this.questTemplates.set(basicTutorialQuest.id, basicTutorialQuest);
        
        // Auto-start the tutorial quest
        if (basicTutorialQuest.autoStart) {
            this.startQuest(basicTutorialQuest.id);
        }
        
        console.log('QuestManager: Minimal quest system created with tutorial quest');
    }

    /**
     * Initialize the quest system asynchronously
     * This should be called after construction
     */
    async initialize() {
        if (this.isInitialized) {
                        return true;
        }
        
        if (this.initializationPromise) {
                        return await this.initializationPromise;
        }
        
                this.initializationPromise = this.initializeQuests();
        
        try {
            await this.initializationPromise;
            this.isInitialized = true;
            
            // Verify quest data was loaded
                                    this.logger?.debug('QuestManager: Available quest template IDs:', Array.from(this.questTemplates.keys())) || Logger.debug(this.constructor.name, 'QuestManager: Available quest template IDs:', Array.from(this.questTemplates.keys()));
            
            // Check specifically for tutorial quest
            const tutorialTemplate = this.questTemplates.get('story_001_tutorial');
            if (tutorialTemplate) {
                            } else {
                console.error('QuestManager: ❌ Tutorial quest template NOT found!');
                this.logger?.debug('QuestManager: Available templates:', Array.from(this.questTemplates.keys())) || Logger.debug(this.constructor.name, 'QuestManager: Available templates:', Array.from(this.questTemplates.keys()));
            }
            
            // Register RenJs commands for quest integration
            try {
                this.registerRenJsCommands();
            } catch (renjsError) {
                console.warn('QuestManager: Error registering RenJs commands:', renjsError.message);
            }
            
            // Setup quest state exports for external systems
            try {
                this.setupQuestStateExports();
            } catch (exportError) {
                console.warn('QuestManager: Error setting up quest state exports:', exportError.message);
            }
            
            // Register test functions for development
            try {
                this.testStory03RenJs();
            } catch (testError) {
                console.warn('QuestManager: Error registering test functions:', testError.message);
            }
            
                        this.logger?.debug('QuestManager: Final state - Active quests:', Array.from(this.activeQuests.keys())) || Logger.debug(this.constructor.name, 'QuestManager: Final state - Active quests:', Array.from(this.activeQuests.keys()));
            this.logger?.debug('QuestManager: Final state - Available quests:', Array.from(this.availableQuests.keys())) || Logger.debug(this.constructor.name, 'QuestManager: Final state - Available quests:', Array.from(this.availableQuests.keys()));
            return true;
        } catch (error) {
            console.error('QuestManager: Initialization failed:', error);
            console.error('QuestManager: Error stack:', error.stack);
            this.initializationPromise = null;
            this.isInitialized = false;
            
                        // Try to load fallback data to prevent complete failure
            try {
                console.warn('QuestManager: Loading fallback quest data...');
                this.questDataLoader.loadFallbackData();
                await this.loadQuestTemplatesFromData();
                
                // Try to initialize basic story quests with fallback data
                try {
                    this.initializeStoryQuests();
                } catch (fallbackStoryError) {
                    console.warn('QuestManager: Could not initialize story quests with fallback data:', fallbackStoryError.message);
                }
                
                this.isInitialized = true;
                console.log('QuestManager: ✅ Fallback initialization successful');
                return true;
            } catch (fallbackError) {
                console.error('QuestManager: Fallback initialization also failed:', fallbackError);
                
                // Last resort: create minimal quest system
                try {
                    this.createMinimalQuestSystem();
                    this.isInitialized = true;
                    console.log('QuestManager: ✅ Minimal quest system created');
                    return true;
                } catch (minimalError) {
                    console.error('QuestManager: Even minimal quest system failed:', minimalError);
                    return false;
                }
            }
        }
    }

    async initializeQuests() {
                try {
            // CRITICAL FIX: Load quest data from JSON first
                        if (!this.questDataLoader) {
                console.error('QuestManager: questDataLoader not available');
                throw new Error('QuestDataLoader not available');
            }
            
            const loadResult = await this.questDataLoader.loadQuestData();
            if (loadResult) {
                            } else {
                console.warn('QuestManager: Quest data loading failed, using fallback data');
            }
            
            // Load quest data
            await this.loadQuestTemplatesFromData();
                        // Initialize story quests (auto-start if enabled)
            try {
                this.initializeStoryQuests();
            } catch (storyError) {
                console.error('QuestManager: Error initializing story quests:', storyError.message);
            }
            
            // Initialize NPC quests
            try {
                this.initializeNPCQuests();
            } catch (npcError) {
                console.error('QuestManager: Error initializing NPC quests:', npcError.message);
            }
            
                        this.logger?.debug('QuestManager: Active quests:', Array.from(this.activeQuests.keys())) || Logger.debug(this.constructor.name, 'QuestManager: Active quests:', Array.from(this.activeQuests.keys()));
            this.logger?.debug('QuestManager: Available quests:', Array.from(this.availableQuests.keys())) || Logger.debug(this.constructor.name, 'QuestManager: Available quests:', Array.from(this.availableQuests.keys()));
            
        } catch (error) {
            console.error('QuestManager: Failed to initialize quest system:', error);
            throw error;
        }
    }
    
    async loadQuestTemplatesFromData() {
        try {
            // Ensure questDataLoader is available
            if (!this.questDataLoader) {
                console.error('QuestManager: questDataLoader not available');
                throw new Error('QuestDataLoader not available');
            }
            
            // Load all quest templates from the data loader
            const allTemplates = this.questDataLoader.getAllQuestTemplates();
            
            if (!allTemplates || allTemplates.length === 0) {
                console.warn('QuestManager: No quest templates available from data loader');
                // Don't throw error, just continue with empty templates
                return;
            }
            
            allTemplates.forEach(template => {
                this.questTemplates.set(template.id, template);
            });
            
                    } catch (error) {
            console.error('QuestManager: Error loading quest templates:', error);
            throw error;
        }
    }
    
    initializeStoryQuests() {
        try {
            // Get story quests and start auto-start quests
            const storyQuests = this.questDataLoader.getStoryQuests();
            const settings = this.questDataLoader.getQuestSettings();
            
                                                if (!storyQuests || storyQuests.length === 0) {
                console.warn('QuestManager: No story quests available to initialize');
                return;
            }
            
            if (!settings) {
                console.warn('QuestManager: Quest settings not available, using defaults');
                return;
            }
            
            if (settings.autoStartStoryQuests) {
                storyQuests.forEach(quest => {
                    try {
                                                                        // Don't auto-start if already completed or active
                        if (this.completedQuests.has(quest.id)) {
                                                        return;
                        }
                        
                        if (this.activeQuests.has(quest.id)) {
                                                        return;
                        }
                        
                        // Don't auto-start if template is marked as completed
                        const template = this.questTemplates.get(quest.id);
                        if (template && template.status === 'completed') {
                                                        return;
                        }
                        
                        if (quest.autoStart) {
                                                        const startResult = this.startQuest(quest.id);
                            if (startResult) {
                                                            } else {
                                console.error(`QuestManager: ❌ Failed to auto-start story quest: ${quest.title}`);
                            }
                        } else {
                                                    }
                    } catch (questError) {
                        console.error(`QuestManager: Error processing story quest ${quest.id}:`, questError.message);
                    }
                });
            } else {
                            }
            
                        this.logger?.debug('QuestManager: Active quests after initialization:', Array.from(this.activeQuests.keys())) || Logger.debug(this.constructor.name, 'QuestManager: Active quests after initialization:', Array.from(this.activeQuests.keys()));
        } catch (error) {
            console.error('QuestManager: Error in initializeStoryQuests:', error);
            throw error;
        }
    }
    
    initializeNPCQuests() {
        // Make NPC quests available based on requirements
        const npcQuests = this.questDataLoader.getQuestTemplatesByCategory('npc');
        
        npcQuests.forEach(quest => {
            // Don't add to available if already completed or active
            if (this.completedQuests.has(quest.id)) {
                                return;
            }
            
            if (this.activeQuests.has(quest.id)) {
                                return;
            }
            
            // Don't add if template is marked as completed
            const template = this.questTemplates.get(quest.id);
            if (template && template.status === 'completed') {
                                return;
            }
            
            if (this.checkRequirements(quest.requirements)) {
                this.availableQuests.set(quest.id, quest);
                            }
        });
    }

    startQuest(questId) {
        const questTemplate = this.questTemplates.get(questId);
        if (!questTemplate) {
            console.warn('QuestManager: Quest template not found:', questId);
            return false;
        }

        // Create active quest instance
        const activeQuest = {
            ...questTemplate,
            status: this.QUEST_STATUS.ACTIVE,
            dateStarted: new Date(),
            objectives: questTemplate.objectives.map(obj => ({ ...obj }))
        };

        this.activeQuests.set(questId, activeQuest);
        this.availableQuests.delete(questId);

                // Emit quest started event for UI updates
        if (this.scene && this.scene.events) {
            this.scene.events.emit('quest-started', { questId, quest: activeQuest });
                    }
        
        return true;
    }

    completeObjective(questId, objectiveId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) {
                        return false;
        }

        const objective = quest.objectives.find(obj => obj.id === objectiveId);
        if (!objective) {
                        return false;
        }

        // Don't complete if already completed
        if (objective.completed) {
                        return false;
        }

        objective.completed = true;
        if (import.meta.env.DEV) console.log(`QuestManager: Objective completed: ${objectiveId} for quest ${questId}`);
        
        // CRITICAL FIX: Emit objective completion events globally for UI updates
        const eventData = { questId, objectiveId, objective };
        
        // Emit on the scene's local bus for any scene-specific listeners
        if (this.scene && this.scene.events) {
            this.scene.events.emit('quest-objective-completed', eventData);
            this.scene.events.emit('quest-objective-updated', eventData);
        }
        
        // Emit on the game's global bus for cross-scene UI updates (like QuestTrackerUI)
        if (this.scene && this.scene.game && this.scene.game.events) {
            this.scene.game.events.emit('quest-objective-completed', eventData);
            this.scene.game.events.emit('quest-objective-updated', eventData);
                    }
        
        this.checkQuestCompletion(questId);
        return true;
    }

    checkQuestCompletion(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return false;

        const allComplete = quest.objectives.every(obj => obj.completed);
        if (allComplete) {
            this.completeQuest(questId);
        }
        return allComplete;
    }

    completeQuest(questId) {
                const quest = this.activeQuests.get(questId);
        if (!quest) {
            console.warn('QuestManager: Quest not found or not active:', questId);
            return false;
        }

        // Mark quest as completed
        quest.status = 'completed';
        quest.completedAt = Date.now();
        
        // Move from active to completed
        this.activeQuests.delete(questId);
        this.completedQuests.add(questId);
        
        if (import.meta.env.DEV) console.log(`QuestManager: Quest completed: ${questId}`);
        
        // Give rewards
        this.giveQuestRewards(quest);
        
        // Check for unlocking new quests
        this.checkUnlockNewQuests(questId);
        
        // Emit completion event
        this.scene.events.emit('quest-completed', {
            questId: questId,
            quest: quest,
            timestamp: Date.now()
        });
        
        // Add to rewards queue for UI display
        this.rewardsToShow.push(questId);
        
        // Show quest reward UI immediately
        this.showQuestRewardUI(quest);
        
        // Check if this should trigger a story dialog
        this.checkStoryDialogTriggers(questId);
        
        // Check if this completes the tutorial sequence
        if (questId === 'story_001_tutorial') {
                        // Check if we should move to next story quest
            if (this.questTemplates.has('story_002_first_companion') && 
                !this.activeQuests.has('story_002_first_companion') &&
                !this.completedQuests.has('story_002_first_companion')) {
                                this.startQuest('story_002_first_companion');
            }
        }
        
        // Clean up quest states to ensure no duplicates
        this.cleanupQuestStates();
        
        return true;
    }

    /**
     * Get the list of rewards pending to be shown and clear the queue.
     * @returns {string[]} An array of quest IDs for which rewards should be shown.
     */
    getAndClearPendingRewards() {
        const rewards = [...this.rewardsToShow];
        this.rewardsToShow = [];
                return rewards;
    }

    calculateRewardSummary(quest) {
        const summary = {
            experience: { gained: 0, levelBefore: 0, levelAfter: 0 },
            coins: 0,
            items: [],
            achievements: [],
            romance: {},
            questProgression: { completed: quest.title, unlocked: [] }
        };

        if (quest.rewards) {
            // Experience rewards
            if (quest.rewards.experience) {
                summary.experience.gained = quest.rewards.experience;
                summary.experience.levelBefore = this.getPlayerLevel();
                summary.experience.levelAfter = this.getPlayerLevel();
            }
            
            // Coin rewards
            if (quest.rewards.coins) {
                summary.coins = quest.rewards.coins;
            }
            
            // Item rewards
            if (quest.rewards.items) {
                summary.items = quest.rewards.items.map(itemId => ({
                    id: itemId,
                    name: this.getItemDisplayName(itemId),
                    description: this.getItemDescription(itemId),
                    rarity: this.getItemRarity(itemId)
                }));
            }
            
            // Romance rewards
            if (quest.rewards.romance) {
                summary.romance = quest.rewards.romance;
            }
        }

        return summary;
    }

    giveQuestRewards(quest) {
        if (!quest.rewards) return;

        // Give experience
        if (quest.rewards.experience) {
            this.addPlayerExperience(quest.rewards.experience);
        }
        
        // Give coins
        if (quest.rewards.coins) {
            this.addPlayerCoins(quest.rewards.coins);
        }
        
        // Give items (would integrate with inventory system)
        if (quest.rewards.items) {
            quest.rewards.items.forEach(itemId => {
                            });
        }
        
        // Give romance points
        if (quest.rewards.romance) {
            Object.entries(quest.rewards.romance).forEach(([npcId, points]) => {
                            });
        }
    }

    checkUnlockNewQuests(completedQuestId) {
        const completedQuest = this.questTemplates.get(completedQuestId);
        if (completedQuest?.unlocks) {
            completedQuest.unlocks.forEach(questId => {
                const questTemplate = this.questTemplates.get(questId);
                if (questTemplate && this.checkRequirements(questTemplate.requirements)) {
                    // Don't unlock if already completed or active
                    if (this.completedQuests.has(questId)) {
                                                return;
                    }
                    
                    if (this.activeQuests.has(questId)) {
                                                return;
                    }
                    
                    this.availableQuests.set(questId, questTemplate);
                                    }
            });
        }
    }

    checkRequirements(requirements) {
        if (!requirements) return true;
        
        if (Array.isArray(requirements)) {
            // Handle array format (list of quest IDs)
            return requirements.every(questId => 
                this.completedQuests.has(questId)
            );
        }
        
        if (requirements.completedQuests) {
            return requirements.completedQuests.every(questId => 
                this.completedQuests.has(questId)
            );
        }
        
        return true;
    }

    getActiveQuests() {
        return Array.from(this.activeQuests.values());
    }

    getAvailableQuests() {
        return Array.from(this.availableQuests.values());
    }

    getCompletedQuests() {
        return Array.from(this.completedQuests).map(questId => 
            this.questTemplates.get(questId)
        ).filter(Boolean);
    }

    getQuestsByType(type) {
        // Get all active and available quests, but exclude completed ones
        const allQuests = [
            ...this.getActiveQuests(),
            ...this.getAvailableQuests()
        ];
        
        // Filter by type if specified, otherwise return all non-completed quests
        if (type && type !== 'all') {
            return allQuests.filter(quest => quest.type === type);
        }
        
        return allQuests;
    }

    findQuestById(questId) {
        return this.activeQuests.get(questId) || 
               this.availableQuests.get(questId) || 
               (this.completedQuests.has(questId) ? this.questTemplates.get(questId) : null);
    }

    getQuestData(questId) {
        const quest = this.findQuestById(questId);
        if (!quest) {
            const template = this.questTemplates.get(questId);
            return template || null;
        }
        return quest;
    }

    getQuestProgress(questId, objectiveId) {
        const quest = this.findQuestById(questId);
        if (!quest) return 0;
        
        const objective = quest.objectives?.find(obj => obj.id === objectiveId);
        if (!objective) return 0;
        
        return objective.progress || (objective.completed ? 1 : 0);
    }

    showQuestLog() {
                try {
            this.scene.scene.launch('QuestScene', {
                callingScene: this.scene.scene.key,
                questManager: this
            });
        } catch (error) {
            console.error('QuestManager: Error opening quest log:', error);
        }
    }

    // Event handlers for quest progression
    onFishCaught(fishData) {
                                this.logger?.debug('QuestManager: Completed quests:', Array.from(this.completedQuests)) || Logger.debug(this.constructor.name, 'QuestManager: Completed quests:', Array.from(this.completedQuests));
        
        // Process fish caught objectives for active quests
        this.activeQuests.forEach((quest, questId) => {
            if (quest.objectives) {
                quest.objectives.forEach(objective => {
                    if (!objective.completed) {
                        // Check if this objective should be completed by catching fish
                        if (objective.id === 'catch_first_fish' || 
                            objective.id === 'catch_with_technique' ||
                            objective.type === 'catch_fish') {
                                                        this.completeObjective(questId, objective.id);
                        }
                    }
                });
            }
        });
    }

    onRomanceMeterChanged(npcId, newValue) {
                this.activeQuests.forEach(quest => {
            quest.objectives.forEach(objective => {
                if (objective.type === 'romance' && !objective.completed) {
                    if (objective.target === npcId && newValue >= objective.value) {
                        this.completeObjective(quest.id, objective.id);
                    }
                }
            });
        });
    }

    onDialogCompleted(npcId, choiceData) {
                // CRITICAL FIX: Only complete dialog objectives if quests are still active
        // Objective for 'Meeting New Friends'
        if (npcId === 'mia' && this.activeQuests.has('story_002_first_companion')) {
                        this.completeObjective('story_002_first_companion', 'talk_to_mia');
            this.completeObjective('story_002_first_companion', 'learn_fishing_technique');
        } else if (npcId === 'mia') {
                    }
    }

    onCast(castData) {
                // Process cast objectives for active quests
        this.activeQuests.forEach((quest, questId) => {
            if (quest.objectives) {
                quest.objectives.forEach(objective => {
                    if (!objective.completed) {
                        // Check if this objective should be completed by casting
                        if (objective.id === 'cast_first_time' || 
                            objective.type === 'cast_line') {
                                                        this.completeObjective(questId, objective.id);
                        }
                    }
                });
            }
        });
    }

    onBoatMenuAccessed() {
        try {
                                    this.logger?.debug('QuestManager: Active quest IDs:', Array.from(this.activeQuests.keys())) || Logger.debug(this.constructor.name, 'QuestManager: Active quest IDs:', Array.from(this.activeQuests.keys()));
            this.logger?.debug('QuestManager: Completed quests:', Array.from(this.completedQuests)) || Logger.debug(this.constructor.name, 'QuestManager: Completed quests:', Array.from(this.completedQuests));
            
            // CRITICAL FIX: Check if tutorial quest is specifically active
            const tutorialQuest = this.activeQuests.get('story_001_tutorial');
            if (!tutorialQuest) {
                                return;
            }
            
                                    // Process boat menu objectives for the tutorial quest specifically
            if (tutorialQuest.objectives) {
                tutorialQuest.objectives.forEach((objective, index) => {
                                        if (!objective.completed) {
                        // Check if this objective should be completed by accessing boat menu
                        if (objective.id === 'visit_boat_menu' || 
                            objective.id === 'access_boat_menu' ||
                            objective.type === 'ui_interaction') {
                                                        const result = this.completeObjective('story_001_tutorial', objective.id);
                                                        if (result) {
                                if (import.meta.env.DEV) console.log(`QuestManager: Completed objective ${objective.id}`);
                            } else {
                                console.warn(`QuestManager: Failed to complete objective ${objective.id}`);
                            }
                        } else {
                                                    }
                    } else {
                                            }
                });
            } else {
                console.warn(`QuestManager: Tutorial quest has no objectives`);
            }
            
            // ADDITIONAL FIX: Also process any other active quests that might have boat menu objectives
            this.activeQuests.forEach((quest, questId) => {
                if (questId !== 'story_001_tutorial') { // Skip tutorial quest as we handled it above
                                        if (quest.objectives) {
                        quest.objectives.forEach((objective, index) => {
                            if (!objective.completed) {
                                // Check if this objective should be completed by accessing boat menu
                                if (objective.id === 'visit_boat_menu' || 
                                    objective.id === 'access_boat_menu' ||
                                    objective.type === 'visit_location' ||
                                    objective.type === 'ui_interaction') {
                                                                        const result = this.completeObjective(questId, objective.id);
                                                                    }
                            }
                        });
                    }
                }
            });
            
                    } catch (error) {
            console.error('QuestManager: ❌ ERROR in onBoatMenuAccessed method:', error);
            console.error('QuestManager: Error stack:', error.stack);
            
            // Try manual completion as fallback
            try {
                                const result = this.completeObjective('story_001_tutorial', 'visit_boat_menu');
                            } catch (fallbackError) {
                console.error('QuestManager: Manual fallback also failed:', fallbackError);
            }
        }
    }

    showQuestRewardUI(quest) {
                try {
            // Try Phaser-based UI first (better integration with game)
            if (this.scene && this.scene.add && this.scene.cameras) {
                                this.createPhaserRewardUI(quest);
            } else {
                                this.createDOMRewardUI(quest);
            }
        } catch (error) {
                                    if (quest.rewards) {
                            }
        }
    }

    createPhaserRewardUI(quest) {
        const scene = this.scene;
        const width = scene.cameras.main.width;
        const height = scene.cameras.main.height;
        
        // Create overlay container
        const overlay = scene.add.container(0, 0);
        overlay.setDepth(10000); // Ensure it's on top
        
        // Background
        const bg = scene.add.rectangle(0, 0, width, height, 0x000000, 0.8);
        bg.setOrigin(0);
        bg.setInteractive();
        overlay.add(bg);
        
        // Panel
        const panelWidth = Math.min(600, width - 40);
        const panelHeight = Math.min(500, height - 40);
        const centerX = width / 2;
        const centerY = height / 2;
        
        const panel = scene.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x1a1a1a, 0.95);
        panel.setStrokeStyle(3, 0xFFD700);
        overlay.add(panel);
        
        // Title
        const title = scene.add.text(centerX, centerY - panelHeight/2 + 40, '🎉 QUEST COMPLETED! 🎉', {
            fontSize: '28px',
            fill: '#FFD700',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        overlay.add(title);
        
        // Quest name
        const questName = scene.add.text(centerX, centerY - panelHeight/2 + 80, quest.title, {
            fontSize: '20px',
            fill: '#FFFFFF',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        overlay.add(questName);
        
        // Quest description
        if (quest.description) {
            const description = scene.add.text(centerX, centerY - panelHeight/2 + 110, quest.description, {
                fontSize: '14px',
                fill: '#CCCCCC',
                fontFamily: 'Arial',
                align: 'center',
                wordWrap: { width: panelWidth - 60 }
            }).setOrigin(0.5);
            overlay.add(description);
        }
        
        // Rewards display
        let currentY = centerY - 60;
        
        if (quest.rewards) {
            // Experience
            if (quest.rewards.experience) {
                const expText = scene.add.text(centerX, currentY, `📈 Experience: +${quest.rewards.experience}`, {
                    fontSize: '16px',
                    fill: '#00FF00',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
                overlay.add(expText);
                currentY += 30;
            }
            
            // Coins
            if (quest.rewards.coins) {
                const coinText = scene.add.text(centerX, currentY, `💰 Coins: +${quest.rewards.coins}`, {
                    fontSize: '16px',
                    fill: '#FFD700',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
                overlay.add(coinText);
                currentY += 30;
            }
            
            // Items
            if (quest.rewards.items && quest.rewards.items.length > 0) {
                const itemsText = quest.rewards.items.join(', ');
                const itemText = scene.add.text(centerX, currentY, `🎁 Items: ${itemsText}`, {
                    fontSize: '16px',
                    fill: '#FFFFFF',
                    fontFamily: 'Arial',
                    wordWrap: { width: panelWidth - 60 }
                }).setOrigin(0.5);
                overlay.add(itemText);
                currentY += 30;
            }
            
            // Romance points
            if (quest.rewards.romance) {
                Object.entries(quest.rewards.romance).forEach(([npcId, points]) => {
                    const romanceText = scene.add.text(centerX, currentY, `💕 ${npcId}: +${points} romance`, {
                        fontSize: '16px',
                        fill: '#FF69B4',
                        fontFamily: 'Arial'
                    }).setOrigin(0.5);
                    overlay.add(romanceText);
                    currentY += 25;
                });
            }
        }
        
        // Progress indicator
        const progressText = scene.add.text(centerX, currentY + 20, 'Quest Progress: 1 quest completed', {
            fontSize: '14px',
            fill: '#888888',
            fontStyle: 'italic',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        overlay.add(progressText);
        
        // Close button
        const closeButton = scene.add.rectangle(centerX, centerY + panelHeight/2 - 40, 150, 40, 0xFFD700, 0.9);
        closeButton.setStrokeStyle(2, 0xFFFFFF);
        const closeText = scene.add.text(centerX, centerY + panelHeight/2 - 40, 'Continue', {
            fontSize: '16px',
            fill: '#000000',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        overlay.add(closeButton);
        overlay.add(closeText);
        
        // Make interactive
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.on('pointerdown', () => {
                        overlay.destroy();
        });
        
        // Also allow clicking background to close
        bg.on('pointerdown', () => {
                        overlay.destroy();
        });
        
        // Animate in
        overlay.setAlpha(0);
        scene.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
        
        // Add hover effects to close button
        closeButton.on('pointerover', () => {
            closeButton.setFillStyle(0xFFE55C);
            closeText.setScale(1.05);
        });
        
        closeButton.on('pointerout', () => {
            closeButton.setFillStyle(0xFFD700);
            closeText.setScale(1.0);
        });
        
                return true;
    }

    createDOMRewardUI(quest) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); display: flex; justify-content: center; 
            align-items: center; z-index: 10000; font-family: Arial;
        `;
        
        const panel = document.createElement('div');
        panel.style.cssText = `
            background: #2c3e50; border: 3px solid #f39c12; border-radius: 15px;
            padding: 30px; color: white; text-align: center; max-width: 400px;
        `;
        
        panel.innerHTML = `
            <h2 style="color: #f39c12; margin: 0 0 20px 0;">🎉 Quest Complete! 🎉</h2>
            <h3 style="color: white; margin: 0 0 20px 0;">${quest.title}</h3>
            <div style="margin: 20px 0;">
                <div style="color: #00FF00; margin: 10px 0;">📈 Experience: +${quest.rewards?.experience || 0}</div>
                <div style="color: #FFD700; margin: 10px 0;">💰 Coins: +${quest.rewards?.coins || 0}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: #f39c12; color: white; border: none; padding: 12px 24px; 
                           border-radius: 6px; font-size: 16px; cursor: pointer;">Continue</button>
        `;
        
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        
        return true;
    }

    // Utility methods
    getPlayerLevel() { return 1; }
    getPlayerExperience() { return 0; }
    getPlayerCoins() { return 0; }
    addPlayerExperience(amount) { this.logger?.debug('Added experience:', amount) || Logger.debug(this.constructor.name, 'Added experience:', amount); }
    addPlayerCoins(amount) { this.logger?.debug('Added coins:', amount) || Logger.debug(this.constructor.name, 'Added coins:', amount); }
    
    getItemDisplayName(itemId) { return itemId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }
    getItemDescription(itemId) { return `A ${this.getItemDisplayName(itemId)}`; }
    getItemRarity(itemId) { return 'common'; }

    registerRenJsCommands() {
        this.renjsCallbacks.set('startQuest', (questId) => this.startQuest(questId));
        this.renjsCallbacks.set('completeQuest', (questId) => this.completeQuest(questId));
        this.renjsCallbacks.set('completeObjective', (questId, objectiveId) => 
            this.completeObjective(questId, objectiveId));
    }

    setupQuestStateExports() {
        this.questStateExports.set('tutorialComplete', () => this.completedQuests.has('story_001_tutorial'));
        this.questStateExports.set('companionMet', () => this.completedQuests.has('story_002_first_companion'));
    }

    executeRenJsCommand(command, ...args) {
        const callback = this.renjsCallbacks.get(command);
        if (callback) {
            try {
                const result = callback(...args);
                                return result;
            } catch (error) {
                console.error(`QuestManager: Error executing RenJs command '${command}':`, error);
                return false;
            }
        } else {
            console.warn(`QuestManager: Unknown RenJs command: ${command}`);
            return false;
        }
    }

    getQuestStateForRenJs(stateKey) {
        const stateFunction = this.questStateExports.get(stateKey);
        if (stateFunction) {
            try {
                return stateFunction();
            } catch (error) {
                console.error(`QuestManager: Error getting quest state '${stateKey}':`, error);
                return false;
            }
        }
        return null;
    }

    exportForRenJs() {
        return {
            getQuestState: (stateKey) => this.getQuestStateForRenJs(stateKey),
            isQuestActive: (questId) => this.activeQuests.has(questId),
            isQuestCompleted: (questId) => this.completedQuests.has(questId),
            executeCommand: (command, ...args) => this.executeRenJsCommand(command, ...args),
            startQuest: (questId) => this.startQuest(questId),
            completeObjective: (questId, objectiveId) => 
                this.completeObjective(questId, objectiveId)
        };
    }

    // === NEW JSON-BASED QUEST METHODS ===

    /**
     * Generate and add daily quests
     */
    generateDailyQuests() {
        const dailyQuests = this.questDataLoader.generateDailyQuests();
        dailyQuests.forEach(quest => {
            this.addQuest(quest);
        });
        return dailyQuests;
    }

    /**
     * Generate and add weekly quests
     */
    generateWeeklyQuests() {
        const weeklyQuests = this.questDataLoader.generateWeeklyQuests();
        weeklyQuests.forEach(quest => {
            this.addQuest(quest);
        });
        return weeklyQuests;
    }

    /**
     * Add a quest to the system (from JSON data or generated)
     */
    addQuest(questData) {
        // Add to templates if not already there
        if (!this.questTemplates.has(questData.id)) {
            this.questTemplates.set(questData.id, questData);
        }
        
        // CRITICAL FIX: Don't add to available quests if already completed or active
        if (this.completedQuests.has(questData.id)) {
                        return questData;
        }
        
        if (this.activeQuests.has(questData.id)) {
                        return questData;
        }
        
        // ADDITIONAL CHECK: Don't add if template is marked as completed
        const existingTemplate = this.questTemplates.get(questData.id);
        if (existingTemplate && existingTemplate.status === 'completed') {
                        return questData;
        }
        
        // Add to available quests if requirements are met and not already completed/active
        if (this.checkRequirements(questData.requirements)) {
            this.availableQuests.set(questData.id, questData);
                    }
        
        return questData;
    }

    /**
     * Get quests for a specific NPC
     */
    getQuestsForNPC(npcId) {
        return this.questDataLoader.getNPCQuests(npcId);
    }

    /**
     * Get active event quests
     */
    getActiveEventQuests() {
        return this.questDataLoader.getActiveEventQuests();
    }

    /**
     * Get quest chains
     */
    getQuestChains() {
        return this.questDataLoader.getAllQuestChains();
    }

    /**
     * Start a quest chain
     */
    startQuestChain(chainId) {
        const chain = this.questDataLoader.getQuestChain(chainId);
        if (!chain || !chain.quests || chain.quests.length === 0) {
            console.warn(`QuestManager: Quest chain not found or empty: ${chainId}`);
            return false;
        }

        // Start the first quest in the chain
        const firstQuest = chain.quests[0];
        const questToStart = {
            ...firstQuest,
            chainId: chainId,
            chainQuest: true
        };

        return this.startQuest(questToStart.id);
    }

    /**
     * Get quest data statistics
     */
    getQuestStatistics() {
        return this.questDataLoader.getQuestStatistics();
    }

    /**
     * Clean up duplicate quests and ensure state consistency
     */
    cleanupQuestStates() {
                // Remove completed quests from available quests
        const completedQuestIds = Array.from(this.completedQuests);
        completedQuestIds.forEach(questId => {
            if (this.availableQuests.has(questId)) {
                this.availableQuests.delete(questId);
                            }
            
            // Mark template as completed to prevent re-adding
            const template = this.questTemplates.get(questId);
            if (template && template.status !== 'completed') {
                template.status = 'completed';
                template.dateCompleted = new Date();
                            }
        });
        
        // Remove active quests from available quests
        const activeQuestIds = Array.from(this.activeQuests.keys());
        activeQuestIds.forEach(questId => {
            if (this.availableQuests.has(questId)) {
                this.availableQuests.delete(questId);
                            }
        });
        
        // Remove any quests from available that have completed status in template
        const availableQuestIds = Array.from(this.availableQuests.keys());
        availableQuestIds.forEach(questId => {
            const template = this.questTemplates.get(questId);
            if (template && template.status === 'completed') {
                this.availableQuests.delete(questId);
                            }
        });
        
            }
    
    /**
     * Debug method to log all quest states
     */
    debugQuestStates() {
                this.logger?.debug('Active Quests:', Array.from(this.activeQuests.keys())) || Logger.debug(this.constructor.name, 'Active Quests:', Array.from(this.activeQuests.keys()));
        this.logger?.debug('Available Quests:', Array.from(this.availableQuests.keys())) || Logger.debug(this.constructor.name, 'Available Quests:', Array.from(this.availableQuests.keys()));
        this.logger?.debug('Completed Quests:', Array.from(this.completedQuests)) || Logger.debug(this.constructor.name, 'Completed Quests:', Array.from(this.completedQuests));
        this.logger?.debug('Quest Templates:', Array.from(this.questTemplates.keys())) || Logger.debug(this.constructor.name, 'Quest Templates:', Array.from(this.questTemplates.keys()));
        
        // Check for duplicates
        const activeIds = Array.from(this.activeQuests.keys());
        const availableIds = Array.from(this.availableQuests.keys());
        const completedIds = Array.from(this.completedQuests);
        
        const duplicatesActiveAvailable = activeIds.filter(id => availableIds.includes(id));
        const duplicatesActiveCompleted = activeIds.filter(id => completedIds.includes(id));
        const duplicatesAvailableCompleted = availableIds.filter(id => completedIds.includes(id));
        
        if (duplicatesActiveAvailable.length > 0) {
            console.warn('DUPLICATE: Active & Available:', duplicatesActiveAvailable);
        }
        if (duplicatesActiveCompleted.length > 0) {
            console.warn('DUPLICATE: Active & Completed:', duplicatesActiveCompleted);
        }
        if (duplicatesAvailableCompleted.length > 0) {
            console.warn('DUPLICATE: Available & Completed:', duplicatesAvailableCompleted);
        }
        
            }

    /**
     * Trigger a story dialog with RenJs support
     * @param {string} storyId - Story dialog ID (e.g., 'Story03')
     * @param {string} npcId - NPC to dialog with
     * @param {string} callingScene - Scene that initiated the dialog
     */
    triggerStoryDialog(storyId, npcId = 'mia', callingScene = 'GameScene') {
                try {
            // CRITICAL FIX: Check multiple sources for DialogManager
            let dialogManager = null;
            
            // Priority 1: Check if DialogManager is directly attached to QuestManager
            if (this.dialogManager) {
                dialogManager = this.dialogManager;
                            }
            // Priority 2: Check scene's DialogManager
            else if (this.scene && this.scene.dialogManager) {
                dialogManager = this.scene.dialogManager;
                            }
            // Priority 3: Check GameState's DialogManager
            else if (this.gameState && this.gameState.dialogManager) {
                dialogManager = this.gameState.dialogManager;
                            }
            // Priority 4: Try to get it from the calling scene
            else {
                const sceneManager = this.scene.scene;
                const targetScene = sceneManager.get(callingScene);
                if (targetScene && targetScene.dialogManager) {
                    dialogManager = targetScene.dialogManager;
                                    }
            }
            
            if (!dialogManager) {
                console.error('QuestManager: DialogManager not available from any source for story dialog');
                // Show a fallback Phaser notification instead
                return this.showStoryDialogFallback(storyId, npcId, callingScene);
            }
            
            // Special handling for Story03 and above to use RenJs
            const useRenJs = storyId === 'Story03' || (storyId.startsWith('Story') && parseInt(storyId.slice(5)) >= 3);
            
            if (useRenJs) {
                                // Use the enhanced startDialog method with specificDialog parameter
                return dialogManager.startDialog(npcId, callingScene, storyId);
            } else {
                // Use standard dialog system for earlier stories
                                return dialogManager.startDialog(npcId, callingScene);
            }
            
        } catch (error) {
            console.error('QuestManager: Error triggering story dialog:', error);
            // Show fallback notification
            return this.showStoryDialogFallback(storyId, npcId, callingScene);
        }
    }

    /**
     * Show a fallback Phaser notification when DialogManager is not available
     * @param {string} storyId - Story dialog ID
     * @param {string} npcId - NPC ID
     * @param {string} callingScene - Calling scene
     */
    showStoryDialogFallback(storyId, npcId, callingScene) {
        try {
                        if (!this.scene || !this.scene.add) {
                console.warn('QuestManager: Scene not available for fallback notification');
                return false;
            }
            
            const scene = this.scene;
            const width = scene.cameras.main.width;
            const height = scene.cameras.main.height;
            
            // Create notification overlay
            const overlay = scene.add.container(0, 0);
            overlay.setDepth(10000);
            
            // Background
            const bg = scene.add.rectangle(0, 0, width, height, 0x000000, 0.5);
            bg.setOrigin(0);
            bg.setInteractive();
            overlay.add(bg);
            
            // Notification panel
            const panelWidth = Math.min(500, width - 40);
            const panelHeight = 200;
            const centerX = width / 2;
            const centerY = height / 2;
            
            const panel = scene.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x34495e, 0.95);
            panel.setStrokeStyle(3, 0xe74c3c);
            overlay.add(panel);
            
            // Title
            const title = scene.add.text(centerX, centerY - 60, '📖 Story Update', {
                fontSize: '20px',
                fill: '#e74c3c',
                fontStyle: 'bold',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
            overlay.add(title);
            
            // Story content
            const storyMessages = {
                'Story02': 'Your fishing journey continues! You\'ve completed the tutorial and are ready for new adventures.',
                'Story03': 'You\'ve met your first fishing companion! They will guide you to become a better angler.',
                'Story04': 'Your skills are improving! New fishing areas and challenges await you.',
                'Story05': 'You\'ve discovered new waters! Rare fish and greater challenges lie ahead.',
                'Story06': 'A legendary challenge approaches! Prepare yourself for the ultimate fishing test.'
            };
            
            const message = storyMessages[storyId] || `Story chapter ${storyId} has been unlocked! Continue your fishing adventure.`;
            
            const messageText = scene.add.text(centerX, centerY - 10, message, {
                fontSize: '16px',
                fill: '#FFFFFF',
                fontFamily: 'Arial',
                align: 'center',
                wordWrap: { width: panelWidth - 40 }
            }).setOrigin(0.5);
            overlay.add(messageText);
            
            // Continue button
            const continueButton = scene.add.rectangle(centerX, centerY + 50, 120, 35, 0xe74c3c, 0.9);
            continueButton.setStrokeStyle(2, 0xFFFFFF);
            const continueText = scene.add.text(centerX, centerY + 50, 'Continue', {
                fontSize: '16px',
                fill: '#FFFFFF',
                fontStyle: 'bold',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
            
            overlay.add(continueButton);
            overlay.add(continueText);
            
            // Make interactive
            continueButton.setInteractive({ useHandCursor: true });
            continueButton.on('pointerdown', () => {
                                overlay.destroy();
            });
            
            // Also allow clicking background to close
            bg.on('pointerdown', () => {
                                overlay.destroy();
            });
            
            // Animate in
            overlay.setAlpha(0);
            scene.tweens.add({
                targets: overlay,
                alpha: 1,
                duration: 300,
                ease: 'Power2'
            });
            
            // Add hover effects
            continueButton.on('pointerover', () => {
                continueButton.setFillStyle(0xc0392b);
                continueText.setScale(1.05);
            });
            
            continueButton.on('pointerout', () => {
                continueButton.setFillStyle(0xe74c3c);
                continueText.setScale(1.0);
            });
            
                        return true;
            
        } catch (error) {
            console.error('QuestManager: Error creating story fallback notification:', error);
            return false;
        }
    }

    /**
     * Check if a story dialog should be triggered based on quest completion
     * @param {string} questId - Completed quest ID
     */
    checkStoryDialogTriggers(questId) {
        const storyDialogMappings = {
            'story_001_tutorial': 'Story02',
            'story_002_first_companion': 'Story03',
            'story_003_companion_intro': 'Story04',
            'story_004_new_waters': 'Story05',
            'story_005_first_boss': 'Story06'
        };
        
        const storyId = storyDialogMappings[questId];
        if (storyId) {
                        // Determine NPC for the story dialog with fallbacks
            let npcId = 'captain'; // Default fallback
            
            // Map specific stories to appropriate NPCs
            if (storyId === 'Story02') npcId = 'captain';
            if (storyId === 'Story03') npcId = 'mia';
            if (storyId === 'Story04') npcId = 'mia';
            if (storyId === 'Story05') npcId = 'sophie';
            if (storyId === 'Story06') npcId = 'luna';
            if (storyId === 'Story07') npcId = 'luna';
            
                        // Delay the dialog trigger slightly to allow quest completion UI to show
            setTimeout(() => {
                try {
                    const result = this.triggerStoryDialog(storyId, npcId, 'GameScene');
                    if (!result) {
                        console.warn(`QuestManager: Failed to trigger ${storyId} with ${npcId}, trying fallback`);
                        // Try with a different NPC as fallback
                        const fallbackNpcs = ['mia', 'sophie', 'luna', 'captain'];
                        for (const fallbackNpc of fallbackNpcs) {
                            if (fallbackNpc !== npcId) {
                                                                const fallbackResult = this.triggerStoryDialog(storyId, fallbackNpc, 'GameScene');
                                if (fallbackResult) {
                                    if (import.meta.env.DEV) console.log(`QuestManager: Fallback story dialog ${storyId} triggered with ${fallbackNpc}`);
                                    break;
                                }
                            }
                        }
                    } else {
                        if (import.meta.env.DEV) console.log(`QuestManager: Story dialog ${storyId} triggered successfully with ${npcId}`);
                    }
                } catch (error) {
                    console.error(`QuestManager: Error triggering story dialog ${storyId}:`, error);
                }
            }, 2000);
        }
    }

    /**
     * Test function to trigger Story03 with RenJs (for development/testing)
     * Call from browser console: window.testStory03RenJs()
     */
    testStory03RenJs() {
                // Only register the global function, don't trigger immediately
        if (typeof window !== 'undefined') {
            window.testStory03RenJs = () => {
                                // CRITICAL FIX: Check multiple sources for DialogManager
                let dialogManager = null;
                
                // Priority 1: Check if DialogManager is directly attached to QuestManager
                if (this.dialogManager) {
                    dialogManager = this.dialogManager;
                                    }
                // Priority 2: Check scene's DialogManager
                else if (this.scene && this.scene.dialogManager) {
                    dialogManager = this.scene.dialogManager;
                                    }
                // Priority 3: Check GameState's DialogManager
                else if (this.gameState && this.gameState.dialogManager) {
                    dialogManager = this.gameState.dialogManager;
                                    }
                // Priority 4: Try to get it from GameScene
                else {
                    try {
                        const gameScene = window.game?.scene?.getScene('GameScene');
                        if (gameScene?.dialogManager) {
                            dialogManager = gameScene.dialogManager;
                                                    }
                    } catch (sceneError) {
                        console.warn('QuestManager: Could not access GameScene:', sceneError.message);
                    }
                }
                
                if (!dialogManager) {
                    console.error('QuestManager: DialogManager not available from any source for story dialog');
                    return false;
                }
                
                // Trigger the story dialog
                return this.triggerStoryDialog('Story03', 'mia', 'GameScene');
            };
                    }
        
        // Don't trigger immediately during initialization
        return true;
    }
}