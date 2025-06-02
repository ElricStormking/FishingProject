# Dialog Script Template

## RenJs Dialog Script Template for Luxury Angler

This template provides the structure and examples for creating NPC dialog scripts in RenJs format.

### Basic Structure:

```
# NPC Name Dialog Script

::START
**NPC Name:** "Opening dialog line"

+ "Player choice 1" -> label1
+ "Player choice 2" -> label2
+ "Player choice 3" -> label3

::label1
**NPC Name:** "Response to choice 1"

@call romance_meter_increase {"npc": "npc_id", "amount": 5}

+ "Follow-up choice" -> next_label
+ "Return to main menu" -> main_menu

::main_menu
+ "Topic 1" -> topic1
+ "Topic 2" -> topic2
+ "Goodbye" -> goodbye

::goodbye
**NPC Name:** "Farewell message"
@call dialog_end

::END
```

### Available @call Commands:

#### Romance System:
- `@call romance_meter_increase {"npc": "npc_id", "amount": 5}`
- `@call romance_meter_decrease {"npc": "npc_id", "amount": 3}`

#### Quest System:
- `@call quest_unlock {"quest": "quest_id"}`
- `@call quest_update {"quest": "quest_id", "progress": 1}`
- `@call quest_complete {"quest": "quest_id"}`

#### Achievement System:
- `@call achievement_unlock {"achievement": "achievement_id"}`
- `@call achievement_check {"achievement": "achievement_id"}`

#### Inventory System:
- `@call inventory_add {"item": "item_id", "quantity": 1}`
- `@call inventory_remove {"item": "item_id", "quantity": 1}`

#### Dialog Control:
- `@call dialog_end` - Ends the dialog and returns to game

### Romance Meter Guidelines:

- **Small positive interactions**: 1-5 points
- **Meaningful conversations**: 6-10 points
- **Romantic moments**: 11-15 points
- **Major relationship milestones**: 16-20 points
- **Negative interactions**: -1 to -10 points
- Lover: 100

### Conditional Dialog with Game State:

RenJS scripts can access various game state variables through the `getQuestStates()` function (which is available globally via `window.LuxuryAnglerGame.getQuestStates()`). This allows for dynamic dialog based on NPC relationships, player stats, quest progress, and more.

**Accessing State Variables:**
- `getQuestStates().mia_romance_level` -> Mia's current romance points (Number)
- `getQuestStates().sophie_relationship` -> Sophie's current relationship name (String, e.g., "Friend")
- `getQuestStates().luna_is_lover` -> True if Luna is at Lover status (Boolean)
- `getQuestStates().mia_is_friend_or_higher` -> True if Mia is Friend or higher (Boolean)
- `getQuestStates().player.level` -> Player's current level (Number)
- `getQuestStates().player.fishing_skill` -> Player's fishing skill (Number)
- `getQuestStates().player.has_item_master_rod` -> True if player has Master Rod (Boolean)
- `getQuestStates().tutorial_completed` -> True if tutorial quest is done (Boolean)
- `getQuestStates().is_raining` -> True if it is currently raining (Boolean)

**Conditional Logic Syntax (Example using simplified `if`):**

```renjs
::MIA_GREETING
@if getQuestStates().mia_is_lover_or_higher == true
    Mia: "My love! It warms my heart to see you! ❤️"
    + "Embrace her" -> MIA_LOVER_EMBRACE
@elif getQuestStates().mia_is_friend_or_higher == true
    Mia: "Hey there, my favorite fishing buddy! Glad you stopped by."
    + "Ask about new fishing spots" -> MIA_ASK_SPOTS
@else
    Mia: "Oh, hello there! Welcome to the cabin."
    + "Introduce yourself politely" -> MIA_INTRODUCE
@endif

::SOPHIE_ADVICE
@if getQuestStates().player.fishing_skill >= 50
    Sophie: "With your skill, you should try the Northern Shallows. The big ones bite there!"
@elif getQuestStates().player.fishing_skill >= 20
    Sophie: "You're getting good! Keep practicing your casts near the Coral Reef."
@else
    Sophie: "Still learning the ropes, huh? The Training Pier is a good place to start."
@endif
+ "Thanks for the tip!" -> END_CONVO

::LUNA_WEATHER_COMMENT
@if getQuestStates().is_raining == true
    Luna: "The rain whispers secrets to the water... a good time for introspection, and perhaps unique fish."
@else
    Luna: "The sun blesses the waves today. The ocean is in a pleasant mood."
@endif
+ "Interesting thought." -> END_CONVO
```
*Note: The exact RenJS `if/elif/else/endif` syntax might vary or require specific setup in the RenJS engine being used. The above is a conceptual representation. Ensure your RenJS version supports this, or adapt to its specific conditional branching capabilities (e.g., using labels and jumps based on flag checks if direct `if` isn't available).* 

### Relationship Thresholds:
- Stranger: 0-19
- Acquaintance: 20-39
- Friend: 40-59
- Close Friend: 60-79
- Romantic Interest: 80-99
- Lover: 100

### Writing Guidelines:

1. **Character Voice**: Each NPC should have a distinct personality and speaking style
2. **Branching Paths**: Provide meaningful choices that affect relationship progression
3. **Consequences**: Player choices should have visible effects on romance meters and quests
4. **Consistency**: Keep character personalities consistent across all interactions
5. **Progression**: Build relationships gradually through multiple conversations

### Example NPCs:

- **Mia**: Friendly, helpful, traditional fishing assistant
- **Sophie**: Energetic, enthusiastic, knowledge-focused
- **Luna**: Mysterious, poetic, spiritually-minded

### File Naming Convention:
- `npc_[name].md` for individual NPCs
- `location_[name].md` for location-specific dialogs
- `quest_[name].md` for quest-related dialogs

### Testing Your Scripts:
1. Place the .md file in `/public/assets/dialog/`
2. Update DialogManager.js to include the new NPC
3. Test using the D key in-game
4. Verify romance meter changes and quest triggers work correctly 