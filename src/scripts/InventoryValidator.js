import inventorySchema from '../data/inventorySchema.json';

export class InventoryValidator {
    constructor() {
        this.schema = inventorySchema;
    }

    /**
     * Validate an item against the inventory schema
     * @param {string} category - Item category (rods, lures, etc.)
     * @param {object} item - Item to validate
     * @returns {object} - {valid: boolean, errors: string[]}
     */
    validateItem(category, item) {
        const errors = [];
        
        if (!this.schema.itemCategories[category]) {
            errors.push(`Unknown item category: ${category}`);
            return { valid: false, errors };
        }

        const categorySchema = this.schema.itemCategories[category];
        
        // Check required properties
        for (const prop of categorySchema.requiredProperties) {
            if (item[prop] === undefined || item[prop] === null) {
                errors.push(`Missing required property: ${prop}`);
            }
        }

        // Validate property types and constraints
        for (const [propName, propValue] of Object.entries(item)) {
            const propSchema = this.schema.itemProperties[propName];
            if (propSchema) {
                const validation = this.validateProperty(propName, propValue, propSchema);
                if (!validation.valid) {
                    errors.push(...validation.errors);
                }
            }
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Validate a single property
     * @param {string} name - Property name
     * @param {any} value - Property value
     * @param {object} schema - Property schema
     * @returns {object} - {valid: boolean, errors: string[]}
     */
    validateProperty(name, value, schema) {
        const errors = [];

        // Type validation
        if (schema.type === 'string' && typeof value !== 'string') {
            errors.push(`${name} must be a string`);
        } else if (schema.type === 'integer' && (!Number.isInteger(value) || typeof value !== 'number')) {
            errors.push(`${name} must be an integer`);
        } else if (schema.type === 'boolean' && typeof value !== 'boolean') {
            errors.push(`${name} must be a boolean`);
        } else if (schema.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
            errors.push(`${name} must be an object`);
        } else if (schema.type === 'array' && !Array.isArray(value)) {
            errors.push(`${name} must be an array`);
        }

        // Range validation for numbers
        if (schema.type === 'integer' && typeof value === 'number') {
            if (schema.min !== undefined && value < schema.min) {
                errors.push(`${name} must be at least ${schema.min}`);
            }
            if (schema.max !== undefined && value > schema.max) {
                errors.push(`${name} must be at most ${schema.max}`);
            }
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Check if an item is stackable
     * @param {string} category - Item category
     * @returns {boolean}
     */
    isStackable(category) {
        return this.schema.itemCategories[category]?.stackable || false;
    }

    /**
     * Get maximum stack size for stackable items
     * @returns {number}
     */
    getMaxStackSize() {
        return this.schema.inventoryLimits.maxStackSize;
    }

    /**
     * Get rarity color for an item
     * @param {number} rarity - Rarity level (1-6)
     * @returns {string} - Hex color code
     */
    getRarityColor(rarity) {
        // Handle undefined, null, or invalid rarity values
        if (rarity === undefined || rarity === null || isNaN(rarity)) {
            rarity = 1; // Default to common rarity
        }
        
        // Ensure rarity is within valid range
        rarity = Math.max(1, Math.min(6, Math.floor(rarity)));
        
        return this.schema.rarityColors[rarity.toString()] || this.schema.rarityColors['1'];
    }

    /**
     * Get rarity name for an item
     * @param {number} rarity - Rarity level (1-6)
     * @returns {string} - Rarity name
     */
    getRarityName(rarity) {
        // Handle undefined, null, or invalid rarity values
        if (rarity === undefined || rarity === null || isNaN(rarity)) {
            rarity = 1; // Default to common rarity
        }
        
        // Ensure rarity is within valid range
        rarity = Math.max(1, Math.min(6, Math.floor(rarity)));
        
        return this.schema.rarityNames[rarity.toString()] || 'Common';
    }

    /**
     * Get equipment slot for an item category
     * @param {string} category - Item category
     * @returns {string} - Equipment slot name
     */
    getEquipSlot(category) {
        return this.schema.itemCategories[category]?.equipSlot || 'none';
    }

    /**
     * Get maximum number of items that can be equipped for a category
     * @param {string} category - Item category
     * @returns {number}
     */
    getMaxEquipped(category) {
        return this.schema.itemCategories[category]?.maxEquipped || 0;
    }

    /**
     * Get category limit for inventory
     * @param {string} category - Item category
     * @returns {number}
     */
    getCategoryLimit(category) {
        return this.schema.inventoryLimits.categories[category] || this.schema.inventoryLimits.maxSlots;
    }

    /**
     * Create a default item structure for a category
     * @param {string} category - Item category
     * @param {object} baseData - Base item data
     * @returns {object} - Complete item with defaults
     */
    createItem(category, baseData) {
        const categorySchema = this.schema.itemCategories[category];
        if (!categorySchema) {
            throw new Error(`Unknown category: ${category}`);
        }

        const item = { ...baseData };

        // Set defaults for optional properties
        if (categorySchema.stackable && item.quantity === undefined) {
            item.quantity = 1;
        }
        
        if (item.owned === undefined) {
            item.owned = false;
        }
        
        if (item.equipped === undefined) {
            item.equipped = false;
        }
        
        if (item.unique === undefined) {
            item.unique = false;
        }
        
        if (item.tradeable === undefined) {
            item.tradeable = true;
        }

        // Set condition to match durability if both exist
        if (item.durability !== undefined && item.condition === undefined) {
            item.condition = item.durability;
        }

        return item;
    }

    /**
     * Validate an entire inventory structure
     * @param {object} inventory - Complete inventory object
     * @returns {object} - {valid: boolean, errors: object}
     */
    validateInventory(inventory) {
        const errors = {};
        let valid = true;

        for (const [category, items] of Object.entries(inventory)) {
            if (!this.schema.itemCategories[category]) {
                errors[category] = [`Unknown category: ${category}`];
                valid = false;
                continue;
            }

            errors[category] = [];

            if (!Array.isArray(items)) {
                errors[category].push('Category must contain an array of items');
                valid = false;
                continue;
            }

            // Check category limits
            const limit = this.getCategoryLimit(category);
            if (items.length > limit) {
                errors[category].push(`Category exceeds limit of ${limit} items`);
                valid = false;
            }

            // Validate each item
            for (let i = 0; i < items.length; i++) {
                const itemValidation = this.validateItem(category, items[i]);
                if (!itemValidation.valid) {
                    errors[category].push(`Item ${i}: ${itemValidation.errors.join(', ')}`);
                    valid = false;
                }
            }

            // Check equipment constraints
            const maxEquipped = this.getMaxEquipped(category);
            const equippedCount = items.filter(item => item.equipped).length;
            if (equippedCount > maxEquipped) {
                errors[category].push(`Too many equipped items: ${equippedCount}/${maxEquipped}`);
                valid = false;
            }
        }

        return { valid, errors };
    }
}

export default InventoryValidator; 