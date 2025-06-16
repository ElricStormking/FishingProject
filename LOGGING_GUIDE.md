# Logging System Guide

This guide explains how to use the centralized logging system and manage debug output in the PhaserFishing project.

## 🎯 Overview

The project now uses a centralized `Logger` utility instead of scattered `console.log` statements. This provides:

- **Environment-based control**: Different log levels for development vs production
- **Module-based filtering**: Enable/disable logging for specific components
- **Performance optimization**: Reduced console noise and string operations
- **Consistent formatting**: Standardized log output with module prefixes

## 🚀 Quick Start

### Using the Logger in Your Code

```javascript
// Import the Logger
import Logger from '../utils/Logger.js';

export class MyGameComponent {
    constructor() {
        // Create a module-specific logger
        this.logger = Logger.createModuleLogger('MyGameComponent');
        
        // Use different log levels
        this.logger.error('Critical error occurred');
        this.logger.warn('Something might be wrong');
        this.logger.info('Important information');
        this.logger.debug('Detailed debugging info');
        this.logger.trace('Very detailed tracing info');
    }
}
```

### Log Levels

| Level | When to Use | Production | Development |
|-------|-------------|------------|-------------|
| `error` | Critical errors that break functionality | ✅ Always shown | ✅ Always shown |
| `warn` | Warnings about potential issues | ✅ Always shown | ✅ Always shown |
| `info` | Important state changes | ❌ Hidden | ✅ Shown |
| `debug` | Detailed debugging information | ❌ Hidden | ✅ Shown |
| `trace` | Very verbose tracing | ❌ Hidden | ❌ Hidden by default |

## 🛠️ Cleanup Scripts

### Automatic Cleanup

Run the cleanup script to remove excessive debug logs:

```bash
# Remove excessive debug logs automatically
npm run clean-logs

# Set up Logger imports and instances (more comprehensive)
npm run setup-logger
```

### Manual Cleanup

For files that need manual attention:

1. **Import the Logger**:
   ```javascript
   import Logger from '../utils/Logger.js';
   ```

2. **Create module logger in constructor**:
   ```javascript
   constructor() {
       this.logger = Logger.createModuleLogger('ModuleName');
   }
   ```

3. **Replace console statements**:
   ```javascript
   // Before
   console.log('GameLoop: Starting fishing sequence');
   console.error('GameLoop: Critical error:', error);
   
   // After
   this.logger.debug('Starting fishing sequence');
   this.logger.error('Critical error:', error);
   ```

## 🎛️ Configuration

### Development Environment

```javascript
// Enable debug logging for specific modules
Logger.enableModules('GameState', 'PlayerController', 'GameLoop');

// Set global log level
Logger.setLevel(Logger.LOG_LEVELS.DEBUG);

// Enable all logging (for debugging)
Logger.enableAll();
```

### Production Environment

```javascript
// Disable all logging (automatic in production)
Logger.disable();

// Or set to only show errors and warnings
Logger.setLevel(Logger.LOG_LEVELS.WARN);
```

### Runtime Control

The Logger is available globally in development mode:

```javascript
// In browser console during development:
Logger.setLevel(Logger.LOG_LEVELS.TRACE); // Show everything
Logger.enableModules('GameScene'); // Only show GameScene logs
Logger.disableModules('InventoryUI'); // Hide InventoryUI logs
```

## 📁 File-Specific Guidelines

### Core Game Systems
- **GameState.js**: Use `info` for state changes, `debug` for detailed operations
- **GameLoop.js**: Use `info` for phase transitions, `debug` for internal logic
- **PlayerController.js**: Use `debug` for actions, `trace` for detailed calculations

### UI Components
- **Scene files**: Use `info` for scene transitions, `debug` for UI creation
- **UI components**: Use `debug` for interactions, `trace` for rendering details
- **Debug tools**: Keep existing console.log (excluded from cleanup)

### Managers
- **InventoryManager.js**: Use `warn` for validation issues, `debug` for operations
- **AudioManager.js**: Use `warn` for missing files, `debug` for playback
- **QuestManager.js**: Use `info` for quest state changes, `debug` for tracking

## 🚫 What Gets Removed

The cleanup scripts remove these types of excessive logs:

### Removed Completely
- Initialization messages: `"Component initialized"`
- Creation confirmations: `"UI created successfully"`
- Verbose state tracking: `"Location synchronized to..."`
- Repetitive quest logs: `"Quest 1: ...", "Quest 2: ..."`

### Made Conditional (DEV only)
- Important game events: Level ups, boss fights, major achievements
- Travel and fishing success messages
- Collection milestones

### Preserved
- Error messages (all `console.error`)
- Warning messages (all `console.warn`)
- Debug tool outputs (in excluded files)
- Critical state information

## 🎮 Best Practices

### Do Use Logger For:
```javascript
// State changes
this.logger.info('Player leveled up to level 5');

// Error handling
this.logger.error('Failed to load save data:', error);

// Debug information
this.logger.debug('Processing inventory update');

// Performance tracking
this.logger.trace('Render cycle completed in 16ms');
```

### Don't Use Logger For:
```javascript
// Excessive repetitive logs
// ❌ Bad
for (let fish of fishList) {
    this.logger.debug('Processing fish:', fish.name);
}

// ✅ Good
this.logger.debug(`Processing ${fishList.length} fish`);
```

### Module Naming Convention
- Use PascalCase matching the class name
- Keep names concise but descriptive
- Examples: `'GameState'`, `'InventoryUI'`, `'PlayerController'`

## 🔧 Troubleshooting

### Logger Not Working?
1. Check import path: `import Logger from '../utils/Logger.js'`
2. Verify module logger creation: `this.logger = Logger.createModuleLogger('ModuleName')`
3. Check log level: `Logger.setLevel(Logger.LOG_LEVELS.DEBUG)`

### Too Much/Too Little Logging?
```javascript
// Adjust global level
Logger.setLevel(Logger.LOG_LEVELS.INFO); // Less verbose
Logger.setLevel(Logger.LOG_LEVELS.TRACE); // More verbose

// Control specific modules
Logger.enableModules('GameState'); // Only GameState
Logger.disableModules('InventoryUI'); // Hide InventoryUI
```

### Performance Issues?
- Use appropriate log levels (`trace` for very detailed info)
- Avoid logging in tight loops
- Use conditional logging for expensive operations:
  ```javascript
  if (Logger.shouldLog('ModuleName', Logger.LOG_LEVELS.DEBUG)) {
      this.logger.debug('Expensive debug info:', expensiveCalculation());
  }
  ```

## 📊 Migration Status

### Completed
- ✅ Logger utility created
- ✅ Cleanup scripts created
- ✅ GameLoop.js partially migrated
- ✅ Package.json scripts added

### To Do
- 🔄 Run cleanup scripts on all files
- 🔄 Test logging in development/production
- 🔄 Update remaining high-volume files
- 🔄 Add logging configuration to game settings

## 🎯 Expected Benefits

After full migration:

1. **Performance**: ~20-30% reduction in console operations
2. **Development**: Cleaner console output, easier debugging
3. **Production**: Minimal logging overhead, professional output
4. **Maintenance**: Centralized control, consistent formatting

## 📝 Commands Summary

```bash
# Clean up excessive debug logs
npm run clean-logs

# Set up comprehensive Logger system
npm run setup-logger

# Development with clean logging
npm run dev

# Production build (minimal logging)
npm run build
```

---

*This logging system helps maintain a professional, performant, and maintainable codebase while preserving essential debugging capabilities.* 