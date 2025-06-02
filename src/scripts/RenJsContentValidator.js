/**
 * RenJs Content Validator
 * Validates dialog scripts for syntax errors and best practices
 */
export class RenJsContentValidator {
    constructor() {
        this.validationRules = {
            syntaxRules: [
                'hasStartLabel',
                'hasEndLabel', 
                'validLabelFormat',
                'validChoiceFormat',
                'validSpeakerFormat',
                'validCallCommands',
                'noDeadEnds'
            ],
            contentRules: [
                'reasonableRomanceChanges',
                'characterVoiceConsistency',
                'appropriateChoiceCount',
                'naturalConversationFlow'
            ]
        };
        
        this.validCallCommands = [
            'romance_meter_increase',
            'romance_meter_decrease',
            'quest_unlock',
            'quest_update', 
            'quest_complete',
            'achievement_unlock',
            'achievement_check',
            'inventory_add',
            'inventory_remove',
            'dialog_end',
            'start_fishing',
            'open_shop'
        ];
        
        this.characterPersonalities = {
            'mia': {
                traits: ['cheerful', 'encouraging', 'positive', 'helpful'],
                forbiddenWords: ['harsh', 'cold', 'negative', 'rude'],
                preferredTone: 'upbeat'
            },
            'sophie': {
                traits: ['sophisticated', 'analytical', 'formal', 'business-minded'],
                forbiddenWords: ['silly', 'childish', 'crude'],
                preferredTone: 'professional'
            },
            'luna': {
                traits: ['mysterious', 'wise', 'spiritual', 'metaphorical'],
                forbiddenWords: ['crude', 'overly-casual', 'mundane'],
                preferredTone: 'mystical'
            }
        };
    }

    /**
     * Validate a complete dialog script
     * @param {string} scriptContent - The dialog script content
     * @param {string} npcId - The NPC identifier
     * @returns {Object} Validation results with errors and warnings
     */
    validateScript(scriptContent, npcId = null) {
        const results = {
            isValid: true,
            errors: [],
            warnings: [],
            suggestions: [],
            syntaxScore: 0,
            contentScore: 0
        };

        // Parse script into structured format
        const parsedScript = this.parseScript(scriptContent);
        
        // Run syntax validation
        this.validateSyntax(parsedScript, results);
        
        // Run content validation
        if (npcId) {
            this.validateContent(parsedScript, npcId, results);
        }
        
        // Calculate scores
        results.syntaxScore = this.calculateSyntaxScore(results);
        results.contentScore = this.calculateContentScore(results);
        
        // Determine overall validity
        results.isValid = results.errors.length === 0;
        
        return results;
    }

    /**
     * Parse script content into structured format
     */
    parseScript(scriptContent) {
        const lines = scriptContent.split('\n');
        const script = {
            labels: new Map(),
            choices: [],
            speakers: [],
            callCommands: [],
            currentLabel: null
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Parse labels
            if (line.startsWith('::')) {
                const labelName = line.substring(2);
                script.currentLabel = labelName;
                script.labels.set(labelName, {
                    lineNumber: i + 1,
                    content: [],
                    choices: [],
                    callCommands: []
                });
            }
            
            // Parse choices
            else if (line.startsWith('+')) {
                const choiceMatch = line.match(/\+ "([^"]+)" -> (\w+)/);
                if (choiceMatch) {
                    const choice = {
                        text: choiceMatch[1],
                        target: choiceMatch[2],
                        lineNumber: i + 1
                    };
                    script.choices.push(choice);
                    if (script.currentLabel) {
                        script.labels.get(script.currentLabel).choices.push(choice);
                    }
                }
            }
            
            // Parse speakers
            else if (line.includes('**') && line.includes(':**')) {
                const speakerMatch = line.match(/\*\*([^*]+)\*\*: "([^"]+)"/);
                if (speakerMatch) {
                    script.speakers.push({
                        name: speakerMatch[1],
                        dialog: speakerMatch[2],
                        lineNumber: i + 1
                    });
                }
            }
            
            // Parse @call commands
            else if (line.startsWith('@call')) {
                const callMatch = line.match(/@call (\w+)(?:\s+(.+))?/);
                if (callMatch) {
                    const command = {
                        name: callMatch[1],
                        parameters: callMatch[2],
                        lineNumber: i + 1
                    };
                    script.callCommands.push(command);
                    if (script.currentLabel) {
                        script.labels.get(script.currentLabel).callCommands.push(command);
                    }
                }
            }
        }

        return script;
    }

    /**
     * Validate script syntax
     */
    validateSyntax(script, results) {
        // Check for START label
        if (!script.labels.has('START')) {
            results.errors.push({
                type: 'MISSING_START_LABEL',
                message: 'Script must have a ::START label',
                severity: 'error'
            });
        }

        // Check for END label
        if (!script.labels.has('END')) {
            results.warnings.push({
                type: 'MISSING_END_LABEL',
                message: 'Script should have an ::END label for clarity',
                severity: 'warning'
            });
        }

        // Validate choice targets
        script.choices.forEach(choice => {
            if (!script.labels.has(choice.target)) {
                results.errors.push({
                    type: 'INVALID_CHOICE_TARGET',
                    message: `Choice "${choice.text}" points to non-existent label "${choice.target}"`,
                    lineNumber: choice.lineNumber,
                    severity: 'error'
                });
            }
        });

        // Validate @call commands
        script.callCommands.forEach(command => {
            if (!this.validCallCommands.includes(command.name)) {
                results.errors.push({
                    type: 'INVALID_CALL_COMMAND',
                    message: `Unknown @call command: "${command.name}"`,
                    lineNumber: command.lineNumber,
                    severity: 'error'
                });
            }

            // Validate command parameters
            this.validateCallCommandParameters(command, results);
        });

        // Check for dead ends (labels with no choices or navigation)
        script.labels.forEach((labelData, labelName) => {
            if (labelName !== 'END' && labelData.choices.length === 0) {
                const hasNavigation = labelData.content.some(line => 
                    line.includes('-> ') || line.includes('@call dialog_end')
                );
                
                if (!hasNavigation) {
                    results.warnings.push({
                        type: 'POTENTIAL_DEAD_END',
                        message: `Label "${labelName}" may be a dead end - no choices or navigation`,
                        severity: 'warning'
                    });
                }
            }
        });
    }

    /**
     * Validate @call command parameters
     */
    validateCallCommandParameters(command, results) {
        try {
            if (command.parameters) {
                const params = JSON.parse(command.parameters);
                
                // Validate romance meter commands
                if (command.name.includes('romance_meter')) {
                    if (!params.npc) {
                        results.errors.push({
                            type: 'MISSING_NPC_PARAMETER',
                            message: `Romance meter command requires "npc" parameter`,
                            lineNumber: command.lineNumber,
                            severity: 'error'
                        });
                    }
                    
                    if (params.amount) {
                        const amount = parseInt(params.amount);
                        if (amount < -20 || amount > 20) {
                            results.warnings.push({
                                type: 'UNUSUAL_ROMANCE_AMOUNT',
                                message: `Romance change of ${amount} is unusually large`,
                                lineNumber: command.lineNumber,
                                severity: 'warning'
                            });
                        }
                    }
                }
                
                // Validate quest commands
                if (command.name.includes('quest_')) {
                    if (!params.quest) {
                        results.errors.push({
                            type: 'MISSING_QUEST_PARAMETER',
                            message: `Quest command requires "quest" parameter`,
                            lineNumber: command.lineNumber,
                            severity: 'error'
                        });
                    }
                }
            }
        } catch (error) {
            results.errors.push({
                type: 'INVALID_JSON_PARAMETERS',
                message: `Invalid JSON in @call parameters: ${error.message}`,
                lineNumber: command.lineNumber,
                severity: 'error'
            });
        }
    }

    /**
     * Validate content quality and character consistency
     */
    validateContent(script, npcId, results) {
        const personality = this.characterPersonalities[npcId];
        if (!personality) {
            results.warnings.push({
                type: 'UNKNOWN_CHARACTER',
                message: `No personality profile found for character: ${npcId}`,
                severity: 'warning'
            });
            return;
        }

        // Check character voice consistency
        script.speakers.forEach(speaker => {
            if (speaker.name.toLowerCase() === npcId) {
                this.validateCharacterVoice(speaker, personality, results);
            }
        });

        // Check choice count per interaction
        script.labels.forEach((labelData, labelName) => {
            if (labelData.choices.length > 5) {
                results.warnings.push({
                    type: 'TOO_MANY_CHOICES',
                    message: `Label "${labelName}" has ${labelData.choices.length} choices. Consider limiting to 2-4 for better UX`,
                    severity: 'warning'
                });
            }
        });

        // Check for balanced romance progression
        const romanceCommands = script.callCommands.filter(cmd => 
            cmd.name.includes('romance_meter')
        );
        
        if (romanceCommands.length > 0) {
            const totalChange = romanceCommands.reduce((sum, cmd) => {
                try {
                    const params = JSON.parse(cmd.parameters);
                    return sum + (parseInt(params.amount) || 0);
                } catch {
                    return sum;
                }
            }, 0);

            if (totalChange > 50) {
                results.warnings.push({
                    type: 'EXCESSIVE_ROMANCE_GAIN',
                    message: `Total romance gain of ${totalChange} in one conversation may be too high`,
                    severity: 'warning'
                });
            }
        }
    }

    /**
     * Validate character voice consistency
     */
    validateCharacterVoice(speaker, personality, results) {
        const dialog = speaker.dialog.toLowerCase();
        
        // Check for forbidden words
        personality.forbiddenWords.forEach(word => {
            if (dialog.includes(word)) {
                results.warnings.push({
                    type: 'CHARACTER_VOICE_INCONSISTENCY',
                    message: `Word "${word}" may not fit ${speaker.name}'s personality`,
                    lineNumber: speaker.lineNumber,
                    severity: 'warning'
                });
            }
        });

        // Suggest personality-appropriate language
        if (personality.preferredTone === 'upbeat' && !this.hasPositiveLanguage(dialog)) {
            results.suggestions.push({
                type: 'ENHANCE_CHARACTER_VOICE',
                message: `Consider adding more upbeat language for ${speaker.name}`,
                lineNumber: speaker.lineNumber
            });
        }
    }

    /**
     * Check for positive language indicators
     */
    hasPositiveLanguage(text) {
        const positiveWords = ['great', 'awesome', 'wonderful', 'fantastic', 'love', 'enjoy', 'happy', 'exciting'];
        return positiveWords.some(word => text.includes(word));
    }

    /**
     * Calculate syntax score (0-100)
     */
    calculateSyntaxScore(results) {
        const maxDeductions = 100;
        let deductions = 0;
        
        // Major syntax errors
        deductions += results.errors.length * 20;
        
        // Minor issues
        deductions += results.warnings.length * 5;
        
        return Math.max(0, maxDeductions - deductions);
    }

    /**
     * Calculate content score (0-100)
     */
    calculateContentScore(results) {
        const maxDeductions = 100;
        let deductions = 0;
        
        // Content issues
        const contentWarnings = results.warnings.filter(w => 
            w.type.includes('CHARACTER_VOICE') || 
            w.type.includes('ROMANCE') ||
            w.type.includes('CHOICES')
        );
        
        deductions += contentWarnings.length * 10;
        
        return Math.max(0, maxDeductions - deductions);
    }

    /**
     * Generate validation report
     */
    generateReport(validationResults) {
        let report = "# RenJs Dialog Script Validation Report\n\n";
        
        // Overall status
        report += `## Overall Status: ${validationResults.isValid ? '✅ VALID' : '❌ INVALID'}\n\n`;
        
        // Scores
        report += `### Scores:\n`;
        report += `- Syntax Score: ${validationResults.syntaxScore}/100\n`;
        report += `- Content Score: ${validationResults.contentScore}/100\n\n`;
        
        // Errors
        if (validationResults.errors.length > 0) {
            report += `### ❌ Errors (${validationResults.errors.length}):\n`;
            validationResults.errors.forEach((error, index) => {
                report += `${index + 1}. **${error.type}** (Line ${error.lineNumber || 'N/A'}): ${error.message}\n`;
            });
            report += '\n';
        }
        
        // Warnings
        if (validationResults.warnings.length > 0) {
            report += `### ⚠️ Warnings (${validationResults.warnings.length}):\n`;
            validationResults.warnings.forEach((warning, index) => {
                report += `${index + 1}. **${warning.type}** (Line ${warning.lineNumber || 'N/A'}): ${warning.message}\n`;
            });
            report += '\n';
        }
        
        // Suggestions
        if (validationResults.suggestions.length > 0) {
            report += `### 💡 Suggestions (${validationResults.suggestions.length}):\n`;
            validationResults.suggestions.forEach((suggestion, index) => {
                report += `${index + 1}. **${suggestion.type}** (Line ${suggestion.lineNumber || 'N/A'}): ${suggestion.message}\n`;
            });
            report += '\n';
        }
        
        // Summary
        if (validationResults.isValid) {
            report += `### Summary:\n`;
            report += `✅ Your dialog script is syntactically valid and ready for use!\n`;
            if (validationResults.warnings.length > 0) {
                report += `Consider addressing the warnings above to improve quality.\n`;
            }
        } else {
            report += `### Summary:\n`;
            report += `❌ Please fix the errors above before using this script.\n`;
        }
        
        return report;
    }

    /**
     * Quick syntax check for common errors
     */
    quickCheck(scriptContent) {
        const issues = [];
        const lines = scriptContent.split('\n');
        
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            const lineNum = index + 1;
            
            // Check for common syntax errors
            if (trimmed.startsWith('::') && !/^::\w+$/.test(trimmed)) {
                issues.push(`Line ${lineNum}: Invalid label format - use "::labelname"`);
            }
            
            if (trimmed.startsWith('+') && !/"[^"]+" -> \w+/.test(trimmed)) {
                issues.push(`Line ${lineNum}: Invalid choice format - use '+ "text" -> label'`);
            }
            
            if (trimmed.includes('**') && !trimmed.match(/\*\*[^*]+\*\*: "[^"]+"/)) {
                issues.push(`Line ${lineNum}: Invalid speaker format - use '**Name:** "dialog"'`);
            }
            
            if (trimmed.startsWith('@call') && !trimmed.match(/@call \w+/)) {
                issues.push(`Line ${lineNum}: Invalid @call format - use '@call command_name'`);
            }
        });
        
        return {
            hasIssues: issues.length > 0,
            issues: issues,
            issueCount: issues.length
        };
    }

    /**
     * Validate specific NPC personality traits
     */
    validatePersonalityTraits(npcId, dialogText) {
        const personality = this.characterPersonalities[npcId];
        if (!personality) return { valid: true, issues: [] };
        
        const issues = [];
        const text = dialogText.toLowerCase();
        
        // Check forbidden words
        personality.forbiddenWords.forEach(word => {
            if (text.includes(word)) {
                issues.push(`Character voice inconsistency: "${word}" doesn't fit ${npcId}'s personality`);
            }
        });
        
        return {
            valid: issues.length === 0,
            issues: issues
        };
    }
}

// Export singleton instance
export const contentValidator = new RenJsContentValidator(); 