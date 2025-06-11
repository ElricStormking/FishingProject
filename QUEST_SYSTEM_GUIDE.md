# Quest System Guide

## Overview

The Luxury Angler quest system now uses JSON-based data files that allow designers to easily create and modify quests without touching code. All quest data is stored in `src/data/quests.json`.

## Quest Types

### 1. Story Quests
Main narrative quests that advance the storyline.
```json
{
  "id": "story_001_tutorial",
  "type": "main_story",
  "title": "Welcome to Luxury Angling",
  "description": "Learn the basics of fishing and explore your first location.",
  "priority": "high",
  "autoStart": true,
  "objectives": [
    {
      "id": "cast_first_time",
      "description": "Cast your line for the first time",
      "type": "action",
      "target": 1,
      "progress": 0,
      "completed": false
    }
  ],
  "rewards": {
    "coins": 500,
    "experience": 100,
    "items": ["basic_rod", "basic_lure"],
    "achievements": ["first_steps"]
  },
  "requirements": [],
  "unlocks": ["story_002_first_companion"]
}
```

### 2. NPC Quests
Personal quests from fishing companions.
```json
{
  "id": "mia_quest_001",
  "type": "npc_quest",
  "giver": "mia",
  "turnInTo": "mia",
  "title": "Mia's Favorite Spot",
  "description": "Mia wants to show you her favorite fishing spot.",
  "priority": "medium",
  "objectives": [
    {
      "id": "visit_mountain_stream",
      "description": "Visit Mountain Stream location",
      "type": "location",
      "target": "mountain_stream",
      "completed": false
    }
  ],
  "rewards": {
    "coins": 400,
    "experience": 120,
    "romance": {
      "mia": 15
    }
  },
  "requirements": ["story_002_first_companion"]
}
```

### 3. Daily Quests (Templates)
Dynamic quests that reset daily with variable substitution.
```json
{
  "id": "daily_catch_template",
  "type": "daily_quest",
  "title": "Daily Catch: {species}",
  "description": "Catch {count} {species} fish today",
  "timeType": "daily",
  "expiresIn": 86400000,
  "objectives": [
    {
      "id": "daily_species_catch",
      "description": "Catch {count} {species}",
      "type": "fishing_species",
      "target": "{count}",
      "species": "{species}",
      "progress": 0,
      "completed": false
    }
  ],
  "rewards": {
    "coins": 200,
    "experience": 75
  },
  "variables": {
    "species": ["bass", "trout", "salmon", "tuna", "mackerel"],
    "count": [3, 5, 7]
  }
}
```

### 4. Weekly Quests (Templates)
More challenging weekly objectives.
```json
{
  "id": "weekly_rare_catch_template",
  "type": "weekly_quest",
  "title": "Rare Fish Hunter",
  "description": "Catch {count} rare fish (3-star or higher)",
  "timeType": "weekly",
  "expiresIn": 604800000,
  "objectives": [
    {
      "id": "weekly_rare_catch",
      "description": "Catch {count} rare fish",
      "type": "rarity_fishing",
      "target": "{count}",
      "minRarity": 3,
      "progress": 0,
      "completed": false
    }
  ],
  "rewards": {
    "coins": 1000,
    "experience": 400,
    "items": ["rare_lure_box"]
  },
  "variables": {
    "count": [5, 8, 12]
  }
}
```

### 5. Event Quests
Limited-time special events.
```json
{
  "id": "summer_festival_001",
  "type": "event_quest",
  "title": "Summer Fishing Festival",
  "description": "Participate in the annual summer fishing festival",
  "eventId": "summer_festival_2024",
  "startDate": "2024-06-01T00:00:00Z",
  "endDate": "2024-06-30T23:59:59Z",
  "objectives": [
    {
      "id": "festival_participation",
      "description": "Catch 20 fish during the festival",
      "type": "fishing_count",
      "target": 20,
      "progress": 0,
      "completed": false
    }
  ],
  "rewards": {
    "coins": 2000,
    "experience": 800,
    "items": ["festival_trophy", "golden_lure"],
    "achievements": ["summer_champion"]
  }
}
```

## Quest Chains

Multi-part quest series with branching paths and escalating rewards.

```json
{
  "id": "mia_romance_chain",
  "name": "Mia's Heart",
  "description": "A journey of growing closer to Mia through shared fishing adventures",
  "category": "romance",
  "quests": [
    {
      "id": "mia_chain_1",
      "title": "First Impressions",
      "description": "Make a good first impression with Mia",
      "objectives": [
        {
          "id": "meet_mia",
          "description": "Meet Mia for the first time",
          "type": "dialog",
          "completed": false
        }
      ],
      "rewards": {
        "coins": 200,
        "experience": 100,
        "romance": {
          "mia": 10
        }
      },
      "nextQuests": ["mia_chain_2a", "mia_chain_2b"]
    }
  ],
  "chainRewards": {
    "coins": 2000,
    "experience": 1000,
    "achievements": ["mias_heart"],
    "romance": {
      "mia": 50
    },
    "items": ["mia_engagement_ring"],
    "title": "Mia's Beloved"
  }
}
```

## Objective Types

### Basic Types
- `action` - Simple action completion
- `dialog` - Have a conversation
- `fishing` - Catch any fish
- `ui_interaction` - Interact with UI elements

### Fishing-Specific Types
- `fishing_species` - Catch specific fish species
- `fishing_count` - Catch a certain number of fish
- `location_fishing` - Fish at specific locations
- `rarity_fishing` - Catch fish of certain rarity
- `time_based_fishing` - Fish during specific times
- `perfect_cast` - Achieve perfect casts

### Advanced Types
- `equipment_upgrade` - Upgrade equipment
- `equipment_enhance` - Enhance equipment
- `romance_progress` - Gain romance points
- `species_variety` - Catch different species
- `location_variety` - Visit different locations

## Reward Types

### Basic Rewards
```json
"rewards": {
  "coins": 500,
  "experience": 100,
  "items": ["basic_rod", "basic_lure"],
  "achievements": ["first_steps"]
}
```

### Romance Rewards
```json
"rewards": {
  "romance": {
    "mia": 15,
    "sophie": 10
  }
}
```

### Title Rewards
```json
"rewards": {
  "title": "Master Angler"
}
```

## Variable Substitution

Daily and weekly quest templates support variable substitution using `{variable}` syntax:

```json
{
  "title": "Daily Catch: {species}",
  "description": "Catch {count} {species} fish today",
  "variables": {
    "species": ["bass", "trout", "salmon"],
    "count": [3, 5, 7]
  }
}
```

The system will randomly select values from the arrays and substitute them into the quest.

## Quest Requirements

### Simple Requirements (Array)
```json
"requirements": ["story_001_tutorial", "story_002_first_companion"]
```

### Complex Requirements (Object)
```json
"requirements": {
  "completedQuests": ["story_001_tutorial"],
  "level": 5,
  "items": ["fishing_license"]
}
```

## Quest Settings

Global quest system settings:

```json
"questSettings": {
  "dailyQuestCount": 3,
  "weeklyQuestCount": 2,
  "maxActiveQuests": 10,
  "questLogSize": 50,
  "autoStartStoryQuests": true,
  "showQuestNotifications": true,
  "questRewardAnimations": true
}
```

## Adding New Quests

1. **Story Quest**: Add to `questTemplates.story` array
2. **NPC Quest**: Add to `questTemplates.npc` array
3. **Daily Template**: Add to `questTemplates.daily` array
4. **Weekly Template**: Add to `questTemplates.weekly` array
5. **Event Quest**: Add to `questTemplates.event` array
6. **Quest Chain**: Add to `questChains` array

## Best Practices

### Quest IDs
- Use descriptive, unique IDs
- Follow naming convention: `category_number_description`
- Examples: `story_001_tutorial`, `mia_quest_001`, `daily_catch_template`

### Objectives
- Keep descriptions clear and actionable
- Use appropriate objective types
- Set realistic targets for progress-based objectives

### Rewards
- Balance rewards with quest difficulty
- Consider progression curve
- Use romance rewards for NPC relationship building

### Requirements
- Ensure logical quest progression
- Test requirement chains thoroughly
- Avoid circular dependencies

### Variable Templates
- Provide variety in variable options
- Test all variable combinations
- Keep substitution text natural

## Testing Quests

1. **Validation**: The system automatically validates quest data on load
2. **Console Logging**: Check browser console for quest system messages
3. **Quest Statistics**: Use `questDataLoader.getQuestStatistics()` in console
4. **Manual Testing**: Test all objective types and reward combinations

## File Structure

```
src/data/quests.json          # Main quest data file
src/scripts/QuestDataLoader.js    # Loads and processes quest data
src/scripts/QuestManager.js       # Main quest management
src/scripts/AdvancedQuestSystem.js # Advanced quest features
```

## Integration Points

The quest system integrates with:
- **Dialog System**: For conversation-based objectives
- **Fishing System**: For fishing-related objectives
- **Equipment System**: For upgrade/enhancement objectives
- **Romance System**: For relationship progression
- **Achievement System**: For unlocking achievements
- **Inventory System**: For item rewards

## Troubleshooting

### Common Issues
1. **Quest not appearing**: Check requirements and validation errors
2. **Variables not substituting**: Verify variable names match exactly
3. **Objectives not completing**: Ensure objective types match game events
4. **Rewards not working**: Check reward format and integration points

### Debug Commands
```javascript
// In browser console:
questDataLoader.getQuestStatistics()
questDataLoader.validateQuestData()
questManager.getActiveQuests()
questManager.getAvailableQuests()
``` 