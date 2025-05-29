// Import audio assets
import BoatBGMusic from '../assets/audio/Boat_BG.mp3';
import FishingBGMusic from '../assets/audio/Fishing_BG.mp3';

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
        // Define audio assets - only load real files that exist, use placeholders for others
        const audioAssets = {
            music: {
                menu: { key: 'music_menu', url: 'placeholder', loop: true }, // No file - use placeholder
                fishing: { key: 'music_fishing', url: FishingBGMusic, loop: true }, // Real file
                boat: { key: 'music_boat', url: BoatBGMusic, loop: true }, // Real file
                shop: { key: 'music_shop', url: 'placeholder', loop: true }, // No file - use placeholder
                victory: { key: 'music_victory', url: 'placeholder', loop: false } // No file - use placeholder
            },
            sfx: {
                cast: { key: 'sfx_cast', url: 'placeholder' }, // No file - use placeholder
                splash: { key: 'sfx_splash', url: 'placeholder' }, // No file - use placeholder
                reel: { key: 'sfx_reel', url: 'placeholder' }, // No file - use placeholder
                catch: { key: 'sfx_catch', url: 'placeholder' }, // No file - use placeholder
                fail: { key: 'sfx_fail', url: 'placeholder' }, // No file - use placeholder
                button: { key: 'sfx_button', url: 'placeholder' }, // No file - use placeholder
                coin: { key: 'sfx_coin', url: 'placeholder' }, // No file - use placeholder
                levelup: { key: 'sfx_levelup', url: 'placeholder' }, // No file - use placeholder
                craft: { key: 'sfx_craft', url: 'placeholder' }, // No file - use placeholder
                equip: { key: 'sfx_equip', url: 'placeholder' }, // No file - use placeholder
                notification: { key: 'sfx_notification', url: 'placeholder' }, // No file - use placeholder
                struggle: { key: 'sfx_struggle', url: 'placeholder' }, // No file - use placeholder
                tension: { key: 'sfx_tension', url: 'placeholder' }, // No file - use placeholder
                
                // Additional SFX for fishing mechanics
                cast_prepare: { key: 'sfx_cast_prepare', url: 'placeholder' },
                cast_perfect: { key: 'sfx_cast_perfect', url: 'placeholder' },
                cast_normal: { key: 'sfx_cast_normal', url: 'placeholder' },
                splash_perfect: { key: 'sfx_splash_perfect', url: 'placeholder' },
                catch_legendary: { key: 'sfx_catch_legendary', url: 'placeholder' },
                catch_rare: { key: 'sfx_catch_rare', url: 'placeholder' },
                line_break: { key: 'sfx_line_break', url: 'placeholder' },
                fish_escape: { key: 'sfx_fish_escape', url: 'placeholder' },
                fish_bite: { key: 'sfx_fish_bite', url: 'placeholder' },
                lure_success: { key: 'sfx_lure_success', url: 'placeholder' },
                fish_struggle: { key: 'sfx_fish_struggle', url: 'placeholder' },
                qte_success: { key: 'sfx_qte_success', url: 'placeholder' },
                qte_fail: { key: 'sfx_qte_fail', url: 'placeholder' },
                reel_success: { key: 'sfx_reel_success', url: 'placeholder' },
                reel_fail: { key: 'sfx_reel_fail', url: 'placeholder' }
            },
            ambient: {
                water: { key: 'ambient_water', url: 'placeholder', loop: true }, // No file - use placeholder
                seagulls: { key: 'ambient_seagulls', url: 'placeholder', loop: true }, // No file - use placeholder
                wind: { key: 'ambient_wind', url: 'placeholder', loop: true }, // No file - use placeholder
                harbor: { key: 'ambient_harbor', url: 'placeholder', loop: true } // No file - use placeholder
            }
        };

        // Load audio assets with smart fallback
        this.loadAudioAssetsWithFallback(audioAssets);
    }

    loadAudioAssetsWithFallback(audioAssets) {
        console.log('AudioManager: Loading audio assets with smart fallback...');
        
        // Store asset definitions
        this.audioAssetDefinitions = audioAssets;
        
        // Load each category of audio
        Object.entries(audioAssets).forEach(([category, assets]) => {
            Object.entries(assets).forEach(([name, asset]) => {
                if (asset.url === 'placeholder') {
                    // Create placeholder immediately for missing files
                    console.log(`AudioManager: Creating placeholder for ${asset.key} (no file available)`);
                    this.createPlaceholderSound(asset.key, asset.loop || false);
                } else {
                    // Try to load real file
                    this.loadAudioFile(asset.key, asset.url, asset.loop || false, category);
                }
            });
        });
    }

    loadAudioFile(key, url, loop = false, category = 'sfx') {
        try {
            // Check if the scene has a load method (for preloading)
            if (this.scene.load && this.scene.load.audio) {
                // Use Phaser's audio loading system
                this.scene.load.audio(key, url);
                
                // Set up completion handler
                this.scene.load.once('complete', () => {
                    this.createRealSound(key, loop, category);
                });
                
                // Set up error handler
                this.scene.load.once('loaderror', (event) => {
                    console.warn(`AudioManager: Failed to load ${key}, using placeholder`);
                    this.createPlaceholderSound(key, loop);
                });
                
                // Start loading if not already started
                if (!this.scene.load.isLoading()) {
                    this.scene.load.start();
                }
            } else {
                // Create HTML5 Audio element directly
                this.createHTML5Audio(key, url, loop, category);
            }
        } catch (error) {
            console.warn(`AudioManager: Failed to load ${key}, creating placeholder:`, error);
            this.createPlaceholderSound(key, loop);
        }
    }

    createHTML5Audio(key, url, loop = false, category = 'sfx') {
        const audio = new Audio();
        audio.src = url;
        audio.loop = loop;
        audio.preload = 'auto';
        
        // Create Phaser-like sound interface
        const soundObject = {
            key: key,
            isPlaying: false,
            isPaused: false,
            volume: 1,
            loop: loop,
            _audio: audio,
            
            play: (config = {}) => {
                try {
                    if (soundObject.isPlaying) {
                        audio.currentTime = 0;
                    }
                    
                    audio.volume = (config.volume || soundObject.volume) * this.getEffectiveVolume(category);
                    audio.loop = config.loop !== undefined ? config.loop : loop;
                    
                    const playPromise = audio.play();
                    if (playPromise) {
                        playPromise.then(() => {
                            soundObject.isPlaying = true;
                            soundObject.isPaused = false;
                            console.log(`AudioManager: Playing ${key}`);
                        }).catch(error => {
                            console.warn(`AudioManager: Failed to play ${key}:`, error);
                        });
                    }
                } catch (error) {
                    console.warn(`AudioManager: Error playing ${key}:`, error);
                }
                return soundObject;
            },
            
            stop: () => {
                try {
                    audio.pause();
                    audio.currentTime = 0;
                    soundObject.isPlaying = false;
                    soundObject.isPaused = false;
                    console.log(`AudioManager: Stopping ${key}`);
                } catch (error) {
                    console.warn(`AudioManager: Error stopping ${key}:`, error);
                }
                return soundObject;
            },
            
            pause: () => {
                try {
                    audio.pause();
                    soundObject.isPaused = true;
                    soundObject.isPlaying = false;
                    console.log(`AudioManager: Pausing ${key}`);
                } catch (error) {
                    console.warn(`AudioManager: Error pausing ${key}:`, error);
                }
                return soundObject;
            },
            
            resume: () => {
                try {
                    const playPromise = audio.play();
                    if (playPromise) {
                        playPromise.then(() => {
                            soundObject.isPlaying = true;
                            soundObject.isPaused = false;
                            console.log(`AudioManager: Resuming ${key}`);
                        }).catch(error => {
                            console.warn(`AudioManager: Failed to resume ${key}:`, error);
                        });
                    }
                } catch (error) {
                    console.warn(`AudioManager: Error resuming ${key}:`, error);
                }
                return soundObject;
            },
            
            setVolume: (volume) => {
                soundObject.volume = volume;
                audio.volume = volume * this.getEffectiveVolume(category);
                return soundObject;
            },
            
            setLoop: (loopValue) => {
                soundObject.loop = loopValue;
                audio.loop = loopValue;
                return soundObject;
            },
            
            destroy: () => {
                try {
                    audio.pause();
                    audio.src = '';
                    console.log(`AudioManager: Destroying ${key}`);
                } catch (error) {
                    console.warn(`AudioManager: Error destroying ${key}:`, error);
                }
            }
        };

        // Handle loading events
        audio.addEventListener('canplaythrough', () => {
            console.log(`AudioManager: ${key} loaded successfully`);
        });
        
        audio.addEventListener('error', (error) => {
            console.warn(`AudioManager: Failed to load ${key}, using placeholder`);
            // Remove the failed audio object and create placeholder
            if (key.startsWith('music_')) {
                this.musicTracks.delete(key);
            } else if (key.startsWith('sfx_')) {
                this.soundEffects.delete(key);
            } else if (key.startsWith('ambient_')) {
                this.ambientSounds.delete(key);
            }
            this.createPlaceholderSound(key, loop);
            return;
        });

        // Store in appropriate category
        if (key.startsWith('music_')) {
            this.musicTracks.set(key, soundObject);
        } else if (key.startsWith('sfx_')) {
            this.soundEffects.set(key, soundObject);
        } else if (key.startsWith('ambient_')) {
            this.ambientSounds.set(key, soundObject);
        }

        return soundObject;
    }

    createRealSound(key, loop = false, category = 'sfx') {
        // Create sound using Phaser's audio system
        try {
            const sound = this.scene.sound.add(key, {
                loop: loop,
                volume: this.getEffectiveVolume(category)
            });

            // Store in appropriate category
            if (key.startsWith('music_')) {
                this.musicTracks.set(key, sound);
            } else if (key.startsWith('sfx_')) {
                this.soundEffects.set(key, sound);
            } else if (key.startsWith('ambient_')) {
                this.ambientSounds.set(key, sound);
            }

            console.log(`AudioManager: Created real sound for ${key}`);
            return sound;
        } catch (error) {
            console.warn(`AudioManager: Failed to create real sound for ${key}, using placeholder:`, error);
            return this.createPlaceholderSound(key, loop);
        }
    }

    getEffectiveVolume(category) {
        if (this.muted) return 0;
        
        let categoryVolume = 1;
        switch (category) {
            case 'music':
                categoryVolume = this.musicVolume;
                break;
            case 'sfx':
                categoryVolume = this.sfxVolume;
                break;
            case 'ambient':
                categoryVolume = this.ambientVolume;
                break;
        }
        
        return categoryVolume * this.masterVolume;
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