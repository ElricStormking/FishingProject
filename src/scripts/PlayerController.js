import Phaser from 'phaser';
import GameState from './GameState.js';
import { gameDataLoader } from './DataLoader.js';
import { CastingMiniGame, LuringMiniGame } from './FishingMinigames.js';
import { ReelingMiniGame } from './ReelingMiniGame.js';

export default class PlayerController {
    constructor(scene) {
        this.scene = scene;
        this.gameState = GameState.getInstance();
        
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
            console.log('PlayerController: Cast input received, canCast:', this.canCast(), 'isCasting:', this.isCasting, 'isReeling:', this.isReeling);
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
        return this.isActive && !this.isCasting && !this.isReeling;
    }

    canReel() {
        return this.isActive && this.currentLure && !this.isCasting;
    }

    disableCastingInput() {
        // Remove casting input handler to prevent interference during minigames
        this.scene.events.off('input:cast', this.castHandler);
        console.log('PlayerController: Casting input disabled');
    }

    enableCastingInput() {
        // Re-enable casting input handler
        this.scene.events.on('input:cast', this.castHandler);
        console.log('PlayerController: Casting input enabled');
    }

    castLine() {
        if (!this.canCast()) return;
        
        this.isCasting = true;
        console.log('PlayerController: Starting cast minigame...');
        
        // Hide crosshair during minigame
        if (this.scene.crosshair) {
            this.scene.crosshair.setVisible(false);
        }
        
        // Get player fishing stats
        const playerStats = this.getPlayerFishingStats();
        
        // Create and start cast minigame
        this.castMinigame = new CastingMiniGame(this.scene, {});
        this.castMinigame.start(playerStats, this.getWaterArea());
        
        // Listen for cast completion
        this.scene.events.once('fishing:castComplete', (data) => {
            this.onCastComplete(data.success, data.accuracy, data.hitAccurateSection, data.castType);
        });
        
        // Update statistics
        this.gameState.trackCastAttempt();
    }

    getPlayerFishingStats() {
        // Get player attributes and equipment bonuses with safe defaults
        const player = this.gameState.player || {};
        const baseStats = player.attributes || {};
        
        // Get all equipped items and their combined effects
        const equipmentEffects = this.getEquipmentEffects();
        
        return {
            // Casting stats
            castAccuracy: (baseStats.castAccuracy || 5) + equipmentEffects.castAccuracy,
            castDistance: (baseStats.castDistance || 5) + equipmentEffects.castDistance,
            castPower: (baseStats.castPower || 5) + equipmentEffects.castPower,
            
            // Detection and attraction stats
            fishDetection: (baseStats.fishDetection || 5) + equipmentEffects.fishDetection,
            attractionRadius: (baseStats.attractionRadius || 5) + equipmentEffects.attractionRadius,
            biteRate: (baseStats.biteRate || 5) + equipmentEffects.biteRate,
            rareFishChance: (baseStats.rareFishChance || 5) + equipmentEffects.rareFishChance,
            
            // Luring stats
            lureSuccess: (baseStats.lureSuccess || 5) + equipmentEffects.lureSuccess,
            lureControl: (baseStats.lureControl || 5) + equipmentEffects.lureControl,
            lureDurability: (baseStats.lureDurability || 5) + equipmentEffects.lureDurability,
            
            // Reeling stats
            reelSpeed: (baseStats.reelSpeed || 5) + equipmentEffects.reelSpeed,
            lineStrength: (baseStats.lineStrength || 5) + equipmentEffects.lineStrength,
            tensionControl: (baseStats.tensionControl || 5) + equipmentEffects.tensionControl,
            staminaDrain: (baseStats.staminaDrain || 5) + equipmentEffects.staminaDrain,
            
            // QTE stats
            qteWindow: (baseStats.qteWindow || 5) + equipmentEffects.qteWindow,
            qtePrecision: (baseStats.qtePrecision || 5) + equipmentEffects.qtePrecision,
            
            // Special effects
            criticalChance: (baseStats.criticalChance || 0) + equipmentEffects.criticalChance,
            experienceBonus: (baseStats.experienceBonus || 0) + equipmentEffects.experienceBonus,
            durabilityLoss: Math.max(0.1, (baseStats.durabilityLoss || 1) + equipmentEffects.durabilityLoss)
        };
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
                if (item.stats) {
                    // Add item stats to effects
                    Object.entries(item.stats).forEach(([statName, value]) => {
                        if (effects.hasOwnProperty(statName)) {
                            effects[statName] += value;
                        }
                    });
                }
                
                // Process special effects
                if (item.effects) {
                    Object.entries(item.effects).forEach(([effectName, value]) => {
                        if (effects.hasOwnProperty(effectName)) {
                            effects[effectName] += value;
                        }
                    });
                }
                
                // Apply rarity bonuses
                if (item.rarity && item.rarity > 5) {
                    const rarityBonus = (item.rarity - 5) * 0.1; // 10% bonus per rarity level above 5
                    effects.experienceBonus += rarityBonus;
                    effects.criticalChance += rarityBonus;
                }
            });
        });

        console.log('PlayerController: Equipment effects calculated:', effects);
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

    getWaterArea() {
        return {
            x: 0,
            y: this.scene.cameras.main.height * 0.3,
            width: this.scene.cameras.main.width,
            height: this.scene.cameras.main.height * 0.5
        };
    }

    onCastComplete(success, accuracy, hitAccurateSection, castType) {
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
        
        if (success) {
            console.log(`PlayerController: Cast successful! Accuracy: ${accuracy.toFixed(1)}%, Type: ${castType}, Hit accurate section: ${hitAccurateSection}`);
            
            // Proceed to lure phase with information about cast quality
            this.startLurePhase(accuracy, castType, hitAccurateSection);
        } else {
            console.log('PlayerController: Cast failed!');
            this.cleanupCast();
        }
    }

    startLurePhase(castAccuracy, castType, hitAccurateSection) {
        console.log(`PlayerController: Starting lure phase... Cast type: ${castType}`);
        
        // Get available fish based on cast type
        const availableFish = this.getAvailableFish(castType, hitAccurateSection);
        
        // Get equipped lure stats
        const lureStats = this.getLureStats();
        
        // Create and start lure minigame
        this.lureMinigame = new LuringMiniGame(this.scene, {});
        this.lureMinigame.start(castAccuracy, availableFish, lureStats);
        
        // Listen for lure completion
        this.scene.events.once('fishing:lureComplete', (data) => {
            this.onLureComplete(data.success, data.fishHooked, data.finalInterest);
        });
    }

    onLureComplete(success, fishHooked, finalInterest) {
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
        
        console.log(`PlayerController: Fish hooked: ${fishHooked.name} (Interest: ${finalInterest}%)`);
        this.startReelPhase(fishHooked);
    }

    startReelPhase(fish) {
        console.log(`PlayerController: Starting reel phase with ${fish.name}...`);
        
        // Keep crosshair hidden during reel phase
        if (this.scene.crosshair) {
            this.scene.crosshair.setVisible(false);
        }
        
        // Get player and rod stats for reeling
        const playerStats = this.getPlayerFishingStats();
        const rodStats = this.getRodStats();
        
        // Create and start reel minigame
        this.reelMinigame = new ReelingMiniGame(this.scene, {});
        this.reelMinigame.start(fish, playerStats, rodStats);
        
        // Listen for reel completion
        this.scene.events.once('fishing:reelComplete', (data) => {
            this.onReelComplete(data.success, data.reason, data.fish, data.finalStats);
        });
        
        // Show instructions
        this.showReelingInstructions();
    }

    showReelingInstructions() {
        const instructions = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            50,
            'REELING PHASE\nClick to reel in the fish!\nKeep tension in the GREEN ZONE\nDON\'T let tension reach the top or line SNAPS!\nRespond to QTEs quickly!\n\nQTE Controls:\n• SPACEBAR for tapping/timing\n• ARROW KEYS for sequences\n• HOLD SPACEBAR for hold QTEs',
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
            if (instructions) {
                this.scene.tweens.add({
                    targets: instructions,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => instructions.destroy()
                });
            }
        });
        
        // Listen for QTE events to show additional feedback
        this.qteStartHandler = (data) => {
            if (this.scene && this.scene.scene.isActive()) {
                this.showQTEAlert(data.qte);
            }
        };
        
        this.qteCompleteHandler = (data) => {
            if (this.scene && this.scene.scene.isActive()) {
                this.showQTEResult(data.success);
            }
        };
        
        this.scene.events.on('fishing:qteStart', this.qteStartHandler);
        this.scene.events.on('fishing:qteComplete', this.qteCompleteHandler);
    }

    showQTEAlert(qte) {
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
        
        // Animate alert
        this.scene.tweens.add({
            targets: alert,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true,
            repeat: 1,
            ease: 'Power2.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: alert,
                    alpha: 0,
                    duration: 500,
                    delay: 1000,
                    onComplete: () => alert.destroy()
                });
            }
        });
    }

    showQTEResult(success) {
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
        
        // Animate result
        this.scene.tweens.add({
            targets: result,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 800,
            ease: 'Power2.easeOut',
            onComplete: () => result.destroy()
        });
    }

    onReelComplete(success, reason, fish, finalStats) {
        // IMMEDIATELY clean up reeling minigame
        if (this.reelMinigame) {
            this.reelMinigame.destroy();
            this.reelMinigame = null;
        }
        
        if (success) {
            console.log(`PlayerController: Successfully caught ${fish.name}!`);
            this.onFishCaught(fish);
        } else {
            console.log(`PlayerController: Failed to catch fish - ${reason}`);
            this.onFishingFailed(reason, fish, finalStats);
        }
    }

    onFishCaught(fish) {
        console.log(`PlayerController: Fish caught: ${fish.name}`);
        
        // Process fish catch through GameState (handles inventory, stats, progression)
        this.gameState.catchFish(fish);
        
        // Calculate rewards and bonuses
        const rewards = this.calculateCatchRewards(fish);
        
        // Show success feedback with rewards
        this.showCatchSuccessFeedback(fish, rewards);
        
        // Clean up
        this.cleanupCast();
        
        // Trigger events with detailed data
        this.scene.events.emit('player:fishCaught', { 
            fish: fish,
            rewards: rewards,
            playerStats: this.gameState.player.statistics
        });
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
        
        // RE-ENABLE casting input after fishing sequence ends
        this.enableCastingInput();
        
        // Show crosshair again
        if (this.scene.crosshair) {
            this.scene.crosshair.setVisible(true);
        }
        
        // Clean up minigames (should already be cleaned up, but double-check)
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
        
        // Clean up old fishing line and lure if they exist
        if (this.currentLine) {
            this.currentLine.destroy();
            this.currentLine = null;
        }
        
        if (this.currentLure) {
            this.currentLure.destroy();
            this.currentLure = null;
        }
        
        console.log('PlayerController: Cast cleanup complete');
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
        this.scene.events.emit('player:openTackleBox');
        // Could open inventory or equipment screen
    }

    changeRod() {
        console.log('PlayerController: Changing fishing rod...');
        this.scene.events.emit('player:changeRod');
        // Could cycle through available rods
    }

    openInventory() {
        console.log('PlayerController: Opening inventory...');
        this.scene.events.emit('player:openInventory');
        // Could switch to inventory scene or open overlay
    }

    interact() {
        console.log('PlayerController: General interaction');
        // Handle context-sensitive interactions
    }

    // Update method called each frame
    update() {
        // Update any continuous player controller logic
        if (this.isReeling) {
            // Handle reeling input and mechanics
        }
    }

    calculateCatchRewards(fish) {
        // Base rewards from fish data
        const baseCoins = fish.coinValue || 50;
        const baseExperience = fish.experienceValue || 10;
        
        // Apply equipment bonuses
        const equippedItems = this.gameState.inventoryManager?.getEquippedItems() || {};
        let coinMultiplier = 1;
        let experienceMultiplier = 1;
        
        // Rod bonuses
        if (equippedItems.rod && equippedItems.rod[0]) {
            const rod = equippedItems.rod[0];
            coinMultiplier += (rod.stats?.coinBonus || 0) / 100;
            experienceMultiplier += (rod.stats?.experienceBonus || 0) / 100;
        }
        
        // Clothing bonuses
        if (equippedItems.clothing) {
            equippedItems.clothing.forEach(item => {
                if (item.stats?.coinBonus) coinMultiplier += item.stats.coinBonus / 100;
                if (item.stats?.experienceBonus) experienceMultiplier += item.stats.experienceBonus / 100;
            });
        }
        
        // Rarity bonus
        const rarityMultiplier = 1 + (fish.rarity - 1) * 0.2; // 20% bonus per rarity level
        
        const finalCoins = Math.floor(baseCoins * coinMultiplier * rarityMultiplier);
        const finalExperience = Math.floor(baseExperience * experienceMultiplier * rarityMultiplier);
        
        return {
            coins: finalCoins,
            experience: finalExperience,
            coinMultiplier: coinMultiplier,
            experienceMultiplier: experienceMultiplier,
            rarityMultiplier: rarityMultiplier
        };
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
        // Process fishing failure
        console.log(`PlayerController: Fishing failed - ${reason}`);
        
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
    }

    applyFailureConsequences(reason, fish) {
        // Different consequences based on failure reason
        switch (reason) {
            case 'line_break':
                // Lose some durability on rod and lure
                this.damageEquipment('rod', 5);
                this.damageEquipment('lure', 3);
                // Small energy penalty
                this.gameState.spendEnergy(2);
                break;
                
            case 'fish_escape':
                // Lose some lure durability
                this.damageEquipment('lure', 2);
                // Small energy penalty
                this.gameState.spendEnergy(1);
                break;
                
            default:
                // General failure - minimal penalty
                this.gameState.spendEnergy(1);
                break;
        }
        
        // Update failure statistics
        this.gameState.player.statistics.fishingAttempts = (this.gameState.player.statistics.fishingAttempts || 0) + 1;
        this.gameState.player.statistics.fishingFailures = (this.gameState.player.statistics.fishingFailures || 0) + 1;
        
        this.gameState.markDirty();
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
        // Create floating text at player position
        const textObj = this.scene.add.text(this.position.x, this.position.y - 50, text, {
            fontSize: '18px',
            fill: `#${color.toString(16).padStart(6, '0')}`,
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 },
            align: 'center'
        });
        
        textObj.setOrigin(0.5, 0.5);
        textObj.setDepth(1000);
        
        // Animate floating text
        this.scene.tweens.add({
            targets: textObj,
            y: textObj.y - 100,
            alpha: 0,
            duration: duration,
            ease: 'Power2.easeOut',
            onComplete: () => {
                textObj.destroy();
            }
        });
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
} 