// WeatherManager.js - Dynamic weather system for Luxury Angler
export class WeatherManager {
    constructor(gameState, scene) {
        this.gameState = gameState;
        this.scene = scene;
        this.listeners = new Map();
        
        // Validate inputs
        if (!gameState) {
            console.error('WeatherManager: gameState is required');
            return;
        }
        if (!scene) {
            console.error('WeatherManager: scene is required');
            return;
        }
        
        // Weather types and their effects
        this.weatherTypes = {
            sunny: {
                name: 'Sunny',
                icon: '☀️',
                description: 'Clear skies and calm waters',
                probability: 0.4,
                duration: { min: 120, max: 300 }, // minutes
                effects: {
                    fishActivity: 1.0,
                    biteRate: 1.0,
                    rareChance: 1.0,
                    visibility: 1.0,
                    castAccuracy: 1.0
                },
                visual: {
                    skyColor: 0x87CEEB,
                    waterColor: 0x4682B4,
                    lightIntensity: 1.0,
                    particles: null
                },
                audio: {
                    ambient: 'sunny_ambient',
                    volume: 0.3
                }
            },
            cloudy: {
                name: 'Cloudy',
                icon: '☁️',
                description: 'Overcast skies with diffused light',
                probability: 0.3,
                duration: { min: 90, max: 240 },
                effects: {
                    fishActivity: 1.1,
                    biteRate: 1.05,
                    rareChance: 1.0,
                    visibility: 0.9,
                    castAccuracy: 0.95
                },
                visual: {
                    skyColor: 0x708090,
                    waterColor: 0x2F4F4F,
                    lightIntensity: 0.7,
                    particles: null
                },
                audio: {
                    ambient: 'cloudy_ambient',
                    volume: 0.4
                }
            },
            rainy: {
                name: 'Rainy',
                icon: '🌧️',
                description: 'Light to moderate rainfall',
                probability: 0.2,
                duration: { min: 60, max: 180 },
                effects: {
                    fishActivity: 1.3,
                    biteRate: 1.4,
                    rareChance: 1.2,
                    visibility: 0.7,
                    castAccuracy: 0.8
                },
                visual: {
                    skyColor: 0x696969,
                    waterColor: 0x2F4F4F,
                    lightIntensity: 0.5,
                    particles: 'rain'
                },
                audio: {
                    ambient: 'rain_ambient',
                    volume: 0.6
                }
            },
            stormy: {
                name: 'Stormy',
                icon: '⛈️',
                description: 'Heavy rain with strong winds',
                probability: 0.1,
                duration: { min: 30, max: 90 },
                effects: {
                    fishActivity: 0.6,
                    biteRate: 0.7,
                    rareChance: 1.5,
                    visibility: 0.5,
                    castAccuracy: 0.6
                },
                visual: {
                    skyColor: 0x2F2F2F,
                    waterColor: 0x191970,
                    lightIntensity: 0.3,
                    particles: 'storm'
                },
                audio: {
                    ambient: 'storm_ambient',
                    volume: 0.8
                }
            }
        };
        
        // Initialize weather if not set
        if (!this.gameState.world.weather) {
            this.gameState.world.weather = 'sunny';
        }
        
        this.currentWeather = this.gameState.world.weather;
        this.weatherDuration = 0;
        this.weatherTimer = 0;
        this.isTransitioning = false;
        this.transitionDuration = 30; // seconds for weather transition
        
        // Weather forecast (3 days)
        this.forecast = this.generateForecast();
        
        // Visual effects
        this.weatherParticles = null;
        this.skyTint = null;
        this.waterTint = null;
        
        console.log('WeatherManager: Initialized with dynamic weather system');
    }

    start() {
        try {
            this.setWeatherDuration();
            this.applyWeatherEffects();
            console.log(`WeatherManager: Started with ${this.currentWeather} weather`);
        } catch (error) {
            console.error('WeatherManager: Error starting weather system:', error);
        }
    }

    update(deltaTime) {
        this.weatherTimer += deltaTime / 1000; // Convert to seconds
        
        // Check if weather should change
        if (this.weatherTimer >= this.weatherDuration * 60) { // Convert minutes to seconds
            this.changeWeather();
        }
        
        // Update weather particles
        this.updateWeatherParticles(deltaTime);
    }

    changeWeather() {
        const newWeather = this.selectNewWeather();
        
        if (newWeather !== this.currentWeather) {
            this.transitionToWeather(newWeather);
        } else {
            // Same weather, just reset timer
            this.setWeatherDuration();
            this.weatherTimer = 0;
        }
    }

    selectNewWeather() {
        // Weight probabilities based on current weather and time
        const weights = { ...this.weatherTypes };
        
        // Modify probabilities based on current weather (weather tends to persist)
        Object.keys(weights).forEach(weather => {
            if (weather === this.currentWeather) {
                weights[weather].probability *= 1.5; // Current weather more likely to continue
            }
        });
        
        // Create weighted array
        const weightedWeather = [];
        Object.entries(weights).forEach(([weather, data]) => {
            const weight = Math.floor(data.probability * 100);
            for (let i = 0; i < weight; i++) {
                weightedWeather.push(weather);
            }
        });
        
        return weightedWeather[Math.floor(Math.random() * weightedWeather.length)];
    }

    transitionToWeather(newWeather) {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        const oldWeather = this.currentWeather;
        
        console.log(`WeatherManager: Transitioning from ${oldWeather} to ${newWeather}`);
        
        // Emit transition start event
        this.emit('weatherTransitionStart', {
            oldWeather: oldWeather,
            newWeather: newWeather,
            duration: this.transitionDuration
        });
        
        // Smooth transition over time
        this.scene.tweens.add({
            targets: this,
            duration: this.transitionDuration * 1000,
            ease: 'Power2.easeInOut',
            onUpdate: () => {
                // Update visual effects during transition
                this.updateTransitionEffects(oldWeather, newWeather, this.scene.tweens.getTweensOf(this)[0].progress);
            },
            onComplete: () => {
                this.currentWeather = newWeather;
                this.gameState.world.weather = newWeather;
                this.isTransitioning = false;
                this.setWeatherDuration();
                this.weatherTimer = 0;
                
                this.applyWeatherEffects();
                this.updateForecast();
                
                this.emit('weatherChanged', {
                    oldWeather: oldWeather,
                    newWeather: newWeather,
                    effects: this.getWeatherEffects(),
                    forecast: this.forecast
                });
                
                console.log(`WeatherManager: Weather changed to ${newWeather}`);
            }
        });
    }

    setWeatherDuration() {
        const weatherData = this.weatherTypes[this.currentWeather];
        this.weatherDuration = Phaser.Math.Between(weatherData.duration.min, weatherData.duration.max);
    }

    applyWeatherEffects() {
        try {
            const weatherData = this.weatherTypes[this.currentWeather];
            if (!weatherData) {
                console.warn(`WeatherManager: No weather data found for ${this.currentWeather}`);
                return;
            }
            
            // Apply visual effects with error handling
            try {
                this.updateSkyColor(weatherData.visual.skyColor);
            } catch (error) {
                console.warn('WeatherManager: Error updating sky color:', error);
            }
            
            try {
                this.updateWaterColor(weatherData.visual.waterColor);
            } catch (error) {
                console.warn('WeatherManager: Error updating water color:', error);
            }
            
            try {
                this.updateLighting(weatherData.visual.lightIntensity);
            } catch (error) {
                console.warn('WeatherManager: Error updating lighting:', error);
            }
            
            try {
                this.createWeatherParticles(weatherData.visual.particles);
            } catch (error) {
                console.warn('WeatherManager: Error creating weather particles:', error);
            }
            
            // Apply audio effects
            try {
                this.updateWeatherAudio(weatherData.audio);
            } catch (error) {
                console.warn('WeatherManager: Error updating weather audio:', error);
            }
            
            console.log(`WeatherManager: Applied ${this.currentWeather} weather effects`);
        } catch (error) {
            console.error('WeatherManager: Error applying weather effects:', error);
        }
    }

    updateSkyColor(color) {
        if (this.scene && this.scene.cameras && this.scene.cameras.main) {
            // Create sky gradient effect
            if (!this.skyTint) {
                this.skyTint = this.scene.add.graphics();
                this.skyTint.setDepth(-1000);
            }
            
            this.skyTint.clear();
            this.skyTint.fillGradientStyle(color, color, 0x87CEEB, 0x87CEEB, 0.3);
            this.skyTint.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height * 0.6);
        }
    }

    updateWaterColor(color) {
        if (this.scene && this.scene.cameras && this.scene.cameras.main) {
            // Update water tint
            if (!this.waterTint) {
                this.waterTint = this.scene.add.graphics();
                this.waterTint.setDepth(-999);
            }
            
            this.waterTint.clear();
            this.waterTint.fillStyle(color, 0.2);
            this.waterTint.fillRect(0, this.scene.cameras.main.height * 0.6, 
                                   this.scene.cameras.main.width, this.scene.cameras.main.height * 0.4);
        }
    }

    updateLighting(intensity) {
        if (this.scene && this.scene.cameras && this.scene.cameras.main) {
            // Adjust overall scene lighting using the correct tint method
            const tintValue = Math.floor(255 * intensity);
            const tintColor = (tintValue << 16) | (tintValue << 8) | tintValue;
            this.scene.cameras.main.setTint(tintColor);
        }
    }

    createWeatherParticles(particleType) {
        // Clean up existing particles
        if (this.weatherParticles) {
            this.weatherParticles.destroy();
            this.weatherParticles = null;
        }
        
        if (!particleType || !this.scene) return;
        
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        switch (particleType) {
            case 'rain':
                this.createRainParticles(width, height);
                break;
            case 'storm':
                this.createStormParticles(width, height);
                break;
        }
    }

    createRainParticles(width, height) {
        // Create rain particle system
        this.weatherParticles = this.scene.add.particles(0, 0, 'pixel', {
            x: { min: -50, max: width + 50 },
            y: { min: -50, max: -10 },
            speedX: { min: -20, max: -10 },
            speedY: { min: 200, max: 400 },
            scale: { min: 0.1, max: 0.3 },
            alpha: { min: 0.3, max: 0.7 },
            lifespan: 3000,
            frequency: 50,
            tint: 0x87CEEB
        });
        
        this.weatherParticles.setDepth(1000);
    }

    createStormParticles(width, height) {
        // Create storm particle system (heavier rain)
        this.weatherParticles = this.scene.add.particles(0, 0, 'pixel', {
            x: { min: -100, max: width + 100 },
            y: { min: -50, max: -10 },
            speedX: { min: -50, max: -30 },
            speedY: { min: 300, max: 600 },
            scale: { min: 0.2, max: 0.5 },
            alpha: { min: 0.4, max: 0.8 },
            lifespan: 2000,
            frequency: 20,
            tint: 0x4682B4
        });
        
        this.weatherParticles.setDepth(1000);
        
        // Add lightning effect occasionally
        this.addLightningEffect();
    }

    addLightningEffect() {
        if (!this.scene) return;
        
        const lightningTimer = this.scene.time.addEvent({
            delay: Phaser.Math.Between(10000, 30000),
            callback: () => {
                if (this.currentWeather === 'stormy') {
                    this.createLightningFlash();
                    // Schedule next lightning
                    lightningTimer.reset({
                        delay: Phaser.Math.Between(10000, 30000),
                        callback: lightningTimer.callback
                    });
                } else {
                    lightningTimer.destroy();
                }
            }
        });
    }

    createLightningFlash() {
        if (!this.scene) return;
        
        const flash = this.scene.add.graphics();
        flash.fillStyle(0xFFFFFF, 0.8);
        flash.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);
        flash.setDepth(2000);
        
        // Flash effect
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            ease: 'Power2.easeOut',
            onComplete: () => flash.destroy()
        });
        
        // Play thunder sound after delay
        this.scene.time.delayedCall(Phaser.Math.Between(1000, 3000), () => {
            if (this.gameState.audioManager) {
                this.gameState.audioManager.playSFX('thunder');
            }
        });
    }

    updateWeatherAudio(audioData) {
        if (this.gameState.audioManager && audioData.ambient) {
            this.gameState.audioManager.playAmbient(audioData.ambient, audioData.volume);
        }
    }

    updateWeatherParticles(deltaTime) {
        // Update particle systems if needed
        if (this.weatherParticles && this.weatherParticles.active) {
            // Particles update automatically, but we can add custom behavior here
        }
    }

    updateTransitionEffects(oldWeather, newWeather, progress) {
        // Smooth transition between weather effects
        const oldData = this.weatherTypes[oldWeather];
        const newData = this.weatherTypes[newWeather];
        
        // Interpolate lighting
        const oldIntensity = oldData.visual.lightIntensity;
        const newIntensity = newData.visual.lightIntensity;
        const currentIntensity = oldIntensity + (newIntensity - oldIntensity) * progress;
        
        this.updateLighting(currentIntensity);
    }

    getWeatherEffects(weatherType = null) {
        const weather = weatherType || this.currentWeather;
        return { ...this.weatherTypes[weather].effects };
    }

    getWeatherInfo(weatherType = null) {
        const weather = weatherType || this.currentWeather;
        return {
            type: weather,
            ...this.weatherTypes[weather],
            isCurrent: weather === this.currentWeather,
            timeRemaining: this.getTimeRemaining()
        };
    }

    getTimeRemaining() {
        const remainingSeconds = (this.weatherDuration * 60) - this.weatherTimer;
        const hours = Math.floor(remainingSeconds / 3600);
        const minutes = Math.floor((remainingSeconds % 3600) / 60);
        
        return {
            totalSeconds: remainingSeconds,
            hours: hours,
            minutes: minutes,
            formatted: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
        };
    }

    generateForecast() {
        const forecast = [];
        let currentWeather = this.currentWeather;
        
        for (let day = 0; day < 3; day++) {
            const dayForecast = [];
            
            // Generate 4 periods per day (morning, afternoon, evening, night)
            for (let period = 0; period < 4; period++) {
                currentWeather = this.selectNewWeather();
                dayForecast.push({
                    weather: currentWeather,
                    ...this.weatherTypes[currentWeather],
                    period: ['Morning', 'Afternoon', 'Evening', 'Night'][period]
                });
            }
            
            forecast.push({
                day: day + 1,
                periods: dayForecast
            });
        }
        
        return forecast;
    }

    updateForecast() {
        this.forecast = this.generateForecast();
    }

    getForecast() {
        return this.forecast;
    }

    getFishingConditions() {
        const effects = this.getWeatherEffects();
        const weatherInfo = this.getWeatherInfo();
        
        return {
            weather: this.currentWeather,
            weatherName: weatherInfo.name,
            icon: weatherInfo.icon,
            description: weatherInfo.description,
            fishActivity: effects.fishActivity,
            biteRate: effects.biteRate,
            rareChance: effects.rareChance,
            visibility: effects.visibility,
            castAccuracy: effects.castAccuracy,
            isOptimal: effects.fishActivity >= 1.2 && effects.biteRate >= 1.2,
            timeRemaining: this.getTimeRemaining()
        };
    }

    // Manual weather control (for testing/debugging)
    setWeather(weatherType, duration = null) {
        if (this.weatherTypes[weatherType]) {
            this.currentWeather = weatherType;
            this.gameState.world.weather = weatherType;
            
            if (duration) {
                this.weatherDuration = duration;
            } else {
                this.setWeatherDuration();
            }
            
            this.weatherTimer = 0;
            this.applyWeatherEffects();
            this.updateForecast();
            
            this.emit('weatherChanged', {
                oldWeather: this.currentWeather,
                newWeather: weatherType,
                effects: this.getWeatherEffects(),
                forecast: this.forecast
            });
            
            console.log(`WeatherManager: Manually set weather to ${weatherType}`);
        }
    }

    // Event system
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`WeatherManager: Error in event callback for ${event}:`, error);
                }
            });
        }
    }

    // Save/Load support
    getSaveData() {
        return {
            currentWeather: this.currentWeather,
            weatherDuration: this.weatherDuration,
            weatherTimer: this.weatherTimer,
            forecast: this.forecast
        };
    }

    loadSaveData(data) {
        if (data.currentWeather !== undefined) {
            this.currentWeather = data.currentWeather;
            this.gameState.world.weather = this.currentWeather;
        }
        if (data.weatherDuration !== undefined) {
            this.weatherDuration = data.weatherDuration;
        }
        if (data.weatherTimer !== undefined) {
            this.weatherTimer = data.weatherTimer;
        }
        if (data.forecast !== undefined) {
            this.forecast = data.forecast;
        }
        
        this.applyWeatherEffects();
        console.log('WeatherManager: Save data loaded');
    }

    // Cleanup
    destroy() {
        if (this.weatherParticles) {
            this.weatherParticles.destroy();
        }
        if (this.skyTint) {
            this.skyTint.destroy();
        }
        if (this.waterTint) {
            this.waterTint.destroy();
        }
        
        this.listeners.clear();
        console.log('WeatherManager: Destroyed');
    }

    // Debug methods
    getDebugInfo() {
        return {
            currentWeather: this.currentWeather,
            weatherDuration: this.weatherDuration,
            weatherTimer: this.weatherTimer,
            timeRemaining: this.getTimeRemaining(),
            effects: this.getWeatherEffects(),
            forecast: this.forecast,
            isTransitioning: this.isTransitioning
        };
    }
} 