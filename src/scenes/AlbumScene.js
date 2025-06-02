/**
 * AlbumScene.js - HCG Album System for Luxury Angler
 * Manages unlocked HCG viewing and progress tracking
 */

import Phaser from 'phaser';

export default class AlbumScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AlbumScene' });
        this.unlockedHCGs = new Set();
        this.selectedCategory = 'all';
        this.selectedNPC = 'all';
        this.currentPage = 0;
        this.itemsPerPage = 12;
        this.callingScene = 'CabinScene';
    }
    
    init(data) {
        console.log('AlbumScene: Initialized with data:', data);
        this.callingScene = data.callingScene || 'CabinScene';
        this.unlockedHCGs = new Set(data.unlockedHCGs || []);
    }
    
    preload() {
        // Load album UI assets with error handling
        this.load.on('loaderror', (file) => {
            console.warn('AlbumScene: Failed to load asset:', file.src || file.key);
        });
        
        // Load placeholder HCG thumbnails
        this.load.image('hcg_placeholder', 'data:image/svg+xml;base64,' + btoa(`
            <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" fill="#4a4a6a"/>
                <text x="50" y="50" text-anchor="middle" dy=".3em" fill="#ffffff" font-size="12">HCG</text>
            </svg>
        `));
        
        // Load lock icon
        this.load.image('lock_icon', 'data:image/svg+xml;base64,' + btoa(`
            <svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
                <rect x="15" y="25" width="20" height="15" fill="#666666" stroke="#999999"/>
                <path d="M20 25 Q20 20 25 20 Q30 20 30 25" fill="none" stroke="#999999" stroke-width="2"/>
                <circle cx="25" cy="32" r="2" fill="#999999"/>
            </svg>
        `));
    }
    
    create() {
        this.createAlbumBackground();
        this.createNavigationUI();
        this.createFilterUI();
        this.createHCGGrid();
        this.createPaginationUI();
        this.loadUnlockedHCGs();
        this.refreshAlbumDisplay();
    }
    
    createAlbumBackground() {
        // Dark luxury background
        this.add.rectangle(400, 300, 800, 600, 0x1a1a2e);
        this.add.rectangle(400, 300, 780, 580, 0x16213e);
        
        // Gold border frame
        const border = this.add.graphics();
        border.lineStyle(4, 0xffd700);
        border.strokeRect(10, 10, 780, 580);
        
        // Inner decorative frame
        const innerBorder = this.add.graphics();
        innerBorder.lineStyle(2, 0xb8860b);
        innerBorder.strokeRect(20, 20, 760, 560);
        
        // Album title with luxury styling
        this.add.text(400, 50, '🖼️ Memory Album', {
            fontSize: '36px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Subtitle
        this.add.text(400, 80, 'Your precious memories with the crew', {
            fontSize: '16px',
            fontFamily: 'Georgia, serif',
            fill: '#cccccc',
            fontStyle: 'italic'
        }).setOrigin(0.5);
    }
    
    createNavigationUI() {
        // Back button
        const backButton = this.add.rectangle(70, 50, 100, 35, 0x8B4513);
        backButton.setStrokeStyle(2, 0xffd700);
        
        const backText = this.add.text(70, 50, '⬅️ Back', {
            fontSize: '16px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700'
        }).setOrigin(0.5);
        
        backButton.setInteractive();
        backButton.on('pointerdown', () => this.exitAlbum());
        backButton.on('pointerover', () => {
            backButton.setFillStyle(0xa0522d);
        });
        backButton.on('pointerout', () => {
            backButton.setFillStyle(0x8B4513);
        });
        
        // Progress indicator
        this.progressText = this.add.text(730, 50, this.getProgressText(), {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700'
        }).setOrigin(1, 0.5);
    }
    
    createFilterUI() {
        const filterY = 120;
        
        // Filter label
        this.add.text(50, filterY, 'Filter by:', {
            fontSize: '16px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700'
        });
        
        // NPC filter buttons
        const npcFilters = ['All', 'Mia', 'Sophie', 'Luna'];
        npcFilters.forEach((npc, index) => {
            const x = 150 + (index * 100);
            const isSelected = (npc.toLowerCase() === this.selectedNPC);
            
            const filterButton = this.add.rectangle(x, filterY, 90, 30, 
                isSelected ? 0xffd700 : 0x8B4513);
            filterButton.setStrokeStyle(1, 0xffd700);
            
            const filterText = this.add.text(x, filterY, npc, {
                fontSize: '14px',
                fontFamily: 'Georgia, serif',
                fill: isSelected ? '#000000' : '#ffd700'
            }).setOrigin(0.5);
            
            filterButton.setInteractive();
            filterButton.on('pointerdown', () => this.setNPCFilter(npc.toLowerCase()));
        });
        
        // Rarity filter
        this.add.text(580, filterY, 'Rarity:', {
            fontSize: '16px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700'
        });
        
        const rarityButton = this.add.rectangle(680, filterY, 100, 30, 0x8B4513);
        rarityButton.setStrokeStyle(1, 0xffd700);
        
        this.add.text(680, filterY, 'All Rarities', {
            fontSize: '12px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700'
        }).setOrigin(0.5);
    }
    
    createHCGGrid() {
        this.hcgGrid = this.add.container(400, 350);
        
        // Grid layout configuration
        this.gridConfig = {
            cols: 4,
            rows: 3,
            thumbnailSize: 120,
            spacing: 20
        };
    }
    
    createPaginationUI() {
        const paginationY = 550;
        
        // Previous page button
        this.prevButton = this.add.rectangle(300, paginationY, 80, 30, 0x8B4513);
        this.prevButton.setStrokeStyle(1, 0xffd700);
        
        this.prevText = this.add.text(300, paginationY, '◀ Prev', {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700'
        }).setOrigin(0.5);
        
        this.prevButton.setInteractive();
        this.prevButton.on('pointerdown', () => this.changePage(-1));
        
        // Page indicator
        this.pageText = this.add.text(400, paginationY, 'Page 1 of 1', {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700'
        }).setOrigin(0.5);
        
        // Next page button
        this.nextButton = this.add.rectangle(500, paginationY, 80, 30, 0x8B4513);
        this.nextButton.setStrokeStyle(1, 0xffd700);
        
        this.nextText = this.add.text(500, paginationY, 'Next ▶', {
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700'
        }).setOrigin(0.5);
        
        this.nextButton.setInteractive();
        this.nextButton.on('pointerdown', () => this.changePage(1));
    }
    
    refreshAlbumDisplay() {
        // Clear existing grid
        this.hcgGrid.removeAll(true);
        
        // Get filtered HCG data
        const hcgData = this.getFilteredHCGData();
        const totalPages = Math.ceil(hcgData.length / this.itemsPerPage);
        
        // Update pagination
        this.pageText.setText(`Page ${this.currentPage + 1} of ${Math.max(1, totalPages)}`);
        this.prevButton.setAlpha(this.currentPage > 0 ? 1 : 0.5);
        this.nextButton.setAlpha(this.currentPage < totalPages - 1 ? 1 : 0.5);
        
        // Create grid items for current page
        const startIndex = this.currentPage * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, hcgData.length);
        
        let gridIndex = 0;
        for (let i = startIndex; i < endIndex; i++) {
            const row = Math.floor(gridIndex / this.gridConfig.cols);
            const col = gridIndex % this.gridConfig.cols;
            
            const x = (col - 1.5) * (this.gridConfig.thumbnailSize + this.gridConfig.spacing);
            const y = (row - 1) * (this.gridConfig.thumbnailSize + this.gridConfig.spacing);
            
            this.createHCGThumbnail(x, y, hcgData[i], gridIndex);
            gridIndex++;
        }
        
        // Update progress text
        this.progressText.setText(this.getProgressText());
    }
    
    createHCGThumbnail(x, y, hcgData, index) {
        const isUnlocked = this.unlockedHCGs.has(hcgData.id);
        
        // Thumbnail container
        const thumbnail = this.add.container(x, y);
        
        // Background frame with rarity coloring
        const frameColor = isUnlocked ? this.getRarityColor(hcgData.rarity) : 0x666666;
        const frame = this.add.rectangle(0, 0, this.gridConfig.thumbnailSize, 
            this.gridConfig.thumbnailSize, frameColor, 0.3);
        frame.setStrokeStyle(3, isUnlocked ? 0xffd700 : 0x333333);
        
        if (isUnlocked) {
            // Show HCG thumbnail
            const image = this.add.image(0, 0, 'hcg_placeholder');
            image.setDisplaySize(this.gridConfig.thumbnailSize - 10, this.gridConfig.thumbnailSize - 10);
            image.setTint(0xffffff);
            thumbnail.add(image);
            
            // Rarity gem indicator
            const rarityGem = this.add.circle(45, -45, 8, this.getRarityColor(hcgData.rarity));
            rarityGem.setStrokeStyle(1, 0xffffff);
            thumbnail.add(rarityGem);
            
            // Title overlay
            const titleBg = this.add.rectangle(0, 45, this.gridConfig.thumbnailSize - 5, 20, 0x000000, 0.7);
            const titleText = this.add.text(0, 45, hcgData.title.substring(0, 15), {
                fontSize: '10px',
                fill: '#ffffff'
            }).setOrigin(0.5);
            thumbnail.add([titleBg, titleText]);
            
            // Click handler for preview
            frame.setInteractive();
            frame.on('pointerdown', () => this.previewHCG(hcgData));
            frame.on('pointerover', () => {
                frame.setScale(1.05);
            });
            frame.on('pointerout', () => {
                frame.setScale(1);
            });
            
        } else {
            // Show locked placeholder
            const lockIcon = this.add.image(0, 0, 'lock_icon');
            lockIcon.setDisplaySize(40, 40);
            lockIcon.setTint(0x666666);
            
            const lockText = this.add.text(0, 20, 'Locked', {
                fontSize: '12px',
                fill: '#666666'
            }).setOrigin(0.5);
            
            thumbnail.add([lockIcon, lockText]);
        }
        
        thumbnail.add(frame);
        this.hcgGrid.add(thumbnail);
    }
    
    getFilteredHCGData() {
        // Generate comprehensive HCG data based on GDD specifications
        const allHCGData = this.generateHCGDatabase();
        
        return allHCGData.filter(hcg => {
            if (this.selectedNPC !== 'all' && hcg.npc !== this.selectedNPC) {
                return false;
            }
            return true;
        });
    }
    
    generateHCGDatabase() {
        const hcgDatabase = [];
        
        // Mia HCGs (Helpful Fishing Guide)
        hcgDatabase.push(
            {
                id: 'mia_friendship',
                npc: 'mia',
                title: 'Fishing Lessons',
                description: 'Mia teaches you advanced fishing techniques',
                rarity: 'common',
                threshold: 34,
                category: 'friendship'
            },
            {
                id: 'mia_close_friend',
                title: 'Sunset Fishing',
                npc: 'mia',
                description: 'A beautiful sunset fishing session with Mia',
                rarity: 'uncommon',
                threshold: 50,
                category: 'close_friend'
            },
            {
                id: 'mia_romantic',
                npc: 'mia',
                title: 'Moonlight Confession',
                description: 'Mia confesses her feelings under the moonlight',
                rarity: 'rare',
                threshold: 67,
                category: 'romantic'
            },
            {
                id: 'mia_lover',
                npc: 'mia',
                title: 'Perfect Catch',
                description: 'The ultimate romantic moment with Mia',
                rarity: 'legendary',
                threshold: 84,
                category: 'lover'
            }
        );
        
        // Sophie HCGs (Competitive Enthusiast)
        hcgDatabase.push(
            {
                id: 'sophie_friendship',
                npc: 'sophie',
                title: 'Competitive Spirit',
                description: 'Sophie accepts you as a worthy fishing rival',
                rarity: 'common',
                threshold: 34,
                category: 'friendship'
            },
            {
                id: 'sophie_close_friend',
                npc: 'sophie',
                title: 'Training Partners',
                description: 'Sophie invites you to her exclusive training sessions',
                rarity: 'uncommon',
                threshold: 50,
                category: 'close_friend'
            },
            {
                id: 'sophie_romantic',
                npc: 'sophie',
                title: 'Victory Celebration',
                description: 'Sophie celebrates your joint victory with a romantic gesture',
                rarity: 'rare',
                threshold: 67,
                category: 'romantic'
            },
            {
                id: 'sophie_lover',
                npc: 'sophie',
                title: 'Champion\'s Love',
                description: 'Sophie declares you her champion in fishing and love',
                rarity: 'legendary',
                threshold: 84,
                category: 'lover'
            }
        );
        
        // Luna HCGs (Mystical Ocean Sage)
        hcgDatabase.push(
            {
                id: 'luna_friendship',
                npc: 'luna',
                title: 'Ocean Mysteries',
                description: 'Luna shares ancient ocean wisdom with you',
                rarity: 'common',
                threshold: 34,
                category: 'friendship'
            },
            {
                id: 'luna_close_friend',
                npc: 'luna',
                title: 'Mystical Bond',
                description: 'Luna forms a spiritual connection with you',
                rarity: 'uncommon',
                threshold: 50,
                category: 'close_friend'
            },
            {
                id: 'luna_romantic',
                npc: 'luna',
                title: 'Starlit Romance',
                description: 'A romantic evening under the stars with Luna',
                rarity: 'rare',
                threshold: 67,
                category: 'romantic'
            },
            {
                id: 'luna_lover',
                npc: 'luna',
                title: 'Eternal Ocean Love',
                description: 'Luna pledges her eternal love, deep as the ocean',
                rarity: 'legendary',
                threshold: 84,
                category: 'lover'
            }
        );
        
        // Special group HCGs
        hcgDatabase.push(
            {
                id: 'group_friendship',
                npc: 'group',
                title: 'Cabin Harmony',
                description: 'All Bikini Assistants are your friends',
                rarity: 'rare',
                threshold: 'special',
                category: 'achievement'
            },
            {
                id: 'group_romance',
                npc: 'group',
                title: 'Master of Hearts',
                description: 'Ultimate romantic achievement with all NPCs',
                rarity: 'mythic',
                threshold: 'special',
                category: 'achievement'
            }
        );
        
        return hcgDatabase;
    }
    
    getRarityColor(rarity) {
        const rarityColors = {
            common: 0x999999,
            uncommon: 0x00ff00,
            rare: 0x0080ff,
            legendary: 0xff8000,
            mythic: 0xff00ff
        };
        return rarityColors[rarity] || 0x999999;
    }
    
    previewHCG(hcgData) {
        console.log('AlbumScene: Previewing HCG:', hcgData.title);
        
        // Create full-screen preview modal
        const preview = this.add.container(400, 300);
        preview.setDepth(1000);
        
        // Semi-transparent overlay
        const overlay = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.8);
        overlay.setInteractive();
        
        // Preview background
        const previewBg = this.add.rectangle(0, 0, 500, 400, 0x1a1a2e);
        previewBg.setStrokeStyle(3, this.getRarityColor(hcgData.rarity));
        
        // HCG image (placeholder for now)
        const hcgImage = this.add.image(0, -50, 'hcg_placeholder');
        hcgImage.setDisplaySize(450, 300);
        
        // Title and description
        const titleText = this.add.text(0, 120, hcgData.title, {
            fontSize: '24px',
            fontFamily: 'Georgia, serif',
            fill: '#ffd700',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        const descText = this.add.text(0, 150, hcgData.description, {
            fontSize: '16px',
            fontFamily: 'Georgia, serif',
            fill: '#cccccc',
            wordWrap: { width: 400 }
        }).setOrigin(0.5);
        
        // Rarity indicator
        const rarityText = this.add.text(0, 180, `✨ ${hcgData.rarity.toUpperCase()} ✨`, {
            fontSize: '14px',
            fill: this.getRarityColor(hcgData.rarity),
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        // Close button
        const closeButton = this.add.rectangle(220, -170, 60, 30, 0xff4444);
        closeButton.setStrokeStyle(1, 0xffffff);
        
        const closeText = this.add.text(220, -170, '✕ Close', {
            fontSize: '12px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        closeButton.setInteractive();
        closeButton.on('pointerdown', () => preview.destroy());
        
        // Click overlay to close
        overlay.on('pointerdown', () => preview.destroy());
        
        preview.add([overlay, previewBg, hcgImage, titleText, descText, rarityText, closeButton, closeText]);
        
        // Entrance animation
        preview.setScale(0);
        this.tweens.add({
            targets: preview,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }
    
    setNPCFilter(npc) {
        this.selectedNPC = npc;
        this.currentPage = 0;
        this.refreshAlbumDisplay();
    }
    
    changePage(direction) {
        const hcgData = this.getFilteredHCGData();
        const totalPages = Math.ceil(hcgData.length / this.itemsPerPage);
        
        this.currentPage = Phaser.Math.Clamp(this.currentPage + direction, 0, totalPages - 1);
        this.refreshAlbumDisplay();
    }
    
    getProgressText() {
        const totalHCGs = this.generateHCGDatabase().length;
        const unlockedCount = this.unlockedHCGs.size;
        const percentage = totalHCGs > 0 ? Math.round((unlockedCount / totalHCGs) * 100) : 0;
        
        return `Progress: ${unlockedCount}/${totalHCGs} (${percentage}%)`;
    }
    
    loadUnlockedHCGs() {
        try {
            const saved = localStorage.getItem('cabin_unlocked_hcgs');
            if (saved) {
                const unlockedArray = JSON.parse(saved);
                this.unlockedHCGs = new Set(unlockedArray);
                console.log('AlbumScene: Loaded unlocked HCGs:', unlockedArray);
            }
        } catch (error) {
            console.error('AlbumScene: Failed to load unlocked HCGs:', error);
        }
    }
    
    exitAlbum() {
        console.log('AlbumScene: Returning to', this.callingScene);
        this.scene.stop();
        this.scene.resume(this.callingScene);
    }
} 