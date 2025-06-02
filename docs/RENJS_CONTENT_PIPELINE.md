# RenJs Content Pipeline Documentation
## Luxury Angler Content Creation Guide

### 🎯 **Overview**
This guide enables writers and content creators to develop dialog content for the Luxury Angler game using the RenJs system without requiring technical knowledge.

---

## 📝 **WRITER GUIDELINES**

### **Basic Dialog Script Structure**
Every dialog script follows this pattern:

```
# NPC_NAME Dialog Script

::START
**NPC Name:** "Opening greeting message"

+ "Player response option 1" -> choice1_result
+ "Player response option 2" -> choice2_result  
+ "End conversation" -> goodbye

::choice1_result
**NPC Name:** "Response to choice 1"
@call romance_meter_increase {"npc": "npc_id", "amount": 5}
-> continue_conversation

::choice2_result
**NPC Name:** "Response to choice 2"
@call quest_unlock {"quest": "new_quest_id"}
-> continue_conversation

::continue_conversation
+ "Ask about fishing" -> fishing_topic
+ "Ask about romance" -> romance_topic
+ "Goodbye" -> goodbye

::goodbye
**NPC Name:** "See you later!"
@call dialog_end

::END
```

### **Writing Best Practices**

#### **Character Voice & Personality**
- **Mia**: Cheerful, encouraging, fishing mentor. Uses positive language.
- **Sophie**: Sophisticated, business-minded, analytical. More formal speech.
- **Luna**: Mysterious, wise, spiritual. Uses metaphorical language.

#### **Dialog Flow Guidelines**
1. **Opening**: Always greet the player warmly
2. **Choices**: Provide 2-4 meaningful options per interaction
3. **Branching**: Allow different paths based on relationship level
4. **Closure**: Always provide a natural conversation exit

#### **Relationship Building**
- Small talk: +1 to +3 romance points
- Meaningful conversation: +5 to +8 romance points
- Romantic moments: +10 to +15 romance points
- Gifts/special actions: +15 to +20 romance points

---

## 🔧 **RENJS SYNTAX REFERENCE**

### **Basic Elements**

#### **Speaker Labels**
```
**Character Name:** "Dialog text here"
```

#### **Player Choices**
```
+ "Choice text" -> destination_label
+ "Another choice" -> different_label
```

#### **Labels (Scene Points)**
```
::label_name
Content goes here
```

#### **Navigation**
```
-> label_name     # Jump to label
```

### **System Integration Commands**

#### **Romance System**
```
@call romance_meter_increase {"npc": "mia", "amount": 5}
@call romance_meter_decrease {"npc": "sophie", "amount": 3}
```

#### **Quest System**
```
@call quest_unlock {"quest": "fishing_tutorial"}
@call quest_update {"quest": "catch_5_fish", "progress": 1}
@call quest_complete {"quest": "first_catch"}
```

#### **Achievement System**
```
@call achievement_unlock {"achievement": "smooth_talker"}
@call achievement_check {"achievement": "master_angler"}
```

#### **Inventory System**
```
@call inventory_add {"item": "special_lure", "quantity": 1}
@call inventory_remove {"item": "fish_bait", "quantity": 2}
```

#### **Dialog Control**
```
@call dialog_end                    # End dialog, return to game
@call start_fishing                 # Trigger fishing minigame
@call open_shop                     # Open shop interface
```

### **Conditional Logic with Game State**

RenJS scripts can dynamically alter dialog flow based on various game state conditions. This is achieved by accessing state variables provided by the `DialogManager` (exposed globally as `window.LuxuryAnglerGame.getQuestStates()`).

**Accessing State Variables in RenJS:**

Refer to these variables within your conditional statements. The exact syntax for conditions (`if`, `else if`, `else`) might depend on the specific RenJS engine version and configuration. The examples below use a common `@if` directive pattern.

*   **NPC Romance & Relationship:**
    *   `getQuestStates().mia_romance_level` (Number): Mia's current romance points.
    *   `getQuestStates().sophie_relationship` (String): Sophie's current relationship name (e.g., "Friend", "Lover").
    *   `getQuestStates().luna_is_lover` (Boolean): True if Luna is at "Lover" status.
    *   `getQuestStates().mia_is_friend_or_higher` (Boolean): True if Mia is at "Friend" status or higher.
*   **Player Stats:**
    *   `getQuestStates().player.level` (Number): Player's current experience level.
    *   `getQuestStates().player.money` (Number): Player's current amount of coins.
    *   `getQuestStates().player.fishing_skill` (Number): Player's current fishing skill level (e.g., from `fishDetection` attribute).
    *   `getQuestStates().player.has_item_master_rod` (Boolean): True if the player possesses the "master_rod".
*   **Quest & Game Flags:**
    *   `getQuestStates().tutorial_completed` (Boolean): True if the main tutorial quest is completed.
    *   `getQuestStates().mia_quest_active` (Boolean): True if Mia's first quest is active.
    *   `getQuestStates().is_raining` (Boolean): True if it is currently raining in the game.
    *   `getQuestStates().current_day_of_week` (Number): 0 for Sunday, 1 for Monday, etc.

**Example Usage in Dialog Scripts:**

```renjs
::CHECK_MIA_RELATIONSHIP
@if getQuestStates().mia_is_lover_or_higher == true
    Mia: "It always brightens my day to see you, my love!"
    + "I feel the same!" -> MIA_SHARED_AFFECTION
@elif getQuestStates().mia_is_friend_or_higher == true
    Mia: "Hey, good to see you! Fancy a bit of fishing later?"
    + "Sounds like a plan!" -> MIA_FISHING_PLAN
@else
    Mia: "Welcome. Is there something I can help you with?"
    + "Just looking around." -> MIA_BROWSE
@endif

::ADVICE_BASED_ON_SKILL
Sophie: "Let's see... about that fishing spot..."
@if getQuestStates().player.fishing_skill >= 75
    Sophie: "Honestly, with your skill, you could probably fish successfully in a puddle! But the Volcanic Reef has some truly legendary catches if you're feeling bold."
@elif getQuestStates().player.fishing_skill >= 30
    Sophie: "You're making good progress. I'd recommend the Sunken Ship Graveyard. Tricky currents, but valuable fish."
@else
    Sophie: "For now, stick to the Calm Lagoons. Practice makes perfect, and it's a safe spot to learn."
@endif
+ "Thanks, Sophie!" -> END_CONVO_SOPHIE

::WEATHER_REMARK
Luna: "The air feels... different today."
@if getQuestStates().is_raining == true
    Luna: "The sky weeps, and the ocean listens. A pensive day for fishing."
@else
    Luna: "A clear sky. The ocean is open and honest with its mood."
@endif
+ "You have a way with words, Luna." -> END_CONVO_LUNA
```

*__Important Note on Conditional Syntax:__ The `@if/@elif/@else/@endif` syntax shown is a common pattern. Ensure that your RenJS setup correctly interprets these directives or adapt them to the supported conditional branching mechanism (e.g., using flags and `jump` commands if direct `if` statements are not available or behave differently).* 

---

## 📁 **SCRIPT TEMPLATES**

### **Template 1: First Meeting Dialog**
```
# {{NPC_NAME}}_first_meeting

::START
**{{NPC_NAME}}:** "Oh, hello there! I don't think we've met before."

+ "Hi, I'm new to fishing around here" -> newcomer_response
+ "I've been fishing for years" -> experienced_response
+ "Just passing through" -> casual_response

::newcomer_response
**{{NPC_NAME}}:** "Welcome to the harbor! Fishing can be really rewarding once you get the hang of it."
@call romance_meter_increase {"npc": "{{npc_id}}", "amount": 3}
@call quest_unlock {"quest": "{{npc_id}}_tutorial"}
-> offer_help

::experienced_response  
**{{NPC_NAME}}:** "Excellent! It's always great to meet a fellow angler."
@call romance_meter_increase {"npc": "{{npc_id}}", "amount": 2}
-> fishing_talk

::casual_response
**{{NPC_NAME}}:** "Well, feel free to try some fishing while you're here!"
@call romance_meter_increase {"npc": "{{npc_id}}", "amount": 1}
-> general_info

::offer_help
**{{NPC_NAME}}:** "Would you like me to show you some basic techniques?"

+ "Yes, that would be great!" -> tutorial_accept
+ "I'll figure it out myself" -> tutorial_decline

::tutorial_accept
**{{NPC_NAME}}:** "Wonderful! Let me give you a basic rod to start with."
@call inventory_add {"item": "basic_rod", "quantity": 1}
@call quest_update {"quest": "{{npc_id}}_tutorial", "progress": 1}
@call romance_meter_increase {"npc": "{{npc_id}}", "amount": 5}
-> fishing_basics

::END
```

### **Template 2: Romantic Progression Dialog**
```
# {{NPC_NAME}}_romance_level_{{LEVEL}}

::START
{{#if romance_level >= 40}}
**{{NPC_NAME}}:** "I've really enjoyed spending time with you lately."
{{else}}
**{{NPC_NAME}}:** "How's your fishing going today?"
{{/if}}

{{#if romance_level >= 60}}
+ "I've enjoyed our time together too" -> romantic_response
{{/if}}
+ "The fishing has been great" -> fishing_response
+ "I should get going" -> goodbye

::romantic_response
**{{NPC_NAME}}:** "{{romantic_dialog_text}}"
@call romance_meter_increase {"npc": "{{npc_id}}", "amount": 8}
@call achievement_check {"achievement": "growing_closer"}
-> deeper_conversation

::END
```

### **Template 3: Quest Dialog**
```
# {{NPC_NAME}}_quest_{{QUEST_ID}}

::START
{{#if quest_active "{{QUEST_ID}}"}}
**{{NPC_NAME}}:** "How is that task I gave you coming along?"
{{else}}
**{{NPC_NAME}}:** "I have something I could use help with."
{{/if}}

{{#if quest_active "{{QUEST_ID}}"}}
+ "I'm still working on it" -> quest_progress
+ "I've completed it!" -> quest_complete
{{else}}
+ "What do you need help with?" -> quest_offer
+ "I'm too busy right now" -> quest_decline
{{/if}}

::quest_offer
**{{NPC_NAME}}:** "{{quest_description}}"

+ "I'll help you with that" -> quest_accept
+ "That sounds too difficult" -> quest_decline

::quest_accept
**{{NPC_NAME}}:** "Thank you so much! I really appreciate it."
@call quest_unlock {"quest": "{{QUEST_ID}}"}
@call romance_meter_increase {"npc": "{{npc_id}}", "amount": 5}
-> quest_details

::END
```

---

## 🌐 **LOCALIZATION SUPPORT**

### **Text File Structure**
Create separate files for each language:
```
dialog/
  en/
    mia_conversations.yaml
    sophie_conversations.yaml
    luna_conversations.yaml
  es/
    mia_conversations.yaml
    sophie_conversations.yaml
    luna_conversations.yaml
  fr/
    mia_conversations.yaml
    sophie_conversations.yaml
    luna_conversations.yaml
```

### **Translation Guidelines**
1. **Character Voice**: Maintain personality in translation
2. **Cultural Context**: Adapt fishing terms and cultural references
3. **Length Constraints**: Keep text within UI limits
4. **Formatting**: Preserve @call commands exactly as written

### **Variable Replacement**
Use these placeholders for dynamic content:
```
{{player_name}}           # Player's chosen name
{{npc_name}}              # Current NPC's name
{{romance_level}}         # Current romance meter value
{{current_location}}      # Player's fishing location
{{fish_caught_today}}     # Number of fish caught today
```

---

## ✅ **CONTENT VALIDATION PROCEDURES**

### **Pre-Production Checklist**
- [ ] All dialog labels properly formatted (::label_name)
- [ ] All choices lead to valid labels
- [ ] @call commands use correct syntax
- [ ] Romance meter changes are reasonable (-10 to +20)
- [ ] Character voice matches established personality
- [ ] Spelling and grammar checked
- [ ] No broken dialog paths (dead ends)

### **Testing Procedures**
1. **Syntax Validation**: Use RenJs Debug UI to check script syntax
2. **Flow Testing**: Navigate through all dialog branches
3. **Command Testing**: Verify @call commands execute properly
4. **Romance Testing**: Check romance meter changes are appropriate
5. **Quest Integration**: Ensure quest flags work correctly

### **Quality Assurance Guidelines**
- **Consistency**: Character personalities remain consistent
- **Balance**: Romance progression feels natural
- **Engagement**: Dialog provides meaningful choices
- **Integration**: System commands work as intended
- **Accessibility**: Text is clear and easy to understand

---

## 🛠️ **DEVELOPMENT WORKFLOW**

### **Content Creation Process**
1. **Planning**: Define dialog purpose and character goals
2. **Writing**: Create initial dialog using templates
3. **Integration**: Add @call commands for system integration
4. **Validation**: Check syntax using provided tools
5. **Testing**: Use Debug UI to test dialog flow
6. **Review**: Get feedback from development team
7. **Polish**: Refine based on feedback
8. **Localization**: Prepare for translation if needed

### **File Organization**
```
public/assets/dialog/
  npcs/
    mia/
      introduction.yaml
      daily_conversations.yaml
      romance_progression.yaml
      quest_dialogs.yaml
    sophie/
      introduction.yaml
      daily_conversations.yaml
      romance_progression.yaml
      quest_dialogs.yaml
    luna/
      introduction.yaml
      daily_conversations.yaml
      romance_progression.yaml
      quest_dialogs.yaml
  templates/
    first_meeting_template.yaml
    romance_template.yaml
    quest_template.yaml
  validation/
    syntax_checker.js
    content_validator.js
```

### **Version Control**
- Use descriptive commit messages: "Add Mia romance level 3 dialog"
- Tag major content releases: "v1.0-dialog-complete"
- Branch for experimental content: "feature/mia-fishing-tournament-dialog"

---

## 📚 **EXAMPLE IMPLEMENTATIONS**

### **Complete NPC Dialog Example: Mia Introduction**
```yaml
# Mia First Meeting Dialog
::START
**Mia:** "Hey there! Welcome to Ocean Harbor! I'm Mia."

+ "Nice to meet you, Mia" -> friendly_greeting
+ "Are you a fishing guide?" -> fishing_question
+ "I'm just looking around" -> casual_response

::friendly_greeting
**Mia:** "The pleasure's all mine! I love meeting new anglers."
@call romance_meter_increase {"npc": "mia", "amount": 3}
-> fishing_offer

::fishing_question
**Mia:** "I sure am! Been fishing these waters since I was a kid."
@call romance_meter_increase {"npc": "mia", "amount": 2}
-> experience_share

::casual_response
**Mia:** "Well, if you decide you want to try fishing, I'm your girl!"
@call romance_meter_increase {"npc": "mia", "amount": 1}
-> general_info

::fishing_offer
**Mia:** "Since you're new, how about I teach you the basics?"

+ "I'd love to learn!" -> tutorial_accept
+ "Maybe another time" -> tutorial_decline

::tutorial_accept
**Mia:** "Awesome! Here, take this starter rod."
@call inventory_add {"item": "starter_fishing_rod", "quantity": 1}
@call quest_unlock {"quest": "mia_fishing_tutorial"}
@call romance_meter_increase {"npc": "mia", "amount": 5}
@call achievement_unlock {"achievement": "first_lesson"}
-> tutorial_start

::tutorial_start
**Mia:** "First thing to remember - patience is key in fishing!"
-> conversation_continue

::conversation_continue
+ "Tell me about the local fish" -> fish_info
+ "What's your favorite fishing spot?" -> location_info
+ "Thanks for the help!" -> goodbye

::fish_info
**Mia:** "Oh, we have amazing variety here! Bass, trout, even some rare deep-sea fish!"
@call romance_meter_increase {"npc": "mia", "amount": 2}
-> more_questions

::location_info
**Mia:** "I love the quiet spots at dawn. There's something magical about the sunrise over water."
@call romance_meter_increase {"npc": "mia", "amount": 3}
-> more_questions

::more_questions
+ "Any fishing tips for beginners?" -> beginner_tips
+ "I should start practicing" -> practice_time
+ "Thanks for all the information" -> goodbye

::beginner_tips
**Mia:** "Start with basic lures and don't get discouraged. Every angler was a beginner once!"
@call romance_meter_increase {"npc": "mia", "amount": 2}
-> goodbye

::practice_time
**Mia:** "Great attitude! Practice makes perfect."
@call romance_meter_increase {"npc": "mia", "amount": 1}
-> goodbye

::goodbye
**Mia:** "See you around the harbor! Happy fishing!"
@call dialog_end

::END
```

---

## 🚀 **ADVANCED FEATURES**

### **Conditional Dialog**
```yaml
{{#if romance_level >= 60}}
**Mia:** "I've been thinking about you a lot lately..."
{{else if romance_level >= 40}}
**Mia:** "It's always nice to see a friendly face!"
{{else}}
**Mia:** "Oh, hello again!"
{{/if}}
```

### **Dynamic Content**
```yaml
**Mia:** "I see you've caught {{fish_caught_today}} fish today! {{#if fish_caught_today >= 5}}That's impressive!{{else}}Keep at it!{{/if}}"
```

### **Quest State Checking**
```yaml
{{#if quest_completed "mia_fishing_tutorial"}}
**Mia:** "You've really improved since our first lesson!"
{{else if quest_active "mia_fishing_tutorial"}}
**Mia:** "How's the practice going?"
{{else}}
**Mia:** "Ready to learn some fishing basics?"
{{/if}}
```

---

## 📞 **SUPPORT AND RESOURCES**

### **Getting Help**
- **Technical Issues**: Contact development team
- **Writing Questions**: Refer to character personality guides
- **System Integration**: Use RenJs Debug UI for testing

### **Additional Resources**
- Character personality guides
- Fishing terminology glossary
- Romance progression guidelines
- Quest design best practices

---

**Content Pipeline Status**: ✅ **COMPLETE**
**Last Updated**: May 31, 2025
**Version**: 1.0 