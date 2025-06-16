import Phaser from 'phaser';
import GameState from '../scripts/GameState.js';
import UITheme from '../ui/UITheme.js';

export default class HUDScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HUDScene' });
    }

    create() {
        // Get game state instance
        this.gameState = GameState.getInstance();

        // Create a more visually appealing HUD with sections
        this.createHUDBackground();
        this.createPlayerStats();
        this.createEquipmentInfo();
        this.createEnvironmentInfo();
        
        // Create fishing stats container (initially hidden)
        this.createFishingStats();
        
        // Listen for game state events
        this.setupEventListeners();
    }
    
    createHUDBackground() {
        // Main HUD background with gradient
        const width = this.cameras.main.width;
        const height = 90; // Slightly taller for more info
        
        // Create a gradient background using Phaser's fillGradientStyle
        const hudBg = this.add.graphics();
        hudBg.fillGradientStyle(
            UITheme.colors.darkPrimary, 
            UITheme.colors.darkPrimary, 
            UITheme.colors.panelBg, 
            UITheme.colors.panelBg, 
            0.85
        );
        hudBg.fillRect(0, 0, width, height);
        
        // Add a subtle border at the bottom
        hudBg.lineStyle(2, UITheme.colors.primary, 0.6);
        hudBg.lineBetween(0, height, width, height);
        
        // Add decorative elements
        this.addHUDDecorations(width, height);
    }
    
    addHUDDecorations(width, height) {
        // Add subtle wave pattern on the HUD
        const wave = this.add.graphics();
        wave.lineStyle(1, UITheme.colors.primaryLight, 0.2);
        
        for (let x = 0; x < width; x += 30) {
            wave.beginPath();
            wave.moveTo(x, height - 5);
            
            for (let i = 0; i < 30; i += 5) {
                wave.lineTo(x + i, height - 5 - Math.sin(i * 0.3) * 3);
            }
            
            wave.strokePath();
        }
        
        // Add fishing hook icon
        const hookIcon = this.add.graphics();
        hookIcon.lineStyle(2, UITheme.colors.silver, 0.7);
        hookIcon.arc(width - 30, 30, 10, 0, Math.PI * 1.5);
        hookIcon.lineTo(width - 30, 15);
    }
    
    createPlayerStats() {
        // Create a container for player stats with icon indicators
        const statsContainer = this.add.container(20, 15);
        
        // Fish caught with icon
        const fishIcon = this.add.text(0, 0, '🎣', { fontSize: '18px' });
        this.fishText = UITheme.createText(this, 30, 2, `${this.gameState.player.fishCaught}`, 'bodyLarge');
        
        // Money with icon
        const moneyIcon = this.add.text(0, 30, '💰', { fontSize: '18px' });
        this.moneyText = UITheme.createText(this, 30, 32, `$${this.gameState.player.money}`, 'bodyLarge');
        this.moneyText.setColor(UITheme.colors.success);
        
        // Add to container
        statsContainer.add([fishIcon, this.fishText, moneyIcon, this.moneyText]);
        
        // Experience with progress bar
        const expContainer = this.add.container(150, 15);
        
        // XP icon and text
        const expIcon = this.add.text(0, 0, '⭐', { fontSize: '18px' });
        this.expText = UITheme.createText(this, 180, 2, `${this.gameState.player.experience}`, 'bodyLarge');
        this.expText.setColor(UITheme.colors.gold);
        
        // XP progress bar
        this.expBarBg = this.add.graphics();
        this.expBarBg.fillStyle(UITheme.colors.darkPrimary, 1);
        this.expBarBg.fillRect(30, 30, 120, 12);
        this.expBarBg.lineStyle(1, UITheme.colors.light, 0.5);
        this.expBarBg.strokeRect(30, 30, 120, 12);
        
        this.expBarFill = this.add.graphics();
        this.updateExpBar();
        
        // Level indicator
        const currentLevel = this.gameState.player.level || 1;
        this.levelText = UITheme.createText(this, 30, 30, `LVL ${currentLevel}`, 'tiny');
        this.levelText.setOrigin(0, 0.5);
        
        // Add to container
        expContainer.add([expIcon, this.expBarBg, this.expBarFill, this.levelText]);
    }
    
    updateExpBar() {
        const currentExp = this.gameState.player.experience || 0;
        const currentLevel = this.gameState.player.level || 1;
        const nextLevelExp = currentLevel * 100; // Simple formula, adjust based on your game
        const progress = Math.min(currentExp / nextLevelExp, 1);
        
        this.expBarFill.clear();
        this.expBarFill.fillStyle(UITheme.colors.gold, 1);
        this.expBarFill.fillRect(30, 30, 120 * progress, 12);
    }
    
    createEquipmentInfo() {
        // Equipment section with icons and durability
        const equipContainer = this.add.container(320, 15);
        
        // Section title
        const equipTitle = UITheme.createText(this, 320, 2, 'EQUIPMENT', 'tiny');
        equipTitle.setAlpha(0.7);
        
        // Get equipped items
        const equippedRod = this.gameState.getEquippedItem('rods');
        const equippedLure = this.gameState.getEquippedItem('lures');
        
        // Rod info with icon and durability
        const rodIcon = this.add.text(0, 20, '🎣', { fontSize: '16px' });
        this.rodText = UITheme.createText(this, 25, 22, `${equippedRod ? equippedRod.name : 'None'}`, 'bodyMedium');
        
        // Add durability bar for rod if available
        if (equippedRod && equippedRod.durability !== undefined) {
            this.rodDurabilityBar = this.createDurabilityBar(25, 40, equippedRod.durability);
        }
        
        // Lure info with icon
        const lureIcon = this.add.text(120, 20, '🪝', { fontSize: '16px' });
        this.lureText = UITheme.createText(this, 145, 22, `${equippedLure ? equippedLure.name : 'None'}`, 'bodyMedium');
        
        // Add durability bar for lure if available
        if (equippedLure && equippedLure.durability !== undefined) {
            this.lureDurabilityBar = this.createDurabilityBar(145, 40, equippedLure.durability);
        }
        
        // Add to container
        equipContainer.add([equipTitle, rodIcon, this.rodText, lureIcon, this.lureText]);
        if (this.rodDurabilityBar) equipContainer.add(this.rodDurabilityBar);
        if (this.lureDurabilityBar) equipContainer.add(this.lureDurabilityBar);
    }
    
    createDurabilityBar(x, y, durability) {
        const container = this.add.container(x, y);
        
        // Background
        const barBg = this.add.graphics();
        barBg.fillStyle(UITheme.colors.darkPrimary, 1);
        barBg.fillRect(0, 0, 80, 6);
        barBg.lineStyle(1, UITheme.colors.light, 0.5);
        barBg.strokeRect(0, 0, 80, 6);
        container.add(barBg);
        
        // Fill based on durability
        const barFill = this.add.graphics();
        const fillColor = this.getDurabilityColor(durability);
        barFill.fillStyle(fillColor, 1);
        barFill.fillRect(0, 0, 80 * (durability / 100), 6);
        container.add(barFill);
        
        // Add tiny text indicator
        const durText = this.add.text(40, 3, `${Math.floor(durability)}%`, {
            fontSize: '8px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        container.add(durText);
        
        return container;
    }
    
    getDurabilityColor(durability) {
        if (durability > 70) return UITheme.colors.success;
        if (durability > 30) return UITheme.colors.warning;
        return UITheme.colors.error;
    }
    
    createEnvironmentInfo() {
        // Environment info (time, weather) with icons
        const envContainer = this.add.container(this.cameras.main.width - 180, 15);
        
        // Time with icon and visual indicator
        const timeIcon = this.add.text(0, 0, '🕒', { fontSize: '16px' });
        this.timeText = UITheme.createText(this, this.cameras.main.width - 155, 2, 
            `${this.gameState.world.timeOfDay}`, 'bodyMedium');
        
        // Visual time indicator (day/night cycle)
        this.timeIndicator = this.add.graphics();
        this.updateTimeIndicator(this.gameState.world.timeOfDay);
        
        // Weather with icon
        const weatherIcon = this.getWeatherIcon(this.gameState.world.weather);
        this.weatherText = UITheme.createText(this, this.cameras.main.width - 155, 32, 
            `${this.gameState.world.weather}`, 'bodyMedium');
        
        // Add to container
        envContainer.add([timeIcon, this.timeText, this.timeIndicator, weatherIcon, this.weatherText]);
    }
    
    updateTimeIndicator(timeOfDay) {
        this.timeIndicator.clear();
        
        // Create a day/night cycle indicator
        const x = this.cameras.main.width - 155;
        const y = 15;
        const width = 120;
        const height = 8;
        
        // Background
        this.timeIndicator.fillStyle(UITheme.colors.darkPrimary, 1);
        this.timeIndicator.fillRect(x, y, width, height);
        
        // Get time position
        let position = 0;
        if (timeOfDay.includes('Morning')) position = 0.2;
        else if (timeOfDay.includes('Noon')) position = 0.5;
        else if (timeOfDay.includes('Afternoon')) position = 0.7;
        else if (timeOfDay.includes('Evening')) position = 0.9;
        else if (timeOfDay.includes('Night')) position = 0.1;
        
        // Sun/moon position
        const indicatorX = x + (width * position);
        
        // Day/night gradient using Phaser's fillGradientStyle
        this.timeIndicator.fillGradientStyle(
            0x000033,    // Top left - Night
            0x4a90e2,    // Top right - Day
            0x1a237e,    // Bottom left - Dawn
            0xff9800,    // Bottom right - Sunset
            1
        );
        this.timeIndicator.fillRect(x, y, width, height);
        
        // Sun/moon indicator
        if (timeOfDay.includes('Night')) {
            // Moon
            this.timeIndicator.fillStyle(0xf0f0f0, 1);
        } else {
            // Sun
            this.timeIndicator.fillStyle(0xffeb3b, 1);
        }
        this.timeIndicator.fillCircle(indicatorX, y + height/2, 5);
    }
    
    getWeatherIcon(weather) {
        let icon = '☀️'; // Default sunny
        
        if (weather.includes('Rain')) icon = '🌧️';
        else if (weather.includes('Cloud')) icon = '☁️';
        else if (weather.includes('Storm')) icon = '⛈️';
        else if (weather.includes('Snow')) icon = '❄️';
        else if (weather.includes('Fog')) icon = '🌫️';
        else if (weather.includes('Wind')) icon = '💨';
        
        return this.add.text(0, 30, icon, { fontSize: '16px' });
    }
    
    createFishingStats() {
        // Create a container for fishing session stats (shown during active fishing)
        this.fishingStatsContainer = this.add.container(this.cameras.main.width / 2 - 100, 15);
        this.fishingStatsContainer.setVisible(false);
        
        // Background panel
        const statsBg = UITheme.createPanel(
            this, 0, 0, 200, 60, 'secondary'
        );
        
        // Session title
        const sessionTitle = UITheme.createText(this, 100, 10, 'FISHING SESSION', 'tiny');
        sessionTitle.setOrigin(0.5, 0);
        
        // Stats text
        this.sessionTimeText = UITheme.createText(this, 10, 25, 'Time: 00:00', 'bodySmall');
        this.sessionCatchesText = UITheme.createText(this, 10, 40, 'Catches: 0', 'bodySmall');
        
        // Add to container
        this.fishingStatsContainer.add([statsBg, sessionTitle, this.sessionTimeText, this.sessionCatchesText]);
    }
    
    setupEventListeners() {
        // Listen for game state events
        this.gameState.on('fishCaught', this.onFishCaught.bind(this));
        this.gameState.on('moneyChanged', this.onMoneyChanged.bind(this));
        this.gameState.on('experienceGained', this.onExperienceGained.bind(this));
        this.gameState.on('levelUp', this.onLevelUp.bind(this));
        this.gameState.on('timeUpdated', this.onTimeUpdated.bind(this));
        
        // Listen for fishing events from PlayerController - with safety checks
        try {
            const gameScene = this.scene.get('GameScene');
            if (gameScene && gameScene.events) {
                                gameScene.events.on('fishing:catchSuccess', this.onCatchSuccess.bind(this));
                gameScene.events.on('fishing:catchFailure', this.onCatchFailure.bind(this));
                gameScene.events.on('equipment:damaged', this.onEquipmentDamaged.bind(this));
                gameScene.events.on('fishing:sessionStarted', this.onFishingSessionStarted.bind(this));
                gameScene.events.on('fishing:sessionEnded', this.onFishingSessionEnded.bind(this));
                            } else {
                console.warn('HUDScene: GameScene not available yet, will set up listeners when scene becomes available');
                
                // Set up a delayed listener setup for when GameScene becomes available
                this.setupGameSceneListenersWhenReady();
            }
        } catch (error) {
            console.error('HUDScene: Error setting up GameScene event listeners:', error);
            console.warn('HUDScene: Will attempt to set up listeners when GameScene becomes available');
            this.setupGameSceneListenersWhenReady();
        }
    }
    
    /**
     * Set up GameScene event listeners when the scene becomes available
     */
    setupGameSceneListenersWhenReady() {
        // Check periodically for GameScene availability
        const checkForGameScene = () => {
            try {
                const gameScene = this.scene.get('GameScene');
                if (gameScene && gameScene.events && gameScene.scene.isActive()) {
                                        gameScene.events.on('fishing:catchSuccess', this.onCatchSuccess.bind(this));
                    gameScene.events.on('fishing:catchFailure', this.onCatchFailure.bind(this));
                    gameScene.events.on('equipment:damaged', this.onEquipmentDamaged.bind(this));
                    gameScene.events.on('fishing:sessionStarted', this.onFishingSessionStarted.bind(this));
                    gameScene.events.on('fishing:sessionEnded', this.onFishingSessionEnded.bind(this));
                                        return true; // Stop checking
                }
                return false; // Continue checking
            } catch (error) {
                console.warn('HUDScene: Error checking for GameScene availability:', error);
                return false; // Continue checking
            }
        };
        
        // Check immediately
        if (!checkForGameScene()) {
            // If not available, set up a timer to check periodically
            const checkTimer = this.time.addEvent({
                delay: 500, // Check every 500ms
                callback: () => {
                    if (checkForGameScene()) {
                        checkTimer.destroy(); // Stop checking once successful
                    }
                },
                repeat: 10 // Try up to 10 times (5 seconds total)
            });
        }
    }

    onFishCaught(data) {
        this.updateHUD();
        
        // Show detailed notification with rewards and milestones
        let message = `🎣 Caught ${data.fish.name}!\n💰 +${data.rewards.coins} coins\n⭐ +${data.rewards.experience} XP`;
        
        // Add milestone notifications
        if (data.milestones && data.milestones.length > 0) {
            data.milestones.forEach(milestone => {
                this.showMilestoneNotification(milestone);
            });
        }
        
        this.showNotification(message, 'success');
        
        // Update fishing session stats if active
        if (this.fishingStatsContainer.visible) {
            const catches = parseInt(this.sessionCatchesText.text.split(': ')[1]) + 1;
            this.sessionCatchesText.setText(`Catches: ${catches}`);
        }
    }

    onMoneyChanged(data) {
        this.updateHUD();
    }

    onExperienceGained(data) {
        try {
            this.updateHUD();
            this.updateExpBar();
        } catch (error) {
            console.error('HUDScene: Error in onExperienceGained:', error);
        }
    }

    onLevelUp(data) {
        try {
            // PlayerProgression emits 'newLevel', not 'level'
            const level = data?.newLevel || data?.level || 1;
            this.showNotification(`🏆 Level Up! You are now level ${level}!`, 'success');
            this.updateHUD();
            this.updateExpBar();
            
            // Add level up animation
            this.createLevelUpAnimation();
        } catch (error) {
            console.error('HUDScene: Error in onLevelUp:', error);
            console.error('HUDScene: Data received:', data);
        }
    }
    
    createLevelUpAnimation() {
        try {
            // Create a flashy level up animation
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;
            
            // Background flash
            const flash = this.add.graphics();
            flash.fillStyle(0xFFD700, 0.3); // Gold color instead of UITheme
            flash.fillRect(0, 0, width, height);
            flash.setDepth(2000);
            
            // Level up text
            const levelUpText = this.add.text(width/2, height/2, 'LEVEL UP!', {
                fontFamily: 'Arial', // Standard font instead of UITheme
                fontSize: '48px',
                color: '#FFD700',
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center'
            }).setOrigin(0.5);
            levelUpText.setDepth(2001);
            
            // Create simple particle effect using graphics
            const particles = [];
            const colors = [0xFFFF00, 0xFF0000, 0x00FF00, 0x0000FF];
            for (let i = 0; i < 20; i++) {
                const particle = this.add.graphics();
                particle.fillStyle(Phaser.Utils.Array.GetRandom(colors), 1);
                particle.fillCircle(0, 0, 3);
                particle.setPosition(width/2, height/2);
                particle.setDepth(1999);
                particles.push(particle);
                
                // Animate each particle
                const angle = (i / 20) * Math.PI * 2;
                const speed = 100 + Math.random() * 100;
                
                this.tweens.add({
                    targets: particle,
                    x: width/2 + Math.cos(angle) * speed,
                    y: height/2 + Math.sin(angle) * speed,
                    alpha: 0,
                    scale: 0,
                    duration: 1000,
                    ease: 'Power2.easeOut',
                    onComplete: () => {
                        if (particle && particle.active) {
                            particle.destroy();
                        }
                    }
                });
            }
            
            // Animation
            this.tweens.add({
                targets: levelUpText,
                scale: 1.2,
                duration: 300,
                yoyo: true,
                repeat: 1,
                ease: 'Sine.easeInOut'
            });
            
            // Remove after animation
            this.time.delayedCall(2000, () => {
                if (flash && flash.active) flash.destroy();
                if (levelUpText && levelUpText.active) levelUpText.destroy();
            });
        } catch (error) {
            console.error('HUDScene: Error in createLevelUpAnimation:', error);
        }
    }

    onTimeUpdated(data) {
        this.timeText.setText(`${data.timeOfDay}`);
        this.updateTimeIndicator(data.timeOfDay);
    }
    
    onFishingSessionStarted(data) {
        // Show fishing session stats
        this.fishingStatsContainer.setVisible(true);
        
        // Reset stats
        this.sessionCatchesText.setText('Catches: 0');
        
        // Start session timer
        this.sessionStartTime = Date.now();
        this.sessionTimerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.updateSessionTimer,
            callbackScope: this,
            loop: true
        });
    }
    
    onFishingSessionEnded(data) {
        // Hide fishing session stats
        this.fishingStatsContainer.setVisible(false);
        
        // Stop session timer
        if (this.sessionTimerEvent) {
            this.sessionTimerEvent.remove();
        }
        
        // Show session summary if data available
        if (data && data.catches) {
            this.showNotification(`Fishing session ended! Catches: ${data.catches}`, 'info');
        }
    }
    
    updateSessionTimer() {
        if (!this.sessionStartTime) return;
        
        const elapsed = Date.now() - this.sessionStartTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        this.sessionTimeText.setText(`Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }

    updateHUD() {
        // Update player stats
        this.fishText.setText(`${this.gameState.player.fishCaught}`);
        this.moneyText.setText(`$${this.gameState.player.money}`);
        this.expText.setText(`${this.gameState.player.experience}`);
        
        // Update equipment display
        const equippedRod = this.gameState.getEquippedItem('rods');
        const equippedLure = this.gameState.getEquippedItem('lures');
        
        this.rodText.setText(`${equippedRod ? equippedRod.name : 'None'}`);
        this.lureText.setText(`${equippedLure ? equippedLure.name : 'None'}`);
        
        // Update durability bars if they exist
        if (this.rodDurabilityBar && equippedRod && equippedRod.durability !== undefined) {
            this.updateDurabilityBar(this.rodDurabilityBar, equippedRod.durability);
        }
        
        if (this.lureDurabilityBar && equippedLure && equippedLure.durability !== undefined) {
            this.updateDurabilityBar(this.lureDurabilityBar, equippedLure.durability);
        }
    }
    
    updateDurabilityBar(container, durability) {
        // Find the fill graphics (second child)
        const barFill = container.list[1];
        const durText = container.list[2];
        
        if (barFill && barFill.clear) {
            barFill.clear();
            const fillColor = this.getDurabilityColor(durability);
            barFill.fillStyle(fillColor, 1);
            barFill.fillRect(0, 0, 80 * (durability / 100), 6);
        }
        
        if (durText && durText.setText) {
            durText.setText(`${Math.floor(durability)}%`);
        }
    }

    onCatchSuccess(data) {
        this.updateHUD();
        this.showNotification(data.message, 'success');
    }

    onCatchFailure(data) {
        this.updateHUD();
        this.showNotification(data.message, 'error');
    }

    onEquipmentDamaged(data) {
        this.updateHUD();
        this.showNotification(`⚠️ ${data.item.name} damaged!\nDurability: ${data.item.durability}%`, 'warning');
    }

    showNotification(text, type = 'info') {
        try {
            // Create standard Phaser notification instead of UITheme
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;
            
            // Determine color based on type
            let bgColor = 0x2c3e50; // Default blue-gray
            let textColor = '#ffffff';
            
            switch (type) {
                case 'success':
                    bgColor = 0x27ae60; // Green
                    break;
                case 'error':
                    bgColor = 0xe74c3c; // Red
                    break;
                case 'warning':
                    bgColor = 0xf39c12; // Orange
                    break;
                case 'info':
                default:
                    bgColor = 0x3498db; // Blue
                    break;
            }
            
            // Create notification container
            const notification = this.add.container(width / 2, 80);
            notification.setDepth(2000);
            
            // Background panel
            const bg = this.add.graphics();
            bg.fillStyle(bgColor, 0.9);
            bg.fillRoundedRect(-150, -25, 300, 50, 10);
            bg.lineStyle(2, 0xffffff, 0.8);
            bg.strokeRoundedRect(-150, -25, 300, 50, 10);
            notification.add(bg);
            
            // Notification text
            const notificationText = this.add.text(0, 0, text, {
                fontSize: '16px',
                fill: textColor,
                fontFamily: 'Arial',
                align: 'center',
                wordWrap: { width: 280 }
            });
            notificationText.setOrigin(0.5);
            notification.add(notificationText);
            
            // Animate in
            notification.setScale(0);
            this.tweens.add({
                targets: notification,
                scaleX: 1,
                scaleY: 1,
                duration: 300,
                ease: 'Back.easeOut'
            });
            
            // Fade out after delay
            this.tweens.add({
                targets: notification,
                alpha: 0,
                y: notification.y - 30,
                duration: 500,
                delay: 3000,
                ease: 'Power2.easeIn',
                onComplete: () => {
                    if (notification && notification.active) {
                        notification.destroy();
                    }
                }
            });
        } catch (error) {
            console.error('HUDScene: Error in showNotification:', error);
        }
    }

    showMilestoneNotification(milestone) {
        try {
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;
            
            // Create milestone notification text
            const text = `🏆 ${milestone.message}\n💎 Rewards: +${milestone.rewards.coins || 0} coins, +${milestone.rewards.gems || 0} gems`;
            
            const notification = this.add.text(
                width / 2,
                height / 2 + 50,
                text,
                {
                    fontSize: '20px',
                    fill: '#FFD700',
                    fontFamily: 'Arial',
                    align: 'center',
                    stroke: '#000000',
                    strokeThickness: 3,
                    wordWrap: { width: 400 }
                }
            );
            notification.setOrigin(0.5);
            notification.setDepth(2100);
            
            // Background panel
            const bgPanel = this.add.graphics();
            bgPanel.fillStyle(0x27ae60, 0.9); // Success green
            bgPanel.fillRoundedRect(
                notification.x - 200, 
                notification.y - 40, 
                400, 
                80, 
                15
            );
            bgPanel.lineStyle(3, 0xFFD700, 1);
            bgPanel.strokeRoundedRect(
                notification.x - 200, 
                notification.y - 40, 
                400, 
                80, 
                15
            );
            bgPanel.setDepth(2050);
            bgPanel.setAlpha(0.9);

            // Special milestone animation
            this.tweens.add({
                targets: [notification, bgPanel],
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 400,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });

            // Fade out after longer duration
            this.tweens.add({
                targets: [notification, bgPanel],
                alpha: 0,
                y: notification.y - 80,
                duration: 1500,
                delay: 4000,
                ease: 'Power2.easeIn',
                onComplete: () => {
                    if (notification && notification.active) notification.destroy();
                    if (bgPanel && bgPanel.active) bgPanel.destroy();
                }
            });
        } catch (error) {
            console.error('HUDScene: Error in showMilestoneNotification:', error);
        }
    }
} 