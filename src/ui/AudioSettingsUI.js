/**
 * Audio Settings UI - User interface for managing audio settings
 * Provides comprehensive controls for the enhanced audio system including:
 * - Volume controls for all audio layers
 * - Audio quality settings
 * - Advanced feature toggles
 * - Audio diagnostics and testing
 */
export class AudioSettingsUI {
    constructor(scene, audioManager) {
        this.scene = scene;
        this.audioManager = audioManager;
        this.container = null;
        this.isVisible = false;
        
        // UI elements
        this.sliders = new Map();
        this.toggles = new Map();
        this.testButtons = new Map();
        this.infoDisplays = new Map();
        
        // Audio test samples
        this.testSamples = {
            music: 'music_fishing',
            sfx: 'sfx_cast',
            ambient: 'ambient_water_calm',
            ui: 'sfx_button'
        };
        
        this.initializeUI();
        console.log('AudioSettingsUI: Audio settings interface initialized');
    }

    /**
     * Initialize the audio settings UI
     */
    initializeUI() {
        this.createContainer();
        this.createVolumeControls();
        this.createAdvancedSettings();
        this.createAudioTesting();
        this.createDiagnostics();
        this.setupEventListeners();
        
        // Initially hidden
        this.hide();
    }

    /**
     * Create main container
     */
    createContainer() {
        this.container = this.scene.add.container(
            this.scene.sys.game.config.width / 2,
            this.scene.sys.game.config.height / 2
        );
        this.container.setDepth(15000);

        // Background panel
        const panelWidth = 600;
        const panelHeight = 500;
        
        const background = this.scene.add.graphics();
        background.fillStyle(0x1a1a1a, 0.95);
        background.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 10);
        background.lineStyle(2, 0x4CAF50);
        background.strokeRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 10);
        
        this.container.add(background);

        // Title
        const title = this.scene.add.text(0, -220, 'Audio Settings', {
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        
        this.container.add(title);

        // Close button
        const closeButton = this.scene.add.graphics();
        closeButton.fillStyle(0xff4444);
        closeButton.fillCircle(270, -220, 15);
        closeButton.lineStyle(2, 0xffffff);
        closeButton.strokeCircle(270, -220, 15);
        
        const closeX = this.scene.add.text(270, -220, '×', {
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        this.container.add([closeButton, closeX]);

        // Make close button interactive
        const closeArea = this.scene.add.zone(270, -220, 30, 30);
        closeArea.setInteractive();
        closeArea.on('pointerdown', () => this.hide());
        this.container.add(closeArea);
    }

    /**
     * Create volume control sliders
     */
    createVolumeControls() {
        const startY = -160;
        const spacing = 50;
        
        // Volume controls section title
        const volumeTitle = this.scene.add.text(-280, startY, 'Volume Controls', {
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#4CAF50'
        });
        this.container.add(volumeTitle);

        const volumeControls = [
            { key: 'masterVolume', label: 'Master Volume', current: this.audioManager.masterVolume },
            { key: 'musicVolume', label: 'Music', current: this.audioManager.musicVolume },
            { key: 'sfxVolume', label: 'Sound Effects', current: this.audioManager.sfxVolume },
            { key: 'ambientVolume', label: 'Ambient', current: this.audioManager.ambientVolume }
        ];

        volumeControls.forEach((control, index) => {
            const y = startY + 30 + (index * spacing);
            this.createVolumeSlider(control.key, control.label, control.current, -280, y);
        });

        // Mute toggle
        const muteY = startY + 30 + (volumeControls.length * spacing);
        this.createMuteToggle(-280, muteY);
    }

    /**
     * Create individual volume slider
     */
    createVolumeSlider(key, label, currentValue, x, y) {
        // Label
        const labelText = this.scene.add.text(x, y, label, {
            fontSize: '14px',
            color: '#ffffff'
        });
        this.container.add(labelText);

        // Slider background
        const sliderBg = this.scene.add.graphics();
        sliderBg.fillStyle(0x333333);
        sliderBg.fillRoundedRect(x + 120, y - 5, 150, 10, 5);
        this.container.add(sliderBg);

        // Slider fill
        const sliderFill = this.scene.add.graphics();
        sliderFill.fillStyle(0x4CAF50);
        sliderFill.fillRoundedRect(x + 120, y - 5, 150 * currentValue, 10, 5);
        this.container.add(sliderFill);

        // Slider handle
        const handleX = x + 120 + (150 * currentValue);
        const sliderHandle = this.scene.add.graphics();
        sliderHandle.fillStyle(0xffffff);
        sliderHandle.fillCircle(handleX, y, 8);
        sliderHandle.lineStyle(2, 0x4CAF50);
        sliderHandle.strokeCircle(handleX, y, 8);
        this.container.add(sliderHandle);

        // Value display
        const valueText = this.scene.add.text(x + 285, y, `${Math.round(currentValue * 100)}%`, {
            fontSize: '12px',
            color: '#cccccc'
        }).setOrigin(0, 0.5);
        this.container.add(valueText);

        // Interactive zone for slider
        const sliderZone = this.scene.add.zone(x + 145, y, 150, 20);
        sliderZone.setInteractive();
        
        const updateSlider = (pointer) => {
            const localX = pointer.x - this.container.x - (x + 120);
            const percentage = Math.max(0, Math.min(1, localX / 150));
            
            // Update visual
            sliderFill.clear();
            sliderFill.fillStyle(0x4CAF50);
            sliderFill.fillRoundedRect(x + 120, y - 5, 150 * percentage, 10, 5);
            
            sliderHandle.x = x + 120 + (150 * percentage);
            valueText.setText(`${Math.round(percentage * 100)}%`);
            
            // Update audio
            this.audioManager.updateAudioSettings(key, percentage);
        };

        sliderZone.on('pointerdown', updateSlider);
        sliderZone.on('pointermove', (pointer) => {
            if (pointer.isDown) updateSlider(pointer);
        });

        this.container.add(sliderZone);

        // Store references
        this.sliders.set(key, {
            fill: sliderFill,
            handle: sliderHandle,
            valueText: valueText,
            zone: sliderZone
        });
    }

    /**
     * Create mute toggle
     */
    createMuteToggle(x, y) {
        const muteLabel = this.scene.add.text(x, y, 'Mute All Audio', {
            fontSize: '14px',
            color: '#ffffff'
        });
        this.container.add(muteLabel);

        const isMuted = this.audioManager.muted;
        
        // Toggle background
        const toggleBg = this.scene.add.graphics();
        toggleBg.fillStyle(isMuted ? 0xff4444 : 0x333333);
        toggleBg.fillRoundedRect(x + 150, y - 8, 40, 16, 8);
        this.container.add(toggleBg);

        // Toggle handle
        const toggleHandle = this.scene.add.graphics();
        toggleHandle.fillStyle(0xffffff);
        const handleX = isMuted ? x + 170 : x + 158;
        toggleHandle.fillCircle(handleX, y, 6);
        this.container.add(toggleHandle);

        // Interactive zone
        const toggleZone = this.scene.add.zone(x + 170, y, 40, 20);
        toggleZone.setInteractive();
        toggleZone.on('pointerdown', () => {
            const newMuted = !this.audioManager.muted;
            this.audioManager.updateAudioSettings('muted', newMuted);
            
            // Update visual
            toggleBg.clear();
            toggleBg.fillStyle(newMuted ? 0xff4444 : 0x333333);
            toggleBg.fillRoundedRect(x + 150, y - 8, 40, 16, 8);
            
            toggleHandle.x = newMuted ? x + 170 : x + 158;
        });

        this.container.add(toggleZone);
        this.toggles.set('mute', { bg: toggleBg, handle: toggleHandle, zone: toggleZone });
    }

    /**
     * Create advanced settings
     */
    createAdvancedSettings() {
        const startY = 70;
        
        // Advanced settings title
        const advancedTitle = this.scene.add.text(-280, startY, 'Advanced Settings', {
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#4CAF50'
        });
        this.container.add(advancedTitle);

        const advancedToggles = [
            { key: 'enableDynamicMixing', label: 'Dynamic Mixing', description: 'Adjusts audio layers based on context' },
            { key: 'enableContextualAudio', label: 'Contextual Audio', description: 'Plays sounds based on game events' },
            { key: 'enableAudioAnalytics', label: 'Audio Analytics', description: 'Tracks audio usage for debugging' },
            { key: 'adaptiveVolumeEnabled', label: 'Adaptive Volume', description: 'Auto-adjusts volume for clarity' }
        ];

        advancedToggles.forEach((toggle, index) => {
            const y = startY + 30 + (index * 30);
            this.createAdvancedToggle(toggle.key, toggle.label, toggle.description, -280, y);
        });

        // Audio quality selector
        this.createAudioQualitySelector(-280, startY + 30 + (advancedToggles.length * 30));
    }

    /**
     * Create individual advanced setting toggle
     */
    createAdvancedToggle(key, label, description, x, y) {
        const isEnabled = this.audioManager.enhancedSettings[key];

        // Checkbox
        const checkbox = this.scene.add.graphics();
        checkbox.lineStyle(2, 0x4CAF50);
        checkbox.strokeRect(x, y - 8, 16, 16);
        if (isEnabled) {
            checkbox.fillStyle(0x4CAF50);
            checkbox.fillRect(x + 4, y - 4, 8, 8);
        }
        this.container.add(checkbox);

        // Label
        const labelText = this.scene.add.text(x + 25, y, label, {
            fontSize: '14px',
            color: '#ffffff'
        });
        this.container.add(labelText);

        // Interactive zone
        const toggleZone = this.scene.add.zone(x, y, 150, 20);
        toggleZone.setInteractive();
        toggleZone.on('pointerdown', () => {
            const newValue = !this.audioManager.enhancedSettings[key];
            this.audioManager.enhancedSettings[key] = newValue;

            // Update visual
            checkbox.clear();
            checkbox.lineStyle(2, 0x4CAF50);
            checkbox.strokeRect(x, y - 8, 16, 16);
            if (newValue) {
                checkbox.fillStyle(0x4CAF50);
                checkbox.fillRect(x + 4, y - 4, 8, 8);
            }
        });

        this.container.add(toggleZone);
        
        // Store reference
        this.toggles.set(key, { checkbox, label: labelText, zone: toggleZone });
    }

    /**
     * Create audio quality selector
     */
    createAudioQualitySelector(x, y) {
        const qualityLabel = this.scene.add.text(x, y, 'Audio Quality', {
            fontSize: '14px',
            color: '#ffffff'
        });
        this.container.add(qualityLabel);
        
        const currentQuality = this.audioManager.enhancedSettings.audioQuality;
        const qualityOptions = ['low', 'medium', 'high'];
        
        qualityOptions.forEach((quality, index) => {
            const optionX = x + 100 + (index * 60);
            const isSelected = quality === currentQuality;

            const optionText = this.scene.add.text(optionX, y, quality.toUpperCase(), {
                fontSize: '12px',
                color: isSelected ? '#4CAF50' : '#cccccc',
                fontStyle: isSelected ? 'bold' : 'normal'
            });
            this.container.add(optionText);

            const optionZone = this.scene.add.zone(optionX, y, 50, 20);
            optionZone.setInteractive();
            optionZone.on('pointerdown', () => {
                this.audioManager.enhancedSettings.audioQuality = quality;
                this.refreshAudioQualityDisplay();
            });
            this.container.add(optionZone);
        });
    }

    /**
     * Create audio testing section
     */
    createAudioTesting() {
        const startY = -160;
        const rightColumn = 50;
        
        // Audio testing title
        const testingTitle = this.scene.add.text(rightColumn, startY, 'Audio Testing', {
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#4CAF50'
        });
        this.container.add(testingTitle);

        const testButtons = [
            { key: 'music', label: 'Test Music', sample: this.testSamples.music },
            { key: 'sfx', label: 'Test SFX', sample: this.testSamples.sfx },
            { key: 'ambient', label: 'Test Ambient', sample: this.testSamples.ambient },
            { key: 'ui', label: 'Test UI Sounds', sample: this.testSamples.ui }
        ];

        testButtons.forEach((button, index) => {
            const y = startY + 30 + (index * 40);
            this.createTestButton(button.key, button.label, button.sample, rightColumn, y);
        });

        // Stop all audio button
        const stopAllY = startY + 30 + (testButtons.length * 40);
        this.createStopAllButton(rightColumn, stopAllY);
    }

    /**
     * Create test button
     */
    createTestButton(key, label, sample, x, y) {
        const button = this.scene.add.graphics();
        button.fillStyle(0x2196F3);
        button.fillRoundedRect(x, y, 120, 25, 5);
        button.lineStyle(1, 0xffffff);
        button.strokeRoundedRect(x, y, 120, 25, 5);
        this.container.add(button);

        const buttonText = this.scene.add.text(x + 60, y + 12, label, {
            fontSize: '12px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.container.add(buttonText);

        // Interactive zone
        const buttonZone = this.scene.add.zone(x + 60, y + 12, 120, 25);
        buttonZone.setInteractive();
        buttonZone.on('pointerdown', () => {
            this.playTestAudio(key, sample);
            
            // Visual feedback
            button.clear();
            button.fillStyle(0x4CAF50);
            button.fillRoundedRect(x, y, 120, 25, 5);
            button.lineStyle(1, 0xffffff);
            button.strokeRoundedRect(x, y, 120, 25, 5);
            
            setTimeout(() => {
                button.clear();
                button.fillStyle(0x2196F3);
                button.fillRoundedRect(x, y, 120, 25, 5);
                button.lineStyle(1, 0xffffff);
                button.strokeRoundedRect(x, y, 120, 25, 5);
            }, 200);
        });

        this.container.add(buttonZone);
        this.testButtons.set(key, { button, text: buttonText, zone: buttonZone });
    }

    /**
     * Create stop all audio button
     */
    createStopAllButton(x, y) {
        const button = this.scene.add.graphics();
        button.fillStyle(0xff4444);
        button.fillRoundedRect(x, y, 120, 25, 5);
        button.lineStyle(1, 0xffffff);
        button.strokeRoundedRect(x, y, 120, 25, 5);
        this.container.add(button);

        const buttonText = this.scene.add.text(x + 60, y + 12, 'Stop All Audio', {
            fontSize: '12px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.container.add(buttonText);

        // Interactive zone
        const buttonZone = this.scene.add.zone(x + 60, y + 12, 120, 25);
        buttonZone.setInteractive();
        buttonZone.on('pointerdown', () => {
            this.audioManager.emergencyReset();
            
            // Visual feedback
            button.clear();
            button.fillStyle(0x888888);
            button.fillRoundedRect(x, y, 120, 25, 5);
            
            setTimeout(() => {
                button.clear();
                button.fillStyle(0xff4444);
                button.fillRoundedRect(x, y, 120, 25, 5);
                button.lineStyle(1, 0xffffff);
                button.strokeRoundedRect(x, y, 120, 25, 5);
            }, 200);
        });

        this.container.add(buttonZone);
    }

    /**
     * Create diagnostics display
     */
    createDiagnostics() {
        const startY = 70;
        const rightColumn = 50;
        
        // Diagnostics title
        const diagTitle = this.scene.add.text(rightColumn, startY, 'Audio Diagnostics', {
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#4CAF50'
        });
        this.container.add(diagTitle);

        // Info displays
        const infoY = startY + 30;
        this.createInfoDisplay('currentMusic', 'Current Music:', 'None', rightColumn, infoY);
        this.createInfoDisplay('activeSounds', 'Active Sounds:', '0', rightColumn, infoY + 25);
        this.createInfoDisplay('totalPlayed', 'Total Played:', '0', rightColumn, infoY + 50);
        this.createInfoDisplay('sessionTime', 'Session Time:', '0:00', rightColumn, infoY + 75);

        // Refresh button
        this.createRefreshButton(rightColumn, infoY + 110);

        // Start diagnostics update timer
        this.startDiagnosticsTimer();
    }

    /**
     * Create info display
     */
    createInfoDisplay(key, label, initialValue, x, y) {
        const labelText = this.scene.add.text(x, y, label, {
            fontSize: '12px',
            color: '#cccccc'
        });
        
        const valueText = this.scene.add.text(x + 100, y, initialValue, {
            fontSize: '12px',
            color: '#ffffff'
        });
        
        this.container.add([labelText, valueText]);
        this.infoDisplays.set(key, { label: labelText, value: valueText });
    }

    /**
     * Create refresh button for diagnostics
     */
    createRefreshButton(x, y) {
        const button = this.scene.add.graphics();
        button.fillStyle(0x9C27B0);
        button.fillRoundedRect(x, y, 100, 20, 5);
        button.lineStyle(1, 0xffffff);
        button.strokeRoundedRect(x, y, 100, 20, 5);
        this.container.add(button);

        const buttonText = this.scene.add.text(x + 50, y + 10, 'Refresh Info', {
            fontSize: '10px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.container.add(buttonText);

        // Interactive zone
        const buttonZone = this.scene.add.zone(x + 50, y + 10, 100, 20);
        buttonZone.setInteractive();
        buttonZone.on('pointerdown', () => {
            this.updateDiagnostics();
        });

        this.container.add(buttonZone);
    }

    /**
     * Play test audio
     */
    playTestAudio(type, sample) {
        switch (type) {
            case 'music':
                this.audioManager.playMusic(sample, true);
                break;
            case 'sfx':
                this.audioManager.playSFX(sample);
                break;
            case 'ambient':
                this.audioManager.playAmbient(sample, 1.0, true);
                break;
            case 'ui':
                this.audioManager.playAudioEvent('ui', 'button_click');
                break;
        }
        
        console.log(`AudioSettingsUI: Playing test audio - ${type}: ${sample}`);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for audio events to update diagnostics
        if (this.audioManager.eventSystem) {
            this.audioManager.eventSystem.on('audio:played', () => {
                if (this.isVisible) this.updateDiagnostics();
            });
        }
    }

    /**
     * Start diagnostics update timer
     */
    startDiagnosticsTimer() {
        if (this.diagnosticsTimer) {
            clearInterval(this.diagnosticsTimer);
        }
        
        this.diagnosticsTimer = setInterval(() => {
            if (this.isVisible) {
                this.updateDiagnostics();
            }
        }, 2000); // Update every 2 seconds
    }

    /**
     * Update diagnostics display
     */
    updateDiagnostics() {
        if (!this.isVisible) return;
        
        const analytics = this.audioManager.getAudioAnalytics();
        const sessionTime = (Date.now() - analytics.sessionStartTime) / 1000;

        this.infoDisplays.get('totalPlayed').value.setText(`Sounds Played: ${analytics.totalPlayed}`);
        this.infoDisplays.get('sfxCount').value.setText(`SFX Count: ${analytics.sfxCount}`);
        this.infoDisplays.get('musicTime').value.setText(`Music Time: ${this.formatTime(analytics.musicTime)}`);
        this.infoDisplays.get('sessionTime').value.setText(`Session Time: ${this.formatTime(sessionTime * 1000)}`);
        this.infoDisplays.get('errorCount').value.setText(`Errors: ${analytics.errorCount}`);
    }

    /**
     * Format milliseconds to MM:SS
     */
    formatTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Refresh audio quality display
     */
    refreshAudioQualityDisplay() {
        const currentQuality = this.audioManager.enhancedSettings.audioQuality;
        // This needs a more robust way to get the text elements, for now, we assume their order
        // This part of the code is brittle and should be improved if quality options change
    }

    /**
     * Show the audio settings UI
     */
    show() {
        if (this.isVisible) return;
        this.isVisible = true;
        this.container.setVisible(true);
        this.updateDiagnostics();
        
        // Fade in animation
        this.container.setAlpha(0);
        this.scene.tweens.add({
            targets: this.container,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
        
        console.log('AudioSettingsUI: Audio settings panel opened');
    }

    /**
     * Hide the audio settings UI
     */
    hide() {
        this.isVisible = false;
        
        // Fade out animation
        this.scene.tweens.add({
            targets: this.container,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                this.container.setVisible(false);
                // Save settings when closing
                this.audioManager.saveAudioSettings();
            }
        });
        
        console.log('AudioSettingsUI: Audio settings panel closed');
    }

    /**
     * Toggle visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Destroy the audio settings UI
     */
    destroy() {
        if (this.diagnosticsTimer) {
            clearInterval(this.diagnosticsTimer);
        }
        
        if (this.container) {
            this.container.destroy();
        }
        
        this.sliders.clear();
        this.toggles.clear();
        this.testButtons.clear();
        this.infoDisplays.clear();
        
        console.log('AudioSettingsUI: Destroyed');
    }
}

export default AudioSettingsUI; 