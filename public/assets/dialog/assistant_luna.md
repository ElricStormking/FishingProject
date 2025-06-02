# Assistant Luna Dialog Script

::START

**Assistant Luna:** "Welcome, traveler. I am Luna. The waters here hold many secrets... if you know how to listen."

*speaks in a soft, mysterious voice*

+ "What kind of secrets?" -> water_secrets
+ "You seem... different from other assistants" -> mysterious_nature
+ "Can you help me with fishing?" -> fishing_help
+ "Just browsing, thanks" -> polite_distance

::water_secrets

**Assistant Luna:** "The ocean remembers everything. Every fish that swims, every lure that's cast... every heart that yearns for something more."

@call romance_meter_increase {"npc": "luna", "amount": 4}

*gazes thoughtfully at the water*

"Some say I can predict where the fish will bite. Others think it's just intuition. What do you believe?"

+ "I believe in intuition" -> intuition_belief
+ "You seem to have a gift" -> acknowledge_gift
+ "Prove it to me" -> challenge_prediction
+ "That's... interesting" -> neutral_response

::intuition_belief

**Assistant Luna:** "*smiles mysteriously* A kindred spirit. Most people need proof for everything they cannot see."

@call romance_meter_increase {"npc": "luna", "amount": 12}

"The fish respond to energy, to intention. When you cast with purpose, with respect for the water... they know."

@call quest_unlock {"quest": "luna_teachings"}

+ "Will you teach me this way?" -> request_teaching
+ "I want to understand more" -> deeper_understanding
+ "You're fascinating" -> personal_interest

::mysterious_nature

**Assistant Luna:** "Different? Perhaps. I've always felt more connected to the water than to... conventional things."

@call romance_meter_increase {"npc": "luna", "amount": 6}

"While others talk about equipment and technique, I listen to the rhythm of the tides, the whispers of the wind."

+ "That sounds poetic" -> appreciate_poetry
+ "You're quite unique" -> uniqueness_comment
+ "I'd like to learn your perspective" -> learn_perspective

::fishing_help

**Assistant Luna:** "Of course. But my help comes in a different form than what you might expect."

*moves closer, speaking softly*

@call romance_meter_increase {"npc": "luna", "amount": 5}

"I don't just recommend equipment. I help you understand the soul of fishing."

+ "The soul of fishing?" -> soul_concept
+ "I'm intrigued" -> show_interest
+ "That sounds deep" -> acknowledge_depth

::soul_concept

**Assistant Luna:** "Every cast is a conversation with the water. Every fish is a teacher. Every moment of patience is a step toward understanding."

@call romance_meter_increase {"npc": "luna", "amount": 10}
@call quest_update {"quest": "philosophical_fishing", "progress": 1}

"When you fish with soul, you don't just catch fish... you catch glimpses of something eternal."

+ "You speak like a poet" -> poet_comparison
+ "I want to fish with soul" -> embrace_philosophy
+ "That's beautiful" -> appreciate_beauty

::request_teaching

**Assistant Luna:** "*eyes light up with quiet intensity* You truly wish to learn the old ways?"

@call romance_meter_increase {"npc": "luna", "amount": 15}

"Meet me at the pier when the moon is full. I'll show you how to read the water's moods, how to become one with the current."

@call quest_unlock {"quest": "moonlight_lesson"}

+ "I'll be there" -> accept_lesson
+ "Under the moonlight? How romantic..." -> romantic_implication
+ "The old ways?" -> ask_about_tradition

::romantic_implication

**Assistant Luna:** "*blushes softly, a rare smile crossing her lips* Perhaps... there is magic in moonlight that goes beyond fishing."

@call romance_meter_increase {"npc": "luna", "amount": 18}
@call quest_unlock {"quest": "moonlight_romance"}

"The water reflects not just the moon, but the hearts of those who stand beside it."

+ "I'd love to share that magic with you" -> romantic_acceptance
+ "You're enchanting" -> direct_compliment
+ "Moonlight suits you" -> poetic_compliment

::acknowledge_gift

**Assistant Luna:** "A gift... or perhaps a curse. To see patterns others cannot, to feel the water's emotions..."

@call romance_meter_increase {"npc": "luna", "amount": 8}

"Sometimes I wonder if the fish speak to me, or if I'm simply listening to echoes of my own longing."

+ "What do you long for?" -> personal_question
+ "I think it's definitely a gift" -> reassurance
+ "Maybe I could help you understand" -> offer_support

::personal_question

**Assistant Luna:** "*looks directly into your eyes* Connection. Understanding. Someone who sees the world as more than just... surface."

@call romance_meter_increase {"npc": "luna", "amount": 20}

"Most people look at water and see only water. But you... I sense you might see deeper."

+ "I see depths in you too" -> mutual_recognition
+ "I want to explore those depths with you" -> romantic_exploration
+ "You're not alone anymore" -> emotional_support

::challenge_prediction

**Assistant Luna:** "*raises an eyebrow with amused confidence* A skeptic. Very well."

*closes eyes briefly, then points to a specific spot in the water*

"Cast there. Use a silver lure. You'll catch something within three casts."

@call quest_unlock {"quest": "luna_prediction_test"}

+ "If you're right, I'll believe" -> accept_challenge
+ "And if you're wrong?" -> question_consequences
+ "You're very confident" -> admire_confidence

::moonlight_lesson

**Assistant Luna:** "Under moonlight, the water becomes a mirror of souls. Fish are drawn not just to bait, but to the angler's true nature."

@call romance_meter_increase {"npc": "luna", "amount": 14}
@call achievement_unlock {"achievement": "luna_student"}

"Tonight, I'll teach you to fish with your heart, not just your hands."

+ "I'm ready to learn" -> eager_student
+ "Will we be alone?" -> intimate_question
+ "This feels special" -> acknowledge_moment

::equipment_mystical

**Assistant Luna:** "Equipment? *smiles mysteriously* The most important tool is not in any shop."

*taps her chest gently*

"But if you must have conventional gear, choose something that feels right in your hands. The rod should be an extension of your spirit."

@call romance_meter_increase {"npc": "luna", "amount": 7}

+ "How do I know what feels right?" -> spiritual_guidance
+ "You make everything sound magical" -> magic_comment
+ "I trust your judgment" -> show_trust

::main_menu

+ "Tell me more about the water's secrets" -> water_secrets
+ "I want to understand your perspective" -> mysterious_nature
+ "Can you recommend equipment?" -> equipment_mystical
+ "I should go for now" -> goodbye

::goodbye

**Assistant Luna:** "The water will remember you came here. And perhaps... so will I."

*watches you with thoughtful eyes*

"May your lines be tight and your heart be open."

@call dialog_end

::END 