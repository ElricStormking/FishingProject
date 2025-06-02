/**
 * Achievement Enhancer
 * Expands the existing achievement system with advanced features:
 * - Tournament achievements
 * - Achievement chains and dependencies
 * - Seasonal achievements
 * - Cross-system achievements
 * - Enhanced rewards and progression
 */
export class AchievementEnhancer {
    constructor(gameState, playerProgression, tournamentManager) {
        this.gameState = gameState;
        this.playerProgression = playerProgression;
        this.tournamentManager = tournamentManager;
        
        // Enhanced achievement definitions
        this.enhancedAchievements = this.initializeEnhancedAchievements();
        this.achievementChains = this.initializeAchievementChains();
        this.seasonalAchievements = this.initializeSeasonalAchievements();
        
        // Achievement progress tracking
        this.achievementProgress = new Map();
        
        console.log('AchievementEnhancer: Enhanced achievement system initialized');
    }

    initializeEnhancedAchievements() {
        return {
            // Tournament Achievements
            tournamentRookie: {
                id: 'tournament_rookie',
                name: 'Tournament Rookie',
                description: 'Enter your first tournament',
                icon: '🏁',
                category: 'tournament',
                requirement: { type: 'tournamentsEntered', value: 1 },
                rewards: { experience: 200, coins: 300, title: 'Rookie Competitor' },
                unlocked: false,
                completed: false,
                tier: 'bronze'
            },
            tournamentContender: {
                id: 'tournament_contender',
                name: 'Tournament Contender',
                description: 'Participate in 5 tournaments',
                icon: '🎯',
                category: 'tournament',
                requirement: { type: 'tournamentsEntered', value: 5 },
                rewards: { experience: 500, coins: 750, skillPoints: 1, title: 'Contender' },
                unlocked: false,
                completed: false,
                tier: 'silver',
                dependsOn: ['tournament_rookie']
            },
            firstPlace: {
                id: 'first_place',
                name: 'Champion',
                description: 'Win your first tournament (1st place)',
                icon: '🥇',
                category: 'tournament',
                requirement: { type: 'tournamentWins', value: 1 },
                rewards: { experience: 1000, coins: 2000, skillPoints: 3, title: 'Tournament Champion', item: { category: 'equipment', id: 'champion_trophy' } },
                unlocked: false,
                completed: false,
                tier: 'gold',
                dependsOn: ['tournament_contender']
            },
            podiumFinisher: {
                id: 'podium_finisher',
                name: 'Podium Finisher',
                description: 'Finish in top 3 in any tournament',
                icon: '🏆',
                category: 'tournament',
                requirement: { type: 'podiumFinishes', value: 1 },
                rewards: { experience: 400, coins: 600, skillPoints: 1 },
                unlocked: false,
                completed: false,
                tier: 'silver'
            },
            tournamentDominance: {
                id: 'tournament_dominance',
                name: 'Tournament Domination',
                description: 'Win 5 tournaments',
                icon: '👑',
                category: 'tournament',
                requirement: { type: 'tournamentWins', value: 5 },
                rewards: { experience: 2500, coins: 5000, skillPoints: 5, title: 'Tournament Legend', item: { category: 'equipment', id: 'legendary_champion_gear' } },
                unlocked: false,
                completed: false,
                tier: 'legendary',
                dependsOn: ['first_place']
            },

            // Equipment Enhancement Achievements
            firstUpgrade: {
                id: 'first_upgrade',
                name: 'Enhanced Angler',
                description: 'Upgrade your first piece of equipment',
                icon: '⬆️',
                category: 'equipment',
                requirement: { type: 'equipmentUpgrades', value: 1 },
                rewards: { experience: 150, coins: 200, item: { category: 'materials', id: 'basic_enhancement_stone' } },
                unlocked: false,
                completed: false,
                tier: 'bronze'
            },
            maxLevelGear: {
                id: 'max_level_gear',
                name: 'Gear Perfectionist',
                description: 'Upgrade any equipment to maximum level (10)',
                icon: '🔟',
                category: 'equipment',
                requirement: { type: 'maxLevelEquipment', value: 1 },
                rewards: { experience: 800, coins: 1500, skillPoints: 2, title: 'Gear Master' },
                unlocked: false,
                completed: false,
                tier: 'gold',
                dependsOn: ['first_upgrade']
            },
            enhancementRisk: {
                id: 'enhancement_risk',
                name: 'Risk Taker',
                description: 'Successfully enhance equipment to +5 or higher',
                icon: '🎲',
                category: 'equipment',
                requirement: { type: 'enhancementLevel', value: 5 },
                rewards: { experience: 600, coins: 1000, skillPoints: 1, item: { category: 'materials', id: 'protection_scroll' } },
                unlocked: false,
                completed: false,
                tier: 'silver'
            },
            setBonusCollector: {
                id: 'set_bonus_collector',
                name: 'Set Collector',
                description: 'Activate your first equipment set bonus',
                icon: '📦',
                category: 'equipment',
                requirement: { type: 'setBonusesActivated', value: 1 },
                rewards: { experience: 400, coins: 600, skillPoints: 1 },
                unlocked: false,
                completed: false,
                tier: 'silver'
            },
            specializationMaster: {
                id: 'specialization_master',
                name: 'Specialization Master',
                description: 'Apply 3 different specializations to equipment',
                icon: '🎓',
                category: 'equipment',
                requirement: { type: 'specializationsApplied', value: 3 },
                rewards: { experience: 750, coins: 1200, skillPoints: 2, title: 'Specialist' },
                unlocked: false,
                completed: false,
                tier: 'gold',
                dependsOn: ['set_bonus_collector']
            },

            // Cross-System Achievements
            championAngler: {
                id: 'champion_angler',
                name: 'Champion Angler',
                description: 'Reach level 25, win a tournament, and master all 5 locations',
                icon: '🌟',
                category: 'mastery',
                requirement: { 
                    type: 'composite',
                    conditions: [
                        { type: 'level', value: 25 },
                        { type: 'tournamentWins', value: 1 },
                        { type: 'locationsMastered', value: 5 }
                    ]
                },
                rewards: { experience: 5000, coins: 10000, skillPoints: 10, title: 'Champion Angler', item: { category: 'equipment', id: 'champion_angler_rod' } },
                unlocked: false,
                completed: false,
                tier: 'legendary',
                dependsOn: ['first_place', 'expert_angler']
            },
            perfectionist: {
                id: 'perfectionist_enhanced',
                name: 'Ultimate Perfectionist',
                description: 'Achieve 100 perfect casts, 100 perfect lures, and 100 perfect reels',
                icon: '💎',
                category: 'mastery',
                requirement: { 
                    type: 'composite',
                    conditions: [
                        { type: 'perfectCasts', value: 100 },
                        { type: 'perfectLures', value: 100 },
                        { type: 'perfectReels', value: 100 }
                    ]
                },
                rewards: { experience: 3000, coins: 5000, skillPoints: 5, title: 'Perfectionist', item: { category: 'equipment', id: 'perfection_gear_set' } },
                unlocked: false,
                completed: false,
                tier: 'legendary',
                dependsOn: ['perfectionist']
            },

            // Prestige Achievements
            eliteCollector: {
                id: 'elite_collector',
                name: 'Elite Collector',
                description: 'Discover all 50 fish species in the game',
                icon: '🌈',
                category: 'collection',
                requirement: { type: 'speciesDiscovered', value: 50 },
                rewards: { experience: 2000, coins: 5000, skillPoints: 5, title: 'Master Collector', item: { category: 'equipment', id: 'collectors_compendium' } },
                unlocked: false,
                completed: false,
                tier: 'legendary',
                dependsOn: ['encyclopedia']
            },
            mythicalHunter: {
                id: 'mythical_hunter',
                name: 'Mythical Hunter',
                description: 'Catch 10 mythical rarity fish (rarity 9+)',
                icon: '🦄',
                category: 'rarity',
                requirement: { type: 'rareFishCaught', rarity: 9, value: 10 },
                rewards: { experience: 2500, coins: 7500, skillPoints: 7, title: 'Mythical Hunter', item: { category: 'equipment', id: 'mythical_hunter_set' } },
                unlocked: false,
                completed: false,
                tier: 'legendary',
                dependsOn: ['first_legendary']
            },

            // Tournament Type Specific Achievements
            bassSpecialist: {
                id: 'bass_specialist',
                name: 'Bass Specialist',
                description: 'Win the Dawn Bass Masters tournament',
                icon: '🐟',
                category: 'tournament',
                requirement: { type: 'tournamentTypeWin', tournamentType: 'bass', value: 1 },
                rewards: { experience: 500, coins: 1000, skillPoints: 2, title: 'Bass Master' },
                unlocked: false,
                completed: false,
                tier: 'gold'
            },
            mysticalChampion: {
                id: 'mystical_champion',
                name: 'Mystical Champion',
                description: 'Win the Midnight Mystical Challenge tournament',
                icon: '🌙',
                category: 'tournament',
                requirement: { type: 'tournamentTypeWin', tournamentType: 'mystical', value: 1 },
                rewards: { experience: 750, coins: 1500, skillPoints: 3, title: 'Mystical Champion' },
                unlocked: false,
                completed: false,
                tier: 'gold'
            },
            deepSeaLord: {
                id: 'deep_sea_lord',
                name: 'Deep Sea Lord',
                description: 'Win the Noon Deep Sea Championship tournament',
                icon: '🌊',
                category: 'tournament',
                requirement: { type: 'tournamentTypeWin', tournamentType: 'deep_sea', value: 1 },
                rewards: { experience: 600, coins: 1200, skillPoints: 2, title: 'Deep Sea Lord' },
                unlocked: false,
                completed: false,
                tier: 'gold'
            }
        };
    }

    initializeAchievementChains() {
        return [
            {
                id: 'tournament_progression',
                name: 'Tournament Career',
                description: 'Progress through tournament achievements',
                achievements: ['tournament_rookie', 'tournament_contender', 'first_place', 'tournament_dominance'],
                rewards: { experience: 1000, coins: 2000, skillPoints: 3, title: 'Tournament Veteran' }
            },
            {
                id: 'equipment_mastery',
                name: 'Equipment Mastery',
                description: 'Master all aspects of equipment enhancement',
                achievements: ['first_upgrade', 'enhancement_risk', 'set_bonus_collector', 'specialization_master', 'max_level_gear'],
                rewards: { experience: 1500, coins: 3000, skillPoints: 5, title: 'Equipment Master' }
            },
            {
                id: 'tournament_specialist',
                name: 'Tournament Specialist',
                description: 'Win all tournament types',
                achievements: ['bass_specialist', 'mystical_champion', 'deep_sea_lord'],
                rewards: { experience: 2000, coins: 4000, skillPoints: 6, title: 'All-Tournament Champion' }
            }
        ];
    }

    initializeSeasonalAchievements() {
        return {
            springFishing: {
                id: 'spring_fishing',
                name: 'Spring Angler',
                description: 'Catch 50 fish during spring season',
                icon: '🌸',
                category: 'seasonal',
                requirement: { type: 'seasonalFishCaught', season: 'spring', value: 50 },
                rewards: { experience: 400, coins: 600, item: { category: 'equipment', id: 'spring_blossom_lure' } },
                season: 'spring',
                unlocked: false,
                completed: false
            },
            summerTournaments: {
                id: 'summer_tournaments',
                name: 'Summer Competitor',
                description: 'Participate in 10 tournaments during summer',
                icon: '☀️',
                category: 'seasonal',
                requirement: { type: 'seasonalTournaments', season: 'summer', value: 10 },
                rewards: { experience: 600, coins: 1000, skillPoints: 2 },
                season: 'summer',
                unlocked: false,
                completed: false
            }
        };
    }

    initializeEnhancedProgress() {
        const player = this.gameState.player;
        
        // Initialize enhanced achievement tracking
        if (!player.enhancedAchievements) {
            player.enhancedAchievements = {};
        }
        
        // Initialize achievement chain progress
        if (!player.achievementChains) {
            player.achievementChains = {};
        }
        
        // Initialize seasonal achievement tracking
        if (!player.seasonalAchievements) {
            player.seasonalAchievements = {};
        }
        
        // Initialize enhanced statistics for achievement tracking
        if (!player.enhancedStats) {
            player.enhancedStats = {
                tournamentsEntered: 0,
                tournamentWins: 0,
                podiumFinishes: 0,
                tournamentTypeWins: {},
                equipmentUpgrades: 0,
                maxLevelEquipment: 0,
                enhancementLevel: 0,
                setBonusesActivated: 0,
                specializationsApplied: 0,
                locationsMastered: 0,
                seasonalStats: {}
            };
        }
        
        // Ensure all enhanced achievements are initialized
        Object.keys(this.enhancedAchievements).forEach(achievementId => {
            if (!player.enhancedAchievements[achievementId]) {
                player.enhancedAchievements[achievementId] = {
                    unlocked: false,
                    completed: false,
                    progress: 0,
                    completedAt: null
                };
            }
        });
        
        // Initialize achievement chains
        this.achievementChains.forEach(chain => {
            if (!player.achievementChains[chain.id]) {
                player.achievementChains[chain.id] = {
                    completed: false,
                    progress: 0,
                    completedAt: null
                };
            }
        });
    }

    trackEnhancedEvent(eventType, data = {}) {
        const player = this.gameState.player;
        const stats = player.enhancedStats;
        
        switch (eventType) {
            case 'tournamentEntered':
                stats.tournamentsEntered++;
                break;
                
            case 'tournamentWon':
                stats.tournamentWins++;
                if (data.tournamentType) {
                    if (!stats.tournamentTypeWins[data.tournamentType]) {
                        stats.tournamentTypeWins[data.tournamentType] = 0;
                    }
                    stats.tournamentTypeWins[data.tournamentType]++;
                }
                break;
                
            case 'podiumFinish':
                stats.podiumFinishes++;
                break;
                
            case 'equipmentUpgraded':
                stats.equipmentUpgrades++;
                if (data.level === 10) {
                    stats.maxLevelEquipment++;
                }
                break;
                
            case 'equipmentEnhanced':
                if (data.enhancementLevel > stats.enhancementLevel) {
                    stats.enhancementLevel = data.enhancementLevel;
                }
                break;
                
            case 'setBonusActivated':
                stats.setBonusesActivated++;
                break;
                
            case 'specializationApplied':
                stats.specializationsApplied++;
                break;
                
            case 'locationMastered':
                stats.locationsMastered++;
                break;
        }
        
        // Check for achievement progress
        this.checkEnhancedAchievements(eventType, data);
        this.checkAchievementChains();
        
        this.gameState.markDirty();
    }

    checkEnhancedAchievements(eventType, data = {}) {
        const unlockedAchievements = [];
        
        Object.values(this.enhancedAchievements).forEach(achievement => {
            const playerAchievement = this.gameState.player.enhancedAchievements[achievement.id];
            
            if (playerAchievement && !playerAchievement.completed) {
                // Check dependencies
                if (this.checkAchievementDependencies(achievement)) {
                    const progress = this.calculateEnhancedProgress(achievement);
                    playerAchievement.progress = progress;
                    
                    if (this.meetsEnhancedRequirement(achievement)) {
                        this.unlockEnhancedAchievement(achievement.id);
                        unlockedAchievements.push(achievement);
                    }
                }
            }
        });
        
        return unlockedAchievements;
    }

    checkAchievementDependencies(achievement) {
        if (!achievement.dependsOn || achievement.dependsOn.length === 0) {
            return true;
        }
        
        const player = this.gameState.player;
        
        return achievement.dependsOn.every(dependencyId => {
            // Check both regular and enhanced achievements
            const regularAchievement = player.achievements[dependencyId];
            const enhancedAchievement = player.enhancedAchievements[dependencyId];
            
            return (regularAchievement && regularAchievement.completed) ||
                   (enhancedAchievement && enhancedAchievement.completed);
        });
    }

    calculateEnhancedProgress(achievement) {
        const req = achievement.requirement;
        const stats = this.gameState.player.enhancedStats;
        const player = this.gameState.player;
        
        if (req.type === 'composite') {
            // For composite requirements, all conditions must be met
            return req.conditions.every(condition => {
                return this.getStatValue(condition) >= condition.value;
            }) ? req.conditions[0].value : 0;
        }
        
        return this.getStatValue(req);
    }

    getStatValue(requirement) {
        const stats = this.gameState.player.enhancedStats;
        const player = this.gameState.player;
        const regularStats = player.statistics?.enhanced || {};
        
        switch (requirement.type) {
            case 'tournamentsEntered':
                return stats.tournamentsEntered || 0;
            case 'tournamentWins':
                return stats.tournamentWins || 0;
            case 'podiumFinishes':
                return stats.podiumFinishes || 0;
            case 'tournamentTypeWin':
                return stats.tournamentTypeWins[requirement.tournamentType] || 0;
            case 'equipmentUpgrades':
                return stats.equipmentUpgrades || 0;
            case 'maxLevelEquipment':
                return stats.maxLevelEquipment || 0;
            case 'enhancementLevel':
                return stats.enhancementLevel || 0;
            case 'setBonusesActivated':
                return stats.setBonusesActivated || 0;
            case 'specializationsApplied':
                return stats.specializationsApplied || 0;
            case 'locationsMastered':
                return stats.locationsMastered || 0;
            case 'level':
                return player.level || 1;
            case 'speciesDiscovered':
                return Object.keys(regularStats.speciesCaught || {}).length;
            case 'rareFishCaught':
                return (regularStats.rareFishCaught && regularStats.rareFishCaught[requirement.rarity]) || 0;
            case 'perfectCasts':
                return player.progression?.perfectCasts || 0;
            case 'perfectLures':
                return player.progression?.perfectLures || 0;
            case 'perfectReels':
                return player.progression?.perfectReels || 0;
            default:
                return 0;
        }
    }

    meetsEnhancedRequirement(achievement) {
        const req = achievement.requirement;
        
        if (req.type === 'composite') {
            return req.conditions.every(condition => {
                return this.getStatValue(condition) >= condition.value;
            });
        }
        
        const progress = this.calculateEnhancedProgress(achievement);
        return progress >= req.value;
    }

    unlockEnhancedAchievement(achievementId) {
        const achievement = this.enhancedAchievements[achievementId];
        const playerAchievement = this.gameState.player.enhancedAchievements[achievementId];
        
        if (playerAchievement && !playerAchievement.completed) {
            playerAchievement.completed = true;
            playerAchievement.completedAt = new Date().toISOString();
            
            // Award achievement rewards
            this.awardEnhancedRewards(achievement);
            
            // Emit achievement unlocked event
            this.playerProgression.emit('enhancedAchievementUnlocked', {
                achievement: achievement,
                rewards: achievement.rewards
            });
            
            console.log(`AchievementEnhancer: Enhanced achievement unlocked: ${achievement.name}`);
            return true;
        }
        return false;
    }

    awardEnhancedRewards(achievement) {
        const rewards = achievement.rewards;
        
        if (rewards.experience) {
            this.playerProgression.addExperience(rewards.experience, 'enhancedAchievement', { achievementId: achievement.id });
        }
        if (rewards.coins) {
            this.gameState.addMoney(rewards.coins);
        }
        if (rewards.skillPoints) {
            this.gameState.player.skillPoints.available += rewards.skillPoints;
            this.gameState.player.skillPoints.total += rewards.skillPoints;
        }
        if (rewards.title) {
            if (!this.gameState.player.titles) {
                this.gameState.player.titles = [];
            }
            if (!this.gameState.player.titles.includes(rewards.title)) {
                this.gameState.player.titles.push(rewards.title);
            }
        }
        if (rewards.item) {
            this.gameState.inventoryManager.addItem(rewards.item.id, 1, rewards.item.category);
        }
    }

    checkAchievementChains() {
        const player = this.gameState.player;
        
        this.achievementChains.forEach(chain => {
            const chainProgress = player.achievementChains[chain.id];
            
            if (!chainProgress.completed) {
                const completedCount = chain.achievements.filter(achievementId => {
                    const regular = player.achievements[achievementId];
                    const enhanced = player.enhancedAchievements[achievementId];
                    return (regular && regular.completed) || (enhanced && enhanced.completed);
                }).length;
                
                chainProgress.progress = completedCount;
                
                if (completedCount === chain.achievements.length) {
                    this.completeAchievementChain(chain.id);
                }
            }
        });
    }

    completeAchievementChain(chainId) {
        const chain = this.achievementChains.find(c => c.id === chainId);
        const chainProgress = this.gameState.player.achievementChains[chainId];
        
        if (chain && !chainProgress.completed) {
            chainProgress.completed = true;
            chainProgress.completedAt = new Date().toISOString();
            
            // Award chain rewards
            this.awardEnhancedRewards(chain);
            
            this.playerProgression.emit('achievementChainCompleted', {
                chain: chain,
                rewards: chain.rewards
            });
            
            console.log(`AchievementEnhancer: Achievement chain completed: ${chain.name}`);
        }
    }

    getAllEnhancedAchievements() {
        const player = this.gameState.player;
        const enhancedData = {};
        
        Object.entries(this.enhancedAchievements).forEach(([id, achievement]) => {
            const playerProgress = player.enhancedAchievements[id];
            const progress = this.calculateEnhancedProgress(achievement);
            
            enhancedData[id] = {
                ...achievement,
                progress: progress,
                progressPercent: achievement.requirement.type === 'composite' ? 
                    (this.meetsEnhancedRequirement(achievement) ? 100 : 0) :
                    Math.min(100, (progress / achievement.requirement.value) * 100),
                completed: playerProgress?.completed || false,
                completedAt: playerProgress?.completedAt || null,
                canUnlock: this.checkAchievementDependencies(achievement)
            };
        });
        
        return enhancedData;
    }

    getAchievementChainProgress() {
        const player = this.gameState.player;
        
        return this.achievementChains.map(chain => {
            const chainProgress = player.achievementChains[chain.id];
            
            return {
                ...chain,
                progress: chainProgress.progress,
                total: chain.achievements.length,
                completed: chainProgress.completed,
                completedAt: chainProgress.completedAt
            };
        });
    }
} 