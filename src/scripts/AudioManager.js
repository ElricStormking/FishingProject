export class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.game = scene.game;
        
        // Audio state
        this.isInitialized = false;
        this.currentMusic = null;
        this.musicVolume = 0.8;
        this.sfxVolume = 1.0;
        this.ambientVolume = 0.6;
        this.masterVolume = 1.0;
        this.muted = false;
        
        // Audio pools for efficient management
        this.musicTracks = new Map();
        this.soundEffects = new Map();
        this.ambientSounds = new Map();
        this.activeSounds = new Set();
        
        // Audio context for advanced features
        this.audioContext = null;
        this.musicFadeTimer = null;
        
        console.log('AudioManager: Initialized');
    }

    initialize() {
        if (this.isInitialized) return;
        
        try {
            // Initialize audio context for advanced features
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Load audio assets
            this.loadAudioAssets();
            
            // Set up audio event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('AudioManager: Successfully initialized');
        } catch (error) {
            console.warn('AudioManager: Failed to initialize audio context:', error);
            this.isInitialized = true; // Continue without advanced features
        }
    }

    loadAudioAssets() {
        // Define audio assets to load
        const audioAssets = {
            music: {
                menu: { key: 'music_menu', url: 'assets/audio/music/menu.mp3', loop: true },
                fishing: { key: 'music_fishing', url: 'assets/audio/music/fishing.mp3', loop: true },
                boat: { key: 'music_boat', url: 'assets/audio/music/boat.mp3', loop: true },
                shop: { key: 'music_shop', url: 'assets/audio/music/shop.mp3', loop: true },
                victory: { key: 'music_victory', url: 'assets/audio/music/victory.mp3', loop: false }
            },
            sfx: {
                cast: { key: 'sfx_cast', url: 'assets/audio/sfx/cast.wav' },
                splash: { key: 'sfx_splash', url: 'assets/audio/sfx/splash.wav' },
                reel: { key: 'sfx_reel', url: 'assets/audio/sfx/reel.wav' },
                catch: { key: 'sfx_catch', url: 'assets/audio/sfx/catch.wav' },
                fail: { key: 'sfx_fail', url: 'assets/audio/sfx/fail.wav' },
                button: { key: 'sfx_button', url: 'assets/audio/sfx/button.wav' },
                coin: { key: 'sfx_coin', url: 'assets/audio/sfx/coin.wav' },
                levelup: { key: 'sfx_levelup', url: 'assets/audio/sfx/levelup.wav' },
                craft: { key: 'sfx_craft', url: 'assets/audio/sfx/craft.wav' },
                equip: { key: 'sfx_equip', url: 'assets/audio/sfx/equip.wav' },
                notification: { key: 'sfx_notification', url: 'assets/audio/sfx/notification.wav' },
                struggle: { key: 'sfx_struggle', url: 'assets/audio/sfx/struggle.wav' },
                tension: { key: 'sfx_tension', url: 'assets/audio/sfx/tension.wav' }
            },
            ambient: {
                water: { key: 'ambient_water', url: 'assets/audio/ambient/water.mp3', loop: true },
                seagulls: { key: 'ambient_seagulls', url: 'assets/audio/ambient/seagulls.mp3', loop: true },
                wind: { key: 'ambient_wind', url: 'assets/audio/ambient/wind.mp3', loop: true },
                harbor: { key: 'ambient_harbor', url: 'assets/audio/ambient/harbor.mp3', loop: true }
            }
        };

        // Since we don't have actual audio files, create placeholder audio
        this.createPlaceholderAudio(audioAssets);
    }

    createPlaceholderAudio(audioAssets) {
        // Create silent audio buffers as placeholders
        // In a real implementation, these would be actual audio files
        
        console.log('AudioManager: Creating placeholder audio (no actual files loaded)');
        
        // Store asset definitions for future use
        this.audioAssetDefinitions = audioAssets;
        
        // Mark assets as "loaded" for the placeholder system
        Object.values(audioAssets).forEach(category => {
            Object.values(category).forEach(asset => {
                // Create placeholder sound objects
                this.createPlaceholderSound(asset.key, asset.loop || false);
            });
        });
    }

    createPlaceholderSound(key, loop = false) {
        // Create a minimal sound object that won't actually play audio
        // but provides the interface for the game to use
        const placeholderSound = {
            key: key,
            isPlaying: false,
            isPaused: false,
            volume: 1,
            loop: loop,
            play: () => {
                console.log(`AudioManager: [PLACEHOLDER] Playing ${key}`);
                placeholderSound.isPlaying = true;
                return placeholderSound;
            },
            stop: () => {
                console.log(`AudioManager: [PLACEHOLDER] Stopping ${key}`);
                placeholderSound.isPlaying = false;
                return placeholderSound;
            },
            pause: () => {
                console.log(`AudioManager: [PLACEHOLDER] Pausing ${key}`);
                placeholderSound.isPaused = true;
                return placeholderSound;
            },
            resume: () => {
                console.log(`AudioManager: [PLACEHOLDER] Resuming ${key}`);
                placeholderSound.isPaused = false;
                return placeholderSound;
            },
            setVolume: (volume) => {
                placeholderSound.volume = volume;
                return placeholderSound;
            },
            setLoop: (loop) => {
                placeholderSound.loop = loop;
                return placeholderSound;
            },
            destroy: () => {
                console.log(`AudioManager: [PLACEHOLDER] Destroying ${key}`);
            }
        };

        // Store in appropriate category
        if (key.startsWith('music_')) {
            this.musicTracks.set(key, placeholderSound);
        } else if (key.startsWith('sfx_')) {
            this.soundEffects.set(key, placeholderSound);
        } else if (key.startsWith('ambient_')) {
            this.ambientSounds.set(key, placeholderSound);
        }

        return placeholderSound;
    }

    setupEventListeners() {
        // Listen for settings changes
        if (window.gameState && window.gameState.settingsManager) {
            window.gameState.settingsManager.on('settingChanged', (data) => {
                if (data.category === 'audio') {
                    this.updateAudioSettings(data.key, data.value);
                }
            });
        }

        // Listen for game events
        this.scene.events.on('fishing:cast', () => this.playSFX('cast'));
        this.scene.events.on('fishing:splash', () => this.playSFX('splash'));
        this.scene.events.on('fishing:reel', () => this.playSFX('reel'));
        this.scene.events.on('fishing:catch', () => this.playSFX('catch'));
        this.scene.events.on('fishing:fail', () => this.playSFX('fail'));
        this.scene.events.on('fishing:struggle', () => this.playSFX('struggle'));
        this.scene.events.on('ui:button', () => this.playSFX('button'));
        this.scene.events.on('player:coin', () => this.playSFX('coin'));
        this.scene.events.on('player:levelup', () => this.playSFX('levelup'));
        this.scene.events.on('crafting:complete', () => this.playSFX('craft'));
        this.scene.events.on('inventory:equip', () => this.playSFX('equip'));
        this.scene.events.on('ui:notification', () => this.playSFX('notification'));
    }

    // Music Management
    playMusic(trackKey, fadeIn = true, fadeTime = 1000) {
        if (this.muted || !this.musicTracks.has(trackKey)) return null;

        // Stop current music if playing
        if (this.currentMusic && this.currentMusic.isPlaying) {
            if (fadeIn) {
                this.fadeOutMusic(this.currentMusic, fadeTime / 2);
            } else {
                this.currentMusic.stop();
            }
        }

        // Start new music
        const music = this.musicTracks.get(trackKey);
        if (music) {
            music.setVolume(fadeIn ? 0 : this.musicVolume * this.masterVolume);
            music.setLoop(true);
            music.play();
            
            this.currentMusic = music;
            
            if (fadeIn) {
                this.fadeInMusic(music, fadeTime);
            }
            
            console.log(`AudioManager: Playing music - ${trackKey}`);
        }
        
        return music;
    }

    stopMusic(fadeOut = true, fadeTime = 1000) {
        if (this.currentMusic && this.currentMusic.isPlaying) {
            if (fadeOut) {
                this.fadeOutMusic(this.currentMusic, fadeTime);
            } else {
                this.currentMusic.stop();
                this.currentMusic = null;
            }
        }
    }

    fadeInMusic(music, duration = 1000) {
        if (!music) return;
        
        const targetVolume = this.musicVolume * this.masterVolume;
        const steps = 20;
        const stepTime = duration / steps;
        const volumeStep = targetVolume / steps;
        
        let currentStep = 0;
        
        const fadeInterval = setInterval(() => {
            currentStep++;
            const newVolume = Math.min(volumeStep * currentStep, targetVolume);
            music.setVolume(newVolume);
            
            if (currentStep >= steps) {
                clearInterval(fadeInterval);
            }
        }, stepTime);
    }

    fadeOutMusic(music, duration = 1000) {
        if (!music) return;
        
        const startVolume = music.volume;
        const steps = 20;
        const stepTime = duration / steps;
        const volumeStep = startVolume / steps;
        
        let currentStep = 0;
        
        const fadeInterval = setInterval(() => {
            currentStep++;
            const newVolume = Math.max(startVolume - (volumeStep * currentStep), 0);
            music.setVolume(newVolume);
            
            if (currentStep >= steps || newVolume <= 0) {
                clearInterval(fadeInterval);
                music.stop();
                if (music === this.currentMusic) {
                    this.currentMusic = null;
                }
            }
        }, stepTime);
    }

    // Sound Effects Management
    playSFX(effectKey, volume = 1.0, pitch = 1.0) {
        if (this.muted || !this.soundEffects.has(effectKey)) return null;

        const sfx = this.soundEffects.get(effectKey);
        if (sfx) {
            const finalVolume = this.sfxVolume * this.masterVolume * volume;
            sfx.setVolume(finalVolume);
            
            // Add to active sounds for cleanup
            this.activeSounds.add(sfx);
            
            const sound = sfx.play();
            
            // Remove from active sounds when complete
            if (sound && sound.once) {
                sound.once('complete', () => {
                    this.activeSounds.delete(sfx);
                });
            }
            
            console.log(`AudioManager: Playing SFX - ${effectKey} (volume: ${finalVolume.toFixed(2)})`);
            return sound;
        }
        
        return null;
    }

    // Ambient Sound Management
    playAmbient(ambientKey, volume = 1.0, fadeIn = true) {
        if (this.muted || !this.ambientSounds.has(ambientKey)) return null;

        const ambient = this.ambientSounds.get(ambientKey);
        if (ambient && !ambient.isPlaying) {
            const finalVolume = this.ambientVolume * this.masterVolume * volume;
            ambient.setVolume(fadeIn ? 0 : finalVolume);
            ambient.setLoop(true);
            ambient.play();
            
            if (fadeIn) {
                this.fadeInAmbient(ambient, finalVolume);
            }
            
            console.log(`AudioManager: Playing ambient - ${ambientKey}`);
        }
        
        return ambient;
    }

    stopAmbient(ambientKey, fadeOut = true) {
        if (!this.ambientSounds.has(ambientKey)) return;

        const ambient = this.ambientSounds.get(ambientKey);
        if (ambient && ambient.isPlaying) {
            if (fadeOut) {
                this.fadeOutAmbient(ambient);
            } else {
                ambient.stop();
            }
        }
    }

    fadeInAmbient(ambient, targetVolume, duration = 2000) {
        const steps = 20;
        const stepTime = duration / steps;
        const volumeStep = targetVolume / steps;
        
        let currentStep = 0;
        
        const fadeInterval = setInterval(() => {
            currentStep++;
            const newVolume = Math.min(volumeStep * currentStep, targetVolume);
            ambient.setVolume(newVolume);
            
            if (currentStep >= steps) {
                clearInterval(fadeInterval);
            }
        }, stepTime);
    }

    fadeOutAmbient(ambient, duration = 2000) {
        const startVolume = ambient.volume;
        const steps = 20;
        const stepTime = duration / steps;
        const volumeStep = startVolume / steps;
        
        let currentStep = 0;
        
        const fadeInterval = setInterval(() => {
            currentStep++;
            const newVolume = Math.max(startVolume - (volumeStep * currentStep), 0);
            ambient.setVolume(newVolume);
            
            if (currentStep >= steps || newVolume <= 0) {
                clearInterval(fadeInterval);
                ambient.stop();
            }
        }, stepTime);
    }

    // Settings Management
    updateAudioSettings(key, value) {
        switch (key) {
            case 'masterVolume':
                this.masterVolume = value;
                this.updateAllVolumes();
                break;
            case 'musicVolume':
                this.musicVolume = value;
                if (this.currentMusic) {
                    this.currentMusic.setVolume(this.musicVolume * this.masterVolume);
                }
                break;
            case 'sfxVolume':
                this.sfxVolume = value;
                break;
            case 'ambientVolume':
                this.ambientVolume = value;
                this.ambientSounds.forEach(ambient => {
                    if (ambient.isPlaying) {
                        ambient.setVolume(this.ambientVolume * this.masterVolume);
                    }
                });
                break;
            case 'muted':
                this.muted = value;
                if (value) {
                    this.muteAll();
                } else {
                    this.unmuteAll();
                }
                break;
        }
        
        console.log(`AudioManager: Updated ${key} to ${value}`);
    }

    updateAllVolumes() {
        // Update music volume
        if (this.currentMusic) {
            this.currentMusic.setVolume(this.musicVolume * this.masterVolume);
        }
        
        // Update ambient volumes
        this.ambientSounds.forEach(ambient => {
            if (ambient.isPlaying) {
                ambient.setVolume(this.ambientVolume * this.masterVolume);
            }
        });
    }

    muteAll() {
        if (this.currentMusic) this.currentMusic.setVolume(0);
        this.ambientSounds.forEach(ambient => ambient.setVolume(0));
        // SFX will be muted by checking this.muted in playSFX
    }

    unmuteAll() {
        this.updateAllVolumes();
    }

    // Scene-specific audio management
    setSceneAudio(sceneKey) {
        const audioConfig = {
            MenuScene: {
                music: 'music_menu',
                ambient: ['ambient_harbor']
            },
            BoatMenuScene: {
                music: 'music_boat',
                ambient: ['ambient_water', 'ambient_seagulls']
            },
            GameScene: {
                music: 'music_fishing',
                ambient: ['ambient_water', 'ambient_wind']
            },
            ShopScene: {
                music: 'music_shop',
                ambient: []
            }
        };

        const config = audioConfig[sceneKey];
        if (config) {
            // Change music
            if (config.music) {
                this.playMusic(config.music);
            }
            
            // Stop all ambient sounds first
            this.ambientSounds.forEach((ambient, key) => {
                if (ambient.isPlaying) {
                    this.stopAmbient(key);
                }
            });
            
            // Start new ambient sounds
            config.ambient.forEach(ambientKey => {
                this.playAmbient(ambientKey, 1.0, true);
            });
            
            console.log(`AudioManager: Set audio for scene ${sceneKey}`);
        }
    }

    // Utility methods
    stopAllSounds() {
        this.stopMusic(false);
        this.ambientSounds.forEach((ambient, key) => {
            this.stopAmbient(key, false);
        });
        this.activeSounds.forEach(sfx => {
            if (sfx.stop) sfx.stop();
        });
        this.activeSounds.clear();
    }

    getAudioInfo() {
        return {
            isInitialized: this.isInitialized,
            currentMusic: this.currentMusic?.key || null,
            activeAmbient: Array.from(this.ambientSounds.entries())
                .filter(([key, sound]) => sound.isPlaying)
                .map(([key]) => key),
            activeSounds: this.activeSounds.size,
            settings: {
                masterVolume: this.masterVolume,
                musicVolume: this.musicVolume,
                sfxVolume: this.sfxVolume,
                ambientVolume: this.ambientVolume,
                muted: this.muted
            }
        };
    }

    destroy() {
        this.stopAllSounds();
        
        // Clear all audio maps
        this.musicTracks.clear();
        this.soundEffects.clear();
        this.ambientSounds.clear();
        this.activeSounds.clear();
        
        // Close audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        console.log('AudioManager: Destroyed');
    }
} 