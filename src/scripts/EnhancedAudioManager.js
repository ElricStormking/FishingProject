/**
 * Enhanced Audio Manager - Advanced audio system for comprehensive game experience
 * Builds on the existing AudioManager with additional features:
 * - Scene-specific audio orchestration
 * - Dynamic audio mixing and layers
 * - Advanced sound effect management
 * - Audio event system integration
 * - Performance optimization
 * - Audio analytics and debugging
 */
export class EnhancedAudioManager {
    constructor(baseAudioManager, gameState, eventSystem) {
        this.baseAudio = baseAudioManager;
        this.gameState = gameState;
        this.eventSystem = eventSystem;
        
        // Enhanced audio features
        this.audioLayers = new Map();
        this.dynamicMixer = new Map();
        this.contextualAudio = new Map();
        this.audioTriggers = new Map();
        this.audioSequences = new Map();
        
        // Advanced settings
        this.enhancedSettings = {
            enableDynamicMixing: true,
            enableContextualAudio: true,
            enableAudioAnalytics: true,
            enableSpatialAudio: false,
            audioQuality: 'high', // low, medium, high
            maxConcurrentSFX: 8,
            fadeTransitionTime: 1500,
            duckingAmount: 0.3, // How much to lower music when SFX plays
            adaptiveVolumeEnabled: true
        };
        
        // Audio analytics
        this.audioAnalytics = {
            totalPlayed: 0,
            musicTime: 0,
            sfxCount: 0,
            sessionStartTime: Date.now(),
            popularSounds: new Map(),
            errorCount: 0
        };
        
        // Context-aware audio definitions
        this.audioContexts = this.initializeAudioContexts();
        
        // Enhanced audio event definitions
        this.audioEvents = this.initializeAudioEvents();
        
        this.initializeEnhancedAudio();
        
        console.log('EnhancedAudioManager: Advanced audio system initialized');
    }

    /**
     * Initialize audio contexts for different game situations
     */
    initializeAudioContexts() {
        return {
            // Fishing contexts
            fishing: {
                calm_water: {
                    music: { track: 'music_fishing', volume: 0.6 },
                    ambient: [
                        { track: 'ambient_water_calm', volume: 0.8 },
                        { track: 'ambient_birds_distant', volume: 0.3 }
                    ],
                    weather: 'clear'
                },
                rough_water: {
                    music: { track: 'music_fishing_intense', volume: 0.8 },
                    ambient: [
                        { track: 'ambient_water_rough', volume: 1.0 },
                        { track: 'ambient_wind_strong', volume: 0.7 }
                    ],
                    weather: 'stormy'
                },
                night_fishing: {
                    music: { track: 'music_fishing_night', volume: 0.5 },
                    ambient: [
                        { track: 'ambient_water_night', volume: 0.6 },
                        { track: 'ambient_insects', volume: 0.4 },
                        { track: 'ambient_owls', volume: 0.2 }
                    ],
                    timeOfDay: 'night'
                }
            },
            
            // Social contexts
            social: {
                romantic_conversation: {
                    music: { track: 'music_romance', volume: 0.4 },
                    ambient: [
                        { track: 'ambient_soft_waves', volume: 0.3 },
                        { track: 'ambient_gentle_breeze', volume: 0.2 }
                    ]
                },
                friendly_chat: {
                    music: { track: 'music_social', volume: 0.5 },
                    ambient: [
                        { track: 'ambient_harbor_activity', volume: 0.4 }
                    ]
                },
                tutorial: {
                    music: { track: 'music_tutorial', volume: 0.6 },
                    ambient: [
                        { track: 'ambient_learning', volume: 0.3 }
                    ]
                }
            },
            
            // Achievement contexts
            achievement: {
                major_milestone: {
                    music: { track: 'music_victory_major', volume: 0.9, fadeIn: true },
                    sfx: ['sfx_fanfare_major', 'sfx_fireworks'],
                    duration: 5000
                },
                minor_achievement: {
                    music: { track: 'music_victory_minor', volume: 0.7, fadeIn: true },
                    sfx: ['sfx_chime_success'],
                    duration: 2000
                },
                first_time: {
                    music: { track: 'music_discovery', volume: 0.8 },
                    sfx: ['sfx_discovery_chime'],
                    duration: 3000
                }
            },
            
            // Shop contexts
            shop: {
                browsing: {
                    music: { track: 'music_shop', volume: 0.5 },
                    ambient: [
                        { track: 'ambient_market', volume: 0.4 }
                    ]
                },
                purchasing: {
                    music: { track: 'music_shop', volume: 0.3 }, // Duck for transaction sounds
                    sfx: ['sfx_coin', 'sfx_purchase_success']
                }
            },
            
            // Inventory/Equipment contexts
            equipment: {
                crafting: {
                    music: { track: 'music_crafting', volume: 0.6 },
                    ambient: [
                        { track: 'ambient_workshop', volume: 0.5 },
                        { track: 'ambient_tools', volume: 0.3 }
                    ]
                },
                upgrading: {
                    music: { track: 'music_enhancement', volume: 0.7 },
                    sfx: ['sfx_hammer', 'sfx_enhancement']
                }
            }
        };
    }

    /**
     * Initialize enhanced audio event system
     */
    initializeAudioEvents() {
        return {
            // Fishing events
            fishing: {
                cast_start: { sfx: 'sfx_cast_prepare', volume: 0.8 },
                cast_complete: { sfx: 'sfx_cast', volume: 1.0 },
                lure_splash: { sfx: 'sfx_splash', volume: 0.9 },
                fish_bite: { sfx: 'sfx_bite', volume: 1.0, urgent: true },
                tension_increase: { sfx: 'sfx_tension', volume: 0.7, loop: true },
                tension_decrease: { sfx: 'sfx_tension_release', volume: 0.6 },
                fish_struggle: { sfx: 'sfx_struggle', volume: 0.8, randomPitch: true },
                reel_success: { sfx: 'sfx_reel_success', volume: 1.0 },
                fish_caught: { 
                    sfx: 'sfx_catch', 
                    volume: 1.0, 
                    followUp: 'sfx_success_chime',
                    musicDuck: true
                },
                fish_escaped: { sfx: 'sfx_escape', volume: 0.9 },
                line_snap: { sfx: 'sfx_line_snap', volume: 1.0, urgent: true }
            },
            
            // UI events
            ui: {
                button_hover: { sfx: 'sfx_button_hover', volume: 0.4 },
                button_click: { sfx: 'sfx_button', volume: 0.6 },
                tab_switch: { sfx: 'sfx_tab_switch', volume: 0.5 },
                inventory_open: { sfx: 'sfx_inventory_open', volume: 0.7 },
                inventory_close: { sfx: 'sfx_inventory_close', volume: 0.6 },
                item_select: { sfx: 'sfx_item_select', volume: 0.5 },
                item_equip: { sfx: 'sfx_equip', volume: 0.8 },
                item_unequip: { sfx: 'sfx_unequip', volume: 0.6 },
                error: { sfx: 'sfx_error', volume: 0.7 },
                notification: { sfx: 'sfx_notification', volume: 0.8 }
            },
            
            // Progression events
            progression: {
                exp_gain: { sfx: 'sfx_exp_gain', volume: 0.7 },
                level_up: { 
                    sfx: 'sfx_levelup', 
                    volume: 1.0, 
                    musicDuck: true,
                    followUp: 'sfx_level_fanfare'
                },
                achievement_unlock: { 
                    sfx: 'sfx_achievement', 
                    volume: 0.9,
                    contextual: true // Use achievement context
                },
                quest_complete: { sfx: 'sfx_quest_complete', volume: 0.8 },
                quest_update: { sfx: 'sfx_quest_update', volume: 0.6 }
            },
            
            // Social events
            social: {
                romance_increase: { sfx: 'sfx_romance_up', volume: 0.7 },
                romance_decrease: { sfx: 'sfx_romance_down', volume: 0.6 },
                conversation_start: { sfx: 'sfx_dialog_start', volume: 0.6 },
                conversation_end: { sfx: 'sfx_dialog_end', volume: 0.5 },
                gift_give: { sfx: 'sfx_gift', volume: 0.8 },
                npc_happy: { sfx: 'sfx_npc_happy', volume: 0.7 },
                npc_sad: { sfx: 'sfx_npc_sad', volume: 0.6 }
            },
            
            // Economy events
            economy: {
                coin_gain: { sfx: 'sfx_coin_gain', volume: 0.7 },
                coin_spend: { sfx: 'sfx_coin_spend', volume: 0.6 },
                purchase: { sfx: 'sfx_purchase', volume: 0.8 },
                sell: { sfx: 'sfx_sell', volume: 0.7 },
                craft_complete: { sfx: 'sfx_craft_complete', volume: 0.9 },
                upgrade_success: { sfx: 'sfx_upgrade_success', volume: 1.0 },
                upgrade_fail: { sfx: 'sfx_upgrade_fail', volume: 0.8 }
            }
        };
    }

    /**
     * Initialize enhanced audio system
     */
    initializeEnhancedAudio() {
        // Setup audio layers for dynamic mixing
        this.setupAudioLayers();
        
        // Initialize contextual audio system
        this.initializeContextualAudio();
        
        // Setup event listeners
        this.setupEnhancedEventListeners();
        
        // Load audio settings from game state
        this.loadAudioSettings();
        
        console.log('EnhancedAudioManager: Enhanced features initialized');
    }

    /**
     * Setup audio layers for dynamic mixing
     */
    setupAudioLayers() {
        this.audioLayers.set('music', {
            volume: 1.0,
            enabled: true,
            priority: 1,
            ducking: false
        });
        
        this.audioLayers.set('ambient', {
            volume: 0.8,
            enabled: true,
            priority: 2,
            ducking: false
        });
        
        this.audioLayers.set('sfx', {
            volume: 1.0,
            enabled: true,
            priority: 3,
            ducking: false
        });
        
        this.audioLayers.set('ui', {
            volume: 0.7,
            enabled: true,
            priority: 4,
            ducking: false
        });
        
        this.audioLayers.set('voice', {
            volume: 1.0,
            enabled: true,
            priority: 5,
            ducking: false
        });
    }

    /**
     * Initialize contextual audio system
     */
    initializeContextualAudio() {
        // Set up triggers for automatic audio context switching
        this.contextualAudio.set('time_based', {
            enabled: true,
            checkInterval: 30000, // Check every 30 seconds
            lastCheck: Date.now()
        });
        
        this.contextualAudio.set('weather_based', {
            enabled: true,
            checkInterval: 10000, // Check every 10 seconds
            lastCheck: Date.now()
        });
        
        this.contextualAudio.set('activity_based', {
            enabled: true,
            currentActivity: null,
            transitionTime: 2000
        });
    }

    /**
     * Setup enhanced event listeners
     */
    setupEnhancedEventListeners() {
        if (this.eventSystem) {
            // Fishing events
            this.eventSystem.on('fishing:cast:start', () => this.playAudioEvent('fishing', 'cast_start'));
            this.eventSystem.on('fishing:cast:complete', () => this.playAudioEvent('fishing', 'cast_complete'));
            this.eventSystem.on('fishing:fish:bite', () => this.playAudioEvent('fishing', 'fish_bite'));
            this.eventSystem.on('fishing:fish:caught', (data) => this.onFishCaught(data));
            this.eventSystem.on('fishing:fish:escaped', () => this.playAudioEvent('fishing', 'fish_escaped'));
            
            // UI events
            this.eventSystem.on('ui:button:click', () => this.playAudioEvent('ui', 'button_click'));
            this.eventSystem.on('ui:inventory:open', () => this.playAudioEvent('ui', 'inventory_open'));
            this.eventSystem.on('ui:inventory:close', () => this.playAudioEvent('ui', 'inventory_close'));
            this.eventSystem.on('ui:item:equip', () => this.playAudioEvent('ui', 'item_equip'));
            
            // Progression events
            this.eventSystem.on('progression:level:up', () => this.playAudioEvent('progression', 'level_up'));
            this.eventSystem.on('progression:achievement:unlock', (data) => this.onAchievementUnlock(data));
            this.eventSystem.on('progression:quest:complete', () => this.playAudioEvent('progression', 'quest_complete'));
            
            // Social events
            this.eventSystem.on('social:romance:increase', () => this.playAudioEvent('social', 'romance_increase'));
            this.eventSystem.on('social:conversation:start', (data) => this.onConversationStart(data));
            
            // Economy events
            this.eventSystem.on('economy:purchase', () => this.playAudioEvent('economy', 'purchase'));
            this.eventSystem.on('economy:craft:complete', () => this.playAudioEvent('economy', 'craft_complete'));
        }
    }

    /**
     * Play audio event with enhanced features
     */
    playAudioEvent(category, eventKey, options = {}) {
        const event = this.audioEvents[category]?.[eventKey];
        if (!event) {
            console.warn(`EnhancedAudioManager: Audio event not found: ${category}.${eventKey}`);
            return;
        }

        // Check if contextual audio should be used
        if (event.contextual) {
            this.playContextualAudio(category, eventKey, options);
            return;
        }

        // Apply music ducking if specified
        if (event.musicDuck) {
            this.duckMusic(true);
        }

        // Play primary sound effect
        if (event.sfx) {
            const volume = (event.volume || 1.0) * (options.volumeMultiplier || 1.0);
            const pitch = event.randomPitch ? 0.8 + Math.random() * 0.4 : 1.0;
            
            this.baseAudio.playSFX(event.sfx, volume, pitch);
            
            // Track analytics
            this.trackAudioUsage(event.sfx, 'sfx');
        }

        // Play follow-up sound if specified
        if (event.followUp) {
            setTimeout(() => {
                this.baseAudio.playSFX(event.followUp, event.volume || 1.0);
            }, event.followUpDelay || 500);
        }

        // Handle looping sounds
        if (event.loop && options.stopPrevious !== false) {
            this.stopLoopingSound(category, eventKey);
        }

        // Auto-restore music ducking
        if (event.musicDuck) {
            setTimeout(() => {
                this.duckMusic(false);
            }, event.duration || 2000);
        }

        console.log(`EnhancedAudioManager: Played audio event ${category}.${eventKey}`);
    }

    /**
     * Play contextual audio based on game state
     */
    playContextualAudio(category, eventKey, options = {}) {
        // Determine context based on current game state
        let context = 'default';
        
        if (category === 'achievement') {
            context = this.getAchievementContext(options.achievementType);
        } else if (category === 'social') {
            context = this.getSocialContext(options.npcId, options.romanceLevel);
        }
        
        const contextualConfig = this.audioContexts[category]?.[context];
        if (contextualConfig) {
            this.applyAudioContext(contextualConfig, options);
        } else {
            // Fallback to regular audio event
            this.playAudioEvent(category, eventKey, { ...options, contextual: false });
        }
    }

    /**
     * Apply audio context configuration
     */
    applyAudioContext(contextConfig, options = {}) {
        // Handle music changes
        if (contextConfig.music) {
            const musicOptions = {
                fadeIn: contextConfig.music.fadeIn !== false,
                fadeTime: contextConfig.music.fadeTime || this.enhancedSettings.fadeTransitionTime
            };
            
            this.baseAudio.playMusic(contextConfig.music.track, musicOptions.fadeIn, musicOptions.fadeTime);
            
            if (contextConfig.music.volume !== undefined) {
                setTimeout(() => {
                    this.baseAudio.updateAudioSettings('musicVolume', contextConfig.music.volume);
                }, musicOptions.fadeTime / 2);
            }
        }

        // Handle ambient changes
        if (contextConfig.ambient) {
            contextConfig.ambient.forEach(ambient => {
                this.baseAudio.playAmbient(ambient.track, ambient.volume || 1.0, true);
            });
        }

        // Handle SFX
        if (contextConfig.sfx) {
            contextConfig.sfx.forEach((sfxKey, index) => {
                setTimeout(() => {
                    this.baseAudio.playSFX(sfxKey);
                }, index * 200); // Stagger multiple SFX
            });
        }

        // Set duration for temporary context
        if (contextConfig.duration) {
            setTimeout(() => {
                this.revertToPreviousContext();
            }, contextConfig.duration);
        }
    }

    /**
     * Duck music volume for important sounds
     */
    duckMusic(enable) {
        if (!this.enhancedSettings.enableDynamicMixing) return;
        
        const targetVolume = enable ? 
            this.baseAudio.musicVolume * this.enhancedSettings.duckingAmount : 
            this.baseAudio.musicVolume;
        
        // Smooth volume transition
        this.smoothVolumeTransition('music', targetVolume, 500);
    }

    /**
     * Smooth volume transition for any audio type
     */
    smoothVolumeTransition(audioType, targetVolume, duration = 1000) {
        const currentVolume = this.getCurrentVolume(audioType);
        const volumeStep = (targetVolume - currentVolume) / 20;
        const stepTime = duration / 20;
        
        let step = 0;
        const transition = setInterval(() => {
            step++;
            const newVolume = currentVolume + (volumeStep * step);
            
            if (audioType === 'music' && this.baseAudio.currentMusic) {
                this.baseAudio.currentMusic.setVolume(newVolume);
            }
            
            if (step >= 20) {
                clearInterval(transition);
            }
        }, stepTime);
    }

    /**
     * Handle specific event: Fish caught
     */
    onFishCaught(fishData) {
        const rarity = fishData.rarity || 1;
        let eventKey = 'fish_caught';
        
        // Use different audio for rare fish
        if (rarity >= 8) {
            eventKey = 'legendary_catch';
        } else if (rarity >= 5) {
            eventKey = 'rare_catch';
        }
        
        this.playAudioEvent('fishing', eventKey, {
            volumeMultiplier: Math.min(1.0 + (rarity * 0.1), 2.0)
        });
        
        // Achievement context for special catches
        if (rarity >= 5) {
            setTimeout(() => {
                this.playContextualAudio('achievement', 'major_milestone', {
                    achievementType: 'rare_catch'
                });
            }, 1000);
        }
    }

    /**
     * Handle specific event: Achievement unlock
     */
    onAchievementUnlock(achievementData) {
        const achievementType = this.getAchievementType(achievementData);
        
        this.playContextualAudio('achievement', achievementType, {
            achievementType: achievementData.type,
            achievementId: achievementData.id
        });
    }

    /**
     * Handle specific event: Conversation start
     */
    onConversationStart(conversationData) {
        const context = this.getSocialContext(conversationData.npcId, conversationData.romanceLevel);
        
        this.playContextualAudio('social', context, {
            npcId: conversationData.npcId,
            romanceLevel: conversationData.romanceLevel
        });
    }

    /**
     * Get achievement context based on achievement data
     */
    getAchievementContext(achievementType) {
        const majorAchievements = ['master_angler', 'legendary_collector', 'romance_master'];
        const firstTimeAchievements = ['first_catch', 'first_conversation', 'first_craft'];
        
        if (majorAchievements.includes(achievementType)) {
            return 'major_milestone';
        } else if (firstTimeAchievements.includes(achievementType)) {
            return 'first_time';
        } else {
            return 'minor_achievement';
        }
    }

    /**
     * Get social context based on NPC and romance level
     */
    getSocialContext(npcId, romanceLevel = 0) {
        if (romanceLevel >= 60) {
            return 'romantic_conversation';
        } else if (romanceLevel >= 20) {
            return 'friendly_chat';
        } else {
            return 'tutorial';
        }
    }

    /**
     * Track audio usage for analytics
     */
    trackAudioUsage(audioKey, audioType) {
        if (!this.enhancedSettings.enableAudioAnalytics) return;
        
        this.audioAnalytics.totalPlayed++;
        
        if (audioType === 'sfx') {
            this.audioAnalytics.sfxCount++;
        } else if (audioType === 'music') {
            this.audioAnalytics.musicTime += Date.now() - (this.audioAnalytics.lastMusicStart || Date.now());
            this.audioAnalytics.lastMusicStart = Date.now();
        }
        
        // Track popular sounds
        const currentCount = this.audioAnalytics.popularSounds.get(audioKey) || 0;
        this.audioAnalytics.popularSounds.set(audioKey, currentCount + 1);
    }

    /**
     * Get current volume for audio type
     */
    getCurrentVolume(audioType) {
        switch (audioType) {
            case 'music':
                return this.baseAudio.musicVolume;
            case 'sfx':
                return this.baseAudio.sfxVolume;
            case 'ambient':
                return this.baseAudio.ambientVolume;
            default:
                return 1.0;
        }
    }

    /**
     * Enhanced scene audio with context awareness
     */
    setEnhancedSceneAudio(sceneKey, contextData = {}) {
        // Use base audio manager for basic scene setup
        this.baseAudio.setSceneAudio(sceneKey);
        
        // Apply contextual enhancements
        if (this.enhancedSettings.enableContextualAudio) {
            this.applySceneContextualAudio(sceneKey, contextData);
        }
        
        console.log(`EnhancedAudioManager: Set enhanced audio for scene ${sceneKey}`);
    }

    /**
     * Apply contextual audio enhancements for scene
     */
    applySceneContextualAudio(sceneKey, contextData) {
        const timeOfDay = contextData.timeOfDay || this.gameState.timeOfDay || 'day';
        const weather = contextData.weather || this.gameState.weather || 'clear';
        const activity = contextData.activity || 'idle';
        
        // Fishing scene contextual audio
        if (sceneKey === 'GameScene') {
            let fishingContext = 'calm_water';
            
            if (weather === 'storm') {
                fishingContext = 'rough_water';
            } else if (timeOfDay === 'night') {
                fishingContext = 'night_fishing';
            }
            
            const contextConfig = this.audioContexts.fishing[fishingContext];
            if (contextConfig) {
                this.applyAudioContext(contextConfig);
            }
        }
    }

    /**
     * Load audio settings from game state
     */
    loadAudioSettings() {
        const savedSettings = this.gameState.audioSettings || {};
        
        // Apply saved volume settings
        if (savedSettings.masterVolume !== undefined) {
            this.baseAudio.updateAudioSettings('masterVolume', savedSettings.masterVolume);
        }
        if (savedSettings.musicVolume !== undefined) {
            this.baseAudio.updateAudioSettings('musicVolume', savedSettings.musicVolume);
        }
        if (savedSettings.sfxVolume !== undefined) {
            this.baseAudio.updateAudioSettings('sfxVolume', savedSettings.sfxVolume);
        }
        if (savedSettings.ambientVolume !== undefined) {
            this.baseAudio.updateAudioSettings('ambientVolume', savedSettings.ambientVolume);
        }
        if (savedSettings.muted !== undefined) {
            this.baseAudio.updateAudioSettings('muted', savedSettings.muted);
        }
        
        // Apply enhanced settings
        Object.assign(this.enhancedSettings, savedSettings.enhancedSettings || {});
    }

    /**
     * Save audio settings to game state
     */
    saveAudioSettings() {
        this.gameState.audioSettings = {
            masterVolume: this.baseAudio.masterVolume,
            musicVolume: this.baseAudio.musicVolume,
            sfxVolume: this.baseAudio.sfxVolume,
            ambientVolume: this.baseAudio.ambientVolume,
            muted: this.baseAudio.muted,
            enhancedSettings: this.enhancedSettings
        };
    }

    /**
     * Get audio analytics report
     */
    getAudioAnalytics() {
        const sessionTime = Date.now() - this.audioAnalytics.sessionStartTime;
        const popularSoundsArray = Array.from(this.audioAnalytics.popularSounds.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        return {
            sessionTime: sessionTime,
            totalSoundsPlayed: this.audioAnalytics.totalPlayed,
            musicTime: this.audioAnalytics.musicTime,
            sfxCount: this.audioAnalytics.sfxCount,
            popularSounds: popularSoundsArray,
            errorCount: this.audioAnalytics.errorCount,
            averageSoundsPerMinute: (this.audioAnalytics.totalPlayed / (sessionTime / 60000)).toFixed(2)
        };
    }

    /**
     * Enhanced audio debugging
     */
    getEnhancedAudioInfo() {
        const baseInfo = this.baseAudio.getAudioInfo();
        
        return {
            ...baseInfo,
            enhancedFeatures: {
                dynamicMixing: this.enhancedSettings.enableDynamicMixing,
                contextualAudio: this.enhancedSettings.enableContextualAudio,
                spatialAudio: this.enhancedSettings.enableSpatialAudio,
                audioQuality: this.enhancedSettings.audioQuality
            },
            audioLayers: Object.fromEntries(this.audioLayers),
            activeContexts: Array.from(this.contextualAudio.keys()),
            analytics: this.getAudioAnalytics()
        };
    }

    /**
     * Emergency audio reset
     */
    emergencyReset() {
        console.warn('EnhancedAudioManager: Performing emergency audio reset');
        
        this.baseAudio.stopAllSounds();
        this.audioLayers.clear();
        this.setupAudioLayers();
        this.initializeContextualAudio();
        
        this.audioAnalytics.errorCount++;
    }

    /**
     * Destroy enhanced audio manager
     */
    destroy() {
        // Save settings before destroying
        this.saveAudioSettings();
        
        // Clear all enhanced features
        this.audioLayers.clear();
        this.dynamicMixer.clear();
        this.contextualAudio.clear();
        this.audioTriggers.clear();
        this.audioSequences.clear();
        
        console.log('EnhancedAudioManager: Destroyed');
    }
} 