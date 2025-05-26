import Phaser from 'phaser';
import SceneManager from '../scripts/SceneManager.js';
import GameState from '../scripts/GameState.js';

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

        // Title
        const title = this.add.text(width / 2, height / 4, 'LUXURY ANGLER', {
            fontSize: '48px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);

        // Subtitle
        const subtitle = this.add.text(width / 2, height / 4 + 60, 'Premium Fishing Experience', {
            fontSize: '20px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        });
        subtitle.setOrigin(0.5);

        // Menu buttons
        this.createButton(width / 2, height / 2 - 40, 'BOAT MENU', () => {
            this.gameState.audioManager?.playSFX('button');
            this.scene.start('BoatMenuScene');
        });

        this.createButton(width / 2, height / 2 + 40, 'START FISHING', () => {
            this.gameState.audioManager?.playSFX('button');
            this.sceneManager.goToGame(this);
        });

        this.createButton(width / 2, height / 2 + 120, 'SHOP', () => {
            this.gameState.audioManager?.playSFX('button');
            this.sceneManager.goToShop(this);
        });

        this.createButton(width / 2, height / 2 + 200, 'SETTINGS', () => {
            this.gameState.audioManager?.playSFX('button');
            this.sceneManager.goToSettings(this);
        });

        this.createButton(width / 2, height / 2 + 280, 'EXIT', () => {
            this.gameState.audioManager?.playSFX('button');
            console.log('Exit clicked');
        });

        // Add some decorative elements
        this.add.rectangle(width / 2, height - 50, width, 100, 0x1a252f, 0.8);
        this.add.text(width / 2, height - 50, 'Use WASD to move, SPACE to cast', {
            fontSize: '16px',
            fill: '#888888',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
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
        button.on('pointerover', () => {
            button.setFillStyle(0x3498db);
        });
        button.on('pointerout', () => {
            button.setFillStyle(0x34495e);
        });
        button.on('pointerdown', callback);

        return { button, buttonText };
    }
} 