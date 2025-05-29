export class CraftingUI {
    constructor(scene, x, y, width, height) {
        console.log('CraftingUI: Constructor called', { scene: scene.scene.key, x, y, width, height });
        
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        this.gameState = scene.gameState;
        this.craftingManager = this.gameState.craftingManager;
        this.audioManager = this.gameState.getAudioManager(scene);
        
        // UI state
        this.isVisible = false;
        this.currentCategory = 'rods';
        this.selectedRecipe = null;
        this.selectedIngredients = [];
        
        // UI elements
        this.container = null;
        this.background = null;
        this.categoryTabs = {};
        this.recipeList = [];
        this.ingredientSlots = [];
        this.craftingQueue = [];
        this.tooltip = null;
        
        // Working interactive areas (outside container)
        this.workingTabAreas = {};
        this.workingRecipeAreas = [];
        this.clickBlocker = null;
        
        this.createUI();
        this.setupEventListeners();
    }

    createUI() {
        // Click blocker to prevent clicks from passing through
        this.clickBlocker = this.scene.add.graphics();
        this.clickBlocker.fillStyle(0x000000, 0.01);
        this.clickBlocker.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);
        this.clickBlocker.setInteractive();
        this.clickBlocker.setDepth(9999);
        this.clickBlocker.setVisible(false);
        this.clickBlocker.on('pointerdown', (pointer, currentlyOver) => {
            pointer.event.stopPropagation();
        });

        // Main container
        this.container = this.scene.add.container(this.x, this.y);
        this.container.setVisible(false);
        this.container.setDepth(10000);

        // Interactive background to block clicks
        this.interactiveBackground = this.scene.add.graphics();
        this.interactiveBackground.fillStyle(0x000000, 0.01);
        this.interactiveBackground.fillRect(0, 0, this.width, this.height);
        this.interactiveBackground.setInteractive();
        this.interactiveBackground.setDepth(10000);
        this.interactiveBackground.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
        });
        this.container.add(this.interactiveBackground);

        // Background
        this.background = this.scene.add.graphics();
        this.background.fillStyle(0x2a2a2a, 0.95);
        this.background.fillRoundedRect(0, 0, this.width, this.height, 10);
        this.background.lineStyle(2, 0x4a4a4a);
        this.background.strokeRoundedRect(0, 0, this.width, this.height, 10);
        this.container.add(this.background);

        // Title
        const title = this.scene.add.text(this.width / 2, 30, 'BOAT WORKSHOP', {
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
            this.audioManager?.playSFX('button');
            this.hide();
        });
        closeButton.on('pointerover', () => closeButton.setColor('#ff9999'));
        closeButton.on('pointerout', () => closeButton.setColor('#ff6666'));
        this.container.add(closeButton);

        // Back to Inventory button (initially hidden)
        this.createBackToInventoryButton();

        // Category tabs
        this.createCategoryTabs();

        // Recipe list panel
        this.createRecipeListPanel();

        // Crafting panel
        this.createCraftingPanel();

        // Crafting queue panel
        this.createCraftingQueuePanel();

        // Tooltip
        this.createTooltip();
    }

    createCategoryTabs() {
        const categories = ['rods', 'lures', 'boats', 'clothing'];
        const tabWidth = 100;
        const tabHeight = 30;
        const startX = 20;
        const startY = 70;

        categories.forEach((category, index) => {
            const x = startX + index * (tabWidth + 5);
            const y = startY;

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

            // Original interactive area (keep for reference but won't work)
            const tabArea = this.scene.add.rectangle(x + tabWidth/2, y + tabHeight/2, tabWidth, tabHeight)
                .setInteractive()
                .setAlpha(0);

            // Working interactive area (outside container with absolute coordinates)
            const workingTabArea = this.scene.add.rectangle(
                this.x + x + tabWidth/2, 
                this.y + y + tabHeight/2, 
                tabWidth, 
                tabHeight
            );
            workingTabArea.setFillStyle(0x000000, 0.01); // Minimal visible alpha
            workingTabArea.setInteractive();
            workingTabArea.setDepth(10002);
            workingTabArea.setAlpha(0.01);

            // Working tab events
            workingTabArea.on('pointerdown', () => {
                console.log('CraftingUI: Tab clicked:', category);
                this.audioManager?.playSFX('button');
                this.switchCategory(category);
            });
            
            workingTabArea.on('pointerover', () => {
                workingTabArea.setAlpha(0.1); // More visible on hover
                if (category !== this.currentCategory) {
                    tabBg.clear();
                    tabBg.fillStyle(0x4a4a4a);
                    tabBg.fillRoundedRect(x, y, tabWidth, tabHeight, 5);
                    tabBg.lineStyle(1, 0x6a6a6a);
                    tabBg.strokeRoundedRect(x, y, tabWidth, tabHeight, 5);
                }
            });
            
            workingTabArea.on('pointerout', () => {
                workingTabArea.setAlpha(0.01); // Back to minimal
                if (category !== this.currentCategory) {
                    tabBg.clear();
                    tabBg.fillStyle(0x3a3a3a);
                    tabBg.fillRoundedRect(x, y, tabWidth, tabHeight, 5);
                    tabBg.lineStyle(1, 0x5a5a5a);
                    tabBg.strokeRoundedRect(x, y, tabWidth, tabHeight, 5);
                }
            });

            // Store references
            this.categoryTabs[category] = { bg: tabBg, text: tabText, area: tabArea };
            this.workingTabAreas[category] = workingTabArea;
            this.container.add([tabBg, tabText, tabArea]);
        });
    }

    createBackToInventoryButton() {
        // Create back button in the top left area
        const buttonX = 20;
        const buttonY = 30;
        const buttonWidth = 120;
        const buttonHeight = 30;

        // Button background
        this.backButtonBg = this.scene.add.graphics();
        this.backButtonBg.fillStyle(0x4a90e2);
        this.backButtonBg.fillRoundedRect(buttonX, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);
        this.backButtonBg.lineStyle(2, 0x6bb6ff);
        this.backButtonBg.strokeRoundedRect(buttonX, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);

        // Button text
        this.backButtonText = this.scene.add.text(buttonX + buttonWidth/2, buttonY, '← INVENTORY', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Make button interactive
        this.backButton = this.scene.add.rectangle(
            buttonX + buttonWidth/2, 
            buttonY, 
            buttonWidth, 
            buttonHeight
        ).setInteractive().setAlpha(0);

        this.backButton.on('pointerdown', () => {
            console.log('CraftingUI: Back to Inventory button clicked');
            this.backToInventory();
        });

        this.backButton.on('pointerover', () => {
            this.backButtonBg.clear();
            this.backButtonBg.fillStyle(0x6bb6ff);
            this.backButtonBg.fillRoundedRect(buttonX, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);
            this.backButtonBg.lineStyle(2, 0x4a90e2);
            this.backButtonBg.strokeRoundedRect(buttonX, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);
        });

        this.backButton.on('pointerout', () => {
            this.backButtonBg.clear();
            this.backButtonBg.fillStyle(0x4a90e2);
            this.backButtonBg.fillRoundedRect(buttonX, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);
            this.backButtonBg.lineStyle(2, 0x6bb6ff);
            this.backButtonBg.strokeRoundedRect(buttonX, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);
        });

        this.container.add([this.backButtonBg, this.backButtonText, this.backButton]);

        // Working interactive area for back button
        this.workingBackButton = this.scene.add.rectangle(
            this.x + buttonX + buttonWidth/2,
            this.y + buttonY,
            buttonWidth + 5,
            buttonHeight + 5
        ).setInteractive()
        .setAlpha(0.01)
        .setFillStyle(0x000000)
        .setDepth(10002);

        this.workingBackButton.on('pointerdown', () => {
            this.backToInventory();
        });

        this.workingBackButton.on('pointerover', () => {
            this.workingBackButton.setAlpha(0.02);
            this.backButtonBg.clear();
            this.backButtonBg.fillStyle(0x6bb6ff);
            this.backButtonBg.fillRoundedRect(buttonX, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);
            this.backButtonBg.lineStyle(2, 0x4a90e2);
            this.backButtonBg.strokeRoundedRect(buttonX, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);
        });

        this.workingBackButton.on('pointerout', () => {
            this.workingBackButton.setAlpha(0.01);
            this.backButtonBg.clear();
            this.backButtonBg.fillStyle(0x4a90e2);
            this.backButtonBg.fillRoundedRect(buttonX, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);
            this.backButtonBg.lineStyle(2, 0x6bb6ff);
            this.backButtonBg.strokeRoundedRect(buttonX, buttonY - buttonHeight/2, buttonWidth, buttonHeight, 5);
        });

        // Initially hide the back button
        this.backButtonBg.setVisible(false);
        this.backButtonText.setVisible(false);
        this.backButton.setVisible(false);
        this.workingBackButton.setVisible(false);
    }

    backToInventory() {
        console.log('CraftingUI: Going back to Inventory');
        this.audioManager?.playSFX('button');
        
        // Hide crafting UI
        this.hide();
        
        // Show inventory UI
        if (this.scene.inventoryUI) {
            this.scene.inventoryUI.show();
        } else {
            console.error('CraftingUI: InventoryUI not found in scene');
        }
        
        // Reset the flag
        this.openedFromInventory = false;
    }

    createRecipeListPanel() {
        const panelX = 20;
        const panelY = 120;
        const panelWidth = 300;
        const panelHeight = 400;

        // Panel background
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(0x1a1a1a, 0.8);
        panelBg.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 5);
        panelBg.lineStyle(1, 0x4a4a4a);
        panelBg.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 5);
        this.container.add(panelBg);

        // Panel title
        const panelTitle = this.scene.add.text(panelX + panelWidth/2, panelY + 15, 'RECIPES', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(panelTitle);

        // Recipe list container
        this.recipeListContainer = this.scene.add.container(panelX + 10, panelY + 35);
        this.container.add(this.recipeListContainer);

        this.recipeListBounds = {
            x: panelX + 10,
            y: panelY + 35,
            width: panelWidth - 20,
            height: panelHeight - 45
        };
    }

    createCraftingPanel() {
        const panelX = 340;
        const panelY = 120;
        const panelWidth = 300;
        const panelHeight = 400;

        // Panel background
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(0x1a1a1a, 0.8);
        panelBg.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 5);
        panelBg.lineStyle(1, 0x4a4a4a);
        panelBg.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 5);
        this.container.add(panelBg);

        // Panel title
        const panelTitle = this.scene.add.text(panelX + panelWidth/2, panelY + 15, 'CRAFTING', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(panelTitle);

        // Recipe details area
        this.recipeDetailsContainer = this.scene.add.container(panelX + 10, panelY + 35);
        this.container.add(this.recipeDetailsContainer);

        // Ingredient slots - moved much lower to avoid overlap with recipe details
        this.createIngredientSlots(panelX + 10, panelY + 300);

        // Craft button
        this.craftButton = this.createButton(panelX + panelWidth/2, panelY + panelHeight - 40, 'CRAFT', () => {
            this.startCrafting();
        });
        this.craftButton.button.setAlpha(0.5);
        this.container.add([this.craftButton.button, this.craftButton.text]);
    }

    createCraftingQueuePanel() {
        const panelX = 660;
        const panelY = 120;
        const panelWidth = 200;
        const panelHeight = 400;

        // Panel background
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(0x1a1a1a, 0.8);
        panelBg.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 5);
        panelBg.lineStyle(1, 0x4a4a4a);
        panelBg.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 5);
        this.container.add(panelBg);

        // Panel title
        const panelTitle = this.scene.add.text(panelX + panelWidth/2, panelY + 15, 'CRAFTING QUEUE', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(panelTitle);

        // Queue container
        this.queueContainer = this.scene.add.container(panelX + 10, panelY + 35);
        this.container.add(this.queueContainer);

        this.queueBounds = {
            x: panelX + 10,
            y: panelY + 35,
            width: panelWidth - 20,
            height: panelHeight - 45
        };
    }

    createIngredientSlots(startX, startY) {
        this.ingredientSlots = [];
        const slotSize = 45; // Smaller slots
        const slotSpacing = 50; // Tighter spacing

        for (let i = 0; i < 5; i++) {
            // Arrange in a single row instead of grid
            const slotX = startX + i * slotSpacing;
            const slotY = startY;

            const slot = this.createIngredientSlot(slotX, slotY, i);
            this.ingredientSlots.push(slot);
            this.container.add([slot.bg, slot.area]);
        }
    }

    createIngredientSlot(x, y, index) {
        const slotSize = 45; // Match the smaller size

        // Slot background
        const slotBg = this.scene.add.graphics();
        slotBg.fillStyle(0x2a2a2a);
        slotBg.fillRoundedRect(x, y, slotSize, slotSize, 3);
        slotBg.lineStyle(2, 0x4a4a4a);
        slotBg.strokeRoundedRect(x, y, slotSize, slotSize, 3);

        // Interactive area
        const slotArea = this.scene.add.rectangle(x + slotSize/2, y + slotSize/2, slotSize, slotSize)
            .setInteractive()
            .setAlpha(0);

        return {
            bg: slotBg,
            area: slotArea,
            x: x,
            y: y,
            index: index,
            ingredient: null,
            sprite: null,
            quantityText: null
        };
    }

    createButton(x, y, text, callback) {
        const button = this.scene.add.graphics();
        button.fillStyle(0x4a90e2);
        button.fillRoundedRect(-60, -15, 120, 30, 5);
        button.lineStyle(1, 0x6bb6ff);
        button.strokeRoundedRect(-60, -15, 120, 30, 5);
        button.setPosition(x, y);

        const buttonText = this.scene.add.text(x, y, text, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        button.setInteractive(new Phaser.Geom.Rectangle(-60, -15, 120, 30), Phaser.Geom.Rectangle.Contains);
        button.on('pointerdown', callback);
        button.on('pointerover', () => {
            if (button.alpha === 1) {
                button.clear();
                button.fillStyle(0x6bb6ff);
                button.fillRoundedRect(-60, -15, 120, 30, 5);
                button.lineStyle(1, 0x4a90e2);
                button.strokeRoundedRect(-60, -15, 120, 30, 5);
            }
        });
        button.on('pointerout', () => {
            if (button.alpha === 1) {
                button.clear();
                button.fillStyle(0x4a90e2);
                button.fillRoundedRect(-60, -15, 120, 30, 5);
                button.lineStyle(1, 0x6bb6ff);
                button.strokeRoundedRect(-60, -15, 120, 30, 5);
            }
        });

        return { button, text: buttonText };
    }

    createTooltip() {
        this.tooltip = this.scene.add.container(0, 0);
        this.tooltip.setVisible(false);
        this.tooltip.setDepth(2000);

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

    // UI Management
    show() {
        console.log('CraftingUI: Showing crafting UI');
        this.isVisible = true;
        this.container.setVisible(true);
        this.clickBlocker.setVisible(true);
        
        // Show working tab areas
        Object.values(this.workingTabAreas).forEach(area => {
            area.setVisible(true);
        });
        
        // Show back button if opened from inventory
        if (this.openedFromInventory) {
            this.backButtonBg.setVisible(true);
            this.backButtonText.setVisible(true);
            this.backButton.setVisible(true);
            this.workingBackButton.setVisible(true);
        }
        
        this.refreshRecipes();
        this.refreshCraftingQueue();
        console.log('CraftingUI: Crafting UI shown successfully');
    }

    hide() {
        this.isVisible = false;
        this.container.setVisible(false);
        this.clickBlocker.setVisible(false);
        
        // Hide working tab areas
        Object.values(this.workingTabAreas).forEach(area => {
            area.setVisible(false);
        });
        
        // Hide working recipe areas
        this.workingRecipeAreas.forEach(area => {
            area.setVisible(false);
        });
        
        // Hide back button
        if (this.backButtonBg) {
            this.backButtonBg.setVisible(false);
            this.backButtonText.setVisible(false);
            this.backButton.setVisible(false);
            this.workingBackButton.setVisible(false);
        }
        
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
        this.selectedRecipe = null;
        this.refreshRecipes();
        this.clearRecipeDetails();
    }

    refreshRecipes() {
        // Clear existing recipe list
        this.recipeListContainer.removeAll(true);
        
        // Clear and hide old working recipe areas
        this.workingRecipeAreas.forEach(area => {
            area.setVisible(false);
            area.destroy();
        });
        this.workingRecipeAreas = [];

        const recipes = this.craftingManager.getRecipes(this.currentCategory);
        let yOffset = 0;

        recipes.forEach((recipe, index) => {
            const recipeItem = this.createRecipeItem(recipe, 0, yOffset);
            this.recipeListContainer.add(recipeItem.elements);
            
            // Show the working area if UI is visible
            if (this.isVisible && recipeItem.workingArea) {
                recipeItem.workingArea.setVisible(true);
            }
            
            yOffset += 60;
        });
    }

    createRecipeItem(recipe, x, y) {
        const elements = [];
        const itemHeight = 55;

        // Background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x2a2a2a);
        bg.fillRoundedRect(x, y, this.recipeListBounds.width - 10, itemHeight, 3);
        bg.lineStyle(1, 0x4a4a4a);
        bg.strokeRoundedRect(x, y, this.recipeListBounds.width - 10, itemHeight, 3);
        elements.push(bg);

        // Recipe icon (placeholder)
        const icon = this.scene.add.graphics();
        icon.fillStyle(this.getRarityColor(recipe.result.rarity));
        icon.fillRoundedRect(x + 5, y + 5, 45, 45, 3);
        elements.push(icon);

        // Recipe name
        const nameText = this.scene.add.text(x + 60, y + 8, recipe.name, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        elements.push(nameText);

        // Level requirement - prominently displayed
        const requiredLevel = recipe.result.unlockLevel || 1;
        const playerLevel = this.gameState.player.level;
        const hasRequiredLevel = playerLevel >= requiredLevel;
        
        const levelText = this.scene.add.text(x + 60, y + 22, `Level ${requiredLevel}`, {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: hasRequiredLevel ? '#44ff44' : '#ff4444',
            fontStyle: 'bold'
        });
        elements.push(levelText);

        // Cost and time - moved down to accommodate level requirement
        const costText = this.scene.add.text(x + 60, y + 35, `${recipe.cost} coins`, {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#ffdd44'
        });
        elements.push(costText);

        const timeText = this.scene.add.text(x + 60, y + 47, `${recipe.craftTime}m`, {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#44ddff'
        });
        elements.push(timeText);

        // Can craft indicator - updated to consider level requirement
        const canCraft = this.craftingManager.canCraft(recipe.id);
        const statusIcon = this.scene.add.graphics();
        statusIcon.fillStyle(canCraft.canCraft ? 0x44ff44 : 0xff4444);
        statusIcon.fillCircle(x + this.recipeListBounds.width - 25, y + itemHeight/2, 8);
        elements.push(statusIcon);

        // Original interactive area (keep for reference but won't work)
        const area = this.scene.add.rectangle(
            x + this.recipeListBounds.width/2 - 5, 
            y + itemHeight/2, 
            this.recipeListBounds.width - 10, 
            itemHeight
        ).setInteractive().setAlpha(0);

        // Working interactive area (outside container with absolute coordinates)
        const workingArea = this.scene.add.rectangle(
            this.x + this.recipeListBounds.x + x + (this.recipeListBounds.width - 10)/2,
            this.y + this.recipeListBounds.y + y + itemHeight/2,
            this.recipeListBounds.width - 10,
            itemHeight
        );
        workingArea.setFillStyle(0x000000, 0.01); // Minimal visible alpha
        workingArea.setInteractive();
        workingArea.setDepth(10002);
        workingArea.setAlpha(0.01);

        // Working area events
        workingArea.on('pointerdown', () => {
            console.log('CraftingUI: Recipe clicked:', recipe.name);
            this.selectRecipe(recipe);
        });
        
        workingArea.on('pointerover', () => {
            workingArea.setAlpha(0.1); // More visible on hover
            bg.clear();
            bg.fillStyle(0x3a3a3a);
            bg.fillRoundedRect(x, y, this.recipeListBounds.width - 10, itemHeight, 3);
            bg.lineStyle(1, 0x5a5a5a);
            bg.strokeRoundedRect(x, y, this.recipeListBounds.width - 10, itemHeight, 3);
        });
        
        workingArea.on('pointerout', () => {
            workingArea.setAlpha(0.01); // Back to minimal
            bg.clear();
            bg.fillStyle(0x2a2a2a);
            bg.fillRoundedRect(x, y, this.recipeListBounds.width - 10, itemHeight, 3);
            bg.lineStyle(1, 0x4a4a4a);
            bg.strokeRoundedRect(x, y, this.recipeListBounds.width - 10, itemHeight, 3);
        });

        elements.push(area);
        this.workingRecipeAreas.push(workingArea);

        return { elements, recipe, workingArea };
    }

    selectRecipe(recipe) {
        this.selectedRecipe = recipe;
        this.showRecipeDetails(recipe);
        this.updateCraftButton();
    }

    showRecipeDetails(recipe) {
        // Clear existing details
        this.recipeDetailsContainer.removeAll(true);

        let yOffset = 0;

        // Recipe name and description
        const nameText = this.scene.add.text(0, yOffset, recipe.name, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.recipeDetailsContainer.add(nameText);
        yOffset += 25;

        const descText = this.scene.add.text(0, yOffset, recipe.description, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#cccccc',
            wordWrap: { width: 280 }
        });
        this.recipeDetailsContainer.add(descText);
        yOffset += 40;

        // Level requirement - prominently displayed
        const requiredLevel = recipe.result.unlockLevel || 1;
        const playerLevel = this.gameState.player.level;
        const hasRequiredLevel = playerLevel >= requiredLevel;
        
        const levelRequirementText = this.scene.add.text(0, yOffset, `Required Level: ${requiredLevel}`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: hasRequiredLevel ? '#44ff44' : '#ff4444',
            fontStyle: 'bold'
        });
        this.recipeDetailsContainer.add(levelRequirementText);
        
        if (!hasRequiredLevel) {
            const levelWarningText = this.scene.add.text(0, yOffset + 16, `(Current Level: ${playerLevel})`, {
                fontSize: '11px',
                fontFamily: 'Arial',
                color: '#ff6666',
                fontStyle: 'italic'
            });
            this.recipeDetailsContainer.add(levelWarningText);
            yOffset += 16;
        }
        yOffset += 25;

        // Cost and time
        const costText = this.scene.add.text(0, yOffset, `Cost: ${recipe.cost} coins`, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffdd44'
        });
        this.recipeDetailsContainer.add(costText);
        yOffset += 20;

        const timeText = this.scene.add.text(0, yOffset, `Time: ${recipe.craftTime} minutes`, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#44ddff'
        });
        this.recipeDetailsContainer.add(timeText);
        yOffset += 30;

        // Ingredients
        const ingredientsTitle = this.scene.add.text(0, yOffset, 'Ingredients:', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.recipeDetailsContainer.add(ingredientsTitle);
        yOffset += 20;

        recipe.ingredients.forEach((ingredient, index) => {
            const available = this.craftingManager.getAvailableIngredient(ingredient);
            const hasEnough = available >= ingredient.quantity;
            
            const ingredientText = this.scene.add.text(10, yOffset, 
                `${ingredient.quantity}x ${ingredient.id} (${available}/${ingredient.quantity})`, {
                fontSize: '11px',
                fontFamily: 'Arial',
                color: hasEnough ? '#44ff44' : '#ff4444'
            });
            this.recipeDetailsContainer.add(ingredientText);
            yOffset += 18;
        });

        // Result stats
        if (recipe.result.stats) {
            yOffset += 10;
            const statsTitle = this.scene.add.text(0, yOffset, 'Result Stats:', {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold'
            });
            this.recipeDetailsContainer.add(statsTitle);
            yOffset += 20;

            Object.entries(recipe.result.stats).forEach(([stat, value]) => {
                const statText = this.scene.add.text(10, yOffset, `${stat}: +${value}`, {
                    fontSize: '11px',
                    fontFamily: 'Arial',
                    color: '#44ddff'
                });
                this.recipeDetailsContainer.add(statText);
                yOffset += 18;
            });
        }

        // Populate ingredient slots with available items
        this.populateIngredientSlots(recipe);
    }

    populateIngredientSlots(recipe) {
        console.log('CraftingUI: Populating ingredient slots for recipe:', recipe.name);
        
        // Clear all ingredient slots first
        this.clearIngredientSlots();
        
        // For each required ingredient, find matching items in inventory and display them
        recipe.ingredients.forEach((ingredient, ingredientIndex) => {
            if (ingredientIndex >= this.ingredientSlots.length) return; // Skip if we don't have enough slots
            
            console.log('CraftingUI: Looking for ingredient:', ingredient);
            
            // Find available items for this ingredient
            const availableItems = this.getAvailableItemsForIngredient(ingredient);
            console.log('CraftingUI: Available items for ingredient:', availableItems);
            
            if (availableItems.length > 0) {
                // Use the first available item (could be enhanced to let player choose)
                const item = availableItems[0];
                const slot = this.ingredientSlots[ingredientIndex];
                
                this.displayIngredientInSlot(item, ingredient, slot);
            }
        });
    }

    getAvailableItemsForIngredient(ingredient) {
        console.log('CraftingUI: getAvailableItemsForIngredient called with:', ingredient);
        const items = [];
        
        if (ingredient.type === 'fish') {
            // Get fish from inventory
            const fishCards = this.gameState.inventory.fish || [];
            console.log('CraftingUI: Fish inventory:', fishCards);
            console.log('CraftingUI: Looking for fish with id:', ingredient.id);
            
            const matchingCards = fishCards.filter(card => {
                console.log('CraftingUI: Checking fish card:', card, 'id:', card.id, 'matches:', card.id === ingredient.id);
                return card.id === ingredient.id;
            });
            console.log('CraftingUI: Matching fish cards found:', matchingCards);
            items.push(...matchingCards);
        } else if (ingredient.type === 'equipment') {
            // Get equipment items
            for (const category of ['rods', 'lures', 'boats', 'clothing']) {
                const categoryItems = this.gameState.inventory[category] || [];
                const matchingItems = categoryItems.filter(item => item.id === ingredient.id && !item.equipped);
                items.push(...matchingItems);
            }
        }
        
        console.log('CraftingUI: Final available items for ingredient:', items);
        return items;
    }

    displayIngredientInSlot(item, ingredient, slot) {
        console.log('CraftingUI: Displaying ingredient in slot:', item.name, 'for ingredient:', ingredient);
        console.log('CraftingUI: Slot position:', slot.x, slot.y);
        console.log('CraftingUI: Container children before adding:', this.container.list.length);
        
        // Store the ingredient info
        slot.ingredient = ingredient;
        slot.item = item;
        
        // Create item sprite (colored rectangle based on rarity)
        const rarity = item.rarity || 1;
        const rarityColor = this.getRarityColor(rarity);
        
        console.log('CraftingUI: Creating sprite with rarity:', rarity, 'color:', rarityColor);
        
        slot.sprite = this.scene.add.graphics();
        slot.sprite.fillStyle(rarityColor);
        slot.sprite.fillRoundedRect(slot.x + 2, slot.y + 2, 41, 41, 3);
        slot.sprite.lineStyle(2, 0xffffff, 0.8);
        slot.sprite.strokeRoundedRect(slot.x + 2, slot.y + 2, 41, 41, 3);
        
        // Add item text
        slot.itemText = this.scene.add.text(
            slot.x + 22.5, slot.y + 22.5,
            item.name.substring(0, 3).toUpperCase(),
            {
                fontSize: '10px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 1
            }
        ).setOrigin(0.5);
        
        console.log('CraftingUI: Created item text:', item.name.substring(0, 3).toUpperCase());
        
        // Add quantity text showing required vs available
        const available = this.craftingManager.getAvailableIngredient(ingredient);
        const hasEnough = available >= ingredient.quantity;
        
        console.log('CraftingUI: Available quantity:', available, 'required:', ingredient.quantity, 'hasEnough:', hasEnough);
        
        slot.quantityText = this.scene.add.text(
            slot.x + 40, slot.y + 40,
            `${ingredient.quantity}/${available}`,
            {
                fontSize: '8px',
                fontFamily: 'Arial',
                color: hasEnough ? '#44ff44' : '#ff4444',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 1
            }
        ).setOrigin(1);
        
        console.log('CraftingUI: Created quantity text:', `${ingredient.quantity}/${available}`);
        
        // Add to container
        this.container.add([slot.sprite, slot.itemText, slot.quantityText]);
        
        console.log('CraftingUI: Container children after adding:', this.container.list.length);
        console.log('CraftingUI: Ingredient slot populated successfully');
        
        // Force a visual update
        this.scene.sys.updateList.update();
    }

    clearIngredientSlots() {
        this.ingredientSlots.forEach(slot => {
            // Clear existing displays
            if (slot.sprite) {
                slot.sprite.destroy();
                slot.sprite = null;
            }
            if (slot.itemText) {
                slot.itemText.destroy();
                slot.itemText = null;
            }
            if (slot.quantityText) {
                slot.quantityText.destroy();
                slot.quantityText = null;
            }
            
            // Clear data
            slot.ingredient = null;
            slot.item = null;
        });
    }

    clearRecipeDetails() {
        this.recipeDetailsContainer.removeAll(true);
        this.clearIngredientSlots();
        this.updateCraftButton();
    }

    updateCraftButton() {
        if (!this.selectedRecipe) {
            this.craftButton.button.setAlpha(0.5);
            this.craftButton.text.setColor('#888888');
            return;
        }

        const canCraft = this.craftingManager.canCraft(this.selectedRecipe.id);
        if (canCraft.canCraft) {
            this.craftButton.button.setAlpha(1);
            this.craftButton.text.setColor('#ffffff');
        } else {
            this.craftButton.button.setAlpha(0.5);
            this.craftButton.text.setColor('#888888');
        }
    }

    startCrafting() {
        if (!this.selectedRecipe) return;

        const result = this.craftingManager.startCrafting(this.selectedRecipe.id);
        if (result.success) {
            this.audioManager?.playSFX('craft');
            this.showMessage(`Started crafting ${this.selectedRecipe.name}!`, 0x44ff44);
            this.refreshRecipes();
            this.refreshCraftingQueue();
            this.updateCraftButton();
        } else {
            this.audioManager?.playSFX('fail');
            this.showMessage(`Cannot craft: ${result.reason}`, 0xff4444);
        }
    }

    refreshCraftingQueue() {
        // Clear existing queue
        this.queueContainer.removeAll(true);

        const queue = this.craftingManager.getCraftingQueue();
        let yOffset = 0;

        queue.forEach((craftingItem, index) => {
            const queueItem = this.createQueueItem(craftingItem, 0, yOffset);
            this.queueContainer.add(queueItem.elements);
            yOffset += 80;
        });
    }

    createQueueItem(craftingItem, x, y) {
        const elements = [];
        const itemHeight = 75;
        const now = Date.now();
        const timeRemaining = Math.max(0, craftingItem.endTime - now);
        const isCompleted = timeRemaining === 0 || craftingItem.completed;

        // Background
        const bg = this.scene.add.graphics();
        bg.fillStyle(isCompleted ? 0x2a4a2a : 0x2a2a2a);
        bg.fillRoundedRect(x, y, this.queueBounds.width - 10, itemHeight, 3);
        bg.lineStyle(1, isCompleted ? 0x44aa44 : 0x4a4a4a);
        bg.strokeRoundedRect(x, y, this.queueBounds.width - 10, itemHeight, 3);
        elements.push(bg);

        // Recipe name
        const nameText = this.scene.add.text(x + 5, y + 5, craftingItem.recipe.name, {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            wordWrap: { width: this.queueBounds.width - 20 }
        });
        elements.push(nameText);

        // Progress bar
        const progressBg = this.scene.add.graphics();
        progressBg.fillStyle(0x1a1a1a);
        progressBg.fillRect(x + 5, y + 25, this.queueBounds.width - 20, 8);
        progressBg.lineStyle(1, 0x4a4a4a);
        progressBg.strokeRect(x + 5, y + 25, this.queueBounds.width - 20, 8);
        elements.push(progressBg);

        const totalTime = craftingItem.endTime - craftingItem.startTime;
        const elapsed = now - craftingItem.startTime;
        const progress = Math.min(elapsed / totalTime, 1);

        const progressFill = this.scene.add.graphics();
        progressFill.fillStyle(isCompleted ? 0x44aa44 : 0x4a90e2);
        progressFill.fillRect(x + 5, y + 25, (this.queueBounds.width - 20) * progress, 8);
        elements.push(progressFill);

        // Time text
        const timeText = this.scene.add.text(x + 5, y + 40, 
            isCompleted ? 'READY!' : this.formatTime(timeRemaining), {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: isCompleted ? '#44ff44' : '#cccccc'
        });
        elements.push(timeText);

        // Collect button (if completed)
        if (isCompleted) {
            const collectBtn = this.createButton(x + this.queueBounds.width - 50, y + 55, 'COLLECT', () => {
                this.collectCraftedItem(craftingItem.id);
            });
            collectBtn.button.setScale(0.7);
            collectBtn.text.setScale(0.7);
            elements.push(collectBtn.button, collectBtn.text);
        }

        return { elements, craftingItem };
    }

    collectCraftedItem(craftingId) {
        const success = this.craftingManager.completeCrafting(craftingId);
        if (success) {
            this.audioManager?.playSFX('coin');
            this.showMessage('Item collected!', 0x44ff44);
            this.refreshCraftingQueue();
            this.refreshRecipes();
        } else {
            this.audioManager?.playSFX('fail');
            this.showMessage('Failed to collect item', 0xff4444);
        }
    }

    formatTime(milliseconds) {
        const totalSeconds = Math.ceil(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    getRarityColor(rarity) {
        const colors = {
            1: 0x888888, // Gray
            2: 0x44ff44, // Green
            3: 0x4444ff, // Blue
            4: 0xaa44aa, // Purple
            5: 0xffaa44  // Orange
        };
        return colors[rarity] || 0x888888;
    }

    showMessage(text, color) {
        const message = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2,
            text,
            {
                fontSize: '18px',
                fill: '#ffffff',
                fontFamily: 'Arial',
                backgroundColor: Phaser.Display.Color.IntegerToColor(color).rgba,
                padding: { x: 16, y: 8 }
            }
        );
        message.setOrigin(0.5);
        message.setDepth(3000);

        this.scene.tweens.add({
            targets: message,
            alpha: 0,
            y: message.y - 50,
            duration: 3000,
            ease: 'Power2',
            onComplete: () => message.destroy()
        });
    }

    showTooltip(text, x, y) {
        this.tooltipText.setText(text);
        this.tooltip.setPosition(x + 10, y - 50);
        this.tooltip.setVisible(true);
    }

    hideTooltip() {
        this.tooltip.setVisible(false);
    }

    setupEventListeners() {
        // Listen for crafting events
        this.craftingManager.on('craftingStarted', () => {
            if (this.isVisible) {
                this.refreshRecipes();
                this.refreshCraftingQueue();
            }
        });

        this.craftingManager.on('craftingCompleted', () => {
            if (this.isVisible) {
                this.refreshCraftingQueue();
            }
        });

        this.craftingManager.on('craftingReady', (data) => {
            if (this.isVisible) {
                this.refreshCraftingQueue();
            }
        });

        // Update queue periodically
        this.queueUpdateTimer = setInterval(() => {
            if (this.isVisible) {
                this.refreshCraftingQueue();
            }
        }, 1000);
    }

    destroy() {
        if (this.queueUpdateTimer) {
            clearInterval(this.queueUpdateTimer);
        }
        
        // Clean up working interactive areas
        Object.values(this.workingTabAreas).forEach(area => {
            if (area) area.destroy();
        });
        this.workingTabAreas = {};
        
        this.workingRecipeAreas.forEach(area => {
            if (area) area.destroy();
        });
        this.workingRecipeAreas = [];
        
        if (this.clickBlocker) {
            this.clickBlocker.destroy();
        }
        
        if (this.container) {
            this.container.destroy();
        }
        if (this.tooltip) {
            this.tooltip.destroy();
        }
    }
}

export default CraftingUI; 