import { gameDataLoader } from '../scripts/DataLoader.js';

export class ShopUI {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isVisible = false;
        this.gameState = scene.gameState;
        
        this.container = scene.add.container(0, 0);
        this.container.setDepth(1000);
        this.container.setVisible(false);
        
        this.scrollOffset = 0;
        this.maxScroll = 0;
        
        // Create DOM button for selling all fish
        this.createSellAllFishButton();
        
        this.createUI();
        this.setupEventListeners();
        
        console.log('ShopUI: Shop UI component created successfully');
    }

    createUI() {
        // Main panel background
        this.background = this.scene.add.graphics();
        this.background.fillStyle(0x1a1a2e, 0.95);
        this.background.fillRoundedRect(this.x, this.y, this.width, this.height, 15);
        this.background.lineStyle(3, 0xf39c12);
        this.background.strokeRoundedRect(this.x, this.y, this.width, this.height, 15);
        this.container.add(this.background);

        // Header with title and close button
        this.createHeader();
        
        // Player money display
        this.createMoneyDisplay();
        
        // Content area with scrollable shop items
        this.createContentArea();
        
        // Shop categories and items
        this.createShopContent();
        
        // Scroll indicators
        this.createScrollIndicators();
    }

    createHeader() {
        // Header background
        const headerBg = this.scene.add.graphics();
        headerBg.fillStyle(0xf39c12, 0.8);
        headerBg.fillRoundedRect(this.x, this.y, this.width, 50, { tl: 15, tr: 15, bl: 0, br: 0 });
        this.container.add(headerBg);

        // Title
        const title = this.scene.add.text(this.x + this.width / 2, this.y + 25, '🏪 FISHING SHOP', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(title);

        // Close button
        const closeButton = this.scene.add.graphics();
        closeButton.fillStyle(0xc0392b);
        closeButton.fillCircle(this.x + this.width - 25, this.y + 25, 15);
        closeButton.lineStyle(2, 0xffffff);
        closeButton.strokeCircle(this.x + this.width - 25, this.y + 25, 15);
        this.container.add(closeButton);

        const closeX = this.scene.add.text(this.x + this.width - 25, this.y + 25, '✕', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(closeX);

        // Make close button interactive
        const closeHitArea = this.scene.add.circle(this.x + this.width - 25, this.y + 25, 15, 0x000000, 0);
        closeHitArea.setInteractive({ useHandCursor: true });
        closeHitArea.on('pointerdown', () => this.hide());
        this.container.add(closeHitArea);
    }

    createMoneyDisplay() {
        // Money background
        const moneyBg = this.scene.add.graphics();
        moneyBg.fillStyle(0x27ae60, 0.8);
        moneyBg.fillRoundedRect(this.x + 20, this.y + 60, this.width - 40, 30, 8);
        this.container.add(moneyBg);

        // Money text
        this.moneyText = this.scene.add.text(this.x + this.width / 2, this.y + 75, `💰 Money: ${this.gameState.player.money} coins`, {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(this.moneyText);
    }

    createContentArea() {
        // Content area background
        this.contentBg = this.scene.add.graphics();
        this.contentBg.fillStyle(0x2c3e50, 0.7);
        this.contentBg.fillRoundedRect(this.x + 10, this.y + 100, this.width - 20, this.height - 110, 10);
        this.container.add(this.contentBg);

        // Create scrollable content container
        this.scrollContainer = this.scene.add.container(0, 0);
        this.container.add(this.scrollContainer);

        // Create mask for scrollable area
        const maskShape = this.scene.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(this.x + 10, this.y + 100, this.width - 20, this.height - 110);
        
        const mask = maskShape.createGeometryMask();
        this.scrollContainer.setMask(mask);
    }

    createShopContent() {
        let currentY = this.y + 120;
        const sectionSpacing = 40;
        const itemSpacing = 35;

        // Shop categories using data-driven equipment
        currentY = this.createShopSection('RODS', currentY, gameDataLoader.getAllRods(), itemSpacing);
        currentY += sectionSpacing;
        
        currentY = this.createShopSection('LURES', currentY, gameDataLoader.getAllLures(), itemSpacing);
        currentY += sectionSpacing;
        
        currentY = this.createShopSection('BOATS', currentY, gameDataLoader.getAllBoats(), itemSpacing);
        currentY += sectionSpacing;
        
        currentY = this.createShopSection('ITEMS', currentY, this.getConsumableItems(), itemSpacing);
        currentY += sectionSpacing;
        
        // Fish inventory section for selling
        currentY = this.createFishInventorySection(currentY, itemSpacing);

        // Calculate max scroll based on content height
        const contentHeight = currentY - (this.y + 120);
        const viewportHeight = this.height - 110;
        this.maxScroll = Math.max(0, contentHeight - viewportHeight);
    }

    createShopSection(title, startY, items, itemSpacing) {
        let currentY = startY;
        
        // Section title with background
        const titleBg = this.scene.add.graphics();
        titleBg.fillStyle(0x3498db, 0.8);
        titleBg.fillRoundedRect(this.x + 20, currentY - 10, this.width - 40, 25, 5);
        this.scrollContainer.add(titleBg);
        
        const sectionTitle = this.scene.add.text(this.x + this.width / 2, currentY + 2, title, {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.scrollContainer.add(sectionTitle);
        
        currentY += 35;

        // Items
        items.forEach((item, index) => {
            const itemY = currentY + (index * itemSpacing);
            this.createShopItem(item, itemY, title.toLowerCase());
        });
        
        return currentY + (items.length * itemSpacing) + 10;
    }

    createShopItem(item, itemY, category) {
        const isOwned = this.gameState.inventory[category] && this.gameState.inventory[category].some(owned => owned.id === item.id);
        const canAfford = this.gameState.player.money >= item.cost;
        const isUnlocked = this.gameState.player.level >= (item.unlockLevel || 1);
        
        // Item background
        const itemBg = this.scene.add.graphics();
        const bgColor = isOwned ? 0x555555 : (canAfford && isUnlocked ? 0x34495e : 0x2c3e50);
        itemBg.fillStyle(bgColor, 0.8);
        itemBg.fillRoundedRect(this.x + 25, itemY - 12, this.width - 50, 30, 5);
        this.scrollContainer.add(itemBg);

        // Item icon (simple colored circle for now)
        const iconColor = this.getItemIconColor(category);
        const icon = this.scene.add.graphics();
        icon.fillStyle(iconColor);
        icon.fillCircle(this.x + 45, itemY, 8);
        this.scrollContainer.add(icon);

        // Item name and price
        const textColor = isOwned ? '#888888' : (canAfford && isUnlocked ? '#ffffff' : '#666666');
        const statusText = isOwned ? ' (OWNED)' : (!isUnlocked ? ` (LVL ${item.unlockLevel})` : '');
        
        const itemText = this.scene.add.text(this.x + 65, itemY - 8, 
            `${item.name}${statusText}`, {
            fontSize: '14px',
            fill: textColor,
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        this.scrollContainer.add(itemText);

        const priceText = this.scene.add.text(this.x + 65, itemY + 5, 
            `${item.cost} coins`, {
            fontSize: '12px',
            fill: '#f39c12',
            fontFamily: 'Arial'
        });
        this.scrollContainer.add(priceText);

        // Item description (wrapped)
        const descText = this.scene.add.text(this.x + this.width * 0.5, itemY - 4, 
            item.description || 'No description', {
            fontSize: '11px',
            fill: '#cccccc',
            fontFamily: 'Arial',
            wordWrap: { width: this.width * 0.35 }
        });
        this.scrollContainer.add(descText);

        // Buy button - Show for all non-owned items but with different states
        if (!isOwned) {
            let buttonColor, buttonText, buttonTextColor, isEnabled;
            
            if (!isUnlocked) {
                // Locked due to level requirement
                buttonColor = 0x6c757d;
                buttonText = `LVL ${item.unlockLevel}`;
                buttonTextColor = '#ffffff';
                isEnabled = false;
            } else if (!canAfford) {
                // Can't afford
                buttonColor = 0xdc3545;
                buttonText = 'NO COINS';
                buttonTextColor = '#ffffff';
                isEnabled = false;
            } else {
                // Can buy
                buttonColor = 0x27ae60;
                buttonText = 'BUY';
                buttonTextColor = '#ffffff';
                isEnabled = true;
            }
            
            const buyButton = this.scene.add.graphics();
            buyButton.fillStyle(buttonColor);
            buyButton.fillRoundedRect(this.x + this.width - 80, itemY - 8, 50, 20, 5);
            buyButton.lineStyle(1, isEnabled ? 0x2ecc71 : 0x666666);
            buyButton.strokeRoundedRect(this.x + this.width - 80, itemY - 8, 50, 20, 5);
            this.scrollContainer.add(buyButton);

            const buyTextElement = this.scene.add.text(this.x + this.width - 55, itemY + 2, buttonText, {
                fontSize: '10px',
                fill: buttonTextColor,
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            this.scrollContainer.add(buyTextElement);

            // Make buy button interactive only if enabled
            if (isEnabled) {
                const buyHitArea = this.scene.add.rectangle(this.x + this.width - 55, itemY + 2, 50, 20, 0x000000, 0);
                buyHitArea.setInteractive({ useHandCursor: true });
                buyHitArea.on('pointerover', () => {
                    buyButton.clear();
                    buyButton.fillStyle(0x2ecc71);
                    buyButton.fillRoundedRect(this.x + this.width - 80, itemY - 8, 50, 20, 5);
                    buyButton.lineStyle(1, 0x27ae60);
                    buyButton.strokeRoundedRect(this.x + this.width - 80, itemY - 8, 50, 20, 5);
                });
                buyHitArea.on('pointerout', () => {
                    buyButton.clear();
                    buyButton.fillStyle(0x27ae60);
                    buyButton.fillRoundedRect(this.x + this.width - 80, itemY - 8, 50, 20, 5);
                    buyButton.lineStyle(1, 0x2ecc71);
                    buyButton.strokeRoundedRect(this.x + this.width - 80, itemY - 8, 50, 20, 5);
                });
                buyHitArea.on('pointerdown', () => this.buyItem(category, item));
                this.scrollContainer.add(buyHitArea);
            } else {
                // Add disabled button feedback
                const disabledHitArea = this.scene.add.rectangle(this.x + this.width - 55, itemY + 2, 50, 20, 0x000000, 0);
                disabledHitArea.setInteractive({ useHandCursor: false });
                disabledHitArea.on('pointerdown', () => {
                    if (!isUnlocked) {
                        this.showNotification(`Requires Level ${item.unlockLevel}!`, 0xe67e22);
                    } else if (!canAfford) {
                        this.showNotification(`Need ${item.cost - this.gameState.player.money} more coins!`, 0xe74c3c);
                    }
                });
                this.scrollContainer.add(disabledHitArea);
            }
        }
    }

    getItemIconColor(category) {
        switch (category) {
            case 'rods': return 0x8B4513;
            case 'lures': return 0xFF6347;
            case 'boats': return 0x4682B4;
            case 'items': return 0x32CD32;
            default: return 0x808080;
        }
    }

    getConsumableItems() {
        // Return consumable items like energy potions, bait, etc.
        return [
            {
                id: 'energy_potion',
                name: 'Energy Potion',
                description: 'Restores 50 energy points',
                cost: 25,
                unlockLevel: 1,
                type: 'consumable',
                effect: { energy: 50 }
            },
            {
                id: 'basic_bait',
                name: 'Basic Bait',
                description: 'Simple worms for catching common fish',
                cost: 10,
                unlockLevel: 1,
                type: 'consumable',
                effect: { catchRate: 0.1, uses: 20 }
            },
            {
                id: 'fishing_line',
                name: 'Fishing Line',
                description: 'Replace worn fishing line',
                cost: 15,
                unlockLevel: 1,
                type: 'consumable',
                effect: { durability: 100 }
            },
            {
                id: 'premium_bait',
                name: 'Premium Bait',
                description: 'Attracts rare fish (10 uses)',
                cost: 75,
                unlockLevel: 2,
                type: 'consumable',
                effect: { rareChance: 0.3, uses: 10 }
            },
            {
                id: 'luck_charm',
                name: 'Luck Charm',
                description: 'Increases catch rate for 10 minutes',
                cost: 100,
                unlockLevel: 3,
                type: 'consumable',
                effect: { luck: 0.2, duration: 600 }
            },
            {
                id: 'super_energy_potion',
                name: 'Super Energy Potion',
                description: 'Restores full energy',
                cost: 50,
                unlockLevel: 5,
                type: 'consumable',
                effect: { energy: 100 }
            }
        ];
    }

    createScrollIndicators() {
        // Scroll up indicator/button
        this.scrollUpIndicator = this.scene.add.text(this.x + this.width - 30, this.y + 110, '▲', {
            fontSize: '20px',
            fill: '#3498db',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(15000);
        
        this.scrollUpIndicator.setInteractive({ useHandCursor: true });
        this.scrollUpIndicator.on('pointerdown', () => this.scroll(-30));
        this.scrollUpIndicator.on('pointerover', () => this.scrollUpIndicator.setTint(0x2980b9));
        this.scrollUpIndicator.on('pointerout', () => this.scrollUpIndicator.clearTint());
        
        this.container.add(this.scrollUpIndicator);

        // Scroll down indicator/button
        this.scrollDownIndicator = this.scene.add.text(this.x + this.width - 30, this.y + this.height - 30, '▼', {
            fontSize: '20px',
            fill: '#3498db',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(15000);
        
        this.scrollDownIndicator.setInteractive({ useHandCursor: true });
        this.scrollDownIndicator.on('pointerdown', () => this.scroll(30));
        this.scrollDownIndicator.on('pointerover', () => this.scrollDownIndicator.setTint(0x2980b9));
        this.scrollDownIndicator.on('pointerout', () => this.scrollDownIndicator.clearTint());
        
        this.container.add(this.scrollDownIndicator);
    }

    setupEventListeners() {
        // Mouse wheel scrolling
        this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            if (this.isVisible) {
                this.scroll(deltaY > 0 ? 30 : -30);
            }
        });

        // Keyboard scrolling
        this.scene.input.keyboard.on('keydown-UP', () => {
            if (this.isVisible) this.scroll(-30);
        });

        this.scene.input.keyboard.on('keydown-DOWN', () => {
            if (this.isVisible) this.scroll(30);
        });

        // Close with ESC
        this.scene.input.keyboard.on('keydown-ESC', () => {
            if (this.isVisible) this.hide();
        });
    }

    scroll(amount) {
        this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset + amount, 0, this.maxScroll);
        this.scrollContainer.setY(-this.scrollOffset);
        this.updateScrollIndicators();
    }

    updateScrollIndicators() {
        this.scrollUpIndicator.setAlpha(this.scrollOffset > 0 ? 1 : 0.3);
        this.scrollDownIndicator.setAlpha(this.scrollOffset < this.maxScroll ? 1 : 0.3);
    }

    buyItem(category, item) {
        try {
            if (!this.gameState.spendMoney(item.cost)) {
                this.showNotification('Not enough money!', 0xe74c3c);
                return;
            }

            // Add item to inventory
            this.gameState.addItem(category, item);
            
            // Update money display
            this.moneyText.setText(`💰 Money: ${this.gameState.player.money} coins`);
            
            // Show success notification
            this.showNotification(`Purchased: ${item.name}!`, 0x27ae60);
            
            // Refresh shop display
            this.refreshShop();
            
            console.log(`ShopUI: Purchased ${item.name} for ${item.cost} coins`);
            
        } catch (error) {
            console.error('ShopUI: Error purchasing item:', error);
            this.showNotification('Purchase failed!', 0xe74c3c);
        }
    }

    refreshShop() {
        // Clear and recreate shop content
        this.scrollContainer.removeAll(true);
        this.scrollOffset = 0;
        this.createShopContent();
        this.updateScrollIndicators();
    }

    showNotification(text, color = 0x27ae60) {
        const notification = this.scene.add.text(
            this.x + this.width / 2,
            this.y + this.height / 2,
            text,
            {
                fontSize: '18px',
                fill: '#ffffff',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                backgroundColor: Phaser.Display.Color.IntegerToRGB(color).rgba,
                padding: { x: 16, y: 8 }
            }
        ).setOrigin(0.5);
        
        notification.setDepth(1100);

        this.scene.tweens.add({
            targets: notification,
            alpha: 0,
            y: notification.y - 50,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => notification.destroy()
        });
    }

    show() {
        if (!this.gameState.canAccessShop()) {
            this.scene.showErrorMessage('Shop only available at Starting Port!');
            return;
        }

        this.isVisible = true;
        this.container.setVisible(true);
        
        // Hide fish button when shop is open
        if (this.scene.hideFishButton) {
            this.scene.hideFishButton();
        }
        
        // Show DOM button
        if (this.sellAllFishButton) {
            this.sellAllFishButton.style.display = 'block';
        }
        
        // Update money display
        this.moneyText.setText(`💰 Money: ${this.gameState.player.money} coins`);
        
        // Refresh shop content
        this.refreshShop();
        
        // Play sound effect
        if (this.scene.audioManager) {
            this.scene.audioManager.playSFX('button');
        }
        
        console.log('ShopUI: Shop interface opened');
    }

    hide() {
        this.isVisible = false;
        this.container.setVisible(false);
        this.scrollOffset = 0;
        this.scrollContainer.setY(0);
        
        // Show fish button when shop is closed
        if (this.scene.showFishButton) {
            this.scene.showFishButton();
        }
        
        // Hide DOM button
        if (this.sellAllFishButton) {
            this.sellAllFishButton.style.display = 'none';
        }
        
        console.log('ShopUI: Shop interface closed');
    }

    destroy() {
        // Remove DOM button
        if (this.sellAllFishButton && this.sellAllFishButton.parentNode) {
            this.sellAllFishButton.parentNode.removeChild(this.sellAllFishButton);
            this.sellAllFishButton = null;
        }
        
        if (this.container) {
            this.container.destroy();
        }
        console.log('ShopUI: Shop UI destroyed');
    }

    createFishInventorySection(startY, itemSpacing) {
        let currentY = startY;
        
        // Get player's fish inventory
        const fishInventory = this.gameState.inventory.fish || [];
        console.log('ShopUI: Fish inventory:', fishInventory);
        
        // Section title with background
        const titleBg = this.scene.add.graphics();
        titleBg.fillStyle(0xe74c3c, 0.8);
        titleBg.fillRoundedRect(this.x + 20, currentY - 10, this.width - 40, 25, 5);
        this.scrollContainer.add(titleBg);
        
        const sectionTitle = this.scene.add.text(this.x + this.width / 2, currentY + 2, 'YOUR FISH INVENTORY', {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.scrollContainer.add(sectionTitle);
        
        currentY += 35;
        
        // If no fish, show message
        if (fishInventory.length === 0) {
            const noFishText = this.scene.add.text(this.x + this.width / 2, currentY, 'No fish caught yet!\nGo fishing to collect fish to sell.', {
                fontSize: '14px',
                fill: '#888888',
                fontFamily: 'Arial',
                align: 'center'
            }).setOrigin(0.5);
            this.scrollContainer.add(noFishText);
            
            // Add test fish button for debugging
            const testFishButton = this.scene.add.graphics();
            testFishButton.fillStyle(0x3498db, 0.8);
            testFishButton.fillRoundedRect(this.x + this.width / 2 - 75, currentY + 30, 150, 25, 5);
            this.scrollContainer.add(testFishButton);
            
            const testFishText = this.scene.add.text(this.x + this.width / 2, currentY + 42, 'ADD TEST FISH', {
                fontSize: '12px',
                fill: '#ffffff',
                fontFamily: 'Arial',
                fontWeight: 'bold'
            }).setOrigin(0.5);
            this.scrollContainer.add(testFishText);
            
            // Make test fish button interactive
            const testFishHitArea = this.scene.add.rectangle(this.x + this.width / 2, currentY + 42, 150, 25, 0x000000, 0);
            testFishHitArea.setInteractive({ useHandCursor: true });
            testFishHitArea.on('pointerdown', () => this.addTestFish());
            this.scrollContainer.add(testFishHitArea);
            
            return currentY + 70;
        }
        
        // "Sell All" button
        const sellAllButton = this.scene.add.graphics();
        sellAllButton.fillStyle(0xe74c3c, 0.8);
        sellAllButton.fillRoundedRect(this.x + this.width / 2 - 75, currentY, 150, 25, 5);
        this.scrollContainer.add(sellAllButton);
        
        const sellAllText = this.scene.add.text(this.x + this.width / 2, currentY + 12, 'SELL ALL FISH', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        this.scrollContainer.add(sellAllText);
        
        // Make sell all button interactive
        const sellAllHitArea = this.scene.add.rectangle(this.x + this.width / 2, currentY + 12, 150, 25, 0x000000, 0);
        sellAllHitArea.setInteractive({ useHandCursor: true });
        sellAllHitArea.on('pointerdown', () => this.sellAllFish());
        this.scrollContainer.add(sellAllHitArea);
        
        currentY += 35;
        
        // Group fish by species
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
            this.createFishInventoryItem(group, itemY);
        });
        
        return currentY + (Object.keys(fishGroups).length * itemSpacing) + 10;
    }

    createFishInventoryItem(fishGroup, itemY) {
        const fish = fishGroup.fish;
        const count = fishGroup.count;
        const totalValue = fishGroup.totalValue;
        const avgWeight = (fishGroup.totalWeight / count).toFixed(1);
        
        // Fish item background
        const itemBg = this.scene.add.graphics();
        itemBg.fillStyle(0x34495e, 0.8);
        itemBg.fillRoundedRect(this.x + 25, itemY - 12, this.width - 50, 30, 5);
        this.scrollContainer.add(itemBg);
        
        // Fish icon (rarity-colored circle)
        const rarityColors = [0x8B4513, 0x4169E1, 0x32CD32, 0xFF6347, 0xFFD700, 0x9370DB];
        const iconColor = rarityColors[Math.min((fish.rarity || 1) - 1, rarityColors.length - 1)];
        const fishIcon = this.scene.add.graphics();
        fishIcon.fillStyle(iconColor);
        fishIcon.fillCircle(this.x + 45, itemY, 8);
        this.scrollContainer.add(fishIcon);
        
        // Fish name and count
        const fishText = this.scene.add.text(this.x + 65, itemY - 8, `${fish.name} x${count}`, {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        this.scrollContainer.add(fishText);
        
        // Weight and value info
        const infoText = this.scene.add.text(this.x + 65, itemY + 4, `${avgWeight}kg avg • $${totalValue} total`, {
            fontSize: '10px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        });
        this.scrollContainer.add(infoText);
        
        // Sell button
        const sellButton = this.scene.add.graphics();
        sellButton.fillStyle(0xe67e22, 0.8);
        sellButton.fillRoundedRect(this.x + this.width - 85, itemY - 8, 60, 16, 3);
        this.scrollContainer.add(sellButton);
        
        const sellButtonText = this.scene.add.text(this.x + this.width - 55, itemY, 'SELL', {
            fontSize: '10px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        this.scrollContainer.add(sellButtonText);
        
        // Make sell button interactive
        const sellHitArea = this.scene.add.rectangle(this.x + this.width - 55, itemY, 60, 16, 0x000000, 0);
        sellHitArea.setInteractive({ useHandCursor: true });
        sellHitArea.on('pointerdown', () => this.sellFish(fish, fishGroup, fishText, infoText, sellButton, sellButtonText, sellHitArea));
        this.scrollContainer.add(sellHitArea);
    }

    sellFish(fish, fishGroup, fishText, infoText, sellButton, sellButtonText, sellHitArea) {
        const fishId = fish.fishId || fish.id || fish.name;
        const fishInventory = this.gameState.inventory.fish || [];
        
        // Find and remove one fish of this type
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
            
            // Update money display
            this.moneyText.setText(`💰 Money: ${this.gameState.player.money} coins`);
            
            // Update fish display
            const newCount = fishGroup.count - quantity;
            if (newCount <= 0) {
                // Remove the item if no more fish of this type
                fishText.setText(`${fish.name} - SOLD OUT`);
                fishText.setColor('#666666');
                infoText.setText('');
                sellButton.setVisible(false);
                sellButtonText.setVisible(false);
                sellHitArea.setVisible(false);
            } else {
                // Update the display with new count
                const newTotalValue = fishGroup.totalValue - saleValue;
                const newAvgWeight = ((fishGroup.totalWeight - (fishToSell.weight || 1) * quantity) / newCount).toFixed(1);
                fishText.setText(`${fish.name} x${newCount}`);
                infoText.setText(`${newAvgWeight}kg avg • $${newTotalValue} total`);
                
                // Update the group data
                fishGroup.count = newCount;
                fishGroup.totalValue = newTotalValue;
                fishGroup.totalWeight -= (fishToSell.weight || 1) * quantity;
            }
            
            // Mark game state as dirty for saving
            this.gameState.markDirty();
            
            // Show notification
            this.showNotification(`Sold ${fish.name} x${quantity} for $${saleValue}!`, 0x27ae60);
        }
    }

    sellAllFish() {
        const fishInventory = this.gameState.inventory.fish || [];
        
        if (fishInventory.length === 0) {
            this.showNotification('No fish to sell!', 0xe74c3c);
            return;
        }
        
        // Calculate total value
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
        
        // Update money display
        this.moneyText.setText(`💰 Money: ${this.gameState.player.money} coins`);
        
        // Mark game state as dirty for saving
        this.gameState.markDirty();
        
        // Show notification
        this.showNotification(`Sold all ${totalFishCount} fish for $${totalValue}!`, 0x27ae60);
        
        // Refresh the shop to update display
        this.refreshShop();
    }

    addTestFish() {
        // Initialize fish inventory if it doesn't exist
        if (!this.gameState.inventory.fish) {
            this.gameState.inventory.fish = [];
        }
        
        // Add test fish
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
        this.showNotification('Added test fish to inventory!', 0x3498db);
        
        // Refresh the shop to show the new fish
        this.refreshShop();
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
            display: none;
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
        
        console.log('ShopUI: DOM Sell All Fish button created');
    }
} 