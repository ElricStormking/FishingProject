# Assistant Sophie Dialog Script

::START

**Assistant Sophie:** "Oh my! A new angler! I'm Sophie, and I absolutely love helping people discover the perfect fishing spots!"

+ "What makes you so excited about fishing?" -> about_passion
+ "Can you recommend some good spots?" -> fishing_spots
+ "You seem very energetic!" -> personality_comment
+ "I'm just looking around" -> casual_browse

::about_passion

**Assistant Sophie:** "Fishing is like... like a treasure hunt! Every cast could bring up something amazing!"

@call romance_meter_increase {"npc": "sophie", "amount": 3}

"I've been studying fish behavior for three years now. Did you know that some fish can actually recognize human faces?"

+ "That's fascinating! Tell me more" -> fish_facts
+ "You're really knowledgeable" -> compliment_knowledge
+ "I never thought about it that way" -> new_perspective

::fish_facts

**Assistant Sophie:** "Oh, you want to hear more? *eyes light up* Well, did you know that bass can remember lures they've seen before?"

@call romance_meter_increase {"npc": "sophie", "amount": 8}

"That's why I always recommend switching up your approach! Variety is the spice of fishing!"

@call quest_update {"quest": "fish_knowledge", "progress": 1}

+ "You're amazing at this!" -> praise_expertise
+ "What other secrets do you know?" -> more_secrets
+ "I should try different lures then" -> practical_application

::compliment_knowledge

**Assistant Sophie:** "*blushes* Oh, thank you! I just... I really love what I do, you know?"

@call romance_meter_increase {"npc": "sophie", "amount": 12}

"Most people think I'm too enthusiastic, but fishing is just so... magical!"

+ "I think your enthusiasm is wonderful" -> romantic_response
+ "Passion is attractive" -> flirty_response
+ "It's nice to meet someone who cares" -> supportive_response

::romantic_response

**Assistant Sophie:** "*heart flutters* Really? You... you don't think I'm too much?"

@call romance_meter_increase {"npc": "sophie", "amount": 15}
@call quest_unlock {"quest": "sophie_confidence"}

"Maybe... maybe we could go fishing together sometime? I know this secret cove where the sunset is just breathtaking!"

+ "I'd love to watch the sunset with you" -> date_accepted
+ "That sounds like a perfect date" -> date_romantic
+ "Maybe another time" -> date_postponed

::fishing_spots

**Assistant Sophie:** "Oh! *claps hands excitedly* I have the BEST recommendations!"

"For beginners, the shallow areas near the dock are perfect. But if you're feeling adventurous..."

@call romance_meter_increase {"npc": "sophie", "amount": 5}

+ "I'm definitely feeling adventurous" -> adventurous_spots
+ "Let's start with beginner areas" -> safe_spots
+ "What would you recommend for me specifically?" -> personal_recommendation

::adventurous_spots

**Assistant Sophie:** "Ooh, I like your spirit! There's this hidden lagoon about twenty minutes by boat..."

@call romance_meter_increase {"npc": "sophie", "amount": 10}
@call quest_unlock {"quest": "hidden_lagoon"}

"The fish there are bigger, but they're also smarter. You'll need patience and... maybe a guide who knows the area?"

*winks playfully*

+ "Are you offering to be my guide?" -> guide_offer
+ "I'd love to explore with you" -> exploration_together
+ "Sounds challenging, I'm in!" -> accept_challenge

::personality_comment

**Assistant Sophie:** "*giggles* I get that a lot! My friends say I have too much energy, but life's too short to be boring!"

@call romance_meter_increase {"npc": "sophie", "amount": 6}

"Besides, when you love what you do, how can you not be excited about it?"

+ "Your energy is infectious" -> positive_energy
+ "I wish I had your enthusiasm" -> admire_trait
+ "You seem like fun to be around" -> social_interest

::date_accepted

**Assistant Sophie:** "*practically bouncing with joy* Really?! Oh, this is going to be wonderful!"

@call romance_meter_increase {"npc": "sophie", "amount": 20}
@call quest_unlock {"quest": "sunset_date_sophie"}
@call achievement_unlock {"achievement": "first_date_sophie"}

"I'll pack a picnic basket! And I know exactly which lures work best at sunset. It's going to be perfect!"

+ "I can't wait" -> excited_response
+ "You're adorable when you're excited" -> cute_comment

::guide_offer

**Assistant Sophie:** "*eyes sparkling* I thought you'd never ask! I'd love to show you around!"

@call romance_meter_increase {"npc": "sophie", "amount": 18}
@call quest_unlock {"quest": "sophie_guide_service"}

"I know every rock, every current, every fish hiding spot in that lagoon. With me as your guide, you'll catch something amazing for sure!"

+ "It's a deal!" -> accept_guide
+ "What's your guiding fee?" -> business_question
+ "I'd love to spend time with you" -> personal_interest

::casual_browse

**Assistant Sophie:** "Oh, of course! Feel free to look around. But if you change your mind and want to chat, I'll be right here!"

@call romance_meter_increase {"npc": "sophie", "amount": 1}

"I love meeting new people, especially fellow fishing enthusiasts!"

+ "Actually, I'd like to know more about you" -> about_sophie
+ "What's the most interesting fish you've seen?" -> interesting_fish
+ "Thanks, I'll keep that in mind" -> polite_exit

::about_sophie

**Assistant Sophie:** "Me? Oh! Well, I grew up by the ocean. My grandfather taught me to fish when I was just five years old!"

@call romance_meter_increase {"npc": "sophie", "amount": 7}

"He used to say that the sea tells stories to those who listen carefully. I've been listening ever since!"

+ "Your grandfather sounds wise" -> grandfather_wisdom
+ "Do you still fish with him?" -> family_question
+ "What stories has the sea told you?" -> sea_stories

::equipment_recommendation

**Assistant Sophie:** "Oh! For someone with your... *looks you up and down appraisingly* ...potential, I'd recommend starting with our Precision Cast rod!"

@call inventory_add {"item": "precision_rod", "quantity": 1}
@call romance_meter_increase {"npc": "sophie", "amount": 8}

"It's got just the right balance of power and finesse. Perfect for learning proper technique!"

+ "Thanks for the recommendation!" -> grateful_response
+ "You have a good eye for equipment" -> compliment_expertise
+ "Will you teach me proper technique?" -> lesson_request

::main_menu

+ "Tell me more about fishing spots" -> fishing_spots
+ "I'd like to know more about you" -> about_sophie
+ "Do you have equipment recommendations?" -> equipment_recommendation
+ "I should get going" -> goodbye

::goodbye

**Assistant Sophie:** "Aww, leaving so soon? Well, come back anytime! I'll be here, probably still talking about fish!"

*waves enthusiastically*

@call dialog_end

::END 