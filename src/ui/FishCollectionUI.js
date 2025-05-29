import Phaser from 'phaser';

export class FishCollectionUI extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width, height) {
        super(scene, x, y);
        
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.isVisible = false;
        
        try {
            // Get references
            this.gameState = scene.gameState;
            this.fishDatabase = this.gameState?.fishDatabase || null;
            
            if (!this.fishDatabase) {
                console.warn('FishCollectionUI: Fish database not available, using fallback');
            }
            
            // UI state
            this.currentTab = 'all';
            this.currentPage = 0;
            this.itemsPerPage = 12;
            this.selectedFish = null;
            this.isRefreshing = false; // Prevent infinite recursion
            
            // Create UI elements
            this.createUI();
            
            // Initially hidden
            this.setVisible(false);
            
            scene.add.existing(this);
            
            console.log('FishCollectionUI: Successfully initialized');
        } catch (error) {
            console.error('FishCollectionUI: Error during initialization:', error);
            // Create a minimal error display
            this.createErrorDisplay(error.message);
            scene.add.existing(this);
        }
    }
    
    createErrorDisplay(errorMessage) {
        // Background panel
        this.background = this.scene.add.graphics();
        this.background.fillStyle(0x330000, 0.95);
        this.background.fillRoundedRect(0, 0, this.width, this.height, 20);
        this.background.lineStyle(3, 0xff4444, 1);
        this.background.strokeRoundedRect(0, 0, this.width, this.height, 20);
        this.add(this.background);
        
        // Error title
        const title = this.scene.add.text(this.width / 2, this.height / 2 - 50, 'Fish Collection Error', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ff4444',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add(title);
        
        // Error message
        const message = this.scene.add.text(this.width / 2, this.height / 2, errorMessage, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: this.width - 100 }
        }).setOrigin(0.5);
        this.add(message);
        
        // Close button
        this.createCloseButton();
    }
    
    createUI() {
        // Background panel
        this.background = this.scene.add.graphics();
        this.background.fillStyle(0x000000, 0.95);
        this.background.fillRoundedRect(0, 0, this.width, this.height, 20);
        this.background.lineStyle(3, 0x4488ff, 1);
        this.background.strokeRoundedRect(0, 0, this.width, this.height, 20);
        this.add(this.background);
        
        // Header
        this.createHeader();
        
        // Tabs
        this.createTabs();
        
        // Collection stats
        this.createCollectionStats();
        
        // Fish grid
        this.createFishGrid();
        
        // Fish details panel
        this.createDetailsPanel();
        
        // Close button
        this.createCloseButton();
        
        // Refresh display
        this.refreshDisplay();
    }
    
    createHeader() {
        // Title
        const title = this.scene.add.text(this.width / 2, 30, '🐟 FISH COLLECTION', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.add(title);
        
        // Subtitle
        const subtitle = this.scene.add.text(this.width / 2, 60, 'Track your catches and discover new species!', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        }).setOrigin(0.5);
        this.add(subtitle);
    }
    
    createTabs() {
        const tabY = 100;
        const tabs = [
            { id: 'all', label: 'All Fish', x: 150 },
            { id: 'caught', label: 'Caught', x: 250 },
            { id: 'missing', label: 'Not Caught', x: 350 },
            { id: 'records', label: 'Records', x: 450 }
        ];
        
        this.tabButtons = [];
        
        tabs.forEach(tab => {
            const button = this.scene.add.graphics();
            const isActive = tab.id === this.currentTab;
            
            // Button background
            button.fillStyle(isActive ? 0x4488ff : 0x333333, 0.8);
            button.fillRoundedRect(tab.x - 40, tabY - 15, 80, 30, 5);
            
            if (isActive) {
                button.lineStyle(2, 0x66aaff, 1);
                button.strokeRoundedRect(tab.x - 40, tabY - 15, 80, 30, 5);
            }
            
            // Button text
            const text = this.scene.add.text(tab.x, tabY, tab.label, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: isActive ? '#FFFFFF' : '#888888',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            // Make interactive
            button.setInteractive(new Phaser.Geom.Rectangle(tab.x - 40, tabY - 15, 80, 30), Phaser.Geom.Rectangle.Contains);
            button.on('pointerover', () => {
                if (!isActive) {
                    button.clear();
                    button.fillStyle(0x555555, 0.8);
                    button.fillRoundedRect(tab.x - 40, tabY - 15, 80, 30, 5);
                    text.setColor('#FFFFFF');
                }
            });
            
            button.on('pointerout', () => {
                if (!isActive) {
                    button.clear();
                    button.fillStyle(0x333333, 0.8);
                    button.fillRoundedRect(tab.x - 40, tabY - 15, 80, 30, 5);
                    text.setColor('#888888');
                }
            });
            
            button.on('pointerdown', () => {
                this.currentTab = tab.id;
                this.currentPage = 0;
                this.refreshOnlyFishGrid();
            });
            
            this.add(button);
            this.add(text);
            this.tabButtons.push({ button, text, tab });
        });
    }
    
    createCollectionStats() {
        let stats;
        
        if (this.fishDatabase && this.fishDatabase.getCollectionStats) {
            stats = this.fishDatabase.getCollectionStats();
        } else {
            // Fallback stats if database is not available
            stats = {
                discovered: 0,
                totalSpecies: 15,
                totalCaught: 0,
                totalWeight: 0,
                completionPercent: 0
            };
        }
        
        // Stats container
        const statsY = 140;
        
        // Background for stats
        const statsBg = this.scene.add.graphics();
        statsBg.fillStyle(0x1a1a1a, 0.8);
        statsBg.fillRoundedRect(50, statsY, this.width - 100, 60, 10);
        this.add(statsBg);
        
        // Progress bar
        const progressBarX = 70;
        const progressBarY = statsY + 20;
        const progressBarWidth = this.width - 140;
        const progressBarHeight = 20;
        
        // Progress bar background
        const progressBg = this.scene.add.graphics();
        progressBg.fillStyle(0x333333);
        progressBg.fillRoundedRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 5);
        this.add(progressBg);
        
        // Progress bar fill
        const progressFill = this.scene.add.graphics();
        const fillWidth = (stats.discovered / stats.totalSpecies) * progressBarWidth;
        progressFill.fillStyle(0x00ff00);
        progressFill.fillRoundedRect(progressBarX, progressBarY, fillWidth, progressBarHeight, 5);
        this.add(progressFill);
        
        // Progress text
        const progressText = this.scene.add.text(
            this.width / 2, 
            progressBarY + 10,
            `${stats.discovered} / ${stats.totalSpecies} Species Discovered (${stats.completionPercent}%)`,
            {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#FFFFFF',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        this.add(progressText);
        
        // Additional stats
        const statsText = this.scene.add.text(70, statsY + 45, 
            `Total Caught: ${stats.totalCaught} | Total Weight: ${stats.totalWeight}kg | Completion: ${stats.completionPercent}%`,
            {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#888888'
            }
        );
        this.add(statsText);
    }
    
    createFishGrid() {
        // Grid container
        this.gridContainer = this.scene.add.container(50, 220);
        this.add(this.gridContainer);
        
        // Initialize pagination elements array
        this.paginationElements = [];
        
        // Use the safe refresh method
        this.refreshOnlyFishGrid();
    }
    
    createFishCard(fish, x, y, width, height) {
        if (!this.fishDatabase) {
            console.warn('FishCollectionUI: Cannot create fish card - database not available');
            return;
        }
        
        const collection = this.fishDatabase.getFishCollection(fish.id);
        const isCaught = collection && collection.caught;
        
        // Card background
        const cardBg = this.scene.add.graphics();
        cardBg.fillStyle(isCaught ? 0x2a4d3a : 0x333333, 0.8);
        cardBg.fillRoundedRect(x, y, width, height, 8);
        cardBg.lineStyle(2, isCaught ? 0x4488ff : 0x666666, 0.8);
        cardBg.strokeRoundedRect(x, y, width, height, 8);
        
        // Make interactive
        cardBg.setInteractive(new Phaser.Geom.Rectangle(x, y, width, height), Phaser.Geom.Rectangle.Contains);
        cardBg.on('pointerover', () => {
            cardBg.clear();
            cardBg.fillStyle(isCaught ? 0x3a5d4a : 0x444444, 0.9);
            cardBg.fillRoundedRect(x, y, width, height, 8);
            cardBg.lineStyle(2, isCaught ? 0x66aaff : 0x888888, 1);
            cardBg.strokeRoundedRect(x, y, width, height, 8);
        });
        
        cardBg.on('pointerout', () => {
            cardBg.clear();
            cardBg.fillStyle(isCaught ? 0x2a4d3a : 0x333333, 0.8);
            cardBg.fillRoundedRect(x, y, width, height, 8);
            cardBg.lineStyle(2, isCaught ? 0x4488ff : 0x666666, 0.8);
            cardBg.strokeRoundedRect(x, y, width, height, 8);
        });
        
        cardBg.on('pointerdown', () => {
            this.selectedFish = fish;
            this.updateDetailsPanel();
        });
        
        this.gridContainer.add(cardBg);
        
        // Fish icon or silhouette
        const iconSize = 40;
        const fishIcon = this.scene.add.graphics();
        
        if (isCaught) {
            // Draw colored fish
            const rarityColors = [0x8B4513, 0x4169E1, 0x32CD32, 0xFF6347, 0xFFD700, 
                                 0x9370DB, 0xFF1493, 0x00CED1, 0xFF4500, 0xDC143C];
            const color = rarityColors[Math.min(fish.rarity - 1, rarityColors.length - 1)];
            fishIcon.fillStyle(color);
        } else {
            // Draw gray silhouette
            fishIcon.fillStyle(0x444444);
        }
        
        // Simple fish shape
        fishIcon.fillEllipse(x + width/2, y + 30, iconSize * 0.8, iconSize * 0.4);
        fishIcon.fillTriangle(
            x + width/2 - iconSize * 0.6, y + 30,
            x + width/2 - iconSize * 0.9, y + 30 - iconSize * 0.3,
            x + width/2 - iconSize * 0.9, y + 30 + iconSize * 0.3
        );
        
        this.gridContainer.add(fishIcon);
        
        // Fish name
        const name = isCaught ? fish.name : '???';
        const nameText = this.scene.add.text(x + width/2, y + 55, name, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: isCaught ? '#FFFFFF' : '#666666',
            fontStyle: 'bold',
            wordWrap: { width: width - 10 }
        }).setOrigin(0.5, 0);
        this.gridContainer.add(nameText);
        
        // Caught count (if caught)
        if (isCaught && collection.timesCaught > 0) {
            const countText = this.scene.add.text(x + width/2, y + 75, `Caught: ${collection.timesCaught}`, {
                fontSize: '10px',
                fontFamily: 'Arial',
                color: '#888888'
            }).setOrigin(0.5);
            this.gridContainer.add(countText);
        }
        
        // Rarity stars
        if (isCaught) {
            const starY = y + height - 10;
            const starSize = 8;
            const starSpacing = 10;
            const totalStars = Math.min(fish.rarity, 5);
            const startX = x + width/2 - (totalStars - 1) * starSpacing / 2;
            
            for (let i = 0; i < totalStars; i++) {
                const star = this.scene.add.text(startX + i * starSpacing, starY, '⭐', {
                    fontSize: `${starSize}px`
                }).setOrigin(0.5);
                this.gridContainer.add(star);
            }
        }
    }
    
    createDetailsPanel() {
        // Details panel on the right
        this.detailsContainer = this.scene.add.container(600, 220);
        this.add(this.detailsContainer);
        
        // Panel background
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(0x1a1a1a, 0.9);
        panelBg.fillRoundedRect(0, 0, 250, 350, 10);
        panelBg.lineStyle(2, 0x4488ff, 0.8);
        panelBg.strokeRoundedRect(0, 0, 250, 350, 10);
        this.detailsContainer.add(panelBg);
        
        // Default text
        this.detailsTitle = this.scene.add.text(125, 20, 'Select a Fish', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.detailsContainer.add(this.detailsTitle);
        
        this.detailsContent = this.scene.add.text(125, 175, 
            'Click on any fish card to view detailed information', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#888888',
            align: 'center',
            wordWrap: { width: 220 }
        }).setOrigin(0.5);
        this.detailsContainer.add(this.detailsContent);
    }
    
    updateDetailsPanel() {
        if (!this.selectedFish || !this.fishDatabase) {
            console.warn('FishCollectionUI: Cannot update details panel - fish or database not available');
            return;
        }
        
        const fish = this.selectedFish;
        const collection = this.fishDatabase.getFishCollection(fish.id);
        const isCaught = collection && collection.caught;
        
        // Clear existing content
        this.detailsContainer.removeAll(true);
        
        // Recreate background
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(0x1a1a1a, 0.9);
        panelBg.fillRoundedRect(0, 0, 250, 350, 10);
        panelBg.lineStyle(2, 0x4488ff, 0.8);
        panelBg.strokeRoundedRect(0, 0, 250, 350, 10);
        this.detailsContainer.add(panelBg);
        
        // Fish name
        const nameText = this.scene.add.text(125, 20, isCaught ? fish.name : '???', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.detailsContainer.add(nameText);
        
        if (isCaught) {
            // Fish image placeholder
            const fishImage = this.scene.add.graphics();
            const rarityColors = [0x8B4513, 0x4169E1, 0x32CD32, 0xFF6347, 0xFFD700, 
                                 0x9370DB, 0xFF1493, 0x00CED1, 0xFF4500, 0xDC143C];
            const color = rarityColors[Math.min(fish.rarity - 1, rarityColors.length - 1)];
            fishImage.fillStyle(color);
            fishImage.fillEllipse(125, 70, 60, 30);
            fishImage.fillTriangle(65, 70, 45, 55, 45, 85);
            this.detailsContainer.add(fishImage);
            
            // Description
            const descText = this.scene.add.text(125, 110, fish.description || 'No description available', {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#FFFFFF',
                align: 'center',
                wordWrap: { width: 220 }
            }).setOrigin(0.5, 0);
            this.detailsContainer.add(descText);
            
            // Stats
            let statsY = 160;
            const stats = [
                `Rarity: ${'⭐'.repeat(Math.min(fish.rarity, 5))} (${fish.rarity})`,
                `Size: ${fish.size}/10`,
                `Weight: ${fish.weight}kg`,
                `Value: ${fish.coinValue} coins`,
                `XP: ${fish.experienceValue}`,
                `Habitat: ${fish.habitat}`
            ];
            
            stats.forEach((stat, index) => {
                const statText = this.scene.add.text(20, statsY + index * 20, stat, {
                    fontSize: '12px',
                    fontFamily: 'Arial',
                    color: '#888888'
                });
                this.detailsContainer.add(statText);
            });
            
            // Collection stats
            const collectionY = 290;
            const collectionStats = [
                `Times Caught: ${collection.timesCaught}`,
                `Largest: ${collection.largestWeight}kg`,
                `First Caught: ${collection.firstCaughtDate ? new Date(collection.firstCaughtDate).toLocaleDateString() : 'N/A'}`
            ];
            
            collectionStats.forEach((stat, index) => {
                const statText = this.scene.add.text(20, collectionY + index * 15, stat, {
                    fontSize: '11px',
                    fontFamily: 'Arial',
                    color: '#666666'
                });
                this.detailsContainer.add(statText);
            });
        } else {
            // Not caught message
            const notCaughtText = this.scene.add.text(125, 175, 
                'This fish has not been caught yet!\n\nKeep fishing to discover it!', {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#888888',
                align: 'center',
                wordWrap: { width: 220 }
            }).setOrigin(0.5);
            this.detailsContainer.add(notCaughtText);
        }
    }
    
    createPaginationControls(totalPages) {
        // This method has been replaced by updatePaginationDisplay to prevent infinite recursion
        console.warn('FishCollectionUI: createPaginationControls is deprecated - use updatePaginationDisplay instead');
    }
    
    createCloseButton() {
        const closeButton = this.scene.add.text(this.width - 30, 30, '✖', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ff4444',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive();
        
        closeButton.on('pointerover', () => {
            closeButton.setScale(1.2);
            closeButton.setColor('#ff6666');
        });
        
        closeButton.on('pointerout', () => {
            closeButton.setScale(1);
            closeButton.setColor('#ff4444');
        });
        
        closeButton.on('pointerdown', () => {
            this.hide();
        });
        
        this.add(closeButton);
    }
    
    getFishListForTab() {
        if (!this.fishDatabase || !this.fishDatabase.fishSpecies) {
            console.warn('FishCollectionUI: Fish database not available, returning empty list');
            return [];
        }
        
        const allFish = Object.values(this.fishDatabase.fishSpecies);
        
        switch (this.currentTab) {
            case 'all':
                return allFish;
                
            case 'caught':
                return allFish.filter(fish => this.fishDatabase.hasCaughtFish(fish.id));
                
            case 'missing':
                return allFish.filter(fish => !this.fishDatabase.hasCaughtFish(fish.id));
                
            case 'records':
                // Show fish with records (heaviest caught of each species)
                return allFish.filter(fish => {
                    const collection = this.fishDatabase.getFishCollection(fish.id);
                    return collection && collection.caught && collection.largestWeight > 0;
                }).sort((a, b) => {
                    const collA = this.fishDatabase.getFishCollection(a.id);
                    const collB = this.fishDatabase.getFishCollection(b.id);
                    return (collB?.largestWeight || 0) - (collA?.largestWeight || 0);
                });
                
            default:
                return allFish;
        }
    }
    
    refreshDisplay() {
        console.log('FishCollectionUI: refreshDisplay called');
        
        // Prevent infinite recursion
        if (this.isRefreshing) {
            console.warn('FishCollectionUI: Already refreshing, skipping to prevent recursion');
            return;
        }
        
        this.isRefreshing = true;
        
        try {
            // Only refresh the fish grid and details panel, not the entire UI
            if (this.gridContainer) {
                this.gridContainer.removeAll(true);
                this.refreshOnlyFishGrid();
            }
            
            if (this.selectedFish && this.detailsContainer) {
                this.updateDetailsPanel();
            }
        } catch (error) {
            console.error('FishCollectionUI: Error during refresh:', error);
        } finally {
            this.isRefreshing = false;
        }
    }
    
    refreshOnlyFishGrid() {
        // Get fish list based on current tab
        let fishList = this.getFishListForTab();
        
        // Handle empty fish list
        if (!fishList || fishList.length === 0) {
            const emptyMessage = this.scene.add.text(300, 100, 
                'No fish available to display.\nFish database may not be loaded.', {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#888888',
                align: 'center'
            }).setOrigin(0.5);
            this.gridContainer.add(emptyMessage);
            return;
        }
        
        // Calculate pagination
        const totalPages = Math.ceil(fishList.length / this.itemsPerPage);
        const startIndex = this.currentPage * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, fishList.length);
        const pageFish = fishList.slice(startIndex, endIndex);
        
        // Create grid items
        const cols = 4;
        const rows = 3;
        const cellWidth = 120;
        const cellHeight = 100;
        const spacing = 20;
        
        pageFish.forEach((fish, index) => {
            try {
                const col = index % cols;
                const row = Math.floor(index / cols);
                const x = col * (cellWidth + spacing);
                const y = row * (cellHeight + spacing);
                
                this.createFishCard(fish, x, y, cellWidth, cellHeight);
            } catch (error) {
                console.error('FishCollectionUI: Error creating fish card:', error);
            }
        });
        
        // Update pagination without recreating the entire pagination system
        this.updatePaginationDisplay(totalPages);
    }
    
    updatePaginationDisplay(totalPages) {
        // Remove only existing pagination elements, not everything
        if (this.paginationElements) {
            this.paginationElements.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
        }
        this.paginationElements = [];
        
        if (totalPages <= 1) return;
        
        const paginationY = this.height - 80;
        
        // Previous button
        if (this.currentPage > 0) {
            const prevButton = this.scene.add.text(200, paginationY, '◀ Previous', {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#4488ff',
                fontStyle: 'bold'
            }).setOrigin(0.5).setInteractive();
            
            prevButton.on('pointerover', () => prevButton.setColor('#66aaff'));
            prevButton.on('pointerout', () => prevButton.setColor('#4488ff'));
            prevButton.on('pointerdown', () => {
                this.currentPage--;
                this.refreshOnlyFishGrid(); // Call the safe version that doesn't cause recursion
            });
            
            this.add(prevButton);
            this.paginationElements.push(prevButton);
        }
        
        // Page indicator
        const pageText = this.scene.add.text(this.width / 2 - 100, paginationY, 
            `Page ${this.currentPage + 1} / ${totalPages}`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        }).setOrigin(0.5);
        this.add(pageText);
        this.paginationElements.push(pageText);
        
        // Next button
        if (this.currentPage < totalPages - 1) {
            const nextButton = this.scene.add.text(400, paginationY, 'Next ▶', {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#4488ff',
                fontStyle: 'bold'
            }).setOrigin(0.5).setInteractive();
            
            nextButton.on('pointerover', () => nextButton.setColor('#66aaff'));
            nextButton.on('pointerout', () => nextButton.setColor('#4488ff'));
            nextButton.on('pointerdown', () => {
                this.currentPage++;
                this.refreshOnlyFishGrid(); // Call the safe version that doesn't cause recursion
            });
            
            this.add(nextButton);
            this.paginationElements.push(nextButton);
        }
    }
    
    show() {
        this.isVisible = true;
        this.setVisible(true);
        this.refreshDisplay();
    }
    
    hide() {
        this.isVisible = false;
        this.setVisible(false);
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
} 