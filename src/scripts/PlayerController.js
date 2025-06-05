import Phaser from 'phaser';
import GameState from './GameState.js';
import { gameDataLoader } from './DataLoader.js';
import { CastingMiniGame, LuringMiniGame } from './FishingMinigames.js';
import { ReelingMiniGame } from './ReelingMiniGame.js';

export default class PlayerController {
    constructor(scene) {
        this.scene = scene;
        this.gameState = GameState.getInstance();
        this.enabled = true; // Allow external systems to disable player control
        
        // Initialize audio manager
        this.audioManager = this.gameState.getAudioManager(scene);
        
        // Player state
        this.isActive = true;
        this.isCasting = false;
        this.isReeling = false;
        this.currentLure = null;
        this.currentLine = null;
        
        // Fishing minigames
        this.castMinigame = null;
        this.lureMinigame = null;
        this.reelMinigame = null;
        
        // Interaction zones
        this.interactionZones = new Map();
        
        // Player position (conceptual for first-person view)
        this.position = {
            x: this.scene.cameras.main.width / 2,
            y: this.scene.cameras.main.height - 80
        };
        
        // Setup interaction systems
        this.setupInteractionZones();
        this.setupEventListeners();
        this.setupEquipmentListeners();
        
        console.log('PlayerController initialized for first-person fishing');
    }

    setupInteractionZones() {
        // Define interaction zones for different boat areas
        this.interactionZones.set('tackle_box', {
            x: this.scene.cameras.main.width / 2 - 150,
            y: this.scene.cameras.main.height * 0.87,
            width: 60,
            height: 30,
            action: 'openTackleBox',
            hint: 'Press E to open tackle box'
        });
        
        this.interactionZones.set('rod_holder', {
            x: this.scene.cameras.main.width / 2 + 100,
            y: this.scene.cameras.main.height * 0.88,
            width: 20,
            height: 20,
            action: 'changeRod',
            hint: 'Press E to change fishing rod'
        });
        
        this.interactionZones.set('water_area', {
            x: 0,
            y: 0,
            width: this.scene.cameras.main.width,
            height: this.scene.cameras.main.height * 0.8,
            action: 'castLine',
            hint: 'Click to cast line'
        });
    }

    setupEventListeners() {
        // Store references to event handlers for cleanup
        this.castHandler = (data) => {
            if (data.isDown && this.canCast()) {
                this.castLine();
            }
        };
        
        this.reelHandler = (data) => {
            if (data.isDown && this.canReel()) {
                this.reelLine();
            }
        };
        
        this.inventoryHandler = (data) => {
            if (data.isDown) {
                this.openInventory();
            }
        };
        
        this.confirmHandler = (data) => {
            if (data.isDown) {
                this.interact();
            }
        };
        
        this.mouseHandler = (pointer) => {
            this.handleMouseClick(pointer);
        };
        
        // Listen for input events from InputManager
        this.scene.events.on('input:cast', this.castHandler);
        this.scene.events.on('input:reel', this.reelHandler);
        this.scene.events.on('input:inventory', this.inventoryHandler);
        this.scene.events.on('input:confirm', this.confirmHandler);
        
        // Mouse interactions
        this.scene.input.on('pointerdown', this.mouseHandler);
    }

    setupEquipmentListeners() {
        // Listen for equipment changes from inventory manager
        if (this.gameState.inventoryManager) {
            this.equipmentChangeHandler = (data) => {
                this.onEquipmentChanged();
            };
            
            this.gameState.inventoryManager.on('equipmentChanged', this.equipmentChangeHandler);
            console.log('PlayerController: Equipment change listeners set up');
        }
    }

    canCast() {
        return this.enabled && this.isActive && !this.isCasting && !this.isReeling;
    }

    canReel() {
        return this.enabled && this.isActive && this.currentLure && !this.isCasting;
    }

    disableCastingInput() {
        // Remove casting input handler to prevent interference during minigames
        this.scene.events.off('input:cast', this.castHandler);
        
        // ONLY disable PlayerController's mouse handler, NOT the entire scene input
        // This allows CastingMiniGame to attach its own input listener
        this.scene.input.off('pointerdown', this.mouseHandler);
        
        // Store that we disabled input so we can re-enable it later
        this.inputDisabled = true;
    }

    enableCastingInput() {
        // Only re-enable if we previously disabled it
        if (!this.inputDisabled) {
            return;
        }
        
        // Re-enable casting input handler
        this.scene.events.on('input:cast', this.castHandler);
        
        // Re-enable PlayerController's mouse input
        this.scene.input.on('pointerdown', this.mouseHandler);
        
        // Clear the disabled flag
        this.inputDisabled = false;
    }

    castLine() {
        if (!this.canCast()) return;
        
        try {
            this.isCasting = true;
            console.log('PlayerController: Starting cast minigame...');
            
            // IMMEDIATELY disable casting input to prevent interference
            this.disableCastingInput();
            
            // Play casting preparation sound
            this.audioManager?.playSFX('cast_prepare');
            
            // Hide crosshair during minigame
            if (this.scene.crosshair) {
                this.scene.crosshair.setVisible(false);
            }
            
            // Get player fishing stats
            const playerStats = this.getPlayerFishingStats();
            console.log('PlayerController: Player stats:', playerStats);
            
            // Get water area
            const waterArea = this.getWaterArea();
            console.log('PlayerController: Water area:', waterArea);
            
            // Create and start cast minigame
            this.castMinigame = new CastingMiniGame(this.scene, {});
            this.castMinigame.start(playerStats, waterArea);
            
            // Listen for cast completion (use once to prevent multiple listeners)
            this.scene.events.once('fishing:castComplete', this.onCastComplete.bind(this));
            
            // Update statistics
            this.gameState.trackCastAttempt();
            
            console.log('PlayerController: Cast minigame started successfully');
        } catch (error) {
            console.error('PlayerController: Error starting cast minigame:', error);
            this.isCasting = false;
            
            // Show crosshair again on error
            if (this.scene.crosshair) {
                this.scene.crosshair.setVisible(true);
            }
            
            // Clean up any partially created minigame
            if (this.castMinigame) {
                try {
                    this.castMinigame.destroy();
                } catch (destroyError) {
                    console.error('PlayerController: Error destroying failed minigame:', destroyError);
                }
                this.castMinigame = null;
            }
            
            // Re-enable casting input
            this.enableCastingInput();
        }
    }

    getPlayerFishingStats() {
        // Get player attributes and equipment bonuses with safe defaults
        const player = this.gameState.player || {};
        const baseStats = player.attributes || {};
        
        // Debug logging
        console.log('PlayerController: Debug - player object:', player);
        console.log('PlayerController: Debug - baseStats:', baseStats);
        
        // Get all equipped items and their combined effects
        const equipmentEffects = this.getEquipmentEffects();
        console.log('PlayerController: Debug - equipmentEffects:', equipmentEffects);
        
        // Get Time & Weather effects (Priority 1.4 integration)
        const timeWeatherEffects = this.getTimeWeatherEffects();
        console.log('PlayerController: Debug - timeWeatherEffects:', timeWeatherEffects);
        
        // Helper function to safely add numbers and avoid NaN
        const safeAdd = (...values) => {
            return values.reduce((sum, val) => {
                const num = Number(val) || 0;
                return sum + (isNaN(num) ? 0 : num);
            }, 0);
        };
        
        // Helper function to get safe base value
        const safeBase = (value, defaultValue = 5) => {
            const num = Number(value);
            return isNaN(num) ? defaultValue : num;
        };
        
        // Helper function to get safe effect value (convert multipliers to additive bonuses)
        const safeEffect = (value, isMultiplier = false) => {
            const num = Number(value);
            if (isNaN(num)) return 0;
            if (isMultiplier) {
                // Convert multiplier (like 1.2) to additive bonus (like +0.2 = +20%)
                return (num - 1.0) * 100; // Convert to percentage points
            }
            return num;
        };
        
        const finalStats = {
            // Casting stats
            castAccuracy: safeAdd(
                safeBase(baseStats.castAccuracy, 5),
                equipmentEffects.castAccuracy || 0,
                safeEffect(timeWeatherEffects.castAccuracy, true)
            ),
            castDistance: safeAdd(
                safeBase(baseStats.castDistance, 5),
                equipmentEffects.castDistance || 0,
                safeEffect(timeWeatherEffects.castDistance, true)
            ),
            castPower: safeAdd(
                safeBase(baseStats.castPower, 5),
                equipmentEffects.castPower || 0,
                safeEffect(timeWeatherEffects.castPower, true)
            ),
            
            // Detection and attraction stats
            fishDetection: safeAdd(
                safeBase(baseStats.fishDetection, 5),
                equipmentEffects.fishDetection || 0,
                safeEffect(timeWeatherEffects.fishDetection, true)
            ),
            attractionRadius: safeAdd(
                safeBase(baseStats.attractionRadius, 5),
                equipmentEffects.attractionRadius || 0,
                safeEffect(timeWeatherEffects.attractionRadius, true)
            ),
            biteRate: safeAdd(
                safeBase(baseStats.biteRate, 5),
                equipmentEffects.biteRate || 0,
                safeEffect(timeWeatherEffects.biteRate, true)
            ),
            rareFishChance: safeAdd(
                safeBase(baseStats.rareFishChance, 5),
                equipmentEffects.rareFishChance || 0,
                safeEffect(timeWeatherEffects.rareFishChance, true)
            ),
            
            // Luring stats
            lureSuccess: safeAdd(
                safeBase(baseStats.lureSuccess, 5),
                equipmentEffects.lureSuccess || 0,
                safeEffect(timeWeatherEffects.lureSuccess, true)
            ),
            lureControl: safeAdd(
                safeBase(baseStats.lureControl, 5),
                equipmentEffects.lureControl || 0,
                safeEffect(timeWeatherEffects.lureControl, true)
            ),
            lureDurability: safeAdd(
                safeBase(baseStats.lureDurability, 5),
                equipmentEffects.lureDurability || 0,
                safeEffect(timeWeatherEffects.lureDurability, true)
            ),
            
            // Reeling stats
            reelSpeed: safeAdd(
                safeBase(baseStats.reelSpeed, 5),
                equipmentEffects.reelSpeed || 0,
                safeEffect(timeWeatherEffects.reelSpeed, true)
            ),
            lineStrength: safeAdd(
                safeBase(baseStats.lineStrength, 5),
                equipmentEffects.lineStrength || 0,
                safeEffect(timeWeatherEffects.lineStrength, true)
            ),
            tensionControl: safeAdd(
                safeBase(baseStats.tensionControl, 5),
                equipmentEffects.tensionControl || 0,
                safeEffect(timeWeatherEffects.tensionControl, true)
            ),
            staminaDrain: safeAdd(
                safeBase(baseStats.staminaDrain, 5),
                equipmentEffects.staminaDrain || 0,
                safeEffect(timeWeatherEffects.staminaDrain, true)
            ),
            
            // QTE stats
            qteWindow: safeAdd(
                safeBase(baseStats.qteWindow, 5),
                equipmentEffects.qteWindow || 0,
                safeEffect(timeWeatherEffects.qteWindow, true)
            ),
            qtePrecision: safeAdd(
                safeBase(baseStats.qtePrecision, 5),
                equipmentEffects.qtePrecision || 0,
                safeEffect(timeWeatherEffects.qtePrecision, true)
            ),
            
            // Special effects
            criticalChance: safeAdd(
                safeBase(baseStats.criticalChance, 0),
                equipmentEffects.criticalChance || 0,
                safeEffect(timeWeatherEffects.criticalChance, true)
            ),
            experienceBonus: safeAdd(
                safeBase(baseStats.experienceBonus, 0),
                equipmentEffects.experienceBonus || 0,
                safeEffect(timeWeatherEffects.experienceBonus, true)
            ),
            durabilityLoss: Math.max(0.1, safeAdd(
                safeBase(baseStats.durabilityLoss, 1),
                equipmentEffects.durabilityLoss || 0,
                safeEffect(timeWeatherEffects.durabilityLoss, true)
            )),
            
            // Time & Weather specific effects (keep as-is for special cases)
            fishActivity: timeWeatherEffects.fishActivity || 1.0,
            lineVisibility: timeWeatherEffects.lineVisibility || 1.0,
            playerVisibility: timeWeatherEffects.playerVisibility || 1.0
        };
        
        console.log('PlayerController: Debug - finalStats:', finalStats);
        
        // Check for any NaN values in final stats
        Object.entries(finalStats).forEach(([key, value]) => {
            if (isNaN(value)) {
                console.error(`PlayerController: NaN detected in finalStats.${key}:`, value);
            }
        });
        
        return finalStats;
    }

    getEquipmentEffects() {
        const effects = {
            // Initialize all possible effects to 0
            castAccuracy: 0, castDistance: 0, castPower: 0,
            fishDetection: 0, attractionRadius: 0, biteRate: 0, rareFishChance: 0,
            lureSuccess: 0, lureControl: 0, lureDurability: 0,
            reelSpeed: 0, lineStrength: 0, tensionControl: 0, staminaDrain: 0,
            qteWindow: 0, qtePrecision: 0,
            criticalChance: 0, experienceBonus: 0, durabilityLoss: 0
        };

        // Get equipped items from inventory manager
        if (!this.gameState.inventoryManager) {
            console.warn('PlayerController: InventoryManager not available');
            return effects;
        }

        const equippedItems = this.gameState.inventoryManager.getEquippedItems();

        // Process each category of equipped items
        Object.entries(equippedItems).forEach(([category, items]) => {
            items.forEach(item => {
                // Base equipment stats
                if (item.stats) {
                    Object.entries(item.stats).forEach(([stat, value]) => {
                        if (effects.hasOwnProperty(stat)) {
                            effects[stat] += value;
                        }
                    });
                }

                // Enhancement bonuses (Priority 1.7)
                if (item.enhancementBonuses) {
                    Object.entries(item.enhancementBonuses).forEach(([stat, value]) => {
                        if (effects.hasOwnProperty(stat)) {
                            effects[stat] += value;
                        }
                    });
                }
            });
        });

        // Add Equipment Enhancement system bonuses (Priority 1.7)
        if (this.gameState.equipmentEnhancer) {
            try {
                // Set bonuses
                const { setBonuses } = this.gameState.equipmentEnhancer.getActiveSetBonuses();
                Object.entries(setBonuses).forEach(([stat, value]) => {
                    if (effects.hasOwnProperty(stat)) {
                        effects[stat] += value;
                    }
                });

                // Specialization bonuses (based on current fishing context)
                const fishingContext = {
                    location: this.gameState.currentLocation?.id,
                    time: this.gameState.timeManager?.getCurrentPeriod(),
                    weather: this.gameState.weatherManager?.getCurrentWeather()?.type,
                    targetFish: this.getCurrentTargetFish() // Get currently targeted fish if any
                };

                const specializationBonuses = this.gameState.equipmentEnhancer.getSpecializationBonuses(fishingContext);
                Object.entries(specializationBonuses).forEach(([specId, bonus]) => {
                    // Apply specialization bonus to relevant stats
                    effects.biteRate += bonus;
                    effects.rareFishChance += bonus;
                    effects.experienceBonus += Math.floor(bonus / 2);
                });

                console.log('PlayerController: Applied enhancement bonuses', { setBonuses, specializationBonuses });
            } catch (error) {
                console.error('PlayerController: Error applying enhancement bonuses:', error);
            }
        }

        console.log('PlayerController: Final equipment effects calculated', effects);
        return effects;
    }

    /**
     * Get currently targeted fish for specialization bonuses
     * @returns {string|null} - Target fish ID or null
     */
    getCurrentTargetFish() {
        // This could be enhanced based on current fishing state
        // For now, return null (could be set when player starts fishing)
        return this.targetFish || null;
    }

    /**
     * Set target fish for specialization bonuses
     * @param {string} fishId - Fish ID to target
     */
    setTargetFish(fishId) {
        this.targetFish = fishId;
        console.log(`PlayerController: Target fish set to ${fishId}`);
    }

    getTimeWeatherEffects() {
        let effects = {
            // Base fishing attributes (all start at 1.0 = no change)
            castAccuracy: 1.0,
            castDistance: 1.0,
            biteRate: 1.0,
            biteSpeed: 1.0,
            lureSuccess: 1.0,
            lureControl: 1.0,
            lureMovement: 1.0,
            lineStrength: 1.0,
            reelingPower: 1.0,
            tensionControl: 1.0,
            qtePrecision: 1.0,
            qteWindow: 1.0,
            rareFishChance: 1.0,
            fishDetection: 1.0,
            fishAwareness: 1.0,
            experienceBonus: 1.0,
            visibility: 1.0,
            focusLevel: 1.0,
            reactionTime: 1.0,
            equipmentDurability: 1.0,
            
            // Special effects
            fishActivity: 1.0,
            lineVisibility: 1.0,
            playerVisibility: 1.0
        };
        
        try {
            // Apply time period effects
            if (this.gameState.timeManager) {
                const periodEffects = this.gameState.timeManager.getFishActivityModifiers();
                const currentPeriod = this.gameState.timeManager.getCurrentPeriod();
                
                // Apply period-specific bonuses
                switch (currentPeriod) {
                    case 'DAWN':
                    case 'DUSK':
                        effects.rareFishChance *= 1.2; // +20% rare fish chance
                        effects.fishDetection *= 1.15; // +15% fish detection
                        break;
                    case 'MORNING':
                    case 'EVENING':
                        effects.biteRate *= 1.1; // +10% bite rate
                        effects.fishAwareness *= 0.95; // -5% fish awareness (less cautious)
                        break;
                    case 'MIDDAY':
                        effects.castAccuracy *= 1.1; // +10% cast accuracy (good visibility)
                        effects.visibility *= 1.2; // +20% visibility
                        break;
                    case 'NIGHT':
                    case 'LATE_NIGHT':
                        effects.rareFishChance *= 1.3; // +30% rare fish chance
                        effects.castAccuracy *= 0.8; // -20% cast accuracy (dark)
                        effects.fishAwareness *= 0.9; // -10% fish awareness (fish less cautious at night)
                        effects.visibility *= 0.7; // -30% visibility
                        break;
                }
                
                // Apply base time effects
                if (periodEffects) {
                    effects.biteRate *= (periodEffects.biteRate || 1.0);
                    effects.biteSpeed *= (periodEffects.biteFast || 1.0);
                    effects.rareFishChance *= (periodEffects.rareChance || 1.0);
                }
            }
        } catch (error) {
            console.warn('PlayerController: Error applying time effects:', error);
        }
        
        try {
            // Apply weather effects
            if (this.gameState.weatherManager) {
                const weatherEffects = this.gameState.weatherManager.getLocationWeatherEffects();
                const currentWeather = this.gameState.weatherManager.getCurrentWeather();
                
                if (currentWeather === 'RAINY') {
                    effects.biteRate *= 1.3; // +30% bite rate in rain
                    effects.lureSuccess *= 1.2; // +20% lure success
                    effects.castAccuracy *= 0.95; // -5% cast accuracy
                    effects.fishDetection *= 1.25; // +25% fish detection
                    effects.visibility *= 0.8; // -20% visibility in rain
                    effects.lineStrength *= 0.9; // -10% line strength (wet conditions)
                }
                
                // Apply weather modifier effects
                if (weatherEffects) {
                    effects.biteRate *= (weatherEffects.fishActivity || 1.0);
                    effects.visibility *= (weatherEffects.visibility || 1.0);
                    effects.castAccuracy *= (weatherEffects.castAccuracy || 1.0);
                }
            }
        } catch (error) {
            console.warn('PlayerController: Error applying weather effects:', error);
        }
        
        try {
            // Apply location-specific fishing modifiers
            if (this.gameState.locationManager) {
                const locationModifiers = this.gameState.locationManager.getLocationFishingModifiers();
                
                if (locationModifiers) {
                    effects.biteRate *= (locationModifiers.biteRate || 1.0);
                    effects.lineStrength *= (locationModifiers.lineStrength || 1.0);
                    effects.castDistance *= (locationModifiers.castDistance || 1.0);
                    effects.lureSuccess *= (locationModifiers.lureEffectiveness || 1.0);
                    effects.experienceBonus *= (locationModifiers.experienceBonus || 1.0);
                }
                
                // Apply location-specific special effects
                const currentLocation = this.gameState.locationManager.getCurrentLocation();
                if (currentLocation) {
                    switch (currentLocation.id) {
                        case 'ocean_harbor':
                            effects.castDistance *= 1.2; // Can cast further in ocean
                            effects.fishDetection *= 1.1; // Seagulls help detect fish
                            break;
                        case 'mountain_stream':
                            effects.castDistance *= 0.7; // Limited casting space
                            effects.lureControl *= 1.2; // Better lure control in current
                            effects.rareFishChance *= 1.15; // More rare mountain fish
                            break;
                        case 'midnight_pond':
                            effects.rareFishChance *= 1.4; // Many rare nocturnal fish
                            effects.castAccuracy *= 0.8; // Harder to see in darkness
                            effects.lureSuccess *= 1.3; // Lures glow in mystical water
                            break;
                        case 'champions_cove':
                            effects.experienceBonus *= 2.0; // 100% XP bonus
                            effects.rareFishChance *= 1.5; // Tournament fish
                            effects.equipmentDurability *= 1.2; // Premium facilities
                            break;
                    }
                }
            }
        } catch (error) {
            console.warn('PlayerController: Error applying location effects:', error);
        }
        
        // Ensure all values are valid numbers
        Object.keys(effects).forEach(key => {
            const value = effects[key];
            if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
                console.warn(`PlayerController: Invalid effect value for ${key}:`, value, 'defaulting to 1.0');
                effects[key] = 1.0;
            }
        });
        
        return effects;
    }

    // Enhanced stat getters for specific systems
    getCastingStats() {
        const stats = this.getPlayerFishingStats();
        return {
            accuracy: stats.castAccuracy,
            distance: stats.castDistance,
            power: stats.castPower,
            accurateSectionSize: Math.min(40, 20 + (stats.castAccuracy - 5) * 2), // Larger accurate section with better accuracy
            maxDistance: 300 + (stats.castDistance * 10), // Base 300px + 10px per distance point
            powerMultiplier: 1 + (stats.castPower * 0.1) // 10% power increase per point
        };
    }

    getLureStats() {
        const stats = this.getPlayerFishingStats();
        const equippedLure = this.gameState.inventoryManager?.getEquippedItems()?.lures?.[0];
        
        return {
            // Base lure stats
            biteRate: stats.biteRate,
            lureSuccess: stats.lureSuccess,
            lureDurability: stats.lureDurability,
            lureControl: stats.lureControl,
            
            // Attraction effects
            attractionRadius: 50 + (stats.attractionRadius * 10), // Base 50px + 10px per point
            interestTime: Math.max(3, 8 - (stats.lureSuccess * 0.2)), // Faster fish interest with better lure success
            
            // Lure type specific bonuses
            lureType: equippedLure?.type || 'spinner',
            lureEffectiveness: equippedLure?.stats?.effectiveness || 1,
            
            // Special chances
            rareFishChance: stats.rareFishChance,
            criticalChance: stats.criticalChance
        };
    }

    getRodStats() {
        const stats = this.getPlayerFishingStats();
        const equippedRod = this.gameState.inventoryManager?.getEquippedItems()?.rods?.[0];
        
        return {
            // Reeling stats
            reelSpeed: stats.reelSpeed,
            lineStrength: stats.lineStrength,
            tensionControl: stats.tensionControl,
            
            // Tension management
            maxTension: 80 + (stats.lineStrength * 2), // Higher line strength = more tension tolerance
            tensionSafeZone: {
                min: 0,
                max: Math.min(70, 40 + (stats.tensionControl * 3)) // Better control = larger safe zone
            },
            
            // QTE enhancements
            qteWindow: Math.max(0.5, 2 - (stats.qteWindow * 0.1)), // Longer QTE windows with better stats
            qtePrecision: stats.qtePrecision,
            
            // Rod specific bonuses
            rodPower: equippedRod?.stats?.power || 1,
            rodDurability: equippedRod?.condition || 100,
            
            // Fish stamina effects
            staminaDrainRate: 1 + (stats.staminaDrain * 0.1), // Faster fish exhaustion
            playerStaminaLoss: Math.max(0.5, 1 - (stats.tensionControl * 0.05)) // Less player stamina loss with better control
        };
    }

    getBaitStats() {
        const stats = this.getPlayerFishingStats();
        const equippedBait = this.gameState.inventoryManager?.getEquippedItems()?.bait?.[0];
        
        if (!equippedBait) {
            return {
                attractionBonus: 0,
                rareFishBonus: 0,
                biteRateBonus: 0,
                duration: 0
            };
        }
        
        return {
            attractionBonus: equippedBait.stats?.attraction || 0,
            rareFishBonus: equippedBait.stats?.rareFishChance || 0,
            biteRateBonus: equippedBait.stats?.biteRate || 0,
            duration: equippedBait.stats?.duration || 300, // 5 minutes default
            effectiveness: equippedBait.stats?.effectiveness || 1
        };
    }

    // Apply equipment effects to fishing outcomes
    applyEquipmentEffectsToFishing(baseOutcome) {
        const stats = this.getPlayerFishingStats();
        const modifiedOutcome = { ...baseOutcome };
        
        // Apply critical chance
        if (Math.random() < stats.criticalChance / 100) {
            modifiedOutcome.isCritical = true;
            modifiedOutcome.experienceGain *= 2;
            modifiedOutcome.rareFishChance *= 1.5;
            console.log('PlayerController: Critical fishing success!');
        }
        
        // Apply experience bonus
        modifiedOutcome.experienceGain *= (1 + stats.experienceBonus / 100);
        
        // Apply rare fish chance
        modifiedOutcome.rareFishChance *= (1 + stats.rareFishChance / 100);
        
        // Apply durability effects to equipment
        this.applyDurabilityLoss(stats.durabilityLoss);
        
        return modifiedOutcome;
    }

    applyDurabilityLoss(lossRate) {
        if (!this.gameState.inventoryManager) return;
        
        // Apply durability loss to equipped items
        const equippedItems = this.gameState.inventoryManager.getEquippedItems();
        
        Object.entries(equippedItems).forEach(([category, items]) => {
            items.forEach(item => {
                if (item.condition !== undefined && item.durability) {
                    const loss = Math.random() * lossRate;
                    this.gameState.inventoryManager.damageItem(category, item.id, loss);
                }
            });
        });
    }

    // Event system for equipment changes
    onEquipmentChanged() {
        // Recalculate stats when equipment changes
        const newStats = this.getPlayerFishingStats();
        
        // Emit event for other systems to update
        this.scene.events.emit('player:statsChanged', newStats);
        
        // Update any active minigames with new stats
        if (this.castMinigame && this.castMinigame.isActive) {
            this.castMinigame.updatePlayerStats(newStats);
        }
        
        if (this.lureMinigame && this.lureMinigame.isActive) {
            this.lureMinigame.updatePlayerStats(newStats);
        }
        
        if (this.reelMinigame && this.reelMinigame.isActive) {
            this.reelMinigame.updatePlayerStats(newStats);
        }
        
        console.log('PlayerController: Equipment changed, stats updated:', newStats);
    }

    getAvailableFish(castType, hitAccurateSection) {
        // Get all fish from data loader
        const allFish = gameDataLoader.getAllFish();
        
        if (hitAccurateSection && castType === 'hotspot') {
            // Hotspot cast - higher chance of rare fish
            return allFish.filter(fish => fish.rarity >= 4);
        } else {
            // Normal cast - common fish
            return allFish.filter(fish => fish.rarity <= 6);
        }
    }

    selectFishForCast(castType, spotInfo = null, rarityBonus = 0) {
        const allFish = gameDataLoader.getAllFish();
        if (allFish.length === 0) {
            return { id: 'default_fish', name: 'Default Fish', rarity: 1 };
        }
        
        let availableFish = allFish;
        
        // Filter fish based on cast type and spot
        if (castType === 'spot' && spotInfo) {
            // For fishing spots, try to match spot-specific fish types first
            const spotSpecificFish = allFish.filter(fish => 
                spotInfo.config.fishTypes.some(type => 
                    fish.id.includes(type) || fish.name.toLowerCase().includes(type)
                )
            );
            
            // If we have spot-specific fish, use them, otherwise use all fish
            if (spotSpecificFish.length > 0) {
                availableFish = spotSpecificFish;
                console.log(`PlayerController: Using ${spotSpecificFish.length} spot-specific fish for ${spotInfo.config.name}`);
            }
        } else if (castType === 'hotspot') {
            // Main hotspot prefers rare fish
            const rareFish = allFish.filter(fish => fish.rarity >= 4);
            if (rareFish.length > 0) {
                availableFish = rareFish;
            }
        }
        
        // Apply rarity bonus by potentially upgrading to higher rarity fish
        if (rarityBonus > 0 && Math.random() * 100 < rarityBonus) {
            const higherRarityFish = availableFish.filter(fish => fish.rarity >= 5);
            if (higherRarityFish.length > 0) {
                availableFish = higherRarityFish;
                console.log(`PlayerController: Rarity bonus (+${rarityBonus}%) triggered, using higher rarity fish`);
            }
        }
        
        // Select random fish from available pool
        const selectedFish = Phaser.Utils.Array.GetRandom(availableFish);
        
        console.log(`PlayerController: Selected ${selectedFish.name} (rarity: ${selectedFish.rarity}) from ${availableFish.length} available fish`);
        return selectedFish;
    }

    getWaterArea() {
        return {
            x: 0,
            y: this.scene.cameras.main.height * 0.3,
            width: this.scene.cameras.main.width,
            height: this.scene.cameras.main.height * 0.5
        };
    }

    onCastComplete(data) {
        console.log('PlayerController: Cast completed with data:', data);
        
        // Extract values from data object
        const { success, accuracy, hitAccurateSection, castType } = data;
        
        this.isCasting = false;
        
        // IMMEDIATELY clean up casting minigame to prevent input interference
        if (this.castMinigame) {
            this.castMinigame.destroy();
            this.castMinigame = null;
        }
        
        // DISABLE casting input to prevent spacebar from triggering casting during lure phase
        this.disableCastingInput();
        
        // Keep crosshair hidden during lure phase
        if (this.scene.crosshair) {
            this.scene.crosshair.setVisible(false);
        }
        
        // Handle error case
        if (success === false) {
            console.log('PlayerController: Cast failed with error');
            this.cleanupCast();
            return;
        }
        
        if (success) {
            // Check if cast hit any fishing spots first
            const spotHit = this.scene.checkFishingSpotHit ? 
                this.scene.checkFishingSpotHit(this.scene.lure.x, this.scene.lure.y) : 
                { hit: false };
            
            let finalCastType = castType || 'normal';
            let rarityBonus = 0;
            let spotInfo = null;
            
            if (spotHit.hit) {
                // Hit a fishing spot
                finalCastType = 'spot';
                rarityBonus = spotHit.rarityBonus;
                spotInfo = spotHit.spot;
                console.log(`PlayerController: Hit fishing spot: ${spotInfo.config.name} (+${rarityBonus}% rarity)`);
            } else if (hitAccurateSection) {
                // Hit the main hotspot
                finalCastType = 'hotspot';
                rarityBonus = 30; // Main hotspot bonus
                console.log('PlayerController: Hit main hotspot (+30% rarity)');
            }
            
            console.log(`PlayerController: Cast successful! Accuracy: ${accuracy.toFixed(1)}%, Type: ${finalCastType}, Hit accurate section: ${hitAccurateSection}`);
            
            // Proceed to lure phase with information about cast quality
            this.startLurePhase(accuracy, finalCastType, hitAccurateSection);
        } else {
            console.log('PlayerController: Cast failed!');
            this.cleanupCast();
        }
    }

    startLurePhase(castAccuracy, castType, hitAccurateSection) {
        // Prevent multiple luring minigames from starting
        if (this.lureMinigame && this.lureMinigame.isActive) {
            console.log('PlayerController: Luring minigame already active, ignoring new start request');
            return;
        }
        
        console.log(`PlayerController: Starting lure phase with accuracy ${castAccuracy}%...`);
        
        // Keep crosshair hidden during lure phase
        if (this.scene.crosshair) {
            this.scene.crosshair.setVisible(false);
        }
        
        // Get available fish based on cast type
        const availableFish = this.getAvailableFish(castType, hitAccurateSection);
        
        // Get equipped lure stats
        const lureStats = this.getLureStats();
        
        // Select a fish from available fish for luring
        let selectedFish = null;
        if (availableFish && availableFish.length > 0) {
            // For now, randomly select from available fish
            // In the future, this could be based on cast accuracy, lure type, etc.
            selectedFish = Phaser.Utils.Array.GetRandom(availableFish);
            console.log('PlayerController: Selected fish for luring:', selectedFish.name);
        }
        
        // Create and start lure minigame with options object
        this.lureMinigame = new LuringMiniGame(this.scene, {});
        this.lureMinigame.start({
            castAccuracy: castAccuracy,
            selectedFish: selectedFish,
            availableFish: availableFish,
            lureStats: lureStats,
            castType: castType,
            hitAccurateSection: hitAccurateSection
        });
        
        // Listen for lure completion
        this.scene.events.once('fishing:lureComplete', this.onLureComplete.bind(this));
    }

    onLureComplete(data) {
        console.log('PlayerController: Lure completed with data:', data);
        
        // Extract values from data object
        const { success, fishHooked, finalInterest } = data;
        
        // IMMEDIATELY clean up luring minigame to prevent input interference
        if (this.lureMinigame) {
            this.lureMinigame.destroy();
            this.lureMinigame = null;
        }
        
        if (!success) {
            console.log('PlayerController: Lure phase failed - fish not interested');
            this.cleanupCast();
            return;
        }
        
        // Validate fish data before proceeding
        if (!fishHooked || !fishHooked.name) {
            console.error('PlayerController: Invalid fish data received from luring phase:', fishHooked);
            this.cleanupCast();
            return;
        }
        
        console.log(`PlayerController: Fish hooked: ${fishHooked.name} (Interest: ${finalInterest}%)`);
        this.startReelPhase(fishHooked);
    }

    startReelPhase(fish) {
        // Prevent multiple reeling minigames from starting
        if (this.reelMinigame && this.reelMinigame.isActive) {
            console.log('PlayerController: Reeling minigame already active, ignoring new start request');
            return;
        }
        
        // Validate fish data before starting reel phase
        if (!fish || !fish.name) {
            console.error('PlayerController: Cannot start reel phase - invalid fish data:', fish);
            this.cleanupCast();
            return;
        }
        
        console.log(`PlayerController: Starting reel phase with ${fish.name}...`);
        
        // Keep crosshair hidden during reel phase
        if (this.scene.crosshair) {
            this.scene.crosshair.setVisible(false);
        }
        
        // Get player and rod stats for reeling
        const playerStats = this.getPlayerFishingStats();
        const rodStats = this.getRodStats();
        
        // Create and start reel minigame with correct options format
        this.reelMinigame = new ReelingMiniGame(this.scene, {});
        this.reelMinigame.start({
            selectedFish: fish,
            fishId: fish.id || fish.fishId,
            playerStats: playerStats,
            rodStats: rodStats
        });
        
        // Listen for reel completion
        this.scene.events.once('fishing:reelComplete', this.onReelComplete.bind(this));
        
        // Show instructions
        this.showReelingInstructions();
    }

    showReelingInstructions() {
        const instructions = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            50,
            'REELING PHASE\n🖱️ LEFT CLICK to reel in the fish!\nKeep tension in the GREEN ZONE\nDON\'T let tension reach the top or line SNAPS!\nRespond to QTEs quickly!\n\nQTE Controls:\n• SPACEBAR for tapping/timing\n• ARROW KEYS for sequences\n• HOLD SPACEBAR for hold QTEs\n\n⚠️ If mouse doesn\'t work, check console for debug info',
            {
                fontSize: '16px',
                fill: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 15, y: 10 },
                align: 'center'
            }
        ).setOrigin(0.5, 0).setDepth(2000);
        
        // Auto-hide instructions after 5 seconds (longer for more info)
        this.scene.time.delayedCall(5000, () => {
            if (instructions && !instructions.destroyed) {
                this.scene.tweens.add({
                    targets: instructions,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => {
                        if (instructions && !instructions.destroyed) {
                            instructions.destroy();
                        }
                    }
                });
            }
        });
        
        // Listen for QTE events to show additional feedback
        this.qteStartHandler = (data) => {
            if (this.scene && this.scene.scene && this.scene.scene.isActive()) {
                this.showQTEAlert(data.qte);
            }
        };
        
        this.qteCompleteHandler = (data) => {
            if (this.scene && this.scene.scene && this.scene.scene.isActive()) {
                this.showQTEResult(data.success);
            }
        };
        
        // Store event handlers for cleanup
        this.activeQTEHandlers = {
            qteStart: this.qteStartHandler,
            qteComplete: this.qteCompleteHandler
        };
        
        this.scene.events.on('fishing:qteStart', this.qteStartHandler);
        this.scene.events.on('fishing:qteComplete', this.qteCompleteHandler);
    }

    showQTEAlert(qte) {
        try {
            // Verify scene is still active and valid
            if (!this.scene || !this.scene.add || !this.scene.cameras?.main) {
                console.warn('PlayerController: Scene not available for QTE alert');
                return;
            }
            
            // Create alert text based on QTE type
            let alertText = 'QTE ALERT!';
            let alertColor = '#ffff00';
            
            switch (qte.type) {
                case 'tap':
                    alertText = `TAP SPACEBAR ${qte.requiredTaps} TIMES!`;
                    break;
                case 'hold':
                    alertText = 'HOLD SPACEBAR!';
                    break;
                case 'sequence':
                    alertText = 'FOLLOW THE ARROWS!';
                    break;
                case 'timing':
                    alertText = 'PERFECT TIMING!';
                    break;
            }
            
            const alert = this.scene.add.text(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height * 0.2,
                alertText,
                {
                    fontSize: '24px',
                    fill: alertColor,
                    fontWeight: 'bold',
                    stroke: '#000000',
                    strokeThickness: 3
                }
            ).setOrigin(0.5).setDepth(1999);
            
            // Animate alert with error handling
            if (this.scene.tweens) {
                this.scene.tweens.add({
                    targets: alert,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 200,
                    yoyo: true,
                    repeat: 1,
                    ease: 'Power2.easeOut',
                    onComplete: () => {
                        if (this.scene && this.scene.tweens && alert && !alert.destroyed) {
                            this.scene.tweens.add({
                                targets: alert,
                                alpha: 0,
                                duration: 500,
                                delay: 1000,
                                onComplete: () => {
                                    if (alert && !alert.destroyed) {
                                        alert.destroy();
                                    }
                                }
                            });
                        }
                    }
                });
            } else {
                // Fallback cleanup without animation
                this.scene.time.delayedCall(1500, () => {
                    if (alert && !alert.destroyed) {
                        alert.destroy();
                    }
                });
            }
        } catch (error) {
            console.error('PlayerController: Error in showQTEAlert:', error);
        }
    }

    showQTEResult(success) {
        try {
            // Verify scene is still active and valid
            if (!this.scene || !this.scene.add || !this.scene.cameras?.main) {
                console.warn('PlayerController: Scene not available for QTE result');
                return;
            }
            
            const resultText = success ? 'SUCCESS!' : 'FAILED!';
            const resultColor = success ? '#00ff00' : '#ff0000';
            
            const result = this.scene.add.text(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height * 0.3,
                resultText,
                {
                    fontSize: '32px',
                    fill: resultColor,
                    fontWeight: 'bold',
                    stroke: '#000000',
                    strokeThickness: 4
                }
            ).setOrigin(0.5).setDepth(1999);
            
            // Animate result with error handling
            if (this.scene.tweens) {
                this.scene.tweens.add({
                    targets: result,
                    scaleX: 1.5,
                    scaleY: 1.5,
                    alpha: 0,
                    duration: 800,
                    ease: 'Power2.easeOut',
                    onComplete: () => {
                        if (result && !result.destroyed) {
                            result.destroy();
                        }
                    }
                });
            } else {
                // Fallback cleanup without animation
                this.scene.time.delayedCall(800, () => {
                    if (result && !result.destroyed) {
                        result.destroy();
                    }
                });
            }
        } catch (error) {
            console.error('PlayerController: Error in showQTEResult:', error);
        }
    }

    onReelComplete(data) {
        console.log('PlayerController: Reel completed with data:', data);
        
        // Extract values from data object
        const { success, reason, fish, finalStats } = data;
        
        console.log(`PlayerController: Reel complete - success: ${success}, reason: ${reason}`);
        
        try {
            // IMMEDIATELY clean up reeling minigame
            if (this.reelMinigame) {
                this.reelMinigame.destroy();
                this.reelMinigame = null;
            }
            
            // Clean up QTE event listeners immediately after reel completion
            if (this.activeQTEHandlers && this.scene && this.scene.events) {
                if (this.activeQTEHandlers.qteStart) {
                    this.scene.events.off('fishing:qteStart', this.activeQTEHandlers.qteStart);
                }
                if (this.activeQTEHandlers.qteComplete) {
                    this.scene.events.off('fishing:qteComplete', this.activeQTEHandlers.qteComplete);
                }
                this.activeQTEHandlers = null;
                console.log('PlayerController: QTE handlers cleaned up after reel completion');
            }
            
            if (success) {
                console.log(`PlayerController: Successfully caught fish!`, fish);
                
                // Extract catch result from finalStats if available
                const catchResult = finalStats?.catchResult || null;
                
                // Pass both fish data and catch result to finishFishingSuccess
                this.finishFishingSuccess({
                    fish: fish,
                    catchResult: catchResult
                });
            } else {
                console.log(`PlayerController: Failed to catch fish - ${reason}`);
                this.onFishingFailed(reason, fish, finalStats);
            }
        } catch (error) {
            console.error('PlayerController: Error in onReelComplete:', error);
            
            // Ensure cleanup happens even if there's an error
            try {
                this.cleanupCast();
            } catch (cleanupError) {
                console.error('PlayerController: Error in emergency cleanup:', cleanupError);
            }
        }
    }

    finishFishingSuccess(fish) {
        console.log('PlayerController: Fish caught successfully!', fish);
        
        try {
            // Use the catch result from GameState if available, otherwise use passed fish data
            let catchResult = null;
            let fishData = fish;
            
            // If we have a catch result with fish data, use it
            if (fish && fish.catchResult && fish.catchResult.fish) {
                catchResult = fish.catchResult;
                fishData = catchResult.fish;
            } else if (fish && fish.fish) {
                // If fish is wrapped in another object
                fishData = fish.fish;
            }
            
            // Ensure we have valid fish data
            if (!fishData || !fishData.name) {
                console.error('PlayerController: Invalid fish data for finishFishingSuccess:', fish);
                this.cleanupCast();
                return;
            }
            
            // Award experience points
            const baseXp = this.calculateExperienceReward(fishData);
            
            // Apply time/weather/location experience bonus
            const effects = this.getTimeWeatherEffects();
            const bonusXp = Math.round(baseXp * (effects.experienceBonus - 1.0));
            const totalXp = baseXp + bonusXp;
            
            // Add experience with proper error handling
            try {
                if (this.gameState.playerProgression && this.gameState.playerProgression.addExperience) {
                    this.gameState.playerProgression.addExperience(totalXp, 'fish_caught');
                } else if (this.gameState.addExperience) {
                    this.gameState.addExperience(totalXp, 'fish_caught');
                } else {
                    console.warn('PlayerController: No experience system available');
                }
            } catch (expError) {
                console.error('PlayerController: Error adding experience:', expError);
            }
            
            // Record fish caught in location manager
            try {
                if (this.gameState.locationManager && this.gameState.locationManager.recordFishCaught) {
                    this.gameState.locationManager.recordFishCaught(fishData, totalXp);
                }
            } catch (locationError) {
                console.warn('PlayerController: Error recording fish in location manager:', locationError);
            }
            
            // Fish should already be added to inventory by GameState.catchFish
            // But add a fallback just in case
            if (!catchResult) {
                try {
                    if (this.gameState.inventoryManager && this.gameState.inventoryManager.addItem) {
                        this.gameState.inventoryManager.addItem('fish', fishData);
                    } else if (this.gameState.addItem) {
                        this.gameState.addItem('fish', fishData);
                    }
                } catch (error) {
                    console.error('PlayerController: Error adding fish to inventory:', error);
                }
            }
            
            // Update statistics with proper error handling
            try {
                if (this.gameState.playerProgression && this.gameState.playerProgression.updateStatistics) {
                    this.gameState.playerProgression.updateStatistics('fishCaught', 1);
                }
            } catch (statError) {
                console.warn('PlayerController: Error updating fishCaught statistic:', statError);
            }
            
            // Update fish count statistics
            try {
                // Ensure player.statistics exists
                if (!this.gameState.player) {
                    this.gameState.player = {};
                }
                if (!this.gameState.player.statistics) {
                    this.gameState.player.statistics = {};
                }
                
                // Use fallback methods if the inventory methods don't exist
                let totalFishCount = 0;
                let uniqueFishCount = 0;
                
                if (this.gameState.inventoryManager) {
                    if (this.gameState.inventoryManager.getTotalFishCount) {
                        totalFishCount = this.gameState.inventoryManager.getTotalFishCount();
                    } else if (this.gameState.inventory && this.gameState.inventory.fish) {
                        totalFishCount = this.gameState.inventory.fish.length;
                    }
                    
                    if (this.gameState.inventoryManager.getUniqueFishCount) {
                        uniqueFishCount = this.gameState.inventoryManager.getUniqueFishCount();
                    } else if (this.gameState.inventory && this.gameState.inventory.fish) {
                        uniqueFishCount = new Set(this.gameState.inventory.fish.map(f => f.fishId || f.id)).size;
                    }
                }
                
                if (this.gameState.playerProgression && this.gameState.playerProgression.updateStatistics) {
                    this.gameState.playerProgression.updateStatistics('totalFish', totalFishCount);
                    this.gameState.playerProgression.updateStatistics('speciesCaught', uniqueFishCount);
                }
            } catch (error) {
                console.warn('PlayerController: Error updating fish statistics:', error);
            }
            
            // Check if this is biggest fish of this species
            try {
                if (this.gameState.inventoryManager && this.gameState.inventoryManager.isBiggestFish) {
                    if (this.gameState.inventoryManager.isBiggestFish(fishData)) {
                        if (this.gameState.playerProgression && this.gameState.playerProgression.updateStatistics) {
                            this.gameState.playerProgression.updateStatistics('biggestFish', `${fishData.name} (${fishData.weight || fishData.size || 0}kg)`);
                        }
                    }
                } else if (this.gameState.inventory && this.gameState.inventory.fish) {
                    // Fallback: check if this fish is heavier than any previous fish of same species
                    const sameSpeciesFish = this.gameState.inventory.fish.filter(f => 
                        (f.fishId === fishData.fishId || f.name === fishData.name));
                    const isLargest = sameSpeciesFish.every(f => (fishData.weight || 0) >= (f.weight || 0));
                    
                    if (isLargest && fishData.weight > 0) {
                        if (this.gameState.playerProgression && this.gameState.playerProgression.updateStatistics) {
                            this.gameState.playerProgression.updateStatistics('biggestFish', `${fishData.name} (${fishData.weight}kg)`);
                        }
                    }
                }
            } catch (error) {
                console.warn('PlayerController: Error checking biggest fish:', error);
            }
            
            // Update rarest fish if applicable
            try {
                // Ensure statistics object exists
                if (!this.gameState.player.statistics) {
                    this.gameState.player.statistics = {};
                }
                
                const currentRarest = this.gameState.player.statistics.rarestFish || { rarity: 0 };
                if (fishData.rarity > (currentRarest.rarity || 0)) {
                    if (this.gameState.playerProgression && this.gameState.playerProgression.updateStatistics) {
                        this.gameState.playerProgression.updateStatistics('rarestFish', fishData.name);
                    }
                }
            } catch (error) {
                console.warn('PlayerController: Error updating rarest fish:', error);
            }
            
            // Check achievements
            try {
                if (this.gameState.playerProgression && this.gameState.playerProgression.checkAchievements) {
                    this.gameState.playerProgression.checkAchievements();
                }
            } catch (error) {
                console.warn('PlayerController: Error checking achievements:', error);
            }
            
            // Check for location unlocks
            try {
                if (this.gameState.locationManager && this.gameState.locationManager.checkAndUnlockLocations) {
                    this.gameState.locationManager.checkAndUnlockLocations();
                }
            } catch (error) {
                console.warn('PlayerController: Error checking location unlocks:', error);
            }
            
            // Visual celebration
            this.showFishCaughtCelebration(fishData, catchResult, totalXp, bonusXp);
            
            // Audio feedback
            try {
                if (this.gameState.audioManager && this.gameState.audioManager.playSFX) {
                    this.gameState.audioManager.playSFX('fish_caught');
                } else if (this.audioManager && this.audioManager.playSFX) {
                    this.audioManager.playSFX('fish_caught');
                }
            } catch (error) {
                console.warn('PlayerController: Error playing fish caught audio:', error);
            }
            
            // Reset state
            this.resetFishingState();
            
        } catch (error) {
            console.error('PlayerController: Critical error in finishFishingSuccess:', error);
            // Ensure we always clean up even if errors occur
            this.resetFishingState();
        }
    }
    
    calculateExperienceReward(fish) {
        // Calculate base experience based on fish properties
        const baseExp = (fish.experienceValue || fish.rarity || 1) * 10;
        const rarityBonus = (fish.rarity || 1) * 5;
        const weightBonus = Math.floor((fish.weight || 1) * 2);
        
        return baseExp + rarityBonus + weightBonus;
    }
    
    showFishCaughtCelebration(fish, catchResult, totalXp, bonusXp) {
        // Create celebration message
        let message = `🎣 Caught ${fish.name}!`;
        if (fish.weight) {
            message += `\nWeight: ${fish.weight}kg`;
        }
        message += `\n⭐ +${totalXp} XP`;
        
        if (bonusXp > 0) {
            message += ` (+${bonusXp} bonus)`;
        }
        
        // Add special messages
        if (catchResult) {
            if (catchResult.isFirstCatch) {
                message += '\n🌟 First time catching this species!';
            }
            if (catchResult.isRecord) {
                message += '\n🏆 New personal record!';
            }
            if (catchResult.isPerfectCatch) {
                message += '\n✨ Perfect catch!';
            }
            if (catchResult.rewards) {
                message += `\n💰 +${catchResult.rewards.coins} coins`;
            }
        }
        
        // Show floating text animation
        this.showFloatingText(message, 0x00FF00, 4000);
        
        // Emit success event for UI updates
        this.scene.events.emit('fishing:catchSuccess', {
            fish: fish,
            catchResult: catchResult,
            totalXp: totalXp,
            bonusXp: bonusXp,
            message: message
        });
        
        console.log(`PlayerController: Catch celebration - ${fish.name}, +${totalXp} XP`);
    }
    
    resetFishingState() {
        this.isReeling = false;
        this.selectedFish = null;
        this.targetFish = null;
        this.cleanupCast();
    }

    reelLine() {
        if (!this.canReel()) return;
        
        this.isReeling = true;
        console.log('PlayerController: Reeling in line...');
        
        // Trigger reeling mechanics (to be expanded)
        this.scene.events.emit('player:startReeling');
    }

    reelInLine() {
        if (!this.currentLure) return;
        
        console.log('PlayerController: Auto-reeling line');
        
        // Animate reel-in
        this.scene.tweens.add({
            targets: this.currentLure,
            x: this.position.x,
            y: this.position.y,
            duration: 800,
            ease: 'Power1',
            onUpdate: () => {
                this.updateFishingLine();
            },
            onComplete: () => {
                this.cleanupCast();
            }
        });
    }

    cleanupCast() {
        this.isCasting = false;
        this.isReeling = false;
        
        // Clean up QTE event listeners to prevent errors
        try {
            if (this.activeQTEHandlers && this.scene && this.scene.events) {
                if (this.activeQTEHandlers.qteStart) {
                    this.scene.events.off('fishing:qteStart', this.activeQTEHandlers.qteStart);
                }
                if (this.activeQTEHandlers.qteComplete) {
                    this.scene.events.off('fishing:qteComplete', this.activeQTEHandlers.qteComplete);
                }
                this.activeQTEHandlers = null;
            }
        } catch (error) {
            console.warn('PlayerController: Error cleaning up QTE event listeners:', error);
        }
        
        // RE-ENABLE casting input after fishing sequence ends
        this.enableCastingInput();
        
        // Show crosshair again
        if (this.scene.crosshair) {
            this.scene.crosshair.setVisible(true);
        }
        
        // Clean up minigames (should already be cleaned up, but double-check)
        try {
            if (this.castMinigame) {
                this.castMinigame.destroy();
                this.castMinigame = null;
            }
            
            if (this.lureMinigame) {
                this.lureMinigame.destroy();
                this.lureMinigame = null;
            }
            
            if (this.reelMinigame) {
                this.reelMinigame.destroy();
                this.reelMinigame = null;
            }
        } catch (error) {
            console.warn('PlayerController: Error cleaning up minigames:', error);
        }
        
        // Clean up old fishing line and lure if they exist
        try {
            if (this.currentLine) {
                this.currentLine.destroy();
                this.currentLine = null;
            }
            
            if (this.currentLure) {
                this.currentLure.destroy();
                this.currentLure = null;
            }
        } catch (error) {
            console.warn('PlayerController: Error cleaning up fishing line/lure:', error);
        }

    }

    handleMouseClick(pointer) {
        // Check interaction zones
        for (const [zoneName, zone] of this.interactionZones) {
            if (this.isPointInZone(pointer.x, pointer.y, zone)) {
                this.triggerInteraction(zoneName, zone);
                break;
            }
        }
    }

    isPointInZone(x, y, zone) {
        return x >= zone.x && x <= zone.x + zone.width &&
               y >= zone.y && y <= zone.y + zone.height;
    }

    triggerInteraction(zoneName, zone) {
        console.log(`PlayerController: Interacting with ${zoneName}`);
        
        switch (zone.action) {
            case 'openTackleBox':
                this.openTackleBox();
                break;
            case 'changeRod':
                this.changeRod();
                break;
            default:
                console.log(`Unknown interaction: ${zone.action}`);
        }
    }

    openTackleBox() {
        console.log('PlayerController: Opening tackle box...');
        this.audioManager?.playSFX('button');
        this.scene.events.emit('player:openTackleBox');
        // Could open inventory or equipment screen
    }

    changeRod() {
        console.log('PlayerController: Changing fishing rod...');
        this.audioManager?.playSFX('button');
        this.scene.events.emit('player:changeRod');
        // Could cycle through available rods
    }

    openInventory() {
        console.log('PlayerController: Opening inventory...');
        this.audioManager?.playSFX('button');
        this.scene.events.emit('player:openInventory');
        // Could switch to inventory scene or open overlay
    }

    interact() {
        console.log('PlayerController: General interaction');
        // Handle context-sensitive interactions
    }

    // Update method called each frame
    update() {
        if (!this.enabled) return; // Respect enabled flag
        
        // Update fishing logic and interactions
        this.updateInteractionHints();
    }

    updateInteractionHints() {
        // Update any interaction hints or UI elements
        // This can be expanded later for dynamic interaction feedback
        if (this.isReeling) {
            // Handle reeling input and mechanics
        }
    }

    showCatchSuccessFeedback(fish, rewards) {
        // Create success message with rewards
        const message = `🎣 Caught ${fish.name}!\n💰 +${rewards.coins} coins\n⭐ +${rewards.experience} XP`;
        
        // Show floating text animation
        this.showFloatingText(message, 0x00FF00, 3000);
        
        // Emit success event for UI updates
        this.scene.events.emit('fishing:catchSuccess', {
            fish: fish,
            rewards: rewards,
            message: message
        });
        
        console.log(`PlayerController: Catch success - ${fish.name}, +${rewards.coins} coins, +${rewards.experience} XP`);
    }

    onFishingFailed(reason, fish, finalStats) {
        console.log(`PlayerController: Fishing failed - ${reason}`);
        
        try {
            // Play failure audio based on reason
            switch (reason) {
                case 'line_break':
                    this.audioManager?.playSFX('line_break');
                    break;
                case 'fish_escape':
                    this.audioManager?.playSFX('fish_escape');
                    break;
                default:
                    this.audioManager?.playSFX('fail');
                    break;
            }
            
            // Apply failure consequences
            this.applyFailureConsequences(reason, fish);
            
            // Show failure feedback
            this.showFailureFeedback(reason, fish);
            
            // Clean up
            this.cleanupCast();
            
            // Trigger failure event
            this.scene.events.emit('player:fishingFailed', {
                reason: reason,
                fish: fish,
                finalStats: finalStats
            });
        } catch (error) {
            console.error('PlayerController: Error in onFishingFailed:', error);
            
            // Ensure cleanup happens even if there's an error during failure handling
            try {
                this.cleanupCast();
            } catch (cleanupError) {
                console.error('PlayerController: Error in emergency cleanup during failure:', cleanupError);
            }
            
            // Try to emit failure event even if other things failed
            try {
                if (this.scene && this.scene.events) {
                    this.scene.events.emit('player:fishingFailed', {
                        reason: reason || 'unknown_error',
                        fish: fish,
                        finalStats: finalStats
                    });
                }
            } catch (eventError) {
                console.error('PlayerController: Error emitting failure event:', eventError);
            }
        }
    }

    applyFailureConsequences(reason, fish) {
        try {
            // Different consequences based on failure reason
            switch (reason) {
                case 'line_break':
                    // Lose some durability on rod and lure
                    this.damageEquipment('rod', 5);
                    this.damageEquipment('lure', 3);
                    // Small energy penalty
                    if (this.gameState.spendEnergy) {
                        this.gameState.spendEnergy(2);
                    }
                    break;
                    
                case 'fish_escape':
                    // Lose some lure durability
                    this.damageEquipment('lure', 2);
                    // Small energy penalty
                    if (this.gameState.spendEnergy) {
                        this.gameState.spendEnergy(1);
                    }
                    break;
                    
                default:
                    // General failure - minimal penalty
                    if (this.gameState.spendEnergy) {
                        this.gameState.spendEnergy(1);
                    }
                    break;
            }
            
            // Ensure player.statistics exists before updating
            if (!this.gameState.player) {
                this.gameState.player = {};
            }
            if (!this.gameState.player.statistics) {
                this.gameState.player.statistics = {};
            }
            
            // Update failure statistics
            this.gameState.player.statistics.fishingAttempts = (this.gameState.player.statistics.fishingAttempts || 0) + 1;
            this.gameState.player.statistics.fishingFailures = (this.gameState.player.statistics.fishingFailures || 0) + 1;
            
            if (this.gameState.markDirty) {
                this.gameState.markDirty();
            }
        } catch (error) {
            console.error('PlayerController: Error in applyFailureConsequences:', error);
        }
    }

    damageEquipment(equipmentType, damage) {
        const equippedItems = this.gameState.inventoryManager?.getEquippedItems() || {};
        const items = equippedItems[equipmentType];
        
        if (items && items.length > 0) {
            const item = items[0];
            if (item.durability !== undefined) {
                item.durability = Math.max(0, item.durability - damage);
                console.log(`PlayerController: ${item.name} durability reduced by ${damage} (now ${item.durability})`);
                
                // Emit equipment damage event
                this.scene.events.emit('equipment:damaged', {
                    item: item,
                    damage: damage,
                    equipmentType: equipmentType
                });
            }
        }
    }

    showFailureFeedback(reason, fish) {
        let message = '';
        let color = 0xFF0000;
        
        switch (reason) {
            case 'line_break':
                message = `💥 Line broke!\n${fish ? fish.name + ' escaped!' : 'Fish escaped!'}\n⚠️ Equipment damaged`;
                break;
            case 'fish_escape':
                message = `🐟 ${fish ? fish.name : 'Fish'} escaped!\n💨 Better luck next time`;
                break;
            default:
                message = `❌ Fishing failed\n${reason}`;
                break;
        }
        
        // Show floating text animation
        this.showFloatingText(message, color, 2500);
        
        // Emit failure event for UI updates
        this.scene.events.emit('fishing:catchFailure', {
            reason: reason,
            fish: fish,
            message: message
        });
    }

    showFloatingText(text, color, duration) {
        try {
            // Ensure we have a valid scene and position
            if (!this.scene || !this.scene.add) {
                console.warn('PlayerController: Scene not available for floating text');
                return;
            }
            
            // Use safe position values
            const safeX = this.position?.x || this.scene.cameras.main.width / 2;
            const safeY = (this.position?.y || this.scene.cameras.main.height - 100) - 50;
            
            // Create floating text at safe position
            const textObj = this.scene.add.text(safeX, safeY, text, {
                fontSize: '18px',
                fill: `#${color.toString(16).padStart(6, '0')}`,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: { x: 8, y: 4 },
                align: 'center',
                wordWrap: { width: 300 } // Prevent text from being too wide
            });
            
            textObj.setOrigin(0.5, 0.5);
            textObj.setDepth(1000);
            
            // Animate floating text with error handling
            if (this.scene.tweens) {
                this.scene.tweens.add({
                    targets: textObj,
                    y: safeY - 100,
                    alpha: 0,
                    duration: duration || 2000,
                    ease: 'Power2.easeOut',
                    onComplete: () => {
                        try {
                            if (textObj && !textObj.destroyed) {
                                textObj.destroy();
                            }
                        } catch (destroyError) {
                            console.warn('PlayerController: Error destroying floating text:', destroyError);
                        }
                    }
                });
            } else {
                // Fallback: destroy after delay without animation
                this.scene.time.delayedCall(duration || 2000, () => {
                    try {
                        if (textObj && !textObj.destroyed) {
                            textObj.destroy();
                        }
                    } catch (destroyError) {
                        console.warn('PlayerController: Error destroying floating text (fallback):', destroyError);
                    }
                });
            }
        } catch (error) {
            console.error('PlayerController: Error in showFloatingText:', error);
        }
    }

    // Cleanup when scene ends
    destroy() {
        this.cleanupCast();
        
        // Remove specific event listeners
        this.scene.events.off('input:cast', this.castHandler);
        this.scene.events.off('input:reel', this.reelHandler);
        this.scene.events.off('input:inventory', this.inventoryHandler);
        this.scene.events.off('input:confirm', this.confirmHandler);
        this.scene.input.off('pointerdown', this.mouseHandler);
        
        // Clean up equipment listeners
        if (this.gameState.inventoryManager && this.equipmentChangeHandler) {
            this.gameState.inventoryManager.off('equipmentChanged', this.equipmentChangeHandler);
        }
        
        // Remove QTE event listeners
        if (this.qteStartHandler) {
            this.scene.events.off('fishing:qteStart', this.qteStartHandler);
        }
        if (this.qteCompleteHandler) {
            this.scene.events.off('fishing:qteComplete', this.qteCompleteHandler);
        }
        
        console.log('PlayerController destroyed');
    }

    handleCasting() {
        if (this.scene.input.keyboard.checkDown(this.cursors.space)) {
            if (!this.isCasting && !this.isLuring && !this.isReeling) {
                this.startCasting();
            } else if (this.isCasting && !this.castCompleted && this.castPower >= 0.1) {
                this.completeCasting();
            }
        }
    }
    
    completeCasting() {
        this.isCasting = false;
        this.castCompleted = true;
        
        // Calculate accuracy based on power (between 0.3 and 0.8 is good)
        let accuracy = 1.0;
        if (this.castPower < 0.3) {
            accuracy = this.castPower / 0.3; // Poor accuracy for weak casts
        } else if (this.castPower > 0.8) {
            accuracy = Math.max(0.2, 1.0 - ((this.castPower - 0.8) / 0.2)); // Poor accuracy for overpowered casts
        }
        
        const isPerfect = this.castPower >= 0.5 && this.castPower <= 0.7; // Perfect zone
        
        // Record casting stats in location manager
        if (this.gameState.locationManager) {
            this.gameState.locationManager.recordCastingStats(accuracy, isPerfect);
        }
        
        // Apply time/weather/location effects to casting
        const effects = this.getTimeWeatherEffects();
        accuracy *= effects.castAccuracy || 1.0;
        
        // Clamp accuracy between 0 and 1
        accuracy = Math.max(0, Math.min(1, accuracy));
        
        this.castAccuracy = accuracy;
        
        console.log(`PlayerController: Cast completed - Power: ${this.castPower.toFixed(2)}, Accuracy: ${accuracy.toFixed(2)}, Perfect: ${isPerfect}`);
        
        // Audio feedback
        if (this.gameState.audioManager) {
            this.gameState.audioManager.playSFX('cast');
        }
        
        // Visual feedback
        this.showCastFeedback(accuracy, isPerfect);
        
        // Proceed to luring after short delay
        this.scene.time.delayedCall(1000, () => {
            this.startLuring();
        });
    }

    startReelingMiniGame(selectedFish, castInfo = {}) {
        console.log('PlayerController: Starting reeling minigame with fish:', selectedFish.name);
        
        try {
            // Create reeling minigame configuration
            const reelingConfig = {
                fishData: selectedFish,
                castType: castInfo.castType || 'normal',
                rarityBonus: castInfo.rarityBonus || 0,
                spotInfo: castInfo.spotInfo || null,
                accuracy: castInfo.accuracy || 0,
                difficulty: this.calculateReelingDifficulty(selectedFish, castInfo.castType),
                catchBonus: this.calculateCatchBonus(castInfo.castType, castInfo.rarityBonus)
            };
            
            // Create and start the reeling minigame
            this.reelingMiniGame = new ReelingMiniGame(this.scene, reelingConfig);
            this.reelingMiniGame.start();
            
            // Listen for reeling completion
            this.scene.events.once('fishing:reelingComplete', (result) => {
                this.onReelingComplete(result, castInfo);
            });
            
        } catch (error) {
            console.error('PlayerController: Error starting reeling minigame:', error);
            this.isFishing = false;
        }
    }

    calculateReelingDifficulty(fishData, castType) {
        let baseDifficulty = fishData.rarity || 1;
        
        // Fishing spots provide more active fish (higher difficulty)
        if (castType === 'spot') {
            baseDifficulty += 1;
        } else if (castType === 'hotspot') {
            baseDifficulty += 2;
        }
        
        return Math.max(1, Math.min(10, baseDifficulty));
    }

    calculateCatchBonus(castType, rarityBonus) {
        let bonus = 1.0;
        
        if (castType === 'spot') {
            bonus += 0.2; // 20% bonus for hitting fishing spots
        } else if (castType === 'hotspot') {
            bonus += 0.3; // 30% bonus for hitting main hotspot
        }
        
        // Additional bonus from rarity percentage
        bonus += (rarityBonus / 100) * 0.5;
        
        return bonus;
    }
} 