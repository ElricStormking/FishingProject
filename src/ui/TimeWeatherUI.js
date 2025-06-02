// TimeWeatherUI.js - Time & Weather Display UI Component
export class TimeWeatherUI {
    constructor(scene, timeManager, weatherManager, gameState) {
        this.scene = scene;
        this.timeManager = timeManager;
        this.weatherManager = weatherManager;
        this.gameState = gameState;
        
        // UI properties
        this.isVisible = false;
        this.container = null;
        this.timeDisplay = null;
        this.weatherDisplay = null;
        this.conditionsDisplay = null;
        this.forecastDisplay = null;
        
        // UI configuration
        this.config = {
            x: 10,
            y: 10,
            width: 300,
            height: 200,
            backgroundColor: 0x1a1a2e,
            borderColor: 0x4a90e2,
            textColor: 0xffffff,
            accentColor: 0x4a90e2
        };
        
        this.createUI();
        this.setupEventListeners();
        
        console.log('TimeWeatherUI: Initialized');
    }
    
    createUI() {
        // Main container
        this.container = this.scene.add.container(this.config.x, this.config.y);
        
        // Use scene's depth management if available, otherwise use high UI depth
        const uiDepth = this.scene.getUIDepth ? this.scene.getUIDepth('ui_panels') : 1500;
        this.container.setDepth(uiDepth);
        this.container.setVisible(false);
        
        // Background panel
        this.background = this.scene.add.graphics();
        this.background.fillStyle(this.config.backgroundColor, 0.9);
        this.background.fillRoundedRect(0, 0, this.config.width, this.config.height, 12);
        this.background.lineStyle(2, this.config.borderColor, 0.8);
        this.background.strokeRoundedRect(0, 0, this.config.width, this.config.height, 12);
        this.container.add(this.background);
        
        // Header
        this.headerText = this.scene.add.text(this.config.width / 2, 15, 'TIME & WEATHER', {
            fontSize: '16px',
            fontWeight: 'bold',
            fill: '#4a90e2',
            align: 'center'
        }).setOrigin(0.5, 0);
        this.container.add(this.headerText);
        
        // Time display section
        this.createTimeDisplay();
        
        // Weather display section
        this.createWeatherDisplay();
        
        // Fishing conditions section
        this.createConditionsDisplay();
        
        // Time control buttons
        this.createTimeControls();
        
        // Initial update
        this.updateDisplay();
    }
    
    createTimeDisplay() {
        const startY = 35;
        
        // Time period icon and name
        this.periodIcon = this.scene.add.text(15, startY, '🌅', {
            fontSize: '20px'
        });
        this.container.add(this.periodIcon);
        
        this.periodText = this.scene.add.text(45, startY + 2, 'Dawn', {
            fontSize: '14px',
            fontWeight: 'bold',
            fill: '#ffffff'
        });
        this.container.add(this.periodText);
        
        // Current time
        this.timeText = this.scene.add.text(this.config.width - 15, startY + 2, '06:00 AM', {
            fontSize: '14px',
            fontWeight: 'bold',
            fill: '#4a90e2',
            align: 'right'
        }).setOrigin(1, 0);
        this.container.add(this.timeText);
        
        // Time speed indicator
        this.speedText = this.scene.add.text(15, startY + 25, 'Speed: 1x', {
            fontSize: '11px',
            fill: '#cccccc'
        });
        this.container.add(this.speedText);
    }
    
    createWeatherDisplay() {
        const startY = 75;
        
        // Weather section header
        this.weatherHeader = this.scene.add.text(15, startY, 'Weather', {
            fontSize: '12px',
            fontWeight: 'bold',
            fill: '#4a90e2'
        });
        this.container.add(this.weatherHeader);
        
        // Weather icon and name
        this.weatherIcon = this.scene.add.text(15, startY + 20, '☀️', {
            fontSize: '18px'
        });
        this.container.add(this.weatherIcon);
        
        this.weatherText = this.scene.add.text(45, startY + 22, 'Sunny', {
            fontSize: '12px',
            fill: '#ffffff'
        });
        this.container.add(this.weatherText);
        
        // Weather description
        this.weatherDesc = this.scene.add.text(15, startY + 40, 'Clear skies and bright sunshine', {
            fontSize: '10px',
            fill: '#cccccc',
            wordWrap: { width: this.config.width - 30 }
        });
        this.container.add(this.weatherDesc);
    }
    
    createConditionsDisplay() {
        const startY = 135;
        
        // Conditions header
        this.conditionsHeader = this.scene.add.text(15, startY, 'Fishing Conditions', {
            fontSize: '12px',
            fontWeight: 'bold',
            fill: '#4a90e2'
        });
        this.container.add(this.conditionsHeader);
        
        // Activity level bar
        this.activityLabel = this.scene.add.text(15, startY + 20, 'Activity:', {
            fontSize: '10px',
            fill: '#cccccc'
        });
        this.container.add(this.activityLabel);
        
        this.activityBar = this.scene.add.graphics();
        this.container.add(this.activityBar);
        
        this.activityText = this.scene.add.text(this.config.width - 15, startY + 20, '100%', {
            fontSize: '10px',
            fill: '#ffffff',
            align: 'right'
        }).setOrigin(1, 0);
        this.container.add(this.activityText);
        
        // Bite rate indicator
        this.biteLabel = this.scene.add.text(15, startY + 35, 'Bite Rate:', {
            fontSize: '10px',
            fill: '#cccccc'
        });
        this.container.add(this.biteLabel);
        
        this.biteText = this.scene.add.text(this.config.width - 15, startY + 35, '1.0x', {
            fontSize: '10px',
            fill: '#ffffff',
            align: 'right'
        }).setOrigin(1, 0);
        this.container.add(this.biteText);
        
        // Optimal indicator
        this.optimalIndicator = this.scene.add.text(this.config.width / 2, startY + 50, '', {
            fontSize: '11px',
            fontWeight: 'bold',
            fill: '#ffff00',
            align: 'center'
        }).setOrigin(0.5, 0);
        this.container.add(this.optimalIndicator);
    }
    
    createTimeControls() {
        const controlsY = this.config.height - 25;
        
        // Pause/Resume button
        this.pauseButton = this.scene.add.text(15, controlsY, '⏸️ Pause', {
            fontSize: '11px',
            fill: '#4a90e2',
            backgroundColor: '#333333',
            padding: { x: 6, y: 4 }
        });
        this.pauseButton.setInteractive();
        this.pauseButton.on('pointerdown', () => this.togglePause());
        this.pauseButton.on('pointerover', () => this.pauseButton.setFill('#ffffff'));
        this.pauseButton.on('pointerout', () => this.pauseButton.setFill('#4a90e2'));
        this.container.add(this.pauseButton);
        
        // Speed controls
        this.speedDownButton = this.scene.add.text(90, controlsY, '⏪', {
            fontSize: '11px',
            fill: '#4a90e2',
            backgroundColor: '#333333',
            padding: { x: 6, y: 4 }
        });
        this.speedDownButton.setInteractive();
        this.speedDownButton.on('pointerdown', () => this.changeTimeSpeed(0.5));
        this.speedDownButton.on('pointerover', () => this.speedDownButton.setFill('#ffffff'));
        this.speedDownButton.on('pointerout', () => this.speedDownButton.setFill('#4a90e2'));
        this.container.add(this.speedDownButton);
        
        this.speedUpButton = this.scene.add.text(115, controlsY, '⏩', {
            fontSize: '11px',
            fill: '#4a90e2',
            backgroundColor: '#333333',
            padding: { x: 6, y: 4 }
        });
        this.speedUpButton.setInteractive();
        this.speedUpButton.on('pointerdown', () => this.changeTimeSpeed(2));
        this.speedUpButton.on('pointerover', () => this.speedUpButton.setFill('#ffffff'));
        this.speedUpButton.on('pointerout', () => this.speedUpButton.setFill('#4a90e2'));
        this.container.add(this.speedUpButton);
        
        // Forecast toggle
        this.forecastButton = this.scene.add.text(this.config.width - 15, controlsY, '📅 Forecast', {
            fontSize: '11px',
            fill: '#4a90e2',
            backgroundColor: '#333333',
            padding: { x: 6, y: 4 },
            align: 'right'
        }).setOrigin(1, 0);
        this.forecastButton.setInteractive();
        this.forecastButton.on('pointerdown', () => this.toggleForecast());
        this.forecastButton.on('pointerover', () => this.forecastButton.setFill('#ffffff'));
        this.forecastButton.on('pointerout', () => this.forecastButton.setFill('#4a90e2'));
        this.container.add(this.forecastButton);
    }
    
    setupEventListeners() {
        // Listen to time changes
        if (this.timeManager) {
            this.timeManager.onTimeChange(this.onTimeUpdate.bind(this));
            this.timeManager.onPeriodChange(this.onPeriodChange.bind(this));
        }
        
        // Update display periodically
        this.updateTimer = this.scene.time.addEvent({
            delay: 2000, // Update every 2 seconds
            callback: this.updateDisplay,
            callbackScope: this,
            loop: true
        });
    }
    
    onTimeUpdate(currentTime, timeString, timePeriod) {
        this.updateTimeDisplay();
    }
    
    onPeriodChange(oldPeriod, newPeriod, fishModifiers) {
        this.updateTimeDisplay();
        this.updateConditionsDisplay();
        
        // Show period change notification
        this.showPeriodChangeNotification(newPeriod);
    }
    
    updateDisplay() {
        if (!this.isVisible) return;
        
        this.updateTimeDisplay();
        this.updateWeatherDisplay();
        this.updateConditionsDisplay();
    }
    
    updateTimeDisplay() {
        if (!this.timeManager) return;
        
        // Update time
        this.timeText.setText(this.timeManager.getTimeString());
        
        // Update period
        const period = this.timeManager.getCurrentPeriodName();
        this.periodText.setText(period);
        
        // Update period icon
        const periodIcons = {
            'Late Night': '🌌',
            'Dawn': '🌅',
            'Morning': '🌞',
            'Midday': '☀️',
            'Afternoon': '🌤️',
            'Evening': '🌇',
            'Dusk': '🌆',
            'Night': '🌙'
        };
        this.periodIcon.setText(periodIcons[period] || '⏰');
        
        // Update speed indicator
        this.speedText.setText(`Speed: ${this.timeManager.timeSpeed}x`);
        
        // Update pause button
        this.pauseButton.setText(this.timeManager.paused ? '▶️ Resume' : '⏸️ Pause');
    }
    
    updateWeatherDisplay() {
        if (!this.weatherManager) return;
        
        const weather = this.weatherManager.getCurrentWeather();
        
        // Update weather info
        this.weatherIcon.setText(weather.icon);
        this.weatherText.setText(weather.name);
        this.weatherDesc.setText(weather.description);
    }
    
    updateConditionsDisplay() {
        if (!this.weatherManager) return;
        
        const effects = this.weatherManager.getWeatherEffects();
        const optimal = this.weatherManager.getOptimalFishingConditions();
        
        // Update activity bar
        this.activityBar.clear();
        const barWidth = 100;
        const barHeight = 8;
        const barX = 60;
        const barY = 157;
        
        // Background bar
        this.activityBar.fillStyle(0x333333, 0.8);
        this.activityBar.fillRect(barX, barY, barWidth, barHeight);
        
        // Activity level bar
        const activityPercent = Math.min(1, effects.fishActivity);
        const activityWidth = barWidth * activityPercent;
        const activityColor = activityPercent >= 1.2 ? 0x00ff00 : activityPercent >= 1.0 ? 0xffff00 : 0xff6666;
        
        this.activityBar.fillStyle(activityColor, 0.8);
        this.activityBar.fillRect(barX, barY, activityWidth, barHeight);
        
        // Update text values
        this.activityText.setText(`${Math.round(effects.fishActivity * 100)}%`);
        this.biteText.setText(`${effects.biteRate.toFixed(1)}x`);
        
        // Update optimal indicator
        if (optimal.isOptimal) {
            this.optimalIndicator.setText('⭐ OPTIMAL CONDITIONS ⭐');
            this.optimalIndicator.setFill('#ffff00');
        } else if (optimal.rating >= 80) {
            this.optimalIndicator.setText('Good Fishing Conditions');
            this.optimalIndicator.setFill('#90ee90');
        } else {
            this.optimalIndicator.setText('');
        }
    }
    
    togglePause() {
        if (this.timeManager) {
            const paused = this.timeManager.togglePause();
            console.log(`Time ${paused ? 'paused' : 'resumed'}`);
        }
    }
    
    changeTimeSpeed(multiplier) {
        if (this.timeManager) {
            const newSpeed = this.timeManager.timeSpeed * multiplier;
            this.timeManager.setTimeSpeed(newSpeed);
            console.log(`Time speed changed to ${newSpeed}x`);
        }
    }
    
    toggleForecast() {
        // Could show/hide forecast panel
        console.log('Forecast toggle - feature coming soon');
    }
    
    showPeriodChangeNotification(newPeriod) {
        const periodName = this.timeManager.getCurrentPeriodName();
        const notification = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 100,
            `${periodName} has begun`,
            {
                fontSize: '20px',
                fontWeight: 'bold',
                fill: '#4a90e2',
                backgroundColor: '#1a1a2e',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5).setDepth(2000);
        
        // Animate notification
        this.scene.tweens.add({
            targets: notification,
            alpha: 0,
            y: notification.y - 50,
            duration: 3000,
            ease: 'Power2.easeOut',
            onComplete: () => notification.destroy()
        });
    }
    
    // Public API
    show() {
        this.isVisible = true;
        this.container.setVisible(true);
        this.updateDisplay();
    }
    
    hide() {
        this.isVisible = false;
        this.container.setVisible(false);
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    setPosition(x, y) {
        this.container.setPosition(x, y);
    }
    
    destroy() {
        if (this.updateTimer) {
            this.updateTimer.destroy();
        }
        
        if (this.container) {
            this.container.destroy();
        }
    }
} 