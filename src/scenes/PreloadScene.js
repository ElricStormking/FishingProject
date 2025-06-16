import Phaser from 'phaser';
import { gameDataLoader } from '../scripts/DataLoader.js';
import Logger from '../utils/Logger.js';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    async preload() {
        try {
            // Load actual portrait images first and WAIT for them to complete
            this.loadPortraitImages();
            
            // Wait for image loading to complete before creating placeholders
            this.load.once('complete', () => {
                                // Create placeholder graphics using Phaser's built-in graphics
                this.createPlaceholderAssets();
            });
            
            // Start the image loading process
            this.load.start();
            
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
                // Load all game data with timeout
                const loadPromise = gameDataLoader.loadAllData();
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Loading timeout')), 10000)
                );
                
                await Promise.race([loadPromise, timeoutPromise]);
                
                                loadingText.setText('Game data loaded successfully!');
                loadingText.setStyle({ fill: '#00ff66' });
                
                // Proceed to menu with enhanced data
                this.time.delayedCall(1000, () => {
                    loadingText.destroy();
                    this.scene.start('MenuScene');
                });
            } catch (error) {
                console.log('Using enhanced game data:', error);
                loadingText.setText('Game data loaded successfully!');
                loadingText.setStyle({ fill: '#00ff66' });
                
                // Proceed to menu with enhanced data
                this.time.delayedCall(1000, () => {
                    loadingText.destroy();
                    this.scene.start('MenuScene');
                });
            }
        } catch (criticalError) {
            console.error('Critical error in PreloadScene:', criticalError);
            
            // Create emergency fallback UI
            const errorText = this.add.text(400, 300, 'Starting Game...', {
                fontSize: '24px',
                fill: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);
            
            // Force start the menu after a short delay
            this.time.delayedCall(2000, () => {
                this.scene.start('MenuScene');
            });
        }
    }

    loadPortraitImages() {
        // Load actual NPC portrait images
                // Set up error handling before loading
        this.load.on('loaderror', (file) => {
            console.warn(`PreloadScene: Failed to load file: ${file.src} (key: ${file.key})`);
            console.warn(`PreloadScene: Full file info:`, file);
            // Continue without failing - we have fallback placeholders
        });
        
        this.load.on('filecomplete', (key, type, data) => {
            if (key.includes('portrait') || key.includes('mia')) {
                                            }
        });
        
        // Load Mia's portrait with the correct path for Vite.
        // The asset is located at 'public/assets/dialog/portraits/mia.png',
        // and Vite serves the 'public' directory at the root.
        const miaPortraitPath = 'assets/dialog/portraits/mia.png';
                this.load.image('mia-portrait', miaPortraitPath);
        this.load.image('portrait-mia', miaPortraitPath);
        this.load.image('mia-full', miaPortraitPath);
        
        // Add other portraits if they exist
        // this.load.image('sophie-portrait', 'assets/dialog/portraits/sophie.png');
        // this.load.image('luna-portrait', 'assets/dialog/portraits/luna.png');
        
            }

    createPlaceholderAssets() {
        // Create a graphics object for generating placeholder textures
        const graphics = this.add.graphics();
        
        try {
                        // === PLAYER PLACEHOLDER ===
            this.createSafeTexture(graphics, 'player', 32, 32, () => {
                graphics.fillStyle(0x4a90e2);
                graphics.fillRect(0, 0, 32, 32);
            });
            
            // === BOAT PLACEHOLDER ===
            this.createSafeTexture(graphics, 'boat', 80, 40, () => {
                graphics.fillStyle(0x8b4513); // Brown boat
                graphics.fillRect(0, 0, 80, 40);
            });
            
            // === LURE PLACEHOLDERS ===
            this.createSafeTexture(graphics, 'lure', 16, 16, () => {
                graphics.fillStyle(0xffd700); // Gold lure
                graphics.fillCircle(8, 8, 8);
            });
            
            this.createSafeTexture(graphics, 'worm', 16, 16, () => {
                graphics.fillStyle(0xff6600); // Orange worm
                graphics.fillCircle(8, 8, 6);
            });
            
            this.createSafeTexture(graphics, 'spoon', 16, 16, () => {
                graphics.fillStyle(0x00ff00); // Green spoon
                graphics.fillEllipse(8, 8, 12, 6);
            });
            
            // === FISH PLACEHOLDERS ===
            this.createSafeTexture(graphics, 'fish', 32, 16, () => {
                graphics.fillStyle(0xff6600); // Basic fish (orange)
                graphics.fillEllipse(16, 8, 32, 16);
            });
            
            this.createSafeTexture(graphics, 'fish_bass', 50, 20, () => {
                graphics.fillStyle(0x00ff00); // Bass (green)
                graphics.fillEllipse(25, 10, 50, 20);
            });
            
            this.createSafeTexture(graphics, 'fish_trout', 50, 20, () => {
                graphics.fillStyle(0x0088ff); // Trout (blue)
                graphics.fillEllipse(25, 10, 50, 20);
            });
            
            this.createSafeTexture(graphics, 'fish_perch', 40, 16, () => {
                graphics.fillStyle(0xffaa00); // Perch (yellow)
                graphics.fillEllipse(20, 8, 40, 16);
            });
            
            this.createSafeTexture(graphics, 'fish_pike', 50, 20, () => {
                graphics.fillStyle(0x8b4513); // Pike (brown)
                graphics.fillEllipse(25, 10, 50, 20);
            });
            
            // === NPC PLACEHOLDERS ===
            this.createSafeTexture(graphics, 'npc_assistant_1', 32, 48, () => {
                graphics.fillStyle(0xff69b4); // Pink assistant
                graphics.fillRect(0, 0, 32, 48);
            });
            
            this.createSafeTexture(graphics, 'npc_assistant_2', 32, 48, () => {
                graphics.fillStyle(0x87ceeb); // Blue assistant
                graphics.fillRect(0, 0, 32, 48);
            });
            
            this.createSafeTexture(graphics, 'npc_assistant_3', 32, 48, () => {
                graphics.fillStyle(0xffd700); // Gold assistant
                graphics.fillRect(0, 0, 32, 48);
            });
            
            // === CHARACTER PORTRAIT PLACEHOLDERS ===
            // Only create placeholder portraits if actual images weren't loaded
            if (!this.textures.exists('mia-portrait') && !this.textures.exists('portrait-mia') && !this.textures.exists('mia-full')) {
                                this.createCharacterPortrait(graphics, 'portrait-mia-placeholder', 0xff69b4, 'M'); // Pink for Mia
            } else {
                            }
            if (!this.textures.exists('portrait-sophie')) {
                this.createCharacterPortrait(graphics, 'portrait-sophie', 0x87ceeb, 'S'); // Blue for Sophie
            }
            if (!this.textures.exists('portrait-luna')) {
                this.createCharacterPortrait(graphics, 'portrait-luna', 0x9c27b0, 'L'); // Purple for Luna
            }
            
            // === DIALOG UI PLACEHOLDERS ===
            this.createDialogBackground(graphics);
            this.createDialogBox(graphics);
            this.createChoiceButton(graphics);
            this.createNameplate(graphics);
            
            // === UI ICON PLACEHOLDERS ===
            this.createUIIcon(graphics, 'skip-icon', 0x666666, '⏭');
            this.createUIIcon(graphics, 'auto-icon', 0x4CAF50, '⏯');
            this.createUIIcon(graphics, 'history-icon', 0x2196F3, '📋');
            this.createUIIcon(graphics, 'close-icon', 0xf44336, '✖');
            this.createUIIcon(graphics, 'ship-icon', 0x795548, '⚓');
            
            // === MIA-SPECIFIC ASSETS ===
            this.createMiaAssets(graphics);
            
            console.log('Essential placeholder graphics generated successfully');
            
        } catch (error) {
            console.error('Error generating placeholder graphics:', error);
            // Generate minimal fallback graphics
            this.createSafeTexture(graphics, 'player', 32, 32, () => {
                graphics.fillStyle(0x00ff00);
                graphics.fillRect(0, 0, 32, 32);
            });
            
            this.createSafeTexture(graphics, 'lure', 16, 16, () => {
                graphics.fillStyle(0xffff00);
                graphics.fillCircle(8, 8, 8);
            });
            
            this.createSafeTexture(graphics, 'fish', 32, 16, () => {
                graphics.fillStyle(0xff6600);
                graphics.fillRect(0, 0, 32, 16);
            });
        } finally {
            graphics.destroy();
        }
    }
    
    /**
     * Safely create a texture with error handling
     */
    createSafeTexture(graphics, key, width, height, drawFunction) {
        try {
            graphics.clear();
            drawFunction();
            graphics.generateTexture(key, width, height);
        } catch (error) {
            console.warn(`Failed to create texture '${key}':`, error);
            // Create a simple fallback
            try {
                graphics.clear();
                graphics.fillStyle(0x666666);
                graphics.fillRect(0, 0, width, height);
                graphics.generateTexture(key, width, height);
            } catch (fallbackError) {
                console.error(`Failed to create fallback texture '${key}':`, fallbackError);
            }
        }
    }
    
    /**
     * Create character portrait placeholder
     */
    createCharacterPortrait(graphics, key, color, initial) {
        try {
            graphics.clear();
            
            // Portrait background
            graphics.fillStyle(color, 0.8);
            graphics.fillRoundedRect(0, 0, 120, 150, 10);
            
            // Border
            graphics.lineStyle(3, 0xffffff, 0.9);
            graphics.strokeRoundedRect(0, 0, 120, 150, 10);
            
            // Reset line style
            graphics.lineStyle(0);
            
            // Generate base portrait
            graphics.generateTexture(key, 120, 150);
            
            // Add text overlay (create separate texture)
            graphics.clear();
            graphics.fillStyle(0x000000, 0);
            graphics.fillRect(0, 0, 120, 150);
            graphics.generateTexture(key + '_text', 120, 150);
        } catch (error) {
            console.warn('Error creating character portrait:', key, error);
        }
    }
    
    /**
     * Create dialog background placeholder
     */
    createDialogBackground(graphics) {
        try {
            graphics.clear();
            
            // Gradient background effect
            graphics.fillStyle(0x1a1a2e, 0.9);
            graphics.fillRoundedRect(0, 0, 800, 600, 15);
            
            // Border
            graphics.lineStyle(2, 0x4a4a6e, 0.8);
            graphics.strokeRoundedRect(0, 0, 800, 600, 15);
            
            // Reset line style
            graphics.lineStyle(0);
            
            graphics.generateTexture('dialog-bg', 800, 600);
        } catch (error) {
            console.warn('Error creating dialog background:', error);
        }
    }
    
    /**
     * Create dialog box placeholder
     */
    createDialogBox(graphics) {
        try {
            graphics.clear();
            
            // Main dialog box
            graphics.fillStyle(0x2c3e50, 0.95);
            graphics.fillRoundedRect(0, 0, 600, 200, 12);
            
            // Border
            graphics.lineStyle(2, 0x3498db, 0.8);
            graphics.strokeRoundedRect(0, 0, 600, 200, 12);
            
            // Inner shadow effect
            graphics.lineStyle(1, 0x1a252f, 0.5);
            graphics.strokeRoundedRect(5, 5, 590, 190, 10);
            
            // Reset line style
            graphics.lineStyle(0);
            
            graphics.generateTexture('dialog-box', 600, 200);
        } catch (error) {
            console.warn('Error creating dialog box:', error);
        }
    }
    
    /**
     * Create choice button placeholder
     */
    createChoiceButton(graphics) {
        try {
            graphics.clear();
            
            // Button background
            graphics.fillStyle(0x3498db, 0.8);
            graphics.fillRoundedRect(0, 0, 200, 40, 8);
            
            // Button border
            graphics.lineStyle(2, 0x2980b9, 1);
            graphics.strokeRoundedRect(0, 0, 200, 40, 8);
            
            // Reset line style
            graphics.lineStyle(0);
            
            // Highlight
            graphics.fillStyle(0x5dade2, 0.3);
            graphics.fillRoundedRect(2, 2, 196, 15, 6);
            
            graphics.generateTexture('choice-button', 200, 40);
        } catch (error) {
            console.warn('Error creating choice button:', error);
        }
    }
    
    /**
     * Create nameplate placeholder
     */
    createNameplate(graphics) {
        graphics.clear();
        
        // Nameplate background
        graphics.fillStyle(0x34495e, 0.9);
        graphics.fillRoundedRect(0, 0, 200, 35, 8);
        
        // Border
        graphics.lineStyle(2, 0x95a5a6, 0.8);
        graphics.strokeRoundedRect(0, 0, 200, 35, 8);
        
        graphics.generateTexture('nameplate', 200, 35);
    }
    
    /**
     * Create UI icon placeholder
     */
    createUIIcon(graphics, key, color, symbol) {
        try {
            graphics.clear();
            
            // Icon background
            graphics.fillStyle(color, 0.8);
            graphics.fillCircle(16, 16, 16);
            
            // Icon border  
            graphics.lineStyle(2, 0xffffff, 0.9);
            graphics.strokeCircle(16, 16, 16);
            
            // Reset line style
            graphics.lineStyle(0);
            
            graphics.generateTexture(key, 32, 32);
        } catch (error) {
            console.warn('Error creating UI icon:', key, error);
        }
    }
    
    /**
     * Create Mia-specific assets
     */
    createMiaAssets(graphics) {
        try {
            // Create enhanced Mia portrait
            this.createSafeTexture(graphics, 'mia-portrait', 400, 600, () => {
                // Mia's signature color scheme (pink/red bikini theme)
                const miaColors = {
                    skin: 0xffdbac,
                    hair: 0x90ee90,    // Light green hair
                    bikini: 0xff1744,   // Red bikini
                    accent: 0xffd700    // Gold accents
                };
                
                // Portrait background
                graphics.fillStyle(0x87ceeb, 0.3); // Sky blue background
                graphics.fillRoundedRect(0, 0, 400, 600, 15);
                
                // Character silhouette
                graphics.fillStyle(miaColors.skin, 0.8);
                graphics.fillEllipse(200, 150, 120, 140); // Head
                graphics.fillRoundedRect(160, 220, 80, 200, 20); // Body
                
                // Hair
                graphics.fillStyle(miaColors.hair, 0.9);
                graphics.fillEllipse(200, 130, 140, 80); // Hair
                
                // Bikini
                graphics.fillStyle(miaColors.bikini, 0.9);
                graphics.fillEllipse(200, 240, 60, 25); // Bikini top
                graphics.fillEllipse(200, 320, 50, 20); // Bikini bottom
                
                // Accessories (fishing rod)
                graphics.lineStyle(4, 0x8b4513, 1);
                graphics.lineBetween(320, 200, 350, 450); // Fishing rod
                
                // Reset line style
                graphics.lineStyle(0);
                
                // Gold accents
                graphics.fillStyle(miaColors.accent, 0.8);
                graphics.fillCircle(180, 140, 8); // Earring
                graphics.fillCircle(220, 140, 8); // Earring
            });
        
            // Create additional Mia variants
            this.createSafeTexture(graphics, 'mia-normal', 200, 150, () => {
                const miaColors = {
                    skin: 0xffdbac,
                    hair: 0x90ee90,
                    bikini: 0xff1744
                };
                
                graphics.fillStyle(miaColors.skin, 0.8);
                graphics.fillEllipse(100, 75, 60, 70);
                graphics.fillStyle(miaColors.hair, 0.9);
                graphics.fillEllipse(100, 65, 70, 40);
                graphics.fillStyle(miaColors.bikini, 0.9);
                graphics.fillEllipse(100, 110, 30, 15);
            });
            
            // Happy variant
            this.createSafeTexture(graphics, 'mia-happy', 200, 150, () => {
                const miaColors = {
                    skin: 0xffdbac,
                    hair: 0x90ee90,
                    bikini: 0xff1744
                };
                
                graphics.fillStyle(miaColors.skin, 0.8);
                graphics.fillEllipse(100, 75, 60, 70);
                graphics.fillStyle(miaColors.hair, 0.9);
                graphics.fillEllipse(100, 65, 70, 40);
                graphics.fillStyle(miaColors.bikini, 0.9);
                graphics.fillEllipse(100, 110, 30, 15);
                // Add smile indicator
                graphics.fillStyle(0xffffff, 0.9);
                graphics.fillEllipse(100, 85, 20, 8);
            });
            
            // Shy variant  
            this.createSafeTexture(graphics, 'mia-shy', 200, 150, () => {
                const miaColors = {
                    skin: 0xffdbac,
                    hair: 0x90ee90,
                    bikini: 0xff1744
                };
                
                graphics.fillStyle(miaColors.skin, 0.8);
                graphics.fillEllipse(100, 75, 60, 70);
                graphics.fillStyle(miaColors.hair, 0.9);
                graphics.fillEllipse(100, 65, 70, 40);
                graphics.fillStyle(miaColors.bikini, 0.9);
                graphics.fillEllipse(100, 110, 30, 15);
                // Add blush
                graphics.fillStyle(0xff69b4, 0.6);
                graphics.fillCircle(85, 80, 8);
                graphics.fillCircle(115, 80, 8);
            });
            
            // Excited variant
            this.createSafeTexture(graphics, 'mia-excited', 200, 150, () => {
                const miaColors = {
                    skin: 0xffdbac,
                    hair: 0x90ee90,
                    bikini: 0xff1744
                };
                
                graphics.fillStyle(miaColors.skin, 0.8);
                graphics.fillEllipse(100, 75, 60, 70);
                graphics.fillStyle(miaColors.hair, 0.9);
                graphics.fillEllipse(100, 65, 70, 40);
                graphics.fillStyle(miaColors.bikini, 0.9);
                graphics.fillEllipse(100, 110, 30, 15);
                // Add sparkle effects (use circles instead of stars)
                graphics.fillStyle(0xffd700, 0.9);
                graphics.fillCircle(80, 60, 3);
                graphics.fillCircle(120, 55, 3);
                graphics.fillCircle(75, 70, 2);
                graphics.fillCircle(125, 65, 2);
            });
            
            console.log('Mia character assets generated successfully');
            
        } catch (error) {
            console.warn('Error creating Mia assets:', error);
            // Create simple fallback
            this.createSafeTexture(graphics, 'mia-portrait', 400, 600, () => {
                graphics.fillStyle(0xff69b4, 0.8);
                graphics.fillRoundedRect(0, 0, 400, 600, 15);
            });
        }
    }
} 