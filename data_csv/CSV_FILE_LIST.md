# CSV Files Created for Luxury Angler

## Core Data Files

1. **player_attributes.csv** - All player and equipment attributes (35 attributes)
2. **fish_species.csv** - Complete fish database (sample of 25 fish, full file would have 100+)
3. **locations.csv** - All fishing locations across 5 maps (19 sample locations)
4. **fishing_rods.csv** - Fishing rod equipment (10 rods)
5. **boats.csv** - Boat equipment (10 boats)
6. **clothing.csv** - Clothing equipment (13 items)
7. **lures.csv** - Lure items (18 lures)
8. **lure_types.csv** - Lure type definitions (5 types)
9. **struggle_patterns.csv** - Fish struggle behaviors (11 patterns)
10. **game_config.csv** - Game configuration values (35 settings)

## Reference Files

11. **rarity_reference.csv** - Rarity levels and modifiers
12. **weather_modifiers.csv** - Weather effects on fishing
13. **time_modifiers.csv** - Time of day effects

## Documentation

14. **README_CSV_GUIDE.md** - Comprehensive guide for using the CSV files
15. **CSV_FILE_LIST.md** - This file

## How to Use

1. Open any CSV file in Excel
2. Make your changes
3. Save as CSV (UTF-8 encoding)
4. Import back into the game

## Notes

- All numeric IDs use underscores (e.g., bamboo_rod, beginner_lake_dock)
- Rarity levels are 1-6 (Common to Mythic)
- Fish stats use 1-10 scale
- Modifiers use decimal values (1.0 = 100%)
- Multiple values in a cell use pipe separator (|)
- Empty cells indicate optional or null values

## Benefits of CSV Format

- Easy editing in Excel
- Simple version control
- Quick balancing changes
- Easy to share with team
- Can create charts/graphs
- Supports formulas for calculations
- Import/export to other tools 