/**
 * Quest Data Loader - Loads quest data from JSON files
 * Provides quest templates and instantiation methods for quest managers
 */
export class QuestDataLoader {
    constructor() {
        this.questData = null;
        this.questTemplates = new Map();
        this.questChains = new Map();
        this.questCategories = new Map();
        this.questSettings = {};
        
        console.log('QuestDataLoader: Initialized');
    }

    /**
     * Load quest data from JSON file
     */
    async loadQuestData() {
        try {
            console.log('QuestDataLoader: Loading quest data from JSON...');
            
            const response = await fetch('./src/data/quests.json');
            if (!response.ok) {
                throw new Error(`Failed to load quest data: ${response.status}`);
            }
            
            this.questData = await response.json();
            this.processQuestData();
            
            console.log('QuestDataLoader: Quest data loaded successfully');
            console.log(`- Story quests: ${this.questData.questTemplates.story.length}`);
            console.log(`- NPC quests: ${this.questData.questTemplates.npc.length}`);
            console.log(`- Daily templates: ${this.questData.questTemplates.daily.length}`);
            console.log(`- Weekly templates: ${this.questData.questTemplates.weekly.length}`);
            console.log(`- Event quests: ${this.questData.questTemplates.event.length}`);
            console.log(`- Quest chains: ${this.questData.questChains.length}`);
            
            return true;
        } catch (error) {
            console.error('QuestDataLoader: Error loading quest data:', error);
            this.loadFallbackData();
            return false;
        }
    }

    /**
     * Process loaded quest data into organized structures
     */
    processQuestData() {
        // Process quest templates by category
        Object.entries(this.questData.questTemplates).forEach(([category, quests]) => {
            quests.forEach(quest => {
                this.questTemplates.set(quest.id, {
                    ...quest,
                    category: category
                });
            });
        });

        // Process quest chains
        this.questData.questChains.forEach(chain => {
            this.questChains.set(chain.id, chain);
        });

        // Process quest categories
        Object.entries(this.questData.questCategories).forEach(([key, category]) => {
            this.questCategories.set(key, category);
        });

        // Store quest settings
        this.questSettings = this.questData.questSettings;
    }

    /**
     * Load fallback data if JSON loading fails
     */
    loadFallbackData() {
        console.log('QuestDataLoader: Loading fallback quest data...');
        
        // Basic fallback quest
        const fallbackQuest = {
            id: 'story_001_tutorial',
            type: 'main_story',
            title: 'Welcome to Luxury Angling',
            description: 'Learn the basics of fishing.',
            objectives: [
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
                coins: 500,
                experience: 100
            },
            requirements: [],
            category: 'story'
        };
        
        this.questTemplates.set(fallbackQuest.id, fallbackQuest);
        
        // Basic settings
        this.questSettings = {
            dailyQuestCount: 3,
            weeklyQuestCount: 2,
            maxActiveQuests: 10,
            autoStartStoryQuests: true
        };
    }

    /**
     * Get all quest templates
     */
    getAllQuestTemplates() {
        return Array.from(this.questTemplates.values());
    }

    /**
     * Get quest templates by category
     */
    getQuestTemplatesByCategory(category) {
        try {
            if (!this.questTemplates || this.questTemplates.size === 0) {
                console.warn(`QuestDataLoader: No quest templates available for category: ${category}`);
                return [];
            }
            
            return Array.from(this.questTemplates.values()).filter(quest => 
                quest.category === category
            );
        } catch (error) {
            console.error(`QuestDataLoader: Error getting quest templates for category ${category}:`, error);
            return [];
        }
    }

    /**
     * Get specific quest template by ID
     */
    getQuestTemplate(questId) {
        return this.questTemplates.get(questId);
    }

    /**
     * Get all quest chains
     */
    getAllQuestChains() {
        return Array.from(this.questChains.values());
    }

    /**
     * Get specific quest chain by ID
     */
    getQuestChain(chainId) {
        return this.questChains.get(chainId);
    }

    /**
     * Get quest categories
     */
    getQuestCategories() {
        return this.questCategories;
    }

    /**
     * Get quest settings
     */
    getQuestSettings() {
        try {
            if (!this.questSettings || Object.keys(this.questSettings).length === 0) {
                console.warn('QuestDataLoader: Quest settings not available, using defaults');
                return {
                    dailyQuestCount: 3,
                    weeklyQuestCount: 2,
                    maxActiveQuests: 10,
                    autoStartStoryQuests: true
                };
            }
            
            return this.questSettings;
        } catch (error) {
            console.error('QuestDataLoader: Error getting quest settings:', error);
            return {
                dailyQuestCount: 3,
                weeklyQuestCount: 2,
                maxActiveQuests: 10,
                autoStartStoryQuests: true
            };
        }
    }

    /**
     * Instantiate a quest from template with variable substitution
     */
    instantiateQuest(templateId, variables = {}) {
        const template = this.questTemplates.get(templateId);
        if (!template) {
            console.warn(`QuestDataLoader: Template not found: ${templateId}`);
            return null;
        }

        // Deep clone the template
        const quest = JSON.parse(JSON.stringify(template));
        
        // Generate unique ID for instantiated quest
        quest.id = `${templateId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        quest.templateId = templateId;
        quest.instantiated = true;
        quest.dateCreated = new Date().toISOString();

        // Apply variable substitution if template has variables
        if (template.variables && Object.keys(variables).length === 0) {
            variables = this.generateVariablesFromTemplate(template);
        }

        if (Object.keys(variables).length > 0) {
            quest = this.applyVariableSubstitution(quest, variables);
        }

        return quest;
    }

    /**
     * Generate random variables from template definition
     */
    generateVariablesFromTemplate(template) {
        const variables = {};
        
        if (template.variables) {
            Object.entries(template.variables).forEach(([key, possibleValues]) => {
                if (Array.isArray(possibleValues)) {
                    variables[key] = possibleValues[Math.floor(Math.random() * possibleValues.length)];
                } else {
                    variables[key] = possibleValues;
                }
            });
        }

        return variables;
    }

    /**
     * Apply variable substitution to quest
     */
    applyVariableSubstitution(quest, variables) {
        // Substitute in title and description
        Object.entries(variables).forEach(([key, value]) => {
            const placeholder = `{${key}}`;
            const regex = new RegExp(placeholder, 'g');
            
            if (quest.title) {
                quest.title = quest.title.replace(regex, value);
            }
            if (quest.description) {
                quest.description = quest.description.replace(regex, value);
            }
        });

        // Substitute in objectives
        if (quest.objectives) {
            quest.objectives.forEach(objective => {
                Object.entries(variables).forEach(([key, value]) => {
                    const placeholder = `{${key}}`;
                    const regex = new RegExp(placeholder, 'g');
                    
                    if (objective.description) {
                        objective.description = objective.description.replace(regex, value);
                    }
                    if (typeof objective.target === 'string') {
                        objective.target = objective.target.replace(regex, value);
                        // Try to convert to number if it's a numeric string
                        if (!isNaN(objective.target)) {
                            objective.target = parseInt(objective.target);
                        }
                    }
                    if (objective.species) {
                        objective.species = objective.species.replace(regex, value);
                    }
                    if (objective.location) {
                        objective.location = objective.location.replace(regex, value);
                    }
                    if (objective.npc) {
                        objective.npc = objective.npc.replace(regex, value);
                    }
                });
            });
        }

        // Substitute in rewards
        if (quest.rewards && quest.rewards.romance) {
            const newRomance = {};
            Object.entries(quest.rewards.romance).forEach(([npcKey, value]) => {
                Object.entries(variables).forEach(([varKey, varValue]) => {
                    const placeholder = `{${varKey}}`;
                    if (npcKey.includes(placeholder)) {
                        const newKey = npcKey.replace(placeholder, varValue);
                        newRomance[newKey] = value;
                    } else {
                        newRomance[npcKey] = value;
                    }
                });
            });
            quest.rewards.romance = newRomance;
        }

        // Store the variables used for this quest
        quest.variables = variables;

        return quest;
    }

    /**
     * Generate daily quests
     */
    generateDailyQuests(count = null) {
        const questCount = count || this.questSettings.dailyQuestCount || 3;
        const dailyTemplates = this.getQuestTemplatesByCategory('daily');
        const generatedQuests = [];

        for (let i = 0; i < Math.min(questCount, dailyTemplates.length); i++) {
            const template = dailyTemplates[i];
            const quest = this.instantiateQuest(template.id);
            if (quest) {
                quest.timeType = 'daily';
                quest.expiresAt = Date.now() + (template.expiresIn || 86400000); // 24 hours
                generatedQuests.push(quest);
            }
        }

        console.log(`QuestDataLoader: Generated ${generatedQuests.length} daily quests`);
        return generatedQuests;
    }

    /**
     * Generate weekly quests
     */
    generateWeeklyQuests(count = null) {
        const questCount = count || this.questSettings.weeklyQuestCount || 2;
        const weeklyTemplates = this.getQuestTemplatesByCategory('weekly');
        const generatedQuests = [];

        for (let i = 0; i < Math.min(questCount, weeklyTemplates.length); i++) {
            const template = weeklyTemplates[i];
            const quest = this.instantiateQuest(template.id);
            if (quest) {
                quest.timeType = 'weekly';
                quest.expiresAt = Date.now() + (template.expiresIn || 604800000); // 7 days
                generatedQuests.push(quest);
            }
        }

        console.log(`QuestDataLoader: Generated ${generatedQuests.length} weekly quests`);
        return generatedQuests;
    }

    /**
     * Get story quests in order
     */
    getStoryQuests() {
        return this.getQuestTemplatesByCategory('story').sort((a, b) => {
            // Sort by ID to maintain story order
            return a.id.localeCompare(b.id);
        });
    }

    /**
     * Get NPC quests for specific NPC
     */
    getNPCQuests(npcId) {
        return this.getQuestTemplatesByCategory('npc').filter(quest => 
            quest.giver === npcId || quest.turnInTo === npcId
        );
    }

    /**
     * Get event quests that are currently active
     */
    getActiveEventQuests() {
        const now = new Date();
        return this.getQuestTemplatesByCategory('event').filter(quest => {
            if (!quest.startDate || !quest.endDate) return true;
            
            const startDate = new Date(quest.startDate);
            const endDate = new Date(quest.endDate);
            
            return now >= startDate && now <= endDate;
        });
    }

    /**
     * Validate quest data integrity
     */
    validateQuestData() {
        const errors = [];
        
        // Check for duplicate quest IDs
        const questIds = new Set();
        this.questTemplates.forEach((quest, id) => {
            if (questIds.has(id)) {
                errors.push(`Duplicate quest ID: ${id}`);
            }
            questIds.add(id);
        });

        // Check quest requirements reference valid quests
        this.questTemplates.forEach((quest, id) => {
            if (quest.requirements) {
                quest.requirements.forEach(reqId => {
                    if (!this.questTemplates.has(reqId)) {
                        errors.push(`Quest ${id} requires non-existent quest: ${reqId}`);
                    }
                });
            }
        });

        // Check quest chain integrity
        this.questChains.forEach((chain, chainId) => {
            chain.quests.forEach(quest => {
                if (quest.nextQuests) {
                    quest.nextQuests.forEach(nextQuestId => {
                        const nextQuest = chain.quests.find(q => q.id === nextQuestId);
                        if (!nextQuest) {
                            errors.push(`Chain ${chainId}: Quest ${quest.id} references non-existent next quest: ${nextQuestId}`);
                        }
                    });
                }
            });
        });

        if (errors.length > 0) {
            console.warn('QuestDataLoader: Quest data validation errors:', errors);
        } else {
            console.log('QuestDataLoader: Quest data validation passed');
        }

        return errors;
    }

    /**
     * Get quest statistics
     */
    getQuestStatistics() {
        const stats = {
            totalQuests: this.questTemplates.size,
            questsByCategory: {},
            questChains: this.questChains.size,
            averageObjectivesPerQuest: 0,
            questsWithRewards: 0
        };

        // Count by category
        this.questTemplates.forEach(quest => {
            const category = quest.category || 'unknown';
            stats.questsByCategory[category] = (stats.questsByCategory[category] || 0) + 1;
        });

        // Calculate averages
        let totalObjectives = 0;
        let questsWithRewards = 0;
        
        this.questTemplates.forEach(quest => {
            if (quest.objectives) {
                totalObjectives += quest.objectives.length;
            }
            if (quest.rewards && Object.keys(quest.rewards).length > 0) {
                questsWithRewards++;
            }
        });

        stats.averageObjectivesPerQuest = totalObjectives / this.questTemplates.size;
        stats.questsWithRewards = questsWithRewards;

        return stats;
    }
}

// Create global instance
export const questDataLoader = new QuestDataLoader(); 