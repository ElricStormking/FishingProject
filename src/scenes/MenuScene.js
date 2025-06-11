import Phaser from 'phaser';
import SceneManager from '../scripts/SceneManager.js';
import GameState from '../scripts/GameState.js';
import UITheme from '../ui/UITheme.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    async create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Initialize scene manager and game state
        this.sceneManager = SceneManager.getInstance();
        this.sceneManager.setCurrentScene(this);
        this.gameState = GameState.getInstance();
        
        // Initialize the game state with proper data
        await this.gameState.initialize();
        
        // Initialize audio for the first time
        this.gameState.initializeAudio(this);
        this.gameState.setSceneAudio('MenuScene');

        // Title using UITheme
        const title = UITheme.createText(this, width / 2, height / 4, 'LUXURY ANGLER', 'headerLarge');
        title.setOrigin(0.5);

        // Subtitle using UITheme
        const subtitle = UITheme.createText(this, width / 2, height / 4 + 60, 'Premium Fishing Experience', 'bodyLarge');
        subtitle.setOrigin(0.5);
        subtitle.setColor(UITheme.colors.textSecondary);

        // Check if saved data exists
        const hasSaveData = this.checkForSaveData();
        
        // Menu buttons using UITheme
        this.createButton(width / 2, height / 2 - 80, 'NEW GAME', () => {
            this.gameState.audioManager?.playSFX('button');
            this.startNewGame();
        });

        // Only show Continue button if there's saved data
        if (hasSaveData) {
            this.createButton(width / 2, height / 2 - 20, 'CONTINUE', () => {
                this.gameState.audioManager?.playSFX('button');
                this.scene.start('BoatMenuScene');
            });
        } else {
            // Create disabled continue button
            this.createDisabledButton(width / 2, height / 2 - 20, 'CONTINUE');
            
            // Add "No Save Data" text
            const noSaveText = UITheme.createText(this, width / 2, height / 2 + 10, '(No Save Data)', 'bodySmall');
            noSaveText.setOrigin(0.5);
            noSaveText.setColor(UITheme.colors.textSecondary);
        }

        this.createButton(width / 2, height / 2 + 40, 'SETTINGS', () => {
            this.gameState.audioManager?.playSFX('button');
            this.sceneManager.goToSettings(this);
        });

        this.createButton(width / 2, height / 2 + 100, 'EXIT', () => {
            this.gameState.audioManager?.playSFX('button');
            console.log('Exit clicked');
        });

        // Add decorative panel using UITheme
        const decorativePanel = UITheme.createPanel(this, 0, height - 100, width, 100, 'secondary');
        decorativePanel.setAlpha(0.8);
        
        const instructionText = UITheme.createText(this, width / 2, height - 50, 'Use WASD to move, SPACE to cast', 'bodyMedium');
        instructionText.setOrigin(0.5);
        instructionText.setColor(UITheme.colors.textSecondary);
    }

    checkForSaveData() {
        try {
            // Check if there's any significant saved data
            const savedData = [
                'playerData',
                'inventoryData', 
                'questData',
                'albumData',
                'gameProgress'
            ];
            
            for (const key of savedData) {
                const data = localStorage.getItem(key);
                if (data && data !== 'null' && data !== '{}' && data !== '[]') {
                    console.log(`MenuScene: Found save data in ${key}`);
                    return true;
                }
            }
            
            console.log('MenuScene: No save data found');
            return false;
            
        } catch (error) {
            console.warn('MenuScene: Error checking save data:', error);
            return false;
        }
    }

    createButton(x, y, text, callback) {
        // Use UITheme button creation
        const buttonComponent = UITheme.createButton(this, x, y, 200, 50, text, callback, 'primary');
        
        return buttonComponent;
    }

    createDisabledButton(x, y, text) {
        // Create a disabled button manually
        const buttonWidth = 200;
        const buttonHeight = 50;
        
        // Create button background (disabled style)
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x555555, 0.5); // Gray and transparent
        buttonBg.lineStyle(2, 0x777777, 0.7);
        buttonBg.fillRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 5);
        buttonBg.strokeRoundedRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight, 5);
        
        // Create button text (disabled style)
        const buttonText = UITheme.createText(this, x, y, text, 'bodyLarge');
        buttonText.setOrigin(0.5);
        buttonText.setColor('#888888'); // Gray text
        
        return { background: buttonBg, text: buttonText };
    }

    startNewGame() {
        console.log('MenuScene: Starting new game - clearing all saved data');
        
        try {
            // Clear all localStorage data
            localStorage.clear();
            console.log('MenuScene: All localStorage data cleared');
            
            // Show confirmation message
            this.showNewGameMessage();
            
            // Wait a moment then start fresh
            this.time.delayedCall(2000, () => {
                // Reinitialize game state for fresh start
                this.gameState.initialize().then(() => {
                    console.log('MenuScene: Game state reinitialized for new game');
                    // Start at the boat menu, not directly in the fishing scene
                    this.scene.start('BoatMenuScene');
                });
            });
            
        } catch (error) {
            console.error('MenuScene: Error starting new game:', error);
            // Fallback - start at boat menu since that's the proper starting point
            this.scene.start('BoatMenuScene');
        }
    }

    showNewGameMessage() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        
        // Create message panel
        const panelWidth = 400;
        const panelHeight = 150;
        const panelX = (width - panelWidth) / 2;
        const panelY = (height - panelHeight) / 2;
        
        const panel = UITheme.createPanel(this, panelX, panelY, panelWidth, panelHeight, 'primary');
        
        // Message text
        const messageText = UITheme.createText(this, width / 2, height / 2 - 20, 'Starting New Game...', 'headerMedium');
        messageText.setOrigin(0.5);
        
        const subText = UITheme.createText(this, width / 2, height / 2 + 20, 'All saved data cleared', 'bodyMedium');
        subText.setOrigin(0.5);
        subText.setColor(UITheme.colors.textSecondary);
        
        // Fade out after delay
        this.tweens.add({
            targets: [overlay, panel, messageText, subText],
            alpha: 0,
            duration: 500,
            delay: 1500,
            onComplete: () => {
                overlay.destroy();
                panel.destroy();
                messageText.destroy();
                subText.destroy();
            }
        });
    }
} 