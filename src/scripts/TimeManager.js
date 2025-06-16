// TimeManager.js - 8-Period Day/Night Cycle System
export class TimeManager {
    constructor(scene, gameState) {
        this.scene = scene;
        this.gameState = gameState;
        
        // Time configuration
        this.currentTime = 360; // Start at 6:00 AM (6 * 60 minutes)
        this.timeSpeed = 1; // Minutes per real second (can be accelerated)
        this.paused = false;
        
        // 8-Period time system (in minutes from midnight)
        this.timePeriods = {
            'LATE_NIGHT': { start: 0, end: 300, name: 'Late Night' },      // 00:00-05:00
            'DAWN': { start: 300, end: 420, name: 'Dawn' },               // 05:00-07:00
            'MORNING': { start: 420, end: 600, name: 'Morning' },         // 07:00-10:00
            'MIDDAY': { start: 600, end: 780, name: 'Midday' },           // 10:00-13:00
            'AFTERNOON': { start: 780, end: 960, name: 'Afternoon' },     // 13:00-16:00
            'EVENING': { start: 960, end: 1080, name: 'Evening' },        // 16:00-18:00
            'DUSK': { start: 1080, end: 1200, name: 'Dusk' },             // 18:00-20:00
            'NIGHT': { start: 1200, end: 1440, name: 'Night' }            // 20:00-24:00
        };
        
        this.currentPeriod = this.getCurrentPeriod();
        this.lastPeriod = this.currentPeriod;
        
        // Fish activity modifiers by time period
        this.fishActivityModifiers = {
            'LATE_NIGHT': { activity: 0.3, rareChance: 1.8, biteFast: 0.7 },
            'DAWN': { activity: 1.2, rareChance: 1.4, biteFast: 1.1 },
            'MORNING': { activity: 1.5, rareChance: 1.0, biteFast: 1.2 },
            'MIDDAY': { activity: 0.8, rareChance: 0.8, biteFast: 0.9 },
            'AFTERNOON': { activity: 1.1, rareChance: 1.0, biteFast: 1.0 },
            'EVENING': { activity: 1.4, rareChance: 1.3, biteFast: 1.1 },
            'DUSK': { activity: 1.3, rareChance: 1.6, biteFast: 1.2 },
            'NIGHT': { activity: 0.9, rareChance: 1.5, biteFast: 0.8 }
        };
        
        // Initialize update timer (will be set when scene is ready)
        this.timeUpdateEvent = null;
        
        // Event system for time changes
        this.timeChangeCallbacks = [];
        this.periodChangeCallbacks = [];
        
        // Defer initialization until scene is ready with safety checks
        if (this.scene && this.scene.time && this.scene.time.addEvent) {
            // Scene is fully ready, start immediately
            this.startTimeUpdates();
        } else {
            // Scene not ready yet, use polling approach instead of events
                        this.waitForSceneReady();
        }
        
            }
    
    waitForSceneReady() {
        // Poll for scene readiness instead of relying on events
        const checkReady = () => {
            if (this.scene && this.scene.time && this.scene.time.addEvent) {
                                this.startTimeUpdates();
            } else {
                // Check again in 100ms
                setTimeout(checkReady, 100);
            }
        };
        
        setTimeout(checkReady, 100);
    }
    
    startTimeUpdates() {
        // Safety check for scene.time availability
        if (!this.scene || !this.scene.time) {
            console.warn('TimeManager: Scene.time not available, retrying in 100ms...');
            setTimeout(() => this.startTimeUpdates(), 100);
            return;
        }
        
        if (this.timeUpdateEvent) {
            this.timeUpdateEvent.destroy();
        }
        
        try {
            this.timeUpdateEvent = this.scene.time.addEvent({
                delay: 1000, // Update every second
                callback: this.updateTime,
                callbackScope: this,
                loop: true
            });
            
            console.log('TimeManager: Time updates started successfully');
        } catch (error) {
            console.error('TimeManager: Error starting time updates:', error);
            // Retry after a delay
            setTimeout(() => this.startTimeUpdates(), 500);
        }
    }
    
    updateTime() {
        if (this.paused) return;
        
        // Advance time
        this.currentTime += this.timeSpeed;
        
        // Handle day rollover
        if (this.currentTime >= 1440) { // 24 hours = 1440 minutes
            this.currentTime = 0;
            this.onNewDay();
        }
        
        // Check for period changes
        this.currentPeriod = this.getCurrentPeriod();
        if (this.currentPeriod !== this.lastPeriod) {
            this.onPeriodChange(this.lastPeriod, this.currentPeriod);
            this.lastPeriod = this.currentPeriod;
        }
        
        // Notify time change listeners
        this.notifyTimeChange();
    }
    
    getCurrentPeriod() {
        for (const [periodKey, period] of Object.entries(this.timePeriods)) {
            if (this.currentTime >= period.start && this.currentTime < period.end) {
                return periodKey;
            }
        }
        return 'LATE_NIGHT'; // Default fallback
    }
    
    getCurrentPeriodName() {
        return this.timePeriods[this.currentPeriod]?.name || 'Unknown';
    }
    
    getTimeString() {
        const hours = Math.floor(this.currentTime / 60);
        const minutes = Math.floor(this.currentTime % 60);
        const displayHours = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    
    getFishActivityModifiers() {
        return this.fishActivityModifiers[this.currentPeriod] || { activity: 1.0, rareChance: 1.0, biteFast: 1.0 };
    }
    
    setTimeSpeed(speed) {
        this.timeSpeed = Math.max(0.1, Math.min(50, speed)); // Clamp between 0.1x and 50x
    }
    
    pauseTime() {
        this.paused = true;
    }
    
    resumeTime() {
        this.paused = false;
    }
    
    togglePause() {
        this.paused = !this.paused;
        return this.paused;
    }
    
    // Set specific time (for testing or story events)
    setTime(hours, minutes = 0) {
        this.currentTime = (hours * 60) + minutes;
        if (this.currentTime >= 1440) this.currentTime = this.currentTime % 1440;
        this.currentPeriod = this.getCurrentPeriod();
        this.notifyTimeChange();
    }
    
    // Get lighting intensity for visual effects (0.0 to 1.0)
    getLightingIntensity() {
        const lightingMap = {
            'LATE_NIGHT': 0.1,  // Very dark
            'DAWN': 0.4,         // Growing light
            'MORNING': 0.9,      // Bright
            'MIDDAY': 1.0,       // Brightest
            'AFTERNOON': 0.9,    // Bright
            'EVENING': 0.7,      // Dimming
            'DUSK': 0.3,         // Twilight
            'NIGHT': 0.2         // Dark
        };
        
        return lightingMap[this.currentPeriod] || 0.5;
    }
    
    // Get sky color for visual effects
    getSkyColor() {
        const skyColors = {
            'LATE_NIGHT': 0x0a0a1a,  // Deep night blue
            'DAWN': 0xff6b35,        // Orange dawn
            'MORNING': 0x87ceeb,     // Sky blue
            'MIDDAY': 0x00bfff,      // Bright blue
            'AFTERNOON': 0x87ceeb,   // Sky blue
            'EVENING': 0xffa500,     // Orange
            'DUSK': 0x8b008b,        // Purple
            'NIGHT': 0x191970        // Midnight blue
        };
        
        return skyColors[this.currentPeriod] || 0x87ceeb;
    }
    
    // Event handling
    onTimeChange(callback) {
        this.timeChangeCallbacks.push(callback);
    }
    
    onPeriodChange(callback) {
        this.periodChangeCallbacks.push(callback);
    }
    
    notifyTimeChange() {
        this.timeChangeCallbacks.forEach(callback => {
            try {
                callback(this.currentTime, this.getTimeString(), this.currentPeriod);
            } catch (error) {
                console.error('Time change callback error:', error);
            }
        });
    }
    
    onPeriodChange(oldPeriod, newPeriod) {
        console.log(`Time period changed: ${oldPeriod} → ${newPeriod}`);
        
        this.periodChangeCallbacks.forEach(callback => {
            try {
                callback(oldPeriod, newPeriod, this.getFishActivityModifiers());
            } catch (error) {
                console.error('Period change callback error:', error);
            }
        });
        
        // Update game state
        if (this.gameState) {
            this.gameState.currentTimePeriod = newPeriod;
            this.gameState.currentTime = this.currentTime;
        }
    }
    
    onNewDay() {
        console.log('New day started!');
        // Reset daily activities, refresh shop, etc.
        if (this.gameState) {
            this.gameState.currentDay = (this.gameState.currentDay || 0) + 1;
        }
    }
    
    // Save/Load support
    getTimeData() {
        return {
            currentTime: this.currentTime,
            currentPeriod: this.currentPeriod,
            timeSpeed: this.timeSpeed,
            paused: this.paused
        };
    }
    
    loadTimeData(data) {
        if (data) {
            this.currentTime = data.currentTime || 360;
            this.currentPeriod = data.currentPeriod || this.getCurrentPeriod();
            this.timeSpeed = data.timeSpeed || 1;
            this.paused = data.paused || false;
            this.lastPeriod = this.currentPeriod;
        }
    }
    
    destroy() {
        if (this.timeUpdateEvent) {
            this.timeUpdateEvent.destroy();
        }
        this.timeChangeCallbacks = [];
        this.periodChangeCallbacks = [];
    }
} 