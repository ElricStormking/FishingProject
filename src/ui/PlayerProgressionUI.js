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
        this.createSkillTreeTabs();

        // Show initial tab
        this.showTab('overview');
    }

    createTabButtons() {
        const tabs = [
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'casting', name: 'Casting', icon: '🎯' },
            { id: 'fishing', name: 'Fishing', icon: '🎣' },
            { id: 'reeling', name: 'Reeling', icon: '⚡' },
            { id: 'luring', name: 'Luring', icon: '🌟' },
            { id: 'exploration', name: 'Explorer', icon: '🗺️' }
        ];

        this.tabButtons = {};
        const tabWidth = 120;
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
                fontSize: '12px',
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
        Object.values(this.skillTreeContents).forEach(content => content.setVisible(false));
        
        // Show selected content
        if (tabId === 'overview') {
            this.overviewContent.setVisible(true);
            this.updateOverviewContent();
        } else if (this.skillTreeContents[tabId]) {
            this.skillTreeContents[tabId].setVisible(true);
            this.updateSkillTreeContent(tabId);
        }
        
        // Update tab button appearance
        Object.entries(this.tabButtons).forEach(([id, button]) => {
            if (id === tabId) {
                button.button.clear();
                button.button.fillStyle(0x4a90e2, 0.8);
                button.button.fillRoundedRect(button.button.x, button.button.y, 115, 35, 5);
                button.text.setFill('#ffffff');
            } else {
                button.button.clear();
                button.button.fillStyle(0x333333, 0.8);
                button.button.fillRoundedRect(button.button.x, button.button.y, 115, 35, 5);
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
    }

    showLevelUpNotification(data) {
        const notification = this.scene.add.text(this.scene.cameras.main.width / 2, 100, 
            `LEVEL UP! You are now level ${data.newLevel}!\n+${data.skillPointsAwarded} Skill Points`, {
            fontSize: '24px',
            fontWeight: 'bold',
            fill: '#ffeb3b',
            backgroundColor: '#000000',
            padding: { x: 30, y: 15 },
            align: 'center'
        }).setOrigin(0.5);
        
        notification.setDepth(3000);
        
        // Animate in and out
        notification.setScale(0);
        this.scene.tweens.add({
            targets: notification,
            scale: 1,
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.scene.time.delayedCall(3000, () => {
                    this.scene.tweens.add({
                        targets: notification,
                        alpha: 0,
                        scale: 0.5,
                        duration: 500,
                        onComplete: () => notification.destroy()
                    });
                });
            }
        });
    }

    updateDisplay() {
        if (!this.isVisible) return;
        
        if (this.currentTab === 'overview') {
            this.updateOverviewContent();
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
} 