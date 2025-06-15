/**
 * MarkdownDialogParser - Parses RenJs-style markdown dialog files
 * Converts markdown dialog scripts to JSON format for DialogScene
 */
export default class MarkdownDialogParser {
    constructor() {
        this.currentScript = null;
        this.parsedData = null;
    }

    /**
     * Load and parse a markdown dialog file
     * @param {string} filename - Dialog file name (e.g., 'mia_romance.md')
     * @param {string} npcId - NPC identifier
     * @returns {Promise<Object>} Parsed dialog data
     */
    async loadAndParseFile(filename, npcId) {
        try {
            console.log(`MarkdownDialogParser: Loading ${filename} for ${npcId}`);
            
            // Try multiple possible paths for Vite dev server
            const possiblePaths = [
                `/assets/dialog/${filename}`,           // Public assets path (most likely)
                `./assets/dialog/${filename}`,          // Relative public path
                `/public/assets/dialog/${filename}`,    // Full public path
                `./public/assets/dialog/${filename}`,   // Relative full path
                `assets/dialog/${filename}`             // Direct assets path
            ];
            
            let scriptContent = null;
            let successfulPath = null;
            
            for (const path of possiblePaths) {
                try {
                    const response = await fetch(path);
                    if (response.ok) {
                        scriptContent = await response.text();
                        successfulPath = path;
                        console.log(`MarkdownDialogParser: Successfully loaded dialog from ${path}`);
                        break;
                    }
                } catch (fetchError) {
                    // Silently continue to next path - this is expected behavior
                    continue;
                }
            }
            
            if (!scriptContent) {
                console.warn(`MarkdownDialogParser: Could not load dialog file ${filename} from any path, using fallback`);
                return this.createFallbackDialog(npcId);
            }
            
            const parsedData = this.parseScript(scriptContent, npcId);
            console.log(`MarkdownDialogParser: Successfully parsed dialog for ${npcId}`);
            
            return parsedData;
            
        } catch (error) {
            console.warn('MarkdownDialogParser: Error loading dialog file, using fallback:', error.message);
            return this.createFallbackDialog(npcId);
        }
    }

    /**
     * Parse a markdown dialog script
     * @param {string} scriptContent - The markdown script content
     * @param {string} npcId - The NPC ID for this dialog
     * @returns {Object} Parsed dialog data
     */
    parseScript(scriptContent, npcId = 'unknown') {
        if (!scriptContent) {
            console.warn('MarkdownDialogParser: No script content provided, using fallback');
            return this.createFallbackDialog(npcId);
        }

        this.currentScript = scriptContent;
        
        try {
            // Parse the script into sections
            const sections = this.parseIntoSections(scriptContent);
            
            // Find the START section
            const startSection = sections.find(section => section.label === 'START');
            if (!startSection) {
                console.warn('MarkdownDialogParser: No START section found in script, using fallback');
                return this.createFallbackDialog(npcId);
            }

            // Convert to DialogScene format
            const dialogData = this.convertToDialogData(startSection, sections, npcId);
            
            return dialogData;
            
        } catch (error) {
            console.warn('MarkdownDialogParser: Error parsing script, using fallback:', error.message);
            return this.createFallbackDialog(npcId);
        }
    }

    /**
     * Parse script content into labeled sections
     * @param {string} content - Script content
     * @returns {Array} Array of section objects
     */
    parseIntoSections(content) {
        const sections = [];
        const lines = content.split('\n');
        let currentSection = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines and comments
            if (!line || line.startsWith('#')) continue;
            
            // Check for section label (::LABEL)
            if (line.startsWith('::')) {
                // Save previous section
                if (currentSection) {
                    sections.push(currentSection);
                }
                
                // Start new section
                const label = line.substring(2).trim();
                currentSection = {
                    label: label,
                    speaker: null,
                    text: '',
                    choices: [],
                    effects: []
                };
                continue;
            }
            
            if (!currentSection) continue;
            
            // Parse speaker and dialog text (**Speaker:** "text")
            if (line.startsWith('**') && line.includes(':**')) {
                const speakerMatch = line.match(/\*\*(.*?):\*\*\s*"?(.*?)"?$/);
                if (speakerMatch) {
                    currentSection.speaker = speakerMatch[1].trim();
                    const dialogText = speakerMatch[2].trim();
                    if (dialogText && dialogText !== '"') {
                        currentSection.text = dialogText.replace(/^"|"$/g, '');
                    }
                }
                continue;
            }
            
            // Parse dialog text continuation (quoted text)
            if (line.startsWith('"') && line.endsWith('"')) {
                const text = line.substring(1, line.length - 1);
                if (currentSection.text) {
                    currentSection.text += ' ' + text;
                } else {
                    currentSection.text = text;
                }
                continue;
            }
            
            // Parse choices (+ "choice text" -> target)
            if (line.startsWith('+')) {
                const choiceMatch = line.match(/\+\s*"(.*?)"\s*->\s*(\w+)/);
                if (choiceMatch) {
                    currentSection.choices.push({
                        text: choiceMatch[1].trim(),
                        target: choiceMatch[2].trim(),
                        id: `choice_${currentSection.choices.length}`
                    });
                }
                continue;
            }
            
            // Parse effects (@call command {...})
            if (line.startsWith('@call')) {
                const effectMatch = line.match(/@call\s+(\w+)\s*({.*})?/);
                if (effectMatch) {
                    const command = effectMatch[1];
                    let params = {};
                    
                    if (effectMatch[2]) {
                        try {
                            params = JSON.parse(effectMatch[2]);
                        } catch (e) {
                            console.warn('MarkdownDialogParser: Failed to parse effect params:', effectMatch[2]);
                        }
                    }
                    
                    currentSection.effects.push({
                        command: command,
                        params: params
                    });
                }
                continue;
            }
            
            // Parse action text (*action description*)
            if (line.startsWith('*') && line.endsWith('*')) {
                const action = line.substring(1, line.length - 1);
                if (currentSection.text) {
                    currentSection.text += '\n\n*' + action + '*';
                } else {
                    currentSection.text = '*' + action + '*';
                }
                continue;
            }
            
            // Parse regular dialog text continuation
            if (line && !line.startsWith('::') && !line.startsWith('+') && !line.startsWith('@')) {
                if (currentSection.text) {
                    currentSection.text += ' ' + line;
                } else {
                    currentSection.text = line;
                }
            }
        }
        
        // Add the last section
        if (currentSection) {
            sections.push(currentSection);
        }
        
        return sections;
    }

    /**
     * Convert parsed sections to DialogScene format
     * @param {Object} startSection - The START section
     * @param {Array} allSections - All parsed sections
     * @param {string} npcId - NPC identifier
     * @returns {Object} Dialog data for DialogScene
     */
    convertToDialogData(startSection, allSections, npcId) {
        const npcName = this.extractNPCName(startSection.speaker, npcId);
        
        // Create base dialog data
        const dialogData = {
            id: `${npcId}_romance_dialog`,
            type: 'romantic_npc',
            title: `Romance Dialog with ${npcName}`,
            speaker: npcName,
            text: startSection.text || `Hello! I'm ${npcName}.`,
            choices: [],
            effects: startSection.effects || [],
            sections: allSections // Store all sections for navigation
        };
        
        // Convert choices to DialogScene format
        if (startSection.choices && startSection.choices.length > 0) {
            dialogData.choices = startSection.choices.map(choice => ({
                id: choice.id,
                text: choice.text,
                target: choice.target,
                effects: this.getChoiceEffects(choice.target, allSections)
            }));
        } else {
            // Default choices if none specified
            dialogData.choices = [
                {
                    id: 'continue',
                    text: 'Continue talking...',
                    effects: {
                        dialogue: "I'm glad we could chat!"
                    }
                },
                {
                    id: 'goodbye',
                    text: 'Goodbye for now',
                    effects: {
                        dialogue: "See you later!",
                        endDialog: true
                    }
                }
            ];
        }
        
        return dialogData;
    }

    /**
     * Extract NPC name from speaker text
     * @param {string} speaker - Speaker text from script
     * @param {string} npcId - NPC ID fallback
     * @returns {string} Clean NPC name
     */
    extractNPCName(speaker, npcId) {
        if (!speaker) {
            // Capitalize first letter of npcId as fallback
            return npcId.charAt(0).toUpperCase() + npcId.slice(1);
        }
        
        // Clean up speaker name (remove "Bikini Assistant" prefix if present)
        let cleanName = speaker.replace(/^Bikini Assistant\s+/i, '');
        cleanName = cleanName.replace(/\*\*/g, ''); // Remove markdown bold
        
        return cleanName.trim();
    }

    /**
     * Get effects for a choice target
     * @param {string} target - Target section label
     * @param {Array} sections - All sections
     * @returns {Object} Effects object
     */
    getChoiceEffects(target, sections) {
        const targetSection = sections.find(section => section.label === target);
        
        if (!targetSection) {
            return {
                dialogue: "Thanks for talking with me!"
            };
        }
        
        const effects = {
            dialogue: targetSection.text || "..."
        };
        
        // Add any @call effects from the target section
        if (targetSection.effects && targetSection.effects.length > 0) {
            targetSection.effects.forEach(effect => {
                if (effect.command === 'romance_meter_increase') {
                    effects.romanceIncrease = effect.params.amount || 5;
                } else if (effect.command === 'romance_meter_decrease') {
                    effects.romanceDecrease = effect.params.amount || 5;
                } else if (effect.command === 'achievement_unlock') {
                    effects.achievement = effect.params.achievement;
                } else if (effect.command === 'dialog_end') {
                    effects.endDialog = true;
                }
            });
        }
        
        // Add follow-up choices if the target section has them
        if (targetSection.choices && targetSection.choices.length > 0) {
            effects.followUpChoices = targetSection.choices.map(choice => ({
                text: choice.text,
                target: choice.target
            }));
        }
        
        return effects;
    }

    /**
     * Create fallback dialog when parsing fails
     * @param {string} npcId - NPC identifier
     * @returns {Object} Basic dialog data
     */
    createFallbackDialog(npcId) {
        const npcName = npcId.charAt(0).toUpperCase() + npcId.slice(1);
        
        return {
            id: `${npcId}_fallback`,
            type: 'romantic_npc',
            title: `Chat with ${npcName}`,
            speaker: npcName,
            text: `Hello! I'm ${npcName}. I'd love to chat with you!`,
            choices: [
                {
                    id: 'flirt',
                    text: 'You look beautiful today',
                    effects: {
                        dialogue: "Thank you! That's so sweet of you to say.",
                        romanceIncrease: 5
                    }
                },
                {
                    id: 'chat',
                    text: 'How are you doing?',
                    effects: {
                        dialogue: "I'm doing well, thank you for asking!"
                    }
                },
                {
                    id: 'goodbye',
                    text: 'I should go now',
                    effects: {
                        dialogue: "Okay, see you later!",
                        endDialog: true
                    }
                }
            ]
        };
    }
} 