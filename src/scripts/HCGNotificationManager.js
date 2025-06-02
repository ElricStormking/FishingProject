/**
 * HCGNotificationManager.js - Visual feedback system for HCG unlocks
 * Handles notifications, animations, and audio feedback for HCG rewards
 */

import Phaser from 'phaser';

export default class HCGNotificationManager {
    constructor(scene) {
        this.scene = scene;
        this.activeNotifications = [];
        this.notificationQueue = [];
        this.maxConcurrentNotifications = 3;
        this.audioManager = null;
        
        this.initializeAudioManager();
    }
    
    initializeAudioManager() {
        // Simple audio feedback system
        this.audioManager = {
            playUnlockSound: (rarity) => {
                console.log(`Playing ${rarity} unlock sound`);
                // TODO: Integrate with actual audio system
                // this.scene.sound.play(`hcg_unlock_${rarity}`);
            },
            
            playAchievementSound: () => {
                console.log('Playing achievement unlock sound');
                // TODO: Integrate with actual audio system
                // this.scene.sound.play('achievement_unlock');
            }
        };
    }
    
    /**
     * Display HCG unlock notification
     * @param {Object} unlockData - HCG unlock data from HCGUnlockSystem
     */
    showHCGUnlock(unlockData) {
        console.log('HCGNotificationManager: Showing HCG unlock:', unlockData);
        
        const notificationData = {
            type: 'hcg_unlock',
            hcgData: unlockData.hcgData,
            npcId: unlockData.npcId,
            unlockType: unlockData.unlockType,
            timestamp: Date.now()
        };
        
        if (this.activeNotifications.length < this.maxConcurrentNotifications) {
            this.displayNotification(notificationData);
        } else {
            this.notificationQueue.push(notificationData);
        }
    }
    
    /**
     * Display notification with animations and effects
     * @param {Object} notificationData - Notification data object
     */
    displayNotification(notificationData) {
        const notification = this.createNotificationContainer(notificationData);
        this.activeNotifications.push(notification);
        
        // Position notification
        const baseY = 150;
        const notificationHeight = 120;
        const index = this.activeNotifications.length - 1;
        const targetY = baseY + (index * (notificationHeight + 10));
        
        notification.setPosition(400, -100);
        
        // Entrance animation
        this.scene.tweens.add({
            targets: notification,
            y: targetY,
            duration: 600,
            ease: 'Back.easeOut'
        });
        
        // Play audio
        if (notificationData.unlockType === 'achievement') {
            this.audioManager.playAchievementSound();
        } else {
            this.audioManager.playUnlockSound(notificationData.hcgData.rarity);
        }
        
        // Auto-dismiss after delay
        this.scene.time.delayedCall(5000, () => {
            this.dismissNotification(notification);
        });
    }
    
    /**
     * Create notification container with visual elements
     * @param {Object} notificationData - Notification data
     * @returns {Phaser.GameObjects.Container} Notification container
     */
    createNotificationContainer(notificationData) {
        const container = this.scene.add.container(0, 0);
        container.setDepth(10000);
        
        const { hcgData, npcId, unlockType } = notificationData;
        const rarity = hcgData.rarity;
        
        // Background with rarity-based styling
        const bgColor = this.getRarityBackgroundColor(rarity);
        const borderColor = this.getRarityBorderColor(rarity);
        
        const background = this.scene.add.rectangle(0, 0, 350, 100, bgColor, 0.95);
        background.setStrokeStyle(3, borderColor);
        
        // Rarity glow effect
        if (rarity === 'legendary' || rarity === 'mythic') {
            const glow = this.scene.add.rectangle(0, 0, 355, 105, borderColor, 0.3);
            container.add(glow);
            
            // Pulsing glow animation
            this.scene.tweens.add({
                targets: glow,
                alpha: 0.1,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        container.add(background);
        
        // HCG thumbnail placeholder
        const thumbnail = this.scene.add.rectangle(-130, 0, 60, 60, 0x4a4a6a);
        thumbnail.setStrokeStyle(2, borderColor);
        
        const thumbnailText = this.scene.add.text(-130, 0, 'HCG', {
            fontSize: '12px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        container.add([thumbnail, thumbnailText]);
        
        // Main notification text
        const titleText = this.scene.add.text(-70, -20, 'HCG Unlocked!', {
            fontSize: '18px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700',
            fontWeight: 'bold'
        });
        
        const hcgTitle = this.scene.add.text(-70, 5, hcgData.title, {
            fontSize: '16px',
            fontFamily: 'Georgia, serif',
            fill: '#ffffff',
            wordWrap: { width: 200 }
        });
        
        const rarityText = this.scene.add.text(-70, 25, `✨ ${rarity.toUpperCase()} ✨`, {
            fontSize: '12px',
            fill: borderColor,
            fontWeight: 'bold'
        });
        
        container.add([titleText, hcgTitle, rarityText]);
        
        // NPC indicator
        if (npcId !== 'group') {
            const npcIndicator = this.scene.add.text(120, -35, this.getNPCDisplayName(npcId), {
                fontSize: '14px',
                fontFamily: 'Georgia, serif',
                fill: '#cccccc',
                fontStyle: 'italic'
            }).setOrigin(0.5);
            
            container.add(npcIndicator);
        }
        
        // Action buttons
        this.addNotificationButtons(container, notificationData);
        
        // Particle effects for high rarity
        if (rarity === 'legendary' || rarity === 'mythic') {
            this.addParticleEffects(container, rarity);
        }
        
        // Click handler for preview
        background.setInteractive();
        background.on('pointerdown', () => {
            this.previewHCG(hcgData);
        });
        
        return container;
    }
    
    /**
     * Add action buttons to notification
     * @param {Phaser.GameObjects.Container} container - Notification container
     * @param {Object} notificationData - Notification data
     */
    addNotificationButtons(container, notificationData) {
        // View button
        const viewButton = this.scene.add.rectangle(110, 15, 70, 25, 0x4CAF50);
        viewButton.setStrokeStyle(1, 0xffffff);
        
        const viewText = this.scene.add.text(110, 15, '👁️ View', {
            fontSize: '12px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        viewButton.setInteractive();
        viewButton.on('pointerdown', () => {
            this.previewHCG(notificationData.hcgData);
        });
        
        viewButton.on('pointerover', () => {
            viewButton.setFillStyle(0x66BB6A);
        });
        
        viewButton.on('pointerout', () => {
            viewButton.setFillStyle(0x4CAF50);
        });
        
        // Album button
        const albumButton = this.scene.add.rectangle(110, -15, 70, 25, 0x2196F3);
        albumButton.setStrokeStyle(1, 0xffffff);
        
        const albumText = this.scene.add.text(110, -15, '📖 Album', {
            fontSize: '12px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        albumButton.setInteractive();
        albumButton.on('pointerdown', () => {
            this.openAlbum();
        });
        
        albumButton.on('pointerover', () => {
            albumButton.setFillStyle(0x42A5F5);
        });
        
        albumButton.on('pointerout', () => {
            albumButton.setFillStyle(0x2196F3);
        });
        
        // Close button
        const closeButton = this.scene.add.rectangle(150, -35, 20, 20, 0xff4444);
        closeButton.setStrokeStyle(1, 0xffffff);
        
        const closeText = this.scene.add.text(150, -35, '✕', {
            fontSize: '12px',
            fill: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        closeButton.setInteractive();
        closeButton.on('pointerdown', () => {
            this.dismissNotification(container);
        });
        
        container.add([viewButton, viewText, albumButton, albumText, closeButton, closeText]);
    }
    
    /**
     * Add particle effects for high rarity HCGs
     * @param {Phaser.GameObjects.Container} container - Notification container
     * @param {string} rarity - HCG rarity level
     */
    addParticleEffects(container, rarity) {
        const particleCount = rarity === 'mythic' ? 20 : 12;
        const particleColor = rarity === 'mythic' ? 0xff00ff : 0xff8000;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.scene.add.circle(
                Phaser.Math.Between(-170, 170),
                Phaser.Math.Between(-45, 45),
                2,
                particleColor
            );
            
            container.add(particle);
            
            // Particle animation
            this.scene.tweens.add({
                targets: particle,
                y: particle.y - 50,
                alpha: 0,
                duration: 2000,
                delay: Phaser.Math.Between(0, 1000),
                ease: 'Cubic.easeOut'
            });
        }
    }
    
    /**
     * Preview HCG in modal
     * @param {Object} hcgData - HCG data object
     */
    previewHCG(hcgData) {
        console.log('HCGNotificationManager: Previewing HCG:', hcgData.title);
        
        // Create preview modal
        const preview = this.scene.add.container(400, 300);
        preview.setDepth(15000);
        
        // Background overlay
        const overlay = this.scene.add.rectangle(0, 0, 800, 600, 0x000000, 0.8);
        overlay.setInteractive();
        
        // Preview window
        const previewBg = this.scene.add.rectangle(0, 0, 500, 400, 0x1a1a2e);
        previewBg.setStrokeStyle(3, this.getRarityBorderColor(hcgData.rarity));
        
        // HCG image placeholder
        const hcgImage = this.scene.add.rectangle(0, -50, 450, 250, 0x4a4a6a);
        hcgImage.setStrokeStyle(2, 0xffd700);
        
        const imageText = this.scene.add.text(0, -50, 'HCG Preview', {
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Title and description
        const titleText = this.scene.add.text(0, 120, hcgData.title, {
            fontSize: '24px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        const descText = this.scene.add.text(0, 150, hcgData.description, {
            fontSize: '16px',
            fontFamily: 'Georgia, serif',
            fill: '#cccccc',
            wordWrap: { width: 400 }
        }).setOrigin(0.5);
        
        // Close button
        const closeButton = this.scene.add.rectangle(220, -170, 60, 30, 0xff4444);
        closeButton.setStrokeStyle(1, 0xffffff);
        
        const closeText = this.scene.add.text(220, -170, '✕ Close', {
            fontSize: '12px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        closeButton.setInteractive();
        closeButton.on('pointerdown', () => preview.destroy());
        
        overlay.on('pointerdown', () => preview.destroy());
        
        preview.add([overlay, previewBg, hcgImage, imageText, titleText, descText, closeButton, closeText]);
        
        // Entrance animation
        preview.setScale(0);
        this.scene.tweens.add({
            targets: preview,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }
    
    /**
     * Open the album scene
     */
    openAlbum() {
        console.log('HCGNotificationManager: Opening album');
        
        // Pass unlocked HCG data to album scene
        const unlockedHCGs = JSON.parse(localStorage.getItem('cabin_unlocked_hcgs') || '[]');
        
        this.scene.scene.launch('AlbumScene', {
            callingScene: this.scene.scene.key,
            unlockedHCGs: unlockedHCGs
        });
        
        this.scene.scene.pause();
    }
    
    /**
     * Dismiss notification with animation
     * @param {Phaser.GameObjects.Container} notification - Notification container
     */
    dismissNotification(notification) {
        // Exit animation
        this.scene.tweens.add({
            targets: notification,
            x: 800,
            alpha: 0,
            duration: 400,
            ease: 'Back.easeIn',
            onComplete: () => {
                // Remove from active notifications
                const index = this.activeNotifications.indexOf(notification);
                if (index > -1) {
                    this.activeNotifications.splice(index, 1);
                }
                
                notification.destroy();
                
                // Reposition remaining notifications
                this.repositionNotifications();
                
                // Show next queued notification
                if (this.notificationQueue.length > 0) {
                    const nextNotification = this.notificationQueue.shift();
                    this.displayNotification(nextNotification);
                }
            }
        });
    }
    
    /**
     * Reposition active notifications after dismissal
     */
    repositionNotifications() {
        const baseY = 150;
        const notificationHeight = 120;
        
        this.activeNotifications.forEach((notification, index) => {
            const targetY = baseY + (index * (notificationHeight + 10));
            
            this.scene.tweens.add({
                targets: notification,
                y: targetY,
                duration: 300,
                ease: 'Cubic.easeOut'
            });
        });
    }
    
    /**
     * Get rarity-based background color
     * @param {string} rarity - HCG rarity level
     * @returns {number} Background color hex value
     */
    getRarityBackgroundColor(rarity) {
        const colors = {
            common: 0x2e2e2e,
            uncommon: 0x1a4a1a,
            rare: 0x1a1a4a,
            legendary: 0x4a2a1a,
            mythic: 0x4a1a4a
        };
        return colors[rarity] || colors.common;
    }
    
    /**
     * Get rarity-based border color
     * @param {string} rarity - HCG rarity level
     * @returns {number} Border color hex value
     */
    getRarityBorderColor(rarity) {
        const colors = {
            common: 0x999999,
            uncommon: 0x00ff00,
            rare: 0x0080ff,
            legendary: 0xff8000,
            mythic: 0xff00ff
        };
        return colors[rarity] || colors.common;
    }
    
    /**
     * Get display name for NPC
     * @param {string} npcId - NPC identifier
     * @returns {string} Display name
     */
    getNPCDisplayName(npcId) {
        const names = {
            mia: 'Mia',
            sophie: 'Sophie',
            luna: 'Luna'
        };
        return names[npcId] || npcId;
    }
    
    /**
     * Clear all active notifications
     */
    clearAllNotifications() {
        this.activeNotifications.forEach(notification => {
            notification.destroy();
        });
        
        this.activeNotifications = [];
        this.notificationQueue = [];
    }
    
    /**
     * Update notification system (called from scene update loop)
     */
    update() {
        // Update any time-based notification behaviors
        // Currently not needed, but reserved for future enhancements
    }
} 