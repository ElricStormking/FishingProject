// LocationData.js - Comprehensive 5 Maps ? 10 Spots Location System
export const LOCATION_DATA = {
    // ================================
    // MAP 1: BEGINNER WATERS (10 spots)
    // ================================
    
    'beginner_lake_dock': {
        id: 'beginner_lake_dock',
        name: 'Beginner Lake - Wooden Dock',
        mapId: 'beginner_waters',
        spotNumber: 1,
        description: 'A peaceful wooden dock perfect for learning fishing basics.',
        environment: 'freshwater',
        difficulty: 1,
        unlockLevel: 1,
        unlockRequirements: [],
        
        background: { primary: '#87CEEB', secondary: '#4682B4', water: '#6495ED' },
        
        fishPopulation: ['bluegill', 'sunfish', 'small_bass', 'perch', 'minnow'],
        
        rarityModifiers: { common: 1.5, uncommon: 1.0, rare: 0.5, epic: 0.2, legendary: 0.1 },
        
        fishingModifiers: {
            biteRate: 1.3, lineStrength: 1.1, castDistance: 1.0, 
            lureEffectiveness: 1.2, experienceBonus: 1.0
        },
        
        uniqueFeatures: ['Tutorial guidance', 'Calm waters', 'Equipment introductions']
    },
    
    'beginner_lake_shallows': {
        id: 'beginner_lake_shallows',
        name: 'Beginner Lake - Shallow Waters',
        mapId: 'beginner_waters',
        spotNumber: 2,
        description: 'Clear shallow waters where you can see fish swimming.',
        environment: 'freshwater',
        difficulty: 1,
        unlockLevel: 1,
        unlockRequirements: [],
        
        background: { primary: '#98E4F0', secondary: '#5DADE2', water: '#85C1E9' },
        
        fishPopulation: ['bluegill', 'sunfish', 'crappie', 'small_perch', 'dace'],
        
        fishingModifiers: {
            biteRate: 1.2, lineStrength: 1.0, castDistance: 0.9, 
            lureEffectiveness: 1.1, experienceBonus: 1.0
        },
        
        uniqueFeatures: ['High visibility', 'Easy casting', 'Frequent bites']
    },
    
    'beginner_lake_lily_pads': {
        id: 'beginner_lake_lily_pads',
        name: 'Beginner Lake - Lily Pad Area',
        mapId: 'beginner_waters',
        spotNumber: 3,
        description: 'A section covered with lily pads where bass like to hide.',
        environment: 'freshwater',
        difficulty: 2,
        unlockLevel: 2,
        
        fishPopulation: ['bass', 'bluegill', 'pike_fingerling', 'sunfish', 'perch'],
        
        fishingModifiers: {
            biteRate: 1.1, lineStrength: 0.9, castDistance: 0.8, 
            lureEffectiveness: 1.3, experienceBonus: 1.1
        },
        
        uniqueFeatures: ['Cover structures', 'Precision casting required', 'Bass hideouts']
    },
    
    'beginner_lake_deep_end': {
        id: 'beginner_lake_deep_end',
        name: 'Beginner Lake - Deep End',
        mapId: 'beginner_waters',
        spotNumber: 4,
        description: 'The deeper part of the lake where larger fish roam.',
        environment: 'freshwater',
        difficulty: 3,
        unlockLevel: 3,
        
        fishPopulation: ['large_bass', 'pike', 'walleye', 'catfish', 'carp'],
        
        rarityModifiers: { common: 1.0, uncommon: 1.2, rare: 1.0, epic: 0.5, legendary: 0.3 },
        
        fishingModifiers: {
            biteRate: 0.9, lineStrength: 0.8, castDistance: 1.2, 
            lureEffectiveness: 1.0, experienceBonus: 1.2
        }
    },
    
    'beginner_creek_inlet': {
        id: 'beginner_creek_inlet',
        name: 'Creek Inlet',
        mapId: 'beginner_waters',
        spotNumber: 5,
        description: 'Where a small creek flows into the lake, bringing fresh nutrients.',
        environment: 'freshwater',
        difficulty: 2,
        unlockLevel: 2,
        
        fishPopulation: ['trout', 'dace', 'chub', 'small_bass', 'minnow'],
        
        fishingModifiers: {
            biteRate: 1.4, lineStrength: 0.9, castDistance: 0.9, 
            lureEffectiveness: 1.2, experienceBonus: 1.1
        },
        
        uniqueFeatures: ['Current effects', 'High fish activity', 'Fresh water mixing']
    },
    
    'beginner_rocky_shore': {
        id: 'beginner_rocky_shore',
        name: 'Rocky Shore',
        mapId: 'beginner_waters',
        spotNumber: 6,
        description: 'A rocky shoreline where fish seek shelter among the stones.',
        environment: 'freshwater',
        difficulty: 2,
        unlockLevel: 3,
        
        fishPopulation: ['smallmouth_bass', 'rock_bass', 'perch', 'sunfish', 'darter'],
        
        fishingModifiers: {
            biteRate: 1.0, lineStrength: 0.8, castDistance: 1.0, 
            lureEffectiveness: 1.1, experienceBonus: 1.1
        },
        
        uniqueFeatures: ['Rock formations', 'Snag hazards', 'Structure fishing']
    },
    
    'beginner_weed_beds': {
        id: 'beginner_weed_beds',
        name: 'Weed Beds',
        mapId: 'beginner_waters',
        spotNumber: 7,
        description: 'Dense underwater vegetation that attracts various fish species.',
        environment: 'freshwater',
        difficulty: 3,
        unlockLevel: 4,
        
        fishPopulation: ['northern_pike', 'bass', 'bluegill', 'perch', 'pickerel'],
        
        fishingModifiers: {
            biteRate: 1.2, lineStrength: 0.7, castDistance: 0.8, 
            lureEffectiveness: 1.4, experienceBonus: 1.2
        },
        
        uniqueFeatures: ['Heavy cover', 'Weedless lures recommended', 'Ambush predators']
    },
    
    'beginner_muddy_bottom': {
        id: 'beginner_muddy_bottom',
        name: 'Muddy Bottom',
        mapId: 'beginner_waters',
        spotNumber: 8,
        description: 'Soft muddy bottom where bottom-feeders search for food.',
        environment: 'freshwater',
        difficulty: 2,
        unlockLevel: 3,
        
        fishPopulation: ['catfish', 'carp', 'bullhead', 'sucker', 'eel'],
        
        fishingModifiers: {
            biteRate: 1.1, lineStrength: 1.0, castDistance: 1.0, 
            lureEffectiveness: 0.9, experienceBonus: 1.1
        },
        
        uniqueFeatures: ['Bottom feeding', 'Night fishing preferred', 'Murky water']
    },
    
    'beginner_fallen_tree': {
        id: 'beginner_fallen_tree',
        name: 'Fallen Tree',
        mapId: 'beginner_waters',
        spotNumber: 9,
        description: 'A large fallen tree creates perfect fish habitat.',
        environment: 'freshwater',
        difficulty: 3,
        unlockLevel: 4,
        
        fishPopulation: ['large_bass', 'pike', 'bluegill', 'crappie', 'perch'],
        
        fishingModifiers: {
            biteRate: 1.3, lineStrength: 0.7, castDistance: 0.7, 
            lureEffectiveness: 1.5, experienceBonus: 1.3
        },
        
        uniqueFeatures: ['Prime structure', 'High snag risk', 'Big fish hideout']
    },
    
    'beginner_boat_launch': {
        id: 'beginner_boat_launch',
        name: 'Boat Launch Ramp',
        mapId: 'beginner_waters',
        spotNumber: 10,
        description: 'A concrete boat ramp with deeper access to the main lake.',
        environment: 'freshwater',
        difficulty: 2,
        unlockLevel: 3,
        
        fishPopulation: ['walleye', 'bass', 'pike', 'perch', 'white_bass'],
        
        fishingModifiers: {
            biteRate: 1.0, lineStrength: 1.0, castDistance: 1.3, 
            lureEffectiveness: 1.0, experienceBonus: 1.1
        },
        
        uniqueFeatures: ['Deep water access', 'Boat traffic', 'Varied depths']
    },

    // ================================
    // MAP 2: COASTAL HARBOR (10 spots)
    // ================================
    
    'harbor_main_pier': {
        id: 'harbor_main_pier',
        name: 'Harbor - Main Pier',
        mapId: 'coastal_harbor',
        spotNumber: 1,
        description: 'The bustling main pier with deep water access.',
        environment: 'saltwater',
        difficulty: 3,
        unlockLevel: 5,
        
        background: { primary: '#1E90FF', secondary: '#4169E1', water: '#0080FF' },
        
        fishPopulation: ['striped_bass', 'bluefish', 'flounder', 'sea_robin', 'scup'],
        
        fishingModifiers: {
            biteRate: 1.0, lineStrength: 0.8, castDistance: 1.2, 
            lureEffectiveness: 1.0, experienceBonus: 1.2
        },
        
        uniqueFeatures: ['Tidal effects', 'Boat traffic', 'Deep water']
    },
    
    'harbor_jetty_rocks': {
        id: 'harbor_jetty_rocks',
        name: 'Harbor - Jetty Rocks',
        mapId: 'coastal_harbor',
        spotNumber: 2,
        description: 'Rocky jetty providing shelter for marine life.',
        environment: 'saltwater',
        difficulty: 4,
        unlockLevel: 6,
        
        fishPopulation: ['black_sea_bass', 'tautog', 'striped_bass', 'cunner', 'porgy'],
        
        fishingModifiers: {
            biteRate: 1.2, lineStrength: 0.7, castDistance: 0.9, 
            lureEffectiveness: 1.3, experienceBonus: 1.3
        },
        
        uniqueFeatures: ['Rock structure', 'Current breaks', 'Snag hazards']
    },
    
    'harbor_sandy_flats': {
        id: 'harbor_sandy_flats',
        name: 'Harbor - Sandy Flats',
        mapId: 'coastal_harbor',
        spotNumber: 3,
        description: 'Shallow sandy areas where flatfish hunt.',
        environment: 'saltwater',
        difficulty: 2,
        unlockLevel: 5,
        
        fishPopulation: ['summer_flounder', 'winter_flounder', 'skate', 'sand_dab', 'weakfish'],
        
        fishingModifiers: {
            biteRate: 1.1, lineStrength: 1.0, castDistance: 1.1, 
            lureEffectiveness: 0.9, experienceBonus: 1.1
        },
        
        uniqueFeatures: ['Shallow water', 'Sandy bottom', 'Flatfish specialty']
    },
    
    'harbor_channel_edge': {
        id: 'harbor_channel_edge',
        name: 'Harbor - Channel Edge',
        mapId: 'coastal_harbor',
        spotNumber: 4,
        description: 'Deep shipping channel where large fish patrol.',
        environment: 'saltwater',
        difficulty: 4,
        unlockLevel: 7,
        
        fishPopulation: ['bluefish', 'striper_large', 'weakfish', 'spanish_mackerel', 'bonito'],
        
        rarityModifiers: { common: 0.8, uncommon: 1.0, rare: 1.3, epic: 1.1, legendary: 0.7 },
        
        fishingModifiers: {
            biteRate: 0.9, lineStrength: 0.7, castDistance: 1.4, 
            lureEffectiveness: 1.0, experienceBonus: 1.4
        },
        
        uniqueFeatures: ['Deep channel', 'Strong currents', 'Large fish migration route']
    },
    
    'harbor_marina_docks': {
        id: 'harbor_marina_docks',
        name: 'Harbor - Marina Docks',
        mapId: 'coastal_harbor',
        spotNumber: 5,
        description: 'Protected marina with calm waters and resident fish.',
        environment: 'saltwater',
        difficulty: 2,
        unlockLevel: 5,
        
        fishPopulation: ['winter_flounder', 'cunner', 'bergall', 'small_striper', 'scup'],
        
        fishingModifiers: {
            biteRate: 1.3, lineStrength: 1.0, castDistance: 0.8, 
            lureEffectiveness: 1.1, experienceBonus: 1.0
        },
        
        uniqueFeatures: ['Protected waters', 'Structure fishing', 'Year-round fishing']
    },
    
    'harbor_inlet_mouth': {
        id: 'harbor_inlet_mouth',
        name: 'Harbor - Inlet Mouth',
        mapId: 'coastal_harbor',
        spotNumber: 6,
        description: 'Where the harbor meets the open ocean.',
        environment: 'saltwater',
        difficulty: 5,
        unlockLevel: 8,
        
        fishPopulation: ['bluefish_large', 'striped_bass', 'weakfish', 'fluke', 'bonito'],
        
        fishingModifiers: {
            biteRate: 1.0, lineStrength: 0.6, castDistance: 1.5, 
            lureEffectiveness: 1.2, experienceBonus: 1.5
        },
        
        uniqueFeatures: ['Ocean access', 'Strong tides', 'Migratory fish route']
    },
    
    'harbor_fishing_bridge': {
        id: 'harbor_fishing_bridge',
        name: 'Harbor - Fishing Bridge',
        mapId: 'coastal_harbor',
        spotNumber: 7,
        description: 'A popular bridge with excellent fishing opportunities.',
        environment: 'saltwater',
        difficulty: 3,
        unlockLevel: 6,
        
        fishPopulation: ['striped_bass', 'bluefish', 'mackerel', 'sea_robin', 'porgy'],
        
        fishingModifiers: {
            biteRate: 1.2, lineStrength: 0.8, castDistance: 1.1, 
            lureEffectiveness: 1.0, experienceBonus: 1.2
        },
        
        uniqueFeatures: ['Elevated fishing', 'Bridge structure', 'Popular spot']
    },
    
    'harbor_muddy_cove': {
        id: 'harbor_muddy_cove',
        name: 'Harbor - Muddy Cove',
        mapId: 'coastal_harbor',
        spotNumber: 8,
        description: 'A protected cove with muddy bottom and calm waters.',
        environment: 'saltwater',
        difficulty: 2,
        unlockLevel: 5,
        
        fishPopulation: ['winter_flounder', 'eel', 'skate', 'tautog_small', 'cunner'],
        
        fishingModifiers: {
            biteRate: 1.1, lineStrength: 1.0, castDistance: 0.9, 
            lureEffectiveness: 0.8, experienceBonus: 1.1
        },
        
        uniqueFeatures: ['Sheltered waters', 'Muddy bottom', 'Bottom fishing']
    },
    
    'harbor_breakwater': {
        id: 'harbor_breakwater',
        name: 'Harbor - Breakwater',
        mapId: 'coastal_harbor',
        spotNumber: 9,
        description: 'Massive stone breakwater protecting the harbor.',
        environment: 'saltwater',
        difficulty: 4,
        unlockLevel: 7,
        
        fishPopulation: ['black_sea_bass', 'tautog', 'striped_bass', 'bluefish', 'sea_bass_large'],
        
        fishingModifiers: {
            biteRate: 1.1, lineStrength: 0.6, castDistance: 1.0, 
            lureEffectiveness: 1.4, experienceBonus: 1.3
        },
        
        uniqueFeatures: ['Massive structure', 'Dangerous waves', 'Trophy fish hideout']
    },
    
    'harbor_commercial_wharf': {
        id: 'harbor_commercial_wharf',
        name: 'Harbor - Commercial Wharf',
        mapId: 'coastal_harbor',
        spotNumber: 10,
        description: 'Working wharf with deep water and fish processing activity.',
        environment: 'saltwater',
        difficulty: 3,
        unlockLevel: 6,
        
        fishPopulation: ['striped_bass', 'bluefish', 'sea_robin', 'mackerel', 'skate'],
        
        fishingModifiers: {
            biteRate: 1.0, lineStrength: 0.8, castDistance: 1.2, 
            lureEffectiveness: 0.9, experienceBonus: 1.2
        },
        
        uniqueFeatures: ['Commercial activity', 'Fish scraps attract fish', 'Deep water access']
    },

    // ================================
    // MAP 3: MOUNTAIN STREAMS (10 spots)
    // ================================
    
    'mountain_crystal_falls': {
        id: 'mountain_crystal_falls',
        name: 'Crystal Falls',
        mapId: 'mountain_streams',
        spotNumber: 1,
        description: 'A beautiful waterfall creating deep pools below.',
        environment: 'mountain_freshwater',
        difficulty: 4,
        unlockLevel: 10,
        
        background: { primary: '#708090', secondary: '#2F4F4F', water: '#48CAE4' },
        
        fishPopulation: ['rainbow_trout', 'brook_trout', 'mountain_whitefish', 'sculpin', 'dace'],
        
        rarityModifiers: { common: 0.7, uncommon: 1.0, rare: 1.4, epic: 1.2, legendary: 0.8 },
        
        fishingModifiers: {
            biteRate: 0.8, lineStrength: 0.6, castDistance: 0.7, 
            lureEffectiveness: 1.4, experienceBonus: 1.4
        },
        
        uniqueFeatures: ['Waterfall pools', 'Strong currents', 'Crystal clear water']
    },
    
    'mountain_rapids_bend': {
        id: 'mountain_rapids_bend',
        name: 'Rapids Bend',
        mapId: 'mountain_streams',
        spotNumber: 2,
        description: 'Fast-flowing rapids with rocky outcrops.',
        environment: 'mountain_freshwater',
        difficulty: 5,
        unlockLevel: 11,
        
        fishPopulation: ['brown_trout', 'cutthroat_trout', 'mountain_sucker', 'sculpin', 'minnow'],
        
        fishingModifiers: {
            biteRate: 0.7, lineStrength: 0.5, castDistance: 0.6, 
            lureEffectiveness: 1.6, experienceBonus: 1.6
        },
        
        uniqueFeatures: ['Extreme currents', 'Precision casting required', 'Wild trout habitat']
    },
    
    'mountain_quiet_pool': {
        id: 'mountain_quiet_pool',
        name: 'Quiet Pool',
        mapId: 'mountain_streams',
        spotNumber: 3,
        description: 'A calm pool where the stream widens and slows.',
        environment: 'mountain_freshwater',
        difficulty: 3,
        unlockLevel: 10,
        
        fishPopulation: ['rainbow_trout', 'brook_trout', 'mountain_whitefish', 'dace', 'chub'],
        
        fishingModifiers: {
            biteRate: 1.1, lineStrength: 0.8, castDistance: 1.0, 
            lureEffectiveness: 1.2, experienceBonus: 1.3
        },
        
        uniqueFeatures: ['Calm water', 'Easy presentation', 'Feeding trout']
    },
    
    'mountain_beaver_dam': {
        id: 'mountain_beaver_dam',
        name: 'Beaver Dam',
        mapId: 'mountain_streams',
        spotNumber: 4,
        description: 'A natural beaver dam creating a small mountain lake.',
        environment: 'mountain_freshwater',
        difficulty: 3,
        unlockLevel: 11,
        
        fishPopulation: ['brook_trout', 'mountain_whitefish', 'sucker', 'dace', 'chub'],
        
        fishingModifiers: {
            biteRate: 1.2, lineStrength: 0.7, castDistance: 0.9, 
            lureEffectiveness: 1.3, experienceBonus: 1.3
        },
        
        uniqueFeatures: ['Still water pocket', 'Natural structure', 'Beaver activity']
    },
    
    'mountain_rock_garden': {
        id: 'mountain_rock_garden',
        name: 'Rock Garden',
        mapId: 'mountain_streams',
        spotNumber: 5,
        description: 'Boulder-strewn stream section with pockets and eddies.',
        environment: 'mountain_freshwater',
        difficulty: 4,
        unlockLevel: 12,
        
        fishPopulation: ['cutthroat_trout', 'rainbow_trout', 'sculpin', 'dace', 'sucker'],
        
        fishingModifiers: {
            biteRate: 0.9, lineStrength: 0.6, castDistance: 0.7, 
            lureEffectiveness: 1.5, experienceBonus: 1.4
        },
        
        uniqueFeatures: ['Complex structure', 'Multiple pockets', 'Technical fishing']
    },
    
    'mountain_spring_creek': {
        id: 'mountain_spring_creek',
        name: 'Spring Creek',
        mapId: 'mountain_streams',
        spotNumber: 6,
        description: 'A spring-fed tributary with incredibly clear water.',
        environment: 'mountain_freshwater',
        difficulty: 5,
        unlockLevel: 13,
        
        fishPopulation: ['golden_trout', 'brook_trout', 'mountain_whitefish', 'sculpin', 'dace'],
        
        rarityModifiers: { common: 0.5, uncommon: 0.8, rare: 1.5, epic: 1.4, legendary: 1.2 },
        
        fishingModifiers: {
            biteRate: 0.6, lineStrength: 0.7, castDistance: 0.8, 
            lureEffectiveness: 1.4, experienceBonus: 1.7
        },
        
        uniqueFeatures: ['Crystal spring water', 'Spooky fish', 'Rare golden trout']
    },
    
    'mountain_gorge_depths': {
        id: 'mountain_gorge_depths',
        name: 'Gorge Depths',
        mapId: 'mountain_streams',
        spotNumber: 7,
        description: 'Deep pools carved into the mountain gorge.',
        environment: 'mountain_freshwater',
        difficulty: 4,
        unlockLevel: 12,
        
        fishPopulation: ['bull_trout', 'brown_trout', 'mountain_whitefish', 'sculpin', 'sucker'],
        
        fishingModifiers: {
            biteRate: 0.8, lineStrength: 0.6, castDistance: 1.1, 
            lureEffectiveness: 1.3, experienceBonus: 1.5
        },
        
        uniqueFeatures: ['Deep pools', 'Shadowy depths', 'Large trout habitat']
    },
    
    'mountain_meadow_meander': {
        id: 'mountain_meadow_meander',
        name: 'Meadow Meander',
        mapId: 'mountain_streams',
        spotNumber: 8,
        description: 'Gentle curves through an alpine meadow.',
        environment: 'mountain_freshwater',
        difficulty: 2,
        unlockLevel: 10,
        
        fishPopulation: ['rainbow_trout', 'brook_trout', 'mountain_whitefish', 'dace', 'chub'],
        
        fishingModifiers: {
            biteRate: 1.3, lineStrength: 0.9, castDistance: 1.2, 
            lureEffectiveness: 1.1, experienceBonus: 1.2
        },
        
        uniqueFeatures: ['Open meadow', 'Gentle currents', 'Scenic fishing']
    },
    
    'mountain_glacier_runoff': {
        id: 'mountain_glacier_runoff',
        name: 'Glacier Runoff',
        mapId: 'mountain_streams',
        spotNumber: 9,
        description: 'Ice-cold water flowing directly from mountain glaciers.',
        environment: 'mountain_freshwater',
        difficulty: 5,
        unlockLevel: 14,
        
        fishPopulation: ['arctic_char', 'bull_trout', 'mountain_whitefish', 'sculpin', 'grayling'],
        
        fishingModifiers: {
            biteRate: 0.5, lineStrength: 0.8, castDistance: 0.9, 
            lureEffectiveness: 1.2, experienceBonus: 1.8
        },
        
        uniqueFeatures: ['Glacial water', 'Extreme cold', 'Rare arctic species']
    },
    
    'mountain_alpine_tarn': {
        id: 'mountain_alpine_tarn',
        name: 'Alpine Tarn',
        mapId: 'mountain_streams',
        spotNumber: 10,
        description: 'A high-altitude mountain lake formed by glacial action.',
        environment: 'mountain_freshwater',
        difficulty: 4,
        unlockLevel: 13,
        
        fishPopulation: ['golden_trout', 'brook_trout', 'arctic_char', 'grayling', 'whitefish'],
        
        rarityModifiers: { common: 0.4, uncommon: 0.7, rare: 1.6, epic: 1.5, legendary: 1.3 },
        
        fishingModifiers: {
            biteRate: 0.7, lineStrength: 0.9, castDistance: 1.3, 
            lureEffectiveness: 1.1, experienceBonus: 1.6
        },
        
        uniqueFeatures: ['High altitude', 'Pristine water', 'Trophy golden trout']
    },

    // ================================
    // MAP 4: MIDNIGHT LAKES (10 spots)
    // ================================
    
    'midnight_moonlit_cove': {
        id: 'midnight_moonlit_cove',
        name: 'Moonlit Cove',
        mapId: 'midnight_lakes',
        spotNumber: 1,
        description: 'A mystical cove where moonlight dances on the water.',
        environment: 'mystical_freshwater',
        difficulty: 4,
        unlockLevel: 15,
        
        background: { primary: '#191970', secondary: '#483D8B', water: '#4B0082' },
        
        fishPopulation: ['moonbeam_bass', 'luna_catfish', 'twilight_perch', 'silver_carp', 'night_crawler'],
        
        rarityModifiers: { common: 0.6, uncommon: 1.0, rare: 1.3, epic: 1.4, legendary: 1.2 },
        
        fishingModifiers: {
            biteRate: 1.2, lineStrength: 0.8, castDistance: 1.1, 
            lureEffectiveness: 1.3, experienceBonus: 1.4
        },
        
        uniqueFeatures: ['Moonlight effects', 'Mystical atmosphere', 'Lunar fish behavior']
    },
    
    'midnight_shadow_depths': {
        id: 'midnight_shadow_depths',
        name: 'Shadow Depths',
        mapId: 'midnight_lakes',
        spotNumber: 2,
        description: 'The deepest part of the lake where shadows gather.',
        environment: 'mystical_freshwater',
        difficulty: 5,
        unlockLevel: 16,
        
        fishPopulation: ['shadow_pike', 'void_bass', 'depth_catfish', 'phantom_eel', 'abyss_trout'],
        
        fishingModifiers: {
            biteRate: 0.8, lineStrength: 0.6, castDistance: 1.4, 
            lureEffectiveness: 1.2, experienceBonus: 1.6
        },
        
        uniqueFeatures: ['Extreme depths', 'Shadow creatures', 'Mysterious fish behavior']
    },
    
    'midnight_starlight_shallows': {
        id: 'midnight_starlight_shallows',
        name: 'Starlight Shallows',
        mapId: 'midnight_lakes',
        spotNumber: 3,
        description: 'Shallow waters that sparkle with reflected starlight.',
        environment: 'mystical_freshwater',
        difficulty: 3,
        unlockLevel: 15,
        
        fishPopulation: ['starlight_minnow', 'cosmic_bluegill', 'stellar_perch', 'galaxy_sunfish', 'nebula_dace'],
        
        fishingModifiers: {
            biteRate: 1.4, lineStrength: 1.0, castDistance: 0.9, 
            lureEffectiveness: 1.2, experienceBonus: 1.3
        },
        
        uniqueFeatures: ['Starlight reflection', 'Shallow presentation', 'Cosmic fish varieties']
    },
    
    'midnight_misty_inlet': {
        id: 'midnight_misty_inlet',
        name: 'Misty Inlet',
        mapId: 'midnight_lakes',
        spotNumber: 4,
        description: 'A fog-shrouded inlet where reality seems to bend.',
        environment: 'mystical_freshwater',
        difficulty: 4,
        unlockLevel: 16,
        
        fishPopulation: ['mist_trout', 'fog_bass', 'vapor_pike', 'cloud_perch', 'spirit_catfish'],
        
        fishingModifiers: {
            biteRate: 1.0, lineStrength: 0.7, castDistance: 0.8, 
            lureEffectiveness: 1.4, experienceBonus: 1.5
        },
        
        uniqueFeatures: ['Perpetual mist', 'Ethereal atmosphere', 'Spirit fish habitat']
    },
    
    'midnight_crystal_springs': {
        id: 'midnight_crystal_springs',
        name: 'Crystal Springs',
        mapId: 'midnight_lakes',
        spotNumber: 5,
        description: 'Springs that bubble up from unknown depths.',
        environment: 'mystical_freshwater',
        difficulty: 3,
        unlockLevel: 15,
        
        fishPopulation: ['crystal_trout', 'prism_bass', 'diamond_perch', 'gem_minnow', 'quartz_dace'],
        
        fishingModifiers: {
            biteRate: 1.1, lineStrength: 0.9, castDistance: 1.0, 
            lureEffectiveness: 1.3, experienceBonus: 1.4
        },
        
        uniqueFeatures: ['Crystal clear water', 'Underwater springs', 'Gem-like fish']
    },
    
    'midnight_whirlpool_edge': {
        id: 'midnight_whirlpool_edge',
        name: 'Whirlpool Edge',
        mapId: 'midnight_lakes',
        spotNumber: 6,
        description: 'The dangerous edge of a mysterious whirlpool.',
        environment: 'mystical_freshwater',
        difficulty: 6,
        unlockLevel: 18,
        
        fishPopulation: ['vortex_bass', 'spiral_pike', 'cyclone_catfish', 'whirlpool_eel', 'tempest_trout'],
        
        fishingModifiers: {
            biteRate: 0.6, lineStrength: 0.4, castDistance: 1.2, 
            lureEffectiveness: 1.6, experienceBonus: 2.0
        },
        
        uniqueFeatures: ['Dangerous currents', 'Whirlpool effects', 'Extreme challenge']
    },
    
    'midnight_echo_chamber': {
        id: 'midnight_echo_chamber',
        name: 'Echo Chamber',
        mapId: 'midnight_lakes',
        spotNumber: 7,
        description: 'A cove where sounds echo strangely across the water.',
        environment: 'mystical_freshwater',
        difficulty: 4,
        unlockLevel: 16,
        
        fishPopulation: ['echo_bass', 'resonance_pike', 'sound_trout', 'vibration_perch', 'harmony_catfish'],
        
        fishingModifiers: {
            biteRate: 1.0, lineStrength: 0.8, castDistance: 1.1, 
            lureEffectiveness: 1.3, experienceBonus: 1.5
        },
        
        uniqueFeatures: ['Sound amplification', 'Acoustic phenomena', 'Sound-sensitive fish']
    },
    
    'midnight_dream_shallows': {
        id: 'midnight_dream_shallows',
        name: 'Dream Shallows',
        mapId: 'midnight_lakes',
        spotNumber: 8,
        description: 'Shallow waters that seem to exist between dreams.',
        environment: 'mystical_freshwater',
        difficulty: 3,
        unlockLevel: 15,
        
        fishPopulation: ['dream_minnow', 'sleep_bass', 'fantasy_perch', 'imagination_trout', 'reverie_sunfish'],
        
        fishingModifiers: {
            biteRate: 1.3, lineStrength: 1.0, castDistance: 0.9, 
            lureEffectiveness: 1.2, experienceBonus: 1.3
        },
        
        uniqueFeatures: ['Dreamlike quality', 'Surreal fish behavior', 'Peaceful atmosphere']
    },
    
    'midnight_void_drop': {
        id: 'midnight_void_drop',
        name: 'Void Drop',
        mapId: 'midnight_lakes',
        spotNumber: 9,
        description: 'A sheer underwater cliff dropping into blackness.',
        environment: 'mystical_freshwater',
        difficulty: 6,
        unlockLevel: 19,
        
        fishPopulation: ['void_leviathan', 'abyss_kraken', 'shadow_behemoth', 'darkness_dragon', 'nightmare_beast'],
        
        rarityModifiers: { common: 0.2, uncommon: 0.4, rare: 1.0, epic: 1.8, legendary: 2.0 },
        
        fishingModifiers: {
            biteRate: 0.4, lineStrength: 0.3, castDistance: 1.5, 
            lureEffectiveness: 1.4, experienceBonus: 2.5
        },
        
        uniqueFeatures: ['Extreme depths', 'Legendary monsters', 'Ultimate challenge']
    },
    
    'midnight_celestial_pool': {
        id: 'midnight_celestial_pool',
        name: 'Celestial Pool',
        mapId: 'midnight_lakes',
        spotNumber: 10,
        description: 'A perfectly round pool reflecting the entire night sky.',
        environment: 'mystical_freshwater',
        difficulty: 5,
        unlockLevel: 17,
        
        fishPopulation: ['celestial_koi', 'astral_bass', 'cosmic_trout', 'stellar_pike', 'universe_catfish'],
        
        fishingModifiers: {
            biteRate: 0.9, lineStrength: 0.7, castDistance: 1.2, 
            lureEffectiveness: 1.5, experienceBonus: 1.7
        },
        
        uniqueFeatures: ['Perfect reflection', 'Celestial connection', 'Cosmic fish varieties']
    },

    // ================================
    // MAP 5: CHAMPIONSHIP WATERS (10 spots)
    // ================================
    
    'championship_grand_arena': {
        id: 'championship_grand_arena',
        name: 'Grand Tournament Arena',
        mapId: 'championship_waters',
        spotNumber: 1,
        description: 'The main competition platform for elite tournaments.',
        environment: 'tournament_waters',
        difficulty: 6,
        unlockLevel: 20,
        
        background: { primary: '#FFD700', secondary: '#FF6347', water: '#00CED1' },
        
        fishPopulation: ['champion_bass', 'tournament_marlin', 'trophy_salmon', 'elite_tuna', 'master_pike'],
        
        rarityModifiers: { common: 0.1, uncommon: 0.3, rare: 1.0, epic: 2.0, legendary: 3.0 },
        
        fishingModifiers: {
            biteRate: 0.8, lineStrength: 0.5, castDistance: 1.3, 
            lureEffectiveness: 1.4, experienceBonus: 2.0
        },
        
        uniqueFeatures: ['Tournament platform', 'Elite competition', 'Maximum prestige']
    },
    
    'championship_precision_course': {
        id: 'championship_precision_course',
        name: 'Precision Casting Course',
        mapId: 'championship_waters',
        spotNumber: 2,
        description: 'A technical course testing casting accuracy.',
        environment: 'tournament_waters',
        difficulty: 5,
        unlockLevel: 20,
        
        fishPopulation: ['precision_bass', 'accuracy_trout', 'target_pike', 'bullseye_perch', 'marksman_salmon'],
        
        fishingModifiers: {
            biteRate: 1.0, lineStrength: 0.8, castDistance: 0.7, 
            lureEffectiveness: 1.8, experienceBonus: 1.8
        },
        
        uniqueFeatures: ['Precision required', 'Technical challenge', 'Accuracy testing']
    },
    
    'championship_speed_fishing': {
        id: 'championship_speed_fishing',
        name: 'Speed Fishing Lane',
        mapId: 'championship_waters',
        spotNumber: 3,
        description: 'Fast-paced fishing challenge with time limits.',
        environment: 'tournament_waters',
        difficulty: 5,
        unlockLevel: 20,
        
        fishPopulation: ['speed_bass', 'quick_trout', 'rapid_pike', 'fast_perch', 'swift_salmon'],
        
        fishingModifiers: {
            biteRate: 1.8, lineStrength: 0.9, castDistance: 1.0, 
            lureEffectiveness: 1.2, experienceBonus: 1.6
        },
        
        uniqueFeatures: ['Time pressure', 'Quick decisions', 'Fast action']
    },
    
    'championship_endurance_test': {
        id: 'championship_endurance_test',
        name: 'Endurance Testing Ground',
        mapId: 'championship_waters',
        spotNumber: 4,
        description: 'Marathon fishing challenge testing stamina.',
        environment: 'tournament_waters',
        difficulty: 6,
        unlockLevel: 22,
        
        fishPopulation: ['endurance_marlin', 'marathon_tuna', 'stamina_shark', 'persistence_bass', 'tenacity_pike'],
        
        fishingModifiers: {
            biteRate: 0.6, lineStrength: 0.4, castDistance: 1.4, 
            lureEffectiveness: 1.3, experienceBonus: 2.2
        },
        
        uniqueFeatures: ['Extended battles', 'Stamina testing', 'Endurance challenge']
    },
    
    'championship_masters_cove': {
        id: 'championship_masters_cove',
        name: 'Masters Exclusive Cove',
        mapId: 'championship_waters',
        spotNumber: 5,
        description: 'Exclusive area reserved for master anglers.',
        environment: 'tournament_waters',
        difficulty: 7,
        unlockLevel: 25,
        
        fishPopulation: ['master_bass', 'legendary_marlin', 'mythic_tuna', 'supreme_pike', 'ultimate_salmon'],
        
        fishingModifiers: {
            biteRate: 0.5, lineStrength: 0.3, castDistance: 1.5, 
            lureEffectiveness: 1.6, experienceBonus: 2.5
        },
        
        uniqueFeatures: ['Master anglers only', 'Legendary fish', 'Ultimate prestige']
    },
    
    'championship_technique_showcase': {
        id: 'championship_technique_showcase',
        name: 'Technique Showcase',
        mapId: 'championship_waters',
        spotNumber: 6,
        description: 'Platform for demonstrating advanced fishing techniques.',
        environment: 'tournament_waters',
        difficulty: 5,
        unlockLevel: 21,
        
        fishPopulation: ['technique_bass', 'finesse_trout', 'artistry_pike', 'mastery_perch', 'skill_salmon'],
        
        fishingModifiers: {
            biteRate: 0.9, lineStrength: 0.7, castDistance: 1.1, 
            lureEffectiveness: 1.7, experienceBonus: 1.9
        },
        
        uniqueFeatures: ['Technique focus', 'Skill demonstration', 'Artistry in angling']
    },
    
    'championship_obstacle_course': {
        id: 'championship_obstacle_course',
        name: 'Obstacle Course Challenge',
        mapId: 'championship_waters',
        spotNumber: 7,
        description: 'Complex course with various fishing obstacles.',
        environment: 'tournament_waters',
        difficulty: 6,
        unlockLevel: 23,
        
        fishPopulation: ['obstacle_bass', 'challenge_pike', 'hurdle_trout', 'barrier_perch', 'maze_salmon'],
        
        fishingModifiers: {
            biteRate: 0.7, lineStrength: 0.6, castDistance: 0.8, 
            lureEffectiveness: 1.5, experienceBonus: 2.1
        },
        
        uniqueFeatures: ['Complex obstacles', 'Navigation challenge', 'Multi-skill test']
    },
    
    'championship_legends_pool': {
        id: 'championship_legends_pool',
        name: 'Legends Memorial Pool',
        mapId: 'championship_waters',
        spotNumber: 8,
        description: 'Sacred pool honoring legendary anglers.',
        environment: 'tournament_waters',
        difficulty: 7,
        unlockLevel: 30,
        
        fishPopulation: ['legend_bass', 'immortal_marlin', 'eternal_tuna', 'timeless_pike', 'ancient_salmon'],
        
        rarityModifiers: { common: 0.05, uncommon: 0.1, rare: 0.5, epic: 1.5, legendary: 4.0 },
        
        fishingModifiers: {
            biteRate: 0.3, lineStrength: 0.2, castDistance: 1.6, 
            lureEffectiveness: 1.8, experienceBonus: 3.0
        },
        
        uniqueFeatures: ['Legendary status', 'Immortal fish', 'Sacred waters']
    },
    
    'championship_innovation_lab': {
        id: 'championship_innovation_lab',
        name: 'Innovation Laboratory',
        mapId: 'championship_waters',
        spotNumber: 9,
        description: 'Testing ground for new fishing technologies.',
        environment: 'tournament_waters',
        difficulty: 5,
        unlockLevel: 22,
        
        fishPopulation: ['tech_bass', 'cyber_trout', 'digital_pike', 'nano_perch', 'quantum_salmon'],
        
        fishingModifiers: {
            biteRate: 1.1, lineStrength: 0.8, castDistance: 1.2, 
            lureEffectiveness: 1.9, experienceBonus: 1.8
        },
        
        uniqueFeatures: ['Advanced technology', 'Innovation testing', 'Futuristic fishing']
    },
    
    'championship_hall_of_fame': {
        id: 'championship_hall_of_fame',
        name: 'Hall of Fame Waters',
        mapId: 'championship_waters',
        spotNumber: 10,
        description: 'The ultimate fishing destination for champions.',
        environment: 'tournament_waters',
        difficulty: 8,
        unlockLevel: 50,
        
        fishPopulation: ['fame_leviathan', 'champion_kraken', 'trophy_behemoth', 'glory_dragon', 'victory_titan'],
        
        rarityModifiers: { common: 0.01, uncommon: 0.05, rare: 0.3, epic: 1.0, legendary: 5.0 },
        
        fishingModifiers: {
            biteRate: 0.2, lineStrength: 0.1, castDistance: 1.8, 
            lureEffectiveness: 2.0, experienceBonus: 5.0
        },
        
        uniqueFeatures: ['Ultimate challenge', 'Hall of fame status', 'Legendary monsters', 'Maximum prestige']
    }
};

// Utility functions
export function getLocationById(locationId) {
    return LOCATION_DATA[locationId] || null;
}

export function getLocationsByMap(mapId) {
    return Object.values(LOCATION_DATA).filter(location => location.mapId === mapId);
}

export function getAllLocations() {
    return Object.values(LOCATION_DATA);
}

export function getUnlockedLocations(playerLevel, achievements = []) {
    return getAllLocations().filter(location => {
        // Check level requirement
        if (playerLevel < location.unlockLevel) return false;
        
        // Check achievement requirements (if any)
        if (location.unlockRequirements && location.unlockRequirements.length > 0) {
            return location.unlockRequirements.every(req => achievements.includes(req));
        }
        
        return true;
    });
}

export function getLocationDifficulty(locationId) {
    const location = getLocationById(locationId);
    return location ? location.difficulty : 1;
}

export function getLocationFishPopulation(locationId) {
    const location = getLocationById(locationId);
    return location ? location.fishPopulation : [];
}

export function getLocationWeatherPattern(locationId) {
    const location = getLocationById(locationId);
    return location ? location.weatherPatterns : { sunny: 0.6, rainy: 0.4 };
}

export function getLocationFishingModifiers(locationId) {
    const location = getLocationById(locationId);
    return location ? location.fishingModifiers : {
        biteRate: 1.0,
        lineStrength: 1.0,
        castDistance: 1.0,
        lureEffectiveness: 1.0,
        experienceBonus: 1.0
    };
}

export function getMapInfo() {
    return {
        'beginner_waters': {
            name: 'Beginner Waters',
            description: 'Calm freshwater lake perfect for learning',
            difficulty: 1,
            unlockLevel: 1,
            spots: 10,
            environment: 'freshwater'
        },
        'coastal_harbor': {
            name: 'Coastal Harbor', 
            description: 'Bustling saltwater harbor with tidal fishing',
            difficulty: 3,
            unlockLevel: 5,
            spots: 10,
            environment: 'saltwater'
        },
        'mountain_streams': {
            name: 'Mountain Streams',
            description: 'Crystal clear mountain waters with wild trout',
            difficulty: 4,
            unlockLevel: 10,
            spots: 10,
            environment: 'mountain_freshwater'
        },
        'midnight_lakes': {
            name: 'Midnight Lakes',
            description: 'Mystical waters where reality bends',
            difficulty: 5,
            unlockLevel: 15,
            spots: 10,
            environment: 'mystical_freshwater'
        },
        'championship_waters': {
            name: 'Championship Waters',
            description: 'Elite tournament grounds for master anglers',
            difficulty: 6,
            unlockLevel: 20,
            spots: 10,
            environment: 'tournament_waters'
        }
    };
} 
