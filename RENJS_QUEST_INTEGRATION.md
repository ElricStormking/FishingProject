# RenJs Quest & Achievement Integration

## Overview

The Luxury Angler game now features complete integration between the RenJs dialog system and the Quest/Achievement systems. This allows dialog scripts to dynamically interact with quest progression, unlock achievements, and respond to game state.

## Global Objects

### `window.LuxuryAnglerGame`
Main unified interface for RenJs scripts:

```javascript
// Quest Commands
LuxuryAnglerGame.executeCommand('startQuest', 'quest_id')
LuxuryAnglerGame.executeCommand('completeQuest', 'quest_id')
LuxuryAnglerGame.executeCommand('updateQuestObjective', 'quest_id', 'objective_id', progress)
LuxuryAnglerGame.executeCommand('unlockAchievement', 'achievement_id')

// State Queries
LuxuryAnglerGame.isQuestActive('quest_id')
LuxuryAnglerGame.isQuestCompleted('quest_id')
LuxuryAnglerGame.getQuestState('state_key')
LuxuryAnglerGame.getRomanceLevel('npc_id')

// Dialog Processing
LuxuryAnglerGame.processChoice(dialogId, choiceId, npcId, choiceData)
```

### `window.LuxuryAnglerDialog`
DialogManager-specific interface:

```javascript
// NPC Interactions
LuxuryAnglerDialog.increaseRomance('mia', 5)
LuxuryAnglerDialog.giveItem('special_lure', 1)
LuxuryAnglerDialog.unlockAchievement('first_conversation')
```

## Quest Commands

### Start Quest
```yaml
action: "{{LuxuryAnglerGame.executeCommand('startQuest', 'npc_mia_001')}}"
```

### Update Quest Objective
```yaml
action: "{{LuxuryAnglerGame.executeCommand('updateQuestObjective', 'story_001_tutorial', 'cast_first_time')}}"
```

### Complete Quest
```yaml
action: "{{LuxuryAnglerGame.executeCommand('completeQuest', 'story_002_first_companion')}}"
```

### Fail Quest
```yaml
action: "{{LuxuryAnglerGame.executeCommand('failQuest', 'side_001_master_angler')}}"
```

## Achievement Integration

### Unlock Achievement
```yaml
action: "{{LuxuryAnglerGame.executeCommand('unlockAchievement', 'first_conversation')}}"
```

### Choice-Based Achievements
```yaml
choices:
  - text: "That's very helpful!"
    id: "helpful_response"
    action: "{{LuxuryAnglerGame.executeCommand('unlockAchievement', 'fishing_mentor')}}"
```

## State Queries

### Quest State Checks
```yaml
# Check if quest is active
condition: "{{LuxuryAnglerGame.isQuestActive('npc_mia_001')}}"

# Check if quest is completed
condition: "{{LuxuryAnglerGame.isQuestCompleted('story_001_tutorial')}}"

# Check custom quest states
condition: "{{LuxuryAnglerGame.getQuestState('tutorial_completed')}}"
```

### Romance Level Checks
```yaml
# Check romance level
condition: "{{LuxuryAnglerGame.getRomanceLevel('mia') >= 25}}"

# Romance-dependent dialog
romantic_scene:
  condition: "{{LuxuryAnglerGame.getRomanceLevel('mia') >= 50}}"
  text: "I've really enjoyed our time together..."
```

## Quest Progress Integration

### Progress-Based Objectives
```yaml
# Update fishing progress
action: "{{LuxuryAnglerGame.executeCommand('updateQuestObjective', 'fishing_001_species_collector', 'catch_10_species', 1)}}"

# Check progress
condition: "{{LuxuryAnglerGame.getQuestProgress('fishing_001_species_collector', 'catch_10_species') >= 5}}"
```

## Romance System Integration

### Increase Romance
```yaml
action: "{{LuxuryAnglerGame.increaseRomance('mia', 5)}}"
```

### Choice-Based Romance
```yaml
choices:
  - text: "You look beautiful today"
    id: "romantic_compliment"
    action: "{{LuxuryAnglerGame.processChoice('mia_conversation', 'romantic_compliment', 'mia', {romanceBonus: 10})}}"
```

## Reward System

### Give Custom Rewards
```yaml
# Give experience
action: "{{LuxuryAnglerGame.executeCommand('giveQuestReward', 'quest_id', 'experience', 100)}}"

# Give items
action: "{{LuxuryAnglerGame.executeCommand('giveQuestReward', 'quest_id', 'item', 'special_lure')}}"

# Give romance points
action: "{{LuxuryAnglerGame.executeCommand('giveQuestReward', 'quest_id', 'romance', {npc: 'mia', points: 15})}}"
```

## Available Quest States

### Tutorial & Main Story
- `tutorial_completed`: Tutorial quest finished
- `first_companion_met`: Met first companion (Mia)

### NPC Quests
- `mia_quest_active`: Mia's questline is active
- `sophie_quest_active`: Sophie's questline is active
- `luna_quest_active`: Luna's questline is active

### Romance States
- `mia_romance_quest_completed`: Mia romance milestone reached
- Individual romance levels accessible via `getRomanceLevel('npc_id')`

### Fishing Progress
- `master_angler_quest_active`: Master angler challenge active
- `species_collector_progress`: Number of species collected

## Example Dialog Scripts

### Basic Quest Integration
```yaml
mia_conversation:
  text: "Hi there! Ready for your fishing lesson?"
  
  choices:
    - text: "Yes, let's start!"
      id: "accept_lesson"
      action: "{{LuxuryAnglerGame.executeCommand('updateQuestObjective', 'npc_mia_001', 'teach_mia_casting')}}"
      jump: "lesson_scene"
      
    - text: "Not right now"
      id: "decline_lesson"
      jump: "maybe_later"
```

### Conditional Content
```yaml
greeting:
  text: "{{LuxuryAnglerGame.getQuestState('tutorial_completed') ? 'Welcome back, experienced angler!' : 'Hello, newcomer!'}}"
  
  choices:
    - text: "Tell me about advanced techniques"
      condition: "{{LuxuryAnglerGame.getQuestState('tutorial_completed')}}"
      jump: "advanced_tutorial"
      
    - text: "I need help with basics"
      condition: "{{!LuxuryAnglerGame.getQuestState('tutorial_completed')}}"
      jump: "basic_tutorial"
```

### Achievement Unlocking
```yaml
first_meeting:
  text: "Nice to meet you! I'm Mia."
  action: "{{LuxuryAnglerGame.executeCommand('unlockAchievement', 'first_conversation')}}"
  
  choices:
    - text: "I'd like to give you this rare fish"
      id: "gift_fish"
      action: "{{LuxuryAnglerGame.executeCommand('unlockAchievement', 'mia_gift_given')}}"
      jump: "grateful_response"
```

## Event Integration

The system automatically emits events for:
- Quest completion
- Objective updates
- Achievement unlocks
- Romance meter changes
- Dialog choice processing

These events update the Quest Log UI in real-time and trigger other game systems.

## Testing

1. Use the Quest Log (Q key) to monitor quest progress
2. Check browser console for integration logging
3. Use the test file `test-quest-system.html` for debugging
4. Monitor `window.LuxuryAnglerGame` object in browser DevTools

## Integration Points

- **QuestManager**: Core quest logic and state management
- **DialogManager**: NPC interactions and romance system
- **GameScene**: Event coordination and global exposure
- **QuestScene**: Real-time UI updates
- **RenJs Scripts**: Dialog-driven quest progression

This integration allows for rich, interactive storytelling where player choices directly impact quest progression, character relationships, and achievement unlocks. 