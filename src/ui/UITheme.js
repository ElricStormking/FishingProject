/**
 * Centralized UI Theme System for Luxury Angler
 * Provides consistent styling across all UI components
 */
export class UITheme {
    static colors = {
        // Primary Colors
        primary: 0x4a90e2,           // Main blue
        primaryDark: 0x2c5aa0,       // Darker blue for hover states
        primaryLight: 0x6bb6ff,      // Lighter blue for highlights
        
        // Secondary Colors
        secondary: 0x2d5016,         // Green for success/positive actions
        secondaryDark: 0x1a3009,     // Dark green
        secondaryLight: 0x4caf50,    // Light green
        
        // Accent Colors
        gold: 0xffd700,              // Gold for premium/special items
        silver: 0xc0c0c0,            // Silver for mid-tier items
        bronze: 0xcd7f32,            // Bronze for basic items
        legendary: 0xff6b35,         // Orange for legendary items
        
        // Status Colors
        success: 0x4caf50,           // Green for success
        warning: 0xffa726,           // Orange for warnings
        error: 0xff5722,             // Red for errors
        info: 0x2196f3,              // Blue for information
        
        // Neutral Colors
        dark: 0x1a1a2e,              // Very dark background
        darkPrimary: 0x1a1a1a,       // Black for progress bars
        darkSecondary: 0x2a2a2a,     // Secondary dark
        medium: 0x3c3c3c,            // Medium gray
        light: 0x888888,             // Light gray
        white: 0xffffff,             // White
        highlight: 0x87ceeb,         // Light blue for highlights
        
        // Text colors (as hex strings for Phaser text objects)
        text: '#ffffff',             // Primary text color
        textSecondary: '#cccccc',    // Secondary text color
        
        // Transparent overlays (alpha values)
        overlay: 0x000000,           // Black overlay (use with alpha)
        panelBg: 0x1a1a2e,          // Standard panel background
        
        // Equipment Enhancement specific
        enhancement: {
            background: 0x1a1a2e,
            border: 0x4a90e2,
            success: 0x4caf50,
            failure: 0xff5722,
            upgrade: 0xffd700
        },
        
        // Rarity colors
        rarity: {
            1: 0x888888,             // Common - Gray
            2: 0x4a90e2,             // Uncommon - Blue  
            3: 0x9b59b6,             // Rare - Purple
            4: 0xe74c3c,             // Epic - Red
            5: 0xf39c12              // Legendary - Orange
        }
    };
    
    static fonts = {
        // Primary font family - consistent across all UI
        primary: 'Arial, sans-serif',
        
        // Font sizes (in pixels)
        sizes: {
            tiny: '10px',
            small: '12px',
            medium: '14px',
            large: '16px',
            xlarge: '18px',
            xxlarge: '20px',
            huge: '24px',
            massive: '28px',
            gigantic: '32px'
        },
        
        // Font weights
        weights: {
            normal: 'normal',
            bold: 'bold'
        }
    };
    
    static spacing = {
        // Standard spacing units (in pixels)
        tiny: 4,
        small: 8,
        medium: 12,
        large: 16,
        xlarge: 20,
        xxlarge: 24,
        huge: 32,
        massive: 48
    };
    
    static borders = {
        // Border radius values
        radius: {
            small: 5,
            medium: 8,
            large: 12,
            xlarge: 20
        },
        
        // Border width
        width: {
            thin: 1,
            medium: 2,
            thick: 3
        }
    };
    
    static animations = {
        // Standard animation durations (in milliseconds)
        fast: 200,
        medium: 300,
        slow: 500,
        
        // Easing functions
        easing: {
            linear: 'Linear',
            easeIn: 'Power2.easeIn',
            easeOut: 'Power2.easeOut',
            easeInOut: 'Power2.easeInOut',
            bounce: 'Bounce.easeOut',
            elastic: 'Elastic.easeOut'
        }
    };
    
    // Standard text styles
    static textStyles = {
        // Headers
        headerLarge: {
            fontSize: UITheme.fonts.sizes.huge,
            fontFamily: UITheme.fonts.primary,
            color: '#FFD700',
            fontStyle: UITheme.fonts.weights.bold,
            stroke: '#000000',
            strokeThickness: 3
        },
        
        headerMedium: {
            fontSize: UITheme.fonts.sizes.xlarge,
            fontFamily: UITheme.fonts.primary,
            color: '#4a90e2',
            fontStyle: UITheme.fonts.weights.bold
        },
        
        headerSmall: {
            fontSize: UITheme.fonts.sizes.large,
            fontFamily: UITheme.fonts.primary,
            color: '#ffffff',
            fontStyle: UITheme.fonts.weights.bold
        },
        
        // Body text
        bodyLarge: {
            fontSize: UITheme.fonts.sizes.large,
            fontFamily: UITheme.fonts.primary,
            color: '#ffffff'
        },
        
        bodyMedium: {
            fontSize: UITheme.fonts.sizes.medium,
            fontFamily: UITheme.fonts.primary,
            color: '#ffffff'
        },
        
        bodySmall: {
            fontSize: UITheme.fonts.sizes.small,
            fontFamily: UITheme.fonts.primary,
            color: '#cccccc'
        },
        
        tiny: {
            fontSize: UITheme.fonts.sizes.tiny,
            fontFamily: UITheme.fonts.primary,
            color: '#aaaaaa'
        },
        
        // Special text types
        error: {
            fontSize: UITheme.fonts.sizes.medium,
            fontFamily: UITheme.fonts.primary,
            color: '#ff5722',
            fontStyle: UITheme.fonts.weights.bold
        },
        
        success: {
            fontSize: UITheme.fonts.sizes.medium,
            fontFamily: UITheme.fonts.primary,
            color: '#4caf50',
            fontStyle: UITheme.fonts.weights.bold
        },
        
        warning: {
            fontSize: UITheme.fonts.sizes.medium,
            fontFamily: UITheme.fonts.primary,
            color: '#ffa726',
            fontStyle: UITheme.fonts.weights.bold
        },
        
        // Button text
        button: {
            fontSize: UITheme.fonts.sizes.medium,
            fontFamily: UITheme.fonts.primary,
            color: '#ffffff',
            fontStyle: UITheme.fonts.weights.bold
        },
        
        // Accent text
        accent: {
            fontSize: UITheme.fonts.sizes.medium,
            fontFamily: UITheme.fonts.primary,
            color: '#ffd700',
            fontStyle: UITheme.fonts.weights.bold
        },
        
        overlayNotification: {
            fontSize: UITheme.fonts.sizes.xlarge,
            fontFamily: UITheme.fonts.primary,
            color: UITheme.colors.warning,
            fontStyle: UITheme.fonts.weights.bold,
            backgroundColor: UITheme.colors.overlay,
            padding: { x: UITheme.spacing.medium, y: UITheme.spacing.small },
            align: 'center',
            fixedWidth: 400,
            wordWrap: { width: 380, useAdvancedWrap: true }
        }
    };
    
    // Standard panel styles
    static panelStyles = {
        primary: {
            fillColor: UITheme.colors.panelBg,
            fillAlpha: 0.95,
            strokeColor: UITheme.colors.primary,
            strokeWidth: UITheme.borders.width.medium,
            strokeAlpha: 0.8,
            radius: UITheme.borders.radius.medium
        },
        
        secondary: {
            fillColor: UITheme.colors.darkSecondary,
            fillAlpha: 0.9,
            strokeColor: UITheme.colors.secondary,
            strokeWidth: UITheme.borders.width.thin,
            strokeAlpha: 0.7,
            radius: UITheme.borders.radius.small
        },
        
        error: {
            fillColor: 0x330000,
            fillAlpha: 0.95,
            strokeColor: UITheme.colors.error,
            strokeWidth: UITheme.borders.width.thick,
            strokeAlpha: 1,
            radius: UITheme.borders.radius.large
        },
        
        success: {
            fillColor: 0x003300,
            fillAlpha: 0.95,
            strokeColor: UITheme.colors.success,
            strokeWidth: UITheme.borders.width.medium,
            strokeAlpha: 0.8,
            radius: UITheme.borders.radius.medium
        }
    };
    
    // Standard button styles
    static buttonStyles = {
        primary: {
            fillColor: UITheme.colors.primary,
            hoverColor: UITheme.colors.primaryLight,
            pressedColor: UITheme.colors.primaryDark,
            strokeColor: UITheme.colors.primaryLight,
            strokeWidth: UITheme.borders.width.medium,
            radius: UITheme.borders.radius.medium,
            textStyle: UITheme.textStyles.button
        },
        
        secondary: {
            fillColor: UITheme.colors.secondary,
            hoverColor: UITheme.colors.secondaryLight,
            pressedColor: UITheme.colors.secondaryDark,
            strokeColor: UITheme.colors.secondaryLight,
            strokeWidth: UITheme.borders.width.medium,
            radius: UITheme.borders.radius.medium,
            textStyle: UITheme.textStyles.button
        },
        
        danger: {
            fillColor: UITheme.colors.error,
            hoverColor: 0xff7043,
            pressedColor: 0xd32f2f,
            strokeColor: 0xff7043,
            strokeWidth: UITheme.borders.width.medium,
            radius: UITheme.borders.radius.medium,
            textStyle: UITheme.textStyles.button
        },
        
        success: {
            fillColor: UITheme.colors.success,
            hoverColor: 0x66bb6a,
            pressedColor: 0x388e3c,
            strokeColor: 0x66bb6a,
            strokeWidth: UITheme.borders.width.medium,
            radius: UITheme.borders.radius.medium,
            textStyle: UITheme.textStyles.button
        },
        
        tab: {
            fillColor: UITheme.colors.darkSecondary,
            hoverColor: UITheme.colors.medium,
            pressedColor: UITheme.colors.dark,
            strokeColor: UITheme.colors.light,
            strokeWidth: UITheme.borders.width.thin,
            radius: UITheme.borders.radius.small,
            textStyle: { ...UITheme.textStyles.button, fontSize: UITheme.fonts.sizes.medium }
        },

        tabActive: {
            fillColor: UITheme.colors.primary,
            hoverColor: UITheme.colors.primaryLight,
            pressedColor: UITheme.colors.primaryDark,
            strokeColor: UITheme.colors.primaryLight,
            strokeWidth: UITheme.borders.width.medium,
            radius: UITheme.borders.radius.small,
            textStyle: { ...UITheme.textStyles.button, fontSize: UITheme.fonts.sizes.medium }
        },

        keybinding: {
            fillColor: UITheme.colors.darkSecondary,
            hoverColor: UITheme.colors.medium,
            pressedColor: UITheme.colors.dark,
            strokeColor: UITheme.colors.light,
            strokeWidth: UITheme.borders.width.thin,
            radius: UITheme.borders.radius.small,
            textStyle: { ...UITheme.textStyles.button, fontSize: UITheme.fonts.sizes.small }
        }
    };
    
    /**
     * Utility methods for common UI operations
     */
    
    // Create a standard panel with consistent styling
    static createPanel(scene, x, y, width, height, style = 'primary') {
        try {
            const panelStyle = UITheme.panelStyles[style] || UITheme.panelStyles.primary;
            
            // Ensure panel style has required properties
            const safePanelStyle = {
                fillColor: panelStyle.fillColor || UITheme.colors.panelBg,
                fillAlpha: panelStyle.fillAlpha || 0.95,
                strokeColor: panelStyle.strokeColor || UITheme.colors.primary,
                strokeWidth: panelStyle.strokeWidth || UITheme.borders.width.medium,
                strokeAlpha: panelStyle.strokeAlpha || 0.8,
                radius: panelStyle.radius || UITheme.borders.radius.medium
            };
            
            const panel = scene.add.graphics();
            
            panel.fillStyle(safePanelStyle.fillColor, safePanelStyle.fillAlpha);
            panel.fillRoundedRect(x, y, width, height, safePanelStyle.radius);
            panel.lineStyle(safePanelStyle.strokeWidth, safePanelStyle.strokeColor, safePanelStyle.strokeAlpha);
            panel.strokeRoundedRect(x, y, width, height, safePanelStyle.radius);
            
            return panel;
        } catch (error) {
            console.warn('UITheme: Error creating panel, using fallback:', error);
            // Fallback to basic panel
            try {
                const panel = scene.add.graphics();
                panel.fillStyle(0x1a1a2e, 0.95);
                panel.fillRoundedRect(x, y, width, height, 8);
                panel.lineStyle(2, 0x4a90e2, 0.8);
                panel.strokeRoundedRect(x, y, width, height, 8);
                return panel;
            } catch (fallbackError) {
                console.error('UITheme: Even fallback panel creation failed:', fallbackError);
                return null;
            }
        }
    }
    
    // Create standard text with consistent styling
    static createText(scene, x, y, text, style = 'bodyMedium') {
        try {
            const textStyle = UITheme.textStyles[style] || UITheme.textStyles.bodyMedium;
            
            // Ensure text style has required properties
            const safeTextStyle = {
                fontSize: textStyle.fontSize || UITheme.fonts.sizes.medium,
                fontFamily: textStyle.fontFamily || UITheme.fonts.primary,
                color: textStyle.color || UITheme.colors.text,
                fontStyle: textStyle.fontStyle || UITheme.fonts.weights.normal,
                stroke: textStyle.stroke || undefined,
                strokeThickness: textStyle.strokeThickness || 0,
                wordWrap: textStyle.wordWrap || undefined,
                align: textStyle.align || undefined
            };
            
            return scene.add.text(x, y, text, safeTextStyle);
        } catch (error) {
            console.warn('UITheme: Error creating text, using fallback:', error);
            // Fallback to basic text
            try {
                return scene.add.text(x, y, text, {
                    fontSize: '14px',
                    fontFamily: 'Arial, sans-serif',
                    color: '#ffffff'
                });
            } catch (fallbackError) {
                console.error('UITheme: Even fallback text creation failed:', fallbackError);
                return null;
            }
        }
    }
    
    // Create a standard button with hover effects
    static createButton(scene, x, y, width, height, text, callback, style = 'primary') {
        try {
            const buttonStyle = UITheme.buttonStyles[style] || UITheme.buttonStyles.primary;
            
            // Ensure all required style properties exist
            const safeButtonStyle = {
                fillColor: buttonStyle.fillColor || UITheme.colors.primary,
                hoverColor: buttonStyle.hoverColor || UITheme.colors.primaryLight,
                pressedColor: buttonStyle.pressedColor || UITheme.colors.primaryDark,
                strokeColor: buttonStyle.strokeColor || UITheme.colors.primaryLight,
                strokeWidth: buttonStyle.strokeWidth || UITheme.borders.width.medium,
                radius: buttonStyle.radius || UITheme.borders.radius.medium,
                textStyle: buttonStyle.textStyle || UITheme.textStyles.button
            };
            
            // Button graphics
            const button = scene.add.graphics();
            button.fillStyle(safeButtonStyle.fillColor);
            button.fillRoundedRect(-width/2, -height/2, width, height, safeButtonStyle.radius);
            button.lineStyle(safeButtonStyle.strokeWidth, safeButtonStyle.strokeColor);
            button.strokeRoundedRect(-width/2, -height/2, width, height, safeButtonStyle.radius);
            button.setPosition(x, y);
            
            // Button text with error handling
            let buttonText;
            try {
                buttonText = scene.add.text(x, y, text, safeButtonStyle.textStyle).setOrigin(0.5);
            } catch (textError) {
                console.warn('UITheme: Error creating button text, using fallback:', textError);
                buttonText = scene.add.text(x, y, text, {
                    fontSize: '14px',
                    fill: '#ffffff',
                    fontWeight: 'bold'
                }).setOrigin(0.5);
            }
            
            // Interactivity with error handling
            try {
                button.setInteractive(new Phaser.Geom.Rectangle(-width/2, -height/2, width, height), Phaser.Geom.Rectangle.Contains);
                
                // Hover effects with error handling
                button.on('pointerover', () => {
                    try {
                        button.clear();
                        button.fillStyle(safeButtonStyle.hoverColor);
                        button.fillRoundedRect(-width/2, -height/2, width, height, safeButtonStyle.radius);
                        button.lineStyle(safeButtonStyle.strokeWidth, safeButtonStyle.strokeColor);
                        button.strokeRoundedRect(-width/2, -height/2, width, height, safeButtonStyle.radius);
                        if (buttonText && buttonText.setScale) {
                            buttonText.setScale(1.05);
                        }
                    } catch (hoverError) {
                        console.warn('UITheme: Error in button hover effect:', hoverError);
                    }
                });
                
                button.on('pointerout', () => {
                    try {
                        button.clear();
                        button.fillStyle(safeButtonStyle.fillColor);
                        button.fillRoundedRect(-width/2, -height/2, width, height, safeButtonStyle.radius);
                        button.lineStyle(safeButtonStyle.strokeWidth, safeButtonStyle.strokeColor);
                        button.strokeRoundedRect(-width/2, -height/2, width, height, safeButtonStyle.radius);
                        if (buttonText && buttonText.setScale) {
                            buttonText.setScale(1);
                        }
                    } catch (outError) {
                        console.warn('UITheme: Error in button out effect:', outError);
                    }
                });
                
                button.on('pointerdown', () => {
                    try {
                        button.clear();
                        button.fillStyle(safeButtonStyle.pressedColor);
                        button.fillRoundedRect(-width/2, -height/2, width, height, safeButtonStyle.radius);
                        button.lineStyle(safeButtonStyle.strokeWidth, safeButtonStyle.strokeColor);
                        button.strokeRoundedRect(-width/2, -height/2, width, height, safeButtonStyle.radius);
                        
                        // Execute callback with error handling
                        if (callback && typeof callback === 'function') {
                            try {
                                callback();
                            } catch (callbackError) {
                                console.error('UITheme: Error in button callback:', callbackError);
                            }
                        }
                    } catch (clickError) {
                        console.warn('UITheme: Error in button click effect:', clickError);
                        // Still try to execute callback even if visual effects fail
                        if (callback && typeof callback === 'function') {
                            try {
                                callback();
                            } catch (callbackError) {
                                console.error('UITheme: Error in button callback (fallback):', callbackError);
                            }
                        }
                    }
                });
                
            } catch (interactiveError) {
                console.warn('UITheme: Error setting up button interactivity:', interactiveError);
                // Create a simple fallback interactive area
                try {
                    const fallbackHitArea = scene.add.rectangle(x, y, width, height, 0x000000, 0);
                    fallbackHitArea.setInteractive({ useHandCursor: true });
                    fallbackHitArea.on('pointerdown', () => {
                        if (callback && typeof callback === 'function') {
                            try {
                                callback();
                            } catch (callbackError) {
                                console.error('UITheme: Error in fallback button callback:', callbackError);
                            }
                        }
                    });
                    return { button, text: buttonText, hitArea: fallbackHitArea };
                } catch (fallbackError) {
                    console.error('UITheme: Error creating fallback button interaction:', fallbackError);
                }
            }
            
            return { button, text: buttonText };
            
        } catch (error) {
            console.error('UITheme: Critical error in createButton:', error);
            
            // Last resort fallback - create a very simple button
            try {
                const fallbackButton = scene.add.graphics();
                fallbackButton.fillStyle(0x4a90e2);
                fallbackButton.fillRoundedRect(-width/2, -height/2, width, height, 8);
                fallbackButton.setPosition(x, y);
                
                const fallbackText = scene.add.text(x, y, text, {
                    fontSize: '14px',
                    fill: '#ffffff'
                }).setOrigin(0.5);
                
                const fallbackHitArea = scene.add.rectangle(x, y, width, height, 0x000000, 0);
                fallbackHitArea.setInteractive({ useHandCursor: true });
                fallbackHitArea.on('pointerdown', () => {
                    if (callback && typeof callback === 'function') {
                        callback();
                    }
                });
                
                return { button: fallbackButton, text: fallbackText, hitArea: fallbackHitArea };
            } catch (fallbackError) {
                console.error('UITheme: Even fallback button creation failed:', fallbackError);
                return null;
            }
        }
    }
    
    // Get button style by name
    static getButtonStyle(styleName) {
        return UITheme.buttonStyles[styleName] || UITheme.buttonStyles.primary;
    }
    
    // Get rarity color
    static getRarityColor(rarity) {
        const rarityColors = {
            1: UITheme.colors.rarity[1],
            2: UITheme.colors.rarity[2],
            3: UITheme.colors.rarity[3],
            4: UITheme.colors.rarity[4],
            5: UITheme.colors.rarity[5]
        };
        return rarityColors[rarity] || UITheme.colors.rarity[1];
    }
    
    // Get rarity color as hex string
    static getRarityColorHex(rarity) {
        const color = UITheme.getRarityColor(rarity);
        return '#' + color.toString(16).padStart(6, '0');
    }
    
    // Create loading indicator
    static createLoadingIndicator(scene, x, y, size = 50) {
        const container = scene.add.container(x, y);
        
        // Spinning circle
        const spinner = scene.add.graphics();
        spinner.lineStyle(4, UITheme.colors.primary, 0.8);
        spinner.arc(0, 0, size/2, 0, Math.PI * 1.5);
        container.add(spinner);
        
        // Spin animation
        scene.tweens.add({
            targets: spinner,
            rotation: Math.PI * 2,
            duration: 1000,
            repeat: -1,
            ease: 'Linear'
        });
        
        // Loading text
        const loadingText = UITheme.createText(scene, 0, size/2 + 20, 'Loading...', 'bodySmall');
        loadingText.setOrigin(0.5);
        container.add(loadingText);
        
        return container;
    }
    
    // Create notification toast
    static createNotification(scene, text, type = 'info', duration = 3000) {
        const colors = {
            info: UITheme.colors.info,
            success: UITheme.colors.success,
            warning: UITheme.colors.warning,
            error: UITheme.colors.error
        };
        
        const color = colors[type] || colors.info;
        const x = scene.cameras.main.width / 2;
        const y = 100;
        
        const notification = scene.add.container(x, y);
        notification.setDepth(10000);
        
        // Background
        const bg = scene.add.graphics();
        bg.fillStyle(color, 0.9);
        bg.fillRoundedRect(-150, -25, 300, 50, 25);
        bg.lineStyle(2, 0xffffff, 0.5);
        bg.strokeRoundedRect(-150, -25, 300, 50, 25);
        notification.add(bg);
        
        // Text
        const notificationText = UITheme.createText(scene, 0, 0, text, 'bodyMedium');
        notificationText.setOrigin(0.5);
        notification.add(notificationText);
        
        // Slide in animation
        notification.setAlpha(0);
        notification.y -= 50;
        scene.tweens.add({
            targets: notification,
            alpha: 1,
            y: y,
            duration: UITheme.animations.medium,
            ease: UITheme.animations.easing.easeOut
        });
        
        // Auto-hide
        scene.time.delayedCall(duration, () => {
            scene.tweens.add({
                targets: notification,
                alpha: 0,
                y: y - 50,
                duration: UITheme.animations.medium,
                ease: UITheme.animations.easing.easeIn,
                onComplete: () => notification.destroy()
            });
        });
        
        return notification;
    }
    
    static createTooltip(scene) {
        const tooltipContainer = scene.add.container(0, 0);
        tooltipContainer.setDepth(20000).setVisible(false);

        const text = UITheme.createText(scene, 0, 0, '', 'bodySmall');
        text.setPadding(UITheme.spacing.small, UITheme.spacing.tiny);
        text.setWordWrapWidth(200);

        const bg = scene.add.graphics();
        tooltipContainer.add([bg, text]);

        tooltipContainer.show = (x, y, content) => {
            text.setText(content);
            const bounds = text.getBounds();
            
            bg.clear();
            bg.fillStyle(UITheme.colors.dark, 0.9);
            bg.fillRoundedRect(bounds.x - 4, bounds.y - 4, bounds.width + 8, bounds.height + 8, UITheme.borders.radius.small);
            bg.lineStyle(1, UITheme.colors.light, 0.5);
            bg.strokeRoundedRect(bounds.x - 4, bounds.y - 4, bounds.width + 8, bounds.height + 8, UITheme.borders.radius.small);

            tooltipContainer.setPosition(x, y);
            tooltipContainer.setVisible(true);
        };
        
        tooltipContainer.hide = () => {
            tooltipContainer.setVisible(false);
        };

        return tooltipContainer;
    }
}

// Export for backward compatibility
export default UITheme; 