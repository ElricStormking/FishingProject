import { EventEmitter } from './EventEmitter.js';

export class EquipmentEnhancer extends EventEmitter {
    constructor(gameState, inventoryManager) {
        super();
        
        console.log('EquipmentEnhancer: Constructor called with:', {
            gameState: !!gameState,
            inventoryManager: !!inventoryManager
        });
        
        this.gameState = gameState;
        this.inventoryManager = inventoryManager;
        
        // Validate dependencies with more detailed error information
        if (!gameState) {
            console.error('EquipmentEnhancer: GameState is required but not provided');
            throw new Error('GameState is required for EquipmentEnhancer');
        }
        
        if (!inventoryManager) {
            console.warn('EquipmentEnhancer: InventoryManager not provided, attempting to get from gameState');
            // Try to get inventory manager from gameState if available
            if (gameState.inventoryManager) {
                this.inventoryManager = gameState.inventoryManager;
                console.log('EquipmentEnhancer: Retrieved InventoryManager from GameState');
            } else {
                console.warn('EquipmentEnhancer: No InventoryManager available anywhere - some features will be limited');
                // Don't throw error, just continue with limited functionality
                this.inventoryManager = null;
            }
        }
        
        // Load enhancement data with error handling
        try {
            console.log('EquipmentEnhancer: Loading enhancement data...');
            this.enhancementData = this.loadEnhancementData();
            this.setData = this.loadSetData();
            this.specializationData = this.loadSpecializationData();
            console.log('EquipmentEnhancer: Enhancement data loaded successfully');
            console.log('EquipmentEnhancer: Initialized with enhancement system');
        } catch (error) {
            console.error('EquipmentEnhancer: Error loading enhancement data:', error);
            // Provide minimal fallback data
            this.enhancementData = { 
                enhancementStones: {}, 
                protectionItems: {}, 
                upgradeCosts: { baseCoin: 100, coinMultiplier: 1.5, baseXP: 50, xpMultiplier: 1.3 }, 
                enhancementRates: {} 
            };
            this.setData = {};
            this.specializationData = { fishSpecializations: {}, locationSpecializations: {}, timeSpecializations: {} };
        }
        
        console.log('EquipmentEnhancer: Constructor completed successfully');
    }

    /**
     * Validate that the enhancer is in a working state
     */
    isOperational() {
        return !!(this.gameState && this.enhancementData && this.setData && this.specializationData);
    }

    /**
     * Get a safe reference to inventory manager with fallbacks
     */
    getInventoryManager() {
        return this.inventoryManager || this.gameState?.inventoryManager || null;
    }

    /**
     * Load enhancement configuration data
     */
    loadEnhancementData() {
        try {
            console.log('EquipmentEnhancer: Loading enhancement stones and rates...');
            
            const data = {
                // Enhancement stones
                enhancementStones: {
                    'basic_stone': { 
                        name: 'Basic Enhancement Stone', 
                        rarity: 1, 
                        successRate: 0.9, 
                        bonusMultiplier: 1.0,
                        description: 'Basic stone for low-level enhancement'
                    },
                    'advanced_stone': { 
                        name: 'Advanced Enhancement Stone', 
                        rarity: 3, 
                        successRate: 0.7, 
                        bonusMultiplier: 1.2,
                        description: 'Advanced stone with higher bonus'
                    },
                    'master_stone': { 
                        name: 'Master Enhancement Stone', 
                        rarity: 5, 
                        successRate: 0.5, 
                        bonusMultiplier: 1.5,
                        description: 'Master stone for maximum enhancement'
                    }
                },
                
                // Protection items
                protectionItems: {
                    'protection_scroll': { 
                        name: 'Protection Scroll', 
                        rarity: 2, 
                        preventBreak: true, 
                        preventDowngrade: false,
                        description: 'Prevents equipment destruction on failure'
                    },
                    'blessed_scroll': { 
                        name: 'Blessed Scroll', 
                        rarity: 4, 
                        preventBreak: true, 
                        preventDowngrade: true,
                        description: 'Prevents all failure penalties'
                    }
                },
                
                // Upgrade costs per level
                upgradeCosts: {
                    baseCoin: 100,
                    coinMultiplier: 1.5,
                    baseXP: 50,
                    xpMultiplier: 1.3
                },
                
                // Enhancement success rates by level
                enhancementRates: {
                    1: 0.95, 2: 0.90, 3: 0.85, 4: 0.80, 5: 0.75,
                    6: 0.70, 7: 0.60, 8: 0.50, 9: 0.40, 10: 0.30
                }
            };
            
            console.log('EquipmentEnhancer: Enhancement data structure created successfully');
            return data;
            
        } catch (error) {
            console.error('EquipmentEnhancer: Error in loadEnhancementData:', error);
            // Return minimal fallback data
            return {
                enhancementStones: {},
                protectionItems: {},
                upgradeCosts: { baseCoin: 100, coinMultiplier: 1.5, baseXP: 50, xpMultiplier: 1.3 },
                enhancementRates: { 1: 0.9, 2: 0.8, 3: 0.7, 4: 0.6, 5: 0.5 }
            };
        }
    }

    /**
     * Load equipment set data
     */
    loadSetData() {
        try {
            console.log('EquipmentEnhancer: Loading equipment set data...');
            
            const data = {
                // Beginner's Set
                'beginners_luck': {
                    name: "Beginner's Luck Set",
                    description: 'Perfect for new anglers learning the ropes',
                    pieces: ['bamboo_rod', 'basic_spinner', 'wooden_boat'],
                    bonuses: {
                        2: { experienceBonus: 10, description: '+10% Experience Gain' },
                        3: { experienceBonus: 20, biteRate: 15, description: '+20% Experience, +15% Bite Rate' }
                    },
                    rarity: 1,
                    element: 'earth'
                },
                
                // Ocean Master Set
                'ocean_master': {
                    name: 'Ocean Master Set',
                    description: 'Specialized equipment for saltwater fishing',
                    pieces: ['titanium_rod', 'saltwater_lure', 'yacht', 'captain_hat', 'sailing_jacket'],
                    bonuses: {
                        2: { saltWaterBonus: 15, description: '+15% Saltwater Fish Catch Rate' },
                        3: { saltWaterBonus: 25, tensionStability: 20, description: '+25% Saltwater Bonus, +20% Tension Stability' },
                        5: { saltWaterBonus: 40, tensionStability: 30, rareFishChance: 25, description: 'Master Ocean Fisher' }
                    },
                    rarity: 4,
                    element: 'water'
                },
                
                // Night Fisher Set
                'night_fisher': {
                    name: 'Night Fisher Set',
                    description: 'Equipment optimized for nocturnal fishing',
                    pieces: ['carbon_rod', 'glow_lure', 'stealth_boat', 'night_vision_goggles'],
                    bonuses: {
                        2: { nightBonus: 20, description: '+20% Night Fishing Effectiveness' },
                        4: { nightBonus: 40, mysticalFishChance: 30, description: 'Master of the Night Waters' }
                    },
                    rarity: 3,
                    element: 'shadow'
                },
                
                // Tournament Champion Set
                'tournament_champion': {
                    name: 'Tournament Champion Set',
                    description: 'Elite equipment for championship fishing',
                    pieces: ['master_titanium_rod', 'tournament_lure', 'champion_boat', 'winner_jacket', 'golden_cap'],
                    bonuses: {
                        2: { allStatsBonus: 10, description: '+10% to All Fishing Stats' },
                        3: { allStatsBonus: 20, perfectCatchChance: 15, description: '+20% All Stats, +15% Perfect Catch' },
                        5: { allStatsBonus: 35, perfectCatchChance: 25, legendaryFishChance: 20, description: 'Ultimate Champion' }
                    },
                    rarity: 5,
                    element: 'divine'
                },
                
                // NEW: Elemental Master Sets
                'flame_angler': {
                    name: 'Flame Angler Set',
                    description: 'Harness the power of fire for aggressive fishing',
                    pieces: ['flame_rod', 'fire_lure', 'heat_resistant_gloves'],
                    bonuses: {
                        2: { tensionDamage: 25, fireElementBonus: 20, description: '+25% Tension Damage, +20% Fire Element Bonus' },
                        3: { tensionDamage: 40, fireElementBonus: 35, criticalChance: 15, description: 'Blazing Fisher' }
                    },
                    rarity: 4,
                    element: 'fire'
                },
                
                'frost_master': {
                    name: 'Frost Master Set',
                    description: 'Control the cold waters with ice magic',
                    pieces: ['ice_rod', 'frost_lure', 'thermal_jacket'],
                    bonuses: {
                        2: { tensionStability: 30, iceElementBonus: 20, description: '+30% Tension Stability, +20% Ice Element Bonus' },
                        3: { tensionStability: 50, iceElementBonus: 35, freezeChance: 20, description: 'Frozen Waters Master' }
                    },
                    rarity: 4,
                    element: 'ice'
                },
                
                'wind_walker': {
                    name: 'Wind Walker Set',
                    description: 'Swift and agile fishing with wind power',
                    pieces: ['wind_rod', 'feather_lure', 'winged_boots'],
                    bonuses: {
                        2: { castingSpeed: 25, windElementBonus: 20, description: '+25% Casting Speed, +20% Wind Element Bonus' },
                        3: { castingSpeed: 40, windElementBonus: 35, doubleHookChance: 15, description: 'Master of the Winds' }
                    },
                    rarity: 4,
                    element: 'wind'
                },
                
                // LEGENDARY SET
                'elemental_sovereign': {
                    name: 'Elemental Sovereign Set',
                    description: 'Ultimate mastery over all elements',
                    pieces: ['sovereign_rod', 'elemental_orb', 'crown_of_elements', 'robes_of_mastery', 'elemental_amulet'],
                    bonuses: {
                        2: { allElementBonus: 15, description: '+15% All Elemental Bonuses' },
                        3: { allElementBonus: 25, weatherImmunity: true, description: '+25% All Elements, Weather Immunity' },
                        5: { allElementBonus: 40, weatherImmunity: true, elementalMastery: true, legendaryFishChance: 30, description: 'Sovereign of All Elements' }
                    },
                    rarity: 6,
                    element: 'all'
                }
            };
            
            console.log('EquipmentEnhancer: Enhanced set data loaded successfully');
            return data;
            
        } catch (error) {
            console.error('EquipmentEnhancer: Error in loadSetData:', error);
            // Return minimal fallback data
            return {};
        }
    }

    /**
     * Load specialization configuration data
     */
    loadSpecializationData() {
        try {
            console.log('EquipmentEnhancer: Loading specialization data...');
            
            const data = {
                // Fish-specific specializations
                fishSpecializations: {
                    'bass_hunter': {
                        name: 'Bass Hunter',
                        description: 'Specialized in catching bass species',
                        targetFish: ['largemouth_bass', 'smallmouth_bass', 'striped_bass'],
                        bonuses: { catchRate: 25, experienceBonus: 15 },
                        unlockLevel: 10,
                        materials: ['bass_essence', 'fishing_expertise']
                    },
                    'deep_sea_master': {
                        name: 'Deep Sea Master',
                        description: 'Expert in deep water fishing',
                        targetFish: ['tuna', 'marlin', 'swordfish'],
                        bonuses: { catchRate: 30, tensionControl: 20, lineStrength: 15 },
                        unlockLevel: 25,
                        materials: ['deep_water_essence', 'oceanic_mastery']
                    },
                    'rare_fish_seeker': {
                        name: 'Rare Fish Seeker',
                        description: 'Increased chance for rare species',
                        targetFish: [], // Applies to all rare fish
                        bonuses: { rareFishChance: 40, luckBonus: 25 },
                        unlockLevel: 30,
                        materials: ['mystical_essence', 'fortune_stone', 'legendary_bait']
                    }
                },
                
                // Location-specific specializations
                locationSpecializations: {
                    'harbor_specialist': {
                        name: 'Harbor Specialist',
                        description: 'Optimized for harbor fishing',
                        targetLocations: ['ocean_harbor'],
                        bonuses: { castAccuracy: 20, biteRate: 15 },
                        unlockLevel: 5,
                        materials: ['harbor_knowledge', 'saltwater_experience']
                    },
                    'mountain_expert': {
                        name: 'Mountain Expert',
                        description: 'Master of mountain stream fishing',
                        targetLocations: ['mountain_stream'],
                        bonuses: { lureControl: 25, currentResistance: 30 },
                        unlockLevel: 15,
                        materials: ['mountain_wisdom', 'stream_mastery']
                    },
                    'champion_preparation': {
                        name: 'Champion Preparation',
                        description: 'Optimized for tournament fishing',
                        targetLocations: ['champions_cove'],
                        bonuses: { overallPerformance: 35, pressureResistance: 25 },
                        unlockLevel: 40,
                        materials: ['champion_spirit', 'tournament_medal', 'mastery_certificate']
                    }
                },
                
                // Time-based specializations
                timeSpecializations: {
                    'dawn_fisher': {
                        name: 'Dawn Fisher',
                        description: 'Specialized in early morning fishing',
                        targetTimes: ['DAWN', 'EARLY_MORNING'],
                        bonuses: { fishActivity: 30, patience: 20 },
                        unlockLevel: 8,
                        materials: ['dawn_essence', 'morning_dew']
                    },
                    'night_hunter': {
                        name: 'Night Hunter',
                        description: 'Master of nocturnal fishing',
                        targetTimes: ['NIGHT', 'LATE_NIGHT'],
                        bonuses: { nightVision: 35, mysticalFishChance: 25 },
                        unlockLevel: 20,
                        materials: ['moonlight_essence', 'night_whispers']
                    }
                },

                // NEW: Advanced Specialization Trees
                advancedSpecializations: {
                    'legendary_angler': {
                        name: 'Legendary Angler',
                        description: 'Ultimate fishing mastery',
                        prerequisites: ['bass_hunter', 'deep_sea_master', 'rare_fish_seeker'],
                        bonuses: { 
                            allFishBonus: 50, 
                            legendaryFishChance: 100,
                            masteryCrown: true 
                        },
                        unlockLevel: 50,
                        materials: ['angler_crown', 'master_certificate', 'legendary_essence'],
                        prestige: true
                    },
                    'elemental_fusion': {
                        name: 'Elemental Fusion Master',
                        description: 'Harness all elemental powers',
                        prerequisites: ['harbor_specialist', 'mountain_expert', 'champion_preparation'],
                        bonuses: { 
                            elementalMastery: 40,
                            weatherResistance: 30,
                            environmentalAdaptation: 35
                        },
                        unlockLevel: 45,
                        materials: ['elemental_core', 'fusion_crystal', 'mastery_stone'],
                        prestige: true
                    }
                },

                // NEW: Prestige Specializations
                prestigeSpecializations: {
                    'transcendent_fisher': {
                        name: 'Transcendent Fisher',
                        description: 'Beyond mortal fishing limits',
                        prerequisites: ['legendary_angler', 'elemental_fusion'],
                        bonuses: {
                            transcendentPower: 100,
                            realityBend: 25,
                            infinitePotential: true
                        },
                        unlockLevel: 100,
                        materials: ['transcendence_orb', 'infinity_essence', 'cosmic_fragment'],
                        prestige: 2 // Second prestige tier
                    }
                }
            };
            
            console.log('EquipmentEnhancer: Specialization data structure created successfully');
            return data;
            
        } catch (error) {
            console.error('EquipmentEnhancer: Error in loadSpecializationData:', error);
            return {
                fishSpecializations: {},
                locationSpecializations: {},
                timeSpecializations: {},
                advancedSpecializations: {},
                prestigeSpecializations: {}
            };
        }
    }

    /**
     * Upgrade equipment level
     * @param {string} category - Equipment category
     * @param {string} itemId - Item ID
     * @param {Array} materials - Required materials
     * @returns {Object} - Upgrade result
     */
    upgradeEquipment(category, itemId, materials = []) {
        try {
            // Validate enhancer is operational
            if (!this.isOperational()) {
                return { success: false, error: 'Equipment Enhancement System not operational' };
            }
            
            const inventoryManager = this.getInventoryManager();
            if (!inventoryManager) {
                return { success: false, error: 'Inventory manager not available' };
            }

            const item = inventoryManager.findItem(category, itemId);
            if (!item) {
                return { success: false, error: 'Item not found' };
            }

            const currentLevel = item.level || 0;
            if (currentLevel >= 10) {
                return { success: false, error: 'Maximum level reached' };
            }

            // Calculate upgrade cost
            const cost = this.calculateUpgradeCost(item, currentLevel);
            
            // Check if player has enough resources
            if (!this.gameState?.player || this.gameState.player.coins < cost.coins) {
                return { success: false, error: `Insufficient coins! Need ${cost.coins}, have ${this.gameState?.player?.coins || 0}` };
            }

            // Check materials
            const materialCheck = this.checkUpgradeMaterials(materials, currentLevel);
            if (!materialCheck.success) {
                return { success: false, error: materialCheck.error };
            }

            // Perform upgrade
            const newLevel = currentLevel + 1;
            const statIncrease = this.calculateStatIncrease(item, newLevel);

            // Deduct costs
            this.gameState.player.coins -= cost.coins;
            this.consumeUpgradeMaterials(materials);

            // Apply upgrade
            item.level = newLevel;
            this.applyStatUpgrade(item, statIncrease);

            this.emit('equipmentUpgraded', { item, newLevel, statIncrease });
            return { 
                success: true, 
                newLevel, 
                statIncrease, 
                cost 
            };
        } catch (error) {
            console.error('EquipmentEnhancer: Error in upgradeEquipment:', error);
            return { success: false, error: 'System error during upgrade' };
        }
    }

    /**
     * Enhance equipment with enhancement stones
     * @param {string} category - Equipment category
     * @param {string} itemId - Item ID
     * @param {string} stoneId - Enhancement stone ID
     * @param {string} protectionId - Protection item ID (optional)
     * @returns {Object} - Enhancement result
     */
    enhanceEquipment(category, itemId, stoneId, protectionId = null) {
        try {
            // Validate enhancer is operational
            if (!this.isOperational()) {
                return { success: false, error: 'Equipment Enhancement System not operational' };
            }
            
            const inventoryManager = this.getInventoryManager();
            if (!inventoryManager) {
                return { success: false, error: 'Inventory manager not available' };
            }

            const item = inventoryManager.findItem(category, itemId);
            if (!item) {
                return { success: false, error: 'Item not found' };
            }

            const stone = this.enhancementData.enhancementStones[stoneId];
            if (!stone) {
                return { success: false, error: 'Invalid enhancement stone' };
            }

            const currentEnhancement = item.enhancement || 0;
            if (currentEnhancement >= 10) {
                return { success: false, error: 'Maximum enhancement reached' };
            }

            // Calculate success rate
            const baseRate = this.enhancementData.enhancementRates[currentEnhancement + 1] || 0.1;
            const stoneRate = stone.successRate;
            const finalRate = Math.min(0.95, baseRate * stoneRate);

            // Check protection
            const protection = protectionId ? this.enhancementData.protectionItems[protectionId] : null;

            // Roll for success
            const success = Math.random() < finalRate;
            const result = {
                success,
                originalEnhancement: currentEnhancement,
                finalRate,
                usedProtection: !!protection
            };

            if (success) {
                // Success - increase enhancement level
                const newEnhancement = currentEnhancement + 1;
                const statBonus = this.calculateEnhancementBonus(item, newEnhancement, stone);
                
                item.enhancement = newEnhancement;
                this.applyEnhancementBonus(item, statBonus);
                
                result.newEnhancement = newEnhancement;
                result.statBonus = statBonus;
                this.emit('equipmentEnhanced', { item, result });
                
            } else {
                // Failure - apply penalties
                if (protection) {
                    if (!protection.preventDowngrade && currentEnhancement > 0) {
                        item.enhancement = Math.max(0, currentEnhancement - 1);
                        result.newEnhancement = item.enhancement;
                        result.penalty = 'downgrade_prevented';
                    } else {
                        result.penalty = 'no_penalty';
                    }
                } else {
                    // No protection - apply full penalty
                    if (currentEnhancement >= 7 && Math.random() < 0.1) {
                        // 10% chance to destroy item at high enhancement
                        inventoryManager.removeItem(category, itemId);
                        result.penalty = 'destroyed';
                    } else if (currentEnhancement > 0) {
                        item.enhancement = Math.max(0, currentEnhancement - 1);
                        result.newEnhancement = item.enhancement;
                        result.penalty = 'downgrade';
                    } else {
                        result.penalty = 'no_change';
                    }
                }
                this.emit('equipmentEnhancementFailed', { item, result });
            }

            // Consume materials
            this.consumeEnhancementMaterials(stoneId, protectionId);
            
            return result;
        } catch (error) {
            console.error('EquipmentEnhancer: Error in enhanceEquipment:', error);
            return { success: false, error: 'System error during enhancement' };
        }
    }

    /**
     * Get active set bonuses for equipped items
     * @returns {Object} - Active set bonuses
     */
    getActiveSetBonuses() {
        const inventoryManager = this.getInventoryManager();
        if (!inventoryManager) {
            console.warn('EquipmentEnhancer: No inventory manager available for set bonuses');
            return { activeSets: {}, setBonuses: {} };
        }
        
        try {
            const equipped = inventoryManager.getEquippedItems();
            const allEquippedItems = [];
            
            // Collect all equipped item IDs
            Object.values(equipped).forEach(categoryItems => {
                categoryItems.forEach(item => allEquippedItems.push(item.id));
            });

            const activeSets = {};
            const setBonuses = {};

            // Check each set
            Object.entries(this.setData).forEach(([setId, setInfo]) => {
                const equippedPieces = setInfo.pieces.filter(pieceId => 
                    allEquippedItems.includes(pieceId)
                );

                if (equippedPieces.length >= 2) {
                    activeSets[setId] = {
                        ...setInfo,
                        equippedPieces: equippedPieces.length,
                        totalPieces: setInfo.pieces.length
                    };

                    // Apply bonuses for equipped pieces
                    Object.entries(setInfo.bonuses).forEach(([requiredPieces, bonus]) => {
                        if (equippedPieces.length >= parseInt(requiredPieces)) {
                            Object.entries(bonus).forEach(([stat, value]) => {
                                if (stat !== 'description') {
                                    setBonuses[stat] = (setBonuses[stat] || 0) + value;
                                }
                            });
                        }
                    });
                }
            });

            return { activeSets, setBonuses };
        } catch (error) {
            console.error('EquipmentEnhancer: Error getting active set bonuses:', error);
            return { activeSets: {}, setBonuses: {} };
        }
    }

    /**
     * Get specialization bonuses for current fishing context
     * @param {Object} context - Fishing context (location, time, weather, targetFish)
     * @returns {Object} - Specialization bonuses
     */
    getSpecializationBonuses(context = {}) {
        const equipped = this.inventoryManager.getEquippedItems();
        const bonuses = {};

        // Check all equipped items for specializations
        Object.values(equipped).forEach(categoryItems => {
            categoryItems.forEach(item => {
                if (item.specializations) {
                    item.specializations.forEach(specId => {
                        const bonus = this.calculateSpecializationBonus(specId, context);
                        if (bonus > 0) {
                            bonuses[specId] = bonus;
                        }
                    });
                }
            });
        });

        return bonuses;
    }

    /**
     * Calculate specialization bonus for given context
     * @param {string} specializationId - Specialization ID
     * @param {Object} context - Fishing context
     * @returns {number} - Bonus percentage
     */
    calculateSpecializationBonus(specializationId, context) {
        // Check fish specializations
        const fishSpec = this.specializationData.fishSpecializations[specializationId];
        if (fishSpec && context.targetFish && fishSpec.targetFish.includes(context.targetFish)) {
            return fishSpec.bonus;
        }

        // Check location specializations
        const locationSpec = this.specializationData.locationSpecializations[specializationId];
        if (locationSpec && context.location && locationSpec.targetLocations.includes(context.location)) {
            return locationSpec.bonus;
        }

        // Check time specializations
        const timeSpec = this.specializationData.timeSpecializations[specializationId];
        if (timeSpec) {
            if (context.time && timeSpec.targetTimes && timeSpec.targetTimes.includes(context.time)) {
                return timeSpec.bonus;
            }
            if (context.weather && timeSpec.targetWeather && timeSpec.targetWeather.includes(context.weather)) {
                return timeSpec.bonus;
            }
        }

        return 0;
    }

    /**
     * Apply specialization to equipment
     * @param {string} category - Equipment category
     * @param {string} itemId - Item ID
     * @param {string} specializationId - Specialization to apply
     * @returns {Object} - Application result
     */
    applySpecialization(category, itemId, specializationId) {
        const item = this.inventoryManager.findItem(category, itemId);
        if (!item) {
            return { success: false, error: 'Item not found' };
        }

        // Check if specialization exists
        const allSpecs = {
            ...this.specializationData.fishSpecializations,
            ...this.specializationData.locationSpecializations,
            ...this.specializationData.timeSpecializations
        };

        if (!allSpecs[specializationId]) {
            return { success: false, error: 'Invalid specialization' };
        }

        // Initialize specializations array if it doesn't exist
        if (!item.specializations) {
            item.specializations = [];
        }

        // Check if already has this specialization
        if (item.specializations.includes(specializationId)) {
            return { success: false, error: 'Specialization already applied' };
        }

        // Check maximum specializations (limit to 3)
        if (item.specializations.length >= 3) {
            return { success: false, error: 'Maximum specializations reached' };
        }

        // Apply specialization
        item.specializations.push(specializationId);
        this.gameState.markDirty();
        
        this.emit('specializationApplied', { item, specializationId });
        return { success: true, specializationId };
    }

    /**
     * Calculate upgrade cost
     */
    calculateUpgradeCost(item, currentLevel) {
        const base = this.enhancementData.upgradeCosts;
        const rarity = item.rarity || 1;
        
        return {
            coins: Math.floor(base.baseCoin * Math.pow(base.coinMultiplier, currentLevel) * rarity),
            xp: Math.floor(base.baseXP * Math.pow(base.xpMultiplier, currentLevel) * rarity)
        };
    }

    /**
     * Calculate stat increase for upgrade
     */
    calculateStatIncrease(item, newLevel) {
        const baseStats = item.stats || {};
        const increase = {};
        
        // Each level increases stats by 5-15% based on rarity
        const percentage = 0.05 + (item.rarity || 1) * 0.01;
        
        Object.entries(baseStats).forEach(([stat, value]) => {
            const boost = Math.floor(value * percentage);
            increase[stat] = boost;
        });
        
        return increase;
    }

    /**
     * Apply stat upgrade to item
     */
    applyStatUpgrade(item, statIncrease) {
        if (!item.stats) item.stats = {};
        
        Object.entries(statIncrease).forEach(([stat, increase]) => {
            item.stats[stat] = (item.stats[stat] || 0) + increase;
        });
        
        this.gameState.markDirty();
    }

    /**
     * Calculate enhancement bonus
     */
    calculateEnhancementBonus(item, enhancementLevel, stone) {
        const baseStats = item.stats || {};
        const bonus = {};
        const multiplier = stone.bonusMultiplier * (1 + enhancementLevel * 0.1);
        
        Object.entries(baseStats).forEach(([stat, value]) => {
            bonus[stat] = Math.floor(value * 0.03 * multiplier); // 3% base increase per enhancement
        });
        
        return bonus;
    }

    /**
     * Apply enhancement bonus to item
     */
    applyEnhancementBonus(item, statBonus) {
        if (!item.enhancementBonuses) item.enhancementBonuses = {};
        
        Object.entries(statBonus).forEach(([stat, bonus]) => {
            item.enhancementBonuses[stat] = (item.enhancementBonuses[stat] || 0) + bonus;
        });
        
        this.gameState.markDirty();
    }

    /**
     * Get total equipment stats including all bonuses
     */
    getTotalEquipmentStats() {
        const equipped = this.inventoryManager.getEquippedItems();
        const totalStats = {};

        // Base equipment stats
        Object.values(equipped).forEach(categoryItems => {
            categoryItems.forEach(item => {
                // Base stats
                if (item.stats) {
                    Object.entries(item.stats).forEach(([stat, value]) => {
                        totalStats[stat] = (totalStats[stat] || 0) + value;
                    });
                }
                
                // Enhancement bonuses
                if (item.enhancementBonuses) {
                    Object.entries(item.enhancementBonuses).forEach(([stat, value]) => {
                        totalStats[stat] = (totalStats[stat] || 0) + value;
                    });
                }
            });
        });

        // Set bonuses
        const { setBonuses } = this.getActiveSetBonuses();
        Object.entries(setBonuses).forEach(([stat, value]) => {
            totalStats[stat] = (totalStats[stat] || 0) + value;
        });

        return totalStats;
    }

    /**
     * Helper methods for material consumption
     */
    checkUpgradeMaterials(materials, level) {
        // Implementation depends on your material system
        return { success: true };
    }

    consumeUpgradeMaterials(materials) {
        // Implementation depends on your material system
    }

    consumeEnhancementMaterials(stoneId, protectionId) {
        const inventoryManager = this.getInventoryManager();
        if (!inventoryManager) {
            console.warn('EquipmentEnhancer: Cannot consume materials - inventory manager not available');
            return;
        }
        
        try {
            // Remove enhancement stone and protection item from inventory
            if (stoneId) {
                inventoryManager.removeItem('materials', stoneId, 1);
            }
            if (protectionId) {
                inventoryManager.removeItem('materials', protectionId, 1);
            }
        } catch (error) {
            console.error('EquipmentEnhancer: Error consuming enhancement materials:', error);
        }
    }

    /**
     * NEW: Get elemental bonuses from equipment and sets
     */
    getElementalBonuses() {
        const equipped = this.inventoryManager.getEquippedItems();
        const elementalBonuses = {
            fire: 0,
            water: 0,
            earth: 0,
            wind: 0,
            shadow: 0,
            divine: 0,
            all: 0
        };

        // Equipment elemental bonuses
        Object.values(equipped).forEach(categoryItems => {
            categoryItems.forEach(item => {
                if (item.elementalBonuses) {
                    Object.entries(item.elementalBonuses).forEach(([element, value]) => {
                        elementalBonuses[element] = (elementalBonuses[element] || 0) + value;
                    });
                }
            });
        });

        // Set elemental bonuses
        const { activeSets } = this.getActiveSetBonuses();
        Object.values(activeSets).forEach(setInfo => {
            const setData = this.setData[setInfo.setId];
            if (setData && setData.element) {
                const setElementBonus = this.calculateSetElementalBonus(setData, setInfo.equippedPieces);
                elementalBonuses[setData.element] = (elementalBonuses[setData.element] || 0) + setElementBonus;
            }
        });

        return elementalBonuses;
    }

    /**
     * NEW: Calculate set elemental bonus based on equipped pieces
     */
    calculateSetElementalBonus(setData, equippedPieces) {
        const baseElementalBonus = 10; // Base elemental bonus per set piece
        return baseElementalBonus * equippedPieces * (setData.rarity || 1);
    }

    /**
     * NEW: Get elemental interactions and synergies
     */
    getElementalInteractions(context = {}) {
        const elementalBonuses = this.getElementalBonuses();
        const interactions = {};

        // Elemental synergies
        if (elementalBonuses.fire > 0 && elementalBonuses.water > 0) {
            interactions.steamBonus = Math.min(elementalBonuses.fire, elementalBonuses.water) * 0.5;
        }

        if (elementalBonuses.earth > 0 && elementalBonuses.water > 0) {
            interactions.mudBonus = Math.min(elementalBonuses.earth, elementalBonuses.water) * 0.3;
        }

        if (elementalBonuses.wind > 0 && elementalBonuses.fire > 0) {
            interactions.infernalWindBonus = Math.min(elementalBonuses.wind, elementalBonuses.fire) * 0.4;
        }

        // Weather interactions
        if (context.weather) {
            if (context.weather === 'rainy' && elementalBonuses.water > 0) {
                interactions.weatherSynergy = elementalBonuses.water * 0.2;
            }
            if (context.weather === 'windy' && elementalBonuses.wind > 0) {
                interactions.weatherSynergy = elementalBonuses.wind * 0.2;
            }
            if (context.weather === 'sunny' && elementalBonuses.fire > 0) {
                interactions.weatherSynergy = elementalBonuses.fire * 0.2;
            }
        }

        // Divine mastery
        if (elementalBonuses.divine > 0) {
            interactions.divineBonus = elementalBonuses.divine;
            if (elementalBonuses.divine >= 50) {
                interactions.transcendence = true;
            }
        }

        return interactions;
    }

    /**
     * NEW: Enhanced specialization bonus calculation with level requirements
     */
    getEnhancedSpecializationBonuses(context = {}) {
        const playerLevel = this.gameState?.player?.level || 1;
        const totalBonuses = {};
        const activeSpecializations = [];

        // Fish specializations
        if (context.targetFish && this.specializationData.fishSpecializations) {
            Object.entries(this.specializationData.fishSpecializations).forEach(([specId, specData]) => {
                if (playerLevel >= (specData.unlockLevel || 1) && specData.targetFish.includes(context.targetFish)) {
                    totalBonuses.fishBonus = (totalBonuses.fishBonus || 0) + specData.bonus;
                    activeSpecializations.push(specData.name);
                }
            });
        }

        // Location specializations
        if (context.location && this.specializationData.locationSpecializations) {
            Object.entries(this.specializationData.locationSpecializations).forEach(([specId, specData]) => {
                if (playerLevel >= (specData.unlockLevel || 1) && specData.targetLocations.includes(context.location)) {
                    totalBonuses.locationBonus = (totalBonuses.locationBonus || 0) + specData.bonus;
                    
                    // Weather synergy bonus
                    if (context.weather && specData.weatherBonus && specData.weatherBonus[context.weather]) {
                        totalBonuses.weatherSynergyBonus = (totalBonuses.weatherSynergyBonus || 0) + specData.weatherBonus[context.weather];
                    }
                    
                    activeSpecializations.push(specData.name);
                }
            });
        }

        // Time specializations
        if (context.timeOfDay && this.specializationData.timeSpecializations) {
            Object.entries(this.specializationData.timeSpecializations).forEach(([specId, specData]) => {
                if (playerLevel >= (specData.unlockLevel || 1)) {
                    let timeMatch = false;
                    
                    if (specData.targetTimes && specData.targetTimes.includes(context.timeOfDay)) {
                        timeMatch = true;
                    }
                    if (specData.targetWeather && specData.targetWeather.includes(context.weather)) {
                        timeMatch = true;
                    }
                    
                    if (timeMatch) {
                        totalBonuses.timeBonus = (totalBonuses.timeBonus || 0) + specData.bonus;
                        
                        // Special effects
                        if (specData.immuneToWeatherPenalties && context.weather) {
                            totalBonuses.weatherImmunity = true;
                        }
                        if (specData.perfectCastBonus) {
                            totalBonuses.perfectCastBonus = (totalBonuses.perfectCastBonus || 0) + specData.perfectCastBonus;
                        }
                        
                        activeSpecializations.push(specData.name);
                    }
                }
            });
        }

        // Elemental specializations
        const elementalBonuses = this.getElementalBonuses();
        if (this.specializationData.elementalSpecializations) {
            Object.entries(this.specializationData.elementalSpecializations).forEach(([specId, specData]) => {
                if (playerLevel >= (specData.unlockLevel || 1)) {
                    const elementBonus = elementalBonuses[specData.element] || 0;
                    if (elementBonus > 0) {
                        totalBonuses.elementalBonus = (totalBonuses.elementalBonus || 0) + (specData.bonus * elementBonus / 100);
                        
                        // Apply special effects
                        if (specData.effects) {
                            Object.entries(specData.effects).forEach(([effect, value]) => {
                                totalBonuses[effect] = (totalBonuses[effect] || 0) + value;
                            });
                        }
                        
                        activeSpecializations.push(specData.name);
                    }
                }
            });
        }

        // Mastery specializations
        if (this.specializationData.masterySpecializations) {
            Object.entries(this.specializationData.masterySpecializations).forEach(([specId, specData]) => {
                if (playerLevel >= (specData.unlockLevel || 1) && this.checkMasteryRequirements(specData.requirements)) {
                    if (specData.effects) {
                        Object.entries(specData.effects).forEach(([effect, value]) => {
                            totalBonuses[effect] = (totalBonuses[effect] || 0) + value;
                        });
                    }
                    activeSpecializations.push(specData.name);
                }
            });
        }

        return {
            bonuses: totalBonuses,
            activeSpecializations,
            totalBonus: Object.values(totalBonuses).filter(v => typeof v === 'number').reduce((sum, bonus) => sum + bonus, 0)
        };
    }

    /**
     * NEW: Check mastery requirements
     */
    checkMasteryRequirements(requirements) {
        if (!requirements) return true;

        if (requirements.totalUpgradeLevel) {
            const totalUpgrades = this.getTotalUpgradeLevel();
            if (totalUpgrades < requirements.totalUpgradeLevel) return false;
        }

        if (requirements.completedSets) {
            const { activeSets } = this.getActiveSetBonuses();
            const completedSets = Object.values(activeSets).filter(set => set.equippedPieces === set.totalPieces).length;
            if (completedSets < requirements.completedSets) return false;
        }

        if (requirements.totalEnhancementLevel) {
            const totalEnhancements = this.getTotalEnhancementLevel();
            if (totalEnhancements < requirements.totalEnhancementLevel) return false;
        }

        return true;
    }

    /**
     * NEW: Get total upgrade level across all equipment
     */
    getTotalUpgradeLevel() {
        const equipped = this.inventoryManager.getEquippedItems();
        let total = 0;

        Object.values(equipped).forEach(categoryItems => {
            categoryItems.forEach(item => {
                total += (item.level || 0);
            });
        });

        return total;
    }

    /**
     * NEW: Get total enhancement level across all equipment
     */
    getTotalEnhancementLevel() {
        const equipped = this.inventoryManager.getEquippedItems();
        let total = 0;

        Object.values(equipped).forEach(categoryItems => {
            categoryItems.forEach(item => {
                total += (item.enhancement || 0);
            });
        });

        return total;
    }

    /**
     * NEW: Get comprehensive equipment analysis
     */
    getEquipmentAnalysis(context = {}) {
        const analysis = {
            baseStats: this.getTotalEquipmentStats(),
            elementalBonuses: this.getElementalBonuses(),
            elementalInteractions: this.getElementalInteractions(context),
            specializations: this.getEnhancedSpecializationBonuses(context),
            setBonuses: this.getActiveSetBonuses(),
            totalUpgrades: this.getTotalUpgradeLevel(),
            totalEnhancements: this.getTotalEnhancementLevel(),
            overallPower: 0
        };

        // Calculate overall power score
        analysis.overallPower = this.calculateOverallPower(analysis);

        return analysis;
    }

    /**
     * NEW: Calculate overall equipment power score
     */
    calculateOverallPower(analysis) {
        const baseStats = analysis.baseStats;
        const setBonuses = analysis.setBonuses;
        const elementalBonuses = analysis.elementalBonuses;

        let power = 0;
        Object.values(baseStats).forEach(stat => {
            if (typeof stat === 'number') {
                power += stat;
            }
        });

        // Add set bonus power
        Object.values(setBonuses).forEach(bonus => {
            power += bonus * 2; // Set bonuses count double
        });

        // Add elemental bonus power
        Object.values(elementalBonuses).forEach(bonus => {
            power += bonus * 1.5; // Elemental bonuses count 1.5x
        });

        return Math.floor(power);
    }

    /**
     * NEW: Helper methods for legendary enhancement system
     */
    getLegendaryMaterialRequirements(item) {
        const level = item.legendaryEnhancement?.level || 0;
        return {
            'divine_essence': level + 1,
            'cosmic_fragment': Math.floor((level + 1) / 2),
            'transcendence_orb': level >= 5 ? 1 : 0
        };
    }

    checkLegendaryMaterials(materials, requirements) {
        // Simplified check - in real implementation would check inventory
        return materials.length >= Object.keys(requirements).length;
    }

    consumeLegendaryMaterials(materials) {
        console.log('EquipmentEnhancer: Consuming legendary materials:', materials);
        // In real implementation, remove from inventory
    }

    calculateLegendaryBonuses(item) {
        const level = item.legendaryEnhancement?.level || 0;
        return {
            allStatsBonus: level * 20,
            specialAbilityPower: level * 15,
            transcendentMultiplier: 1 + (level * 0.1)
        };
    }

    applyLegendaryBonuses(item, bonuses) {
        if (!item.legendaryBonuses) {
            item.legendaryBonuses = {};
        }
        
        Object.assign(item.legendaryBonuses, bonuses);
        console.log('EquipmentEnhancer: Applied legendary bonuses:', bonuses);
    }

    /**
     * NEW: Helper methods for combination enhancement system
     */
    validateCombinationItems(items, recipe) {
        if (!items || !recipe) return false;
        
        // Check if all required items are present
        const requiredTypes = recipe.requiredItemTypes || [];
        const providedTypes = items.map(item => item.category);
        
        return requiredTypes.every(type => providedTypes.includes(type));
    }

    checkCombinationMaterials(materials) {
        // Simplified check - in real implementation would check inventory
        console.log('EquipmentEnhancer: Checking combination materials:', materials);
        return true; // For demo purposes
    }

    consumeCombinationMaterials(materials) {
        console.log('EquipmentEnhancer: Consuming combination materials:', materials);
        // In real implementation, remove from inventory
    }

    applyCombinationEffect(items, recipe) {
        console.log('EquipmentEnhancer: Applying combination effect:', recipe.name);
        
        // Apply the combination effect to all items
        items.forEach(item => {
            if (!item.combinationBonuses) {
                item.combinationBonuses = {};
            }
            
            Object.assign(item.combinationBonuses, recipe.bonuses);
        });

        return {
            name: recipe.name,
            effect: recipe.effect,
            bonuses: recipe.bonuses,
            affectedItems: items.length
        };
    }

    /**
     * NEW: Helper methods for prestige system
     */
    calculatePrestigeReset(item) {
        // Calculate what gets reset and what gets retained
        return {
            resetLevels: {
                enhancement: Math.floor((item.enhancementLevel || 0) * 0.3), // Keep 30%
                upgrades: Math.floor((item.advancedUpgrades?.totalLevel || 0) * 0.5) // Keep 50%
            },
            retainedBonuses: {
                legendary: true,
                specializations: true,
                milestones: true
            }
        };
    }

    applyPrestigeReset(item, prestigeData) {
        console.log('EquipmentEnhancer: Applying prestige reset:', prestigeData);
        
        // Reset enhancement level (keep 30%)
        if (item.enhancementLevel) {
            item.enhancementLevel = prestigeData.resetLevels.enhancement;
        }
        
        // Reset upgrade levels (keep 50%)
        if (item.advancedUpgrades) {
            const oldTotal = item.advancedUpgrades.totalLevel;
            item.advancedUpgrades.totalLevel = prestigeData.resetLevels.upgrades;
            
            // Proportionally reduce individual path levels
            const retainRatio = prestigeData.resetLevels.upgrades / oldTotal;
            Object.keys(item.advancedUpgrades.paths).forEach(path => {
                item.advancedUpgrades.paths[path] = Math.floor(
                    item.advancedUpgrades.paths[path] * retainRatio
                );
            });
        }
        
        // Mark as prestiged
        if (!item.prestigeHistory) {
            item.prestigeHistory = [];
        }
        item.prestigeHistory.push({
            timestamp: Date.now(),
            oldLevels: {
                enhancement: item.enhancementLevel,
                totalUpgrade: item.advancedUpgrades?.totalLevel || 0
            }
        });
    }

    /**
     * NEW: Get combination recipes available to player
     */
    getAvailableCombinationRecipes() {
        return {
            'synergy_boost': {
                name: 'Synergy Boost',
                description: 'Enhance equipment synergy between items',
                requiredItemTypes: ['rod', 'lure'],
                materials: ['synergy_crystal', 'harmony_essence'],
                bonuses: {
                    synergyBonus: 25,
                    combinedEffectiveness: 20
                },
                effect: 'Enhanced coordination between rod and lure'
            },
            'elemental_fusion': {
                name: 'Elemental Fusion',
                description: 'Fuse elemental powers across equipment',
                requiredItemTypes: ['rod', 'lure', 'boat'],
                materials: ['fusion_core', 'elemental_catalyst', 'harmony_orb'],
                bonuses: {
                    elementalPower: 40,
                    fusionMultiplier: 1.3,
                    crossElementalBonus: 30
                },
                effect: 'All equipment shares elemental powers'
            },
            'master_set_awakening': {
                name: 'Master Set Awakening',
                description: 'Awaken the true power of complete equipment sets',
                requiredItemTypes: ['rod', 'lure', 'boat', 'accessory'],
                materials: ['awakening_stone', 'master_essence', 'divine_catalyst'],
                bonuses: {
                    setAwakening: true,
                    masterBonus: 50,
                    awakenedPower: 100
                },
                effect: 'Unlocks hidden set abilities and transcendent bonuses'
            }
        };
    }

    /**
     * NEW: Get upgrade path progression tree
     */
    getUpgradePathTree(category) {
        const trees = {
            'rod': {
                'power_line': {
                    name: 'Power Line',
                    maxLevel: 25,
                    branches: {
                        5: ['devastating_power'],
                        10: ['earth_shaker'],
                        15: ['reality_breaker'],
                        20: ['omnipotent_force']
                    }
                },
                'precision_line': {
                    name: 'Precision Line',
                    maxLevel: 25,
                    branches: {
                        5: ['eagle_eye'],
                        10: ['perfect_aim'],
                        15: ['temporal_precision'],
                        20: ['divine_accuracy']
                    }
                },
                'master_line': {
                    name: 'Master Line',
                    maxLevel: 30,
                    branches: {
                        10: ['master_techniques'],
                        20: ['legendary_mastery'],
                        30: ['transcendent_expertise']
                    }
                }
            },
            'lure': {
                'attraction_line': {
                    name: 'Attraction Line',
                    maxLevel: 25,
                    branches: {
                        5: ['magnetic_presence'],
                        10: ['hypnotic_aura'],
                        15: ['dimensional_call'],
                        20: ['universal_attraction']
                    }
                },
                'effectiveness_line': {
                    name: 'Effectiveness Line',
                    maxLevel: 25,
                    branches: {
                        5: ['enhanced_durability'],
                        10: ['special_effects'],
                        15: ['reality_manipulation'],
                        20: ['perfect_effectiveness']
                    }
                }
            },
            'boat': {
                'speed_line': {
                    name: 'Speed Line',
                    maxLevel: 20,
                    branches: {
                        5: ['swift_current'],
                        10: ['wind_walker'],
                        15: ['space_folder'],
                        20: ['time_traveler']
                    }
                },
                'storage_line': {
                    name: 'Storage Line',
                    maxLevel: 20,
                    branches: {
                        5: ['expanded_holds'],
                        10: ['dimensional_storage'],
                        15: ['infinite_capacity'],
                        20: ['reality_warehouse']
                    }
                }
            }
        };

        return trees[category] || {};
    }

    /**
     * NEW: Get enhancement milestone rewards
     */
    getEnhancementMilestones() {
        return {
            10: {
                name: 'Novice Enhancer',
                rewards: ['enhancement_efficiency_1', 'basic_protection'],
                bonuses: { enhancementSuccessRate: 5 }
            },
            25: {
                name: 'Skilled Enhancer',
                rewards: ['enhancement_efficiency_2', 'advanced_protection'],
                bonuses: { enhancementSuccessRate: 10, enhancementBonusMultiplier: 1.1 }
            },
            50: {
                name: 'Master Enhancer',
                rewards: ['enhancement_mastery', 'legendary_protection'],
                bonuses: { enhancementSuccessRate: 15, enhancementBonusMultiplier: 1.2 }
            },
            100: {
                name: 'Grandmaster Enhancer',
                rewards: ['transcendent_enhancement', 'divine_protection'],
                bonuses: { enhancementSuccessRate: 25, enhancementBonusMultiplier: 1.5, noFailurePenalty: true }
            },
            200: {
                name: 'Legendary Enhancer',
                rewards: ['reality_enhancement', 'omnipotent_protection'],
                bonuses: { enhancementSuccessRate: 50, enhancementBonusMultiplier: 2.0, guaranteedSuccess: true }
            }
        };
    }

    /**
     * NEW: Calculate total progression score
     */
    calculateProgressionScore() {
        const inventoryManager = this.getInventoryManager();
        if (!inventoryManager) return 0;

        let score = 0;

        // Get all equipped items
        const categories = ['rods', 'lures', 'boats', 'accessories'];
        categories.forEach(category => {
            const items = inventoryManager.getCategory(category) || [];
            items.forEach(item => {
                if (item.equipped) {
                    // Base enhancement score
                    score += (item.enhancementLevel || 0) * 10;
                    
                    // Advanced upgrade score
                    score += (item.advancedUpgrades?.totalLevel || 0) * 5;
                    
                    // Legendary enhancement score
                    score += (item.legendaryEnhancement?.level || 0) * 50;
                    
                    // Prestige score
                    score += (item.prestige?.totalLevels || 0) * 100;
                    
                    // Specialization score
                    const specs = item.unlockedSpecializations || [];
                    score += specs.length * 25;
                }
            });
        });

        return score;
    }

    /**
     * NEW: Get prestige benefits preview
     */
    getPrestigeBenefits(item) {
        const currentPrestige = item.prestige?.level || 0;
        const nextPrestige = currentPrestige + 1;
        
        const currentBonuses = this.calculateTranscendentBonuses(currentPrestige);
        const nextBonuses = this.calculateTranscendentBonuses(nextPrestige);
        
        return {
            current: currentBonuses,
            next: nextBonuses,
            improvements: {
                allStatsMultiplier: nextBonuses.allStatsMultiplier - currentBonuses.allStatsMultiplier,
                experienceMultiplier: nextBonuses.experienceMultiplier - currentBonuses.experienceMultiplier,
                rareFishMultiplier: nextBonuses.rareFishMultiplier - currentBonuses.rareFishMultiplier,
                materialEfficiency: nextBonuses.materialEfficiency - currentBonuses.materialEfficiency
            }
        };
    }
}

export default EquipmentEnhancer; 