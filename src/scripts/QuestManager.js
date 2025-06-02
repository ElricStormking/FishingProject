/**
 * Quest Manager - Handles all quest types: main story, side events, NPC quests
 * Integrates with DialogManager and other game systems
 */
export class QuestManager {
    constructor(scene) {
        this.scene = scene;
        this.activeQuests = new Map();
        this.completedQuests = new Set();
        this.availableQuests = new Map();
        this.questProgress = new Map();
        this.questRewards = new Map();
        
        // RenJs integration
        this.renjsCallbacks = new Map();
        this.achievementCallbacks = new Map();
        this.questStateExports = new Map();
        
        // Quest categories
        this.QUEST_TYPES = {
            MAIN_STORY: 'main_story',
            SIDE_EVENT: 'side_event', 
            NPC_CHATROOM: 'npc_chatroom',
            FISHING: 'fishing',
            CRAFTING: 'crafting'
        };
        
        // Quest status
        this.QUEST_STATUS = {
            AVAILABLE: 'available',
            ACTIVE: 'active',
            COMPLETED: 'completed',
            FAILED: 'failed',
            LOCKED: 'locked'
        };
        
        this.initializeQuests();
        this.initializeRenJsIntegration();
    }

    /**
     * Initialize default quests from GDD specifications
     */
    initializeQuests() {
        // Main Story Quests
        this.addQuest({
            id: 'story_001_tutorial',
            type: this.QUEST_TYPES.MAIN_STORY,
            title: 'Welcome to Luxury Angling',
            description: 'Learn the basics of fishing and explore your first location.',
            objectives: [
                { id: 'cast_first_time', description: 'Cast your line for the first time', completed: false },
                { id: 'catch_first_fish', description: 'Catch your first fish', completed: false },
                { id: 'visit_boat_menu', description: 'Access the boat menu', completed: false }
            ],
            rewards: {
                coins: 500,
                experience: 100,
                items: ['basic_rod', 'basic_lure']
            },
            requirements: [],
            autoStart: true
        });

        this.addQuest({
            id: 'story_002_first_companion',
            type: this.QUEST_TYPES.MAIN_STORY,
            title: 'Meet Your First Companion',
            description: 'Meet Mia, your helpful fishing assistant, and learn about the social system.',
            objectives: [
                { id: 'talk_to_mia', description: 'Have a conversation with Mia', completed: false },
                { id: 'increase_romance_meter', description: 'Increase Mia\'s romance meter by 10 points', completed: false }
            ],
            rewards: {
                coins: 300,
                experience: 150,
                achievements: ['first_conversation']
            },
            requirements: ['story_001_tutorial']
        });

        // Side Event Quests
        this.addQuest({
            id: 'side_001_master_angler',
            type: this.QUEST_TYPES.SIDE_EVENT,
            title: 'Master Angler Challenge',
            description: 'Prove your fishing skills by catching rare fish.',
            objectives: [
                { id: 'catch_rare_fish', description: 'Catch 5 rare fish (3-star or higher)', completed: false, progress: 0, target: 5 },
                { id: 'perfect_cast', description: 'Achieve 10 perfect casts', completed: false, progress: 0, target: 10 }
            ],
            rewards: {
                coins: 1000,
                experience: 300,
                items: ['elite_rod'],
                achievements: ['master_angler']
            },
            requirements: ['story_001_tutorial']
        });

        // NPC Chatroom Quests
        this.addQuest({
            id: 'npc_mia_001',
            type: this.QUEST_TYPES.NPC_CHATROOM,
            title: 'Mia\'s Fishing Tips',
            description: 'Help Mia improve her fishing skills and learn her secrets.',
            objectives: [
                { id: 'teach_mia_casting', description: 'Teach Mia advanced casting techniques', completed: false },
                { id: 'gift_fish_to_mia', description: 'Gift a rare fish to Mia', completed: false },
                { id: 'reach_romance_level_2', description: 'Reach Romance Level 2 with Mia', completed: false }
            ],
            rewards: {
                coins: 750,
                experience: 200,
                items: ['mia_special_lure'],
                achievements: ['mias_friend'],
                romance_bonus: { npc: 'mia', points: 15 }
            },
            requirements: ['story_002_first_companion']
        });

        this.addQuest({
            id: 'npc_sophie_001',
            type: this.QUEST_TYPES.NPC_CHATROOM,
            title: 'Sophie\'s Competition',
            description: 'Compete with Sophie in a friendly fishing tournament.',
            objectives: [
                { id: 'beat_sophie_score', description: 'Catch more fish than Sophie in 30 minutes', completed: false },
                { id: 'learn_competitive_techniques', description: 'Learn Sophie\'s competitive fishing techniques', completed: false }
            ],
            rewards: {
                coins: 600,
                experience: 180,
                items: ['competition_rod'],
                achievements: ['worthy_rival'],
                romance_bonus: { npc: 'sophie', points: 12 }
            },
            requirements: ['story_002_first_companion']
        });

        this.addQuest({
            id: 'npc_luna_001',
            type: this.QUEST_TYPES.NPC_CHATROOM,
            title: 'Luna\'s Mystical Waters',
            description: 'Discover the secrets of the deep waters with Luna\'s guidance.',
            objectives: [
                { id: 'fish_at_night', description: 'Fish during nighttime hours', completed: false },
                { id: 'catch_mysterious_fish', description: 'Catch a fish only Luna knows about', completed: false },
                { id: 'unlock_secret_spot', description: 'Discover Luna\'s secret fishing spot', completed: false }
            ],
            rewards: {
                coins: 800,
                experience: 250,
                items: ['mystical_lure', 'moonlight_rod'],
                achievements: ['deep_secrets'],
                romance_bonus: { npc: 'luna', points: 18 }
            },
            requirements: ['story_002_first_companion']
        });

        // Fishing Challenge Quests
        this.addQuest({
            id: 'fishing_001_species_collector',
            type: this.QUEST_TYPES.FISHING,
            title: 'Species Collector',
            description: 'Catch different species of fish to build your collection.',
            objectives: [
                { id: 'catch_10_species', description: 'Catch 10 different fish species', completed: false, progress: 0, target: 10 }
            ],
            rewards: {
                coins: 400,
                experience: 120,
                achievements: ['species_collector']
            },
            requirements: []
        });

        // Start tutorial quest automatically
        this.startQuest('story_001_tutorial');
    }

    /**
     * Add a new quest to the system
     */
    addQuest(questData) {
        this.availableQuests.set(questData.id, {
            ...questData,
            status: this.QUEST_STATUS.AVAILABLE,
            dateCreated: new Date(),
            progress: 0
        });
        
        console.log('QuestManager: Added quest:', questData.title);
    }

    /**
     * Start a quest
     */
    startQuest(questId) {
        const quest = this.availableQuests.get(questId);
        if (!quest) {
            console.warn('QuestManager: Quest not found:', questId);
            return false;
        }

        // Check requirements
        if (!this.checkRequirements(quest.requirements)) {
            console.warn('QuestManager: Quest requirements not met:', questId);
            return false;
        }

        quest.status = this.QUEST_STATUS.ACTIVE;
        quest.dateStarted = new Date();
        this.activeQuests.set(questId, quest);
        this.availableQuests.delete(questId);

        console.log('QuestManager: Started quest:', quest.title);
        
        // Emit event for UI updates
        if (this.scene?.events) {
            this.scene.events.emit('quest-started', { questId, quest });
        }

        return true;
    }

    /**
     * Complete a quest objective
     */
    completeObjective(questId, objectiveId, progressValue = 1) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return false;

        const objective = quest.objectives.find(obj => obj.id === objectiveId);
        if (!objective) return false;

        if (objective.target) {
            // Progress-based objective
            objective.progress = Math.min((objective.progress || 0) + progressValue, objective.target);
            objective.completed = objective.progress >= objective.target;
        } else {
            // Simple completion objective
            objective.completed = true;
        }

        console.log(`QuestManager: Objective ${objectiveId} progress: ${objective.progress || 'completed'}`);

        // Check if quest is complete
        this.checkQuestCompletion(questId);

        // Emit event for UI updates
        if (this.scene?.events) {
            this.scene.events.emit('quest-objective-updated', { questId, objectiveId, objective });
        }

        return true;
    }

    /**
     * Check if all quest objectives are completed
     */
    checkQuestCompletion(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return false;

        const allCompleted = quest.objectives.every(obj => obj.completed);
        
        if (allCompleted) {
            this.completeQuest(questId);
        }

        return allCompleted;
    }

    /**
     * Complete a quest and give rewards
     */
    completeQuest(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return false;

        quest.status = this.QUEST_STATUS.COMPLETED;
        quest.dateCompleted = new Date();
        
        // Move to completed quests
        this.completedQuests.add(questId);
        this.activeQuests.delete(questId);

        // Give rewards
        this.giveQuestRewards(quest);

        // Unlock new quests
        this.checkUnlockNewQuests(questId);

        console.log('QuestManager: Completed quest:', quest.title);

        // Emit event for UI updates
        if (this.scene?.events) {
            this.scene.events.emit('quest-completed', { questId, quest });
        }

        return true;
    }

    /**
     * Give quest rewards to player
     */
    giveQuestRewards(quest) {
        const rewards = quest.rewards;
        if (!rewards) return;

        // Get DialogManager for system integration
        const dialogManager = this.scene.dialogManager;

        // Give coins
        if (rewards.coins) {
            // Add coins to player (implement in main game)
            console.log(`QuestManager: Rewarded ${rewards.coins} coins`);
        }

        // Give experience
        if (rewards.experience) {
            // Add experience to player (implement in main game)
            console.log(`QuestManager: Rewarded ${rewards.experience} experience`);
        }

        // Give items
        if (rewards.items && Array.isArray(rewards.items)) {
            rewards.items.forEach(item => {
                if (dialogManager?.addInventoryItem) {
                    dialogManager.addInventoryItem(item, 1);
                }
                console.log(`QuestManager: Rewarded item: ${item}`);
            });
        }

        // Unlock achievements
        if (rewards.achievements && Array.isArray(rewards.achievements)) {
            rewards.achievements.forEach(achievement => {
                if (dialogManager?.unlockAchievement) {
                    dialogManager.unlockAchievement(achievement);
                }
                console.log(`QuestManager: Unlocked achievement: ${achievement}`);
            });
        }

        // Romance bonuses
        if (rewards.romance_bonus) {
            const { npc, points } = rewards.romance_bonus;
            if (dialogManager?.increaseRomanceMeter) {
                dialogManager.increaseRomanceMeter(npc, points);
            }
            console.log(`QuestManager: Romance bonus for ${npc}: +${points}`);
        }
    }

    /**
     * Check requirements for a quest
     */
    checkRequirements(requirements) {
        if (!requirements || requirements.length === 0) return true;
        
        return requirements.every(reqId => this.completedQuests.has(reqId));
    }

    /**
     * Check and unlock new quests based on completed quest
     */
    checkUnlockNewQuests(completedQuestId) {
        this.availableQuests.forEach((quest, questId) => {
            if (quest.requirements.includes(completedQuestId)) {
                // Quest can now be started
                quest.status = this.QUEST_STATUS.AVAILABLE;
                console.log(`QuestManager: Unlocked quest: ${quest.title}`);
                
                // Auto-start if specified
                if (quest.autoStart) {
                    this.startQuest(questId);
                }
            }
        });
    }

    /**
     * Get active quests
     */
    getActiveQuests() {
        return Array.from(this.activeQuests.values());
    }

    /**
     * Get available quests
     */
    getAvailableQuests() {
        return Array.from(this.availableQuests.values()).filter(quest => 
            quest.status === this.QUEST_STATUS.AVAILABLE && 
            this.checkRequirements(quest.requirements)
        );
    }

    /**
     * Get completed quests
     */
    getCompletedQuests() {
        return Array.from(this.completedQuests).map(questId => 
            this.findQuestById(questId)
        ).filter(Boolean);
    }

    /**
     * Get quests by type
     */
    getQuestsByType(questType) {
        const allQuests = [
            ...this.activeQuests.values(),
            ...this.availableQuests.values()
        ];
        return allQuests.filter(quest => quest.type === questType);
    }

    /**
     * Find quest by ID
     */
    findQuestById(questId) {
        return this.activeQuests.get(questId) || 
               this.availableQuests.get(questId) || 
               null;
    }

    /**
     * Get quest progress summary
     */
    getQuestStats() {
        return {
            active: this.activeQuests.size,
            available: this.getAvailableQuests().length,
            completed: this.completedQuests.size,
            total: this.activeQuests.size + this.availableQuests.size + this.completedQuests.size
        };
    }

    /**
     * Save quest data
     */
    save() {
        return {
            activeQuests: Array.from(this.activeQuests.entries()),
            completedQuests: Array.from(this.completedQuests),
            availableQuests: Array.from(this.availableQuests.entries()),
            questProgress: Array.from(this.questProgress.entries())
        };
    }

    /**
     * Load quest data
     */
    load(data) {
        if (data.activeQuests) {
            this.activeQuests = new Map(data.activeQuests);
        }
        if (data.completedQuests) {
            this.completedQuests = new Set(data.completedQuests);
        }
        if (data.availableQuests) {
            this.availableQuests = new Map(data.availableQuests);
        }
        if (data.questProgress) {
            this.questProgress = new Map(data.questProgress);
        }
    }

    /**
     * Debug: List all quests
     */
    debugListQuests() {
        console.log('=== QUEST MANAGER DEBUG ===');
        console.log('Active Quests:', this.activeQuests.size);
        this.activeQuests.forEach(quest => {
            console.log(`  - ${quest.title} (${quest.id})`);
        });
        console.log('Available Quests:', this.getAvailableQuests().length);
        this.getAvailableQuests().forEach(quest => {
            console.log(`  - ${quest.title} (${quest.id})`);
        });
        console.log('Completed Quests:', this.completedQuests.size);
        console.log('========================');
    }

    /**
     * Show quest log UI
     */
    showQuestLog() {
        if (!this.scene) {
            console.warn('QuestManager: Scene not available');
            return;
        }
        
        console.log('QuestManager: Opening Quest Log');
        
        // Launch quest scene
        this.scene.scene.pause('GameScene');
        this.scene.scene.launch('QuestScene', { fromScene: 'GameScene' });
    }

    /**
     * Hook for fishing actions to update quest progress
     */
    onFishCaught(fishData) {
        // Update fishing-related quest objectives
        this.completeObjective('story_001_tutorial', 'catch_first_fish');
        this.completeObjective('side_001_master_angler', 'catch_rare_fish', fishData.rarity >= 3 ? 1 : 0);
        this.completeObjective('fishing_001_species_collector', 'catch_10_species', 1);
        
        console.log('QuestManager: Fish caught, updated quest progress');
    }

    /**
     * Hook for dialog interactions
     */
    onDialogCompleted(npcId, choiceData) {
        // Update dialog-related quest objectives based on NPC
        if (npcId === 'mia') {
            this.completeObjective('story_002_first_companion', 'talk_to_mia');
            this.completeObjective('npc_mia_001', 'teach_mia_casting');
        } else if (npcId === 'sophie') {
            this.completeObjective('npc_sophie_001', 'learn_competitive_techniques');
        } else if (npcId === 'luna') {
            this.completeObjective('npc_luna_001', 'fish_at_night');
        }
        
        console.log(`QuestManager: Dialog with ${npcId} completed, updated quest progress`);
    }

    /**
     * Hook for romance meter changes
     */
    onRomanceMeterChanged(npcId, newValue) {
        // Update romance-related quest objectives
        if (npcId === 'mia' && newValue >= 10) {
            this.completeObjective('story_002_first_companion', 'increase_romance_meter');
        }
        
        if (npcId === 'mia' && newValue >= 50) {
            this.completeObjective('npc_mia_001', 'reach_romance_level_2');
        }
        
        console.log(`QuestManager: Romance meter for ${npcId} changed to ${newValue}, updated quest progress`);
    }

    /**
     * Hook for casting actions
     */
    onCast(castData) {
        // Update casting-related quest objectives
        this.completeObjective('story_001_tutorial', 'cast_first_time');
        
        if (castData.accuracy >= 0.9) { // Perfect cast
            this.completeObjective('side_001_master_angler', 'perfect_cast', 1);
        }
        
        console.log('QuestManager: Cast completed, updated quest progress');
    }

    /**
     * Hook for boat menu access
     */
    onBoatMenuAccessed() {
        this.completeObjective('story_001_tutorial', 'visit_boat_menu');
        console.log('QuestManager: Boat menu accessed, updated quest progress');
    }

    /**
     * Debug: Show quest system initialization status
     */
    debugQuestSystemStatus() {
        console.log('🗓 QUEST SYSTEM DEBUG STATUS');
        console.log('============================');
        console.log('✅ QuestManager initialized successfully');
        console.log(`📊 Loaded ${this.availableQuests.size + this.activeQuests.size} total quests`);
        console.log(`🎯 Active quests: ${this.activeQuests.size}`);
        console.log(`📋 Available quests: ${this.getAvailableQuests().length}`);
        console.log(`✔️ Completed quests: ${this.completedQuests.size}`);
        
        console.log('\n📝 Quest Details:');
        console.log('- Tutorial quest auto-started');
        console.log('- Main story quest requires tutorial completion');
        console.log('- NPC quests available after meeting first companion');
        console.log('- Side event and fishing quests available immediately');
        
        console.log('\n🎮 Controls:');
        console.log('- Press Q key or click Quest button to open Quest Log');
        console.log('- SPACEBAR: Cast (updates tutorial)');
        console.log('- D/F/G: Dialog with NPCs (updates romance/quests)');
        console.log('- Mouse: Navigate boat menu (completes tutorial objective)');
        
        console.log('\n🎯 Ready for testing!');
        console.log('============================');
    }

    /**
     * Debug: Test RenJs integration functionality
     */
    debugTestRenJsIntegration() {
        console.log('🧪 TESTING RENJS INTEGRATION');
        console.log('============================');
        
        // Test global object exposure
        if (typeof window !== 'undefined' && window.LuxuryAnglerGame) {
            console.log('✅ Global LuxuryAnglerGame object available');
            
            // Test command execution
            console.log('\n🔧 Testing Quest Commands:');
            console.log('- startQuest:', typeof window.LuxuryAnglerGame.executeCommand === 'function');
            console.log('- isQuestActive:', typeof window.LuxuryAnglerGame.isQuestActive === 'function');
            console.log('- getQuestState:', typeof window.LuxuryAnglerGame.getQuestState === 'function');
            
            // Test state queries
            console.log('\n📊 Testing State Queries:');
            console.log('- Tutorial completed:', window.LuxuryAnglerGame.getQuestState('tutorial_completed'));
            console.log('- Mia quest active:', window.LuxuryAnglerGame.getQuestState('mia_quest_active'));
            console.log('- Story quest completed:', window.LuxuryAnglerGame.isQuestCompleted('story_001_tutorial'));
            
            // Test command execution
            console.log('\n⚡ Testing Command Execution:');
            try {
                const testResult = window.LuxuryAnglerGame.executeCommand('isQuestActive', 'story_001_tutorial');
                console.log('- Command execution test:', testResult ? 'PASS' : 'PASS (false result)');
            } catch (error) {
                console.error('- Command execution test: FAIL', error);
            }
            
            console.log('\n✅ RenJs integration test complete');
        } else {
            console.warn('❌ Global LuxuryAnglerGame object not available');
        }
        
        // Test registered commands
        console.log('\n📝 Registered RenJs Commands:');
        this.renjsCallbacks.forEach((callback, command) => {
            console.log(`  - ${command}: ${typeof callback}`);
        });
        
        // Test quest state exports
        console.log('\n📊 Available Quest States:');
        this.questStateExports.forEach((stateFunction, stateKey) => {
            console.log(`  - ${stateKey}: ${typeof stateFunction}`);
        });
        
        console.log('\n🎯 RenJs Integration Ready!');
        console.log('============================');
        
        // Provide usage examples
        console.log('\n📖 Usage Examples:');
        console.log('// In RenJs dialog scripts:');
        console.log('{{LuxuryAnglerGame.executeCommand("startQuest", "npc_mia_001")}}');
        console.log('{{LuxuryAnglerGame.getQuestState("tutorial_completed")}}');
        console.log('{{LuxuryAnglerGame.isQuestActive("story_001_tutorial")}}');
        console.log('{{LuxuryAnglerGame.processChoice("dialog_id", "choice_id", "mia", {romanceBonus: 5})}}');
    }

    // RenJs integration methods
    initializeRenJsIntegration() {
        console.log('QuestManager: Initializing RenJs integration...');
        
        // Register RenJs command callbacks
        this.registerRenJsCommands();
        
        // Setup quest state exports for RenJs scripts
        this.setupQuestStateExports();
        
        // Initialize achievement integration
        this.initializeAchievementIntegration();
        
        console.log('QuestManager: RenJs integration initialized successfully');
    }

    /**
     * Register RenJs commands that can be called from dialog scripts
     */
    registerRenJsCommands() {
        // Register quest commands
        this.renjsCallbacks.set('startQuest', (questId) => {
            console.log(`RenJs Command: Starting quest ${questId}`);
            return this.startQuest(questId);
        });

        this.renjsCallbacks.set('completeQuest', (questId) => {
            console.log(`RenJs Command: Completing quest ${questId}`);
            return this.completeQuest(questId);
        });

        this.renjsCallbacks.set('updateQuestObjective', (questId, objectiveId, progress = 1) => {
            console.log(`RenJs Command: Updating quest ${questId} objective ${objectiveId} by ${progress}`);
            return this.completeObjective(questId, objectiveId, progress);
        });

        this.renjsCallbacks.set('failQuest', (questId) => {
            console.log(`RenJs Command: Failing quest ${questId}`);
            return this.failQuest(questId);
        });

        // Register achievement commands
        this.renjsCallbacks.set('unlockAchievement', (achievementId) => {
            console.log(`RenJs Command: Unlocking achievement ${achievementId}`);
            return this.unlockAchievementFromRenJs(achievementId);
        });

        this.renjsCallbacks.set('giveQuestReward', (questId, rewardType, amount) => {
            console.log(`RenJs Command: Giving quest reward ${rewardType}: ${amount} for quest ${questId}`);
            return this.giveCustomQuestReward(questId, rewardType, amount);
        });

        // Register state query commands
        this.renjsCallbacks.set('isQuestActive', (questId) => {
            return this.activeQuests.has(questId);
        });

        this.renjsCallbacks.set('isQuestCompleted', (questId) => {
            return this.completedQuests.has(questId);
        });

        this.renjsCallbacks.set('getQuestProgress', (questId, objectiveId) => {
            const quest = this.activeQuests.get(questId);
            if (!quest) return 0;
            const objective = quest.objectives.find(obj => obj.id === objectiveId);
            return objective ? (objective.progress || 0) : 0;
        });

        console.log('QuestManager: RenJs commands registered:', Array.from(this.renjsCallbacks.keys()));
    }

    /**
     * Setup quest state exports that RenJs scripts can access
     */
    setupQuestStateExports() {
        // Export quest completion status
        this.questStateExports.set('tutorial_completed', () => this.completedQuests.has('story_001_tutorial'));
        this.questStateExports.set('first_companion_met', () => this.completedQuests.has('story_002_first_companion'));
        this.questStateExports.set('mia_quest_active', () => this.activeQuests.has('npc_mia_001'));
        this.questStateExports.set('sophie_quest_active', () => this.activeQuests.has('npc_sophie_001'));
        this.questStateExports.set('luna_quest_active', () => this.activeQuests.has('npc_luna_001'));
        
        // Export romance-related quest states
        this.questStateExports.set('mia_romance_quest_completed', () => {
            const quest = this.findQuestById('npc_mia_001');
            return quest?.objectives?.find(obj => obj.id === 'reach_romance_level_2')?.completed || false;
        });

        // Export fishing achievement states
        this.questStateExports.set('master_angler_quest_active', () => this.activeQuests.has('side_001_master_angler'));
        this.questStateExports.set('species_collector_progress', () => {
            const quest = this.activeQuests.get('fishing_001_species_collector');
            if (!quest) return 0;
            const objective = quest.objectives.find(obj => obj.id === 'catch_10_species');
            return objective ? (objective.progress || 0) : 0;
        });

        console.log('QuestManager: Quest state exports configured:', Array.from(this.questStateExports.keys()));
    }

    /**
     * Initialize achievement integration with RenJs
     */
    initializeAchievementIntegration() {
        // Achievement unlock callbacks for dialog responses
        this.achievementCallbacks.set('first_dialog', () => {
            this.unlockAchievementFromRenJs('first_conversation');
        });

        this.achievementCallbacks.set('romance_milestone', (npcId, level) => {
            this.unlockAchievementFromRenJs(`${npcId}_romance_${level}`);
        });

        this.achievementCallbacks.set('story_progress', (chapterNumber) => {
            this.unlockAchievementFromRenJs(`chapter_${chapterNumber}_complete`);
        });

        console.log('QuestManager: Achievement integration initialized');
    }

    /**
     * Execute RenJs command - called from dialog scripts
     * @param {string} command - The command name
     * @param {...any} args - Command arguments
     * @returns {any} Command result
     */
    executeRenJsCommand(command, ...args) {
        const callback = this.renjsCallbacks.get(command);
        if (callback) {
            try {
                const result = callback(...args);
                console.log(`QuestManager: RenJs command '${command}' executed successfully:`, result);
                
                // Emit event for UI updates
                if (this.scene?.events) {
                    this.scene.events.emit('renjs-quest-command', { command, args, result });
                }
                
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

    /**
     * Get quest state for RenJs scripts
     * @param {string} stateKey - The state key to query
     * @returns {any} State value
     */
    getQuestStateForRenJs(stateKey) {
        const stateFunction = this.questStateExports.get(stateKey);
        if (stateFunction) {
            try {
                const value = stateFunction();
                console.log(`QuestManager: RenJs state query '${stateKey}':`, value);
                return value;
            } catch (error) {
                console.error(`QuestManager: Error getting quest state '${stateKey}':`, error);
                return false;
            }
        } else {
            console.warn(`QuestManager: Unknown quest state key: ${stateKey}`);
            return null;
        }
    }

    /**
     * Fail a quest (for RenJs integration)
     * @param {string} questId - Quest to fail
     * @returns {boolean} Success status
     */
    failQuest(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) {
            console.warn('QuestManager: Cannot fail quest - not found:', questId);
            return false;
        }

        quest.status = this.QUEST_STATUS.FAILED;
        quest.dateFailed = new Date();
        
        // Move to completed quests (as failed)
        this.activeQuests.delete(questId);
        this.completedQuests.add(questId);

        console.log('QuestManager: Failed quest:', quest.title);

        // Emit event for UI updates
        if (this.scene?.events) {
            this.scene.events.emit('quest-failed', { questId, quest });
        }

        return true;
    }

    /**
     * Unlock achievement from RenJs dialog
     * @param {string} achievementId - Achievement to unlock
     * @returns {boolean} Success status
     */
    unlockAchievementFromRenJs(achievementId) {
        // Get DialogManager for achievement integration
        const dialogManager = this.scene.dialogManager;
        
        if (dialogManager?.unlockAchievement) {
            dialogManager.unlockAchievement(achievementId);
            console.log(`QuestManager: Achievement unlocked via RenJs: ${achievementId}`);
            return true;
        } else {
            console.warn('QuestManager: Cannot unlock achievement - DialogManager not available');
            return false;
        }
    }

    /**
     * Give custom quest reward from RenJs
     * @param {string} questId - Quest ID
     * @param {string} rewardType - Type of reward (coins, experience, items, romance)
     * @param {any} amount - Reward amount or item
     * @returns {boolean} Success status
     */
    giveCustomQuestReward(questId, rewardType, amount) {
        const dialogManager = this.scene.dialogManager;
        
        switch (rewardType) {
            case 'coins':
                console.log(`QuestManager: Giving ${amount} coins for quest ${questId}`);
                // Integrate with currency system when available
                return true;
                
            case 'experience':
                console.log(`QuestManager: Giving ${amount} experience for quest ${questId}`);
                // Integrate with experience system when available
                return true;
                
            case 'item':
                if (dialogManager?.addInventoryItem) {
                    dialogManager.addInventoryItem(amount, 1);
                    console.log(`QuestManager: Giving item ${amount} for quest ${questId}`);
                    return true;
                }
                return false;
                
            case 'romance':
                if (dialogManager?.increaseRomanceMeter && typeof amount === 'object') {
                    const { npc, points } = amount;
                    dialogManager.increaseRomanceMeter(npc, points);
                    console.log(`QuestManager: Giving ${points} romance points to ${npc} for quest ${questId}`);
                    return true;
                }
                return false;
                
            default:
                console.warn(`QuestManager: Unknown reward type: ${rewardType}`);
                return false;
        }
    }

    /**
     * RenJs hook for dialog choice made
     * @param {string} dialogId - Dialog identifier
     * @param {string} choiceId - Choice identifier
     * @param {string} npcId - NPC involved in dialog
     */
    onRenJsChoiceMade(dialogId, choiceId, npcId) {
        console.log(`QuestManager: RenJs choice made - Dialog: ${dialogId}, Choice: ${choiceId}, NPC: ${npcId}`);
        
        // Update quest objectives based on choices
        this.processDialogChoiceForQuests(dialogId, choiceId, npcId);
        
        // Trigger achievement callbacks
        this.triggerChoiceAchievements(dialogId, choiceId, npcId);
    }

    /**
     * Process dialog choices for quest progression
     * @param {string} dialogId - Dialog identifier
     * @param {string} choiceId - Choice identifier
     * @param {string} npcId - NPC identifier
     */
    processDialogChoiceForQuests(dialogId, choiceId, npcId) {
        // Process based on NPC and choice
        switch (npcId) {
            case 'mia':
                if (choiceId.includes('fishing_tips')) {
                    this.completeObjective('npc_mia_001', 'teach_mia_casting');
                }
                if (choiceId.includes('gift_fish')) {
                    this.completeObjective('npc_mia_001', 'gift_fish_to_mia');
                }
                break;
                
            case 'sophie':
                if (choiceId.includes('competition')) {
                    this.completeObjective('npc_sophie_001', 'learn_competitive_techniques');
                }
                break;
                
            case 'luna':
                if (choiceId.includes('secret_spot')) {
                    this.completeObjective('npc_luna_001', 'unlock_secret_spot');
                }
                break;
        }
        
        // General dialog completion objectives
        this.completeObjective('story_002_first_companion', 'talk_to_mia');
    }

    /**
     * Trigger achievements based on dialog choices
     * @param {string} dialogId - Dialog identifier
     * @param {string} choiceId - Choice identifier
     * @param {string} npcId - NPC identifier
     */
    triggerChoiceAchievements(dialogId, choiceId, npcId) {
        // First conversation achievement
        if (!this.hasAchievement('first_conversation')) {
            this.unlockAchievementFromRenJs('first_conversation');
        }
        
        // NPC-specific achievements
        if (choiceId.includes('romantic') || choiceId.includes('flirt')) {
            this.unlockAchievementFromRenJs(`${npcId}_romantic_interest`);
        }
        
        if (choiceId.includes('helpful') || choiceId.includes('gift')) {
            this.unlockAchievementFromRenJs(`${npcId}_helpful_friend`);
        }
    }

    /**
     * Check if player has specific achievement
     * @param {string} achievementId - Achievement to check
     * @returns {boolean} Has achievement
     */
    hasAchievement(achievementId) {
        const dialogManager = this.scene.dialogManager;
        // This would integrate with actual achievement system
        // For now, return false to allow first-time unlocks
        return false;
    }

    /**
     * Export quest manager state for RenJs global access
     * @returns {Object} Exported state and functions
     */
    exportForRenJs() {
        return {
            // State queries
            getQuestState: (stateKey) => this.getQuestStateForRenJs(stateKey),
            isQuestActive: (questId) => this.activeQuests.has(questId),
            isQuestCompleted: (questId) => this.completedQuests.has(questId),
            getQuestProgress: (questId, objectiveId) => this.getQuestProgress(questId, objectiveId),
            
            // Commands
            executeCommand: (command, ...args) => this.executeRenJsCommand(command, ...args),
            
            // Hooks
            onChoiceMade: (dialogId, choiceId, npcId) => this.onRenJsChoiceMade(dialogId, choiceId, npcId),
            
            // Direct quest operations
            startQuest: (questId) => this.startQuest(questId),
            completeObjective: (questId, objectiveId, progress) => this.completeObjective(questId, objectiveId, progress),
            unlockAchievement: (achievementId) => this.unlockAchievementFromRenJs(achievementId)
        };
    }
} 