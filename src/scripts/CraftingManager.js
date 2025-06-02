import { gameDataLoader } from './DataLoader.js';

export class CraftingManager {
    constructor(gameState, inventoryManager) {
        this.gameState = gameState;
        this.inventoryManager = inventoryManager;
        this.eventListeners = {};
        this.craftingQueue = []; // For timed crafting
        this.recipes = null;
        
        this.loadRecipes();
        this.startCraftingTimer();
    }

    /**
     * Load crafting recipes from data
     */
    loadRecipes() {
        try {
            // Load recipes from external data or use default recipes
            this.recipes = this.getDefaultRecipes();
            console.log('CraftingManager: Loaded', Object.keys(this.recipes).length, 'recipe categories');
        } catch (error) {
            console.error('CraftingManager: Error loading recipes:', error);
            this.recipes = {};
        }
    }

    /**
     * Get default recipes based on GDD specifications
     */
    getDefaultRecipes() {
        return {
            rods: [
                // Basic Rods (Fish Card + Coins + Time)
                {
                    id: 'bamboo_rod',
                    name: 'Bamboo Rod',
                    description: 'A simple bamboo fishing rod',
                    ingredients: [
                        { type: 'fish', id: 'minnow', quantity: 2 }
                    ],
                    cost: 200,
                    craftTime: 2, // minutes
                    result: {
                        id: 'bamboo_rod',
                        name: 'Bamboo Rod',
                        type: 'rod',
                        equipSlot: 'rod',
                        rarity: 1,
                        description: 'A simple bamboo fishing rod',
                        stats: {
                            castAccuracy: 5,
                            tensionStability: 3,
                            rareFishChance: 2,
                            castingRange: 5,
                            reelSpeed: 3,
                            struggleResistance: 2
                        },
                        unlockLevel: 1,
                        cost: 400,
                        durability: 100,
                        condition: 100
                    }
                },
                {
                    id: 'fiberglass_rod',
                    name: 'Fiberglass Rod',
                    description: 'A durable fiberglass fishing rod',
                    ingredients: [
                        { type: 'fish', id: 'perch', quantity: 2 }
                    ],
                    cost: 400,
                    craftTime: 4,
                    result: {
                        id: 'fiberglass_rod',
                        name: 'Fiberglass Rod',
                        type: 'rod',
                        equipSlot: 'rod',
                        rarity: 2,
                        description: 'A durable fiberglass fishing rod',
                        stats: {
                            castAccuracy: 8,
                            tensionStability: 6,
                            rareFishChance: 4,
                            castingRange: 8,
                            reelSpeed: 5,
                            struggleResistance: 4
                        },
                        unlockLevel: 5,
                        cost: 800,
                        durability: 120,
                        condition: 120
                    }
                },
                {
                    id: 'carbon_rod',
                    name: 'Carbon Rod',
                    description: 'A lightweight carbon fiber rod',
                    ingredients: [
                        { type: 'fish', id: 'trout', quantity: 2 }
                    ],
                    cost: 800,
                    craftTime: 6,
                    result: {
                        id: 'carbon_rod',
                        name: 'Carbon Rod',
                        type: 'rod',
                        equipSlot: 'rod',
                        rarity: 3,
                        description: 'A lightweight carbon fiber rod',
                        stats: {
                            castAccuracy: 12,
                            tensionStability: 10,
                            rareFishChance: 6,
                            castingRange: 12,
                            reelSpeed: 8,
                            struggleResistance: 6
                        },
                        unlockLevel: 10,
                        cost: 1600,
                        durability: 150,
                        condition: 150
                    }
                },
                {
                    id: 'steel_rod',
                    name: 'Steel Rod',
                    description: 'A strong steel fishing rod',
                    ingredients: [
                        { type: 'fish', id: 'pike', quantity: 2 }
                    ],
                    cost: 1200,
                    craftTime: 8,
                    result: {
                        id: 'steel_rod',
                        name: 'Steel Rod',
                        type: 'rod',
                        equipSlot: 'rod',
                        rarity: 4,
                        description: 'A strong steel fishing rod',
                        stats: {
                            castAccuracy: 15,
                            tensionStability: 15,
                            rareFishChance: 8,
                            castingRange: 15,
                            reelSpeed: 10,
                            struggleResistance: 10
                        },
                        unlockLevel: 15,
                        cost: 2400,
                        durability: 180,
                        condition: 180
                    }
                },
                {
                    id: 'titanium_rod',
                    name: 'Titanium Rod',
                    description: 'A premium titanium fishing rod',
                    ingredients: [
                        { type: 'fish', id: 'salmon', quantity: 2 }
                    ],
                    cost: 2000,
                    craftTime: 10,
                    result: {
                        id: 'titanium_rod',
                        name: 'Titanium Rod',
                        type: 'rod',
                        equipSlot: 'rod',
                        rarity: 5,
                        description: 'A premium titanium fishing rod',
                        stats: {
                            castAccuracy: 20,
                            tensionStability: 20,
                            rareFishChance: 12,
                            castingRange: 20,
                            reelSpeed: 15,
                            struggleResistance: 15
                        },
                        unlockLevel: 20,
                        cost: 4000,
                        durability: 200,
                        condition: 200
                    }
                },
                // Elite Rods (2 Basic Rods + Coins + Time)
                {
                    id: 'elite_bamboo_rod',
                    name: 'Elite Bamboo Rod',
                    description: 'An enhanced bamboo rod',
                    ingredients: [
                        { type: 'equipment', id: 'bamboo_rod', quantity: 2 }
                    ],
                    cost: 1000,
                    craftTime: 12,
                    result: {
                        id: 'elite_bamboo_rod',
                        name: 'Elite Bamboo Rod',
                        type: 'rod',
                        equipSlot: 'rod',
                        rarity: 3,
                        description: 'An enhanced bamboo rod',
                        stats: {
                            castAccuracy: 15,
                            tensionStability: 10,
                            rareFishChance: 8,
                            castingRange: 15,
                            reelSpeed: 10,
                            struggleResistance: 8
                        },
                        unlockLevel: 8,
                        cost: 2000,
                        durability: 150,
                        condition: 150
                    }
                }
                // More elite and master rods would follow the same pattern...
            ],
            lures: [
                {
                    id: 'basic_spinner',
                    name: 'Basic Spinner',
                    description: 'A simple spinning lure',
                    ingredients: [
                        { type: 'fish', id: 'perch', quantity: 2 }
                    ],
                    cost: 300,
                    craftTime: 2,
                    result: {
                        id: 'basic_spinner',
                        name: 'Basic Spinner',
                        type: 'spinner',
                        equipSlot: 'lure',
                        lureType: 'spinner',
                        rarity: 1,
                        description: 'A simple spinning lure',
                        stats: {
                            biteRate: 20,
                            lureSuccess: 15,
                            lureDurability: 10,
                            lurePrecision: 5
                        },
                        unlockLevel: 1,
                        cost: 600,
                        durability: 80,
                        condition: 80
                    }
                },
                {
                    id: 'soft_worm',
                    name: 'Soft Worm',
                    description: 'A soft plastic worm lure',
                    ingredients: [
                        { type: 'fish', id: 'catfish', quantity: 2 }
                    ],
                    cost: 500,
                    craftTime: 4,
                    result: {
                        id: 'soft_worm',
                        name: 'Soft Worm',
                        type: 'soft_plastic',
                        equipSlot: 'lure',
                        lureType: 'soft_plastic',
                        rarity: 2,
                        description: 'A soft plastic worm lure',
                        stats: {
                            biteRate: 30,
                            lureSuccess: 25,
                            lureDurability: 15,
                            lurePrecision: 8
                        },
                        unlockLevel: 3,
                        cost: 1000,
                        durability: 100,
                        condition: 100
                    }
                },
                {
                    id: 'fly_lure',
                    name: 'Fly Lure',
                    description: 'A delicate fly fishing lure',
                    ingredients: [
                        { type: 'fish', id: 'trout', quantity: 2 }
                    ],
                    cost: 700,
                    craftTime: 6,
                    result: {
                        id: 'fly_lure',
                        name: 'Fly Lure',
                        type: 'fly',
                        equipSlot: 'lure',
                        lureType: 'fly',
                        rarity: 3,
                        description: 'A delicate fly fishing lure',
                        stats: {
                            biteRate: 40,
                            lureSuccess: 35,
                            lureDurability: 20,
                            lurePrecision: 12
                        },
                        unlockLevel: 7,
                        cost: 1400,
                        durability: 120,
                        condition: 120
                    }
                },
                {
                    id: 'popper_lure',
                    name: 'Popper Lure',
                    description: 'A surface popping lure',
                    ingredients: [
                        { type: 'fish', id: 'pike', quantity: 2 }
                    ],
                    cost: 900,
                    craftTime: 8,
                    result: {
                        id: 'popper_lure',
                        name: 'Popper Lure',
                        type: 'popper',
                        equipSlot: 'lure',
                        lureType: 'popper',
                        rarity: 4,
                        description: 'A surface popping lure',
                        stats: {
                            biteRate: 50,
                            lureSuccess: 40,
                            lureDurability: 25,
                            lurePrecision: 15
                        },
                        unlockLevel: 12,
                        cost: 1800,
                        durability: 140,
                        condition: 140
                    }
                },
                {
                    id: 'spoon_lure',
                    name: 'Spoon Lure',
                    description: 'A metallic spoon lure',
                    ingredients: [
                        { type: 'fish', id: 'salmon', quantity: 2 }
                    ],
                    cost: 1100,
                    craftTime: 10,
                    result: {
                        id: 'spoon_lure',
                        name: 'Spoon Lure',
                        type: 'spoon',
                        equipSlot: 'lure',
                        lureType: 'spoon',
                        rarity: 5,
                        description: 'A metallic spoon lure',
                        stats: {
                            biteRate: 60,
                            lureSuccess: 50,
                            lureDurability: 30,
                            lurePrecision: 20
                        },
                        unlockLevel: 17,
                        cost: 2200,
                        durability: 160,
                        condition: 160
                    }
                }
            ],
            boats: [
                {
                    id: 'rowboat',
                    name: 'Rowboat',
                    description: 'A simple wooden rowboat',
                    ingredients: [
                        { type: 'fish', id: 'sardine', quantity: 3 }
                    ],
                    cost: 500,
                    craftTime: 5,
                    result: {
                        id: 'rowboat',
                        name: 'Rowboat',
                        type: 'boat',
                        equipSlot: 'boat',
                        rarity: 1,
                        description: 'A simple wooden rowboat',
                        stats: {
                            craftingEfficiency: 5,
                            autoFishingYield: 10,
                            fishDetection: 5,
                            hotspotStability: 5,
                            companionSlotCapacity: 1,
                            autoFishingEfficiency: 5,
                            boatDurability: 10,
                            fishtankStorage: 5
                        },
                        unlockLevel: 1,
                        cost: 1000,
                        durability: 200,
                        condition: 200
                    }
                },
                {
                    id: 'skiff',
                    name: 'Skiff',
                    description: 'A small motorized skiff',
                    ingredients: [
                        { type: 'fish', id: 'bass', quantity: 3 }
                    ],
                    cost: 1000,
                    craftTime: 7,
                    result: {
                        id: 'skiff',
                        name: 'Skiff',
                        type: 'boat',
                        equipSlot: 'boat',
                        rarity: 2,
                        description: 'A small motorized skiff',
                        stats: {
                            craftingEfficiency: 10,
                            autoFishingYield: 15,
                            fishDetection: 8,
                            hotspotStability: 8,
                            companionSlotCapacity: 2,
                            autoFishingEfficiency: 10,
                            boatDurability: 15,
                            fishtankStorage: 8
                        },
                        unlockLevel: 5,
                        cost: 2000,
                        durability: 250,
                        condition: 250
                    }
                }
            ],
            clothing: [
                {
                    id: 'fishers_cap',
                    name: "Fisher's Cap",
                    description: 'A practical fishing cap',
                    ingredients: [
                        { type: 'fish', id: 'trout', quantity: 2 }
                    ],
                    cost: 400,
                    craftTime: 3,
                    result: {
                        id: 'fishers_cap',
                        name: "Fisher's Cap",
                        type: 'clothing',
                        equipSlot: 'head',
                        rarity: 1,
                        description: 'A practical fishing cap',
                        stats: {
                            energy: 5,
                            castAccuracy: 3,
                            qtePrecision: 2
                        },
                        unlockLevel: 1,
                        cost: 800,
                        durability: 100,
                        condition: 100
                    }
                },
                {
                    id: 'sunglasses',
                    name: 'Sunglasses',
                    description: 'Stylish fishing sunglasses',
                    ingredients: [
                        { type: 'fish', id: 'pike', quantity: 2 }
                    ],
                    cost: 600,
                    craftTime: 5,
                    result: {
                        id: 'sunglasses',
                        name: 'Sunglasses',
                        type: 'clothing',
                        equipSlot: 'head',
                        rarity: 2,
                        description: 'Stylish fishing sunglasses',
                        stats: {
                            fishDetection: 8,
                            rareFishChance: 5,
                            qtePrecision: 5
                        },
                        unlockLevel: 3,
                        cost: 1200,
                        durability: 120,
                        condition: 120
                    }
                }
            ]
        };
    }

    /**
     * Get all available recipes for a category
     * @param {string} category - Recipe category (rods, lures, boats, clothing)
     * @returns {Array} - Array of recipes
     */
    getRecipes(category = null) {
        try {
            if (!this.recipes) {
                console.warn('CraftingManager: No recipes loaded');
                return [];
            }
            
            if (category) {
                return this.recipes[category] || [];
            }
            return this.recipes;
        } catch (error) {
            console.error('CraftingManager: Error getting recipes:', error);
            return category ? [] : {};
        }
    }

    /**
     * Get a specific recipe by ID
     * @param {string} recipeId - Recipe ID
     * @returns {Object|null} - Recipe object or null
     */
    getRecipe(recipeId) {
        try {
            if (!this.recipes || !recipeId) {
                console.warn('CraftingManager: No recipes loaded or invalid recipe ID');
                return null;
            }
            
            for (const category in this.recipes) {
                const categoryRecipes = this.recipes[category];
                if (Array.isArray(categoryRecipes)) {
                    const recipe = categoryRecipes.find(r => r && r.id === recipeId);
                    if (recipe) return recipe;
                }
            }
            return null;
        } catch (error) {
            console.error('CraftingManager: Error getting recipe:', error);
            return null;
        }
    }

    /**
     * Check if player can craft a recipe
     * @param {string} recipeId - Recipe ID
     * @returns {Object} - Validation result
     */
    canCraft(recipeId) {
        try {
            const recipe = this.getRecipe(recipeId);
            if (!recipe) {
                return { canCraft: false, reason: 'Recipe not found' };
            }

            // Check player level
            if (recipe.result && recipe.result.unlockLevel && this.gameState.player.level < recipe.result.unlockLevel) {
                return { 
                    canCraft: false, 
                    reason: `Requires level ${recipe.result.unlockLevel} (current: ${this.gameState.player.level})` 
                };
            }

            // Check coins
            if (this.gameState.player.money < recipe.cost) {
                return { 
                    canCraft: false, 
                    reason: `Insufficient coins (need ${recipe.cost}, have ${this.gameState.player.money})` 
                };
            }

            // Check ingredients
            const missingIngredients = [];
            if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
                for (const ingredient of recipe.ingredients) {
                    if (!ingredient) continue; // Skip invalid ingredients
                    
                    const available = this.getAvailableIngredient(ingredient);
                    if (available < ingredient.quantity) {
                        missingIngredients.push({
                            ...ingredient,
                            available,
                            needed: ingredient.quantity
                        });
                    }
                }
            }

            if (missingIngredients.length > 0) {
                return {
                    canCraft: false,
                    reason: 'Missing ingredients',
                    missingIngredients
                };
            }

            return { canCraft: true };
        } catch (error) {
            console.error('CraftingManager: Error checking if can craft:', error);
            return { canCraft: false, reason: 'Error checking craft requirements' };
        }
    }

    /**
     * Get available quantity of an ingredient
     * @param {Object} ingredient - Ingredient specification
     * @returns {number} - Available quantity
     */
    getAvailableIngredient(ingredient) {
        try {
            if (!ingredient || !ingredient.type || !ingredient.id) {
                console.warn('CraftingManager: Invalid ingredient:', ingredient);
                return 0;
            }
            
            console.log(`CraftingManager: Looking for ingredient type: ${ingredient.type}, id: ${ingredient.id}`);
            
            if (ingredient.type === 'fish') {
                // Count fish cards in inventory
                const fishCards = this.gameState.inventory.fish || [];
                console.log(`CraftingManager: Fish inventory has ${fishCards.length} cards`);
                
                // Try multiple matching strategies for fish
                const matchingCards = fishCards.filter(card => {
                    if (!card) return false;
                    
                    // Strategy 1: Direct ID match
                    if (card.id === ingredient.id) {
                        console.log(`CraftingManager: Direct ID match found: ${card.name}`);
                        return true;
                    }
                    
                    // Strategy 2: fishId match (for fish cards that have both id and fishId)
                    if (card.fishId === ingredient.id) {
                        console.log(`CraftingManager: fishId match found: ${card.name} (fishId: ${card.fishId})`);
                        return true;
                    }
                    
                    // Strategy 3: Name-based match (case insensitive)
                    if (card.name && card.name.toLowerCase() === ingredient.id.toLowerCase()) {
                        console.log(`CraftingManager: Name match found: ${card.name}`);
                        return true;
                    }
                    
                    // Strategy 4: Name contains the ingredient id
                    if (card.name && card.name.toLowerCase().includes(ingredient.id.toLowerCase())) {
                        console.log(`CraftingManager: Name contains match found: ${card.name}`);
                        return true;
                    }
                    
                    console.log(`CraftingManager: No match for card - id: ${card.id}, fishId: ${card.fishId}, name: ${card.name}`);
                    return false;
                });
                
                const total = matchingCards.reduce((total, card) => total + (card.quantity || 1), 0);
                console.log(`CraftingManager: Found ${matchingCards.length} matching cards with total quantity: ${total}`);
                return total;
            } else if (ingredient.type === 'equipment') {
                // Count equipment items
                for (const category of ['rods', 'lures', 'boats', 'clothing']) {
                    const items = this.gameState.inventory[category] || [];
                    const matchingItems = items.filter(item => item && item.id === ingredient.id && !item.equipped);
                    if (matchingItems.length > 0) {
                        return matchingItems.reduce((total, item) => total + (item.quantity || 1), 0);
                    }
                }
            }
            return 0;
        } catch (error) {
            console.error('CraftingManager: Error getting available ingredient:', error);
            return 0;
        }
    }

    /**
     * Start crafting a recipe
     * @param {string} recipeId - Recipe ID
     * @returns {Object} - Crafting result
     */
    startCrafting(recipeId) {
        try {
            const validation = this.canCraft(recipeId);
            if (!validation.canCraft) {
                return { success: false, reason: validation.reason, missingIngredients: validation.missingIngredients };
            }

            const recipe = this.getRecipe(recipeId);
            if (!recipe) {
                return { success: false, reason: 'Recipe not found' };
            }
            
            // Consume ingredients
            if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
                for (const ingredient of recipe.ingredients) {
                    if (!ingredient) continue; // Skip invalid ingredients
                    
                    if (!this.consumeIngredient(ingredient)) {
                        return { success: false, reason: `Failed to consume ${ingredient.id}` };
                    }
                }
            }

            // Consume coins
            this.gameState.player.money -= recipe.cost;

            // Add to crafting queue
            const craftingItem = {
                id: Date.now().toString(),
                recipeId: recipe.id,
                recipe: recipe,
                startTime: Date.now(),
                endTime: Date.now() + (recipe.craftTime * 60 * 1000), // Convert minutes to milliseconds
                completed: false
            };

            this.craftingQueue.push(craftingItem);
            this.gameState.markDirty();

            this.emit('craftingStarted', { craftingItem, recipe });
            
            return { 
                success: true, 
                craftingItem,
                timeRemaining: recipe.craftTime * 60 * 1000
            };
        } catch (error) {
            console.error('CraftingManager: Error starting crafting:', error);
            return { success: false, reason: 'Error starting crafting process' };
        }
    }

    /**
     * Consume an ingredient from inventory
     * @param {Object} ingredient - Ingredient specification
     * @returns {boolean} - Success status
     */
    consumeIngredient(ingredient) {
        if (ingredient.type === 'fish') {
            // Remove fish cards
            let remaining = ingredient.quantity;
            const fishCards = this.gameState.inventory.fish || [];
            
            console.log(`CraftingManager: Consuming ${ingredient.quantity} ${ingredient.id} fish`);
            console.log(`CraftingManager: Fish inventory before consumption:`, fishCards.map(f => ({ id: f.id, fishId: f.fishId, name: f.name, quantity: f.quantity })));
            
            for (let i = fishCards.length - 1; i >= 0 && remaining > 0; i--) {
                const card = fishCards[i];
                
                // Use the same matching logic as getAvailableIngredient
                let isMatch = false;
                
                // Strategy 1: Direct ID match
                if (card.id === ingredient.id) {
                    isMatch = true;
                }
                // Strategy 2: fishId match
                else if (card.fishId === ingredient.id) {
                    isMatch = true;
                }
                // Strategy 3: Name-based match (case insensitive)
                else if (card.name && card.name.toLowerCase() === ingredient.id.toLowerCase()) {
                    isMatch = true;
                }
                // Strategy 4: Name contains the ingredient id
                else if (card.name && card.name.toLowerCase().includes(ingredient.id.toLowerCase())) {
                    isMatch = true;
                }
                
                if (isMatch) {
                    const removeQuantity = Math.min(remaining, card.quantity || 1);
                    console.log(`CraftingManager: Removing ${removeQuantity} from ${card.name} (had ${card.quantity || 1})`);
                    this.inventoryManager.removeItem('fish', card.id, removeQuantity);
                    remaining -= removeQuantity;
                }
            }
            
            console.log(`CraftingManager: Consumption complete, remaining needed: ${remaining}`);
            return remaining === 0;
        } else if (ingredient.type === 'equipment') {
            // Remove equipment items
            let remaining = ingredient.quantity;
            
            for (const category of ['rods', 'lures', 'boats', 'clothing']) {
                const items = this.gameState.inventory[category] || [];
                for (let i = items.length - 1; i >= 0 && remaining > 0; i--) {
                    const item = items[i];
                    if (item.id === ingredient.id && !item.equipped) {
                        const removeQuantity = Math.min(remaining, item.quantity || 1);
                        this.inventoryManager.removeItem(category, item.id, removeQuantity);
                        remaining -= removeQuantity;
                    }
                }
            }
            
            return remaining === 0;
        }
        
        return false;
    }

    /**
     * Complete a crafting item
     * @param {string} craftingId - Crafting item ID
     * @returns {boolean} - Success status
     */
    completeCrafting(craftingId) {
        const craftingIndex = this.craftingQueue.findIndex(item => item.id === craftingId);
        if (craftingIndex === -1) {
            return false;
        }

        const craftingItem = this.craftingQueue[craftingIndex];
        const recipe = craftingItem.recipe;

        // Determine result category
        const resultCategory = this.getResultCategory(recipe.result.type);
        
        // Add result to inventory
        const success = this.inventoryManager.addItem(resultCategory, recipe.result);
        
        if (success) {
            // Remove from crafting queue
            this.craftingQueue.splice(craftingIndex, 1);
            this.gameState.markDirty();
            
            this.emit('craftingCompleted', { craftingItem, recipe, result: recipe.result });
            return true;
        }
        
        return false;
    }

    /**
     * Get the inventory category for a result type
     * @param {string} type - Result type
     * @returns {string} - Inventory category
     */
    getResultCategory(type) {
        const categoryMap = {
            'rod': 'rods',
            'lure': 'lures',
            'boat': 'boats',
            'clothing': 'clothing'
        };
        return categoryMap[type] || 'materials';
    }

    /**
     * Get current crafting queue
     * @returns {Array} - Crafting queue
     */
    getCraftingQueue() {
        return [...this.craftingQueue];
    }

    /**
     * Get completed crafting items ready for collection
     * @returns {Array} - Completed crafting items
     */
    getCompletedCrafting() {
        const now = Date.now();
        return this.craftingQueue.filter(item => !item.completed && now >= item.endTime);
    }

    /**
     * Start the crafting timer to check for completed items
     */
    startCraftingTimer() {
        setInterval(() => {
            const completed = this.getCompletedCrafting();
            completed.forEach(item => {
                item.completed = true;
                this.emit('craftingReady', { craftingItem: item, recipe: item.recipe });
            });
        }, 1000); // Check every second
    }

    /**
     * Instantly complete a crafting item (for premium features)
     * @param {string} craftingId - Crafting item ID
     * @param {boolean} useGems - Whether to use gems for instant completion
     * @returns {Object} - Result
     */
    instantComplete(craftingId, useGems = false) {
        const craftingIndex = this.craftingQueue.findIndex(item => item.id === craftingId);
        if (craftingIndex === -1) {
            return { success: false, reason: 'Crafting item not found' };
        }

        const craftingItem = this.craftingQueue[craftingIndex];
        const timeRemaining = Math.max(0, craftingItem.endTime - Date.now());
        
        if (timeRemaining === 0) {
            // Already completed
            return this.completeCrafting(craftingId) ? 
                { success: true, reason: 'Already completed' } : 
                { success: false, reason: 'Failed to complete' };
        }

        if (useGems) {
            // Calculate gem cost (1 gem per minute remaining)
            const minutesRemaining = Math.ceil(timeRemaining / (60 * 1000));
            const gemCost = minutesRemaining;
            
            if (this.gameState.player.gems < gemCost) {
                return { 
                    success: false, 
                    reason: `Insufficient gems (need ${gemCost}, have ${this.gameState.player.gems})` 
                };
            }
            
            // Consume gems and complete instantly
            this.gameState.player.gems -= gemCost;
            craftingItem.endTime = Date.now();
            craftingItem.completed = true;
            
            this.gameState.markDirty();
            this.emit('craftingInstantCompleted', { craftingItem, gemCost });
            
            return { success: true, gemCost };
        }
        
        return { success: false, reason: 'Instant completion requires gems' };
    }

    /**
     * Cancel a crafting item and refund resources
     * @param {string} craftingId - Crafting item ID
     * @param {number} refundPercentage - Percentage of resources to refund (0-1)
     * @returns {Object} - Result
     */
    cancelCrafting(craftingId, refundPercentage = 0.5) {
        const craftingIndex = this.craftingQueue.findIndex(item => item.id === craftingId);
        if (craftingIndex === -1) {
            return { success: false, reason: 'Crafting item not found' };
        }

        const craftingItem = this.craftingQueue[craftingIndex];
        const recipe = craftingItem.recipe;
        
        // Refund coins
        const coinRefund = Math.floor(recipe.cost * refundPercentage);
        this.gameState.player.money += coinRefund;
        
        // Refund ingredients (partial)
        const refundedIngredients = [];
        for (const ingredient of recipe.ingredients) {
            const refundQuantity = Math.floor(ingredient.quantity * refundPercentage);
            if (refundQuantity > 0) {
                if (ingredient.type === 'fish') {
                    // Create fish card data
                    const fishData = { id: ingredient.id, name: ingredient.id };
                    this.inventoryManager.addItem('fish', fishData, refundQuantity);
                }
                refundedIngredients.push({ ...ingredient, quantity: refundQuantity });
            }
        }
        
        // Remove from crafting queue
        this.craftingQueue.splice(craftingIndex, 1);
        this.gameState.markDirty();
        
        this.emit('craftingCancelled', { 
            craftingItem, 
            recipe, 
            coinRefund, 
            refundedIngredients 
        });
        
        return { 
            success: true, 
            coinRefund, 
            refundedIngredients 
        };
    }

    /**
     * Event system
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    off(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in crafting event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Save crafting state
     */
    save() {
        return {
            craftingQueue: this.craftingQueue
        };
    }

    /**
     * Load crafting state
     */
    load(data) {
        if (data && data.craftingQueue) {
            this.craftingQueue = data.craftingQueue;
        }
    }

    /**
     * Destroy the crafting manager
     */
    destroy() {
        this.eventListeners = {};
        this.craftingQueue = [];
    }
}

export default CraftingManager; 