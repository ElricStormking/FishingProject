// TimeManager.js - Comprehensive time system for Luxury Angler
export class TimeManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.isRunning = false;
        this.timeSpeed = 1; // 1 = normal speed, 2 = 2x speed, etc.
        this.listeners = new Map();
        
        // Time configuration - 8 periods as per GDD
        this.timePeriods = {
            dawn: { start: 5, end: 7, name: 'Dawn', icon: '🌅' },
            morning: { start: 7, end: 10, name: 'Morning', icon: '🌞' },
            midday: { start: 10, end: 13, name: 'Midday', icon: '☀️' },
            afternoon: { start: 13, end: 16, name: 'Afternoon', icon: '🌤️' },
            evening: { start: 16, end: 18, name: 'Evening', icon: '🌇' },
            dusk: { start: 18, end: 20, name: 'Dusk', icon: '🌆' },
            night: { start: 20, end: 23, name: 'Night', icon: '🌙' },
            lateNight: { start: 23, end: 5, name: 'Late Night', icon: '🌌' }
        };
        
        // Time effects on fishing
        this.timeEffects = {
            dawn: { 
                fishActivity: 0.8, 
                biteRate: 1.1, 
                rareChance: 1.2,
                description: 'Calm morning waters, good for patient fishing'
            },
            morning: { 
                fishActivity: 1.3, 
                biteRate: 1.4, 
                rareChance: 1.0,
                description: 'Peak fishing time! Fish are very active'
            },
            midday: { 
                fishActivity: 0.7, 
                biteRate: 0.8, 
                rareChance: 0.8,
                description: 'Bright sun makes fish less active'
            },
            afternoon: { 
                fishActivity: 1.1, 
                biteRate: 1.2, 
                rareChance: 1.0,
                description: 'Good fishing conditions resume'
            },
            evening: { 
                fishActivity: 1.4, 
                biteRate: 1.3, 
                rareChance: 1.1,
                description: 'Another peak period as fish feed before dark'
            },
            dusk: { 
                fishActivity: 1.2, 
                biteRate: 1.1, 
                rareChance: 1.3,
                description: 'Twilight brings unique fishing opportunities'
            },
            night: { 
                fishActivity: 0.9, 
                biteRate: 1.0, 
                rareChance: 1.5,
                description: 'Night fishing reveals different species'
            },
            lateNight: { 
                fishActivity: 0.6, 
                biteRate: 0.9, 
                rareChance: 1.8,
                description: 'Deep night fishing for rare nocturnal fish'
            }
        };
        
        // Initialize time if not set
        if (!this.gameState.world.gameTime) {
            this.gameState.world.gameTime = 7 * 60; // Start at 7:00 AM
        }
        
        this.currentPeriod = this.getCurrentPeriod();
        this.lastPeriod = this.currentPeriod;
        
        console.log('TimeManager: Initialized with 8-period day/night cycle');
    }

    start() {
        this.isRunning = true;
        this.lastUpdateTime = Date.now();
        console.log('TimeManager: Started');
    }

    stop() {
        this.isRunning = false;
        console.log('TimeManager: Stopped');
    }

    update(deltaTime) {
        if (!this.isRunning) return;
        
        // Convert real time to game time (1 real minute = 1 game hour by default)
        const gameTimeIncrement = (deltaTime / 1000) * this.timeSpeed * (60 / 60); // 1 real second = 1 game minute
        
        this.gameState.world.gameTime += gameTimeIncrement;
        
        // Handle day rollover (24 hours = 1440 minutes)
        if (this.gameState.world.gameTime >= 1440) {
            this.gameState.world.gameTime -= 1440;
            this.onNewDay();
        }
        
        // Check for period changes
        const newPeriod = this.getCurrentPeriod();
        if (newPeriod !== this.currentPeriod) {
            this.onPeriodChange(this.currentPeriod, newPeriod);
            this.lastPeriod = this.currentPeriod;
            this.currentPeriod = newPeriod;
        }
        
        // Update game state
        this.gameState.world.timeOfDay = this.currentPeriod;
    }

    getCurrentPeriod() {
        const hours = Math.floor(this.gameState.world.gameTime / 60);
        const currentHour = hours % 24;
        
        for (const [periodId, period] of Object.entries(this.timePeriods)) {
            if (period.start <= period.end) {
                // Normal period (doesn't cross midnight)
                if (currentHour >= period.start && currentHour < period.end) {
                    return periodId;
                }
            } else {
                // Period crosses midnight (like late night: 23-5)
                if (currentHour >= period.start || currentHour < period.end) {
                    return periodId;
                }
            }
        }
        
        return 'morning'; // Fallback
    }

    getCurrentTime() {
        const totalMinutes = Math.floor(this.gameState.world.gameTime);
        const hours = Math.floor(totalMinutes / 60) % 24;
        const minutes = totalMinutes % 60;
        
        return {
            hours: hours,
            minutes: minutes,
            totalMinutes: totalMinutes,
            period: this.currentPeriod,
            formatted: this.formatTime(hours, minutes),
            is24Hour: true
        };
    }

    formatTime(hours, minutes, use24Hour = false) {
        if (use24Hour) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        } else {
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
            return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
        }
    }

    setTime(hours, minutes = 0) {
        this.gameState.world.gameTime = (hours * 60) + minutes;
        this.currentPeriod = this.getCurrentPeriod();
        this.gameState.world.timeOfDay = this.currentPeriod;
        
        this.emit('timeChanged', this.getCurrentTime());
        console.log(`TimeManager: Time set to ${this.formatTime(hours, minutes)}`);
    }

    setTimeSpeed(speed) {
        this.timeSpeed = Math.max(0.1, Math.min(10, speed)); // Clamp between 0.1x and 10x
        this.emit('timeSpeedChanged', this.timeSpeed);
        console.log(`TimeManager: Time speed set to ${this.timeSpeed}x`);
    }

    getTimeSpeed() {
        return this.timeSpeed;
    }

    advanceTime(minutes) {
        this.gameState.world.gameTime += minutes;
        
        if (this.gameState.world.gameTime >= 1440) {
            this.gameState.world.gameTime -= 1440;
            this.onNewDay();
        }
        
        const newPeriod = this.getCurrentPeriod();
        if (newPeriod !== this.currentPeriod) {
            this.onPeriodChange(this.currentPeriod, newPeriod);
            this.lastPeriod = this.currentPeriod;
            this.currentPeriod = newPeriod;
        }
        
        this.gameState.world.timeOfDay = this.currentPeriod;
        this.emit('timeChanged', this.getCurrentTime());
    }

    onPeriodChange(oldPeriod, newPeriod) {
        const periodData = this.timePeriods[newPeriod];
        const effects = this.timeEffects[newPeriod];
        
        console.log(`TimeManager: Period changed from ${oldPeriod} to ${newPeriod}`);
        
        this.emit('periodChanged', {
            oldPeriod: oldPeriod,
            newPeriod: newPeriod,
            periodData: periodData,
            effects: effects,
            time: this.getCurrentTime()
        });
    }

    onNewDay() {
        console.log('TimeManager: New day started');
        this.emit('newDay', {
            day: Math.floor(this.gameState.world.realPlayTime / (1440 * 60 * 1000)) + 1,
            time: this.getCurrentTime()
        });
    }

    getPeriodInfo(periodId = null) {
        const period = periodId || this.currentPeriod;
        return {
            id: period,
            ...this.timePeriods[period],
            effects: this.timeEffects[period],
            isCurrent: period === this.currentPeriod
        };
    }

    getAllPeriods() {
        return Object.keys(this.timePeriods).map(periodId => this.getPeriodInfo(periodId));
    }

    getTimeEffects(periodId = null) {
        const period = periodId || this.currentPeriod;
        return { ...this.timeEffects[period] };
    }

    getFishingConditions() {
        const effects = this.getTimeEffects();
        const periodInfo = this.getPeriodInfo();
        
        return {
            period: this.currentPeriod,
            periodName: periodInfo.name,
            icon: periodInfo.icon,
            description: effects.description,
            fishActivity: effects.fishActivity,
            biteRate: effects.biteRate,
            rareChance: effects.rareChance,
            isOptimal: effects.fishActivity >= 1.2 && effects.biteRate >= 1.2,
            time: this.getCurrentTime()
        };
    }

    getOptimalFishingTimes() {
        return Object.entries(this.timeEffects)
            .filter(([period, effects]) => effects.fishActivity >= 1.2 && effects.biteRate >= 1.2)
            .map(([period, effects]) => ({
                period: period,
                periodName: this.timePeriods[period].name,
                icon: this.timePeriods[period].icon,
                startTime: this.formatTime(this.timePeriods[period].start, 0),
                endTime: this.formatTime(this.timePeriods[period].end, 0),
                effects: effects
            }));
    }

    getTimeUntilPeriod(targetPeriod) {
        const targetStart = this.timePeriods[targetPeriod].start * 60;
        const currentTime = this.gameState.world.gameTime;
        
        let timeUntil;
        if (targetStart > currentTime) {
            timeUntil = targetStart - currentTime;
        } else {
            // Next day
            timeUntil = (1440 - currentTime) + targetStart;
        }
        
        const hours = Math.floor(timeUntil / 60);
        const minutes = timeUntil % 60;
        
        return {
            totalMinutes: timeUntil,
            hours: hours,
            minutes: minutes,
            formatted: `${hours}h ${minutes}m`
        };
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
                    console.error(`TimeManager: Error in event callback for ${event}:`, error);
                }
            });
        }
    }

    // Save/Load support
    getSaveData() {
        return {
            gameTime: this.gameState.world.gameTime,
            timeSpeed: this.timeSpeed,
            currentPeriod: this.currentPeriod,
            isRunning: this.isRunning
        };
    }

    loadSaveData(data) {
        if (data.gameTime !== undefined) {
            this.gameState.world.gameTime = data.gameTime;
        }
        if (data.timeSpeed !== undefined) {
            this.timeSpeed = data.timeSpeed;
        }
        if (data.currentPeriod !== undefined) {
            this.currentPeriod = data.currentPeriod;
        }
        if (data.isRunning !== undefined) {
            this.isRunning = data.isRunning;
        }
        
        this.gameState.world.timeOfDay = this.currentPeriod;
        console.log('TimeManager: Save data loaded');
    }

    // Debug methods
    debugSetPeriod(periodId) {
        if (this.timePeriods[periodId]) {
            const period = this.timePeriods[periodId];
            this.setTime(period.start, 0);
            console.log(`TimeManager: Debug set to ${periodId} period`);
        }
    }

    getDebugInfo() {
        return {
            currentTime: this.getCurrentTime(),
            currentPeriod: this.currentPeriod,
            timeSpeed: this.timeSpeed,
            isRunning: this.isRunning,
            effects: this.getTimeEffects(),
            optimalTimes: this.getOptimalFishingTimes()
        };
    }
} 