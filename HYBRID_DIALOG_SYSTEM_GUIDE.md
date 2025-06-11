# Hybrid Dialog System Guide

## Overview

The Luxury Angler game now uses a **Hybrid Dialog System** that seamlessly combines:
- **RenJs Visual Novel Engine** for story and romantic dialogs
- **Custom JSON-based Dialog System** for tutorials, events, and fallback scenarios

## System Architecture

### Core Components

1. **DialogScene.js** - Main dialog interface that handles both systems
2. **DialogDataConverter.js** - Converts JSON dialog data to RenJs format
3. **RenJsLoader.js** - Manages RenJs engine integration
4. **DialogManager.js** - Handles dialog effects and game integration
5. **dialog_samples.json** - JSON dialog data following GDD specifications

### Dialog Flow

```
GameScene.openDialog() 
    ↓
DialogScene.init() 
    ↓
DialogDataConverter.shouldUseRenJs() 
    ↓
[RenJs Available?] → Yes → RenJs Visual Novel Interface
    ↓
[RenJs Available?] → No → Custom JSON Dialog Interface
    ↓
DialogManager.applyEffects() → Game Systems Integration
```

## Usage Examples

### 1. Opening a Dialog (Basic)

```javascript
// From GameScene or any scene
this.scene.launch('DialogScene', {
    npcId: 'mia',
    callingScene: 'GameScene',
    dialogManager: this.dialogManager
});
```

### 2. Opening a Dialog with Specific Data

```javascript
// Using specific dialog data
const dialogData = {
    id: 'mia01',
    type: 'romantic_npc',
    title: 'Meeting Mia',
    speaker: 'Mia',
    text: 'Welcome to our fishing village! I\'m Mia, your guide.',
    choices: [
        {
            id: 'friendly',
            text: 'Nice to meet you!',
            effects: {
                romance: { mia: 5 },
                dialogue: 'I\'m so glad you\'re here! Let me show you around.'
            }
        }
    ]
};

this.scene.launch('DialogScene', {
    dialogData: dialogData,
    useRenJs: true, // Force RenJs for visual novel experience
    callingScene: 'GameScene',
    dialogManager: this.dialogManager
});
```

### 3. Dialog Manager Integration

```javascript
// In DialogManager.js
async getDialogData(npcId) {
    // Load dialog from JSON samples
    const response = await fetch('./src/data/dialog_samples.json');
    const dialogSamples = await response.json();
    
    // Find appropriate dialog for NPC and current game state
    const npcDialogs = dialogSamples.romantic_npcs.filter(dialog => 
        dialog.id.startsWith(npcId.toLowerCase())
    );
    
    // Return dialog based on romance level, quest progress, etc.
    return this.selectAppropriateDialog(npcDialogs, npcId);
}
```

## Dialog Data Format

### JSON Dialog Structure

```json
{
    "id": "mia01",
    "type": "romantic_npc",
    "title": "First Meeting",
    "speaker": "Mia",
    "text": "Hello! Welcome to our fishing village!",
    "unlockConditions": {
        "questCompleted": ["tutorial_complete"],
        "romanceLevel": { "mia": 0 }
    },
    "choices": [
        {
            "id": "friendly",
            "text": "Nice to meet you!",
            "effects": {
                "romance": { "mia": 5 },
                "questProgress": "village_introduction",
                "unlockQuest": "mia_friendship_01",
                "dialogue": "I'm so happy you're here!"
            }
        }
    ]
}
```

### Dialog Effects System

The system supports comprehensive effects:

```javascript
// Romance effects
"romance": { "mia": 5, "sophie": -2 }

// Quest system integration
"questProgress": "tutorial_fishing_basics"
"unlockQuest": "advanced_fishing_techniques"

// Rewards
"experience": 100
"coins": 50
"items": ["basic_rod", "fishing_bait"]

// Game progression
"unlockMap": "deep_ocean"
"unlockBoss": "kraken"
"unlockAchievement": "first_conversation"

// UI and gameplay
"startMinigame": "fishing_challenge"
"openUI": "equipment_shop"
```

## System Configuration

### Choosing Dialog System

The system automatically chooses between RenJs and custom based on:

1. **Dialog Type Priority**:
   - `story` dialogs → **RenJs preferred** (cinematic experience)
   - `romantic_npc` dialogs → **RenJs preferred** (visual novel feel)
   - `tutorial` dialogs → **Custom preferred** (quick interaction)
   - `event` dialogs → **Custom preferred** (gameplay integration)

2. **RenJs Availability**:
   - If RenJs fails to load → **Automatic fallback to custom**
   - If RenJs not available → **Custom system only**

3. **Manual Override**:
   ```javascript
   // Force RenJs usage
   this.scene.launch('DialogScene', {
       npcId: 'mia',
       useRenJs: true
   });
   
   // Force custom system
   this.scene.launch('DialogScene', {
       npcId: 'mia',
       useRenJs: false
   });
   ```

## Advanced Features

### 1. Dynamic Dialog Selection

```javascript
// In DialogManager.js
selectAppropriateDialog(dialogs, npcId) {
    const romanceLevel = this.getRomanceLevel(npcId);
    const questProgress = this.getQuestProgress();
    
    // Filter dialogs based on unlock conditions
    const availableDialogs = dialogs.filter(dialog => {
        return this.checkUnlockConditions(dialog.unlockConditions);
    });
    
    // Select highest priority dialog
    return availableDialogs[0] || this.createFallbackDialog(npcId);
}
```

### 2. RenJs Script Generation

```javascript
// DialogDataConverter automatically converts JSON to RenJs
const converter = new DialogDataConverter();
const renjsScript = converter.convertToRenJsScript(dialogData);

// Generated RenJs script:
// define mia = Character("Mia", color="#ff6b9d")
// label mia01:
//     scene bg_boat_deck with fade
//     show mia at center with dissolve
//     mia "Hello! Welcome to our fishing village!"
//     menu:
//         "Nice to meet you!":
//             call mia01_friendly
//     return
```

### 3. Cross-System Compatibility

Both systems use the same effect format:

```javascript
// Custom system
this.applyDialogEffects(choice.effects, dialogManager);

// RenJs system (via callbacks)
this.renjsLoader.setCallbacks({
    update_romance: (npcId, points) => {
        dialogManager.increaseRomanceMeter(npcId, points);
    }
});
```

## Best Practices

### 1. Dialog Organization

- **Story dialogs**: Use RenJs for cinematic presentation
- **Romance dialogs**: Use RenJs for visual novel experience  
- **Tutorial dialogs**: Use custom for quick, gameplay-focused interaction
- **Event dialogs**: Use custom for immediate game integration

### 2. Performance Optimization

- Dialog data is cached in `DialogDataConverter`
- RenJs scripts are generated once and reused
- Fallback dialogs prevent system failures

### 3. Content Management

- All dialog content in `dialog_samples.json` follows GDD specifications
- Dialog IDs follow consistent naming: `npcname##`, `Story##`, `tutorial##`
- Effects are standardized across both systems

## Troubleshooting

### Common Issues

1. **RenJs fails to load**: System automatically falls back to custom
2. **Dialog data not found**: System creates fallback dialog
3. **Effects not applying**: Check DialogManager integration
4. **Portrait not showing**: System creates placeholder portrait

### Debug Information

```javascript
// Enable debug logging
console.log('DialogScene: Using RenJs for dialog');
console.log('DialogScene: Falling back to custom dialog system');
console.log('DialogScene: Dialog choice selected:', choice.text);
```

## Integration with Existing Systems

### Quest System Integration

```javascript
// Dialog effects automatically integrate with:
- QuestManager.progressQuest()
- QuestManager.startQuest()
- AdvancedQuestSystem.updateQuestProgress()
```

### Romance System Integration

```javascript
// Romance effects automatically integrate with:
- DialogManager.increaseRomanceMeter()
- DialogManager.getRomanceLevel()
```

### Achievement System Integration

```javascript
// Achievement effects automatically integrate with:
- DialogManager.unlockAchievement()
```

This hybrid system provides the best of both worlds: the rich visual novel experience of RenJs for story content, and the flexible, game-integrated custom system for gameplay dialogs. 