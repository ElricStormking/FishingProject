import Phaser from 'phaser';
import InputManager from '../scripts/InputManager.js';
import UITheme from '../ui/UITheme.js';

export default class SettingsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SettingsScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background using UITheme
        const background = UITheme.createPanel(this, 0, 0, width, height, 'primary');
        this.add.existing(background);

        // Title using UITheme
        const title = UITheme.createText(this, width / 2, 60, 'SETTINGS', 'headerLarge');
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
        const tabWidth = 150;
        const tabHeight = 40;

        // Controls tab
        this.controlsTab = this.createTab(width / 2 - (tabWidth / 2 + 10), tabY, tabWidth, tabHeight, 'CONTROLS', () => {
            this.switchTab('controls');
        });

        // Audio tab
        this.audioTab = this.createTab(width / 2 + (tabWidth / 2 + 10), tabY, tabWidth, tabHeight, 'AUDIO', () => {
            this.switchTab('audio');
        });

        this.updateTabVisuals();
    }

    createTab(x, y, width, height, text, callback) {
        // Use UITheme.createButton for tabs
        const tabComponent = UITheme.createButton(this, x, y, width, height, text, callback, 'tab'); // Assuming 'tab' is a style in UITheme
        // If createButton returns a container with button and text, you might need to manage them for visual updates
        return tabComponent; 
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
        try {
            // Update tab colors/styles based on UITheme properties
            const activeStyle = UITheme.getButtonStyle('tabActive');
            const inactiveStyle = UITheme.getButtonStyle('tab');

            // Helper to apply style - properly redraw graphics objects
            const applyStyle = (tabComponent, style) => {
                try {
                    if (tabComponent && tabComponent.button && tabComponent.text && style) {
                        // Clear and redraw the button graphics
                        const button = tabComponent.button;
                        const text = tabComponent.text;
                        
                        // Use fixed dimensions since tabs have standard sizes
                        const width = 150; // standard tab width
                        const height = 40; // standard tab height
                        
                        // Clear and redraw button
                        button.clear();
                        button.fillStyle(style.fillColor);
                        button.fillRoundedRect(-width/2, -height/2, width, height, style.radius);
                        button.lineStyle(style.strokeWidth, style.strokeColor);
                        button.strokeRoundedRect(-width/2, -height/2, width, height, style.radius);
                        
                        // Update text style
                        if (text && style.textStyle) {
                            text.setStyle(style.textStyle);
                        }
                    }
                } catch (error) {
                    console.error('SettingsScene: Error applying tab style:', error);
                }
            };

            if (this.controlsTab) {
                applyStyle(this.controlsTab, this.currentTab === 'controls' ? activeStyle : inactiveStyle);
            }
            if (this.audioTab) {
                applyStyle(this.audioTab, this.currentTab === 'audio' ? activeStyle : inactiveStyle);
            }
        } catch (error) {
            console.error('SettingsScene: Error in updateTabVisuals:', error);
        }
    }

    createControlsTab() {
        const width = this.cameras.main.width;
        let y = 200;
        this.tabContent = [];

        // Instructions using UITheme
        const instructions = UITheme.createText(this, width / 2, y, 'Click on a key binding to change it', 'bodyLarge');
        instructions.setOrigin(0.5);
        instructions.setColor(UITheme.colors.textSecondary);
        this.tabContent.push(instructions);
        y += 50;

        // Get current bindings with error handling
        let bindings;
        try {
            if (!this.inputManager) {
                console.error('SettingsScene: InputManager not initialized');
                // Create a fallback to prevent crashes
                bindings = {
                    moveUp: ['KeyW'],
                    moveDown: ['KeyS'],
                    moveLeft: ['KeyA'],
                    moveRight: ['KeyD'],
                    cast: ['Space'],
                    menu: ['Escape'],
                    inventory: ['KeyI'],
                    shop: ['KeyP']
                };
            } else {
                bindings = this.inputManager.getBindings();
            }
            
            if (!bindings) {
                console.error('SettingsScene: Failed to get bindings from InputManager');
                return;
            }
        } catch (error) {
            console.error('SettingsScene: Error getting bindings:', error);
            return;
        }

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
            try {
                const actionBindings = bindings[action.key];
                if (actionBindings && Array.isArray(actionBindings)) {
                    const row = this.createBindingRow(action.key, action.label, actionBindings, y);
                    this.tabContent.push(...row);
                } else {
                    console.warn(`SettingsScene: No bindings found for action ${action.key}`);
                    // Create a placeholder or empty row
                    const placeholder = UITheme.createText(this, 100, y, `${action.label}: [Not configured]`, 'bodyMedium');
                    this.tabContent.push(placeholder);
                }
                y += 40;
            } catch (error) {
                console.error(`SettingsScene: Error creating row for action ${action.key}:`, error);
                y += 40; // Still increment y to avoid overlapping
            }
        });

        // Reset button
        const resetButton = this.createButton(width / 2, y + 20, 'RESET TO DEFAULTS', () => {
            this.resetBindings();
        });
        this.tabContent.push(resetButton.button, resetButton.text);
    }

    createBindingRow(actionKey, label, keys, y) {
        const elements = [];
        
        // Action label using UITheme
        const actionLabel = UITheme.createText(this, 100, y, label + ':', 'bodyMedium');
        // actionLabel.setColor(UITheme.colors.text); // Optional: if specific color needed
        elements.push(actionLabel);

        // Key bindings
        let x = 300;
        keys.forEach((key, index) => {
            const keyButtonComponent = UITheme.createButton(
                this, 
                x, 
                y, 
                80, 
                30, 
                this.formatKeyName(key), 
                () => { this.startRemapping(actionKey, key, keyButtonComponent.text || keyButtonComponent); }, // Pass text part of component or whole component
                'keybinding' // Assuming 'keybinding' is a style in UITheme
            );
            
            // Add button components to elements array and scene
            if (keyButtonComponent.button) elements.push(keyButtonComponent.button);
            if (keyButtonComponent.text) elements.push(keyButtonComponent.text);
            // If createButton itself is the display object, add it.
            // else if (!(keyButtonComponent.button || keyButtonComponent.text)) elements.push(keyButtonComponent);

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
        this.remappingInstruction = UITheme.createText(
            this,
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            'Press the new key for this action\nPress ESC to cancel',
            'overlayNotification' // Assuming 'overlayNotification' style in UITheme
        );
        this.remappingInstruction.setOrigin(0.5);
        // this.remappingInstruction.setColor(UITheme.colors.warning); // Example style
        // this.remappingInstruction.setBackgroundColor(UITheme.colors.overlay); // Example style
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

        // Placeholder for audio settings using UITheme
        const placeholder = UITheme.createText(this, width / 2, y, 'Audio settings coming soon...', 'bodyLarge');
        placeholder.setOrigin(0.5);
        placeholder.setColor(UITheme.colors.textSecondary);
        this.tabContent.push(placeholder);
    }

    createButton(x, y, text, callback) {
        // Refactored to use UITheme.createButton
        const buttonComponent = UITheme.createButton(this, x, y, 200, 50, text, callback, 'primary');
        // Assuming createButton adds elements to the scene directly or returns a container
        // If it returns a container with button and text, they might need to be added to tabContent if applicable
        return buttonComponent;
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