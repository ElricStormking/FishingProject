import UITheme from './UITheme.js';

export class EquipmentEnhancementUI {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isVisible = false;
        
        // Immediately attach this UI to the scene for InventoryUI to find
        if (scene) {
            scene.equipmentEnhancementUI = this;
            console.log('EquipmentEnhancementUI: Attached to scene as equipmentEnhancementUI');
        }
        
        // Get the enhancer from the scene with multiple fallback options
        this.enhancer = this.scene.equipmentEnhancer || this.scene.gameState?.equipmentEnhancer || null;
        this.inventoryManager = this.scene.gameState?.inventoryManager || null;
        
        // Validate that we have the required dependencies
        if (!this.enhancer) {
            console.error('EquipmentEnhancementUI: No equipment enhancer found in scene');
            console.log('EquipmentEnhancementUI: Available scene properties:', Object.keys(this.scene));
            console.log('EquipmentEnhancementUI: scene.equipmentEnhancer:', !!this.scene.equipmentEnhancer);
            console.log('EquipmentEnhancementUI: scene.gameState.equipmentEnhancer:', !!this.scene.gameState?.equipmentEnhancer);
            
            // Try to create a temporary enhancer if none exists
            if (this.scene.gameState?.inventoryManager) {
                console.log('EquipmentEnhancementUI: Attempting to create temporary enhancer');
                try {
                    // Import synchronously since this is a constructor
                    import('../scripts/EquipmentEnhancer.js').then(module => {
                        const EquipmentEnhancer = module.default || module.EquipmentEnhancer;
                        this.enhancer = new EquipmentEnhancer(this.scene.gameState, this.scene.gameState.inventoryManager);
                        this.scene.equipmentEnhancer = this.enhancer;
                        console.log('EquipmentEnhancementUI: Created temporary enhancer successfully');
                        
                        // Refresh UI now that we have the enhancer
                        if (this.isVisible) {
                            this.refreshContent();
                        }
                    }).catch(error => {
                        console.error('EquipmentEnhancementUI: Failed to create temporary enhancer:', error);
                    });
                } catch (error) {
                    console.error('EquipmentEnhancementUI: Failed to import EquipmentEnhancer:', error);
                }
            }
        }
        
        if (!this.inventoryManager) {
            console.error('EquipmentEnhancementUI: No inventory manager found');
            console.log('EquipmentEnhancementUI: scene.gameState.inventoryManager:', !!this.scene.gameState?.inventoryManager);
        }
        
        // UI containers
        this.container = null;
        this.currentTab = 'upgrade'; // upgrade, enhance, sets, specialization
        this.selectedItem = null;
        
        // UI elements
        this.tabButtons = {};
        this.contentContainer = null;
        this.itemSlots = [];
        
        // Only create UI if we have basic dependencies
        if (this.scene) {
            try {
                this.createUI();
                this.setupEventListeners();
                console.log('EquipmentEnhancementUI: Initialized successfully with enhancer:', !!this.enhancer, 'and inventoryManager:', !!this.inventoryManager);
            } catch (error) {
                console.error('EquipmentEnhancementUI: Error during UI creation:', error);
                this.createErrorUI();
            }
        } else {
            console.error('EquipmentEnhancementUI: No scene provided');
        }
    }

    createErrorUI() {
        // Create a minimal error UI that can still be shown
        this.container = this.scene.add.container(this.x, this.y);
        this.container.setVisible(false);

        // Background using UITheme
        const bg = UITheme.createPanel(this.scene, 0, 0, this.width, this.height, 'error');
        this.container.add(bg);

        // Error title using UITheme
        const title = UITheme.createText(this.scene, this.width / 2, 50, 'EQUIPMENT ENHANCEMENT', 'headerLarge');
        title.setOrigin(0.5);
        this.container.add(title);

        // Error message using UITheme
        const errorMsg = UITheme.createText(this.scene, this.width / 2, this.height / 2, 
            'Equipment Enhancement System\nis currently unavailable.\n\nPlease restart the game\nor contact support.', 'error');
        errorMsg.setOrigin(0.5);
        errorMsg.setAlign('center');
        this.container.add(errorMsg);

        // Close button using UITheme
        const closeBtn = UITheme.createText(this.scene, this.width - 30, 30, '×', 'error');
        closeBtn.setOrigin(0.5).setInteractive();
        closeBtn.setFontSize('32px');
        
        closeBtn.on('pointerdown', () => this.hide());
        closeBtn.on('pointerover', () => closeBtn.setScale(1.2));
        closeBtn.on('pointerout', () => closeBtn.setScale(1));
        this.container.add(closeBtn);

        console.log('EquipmentEnhancementUI: Created error UI as fallback');
    }

    createUI() {
        // Main container
        this.container = this.scene.add.container(this.x, this.y);
        this.container.setVisible(false);

        // Background using UITheme
        const bg = UITheme.createPanel(this.scene, 0, 0, this.width, this.height, 'primary');
        this.container.add(bg);

        // Title using UITheme
        const title = UITheme.createText(this.scene, this.width / 2, 30, 'EQUIPMENT ENHANCEMENT', 'headerLarge');
        title.setOrigin(0.5);
        this.container.add(title);

        // Close button using UITheme
        const closeBtn = UITheme.createText(this.scene, this.width - 30, 30, '×', 'error');
        closeBtn.setOrigin(0.5).setInteractive();
        closeBtn.setFontSize('32px');
        
        closeBtn.on('pointerdown', () => this.hide());
        closeBtn.on('pointerover', () => closeBtn.setScale(1.2));
        closeBtn.on('pointerout', () => closeBtn.setScale(1));
        this.container.add(closeBtn);

        // Tab buttons
        this.createTabButtons();
        
        // Content area
        this.contentContainer = this.scene.add.container(0, 100);
        this.container.add(this.contentContainer);

        // Initially show upgrade tab
        this.showTab('upgrade');
    }

    createTabButtons() {
        const tabs = [
            { id: 'upgrade', name: 'UPGRADE', icon: '⬆' },
            { id: 'enhance', name: 'ENHANCE', icon: '✨' },
            { id: 'sets', name: 'SETS', icon: '🎯' },
            { id: 'specialization', name: 'SPECIALIZATION', icon: '🏆' }
        ];

        const tabWidth = 150;
        const startX = (this.width - (tabs.length * tabWidth)) / 2;

        tabs.forEach((tab, index) => {
            const x = startX + index * tabWidth;
            const y = 70;

            // Tab background using UITheme
            const tabBg = this.scene.add.graphics();
            tabBg.fillStyle(UITheme.colors.darkSecondary, 0.8);
            tabBg.fillRoundedRect(x, y - 15, tabWidth - 10, 30, UITheme.borders.radius.small);
            tabBg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
            tabBg.strokeRoundedRect(x, y - 15, tabWidth - 10, 30, UITheme.borders.radius.small);

            // Tab text using UITheme
            const tabText = UITheme.createText(this.scene, x + tabWidth / 2 - 5, y, `${tab.icon} ${tab.name}`, 'bodySmall');

            // Interactive area
            const tabArea = this.scene.add.rectangle(x + tabWidth / 2 - 5, y, tabWidth - 10, 30)
                .setInteractive()
                .setAlpha(0);

            tabArea.on('pointerdown', () => this.showTab(tab.id));
            tabArea.on('pointerover', () => {
                tabBg.clear();
                tabBg.fillStyle(UITheme.colors.primary, 0.3);
                tabBg.fillRoundedRect(x, y - 15, tabWidth - 10, 30, UITheme.borders.radius.small);
                tabBg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
                tabBg.strokeRoundedRect(x, y - 15, tabWidth - 10, 30, UITheme.borders.radius.small);
            });
            tabArea.on('pointerout', () => {
                if (this.currentTab !== tab.id) {
                    tabBg.clear();
                    tabBg.fillStyle(UITheme.colors.darkSecondary, 0.8);
                    tabBg.fillRoundedRect(x, y - 15, tabWidth - 10, 30, UITheme.borders.radius.small);
                    tabBg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
                    tabBg.strokeRoundedRect(x, y - 15, tabWidth - 10, 30, UITheme.borders.radius.small);
                }
            });

            this.tabButtons[tab.id] = { bg: tabBg, text: tabText, area: tabArea };
            this.container.add([tabBg, tabText, tabArea]);
        });
    }

    showTab(tabId) {
        // Update tab appearance
        Object.entries(this.tabButtons).forEach(([id, tab]) => {
            const isActive = id === tabId;
            tab.bg.clear();
            
            if (isActive) {
                tab.bg.fillStyle(UITheme.colors.primary, 0.6);
                tab.bg.fillRoundedRect(tab.area.x - tab.area.width/2, tab.area.y - tab.area.height/2, tab.area.width, tab.area.height, UITheme.borders.radius.small);
                tab.bg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
                tab.bg.strokeRoundedRect(tab.area.x - tab.area.width/2, tab.area.y - tab.area.height/2, tab.area.width, tab.area.height, UITheme.borders.radius.small);
                tab.text.setColor(UITheme.colors.text);
            } else {
                tab.bg.fillStyle(UITheme.colors.darkSecondary, 0.8);
                tab.bg.fillRoundedRect(tab.area.x - tab.area.width/2, tab.area.y - tab.area.height/2, tab.area.width, tab.area.height, UITheme.borders.radius.small);
                tab.bg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
                tab.bg.strokeRoundedRect(tab.area.x - tab.area.width/2, tab.area.y - tab.area.height/2, tab.area.width, tab.area.height, UITheme.borders.radius.small);
                tab.text.setColor(UITheme.colors.textSecondary);
            }
        });

        this.currentTab = tabId;
        this.refreshContent();
    }

    refreshContent() {
        // Clear current content
        this.contentContainer.removeAll(true);

        // Add debug information
        this.debugInventoryState();

        switch(this.currentTab) {
            case 'upgrade':
                this.createUpgradeInterface();
                break;
            case 'enhance':
                this.createEnhanceInterface();
                break;
            case 'sets':
                this.createSetsInterface();
                break;
            case 'specialization':
                this.createSpecializationInterface();
                break;
        }
    }

    debugInventoryState() {
        console.log('=== EquipmentEnhancementUI Debug ===');
        console.log('Enhancer available:', !!this.enhancer);
        console.log('Inventory Manager available:', !!this.inventoryManager);
        console.log('Scene GameState available:', !!this.scene.gameState);
        console.log('Scene GameState InventoryManager:', !!this.scene.gameState?.inventoryManager);
        
        if (this.inventoryManager) {
            try {
                const equipped = this.inventoryManager.getEquippedItems();
                console.log('Equipped items retrieved:', equipped);
                console.log('Equipped items categories:', Object.keys(equipped));
                Object.entries(equipped).forEach(([category, items]) => {
                    console.log(`  ${category}: ${items ? items.length : 0} items`);
                });
            } catch (error) {
                console.error('Error getting equipped items:', error);
            }
            
            try {
                if (this.inventoryManager.getInventoryStats) {
                    const stats = this.inventoryManager.getInventoryStats();
                    console.log('Inventory stats:', stats);
                }
            } catch (error) {
                console.error('Error getting inventory stats:', error);
            }
        }
        
        console.log('=== End Debug ===');
    }

    createUpgradeInterface() {
        const startY = 20;
        
        // Equipment selection panel
        this.createEquipmentSelection(20, startY);
        
        // Upgrade information panel
        if (this.selectedItem) {
            this.createUpgradePanel(400, startY);
        } else {
            const infoText = UITheme.createText(this.scene, 400, startY + 100, 'Select an equipment item to upgrade', 'bodySmall');
            this.contentContainer.add(infoText);
        }
    }

    createEnhanceInterface() {
        const startY = 20;
        
        // Equipment selection panel
        this.createEquipmentSelection(20, startY);
        
        // Enhancement panel
        if (this.selectedItem) {
            this.createEnhancementPanel(400, startY);
        } else {
            const infoText = UITheme.createText(this.scene, 400, startY + 100, 'Select an equipment item to enhance', 'bodySmall');
            this.contentContainer.add(infoText);
        }
    }

    createSetsInterface() {
        const startY = 20;
        
        // Active sets panel
        this.createActiveSetsPanel(20, startY);
        
        // Available sets panel
        this.createAvailableSetsPanel(400, startY);
    }

    createSpecializationInterface() {
        const startY = 20;
        
        // Equipment selection panel
        this.createEquipmentSelection(20, startY);
        
        // Specialization panel
        if (this.selectedItem) {
            this.createSpecializationPanel(400, startY);
        } else {
            const infoText = UITheme.createText(this.scene, 400, startY + 100, 'Select an equipment item to specialize', 'bodySmall');
            this.contentContainer.add(infoText);
        }
    }

    createEquipmentSelection(x, y) {
        // Equipment selection title
        const title = UITheme.createText(this.scene, x, y, 'EQUIPPED ITEMS', 'bodySmall');
        this.contentContainer.add(title);

        // Check if inventory manager is available
        if (!this.inventoryManager) {
            console.warn('EquipmentEnhancementUI: No inventory manager available for equipment selection');
            const errorText = UITheme.createText(this.scene, x, y + 40, 'Inventory system not available.\nEquipment data cannot be loaded.', 'error');
            this.contentContainer.add(errorText);
            return;
        }

        // Try to get equipped items with error handling
        let equipped = {};
        try {
            equipped = this.inventoryManager.getEquippedItems() || {};
            console.log('EquipmentEnhancementUI: Retrieved equipped items:', equipped);
        } catch (error) {
            console.error('EquipmentEnhancementUI: Error getting equipped items:', error);
            const errorText = UITheme.createText(this.scene, x, y + 40, 'Error loading equipped items.\nPlease check your equipment.', 'error');
            this.contentContainer.add(errorText);
            return;
        }

        let slotY = y + 30;
        let hasEquippedItems = false;

        // Check if we have any equipped items
        Object.entries(equipped).forEach(([category, items]) => {
            if (items && Array.isArray(items) && items.length > 0) {
                hasEquippedItems = true;
                console.log(`EquipmentEnhancementUI: Found ${items.length} items in category ${category}`);
                items.forEach((item, index) => {
                    try {
                        this.createEquipmentSlot(x, slotY, item, category);
                        slotY += 70;
                    } catch (error) {
                        console.error(`EquipmentEnhancementUI: Error creating slot for item ${index} in category ${category}:`, error);
                    }
                });
            }
        });

        // If no equipped items found, add debug test equipment
        if (!hasEquippedItems) {
            console.log('EquipmentEnhancementUI: No equipped items found, adding debug test equipment');
            this.addDebugTestEquipment(x, slotY);
        }
    }

    addDebugTestEquipment(x, startY) {
        // Create some debug test equipment for testing
        const testEquipment = [
            {
                id: 'debug_rod',
                name: 'Debug Bamboo Rod',
                category: 'rods',
                level: 1,
                enhancement: 0,
                rarity: 1,
                stats: { castAccuracy: 10, tensionStability: 15 }
            },
            {
                id: 'debug_lure',
                name: 'Debug Basic Spinner',
                category: 'lures',
                level: 0,
                enhancement: 0,
                rarity: 1,
                stats: { rareFishChance: 5, biteRate: 10 }
            },
            {
                id: 'debug_boat',
                name: 'Debug Rowboat',
                category: 'boats',
                level: 2,
                enhancement: 1,
                rarity: 1,
                stats: { stability: 20, mobility: 8 }
            }
        ];

        let slotY = startY;
        
        // Add title for debug section
        const debugTitle = UITheme.createText(this.scene, x, slotY, 'DEBUG TEST EQUIPMENT (Click to test)', 'bodySmall');
        debugTitle.setFontSize('12px');
        debugTitle.setFontStyle('bold');
        this.contentContainer.add(debugTitle);
        slotY += 25;

        // Create slots for debug equipment
        testEquipment.forEach(item => {
            try {
                this.createEquipmentSlot(x, slotY, item, item.category);
                slotY += 70;
            } catch (error) {
                console.error('EquipmentEnhancementUI: Error creating debug slot:', error);
            }
        });

        // Add helpful message
        const helpText = UITheme.createText(this.scene, x, slotY + 10, 'No real equipment equipped.\nUse debug items above to test\nenhancement functionality.', 'bodySmall');
        helpText.setLineSpacing(3);
        this.contentContainer.add(helpText);
    }

    createEquipmentSlot(x, y, item, category) {
        // Validate item data
        if (!item) {
            console.error('EquipmentEnhancementUI: Invalid item data - item is null/undefined');
            return;
        }
        
        if (!item.name) {
            console.warn('EquipmentEnhancementUI: Item missing name property:', item);
            item.name = 'Unknown Item';
        }
        
        if (!item.id) {
            console.warn('EquipmentEnhancementUI: Item missing id property:', item);
            item.id = `unknown_${Date.now()}`;
        }

        // Slot background
        const isSelected = this.selectedItem && this.selectedItem.id === item.id;
        const bgColor = isSelected ? UITheme.colors.primary : UITheme.colors.darkSecondary;
        const borderColor = isSelected ? UITheme.colors.medium : UITheme.colors.medium;

        const slotBg = this.scene.add.graphics();
        slotBg.fillStyle(bgColor, 0.8);
        slotBg.fillRoundedRect(x, y, 350, 60, UITheme.borders.radius.small);
        slotBg.lineStyle(UITheme.borders.width.thin, borderColor);
        slotBg.strokeRoundedRect(x, y, 350, 60, UITheme.borders.radius.small);

        // Item icon (simplified)
        const rarity = item.rarity || 1;
        let rarityColor = '#ffffff';
        try {
            rarityColor = this.getRarityColor(rarity);
        } catch (error) {
            console.warn('EquipmentEnhancementUI: Error getting rarity color, using default:', error);
        }
        
        const itemIcon = this.scene.add.graphics();
        try {
            const colorValue = rarityColor.startsWith('#') ? parseInt(rarityColor.replace('#', '0x')) : 0xffffff;
            itemIcon.fillStyle(colorValue);
            itemIcon.fillRoundedRect(x + 10, y + 10, 40, 40, 3);
        } catch (error) {
            console.warn('EquipmentEnhancementUI: Error creating item icon, using default:', error);
            itemIcon.fillStyle(0xffffff);
            itemIcon.fillRoundedRect(x + 10, y + 10, 40, 40, 3);
        }

        // Item name and level
        const nameText = UITheme.createText(this.scene, x + 60, y + 15, item.name, 'bodySmall');

        const levelText = UITheme.createText(this.scene, x + 60, y + 35, `Level: ${item.level || 0} | Enhancement: +${item.enhancement || 0}`, 'bodySmall');

        // Interactive area - make it more clickable
        const slotArea = this.scene.add.rectangle(x + 175, y + 30, 350, 60)
            .setInteractive()
            .setAlpha(0);

        slotArea.on('pointerdown', () => {
            console.log('EquipmentEnhancementUI: Equipment slot clicked:', item.name, 'in category:', category);
            try {
                this.selectedItem = { ...item, category };
                console.log('EquipmentEnhancementUI: Selected item set to:', this.selectedItem);
                this.refreshContent();
            } catch (error) {
                console.error('EquipmentEnhancementUI: Error selecting item:', error);
                this.showMessage('Error selecting item: ' + error.message, UITheme.colors.error);
            }
        });

        // Add hover effects for better UX
        slotArea.on('pointerover', () => {
            if (!isSelected) {
                slotBg.clear();
                slotBg.fillStyle(UITheme.colors.darkSecondary, 0.8);
                slotBg.fillRoundedRect(x, y, 350, 60, UITheme.borders.radius.small);
                slotBg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
                slotBg.strokeRoundedRect(x, y, 350, 60, UITheme.borders.radius.small);
            }
        });

        slotArea.on('pointerout', () => {
            if (!isSelected) {
                slotBg.clear();
                slotBg.fillStyle(UITheme.colors.darkSecondary, 0.8);
                slotBg.fillRoundedRect(x, y, 350, 60, UITheme.borders.radius.small);
                slotBg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
                slotBg.strokeRoundedRect(x, y, 350, 60, UITheme.borders.radius.small);
            }
        });

        this.contentContainer.add([slotBg, itemIcon, nameText, levelText, slotArea]);
        
        console.log('EquipmentEnhancementUI: Created equipment slot for:', item.name, 'at position:', x, y);
    }

    createUpgradePanel(x, y) {
        if (!this.selectedItem) return;
        if (!this.enhancer) {
            console.error('EquipmentEnhancementUI: Cannot create upgrade panel - enhancer not available');
            return;
        }

        const item = this.selectedItem;
        const currentLevel = item.level || 0;

        // Panel background
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(UITheme.colors.darkSecondary, 0.8);
        panelBg.fillRoundedRect(x, y, 350, 400, UITheme.borders.radius.small);
        panelBg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
        panelBg.strokeRoundedRect(x, y, 350, 400, UITheme.borders.radius.small);

        // Title
        const title = UITheme.createText(this.scene, x + 175, y + 20, 'UPGRADE EQUIPMENT', 'headerSmall');
        title.setOrigin(0.5);

        // Current level display
        const levelDisplay = UITheme.createText(this.scene, x + 20, y + 50, `Current Level: ${currentLevel}/10`, 'bodySmall');

        // Level progress bar
        const progressBg = this.scene.add.graphics();
        progressBg.fillStyle(UITheme.colors.darkPrimary);
        progressBg.fillRoundedRect(x + 20, y + 70, 310, 20, UITheme.borders.radius.small);
        
        const progressFill = this.scene.add.graphics();
        progressFill.fillStyle(UITheme.colors.primary);
        progressFill.fillRoundedRect(x + 20, y + 70, (310 * currentLevel / 10), 20, UITheme.borders.radius.small);

        // Upgrade cost
        let costY = y + 110;
        if (currentLevel < 10) {
            try {
                const cost = this.enhancer.calculateUpgradeCost(item, currentLevel);
                
                const costTitle = UITheme.createText(this.scene, x + 20, costY, 'Upgrade Cost:', 'bodySmall');
                costTitle.setFontStyle('bold');
                
                const coinCost = UITheme.createText(this.scene, x + 20, costY + 25, `💰 ${cost.coins} Coins`, 'bodySmall');
                coinCost.setFontColor(UITheme.colors.gold);

                // Upgrade button
                const upgradeBtn = this.createButton(x + 175, y + 350, 200, 40, 'UPGRADE', () => {
                    this.performUpgrade();
                });

                this.contentContainer.add([costTitle, coinCost, upgradeBtn.bg, upgradeBtn.text]);
                costY += 60;
            } catch (error) {
                console.error('EquipmentEnhancementUI: Error calculating upgrade cost:', error);
                const errorText = UITheme.createText(this.scene, x + 20, costY, 'Error calculating upgrade cost', 'error');
                this.contentContainer.add(errorText);
            }
        } else {
            const maxLevelText = UITheme.createText(this.scene, x + 175, costY, 'MAX LEVEL REACHED', 'headerSmall');
            maxLevelText.setFontColor(UITheme.colors.gold);
            maxLevelText.setFontStyle('bold');
            this.contentContainer.add(maxLevelText);
        }

        // Stat preview
        if (currentLevel < 10) {
            this.createStatPreview(x + 20, costY, item, currentLevel + 1);
        }

        this.contentContainer.add([panelBg, title, levelDisplay, progressBg, progressFill]);
    }

    createEnhancementPanel(x, y) {
        if (!this.selectedItem) return;

        const item = this.selectedItem;
        const currentEnhancement = item.enhancement || 0;

        // Panel background
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(UITheme.colors.darkSecondary, 0.8);
        panelBg.fillRoundedRect(x, y, 350, 400, UITheme.borders.radius.small);
        panelBg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
        panelBg.strokeRoundedRect(x, y, 350, 400, UITheme.borders.radius.small);

        // Title
        const title = UITheme.createText(this.scene, x + 175, y + 20, 'ENHANCE EQUIPMENT', 'headerSmall');
        title.setOrigin(0.5);

        // Current enhancement display
        const enhanceDisplay = UITheme.createText(this.scene, x + 20, y + 50, `Enhancement: +${currentEnhancement}/10`, 'bodySmall');

        // Enhancement stones selection
        this.createEnhancementStoneSelection(x + 20, y + 90);

        this.contentContainer.add([panelBg, title, enhanceDisplay]);
    }

    createActiveSetsPanel(x, y) {
        if (!this.enhancer) {
            console.error('EquipmentEnhancementUI: Cannot create active sets panel - enhancer not available');
            // Create error display panel
            const panelBg = this.scene.add.graphics();
            panelBg.fillStyle(UITheme.colors.darkSecondary, 0.8);
            panelBg.fillRoundedRect(x, y, 350, 400, UITheme.borders.radius.small);
            panelBg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
            panelBg.strokeRoundedRect(x, y, 350, 400, UITheme.borders.radius.small);

            const title = UITheme.createText(this.scene, x + 175, y + 20, 'SET BONUSES', 'headerSmall');
            title.setOrigin(0.5);

            const errorText = UITheme.createText(this.scene, x + 20, y + 60, 'Equipment Enhancement System\nnot available', 'error');
            errorText.setOrigin(0.5);

            this.contentContainer.add([panelBg, title, errorText]);
            return;
        }

        // Validate enhancer is operational
        if (!this.enhancer.isOperational || !this.enhancer.isOperational()) {
            console.warn('EquipmentEnhancementUI: Enhancer not operational');
            const panelBg = this.scene.add.graphics();
            panelBg.fillStyle(UITheme.colors.darkSecondary, 0.8);
            panelBg.fillRoundedRect(x, y, 350, 400, UITheme.borders.radius.small);
            panelBg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
            panelBg.strokeRoundedRect(x, y, 350, 400, UITheme.borders.radius.small);

            const title = UITheme.createText(this.scene, x + 175, y + 20, 'SET BONUSES', 'headerSmall');
            title.setOrigin(0.5);

            const errorText = UITheme.createText(this.scene, x + 20, y + 60, 'Equipment Enhancement System\nis not ready', 'warning');
            errorText.setOrigin(0.5);

            this.contentContainer.add([panelBg, title, errorText]);
            return;
        }

        let activeSets = {};
        let setBonuses = {};
        
        try {
            const setResult = this.enhancer.getActiveSetBonuses();
            activeSets = setResult.activeSets;
            setBonuses = setResult.setBonuses;
        } catch (error) {
            console.error('EquipmentEnhancementUI: Error getting set bonuses:', error);
        }

        // Panel background
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(UITheme.colors.darkSecondary, 0.8);
        panelBg.fillRoundedRect(x, y, 350, 400, UITheme.borders.radius.small);
        panelBg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
        panelBg.strokeRoundedRect(x, y, 350, 400, UITheme.borders.radius.small);

        // Title
        const title = UITheme.createText(this.scene, x + 175, y + 20, 'ACTIVE SET BONUSES', 'headerSmall');
        title.setOrigin(0.5);

        let contentY = y + 50;

        if (Object.keys(activeSets).length === 0) {
            const noSetsText = UITheme.createText(this.scene, x + 20, contentY, 'No active sets\nEquip matching items to activate set bonuses', 'bodySmall');
            this.contentContainer.add(noSetsText);
        } else {
            Object.entries(activeSets).forEach(([setId, setInfo]) => {
                // Set name
                const setName = UITheme.createText(this.scene, x + 20, contentY, setInfo.name, 'bodySmall');
                setName.setFontStyle('bold');
                setName.setFontColor(UITheme.colors.primary);

                // Set progress
                const setProgress = UITheme.createText(this.scene, x + 20, contentY + 20, `${setInfo.equippedPieces}/${setInfo.totalPieces} pieces equipped`, 'bodySmall');

                this.contentContainer.add([setName, setProgress]);
                contentY += 50;
            });

            // Total bonuses
            if (Object.keys(setBonuses).length > 0) {
                const bonusTitle = UITheme.createText(this.scene, x + 20, contentY, 'Total Set Bonuses:', 'bodySmall');
                bonusTitle.setFontStyle('bold');
                contentY += 25;

                Object.entries(setBonuses).forEach(([stat, value]) => {
                    const bonusText = UITheme.createText(this.scene, x + 30, contentY, `${stat}: +${value}`, 'bodySmall');
                    this.contentContainer.add(bonusText);
                    contentY += 20;
                });

                this.contentContainer.add(bonusTitle);
            }
        }

        this.contentContainer.add([panelBg, title]);
    }

    createAvailableSetsPanel(x, y) {
        // Panel background
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(UITheme.colors.darkSecondary, 0.8);
        panelBg.fillRoundedRect(x, y, 350, 400, UITheme.borders.radius.small);
        panelBg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
        panelBg.strokeRoundedRect(x, y, 350, 400, UITheme.borders.radius.small);

        // Title
        const title = UITheme.createText(this.scene, x + 175, y + 20, 'AVAILABLE SETS', 'headerSmall');
        title.setOrigin(0.5);

        let contentY = y + 50;

        // Check if enhancer and setData are available
        if (!this.enhancer || !this.enhancer.setData) {
            const errorText = UITheme.createText(this.scene, x + 20, contentY, 'Set data not available', 'error');
            this.contentContainer.add([panelBg, title, errorText]);
            return;
        }

        try {
            Object.entries(this.enhancer.setData).forEach(([setId, setInfo]) => {
                // Set name
                const setName = UITheme.createText(this.scene, x + 20, contentY, setInfo.name, 'bodySmall');
                setName.setFontStyle('bold');
                setName.setFontColor(this.getRarityColor(setInfo.rarity));

                // Set description
                const setDesc = UITheme.createText(this.scene, x + 20, contentY + 20, setInfo.description, 'bodySmall');
                setDesc.setWordWrap(310);

                this.contentContainer.add([setName, setDesc]);
                contentY += 70;
            });
        } catch (error) {
            console.error('EquipmentEnhancementUI: Error displaying available sets:', error);
            const errorText = UITheme.createText(this.scene, x + 20, contentY, 'Error loading set data', 'error');
            this.contentContainer.add(errorText);
        }

        this.contentContainer.add([panelBg, title]);
    }

    createSpecializationPanel(x, y) {
        if (!this.selectedItem) return;

        const item = this.selectedItem;

        // Panel background
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(UITheme.colors.darkSecondary, 0.8);
        panelBg.fillRoundedRect(x, y, 350, 400, UITheme.borders.radius.small);
        panelBg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
        panelBg.strokeRoundedRect(x, y, 350, 400, UITheme.borders.radius.small);

        // Title
        const title = UITheme.createText(this.scene, x + 175, y + 20, 'SPECIALIZATION', 'headerSmall');
        title.setOrigin(0.5);

        // Current specializations
        const currentSpecs = item.specializations || [];
        let contentY = y + 50;

        const currentTitle = UITheme.createText(this.scene, x + 20, contentY, `Current Specializations (${currentSpecs.length}/3):`, 'bodySmall');
        currentTitle.setFontStyle('bold');
        contentY += 25;

        if (currentSpecs.length === 0) {
            const noSpecsText = UITheme.createText(this.scene, x + 30, contentY, 'No specializations applied', 'bodySmall');
            this.contentContainer.add(noSpecsText);
            contentY += 20;
        } else {
            currentSpecs.forEach(specId => {
                const specText = UITheme.createText(this.scene, x + 30, contentY, `• ${specId}`, 'bodySmall');
                specText.setFontColor(UITheme.colors.primary);
                this.contentContainer.add(specText);
                contentY += 20;
            });
        }

        this.contentContainer.add([panelBg, title, currentTitle]);
    }

    createEnhancementStoneSelection(x, y) {
        const stones = this.enhancer.enhancementData.enhancementStones;
        let stoneY = y;

        Object.entries(stones).forEach(([stoneId, stoneData]) => {
            // Stone button
            const stoneBtn = this.createButton(x, stoneY, 310, 35, 
                `${stoneData.name} (${Math.floor(stoneData.successRate * 100)}%)`, 
                () => {
                    this.performEnhancement(stoneId);
                });

            this.contentContainer.add([stoneBtn.bg, stoneBtn.text]);
            stoneY += 45;
        });
    }

    createStatPreview(x, y, item, targetLevel) {
        const statIncrease = this.enhancer.calculateStatIncrease(item, targetLevel);
        
        const previewTitle = UITheme.createText(this.scene, x, y, 'Stat Increases:', 'bodySmall');
        previewTitle.setFontStyle('bold');
        
        let statY = y + 25;
        Object.entries(statIncrease).forEach(([stat, increase]) => {
            const statText = UITheme.createText(this.scene, x + 10, statY, `${stat}: +${increase}`, 'bodySmall');
            statText.setFontColor(UITheme.colors.primary);
            this.contentContainer.add(statText);
            statY += 18;
        });

        this.contentContainer.add(previewTitle);
    }

    createButton(x, y, width, height, text, callback) {
        const bg = this.scene.add.graphics();
        bg.fillStyle(UITheme.colors.primary, 0.8);
        bg.fillRoundedRect(x - width/2, y - height/2, width, height, UITheme.borders.radius.small);
        bg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
        bg.strokeRoundedRect(x - width/2, y - height/2, width, height, UITheme.borders.radius.small);

        const buttonText = UITheme.createText(this.scene, x, y, text, 'bodySmall');
        buttonText.setFontStyle('bold');

        const area = this.scene.add.rectangle(x, y, width, height)
            .setInteractive()
            .setAlpha(0);

        area.on('pointerdown', callback);
        area.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(UITheme.colors.medium, 0.9);
            bg.fillRoundedRect(x - width/2, y - height/2, width, height, UITheme.borders.radius.small);
            bg.lineStyle(UITheme.borders.width.thin, UITheme.colors.highlight);
            bg.strokeRoundedRect(x - width/2, y - height/2, width, height, UITheme.borders.radius.small);
        });
        area.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(UITheme.colors.primary, 0.8);
            bg.fillRoundedRect(x - width/2, y - height/2, width, height, UITheme.borders.radius.small);
            bg.lineStyle(UITheme.borders.width.thin, UITheme.colors.medium);
            bg.strokeRoundedRect(x - width/2, y - height/2, width, height, UITheme.borders.radius.small);
        });

        return { bg, text: buttonText, area };
    }

    performUpgrade() {
        if (!this.selectedItem) {
            this.showMessage('No item selected for upgrade', UITheme.colors.error);
            return;
        }

        if (!this.enhancer) {
            this.showMessage('Equipment Enhancement System not available', UITheme.colors.error);
            console.error('EquipmentEnhancementUI: Cannot perform upgrade - enhancer not available');
            return;
        }

        try {
            const result = this.enhancer.upgradeEquipment(
                this.selectedItem.category,
                this.selectedItem.id
            );

            if (result.success) {
                this.showMessage(`Successfully upgraded to level ${result.newLevel}!`, UITheme.colors.success);
                this.selectedItem.level = result.newLevel;
                this.refreshContent();
            } else {
                this.showMessage(`Upgrade failed: ${result.error}`, UITheme.colors.error);
            }
        } catch (error) {
            console.error('EquipmentEnhancementUI: Error during upgrade:', error);
            this.showMessage('Upgrade failed due to system error', UITheme.colors.error);
        }
    }

    performEnhancement(stoneId) {
        if (!this.selectedItem) {
            this.showMessage('No item selected for enhancement', UITheme.colors.error);
            return;
        }

        if (!this.enhancer) {
            this.showMessage('Equipment Enhancement System not available', UITheme.colors.error);
            console.error('EquipmentEnhancementUI: Cannot perform enhancement - enhancer not available');
            return;
        }

        try {
            const result = this.enhancer.enhanceEquipment(
                this.selectedItem.category,
                this.selectedItem.id,
                stoneId
            );

            if (result.success) {
                this.showMessage(`Enhancement successful! Now +${result.newEnhancement}`, UITheme.colors.success);
                this.selectedItem.enhancement = result.newEnhancement;
            } else {
                let message = 'Enhancement failed!';
                if (result.penalty === 'destroyed') {
                    message = 'Enhancement failed - Item destroyed!';
                } else if (result.penalty === 'downgrade') {
                    message = `Enhancement failed - Downgraded to +${result.newEnhancement}`;
                }
                this.showMessage(message, UITheme.colors.error);
            }
            
            this.refreshContent();
        } catch (error) {
            console.error('EquipmentEnhancementUI: Error during enhancement:', error);
            this.showMessage('Enhancement failed due to system error', UITheme.colors.error);
        }
    }

    showMessage(text, color = UITheme.colors.text) {
        // Create a temporary message
        const message = UITheme.createText(this.scene, this.width / 2, 50, text, 'bodySmall');
        message.setFontColor(color);
        message.setFontStyle('bold');
        
        this.container.add(message);
        
        // Fade out and remove after 3 seconds
        this.scene.tweens.add({
            targets: message,
            alpha: 0,
            duration: 3000,
            onComplete: () => message.destroy()
        });
    }

    getRarityColor(rarity) {
        const colors = {
            1: '#ffffff',
            2: '#4a90e2', 
            3: '#9b59b6',
            4: '#e74c3c',
            5: '#f39c12'
        };
        return colors[rarity] || '#ffffff';
    }

    setupEventListeners() {
        if (this.enhancer) {
            this.enhancer.on('equipmentUpgraded', () => this.refreshContent());
            this.enhancer.on('equipmentEnhanced', () => this.refreshContent());
            this.enhancer.on('specializationApplied', () => this.refreshContent());
        }
    }

    show() {
        console.log('EquipmentEnhancementUI: Showing Equipment Enhancement UI');
        
        // Double-check that we have required dependencies
        if (!this.enhancer && this.scene.gameState?.inventoryManager) {
            console.log('EquipmentEnhancementUI: Enhancer missing, attempting to create one');
            try {
                // Try to import and create enhancer synchronously if possible
                if (window.EquipmentEnhancer) {
                    this.enhancer = new window.EquipmentEnhancer(this.scene.gameState, this.scene.gameState.inventoryManager);
                    this.scene.equipmentEnhancer = this.enhancer;
                    console.log('EquipmentEnhancementUI: Created enhancer from global reference');
                } else {
                    // Import asynchronously
                    import('../scripts/EquipmentEnhancer.js').then(module => {
                        const EquipmentEnhancer = module.default || module.EquipmentEnhancer;
                        this.enhancer = new EquipmentEnhancer(this.scene.gameState, this.scene.gameState.inventoryManager);
                        this.scene.equipmentEnhancer = this.enhancer;
                        console.log('EquipmentEnhancementUI: Created enhancer via async import');
                        
                        // Refresh content now that we have enhancer
                        if (this.isVisible) {
                            this.refreshContent();
                        }
                    }).catch(error => {
                        console.error('EquipmentEnhancementUI: Failed to create enhancer:', error);
                    });
                }
            } catch (error) {
                console.error('EquipmentEnhancementUI: Error creating enhancer:', error);
            }
        }

        // Update inventory manager reference
        if (!this.inventoryManager && this.scene.gameState?.inventoryManager) {
            this.inventoryManager = this.scene.gameState.inventoryManager;
            console.log('EquipmentEnhancementUI: Updated inventory manager reference');
        }

        this.isVisible = true;
        this.container.setVisible(true);
        
        // Reset selected item when showing
        this.selectedItem = null;
        
        this.refreshContent();
        
        console.log('EquipmentEnhancementUI: UI shown with enhancer:', !!this.enhancer, 'and inventoryManager:', !!this.inventoryManager);
    }

    hide() {
        this.isVisible = false;
        this.container.setVisible(false);
        this.selectedItem = null;
    }

    destroy() {
        if (this.container) {
            this.container.destroy();
        }
    }
} 