export class SettingsManager {
    constructor() {
        this.settings = this.getDefaultSettings();
        this.loadSettings();
        
        // Event listeners for settings changes
        this.listeners = {};
        
        console.log('SettingsManager: Initialized with settings:', this.settings);
    }

    getDefaultSettings() {
        return {
            audio: {
                masterVolume: 1.0,
                musicVolume: 0.8,
                sfxVolume: 1.0,
                ambientVolume: 0.6,
                muted: false,
                musicEnabled: true,
                sfxEnabled: true
            },
            graphics: {
                quality: 'high', // low, medium, high, ultra
                fullscreen: false,
                vsync: true,
                particleEffects: true,
                screenShake: true,
                animationSpeed: 1.0,
                uiScale: 1.0
            },
            gameplay: {
                autoSave: true,
                autoSaveInterval: 30000, // 30 seconds
                difficulty: 'normal', // easy, normal, hard, expert
                showTutorials: true,
                showHints: true,
                pauseOnFocusLoss: true,
                confirmActions: true,
                fastText: false,
                skipAnimations: false
            },
            controls: {
                mouseSensitivity: 1.0,
                keyboardLayout: 'qwerty',
                gamepadEnabled: false,
                gamepadVibration: true,
                invertMouseY: false,
                holdToReel: false
            },
            accessibility: {
                colorBlindMode: 'none', // none, protanopia, deuteranopia, tritanopia
                highContrast: false,
                largeText: false,
                reducedMotion: false,
                screenReader: false,
                subtitles: false
            },
            ui: {
                showFPS: false,
                showDebugInfo: false,
                compactUI: false,
                tooltipDelay: 500,
                notificationDuration: 3000,
                hudOpacity: 1.0
            }
        };
    }

    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('luxuryAngler_settings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                
                // Merge with defaults to ensure all settings exist
                this.settings = this.mergeSettings(this.getDefaultSettings(), parsed);
                
                console.log('SettingsManager: Settings loaded from localStorage');
                this.emit('settingsLoaded', this.settings);
                return true;
            }
        } catch (error) {
            console.error('SettingsManager: Failed to load settings:', error);
            this.settings = this.getDefaultSettings();
        }
        return false;
    }

    saveSettings() {
        try {
            const settingsData = {
                settings: this.settings,
                timestamp: Date.now(),
                version: '1.0.0'
            };
            
            localStorage.setItem('luxuryAngler_settings', JSON.stringify(settingsData));
            console.log('SettingsManager: Settings saved to localStorage');
            this.emit('settingsSaved', this.settings);
            return true;
        } catch (error) {
            console.error('SettingsManager: Failed to save settings:', error);
            return false;
        }
    }

    mergeSettings(defaults, saved) {
        const merged = { ...defaults };
        
        for (const category in saved) {
            if (merged[category] && typeof merged[category] === 'object') {
                merged[category] = { ...merged[category], ...saved[category] };
            } else {
                merged[category] = saved[category];
            }
        }
        
        return merged;
    }

    // Get setting value
    get(category, key) {
        if (key) {
            return this.settings[category]?.[key];
        }
        return this.settings[category];
    }

    // Set setting value
    set(category, key, value) {
        if (!this.settings[category]) {
            this.settings[category] = {};
        }
        
        const oldValue = this.settings[category][key];
        this.settings[category][key] = value;
        
        // Auto-save settings
        this.saveSettings();
        
        // Emit change event
        this.emit('settingChanged', {
            category,
            key,
            value,
            oldValue
        });
        
        console.log(`SettingsManager: ${category}.${key} changed from ${oldValue} to ${value}`);
    }

    // Apply settings to game systems
    applySettings() {
        // Audio settings
        if (window.game && window.game.sound) {
            window.game.sound.volume = this.settings.audio.masterVolume;
            window.game.sound.mute = this.settings.audio.muted;
        }
        
        // Graphics settings
        if (this.settings.graphics.fullscreen && document.fullscreenEnabled) {
            // Handle fullscreen
        }
        
        this.emit('settingsApplied', this.settings);
    }

    // Reset to defaults
    resetToDefaults() {
        this.settings = this.getDefaultSettings();
        this.saveSettings();
        this.applySettings();
        this.emit('settingsReset', this.settings);
        console.log('SettingsManager: Settings reset to defaults');
    }

    // Export settings for backup
    exportSettings() {
        return JSON.stringify({
            settings: this.settings,
            timestamp: Date.now(),
            version: '1.0.0'
        }, null, 2);
    }

    // Import settings from backup
    importSettings(settingsJson) {
        try {
            const data = JSON.parse(settingsJson);
            this.settings = this.mergeSettings(this.getDefaultSettings(), data.settings);
            this.saveSettings();
            this.applySettings();
            this.emit('settingsImported', this.settings);
            console.log('SettingsManager: Settings imported successfully');
            return true;
        } catch (error) {
            console.error('SettingsManager: Failed to import settings:', error);
            return false;
        }
    }

    // Event system
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    // Validation
    validateSettings() {
        const errors = [];
        
        // Validate audio settings
        if (this.settings.audio.masterVolume < 0 || this.settings.audio.masterVolume > 1) {
            errors.push('Master volume must be between 0 and 1');
        }
        
        // Validate graphics settings
        const validQualities = ['low', 'medium', 'high', 'ultra'];
        if (!validQualities.includes(this.settings.graphics.quality)) {
            errors.push('Invalid graphics quality setting');
        }
        
        // Validate gameplay settings
        const validDifficulties = ['easy', 'normal', 'hard', 'expert'];
        if (!validDifficulties.includes(this.settings.gameplay.difficulty)) {
            errors.push('Invalid difficulty setting');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    // Get settings summary for display
    getSettingsSummary() {
        return {
            audio: `Volume: ${Math.round(this.settings.audio.masterVolume * 100)}%`,
            graphics: `Quality: ${this.settings.graphics.quality}`,
            gameplay: `Difficulty: ${this.settings.gameplay.difficulty}`,
            controls: `Mouse Sensitivity: ${this.settings.controls.mouseSensitivity}x`,
            accessibility: `High Contrast: ${this.settings.accessibility.highContrast ? 'On' : 'Off'}`
        };
    }
} 