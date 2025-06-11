/**
 * DialogDataConverter - Converts JSON dialog data to RenJs script format
 * Enables seamless switching between custom and RenJs dialog systems
 */
export class DialogDataConverter {
    constructor() {
        this.renjsScriptCache = new Map();
        this.characterMappings = {
            'Captain': 'captain',
            'Mia': 'mia',
            'Sophie': 'sophie',
            'Luna': 'luna',
            'Shopkeeper': 'shopkeeper',
            'Tournament Director': 'tournament_director',
            'Festival Organizer': 'festival_organizer',
            'Weather Reporter': 'weather_reporter',
            'Mysterious Merchant': 'mysterious_merchant',
            'Ancient Guardian': 'ancient_guardian',
            'Ancient Mariner': 'ancient_mariner'
        };
    }

    /**
     * Convert JSON dialog to RenJs script format
     * @param {Object} dialogData - JSON dialog data
     * @returns {string} RenJs script content
     */
    convertToRenJsScript(dialogData) {
        if (this.renjsScriptCache.has(dialogData.id)) {
            return this.renjsScriptCache.get(dialogData.id);
        }

        let script = this.generateRenJsHeader(dialogData);
        script += this.generateRenJsDialog(dialogData);
        script += this.generateRenJsChoices(dialogData);
        script += this.generateRenJsEffects(dialogData);

        this.renjsScriptCache.set(dialogData.id, script);
        return script;
    }

    /**
     * Generate RenJs script header
     */
    generateRenJsHeader(dialogData) {
        const character = this.characterMappings[dialogData.speaker] || dialogData.speaker.toLowerCase();
        
        return `
// ${dialogData.title}
// Type: ${dialogData.type}
// Generated from JSON dialog data

define ${character} = Character("${dialogData.speaker}", color="#4ecdc4")

label ${dialogData.id}:
    scene bg_boat_deck with fade
    show ${character} at center with dissolve
    
`;
    }

    /**
     * Generate main dialog content
     */
    generateRenJsDialog(dialogData) {
        const character = this.characterMappings[dialogData.speaker] || dialogData.speaker.toLowerCase();
        
        // Escape quotes and format text for RenJs
        const text = this.escapeRenJsText(dialogData.text);
        
        return `    ${character} "${text}"\n\n`;
    }

    /**
     * Generate choice menu for RenJs
     */
    generateRenJsChoices(dialogData) {
        if (!dialogData.choices || dialogData.choices.length === 0) {
            return '    return\n';
        }

        let script = '    menu:\n';
        
        dialogData.choices.forEach(choice => {
            const choiceText = this.escapeRenJsText(choice.text);
            script += `        "${choiceText}":\n`;
            script += `            call ${dialogData.id}_${choice.id}\n`;
        });

        script += '\n    return\n\n';
        return script;
    }

    /**
     * Generate effect handlers for each choice
     */
    generateRenJsEffects(dialogData) {
        if (!dialogData.choices || dialogData.choices.length === 0) {
            return '';
        }

        let script = '';
        
        dialogData.choices.forEach(choice => {
            script += `label ${dialogData.id}_${choice.id}:\n`;
            
            if (choice.effects) {
                script += this.generateEffectCalls(choice.effects, dialogData);
            }
            
            if (choice.effects && choice.effects.dialogue) {
                const responseText = this.escapeRenJsText(choice.effects.dialogue);
                const character = this.characterMappings[dialogData.speaker] || dialogData.speaker.toLowerCase();
                script += `    ${character} "${responseText}"\n`;
            }
            
            script += '    return\n\n';
        });

        return script;
    }

    /**
     * Generate RenJs calls for dialog effects
     */
    generateEffectCalls(effects, dialogData) {
        let script = '';

        // Romance effects
        if (effects.romance) {
            Object.entries(effects.romance).forEach(([npcId, points]) => {
                script += `    $ renpy.call_in_new_context("update_romance", "${npcId}", ${points})\n`;
            });
        }

        // Quest progression
        if (effects.questProgress) {
            script += `    $ renpy.call_in_new_context("progress_quest", "${effects.questProgress}")\n`;
        }

        // Unlock quests
        if (effects.unlockQuest) {
            script += `    $ renpy.call_in_new_context("unlock_quest", "${effects.unlockQuest}")\n`;
        }

        // Experience rewards
        if (effects.experience) {
            script += `    $ renpy.call_in_new_context("add_experience", ${effects.experience})\n`;
        }

        // Coin rewards
        if (effects.coins) {
            script += `    $ renpy.call_in_new_context("add_coins", ${effects.coins})\n`;
        }

        // Item rewards
        if (effects.items) {
            effects.items.forEach(item => {
                script += `    $ renpy.call_in_new_context("add_item", "${item}")\n`;
            });
        }

        // Map unlocks
        if (effects.unlockMap) {
            script += `    $ renpy.call_in_new_context("unlock_map", "${effects.unlockMap}")\n`;
        }

        // Boss unlocks
        if (effects.unlockBoss) {
            script += `    $ renpy.call_in_new_context("unlock_boss", "${effects.unlockBoss}")\n`;
        }

        // Minigame starts
        if (effects.startMinigame) {
            script += `    $ renpy.call_in_new_context("start_minigame", "${effects.startMinigame}")\n`;
        }

        // UI opens
        if (effects.openUI) {
            script += `    $ renpy.call_in_new_context("open_ui", "${effects.openUI}")\n`;
        }

        return script;
    }

    /**
     * Escape text for RenJs format
     */
    escapeRenJsText(text) {
        return text
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\*/g, '\\*');
    }

    /**
     * Convert multiple dialogs to RenJs script file
     */
    convertDialogSetToRenJs(dialogs, filename) {
        let fullScript = `# ${filename}\n# Generated from JSON dialog data\n\n`;
        
        dialogs.forEach(dialog => {
            fullScript += this.convertToRenJsScript(dialog);
            fullScript += '\n';
        });

        return fullScript;
    }

    /**
     * Generate RenJs character definitions
     */
    generateCharacterDefinitions() {
        let script = '# Character Definitions\n\n';
        
        Object.entries(this.characterMappings).forEach(([displayName, varName]) => {
            const color = this.getCharacterColor(varName);
            script += `define ${varName} = Character("${displayName}", color="${color}")\n`;
        });

        script += '\n';
        return script;
    }

    /**
     * Get character color for RenJs
     */
    getCharacterColor(character) {
        const colors = {
            'captain': '#4ecdc4',
            'mia': '#ff6b9d',
            'sophie': '#ffa726',
            'luna': '#9c27b0',
            'shopkeeper': '#66bb6a',
            'tournament_director': '#ef5350',
            'festival_organizer': '#42a5f5',
            'weather_reporter': '#78909c',
            'mysterious_merchant': '#8e24aa',
            'ancient_guardian': '#5d4037',
            'ancient_mariner': '#37474f'
        };
        return colors[character] || '#4ecdc4';
    }

    /**
     * Create RenJs integration callbacks
     */
    createRenJsCallbacks() {
        return {
            update_romance: (npcId, points) => {
                if (window.LuxuryAnglerDialog) {
                    window.LuxuryAnglerDialog.increaseRomance(npcId, points);
                }
            },
            progress_quest: (questId) => {
                if (window.LuxuryAnglerGame) {
                    window.LuxuryAnglerGame.execute('progressQuest', questId);
                }
            },
            unlock_quest: (questId) => {
                if (window.LuxuryAnglerGame) {
                    window.LuxuryAnglerGame.execute('startQuest', questId);
                }
            },
            add_experience: (amount) => {
                if (window.LuxuryAnglerDialog) {
                    // Handle experience addition
                    console.log('RenJs: Adding experience:', amount);
                }
            },
            add_coins: (amount) => {
                if (window.LuxuryAnglerDialog) {
                    // Handle coin addition
                    console.log('RenJs: Adding coins:', amount);
                }
            },
            add_item: (itemId) => {
                if (window.LuxuryAnglerDialog) {
                    window.LuxuryAnglerDialog.giveItem(itemId, 1);
                }
            },
            unlock_map: (mapId) => {
                if (window.LuxuryAnglerGame) {
                    // Handle map unlock
                    console.log('RenJs: Unlocking map:', mapId);
                }
            },
            unlock_boss: (bossId) => {
                if (window.LuxuryAnglerGame) {
                    // Handle boss unlock
                    console.log('RenJs: Unlocking boss:', bossId);
                }
            },
            start_minigame: (minigameId) => {
                if (window.LuxuryAnglerGame) {
                    // Handle minigame start
                    console.log('RenJs: Starting minigame:', minigameId);
                }
            },
            open_ui: (uiId) => {
                if (window.LuxuryAnglerGame) {
                    // Handle UI opening
                    console.log('RenJs: Opening UI:', uiId);
                }
            }
        };
    }

    /**
     * Check if dialog should use RenJs or custom system
     */
    shouldUseRenJs(dialogData) {
        // Use RenJs for story and romantic dialogs for better visual novel experience
        return dialogData.type === 'story' || dialogData.type === 'romantic_npc';
    }

    /**
     * Get dialog data in appropriate format for current system
     */
    getDialogForSystem(dialogData, useRenJs = false) {
        if (useRenJs && this.shouldUseRenJs(dialogData)) {
            return {
                format: 'renjs',
                script: this.convertToRenJsScript(dialogData),
                callbacks: this.createRenJsCallbacks()
            };
        } else {
            return {
                format: 'custom',
                data: dialogData
            };
        }
    }
} 