import UITheme from './UITheme.js';

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

        // Background using UITheme
        this.background = UITheme.createPanel(this.scene, 0, 0, this.width, this.height, 'primary');
        this.container.add(this.background);

        // Title using UITheme
        const title = UITheme.createText(this.scene, this.width / 2, 30, 'BOAT WORKSHOP', 'headerLarge');
        title.setOrigin(0.5);
        this.container.add(title);

        // Close button using UITheme
        const closeButton = UITheme.createText(this.scene, this.width - 30, 30, '×', 'error');
        closeButton.setOrigin(0.5).setInteractive();
        closeButton.setFontSize('32px');
        
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
                    tabBg.fillStyle(UITheme.colors.darkSecondary);
                    tabBg.fillRoundedRect(x, y, tabWidth, tabHeight, UITheme.borders.radius.small);
                    tabBg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
                    tabBg.strokeRoundedRect(x, y, tabWidth, tabHeight, UITheme.borders.radius.small);
                }
            });
            
            workingTabArea.on('pointerout', () => {
                workingTabArea.setAlpha(0.01); // Back to minimal
                if (category !== this.currentCategory) {
                    tabBg.clear();
                    tabBg.fillStyle(UITheme.colors.darkSecondary);
                    tabBg.fillRoundedRect(x, y, tabWidth, tabHeight, UITheme.borders.radius.small);
                    tabBg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
                    tabBg.strokeRoundedRect(x, y, tabWidth, tabHeight, UITheme.borders.radius.small);
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
        const buttonX = 30;
        const buttonY = 30;
        const buttonWidth = 120;
        const buttonHeight = 30;

        // Use UITheme button creator
        const backBtn = UITheme.createButton(
            this.scene, 
            buttonX + buttonWidth/2, 
            buttonY, 
            buttonWidth, 
            buttonHeight, 
            '← INVENTORY', 
            () => this.backToInventory(),
            'secondary'
        );

        this.backButtonBg = backBtn.button;
        this.backButtonText = backBtn.text;
        this.backButton = backBtn.button; // For reference
        this.container.add([this.backButtonBg, this.backButtonText]);

        // Working interactive area
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

        // Panel background using UITheme
        const panelBg = UITheme.createPanel(this.scene, panelX, panelY, panelWidth, panelHeight, 'secondary');
        this.container.add(panelBg);

        // Panel title using UITheme
        const panelTitle = UITheme.createText(this.scene, panelX + panelWidth/2, panelY + 15, 'RECIPES', 'headerSmall');
        panelTitle.setOrigin(0.5);
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

        // Panel background using UITheme
        const panelBg = UITheme.createPanel(this.scene, panelX, panelY, panelWidth, panelHeight, 'secondary');
        this.container.add(panelBg);

        // Panel title using UITheme
        const panelTitle = UITheme.createText(this.scene, panelX + panelWidth/2, panelY + 15, 'CRAFTING', 'headerSmall');
        panelTitle.setOrigin(0.5);
        this.container.add(panelTitle);

        // Recipe details area
        this.recipeDetailsContainer = this.scene.add.container(panelX + 10, panelY + 35);
        this.container.add(this.recipeDetailsContainer);

        // Ingredient slots - moved much lower to avoid overlap with recipe details
        this.createIngredientSlots(panelX + 10, panelY + 300);

        // Craft button using UITheme
        this.craftButton = UITheme.createButton(
            this.scene, 
            panelX + panelWidth/2, 
            panelY + panelHeight - 40, 
            120, 
            35, 
            'CRAFT', 
            () => this.startCrafting(),
            'success'
        );
        this.craftButton.button.setAlpha(0.5);
        this.container.add([this.craftButton.button, this.craftButton.text]);
    }

    createCraftingQueuePanel() {
        const panelX = 660;
        const panelY = 120;
        const panelWidth = 200;
        const panelHeight = 400;

        // Panel background using UITheme
        const panelBg = UITheme.createPanel(this.scene, panelX, panelY, panelWidth, panelHeight, 'secondary');
        this.container.add(panelBg);

        // Panel title using UITheme
        const panelTitle = UITheme.createText(this.scene, panelX + panelWidth/2, panelY + 15, 'CRAFTING QUEUE', 'headerSmall');
        panelTitle.setOrigin(0.5);
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

        // Slot background using UITheme
        const slotBg = this.scene.add.graphics();
        slotBg.fillStyle(UITheme.colors.darkSecondary);
        slotBg.fillRoundedRect(x, y, slotSize, slotSize, UITheme.borders.radius.small);
        slotBg.lineStyle(UITheme.borders.width.medium, UITheme.colors.medium);
        slotBg.strokeRoundedRect(x, y, slotSize, slotSize, UITheme.borders.radius.small);

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
        this.tooltip.setDepth(3000);

        // Tooltip background using UITheme
        this.tooltipBg = this.scene.add.graphics();
        this.tooltipText = UITheme.createText(this.scene, 0, 0, '', 'bodySmall');
        this.tooltipText.setPadding(8, 6);
        this.tooltipText.setWordWrapWidth(200);
        this.tooltipText.setBackgroundColor(UITheme.colors.darkPrimary);

        this.tooltip.add([this.tooltipBg, this.tooltipText]);
    }

    // UI Management
    show() {
        console.log('CraftingUI: Showing crafting UI');
        this.isVisible = true;
        this.container.setVisible(true);
        this.clickBlocker.setVisible(true);
        
        // Hide fish button when crafting is open
        if (this.scene.hideFishButton) {
            this.scene.hideFishButton();
        }
        
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
        
        // Show fish button when crafting is closed
        if (this.scene.showFishButton) {
            this.scene.showFishButton();
        }
        
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
            tab.bg.fillStyle(isActive ? UITheme.colors.primary : UITheme.colors.darkSecondary);
            tab.bg.fillRoundedRect(tab.area.x - tab.area.width/2, tab.area.y - tab.area.height/2, 
                                   tab.area.width, tab.area.height, UITheme.borders.radius.small);
            tab.bg.lineStyle(UITheme.borders.width.thin, isActive ? UITheme.colors.primaryLight : UITheme.colors.medium);
            tab.bg.strokeRoundedRect(tab.area.x - tab.area.width/2, tab.area.y - tab.area.height/2, 
                                     tab.area.width, tab.area.height, UITheme.borders.radius.small);
            tab.text.setColor(isActive ? UITheme.colors.text : UITheme.colors.textSecondary);
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

        // Background using UITheme
        const bg = this.scene.add.graphics();
        bg.fillStyle(UITheme.colors.darkSecondary);
        bg.fillRoundedRect(x, y, this.recipeListBounds.width - 10, itemHeight, UITheme.borders.radius.small);
        bg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
        bg.strokeRoundedRect(x, y, this.recipeListBounds.width - 10, itemHeight, UITheme.borders.radius.small);
        elements.push(bg);

        // Recipe icon (placeholder) using UITheme rarity colors - FIXED
        const icon = this.scene.add.graphics();
        const rarityColor = UITheme.getRarityColor(recipe.result.rarity);
        // Handle both string and number color formats
        let colorValue;
        if (typeof rarityColor === 'string') {
            colorValue = parseInt(rarityColor.replace('#', '0x'));
        } else {
            colorValue = rarityColor; // Already a number
        }
        icon.fillStyle(colorValue);
        icon.fillRoundedRect(x + 5, y + 5, 45, 45, UITheme.borders.radius.small);
        elements.push(icon);

        // Recipe name using UITheme
        const nameText = UITheme.createText(this.scene, x + 60, y + 8, recipe.name, 'bodyMedium');
        nameText.setColor(UITheme.colors.text);
        elements.push(nameText);

        // Level requirement - prominently displayed using UITheme
        const requiredLevel = recipe.result.unlockLevel || 1;
        const playerLevel = this.gameState.player.level;
        const hasRequiredLevel = playerLevel >= requiredLevel;
        
        const levelText = UITheme.createText(this.scene, x + 60, y + 22, `Level ${requiredLevel}`, 'bodySmall');
        levelText.setColor(hasRequiredLevel ? UITheme.colors.success : UITheme.colors.error);
        elements.push(levelText);

        // Cost and time using UITheme colors
        const costText = UITheme.createText(this.scene, x + 60, y + 35, `${recipe.cost} coins`, 'bodySmall');
        costText.setColor(UITheme.colors.gold);
        elements.push(costText);

        const timeText = UITheme.createText(this.scene, x + 60, y + 47, `${recipe.craftTime}m`, 'bodySmall');
        timeText.setColor(UITheme.colors.info);
        elements.push(timeText);

        // Can craft indicator using UITheme colors
        const canCraft = this.craftingManager.canCraft(recipe.id);
        const statusIcon = this.scene.add.graphics();
        statusIcon.fillStyle(canCraft.canCraft ? UITheme.colors.success : UITheme.colors.error);
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

        // Working area events using UITheme colors
        workingArea.on('pointerdown', () => {
            console.log('CraftingUI: Recipe clicked:', recipe.name);
            this.selectRecipe(recipe);
        });
        
        workingArea.on('pointerover', () => {
            workingArea.setAlpha(0.1); // More visible on hover
            bg.clear();
            bg.fillStyle(UITheme.colors.darkPrimary);
            bg.fillRoundedRect(x, y, this.recipeListBounds.width - 10, itemHeight, UITheme.borders.radius.small);
            bg.lineStyle(UITheme.borders.width.thin, UITheme.colors.primary);
            bg.strokeRoundedRect(x, y, this.recipeListBounds.width - 10, itemHeight, UITheme.borders.radius.small);
        });
        
        workingArea.on('pointerout', () => {
            workingArea.setAlpha(0.01); // Back to minimal
            bg.clear();
            bg.fillStyle(UITheme.colors.darkSecondary);
            bg.fillRoundedRect(x, y, this.recipeListBounds.width - 10, itemHeight, UITheme.borders.radius.small);
            bg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
            bg.strokeRoundedRect(x, y, this.recipeListBounds.width - 10, itemHeight, UITheme.borders.radius.small);
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
            
            // Use the same improved matching logic as CraftingManager
            const matchingCards = fishCards.filter(card => {
                if (!card) return false;
                
                // Strategy 1: Direct ID match
                if (card.id === ingredient.id) {
                    console.log('CraftingUI: Direct ID match found:', card.name);
                    return true;
                }
                
                // Strategy 2: fishId match (for fish cards that have both id and fishId)
                if (card.fishId === ingredient.id) {
                    console.log('CraftingUI: fishId match found:', card.name, '(fishId:', card.fishId + ')');
                    return true;
                }
                
                // Strategy 3: Name-based match (case insensitive)
                if (card.name && card.name.toLowerCase() === ingredient.id.toLowerCase()) {
                    console.log('CraftingUI: Name match found:', card.name);
                    return true;
                }
                
                // Strategy 4: Name contains the ingredient id
                if (card.name && card.name.toLowerCase().includes(ingredient.id.toLowerCase())) {
                    console.log('CraftingUI: Name contains match found:', card.name);
                    return true;
                }
                
                console.log('CraftingUI: No match for fish card - id:', card.id, 'fishId:', card.fishId, 'name:', card.name);
                return false;
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
        
        // Create item sprite (colored rectangle based on rarity) - FIXED
        const rarity = item.rarity || 1;
        let rarityColor = UITheme.getRarityColor ? UITheme.getRarityColor(rarity) : this.getRarityColor(rarity);
        
        console.log('CraftingUI: Creating sprite with rarity:', rarity, 'color:', rarityColor);
        
        // Handle both string and number color formats
        let colorValue;
        if (typeof rarityColor === 'string') {
            colorValue = parseInt(rarityColor.replace('#', '0x'));
        } else {
            colorValue = rarityColor; // Already a number
        }
        
        slot.sprite = this.scene.add.graphics();
        slot.sprite.fillStyle(colorValue);
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

        // Background using UITheme
        const bg = this.scene.add.graphics();
        const bgColor = isCompleted ? UITheme.colors.darkSuccess : UITheme.colors.darkSecondary;
        const borderColor = isCompleted ? UITheme.colors.success : UITheme.colors.medium;
        
        bg.fillStyle(bgColor);
        bg.fillRoundedRect(x, y, this.queueBounds.width - 10, itemHeight, UITheme.borders.radius.small);
        bg.lineStyle(UITheme.borders.width.thin, borderColor);
        bg.strokeRoundedRect(x, y, this.queueBounds.width - 10, itemHeight, UITheme.borders.radius.small);
        elements.push(bg);

        // Recipe name using UITheme
        const nameText = UITheme.createText(this.scene, x + 5, y + 5, craftingItem.recipe.name, 'bodySmall');
        nameText.setWordWrapWidth(this.queueBounds.width - 20);
        nameText.setColor(UITheme.colors.text);
        elements.push(nameText);

        // Progress bar using UITheme
        const progressBg = this.scene.add.graphics();
        progressBg.fillStyle(UITheme.colors.darkPrimary);
        progressBg.fillRect(x + 5, y + 25, this.queueBounds.width - 20, 8);
        progressBg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
        progressBg.strokeRect(x + 5, y + 25, this.queueBounds.width - 20, 8);
        elements.push(progressBg);

        const totalTime = craftingItem.endTime - craftingItem.startTime;
        const elapsed = now - craftingItem.startTime;
        const progress = Math.min(elapsed / totalTime, 1);

        const progressFill = this.scene.add.graphics();
        progressFill.fillStyle(isCompleted ? UITheme.colors.success : UITheme.colors.primary);
        progressFill.fillRect(x + 5, y + 25, (this.queueBounds.width - 20) * progress, 8);
        elements.push(progressFill);

        // Time text using UITheme
        const timeText = UITheme.createText(this.scene, x + 5, y + 40, 
            isCompleted ? 'READY!' : this.formatTime(timeRemaining), 'bodySmall');
        timeText.setColor(isCompleted ? UITheme.colors.success : UITheme.colors.textSecondary);
        elements.push(timeText);

        // Collect button (if completed) using UITheme
        if (isCompleted) {
            const collectBtn = UITheme.createButton(
                this.scene, 
                x + this.queueBounds.width - 50, 
                y + 55, 
                70, 
                25, 
                'COLLECT', 
                () => this.collectCraftedItem(craftingItem.id),
                'success'
            );
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

    showMessage(text, color = UITheme.colors.info) {
        // Create message using UITheme
        const message = UITheme.createText(
            this.scene,
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2,
            text,
            'bodyLarge'
        );
        message.setOrigin(0.5);
        message.setDepth(3000);
        message.setColor(typeof color === 'string' ? color : `#${color.toString(16).padStart(6, '0')}`);
        message.setBackgroundColor(UITheme.colors.darkPrimary);
        message.setPadding(16, 8);

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
        this.tooltipText.setColor(UITheme.colors.text);
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