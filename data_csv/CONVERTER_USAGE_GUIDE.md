# CSV ↔ JSON Converter Usage Guide

## Overview
This directory contains bidirectional converters between CSV and JSON formats for Luxury Angler game data.

## Files
- `json_to_csv_converter.js` - Converts JSON files to CSV format
- `csv_to_json_converter.js` - Converts CSV files back to JSON format
- `test_conversion_integrity.js` - Tests conversion integrity

## Converting JSON to CSV
```bash
cd data_csv
node json_to_csv_converter.js
```

This will convert:
- `../src/data/attributes.json` → `player_attributes.csv`
- `../src/data/fish.json` → `fish_species.csv`
- `../src/data/equipment.json` → `fishing_rods.csv`, `boats.csv`, `clothing.csv`, `lures.csv`
- `../src/data/LocationData.js` → `locations.csv`

## Converting CSV to JSON
```bash
cd data_csv
node csv_to_json_converter.js
```

This will convert all CSV files back to:
- `../src/data/attributes.json`
- `../src/data/fish.json`
- `../src/data/equipment.json`
- `../src/data/LocationData.js`
- `../src/data/gameConfig.json`
- `../src/data/lureTypes.json`
- `../src/data/strugglePatterns.json`
- `../src/data/rarityReference.json`
- `../src/data/weatherModifiers.json`
- `../src/data/timeModifiers.json`

## Testing Conversion Integrity
```bash
cd data_csv
node test_conversion_integrity.js
```

This verifies that:
- All data counts match between CSV and JSON
- Key data fields are preserved correctly
- No data is lost or corrupted during conversion

## Workflow

### For Game Design/Balancing:
1. Convert JSON to CSV: `node json_to_csv_converter.js`
2. Edit CSV files in Excel/Google Sheets
3. Convert back to JSON: `node csv_to_json_converter.js`
4. Test integrity: `node test_conversion_integrity.js`
5. Test in game

### For Development:
- Work directly with JSON files in `../src/data/`
- Use CSV files for data analysis and balancing
- Always run integrity tests before committing changes

## Data Integrity Guarantee
✅ **The conversion process maintains 100% data integrity** - verified by automated tests.

## Benefits
- **Easy Excel editing** for game designers
- **Version control friendly** CSV format
- **Fast iteration** on game balance
- **Data validation** through round-trip testing
- **Team collaboration** on game data

## File Formats Supported

### CSV Files:
- player_attributes.csv
- fish_species.csv
- fishing_rods.csv
- boats.csv
- clothing.csv
- lures.csv
- locations.csv
- game_config.csv
- lure_types.csv
- struggle_patterns.csv
- rarity_reference.csv
- weather_modifiers.csv
- time_modifiers.csv

### JSON Files:
- attributes.json
- fish.json
- equipment.json
- LocationData.js
- gameConfig.json
- lureTypes.json
- strugglePatterns.json
- rarityReference.json
- weatherModifiers.json
- timeModifiers.json 