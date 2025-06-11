import { questDataLoader } from './QuestDataLoader.js';

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
        
        // Quest data loader reference
        this.questDataLoader = questDataLoader;
        
        // Tutorial completion tracking
        this.tutorialQuestsCompleted = false;
        
        console.log('QuestManager: Initialized successfully');
        this.initializeQuests();
        this.registerRenJsCommands();
        this.setupQuestStateExports();
    }

    async initializeQuests() {
        console.log('QuestManager: Initializing quest system...');
        
        // Load quest data from JSON
        const loadSuccess = await this.questDataLoader.loadQuestData();
        if (!loadSuccess) {
            console.warn('QuestManager: Failed to load quest data, using fallback');
        }
        
        // Validate quest data
        const validationErrors = this.questDataLoader.validateQuestData();
        if (validationErrors.length > 0) {
            console.warn('QuestManager: Quest data validation issues found');
        }
        
        // Load quest templates from data loader
        this.loadQuestTemplatesFromData();
        
        // Initialize story quests
        this.initializeStoryQuests();
        
        // Initialize NPC quests
        this.initializeNPCQuests();
        
        console.log('QuestManager: Quest system initialized with', this.questTemplates.size, 'quest templates');
        
        // Log quest statistics
        const stats = this.questDataLoader.getQuestStatistics();
        console.log('QuestManager: Quest statistics:', stats);
        
        // Clean up any duplicate or inconsistent quest states
        this.cleanupQuestStates();
        
        // CRITICAL FIX: Validate tutorial completion status after all quests are loaded
        this.validateTutorialCompletionStatus();
        
        // Debug quest states after initialization
        this.debugQuestStates();
        
        console.log('QuestManager: Tutorial quests completed status:', this.tutorialQuestsCompleted);
        
        // EXTENSIVE DEBUG: Log all quest states
        console.log('=== QUEST MANAGER FINAL INITIALIZATION DEBUG ===');
        console.log('Active quests:', Array.from(this.activeQuests.keys()));
        console.log('Available quests:', Array.from(this.availableQuests.keys()));  
        console.log('Completed quests:', Array.from(this.completedQuests));
        console.log('Quest templates:', Array.from(this.questTemplates.keys()));
        console.log('Tutorial flag set:', this.tutorialQuestsCompleted);
        console.log('=== END QUEST MANAGER INITIALIZATION DEBUG ===');
    }
    
    loadQuestTemplatesFromData() {
        // Load all quest templates from the data loader
        const allTemplates = this.questDataLoader.getAllQuestTemplates();
        allTemplates.forEach(template => {
            this.questTemplates.set(template.id, template);
        });
        
        console.log(`QuestManager: Loaded ${allTemplates.length} quest templates from JSON data`);
    }
    
    initializeStoryQuests() {
        // Get story quests and start auto-start quests
        const storyQuests = this.questDataLoader.getStoryQuests();
        const settings = this.questDataLoader.getQuestSettings();
        
        console.log('QuestManager: Initializing story quests...');
        console.log('QuestManager: Found', storyQuests.length, 'story quests');
        console.log('QuestManager: Auto-start setting:', settings.autoStartStoryQuests);
        
        if (settings.autoStartStoryQuests) {
            storyQuests.forEach(quest => {
                console.log(`QuestManager: Processing story quest: ${quest.title} (ID: ${quest.id})`);
                console.log(`QuestManager: Quest autoStart: ${quest.autoStart}`);
                
                // Don't auto-start if already completed or active
                if (this.completedQuests.has(quest.id)) {
                    console.log(`QuestManager: Story quest ${quest.title} already completed, skipping auto-start`);
                    return;
                }
                
                if (this.activeQuests.has(quest.id)) {
                    console.log(`QuestManager: Story quest ${quest.title} already active, skipping auto-start`);
                    return;
                }
                
                // Don't auto-start if template is marked as completed
                const template = this.questTemplates.get(quest.id);
                if (template && template.status === 'completed') {
                    console.log(`QuestManager: Story quest ${quest.title} template marked as completed, skipping auto-start`);
                    return;
                }
                
                if (quest.autoStart) {
                    console.log(`QuestManager: Starting auto-start quest: ${quest.title}`);
                    const startResult = this.startQuest(quest.id);
                    if (startResult) {
                        console.log(`QuestManager: ✅ Auto-started story quest: ${quest.title}`);
                    } else {
                        console.error(`QuestManager: ❌ Failed to auto-start story quest: ${quest.title}`);
                    }
                } else {
                    console.log(`QuestManager: Story quest ${quest.title} has autoStart=false, skipping`);
                }
            });
        } else {
            console.log('QuestManager: Auto-start story quests is disabled in settings');
        }
        
        console.log('QuestManager: Story quest initialization complete');
        console.log('QuestManager: Active quests after initialization:', Array.from(this.activeQuests.keys()));
    }
    
    initializeNPCQuests() {
        // Make NPC quests available based on requirements
        const npcQuests = this.questDataLoader.getQuestTemplatesByCategory('npc');
        
        npcQuests.forEach(quest => {
            // Don't add to available if already completed or active
            if (this.completedQuests.has(quest.id)) {
                console.log(`QuestManager: NPC quest ${quest.title} already completed, not adding to available`);
                return;
            }
            
            if (this.activeQuests.has(quest.id)) {
                console.log(`QuestManager: NPC quest ${quest.title} already active, not adding to available`);
                return;
            }
            
            // Don't add if template is marked as completed
            const template = this.questTemplates.get(quest.id);
            if (template && template.status === 'completed') {
                console.log(`QuestManager: NPC quest ${quest.title} template marked as completed, not adding to available`);
                return;
            }
            
            if (this.checkRequirements(quest.requirements)) {
                this.availableQuests.set(quest.id, quest);
                console.log(`QuestManager: Made NPC quest available: ${quest.title}`);
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

        console.log('QuestManager: Started quest:', activeQuest.title);
        
        // Emit quest started event for UI updates
        if (this.scene && this.scene.events) {
            this.scene.events.emit('quest-started', { questId, quest: activeQuest });
            console.log('QuestManager: Emitted quest-started event for:', questId);
        }
        
        return true;
    }

    completeObjective(questId, objectiveId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) {
            console.log(`QuestManager: Cannot complete objective ${objectiveId} - quest ${questId} not found in active quests`);
            return false;
        }

        const objective = quest.objectives.find(obj => obj.id === objectiveId);
        if (!objective) {
            console.log(`QuestManager: Cannot complete objective ${objectiveId} - objective not found in quest ${questId}`);
            return false;
        }

        // Don't complete if already completed
        if (objective.completed) {
            console.log(`QuestManager: Objective ${objectiveId} in quest ${questId} already completed, skipping`);
            return false;
        }

        objective.completed = true;
        console.log('QuestManager: Objective completed:', objectiveId);
        
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
            console.log('QuestManager: 📢 Emitted global quest objective completion events');
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
            console.warn(`QuestManager: Cannot complete quest ${questId} - not found in active quests`);
            return false;
        }

        // Remove from active quests and add to completed
        this.activeQuests.delete(questId);
        this.completedQuests.add(questId);
        
        // CRITICAL FIX: Also remove from available quests to prevent duplication
        this.availableQuests.delete(questId);
        
        // ADDITIONAL FIX: Remove from quest templates to prevent re-initialization
        // (Keep template but mark it as completed in a way that prevents re-adding)
        const template = this.questTemplates.get(questId);
        if (template) {
            template.status = 'completed';
            template.dateCompleted = new Date();
        }
        
        console.log('QuestManager: Quest completed:', quest.title);
        
        // Debug: Log quest states after completion
        console.log('QuestManager: Quest states after completion:');
        console.log('- Active quests:', Array.from(this.activeQuests.keys()));
        console.log('- Available quests:', Array.from(this.availableQuests.keys()));
        console.log('- Completed quests:', Array.from(this.completedQuests));
        
        // Give quest rewards
        this.giveQuestRewards(quest);
        
        // Check for newly unlocked quests
        this.checkUnlockNewQuests(questId);
        
        // Emit quest completion event for UI updates
        if (this.scene && this.scene.events) {
            this.scene.events.emit('quest-completed', { questId, quest });
            console.log('QuestManager: Emitted quest-completed event for:', questId);
        }
        
        // CRITICAL ADDITION: Show reward UI immediately when quest completes
        console.log('QuestManager: Showing reward UI for completed quest:', quest.title);
        this.showQuestRewardUI(quest);
        
        // Check if this completes the tutorial sequence
        if (questId === 'story_001_tutorial') {
            console.log('QuestManager: Tutorial quest completed!');
            
            // Check if we should move to next story quest
            if (this.questTemplates.has('story_002_first_companion') && 
                !this.activeQuests.has('story_002_first_companion') &&
                !this.completedQuests.has('story_002_first_companion')) {
                console.log('QuestManager: Starting next story quest: story_002_first_companion');
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
        console.log('QuestManager: Cleared reward queue. Rewards given to caller:', rewards);
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
                console.log('QuestManager: Rewarded item:', itemId);
            });
        }
        
        // Give romance points
        if (quest.rewards.romance) {
            Object.entries(quest.rewards.romance).forEach(([npcId, points]) => {
                console.log(`QuestManager: Rewarded ${points} romance points with ${npcId}`);
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
                        console.log(`QuestManager: Quest ${questTemplate.title} already completed, not unlocking`);
                        return;
                    }
                    
                    if (this.activeQuests.has(questId)) {
                        console.log(`QuestManager: Quest ${questTemplate.title} already active, not unlocking`);
                        return;
                    }
                    
                    this.availableQuests.set(questId, questTemplate);
                    console.log('QuestManager: Unlocked new quest:', questTemplate.title);
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
        console.log('QuestManager: Opening quest log');
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
        console.log('QuestManager: 🐟 Fish caught event received:', fishData);
        console.log('QuestManager: Tutorial completed flag:', this.tutorialQuestsCompleted);
        console.log('QuestManager: Active quests count:', this.activeQuests.size);
        console.log('QuestManager: Completed quests:', Array.from(this.completedQuests));
        
        // Process fish caught objectives for active quests
        this.activeQuests.forEach((quest, questId) => {
            if (quest.objectives) {
                quest.objectives.forEach(objective => {
                    if (!objective.completed) {
                        // Check if this objective should be completed by catching fish
                        if (objective.id === 'catch_first_fish' || 
                            objective.id === 'catch_with_technique' ||
                            objective.type === 'catch_fish') {
                            console.log(`QuestManager: Completing objective ${objective.id} for quest ${questId}`);
                            this.completeObjective(questId, objective.id);
                        }
                    }
                });
            }
        });
    }

    onRomanceMeterChanged(npcId, newValue) {
        console.log(`QuestManager: Romance meter changed for ${npcId} to ${newValue}`);
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
        console.log('QuestManager: Dialog completed with:', npcId);
        
        // CRITICAL FIX: Only complete dialog objectives if quests are still active
        // Objective for 'Meeting New Friends'
        if (npcId === 'mia' && this.activeQuests.has('story_002_first_companion')) {
            console.log('QuestManager: First companion quest is active, completing dialog objectives');
            this.completeObjective('story_002_first_companion', 'talk_to_mia');
            this.completeObjective('story_002_first_companion', 'learn_fishing_technique');
        } else if (npcId === 'mia') {
            console.log('QuestManager: First companion quest not active, skipping dialog objective completion');
        }
    }

    onCast(castData) {
        console.log('QuestManager: Cast completed:', castData);
        
        // Process cast objectives for active quests
        this.activeQuests.forEach((quest, questId) => {
            if (quest.objectives) {
                quest.objectives.forEach(objective => {
                    if (!objective.completed) {
                        // Check if this objective should be completed by casting
                        if (objective.id === 'cast_first_time' || 
                            objective.type === 'cast_line') {
                            console.log(`QuestManager: Completing objective ${objective.id} for quest ${questId}`);
                            this.completeObjective(questId, objective.id);
                        }
                    }
                });
            }
        });
    }

    onBoatMenuAccessed() {
        try {
            console.log('QuestManager: 🚢 Boat menu accessed event received');
            console.log('QuestManager: Active quests count:', this.activeQuests.size);
            console.log('QuestManager: Active quest IDs:', Array.from(this.activeQuests.keys()));
            console.log('QuestManager: Completed quests:', Array.from(this.completedQuests));
            
            // CRITICAL FIX: Check if tutorial quest is specifically active
            const tutorialQuest = this.activeQuests.get('story_001_tutorial');
            if (!tutorialQuest) {
                console.log('QuestManager: Tutorial quest not found in active quests - boat menu objective cannot be completed');
                return;
            }
            
            console.log('QuestManager: Tutorial quest found:', tutorialQuest.title);
            console.log('QuestManager: Tutorial quest objectives:', tutorialQuest.objectives);
            
            // Process boat menu objectives for the tutorial quest specifically
            if (tutorialQuest.objectives) {
                tutorialQuest.objectives.forEach((objective, index) => {
                    console.log(`QuestManager: Checking objective ${index}: ${objective.id} - ${objective.description} (completed: ${objective.completed})`);
                    
                    if (!objective.completed) {
                        // Check if this objective should be completed by accessing boat menu
                        if (objective.id === 'visit_boat_menu' || 
                            objective.id === 'access_boat_menu' ||
                            objective.type === 'ui_interaction') {
                            console.log(`QuestManager: ✅ Completing objective ${objective.id} for tutorial quest`);
                            const result = this.completeObjective('story_001_tutorial', objective.id);
                            console.log(`QuestManager: Objective completion result: ${result}`);
                            
                            if (result) {
                                console.log(`QuestManager: Successfully completed objective ${objective.id}`);
                                console.log(`QuestManager: Objective state after completion:`, objective);
                            } else {
                                console.warn(`QuestManager: Failed to complete objective ${objective.id}`);
                            }
                        } else {
                            console.log(`QuestManager: Objective ${objective.id} (type: ${objective.type}) does not match boat menu criteria`);
                        }
                    } else {
                        console.log(`QuestManager: Objective ${objective.id} already completed, skipping`);
                    }
                });
            } else {
                console.warn(`QuestManager: Tutorial quest has no objectives`);
            }
            
            // ADDITIONAL FIX: Also process any other active quests that might have boat menu objectives
            this.activeQuests.forEach((quest, questId) => {
                if (questId !== 'story_001_tutorial') { // Skip tutorial quest as we handled it above
                    console.log(`QuestManager: Processing quest ${questId} (${quest.title}) for boat menu objectives`);
                    
                    if (quest.objectives) {
                        quest.objectives.forEach((objective, index) => {
                            if (!objective.completed) {
                                // Check if this objective should be completed by accessing boat menu
                                if (objective.id === 'visit_boat_menu' || 
                                    objective.id === 'access_boat_menu' ||
                                    objective.type === 'visit_location' ||
                                    objective.type === 'ui_interaction') {
                                    console.log(`QuestManager: ✅ Completing objective ${objective.id} for quest ${questId}`);
                                    const result = this.completeObjective(questId, objective.id);
                                    console.log(`QuestManager: Objective completion result for ${questId}: ${result}`);
                                }
                            }
                        });
                    }
                }
            });
            
            console.log('QuestManager: Finished processing boat menu access event');
            
        } catch (error) {
            console.error('QuestManager: ❌ ERROR in onBoatMenuAccessed method:', error);
            console.error('QuestManager: Error stack:', error.stack);
            
            // Try manual completion as fallback
            try {
                console.log('QuestManager: Attempting manual objective completion as fallback...');
                const result = this.completeObjective('story_001_tutorial', 'visit_boat_menu');
                console.log('QuestManager: Manual fallback result:', result);
            } catch (fallbackError) {
                console.error('QuestManager: Manual fallback also failed:', fallbackError);
            }
        }
    }

    showQuestRewardUI(quest) {
        console.log('QuestManager: Showing reward UI for:', quest.title);
        
        try {
            // Try Phaser-based UI first (better integration with game)
            if (this.scene && this.scene.add && this.scene.cameras) {
                console.log('QuestManager: Creating Phaser-based reward UI');
                this.createPhaserRewardUI(quest);
            } else {
                console.log('QuestManager: Scene not available, falling back to DOM reward UI');
                this.createDOMRewardUI(quest);
            }
        } catch (error) {
            console.log('QuestManager: Reward UI error, showing console summary');
            console.log('🎉 Quest Complete:', quest.title);
            if (quest.rewards) {
                console.log('Rewards: +' + (quest.rewards.experience || 0) + ' XP, +' + (quest.rewards.coins || 0) + ' coins');
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
            console.log('QuestManager: Closing Phaser reward overlay');
            overlay.destroy();
        });
        
        // Also allow clicking background to close
        bg.on('pointerdown', () => {
            console.log('QuestManager: Closing Phaser reward overlay (background click)');
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
        
        console.log('QuestManager: Phaser reward UI created successfully');
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
                <div style="color: #00FF00; margin: 10px 0;">📈 Experience: +${quest.rewards.experience}</div>
                <div style="color: #FFD700; margin: 10px 0;">💰 Coins: +${quest.rewards.coins}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: #f39c12; color: white; border: none; padding: 12px 24px; 
                           border-radius: 6px; font-size: 16px; cursor: pointer;">Continue</button>
        `;
        
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        
        return true;
    }

    /**
     * Check if tutorial quests were already completed in a previous session
     */
    checkIfTutorialAlreadyCompleted() {
        // This will be called during initialization before quest data is loaded
        // We'll check this again after initialization in initializeQuests()
        
        // Try to check if tutorial was completed from game state
        try {
            if (this.gameState && this.gameState.questData) {
                const tutorialCompleted = this.gameState.questData.completedQuests?.includes('story_001_tutorial');
                const companionCompleted = this.gameState.questData.completedQuests?.includes('story_002_first_companion');
                
                if (tutorialCompleted) {
                    console.log('QuestManager: Tutorial quest already completed in previous session');
                    return true;
                }
            }
        } catch (error) {
            console.warn('QuestManager: Error checking tutorial completion from game state:', error);
        }
        
        return false;
    }

    /**
     * Validate and update tutorial completion status after quest initialization
     */
    validateTutorialCompletionStatus() {
        const tutorialCompleted = this.completedQuests.has('story_001_tutorial');
        const companionCompleted = !this.questTemplates.has('story_002_first_companion') || 
                                 this.completedQuests.has('story_002_first_companion');
        
        if (tutorialCompleted && companionCompleted) {
            console.log('QuestManager: Tutorial quests were already completed, disabling quest processing');
            this.tutorialQuestsCompleted = true;
            return true;
        }
        
        return false;
    }

    // Utility methods
    getPlayerLevel() { return 1; }
    getPlayerExperience() { return 0; }
    getPlayerCoins() { return 0; }
    addPlayerExperience(amount) { console.log('Added experience:', amount); }
    addPlayerCoins(amount) { console.log('Added coins:', amount); }
    
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
                console.log(`QuestManager: RenJs command '${command}' executed:`, result);
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
            console.log(`QuestManager: Quest ${questData.title} already completed, not adding to available`);
            return questData;
        }
        
        if (this.activeQuests.has(questData.id)) {
            console.log(`QuestManager: Quest ${questData.title} already active, not adding to available`);
            return questData;
        }
        
        // ADDITIONAL CHECK: Don't add if template is marked as completed
        const existingTemplate = this.questTemplates.get(questData.id);
        if (existingTemplate && existingTemplate.status === 'completed') {
            console.log(`QuestManager: Quest ${questData.title} template marked as completed, not adding to available`);
            return questData;
        }
        
        // Add to available quests if requirements are met and not already completed/active
        if (this.checkRequirements(questData.requirements)) {
            this.availableQuests.set(questData.id, questData);
            console.log(`QuestManager: Added quest: ${questData.title}`);
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
        console.log('QuestManager: Cleaning up quest states...');
        
        // Remove completed quests from available quests
        const completedQuestIds = Array.from(this.completedQuests);
        completedQuestIds.forEach(questId => {
            if (this.availableQuests.has(questId)) {
                this.availableQuests.delete(questId);
                console.log(`QuestManager: Removed completed quest ${questId} from available quests`);
            }
            
            // Mark template as completed to prevent re-adding
            const template = this.questTemplates.get(questId);
            if (template && template.status !== 'completed') {
                template.status = 'completed';
                template.dateCompleted = new Date();
                console.log(`QuestManager: Marked template ${questId} as completed`);
            }
        });
        
        // Remove active quests from available quests
        const activeQuestIds = Array.from(this.activeQuests.keys());
        activeQuestIds.forEach(questId => {
            if (this.availableQuests.has(questId)) {
                this.availableQuests.delete(questId);
                console.log(`QuestManager: Removed active quest ${questId} from available quests`);
            }
        });
        
        // Remove any quests from available that have completed status in template
        const availableQuestIds = Array.from(this.availableQuests.keys());
        availableQuestIds.forEach(questId => {
            const template = this.questTemplates.get(questId);
            if (template && template.status === 'completed') {
                this.availableQuests.delete(questId);
                console.log(`QuestManager: Removed quest ${questId} from available (template marked completed)`);
            }
        });
        
        console.log(`QuestManager: Cleanup complete - Active: ${this.activeQuests.size}, Available: ${this.availableQuests.size}, Completed: ${this.completedQuests.size}`);
    }
    
    /**
     * Debug method to log all quest states
     */
    debugQuestStates() {
        console.log('=== QUEST STATE DEBUG ===');
        console.log('Active Quests:', Array.from(this.activeQuests.keys()));
        console.log('Available Quests:', Array.from(this.availableQuests.keys()));
        console.log('Completed Quests:', Array.from(this.completedQuests));
        console.log('Quest Templates:', Array.from(this.questTemplates.keys()));
        
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
        
        console.log('=== END QUEST DEBUG ===');
    }
} 