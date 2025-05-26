import Phaser from 'phaser';
import { gameDataLoader } from '../scripts/DataLoader.js';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    async preload() {
        // Create placeholder graphics using Phaser's built-in graphics
        this.createPlaceholderAssets();
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: 'Loading Game Data...',
            style: {
                font: '24px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        try {
            // Load all game data
            await gameDataLoader.loadAllData();
            
            // Validate the loaded data
            const isValid = gameDataLoader.validateGameData();
            if (!isValid) {
                throw new Error('Game data validation failed');
            }
            
            // Log data summary
            const summary = gameDataLoader.getDataSummary();
            console.log('Game Data Loaded:', summary);
            
            loadingText.setText('Data Loaded Successfully!');
            
            // Brief delay to show success message
            this.time.delayedCall(500, () => {
                loadingText.destroy();
                this.scene.start('MenuScene');
            });
            
        } catch (error) {
            console.error('Failed to load game data:', error);
            loadingText.setText('Failed to load game data!');
            loadingText.setStyle({ fill: '#ff0000' });
            
            // Still proceed to menu after error (for development)
            this.time.delayedCall(2000, () => {
                loadingText.destroy();
                this.scene.start('MenuScene');
            });
        }
    }

    createPlaceholderAssets() {
        // Create essential placeholder graphics using Phaser's built-in graphics
        const graphics = this.add.graphics();
        
        try {
            // === ESSENTIAL ASSETS ===
            // Player placeholder
            graphics.fillStyle(0x00ff00);
            graphics.fillRect(0, 0, 32, 32);
            graphics.generateTexture('player', 32, 32);
            
            // Water placeholder
            graphics.clear();
            graphics.fillStyle(0x0066cc);
            graphics.fillRect(0, 0, 64, 64);
            graphics.generateTexture('water', 64, 64);
            
            // Lure placeholder
            graphics.clear();
            graphics.fillStyle(0xffff00);
            graphics.fillCircle(8, 8, 8);
            graphics.generateTexture('lure', 16, 16);
            
            // Fish placeholder
            graphics.clear();
            graphics.fillStyle(0xff6600);
            graphics.fillEllipse(16, 8, 32, 16);
            graphics.generateTexture('fish', 32, 16);
            
            // UI Button placeholder
            graphics.clear();
            graphics.fillStyle(0x666666);
            graphics.fillRoundedRect(0, 0, 120, 40, 8);
            graphics.generateTexture('button', 120, 40);
            
            // === ADDITIONAL FISH TYPES ===
            graphics.clear();
            graphics.fillStyle(0x228b22); // Bass (green)
            graphics.fillEllipse(20, 10, 40, 20);
            graphics.generateTexture('fish_bass', 40, 20);
            
            graphics.clear();
            graphics.fillStyle(0xc0c0c0); // Trout (silver)
            graphics.fillEllipse(18, 8, 36, 16);
            graphics.generateTexture('fish_trout', 36, 16);
            
            graphics.clear();
            graphics.fillStyle(0x8b4513); // Pike (brown)
            graphics.fillEllipse(25, 10, 50, 20);
            graphics.generateTexture('fish_pike', 50, 20);
            
            // === NPC PLACEHOLDERS ===
            graphics.clear();
            graphics.fillStyle(0xff69b4); // Pink assistant
            graphics.fillRect(0, 0, 32, 48);
            graphics.generateTexture('npc_assistant_1', 32, 48);
            
            graphics.clear();
            graphics.fillStyle(0x87ceeb); // Blue assistant
            graphics.fillRect(0, 0, 32, 48);
            graphics.generateTexture('npc_assistant_2', 32, 48);
            
            graphics.clear();
            graphics.fillStyle(0xffd700); // Gold assistant
            graphics.fillRect(0, 0, 32, 48);
            graphics.generateTexture('npc_assistant_3', 32, 48);
            
            console.log('Essential placeholder graphics generated successfully');
            
        } catch (error) {
            console.error('Error generating placeholder graphics:', error);
            // Generate minimal fallback graphics
            graphics.clear();
            graphics.fillStyle(0x00ff00);
            graphics.fillRect(0, 0, 32, 32);
            graphics.generateTexture('player', 32, 32);
            
            graphics.clear();
            graphics.fillStyle(0xffff00);
            graphics.fillCircle(8, 8, 8);
            graphics.generateTexture('lure', 16, 16);
            
            graphics.clear();
            graphics.fillStyle(0xff6600);
            graphics.fillRect(0, 0, 32, 16);
            graphics.generateTexture('fish', 32, 16);
        } finally {
            graphics.destroy();
        }
    }
} 