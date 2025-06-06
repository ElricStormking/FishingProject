// Fix struggle styles in fish_species.csv to match valid struggle patterns
const fs = require('fs');

// Valid struggle styles from strugglePatterns.json
const validStruggleStyles = [
    'gentle_pull',
    'rapid_thrashing', 
    'steady_pull',
    'jumping_escape',
    'violent_thrashing',
    'deep_dive',
    'bulldogging',
    'long_sprint',
    'power_run',
    'aerial_acrobatics',
    'circle_fighting'
];

// Mapping from invalid to valid struggle styles
const struggleStyleMapping = {
    'steady_fight': 'steady_pull',
    'quick_darts': 'rapid_thrashing',
    'long_fight': 'long_sprint',
    'rapid_swimming': 'power_run',
    'bottom_struggle': 'bulldogging',
    'heavy_pull': 'deep_dive',
    'champion_fight': 'violent_thrashing',
    'golden_run': 'long_sprint',
    'legendary_battle': 'power_run',
    'lunar_spiral': 'circle_fighting',
    'phase_shifting': 'jumping_escape',
    'ethereal_dance': 'aerial_acrobatics'
};

function fixFishStruggleStyles() {
    const content = fs.readFileSync('fish_species.csv', 'utf8');
    const lines = content.split('\n');
    
    // Process each line
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',');
            const struggleStyleIndex = 20; // struggle_style is the last column
            
            if (values[struggleStyleIndex]) {
                const currentStyle = values[struggleStyleIndex].trim();
                
                // Check if current style is invalid and needs mapping
                if (!validStruggleStyles.includes(currentStyle) && struggleStyleMapping[currentStyle]) {
                    console.log(`Mapping ${currentStyle} -> ${struggleStyleMapping[currentStyle]}`);
                    values[struggleStyleIndex] = struggleStyleMapping[currentStyle];
                    lines[i] = values.join(',');
                } else if (!validStruggleStyles.includes(currentStyle)) {
                    console.log(`Unknown struggle style: ${currentStyle}, using gentle_pull as fallback`);
                    values[struggleStyleIndex] = 'gentle_pull';
                    lines[i] = values.join(',');
                }
            }
        }
    }
    
    // Write back the fixed content
    fs.writeFileSync('fish_species.csv', lines.join('\n'));
    console.log('✓ Fixed struggle styles in fish_species.csv');
}

fixFishStruggleStyles(); 