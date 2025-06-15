const fs = require('fs');
const path = require('path');

console.log('🔄 CSV to JSON Converter');
console.log('========================');

// File mapping: CSV files to their corresponding JSON files
const FILE_MAPPINGS = {
    // Simple 1:1 mappings
    'rarity_reference.csv': 'rarityReference.json',
    'time_modifiers.csv': 'timeModifiers.json',
    'weather_modifiers.csv': 'weatherModifiers.json',
    'lure_types.csv': 'lureTypes.json',
    'struggle_patterns.csv': 'strugglePatterns.json',
    'game_config.csv': 'gameConfig.json',
    
    // Complex mappings (multiple CSV files to one JSON)
    'locations.csv': 'locations.json',
    
    // Multi-file mappings
    'fish_attributes.csv,attribute_modifiers.csv,player_attributes.csv': 'attributes.json',
    'fish_species.csv,struggle_styles.csv': 'fish.json',
    'fishing_rods.csv,boats.csv,clothing.csv,lures.csv': 'equipment.json',
    'quests.csv,quest_objectives.csv,quest_chains.csv,quest_categories.csv,quest_settings.csv': 'quests.json',
    'lures.csv,lure_types.csv': 'lures.json',
    'item_categories.csv,item_properties.csv,stat_properties.csv,rarity_settings.csv,inventory_limits.csv': 'inventorySchema.json'
};

function parseCsv(csvContent) {
    const lines = csvContent.trim().split('\n');
    const headers = [];
    const data = [];
    
    // Parse headers from first line
    const headerLine = lines[0];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < headerLine.length; i++) {
        const char = headerLine[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            headers.push(currentField.trim());
            currentField = '';
        } else {
            currentField += char;
        }
    }
    headers.push(currentField.trim()); // Add last field
    
    // Parse data lines
    for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const values = [];
        let currentValue = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim()); // Add last value
        
        // Create row object
        const row = {};
        headers.forEach((header, index) => {
            let value = values[index] || '';
            
            // Convert data types
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (value === 'null' || value === '') value = null;
            else if (!isNaN(value) && value !== '' && typeof value === 'string') value = Number(value);
            // Handle pipe-separated arrays
            else if (typeof value === 'string' && value.includes('|')) value = value.split('|');
            
            row[header] = value;
        });
        
        data.push(row);
    }
    
    return data;
}

function convertSimpleFile(csvFile, jsonFile) {
    try {
        const csvPath = path.join(__dirname, '../public/data_csv', csvFile);
        const jsonPath = path.join(__dirname, '../src/data', jsonFile);
        
        if (!fs.existsSync(csvPath)) {
            console.log(`⚠️  ${csvFile} not found, skipping...`);
            return false;
        }
        
        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const data = parseCsv(csvContent);
        
        let jsonData;
        
        // Special handling for game_config.csv
        if (csvFile === 'game_config.csv') {
            jsonData = {};
            
            // Group configuration items by category
            data.forEach(item => {
                const category = item.config_category;
                const name = item.config_name;
                const value = item.config_value;
                
                if (!jsonData[category]) {
                    jsonData[category] = {};
                }
                
                jsonData[category][name] = value;
            });
            
            console.log(`✅ ${csvFile} → ${jsonFile} (${Object.keys(jsonData).length} categories, ${data.length} config items)`);
        } else {
            // Standard handling for other files
            const rootKey = jsonFile.replace('.json', '');
            jsonData = { [rootKey]: data };
            console.log(`✅ ${csvFile} → ${jsonFile} (${data.length} items)`);
        }
        
        fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
        return true;
        
    } catch (error) {
        console.log(`❌ Error converting ${csvFile}: ${error.message}`);
        return false;
    }
}

function convertComplexFile(csvFiles, jsonFile) {
    try {
        const csvFileList = csvFiles.split(',');
        const jsonPath = path.join(__dirname, '../src/data', jsonFile);
        let jsonData = {};
        
        // Handle specific complex conversions
        switch (jsonFile) {
            case 'attributes.json':
                jsonData = convertAttributesFiles(csvFileList);
                break;
            case 'fish.json':
                jsonData = convertFishFiles(csvFileList);
                break;
            case 'equipment.json':
                jsonData = convertEquipmentFiles(csvFileList);
                break;
            case 'quests.json':
                jsonData = convertQuestFiles(csvFileList);
                break;
            case 'lures.json':
                jsonData = convertLureFiles(csvFileList);
                break;
            case 'inventorySchema.json':
                jsonData = convertInventoryFiles(csvFileList);
                break;
            case 'locations.json':
                jsonData = convertLocationsFile(csvFileList[0]);
                break;
            default:
                console.log(`❌ Unknown complex conversion: ${jsonFile}`);
                return false;
        }
        
        fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
        console.log(`✅ ${csvFiles} → ${jsonFile}`);
        return true;
        
    } catch (error) {
        console.log(`❌ Error converting ${csvFiles}: ${error.message}`);
        return false;
    }
}

function convertAttributesFiles(csvFiles) {
    const fishAttribs = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/fish_attributes.csv'), 'utf8'));
    const modifiers = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/attribute_modifiers.csv'), 'utf8'));
    const playerAttribs = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/player_attributes.csv'), 'utf8'));
    
    return {
        fishAttributes: fishAttribs,
        attributeModifiers: modifiers,
        playerAttributes: playerAttribs
    };
}

function convertFishFiles(csvFiles) {
    const species = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/fish_species.csv'), 'utf8'));
    const styles = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/struggle_styles.csv'), 'utf8'));
    
    // Convert back to original fish.json structure
    const fishSpecies = species.map(fish => ({
        ...fish,
        activeTimePeriod: fish.active_time_period ? fish.active_time_period.split('|') : [],
        weatherPreference: fish.weather_preference ? fish.weather_preference.split('|') : []
    }));
    
    const struggleStyles = styles.map(style => ({
        ...style,
        patterns: {
            directions: (style.patterns_directions && typeof style.patterns_directions === 'string') ? style.patterns_directions.split('|') : [],
            intensities: (style.patterns_intensities && typeof style.patterns_intensities === 'string') ? style.patterns_intensities.split('|').map(Number) : [],
            durations: (style.patterns_durations && typeof style.patterns_durations === 'string') ? style.patterns_durations.split('|').map(Number) : []
        }
    }));
    
    return {
        fishSpecies,
        struggleStyles
    };
}

function convertEquipmentFiles(csvFiles) {
    const rods = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/fishing_rods.csv'), 'utf8'));
    const boats = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/boats.csv'), 'utf8'));
    const clothing = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/clothing.csv'), 'utf8'));
    const lures = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/lures.csv'), 'utf8'));
    
    return {
        fishingRods: rods,
        boats,
        clothing,
        lures
    };
}

function convertQuestFiles(csvFiles) {
    const quests = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/quests.csv'), 'utf8'));
    const objectives = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/quest_objectives.csv'), 'utf8'));
    const chains = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/quest_chains.csv'), 'utf8'));
    const categories = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/quest_categories.csv'), 'utf8'));
    const settings = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/quest_settings.csv'), 'utf8'));
    

    
    // Convert flat quest data back to the structure QuestDataLoader expects
    
    // 1. Organize quests by category for questTemplates
    const questTemplates = {
        story: [],
        npc: [],
        daily: [],
        weekly: [],
        event: []
    };
    
    // 2. Process each quest and add objectives
    quests.forEach(quest => {
        // Find objectives for this quest
        const questObjectives = objectives.filter(obj => obj.quest_id === quest.quest_id);
        
        // Convert CSV format back to original quest structure
        const processedQuest = {
            id: quest.quest_id,
            type: quest.type,
            title: quest.title,
            description: quest.description,
            priority: quest.priority,
            autoStart: quest.auto_start === 'true' || quest.auto_start === true,
            giver: quest.giver || null,
            turnInTo: quest.turn_in_to || null,
            timeType: quest.time_type || null,
            expiresIn: quest.expires_in ? parseInt(quest.expires_in) : null,
            eventId: quest.event_id || null,
            startDate: quest.start_date || null,
            endDate: quest.end_date || null,
            
            // Convert flattened rewards back to nested structure
            rewards: {},
            
            // Convert requirements and unlocks
            requirements: (quest.requirements && quest.requirements !== '' && quest.requirements !== '0') ? 
                (quest.requirements.includes('|') ? quest.requirements.split('|') : [quest.requirements]) : [],
            unlocks: (quest.unlocks && quest.unlocks !== '' && quest.unlocks !== '0') ? 
                (quest.unlocks.includes('|') ? quest.unlocks.split('|') : [quest.unlocks]) : [],
            
            // Convert variables back to object format
            variables: quest.variables ? parseVariables(quest.variables) : null,
            
            // Add objectives
            objectives: questObjectives.map(obj => ({
                id: obj.objective_id,
                description: obj.description,
                type: obj.type,
                target: obj.target,
                progress: obj.progress || 0,
                completed: obj.completed === 'true' || obj.completed === true,
                species: obj.species || null,
                location: obj.location || null,
                npc: obj.npc || null,
                timeRange: obj.time_range_start && obj.time_range_end ? {
                    start: obj.time_range_start,
                    end: obj.time_range_end
                } : null,
                minRarity: obj.min_rarity || null,
                value: obj.value ? parseInt(obj.value) : null
            }))
        };
        
        // Build rewards object
        if (quest.reward_coins && quest.reward_coins !== '0' && quest.reward_coins !== '') {
            processedQuest.rewards.coins = parseInt(quest.reward_coins);
        }
        if (quest.reward_experience && quest.reward_experience !== '0' && quest.reward_experience !== '') {
            processedQuest.rewards.experience = parseInt(quest.reward_experience);
        }
        if (quest.reward_items && quest.reward_items !== '' && quest.reward_items !== '0') {
            processedQuest.rewards.items = quest.reward_items.includes('|') ? 
                quest.reward_items.split('|') : [quest.reward_items];
        }
        if (quest.reward_achievements && quest.reward_achievements !== '0' && quest.reward_achievements !== '') {
            processedQuest.rewards.achievements = typeof quest.reward_achievements === 'string' ? 
                quest.reward_achievements.split('|') : [quest.reward_achievements];
        }
        if (quest.reward_title && quest.reward_title !== '' && quest.reward_title !== '0') {
            processedQuest.rewards.title = quest.reward_title;
        }
        
        // Romance rewards
        const romance = {};
        if (quest.reward_romance_mia && quest.reward_romance_mia !== '0') romance.mia = parseInt(quest.reward_romance_mia);
        if (quest.reward_romance_sophie && quest.reward_romance_sophie !== '0') romance.sophie = parseInt(quest.reward_romance_sophie);
        if (quest.reward_romance_luna && quest.reward_romance_luna !== '0') romance.luna = parseInt(quest.reward_romance_luna);
        if (Object.keys(romance).length > 0) processedQuest.rewards.romance = romance;
        
        // Add to appropriate category
        const category = quest.category || 'story';
        if (questTemplates[category]) {
            questTemplates[category].push(processedQuest);
        } else {
            console.warn(`Unknown quest category: ${category}, adding to story`);
            questTemplates.story.push(processedQuest);
        }
    });
    
    // 3. Process quest categories into object format
    const questCategoriesObj = {};
    categories.forEach(cat => {
        questCategoriesObj[cat.category_id] = {
            name: cat.name,
            description: cat.description,
            color: cat.color,
            icon: cat.icon,
            priority: parseInt(cat.priority)
        };
    });
    
    // 4. Process quest settings into object format
    const questSettingsObj = {};
    settings.forEach(setting => {
        const key = setting.setting_key || setting.setting_name;
        if (key) {
            questSettingsObj[key] = parseSettingValue(setting.setting_value);
        }
    });
    
    // 5. Process quest chains
    const processedChains = chains.map(chain => ({
        id: chain.chain_id,
        name: chain.name,
        description: chain.description,
        category: chain.category || 'general',
        quests: (chain.quest_ids && chain.quest_ids !== '' && chain.quest_ids !== '0') ? 
            (Array.isArray(chain.quest_ids) ? 
                chain.quest_ids.map(id => ({ id: id.trim() })) : 
                chain.quest_ids.split('|').map(id => ({ id: id.trim() }))) : [],
        rewards: {
            coins: (chain.chain_reward_coins && chain.chain_reward_coins !== '' && chain.chain_reward_coins !== '0') ? 
                parseInt(chain.chain_reward_coins) : 0,
            experience: (chain.chain_reward_experience && chain.chain_reward_experience !== '' && chain.chain_reward_experience !== '0') ? 
                parseInt(chain.chain_reward_experience) : 0,
            items: (chain.chain_reward_items && chain.chain_reward_items !== '' && chain.chain_reward_items !== '0') ? 
                (Array.isArray(chain.chain_reward_items) ? chain.chain_reward_items : chain.chain_reward_items.split('|')) : [],
            achievements: (chain.chain_reward_achievements && chain.chain_reward_achievements !== '' && chain.chain_reward_achievements !== '0') ? 
                (Array.isArray(chain.chain_reward_achievements) ? chain.chain_reward_achievements : chain.chain_reward_achievements.split('|')) : [],
            title: (chain.chain_reward_title && chain.chain_reward_title !== '' && chain.chain_reward_title !== '0') ? 
                chain.chain_reward_title : null,
            romance: {}
        }
    }));
    
    // Add romance rewards to chains
    processedChains.forEach(chain => {
        const originalChain = chains.find(c => c.chain_id === chain.id);
        if (originalChain) {
            if (originalChain.chain_reward_romance_mia && originalChain.chain_reward_romance_mia !== '0') {
                chain.rewards.romance.mia = parseInt(originalChain.chain_reward_romance_mia);
            }
            if (originalChain.chain_reward_romance_sophie && originalChain.chain_reward_romance_sophie !== '0') {
                chain.rewards.romance.sophie = parseInt(originalChain.chain_reward_romance_sophie);
            }
            if (originalChain.chain_reward_romance_luna && originalChain.chain_reward_romance_luna !== '0') {
                chain.rewards.romance.luna = parseInt(originalChain.chain_reward_romance_luna);
            }
        }
    });
    
    return {
        questTemplates,
        questChains: processedChains,
        questCategories: questCategoriesObj,
        questSettings: questSettingsObj
    };
}

// Helper function to parse variables from CSV format
function parseVariables(variablesStr) {
    if (!variablesStr || variablesStr === '' || variablesStr === '0') return null;
    
    // Handle case where variablesStr is not a string
    if (typeof variablesStr !== 'string') return null;
    
    const variables = {};
    const pairs = variablesStr.split(',');
    
    pairs.forEach(pair => {
        const [key, values] = pair.split(':');
        if (key && values) {
            variables[key.trim()] = values.includes('|') ? values.split('|') : [values];
        }
    });
    
    return Object.keys(variables).length > 0 ? variables : null;
}

// Helper function to parse setting values with proper type conversion
function parseSettingValue(value) {
    if (!value || value === '') return '';
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(value) && value !== '' && typeof value === 'string') return parseInt(value);
    return value;
}

function convertLureFiles(csvFiles) {
    const lures = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/lures.csv'), 'utf8'));
    const types = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/lure_types.csv'), 'utf8'));
    
    return {
        lures,
        lureTypes: types
    };
}

function convertInventoryFiles(csvFiles) {
    const categories = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/item_categories.csv'), 'utf8'));
    const properties = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/item_properties.csv'), 'utf8'));
    const stats = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/stat_properties.csv'), 'utf8'));
    const rarity = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/rarity_settings.csv'), 'utf8'));
    const limits = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/inventory_limits.csv'), 'utf8'));
    
    return {
        itemCategories: categories,
        itemProperties: properties,
        statProperties: stats,
        raritySettings: rarity,
        inventoryLimits: limits
    };
}

function convertLocationsFile(csvFile) {
    const locations = parseCsv(fs.readFileSync(path.join(__dirname, '../public/data_csv/locations.csv'), 'utf8'));
    
    // Convert back to original locations.json structure
    return {
        locations: locations.map(loc => ({
            ...loc,
            availableFish: loc.available_fish ? loc.available_fish.split('|') : [],
            weatherConditions: loc.weather_conditions ? loc.weather_conditions.split('|') : [],
            timeRestrictions: loc.time_restrictions ? loc.time_restrictions.split('|') : [],
            requiredEquipment: loc.required_equipment ? loc.required_equipment.split('|') : []
        }))
    };
}

// Main conversion function
function convertAllFiles() {
    console.log('🚀 Starting CSV to JSON conversion...\n');
    
    let successCount = 0;
    let totalCount = 0;
    
    Object.entries(FILE_MAPPINGS).forEach(([csvFiles, jsonFile]) => {
        totalCount++;
        
        if (csvFiles.includes(',')) {
            // Complex conversion (multiple CSV files)
            if (convertComplexFile(csvFiles, jsonFile)) {
                successCount++;
            }
        } else {
            // Simple conversion (single CSV file)
            if (convertSimpleFile(csvFiles, jsonFile)) {
                successCount++;
            }
        }
    });
    
    console.log(`\n🎯 Conversion Summary:`);
    console.log(`✅ Success: ${successCount}/${totalCount} files`);
    console.log(`${successCount === totalCount ? '🚀 All conversions completed successfully!' : '⚠️  Some conversions failed'}`);
}

// Run conversion if called directly
if (require.main === module) {
    convertAllFiles();
}

module.exports = { convertAllFiles, parseCsv }; 