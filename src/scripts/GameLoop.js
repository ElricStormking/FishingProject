import Phaser from 'phaser';
import GameState from './GameState.js';
import { gameDataLoader } from './DataLoader.js';

export default class GameLoop {
    constructor(scene) {
        this.scene = scene;
        this.gameState = GameState.getInstance();
        
        // Core game loop state
        this.currentMode = 'story'; // 'story' or 'practice'
        this.currentPhase = 'boat_menu'; // 'boat_menu', 'traveling', 'fishing', 'chatroom', 'shop', 'inventory'
        this.isActive = true;
        
        // Progression tracking
        this.sessionStats = {
            fishCaught: 0,
            energySpent: 0,
            timeAdvanced: 0,
            coinsEarned: 0,
            experienceGained: 0
        };
        
        // Win/Loss conditions
        this.objectives = {
            levelProgression: { target: 50, current: 1 },
            fishCollection: { target: 50, current: 0 },
            companionRomance: { target: 10, current: 0 },
            masterCrafter: { target: 60, current: 0 }, // All merge recipes
            bossDefeated: { target: 10, current: 0 } // Boss fights every 5 levels
        };
        
        console.log('GameLoop: Core game loop manager initialized');
    }

    // Main game loop entry point
    startGameLoop() {
        console.log('GameLoop: Starting main game loop');
        this.updateGameState();
        this.enterBoatMenu();
    }

    updateGameState() {
        // Initialize or update game state for the current session
        if (!this.gameState.world.currentLocation) {
            this.gameState.world.currentLocation = 'Starting Port';
        }
        if (!this.gameState.world.timeOfDay) {
            this.gameState.world.timeOfDay = 'Dawn';
        }
        if (!this.gameState.world.weather) {
            this.gameState.world.weather = 'Sunny';
        }
    }

    // Core game phases
    enterBoatMenu() {
        this.currentPhase = 'boat_menu';
        console.log('GameLoop: Entered Boat Menu phase');
        
        // Ensure location properties are synchronized
        const currentLocation = this.gameState.player.currentLocation || this.gameState.world?.currentLocation || 'Starting Port';
        
        // Sync both location properties to avoid mismatches
        if (!this.gameState.world) {
            this.gameState.world = {};
        }
        this.gameState.player.currentLocation = currentLocation;
        this.gameState.world.currentLocation = currentLocation;
        
        console.log('GameLoop: Synchronized location to:', currentLocation);
        
        // Update UI to show boat menu options
        this.scene.events.emit('gameloop:boatMenu', {
            location: currentLocation,
            time: this.gameState.world.timeOfDay || 'Dawn',
            weather: this.gameState.world.weather || 'Sunny',
            energy: this.gameState.player.energy,
            fishtankFull: this.isFishtankFull(),
            canShop: this.isAtStartingPort(),
            availableActions: this.getAvailableActions()
        });
    }

    // Travel system
    initiateTravel(targetMap, targetSpot) {
        if (!this.canTravel()) {
            console.log('GameLoop: Cannot travel - insufficient energy or other constraints');
            return false;
        }

        this.currentPhase = 'traveling';
        const newLocation = `${targetMap} ${targetSpot}`;
        console.log(`GameLoop: Traveling to ${newLocation}`);
        
        // Consume resources
        this.gameState.spendEnergy(2);
        this.gameState.advanceTime(1); // 1 hour
        this.sessionStats.energySpent += 2;
        this.sessionStats.timeAdvanced += 1;
        
        // Update location in both places to ensure synchronization
        if (!this.gameState.world) {
            this.gameState.world = {};
        }
        this.gameState.player.currentLocation = newLocation;
        this.gameState.world.currentLocation = newLocation;
        
        console.log('GameLoop: Location updated to:', newLocation);
        
        // Trigger travel animation/transition
        this.scene.events.emit('gameloop:travel', {
            destination: newLocation,
            energyCost: 2,
            timeCost: 1
        });
        
        // Return to boat menu after travel
        this.scene.time.delayedCall(1000, () => {
            this.enterBoatMenu();
        });
        
        return true;
    }

    // Fishing system integration
    initiateFishing(mode = 'story') {
        if (!this.canFish()) {
            console.log('GameLoop: Cannot fish - insufficient energy or other constraints');
            return false;
        }

        this.currentMode = mode;
        this.currentPhase = 'fishing';
        console.log(`GameLoop: Starting fishing in ${mode} mode`);
        
        // Validate fishing location based on mode
        if (!this.isValidFishingLocation(mode)) {
            console.log('GameLoop: Invalid fishing location for selected mode');
            return false;
        }
        
        // Trigger fishing minigames sequence
        this.startFishingSequence();
        return true;
    }

    startFishingSequence() {
        console.log('GameLoop: Starting fishing sequence - Cast -> Lure -> Reel');
        
        // Phase 1: Cast Minigame
        this.scene.events.emit('gameloop:startCast', {
            mode: this.currentMode,
            location: this.gameState.world.currentLocation,
            playerStats: this.getPlayerFishingStats()
        });
    }

    onCastComplete(success, accuracy) {
        if (!success) {
            console.log('GameLoop: Cast failed - ending fishing attempt');
            this.endFishingAttempt(false);
            return;
        }

        console.log(`GameLoop: Cast successful with ${accuracy}% accuracy`);
        
        // Phase 2: Lure Minigame
        this.scene.events.emit('gameloop:startLure', {
            castAccuracy: accuracy,
            availableFish: this.getAvailableFish(),
            lureStats: this.getEquippedLureStats()
        });
    }

    onLureComplete(success, fishHooked) {
        if (!success) {
            console.log('GameLoop: Lure failed - fish not interested');
            this.endFishingAttempt(false);
            return;
        }

        console.log(`GameLoop: Fish hooked: ${fishHooked.name}`);
        
        // Phase 3: Reel-In Minigame
        this.scene.events.emit('gameloop:startReel', {
            fish: fishHooked,
            playerStats: this.getPlayerFishingStats(),
            rodStats: this.getEquippedRodStats()
        });
    }

    onReelComplete(success, fishCaught) {
        if (!success) {
            console.log('GameLoop: Reel failed - fish escaped');
            this.endFishingAttempt(false);
            return;
        }

        console.log(`GameLoop: Successfully caught ${fishCaught.name}!`);
        this.processFishCatch(fishCaught);
        this.endFishingAttempt(true);
    }

    processFishCatch(fish) {
        // Add fish to inventory/fishtank
        this.gameState.catchFish(fish);
        
        // Update session stats
        this.sessionStats.fishCaught++;
        this.sessionStats.coinsEarned += fish.coinValue || 50;
        this.sessionStats.experienceGained += fish.experienceValue || 10;
        
        // Check for progression milestones
        this.checkProgressionMilestones();
        
        // Trigger rewards and feedback
        this.scene.events.emit('gameloop:fishCaught', {
            fish: fish,
            sessionStats: this.sessionStats,
            progressionUpdate: this.getProgressionStatus()
        });
    }

    endFishingAttempt(success) {
        // Consume resources regardless of success
        this.gameState.spendEnergy(5);
        this.gameState.advanceTime(0.5); // 30 minutes
        this.sessionStats.energySpent += 5;
        this.sessionStats.timeAdvanced += 0.5;
        
        console.log(`GameLoop: Fishing attempt ended - ${success ? 'Success' : 'Failure'}`);
        
        // Check if fishtank is full
        if (this.isFishtankFull()) {
            this.scene.events.emit('gameloop:fishtankFull');
        }
        
        // Return to boat menu
        this.scene.time.delayedCall(2000, () => {
            this.enterBoatMenu();
        });
    }

    // Social system integration
    enterChatroom() {
        this.currentPhase = 'chatroom';
        console.log('GameLoop: Entered Chatroom phase');
        
        this.scene.events.emit('gameloop:chatroom', {
            companions: this.gameState.companions,
            availableInteractions: this.getAvailableInteractions()
        });
    }

    // Shop system integration
    enterShop() {
        if (!this.isAtStartingPort()) {
            console.log('GameLoop: Cannot access shop - not at starting port');
            return false;
        }

        this.currentPhase = 'shop';
        console.log('GameLoop: Entered Shop phase');
        
        this.scene.events.emit('gameloop:shop', {
            playerMoney: this.gameState.player.money,
            shopInventory: this.getShopInventory(),
            dailyRefresh: this.getShopRefreshTime()
        });
        
        return true;
    }

    // Inventory/Crafting system integration
    enterInventory() {
        this.currentPhase = 'inventory';
        console.log('GameLoop: Entered Inventory phase');
        
        this.scene.events.emit('gameloop:inventory', {
            inventory: this.gameState.inventory,
            craftingRecipes: this.getAvailableCraftingRecipes(),
            mergeOptions: this.getAvailableMergeOptions()
        });
    }

    // Progression and win/loss conditions
    checkProgressionMilestones() {
        // Level progression
        const newLevel = this.calculatePlayerLevel();
        if (newLevel > this.objectives.levelProgression.current) {
            this.objectives.levelProgression.current = newLevel;
            this.triggerLevelUp(newLevel);
        }

        // Fish collection
        const uniqueFishCount = this.getUniqueFishCount();
        if (uniqueFishCount > this.objectives.fishCollection.current) {
            this.objectives.fishCollection.current = uniqueFishCount;
            this.triggerCollectionMilestone(uniqueFishCount);
        }

        // Boss fight availability
        if (newLevel % 5 === 0 && newLevel > this.objectives.bossDefeated.current * 5) {
            this.triggerBossFightAvailable(newLevel);
        }

        // Check win conditions
        this.checkWinConditions();
    }

    checkWinConditions() {
        const allObjectivesMet = Object.values(this.objectives).every(
            obj => obj.current >= obj.target
        );

        if (allObjectivesMet) {
            this.triggerGameWin();
        }
    }

    triggerGameWin() {
        console.log('GameLoop: All objectives completed - GAME WON!');
        this.scene.events.emit('gameloop:gameWon', {
            objectives: this.objectives,
            sessionStats: this.sessionStats,
            finalLevel: this.objectives.levelProgression.current
        });
    }

    // Utility methods
    canTravel() {
        return this.gameState.player.energy >= 2 && this.isActive;
    }

    canFish() {
        // Check basic requirements
        const hasEnergy = this.gameState.player.energy >= 5;
        const isGameActive = this.isActive;
        const fishtankNotFull = !this.isFishtankFull();
        
        // Check if location is valid for fishing
        const currentMode = this.currentMode || 'story';
        const validLocation = this.isValidFishingLocation(currentMode);
        
        if (!validLocation) {
            console.log('GameLoop: Cannot fish - invalid location for mode:', currentMode);
            console.log('GameLoop: Current location:', this.gameState.world?.currentLocation || this.gameState.player?.currentLocation);
        }
        
        return hasEnergy && isGameActive && fishtankNotFull && validLocation;
    }

    isFishtankFull() {
        const maxCapacity = this.gameState.getBoatAttribute('fishtankStorage') || 10;
        return this.gameState.inventory.fish.length >= maxCapacity;
    }

    isAtStartingPort() {
        // Check both location properties for robustness
        const worldLocation = this.gameState.world?.currentLocation;
        const playerLocation = this.gameState.player?.currentLocation;
        const currentLocation = worldLocation || playerLocation || 'Starting Port';
        
        return currentLocation === 'Starting Port';
    }

    isValidFishingLocation(mode) {
        const location = this.gameState.world?.currentLocation || this.gameState.player?.currentLocation || 'Starting Port';
        
        // Define fishing areas by mode
        const storyModeAreas = [
            'Coral Cove', 'Deep Abyss', 'Tropical Lagoon', 
            'Arctic Waters', 'Volcanic Depths',
            'Beginner Lake', 'Ocean Harbor', 'Mountain Stream',  // Include beginner areas in story mode
            'Midnight Pond', 'Champion\'s Cove'
        ];
        
        const practiceModeAreas = [
            'Training Lagoon', 'Open Waters', 'Skill Harbor',
            'Beginner Lake', 'Ocean Harbor', 'Mountain Stream'   // Include beginner areas in practice mode
        ];
        
        if (mode === 'story') {
            // Story mode: allow story maps and beginner areas
            return storyModeAreas.some(area => location.startsWith(area));
        } else {
            // Practice mode: allow practice maps and beginner areas
            return practiceModeAreas.some(area => location.startsWith(area));
        }
    }

    getAvailableActions() {
        const actions = ['fish', 'chatroom', 'inventory'];
        
        if (this.canTravel()) {
            actions.push('travel');
        }
        
        if (this.isAtStartingPort()) {
            actions.push('shop');
            if (this.gameState.inventory.fish.length > 0) {
                actions.push('sell_fish');
            }
        }
        
        return actions;
    }

    getPlayerFishingStats() {
        return {
            castAccuracy: this.gameState.getPlayerAttribute('castAccuracy'),
            biteRate: this.gameState.getPlayerAttribute('biteRate'),
            rareFishChance: this.gameState.getPlayerAttribute('rareFishChance'),
            qtePrecision: this.gameState.getPlayerAttribute('qtePrecision'),
            lureSuccess: this.gameState.getPlayerAttribute('lureSuccess'),
            lineStrength: this.gameState.getPlayerAttribute('lineStrength'),
            castingRange: this.gameState.getPlayerAttribute('castingRange')
        };
    }

    getEquippedRodStats() {
        const rod = this.gameState.getEquippedItem('rods');
        return rod ? rod.stats : {};
    }

    getEquippedLureStats() {
        const lure = this.gameState.getEquippedItem('lures');
        return lure ? lure.stats : {};
    }

    getAvailableFish() {
        const currentTime = this.gameState.world.timeOfDay;
        const currentWeather = this.gameState.world.weather;
        const playerLevel = this.gameState.player.level;
        
        return gameDataLoader.getFishByTimeAndWeather(currentTime, currentWeather)
            .filter(fish => fish.unlockLevel <= playerLevel);
    }

    getAvailableInteractions() {
        // Return available social interactions
        return ['chat', 'gift', 'task'];
    }

    getShopInventory() {
        // Return current shop inventory
        return {
            rods: gameDataLoader.getAllRods().slice(0, 5),
            lures: gameDataLoader.getAllLures().slice(0, 5),
            boats: gameDataLoader.getAllBoats().slice(0, 3)
        };
    }

    getShopRefreshTime() {
        // Return time until next shop refresh
        return '24:00:00'; // Daily refresh
    }

    getAvailableCraftingRecipes() {
        // Return available crafting recipes based on player level
        const playerLevel = this.gameState.player.level;
        return gameDataLoader.getAllRods()
            .filter(rod => rod.unlockLevel <= playerLevel)
            .map(rod => ({
                id: rod.id,
                name: rod.name,
                materials: rod.craftingMaterials || [],
                cost: rod.craftingCost || 0,
                time: rod.craftingTime || 0
            }));
    }

    getAvailableMergeOptions() {
        // Return available merge combinations
        const inventory = this.gameState.inventory;
        const mergeOptions = [];
        
        // Check for duplicate items that can be merged
        Object.keys(inventory).forEach(category => {
            if (Array.isArray(inventory[category])) {
                const itemCounts = {};
                inventory[category].forEach(item => {
                    itemCounts[item.id] = (itemCounts[item.id] || 0) + 1;
                });
                
                Object.keys(itemCounts).forEach(itemId => {
                    if (itemCounts[itemId] >= 2) {
                        mergeOptions.push({
                            category,
                            itemId,
                            count: itemCounts[itemId],
                            canMerge: Math.floor(itemCounts[itemId] / 2)
                        });
                    }
                });
            }
        });
        
        return mergeOptions;
    }

    getUnlockedContent(level) {
        // Return content unlocked at this level
        const unlocked = [];
        
        if (level % 5 === 0) {
            unlocked.push(`Boss Fight: ${this.getBossName(level)}`);
        }
        
        if (level % 10 === 0) {
            unlocked.push('New Fishing Location');
        }
        
        return unlocked;
    }

    calculatePlayerLevel() {
        const experience = this.gameState.player.experience;
        return Math.floor(experience / 100) + 1; // 100 XP per level
    }

    getUniqueFishCount() {
        return new Set(this.gameState.inventory.fish.map(fish => fish.id)).size;
    }

    getProgressionStatus() {
        return {
            level: this.objectives.levelProgression.current,
            levelProgress: this.objectives.levelProgression.current / this.objectives.levelProgression.target,
            fishCollection: this.objectives.fishCollection.current,
            collectionProgress: this.objectives.fishCollection.current / this.objectives.fishCollection.target,
            nextBossLevel: Math.ceil(this.objectives.levelProgression.current / 5) * 5,
            overallProgress: this.calculateOverallProgress()
        };
    }

    calculateOverallProgress() {
        const totalProgress = Object.values(this.objectives).reduce((sum, obj) => {
            return sum + (obj.current / obj.target);
        }, 0);
        return totalProgress / Object.keys(this.objectives).length;
    }

    // Event handlers for progression
    triggerLevelUp(newLevel) {
        console.log(`GameLoop: Level up! Now level ${newLevel}`);
        this.gameState.player.level = newLevel;
        
        this.scene.events.emit('gameloop:levelUp', {
            newLevel: newLevel,
            rewards: this.getLevelUpRewards(newLevel),
            unlockedContent: this.getUnlockedContent(newLevel)
        });
    }

    triggerCollectionMilestone(fishCount) {
        console.log(`GameLoop: Collection milestone! ${fishCount} unique fish`);
        
        this.scene.events.emit('gameloop:collectionMilestone', {
            fishCount: fishCount,
            rewards: this.getCollectionRewards(fishCount)
        });
    }

    triggerBossFightAvailable(level) {
        console.log(`GameLoop: Boss fight available at level ${level}!`);
        
        this.scene.events.emit('gameloop:bossAvailable', {
            bossLevel: level,
            bossName: this.getBossName(level),
            requirements: this.getBossRequirements(level)
        });
    }

    getLevelUpRewards(level) {
        return {
            coins: level * 100,
            energy: 2,
            attributePoints: 1
        };
    }

    getCollectionRewards(fishCount) {
        return {
            coins: fishCount * 50,
            gems: Math.floor(fishCount / 10)
        };
    }

    getBossName(level) {
        const bosses = {
            5: 'Giant Bass',
            10: 'Kraken Jr.',
            15: 'Electric Eel',
            20: 'Hammerhead Shark',
            25: 'Giant Octopus',
            30: 'Megalodon',
            35: 'Sea Dragon',
            40: 'Leviathan',
            45: 'Ancient Turtle',
            50: 'Kraken'
        };
        return bosses[level] || 'Unknown Boss';
    }

    getBossRequirements(level) {
        return {
            minLevel: level,
            requiredGear: Math.floor(level / 10) + 1,
            energyCost: 20
        };
    }

    // Save/Load integration
    saveGameLoop() {
        return {
            currentMode: this.currentMode,
            currentPhase: this.currentPhase,
            sessionStats: this.sessionStats,
            objectives: this.objectives
        };
    }

    loadGameLoop(data) {
        if (data) {
            this.currentMode = data.currentMode || 'story';
            this.currentPhase = data.currentPhase || 'boat_menu';
            this.sessionStats = data.sessionStats || this.sessionStats;
            this.objectives = data.objectives || this.objectives;
        }
    }

    // Update method called each frame
    update() {
        if (!this.isActive) return;
        
        // Update time-based systems
        this.updateTimeBasedSystems();
        
        // Check for automatic state transitions
        this.checkAutomaticTransitions();
    }

    updateTimeBasedSystems() {
        // Weather changes every 2 in-game hours
        if (this.gameState.world.timeOfDay !== this.lastTimeCheck) {
            this.lastTimeCheck = this.gameState.world.timeOfDay;
            this.updateWeatherSystem();
        }
    }

    updateWeatherSystem() {
        const weatherTypes = ['sunny', 'rainy'];
        const currentWeather = this.gameState.world.weather;
        
        // 20% chance to change weather every time period
        if (Math.random() < 0.2) {
            const newWeather = Phaser.Utils.Array.GetRandom(weatherTypes);
            if (newWeather !== currentWeather) {
                this.gameState.world.weather = newWeather;
                this.scene.events.emit('gameloop:weatherChange', {
                    oldWeather: currentWeather,
                    newWeather: newWeather
                });
            }
        }
    }

    checkAutomaticTransitions() {
        // Auto-return to port if fishtank is full
        if (this.isFishtankFull() && !this.isAtStartingPort() && this.currentPhase === 'boat_menu') {
            this.scene.events.emit('gameloop:autoReturnPrompt');
        }
        
        // Energy depletion warnings
        if (this.gameState.player.energy <= 10 && this.gameState.player.energy > 0) {
            this.scene.events.emit('gameloop:lowEnergy');
        }
    }

    // Cleanup
    destroy() {
        this.isActive = false;
        console.log('GameLoop: Game loop manager destroyed');
    }
}

// Export singleton instance
export const gameLoop = new GameLoop(); 