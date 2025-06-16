#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Aggressive log cleanup script to achieve 50% reduction
 * Target: Reduce from ~3,000 to ~1,500 console statements
 */

// Files to exclude from cleanup (debug tools, test files, etc.)
const EXCLUDE_FILES = [
    'test_boss_fish.js',
    'debug_new_game_fix_test.js',
    'debug_new_game_test.js',
    'debug_save_checker.js',
    'RenJsDebugUI.js',
    'QTEDebugTool.js',
    'LuringDebugTool.js',
    'FishTuningTool.js',
    'Logger.js',
    'renjs.js', // Third-party library
    'aggressive-log-cleanup.js'
];

// Patterns to remove completely (aggressive cleanup)
const REMOVE_PATTERNS = [
    // Verbose initialization and creation logs
    /console\.log\(['"`][^'"`]*(?:Initialized|Created|Starting|Entered|Updated|Refreshing|Processing|Loading|Loaded|Found|Added|Removed|Setting|Getting).*['"`][^)]*\);?\s*\n/g,
    
    // State synchronization logs
    /console\.log\(['"`][^'"`]*(?:Synchronized|Location updated|Quest manager available|Event listeners|Global event).*['"`][^)]*\);?\s*\n/g,
    
    // Excessive quest tracking logs
    /console\.log\(['"`][^'"`]*Quest \d+:.*['"`][^)]*\);?\s*\n/g,
    /console\.log\(['"`][^'"`]*Objective \d+:.*['"`][^)]*\);?\s*\n/g,
    /console\.log\(['"`][^'"`]*Found \d+ (?:active )?quests.*['"`][^)]*\);?\s*\n/g,
    /console\.log\(['"`][^'"`]*Displaying \d+ quests.*['"`][^)]*\);?\s*\n/g,
    
    // UI lifecycle logs
    /console\.log\(['"`][^'"`]*(?:interface opened|interface closed|panel opened|panel closed|UI component|button clicked|menu).*['"`][^)]*\);?\s*\n/g,
    
    // Verbose component logs
    /console\.log\(['"`][^'"`]*(?:destroyed|cleanup|event received|event triggered|display refresh|container|element).*['"`][^)]*\);?\s*\n/g,
    
    // Audio and visual effect logs
    /console\.log\(['"`][^'"`]*(?:Audio|Sound|Music|Effect|Animation|Tween|Visual).*['"`][^)]*\);?\s*\n/g,
    
    // Inventory and equipment verbose logs
    /console\.log\(['"`][^'"`]*(?:Equipment|Inventory|Item|Slot|Category|Filter|Sort).*(?:updated|refreshed|selected|equipped|unequipped).*['"`][^)]*\);?\s*\n/g,
    
    // Scene transition logs
    /console\.log\(['"`][^'"`]*(?:Scene|Camera|Transition|Switch|Navigate).*['"`][^)]*\);?\s*\n/g,
    
    // Data loading verbose logs
    /console\.log\(['"`][^'"`]*(?:Data|JSON|CSV|File|Resource).*(?:loaded|parsed|converted|validated).*['"`][^)]*\);?\s*\n/g,
];

// Patterns to convert to conditional logging (keep important ones in DEV)
const CONDITIONAL_PATTERNS = [
    // Keep important game events but make them conditional
    {
        pattern: /console\.log\((['"`][^'"`]*(?:Level up|Boss fight|Collection milestone|Achievement|Victory|Defeat|Critical|Success).*['"`][^)]*)\);?/g,
        replacement: "if (import.meta.env.DEV) console.log($1);"
    },
    {
        pattern: /console\.log\((['"`][^'"`]*(?:Traveling to|Successfully caught|Fish hooked|Cast successful|Reel).*['"`][^)]*)\);?/g,
        replacement: "if (import.meta.env.DEV) console.log($1);"
    },
    {
        pattern: /console\.log\((['"`][^'"`]*(?:Quest completed|Quest started|Objective completed).*['"`][^)]*)\);?/g,
        replacement: "if (import.meta.env.DEV) console.log($1);"
    }
];

// Patterns to convert to Logger system
const LOGGER_CONVERSION_PATTERNS = [
    // Convert remaining console.log to Logger.debug
    {
        pattern: /console\.log\((['"`][^'"`]*[^'"`]*['"`](?:,.*)?)\);?/g,
        replacement: "this.logger?.debug($1) || Logger.debug(this.constructor.name, $1);"
    }
];

// High-priority files for aggressive cleanup (most verbose)
const HIGH_PRIORITY_FILES = [
    'BoatMenuScene.js',
    'GameScene.js',
    'InventoryManager.js',
    'CabinScene.js',
    'InventoryUI.js',
    'PlayerController.js',
    'GameState.js',
    'ReelingMiniGame.js',
    'QuestManager.js',
    'CastingMiniGame.js'
];

function shouldExcludeFile(filePath) {
    const fileName = path.basename(filePath);
    return EXCLUDE_FILES.includes(fileName);
}

function isHighPriorityFile(filePath) {
    const fileName = path.basename(filePath);
    return HIGH_PRIORITY_FILES.includes(fileName);
}

function aggressiveCleanFile(filePath) {
    if (shouldExcludeFile(filePath)) {
        return { processed: false, reason: 'excluded' };
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        let removedCount = 0;
        let conditionalCount = 0;
        let loggerConvertedCount = 0;

        const isHighPriority = isHighPriorityFile(filePath);

        // Step 1: Remove excessive debug logs
        REMOVE_PATTERNS.forEach(pattern => {
            const matches = newContent.match(pattern);
            if (matches) {
                removedCount += matches.length;
                newContent = newContent.replace(pattern, '');
            }
        });

        // Step 2: Convert important logs to conditional
        CONDITIONAL_PATTERNS.forEach(({ pattern, replacement }) => {
            const matches = newContent.match(pattern);
            if (matches) {
                conditionalCount += matches.length;
                newContent = newContent.replace(pattern, replacement);
            }
        });

        // Step 3: For high-priority files, be more aggressive
        if (isHighPriority) {
            // Remove even more verbose patterns for high-priority files
            const aggressivePatterns = [
                /console\.log\(['"`][^'"`]*:.*['"`][^)]*\);?\s*\n/g, // Any log with module prefix
                /console\.log\(['"`][^'"`]*\s*['"`]\);?\s*\n/g, // Empty or whitespace-only logs
                /console\.log\(['"`][^'"`]*\.\.\.[^'"`]*['"`][^)]*\);?\s*\n/g, // Logs with "..."
                /console\.log\(['"`][^'"`]*✅[^'"`]*['"`][^)]*\);?\s*\n/g, // Success emoji logs
                /console\.log\(['"`][^'"`]*🔄[^'"`]*['"`][^)]*\);?\s*\n/g, // Refresh emoji logs
                /console\.log\(['"`][^'"`]*🚫[^'"`]*['"`][^)]*\);?\s*\n/g, // Disabled emoji logs
            ];

            aggressivePatterns.forEach(pattern => {
                const matches = newContent.match(pattern);
                if (matches) {
                    removedCount += matches.length;
                    newContent = newContent.replace(pattern, '');
                }
            });
        }

        // Step 4: Add Logger import if needed and console.log statements remain
        const hasRemainingLogs = /console\.log/.test(newContent);
        const hasLoggerImport = /import.*Logger.*from/.test(newContent);
        
        if (hasRemainingLogs && !hasLoggerImport && !shouldExcludeFile(filePath)) {
            // Find the last import statement
            const importRegex = /^import .+;$/gm;
            const imports = newContent.match(importRegex);
            
            if (imports && imports.length > 0) {
                const lastImport = imports[imports.length - 1];
                const lastImportIndex = newContent.lastIndexOf(lastImport);
                const insertIndex = lastImportIndex + lastImport.length;
                
                // Determine the correct import path
                const relativePath = path.relative(path.dirname(filePath), path.join('src', 'utils', 'Logger.js'));
                const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
                
                newContent = newContent.slice(0, insertIndex) + 
                           `\nimport Logger from '${importPath.replace(/\\/g, '/')}';` + 
                           newContent.slice(insertIndex);
            }
        }

        // Step 5: Convert remaining console.log to Logger (less aggressive)
        if (isHighPriority) {
            LOGGER_CONVERSION_PATTERNS.forEach(({ pattern, replacement }) => {
                const matches = newContent.match(pattern);
                if (matches) {
                    loggerConvertedCount += matches.length;
                    newContent = newContent.replace(pattern, replacement);
                }
            });
        }

        // Clean up multiple empty lines
        newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');

        if (removedCount > 0 || conditionalCount > 0 || loggerConvertedCount > 0) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            return { 
                processed: true, 
                changes: 'modified', 
                removed: removedCount, 
                conditional: conditionalCount,
                loggerConverted: loggerConvertedCount,
                isHighPriority: isHighPriority
            };
        }

        return { processed: true, changes: 'none' };

    } catch (error) {
        return { processed: false, reason: 'error', error: error.message };
    }
}

function processDirectory(dirPath) {
    const results = {
        processed: 0,
        modified: 0,
        skipped: 0,
        errors: 0,
        totalRemoved: 0,
        totalConditional: 0,
        totalLoggerConverted: 0,
        highPriorityFiles: 0
    };

    function walkDir(currentPath) {
        const items = fs.readdirSync(currentPath);

        for (const item of items) {
            const itemPath = path.join(currentPath, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                if (!['node_modules', '.git', 'test', 'docs'].includes(item)) {
                    walkDir(itemPath);
                }
            } else if (stat.isFile() && item.endsWith('.js')) {
                const result = aggressiveCleanFile(itemPath);

                if (result.processed) {
                    results.processed++;
                    if (result.changes === 'modified') {
                        results.modified++;
                        results.totalRemoved += result.removed || 0;
                        results.totalConditional += result.conditional || 0;
                        results.totalLoggerConverted += result.loggerConverted || 0;
                        
                        if (result.isHighPriority) {
                            results.highPriorityFiles++;
                        }
                        
                        const priority = result.isHighPriority ? '🎯 HIGH PRIORITY' : '✅';
                        console.log(`${priority} Cleaned: ${itemPath}`);
                        console.log(`   Removed: ${result.removed || 0}, Conditional: ${result.conditional || 0}, Logger: ${result.loggerConverted || 0}`);
                    }
                } else {
                    if (result.reason === 'excluded') {
                        results.skipped++;
                    } else {
                        results.errors++;
                        console.error(`❌ Error: ${itemPath} - ${result.error}`);
                    }
                }
            }
        }
    }

    walkDir(dirPath);
    return results;
}

function main() {
    console.log('🚀 Starting AGGRESSIVE log cleanup for 50% reduction...\n');
    console.log('🎯 Target: Reduce from ~3,000 to ~1,500 console statements\n');

    const srcPath = path.join(process.cwd(), 'src');

    if (!fs.existsSync(srcPath)) {
        console.error('❌ src directory not found. Please run this script from the project root.');
        process.exit(1);
    }

    const results = processDirectory(srcPath);

    console.log('\n📊 Aggressive Cleanup Results:');
    console.log(`   Files processed: ${results.processed}`);
    console.log(`   Files modified: ${results.modified}`);
    console.log(`   High-priority files cleaned: ${results.highPriorityFiles}`);
    console.log(`   Files skipped: ${results.skipped}`);
    console.log(`   Errors: ${results.errors}`);
    console.log(`   Debug logs removed: ${results.totalRemoved}`);
    console.log(`   Logs made conditional: ${results.totalConditional}`);
    console.log(`   Logs converted to Logger: ${results.totalLoggerConverted}`);

    const totalReduction = results.totalRemoved + results.totalLoggerConverted;
    console.log(`\n🎯 Total reduction: ${totalReduction} console statements`);

    if (results.modified > 0) {
        console.log('\n✅ Aggressive cleanup completed!');
        console.log('💡 Benefits:');
        console.log('   - Massive reduction in console noise');
        console.log('   - Improved performance (fewer string operations)');
        console.log('   - Cleaner development experience');
        console.log('   - Professional production output');
        console.log('\n🔧 Important logs are now conditional on DEV mode');
        console.log('📝 Run the count script to verify reduction: node count-console-logs.js');
    } else {
        console.log('\n✨ No files needed aggressive modification.');
    }
}

if (require.main === module) {
    main();
}

module.exports = { aggressiveCleanFile, processDirectory }; 