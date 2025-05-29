// TimeWeatherUI.js - UI component for displaying time and weather information
export class TimeWeatherUI {
    constructor(scene, x = 20, y = 20) {
        this.scene = scene;
        this.gameState = scene.gameState;
        this.x = x;
        this.y = y;
        
        this.container = scene.add.container(x, y);
        this.container.setDepth(1000);
        
        this.isVisible = true;
        this.updateInterval = 1000; // Update every second
        this.lastUpdate = 0;
        
        this.createUI();
        this.setupEventListeners();
        
        console.log('TimeWeatherUI: Initialized');
    }

    createUI() {
        // Background panel
        this.background = this.scene.add.graphics();
        this.background.fillStyle(0x000000, 0.7);
        this.background.fillRoundedRect(0, 0, 280, 120, 8);
        this.background.lineStyle(2, 0x4a90e2, 0.8);
        this.background.strokeRoundedRect(0, 0, 280, 120, 8);
        this.container.add(this.background);

        // Title
        this.titleText = this.scene.add.text(10, 8, 'Time & Weather', {
            fontSize: '14px',
            fontWeight: 'bold',
            fill: '#ffffff'
        });
        this.container.add(this.titleText);

        // Time display
        this.timeText = this.scene.add.text(10, 28, 'Time: --:--', {
            fontSize: '12px',
            fill: '#e0e0e0'
        });
        this.container.add(this.timeText);

        // Period display
        this.periodText = this.scene.add.text(10, 45, 'Period: Morning 🌞', {
            fontSize: '12px',
            fill: '#ffeb3b'
        });
        this.container.add(this.periodText);

        // Weather display
        this.weatherText = this.scene.add.text(10, 62, 'Weather: Sunny ☀️', {
            fontSize: '12px',
            fill: '#4fc3f7'
        });
        this.container.add(this.weatherText);

        // Fishing conditions
        this.conditionsText = this.scene.add.text(10, 79, 'Conditions: Good', {
            fontSize: '12px',
            fill: '#4caf50'
        });
        this.container.add(this.conditionsText);

        // Time speed indicator (for debugging)
        this.speedText = this.scene.add.text(10, 96, 'Speed: 1x', {
            fontSize: '10px',
            fill: '#9e9e9e'
        });
        this.container.add(this.speedText);

        // Toggle button
        this.toggleButton = this.scene.add.text(250, 8, '−', {
            fontSize: '16px',
            fontWeight: 'bold',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 6, y: 2 }
        });
        this.toggleButton.setInteractive({ useHandCursor: true });
        this.toggleButton.on('pointerdown', () => this.toggleVisibility());
        this.container.add(this.toggleButton);

        this.updateDisplay();
    }

    setupEventListeners() {
        // Listen for time and weather changes
        if (this.gameState.timeManager) {
            this.gameState.timeManager.on('periodChanged', () => this.updateDisplay());
            this.gameState.timeManager.on('timeChanged', () => this.updateDisplay());
            this.gameState.timeManager.on('timeSpeedChanged', () => this.updateDisplay());
        }

        if (this.gameState.weatherManager) {
            this.gameState.weatherManager.on('weatherChanged', () => this.updateDisplay());
            this.gameState.weatherManager.on('weatherTransitionStart', () => this.updateDisplay());
        }

        // Listen for fishing condition updates
        this.gameState.on('fishBehaviorUpdated', () => this.updateDisplay());
    }

    updateDisplay() {
        if (!this.isVisible) return;

        const currentTime = Date.now();
        if (currentTime - this.lastUpdate < this.updateInterval) return;
        this.lastUpdate = currentTime;

        try {
            // Update time information
            const timeInfo = this.gameState.getCurrentTimeInfo();
            if (timeInfo) {
                this.timeText.setText(`Time: ${timeInfo.formatted}`);
                
                if (this.gameState.timeManager) {
                    const periodInfo = this.gameState.timeManager.getPeriodInfo();
                    this.periodText.setText(`Period: ${periodInfo.name} ${periodInfo.icon}`);
                    
                    // Color code based on fishing conditions
                    const timeConditions = this.gameState.timeManager.getFishingConditions();
                    if (timeConditions.isOptimal) {
                        this.periodText.setFill('#4caf50'); // Green for optimal
                    } else if (timeConditions.fishActivity >= 1.0) {
                        this.periodText.setFill('#ffeb3b'); // Yellow for good
                    } else {
                        this.periodText.setFill('#ff9800'); // Orange for poor
                    }
                }
            }

            // Update weather information
            const weatherInfo = this.gameState.getCurrentWeatherInfo();
            if (weatherInfo) {
                this.weatherText.setText(`Weather: ${weatherInfo.name} ${weatherInfo.icon}`);
                
                if (this.gameState.weatherManager) {
                    // Color code based on weather effects
                    const weatherConditions = this.gameState.weatherManager.getFishingConditions();
                    if (weatherConditions.isOptimal) {
                        this.weatherText.setFill('#4caf50'); // Green for optimal
                    } else if (weatherConditions.fishActivity >= 1.0) {
                        this.weatherText.setFill('#4fc3f7'); // Blue for normal
                    } else {
                        this.weatherText.setFill('#ff5722'); // Red for poor
                    }
                }
            }

            // Update combined fishing conditions
            const conditions = this.gameState.getFishingConditions();
            if (conditions && conditions.combined) {
                const activity = conditions.combined.fishActivity;
                const biteRate = conditions.combined.biteRate;
                
                let conditionText = 'Conditions: ';
                let conditionColor = '#9e9e9e';
                
                if (activity >= 1.3 && biteRate >= 1.3) {
                    conditionText += 'Excellent! 🎣';
                    conditionColor = '#4caf50';
                } else if (activity >= 1.1 && biteRate >= 1.1) {
                    conditionText += 'Good 👍';
                    conditionColor = '#8bc34a';
                } else if (activity >= 0.9 && biteRate >= 0.9) {
                    conditionText += 'Fair 😐';
                    conditionColor = '#ffeb3b';
                } else {
                    conditionText += 'Poor 😞';
                    conditionColor = '#ff5722';
                }
                
                this.conditionsText.setText(conditionText);
                this.conditionsText.setFill(conditionColor);
            }

            // Update time speed (for debugging)
            if (this.gameState.timeManager) {
                const speed = this.gameState.timeManager.getTimeSpeed();
                this.speedText.setText(`Speed: ${speed}x`);
            }
        } catch (error) {
            console.error('TimeWeatherUI: Error updating display:', error);
            // Set fallback text to prevent UI from breaking
            this.timeText.setText('Time: --:--');
            this.periodText.setText('Period: Loading...');
            this.weatherText.setText('Weather: Loading...');
            this.conditionsText.setText('Conditions: Loading...');
            this.speedText.setText('Speed: 1x');
        }
    }

    toggleVisibility() {
        this.isVisible = !this.isVisible;
        
        if (this.isVisible) {
            this.container.setAlpha(1);
            this.toggleButton.setText('−');
            this.updateDisplay();
        } else {
            this.container.setAlpha(0.3);
            this.toggleButton.setText('+');
        }
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.container.setPosition(x, y);
    }

    setVisible(visible) {
        this.container.setVisible(visible);
    }

    destroy() {
        // Clean up event listeners
        if (this.gameState.timeManager) {
            this.gameState.timeManager.off('periodChanged', this.updateDisplay);
            this.gameState.timeManager.off('timeChanged', this.updateDisplay);
            this.gameState.timeManager.off('timeSpeedChanged', this.updateDisplay);
        }

        if (this.gameState.weatherManager) {
            this.gameState.weatherManager.off('weatherChanged', this.updateDisplay);
            this.gameState.weatherManager.off('weatherTransitionStart', this.updateDisplay);
        }

        this.gameState.off('fishBehaviorUpdated', this.updateDisplay);

        // Destroy container and all children
        this.container.destroy();
        
        console.log('TimeWeatherUI: Destroyed');
    }

    // Debug methods for testing
    debugSetTime(hours, minutes = 0) {
        this.gameState.setTime(hours, minutes);
    }

    debugSetWeather(weatherType) {
        this.gameState.setWeather(weatherType);
    }

    debugSetTimeSpeed(speed) {
        this.gameState.setTimeSpeed(speed);
    }

    getDebugInfo() {
        return {
            timeManager: this.gameState.timeManager ? this.gameState.timeManager.getDebugInfo() : null,
            weatherManager: this.gameState.weatherManager ? this.gameState.weatherManager.getDebugInfo() : null,
            fishingConditions: this.gameState.getFishingConditions()
        };
    }
} 