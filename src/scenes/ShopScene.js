import Phaser from 'phaser';
import GameState from '../scripts/GameState.js';
import { gameDataLoader } from '../scripts/DataLoader.js';

export default class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Get game state instance
        this.gameState = GameState.getInstance();

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x2c3e50);

        // Title
        const title = this.add.text(width / 2, 40, 'FISHING SHOP', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);

        // Player money display
        this.moneyText = this.add.text(width / 2, 80, `Money: $${this.gameState.player.money}`, {
            fontSize: '18px',
            fill: '#00ff00',
            fontFamily: 'Arial'
        });
        this.moneyText.setOrigin(0.5);

        // Create scrollable content container
        this.contentContainer = this.add.container(0, 0);
        
        // Calculate dynamic positions for shop sections
        let currentY = 120;
        const sectionSpacing = 20; // Space between sections
        const itemSpacing = 35; // Space between items
        
        // Shop categories using data-driven equipment
        currentY = this.createShopSection('RODS', currentY, gameDataLoader.getAllRods(), itemSpacing);
        currentY += sectionSpacing;
        
        currentY = this.createShopSection('LURES', currentY, gameDataLoader.getAllLures(), itemSpacing);
        currentY += sectionSpacing;
        
        currentY = this.createShopSection('BOATS', currentY, gameDataLoader.getAllBoats(), itemSpacing);

        // Back button (fixed position)
        this.createButton(width / 2, height - 60, 'BACK TO MENU', () => {
            this.scene.start('MenuScene');
        });

        // Add scroll functionality if content is too long
        this.setupScrolling(currentY, height);
    }

    createShopSection(title, startY, items, itemSpacing) {
        const width = this.cameras.main.width;
        let currentY = startY;
        
        // Section title
        const sectionTitle = this.add.text(width / 2, currentY, title, {
            fontSize: '22px',
            fill: '#3498db',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        sectionTitle.setOrigin(0.5);
        this.contentContainer.add(sectionTitle);
        
        currentY += 35; // Space after section title

        // Items
        items.forEach((item, index) => {
            const itemY = currentY + (index * itemSpacing);
            const category = title.toLowerCase();
            const isOwned = this.gameState.inventory[category] && this.gameState.inventory[category].some(owned => owned.id === item.id);
            const canAfford = this.gameState.player.money >= item.cost;
            const isUnlocked = this.gameState.player.level >= item.unlockLevel;
            const color = isOwned ? '#888888' : (canAfford && isUnlocked ? '#ffffff' : '#666666');
            const priceText = `$${item.cost}`;
            const statusText = isOwned ? ' (OWNED)' : (!isUnlocked ? ` (LVL ${item.unlockLevel})` : '');
            
            // Item name and price (left side)
            const itemText = this.add.text(30, itemY, 
                `${item.name} - ${priceText}${statusText}`, {
                fontSize: '14px',
                fill: color,
                fontFamily: 'Arial'
            });
            this.contentContainer.add(itemText);

            // Item description (right side, with word wrap)
            const descText = this.add.text(width * 0.45, itemY, item.description || 'No description', {
                fontSize: '12px',
                fill: '#cccccc',
                fontFamily: 'Arial',
                wordWrap: { width: width * 0.35 }
            });
            this.contentContainer.add(descText);

            // Buy button (if applicable)
            if (!isOwned && canAfford && isUnlocked) {
                const buyButton = this.add.rectangle(width - 80, itemY + 8, 70, 20, 0x27ae60);
                const buyText = this.add.text(width - 80, itemY + 8, 'BUY', {
                    fontSize: '12px',
                    fill: '#ffffff',
                    fontFamily: 'Arial'
                });
                buyText.setOrigin(0.5);

                buyButton.setInteractive();
                buyButton.on('pointerover', () => buyButton.setFillStyle(0x2ecc71));
                buyButton.on('pointerout', () => buyButton.setFillStyle(0x27ae60));
                buyButton.on('pointerdown', () => this.buyItem(title.toLowerCase(), item, itemText, buyButton, buyText));
                
                this.contentContainer.add([buyButton, buyText]);
            }
        });
        
        // Return the Y position after this section
        return currentY + (items.length * itemSpacing) + 10;
    }

    setupScrolling(contentHeight, screenHeight) {
        const maxScroll = Math.max(0, contentHeight - (screenHeight - 140)); // Account for header and footer
        
        if (maxScroll > 0) {
            // Add scroll instructions
            const scrollHint = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 100, 
                'Use mouse wheel or arrow keys to scroll', {
                fontSize: '12px',
                fill: '#888888',
                fontFamily: 'Arial'
            });
            scrollHint.setOrigin(0.5);
            
            // Mouse wheel scrolling
            this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
                const scrollSpeed = 30;
                const newY = Phaser.Math.Clamp(
                    this.contentContainer.y - (deltaY > 0 ? scrollSpeed : -scrollSpeed),
                    -maxScroll, 0
                );
                this.contentContainer.setY(newY);
            });
            
            // Keyboard scrolling
            this.cursors = this.input.keyboard.createCursorKeys();
        }
    }

    update() {
        // Handle keyboard scrolling
        if (this.cursors) {
            const scrollSpeed = 3;
            const maxScroll = Math.max(0, this.contentContainer.getBounds().height - (this.cameras.main.height - 140));
            
            if (this.cursors.up.isDown) {
                const newY = Math.min(this.contentContainer.y + scrollSpeed, 0);
                this.contentContainer.setY(newY);
            } else if (this.cursors.down.isDown) {
                const newY = Math.max(this.contentContainer.y - scrollSpeed, -maxScroll);
                this.contentContainer.setY(newY);
            }
        }
    }

    buyItem(category, item, itemText, buyButton, buyText) {
        if (this.gameState.spendMoney(item.cost)) {
            // Add item to inventory
            this.gameState.addItem(category, item);
            
            this.moneyText.setText(`Money: $${this.gameState.player.money}`);
            
            itemText.setText(`${item.name} - $${item.cost} (OWNED)`);
            itemText.setColor('#888888');
            
            buyButton.destroy();
            buyText.destroy();

            // Show purchase notification
            this.showNotification(`Purchased: ${item.name}!`);
        }
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

        return { button, buttonText };
    }

    showNotification(text) {
        const notification = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            text,
            {
                fontSize: '24px',
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
            y: notification.y - 50,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => notification.destroy()
        });
    }
} 