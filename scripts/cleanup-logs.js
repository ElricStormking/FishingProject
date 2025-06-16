#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to clean up excessive console logging and replace with centralized Logger
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
    'cleanup-logs.js'
];

// Directories to exclude
const EXCLUDE_DIRS = [
    'node_modules',
    '.git',
    'test',
    'docs'
];

// Module name mapping based on file names
const MODULE_MAPPING = {
    'GameLoop.js': 'GameLoop',
    'GameState.js': 'GameState',
    'PlayerController.js': 'PlayerController',
    'InventoryManager.js': 'InventoryManager',
    'AudioManager.js': 'AudioManager',
    'DataLoader.js': 'DataLoader',
    'QuestManager.js': 'QuestManager',
    'CraftingManager.js': 'CraftingManager',
    'WeatherManager.js': 'WeatherManager',
    'TimeManager.js': 'TimeManager',
    'LocationManager.js': 'LocationManager',
    'GameScene.js': 'GameScene',
    'BoatMenuScene.js': 'BoatMenuScene',
    'MenuScene.js': 'MenuScene',
    'ShopScene.js': 'ShopScene',
    'CabinScene.js': 'CabinScene',
    'DialogScene.js': 'DialogScene',
    'QuestScene.js': 'QuestScene',
    'AlbumScene.js': 'AlbumScene',
    'SettingsScene.js': 'SettingsScene',
    'PreloadScene.js': 'PreloadScene',
    'HUDScene.js': 'HUDScene',
    'InventoryUI.js': 'InventoryUI',
    'ShopUI.js': 'ShopUI',
    'CraftingUI.js': 'CraftingUI',
    'PlayerProgressionUI.js': 'PlayerProgressionUI',
    'QuestTrackerUI.js': 'QuestTrackerUI',
    'TimeWeatherUI.js': 'TimeWeatherUI',
    'UITheme.js': 'UITheme'
};

// Log level mapping for different console methods
const LOG_LEVEL_MAPPING = {
    'console.error': 'error',
    'console.warn': 'warn',
    'console.info': 'info',
    'console.log': 'debug',
    'console.debug': 'debug'
};

function shouldExcludeFile(filePath) {
    const fileName = path.basename(filePath);
    return EXCLUDE_FILES.includes(fileName);
}

function shouldExcludeDir(dirPath) {
    const dirName = path.basename(dirPath);
    return EXCLUDE_DIRS.includes(dirName);
}

function getModuleName(filePath) {
    const fileName = path.basename(filePath);
    return MODULE_MAPPING[fileName] || fileName.replace('.js', '');
}

function processFile(filePath) {
    if (shouldExcludeFile(filePath)) {
        console.log(`Skipping excluded file: ${filePath}`);
        return { processed: false, reason: 'excluded' };
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const moduleName = getModuleName(filePath);
        
        let modified = false;
        let newContent = content;
        
        // Check if Logger is already imported
        const hasLoggerImport = content.includes("import Logger from") || content.includes("import { Logger }");
        
        // Add Logger import if not present and console statements exist
        const hasConsoleStatements = /console\.(log|warn|error|info|debug)/.test(content);
        
        if (hasConsoleStatements && !hasLoggerImport) {
            // Find the last import statement
            const importRegex = /^import .+;$/gm;
            const imports = content.match(importRegex);
            
            if (imports && imports.length > 0) {
                const lastImport = imports[imports.length - 1];
                const lastImportIndex = content.lastIndexOf(lastImport);
                const insertIndex = lastImportIndex + lastImport.length;
                
                // Determine the correct import path
                const relativePath = path.relative(path.dirname(filePath), path.join('src', 'utils', 'Logger.js'));
                const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
                
                newContent = content.slice(0, insertIndex) + 
                           `\nimport Logger from '${importPath.replace(/\\/g, '/')}';` + 
                           content.slice(insertIndex);
                modified = true;
            }
        }
        
        // Add logger instance to class constructors if needed
        if (hasConsoleStatements && !content.includes('this.logger = ')) {
            // Look for class constructors
            const constructorRegex = /constructor\s*\([^)]*\)\s*{/g;
            let match;
            
            while ((match = constructorRegex.exec(newContent)) !== null) {
                const constructorStart = match.index + match[0].length;
                
                // Find the end of the first few lines to insert logger
                const afterConstructor = newContent.slice(constructorStart);
                const firstStatements = afterConstructor.split('\n').slice(0, 5).join('\n');
                
                if (!firstStatements.includes('this.logger = ')) {
                    // Insert logger creation after the first line in constructor
                    const firstLineEnd = afterConstructor.indexOf('\n');
                    if (firstLineEnd > 0) {
                        const loggerLine = `\n        this.logger = Logger.createModuleLogger('${moduleName}');`;
                        newContent = newContent.slice(0, constructorStart + firstLineEnd) + 
                                   loggerLine + 
                                   newContent.slice(constructorStart + firstLineEnd);
                        modified = true;
                        break; // Only add to first constructor found
                    }
                }
            }
        }
        
        // Replace console statements with logger calls
        const consoleRegex = /console\.(log|warn|error|info|debug)\s*\(\s*(['"`])[^'"`]*\2[^)]*\)/g;
        
        newContent = newContent.replace(consoleRegex, (match, method, quote) => {
            const logLevel = LOG_LEVEL_MAPPING[`console.${method}`] || 'debug';
            
            // Extract the message and arguments
            const argsStart = match.indexOf('(') + 1;
            const argsEnd = match.lastIndexOf(')');
            const args = match.slice(argsStart, argsEnd);
            
            // Check if it's a simple string message or has module prefix
            if (args.includes(`${moduleName}:`)) {
                // Remove module prefix since logger will add it
                const cleanArgs = args.replace(new RegExp(`${quote}[^${quote}]*${moduleName}:\\s*`, 'g'), quote);
                modified = true;
                return `this.logger.${logLevel}(${cleanArgs})`;
            } else {
                modified = true;
                return `this.logger.${logLevel}(${args})`;
            }
        });
        
        // Handle static console calls (for classes without instances)
        newContent = newContent.replace(/console\.(log|warn|error|info|debug)/g, (match, method) => {
            const logLevel = LOG_LEVEL_MAPPING[match] || 'debug';
            if (!newContent.includes('this.logger')) {
                modified = true;
                return `Logger.${logLevel}('${moduleName}',`;
            }
            return match;
        });
        
        if (modified) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            return { processed: true, changes: 'modified' };
        }
        
        return { processed: true, changes: 'none' };
        
    } catch (error) {
        console.error(`Error processing file ${filePath}:`, error.message);
        return { processed: false, reason: 'error', error: error.message };
    }
}

function processDirectory(dirPath) {
    const results = {
        processed: 0,
        modified: 0,
        skipped: 0,
        errors: 0
    };
    
    function walkDir(currentPath) {
        const items = fs.readdirSync(currentPath);
        
        for (const item of items) {
            const itemPath = path.join(currentPath, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                if (!shouldExcludeDir(itemPath)) {
                    walkDir(itemPath);
                }
            } else if (stat.isFile() && item.endsWith('.js')) {
                const result = processFile(itemPath);
                
                if (result.processed) {
                    results.processed++;
                    if (result.changes === 'modified') {
                        results.modified++;
                        console.log(`✅ Modified: ${itemPath}`);
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

// Main execution
function main() {
    console.log('🧹 Starting log cleanup process...\n');
    
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
    
    if (results.modified > 0) {
        console.log('\n✅ Log cleanup completed successfully!');
        console.log('💡 Next steps:');
        console.log('   1. Test your application to ensure everything works');
        console.log('   2. Use Logger.setLevel() to control log verbosity');
        console.log('   3. Use Logger.enableModules() to enable specific modules');
    } else {
        console.log('\n✨ No files needed modification.');
    }
}

if (require.main === module) {
    main();
}

module.exports = { processFile, processDirectory }; 