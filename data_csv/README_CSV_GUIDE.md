# CSV Data Files Guide for Luxury Angler

## Overview
This guide explains how to use the CSV files for game design and balancing in Luxury Angler.

## File Structure

### Core Game Data Files

#### 1. **player_attributes.csv**
- Contains all player leveling and equipment attributes
- Use for balancing progression and equipment bonuses
- Key columns: base_value, max_value, improvement_per_level

#### 2. **fish_species.csv**
- Master database of all fish in the game
- Use for fish balancing and location population
- Key columns: rarity, stats (1-10 scale), coin_value, xp_value

#### 3. **locations.csv**
- All fishing locations across 5 maps
- Use for level design and difficulty progression
- Key columns: difficulty, unlock_level, modifiers, fish_population

#### 4. **equipment files** (fishing_rods.csv, boats.csv, clothing.csv)
- Equipment stats and progression
- Use for item balancing and crafting costs
- Key columns: rarity, stats, cost, crafting_materials

#### 5. **lures.csv & lure_types.csv**
- Lure items and their control schemes
- Use for lure balancing and effectiveness
- Key columns: bite_rate, success_rate, durability

### Reference Files

#### 1. **rarity_reference.csv**
- Rarity tiers and their modifiers
- Use when setting item/fish rarity

#### 2. **weather_modifiers.csv**
- Weather effects on fishing
- Use for environmental design

#### 3. **time_modifiers.csv**
- Time of day effects
- Use for scheduling fish activity

#### 4. **struggle_patterns.csv**
- Fish fighting behaviors
- Use for combat design

#### 5. **game_config.csv**
- Core game settings
- Use for global balancing

## Key Relationships

### Fish → Locations
- fish_species.csv `fish_id` → locations.csv `fish_population_1-5`
- Each location can have up to 5 fish species

### Fish → Struggle Patterns
- fish_species.csv `struggle_style` → struggle_patterns.csv `struggle_id`
- Defines how each fish fights when hooked

### Equipment → Crafting Materials
- All equipment files `crafting_material_1/2` → fish_species.csv `fish_id` OR equipment `item_id`
- Items can be crafted from fish or other items

### Locations → Maps
- locations.csv `map_id` → 5 main maps:
  - beginner_waters (spots 1-10)
  - coastal_harbor (spots 1-10)
  - mountain_streams (spots 1-10)
  - midnight_lakes (spots 1-10)
  - championship_waters (spots 1-10)

## Balancing Guidelines

### Rarity Distribution
- Common (1): 40% spawn rate
- Uncommon (2): 25% spawn rate
- Rare (3): 20% spawn rate
- Epic (4): 10% spawn rate
- Legendary (5): 4% spawn rate
- Mythic (6): 1% spawn rate

### Stat Scaling
- Most stats use 1-10 scale for fish
- Equipment stats vary but generally increase by rarity
- Modifiers are multiplicative (1.0 = 100%)

### Level Progression
- Locations unlock every 2-5 levels
- Equipment unlocks spread across 50 levels
- Fish difficulty should match location difficulty

## Excel Tips

1. **Use Data Validation** for:
   - Rarity levels (1-6)
   - Fish stats (1-10)
   - Valid fish_ids in locations

2. **Create Pivot Tables** for:
   - Fish distribution by location
   - Equipment progression by level
   - Stat averages by rarity

3. **Use Conditional Formatting** for:
   - Rarity colors
   - Difficulty levels
   - Stat ranges

4. **Filter Views** for:
   - Items by unlock level
   - Fish by environment
   - Locations by map

## Import/Export Process

1. Edit CSV files in Excel
2. Save as CSV (UTF-8)
3. Validate no special characters
4. Test in game engine
5. Iterate based on playtesting

## Common Formulas

### Fish Value Calculation
```
coin_value = base_coin * rarity_multiplier * size
xp_value = base_xp * rarity_multiplier * difficulty
```

### Equipment Cost
```
cost = base_cost * (rarity^2) * unlock_level_factor
```

### Catch Chance
```
chance = base_chance * weather_mod * time_mod * lure_mod * equipment_mod
``` 