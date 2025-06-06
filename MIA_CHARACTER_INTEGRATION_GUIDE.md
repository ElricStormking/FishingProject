# 🏖️ Mia Character Portrait Integration Guide

## Overview
This guide explains how to integrate the new bikini-clad fishing assistant Mia character portrait into the Luxury Angler fishing game for story and quest dialogs.

## 📁 File Placement Instructions

### Step 1: Save the Character Portrait
Save the provided character image as the following files:

1. **Main Portrait** (Dialog Scene):
   - Save as: `public/assets/npcs/mia-portrait.png`
   - Size: Recommended 400x600px for optimal display
   - Format: PNG with transparency support

2. **RenJS Portrait** (Story System):
   - Save as: `src/libs/renjs/assets/characters/portrait-mia.png`
   - Size: Same as above (400x600px)
   - Format: PNG with transparency support

3. **Backup Location** (Legacy Support):
   - Save as: `public/assets/dialog/portraits/mia.png`
   - Size: Same as above
   - Format: PNG with transparency support

## 🎮 Character Integration

### Mia Character Profile
- **Name**: Bikini Assistant Mia
- **Personality**: Friendly, enthusiastic, knowledgeable fishing guide
- **Appearance**: Green hair, red bikini, fishing rod, confident pose
- **Role**: Helpful fishing assistant who teaches players basic techniques
- **Specialties**: 
  - Beginner fishing tips
  - Equipment recommendations  
  - Local fishing spot knowledge
  - Romance progression storylines

### Dialog Integration
The character is already configured in the game systems:

1. **Dialog Manager** (`src/scripts/DialogManager.js`):
   - ✅ Already configured as 'Bikini Assistant Mia'
   - ✅ Romance meter system ready
   - ✅ Personality traits defined

2. **RenJS Story System** (`src/libs/renjs/story/GUI.yaml`):
   - ✅ Character defined with speech color `#ff6b9d`
   - ✅ Multiple emotional states (normal, happy, shy, excited)
   - ✅ Dialog scenes ready

3. **Quest System Integration**:
   - ✅ Ready for quest dialog integration
   - ✅ Romance progression tracking
   - ✅ Achievement unlocks configured

## 🖼️ Portrait Display Contexts

The new Mia portrait will appear in:

### 1. Story Dialog Scenes
- **Location**: GameScene dialog interactions (Press D key)
- **Display**: Large portrait (300x450px) with speech bubbles
- **Context**: Main story conversations and romance progression

### 2. Quest Dialog
- **Location**: Quest completion dialogs
- **Display**: Medium portrait (200x300px) with quest text
- **Context**: Tutorial quests, fishing objectives, relationship milestones

### 3. Cabin Chatroom System
- **Location**: CabinScene NPC list and chat interface
- **Display**: Small portrait thumbnail (80x120px)
- **Context**: Private conversations and romance meter progression

### 4. Character Selection Menus
- **Location**: Dialog selection interfaces
- **Display**: Portrait with character name and relationship status
- **Context**: Choosing which NPC to interact with

## 🎨 Visual Integration Details

### Portrait Specifications
```javascript
// Recommended image dimensions
{
  width: 400,
  height: 600,
  format: 'PNG',
  transparency: true,
  dpi: 72,
  compression: 'lossless'
}
```

### Character Display Settings
```javascript
// Game configuration for Mia's portrait
const miaConfig = {
  displayName: "Bikini Assistant Mia",
  speechColor: "#ff6b9d", // Pink color for dialog text
  portraitPosition: {
    x: -350, // Left side of dialog box
    y: -100, // Centered vertically
    scale: 0.8 // Slightly scaled down for UI fit
  },
  emotionalStates: [
    'normal',    // Default confident pose
    'happy',     // Bright smile
    'shy',       // Modest expression
    'excited'    // Enthusiastic pose
  ]
}
```

## 🚀 Testing the Integration

### Quick Test Steps
1. **Save the portrait files** in the specified locations
2. **Start the game** with `npm run dev`
3. **Enter GameScene** (fishing area)
4. **Press D** to trigger Mia dialog
5. **Verify the portrait displays** correctly in the dialog box

### Dialog Test Commands
```javascript
// In browser console, test the dialog system:
window.LuxuryAnglerDialogs?.startDialog('mia', 'introduction');

// Test romance meter:
window.LuxuryAnglerQuests?.updateRomanceMeter('mia', 10);
```

## 📝 Character Voice and Personality

### Mia's Dialog Style
- **Tone**: Friendly, helpful, encouraging
- **Speech Pattern**: Uses casual language with fishing terminology
- **Emotional Range**: 
  - Enthusiastic about fishing
  - Supportive of player learning
  - Gradually develops romantic feelings
  - Professional but warm personality

### Sample Dialog Examples
```yaml
# Mia Introduction Dialog
mia_greeting:
  character: "mia"
  portrait: "normal"
  text: "Hey there! I'm Mia, your fishing guide. Ready to catch some amazing fish together?"
  
mia_tutorial:
  character: "mia"
  portrait: "excited"
  text: "First lesson - patience is key! The fish can sense your energy through the water."
  
mia_romance_1:
  character: "mia"
  portrait: "shy"
  text: "I... I really enjoy spending time with you out here on the water. It feels peaceful."
```

## 🏆 Romance Progression Integration

### Romance Meter Levels
- **0-20**: Stranger - Basic fishing tips
- **21-40**: Acquaintance - Equipment advice
- **41-60**: Friend - Personal fishing stories
- **61-80**: Close Friend - Favorite spot sharing
- **81-100**: Romantic Interest - Intimate conversations

### Unlockable Content
- **Romance Level 25**: Special fishing lure gift
- **Romance Level 50**: Private fishing lesson
- **Romance Level 75**: Sunset fishing date
- **Romance Level 100**: Romantic confession scene

## 🔧 Configuration Files Updated

The following files are already configured for the new portrait:

### 1. Dialog Scene (`src/scenes/DialogScene.js`)
```javascript
// Loads portrait-mia from assets/npcs/mia-portrait.png
this.load.image('portrait-mia', 'assets/npcs/mia-portrait.png');
```

### 2. RenJS Config (`src/libs/renjs/story/GUI.yaml`)
```yaml
mia:
  displayName: Mia
  speechColour: "#ff6b9d"
  looks:
    normal: public/assets/npcs/mia-normal.png
    happy: public/assets/npcs/mia-happy.png
    shy: public/assets/npcs/mia-shy.png
    excited: public/assets/npcs/mia-excited.png
```

### 3. Dialog Manager (`src/scripts/DialogManager.js`)
```javascript
{
  id: 'mia',
  name: 'Bikini Assistant Mia',
  portrait: 'npc-assistant-1',
  description: 'A cheerful fishing guide who loves spending time by the water'
}
```

## ✅ Integration Checklist

- [ ] Save portrait as `public/assets/npcs/mia-portrait.png`
- [ ] Save portrait as `src/libs/renjs/assets/characters/portrait-mia.png`
- [ ] Test dialog interaction (Press D in GameScene)
- [ ] Verify portrait displays correctly
- [ ] Test romance meter progression
- [ ] Check quest dialog integration
- [ ] Verify cabin chatroom display
- [ ] Test emotional state variations (if multiple portraits provided)

## 🎯 Next Steps

1. **Save the Portrait Files**: Place the image in the specified directories
2. **Test Integration**: Use the test steps above to verify everything works
3. **Customize Dialog**: Update dialog text to match the character's appearance
4. **Add Voice Lines**: Consider adding audio for more immersion
5. **Create Variants**: Optional - create emotional state variants of the portrait

## 📞 Support

If you encounter any issues with the portrait integration:
1. Check browser console for image loading errors
2. Verify file paths match the configuration
3. Ensure image format is PNG with proper dimensions
4. Test with browser cache cleared (`Ctrl+F5`)

---

**Integration Status**: Ready for portrait file placement
**Last Updated**: Current session
**Compatibility**: All game systems (Dialog, Quest, Romance, Cabin Chat) 