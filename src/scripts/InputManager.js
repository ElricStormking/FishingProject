import Phaser from 'phaser';

export default class InputManager {
    constructor(scene) {
        this.scene = scene;
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
            confirm: ['Enter'],
            cancel: ['Escape'],
            
            // Camera
            cameraZoomIn: ['Equal'],
            cameraZoomOut: ['Minus'],
            
            // Debug
            debug: ['F1']
        };
    }

    loadBindings() {
        const saved = localStorage.getItem('inputBindings');
        return saved ? JSON.parse(saved) : this.getDefaultBindings();
    }

    saveBindings() {
        localStorage.setItem('inputBindings', JSON.stringify(this.bindings));
    }

    setupKeyboard() {
        // Listen for all key events
        this.scene.input.keyboard.on('keydown', (event) => {
            this.activeKeys[event.code] = true;
            this.handleKeyPress(event.code, true);
        });

        this.scene.input.keyboard.on('keyup', (event) => {
            this.activeKeys[event.code] = false;
            this.handleKeyPress(event.code, false);
        });
    }

    setupGamepad() {
        // Check if gamepad input is available
        if (this.scene.input.gamepad) {
            this.scene.input.gamepad.once('connected', (pad) => {
                this.gamepad = pad;
                console.log('Gamepad connected:', pad.id);
            });

            this.scene.input.gamepad.on('disconnected', () => {
                this.gamepad = null;
                console.log('Gamepad disconnected');
            });
        } else {
            // Gamepad support not available or not initialized yet
            console.log('Gamepad support not available');
        }
    }

    setupMouse() {
        this.mouseButtons = {
            left: false,
            right: false,
            middle: false
        };

        this.scene.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) this.mouseButtons.left = true;
            if (pointer.rightButtonDown()) this.mouseButtons.right = true;
            if (pointer.middleButtonDown()) this.mouseButtons.middle = true;
            
            this.handleMousePress(pointer, true);
        });

        this.scene.input.on('pointerup', (pointer) => {
            this.mouseButtons.left = false;
            this.mouseButtons.right = false;
            this.mouseButtons.middle = false;
            
            this.handleMousePress(pointer, false);
        });
    }

    handleKeyPress(keyCode, isDown) {
        // Find which action this key is bound to
        for (const [action, keys] of Object.entries(this.bindings)) {
            if (keys.includes(keyCode)) {
                this.triggerAction(action, isDown, 'keyboard');
                break;
            }
        }
    }

    handleMousePress(pointer, isDown) {
        // Handle mouse-specific actions
        if (pointer.leftButtonDown() && isDown) {
            this.triggerAction('mouseLeft', true, 'mouse');
        }
        if (pointer.rightButtonDown() && isDown) {
            this.triggerAction('mouseRight', true, 'mouse');
        }
    }

    triggerAction(action, isDown, inputType) {
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
    }

    showInputFeedback(action, inputType) {
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
            onComplete: () => feedback.destroy()
        });
    }

    // Check if an action is currently active
    isActionActive(action) {
        const keys = this.bindings[action] || [];
        return keys.some(key => this.activeKeys[key]);
    }

    // Check if an action was just pressed this frame
    isActionJustPressed(action) {
        // For now, we'll handle this through the event system
        // This method can be enhanced later if needed
        return false;
    }

    // Get gamepad input
    getGamepadInput() {
        if (!this.gamepad) return null;

        return {
            leftStick: {
                x: this.gamepad.leftStick.x,
                y: this.gamepad.leftStick.y
            },
            rightStick: {
                x: this.gamepad.rightStick.x,
                y: this.gamepad.rightStick.y
            },
            buttons: {
                A: this.gamepad.A,
                B: this.gamepad.B,
                X: this.gamepad.X,
                Y: this.gamepad.Y,
                L1: this.gamepad.L1,
                R1: this.gamepad.R1,
                L2: this.gamepad.L2,
                R2: this.gamepad.R2
            }
        };
    }

    // Rebind a key for an action
    rebindKey(action, oldKey, newKey) {
        if (!this.bindings[action]) return false;

        const index = this.bindings[action].indexOf(oldKey);
        if (index !== -1) {
            this.bindings[action][index] = newKey;
            this.saveBindings();
            return true;
        }
        return false;
    }

    // Add a new key binding for an action
    addBinding(action, key) {
        if (!this.bindings[action]) {
            this.bindings[action] = [];
        }
        
        if (!this.bindings[action].includes(key)) {
            this.bindings[action].push(key);
            this.saveBindings();
            return true;
        }
        return false;
    }

    // Remove a key binding
    removeBinding(action, key) {
        if (!this.bindings[action]) return false;

        const index = this.bindings[action].indexOf(key);
        if (index !== -1) {
            this.bindings[action].splice(index, 1);
            this.saveBindings();
            return true;
        }
        return false;
    }

    // Reset to default bindings
    resetToDefaults() {
        this.bindings = this.getDefaultBindings();
        this.saveBindings();
    }

    // Get current bindings for display
    getBindings() {
        return { ...this.bindings };
    }

    // Update method to be called each frame
    update() {
        // Handle gamepad input
        if (this.gamepad) {
            this.updateGamepadInput();
        }
    }

    updateGamepadInput() {
        // Only process gamepad input if gamepad is connected and available
        if (!this.gamepad || !this.scene.input.gamepad) return;
        
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
    }

    destroy() {
        // Clean up event listeners
        this.scene.input.keyboard.removeAllListeners();
        this.scene.input.removeAllListeners();
        
        // Only remove gamepad listeners if gamepad is available
        if (this.scene.input.gamepad) {
            this.scene.input.gamepad.removeAllListeners();
        }
    }
} 