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
        this.audioManager = this.gameState.getAudioManager(scene);
        
        console.log('InventoryUI: GameState, InventoryManager, and AudioManager initialized', {
            gameState: !!this.gameState,
            inventoryManager: !!this.inventoryManager,
            audioManager: !!this.audioManager
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
        // Create a click blocker behind the container
        this.clickBlocker = this.scene.add.rectangle(
            this.x + this.width/2, 
            this.y + this.height/2, 
            this.width + 40, 
            this.height + 40
        ).setInteractive().setAlpha(0).setDepth(9999);
        
        this.clickBlocker.on('pointerdown', (pointer, localX, localY) => {
            console.log('InventoryUI: Click blocker activated - preventing passthrough at', localX, localY);
            // This prevents clicks from going through to elements behind
            pointer.event.stopPropagation();
        });

        // Also make the background itself interactive to block clicks
        this.backgroundBlocker = this.scene.add.rectangle(
            this.x + this.width/2,
            this.y + this.height/2,
            this.width,
            this.height
        ).setInteractive().setAlpha(0).setDepth(9998);
        
        this.backgroundBlocker.on('pointerdown', (pointer, localX, localY) => {
            console.log('InventoryUI: Background blocker activated at', localX, localY);
            pointer.event.stopPropagation();
        });

        // Main container
        this.container = this.scene.add.container(this.x, this.y);
        this.container.setVisible(false);
        this.container.setDepth(10000); // Maximum depth to be above everything

        // Background
        this.background = this.scene.add.graphics();
        this.background.fillStyle(0x2a2a2a, 0.95);
        this.background.fillRoundedRect(0, 0, this.width, this.height, 10);
        this.background.lineStyle(2, 0x4a4a4a);
        this.background.strokeRoundedRect(0, 0, this.width, this.height, 10);
        
        // Make the background itself interactive to block clicks
        this.background.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.width, this.height), Phaser.Geom.Rectangle.Contains);
        this.background.on('pointerdown', (pointer, localX, localY) => {
            console.log('InventoryUI: Background graphics clicked at', localX, localY, '- blocking click passthrough');
            // Block the click from going through
            if (pointer.event) {
                pointer.event.stopPropagation();
            }
        });
        
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
        
        closeButton.on('pointerdown', () => {
            console.log('InventoryUI: Close button clicked!');
            this.audioManager?.playSFX('button');
            this.hide();
        });
        closeButton.on('pointerover', () => closeButton.setColor('#ff9999'));
        closeButton.on('pointerout', () => closeButton.setColor('#ff6666'));
        this.container.add(closeButton);

        // Crafting button
        this.createCraftingButton();

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
        
        console.log('InventoryUI: UI created with container depth:', this.container.depth);
        console.log('InventoryUI: Container position:', this.container.x, this.container.y);
        console.log('InventoryUI: Container size:', this.width, this.height);
        console.log('InventoryUI: Click blocker created at depth:', this.clickBlocker.depth);
        console.log('InventoryUI: Background blocker created at depth:', this.backgroundBlocker.depth);
    }

    createCategoryTabs() {
        const categories = ['rods', 'lures', 'bait', 'boats', 'upgrades', 'fish', 'consumables', 'materials'];
        const tabWidth = 80;
        const tabHeight = 30;
        const startX = 20;
        const startY = 70;

        console.log('InventoryUI: Creating category tabs:', categories);

        categories.forEach((category, index) => {
            const x = startX + (index % 4) * (tabWidth + 5);
            const y = startY + Math.floor(index / 4) * (tabHeight + 5);

            console.log(`InventoryUI: Tab ${index} (${category}): x=${x}, y=${y}`);

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

            // Create a working interactive area (like the Fish test area)
            const tabArea = this.scene.add.rectangle(x + tabWidth/2, y + tabHeight/2, tabWidth, tabHeight)
                .setInteractive()
                .setAlpha(0);

            console.log(`InventoryUI: Setting up tab for category: ${category}`);
            
            tabArea.on('pointerdown', (pointer, localX, localY) => {
                console.log(`InventoryUI: Tab clicked for category: ${category}`);
                console.log(`InventoryUI: Tab area bounds:`, tabArea.getBounds());
                console.log(`InventoryUI: Tab position: x=${x}, y=${y}, width=${tabWidth}, height=${tabHeight}`);
                console.log(`InventoryUI: Local click position:`, localX, localY);
                this.switchCategory(category);
            });
            
            tabArea.on('pointerover', () => {
                console.log(`InventoryUI: Tab hover for category: ${category}`);
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

            this.categoryTabs[category] = { 
                bg: tabBg, 
                text: tabText, 
                area: tabArea,
                x: x,
                y: y,
                width: tabWidth,
                height: tabHeight
            };
            this.container.add([tabBg, tabText, tabArea]);
            
            // Add a working interactive area for ALL tabs (the original tabs don't work)
            // Create outside container with absolute positioning
            const workingTabArea = this.scene.add.rectangle(
                this.x + x + tabWidth/2, 
                this.y + y + tabHeight/2, 
                tabWidth + 5, 
                tabHeight + 5
            ).setInteractive()
            .setAlpha(0.01) // Barely visible but functional
            .setFillStyle(0x000000) // Black fill for functionality
            .setDepth(10002); // Above container and background
            
            workingTabArea.on('pointerdown', () => {
                this.switchCategory(category);
            });
            
            workingTabArea.on('pointerover', () => {
                workingTabArea.setAlpha(0.02); // Slight change for functionality
                if (category !== this.currentCategory) {
                    tabBg.clear();
                    tabBg.fillStyle(0x4a4a4a);
                    tabBg.fillRoundedRect(x, y, tabWidth, tabHeight, 5);
                    tabBg.lineStyle(1, 0x6a6a6a);
                    tabBg.strokeRoundedRect(x, y, tabWidth, tabHeight, 5);
                }
            });
            
            workingTabArea.on('pointerout', () => {
                workingTabArea.setAlpha(0.01); // Back to barely visible
                if (category !== this.currentCategory) {
                    tabBg.clear();
                    tabBg.fillStyle(0x3a3a3a);
                    tabBg.fillRoundedRect(x, y, tabWidth, tabHeight, 5);
                    tabBg.lineStyle(1, 0x5a5a5a);
                    tabBg.strokeRoundedRect(x, y, tabWidth, tabHeight, 5);
                }
            });
            
            // Store reference for cleanup
            this.categoryTabs[category].workingArea = workingTabArea;
        });
    }

    createCraftingButton() {
        // Create crafting button in the top right area
        const buttonX = this.width - 150;
        const buttonY = 30;
        const buttonWidth = 100;
        const buttonHeight = 30;

        // Button background
        const craftingBg = this.scene.add.graphics();
        craftingBg.fillStyle(0x4a90e2);
        craftingBg.fillRoundedRect(buttonX, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);
        craftingBg.lineStyle(2, 0x6bb6ff);
        craftingBg.strokeRoundedRect(buttonX, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);

        // Button text
        const craftingText = this.scene.add.text(buttonX + buttonWidth/2, buttonY, 'CRAFTING', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Make button interactive
        const craftingButton = this.scene.add.rectangle(
            buttonX + buttonWidth/2, 
            buttonY, 
            buttonWidth, 
            buttonHeight
        ).setInteractive().setAlpha(0);

        craftingButton.on('pointerdown', () => {
            console.log('InventoryUI: Crafting button clicked');
            this.openCraftingUI();
        });

        craftingButton.on('pointerover', () => {
            craftingBg.clear();
            craftingBg.fillStyle(0x6bb6ff);
            craftingBg.fillRoundedRect(buttonX, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);
            craftingBg.lineStyle(2, 0x4a90e2);
            craftingBg.strokeRoundedRect(buttonX, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);
        });

        craftingButton.on('pointerout', () => {
            craftingBg.clear();
            craftingBg.fillStyle(0x4a90e2);
            craftingBg.fillRoundedRect(buttonX, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);
            craftingBg.lineStyle(2, 0x6bb6ff);
            craftingBg.strokeRoundedRect(buttonX, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);
        });

        this.container.add([craftingBg, craftingText, craftingButton]);

        // Working interactive area for crafting button
        const workingCraftingButton = this.scene.add.rectangle(
            this.x + buttonX + buttonWidth/2,
            this.y + buttonY,
            buttonWidth + 5,
            buttonHeight + 5
        ).setInteractive()
        .setAlpha(0.01)
        .setFillStyle(0x000000)
        .setDepth(10002);

        workingCraftingButton.on('pointerdown', () => {
            this.openCraftingUI();
        });

        workingCraftingButton.on('pointerover', () => {
            workingCraftingButton.setAlpha(0.02);
            craftingBg.clear();
            craftingBg.fillStyle(0x6bb6ff);
            craftingBg.fillRoundedRect(buttonX, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);
            craftingBg.lineStyle(2, 0x4a90e2);
            craftingBg.strokeRoundedRect(buttonX, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);
        });

        workingCraftingButton.on('pointerout', () => {
            workingCraftingButton.setAlpha(0.01);
            craftingBg.clear();
            craftingBg.fillStyle(0x4a90e2);
            craftingBg.fillRoundedRect(buttonX, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);
            craftingBg.lineStyle(2, 0x6bb6ff);
            craftingBg.strokeRoundedRect(buttonX, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);
        });

        this.craftingButtonArea = workingCraftingButton;
    }

    openCraftingUI() {
        console.log('InventoryUI: Opening Crafting UI');
        this.audioManager?.playSFX('button');
        
        // Hide inventory UI
        this.hide();
        
        // Show crafting UI
        if (this.scene.craftingUI) {
            this.scene.craftingUI.show();
            
            // Store reference that crafting was opened from inventory
            this.scene.craftingUI.openedFromInventory = true;
        } else {
            console.error('InventoryUI: CraftingUI not found in scene');
        }
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
                
                // Add a working interactive area for each slot (the original slots don't work)
                // Create outside container with absolute positioning
                const workingSlotArea = this.scene.add.rectangle(
                    this.x + slotX + this.slotSize/2, 
                    this.y + slotY + this.slotSize/2, 
                    this.slotSize + 2, 
                    this.slotSize + 2
                ).setInteractive()
                .setAlpha(0.01) // Barely visible but functional
                .setFillStyle(0x000000) // Black fill for functionality
                .setDepth(10002); // Above container and background
                
                const slotIndex = row * this.slotsPerRow + col;
                
                workingSlotArea.on('pointerover', () => {
                    workingSlotArea.setAlpha(0.02); // Slight change for functionality
                    this.onSlotHover(slotIndex);
                });
                
                workingSlotArea.on('pointerout', () => {
                    workingSlotArea.setAlpha(0.01); // Back to barely visible
                    this.onSlotOut(slotIndex);
                });
                
                workingSlotArea.on('pointerdown', () => {
                    this.onSlotClick(slotIndex);
                });
                
                // Store reference for cleanup
                slot.workingArea = workingSlotArea;
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

        // Interactive area - make it more reliable like the working tab areas
        const slotArea = this.scene.add.rectangle(
            x + this.slotSize/2, 
            y + this.slotSize/2, 
            this.slotSize, 
            this.slotSize
        ).setInteractive().setAlpha(0);

        // Slot events with better debugging
        slotArea.on('pointerover', () => {
            console.log(`InventoryUI: Slot ${index} hover`);
            this.onSlotHover(index);
        });
        
        slotArea.on('pointerout', () => {
            console.log(`InventoryUI: Slot ${index} out`);
            this.onSlotOut(index);
        });
        
        slotArea.on('pointerdown', () => {
            console.log(`InventoryUI: Slot ${index} clicked`);
            this.onSlotClick(index);
        });

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
        this.tooltip.setDepth(3000);

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
        console.log(`InventoryUI: Slot ${index} clicked, item:`, slot.item);
        
        if (slot.item) {
            this.audioManager?.playSFX('button');
            this.selectedItem = slot.item;
            console.log(`InventoryUI: Selected item: ${slot.item.name}`);
            
            // Add visual feedback for selected item
            slot.bg.clear();
            slot.bg.fillStyle(0x2a2a2a);
            slot.bg.fillRoundedRect(slot.x, slot.y, this.slotSize, this.slotSize, 3);
            slot.bg.lineStyle(3, 0xffff00); // Yellow border for selection
            slot.bg.strokeRoundedRect(slot.x, slot.y, this.slotSize, this.slotSize, 3);
            
            // Show item actions menu
            this.showItemActions(slot.item, slot.x + this.slotSize/2, slot.y + this.slotSize/2);
        } else {
            console.log(`InventoryUI: Empty slot ${index} clicked`);
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
        console.log('InventoryUI: Container position:', this.container.x, this.container.y);
        console.log('InventoryUI: Container visible:', this.container.visible);
        console.log('InventoryUI: Current inventory state:', this.gameState.inventory);
        
        // Debug: Check all display objects and their depths
        console.log('InventoryUI: Checking scene display objects...');
        const displayList = this.scene.children.list;
        const highDepthObjects = displayList.filter(obj => obj.depth >= 1000);
        console.log('InventoryUI: High depth objects (>=1000):', highDepthObjects.map(obj => ({
            type: obj.type || obj.constructor.name,
            depth: obj.depth,
            visible: obj.visible,
            interactive: obj.input ? obj.input.enabled : false
        })));
        
        this.isVisible = true;
        this.clickBlocker.setVisible(true);
        this.backgroundBlocker.setVisible(true);
        this.container.setVisible(true);
        
        // Show working areas
        Object.values(this.categoryTabs).forEach(tab => {
            if (tab.workingArea) {
                tab.workingArea.setVisible(true);
            }
        });
        
        this.itemSlots.forEach(slot => {
            if (slot.workingArea) {
                slot.workingArea.setVisible(true);
            }
        });
        
        // Show crafting button area
        if (this.craftingButtonArea) {
            this.craftingButtonArea.setVisible(true);
        }
        
        // Force refresh all categories to see what's available
        Object.keys(this.gameState.inventory).forEach(category => {
            const items = this.gameState.inventory[category];
            console.log(`InventoryUI: Category ${category} has ${items.length} items:`, items.map(item => item.name));
        });
        
        this.refreshItems();
        this.updateStats();
        this.updateEquipmentSlots();
        console.log('InventoryUI: Inventory UI shown successfully');
        
        // Final depth check
        console.log('InventoryUI: Final container depth:', this.container.depth);
        console.log('InventoryUI: Container in scene children:', this.scene.children.list.includes(this.container));
    }

    hide() {
        this.isVisible = false;
        this.clickBlocker.setVisible(false);
        this.backgroundBlocker.setVisible(false);
        this.container.setVisible(false);
        this.hideTooltip();
        
        // Hide working areas
        Object.values(this.categoryTabs).forEach(tab => {
            if (tab.workingArea) {
                tab.workingArea.setVisible(false);
            }
        });
        
        this.itemSlots.forEach(slot => {
            if (slot.workingArea) {
                slot.workingArea.setVisible(false);
            }
        });
        
        // Hide crafting button area
        if (this.craftingButtonArea) {
            this.craftingButtonArea.setVisible(false);
        }
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    switchCategory(category) {
        console.log('InventoryUI: Switching to category:', category);
        console.log('InventoryUI: Current category:', this.currentCategory);
        
        if (this.currentCategory === category) return;
        
        // Play tab switch sound
        this.audioManager?.playSFX('button');
        
        // Update current category FIRST
        this.currentCategory = category;
        console.log('InventoryUI: Category switched to:', this.currentCategory);
        
        // Update tab appearance
        Object.entries(this.categoryTabs).forEach(([cat, tab]) => {
            const isActive = cat === category;
            console.log(`InventoryUI: Updating tab ${cat}, active: ${isActive}`);
            
            tab.bg.clear();
            tab.bg.fillStyle(isActive ? 0x4a90e2 : 0x3a3a3a);
            tab.bg.fillRoundedRect(tab.x, tab.y, tab.width, tab.height, 5);
            tab.bg.lineStyle(1, isActive ? 0x6bb6ff : 0x5a5a5a);
            tab.bg.strokeRoundedRect(tab.x, tab.y, tab.width, tab.height, 5);
            tab.text.setColor(isActive ? '#ffffff' : '#cccccc');
        });

        // Force a visual update
        this.scene.sys.updateList.update();
        
        this.refreshItems();
        this.updateStats();
    }

    refreshItems() {
        console.log('InventoryUI: Refreshing items for category:', this.currentCategory);
        
        // Debug: Log the entire inventory structure
        console.log('InventoryUI: Full inventory structure:', this.gameState.inventory);
        console.log('InventoryUI: Available categories:', Object.keys(this.gameState.inventory));
        
        // Clear existing item displays
        this.itemSlots.forEach(slot => {
            if (slot.itemSprite) {
                slot.itemSprite.destroy();
                slot.itemSprite = null;
            }
            if (slot.itemText) {
                slot.itemText.destroy();
                slot.itemText = null;
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

        // Get items for current category with error handling
        let items = [];
        try {
            items = this.gameState.inventory[this.currentCategory] || [];
            console.log('InventoryUI: Items in category:', this.currentCategory, items.length, items);
        } catch (error) {
            console.error('InventoryUI: Error accessing inventory category:', error);
            items = [];
        }
        
        // If no items found, try alternative category names
        if (items.length === 0) {
            const alternativeNames = {
                'fish': ['fish', 'fishes', 'caught_fish', 'fishTank'],
                'rods': ['rods', 'rod', 'fishing_rods'],
                'lures': ['lures', 'lure', 'fishing_lures'],
                'bait': ['bait', 'baits', 'fishing_bait']
            };
            
            if (alternativeNames[this.currentCategory]) {
                for (const altName of alternativeNames[this.currentCategory]) {
                    try {
                        if (this.gameState.inventory[altName] && this.gameState.inventory[altName].length > 0) {
                            items = this.gameState.inventory[altName];
                            console.log('InventoryUI: Found items under alternative name:', altName, items.length);
                            break;
                        }
                    } catch (error) {
                        console.warn('InventoryUI: Error checking alternative category:', altName, error);
                    }
                }
            }
        }
        
        // Apply search filter with error handling
        if (this.searchQuery) {
            try {
                items = items.filter(item => {
                    if (!item || !item.name || !item.description) {
                        console.warn('InventoryUI: Invalid item structure:', item);
                        return false;
                    }
                    return item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(this.searchQuery.toLowerCase());
                });
            } catch (error) {
                console.error('InventoryUI: Error filtering items:', error);
            }
        }

        // Apply sorting with error handling
        try {
            items = [...items].sort((a, b) => {
                try {
                    let valueA = a[this.sortBy];
                    let valueB = b[this.sortBy];
                    
                    // Handle undefined values
                    if (valueA === undefined) valueA = '';
                    if (valueB === undefined) valueB = '';
                    
                    if (typeof valueA === 'string') {
                        valueA = valueA.toLowerCase();
                        valueB = valueB.toLowerCase();
                    }
                    
                    let comparison = 0;
                    if (valueA < valueB) comparison = -1;
                    else if (valueA > valueB) comparison = 1;
                    
                    return this.sortAscending ? comparison : -comparison;
                } catch (error) {
                    console.warn('InventoryUI: Error sorting items:', error);
                    return 0;
                }
            });
        } catch (error) {
            console.error('InventoryUI: Error in sorting process:', error);
        }

        console.log('InventoryUI: Displaying', items.length, 'items');
        
        // Add a temporary category indicator
        if (items.length > 0) {
            const categoryIndicator = this.scene.add.text(
                400, 300, 
                `${this.currentCategory.toUpperCase()}: ${items.length} items`, {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#ffff00',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            this.container.add(categoryIndicator);
            
            // Remove after 2 seconds
            this.scene.time.delayedCall(2000, () => {
                if (categoryIndicator) categoryIndicator.destroy();
            });
        } else {
            // Show "no items" indicator
            const noItemsIndicator = this.scene.add.text(
                400, 300, 
                `NO ITEMS IN ${this.currentCategory.toUpperCase()}`, {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#ff6666',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            this.container.add(noItemsIndicator);
            
            // Remove after 3 seconds
            this.scene.time.delayedCall(3000, () => {
                if (noItemsIndicator) noItemsIndicator.destroy();
            });
        }
        
        // Add immediate visual feedback for category switch
        const switchIndicator = this.scene.add.text(
            this.width / 2, 120, 
            `SWITCHED TO: ${this.currentCategory.toUpperCase()}`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#00ff00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.container.add(switchIndicator);
        
        // Remove after 1 second
        this.scene.time.delayedCall(1000, () => {
            if (switchIndicator) switchIndicator.destroy();
        });
        
        // Display items with error handling
        items.forEach((item, index) => {
            if (index < this.itemSlots.length) {
                try {
                    this.displayItemInSlot(item, index);
                } catch (error) {
                    console.error('InventoryUI: Error displaying item in slot:', index, item, error);
                }
            }
        });
    }

    displayItemInSlot(item, slotIndex) {
        console.log('InventoryUI: Displaying item in slot', slotIndex, item.name, item);
        
        // Validate item data
        if (!item || !item.name) {
            console.error('InventoryUI: Invalid item data:', item);
            return;
        }
        
        const slot = this.itemSlots[slotIndex];
        if (!slot) {
            console.error('InventoryUI: Invalid slot index:', slotIndex);
            return;
        }
        
        slot.item = item;

        // Create item sprite (placeholder colored rectangle for now)
        let rarity = item.rarity || 1; // Default to rarity 1 if undefined
        let rarityColor = '#8C7853'; // Default color
        
        try {
            if (this.inventoryManager && this.inventoryManager.validator) {
                rarityColor = this.inventoryManager.validator.getRarityColor(rarity);
            }
        } catch (error) {
            console.log('InventoryUI: Error getting rarity color, using default:', error);
        }
        
        console.log('InventoryUI: Item rarity color:', rarityColor, 'for rarity:', rarity);
        
        // Create a more visible item background
        try {
            slot.itemSprite = this.scene.add.graphics();
            
            // Convert color string to hex number
            let colorHex = 0x8C7853; // Default
            try {
                if (rarityColor.startsWith('#')) {
                    colorHex = parseInt(rarityColor.replace('#', '0x'));
                } else if (rarityColor.startsWith('0x')) {
                    colorHex = parseInt(rarityColor);
                }
            } catch (error) {
                console.log('InventoryUI: Error parsing color, using default');
            }
            
            slot.itemSprite.fillStyle(colorHex);
            slot.itemSprite.fillRoundedRect(
                slot.x + 4, slot.y + 4, 
                this.slotSize - 8, this.slotSize - 8, 
                3
            );
            
            // Add a border to make it more visible
            slot.itemSprite.lineStyle(2, 0xffffff, 0.8);
            slot.itemSprite.strokeRoundedRect(
                slot.x + 4, slot.y + 4, 
                this.slotSize - 8, this.slotSize - 8, 
                3
            );
        } catch (error) {
            console.error('InventoryUI: Error creating item sprite:', error);
            return;
        }

        // Add item icon/text with better visibility
        try {
            const itemText = this.scene.add.text(
                slot.x + this.slotSize/2, 
                slot.y + this.slotSize/2, 
                item.name.substring(0, 3).toUpperCase(), {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            
            console.log('InventoryUI: Created item text:', item.name.substring(0, 3).toUpperCase());
            
            // Store reference for cleanup
            slot.itemText = itemText;
        } catch (error) {
            console.error('InventoryUI: Error creating item text:', error);
        }

        // Add quantity text for stackable items
        try {
            if (item.quantity && item.quantity > 1) {
                slot.quantityText = this.scene.add.text(
                    slot.x + this.slotSize - 8, 
                    slot.y + this.slotSize - 8, 
                    item.quantity.toString(), {
                    fontSize: '12px',
                    fontFamily: 'Arial',
                    color: '#ffff00',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(1);
                console.log('InventoryUI: Added quantity text:', item.quantity);
            }
        } catch (error) {
            console.error('InventoryUI: Error creating quantity text:', error);
        }

        // Add equipped indicator
        try {
            if (item.equipped) {
                slot.rarityBorder = this.scene.add.graphics();
                slot.rarityBorder.lineStyle(4, 0x00ff00);
                slot.rarityBorder.strokeRoundedRect(slot.x + 2, slot.y + 2, this.slotSize - 4, this.slotSize - 4, 3);
                console.log('InventoryUI: Added equipped indicator');
            }
        } catch (error) {
            console.error('InventoryUI: Error creating equipped indicator:', error);
        }

        // Add all elements to container with proper depth
        try {
            this.container.add(slot.itemSprite);
            if (slot.itemText) this.container.add(slot.itemText);
            if (slot.quantityText) this.container.add(slot.quantityText);
            if (slot.rarityBorder) this.container.add(slot.rarityBorder);
        } catch (error) {
            console.error('InventoryUI: Error adding elements to container:', error);
        }
        
        console.log('InventoryUI: Item display completed for slot', slotIndex);
        console.log('InventoryUI: Item sprite position:', slot.x, slot.y);
        console.log('InventoryUI: Container children count:', this.container.list.length);
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
                const rarity = item.rarity || 1; // Default to rarity 1 if undefined
                const rarityColor = this.inventoryManager.validator.getRarityColor(rarity);
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
        const rarity = item.rarity || 1; // Default to rarity 1 if undefined
        const rarityName = this.inventoryManager.validator.getRarityName(rarity);
        const rarityColor = this.inventoryManager.validator.getRarityColor(rarity);
        
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
        console.log('InventoryUI: Showing item actions for:', item.name);
        
        // Create a simple popup showing item info
        const actionPopup = this.scene.add.container(x, y);
        actionPopup.setDepth(11000); // Above inventory
        
        // Popup background
        const popupBg = this.scene.add.graphics();
        popupBg.fillStyle(0x000000, 0.9);
        popupBg.fillRoundedRect(-60, -40, 120, 80, 5);
        popupBg.lineStyle(2, 0xffffff);
        popupBg.strokeRoundedRect(-60, -40, 120, 80, 5);
        
        // Item name
        const itemName = this.scene.add.text(0, -20, item.name, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Item info
        const itemInfo = this.scene.add.text(0, 0, `Value: ${item.value || 0}`, {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#cccccc'
        }).setOrigin(0.5);
        
        // Close instruction
        const closeText = this.scene.add.text(0, 20, 'Click anywhere to close', {
            fontSize: '8px',
            fontFamily: 'Arial',
            color: '#888888'
        }).setOrigin(0.5);
        
        actionPopup.add([popupBg, itemName, itemInfo, closeText]);
        
        // Make popup interactive to close it
        const popupArea = this.scene.add.rectangle(0, 0, 120, 80)
            .setInteractive()
            .setAlpha(0);
        
        popupArea.on('pointerdown', () => {
            console.log('InventoryUI: Closing item actions popup');
            actionPopup.destroy();
        });
        
        actionPopup.add(popupArea);
        
        // Auto-close after 3 seconds
        this.scene.time.delayedCall(3000, () => {
            if (actionPopup) actionPopup.destroy();
        });
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
        // Clean up working areas
        Object.values(this.categoryTabs).forEach(tab => {
            if (tab.workingArea) {
                tab.workingArea.destroy();
            }
        });
        
        this.itemSlots.forEach(slot => {
            if (slot.workingArea) {
                slot.workingArea.destroy();
            }
        });
        
        // Clean up crafting button area
        if (this.craftingButtonArea) {
            this.craftingButtonArea.destroy();
        }
        
        // Clean up blockers
        if (this.clickBlocker) {
            this.clickBlocker.destroy();
        }
        if (this.backgroundBlocker) {
            this.backgroundBlocker.destroy();
        }
        
        if (this.container) {
            this.container.destroy();
        }
        if (this.tooltip) {
            this.tooltip.destroy();
        }
    }
}

export default InventoryUI; 