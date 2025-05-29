// PlayerProgression.js - Comprehensive player progression and leveling system
export class PlayerProgression {
    constructor(gameState) {
        this.gameState = gameState;
        this.listeners = new Map();
        
        // Experience sources and multipliers
        this.experienceSources = {
            fishCaught: {
                base: 10,
                rarityMultiplier: {
                    1: 1.0,    // Common
                    2: 1.2,    // Uncommon  
                    3: 1.5,    // Rare
                    4: 2.0,    // Epic
                    5: 3.0,    // Legendary
                    6: 4.0,    // Mythic
                    7: 6.0,    // Ancient
                    8: 10.0,   // Divine
                    9: 15.0,   // Cosmic
                    10: 25.0   // Transcendent
                }
            },
            perfectCast: 25,
            perfectLure: 30,
            perfectReel: 35,
            firstTimeSpecies: 50,
            locationDiscovery: 100,
            achievementUnlock: 75,
            dailyChallenge: 150,
            questComplete: 200
        };
        
        // Level progression formula
        this.levelFormula = {
            baseExp: 100,
            multiplier: 1.15,
            maxLevel: 100
        };
        
        // Skill trees and attributes
        this.skillTrees = {
            casting: {
                name: 'Casting Mastery',
                icon: '🎯',
                description: 'Improve your casting accuracy and range',
                skills: {
                    accuracy: {
                        name: 'Cast Accuracy',
                        maxLevel: 20,
                        effect: 'Increases casting precision',
                        bonusPerLevel: 2,
                        unlockLevel: 1
                    },
                    range: {
                        name: 'Cast Range',
                        maxLevel: 15,
                        effect: 'Increases maximum casting distance',
                        bonusPerLevel: 3,
                        unlockLevel: 5
                    },
                    power: {
                        name: 'Cast Power',
                        maxLevel: 12,
                        effect: 'Reduces energy cost of casting',
                        bonusPerLevel: 1,
                        unlockLevel: 10
                    }
                }
            },
            fishing: {
                name: 'Fishing Expertise',
                icon: '🎣',
                description: 'Master the art of catching fish',
                skills: {
                    detection: {
                        name: 'Fish Detection',
                        maxLevel: 20,
                        effect: 'Increases fish bite rate',
                        bonusPerLevel: 3,
                        unlockLevel: 1
                    },
                    patience: {
                        name: 'Angler Patience',
                        maxLevel: 15,
                        effect: 'Reduces time between bites',
                        bonusPerLevel: 2,
                        unlockLevel: 3
                    },
                    rareChance: {
                        name: 'Rare Fish Magnet',
                        maxLevel: 10,
                        effect: 'Increases chance of rare fish',
                        bonusPerLevel: 5,
                        unlockLevel: 15
                    }
                }
            },
            reeling: {
                name: 'Reeling Technique',
                icon: '⚡',
                description: 'Perfect your fish reeling skills',
                skills: {
                    speed: {
                        name: 'Reel Speed',
                        maxLevel: 18,
                        effect: 'Increases reeling speed',
                        bonusPerLevel: 2,
                        unlockLevel: 1
                    },
                    strength: {
                        name: 'Line Strength',
                        maxLevel: 15,
                        effect: 'Reduces chance of line breaking',
                        bonusPerLevel: 3,
                        unlockLevel: 7
                    },
                    precision: {
                        name: 'QTE Precision',
                        maxLevel: 12,
                        effect: 'Larger QTE timing windows',
                        bonusPerLevel: 4,
                        unlockLevel: 12
                    }
                }
            },
            luring: {
                name: 'Lure Mastery',
                icon: '🌟',
                description: 'Become a master of lure techniques',
                skills: {
                    success: {
                        name: 'Lure Success',
                        maxLevel: 20,
                        effect: 'Increases lure minigame success rate',
                        bonusPerLevel: 2,
                        unlockLevel: 1
                    },
                    durability: {
                        name: 'Lure Durability',
                        maxLevel: 10,
                        effect: 'Lures last longer before breaking',
                        bonusPerLevel: 5,
                        unlockLevel: 8
                    },
                    variety: {
                        name: 'Lure Variety',
                        maxLevel: 8,
                        effect: 'Unlocks advanced lure types',
                        bonusPerLevel: 1,
                        unlockLevel: 20
                    }
                }
            },
            exploration: {
                name: 'Explorer Spirit',
                icon: '🗺️',
                description: 'Discover new locations and secrets',
                skills: {
                    energy: {
                        name: 'Stamina',
                        maxLevel: 25,
                        effect: 'Increases maximum energy',
                        bonusPerLevel: 4,
                        unlockLevel: 1
                    },
                    efficiency: {
                        name: 'Energy Efficiency',
                        maxLevel: 15,
                        effect: 'Reduces energy consumption',
                        bonusPerLevel: 2,
                        unlockLevel: 6
                    },
                    discovery: {
                        name: 'Keen Eye',
                        maxLevel: 10,
                        effect: 'Reveals hidden fishing spots',
                        bonusPerLevel: 10,
                        unlockLevel: 25
                    }
                }
            }
        };
        
        // Level rewards
        this.levelRewards = {
            5: { coins: 500, skillPoints: 2, item: { category: 'lures', id: 'spoon_lure' } },
            10: { coins: 1000, skillPoints: 3, item: { category: 'rods', id: 'carbon_rod' } },
            15: { coins: 1500, skillPoints: 3, unlockLocation: 'river_rapids' },
            20: { coins: 2500, skillPoints: 4, item: { category: 'boats', id: 'motorboat' } },
            25: { coins: 3500, skillPoints: 4, unlockLocation: 'ocean_depths' },
            30: { coins: 5000, skillPoints: 5, item: { category: 'lures', id: 'legendary_spinner' } },
            40: { coins: 7500, skillPoints: 6, unlockLocation: 'mountain_lake' },
            50: { coins: 10000, skillPoints: 8, item: { category: 'rods', id: 'master_rod' } },
            75: { coins: 20000, skillPoints: 10, unlockLocation: 'deep_abyss' },
            100: { coins: 50000, skillPoints: 15, item: { category: 'boats', id: 'luxury_yacht' } }
        };
        
        // Initialize player progression if not exists
        this.initializeProgression();
        
        console.log('PlayerProgression: Comprehensive progression system initialized');
    }

    initializeProgression() {
        const player = this.gameState.player;
        
        // Initialize skill points if not exists
        if (!player.skillPoints) {
            player.skillPoints = {
                available: 0,
                total: 0,
                spent: 0
            };
        }
        
        // Initialize skill levels if not exists
        if (!player.skills) {
            player.skills = {};
            Object.keys(this.skillTrees).forEach(treeId => {
                player.skills[treeId] = {};
                Object.keys(this.skillTrees[treeId].skills).forEach(skillId => {
                    player.skills[treeId][skillId] = 0;
                });
            });
        }
        
        // Initialize progression stats if not exists
        if (!player.progression) {
            player.progression = {
                totalExperienceEarned: player.experience || 0,
                levelsGained: player.level - 1 || 0,
                skillPointsEarned: 0,
                milestonesReached: [],
                perfectCasts: 0,
                perfectLures: 0,
                perfectReels: 0,
                speciesDiscovered: 0,
                locationsUnlocked: 1
            };
        }
        
        // Ensure level calculation is correct
        this.recalculateLevel();
    }

    // Experience and leveling methods
    addExperience(amount, source = 'unknown', details = {}) {
        const player = this.gameState.player;
        const oldLevel = player.level;
        
        // Apply any experience multipliers
        let finalAmount = amount;
        if (source === 'fishCaught' && details.rarity) {
            const multiplier = this.experienceSources.fishCaught.rarityMultiplier[details.rarity] || 1.0;
            finalAmount = Math.floor(amount * multiplier);
        }
        
        // Add experience
        player.experience += finalAmount;
        player.progression.totalExperienceEarned += finalAmount;
        
        // Track source
        this.trackExperienceSource(source, finalAmount, details);
        
        // Check for level ups
        const levelsGained = this.checkLevelUp(oldLevel);
        
        this.gameState.markDirty();
        this.emit('experienceGained', {
            amount: finalAmount,
            source: source,
            details: details,
            total: player.experience,
            levelsGained: levelsGained
        });
        
        return finalAmount;
    }

    checkLevelUp(oldLevel) {
        const player = this.gameState.player;
        let levelsGained = 0;
        
        while (player.experience >= this.getExperienceForLevel(player.level + 1) && player.level < this.levelFormula.maxLevel) {
            player.level++;
            levelsGained++;
            player.progression.levelsGained++;
            
            // Award skill points
            const skillPointsAwarded = this.getSkillPointsForLevel(player.level);
            player.skillPoints.available += skillPointsAwarded;
            player.skillPoints.total += skillPointsAwarded;
            player.progression.skillPointsEarned += skillPointsAwarded;
            
            // Check for level rewards
            this.checkLevelRewards(player.level);
            
            this.emit('levelUp', {
                newLevel: player.level,
                skillPointsAwarded: skillPointsAwarded,
                rewards: this.levelRewards[player.level] || null
            });
            
            console.log(`PlayerProgression: Level up! Now level ${player.level} (+${skillPointsAwarded} skill points)`);
        }
        
        // Update experience to next level
        player.experienceToNext = this.getExperienceForLevel(player.level + 1) - player.experience;
        
        return levelsGained;
    }

    getExperienceForLevel(level) {
        if (level <= 1) return 0;
        
        let totalExp = 0;
        for (let i = 2; i <= level; i++) {
            totalExp += Math.floor(this.levelFormula.baseExp * Math.pow(this.levelFormula.multiplier, i - 2));
        }
        return totalExp;
    }

    getRarityMultiplier(rarity) {
        // Get the rarity multiplier for experience calculation
        return this.experienceSources.fishCaught.rarityMultiplier[rarity] || 1.0;
    }

    getSkillPointsForLevel(level) {
        // Award more skill points at higher levels
        if (level <= 10) return 1;
        if (level <= 25) return 2;
        if (level <= 50) return 3;
        if (level <= 75) return 4;
        return 5;
    }

    recalculateLevel() {
        const player = this.gameState.player;
        const currentExp = player.experience;
        
        // Find correct level based on experience
        let level = 1;
        while (level < this.levelFormula.maxLevel && currentExp >= this.getExperienceForLevel(level + 1)) {
            level++;
        }
        
        player.level = level;
        player.experienceToNext = this.getExperienceForLevel(level + 1) - currentExp;
    }

    // Skill system methods
    canUpgradeSkill(treeId, skillId) {
        const player = this.gameState.player;
        const skill = this.skillTrees[treeId]?.skills[skillId];
        
        if (!skill) return { canUpgrade: false, reason: 'Skill not found' };
        
        const currentLevel = player.skills[treeId][skillId] || 0;
        
        // Check if skill is maxed
        if (currentLevel >= skill.maxLevel) {
            return { canUpgrade: false, reason: 'Skill maxed out' };
        }
        
        // Check if player level requirement is met
        if (player.level < skill.unlockLevel) {
            return { canUpgrade: false, reason: `Requires player level ${skill.unlockLevel}` };
        }
        
        // Check if player has skill points
        if (player.skillPoints.available < 1) {
            return { canUpgrade: false, reason: 'No skill points available' };
        }
        
        return { canUpgrade: true };
    }

    upgradeSkill(treeId, skillId) {
        const canUpgrade = this.canUpgradeSkill(treeId, skillId);
        if (!canUpgrade.canUpgrade) {
            return { success: false, reason: canUpgrade.reason };
        }
        
        const player = this.gameState.player;
        const skill = this.skillTrees[treeId].skills[skillId];
        
        // Upgrade the skill
        player.skills[treeId][skillId]++;
        player.skillPoints.available--;
        player.skillPoints.spent++;
        
        const newLevel = player.skills[treeId][skillId];
        
        // Apply skill effects to player attributes
        this.applySkillEffects(treeId, skillId, newLevel);
        
        this.gameState.markDirty();
        this.emit('skillUpgraded', {
            treeId: treeId,
            skillId: skillId,
            newLevel: newLevel,
            skill: skill,
            effectApplied: skill.bonusPerLevel
        });
        
        console.log(`PlayerProgression: Upgraded ${skill.name} to level ${newLevel}`);
        return { success: true, newLevel: newLevel };
    }

    applySkillEffects(treeId, skillId, level) {
        const skill = this.skillTrees[treeId].skills[skillId];
        const totalBonus = skill.bonusPerLevel * level;
        
        // Map skills to player attributes
        const skillAttributeMap = {
            'casting.accuracy': 'castAccuracy',
            'casting.range': 'castingRange',
            'casting.power': 'castPower',
            'fishing.detection': 'fishDetection',
            'fishing.patience': 'biteRate',
            'fishing.rareChance': 'rareFishChance',
            'reeling.speed': 'reelSpeed',
            'reeling.strength': 'lineStrength',
            'reeling.precision': 'qtePrecision',
            'luring.success': 'lureSuccess',
            'luring.durability': 'lureDurability',
            'exploration.energy': 'energy',
            'exploration.efficiency': 'energyEfficiency'
        };
        
        const attributeKey = skillAttributeMap[`${treeId}.${skillId}`];
        if (attributeKey) {
            // Set the attribute to base value + total skill bonus
            const baseValue = 5; // Base attribute value
            this.gameState.setPlayerAttribute(attributeKey, baseValue + totalBonus);
        }
    }

    // Milestone and achievement tracking
    trackExperienceSource(source, amount, details) {
        const player = this.gameState.player;
        
        switch (source) {
            case 'perfectCast':
                player.progression.perfectCasts++;
                break;
            case 'perfectLure':
                player.progression.perfectLures++;
                break;
            case 'perfectReel':
                player.progression.perfectReels++;
                break;
            case 'firstTimeSpecies':
                player.progression.speciesDiscovered++;
                break;
            case 'locationDiscovery':
                player.progression.locationsUnlocked++;
                break;
        }
    }

    checkLevelRewards(level) {
        const rewards = this.levelRewards[level];
        if (!rewards) return;
        
        const player = this.gameState.player;
        
        // Award coins
        if (rewards.coins) {
            this.gameState.addMoney(rewards.coins);
        }
        
        // Award skill points (already handled in level up)
        
        // Award items
        if (rewards.item) {
            this.gameState.addItem(rewards.item.category, {
                id: rewards.item.id,
                owned: true,
                unlocked: true
            });
        }
        
        // Unlock locations
        if (rewards.unlockLocation) {
            // This would be handled by the location system
            console.log(`PlayerProgression: Unlocked location: ${rewards.unlockLocation}`);
        }
        
        this.emit('levelRewardAwarded', {
            level: level,
            rewards: rewards
        });
    }

    // Progression queries and utilities
    getProgressionSummary() {
        const player = this.gameState.player;
        
        return {
            level: player.level,
            experience: player.experience,
            experienceToNext: player.experienceToNext,
            experienceProgress: player.experienceToNext > 0 ? 
                (player.experience / (player.experience + player.experienceToNext)) : 1.0,
            skillPoints: player.skillPoints,
            totalSkillLevels: this.getTotalSkillLevels(),
            progression: player.progression,
            nextLevelReward: this.getNextLevelReward(),
            availableSkillUpgrades: this.getAvailableSkillUpgrades()
        };
    }

    getTotalSkillLevels() {
        const player = this.gameState.player;
        let total = 0;
        
        Object.keys(this.skillTrees).forEach(treeId => {
            Object.keys(this.skillTrees[treeId].skills).forEach(skillId => {
                total += player.skills[treeId][skillId] || 0;
            });
        });
        
        return total;
    }

    getNextLevelReward() {
        const player = this.gameState.player;
        const nextLevel = player.level + 1;
        
        // Find next level with rewards
        for (let level = nextLevel; level <= this.levelFormula.maxLevel; level++) {
            if (this.levelRewards[level]) {
                return {
                    level: level,
                    rewards: this.levelRewards[level],
                    experienceNeeded: this.getExperienceForLevel(level) - player.experience
                };
            }
        }
        
        return null;
    }

    getAvailableSkillUpgrades() {
        const player = this.gameState.player;
        const available = [];
        
        Object.entries(this.skillTrees).forEach(([treeId, tree]) => {
            Object.entries(tree.skills).forEach(([skillId, skill]) => {
                const canUpgrade = this.canUpgradeSkill(treeId, skillId);
                if (canUpgrade.canUpgrade) {
                    available.push({
                        treeId: treeId,
                        skillId: skillId,
                        treeName: tree.name,
                        skillName: skill.name,
                        currentLevel: player.skills[treeId][skillId] || 0,
                        maxLevel: skill.maxLevel,
                        effect: skill.effect,
                        bonusPerLevel: skill.bonusPerLevel
                    });
                }
            });
        });
        
        return available;
    }

    getSkillTreeData() {
        const player = this.gameState.player;
        const treeData = {};
        
        Object.entries(this.skillTrees).forEach(([treeId, tree]) => {
            treeData[treeId] = {
                ...tree,
                skills: {}
            };
            
            Object.entries(tree.skills).forEach(([skillId, skill]) => {
                const currentLevel = player.skills[treeId][skillId] || 0;
                const canUpgrade = this.canUpgradeSkill(treeId, skillId);
                
                treeData[treeId].skills[skillId] = {
                    ...skill,
                    currentLevel: currentLevel,
                    canUpgrade: canUpgrade.canUpgrade,
                    upgradeReason: canUpgrade.reason || null,
                    totalBonus: skill.bonusPerLevel * currentLevel,
                    isMaxed: currentLevel >= skill.maxLevel,
                    isUnlocked: player.level >= skill.unlockLevel
                };
            });
        });
        
        return treeData;
    }

    // Event system
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`PlayerProgression: Error in event callback for ${event}:`, error);
                }
            });
        }
    }

    // Save/Load support
    getSaveData() {
        return {
            // Player progression data is saved as part of GameState
            version: '1.0.0'
        };
    }

    loadSaveData(data) {
        // Ensure progression is properly initialized after loading
        this.initializeProgression();
        
        // Recalculate and apply all skill effects
        this.recalculateAllSkillEffects();
        
        console.log('PlayerProgression: Save data loaded and skills recalculated');
    }

    recalculateAllSkillEffects() {
        const player = this.gameState.player;
        
        // Reset all attributes to base values
        Object.keys(player.attributes).forEach(attr => {
            if (attr !== 'energy') { // Don't reset current energy
                this.gameState.setPlayerAttribute(attr, 5); // Base value
            }
        });
        
        // Reapply all skill effects
        Object.entries(this.skillTrees).forEach(([treeId, tree]) => {
            Object.keys(tree.skills).forEach(skillId => {
                const level = player.skills[treeId][skillId] || 0;
                if (level > 0) {
                    this.applySkillEffects(treeId, skillId, level);
                }
            });
        });
    }

    // Debug methods
    debugAddExperience(amount) {
        this.addExperience(amount, 'debug', { reason: 'Debug command' });
    }

    debugAddSkillPoints(amount) {
        this.gameState.player.skillPoints.available += amount;
        this.gameState.player.skillPoints.total += amount;
        this.gameState.markDirty();
        console.log(`PlayerProgression: Added ${amount} skill points (debug)`);
    }

    debugMaxSkill(treeId, skillId) {
        const skill = this.skillTrees[treeId]?.skills[skillId];
        if (!skill) return false;
        
        const player = this.gameState.player;
        player.skills[treeId][skillId] = skill.maxLevel;
        this.applySkillEffects(treeId, skillId, skill.maxLevel);
        this.gameState.markDirty();
        
        console.log(`PlayerProgression: Maxed skill ${skill.name} (debug)`);
        return true;
    }

    getDebugInfo() {
        return {
            progressionSummary: this.getProgressionSummary(),
            skillTreeData: this.getSkillTreeData(),
            experienceFormula: this.levelFormula,
            nextRewards: this.getNextLevelReward()
        };
    }
} 