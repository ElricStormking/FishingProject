/**
 * HCGUnlockSystem.js - Manages HCG unlocks based on romance meter progression
 * Implements the romance threshold system defined in the Game Design Document
 */

export default class HCGUnlockSystem {
    constructor() {
        this.romanceThresholds = this.initializeRomanceThresholds();
        this.hcgDatabase = this.initializeHCGDatabase();
        this.unlockedHCGs = new Set(this.loadUnlockedHCGs());
        this.achievementHCGs = this.initializeAchievementHCGs();
    }
    
    initializeRomanceThresholds() {
        return {
            // Non-HCG Relationship Levels
            stranger: { 
                min: 0, 
                max: 16, 
                name: "Stranger",
                hcgUnlocks: [],
                description: "Just met, basic interactions available"
            },
            acquaintance: { 
                min: 17, 
                max: 33, 
                name: "Acquaintance",
                hcgUnlocks: [],
                description: "Getting to know each other, friendly conversations"
            },
            
            // HCG Unlock Levels
            friend: { 
                min: 34, 
                max: 49, 
                name: "Friend",
                hcgUnlocks: ["friendship_hcg"],
                unlockMessage: "🌟 Friendship HCG unlocked!",
                description: "True friendship established, personal moments shared",
                hcgRarity: "common"
            },
            close_friend: { 
                min: 50, 
                max: 66, 
                name: "Close Friend",
                hcgUnlocks: ["close_friend_hcg"],
                unlockMessage: "✨ Close Friend HCG unlocked!",
                description: "Deep trust and understanding, intimate friendship",
                hcgRarity: "uncommon"
            },
            romantic_interest: { 
                min: 67, 
                max: 83, 
                name: "Romantic Interest",
                hcgUnlocks: ["romantic_hcg"],
                unlockMessage: "💖 Romantic HCG unlocked!",
                description: "Romance begins, special romantic moments",
                hcgRarity: "rare"
            },
            lover: { 
                min: 84, 
                max: 100, 
                name: "Lover",
                hcgUnlocks: ["lover_hcg"],
                unlockMessage: "💞 Lover HCG unlocked!",
                description: "Ultimate romantic connection, deepest intimacy",
                hcgRarity: "legendary"
            }
        };
    }
    
    initializeHCGDatabase() {
        return {
            // Mia (Helpful Fishing Guide) HCGs
            mia: {
                friendship: {
                    id: 'mia_friendship',
                    threshold: 34,
                    title: 'Fishing Lessons',
                    description: 'Mia teaches you advanced fishing techniques',
                    rarity: 'common',
                    unlockMessage: 'Mia shares her fishing wisdom with you!',
                    sceneDescription: 'A peaceful moment by the water as Mia patiently guides your casting technique',
                    rewardValue: { xp: 100, coins: 500 }
                },
                close_friend: {
                    id: 'mia_close_friend',
                    threshold: 50,
                    title: 'Sunset Fishing',
                    description: 'A beautiful sunset fishing session with Mia',
                    rarity: 'uncommon',
                    unlockMessage: 'Mia trusts you with her favorite fishing spot!',
                    sceneDescription: 'Golden hour fishing with Mia at her secret location overlooking the ocean',
                    rewardValue: { xp: 200, coins: 1000 }
                },
                romantic: {
                    id: 'mia_romantic',
                    threshold: 67,
                    title: 'Moonlight Confession',
                    description: 'Mia confesses her feelings under the moonlight',
                    rarity: 'rare',
                    unlockMessage: 'Love blooms under the starlit sky with Mia!',
                    sceneDescription: 'A romantic evening confession by the moonlit waters',
                    rewardValue: { xp: 500, coins: 2000, special_lure: 'mia_special_lure' }
                },
                lover: {
                    id: 'mia_lover',
                    threshold: 84,
                    title: 'Perfect Catch',
                    description: 'The ultimate romantic moment with Mia',
                    rarity: 'legendary',
                    unlockMessage: 'Mia is your perfect catch!',
                    sceneDescription: 'The culmination of your romance with Mia, a perfect moment of love and understanding',
                    rewardValue: { xp: 1000, coins: 5000, legendary_rod: 'mia_lovers_rod' }
                }
            },
            
            // Sophie (Competitive Enthusiast) HCGs
            sophie: {
                friendship: {
                    id: 'sophie_friendship',
                    threshold: 34,
                    title: 'Competitive Spirit',
                    description: 'Sophie accepts you as a worthy fishing rival',
                    rarity: 'common',
                    unlockMessage: 'Sophie acknowledges your fishing skills!',
                    sceneDescription: 'An intense but friendly fishing competition that builds mutual respect',
                    rewardValue: { xp: 100, coins: 500 }
                },
                close_friend: {
                    id: 'sophie_close_friend',
                    threshold: 50,
                    title: 'Training Partners',
                    description: 'Sophie invites you to her exclusive training sessions',
                    rarity: 'uncommon',
                    unlockMessage: 'Sophie wants to train with you personally!',
                    sceneDescription: 'Intense training session where Sophie shares her advanced techniques',
                    rewardValue: { xp: 200, coins: 1000 }
                },
                romantic: {
                    id: 'sophie_romantic',
                    threshold: 67,
                    title: 'Victory Celebration',
                    description: 'Sophie celebrates your joint victory with a romantic gesture',
                    rarity: 'rare',
                    unlockMessage: 'Sophie chooses you as her partner in victory and love!',
                    sceneDescription: 'After winning a major competition together, Sophie expresses her romantic feelings',
                    rewardValue: { xp: 500, coins: 2000, special_lure: 'sophie_victory_lure' }
                },
                lover: {
                    id: 'sophie_lover',
                    threshold: 84,
                    title: 'Champion\'s Love',
                    description: 'Sophie declares you her champion in fishing and love',
                    rarity: 'legendary',
                    unlockMessage: 'Sophie crowns you as her champion of love!',
                    sceneDescription: 'The ultimate moment where Sophie chooses you as her life partner and fishing companion',
                    rewardValue: { xp: 1000, coins: 5000, legendary_boat: 'sophie_champion_boat' }
                }
            },
            
            // Luna (Mystical Ocean Sage) HCGs
            luna: {
                friendship: {
                    id: 'luna_friendship',
                    threshold: 34,
                    title: 'Ocean Mysteries',
                    description: 'Luna shares ancient ocean wisdom with you',
                    rarity: 'common',
                    unlockMessage: 'Luna reveals the secrets of the deep to you!',
                    sceneDescription: 'Luna teaching you about the mystical aspects of the ocean and its creatures',
                    rewardValue: { xp: 100, coins: 500 }
                },
                close_friend: {
                    id: 'luna_close_friend',
                    threshold: 50,
                    title: 'Mystical Bond',
                    description: 'Luna forms a spiritual connection with you',
                    rarity: 'uncommon',
                    unlockMessage: 'Luna opens her heart and soul to you!',
                    sceneDescription: 'A mystical ceremony where Luna shares her deepest spiritual knowledge',
                    rewardValue: { xp: 200, coins: 1000 }
                },
                romantic: {
                    id: 'luna_romantic',
                    threshold: 67,
                    title: 'Starlit Romance',
                    description: 'A romantic evening under the stars with Luna',
                    rarity: 'rare',
                    unlockMessage: 'Luna shows you the beauty of eternal love!',
                    sceneDescription: 'Luna reveals her romantic feelings under a canopy of stars reflected in calm waters',
                    rewardValue: { xp: 500, coins: 2000, special_lure: 'luna_mystical_lure' }
                },
                lover: {
                    id: 'luna_lover',
                    threshold: 84,
                    title: 'Eternal Ocean Love',
                    description: 'Luna pledges her eternal love, deep as the ocean',
                    rarity: 'legendary',
                    unlockMessage: 'Luna\'s love flows through you like the eternal tides!',
                    sceneDescription: 'The ultimate spiritual and romantic union with Luna, blessed by the ocean itself',
                    rewardValue: { xp: 1000, coins: 5000, mythic_rod: 'luna_ocean_soul_rod' }
                }
            }
        };
    }
    
    initializeAchievementHCGs() {
        return {
            // Group Achievement HCGs
            all_friends: {
                id: 'group_friendship',
                requirement: 'friend_level_all_npcs',
                title: 'Cabin Harmony',
                description: 'All Bikini Assistants are your friends',
                rarity: 'rare',
                unlockMessage: 'Everyone in the cabin loves spending time with you!',
                rewardValue: { xp: 1000, coins: 3000, special_boat_upgrade: 'friendship_cabin' }
            },
            
            romance_master: {
                id: 'group_romance',
                requirement: 'lover_level_all_npcs',
                title: 'Master of Hearts',
                description: 'Ultimate romantic achievement with all NPCs',
                rarity: 'mythic',
                unlockMessage: 'You are the undisputed master of romance!',
                rewardValue: { xp: 5000, coins: 10000, ultimate_boat: 'love_yacht', title: 'Romance Master' }
            },
            
            angler_and_lover: {
                id: 'ultimate_angler',
                requirement: 'max_level_and_all_lovers',
                title: 'Ultimate Luxury Angler',
                description: 'Master angler with all romantic relationships maxed',
                rarity: 'mythic',
                unlockMessage: 'You have achieved the pinnacle of luxury angling and romance!',
                rewardValue: {
                    xp: 10000,
                    coins: 25000,
                    ultimate_equipment_set: 'luxury_master_set',
                    permanent_buffs: ['romance_master', 'angler_legend'],
                    title: 'Luxury Angler Legend'
                }
            }
        };
    }
    
    /**
     * Check for HCG unlocks when romance meter changes
     * @param {string} npcId - The NPC identifier (mia, sophie, luna)
     * @param {number} oldValue - Previous romance meter value
     * @param {number} newValue - New romance meter value
     * @returns {Array} Array of newly unlocked HCG data
     */
    checkForUnlocks(npcId, oldValue, newValue) {
        console.log(`HCGUnlockSystem: Checking unlocks for ${npcId}: ${oldValue} -> ${newValue}`);
        
        const newUnlocks = [];
        const npcHCGs = this.hcgDatabase[npcId];
        
        if (!npcHCGs) {
            console.warn(`HCGUnlockSystem: No HCG data found for NPC ${npcId}`);
            return newUnlocks;
        }
        
        // Check each HCG threshold for this NPC
        Object.values(npcHCGs).forEach(hcgData => {
            const hcgId = hcgData.id;
            const threshold = hcgData.threshold;
            
            // Check if we crossed the threshold and haven't unlocked yet
            if (oldValue < threshold && newValue >= threshold && !this.unlockedHCGs.has(hcgId)) {
                console.log(`HCGUnlockSystem: Unlocking HCG ${hcgId} for ${npcId}`);
                this.unlockHCG(hcgId, hcgData);
                newUnlocks.push({
                    npcId,
                    hcgData,
                    unlockType: 'romance_threshold'
                });
            }
        });
        
        // Check for achievement HCGs
        const achievementUnlocks = this.checkAchievementUnlocks();
        newUnlocks.push(...achievementUnlocks);
        
        return newUnlocks;
    }
    
    /**
     * Check for achievement-based HCG unlocks
     * @returns {Array} Array of newly unlocked achievement HCGs
     */
    checkAchievementUnlocks() {
        const newUnlocks = [];
        
        // Check if all NPCs are friends (level 34+)
        if (this.areAllNPCsAtLevel(34) && !this.unlockedHCGs.has('group_friendship')) {
            const hcgData = this.achievementHCGs.all_friends;
            this.unlockHCG(hcgData.id, hcgData);
            newUnlocks.push({
                npcId: 'group',
                hcgData,
                unlockType: 'achievement'
            });
        }
        
        // Check if all NPCs are lovers (level 84+)
        if (this.areAllNPCsAtLevel(84) && !this.unlockedHCGs.has('group_romance')) {
            const hcgData = this.achievementHCGs.romance_master;
            this.unlockHCG(hcgData.id, hcgData);
            newUnlocks.push({
                npcId: 'group',
                hcgData,
                unlockType: 'achievement'
            });
        }
        
        return newUnlocks;
    }
    
    /**
     * Check if all NPCs have reached a specific romance level
     * @param {number} minimumLevel - The minimum romance meter value
     * @returns {boolean} True if all NPCs meet the requirement
     */
    areAllNPCsAtLevel(minimumLevel) {
        const npcs = ['mia', 'sophie', 'luna'];
        
        return npcs.every(npcId => {
            const romanceLevel = this.getNPCRomanceLevel(npcId);
            return romanceLevel >= minimumLevel;
        });
    }
    
    /**
     * Get the current romance level for an NPC
     * @param {string} npcId - The NPC identifier
     * @returns {number} Current romance meter value
     */
    getNPCRomanceLevel(npcId) {
        try {
            const npcData = JSON.parse(localStorage.getItem(`cabin_npc_${npcId}`));
            return npcData?.romanceMeter || 0;
        } catch (error) {
            console.warn(`HCGUnlockSystem: Could not get romance level for ${npcId}:`, error);
            return 0;
        }
    }
    
    /**
     * Unlock an HCG and save to storage
     * @param {string} hcgId - The HCG identifier
     * @param {Object} hcgData - The HCG data object
     */
    unlockHCG(hcgId, hcgData) {
        this.unlockedHCGs.add(hcgId);
        this.saveUnlockedHCGs();
        
        console.log(`HCGUnlockSystem: HCG ${hcgId} unlocked:`, hcgData.title);
        
        // Grant rewards if specified
        if (hcgData.rewardValue) {
            this.grantRewards(hcgData.rewardValue);
        }
        
        // Mark as new for album notification
        this.markAsNewHCG(hcgId);
    }
    
    /**
     * Grant rewards from HCG unlock
     * @param {Object} rewards - The reward object
     */
    grantRewards(rewards) {
        console.log('HCGUnlockSystem: Granting rewards:', rewards);
        
        // Grant XP
        if (rewards.xp) {
            // TODO: Integrate with player progression system
            console.log(`Granted ${rewards.xp} XP`);
        }
        
        // Grant coins
        if (rewards.coins) {
            // TODO: Integrate with economy system
            console.log(`Granted ${rewards.coins} coins`);
        }
        
        // Grant special items
        if (rewards.special_lure || rewards.legendary_rod || rewards.legendary_boat) {
            // TODO: Integrate with inventory system
            console.log('Granted special equipment:', rewards);
        }
    }
    
    /**
     * Mark HCG as new for album notification badge
     * @param {string} hcgId - The HCG identifier
     */
    markAsNewHCG(hcgId) {
        try {
            const newHCGs = JSON.parse(localStorage.getItem('cabin_new_hcgs') || '[]');
            if (!newHCGs.includes(hcgId)) {
                newHCGs.push(hcgId);
                localStorage.setItem('cabin_new_hcgs', JSON.stringify(newHCGs));
            }
        } catch (error) {
            console.error('HCGUnlockSystem: Failed to mark HCG as new:', error);
        }
    }
    
    /**
     * Get the count of new HCGs for notification badge
     * @returns {number} Number of new unlocked HCGs
     */
    getNewHCGCount() {
        try {
            const newHCGs = JSON.parse(localStorage.getItem('cabin_new_hcgs') || '[]');
            return newHCGs.length;
        } catch (error) {
            console.error('HCGUnlockSystem: Failed to get new HCG count:', error);
            return 0;
        }
    }
    
    /**
     * Clear new HCG notifications (called when album is viewed)
     */
    clearNewHCGNotifications() {
        localStorage.setItem('cabin_new_hcgs', '[]');
    }
    
    /**
     * Get HCG data by ID
     * @param {string} hcgId - The HCG identifier
     * @returns {Object|null} HCG data object or null if not found
     */
    getHCGData(hcgId) {
        // Search through all NPCs
        for (const npcId in this.hcgDatabase) {
            const npcHCGs = this.hcgDatabase[npcId];
            for (const category in npcHCGs) {
                if (npcHCGs[category].id === hcgId) {
                    return { ...npcHCGs[category], npcId };
                }
            }
        }
        
        // Search achievement HCGs
        for (const achievementId in this.achievementHCGs) {
            if (this.achievementHCGs[achievementId].id === hcgId) {
                return { ...this.achievementHCGs[achievementId], npcId: 'group' };
            }
        }
        
        return null;
    }
    
    /**
     * Check if an HCG is unlocked
     * @param {string} hcgId - The HCG identifier
     * @returns {boolean} True if unlocked
     */
    isHCGUnlocked(hcgId) {
        return this.unlockedHCGs.has(hcgId);
    }
    
    /**
     * Get all unlocked HCG IDs
     * @returns {Array} Array of unlocked HCG IDs
     */
    getUnlockedHCGs() {
        return Array.from(this.unlockedHCGs);
    }
    
    /**
     * Load unlocked HCGs from storage
     * @returns {Array} Array of unlocked HCG IDs
     */
    loadUnlockedHCGs() {
        try {
            const saved = localStorage.getItem('cabin_unlocked_hcgs');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('HCGUnlockSystem: Failed to load unlocked HCGs:', error);
            return [];
        }
    }
    
    /**
     * Save unlocked HCGs to storage
     */
    saveUnlockedHCGs() {
        try {
            const unlockedArray = Array.from(this.unlockedHCGs);
            localStorage.setItem('cabin_unlocked_hcgs', JSON.stringify(unlockedArray));
        } catch (error) {
            console.error('HCGUnlockSystem: Failed to save unlocked HCGs:', error);
        }
    }
    
    /**
     * Get relationship level name from romance meter value
     * @param {number} romanceMeter - Current romance meter value
     * @returns {string} Relationship level name
     */
    getRelationshipLevel(romanceMeter) {
        for (const [levelName, threshold] of Object.entries(this.romanceThresholds)) {
            if (romanceMeter >= threshold.min && romanceMeter <= threshold.max) {
                return threshold.name;
            }
        }
        return "Unknown";
    }
    
    /**
     * Debug method to unlock all HCGs for testing
     */
    unlockAllHCGs() {
        console.log('HCGUnlockSystem: Unlocking all HCGs for testing');
        
        // Unlock all romance HCGs
        for (const npcId in this.hcgDatabase) {
            const npcHCGs = this.hcgDatabase[npcId];
            for (const category in npcHCGs) {
                this.unlockedHCGs.add(npcHCGs[category].id);
            }
        }
        
        // Unlock all achievement HCGs
        for (const achievementId in this.achievementHCGs) {
            this.unlockedHCGs.add(this.achievementHCGs[achievementId].id);
        }
        
        this.saveUnlockedHCGs();
    }
} 