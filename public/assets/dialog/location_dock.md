# Dock Location Dialog

::START

**Dock Information:** "Welcome to Beginner's Dock - the perfect place to start your fishing journey!"

"What would you like to know about this location?"

+ "What fish can I catch here?" -> local_fish
+ "Any fishing tips for this area?" -> fishing_tips
+ "Tell me about the dock facilities" -> facilities_info
+ "What's the best time to fish here?" -> timing_advice

::local_fish

**Dock Information:** "This dock is home to some wonderful beginner-friendly fish!"

"You'll commonly find Bass, Bluegill, and Catfish in these waters. They're perfect for learning basic techniques."

@call quest_update {"quest": "location_knowledge", "progress": 1}

+ "What's special about Bass?" -> bass_info
+ "Tell me about Bluegill" -> bluegill_info
+ "How do I catch Catfish?" -> catfish_info
+ "Any rare fish here?" -> rare_fish_question

::bass_info

**Dock Information:** "Bass are aggressive predators! They love lures that mimic small fish or frogs."

"Try using spinnerbaits or plastic worms near the dock pilings. Bass like to ambush prey from cover."

@call achievement_unlock {"achievement": "bass_knowledge"}

+ "What's the best lure color?" -> lure_color_advice
+ "Where exactly should I cast?" -> casting_spots
+ "When are Bass most active?" -> bass_timing

::fishing_tips

**Dock Information:** "Here are some essential tips for dock fishing:"

"Cast near the pilings and structures - fish love cover! Also, early morning and evening are prime times."

@call quest_update {"quest": "fishing_wisdom", "progress": 1}

+ "Why do fish like structures?" -> structure_explanation
+ "What about weather conditions?" -> weather_effects
+ "Any equipment recommendations?" -> equipment_advice

::facilities_info

**Dock Information:** "Our dock offers excellent facilities for anglers:"

"We have bait shops, equipment rental, fish cleaning stations, and comfortable seating areas."

+ "Where's the bait shop?" -> bait_shop_location
+ "Can I rent equipment here?" -> rental_info
+ "Are there any guides available?" -> guide_services

::timing_advice

**Dock Information:** "Timing is crucial for successful fishing!"

"Dawn and dusk are magical hours - fish are most active during these 'golden times'."

@call quest_update {"quest": "timing_mastery", "progress": 1}

+ "Why are dawn and dusk better?" -> golden_hour_explanation
+ "What about midday fishing?" -> midday_challenges
+ "Does weather affect timing?" -> weather_timing

::structure_explanation

**Dock Information:** "Fish use structures for protection and hunting!"

"Dock pilings provide shade and attract small baitfish. Predator fish wait nearby to ambush their prey."

@call achievement_unlock {"achievement": "structure_understanding"}

+ "So I should cast near pilings?" -> piling_strategy
+ "What other structures should I look for?" -> other_structures
+ "How close to structures should I cast?" -> casting_distance

::weather_effects

**Dock Information:** "Weather dramatically affects fish behavior!"

"Overcast days are often excellent - fish feel safer and feed more actively. Light rain can also trigger feeding."

+ "What about sunny days?" -> sunny_conditions
+ "How does wind affect fishing?" -> wind_effects
+ "Should I avoid storms?" -> storm_safety

::equipment_advice

**Dock Information:** "For dock fishing, I recommend medium-action rods with 10-12 lb test line."

"This setup handles most dock fish while being forgiving for beginners."

@call inventory_add {"item": "dock_fishing_guide", "quantity": 1}

+ "What about reel recommendations?" -> reel_advice
+ "Best bait for dock fishing?" -> dock_bait
+ "Any tackle box essentials?" -> tackle_essentials

::rare_fish_question

**Dock Information:** "While this is a beginner area, patient anglers sometimes catch surprises!"

"Large Bass, occasional Pike, and even small Muskie have been caught here during optimal conditions."

@call quest_unlock {"quest": "rare_dock_fish"}

+ "How do I catch these rare fish?" -> rare_fish_techniques
+ "When are they most likely to appear?" -> rare_fish_timing
+ "What equipment do I need?" -> rare_fish_equipment

::location_secrets

**Dock Information:** "Want to know a local secret? There's a deep hole about 30 yards out from the main pier."

"That's where the big fish hide during hot summer days. Use deep-diving lures or weighted bait."

@call achievement_unlock {"achievement": "dock_secrets"}
@call quest_unlock {"quest": "secret_fishing_spots"}

+ "How deep is this hole?" -> hole_depth
+ "What's the best way to fish it?" -> hole_technique
+ "Any other secret spots?" -> more_secrets

::main_menu

+ "Tell me about local fish species" -> local_fish
+ "I need fishing tips for this area" -> fishing_tips
+ "What facilities are available?" -> facilities_info
+ "When's the best time to fish?" -> timing_advice
+ "Any local secrets?" -> location_secrets
+ "I'm ready to start fishing" -> start_fishing

::start_fishing

**Dock Information:** "Excellent! Remember: patience, respect for the fish, and enjoy the peaceful experience."

"Good luck, and may your lines be tight!"

@call dialog_end

::END 