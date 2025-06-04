import { LOCATION_DATA, getUnlockedLocations, getLocationById } from '../data/LocationData.js';

export class MapSelectionUI {
    constructor(scene, locationManager, gameState) {
        this.scene = scene;
        this.locationManager = locationManager;
        this.gameState = gameState;
        this.isVisible = false;
        this.selectedLocation = null;
        
        // UI containers
        this.container = null;
        this.overlay = null;
        this.panel = null;
        this.locationList = [];
        this.selectedLocationDisplay = null;
        
        console.log('MapSelectionUI: Initialized with location data');
    }

    show() {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.createMapInterface();
        console.log('MapSelectionUI: Interface opened');
    }

    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        console.log('MapSelectionUI: Interface closed');
    }

    createMapInterface() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Create main container
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(3000);
        
        // Semi-transparent overlay
        this.overlay = this.scene.add.graphics();
        this.overlay.fillStyle(0x000000, 0.8);
        this.overlay.fillRect(0, 0, width, height);
        this.overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
        this.overlay.on('pointerdown', () => {
            try {
                this.hide();
            } catch (error) {
                console.error('MapSelectionUI: Error in overlay click:', error);
            }
        });
        this.container.add(this.overlay);
        
        // Main panel
        const panelWidth = 1000;
        const panelHeight = 700;
        const panelX = (width - panelWidth) / 2;
        const panelY = (height - panelHeight) / 2;
        
        this.panel = this.scene.add.graphics();
        this.panel.fillStyle(0x1a1a2e, 0.95);
        this.panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);
        this.panel.lineStyle(4, 0x00aaff);
        this.panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 20);
        this.container.add(this.panel);
        
        // Title
        const title = this.scene.add.text(width / 2, panelY + 40, '🗺️ SELECT FISHING LOCATION', {
            fontSize: '32px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#00aaff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.container.add(title);
        
        // Close button
        const closeButton = this.createButton(width / 2, panelY + panelHeight - 50, 'CLOSE', () => this.hide(), 0xaa0000);
        this.container.add(closeButton.button);
        this.container.add(closeButton.text);
        
        // Create location list
        this.createLocationList(panelX, panelY, panelWidth, panelHeight);
        
        // Create location details display
        this.createLocationDetails(panelX, panelY, panelWidth, panelHeight);
    }

    createLocationList(panelX, panelY, panelWidth, panelHeight) {
        const listX = panelX + 30;
        const listY = panelY + 100;
        const listWidth = panelWidth * 0.45;
        const listHeight = panelHeight - 200;
        
        // List background
        const listBg = this.scene.add.graphics();
        listBg.fillStyle(0x2c3e50, 0.8);
        listBg.fillRoundedRect(listX, listY, listWidth, listHeight, 10);
        listBg.lineStyle(2, 0x34495e);
        listBg.strokeRoundedRect(listX, listY, listWidth, listHeight, 10);
        this.container.add(listBg);
        
        // List title
        const listTitle = this.scene.add.text(listX + listWidth / 2, listY + 20, 'Available Locations', {
            fontSize: '20px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.container.add(listTitle);
        
        // Get unlocked locations
        const playerLevel = this.gameState.player.level || 1;
        const achievements = this.gameState.player.achievements || [];
        const unlockedLocations = getUnlockedLocations(playerLevel, achievements);
        
        // Create location buttons
        let yOffset = 60;
        unlockedLocations.forEach((location, index) => {
            const locationButton = this.createLocationButton(
                listX + 10, 
                listY + yOffset, 
                listWidth - 20, 
                location
            );
            this.container.add(locationButton.bg);
            // Add each text element individually since text is an array
            locationButton.textElements.forEach(textElement => {
                this.container.add(textElement);
            });
            this.container.add(locationButton.hitArea);
            
            this.locationList.push({
                location: location,
                button: locationButton
            });
            
            yOffset += 80;
        });
        
        // Show locked locations (grayed out)
        const allLocations = Object.values(LOCATION_DATA);
        const lockedLocations = allLocations.filter(loc => !unlockedLocations.includes(loc));
        
        lockedLocations.forEach((location, index) => {
            const lockedButton = this.createLockedLocationButton(
                listX + 10, 
                listY + yOffset, 
                listWidth - 20, 
                location
            );
            this.container.add(lockedButton.bg);
            // Add each text element individually since text is an array
            lockedButton.textElements.forEach(textElement => {
                this.container.add(textElement);
            });
            this.container.add(lockedButton.lockIcon);
            
            yOffset += 80;
        });
    }

    createLocationButton(x, y, width, location) {
        const height = 60;
        
        // Background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x3498db, 0.8);
        bg.fillRoundedRect(x, y, width, height, 8);
        bg.lineStyle(2, 0x2980b9);
        bg.strokeRoundedRect(x, y, width, height, 8);
        
        // Text
        const text = this.scene.add.text(x + 10, y + 10, location.name, {
            fontSize: '18px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#ffffff'
        });
        
        // Difficulty and environment info
        const info = this.scene.add.text(x + 10, y + 35, `${location.environment} • Difficulty: ${location.difficulty}/5`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            fill: '#ecf0f1'
        });
        
        // Interactive area
        const hitArea = this.scene.add.rectangle(x + width/2, y + height/2, width, height, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        
        // Store original styles for hover effects
        const originalStyle = { fill: 0x3498db, stroke: 0x2980b9 };
        const hoverStyle = { fill: 0x52a3e8, stroke: 0x3d8bdb };
        
        // Hover effects with error handling
        hitArea.on('pointerover', () => {
            try {
                if (bg && bg.clear) {
                    bg.clear();
                    bg.fillStyle(hoverStyle.fill, 0.9);
                    bg.fillRoundedRect(x, y, width, height, 8);
                    bg.lineStyle(2, hoverStyle.stroke);
                    bg.strokeRoundedRect(x, y, width, height, 8);
                }
            } catch (error) {
                console.error('MapSelectionUI: Error in hover effect:', error);
            }
        });
        
        hitArea.on('pointerout', () => {
            try {
                if (bg && bg.clear) {
                    bg.clear();
                    bg.fillStyle(originalStyle.fill, 0.8);
                    bg.fillRoundedRect(x, y, width, height, 8);
                    bg.lineStyle(2, originalStyle.stroke);
                    bg.strokeRoundedRect(x, y, width, height, 8);
                }
            } catch (error) {
                console.error('MapSelectionUI: Error in hover reset:', error);
            }
        });
        
        hitArea.on('pointerdown', () => {
            try {
                this.selectLocation(location);
            } catch (error) {
                console.error('MapSelectionUI: Error in location selection:', error);
            }
        });
        
        return { bg, textElements: [text, info], hitArea };
    }

    createLockedLocationButton(x, y, width, location) {
        const height = 60;
        
        // Background (grayed out)
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x7f8c8d, 0.5);
        bg.fillRoundedRect(x, y, width, height, 8);
        bg.lineStyle(2, 0x95a5a6);
        bg.strokeRoundedRect(x, y, width, height, 8);
        
        // Text (grayed out)
        const text = this.scene.add.text(x + 40, y + 10, location.name, {
            fontSize: '18px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#95a5a6'
        });
        
        // Requirements info
        const requirements = this.scene.add.text(x + 40, y + 35, location.unlockDescription, {
            fontSize: '12px',
            fontFamily: 'Arial',
            fill: '#bdc3c7'
        });
        
        // Lock icon
        const lockIcon = this.scene.add.text(x + 15, y + height/2, '🔒', {
            fontSize: '20px'
        }).setOrigin(0.5);
        
        return { bg, textElements: [text, requirements], lockIcon };
    }

    createLocationDetails(panelX, panelY, panelWidth, panelHeight) {
        const detailsX = panelX + panelWidth * 0.5 + 20;
        const detailsY = panelY + 100;
        const detailsWidth = panelWidth * 0.45;
        const detailsHeight = panelHeight - 200;
        
        // Details background
        const detailsBg = this.scene.add.graphics();
        detailsBg.fillStyle(0x2c3e50, 0.8);
        detailsBg.fillRoundedRect(detailsX, detailsY, detailsWidth, detailsHeight, 10);
        detailsBg.lineStyle(2, 0x34495e);
        detailsBg.strokeRoundedRect(detailsX, detailsY, detailsWidth, detailsHeight, 10);
        this.container.add(detailsBg);
        
        // Details title
        const detailsTitle = this.scene.add.text(detailsX + detailsWidth / 2, detailsY + 20, 'Location Details', {
            fontSize: '20px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.container.add(detailsTitle);
        
        // Placeholder text
        this.selectedLocationDisplay = this.scene.add.text(detailsX + detailsWidth / 2, detailsY + detailsHeight / 2, 'Select a location to view details', {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: '#bdc3c7',
            align: 'center',
            wordWrap: { width: detailsWidth - 40 }
        }).setOrigin(0.5);
        this.container.add(this.selectedLocationDisplay);
        
        // Travel button (initially hidden)
        this.travelButton = this.createButton(
            detailsX + detailsWidth / 2, 
            detailsY + detailsHeight - 40, 
            'TRAVEL TO LOCATION', 
            () => this.travelToSelectedLocation(), 
            0x27ae60
        );
        this.travelButton.button.setVisible(false);
        this.travelButton.text.setVisible(false);
        this.container.add(this.travelButton.button);
        this.container.add(this.travelButton.text);
    }

    selectLocation(location) {
        this.selectedLocation = location;
        
        // Update the details display
        this.updateLocationDetails(location);
        
        // Show travel button
        this.travelButton.button.setVisible(true);
        this.travelButton.text.setVisible(true);
        
        console.log('MapSelectionUI: Selected location:', location.name);
    }

    updateLocationDetails(location) {
        if (!this.selectedLocationDisplay) return;
        
        const detailsText = `${location.name}\n\n${location.description}\n\nEnvironment: ${location.environment}\nDifficulty: ${location.difficulty}/5\nUnlock Level: ${location.unlockLevel}\n\nUnique Features:\n${location.uniqueFeatures.map(feature => `• ${feature}`).join('\n')}`;
        
        this.selectedLocationDisplay.setText(detailsText);
        this.selectedLocationDisplay.setStyle({
            fontSize: '14px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            align: 'left',
            wordWrap: { width: 380 }
        });
    }

    travelToSelectedLocation() {
        if (!this.selectedLocation) {
            console.error('MapSelectionUI: No location selected for travel');
            return;
        }
        
        try {
            console.log('MapSelectionUI: Attempting to travel to', this.selectedLocation.name);
            
            // Validate game state exists
            if (!this.gameState || !this.gameState.player) {
                console.error('MapSelectionUI: GameState or player not available');
                this.scene.showErrorMessage('Cannot travel: Game state not available');
                return;
            }
            
            // Check if GameLoop is available for proper travel system
            if (this.scene.gameLoop && typeof this.scene.gameLoop.initiateTravel === 'function') {
                // Parse location name to extract map and spot for GameLoop
                const locationName = this.selectedLocation.name;
                let targetMap, targetSpot;
                
                // Handle different location name formats
                if (locationName === 'Starting Port') {
                    targetMap = 'Starting';
                    targetSpot = 'Port';
                } else if (locationName.includes(' ')) {
                    // Split on the last space to separate map and spot
                    const parts = locationName.split(' ');
                    targetSpot = parts.pop(); // Last word is the spot
                    targetMap = parts.join(' '); // Rest is the map name
                } else {
                    // Single word location
                    targetMap = locationName;
                    targetSpot = 'Harbor';
                }
                
                console.log('MapSelectionUI: Initiating GameLoop travel to:', targetMap, targetSpot);
                
                // Use GameLoop's travel system which handles energy, time, and proper location sync
                const travelSuccess = this.scene.gameLoop.initiateTravel(targetMap, targetSpot);
                
                if (travelSuccess) {
                    // Play travel sound with error handling
                    try {
                        if (this.scene.audioManager && this.scene.audioManager.playSFX) {
                            this.scene.audioManager.playSFX('travel');
                        }
                    } catch (audioError) {
                        console.warn('MapSelectionUI: Audio error (non-critical):', audioError);
                    }
                    
                    // Show travel message
                    if (this.scene.showSuccessMessage) {
                        this.scene.showSuccessMessage(`Traveling to ${this.selectedLocation.name}...`);
                    }
                    
                    // Close the map interface
                    this.hide();
                    
                    console.log('MapSelectionUI: Successfully initiated travel via GameLoop');
                } else {
                    console.warn('MapSelectionUI: GameLoop travel failed - insufficient resources or constraints');
                    if (this.scene.showErrorMessage) {
                        this.scene.showErrorMessage('Cannot travel: Insufficient energy or other constraints');
                    }
                }
            } else {
                // Fallback: Direct location update (less ideal but functional)
                console.warn('MapSelectionUI: GameLoop not available, using direct location update');
                
                // Update location in both places for consistency
                this.gameState.player.currentLocation = this.selectedLocation.name;
                if (!this.gameState.world) {
                    this.gameState.world = {};
                }
                this.gameState.world.currentLocation = this.selectedLocation.name;
                
                console.log('MapSelectionUI: Player location updated to', this.selectedLocation.name);
                
                // Play travel sound with error handling
                try {
                    if (this.scene.audioManager && this.scene.audioManager.playSFX) {
                        this.scene.audioManager.playSFX('travel');
                    }
                } catch (audioError) {
                    console.warn('MapSelectionUI: Audio error (non-critical):', audioError);
                }
                
                // Show travel message
                if (this.scene.showSuccessMessage) {
                    this.scene.showSuccessMessage(`Traveling to ${this.selectedLocation.name}...`);
                }
                
                // Update the boat menu status
                if (this.scene.updateStatus) {
                    this.scene.updateStatus({
                        location: this.selectedLocation.name
                    });
                }
                
                // Close the map interface
                this.hide();
                
                console.log('MapSelectionUI: Successfully traveled using direct update');
            }
            
        } catch (error) {
            console.error('MapSelectionUI: Error traveling to location:', error);
            if (this.scene.showErrorMessage) {
                this.scene.showErrorMessage('Failed to travel to location: ' + error.message);
            }
        }
    }

    createButton(x, y, text, callback, color = 0x3498db) {
        const button = this.scene.add.graphics();
        button.fillStyle(color);
        button.fillRoundedRect(-80, -20, 160, 40, 10);
        button.lineStyle(2, 0xffffff, 0.5);
        button.strokeRoundedRect(-80, -20, 160, 40, 10);
        button.setPosition(x, y);
        
        const buttonText = this.scene.add.text(x, y, text, {
            fontSize: '14px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        button.setInteractive(new Phaser.Geom.Rectangle(-80, -20, 160, 40), Phaser.Geom.Rectangle.Contains);
        button.on('pointerdown', (pointer, localX, localY, event) => {
            try {
                // Try to stop propagation if the method exists
                if (event && typeof event.stopPropagation === 'function') {
                    event.stopPropagation();
                }
                callback();
            } catch (error) {
                console.error('MapSelectionUI: Error in button click:', error);
                // Still try to execute callback even if stopPropagation fails
                try {
                    callback();
                } catch (callbackError) {
                    console.error('MapSelectionUI: Error in button callback:', callbackError);
                }
            }
        });
        
        // Hover effects
        button.on('pointerover', () => {
            try {
                button.setScale(1.05);
                buttonText.setScale(1.05);
            } catch (error) {
                console.error('MapSelectionUI: Error in button hover:', error);
            }
        });
        
        button.on('pointerout', () => {
            try {
                button.setScale(1);
                buttonText.setScale(1);
            } catch (error) {
                console.error('MapSelectionUI: Error in button hover reset:', error);
            }
        });
        
        return { button, text: buttonText };
    }

    destroy() {
        this.hide();
        console.log('MapSelectionUI: Destroyed');
    }
} 