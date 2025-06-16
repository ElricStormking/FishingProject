import UITheme from './UITheme.js';

export class QTEDebugTool {
    constructor(scene) {
        this.scene = scene;
        this.isVisible = false;
        
        // QTE types and struggle patterns
        this.qteTypes = ['tap', 'hold', 'sequence', 'timing'];
        this.struggleTypes = ['dash', 'thrash', 'dive', 'surface', 'circle', 'jump', 'roll', 'shake', 'pull', 'spiral'];
        
        // Initialize stats object properly to prevent undefined errors
        this.stats = {
            totalTests: 0,
            successfulTests: 0,
            failedTests: 0,
            totalReactionTime: 0,
            bestReactionTime: Infinity,
            qteTypeStats: {},
            struggleTypesTested: {}
        };
        
        // Debug statistics
        this.debugStats = {
            totalQTEs: 0,
            successfulQTEs: 0,
            failedQTEs: 0,
            qteTypeStats: {},
            struggleTypeStats: {},
            averageReactionTime: 0,
            reactionTimes: []
        };
        
        // Initialize stats
        this.initializeStats();
        
        // Standalone testing system - completely separate from main game
        this.standaloneTesting = true;
        this.activeStandaloneQTE = null;
        this.standaloneQTEContainer = null;
        
        // Input isolation system
        this.inputIsolationActive = false;
        this.originalGameInputHandlers = {};
        this.debugToolInputHandlers = {};
        
        // Initialize debug session state
        this.debugSessionActive = false;
        this.autoTestMode = false;
        this.debugDifficulty = 3;
        
        // Initialize UI containers and elements
        this.container = null;
        this.panels = {};
        this.statsDisplayElements = [];
        
        // Initialize timer references
        this.realtimeTimer = null;
        this.autoTestTimer = null;
        this.holdProgressTimer = null;
        this.resultDismissTimer = null;
        
        // Initialize QTE-related properties
        this.mockQTE = null;
        this.mockQTEContainer = null;
        this.mockQTEBackground = null;
        this.qteInstructions = null;
        this.qteTapIndicator = null;
        this.qteTimingTarget = null;
        this.qteTimingIndicator = null;
        this.qteProgressBar = null;
        this.qteArrows = [];
        this.holdBarFill = null;
        this.tapCounter = null;
        this.sequenceProgress = null;
        
        // Initialize feedback elements
        this.holdProgressBar = null;
        this.holdProgressFill = null;
        this.tapFeedback = null;
        this.tapCountText = null;
        this.sequenceFeedback = null;
        this.sequenceItems = [];
        
        // Initialize result overlay
        this.currentResultOverlay = null;
        this.resultKeyHandler = null;
        
        // Initialize stats panel reference
        this.statsPanel = null;
        
        // Initialize hold QTE tracking
        this.holdCompleted = false;
        
            }
    
    initializeStats() {
        // Initialize QTE type statistics
        this.qteTypes.forEach(type => {
            this.debugStats.qteTypeStats[type] = {
                attempts: 0,
                successes: 0,
                failures: 0,
                successRate: 0,
                averageTime: 0
            };
        });
        
        // Initialize struggle type statistics
        this.struggleTypes.forEach(type => {
            this.debugStats.struggleTypeStats[type] = {
                triggered: 0,
                qtesGenerated: 0,
                successRate: 0
            };
        });
    }
    
    show() {
        if (this.isVisible) return;
        
        this.isVisible = true;
        
        // Enable input isolation FIRST before creating interface
        this.enableInputIsolation();
        
        this.createDebugInterface();
            }
    
    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        
        // Stop any active debug sessions
        this.stopDebugSession();
        this.stopAutoTesting();
        
        // Clean up mock QTE
        this.destroyMockQTE();
        
        // Clean up stats display elements
        if (this.statsDisplayElements) {
            this.statsDisplayElements.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            this.statsDisplayElements = [];
        }
        
        // Clean up timers
        if (this.realtimeTimer) {
            this.realtimeTimer.destroy();
            this.realtimeTimer = null;
        }
        
        if (this.autoTestTimer) {
            this.autoTestTimer.destroy();
            this.autoTestTimer = null;
        }
        
        // LAST: Disable input isolation and restore game controls
        this.disableInputIsolation();
        
        // Clean up main container
        if (this.container) {
            this.container.setVisible(false);
        }
        
        console.log('QTEDebugTool: Hidden with proper cleanup and input isolation disabled');
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    createDebugInterface() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Main container
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(3000); // Above all other UI, but QTEs will be at 5000
        
        // NO background overlay - let QTE area remain completely clear
        console.log('QTEDebugTool: Skipping background overlay to keep QTE area clear');
        
        // Main debug panel
        const panelWidth = 800;
        const panelHeight = 600;
        const panelX = (width - panelWidth) / 2;
        const panelY = (height - panelHeight) / 2;
        
        // Panel background
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(0x1a1a2e, 0.95);
        panelBg.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        panelBg.lineStyle(2, 0x4a90e2);
        panelBg.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        this.container.add(panelBg);
        
        // Title with fallback if UITheme fails
        let title;
        try {
            title = UITheme.createText(this.scene, panelX + panelWidth/2, panelY + 30, 'QTE Debug Tool', 'headerLarge');
            title.setOrigin(0.5, 0);
            title.setColor(UITheme.colors.gold || '#FFD700');
        } catch (error) {
            console.warn('QTEDebugTool: UITheme failed, using fallback text:', error);
            title = this.scene.add.text(panelX + panelWidth/2, panelY + 30, 'QTE Debug Tool', {
                fontSize: '24px',
                fontFamily: 'Arial, sans-serif',
                color: '#FFD700',
                fontWeight: 'bold'
            });
            title.setOrigin(0.5, 0);
        }
        this.container.add(title);
        
        // Create sub-panels
        this.createControlPanel(panelX + 20, panelY + 70, 360, 250);
        this.createStatsPanel(panelX + 400, panelY + 70, 360, 250);
        this.createQTETestPanel(panelX + 20, panelY + 340, 360, 220);
        this.createStruggleTestPanel(panelX + 400, panelY + 340, 360, 220);
        
        // Close button
        this.createCloseButton(panelX + panelWidth - 40, panelY + 20);
        
            }
    
    createControlPanel(x, y, width, height) {
        // Panel background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x2a2a2a, 0.8);
        bg.fillRoundedRect(x, y, width, height, 8);
        bg.lineStyle(1, 0x888888);
        bg.strokeRoundedRect(x, y, width, height, 8);
        this.container.add(bg);
        
        // Panel title with fallback
        let title;
        try {
            title = UITheme.createText(this.scene, x + width/2, y + 15, 'Debug Controls', 'headerMedium');
            title.setOrigin(0.5, 0);
            title.setColor('#4a90e2');
        } catch (error) {
            console.warn('QTEDebugTool: UITheme failed, using fallback text:', error);
            title = this.scene.add.text(x + width/2, y + 15, 'Debug Controls', {
                fontSize: '18px',
                fontFamily: 'Arial, sans-serif',
                color: '#4a90e2',
                fontWeight: 'bold'
            });
            title.setOrigin(0.5, 0);
        }
        this.container.add(title);
        
        let currentY = y + 50;
        const buttonSpacing = 35;
        
        // Start Debug Session button
        const startBtn = this.createButton(x + 20, currentY, 140, 30, 'Start Debug Session', () => {
            this.startDebugSession();
        });
        this.container.add(startBtn);
        
        const stopBtn = this.createButton(x + 180, currentY, 140, 30, 'Stop Debug Session', () => {
            this.stopDebugSession();
        });
        this.container.add(stopBtn);
        currentY += buttonSpacing;
        
        // Reset Stats button
        const resetBtn = this.createButton(x + 20, currentY, 140, 30, 'Reset Statistics', () => {
            this.resetDebugStats();
        });
        this.container.add(resetBtn);
        
        // Export Stats button
        const exportBtn = this.createButton(x + 180, currentY, 140, 30, 'Export Stats', () => {
            this.exportDebugStats();
        });
        this.container.add(exportBtn);
        currentY += buttonSpacing;
        
        // Difficulty slider
        let difficultyLabel;
        try {
            difficultyLabel = UITheme.createText(this.scene, x + 20, currentY, 'Debug Difficulty:', 'bodyMedium');
        } catch (error) {
            difficultyLabel = this.scene.add.text(x + 20, currentY, 'Debug Difficulty:', {
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                color: '#ffffff'
            });
        }
        this.container.add(difficultyLabel);
        currentY += 25;
        
        this.difficultySlider = this.createSlider(x + 20, currentY, 300, 25, 1, 5, 3, (value) => {
            this.debugDifficulty = value;
            if (this.difficultyValueText) {
                this.difficultyValueText.setText(`${value}`);
            }
        });
        this.container.add(this.difficultySlider);
        currentY += 35;
        
        // Difficulty value display
        try {
            this.difficultyValueText = UITheme.createText(this.scene, x + 330, currentY - 35, '3', 'bodyMedium');
        } catch (error) {
            this.difficultyValueText = this.scene.add.text(x + 330, currentY - 35, '3', {
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                color: '#ffffff'
            });
        }
        this.container.add(this.difficultyValueText);
        
        // Auto-test mode toggle
        let autoTestLabel;
        try {
            autoTestLabel = UITheme.createText(this.scene, x + 20, currentY, 'Auto-Test Mode:', 'bodyMedium');
        } catch (error) {
            autoTestLabel = this.scene.add.text(x + 20, currentY, 'Auto-Test Mode:', {
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                color: '#ffffff'
            });
        }
        this.container.add(autoTestLabel);
        
        this.autoTestToggle = this.createToggle(x + 250, currentY, (enabled) => {
            this.autoTestMode = enabled;
            if (enabled) {
                this.startAutoTesting();
            } else {
                this.stopAutoTesting();
            }
        });
        this.container.add(this.autoTestToggle);
        
        this.panels.control = { bg, title };
    }
    
    createStatsPanel(x, y, width, height) {
        // Panel background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x2a2a2a, 0.8);
        bg.fillRoundedRect(x, y, width, height, 8);
        bg.lineStyle(1, 0x888888);
        bg.strokeRoundedRect(x, y, width, height, 8);
        this.container.add(bg);
        
        // Panel title with fallback
        let title;
        try {
            title = UITheme.createText(this.scene, x + width/2, y + 15, 'Statistics', 'headerMedium');
            title.setOrigin(0.5, 0);
            title.setColor('#4a90e2');
        } catch (error) {
            console.warn('QTEDebugTool: UITheme failed, using fallback text:', error);
            title = this.scene.add.text(x + width/2, y + 15, 'Statistics', {
                fontSize: '18px',
                fontFamily: 'Arial, sans-serif',
                color: '#4a90e2',
                fontWeight: 'bold'
            });
            title.setOrigin(0.5);
        }
        this.container.add(title);
        
        // Create stats display area
        this.updateStatsDisplay(x + 10, y + 45, width - 20, height - 55);
        
        // Store panel reference for later use
        this.statsPanel = { bg, title, x: x + 10, y: y + 45, width: width - 20, height: height - 55 };
        this.panels.stats = { bg, title };
    }
    
    createQTETestPanel(x, y, width, height) {
        // Panel background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x2a2a2a, 0.8);
        bg.fillRoundedRect(x, y, width, height, 8);
        bg.lineStyle(1, 0x888888);
        bg.strokeRoundedRect(x, y, width, height, 8);
        this.container.add(bg);
        
        // Panel title
        const title = UITheme.createText(this.scene, x + width/2, y + 15, 'QTE Type Testing', 'headerMedium');
        title.setOrigin(0.5, 0);
        title.setColor('#4a90e2');
        this.container.add(title);
        
        let currentY = y + 45;
        const buttonWidth = 80;
        const buttonHeight = 25;
        const spacing = 90;
        
        // Create buttons for each QTE type
        this.qteTypes.forEach((qteType, index) => {
            const btnX = x + 10 + (index % 4) * spacing;
            const btnY = currentY + Math.floor(index / 4) * 35;
            
            const btn = this.createButton(btnX, btnY, buttonWidth, buttonHeight, qteType.toUpperCase(), () => {
                this.testQTEType(qteType);
            });
            this.container.add(btn);
        });
        
        currentY += 80;
        
        // Test all QTEs button
        const testAllBtn = this.createButton(x + 20, currentY, 140, 30, 'Test All QTEs', () => {
            this.testAllQTETypes();
        });
        this.container.add(testAllBtn);
        
        // Rapid fire test button
        const rapidBtn = this.createButton(x + 180, currentY, 140, 30, 'Rapid Fire Test', () => {
            this.startRapidFireTest();
        });
        this.container.add(rapidBtn);
        
        this.panels.qte = { bg, title };
    }
    
    createStruggleTestPanel(x, y, width, height) {
        // Panel background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x2a2a2a, 0.8);
        bg.fillRoundedRect(x, y, width, height, 8);
        bg.lineStyle(1, 0x888888);
        bg.strokeRoundedRect(x, y, width, height, 8);
        this.container.add(bg);
        
        // Panel title
        const title = UITheme.createText(this.scene, x + width/2, y + 15, 'Struggle Pattern Testing', 'headerMedium');
        title.setOrigin(0.5, 0);
        title.setColor('#4a90e2');
        this.container.add(title);
        
        // Scrollable area for struggle types
        this.createStruggleButtons(x + 10, y + 40, width - 20, height - 80);
        
        // Test all struggles button
        const testAllBtn = this.createButton(x + 20, y + height - 35, 140, 30, 'Test All Struggles', () => {
            this.testAllStruggleTypes();
        });
        this.container.add(testAllBtn);
        
        // Random struggle button
        const randomBtn = this.createButton(x + 180, y + height - 35, 140, 30, 'Random Struggle', () => {
            this.testRandomStruggle();
        });
        this.container.add(randomBtn);
        
        this.panels.struggle = { bg, title };
    }
    
    createStruggleButtons(x, y, width, height) {
        const buttonWidth = 70;
        const buttonHeight = 20;
        const spacing = 75;
        const rowSpacing = 25;
        
        this.struggleTypes.forEach((struggleType, index) => {
            const col = index % 4;
            const row = Math.floor(index / 4);
            const btnX = x + col * spacing;
            const btnY = y + row * rowSpacing;
            
            if (btnY + buttonHeight <= y + height - 10) {
                const btn = this.createButton(btnX, btnY, buttonWidth, buttonHeight, struggleType, () => {
                    this.testStruggleType(struggleType);
                }, 'small');
                this.container.add(btn);
            }
        });
    }
    
    createButton(x, y, width, height, text, onClick, size = 'medium') {
        console.log(`QTEDebugTool: Creating button "${text}" at (${x}, ${y}) size ${width}x${height}`);
        
        const container = this.scene.add.container(x, y);
        
        // Button background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x4a90e2, 0.9);
        bg.fillRoundedRect(0, 0, width, height, 5);
        bg.lineStyle(1, 0x6bb6ff);
        bg.strokeRoundedRect(0, 0, width, height, 5);
        container.add(bg);
        
        // Button text - use simple Phaser text as fallback if UITheme fails
        let buttonText;
        try {
            const textStyle = size === 'small' ? 'bodySmall' : 'bodyMedium';
            buttonText = UITheme.createText(this.scene, width/2, height/2, text, textStyle);
            buttonText.setOrigin(0.5);
            buttonText.setColor('#ffffff');
            buttonText.setFontStyle('bold');
        } catch (error) {
            console.warn('QTEDebugTool: UITheme text creation failed, using fallback:', error);
            // Fallback to standard Phaser text
            const fontSize = size === 'small' ? '10px' : '12px';
            buttonText = this.scene.add.text(width/2, height/2, text, {
                fontSize: fontSize,
                fontFamily: 'Arial, sans-serif',
                color: '#ffffff',
                fontStyle: 'bold',
                align: 'center'
            });
            buttonText.setOrigin(0.5);
        }
        container.add(buttonText);
        
                // Interactive area using rectangle with proper hit area
        const hitArea = this.scene.add.rectangle(width/2, height/2, width, height, 0x000000, 0);
        hitArea.setInteractive({
            useHandCursor: true,
            hitArea: new Phaser.Geom.Rectangle(0, 0, width, height),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains
        });
        container.add(hitArea);
        
        // Hover effects with error handling
        hitArea.on('pointerover', () => {
            try {
                bg.clear();
                bg.fillStyle(0x6bb6ff, 0.9);
                bg.fillRoundedRect(0, 0, width, height, 5);
                bg.lineStyle(1, 0x87ceeb);
                bg.strokeRoundedRect(0, 0, width, height, 5);
                buttonText.setScale(1.05);
            } catch (error) {
                console.warn('QTEDebugTool: Error in button hover effect:', error);
            }
        });
        
        hitArea.on('pointerout', () => {
            try {
                bg.clear();
                bg.fillStyle(0x4a90e2, 0.9);
                bg.fillRoundedRect(0, 0, width, height, 5);
                bg.lineStyle(1, 0x6bb6ff);
                bg.strokeRoundedRect(0, 0, width, height, 5);
                buttonText.setScale(1.0);
            } catch (error) {
                console.warn('QTEDebugTool: Error in button hover reset:', error);
            }
        });
        
        hitArea.on('pointerdown', () => {
            try {
                bg.clear();
                bg.fillStyle(0x2c5aa0, 0.9);
                bg.fillRoundedRect(0, 0, width, height, 5);
                buttonText.setScale(0.95);
                
                console.log(`QTEDebugTool: Button "${text}" clicked`);
                
                if (onClick && typeof onClick === 'function') {
                    onClick();
                } else {
                    console.warn(`QTEDebugTool: No onClick handler for button "${text}"`);
                }
                
                this.scene.time.delayedCall(100, () => {
                    try {
                        bg.clear();
                        bg.fillStyle(0x4a90e2, 0.9);
                        bg.fillRoundedRect(0, 0, width, height, 5);
                        bg.lineStyle(1, 0x6bb6ff);
                        bg.strokeRoundedRect(0, 0, width, height, 5);
                        buttonText.setScale(1.0);
                    } catch (resetError) {
                        console.warn('QTEDebugTool: Error resetting button appearance:', resetError);
                    }
                });
            } catch (error) {
                console.warn('QTEDebugTool: Error in button click handler:', error);
            }
        });
        
        return container;
    }
    
    createSlider(x, y, width, height, min, max, value, onChange) {
        const container = this.scene.add.container(x, y);
        
        // Slider track
        const track = this.scene.add.graphics();
        track.fillStyle(0x1a1a1a, 0.8);
        track.fillRoundedRect(0, height/2 - 2, width, 4, 2);
        container.add(track);
        
        // Slider fill
        const fill = this.scene.add.graphics();
        const fillWidth = ((value - min) / (max - min)) * width;
        fill.fillStyle(0x4a90e2, 0.9);
        fill.fillRoundedRect(0, height/2 - 2, fillWidth, 4, 2);
        container.add(fill);
        
        // Slider handle
        const handleX = ((value - min) / (max - min)) * width;
        const handle = this.scene.add.circle(handleX, height/2, 8, 0x6bb6ff);
        handle.setStrokeStyle(2, 0x4a90e2);
        container.add(handle);
        
        // Interactive area for the entire slider
        const interactive = this.scene.add.rectangle(width/2, height/2, width, height, 0x000000, 0);
        interactive.setInteractive({
            useHandCursor: true,
            hitArea: new Phaser.Geom.Rectangle(0, 0, width, height),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            draggable: false
        });
        container.add(interactive);
        
        let isDragging = false;
        
        // Mouse events with error handling
        interactive.on('pointerdown', (pointer) => {
            try {
                isDragging = true;
                this.updateSlider(pointer, track, fill, handle, width, min, max, onChange);
            } catch (error) {
                console.warn('QTEDebugTool: Error in slider pointerdown:', error);
            }
        });
        
        interactive.on('pointermove', (pointer) => {
            if (!isDragging) return;
            try {
                this.updateSlider(pointer, track, fill, handle, width, min, max, onChange);
            } catch (error) {
                console.warn('QTEDebugTool: Error in slider pointermove:', error);
            }
        });
        
        interactive.on('pointerup', () => {
            isDragging = false;
        });
        
        // Store references for updates
        container.sliderData = {
            track, fill, handle, interactive, width, min, max, onChange,
            currentValue: value
        };
        
        return container;
    }
    
    updateSlider(pointer, track, fill, handle, width, min, max, onChange) {
        try {
            // Get local position
            const localX = Math.max(0, Math.min(width, pointer.x - track.x));
            const percentage = localX / width;
            const newValue = min + (max - min) * percentage;
            
            // Update fill
            fill.clear();
            fill.fillStyle(0x4a90e2, 0.9);
            fill.fillRoundedRect(0, handle.y - 2, localX, 4, 2);
            
            // Update handle position
            handle.x = localX;
            
            // Call onChange with error handling
            if (onChange && typeof onChange === 'function') {
                onChange(Math.round(newValue));
            }
        } catch (error) {
            console.warn('QTEDebugTool: Error updating slider:', error);
        }
    }
    
    createToggle(x, y, onChange) {
        const container = this.scene.add.container(x, y);
        
        // Toggle background
        const bg = this.scene.add.graphics();
        const backgroundDark = (typeof UITheme !== 'undefined' && UITheme.colors) ? UITheme.colors.backgroundDark : 0x2c3e50;
        bg.fillStyle(backgroundDark);
        bg.fillRoundedRect(0, 0, 40, 20, 10);
        container.add(bg);
        
        // Toggle handle
        const handle = this.scene.add.graphics();
        const textColor = (typeof UITheme !== 'undefined' && UITheme.colors) ? UITheme.colors.text : 0xffffff;
        handle.fillStyle(textColor);
        handle.fillCircle(0, 0, 8);
        handle.x = 10;
        handle.y = 10;
        container.add(handle);
        
        let isEnabled = false;
        
        // Interactive area
        const hitArea = this.scene.add.rectangle(20, 10, 40, 20, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        container.add(hitArea);
        
        hitArea.on('pointerdown', () => {
            isEnabled = !isEnabled;
            
            if (isEnabled) {
                bg.clear();
                const primaryColor = (typeof UITheme !== 'undefined' && UITheme.colors) ? UITheme.colors.primary : 0x4a90e2;
                bg.fillStyle(primaryColor);
                bg.fillRoundedRect(0, 0, 40, 20, 10);
                handle.x = 30;
                handle.clear();
                const textLightColor = (typeof UITheme !== 'undefined' && UITheme.colors) ? UITheme.colors.textLight : 0xffffff;
                handle.fillStyle(textLightColor);
                handle.fillCircle(0, 0, 8);
            } else {
                bg.clear();
                bg.fillStyle(backgroundDark);
                bg.fillRoundedRect(0, 0, 40, 20, 10);
                handle.x = 10;
                handle.clear();
                handle.fillStyle(textColor);
                handle.fillCircle(0, 0, 8);
            }
            
            if (onChange) onChange(isEnabled);
        });
        
        return container;
    }
    
    createCloseButton(x, y) {
        const closeBtn = this.createButton(x, y, 30, 30, '×', () => {
            this.hide();
        });
        this.container.add(closeBtn);
    }
    
    updateStatsDisplay(x, y, width, height) {
        // Clear existing stats display elements properly
        if (this.statsDisplayElements) {
            this.statsDisplayElements.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
        }
        
        // Initialize or reset the stats display elements array
        this.statsDisplayElements = [];
        
        let currentY = y;
        const lineHeight = 18;
        
        // Overall stats
        const totalQTEs = this.debugStats.totalQTEs;
        const successRate = totalQTEs > 0 ? ((this.debugStats.successfulQTEs / totalQTEs) * 100).toFixed(1) : 0;
        
        let overallText;
        try {
            overallText = UITheme.createText(this.scene, x, currentY, 
                `Total QTEs: ${totalQTEs} | Success Rate: ${successRate}%`, 'bodySmall');
            overallText.setColor('#87ceeb');
        } catch (error) {
            overallText = this.scene.add.text(x, currentY, 
                `Total QTEs: ${totalQTEs} | Success Rate: ${successRate}%`, {
                fontSize: '12px',
                fontFamily: 'Arial, sans-serif',
                color: '#87ceeb'
            });
        }
        this.container.add(overallText);
        this.statsDisplayElements.push(overallText);
        currentY += lineHeight + 5;
        
        // QTE type breakdown
        let qteHeader;
        try {
            qteHeader = UITheme.createText(this.scene, x, currentY, 'QTE Type Breakdown:', 'bodyMedium');
            qteHeader.setColor('#4a90e2');
        } catch (error) {
            qteHeader = this.scene.add.text(x, currentY, 'QTE Type Breakdown:', {
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                color: '#4a90e2',
                fontWeight: 'bold'
            });
        }
        this.container.add(qteHeader);
        this.statsDisplayElements.push(qteHeader);
        currentY += lineHeight;
        
        this.qteTypes.forEach(type => {
            const stats = this.debugStats.qteTypeStats[type] || { attempts: 0, successes: 0 };
            const rate = stats.attempts > 0 ? ((stats.successes / stats.attempts) * 100).toFixed(1) : 0;
            
            let typeText;
            try {
                typeText = UITheme.createText(this.scene, x + 10, currentY, 
                    `${type}: ${stats.successes}/${stats.attempts} (${rate}%)`, 'bodySmall');
                typeText.setColor('#ffffff');
            } catch (error) {
                typeText = this.scene.add.text(x + 10, currentY, 
                    `${type}: ${stats.successes}/${stats.attempts} (${rate}%)`, {
                    fontSize: '12px',
                    fontFamily: 'Arial, sans-serif',
                    color: '#ffffff'
                });
            }
            this.container.add(typeText);
            this.statsDisplayElements.push(typeText);
            currentY += lineHeight;
        });
        
        currentY += 5;
        
        // Struggle type breakdown
        const struggleHeader = UITheme.createText(this.scene, x, currentY, 'Struggle Types Tested:', 'bodyMedium');
        struggleHeader.setColor('#4a90e2');
        this.container.add(struggleHeader);
        this.statsDisplayElements.push(struggleHeader);
        currentY += lineHeight;
        
        this.struggleTypes.slice(0, 5).forEach(type => { // Show first 5 to fit
            const stats = this.debugStats.struggleTypeStats[type];
            
            const typeText = UITheme.createText(this.scene, x + 10, currentY, 
                `${type}: ${stats.triggered} times`, 'bodySmall');
            typeText.setColor('#ffffff');
            this.container.add(typeText);
            this.statsDisplayElements.push(typeText);
            currentY += lineHeight;
        });
        
        console.log(`QTEDebugTool: Updated stats display with ${this.statsDisplayElements.length} elements`);
    }
    
    // Standalone debug session methods - completely separate from main game
    startDebugSession() {
                this.debugSessionActive = true;
        
        // Start real-time monitoring timer for standalone system
        this.startRealtimeMonitoring();
        
        this.showDebugMessage('Standalone QTE testing session started!', 'success');
    }
    
    stopDebugSession() {
        console.log('QTEDebugTool: Stopping standalone debug session');
        this.debugSessionActive = false;
        
        // Stop monitoring
        this.stopRealtimeMonitoring();
        
        // Clean up any active standalone QTE
        this.destroyStandaloneQTE();
        
        this.showDebugMessage('Debug session stopped', 'info');
    }
    
    startRealtimeMonitoring() {
        if (this.realtimeTimer) return;
        
        this.realtimeTimer = this.scene.time.addEvent({
            delay: 1000, // Update every second
            callback: () => {
                if (this.isVisible) {
                    this.updateRealtimeDebugDisplay();
                }
            },
            loop: true
        });
    }
    
    stopRealtimeMonitoring() {
        if (this.realtimeTimer) {
            this.realtimeTimer.destroy();
            this.realtimeTimer = null;
        }
    }
    
    updateRealtimeDebugDisplay() {
        // Update real-time display with standalone system info
        // This will be added to the UI later
    }
    
    // Debug session methods
    attachToReelingMiniGame() {
        // Try to find an active reeling mini game
        if (this.scene.reelingMiniGame) {
            this.reelingMiniGame = this.scene.reelingMiniGame;
            console.log('QTEDebugTool: Attached to active reeling mini game');
        } else if (this.scene.playerController && this.scene.playerController.reelingMiniGame) {
            this.reelingMiniGame = this.scene.playerController.reelingMiniGame;
            console.log('QTEDebugTool: Attached to player controller reeling mini game');
        } else {
            console.log('QTEDebugTool: No active reeling mini game found, will create mock testing');
        }
    }
    
    detachFromReelingMiniGame() {
        this.reelingMiniGame = null;
    }
    
    setupQTEEventListeners() {
        // Listen for QTE events from the scene
        this.scene.events.on('fishing:qteStart', this.onQTEStart, this);
        this.scene.events.on('fishing:qteComplete', this.onQTEComplete, this);
        this.scene.events.on('fishing:fishStruggle', this.onFishStruggle, this);
    }
    
    removeQTEEventListeners() {
        this.scene.events.off('fishing:qteStart', this.onQTEStart, this);
        this.scene.events.off('fishing:qteComplete', this.onQTEComplete, this);
        this.scene.events.off('fishing:fishStruggle', this.onFishStruggle, this);
    }
    
    // Event handlers
    onQTEStart(data) {
        const qte = data.qte;
        console.log(`QTEDebugTool: QTE Started - Type: ${qte.type}, Difficulty: ${qte.difficulty}`);
        
        // Record QTE start time for reaction time measurement
        this.currentQTEStartTime = performance.now();
        this.currentQTEType = qte.type;
        
        // Update stats
        this.debugStats.qteTypeStats[qte.type].attempts++;
        this.debugStats.totalQTEs++;
    }
    
    onQTEComplete(data) {
        const { qte, success } = data;
        console.log(`QTEDebugTool: QTE Completed - Type: ${qte.type}, Success: ${success}`);
        
        // Calculate reaction time
        if (this.currentQTEStartTime) {
            const reactionTime = performance.now() - this.currentQTEStartTime;
            this.debugStats.reactionTimes.push(reactionTime);
            
            // Calculate average reaction time
            const sum = this.debugStats.reactionTimes.reduce((a, b) => a + b, 0);
            this.debugStats.averageReactionTime = sum / this.debugStats.reactionTimes.length;
        }
        
        // Update stats
        if (success) {
            this.debugStats.successfulQTEs++;
            this.debugStats.qteTypeStats[qte.type].successes++;
        } else {
            this.debugStats.failedQTEs++;
            this.debugStats.qteTypeStats[qte.type].failures++;
        }
        
        // Calculate success rate for this QTE type
        const stats = this.debugStats.qteTypeStats[qte.type];
        stats.successRate = (stats.successes / stats.attempts) * 100;
        
        // Update display
        if (this.isVisible) {
            this.updateStatsDisplay(this.panels.stats.bg.x + 10, this.panels.stats.bg.y + 40, 340, 200);
        }
    }
    
    onFishStruggle(data) {
        const { struggleType, intensity } = data;
        console.log(`QTEDebugTool: Fish Struggle - Type: ${struggleType}, Intensity: ${intensity}`);
        
        // Update struggle type stats
        if (this.debugStats.struggleTypeStats[struggleType]) {
            this.debugStats.struggleTypeStats[struggleType].triggered++;
        }
    }
    
    // Standalone QTE test methods - no interference with main game
    testQTEType(qteType) {
        console.log(`QTEDebugTool: Testing standalone ${qteType} QTE`);
        
        // Simple test to verify QTE visibility
        this.scene.time.delayedCall(50, () => {
            this.verifyQTEVisibility();
        });
        
        // Always use standalone testing - never interfere with main game
        this.createStandaloneQTE(qteType);
    }
    
    verifyQTEVisibility() {
        if (this.mockQTEContainer) {
            console.log('QTEDebugTool: QTE Container verification:');
            console.log('  - Visible:', this.mockQTEContainer.visible);
            console.log('  - Active:', this.mockQTEContainer.active);
            console.log('  - Depth:', this.mockQTEContainer.depth);
            console.log('  - Position:', this.mockQTEContainer.x, this.mockQTEContainer.y);
            console.log('  - Children count:', this.mockQTEContainer.list ? this.mockQTEContainer.list.length : 0);
            console.log('  - Scene camera size:', this.scene.cameras.main.width, 'x', this.scene.cameras.main.height);
            
            // Try to make container flash to verify it's there
            if (this.mockQTEContainer.visible) {
                this.scene.tweens.add({
                    targets: this.mockQTEContainer,
                    alpha: 0.5,
                    duration: 100,
                    yoyo: true,
                    repeat: 2
                });
            }
        } else {
            console.log('QTEDebugTool: QTE Container is NULL - creation failed!');
        }
    }
    
    testStruggleType(struggleType) {
        console.log(`QTEDebugTool: Testing standalone ${struggleType} struggle`);
        
        // Simulate struggle pattern then trigger appropriate QTE
        this.simulateStrugglePattern(struggleType);
        
        // Update struggle stats immediately
        if (this.debugStats.struggleTypeStats[struggleType]) {
            this.debugStats.struggleTypeStats[struggleType].triggered++;
        }
        
        // After 1 second, trigger the corresponding QTE
        this.scene.time.delayedCall(1000, () => {
            const qteType = this.getQTETypeForStruggle(struggleType);
            this.createStandaloneQTE(qteType);
        });
        
        this.showDebugMessage(`Simulated ${struggleType} struggle pattern!`, 'info');
    }
    
    getQTETypeForStruggle(struggleType) {
        const qteMap = {
            'dash': 'tap',
            'thrash': 'sequence',
            'dive': 'timing',
            'surface': 'timing',
            'circle': 'hold',
            'jump': 'timing',
            'roll': 'sequence',
            'shake': 'tap',
            'pull': 'hold',
            'spiral': 'sequence'
        };
        return qteMap[struggleType] || 'tap';
    }
    
    simulateStrugglePattern(struggleType) {
        // Create a visual simulation of the struggle pattern
        const message = `🐟 Fish is performing: ${struggleType.toUpperCase()}`;
        this.showDebugMessage(message, 'warning');
        
        // Log the pattern details
        const patternDescriptions = {
            'dash': 'Fish makes a sudden dash away from the boat',
            'thrash': 'Fish thrashes violently side to side',
            'dive': 'Fish dives deep underwater',
            'surface': 'Fish jumps to the surface',
            'circle': 'Fish swims in tight circles',
            'jump': 'Fish leaps out of the water',
            'roll': 'Fish rolls and spins in the water',
            'shake': 'Fish shakes its head rapidly',
            'pull': 'Fish pulls steadily against the line',
            'spiral': 'Fish swims in a spiral pattern'
        };
        
        console.log(`QTEDebugTool: ${patternDescriptions[struggleType] || 'Unknown pattern'}`);
    }
    
    testAllQTETypes() {
        console.log('QTEDebugTool: Testing all QTE types (standalone)');
        
        let index = 0;
        const testNext = () => {
            if (index < this.qteTypes.length) {
                this.testQTEType(this.qteTypes[index]);
                index++;
                this.scene.time.delayedCall(4000, testNext); // Give time for each QTE
            } else {
                this.showDebugMessage('All QTE types tested!', 'success');
            }
        };
        
        this.showDebugMessage('Starting QTE type test sequence...', 'info');
        testNext();
    }
    
    testAllStruggleTypes() {
        console.log('QTEDebugTool: Testing all struggle types (standalone)');
        
        let index = 0;
        const testNext = () => {
            if (index < this.struggleTypes.length) {
                this.testStruggleType(this.struggleTypes[index]);
                index++;
                this.scene.time.delayedCall(3000, testNext); // 3 seconds between tests
            } else {
                this.showDebugMessage('All struggle types tested!', 'success');
            }
        };
        
        this.showDebugMessage('Starting struggle pattern test sequence...', 'info');
        testNext();
    }
    
    testRandomStruggle() {
        const randomStruggle = this.struggleTypes[Math.floor(Math.random() * this.struggleTypes.length)];
        this.testStruggleType(randomStruggle);
    }
    
    startRapidFireTest() {
                let count = 0;
        const maxTests = 20;
        
        const rapidTest = () => {
            if (count < maxTests) {
                const randomQTE = this.qteTypes[Math.floor(Math.random() * this.qteTypes.length)];
                this.testQTEType(randomQTE);
                count++;
                this.scene.time.delayedCall(2000, rapidTest); // 2 second intervals
            } else {
                this.showDebugMessage(`Rapid fire test completed! (${maxTests} QTEs)`, 'success');
            }
        };
        
        this.showDebugMessage('Starting rapid fire test...', 'info');
        rapidTest();
    }
    
    startAutoTesting() {
        if (this.autoTestTimer) return;
        
                this.autoTestTimer = this.scene.time.addEvent({
            delay: 5000, // Test every 5 seconds
            callback: () => {
                if (Math.random() < 0.5) {
                    // Test random QTE
                    const randomQTE = this.qteTypes[Math.floor(Math.random() * this.qteTypes.length)];
                    this.testQTEType(randomQTE);
                } else {
                    // Test random struggle
                    this.testRandomStruggle();
                }
            },
            loop: true
        });
    }
    
    stopAutoTesting() {
        if (this.autoTestTimer) {
            this.autoTestTimer.destroy();
            this.autoTestTimer = null;
            console.log('QTEDebugTool: Auto testing stopped');
        }
    }
    
    createStandaloneQTE(qteType) {
        console.log('QTEDebugTool: Creating standalone QTE -', qteType);
        
        this.destroyStandaloneQTE();
        
        // Reset hold tracking flag
        this.holdCompleted = false;
        
        // Use same styling and structure as ReelingMiniGame
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        this.mockQTEContainer = this.scene.add.container(width / 2, height / 2);
        this.mockQTEContainer.setDepth(5000); // HIGHER than debug interface (3000)
        this.mockQTEContainer.setVisible(true);
        
                // Create background panel - EXACT MATCH to ReelingMiniGame
        this.mockQTEBackground = this.scene.add.graphics();
        this.mockQTEBackground.fillStyle(0x2c3e50, 0.95);
        this.mockQTEBackground.fillRoundedRect(-150, -80, 300, 160, 10);
        this.mockQTEBackground.lineStyle(3, 0x3498db);
        this.mockQTEBackground.strokeRoundedRect(-150, -80, 300, 160, 10);
        this.mockQTEContainer.add(this.mockQTEBackground);
        
                // QTE settings - EXACT MATCH to ReelingMiniGame
        const difficulty = this.debugDifficulty || 3;
        this.mockQTE = {
            type: qteType,
            difficulty: difficulty,
            timeLimit: this.calculateQTETimeLimit(qteType, difficulty),
            startTime: this.scene.time.now,
            completed: false,
            success: false
        };
        
        console.log(`QTEDebugTool: QTE settings - Type: ${qteType}, Difficulty: ${difficulty}, TimeLimit: ${this.mockQTE.timeLimit}ms`);
        
        // Generate QTE-specific data - EXACT MATCH to ReelingMiniGame
        switch (qteType) {
            case 'tap':
                this.mockQTE.requiredTaps = difficulty + 2; // 5 taps for difficulty 3
                this.mockQTE.currentTaps = 0;
                console.log(`QTEDebugTool: Creating TAP QTE - ${this.mockQTE.requiredTaps} taps required`);
                this.createStandaloneTapQTE();
                break;
            case 'hold':
                this.mockQTE.holdDuration = 1500; // EXACT MATCH: Fixed 1.5 seconds
                this.mockQTE.holdStartTime = null;
                console.log('QTEDebugTool: Creating HOLD QTE - 1.5 seconds required');
                this.createStandaloneHoldQTE();
                break;
            case 'sequence':
                this.mockQTE.sequence = this.generateReelingSequence(difficulty + 2); // 5 keys for difficulty 3
                this.mockQTE.currentIndex = 0;
                console.log('QTEDebugTool: Creating SEQUENCE QTE -', this.mockQTE.sequence);
                this.createStandaloneSequenceQTE();
                break;
            case 'timing':
                this.mockQTE.targetTime = this.mockQTE.timeLimit * 0.7; // EXACT MATCH: Hit at 70% of time limit
                this.mockQTE.tolerance = 200; // EXACT MATCH: ±200ms tolerance
                console.log('QTEDebugTool: Creating TIMING QTE - target at', this.mockQTE.targetTime, 'ms');
                this.createStandaloneTimingQTE();
                break;
        }
        
        // Create progress bar - EXACT MATCH to ReelingMiniGame
        this.createReelingStyleProgressBar();
        
        // Add pulsing animation to container - EXACT MATCH
        this.scene.tweens.add({
            targets: this.mockQTEContainer,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Set up input handling
        this.setupStandaloneQTEInput(qteType);
        
        // Set QTE timeout
        this.scene.time.delayedCall(this.mockQTE.timeLimit, () => {
            if (this.mockQTE && !this.mockQTE.completed) {
                this.completeStandaloneQTE(false, 'timeout');
            }
        });
        
        // Update stats
        this.stats.totalTests++;
        this.onStandaloneQTEStart();
        
        console.log('QTEDebugTool: Standalone QTE creation completed, container should be visible');
        
        // Force a brief delay to ensure everything is rendered
        this.scene.time.delayedCall(100, () => {
            if (this.mockQTEContainer) {
                console.log('QTEDebugTool: QTE Container visibility check - Visible:', this.mockQTEContainer.visible, 'Active:', this.mockQTEContainer.active);
            }
        });
    }

    // Calculate time limit based on QTE type and difficulty
    calculateQTETimeLimit(qteType, difficulty) {
        switch (qteType) {
            case 'hold':
                return 3000; // 3 seconds for hold QTEs
            case 'sequence':
                return 5000; // 5 seconds for sequence QTEs (longer for complex sequences)
            case 'tap':
                return 3000 - (difficulty * 300); // Shorter for higher difficulty tap QTEs
            case 'timing':
                return 4000; // 4 seconds for timing QTEs
            default:
                return 3000 - (difficulty * 500); // Default fallback
        }
    }

    // EXACT MATCH to ReelingMiniGame sequence generation
    generateReelingSequence(length) {
        const inputs = ['up', 'down', 'left', 'right'];
        const sequence = [];
        for (let i = 0; i < length; i++) {
            sequence.push(Phaser.Utils.Array.GetRandom(inputs));
        }
        return sequence;
    }

    // EXACT MATCH to ReelingMiniGame TAP QTE visuals
    createStandaloneTapQTE() {
        console.log('QTEDebugTool: Creating TAP QTE visuals');
        
        // Instructions - EXACT MATCH
        this.qteInstructions = this.scene.add.text(0, -50, 
            `TAP SPACE ${this.mockQTE.requiredTaps} TIMES!`, {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        this.qteInstructions.setOrigin(0.5);
        this.mockQTEContainer.add(this.qteInstructions);
        console.log('QTEDebugTool: TAP instructions added to container');
        
        // Tap indicator - EXACT MATCH
        this.qteTapIndicator = this.scene.add.graphics();
        this.qteTapIndicator.fillStyle(0x3498db);
        this.qteTapIndicator.fillRoundedRect(-30, -10, 60, 20, 5);
        this.qteTapIndicator.lineStyle(2, 0x2980b9);
        this.qteTapIndicator.strokeRoundedRect(-30, -10, 60, 20, 5);
        this.mockQTEContainer.add(this.qteTapIndicator);
        console.log('QTEDebugTool: TAP indicator added to container');
        
        // Tap indicator text - EXACT MATCH
        const tapText = this.scene.add.text(0, 0, 'SPACE', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        tapText.setOrigin(0.5);
        this.mockQTEContainer.add(tapText);
        console.log('QTEDebugTool: TAP text added to container');
        
        // Tap counter - EXACT MATCH
        this.tapCounter = this.scene.add.text(0, 25, 
            `${this.mockQTE.currentTaps}/${this.mockQTE.requiredTaps}`, {
            fontSize: '18px',
            fill: '#27ae60',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        this.tapCounter.setOrigin(0.5);
        this.mockQTEContainer.add(this.tapCounter);
        console.log('QTEDebugTool: TAP counter added to container');
        
        // Animation - EXACT MATCH
        this.scene.tweens.add({
            targets: [this.qteTapIndicator, tapText],
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        console.log(`QTEDebugTool: TAP QTE creation complete. Container children: ${this.mockQTEContainer.list.length}`);
    }

    // EXACT MATCH to ReelingMiniGame HOLD QTE visuals
    createStandaloneHoldQTE() {
        console.log('QTEDebugTool: Creating HOLD QTE visuals');
        
        // Instructions - EXACT MATCH
        this.qteInstructions = this.scene.add.text(0, -50, 
            'HOLD SPACEBAR FOR 1.5 SECONDS!', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        this.qteInstructions.setOrigin(0.5);
        this.mockQTEContainer.add(this.qteInstructions);
        console.log('QTEDebugTool: HOLD instructions added');
        
        // Hold indicator panel - EXACT MATCH
        this.qteTapIndicator = this.scene.add.graphics();
        this.qteTapIndicator.fillStyle(0x3498db);
        this.qteTapIndicator.fillRoundedRect(-40, -15, 80, 30, 5);
        this.qteTapIndicator.lineStyle(2, 0x2980b9);
        this.qteTapIndicator.strokeRoundedRect(-40, -15, 80, 30, 5);
        this.mockQTEContainer.add(this.qteTapIndicator);
        console.log('QTEDebugTool: HOLD indicator panel added');
        
        // Hold text - EXACT MATCH
        const holdText = this.scene.add.text(0, 0, 'HOLD SPACE', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        holdText.setOrigin(0.5);
        this.mockQTEContainer.add(holdText);
        console.log('QTEDebugTool: HOLD text added');
        
        // Hold duration bar background - EXACT MATCH
        const holdBarBg = this.scene.add.graphics();
        holdBarBg.fillStyle(0x2c3e50);
        holdBarBg.fillRoundedRect(-75, 20, 150, 8, 3);
        holdBarBg.lineStyle(1, 0x34495e);
        holdBarBg.strokeRoundedRect(-75, 20, 150, 8, 3);
        this.mockQTEContainer.add(holdBarBg);
        console.log('QTEDebugTool: HOLD progress bar background added');

        // Hold duration bar fill - EXACT MATCH
        this.holdBarFill = this.scene.add.graphics();
        this.mockQTEContainer.add(this.holdBarFill);
        console.log('QTEDebugTool: HOLD progress bar fill added');
        
        // Add hold timer to update progress bar - EXACT MATCH
        this.holdProgressTimer = this.scene.time.addEvent({
            delay: 50,
            callback: this.updateReelingHoldProgress,
            callbackScope: this,
            loop: true
        });
        console.log('QTEDebugTool: HOLD progress timer started (50ms intervals)');
        
        // Add instructional text
        const instructionText = this.scene.add.text(0, 40, 
            'Press and HOLD spacebar until the bar is full', {
            fontSize: '12px',
            fill: '#ffff00',
            fontFamily: 'Arial',
            align: 'center'
        });
        instructionText.setOrigin(0.5);
        this.mockQTEContainer.add(instructionText);
        console.log('QTEDebugTool: HOLD instruction text added');
        
        console.log(`QTEDebugTool: HOLD QTE creation complete. Container children: ${this.mockQTEContainer.list.length}`);
    }

    // EXACT MATCH to ReelingMiniGame SEQUENCE QTE visuals  
    createStandaloneSequenceQTE() {
        // Instructions - EXACT MATCH
        this.qteInstructions = this.scene.add.text(0, -50, 
            'PRESS ARROW KEYS OR WASD IN ORDER!', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        this.qteInstructions.setOrigin(0.5);
        this.mockQTEContainer.add(this.qteInstructions);
        
        const arrowSpacing = 40;
        const startX = -(this.mockQTE.sequence.length - 1) * arrowSpacing / 2;
        
        this.qteArrows = [];
        this.mockQTE.sequence.forEach((direction, index) => {
            const arrow = this.createReelingDirectionArrow(direction, startX + index * arrowSpacing, 0);
            
            if (index === this.mockQTE.currentIndex) {
                this.drawReelingArrow(arrow, direction, 0x27ae60); // Green
                this.scene.tweens.add({
                    targets: arrow,
                    scaleX: 1.3,
                    scaleY: 1.3,
                    duration: 500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            } else if (index < this.mockQTE.currentIndex) {
                this.drawReelingArrow(arrow, direction, 0x666666); // Gray
            } else {
                this.drawReelingArrow(arrow, direction, 0xffffff); // White
            }
            
            this.qteArrows.push(arrow);
            this.mockQTEContainer.add(arrow);
            
            // Add the key text to the container as well - EXACT MATCH
            if (arrow.keyText) {
                this.mockQTEContainer.add(arrow.keyText);
            }
        });
        
        // Progress indicator - EXACT MATCH
        this.sequenceProgress = this.scene.add.text(0, 35, 
            `${this.mockQTE.currentIndex}/${this.mockQTE.sequence.length}`, {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        this.sequenceProgress.setOrigin(0.5);
        this.mockQTEContainer.add(this.sequenceProgress);
    }

    // EXACT MATCH to ReelingMiniGame TIMING QTE visuals
    createStandaloneTimingQTE() {
        // Instructions - EXACT MATCH
        this.qteInstructions = this.scene.add.text(0, -50, 
            'HIT SPACEBAR AT THE RIGHT TIME!', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        this.qteInstructions.setOrigin(0.5);
        this.mockQTEContainer.add(this.qteInstructions);
        
        // Timing bar background - EXACT MATCH
        const timingBarBg = this.scene.add.graphics();
        timingBarBg.fillStyle(0x2c3e50);
        timingBarBg.fillRoundedRect(-100, -10, 200, 20, 5);
        timingBarBg.lineStyle(2, 0x34495e);
        timingBarBg.strokeRoundedRect(-100, -10, 200, 20, 5);
        this.mockQTEContainer.add(timingBarBg);
        
        const targetPercent = this.mockQTE.targetTime / this.mockQTE.timeLimit;
        const targetX = -100 + (targetPercent * 200);
        const targetWidth = (this.mockQTE.tolerance * 2 / this.mockQTE.timeLimit) * 200;
        
        // Target zone - EXACT MATCH
        this.qteTimingTarget = this.scene.add.graphics();
        this.qteTimingTarget.fillStyle(0x27ae60, 0.7); // Green with alpha
        this.qteTimingTarget.fillRoundedRect(targetX - targetWidth/2, -10, targetWidth, 20, 5);
        this.mockQTEContainer.add(this.qteTimingTarget);
        
        // Moving indicator - EXACT MATCH
        this.qteTimingIndicator = this.scene.add.graphics();
        this.qteTimingIndicator.fillStyle(0xFF0000);
        this.qteTimingIndicator.fillRect(-2, -15, 4, 30);
        this.qteTimingIndicator.setPosition(-100, 0);
        this.mockQTEContainer.add(this.qteTimingIndicator);
        
        // Animate indicator - EXACT MATCH
        this.scene.tweens.add({
            targets: this.qteTimingIndicator,
            x: 100,
            duration: this.mockQTE.timeLimit,
            ease: 'Linear'
        });
        
        // Instructions - EXACT MATCH
        const instructionText = this.scene.add.text(0, 25, 
            'Hit SPACE when the red line is in the GREEN zone!', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        this.mockQTEContainer.add(instructionText);
    }

    // EXACT MATCH to ReelingMiniGame progress bar
    createReelingStyleProgressBar() {
        // Time remaining bar background - EXACT MATCH
        const progressBarBg = this.scene.add.graphics();
        progressBarBg.fillStyle(0x2c3e50);
        progressBarBg.fillRoundedRect(-140, 60, 280, 8, 3);
        progressBarBg.lineStyle(1, 0x34495e);
        progressBarBg.strokeRoundedRect(-140, 60, 280, 8, 3);
        this.mockQTEContainer.add(progressBarBg);
        
        // QTE Progress bar fill - EXACT MATCH
        this.qteProgressBar = this.scene.add.graphics();
        this.qteProgressBar.fillStyle(0xf39c12); // Orange for time running out
        this.qteProgressBar.fillRect(-140, 60, 280, 8); // Initial full fill
        this.mockQTEContainer.add(this.qteProgressBar);
        
        // Animation - EXACT MATCH
        this.scene.tweens.add({
            targets: this.qteProgressBar,
            scaleX: 0,
            duration: this.mockQTE.timeLimit,
            ease: 'Linear'
        });
    }

    // EXACT MATCH to ReelingMiniGame direction arrow creation
    createReelingDirectionArrow(direction, x, y) {
        const arrow = this.scene.add.graphics();
        arrow.setPosition(x, y);
        
        // Store direction and color for redrawing - EXACT MATCH
        arrow.direction = direction;
        arrow.currentColor = 0xFFFFFF;
        
        // Draw the WASD key - EXACT MATCH
        this.drawReelingArrow(arrow, direction, 0xFFFFFF);
        
        return arrow;
    }

    // EXACT MATCH to ReelingMiniGame arrow drawing
    drawReelingArrow(arrow, direction, color) {
        arrow.clear();
        
        // Draw WASD key indicators instead of arrows - EXACT MATCH
        const keySize = 20;
        const keyRadius = 3;
        
        // Draw key background - EXACT MATCH
        arrow.fillStyle(0x444444);
        arrow.fillRoundedRect(-keySize/2, -keySize/2, keySize, keySize, keyRadius);
        
        // Draw key border - EXACT MATCH
        arrow.lineStyle(2, color);
        arrow.strokeRoundedRect(-keySize/2, -keySize/2, keySize, keySize, keyRadius);
        
        // Get the arrow symbol for this direction - EXACT MATCH
        let keySymbol = '';
        switch (direction) {
            case 'up':
                keySymbol = '↑';
                break;
            case 'down':
                keySymbol = '↓';
                break;
            case 'left':
                keySymbol = '←';
                break;
            case 'right':
                keySymbol = '→';
                break;
        }
        
        // Clean up existing text if it exists - EXACT MATCH
        if (arrow.keyText) {
            arrow.keyText.destroy();
        }
        
        // Create text object for the letter using relative positioning to the container - EXACT MATCH
        const colorHex = '#' + color.toString(16).padStart(6, '0');
        arrow.keyText = arrow.scene.add.text(0, 0, keySymbol, {
            fontSize: '14px',
            fill: colorHex,
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        arrow.keyText.setOrigin(0.5);
        arrow.keyText.setPosition(arrow.x, arrow.y);
        arrow.keyText.setDepth(arrow.depth + 1);
        
        // Store reference for cleanup - EXACT MATCH
        arrow.currentColor = color;
    }

    // EXACT MATCH to ReelingMiniGame hold progress update
    updateReelingHoldProgress() {
        if (!this.mockQTE || this.mockQTE.type !== 'hold' || !this.holdBarFill) {
            return;
        }
        
        this.holdBarFill.clear();
        
        if (this.mockQTE.holdStartTime) {
            const holdTime = this.scene.time.now - this.mockQTE.holdStartTime;
            const progress = Math.min(holdTime / 1500, 1); // EXACT MATCH: 1.5 seconds
            const barWidth = 150 * progress;
            
            // Change color based on progress - EXACT MATCH
            let barColor = 0xf39c12; // Orange (warning)
            if (progress >= 1) {
                barColor = 0x27ae60; // Green (success)
            } else if (progress >= 0.5) {
                barColor = 0x3498db; // Blue (info)
            }
            
            this.holdBarFill.fillStyle(barColor);
            this.holdBarFill.fillRect(-75, 20, barWidth, 8);
            
            // Debug logging every 250ms to track progress
            if (Math.floor(holdTime / 250) !== Math.floor((holdTime - 50) / 250)) {
                console.log(`QTEDebugTool: Hold progress: ${(progress * 100).toFixed(1)}% (${holdTime.toFixed(0)}ms / 1500ms)`);
            }
            
            // Visual feedback when complete
            if (progress >= 1 && !this.holdCompleted) {
                this.holdCompleted = true;
                console.log('QTEDebugTool: Hold duration reached! Player can release now.');
                
                // Flash the indicator green to show completion
                if (this.qteTapIndicator && this.qteTapIndicator.active) {
                    this.scene.tweens.add({
                        targets: this.qteTapIndicator,
                        alpha: 0.5,
                        duration: 150,
                        yoyo: true,
                        repeat: 3,
                        ease: 'Power2'
                    });
                }
            }
        } else {
            // No hold started yet - draw empty bar
            this.holdBarFill.fillStyle(0x666666, 0.5);
            this.holdBarFill.fillRect(-75, 20, 150, 8);
        }
    }
    
    destroyStandaloneQTE() {
        console.log('QTEDebugTool: Destroying standalone QTE');
        
        // Clear input handlers first - EXACT MATCH to ReelingMiniGame cleanup
        this.clearStandaloneQTEInput();
        
        // Reset hold tracking
        this.holdCompleted = false;
        
        // Clear tweens to prevent issues during destruction - EXACT MATCH
        if (this.scene.tweens) {
            if (this.mockQTEContainer) {
                this.scene.tweens.killTweensOf(this.mockQTEContainer);
            }
            if (this.qteTapIndicator) {
                this.scene.tweens.killTweensOf(this.qteTapIndicator);
            }
            if (this.qteTimingIndicator) {
                this.scene.tweens.killTweensOf(this.qteTimingIndicator);
            }
            if (this.qteProgressBar) {
                this.scene.tweens.killTweensOf(this.qteProgressBar);
            }
            if (this.qteArrows) {
                this.qteArrows.forEach(arrow => {
                    this.scene.tweens.killTweensOf(arrow);
                });
            }
        }
        
        // Destroy QTE visuals - EXACT MATCH to ReelingMiniGame
        if (this.qteArrows) {
            this.qteArrows.forEach(arrow => {
                if (arrow && arrow.active) {
                    // Clean up the associated key text
                    if (arrow.keyText && arrow.keyText.active) {
                        arrow.keyText.destroy();
                    }
                    arrow.destroy();
                }
            });
            this.qteArrows = [];
        }
        
        // Destroy container and all its children - EXACT MATCH
        if (this.mockQTEContainer) {
            console.log('QTEDebugTool: Destroying QTE container with', this.mockQTEContainer.list.length, 'children');
            this.mockQTEContainer.destroy();
            this.mockQTEContainer = null;
        }
        
        // Clear individual references - EXACT MATCH
        this.mockQTEBackground = null;
        this.qteInstructions = null;
        this.qteTapIndicator = null;
        this.qteTimingTarget = null;
        this.qteTimingIndicator = null;
        this.qteProgressBar = null;
        this.holdBarFill = null;
        this.tapCounter = null;
        this.sequenceProgress = null;
        
        // Clear QTE state - EXACT MATCH
        this.mockQTE = null;
        
        console.log('QTEDebugTool: Standalone QTE destroyed and references cleared');
    }
    
    showDebugMessage(message, type = 'info') {
        // Create floating message
        const width = this.scene.cameras.main.width;
        const colors = {
            'info': '#2196f3',     // Blue
            'success': '#4caf50',  // Green  
            'warning': '#ffa726',  // Orange
            'error': '#ff5722'     // Red
        };
        
        const fontFamily = (typeof UITheme !== 'undefined' && UITheme.fonts) ? UITheme.fonts.primary : 'Arial, sans-serif';
        
        const messageText = this.scene.add.text(
            width / 2,
            50,
            message,
            {
                fontSize: '16px',
                fontFamily: fontFamily,
                color: colors[type] || '#ffffff',
                backgroundColor: '#1a1a2e',
                padding: { x: 20, y: 10 },
                align: 'center'
            }
        );
        messageText.setOrigin(0.5);
        messageText.setDepth(4000);
        
        // Animate in
        messageText.setAlpha(0);
        this.scene.tweens.add({
            targets: messageText,
            alpha: 1,
            y: 70,
            duration: 300,
            ease: 'Power2.easeOut'
        });
        
        // Auto-remove after 3 seconds
        this.scene.time.delayedCall(3000, () => {
            if (messageText && messageText.active) {
                this.scene.tweens.add({
                    targets: messageText,
                    alpha: 0,
                    y: 30,
                    duration: 300,
                    ease: 'Power2.easeIn',
                    onComplete: () => {
                        messageText.destroy();
                    }
                });
            }
        });
    }
    
    resetDebugStats() {
        console.log('QTEDebugTool: Resetting debug statistics');
        
        this.debugStats = {
            totalQTEs: 0,
            successfulQTEs: 0,
            failedQTEs: 0,
            qteTypeStats: {},
            struggleTypeStats: {},
            averageReactionTime: 0,
            reactionTimes: []
        };
        
        this.initializeStats();
        
        if (this.isVisible) {
            this.updateStatsDisplay(this.panels.stats.bg.x + 10, this.panels.stats.bg.y + 40, 340, 200);
        }
    }
    
    exportDebugStats() {
        console.log('QTEDebugTool: Exporting debug statistics');
        
        const exportData = {
            timestamp: new Date().toISOString(),
            summary: {
                totalQTEs: this.debugStats.totalQTEs,
                successRate: this.debugStats.totalQTEs > 0 ? 
                    ((this.debugStats.successfulQTEs / this.debugStats.totalQTEs) * 100).toFixed(2) : 0,
                averageReactionTime: this.debugStats.averageReactionTime.toFixed(2) + 'ms'
            },
            qteTypeBreakdown: this.debugStats.qteTypeStats,
            struggleTypeBreakdown: this.debugStats.struggleTypeStats,
            reactionTimes: this.debugStats.reactionTimes
        };
        
        // Log to console for copying
        console.log('QTE Debug Statistics Export:', JSON.stringify(exportData, null, 2));
        
        // Show export notification
        const notification = UITheme.createText(this.scene, 
            this.scene.cameras.main.width / 2, 
            this.scene.cameras.main.height - 50, 
            'Statistics exported to console!', 
            'bodyMedium'
        );
        notification.setOrigin(0.5);
        notification.setColor(UITheme.colors.success);
        notification.setDepth(4000);
        
        this.scene.time.delayedCall(3000, () => {
            if (notification && notification.active) {
                notification.destroy();
            }
        });
    }
    
    // Enhanced destroy method with proper cleanup
    destroy() {
                try {
            // FIRST: Ensure input isolation is disabled and game controls are restored
            this.disableInputIsolation();
            
            // Stop all debug sessions and testing
            this.stopDebugSession();
            this.stopAutoTesting();
            
            // Clear all timers
            if (this.realtimeTimer) {
                this.realtimeTimer.destroy();
                this.realtimeTimer = null;
            }
            
            if (this.autoTestTimer) {
                this.autoTestTimer.destroy();
                this.autoTestTimer = null;
            }
            
            // Clean up Hold QTE specific elements
            if (this.holdProgressBar) {
                this.holdProgressBar.destroy();
                this.holdProgressBar = null;
            }
            if (this.holdProgressFill) {
                this.holdProgressFill = null;
            }
            
            // Clean up Tap QTE specific elements
            if (this.tapFeedback) {
                this.tapFeedback.destroy();
                this.tapFeedback = null;
            }
            if (this.tapCountText) {
                this.tapCountText = null;
            }
            
            // Clean up Sequence QTE specific elements
            if (this.sequenceFeedback) {
                this.sequenceFeedback.destroy();
                this.sequenceFeedback = null;
            }
            if (this.sequenceItems) {
                this.sequenceItems = [];
            }
            
            // Clean up result overlay
            if (this.currentResultOverlay) {
                this.currentResultOverlay.destroy();
                this.currentResultOverlay = null;
            }
            
            // Clean up result overlay timers and handlers
            if (this.resultDismissTimer) {
                this.resultDismissTimer.destroy();
                this.resultDismissTimer = null;
            }
            
            if (this.resultKeyHandler) {
                this.scene.input.keyboard.off('keydown', this.resultKeyHandler);
                this.resultKeyHandler = null;
            }
            
            // Destroy standalone QTE if active
            this.destroyStandaloneQTE();
            
            // Clean up input handlers
            this.clearStandaloneQTEInput();
            
            // Clean up stats display elements
            if (this.statsDisplayElements) {
                this.statsDisplayElements.forEach(element => {
                    if (element && element.destroy) {
                        element.destroy();
                    }
                });
                this.statsDisplayElements = [];
            }
            
            // Clean up debug interface elements
            if (this.debugContainer) {
                this.debugContainer.children.entries.forEach(child => {
                    if (child && child.destroy) {
                        child.destroy();
                    }
                });
                this.debugContainer.destroy();
                this.debugContainer = null;
            }
            
            // Clean up debug overlay
            if (this.debugOverlay) {
                this.debugOverlay.destroy();
                this.debugOverlay = null;
            }
            
            // Clean up message group
            if (this.messageGroup) {
                this.messageGroup.children.entries.forEach(child => {
                    if (child && child.destroy) {
                        child.destroy();
                    }
                });
                this.messageGroup.destroy();
                this.messageGroup = null;
            }
            
            // Reset flags
            this.isVisible = false;
            this.debugActive = false;
            this.autoTestActive = false;
            this.standaloneTesting = false;
            this.holdCompleted = false;
            
            console.log('QTEDebugTool: Destroy completed successfully');
            
        } catch (error) {
            console.error('QTEDebugTool: Error during destroy:', error);
            console.error('QTEDebugTool: Destroy error stack:', error.stack);
        }
    }
    
    setupStandaloneQTEInput(qteType) {
        console.log('QTEDebugTool: Setting up input for', qteType);
        
        // Clear any existing handlers
        this.clearStandaloneQTEInput();
        
        // CONSOLIDATED input handling - single keydown/keyup handlers to avoid conflicts
        this.keyDownHandler = (event) => {
            if (!this.mockQTE || this.mockQTE.completed) return;
            
            // Ignore key repeat events to prevent hold time corruption
            if (event.repeat) {
                console.log('QTEDebugTool: Ignoring key repeat event for', event.code);
                return;
            }
            
            // Add debugging for hold QTEs
            if (this.mockQTE.type === 'hold') {
                console.log('QTEDebugTool: KeyDown event for HOLD QTE:', event.code, 'at time:', this.scene.time.now);
            }
            
            switch (event.code) {
                case 'Space':
                    event.preventDefault();
                    if (this.mockQTE.type === 'hold') {
                        console.log('QTEDebugTool: HOLD START detected at time:', this.scene.time.now);
                        this.handleReelingQTEInput('holdStart');
                    } else if (this.mockQTE.type === 'tap') {
                        this.handleReelingQTEInput('tap');
                    } else if (this.mockQTE.type === 'timing') {
                        this.handleReelingQTEInput('tap');
                    }
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    event.preventDefault();
                    this.handleReelingQTEInput('direction', { direction: 'up' });
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    event.preventDefault();
                    this.handleReelingQTEInput('direction', { direction: 'down' });
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    event.preventDefault();
                    this.handleReelingQTEInput('direction', { direction: 'left' });
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    event.preventDefault();
                    this.handleReelingQTEInput('direction', { direction: 'right' });
                    break;
                case 'Escape':
                    event.preventDefault();
                    this.completeStandaloneQTE(false, 'manual_cancel');
                    break;
            }
        };
        
        this.keyUpHandler = (event) => {
            if (!this.mockQTE || this.mockQTE.completed) return;
            
            if (event.code === 'Space' && this.mockQTE.type === 'hold') {
                event.preventDefault();
                console.log('QTEDebugTool: HOLD END detected at time:', this.scene.time.now);
                this.handleReelingQTEInput('holdEnd');
            }
        };
        
        // Use single DOM event listeners to avoid conflicts
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
        
        console.log('QTEDebugTool: Consolidated DOM input handlers attached for', qteType);
    }

    clearStandaloneQTEInput() {
        // Clear DOM event handlers
        if (this.keyDownHandler) {
            document.removeEventListener('keydown', this.keyDownHandler);
            this.keyDownHandler = null;
        }
        
        if (this.keyUpHandler) {
            document.removeEventListener('keyup', this.keyUpHandler);
            this.keyUpHandler = null;
        }
        
        // Clean up hold progress timer
        if (this.holdProgressTimer) {
            this.holdProgressTimer.destroy();
            this.holdProgressTimer = null;
        }
        
        console.log('QTEDebugTool: Input handlers cleared');
    }

    // EXACT MATCH to ReelingMiniGame QTE input handling
    handleReelingQTEInput(inputType, inputData) {
        const qte = this.mockQTE;
        let success = false;
        
        console.log('QTEDebugTool: Handling input:', inputType, 'for QTE type:', qte.type);
        
        switch (qte.type) {
            case 'tap':
                if (inputType === 'tap') {
                    qte.currentTaps++;
                    this.updateReelingQTEVisuals(); // Update visual feedback
                    
                    if (qte.currentTaps >= qte.requiredTaps) {
                        success = true;
                    }
                }
                break;
                
            case 'hold':
                if (inputType === 'holdStart') {
                    // Only set holdStartTime if it's not already set (prevent key repeat from overwriting)
                    if (!qte.holdStartTime) {
                        qte.holdStartTime = this.scene.time.now;
                        console.log('QTEDebugTool: Hold started at time:', qte.holdStartTime);
                        
                        // Visual feedback for hold start - EXACT MATCH
                        if (this.qteTapIndicator && this.qteTapIndicator.active) {
                            this.qteTapIndicator.clear();
                            this.qteTapIndicator.fillStyle(0x00FF00);
                            this.qteTapIndicator.fillRoundedRect(-40, -15, 80, 30, 5);
                            this.qteTapIndicator.lineStyle(2, 0xFFFFFF);
                            this.qteTapIndicator.strokeRoundedRect(-40, -15, 80, 30, 5);
                            console.log('QTEDebugTool: Visual feedback updated for hold start');
                        }
                    } else {
                        console.log('QTEDebugTool: Hold start ignored (key repeat) - already holding since:', qte.holdStartTime);
                    }
                } else if (inputType === 'holdEnd') {
                    const currentTime = this.scene.time.now;
                    console.log('QTEDebugTool: Hold end detected at time:', currentTime);
                    console.log('QTEDebugTool: Hold start time was:', qte.holdStartTime);
                    
                    if (qte.holdStartTime) {
                        const holdDuration = currentTime - qte.holdStartTime;
                        console.log('QTEDebugTool: Hold ended. Duration:', holdDuration, 'ms. Required: 1500ms');
                        
                        if (holdDuration >= 1500) { // EXACT MATCH: Fixed 1.5 seconds
                            success = true;
                            console.log('QTEDebugTool: Hold QTE SUCCESS! Duration was sufficient.');
                        } else {
                            // Failed to hold long enough
                            console.log('QTEDebugTool: Hold QTE FAILED - too short. Actual:', holdDuration, 'ms');
                            this.completeStandaloneQTE(false, 'hold_too_short');
                            return true;
                        }
                    } else {
                        console.log('QTEDebugTool: Hold QTE FAILED - no start time recorded!');
                        this.completeStandaloneQTE(false, 'hold_no_start');
                        return true;
                    }
                }
                break;
                
            case 'sequence':
                if (inputType === 'direction' && inputData.direction === qte.sequence[qte.currentIndex]) {
                    qte.currentIndex++;
                    this.updateReelingQTEVisuals(); // Update arrow highlighting
                    
                    if (qte.currentIndex >= qte.sequence.length) {
                        success = true;
                    }
                } else if (inputType === 'direction') {
                    // Wrong input, fail QTE - EXACT MATCH
                    this.completeStandaloneQTE(false, 'wrong_sequence');
                    return true;
                }
                break;
                
            case 'timing':
                if (inputType === 'tap') {
                    const currentTime = this.scene.time.now - qte.startTime;
                    const timeDiff = Math.abs(currentTime - qte.targetTime);
                    
                    // EXACT MATCH: Simple success check without visual effects
                    if (timeDiff <= qte.tolerance) {
                        success = true;
                    }
                    
                    if (!success) {
                        this.completeStandaloneQTE(false, 'bad_timing');
                        return true;
                    }
                }
                break;
        }
        
        if (success) {
            this.completeStandaloneQTE(true, 'perfect');
        }
        
        return true;
    }

    // EXACT MATCH to ReelingMiniGame QTE visual updates
    updateReelingQTEVisuals() {
        if (!this.mockQTE || !this.mockQTEContainer) return;
        
        switch (this.mockQTE.type) {
            case 'tap':
                this.updateReelingTapQTEVisuals();
                break;
            case 'sequence':
                this.updateReelingSequenceQTEVisuals();
                break;
        }
    }

    // EXACT MATCH to ReelingMiniGame tap QTE visual updates
    updateReelingTapQTEVisuals() {
        if (!this.mockQTEContainer || !this.mockQTE) return;
        
        // Update tap counter - EXACT MATCH
        if (this.tapCounter) {
            this.tapCounter.setText(`${this.mockQTE.currentTaps}/${this.mockQTE.requiredTaps}`);
            
            // Flash on successful tap
            if (this.mockQTE.currentTaps > 0) {
                this.scene.tweens.add({
                    targets: this.tapCounter,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 100,
                    yoyo: true,
                    ease: 'Power2.easeOut'
                });
            }
        }
    }

    // EXACT MATCH to ReelingMiniGame sequence QTE visual updates
    updateReelingSequenceQTEVisuals() {
        if (!this.mockQTEContainer || !this.mockQTE || !this.qteArrows) return;
        
        // Update arrow highlighting - EXACT MATCH
        this.qteArrows.forEach((arrow, index) => {
            if (arrow && arrow.active && arrow.direction) {
                let color;
                if (index === this.mockQTE.currentIndex) {
                    color = 0x00FF00; // Current arrow - green
                } else if (index < this.mockQTE.currentIndex) {
                    color = 0x666666; // Completed arrows - gray
                } else {
                    color = 0xFFFFFF; // Future arrows - white
                }
                
                // Only redraw if color changed
                if (arrow.currentColor !== color) {
                    this.drawReelingArrow(arrow, arrow.direction, color);
                }
            }
        });
        
        // Update progress text - EXACT MATCH
        if (this.sequenceProgress) {
            this.sequenceProgress.setText(`${this.mockQTE.currentIndex}/${this.mockQTE.sequence.length}`);
        }
    }

    // Handle general reeling controls - EXACT MATCH to ReelingMiniGame
    handleReelingInput(inputType, inputData) {
        // This would handle mouse input for reeling, but not needed for standalone QTEs
        return true;
    }
    
    onStandaloneQTEStart() {
        if (!this.activeStandaloneQTE) return;
        
        const qte = this.activeStandaloneQTE;
        console.log(`QTEDebugTool: Standalone QTE Started - Type: ${qte.type}, Difficulty: ${qte.difficulty}`);
        
        // Record QTE start time for reaction time measurement
        this.currentQTEStartTime = performance.now();
        this.currentQTEType = qte.type;
        
        // Update stats
        this.debugStats.qteTypeStats[qte.type].attempts++;
        this.debugStats.totalQTEs++;
    }
    
    completeStandaloneQTE(success, reason) {
        if (!this.mockQTE) {
            console.warn('QTEDebugTool: No active QTE to complete');
            return;
        }
        
        if (this.mockQTE.completed) {
            console.warn('QTEDebugTool: QTE already completed');
            return;
        }
        
        // Mark as completed to prevent multiple calls - EXACT MATCH to ReelingMiniGame
        this.mockQTE.completed = true;
        this.mockQTE.success = success;
        
        console.log(`QTEDebugTool: QTE completed - Success: ${success}, Reason: ${reason}`);
        
        // Calculate reaction time
        const reactionTime = this.scene.time.now - this.mockQTE.startTime;
        
        // Update statistics - EXACT MATCH to tracking pattern
        this.stats.totalTests++;
        if (success) {
            this.stats.successfulTests++;
            this.stats.totalReactionTime += reactionTime;
            if (this.stats.bestReactionTime === Infinity) {
                this.stats.bestReactionTime = reactionTime;
            } else {
                this.stats.bestReactionTime = Math.min(this.stats.bestReactionTime, reactionTime);
            }
        } else {
            this.stats.failedTests++;
        }
        
        // Track QTE type specific stats
        if (!this.stats.qteTypeStats[this.mockQTE.type]) {
            this.stats.qteTypeStats[this.mockQTE.type] = { attempts: 0, successes: 0 };
        }
        const qteTypeStats = this.stats.qteTypeStats[this.mockQTE.type];
        qteTypeStats.attempts++;
        if (success) {
            qteTypeStats.successes++;
        }
        
        // Also update debugStats for compatibility
        this.debugStats.totalQTEs++;
        if (success) {
            this.debugStats.successfulQTEs++;
        } else {
            this.debugStats.failedQTEs++;
        }
        
        if (!this.debugStats.qteTypeStats[this.mockQTE.type]) {
            this.debugStats.qteTypeStats[this.mockQTE.type] = { attempts: 0, successes: 0, failures: 0, successRate: 0, averageTime: 0 };
        }
        this.debugStats.qteTypeStats[this.mockQTE.type].attempts++;
        if (success) {
            this.debugStats.qteTypeStats[this.mockQTE.type].successes++;
        } else {
            this.debugStats.qteTypeStats[this.mockQTE.type].failures++;
        }
        
        // Show enhanced result display - EXACT MATCH to visual feedback pattern
        this.showEnhancedQTEResult(success, reason, reactionTime);
        
        // Clean up after delay to show result
        this.scene.time.delayedCall(2000, () => {
            this.destroyStandaloneQTE();
            
            // Update stats display in debug tool
            if (this.isVisible && this.statsPanel) {
                this.updateStatsDisplay(
                    this.statsPanel.x, 
                    this.statsPanel.y, 
                    this.statsPanel.width, 
                    this.statsPanel.height
                );
            }
        });
    }
    
    showEnhancedQTEResult(success, reason, reactionTime) {
        if (!this.mockQTEContainer) return;
        
        // Create result overlay - EXACT MATCH to ReelingMiniGame celebration pattern
        const resultOverlay = this.scene.add.graphics();
        resultOverlay.fillStyle(success ? 0x2d5016 : 0x8b0000, 0.9);
        resultOverlay.fillRoundedRect(-180, -100, 360, 200, 15);
        resultOverlay.lineStyle(3, success ? 0x4a7c59 : 0xff4444);
        resultOverlay.strokeRoundedRect(-180, -100, 360, 200, 15);
        this.mockQTEContainer.add(resultOverlay);
        
        // Result text with dramatic sizing - EXACT MATCH to enhanced feedback
        const resultText = this.scene.add.text(0, -40, success ? '✅ SUCCESS!' : '❌ FAILED!', {
            fontSize: '72px',
            fill: success ? '#00ff00' : '#ff0000',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        });
        resultText.setOrigin(0.5);
        this.mockQTEContainer.add(resultText);
        
        // Reason text
        const reasonText = this.scene.add.text(0, 10, this.getFailureReasonText(reason), {
            fontSize: '24px',
            fill: '#ffffff',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        });
        reasonText.setOrigin(0.5);
        this.mockQTEContainer.add(reasonText);
        
        // Reaction time display
        const timeText = this.scene.add.text(0, 40, `Reaction Time: ${reactionTime.toFixed(0)}ms`, {
            fontSize: '18px',
            fill: '#ffff00',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        });
        timeText.setOrigin(0.5);
        this.mockQTEContainer.add(timeText);
        
        // Success particles for successful QTEs - EXACT MATCH to celebration pattern
        if (success) {
            this.createSuccessParticles(this.mockQTEContainer);
        } else {
            this.createFailureEffects(this.mockQTEContainer);
        }
        
        // Animate result display - EXACT MATCH to celebration animations
        resultText.setScale(0);
        this.scene.tweens.add({
            targets: resultText,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
        
        // Pulsing animation for dramatic effect
        this.scene.tweens.add({
            targets: resultText,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 500,
            yoyo: true,
            repeat: 3,
            ease: 'Sine.easeInOut'
        });
    }
    
    // Add the missing destroyMockQTE function
    destroyMockQTE() {
        // This function was being called but didn't exist
        // In the standalone system, we use destroyStandaloneQTE instead
        console.log('QTEDebugTool: destroyMockQTE called (redirecting to destroyStandaloneQTE)');
        this.destroyStandaloneQTE();
    }
    
    getStatsDisplayText() {
        const stats = this.debugStats;
        const successRate = stats.totalQTEs > 0 ? 
            ((stats.successfulQTEs / stats.totalQTEs) * 100).toFixed(1) : 0;
        const avgReactionTime = stats.averageReactionTime.toFixed(0);
        
        return `CURRENT SESSION STATS
Total QTEs: ${stats.totalQTEs}
Success Rate: ${successRate}%
Average Reaction Time: ${avgReactionTime}ms
Successful: ${stats.successfulQTEs} | Failed: ${stats.failedQTEs}`;
    }
    
    dismissResultOverlay() {
        if (this.currentResultOverlay) {
            // Slide out animation
            this.scene.tweens.add({
                targets: this.currentResultOverlay,
                alpha: 0,
                scaleX: 0.8,
                scaleY: 0.8,
                duration: 200,
                ease: 'Back.easeIn',
                onComplete: () => {
                    if (this.currentResultOverlay) {
                        this.currentResultOverlay.destroy();
                        this.currentResultOverlay = null;
                    }
                }
            });
        }
        
        // Clean up timers and handlers
        if (this.resultDismissTimer) {
            this.resultDismissTimer.destroy();
            this.resultDismissTimer = null;
        }
        
        if (this.resultKeyHandler) {
            this.scene.input.keyboard.off('keydown', this.resultKeyHandler);
            this.resultKeyHandler = null;
        }
        
        // Update the main Statistics panel to show updated stats
        if (this.statsPanel && this.isVisible) {
            this.updateStatsDisplay(this.statsPanel.x, this.statsPanel.y, this.statsPanel.width, this.statsPanel.height);
        }
    }
    
    createSuccessParticles(container) {
        // Create animated star particles for success
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const distance = 150 + Math.random() * 100;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            const star = this.scene.add.text(x, y, '⭐', {
                fontSize: '24px'
            });
            star.setOrigin(0.5);
            star.setAlpha(0);
            container.add(star);
            
            // Animate stars flying outward
            this.scene.tweens.add({
                targets: star,
                alpha: 1,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 200,
                delay: i * 50,
                ease: 'Power2.easeOut',
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: star,
                        x: x * 1.5,
                        y: y * 1.5,
                        alpha: 0,
                        scaleX: 0.5,
                        scaleY: 0.5,
                        duration: 800,
                        ease: 'Power2.easeOut'
                    });
                }
            });
        }
    }
    
    createFailureEffects(container) {
        // Create red X marks for failure
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const distance = 100 + Math.random() * 50;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            const xMark = this.scene.add.text(x, y, '✗', {
                fontSize: '32px',
                color: '#ff0000',
                fontWeight: 'bold'
            });
            xMark.setOrigin(0.5);
            xMark.setAlpha(0);
            container.add(xMark);
            
            // Animate X marks
            this.scene.tweens.add({
                targets: xMark,
                alpha: 0.8,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 150,
                delay: i * 30,
                ease: 'Power2.easeOut',
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: xMark,
                        alpha: 0,
                        scaleX: 0.8,
                        scaleY: 0.8,
                        duration: 600,
                        ease: 'Power2.easeIn'
                    });
                }
            });
        }
    }
    
    getFailureReasonText(reason) {
        const reasonTexts = {
            'timeout': 'Time ran out!',
            'cancelled': 'Test cancelled',
            'manual_cancel': 'Manually cancelled',
            'tap_incomplete': 'Not enough taps!',
            'hold_too_short': 'Released spacebar too early!',
            'hold_no_start': 'Hold was not detected properly!',
            'sequence_failed': 'Wrong sequence!',
            'wrong_sequence': 'Wrong key pressed!',
            'timing_missed': 'Missed the timing window!',
            'timing_timeout': 'Timing window expired!',
            'bad_timing': 'Hit outside the green zone!'
        };
        
        return reasonTexts[reason] || reason;
    }
    
    // Input isolation system - prevent interference with main game
    enableInputIsolation() {
        if (this.inputIsolationActive) return;
        
        console.log('QTEDebugTool: Enabling input isolation - blocking main game controls');
        this.inputIsolationActive = true;
        
        // Store original game input handlers and disable them
        this.disableGameInputs();
        
        // Set up debug tool specific input handling
        this.setupDebugToolInputCapture();
    }
    
    disableInputIsolation() {
        if (!this.inputIsolationActive) return;
        
        console.log('QTEDebugTool: Disabling input isolation - restoring main game controls');
        this.inputIsolationActive = false;
        
        // Clean up debug tool inputs
        this.cleanupDebugToolInputCapture();
        
        // Restore original game input handlers
        this.restoreGameInputs();
    }
    
    disableGameInputs() {
        try {
            // Disable main game's input systems
            if (this.scene.inputManager) {
                this.scene.inputManager.enabled = false;
                console.log('QTEDebugTool: Disabled InputManager');
            }
            
            if (this.scene.playerController) {
                this.scene.playerController.enabled = false;
                console.log('QTEDebugTool: Disabled PlayerController');
            }
            
            // Remove all existing keyboard listeners temporarily
            this.scene.input.keyboard.removeAllListeners();
            console.log('QTEDebugTool: Removed all keyboard listeners');
            
        } catch (error) {
            console.warn('QTEDebugTool: Error disabling game inputs:', error);
        }
    }
    
    restoreGameInputs() {
        try {
            // Re-enable main game's input systems
            if (this.scene.inputManager) {
                this.scene.inputManager.enabled = true;
                console.log('QTEDebugTool: Re-enabled InputManager');
            }
            
            if (this.scene.playerController) {
                this.scene.playerController.enabled = true;
                console.log('QTEDebugTool: Re-enabled PlayerController');
            }
            
            // Restore main scene's input handlers
            if (this.scene.setupEventListeners && typeof this.scene.setupEventListeners === 'function') {
                this.scene.setupEventListeners();
                console.log('QTEDebugTool: Restored scene event listeners');
            }
            
        } catch (error) {
            console.warn('QTEDebugTool: Error restoring game inputs:', error);
        }
    }
    
    setupDebugToolInputCapture() {
        // Set up isolated input capture for debug tool only
        this.debugToolInputHandlers.escape = (event) => {
            event.stopPropagation();
            event.preventDefault();
            this.hide();
        };
        
        // F9 toggle (backup)
        this.debugToolInputHandlers.f9 = (event) => {
            event.stopPropagation();
            event.preventDefault();
            this.hide();
        };
        
        this.scene.input.keyboard.on('keydown-ESC', this.debugToolInputHandlers.escape);
        this.scene.input.keyboard.on('keydown-F9', this.debugToolInputHandlers.f9);
        
        console.log('QTEDebugTool: Debug tool input capture enabled');
    }
    
    cleanupDebugToolInputCapture() {
        // Clean up debug tool specific inputs
        Object.keys(this.debugToolInputHandlers).forEach(key => {
            const handler = this.debugToolInputHandlers[key];
            if (handler) {
                this.scene.input.keyboard.off(`keydown-${key.toUpperCase()}`, handler);
                this.scene.input.keyboard.off('keydown-ESC', handler);
                this.scene.input.keyboard.off('keydown-F9', handler);
            }
        });
        this.debugToolInputHandlers = {};
        
        console.log('QTEDebugTool: Debug tool input capture cleaned up');
    }
    
    createHoldProgressBar() {
        if (this.holdProgressBar) {
            this.holdProgressBar.destroy();
        }
        
        const centerX = this.scene.cameras.main.width / 2;
        const centerY = this.scene.cameras.main.height / 2;
        
        // Create progress bar container
        this.holdProgressBar = this.scene.add.container(centerX, centerY + 100);
        this.holdProgressBar.setDepth(3500);
        this.holdProgressBar.setVisible(false);
        
        // Background bar
        const bgBar = this.scene.add.graphics();
        bgBar.fillStyle(0x333333, 0.8);
        bgBar.fillRect(-100, -10, 200, 20);
        bgBar.lineStyle(2, 0xffffff, 0.8);
        bgBar.strokeRect(-100, -10, 200, 20);
        this.holdProgressBar.add(bgBar);
        
        // Progress fill
        this.holdProgressFill = this.scene.add.graphics();
        this.holdProgressFill.setPosition(-100, -10);
        this.holdProgressBar.add(this.holdProgressFill);
        
        // Label
        const label = this.scene.add.text(0, -35, 'Hold SPACEBAR for 2 seconds', {
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5);
        this.holdProgressBar.add(label);
    }
    
    startHoldProgressAnimation() {
        // This method can be used for additional animations if needed
        // Currently the progress is updated in the polling loop
    }
    
    createTapFeedback() {
        if (this.tapFeedback) {
            this.tapFeedback.destroy();
        }
        
        const centerX = this.scene.cameras.main.width / 2;
        const centerY = this.scene.cameras.main.height / 2;
        
        // Create tap feedback container
        this.tapFeedback = this.scene.add.container(centerX, centerY + 100);
        this.tapFeedback.setDepth(3500);
        
        // Background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x333333, 0.8);
        bg.fillRoundedRect(-120, -30, 240, 60, 10);
        bg.lineStyle(2, 0xffffff, 0.8);
        bg.strokeRoundedRect(-120, -30, 240, 60, 10);
        this.tapFeedback.add(bg);
        
        // Label
        const label = this.scene.add.text(0, -45, 'Press SPACEBAR rapidly (5 times)', {
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5);
        this.tapFeedback.add(label);
        
        // Tap counter display
        this.tapCountText = this.scene.add.text(0, 0, '0 / 5', {
            fontSize: '24px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5);
        this.tapFeedback.add(this.tapCountText);
    }
    
    showTapFeedback(currentTaps, requiredTaps) {
        if (this.tapCountText) {
            this.tapCountText.setText(`${currentTaps} / ${requiredTaps}`);
            
            // Color change based on progress
            if (currentTaps >= requiredTaps) {
                this.tapCountText.setColor('#00ff00'); // Green when complete
            } else if (currentTaps >= requiredTaps * 0.7) {
                this.tapCountText.setColor('#ffff00'); // Yellow when close
            } else {
                this.tapCountText.setColor('#ffffff'); // White at start
            }
            
            // Brief scale animation for feedback
            this.scene.tweens.add({
                targets: this.tapCountText,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 100,
                yoyo: true,
                ease: 'Power2'
            });
        }
    }
    
    createSequenceFeedback(sequence) {
        if (this.sequenceFeedback) {
            this.sequenceFeedback.destroy();
        }
        
        const centerX = this.scene.cameras.main.width / 2;
        const centerY = this.scene.cameras.main.height / 2;
        
        // Create sequence feedback container
        this.sequenceFeedback = this.scene.add.container(centerX, centerY + 100);
        this.sequenceFeedback.setDepth(3500);
        
        // Background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x333333, 0.8);
        bg.fillRoundedRect(-150, -40, 300, 80, 10);
        bg.lineStyle(2, 0xffffff, 0.8);
        bg.strokeRoundedRect(-150, -40, 300, 80, 10);
        this.sequenceFeedback.add(bg);
        
        // Label
        const label = this.scene.add.text(0, -55, 'Press ARROW KEYS or WASD in sequence:', {
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5);
        this.sequenceFeedback.add(label);
        
        // Create sequence display
        this.sequenceItems = [];
        const startX = -120;
        const spacing = 60;
        
        sequence.forEach((key, index) => {
            const keyIcon = this.getArrowKeyIcon(key);
            const keyText = this.scene.add.text(startX + index * spacing, 0, keyIcon, {
                fontSize: '24px',
                color: '#666666',
                stroke: '#000000',
                strokeThickness: 2,
                align: 'center'
            }).setOrigin(0.5);
            
            this.sequenceFeedback.add(keyText);
            this.sequenceItems.push(keyText);
        });
    }
    
    updateSequenceFeedback(currentIndex, sequence) {
        if (this.sequenceItems) {
            this.sequenceItems.forEach((item, index) => {
                if (index < currentIndex) {
                    // Completed keys - green
                    item.setColor('#00ff00');
                    item.setScale(1.1);
                } else if (index === currentIndex) {
                    // Current key - yellow and pulsing
                    item.setColor('#ffff00');
                    item.setScale(1.2);
                    
                    // Pulse animation
                    this.scene.tweens.add({
                        targets: item,
                        alpha: 0.7,
                        duration: 300,
                        yoyo: true,
                        repeat: -1
                    });
                } else {
                    // Future keys - gray
                    item.setColor('#666666');
                    item.setScale(1.0);
                    item.setAlpha(1.0);
                }
            });
        }
    }
    
    getArrowKeyIcon(key) {
        switch (key) {
            case 'up': return '↑';
            case 'right': return '→';
            case 'down': return '↓';
            case 'left': return '←';
            default: return key;
        }
    }
} 