// PlayerProgressionUI.js - Comprehensive UI for player progression and skill trees
export class PlayerProgressionUI {
    constructor(scene, x = 50, y = 50, width = 900, height = 700) {
        this.scene = scene;
        this.gameState = scene.gameState;
        this.playerProgression = scene.gameState.playerProgression;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        this.isVisible = false;
        this.currentTab = 'overview';
        this.selectedSkillTree = null;
        
        this.container = scene.add.container(x, y);
        this.container.setDepth(2000);
        this.container.setVisible(false);
        
        this.createUI();
        this.setupEventListeners();
        
        console.log('PlayerProgressionUI: Comprehensive progression UI initialized');
    }

    createUI() {
        // Main background
        this.background = this.scene.add.graphics();
        this.background.fillStyle(0x1a1a1a, 0.95);
        this.background.fillRoundedRect(0, 0, this.width, this.height, 12);
        this.background.lineStyle(3, 0x4a90e2, 0.8);
        this.background.strokeRoundedRect(0, 0, this.width, this.height, 12);
        this.container.add(this.background);

        // Title
        this.titleText = this.scene.add.text(this.width / 2, 25, 'PLAYER PROGRESSION', {
            fontSize: '24px',
            fontWeight: 'bold',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.container.add(this.titleText);

        // Close button
        this.closeButton = this.scene.add.text(this.width - 30, 25, '✕', {
            fontSize: '24px',
            fontWeight: 'bold',
            fill: '#ff6b6b',
            backgroundColor: '#333333',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5);
        this.closeButton.setInteractive({ useHandCursor: true });
        this.closeButton.on('pointerdown', () => this.hide());
        this.container.add(this.closeButton);

        // Tab buttons
        this.createTabButtons();

        // Content area
        this.contentContainer = this.scene.add.container(20, 80);
        this.container.add(this.contentContainer);

        // Create all tab content
        this.createOverviewTab();
        this.createAchievementsTab();
        this.createSkillTreeTabs();

        // Show initial tab
        this.showTab('overview');
    }

    createTabButtons() {
        const tabs = [
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'achievements', name: 'Achievements', icon: '🏆' },
            { id: 'casting', name: 'Casting', icon: '🎯' },
            { id: 'fishing', name: 'Fishing', icon: '🎣' },
            { id: 'reeling', name: 'Reeling', icon: '⚡' },
            { id: 'luring', name: 'Luring', icon: '🌟' },
            { id: 'exploration', name: 'Explorer', icon: '🗺️' }
        ];

        this.tabButtons = {};
        const tabWidth = 105;
        const startX = 50;

        tabs.forEach((tab, index) => {
            const x = startX + (index * tabWidth);
            const y = 55;

            const button = this.scene.add.graphics();
            button.fillStyle(0x333333, 0.8);
            button.fillRoundedRect(x, y, tabWidth - 5, 35, 5);
            button.lineStyle(2, 0x555555);
            button.strokeRoundedRect(x, y, tabWidth - 5, 35, 5);
            this.container.add(button);

            const text = this.scene.add.text(x + (tabWidth - 5) / 2, y + 17, `${tab.icon} ${tab.name}`, {
                fontSize: '11px',
                fill: '#cccccc',
                align: 'center'
            }).setOrigin(0.5);
            this.container.add(text);

            // Make interactive
            const hitArea = this.scene.add.rectangle(x + (tabWidth - 5) / 2, y + 17, tabWidth - 5, 35, 0x000000, 0);
            hitArea.setInteractive({ useHandCursor: true });
            hitArea.on('pointerdown', () => this.showTab(tab.id));
            this.container.add(hitArea);

            this.tabButtons[tab.id] = { button, text, hitArea };
        });
    }

    createOverviewTab() {
        this.overviewContent = this.scene.add.container(0, 0);
        this.contentContainer.add(this.overviewContent);

        // Player level and experience
        this.levelText = this.scene.add.text(20, 20, 'Level: 1', {
            fontSize: '20px',
            fontWeight: 'bold',
            fill: '#4caf50'
        });
        this.overviewContent.add(this.levelText);

        this.experienceText = this.scene.add.text(20, 50, 'Experience: 0 / 100', {
            fontSize: '16px',
            fill: '#ffffff'
        });
        this.overviewContent.add(this.experienceText);

        // Experience bar
        this.expBarBg = this.scene.add.graphics();
        this.expBarBg.fillStyle(0x333333);
        this.expBarBg.fillRoundedRect(20, 75, 400, 20, 10);
        this.overviewContent.add(this.expBarBg);

        this.expBarFill = this.scene.add.graphics();
        this.overviewContent.add(this.expBarFill);

        // Skill points
        this.skillPointsText = this.scene.add.text(20, 110, 'Skill Points: 0', {
            fontSize: '18px',
            fontWeight: 'bold',
            fill: '#ffeb3b'
        });
        this.overviewContent.add(this.skillPointsText);

        // Statistics
        this.statsTitle = this.scene.add.text(20, 150, 'PROGRESSION STATISTICS', {
            fontSize: '16px',
            fontWeight: 'bold',
            fill: '#4a90e2'
        });
        this.overviewContent.add(this.statsTitle);

        this.statsText = this.scene.add.text(20, 180, '', {
            fontSize: '14px',
            fill: '#cccccc',
            lineSpacing: 5
        });
        this.overviewContent.add(this.statsText);

        // Next level reward
        this.nextRewardTitle = this.scene.add.text(450, 20, 'NEXT LEVEL REWARD', {
            fontSize: '16px',
            fontWeight: 'bold',
            fill: '#4a90e2'
        });
        this.overviewContent.add(this.nextRewardTitle);

        this.nextRewardText = this.scene.add.text(450, 50, '', {
            fontSize: '14px',
            fill: '#cccccc',
            lineSpacing: 5
        });
        this.overviewContent.add(this.nextRewardText);

        // Available skill upgrades
        this.upgradesTitle = this.scene.add.text(450, 200, 'AVAILABLE UPGRADES', {
            fontSize: '16px',
            fontWeight: 'bold',
            fill: '#4a90e2'
        });
        this.overviewContent.add(this.upgradesTitle);

        this.upgradesContainer = this.scene.add.container(450, 230);
        this.overviewContent.add(this.upgradesContainer);
    }

    createAchievementsTab() {
        this.achievementsContent = this.scene.add.container(0, 0);
        this.contentContainer.add(this.achievementsContent);

        // Achievements title
        this.achievementsTitle = this.scene.add.text(20, 20, 'ACHIEVEMENTS', {
            fontSize: '20px',
            fontWeight: 'bold',
            fill: '#4a90e2'
        });
        this.achievementsContent.add(this.achievementsTitle);

        // Achievement categories filter
        this.categoryButtons = {};
        const categories = ['all', 'catch', 'rarity', 'collection', 'skill', 'level', 'wealth', 'exploration'];
        const categoryNames = {
            all: 'All',
            catch: 'Fishing',
            rarity: 'Rare Fish',
            collection: 'Collection',
            skill: 'Skills',
            level: 'Levels',
            wealth: 'Wealth',
            exploration: 'Exploration'
        };

        categories.forEach((category, index) => {
            const x = 20 + (index * 85);
            const y = 55;
            
            const button = this.scene.add.graphics();
            button.fillStyle(0x333333, 0.8);
            button.fillRoundedRect(x, y, 80, 25, 12);
            button.lineStyle(1, 0x555555);
            button.strokeRoundedRect(x, y, 80, 25, 12);
            this.achievementsContent.add(button);

            const text = this.scene.add.text(x + 40, y + 12, categoryNames[category], {
                fontSize: '11px',
                fill: '#cccccc',
                align: 'center'
            }).setOrigin(0.5);
            this.achievementsContent.add(text);

            const hitArea = this.scene.add.rectangle(x + 40, y + 12, 80, 25, 0x000000, 0);
            hitArea.setInteractive({ useHandCursor: true });
            hitArea.on('pointerdown', () => this.filterAchievements(category));
            this.achievementsContent.add(hitArea);

            this.categoryButtons[category] = { button, text, hitArea, x, y };
        });

        // Achievements list container
        this.achievementsListContainer = this.scene.add.container(20, 95);
        this.achievementsContent.add(this.achievementsListContainer);

        // Initialize with all achievements
        this.currentAchievementFilter = 'all';
        this.achievementCards = [];
    }

    filterAchievements(category) {
        this.currentAchievementFilter = category;
        this.updateAchievementsContent();
        this.updateCategoryButtonAppearance(category);
    }

    createAchievementCard(achievement, x, y, width = 400, height = 80) {
        const card = this.scene.add.container(x, y);
        
        // Card background
        const bg = this.scene.add.graphics();
        const bgColor = achievement.completed ? 0x2d5016 : 0x2c2c2c;
        const borderColor = achievement.completed ? 0x4caf50 : 0x555555;
        
        bg.fillStyle(bgColor, 0.9);
        bg.fillRoundedRect(0, 0, width, height, 8);
        bg.lineStyle(2, borderColor);
        bg.strokeRoundedRect(0, 0, width, height, 8);
        card.add(bg);
        
        // Achievement icon
        const icon = this.scene.add.text(15, height / 2, achievement.icon, {
            fontSize: '24px'
        }).setOrigin(0.5);
        card.add(icon);
        
        // Achievement name and description
        const name = this.scene.add.text(45, 15, achievement.name, {
            fontSize: '14px',
            fontWeight: 'bold',
            fill: achievement.completed ? '#4caf50' : '#ffffff'
        });
        card.add(name);
        
        const description = this.scene.add.text(45, 35, achievement.description, {
            fontSize: '11px',
            fill: '#cccccc',
            wordWrap: { width: width - 200 }
        });
        card.add(description);
        
        // Progress bar
        const progressBg = this.scene.add.graphics();
        progressBg.fillStyle(0x1a1a1a);
        progressBg.fillRoundedRect(width - 150, 20, 120, 12, 6);
        card.add(progressBg);
        
        const progressFill = this.scene.add.graphics();
        const progressPercent = achievement.progressPercent || 0;
        const progressColor = achievement.completed ? 0x4caf50 : 0x4a90e2;
        
        progressFill.fillStyle(progressColor);
        progressFill.fillRoundedRect(width - 150, 20, (120 * progressPercent) / 100, 12, 6);
        card.add(progressFill);
        
        // Progress text
        const progressText = this.scene.add.text(width - 90, 26, 
            `${achievement.progress}/${achievement.requirement.value}`, {
            fontSize: '10px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        card.add(progressText);
        
        // Completion date or rewards
        if (achievement.completed && achievement.completedAt) {
            const completedDate = new Date(achievement.completedAt).toLocaleDateString();
            const completedText = this.scene.add.text(width - 90, 45, `Completed: ${completedDate}`, {
                fontSize: '9px',
                fill: '#4caf50',
                align: 'center'
            }).setOrigin(0.5);
            card.add(completedText);
        } else if (achievement.rewards) {
            const rewardParts = [];
            if (achievement.rewards.experience) rewardParts.push(`${achievement.rewards.experience} XP`);
            if (achievement.rewards.coins) rewardParts.push(`${achievement.rewards.coins} coins`);
            if (achievement.rewards.skillPoints) rewardParts.push(`${achievement.rewards.skillPoints} SP`);
            
            const rewardText = this.scene.add.text(width - 90, 45, `Rewards: ${rewardParts.join(', ')}`, {
                fontSize: '9px',
                fill: '#ffeb3b',
                align: 'center',
                wordWrap: { width: 140 }
            }).setOrigin(0.5);
            card.add(rewardText);
        }
        
        return card;
    }

    createSkillTreeTabs() {
        this.skillTreeContents = {};
        
        const skillTrees = this.playerProgression.skillTrees;
        Object.keys(skillTrees).forEach(treeId => {
            this.skillTreeContents[treeId] = this.createSkillTreeContent(treeId);
            this.contentContainer.add(this.skillTreeContents[treeId]);
        });
    }

    createSkillTreeContent(treeId) {
        const container = this.scene.add.container(0, 0);
        const tree = this.playerProgression.skillTrees[treeId];
        
        // Tree header
        const headerText = this.scene.add.text(20, 20, `${tree.icon} ${tree.name}`, {
            fontSize: '22px',
            fontWeight: 'bold',
            fill: '#4caf50'
        });
        container.add(headerText);

        const descText = this.scene.add.text(20, 50, tree.description, {
            fontSize: '14px',
            fill: '#cccccc'
        });
        container.add(descText);

        // Skills grid
        const skillsContainer = this.scene.add.container(20, 90);
        container.add(skillsContainer);

        const skills = Object.entries(tree.skills);
        const skillsPerRow = 2;
        const skillWidth = 380;
        const skillHeight = 120;

        skills.forEach(([skillId, skill], index) => {
            const row = Math.floor(index / skillsPerRow);
            const col = index % skillsPerRow;
            const x = col * (skillWidth + 20);
            const y = row * (skillHeight + 20);

            const skillContainer = this.createSkillCard(treeId, skillId, skill, x, y, skillWidth, skillHeight);
            skillsContainer.add(skillContainer);
        });

        return container;
    }

    createSkillCard(treeId, skillId, skill, x, y, width, height) {
        const container = this.scene.add.container(x, y);
        
        // Background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x2a2a2a, 0.9);
        bg.fillRoundedRect(0, 0, width, height, 8);
        bg.lineStyle(2, 0x555555);
        bg.strokeRoundedRect(0, 0, width, height, 8);
        container.add(bg);

        // Skill name
        const nameText = this.scene.add.text(10, 10, skill.name, {
            fontSize: '16px',
            fontWeight: 'bold',
            fill: '#ffffff'
        });
        container.add(nameText);

        // Skill level
        const levelText = this.scene.add.text(width - 10, 10, '', {
            fontSize: '14px',
            fontWeight: 'bold',
            fill: '#4caf50',
            align: 'right'
        }).setOrigin(1, 0);
        container.add(levelText);

        // Effect description
        const effectText = this.scene.add.text(10, 35, skill.effect, {
            fontSize: '12px',
            fill: '#cccccc',
            wordWrap: { width: width - 20 }
        });
        container.add(effectText);

        // Upgrade button
        const upgradeButton = this.scene.add.graphics();
        upgradeButton.fillStyle(0x4caf50, 0.8);
        upgradeButton.fillRoundedRect(10, height - 35, 100, 25, 5);
        container.add(upgradeButton);

        const upgradeText = this.scene.add.text(60, height - 22, 'UPGRADE', {
            fontSize: '12px',
            fontWeight: 'bold',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        container.add(upgradeText);

        // Make upgrade button interactive
        const upgradeHitArea = this.scene.add.rectangle(60, height - 22, 100, 25, 0x000000, 0);
        upgradeHitArea.setInteractive({ useHandCursor: true });
        upgradeHitArea.on('pointerdown', () => this.upgradeSkill(treeId, skillId));
        container.add(upgradeHitArea);

        // Store references for updates
        container.skillData = {
            treeId, skillId, skill,
            levelText, effectText, upgradeButton, upgradeText, upgradeHitArea
        };

        return container;
    }

    showTab(tabId) {
        this.currentTab = tabId;
        
        // Hide all content
        this.overviewContent.setVisible(false);
        this.achievementsContent.setVisible(false);
        Object.values(this.skillTreeContents).forEach(content => content.setVisible(false));
        
        // Show selected content
        if (tabId === 'overview') {
            this.overviewContent.setVisible(true);
            this.updateOverviewContent();
        } else if (tabId === 'achievements') {
            this.achievementsContent.setVisible(true);
            
            // Initialize filter to 'all' if not set
            if (!this.currentAchievementFilter) {
                this.currentAchievementFilter = 'all';
            }
            
            this.updateAchievementsContent();
            
            // Update category button appearance without triggering filter
            this.updateCategoryButtonAppearance(this.currentAchievementFilter);
        } else if (this.skillTreeContents[tabId]) {
            this.skillTreeContents[tabId].setVisible(true);
            this.updateSkillTreeContent(tabId);
        }
        
        // Update tab button appearance
        Object.entries(this.tabButtons).forEach(([id, button]) => {
            if (id === tabId) {
                button.button.clear();
                button.button.fillStyle(0x4a90e2, 0.8);
                button.button.fillRoundedRect(button.button.x, button.button.y, 100, 35, 5);
                button.text.setFill('#ffffff');
            } else {
                button.button.clear();
                button.button.fillStyle(0x333333, 0.8);
                button.button.fillRoundedRect(button.button.x, button.button.y, 100, 35, 5);
                button.text.setFill('#cccccc');
            }
        });
    }

    updateOverviewContent() {
        const summary = this.playerProgression.getProgressionSummary();
        const player = this.gameState.player;
        
        // Update level and experience
        this.levelText.setText(`Level: ${summary.level}`);
        this.experienceText.setText(`Experience: ${summary.experience} / ${summary.experience + summary.experienceToNext}`);
        
        // Update experience bar
        this.expBarFill.clear();
        this.expBarFill.fillStyle(0x4caf50);
        const fillWidth = 400 * summary.experienceProgress;
        this.expBarFill.fillRoundedRect(20, 75, fillWidth, 20, 10);
        
        // Update skill points
        this.skillPointsText.setText(`Skill Points: ${summary.skillPoints.available} (Total: ${summary.skillPoints.total})`);
        
        // Update statistics
        const stats = [
            `Total Experience Earned: ${summary.progression.totalExperienceEarned}`,
            `Levels Gained: ${summary.progression.levelsGained}`,
            `Perfect Casts: ${summary.progression.perfectCasts}`,
            `Perfect Lures: ${summary.progression.perfectLures}`,
            `Perfect Reels: ${summary.progression.perfectReels}`,
            `Species Discovered: ${summary.progression.speciesDiscovered}`,
            `Locations Unlocked: ${summary.progression.locationsUnlocked}`,
            `Total Skill Levels: ${summary.totalSkillLevels}`
        ];
        this.statsText.setText(stats.join('\n'));
        
        // Update next level reward
        const nextReward = summary.nextLevelReward;
        if (nextReward) {
            const rewardText = [
                `Level ${nextReward.level} Rewards:`,
                `• ${nextReward.rewards.coins} coins`,
                `• ${nextReward.rewards.skillPoints} skill points`
            ];
            if (nextReward.rewards.item) {
                rewardText.push(`• ${nextReward.rewards.item.id}`);
            }
            if (nextReward.rewards.unlockLocation) {
                rewardText.push(`• Unlock ${nextReward.rewards.unlockLocation}`);
            }
            rewardText.push(`\nExperience needed: ${nextReward.experienceNeeded}`);
            this.nextRewardText.setText(rewardText.join('\n'));
        } else {
            this.nextRewardText.setText('Max level reached!');
        }
        
        // Update available upgrades
        this.upgradesContainer.removeAll(true);
        const upgrades = summary.availableSkillUpgrades.slice(0, 5); // Show top 5
        upgrades.forEach((upgrade, index) => {
            const text = this.scene.add.text(0, index * 25, 
                `${upgrade.treeName}: ${upgrade.skillName} (${upgrade.currentLevel}/${upgrade.maxLevel})`, {
                fontSize: '12px',
                fill: '#4caf50'
            });
            this.upgradesContainer.add(text);
        });

        if (upgrades.length === 0) {
            const noUpgradesText = this.scene.add.text(0, 0, 'No upgrades available', {
                fontSize: '12px',
                fill: '#888888'
            });
            this.upgradesContainer.add(noUpgradesText);
        }
    }

    updateSkillTreeContent(treeId) {
        const treeData = this.playerProgression.getSkillTreeData()[treeId];
        const container = this.skillTreeContents[treeId];
        
        // Update each skill card
        container.list.forEach(child => {
            if (child.skillData) {
                const { skillId, levelText, effectText, upgradeButton, upgradeText, upgradeHitArea } = child.skillData;
                const skillData = treeData.skills[skillId];
                
                // Update level display
                levelText.setText(`${skillData.currentLevel}/${skillData.maxLevel}`);
                
                // Update effect text with current bonus
                const effectWithBonus = `${skillData.effect}\nCurrent bonus: +${skillData.totalBonus}`;
                effectText.setText(effectWithBonus);
                
                // Update upgrade button state
                if (skillData.canUpgrade) {
                    upgradeButton.clear();
                    upgradeButton.fillStyle(0x4caf50, 0.8);
                    upgradeButton.fillRoundedRect(10, 85, 100, 25, 5);
                    upgradeText.setText('UPGRADE');
                    upgradeText.setFill('#ffffff');
                    upgradeHitArea.setInteractive();
                } else {
                    upgradeButton.clear();
                    upgradeButton.fillStyle(0x666666, 0.8);
                    upgradeButton.fillRoundedRect(10, 85, 100, 25, 5);
                    
                    if (skillData.isMaxed) {
                        upgradeText.setText('MAXED');
                    } else if (!skillData.isUnlocked) {
                        upgradeText.setText('LOCKED');
                    } else {
                        upgradeText.setText('NO POINTS');
                    }
                    upgradeText.setFill('#999999');
                    upgradeHitArea.disableInteractive();
                }
            }
        });
    }

    upgradeSkill(treeId, skillId) {
        const result = this.playerProgression.upgradeSkill(treeId, skillId);
        
        if (result.success) {
            // Update the current tab display
            if (this.currentTab === treeId) {
                this.updateSkillTreeContent(treeId);
            }
            
            // Update overview if visible
            if (this.currentTab === 'overview') {
                this.updateOverviewContent();
            }
            
            // Show upgrade notification
            this.showUpgradeNotification(treeId, skillId, result.newLevel);
        } else {
            console.log(`Cannot upgrade skill: ${result.reason}`);
        }
    }

    showUpgradeNotification(treeId, skillId, newLevel) {
        const skill = this.playerProgression.skillTrees[treeId].skills[skillId];
        const notification = this.scene.add.text(this.width / 2, this.height / 2, 
            `${skill.name} upgraded to level ${newLevel}!`, {
            fontSize: '18px',
            fontWeight: 'bold',
            fill: '#4caf50',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        this.container.add(notification);
        
        // Fade out after 2 seconds
        this.scene.tweens.add({
            targets: notification,
            alpha: 0,
            duration: 2000,
            onComplete: () => notification.destroy()
        });
    }

    setupEventListeners() {
        // Listen for progression events
        this.playerProgression.on('levelUp', (data) => {
            this.showLevelUpNotification(data);
            this.updateDisplay();
        });
        
        this.playerProgression.on('experienceGained', () => {
            if (this.isVisible) {
                this.updateDisplay();
            }
        });
        
        this.playerProgression.on('skillUpgraded', () => {
            if (this.isVisible) {
                this.updateDisplay();
            }
        });
        
        this.playerProgression.on('achievementUnlocked', (data) => {
            this.showAchievementNotification(data);
            if (this.isVisible) {
                this.updateDisplay();
            }
        });
    }

    showLevelUpNotification(data) {
        // Create dramatic level up notification
        const notification = this.scene.add.container(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2
        );
        notification.setDepth(3000);

        // Background with glow effect
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        bg.fillRect(-400, -150, 800, 300);
        
        // Multiple glow layers for dramatic effect
        for (let i = 0; i < 3; i++) {
            const glow = this.scene.add.graphics();
            glow.fillStyle(0xFFD700, 0.3 - (i * 0.1));
            glow.fillRoundedRect(-350 + (i * 20), -125 + (i * 15), 700 - (i * 40), 250 - (i * 30), 20);
            notification.add(glow);
        }
        
        notification.add(bg);

        // Animated "LEVEL UP!" text with multiple effects
        const levelUpText = this.scene.add.text(0, -50, 'LEVEL UP!', {
            fontSize: '48px',
            fontWeight: 'bold',
            fill: '#FFD700',
            stroke: '#FF6600',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5);
        notification.add(levelUpText);

        // Level number with glow
        const levelText = this.scene.add.text(0, 10, `LEVEL ${data.newLevel}`, {
            fontSize: '32px',
            fontWeight: 'bold',
            fill: '#FFFFFF',
            stroke: '#4a90e2',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);
        notification.add(levelText);

        // Rewards text
        const rewardsText = this.scene.add.text(0, 60, 
            `+${data.skillPointsAwarded} Skill Points Earned!`, {
            fontSize: '18px',
            fill: '#4caf50',
            fontWeight: 'bold',
            align: 'center'
        }).setOrigin(0.5);
        notification.add(rewardsText);

        // Level rewards if available
        if (data.rewards) {
            const rewardDetails = [];
            if (data.rewards.coins) rewardDetails.push(`+${data.rewards.coins} Coins`);
            if (data.rewards.item) rewardDetails.push(`New Item: ${data.rewards.item.id}`);
            if (data.rewards.unlockLocation) rewardDetails.push(`Location Unlocked: ${data.rewards.unlockLocation}`);
            
            if (rewardDetails.length > 0) {
                const extraRewardsText = this.scene.add.text(0, 90, rewardDetails.join(' • '), {
                    fontSize: '14px',
                    fill: '#ffeb3b',
                    align: 'center',
                    wordWrap: { width: 700 }
                }).setOrigin(0.5);
                notification.add(extraRewardsText);
            }
        }

        // Create particle effects
        this.createLevelUpParticles(notification);

        // Play level up audio
        if (this.scene.audioManager) {
            this.scene.audioManager.playSFX('level_up', { volume: 0.8 });
        }

        // Dramatic animation sequence
        notification.setScale(0.1);
        notification.setAlpha(0);

        // Scale and fade in with bounce
        this.scene.tweens.add({
            targets: notification,
            scale: 1.2,
            alpha: 1,
            duration: 500,
            ease: 'Back.easeOut'
        });

        // Text animations
        this.scene.tweens.add({
            targets: levelUpText,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 300,
            yoyo: true,
            repeat: 2,
            ease: 'Power2.easeInOut'
        });

        // Screen shake effect
        this.scene.cameras.main.shake(300, 0.01);

        // Color pulse animation
        let colorIndex = 0;
        const colors = ['#FFD700', '#FF6600', '#FF0066', '#6600FF', '#0066FF', '#00FFFF'];
        const colorTimer = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                levelUpText.setFill(colors[colorIndex % colors.length]);
                colorIndex++;
            },
            repeat: 15
        });

        // Auto-hide after 4 seconds with fade out
        this.scene.time.delayedCall(4000, () => {
            this.scene.tweens.add({
                targets: notification,
                scale: 0.8,
                alpha: 0,
                duration: 500,
                ease: 'Power2.easeIn',
                onComplete: () => {
                    notification.destroy();
                    if (colorTimer) colorTimer.destroy();
                }
            });
        });
    }

    createLevelUpParticles(container) {
        // Create multiple particle bursts
        for (let burst = 0; burst < 3; burst++) {
            this.scene.time.delayedCall(burst * 200, () => {
                for (let i = 0; i < 20; i++) {
                    const particle = this.scene.add.graphics();
                    const colors = [0xFFD700, 0xFF6600, 0x4a90e2, 0x4caf50, 0xffeb3b];
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    
                    particle.fillStyle(color);
                    particle.fillCircle(0, 0, Math.random() * 4 + 2);
                    
                    const angle = (Math.PI * 2 * i) / 20 + (Math.random() - 0.5) * 0.5;
                    const distance = 100 + Math.random() * 150;
                    const duration = 1000 + Math.random() * 500;
                    
                    container.add(particle);
                    
                    // Particle animation
                    this.scene.tweens.add({
                        targets: particle,
                        x: Math.cos(angle) * distance,
                        y: Math.sin(angle) * distance,
                        alpha: 0,
                        scaleX: 0.1,
                        scaleY: 0.1,
                        duration: duration,
                        ease: 'Power2.easeOut'
                    });
                }
            });
        }
    }

    updateDisplay() {
        if (!this.isVisible) return;
        
        if (this.currentTab === 'overview') {
            this.updateOverviewContent();
        } else if (this.currentTab === 'achievements') {
            this.updateAchievementsContent();
        } else if (this.skillTreeContents[this.currentTab]) {
            this.updateSkillTreeContent(this.currentTab);
        }
    }

    show() {
        this.isVisible = true;
        this.container.setVisible(true);
        this.updateDisplay();
        
        // Animate in
        this.container.setScale(0.8);
        this.container.setAlpha(0);
        this.scene.tweens.add({
            targets: this.container,
            scale: 1,
            alpha: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }

    hide() {
        this.scene.tweens.add({
            targets: this.container,
            scale: 0.8,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.isVisible = false;
                this.container.setVisible(false);
            }
        });
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    destroy() {
        // Clean up event listeners
        this.playerProgression.off('levelUp', this.showLevelUpNotification);
        this.playerProgression.off('experienceGained', this.updateDisplay);
        this.playerProgression.off('skillUpgraded', this.updateDisplay);
        
        this.container.destroy();
        console.log('PlayerProgressionUI: Destroyed');
    }

    updateAchievementsContent() {
        // Clear existing achievement cards
        this.achievementsListContainer.removeAll(true);
        this.achievementCards = [];
        
        // Get achievement data from progression system
        const achievementData = this.playerProgression.getAchievementData();
        
        // Filter achievements based on current filter
        let filteredAchievements = Object.values(achievementData);
        if (this.currentAchievementFilter !== 'all') {
            filteredAchievements = filteredAchievements.filter(achievement => 
                achievement.category === this.currentAchievementFilter
            );
        }
        
        // Sort achievements: completed first, then by progress percentage
        filteredAchievements.sort((a, b) => {
            if (a.completed && !b.completed) return -1;
            if (!a.completed && b.completed) return 1;
            return b.progressPercent - a.progressPercent;
        });
        
        // Create achievement cards
        const cardHeight = 85;
        const cardSpacing = 10;
        const cardsPerColumn = 6;
        
        filteredAchievements.forEach((achievement, index) => {
            const column = Math.floor(index / cardsPerColumn);
            const row = index % cardsPerColumn;
            
            const x = column * 430;
            const y = row * (cardHeight + cardSpacing);
            
            const card = this.createAchievementCard(achievement, x, y, 420, cardHeight);
            this.achievementsListContainer.add(card);
            this.achievementCards.push(card);
        });
    }

    showAchievementNotification(data) {
        const achievement = data.achievement;
        
        // Create achievement notification
        const notification = this.scene.add.container(
            this.scene.cameras.main.width - 200,
            100
        );
        notification.setDepth(2500);

        // Background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x2d5016, 0.95);
        bg.fillRoundedRect(0, 0, 350, 100, 12);
        bg.lineStyle(3, 0x4caf50, 0.9);
        bg.strokeRoundedRect(0, 0, 350, 100, 12);
        notification.add(bg);

        // Achievement icon
        const icon = this.scene.add.text(25, 50, achievement.icon, {
            fontSize: '32px'
        }).setOrigin(0.5);
        notification.add(icon);

        // "Achievement Unlocked!" text
        const titleText = this.scene.add.text(60, 20, '🏆 ACHIEVEMENT UNLOCKED!', {
            fontSize: '14px',
            fontWeight: 'bold',
            fill: '#4caf50'
        });
        notification.add(titleText);

        // Achievement name
        const nameText = this.scene.add.text(60, 40, achievement.name, {
            fontSize: '16px',
            fontWeight: 'bold',
            fill: '#ffffff'
        });
        notification.add(nameText);

        // Rewards info
        const rewardParts = [];
        if (achievement.rewards.experience) rewardParts.push(`${achievement.rewards.experience} XP`);
        if (achievement.rewards.coins) rewardParts.push(`${achievement.rewards.coins} coins`);
        if (achievement.rewards.skillPoints) rewardParts.push(`${achievement.rewards.skillPoints} SP`);
        
        if (rewardParts.length > 0) {
            const rewardsText = this.scene.add.text(60, 65, `Rewards: ${rewardParts.join(', ')}`, {
                fontSize: '12px',
                fill: '#ffeb3b'
            });
            notification.add(rewardsText);
        }

        // Play achievement sound
        if (this.scene.audioManager) {
            this.scene.audioManager.playSFX('achievement', { volume: 0.6 });
        }

        // Slide in animation
        notification.setX(this.scene.cameras.main.width);
        this.scene.tweens.add({
            targets: notification,
            x: this.scene.cameras.main.width - 200,
            duration: 500,
            ease: 'Back.easeOut'
        });

        // Glow pulse effect
        this.scene.tweens.add({
            targets: bg,
            alpha: 0.7,
            duration: 800,
            yoyo: true,
            repeat: 3,
            ease: 'Sine.easeInOut'
        });

        // Auto-hide after 5 seconds
        this.scene.time.delayedCall(5000, () => {
            this.scene.tweens.add({
                targets: notification,
                x: this.scene.cameras.main.width,
                alpha: 0,
                duration: 300,
                ease: 'Power2.easeIn',
                onComplete: () => notification.destroy()
            });
        });
    }

    updateCategoryButtonAppearance(category) {
        // Update category button appearance without causing recursion
        Object.entries(this.categoryButtons).forEach(([cat, buttonData]) => {
            const { button, text, x, y } = buttonData;
            
            button.clear();
            if (cat === category) {
                button.fillStyle(0x4a90e2, 0.8);
                button.fillRoundedRect(x, y, 80, 25, 12);
                button.lineStyle(1, 0x4a90e2);
                button.strokeRoundedRect(x, y, 80, 25, 12);
                text.setFill('#ffffff');
            } else {
                button.fillStyle(0x333333, 0.8);
                button.fillRoundedRect(x, y, 80, 25, 12);
                button.lineStyle(1, 0x555555);
                button.strokeRoundedRect(x, y, 80, 25, 12);
                text.setFill('#cccccc');
            }
        });
    }
} 