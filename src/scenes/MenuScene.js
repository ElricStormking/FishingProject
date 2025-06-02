import Phaser from 'phaser';
import SceneManager from '../scripts/SceneManager.js';
import GameState from '../scripts/GameState.js';
import UITheme from '../ui/UITheme.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Initialize scene manager and game state
        this.sceneManager = SceneManager.getInstance();
        this.sceneManager.setCurrentScene(this);
        this.gameState = GameState.getInstance();
        
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

        // Menu buttons using UITheme
        this.createButton(width / 2, height / 2 - 40, 'BOAT MENU', () => {
            this.gameState.audioManager?.playSFX('button');
            this.scene.start('BoatMenuScene');
        });

        this.createButton(width / 2, height / 2 + 40, 'SETTINGS', () => {
            this.gameState.audioManager?.playSFX('button');
            this.sceneManager.goToSettings(this);
        });

        this.createButton(width / 2, height / 2 + 120, 'EXIT', () => {
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

    createButton(x, y, text, callback) {
        // Use UITheme button creation
        const buttonComponent = UITheme.createButton(this, x, y, 200, 50, text, callback, 'primary');
        
        return buttonComponent;
    }
} 