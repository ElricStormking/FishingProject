#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Simple script to remove excessive debug logging
 */

// Patterns to remove (these are typically excessive debug logs)
const REMOVE_PATTERNS = [
    // Verbose initialization logs
    /console\.log\(['"`].*: Initialized.*['"`]\);?\s*\n/g,
    /console\.log\(['"`].*: Created.*successfully['"`]\);?\s*\n/g,
    /console\.log\(['"`].*: Starting.*['"`]\);?\s*\n/g,
    /console\.log\(['"`].*: Entered.*phase['"`]\);?\s*\n/g,
    
    // Verbose state change logs
    /console\.log\(['"`].*: Synchronized.*['"`].*\);?\s*\n/g,
    /console\.log\(['"`].*: Location updated.*['"`].*\);?\s*\n/g,
    /console\.log\(['"`].*: Quest manager available.*['"`].*\);?\s*\n/g,
    
    // Excessive quest tracking logs
    /console\.log\(['"`].*Quest \d+:.*['"`].*\);?\s*\n/g,
    /console\.log\(['"`].*Objective \d+:.*['"`].*\);?\s*\n/g,
    /console\.log\(['"`].*Found \d+ active quests['"`]\);?\s*\n/g,
    /console\.log\(['"`].*Displaying \d+ quests.*['"`].*\);?\s*\n/g,
    
    // UI creation logs
    /console\.log\(['"`].*UI component created.*['"`]\);?\s*\n/g,
    /console\.log\(['"`].*interface opened['"`]\);?\s*\n/g,
    /console\.log\(['"`].*interface closed['"`]\);?\s*\n/g,
    /console\.log\(['"`].*destroyed['"`]\);?\s*\n/g,
    
    // Debug tool logs (keep these but reduce verbosity)
    /console\.log\(['"`].*Debug.*created.*['"`]\);?\s*\n/g,
    /console\.log\(['"`].*Debug.*shown.*['"`]\);?\s*\n/g,
    /console\.log\(['"`].*Debug.*hidden.*['"`]\);?\s*\n/g,
];

// Patterns to convert to conditional logging (only in dev mode)
const CONDITIONAL_PATTERNS = [
    // Keep important state changes but make them conditional
    {
        pattern: /console\.log\((['"`].*: (?:Level up|Boss fight|Collection milestone).*['"`].*)\);?/g,
        replacement: "if (import.meta.env.DEV) console.log($1);"
    },
    {
        pattern: /console\.log\((['"`].*: (?:Traveling to|Successfully caught).*['"`].*)\);?/g,
        replacement: "if (import.meta.env.DEV) console.log($1);"
    }
];

// Files to exclude from cleanup
const EXCLUDE_FILES = [
    'test_boss_fish.js',
    'debug_new_game_fix_test.js',
    'debug_new_game_test.js',
    'debug_save_checker.js',
    'Logger.js',
    'remove-debug-logs.js'
];

function shouldExcludeFile(filePath) {
    const fileName = path.basename(filePath);
    return EXCLUDE_FILES.includes(fileName);
}

function cleanFile(filePath) {
    if (shouldExcludeFile(filePath)) {
        return { processed: false, reason: 'excluded' };
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        let removedCount = 0;
        let conditionalCount = 0;

        // Remove excessive debug logs
        REMOVE_PATTERNS.forEach(pattern => {
            const matches = newContent.match(pattern);
            if (matches) {
                removedCount += matches.length;
                newContent = newContent.replace(pattern, '');
            }
        });

        // Convert some logs to conditional
        CONDITIONAL_PATTERNS.forEach(({ pattern, replacement }) => {
            const matches = newContent.match(pattern);
            if (matches) {
                conditionalCount += matches.length;
                newContent = newContent.replace(pattern, replacement);
            }
        });

        // Clean up multiple empty lines
        newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');

        if (removedCount > 0 || conditionalCount > 0) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            return { 
                processed: true, 
                changes: 'modified', 
                removed: removedCount, 
                conditional: conditionalCount 
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
        totalConditional: 0
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
                const result = cleanFile(itemPath);

                if (result.processed) {
                    results.processed++;
                    if (result.changes === 'modified') {
                        results.modified++;
                        results.totalRemoved += result.removed || 0;
                        results.totalConditional += result.conditional || 0;
                        console.log(`✅ Cleaned: ${itemPath} (removed: ${result.removed || 0}, conditional: ${result.conditional || 0})`);
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
    console.log('🧹 Starting debug log cleanup...\n');

    const srcPath = path.join(process.cwd(), 'src');

    if (!fs.existsSync(srcPath)) {
        console.error('❌ src directory not found. Please run this script from the project root.');
        process.exit(1);
    }

    const results = processDirectory(srcPath);

    console.log('\n📊 Cleanup Results:');
    console.log(`   Files processed: ${results.processed}`);
    console.log(`   Files modified: ${results.modified}`);
    console.log(`   Files skipped: ${results.skipped}`);
    console.log(`   Errors: ${results.errors}`);
    console.log(`   Debug logs removed: ${results.totalRemoved}`);
    console.log(`   Logs made conditional: ${results.totalConditional}`);

    if (results.modified > 0) {
        console.log('\n✅ Debug log cleanup completed!');
        console.log('💡 Benefits:');
        console.log('   - Reduced console noise in production');
        console.log('   - Improved performance (fewer string operations)');
        console.log('   - Cleaner development experience');
        console.log('\n🔧 Important logs are now conditional on DEV mode');
    } else {
        console.log('\n✨ No excessive debug logs found.');
    }
}

if (require.main === module) {
    main();
}

module.exports = { cleanFile, processDirectory }; 