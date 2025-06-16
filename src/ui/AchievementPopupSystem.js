import UITheme from './UITheme.js';
import Logger from '../utils/Logger.js';

/**
 * Achievement Popup System - Visual achievement unlock notifications
 * Part of RenJs Integration Final Polish task implementation
 */
export class AchievementPopupSystem {
    constructor(scene) {
        this.scene = scene;
        this.gameState = scene.gameState;
        
        this.popupQueue = [];
        this.activePopups = [];
        this.maxConcurrentPopups = 3;
        this.defaultDuration = 5000;
        
        // Animation settings
        this.animationSettings = {
            slideIn: { duration: 500, ease: 'Power2.easeOut' },
            celebration: { duration: 1000, ease: 'Bounce.easeOut' },
            slideOut: { duration: 300, ease: 'Power2.easeIn' },
            glow: { duration: 2000, ease: 'Sine.easeInOut' }
        };
        
        if (import.meta.env.DEV) console.log('AchievementPopupSystem: Achievement notification system initialized');
    }

    /**
     * Show achievement unlock popup
     * @param {Object} achievementData - Achievement information
     */
    showAchievementPopup(achievementData) {
        const popup = this.createAchievementPopup(achievementData);
        
        if (this.activePopups.length < this.maxConcurrentPopups) {
            this.displayPopup(popup);
        } else {
            this.popupQueue.push(popup);
        }
    }

    /**
     * Create achievement popup data structure
     */
    createAchievementPopup(achievementData) {
        return {
            id: `achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: achievementData.title || 'Achievement Unlocked!',
            description: achievementData.description || 'You completed a milestone!',
            icon: achievementData.icon || '🏆',
            rarity: achievementData.rarity || 'common',
            category: achievementData.category || 'general',
            points: achievementData.points || 10,
            rewards: achievementData.rewards || null,
            timestamp: Date.now(),
            duration: achievementData.duration || this.defaultDuration,
            celebrationType: achievementData.celebrationType || 'standard'
        };
    }

    /**
     * Display popup with animations
     */
    displayPopup(popupData) {
        const popup = this.createPopupUI(popupData);
        this.activePopups.push(popup);
        
        // Position popup based on existing popups
        this.positionPopup(popup, this.activePopups.length - 1);
        
        // Animate popup in
        this.animatePopupIn(popup, popupData);
        
        // Schedule popup removal
        this.schedulePopupRemoval(popup, popupData.duration);
        
        // Play achievement sound
        this.playAchievementSound(popupData.rarity);
        
        if (import.meta.env.DEV) console.log(`AchievementPopupSystem: Showing achievement: ${popupData.title}`);
    }

    /**
     * Create popup UI elements
     */
    createPopupUI(popupData) {
        const { width, height } = this.scene.cameras.main;
        
        // Main container
        const container = this.scene.add.container(width + 400, 100); // Start off-screen
        container.setDepth(15000);
        container.popupId = popupData.id;
        
        // Popup dimensions
        const popupWidth = 350;
        const popupHeight = 120;
        
        // Background with rarity-based styling
        const bgColor = this.getRarityColor(popupData.rarity);
        const background = this.scene.add.graphics();
        background.fillStyle(bgColor.primary, 0.95);
        background.fillRoundedRect(-popupWidth/2, -popupHeight/2, popupWidth, popupHeight, 15);
        
        // Border with glow effect
        background.lineStyle(3, bgColor.secondary, 1);
        background.strokeRoundedRect(-popupWidth/2, -popupHeight/2, popupWidth, popupHeight, 15);
        
        // Inner glow
        const innerGlow = this.scene.add.graphics();
        innerGlow.fillStyle(bgColor.secondary, 0.3);
        innerGlow.fillRoundedRect(-popupWidth/2 + 3, -popupHeight/2 + 3, popupWidth - 6, popupHeight - 6, 12);
        
        // Achievement icon
        const iconText = UITheme.createText(this.scene, -140, -15, popupData.icon, 'gigantic');
        iconText.setOrigin(0.5);
        
        // Title with rarity styling
        const title = UITheme.createText(this.scene, -60, -25, popupData.title, 'headerMedium');
        title.setOrigin(0, 0.5);
        title.setColor(bgColor.text);
        
        // Description
        const description = UITheme.createText(this.scene, -60, 0, popupData.description, 'bodySmall');
        description.setOrigin(0, 0.5);
        description.setWordWrapWidth(250);
        
        // Points indicator
        const pointsText = UITheme.createText(this.scene, 120, -35, `+${popupData.points} pts`, 'bodySmall');
        pointsText.setOrigin(0.5);
        pointsText.setColor(bgColor.accent);
        
        // Rarity indicator
        const rarityBadge = this.createRarityBadge(popupData.rarity, 120, 10);
        
        // Progress bar for visual flair
        const progressBar = this.createProgressBar(-popupWidth/2 + 10, popupHeight/2 - 15, popupWidth - 20);
        
        // Add all elements to container
        container.add([
            background, innerGlow, iconText, title, description, 
            pointsText, rarityBadge.container, progressBar.container
        ]);
        
        // Store references for animations
        container.background = background;
        container.innerGlow = innerGlow;
        container.iconText = iconText;
        container.progressBar = progressBar;
        container.popupData = popupData;
        
        return container;
    }

    /**
     * Get colors based on achievement rarity
     */
    getRarityColor(rarity) {
        const rarityColors = {
            common: {
                primary: UITheme.colors.medium,
                secondary: UITheme.colors.light,
                accent: UITheme.colors.success,
                text: UITheme.colors.text
            },
            uncommon: {
                primary: UITheme.colors.primary,
                secondary: UITheme.colors.primaryLight,
                accent: UITheme.colors.info,
                text: UITheme.colors.text
            },
            rare: {
                primary: UITheme.colors.secondary,
                secondary: UITheme.colors.secondaryLight,
                accent: UITheme.colors.warning,
                text: UITheme.colors.text
            },
            epic: {
                primary: 0x9b59b6,
                secondary: 0xd68bd0,
                accent: UITheme.colors.gold,
                text: UITheme.colors.text
            },
            legendary: {
                primary: UITheme.colors.gold,
                secondary: 0xffd700,
                accent: 0xff6b35,
                text: '#000000'
            }
        };
        
        return rarityColors[rarity] || rarityColors.common;
    }

    /**
     * Create rarity badge
     */
    createRarityBadge(rarity, x, y) {
        const container = this.scene.add.container(x, y);
        
        const badge = this.scene.add.graphics();
        const color = this.getRarityColor(rarity);
        badge.fillStyle(color.accent, 0.8);
        badge.fillRoundedRect(-25, -8, 50, 16, 8);
        
        const badgeText = UITheme.createText(this.scene, 0, 0, rarity.toUpperCase(), 'bodySmall');
        badgeText.setOrigin(0.5);
        badgeText.setFontStyle('bold');
        
        container.add([badge, badgeText]);
        return { container };
    }

    /**
     * Create animated progress bar
     */
    createProgressBar(x, y, width) {
        const container = this.scene.add.container(x, y);
        
        // Background
        const bg = this.scene.add.graphics();
        bg.fillStyle(UITheme.colors.darkSecondary, 0.5);
        bg.fillRoundedRect(0, 0, width, 6, 3);
        
        // Progress fill
        const fill = this.scene.add.graphics();
        fill.fillStyle(UITheme.colors.success, 0.8);
        fill.fillRoundedRect(0, 0, 0, 6, 3); // Start at 0 width
        
        container.add([bg, fill]);
        container.fill = fill;
        
        return { container, fill };
    }

    /**
     * Position popup relative to existing popups
     */
    positionPopup(popup, index) {
        const { width } = this.scene.cameras.main;
        const spacing = 140;
        
        popup.targetX = width - 200;
        popup.targetY = 100 + (index * spacing);
        
        // Initial position (off-screen)
        popup.setPosition(width + 400, popup.targetY);
    }

    /**
     * Animate popup entrance
     */
    animatePopupIn(popup, popupData) {
        // Slide in animation
        this.scene.tweens.add({
            targets: popup,
            x: popup.targetX,
            duration: this.animationSettings.slideIn.duration,
            ease: this.animationSettings.slideIn.ease,
            onComplete: () => {
                // Start celebration animations
                this.startCelebrationAnimations(popup, popupData);
            }
        });
    }

    /**
     * Start celebration animations
     */
    startCelebrationAnimations(popup, popupData) {
        // Icon bounce
        this.scene.tweens.add({
            targets: popup.iconText,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: this.animationSettings.celebration.duration / 2,
            ease: this.animationSettings.celebration.ease,
            yoyo: true
        });
        
        // Glow pulsing
        this.scene.tweens.add({
            targets: popup.innerGlow,
            alpha: 0.7,
            duration: this.animationSettings.glow.duration,
            ease: this.animationSettings.glow.ease,
            yoyo: true,
            repeat: -1
        });
        
        // Progress bar fill animation
        if (popup.progressBar) {
            this.scene.tweens.add({
                targets: popup.progressBar.fill,
                scaleX: 1,
                duration: 1500,
                ease: 'Power2.easeOut',
                delay: 200
            });
        }
        
        // Particle effects for higher rarities
        if (['epic', 'legendary'].includes(popupData.rarity)) {
            this.createParticleEffects(popup, popupData.rarity);
        }
        
        // Special celebration for legendary
        if (popupData.rarity === 'legendary') {
            this.createLegendaryCelebration(popup);
        }
    }

    /**
     * Create particle effects for rare achievements
     */
    createParticleEffects(popup, rarity) {
        const particleCount = rarity === 'legendary' ? 20 : 10;
        const colors = rarity === 'legendary' ? [0xffd700, 0xff6b35, 0xffffff] : [0x4a90e2, 0x6bb6ff];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.scene.add.graphics();
            particle.fillStyle(colors[Math.floor(Math.random() * colors.length)]);
            particle.fillCircle(0, 0, Math.random() * 3 + 1);
            
            particle.setPosition(
                popup.x + (Math.random() - 0.5) * 100,
                popup.y + (Math.random() - 0.5) * 60
            );
            particle.setDepth(15001);
            
            // Animate particle
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + (Math.random() - 0.5) * 200,
                y: particle.y - Math.random() * 100 - 50,
                alpha: 0,
                scaleX: 0,
                scaleY: 0,
                duration: 2000 + Math.random() * 1000,
                ease: 'Power2.easeOut',
                onComplete: () => particle.destroy()
            });
        }
    }

    /**
     * Create special celebration for legendary achievements
     */
    createLegendaryCelebration(popup) {
        // Screen flash
        const flash = this.scene.add.graphics();
        flash.fillStyle(0xffffff, 0.3);
        flash.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);
        flash.setDepth(14999);
        
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            ease: 'Power2.easeOut',
            onComplete: () => flash.destroy()
        });
        
        // Popup pulse
        this.scene.tweens.add({
            targets: popup,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 300,
            ease: 'Power2.easeOut',
            yoyo: true,
            repeat: 2
        });
    }

    /**
     * Schedule popup removal
     */
    schedulePopupRemoval(popup, duration) {
        this.scene.time.delayedCall(duration, () => {
            this.removePopup(popup);
        });
    }

    /**
     * Remove popup with exit animation
     */
    removePopup(popup) {
        // Slide out animation
        this.scene.tweens.add({
            targets: popup,
            x: this.scene.cameras.main.width + 400,
            alpha: 0,
            duration: this.animationSettings.slideOut.duration,
            ease: this.animationSettings.slideOut.ease,
            onComplete: () => {
                this.destroyPopup(popup);
            }
        });
    }

    /**
     * Destroy popup and clean up
     */
    destroyPopup(popup) {
        // Remove from active popups
        const index = this.activePopups.findIndex(p => p.popupId === popup.popupId);
        if (index !== -1) {
            this.activePopups.splice(index, 1);
        }
        
        // Destroy popup
        popup.destroy();
        
        // Reposition remaining popups
        this.repositionActivePopups();
        
        // Process queue
        this.processPopupQueue();
        
        if (import.meta.env.DEV) console.log('AchievementPopupSystem: Popup removed and cleaned up');
    }

    /**
     * Reposition active popups after removal
     */
    repositionActivePopups() {
        this.activePopups.forEach((popup, index) => {
            const newY = 100 + (index * 140);
            
            if (popup.y !== newY) {
                this.scene.tweens.add({
                    targets: popup,
                    y: newY,
                    duration: 300,
                    ease: 'Power2.easeOut'
                });
            }
        });
    }

    /**
     * Process queued popups
     */
    processPopupQueue() {
        if (this.popupQueue.length > 0 && this.activePopups.length < this.maxConcurrentPopups) {
            const nextPopup = this.popupQueue.shift();
            this.displayPopup(nextPopup);
        }
    }

    /**
     * Play achievement sound based on rarity
     */
    playAchievementSound(rarity) {
        if (this.gameState?.audioManager) {
            const soundMap = {
                common: 'achievement_common',
                uncommon: 'achievement_uncommon', 
                rare: 'achievement_rare',
                epic: 'achievement_epic',
                legendary: 'achievement_legendary'
            };
            
            const soundKey = soundMap[rarity] || 'achievement_common';
            this.gameState.audioManager.playSFX(soundKey);
        }
    }

    /**
     * Create achievement from RenJs dialog choice
     */
    createRenJsAchievement(achievementId, choiceData = {}) {
        const achievementTemplates = {
            first_conversation: {
                title: 'First Steps',
                description: 'Started your first conversation with a Bikini Assistant',
                icon: '💬',
                rarity: 'common',
                points: 10
            },
            mia_romance_1: {
                title: 'Ocean Friends',
                description: 'Became friends with Mia',
                icon: '🌊',
                rarity: 'uncommon',
                points: 25
            },
            sophie_romance_1: {
                title: 'Competitive Spirit',
                description: 'Became friends with Sophie',
                icon: '⚡',
                rarity: 'uncommon',
                points: 25
            },
            luna_romance_1: {
                title: 'Mysterious Bond',
                description: 'Became friends with Luna',
                icon: '🌙',
                rarity: 'uncommon',
                points: 25
            },
            all_friends: {
                title: 'Social Butterfly',
                description: 'Became friends with all Bikini Assistants',
                icon: '🦋',
                rarity: 'rare',
                points: 75
            },
            true_love: {
                title: 'True Love',
                description: 'Found true love on the ocean',
                icon: '💖',
                rarity: 'legendary',
                points: 200,
                celebrationType: 'legendary'
            }
        };
        
        const template = achievementTemplates[achievementId];
        if (template) {
            this.showAchievementPopup({
                ...template,
                ...choiceData // Allow override of template values
            });
        } else {
            console.warn(`AchievementPopupSystem: Unknown achievement template: ${achievementId}`);
        }
    }

    /**
     * Integration method for QuestManager
     */
    onQuestCompleted(questId, questData) {
        const questAchievements = {
            tutorial_fishing: 'first_catch',
            meet_npcs: 'first_conversation',
            equipment_upgrade: 'gear_collector'
        };
        
        const achievementId = questAchievements[questId];
        if (achievementId) {
            this.createRenJsAchievement(achievementId, {
                description: `Completed quest: ${questData.title || questId}`
            });
        }
    }

    /**
     * Integration method for romance meter changes
     */
    onRomanceMeterChanged(npcId, newLevel, oldLevel) {
        // Achievement for reaching friend level
        if (newLevel >= 2 && oldLevel < 2) {
            this.createRenJsAchievement(`${npcId}_romance_1`);
        }
        
        // Achievement for reaching lover level
        if (newLevel >= 5 && oldLevel < 5) {
            this.createRenJsAchievement('true_love', {
                description: `Found true love with ${npcId.charAt(0).toUpperCase() + npcId.slice(1)}`
            });
        }
    }

    /**
     * Batch show multiple achievements (for milestone unlocks)
     */
    showMultipleAchievements(achievements) {
        achievements.forEach((achievement, index) => {
            // Stagger the popups slightly
            this.scene.time.delayedCall(index * 500, () => {
                this.showAchievementPopup(achievement);
            });
        });
    }

    /**
     * Clear all active popups (for scene transitions)
     */
    clearAllPopups() {
        this.activePopups.forEach(popup => {
            popup.destroy();
        });
        this.activePopups = [];
        this.popupQueue = [];
        
        if (import.meta.env.DEV) console.log('AchievementPopupSystem: All popups cleared');
    }

    /**
     * Get achievement statistics
     */
    getAchievementStats() {
        return {
            totalShown: this.activePopups.length + this.popupQueue.length,
            active: this.activePopups.length,
            queued: this.popupQueue.length
        };
    }
} 