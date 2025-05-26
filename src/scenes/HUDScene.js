import Phaser from 'phaser';
import GameState from '../scripts/GameState.js';

export default class HUDScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HUDScene' });
    }

    create() {
        // Get game state instance
        this.gameState = GameState.getInstance();

        // HUD Background
        this.add.rectangle(0, 0, this.cameras.main.width, 80, 0x000000, 0.7)
            .setOrigin(0, 0);

        // HUD Text elements
        this.fishText = this.add.text(16, 16, `Fish Caught: ${this.gameState.player.fishCaught}`, {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });

        this.moneyText = this.add.text(16, 40, `Money: $${this.gameState.player.money}`, {
            fontSize: '18px',
            fill: '#00ff00',
            fontFamily: 'Arial'
        });

        this.expText = this.add.text(200, 16, `Experience: ${this.gameState.player.experience}`, {
            fontSize: '18px',
            fill: '#ffff00',
            fontFamily: 'Arial'
        });

        // Equipment info
        const equippedRod = this.gameState.getEquippedItem('rods');
        const equippedLure = this.gameState.getEquippedItem('lures');
        
        this.rodText = this.add.text(400, 16, `Rod: ${equippedRod ? equippedRod.name : 'None'}`, {
            fontSize: '16px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        });

        this.lureText = this.add.text(400, 40, `Lure: ${equippedLure ? equippedLure.name : 'None'}`, {
            fontSize: '16px',
            fill: '#cccccc',
            fontFamily: 'Arial'
        });

        // Time and weather
        this.timeText = this.add.text(this.cameras.main.width - 150, 16, `Time: ${this.gameState.world.timeOfDay}`, {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });

        this.weatherText = this.add.text(this.cameras.main.width - 150, 40, `Weather: ${this.gameState.world.weather}`, {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });

        // Listen for game state events
        this.gameState.on('fishCaught', this.onFishCaught.bind(this));
        this.gameState.on('moneyChanged', this.onMoneyChanged.bind(this));
        this.gameState.on('experienceGained', this.onExperienceGained.bind(this));
        this.gameState.on('levelUp', this.onLevelUp.bind(this));
        this.gameState.on('timeUpdated', this.onTimeUpdated.bind(this));
        
        // Listen for fishing events from PlayerController
        this.scene.get('GameScene').events.on('fishing:catchSuccess', this.onCatchSuccess.bind(this));
        this.scene.get('GameScene').events.on('fishing:catchFailure', this.onCatchFailure.bind(this));
        this.scene.get('GameScene').events.on('equipment:damaged', this.onEquipmentDamaged.bind(this));
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
        
        this.showNotification(message, 0x00FF00);
    }

    onMoneyChanged(data) {
        this.updateHUD();
    }

    onExperienceGained(data) {
        this.updateHUD();
    }

    onLevelUp(data) {
        this.showNotification(`Level Up! You are now level ${data.level}!`);
        this.updateHUD();
    }

    onTimeUpdated(data) {
        this.timeText.setText(`Time: ${data.timeOfDay}`);
    }

    updateHUD() {
        this.fishText.setText(`Fish Caught: ${this.gameState.player.fishCaught}`);
        this.moneyText.setText(`Money: $${this.gameState.player.money}`);
        this.expText.setText(`Experience: ${this.gameState.player.experience}`);
        
        // Update equipment display
        const equippedRod = this.gameState.getEquippedItem('rods');
        const equippedLure = this.gameState.getEquippedItem('lures');
        this.rodText.setText(`Rod: ${equippedRod ? equippedRod.name : 'None'}`);
        this.lureText.setText(`Lure: ${equippedLure ? equippedLure.name : 'None'}`);
    }

    onCatchSuccess(data) {
        this.updateHUD();
        this.showNotification(data.message, 0x00FF00);
    }

    onCatchFailure(data) {
        this.updateHUD();
        this.showNotification(data.message, 0xFF0000);
    }

    onEquipmentDamaged(data) {
        this.showNotification(`⚠️ ${data.item.name} damaged!\nDurability: ${data.item.durability}%`, 0xFFAA00);
    }

    showNotification(text, color = 0x00FF00) {
        const notification = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 100,
            text,
            {
                fontSize: '20px',
                fill: `#${color.toString(16).padStart(6, '0')}`,
                fontFamily: 'Arial',
                backgroundColor: '#000000',
                padding: { x: 16, y: 8 },
                align: 'center'
            }
        );
        notification.setOrigin(0.5);
        notification.setDepth(2000);

        // Fade out notification
        this.tweens.add({
            targets: notification,
            alpha: 0,
            y: notification.y - 50,
            duration: 3000,
            ease: 'Power2',
            onComplete: () => notification.destroy()
        });
    }

    showMilestoneNotification(milestone) {
        const notification = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 50,
            `🏆 ${milestone.message}\n💎 Rewards: +${milestone.rewards.coins || 0} coins, +${milestone.rewards.gems || 0} gems`,
            {
                fontSize: '22px',
                fill: '#FFD700',
                fontFamily: 'Arial',
                backgroundColor: '#000080',
                padding: { x: 20, y: 12 },
                align: 'center'
            }
        );
        notification.setOrigin(0.5);
        notification.setDepth(2100);

        // Special milestone animation
        this.tweens.add({
            targets: notification,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 300,
            yoyo: true,
            ease: 'Power2.easeInOut'
        });

        // Fade out after longer duration
        this.tweens.add({
            targets: notification,
            alpha: 0,
            y: notification.y - 80,
            duration: 5000,
            delay: 1000,
            ease: 'Power2',
            onComplete: () => notification.destroy()
        });
    }
} 