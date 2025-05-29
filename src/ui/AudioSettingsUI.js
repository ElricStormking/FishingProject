export class AudioSettingsUI {
    constructor(scene, x, y, width, height) {
        console.log('AudioSettingsUI: Constructor called', { scene: scene.scene.key, x, y, width, height });
        
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        this.gameState = scene.gameState;
        this.settingsManager = this.gameState.settingsManager;
        this.audioManager = this.gameState.getAudioManager(scene);
        
        // UI state
        this.isVisible = false;
        this.sliders = {};
        this.toggles = {};
        
        // UI elements
        this.container = null;
        this.background = null;
        this.clickBlocker = null;
        
        this.createUI();
        this.setupEventListeners();
    }

    createUI() {
        // Click blocker to prevent clicks from passing through
        this.clickBlocker = this.scene.add.rectangle(
            this.x + this.width/2, 
            this.y + this.height/2, 
            this.width + 40, 
            this.height + 40
        ).setInteractive().setAlpha(0).setDepth(9999);
        
        this.clickBlocker.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
        });

        // Main container
        this.container = this.scene.add.container(this.x, this.y);
        this.container.setVisible(false);
        this.container.setDepth(10000);

        // Background
        this.background = this.scene.add.graphics();
        this.background.fillStyle(0x2a2a2a, 0.95);
        this.background.fillRoundedRect(0, 0, this.width, this.height, 10);
        this.background.lineStyle(2, 0x4a4a4a);
        this.background.strokeRoundedRect(0, 0, this.width, this.height, 10);
        
        // Make background interactive to block clicks
        this.background.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.width, this.height), Phaser.Geom.Rectangle.Contains);
        this.background.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
        });
        
        this.container.add(this.background);

        // Title
        const title = this.scene.add.text(this.width / 2, 30, 'AUDIO SETTINGS', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(title);

        // Close button
        const closeButton = this.scene.add.text(this.width - 30, 30, '×', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ff6666',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive();
        
        closeButton.on('pointerdown', () => {
            this.audioManager?.playSFX('button');
            this.hide();
        });
        closeButton.on('pointerover', () => closeButton.setColor('#ff9999'));
        closeButton.on('pointerout', () => closeButton.setColor('#ff6666'));
        this.container.add(closeButton);

        // Create volume controls
        this.createVolumeControls();

        // Create audio toggles
        this.createAudioToggles();

        // Create preset buttons
        this.createPresetButtons();

        // Create test buttons
        this.createTestButtons();
    }

    createVolumeControls() {
        const startY = 80;
        const spacing = 60;
        
        // Master Volume
        this.createVolumeSlider('masterVolume', 'Master Volume', 50, startY, 
            this.settingsManager.get('audio', 'masterVolume'));
        
        // Music Volume
        this.createVolumeSlider('musicVolume', 'Music Volume', 50, startY + spacing, 
            this.settingsManager.get('audio', 'musicVolume'));
        
        // SFX Volume
        this.createVolumeSlider('sfxVolume', 'Sound Effects', 50, startY + spacing * 2, 
            this.settingsManager.get('audio', 'sfxVolume'));
        
        // Ambient Volume
        this.createVolumeSlider('ambientVolume', 'Ambient Sounds', 50, startY + spacing * 3, 
            this.settingsManager.get('audio', 'ambientVolume'));
    }

    createVolumeSlider(key, label, x, y, initialValue) {
        // Label
        const labelText = this.scene.add.text(x, y, label, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.container.add(labelText);

        // Slider track
        const trackWidth = 200;
        const trackHeight = 6;
        const track = this.scene.add.graphics();
        track.fillStyle(0x4a4a4a);
        track.fillRoundedRect(x, y + 25, trackWidth, trackHeight, 3);
        this.container.add(track);

        // Slider fill
        const fill = this.scene.add.graphics();
        fill.fillStyle(0x4a90e2);
        fill.fillRoundedRect(x, y + 25, trackWidth * initialValue, trackHeight, 3);
        this.container.add(fill);

        // Slider handle
        const handle = this.scene.add.graphics();
        handle.fillStyle(0x6bb6ff);
        handle.fillCircle(x + trackWidth * initialValue, y + 28, 12);
        handle.lineStyle(2, 0xffffff);
        handle.strokeCircle(x + trackWidth * initialValue, y + 28, 12);
        this.container.add(handle);

        // Value display
        const valueText = this.scene.add.text(x + trackWidth + 20, y + 20, 
            Math.round(initialValue * 100) + '%', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#cccccc'
        });
        this.container.add(valueText);

        // Make slider interactive
        const sliderArea = this.scene.add.rectangle(x + trackWidth/2, y + 28, trackWidth + 24, 40)
            .setInteractive()
            .setAlpha(0);

        let isDragging = false;

        sliderArea.on('pointerdown', (pointer) => {
            isDragging = true;
            this.updateSlider(key, pointer.x - (this.x + x), trackWidth, fill, handle, valueText);
        });

        this.scene.input.on('pointermove', (pointer) => {
            if (isDragging) {
                this.updateSlider(key, pointer.x - (this.x + x), trackWidth, fill, handle, valueText);
            }
        });

        this.scene.input.on('pointerup', () => {
            isDragging = false;
        });

        this.container.add(sliderArea);

        // Store references
        this.sliders[key] = {
            track, fill, handle, valueText, x, y, trackWidth,
            area: sliderArea, label: labelText
        };
    }

    updateSlider(key, pointerX, trackWidth, fill, handle, valueText) {
        const value = Math.max(0, Math.min(1, pointerX / trackWidth));
        
        // Update visual elements
        fill.clear();
        fill.fillStyle(0x4a90e2);
        fill.fillRoundedRect(this.sliders[key].x, this.sliders[key].y + 25, trackWidth * value, 6, 3);
        
        handle.clear();
        handle.fillStyle(0x6bb6ff);
        handle.fillCircle(this.sliders[key].x + trackWidth * value, this.sliders[key].y + 28, 12);
        handle.lineStyle(2, 0xffffff);
        handle.strokeCircle(this.sliders[key].x + trackWidth * value, this.sliders[key].y + 28, 12);
        
        valueText.setText(Math.round(value * 100) + '%');
        
        // Update settings
        this.settingsManager.set('audio', key, value);
        
        // Play feedback sound for non-master volume changes
        if (key !== 'masterVolume') {
            this.audioManager?.playSFX('button', 0.3);
        }
    }

    createAudioToggles() {
        const startY = 320;
        const spacing = 40;
        
        // Mute toggle
        this.createToggle('muted', 'Mute All Audio', 50, startY, 
            this.settingsManager.get('audio', 'muted'));
        
        // Music enabled toggle
        this.createToggle('musicEnabled', 'Enable Music', 50, startY + spacing, 
            this.settingsManager.get('audio', 'musicEnabled'));
        
        // SFX enabled toggle
        this.createToggle('sfxEnabled', 'Enable Sound Effects', 50, startY + spacing * 2, 
            this.settingsManager.get('audio', 'sfxEnabled'));
    }

    createToggle(key, label, x, y, initialValue) {
        // Label
        const labelText = this.scene.add.text(x + 40, y, label, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        this.container.add(labelText);

        // Toggle background
        const toggleBg = this.scene.add.graphics();
        toggleBg.fillStyle(initialValue ? 0x44aa44 : 0x666666);
        toggleBg.fillRoundedRect(x, y - 5, 30, 20, 10);
        this.container.add(toggleBg);

        // Toggle handle
        const toggleHandle = this.scene.add.graphics();
        toggleHandle.fillStyle(0xffffff);
        toggleHandle.fillCircle(x + (initialValue ? 22 : 8), y + 5, 7);
        this.container.add(toggleHandle);

        // Make toggle interactive
        const toggleArea = this.scene.add.rectangle(x + 15, y + 5, 30, 20)
            .setInteractive()
            .setAlpha(0);

        toggleArea.on('pointerdown', () => {
            const newValue = !this.settingsManager.get('audio', key);
            this.updateToggle(key, newValue, toggleBg, toggleHandle);
            this.audioManager?.playSFX('button');
        });

        this.container.add(toggleArea);

        // Store references
        this.toggles[key] = {
            bg: toggleBg, handle: toggleHandle, area: toggleArea, 
            label: labelText, x, y
        };
    }

    updateToggle(key, value, toggleBg, toggleHandle) {
        // Update visual elements
        toggleBg.clear();
        toggleBg.fillStyle(value ? 0x44aa44 : 0x666666);
        toggleBg.fillRoundedRect(this.toggles[key].x, this.toggles[key].y - 5, 30, 20, 10);
        
        toggleHandle.clear();
        toggleHandle.fillStyle(0xffffff);
        toggleHandle.fillCircle(this.toggles[key].x + (value ? 22 : 8), this.toggles[key].y + 5, 7);
        
        // Update settings
        this.settingsManager.set('audio', key, value);
    }

    createPresetButtons() {
        const startY = 450;
        const buttonWidth = 100;
        const spacing = 110;
        
        // Preset buttons
        this.createPresetButton('Silent', 50, startY, () => this.applyPreset('silent'));
        this.createPresetButton('Quiet', 50 + spacing, startY, () => this.applyPreset('quiet'));
        this.createPresetButton('Normal', 50 + spacing * 2, startY, () => this.applyPreset('normal'));
        this.createPresetButton('Loud', 50 + spacing * 3, startY, () => this.applyPreset('loud'));
    }

    createPresetButton(text, x, y, callback) {
        const button = this.scene.add.graphics();
        button.fillStyle(0x4a90e2);
        button.fillRoundedRect(x, y, 90, 30, 5);
        button.lineStyle(1, 0x6bb6ff);
        button.strokeRoundedRect(x, y, 90, 30, 5);

        const buttonText = this.scene.add.text(x + 45, y + 15, text, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const buttonArea = this.scene.add.rectangle(x + 45, y + 15, 90, 30)
            .setInteractive()
            .setAlpha(0);

        buttonArea.on('pointerdown', () => {
            this.audioManager?.playSFX('button');
            callback();
        });

        buttonArea.on('pointerover', () => {
            button.clear();
            button.fillStyle(0x6bb6ff);
            button.fillRoundedRect(x, y, 90, 30, 5);
            button.lineStyle(1, 0x4a90e2);
            button.strokeRoundedRect(x, y, 90, 30, 5);
        });

        buttonArea.on('pointerout', () => {
            button.clear();
            button.fillStyle(0x4a90e2);
            button.fillRoundedRect(x, y, 90, 30, 5);
            button.lineStyle(1, 0x6bb6ff);
            button.strokeRoundedRect(x, y, 90, 30, 5);
        });

        this.container.add([button, buttonText, buttonArea]);
    }

    createTestButtons() {
        const startY = 500;
        const spacing = 110;
        
        // Test buttons
        this.createTestButton('Test Music', 50, startY, () => {
            this.audioManager?.playMusic('music_boat', true, 500);
        });
        
        this.createTestButton('Test SFX', 50 + spacing, startY, () => {
            this.audioManager?.playSFX('coin');
        });
        
        this.createTestButton('Test Ambient', 50 + spacing * 2, startY, () => {
            this.audioManager?.playAmbient('ambient_water', 1.0, true);
        });
        
        this.createTestButton('Stop All', 50 + spacing * 3, startY, () => {
            this.audioManager?.stopAllSounds();
        });
    }

    createTestButton(text, x, y, callback) {
        const button = this.scene.add.graphics();
        button.fillStyle(0x666666);
        button.fillRoundedRect(x, y, 90, 30, 5);
        button.lineStyle(1, 0x888888);
        button.strokeRoundedRect(x, y, 90, 30, 5);

        const buttonText = this.scene.add.text(x + 45, y + 15, text, {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const buttonArea = this.scene.add.rectangle(x + 45, y + 15, 90, 30)
            .setInteractive()
            .setAlpha(0);

        buttonArea.on('pointerdown', () => {
            this.audioManager?.playSFX('button');
            callback();
        });

        buttonArea.on('pointerover', () => {
            button.clear();
            button.fillStyle(0x888888);
            button.fillRoundedRect(x, y, 90, 30, 5);
            button.lineStyle(1, 0x666666);
            button.strokeRoundedRect(x, y, 90, 30, 5);
        });

        buttonArea.on('pointerout', () => {
            button.clear();
            button.fillStyle(0x666666);
            button.fillRoundedRect(x, y, 90, 30, 5);
            button.lineStyle(1, 0x888888);
            button.strokeRoundedRect(x, y, 90, 30, 5);
        });

        this.container.add([button, buttonText, buttonArea]);
    }

    applyPreset(presetName) {
        const presets = {
            silent: {
                masterVolume: 0,
                musicVolume: 0,
                sfxVolume: 0,
                ambientVolume: 0,
                muted: true
            },
            quiet: {
                masterVolume: 0.3,
                musicVolume: 0.2,
                sfxVolume: 0.4,
                ambientVolume: 0.2,
                muted: false
            },
            normal: {
                masterVolume: 1.0,
                musicVolume: 0.8,
                sfxVolume: 1.0,
                ambientVolume: 0.6,
                muted: false
            },
            loud: {
                masterVolume: 1.0,
                musicVolume: 1.0,
                sfxVolume: 1.0,
                ambientVolume: 0.8,
                muted: false
            }
        };

        const preset = presets[presetName];
        if (preset) {
            // Apply all settings
            Object.entries(preset).forEach(([key, value]) => {
                this.settingsManager.set('audio', key, value);
            });
            
            // Update UI to reflect changes
            this.refreshUI();
            
            this.showMessage(`Applied ${presetName} preset`, 0x44aa44);
        }
    }

    refreshUI() {
        // Update sliders
        Object.entries(this.sliders).forEach(([key, slider]) => {
            const value = this.settingsManager.get('audio', key);
            this.updateSlider(key, value * slider.trackWidth, slider.trackWidth, 
                slider.fill, slider.handle, slider.valueText);
        });

        // Update toggles
        Object.entries(this.toggles).forEach(([key, toggle]) => {
            const value = this.settingsManager.get('audio', key);
            this.updateToggle(key, value, toggle.bg, toggle.handle);
        });
    }

    show() {
        this.isVisible = true;
        this.clickBlocker.setVisible(true);
        this.container.setVisible(true);
        this.refreshUI();
    }

    hide() {
        this.isVisible = false;
        this.clickBlocker.setVisible(false);
        this.container.setVisible(false);
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    showMessage(text, color) {
        const message = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2,
            text,
            {
                fontSize: '18px',
                fill: '#ffffff',
                fontFamily: 'Arial',
                backgroundColor: Phaser.Display.Color.IntegerToColor(color).rgba,
                padding: { x: 16, y: 8 }
            }
        );
        message.setOrigin(0.5);
        message.setDepth(11000);

        this.scene.tweens.add({
            targets: message,
            alpha: 0,
            y: message.y - 50,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => message.destroy()
        });
    }

    setupEventListeners() {
        // Listen for settings changes from other sources
        this.settingsManager.on('settingChanged', (data) => {
            if (data.category === 'audio' && this.isVisible) {
                this.refreshUI();
            }
        });
    }

    destroy() {
        if (this.clickBlocker) {
            this.clickBlocker.destroy();
        }
        if (this.container) {
            this.container.destroy();
        }
    }
}

export default AudioSettingsUI; 