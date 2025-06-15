# JSON Dialog System Guide for Designers

## Overview

The PhaserFishing game supports a powerful JSON-based dialog system that allows designers to create rich, interactive conversations with NPCs. This system supports romance progression, quest integration, and various game effects.

## Quick Start

### 1. Basic JSON Dialog Structure

Create a `.json` file in `public/assets/dialog/` with this basic structure:

```json
{
  "id": "unique_dialog_id",
  "type": "romantic_npc",
  "title": "Dialog Title",
  "speaker": "NPC Name",
  "portrait": "portrait-key",
  "text": "What the NPC says to the player",
  "choices": [
    {
      "id": "choice_id",
      "text": "Player response option",
      "effects": {
        "romance": { "npc_id": 5 }
      }
    }
  ]
}
```

### 2. Using the Dialog

In your scene code, reference the JSON file:

```javascript
// Launch dialog with JSON file
this.scene.launch('DialogScene', {
    npcId: 'mia',
    script: 'your_dialog.json',  // JSON file name
    callingScene: 'YourScene',
    dialogManager: this.dialogManager
});
```

## Complete Dialog Structure Reference

### Root Dialog Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for this dialog |
| `type` | string | No | Dialog category (romantic_npc, story, tutorial, event) |
| `title` | string | No | Display title for the dialog |
| `speaker` | string | Yes | Name of the NPC speaking |
| `portrait` | string | No | Portrait image key to display |
| `text` | string | Yes | The main dialog text the NPC says |
| `choices` | array | Yes | Array of player response choices |
| `npcId` | string | No | ID of the NPC (for romance tracking) |
| `romanceLevel` | number | No | Minimum romance level required |
| `unlockCondition` | string | No | Condition required to access this dialog |

### Choice Object Structure

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for this choice |
| `text` | string | Yes | Text displayed to the player |
| `effects` | object | No | Effects that happen when choice is selected |
| `target` | string | No | ID of next dialog section to jump to |
| `action` | string | No | Special action to perform |

### Effects Object

The `effects` object can contain multiple types of effects:

#### Romance Effects
```json
"effects": {
  "romance": {
    "mia": 15,      // Increase Mia's romance by 15
    "sophie": -5    // Decrease Sophie's romance by 5
  }
}
```

#### Quest Effects
```json
"effects": {
  "questProgress": "story_001_tutorial",  // Progress specific quest
  "unlockQuest": "story_002_first_companion"  // Unlock new quest
}
```

#### Economy Effects
```json
"effects": {
  "experience": 100,    // Give 100 XP
  "coins": 250,         // Give 250 coins
  "coins": -50          // Take 50 coins (negative for costs)
}
```

#### Item Effects
```json
"effects": {
  "items": {
    "fishing_rod_basic": 1,    // Give 1 basic fishing rod
    "bait_worms": 10           // Give 10 worm bait
  }
}
```

#### UI Effects
```json
"effects": {
  "openUI": "shop_main",      // Open shop interface
  "closeDialog": true         // Close dialog immediately
}
```

#### Dialog Response
```json
"effects": {
  "dialogue": "NPC's response to this choice"
}
```

## Example Dialog Files

### 1. Simple Romance Dialog

**File: `mia_sunset.json`**
```json
{
  "id": "mia_sunset_conversation",
  "type": "romantic_npc",
  "title": "Sunset with Mia",
  "speaker": "Mia",
  "portrait": "mia-portrait",
  "text": "Look at that beautiful sunset! The colors are absolutely stunning tonight. I love sharing moments like this with you.",
  "choices": [
    {
      "id": "romantic",
      "text": "You're more beautiful than any sunset.",
      "effects": {
        "romance": { "mia": 12 },
        "dialogue": "*blushes* You always know what to say to make my heart flutter!"
      }
    },
    {
      "id": "agree",
      "text": "It really is gorgeous.",
      "effects": {
        "romance": { "mia": 5 },
        "dialogue": "I'm so glad you appreciate beauty like I do."
      }
    },
    {
      "id": "practical",
      "text": "Good weather for fishing tomorrow.",
      "effects": {
        "romance": { "mia": 1 },
        "dialogue": "Always thinking about fishing! That's what I like about you."
      }
    }
  ],
  "npcId": "mia",
  "romanceLevel": 10
}
```

### 2. Quest-Related Dialog

**File: `captain_tutorial.json`**
```json
{
  "id": "captain_fishing_lesson",
  "type": "tutorial",
  "title": "Captain's Fishing Lesson",
  "speaker": "Captain",
  "portrait": "captain",
  "text": "Ready for your first fishing lesson? I'll teach you the basics of casting and reeling. Pay attention - these skills will serve you well!",
  "choices": [
    {
      "id": "ready",
      "text": "I'm ready to learn!",
      "effects": {
        "questProgress": "tutorial_fishing_basics",
        "experience": 50,
        "dialogue": "Excellent! Let's start with the basics of casting."
      }
    },
    {
      "id": "nervous",
      "text": "I'm a bit nervous...",
      "effects": {
        "questProgress": "tutorial_fishing_basics",
        "dialogue": "Don't worry! Everyone starts somewhere. We'll take it slow."
      }
    },
    {
      "id": "skip",
      "text": "Can we skip the tutorial?",
      "effects": {
        "unlockQuest": "story_first_catch",
        "dialogue": "Confident, I like that! But remember, practice makes perfect."
      }
    }
  ]
}
```

### 3. Shop Dialog

**File: `shopkeeper_welcome.json`**
```json
{
  "id": "shop_welcome",
  "type": "event",
  "title": "Marina Shop",
  "speaker": "Shopkeeper",
  "portrait": "shopkeeper",
  "text": "Welcome to the finest fishing supply shop on the coast! We have everything from basic gear to legendary equipment. What can I help you find?",
  "choices": [
    {
      "id": "browse",
      "text": "I'd like to browse your selection.",
      "effects": {
        "openUI": "shop_main"
      }
    },
    {
      "id": "beginner_gear",
      "text": "What do you recommend for beginners?",
      "effects": {
        "openUI": "shop_beginner",
        "dialogue": "For beginners, I always recommend starting with a reliable rod and some basic lures!"
      }
    },
    {
      "id": "special_offer",
      "text": "Do you have any special deals?",
      "effects": {
        "dialogue": "Actually, yes! Today only - 20% off all starter equipment!"
      }
    },
    {
      "id": "leave",
      "text": "Just looking around, thanks.",
      "effects": {
        "closeDialog": true
      }
    }
  ]
}
```

### 4. Multi-Choice Complex Dialog

**File: `mia_relationship_talk.json`**
```json
{
  "id": "mia_relationship_deep",
  "type": "romantic_npc",
  "title": "Heart-to-Heart with Mia",
  "speaker": "Mia",
  "portrait": "mia-portrait",
  "text": "I've been thinking about us lately... about what we mean to each other. I feel like there's something special growing between us. What do you think?",
  "choices": [
    {
      "id": "love_confession",
      "text": "I think I'm falling in love with you.",
      "effects": {
        "romance": { "mia": 25 },
        "unlockQuest": "mia_romance_milestone",
        "dialogue": "*tears of joy* I... I feel the same way! I've been hoping you'd say that!"
      }
    },
    {
      "id": "care_deeply",
      "text": "I care about you deeply, Mia.",
      "effects": {
        "romance": { "mia": 15 },
        "dialogue": "That means everything to me. I care about you too, more than you know."
      }
    },
    {
      "id": "good_friends",
      "text": "We're really good friends.",
      "effects": {
        "romance": { "mia": 5 },
        "dialogue": "Yes, we are... good friends. *smiles, but looks a bit disappointed*"
      }
    },
    {
      "id": "not_ready",
      "text": "I'm not ready to talk about this yet.",
      "effects": {
        "romance": { "mia": -2 },
        "dialogue": "I understand. Take all the time you need. I'll be here when you're ready."
      }
    }
  ],
  "npcId": "mia",
  "romanceLevel": 40,
  "unlockCondition": "mia_trust_level_high"
}
```

## Advanced Features

### 1. Conditional Dialogs

You can create dialogs that only appear under certain conditions:

```json
{
  "id": "mia_after_first_date",
  "romanceLevel": 50,
  "unlockCondition": "completed_mia_date_quest",
  "text": "Last night was magical... I can't stop thinking about our time together."
}
```

### 2. Multiple Effect Types

Combine different effects in a single choice:

```json
{
  "id": "generous_gift",
  "text": "Here's a special gift for you!",
  "effects": {
    "romance": { "mia": 20 },
    "coins": -100,
    "items": { "special_necklace": 1 },
    "unlockQuest": "mia_gratitude_quest",
    "dialogue": "Oh my! This is beautiful! You're so thoughtful!"
  }
}
```

### 3. Dialog Chains

Create connected dialogs using the `target` property:

```json
{
  "id": "conversation_start",
  "text": "I have something important to tell you...",
  "choices": [
    {
      "id": "listen",
      "text": "I'm listening.",
      "target": "conversation_part2"
    }
  ],
  "sections": [
    {
      "id": "conversation_part2",
      "text": "I've been offered a job in another city...",
      "choices": [
        {
          "id": "supportive",
          "text": "That's a great opportunity!",
          "effects": { "romance": { "mia": 10 } }
        }
      ]
    }
  ]
}
```

## Best Practices

### 1. Dialog Writing
- **Keep text concise**: Aim for 1-3 sentences per dialog
- **Show personality**: Each NPC should have a distinct voice
- **Use emotions**: Include action descriptions like "*blushes*" or "*smiles*"
- **Vary responses**: Provide 3-4 meaningful choice options

### 2. Romance Progression
- **Small increments**: Use 1-5 points for casual interactions
- **Medium gains**: Use 8-15 points for meaningful moments
- **Large gains**: Use 20+ points for major relationship milestones
- **Negative effects**: Use sparingly, -1 to -5 for poor choices

### 3. Quest Integration
- **Clear progression**: Each quest dialog should advance the story
- **Meaningful choices**: Let player decisions affect quest outcomes
- **Reward appropriately**: Balance XP and item rewards with effort

### 4. File Organization
- **Descriptive names**: Use clear, descriptive filenames
- **Logical grouping**: Group related dialogs in folders
- **Version control**: Keep backup copies of important dialogs

## Testing Your Dialogs

### 1. In-Game Testing
Use the "Test JSON Dialog" button in the Cabin scene to test your dialogs:

1. Place your JSON file in `public/assets/dialog/`
2. Update the test button to use your filename
3. Click "Test JSON Dialog" in the cabin
4. Verify all choices work correctly
5. Check that effects apply properly

### 2. Validation Checklist
- [ ] All required fields are present
- [ ] JSON syntax is valid
- [ ] Romance values are reasonable
- [ ] Quest IDs match existing quests
- [ ] Item IDs match game items
- [ ] Portrait keys exist in the game
- [ ] Dialog text fits in the UI
- [ ] All choices lead somewhere meaningful

## Common Issues and Solutions

### Issue: Dialog doesn't load
**Solution**: Check file path and JSON syntax. Use browser dev tools to see network errors.

### Issue: Romance meter doesn't update
**Solution**: Verify NPC ID matches exactly (case-sensitive). Check DialogManager is available.

### Issue: Effects don't work
**Solution**: Ensure effect names match the supported types. Check console for error messages.

### Issue: Portrait doesn't show
**Solution**: Verify portrait key exists in PreloadScene. Use fallback text if needed.

### Issue: Choices don't appear
**Solution**: Check choices array syntax. Ensure at least one choice is provided.

## File Templates

### Basic Romance Dialog Template
```json
{
  "id": "npc_dialog_id",
  "type": "romantic_npc",
  "title": "Dialog Title",
  "speaker": "NPC Name",
  "portrait": "npc-portrait",
  "text": "NPC dialog text here",
  "choices": [
    {
      "id": "romantic_choice",
      "text": "Romantic response",
      "effects": {
        "romance": { "npc_id": 10 },
        "dialogue": "NPC response"
      }
    },
    {
      "id": "friendly_choice",
      "text": "Friendly response",
      "effects": {
        "romance": { "npc_id": 5 },
        "dialogue": "NPC response"
      }
    },
    {
      "id": "neutral_choice",
      "text": "Neutral response",
      "effects": {
        "romance": { "npc_id": 1 },
        "dialogue": "NPC response"
      }
    }
  ],
  "npcId": "npc_id",
  "romanceLevel": 0
}
```

### Quest Dialog Template
```json
{
  "id": "quest_dialog_id",
  "type": "story",
  "title": "Quest Dialog",
  "speaker": "Quest Giver",
  "portrait": "quest-giver",
  "text": "Quest description and context",
  "choices": [
    {
      "id": "accept_quest",
      "text": "I'll help you!",
      "effects": {
        "questProgress": "quest_id",
        "experience": 50,
        "dialogue": "Thank you! Here's what you need to do..."
      }
    },
    {
      "id": "decline_quest",
      "text": "I can't help right now.",
      "effects": {
        "dialogue": "I understand. Come back when you're ready."
      }
    },
    {
      "id": "ask_details",
      "text": "Tell me more about this.",
      "effects": {
        "dialogue": "Here are the details..."
      }
    }
  ]
}
```

## Conclusion

The JSON dialog system provides a powerful, flexible way to create engaging conversations in PhaserFishing. By following this guide and using the provided templates, you can create rich, interactive dialogs that enhance the player experience and drive the game's narrative forward.

For additional help or advanced features, consult the game's technical documentation or reach out to the development team. 