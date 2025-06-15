# 🎨 Designer Workflow Guide

## Overview
This system allows designers to easily modify game data using CSV files (Excel/Google Sheets) and automatically convert them to JSON format for the game.

## 🚀 Quick Start

### Option 1: Automatic Conversion (Recommended)
```bash
npm run dev
```
- Automatically converts CSV → JSON before starting the game
- Perfect for regular development

### Option 2: Manual Conversion
```bash
npm run convert-csv
```
- Converts all CSV files to JSON on demand
- Use when you want to convert without starting the game

### Option 3: File Watcher (Advanced)
```bash
npm run watch-csv
```
- Automatically converts CSV → JSON whenever CSV files change
- Perfect for rapid iteration and testing

## 📊 File Structure

### CSV Files Location: `public/data_csv/`
All CSV files that designers can edit are located here:

#### **Fish & Fishing**
- `fish_species.csv` - All fish types, stats, and behaviors
- `struggle_styles.csv` - Fish struggle patterns and difficulty
- `fishing_rods.csv` - Fishing rod equipment and stats
- `lures.csv` - Lure equipment and effectiveness
- `lure_types.csv` - Lure categories and mechanics

#### **Equipment & Items**
- `boats.csv` - Boat equipment and capabilities
- `clothing.csv` - Clothing items and bonuses
- `item_categories.csv` - Item type definitions
- `item_properties.csv` - Item property schemas
- `stat_properties.csv` - Equipment stat definitions
- `rarity_settings.csv` - Rarity colors and names
- `inventory_limits.csv` - Inventory capacity limits

#### **Game Balance**
- `game_config.csv` - Core game configuration values
- `time_modifiers.csv` - Time-based fishing bonuses
- `weather_modifiers.csv` - Weather effect modifiers
- `rarity_reference.csv` - Rarity system settings
- `struggle_patterns.csv` - Base struggle mechanics

#### **Quests & Progression**
- `quests.csv` - Main quest definitions
- `quest_objectives.csv` - Quest objective details
- `quest_chains.csv` - Quest chain progression
- `quest_categories.csv` - Quest type categories
- `quest_settings.csv` - Quest system configuration

#### **World & Locations**
- `locations.csv` - Fishing locations and requirements
- `fish_attributes.csv` - Fish behavior attributes
- `attribute_modifiers.csv` - Environmental modifiers
- `player_attributes.csv` - Player progression attributes

## 🛠️ Editing Workflow

### Step 1: Open CSV Files
- Use **Excel**, **Google Sheets**, or any CSV editor
- Files are located in `public/data_csv/`
- Each file has clear column headers

### Step 2: Make Changes
- Edit values directly in the spreadsheet
- Follow the data format guidelines below
- Save the CSV file

### Step 3: Convert to JSON
Choose one of these methods:

**Automatic (Recommended):**
```bash
npm run dev
```

**Manual:**
```bash
npm run convert-csv
```

**File Watcher:**
```bash
npm run watch-csv
# Leave this running, it will auto-convert when you save CSV files
```

### Step 4: Test Changes
- Start the game with `npm run dev-only` (if not already running)
- Test your changes in-game
- Iterate as needed

## 📝 Data Format Guidelines

### Numbers
- Use plain numbers: `100`, `15.5`, `0`
- No commas or special formatting

### Booleans
- Use: `true` or `false` (lowercase)

### Arrays (Multiple Values)
- Use pipe separation: `morning|afternoon|evening`
- Example: `bass|trout|salmon`

### Text
- Use plain text without quotes
- Commas in text should be avoided (use semicolons if needed)

### Empty Values
- Leave cells empty or use `null`

## 🎯 Common Editing Tasks

### Adjusting Fish Difficulty
Edit `fish_species.csv`:
- `difficulty` - Overall challenge level (1-10)
- `stamina` - How long fish fights (50-200)
- `struggle_intensity` - How hard fish struggles (1-5)

### Balancing Equipment
Edit equipment CSV files:
- Stat columns (like `castAccuracy`, `tensionStability`)
- `unlockLevel` - When item becomes available
- `cost` - Purchase price

### Modifying Quest Rewards
Edit `quests.csv`:
- `rewardCoins` - Coin reward amount
- `rewardExperience` - XP reward amount
- `rewardRomanceMia` - Romance points (if applicable)

### Changing Game Balance
Edit `game_config.csv`:
- `baseCatchChance` - Base fishing success rate
- `experienceMultiplier` - XP gain modifier
- `coinMultiplier` - Coin gain modifier

## ⚠️ Important Notes

### File Relationships
Some JSON files are built from multiple CSV files:
- `fish.json` ← `fish_species.csv` + `struggle_styles.csv`
- `equipment.json` ← `fishing_rods.csv` + `boats.csv` + `clothing.csv` + `lures.csv`
- `quests.json` ← `quests.csv` + `quest_objectives.csv` + `quest_chains.csv` + etc.

### Backup Before Major Changes
- Always backup your CSV files before major changes
- Git version control is recommended

### Testing
- Test changes thoroughly in-game
- Check for balance issues
- Verify quest progression still works

## 🚨 Troubleshooting

### Conversion Errors
If conversion fails:
1. Check CSV file format (proper headers, no extra commas)
2. Verify data types (numbers as numbers, booleans as true/false)
3. Check for special characters in text fields

### Game Not Loading Changes
1. Ensure conversion completed successfully
2. Restart the game server (`npm run dev`)
3. Clear browser cache if needed

### File Not Found Errors
- Ensure CSV files are in `public/data_csv/` directory
- Check file names match exactly (case-sensitive)

## 🎉 Success!

With this system, designers can:
- ✅ Edit game data in familiar spreadsheet format
- ✅ Automatically convert to game-ready JSON
- ✅ Rapidly iterate and test changes
- ✅ Maintain data consistency across the project

**Happy designing!** 🎮 