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
                // Create DOM button for selling all fish
        this.createSellAllFishButton();

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
        this.contentContainer.setDepth(9000); // Set scroll depth to 9000
        
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
        currentY += sectionSpacing;
        
        // Fish inventory section for selling
                currentY = this.createFishInventorySection(currentY, itemSpacing);
                // Back button (fixed position)
        this.createButton(width / 2, height - 60, 'BACK TO MENU', () => {
            this.scene.start('MenuScene');
        });

        // Add scroll functionality if content is too long
        this.setupScrolling(currentY, height);
    }

    createSellAllFishButton() {
        // Create DOM button for selling all fish
        this.sellAllFishButton = document.createElement('button');
        this.sellAllFishButton.innerHTML = '🐟 Sell All Fishes';
        this.sellAllFishButton.style.cssText = `
            position: fixed;
            top: 120px;
            right: 20px;
            z-index: 10000;
            padding: 12px 20px;
            background: linear-gradient(45deg, #e74c3c, #c0392b);
            color: white;
            border: none;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            display: block;
        `;
        
        // Add hover effects
        this.sellAllFishButton.addEventListener('mouseenter', () => {
            this.sellAllFishButton.style.background = 'linear-gradient(45deg, #c0392b, #a93226)';
            this.sellAllFishButton.style.transform = 'translateY(-2px)';
            this.sellAllFishButton.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
        });
        
        this.sellAllFishButton.addEventListener('mouseleave', () => {
            this.sellAllFishButton.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
            this.sellAllFishButton.style.transform = 'translateY(0)';
            this.sellAllFishButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        });
        
        // Add click handler
        this.sellAllFishButton.addEventListener('click', () => {
            this.sellAllFish();
        });
        
        // Add to document
        document.body.appendChild(this.sellAllFishButton);
        
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

    createFishInventorySection(startY, itemSpacing) {
        const width = this.cameras.main.width;
        let currentY = startY;
        
        // Get player's fish inventory with debug logging
        const fishInventory = this.gameState.inventory.fish || [];
                        // Section title (always show)
        const sectionTitle = this.add.text(width / 2, currentY, 'YOUR FISH INVENTORY', {
            fontSize: '22px',
            fill: '#e74c3c',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        sectionTitle.setOrigin(0.5);
        this.contentContainer.add(sectionTitle);
        
        // Add separator line to make section more visible
        const separator = this.add.rectangle(width / 2, currentY + 18, width - 60, 2, 0xe74c3c);
        this.contentContainer.add(separator);
        
        currentY += 35;
        
        // If no fish, show message
        if (fishInventory.length === 0) {
            const noFishText = this.add.text(width / 2, currentY, 'No fish caught yet! Go fishing to collect fish to sell.', {
                fontSize: '16px',
                fill: '#888888',
                fontFamily: 'Arial',
                align: 'center',
                wordWrap: { width: width - 60 }
            });
            noFishText.setOrigin(0.5);
            this.contentContainer.add(noFishText);
            
            // Add test fish button for debugging
            const testFishButton = this.add.rectangle(width / 2, currentY + 40, 150, 25, 0x3498db);
            const testFishText = this.add.text(width / 2, currentY + 40, 'ADD TEST FISH', {
                fontSize: '12px',
                fill: '#ffffff',
                fontFamily: 'Arial',
                fontWeight: 'bold'
            });
            testFishText.setOrigin(0.5);
            
            testFishButton.setInteractive();
            testFishButton.on('pointerover', () => testFishButton.setFillStyle(0x2980b9));
            testFishButton.on('pointerout', () => testFishButton.setFillStyle(0x3498db));
            testFishButton.on('pointerdown', () => this.addTestFish());
            
            this.contentContainer.add([testFishButton, testFishText]);
            
            return currentY + 70; // Return some space for the message and button
        }
        
        // "Sell All" button
        const sellAllButton = this.add.rectangle(width / 2, currentY, 150, 30, 0xe74c3c);
        const sellAllText = this.add.text(width / 2, currentY, 'SELL ALL FISH', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        sellAllText.setOrigin(0.5);
        
        sellAllButton.setInteractive();
        sellAllButton.on('pointerover', () => sellAllButton.setFillStyle(0xc0392b));
        sellAllButton.on('pointerout', () => sellAllButton.setFillStyle(0xe74c3c));
        sellAllButton.on('pointerdown', () => this.sellAllFish());
        
        this.contentContainer.add([sellAllButton, sellAllText]);
        currentY += 45;
        
        // Group fish by species and calculate totals
        const fishGroups = {};
        fishInventory.forEach(fish => {
            const key = fish.fishId || fish.id || fish.name;
            if (!fishGroups[key]) {
                fishGroups[key] = {
                    fish: fish,
                    count: 0,
                    totalValue: 0,
                    totalWeight: 0
                };
            }
            fishGroups[key].count += (fish.quantity || 1);
            fishGroups[key].totalValue += (fish.value || fish.coinValue || 50) * (fish.quantity || 1);
            fishGroups[key].totalWeight += (fish.weight || 1) * (fish.quantity || 1);
        });
        
                // Display each fish group
        Object.values(fishGroups).forEach((group, index) => {
            const itemY = currentY + (index * itemSpacing);
            this.createFishInventoryItem(group, itemY, width);
        });
        
        return currentY + (Object.keys(fishGroups).length * itemSpacing) + 10;
    }

    createFishInventoryItem(fishGroup, itemY, width) {
        const fish = fishGroup.fish;
        const count = fishGroup.count;
        const totalValue = fishGroup.totalValue;
        const avgWeight = (fishGroup.totalWeight / count).toFixed(1);
        
        // Fish name and quantity (left side)
        const fishText = this.add.text(30, itemY, 
            `${fish.name} x${count} (${avgWeight}kg avg)`, {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        this.contentContainer.add(fishText);
        
        // Fish rarity indicator
        const rarityColors = {
            1: '#8B4513', // Common - Brown
            2: '#4169E1', // Uncommon - Blue  
            3: '#32CD32', // Rare - Green
            4: '#FF6347', // Epic - Red
            5: '#FFD700', // Legendary - Gold
            6: '#9370DB'  // Mythic - Purple
        };
        const rarityColor = rarityColors[fish.rarity] || '#ffffff';
        const rarityText = this.add.text(30, itemY + 18, 
            `★`.repeat(Math.min(fish.rarity || 1, 5)), {
            fontSize: '12px',
            fill: rarityColor,
            fontFamily: 'Arial'
        });
        this.contentContainer.add(rarityText);

        // Total value (center)
        const valueText = this.add.text(width * 0.5, itemY + 9, 
            `Total Value: $${totalValue}`, {
            fontSize: '12px',
            fill: '#00ff00',
            fontFamily: 'Arial'
        });
        valueText.setOrigin(0.5);
        this.contentContainer.add(valueText);

        // Sell button (right side)
        const sellButton = this.add.rectangle(width - 80, itemY + 9, 70, 25, 0xe67e22);
        const sellButtonText = this.add.text(width - 80, itemY + 9, 'SELL', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        sellButtonText.setOrigin(0.5);

        sellButton.setInteractive();
        sellButton.on('pointerover', () => sellButton.setFillStyle(0xd35400));
        sellButton.on('pointerout', () => sellButton.setFillStyle(0xe67e22));
        sellButton.on('pointerdown', () => this.sellFish(fish, fishGroup, fishText, valueText, sellButton, sellButtonText));
        
        this.contentContainer.add([sellButton, sellButtonText]);
    }

    setupScrolling(contentHeight, screenHeight) {
                const maxScroll = Math.max(0, contentHeight - (screenHeight - 140)); // Account for header and footer
                if (maxScroll > 0) {
            // Add scroll instructions
            const scrollHint = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 100, 
                'Use mouse wheel, arrow keys, or scroll bars to scroll', {
                fontSize: '12px',
                fill: '#888888',
                fontFamily: 'Arial'
            });
            scrollHint.setOrigin(0.5);
            
            // Create scroll up indicator/button
            this.scrollUpIndicator = this.add.text(this.cameras.main.width - 30, 150, '▲', {
                fontSize: '20px',
                fill: '#3498db',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setDepth(15000);
            
            this.scrollUpIndicator.setInteractive({ useHandCursor: true });
            this.scrollUpIndicator.on('pointerdown', () => {
                const newY = Math.min(this.contentContainer.y + 30, 0);
                this.contentContainer.setY(newY);
                this.updateScrollIndicators(maxScroll);
            });
            this.scrollUpIndicator.on('pointerover', () => this.scrollUpIndicator.setTint(0x2980b9));
            this.scrollUpIndicator.on('pointerout', () => this.scrollUpIndicator.clearTint());
            
            // Create scroll down indicator/button
            this.scrollDownIndicator = this.add.text(this.cameras.main.width - 30, this.cameras.main.height - 80, '▼', {
                fontSize: '20px',
                fill: '#3498db',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setDepth(15000);
            
            this.scrollDownIndicator.setInteractive({ useHandCursor: true });
            this.scrollDownIndicator.on('pointerdown', () => {
                const newY = Math.max(this.contentContainer.y - 30, -maxScroll);
                this.contentContainer.setY(newY);
                this.updateScrollIndicators(maxScroll);
            });
            this.scrollDownIndicator.on('pointerover', () => this.scrollDownIndicator.setTint(0x2980b9));
            this.scrollDownIndicator.on('pointerout', () => this.scrollDownIndicator.clearTint());
            
            // Store maxScroll for update function
            this.maxScroll = maxScroll;
            this.updateScrollIndicators(maxScroll);
            
            // Mouse wheel scrolling
            this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
                const scrollSpeed = 30;
                const newY = Phaser.Math.Clamp(
                    this.contentContainer.y - (deltaY > 0 ? scrollSpeed : -scrollSpeed),
                    -maxScroll, 0
                );
                                this.contentContainer.setY(newY);
                this.updateScrollIndicators(maxScroll);
            });
            
            // Keyboard scrolling
            this.cursors = this.input.keyboard.createCursorKeys();
        } else {
                    }
    }

    updateScrollIndicators(maxScroll) {
        if (this.scrollUpIndicator && this.scrollDownIndicator) {
            this.scrollUpIndicator.setAlpha(this.contentContainer.y < 0 ? 1 : 0.3);
            this.scrollDownIndicator.setAlpha(this.contentContainer.y > -maxScroll ? 1 : 0.3);
        }
    }

    update() {
        // Handle keyboard scrolling
        if (this.cursors && this.maxScroll !== undefined) {
            const scrollSpeed = 3;
            
            if (this.cursors.up.isDown) {
                const newY = Math.min(this.contentContainer.y + scrollSpeed, 0);
                this.contentContainer.setY(newY);
                this.updateScrollIndicators(this.maxScroll);
            } else if (this.cursors.down.isDown) {
                const newY = Math.max(this.contentContainer.y - scrollSpeed, -this.maxScroll);
                this.contentContainer.setY(newY);
                this.updateScrollIndicators(this.maxScroll);
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

    sellFish(fish, fishGroup, fishText, valueText, sellButton, sellButtonText) {
        const fishId = fish.fishId || fish.id || fish.name;
        const fishInventory = this.gameState.inventory.fish || [];
        
        // Remove one fish (or stack) of this type from inventory
        const fishIndex = fishInventory.findIndex(f => 
            (f.fishId || f.id || f.name) === fishId
        );
        
        if (fishIndex !== -1) {
            const fishToSell = fishInventory[fishIndex];
            const quantity = fishToSell.quantity || 1;
            const saleValue = (fishToSell.value || fishToSell.coinValue || 50) * quantity;
            
            // Add money to player
            this.gameState.player.money += saleValue;
            
            // Remove fish from inventory
            fishInventory.splice(fishIndex, 1);
            
            // Update displays
            this.moneyText.setText(`Money: $${this.gameState.player.money}`);
            
            // Update fish count display
            const newCount = fishGroup.count - quantity;
            if (newCount <= 0) {
                // Hide the entire item if no more fish of this type
                fishText.setText(`${fish.name} x0 - SOLD OUT`);
                fishText.setColor('#666666');
                valueText.setText('');
                sellButton.destroy();
                sellButtonText.destroy();
            } else {
                // Update the display with new count
                const newTotalValue = fishGroup.totalValue - saleValue;
                const newAvgWeight = ((fishGroup.totalWeight - (fishToSell.weight || 1) * quantity) / newCount).toFixed(1);
                fishText.setText(`${fish.name} x${newCount} (${newAvgWeight}kg avg)`);
                valueText.setText(`Total Value: $${newTotalValue}`);
                
                // Update the group data
                fishGroup.count = newCount;
                fishGroup.totalValue = newTotalValue;
                fishGroup.totalWeight -= (fishToSell.weight || 1) * quantity;
            }
            
            // Mark game state as dirty for saving
            this.gameState.markDirty();
            
            // Show sale notification
            this.showNotification(`Sold ${fish.name} x${quantity} for $${saleValue}!`);
        }
    }

    sellAllFish() {
        const fishInventory = this.gameState.inventory.fish || [];
        
        if (fishInventory.length === 0) {
            this.showNotification('No fish to sell!');
            return;
        }
        
        // Calculate total value of all fish
        let totalValue = 0;
        let totalFishCount = 0;
        
        fishInventory.forEach(fish => {
            const quantity = fish.quantity || 1;
            const value = (fish.value || fish.coinValue || 50) * quantity;
            totalValue += value;
            totalFishCount += quantity;
        });
        
        // Add money to player
        this.gameState.player.money += totalValue;
        
        // Clear all fish from inventory
        this.gameState.inventory.fish = [];
        
        // Update displays
        this.moneyText.setText(`Money: $${this.gameState.player.money}`);
        
        // Mark game state as dirty for saving
        this.gameState.markDirty();
        
        // Show sale notification
        this.showNotification(`Sold all ${totalFishCount} fish for $${totalValue}!`);
        
        // Refresh the scene to update the display
        this.scene.restart();
    }

    addTestFish() {
        // Initialize fish inventory if it doesn't exist
        if (!this.gameState.inventory.fish) {
            this.gameState.inventory.fish = [];
        }
        
        // Add some test fish with different rarities and values
        const testFish = [
            {
                fishId: 'bass',
                id: 'bass',
                name: 'Bass',
                weight: 2.5,
                rarity: 2,
                value: 150,
                coinValue: 150,
                quantity: 3
            },
            {
                fishId: 'trout',
                id: 'trout', 
                name: 'Rainbow Trout',
                weight: 1.8,
                rarity: 3,
                value: 250,
                coinValue: 250,
                quantity: 2
            },
            {
                fishId: 'salmon',
                id: 'salmon',
                name: 'Atlantic Salmon',
                weight: 4.2,
                rarity: 4,
                value: 500,
                coinValue: 500,
                quantity: 1
            },
            {
                fishId: 'bluegill',
                id: 'bluegill',
                name: 'Bluegill',
                weight: 0.8,
                rarity: 1,
                value: 50,
                coinValue: 50,
                quantity: 5
            }
        ];
        
        // Add test fish to inventory
        testFish.forEach(fish => {
            this.gameState.inventory.fish.push(fish);
        });
        
        // Mark game state as dirty for saving
        this.gameState.markDirty();
        
        // Show notification
        this.showNotification('Added test fish to inventory!');
        
        // Refresh the scene to show the new fish
        this.scene.restart();
    }

    destroy() {
        // Remove DOM button when scene is destroyed
        if (this.sellAllFishButton && this.sellAllFishButton.parentNode) {
            this.sellAllFishButton.parentNode.removeChild(this.sellAllFishButton);
            this.sellAllFishButton = null;
        }
        
                super.destroy();
    }

    shutdown() {
        // Remove DOM button when scene is shut down
        if (this.sellAllFishButton && this.sellAllFishButton.parentNode) {
            this.sellAllFishButton.parentNode.removeChild(this.sellAllFishButton);
            this.sellAllFishButton = null;
        }
        
            }
} 