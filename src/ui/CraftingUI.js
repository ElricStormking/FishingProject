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
        
        closeButton.on('pointerdown', () => this.hide());
        closeButton.on('pointerover', () => closeButton.setColor('#ff9999'));
        closeButton.on('pointerout', () => closeButton.setColor('#ff6666'));
        this.container.add(closeButton);

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

        // Ingredient slots
        this.createIngredientSlots(panelX + 10, panelY + 200);

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
        const slotSize = 60;
        const slotSpacing = 70;

        for (let i = 0; i < 5; i++) {
            const slotX = startX + (i % 3) * slotSpacing;
            const slotY = startY + Math.floor(i / 3) * slotSpacing;

            const slot = this.createIngredientSlot(slotX, slotY, i);
            this.ingredientSlots.push(slot);
            this.container.add([slot.bg, slot.area]);
        }
    }

    createIngredientSlot(x, y, index) {
        const slotSize = 60;

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
        this.refreshRecipes();
        this.refreshCraftingQueue();
        console.log('CraftingUI: Crafting UI shown successfully');
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
        this.selectedRecipe = null;
        this.refreshRecipes();
        this.clearRecipeDetails();
    }

    refreshRecipes() {
        // Clear existing recipe list
        this.recipeListContainer.removeAll(true);

        const recipes = this.craftingManager.getRecipes(this.currentCategory);
        let yOffset = 0;

        recipes.forEach((recipe, index) => {
            const recipeItem = this.createRecipeItem(recipe, 0, yOffset);
            this.recipeListContainer.add(recipeItem.elements);
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
        const nameText = this.scene.add.text(x + 60, y + 10, recipe.name, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        elements.push(nameText);

        // Cost and time
        const costText = this.scene.add.text(x + 60, y + 25, `${recipe.cost} coins`, {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#ffdd44'
        });
        elements.push(costText);

        const timeText = this.scene.add.text(x + 60, y + 38, `${recipe.craftTime}m`, {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#44ddff'
        });
        elements.push(timeText);

        // Can craft indicator
        const canCraft = this.craftingManager.canCraft(recipe.id);
        const statusIcon = this.scene.add.graphics();
        statusIcon.fillStyle(canCraft.canCraft ? 0x44ff44 : 0xff4444);
        statusIcon.fillCircle(x + this.recipeListBounds.width - 25, y + itemHeight/2, 8);
        elements.push(statusIcon);

        // Make interactive
        const area = this.scene.add.rectangle(
            x + this.recipeListBounds.width/2 - 5, 
            y + itemHeight/2, 
            this.recipeListBounds.width - 10, 
            itemHeight
        ).setInteractive().setAlpha(0);

        area.on('pointerdown', () => this.selectRecipe(recipe));
        area.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x3a3a3a);
            bg.fillRoundedRect(x, y, this.recipeListBounds.width - 10, itemHeight, 3);
            bg.lineStyle(1, 0x5a5a5a);
            bg.strokeRoundedRect(x, y, this.recipeListBounds.width - 10, itemHeight, 3);
        });
        area.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x2a2a2a);
            bg.fillRoundedRect(x, y, this.recipeListBounds.width - 10, itemHeight, 3);
            bg.lineStyle(1, 0x4a4a4a);
            bg.strokeRoundedRect(x, y, this.recipeListBounds.width - 10, itemHeight, 3);
        });

        elements.push(area);

        return { elements, recipe };
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
    }

    clearRecipeDetails() {
        this.recipeDetailsContainer.removeAll(true);
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
            this.showMessage(`Started crafting ${this.selectedRecipe.name}!`, 0x44ff44);
            this.refreshRecipes();
            this.refreshCraftingQueue();
            this.updateCraftButton();
        } else {
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
            this.showMessage('Item collected!', 0x44ff44);
            this.refreshCraftingQueue();
            this.refreshRecipes();
        } else {
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
        
        if (this.container) {
            this.container.destroy();
        }
        if (this.tooltip) {
            this.tooltip.destroy();
        }
    }
}

export default CraftingUI; 