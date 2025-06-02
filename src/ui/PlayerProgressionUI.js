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
        const categories = ['all', 'catch', 'rarity', 'collection', 'skill', 'level', 'wealth', 'exploration', 'tournament', 'equipment', 'mastery', 'chains'];
        const categoryNames = {
            all: 'All',
            catch: 'Fishing',
            rarity: 'Rare Fish',
            collection: 'Collection',
            skill: 'Skills',
            level: 'Levels',
            wealth: 'Wealth',
            exploration: 'Exploration',
            tournament: 'Tournament',
            equipment: 'Equipment',
            mastery: 'Mastery',
            chains: 'Chains'
        };

        // Create two rows of category buttons
        const buttonsPerRow = 6;
        categories.forEach((category, index) => {
            const row = Math.floor(index / buttonsPerRow);
            const col = index % buttonsPerRow;
            const x = 20 + (col * 85);
            const y = 55 + (row * 35);
            
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

        // Achievement tier filter
        this.tierButtons = {};
        const tiers = ['all', 'bronze', 'silver', 'gold', 'legendary'];
        const tierColors = {
            all: 0x555555,
            bronze: 0xcd7f32,
            silver: 0xc0c0c0,
            gold: 0xffd700,
            legendary: 0xff6b35
        };

        tiers.forEach((tier, index) => {
            const x = 20 + (index * 90);
            const y = 125; // Below category buttons
            
            const button = this.scene.add.graphics();
            button.fillStyle(tierColors[tier], 0.3);
            button.fillRoundedRect(x, y, 85, 25, 12);
            button.lineStyle(2, tierColors[tier]);
            button.strokeRoundedRect(x, y, 85, 25, 12);
            this.achievementsContent.add(button);

            const text = this.scene.add.text(x + 42, y + 12, tier.charAt(0).toUpperCase() + tier.slice(1), {
                fontSize: '11px',
                fill: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);
            this.achievementsContent.add(text);

            const hitArea = this.scene.add.rectangle(x + 42, y + 12, 85, 25, 0x000000, 0);
            hitArea.setInteractive({ useHandCursor: true });
            hitArea.on('pointerdown', () => this.filterByTier(tier));
            this.achievementsContent.add(hitArea);

            this.tierButtons[tier] = { button, text, hitArea, x, y };
        });

        // Achievements list container - moved down to accommodate tier filters
        this.achievementsListContainer = this.scene.add.container(20, 165);
        this.achievementsContent.add(this.achievementsListContainer);

        // Initialize filters
        this.currentAchievementFilter = 'all';
        this.currentTierFilter = 'all';
        this.achievementCards = [];
    }

    filterAchievements(category) {
        // Update button appearance
        Object.entries(this.categoryButtons).forEach(([cat, button]) => {
            const color = cat === category ? 0x4a90e2 : 0x333333;
            button.button.clear();
            button.button.fillStyle(color, 0.8);
            button.button.fillRoundedRect(button.x, button.y, 80, 25, 12);
            button.button.lineStyle(1, 0x555555);
            button.button.strokeRoundedRect(button.x, button.y, 80, 25, 12);
        });
        
        this.currentAchievementFilter = category;
        this.updateAchievementsContent();
    }

    filterByTier(tier) {
        // Update button appearance
        Object.entries(this.tierButtons).forEach(([t, button]) => {
            const baseColor = tier === 'all' ? 0x555555 : 
                             tier === 'bronze' ? 0xcd7f32 :
                             tier === 'silver' ? 0xc0c0c0 :
                             tier === 'gold' ? 0xffd700 : 0xff6b35;
            
            const isSelected = t === tier;
            const color = isSelected ? baseColor : 0x333333;
            const alpha = isSelected ? 0.8 : 0.3;
            
            button.button.clear();
            button.button.fillStyle(color, alpha);
            button.button.fillRoundedRect(button.x, button.y, 85, 25, 12);
            button.button.lineStyle(2, baseColor);
            button.button.strokeRoundedRect(button.x, button.y, 85, 25, 12);
        });
        
        this.currentTierFilter = tier;
        this.updateAchievementsContent();
    }

    createAchievementCard(achievement, x, y, width = 400, height = 80) {
        const card = this.scene.add.container(x, y);
        
        // Card background with tier-based coloring
        const bg = this.scene.add.graphics();
        let bgColor, borderColor;
        
        if (achievement.completed) {
            switch (achievement.tier) {
                case 'bronze':
                    bgColor = 0x4a3728;
                    borderColor = 0xcd7f32;
                    break;
                case 'silver':
                    bgColor = 0x3c3c3c;
                    borderColor = 0xc0c0c0;
                    break;
                case 'gold':
                    bgColor = 0x4a4228;
                    borderColor = 0xffd700;
                    break;
                case 'legendary':
                    bgColor = 0x4a2515;
                    borderColor = 0xff6b35;
                    break;
                default:
                    bgColor = 0x2d5016;
                    borderColor = 0x4caf50;
            }
        } else {
            bgColor = 0x2c2c2c;
            borderColor = achievement.canUnlock === false ? 0x555555 : 0x777777;
        }
        
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
        
        // Tier indicator
        if (achievement.tier) {
            const tierColors = {
                bronze: '#cd7f32',
                silver: '#c0c0c0',
                gold: '#ffd700',
                legendary: '#ff6b35'
            };
            
            const tierText = this.scene.add.text(width - 15, 10, achievement.tier.toUpperCase(), {
                fontSize: '8px',
                fill: tierColors[achievement.tier] || '#ffffff',
                align: 'right'
            }).setOrigin(1, 0);
            card.add(tierText);
        }
        
        // Achievement name and description
        const nameColor = achievement.completed ? 
            (achievement.tier === 'legendary' ? '#ff6b35' : 
             achievement.tier === 'gold' ? '#ffd700' : 
             achievement.tier === 'silver' ? '#c0c0c0' : 
             achievement.tier === 'bronze' ? '#cd7f32' : '#4caf50') : '#ffffff';
            
        const name = this.scene.add.text(45, 12, achievement.name, {
            fontSize: '14px',
            fontWeight: 'bold',
            fill: nameColor
        });
        card.add(name);
        
        const description = this.scene.add.text(45, 32, achievement.description, {
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
        const progressColor = achievement.completed ? borderColor : 0x4a90e2;
        
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
                fill: nameColor,
                align: 'center'
            }).setOrigin(0.5);
            card.add(completedText);
        } else if (achievement.rewards) {
            const rewardParts = [];
            if (achievement.rewards.experience) rewardParts.push(`${achievement.rewards.experience} XP`);
            if (achievement.rewards.coins) rewardParts.push(`${achievement.rewards.coins} coins`);
            if (achievement.rewards.skillPoints) rewardParts.push(`${achievement.rewards.skillPoints} SP`);
            if (achievement.rewards.title) rewardParts.push(`"${achievement.rewards.title}"`);
            
            const rewardText = this.scene.add.text(width - 90, 45, `Rewards: ${rewardParts.join(', ')}`, {
                fontSize: '9px',
                fill: '#ffeb3b',
                align: 'center',
                wordWrap: { width: 140 }
            }).setOrigin(0.5);
            card.add(rewardText);
        }
        
        // Dependency indicator
        if (achievement.dependsOn && achievement.canUnlock === false) {
            const lockIcon = this.scene.add.text(width - 30, height / 2, '🔒', {
                fontSize: '16px'
            }).setOrigin(0.5);
            card.add(lockIcon);
        }
        
        return card;
    }

    createAchievementChainCard(chain, x, y) {
        const cardWidth = 850;
        const cardHeight = 120;
        
        const card = this.scene.add.container(x, y);
        
        // Background with chain-specific styling
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x2a1810, 0.9);
        bg.fillRoundedRect(0, 0, cardWidth, cardHeight, 12);
        bg.lineStyle(2, 0xffd700, 0.8);
        bg.strokeRoundedRect(0, 0, cardWidth, cardHeight, 12);
        card.add(bg);
        
        // Chain icon and title
        const chainIcon = this.scene.add.text(20, 20, '🔗', {
            fontSize: '24px'
        });
        card.add(chainIcon);
        
        const chainTitle = this.scene.add.text(60, 15, chain.name, {
            fontSize: '18px',
            fontWeight: 'bold',
            fill: '#ffd700'
        });
        card.add(chainTitle);
        
        const chainDesc = this.scene.add.text(60, 40, chain.description, {
            fontSize: '12px',
            fill: '#cccccc',
            wordWrap: { width: 400 }
        });
        card.add(chainDesc);
        
        // Progress bar for chain completion
        const progressBg = this.scene.add.graphics();
        progressBg.fillStyle(0x333333, 0.8);
        progressBg.fillRoundedRect(60, 70, 400, 20, 10);
        card.add(progressBg);
        
        const completedCount = chain.achievements.filter(id => {
            const achievement = this.playerProgression.getAchievementData()[id];
            return achievement && achievement.completed;
        }).length;
        
        const progressPercent = (completedCount / chain.achievements.length) * 100;
        const progressWidth = (progressPercent / 100) * 400;
        
        if (progressWidth > 0) {
            const progressFill = this.scene.add.graphics();
            progressFill.fillStyle(0xffd700, 0.8);
            progressFill.fillRoundedRect(60, 70, progressWidth, 20, 10);
            card.add(progressFill);
        }
        
        const progressText = this.scene.add.text(260, 80, `${completedCount}/${chain.achievements.length} Complete`, {
            fontSize: '12px',
            fill: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        card.add(progressText);
        
        // Individual achievement indicators
        const achievementStartX = 500;
        const achievementSpacing = 60;
        
        chain.achievements.forEach((achievementId, index) => {
            const achievement = this.playerProgression.getAchievementData()[achievementId];
            if (!achievement) return;
            
            const achievementX = achievementStartX + (index * achievementSpacing);
            const achievementY = 30;
            
            // Achievement mini-card
            const miniCard = this.scene.add.graphics();
            const isCompleted = achievement.completed;
            const bgColor = isCompleted ? 0x2d5016 : 0x333333;
            const borderColor = isCompleted ? 0x4caf50 : 0x666666;
            
            miniCard.fillStyle(bgColor, 0.8);
            miniCard.fillRoundedRect(achievementX, achievementY, 50, 60, 8);
            miniCard.lineStyle(1, borderColor);
            miniCard.strokeRoundedRect(achievementX, achievementY, 50, 60, 8);
            card.add(miniCard);
            
            // Achievement icon
            const icon = this.scene.add.text(achievementX + 25, achievementY + 20, achievement.icon, {
                fontSize: '16px'
            }).setOrigin(0.5);
            card.add(icon);
            
            // Achievement name (truncated)
            const name = this.scene.add.text(achievementX + 25, achievementY + 45, 
                achievement.name.length > 8 ? achievement.name.substring(0, 8) + '...' : achievement.name, {
                fontSize: '8px',
                fill: isCompleted ? '#ffffff' : '#999999',
                align: 'center'
            }).setOrigin(0.5);
            card.add(name);
            
            // Completion checkmark
            if (isCompleted) {
                const checkmark = this.scene.add.text(achievementX + 40, achievementY + 5, '✓', {
                    fontSize: '12px',
                    fill: '#4caf50',
                    fontWeight: 'bold'
                });
                card.add(checkmark);
            }
        });
        
        // Chain rewards display
        if (chain.rewards) {
            const rewardText = this.scene.add.text(cardWidth - 20, 20, 'Chain Rewards:', {
                fontSize: '12px',
                fill: '#ffd700',
                fontWeight: 'bold'
            }).setOrigin(1, 0);
            card.add(rewardText);
            
            const rewardParts = [];
            if (chain.rewards.coins) rewardParts.push(`${chain.rewards.coins} coins`);
            if (chain.rewards.experience) rewardParts.push(`${chain.rewards.experience} XP`);
            if (chain.rewards.skillPoints) rewardParts.push(`${chain.rewards.skillPoints} SP`);
            if (chain.rewards.title) rewardParts.push(`"${chain.rewards.title}"`);
            
            const rewardDetails = this.scene.add.text(cardWidth - 20, 40, rewardParts.join('\n'), {
                fontSize: '10px',
                fill: '#ffeb3b',
                align: 'right'
            }).setOrigin(1, 0);
            card.add(rewardDetails);
        }
        
        // Completion status
        const isChainComplete = completedCount === chain.achievements.length;
        if (isChainComplete) {
            const completeBadge = this.scene.add.text(cardWidth - 20, cardHeight - 20, '🏆 COMPLETE', {
                fontSize: '14px',
                fill: '#ffd700',
                fontWeight: 'bold'
            }).setOrigin(1, 1);
            card.add(completeBadge);
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

        // Make upgrade button interactive (original area inside container)
        const upgradeHitArea = this.scene.add.rectangle(60, height - 22, 100, 25, 0x000000, 0);
        upgradeHitArea.setInteractive({ useHandCursor: true });
        upgradeHitArea.on('pointerdown', () => {
            console.log('PlayerProgressionUI: Original upgrade button clicked for', treeId, skillId);
            this.upgradeSkill(treeId, skillId);
        });
        container.add(upgradeHitArea);

        // Create working interactive area outside container (similar to USE button fix)
        // Calculate absolute position when container is added to the scene
        const workingUpgradeButton = this.scene.add.rectangle(
            0, 0, // Will be positioned dynamically when shown
            105, 30
        ).setInteractive()
        .setAlpha(0.01) // Barely visible but functional
        .setFillStyle(0x4caf50) // Green fill for functionality
        .setDepth(5000); // Higher depth than the progression UI (2000)
        
        // Store click handler
        const upgradeClickHandler = () => {
            console.log('PlayerProgressionUI: Working upgrade button clicked for', treeId, skillId);
            this.upgradeSkill(treeId, skillId);
        };
        
        // Apply hover and click effects for both areas
        const onHover = () => {
            upgradeButton.clear();
            upgradeButton.fillStyle(0x66bb6a, 1); // Brighter green on hover
            upgradeButton.fillRoundedRect(10, height - 35, 100, 25, 5);
            upgradeText.setScale(1.05);
            workingUpgradeButton.setAlpha(0.05); // Slightly more visible on hover
        };
        
        const onOut = () => {
            upgradeButton.clear();
            upgradeButton.fillStyle(0x4caf50, 0.8);
            upgradeButton.fillRoundedRect(10, height - 35, 100, 25, 5);
            upgradeText.setScale(1.0);
            workingUpgradeButton.setAlpha(0.01); // Back to barely visible
        };
        
        // Apply events to both areas
        upgradeHitArea.on('pointerover', onHover);
        upgradeHitArea.on('pointerout', onOut);
        
        workingUpgradeButton.on('pointerdown', upgradeClickHandler);
        workingUpgradeButton.on('pointerover', onHover);
        workingUpgradeButton.on('pointerout', onOut);

        // Initially hide working button
        workingUpgradeButton.setVisible(false);

        // Store references for updates
        container.skillData = {
            treeId, skillId, skill,
            levelText, effectText, upgradeButton, upgradeText, upgradeHitArea,
            workingUpgradeButton, upgradeClickHandler // Store working button reference
        };

        return container;
    }

    showTab(tabId) {
        this.currentTab = tabId;
        
        // Hide all working upgrade buttons first
        this.hideAllWorkingUpgradeButtons();
        
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
            
            // Show and position working upgrade buttons for this skill tree
            this.showWorkingUpgradeButtons(tabId);
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

    hideAllWorkingUpgradeButtons() {
        // Hide all working upgrade buttons from all skill trees
        Object.values(this.skillTreeContents).forEach(content => {
            content.list.forEach(child => {
                if (child.skillData && child.skillData.workingUpgradeButton) {
                    child.skillData.workingUpgradeButton.setVisible(false);
                }
            });
        });
    }

    showWorkingUpgradeButtons(treeId) {
        const container = this.skillTreeContents[treeId];
        if (!container) return;
        
        // Position and show working upgrade buttons for the current skill tree
        container.list.forEach(child => {
            if (child.skillData && child.skillData.workingUpgradeButton) {
                const { workingUpgradeButton } = child.skillData;
                
                // Calculate absolute position
                // child is the skill card container
                // Need to account for: main container position + content container position + skill container position + button offset
                const absoluteX = this.x + 20 + child.x + 60; // main x + content offset + skill card x + button center x
                const absoluteY = this.y + 80 + child.y + 108; // main y + content offset + skill card y + button center y
                
                console.log(`PlayerProgressionUI: Positioning working upgrade button for ${child.skillData.treeId}-${child.skillData.skillId} at (${absoluteX}, ${absoluteY})`);
                
                workingUpgradeButton.setPosition(absoluteX, absoluteY);
                workingUpgradeButton.setVisible(true);
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
                const { skillId, levelText, effectText, upgradeButton, upgradeText, upgradeHitArea, workingUpgradeButton } = child.skillData;
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
                    
                    // Enable working upgrade button
                    if (workingUpgradeButton) {
                        workingUpgradeButton.setInteractive();
                        workingUpgradeButton.setFillStyle(0x4caf50);
                    }
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
                    
                    // Disable working upgrade button
                    if (workingUpgradeButton) {
                        workingUpgradeButton.disableInteractive();
                        workingUpgradeButton.setFillStyle(0x666666);
                    }
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
        try {
            const skill = this.playerProgression.skillTrees[treeId].skills[skillId];
            if (!skill) {
                console.warn('PlayerProgressionUI: Skill not found for upgrade notification');
                return;
            }
            
            const notification = this.scene.add.text(this.width / 2, this.height / 2, 
                `${skill.name} upgraded to level ${newLevel}!`, {
                fontSize: '18px',
                fontWeight: 'bold',
                fill: '#4caf50',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: { x: 20, y: 10 },
                align: 'center'
            }).setOrigin(0.5);
            
            notification.setDepth(2000);
            this.container.add(notification);
            
            // Fade out after 2 seconds
            if (this.scene.tweens) {
                this.scene.tweens.add({
                    targets: notification,
                    alpha: 0,
                    duration: 2000,
                    onComplete: () => {
                        try {
                            if (notification && !notification.destroyed) {
                                notification.destroy();
                            }
                        } catch (destroyError) {
                            console.warn('PlayerProgressionUI: Error destroying upgrade notification:', destroyError);
                        }
                    }
                });
            } else {
                // Fallback: destroy after delay
                this.scene.time.delayedCall(2000, () => {
                    try {
                        if (notification && !notification.destroyed) {
                            notification.destroy();
                        }
                    } catch (destroyError) {
                        console.warn('PlayerProgressionUI: Error destroying upgrade notification (fallback):', destroyError);
                    }
                });
            }
        } catch (error) {
            console.error('PlayerProgressionUI: Error in showUpgradeNotification:', error);
        }
    }

    setupEventListeners() {
        try {
            // Listen for progression events with error handling
            this.playerProgression.on('levelUp', (data) => {
                try {
                    this.showLevelUpNotification(data);
                    this.updateDisplay();
                } catch (error) {
                    console.error('PlayerProgressionUI: Error in levelUp event handler:', error);
                }
            });
            
            this.playerProgression.on('experienceGained', () => {
                try {
                    if (this.isVisible) {
                        this.updateDisplay();
                    }
                } catch (error) {
                    console.error('PlayerProgressionUI: Error in experienceGained event handler:', error);
                }
            });
            
            this.playerProgression.on('skillUpgraded', () => {
                try {
                    if (this.isVisible) {
                        this.updateDisplay();
                    }
                } catch (error) {
                    console.error('PlayerProgressionUI: Error in skillUpgraded event handler:', error);
                }
            });
            
            this.playerProgression.on('achievementUnlocked', (data) => {
                try {
                    this.showAchievementNotification(data);
                    if (this.isVisible) {
                        this.updateDisplay();
                    }
                } catch (error) {
                    console.error('PlayerProgressionUI: Error in achievementUnlocked event handler:', error);
                }
            });
        } catch (error) {
            console.error('PlayerProgressionUI: Error setting up event listeners:', error);
        }
    }

    showLevelUpNotification(data) {
        try {
            // Ensure we have a valid scene and camera
            if (!this.scene || !this.scene.add || !this.scene.cameras || !this.scene.cameras.main) {
                console.warn('PlayerProgressionUI: Scene not properly initialized for level up notification');
                return;
            }
            
            // Get safe screen dimensions
            const screenWidth = this.scene.cameras.main.width || 800;
            const screenHeight = this.scene.cameras.main.height || 600;
            
            // Create dramatic level up notification
            const notification = this.scene.add.container(
                screenWidth / 2,
                screenHeight / 2
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
            const levelText = this.scene.add.text(0, 10, `LEVEL ${data.newLevel || 'UP'}`, {
                fontSize: '32px',
                fontWeight: 'bold',
                fill: '#FFFFFF',
                stroke: '#4a90e2',
                strokeThickness: 3,
                align: 'center'
            }).setOrigin(0.5);
            notification.add(levelText);

            // Rewards text
            const skillPointsAwarded = data.skillPointsAwarded || 1;
            const rewardsText = this.scene.add.text(0, 60, 
                `+${skillPointsAwarded} Skill Points Earned!`, {
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

            // Play level up audio with error handling
            try {
                if (this.scene.audioManager && this.scene.audioManager.playSFX) {
                    this.scene.audioManager.playSFX('level_up', { volume: 0.8 });
                }
            } catch (audioError) {
                console.warn('PlayerProgressionUI: Error playing level up audio:', audioError);
            }

            // Dramatic animation sequence
            notification.setScale(0.1);
            notification.setAlpha(0);

            // Scale and fade in with bounce
            if (this.scene.tweens) {
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
            }

            // Screen shake effect with error handling
            try {
                if (this.scene.cameras && this.scene.cameras.main && this.scene.cameras.main.shake) {
                    this.scene.cameras.main.shake(300, 0.01);
                }
            } catch (shakeError) {
                console.warn('PlayerProgressionUI: Error creating screen shake:', shakeError);
            }

            // Color pulse animation
            let colorIndex = 0;
            const colors = ['#FFD700', '#FF6600', '#FF0066', '#6600FF', '#0066FF', '#00FFFF'];
            let colorTimer = null;
            
            if (this.scene.time) {
                colorTimer = this.scene.time.addEvent({
                    delay: 100,
                    callback: () => {
                        if (levelUpText && !levelUpText.destroyed) {
                            levelUpText.setFill(colors[colorIndex % colors.length]);
                            colorIndex++;
                        }
                    },
                    repeat: 15
                });
            }

            // Auto-hide after 4 seconds with fade out
            if (this.scene.time) {
                this.scene.time.delayedCall(4000, () => {
                    if (this.scene.tweens) {
                        this.scene.tweens.add({
                            targets: notification,
                            scale: 0.8,
                            alpha: 0,
                            duration: 500,
                            ease: 'Power2.easeIn',
                            onComplete: () => {
                                try {
                                    if (notification && !notification.destroyed) {
                                        notification.destroy();
                                    }
                                    if (colorTimer && !colorTimer.destroyed) {
                                        colorTimer.destroy();
                                    }
                                } catch (destroyError) {
                                    console.warn('PlayerProgressionUI: Error destroying level up notification:', destroyError);
                                }
                            }
                        });
                    } else {
                        // Fallback: destroy immediately if no tweens available
                        try {
                            if (notification && !notification.destroyed) {
                                notification.destroy();
                            }
                            if (colorTimer && !colorTimer.destroyed) {
                                colorTimer.destroy();
                            }
                        } catch (destroyError) {
                            console.warn('PlayerProgressionUI: Error destroying level up notification (fallback):', destroyError);
                        }
                    }
                });
            }
        } catch (error) {
            console.error('PlayerProgressionUI: Error in showLevelUpNotification:', error);
        }
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
        try {
            if (!this.isVisible) return;
            
            // Ensure the scene and required components are available
            if (!this.scene || !this.scene.add) {
                console.warn('PlayerProgressionUI: Scene not available for display update');
                return;
            }
            
            if (this.currentTab === 'overview') {
                this.updateOverviewContent();
            } else if (this.currentTab === 'achievements') {
                this.updateAchievementsContent();
            } else if (this.skillTreeContents[this.currentTab]) {
                this.updateSkillTreeContent(this.currentTab);
            }
        } catch (error) {
            console.error('PlayerProgressionUI: Error in updateDisplay:', error);
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
        // Hide working upgrade buttons first
        this.hideAllWorkingUpgradeButtons();
        
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
        // Clean up working upgrade buttons first
        Object.values(this.skillTreeContents).forEach(content => {
            content.list.forEach(child => {
                if (child.skillData && child.skillData.workingUpgradeButton) {
                    child.skillData.workingUpgradeButton.destroy();
                }
            });
        });
        
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
        
        if (this.currentAchievementFilter === 'chains') {
            // Display achievement chains
            const chains = this.playerProgression.getAchievementChains();
            
            chains.forEach((chain, index) => {
                const y = index * 130; // Space for chain cards
                const card = this.createAchievementChainCard(chain, 0, y);
                this.achievementsListContainer.add(card);
                this.achievementCards.push(card);
            });
            
            return;
        }
        
        // Get all achievement data (regular + enhanced)
        const achievementData = this.playerProgression.getAchievementData();
        
        // Filter achievements based on current filters
        let filteredAchievements = Object.values(achievementData);
        
        // Category filter
        if (this.currentAchievementFilter !== 'all') {
            filteredAchievements = filteredAchievements.filter(achievement => 
                achievement.category === this.currentAchievementFilter
            );
        }
        
        // Tier filter
        if (this.currentTierFilter !== 'all') {
            filteredAchievements = filteredAchievements.filter(achievement => 
                achievement.tier === this.currentTierFilter
            );
        }
        
        // Sort achievements: completed first, then by tier, then by progress percentage
        filteredAchievements.sort((a, b) => {
            // Completed achievements first
            if (a.completed && !b.completed) return -1;
            if (!a.completed && b.completed) return 1;
            
            // Within same completion status, sort by tier
            const tierOrder = { legendary: 4, gold: 3, silver: 2, bronze: 1 };
            const aTier = tierOrder[a.tier] || 0;
            const bTier = tierOrder[b.tier] || 0;
            
            if (aTier !== bTier) return bTier - aTier; // Higher tier first
            
            // Within same tier, sort by progress
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
        try {
            const achievement = data.achievement;
            
            // Ensure we have a valid scene and camera
            if (!this.scene || !this.scene.add || !this.scene.cameras || !this.scene.cameras.main) {
                console.warn('PlayerProgressionUI: Scene not properly initialized for achievement notification');
                return;
            }
            
            // Get safe screen dimensions
            const screenWidth = this.scene.cameras.main.width || 800;
            const screenHeight = this.scene.cameras.main.height || 600;
            
            // Create achievement notification
            const notification = this.scene.add.container(
                screenWidth - 200,
                100
            );
            notification.setDepth(2500);

            // Background with tier-based colors
            const bg = this.scene.add.graphics();
            let bgColor = 0x2d5016;
            let borderColor = 0x4caf50;
            
            if (achievement.tier) {
                switch (achievement.tier) {
                    case 'bronze':
                        bgColor = 0x4a3728;
                        borderColor = 0xcd7f32;
                        break;
                    case 'silver':
                        bgColor = 0x3c3c3c;
                        borderColor = 0xc0c0c0;
                        break;
                    case 'gold':
                        bgColor = 0x4a4228;
                        borderColor = 0xffd700;
                        break;
                    case 'legendary':
                        bgColor = 0x4a2515;
                        borderColor = 0xff6b35;
                        break;
                }
            }
            
            bg.fillStyle(bgColor, 0.95);
            bg.fillRoundedRect(0, 0, 350, 100, 12);
            bg.lineStyle(3, borderColor, 0.9);
            bg.strokeRoundedRect(0, 0, 350, 100, 12);
            notification.add(bg);

            // Achievement icon
            const icon = this.scene.add.text(25, 50, achievement.icon || '🏆', {
                fontSize: '32px'
            }).setOrigin(0.5);
            notification.add(icon);

            // "Achievement Unlocked!" text with tier indication
            const tierText = achievement.tier ? achievement.tier.toUpperCase() + ' ' : '';
            const titleText = this.scene.add.text(60, 15, 
                `🏆 ${tierText}ACHIEVEMENT UNLOCKED!`, {
                fontSize: '12px',
                fontWeight: 'bold',
                fill: borderColor === 0x4caf50 ? '#4caf50' : `#${borderColor.toString(16).padStart(6, '0')}`
            });
            notification.add(titleText);

            // Achievement name
            const nameText = this.scene.add.text(60, 35, achievement.name || 'Achievement', {
                fontSize: '14px',
                fontWeight: 'bold',
                fill: '#ffffff'
            });
            notification.add(nameText);

            // Rewards info
            const rewardParts = [];
            if (achievement.rewards) {
                if (achievement.rewards.experience) rewardParts.push(`${achievement.rewards.experience} XP`);
                if (achievement.rewards.coins) rewardParts.push(`${achievement.rewards.coins} coins`);
                if (achievement.rewards.skillPoints) rewardParts.push(`${achievement.rewards.skillPoints} SP`);
                if (achievement.rewards.title) rewardParts.push(`"${achievement.rewards.title}"`);
            }
            
            if (rewardParts.length > 0) {
                const rewardsText = this.scene.add.text(60, 55, `Rewards: ${rewardParts.join(', ')}`, {
                    fontSize: '10px',
                    fill: '#ffeb3b',
                    wordWrap: { width: 280 }
                });
                notification.add(rewardsText);
            }

            // Play achievement sound with error handling
            try {
                if (this.scene.audioManager && this.scene.audioManager.playSFX) {
                    this.scene.audioManager.playSFX('achievement', { volume: 0.6 });
                }
            } catch (audioError) {
                console.warn('PlayerProgressionUI: Error playing achievement audio:', audioError);
            }

            // Slide in animation with error handling
            notification.setX(screenWidth);
            if (this.scene.tweens) {
                this.scene.tweens.add({
                    targets: notification,
                    x: screenWidth - 200,
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
            }

            // Auto-hide after 5 seconds with error handling
            if (this.scene.time) {
                this.scene.time.delayedCall(5000, () => {
                    if (this.scene.tweens) {
                        this.scene.tweens.add({
                            targets: notification,
                            x: screenWidth,
                            alpha: 0,
                            duration: 300,
                            ease: 'Power2.easeIn',
                            onComplete: () => {
                                try {
                                    if (notification && !notification.destroyed) {
                                        notification.destroy();
                                    }
                                } catch (destroyError) {
                                    console.warn('PlayerProgressionUI: Error destroying achievement notification:', destroyError);
                                }
                            }
                        });
                    } else {
                        // Fallback: destroy immediately if no tweens available
                        try {
                            if (notification && !notification.destroyed) {
                                notification.destroy();
                            }
                        } catch (destroyError) {
                            console.warn('PlayerProgressionUI: Error destroying achievement notification (fallback):', destroyError);
                        }
                    }
                });
            }
        } catch (error) {
            console.error('PlayerProgressionUI: Error in showAchievementNotification:', error);
        }
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