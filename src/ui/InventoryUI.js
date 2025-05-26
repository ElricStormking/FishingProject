export class InventoryUI {
    constructor(scene, x, y, width, height) {
        console.log('InventoryUI: Constructor called', { scene: scene.scene.key, x, y, width, height });
        
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        this.gameState = scene.gameState;
        this.inventoryManager = this.gameState.inventoryManager;
        
        console.log('InventoryUI: GameState and InventoryManager initialized', {
            gameState: !!this.gameState,
            inventoryManager: !!this.inventoryManager
        });
        
        // UI state
        this.isVisible = false;
        this.currentCategory = 'rods';
        this.selectedItem = null;
        this.draggedItem = null;
        this.searchQuery = '';
        this.sortBy = 'name';
        this.sortAscending = true;
        
        // UI elements
        this.container = null;
        this.background = null;
        this.categoryTabs = {};
        this.itemSlots = [];
        this.tooltip = null;
        this.searchBox = null;
        this.sortButton = null;
        
        // Grid settings
        this.slotSize = 64;
        this.slotPadding = 4;
        this.slotsPerRow = 8;
        this.maxRows = 6;
        
        this.createUI();
        this.setupEventListeners();
    }

    createUI() {
        // Main container
        this.container = this.scene.add.container(this.x, this.y);
        this.container.setVisible(false);
        this.container.setDepth(1000);

        // Background
        this.background = this.scene.add.graphics();
        this.background.fillStyle(0x2a2a2a, 0.95);
        this.background.fillRoundedRect(0, 0, this.width, this.height, 10);
        this.background.lineStyle(2, 0x4a4a4a);
        this.background.strokeRoundedRect(0, 0, this.width, this.height, 10);
        this.container.add(this.background);

        // Title
        const title = this.scene.add.text(this.width / 2, 30, 'INVENTORY', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(title);

        // Close button
        const closeButton = this.scene.add.text(this.width - 30, 30, '×', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ff6666',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive();
        
        closeButton.on('pointerdown', () => this.hide());
        closeButton.on('pointerover', () => closeButton.setColor('#ff9999'));
        closeButton.on('pointerout', () => closeButton.setColor('#ff6666'));
        this.container.add(closeButton);

        // Category tabs
        this.createCategoryTabs();

        // Search and sort controls
        this.createControls();

        // Item grid
        this.createItemGrid();

        // Tooltip
        this.createTooltip();

        // Equipment slots panel
        this.createEquipmentPanel();
    }

    createCategoryTabs() {
        const categories = ['rods', 'lures', 'bait', 'boats', 'upgrades', 'fish', 'consumables', 'materials'];
        const tabWidth = 80;
        const tabHeight = 30;
        const startX = 20;
        const startY = 70;

        categories.forEach((category, index) => {
            const x = startX + (index % 4) * (tabWidth + 5);
            const y = startY + Math.floor(index / 4) * (tabHeight + 5);

            // Tab background
            const tabBg = this.scene.add.graphics();
            const isActive = category === this.currentCategory;
            tabBg.fillStyle(isActive ? 0x4a90e2 : 0x3a3a3a);
            tabBg.fillRoundedRect(x, y, tabWidth, tabHeight, 5);
            tabBg.lineStyle(1, isActive ? 0x6bb6ff : 0x5a5a5a);
            tabBg.strokeRoundedRect(x, y, tabWidth, tabHeight, 5);

            // Tab text
            const tabText = this.scene.add.text(x + tabWidth/2, y + tabHeight/2, 
                category.charAt(0).toUpperCase() + category.slice(1), {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: isActive ? '#ffffff' : '#cccccc'
            }).setOrigin(0.5);

            // Make interactive
            const tabArea = this.scene.add.rectangle(x + tabWidth/2, y + tabHeight/2, tabWidth, tabHeight)
                .setInteractive()
                .setAlpha(0);

            tabArea.on('pointerdown', () => this.switchCategory(category));
            tabArea.on('pointerover', () => {
                if (category !== this.currentCategory) {
                    tabBg.clear();
                    tabBg.fillStyle(0x4a4a4a);
                    tabBg.fillRoundedRect(x, y, tabWidth, tabHeight, 5);
                    tabBg.lineStyle(1, 0x6a6a6a);
                    tabBg.strokeRoundedRect(x, y, tabWidth, tabHeight, 5);
                }
            });
            tabArea.on('pointerout', () => {
                if (category !== this.currentCategory) {
                    tabBg.clear();
                    tabBg.fillStyle(0x3a3a3a);
                    tabBg.fillRoundedRect(x, y, tabWidth, tabHeight, 5);
                    tabBg.lineStyle(1, 0x5a5a5a);
                    tabBg.strokeRoundedRect(x, y, tabWidth, tabHeight, 5);
                }
            });

            this.categoryTabs[category] = { bg: tabBg, text: tabText, area: tabArea };
            this.container.add([tabBg, tabText, tabArea]);
        });
    }

    createControls() {
        const controlsY = 140;

        // Search box background
        const searchBg = this.scene.add.graphics();
        searchBg.fillStyle(0x1a1a1a);
        searchBg.fillRoundedRect(20, controlsY, 200, 30, 5);
        searchBg.lineStyle(1, 0x4a4a4a);
        searchBg.strokeRoundedRect(20, controlsY, 200, 30, 5);
        this.container.add(searchBg);

        // Search placeholder text
        this.searchBox = this.scene.add.text(25, controlsY + 15, 'Search items...', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#888888'
        }).setOrigin(0, 0.5);
        this.container.add(this.searchBox);

        // Sort button
        const sortBg = this.scene.add.graphics();
        sortBg.fillStyle(0x3a3a3a);
        sortBg.fillRoundedRect(240, controlsY, 100, 30, 5);
        sortBg.lineStyle(1, 0x5a5a5a);
        sortBg.strokeRoundedRect(240, controlsY, 100, 30, 5);

        this.sortButton = this.scene.add.text(290, controlsY + 15, 'Sort: Name ↑', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#cccccc'
        }).setOrigin(0.5);

        const sortArea = this.scene.add.rectangle(290, controlsY + 15, 100, 30)
            .setInteractive()
            .setAlpha(0);

        sortArea.on('pointerdown', () => this.cycleSortMode());
        this.container.add([sortBg, this.sortButton, sortArea]);

        // Stats panel
        this.createStatsPanel();
    }

    createStatsPanel() {
        const statsX = this.width - 200;
        const statsY = 140;

        // Stats background
        const statsBg = this.scene.add.graphics();
        statsBg.fillStyle(0x2a2a2a, 0.8);
        statsBg.fillRoundedRect(statsX, statsY, 180, 100, 5);
        statsBg.lineStyle(1, 0x4a4a4a);
        statsBg.strokeRoundedRect(statsX, statsY, 180, 100, 5);
        this.container.add(statsBg);

        // Stats title
        const statsTitle = this.scene.add.text(statsX + 90, statsY + 15, 'INVENTORY STATS', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(statsTitle);

        // Stats text (will be updated dynamically)
        this.statsText = this.scene.add.text(statsX + 10, statsY + 35, '', {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#cccccc',
            lineSpacing: 2
        });
        this.container.add(this.statsText);
    }

    createItemGrid() {
        const gridStartX = 20;
        const gridStartY = 180;
        
        this.itemSlots = [];
        
        for (let row = 0; row < this.maxRows; row++) {
            for (let col = 0; col < this.slotsPerRow; col++) {
                const slotX = gridStartX + col * (this.slotSize + this.slotPadding);
                const slotY = gridStartY + row * (this.slotSize + this.slotPadding);
                
                const slot = this.createItemSlot(slotX, slotY, row * this.slotsPerRow + col);
                this.itemSlots.push(slot);
                this.container.add([slot.bg, slot.area]);
            }
        }
    }

    createItemSlot(x, y, index) {
        // Slot background
        const slotBg = this.scene.add.graphics();
        slotBg.fillStyle(0x1a1a1a);
        slotBg.fillRoundedRect(x, y, this.slotSize, this.slotSize, 3);
        slotBg.lineStyle(1, 0x3a3a3a);
        slotBg.strokeRoundedRect(x, y, this.slotSize, this.slotSize, 3);

        // Interactive area
        const slotArea = this.scene.add.rectangle(
            x + this.slotSize/2, 
            y + this.slotSize/2, 
            this.slotSize, 
            this.slotSize
        ).setInteractive().setAlpha(0);

        // Slot events
        slotArea.on('pointerover', () => this.onSlotHover(index));
        slotArea.on('pointerout', () => this.onSlotOut(index));
        slotArea.on('pointerdown', () => this.onSlotClick(index));

        return {
            bg: slotBg,
            area: slotArea,
            x: x,
            y: y,
            index: index,
            item: null,
            itemSprite: null,
            quantityText: null,
            rarityBorder: null
        };
    }

    createEquipmentPanel() {
        const panelX = this.width - 200;
        const panelY = 260;

        // Equipment panel background
        const equipBg = this.scene.add.graphics();
        equipBg.fillStyle(0x2a2a2a, 0.8);
        equipBg.fillRoundedRect(panelX, panelY, 180, 200, 5);
        equipBg.lineStyle(1, 0x4a4a4a);
        equipBg.strokeRoundedRect(panelX, panelY, 180, 200, 5);
        this.container.add(equipBg);

        // Equipment title
        const equipTitle = this.scene.add.text(panelX + 90, panelY + 15, 'EQUIPPED', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(equipTitle);

        // Equipment slots
        this.equipmentSlots = {};
        const equipSlots = ['rod', 'lure', 'bait', 'boat'];
        
        equipSlots.forEach((slotType, index) => {
            const slotX = panelX + 10 + (index % 2) * 80;
            const slotY = panelY + 40 + Math.floor(index / 2) * 70;
            
            const slot = this.createEquipmentSlot(slotX, slotY, slotType);
            this.equipmentSlots[slotType] = slot;
            this.container.add([slot.bg, slot.label, slot.area]);
        });
    }

    createEquipmentSlot(x, y, slotType) {
        // Slot background
        const slotBg = this.scene.add.graphics();
        slotBg.fillStyle(0x1a1a1a);
        slotBg.fillRoundedRect(x, y, 60, 60, 3);
        slotBg.lineStyle(2, 0x4a90e2);
        slotBg.strokeRoundedRect(x, y, 60, 60, 3);

        // Slot label
        const label = this.scene.add.text(x + 30, y - 10, slotType.toUpperCase(), {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#cccccc'
        }).setOrigin(0.5);

        // Interactive area
        const slotArea = this.scene.add.rectangle(x + 30, y + 30, 60, 60)
            .setInteractive()
            .setAlpha(0);

        slotArea.on('pointerdown', () => this.onEquipmentSlotClick(slotType));

        return {
            bg: slotBg,
            label: label,
            area: slotArea,
            x: x,
            y: y,
            slotType: slotType,
            itemSprite: null
        };
    }

    createTooltip() {
        this.tooltip = this.scene.add.container(0, 0);
        this.tooltip.setVisible(false);
        this.tooltip.setDepth(2000);

        // Tooltip background
        this.tooltipBg = this.scene.add.graphics();
        this.tooltipText = this.scene.add.text(0, 0, '', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 6 },
            wordWrap: { width: 200 }
        });

        this.tooltip.add([this.tooltipBg, this.tooltipText]);
    }

    // Event handlers
    onSlotHover(index) {
        const slot = this.itemSlots[index];
        if (slot.item) {
            this.showTooltip(slot.item, this.scene.input.activePointer.x, this.scene.input.activePointer.y);
            
            // Highlight slot
            slot.bg.clear();
            slot.bg.fillStyle(0x2a2a2a);
            slot.bg.fillRoundedRect(slot.x, slot.y, this.slotSize, this.slotSize, 3);
            slot.bg.lineStyle(2, 0x4a90e2);
            slot.bg.strokeRoundedRect(slot.x, slot.y, this.slotSize, this.slotSize, 3);
        }
    }

    onSlotOut(index) {
        const slot = this.itemSlots[index];
        this.hideTooltip();
        
        // Reset slot appearance
        slot.bg.clear();
        slot.bg.fillStyle(0x1a1a1a);
        slot.bg.fillRoundedRect(slot.x, slot.y, this.slotSize, this.slotSize, 3);
        slot.bg.lineStyle(1, 0x3a3a3a);
        slot.bg.strokeRoundedRect(slot.x, slot.y, this.slotSize, this.slotSize, 3);
    }

    onSlotClick(index) {
        const slot = this.itemSlots[index];
        if (slot.item) {
            this.selectedItem = slot.item;
            
            // Show item actions menu
            this.showItemActions(slot.item, slot.x + this.slotSize/2, slot.y + this.slotSize/2);
        }
    }

    onEquipmentSlotClick(slotType) {
        // Switch to appropriate category and highlight equipped item
        const categoryMap = {
            'rod': 'rods',
            'lure': 'lures', 
            'bait': 'bait',
            'boat': 'boats'
        };
        
        if (categoryMap[slotType]) {
            this.switchCategory(categoryMap[slotType]);
        }
    }

    // UI Management
    show() {
        console.log('InventoryUI: Showing inventory UI');
        this.isVisible = true;
        this.container.setVisible(true);
        this.refreshItems();
        this.updateStats();
        this.updateEquipmentSlots();
        console.log('InventoryUI: Inventory UI shown successfully');
    }

    hide() {
        this.isVisible = false;
        this.container.setVisible(false);
        this.hideTooltip();
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    switchCategory(category) {
        if (this.currentCategory === category) return;
        
        // Update tab appearance
        Object.entries(this.categoryTabs).forEach(([cat, tab]) => {
            const isActive = cat === category;
            tab.bg.clear();
            tab.bg.fillStyle(isActive ? 0x4a90e2 : 0x3a3a3a);
            tab.bg.fillRoundedRect(tab.area.x - tab.area.width/2, tab.area.y - tab.area.height/2, 
                                   tab.area.width, tab.area.height, 5);
            tab.bg.lineStyle(1, isActive ? 0x6bb6ff : 0x5a5a5a);
            tab.bg.strokeRoundedRect(tab.area.x - tab.area.width/2, tab.area.y - tab.area.height/2, 
                                     tab.area.width, tab.area.height, 5);
            tab.text.setColor(isActive ? '#ffffff' : '#cccccc');
        });

        this.currentCategory = category;
        this.refreshItems();
    }

    refreshItems() {
        // Clear existing item displays
        this.itemSlots.forEach(slot => {
            if (slot.itemSprite) {
                slot.itemSprite.destroy();
                slot.itemSprite = null;
            }
            if (slot.quantityText) {
                slot.quantityText.destroy();
                slot.quantityText = null;
            }
            if (slot.rarityBorder) {
                slot.rarityBorder.destroy();
                slot.rarityBorder = null;
            }
            slot.item = null;
        });

        // Get items for current category
        let items = this.gameState.inventory[this.currentCategory] || [];
        
        // Apply search filter
        if (this.searchQuery) {
            items = items.filter(item => 
                item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        }

        // Apply sorting
        items = [...items].sort((a, b) => {
            let valueA = a[this.sortBy];
            let valueB = b[this.sortBy];
            
            if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }
            
            let comparison = 0;
            if (valueA < valueB) comparison = -1;
            else if (valueA > valueB) comparison = 1;
            
            return this.sortAscending ? comparison : -comparison;
        });

        // Display items
        items.forEach((item, index) => {
            if (index < this.itemSlots.length) {
                this.displayItemInSlot(item, index);
            }
        });
    }

    displayItemInSlot(item, slotIndex) {
        const slot = this.itemSlots[slotIndex];
        slot.item = item;

        // Create item sprite (placeholder colored rectangle for now)
        const rarityColor = this.inventoryManager.validator.getRarityColor(item.rarity);
        slot.itemSprite = this.scene.add.graphics();
        slot.itemSprite.fillStyle(parseInt(rarityColor.replace('#', '0x')));
        slot.itemSprite.fillRoundedRect(
            slot.x + 8, slot.y + 8, 
            this.slotSize - 16, this.slotSize - 16, 
            3
        );

        // Add item icon/text
        const itemText = this.scene.add.text(
            slot.x + this.slotSize/2, 
            slot.y + this.slotSize/2, 
            item.name.substring(0, 3).toUpperCase(), {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        slot.itemSprite.add = itemText; // Store reference

        // Add quantity text for stackable items
        if (item.quantity && item.quantity > 1) {
            slot.quantityText = this.scene.add.text(
                slot.x + this.slotSize - 5, 
                slot.y + this.slotSize - 5, 
                item.quantity.toString(), {
                fontSize: '10px',
                fontFamily: 'Arial',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 2, y: 1 }
            }).setOrigin(1);
        }

        // Add equipped indicator
        if (item.equipped) {
            slot.rarityBorder = this.scene.add.graphics();
            slot.rarityBorder.lineStyle(3, 0x00ff00);
            slot.rarityBorder.strokeRoundedRect(slot.x, slot.y, this.slotSize, this.slotSize, 3);
        }

        this.container.add([slot.itemSprite, itemText]);
        if (slot.quantityText) this.container.add(slot.quantityText);
        if (slot.rarityBorder) this.container.add(slot.rarityBorder);
    }

    updateEquipmentSlots() {
        const equipped = this.inventoryManager.getEquippedItems();
        
        Object.entries(this.equipmentSlots).forEach(([slotType, slot]) => {
            // Clear existing item
            if (slot.itemSprite) {
                slot.itemSprite.destroy();
                slot.itemSprite = null;
            }

            // Find equipped item for this slot
            const categoryMap = {
                'rod': 'rods',
                'lure': 'lures',
                'bait': 'bait', 
                'boat': 'boats'
            };
            
            const category = categoryMap[slotType];
            if (category && equipped[category] && equipped[category].length > 0) {
                const item = equipped[category][0];
                
                // Create item display
                const rarityColor = this.inventoryManager.validator.getRarityColor(item.rarity);
                slot.itemSprite = this.scene.add.graphics();
                slot.itemSprite.fillStyle(parseInt(rarityColor.replace('#', '0x')));
                slot.itemSprite.fillRoundedRect(
                    slot.x + 5, slot.y + 5, 
                    50, 50, 
                    3
                );

                const itemText = this.scene.add.text(
                    slot.x + 30, slot.y + 30, 
                    item.name.substring(0, 2).toUpperCase(), {
                    fontSize: '12px',
                    fontFamily: 'Arial',
                    color: '#ffffff',
                    fontStyle: 'bold'
                }).setOrigin(0.5);

                this.container.add([slot.itemSprite, itemText]);
            }
        });
    }

    updateStats() {
        const stats = this.inventoryManager.getInventoryStats();
        const categoryStats = stats.categories[this.currentCategory];
        
        if (categoryStats) {
            const statsText = [
                `Items: ${categoryStats.count}/${categoryStats.limit}`,
                `Equipped: ${categoryStats.equipped}`,
                `Total Qty: ${categoryStats.totalQuantity}`,
                `Value: ${categoryStats.totalValue} coins`
            ].join('\n');
            
            this.statsText.setText(statsText);
        }
    }

    cycleSortMode() {
        const sortModes = ['name', 'rarity', 'unlockLevel', 'cost'];
        const currentIndex = sortModes.indexOf(this.sortBy);
        
        if (currentIndex === sortModes.length - 1) {
            // Last mode, switch to first and toggle direction
            this.sortBy = sortModes[0];
            this.sortAscending = !this.sortAscending;
        } else {
            // Next mode
            this.sortBy = sortModes[currentIndex + 1];
        }
        
        const arrow = this.sortAscending ? '↑' : '↓';
        this.sortButton.setText(`Sort: ${this.sortBy} ${arrow}`);
        this.refreshItems();
    }

    showTooltip(item, x, y) {
        const rarityName = this.inventoryManager.validator.getRarityName(item.rarity);
        const rarityColor = this.inventoryManager.validator.getRarityColor(item.rarity);
        
        let tooltipText = `${item.name}\n`;
        tooltipText += `${rarityName} ${item.type || ''}\n`;
        tooltipText += `${item.description}\n`;
        
        if (item.stats) {
            tooltipText += '\nStats:\n';
            Object.entries(item.stats).forEach(([stat, value]) => {
                tooltipText += `  ${stat}: ${value}\n`;
            });
        }
        
        if (item.quantity && item.quantity > 1) {
            tooltipText += `\nQuantity: ${item.quantity}`;
        }
        
        if (item.condition !== undefined && item.durability) {
            const conditionPercent = Math.round((item.condition / item.durability) * 100);
            tooltipText += `\nCondition: ${conditionPercent}%`;
        }

        this.tooltipText.setText(tooltipText);
        this.tooltipText.setColor(rarityColor);
        
        // Position tooltip
        this.tooltip.setPosition(x + 10, y - 50);
        this.tooltip.setVisible(true);
    }

    hideTooltip() {
        this.tooltip.setVisible(false);
    }

    showItemActions(item, x, y) {
        // Create context menu for item actions
        // This would show options like Equip/Unequip, Drop, Use, etc.
        console.log('Item actions for:', item.name);
    }

    setupEventListeners() {
        // Listen for inventory changes
        this.inventoryManager.on('itemAdded', () => {
            if (this.isVisible) {
                this.refreshItems();
                this.updateStats();
                this.updateEquipmentSlots();
            }
        });

        this.inventoryManager.on('itemRemoved', () => {
            if (this.isVisible) {
                this.refreshItems();
                this.updateStats();
                this.updateEquipmentSlots();
            }
        });

        this.inventoryManager.on('itemEquipped', () => {
            if (this.isVisible) {
                this.refreshItems();
                this.updateEquipmentSlots();
            }
        });

        this.inventoryManager.on('itemUnequipped', () => {
            if (this.isVisible) {
                this.refreshItems();
                this.updateEquipmentSlots();
            }
        });
    }

    destroy() {
        if (this.container) {
            this.container.destroy();
        }
        if (this.tooltip) {
            this.tooltip.destroy();
        }
    }
}

export default InventoryUI; 