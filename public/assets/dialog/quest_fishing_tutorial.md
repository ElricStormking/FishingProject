# Fishing Tutorial Quest Dialog

::START

**Fishing Instructor:** "Welcome to your first fishing lesson! I'm here to teach you the basics of angling."

"Are you ready to learn the art of fishing?"

+ "Yes, I'm ready to learn!" -> eager_student
+ "What will you teach me?" -> ask_curriculum
+ "I think I know the basics already" -> experienced_claim
+ "Maybe later" -> postpone_lesson

::eager_student

**Fishing Instructor:** "Excellent attitude! That's the first step to becoming a great angler."

@call romance_meter_increase {"npc": "instructor", "amount": 5}
@call quest_update {"quest": "fishing_tutorial", "progress": 1}

"Let's start with the fundamentals. First, you need to understand your equipment."

+ "Tell me about rods" -> rod_lesson
+ "What about bait and lures?" -> bait_lesson
+ "How do I cast properly?" -> casting_lesson

::ask_curriculum

**Fishing Instructor:** "Great question! We'll cover equipment, casting technique, reading the water, and fish behavior."

@call quest_update {"quest": "fishing_tutorial", "progress": 1}

"By the end of this lesson, you'll have all the knowledge you need to catch your first fish!"

+ "That sounds comprehensive" -> appreciate_thoroughness
+ "Let's get started then" -> begin_lessons
+ "How long will this take?" -> time_question

::experienced_claim

**Fishing Instructor:** "Oh? Well, let's see what you know. Can you tell me the three main types of fishing rods?"

+ "Spinning, baitcasting, and fly rods" -> correct_answer
+ "Light, medium, and heavy rods" -> partial_answer
+ "Uh... fishing rods are fishing rods?" -> wrong_answer

::correct_answer

**Fishing Instructor:** "Impressive! You do know your equipment. But there's always more to learn."

@call romance_meter_increase {"npc": "instructor", "amount": 8}
@call quest_update {"quest": "fishing_tutorial", "progress": 2}
@call achievement_unlock {"achievement": "fishing_knowledge"}

"Let me teach you some advanced techniques that most beginners don't know."

+ "I'd love to learn advanced techniques" -> advanced_lessons
+ "What's the most important tip?" -> key_advice

::rod_lesson

**Fishing Instructor:** "Rods are your primary tool. Length affects casting distance, while action determines sensitivity."

@call quest_update {"quest": "fishing_tutorial", "progress": 2}

"A good rod should feel like an extension of your arm. Here, try this one."

@call inventory_add {"item": "tutorial_rod", "quantity": 1}

+ "This feels nice and balanced" -> good_feel
+ "It's heavier than I expected" -> weight_comment
+ "What's the difference in rod actions?" -> action_question

::bait_lesson

**Fishing Instructor:** "Bait and lures are what attract the fish. Live bait is natural, but lures can be more versatile."

@call quest_update {"quest": "fishing_tutorial", "progress": 2}

"The key is matching your bait to the fish you're targeting and the conditions."

+ "How do I know what fish want?" -> fish_preferences
+ "Can you give me some starter bait?" -> request_bait
+ "What's your favorite lure?" -> personal_preference

::casting_lesson

**Fishing Instructor:** "Casting is an art form. It's not about strength - it's about timing and technique."

@call quest_update {"quest": "fishing_tutorial", "progress": 2}

"Watch my demonstration, then try it yourself."

*demonstrates a perfect cast*

+ "That looked effortless!" -> admire_technique
+ "Can I try now?" -> eager_practice
+ "What if I mess up?" -> worried_about_failure

::practical_test

**Fishing Instructor:** "Now for the real test. Let's see you catch your first fish using what you've learned."

@call quest_update {"quest": "fishing_tutorial", "progress": 3}

"Remember: patience, technique, and respect for the fish. Good luck!"

+ "I'm ready for the challenge" -> accept_test
+ "What if I don't catch anything?" -> fear_failure
+ "Any last-minute tips?" -> final_advice

::tutorial_complete

**Fishing Instructor:** "Congratulations! You've successfully completed your fishing tutorial."

@call quest_complete {"quest": "fishing_tutorial"}
@call achievement_unlock {"achievement": "first_lesson_complete"}
@call romance_meter_increase {"npc": "instructor", "amount": 15}

"You're now ready to explore the waters on your own. Remember what you've learned!"

@call inventory_add {"item": "fishing_license", "quantity": 1}
@call inventory_add {"item": "starter_tackle_box", "quantity": 1}

+ "Thank you for the excellent lesson!" -> grateful_farewell
+ "Will I see you again?" -> future_meetings
+ "I feel ready to fish anywhere now!" -> confident_graduate

::advanced_lessons

**Fishing Instructor:** "Excellent! Let me teach you about reading water currents and fish behavior patterns."

@call quest_unlock {"quest": "advanced_fishing_techniques"}
@call romance_meter_increase {"npc": "instructor", "amount": 12}

"These techniques will set you apart from casual anglers."

+ "I'm all ears" -> attentive_student
+ "This is exactly what I wanted to learn" -> perfect_match

::main_menu

+ "Can you teach me about equipment?" -> rod_lesson
+ "I want to learn casting technique" -> casting_lesson
+ "Tell me about bait selection" -> bait_lesson
+ "I'm ready for the practical test" -> practical_test
+ "I think I'm done for now" -> end_lesson

::end_lesson

**Fishing Instructor:** "Remember, fishing is a lifelong journey of learning. Come back anytime you want to improve your skills!"

@call dialog_end

::END 