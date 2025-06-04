import Phaser from 'phaser';

export default class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.enabled = true; // Allow external systems to disable input handling
        this.bindings = this.loadBindings();
        this.activeKeys = {};
        this.gamepadIndex = 0;
        this.gamepad = null;
        
        this.setupKeyboard();
        this.setupGamepad();
        this.setupMouse();
    }

    // Default key bindings
    getDefaultBindings() {
        return {
            // Movement
            moveUp: ['KeyW', 'ArrowUp'],
            moveDown: ['KeyS', 'ArrowDown'],
            moveLeft: ['KeyA', 'ArrowLeft'],
            moveRight: ['KeyD', 'ArrowRight'],
            
            // Fishing actions
            cast: ['Space'],
            reel: ['Space'],
            hook: ['Space'],
            
            // UI actions
            menu: ['Escape'],
            inventory: ['KeyI'],
            shop: ['KeyP'],
            questLog: ['KeyQ'],
            confirm: ['Enter'],
            cancel: ['Escape'],
            
            // Camera
            cameraZoomIn: ['Equal'],
            cameraZoomOut: ['Minus'],
            
            // Debug
            debug: ['F1']
        };
    }

    // Load key bindings (could be from localStorage)
    loadBindings() {
        try {
            const stored = localStorage.getItem('fishingGameKeyBindings');
            if (stored) {
                return { ...this.getDefaultBindings(), ...JSON.parse(stored) };
            }
        } catch (error) {
            console.warn('InputManager: Could not load key bindings from storage:', error);
        }
        return this.getDefaultBindings();
    }

    // Save key bindings
    saveBindings() {
        try {
            localStorage.setItem('fishingGameKeyBindings', JSON.stringify(this.bindings));
        } catch (error) {
            console.warn('InputManager: Could not save key bindings to storage:', error);
        }
    }

    setupKeyboard() {
        if (!this.scene.input || !this.scene.input.keyboard) {
            console.warn('InputManager: Keyboard input not available');
            return;
        }

        this.scene.input.keyboard.on('keydown', (event) => {
            if (!event || !event.code) return;
            
            this.activeKeys[event.code] = true;
            
            // Find which action this key corresponds to
            for (const [action, keys] of Object.entries(this.bindings)) {
                if (keys.includes(event.code)) {
                    this.triggerAction(action, true, 'keyboard');
                    break;
                }
            }
        });

        this.scene.input.keyboard.on('keyup', (event) => {
            if (!event || !event.code) return;
            
            this.activeKeys[event.code] = false;
            
            // Find which action this key corresponds to
            for (const [action, keys] of Object.entries(this.bindings)) {
                if (keys.includes(event.code)) {
                    this.triggerAction(action, false, 'keyboard');
                    break;
                }
            }
        });
    }

    setupMouse() {
        if (!this.scene.input) {
            console.warn('InputManager: Mouse input not available');
            return;
        }

        this.mouseButtons = {
            left: false,
            right: false,
            middle: false
        };

        this.scene.input.on('pointerdown', (pointer) => {
            if (!pointer) return;
            
            try {
                if (pointer.leftButtonDown && pointer.leftButtonDown()) this.mouseButtons.left = true;
                if (pointer.rightButtonDown && pointer.rightButtonDown()) this.mouseButtons.right = true;
                if (pointer.middleButtonDown && pointer.middleButtonDown()) this.mouseButtons.middle = true;
                
                this.handleMousePress(pointer, true);
            } catch (error) {
                console.warn('InputManager: Error in pointerdown handler:', error);
            }
        });

        this.scene.input.on('pointerup', (pointer) => {
            if (!pointer) return;
            
            try {
                this.mouseButtons.left = false;
                this.mouseButtons.right = false;
                this.mouseButtons.middle = false;
                
                this.handleMousePress(pointer, false);
            } catch (error) {
                console.warn('InputManager: Error in pointerup handler:', error);
            }
        });
    }

    handleMousePress(pointer, isDown) {
        if (!pointer) return;
        
        try {
            // Handle mouse-specific actions
            if (pointer.leftButtonDown && pointer.leftButtonDown() && isDown) {
                this.triggerAction('mouseLeft', true, 'mouse');
            }
            if (pointer.rightButtonDown && pointer.rightButtonDown() && isDown) {
                this.triggerAction('mouseRight', true, 'mouse');
            }
        } catch (error) {
            console.warn('InputManager: Error handling mouse press:', error);
        }
    }

    triggerAction(action, isDown, inputType) {
        if (!this.enabled) return; // Respect enabled flag
        if (!this.scene || !this.scene.events) return;
        
        try {
            // Emit events that scenes can listen to
            this.scene.events.emit('input:' + action, {
                action,
                isDown,
                inputType,
                timestamp: Date.now()
            });

            // Visual feedback for key presses
            if (isDown) {
                this.showInputFeedback(action, inputType);
            }
        } catch (error) {
            console.warn('InputManager: Error triggering action:', error);
        }
    }

    showInputFeedback(action, inputType) {
        if (!this.scene || !this.scene.add || !this.scene.cameras || !this.scene.tweens) return;
        
        try {
            // Create visual feedback for input
            const feedback = this.scene.add.text(
                this.scene.cameras.main.width - 200,
                this.scene.cameras.main.height - 100,
                `${action.toUpperCase()} (${inputType})`,
                {
                    fontSize: '14px',
                    fill: '#00ff00',
                    backgroundColor: '#000000',
                    padding: { x: 8, y: 4 }
                }
            );

            // Fade out feedback
            this.scene.tweens.add({
                targets: feedback,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    if (feedback && feedback.destroy) {
                        feedback.destroy();
                    }
                }
            });
        } catch (error) {
            console.warn('InputManager: Error showing input feedback:', error);
        }
    }

    // Check if an action is currently active
    isActionActive(action) {
        if (!this.bindings[action]) return false;
        
        const keys = this.bindings[action] || [];
        return keys.some(key => this.activeKeys[key]);
    }

    // Check if an action was just pressed this frame
    isActionJustPressed(action) {
        // For now, we'll handle this through the event system
        // This method can be enhanced later if needed
        return false;
    }

    // Bind a key to an action
    bindKey(action, key) {
        if (!this.bindings[action]) {
            this.bindings[action] = [];
        }
        
        if (!this.bindings[action].includes(key)) {
            this.bindings[action].push(key);
            this.saveBindings();
        }
    }

    // Unbind a key from an action
    unbindKey(action, key) {
        if (this.bindings[action]) {
            this.bindings[action] = this.bindings[action].filter(k => k !== key);
            this.saveBindings();
        }
    }

    // Clear all bindings for an action
    clearAction(action) {
        if (this.bindings[action]) {
            this.bindings[action] = [];
            this.saveBindings();
        }
    }

    // Reset to default bindings
    resetToDefaults() {
        this.bindings = this.getDefaultBindings();
        this.saveBindings();
    }

    // Get all current bindings
    getAllBindings() {
        return { ...this.bindings };
    }

    setupGamepad() {
        if (!this.scene.input || !this.scene.input.gamepad) {
            console.warn('InputManager: Gamepad input not available');
            return;
        }

        try {
            this.scene.input.gamepad.on('connected', (gamepad) => {
                console.log('InputManager: Gamepad connected:', gamepad.id);
                this.gamepad = gamepad;
            });

            this.scene.input.gamepad.on('disconnected', (gamepad) => {
                console.log('InputManager: Gamepad disconnected:', gamepad.id);
                if (this.gamepad === gamepad) {
                    this.gamepad = null;
                }
            });
        } catch (error) {
            console.warn('InputManager: Error setting up gamepad:', error);
        }
    }

    getGamepadInput() {
        if (!this.gamepad || !this.scene.input || !this.scene.input.gamepad) return null;
        
        try {
            return {
                leftStick: {
                    x: this.gamepad.leftStick ? this.gamepad.leftStick.x : 0,
                    y: this.gamepad.leftStick ? this.gamepad.leftStick.y : 0
                },
                rightStick: {
                    x: this.gamepad.rightStick ? this.gamepad.rightStick.x : 0,
                    y: this.gamepad.rightStick ? this.gamepad.rightStick.y : 0
                },
                buttons: {
                    A: this.gamepad.A,
                    B: this.gamepad.B,
                    X: this.gamepad.X,
                    Y: this.gamepad.Y,
                    L1: this.gamepad.L1,
                    L2: this.gamepad.L2,
                    R1: this.gamepad.R1,
                    R2: this.gamepad.R2
                }
            };
        } catch (error) {
            console.warn('InputManager: Error getting gamepad input:', error);
            return null;
        }
    }

    update() {
        if (!this.enabled) return; // Respect enabled flag
        this.updateGamepadInput();
    }

    updateGamepadInput() {
        // Only process gamepad input if gamepad is connected and available
        if (!this.gamepad || !this.scene.input || !this.scene.input.gamepad) return;
        
        try {
            const gamepadData = this.getGamepadInput();
            if (!gamepadData) return;

            // Map gamepad inputs to actions
            const threshold = 0.3;

            // Movement
            if (Math.abs(gamepadData.leftStick.x) > threshold) {
                if (gamepadData.leftStick.x > threshold) {
                    this.triggerAction('moveRight', true, 'gamepad');
                } else if (gamepadData.leftStick.x < -threshold) {
                    this.triggerAction('moveLeft', true, 'gamepad');
                }
            }

            if (Math.abs(gamepadData.leftStick.y) > threshold) {
                if (gamepadData.leftStick.y > threshold) {
                    this.triggerAction('moveDown', true, 'gamepad');
                } else if (gamepadData.leftStick.y < -threshold) {
                    this.triggerAction('moveUp', true, 'gamepad');
                }
            }

            // Buttons
            if (gamepadData.buttons.A && gamepadData.buttons.A.pressed) {
                this.triggerAction('cast', true, 'gamepad');
            }
            if (gamepadData.buttons.B && gamepadData.buttons.B.pressed) {
                this.triggerAction('cancel', true, 'gamepad');
            }
            if (gamepadData.buttons.X && gamepadData.buttons.X.pressed) {
                this.triggerAction('inventory', true, 'gamepad');
            }
            if (gamepadData.buttons.Y && gamepadData.buttons.Y.pressed) {
                this.triggerAction('menu', true, 'gamepad');
            }
        } catch (error) {
            console.warn('InputManager: Error in updateGamepadInput:', error);
        }
    }

    destroy() {
        try {
            // Clean up event listeners
            if (this.scene.input) {
                if (this.scene.input.keyboard) {
                    this.scene.input.keyboard.removeAllListeners();
                }
                this.scene.input.removeAllListeners();
                
                // Only remove gamepad listeners if gamepad is available
                if (this.scene.input.gamepad) {
                    this.scene.input.gamepad.removeAllListeners();
                }
            }
        } catch (error) {
            console.warn('InputManager: Error during cleanup:', error);
        }
    }
} 