/**
 * Simplified Quest Manager for testing reward UI
 */
export class QuestManager {
    constructor(scene) {
        this.scene = scene;
        this.activeQuests = new Map();
        this.completedQuests = new Set();
        this.availableQuests = new Map();
        
        // Quest status
        this.QUEST_STATUS = {
            AVAILABLE: 'available',
            ACTIVE: 'active',
            COMPLETED: 'completed',
            FAILED: 'failed',
            LOCKED: 'locked'
        };
        
        this.QUEST_TYPES = {
            MAIN_STORY: 'main_story',
            SIDE_EVENT: 'side_event', 
            NPC_CHATROOM: 'npc_chatroom',
            FISHING: 'fishing',
            CRAFTING: 'crafting'
        };
        
        this.initializeQuests();
    }

    initializeQuests() {
        // Add tutorial quest
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
        
        // Start tutorial quest automatically
        this.startQuest('story_001_tutorial');
    }

    addQuest(questData) {
        this.availableQuests.set(questData.id, {
            ...questData,
            status: this.QUEST_STATUS.AVAILABLE,
            dateCreated: new Date(),
            progress: 0
        });
        
            }

    startQuest(questId) {
        const quest = this.availableQuests.get(questId);
        if (!quest) {
            console.warn('QuestManager: Quest not found:', questId);
            return false;
        }

        quest.status = this.QUEST_STATUS.ACTIVE;
        quest.dateStarted = new Date();
        this.activeQuests.set(questId, quest);
        this.availableQuests.delete(questId);

        console.log('QuestManager: Started quest:', quest.title);
        return true;
    }

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

        return true;
    }

    checkQuestCompletion(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return false;

        const allCompleted = quest.objectives.every(obj => obj.completed);
        
        if (allCompleted) {
            this.completeQuest(questId);
        }

        return allCompleted;
    }

    completeQuest(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return false;

        quest.status = this.QUEST_STATUS.COMPLETED;
        quest.dateCompleted = new Date();
        
        // Move to completed quests
        this.completedQuests.add(questId);
        this.activeQuests.delete(questId);

        console.log('QuestManager: Completed quest:', quest.title);

        // Calculate and show rewards
        const rewardSummary = this.calculateRewardSummary(quest);
        
        // Show Reward UI with delay
        setTimeout(() => this.showQuestRewardUI(quest, rewardSummary), 500);

        return true;
    }

    calculateRewardSummary(quest) {
        const rewards = quest.rewards || {};
        
        return {
            questTitle: quest.title,
            questType: quest.type,
            questDescription: quest.description,
            coins: rewards.coins || 0,
            experience: rewards.experience || 0,
            items: rewards.items || [],
            achievements: rewards.achievements || [],
            romanceBonus: rewards.romance_bonus || null,
            totalQuestsCompleted: this.completedQuests.size + 1
        };
    }

    showQuestRewardUI(quest, rewardSummary) {
        console.log('QuestManager: Showing Quest Reward UI for:', quest.title);
        
        // Always show console summary first
        this.showConsoleRewardSummary(quest, rewardSummary);
        
        // Find scene for UI
        let targetScene = this.findBestSceneForUI();
        
        if (targetScene?.add && targetScene?.cameras) {
            console.log('QuestManager: Creating reward overlay with scene:', targetScene.scene?.key);
            this.createSimpleRewardOverlay(quest, rewardSummary, targetScene);
        } else {
            console.warn('QuestManager: No suitable scene found for reward UI');
        }
    }

    findBestSceneForUI() {
        // Check current scene
        if (this.scene?.add && this.scene?.cameras && this.scene?.scene?.sys?.isActive()) {
            console.log('QuestManager: Using current scene:', this.scene.scene.key);
            return this.scene;
        }
        
        // Try global game instance
        try {
            if (typeof window !== 'undefined' && window.game?.scene?.scenes) {
                const scenes = window.game.scene.scenes;
                const activeScenes = scenes.filter(s => 
                    s.scene.sys.isActive() && s.add && s.cameras
                );
                if (activeScenes.length > 0) {
                    console.log('QuestManager: Using global game scene:', activeScenes[0].scene.key);
                    return activeScenes[0];
                }
            }
        } catch (error) {
            console.log('QuestManager: Error in global game approach:', error);
        }
        
        return null;
    }

    createSimpleRewardOverlay(quest, rewardSummary, scene) {
        try {
            console.log('QuestManager: Creating simple reward overlay');
            
            // Get dimensions
            const width = scene.cameras?.main?.width || 1024;
            const height = scene.cameras?.main?.height || 768;
            
            // Create overlay
            const overlay = scene.add.container(0, 0);
            
            // Background
            const bg = scene.add.rectangle(0, 0, width, height, 0x000000, 0.8);
            bg.setOrigin(0);
            bg.setInteractive();
            overlay.add(bg);
            
            // Panel
            const panelWidth = Math.min(600, width - 40);
            const panelHeight = Math.min(400, height - 40);
            const centerX = width / 2;
            const centerY = height / 2;
            
            const panel = scene.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x1a1a1a, 0.95);
            panel.setStrokeStyle(3, 0xFFD700);
            overlay.add(panel);
            
            // Title
            const title = scene.add.text(centerX, centerY - panelHeight/2 + 40, '🎉 QUEST COMPLETED! 🎉', {
                fontSize: '28px',
                fill: '#FFD700',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            overlay.add(title);
            
            // Quest name
            const questName = scene.add.text(centerX, centerY - panelHeight/2 + 80, quest.title, {
                fontSize: '20px',
                fill: '#FFFFFF',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            overlay.add(questName);
            
            // Rewards
            let currentY = centerY - 40;
            
            if (rewardSummary.experience > 0) {
                const expText = scene.add.text(centerX, currentY, `📈 Experience: +${rewardSummary.experience}`, {
                    fontSize: '16px',
                    fill: '#00FF00'
                }).setOrigin(0.5);
                overlay.add(expText);
                currentY += 30;
            }
            
            if (rewardSummary.coins > 0) {
                const coinText = scene.add.text(centerX, currentY, `💰 Coins: +${rewardSummary.coins}`, {
                    fontSize: '16px',
                    fill: '#FFD700'
                }).setOrigin(0.5);
                overlay.add(coinText);
                currentY += 30;
            }
            
            if (rewardSummary.items.length > 0) {
                const itemText = scene.add.text(centerX, currentY, `🎁 Items: ${rewardSummary.items.join(', ')}`, {
                    fontSize: '16px',
                    fill: '#FFFFFF'
                }).setOrigin(0.5);
                overlay.add(itemText);
                currentY += 30;
            }
            
            // Close button
            const closeButton = scene.add.rectangle(centerX, centerY + panelHeight/2 - 40, 150, 40, 0xFFD700, 0.9);
            closeButton.setStrokeStyle(2, 0xFFFFFF);
            const closeText = scene.add.text(centerX, centerY + panelHeight/2 - 40, 'Continue', {
                fontSize: '16px',
                fill: '#000000',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            overlay.add(closeButton);
            overlay.add(closeText);
            
            // Make interactive
            closeButton.setInteractive({ useHandCursor: true });
            closeButton.on('pointerdown', () => {
                console.log('QuestManager: Closing reward overlay');
                overlay.destroy();
            });
            
            bg.on('pointerdown', () => {
                console.log('QuestManager: Closing reward overlay (background click)');
                overlay.destroy();
            });
            
            overlay.setDepth(10000);
            
            console.log('QuestManager: Simple reward overlay created successfully');
            return true;
            
        } catch (error) {
            console.error('QuestManager: Error creating simple reward overlay:', error);
            return false;
        }
    }

    showConsoleRewardSummary(quest, rewardSummary) {
        console.log('🎉 QUEST COMPLETED! 🎉');
        console.log('='.repeat(40));
        console.log(`Quest: ${quest.title}`);
        console.log(`Type: ${quest.type}`);
        console.log('-'.repeat(40));
        
        if (rewardSummary.experience > 0) {
            console.log(`📈 Experience: +${rewardSummary.experience}`);
        }
        
        if (rewardSummary.coins > 0) {
            console.log(`💰 Coins: +${rewardSummary.coins}`);
        }
        
        if (rewardSummary.items.length > 0) {
            console.log('🎁 Items Received:');
            rewardSummary.items.forEach(item => {
                console.log(`  • ${item}`);
            });
        }
        
        console.log(`Quest Progress: ${rewardSummary.totalQuestsCompleted} quests completed`);
        console.log('='.repeat(40));
    }

    onBoatMenuAccessed() {
        console.log('QuestManager: onBoatMenuAccessed called');
        const completed = this.completeObjective('story_001_tutorial', 'visit_boat_menu');
            }

    debugCompleteQuest(questId = 'story_001_tutorial') {
        console.log(`🧪 DEBUG: Force completing quest: ${questId}`);
        
        if (!this.activeQuests.has(questId)) {
            if (this.availableQuests.has(questId)) {
                this.startQuest(questId);
            } else {
                console.warn('Quest not found:', questId);
                return;
            }
        }
        
        const quest = this.activeQuests.get(questId);
        if (quest) {
            quest.objectives.forEach(objective => {
                objective.completed = true;
                if (objective.target) {
                    objective.progress = objective.target;
                }
            });
            
            this.completeQuest(questId);
            if (import.meta.env.DEV) console.log('✅ DEBUG: Quest completed and reward UI should be displayed');
        }
    }

    forceShowTestRewardUI(targetScene = null) {
        console.log('🚨 FORCE TEST: Attempting to show reward UI');
        
        const scene = targetScene || this.scene;
        if (!scene?.add) {
            console.error('🚨 FORCE TEST: No valid scene available');
            return false;
        }
        
        console.log('🚨 FORCE TEST: Using scene:', scene.scene?.key);
        
        try {
            const overlay = scene.add.container(0, 0);
            
            const bg = scene.add.rectangle(0, 0, 800, 600, 0x000000, 0.9);
            bg.setOrigin(0);
            bg.setInteractive();
            overlay.add(bg);
            
            const title = scene.add.text(400, 200, '🎉 QUEST REWARD TEST 🎉', {
                fontSize: '32px',
                fill: '#FFD700',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            overlay.add(title);
            
            const message = scene.add.text(400, 300, 'If you can see this, the reward UI works!\nClick anywhere to close.', {
                fontSize: '18px',
                fill: '#FFFFFF',
                align: 'center'
            }).setOrigin(0.5);
            overlay.add(message);
            
            bg.on('pointerdown', () => {
                overlay.destroy();
                console.log('🚨 FORCE TEST: Reward UI closed');
            });
            
            overlay.setDepth(10000);
            
            console.log('🚨 FORCE TEST: Simple reward UI created successfully');
            return true;
            
        } catch (error) {
            console.error('🚨 FORCE TEST: Error creating simple reward UI:', error);
            return false;
        }
    }
} 