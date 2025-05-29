import InventoryValidator from './InventoryValidator.js';
import { gameDataLoader } from './DataLoader.js';

export class InventoryManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.validator = new InventoryValidator();
        this.eventListeners = {};
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
            // Validate category exists
            if (!this.gameState.inventory[category]) {
                console.error(`Invalid category: ${category}`);
                return false;
            }

            console.log(`InventoryManager: Adding item to ${category}:`, itemData);

            // Create proper item structure
            const item = this.validator.createItem(category, itemData);
            
            console.log(`InventoryManager: Item after createItem:`, item);
            
            // Validate item
            const validation = this.validator.validateItem(category, item);
            if (!validation.valid) {
                console.error(`Invalid item for category ${category}:`, validation.errors);
                console.error(`Item data:`, item);
                console.error(`Original item data:`, itemData);
                return false;
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
            console.error('Error adding item:', error);
            console.error('Category:', category);
            console.error('Item data:', itemData);
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

            // Unequip other items if single-slot category
            if (maxEquipped === 1) {
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
            equipped[cat] = this.gameState.inventory[cat].filter(item => item.equipped);
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
            this.eventListeners[event].forEach(callback => callback(data));
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
        
        // Add sample bait - include all required properties: id, name, rarity, description
        const sampleBait = [
            { 
                id: 'worms', 
                name: 'Earthworms', 
                rarity: 1, 
                description: 'Classic fishing bait',
                quantity: 10
            },
            { 
                id: 'minnows', 
                name: 'Live Minnows', 
                rarity: 2, 
                description: 'Live bait for bigger fish',
                quantity: 5
            },
            { 
                id: 'corn', 
                name: 'Sweet Corn', 
                rarity: 1, 
                description: 'Cheap and effective',
                quantity: 15
            }
        ];
        
        sampleBait.forEach(bait => {
            this.addItem('bait', bait);
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
                effect: { type: 'rareFishChance', value: 15 },
                quantity: 1
            },
            { 
                id: 'repair_kit', 
                name: 'Repair Kit', 
                rarity: 2, 
                description: 'Repairs damaged equipment',
                effect: { type: 'repair', value: 50 },
                quantity: 2
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
            }
        ];
        
        sampleRods.forEach(rod => {
            this.addItem('rods', rod);
        });
        
        console.log('InventoryManager: Sample items added successfully');
    }
}

export default InventoryManager; 