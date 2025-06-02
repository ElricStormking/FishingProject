/**
 * Advanced Quest System - Enhanced quest types and functionality
 * Builds on the existing QuestManager with advanced features:
 * - Time-based quests (daily, weekly, limited-time)
 * - Chain quest system with branching paths
 * - Dynamic quest generation
 * - Quest notifications and reminders
 * - Advanced quest analytics
 */
export class AdvancedQuestSystem {
    constructor(questManager, gameState, notificationManager) {
        this.questManager = questManager;
        this.gameState = gameState;
        this.notificationManager = notificationManager;
        
        // Quest enhancement features
        this.timers = new Map();
        this.questChains = new Map();
        this.dynamicQuests = new Map();
        this.questMetrics = new Map();
        
        // Time-based quest configuration
        this.timeBasedQuests = {
            daily: {
                resetTime: '00:00', // Reset at midnight
                maxActive: 3,
                expireTime: 24 * 60 * 60 * 1000 // 24 hours
            },
            weekly: {
                resetDay: 0, // Sunday
                resetTime: '00:00',
                maxActive: 2,
                expireTime: 7 * 24 * 60 * 60 * 1000 // 7 days
            },
            event: {
                maxActive: 5,
                customExpiry: true
            }
        };
        
        // Dynamic quest templates
        this.questTemplates = this.initializeQuestTemplates();
        
        // Quest chain definitions
        this.questChainDefinitions = this.initializeQuestChains();
        
        this.initializeAdvancedQuests();
        this.startQuestTimers();
        
        console.log('AdvancedQuestSystem: Enhanced quest system initialized');
    }

    /**
     * Initialize quest templates for dynamic generation
     */
    initializeQuestTemplates() {
        return {
            fishingTemplates: [
                {
                    id: 'catch_species_template',
                    title: 'Species Hunt: {species}',
                    description: 'Catch {count} {species} fish',
                    objectives: [
                        { id: 'catch_target', description: 'Catch {count} {species}', progress: 0, target: '{count}' }
                    ],
                    baseRewards: { coins: 150, experience: 75 },
                    variables: ['species', 'count'],
                    difficulty: 'medium'
                },
                {
                    id: 'location_challenge_template',
                    title: 'Master of {location}',
                    description: 'Catch {count} fish at {location}',
                    objectives: [
                        { id: 'location_catch', description: 'Catch {count} fish at {location}', progress: 0, target: '{count}' }
                    ],
                    baseRewards: { coins: 200, experience: 100 },
                    variables: ['location', 'count'],
                    difficulty: 'medium'
                },
                {
                    id: 'rarity_challenge_template',
                    title: 'Rare Catch Challenge',
                    description: 'Catch {count} rare fish (3-star or higher)',
                    objectives: [
                        { id: 'rare_catch', description: 'Catch {count} rare fish', progress: 0, target: '{count}' }
                    ],
                    baseRewards: { coins: 300, experience: 150 },
                    variables: ['count'],
                    difficulty: 'hard'
                }
            ],
            socialTemplates: [
                {
                    id: 'romance_progress_template',
                    title: 'Growing Closer to {npc}',
                    description: 'Increase your romance meter with {npc} by {points} points',
                    objectives: [
                        { id: 'romance_increase', description: 'Gain {points} romance points with {npc}', progress: 0, target: '{points}' }
                    ],
                    baseRewards: { coins: 100, experience: 80 },
                    variables: ['npc', 'points'],
                    difficulty: 'easy'
                },
                {
                    id: 'conversation_template',
                    title: 'Deep Conversation with {npc}',
                    description: 'Have {count} meaningful conversations with {npc}',
                    objectives: [
                        { id: 'conversation_count', description: 'Complete {count} conversations', progress: 0, target: '{count}' }
                    ],
                    baseRewards: { coins: 75, experience: 50 },
                    variables: ['npc', 'count'],
                    difficulty: 'easy'
                }
            ],
            equipmentTemplates: [
                {
                    id: 'upgrade_equipment_template',
                    title: 'Equipment Enhancement',
                    description: 'Upgrade any equipment {count} times',
                    objectives: [
                        { id: 'equipment_upgrade', description: 'Perform {count} equipment upgrades', progress: 0, target: '{count}' }
                    ],
                    baseRewards: { coins: 250, experience: 125 },
                    variables: ['count'],
                    difficulty: 'medium'
                }
            ]
        };
    }

    /**
     * Initialize quest chain definitions
     */
    initializeQuestChains() {
        return [
            {
                id: 'mia_romance_chain',
                name: 'Mia\'s Heart',
                description: 'A journey of growing closer to Mia',
                quests: [
                    {
                        id: 'mia_chain_1',
                        title: 'First Impressions',
                        description: 'Make a good first impression with Mia',
                        objectives: [
                            { id: 'meet_mia', description: 'Meet Mia for the first time', completed: false },
                            { id: 'first_conversation', description: 'Have your first conversation', completed: false }
                        ],
                        rewards: { coins: 200, experience: 100, romance_bonus: { npc: 'mia', points: 10 } },
                        nextQuests: ['mia_chain_2a', 'mia_chain_2b']
                    },
                    {
                        id: 'mia_chain_2a',
                        title: 'Fishing Mentor',
                        description: 'Learn fishing techniques from Mia',
                        objectives: [
                            { id: 'fishing_lesson', description: 'Complete Mia\'s fishing lesson', completed: false },
                            { id: 'practice_technique', description: 'Use the technique successfully 5 times', completed: false, progress: 0, target: 5 }
                        ],
                        rewards: { coins: 300, experience: 150, items: ['mia_special_lure'], romance_bonus: { npc: 'mia', points: 15 } },
                        nextQuests: ['mia_chain_3']
                    },
                    {
                        id: 'mia_chain_2b',
                        title: 'Personal Connection',
                        description: 'Get to know Mia on a personal level',
                        objectives: [
                            { id: 'personal_talk', description: 'Have a personal conversation with Mia', completed: false },
                            { id: 'share_interests', description: 'Discover shared interests', completed: false }
                        ],
                        rewards: { coins: 250, experience: 125, romance_bonus: { npc: 'mia', points: 20 } },
                        nextQuests: ['mia_chain_3']
                    }
                ],
                chainRewards: {
                    coins: 1000,
                    experience: 500,
                    achievements: ['mias_heart'],
                    romance_bonus: { npc: 'mia', points: 50 }
                }
            },
            {
                id: 'master_angler_chain',
                name: 'Path to Mastery',
                description: 'Become a legendary angler',
                quests: [
                    {
                        id: 'angler_novice',
                        title: 'Novice Angler',
                        description: 'Take your first steps as an angler',
                        objectives: [
                            { id: 'catch_10_fish', description: 'Catch 10 fish', completed: false, progress: 0, target: 10 },
                            { id: 'visit_3_locations', description: 'Visit 3 different fishing locations', completed: false, progress: 0, target: 3 }
                        ],
                        rewards: { coins: 400, experience: 200 },
                        nextQuests: ['angler_apprentice']
                    },
                    {
                        id: 'angler_apprentice',
                        title: 'Apprentice Angler',
                        description: 'Develop your fishing skills',
                        objectives: [
                            { id: 'catch_rare_fish', description: 'Catch 5 rare fish', completed: false, progress: 0, target: 5 },
                            { id: 'perfect_casts', description: 'Achieve 20 perfect casts', completed: false, progress: 0, target: 20 }
                        ],
                        rewards: { coins: 600, experience: 300, items: ['apprentice_rod'] },
                        nextQuests: ['angler_expert']
                    },
                    {
                        id: 'angler_expert',
                        title: 'Expert Angler',
                        description: 'Master advanced fishing techniques',
                        objectives: [
                            { id: 'catch_legendary', description: 'Catch 3 legendary fish', completed: false, progress: 0, target: 3 },
                            { id: 'master_all_lures', description: 'Successfully use all 5 lure types', completed: false, progress: 0, target: 5 }
                        ],
                        rewards: { coins: 1000, experience: 500, items: ['expert_rod'], achievements: ['expert_angler'] },
                        nextQuests: ['angler_master']
                    }
                ],
                chainRewards: {
                    coins: 3000,
                    experience: 1500,
                    achievements: ['master_angler'],
                    items: ['legendary_angler_set'],
                    title: 'Master Angler'
                }
            }
        ];
    }

    /**
     * Initialize advanced quest system
     */
    initializeAdvancedQuests() {
        // Initialize time-based quests
        this.initializeDailyQuests();
        this.initializeWeeklyQuests();
        
        // Initialize quest chains
        this.initializeQuestChainTracking();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('AdvancedQuestSystem: Advanced quest features initialized');
    }

    /**
     * Initialize daily quest system
     */
    initializeDailyQuests() {
        if (!this.gameState.dailyQuests) {
            this.gameState.dailyQuests = {
                lastReset: new Date().toDateString(),
                availableQuests: [],
                completedToday: []
            };
        }
        
        // Check if daily reset is needed
        const today = new Date().toDateString();
        if (this.gameState.dailyQuests.lastReset !== today) {
            this.resetDailyQuests();
        }
        
        // Generate daily quests if needed
        if (this.gameState.dailyQuests.availableQuests.length === 0) {
            this.generateDailyQuests();
        }
    }

    /**
     * Initialize weekly quest system
     */
    initializeWeeklyQuests() {
        if (!this.gameState.weeklyQuests) {
            this.gameState.weeklyQuests = {
                lastReset: this.getWeekStart(),
                availableQuests: [],
                completedThisWeek: []
            };
        }
        
        // Check if weekly reset is needed
        const currentWeekStart = this.getWeekStart();
        if (this.gameState.weeklyQuests.lastReset !== currentWeekStart) {
            this.resetWeeklyQuests();
        }
        
        // Generate weekly quests if needed
        if (this.gameState.weeklyQuests.availableQuests.length === 0) {
            this.generateWeeklyQuests();
        }
    }

    /**
     * Initialize quest chain tracking
     */
    initializeQuestChainTracking() {
        if (!this.gameState.questChains) {
            this.gameState.questChains = {};
        }
        
        this.questChainDefinitions.forEach(chain => {
            if (!this.gameState.questChains[chain.id]) {
                this.gameState.questChains[chain.id] = {
                    currentQuest: null,
                    completedQuests: [],
                    availableQuests: [chain.quests[0].id], // First quest is available
                    chainCompleted: false
                };
            }
        });
    }

    /**
     * Generate daily quests
     */
    generateDailyQuests() {
        const dailyQuests = [];
        const maxDailyQuests = this.timeBasedQuests.daily.maxActive;
        
        // Fishing challenge (always included)
        const fishingQuest = this.generateQuestFromTemplate('fishingTemplates', 'daily');
        if (fishingQuest) dailyQuests.push(fishingQuest);
        
        // Social challenge (if NPCs available)
        if (dailyQuests.length < maxDailyQuests) {
            const socialQuest = this.generateQuestFromTemplate('socialTemplates', 'daily');
            if (socialQuest) dailyQuests.push(socialQuest);
        }
        
        // Equipment challenge (if equipment system available)
        if (dailyQuests.length < maxDailyQuests) {
            const equipmentQuest = this.generateQuestFromTemplate('equipmentTemplates', 'daily');
            if (equipmentQuest) dailyQuests.push(equipmentQuest);
        }
        
        this.gameState.dailyQuests.availableQuests = dailyQuests;
        
        // Register quests with main quest manager
        dailyQuests.forEach(quest => {
            this.questManager.addQuest(quest);
        });
        
        console.log(`AdvancedQuestSystem: Generated ${dailyQuests.length} daily quests`);
    }

    /**
     * Generate weekly quests
     */
    generateWeeklyQuests() {
        const weeklyQuests = [];
        const maxWeeklyQuests = this.timeBasedQuests.weekly.maxActive;
        
        // More challenging quests for weekly
        for (let i = 0; i < maxWeeklyQuests; i++) {
            const template = this.getRandomTemplate();
            const quest = this.generateQuestFromTemplate(template.category, 'weekly', template.template);
            if (quest) weeklyQuests.push(quest);
        }
        
        this.gameState.weeklyQuests.availableQuests = weeklyQuests;
        
        // Register quests with main quest manager
        weeklyQuests.forEach(quest => {
            this.questManager.addQuest(quest);
        });
        
        console.log(`AdvancedQuestSystem: Generated ${weeklyQuests.length} weekly quests`);
    }

    /**
     * Generate quest from template
     */
    generateQuestFromTemplate(category, timeType, specificTemplate = null) {
        const templates = this.questTemplates[category];
        if (!templates || templates.length === 0) return null;
        
        const template = specificTemplate || templates[Math.floor(Math.random() * templates.length)];
        const questId = `${timeType}_${template.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Generate variable values based on time type
        const variables = this.generateVariableValues(template, timeType);
        
        // Replace variables in template
        const quest = this.instantiateTemplate(template, questId, variables, timeType);
        
        return quest;
    }

    /**
     * Generate variable values for template
     */
    generateVariableValues(template, timeType) {
        const variables = {};
        
        template.variables.forEach(variable => {
            switch (variable) {
                case 'species':
                    variables[variable] = this.getRandomFishSpecies();
                    break;
                case 'location':
                    variables[variable] = this.getRandomLocation();
                    break;
                case 'npc':
                    variables[variable] = this.getRandomNPC();
                    break;
                case 'count':
                    // Adjust count based on time type and difficulty
                    const baseCount = timeType === 'daily' ? 5 : 15;
                    const difficultyMultiplier = template.difficulty === 'hard' ? 1.5 : template.difficulty === 'easy' ? 0.7 : 1;
                    variables[variable] = Math.ceil(baseCount * difficultyMultiplier);
                    break;
                case 'points':
                    variables[variable] = timeType === 'daily' ? 10 : 25;
                    break;
                default:
                    variables[variable] = 'default';
            }
        });
        
        return variables;
    }

    /**
     * Instantiate template with variables
     */
    instantiateTemplate(template, questId, variables, timeType) {
        let title = template.title;
        let description = template.description;
        
        // Replace variables in title and description
        Object.entries(variables).forEach(([key, value]) => {
            const placeholder = `{${key}}`;
            title = title.replace(new RegExp(placeholder, 'g'), value);
            description = description.replace(new RegExp(placeholder, 'g'), value);
        });
        
        // Process objectives
        const objectives = template.objectives.map(obj => {
            let objDescription = obj.description;
            let objTarget = obj.target;
            
            Object.entries(variables).forEach(([key, value]) => {
                const placeholder = `{${key}}`;
                objDescription = objDescription.replace(new RegExp(placeholder, 'g'), value);
                if (typeof objTarget === 'string') {
                    objTarget = objTarget.replace(new RegExp(placeholder, 'g'), value);
                }
            });
            
            return {
                ...obj,
                description: objDescription,
                target: parseInt(objTarget) || objTarget,
                progress: 0,
                completed: false
            };
        });
        
        // Calculate rewards based on time type
        const rewardMultiplier = timeType === 'weekly' ? 3 : 1;
        const rewards = {
            coins: Math.ceil(template.baseRewards.coins * rewardMultiplier),
            experience: Math.ceil(template.baseRewards.experience * rewardMultiplier)
        };
        
        // Add time-based quest properties
        const expireTime = Date.now() + this.timeBasedQuests[timeType].expireTime;
        
        return {
            id: questId,
            type: `${timeType}_quest`,
            title: title,
            description: description,
            objectives: objectives,
            rewards: rewards,
            requirements: [],
            timeType: timeType,
            expiresAt: expireTime,
            generated: true,
            template: template.id
        };
    }

    /**
     * Start quest chain
     */
    startQuestChain(chainId, questId) {
        const chain = this.questChainDefinitions.find(c => c.id === chainId);
        const chainState = this.gameState.questChains[chainId];
        
        if (!chain || !chainState) return false;
        
        if (chainState.availableQuests.includes(questId)) {
            // Start the quest
            const quest = chain.quests.find(q => q.id === questId);
            if (quest) {
                // Add to main quest manager
                this.questManager.addQuest({
                    ...quest,
                    chainId: chainId,
                    chainQuest: true
                });
                
                // Update chain state
                chainState.currentQuest = questId;
                chainState.availableQuests = chainState.availableQuests.filter(id => id !== questId);
                
                console.log(`AdvancedQuestSystem: Started chain quest ${questId} in chain ${chainId}`);
                return true;
            }
        }
        
        return false;
    }

    /**
     * Complete quest chain quest
     */
    completeChainQuest(chainId, questId) {
        const chain = this.questChainDefinitions.find(c => c.id === chainId);
        const chainState = this.gameState.questChains[chainId];
        
        if (!chain || !chainState) return;
        
        const quest = chain.quests.find(q => q.id === questId);
        if (!quest) return;
        
        // Mark quest as completed in chain
        chainState.completedQuests.push(questId);
        chainState.currentQuest = null;
        
        // Unlock next quests
        if (quest.nextQuests) {
            quest.nextQuests.forEach(nextQuestId => {
                if (!chainState.availableQuests.includes(nextQuestId)) {
                    chainState.availableQuests.push(nextQuestId);
                }
            });
        }
        
        // Check if chain is complete
        if (chainState.completedQuests.length === chain.quests.length) {
            this.completeQuestChain(chainId);
        }
        
        console.log(`AdvancedQuestSystem: Completed chain quest ${questId}`);
    }

    /**
     * Complete entire quest chain
     */
    completeQuestChain(chainId) {
        const chain = this.questChainDefinitions.find(c => c.id === chainId);
        const chainState = this.gameState.questChains[chainId];
        
        if (!chain || !chainState || chainState.chainCompleted) return;
        
        chainState.chainCompleted = true;
        chainState.completedAt = new Date().toISOString();
        
        // Award chain completion rewards
        if (chain.chainRewards) {
            this.awardChainRewards(chain.chainRewards);
        }
        
        // Trigger notification
        if (this.notificationManager) {
            this.notificationManager.showNotification({
                type: 'chain_complete',
                title: 'Quest Chain Complete!',
                message: `Completed: ${chain.name}`,
                icon: 'chain'
            });
        }
        
        console.log(`AdvancedQuestSystem: Completed quest chain ${chain.name}`);
    }

    /**
     * Award chain completion rewards
     */
    awardChainRewards(rewards) {
        // Implementation depends on available game systems
        console.log('AdvancedQuestSystem: Awarding chain rewards:', rewards);
        
        // Example implementation:
        if (rewards.coins && this.gameState.player) {
            this.gameState.player.coins = (this.gameState.player.coins || 0) + rewards.coins;
        }
        
        if (rewards.experience && this.gameState.player) {
            this.gameState.player.experience = (this.gameState.player.experience || 0) + rewards.experience;
        }
        
        // Trigger achievement unlocks, item awards, etc.
    }

    /**
     * Reset daily quests
     */
    resetDailyQuests() {
        const today = new Date().toDateString();
        this.gameState.dailyQuests = {
            lastReset: today,
            availableQuests: [],
            completedToday: []
        };
        
        this.generateDailyQuests();
        console.log('AdvancedQuestSystem: Daily quests reset');
    }

    /**
     * Reset weekly quests
     */
    resetWeeklyQuests() {
        const weekStart = this.getWeekStart();
        this.gameState.weeklyQuests = {
            lastReset: weekStart,
            availableQuests: [],
            completedThisWeek: []
        };
        
        this.generateWeeklyQuests();
        console.log('AdvancedQuestSystem: Weekly quests reset');
    }

    /**
     * Get start of current week
     */
    getWeekStart() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const difference = dayOfWeek === 0 ? 0 : dayOfWeek; // Sunday = 0
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - difference);
        weekStart.setHours(0, 0, 0, 0);
        return weekStart.toISOString();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for quest completion events
        if (this.questManager.scene?.events) {
            this.questManager.scene.events.on('quest-completed', (data) => {
                this.onQuestCompleted(data);
            });
        }
    }

    /**
     * Handle quest completion
     */
    onQuestCompleted(data) {
        const { questId, quest } = data;
        
        // Handle time-based quest completion
        if (quest.timeType === 'daily') {
            this.gameState.dailyQuests.completedToday.push(questId);
        } else if (quest.timeType === 'weekly') {
            this.gameState.weeklyQuests.completedThisWeek.push(questId);
        }
        
        // Handle chain quest completion
        if (quest.chainId) {
            this.completeChainQuest(quest.chainId, questId);
        }
        
        // Track quest metrics
        this.trackQuestMetrics(quest);
    }

    /**
     * Track quest completion metrics
     */
    trackQuestMetrics(quest) {
        if (!this.questMetrics.has(quest.type)) {
            this.questMetrics.set(quest.type, {
                completed: 0,
                totalRewards: { coins: 0, experience: 0 },
                averageCompletionTime: 0
            });
        }
        
        const metrics = this.questMetrics.get(quest.type);
        metrics.completed++;
        
        if (quest.rewards) {
            metrics.totalRewards.coins += quest.rewards.coins || 0;
            metrics.totalRewards.experience += quest.rewards.experience || 0;
        }
        
        this.questMetrics.set(quest.type, metrics);
    }

    /**
     * Start quest timers for automatic resets
     */
    startQuestTimers() {
        // Daily reset timer
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const msUntilMidnight = tomorrow.getTime() - now.getTime();
        
        setTimeout(() => {
            this.resetDailyQuests();
            // Set recurring timer for daily resets
            setInterval(() => this.resetDailyQuests(), 24 * 60 * 60 * 1000);
        }, msUntilMidnight);
        
        // Weekly reset timer
        const nextSunday = new Date(now);
        const daysUntilSunday = 7 - now.getDay();
        nextSunday.setDate(now.getDate() + daysUntilSunday);
        nextSunday.setHours(0, 0, 0, 0);
        const msUntilSunday = nextSunday.getTime() - now.getTime();
        
        setTimeout(() => {
            this.resetWeeklyQuests();
            // Set recurring timer for weekly resets
            setInterval(() => this.resetWeeklyQuests(), 7 * 24 * 60 * 60 * 1000);
        }, msUntilSunday);
    }

    /**
     * Helper methods for random generation
     */
    getRandomFishSpecies() {
        const species = ['Bass', 'Trout', 'Salmon', 'Tuna', 'Mackerel', 'Cod', 'Snapper'];
        return species[Math.floor(Math.random() * species.length)];
    }

    getRandomLocation() {
        const locations = ['Ocean Harbor', 'Mountain Stream', 'Beginner Lake', 'Midnight Pond'];
        return locations[Math.floor(Math.random() * locations.length)];
    }

    getRandomNPC() {
        const npcs = ['Mia', 'Sophie', 'Luna'];
        return npcs[Math.floor(Math.random() * npcs.length)];
    }

    getRandomTemplate() {
        const categories = Object.keys(this.questTemplates);
        const category = categories[Math.floor(Math.random() * categories.length)];
        const templates = this.questTemplates[category];
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        return { category, template };
    }

    /**
     * Get quest analytics
     */
    getQuestAnalytics() {
        return {
            dailyQuests: this.gameState.dailyQuests,
            weeklyQuests: this.gameState.weeklyQuests,
            questChains: this.gameState.questChains,
            metrics: Object.fromEntries(this.questMetrics),
            totalCompleted: Array.from(this.questMetrics.values()).reduce((sum, m) => sum + m.completed, 0)
        };
    }

    /**
     * Get available quest chains
     */
    getAvailableQuestChains() {
        return this.questChainDefinitions.map(chain => ({
            ...chain,
            state: this.gameState.questChains[chain.id]
        }));
    }

    /**
     * Check if quest has expired
     */
    isQuestExpired(quest) {
        if (!quest.expiresAt) return false;
        return Date.now() > quest.expiresAt;
    }

    /**
     * Clean up expired quests
     */
    cleanupExpiredQuests() {
        // Implementation for cleaning up expired quests
        // This might involve moving them from active/available to a separate 'expired' state
        // and notifying the player if necessary.
        console.log('AdvancedQuestSystem: Cleaning up expired quests...');
        // Example: Iterate through active and available quests from the base QuestManager
        // and check this.isQuestExpired(quest)
    }

    // Method to get available quests for a specific NPC
    getAvailableQuestsForNPC(npcId) {
        const availableForNpc = [];
        if (!this.questManager || !this.questManager.availableQuests) {
            console.warn('AdvancedQuestSystem: Base QuestManager or availableQuests not found.');
            return availableForNpc;
        }

        for (const quest of this.questManager.availableQuests.values()) {
            // Check association with NPC (e.g., by ID naming convention or a specific 'giver' field)
            // Assuming quests given by NPCs might be named like 'npc_mia_quest1'
            // or have a quest.giver === npcId property.
            const isNpcQuest = quest.id.startsWith(`npc_${npcId}_`) || quest.giver === npcId;

            if (isNpcQuest && !this.isQuestExpired(quest) && this.questManager.checkRequirements(quest.requirements || [])) {
                // Further checks: ensure quest is not already active or completed by player
                if (!this.questManager.activeQuests.has(quest.id) && !this.questManager.completedQuests.has(quest.id)) {
                    availableForNpc.push(quest);
                }
            }
        }
        // Additionally, consider dynamically generated quests from AdvancedQuestSystem
        // that might be available from this NPC. This part needs more info on how dynamic quests are linked to NPCs.
        return availableForNpc;
    }

    // Method to get quests ready to be turned in to a specific NPC
    getQuestsReadyForTurnInForNPC(npcId) {
        const turnInReady = [];
        if (!this.questManager || !this.questManager.activeQuests) {
            console.warn('AdvancedQuestSystem: Base QuestManager or activeQuests not found.');
            return turnInReady;
        }

        for (const quest of this.questManager.activeQuests.values()) {
            // Check if quest is to be turned in to this NPC
            // This might be based on a quest.turnInTo === npcId property,
            // or implicitly if it's an NPC-specific quest.
            const canTurnInToNpc = quest.turnInTo === npcId || quest.id.startsWith(`npc_${npcId}_`);

            if (canTurnInToNpc) {
                const allObjectivesComplete = quest.objectives.every(obj => obj.completed);
                if (allObjectivesComplete) {
                    turnInReady.push(quest);
                }
            }
        }
        return turnInReady;
    }
} 