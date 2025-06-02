/**
 * Tournament Manager
 * Handles all tournament functionality including scheduling, scoring, leaderboards
 */
export default class TournamentManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.tournaments = this.initializeTournaments();
        this.activeEntry = null;
        this.playerStats = this.loadPlayerStats();
        
        console.log('TournamentManager: Initialized with tournament system');
    }

    initializeTournaments() {
        return {
            // Tournament runs every 4 hours
            schedule: [
                {
                    hour: 0,
                    name: 'Midnight Mystical Challenge',
                    type: 'mystical',
                    description: 'Catch mystical and legendary fish under moonlight',
                    targetTypes: ['mystical', 'legendary'],
                    duration: 120, // 2 hours in minutes
                    entryLevel: 10,
                    entryFee: 500,
                    rewards: {
                        1: { coins: 5000, xp: 2000, items: ['mystical_lure', 'champion_rod'] },
                        2: { coins: 3000, xp: 1500, items: ['mystical_lure'] },
                        3: { coins: 2000, xp: 1000, items: ['enhanced_bait'] },
                        participation: { coins: 500, xp: 200 }
                    }
                },
                {
                    hour: 4,
                    name: 'Dawn Bass Masters',
                    type: 'bass',
                    description: 'Target all bass species at sunrise',
                    targetTypes: ['bass'],
                    duration: 120,
                    entryLevel: 5,
                    entryFee: 200,
                    rewards: {
                        1: { coins: 2500, xp: 1200, items: ['bass_specialist_gear'] },
                        2: { coins: 1500, xp: 800, items: ['quality_bait'] },
                        3: { coins: 1000, xp: 500, items: ['bass_lure'] },
                        participation: { coins: 200, xp: 100 }
                    }
                },
                {
                    hour: 8,
                    name: 'Morning Trout Tournament',
                    type: 'trout',
                    description: 'Fresh water trout fishing competition',
                    targetTypes: ['trout'],
                    duration: 120,
                    entryLevel: 3,
                    entryFee: 100,
                    rewards: {
                        1: { coins: 2000, xp: 1000, items: ['trout_master_rod'] },
                        2: { coins: 1200, xp: 600, items: ['stream_bait'] },
                        3: { coins: 800, xp: 400, items: ['trout_lure'] },
                        participation: { coins: 150, xp: 75 }
                    }
                },
                {
                    hour: 12,
                    name: 'Noon Deep Sea Championship',
                    type: 'deep_sea',
                    description: 'Deep sea saltwater fishing championship',
                    targetTypes: ['saltwater', 'deep_sea'],
                    duration: 120,
                    entryLevel: 8,
                    entryFee: 400,
                    rewards: {
                        1: { coins: 4000, xp: 1800, items: ['deep_sea_gear', 'ocean_master_rod'] },
                        2: { coins: 2500, xp: 1200, items: ['deep_sea_bait'] },
                        3: { coins: 1500, xp: 800, items: ['saltwater_lure'] },
                        participation: { coins: 300, xp: 150 }
                    }
                },
                {
                    hour: 16,
                    name: 'Afternoon Legendary Hunt',
                    type: 'legendary',
                    description: 'Hunt for the rarest legendary fish',
                    targetTypes: ['legendary', 'mythical'],
                    duration: 120,
                    entryLevel: 15,
                    entryFee: 1000,
                    rewards: {
                        1: { coins: 8000, xp: 3000, items: ['legendary_rod', 'master_bait', 'champion_gear'] },
                        2: { coins: 5000, xp: 2000, items: ['legendary_lure', 'master_bait'] },
                        3: { coins: 3000, xp: 1500, items: ['legendary_lure'] },
                        participation: { coins: 750, xp: 300 }
                    }
                },
                {
                    hour: 20,
                    name: 'Evening Elite Competition',
                    type: 'elite',
                    description: 'All-species elite competition for champions',
                    targetTypes: ['all'],
                    duration: 120,
                    entryLevel: 12,
                    entryFee: 750,
                    rewards: {
                        1: { coins: 6000, xp: 2500, items: ['elite_champion_set'] },
                        2: { coins: 4000, xp: 1800, items: ['elite_gear'] },
                        3: { coins: 2500, xp: 1200, items: ['champion_bait'] },
                        participation: { coins: 500, xp: 250 }
                    }
                }
            ]
        };
    }

    getCurrentTournament() {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        const activeTournament = this.tournaments.schedule.find(tournament => {
            const startHour = tournament.hour;
            const endHour = (startHour + 2) % 24;
            
            if (endHour > startHour) {
                return hour >= startHour && hour < endHour;
            } else {
                // Tournament crosses midnight
                return hour >= startHour || hour < endHour;
            }
        });
        
        if (activeTournament) {
            const endHour = (activeTournament.hour + 2) % 24;
            let timeRemaining;
            
            if (endHour > hour || (endHour === hour && minute === 0)) {
                timeRemaining = `${endHour - hour}h ${60 - minute}m`;
            } else {
                timeRemaining = `${(24 - hour) + endHour}h ${60 - minute}m`;
            }
            
            return {
                active: true,
                tournament: activeTournament,
                timeRemaining: timeRemaining
            };
        }
        
        return { active: false, tournament: null };
    }

    getNextTournament() {
        const now = new Date();
        const hour = now.getHours();
        
        const nextTournament = this.tournaments.schedule.find(tournament => tournament.hour > hour) || 
                             this.tournaments.schedule[0];
        
        const hoursUntil = nextTournament.hour > hour ? 
                          nextTournament.hour - hour : 
                          (24 - hour) + nextTournament.hour;
        
        return {
            tournament: nextTournament,
            startsIn: `${hoursUntil}h ${60 - now.getMinutes()}m`
        };
    }

    canEnterTournament(tournament) {
        const player = this.gameState.player;
        const errors = [];
        
        // Level requirement
        if (player.level < tournament.entryLevel) {
            errors.push(`Level ${tournament.entryLevel} required`);
        }
        
        // Coin requirement
        if (player.money < tournament.entryFee) {
            errors.push(`${tournament.entryFee} coins required`);
        }
        
        // Energy requirement
        if (player.energy < 30) {
            errors.push('At least 30 energy required');
        }
        
        // Location requirement (Champion's Cove only)
        if (player.currentLocation !== 'Champion\'s Cove' && player.currentLocation !== 'Champions Cove') {
            errors.push('Must be at Champion\'s Cove');
        }
        
        // Fishtank space
        const fishtankCount = this.gameState.inventory.fish.length;
        const fishtankMax = this.gameState.getBoatAttribute('fishtankStorage') || 10;
        if (fishtankCount >= fishtankMax - 2) {
            errors.push('Need fishtank space (at least 3 slots)');
        }
        
        return {
            canEnter: errors.length === 0,
            errors: errors
        };
    }

    enterTournament(tournament) {
        const canEnter = this.canEnterTournament(tournament);
        if (!canEnter.canEnter) {
            return { success: false, errors: canEnter.errors };
        }
        
        // Deduct entry fee
        this.gameState.player.money -= tournament.entryFee;
        
        // Set up tournament entry
        this.activeEntry = {
            tournament: tournament,
            startTime: Date.now(),
            catches: [],
            score: 0,
            bestFish: null,
            participationTime: 0
        };
        
        console.log('TournamentManager: Entered tournament:', tournament.name);
        return { success: true, entry: this.activeEntry };
    }

    recordCatch(fish) {
        if (!this.activeEntry) return;
        
        const tournament = this.activeEntry.tournament;
        let points = 0;
        
        // Base points from fish value and rarity
        points += fish.baseValue || 0;
        points += (fish.rarity || 1) * 100;
        
        // Bonus points for target types
        if (tournament.targetTypes.includes('all') || 
            tournament.targetTypes.some(type => fish.type === type || fish.category === type)) {
            points *= 2; // Double points for target fish
        }
        
        // Size bonus
        if (fish.size === 'large') points *= 1.5;
        if (fish.size === 'huge') points *= 2;
        
        // Special bonuses
        if (fish.rarity >= 8) points *= 1.5; // Legendary bonus
        if (fish.rarity >= 9) points *= 2;   // Mythical bonus
        
        const catchRecord = {
            fish: fish,
            points: Math.floor(points),
            timestamp: Date.now()
        };
        
        this.activeEntry.catches.push(catchRecord);
        this.activeEntry.score += catchRecord.points;
        
        // Update best fish
        if (!this.activeEntry.bestFish || catchRecord.points > this.activeEntry.bestFish.points) {
            this.activeEntry.bestFish = catchRecord;
        }
        
        console.log(`TournamentManager: Recorded catch - ${fish.name} for ${catchRecord.points} points`);
        return catchRecord;
    }

    finalizeTournament() {
        if (!this.activeEntry) return null;
        
        const finalScore = this.activeEntry.score;
        const tournament = this.activeEntry.tournament;
        
        // Determine ranking (mock for now)
        const ranking = this.calculateRanking(finalScore);
        
        // Award rewards
        const rewards = this.awardRewards(tournament, ranking);
        
        // Update player stats
        this.updatePlayerStats(tournament, finalScore, ranking);
        
        const result = {
            tournament: tournament.name,
            score: finalScore,
            ranking: ranking,
            catches: this.activeEntry.catches.length,
            bestFish: this.activeEntry.bestFish,
            rewards: rewards
        };
        
        // Clear active entry
        this.activeEntry = null;
        
        console.log('TournamentManager: Tournament finalized with ranking:', ranking);
        return result;
    }

    calculateRanking(score) {
        // Mock ranking calculation based on score
        if (score >= 10000) return 1;
        if (score >= 7500) return 2;
        if (score >= 5000) return 3;
        if (score >= 2500) return Math.floor(Math.random() * 7) + 4; // 4-10
        return Math.floor(Math.random() * 15) + 11; // 11-25
    }

    awardRewards(tournament, ranking) {
        const rewards = tournament.rewards[ranking] || tournament.rewards.participation;
        
        // Award coins
        this.gameState.player.money += rewards.coins;
        
        // Award XP
        this.gameState.playerProgression.addExperience(rewards.xp);
        
        // Award items
        if (rewards.items) {
            rewards.items.forEach(itemId => {
                this.gameState.inventoryManager.addItem(itemId, 1);
            });
        }
        
        return rewards;
    }

    updatePlayerStats(tournament, score, ranking) {
        if (!this.playerStats[tournament.type]) {
            this.playerStats[tournament.type] = {
                participations: 0,
                bestScore: 0,
                bestRanking: 999,
                totalScore: 0,
                wins: 0
            };
        }
        
        const stats = this.playerStats[tournament.type];
        stats.participations++;
        stats.totalScore += score;
        
        if (score > stats.bestScore) {
            stats.bestScore = score;
        }
        
        if (ranking < stats.bestRanking) {
            stats.bestRanking = ranking;
        }
        
        if (ranking === 1) {
            stats.wins++;
        }
        
        this.savePlayerStats();
    }

    getLeaderboard(tournamentType = 'current') {
        // Mock leaderboard data - in real implementation this would come from server
        const mockLeaderboards = {
            mystical: [
                { rank: 1, name: 'Mystical Master', score: 15420, fish: 'Golden Dragon Bass' },
                { rank: 2, name: 'Night Hunter', score: 14800, fish: 'Moonlight Trout' },
                { rank: 3, name: 'Legend Seeker', score: 13950, fish: 'Crystal Bass' },
                { rank: 4, name: 'Shadow Angler', score: 12300, fish: 'Phantom Carp' },
                { rank: 5, name: 'Mystic Fisher', score: 11750, fish: 'Ethereal Salmon' }
            ],
            bass: [
                { rank: 1, name: 'Bass Champion', score: 8420, fish: 'Legendary Largemouth' },
                { rank: 2, name: 'Lake Master', score: 7800, fish: 'Golden Bass' },
                { rank: 3, name: 'Bass Hunter', score: 7150, fish: 'Silver Bass' },
                { rank: 4, name: 'Angler Pro', score: 6300, fish: 'Royal Bass' },
                { rank: 5, name: 'Fisher Elite', score: 5750, fish: 'Tournament Bass' }
            ],
            current: [
                { rank: 1, name: 'Tournament King', score: 18420, fish: 'Mythical Leviathan' },
                { rank: 2, name: 'Elite Angler', score: 16800, fish: 'Ancient Dragon' },
                { rank: 3, name: 'Pro Fisher', score: 15150, fish: 'Legendary Marlin' },
                { rank: 4, name: 'Champion Cast', score: 13300, fish: 'Golden Tuna' },
                { rank: 5, name: 'Master Angler', score: 12750, fish: 'Crystal Salmon' }
            ]
        };
        
        return mockLeaderboards[tournamentType] || mockLeaderboards.current;
    }

    getPlayerTournamentStats() {
        return this.playerStats;
    }

    loadPlayerStats() {
        const saved = localStorage.getItem('tournamentStats');
        return saved ? JSON.parse(saved) : {};
    }

    savePlayerStats() {
        localStorage.setItem('tournamentStats', JSON.stringify(this.playerStats));
    }

    isInActiveTournament() {
        return this.activeEntry !== null;
    }

    getActiveTournamentProgress() {
        if (!this.activeEntry) return null;
        
        return {
            tournament: this.activeEntry.tournament.name,
            score: this.activeEntry.score,
            catches: this.activeEntry.catches.length,
            bestFish: this.activeEntry.bestFish?.fish?.name || 'None',
            timeElapsed: Date.now() - this.activeEntry.startTime
        };
    }
} 