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
        .setDepth(10002);

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
        .setDepth(10002);

        workingEquipmentButton.on('pointerdown', () => {
            this.openEquipmentUI();
        });

        this.equipmentButtonArea = workingEquipmentButton;
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
            this.container.add([slot.bg, slot.label, slot.area]);
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

        // Interactive area
        const slotArea = this.scene.add.rectangle(x + slotSize/2, y + slotSize/2, slotSize, slotSize)
            .setInteractive()
            .setAlpha(0);

        slotArea.on('pointerdown', () => this.onEquipmentSlotClick(slotType));
        
        // Add working interactive area (like other UI elements)
        const workingSlotArea = this.scene.add.rectangle(
            this.x + x + slotSize/2,
            this.y + y + slotSize/2,
            slotSize + 5,
            slotSize + 5
        ).setInteractive()
        .setAlpha(0.01)
        .setFillStyle(0x000000)
        .setDepth(10002);
        
        workingSlotArea.on('pointerdown', () => {
            console.log('InventoryUI: Working equipment slot clicked:', slotType);
            this.onEquipmentSlotClick(slotType);
        });
        
        workingSlotArea.on('pointerover', () => {
            // Highlight the slot on hover
            slotBg.clear();
            slotBg.fillStyle(UITheme.colors.darkSecondary);
            slotBg.fillRoundedRect(x, y, slotSize, slotSize, UITheme.borders.radius.small);
            slotBg.lineStyle(UITheme.borders.width.medium, UITheme.colors.primaryLight);
            slotBg.strokeRoundedRect(x, y, slotSize, slotSize, UITheme.borders.radius.small);
        });
        
        workingSlotArea.on('pointerout', () => {
            // Reset slot appearance
            slotBg.clear();
            slotBg.fillStyle(UITheme.colors.darkPrimary);
            slotBg.fillRoundedRect(x, y, slotSize, slotSize, UITheme.borders.radius.small);
            slotBg.lineStyle(UITheme.borders.width.medium, UITheme.colors.primary);
            slotBg.strokeRoundedRect(x, y, slotSize, slotSize, UITheme.borders.radius.small);
        });

        return {
            bg: slotBg,
            label: label,
            area: slotArea,
            workingArea: workingSlotArea,
            x: x,
            y: y,
            slotType: slotType,
            itemSprite: null,
            slotSize: slotSize
        };
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
        
        // Get the category for this slot type
        const categoryMap = {
            'rod': 'rods',
            'lure': 'lures', 
            'boat': 'boats',
            'head': 'clothing',
            'upper_body': 'clothing',
            'lower_body': 'clothing',
            'bikini_assistant': 'bikini_assistants'
        };
        
        const category = categoryMap[slotType];
        if (!category) {
            console.error('InventoryUI: Invalid slot type:', slotType);
            return;
        }
        
        // Get currently equipped item for this slot
        const equipped = this.inventoryManager.getEquippedItems(category);
        
        let currentItem = null;
        if (equipped && equipped.length > 0) {
            if (category === 'clothing') {
                // For clothing, find by slotType
                currentItem = equipped.find(item => item.slotType === slotType);
            } else {
                // For other categories, take the first equipped item
                currentItem = equipped[0];
            }
        }
        
        console.log('InventoryUI: Currently equipped in', slotType, ':', currentItem?.name || 'none');
        
        // Get all available items for this category
        const availableItems = this.gameState.inventory[category] || [];
        
        // For clothing, filter by slotType
        let filteredItems;
        if (category === 'clothing') {
            filteredItems = availableItems.filter(item => item.slotType === slotType);
        } else {
            filteredItems = availableItems;
        }
        
        console.log('InventoryUI: Available items for', category, ':', filteredItems.length);
        
        if (filteredItems.length === 0) {
            this.showMessage(`No ${category} available to equip for ${slotType}`, '#ffaa00');
            return;
        }
        
        // Show equipment selection menu
        this.showEquipmentSelectionMenu(slotType, category, currentItem, filteredItems);
    }

    showEquipmentSelectionMenu(slotType, category, currentItem, availableItems) {
        console.log('InventoryUI: Showing equipment selection menu for', slotType);
        console.log('InventoryUI: Available items:', availableItems.length, availableItems.map(item => item.name));
        
        // Temporarily disable inventory click blockers to prevent interference
        if (this.clickBlocker) this.clickBlocker.setInteractive(false);
        if (this.backgroundBlocker) this.backgroundBlocker.setInteractive(false);
        
        // Add sample items if there aren't enough to test with
        if (availableItems.length <= 1 && category === 'rods') {
            console.log('InventoryUI: Adding sample rods for testing');
            this.inventoryManager.addSampleItems();
            // Refresh available items
            const allItems = this.gameState.inventory[category] || [];
            if (category === 'clothing') {
                availableItems = allItems.filter(item => item.slotType === slotType);
            } else {
                availableItems = allItems;
            }
            console.log('InventoryUI: After adding samples, available items:', availableItems.length);
        }
        
        if (availableItems.length === 0) {
            this.showMessage(`No ${category} available to equip for ${slotType}`, '#ffaa00');
            // Re-enable click blockers
            if (this.clickBlocker) this.clickBlocker.setInteractive(true);
            if (this.backgroundBlocker) this.backgroundBlocker.setInteractive(true);
            return;
        }
        
        // Helper function to clean up and re-enable blockers
        const cleanup = () => {
            if (this.clickBlocker) this.clickBlocker.setInteractive(true);
            if (this.backgroundBlocker) this.backgroundBlocker.setInteractive(true);
        };
        
        // Create backdrop first at lower depth to catch outside clicks
        const backdrop = this.scene.add.rectangle(
            this.scene.sys.game.config.width / 2, 
            this.scene.sys.game.config.height / 2, 
            this.scene.sys.game.config.width, 
            this.scene.sys.game.config.height,
            0x000000,
            0.5
        ).setInteractive()
        .setDepth(14900); // Much lower depth
        
        // Create selection menu container at very high depth
        const menuWidth = 320;
        const menuHeight = Math.min(450, 120 + availableItems.length * 45 + (currentItem ? 45 : 0));
        const menuX = this.scene.sys.game.config.width / 2;
        const menuY = this.scene.sys.game.config.height / 2;
        
        const selectionMenu = this.scene.add.container(menuX, menuY);
        selectionMenu.setDepth(16000); // Very high depth to ensure it's on top
        
        // Menu background with stronger visual
        const menuBg = this.scene.add.graphics();
        menuBg.fillStyle(0x1a1a1a, 0.98); // More opaque
        menuBg.fillRoundedRect(-menuWidth/2, -menuHeight/2, menuWidth, menuHeight, 12);
        menuBg.lineStyle(4, 0x4a90e2, 1); // Thicker border
        menuBg.strokeRoundedRect(-menuWidth/2, -menuHeight/2, menuWidth, menuHeight, 12);
        
        // Add shadow effect
        const shadowBg = this.scene.add.graphics();
        shadowBg.fillStyle(0x000000, 0.6);
        shadowBg.fillRoundedRect(-menuWidth/2 + 4, -menuHeight/2 + 4, menuWidth, menuHeight, 12);
        
        // Menu title with better visibility
        const title = this.scene.add.text(0, -menuHeight/2 + 25, `SELECT ${slotType.toUpperCase()}`, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        selectionMenu.add([shadowBg, menuBg, title]);
        
        let yOffset = -menuHeight/2 + 70;
        
        // Add "None" option to unequip
        if (currentItem) {
            const unequipOption = this.createEquipmentOption(
                0, yOffset, 
                null, 
                false, // Not currently equipped (this is the unequip option)
                () => {
                    console.log('InventoryUI: Unequipping', currentItem.name);
                    this.inventoryManager.unequipItem(category, currentItem.id);
                    selectionMenu.destroy();
                    backdrop.destroy();
                    cleanup();
                    this.updateEquipmentSlots();
                    this.refreshItems();
                    this.showMessage(`Unequipped ${currentItem.name}`, '#00ff00');
                }
            );
            selectionMenu.add(unequipOption);
            yOffset += 45;
        }
        
        // Add available items
        availableItems.forEach((item, index) => {
            const isCurrentlyEquipped = currentItem && currentItem.id === item.id;
            
            if (yOffset > menuHeight/2 - 50) return; // Skip if outside menu bounds
            
            const itemOption = this.createEquipmentOption(
                0, yOffset,
                item,
                isCurrentlyEquipped,
                () => {
                    if (!isCurrentlyEquipped) {
                        console.log('InventoryUI: Equipping', item.name);
                        const success = this.inventoryManager.equipItem(category, item.id);
                        if (success) {
                            selectionMenu.destroy();
                            backdrop.destroy();
                            cleanup();
                            this.updateEquipmentSlots();
                            this.refreshItems();
                            this.showMessage(`Equipped ${item.name}`, '#00ff00');
                        } else {
                            this.showMessage(`Failed to equip ${item.name}`, '#ff6666');
                        }
                    } else {
                        this.showMessage(`${item.name} is already equipped`, '#ffaa00');
                    }
                }
            );
            selectionMenu.add(itemOption);
            yOffset += 45;
        });
        
        // Close button with better positioning
        const closeButton = this.scene.add.text(menuWidth/2 - 25, -menuHeight/2 + 25, '×', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ff6666',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setInteractive();
        
        closeButton.on('pointerdown', () => {
            console.log('InventoryUI: Closing equipment selection menu via close button');
            selectionMenu.destroy();
            backdrop.destroy();
            cleanup();
        });
        
        closeButton.on('pointerover', () => {
            closeButton.setColor('#ff9999');
            closeButton.setScale(1.1);
        });
        closeButton.on('pointerout', () => {
            closeButton.setColor('#ff6666');
            closeButton.setScale(1.0);
        });
        
        selectionMenu.add(closeButton);
        
        // Backdrop click to close
        backdrop.on('pointerdown', () => {
            console.log('InventoryUI: Clicked outside equipment menu, closing');
            selectionMenu.destroy();
            backdrop.destroy();
            cleanup();
        });
        
        console.log('InventoryUI: Equipment selection menu created at depth', selectionMenu.depth);
        console.log('InventoryUI: Backdrop created at depth', backdrop.depth);
        console.log('InventoryUI: Menu items:', availableItems.length, 'Unequip option:', !!currentItem);
        console.log('InventoryUI: Click blockers disabled during equipment selection');
    }

    createEquipmentOption(x, y, item, isCurrentlyEquipped, onClickCallback) {
        const optionContainer = this.scene.add.container(x, y);
        
        // Option background
        const bgColor = isCurrentlyEquipped ? 0x2a5a2a : 0x2a2a2a;
        const borderColor = isCurrentlyEquipped ? 0x00ff00 : 0x666666;
        
        const optionBg = this.scene.add.graphics();
        optionBg.fillStyle(bgColor);
        optionBg.fillRoundedRect(-150, -18, 300, 36, 8);
        optionBg.lineStyle(2, borderColor);
        optionBg.strokeRoundedRect(-150, -18, 300, 36, 8);
        
        // Option text
        const displayText = item ? item.name : '[Unequip]';
        const textColor = isCurrentlyEquipped ? '#00ff00' : '#ffffff';
        const statusText = isCurrentlyEquipped ? ' (equipped)' : '';
        
        const optionText = this.scene.add.text(0, -5, displayText + statusText, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: textColor,
            fontStyle: isCurrentlyEquipped ? 'bold' : 'normal',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        
        // Interactive area - make it larger and ensure it's on top
        const interactiveArea = this.scene.add.rectangle(0, 0, 300, 36)
            .setInteractive()
            .setAlpha(0.01) // Very slightly visible for debugging
            .setDepth(1); // High local depth within container
        
        console.log('InventoryUI: Creating equipment option:', displayText, 'at y:', y);
        
        // Store original style for reset
        const originalBgColor = bgColor;
        const originalBorderColor = borderColor;
        const originalTextColor = textColor;
        
        // Hover effects with stronger visual feedback
        interactiveArea.on('pointerover', () => {
            console.log('InventoryUI: Equipment option hover:', displayText);
            // Change background to bright blue for better visibility
            optionBg.clear();
            optionBg.fillStyle(isCurrentlyEquipped ? 0x3a7a3a : 0x4a90e2);
            optionBg.fillRoundedRect(-150, -18, 300, 36, 8);
            optionBg.lineStyle(3, 0x6bb6ff);
            optionBg.strokeRoundedRect(-150, -18, 300, 36, 8);
            
            // Make text brighter
            optionText.setColor('#ffffff');
            optionText.setScale(1.05);
            
            // Make interactive area slightly visible to confirm hover
            interactiveArea.setAlpha(0.05);
        });
        
        interactiveArea.on('pointerout', () => {
            console.log('InventoryUI: Equipment option hover out:', displayText);
            // Reset to original style
            optionBg.clear();
            optionBg.fillStyle(originalBgColor);
            optionBg.fillRoundedRect(-150, -18, 300, 36, 8);
            optionBg.lineStyle(2, originalBorderColor);
            optionBg.strokeRoundedRect(-150, -18, 300, 36, 8);
            
            // Reset text
            optionText.setColor(originalTextColor);
            optionText.setScale(1.0);
            
            // Reset interactive area alpha
            interactiveArea.setAlpha(0.01);
        });
        
        interactiveArea.on('pointerdown', () => {
            console.log('InventoryUI: Equipment option clicked:', displayText);
            
            // Visual click feedback
            optionBg.clear();
            optionBg.fillStyle(0x6bb6ff);
            optionBg.fillRoundedRect(-150, -18, 300, 36, 8);
            optionBg.lineStyle(3, 0xffffff);
            optionBg.strokeRoundedRect(-150, -18, 300, 36, 8);
            
            this.audioManager?.playSFX('button');
            
            // Slight delay for visual feedback then execute callback
            this.scene.time.delayedCall(100, () => {
                onClickCallback();
            });
        });
        
        // Add elements in correct order (background first, then text, then interactive area on top)
        optionContainer.add([optionBg, optionText, interactiveArea]);
        
        // Add item stats if available
        if (item && item.stats) {
            const statsText = Object.entries(item.stats)
                .map(([stat, value]) => `${stat}: +${value}`)
                .slice(0, 3) // Limit to 3 stats to avoid clutter
                .join(', ');
            
            const itemStats = this.scene.add.text(0, 15, statsText, {
                fontSize: '10px',
                fontFamily: 'Arial',
                color: '#cccccc',
                stroke: '#000000',
                strokeThickness: 1
            }).setOrigin(0.5);
            
            optionContainer.add(itemStats);
        }
        
        return optionContainer;
    }

    // UI Management
    show() {
        console.log('InventoryUI: Showing inventory UI');
        console.log('InventoryUI: Container position:', this.container.x, this.container.y);
        console.log('InventoryUI: Container visible:', this.container.visible);
        console.log('InventoryUI: Current inventory state:', this.gameState.inventory);
        
        // Add sample items if inventory is empty for testing
        const rodsCount = (this.gameState.inventory.rods || []).length;
        const luresCount = (this.gameState.inventory.lures || []).length;
        console.log('InventoryUI: Current item counts - Rods:', rodsCount, 'Lures:', luresCount);
        
        if (rodsCount <= 1 || luresCount <= 1) {
            console.log('InventoryUI: Adding sample items for testing equipment switching');
            this.inventoryManager.addSampleItems();
        }
        
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
        
        // Show equipment slot areas
        if (this.equipmentSlots) {
            Object.values(this.equipmentSlots).forEach(slot => {
                if (slot.workingArea) {
                    slot.workingArea.setVisible(true);
                }
            });
        }
        
        // Show crafting button area
        if (this.craftingButtonArea) {
            this.craftingButtonArea.setVisible(true);
        }
        
        // Show equipment button area
        if (this.equipmentButtonArea) {
            this.equipmentButtonArea.setVisible(true);
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
        console.log('InventoryUI: Hiding inventory UI');
        
        // Prevent double-hiding or hiding already destroyed UI
        if (!this.isVisible || this.isDestroyed) {
            console.log('InventoryUI: Already hidden or destroyed, skipping hide');
            return;
        }
        
        try {
            this.isVisible = false;
            
            // Hide main UI elements with null checks
            if (this.clickBlocker && !this.clickBlocker.destroyed) {
                this.clickBlocker.setVisible(false);
            }
            
            if (this.backgroundBlocker && !this.backgroundBlocker.destroyed) {
                this.backgroundBlocker.setVisible(false);
            }
            
            if (this.container && !this.container.destroyed) {
                this.container.setVisible(false);
            }
            
            // Hide tooltip safely
            this.hideTooltip();
            
            // Hide working areas with null checks
            if (this.categoryTabs) {
                Object.values(this.categoryTabs).forEach(tab => {
                    if (tab && tab.workingArea && !tab.workingArea.destroyed) {
                        tab.workingArea.setVisible(false);
                    }
                });
            }
            
            if (this.itemSlots) {
                this.itemSlots.forEach(slot => {
                    if (slot && slot.workingArea && !slot.workingArea.destroyed) {
                        slot.workingArea.setVisible(false);
                    }
                });
            }
            
            // Hide equipment slot areas with null checks
            if (this.equipmentSlots) {
                Object.values(this.equipmentSlots).forEach(slot => {
                    if (slot && slot.workingArea && !slot.workingArea.destroyed) {
                        slot.workingArea.setVisible(false);
                    }
                });
            }
            
            // Hide button areas with null checks
            if (this.craftingButtonArea && !this.craftingButtonArea.destroyed) {
                this.craftingButtonArea.setVisible(false);
            }
            
            if (this.equipmentButtonArea && !this.equipmentButtonArea.destroyed) {
                this.equipmentButtonArea.setVisible(false);
            }
            
            console.log('InventoryUI: Inventory UI hidden successfully');
            
        } catch (error) {
            console.error('InventoryUI: Error hiding inventory UI:', error);
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

        // Create item sprite (placeholder colored rectangle for now) - FIXED
        let rarity = item.rarity || 1; // Default to rarity 1 if undefined
        let rarityColor = UITheme.getRarityColor(rarity); // Use UITheme instead of validator
        
        console.log('InventoryUI: Item rarity color:', rarityColor, 'for rarity:', rarity);
        
        // Create a more visible item background
        try {
            slot.itemSprite = this.scene.add.graphics();
            
            // Color is already a hex number from UITheme.getRarityColor()
            let colorHex = rarityColor; // No conversion needed
            
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
                'boat': 'boats',
                'head': 'clothing',
                'upper_body': 'clothing', 
                'lower_body': 'clothing',
                'bikini_assistant': 'bikini_assistants'
            };
            
            const category = categoryMap[slotType];
            if (category && equipped[category] && equipped[category].length > 0) {
                // For clothing, find the specific slot type
                let item;
                if (category === 'clothing') {
                    item = equipped[category].find(equippedItem => equippedItem.slotType === slotType);
                } else {
                    item = equipped[category][0];
                }
                
                if (item) {
                // Create item display - FIXED to use UITheme
                const rarity = item.rarity || 1; // Default to rarity 1 if undefined
                const rarityColor = UITheme.getRarityColor(rarity); // Use UITheme
                slot.itemSprite = this.scene.add.graphics();
                slot.itemSprite.fillStyle(rarityColor); // Color is already a hex number
                slot.itemSprite.fillRoundedRect(
                    slot.x + 5, slot.y + 5, 
                        slot.slotSize - 10, slot.slotSize - 10, 
                    3
                );

                const itemText = this.scene.add.text(
                        slot.x + slot.slotSize/2, slot.y + slot.slotSize/2, 
                    item.name.substring(0, 2).toUpperCase(), {
                        fontSize: '10px',
                    fontFamily: 'Arial',
                    color: '#ffffff',
                    fontStyle: 'bold'
                }).setOrigin(0.5);

                this.container.add([slot.itemSprite, itemText]);
                }
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
        // Use UITheme for consistency - FIXED
        const rarityColorHex = UITheme.getRarityColorHex(rarity); // Get hex string version
        
        let tooltipText = `${item.name}\n`;
        tooltipText += `Rarity ${rarity} ${item.type || ''}\n`;
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
        this.tooltipText.setColor(rarityColorHex); // Use hex string for text color
        
        // Position tooltip
        this.tooltip.setPosition(x + 10, y - 50);
        this.tooltip.setVisible(true);
    }

    hideTooltip() {
        try {
            if (this.tooltip && !this.tooltip.destroyed) {
                this.tooltip.setVisible(false);
            }
        } catch (error) {
            console.error('InventoryUI: Error hiding tooltip:', error);
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
}

export default InventoryUI; 