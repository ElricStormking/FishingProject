# Equipment Slots Reference

This document lists all equipment items and their designated equipment slots.

## Equipment Slot Types

- **rod**: Fishing rods
- **lure**: Fishing lures and bait
- **boat**: Boats and vessels
- **head**: Headwear (caps, sunglasses, hats)
- **upper_body**: Upper body clothing (vests, bikini tops, shirts)
- **lower_body**: Lower body clothing (sandals, pants, shoes)
- **bikini_assistant**: Special companion slot

## Fishing Rods (equipSlot: "rod")

### Basic Rods
- **Bamboo Rod** (Rarity 1) - Traditional bamboo rod for beginners
- **Fiberglass Rod** (Rarity 2) - Flexible fiberglass construction
- **Carbon Rod** (Rarity 3) - Lightweight carbon fiber rod
- **Steel Rod** (Rarity 4) - Durable steel construction
- **Titanium Rod** (Rarity 5) - Premium titanium alloy rod

### Elite Rods
- **Elite Bamboo Rod** (Rarity 3) - Masterfully crafted bamboo rod
- **Elite Fiberglass Rod** (Rarity 4) - Enhanced fiberglass with precision guides
- **Elite Carbon Rod** (Rarity 5) - High-modulus carbon fiber
- **Elite Steel Rod** (Rarity 6) - Forged steel with titanium guides
- **Elite Titanium Rod** (Rarity 6) - Aerospace-grade titanium construction

## Fishing Lures (equipSlot: "lure")

### Spinners
- **Basic Spinner** (Rarity 1) - Simple spinning lure for beginners
- **Silver Spinner** (Rarity 2) - Reflective spinner with enhanced flash
- **Gold Spinner** (Rarity 3) - Premium gold-plated spinner
- **Elite Spinner** (Rarity 4) - High-performance spinner with perfect balance
- **Master Spinner** (Rarity 5) - Ultimate spinner with magnetic attraction
- **Legendary Spinner** (Rarity 6) - Mythical spinner that attracts legendary fish

### Soft Plastics
- **Soft Worm** (Rarity 1) - Flexible worm that moves naturally
- **Grub Tail** (Rarity 2) - Curly tail creates enticing action
- **Shad Body** (Rarity 3) - Realistic baitfish imitation
- **Elite Soft Worm** (Rarity 4) - Premium soft plastic with scent infusion
- **Master Soft Worm** (Rarity 5) - Bio-engineered soft plastic with lifelike movement
- **Legendary Soft Worm** (Rarity 6) - Mystical soft plastic that pulses with life

### Flies
- **Dry Fly** (Rarity 1) - Classic surface fly for trout
- **Wet Fly** (Rarity 2) - Subsurface fly that mimics emerging insects
- **Streamer Fly** (Rarity 3) - Large fly that imitates small fish
- **Elite Dry Fly** (Rarity 4) - Hand-tied fly with perfect proportions
- **Master Fly** (Rarity 5) - Artisan fly with exotic materials
- **Legendary Fly** (Rarity 6) - Ethereal fly that dances on water

### Poppers
- **Basic Popper** (Rarity 1) - Simple surface popper for aggressive fish
- **Chugger Popper** (Rarity 2) - Creates loud chugging sounds
- **Walker Popper** (Rarity 3) - Walks side-to-side on surface
- **Elite Popper** (Rarity 4) - Precision-crafted surface lure
- **Master Popper** (Rarity 5) - Creates irresistible surface commotion
- **Legendary Popper** (Rarity 6) - Legendary surface lure that calls to fish

### Spoons
- **Basic Spoon** (Rarity 1) - Classic metal spoon with wobbling action
- **Casting Spoon** (Rarity 2) - Heavy spoon for long-distance casting
- **Jigging Spoon** (Rarity 3) - Vertical jigging spoon for deep water
- **Elite Spoon** (Rarity 4) - Perfectly balanced premium spoon
- **Master Spoon** (Rarity 5) - Masterwork spoon with hypnotic action
- **Legendary Spoon** (Rarity 6) - Mythical spoon forged from starlight

## Boats (equipSlot: "boat")

### Basic Boats
- **Rowboat** (Rarity 1) - Simple wooden rowboat
- **Skiff** (Rarity 2) - Small motorized fishing boat
- **Speedboat** (Rarity 3) - Fast boat with twin engines
- **Yacht** (Rarity 4) - Luxury yacht with premium amenities
- **Luxury Liner** (Rarity 5) - Massive luxury cruise vessel

### Elite Boats
- **Elite Rowboat** (Rarity 3) - Reinforced rowboat with modern fittings
- **Elite Skiff** (Rarity 4) - Upgraded skiff with fish finder
- **Elite Speedboat** (Rarity 5) - High-performance racing boat
- **Elite Yacht** (Rarity 6) - Superyacht with advanced technology
- **Elite Luxury Liner** (Rarity 6) - Ultimate floating palace

## Clothing

### Head Slot (equipSlot: "head")
- **Fisher's Cap** (Rarity 1) - Classic fishing cap with sun protection
- **Sunglasses** (Rarity 2) - Polarized sunglasses for better vision
- **Elite Fisher's Cap** (Rarity 3) - Premium cap with advanced materials
- **Elite Sunglasses** (Rarity 4) - Designer sunglasses with fish-spotting tech
- **Master Fisher's Cap** (Rarity 5) - Legendary cap worn by master anglers
- **Master Sunglasses** (Rarity 6) - High-tech glasses with fish tracking

### Upper Body Slot (equipSlot: "upper_body")
- **Fishing Vest** (Rarity 3) - Multi-pocket vest for tackle storage
- **Bikini Top** (Rarity 2) - Stylish bikini top for luxury fishing
- **Elite Fishing Vest** (Rarity 5) - Professional vest with smart organization
- **Elite Bikini Top** (Rarity 4) - Designer bikini with luxury materials
- **Master Fishing Vest** (Rarity 6) - AI-powered vest with auto-organization
- **Master Bikini Top** (Rarity 6) - Enchanted bikini that captivates all

### Lower Body Slot (equipSlot: "lower_body")
- **Sandals** (Rarity 1) - Non-slip deck sandals
- **Elite Sandals** (Rarity 3) - Premium deck shoes with grip technology
- **Master Sandals** (Rarity 5) - Mystical sandals that glide on water

## Equipment Slot Compatibility

The inventory system supports flexible slot compatibility:

- **Direct Match**: Items with `equipSlot: "head"` can be equipped in head slot
- **Alternative Names**: Items with `equipSlot: "hat"` can also be equipped in head slot
- **Clothing Flexibility**: 
  - Head slot accepts: "head", "hat"
  - Upper body slot accepts: "upper_body", "chest", "vest"
  - Lower body slot accepts: "lower_body", "legs", "feet"

## Usage in Game

1. **Inventory UI**: Shows equipment slot for each item
2. **Equipment Panel**: Displays 7 equipment slots with visual indicators
3. **Slot Clicking**: Click any equipment slot to see compatible items
4. **Quick Equip**: Click items to equip them directly
5. **Visual Feedback**: Equipped items show "EQUIPPED" status
6. **Compatibility Check**: Only compatible items appear in slot selection menus

## Error Fixes Applied

1. **JSON Syntax Error**: Fixed missing closing brace in equipment.json
2. **Missing equipSlot**: Added equipSlot property to all equipment items
3. **Slot Compatibility**: Implemented flexible slot matching system
4. **UI Integration**: Updated inventory UI to display and use slot information
5. **Visual Indicators**: Added slot type labels and compatibility feedback 