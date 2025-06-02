// WeatherManager.js - Dynamic Weather System for Fishing
export class WeatherManager {
    constructor(scene, gameState, timeManager) {
        this.scene = scene;
        this.gameState = gameState;
        this.timeManager = timeManager;
        
        // Weather states
        this.weatherTypes = {
            'SUNNY': {
                name: 'Sunny',
                icon: '☀️',
                description: 'Clear skies and bright sunshine',
                probability: 0.6,
                duration: { min: 120, max: 240 }, // 2-4 hours
                effects: {
                    fishActivity: 1.0,
                    biteRate: 1.0,
                    lineVisibility: 1.2, // Fish see line more clearly
                    playerVisibility: 0.9 // Reduced visibility due to glare
                }
            },
            'RAINY': {
                name: 'Rainy',
                icon: '🌧️',
                description: 'Light to moderate rainfall',
                probability: 0.4,
                duration: { min: 60, max: 180 }, // 1-3 hours
                effects: {
                    fishActivity: 1.4, // Fish more active in rain
                    biteRate: 1.3,
                    lineVisibility: 0.7, // Rain obscures line
                    playerVisibility: 0.8 // Reduced visibility
                }
            }
        };
        
        // Current weather state
        this.currentWeather = 'SUNNY';
        this.weatherDuration = 180; // Duration in game minutes
        this.weatherTimer = 0;
        this.isTransitioning = false;
        this.transitionDuration = 15; // 15 minutes transition time
        this.transitionTimer = 0;
        
        // Forecast system (3-day forecast)
        this.forecast = this.generateForecast();
        
        // Weather particles and effects
        this.rainParticles = null;
        this.weatherSounds = null;
        
        // Initialize weather safely
        this.initializeWeather();
        
        // Listen to time changes (with safety check)
        if (this.timeManager) {
            this.timeManager.onTimeChange(this.onTimeUpdate.bind(this));
        } else {
            console.warn('WeatherManager: TimeManager not available');
        }
        
        console.log('WeatherManager: Initialized with dynamic weather system');
    }
    
    initializeWeather() {
        // Set initial weather based on probability
        this.currentWeather = Math.random() < 0.6 ? 'SUNNY' : 'RAINY';
        this.weatherDuration = this.getRandomDuration(this.currentWeather);
        this.weatherTimer = 0;
        
        // Create visual effects for current weather
        this.updateWeatherEffects();
        
        // Update game state
        if (this.gameState) {
            this.gameState.currentWeather = this.currentWeather;
        }
    }
    
    onTimeUpdate(currentTime, timeString, timePeriod) {
        if (this.timeManager.paused) return;
        
        // Update weather timer (1 game minute = 1 real second with 1x speed)
        this.weatherTimer += this.timeManager.timeSpeed;
        
        if (this.isTransitioning) {
            this.transitionTimer += this.timeManager.timeSpeed;
            if (this.transitionTimer >= this.transitionDuration) {
                this.completeWeatherTransition();
            }
        } else {
            // Check if weather should change
            if (this.weatherTimer >= this.weatherDuration) {
                this.startWeatherTransition();
            }
        }
    }
    
    startWeatherTransition() {
        console.log(`Weather transition starting from ${this.currentWeather}`);
        this.isTransitioning = true;
        this.transitionTimer = 0;
        
        // Determine new weather
        const newWeather = this.getNextWeather();
        this.nextWeather = newWeather;
        
        // Start transition effects
        this.startTransitionEffects();
    }
    
    completeWeatherTransition() {
        const oldWeather = this.currentWeather;
        this.currentWeather = this.nextWeather;
        this.weatherDuration = this.getRandomDuration(this.currentWeather);
        this.weatherTimer = 0;
        this.isTransitioning = false;
        this.transitionTimer = 0;
        
        console.log(`Weather changed: ${oldWeather} → ${this.currentWeather}`);
        
        // Update visual effects
        this.updateWeatherEffects();
        
        // Update forecast
        this.updateForecast();
        
        // Update game state
        if (this.gameState) {
            this.gameState.currentWeather = this.currentWeather;
        }
        
        // Notify weather change
        this.onWeatherChange(oldWeather, this.currentWeather);
    }
    
    getNextWeather() {
        // Simple weather logic - could be enhanced with pressure systems, seasons, etc.
        const currentType = this.weatherTypes[this.currentWeather];
        const otherWeatherTypes = Object.keys(this.weatherTypes).filter(w => w !== this.currentWeather);
        
        // Random selection with some bias toward sunny weather
        if (this.currentWeather === 'RAINY') {
            return Math.random() < 0.7 ? 'SUNNY' : 'RAINY'; // 70% chance rain stops
        } else {
            return Math.random() < 0.3 ? 'RAINY' : 'SUNNY'; // 30% chance of rain
        }
    }
    
    getRandomDuration(weatherType) {
        const weather = this.weatherTypes[weatherType];
        const min = weather.duration.min;
        const max = weather.duration.max;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    updateWeatherEffects() {
        // Remove existing weather effects
        this.clearWeatherEffects();
        
        // Add new weather effects
        if (this.currentWeather === 'RAINY') {
            this.createRainEffects();
        }
        
        // Update lighting and atmosphere
        this.updateAtmosphere();
    }
    
    createRainEffects() {
        // Create rain particle system
        if (this.scene.add && this.scene.cameras && this.scene.cameras.main) {
            try {
                // Simple rain particles using rectangles
                this.rainParticles = this.scene.add.group();
                
                const cameraWidth = this.scene.cameras.main.width;
                const cameraHeight = this.scene.cameras.main.height;
                
                // Validate camera dimensions
                if (!cameraWidth || !cameraHeight || cameraWidth <= 0 || cameraHeight <= 0) {
                    console.warn('WeatherManager: Invalid camera dimensions for rain effects');
                    return;
                }
                
                // Create multiple rain drops
                for (let i = 0; i < 100; i++) {
                    try {
                        const rainDrop = this.scene.add.rectangle(
                            Math.random() * cameraWidth,
                            Math.random() * cameraHeight,
                            2, 20, 0x6bc4e6, 0.6
                        );
                        
                        rainDrop.setDepth(1000); // Above most game elements
                        this.rainParticles.add(rainDrop);
                        
                        // Animate rain drop with error handling
                        this.scene.tweens.add({
                            targets: rainDrop,
                            y: rainDrop.y + cameraHeight + 50,
                            duration: 1000 + Math.random() * 500,
                            repeat: -1,
                            onRepeat: () => {
                                try {
                                    if (rainDrop && rainDrop.active) {
                                        rainDrop.y = -30;
                                        rainDrop.x = Math.random() * cameraWidth;
                                    }
                                } catch (repeatError) {
                                    console.warn('WeatherManager: Error in rain drop repeat:', repeatError);
                                }
                            }
                        });
                    } catch (dropError) {
                        console.warn('WeatherManager: Error creating rain drop:', dropError);
                    }
                }
                
                console.log('WeatherManager: Rain effects created successfully');
            } catch (error) {
                console.error('WeatherManager: Error creating rain effects:', error);
                this.rainParticles = null;
            }
        } else {
            console.warn('WeatherManager: Scene, camera, or add method not available for rain effects');
        }
    }
    
    clearWeatherEffects() {
        try {
            if (this.rainParticles) {
                // Clear all rain particles safely
                this.rainParticles.clear(true, true);
                this.rainParticles = null;
                console.log('WeatherManager: Rain effects cleared successfully');
            }
            
            // Clear atmosphere overlay
            if (this.atmosphereOverlay) {
                this.atmosphereOverlay.destroy();
                this.atmosphereOverlay = null;
                console.log('WeatherManager: Atmosphere overlay cleared');
            }
        } catch (error) {
            console.error('WeatherManager: Error clearing weather effects:', error);
            // Force null assignment even if clear fails
            this.rainParticles = null;
            this.atmosphereOverlay = null;
        }
    }
    
    updateAtmosphere() {
        // Update sky color and lighting based on weather
        if (this.scene.cameras && this.scene.cameras.main) {
            try {
                const baseColor = this.timeManager ? this.timeManager.getSkyColor() : 0x87ceeb;
                let atmosphereColor = baseColor;
                
                if (this.currentWeather === 'RAINY') {
                    // Darker, grayer atmosphere for rain
                    atmosphereColor = this.darkenColor(baseColor, 0.7);
                }
                
                // Remove existing atmosphere overlay if it exists
                if (this.atmosphereOverlay) {
                    this.atmosphereOverlay.destroy();
                    this.atmosphereOverlay = null;
                }
                
                // Create subtle weather atmosphere overlay using graphics
                if (this.currentWeather === 'RAINY') {
                    this.atmosphereOverlay = this.scene.add.graphics();
                    this.atmosphereOverlay.fillStyle(0x334455, 0.1); // Very subtle dark blue overlay
                    this.atmosphereOverlay.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);
                    this.atmosphereOverlay.setDepth(500); // Above background but below UI
                    this.atmosphereOverlay.setScrollFactor(0); // Don't scroll with camera
                }
                
                console.log(`WeatherManager: Applied ${this.currentWeather} atmosphere effects`);
                
            } catch (error) {
                console.error('WeatherManager: Error applying atmosphere effects:', error);
                console.error('WeatherManager: Error details:', error.message);
                // Continue without atmosphere effects if there's an error
            }
        } else {
            console.warn('WeatherManager: Camera not available for atmosphere effects');
        }
    }
    
    darkenColor(color, factor) {
        const r = Math.floor(((color >> 16) & 0xFF) * factor);
        const g = Math.floor(((color >> 8) & 0xFF) * factor);
        const b = Math.floor((color & 0xFF) * factor);
        return (r << 16) | (g << 8) | b;
    }
    
    startTransitionEffects() {
        console.log(`Starting weather transition effects to ${this.nextWeather}`);
        // Could add transition-specific effects here (clouds forming, etc.)
    }
    
    // Forecast system
    generateForecast() {
        const forecast = [];
        let currentWeatherType = this.currentWeather;
        
        // Generate 3-day forecast
        for (let day = 0; day < 3; day++) {
            const dayForecast = [];
            
            // Generate 8 period forecasts for each day
            for (let period = 0; period < 8; period++) {
                // Simple forecast logic - could be enhanced
                if (period === 0) {
                    currentWeatherType = this.getNextWeather();
                } else {
                    currentWeatherType = Math.random() < 0.8 ? currentWeatherType : this.getNextWeather();
                }
                
                dayForecast.push({
                    period: period,
                    weather: currentWeatherType,
                    ...this.weatherTypes[currentWeatherType]
                });
            }
            
            forecast.push(dayForecast);
        }
        
        return forecast;
    }
    
    updateForecast() {
        // Shift forecast and generate new day
        this.forecast.shift();
        
        // Generate new day forecast
        const newDayForecast = [];
        let weatherType = this.forecast[this.forecast.length - 1][7].weather; // Last weather of last day
        
        for (let period = 0; period < 8; period++) {
            weatherType = Math.random() < 0.8 ? weatherType : this.getNextWeather();
            newDayForecast.push({
                period: period,
                weather: weatherType,
                ...this.weatherTypes[weatherType]
            });
        }
        
        this.forecast.push(newDayForecast);
    }
    
    // Public API
    getCurrentWeather() {
        return {
            type: this.currentWeather,
            ...this.weatherTypes[this.currentWeather],
            timeRemaining: this.weatherDuration - this.weatherTimer,
            isTransitioning: this.isTransitioning
        };
    }
    
    getWeatherEffects() {
        const weather = this.weatherTypes[this.currentWeather];
        const timeEffects = this.timeManager ? this.timeManager.getFishActivityModifiers() : { activity: 1.0, rareChance: 1.0 };
        
        return {
            fishActivity: weather.effects.fishActivity * timeEffects.activity,
            biteRate: weather.effects.biteRate * timeEffects.activity,
            lineVisibility: weather.effects.lineVisibility,
            playerVisibility: weather.effects.playerVisibility,
            rareChance: timeEffects.rareChance // Weather doesn't directly affect rarity, but time does
        };
    }
    
    getForecast(days = 3) {
        return this.forecast.slice(0, days);
    }
    
    getOptimalFishingConditions() {
        const currentEffects = this.getWeatherEffects();
        const timePeriod = this.timeManager ? this.timeManager.getCurrentPeriodName() : 'Unknown';
        
        return {
            isOptimal: currentEffects.fishActivity >= 1.2 && currentEffects.biteRate >= 1.2,
            rating: Math.floor((currentEffects.fishActivity + currentEffects.biteRate) * 50),
            period: timePeriod,
            weather: this.getCurrentWeather().name,
            effects: currentEffects
        };
    }
    
    // Force weather change (for testing/story events)
    setWeather(weatherType, duration = null) {
        if (this.weatherTypes[weatherType]) {
            this.currentWeather = weatherType;
            this.weatherDuration = duration || this.getRandomDuration(weatherType);
            this.weatherTimer = 0;
            this.isTransitioning = false;
            
            this.updateWeatherEffects();
            
            if (this.gameState) {
                this.gameState.currentWeather = weatherType;
            }
            
            console.log(`Weather manually set to ${weatherType}`);
        }
    }
    
    // Event handling
    onWeatherChange(oldWeather, newWeather) {
        console.log(`Weather changed from ${oldWeather} to ${newWeather}`);
        
        // Could emit events here for other systems to react
        // this.scene.events.emit('weatherChanged', { oldWeather, newWeather, effects: this.getWeatherEffects() });
    }
    
    // Save/Load support
    getWeatherData() {
        return {
            currentWeather: this.currentWeather,
            weatherDuration: this.weatherDuration,
            weatherTimer: this.weatherTimer,
            isTransitioning: this.isTransitioning,
            transitionTimer: this.transitionTimer,
            forecast: this.forecast
        };
    }
    
    loadWeatherData(data) {
        if (data) {
            this.currentWeather = data.currentWeather || 'SUNNY';
            this.weatherDuration = data.weatherDuration || 180;
            this.weatherTimer = data.weatherTimer || 0;
            this.isTransitioning = data.isTransitioning || false;
            this.transitionTimer = data.transitionTimer || 0;
            this.forecast = data.forecast || this.generateForecast();
            
            this.updateWeatherEffects();
        }
    }
    
    destroy() {
        this.clearWeatherEffects();
        
        if (this.weatherSounds) {
            // Stop weather sounds
        }
        
        console.log('WeatherManager: Destroyed successfully');
    }
    
    setupTransitionEffects() {
        // Smooth transitions between weather states
        if (this.currentWeatherState && this.isTransitioning) {
            this.updateTransitionEffects();
        }
    }
    
    // Location-specific weather patterns
    setLocationWeatherPatterns(locationId, weatherPatterns) {
        this.locationWeatherPatterns = weatherPatterns;
        this.currentLocationId = locationId;
        
        console.log(`WeatherManager: Set weather patterns for location ${locationId}:`, weatherPatterns);
        
        // Immediately update weather probability based on location
        this.updateLocationWeatherProbability();
    }
    
    updateLocationWeatherProbability() {
        if (!this.locationWeatherPatterns) return;
        
        // Update weather types with location-specific probabilities
        Object.keys(this.weatherTypes).forEach(weatherType => {
            if (this.locationWeatherPatterns[weatherType] !== undefined) {
                this.weatherTypes[weatherType].probability = this.locationWeatherPatterns[weatherType];
            }
        });
        
        console.log('WeatherManager: Updated weather probabilities for location:', this.weatherTypes);
    }
    
    getLocationWeatherEffects() {
        // Get location-specific weather effects if available
        const locationManager = this.gameState.locationManager;
        if (locationManager && this.currentWeatherState) {
            const locationEffects = locationManager.getLocationWeatherEffects(this.currentWeatherState);
            if (locationEffects && Object.keys(locationEffects).length > 0) {
                return {
                    ...this.getWeatherEffects(),
                    ...locationEffects
                };
            }
        }
        
        return this.getWeatherEffects();
    }
} 