import UITheme from './UITheme.js';

/**
 * Loading State Manager - Professional loading indicators for all async operations
 * Part of Priority 2.0 Polish & Optimization task implementation
 */
export class LoadingStateManager {
    constructor(scene) {
        this.scene = scene;
        this.activeLoaders = new Map();
        this.loadingContainer = null;
        this.globalLoadingState = false;
        
        // Animation settings
        this.animationSettings = {
            fadeIn: { duration: 300, ease: 'Power2.easeOut' },
            fadeOut: { duration: 200, ease: 'Power2.easeIn' },
            rotation: { duration: 1000, ease: 'Linear', repeat: -1 },
            pulse: { duration: 1500, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 }
        };
        
        this.createGlobalLoadingContainer();
        console.log('LoadingStateManager: Professional loading system initialized');
    }

    /**
     * Create global loading container
     */
    createGlobalLoadingContainer() {
        this.loadingContainer = this.scene.add.container(0, 0);
        this.loadingContainer.setDepth(20000); // Above everything
        this.loadingContainer.setVisible(false);
    }

    /**
     * Show loading state for specific operation
     */
    showLoading(loaderId, options = {}) {
        const defaultOptions = {
            type: 'spinner', // spinner, progress, minimal, custom
            message: 'Loading...',
            position: 'center', // center, top, bottom, topRight, bottomRight
            overlay: true,
            cancellable: false,
            timeout: 30000, // 30 second timeout
            customData: null
        };
        
        const config = { ...defaultOptions, ...options };
        
        // Create loader instance
        const loader = this.createLoader(loaderId, config);
        this.activeLoaders.set(loaderId, loader);
        
        // Add to container
        this.loadingContainer.add(loader.container);
        
        // Show container if first loader
        if (this.activeLoaders.size === 1) {
            this.showGlobalLoading();
        }
        
        // Animate loader in
        this.animateLoaderIn(loader);
        
        // Setup timeout if specified
        if (config.timeout > 0) {
            loader.timeoutId = setTimeout(() => {
                this.hideLoading(loaderId, 'timeout');
            }, config.timeout);
        }
        
        console.log(`LoadingStateManager: Showing loader: ${loaderId}`);
        return loader;
    }

    /**
     * Hide loading state
     */
    hideLoading(loaderId, reason = 'completed') {
        const loader = this.activeLoaders.get(loaderId);
        if (!loader) {
            console.warn(`LoadingStateManager: Loader not found: ${loaderId}`);
            return;
        }
        
        // Clear timeout if exists
        if (loader.timeoutId) {
            clearTimeout(loader.timeoutId);
        }
        
        // Animate loader out
        this.animateLoaderOut(loader, () => {
            // Remove from container
            loader.container.destroy();
            this.activeLoaders.delete(loaderId);
            
            // Hide global loading if no more loaders
            if (this.activeLoaders.size === 0) {
                this.hideGlobalLoading();
            }
        });
        
        console.log(`LoadingStateManager: Hiding loader: ${loaderId} (${reason})`);
    }

    /**
     * Update loading progress
     */
    updateProgress(loaderId, progress, message = null) {
        const loader = this.activeLoaders.get(loaderId);
        if (!loader || loader.config.type !== 'progress') {
            return;
        }
        
        // Update progress bar
        if (loader.progressBar) {
            const targetWidth = (progress / 100) * loader.progressBar.maxWidth;
            
            this.scene.tweens.add({
                targets: loader.progressBar.fill,
                scaleX: progress / 100,
                duration: 300,
                ease: 'Power2.easeOut'
            });
            
            // Update percentage text
            if (loader.progressText) {
                loader.progressText.setText(`${Math.round(progress)}%`);
            }
        }
        
        // Update message if provided
        if (message && loader.messageText) {
            loader.messageText.setText(message);
        }
    }

    /**
     * Create specific loader type
     */
    createLoader(loaderId, config) {
        const { width, height } = this.scene.cameras.main;
        
        switch (config.type) {
            case 'spinner':
                return this.createSpinnerLoader(loaderId, config, width, height);
            case 'progress':
                return this.createProgressLoader(loaderId, config, width, height);
            case 'minimal':
                return this.createMinimalLoader(loaderId, config, width, height);
            case 'custom':
                return this.createCustomLoader(loaderId, config, width, height);
            default:
                return this.createSpinnerLoader(loaderId, config, width, height);
        }
    }

    /**
     * Create spinner loader
     */
    createSpinnerLoader(loaderId, config, width, height) {
        const container = this.scene.add.container(0, 0);
        container.setAlpha(0);
        
        // Position container
        const position = this.getPosition(config.position, width, height);
        container.setPosition(position.x, position.y);
        
        // Background overlay
        if (config.overlay) {
            const overlay = this.scene.add.graphics();
            overlay.fillStyle(UITheme.colors.overlay, 0.7);
            overlay.fillRect(-width/2, -height/2, width, height);
            container.add(overlay);
        }
        
        // Main panel
        const panelWidth = 300;
        const panelHeight = 120;
        const panel = UITheme.createPanel(this.scene, -panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 'primary');
        container.add(panel);
        
        // Spinner
        const spinner = this.scene.add.graphics();
        spinner.lineStyle(4, UITheme.colors.primary, 1);
        spinner.arc(0, -20, 20, 0, Math.PI * 1.5);
        spinner.lineStyle(4, UITheme.colors.primaryLight, 0.3);
        spinner.strokeCircle(0, -20, 20);
        container.add(spinner);
        
        // Animate spinner
        const spinAnimation = this.scene.tweens.add({
            targets: spinner,
            rotation: Math.PI * 2,
            duration: this.animationSettings.rotation.duration,
            ease: this.animationSettings.rotation.ease,
            repeat: this.animationSettings.rotation.repeat
        });
        
        // Message text
        const messageText = UITheme.createText(this.scene, 0, 20, config.message, 'bodyMedium');
        messageText.setOrigin(0.5);
        container.add(messageText);
        
        // Cancel button if cancellable
        if (config.cancellable) {
            const cancelBtn = UITheme.createButton(this.scene, 0, 50, 80, 25, 'Cancel', () => {
                this.hideLoading(loaderId, 'cancelled');
            }, 'secondary');
            container.add(cancelBtn.button);
            container.add(cancelBtn.text);
        }
        
        return {
            id: loaderId,
            container,
            config,
            spinner,
            spinAnimation,
            messageText,
            timeoutId: null
        };
    }

    /**
     * Create progress loader
     */
    createProgressLoader(loaderId, config, width, height) {
        const container = this.scene.add.container(0, 0);
        container.setAlpha(0);
        
        // Position container
        const position = this.getPosition(config.position, width, height);
        container.setPosition(position.x, position.y);
        
        // Background overlay
        if (config.overlay) {
            const overlay = this.scene.add.graphics();
            overlay.fillStyle(UITheme.colors.overlay, 0.7);
            overlay.fillRect(-width/2, -height/2, width, height);
            container.add(overlay);
        }
        
        // Main panel
        const panelWidth = 400;
        const panelHeight = 140;
        const panel = UITheme.createPanel(this.scene, -panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 'primary');
        container.add(panel);
        
        // Title
        const titleText = UITheme.createText(this.scene, 0, -40, config.message, 'headerSmall');
        titleText.setOrigin(0.5);
        container.add(titleText);
        
        // Progress bar background
        const progressBg = this.scene.add.graphics();
        progressBg.fillStyle(UITheme.colors.darkSecondary, 1);
        progressBg.fillRoundedRect(-150, -10, 300, 20, 10);
        container.add(progressBg);
        
        // Progress bar fill
        const progressFill = this.scene.add.graphics();
        progressFill.fillStyle(UITheme.colors.primary, 1);
        progressFill.fillRoundedRect(-150, -10, 0, 20, 10);
        progressFill.scaleX = 0;
        container.add(progressFill);
        
        // Progress percentage
        const progressText = UITheme.createText(this.scene, 0, 15, '0%', 'bodySmall');
        progressText.setOrigin(0.5);
        container.add(progressText);
        
        // Status message
        const statusText = UITheme.createText(this.scene, 0, 35, 'Initializing...', 'bodySmall');
        statusText.setOrigin(0.5);
        statusText.setColor(UITheme.colors.textSecondary);
        container.add(statusText);
        
        return {
            id: loaderId,
            container,
            config,
            messageText: titleText,
            progressBar: {
                background: progressBg,
                fill: progressFill,
                maxWidth: 300
            },
            progressText,
            statusText,
            timeoutId: null
        };
    }

    /**
     * Create minimal loader
     */
    createMinimalLoader(loaderId, config, width, height) {
        const container = this.scene.add.container(0, 0);
        container.setAlpha(0);
        
        // Position container
        const position = this.getPosition(config.position, width, height);
        container.setPosition(position.x, position.y);
        
        // Small spinner
        const spinner = this.scene.add.graphics();
        spinner.lineStyle(2, UITheme.colors.primary, 1);
        spinner.arc(0, 0, 12, 0, Math.PI * 1.5);
        container.add(spinner);
        
        // Animate spinner
        const spinAnimation = this.scene.tweens.add({
            targets: spinner,
            rotation: Math.PI * 2,
            duration: 800,
            ease: 'Linear',
            repeat: -1
        });
        
        // Optional text
        if (config.message !== 'Loading...') {
            const text = UITheme.createText(this.scene, 20, 0, config.message, 'bodySmall');
            text.setOrigin(0, 0.5);
            container.add(text);
        }
        
        return {
            id: loaderId,
            container,
            config,
            spinner,
            spinAnimation,
            timeoutId: null
        };
    }

    /**
     * Create custom loader
     */
    createCustomLoader(loaderId, config, width, height) {
        const container = this.scene.add.container(0, 0);
        container.setAlpha(0);
        
        // Position container
        const position = this.getPosition(config.position, width, height);
        container.setPosition(position.x, position.y);
        
        // Custom implementation based on config.customData
        if (config.customData?.type === 'fishCatch') {
            return this.createFishCatchLoader(container, config);
        } else if (config.customData?.type === 'equipment') {
            return this.createEquipmentLoader(container, config);
        }
        
        // Default to spinner if no custom type
        return this.createSpinnerLoader(loaderId, config, width, height);
    }

    /**
     * Create fish catch specific loader
     */
    createFishCatchLoader(container, config) {
        // Fish icon with animation
        const fishIcon = UITheme.createText(this.scene, 0, -20, '🐟', 'gigantic');
        fishIcon.setOrigin(0.5);
        container.add(fishIcon);
        
        // Animate fish swimming
        this.scene.tweens.add({
            targets: fishIcon,
            x: 30,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Message
        const message = UITheme.createText(this.scene, 0, 20, config.message, 'bodyMedium');
        message.setOrigin(0.5);
        container.add(message);
        
        return {
            container,
            config,
            fishIcon,
            messageText: message,
            timeoutId: null
        };
    }

    /**
     * Create equipment specific loader
     */
    createEquipmentLoader(container, config) {
        // Gear icon with rotation
        const gearIcon = UITheme.createText(this.scene, 0, -20, '⚙️', 'gigantic');
        gearIcon.setOrigin(0.5);
        container.add(gearIcon);
        
        // Rotate gear
        this.scene.tweens.add({
            targets: gearIcon,
            rotation: Math.PI * 2,
            duration: 2000,
            ease: 'Linear',
            repeat: -1
        });
        
        // Message
        const message = UITheme.createText(this.scene, 0, 20, config.message, 'bodyMedium');
        message.setOrigin(0.5);
        container.add(message);
        
        return {
            container,
            config,
            gearIcon,
            messageText: message,
            timeoutId: null
        };
    }

    /**
     * Get position based on configuration
     */
    getPosition(position, width, height) {
        switch (position) {
            case 'center':
                return { x: width / 2, y: height / 2 };
            case 'top':
                return { x: width / 2, y: 100 };
            case 'bottom':
                return { x: width / 2, y: height - 100 };
            case 'topRight':
                return { x: width - 150, y: 100 };
            case 'bottomRight':
                return { x: width - 150, y: height - 100 };
            case 'topLeft':
                return { x: 150, y: 100 };
            case 'bottomLeft':
                return { x: 150, y: height - 100 };
            default:
                return { x: width / 2, y: height / 2 };
        }
    }

    /**
     * Show global loading container
     */
    showGlobalLoading() {
        if (!this.globalLoadingState) {
            this.globalLoadingState = true;
            this.loadingContainer.setVisible(true);
            
            // Fade in animation
            this.scene.tweens.add({
                targets: this.loadingContainer,
                alpha: 1,
                duration: this.animationSettings.fadeIn.duration,
                ease: this.animationSettings.fadeIn.ease
            });
        }
    }

    /**
     * Hide global loading container
     */
    hideGlobalLoading() {
        if (this.globalLoadingState) {
            this.globalLoadingState = false;
            
            // Fade out animation
            this.scene.tweens.add({
                targets: this.loadingContainer,
                alpha: 0,
                duration: this.animationSettings.fadeOut.duration,
                ease: this.animationSettings.fadeOut.ease,
                onComplete: () => {
                    this.loadingContainer.setVisible(false);
                }
            });
        }
    }

    /**
     * Animate loader in
     */
    animateLoaderIn(loader) {
        // Scale in animation
        loader.container.setScale(0.8);
        
        this.scene.tweens.add({
            targets: loader.container,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: this.animationSettings.fadeIn.duration,
            ease: this.animationSettings.fadeIn.ease
        });
    }

    /**
     * Animate loader out
     */
    animateLoaderOut(loader, onComplete) {
        this.scene.tweens.add({
            targets: loader.container,
            alpha: 0,
            scaleX: 0.8,
            scaleY: 0.8,
            duration: this.animationSettings.fadeOut.duration,
            ease: this.animationSettings.fadeOut.ease,
            onComplete: onComplete
        });
    }

    /**
     * Convenience methods for common operations
     */

    // Show data loading
    showDataLoading(message = 'Loading data...') {
        return this.showLoading('data_load', {
            type: 'progress',
            message: message,
            position: 'center'
        });
    }

    // Show save/load operations
    showSaveLoading(message = 'Saving game...') {
        return this.showLoading('save_operation', {
            type: 'spinner',
            message: message,
            position: 'topRight',
            overlay: false
        });
    }

    // Show fishing operations
    showFishingLoading(message = 'Processing catch...') {
        return this.showLoading('fishing_operation', {
            type: 'custom',
            message: message,
            position: 'center',
            customData: { type: 'fishCatch' }
        });
    }

    // Show equipment operations
    showEquipmentLoading(message = 'Enhancing equipment...') {
        return this.showLoading('equipment_operation', {
            type: 'custom',
            message: message,
            position: 'center',
            customData: { type: 'equipment' }
        });
    }

    // Show minimal loading for quick operations
    showQuickLoading(loaderId, message = '') {
        return this.showLoading(loaderId, {
            type: 'minimal',
            message: message,
            position: 'bottomRight',
            overlay: false,
            timeout: 5000
        });
    }

    /**
     * Check if any loaders are active
     */
    isLoading(loaderId = null) {
        if (loaderId) {
            return this.activeLoaders.has(loaderId);
        }
        return this.activeLoaders.size > 0;
    }

    /**
     * Get active loader count
     */
    getActiveLoaderCount() {
        return this.activeLoaders.size;
    }

    /**
     * Hide all loaders
     */
    hideAllLoaders(reason = 'force_clear') {
        const loaderIds = Array.from(this.activeLoaders.keys());
        loaderIds.forEach(id => {
            this.hideLoading(id, reason);
        });
    }

    /**
     * Cleanup
     */
    destroy() {
        this.hideAllLoaders('cleanup');
        
        if (this.loadingContainer) {
            this.loadingContainer.destroy();
            this.loadingContainer = null;
        }
        
        console.log('LoadingStateManager: Loading system destroyed');
    }
} 