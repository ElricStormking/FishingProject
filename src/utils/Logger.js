/**
 * Centralized logging utility for the Phaser Fishing Game
 * Provides controlled logging with different levels and environment-based filtering
 */
export class Logger {
    static LOG_LEVELS = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3,
        TRACE: 4
    };

    static currentLevel = import.meta.env.DEV ? Logger.LOG_LEVELS.DEBUG : Logger.LOG_LEVELS.WARN;
    static enabledModules = new Set();
    static disabledModules = new Set();

    /**
     * Set the global log level
     * @param {number} level - Log level from LOG_LEVELS
     */
    static setLevel(level) {
        Logger.currentLevel = level;
    }

    /**
     * Enable logging for specific modules
     * @param {...string} modules - Module names to enable
     */
    static enableModules(...modules) {
        modules.forEach(module => Logger.enabledModules.add(module));
    }

    /**
     * Disable logging for specific modules
     * @param {...string} modules - Module names to disable
     */
    static disableModules(...modules) {
        modules.forEach(module => Logger.disabledModules.add(module));
    }

    /**
     * Check if logging is enabled for a module and level
     * @param {string} module - Module name
     * @param {number} level - Log level
     * @returns {boolean}
     */
    static shouldLog(module, level) {
        if (level > Logger.currentLevel) return false;
        if (Logger.disabledModules.has(module)) return false;
        if (Logger.enabledModules.size > 0 && !Logger.enabledModules.has(module)) return false;
        return true;
    }

    /**
     * Log an error message
     * @param {string} module - Module name
     * @param {string} message - Log message
     * @param {...any} args - Additional arguments
     */
    static error(module, message, ...args) {
        if (Logger.shouldLog(module, Logger.LOG_LEVELS.ERROR)) {
            console.error(`[${module}] ${message}`, ...args);
        }
    }

    /**
     * Log a warning message
     * @param {string} module - Module name
     * @param {string} message - Log message
     * @param {...any} args - Additional arguments
     */
    static warn(module, message, ...args) {
        if (Logger.shouldLog(module, Logger.LOG_LEVELS.WARN)) {
            console.warn(`[${module}] ${message}`, ...args);
        }
    }

    /**
     * Log an info message
     * @param {string} module - Module name
     * @param {string} message - Log message
     * @param {...any} args - Additional arguments
     */
    static info(module, message, ...args) {
        if (Logger.shouldLog(module, Logger.LOG_LEVELS.INFO)) {
            console.info(`[${module}] ${message}`, ...args);
        }
    }

    /**
     * Log a debug message
     * @param {string} module - Module name
     * @param {string} message - Log message
     * @param {...any} args - Additional arguments
     */
    static debug(module, message, ...args) {
        if (Logger.shouldLog(module, Logger.LOG_LEVELS.DEBUG)) {
            console.log(`[${module}] ${message}`, ...args);
        }
    }

    /**
     * Log a trace message
     * @param {string} module - Module name
     * @param {string} message - Log message
     * @param {...any} args - Additional arguments
     */
    static trace(module, message, ...args) {
        if (Logger.shouldLog(module, Logger.LOG_LEVELS.TRACE)) {
            console.log(`[${module}] ${message}`, ...args);
        }
    }

    /**
     * Create a module-specific logger
     * @param {string} moduleName - Name of the module
     * @returns {Object} Module logger with bound methods
     */
    static createModuleLogger(moduleName) {
        return {
            error: (message, ...args) => Logger.error(moduleName, message, ...args),
            warn: (message, ...args) => Logger.warn(moduleName, message, ...args),
            info: (message, ...args) => Logger.info(moduleName, message, ...args),
            debug: (message, ...args) => Logger.debug(moduleName, message, ...args),
            trace: (message, ...args) => Logger.trace(moduleName, message, ...args)
        };
    }

    /**
     * Disable all logging (for production)
     */
    static disable() {
        Logger.currentLevel = -1;
    }

    /**
     * Enable all logging (for debugging)
     */
    static enableAll() {
        Logger.currentLevel = Logger.LOG_LEVELS.TRACE;
    }
}

// Development environment setup
if (import.meta.env.DEV) {
    // In development, enable debug logging for core systems
    Logger.enableModules('GameState', 'GameLoop', 'PlayerController');
    
    // Make Logger available globally for debugging
    window.Logger = Logger;
}

export default Logger; 