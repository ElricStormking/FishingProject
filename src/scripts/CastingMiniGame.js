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
        
        // Get gameState safely from scene
        this.gameState = scene.gameState || null;
        
        // Initialize audio manager safely
        this.audioManager = scene.audioManager || null;
        if (!this.audioManager) {
            console.warn('CastingMiniGame: No audio manager available from scene');
        }
        
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
        try {
            this.isActive = true;
            this.playerStats = playerStats;
            this.targetArea = targetArea;
            
            console.log('CastingMiniGame: Starting with playerStats:', playerStats);
            console.log('CastingMiniGame: Starting with targetArea:', targetArea);
            
            // Validate required parameters
            if (!this.scene) {
                throw new Error('Scene is required but not provided');
            }
            
            if (!this.scene.cameras || !this.scene.cameras.main) {
                throw new Error('Scene cameras not available');
            }
            
            if (!this.scene.add) {
                throw new Error('Scene add factory not available');
            }
            
            if (!playerStats) {
                throw new Error('Player stats are required but not provided');
            }
            
            if (!targetArea) {
                throw new Error('Target area is required but not provided');
            }
            
            // Calculate accurate section size based on Cast Accuracy attribute
            this.calculateAccurateSection();
            
            // Create visual elements
            this.createVisualElements();
            
            // Create UI
            this.createUI();
            
            // Start cast meter animation
            this.startCastMeter();
            
            console.log('CastingMiniGame: Started with accurate section:', this.accurateSection);
            
            // Set up input handling with error protection
            try {
                if (this.scene.input) {
                    this.scene.input.on('pointerdown', this.handleClick, this);
                    console.log('CastingMiniGame: Input listener attached successfully');
                } else {
                    throw new Error('Scene input manager not available');
                }
            } catch (inputError) {
                console.error('CastingMiniGame: Failed to attach input listener:', inputError);
                throw inputError;
            }
        } catch (error) {
            console.error('CastingMiniGame: Error during start:', error);
            this.isActive = false;
            throw error;
        }
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
        
        // Use existing fishing rod and lure from GameScene (with safety checks)
        this.fishingRod = this.scene.fishingRod || null;
        this.fishingLine = this.scene.fishingLine || null;
        this.lure = this.scene.lure || null;
        this.rodTipPosition = this.scene.rodTipPosition || { x: this.scene.cameras.main.width / 2, y: this.scene.cameras.main.height - 100 };
        this.lurePosition = this.scene.lurePosition || { x: this.rodTipPosition.x, y: this.rodTipPosition.y + 30 };
        
        // Store original positions for restoration
        this.originalLurePosition = { ...this.lurePosition };
        
        console.log('CastingMiniGame: Visual elements created, using existing rod and lure');
    }

    createUI() {
        try {
            // Create main UI container
            this.uiContainer = this.scene.add.container(0, 0);
            this.uiContainer.setDepth(1000);
            
            // Cast meter position and dimensions
            const meterX = this.scene.cameras.main.width / 2;
            const meterY = this.scene.cameras.main.height - 150;
            const meterWidth = 400;
            const meterHeight = 40;
            
            // Cast meter background with gradient effect
            this.castMeter = this.scene.add.graphics();
            
            // Background gradient (dark to light)
            this.castMeter.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x333333, 0x333333);
            this.castMeter.fillRoundedRect(meterX - meterWidth/2, meterY - meterHeight/2, meterWidth, meterHeight, 8);
            
            // Border with glow effect
            this.castMeter.lineStyle(3, 0x00aaff, 0.8);
            this.castMeter.strokeRoundedRect(meterX - meterWidth/2, meterY - meterHeight/2, meterWidth, meterHeight, 8);
            
            // Inner border for depth
            this.castMeter.lineStyle(1, 0xffffff, 0.3);
            this.castMeter.strokeRoundedRect(meterX - meterWidth/2 + 2, meterY - meterHeight/2 + 2, meterWidth - 4, meterHeight - 4, 6);
            
            this.uiContainer.add(this.castMeter);
            
            // Power zones background (subtle gradient zones)
            this.createPowerZones(meterX, meterY, meterWidth, meterHeight);
            
            // Accurate section (enhanced green zone with glow)
            this.accurateSectionGraphic = this.scene.add.graphics();
            const sectionStartX = meterX - meterWidth/2 + (this.accurateSection.start / 100) * meterWidth;
            const sectionWidth = ((this.accurateSection.end - this.accurateSection.start) / 100) * meterWidth;
            
            // Glowing green zone
            this.accurateSectionGraphic.fillGradientStyle(0x00ff44, 0x00ff44, 0x00aa22, 0x00aa22);
            this.accurateSectionGraphic.fillRoundedRect(sectionStartX + 2, meterY - meterHeight/2 + 4, sectionWidth - 4, meterHeight - 8, 4);
            
            // Glow effect for accurate section
            this.accurateSectionGraphic.lineStyle(2, 0x88ff88, 0.8);
            this.accurateSectionGraphic.strokeRoundedRect(sectionStartX + 1, meterY - meterHeight/2 + 3, sectionWidth - 2, meterHeight - 6, 4);
            
            this.uiContainer.add(this.accurateSectionGraphic);
            
            // Meter indicator (enhanced with glow and animation)
            this.meterIndicator = this.scene.add.graphics();
            this.updateMeterIndicator(meterX - meterWidth/2, meterY, meterHeight);
            this.uiContainer.add(this.meterIndicator);
            
            // Power level display
            this.powerDisplay = this.scene.add.text(
                meterX, 
                meterY + meterHeight/2 + 35, 
                'POWER: 0%', 
                {
                    fontSize: '16px',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 2,
                    align: 'center',
                    fontWeight: 'bold'
                }
            ).setOrigin(0.5, 0);
            this.uiContainer.add(this.powerDisplay);
            
            // Instructions with better styling
            this.instructionText = this.scene.add.text(
                this.scene.cameras.main.width / 2, 
                meterY - 100, 
                '🎯 Click when the indicator is in the GREEN ZONE for accurate casting!\n✨ Green zone = Hotspot (rare fish) | Outside = Normal spot (common fish)', 
                {
                    fontSize: '18px',
                    fill: '#ffffff',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: { x: 15, y: 10 },
                    align: 'center',
                    lineSpacing: 5
                }
            ).setOrigin(0.5, 0);
            this.uiContainer.add(this.instructionText);
            
            // Cast meter label with icon
            const meterLabel = this.scene.add.text(meterX, meterY + meterHeight/2 + 55, '🎣 CAST POWER METER', {
                fontSize: '14px',
                fill: '#00aaff',
                align: 'center',
                fontWeight: 'bold'
            }).setOrigin(0.5, 0);
            this.uiContainer.add(meterLabel);
            
            // Accurate section label with animation
            this.accurateLabel = this.scene.add.text(
                sectionStartX + sectionWidth/2, 
                meterY - meterHeight/2 - 30, 
                '⭐ PERFECT ZONE ⭐', 
                {
                    fontSize: '14px',
                    fill: '#00ff88',
                    stroke: '#004422',
                    strokeThickness: 2,
                    align: 'center',
                    fontWeight: 'bold'
                }
            ).setOrigin(0.5, 0);
            this.uiContainer.add(this.accurateLabel);
            
            // Animate the accurate zone label
            if (this.scene.tweens) {
                this.scene.tweens.add({
                    targets: this.accurateLabel,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 800,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
            
            // Add trajectory preview line (initially hidden)
            this.trajectoryPreview = this.scene.add.graphics();
            this.trajectoryPreview.setDepth(50);
            this.uiContainer.add(this.trajectoryPreview);
            
            console.log('CastingMiniGame: UI created successfully');
        } catch (error) {
            console.error('CastingMiniGame: Error creating UI:', error);
            throw error;
        }
    }

    createPowerZones(meterX, meterY, meterWidth, meterHeight) {
        // Create subtle power zone indicators
        const zones = [
            { start: 0, end: 25, color: 0xff4444, alpha: 0.2, label: 'WEAK' },
            { start: 25, end: 75, color: 0xffaa44, alpha: 0.2, label: 'GOOD' },
            { start: 75, end: 100, color: 0xff4444, alpha: 0.2, label: 'TOO STRONG' }
        ];
        
        zones.forEach(zone => {
            const zoneStartX = meterX - meterWidth/2 + (zone.start / 100) * meterWidth;
            const zoneWidth = ((zone.end - zone.start) / 100) * meterWidth;
            
            const zoneGraphic = this.scene.add.graphics();
            zoneGraphic.fillStyle(zone.color, zone.alpha);
            zoneGraphic.fillRoundedRect(zoneStartX + 2, meterY - meterHeight/2 + 4, zoneWidth - 4, meterHeight - 8, 3);
            this.uiContainer.add(zoneGraphic);
        });
    }

    updateMeterIndicator(meterStartX, meterY, meterHeight) {
        try {
            if (!this.meterIndicator) {
                console.warn('CastingMiniGame: Meter indicator not available');
                return;
            }
            
            this.meterIndicator.clear();
            
            // Calculate indicator position
            const indicatorX = meterStartX + (this.meterValue / 100) * 400;
            
            // Indicator color based on position
            let indicatorColor = 0xff0000; // Default red
            if (this.meterValue >= this.accurateSection.start && this.meterValue <= this.accurateSection.end) {
                indicatorColor = 0x00ff00; // Green in accurate zone
            } else if (this.meterValue >= 25 && this.meterValue <= 75) {
                indicatorColor = 0xffaa00; // Orange in good zone
            }
            
            // Main indicator body with glow
            this.meterIndicator.fillStyle(indicatorColor);
            this.meterIndicator.fillRoundedRect(indicatorX - 4, meterY - meterHeight/2 - 8, 8, meterHeight + 16, 4);
            
            // Indicator glow effect
            this.meterIndicator.lineStyle(2, indicatorColor, 0.6);
            this.meterIndicator.strokeRoundedRect(indicatorX - 6, meterY - meterHeight/2 - 10, 12, meterHeight + 20, 6);
            
            // Indicator tip (arrow pointing down)
            this.meterIndicator.fillTriangle(
                indicatorX, meterY + meterHeight/2 + 8,
                indicatorX - 6, meterY + meterHeight/2 + 2,
                indicatorX + 6, meterY + meterHeight/2 + 2
            );
            
            // Update power display
            if (this.powerDisplay) {
                try {
                    const powerPercent = Math.round(this.meterValue);
                    let powerText = `POWER: ${powerPercent}%`;
                    
                    if (this.meterValue >= this.accurateSection.start && this.meterValue <= this.accurateSection.end) {
                        powerText += ' ⭐ PERFECT!';
                        this.powerDisplay.setFill('#00ff88');
                    } else if (this.meterValue >= 25 && this.meterValue <= 75) {
                        powerText += ' ✓ Good';
                        this.powerDisplay.setFill('#ffaa00');
                    } else {
                        this.powerDisplay.setFill('#ff4444');
                    }
                    
                    this.powerDisplay.setText(powerText);
                } catch (textError) {
                    console.warn('CastingMiniGame: Error updating power display text:', textError);
                }
            }
            
            // Update trajectory preview
            this.updateTrajectoryPreview();
        } catch (error) {
            console.error('CastingMiniGame: Error updating meter indicator:', error);
        }
    }

    updateTrajectoryPreview() {
        try {
            if (!this.trajectoryPreview) return;
            
            this.trajectoryPreview.clear();
            
            // Calculate trajectory based on current power
            const power = this.meterValue / 100;
            const rodTip = this.rodTipPosition || { x: this.scene.cameras.main.width / 2, y: this.scene.cameras.main.height - 100 };
            
            // Calculate target position based on power and hotspot
            const maxDistance = 300;
            const distance = power * maxDistance;
            const targetX = rodTip.x + distance * 0.7; // Slight angle
            const targetY = rodTip.y - 150 - (power * 100); // Arc height based on power
            
            // Draw dotted trajectory line
            const steps = 20;
            this.trajectoryPreview.lineStyle(3, 0xffffff, 0.6);
            
            for (let i = 0; i < steps; i++) {
                const t = i / steps;
                const x = Phaser.Math.Interpolation.Linear([rodTip.x, targetX], t);
                const y = Phaser.Math.Interpolation.Quadratic([rodTip.y, targetY, targetY + 150], t);
                
                if (i % 3 === 0) { // Dotted line effect
                    this.trajectoryPreview.fillStyle(0xffffff, 0.6);
                    this.trajectoryPreview.fillCircle(x, y, 2);
                }
            }
            
            // Show target landing area
            this.trajectoryPreview.lineStyle(2, 0x00aaff, 0.5);
            this.trajectoryPreview.strokeCircle(targetX, targetY + 150, 30);
        } catch (error) {
            console.warn('CastingMiniGame: Error updating trajectory preview:', error);
        }
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
        
        // Update the enhanced meter indicator
        const meterX = this.scene.cameras.main.width / 2;
        const meterY = this.scene.cameras.main.height - 150;
        const meterStartX = meterX - 200; // Half of meterWidth (400)
        const meterHeight = 40;
        
        this.updateMeterIndicator(meterStartX, meterY, meterHeight);
    }

    handleClick(pointer) {
        try {
            if (!this.isActive || this.isAnimating) {
                console.log('CastingMiniGame: Click ignored - isActive:', this.isActive, 'isAnimating:', this.isAnimating);
                return;
            }

            console.log('CastingMiniGame: Processing click, meterValue:', this.meterValue);

            // Stop meter animation
            if (this.meterTween) {
                this.meterTween.stop();
            }

            // Check if click was in accurate section
            const inAccurateSection = this.meterValue >= this.accurateSection.start && 
                                     this.meterValue <= this.accurateSection.end;
            
            // Play audio feedback based on accuracy
            if (inAccurateSection) {
                this.audioManager?.playSFX('cast_perfect');
            } else {
                this.audioManager?.playSFX('cast_normal');
            }
            
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
        } catch (error) {
            console.error('CastingMiniGame: Error in handleClick:', error);
            // Try to clean up and emit failure event
            this.isActive = false;
            this.scene.events.emit('fishing:castComplete', {
                success: false,
                error: error.message
            });
        }
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
                // Step 3: Process successful cast and select fish
                this.processSuccessfulCast(hitAccurateSection);
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
        try {
            // Use existing lure instead of creating a new one
            if (!this.lure) {
                console.error('CastingMiniGame: No lure found in scene');
                if (onComplete) onComplete();
                return;
            }
            
            // Stop any existing lure animations
            if (this.scene.tweens) {
                this.scene.tweens.killTweensOf(this.lure);
            }
            
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
            if (this.scene.tweens) {
                this.scene.tweens.add({
                    targets: animationProgress,
                    t: 1,
                    duration: 1500,
                    ease: 'Power2.easeOut',
                    onUpdate: () => {
                        try {
                            // Get point along the path based on progress
                            const point = path.getPoint(animationProgress.t);
                            
                            // Set lure position directly
                            if (this.lure && this.lure.setPosition) {
                                this.lure.setPosition(point.x, point.y);
                            }
                            
                            // Update fishing line to connect rod tip to current lure position
                            if (this.scene.updateFishingLine) {
                                this.scene.updateFishingLine(point.x, point.y);
                            }
                            
                            // Debug: Log position every 25% of animation
                            if (Math.floor(animationProgress.t * 4) !== Math.floor((animationProgress.t - 0.01) * 4)) {
                                console.log(`CastingMiniGame: Animation ${(animationProgress.t * 100).toFixed(0)}% - Lure at (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`);
                            }
                        } catch (updateError) {
                            console.error('CastingMiniGame: Error during animation update:', updateError);
                        }
                    },
                    onComplete: () => {
                        try {
                            // Ensure final position is exactly the target
                            if (this.lure && this.lure.setPosition) {
                                this.lure.setPosition(targetX, targetY);
                            }
                            if (this.scene.updateFishingLine) {
                                this.scene.updateFishingLine(targetX, targetY);
                            }
                            
                            console.log(`CastingMiniGame: Animation complete - Final lure position: (${this.lure ? this.lure.x : 'N/A'}, ${this.lure ? this.lure.y : 'N/A'})`);
                            
                            // Create splash effect at final position
                            this.createSplashEffect(targetX, targetY, hitAccurateSection);
                            
                            // Debug marker removed to prevent screen blinking
                            // The red circle debug marker was causing visual interference
                            
                            // Play splash sound (placeholder - would need actual audio)
                            console.log(`CastingMiniGame: Splash! ${hitAccurateSection ? 'Hit hotspot!' : 'Missed hotspot'}`);
                            console.log(`CastingMiniGame: Final lure position: (${targetX.toFixed(1)}, ${targetY.toFixed(1)})`);
                            
                            // Store final lure position
                            this.finalLurePosition = { x: targetX, y: targetY };
                            
                            if (onComplete) onComplete();
                        } catch (completeError) {
                            console.error('CastingMiniGame: Error during animation completion:', completeError);
                            if (onComplete) onComplete();
                        }
                    }
                });
            } else {
                console.warn('CastingMiniGame: Tweens not available, skipping animation');
                if (onComplete) onComplete();
            }
        } catch (error) {
            console.error('CastingMiniGame: Error in animateLureThrow:', error);
            if (onComplete) onComplete();
        }
    }

    createSplashEffect(x, y, hitAccurateSection) {
        // Play splash audio based on accuracy
        if (hitAccurateSection) {
            this.audioManager?.playSFX('splash_perfect');
        } else {
            this.audioManager?.playSFX('splash');
        }
        
        // Create enhanced splash effect with particles
        this.splashEffect = this.scene.add.graphics();
        
        // Main splash circle - size and color based on accuracy
        const splashColor = hitAccurateSection ? 0x00ff88 : 0x4488ff;
        const splashSize = hitAccurateSection ? 80 : 60;
        
        // Animated splash circle
        this.splashEffect.fillStyle(splashColor, 0.8);
        this.splashEffect.fillCircle(x, y, 10);
        
        // Animate splash expansion
        this.scene.tweens.add({
            targets: this.splashEffect,
            scaleX: splashSize / 10,
            scaleY: splashSize / 10,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                if (this.splashEffect) {
                    this.splashEffect.destroy();
                    this.splashEffect = null;
                }
            }
        });
        
        // Create water droplet particles
        this.createEnhancedWaterDroplets(x, y, hitAccurateSection);
        
        // Create ripple effects
        this.createRippleEffects(x, y, hitAccurateSection);
        
        // Screen shake removed to prevent visual problems
        // if (hitAccurateSection) {
        //     this.createScreenShake(1, 100);
        // }
        
        // Create accuracy feedback text
        this.showAccuracyFeedback(x, y, hitAccurateSection);
    }

    createEnhancedWaterDroplets(x, y, hitAccurateSection) {
        const dropletCount = hitAccurateSection ? 12 : 8; // Reduced from 20 to 12
        const dropletColor = hitAccurateSection ? 0x00ff88 : 0x4488ff;
        
        for (let i = 0; i < dropletCount; i++) {
            const droplet = this.scene.add.graphics();
            droplet.fillStyle(dropletColor, 0.8);
            droplet.fillCircle(0, 0, Phaser.Math.Between(2, 5));
            droplet.setPosition(x, y);
            
            // Random direction and distance
            const angle = Phaser.Math.Between(0, 360);
            const distance = Phaser.Math.Between(30, hitAccurateSection ? 100 : 70);
            const targetX = x + Math.cos(Phaser.Math.DegToRad(angle)) * distance;
            const targetY = y + Math.sin(Phaser.Math.DegToRad(angle)) * distance;
            
            // Animate droplet
            this.scene.tweens.add({
                targets: droplet,
                x: targetX,
                y: targetY,
                scaleX: 0.1,
                scaleY: 0.1,
                alpha: 0,
                duration: Phaser.Math.Between(400, 800),
                ease: 'Power2',
                onComplete: () => droplet.destroy()
            });
        }
    }

    createRippleEffects(x, y, hitAccurateSection) {
        const rippleCount = hitAccurateSection ? 3 : 2; // Reduced from 4 to 3
        
        for (let i = 0; i < rippleCount; i++) {
            const ripple = this.scene.add.graphics();
            ripple.lineStyle(3, hitAccurateSection ? 0x00ff88 : 0x4488ff, 0.6);
            ripple.strokeCircle(x, y, 5);
            
            // Animate ripple expansion
            this.scene.tweens.add({
                targets: ripple,
                scaleX: 15 + (i * 5),
                scaleY: 15 + (i * 5),
                alpha: 0,
                duration: 1000 + (i * 200),
                delay: i * 150,
                ease: 'Power2',
                onComplete: () => ripple.destroy()
            });
        }
    }

    // createScreenShake method removed to prevent visual problems
    // createScreenShake(intensity, duration) {
    //     // Camera shake effect for perfect casts - very gentle to prevent blinking
    //     try {
    //         if (this.scene && this.scene.cameras && this.scene.cameras.main) {
    //             // Only shake if not already shaking to prevent conflicts
    //             if (!this.scene.cameras.main.isShaking) {
    //                 this.scene.cameras.main.shake(duration, intensity * 0.5); // Further reduced intensity
    //             }
    //         }
    //     } catch (error) {
    //         console.warn('CastingMiniGame: Error creating screen shake:', error);
    //     }
    // }

    showAccuracyFeedback(x, y, hitAccurateSection) {
        const feedbackText = hitAccurateSection ? 'PERFECT CAST!' : 'Good Cast';
        const textColor = hitAccurateSection ? '#00ff88' : '#4488ff';
        const fontSize = hitAccurateSection ? '24px' : '18px';
        
        const feedback = this.scene.add.text(x, y - 50, feedbackText, {
            fontSize: fontSize,
            fill: textColor,
            stroke: '#000000',
            strokeThickness: 3,
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        // Animate feedback text
        this.scene.tweens.add({
            targets: feedback,
            y: y - 100,
            alpha: 0,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => feedback.destroy()
        });
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
                backgroundColor: 'rgba(0, 0, 0, 0.8)', // More transparent background
                padding: { x: 20, y: 10 },
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(2000);
        
        // Gentler animate result to prevent blinking
        this.scene.tweens.add({
            targets: resultDisplay,
            scaleX: 1.05, // Reduced from 1.1 to 1.05
            scaleY: 1.05, // Reduced from 1.1 to 1.05
            duration: 500, // Increased duration for smoother animation
            yoyo: true,
            ease: 'Sine.easeInOut', // Smoother easing
            onComplete: () => {
                this.scene.time.delayedCall(1500, () => {
                    // Fade out instead of instant destroy
                    this.scene.tweens.add({
                        targets: resultDisplay,
                        alpha: 0,
                        duration: 300,
                        ease: 'Power2.easeOut',
                        onComplete: () => {
                            resultDisplay.destroy();
                        }
                    });
                });
            }
        });
    }

    destroy() {
        try {
            this.isActive = false;
            this.isAnimating = false;
            
            // Clean up input
            try {
                if (this.scene && this.scene.input) {
                    this.scene.input.off('pointerdown', this.handleClick, this);
                }
            } catch (inputError) {
                console.warn('CastingMiniGame: Error cleaning up input:', inputError);
            }
            
            // Clean up tweens
            try {
                if (this.meterTween) {
                    this.meterTween.stop();
                    this.meterTween = null;
                }
            } catch (tweenError) {
                console.warn('CastingMiniGame: Error stopping meter tween:', tweenError);
            }
            
            // Clean up UI
            try {
                if (this.uiContainer) {
                    this.uiContainer.destroy();
                    this.uiContainer = null;
                }
            } catch (uiError) {
                console.warn('CastingMiniGame: Error destroying UI container:', uiError);
            }
            
            // Restore lure to original position instead of destroying it
            try {
                if (this.lure && this.originalLurePosition) {
                    // Stop any current animations
                    if (this.scene && this.scene.tweens) {
                        this.scene.tweens.killTweensOf(this.lure);
                    }
                    
                    // Move lure back to original position
                    if (this.lure.setPosition) {
                        this.lure.setPosition(this.originalLurePosition.x, this.originalLurePosition.y);
                    }
                    
                    // Restart the subtle swaying animation
                    if (this.scene && this.scene.tweens) {
                        this.scene.tweens.add({
                            targets: this.lure,
                            x: this.originalLurePosition.x + 3,
                            duration: 1500,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut'
                        });
                    }
                    
                    // Update fishing line to original position
                    if (this.scene && this.scene.updateFishingLine) {
                        this.scene.updateFishingLine(this.originalLurePosition.x, this.originalLurePosition.y);
                    }
                }
            } catch (lureError) {
                console.warn('CastingMiniGame: Error restoring lure position:', lureError);
            }
            
            // Clean up only the elements we created
            try {
                if (this.splashEffect) {
                    this.splashEffect.destroy();
                    this.splashEffect = null;
                }
            } catch (splashError) {
                console.warn('CastingMiniGame: Error destroying splash effect:', splashError);
            }
            
            // Don't destroy the fishing rod, line, lure, or permanent hotspot as they belong to GameScene
            this.fishingRod = null;
            this.fishingLine = null;
            this.lure = null;
            
            console.log('CastingMiniGame: Minigame elements destroyed, lure restored');
        } catch (error) {
            console.error('CastingMiniGame: Error during destroy:', error);
        }
    }

    processSuccessfulCast(isAccurate) {
        console.log('CastingMiniGame: Successful cast! Accurate:', isAccurate);
        
        try {
            // Get gameState safely from scene
            const gameState = this.scene.gameState;
            
            // Play cast success sound with null checking
            if (gameState && gameState.getAudioManager) {
                const audioManager = gameState.getAudioManager(this.scene);
                audioManager?.playSFX('cast_success');
            } else {
                console.warn('CastingMiniGame: Audio manager not available');
            }
            
            // Use final lure position instead of undefined targetZone
            const lureX = this.finalLurePosition?.x || this.lurePosition?.x || this.scene.cameras.main.width / 2;
            const lureY = this.finalLurePosition?.y || this.lurePosition?.y || this.scene.cameras.main.height / 2;
            
            // Add visual feedback for successful cast
            this.createCastSuccessFeedback(isAccurate, lureX, lureY);
            
            // Determine fish based on current conditions
            let selectedFish = null;
            
            if (gameState && gameState.fishDatabase) {
                // Get current conditions with proper null checking
                const timeManager = gameState.timeManager;
                const weatherManager = gameState.weatherManager;
                const currentLocation = gameState.world?.currentLocation || 'Starting Port';
                const currentTime = timeManager?.getCurrentPeriod()?.name || 'morning';
                
                // Fix weatherManager method call with proper fallback
                let currentWeather = 'sunny'; // Default fallback
                if (weatherManager) {
                    if (typeof weatherManager.getCurrentWeather === 'function') {
                        currentWeather = weatherManager.getCurrentWeather()?.name || 'sunny';
                    } else if (weatherManager.currentWeather) {
                        currentWeather = weatherManager.currentWeather.name || 'sunny';
                    }
                }
                
                const playerLevel = gameState.player?.level || 1;
                
                // Get available fish for current conditions
                const availableFish = gameState.fishDatabase.getAvailableFish(
                    currentLocation,
                    currentTime.toLowerCase(),
                    currentWeather.toLowerCase(),
                    playerLevel
                );
                
                console.log('CastingMiniGame: Available fish:', availableFish.length, 'for conditions:', {
                    location: currentLocation,
                    time: currentTime,
                    weather: currentWeather,
                    level: playerLevel
                });
                
                // Apply hotspot bonus if accurate cast
                const rareFishBonus = isAccurate ? 25 : 0;
                
                // Select a fish from available fish
                selectedFish = gameState.fishDatabase.selectFishByWeight(availableFish, rareFishBonus);
                
                if (selectedFish) {
                    console.log('CastingMiniGame: Selected fish:', selectedFish.name, 'rarity:', selectedFish.rarity);
                }
            }
            
            // Fallback to simple fish selection if no database or no fish available
            if (!selectedFish) {
                const fishTypes = isAccurate ? 
                    ['bass', 'trout', 'pike'] :  // Better fish for accurate cast
                    ['minnow', 'perch'];          // Common fish for normal cast
                
                selectedFish = {
                    id: fishTypes[Math.floor(Math.random() * fishTypes.length)],
                    name: fishTypes[Math.floor(Math.random() * fishTypes.length)],
                    rarity: isAccurate ? 3 : 1,
                    size: isAccurate ? 'medium' : 'small'
                };
                
                console.log('CastingMiniGame: Using fallback fish:', selectedFish);
            }
            
            // Store the selected fish for the luring minigame
            this.selectedFish = selectedFish;
            
            // Complete the casting minigame properly
            const accuracy = isAccurate ? 85 : 50; // Simplified accuracy calculation
            const meterValue = this.meterValue || 50;
            
            // Short delay then complete
            this.scene.time.delayedCall(1000, () => {
                this.complete(isAccurate, accuracy, meterValue);
            });
            
        } catch (error) {
            console.error('CastingMiniGame: Error in processSuccessfulCast:', error);
            // Fallback completion to prevent getting stuck
            this.complete(isAccurate, 50, this.meterValue || 50);
        }
    }

    createCastSuccessFeedback(isAccurate, lureX, lureY) {
        // Create splash effect at landing point
        const splash = this.scene.add.graphics();
        splash.fillStyle(0xffffff, 0.8);
        splash.fillCircle(lureX, lureY, 20);
        
        // Animate splash
        this.scene.tweens.add({
            targets: splash,
            alpha: 0,
            scaleX: 3,
            scaleY: 3,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => splash.destroy()
        });
        
        // Add ripple effects
        for (let i = 0; i < 3; i++) {
            this.scene.time.delayedCall(i * 200, () => {
                const ripple = this.scene.add.graphics();
                ripple.lineStyle(2, 0x6bb6ff, 0.6);
                ripple.strokeCircle(lureX, lureY, 10);
                
                this.scene.tweens.add({
                    targets: ripple,
                    alpha: 0,
                    scaleX: 5,
                    scaleY: 5,
                    duration: 1500,
                    ease: 'Power2',
                    onComplete: () => ripple.destroy()
                });
            });
        }
        
        // Show accuracy feedback text
        const feedbackText = isAccurate ? 'PERFECT CAST!' : 'Good Cast';
        const feedbackColor = isAccurate ? '#FFD700' : '#FFFFFF';
        
        const text = this.scene.add.text(
            lureX,
            lureY - 50,
            feedbackText,
            {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: feedbackColor,
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: text,
            y: text.y - 30,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }
} 