# Sample Bikini Assistant Dialog Script

::START

**Assistant Mia:** "Welcome to the dock! I'm Mia, your fishing assistant. How can I help you today?"

+ "Tell me about fishing here" -> about_fishing
+ "I'd like to know more about you" -> about_assistant  
+ "Nothing right now, thanks" -> goodbye

::about_fishing

**Assistant Mia:** "The waters here are perfect for beginners! We have bass, trout, and perch that are quite friendly to new anglers."

"I can help you choose the right bait and equipment based on what you're trying to catch."

+ "What equipment do you recommend?" -> equipment_advice
+ "Tell me about the fish here" -> fish_info
+ "That's helpful, thank you" -> main_menu

::about_assistant

**Assistant Mia:** "I've been working at this dock for two years now. I love helping people discover the joy of fishing!"

@call romance_meter_increase {"npc": "mia", "amount": 5}

"There's something magical about being out on the water, don't you think?"

+ "I agree, it's very peaceful" -> romantic_response
+ "It's nice, I suppose" -> neutral_response
+ "I'm just here to fish" -> cold_response

::romantic_response

**Assistant Mia:** "I'm so glad you understand! Maybe we could fish together sometime..."

@call romance_meter_increase {"npc": "mia", "amount": 10}
@call quest_update {"quest": "assistant_friendship", "progress": 1}

+ "I'd love that" -> plan_date
+ "Maybe another time" -> main_menu

::neutral_response

**Assistant Mia:** "Of course! Well, if you need any help, just let me know."

@call romance_meter_increase {"npc": "mia", "amount": 2}

+ "I will, thanks" -> main_menu

::cold_response

**Assistant Mia:** "Oh... of course. Well, I'm here if you need fishing advice."

+ "Right, thanks" -> main_menu

::equipment_advice

**Assistant Mia:** "For beginners, I recommend starting with our basic rod and reel combo. It's forgiving but effective!"

"If you're feeling adventurous, the medium tackle can handle bigger fish, but they fight harder."

+ "I'll take the basic setup" -> equipment_basic
+ "Give me the challenge rod" -> equipment_medium
+ "Let me think about it" -> main_menu

::fish_info

**Assistant Mia:** "The bass here are quite active in the morning and evening. Trout prefer cooler weather, and perch are pretty much always hungry!"

@call achievement_check {"achievement": "fish_knowledge_seeker"}

+ "Thanks for the tips!" -> main_menu
+ "Any secret spots?" -> secret_spots

::secret_spots

**Assistant Mia:** "Well... there is one spot near the old pier where the big ones hide, but don't tell everyone!"

@call romance_meter_increase {"npc": "mia", "amount": 8}
@call quest_unlock {"quest": "secret_fishing_spot"}

+ "Your secret is safe with me" -> main_menu

::plan_date

**Assistant Mia:** "Really? How about tomorrow at sunrise? The fish are most active then!"

@call romance_meter_increase {"npc": "mia", "amount": 15}
@call quest_unlock {"quest": "date_with_mia"}

+ "It's a date!" -> date_confirmed
+ "I'll let you know" -> main_menu

::date_confirmed

**Assistant Mia:** "Wonderful! I'll bring some special bait I've been saving. See you at dawn!"

@call achievement_unlock {"achievement": "first_date"}

::main_menu

+ "Can you tell me about fishing again?" -> about_fishing
+ "I'd like to know more about you" -> about_assistant
+ "I should get going" -> goodbye

::equipment_basic

**Assistant Mia:** "Great choice! This setup will serve you well. Here's everything you need."

@call inventory_add {"item": "basic_rod", "quantity": 1}
@call inventory_add {"item": "basic_reel", "quantity": 1}
@call inventory_add {"item": "basic_line", "quantity": 1}

+ "Thanks!" -> main_menu

::equipment_medium

**Assistant Mia:** "Brave choice! This gear can handle some serious fish. Good luck out there!"

@call inventory_add {"item": "medium_rod", "quantity": 1}
@call inventory_add {"item": "medium_reel", "quantity": 1}
@call inventory_add {"item": "strong_line", "quantity": 1}

@call romance_meter_increase {"npc": "mia", "amount": 5}

+ "I'm ready for the challenge!" -> main_menu

::goodbye

**Assistant Mia:** "Have a wonderful day fishing! Come back anytime you need help!"

@call dialog_end

::END 