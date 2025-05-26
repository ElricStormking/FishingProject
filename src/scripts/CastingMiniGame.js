import Phaser from 'phaser';
import { gameDataLoader } from './DataLoader.js';

// Cast Minigame - Cast meter with Accurate Section targeting
export class CastingMiniGame {
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;
        this.isActive = false;
        this.castPower = 0;
        this.powerDirection = 1;
        this.accuracy = 0;
        
        // Cast meter properties
        this.meterValue = 0;
        this.meterDirection = 1;
        this.accurateSection = { start: 40, end: 60 }; // 20% accurate zone
        
        // Visual elements
        this.fishingRod = null;
        this.lure = null;
        this.fishingLine = null;
        this.hotspotArea = null;
        this.splashEffect = null;
        
        // UI Elements
        this.uiContainer = null;
        this.castMeter = null;
        this.meterBar = null;
        this.meterIndicator = null;
        this.accurateSectionGraphic = null;
        this.instructionText = null;
        this.meterTween = null;
        
        // Animation state
        this.isAnimating = false;
        this.castComplete = false;
        
        console.log('CastingMiniGame: Initialized with cast meter system');
    }

    start(playerStats, targetArea) {
        this.isActive = true;
        this.playerStats = playerStats;
        this.targetArea = targetArea;
        
        // Calculate accurate section size based on Cast Accuracy attribute
        this.calculateAccurateSection();
        
        // Create visual elements
        this.createVisualElements();
        
        // Create UI
        this.createUI();
        
        // Start cast meter animation
        this.startCastMeter();
        
        console.log('CastingMiniGame: Started with accurate section:', this.accurateSection);
        
        // Set up input handling
        this.scene.input.on('pointerdown', this.handleClick, this);
    }

    calculateAccurateSection() {
        // Base accurate section is 20% of the meter (20 units out of 100)
        const baseSize = 20;
        
        // Cast Accuracy attribute affects the size of the accurate section
        const castAccuracy = this.playerStats.castAccuracy || 5;
        const accuracyBonus = (castAccuracy - 5) * 2; // Each point above 5 adds 2% to section size
        
        // Apply equipment bonuses for cast distance and power
        const distanceBonus = (this.playerStats.castDistance || 5) - 5;
        const powerBonus = (this.playerStats.castPower || 5) - 5;
        
        const sectionSize = Math.min(50, baseSize + accuracyBonus + distanceBonus); // Max 50% of meter with equipment
        
        // Position the accurate section randomly on the meter
        const sectionStart = Phaser.Math.Between(10, 90 - sectionSize);
        
        this.accurateSection = {
            start: sectionStart,
            end: sectionStart + sectionSize
        };
        
        // Store equipment effects for use in casting
        this.equipmentEffects = {
            distanceMultiplier: 1 + (distanceBonus * 0.1), // 10% distance per point
            powerMultiplier: 1 + (powerBonus * 0.1), // 10% power per point
            accuracyBonus: accuracyBonus
        };
        
        console.log(`CastingMiniGame: Accurate section ${this.accurateSection.start}-${this.accurateSection.end}% (size: ${sectionSize}%)`);
        console.log('CastingMiniGame: Equipment effects:', this.equipmentEffects);
    }

    createVisualElements() {
        // Use the permanent hotspot from GameScene instead of creating a random one
        if (this.scene.hotspotPosition) {
            this.hotspotPosition = this.scene.hotspotPosition;
            console.log('CastingMiniGame: Using permanent hotspot at', this.hotspotPosition);
        } else {
            // Fallback: create temporary hotspot if none exists
            const waterArea = this.targetArea;
            const hotspotX = waterArea.x + waterArea.width * 0.3;
            const hotspotY = waterArea.y + waterArea.height * 0.5;
            this.hotspotPosition = { x: hotspotX, y: hotspotY, radius: 100 };
            console.log('CastingMiniGame: Created fallback hotspot at', this.hotspotPosition);
        }
        
        // Use existing fishing rod and lure from GameScene
        this.fishingRod = this.scene.fishingRod;
        this.fishingLine = this.scene.fishingLine;
        this.lure = this.scene.lure;
        this.rodTipPosition = this.scene.rodTipPosition;
        this.lurePosition = this.scene.lurePosition;
        
        // Store original positions for restoration
        this.originalLurePosition = { ...this.lurePosition };
        
        console.log('CastingMiniGame: Visual elements created, using existing rod and lure');
    }

    createUI() {
        // Create main UI container
        this.uiContainer = this.scene.add.container(0, 0);
        this.uiContainer.setDepth(1000);
        
        // Cast meter position and dimensions
        const meterX = this.scene.cameras.main.width / 2;
        const meterY = this.scene.cameras.main.height - 150;
        const meterWidth = 400;
        const meterHeight = 40;
        
        // Cast meter background
        this.castMeter = this.scene.add.graphics();
        this.castMeter.fillStyle(0x333333);
        this.castMeter.fillRoundedRect(meterX - meterWidth/2, meterY - meterHeight/2, meterWidth, meterHeight, 5);
        this.castMeter.lineStyle(3, 0xffffff);
        this.castMeter.strokeRoundedRect(meterX - meterWidth/2, meterY - meterHeight/2, meterWidth, meterHeight, 5);
        this.uiContainer.add(this.castMeter);
        
        // Accurate section (green zone)
        this.accurateSectionGraphic = this.scene.add.graphics();
        const sectionStartX = meterX - meterWidth/2 + (this.accurateSection.start / 100) * meterWidth;
        const sectionWidth = ((this.accurateSection.end - this.accurateSection.start) / 100) * meterWidth;
        this.accurateSectionGraphic.fillStyle(0x00ff00, 0.6);
        this.accurateSectionGraphic.fillRoundedRect(sectionStartX, meterY - meterHeight/2 + 3, sectionWidth, meterHeight - 6, 3);
        this.uiContainer.add(this.accurateSectionGraphic);
        
        // Meter indicator (moving element)
        this.meterIndicator = this.scene.add.graphics();
        this.meterIndicator.fillStyle(0xff0000);
        this.meterIndicator.fillRect(meterX - meterWidth/2 - 3, meterY - meterHeight/2 - 5, 6, meterHeight + 10);
        this.uiContainer.add(this.meterIndicator);
        
        // Instructions
        this.instructionText = this.scene.add.text(
            this.scene.cameras.main.width / 2, 
            meterY - 80, 
            'Click when the indicator is in the GREEN ZONE for accurate casting!\nGreen zone = Hotspot (rare fish) | Outside = Normal spot (common fish)', 
            {
                fontSize: '18px',
                fill: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 },
                align: 'center'
            }
        ).setOrigin(0.5, 0);
        this.uiContainer.add(this.instructionText);
        
        // Cast meter label
        const meterLabel = this.scene.add.text(meterX, meterY + meterHeight/2 + 20, 'CAST METER', {
            fontSize: '16px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5, 0);
        this.uiContainer.add(meterLabel);
        
        // Accurate section label
        const accurateLabel = this.scene.add.text(
            sectionStartX + sectionWidth/2, 
            meterY - meterHeight/2 - 25, 
            'ACCURATE ZONE', 
            {
                fontSize: '14px',
                fill: '#00ff00',
                align: 'center'
            }
        ).setOrigin(0.5, 0);
        this.uiContainer.add(accurateLabel);
    }

    startCastMeter() {
        // Meter indicator oscillates between 0-100
        this.meterTween = this.scene.tweens.add({
            targets: this,
            meterValue: 100,
            duration: 2000, // 2 seconds for full sweep
            yoyo: true,
            repeat: -1,
            ease: 'Linear', // Constant speed for predictable timing
            onUpdate: () => {
                this.updateMeterVisual();
            }
        });
    }

    updateMeterVisual() {
        if (!this.meterIndicator) return;
        
        const meterX = this.scene.cameras.main.width / 2;
        const meterWidth = 400;
        
        // Update indicator position based on meter value
        const indicatorX = meterX - meterWidth/2 + (this.meterValue / 100) * meterWidth;
        
        // Clear and redraw indicator
        this.meterIndicator.clear();
        
        // Change color based on position
        let color = 0xff0000; // Red (outside accurate section)
        if (this.meterValue >= this.accurateSection.start && this.meterValue <= this.accurateSection.end) {
            color = 0x00ff00; // Green (in accurate section)
        }
        
        this.meterIndicator.fillStyle(color);
        this.meterIndicator.fillRect(indicatorX - 3, this.scene.cameras.main.height - 150 - 25, 6, 50);
    }

    handleClick(pointer) {
        if (!this.isActive || this.isAnimating) return;

        // Stop meter animation
        if (this.meterTween) {
            this.meterTween.stop();
        }

        // Check if click was in accurate section
        const inAccurateSection = this.meterValue >= this.accurateSection.start && 
                                 this.meterValue <= this.accurateSection.end;
        
        // Calculate accuracy based on how close to center of accurate section
        let accuracy = 0;
        if (inAccurateSection) {
            const sectionCenter = (this.accurateSection.start + this.accurateSection.end) / 2;
            const sectionSize = this.accurateSection.end - this.accurateSection.start;
            const distanceFromCenter = Math.abs(this.meterValue - sectionCenter);
            accuracy = Math.max(50, 100 - (distanceFromCenter / sectionSize) * 50);
        } else {
            // Outside accurate section - low accuracy
            accuracy = Math.max(10, 30 - Math.abs(this.meterValue - 50) * 0.4);
        }

        console.log(`CastingMiniGame: Meter at ${this.meterValue.toFixed(1)}%, In accurate section: ${inAccurateSection}, Accuracy: ${accuracy.toFixed(1)}%`);
        
        // Start casting animation instead of immediately completing
        this.startCastingAnimation(inAccurateSection, accuracy, this.meterValue);
    }

    startCastingAnimation(hitAccurateSection, accuracy, meterValue) {
        this.isAnimating = true;
        
        // Hide the cast meter UI during animation
        if (this.uiContainer) {
            this.uiContainer.setVisible(false);
        }
        
        // Determine target position based on accuracy
        let targetX, targetY;
        if (hitAccurateSection) {
            // Land inside the hotspot - ensure it's clearly within the visible hotspot
            const hotspotRadius = this.hotspotPosition.radius || 100;
            
            // For accurate casts, always land within the inner 70% of the hotspot
            // This ensures the lure is clearly visible inside the hotspot area
            const maxTargetRadius = hotspotRadius * 0.7; // Stay within 70% of hotspot radius
            
            // Calculate variance based on accuracy (better accuracy = closer to center)
            const variance = maxTargetRadius * (100 - accuracy) / 100;
            
            // Generate random position within the variance circle
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * variance;
            
            targetX = this.hotspotPosition.x + Math.cos(angle) * distance;
            targetY = this.hotspotPosition.y + Math.sin(angle) * distance;
            
            // Verify the target is within hotspot bounds
            const distanceFromCenter = Math.sqrt((targetX - this.hotspotPosition.x) ** 2 + (targetY - this.hotspotPosition.y) ** 2);
            
            console.log(`CastingMiniGame: Targeting hotspot center (${this.hotspotPosition.x}, ${this.hotspotPosition.y})`);
            console.log(`CastingMiniGame: Target position (${targetX.toFixed(1)}, ${targetY.toFixed(1)}) - Distance from center: ${distanceFromCenter.toFixed(1)}px (hotspot radius: ${hotspotRadius}px)`);
        } else {
            // Land outside the hotspot
            const waterArea = this.targetArea;
            targetX = Phaser.Math.Between(waterArea.x + 50, waterArea.x + waterArea.width - 50);
            targetY = Phaser.Math.Between(waterArea.y + 50, waterArea.y + waterArea.height - 50);
            
            // Ensure it's not too close to hotspot (must be outside hotspot radius)
            const hotspotRadius = this.hotspotPosition.radius || 100;
            const distanceToHotspot = Phaser.Math.Distance.Between(targetX, targetY, this.hotspotPosition.x, this.hotspotPosition.y);
            if (distanceToHotspot < hotspotRadius + 30) { // 30px buffer outside hotspot
                // Move it further away from hotspot
                const angle = Phaser.Math.Angle.Between(this.hotspotPosition.x, this.hotspotPosition.y, targetX, targetY);
                targetX = this.hotspotPosition.x + Math.cos(angle) * (hotspotRadius + 50);
                targetY = this.hotspotPosition.y + Math.sin(angle) * (hotspotRadius + 50);
            }
            
            console.log(`CastingMiniGame: Targeting outside hotspot, distance: ${Phaser.Math.Distance.Between(targetX, targetY, this.hotspotPosition.x, this.hotspotPosition.y).toFixed(1)}px`);
        }
        
        // Step 1: Rod casting animation
        this.animateRodCast(() => {
            // Step 2: Create and animate lure
            this.animateLureThrow(targetX, targetY, hitAccurateSection, () => {
                // Step 3: Complete the minigame
                this.complete(hitAccurateSection, accuracy, meterValue);
            });
        });
    }

    animateRodCast(onComplete) {
        // The fishing rod should stay in place during casting
        // Only create a visual casting effect without moving the rod
        
        // Create a temporary rod tip flash effect to indicate casting
        const rodTipFlash = this.scene.add.graphics();
        rodTipFlash.setDepth(250);
        rodTipFlash.fillStyle(0xFFFFFF, 0.8);
        rodTipFlash.fillCircle(this.rodTipPosition.x, this.rodTipPosition.y, 8);
        
        // Animate the flash effect
        this.scene.tweens.add({
            targets: rodTipFlash,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 400,
            ease: 'Power2.easeOut',
            onComplete: () => {
                rodTipFlash.destroy();
                onComplete();
            }
        });
        
        console.log('CastingMiniGame: Rod casting animation (rod stays in place)');
    }

    animateLureThrow(targetX, targetY, hitAccurateSection, onComplete) {
        // Use existing lure instead of creating a new one
        if (!this.lure) {
            console.error('CastingMiniGame: No lure found in scene');
            onComplete();
            return;
        }
        
        // Stop any existing lure animations
        this.scene.tweens.killTweensOf(this.lure);
        
        // Start from rod tip position (not current lure position)
        const startX = this.rodTipPosition.x;
        const startY = this.rodTipPosition.y;
        
        // Move lure to rod tip first (instant)
        this.lure.setPosition(startX, startY);
        
        // Calculate arc trajectory
        const midX = (startX + targetX) / 2;
        const midY = Math.min(startY, targetY) - 120; // Higher arc for better visual
        
        // Create path for smooth arc
        const path = new Phaser.Curves.QuadraticBezier(
            new Phaser.Math.Vector2(startX, startY),
            new Phaser.Math.Vector2(midX, midY),
            new Phaser.Math.Vector2(targetX, targetY)
        );
        
        console.log(`CastingMiniGame: Throwing lure from rod tip (${startX}, ${startY}) to target (${targetX}, ${targetY})`);
        console.log(`CastingMiniGame: Arc path - Start: (${startX}, ${startY}), Mid: (${midX}, ${midY}), End: (${targetX}, ${targetY})`);
        
        // Create a simple progress object to animate instead of the lure directly
        const animationProgress = { t: 0 };
        
        // Animate the progress value from 0 to 1
        this.scene.tweens.add({
            targets: animationProgress,
            t: 1,
            duration: 1500,
            ease: 'Power2.easeOut',
            onUpdate: () => {
                // Get point along the path based on progress
                const point = path.getPoint(animationProgress.t);
                
                // Set lure position directly
                this.lure.setPosition(point.x, point.y);
                
                // Update fishing line to connect rod tip to current lure position
                if (this.scene.updateFishingLine) {
                    this.scene.updateFishingLine(point.x, point.y);
                }
                
                // Debug: Log position every 25% of animation
                if (Math.floor(animationProgress.t * 4) !== Math.floor((animationProgress.t - 0.01) * 4)) {
                    console.log(`CastingMiniGame: Animation ${(animationProgress.t * 100).toFixed(0)}% - Lure at (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`);
                }
            },
            onComplete: () => {
                // Ensure final position is exactly the target
                this.lure.setPosition(targetX, targetY);
                if (this.scene.updateFishingLine) {
                    this.scene.updateFishingLine(targetX, targetY);
                }
                
                console.log(`CastingMiniGame: Animation complete - Final lure position: (${this.lure.x}, ${this.lure.y})`);
                
                // Create splash effect at final position
                this.createSplashEffect(targetX, targetY, hitAccurateSection);
                
                // Add a temporary debug marker to show exact landing position
                if (hitAccurateSection) {
                    const debugMarker = this.scene.add.graphics();
                    debugMarker.setDepth(200);
                    debugMarker.lineStyle(3, 0xFF0000, 1); // Red circle
                    debugMarker.strokeCircle(targetX, targetY, 15);
                    debugMarker.fillStyle(0xFF0000, 0.5);
                    debugMarker.fillCircle(targetX, targetY, 5);
                    
                    // Remove debug marker after 3 seconds
                    this.scene.time.delayedCall(3000, () => {
                        if (debugMarker) debugMarker.destroy();
                    });
                }
                
                // Play splash sound (placeholder - would need actual audio)
                console.log(`CastingMiniGame: Splash! ${hitAccurateSection ? 'Hit hotspot!' : 'Missed hotspot'}`);
                console.log(`CastingMiniGame: Final lure position: (${targetX.toFixed(1)}, ${targetY.toFixed(1)})`);
                
                // Store final lure position
                this.finalLurePosition = { x: targetX, y: targetY };
                
                onComplete();
            }
        });
    }

    createSplashEffect(x, y, hitAccurateSection) {
        // Create splash effect
        this.splashEffect = this.scene.add.graphics();
        this.splashEffect.setDepth(160);
        
        // Splash color based on success
        const splashColor = hitAccurateSection ? 0x00FF00 : 0x87CEEB; // Green for hotspot, blue for normal
        
        // Create multiple splash circles
        for (let i = 0; i < 5; i++) {
            const radius = 10 + i * 8;
            const alpha = 0.8 - i * 0.15;
            
            this.splashEffect.fillStyle(splashColor, alpha);
            this.splashEffect.fillCircle(x, y, radius);
        }
        
        // Animate splash expanding and fading
        this.scene.tweens.add({
            targets: this.splashEffect,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 800,
            ease: 'Power2.easeOut',
            onComplete: () => {
                if (this.splashEffect) {
                    this.splashEffect.destroy();
                    this.splashEffect = null;
                }
            }
        });
        
        // Add some water droplet particles
        this.createWaterDroplets(x, y);
    }

    createWaterDroplets(x, y) {
        // Create small water droplets around splash
        for (let i = 0; i < 8; i++) {
            const droplet = this.scene.add.graphics();
            droplet.setDepth(170);
            droplet.fillStyle(0x87CEEB, 0.7);
            droplet.fillCircle(x, y, 2);
            
            // Random direction for droplets
            const angle = (i / 8) * Math.PI * 2;
            const distance = Phaser.Math.Between(20, 40);
            const targetX = x + Math.cos(angle) * distance;
            const targetY = y + Math.sin(angle) * distance - Phaser.Math.Between(10, 20);
            
            // Animate droplets
            this.scene.tweens.add({
                targets: droplet,
                x: targetX,
                y: targetY,
                alpha: 0,
                duration: 600,
                ease: 'Power2.easeOut',
                onComplete: () => {
                    droplet.destroy();
                }
            });
        }
    }

    complete(hitAccurateSection, accuracy, meterValue) {
        this.isActive = false;
        
        // IMMEDIATELY clean up input to prevent interference with next phase
        this.scene.input.off('pointerdown', this.handleClick, this);
        
        // Clean up tweens
        if (this.meterTween) {
            this.meterTween.stop();
        }
        
        // Clean up UI immediately to prevent interference
        if (this.uiContainer) {
            this.uiContainer.setVisible(false);
        }
        
        // Show result feedback
        this.showResult(hitAccurateSection, accuracy, meterValue);
        
        // Emit completion event IMMEDIATELY
        this.scene.events.emit('fishing:castComplete', {
            success: true, // Always successful, but quality varies
            accuracy: accuracy,
            hitAccurateSection: hitAccurateSection,
            meterValue: meterValue,
            castType: hitAccurateSection ? 'hotspot' : 'normal'
        });
    }

    showResult(hitAccurateSection, accuracy, meterValue) {
        // Create result display
        const resultText = hitAccurateSection ? 
            `EXCELLENT CAST!\nHit Accurate Zone!\nCasting to HOTSPOT (rare fish area)\nAccuracy: ${accuracy.toFixed(1)}%` :
            `NORMAL CAST\nMissed Accurate Zone\nCasting to normal spot (common fish)\nAccuracy: ${accuracy.toFixed(1)}%`;
            
        const resultDisplay = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2,
            resultText,
            {
                fontSize: '20px',
                fill: hitAccurateSection ? '#00ff00' : '#ffaa00',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 },
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(2000);
        
        // Animate result
        this.scene.tweens.add({
            targets: resultDisplay,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 300,
            yoyo: true,
            onComplete: () => {
                this.scene.time.delayedCall(1500, () => {
                    resultDisplay.destroy();
                    // Don't call destroy here - let PlayerController handle cleanup
                    // this.destroy();
                });
            }
        });
    }

    destroy() {
        this.isActive = false;
        this.isAnimating = false;
        
        // Clean up input
        this.scene.input.off('pointerdown', this.handleClick, this);
        
        // Clean up tweens
        if (this.meterTween) {
            this.meterTween.stop();
        }
        
        // Clean up UI
        if (this.uiContainer) {
            this.uiContainer.destroy();
        }
        
        // Restore lure to original position instead of destroying it
        if (this.lure && this.originalLurePosition) {
            // Stop any current animations
            this.scene.tweens.killTweensOf(this.lure);
            
            // Move lure back to original position
            this.lure.setPosition(this.originalLurePosition.x, this.originalLurePosition.y);
            
            // Restart the subtle swaying animation
            this.scene.tweens.add({
                targets: this.lure,
                x: this.originalLurePosition.x + 3,
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            // Update fishing line to original position
            if (this.scene.updateFishingLine) {
                this.scene.updateFishingLine(this.originalLurePosition.x, this.originalLurePosition.y);
            }
        }
        
        // Clean up only the elements we created
        if (this.splashEffect) {
            this.splashEffect.destroy();
            this.splashEffect = null;
        }
        
        // Don't destroy the fishing rod, line, lure, or permanent hotspot as they belong to GameScene
        this.fishingRod = null;
        this.fishingLine = null;
        this.lure = null;
        
        console.log('CastingMiniGame: Minigame elements destroyed, lure restored');
    }
} 