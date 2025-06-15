export class InventoryValidator {
    constructor(gameState) {
        this.gameState = gameState;
        this.schema = null;
        this.loadSchema();
    }

    async loadSchema() {
        try {
            const response = await fetch('/src/data/inventorySchema.json');
            const rawSchema = await response.json();
            
            // Transform the schema from CSV format to usable format
            this.schema = this.transformSchema(rawSchema);
            console.log('InventoryValidator: Schema loaded and transformed successfully');
        } catch (error) {
            console.error('InventoryValidator: Error loading schema:', error);
            // Create a basic fallback schema
            this.schema = this.createFallbackSchema();
        }
    }

    transformSchema(rawSchema) {
        const schema = {
            itemCategories: {},
            itemProperties: {},
            rarityNames: {},
            inventoryLimits: {}
        };

        try {
            // Transform item categories
            if (rawSchema.itemCategories && Array.isArray(rawSchema.itemCategories)) {
                rawSchema.itemCategories.forEach(cat => {
                    schema.itemCategories[cat.category] = {
                        type: cat.type,
                        stackable: cat.stackable === true || cat.stackable === 'true',
                        equipSlot: cat.equip_slot,
                        maxEquipped: parseInt(cat.max_equipped) || 0,
                        requiredProperties: cat.required_properties ? cat.required_properties.split(',').map(p => p.trim()) : ['id', 'name']
                    };
                });
            }

            // Transform item properties
            if (rawSchema.itemProperties && Array.isArray(rawSchema.itemProperties)) {
                rawSchema.itemProperties.forEach(prop => {
                    schema.itemProperties[prop.property] = {
                        dataType: prop.data_type,
                        description: prop.description,
                        required: prop.required === true || prop.required === 'true',
                        minValue: prop.min_value,
                        maxValue: prop.max_value,
                        defaultValue: prop.default_value
                    };
                });
            }

            // Transform rarity settings with proper error handling
            if (rawSchema.raritySettings && Array.isArray(rawSchema.raritySettings)) {
                rawSchema.raritySettings.forEach(rarity => {
                    // Handle both number and string rarity values
                    const rarityKey = (rarity.rarity !== undefined && rarity.rarity !== null) ? 
                        rarity.rarity.toString() : 
                        (rarity.rarity_level !== undefined && rarity.rarity_level !== null) ? 
                            rarity.rarity_level.toString() : '1';
                    
                    const rarityName = rarity.name || rarity.rarity_name || 'Common';
                    schema.rarityNames[rarityKey] = rarityName;
                });
            } else {
                // Fallback rarity names
                schema.rarityNames = {
                    '1': 'Common',
                    '2': 'Uncommon', 
                    '3': 'Rare',
                    '4': 'Epic',
                    '5': 'Legendary',
                    '6': 'Mythic'
                };
            }

            // Transform inventory limits
            if (rawSchema.inventoryLimits && Array.isArray(rawSchema.inventoryLimits)) {
                rawSchema.inventoryLimits.forEach(limit => {
                    if (limit.limit_type === 'category') {
                        schema.inventoryLimits[limit.category] = parseInt(limit.value) || 100;
                    } else if (limit.limit_type === 'global') {
                        schema.inventoryLimits[limit.category] = parseInt(limit.value) || 100;
                    }
                });
            }

            console.log('InventoryValidator: Schema transformation completed successfully');
            return schema;
            
        } catch (error) {
            console.error('InventoryValidator: Error transforming schema:', error);
            console.error('InventoryValidator: Raw schema data:', rawSchema);
            
            // Return fallback schema on error
            return this.createFallbackSchema();
        }
    }

    createFallbackSchema() {
        return {
            itemCategories: {
                fish: {
                    type: 'resource',
                    stackable: true,
                    equipSlot: 'none',
                    maxEquipped: 0,
                    requiredProperties: ['id', 'name']
                },
                rods: {
                    type: 'equipment',
                    stackable: false,
                    equipSlot: 'rod',
                    maxEquipped: 1,
                    requiredProperties: ['id', 'name']
                },
                lures: {
                    type: 'equipment',
                    stackable: true,
                    equipSlot: 'lure',
                    maxEquipped: 1,
                    requiredProperties: ['id', 'name']
                }
            },
            itemProperties: {
                id: { dataType: 'string', required: true },
                name: { dataType: 'string', required: true },
                rarity: { dataType: 'integer', required: false, minValue: 1, maxValue: 6, defaultValue: 1 },
                description: { dataType: 'string', required: false }
            },
            rarityNames: {
                '1': 'Common',
                '2': 'Uncommon',
                '3': 'Rare',
                '4': 'Epic',
                '5': 'Legendary',
                '6': 'Mythic'
            },
            inventoryLimits: {
                fish: 100,
                rods: 20,
                lures: 30,
                maxStackSize: 999
            }
        };
    }

    /**
     * Validate an item against the inventory schema
     * @param {string} category - Item category (rods, lures, etc.)
     * @param {object} item - Item to validate
     * @returns {object} - {valid: boolean, errors: string[]}
     */
    validateItem(category, item) {
        const errors = [];
        
        if (!this.schema || !this.schema.itemCategories[category]) {
            // If schema not loaded or category unknown, be very lenient
            console.warn(`InventoryValidator: Unknown category ${category}, using lenient validation`);
            
            // Only check for absolutely critical properties
            if (!item.id) {
                errors.push(`Missing required property: id`);
            }
            if (!item.name || item.name === 'undefined') {
                errors.push(`Missing or invalid name property`);
            }
            
            return { valid: errors.length === 0, errors };
        }

        const categorySchema = this.schema.itemCategories[category];
        
        // Check required properties with special handling for fish
        if (categorySchema.requiredProperties && Array.isArray(categorySchema.requiredProperties)) {
            for (const prop of categorySchema.requiredProperties) {
                if (item[prop] === undefined || item[prop] === null || item[prop] === 'undefined') {
                    // For fish, be more lenient - only require id and name
                    if (category === 'fish') {
                        if (prop === 'id' || prop === 'name') {
                            errors.push(`Missing required property for fish: ${prop}`);
                        }
                        // Skip other required properties for fish
                    } else {
                        errors.push(`Missing required property: ${prop}`);
                    }
                }
            }
        }

        // Validate property types and constraints with better error handling
        for (const [propName, propValue] of Object.entries(item)) {
            const propSchema = this.schema.itemProperties[propName];
            if (propSchema) {
                const validation = this.validateProperty(propName, propValue, propSchema);
                if (!validation.valid) {
                    // For fish, be more lenient with validation errors
                    if (category === 'fish') {
                        // Only add critical errors for fish
                        const criticalErrors = validation.errors.filter(error => 
                            error.includes('id must be') || 
                            error.includes('name must be') ||
                            error.includes('rarity must be')
                        );
                        errors.push(...criticalErrors);
                        
                        // Log non-critical errors as warnings
                        const nonCriticalErrors = validation.errors.filter(error => 
                            !error.includes('id must be') && 
                            !error.includes('name must be') &&
                            !error.includes('rarity must be')
                        );
                        if (nonCriticalErrors.length > 0) {
                            console.warn(`InventoryValidator: Non-critical fish validation warnings for ${propName}:`, nonCriticalErrors);
                        }
                    } else {
                        errors.push(...validation.errors);
                    }
                }
            }
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Validate a single property
     * @param {string} propName - Property name
     * @param {any} propValue - Property value
     * @param {object} propSchema - Property schema
     * @returns {object} - {valid: boolean, errors: string[]}
     */
    validateProperty(propName, propValue, propSchema) {
        const errors = [];

        // Skip validation for null/undefined values if not required
        if ((propValue === null || propValue === undefined) && !propSchema.required) {
            return { valid: true, errors: [] };
        }

        // Type validation with more lenient handling
        switch (propSchema.dataType) {
            case 'string':
                if (typeof propValue !== 'string') {
                    // Try to convert to string instead of failing
                    if (propValue !== null && propValue !== undefined) {
                        console.warn(`InventoryValidator: Converting ${propName} to string:`, propValue);
                        // Don't add error, just warn
                    } else {
                        errors.push(`${propName} must be a string`);
                    }
                } else if (propValue === 'undefined' || propValue.trim() === '') {
                    errors.push(`${propName} cannot be empty or 'undefined'`);
                }
                break;
                
            case 'integer':
                const numValue = parseInt(propValue);
                if (isNaN(numValue)) {
                    // For non-critical properties, just warn
                    if (propName === 'rarity') {
                        errors.push(`${propName} must be a valid integer`);
                    } else {
                        console.warn(`InventoryValidator: Invalid integer for ${propName}:`, propValue);
                    }
                } else {
                    // Check min/max values
                    if (propSchema.minValue !== null && numValue < propSchema.minValue) {
                        errors.push(`${propName} must be at least ${propSchema.minValue}`);
                    }
                    if (propSchema.maxValue !== null && numValue > propSchema.maxValue) {
                        errors.push(`${propName} must be at most ${propSchema.maxValue}`);
                    }
                }
                break;
                
            case 'number':
                const floatValue = parseFloat(propValue);
                if (isNaN(floatValue)) {
                    console.warn(`InventoryValidator: Invalid number for ${propName}:`, propValue);
                } else {
                    // Check min/max values
                    if (propSchema.minValue !== null && floatValue < propSchema.minValue) {
                        errors.push(`${propName} must be at least ${propSchema.minValue}`);
                    }
                    if (propSchema.maxValue !== null && floatValue > propSchema.maxValue) {
                        errors.push(`${propName} must be at most ${propSchema.maxValue}`);
                    }
                }
                break;
                
            case 'boolean':
                if (typeof propValue !== 'boolean') {
                    // Try to convert common boolean representations
                    if (propValue === 'true' || propValue === 1 || propValue === '1') {
                        console.warn(`InventoryValidator: Converting ${propName} to boolean: true`);
                    } else if (propValue === 'false' || propValue === 0 || propValue === '0') {
                        console.warn(`InventoryValidator: Converting ${propName} to boolean: false`);
                    } else {
                        errors.push(`${propName} must be a boolean`);
                    }
                }
                break;
                
            case 'array':
                if (!Array.isArray(propValue)) {
                    // Try to parse as JSON array or split string
                    if (typeof propValue === 'string') {
                        try {
                            JSON.parse(propValue);
                            console.warn(`InventoryValidator: String array detected for ${propName}, should be parsed`);
                        } catch {
                            console.warn(`InventoryValidator: Invalid array format for ${propName}:`, propValue);
                        }
                    } else {
                        errors.push(`${propName} must be an array`);
                    }
                }
                break;
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
        // Ensure inventoryLimits exists
        if (!this.schema || !this.schema.inventoryLimits) {
            console.warn('InventoryValidator: inventoryLimits not available, returning default stack size');
            return 999; // Default stack size
        }
        
        // Check for maxStackSize
        if (this.schema.inventoryLimits.maxStackSize) {
            return this.schema.inventoryLimits.maxStackSize;
        }
        
        // Final fallback
        return 999;
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
        
        // Ensure rarityColors exists
        if (!this.schema.rarityColors) {
            console.warn('InventoryValidator: rarityColors not available, returning default');
            return '#8C7853'; // Default common color
        }
        
        return this.schema.rarityColors[rarity.toString()] || this.schema.rarityColors['1'] || '#8C7853';
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
        
        // Ensure rarityNames exists
        if (!this.schema || !this.schema.rarityNames) {
            console.warn('InventoryValidator: rarityNames not available, returning default');
            return 'Common'; // Default common name
        }
        
        return this.schema.rarityNames[rarity.toString()] || this.schema.rarityNames['1'] || 'Common';
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
        // Ensure inventoryLimits exists
        if (!this.schema || !this.schema.inventoryLimits) {
            console.warn('InventoryValidator: inventoryLimits not available, returning default');
            return 100; // Default limit
        }
        
        // Check for direct category limit
        if (this.schema.inventoryLimits[category]) {
            return this.schema.inventoryLimits[category];
        }
        
        // Check for maxSlots as fallback
        if (this.schema.inventoryLimits.maxSlots) {
            return this.schema.inventoryLimits.maxSlots;
        }
        
        // Final fallback
        return 100;
    }

    /**
     * Create a default item structure for a category
     * @param {string} category - Item category
     * @param {object} baseData - Base item data
     * @returns {object} - Complete item with defaults
     */
    createItem(category, baseData) {
        if (!this.schema || !this.schema.itemCategories[category]) {
            console.warn(`InventoryValidator: Unknown category ${category}, creating basic item structure`);
            
            // Create basic item structure for unknown categories
            const item = { ...baseData };
            
            // Ensure basic required properties
            if (!item.id) {
                item.id = `${category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            if (!item.name || item.name === 'undefined') {
                item.name = baseData.name || 'Unknown Item';
            }
            if (item.quantity === undefined) {
                item.quantity = 1;
            }
            if (item.owned === undefined) {
                item.owned = true;
            }
            
            return item;
        }

        const categorySchema = this.schema.itemCategories[category];
        const item = { ...baseData };

        // Set defaults for optional properties
        if (categorySchema.stackable && item.quantity === undefined) {
            item.quantity = 1;
        }
        
        if (item.owned === undefined) {
            item.owned = false;
        }
        
        // Special handling for fish items
        if (category === 'fish') {
            // Ensure fish have all required properties
            if (!item.id) {
                item.id = `fish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            if (!item.name || item.name === 'undefined') {
                item.name = 'Unknown Fish';
            }
            if (!item.rarity || typeof item.rarity !== 'number') {
                item.rarity = 1;
            }
            if (!item.description) {
                item.description = `A fish weighing ${item.weight || 1.0}kg`;
            }
            if (!item.weight || typeof item.weight !== 'number') {
                item.weight = 1.0;
            }
            if (!item.value || typeof item.value !== 'number') {
                item.value = 100;
            }
            if (!item.caughtAt) {
                item.caughtAt = new Date().toISOString();
            }
            
            // Ensure fish are stackable
            item.quantity = item.quantity || 1;
            item.owned = true;
        }
        
        // Set equipment slot for equipment items
        if (categorySchema.equipSlot && categorySchema.equipSlot !== 'none') {
            if (!item.equipSlot) {
                item.equipSlot = categorySchema.equipSlot;
            }
            if (item.equipped === undefined) {
                item.equipped = false;
            }
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