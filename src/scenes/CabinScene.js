/**
 * CabinScene - Boat Cabin Romance Meter System
 * Cozy cabin interface for interacting with NPCs and tracking romance progress
 */

import HCGUnlockSystem from '../scripts/HCGUnlockSystem.js';
import HCGNotificationManager from '../scripts/HCGNotificationManager.js';
import Phaser from 'phaser';
import UITheme from '../ui/UITheme.js';
import GameState from '../scripts/GameState.js';

export default class CabinScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CabinScene' });
        
        // Core data
        this.npcs = new Map();
        this.gameState = null;
        this.dialogManager = null;
        
        // UI state
        this.selectedNPC = null;
        this.messages = [];
        this.romanceDisplayData = {};
        
        // UI elements
        this.uiContainer = null;
        this.npcPanel = null;
        this.chatPanel = null;
        this.romancePanel = null;
        this.cabinBackground = null;
        
        // Elegant Classic Cabin theme colors (Black, Gray, Silver, Gold)
        this.cabinColors = {
            // Gold accents for luxury touches
            gold: 0xFFD700,                       // Pure gold for highlights
            goldDark: 0xB8860B,                   // Dark gold for borders
            goldLight: 0xFFF8DC,                  // Light gold for subtle highlights
            
            // Silver metallic elements
            silver: 0xC0C0C0,                     // Silver for frames and borders
            silverDark: 0x808080,                 // Dark silver for depth
            silverLight: 0xE5E5E5,               // Light silver for highlights
            
            // Black sophistication
            black: 0x000000,                      // Pure black for backgrounds
            blackSoft: 0x1a1a1a,                 // Soft black for panels
            charcoal: 0x2F2F2F,                  // Charcoal for contrasts
            
            // Gray elegance
            gray: 0x808080,                       // Medium gray
            grayLight: 0xD3D3D3,                 // Light gray for text
            grayDark: 0x404040,                  // Dark gray for borders
            
            // Classic cabin atmosphere
            background: 0x0F0F0F,                 // Very dark background
            panel: 0x1a1a1a,                     // Dark panel backgrounds
            text: 0xFFD700,                      // Gold text
            textSecondary: 0xC0C0C0              // Silver secondary text
        };
    }

    init(data) {
        this.callingScene = data.callingScene || 'GameScene';
        this.selectedNPC = data.selectedNPC || null;
        
        // Initialize HCG systems
        this.hcgUnlockSystem = new HCGUnlockSystem();
        this.hcgNotificationManager = new HCGNotificationManager(this);
    }

    async create() {
        const { width, height } = this.cameras.main;
        
        // Hide fish button when cabin is opened
        if (this.scene.get('BoatMenuScene') && this.scene.get('BoatMenuScene').hideFishButton) {
            this.scene.get('BoatMenuScene').hideFishButton();
        }
        
        // Initialize GameState first
        this.gameState = GameState.getInstance();
        
        // Initialize audio manager for this scene
        this.audioManager = this.gameState.getAudioManager(this);
        if (this.audioManager) {
            this.audioManager.setSceneAudio('CabinScene');
            console.log('CabinScene: Audio manager initialized');
        } else {
            console.warn('CabinScene: Audio manager not available');
        }
        
        // Create cabin background with wood textures
        this.createCabinBackground(width, height);
        
        // Get references - try multiple sources for DialogManager
        this.gameScene = this.scene.get('GameScene');
        this.dialogManager = this.gameScene?.dialogManager;
        
        // If DialogManager not available from GameScene, create a robust fallback
        if (!this.dialogManager) {
            console.log('CabinScene: DialogManager not available from GameScene, creating enhanced fallback');
            this.dialogManager = this.createFallbackDialogManager();
            console.log('CabinScene: Fallback DialogManager created with', this.dialogManager.npcs.size, 'NPCs');
        }

        // Initialize UI
        this.createCabinUI();
        this.setupEventListeners();
        
        // Auto-select first NPC if none selected
        if (!this.selectedNPC && this.dialogManager && this.dialogManager.npcs) {
            const npcs = Array.from(this.dialogManager.npcs.keys());
            if (npcs.length > 0) {
                this.selectedNPC = npcs[0];
                console.log('CabinScene: Auto-selected NPC in create():', this.selectedNPC);
            }
        }
        
        this.refreshCabin();
        
        console.log('CabinScene: Boat Cabin initialized');
    }

    createCabinBackground(width, height) {
        // Elegant black background
        this.add.rectangle(width/2, height/2, width, height, this.cabinColors.black, 1);
        
        // Luxury cabin floor (black marble with silver veining)
        const floorBg = this.add.graphics();
        floorBg.fillStyle(this.cabinColors.blackSoft, 1);
        floorBg.fillRect(0, height * 0.7, width, height * 0.3);
        
        // Add marble veining texture to floor
        for (let i = 0; i < 8; i++) {
            const veinLine = this.add.graphics();
            veinLine.lineStyle(2, this.cabinColors.silver, 0.4);
            veinLine.lineBetween(0, height * 0.7 + (i * 30), width, height * 0.7 + (i * 30));
            
            // Add silver marble accents
            for (let j = 0; j < 5; j++) {
                const accent = this.add.graphics();
                accent.fillStyle(this.cabinColors.silverDark, 0.6);
                accent.fillCircle(j * (width/5) + 50, height * 0.7 + (i * 30) + 15, 2);
            }
        }
        
        // Elegant cabin walls (charcoal with silver trim)
        const wallBg = this.add.graphics();
        wallBg.fillStyle(this.cabinColors.charcoal, 1);
        wallBg.fillRect(0, 0, width, height * 0.7);
        
        // Add sophisticated paneling with silver accents
        for (let i = 0; i < 15; i++) {
            const panelLine = this.add.graphics();
            panelLine.lineStyle(1, this.cabinColors.silverDark, 0.5);
            panelLine.lineBetween(i * (width/15), 0, i * (width/15), height * 0.7);
        }
        
        // Elegant cabin windows (portholes with gold frames)
        this.createPorthole(width * 0.15, height * 0.25, 60);
        this.createPorthole(width * 0.85, height * 0.25, 60);
        
        // Luxury ceiling with gold accents
        const ceilingBg = this.add.graphics();
        ceilingBg.fillStyle(this.cabinColors.blackSoft, 1);
        ceilingBg.fillRect(0, 0, width, 40);
        
        // Gold ceiling beams
        for (let i = 0; i < 4; i++) {
            const beam = this.add.graphics();
            beam.fillStyle(this.cabinColors.goldDark, 0.8);
            beam.fillRect(i * (width/4) + 20, 0, 30, 40);
            
            // Silver beam highlights
            const beamHighlight = this.add.graphics();
            beamHighlight.fillStyle(this.cabinColors.silver, 0.3);
            beamHighlight.fillRect(i * (width/4) + 22, 2, 26, 4);
        }
        
        // Elegant ambient lighting with gold warmth
        const lightGlow = this.add.graphics();
        lightGlow.fillStyle(this.cabinColors.gold, 0.08);
        lightGlow.fillCircle(width/2, height/2, width * 0.6);
        
        // Add silver accent lighting
        const silverGlow = this.add.graphics();
        silverGlow.fillStyle(this.cabinColors.silver, 0.05);
        silverGlow.fillCircle(width/2, height/2, width * 0.4);
        
        // Add elegant nautical decorations
        this.addNauticalDecorations(width, height);
    }

    createPorthole(x, y, radius) {
        // Elegant gold porthole frame
        const frame = this.add.graphics();
        frame.fillStyle(this.cabinColors.gold, 1);
        frame.fillCircle(x, y, radius + 8);
        
        // Inner silver frame
        const innerFrame = this.add.graphics();
        innerFrame.fillStyle(this.cabinColors.silver, 0.9);
        innerFrame.fillCircle(x, y, radius + 4);
        
        // Porthole glass (dark sophisticated view)
        const glass = this.add.graphics();
        glass.fillStyle(this.cabinColors.black, 0.9);
        glass.fillCircle(x, y, radius);
        
        // Elegant view through porthole (starry night)
        const star1 = this.add.graphics();
        star1.fillStyle(this.cabinColors.silver, 0.8);
        star1.fillCircle(x - radius * 0.4, y - radius * 0.3, 2);
        
        const star2 = this.add.graphics();
        star2.fillStyle(this.cabinColors.gold, 0.6);
        star2.fillCircle(x + radius * 0.3, y - radius * 0.5, 1.5);
        
        const star3 = this.add.graphics();
        star3.fillStyle(this.cabinColors.silverLight, 0.7);
        star3.fillCircle(x + radius * 0.2, y + radius * 0.4, 1);
        
        // Sophisticated reflection
        const reflection = this.add.graphics();
        reflection.fillStyle(this.cabinColors.silverLight, 0.3);
        reflection.fillCircle(x - radius * 0.4, y - radius * 0.4, radius * 0.25);
    }

    addNauticalDecorations(width, height) {
        // Ship's wheel on left wall
        const wheelX = 80;
        const wheelY = height * 0.4;
        this.createShipsWheel(wheelX, wheelY, 40);
        
        // Anchor on right wall
        const anchorX = width - 80;
        const anchorY = height * 0.4;
        this.createAnchor(anchorX, anchorY, 35);
        
        // Rope details
        this.createRopeDetail(width * 0.1, height * 0.6, width * 0.9, height * 0.6);
        
        // Lantern hanging from ceiling
        this.createLantern(width/2, 60);
    }

    createShipsWheel(x, y, radius) {
        // Elegant wheel rim (gold)
        const rim = this.add.graphics();
        rim.lineStyle(6, this.cabinColors.gold, 1);
        rim.strokeCircle(x, y, radius);
        
        // Sophisticated wheel spokes (silver)
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const spoke = this.add.graphics();
            spoke.lineStyle(4, this.cabinColors.silver, 1);
            spoke.lineBetween(
                x + Math.cos(angle) * radius * 0.3,
                y + Math.sin(angle) * radius * 0.3,
                x + Math.cos(angle) * radius * 0.9,
                y + Math.sin(angle) * radius * 0.9
            );
        }
        
        // Center hub (charcoal)
        const hub = this.add.graphics();
        hub.fillStyle(this.cabinColors.charcoal, 1);
        hub.fillCircle(x, y, radius * 0.3);
    }

    createAnchor(x, y, size) {
        // Anchor shaft
        const shaft = this.add.graphics();
        shaft.lineStyle(6, 0x2c3e50, 1);
        shaft.lineBetween(x, y - size, x, y + size);
        
        // Anchor arms
        const arms = this.add.graphics();
        arms.lineStyle(5, 0x2c3e50, 1);
        arms.lineBetween(x - size * 0.7, y + size * 0.5, x + size * 0.7, y + size * 0.5);
        
        // Anchor flukes
        const fluke1 = this.add.graphics();
        fluke1.lineStyle(4, 0x2c3e50, 1);
        fluke1.lineBetween(x - size * 0.7, y + size * 0.5, x - size * 0.9, y + size * 0.8);
        
        const fluke2 = this.add.graphics();
        fluke2.lineStyle(4, 0x2c3e50, 1);
        fluke2.lineBetween(x + size * 0.7, y + size * 0.5, x + size * 0.9, y + size * 0.8);
        
        // Anchor ring
        const ring = this.add.graphics();
        ring.lineStyle(4, 0x2c3e50, 1);
        ring.strokeCircle(x, y - size, size * 0.3);
    }

    createRopeDetail(x1, y1, x2, y2) {
        const rope = this.add.graphics();
        rope.lineStyle(8, this.cabinColors.goldDark, 1); // Elegant dark gold rope
        
        // Create wavy rope pattern
        const segments = 20;
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t + Math.sin(t * Math.PI * 4) * 10;
            points.push(new Phaser.Math.Vector2(x, y));
        }
        rope.strokePoints(points);
    }

    createLantern(x, y) {
        // Elegant lantern body (gold)
        const body = this.add.graphics();
        body.fillStyle(this.cabinColors.gold, 1);
        body.fillRoundedRect(x - 15, y, 30, 40, 5);
        
        // Sophisticated lantern glass (warm gold light)
        const glass = this.add.graphics();
        glass.fillStyle(this.cabinColors.goldLight, 0.7);
        glass.fillRoundedRect(x - 12, y + 3, 24, 34, 3);
        
        // Lantern top (charcoal)
        const top = this.add.graphics();
        top.fillStyle(this.cabinColors.charcoal, 1);
        top.fillRoundedRect(x - 18, y - 8, 36, 8, 4);
        
        // Silver hanging chain
        const chain = this.add.graphics();
        chain.lineStyle(2, this.cabinColors.silver, 1);
        chain.lineBetween(x, 20, x, y - 8);
    }

    createCabinUI() {
        const { width, height } = this.cameras.main;
        
        // Main container
        this.cabinContainer = this.add.container(0, 0);
        
        // Header bar
        this.createHeaderBar();
        
        // Three-panel layout with cabin styling
        this.createNPCListPanel();    // Left panel - NPC list with romance meters
        this.createChatPanel();       // Center panel - Chat messages
        this.createRomancePanel();    // Right panel - Romance details and actions
        
        // ADD MIA'S CENTER PORTRAIT DISPLAY
        this.createCenterMiaPortrait();
        
        // Bottom input area
        this.createInputArea();
        
        // Navigation
        this.createNavigationButtons();
        this.createAlbumButton(); // Add album button
    }

    createHeaderBar() {
        const { width } = this.cameras.main;
        
        // Elegant header background (black with gold trim)
        const headerBg = this.add.graphics();
        headerBg.fillStyle(this.cabinColors.blackSoft, 0.95);
        headerBg.fillRect(0, 40, width, 60);
        headerBg.lineStyle(3, this.cabinColors.gold, 0.9);
        headerBg.strokeRect(0, 98, width, 2);
        
        // Silver accent lines on header
        for (let i = 0; i < 3; i++) {
            const accentLine = this.add.graphics();
            accentLine.lineStyle(1, this.cabinColors.silver, 0.4);
            accentLine.lineBetween(0, 50 + i * 15, width, 50 + i * 15);
        }
        
        // Elegant title with sophisticated styling
        this.headerTitle = this.add.text(width/2, 70, '⚓ Boat Cabin', {
            fontSize: '28px',
            fontFamily: 'Georgia, serif',
            fill: '#FFD700',  // Pure gold
            fontStyle: 'bold',
            stroke: '#000000',  // Black stroke for contrast
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Sophisticated subtitle
        this.headerSubtitle = this.add.text(width/2, 90, 'Cozy quarters with your fishing companions', {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            fill: '#C0C0C0',  // Silver text
            fontStyle: 'italic'
        }).setOrigin(0.5);
    }

    createNPCListPanel() {
        const { height } = this.cameras.main;
        const panelWidth = 280;
        const panelHeight = height - 180;
        const panelY = 110;
        const panelX = 10;
        
        this._createStyledPanel(panelX, panelY, panelWidth, panelHeight, '🏖️ Cabin Guests');
        
        // NPC list container
        this.npcListContainer = this.add.container(15, panelY + 50);
        console.log(`CabinScene: Created NPC list container at position (15, ${panelY + 50})`);
        
        this.refreshNPCList();
    }

    refreshNPCList() {
        // Clear existing list
        this.npcListContainer.removeAll(true);
        
        // Clean up any direct portraits from previous refresh
        if (this.directPortraits) {
            this.directPortraits.forEach(portrait => {
                if (portrait && portrait.destroy) {
                    portrait.destroy();
                }
            });
            this.directPortraits = [];
        }
        
        // Clean up any absolute portraits from previous refresh
        if (this.absolutePortraits) {
            this.absolutePortraits.forEach(portrait => {
                if (portrait && portrait.destroy) {
                    portrait.destroy();
                }
            });
            this.absolutePortraits = [];
        }
        
        if (!this.dialogManager || !this.dialogManager.npcs) {
            console.warn('CabinScene: DialogManager or NPCs not available for list refresh');
            return;
        }
        
        const npcs = Array.from(this.dialogManager.npcs.values());
        console.log('CabinScene: Refreshing NPC list with', npcs.length, 'NPCs:', npcs.map(n => n.name));
        
        const itemHeight = 90;
        
        npcs.forEach((npc, index) => {
            const y = index * (itemHeight + 10);
            const npcItem = this.createNPCListItem(npc, 0, y);
            if (npcItem) {
                this.npcListContainer.add(npcItem);
                console.log(`CabinScene: Added ${npc.name} to NPC list at position ${y}. Container has ${this.npcListContainer.list.length} items`);
            } else {
                console.error(`CabinScene: Failed to create NPC item for ${npc.name}`);
            }
        });
        
        // Auto-select first NPC if none selected and NPCs are available
        if (!this.selectedNPC && npcs.length > 0) {
            this.selectedNPC = npcs[0].id;
            console.log('CabinScene: Auto-selected NPC:', this.selectedNPC);
        }
    }

    createNPCListItem(npc, x, y) {
        const itemWidth = 250;
        const itemHeight = 85;
        
        // NPC container
        const npcItem = this.add.container(x, y);
        
        // Background (wood panel with selection highlight)
        const itemBg = this.add.graphics();
        const isSelected = this.selectedNPC === npc.id;
        
        if (isSelected) {
            itemBg.fillStyle(this.cabinColors.gold, 0.3); // Elegant gold highlight
            itemBg.lineStyle(2, this.cabinColors.gold, 0.9);
        } else {
            itemBg.fillStyle(this.cabinColors.blackSoft, 0.8); // Sophisticated black
            itemBg.lineStyle(1, this.cabinColors.silver, 0.6);
        }
        
        itemBg.fillRoundedRect(0, 0, itemWidth, itemHeight, 8);
        itemBg.strokeRoundedRect(0, 0, itemWidth, itemHeight, 8);
        itemBg.setDepth(1); // Background depth
        npcItem.add(itemBg);
        
        // NPC portrait with enhanced fallbacks (prioritize actual images)
        const portraitKeys = [
            `mia-portrait`,           // Actual Mia portrait image (highest priority)
            `portrait-mia`,           // Alternative actual portrait name
            `mia-full`,               // Another Mia variant
            `mia-portrait-alt`,       // Alternative path test
            `mia-portrait-public`,    // Public path test
            `${npc.id}-portrait`,     // Generated in PreloadScene
            `portrait-${npc.id}`,     // Alternative generated name
            `mia-normal`,             // Mia variant
            `npc-assistant-1`,        // Generic assistant
            npc.portrait              // NPC's assigned portrait
        ].filter(key => key); // Remove undefined keys
        
        // Debug: check which textures are available
        const availableTextures = portraitKeys.filter(key => this.textures.exists(key));
        console.log(`CabinScene: Available textures for ${npc.name}:`, availableTextures);
        
        let portraitAdded = false;
        
        // SIMPLIFIED APPROACH: Create Mia portrait directly on scene at absolute world coordinates
        if (npc.id === 'mia') {
            for (const key of portraitKeys) {
                if (this.textures.exists(key) && (key.includes('mia-portrait') || key.includes('portrait-mia') || key.includes('mia-full'))) {
                    try {
                        console.log(`🎯 CabinScene: Creating Mia portrait with key '${key}' using ABSOLUTE positioning`);
                        
                        // Calculate exact world position where the portrait should appear
                        // NPC list container is at (15, panelY + 50), item is at (0, y), portrait should be at (30, 42) within item
                        const worldX = 15 + 0 + 30;  // container.x + item.x + portrait.x
                        const worldY = (110 + 50) + y + 42;  // container.y + item.y + portrait.y
                        
                        // Create portrait directly on the main scene (not in any container)
                        const miaPortrait = this.add.image(worldX, worldY, key);
                        miaPortrait.setOrigin(0.5);
                        miaPortrait.setDisplaySize(50, 60);
                        miaPortrait.setVisible(true);
                        miaPortrait.setAlpha(1);
                        miaPortrait.setDepth(20000);  // Extremely high depth to ensure visibility
                        
                        console.log(`✅ CabinScene: Mia portrait '${key}' created with ABSOLUTE positioning - world coordinates: (${worldX}, ${worldY}), depth: ${miaPortrait.depth}`);
                        
                        // Store reference for cleanup
                        if (!this.absolutePortraits) this.absolutePortraits = [];
                        this.absolutePortraits.push(miaPortrait);
                        
                        portraitAdded = true;
                        break;
                    } catch (error) {
                        console.error(`❌ CabinScene: Error creating absolute portrait with key '${key}':`, error);
                    }
                }
            }
        }
        
        // If no actual image was found for any NPC, just log it - NO FALLBACK
        if (!portraitAdded) {
            console.log(`❌ CabinScene: No actual portrait image found for ${npc.name}. Available keys:`, portraitKeys.filter(key => this.textures.exists(key)));
        }
        
        // NPC name
        const nameText = this.add.text(55, 15, npc.name, {
            fontSize: '16px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700',
            fontStyle: 'bold'
        });
        nameText.setDepth(10);  // Above background but below portrait
        npcItem.add(nameText);
        
        // Relationship status
        const relationshipText = this.add.text(55, 32, `💗 ${npc.relationship}`, {
            fontSize: '12px',
            fontFamily: 'Georgia, serif',
            fill: '#daa520'
        });
        relationshipText.setDepth(10);
        npcItem.add(relationshipText);
        
        // Quest Indicator Logic
        const questManager = this.gameState?.questManager;
        let questIndicatorIcon = null;

        if (questManager) {
            const availableQuests = questManager.getAvailableQuestsForNPC?.(npc.id) || [];
            const completableQuests = questManager.getQuestsReadyForTurnInForNPC?.(npc.id) || [];

            if (completableQuests.length > 0) {
                questIndicatorIcon = UITheme.createText(this, itemWidth - 20, 15, '?', 'headerSmall');
                questIndicatorIcon.setColor(UITheme.colors.success); // Green for completable
            } else if (availableQuests.length > 0) {
                questIndicatorIcon = UITheme.createText(this, itemWidth - 20, 15, '!', 'headerSmall');
                questIndicatorIcon.setColor(UITheme.colors.warning); // Yellow for available
            }

            if (questIndicatorIcon) {
                questIndicatorIcon.setOrigin(0.5).setDepth(20);  // Above everything
                npcItem.add(questIndicatorIcon);
            }
        }
        // End Quest Indicator Logic
        
        const romanceMeter = this._createRomanceMeter(53, 46, 154, 16, npc.romanceMeter, npc.maxRomance);
        npcItem.add(romanceMeter);
        
        // Romance meter percentage
        const percentText = this.add.text(210, 54, `${Math.floor(npc.romanceMeter / npc.maxRomance * 100)}%`, {
            fontSize: '11px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700'
        }).setOrigin(0.5);
        percentText.setDepth(10);
        npcItem.add(percentText);
        
        // Presence indicator (lantern style)
        const presenceFrame = this.add.graphics();
        presenceFrame.fillStyle(0xb8860b, 0.9);
        presenceFrame.fillCircle(220, 20, 6);
        presenceFrame.setDepth(8);
        npcItem.add(presenceFrame);
        
        const statusDot = this.add.graphics();
        statusDot.fillStyle(0xffd700, 0.9); // Golden = present in cabin
        statusDot.fillCircle(220, 20, 4);
        statusDot.setDepth(9);
        npcItem.add(statusDot);
        
        // Make interactive
        const hitArea = this.add.rectangle(itemWidth/2, itemHeight/2, itemWidth, itemHeight, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', () => {
            this.selectNPC(npc.id);
        });
        npcItem.add(hitArea);
        
        // Hover effects (warm glow)
        hitArea.on('pointerover', () => {
            if (!isSelected) {
                itemBg.clear();
                itemBg.fillStyle(0xdaa520, 0.3);
                itemBg.lineStyle(2, 0xffd700, 0.6);
                itemBg.fillRoundedRect(0, 0, itemWidth, itemHeight, 8);
                itemBg.strokeRoundedRect(0, 0, itemWidth, itemHeight, 8);
            }
        });
        
        hitArea.on('pointerout', () => {
            if (!isSelected) {
                itemBg.clear();
                itemBg.fillStyle(0x654321, 0.3);
                itemBg.lineStyle(1, 0x8B4513, 0.6);
                itemBg.fillRoundedRect(0, 0, itemWidth, itemHeight, 8);
                itemBg.strokeRoundedRect(0, 0, itemWidth, itemHeight, 8);
            }
        });
        
        // Return the NPC item container so it can be added to the list
        return npcItem;
    }

    createChatPanel() {
        const { width, height } = this.cameras.main;
        const panelX = 300;
        const panelWidth = width - 600;
        const panelHeight = height - 180;
        const panelY = 110;
        
        this._createStyledPanel(panelX, panelY, panelWidth, panelHeight, '');

        // Chat header
        this.createChatHeader(panelX, panelY, panelWidth);
        
        // Chat messages area
        this.chatMessagesContainer = this.add.container(panelX + 10, panelY + 60);
        
        // Create scroll area for messages
        this.chatScrollY = 0;
        this.maxChatScroll = 0;
        this.chatAreaHeight = panelHeight - 120;
        this.chatAreaWidth = panelWidth - 20;
        
        // Add scroll mask
        const chatMask = this.add.graphics();
        chatMask.fillStyle(0xffffff);
        chatMask.fillRect(panelX + 10, panelY + 60, this.chatAreaWidth, this.chatAreaHeight);
        this.chatMessagesContainer.setMask(chatMask.createGeometryMask());
    }

    createChatHeader(x, y, width) {
        // Chat partner info with cabin styling
        if (this.selectedNPC) {
            const npc = this.dialogManager.getNPC(this.selectedNPC);
            if (npc) {
                // Active presence indicator (lantern style)
                const activeFrame = this.add.graphics();
                activeFrame.fillStyle(0xb8860b, 0.9);
                activeFrame.fillCircle(x + 25, y + 25, 8);
                
                const activeIndicator = this.add.graphics();
                activeIndicator.fillStyle(0xffd700, 0.9);
                activeIndicator.fillCircle(x + 25, y + 25, 6);
                
                // Chat partner name
                this.chatHeaderName = this.add.text(x + 40, y + 15, `⚓ ${npc.name}`, {
                    fontSize: '18px',
                    fontFamily: 'Georgia, serif',
                    fill: '#ffd700',
                    fontStyle: 'bold',
                    stroke: '#654321',
                    strokeThickness: 1
                });
                
                // Status text
                this.chatHeaderStatus = this.add.text(x + 40, y + 35, `${npc.relationship} • In Cabin`, {
                    fontSize: '12px',
                    fontFamily: 'Georgia, serif',
                    fill: '#daa520'
                });
            }
        }
    }

    createRomancePanel() {
        const { width, height } = this.cameras.main;
        const panelX = width - 290;
        const panelWidth = 280;
        const panelHeight = height - 180;
        const panelY = 110;

        this._createStyledPanel(panelX, panelY, panelWidth, panelHeight, '💕 Romance Details');
        
        // Romance details container
        this.romanceDetailsContainer = this.add.container(panelX + 15, panelY + 50);
        
        this.refreshRomancePanel();
    }

    refreshRomancePanel() {
        // Clear existing content
        this.romanceDetailsContainer.removeAll(true);
        
        if (!this.selectedNPC) {
            console.log('CabinScene: No NPC selected for romance panel');
            return;
        }
        
        if (!this.dialogManager || !this.dialogManager.getNPC) {
            console.warn('CabinScene: DialogManager not available for romance panel');
            return;
        }
        
        const npc = this.dialogManager.getNPC(this.selectedNPC);
        if (!npc) {
            console.warn('CabinScene: NPC not found for romance panel:', this.selectedNPC);
            return;
        }
        
        console.log('CabinScene: Refreshing romance panel for', npc.name);
        
        let y = 0;
        
        // NPC portrait (brass frame style)
        const portraitFrame = this.add.graphics();
        portraitFrame.fillStyle(0xb8860b, 0.9);
        portraitFrame.fillRoundedRect(85, y, 80, 100, 10);
        portraitFrame.lineStyle(3, 0xdaa520, 0.8);
        portraitFrame.strokeRoundedRect(85, y, 80, 100, 10);
        this.romanceDetailsContainer.add(portraitFrame);
        
        const portraitBg = this.add.graphics();
        portraitBg.fillStyle(0x8B4513, 0.8);
        portraitBg.fillRoundedRect(88, y + 3, 74, 94, 8);
        this.romanceDetailsContainer.add(portraitBg);
        
        // Try to use actual portrait for the romance panel
        let portraitAdded = false;
        const romancePortraitKeys = ['mia-portrait', 'portrait-mia', 'mia-full'];
        
        for (const key of romancePortraitKeys) {
            if (key && this.textures.exists(key)) {
                try {
                    const romancePortrait = this.add.image(125, y + 50, key);
                    romancePortrait.setDisplaySize(70, 90);
                    romancePortrait.setOrigin(0.5);
                    romancePortrait.setDepth(15000);
                    
                    // Make sure it's visible
                    romancePortrait.setVisible(true);
                    romancePortrait.setAlpha(1);
                    
                    this.romanceDetailsContainer.add(romancePortrait);
                    portraitAdded = true;
                    console.log(`🔍 CabinScene: Romance portrait '${key}' positioned at (${romancePortrait.x}, ${romancePortrait.y}) size ${romancePortrait.displayWidth}x${romancePortrait.displayHeight}`);
                    console.log(`CabinScene: Added romance portrait '${key}' for ${npc.name} with depth 15000`);
                    break;
                } catch (error) {
                    console.error(`CabinScene: Error creating romance portrait:`, error);
                }
            }
        }
        
        // Fallback to initial if no portrait found
        if (!portraitAdded) {
            const portraitName = this.add.text(125, y + 50, npc.name[0], {
                fontSize: '36px',
                fontFamily: 'Georgia, serif',
                fill: '#ffd700',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            this.romanceDetailsContainer.add(portraitName);
        }
        
        y += 120;
        
        // Romance meter section
        const romanceMeterTitle = this.add.text(0, y, '💗 Romance Meter', {
            fontSize: '16px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700',
            fontStyle: 'bold'
        });
        this.romanceDetailsContainer.add(romanceMeterTitle);
        
        y += 25;
        
        // Large romance meter (brass style)
        const largeMeter = this._createRomanceMeter(0, y, 220, 20, npc.romanceMeter, npc.maxRomance);
        this.romanceDetailsContainer.add(largeMeter);
        
        // Romance meter values
        const meterText = this.add.text(110, y + 10, `${npc.romanceMeter}/${npc.maxRomance}`, {
            fontSize: '12px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.romanceDetailsContainer.add(meterText);
        
        y += 40;
        
        // Relationship status
        const statusTitle = this.add.text(0, y, '💞 Relationship Status', {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            fill: '#daa520',
            fontStyle: 'bold'
        });
        this.romanceDetailsContainer.add(statusTitle);
        
        y += 20;
        
        const statusText = this.add.text(0, y, npc.relationship.replace('_', ' ').toUpperCase(), {
            fontSize: '16px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700',
            fontStyle: 'bold'
        });
        this.romanceDetailsContainer.add(statusText);
        
        y += 40;
        
        // Quick actions
        this.createRomanceActions(y);
    }

    createRomanceActions(startY) {
        let y = startY;
        
        // Actions title
        const actionsTitle = this.add.text(0, y, '⚡ Cabin Activities', {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            fill: '#daa520',
            fontStyle: 'bold'
        });
        this.romanceDetailsContainer.add(actionsTitle);
        
        y += 30;
        
        // Action buttons with cabin theme
        const actions = [
            { text: '💬 Chat Together', action: () => this.sendQuickMessage('greeting') },
            { text: '🎁 Give Gift', action: () => this.giveGift() },
            { text: '🌹 Flirt', action: () => this.sendQuickMessage('flirt') },
            { text: '💕 Romantic Talk', action: () => this.sendQuickMessage('romantic') },
            { text: '🎣 Fishing Together', action: () => this.inviteFishing() },
        ];
        
        actions.forEach((actionData) => {
            this._createCabinButton(0, y, actionData.text, actionData.action, this.romanceDetailsContainer);
            y += 45;
        });
    }

    createInputArea() {
        const { width, height } = this.cameras.main;
        const inputY = height - 60;
        const inputX = 300;
        const inputWidth = width - 600;
        
        // Elegant input background (gold frame with charcoal interior)
        const inputFrame = this.add.graphics();
        inputFrame.fillStyle(this.cabinColors.gold, 0.9);
        inputFrame.fillRoundedRect(inputX - 3, inputY - 3, inputWidth + 6, 56, 12);
        
        const inputBg = this.add.graphics();
        inputBg.fillStyle(this.cabinColors.charcoal, 0.9);
        inputBg.fillRoundedRect(inputX, inputY, inputWidth, 50, 10);
        inputBg.lineStyle(2, this.cabinColors.silver, 0.8);
        inputBg.strokeRoundedRect(inputX, inputY, inputWidth, 50, 10);
        
        // Elegant message input placeholder
        this.messageInputText = this.add.text(inputX + 15, inputY + 25, 'Share your thoughts in the cabin...', {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            fill: '#C0C0C0',  // Silver text
            fontStyle: 'italic'
        }).setOrigin(0, 0.5);
        
        // Elegant send button (gold frame style)
        const sendFrame = this.add.graphics();
        sendFrame.fillStyle(this.cabinColors.gold, 0.9);
        sendFrame.fillRoundedRect(inputX + inputWidth - 63, inputY + 7, 56, 36, 10);
        
        const sendBg = this.add.graphics();
        sendBg.fillStyle(this.cabinColors.charcoal, 0.9);
        sendBg.fillRoundedRect(inputX + inputWidth - 60, inputY + 10, 50, 30, 8);
        
        const sendText = this.add.text(inputX + inputWidth - 35, inputY + 25, 'Send', {
            fontSize: '12px',
            fontFamily: 'Georgia, serif',
            fill: '#FFD700',  // Pure gold text
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Make send button interactive
        const sendHitArea = this.add.rectangle(inputX + inputWidth - 35, inputY + 25, 50, 30, 0x000000, 0);
        sendHitArea.setInteractive({ useHandCursor: true });
        sendHitArea.on('pointerdown', () => {
            this.sendMessage();
        });
    }

    createNavigationButtons() {
        const { width, height } = this.cameras.main;
        
        // Back button using UITheme
        const backButton = UITheme.createButton(this, 60, height - 32, 80, 35, '← Back', () => {
            this.exitCabin();
        }, 'secondary');
        
        // Full Dialog button using UITheme
        const dialogButton = UITheme.createButton(this, width - 79, height - 32, 110, 35, 'Full Dialog', () => {
            this.openFullDialog();
        }, 'primary');
        
        // Add cabin theming to buttons
        this.enhanceButtonWithCabinTheme(backButton.button, backButton.text);
        this.enhanceButtonWithCabinTheme(dialogButton.button, dialogButton.text);
    }
    
    enhanceButtonWithCabinTheme(buttonGraphics, buttonText) {
        // Apply cabin-specific theming to buttons
        buttonText.setFontFamily('Georgia, serif');
        buttonText.setColor(this.cabinColors.brass);
        buttonText.setFontStyle('bold');
    }

    createAlbumButton() {
        const { width, height } = this.cameras.main;
        
        // Album button positioned near navigation
        const albumButton = this.add.rectangle(180, height - 30, 120, 35, 0x4a148c, 0.9);
        albumButton.setStrokeStyle(2, 0xffd700, 1);
        
        // Check for new HCGs
        const newHCGCount = this.hcgUnlockSystem.getNewHCGCount();
        const albumText = newHCGCount > 0 ? 
            `📖 Album (${newHCGCount})` : 
            '📖 Album';
        
        this.albumButtonText = this.add.text(180, height - 30, albumText, {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700'
        }).setOrigin(0.5);
        
        // New content notification badge
        if (newHCGCount > 0) {
            this.albumBadge = this.add.circle(230, height - 45, 8, 0xff4444);
            this.albumBadge.setStrokeStyle(1, 0xffffff);
            
            const badgeText = this.add.text(230, height - 45, newHCGCount.toString(), {
                fontSize: '10px',
                fill: '#ffffff',
                fontWeight: 'bold'
            }).setOrigin(0.5);
        }
        
        albumButton.setInteractive();
        albumButton.on('pointerdown', () => this.openAlbum());
        albumButton.on('pointerover', () => {
            albumButton.setFillStyle(0x6a1b99, 0.9);
        });
        albumButton.on('pointerout', () => {
            albumButton.setFillStyle(0x4a148c, 0.9);
        });
    }
    
    /**
     * Open the Album scene to view unlocked HCGs
     */
    openAlbum() {
        console.log('CabinScene: Opening Album');
        
        // Clear new HCG notifications when album is opened
        this.hcgUnlockSystem.clearNewHCGNotifications();
        
        // Update album button text
        this.albumButtonText.setText('📖 Album');
        
        // Remove notification badge if it exists
        if (this.albumBadge) {
            this.albumBadge.destroy();
            this.albumBadge = null;
        }
        
        // Launch album scene
        this.scene.launch('AlbumScene', {
            callingScene: this.scene.key,
            unlockedHCGs: this.hcgUnlockSystem.getUnlockedHCGs()
        });
        
        this.scene.pause();
    }

    setupEventListeners() {
        // Listen for romance meter updates - use fallback if gameScene not available
        if (this.gameScene && this.gameScene.events) {
            this.gameScene.events.on('romance-meter-updated', (data) => {
                this.onRomanceMeterUpdated(data);
            });
            
            // Listen for relationship changes
            this.gameScene.events.on('relationship-changed', (data) => {
                this.onRelationshipChanged(data);
            });
        } else {
            // If gameScene events not available, listen to our own events instead
            this.events.on('romance-meter-updated', (data) => {
                this.onRomanceMeterUpdated(data);
            });
            
            this.events.on('relationship-changed', (data) => {
                this.onRelationshipChanged(data);
            });
        }
    }

    selectNPC(npcId) {
        this.selectedNPC = npcId;
        this.refreshCabin();
    }

    refreshCabin() {
        this.refreshNPCList();
        this.refreshRomancePanel();
        this.updateChatHeader();
        this.loadChatHistory();
    }

    updateChatHeader() {
        // Clear existing header elements
        if (this.chatHeaderName) this.chatHeaderName.destroy();
        if (this.chatHeaderStatus) this.chatHeaderStatus.destroy();
        
        // Recreate header with current NPC
        const { width } = this.cameras.main;
        const panelX = 300;
        const panelY = 110;
        
        console.log('CabinScene: Updating chat header for selected NPC:', this.selectedNPC);
        this.createChatHeader(panelX, panelY, width - 600);
    }

    loadChatHistory() {
        if (!this.selectedNPC) return;
        
        const chatHistory = this.getChatHistory();
        
        // If no chat history exists, create welcome messages
        if (chatHistory.length === 0) {
            const welcomeMessages = this.getWelcomeMessages();
            this.saveChatHistory(welcomeMessages);
            this.displayChatMessages(welcomeMessages);
        } else {
            this.displayChatMessages(chatHistory);
        }
    }

    getWelcomeMessages() {
        if (!this.selectedNPC) return [];
        
        const npc = this.dialogManager.getNPC(this.selectedNPC);
        if (!npc) return [];
        
        const welcomeMessages = [
            {
                sender: 'system',
                message: `🏠 Welcome to the cozy boat cabin! ${npc.name} is here to spend time with you.`,
                timestamp: Date.now() - 60000
            },
            {
                sender: this.selectedNPC,
                message: `Hello! It's so nice to have some quiet time together in the cabin. The ocean view is beautiful today, isn't it?`,
                timestamp: Date.now() - 30000
            }
        ];
        
        return welcomeMessages;
    }

    displayChatMessages(messages) {
        // Clear existing messages
        this.chatMessagesContainer.removeAll(true);
        
        let y = 0;
        messages.forEach((messageData, index) => {
            const messageElement = this.createChatMessage(messageData, y);
            y += messageElement.height + 15;
        });
        
        this.maxChatScroll = Math.max(0, y - this.chatAreaHeight);
        this.scrollChatToBottom();
    }

    createChatMessage(messageData, y) {
        const messageContainer = this.add.container(0, y);
        const maxWidth = this.chatAreaWidth - 40;
        
        const isPlayer = messageData.sender === 'player';
        const isSystem = messageData.sender === 'system';
        
        let messageHeight = 60;
        
        if (isSystem) {
            // System message (cabin announcements)
            const systemBg = this.add.graphics();
            systemBg.fillStyle(0xdaa520, 0.3);
            systemBg.fillRoundedRect(20, 0, maxWidth - 40, 40, 8);
            messageContainer.add(systemBg);
            
            const systemText = this.add.text(maxWidth / 2, 20, messageData.message, {
                fontSize: '12px',
                fontFamily: 'Georgia, serif',
                fill: '#daa520',
                fontStyle: 'italic',
                align: 'center',
                wordWrap: { width: maxWidth - 60 }
            }).setOrigin(0.5);
            messageContainer.add(systemText);
            
            messageHeight = 40;
        } else {
            // Regular chat message (cabin conversation style)
            const bubbleX = isPlayer ? maxWidth - 200 : 20;
            const bubbleWidth = 180;
            
            // Message bubble (wood style)
            const bubbleBg = this.add.graphics();
            if (isPlayer) {
                bubbleBg.fillStyle(this.cabinColors.charcoal, 0.9); // Player: sophisticated charcoal
                bubbleBg.lineStyle(2, this.cabinColors.silver, 0.8);
            } else {
                bubbleBg.fillStyle(this.cabinColors.goldDark, 0.8); // NPC: elegant gold
                bubbleBg.lineStyle(2, this.cabinColors.gold, 0.8);
            }
            bubbleBg.fillRoundedRect(bubbleX, 5, bubbleWidth, 50, 10);
            bubbleBg.strokeRoundedRect(bubbleX, 5, bubbleWidth, 50, 10);
            messageContainer.add(bubbleBg);
            
            // Sender name
            const senderText = this.add.text(bubbleX + 10, 12, isPlayer ? 'You' : messageData.sender, {
                fontSize: '10px',
                fontFamily: 'Georgia, serif',
                fill: isPlayer ? '#ffd700' : '#654321',
                fontStyle: 'bold'
            });
            messageContainer.add(senderText);
            
            // Message text
            const messageText = this.add.text(bubbleX + 10, 25, messageData.message, {
                fontSize: '12px',
                fontFamily: 'Georgia, serif',
                fill: isPlayer ? '#ffd700' : '#654321',
                wordWrap: { width: bubbleWidth - 20 }
            });
            messageContainer.add(messageText);
            
            // Timestamp
            const timeText = this.add.text(bubbleX + bubbleWidth - 10, 48, this.formatTime(messageData.timestamp), {
                fontSize: '9px',
                fontFamily: 'Georgia, serif',
                fill: isPlayer ? '#daa520' : '#8B4513'
            }).setOrigin(1, 0);
            messageContainer.add(timeText);
        }
        
        this.chatMessagesContainer.add(messageContainer);
        messageContainer.height = messageHeight;
        
        return messageContainer;
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    scrollChatToBottom() {
        this.chatScrollY = this.maxChatScroll;
        this.chatMessagesContainer.y = -this.chatScrollY;
    }

    sendMessage(message = null) {
        if (!this.selectedNPC) return;
        
        const messageText = message || 'Hello! How are you doing in the cabin?';
        
        const playerMessage = {
            sender: 'player',
            message: messageText,
            timestamp: Date.now()
        };
        
        // Add to chat history
        const chatHistory = this.getChatHistory();
        chatHistory.push(playerMessage);
        
        // Generate NPC response
        const npcResponse = this.generateNPCResponse(messageText);
        chatHistory.push(npcResponse);
        
        // Update romance meter based on message
        this.updateRomanceFromMessage(messageText);
        
        // Save and display
        this.saveChatHistory(chatHistory);
        this.displayChatMessages(chatHistory);
        
        console.log('CabinScene: Message sent in cabin');
    }

    sendQuickMessage(type) {
        const messages = {
            greeting: 'Hello! I love spending time with you in this cozy cabin.',
            flirt: 'You look absolutely beautiful in this warm cabin lighting.',
            romantic: 'Being here with you makes me feel so happy and content.',
            compliment: 'I really enjoy our conversations together.'
        };
        
        this.sendMessage(messages[type] || messages.greeting);
    }

    generateNPCResponse(playerMessage) {
        if (!this.selectedNPC) return null;
        
        const npc = this.dialogManager.getNPC(this.selectedNPC);
        if (!npc) return null;
        
        // Cabin-themed responses based on NPC personality
        const responses = {
            mia: [
                "The cabin feels so peaceful with you here! I love watching the waves through the porthole.",
                "This cozy atmosphere is perfect for getting to know each other better.",
                "I brought some hot cocoa - would you like to share it while we chat?",
                "The wood paneling reminds me of old fishing boats. There's something romantic about it."
            ],
            sophie: [
                "I love how intimate this cabin feels! It's like our own private world.",
                "The brass fittings and wood make this place feel so authentic and warm.",
                "Being in here with you makes me want to plan our next fishing adventure together!",
                "This cabin has such character - just like you!"
            ],
            luna: [
                "The energy in this cabin is so calming... I can feel the ocean's presence all around us.",
                "These wooden walls hold so many stories of the sea. I wonder what ours will be?",
                "The lantern light creates such a mystical atmosphere, don't you think?",
                "I feel so connected to you in this sacred space between sea and sky."
            ]
        };
        
        const npcResponses = responses[this.selectedNPC] || responses.mia;
        const randomResponse = npcResponses[Math.floor(Math.random() * npcResponses.length)];
        
        return {
            sender: this.selectedNPC,
            message: randomResponse,
            timestamp: Date.now() + 1000
        };
    }

    updateRomanceFromMessage(message) {
        if (!this.selectedNPC) return;
        
        // Determine romance points based on message content
        let points = 1; // Base points for any interaction
        
        if (message.toLowerCase().includes('love') || message.toLowerCase().includes('beautiful')) {
            points = 3;
        } else if (message.toLowerCase().includes('like') || message.toLowerCase().includes('enjoy')) {
            points = 2;
        }
        
        // Update romance meter
        this.dialogManager.updateRomanceMeter({
            npc: this.selectedNPC,
            amount: points
        });
    }

    getChatHistory() {
        if (!this.selectedNPC) return [];
        
        try {
            const history = localStorage.getItem(`cabin_chat_${this.selectedNPC}`);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Failed to load cabin chat history:', error);
            return [];
        }
    }

    saveChatHistory(history) {
        if (!this.selectedNPC) return;
        
        try {
            localStorage.setItem(`cabin_chat_${this.selectedNPC}`, JSON.stringify(history));
        } catch (error) {
            console.error('Failed to save cabin chat history:', error);
        }
    }

    giveGift() {
        const npc = this.dialogManager.getNPC(this.selectedNPC);
        if (!npc) return;
        
        const oldRomanceMeter = npc.romanceMeter;
        
        // Increase romance meter using correct DialogManager API
        this.dialogManager.updateRomanceMeter({ npc: this.selectedNPC, amount: 5 });
        
        // Check for HCG unlocks
        const unlocks = this.hcgUnlockSystem.checkForUnlocks(this.selectedNPC, oldRomanceMeter, npc.romanceMeter);
        
        // Display notifications for new unlocks
        unlocks.forEach(unlockData => {
            this.hcgNotificationManager.showHCGUnlock(unlockData);
        });
        
        // Update album button if new HCGs were unlocked
        if (unlocks.length > 0) {
            this.updateAlbumButton();
        }
        
        // Add chat message about the gift
        const messages = this.getChatHistory();
        messages.push({
            sender: 'system',
            message: `You gave a gift to ${npc.name}! (+5 Romance)`,
            timestamp: Date.now(),
            type: 'gift'
        });
        
        messages.push({
            sender: 'npc',
            message: this.generateGiftResponse(npc),
            timestamp: Date.now(),
            type: 'response'
        });
        
        this.saveChatHistory(messages);
        this.refreshCabin();
    }
    
    inviteFishing() {
        const npc = this.dialogManager.getNPC(this.selectedNPC);
        if (!npc) return;
        
        const oldRomanceMeter = npc.romanceMeter;
        
        // Increase romance meter using correct DialogManager API
        this.dialogManager.updateRomanceMeter({ npc: this.selectedNPC, amount: 3 });
        
        // Check for HCG unlocks
        const unlocks = this.hcgUnlockSystem.checkForUnlocks(this.selectedNPC, oldRomanceMeter, npc.romanceMeter);
        
        // Display notifications for new unlocks
        unlocks.forEach(unlockData => {
            this.hcgNotificationManager.showHCGUnlock(unlockData);
        });
        
        // Update album button if new HCGs were unlocked
        if (unlocks.length > 0) {
            this.updateAlbumButton();
        }
        
        // Add chat message about fishing invitation
        const messages = this.getChatHistory();
        messages.push({
            sender: 'system',
            message: `You invited ${npc.name} to go fishing! (+3 Romance)`,
            timestamp: Date.now(),
            type: 'fishing'
        });
        
        messages.push({
            sender: 'npc',
            message: this.generateFishingResponse(npc),
            timestamp: Date.now(),
            type: 'response'
        });
        
        this.saveChatHistory(messages);
        this.refreshCabin();
    }

    openFullDialog() {
        // Open full dialog system for this NPC from the cabin
        if (this.dialogManager && this.selectedNPC) {
            this.scene.pause();
            
            // Ensure DialogScene can access our DialogManager
            // Store it in a global place DialogScene can find it
            if (!this.scene.get('GameScene') || !this.scene.get('GameScene').dialogManager) {
                // If GameScene doesn't exist or doesn't have DialogManager, 
                // we need to pass our DialogManager to DialogScene
                this.scene.launch('DialogScene', {
                    npcId: this.selectedNPC,  // Fixed: use 'npcId' not 'npc'
                    script: 'sample_assistant.md',
                    callingScene: 'CabinScene',
                    dialogManager: this.dialogManager  // Pass our DialogManager directly
                });
            } else {
                // Normal case - GameScene has DialogManager
                this.dialogManager.startDialog(this.selectedNPC, 'CabinScene');
            }
        }
    }

    exitCabin() {
        console.log('CabinScene: Exiting cabin, returning to', this.callingScene);
        
        // Show fish button when cabin is closed
        if (this.scene.get('BoatMenuScene') && this.scene.get('BoatMenuScene').showFishButton) {
            this.scene.get('BoatMenuScene').showFishButton();
        }
        
        // Play exit sound
        if (this.audioManager) {
            this.audioManager.playSFX('button');
        }
        
        // Use stop/resume instead of start to preserve scene state and audio
        // This prevents the audio manager from being re-initialized
        this.scene.stop('CabinScene');
        
        // Check if the calling scene is active before resuming
        if (this.callingScene && this.scene.isActive(this.callingScene)) {
            this.scene.resume(this.callingScene);
            console.log('CabinScene: Resumed', this.callingScene);
        } else {
            // Fallback to starting the scene if it's not active
            console.log('CabinScene: Calling scene not active, starting', this.callingScene);
            this.scene.start(this.callingScene);
        }
    }

    onRomanceMeterUpdated(data) {
        console.log('CabinScene: Romance meter updated', data);
        this.refreshRomancePanel();
        
        // Check for HCG unlocks when romance meter changes
        if (data.oldValue !== undefined && data.newValue !== undefined) {
            const unlocks = this.hcgUnlockSystem.checkForUnlocks(data.npcId, data.oldValue, data.newValue);
            
            // Display notifications for new unlocks
            unlocks.forEach(unlockData => {
                this.hcgNotificationManager.showHCGUnlock(unlockData);
            });
            
            // Update album button if new HCGs were unlocked
            if (unlocks.length > 0) {
                this.updateAlbumButton();
            }
        }
    }
    
    /**
     * Update album button text and badge based on new HCG count
     */
    updateAlbumButton() {
        const newHCGCount = this.hcgUnlockSystem.getNewHCGCount();
        
        if (this.albumButtonText) {
            const albumText = newHCGCount > 0 ? 
                `📖 Album (${newHCGCount})` : 
                '📖 Album';
            this.albumButtonText.setText(albumText);
        }
        
        // Add or update notification badge
        if (newHCGCount > 0 && !this.albumBadge) {
            const { height } = this.cameras.main;
            this.albumBadge = this.add.circle(230, height - 45, 8, 0xff4444);
            this.albumBadge.setStrokeStyle(1, 0xffffff);
            
            const badgeText = this.add.text(230, height - 45, newHCGCount.toString(), {
                fontSize: '10px',
                fill: '#ffffff',
                fontWeight: 'bold'
            }).setOrigin(0.5);
        }
    }

    onRelationshipChanged(data) {
        if (data.npcId === this.selectedNPC) {
            this.refreshRomancePanel();
            this.refreshNPCList();
            this.updateChatHeader();
            
            // Add system message about relationship change in cabin
            const systemMessage = {
                sender: 'system',
                message: `🎉 Your relationship with ${data.npcId} changed to ${data.newLevel} in the cozy cabin!`,
                timestamp: Date.now()
            };
            
            const chatHistory = this.getChatHistory();
            chatHistory.push(systemMessage);
            this.saveChatHistory(chatHistory);
            this.displayChatMessages(chatHistory);
        }
    }

    /**
     * Create a fallback DialogManager with basic NPC data
     * Used when the main DialogManager is not available
     */
    createFallbackDialogManager() {
        const fallbackManager = {
            npcs: new Map(),
            updateRomanceMeter: (data) => {
                console.log('Fallback: Romance meter update in cabin', data);
                const { npc: npcId, amount } = data;
                const npc = fallbackManager.npcs.get(npcId);
                if (npc) {
                    const oldMeter = npc.romanceMeter;
                    npc.romanceMeter = Math.max(0, Math.min(npc.maxRomance, npc.romanceMeter + amount));
                    
                    // Check for relationship level changes
                    this.checkRelationshipLevelUp(npc, oldMeter);
                    
                    // Save the updated data
                    this.saveNPCData(npcId);
                    
                    // Emit event for UI updates
                    this.events.emit('romance-meter-updated', {
                        npcId: npcId,
                        oldValue: oldMeter,
                        newValue: npc.romanceMeter,
                        maxValue: npc.maxRomance,
                    });
                }
            },
            getNPC: (npcId) => fallbackManager.npcs.get(npcId),
            getNPCData: (npcId) => fallbackManager.npcs.get(npcId), // Add alias for compatibility
            
            // Add the missing methods that RenJs expects
            increaseRomanceMeter: (npcId, amount) => {
                console.log('Fallback: Increasing romance meter for', npcId, 'by', amount);
                fallbackManager.updateRomanceMeter({ npc: npcId, amount: amount });
            },
            
            decreaseRomanceMeter: (npcId, amount) => {
                console.log('Fallback: Decreasing romance meter for', npcId, 'by', amount);
                fallbackManager.updateRomanceMeter({ npc: npcId, amount: -amount });
            },
            
            unlockAchievement: (achievementId) => {
                console.log('Fallback: Unlocking achievement:', achievementId);
                // Store in localStorage for persistence
                try {
                    const achievements = JSON.parse(localStorage.getItem('cabin_achievements') || '[]');
                    if (!achievements.includes(achievementId)) {
                        achievements.push(achievementId);
                        localStorage.setItem('cabin_achievements', JSON.stringify(achievements));
                        console.log('Fallback: Achievement unlocked and saved:', achievementId);
                    }
                } catch (error) {
                    console.warn('Fallback: Failed to save achievement:', error);
                }
            },
            
            addInventoryItem: (itemId, quantity = 1) => {
                console.log('Fallback: Adding inventory item:', itemId, 'x', quantity);
                // Store in localStorage for persistence
                try {
                    const inventory = JSON.parse(localStorage.getItem('cabin_inventory') || '{}');
                    inventory[itemId] = (inventory[itemId] || 0) + quantity;
                    localStorage.setItem('cabin_inventory', JSON.stringify(inventory));
                    console.log('Fallback: Item added to inventory:', itemId, 'total:', inventory[itemId]);
                } catch (error) {
                    console.warn('Fallback: Failed to save inventory item:', error);
                }
            },
            
            removeInventoryItem: (itemId, quantity = 1) => {
                console.log('Fallback: Removing inventory item:', itemId, 'x', quantity);
                try {
                    const inventory = JSON.parse(localStorage.getItem('cabin_inventory') || '{}');
                    inventory[itemId] = Math.max(0, (inventory[itemId] || 0) - quantity);
                    localStorage.setItem('cabin_inventory', JSON.stringify(inventory));
                    console.log('Fallback: Item removed from inventory:', itemId, 'remaining:', inventory[itemId]);
                } catch (error) {
                    console.warn('Fallback: Failed to remove inventory item:', error);
                }
            },
            
            unlockQuest: (questId) => {
                console.log('Fallback: Unlocking quest:', questId);
                try {
                    const quests = JSON.parse(localStorage.getItem('cabin_quests') || '[]');
                    if (!quests.includes(questId)) {
                        quests.push(questId);
                        localStorage.setItem('cabin_quests', JSON.stringify(quests));
                        console.log('Fallback: Quest unlocked and saved:', questId);
                    }
                } catch (error) {
                    console.warn('Fallback: Failed to save quest:', error);
                }
            },
            
            completeQuest: (questId) => {
                console.log('Fallback: Completing quest:', questId);
                try {
                    const completedQuests = JSON.parse(localStorage.getItem('cabin_completed_quests') || '[]');
                    if (!completedQuests.includes(questId)) {
                        completedQuests.push(questId);
                        localStorage.setItem('cabin_completed_quests', JSON.stringify(completedQuests));
                        console.log('Fallback: Quest completed and saved:', questId);
                    }
                } catch (error) {
                    console.warn('Fallback: Failed to save completed quest:', error);
                }
            },
            
            // RenJs integration methods
            exportForRenJs: () => {
                return {
                    // NPC state methods
                    getNPCData: (npcId) => fallbackManager.getNPC(npcId),
                    getRomanceLevel: (npcId) => fallbackManager.getNPC(npcId)?.romanceMeter || 0,
                    getRelationship: (npcId) => fallbackManager.getNPC(npcId)?.relationship || 'stranger',
                    
                    // Action methods
                    increaseRomance: (npcId, amount) => fallbackManager.increaseRomanceMeter(npcId, amount),
                    decreaseRomance: (npcId, amount) => fallbackManager.decreaseRomanceMeter(npcId, amount),
                    unlockAchievement: (achievementId) => fallbackManager.unlockAchievement(achievementId),
                    giveItem: (itemId, quantity) => fallbackManager.addInventoryItem(itemId, quantity),
                    
                    // Quest methods (simplified)
                    unlockQuest: (questId) => fallbackManager.unlockQuest(questId),
                    completeQuest: (questId) => fallbackManager.completeQuest(questId),
                    
                    // State queries
                    getAllRomanceStates: () => {
                        const states = [];
                        for (const [npcId, npc] of fallbackManager.npcs) {
                            states.push({
                                npcId: npcId,
                                name: npc.name,
                                romanceMeter: npc.romanceMeter,
                                maxRomance: npc.maxRomance,
                                relationship: npc.relationship,
                                percentage: Math.floor((npc.romanceMeter / npc.maxRomance) * 100),
                            });
                        }
                        return states;
                    }
                };
            },
            
            startDialog: (npcId, callingScene) => {
                console.log(`Fallback: Start dialog with ${npcId} from ${callingScene}`);
                // Launch DialogScene directly with our fallback manager
                try {
                    this.scene.launch('DialogScene', {
                        npcId: npcId,  // Fixed: use 'npcId' not 'npc'
                        script: 'sample_assistant.md',
                        callingScene: callingScene || 'CabinScene',
                        dialogManager: fallbackManager  // Pass ourselves as the DialogManager
                    });
                } catch (error) {
                    console.warn('Fallback DialogManager: Failed to launch DialogScene:', error);
                }
            }
        };

        // Initialize fallback NPC data with cabin theme
        const npcData = [
            {
                id: 'mia',
                name: 'Bikini Assistant Mia',
                portrait: 'npc-assistant-1',
                romanceMeter: 0,
                maxRomance: 100,
                relationship: 'stranger',
                dialogScript: 'sample_assistant.md',
                description: 'A cheerful and helpful fishing guide who loves cozy cabin conversations.',
                personality: 'Friendly, enthusiastic, and enjoys intimate cabin settings',
                specialties: ['Cabin comfort', 'Warm conversations', 'Ocean stories'],
            },
            {
                id: 'sophie',
                name: 'Bikini Assistant Sophie',
                portrait: 'npc-assistant-2',
                romanceMeter: 0,
                maxRomance: 100,
                relationship: 'stranger',
                dialogScript: 'assistant_sophie.md',
                description: 'An energetic fishing enthusiast who brings excitement to cabin life.',
                personality: 'Energetic, passionate, and loves cabin adventures',
                specialties: ['Cabin activities', 'Adventure planning', 'Romantic atmosphere'],
            },
            {
                id: 'luna',
                name: 'Bikini Assistant Luna',
                portrait: 'npc-assistant-3',
                romanceMeter: 0,
                maxRomance: 100,
                relationship: 'stranger',
                dialogScript: 'assistant_luna.md',
                description: 'A mysterious guide who finds deep meaning in cabin solitude.',
                personality: 'Mysterious, wise, and spiritually connected to cabin energy',
                specialties: ['Cabin meditation', 'Ocean wisdom', 'Sacred spaces'],
            }
        ];

        // Load saved data for each NPC
        npcData.forEach(npc => {
            this.loadNPCData(npc.id, npc);
            fallbackManager.npcs.set(npc.id, npc);
        });

        console.log('CabinScene: Fallback DialogManager initialized with NPCs:', Array.from(fallbackManager.npcs.keys()));
        return fallbackManager;
    }

    /**
     * Check if NPC relationship level should change (fallback version)
     * @param {Object} npc - NPC data
     * @param {number} oldMeter - Previous romance meter value
     */
    checkRelationshipLevelUp(npc, oldMeter) {
        const thresholds = {
            stranger: 0,
            acquaintance: 20,
            friend: 40,
            close_friend: 60,
            romantic_interest: 80,
            lover: 100
        };

        let newLevel = 'stranger';
        for (const [level, threshold] of Object.entries(thresholds)) {
            if (npc.romanceMeter >= threshold) {
                newLevel = level;
            }
        }

        if (newLevel !== npc.relationship) {
            const oldLevel = npc.relationship;
            npc.relationship = newLevel;
            
            console.log(`${npc.name} cabin relationship: ${oldLevel} -> ${newLevel}`);
            
            // Emit relationship change event
            this.events.emit('relationship-changed', {
                npcId: npc.id,
                oldLevel: oldLevel,
                newLevel: newLevel,
                romanceMeter: npc.romanceMeter
            });
        }
    }

    /**
     * Save NPC data to localStorage (fallback version)
     * @param {string} npcId - The NPC ID
     */
    saveNPCData(npcId) {
        const npc = this.dialogManager.getNPC(npcId);
        if (npc) {
            const saveData = {
                romanceMeter: npc.romanceMeter,
                relationship: npc.relationship
            };
            
            try {
                localStorage.setItem(`cabin_npc_${npcId}`, JSON.stringify(saveData));
            } catch (error) {
                console.warn(`Failed to save cabin NPC data for ${npcId}:`, error);
            }
        }
    }

    /**
     * Load NPC data from localStorage (fallback version)
     * @param {string} npcId - The NPC ID
     * @param {Object} npc - NPC object to update
     */
    loadNPCData(npcId, npc) {
        try {
            const saveData = localStorage.getItem(`cabin_npc_${npcId}`);
            if (saveData) {
                const data = JSON.parse(saveData);
                npc.romanceMeter = data.romanceMeter || 0;
                npc.relationship = data.relationship || 'stranger';
                console.log(`Loaded cabin NPC data for ${npcId}:`, data);
            }
        } catch (error) {
            console.error(`Failed to load cabin NPC data for ${npcId}:`, error);
        }
    }

    update() {
        // Update HCG notification manager
        if (this.hcgNotificationManager) {
            this.hcgNotificationManager.update();
        }
    }
    
    /**
     * Generate NPC response to receiving a gift
     * @param {Object} npc - NPC data object
     * @returns {string} NPC response message
     */
    generateGiftResponse(npc) {
        const responses = {
            mia: [
                "Thank you so much! This will be perfect for our next fishing trip!",
                "How thoughtful! I love getting gifts that show you care.",
                "This is wonderful! It reminds me of the ocean breeze.",
                "You always know exactly what I need. Thank you!",
                "Such a sweet gesture! I'll treasure this always."
            ],
            sophie: [
                "Wow, this is fantastic! I can use this in my training!",
                "You're trying to win me over, aren't you? It's working!",
                "A challenger who gives gifts? Now I'm really impressed!",
                "This is going to give me an edge in competition! Thanks!",
                "You know the way to a competitor's heart - through useful gifts!"
            ],
            luna: [
                "The ocean whispers that this gift comes from a pure heart...",
                "This resonates with the mystical energies I sense around you.",
                "Such thoughtfulness... the sea spirits approve of your kindness.",
                "A gift given with love carries the power of the tides. Thank you.",
                "The cosmic currents brought this to me through your generous spirit."
            ]
        };
        
        const npcResponses = responses[npc.id] || responses.mia;
        return npcResponses[Math.floor(Math.random() * npcResponses.length)];
    }
    
    /**
     * Generate NPC response to fishing invitation
     * @param {Object} npc - NPC data object
     * @returns {string} NPC response message
     */
    generateFishingResponse(npc) {
        const responses = {
            mia: [
                "I'd love to go fishing with you! I know some great spots.",
                "Yes! Let's go catch some amazing fish together!",
                "Fishing together sounds perfect! When do we leave?",
                "I've been hoping you'd ask! I have some new techniques to show you.",
                "Absolutely! Two anglers are better than one!"
            ],
            sophie: [
                "A fishing challenge? You're on! Let's see who catches more!",
                "Finally, a worthy fishing competitor! This will be intense!",
                "I accept your challenge! Prepare to be amazed by my skills!",
                "You want to fish with the best? Wise choice!",
                "Let's turn this into a competition - loser buys dinner!"
            ],
            luna: [
                "The tides are calling us to fish together under the stars...",
                "I sense the ocean wants us to share this peaceful moment.",
                "Fishing together will deepen our connection to the sea's mysteries.",
                "Yes... the ancient spirits guide us to fish as one with nature.",
                "The mystical currents align perfectly for our shared journey."
            ]
        };
        
        const npcResponses = responses[npc.id] || responses.mia;
        return npcResponses[Math.floor(Math.random() * npcResponses.length)];
    }

    /**
     * Create a large center portrait display for Mia in the cabin
     */
    createCenterMiaPortrait() {
        const { width, height } = this.cameras.main;
        
        // Position in the center-left area (chat panel area)
        const centerX = width / 2;
        const centerY = height / 2;
        
        console.log('CabinScene: Creating center Mia portrait display');
        
        // Create decorative frame for the portrait
        const portraitFrame = this.add.graphics();
        portraitFrame.fillStyle(0xb8860b, 0.9); // Brass frame
        portraitFrame.fillRoundedRect(centerX - 122, centerY - 172, 244, 344, 15);
        portraitFrame.lineStyle(4, 0xdaa520, 1);
        portraitFrame.strokeRoundedRect(centerX - 122, centerY - 172, 244, 344, 15);
        portraitFrame.setDepth(15000);
        
        // Inner wood frame
        const innerFrame = this.add.graphics();
        innerFrame.fillStyle(0x8B4513, 0.8);
        innerFrame.fillRoundedRect(centerX - 115, centerY - 165, 230, 330, 10);
        innerFrame.setDepth(15001);
        
        // Try to load Mia's actual portrait
        const portraitKeys = [
            'mia-portrait', 
            'portrait-mia', 
            'mia-full',
            'mia-portrait-alt',
            'mia-portrait-public'
        ];
        let portraitAdded = false;
        
        // Debug: Check all available textures
        console.log('CabinScene: Checking for center Mia portrait keys:', portraitKeys);
        
        for (const key of portraitKeys) {
            console.log(`CabinScene: Checking center texture key '${key}' - exists: ${this.textures.exists(key)}`);
            if (this.textures.exists(key)) {
                try {
                    console.log(`🎯 CabinScene: Creating center Mia portrait with key '${key}'`);
                    
                    // Get texture info for debugging
                    const texture = this.textures.get(key);
                    console.log(`🔍 CabinScene: Center texture '${key}' info:`, {
                        source: texture.source?.[0]?.image?.src || 'unknown',
                        width: texture.source?.[0]?.width || 'unknown',
                        height: texture.source?.[0]?.height || 'unknown',
                        type: texture.source?.[0]?.image ? 'image' : 'canvas'
                    });
                    
                    const centerMiaPortrait = this.add.image(centerX, centerY, key);
                    centerMiaPortrait.setDisplaySize(220, 320);
                    centerMiaPortrait.setOrigin(0.5);
                    centerMiaPortrait.setDepth(15002);
                    centerMiaPortrait.setVisible(true);
                    centerMiaPortrait.setAlpha(1);
                    
                    console.log(`✅ CabinScene: Center Mia portrait '${key}' created successfully - size: ${centerMiaPortrait.displayWidth}x${centerMiaPortrait.displayHeight}, position: (${centerMiaPortrait.x}, ${centerMiaPortrait.y}), depth: ${centerMiaPortrait.depth}`);
                    
                    portraitAdded = true;
                    break;
                } catch (error) {
                    console.error(`❌ CabinScene: Error creating center portrait with key '${key}':`, error);
                }
            }
        }
        
        // Fallback if no actual portrait found
        if (!portraitAdded) {
            console.log('CabinScene: No actual center portrait found, creating fallback');
            const fallbackText = this.add.text(centerX, centerY, '💃 MIA 💃', {
                fontSize: '48px',
                fontFamily: 'Georgia, serif',
                fill: '#ffd700',
                fontStyle: 'bold',
                stroke: '#8B4513',
                strokeThickness: 3
            });
            fallbackText.setOrigin(0.5);
            fallbackText.setDepth(15002);
        }
        
        // Add cabin title below the portrait
        const titleText = this.add.text(centerX, centerY + 190, '~ Bikini Assistant Mia ~', {
            fontSize: '20px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700',
            fontStyle: 'bold italic',
            stroke: '#8B4513',
            strokeThickness: 2
        });
        titleText.setOrigin(0.5);
        titleText.setDepth(15003);
        
        // Add cabin atmosphere text
        const atmosphereText = this.add.text(centerX, centerY + 210, 'Relaxing in the Cozy Cabin', {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            fill: '#daa520',
            fontStyle: 'italic'
        });
        atmosphereText.setOrigin(0.5);
        atmosphereText.setDepth(15003);
        
        console.log('CabinScene: Center Mia portrait display created');
    }

    // --- PRIVATE HELPER METHODS FOR UI CREATION ---

    _createStyledPanel(x, y, width, height, title) {
        // Elegant panel background (charcoal with gold border)
        const panelBg = this.add.graphics();
        panelBg.fillStyle(this.cabinColors.charcoal, 0.95);
        panelBg.fillRoundedRect(x, y, width, height, 12);
        panelBg.lineStyle(3, this.cabinColors.gold, 0.9);
        panelBg.strokeRoundedRect(x, y, width, height, 12);

        // Silver inner border for sophistication
        const innerBorder = this.add.graphics();
        innerBorder.lineStyle(1, this.cabinColors.silver, 0.6);
        innerBorder.strokeRoundedRect(x + 2, y + 2, width - 4, height - 4, 10);

        // Elegant accent lines on panel
        const accentLines = Math.floor(height / 25);
        for (let i = 0; i < accentLines; i++) {
            const accent = this.add.graphics();
            accent.lineStyle(1, this.cabinColors.silverDark, 0.2);
            accent.lineBetween(x + 15, y + 15 + i * 25, x + width - 15, y + 15 + i * 25);
        }

        // Sophisticated panel title
        if (title) {
            this.add.text(x + 15, y + 15, title, {
                fontSize: '18px',
                fontFamily: 'Georgia, serif',
                fill: '#FFD700',  // Pure gold
                fontStyle: 'bold',
                stroke: '#000000',  // Black stroke
                strokeThickness: 1
            });
        }
    }

    _createRomanceMeter(x, y, width, height, currentValue, maxValue) {
        const container = this.add.container(x, y);
    
        // Elegant gold frame
        const meterFrame = this.add.graphics();
        meterFrame.fillStyle(this.cabinColors.gold, 0.9);
        meterFrame.fillRoundedRect(0, 0, width, height, height / 2);
        container.add(meterFrame);
    
        // Silver inner frame
        const innerFrame = this.add.graphics();
        innerFrame.fillStyle(this.cabinColors.silver, 0.7);
        innerFrame.fillRoundedRect(1, 1, width - 2, height - 2, (height - 2) / 2);
        container.add(innerFrame);
    
        // Dark background
        const meterBg = this.add.graphics();
        meterBg.fillStyle(this.cabinColors.blackSoft, 0.9);
        meterBg.fillRoundedRect(3, 3, width - 6, height - 6, (height - 6) / 2);
        container.add(meterBg);
    
        // Fill
        const fillPercent = currentValue / maxValue;
        const fillWidth = fillPercent * (width - 6);
        
        // Elegant color progression using theme colors
        let fillColor = this.cabinColors.silverDark; // Default gray
        if (fillPercent >= 0.8) fillColor = 0xdc143c;           // Crimson (lover)
        else if (fillPercent >= 0.6) fillColor = 0xff6347;     // Tomato (romantic)
        else if (fillPercent >= 0.4) fillColor = this.cabinColors.gold;     // Gold (close friend)
        else if (fillPercent >= 0.2) fillColor = this.cabinColors.goldDark; // Dark gold (friend)
        
        const meterFill = this.add.graphics();
        meterFill.fillStyle(fillColor, 0.95);
        meterFill.fillRoundedRect(3, 3, fillWidth, height - 6, (height - 6) / 2);
        container.add(meterFill);
    
        return container;
    }

    _createCabinButton(x, y, text, callback, container) {
        const width = 200;
        const height = 35;
        
        const buttonContainer = this.add.container(x, y);
    
        // Elegant gold button frame
        const buttonFrame = this.add.graphics();
        buttonFrame.fillStyle(this.cabinColors.gold, 0.9);
        buttonFrame.fillRoundedRect(-2, -2, width + 4, height + 4, 12);
        buttonContainer.add(buttonFrame);
    
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(this.cabinColors.charcoal, 0.9);
        buttonBg.fillRoundedRect(0, 0, width, height, 10);
        buttonBg.lineStyle(2, this.cabinColors.silver, 0.8);
        buttonBg.strokeRoundedRect(0, 0, width, height, 10);
        buttonContainer.add(buttonBg);
        
        const buttonText = this.add.text(width / 2, height / 2, text, {
            fontSize: '12px',
            fontFamily: 'Georgia, serif',
            fill: '#FFD700',  // Pure gold text
            fontStyle: 'bold'
        }).setOrigin(0.5);
        buttonContainer.add(buttonText);
        
        // Make interactive
        buttonContainer.setSize(width, height);
        buttonContainer.setInteractive({ useHandCursor: true });
        buttonContainer.on('pointerdown', callback);
        
        // Elegant hover effects
        buttonContainer.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(this.cabinColors.goldDark, 0.8);
            buttonBg.fillRoundedRect(0, 0, width, height, 10);
            buttonBg.lineStyle(2, this.cabinColors.gold, 1);
            buttonBg.strokeRoundedRect(0, 0, width, height, 10);
            buttonText.setFill('#FFFFFF');  // White text on hover
        });
        
        buttonContainer.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(this.cabinColors.charcoal, 0.9);
            buttonBg.fillRoundedRect(0, 0, width, height, 10);
            buttonBg.lineStyle(2, this.cabinColors.silver, 0.8);
            buttonBg.strokeRoundedRect(0, 0, width, height, 10);
            buttonText.setFill('#FFD700');  // Back to gold text
        });
    
        if (container) {
            container.add(buttonContainer);
        }
        
        return buttonContainer;
    }
} 