import Phaser from 'phaser';
import InputManager from '../scripts/InputManager.js';

export default class SettingsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SettingsScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x2c3e50);

        // Title
        const title = this.add.text(width / 2, 60, 'SETTINGS', {
            fontSize: '36px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);

        // Create input manager for this scene
        this.inputManager = new InputManager(this);

        // Current remapping state
        this.isRemapping = false;
        this.remappingAction = null;
        this.remappingElement = null;

        // Create tabs
        this.currentTab = 'controls';
        this.createTabs();
        this.createControlsTab();

        // Back button
        this.createButton(width / 2, height - 60, 'BACK', () => {
            this.scene.start('MenuScene');
        });

        // Listen for input events
        this.events.on('input:menu', () => {
            if (!this.isRemapping) {
                this.scene.start('MenuScene');
            }
        });

        // Listen for key presses during remapping
        this.input.keyboard.on('keydown', (event) => {
            if (this.isRemapping) {
                this.handleRemapping(event.code);
            }
        });
    }

    createTabs() {
        const width = this.cameras.main.width;
        const tabY = 120;

        // Controls tab
        this.controlsTab = this.createTab(width / 2 - 100, tabY, 'CONTROLS', () => {
            this.switchTab('controls');
        });

        // Audio tab (placeholder)
        this.audioTab = this.createTab(width / 2 + 100, tabY, 'AUDIO', () => {
            this.switchTab('audio');
        });

        this.updateTabVisuals();
    }

    createTab(x, y, text, callback) {
        const tab = this.add.rectangle(x, y, 150, 40, 0x34495e);
        const tabText = this.add.text(x, y, text, {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        tabText.setOrigin(0.5);

        tab.setInteractive();
        tab.on('pointerdown', callback);

        return { button: tab, text: tabText };
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        this.updateTabVisuals();
        
        // Clear current content
        if (this.tabContent) {
            this.tabContent.forEach(item => item.destroy());
        }
        this.tabContent = [];

        // Create new content
        if (tabName === 'controls') {
            this.createControlsTab();
        } else if (tabName === 'audio') {
            this.createAudioTab();
        }
    }

    updateTabVisuals() {
        // Update tab colors
        this.controlsTab.button.setFillStyle(this.currentTab === 'controls' ? 0x3498db : 0x34495e);
        this.audioTab.button.setFillStyle(this.currentTab === 'audio' ? 0x3498db : 0x34495e);
    }

    createControlsTab() {
        const width = this.cameras.main.width;
        let y = 200;
        this.tabContent = [];

        // Instructions
        const instructions = this.add.text(width / 2, y, 'Click on a key binding to change it', {
            fontSize: '18px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        });
        instructions.setOrigin(0.5);
        this.tabContent.push(instructions);
        y += 50;

        // Get current bindings
        const bindings = this.inputManager.getBindings();

        // Create binding rows
        const actions = [
            { key: 'moveUp', label: 'Move Up' },
            { key: 'moveDown', label: 'Move Down' },
            { key: 'moveLeft', label: 'Move Left' },
            { key: 'moveRight', label: 'Move Right' },
            { key: 'cast', label: 'Cast/Reel' },
            { key: 'menu', label: 'Menu' },
            { key: 'inventory', label: 'Inventory' },
            { key: 'shop', label: 'Shop' }
        ];

        actions.forEach(action => {
            const row = this.createBindingRow(action.key, action.label, bindings[action.key], y);
            this.tabContent.push(...row);
            y += 40;
        });

        // Reset button
        const resetButton = this.createButton(width / 2, y + 20, 'RESET TO DEFAULTS', () => {
            this.resetBindings();
        });
        this.tabContent.push(resetButton.button, resetButton.text);
    }

    createBindingRow(actionKey, label, keys, y) {
        const elements = [];
        
        // Action label
        const actionLabel = this.add.text(100, y, label + ':', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        elements.push(actionLabel);

        // Key bindings
        let x = 300;
        keys.forEach((key, index) => {
            const keyButton = this.add.rectangle(x, y, 80, 30, 0x34495e);
            const keyText = this.add.text(x, y, this.formatKeyName(key), {
                fontSize: '14px',
                fill: '#ffffff',
                fontFamily: 'Arial'
            });
            keyText.setOrigin(0.5);

            keyButton.setInteractive();
            keyButton.on('pointerover', () => keyButton.setFillStyle(0x3498db));
            keyButton.on('pointerout', () => keyButton.setFillStyle(0x34495e));
            keyButton.on('pointerdown', () => {
                this.startRemapping(actionKey, key, keyText);
            });

            elements.push(keyButton, keyText);
            x += 100;
        });

        return elements;
    }

    formatKeyName(keyCode) {
        // Convert key codes to readable names
        const keyNames = {
            'KeyW': 'W',
            'KeyA': 'A',
            'KeyS': 'S',
            'KeyD': 'D',
            'ArrowUp': '↑',
            'ArrowDown': '↓',
            'ArrowLeft': '←',
            'ArrowRight': '→',
            'Space': 'SPACE',
            'Escape': 'ESC',
            'Enter': 'ENTER',
            'KeyI': 'I',
            'KeyP': 'P'
        };

        return keyNames[keyCode] || keyCode;
    }

    startRemapping(actionKey, oldKey, textElement) {
        if (this.isRemapping) return;

        this.isRemapping = true;
        this.remappingAction = actionKey;
        this.remappingOldKey = oldKey;
        this.remappingElement = textElement;

        // Visual feedback
        textElement.setText('Press key...');
        textElement.setColor('#ffff00');

        // Show instruction
        this.remappingInstruction = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            'Press the new key for this action\nPress ESC to cancel',
            {
                fontSize: '20px',
                fill: '#ffff00',
                fontFamily: 'Arial',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 },
                align: 'center'
            }
        );
        this.remappingInstruction.setOrigin(0.5);
    }

    handleRemapping(newKeyCode) {
        if (!this.isRemapping) return;

        // Cancel remapping
        if (newKeyCode === 'Escape') {
            this.cancelRemapping();
            return;
        }

        // Apply new binding
        const success = this.inputManager.rebindKey(
            this.remappingAction,
            this.remappingOldKey,
            newKeyCode
        );

        if (success) {
            this.remappingElement.setText(this.formatKeyName(newKeyCode));
            this.remappingElement.setColor('#ffffff');
            this.showNotification('Key binding updated!');
        } else {
            this.showNotification('Failed to update binding!');
        }

        this.endRemapping();
    }

    cancelRemapping() {
        this.remappingElement.setText(this.formatKeyName(this.remappingOldKey));
        this.remappingElement.setColor('#ffffff');
        this.endRemapping();
    }

    endRemapping() {
        this.isRemapping = false;
        this.remappingAction = null;
        this.remappingOldKey = null;
        this.remappingElement = null;

        if (this.remappingInstruction) {
            this.remappingInstruction.destroy();
            this.remappingInstruction = null;
        }
    }

    resetBindings() {
        this.inputManager.resetToDefaults();
        this.showNotification('Bindings reset to defaults!');
        
        // Refresh the controls tab
        this.switchTab('controls');
    }

    createAudioTab() {
        const width = this.cameras.main.width;
        let y = 200;
        this.tabContent = [];

        // Placeholder for audio settings
        const placeholder = this.add.text(width / 2, y, 'Audio settings coming soon...', {
            fontSize: '20px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        });
        placeholder.setOrigin(0.5);
        this.tabContent.push(placeholder);
    }

    createButton(x, y, text, callback) {
        const button = this.add.rectangle(x, y, 200, 50, 0x34495e);
        const buttonText = this.add.text(x, y, text, {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        buttonText.setOrigin(0.5);

        button.setInteractive();
        button.on('pointerover', () => button.setFillStyle(0x3498db));
        button.on('pointerout', () => button.setFillStyle(0x34495e));
        button.on('pointerdown', callback);

        return { button, text: buttonText };
    }

    showNotification(text) {
        const notification = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 150,
            text,
            {
                fontSize: '18px',
                fill: '#00ff00',
                fontFamily: 'Arial',
                backgroundColor: '#000000',
                padding: { x: 16, y: 8 }
            }
        );
        notification.setOrigin(0.5);

        this.tweens.add({
            targets: notification,
            alpha: 0,
            y: notification.y - 30,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => notification.destroy()
        });
    }

    update() {
        if (this.inputManager) {
            this.inputManager.update();
        }
    }

    destroy() {
        if (this.inputManager) {
            this.inputManager.destroy();
        }
        super.destroy();
    }
} 