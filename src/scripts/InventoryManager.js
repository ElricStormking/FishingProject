import { gameDataLoader } from './DataLoader.js';
import { InventoryValidator } from './InventoryValidator.js';

export class InventoryManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.eventListeners = new Map();
        
        // Initialize validator with gameState
        this.validator = new InventoryValidator(gameState);
        
        // Wait for validator to load schema before initializing inventory
        this.initializeInventory();
    }

    async initializeInventory() {
        // Wait for validator schema to load
        if (this.validator && !this.validator.schema) {
            // Wait up to 2 seconds for schema to load
            let attempts = 0;
            while (!this.validator.schema && attempts < 20) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (!this.validator.schema) {
                console.warn('InventoryManager: Validator schema not loaded, proceeding with fallback');
            }
        }
        
        // Initialize inventory structure
        if (!this.gameState.inventory) {
            this.gameState.inventory = {
                rods: [],
                lures: [],
                bait: [],
                boats: [],
                clothing: [],
                upgrades: [],
                fish: [],
                consumables: [],
                materials: [],
                bikini_assistants: []
            };
        }

        // Initialize equipped items
        if (!this.gameState.equippedItems) {
            this.gameState.equippedItems = {
                rod: null,
                lure: null,
                bait: null,
                boat: null,
                clothing: [],
                bikini_assistant: null
            };
        }

        // Clean up any undefined items that might exist
        this.cleanupUndefinedItems();

        // Initialize player stats if they don't exist
        this.initializePlayerStats();

        // Set up boost cleanup
        this.setupBoostCleanup();

        // Fix missing equipSlot properties for equipment items
        this.fixMissingEquipSlots();

        console.log('InventoryManager: Initialized successfully');
    }

    /**
     * Clean up any undefined items from the inventory
     */
    cleanupUndefinedItems() {
        console.log('InventoryManager: Starting comprehensive cleanup of undefined items...');
        
        let totalCleaned = 0;
        
        try {
            // Check all inventory categories
            Object.keys(this.gameState.inventory).forEach(category => {
                const items = this.gameState.inventory[category];
                if (Array.isArray(items)) {
                    const originalLength = items.length;
                    
                    // Filter out undefined items with comprehensive checks
                    this.gameState.inventory[category] = items.filter(item => {
                        // Check if item exists
                        if (!item || typeof item !== 'object') {
                            console.log(`InventoryManager: Removing null/non-object item from ${category}:`, item);
                            totalCleaned++;
                            return false;
                        }
                        
                        // Check name property
                        if (!item.name || 
                            typeof item.name !== 'string' || 
                            item.name.trim() === '' ||
                            item.name === 'undefined' ||
                            item.name.toLowerCase().includes('undefined') ||
                            item.name.toLowerCase().includes('null') ||
                            item.name === 'null') {
                            console.log(`InventoryManager: Removing item with invalid name from ${category}:`, item);
                            totalCleaned++;
                            return false;
                        }
                        
                        // Check ID property
                        if (!item.id || 
                            typeof item.id !== 'string' || 
                            item.id.trim() === '' ||
                            item.id === 'undefined' ||
                            item.id.toLowerCase().includes('undefined') ||
                            item.id.toLowerCase().includes('null') ||
                            item.id === 'null') {
                            console.log(`InventoryManager: Removing item with invalid ID from ${category}:`, item);
                            totalCleaned++;
                            return false;
                        }
                        
                        // Check for placeholder items
                        if (item.name.startsWith('MISSING:') || 
                            item.name.startsWith('Placeholder') ||
                            item.description && item.description.includes('Placeholder')) {
                            console.log(`InventoryManager: Removing placeholder item from ${category}:`, item);
                            totalCleaned++;
                            return false;
                        }
                        
                        // Item is valid
                        return true;
                    });
                    
                    const newLength = this.gameState.inventory[category].length;
                    if (originalLength !== newLength) {
                        console.log(`InventoryManager: Cleaned ${originalLength - newLength} invalid items from ${category}`);
                    }
                }
            });
            
            console.log(`InventoryManager: ✅ Comprehensive cleanup completed. Total invalid items removed: ${totalCleaned}`);
            
            // Mark as dirty to save changes
            if (totalCleaned > 0) {
                this.gameState.markDirty();
            }
            
            // Emit cleanup event
            this.emit('undefinedItemsCleanedUp', { totalCleaned });
            
            return totalCleaned;
            
        } catch (error) {
            console.error('InventoryManager: Error during undefined items cleanup:', error);
            return 0;
        }
    }

    /**
     * Check if inventory is empty (excluding fish which are managed by GameState)
     */
    isInventoryEmpty() {
        const categories = ['rods', 'lures', 'bait', 'boats', 'upgrades', 'consumables', 'materials', 'clothing', 'bikini_assistants'];
        const totalItems = categories.reduce((total, category) => {
            const items = this.gameState.inventory[category];
            return total + (Array.isArray(items) ? items.length : 0);
        }, 0);
        
        return totalItems === 0;
    }

    /**
     * Fix existing items that may be missing equipSlot property
     */
    fixMissingEquipSlots(force = false) {
        try {
            // Skip if already fixed to avoid repeated execution (unless forced)
            if (this.equipSlotFixed && !force) {
                return;
            }
            
            console.log('InventoryManager: Fixing missing equipSlot properties...');

            // Fix rods
            if (this.gameState.inventory.rods) {
                this.gameState.inventory.rods.forEach(item => {
                    if (!item.equipSlot) {
                        item.equipSlot = 'rod';
                        console.log(`InventoryManager: Fixed rod ${item.name} - added equipSlot: rod`);
                    }
                });
            }

            // Fix lures
            if (this.gameState.inventory.lures) {
                this.gameState.inventory.lures.forEach(item => {
                    if (!item.equipSlot) {
                        item.equipSlot = 'lure';
                        console.log(`InventoryManager: Fixed lure ${item.name} - added equipSlot: lure`);
                    }
                });
            }

            // Fix boats
            if (this.gameState.inventory.boats) {
                this.gameState.inventory.boats.forEach(item => {
                    if (!item.equipSlot) {
                        item.equipSlot = 'boat';
                        console.log(`InventoryManager: Fixed boat ${item.name} - added equipSlot: boat`);
                    }
                });
            }

            // Fix clothing items with comprehensive matching
            if (this.gameState.inventory.clothing) {
                this.gameState.inventory.clothing.forEach(item => {
                    if (!item.equipSlot) {
                        // Try to determine slot from item name/type
                        const name = (item.name || '').toLowerCase();
                        console.log(`InventoryManager: Fixing clothing item: "${item.name}" (lowercase: "${name}")`);
                        
                        // Head equipment patterns
                        if (name.includes('cap') || name.includes('hat') || name.includes('crown') || 
                            name.includes('sunglass') || name.includes('sunglasses') || name.includes('helmet') || 
                            name.includes('headband') || name.includes('visor') || name.includes('beanie') ||
                            name.includes('glasses') || name.includes('goggles')) {
                            item.equipSlot = 'head';
                            console.log(`InventoryManager: Fixed head clothing ${item.name} - added equipSlot: head`);
                        } 
                        // Upper body equipment patterns
                        else if (name.includes('vest') || name.includes('shirt') || name.includes('jacket') || 
                                 name.includes('bikini') || name.includes('top') || name.includes('sweater') ||
                                 name.includes('hoodie') || name.includes('coat') || name.includes('tank')) {
                            item.equipSlot = 'upper_body';
                            console.log(`InventoryManager: Fixed upper_body clothing ${item.name} - added equipSlot: upper_body`);
                        } 
                        // Lower body equipment patterns
                        else if (name.includes('shorts') || name.includes('pants') || name.includes('sandals') || 
                                 name.includes('waders') || name.includes('shoes') || name.includes('boots') ||
                                 name.includes('socks') || name.includes('leggings') || name.includes('skirt')) {
                            item.equipSlot = 'lower_body';
                            console.log(`InventoryManager: Fixed lower_body clothing ${item.name} - added equipSlot: lower_body`);
                        } 
                        // Default fallback for unknown clothing
                        else {
                            item.equipSlot = 'upper_body';
                            console.log(`InventoryManager: Fixed unknown clothing ${item.name} - defaulted to equipSlot: upper_body`);
                        }
                    } else {
                        console.log(`InventoryManager: Clothing item ${item.name} already has equipSlot: ${item.equipSlot}`);
                    }
                });
            }

            // Fix bikini assistants
            if (this.gameState.inventory.bikini_assistants) {
                this.gameState.inventory.bikini_assistants.forEach(item => {
                    if (!item.equipSlot) {
                        item.equipSlot = 'bikini_assistant';
                        console.log(`InventoryManager: Fixed assistant ${item.name} - added equipSlot: bikini_assistant`);
                    }
                });
            }

            // Skip fish items - they don't need equipSlot properties
            // Fish are inventory items, not equipment
            
            // Skip consumables, materials, and upgrades - they don't need equipSlot properties either
            
            // Mark as fixed to avoid repeated execution (unless this was a forced run)
            if (!force) {
                this.equipSlotFixed = true;
            }
            console.log('InventoryManager: Finished fixing equipSlot properties');
            
        } catch (error) {
            console.error('InventoryManager: Error fixing equipSlots:', error);
        }
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
            console.log(`InventoryManager: Adding item to ${category}:`, {
                name: itemData.name,
                id: itemData.id,
                quantity: quantity
            });
            
            // 🚨 VALIDATION: Ensure itemData is valid object
            if (!itemData || typeof itemData !== 'object') {
                console.error('InventoryManager: Invalid itemData provided:', itemData);
                return false;
            }
            
            // 🚨 VALIDATION: Ensure ID exists and is valid
            if (!itemData.id || typeof itemData.id !== 'string' || itemData.id.trim() === '' || itemData.id === 'undefined') {
                console.warn(`InventoryManager: Item missing/invalid ID, generating one:`, itemData);
                itemData.id = `${category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            
            // 🚨 VALIDATION: Ensure name exists and is valid
            if (!itemData.name || typeof itemData.name !== 'string' || itemData.name.trim() === '' || itemData.name === 'undefined') {
                console.warn(`InventoryManager: Item ${itemData.id} missing/invalid name, setting default`);
                itemData.name = category === 'fish' ? 'Unknown Fish' : 'Unknown Item';
            }
            
            // 🚨 VALIDATION: Ensure description exists and is valid
            if (!itemData.description || typeof itemData.description !== 'string' || itemData.description.trim() === '') {
                console.warn(`InventoryManager: Item ${itemData.name} missing description, adding default`);
                itemData.description = `A ${category.slice(0, -1)} item`; // Remove 's' from category
            }
            
            // 🚨 VALIDATION: Ensure rarity is valid
            if (!itemData.rarity || typeof itemData.rarity !== 'number' || itemData.rarity < 1) {
                console.warn(`InventoryManager: Item ${itemData.name} missing/invalid rarity, setting to 1`);
                itemData.rarity = 1;
            }
            
            console.log(`InventoryManager: ✅ VALIDATION PASSED - Adding item to ${category}:`, {
                name: itemData.name,
                id: itemData.id,
                rarity: itemData.rarity,
                description: itemData.description.substring(0, 50) + '...'
            });
            
            // Create category if it doesn't exist
            if (!this.gameState.inventory[category]) {
                console.log(`InventoryManager: Creating new category: ${category}`);
                this.gameState.inventory[category] = [];
            }

            // Special handling for fish items to ensure proper structure
            let processedItemData = itemData;
            if (category === 'fish') {
                processedItemData = {
                    id: itemData.id || `fish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    fishId: itemData.fishId || itemData.id || 'unknown',
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

            // Create proper item structure using validator
            let item;
            if (this.validator && this.validator.schema) {
                item = this.validator.createItem(category, processedItemData);
            } else {
                // Fallback if validator not ready
                console.warn('InventoryManager: Validator not ready, using fallback item creation');
                item = {
                    ...processedItemData,
                    quantity: quantity || 1,
                    owned: true
                };
            }
            
            // 🚨 FINAL VALIDATION: Double-check the created item
            if (!item || !item.name || item.name === 'undefined' || !item.id || item.id === 'undefined') {
                console.error('InventoryManager: ❌ CRITICAL - Created invalid item:', item);
                console.error('InventoryManager: Original data:', itemData);
                return false;
            }
            
            console.log(`InventoryManager: ✅ Item after createItem validation:`, {
                name: item.name,
                id: item.id,
                category: category
            });
            
            // Validate item (but be lenient for fish)
            if (this.validator && this.validator.schema) {
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
            } else {
                console.warn('InventoryManager: Validator not available, skipping validation');
            }

            // Check if stackable and item already exists
            const isStackable = this.validator && this.validator.schema ? 
                this.validator.isStackable(category) : 
                (category === 'fish' || category === 'lures' || category === 'consumables' || category === 'materials');
                
            if (isStackable) {
                const existingItem = this.findItem(category, item.id);
                if (existingItem) {
                    const maxStack = this.validator && this.validator.schema ? 
                        this.validator.getMaxStackSize() : 999;
                    const newQuantity = Math.min(existingItem.quantity + quantity, maxStack);
                    const actualAdded = newQuantity - existingItem.quantity;
                    
                    existingItem.quantity = newQuantity;
                    this.gameState.markDirty();
                    this.emit('itemAdded', { category, item: existingItem, quantity: actualAdded });
                    
                    console.log(`InventoryManager: ✅ Added ${actualAdded} to existing stack of ${item.name}`);
                    return actualAdded > 0;
                }
            }

            // Check category limits
            const limit = this.validator && this.validator.schema ? 
                this.validator.getCategoryLimit(category) : 100;
            if (this.gameState.inventory[category].length >= limit) {
                console.error(`Category ${category} is full (${limit} items max)`);
                return false;
            }

            // Add item to inventory
            this.gameState.inventory[category].push(item);
            this.gameState.markDirty();
            this.emit('itemAdded', { category, item, quantity });

            console.log(`InventoryManager: ✅ Successfully added ${item.name} to ${category}`);
            return true;

        } catch (error) {
            console.error('InventoryManager: Error adding item:', error);
            console.error('InventoryManager: Error details:', {
                category,
                itemData,
                quantity,
                error: error.message,
                stack: error.stack
            });
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
            if (this.validator && this.validator.schema && this.validator.isStackable(category) && item.quantity > 1) {
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
            const maxEquipped = this.validator && this.validator.schema ? 
                this.validator.getMaxEquipped(category) : 0;
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
            if (category === 'clothing' && item.equipSlot) {
                items.forEach(otherItem => {
                    if (otherItem.equipped && otherItem.equipSlot === item.equipSlot && otherItem.id !== itemId) {
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
        // Ensure equipSlots are fixed before checking equipped items (only once)
        if (!this.equipSlotFixed) {
            this.fixMissingEquipSlots();
        }
        
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
                limit: this.validator && this.validator.schema ? 
                    this.validator.getCategoryLimit(category) : 100
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
            if (!this.eventListeners.has(event)) {
                this.eventListeners.set(event, []);
            }
            
            // Check if callback is valid
            if (typeof callback === 'function') {
                this.eventListeners.get(event).push(callback);
            } else {
                console.error('InventoryManager: Invalid callback provided for event:', event);
            }
        } catch (error) {
            console.error('InventoryManager: Error adding event listener:', error);
        }
    }

    off(event, callback) {
        try {
            if (this.eventListeners.has(event)) {
                this.eventListeners.get(event).filter(cb => cb !== callback);
                
                // Clean up empty event arrays
                if (this.eventListeners.get(event).length === 0) {
                    this.eventListeners.delete(event);
                }
            }
        } catch (error) {
            console.error('InventoryManager: Error removing event listener:', error);
        }
    }

    emit(event, data) {
        try {
            if (this.eventListeners.has(event)) {
                // Create a copy of the listeners array to prevent issues if listeners are modified during iteration
                const listeners = [...this.eventListeners.get(event)];
                
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
        
        // 🚨 CRITICAL SAFETY CHECK: Prevent undefined items at all costs
        try {
            // 🚨 VALIDATION: Only add sample items if DataLoader has real data
            if (!gameDataLoader || !gameDataLoader.loaded) {
                console.log('InventoryManager: DataLoader not ready, skipping sample item creation (this is normal during initialization)');
                return;
            }
            
            // Get real data from DataLoader to ensure we're not using fallback
            const realFish = gameDataLoader.getAllFish();
            const realRods = gameDataLoader.getAllRods();
            const realLures = gameDataLoader.getAllLures();
            const realBoats = gameDataLoader.getAllBoats();
            const realClothing = gameDataLoader.getAllClothing();
            
            console.log('InventoryManager: Real data available:', {
                fish: realFish ? realFish.length : 0,
                rods: realRods ? realRods.length : 0,
                lures: realLures ? realLures.length : 0,
                boats: realBoats ? realBoats.length : 0,
                clothing: realClothing ? realClothing.length : 0
            });
            
            // 🚨 CRITICAL: If no real data is available, create minimal safe items only
            if ((!realRods || realRods.length === 0) && 
                (!realLures || realLures.length === 0) && 
                (!realBoats || realBoats.length === 0)) {
                console.log('InventoryManager: No real equipment data available, creating minimal safe sample items only');
            }
            
            // 🚨 VALIDATION: Check if we have real data before creating sample items
            if (!realRods || realRods.length === 0) {
                console.log('InventoryManager: No real rod data available, creating basic sample rod');
                // Create a basic sample rod with guaranteed valid properties
                const basicRod = {
                    id: `basic_sample_rod_${Date.now()}`,
                    name: 'Basic Sample Rod',
                    rarity: 1,
                    equipSlot: 'rod',
                    stats: { castAccuracy: 5, tensionStability: 3 },
                    description: 'A basic fishing rod for testing',
                    unlockLevel: 1,
                    cost: 100,
                    durability: 100,
                    condition: 100,
                    owned: true,
                    equipped: false,
                    quantity: 1
                };
                
                // 🚨 VALIDATION: Double-check before adding
                if (this.validateItemData(basicRod, 'rods')) {
                    this.addValidatedItem('rods', basicRod);
                } else {
                    console.error('InventoryManager: ❌ CRITICAL - Basic rod failed validation, skipping');
                }
            } else {
                // Use real rod data
                const firstRod = realRods[0];
                if (this.validateItemData(firstRod, 'rods')) {
                    const rodItem = {
                        ...firstRod,
                        id: `rod_${firstRod.id}_sample_${Date.now()}`,
                        owned: true,
                        equipped: false,
                        quantity: 1,
                        equipSlot: 'rod'
                    };
                    
                    // 🚨 VALIDATION: Double-check before adding
                    if (this.validateItemData(rodItem, 'rods')) {
                        this.addValidatedItem('rods', rodItem);
                    } else {
                        console.error('InventoryManager: ❌ CRITICAL - Real rod item failed validation, skipping');
                    }
                } else {
                    console.error('InventoryManager: ❌ CRITICAL - Real rod data failed validation, skipping');
                }
            }
            
            // Add sample lures with validation
            if (!realLures || realLures.length === 0) {
                console.log('InventoryManager: No real lure data available, creating basic sample lures');
                const basicLures = [
                    {
                        id: 'basic_sample_spoon',
                        name: 'Basic Spoon Lure',
                        type: 'spoon',
                        rarity: 1,
                        equipSlot: 'lure',
                        description: 'A basic spoon lure for testing',
                        unlockLevel: 1,
                        cost: 50,
                        stats: { attractionRadius: 5 }
                    },
                    {
                        id: 'basic_sample_fly',
                        name: 'Basic Fly Lure',
                        type: 'fly',
                        rarity: 1,
                        equipSlot: 'lure',
                        description: 'A basic fly lure for testing',
                        unlockLevel: 1,
                        cost: 30,
                        stats: { surfaceLure: 10 }
                    }
                ];
                
                basicLures.forEach(lure => {
                    this.addValidatedItem('lures', lure);
                });
            } else {
                // Use real lure data (first 2 lures)
                realLures.slice(0, 2).forEach((lure, index) => {
                    if (this.validateItemData(lure, 'lures')) {
                        const lureItem = {
                            ...lure,
                            id: `lure_${lure.id}_sample_${index}`,
                            owned: true,
                            equipped: false,
                            quantity: 3,
                            equipSlot: 'lure'
                        };
                        this.addValidatedItem('lures', lureItem);
                    }
                });
            }
            
            // Add sample boats with validation
            if (!realBoats || realBoats.length === 0) {
                console.log('InventoryManager: No real boat data available, creating basic sample boat');
                const basicBoat = {
                    id: 'basic_sample_boat',
                    name: 'Basic Sample Boat',
                    rarity: 1,
                    equipSlot: 'boat',
                    description: 'A basic boat for testing',
                    unlockLevel: 1,
                    cost: 1000,
                    stats: { speed: 10, storage: 20 }
                };
                this.addValidatedItem('boats', basicBoat);
            } else {
                // Use real boat data
                const firstBoat = realBoats[0];
                if (this.validateItemData(firstBoat, 'boats')) {
                    const boatItem = {
                        ...firstBoat,
                        id: `boat_${firstBoat.id}_sample`,
                        owned: true,
                        equipped: false,
                        quantity: 1,
                        equipSlot: 'boat'
                    };
                    this.addValidatedItem('boats', boatItem);
                }
            }
            
            // Add sample clothing with validation
            if (!realClothing || realClothing.length === 0) {
                console.log('InventoryManager: No real clothing data available, creating basic sample clothing');
                const basicClothing = [
                    {
                        id: 'basic_sample_cap',
                        name: 'Basic Sample Cap',
                        equipSlot: 'head',
                        rarity: 1,
                        stats: { sunProtection: 5 },
                        description: 'A basic cap for testing',
                        unlockLevel: 1,
                        cost: 25
                    },
                    {
                        id: 'basic_sample_vest',
                        name: 'Basic Sample Vest',
                        equipSlot: 'upper_body',
                        rarity: 1,
                        stats: { comfort: 10 },
                        description: 'A basic vest for testing',
                        unlockLevel: 1,
                        cost: 75
                    }
                ];
                
                basicClothing.forEach(clothing => {
                    this.addValidatedItem('clothing', clothing);
                });
            } else {
                // Use real clothing data (first 2 items)
                realClothing.slice(0, 2).forEach((clothing, index) => {
                    if (this.validateItemData(clothing, 'clothing')) {
                        const clothingItem = {
                            ...clothing,
                            id: `clothing_${clothing.id}_sample_${index}`,
                            owned: true,
                            equipped: false,
                            quantity: 1
                        };
                        this.addValidatedItem('clothing', clothingItem);
                    }
                });
            }
            
            // Add sample consumables (these are always created manually since they're game mechanics)
            const sampleConsumables = [
                {
                    id: 'energy_drink_sample',
                    name: 'Energy Drink',
                    rarity: 1,
                    description: 'Restores 25 energy',
                    effect: { type: 'energy', value: 25 },
                    quantity: 3,
                    cost: 50
                },
                {
                    id: 'repair_kit_sample',
                    name: 'Repair Kit',
                    rarity: 2,
                    description: 'Repairs damaged equipment',
                    effect: { type: 'repair', value: 50 },
                    quantity: 2,
                    cost: 100
                }
            ];
            
            sampleConsumables.forEach(consumable => {
                this.addValidatedItem('consumables', consumable);
            });
            
            // Add sample materials
            const sampleMaterials = [
                {
                    id: 'wood_sample',
                    name: 'Wood',
                    rarity: 1,
                    description: 'Basic crafting material',
                    quantity: 10,
                    cost: 5
                },
                {
                    id: 'metal_scraps_sample',
                    name: 'Metal Scraps',
                    rarity: 2,
                    description: 'Used for advanced crafting',
                    quantity: 5,
                    cost: 20
                }
            ];
            
            sampleMaterials.forEach(material => {
                this.addValidatedItem('materials', material);
            });
            
            console.log('InventoryManager: Sample items added successfully with validation');
            
        } catch (error) {
            console.error('InventoryManager: ❌ Error adding sample items:', error);
        }
    }

    /**
     * Validate item data before adding to inventory
     * @param {object} itemData - Item data to validate
     * @param {string} category - Item category
     * @returns {boolean} - Whether item data is valid
     */
    validateItemData(itemData, category) {
        if (!itemData) {
            console.error(`InventoryManager: Item data is null/undefined for category ${category}`);
            return false;
        }
        
        if (!itemData.name || typeof itemData.name !== 'string' || itemData.name.trim() === '') {
            console.error(`InventoryManager: Invalid name for ${category} item:`, itemData);
            return false;
        }
        
        if (itemData.name === 'undefined' || itemData.name.includes('undefined')) {
            console.error(`InventoryManager: Item has 'undefined' in name for ${category}:`, itemData);
            return false;
        }
        
        if (!itemData.id || typeof itemData.id !== 'string' || itemData.id.trim() === '') {
            console.error(`InventoryManager: Invalid ID for ${category} item:`, itemData);
            return false;
        }
        
        if (itemData.id === 'undefined' || itemData.id.includes('undefined')) {
            console.error(`InventoryManager: Item has 'undefined' in ID for ${category}:`, itemData);
            return false;
        }
        
        return true;
    }

    /**
     * Add item with validation to prevent undefined items
     * @param {string} category - Item category
     * @param {object} itemData - Item data
     * @returns {boolean} - Success status
     */
    addValidatedItem(category, itemData) {
        // Pre-validate the item data
        if (!this.validateItemData(itemData, category)) {
            console.error(`InventoryManager: Rejecting invalid item for ${category}:`, itemData);
            return false;
        }
        
        // Ensure required properties exist
        const validatedItem = {
            ...itemData,
            name: itemData.name.trim(),
            id: itemData.id.trim(),
            owned: true,
            quantity: itemData.quantity || 1
        };
        
        // Add category-specific required properties
        if (category === 'rods' || category === 'lures' || category === 'boats' || category === 'clothing' || category === 'bikini_assistants') {
            if (!validatedItem.equipSlot) {
                // Auto-assign equipSlot based on category
                switch (category) {
                    case 'rods':
                        validatedItem.equipSlot = 'rod';
                        break;
                    case 'lures':
                        validatedItem.equipSlot = 'lure';
                        break;
                    case 'boats':
                        validatedItem.equipSlot = 'boat';
                        break;
                    case 'bikini_assistants':
                        validatedItem.equipSlot = 'bikini_assistant';
                        break;
                    case 'clothing':
                        // For clothing, try to determine from name
                        const name = validatedItem.name.toLowerCase();
                        if (name.includes('cap') || name.includes('hat') || name.includes('crown')) {
                            validatedItem.equipSlot = 'head';
                        } else if (name.includes('vest') || name.includes('shirt') || name.includes('jacket')) {
                            validatedItem.equipSlot = 'upper_body';
                        } else {
                            validatedItem.equipSlot = 'lower_body';
                        }
                        break;
                }
            }
            validatedItem.equipped = false;
        }
        
        console.log(`InventoryManager: Adding validated ${category} item:`, validatedItem.name);
        return this.addItem(category, validatedItem);
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

    /**
     * Manually refresh and fix all equipment slots
     * This can be called when items aren't equipping properly
     */
    refreshEquipmentSlots() {
        console.log('InventoryManager: Manually refreshing equipment slots...');
        
        // Force fix missing equipment slots (bypass the flag)
        this.fixMissingEquipSlots(true);
        
        // Mark inventory as dirty to trigger UI updates
        this.gameState.markDirty();
        
        // Emit event to update UI
        this.emit('equipmentSlotsRefreshed', {});
        
        console.log('InventoryManager: Equipment slots refresh completed');
    }

    /**
     * Manually refresh all inventory items to fix validation issues
     * This can be called after schema changes to update existing items
     */
    refreshAllItems() {
        try {
            console.log('InventoryManager: Starting manual refresh of all items...');
            
            // Fix equipment slots first
            this.fixMissingEquipSlots();
            
            // Process each category
            Object.entries(this.gameState.inventory).forEach(([category, items]) => {
                if (Array.isArray(items)) {
                    console.log(`InventoryManager: Refreshing ${items.length} items in ${category}`);
                    
                    items.forEach((item, index) => {
                        try {
                            // Use validator to create a properly structured item
                            const refreshedItem = this.validator.createItem(category, item);
                            
                            // Copy over the refreshed properties
                            Object.assign(item, refreshedItem);
                            
                            // Validate the refreshed item
                            const validation = this.validator.validateItem(category, item);
                            if (!validation.valid) {
                                console.warn(`InventoryManager: Item ${item.name} still has validation issues:`, validation.errors);
                            } else {
                                console.log(`InventoryManager: Successfully refreshed ${item.name}`);
                            }
                            
                        } catch (error) {
                            console.error(`InventoryManager: Error refreshing item ${item.name}:`, error);
                        }
                    });
                }
            });
            
            // Mark inventory as dirty to trigger saves and UI updates
            this.gameState.markDirty();
            
            // Emit refresh event
            this.emit('allItemsRefreshed', {});
            
            console.log('InventoryManager: Manual refresh completed');
            
        } catch (error) {
            console.error('InventoryManager: Error during manual refresh:', error);
        }
    }

    /**
     * 🚨 FORCE CLEAN: Remove all undefined/invalid items immediately on initialization
     */
    forceCleanAllUndefinedItems() {
        console.log('InventoryManager: 🚨 FORCE CLEANING all undefined/invalid items...');
        
        try {
            let totalRemoved = 0;
            
            // Ensure inventory exists
            if (!this.gameState.inventory) {
                this.gameState.inventory = {};
                console.log('InventoryManager: Created empty inventory structure');
                return 0;
            }
            
            // Clean each category thoroughly
            Object.keys(this.gameState.inventory).forEach(category => {
                if (Array.isArray(this.gameState.inventory[category])) {
                    const originalLength = this.gameState.inventory[category].length;
                    
                    // Filter out ALL invalid items
                    this.gameState.inventory[category] = this.gameState.inventory[category].filter(item => {
                        // Comprehensive validation
                        if (!item || typeof item !== 'object') {
                            console.log(`InventoryManager: 🗑️ Removing null/invalid object from ${category}`);
                            totalRemoved++;
                            return false;
                        }
                        
                        // Check name
                        if (!item.name || 
                            typeof item.name !== 'string' || 
                            item.name.trim() === '' ||
                            item.name === 'undefined' ||
                            item.name.includes('undefined') ||
                            item.name.includes('null') ||
                            item.name.startsWith('MISSING:') ||
                            item.name.startsWith('Placeholder')) {
                            console.log(`InventoryManager: 🗑️ Removing item with invalid name "${item.name}" from ${category}`);
                            totalRemoved++;
                            return false;
                        }
                        
                        // Check ID
                        if (!item.id || 
                            typeof item.id !== 'string' || 
                            item.id.trim() === '' ||
                            item.id === 'undefined' ||
                            item.id.includes('undefined') ||
                            item.id.includes('null')) {
                            console.log(`InventoryManager: 🗑️ Removing item with invalid ID "${item.id}" from ${category}`);
                            totalRemoved++;
                            return false;
                        }
                        
                        // Check description for placeholders
                        if (item.description && 
                            (item.description.includes('Placeholder') || 
                             item.description.includes('MISSING'))) {
                            console.log(`InventoryManager: 🗑️ Removing placeholder item "${item.name}" from ${category}`);
                            totalRemoved++;
                            return false;
                        }
                        
                        // Item is valid
                        return true;
                    });
                    
                    const removedCount = originalLength - this.gameState.inventory[category].length;
                    if (removedCount > 0) {
                        console.log(`InventoryManager: ✅ Cleaned ${removedCount} invalid items from ${category}`);
                    }
                } else {
                    // Ensure category is an array
                    this.gameState.inventory[category] = [];
                    console.log(`InventoryManager: ✅ Reset ${category} to empty array`);
                }
            });
            
            console.log(`InventoryManager: ✅ FORCE CLEAN COMPLETED - Removed ${totalRemoved} invalid items total`);
            
            // Mark as dirty to save changes
            if (totalRemoved > 0) {
                this.gameState.markDirty();
            }
            
            return totalRemoved;
            
        } catch (error) {
            console.error('InventoryManager: ❌ Error during force clean:', error);
            return 0;
        }
    }

    /**
     * Force clean and rebuild inventory with proper items
     */
    forceCleanInventory() {
        console.log('InventoryManager: Force cleaning entire inventory...');
        
        try {
            // Use the comprehensive force clean method
            const cleanedCount = this.forceCleanAllUndefinedItems();
            
            // 🚨 DISABLED: Automatic sample item generation to prevent undefined items
            // Sample items can be added manually through the inventory UI debug buttons if needed
            console.log('InventoryManager: Skipping automatic sample item generation after force clean');
            
            console.log('InventoryManager: Force clean completed');
            
            // Emit event
            this.emit('inventoryForceCleanCompleted', { cleanedCount });
            
            return true;
            
        } catch (error) {
            console.error('InventoryManager: Error during force clean:', error);
            return false;
        }
    }

    /**
     * Add proper sample items using real data from DataLoader
     */
    addProperSampleItems() {
        console.log('InventoryManager: Adding proper sample items using real DataLoader data...');
        
        try {
            // 🚨 VALIDATION: Ensure DataLoader is available and loaded
            if (!gameDataLoader || !gameDataLoader.loaded) {
                console.log('InventoryManager: GameDataLoader not available or not loaded, skipping sample items');
                return;
            }
            
            // Get real data from DataLoader
            const allFish = gameDataLoader.getAllFish();
            const allRods = gameDataLoader.getAllRods();
            const allLures = gameDataLoader.getAllLures();
            const allBoats = gameDataLoader.getAllBoats();
            const allClothing = gameDataLoader.getAllClothing();
            
            console.log('InventoryManager: DataLoader data available:', {
                fish: allFish ? allFish.length : 0,
                rods: allRods ? allRods.length : 0,
                lures: allLures ? allLures.length : 0,
                boats: allBoats ? allBoats.length : 0,
                clothing: allClothing ? allClothing.length : 0
            });
            
            // 🚨 VALIDATION: Only add items if we have valid data
            
            // Add sample rods (only if we have real rod data)
            if (allRods && allRods.length > 0) {
                const sampleRod = allRods[0]; // Use first real rod
                if (this.validateItemData(sampleRod, 'rods')) {
                    const rodItem = {
                        ...sampleRod,
                        id: `rod_${sampleRod.id}_${Date.now()}`,
                        owned: true,
                        equipped: false,
                        quantity: 1,
                        equipSlot: 'rod'
                    };
                    
                    console.log('InventoryManager: Adding validated rod:', rodItem.name);
                    this.addValidatedItem('rods', rodItem);
                } else {
                    console.log('InventoryManager: First rod failed validation, skipping');
                }
            } else {
                console.log('InventoryManager: No real rod data available');
            }
            
            // Add sample lures (only if we have real lure data)
            if (allLures && allLures.length > 0) {
                const sampleLure = allLures[0]; // Use first real lure
                if (this.validateItemData(sampleLure, 'lures')) {
                    const lureItem = {
                        ...sampleLure,
                        id: `lure_${sampleLure.id}_${Date.now()}`,
                        owned: true,
                        equipped: false,
                        quantity: 5,
                        equipSlot: 'lure'
                    };
                    
                    console.log('InventoryManager: Adding validated lure:', lureItem.name);
                    this.addValidatedItem('lures', lureItem);
                } else {
                    console.log('InventoryManager: First lure failed validation, skipping');
                }
            } else {
                console.log('InventoryManager: No real lure data available');
            }
            
            // Add sample boats (only if we have real boat data)
            if (allBoats && allBoats.length > 0) {
                const sampleBoat = allBoats[0]; // Use first real boat
                if (this.validateItemData(sampleBoat, 'boats')) {
                    const boatItem = {
                        ...sampleBoat,
                        id: `boat_${sampleBoat.id}_${Date.now()}`,
                        owned: true,
                        equipped: false,
                        quantity: 1,
                        equipSlot: 'boat'
                    };
                    
                    console.log('InventoryManager: Adding validated boat:', boatItem.name);
                    this.addValidatedItem('boats', boatItem);
                } else {
                    console.log('InventoryManager: First boat failed validation, skipping');
                }
            } else {
                console.log('InventoryManager: No real boat data available');
            }
            
            // Add sample clothing (only if we have real clothing data)
            if (allClothing && allClothing.length > 0) {
                const sampleClothing = allClothing[0]; // Use first real clothing
                if (this.validateItemData(sampleClothing, 'clothing')) {
                    const clothingItem = {
                        ...sampleClothing,
                        id: `clothing_${sampleClothing.id}_${Date.now()}`,
                        owned: true,
                        equipped: false,
                        quantity: 1
                    };
                    
                    console.log('InventoryManager: Adding validated clothing:', clothingItem.name);
                    this.addValidatedItem('clothing', clothingItem);
                } else {
                    console.log('InventoryManager: First clothing item failed validation, skipping');
                }
            } else {
                console.log('InventoryManager: No real clothing data available');
            }
            
            // Add basic consumables (these are always safe since they're manually created)
            const basicConsumables = [
                {
                    id: `energy_drink_${Date.now()}`,
                    name: 'Energy Drink',
                    rarity: 1,
                    description: 'Restores 25 energy',
                    effect: { type: 'energy', value: 25 },
                    quantity: 3,
                    cost: 50
                }
            ];
            
            basicConsumables.forEach(consumable => {
                if (this.validateItemData(consumable, 'consumables')) {
                    console.log('InventoryManager: Adding validated consumable:', consumable.name);
                    this.addValidatedItem('consumables', consumable);
                }
            });
            
            console.log('InventoryManager: ✅ Proper sample items added successfully with full validation');
            
        } catch (error) {
            console.error('InventoryManager: ❌ Error adding proper sample items:', error);
        }
    }
}

export default InventoryManager;