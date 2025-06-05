import UITheme from './UITheme.js';

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
        this.isDestroyed = false;
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
        ).setInteractive().setAlpha(0).setDepth(this.scene.getUIDepth ? this.scene.getUIDepth('ui_interactive') : 1502);
        
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
        ).setInteractive().setAlpha(0).setDepth(this.scene.getUIDepth ? this.scene.getUIDepth('ui_panels') : 1000);
        
        this.backgroundBlocker.on('pointerdown', (pointer, localX, localY) => {
            console.log('InventoryUI: Background blocker activated at', localX, localY);
            pointer.event.stopPropagation();
        });

        // Main background overlay (to block clicks outside the inventory)
        this.backgroundOverlay = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0x000000,
            0.4
        ).setInteractive().setAlpha(0).setDepth(this.scene.getUIDepth ? this.scene.getUIDepth('overlay') : -10);

        // Additional background for broader area coverage
        this.extendedBackground = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.cameras.main.width * 1.5,
            this.scene.cameras.main.height * 1.5,
            0x000000,
            0.3
        ).setInteractive().setAlpha(0).setDepth(this.scene.getUIDepth ? this.scene.getUIDepth('overlay') : -10);

        // Main inventory container
        this.container = this.scene.add.container(this.x, this.y);
        this.container.setDepth(this.scene.getUIDepth ? this.scene.getUIDepth('ui_panels') : 1000); // Use proper UI depth
        this.container.setVisible(false);

        // Background using UITheme
        this.background = UITheme.createPanel(this.scene, 0, 0, this.width, this.height, 'primary');
        
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

        // Title using UITheme
        const title = UITheme.createText(this.scene, this.width / 2, 30, 'INVENTORY', 'headerLarge');
        title.setOrigin(0.5);
        this.container.add(title);

        // Close button using UITheme
        const closeButton = UITheme.createText(this.scene, this.width - 30, 30, '×', 'error');
        closeButton.setOrigin(0.5).setInteractive();
        closeButton.setFontSize('32px');
        
        closeButton.on('pointerdown', () => {
            try {
                console.log('InventoryUI: Close button clicked!');
                
                // Prevent multiple clicks or clicks on destroyed UI
                if (this.isDestroyed || !this.isVisible) {
                    console.log('InventoryUI: Close button clicked but UI already destroyed or hidden');
                    return;
                }
                
                // Play sound safely
                if (this.audioManager && typeof this.audioManager.playSFX === 'function') {
                    this.audioManager.playSFX('button');
                }
                
                this.hide();
            } catch (error) {
                console.error('InventoryUI: Error in close button handler:', error);
                // Try to hide anyway
                try {
                    this.isVisible = false;
                    if (this.container && !this.container.destroyed) {
                        this.container.setVisible(false);
                    }
                } catch (fallbackError) {
                    console.error('InventoryUI: Fallback close also failed:', fallbackError);
                }
            }
        });
        
        closeButton.on('pointerover', () => {
            try {
                if (!this.isDestroyed) {
                    closeButton.setColor('#ff9999');
                }
            } catch (error) {
                console.error('InventoryUI: Error in close button hover:', error);
            }
        });
        
        closeButton.on('pointerout', () => {
            try {
                if (!this.isDestroyed) {
                    closeButton.setColor('#ff6666');
                }
            } catch (error) {
                console.error('InventoryUI: Error in close button out:', error);
            }
        });
        
        this.container.add(closeButton);

        // Crafting button
        this.createCraftingButton();
        
        // Equipment button
        this.createEquipmentButton();

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
        const categories = ['rods', 'lures', 'boats', 'upgrades', 'fish', 'consumables', 'materials', 'clothing', 'bikini_assistants'];
        const tabWidth = 80;
        const tabHeight = 30;
        const startX = 20;
        const startY = 70;

        console.log('InventoryUI: Creating category tabs:', categories);

        categories.forEach((category, index) => {
            const x = startX + (index % 4) * (tabWidth + 5);
            const y = startY + Math.floor(index / 4) * (tabHeight + 5);

            console.log(`InventoryUI: Tab ${index} (${category}): x=${x}, y=${y}`);

            // Tab background using UITheme
            const tabBg = this.scene.add.graphics();
            const isActive = category === this.currentCategory;
            const bgColor = isActive ? UITheme.colors.primary : UITheme.colors.darkSecondary;
            const borderColor = isActive ? UITheme.colors.primaryLight : UITheme.colors.medium;
            
            tabBg.fillStyle(bgColor);
            tabBg.fillRoundedRect(x, y, tabWidth, tabHeight, UITheme.borders.radius.small);
            tabBg.lineStyle(UITheme.borders.width.thin, borderColor);
            tabBg.strokeRoundedRect(x, y, tabWidth, tabHeight, UITheme.borders.radius.small);

            // Tab text using UITheme
            const textColor = isActive ? UITheme.colors.text : UITheme.colors.textSecondary;
            const tabText = UITheme.createText(this.scene, x + tabWidth/2, y + tabHeight/2, 
                category.charAt(0).toUpperCase() + category.slice(1), 'bodySmall');
            tabText.setOrigin(0.5);
            tabText.setColor(textColor);

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
            .setDepth(this.scene.getUIDepth ? this.scene.getUIDepth('ui_interactive') : 1502); // Above container and background
            
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

        // Use UITheme button creator
        const craftingBtn = UITheme.createButton(
            this.scene, 
            buttonX + buttonWidth/2, 
            buttonY, 
            buttonWidth, 
            buttonHeight, 
            'CRAFTING', 
            () => this.openCraftingUI(),
            'primary'
        );

        this.container.add([craftingBtn.button, craftingBtn.text]);

        // Working interactive area for crafting button
        const workingCraftingButton = this.scene.add.rectangle(
            this.x + buttonX + buttonWidth/2,
            this.y + buttonY,
            buttonWidth + 5,
            buttonHeight + 5
        ).setInteractive()
        .setAlpha(0.01)
        .setFillStyle(0x000000)
        .setDepth(this.scene.getUIDepth ? this.scene.getUIDepth('ui_interactive') : 1502);

        workingCraftingButton.on('pointerdown', () => {
            this.openCraftingUI();
        });

        this.craftingButtonArea = workingCraftingButton;
    }

    createEquipmentButton() {
        // Create equipment button next to crafting button
        const buttonX = this.width - 270; // Position to the left of crafting button
        const buttonY = 30;
        const buttonWidth = 100;
        const buttonHeight = 30;

        // Use UITheme button creator with secondary style
        const equipmentBtn = UITheme.createButton(
            this.scene, 
            buttonX + buttonWidth/2, 
            buttonY, 
            buttonWidth, 
            buttonHeight, 
            'EQUIPMENT', 
            () => this.openEquipmentUI(),
            'secondary'
        );

        this.container.add([equipmentBtn.button, equipmentBtn.text]);

        // Working interactive area for equipment button
        const workingEquipmentButton = this.scene.add.rectangle(
            this.x + buttonX + buttonWidth/2,
            this.y + buttonY,
            buttonWidth + 5,
            buttonHeight + 5
        ).setInteractive()
        .setAlpha(0.01)
        .setFillStyle(0x000000)
        .setDepth(this.scene.getUIDepth ? this.scene.getUIDepth('ui_interactive') : 1502);

        workingEquipmentButton.on('pointerdown', () => {
            this.openEquipmentUI();
        });

        this.equipmentButtonArea = workingEquipmentButton;
        
        // Add a debug fix button (small button in corner)
        this.createDebugFixButton();
    }

    createDebugFixButton() {
        // Create a small debug button to fix equipment issues
        const debugButtonX = this.width - 30;
        const debugButtonY = 70;
        const debugButtonSize = 20;

        // Debug button using UITheme
        const debugBtn = UITheme.createButton(
            this.scene, 
            debugButtonX, 
            debugButtonY, 
            debugButtonSize, 
            debugButtonSize, 
            '🔧', 
            () => this.debugFixEquipment(),
            'warning'
        );

        this.container.add([debugBtn.button, debugBtn.text]);

        // Working interactive area for debug button
        const workingDebugButton = this.scene.add.rectangle(
            this.x + debugButtonX,
            this.y + debugButtonY,
            debugButtonSize + 5,
            debugButtonSize + 5
        ).setInteractive()
        .setAlpha(0.01)
        .setFillStyle(0xff8800)
        .setDepth(this.scene.getUIDepth ? this.scene.getUIDepth('ui_interactive') : 1502);

        workingDebugButton.on('pointerdown', () => {
            this.debugFixEquipment();
        });

        this.debugButtonArea = workingDebugButton;
        
        // Add force clean button
        this.createForceCleanButton();
    }

    createForceCleanButton() {
        // Create a force clean button next to the debug button
        const cleanButtonX = this.width - 55;
        const cleanButtonY = 70;
        const cleanButtonSize = 20;

        // Clean button using UITheme
        const cleanBtn = UITheme.createButton(
            this.scene, 
            cleanButtonX, 
            cleanButtonY, 
            cleanButtonSize, 
            cleanButtonSize, 
            '🧹', 
            () => this.forceCleanInventory(),
            'error'
        );

        this.container.add([cleanBtn.button, cleanBtn.text]);

        // Working interactive area for clean button
        const workingCleanButton = this.scene.add.rectangle(
            this.x + cleanButtonX,
            this.y + cleanButtonY,
            cleanButtonSize + 5,
            cleanButtonSize + 5
        ).setInteractive()
        .setAlpha(0.01)
        .setFillStyle(0xe74c3c)
        .setDepth(this.scene.getUIDepth ? this.scene.getUIDepth('ui_interactive') : 1502);

        workingCleanButton.on('pointerdown', () => {
            this.forceCleanInventory();
        });

        this.cleanButtonArea = workingCleanButton;
    }

    forceCleanInventory() {
        console.log('InventoryUI: Force clean inventory clicked!');
        this.audioManager?.playSFX('button');
        
        try {
            if (this.inventoryManager && typeof this.inventoryManager.forceCleanInventory === 'function') {
                const success = this.inventoryManager.forceCleanInventory();
                if (success) {
                    this.showMessage('🧹 Inventory force cleaned!\nAll undefined items removed!', '#27ae60');
                    
                    // Refresh everything
                    this.refreshItems();
                    this.updateStats();
                    this.updateEquipmentSlots();
                } else {
                    this.showMessage('❌ Force clean failed', '#e74c3c');
                }
            } else {
                this.showMessage('❌ InventoryManager not available', '#e74c3c');
            }
        } catch (error) {
            console.error('InventoryUI: Error in force clean inventory:', error);
            this.showMessage('❌ Clean failed: ' + error.message, '#e74c3c');
        }
    }

    debugFixEquipment() {
        console.log('InventoryUI: Debug fix equipment clicked!');
        this.audioManager?.playSFX('button');
        
        try {
            // Force refresh equipment slots
            if (this.inventoryManager && typeof this.inventoryManager.refreshEquipmentSlots === 'function') {
                this.inventoryManager.refreshEquipmentSlots();
                this.showMessage('🔧 Equipment slots force-fixed!', '#27ae60');
            } else {
                this.showMessage('❌ InventoryManager not available', '#e74c3c');
            }
        } catch (error) {
            console.error('InventoryUI: Error in debug fix equipment:', error);
            this.showMessage('❌ Fix failed: ' + error.message, '#e74c3c');
        }
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

    openEquipmentUI() {
        console.log('InventoryUI: Opening Equipment Enhancement UI');
        console.log('InventoryUI: Checking scene properties...');
        console.log('InventoryUI: scene.equipmentEnhancementUI exists:', !!this.scene.equipmentEnhancementUI);
        console.log('InventoryUI: scene.equipmentEnhancer exists:', !!this.scene.equipmentEnhancer);
        console.log('InventoryUI: Available scene properties:', Object.keys(this.scene));
        
        this.audioManager?.playSFX('button');
        
        // Check if Equipment Enhancement UI exists
        if (this.scene.equipmentEnhancementUI) {
            // Validate that the UI is properly initialized
            if (!this.scene.equipmentEnhancementUI.container) {
                console.warn('InventoryUI: Equipment Enhancement UI exists but container not initialized');
                this.showMessage('Equipment Enhancement UI is still loading...', '#ffaa00');
                
                // Try again in a moment
                this.scene.time.delayedCall(1000, () => {
                    if (this.scene.equipmentEnhancementUI?.container) {
                        this.openEquipmentUI();
                    } else {
                        this.showMessage('Failed to initialize Equipment Enhancement UI', '#ff6666');
                    }
                });
                return;
            }
            
            try {
                // Hide inventory UI
                this.hide();
                
                this.scene.equipmentEnhancementUI.show();
                
                // Store reference that equipment UI was opened from inventory
                this.scene.equipmentEnhancementUI.openedFromInventory = true;
                console.log('InventoryUI: Equipment Enhancement UI opened successfully');
            } catch (error) {
                console.error('InventoryUI: Error opening Equipment Enhancement UI:', error);
                // Show inventory again since equipment UI failed
                this.show();
                this.showMessage('Equipment Enhancement UI error: ' + error.message, '#ff6666');
            }
        } else {
            console.warn('InventoryUI: Equipment Enhancement UI not found, attempting to create it');
            
            // Try to create the Equipment Enhancement UI if it doesn't exist
            this.createEquipmentEnhancementUI().then(() => {
                // Try again after creation
                if (this.scene.equipmentEnhancementUI) {
                    this.openEquipmentUI();
                } else {
                    this.showMessage('Failed to create Equipment Enhancement UI', '#ff6666');
                }
            }).catch(error => {
                console.error('InventoryUI: Failed to create Equipment Enhancement UI:', error);
                this.showMessage('Equipment Enhancement System unavailable', '#ff6666');
            });
        }
    }

    async createEquipmentEnhancementUI() {
        try {
            console.log('InventoryUI: Creating Equipment Enhancement UI...');
            
            // Import the EquipmentEnhancementUI class
            const { EquipmentEnhancementUI } = await import('./EquipmentEnhancementUI.js');
            
            // Create the UI with reasonable defaults
            const uiWidth = Math.min(800, this.scene.sys.game.config.width - 100);
            const uiHeight = Math.min(600, this.scene.sys.game.config.height - 100);
            const uiX = (this.scene.sys.game.config.width - uiWidth) / 2;
            const uiY = (this.scene.sys.game.config.height - uiHeight) / 2;
            
            this.scene.equipmentEnhancementUI = new EquipmentEnhancementUI(
                this.scene, 
                uiX, 
                uiY, 
                uiWidth, 
                uiHeight
            );
            
            console.log('InventoryUI: Equipment Enhancement UI created successfully');
            
            // Give it a moment to fully initialize
            return new Promise(resolve => {
                this.scene.time.delayedCall(100, () => {
                    resolve();
                });
            });
            
        } catch (error) {
            console.error('InventoryUI: Error creating Equipment Enhancement UI:', error);
            throw error;
        }
    }

    createControls() {
        const controlsY = 140;

        // Search box background using UITheme
        const searchBg = UITheme.createPanel(this.scene, 20, controlsY, 200, 30, 'secondary');
        this.container.add(searchBg);

        // Search placeholder text using UITheme
        this.searchBox = UITheme.createText(this.scene, 25, controlsY + 15, 'Search items...', 'bodyMedium');
        this.searchBox.setOrigin(0, 0.5);
        this.searchBox.setColor(UITheme.colors.light);
        this.container.add(this.searchBox);

        // Sort button using UITheme
        const sortBtn = UITheme.createButton(
            this.scene, 
            290, 
            controlsY + 15, 
            100, 
            30, 
            'Sort: Name ↑', 
            () => this.cycleSortMode(),
            'secondary'
        );

        this.sortButton = sortBtn.text;
        this.container.add([sortBtn.button, sortBtn.text]);

        // Stats panel
        this.createStatsPanel();
    }

    createStatsPanel() {
        const statsX = this.width - 200;
        const statsY = 140;

        // Stats background using UITheme
        const statsBg = UITheme.createPanel(this.scene, statsX, statsY, 180, 100, 'secondary');
        this.container.add(statsBg);

        // Stats title using UITheme
        const statsTitle = UITheme.createText(this.scene, statsX + 90, statsY + 15, 'INVENTORY STATS', 'headerSmall');
        statsTitle.setOrigin(0.5);
        this.container.add(statsTitle);

        // Stats text (will be updated dynamically) using UITheme
        this.statsText = UITheme.createText(this.scene, statsX + 10, statsY + 35, '', 'bodySmall');
        this.statsText.setColor(UITheme.colors.textSecondary);
        this.statsText.setLineSpacing(2);
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
                .setDepth(this.scene.getUIDepth ? this.scene.getUIDepth('ui_interactive') : 1502) // Above container and background
                .setVisible(false); // Initially hidden until UI is shown
                
                const slotIndex = row * this.slotsPerRow + col;
                
                workingSlotArea.on('pointerover', () => {
                    // Only respond if UI is visible
                    if (!this.isVisible) return;
                    workingSlotArea.setAlpha(0.02); // Slight change for functionality
                    this.onSlotHover(slotIndex);
                });
                
                workingSlotArea.on('pointerout', () => {
                    // Only respond if UI is visible
                    if (!this.isVisible) return;
                    workingSlotArea.setAlpha(0.01); // Back to barely visible
                    this.onSlotOut(slotIndex);
                });
                
                workingSlotArea.on('pointerdown', () => {
                    // Only respond if UI is visible
                    if (!this.isVisible) return;
                    this.onSlotClick(slotIndex);
                });
                
                // Store reference for cleanup
                slot.workingArea = workingSlotArea;
            }
        }
    }

    createItemSlot(x, y, index) {
        // Slot background using UITheme
        const slotBg = this.scene.add.graphics();
        slotBg.fillStyle(UITheme.colors.darkPrimary);
        slotBg.fillRoundedRect(x, y, this.slotSize, this.slotSize, UITheme.borders.radius.small);
        slotBg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
        slotBg.strokeRoundedRect(x, y, this.slotSize, this.slotSize, UITheme.borders.radius.small);

        // Interactive area - make it more reliable like the working tab areas
        const slotArea = this.scene.add.rectangle(
            x + this.slotSize/2, 
            y + this.slotSize/2, 
            this.slotSize, 
            this.slotSize
        ).setInteractive().setAlpha(0);

        // Slot events with better debugging
        slotArea.on('pointerover', () => {
            // Only respond if UI is visible
            if (!this.isVisible) return;
            console.log(`InventoryUI: Slot ${index} hover`);
            this.onSlotHover(index);
        });
        
        slotArea.on('pointerout', () => {
            // Only respond if UI is visible
            if (!this.isVisible) return;
            console.log(`InventoryUI: Slot ${index} out`);
            this.onSlotOut(index);
        });

        slotArea.on('pointerdown', () => {
            // Only respond if UI is visible
            if (!this.isVisible) return;
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

        // Equipment panel background using UITheme
        const equipBg = UITheme.createPanel(this.scene, panelX, panelY, 180, 300, 'secondary'); // Increased height for more slots
        this.container.add(equipBg);

        // Equipment title using UITheme
        const equipTitle = UITheme.createText(this.scene, panelX + 90, panelY + 15, 'EQUIPPED', 'headerSmall');
        equipTitle.setOrigin(0.5);
        this.container.add(equipTitle);

        // Equipment slots - updated layout
        this.equipmentSlots = {};
        const equipSlots = ['rod', 'lure', 'boat', 'head', 'upper_body', 'lower_body', 'bikini_assistant'];
        
        equipSlots.forEach((slotType, index) => {
            let slotX, slotY;
            
            if (index < 3) {
                // First row: rod, lure, boat
                slotX = panelX + 10 + (index % 3) * 55;
                slotY = panelY + 40;
            } else if (index < 6) {
                // Second row: head, upper_body, lower_body
                slotX = panelX + 10 + ((index - 3) % 3) * 55;
                slotY = panelY + 120;
            } else {
                // Third row: bikini_assistant (centered)
                slotX = panelX + 65; // Centered
                slotY = panelY + 200;
            }
            
            const slot = this.createEquipmentSlot(slotX, slotY, slotType);
            this.equipmentSlots[slotType] = slot;
            this.container.add([slot.bg, slot.label, slot.slotTypeText, slot.area]);
        });
    }

    createEquipmentSlot(x, y, slotType) {
        // Smaller slot size to fit more slots
        const slotSize = 50;
        
        // Slot background using UITheme
        const slotBg = this.scene.add.graphics();
        slotBg.fillStyle(UITheme.colors.darkPrimary);
        slotBg.fillRoundedRect(x, y, slotSize, slotSize, UITheme.borders.radius.small);
        slotBg.lineStyle(UITheme.borders.width.medium, UITheme.colors.primary);
        slotBg.strokeRoundedRect(x, y, slotSize, slotSize, UITheme.borders.radius.small);

        // Slot label using UITheme - shorter labels for space
        const labelMap = {
            'rod': 'ROD',
            'lure': 'LURE', 
            'boat': 'BOAT',
            'head': 'HEAD',
            'upper_body': 'UPPER',
            'lower_body': 'LOWER',
            'bikini_assistant': 'ASSISTANT'
        };
        
        const label = UITheme.createText(this.scene, x + slotSize/2, y - 8, labelMap[slotType] || slotType.toUpperCase(), 'bodySmall');
        label.setOrigin(0.5);
        label.setColor(UITheme.colors.textSecondary);
        label.setFontSize('9px'); // Smaller font for better fit

        // Equipment slot type indicator
        const slotTypeText = UITheme.createText(this.scene, x + slotSize/2, y + slotSize + 5, `[${slotType}]`, 'bodySmall');
        slotTypeText.setOrigin(0.5);
        slotTypeText.setColor(UITheme.colors.textSecondary);
        slotTypeText.setFontSize('8px');

        // Interactive area
        const slotArea = this.scene.add.rectangle(x + slotSize/2, y + slotSize/2, slotSize, slotSize)
            .setInteractive()
            .setAlpha(0);

        slotArea.on('pointerdown', () => {
            // Only respond if UI is visible
            if (!this.isVisible) return;
            this.onEquipmentSlotClick(slotType);
        });
        
        // Add working interactive area (like other UI elements)
        const workingSlotArea = this.scene.add.rectangle(
            this.x + x + slotSize/2,
            this.y + y + slotSize/2,
            slotSize + 5,
            slotSize + 5
        ).setInteractive()
        .setAlpha(0.01)
        .setFillStyle(0x000000)
        .setDepth(this.scene.getUIDepth ? this.scene.getUIDepth('ui_interactive') : 1502)
        .setVisible(false); // Initially hidden until UI is shown
        
        workingSlotArea.on('pointerdown', () => {
            // Only respond if UI is visible
            if (!this.isVisible) return;
            console.log('InventoryUI: Working equipment slot clicked:', slotType);
            this.onEquipmentSlotClick(slotType);
        });

        // Store reference to working area for cleanup
        this.workingAreas = this.workingAreas || [];
        this.workingAreas.push(workingSlotArea);

        return {
            bg: slotBg,
            label: label,
            slotTypeText: slotTypeText,
            area: slotArea,
            workingArea: workingSlotArea,
            slotType: slotType,
            item: null,
            itemSprite: null,
            x: x,
            y: y,
            width: slotSize,
            height: slotSize
        };
    }

    /**
     * Check if an item can be equipped in a specific slot
     */
    isItemCompatibleWithSlot(item, slotType) {
        if (!item) {
            return false;
        }

        // Only equipment items should have equipSlot properties
        // Skip fish, consumables, materials, and upgrades as they are not equipment
        if (!item.equipSlot) {
            return false;
        }

        // Direct slot match
        if (item.equipSlot === slotType) {
            return true;
        }

        // Special cases for clothing slots
        if (slotType === 'head' && (item.equipSlot === 'head' || item.equipSlot === 'hat')) {
            return true;
        }
        
        if (slotType === 'upper_body' && (item.equipSlot === 'upper_body' || item.equipSlot === 'chest' || item.equipSlot === 'vest')) {
            return true;
        }
        
        if (slotType === 'lower_body' && (item.equipSlot === 'lower_body' || item.equipSlot === 'legs' || item.equipSlot === 'feet')) {
            return true;
        }

        return false;
    }

    /**
     * Get all compatible items for a specific equipment slot
     */
    getCompatibleItemsForSlot(slotType) {
        const allItems = [];
        
        console.log('InventoryUI: Getting compatible items for slot:', slotType);
        console.log('InventoryUI: Current inventory:', this.gameState.inventory);
        
        // Check all inventory categories
        Object.entries(this.gameState.inventory).forEach(([category, items]) => {
            if (Array.isArray(items)) {
                console.log(`InventoryUI: Checking category ${category} with ${items.length} items`);
                items.forEach(item => {
                    console.log(`InventoryUI: Checking item ${item.name} with equipSlot: ${item.equipSlot}`);
                    if (this.isItemCompatibleWithSlot(item, slotType)) {
                        allItems.push({ ...item, category });
                        console.log(`InventoryUI: Added compatible item: ${item.name}`);
                    }
                });
            }
        });

        console.log(`InventoryUI: Found ${allItems.length} compatible items for ${slotType}:`, allItems);
        return allItems;
    }

    createTooltip() {
        this.tooltip = this.scene.add.container(0, 0);
        this.tooltip.setVisible(false);
        this.tooltip.setDepth(3000);

        // Tooltip background using UITheme
        this.tooltipBg = this.scene.add.graphics();
        this.tooltipText = UITheme.createText(this.scene, 0, 0, '', 'bodySmall');
        this.tooltipText.setPadding(8, 6);
        this.tooltipText.setWordWrapWidth(200);
        this.tooltipText.setBackgroundColor(UITheme.colors.darkPrimary);

        this.tooltip.add([this.tooltipBg, this.tooltipText]);
    }

    // Event handlers
    onSlotHover(index) {
        const slot = this.itemSlots[index];
        if (slot.item) {
            this.showTooltip(slot.item, this.scene.input.activePointer.x, this.scene.input.activePointer.y);
            
            // Highlight slot using UITheme
            slot.bg.clear();
            slot.bg.fillStyle(UITheme.colors.darkSecondary);
            slot.bg.fillRoundedRect(slot.x, slot.y, this.slotSize, this.slotSize, UITheme.borders.radius.small);
            slot.bg.lineStyle(UITheme.borders.width.medium, UITheme.colors.primary);
            slot.bg.strokeRoundedRect(slot.x, slot.y, this.slotSize, this.slotSize, UITheme.borders.radius.small);
        }
    }

    onSlotOut(index) {
        const slot = this.itemSlots[index];
        this.hideTooltip();
        
        // Reset slot appearance using UITheme
        slot.bg.clear();
        slot.bg.fillStyle(UITheme.colors.darkPrimary);
        slot.bg.fillRoundedRect(slot.x, slot.y, this.slotSize, this.slotSize, UITheme.borders.radius.small);
        slot.bg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
        slot.bg.strokeRoundedRect(slot.x, slot.y, this.slotSize, this.slotSize, UITheme.borders.radius.small);
    }

    onSlotClick(index) {
        const slot = this.itemSlots[index];
        console.log(`InventoryUI: Slot ${index} clicked, item:`, slot.item);
        
        if (slot.item) {
            this.audioManager?.playSFX('button');
            this.selectedItem = slot.item;
            console.log(`InventoryUI: Selected item: ${slot.item.name}`);
            
            // Add visual feedback for selected item using UITheme
            slot.bg.clear();
            slot.bg.fillStyle(UITheme.colors.darkSecondary);
            slot.bg.fillRoundedRect(slot.x, slot.y, this.slotSize, this.slotSize, UITheme.borders.radius.small);
            slot.bg.lineStyle(UITheme.borders.width.thick, UITheme.colors.gold); // Gold border for selection
            slot.bg.strokeRoundedRect(slot.x, slot.y, this.slotSize, this.slotSize, UITheme.borders.radius.small);
            
            // Show item actions menu
            this.showItemActions(slot.item, slot.x + this.slotSize/2, slot.y + this.slotSize/2);
        } else {
            console.log(`InventoryUI: Empty slot ${index} clicked`);
        }
    }

    onEquipmentSlotClick(slotType) {
        console.log('InventoryUI: Equipment slot clicked:', slotType);
        
        // Play sound
        this.audioManager?.playSFX('button');
        
        // Get compatible items for this slot
        const compatibleItems = this.getCompatibleItemsForSlot(slotType);
        
        console.log('InventoryUI: Compatible items for', slotType, ':', compatibleItems.length);
        
        if (compatibleItems.length === 0) {
            // 🚨 DISABLED: Automatic sample item generation to prevent undefined items
            // Show message that no equipment is available
            console.log('InventoryUI: No compatible items found for slot:', slotType);
            this.showMessage(`No ${slotType} equipment available.\nUse the shop or crafting to get equipment.`, UITheme.colors.warning);
            return;
        }
        
        // Get currently equipped item for this slot
        const equipped = this.inventoryManager.getEquippedItems();
        
        let currentItem = null;
        if (equipped) {
            // Search through all equipped items to find one for this slot
            Object.values(equipped).forEach(categoryItems => {
                if (Array.isArray(categoryItems)) {
                    categoryItems.forEach(item => {
                        if (this.isItemCompatibleWithSlot(item, slotType)) {
                            currentItem = item;
                        }
                    });
                }
            });
        }
        
        console.log('InventoryUI: Currently equipped in', slotType, ':', currentItem?.name || 'none');
        
        // Show equipment selection dialog or quick-switch menu
        this.showEquipmentSelectionMenu(slotType, compatibleItems, currentItem);
    }

    /**
     * Get relevant inventory categories for a slot type
     */
    getRelevantCategoriesForSlot(slotType) {
        switch (slotType) {
            case 'rod': return ['rods', 'fishingRods'];
            case 'lure': return ['lures'];
            case 'boat': return ['boats'];
            case 'head':
            case 'upper_body':
            case 'lower_body': return ['clothing'];
            case 'bikini_assistant': return ['bikini_assistants'];
            default: return ['rods', 'lures', 'boats', 'clothing', 'bikini_assistants'];
        }
    }

    /**
     * Add sample items for a specific equipment slot (with full validation)
     */
    addSampleItemsForSlot(slotType) {
        try {
            console.log(`InventoryUI: Adding validated sample items for slot: ${slotType}`);
            
            // 🚨 VALIDATION: Only add sample items if InventoryManager is available
            if (!this.inventoryManager) {
                console.error('InventoryUI: InventoryManager not available, cannot add sample items');
                return;
            }
            
            switch (slotType) {
                case 'rod':
                    // Add sample rods with complete data
                    const sampleRods = [
                        {
                            id: `basic_rod_sample_${Date.now()}`,
                            name: 'Basic Fishing Rod',
                            rarity: 1,
                            equipSlot: 'rod',
                            stats: { castAccuracy: 5, tensionStability: 3 },
                            description: 'A simple fishing rod for beginners',
                            unlockLevel: 1,
                            cost: 100,
                            durability: 100,
                            condition: 100,
                            owned: true,
                            equipped: false,
                            quantity: 1
                        }
                    ];
                    sampleRods.forEach(rod => {
                        if (this.inventoryManager.validateItemData(rod, 'rods')) {
                            this.inventoryManager.addValidatedItem('rods', rod);
                        } else {
                            console.error('InventoryUI: Sample rod failed validation:', rod);
                        }
                    });
                    break;
                    
                case 'lure':
                    // Add sample lures with complete data
                    const sampleLures = [
                        {
                            id: `basic_spinner_sample_${Date.now()}`,
                            name: 'Basic Spinner',
                            type: 'spinner',
                            rarity: 1,
                            equipSlot: 'lure',
                            stats: { biteRate: 20 },
                            description: 'Simple spinning lure for beginners',
                            unlockLevel: 1,
                            cost: 50,
                            durability: 50,
                            condition: 50,
                            owned: true,
                            equipped: false,
                            quantity: 3
                        }
                    ];
                    sampleLures.forEach(lure => {
                        if (this.inventoryManager.validateItemData(lure, 'lures')) {
                            this.inventoryManager.addValidatedItem('lures', lure);
                        } else {
                            console.error('InventoryUI: Sample lure failed validation:', lure);
                        }
                    });
                    break;
                    
                case 'boat':
                    // Add sample boats with complete data
                    const sampleBoats = [
                        {
                            id: `rowboat_sample_${Date.now()}`,
                            name: 'Rowboat',
                            rarity: 1,
                            equipSlot: 'boat',
                            stats: { craftingEfficiency: 5, autoFishingYield: 8 },
                            description: 'Simple wooden rowboat',
                            unlockLevel: 1
                        }
                    ];
                    sampleBoats.forEach(boat => this.inventoryManager.addItem('boats', boat));
                    break;
                    
                case 'head':
                case 'upper_body':
                case 'lower_body':
                    // Add sample clothing
                    const sampleClothing = [
                        {
                            id: 'fishers_cap_sample',
                            name: 'Fisher\'s Cap',
                            rarity: 1,
                            equipSlot: 'head',
                            stats: { energy: 5, castAccuracy: 2 },
                            description: 'Classic fishing cap',
                            unlockLevel: 1
                        },
                        {
                            id: 'fishing_vest_sample',
                            name: 'Fishing Vest',
                            rarity: 2,
                            equipSlot: 'upper_body',
                            stats: { storage: 20, lureSuccess: 5 },
                            description: 'Multi-pocket vest',
                            unlockLevel: 1
                        },
                        {
                            id: 'sandals_sample',
                            name: 'Sandals',
                            rarity: 1,
                            equipSlot: 'lower_body',
                            stats: { boatSpeed: 3, comfort: 12 },
                            description: 'Non-slip deck sandals',
                            unlockLevel: 1
                        }
                    ];
                    sampleClothing.forEach(clothing => this.inventoryManager.addItem('clothing', clothing));
                    break;
                    
                case 'bikini_assistant':
                    // Add sample assistants
                    const sampleAssistants = [
                        {
                            id: 'miku_assistant_sample',
                            name: 'Miku',
                            rarity: 3,
                            equipSlot: 'bikini_assistant',
                            stats: { fishingBonus: 15, luckBonus: 10 },
                            description: 'Cheerful fishing assistant',
                            unlockLevel: 1
                        }
                    ];
                    sampleAssistants.forEach(assistant => this.inventoryManager.addItem('bikini_assistants', assistant));
                    break;
            }
            
            console.log(`InventoryUI: Sample items added for ${slotType}`);
            
        } catch (error) {
            console.error('InventoryUI: Error adding sample items:', error);
        }
    }

    showItemActions(item, x, y) {
        // Create context menu for item actions
        console.log('InventoryUI: Showing item actions for:', item.name, 'Category:', this.currentCategory);
        
        // Determine if this is a consumable
        const isConsumable = this.currentCategory === 'consumables' && item.effect;
        
        // Create a more comprehensive action popup
        const actionPopup = this.scene.add.container(x, y);
        actionPopup.setDepth(11000); // Above inventory
        
        // Calculate popup size based on content
        const popupWidth = isConsumable ? 180 : 120;
        const popupHeight = isConsumable ? 120 : 80;
        
        // Popup background
        const popupBg = this.scene.add.graphics();
        popupBg.fillStyle(0x000000, 0.95);
        popupBg.fillRoundedRect(-popupWidth/2, -popupHeight/2, popupWidth, popupHeight, 8);
        popupBg.lineStyle(2, 0x4a90e2);
        popupBg.strokeRoundedRect(-popupWidth/2, -popupHeight/2, popupWidth, popupHeight, 8);
        
        // Item name
        const itemName = this.scene.add.text(0, -popupHeight/2 + 15, item.name, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Item info
        let infoText = `Rarity: ${item.rarity || 1}`;
        if (item.quantity && item.quantity > 1) {
            infoText += `\nQuantity: ${item.quantity}`;
        }
        if (item.effect) {
            infoText += `\nEffect: ${item.effect.type}`;
        }
        
        const itemInfo = this.scene.add.text(0, -popupHeight/2 + 40, infoText, {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#cccccc',
            align: 'center'
        }).setOrigin(0.5);
        
        actionPopup.add([popupBg, itemName, itemInfo]);
        
        // Add USE button for consumables
        if (isConsumable) {
            console.log('InventoryUI: Adding USE button for consumable:', item.name);
            
            // Use button background
            const useButtonBg = this.scene.add.graphics();
            useButtonBg.fillStyle(0x27ae60, 0.9); // Green for use button
            useButtonBg.fillRoundedRect(-60, 15, 120, 25, 5);
            useButtonBg.lineStyle(2, 0x2ecc71);
            useButtonBg.strokeRoundedRect(-60, 15, 120, 25, 5);
            
            // Use button text
            const useButtonText = this.scene.add.text(0, 27, 'USE', {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            // Interactive area for use button (inside popup)
            const useButtonArea = this.scene.add.rectangle(0, 27, 120, 25)
                .setInteractive()
                .setAlpha(0);
            
            // Create working interactive area outside container at absolute position
            const absoluteX = x; // x is already the absolute position from showItemActions call
            const absoluteY = y + 27; // y position + button offset
            
            const workingUseButton = this.scene.add.rectangle(
                absoluteX,
                absoluteY,
                120,
                25
            ).setInteractive()
            .setAlpha(0.01) // Barely visible but functional
            .setFillStyle(0x27ae60) // Green fill for functionality  
            .setDepth(11001); // Above the popup
            
            console.log(`InventoryUI: Creating working USE button at absolute position: x=${absoluteX}, y=${absoluteY}`);
            
            // Use button effects for both areas
            const onHover = () => {
                useButtonBg.clear();
                useButtonBg.fillStyle(0x2ecc71, 1); // Brighter green on hover
                useButtonBg.fillRoundedRect(-60, 15, 120, 25, 5);
                useButtonBg.lineStyle(2, 0x27ae60);
                useButtonBg.strokeRoundedRect(-60, 15, 120, 25, 5);
                useButtonText.setScale(1.05);
                workingUseButton.setAlpha(0.05); // Slightly more visible on hover
            };
            
            const onOut = () => {
                useButtonBg.clear();
                useButtonBg.fillStyle(0x27ae60, 0.9);
                useButtonBg.fillRoundedRect(-60, 15, 120, 25, 5);
                useButtonBg.lineStyle(2, 0x2ecc71);
                useButtonBg.strokeRoundedRect(-60, 15, 120, 25, 5);
                useButtonText.setScale(1.0);
                workingUseButton.setAlpha(0.01); // Back to barely visible
            };
            
            const onClick = () => {
                console.log('InventoryUI: USE button clicked for:', item.name);
                this.audioManager?.playSFX('button');
                
                // Visual feedback
                useButtonBg.clear();
                useButtonBg.fillStyle(0x1e8449, 1); // Darker green when clicked
                useButtonBg.fillRoundedRect(-60, 15, 120, 25, 5);
                useButtonBg.lineStyle(2, 0x239b56);
                useButtonBg.strokeRoundedRect(-60, 15, 120, 25, 5);
                
                // Use the consumable
                this.useConsumable(item);
                
                // Clean up the working button
                if (workingUseButton && workingUseButton.active) {
                    workingUseButton.destroy();
                }
                
                // Close the popup after a brief delay
                this.scene.time.delayedCall(200, () => {
                    if (actionPopup && actionPopup.active) {
                        actionPopup.destroy();
                    }
                });
            };
            
            // Apply events to both areas
            useButtonArea.on('pointerover', onHover);
            useButtonArea.on('pointerout', onOut);
            useButtonArea.on('pointerdown', onClick);
            
            workingUseButton.on('pointerover', onHover);
            workingUseButton.on('pointerout', onOut);
            workingUseButton.on('pointerdown', onClick);
            
            actionPopup.add([useButtonBg, useButtonText, useButtonArea]);
            
            // Store working button reference for cleanup
            actionPopup.workingUseButton = workingUseButton;
        }
        
        // Close instruction
        const closeText = this.scene.add.text(0, popupHeight/2 - 10, 'Click anywhere else to close', {
            fontSize: '8px',
            fontFamily: 'Arial',
            color: '#888888'
        }).setOrigin(0.5);
        
        actionPopup.add(closeText);
        
        // Make popup interactive to close it when clicking outside
        const outsideClickArea = this.scene.add.rectangle(
            this.scene.sys.game.config.width / 2, 
            this.scene.sys.game.config.height / 2, 
            this.scene.sys.game.config.width, 
            this.scene.sys.game.config.height
        ).setInteractive()
        .setAlpha(0)
        .setDepth(10999); // Just below the popup
        
        outsideClickArea.on('pointerdown', () => {
            console.log('InventoryUI: Closing item actions popup (outside click)');
            
            // Clean up working USE button if it exists
            if (actionPopup.workingUseButton && actionPopup.workingUseButton.active) {
                actionPopup.workingUseButton.destroy();
            }
            
            if (actionPopup && actionPopup.active) actionPopup.destroy();
            if (outsideClickArea && outsideClickArea.active) outsideClickArea.destroy();
        });
        
        // Auto-close after 10 seconds
        this.scene.time.delayedCall(10000, () => {
            // Clean up working USE button if it exists
            if (actionPopup && actionPopup.workingUseButton && actionPopup.workingUseButton.active) {
                actionPopup.workingUseButton.destroy();
            }
            
            if (actionPopup && actionPopup.active) actionPopup.destroy();
            if (outsideClickArea && outsideClickArea.active) outsideClickArea.destroy();
        });
    }

    /**
     * Use a consumable item
     * @param {object} item - The consumable item to use
     */
    useConsumable(item) {
        console.log('InventoryUI: Starting useConsumable method for:', item.name);
        console.log('InventoryUI: Item details:', item);
        console.log('InventoryUI: InventoryManager available:', !!this.inventoryManager);
        
        try {
            // Validate that we have the inventory manager
            if (!this.inventoryManager) {
                console.error('InventoryUI: InventoryManager not available');
                this.showMessage('❌ Inventory system not available', '#e74c3c');
                return;
            }

            // Validate that the item has the required properties
            if (!item.id) {
                console.error('InventoryUI: Item missing ID property:', item);
                this.showMessage('❌ Invalid item data', '#e74c3c');
                return;
            }

            // Check if item has effect
            if (!item.effect) {
                console.error('InventoryUI: Item has no effect:', item);
                this.showMessage('❌ Item has no usable effect', '#e74c3c');
                return;
            }

            console.log('InventoryUI: Calling inventoryManager.useConsumable with ID:', item.id);
            
            // Use the consumable through inventory manager
            const result = this.inventoryManager.useConsumable(item.id, 1);
            
            console.log('InventoryUI: UseConsumable result:', result);
            
            if (result.success) {
                console.log('InventoryUI: Consumable used successfully:', result.message);
                
                // Show success message with effects
                let message = result.message;
                if (result.effects && result.effects.length > 0) {
                    const effectMessages = result.effects.map(effect => effect.message).join('\n');
                    message += `\n\n✨ Effects:\n${effectMessages}`;
                }
                
                this.showMessage(message, '#27ae60'); // Green for success
                
                // Update inventory display
                console.log('InventoryUI: Refreshing items after successful use');
                this.refreshItems();
                this.updateStats();
                
                // Show floating effect text
                this.showFloatingEffects(result.effects);
                
            } else {
                console.error('InventoryUI: Failed to use consumable:', result.message);
                this.showMessage(`❌ ${result.message}`, '#e74c3c'); // Red for error
            }
            
        } catch (error) {
            console.error('InventoryUI: Error using consumable:', error);
            console.error('InventoryUI: Error stack:', error.stack);
            this.showMessage('❌ Error using item: ' + error.message, '#e74c3c');
        }
    }

    /**
     * Show floating effects when consumable is used
     * @param {array} effects - Array of effect objects
     */
    showFloatingEffects(effects) {
        if (!effects || effects.length === 0) return;
        
        try {
            const centerX = this.width / 2;
            const startY = this.height / 2 - 50;
            
            effects.forEach((effect, index) => {
                // Create floating text for each effect
                const effectText = this.scene.add.text(
                    centerX,
                    startY + (index * 30),
                    `+${effect.message}`,
                    {
                        fontSize: '16px',
                        fontFamily: 'Arial',
                        color: this.getEffectColor(effect.type),
                        fontStyle: 'bold',
                        stroke: '#000000',
                        strokeThickness: 2
                    }
                ).setOrigin(0.5);
                
                // Add to container so it appears above inventory
                this.container.add(effectText);
                
                // Animate the floating text
                this.scene.tweens.add({
                    targets: effectText,
                    y: effectText.y - 60,
                    alpha: 0,
                    scale: 1.2,
                    duration: 2000,
                    ease: 'Power2.easeOut',
                    onComplete: () => {
                        if (effectText && effectText.active) {
                            effectText.destroy();
                        }
                    }
                });
            });
            
        } catch (error) {
            console.error('InventoryUI: Error showing floating effects:', error);
        }
    }

    /**
     * Get color for effect type
     * @param {string} effectType - Type of effect
     * @returns {string} - Color hex code
     */
    getEffectColor(effectType) {
        switch (effectType) {
            case 'energy': return '#3498db'; // Blue
            case 'health': return '#e74c3c'; // Red
            case 'rareFishChance': return '#9b59b6'; // Purple
            case 'experienceMultiplier': return '#f39c12'; // Orange
            case 'luck': return '#2ecc71'; // Green
            case 'repair': return '#95a5a6'; // Gray
            case 'money': return '#f1c40f'; // Gold
            default: return '#ffffff'; // White
        }
    }

    setupEventListeners() {
        // Listen for inventory changes - store references for cleanup
        this.itemAddedHandler = () => {
            if (this.isVisible && !this.isDestroyed) {
                this.refreshItems();
                this.updateStats();
                this.updateEquipmentSlots();
            }
        };

        this.itemRemovedHandler = () => {
            if (this.isVisible && !this.isDestroyed) {
                this.refreshItems();
                this.updateStats();
                this.updateEquipmentSlots();
            }
        };

        this.itemEquippedHandler = () => {
            if (this.isVisible && !this.isDestroyed) {
                this.refreshItems();
                this.updateEquipmentSlots();
            }
        };

        this.itemUnequippedHandler = () => {
            if (this.isVisible && !this.isDestroyed) {
                this.refreshItems();
                this.updateEquipmentSlots();
            }
        };

        // Consumable usage handlers
        this.consumableUsedHandler = (data) => {
            if (this.isVisible && !this.isDestroyed) {
                console.log('InventoryUI: Consumable used event received:', data);
                
                // Show notification in HUD scene if available
                const hudScene = this.scene.scene.get('HUDScene');
                if (hudScene && hudScene.showNotification) {
                    let message = `Used ${data.item.name}`;
                    if (data.effects && data.effects.length > 0) {
                        const effectSummary = data.effects.map(effect => effect.message).join(', ');
                        message += `\n${effectSummary}`;
                    }
                    hudScene.showNotification(message, 'success');
                }

                // Refresh inventory to show updated quantities
                this.refreshItems();
                this.updateStats();
            }
        };

        this.equipmentSlotsRefreshedHandler = () => {
            if (this.isVisible && !this.isDestroyed) {
                console.log('InventoryUI: Equipment slots refreshed event received');
                
                // Refresh everything
                this.refreshItems();
                this.updateStats();
                this.updateEquipmentSlots();
                
                // Show success message
                this.showMessage('✅ Equipment slots refreshed!', '#27ae60');
            }
        };

        this.allItemsRefreshedHandler = () => {
            if (this.isVisible && !this.isDestroyed) {
                console.log('InventoryUI: All items refreshed event received');
                
                // Refresh everything
                this.refreshItems();
                this.updateStats();
                this.updateEquipmentSlots();
                
                // Show success message
                this.showMessage('✅ All items refreshed and validated!', '#27ae60');
            }
        };

        this.temporaryBoostAppliedHandler = (data) => {
            console.log('InventoryUI: Temporary boost applied:', data);
            
            // Show boost notification in HUD
            const hudScene = this.scene.scene.get('HUDScene');
            if (hudScene && hudScene.showNotification) {
                const minutes = Math.floor(data.duration / 60000);
                const seconds = Math.floor((data.duration % 60000) / 1000);
                const timeText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                
                hudScene.showNotification(
                    `🔮 Boost Applied!\n${data.boostType}: +${data.value} for ${timeText}`,
                    'info'
                );
            }
        };

        this.temporaryBoostExpiredHandler = (data) => {
            console.log('InventoryUI: Temporary boost expired:', data);
            
            // Show expiration notification
            const hudScene = this.scene.scene.get('HUDScene');
            if (hudScene && hudScene.showNotification) {
                hudScene.showNotification(
                    `⏰ Boost Expired: ${data.boostType}`,
                    'warning'
                );
            }
        };

        // Add event listeners with error handling
        try {
            if (this.inventoryManager) {
                this.inventoryManager.on('itemAdded', this.itemAddedHandler);
                this.inventoryManager.on('itemRemoved', this.itemRemovedHandler);
                this.inventoryManager.on('itemEquipped', this.itemEquippedHandler);
                this.inventoryManager.on('itemUnequipped', this.itemUnequippedHandler);
                this.inventoryManager.on('consumableUsed', this.consumableUsedHandler);
                this.inventoryManager.on('equipmentSlotsRefreshed', this.equipmentSlotsRefreshedHandler);
                this.inventoryManager.on('allItemsRefreshed', this.allItemsRefreshedHandler);
                this.inventoryManager.on('temporaryBoostApplied', this.temporaryBoostAppliedHandler);
                this.inventoryManager.on('temporaryBoostExpired', this.temporaryBoostExpiredHandler);
                console.log('InventoryUI: Event listeners set up successfully');
            } else {
                console.warn('InventoryUI: InventoryManager not available, skipping event listeners');
            }
        } catch (error) {
            console.error('InventoryUI: Error setting up event listeners:', error);
        }
    }

    destroy() {
        console.log('InventoryUI: Starting destroy process');
        
        // Mark as destroyed to prevent operations during cleanup
        this.isDestroyed = true;
        
        try {
            // Remove event listeners first to prevent callbacks during cleanup
            if (this.inventoryManager) {
                this.inventoryManager.off('itemAdded', this.itemAddedHandler);
                this.inventoryManager.off('itemRemoved', this.itemRemovedHandler);
                this.inventoryManager.off('itemEquipped', this.itemEquippedHandler);
                this.inventoryManager.off('itemUnequipped', this.itemUnequippedHandler);
                this.inventoryManager.off('consumableUsed', this.consumableUsedHandler);
                this.inventoryManager.off('equipmentSlotsRefreshed', this.equipmentSlotsRefreshedHandler);
                this.inventoryManager.off('allItemsRefreshed', this.allItemsRefreshedHandler);
                this.inventoryManager.off('temporaryBoostApplied', this.temporaryBoostAppliedHandler);
                this.inventoryManager.off('temporaryBoostExpired', this.temporaryBoostExpiredHandler);
                console.log('InventoryUI: Event listeners removed successfully');
            }
        } catch (error) {
            console.error('InventoryUI: Error removing event listeners:', error);
        }

        try {
            // Clean up working areas with null checks
            if (this.categoryTabs) {
                Object.values(this.categoryTabs).forEach(tab => {
                    if (tab && tab.workingArea && !tab.workingArea.destroyed) {
                        tab.workingArea.destroy();
                    }
                });
            }
            
            if (this.itemSlots) {
                this.itemSlots.forEach(slot => {
                    if (slot && slot.workingArea && !slot.workingArea.destroyed) {
                        slot.workingArea.destroy();
                    }
                });
            }
            
            // Clean up equipment slot areas with null checks
            if (this.equipmentSlots) {
                Object.values(this.equipmentSlots).forEach(slot => {
                    if (slot && slot.workingArea && !slot.workingArea.destroyed) {
                        slot.workingArea.destroy();
                    }
                });
            }
            
            // Clean up button areas with null checks
            if (this.craftingButtonArea && !this.craftingButtonArea.destroyed) {
                this.craftingButtonArea.destroy();
            }
            
            if (this.equipmentButtonArea && !this.equipmentButtonArea.destroyed) {
                this.equipmentButtonArea.destroy();
            }
            
            if (this.debugButtonArea && !this.debugButtonArea.destroyed) {
                this.debugButtonArea.destroy();
            }
            
            if (this.cleanButtonArea && !this.cleanButtonArea.destroyed) {
                this.cleanButtonArea.destroy();
            }
            
            // Clean up blockers with null checks
            if (this.clickBlocker && !this.clickBlocker.destroyed) {
                this.clickBlocker.destroy();
            }
            
            if (this.backgroundBlocker && !this.backgroundBlocker.destroyed) {
                this.backgroundBlocker.destroy();
            }
            
            // Clean up main UI elements with null checks
            if (this.container && !this.container.destroyed) {
                this.container.destroy();
            }
            
            if (this.tooltip && !this.tooltip.destroyed) {
                this.tooltip.destroy();
            }
            
            console.log('InventoryUI: Cleanup completed successfully');
            
        } catch (error) {
            console.error('InventoryUI: Error during cleanup:', error);
        }
        
        // Clear references
        this.container = null;
        this.clickBlocker = null;
        this.backgroundBlocker = null;
        this.tooltip = null;
        this.categoryTabs = {};
        this.itemSlots = [];
    }

    showMessage(text, color = '#ffffff') {
        // Create a temporary message
        const message = this.scene.add.text(this.width / 2, 50, text, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.container.add(message);
        
        // Fade out and remove after 3 seconds
        this.scene.tweens.add({
            targets: message,
            alpha: 0,
            duration: 3000,
            onComplete: () => message.destroy()
        });
    }

    // Show/Hide methods
    show() {
        try {
            console.log('InventoryUI: Showing inventory');
            
            if (this.isDestroyed) {
                console.error('InventoryUI: Cannot show destroyed UI');
                return;
            }
            
            // Hide fish button when inventory is open
            if (this.scene.hideFishButton) {
                this.scene.hideFishButton();
            }
            
            // 🚨 FORCE CLEAN: Remove any undefined items immediately when inventory opens
            try {
                if (this.inventoryManager && this.inventoryManager.forceCleanAllUndefinedItems) {
                    const cleanedCount = this.inventoryManager.forceCleanAllUndefinedItems();
                    if (cleanedCount > 0) {
                        console.log(`InventoryUI: ✅ Cleaned ${cleanedCount} undefined items from inventory`);
                        this.gameState.save(); // Save immediately after cleaning
                    }
                }
            } catch (cleanError) {
                console.error('InventoryUI: Error cleaning undefined items:', cleanError);
            }
            
            // Force fix equipment slots when showing inventory
            if (this.inventoryManager && typeof this.inventoryManager.fixMissingEquipSlots === 'function') {
                console.log('InventoryUI: Force-fixing equipment slots on show');
                this.inventoryManager.fixMissingEquipSlots();
            }
            
            this.isVisible = true;
            
            if (this.container) {
                this.container.setVisible(true);
            }
            
            if (this.clickBlocker) {
                this.clickBlocker.setVisible(true);
            }
            
            if (this.backgroundBlocker) {
                this.backgroundBlocker.setVisible(true);
            }
            
            // Show all working slot areas
            this.itemSlots.forEach(slot => {
                if (slot.workingArea && !slot.workingArea.destroyed) {
                    slot.workingArea.setVisible(true);
                }
            });
            
            // Show working equipment slot areas
            if (this.workingAreas) {
                this.workingAreas.forEach(area => {
                    if (area && !area.destroyed) {
                        area.setVisible(true);
                    }
                });
            }
            
            // Refresh content when showing
            this.refreshItems();
            this.updateStats();
            this.updateEquipmentSlots();
            
            console.log('InventoryUI: Inventory shown successfully');
            
        } catch (error) {
            console.error('InventoryUI: Error showing inventory:', error);
        }
    }

    hide() {
        try {
            console.log('InventoryUI: Hiding inventory');
            
            this.isVisible = false;
            
            // Show fish button when inventory is closed
            if (this.scene.showFishButton) {
                this.scene.showFishButton();
            }
            
            if (this.container && !this.container.destroyed) {
                this.container.setVisible(false);
            }
            
            if (this.clickBlocker && !this.clickBlocker.destroyed) {
                this.clickBlocker.setVisible(false);
            }
            
            if (this.backgroundBlocker && !this.backgroundBlocker.destroyed) {
                this.backgroundBlocker.setVisible(false);
            }
            
            // Hide all working slot areas
            this.itemSlots.forEach(slot => {
                if (slot.workingArea && !slot.workingArea.destroyed) {
                    slot.workingArea.setVisible(false);
                }
            });
            
            // Hide working equipment slot areas
            if (this.workingAreas) {
                this.workingAreas.forEach(area => {
                    if (area && !area.destroyed) {
                        area.setVisible(false);
                    }
                });
            }
            
            // Clear any open menus
            this.clearEquipmentSelectionMenu();
            
            console.log('InventoryUI: Inventory hidden successfully');
            
        } catch (error) {
            console.error('InventoryUI: Error hiding inventory:', error);
        }
    }

    /**
     * Switch to a different category tab
     */
    switchCategory(category) {
        try {
            console.log('InventoryUI: Switching to category:', category);
            
            if (this.currentCategory === category) {
                console.log('InventoryUI: Already on category:', category);
                return;
            }
            
            // Play sound
            this.audioManager?.playSFX('button');
            
            // Update current category
            const oldCategory = this.currentCategory;
            this.currentCategory = category;
            
            // Update tab visuals
            this.updateCategoryTabs();
            
            // Refresh items for new category
            this.refreshItems();
            
            console.log(`InventoryUI: Switched from ${oldCategory} to ${category}`);
            
        } catch (error) {
            console.error('InventoryUI: Error switching category:', error);
        }
    }

    /**
     * Update category tab visuals
     */
    updateCategoryTabs() {
        try {
            Object.entries(this.categoryTabs).forEach(([category, tabData]) => {
                const isActive = category === this.currentCategory;
                const bgColor = isActive ? UITheme.colors.primary : UITheme.colors.darkSecondary;
                const borderColor = isActive ? UITheme.colors.primaryLight : UITheme.colors.medium;
                const textColor = isActive ? UITheme.colors.text : UITheme.colors.textSecondary;
                
                // Update tab background
                tabData.bg.clear();
                tabData.bg.fillStyle(bgColor);
                tabData.bg.fillRoundedRect(tabData.x, tabData.y, tabData.width, tabData.height, UITheme.borders.radius.small);
                tabData.bg.lineStyle(UITheme.borders.width.thin, borderColor);
                tabData.bg.strokeRoundedRect(tabData.x, tabData.y, tabData.width, tabData.height, UITheme.borders.radius.small);
                
                // Update tab text color
                tabData.text.setColor(textColor);
            });
        } catch (error) {
            console.error('InventoryUI: Error updating category tabs:', error);
        }
    }

    /**
     * Refresh items display for current category
     */
    refreshItems() {
        try {
            console.log('InventoryUI: Refreshing items for category:', this.currentCategory);
            
            if (!this.gameState || !this.gameState.inventory) {
                console.warn('InventoryUI: No inventory data available');
                return;
            }
            
            // Get items for current category
            const categoryItems = this.gameState.inventory[this.currentCategory] || [];
            console.log(`InventoryUI: Found ${categoryItems.length} items in ${this.currentCategory}`);
            
            // 🚨 CHECK FOR UNDEFINED ITEMS
            this.checkForUndefinedItems(categoryItems);
            
            // Clear existing item displays
            this.clearItemSlots();
            
            // Display items
            categoryItems.forEach((item, index) => {
                if (index < this.itemSlots.length) {
                    this.displayItemInSlot(item, index);
                }
            });
            
            console.log('InventoryUI: Items refreshed successfully');
            
        } catch (error) {
            console.error('InventoryUI: Error refreshing items:', error);
        }
    }

    /**
     * Check for undefined items and warn the user
     * @param {array} items - Array of items to check
     */
    checkForUndefinedItems(items) {
        try {
            const undefinedItems = items.filter(item => 
                !item || !item.name || item.name === 'undefined' || item.name === ''
            );
            
            if (undefinedItems.length > 0) {
                console.error(`🚨 InventoryUI: Found ${undefinedItems.length} undefined items in ${this.currentCategory}:`, undefinedItems);
                
                // Show warning message to user
                this.showMessage(
                    `🚨 WARNING: ${undefinedItems.length} undefined items detected!\nThis indicates fallback data is being used.`, 
                    '#e74c3c'
                );
                
                // Check if DataLoader is using fallback data
                if (this.gameState.gameDataLoader && typeof this.gameState.gameDataLoader.checkForFallbackData === 'function') {
                    const fallbackReport = this.gameState.gameDataLoader.checkForFallbackData();
                    if (fallbackReport.usingFallback) {
                        console.error('🚨 InventoryUI: DataLoader is using fallback data!', fallbackReport);
                        this.showMessage(
                            `🚨 FALLBACK DATA DETECTED!\nFiles: ${fallbackReport.fallbackFiles.join(', ')}`, 
                            '#e74c3c'
                        );
                    }
                }
                
                return true; // Undefined items found
            }
            
            return false; // No undefined items
            
        } catch (error) {
            console.error('InventoryUI: Error checking for undefined items:', error);
            return false;
        }
    }

    /**
     * Clear all item slot displays
     */
    clearItemSlots() {
        try {
            this.itemSlots.forEach(slot => {
                // Clear item references
                slot.item = null;
                
                // Remove item-specific visual elements
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
                
                // Reset slot appearance
                slot.bg.clear();
                slot.bg.fillStyle(UITheme.colors.darkPrimary);
                slot.bg.fillRoundedRect(slot.x, slot.y, this.slotSize, this.slotSize, UITheme.borders.radius.small);
                slot.bg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
                slot.bg.strokeRoundedRect(slot.x, slot.y, this.slotSize, this.slotSize, UITheme.borders.radius.small);
            });
        } catch (error) {
            console.error('InventoryUI: Error clearing item slots:', error);
        }
    }

    /**
     * Display an item in a specific slot
     */
    displayItemInSlot(item, slotIndex) {
        try {
            if (!item || slotIndex >= this.itemSlots.length) return;
            
            const slot = this.itemSlots[slotIndex];
            slot.item = item;
            
            // Get rarity color
            const rarityColor = this.getRarityColor(item.rarity);
            
            // Update slot background with rarity color
            slot.bg.clear();
            slot.bg.fillStyle(UITheme.colors.darkPrimary);
            slot.bg.fillRoundedRect(slot.x, slot.y, this.slotSize, this.slotSize, UITheme.borders.radius.small);
            slot.bg.lineStyle(UITheme.borders.width.medium, rarityColor);
            slot.bg.strokeRoundedRect(slot.x, slot.y, this.slotSize, this.slotSize, UITheme.borders.radius.small);
            
            // Add equipped indicator
            if (item.equipped) {
                slot.bg.lineStyle(UITheme.borders.width.thick, UITheme.colors.success);
                slot.bg.strokeRoundedRect(slot.x, slot.y, this.slotSize, this.slotSize, UITheme.borders.radius.small);
            }
            
            // Add item icon/sprite (simplified colored rectangle for now)
            const iconSize = this.slotSize * 0.6;
            const iconX = slot.x + (this.slotSize - iconSize) / 2;
            const iconY = slot.y + (this.slotSize - iconSize) / 2;
            
            slot.itemSprite = this.scene.add.graphics();
            const colorValue = rarityColor.startsWith('#') ? parseInt(rarityColor.replace('#', '0x')) : 0xffffff;
            slot.itemSprite.fillStyle(colorValue);
            slot.itemSprite.fillRoundedRect(iconX, iconY, iconSize, iconSize, UITheme.borders.radius.small);
            this.container.add(slot.itemSprite);
            
            // Add quantity text for stackable items
            if (item.quantity && item.quantity > 1) {
                slot.quantityText = UITheme.createText(
                    this.scene, 
                    slot.x + this.slotSize - 5, 
                    slot.y + this.slotSize - 5, 
                    item.quantity.toString(), 
                    'bodySmall'
                );
                slot.quantityText.setOrigin(1, 1);
                slot.quantityText.setColor(UITheme.colors.text);
                slot.quantityText.setBackgroundColor('#000000');
                this.container.add(slot.quantityText);
            }
            
        } catch (error) {
            console.error('InventoryUI: Error displaying item in slot:', error);
        }
    }

    /**
     * Update inventory statistics display
     */
    updateStats() {
        try {
            if (!this.statsText) return;
            
            const stats = this.inventoryManager.getInventoryStats();
            
            let statsDisplay = `Total Items: ${stats.totalItems}\n`;
            statsDisplay += `Total Value: ${stats.totalValue}\n`;
            statsDisplay += `Categories: ${Object.keys(stats.categories).length}`;
            
            // Add current category info
            if (stats.categories[this.currentCategory]) {
                const catStats = stats.categories[this.currentCategory];
                statsDisplay += `\n\n${this.currentCategory.toUpperCase()}:\n`;
                statsDisplay += `Items: ${catStats.count}/${catStats.limit}\n`;
                statsDisplay += `Equipped: ${catStats.equipped}`;
            }
            
            this.statsText.setText(statsDisplay);
            
        } catch (error) {
            console.error('InventoryUI: Error updating stats:', error);
        }
    }

    /**
     * Update equipment slots display
     */
    updateEquipmentSlots() {
        try {
            if (!this.equipmentSlots) return;
            
            const equippedItems = this.inventoryManager.getEquippedItems();
            
            // Update each equipment slot
            Object.entries(this.equipmentSlots).forEach(([slotType, slot]) => {
                // Clear existing item display
                if (slot.itemSprite) {
                    slot.itemSprite.destroy();
                    slot.itemSprite = null;
                }
                
                // Find equipped item for this slot
                let equippedItem = null;
                Object.values(equippedItems).forEach(categoryItems => {
                    if (Array.isArray(categoryItems)) {
                        categoryItems.forEach(item => {
                            if (this.isItemCompatibleWithSlot(item, slotType)) {
                                equippedItem = item;
                            }
                        });
                    }
                });
                
                slot.item = equippedItem;
                
                // Use stored slot coordinates
                const slotX = slot.x;
                const slotY = slot.y;
                const slotSize = slot.width || 50;
                
                // Update slot appearance
                if (equippedItem) {
                    // Show equipped item
                    const rarityColor = this.getRarityColor(equippedItem.rarity);
                    
                    // Update slot border to show equipped
                    slot.bg.clear();
                    slot.bg.fillStyle(UITheme.colors.darkSecondary);
                    slot.bg.fillRoundedRect(slotX, slotY, slotSize, slotSize, UITheme.borders.radius.small);
                    slot.bg.lineStyle(UITheme.borders.width.medium, rarityColor);
                    slot.bg.strokeRoundedRect(slotX, slotY, slotSize, slotSize, UITheme.borders.radius.small);
                    
                    // Add item icon
                    const iconSize = 30;
                    const iconX = slotX + (slotSize - iconSize) / 2;
                    const iconY = slotY + (slotSize - iconSize) / 2;
                    
                    slot.itemSprite = this.scene.add.graphics();
                    const colorValue = rarityColor.startsWith('#') ? parseInt(rarityColor.replace('#', '0x')) : 0xffffff;
                    slot.itemSprite.fillStyle(colorValue);
                    slot.itemSprite.fillRoundedRect(iconX, iconY, iconSize, iconSize, UITheme.borders.radius.small);
                    this.container.add(slot.itemSprite);
                    
                    console.log(`InventoryUI: Updated equipment slot ${slotType} with equipped item: ${equippedItem.name}`);
                } else {
                    // Show empty slot
                    slot.bg.clear();
                    slot.bg.fillStyle(UITheme.colors.darkPrimary);
                    slot.bg.fillRoundedRect(slotX, slotY, slotSize, slotSize, UITheme.borders.radius.small);
                    slot.bg.lineStyle(UITheme.borders.width.medium, UITheme.colors.primary);
                    slot.bg.strokeRoundedRect(slotX, slotY, slotSize, slotSize, UITheme.borders.radius.small);
                    
                    console.log(`InventoryUI: Updated equipment slot ${slotType} - empty`);
                }
            });
            
        } catch (error) {
            console.error('InventoryUI: Error updating equipment slots:', error);
        }
    }

    /**
     * Handle item click for equipping/using
     */
    onItemClick(item, category) {
        try {
            console.log('InventoryUI: Item clicked:', item.name, 'Category:', category || this.currentCategory);
            
            if (!item) return;
            
            this.audioManager?.playSFX('button');
            
            const itemCategory = category || this.currentCategory;
            
            // Handle different item types
            if (itemCategory === 'consumables' && item.effect) {
                // Use consumable
                this.useConsumable(item);
            } else if (item.equipSlot) {
                // Equip/unequip item
                if (item.equipped) {
                    this.unequipItem(item, itemCategory);
                } else {
                    this.equipItem(item, itemCategory);
                }
            } else {
                // Show item details
                this.showItemActions(item, this.scene.input.activePointer.x, this.scene.input.activePointer.y);
            }
            
        } catch (error) {
            console.error('InventoryUI: Error handling item click:', error);
        }
    }

    /**
     * Equip an item
     */
    equipItem(item, category) {
        try {
            console.log('InventoryUI: Equipping item:', item.name);
            
            const success = this.inventoryManager.equipItem(category, item.id);
            
            if (success) {
                this.showMessage(`✅ Equipped ${item.name}`, UITheme.colors.success);
                this.refreshItems();
                this.updateEquipmentSlots();
            } else {
                this.showMessage(`❌ Failed to equip ${item.name}`, UITheme.colors.error);
            }
            
        } catch (error) {
            console.error('InventoryUI: Error equipping item:', error);
            this.showMessage('❌ Error equipping item', UITheme.colors.error);
        }
    }

    /**
     * Unequip an item
     */
    unequipItem(item, category) {
        try {
            console.log('InventoryUI: Unequipping item:', item.name);
            
            const success = this.inventoryManager.unequipItem(category, item.id);
            
            if (success) {
                this.showMessage(`✅ Unequipped ${item.name}`, UITheme.colors.success);
                this.refreshItems();
                this.updateEquipmentSlots();
            } else {
                this.showMessage(`❌ Failed to unequip ${item.name}`, UITheme.colors.error);
            }
            
        } catch (error) {
            console.error('InventoryUI: Error unequipping item:', error);
            this.showMessage('❌ Error unequipping item', UITheme.colors.error);
        }
    }

    /**
     * Get rarity color for items
     */
    getRarityColor(rarity) {
        switch (rarity) {
            case 1: return '#888888'; // Gray - Common
            case 2: return '#00ff00'; // Green - Uncommon  
            case 3: return '#0080ff'; // Blue - Rare
            case 4: return '#8000ff'; // Purple - Epic
            case 5: return '#ff8000'; // Orange - Legendary
            case 6: return '#ff0080'; // Pink - Mythic
            default: return '#ffffff'; // White - Default
        }
    }

    /**
     * Get rarity name for items
     */
    getRarityName(rarity) {
        switch (rarity) {
            case 1: return 'Common';
            case 2: return 'Uncommon';
            case 3: return 'Rare';
            case 4: return 'Epic';
            case 5: return 'Legendary';
            case 6: return 'Mythic';
            default: return 'Unknown';
        }
    }

    /**
     * Show/hide tooltip
     */
    showTooltip(item, x, y) {
        try {
            if (!this.tooltip || !item) return;
            
            let tooltipText = `${item.name}\n`;
            tooltipText += `Rarity: ${this.getRarityName(item.rarity)}\n`;
            
            if (item.description) {
                tooltipText += `\n${item.description}\n`;
            }
            
            if (item.stats) {
                tooltipText += '\nStats:\n';
                Object.entries(item.stats).forEach(([stat, value]) => {
                    tooltipText += `${stat}: +${value}\n`;
                });
            }
            
            if (item.effect) {
                tooltipText += `\nEffect: ${item.effect.type} +${item.effect.value}`;
                if (item.effect.duration) {
                    tooltipText += ` (${Math.floor(item.effect.duration/1000)}s)`;
                }
            }
            
            if (item.quantity && item.quantity > 1) {
                tooltipText += `\nQuantity: ${item.quantity}`;
            }
            
            this.tooltipText.setText(tooltipText);
            this.tooltip.setPosition(x + 10, y + 10);
            this.tooltip.setVisible(true);
            
        } catch (error) {
            console.error('InventoryUI: Error showing tooltip:', error);
        }
    }

    hideTooltip() {
        try {
            if (this.tooltip) {
                this.tooltip.setVisible(false);
            }
        } catch (error) {
            console.error('InventoryUI: Error hiding tooltip:', error);
        }
    }

    /**
     * Cycle through sort modes
     */
    cycleSortMode() {
        try {
            const sortModes = [
                { field: 'name', ascending: true, label: 'Name ↑' },
                { field: 'name', ascending: false, label: 'Name ↓' },
                { field: 'rarity', ascending: true, label: 'Rarity ↑' },
                { field: 'rarity', ascending: false, label: 'Rarity ↓' },
            ];
            
            // Find current mode index
            let currentIndex = sortModes.findIndex(mode => 
                mode.field === this.sortBy && mode.ascending === this.sortAscending
            );
            
            // Move to next mode
            currentIndex = (currentIndex + 1) % sortModes.length;
            const newMode = sortModes[currentIndex];
            
            this.sortBy = newMode.field;
            this.sortAscending = newMode.ascending;
            
            // Update button text
            if (this.sortButton) {
                this.sortButton.setText(`Sort: ${newMode.label}`);
            }
            
            // Sort and refresh items
            this.inventoryManager.sortItems(this.currentCategory, this.sortBy, this.sortAscending);
            this.refreshItems();
            
        } catch (error) {
            console.error('InventoryUI: Error cycling sort mode:', error);
        }
    }

    /**
     * Show a selection menu for equipment slot
     */
    showEquipmentSelectionMenu(slotType, compatibleItems, currentItem) {
        // Clear any existing selection menu
        this.clearEquipmentSelectionMenu();
        
        // Initialize array to track ALL menu elements for cleanup
        this.equipmentMenuElements = [];
        
        // Calculate better positioning to avoid overlaps
        const menuWidth = 280;
        const menuHeight = Math.min(450, 80 + compatibleItems.length * 70);
        
        // Position menu to the left of the equipment panel, with padding
        const menuX = this.width - 220 - menuWidth; // Move further left
        const menuY = Math.max(20, (this.height - menuHeight) / 2); // Center vertically with min top margin
        
        // Create semi-transparent overlay to dim background
        this.equipmentMenuOverlay = this.scene.add.graphics();
        this.equipmentMenuOverlay.fillStyle(0x000000, 0.5);
        this.equipmentMenuOverlay.fillRect(0, 0, this.width, this.height);
        this.container.add(this.equipmentMenuOverlay);
        this.equipmentMenuElements.push(this.equipmentMenuOverlay);
        
        // Menu background with better styling
        this.equipmentMenu = this.scene.add.graphics();
        this.equipmentMenu.fillStyle(0x1a1a2e, 0.95); // Dark blue background
        this.equipmentMenu.fillRoundedRect(menuX, menuY, menuWidth, menuHeight, 12);
        this.equipmentMenu.lineStyle(3, 0x4a90e2, 1); // Blue border
        this.equipmentMenu.strokeRoundedRect(menuX, menuY, menuWidth, menuHeight, 12);
        
        // Add subtle inner glow
        this.equipmentMenu.lineStyle(1, 0x6bb6ff, 0.3);
        this.equipmentMenu.strokeRoundedRect(menuX + 2, menuY + 2, menuWidth - 4, menuHeight - 4, 10);
        
        this.container.add(this.equipmentMenu);
        this.equipmentMenuElements.push(this.equipmentMenu);
        
        // Menu title with better styling
        const title = UITheme.createText(this.scene, menuX + menuWidth/2, menuY + 25, 
            `${slotType.toUpperCase()} EQUIPMENT`, 'headerMedium');
        title.setOrigin(0.5);
        title.setColor('#ffffff');
        title.setFontStyle('bold');
        title.setShadow(2, 2, '#000000', 3);
        this.container.add(title);
        this.equipmentMenuElements.push(title);
        
        // Close button with better visibility
        const closeBtn = UITheme.createText(this.scene, menuX + menuWidth - 25, menuY + 25, '×', 'headerLarge');
        closeBtn.setOrigin(0.5);
        closeBtn.setColor('#ff6b6b');
        closeBtn.setFontStyle('bold');
        closeBtn.setShadow(1, 1, '#000000', 2);
        closeBtn.setInteractive();
        closeBtn.on('pointerdown', () => this.clearEquipmentSelectionMenu());
        closeBtn.on('pointerover', () => {
            closeBtn.setColor('#ff4757');
            closeBtn.setScale(1.1);
        });
        closeBtn.on('pointerout', () => {
            closeBtn.setColor('#ff6b6b');
            closeBtn.setScale(1.0);
        });
        this.container.add(closeBtn);
        this.equipmentMenuElements.push(closeBtn);
        
        // Current item display with better styling
        let currentY = menuY + 55;
        if (currentItem) {
            const currentBg = this.scene.add.graphics();
            currentBg.fillStyle(0x27ae60, 0.2); // Green tint
            currentBg.fillRoundedRect(menuX + 10, currentY - 5, menuWidth - 20, 35, 6);
            currentBg.lineStyle(2, 0x2ecc71, 0.8);
            currentBg.strokeRoundedRect(menuX + 10, currentY - 5, menuWidth - 20, 35, 6);
            this.container.add(currentBg);
            this.equipmentMenuElements.push(currentBg);
            
            const currentText = UITheme.createText(this.scene, menuX + 20, currentY + 10, 
                `✓ Equipped: ${currentItem.name}`, 'bodyMedium');
            currentText.setColor('#ffffff');
            currentText.setFontStyle('bold');
            currentText.setShadow(1, 1, '#000000', 2);
            this.container.add(currentText);
            this.equipmentMenuElements.push(currentText);
        } else {
            const noneBg = this.scene.add.graphics();
            noneBg.fillStyle(0x636e72, 0.2); // Gray tint
            noneBg.fillRoundedRect(menuX + 10, currentY - 5, menuWidth - 20, 35, 6);
            noneBg.lineStyle(2, 0x95a5a6, 0.6);
            noneBg.strokeRoundedRect(menuX + 10, currentY - 5, menuWidth - 20, 35, 6);
            this.container.add(noneBg);
            this.equipmentMenuElements.push(noneBg);
            
            const noneText = UITheme.createText(this.scene, menuX + 20, currentY + 10, 
                '⚪ No item equipped', 'bodyMedium');
            noneText.setColor('#cccccc');
            noneText.setShadow(1, 1, '#000000', 2);
            this.container.add(noneText);
            this.equipmentMenuElements.push(noneText);
        }
        
        currentY += 50;
        
        // Store working interactive areas for cleanup
        this.equipmentMenuWorkingAreas = [];
        
        // Equipment list with better styling
        compatibleItems.forEach((item, index) => {
            const isEquipped = currentItem && currentItem.id === item.id;
            const itemY = currentY + (index * 65);
            
            // Item container background
            const itemBg = this.scene.add.graphics();
            if (isEquipped) {
                itemBg.fillStyle(0x27ae60, 0.3); // Green for equipped
                itemBg.lineStyle(2, 0x2ecc71, 0.8);
            } else {
                itemBg.fillStyle(0x2c3e50, 0.6); // Dark blue-gray for unequipped
                itemBg.lineStyle(1, 0x34495e, 0.8);
            }
            itemBg.fillRoundedRect(menuX + 10, itemY - 5, menuWidth - 20, 60, 8);
            itemBg.strokeRoundedRect(menuX + 10, itemY - 5, menuWidth - 20, 60, 8);
            this.container.add(itemBg);
            this.equipmentMenuElements.push(itemBg);
            
            // Item rarity color indicator (larger and more visible)
            const rarityColor = this.getRarityColor(item.rarity);
            const colorIndicator = this.scene.add.graphics();
            const colorValue = rarityColor.startsWith('#') ? parseInt(rarityColor.replace('#', '0x')) : 0xffffff;
            colorIndicator.fillStyle(colorValue);
            colorIndicator.fillRoundedRect(menuX + 20, itemY + 5, 30, 30, 4);
            colorIndicator.lineStyle(2, 0x000000, 0.8);
            colorIndicator.strokeRoundedRect(menuX + 20, itemY + 5, 30, 30, 4);
            this.container.add(colorIndicator);
            this.equipmentMenuElements.push(colorIndicator);
            
            // Item name with better typography
            const itemName = UITheme.createText(this.scene, menuX + 60, itemY + 8, item.name, 'bodyMedium');
            itemName.setColor('#ffffff');
            itemName.setFontStyle('bold');
            itemName.setShadow(1, 1, '#000000', 2);
            if (isEquipped) {
                itemName.setColor('#2ecc71');
            }
            this.container.add(itemName);
            this.equipmentMenuElements.push(itemName);
            
            // Item rarity with better contrast
            const rarityText = UITheme.createText(this.scene, menuX + 60, itemY + 25, 
                this.getRarityName(item.rarity), 'bodySmall');
            rarityText.setColor(rarityColor);
            rarityText.setFontStyle('bold');
            rarityText.setShadow(1, 1, '#000000', 3);
            this.container.add(rarityText);
            this.equipmentMenuElements.push(rarityText);
            
            // Item description with proper contrast
            const description = item.description || 'No description available';
            const descText = UITheme.createText(this.scene, menuX + 60, itemY + 40, 
                description.length > 30 ? description.substring(0, 30) + '...' : description, 'bodySmall');
            descText.setColor('#e8e8e8'); // Light gray for better readability
            descText.setShadow(1, 1, '#000000', 2);
            this.container.add(descText);
            this.equipmentMenuElements.push(descText);
            
            // Action button/status with better styling
            if (isEquipped) {
                const equippedBtn = this.scene.add.graphics();
                equippedBtn.fillStyle(0x27ae60, 0.8);
                equippedBtn.fillRoundedRect(menuX + menuWidth - 90, itemY + 15, 70, 25, 4);
                equippedBtn.lineStyle(2, 0x2ecc71);
                equippedBtn.strokeRoundedRect(menuX + menuWidth - 90, itemY + 15, 70, 25, 4);
                this.container.add(equippedBtn);
                this.equipmentMenuElements.push(equippedBtn);
                
                const equippedLabel = UITheme.createText(this.scene, menuX + menuWidth - 55, itemY + 27, 
                    'EQUIPPED', 'bodySmall');
                equippedLabel.setOrigin(0.5);
                equippedLabel.setColor('#ffffff');
                equippedLabel.setFontStyle('bold');
                equippedLabel.setShadow(1, 1, '#000000', 2);
                this.container.add(equippedLabel);
                this.equipmentMenuElements.push(equippedLabel);
            } else {
                const equipBtn = this.scene.add.graphics();
                equipBtn.fillStyle(0x3498db, 0.8);
                equipBtn.fillRoundedRect(menuX + menuWidth - 80, itemY + 15, 60, 25, 4);
                equipBtn.lineStyle(2, 0x2980b9);
                equipBtn.strokeRoundedRect(menuX + menuWidth - 80, itemY + 15, 60, 25, 4);
                this.container.add(equipBtn);
                this.equipmentMenuElements.push(equipBtn);
                
                const equipLabel = UITheme.createText(this.scene, menuX + menuWidth - 50, itemY + 27, 
                    'EQUIP', 'bodySmall');
                equipLabel.setOrigin(0.5);
                equipLabel.setColor('#ffffff');
                equipLabel.setFontStyle('bold');
                equipLabel.setShadow(1, 1, '#000000', 2);
                this.container.add(equipLabel);
                this.equipmentMenuElements.push(equipLabel);
            }
            
            // Working interactive area (outside container with absolute coordinates)
            const workingItemArea = this.scene.add.rectangle(
                this.x + menuX + menuWidth/2,
                this.y + itemY + 27,
                menuWidth - 20,
                60
            ).setInteractive()
            .setAlpha(0.01)
            .setFillStyle(0x000000)
            .setDepth(10003); // Above equipment menu
            
            console.log(`InventoryUI: Creating working equipment menu item area for ${item.name} at x=${this.x + menuX + menuWidth/2}, y=${this.y + itemY + 27}`);
            
            // Working area events with better visual feedback
            workingItemArea.on('pointerdown', () => {
                console.log(`InventoryUI: Working equipment menu item clicked: ${item.name} (equipped: ${isEquipped})`);
                this.audioManager?.playSFX('button');
                
                if (!isEquipped) {
                    console.log(`InventoryUI: Attempting to equip ${item.name} in category ${item.category}`);
                    this.equipItem(item, item.category);
                } else {
                    console.log(`InventoryUI: Attempting to unequip ${item.name} in category ${item.category}`);
                    this.unequipItem(item, item.category);
                }
                this.clearEquipmentSelectionMenu();
            });
            
            workingItemArea.on('pointerover', () => {
                workingItemArea.setAlpha(0.05); // More visible on hover
                itemBg.clear();
                if (isEquipped) {
                    itemBg.fillStyle(0x2ecc71, 0.5); // Brighter green
                    itemBg.lineStyle(3, 0x27ae60, 1);
                } else {
                    itemBg.fillStyle(0x3498db, 0.4); // Blue highlight
                    itemBg.lineStyle(2, 0x2980b9, 1);
                }
                itemBg.fillRoundedRect(menuX + 10, itemY - 5, menuWidth - 20, 60, 8);
                itemBg.strokeRoundedRect(menuX + 10, itemY - 5, menuWidth - 20, 60, 8);
            });
            
            workingItemArea.on('pointerout', () => {
                workingItemArea.setAlpha(0.01); // Back to barely visible
                itemBg.clear();
                if (isEquipped) {
                    itemBg.fillStyle(0x27ae60, 0.3);
                    itemBg.lineStyle(2, 0x2ecc71, 0.8);
                } else {
                    itemBg.fillStyle(0x2c3e50, 0.6);
                    itemBg.lineStyle(1, 0x34495e, 0.8);
                }
                itemBg.fillRoundedRect(menuX + 10, itemY - 5, menuWidth - 20, 60, 8);
                itemBg.strokeRoundedRect(menuX + 10, itemY - 5, menuWidth - 20, 60, 8);
            });
            
            // Store for cleanup
            this.equipmentMenuWorkingAreas.push(workingItemArea);
        });
        
        // Working close button area with better positioning
        const workingCloseArea = this.scene.add.rectangle(
            this.x + menuX + menuWidth - 25,
            this.y + menuY + 25,
            40,
            40
        ).setInteractive()
        .setAlpha(0.01)
        .setFillStyle(0xff0000)
        .setDepth(10003);
        
        workingCloseArea.on('pointerdown', () => {
            console.log('InventoryUI: Working close button clicked');
            this.audioManager?.playSFX('button');
            this.clearEquipmentSelectionMenu();
        });
        
        this.equipmentMenuWorkingAreas.push(workingCloseArea);
        
        console.log(`InventoryUI: Equipment menu created with ${this.equipmentMenuElements.length} tracked elements`);
    }

    /**
     * Clear equipment selection menu
     */
    clearEquipmentSelectionMenu() {
        try {
            console.log('InventoryUI: Starting equipment menu cleanup...');
            
            // Clean up tracked menu elements directly
            if (this.equipmentMenuElements && this.equipmentMenuElements.length > 0) {
                console.log(`InventoryUI: Cleaning up ${this.equipmentMenuElements.length} tracked menu elements`);
                
                this.equipmentMenuElements.forEach((element, index) => {
                    try {
                        if (element && !element.destroyed) {
                            console.log(`InventoryUI: Destroying menu element ${index}:`, element.type || 'unknown');
                            element.destroy();
                        }
                    } catch (error) {
                        console.warn(`InventoryUI: Error destroying menu element ${index}:`, error);
                    }
                });
                
                this.equipmentMenuElements = [];
            }
            
            // Clean up working interactive areas
            if (this.equipmentMenuWorkingAreas && this.equipmentMenuWorkingAreas.length > 0) {
                console.log(`InventoryUI: Cleaning up ${this.equipmentMenuWorkingAreas.length} working areas`);
                
                this.equipmentMenuWorkingAreas.forEach((area, index) => {
                    try {
                        if (area && !area.destroyed) {
                            console.log(`InventoryUI: Destroying working area ${index}`);
                            area.destroy();
                        }
                    } catch (error) {
                        console.warn(`InventoryUI: Error destroying working area ${index}:`, error);
                    }
                });
                
                this.equipmentMenuWorkingAreas = [];
            }
            
            // Clear references
            this.equipmentMenu = null;
            this.equipmentMenuOverlay = null;
            
            console.log('InventoryUI: Equipment menu cleanup completed successfully');
            
        } catch (error) {
            console.error('InventoryUI: Error during equipment menu cleanup:', error);
            
            // Force cleanup of references even if cleanup failed
            this.equipmentMenu = null;
            this.equipmentMenuOverlay = null;
            this.equipmentMenuElements = [];
            this.equipmentMenuWorkingAreas = [];
        }
    }

    /**
     * Manually refresh equipment slots (useful for debugging)
     */
    manualRefreshEquipmentSlots() {
        try {
            console.log('InventoryUI: Manual equipment slot refresh requested');
            
            if (this.inventoryManager && typeof this.inventoryManager.refreshEquipmentSlots === 'function') {
                this.inventoryManager.refreshEquipmentSlots();
            } else {
                console.error('InventoryUI: InventoryManager or refreshEquipmentSlots method not available');
                this.showMessage('❌ Unable to refresh equipment slots', '#e74c3c');
            }
        } catch (error) {
            console.error('InventoryUI: Error in manual equipment slot refresh:', error);
            this.showMessage('❌ Error refreshing equipment slots', '#e74c3c');
        }
    }
}

export default InventoryUI; 