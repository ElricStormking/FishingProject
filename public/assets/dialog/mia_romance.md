# Mia Romance Dialog Script

::START

**Bikini Assistant Mia:** "Oh! You want to chat with me? *blushes slightly* I'd love that! The cabin feels so cozy and intimate, doesn't it?"

*adjusts her bikini and sits down comfortably*

+ "You look beautiful in this lighting" -> romantic_compliment
+ "Tell me more about yourself" -> personal_conversation
+ "I enjoy spending time with you" -> affection_expression
+ "What do you like to do for fun?" -> casual_chat

::romantic_compliment

**Bikini Assistant Mia:** "*face lights up with a warm blush* Oh my! You really think so? The golden lantern light does make everything feel so... romantic."

@call romance_meter_increase {"npc": "mia", "amount": 8}

*moves a little closer, her eyes sparkling*

"You know, I've been hoping you'd notice me like this. Being here alone with you makes my heart flutter."

+ "I've been noticing you more and more" -> deeper_romantic
+ "You have such a beautiful smile" -> compliment_smile
+ "Would you like to sit closer?" -> physical_closeness
+ "You're special to me, Mia" -> emotional_connection

::personal_conversation

**Bikini Assistant Mia:** "About me? *giggles softly* Well, I love the ocean, obviously! But I also love quiet moments like this."

@call romance_meter_increase {"npc": "mia", "amount": 5}

"When I'm not helping with fishing, I like to watch the sunset from the deck. Sometimes I imagine sharing those moments with someone special..."

*looks at you meaningfully*

+ "I'd love to watch sunsets with you" -> sunset_romance
+ "What else do you dream about?" -> dreams_conversation
+ "You seem like a romantic person" -> romantic_nature
+ "I find you fascinating" -> fascination_response

::affection_expression

**Bikini Assistant Mia:** "*heart visibly melts* Really? That means so much to me! I feel the same way about you."

@call romance_meter_increase {"npc": "mia", "amount": 10}

"Every time you come to the cabin, I get these butterflies in my stomach. I keep hoping you'll want to spend more time together."

*reaches out and gently touches your hand*

+ "I get butterflies too when I see you" -> mutual_attraction
+ "I want to spend much more time with you" -> commitment_hint
+ "Your touch feels so warm" -> physical_appreciation
+ "You make me happy, Mia" -> happiness_sharing

::casual_chat

**Bikini Assistant Mia:** "For fun? *thinks thoughtfully* I love swimming in the moonlight, collecting seashells, and... well, daydreaming about romance!"

@call romance_meter_increase {"npc": "mia", "amount": 4}

"I also enjoy reading romance novels in the cabin. There's something about love stories that just makes my heart sing!"

+ "Maybe we could swim together sometime" -> swimming_date
+ "I'd love to hear about your favorite romance stories" -> romance_stories
+ "You're quite the romantic, aren't you?" -> romantic_tease
+ "What kind of romance do you dream about?" -> romance_dreams

::deeper_romantic

**Bikini Assistant Mia:** "*eyes become dreamy* You have? Oh, that makes me so happy! I was worried you might just see me as your fishing assistant."

@call romance_meter_increase {"npc": "mia", "amount": 12}

"But I'm so much more than that, aren't I? I'm a woman with feelings, with desires... with a heart that's been hoping you'd see me this way."

*leans in closer, her voice becoming softer*

+ "I see all of you, Mia - and I like what I see" -> full_acceptance
+ "You're definitely more than just an assistant to me" -> relationship_acknowledgment
+ "I've been thinking about you a lot lately" -> confession_thoughts
+ "Kiss her gently" -> first_kiss

::sunset_romance

**Bikini Assistant Mia:** "*gasps with delight* Really? Oh, that would be like a dream come true!"

@call romance_meter_increase {"npc": "mia", "amount": 8}

"I know the perfect spot on the upper deck. We could bring some wine, maybe some strawberries... just the two of us watching the sky turn all those beautiful colors."

*eyes sparkling with excitement*

+ "That sounds incredibly romantic" -> romantic_planning
+ "I'd love to feed you strawberries" -> intimate_feeding
+ "Just the two of us sounds perfect" -> alone_together
+ "When can we do this?" -> eager_planning

::mutual_attraction

**Bikini Assistant Mia:** "*breathes softly* You do? Oh, that makes me feel so... alive!"

@call romance_meter_increase {"npc": "mia", "amount": 12}

"I was so worried it was just me feeling this electric connection between us. But knowing you feel it too..."

*moves even closer, her eyes locked on yours*

"It makes me want to do something bold, something I've never done before."

+ "What do you want to do?" -> bold_question
+ "I feel that electricity too" -> electric_confirmation
+ "Be bold with me, Mia" -> encourage_boldness
+ "Kiss me" -> direct_kiss_request

::first_kiss

**Bikini Assistant Mia:** "*closes her eyes and leans in, lips slightly parted*"

@call romance_meter_increase {"npc": "mia", "amount": 20}
@call achievement_unlock {"achievement": "first_kiss_mia"}

*The kiss is soft, sweet, and filled with all the longing that has been building between you. When you part, she's breathless*

"Oh my... that was... that was perfect. My first kiss in the cabin, with you..."

*touches her lips in wonder*

+ "I've been wanting to do that for so long" -> kiss_longing
+ "You taste like sunshine and sea salt" -> kiss_taste
+ "I want to kiss you again" -> more_kisses
+ "That was magical" -> magical_moment

::kiss_longing

**Bikini Assistant Mia:** "*eyes fill with tears of joy* You have? Oh, knowing that makes it even more special!"

@call romance_meter_increase {"npc": "mia", "amount": 15}

"I've been dreaming about our first kiss for weeks. I imagined it would be perfect, but this... this was beyond my wildest dreams."

*cups your face tenderly*

+ "Every moment with you is beyond dreams" -> beyond_dreams
+ "I want to make all your dreams come true" -> dreams_true
+ "You're everything I've ever wanted" -> everything_wanted
+ "I love you, Mia" -> love_confession

::love_confession

**Bikini Assistant Mia:** "*gasps and throws her arms around you* You love me? You really love me?"

@call romance_meter_increase {"npc": "mia", "amount": 25}
@call achievement_unlock {"achievement": "mia_love_confession"}

"I love you too! Oh, I love you so much it sometimes hurts! I've been hoping and praying you might feel the same way!"

*kisses you passionately*

"This is the happiest moment of my life!"

+ "You're my everything, Mia" -> everything_declaration
+ "I want to be with you forever" -> forever_together
+ "You make me complete" -> completion_love
+ "Let's start our life together" -> life_together

::goodbye

**Bikini Assistant Mia:** "Thank you for such a wonderful conversation! My heart is so full of happiness right now."

*gives you a warm, lingering hug*

"I'll be thinking about everything we talked about... and dreaming about you tonight."

@call romance_meter_increase {"npc": "mia", "amount": 3}
@call dialog_end

::END