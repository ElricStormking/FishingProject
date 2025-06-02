import InventoryValidator from './InventoryValidator.js';
import { gameDataLoader } from './DataLoader.js';

export class InventoryManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.validator = new InventoryValidator();
        this.eventListeners = {};
        
        // Initialize player stats for consumables if they don't exist
        this.initializePlayerStats();
        
        // Set up periodic cleanup of expired boosts
        this.setupBoostCleanup();
    }

    /**
     * Initialize player stats needed for consumables
     */
    initializePlayerStats() {
        try {
            const player = this.gameState.player;
            
            // Initialize energy system
            if (player.energy === undefined) {
                player.energy = 100;
            }
            if (player.maxEnergy === undefined) {
                player.maxEnergy = 100;
            }
            
            // Initialize health system
            if (player.health === undefined) {
                player.health = 100;
            }
            if (player.maxHealth === undefined) {
                player.maxHealth = 100;
            }
            
            // Initialize temporary boosts
            if (!player.temporaryBoosts) {
                player.temporaryBoosts = {};
            }
            
            console.log('InventoryManager: Player stats initialized for consumables');
        } catch (error) {
            console.error('InventoryManager: Error initializing player stats:', error);
        }
    }

    /**
     * Set up periodic cleanup of expired temporary boosts
     */
    setupBoostCleanup() {
        try {
            // Clean up expired boosts every 30 seconds
            // Note: We'll set this up later when a scene is available
            console.log('InventoryManager: Boost cleanup setup deferred until scene is available');
        } catch (error) {
            console.error('InventoryManager: Error setting up boost cleanup:', error);
        }
    }

    /**
     * Add an item to inventory
     * @param {string} category - Item category
     * @param {object} itemData - Item data
     * @param {number} quantity - Quantity to add (for stackable items)
     * @returns {boolean} - Success status
     */
    addItem(category, itemData, quantity = 1) {
        try {
            // Validate inputs
            if (!category || typeof category !== 'string') {
                console.error('InventoryManager: Invalid category provided:', category);
                return false;
            }
            
            if (!itemData || typeof itemData !== 'object') {
                console.error('InventoryManager: Invalid item data provided:', itemData);
                return false;
            }
            
            // Create category if it doesn't exist
            if (!this.gameState.inventory[category]) {
                console.log(`InventoryManager: Creating new category: ${category}`);
                this.gameState.inventory[category] = [];
            }

            console.log(`InventoryManager: Adding item to ${category}:`, itemData);

            // Special handling for fish items to ensure proper structure
            let processedItemData = itemData;
            if (category === 'fish') {
                processedItemData = {
                    id: itemData.id || `fish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    fishId: itemData.fishId || 'unknown',
                    name: (itemData.name && typeof itemData.name === 'string') ? itemData.name.trim() : 'Unknown Fish',
                    rarity: Math.min(Math.max(1, parseInt(itemData.rarity) || 1), 6),
                    weight: Math.max(0.1, parseFloat(itemData.weight) || 1.0),
                    value: Math.max(1, parseInt(itemData.value) || 100),
                    description: (itemData.description && typeof itemData.description === 'string') ? 
                        itemData.description : `A fish weighing ${Math.max(0.1, parseFloat(itemData.weight) || 1.0).toFixed(1)}kg`,
                    caughtAt: itemData.caughtAt || new Date().toISOString(),
                    quantity: Math.max(1, parseInt(quantity) || 1),
                    owned: true,
                    ...itemData // Spread original data to preserve any additional properties
                };
                
                console.log('InventoryManager: Processed fish data:', processedItemData);
            }

            // Create proper item structure
            const item = this.validator.createItem(category, processedItemData);
            
            console.log(`InventoryManager: Item after createItem:`, item);
            
            // Validate item
            const validation = this.validator.validateItem(category, item);
            if (!validation.valid) {
                console.error(`Invalid item for category ${category}:`, validation.errors);
                console.error(`Item data:`, item);
                console.error(`Original item data:`, itemData);
                
                // For fish, try to proceed with a more lenient validation
                if (category === 'fish') {
                    console.warn('InventoryManager: Fish validation failed, but proceeding with corrected data');
                    // Continue execution for fish items even if validation fails
                } else {
                    return false;
                }
            }

            // Check if stackable and item already exists
            if (this.validator.isStackable(category)) {
                const existingItem = this.findItem(category, item.id);
                if (existingItem) {
                    const maxStack = this.validator.getMaxStackSize();
                    const newQuantity = Math.min(existingItem.quantity + quantity, maxStack);
                    const actualAdded = newQuantity - existingItem.quantity;
                    
                    existingItem.quantity = newQuantity;
                    this.gameState.markDirty();
                    this.emit('itemAdded', { category, item: existingItem, quantity: actualAdded });
                    
                    console.log(`InventoryManager: Added ${actualAdded} to existing stack of ${item.id}`);
                    return actualAdded > 0;
                }
            }

            // Check category limits
            const limit = this.validator.getCategoryLimit(category);
            if (this.gameState.inventory[category].length >= limit) {
                console.error(`Category ${category} is full (${limit} items max)`);
                return false;
            }

            // Set quantity for stackable items
            if (this.validator.isStackable(category)) {
                item.quantity = Math.min(quantity, this.validator.getMaxStackSize());
            }

            // Add item to inventory
            item.owned = true;
            this.gameState.inventory[category].push(item);
            this.gameState.markDirty();
            
            console.log(`InventoryManager: Successfully added ${item.name} to ${category}`);
            this.emit('itemAdded', { category, item, quantity: item.quantity || 1 });
            return true;

        } catch (error) {
            console.error('InventoryManager: Error adding item:', error);
            console.error('InventoryManager: Error stack:', error.stack);
            console.error('InventoryManager: Category:', category);
            console.error('InventoryManager: Item data:', itemData);
            console.error('InventoryManager: Quantity:', quantity);
            
            // For fish items, try a fallback approach
            if (category === 'fish' && itemData) {
                console.warn('InventoryManager: Attempting fallback fish item creation');
                try {
                    const fallbackFish = {
                        id: `fish_fallback_${Date.now()}`,
                        fishId: 'unknown',
                        name: 'Unknown Fish',
                        rarity: 1,
                        weight: 1.0,
                        value: 100,
                        description: 'A fish that was caught',
                        caughtAt: new Date().toISOString(),
                        quantity: 1,
                        owned: true
                    };
                    
                    this.gameState.inventory[category].push(fallbackFish);
                    this.gameState.markDirty();
                    console.log('InventoryManager: Fallback fish item created successfully');
                    this.emit('itemAdded', { category, item: fallbackFish, quantity: 1 });
                    return true;
                } catch (fallbackError) {
                    console.error('InventoryManager: Fallback fish creation also failed:', fallbackError);
                }
            }
            
            return false;
        }
    }

    /**
     * Remove an item from inventory
     * @param {string} category - Item category
     * @param {string} itemId - Item ID
     * @param {number} quantity - Quantity to remove
     * @returns {boolean} - Success status
     */
    removeItem(category, itemId, quantity = 1) {
        try {
            const items = this.gameState.inventory[category];
            const itemIndex = items.findIndex(item => item.id === itemId);
            
            if (itemIndex === -1) {
                console.error(`Item ${itemId} not found in ${category}`);
                return false;
            }

            const item = items[itemIndex];
            
            // Handle stackable items
            if (this.validator.isStackable(category) && item.quantity > 1) {
                const removeQuantity = Math.min(quantity, item.quantity);
                item.quantity -= removeQuantity;
                
                if (item.quantity <= 0) {
                    // Unequip if equipped
                    if (item.equipped) {
                        this.unequipItem(category, itemId);
                    }
                    items.splice(itemIndex, 1);
                }
                
                this.gameState.markDirty();
                this.emit('itemRemoved', { category, itemId, quantity: removeQuantity });
                return true;
            } else {
                // Unequip if equipped
                if (item.equipped) {
                    this.unequipItem(category, itemId);
                }
                
                items.splice(itemIndex, 1);
                this.gameState.markDirty();
                this.emit('itemRemoved', { category, itemId, quantity: 1 });
                return true;
            }

        } catch (error) {
            console.error('Error removing item:', error);
            return false;
        }
    }

    /**
     * Equip an item
     * @param {string} category - Item category
     * @param {string} itemId - Item ID
     * @returns {boolean} - Success status
     */
    equipItem(category, itemId) {
        try {
            const items = this.gameState.inventory[category];
            const item = items.find(item => item.id === itemId);
            
            if (!item) {
                console.error(`Item ${itemId} not found in ${category}`);
                return false;
            }

            // Check if item can be equipped
            const maxEquipped = this.validator.getMaxEquipped(category);
            if (maxEquipped === 0) {
                console.error(`Items in category ${category} cannot be equipped`);
                return false;
            }

            // Check level requirements
            if (item.unlockLevel && this.gameState.player.level < item.unlockLevel) {
                console.error(`Player level ${this.gameState.player.level} too low for ${item.name} (requires ${item.unlockLevel})`);
                return false;
            }

            // For clothing, unequip other items in the same slot
            if (category === 'clothing' && item.slotType) {
                items.forEach(otherItem => {
                    if (otherItem.equipped && otherItem.slotType === item.slotType && otherItem.id !== itemId) {
                        otherItem.equipped = false;
                        this.emit('itemUnequipped', { category, item: otherItem });
                    }
                });
            } else if (maxEquipped === 1) {
                // Unequip other items if single-slot category (non-clothing)
                items.forEach(otherItem => {
                    if (otherItem.equipped && otherItem.id !== itemId) {
                        otherItem.equipped = false;
                        this.emit('itemUnequipped', { category, item: otherItem });
                    }
                });
            } else {
                // Check if we're at the equipment limit
                const equippedCount = items.filter(item => item.equipped).length;
                if (equippedCount >= maxEquipped && !item.equipped) {
                    console.error(`Cannot equip more than ${maxEquipped} items in ${category}`);
                    return false;
                }
            }

            item.equipped = true;
            this.gameState.markDirty();
            this.emit('itemEquipped', { category, item });
            this.emit('equipmentChanged', { action: 'equipped', category, item });
            return true;

        } catch (error) {
            console.error('Error equipping item:', error);
            return false;
        }
    }

    /**
     * Unequip an item
     * @param {string} category - Item category
     * @param {string} itemId - Item ID
     * @returns {boolean} - Success status
     */
    unequipItem(category, itemId) {
        try {
            const items = this.gameState.inventory[category];
            const item = items.find(item => item.id === itemId);
            
            if (!item) {
                console.error(`Item ${itemId} not found in ${category}`);
                return false;
            }

            if (!item.equipped) {
                console.warn(`Item ${itemId} is not equipped`);
                return false;
            }

            item.equipped = false;
            this.gameState.markDirty();
            this.emit('itemUnequipped', { category, item });
            this.emit('equipmentChanged', { action: 'unequipped', category, item });
            return true;

        } catch (error) {
            console.error('Error unequipping item:', error);
            return false;
        }
    }

    /**
     * Find an item in inventory
     * @param {string} category - Item category
     * @param {string} itemId - Item ID
     * @returns {object|null} - Found item or null
     */
    findItem(category, itemId) {
        return this.gameState.inventory[category]?.find(item => item.id === itemId) || null;
    }

    /**
     * Get all equipped items
     * @param {string} category - Optional category filter
     * @returns {object} - Equipped items by category
     */
    getEquippedItems(category = null) {
        const equipped = {};
        
        const categories = category ? [category] : Object.keys(this.gameState.inventory);
        
        for (const cat of categories) {
            // Ensure category exists before trying to filter
            if (this.gameState.inventory[cat]) {
            equipped[cat] = this.gameState.inventory[cat].filter(item => item.equipped);
            } else {
                console.warn(`InventoryManager: Category ${cat} does not exist in inventory`);
                equipped[cat] = [];
            }
        }
        
        return category ? equipped[category] : equipped;
    }

    /**
     * Search items by name or description
     * @param {string} query - Search query
     * @param {string} category - Optional category filter
     * @returns {array} - Matching items
     */
    searchItems(query, category = null) {
        const results = [];
        const searchTerm = query.toLowerCase();
        
        const categories = category ? [category] : Object.keys(this.gameState.inventory);
        
        for (const cat of categories) {
            const items = this.gameState.inventory[cat].filter(item => 
                item.name.toLowerCase().includes(searchTerm) ||
                item.description.toLowerCase().includes(searchTerm) ||
                item.id.toLowerCase().includes(searchTerm)
            );
            
            results.push(...items.map(item => ({ ...item, category: cat })));
        }
        
        return results;
    }

    /**
     * Sort items in a category
     * @param {string} category - Item category
     * @param {string} sortBy - Sort field (name, rarity, level, etc.)
     * @param {boolean} ascending - Sort direction
     */
    sortItems(category, sortBy = 'name', ascending = true) {
        const items = this.gameState.inventory[category];
        if (!items) return;

        items.sort((a, b) => {
            let valueA = a[sortBy];
            let valueB = b[sortBy];
            
            // Handle string comparisons
            if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }
            
            let comparison = 0;
            if (valueA < valueB) comparison = -1;
            else if (valueA > valueB) comparison = 1;
            
            return ascending ? comparison : -comparison;
        });

        this.gameState.markDirty();
        this.emit('itemsSorted', { category, sortBy, ascending });
    }

    /**
     * Swap positions of two items
     * @param {string} category - Item category
     * @param {number} fromIndex - Source index
     * @param {number} toIndex - Target index
     */
    swapItems(category, fromIndex, toIndex) {
        const items = this.gameState.inventory[category];
        if (!items || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
            return false;
        }

        [items[fromIndex], items[toIndex]] = [items[toIndex], items[fromIndex]];
        this.gameState.markDirty();
        this.emit('itemsSwapped', { category, fromIndex, toIndex });
        return true;
    }

    /**
     * Get inventory statistics
     * @returns {object} - Inventory stats
     */
    getInventoryStats() {
        const stats = {
            totalItems: 0,
            totalValue: 0,
            categories: {}
        };

        for (const [category, items] of Object.entries(this.gameState.inventory)) {
            const categoryStats = {
                count: items.length,
                equipped: items.filter(item => item.equipped).length,
                totalQuantity: 0,
                totalValue: 0,
                limit: this.validator.getCategoryLimit(category)
            };

            for (const item of items) {
                const quantity = item.quantity || 1;
                categoryStats.totalQuantity += quantity;
                categoryStats.totalValue += (item.cost || 0) * quantity;
            }

            stats.categories[category] = categoryStats;
            stats.totalItems += categoryStats.totalQuantity;
            stats.totalValue += categoryStats.totalValue;
        }

        return stats;
    }

    /**
     * Validate entire inventory
     * @returns {object} - Validation result
     */
    validateInventory() {
        return this.validator.validateInventory(this.gameState.inventory);
    }

    /**
     * Save inventory to localStorage
     * @returns {boolean} - Success status
     */
    saveInventory() {
        try {
            const inventoryData = {
                inventory: this.gameState.inventory,
                timestamp: Date.now(),
                version: '1.0.0'
            };
            
            localStorage.setItem('luxuryAngler_inventory', JSON.stringify(inventoryData));
            return true;
        } catch (error) {
            console.error('Error saving inventory:', error);
            return false;
        }
    }

    /**
     * Load inventory from localStorage
     * @returns {boolean} - Success status
     */
    loadInventory() {
        try {
            const savedData = localStorage.getItem('luxuryAngler_inventory');
            if (!savedData) return false;

            const inventoryData = JSON.parse(savedData);
            
            // Validate loaded inventory
            const validation = this.validateInventory();
            if (!validation.valid) {
                console.warn('Loaded inventory has validation errors:', validation.errors);
            }

            this.gameState.inventory = inventoryData.inventory;
            this.gameState.markDirty();
            this.emit('inventoryLoaded', inventoryData);
            return true;
        } catch (error) {
            console.error('Error loading inventory:', error);
            return false;
        }
    }

    /**
     * Event system for inventory changes
     */
    on(event, callback) {
        try {
            if (!this.eventListeners[event]) {
                this.eventListeners[event] = [];
            }
            
            // Check if callback is valid
            if (typeof callback === 'function') {
                this.eventListeners[event].push(callback);
            } else {
                console.error('InventoryManager: Invalid callback provided for event:', event);
            }
        } catch (error) {
            console.error('InventoryManager: Error adding event listener:', error);
        }
    }

    off(event, callback) {
        try {
            if (this.eventListeners[event] && typeof callback === 'function') {
                this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
                
                // Clean up empty event arrays
                if (this.eventListeners[event].length === 0) {
                    delete this.eventListeners[event];
                }
            }
        } catch (error) {
            console.error('InventoryManager: Error removing event listener:', error);
        }
    }

    emit(event, data) {
        try {
            if (this.eventListeners[event]) {
                // Create a copy of the listeners array to prevent issues if listeners are modified during iteration
                const listeners = [...this.eventListeners[event]];
                
                listeners.forEach(callback => {
                    try {
                        if (typeof callback === 'function') {
                            callback(data);
                        }
                    } catch (callbackError) {
                        console.error('InventoryManager: Error in event callback for event:', event, callbackError);
                    }
                });
            }
        } catch (error) {
            console.error('InventoryManager: Error emitting event:', event, error);
        }
    }

    /**
     * Get combined stats from all equipped items
     * @returns {object} - Combined equipment stats
     */
    getEquipmentStats() {
        const combinedStats = {};
        const equipped = this.getEquippedItems();

        for (const [category, items] of Object.entries(equipped)) {
            for (const item of items) {
                if (item.stats) {
                    for (const [statName, statValue] of Object.entries(item.stats)) {
                        combinedStats[statName] = (combinedStats[statName] || 0) + statValue;
                    }
                }
            }
        }

        return combinedStats;
    }

    /**
     * Repair an item (restore condition)
     * @param {string} category - Item category
     * @param {string} itemId - Item ID
     * @param {number} repairAmount - Amount to repair (optional, defaults to full)
     * @returns {boolean} - Success status
     */
    repairItem(category, itemId, repairAmount = null) {
        const item = this.findItem(category, itemId);
        if (!item || !item.durability) return false;

        const maxRepair = item.durability - (item.condition || 0);
        const actualRepair = repairAmount ? Math.min(repairAmount, maxRepair) : maxRepair;
        
        item.condition = (item.condition || 0) + actualRepair;
        this.gameState.markDirty();
        this.emit('itemRepaired', { category, item, repairAmount: actualRepair });
        return true;
    }

    /**
     * Damage an item (reduce condition)
     * @param {string} category - Item category
     * @param {string} itemId - Item ID
     * @param {number} damageAmount - Damage amount
     * @returns {boolean} - Success status
     */
    damageItem(category, itemId, damageAmount) {
        const item = this.findItem(category, itemId);
        if (!item || !item.condition) return false;

        item.condition = Math.max(0, item.condition - damageAmount);
        this.gameState.markDirty();
        this.emit('itemDamaged', { category, item, damageAmount });
        
        // Auto-unequip if broken
        if (item.condition === 0 && item.equipped) {
            this.unequipItem(category, itemId);
        }
        
        return true;
    }

    /**
     * Add sample items for testing (development only)
     */
    addSampleItems() {
        console.log('InventoryManager: Adding sample items for testing');
        
        // Add sample lures - include all required properties: id, name, type, rarity, description, unlockLevel
        const sampleLures = [
            { 
                id: 'spoon_lure', 
                name: 'Spoon Lure', 
                type: 'spoon',
                rarity: 2, 
                description: 'Shiny spoon lure for medium fish',
                unlockLevel: 1
            },
            { 
                id: 'fly_lure', 
                name: 'Fly Lure', 
                type: 'fly',
                rarity: 2, 
                description: 'Perfect for surface fishing',
                unlockLevel: 1
            },
            { 
                id: 'deep_diver', 
                name: 'Deep Diver', 
                type: 'deep',
                rarity: 3, 
                description: 'Reaches deep waters',
                unlockLevel: 3
            }
        ];
        
        sampleLures.forEach(lure => {
            this.addItem('lures', lure);
        });
        
        // Add sample consumables - include all required properties: id, name, rarity, description, effect
        const sampleConsumables = [
            { 
                id: 'energy_drink', 
                name: 'Energy Drink', 
                rarity: 1, 
                description: 'Restores 25 energy',
                effect: { type: 'energy', value: 25 },
                quantity: 3
            },
            { 
                id: 'lucky_charm', 
                name: 'Lucky Charm', 
                rarity: 3, 
                description: 'Increases rare fish chance',
                effect: { type: 'rareFishChance', value: 15, duration: 300000 }, // 5 minutes
                quantity: 1
            },
            { 
                id: 'repair_kit', 
                name: 'Repair Kit', 
                rarity: 2, 
                description: 'Repairs damaged equipment',
                effect: { type: 'repair', value: 50 },
                quantity: 2
            },
            // New consumables for better testing
            {
                id: 'health_potion',
                name: 'Health Potion',
                rarity: 2,
                description: 'Restores 40 health points',
                effect: { type: 'health', value: 40 },
                quantity: 5
            },
            {
                id: 'experience_booster',
                name: 'XP Booster',
                rarity: 3,
                description: 'Double experience for 10 minutes',
                effect: { type: 'experienceMultiplier', value: 2, duration: 600000 }, // 10 minutes
                quantity: 2
            },
            {
                id: 'golden_lucky_coin',
                name: 'Golden Lucky Coin',
                rarity: 4,
                description: 'Increases all luck stats for 15 minutes',
                effect: { type: 'luck', value: 20, duration: 900000 }, // 15 minutes
                quantity: 1
            },
            {
                id: 'treasure_chest',
                name: 'Treasure Chest',
                rarity: 3,
                description: 'Contains 500 coins',
                effect: { type: 'money', value: 500 },
                quantity: 1
            },
            {
                id: 'super_energy_drink',
                name: 'Super Energy Drink',
                rarity: 3,
                description: 'Fully restores energy',
                effect: { type: 'energy', value: 100 },
                quantity: 1
            },
            {
                id: 'fishing_focus_pill',
                name: 'Fishing Focus Pill',
                rarity: 2,
                description: 'Boosts rare fish chance for 3 minutes',
                effect: { type: 'rareFishChance', value: 25, duration: 180000 }, // 3 minutes
                quantity: 4
            },
            {
                id: 'master_repair_kit',
                name: 'Master Repair Kit',
                rarity: 4,
                description: 'Completely repairs all equipment',
                effect: { type: 'repair', value: 100 },
                quantity: 1
            }
        ];
        
        sampleConsumables.forEach(consumable => {
            this.addItem('consumables', consumable);
        });
        
        // Add sample materials - include all required properties: id, name, rarity, description
        const sampleMaterials = [
            { 
                id: 'wood', 
                name: 'Wood', 
                rarity: 1, 
                description: 'Basic crafting material',
                quantity: 20
            },
            { 
                id: 'metal_scraps', 
                name: 'Metal Scraps', 
                rarity: 2, 
                description: 'Used for advanced crafting',
                quantity: 8
            },
            { 
                id: 'rare_gems', 
                name: 'Rare Gems', 
                rarity: 4, 
                description: 'Precious crafting component',
                quantity: 2
            },
            // Enhancement stones for Equipment Enhancement System (Priority 1.7)
            {
                id: 'basic_stone',
                name: 'Basic Enhancement Stone',
                rarity: 1,
                description: 'Basic stone for low-level enhancement',
                quantity: 10,
                successRate: 0.9,
                bonusMultiplier: 1.0
            },
            {
                id: 'advanced_stone',
                name: 'Advanced Enhancement Stone',
                rarity: 3,
                description: 'Advanced stone with higher bonus',
                quantity: 5,
                successRate: 0.7,
                bonusMultiplier: 1.2
            },
            {
                id: 'master_stone',
                name: 'Master Enhancement Stone',
                rarity: 5,
                description: 'Master stone for maximum enhancement',
                quantity: 2,
                successRate: 0.5,
                bonusMultiplier: 1.5
            },
            // Protection items
            {
                id: 'protection_scroll',
                name: 'Protection Scroll',
                rarity: 2,
                description: 'Prevents equipment destruction on failure',
                quantity: 3,
                preventBreak: true,
                preventDowngrade: false
            },
            {
                id: 'blessed_scroll',
                name: 'Blessed Scroll',
                rarity: 4,
                description: 'Prevents all failure penalties',
                quantity: 1,
                preventBreak: true,
                preventDowngrade: true
            }
        ];
        
        sampleMaterials.forEach(material => {
            this.addItem('materials', material);
        });
        
        // Add sample upgrades - include all required properties: id, name, rarity, description, effect
        const sampleUpgrades = [
            { 
                id: 'better_reel', 
                name: 'Better Reel', 
                rarity: 2, 
                description: 'Improves reel speed',
                effect: { type: 'reelSpeed', value: 10 }
            },
            { 
                id: 'lucky_hook', 
                name: 'Lucky Hook', 
                rarity: 3, 
                description: 'Increases bite rate',
                effect: { type: 'biteRate', value: 15 }
            }
        ];
        
        sampleUpgrades.forEach(upgrade => {
            this.addItem('upgrades', upgrade);
        });
        
        // Add sample rods - include all required properties: id, name, rarity, stats, description, unlockLevel
        const sampleRods = [
            {
                id: 'basic_rod',
                name: 'Basic Fishing Rod',
                rarity: 1,
                stats: { castAccuracy: 5, tensionStability: 3 },
                description: 'A simple fishing rod for beginners',
                unlockLevel: 1
            },
            {
                id: 'advanced_rod',
                name: 'Advanced Carbon Rod',
                rarity: 3,
                stats: { castAccuracy: 15, tensionStability: 12, rareFishChance: 5 },
                description: 'High-quality carbon fiber rod',
                unlockLevel: 5
            },
            {
                id: 'pro_rod',
                name: 'Professional Rod',
                rarity: 4,
                stats: { castAccuracy: 25, tensionStability: 20, rareFishChance: 10 },
                description: 'Professional grade fishing rod with premium components',
                unlockLevel: 8
            },
            {
                id: 'master_rod',
                name: 'Master Angler Rod',
                rarity: 5,
                stats: { castAccuracy: 35, tensionStability: 30, rareFishChance: 15, criticalCatch: 5 },
                description: 'The ultimate fishing rod for master anglers',
                unlockLevel: 12
            }
        ];
        
        sampleRods.forEach(rod => {
            this.addItem('rods', rod);
        });
        
        // Add more sample lures with different types
        const moreSampleLures = [
            { 
                id: 'spinner_lure', 
                name: 'Spinner Lure', 
                type: 'spinner',
                rarity: 2, 
                description: 'Rotating blade creates vibration and flash',
                unlockLevel: 2,
                stats: { attractionRadius: 10, vibration: 5 }
            },
            { 
                id: 'crankbait', 
                name: 'Crankbait', 
                type: 'crank',
                rarity: 3, 
                description: 'Dives deep and mimics injured fish',
                unlockLevel: 4,
                stats: { deepWater: 15, fishAttraction: 8 }
            },
            { 
                id: 'golden_spoon', 
                name: 'Golden Spoon', 
                type: 'spoon',
                rarity: 4, 
                description: 'Premium gold-plated spoon lure',
                unlockLevel: 6,
                stats: { flash: 20, rareFishChance: 8 }
            },
            { 
                id: 'legendary_fly', 
                name: 'Legendary Fly', 
                type: 'fly',
                rarity: 5, 
                description: 'Hand-crafted fly lure used by legendary anglers',
                unlockLevel: 10,
                stats: { precision: 25, rareFishChance: 12, surfaceLure: 30 }
            }
        ];
        
        moreSampleLures.forEach(lure => {
            this.addItem('lures', lure);
        });
        
        // Add sample clothing items
        const sampleClothing = [
            {
                id: 'basic_cap',
                name: 'Basic Cap',
                slotType: 'head',
                rarity: 1,
                stats: { sunProtection: 5 },
                description: 'Simple fishing cap for sun protection',
                unlockLevel: 1
            },
            {
                id: 'fishing_hat',
                name: 'Fishing Hat',
                slotType: 'head',
                rarity: 2,
                stats: { sunProtection: 10, luck: 2 },
                description: 'Professional fishing hat with lucky charms',
                unlockLevel: 3
            },
            {
                id: 'legendary_crown',
                name: 'Angler\'s Crown',
                slotType: 'head',
                rarity: 5,
                stats: { sunProtection: 25, luck: 10, rareFishChance: 15 },
                description: 'Crown of the legendary master angler',
                unlockLevel: 15
            },
            {
                id: 'casual_shirt',
                name: 'Casual Shirt',
                slotType: 'upper_body',
                rarity: 1,
                stats: { comfort: 5 },
                description: 'Comfortable casual fishing shirt',
                unlockLevel: 1
            },
            {
                id: 'fishing_vest',
                name: 'Fishing Vest',
                slotType: 'upper_body',
                rarity: 3,
                stats: { comfort: 15, storage: 20, waterResistant: 10 },
                description: 'Multi-pocket fishing vest with waterproof coating',
                unlockLevel: 5
            },
            {
                id: 'angler_jacket',
                name: 'Master Angler Jacket',
                slotType: 'upper_body',
                rarity: 4,
                stats: { comfort: 25, storage: 35, waterResistant: 20, luck: 5 },
                description: 'Premium jacket worn by professional anglers',
                unlockLevel: 10
            },
            {
                id: 'shorts',
                name: 'Fishing Shorts',
                slotType: 'lower_body',
                rarity: 1,
                stats: { mobility: 10 },
                description: 'Lightweight shorts for easy movement',
                unlockLevel: 1
            },
            {
                id: 'waders',
                name: 'Fishing Waders',
                slotType: 'lower_body',
                rarity: 3,
                stats: { mobility: 5, waterResistant: 30, deepWaterAccess: 20 },
                description: 'Waterproof waders for deep water fishing',
                unlockLevel: 6
            },
            {
                id: 'pro_pants',
                name: 'Professional Fishing Pants',
                slotType: 'lower_body',
                rarity: 4,
                stats: { mobility: 20, waterResistant: 15, storage: 10, comfort: 15 },
                description: 'High-tech fishing pants with multiple features',
                unlockLevel: 8
            }
        ];
        
        sampleClothing.forEach(clothing => {
            this.addItem('clothing', clothing);
        });
        
        // Add sample bikini assistants
        const sampleBikiniAssistants = [
            {
                id: 'miku_assistant',
                name: 'Miku',
                rarity: 3,
                stats: { fishingBonus: 15, luckBonus: 10, experienceBonus: 5 },
                description: 'Cheerful assistant who loves fishing and helps with catches',
                unlockLevel: 5,
                specialAbility: 'Increases rare fish chance by 10%'
            },
            {
                id: 'luna_assistant', 
                name: 'Luna',
                rarity: 4,
                stats: { fishingBonus: 25, luckBonus: 15, experienceBonus: 10, nightFishing: 20 },
                description: 'Mysterious night fishing expert with moon magic',
                unlockLevel: 8,
                specialAbility: 'Grants night fishing bonuses and moon-blessed catches'
            },
            {
                id: 'sakura_assistant',
                name: 'Sakura',
                rarity: 5,
                stats: { fishingBonus: 35, luckBonus: 25, experienceBonus: 20, rareFishChance: 15 },
                description: 'Legendary fishing master with cherry blossom powers',
                unlockLevel: 12,
                specialAbility: 'Master-level fishing assistance with legendary fish attraction'
            }
        ];
        
        sampleBikiniAssistants.forEach(assistant => {
            this.addItem('bikini_assistants', assistant);
        });
        
        console.log('InventoryManager: Sample items added successfully');
    }

    /**
     * Use a consumable item
     * @param {string} itemId - Item ID to use
     * @param {number} quantity - Quantity to use (default 1)
     * @returns {object} - Usage result with success status and effects applied
     */
    useConsumable(itemId, quantity = 1) {
        try {
            console.log(`InventoryManager: Starting useConsumable for ${itemId}, quantity: ${quantity}`);
            
            const item = this.findItem('consumables', itemId);
            console.log(`InventoryManager: Found item:`, item);
            
            if (!item) {
                console.error(`Consumable ${itemId} not found`);
                return { success: false, message: 'Item not found' };
            }

            // Check if we have enough quantity
            const availableQuantity = item.quantity || 1;
            console.log(`InventoryManager: Available quantity: ${availableQuantity}, needed: ${quantity}`);
            
            if (availableQuantity < quantity) {
                console.error(`Not enough ${item.name}. Have: ${availableQuantity}, Need: ${quantity}`);
                return { success: false, message: `Not enough ${item.name}` };
            }

            // Apply consumable effects FIRST
            console.log(`InventoryManager: Applying effects for ${item.name}`);
            const effectsApplied = this.applyConsumableEffects(item, quantity);
            console.log(`InventoryManager: Effects applied result:`, effectsApplied);
            
            if (!effectsApplied.success) {
                console.error(`InventoryManager: Failed to apply effects:`, effectsApplied);
                return effectsApplied;
            }

            // Remove the used quantity from inventory
            console.log(`InventoryManager: Removing ${quantity} ${item.name} from inventory`);
            const removeSuccess = this.removeItem('consumables', itemId, quantity);
            console.log(`InventoryManager: Remove item result:`, removeSuccess);
            
            if (!removeSuccess) {
                console.error(`Failed to remove ${quantity} ${item.name} from inventory`);
                return { success: false, message: 'Failed to update inventory' };
            }

            console.log(`Successfully used ${quantity} ${item.name}`);
            this.emit('consumableUsed', { 
                item: item, 
                quantity: quantity, 
                effects: effectsApplied.effects 
            });

            return { 
                success: true, 
                message: `Used ${quantity} ${item.name}`,
                effects: effectsApplied.effects
            };

        } catch (error) {
            console.error('InventoryManager: Error using consumable:', error);
            console.error('InventoryManager: Error stack:', error.stack);
            return { success: false, message: 'Error using item: ' + error.message };
        }
    }

    /**
     * Apply the effects of a consumable item
     * @param {object} item - Consumable item
     * @param {number} quantity - Quantity being used
     * @returns {object} - Effects application result
     */
    applyConsumableEffects(item, quantity) {
        try {
            console.log(`InventoryManager: Starting applyConsumableEffects for ${item.name}`);
            console.log(`InventoryManager: Item effect:`, item.effect);
            
            if (!item.effect) {
                console.warn(`Consumable ${item.name} has no effect defined`);
                return { success: false, message: 'No effect defined' };
            }

            const effect = item.effect;
            const totalValue = (effect.value || 0) * quantity;
            const appliedEffects = [];

            console.log(`Applying consumable effect: ${effect.type} with value ${totalValue}`);

            // Ensure player object exists
            if (!this.gameState.player) {
                console.error('InventoryManager: GameState player object not found');
                return { success: false, message: 'Player data not available' };
            }

            switch (effect.type) {
                case 'energy':
                    console.log('InventoryManager: Applying energy effect');
                    // Restore player energy
                    const currentEnergy = this.gameState.player.energy || 0;
                    const maxEnergy = this.gameState.player.maxEnergy || 100;
                    const newEnergy = Math.min(currentEnergy + totalValue, maxEnergy);
                    const actualEnergyGained = newEnergy - currentEnergy;
                    
                    this.gameState.player.energy = newEnergy;
                    console.log(`InventoryManager: Energy restored from ${currentEnergy} to ${newEnergy} (+${actualEnergyGained})`);
                    
                    appliedEffects.push({
                        type: 'energy',
                        value: actualEnergyGained,
                        message: `Restored ${actualEnergyGained} energy`
                    });
                    break;

                case 'health':
                    console.log('InventoryManager: Applying health effect');
                    // Restore player health
                    const currentHealth = this.gameState.player.health || 100;
                    const maxHealth = this.gameState.player.maxHealth || 100;
                    const newHealth = Math.min(currentHealth + totalValue, maxHealth);
                    const actualHealthGained = newHealth - currentHealth;
                    
                    this.gameState.player.health = newHealth;
                    console.log(`InventoryManager: Health restored from ${currentHealth} to ${newHealth} (+${actualHealthGained})`);
                    
                    appliedEffects.push({
                        type: 'health',
                        value: actualHealthGained,
                        message: `Restored ${actualHealthGained} health`
                    });
                    break;

                case 'rareFishChance':
                    console.log('InventoryManager: Applying rare fish chance boost');
                    // Apply temporary rare fish chance boost
                    const duration = effect.duration || 300000; // 5 minutes default
                    this.applyTemporaryBoost('rareFishChance', totalValue, duration);
                    appliedEffects.push({
                        type: 'rareFishChance',
                        value: totalValue,
                        duration: duration,
                        message: `+${totalValue}% rare fish chance for ${Math.floor(duration/60000)} minutes`
                    });
                    break;

                case 'experienceMultiplier':
                    console.log('InventoryManager: Applying experience multiplier');
                    // Apply temporary XP multiplier
                    const expDuration = effect.duration || 600000; // 10 minutes default
                    this.applyTemporaryBoost('experienceMultiplier', totalValue, expDuration);
                    appliedEffects.push({
                        type: 'experienceMultiplier',
                        value: totalValue,
                        duration: expDuration,
                        message: `${totalValue}x XP multiplier for ${Math.floor(expDuration/60000)} minutes`
                    });
                    break;

                case 'luck':
                    console.log('InventoryManager: Applying luck boost');
                    // Apply temporary luck boost
                    const luckDuration = effect.duration || 900000; // 15 minutes default
                    this.applyTemporaryBoost('luck', totalValue, luckDuration);
                    appliedEffects.push({
                        type: 'luck',
                        value: totalValue,
                        duration: luckDuration,
                        message: `+${totalValue} luck for ${Math.floor(luckDuration/60000)} minutes`
                    });
                    break;

                case 'repair':
                    console.log('InventoryManager: Applying repair effect');
                    // Repair equipment
                    const repairResult = this.repairEquipment(totalValue);
                    appliedEffects.push({
                        type: 'repair',
                        value: totalValue,
                        message: repairResult.message
                    });
                    break;

                case 'money':
                    console.log('InventoryManager: Applying money effect');
                    // Add money
                    const oldMoney = this.gameState.player.money || 0;
                    this.gameState.addMoney(totalValue);
                    const newMoney = this.gameState.player.money || 0;
                    console.log(`InventoryManager: Money increased from ${oldMoney} to ${newMoney} (+${totalValue})`);
                    
                    appliedEffects.push({
                        type: 'money',
                        value: totalValue,
                        message: `Gained ${totalValue} coins`
                    });
                    break;

                default:
                    console.warn(`Unknown consumable effect type: ${effect.type}`);
                    return { success: false, message: `Unknown effect: ${effect.type}` };
            }

            console.log(`InventoryManager: Applied effects:`, appliedEffects);
            this.gameState.markDirty();
            return { success: true, effects: appliedEffects };

        } catch (error) {
            console.error('InventoryManager: Error applying consumable effects:', error);
            console.error('InventoryManager: Effect details:', { item: item.name, effect: item.effect });
            return { success: false, message: 'Error applying effects: ' + error.message };
        }
    }

    /**
     * Apply temporary boost effect
     * @param {string} boostType - Type of boost
     * @param {number} value - Boost value
     * @param {number} duration - Duration in milliseconds
     */
    applyTemporaryBoost(boostType, value, duration) {
        try {
            // Initialize temporary boosts if not exists
            if (!this.gameState.player.temporaryBoosts) {
                this.gameState.player.temporaryBoosts = {};
            }

            const boosts = this.gameState.player.temporaryBoosts;
            const endTime = Date.now() + duration;

            // Stack or replace boost
            if (boosts[boostType]) {
                // If boost already exists, stack the values and extend duration
                boosts[boostType].value += value;
                boosts[boostType].endTime = Math.max(boosts[boostType].endTime, endTime);
            } else {
                boosts[boostType] = { value: value, endTime: endTime };
            }

            console.log(`Applied temporary boost: ${boostType} +${value} for ${duration}ms`);
            
            // Emit boost applied event
            this.emit('temporaryBoostApplied', { 
                boostType: boostType, 
                value: value, 
                duration: duration,
                endTime: endTime
            });

        } catch (error) {
            console.error('Error applying temporary boost:', error);
        }
    }

    /**
     * Repair equipment using repair kit value
     * @param {number} repairValue - Amount of repair to apply
     * @returns {object} - Repair result
     */
    repairEquipment(repairValue) {
        try {
            let totalRepaired = 0;
            let itemsRepaired = 0;

            // Get all equipped items that can be repaired
            const equipped = this.getEquippedItems();
            const repairableItems = [];

            for (const [category, items] of Object.entries(equipped)) {
                for (const item of items) {
                    if (item.durability && item.condition !== undefined && item.condition < item.durability) {
                        repairableItems.push({ category, item });
                    }
                }
            }

            if (repairableItems.length === 0) {
                return { message: 'No equipment needs repair' };
            }

            // Distribute repair value among damaged items
            const repairPerItem = Math.floor(repairValue / repairableItems.length);
            const remainder = repairValue % repairableItems.length;

            repairableItems.forEach((repairableItem, index) => {
                const { category, item } = repairableItem;
                let repairAmount = repairPerItem;
                
                // Give remainder to first items
                if (index < remainder) {
                    repairAmount += 1;
                }

                const oldCondition = item.condition;
                const maxRepair = item.durability - item.condition;
                const actualRepair = Math.min(repairAmount, maxRepair);
                
                item.condition += actualRepair;
                totalRepaired += actualRepair;
                
                if (actualRepair > 0) {
                    itemsRepaired++;
                    this.emit('itemRepaired', { 
                        category: category, 
                        item: item, 
                        repairAmount: actualRepair,
                        oldCondition: oldCondition,
                        newCondition: item.condition
                    });
                }
            });

            return { 
                message: `Repaired ${itemsRepaired} items (+${totalRepaired} total condition)`
            };

        } catch (error) {
            console.error('Error repairing equipment:', error);
            return { message: 'Error repairing equipment' };
        }
    }

    /**
     * Get active temporary boosts
     * @returns {object} - Active boosts
     */
    getActiveBoosts() {
        try {
            const now = Date.now();
            const boosts = this.gameState.player.temporaryBoosts || {};
            const activeBoosts = {};

            for (const [boostType, boost] of Object.entries(boosts)) {
                if (boost.endTime > now) {
                    activeBoosts[boostType] = {
                        value: boost.value,
                        timeRemaining: boost.endTime - now
                    };
                }
            }

            return activeBoosts;
        } catch (error) {
            console.error('Error getting active boosts:', error);
            return {};
        }
    }

    /**
     * Clean up expired temporary boosts
     */
    cleanupExpiredBoosts() {
        try {
            const now = Date.now();
            const boosts = this.gameState.player.temporaryBoosts || {};

            for (const [boostType, boost] of Object.entries(boosts)) {
                if (boost.endTime <= now) {
                    delete boosts[boostType];
                    this.emit('temporaryBoostExpired', { boostType: boostType });
                }
            }
        } catch (error) {
            console.error('Error cleaning up expired boosts:', error);
        }
    }
}

export default InventoryManager;