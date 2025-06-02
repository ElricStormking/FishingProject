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
        
        // Cabin theme colors (enhanced brass and wood)
        this.cabinColors = {
            // Enhanced brass colors from UITheme
            brass: UITheme.colors.gold,           // 0xb8860b
            brassLight: UITheme.colors.bronze,    // Enhanced brass highlight
            brassDark: 0x8B6914,                  // Darker brass
            
            // Enhanced wood colors
            wood: UITheme.colors.secondary,       // Base wood color
            woodDark: 0x654321,                   // Dark wood grain
            woodLight: UITheme.colors.secondaryLight, // Light wood highlight
            
            // Cabin atmosphere colors using UITheme
            background: UITheme.colors.darkSecondary,
            panel: UITheme.colors.panelBg,
            text: UITheme.colors.text,
            textSecondary: UITheme.colors.textSecondary
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
        
        // If DialogManager not available from GameScene, create a minimal fallback
        if (!this.dialogManager) {
            console.warn('CabinScene: DialogManager not available from GameScene, creating fallback');
            this.dialogManager = this.createFallbackDialogManager();
        }

        // Initialize UI
        this.createCabinUI();
        this.setupEventListeners();
        
        // Auto-select first NPC if none selected
        if (!this.selectedNPC) {
            const npcs = Array.from(this.dialogManager.npcs.keys());
            if (npcs.length > 0) {
                this.selectedNPC = npcs[0];
            }
        }
        
        this.refreshCabin();
        
        console.log('CabinScene: Boat Cabin initialized');
    }

    createCabinBackground(width, height) {
        // Dark ocean background visible through windows
        this.add.rectangle(width/2, height/2, width, height, 0x0a1a2e, 1);
        
        // Cabin floor (wooden planks)
        const floorBg = this.add.graphics();
        floorBg.fillStyle(0x8B4513, 1); // Saddle brown
        floorBg.fillRect(0, height * 0.7, width, height * 0.3);
        
        // Add wood grain texture to floor
        for (let i = 0; i < 8; i++) {
            const plankLine = this.add.graphics();
            plankLine.lineStyle(2, 0x654321, 0.6);
            plankLine.lineBetween(0, height * 0.7 + (i * 30), width, height * 0.7 + (i * 30));
            
            // Add wood knots
            for (let j = 0; j < 5; j++) {
                const knot = this.add.graphics();
                knot.fillStyle(0x4a2c17, 0.8);
                knot.fillCircle(j * (width/5) + 50, height * 0.7 + (i * 30) + 15, 3);
            }
        }
        
        // Cabin walls (wood paneling)
        const wallBg = this.add.graphics();
        wallBg.fillStyle(0x8B6914, 1); // Dark goldenrod
        wallBg.fillRect(0, 0, width, height * 0.7);
        
        // Add vertical wood paneling
        for (let i = 0; i < 15; i++) {
            const panelLine = this.add.graphics();
            panelLine.lineStyle(1, 0x654321, 0.4);
            panelLine.lineBetween(i * (width/15), 0, i * (width/15), height * 0.7);
        }
        
        // Cabin windows (portholes)
        this.createPorthole(width * 0.15, height * 0.25, 60);
        this.createPorthole(width * 0.85, height * 0.25, 60);
        
        // Cabin ceiling with beams
        const ceilingBg = this.add.graphics();
        ceilingBg.fillStyle(0x654321, 1);
        ceilingBg.fillRect(0, 0, width, 40);
        
        // Ceiling beams
        for (let i = 0; i < 4; i++) {
            const beam = this.add.graphics();
            beam.fillStyle(0x4a2c17, 1);
            beam.fillRect(i * (width/4) + 20, 0, 30, 40);
        }
        
        // Warm cabin lighting
        const lightGlow = this.add.graphics();
        lightGlow.fillStyle(0xffd700, 0.1);
        lightGlow.fillCircle(width/2, height/2, width * 0.6);
        
        // Add some nautical decorations
        this.addNauticalDecorations(width, height);
    }

    createPorthole(x, y, radius) {
        // Porthole frame (brass)
        const frame = this.add.graphics();
        frame.fillStyle(0xb8860b, 1); // Dark goldenrod
        frame.fillCircle(x, y, radius + 8);
        
        // Porthole glass
        const glass = this.add.graphics();
        glass.fillStyle(0x001a33, 0.8); // Dark blue ocean view
        glass.fillCircle(x, y, radius);
        
        // Ocean waves visible through porthole
        const wave1 = this.add.graphics();
        wave1.lineStyle(2, 0x0066cc, 0.6);
        wave1.strokeCircle(x, y + 10, radius * 0.7);
        
        const wave2 = this.add.graphics();
        wave2.lineStyle(1, 0x4da6ff, 0.4);
        wave2.strokeCircle(x, y + 20, radius * 0.5);
        
        // Porthole reflection
        const reflection = this.add.graphics();
        reflection.fillStyle(0xffffff, 0.2);
        reflection.fillCircle(x - radius * 0.3, y - radius * 0.3, radius * 0.3);
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
        // Wheel rim
        const rim = this.add.graphics();
        rim.lineStyle(6, 0x8B4513, 1);
        rim.strokeCircle(x, y, radius);
        
        // Wheel spokes
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const spoke = this.add.graphics();
            spoke.lineStyle(4, 0x654321, 1);
            spoke.lineBetween(
                x + Math.cos(angle) * radius * 0.3,
                y + Math.sin(angle) * radius * 0.3,
                x + Math.cos(angle) * radius * 0.9,
                y + Math.sin(angle) * radius * 0.9
            );
        }
        
        // Center hub
        const hub = this.add.graphics();
        hub.fillStyle(0x4a2c17, 1);
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
        rope.lineStyle(8, 0xdaa520, 1); // Goldenrod
        
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
        // Lantern body
        const body = this.add.graphics();
        body.fillStyle(0xb8860b, 1);
        body.fillRoundedRect(x - 15, y, 30, 40, 5);
        
        // Lantern glass
        const glass = this.add.graphics();
        glass.fillStyle(0xffd700, 0.6);
        glass.fillRoundedRect(x - 12, y + 3, 24, 34, 3);
        
        // Lantern top
        const top = this.add.graphics();
        top.fillStyle(0x8B4513, 1);
        top.fillRoundedRect(x - 18, y - 8, 36, 8, 4);
        
        // Hanging chain
        const chain = this.add.graphics();
        chain.lineStyle(2, 0x2c3e50, 1);
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
        
        // Bottom input area
        this.createInputArea();
        
        // Navigation
        this.createNavigationButtons();
        this.createAlbumButton(); // Add album button
    }

    createHeaderBar() {
        const { width } = this.cameras.main;
        
        // Header background (wood panel style)
        const headerBg = this.add.graphics();
        headerBg.fillStyle(0x8B4513, 0.95);
        headerBg.fillRect(0, 40, width, 60);
        headerBg.lineStyle(2, 0xdaa520, 0.8);
        headerBg.strokeRect(0, 98, width, 2);
        
        // Wood grain on header
        for (let i = 0; i < 3; i++) {
            const grain = this.add.graphics();
            grain.lineStyle(1, 0x654321, 0.4);
            grain.lineBetween(0, 50 + i * 15, width, 50 + i * 15);
        }
        
        // Title with nautical theme
        this.headerTitle = this.add.text(width/2, 70, '⚓ Boat Cabin', {
            fontSize: '28px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700',
            fontStyle: 'bold',
            stroke: '#654321',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Subtitle
        this.headerSubtitle = this.add.text(width/2, 90, 'Cozy quarters with your fishing companions', {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            fill: '#daa520',
            fontStyle: 'italic'
        }).setOrigin(0.5);
    }

    createNPCListPanel() {
        const { height } = this.cameras.main;
        const panelWidth = 280;
        const panelHeight = height - 180;
        const panelY = 110;
        
        // Panel background (wood panel with brass trim)
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x8B4513, 0.9);
        panelBg.fillRoundedRect(10, panelY, panelWidth, panelHeight, 10);
        panelBg.lineStyle(3, 0xb8860b, 0.8);
        panelBg.strokeRoundedRect(10, panelY, panelWidth, panelHeight, 10);
        
        // Wood grain on panel
        for (let i = 0; i < Math.floor(panelHeight / 20); i++) {
            const grain = this.add.graphics();
            grain.lineStyle(1, 0x654321, 0.3);
            grain.lineBetween(15, panelY + 10 + i * 20, panelWidth - 5, panelY + 10 + i * 20);
        }
        
        // Panel title with nautical theme
        this.add.text(25, panelY + 15, '🏖️ Cabin Guests', {
            fontSize: '18px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700',
            fontStyle: 'bold',
            stroke: '#654321',
            strokeThickness: 1
        });
        
        // NPC list container
        this.npcListContainer = this.add.container(15, panelY + 50);
        this.cabinContainer.add(this.npcListContainer);
        
        this.refreshNPCList();
    }

    refreshNPCList() {
        // Clear existing list
        this.npcListContainer.removeAll(true);
        
        const npcs = Array.from(this.dialogManager.npcs.values());
        const itemHeight = 90;
        
        npcs.forEach((npc, index) => {
            const y = index * (itemHeight + 10);
            this.createNPCListItem(npc, 0, y);
        });
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
            itemBg.fillStyle(0xdaa520, 0.4); // Golden highlight
            itemBg.lineStyle(2, 0xffd700, 0.8);
        } else {
            itemBg.fillStyle(0x654321, 0.3); // Dark wood
            itemBg.lineStyle(1, 0x8B4513, 0.6);
        }
        
        itemBg.fillRoundedRect(0, 0, itemWidth, itemHeight, 8);
        itemBg.strokeRoundedRect(0, 0, itemWidth, itemHeight, 8);
        npcItem.add(itemBg);
        
        // NPC portrait (brass frame)
        const portraitFrame = this.add.graphics();
        portraitFrame.fillStyle(0xb8860b, 0.9);
        portraitFrame.fillCircle(30, 25, 20);
        npcItem.add(portraitFrame);
        
        const portraitBg = this.add.graphics();
        portraitBg.fillStyle(0x8B4513, 0.8);
        portraitBg.fillCircle(30, 25, 16);
        npcItem.add(portraitBg);
        
        // NPC initial
        const npcInitial = this.add.text(30, 25, npc.name[0], {
            fontSize: '20px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        npcItem.add(npcInitial);
        
        // NPC name
        const nameText = this.add.text(55, 15, npc.name, {
            fontSize: '16px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700',
            fontStyle: 'bold'
        });
        npcItem.add(nameText);
        
        // Relationship status
        const relationshipText = this.add.text(55, 32, `💗 ${npc.relationship}`, {
            fontSize: '12px',
            fontFamily: 'Georgia, serif',
            fill: '#daa520'
        });
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
                questIndicatorIcon.setOrigin(0.5).setDepth(npcItem.depth + 1);
                npcItem.add(questIndicatorIcon);
            }
        }
        // End Quest Indicator Logic
        
        // Romance meter bar (brass style)
        const meterFrame = this.add.graphics();
        meterFrame.fillStyle(0xb8860b, 0.8);
        meterFrame.fillRoundedRect(53, 46, 154, 16, 8);
        npcItem.add(meterFrame);
        
        const meterBg = this.add.graphics();
        meterBg.fillStyle(0x654321, 0.8);
        meterBg.fillRoundedRect(55, 48, 150, 12, 6);
        npcItem.add(meterBg);
        
        const meterFill = this.add.graphics();
        const fillPercent = npc.romanceMeter / npc.maxRomance;
        const fillWidth = fillPercent * 150;
        
        // Color based on relationship level (warmer cabin colors)
        let fillColor = 0x8B4513; // Default brown
        if (fillPercent >= 0.8) fillColor = 0xdc143c;      // Crimson (lover)
        else if (fillPercent >= 0.6) fillColor = 0xff6347; // Tomato (romantic)
        else if (fillPercent >= 0.4) fillColor = 0xffd700; // Gold (close friend)
        else if (fillPercent >= 0.2) fillColor = 0xdaa520; // Goldenrod (friend)
        
        meterFill.fillStyle(fillColor, 0.9);
        meterFill.fillRoundedRect(55, 48, fillWidth, 12, 6);
        npcItem.add(meterFill);
        
        // Romance meter percentage
        const percentText = this.add.text(210, 54, `${Math.floor(fillPercent * 100)}%`, {
            fontSize: '11px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700'
        }).setOrigin(0.5);
        npcItem.add(percentText);
        
        // Presence indicator (lantern style)
        const presenceFrame = this.add.graphics();
        presenceFrame.fillStyle(0xb8860b, 0.9);
        presenceFrame.fillCircle(220, 20, 6);
        npcItem.add(presenceFrame);
        
        const statusDot = this.add.graphics();
        statusDot.fillStyle(0xffd700, 0.9); // Golden = present in cabin
        statusDot.fillCircle(220, 20, 4);
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
        
        this.npcListContainer.add(npcItem);
    }

    createChatPanel() {
        const { width, height } = this.cameras.main;
        const panelX = 300;
        const panelWidth = width - 600;
        const panelHeight = height - 180;
        const panelY = 110;
        
        // Panel background (wood with brass trim)
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x8B4513, 0.9);
        panelBg.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        panelBg.lineStyle(3, 0xb8860b, 0.8);
        panelBg.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        
        // Wood grain on chat panel
        for (let i = 0; i < Math.floor(panelHeight / 25); i++) {
            const grain = this.add.graphics();
            grain.lineStyle(1, 0x654321, 0.2);
            grain.lineBetween(panelX + 10, panelY + 10 + i * 25, panelX + panelWidth - 10, panelY + 10 + i * 25);
        }
        
        // Chat header
        this.createChatHeader(panelX, panelY, panelWidth);
        
        // Chat messages area
        this.chatMessagesContainer = this.add.container(panelX + 10, panelY + 60);
        this.cabinContainer.add(this.chatMessagesContainer);
        
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
        
        // Panel background (wood with brass trim)
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x8B4513, 0.9);
        panelBg.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        panelBg.lineStyle(3, 0xb8860b, 0.8); // Brass trim
        panelBg.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 10);
        
        // Wood grain on panel
        for (let i = 0; i < Math.floor(panelHeight / 20); i++) {
            const grain = this.add.graphics();
            grain.lineStyle(1, 0x654321, 0.3);
            grain.lineBetween(panelX + 10, panelY + 10 + i * 20, panelX + panelWidth - 10, panelY + 10 + i * 20);
        }
        
        // Panel title with nautical theme
        this.add.text(panelX + 15, panelY + 15, '💕 Romance Details', {
            fontSize: '18px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700',
            fontStyle: 'bold',
            stroke: '#654321',
            strokeThickness: 1
        });
        
        // Romance details container
        this.romanceDetailsContainer = this.add.container(panelX + 15, panelY + 50);
        this.cabinContainer.add(this.romanceDetailsContainer);
        
        this.refreshRomancePanel();
    }

    refreshRomancePanel() {
        // Clear existing content
        this.romanceDetailsContainer.removeAll(true);
        
        if (!this.selectedNPC) return;
        
        const npc = this.dialogManager.getNPC(this.selectedNPC);
        if (!npc) return;
        
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
        
        // NPC name in portrait
        const portraitName = this.add.text(125, y + 50, npc.name[0], {
            fontSize: '36px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.romanceDetailsContainer.add(portraitName);
        
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
        const largeMeterFrame = this.add.graphics();
        largeMeterFrame.fillStyle(0xb8860b, 0.8);
        largeMeterFrame.fillRoundedRect(-2, y - 2, 224, 24, 12);
        this.romanceDetailsContainer.add(largeMeterFrame);
        
        const largeMeterBg = this.add.graphics();
        largeMeterBg.fillStyle(0x654321, 0.8);
        largeMeterBg.fillRoundedRect(0, y, 220, 20, 10);
        this.romanceDetailsContainer.add(largeMeterBg);
        
        const largeMeterFill = this.add.graphics();
        const fillPercent = npc.romanceMeter / npc.maxRomance;
        const fillWidth = fillPercent * 220;
        
        // Warm cabin colors for romance levels
        let fillColor = 0x8B4513; // Default brown
        if (fillPercent >= 0.8) fillColor = 0xdc143c;      // Crimson (lover)
        else if (fillPercent >= 0.6) fillColor = 0xff6347; // Tomato (romantic)
        else if (fillPercent >= 0.4) fillColor = 0xffd700; // Gold (close friend)
        else if (fillPercent >= 0.2) fillColor = 0xdaa520; // Goldenrod (friend)
        
        largeMeterFill.fillStyle(fillColor, 0.9);
        largeMeterFill.fillRoundedRect(0, y, fillWidth, 20, 10);
        this.romanceDetailsContainer.add(largeMeterFill);
        
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
            { text: '🎣 Fishing Together', action: () => this.inviteFishing() }
        ];
        
        actions.forEach((actionData, index) => {
            // Button background (brass style)
            const buttonFrame = this.add.graphics();
            buttonFrame.fillStyle(0xb8860b, 0.9);
            buttonFrame.fillRoundedRect(-2, y - 2, 204, 39, 10);
            this.romanceDetailsContainer.add(buttonFrame);
            
            const buttonBg = this.add.graphics();
            buttonBg.fillStyle(0x8B4513, 0.8);
            buttonBg.fillRoundedRect(0, y, 200, 35, 8);
            buttonBg.lineStyle(2, 0xdaa520, 0.8);
            buttonBg.strokeRoundedRect(0, y, 200, 35, 8);
            this.romanceDetailsContainer.add(buttonBg);
            
            const buttonText = this.add.text(100, y + 17, actionData.text, {
                fontSize: '12px',
                fontFamily: 'Georgia, serif',
                fill: '#ffd700',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            this.romanceDetailsContainer.add(buttonText);
            
            // Make interactive
            const hitArea = this.add.rectangle(100, y + 17, 200, 35, 0x000000, 0);
            hitArea.setInteractive({ useHandCursor: true });
            hitArea.on('pointerdown', actionData.action);
            
            // Hover effects (warm glow)
            hitArea.on('pointerover', () => {
                buttonBg.clear();
                buttonBg.fillStyle(0xdaa520, 0.9);
                buttonBg.fillRoundedRect(0, y, 200, 35, 8);
                buttonBg.lineStyle(2, 0xffd700, 1);
                buttonBg.strokeRoundedRect(0, y, 200, 35, 8);
            });
            
            hitArea.on('pointerout', () => {
                buttonBg.clear();
                buttonBg.fillStyle(0x8B4513, 0.8);
                buttonBg.fillRoundedRect(0, y, 200, 35, 8);
                buttonBg.lineStyle(2, 0xdaa520, 0.8);
                buttonBg.strokeRoundedRect(0, y, 200, 35, 8);
            });
            
            this.romanceDetailsContainer.add(hitArea);
            
            y += 45;
        });
    }

    createInputArea() {
        const { width, height } = this.cameras.main;
        const inputY = height - 60;
        const inputX = 300;
        const inputWidth = width - 600;
        
        // Input background (wood with brass trim)
        const inputFrame = this.add.graphics();
        inputFrame.fillStyle(0xb8860b, 0.9);
        inputFrame.fillRoundedRect(inputX - 3, inputY - 3, inputWidth + 6, 56, 12);
        
        const inputBg = this.add.graphics();
        inputBg.fillStyle(0x8B4513, 0.9);
        inputBg.fillRoundedRect(inputX, inputY, inputWidth, 50, 10);
        inputBg.lineStyle(2, 0x654321, 0.8);
        inputBg.strokeRoundedRect(inputX, inputY, inputWidth, 50, 10);
        
        // Message input placeholder
        this.messageInputText = this.add.text(inputX + 15, inputY + 25, 'Share your thoughts in the cabin...', {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            fill: '#daa520',
            fontStyle: 'italic'
        }).setOrigin(0, 0.5);
        
        // Send button (brass style)
        const sendFrame = this.add.graphics();
        sendFrame.fillStyle(0xb8860b, 0.9);
        sendFrame.fillRoundedRect(inputX + inputWidth - 63, inputY + 7, 56, 36, 10);
        
        const sendBg = this.add.graphics();
        sendBg.fillStyle(0x8B4513, 0.9);
        sendBg.fillRoundedRect(inputX + inputWidth - 60, inputY + 10, 50, 30, 8);
        
        const sendText = this.add.text(inputX + inputWidth - 35, inputY + 25, 'Send', {
            fontSize: '12px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700',
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
                bubbleBg.fillStyle(0x8B4513, 0.9); // Player: darker wood
                bubbleBg.lineStyle(2, 0x654321, 0.8);
            } else {
                bubbleBg.fillStyle(0xdaa520, 0.8); // NPC: golden wood
                bubbleBg.lineStyle(2, 0xb8860b, 0.8);
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
        
        // Increase romance meter
        this.dialogManager.increaseRomanceMeter(this.selectedNPC, 5);
        
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
        
        // Increase romance meter
        this.dialogManager.increaseRomanceMeter(this.selectedNPC, 3);
        
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
                    npc: this.selectedNPC,
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
                        maxValue: npc.maxRomance
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
                                percentage: Math.floor((npc.romanceMeter / npc.maxRomance) * 100)
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
                        npc: npcId,
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
                specialties: ['Cabin comfort', 'Warm conversations', 'Ocean stories']
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
                specialties: ['Cabin activities', 'Adventure planning', 'Romantic atmosphere']
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
                specialties: ['Cabin meditation', 'Ocean wisdom', 'Sacred spaces']
            }
        ];

        // Load saved data for each NPC
        npcData.forEach(npc => {
            this.loadNPCData(npc.id, npc);
            fallbackManager.npcs.set(npc.id, npc);
        });

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
} 