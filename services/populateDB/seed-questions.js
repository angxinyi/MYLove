// Quick script to replace all daily questions in Firestore
import { addDoc, collection, deleteDoc, getDocs, doc } from "firebase/firestore";
import { auth, db } from "../../firebase/config";

export async function seedQuestions() {
  if (!auth.currentUser) {
    throw new Error("Must be authenticated");
  }

  console.log("Starting to seed questions from authenticated user...");

  // All your daily questions with categories
  const dailyQuestions = [
    // FOOD QUESTIONS
    { text: "What's your ultimate comfort food?", category: "food" },
    {
      text: "If you could only eat one cuisine for the rest of your life, what would it be?",
      category: "food",
    },
    { text: "Do you prefer sweet or savory snacks?", category: "food" },
    {
      text: "What's your favorite food from your childhood?",
      category: "food",
    },
    {
      text: "Would you rather cook together or order takeout?",
      category: "food",
    },
    {
      text: "What dish have you always wanted to learn how to cook?",
      category: "food",
    },
    { text: "What's the weirdest food you've ever tried?", category: "food" },
    {
      text: "Are there any special food traditions in your culture or family?",
      category: "food",
    },

    // TRAVEL QUESTIONS
    { text: "What's your dream travel destination?", category: "travel" },
    {
      text: "What's your perfect getaway: beach, mountain, or city?",
      category: "travel",
    },
    {
      text: "If we could go on a road trip right now, where would you want to go?",
      category: "travel",
    },
    {
      text: "What's the most memorable trip you've ever taken?",
      category: "travel",
    },
    {
      text: "Would you rather travel for adventure or relaxation?",
      category: "travel",
    },
    {
      text: "Do you prefer planning every detail of trips or being spontaneous?",
      category: "travel",
    },
    {
      text: "What's a country you'd never want to visit again, and why?",
      category: "travel",
    },
    {
      text: "What's one travel tradition you'd want us to create as a couple?",
      category: "travel",
    },

    // RELATIONSHIP QUESTIONS
    { text: "What made you fall in love with me?", category: "relationships" },
    { text: "What's your love language?", category: "relationships" },
    {
      text: "What does a perfect date night look like for you?",
      category: "relationships",
    },
    {
      text: "How do you show love without using words?",
      category: "relationships",
    },
    {
      text: "What's one thing you've learned from being in this relationship?",
      category: "relationships",
    },
    {
      text: "What do you see in our future together?",
      category: "relationships",
    },
    {
      text: "Is there something you've always wanted us to try together but haven't yet?",
      category: "relationships",
    },
    {
      text: "How can I make you feel more appreciated?",
      category: "relationships",
    },

    // PERSONAL GROWTH QUESTIONS
    {
      text: "What's a personal goal you're working on right now?",
      category: "personal_growth",
    },
    {
      text: "What motivates you to keep going during hard times?",
      category: "personal_growth",
    },
    { text: "How do you define success in life?", category: "personal_growth" },
    {
      text: "What values are most important to you in a relationship?",
      category: "personal_growth",
    },
    {
      text: "What's one habit you'd love to break?",
      category: "personal_growth",
    },
    {
      text: "How do you prefer to handle conflict?",
      category: "personal_growth",
    },
    {
      text: "What makes you feel most confident?",
      category: "personal_growth",
    },

    // FUN/RANDOM QUESTIONS
    {
      text: "If you could be any fictional character, who would you be?",
      category: "fun",
    },
    { text: "What's a silly habit or quirk that you have?", category: "fun" },
    {
      text: "Would you rather fight 100 duck-sized horses or one horse-sized duck?",
      category: "fun",
    },

    // ENTERTAINMENT/HOBBIES QUESTIONS
    {
      text: "What game (video, board, or party) do you never get tired of playing?",
      category: "hobbies_fun",
    },
    {
      text: "What's a random skill you'd love to learn?",
      category: "hobbies_fun",
    },
    {
      text: "What's a show or movie you could rewatch forever?",
      category: "hobbies_fun",
    },
    {
      text: "Which celebrity would you want to switch lives with for a day?",
      category: "hobbies_fun",
    },
    {
      text: "What hobby have you always wanted to pick up?",
      category: "hobbies_fun",
    },
    { text: "Do you prefer books, movies, or music?", category: "hobbies_fun" },
    {
      text: "If you could attend any concert or event in history, which would it be?",
      category: "hobbies_fun",
    },
    { text: "What's a song that reminds you of us?", category: "hobbies_fun" },
    {
      text: "What's the most embarrassing thing you've ever done in public?",
      category: "hobbies_fun",
    },
    {
      text: "Who's more likely to survive a zombie apocalypse: you or me?",
      category: "hobbies_fun",
    },

    // FUTURE/LIFESTYLE QUESTIONS
    { text: "What's your ideal weekend like?", category: "lifestyle" },
    {
      text: "Would you rather live in the city, suburbs, or countryside?",
      category: "lifestyle",
    },
    {
      text: "How do you imagine our home looking in 5 years?",
      category: "goals_future",
    },
    {
      text: "What's your dream job if money didn't matter?",
      category: "career",
    },
    {
      text: "How important is having a daily routine to you?",
      category: "lifestyle",
    },

    // DREAMS/FUTURE QUESTIONS
    {
      text: "What does 'a happy life' look like to you?",
      category: "goals_future",
    },
    {
      text: "Where do you see yourself in 5 or 10 years?",
      category: "goals_future",
    },
    {
      text: "What's your biggest dream that you haven't told many people about?",
      category: "goals_future",
    },
    {
      text: "If money wasn't an issue, what would you do for the rest of your life?",
      category: "goals_future",
    },
    {
      text: "Which personal achievement are you most proud of?",
      category: "personal_growth",
    },

    // FAMILY/MEMORIES QUESTIONS
    { text: "What's your favorite childhood memory?", category: "memories" },
    {
      text: "Were you closer to your mom or dad growing up?",
      category: "relationships",
    },
    {
      text: "What family tradition would you like us to carry on?",
      category: "relationships",
    },
    {
      text: "How did your family celebrate holidays when you were young?",
      category: "memories",
    },

    // HEALTH/WELLNESS QUESTIONS
    {
      text: "What's your go-to stress relief activity?",
      category: "health_wellness",
    },
    {
      text: "Do you enjoy working out alone or with a partner?",
      category: "health_wellness",
    },
    {
      text: "What's a healthy habit you're proud of?",
      category: "health_wellness",
    },
    {
      text: "What's your comfort activity when you feel down?",
      category: "health_wellness",
    },

    // FINANCIAL QUESTIONS
    { text: "Are you more of a saver or a spender?", category: "financial" },
    {
      text: "What's your dream purchase if you won the lottery?",
      category: "financial",
    },
    {
      text: "How do you feel about budgeting as a couple?",
      category: "financial",
    },
    {
      text: "Would you rather splurge on experiences or material things?",
      category: "financial",
    },

    // CAREER QUESTIONS
    { text: "What's your ideal work-life balance?", category: "career" },
    { text: "Who is your biggest career inspiration?", category: "career" },
    {
      text: "Would you ever want to start a business together?",
      category: "career",
    },
    {
      text: "What's the best advice you've ever received about work?",
      category: "career",
    },

    // HYPOTHETICAL/WHAT-IF QUESTIONS
    {
      text: "If you could live in any era of history, which one would it be?",
      category: "philosophy",
    },
    {
      text: "If you could switch lives with someone for a day, who would it be?",
      category: "fun",
    },
    {
      text: "What would you do if you woke up as a millionaire tomorrow?",
      category: "financial",
    },
    {
      text: "If we could live anywhere in the world, where would we go?",
      category: "travel",
    },

    // ANIMALS/PETS QUESTIONS
    { text: "What's your favorite animal?", category: "hobbies_fun" },
    {
      text: "If we had a pet, what would you name it?",
      category: "relationships",
    },
    {
      text: "Do you prefer cats, dogs, or something more exotic?",
      category: "hobbies_fun",
    },
    {
      text: "What's the funniest thing you've seen an animal do?",
      category: "fun",
    },

    // HOLIDAYS/CELEBRATIONS QUESTIONS
    {
      text: "What's your favorite holiday and why?",
      category: "values_beliefs",
    },
    {
      text: "Do you like big celebrations or small gatherings?",
      category: "lifestyle",
    },
    {
      text: "How do you feel about cultural festivals?",
      category: "values_beliefs",
    },
    {
      text: "If we could create our own couple's holiday, what would it be like?",
      category: "relationships",
    },

    // SHOPPING QUESTIONS
    {
      text: "Are you an online shopper or do you prefer shopping in stores?",
      category: "lifestyle",
    },
    { text: "What's your guilty-pleasure purchase?", category: "financial" },
    {
      text: "Do you prefer luxury brands or budget finds?",
      category: "financial",
    },
    {
      text: "What's one thing you always spend too much money on?",
      category: "financial",
    },

    // MALAYSIAN CULTURE QUESTIONS
    {
      text: "What's your favorite mamak stall snack or drink?",
      category: "malaysian_culture",
    },
    {
      text: "Have you ever been stuck in a really long traffic jam? How did you pass the time?",
      category: "malaysian_culture",
    },
    {
      text: "Which Malaysian festival do you look forward to the most?",
      category: "malaysian_culture",
    },
    {
      text: "What's your funniest 'Malaysian boleh' moment?",
      category: "malaysian_culture",
    },
    {
      text: "Do you believe in any Malaysian superstitions or ghost stories?",
      category: "malaysian_culture",
    },
    {
      text: "Are you usually punctual, or do you run late like many Malaysians?",
      category: "malaysian_culture",
    },
    {
      text: "How important is family advice in your life?",
      category: "malaysian_culture",
    },
    { text: "What's your go-to karaoke song?", category: "malaysian_culture" },
    {
      text: "Have you ever experienced a situation where Malaysians were exceptionally polite or friendly to you?",
      category: "malaysian_culture",
    },
    {
      text: "Which language do you find easiest to switch between in everyday conversation?",
      category: "malaysian_culture",
    },

    // MALAYSIAN WHAT-IF QUESTIONS
    {
      text: "If you could only eat one Malaysian dish forever, what would it be?",
      category: "malaysian_hypothetical",
    },
    {
      text: "If we were from different Malaysian states, how would that affect our relationship?",
      category: "malaysian_hypothetical",
    },
    {
      text: "If you had to give up either roti canai or nasi lemak for life, which would you choose?",
      category: "malaysian_hypothetical",
    },
    {
      text: "If you could only celebrate one Malaysian festival per year, which one would it be?",
      category: "malaysian_hypothetical",
    },
    {
      text: "If we both got jobs in different Malaysian cities, who would move?",
      category: "malaysian_hypothetical",
    },
    {
      text: "If you could only speak one local language, which would you keep?",
      category: "malaysian_hypothetical",
    },
    {
      text: "If your house was haunted by a pontianak, would you still live there?",
      category: "malaysian_hypothetical",
    },
    {
      text: "If you had to do National Service again as a couple, who would survive better?",
      category: "malaysian_hypothetical",
    },
    {
      text: "If our parents had arranged our marriage, would we still have fallen in love?",
      category: "malaysian_hypothetical",
    },
    {
      text: "If you could only watch either Malay dramas or Tamil movies for life, which would you choose?",
      category: "malaysian_hypothetical",
    },

    // MALAYSIAN SUPERPOWERS QUESTIONS
    {
      text: "If you had the power to summon any Malaysian food instantly, what would you summon first?",
      category: "malaysian_superpowers",
    },
    {
      text: "If your superpower was to clear traffic jams, how often would you use it?",
      category: "malaysian_superpowers",
    },
    {
      text: "If you could understand every Malaysian dialect, how would that change your life?",
      category: "malaysian_superpowers",
    },
    {
      text: "If you had the ability to make it rain durians at will, would you use it?",
      category: "malaysian_superpowers",
    },
    {
      text: "If you could teleport anywhere in Malaysia right now, where would you go?",
      category: "malaysian_superpowers",
    },
    {
      text: "Would you rather have invisibility during Ramadan bazaar shopping or super speed at KLCC?",
      category: "malaysian_superpowers",
    },
    {
      text: "If your power was to skip queues at JPJ or immigration, would you abuse it?",
      category: "malaysian_superpowers",
    },
    {
      text: "If you could instantly switch between Malay, Mandarin, Tamil, and English in any situation, how would you use this power?",
      category: "malaysian_superpowers",
    },
    {
      text: "If your only superpower was unlimited teh tarik, would you consider it a gift or curse?",
      category: "malaysian_superpowers",
    },
    {
      text: "If you could control MySejahtera and fix all the bugs, would you become a national hero?",
      category: "malaysian_superpowers",
    },

    // MALAYSIAN ZOMBIE APOCALYPSE QUESTIONS
    {
      text: "Where in Malaysia would you hide during a zombie apocalypse: jungle, mall, or island?",
      category: "malaysian_zombie",
    },
    {
      text: "If we had to survive using only items from a pasar malam, what would we grab first?",
      category: "malaysian_zombie",
    },
    {
      text: "Would you rather face a hantu raya or a zombie?",
      category: "malaysian_zombie",
    },
    {
      text: "If nasi lemak was the cure to the zombie virus, who would you save first?",
      category: "malaysian_zombie",
    },
    {
      text: "If zombies attacked your favorite mamak stall, would you fight or flee with your maggi goreng?",
      category: "malaysian_zombie",
    },
    {
      text: "Which Malaysian celebrity would you want on your zombie apocalypse team?",
      category: "malaysian_zombie",
    },
    {
      text: "What local vehicle would you escape in: kapcai or Myvi?",
      category: "malaysian_zombie",
    },
    {
      text: "If zombies took over Mid Valley, where would you hide: cinema, bookstore, or food court?",
      category: "malaysian_zombie",
    },
    {
      text: "Would you risk going outside if durian was the only food left?",
      category: "malaysian_zombie",
    },
    {
      text: "If you had to cross the Penang Bridge during a zombie chase, would you drive or swim?",
      category: "malaysian_zombie",
    },
  ];

  // Your choice questions - THIS OR THAT
  const choiceQuestions = [
    // FOOD QUESTIONS
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Coffee",
      choice2: "Tea",
      category: "food",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Sweet",
      choice2: "Savory",
      category: "food",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Pizza",
      choice2: "Pasta",
      category: "food",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Ice cream",
      choice2: "Cake",
      category: "food",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Juice",
      choice2: "Soda",
      category: "food",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Spicy",
      choice2: "Mild",
      category: "food",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Chocolate",
      choice2: "Vanilla",
      category: "food",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Fast food",
      choice2: "Home-cooked",
      category: "food",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Wine",
      choice2: "Beer",
      category: "food",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Breakfast",
      choice2: "Dinner",
      category: "food",
    },

    // TRAVEL QUESTIONS
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Beach",
      choice2: "Mountains",
      category: "travel",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Road trip",
      choice2: "Flight",
      category: "travel",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Local getaway",
      choice2: "International",
      category: "travel",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Sunrise",
      choice2: "Sunset",
      category: "travel",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "City break",
      choice2: "Countryside escape",
      category: "travel",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Airbnb",
      choice2: "Hotel",
      category: "travel",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Adventure trip",
      choice2: "Relaxing vacation",
      category: "travel",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Snow",
      choice2: "Sand",
      category: "travel",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Plan ahead",
      choice2: "Spontaneous",
      category: "travel",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Guided tour",
      choice2: "Solo exploring",
      category: "travel",
    },

    // RELATIONSHIP QUESTIONS
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Hugs",
      choice2: "Kisses",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Texting",
      choice2: "Calling",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Love letters",
      choice2: "Voice notes",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Holding hands",
      choice2: "Arm around",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Surprise dates",
      choice2: "Planned ones",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "PDA",
      choice2: "Private moments",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Stay up late",
      choice2: "Early morning messages",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Watch movies",
      choice2: "Play games together",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Matching outfits",
      choice2: "Subtle coordination",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Flirty",
      choice2: "Romantic",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Romantic dinner",
      choice2: "Cozy movie night",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Holding hands",
      choice2: "Cuddling",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Love letters",
      choice2: "Love songs",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Surprise dates",
      choice2: "Planned dates",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Slow dancing",
      choice2: "Dancing wildly",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Sweet compliments",
      choice2: "Thoughtful gifts",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Long conversations",
      choice2: "Comfortable silence",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Morning kisses",
      choice2: "Goodnight kisses",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Public displays of affection",
      choice2: "Private moments",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Weekend getaway",
      choice2: "Staycation",
      category: "relationships",
    },

    // ENTERTAINMENT/HOBBIES QUESTIONS
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Movies",
      choice2: "TV shows",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Comedy",
      choice2: "Drama",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Horror",
      choice2: "Thriller",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Action",
      choice2: "Romance",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Sci-fi",
      choice2: "Fantasy",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Cartoons",
      choice2: "Anime",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Netflix",
      choice2: "YouTube",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Gaming",
      choice2: "Reading",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Indoor games",
      choice2: "Outdoor games",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Karaoke",
      choice2: "Dancing",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Reading books",
      choice2: "Watching movies",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Playing sports",
      choice2: "Watching sports",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Painting",
      choice2: "Crafting",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Playing video games",
      choice2: "Board games",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Cooking",
      choice2: "Baking",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Solo hobbies",
      choice2: "Group activities",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Collecting things",
      choice2: "Creating things",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Outdoor adventures",
      choice2: "Indoor relaxation",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Learning new languages",
      choice2: "Musical instruments",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Writing stories",
      choice2: "Journaling",
      category: "hobbies_fun",
    },

    // PERSONAL GROWTH QUESTIONS
    {
      type: "this_or_that",
      question: "Which are you more?",
      choice1: "Introvert",
      choice2: "Extrovert",
      category: "personal_growth",
    },
    {
      type: "this_or_that",
      question: "Which are you more?",
      choice1: "Thinker",
      choice2: "Feeler",
      category: "personal_growth",
    },
    {
      type: "this_or_that",
      question: "Which are you more?",
      choice1: "Optimist",
      choice2: "Realist",
      category: "personal_growth",
    },
    {
      type: "this_or_that",
      question: "Which are you more?",
      choice1: "Spontaneous",
      choice2: "Planner",
      category: "personal_growth",
    },
    {
      type: "this_or_that",
      question: "Which are you more?",
      choice1: "Night owl",
      choice2: "Early bird",
      category: "personal_growth",
    },
    {
      type: "this_or_that",
      question: "Which are you more?",
      choice1: "Passive",
      choice2: "Assertive",
      category: "personal_growth",
    },
    {
      type: "this_or_that",
      question: "Which are you more?",
      choice1: "Analytical",
      choice2: "Creative",
      category: "personal_growth",
    },
    {
      type: "this_or_that",
      question: "Which are you more?",
      choice1: "Leader",
      choice2: "Follower",
      category: "personal_growth",
    },
    {
      type: "this_or_that",
      question: "Which are you more?",
      choice1: "Emotional",
      choice2: "Logical",
      category: "personal_growth",
    },
    {
      type: "this_or_that",
      question: "Which are you more?",
      choice1: "Structured",
      choice2: "Flexible",
      category: "personal_growth",
    },

    // HEALTH/WELLNESS QUESTIONS
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Morning shower",
      choice2: "Night shower",
      category: "health_wellness",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Long bath",
      choice2: "Quick shower",
      category: "health_wellness",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Scented candles",
      choice2: "Essential oils",
      category: "health_wellness",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Yoga",
      choice2: "Meditation",
      category: "health_wellness",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Gym",
      choice2: "Home workout",
      category: "health_wellness",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Running",
      choice2: "Walking",
      category: "health_wellness",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Journaling",
      choice2: "Sketching",
      category: "health_wellness",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Meal prep",
      choice2: "Cook daily",
      category: "health_wellness",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Sleep in",
      choice2: "Wake up early",
      category: "health_wellness",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Stay up late",
      choice2: "Go to bed early",
      category: "health_wellness",
    },

    // ANIMALS/PETS QUESTIONS
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Dog",
      choice2: "Cat",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Fish",
      choice2: "Bird",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Wild animals",
      choice2: "Domestic animals",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Big dogs",
      choice2: "Small dogs",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Indoor pets",
      choice2: "Outdoor pets",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Exotic pets",
      choice2: "Common pets",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Pet adoption",
      choice2: "Buying pets",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Walking a dog",
      choice2: "Playing with a cat",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Watching animals",
      choice2: "Reading about them",
      category: "hobbies_fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Petting zoo",
      choice2: "Aquarium",
      category: "hobbies_fun",
    },

    // LIFESTYLE QUESTIONS
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Coffee in the morning",
      choice2: "Tea in the morning",
      category: "lifestyle",
    },
    {
      type: "this_or_that",
      question: "Which are you more?",
      choice1: "Early riser",
      choice2: "Night owl",
      category: "lifestyle",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Making the bed",
      choice2: "Leaving it messy",
      category: "lifestyle",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Shower in the morning",
      choice2: "At night",
      category: "lifestyle",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Planning the day",
      choice2: "Going with the flow",
      category: "lifestyle",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Breakfast",
      choice2: "Skip breakfast",
      category: "lifestyle",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Taking the stairs",
      choice2: "Elevator",
      category: "lifestyle",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Music while working",
      choice2: "Silence while working",
      category: "lifestyle",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Using planner",
      choice2: "Digital calendar",
      category: "lifestyle",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Check phone first thing",
      choice2: "Last thing",
      category: "lifestyle",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Family dinners",
      choice2: "Hanging out with friends",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Group vacations",
      choice2: "One-on-one trips",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Phone calls",
      choice2: "Video chats",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Game night",
      choice2: "Movie night",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Family traditions",
      choice2: "Making new traditions",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Big family gatherings",
      choice2: "Small intimate meetups",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Helping with chores",
      choice2: "Helping with advice",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Childhood friends",
      choice2: "New friends",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Sharing secrets",
      choice2: "Keeping things private",
      category: "relationships",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Birthdays",
      choice2: "Holidays",
      category: "relationships",
    },

    // MEMORIES QUESTIONS
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Favorite childhood game",
      choice2: "Favorite school subject",
      category: "memories",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Playing outside",
      choice2: "Playing video games",
      category: "memories",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Childhood best friend",
      choice2: "Current best friend",
      category: "memories",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Family vacations",
      choice2: "Neighborhood adventures",
      category: "memories",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Favorite toy",
      choice2: "Favorite book as a kid",
      category: "memories",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "School uniforms",
      choice2: "Casual clothes",
      category: "memories",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Birthday parties",
      choice2: "Holiday celebrations",
      category: "memories",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Watching cartoons",
      choice2: "Reading comics",
      category: "memories",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Riding bikes",
      choice2: "Climbing trees",
      category: "memories",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Collecting stickers",
      choice2: "Collecting cards",
      category: "memories",
    },

    // CULTURAL/CELEBRATIONS QUESTIONS
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Big party",
      choice2: "Small gathering",
      category: "values_beliefs",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Traditional food",
      choice2: "Trying new dishes",
      category: "values_beliefs",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Fireworks",
      choice2: "Light shows",
      category: "values_beliefs",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Giving gifts",
      choice2: "Receiving gifts",
      category: "values_beliefs",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Traditional clothes",
      choice2: "Modern clothes",
      category: "values_beliefs",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Family reunion",
      choice2: "Friend reunion",
      category: "values_beliefs",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Holiday decorating",
      choice2: "Holiday cooking",
      category: "values_beliefs",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Religious services",
      choice2: "Celebrating at home",
      category: "values_beliefs",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Cultural dances",
      choice2: "Cultural music",
      category: "values_beliefs",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "New Year's Eve",
      choice2: "New Year's Day",
      category: "values_beliefs",
    },

    // FUN/RANDOM QUESTIONS
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Roller coaster",
      choice2: "Ferris wheel",
      category: "fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Clown",
      choice2: "Magician",
      category: "fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Comedy movie",
      choice2: "Horror movie",
      category: "fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Singing in the shower",
      choice2: "Dancing in the rain",
      category: "fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Bubble bath",
      choice2: "Quick shower",
      category: "fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Ice cream cone",
      choice2: "Snow cone",
      category: "fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Haunted house",
      choice2: "Escape room",
      category: "fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Magic tricks",
      choice2: "Juggling",
      category: "fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Karaoke night",
      choice2: "Game night",
      category: "fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Funny memes",
      choice2: "Cute animal videos",
      category: "fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Pizza party",
      choice2: "Taco night",
      category: "fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Silly hats",
      choice2: "Funky glasses",
      category: "fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Board games",
      choice2: "Video games",
      category: "fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Prank call",
      choice2: "Prank text",
      category: "fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Watching cartoons",
      choice2: "Reading comics",
      category: "fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Chocolate",
      choice2: "Candy",
      category: "fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Charades",
      choice2: "Pictionary",
      category: "fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Bubble wrap popping",
      choice2: "Slime playing",
      category: "fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Outdoor picnic",
      choice2: "Indoor movie marathon",
      category: "fun",
    },
    {
      type: "this_or_that",
      question: "Which do you prefer?",
      choice1: "Making funny faces",
      choice2: "Telling jokes",
      category: "fun",
    },

    // MORE LIKELY QUESTIONS - RELATIONSHIPS
    {
      type: "more_likely",
      question: "Who's more likely to forget an anniversary?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "relationships",
    },
    {
      type: "more_likely",
      question: "Who's more likely to plan a surprise date?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "relationships",
    },
    {
      type: "more_likely",
      question: "Who's more likely to cry at a wedding?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "relationships",
    },
    {
      type: "more_likely",
      question: "Who's more likely to give the best advice?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "relationships",
    },
    {
      type: "more_likely",
      question: "Who's more likely to cry while watching a sad movie?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "relationships",
    },
    {
      type: "more_likely",
      question: "Who's more likely to stay calm in an emergency?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "relationships",
    },
    {
      type: "more_likely",
      question: "Who's more likely to take charge during a crisis?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "relationships",
    },

    // MORE LIKELY QUESTIONS - DAILY HABITS
    {
      type: "more_likely",
      question: "Who's more likely to forget to reply to texts?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "daily_habits",
    },
    {
      type: "more_likely",
      question: "Who's more likely to lose their phone?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "daily_habits",
    },
    {
      type: "more_likely",
      question: "Who's more likely to forget their wallet at home?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "daily_habits",
    },
    {
      type: "more_likely",
      question: "Who's more likely to forget their keys?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "daily_habits",
    },
    {
      type: "more_likely",
      question: "Who's more likely to accidentally sleep through an alarm?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "daily_habits",
    },
    {
      type: "more_likely",
      question: "Who's more likely to spill coffee on themselves?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "daily_habits",
    },
    {
      type: "more_likely",
      question: "Who's more likely to eat dessert before dinner?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "daily_habits",
    },
    {
      type: "more_likely",
      question: "Who's more likely to binge eat snacks late at night?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "daily_habits",
    },

    // MORE LIKELY QUESTIONS - ENTERTAINMENT
    {
      type: "more_likely",
      question: "Who's more likely to binge-watch an entire series in one day?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "entertainment",
    },
    {
      type: "more_likely",
      question: "Who's more likely to stay up all night playing video games?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "entertainment",
    },
    {
      type: "more_likely",
      question: "Who's more likely to win a game night?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "entertainment",
    },
    {
      type: "more_likely",
      question: "Who's more likely to start a spontaneous dance party?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "entertainment",
    },
    {
      type: "more_likely",
      question: "Who's more likely to sing loudly in the car?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "entertainment",
    },

    // MORE LIKELY QUESTIONS - PERSONALITY QUIRKS
    {
      type: "more_likely",
      question: "Who's more likely to make a bad pun?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "personality_quirks",
    },
    {
      type: "more_likely",
      question: "Who's more likely to laugh at a bad joke?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "personality_quirks",
    },
    {
      type: "more_likely",
      question: "Who's more likely to talk to animals?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "personality_quirks",
    },
    {
      type: "more_likely",
      question: "Who's more likely to take selfies in public?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "personality_quirks",
    },
    {
      type: "more_likely",
      question: "Who's more likely to prank their friends?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "personality_quirks",
    },
    {
      type: "more_likely",
      question: "Who's more likely to bring home random souvenirs?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "personality_quirks",
    },

    // MORE LIKELY QUESTIONS - LIFESTYLE
    {
      type: "more_likely",
      question: "Who's more likely to start a new hobby on a whim?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "lifestyle",
    },
    {
      type: "more_likely",
      question: "Who's more likely to adopt a stray animal?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "lifestyle",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to get lost while driving somewhere familiar?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "lifestyle",
    },
    {
      type: "more_likely",
      question: "Who's more likely to burn dinner while cooking?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "lifestyle",
    },

    // MORE LIKELY QUESTIONS - ROMANTIC GESTURES
    {
      type: "more_likely",
      question: "Who's more likely to plan a surprise date night?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "romantic_gestures",
    },
    {
      type: "more_likely",
      question: "Who's more likely to bring home flowers unexpectedly?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "romantic_gestures",
    },
    {
      type: "more_likely",
      question: "Who's more likely to surprise the other with a gift?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "romantic_gestures",
    },
    {
      type: "more_likely",
      question: "Who's more likely to make breakfast in bed?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "romantic_gestures",
    },
    {
      type: "more_likely",
      question: "Who's more likely to plan a romantic picnic?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "romantic_gestures",
    },
    {
      type: "more_likely",
      question: "Who's more likely to plan the perfect birthday surprise?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "romantic_gestures",
    },
    {
      type: "more_likely",
      question: "Who's more likely to plan a weekend getaway?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "romantic_gestures",
    },
    {
      type: "more_likely",
      question: "Who's more likely to make a scrapbook of memories?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "romantic_gestures",
    },
    {
      type: "more_likely",
      question: "Who's more likely to send a good morning message?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "romantic_gestures",
    },
    {
      type: "more_likely",
      question: "Who's more likely to send a random sweet text?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "romantic_gestures",
    },
    {
      type: "more_likely",
      question: "Who's more likely to suggest watching a romantic movie?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "romantic_gestures",
    },

    // MORE LIKELY QUESTIONS - RELATIONSHIP DYNAMICS
    {
      type: "more_likely",
      question: "Who's more likely to forget an important anniversary?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "relationship_dynamics",
    },
    {
      type: "more_likely",
      question: "Who's more likely to say 'I love you' first?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "relationship_dynamics",
    },
    {
      type: "more_likely",
      question: "Who's more likely to start a deep conversation?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "relationship_dynamics",
    },
    {
      type: "more_likely",
      question: "Who's more likely to get jealous?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "relationship_dynamics",
    },
    {
      type: "more_likely",
      question: "Who's more likely to apologize first after a fight?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "relationship_dynamics",
    },
    {
      type: "more_likely",
      question: "Who's more likely to be the bigger flirt?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "relationship_dynamics",
    },
    {
      type: "more_likely",
      question: "Who's more likely to spoil the other with food?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "relationship_dynamics",
    },
    {
      type: "more_likely",
      question: "Who's more likely to steal food off the other's plate?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "relationship_dynamics",
    },

    // MORE LIKELY QUESTIONS - DAILY HABITS EXTENDED
    {
      type: "more_likely",
      question: "Who's more likely to fall asleep during a movie?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "daily_habits_extended",
    },
    {
      type: "more_likely",
      question: "Who's more likely to steal the blanket?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "daily_habits_extended",
    },
    {
      type: "more_likely",
      question: "Who's more likely to laugh during a serious moment?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "daily_habits_extended",
    },
    {
      type: "more_likely",
      question: "Who's more likely to forget where they left their keys?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "daily_habits_extended",
    },
    {
      type: "more_likely",
      question: "Who's more likely to forget to text back?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "daily_habits_extended",
    },
    {
      type: "more_likely",
      question: "Who's more likely to laugh at their own jokes?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "daily_habits_extended",
    },

    // MORE LIKELY QUESTIONS - FUN ACTIVITIES
    {
      type: "more_likely",
      question: "Who's more likely to binge-watch an entire TV show?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "fun_activities",
    },
    {
      type: "more_likely",
      question: "Who's more likely to organize a couple's game night?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "fun_activities",
    },
    {
      type: "more_likely",
      question: "Who's more likely to send a funny meme?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "fun_activities",
    },
    {
      type: "more_likely",
      question: "Who's more likely to start a pillow fight?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "fun_activities",
    },
    {
      type: "more_likely",
      question: "Who's more likely to initiate a cuddle session?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "fun_activities",
    },

    // MORE LIKELY QUESTIONS - MALAYSIAN FOOD CULTURE
    {
      type: "more_likely",
      question:
        "Who's more likely to order nasi lemak for breakfast every day?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_food",
    },
    {
      type: "more_likely",
      question: "Who's more likely to lepak at a mamak until 2am?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_food",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to shout 'Mamak! Teh tarik satu!' without looking at the menu?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_food",
    },
    {
      type: "more_likely",
      question: "Who's more likely to win a durian-eating contest?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_food",
    },
    {
      type: "more_likely",
      question: "Who's more likely to have a stash of Milo at home?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_food",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to eat Maggi goreng more than 3 times a week?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_food",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to take forever deciding what to eat at a hawker center?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_food",
    },
    {
      type: "more_likely",
      question: "Who's more likely to get excited by pasar tani deals?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_food",
    },

    // MORE LIKELY QUESTIONS - MALAYSIAN LIFESTYLE
    {
      type: "more_likely",
      question: "Who's more likely to get excited at a Ramadan bazaar?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_lifestyle",
    },
    {
      type: "more_likely",
      question: "Who's more likely to collect free samples at the mall?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_lifestyle",
    },
    {
      type: "more_likely",
      question: "Who's more likely to hoard Shopee vouchers during 11.11?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_lifestyle",
    },
    {
      type: "more_likely",
      question: "Who's more likely to wait in line for bubble tea at Tealive?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_lifestyle",
    },
    {
      type: "more_likely",
      question: "Who's more likely to own at least 3 Touch 'n Go cards?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_lifestyle",
    },
    {
      type: "more_likely",
      question: "Who's more likely to shop at pasar malam just for fun?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_lifestyle",
    },
    {
      type: "more_likely",
      question: "Who's more likely to buy last-minute baju Raya?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_lifestyle",
    },

    // MORE LIKELY QUESTIONS - MALAYSIAN LANGUAGE & EXPRESSIONS
    {
      type: "more_likely",
      question: "Who's more likely to say 'lah' too often?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_language",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to randomly say 'Where got?!' during an argument?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_language",
    },
    {
      type: "more_likely",
      question: "Who's more likely to use Manglish in serious meetings?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_language",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to shout 'Oiiii!' from across the road to call a friend?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_language",
    },
    {
      type: "more_likely",
      question: "Who's more likely to call their partner 'sayang' in public?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_language",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to complain about the weather—too hot or too rainy?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_language",
    },

    // MORE LIKELY QUESTIONS - MALAYSIAN PLACES & CULTURE
    {
      type: "more_likely",
      question:
        "Who's more likely to be late because of a traffic jam on Federal Highway?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_places",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to forget where they parked at Mid Valley Megamall?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_places",
    },
    {
      type: "more_likely",
      question: "Who's more likely to plan a date at Sunway Lagoon?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_places",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to get caught in the rain without an umbrella in KL?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_places",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to take selfies at Petronas Twin Towers every time?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_places",
    },
    {
      type: "more_likely",
      question: "Who's more likely to get emotional watching a Merdeka Day ad?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_culture",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to attend open house at every relative's home during Raya?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_culture",
    },
    {
      type: "more_likely",
      question: "Who's more likely to jam to Sudirman or P. Ramlee songs?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_culture",
    },
    {
      type: "more_likely",
      question: "Who's more likely to cry during a local drama or telenovela?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "malaysian_culture",
    },

    // MORE LIKELY QUESTIONS - LONG DISTANCE DIGITAL COMMUNICATION
    {
      type: "more_likely",
      question:
        "Who's more likely to fall asleep during a late-night video call?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_digital",
    },
    {
      type: "more_likely",
      question: "Who's more likely to overuse the 🥺 emoji during calls?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_digital",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to send a 'Good morning, sayang!' text every day?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_digital",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to forget the time difference between cities/states?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_digital",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to write long paragraphs just to say 'I miss you'?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_digital",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to screenshot maps to explain directions during a video call?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_digital",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to panic when the other person's Wi-Fi cuts off mid-convo?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_digital",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to fall asleep while on video call and leave the camera running?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_digital",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to initiate random voice notes just to say 'I love you'?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_digital",
    },
    {
      type: "more_likely",
      question: "Who's more likely to stay up past 2am just to chat?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_digital",
    },

    // MORE LIKELY QUESTIONS - LDR ROMANTIC GESTURES
    {
      type: "more_likely",
      question:
        "Who's more likely to send nasi lemak through Grab for a surprise breakfast?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_romantic",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to save screenshots of sweet texts for future mood boosts?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_romantic",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to plan a virtual date night with a movie and teh tarik?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_romantic",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to send food via Foodpanda just to 'eat together'?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_romantic",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to mail handwritten letters or cards through Pos Laju?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_romantic",
    },
    {
      type: "more_likely",
      question: "Who's more likely to send surprise Lazada/Shopee parcels?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_romantic",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to remember every anniversary, even small ones?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_romantic",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to plan matching outfits for the next reunion?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_romantic",
    },

    // MORE LIKELY QUESTIONS - LDR MISSING & LONGING
    {
      type: "more_likely",
      question:
        "Who's more likely to cry first when saying goodbye at the airport?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_missing",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to plan an itinerary for the next visit down to the minute?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_missing",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to suggest watching a local drama together online?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_missing",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to say 'I wish you were here' while eating kuih?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_missing",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to know all the mall opening hours in your city for when they visit?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_missing",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to stalk old messages when they miss the other person?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_missing",
    },
    {
      type: "more_likely",
      question: "Who's more likely to keep track of the number of days apart?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_missing",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to talk about marriage every time you miss each other?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_missing",
    },

    // MORE LIKELY QUESTIONS - LDR CULTURAL & LANGUAGE
    {
      type: "more_likely",
      question:
        "Who's more likely to bring gifts from their hometown (e.g., keropok lekor, dodol)?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_cultural",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to use Google Translate to say 'I miss you' in your dialect?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_cultural",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to use Malaysian slang like 'rindu gila weh' during calls?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_cultural",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to get jealous when you talk about friends of the opposite gender?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "ldr_cultural",
    },

    // MORE LIKELY QUESTIONS - UNIVERSITY ACADEMIC HABITS
    {
      type: "more_likely",
      question:
        "Who's more likely to skip an 8am lecture and blame the weather?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_academic",
    },
    {
      type: "more_likely",
      question: "Who's more likely to panic the night before a final exam?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_academic",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to finish their assignment 5 minutes before the deadline?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_academic",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to rush to print assignments at the last minute?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_academic",
    },
    {
      type: "more_likely",
      question: "Who's more likely to camp outside the exam hall to cram?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_academic",
    },
    {
      type: "more_likely",
      question: "Who's more likely to attend class just for the attendance?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_academic",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to do a group assignment solo because others 'hilang'?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_academic",
    },
    {
      type: "more_likely",
      question: "Who's more likely to use TikTok to revise exam topics?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_academic",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to get caught sleeping in a tutorial session?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_academic",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to send 'pass assignment please' texts at 11:59 PM?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_academic",
    },

    // MORE LIKELY QUESTIONS - UNIVERSITY CAMPUS LIFE
    {
      type: "more_likely",
      question:
        "Who's more likely to eat at the same kedai makan near campus every day?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_campus",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to forget their matrix card and beg the guard at the gate?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_campus",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to be late for class because of the campus shuttle?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_campus",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to fall asleep in the library 'for a quick nap'?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_campus",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to study at a 24-hour Mamak instead of the library?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_campus",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to wear the same baju for 3 classes in a row?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_campus",
    },
    {
      type: "more_likely",
      question: "Who's more likely to oversleep and miss the campus bus?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_campus",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to know every shortcut around the university buildings?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_campus",
    },

    // MORE LIKELY QUESTIONS - UNIVERSITY SOCIAL & CULTURE
    {
      type: "more_likely",
      question:
        "Who's more likely to wear baju kurung or batik on presentation day?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_social",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to go back home every weekend (balik kampung)?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_social",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to use the word 'study group' but never actually study?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_social",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to join too many clubs during orientation week?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_social",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to be the 'class rep' and regret it instantly?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_social",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to join every online contest for free Grab vouchers?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_social",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to organize farewell parties for graduating seniors?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_social",
    },
    {
      type: "more_likely",
      question: "Who's more likely to stalk their crush's class schedule?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_social",
    },

    // MORE LIKELY QUESTIONS - UNIVERSITY SURVIVAL
    {
      type: "more_likely",
      question:
        "Who's more likely to survive on Maggi and Milo for a whole week?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_survival",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to bring back homemade sambal from home after semester break?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_survival",
    },
    {
      type: "more_likely",
      question: "Who's more likely to sneak snacks into the lecture hall?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_survival",
    },
    {
      type: "more_likely",
      question:
        "Who's more likely to become besties with the aunty at the café (makcik kafe)?",
      choice1: "Partner A",
      choice2: "Partner B",
      category: "uni_survival",
    },

    // WOULD YOU RATHER QUESTIONS - SUPERPOWERS & ABILITIES
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Have a rewind button for life",
      choice2: "Have a pause button for life",
      category: "superpowers",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Talk to animals",
      choice2: "Speak every human language",
      category: "superpowers",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Be invisible for a day",
      choice2: "Be able to fly for a day",
      category: "superpowers",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Teleport anywhere",
      choice2: "Read minds",
      category: "superpowers",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Breathe underwater",
      choice2: "Walk through walls",
      category: "superpowers",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Have super strength",
      choice2: "Have super speed",
      category: "superpowers",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Control the weather",
      choice2: "Talk to plants",
      category: "superpowers",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "See 10 minutes into the future",
      choice2: "See 10 years into the future",
      category: "superpowers",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Breathe fire",
      choice2: "Shoot ice from your hands",
      category: "superpowers",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Control fire",
      choice2: "Control water",
      category: "superpowers",
    },

    // WOULD YOU RATHER QUESTIONS - PHYSICAL & BODY
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Have fingers as long as legs",
      choice2: "Have legs as short as fingers",
      category: "physical",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Have a third eye",
      choice2: "Have a third arm",
      category: "physical",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Hair that changes with mood",
      choice2: "Eyes that change color hourly",
      category: "physical",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Nose grows when you lie",
      choice2: "Ears wiggle when nervous",
      category: "physical",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Always have perfect hair",
      choice2: "Always have perfect teeth",
      category: "physical",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Sneeze glitter",
      choice2: "Cough bubbles",
      category: "physical",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Have a tail like a monkey",
      choice2: "Have wings like a bird",
      category: "physical",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Permanent unibrow",
      choice2: "Permanent mullet hairstyle",
      category: "physical",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Always skip instead of walk",
      choice2: "Always crawl instead of walk",
      category: "physical",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Shoes two sizes too big",
      choice2: "Shoes two sizes too small",
      category: "physical",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Jump 10 times higher",
      choice2: "Run 10 times faster",
      category: "physical",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Always hop on one foot",
      choice2: "Always squat when walking",
      category: "physical",
    },

    // WOULD YOU RATHER QUESTIONS - FOOD & EATING
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Eat only sweet foods",
      choice2: "Eat only salty foods",
      category: "food",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Unlimited pizza",
      choice2: "Unlimited ice cream",
      category: "food",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Never have to sleep",
      choice2: "Never have to eat",
      category: "food",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Only green food",
      choice2: "Only blue food",
      category: "food",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Eat with chopsticks only",
      choice2: "Eat with hands only",
      category: "food",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Eat a whole raw onion",
      choice2: "Eat a whole lemon",
      category: "food",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Food that's too spicy",
      choice2: "Food that's too bland",
      category: "food",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Pizza with chocolate sauce",
      choice2: "Ice cream with ketchup",
      category: "food",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Live without caffeine",
      choice2: "Live without sugar",
      category: "food",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Never eat favorite movie again",
      choice2: "Never watch favorite food again",
      category: "food",
    },

    // WOULD YOU RATHER QUESTIONS - LIFESTYLE & LIVING
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Live without music",
      choice2: "Live without movies",
      category: "lifestyle",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "House made of candy",
      choice2: "House made of toys",
      category: "lifestyle",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Live in a treehouse",
      choice2: "Live in a cave",
      category: "lifestyle",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "House with no doors",
      choice2: "House with no windows",
      category: "lifestyle",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Live on the beach",
      choice2: "Live in the mountains",
      category: "lifestyle",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Dream job but no days off",
      choice2: "Easy job with free time",
      category: "lifestyle",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Same outfit every day",
      choice2: "Never repeat an outfit",
      category: "lifestyle",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Never do laundry",
      choice2: "Never wash dishes",
      category: "lifestyle",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Live without TV",
      choice2: "Live without social media",
      category: "lifestyle",
    },

    // WOULD YOU RATHER QUESTIONS - COMMUNICATION & SENSES
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Only whisper",
      choice2: "Only shout",
      category: "communication",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Always sing instead of speak",
      choice2: "Always dance everywhere",
      category: "communication",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Speak all languages",
      choice2: "Play every musical instrument",
      category: "communication",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Live without taste",
      choice2: "Live without smell",
      category: "communication",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Song stuck in head",
      choice2: "Word you can't stop repeating",
      category: "communication",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Always sing everything",
      choice2: "Always dance everywhere",
      category: "communication",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Only whisper",
      choice2: "Only shout",
      category: "communication",
    },

    // WOULD YOU RATHER QUESTIONS - FANTASY & ABSURD
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Have a pet dinosaur",
      choice2: "Have a pet dragon",
      category: "fantasy",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Be stuck with spiders",
      choice2: "Be stuck with snakes",
      category: "fantasy",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Always know the time",
      choice2: "Always have exact change",
      category: "fantasy",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Be a famous singer",
      choice2: "Be a famous actor",
      category: "fantasy",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Only watch comedies",
      choice2: "Only watch horror movies",
      category: "fantasy",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Have a personal robot",
      choice2: "Have a personal chef",
      category: "fantasy",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Wear mismatched socks",
      choice2: "Have different sized shoes",
      category: "fantasy",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Never use internet",
      choice2: "Never take airplanes",
      category: "fantasy",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "World made of LEGO",
      choice2: "World made of candy",
      category: "fantasy",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Rain chocolate world",
      choice2: "Snow marshmallows world",
      category: "fantasy",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Pet elephant",
      choice2: "Pet giraffe",
      category: "fantasy",
    },

    // WOULD YOU RATHER QUESTIONS - SILLY SCENARIOS
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Wear superhero costume",
      choice2: "Wear clown costume",
      category: "silly",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Invisible when no one looks",
      choice2: "Fly as fast as walking",
      category: "silly",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Talking dog",
      choice2: "Talking cat",
      category: "silly",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Never use phone",
      choice2: "Never use computer",
      category: "silly",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Pause TV shows",
      choice2: "Rewind TV shows",
      category: "silly",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Wear roller skates everywhere",
      choice2: "Wear skis everywhere",
      category: "silly",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Permanent clown face",
      choice2: "Permanent clown shoes",
      category: "silly",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "World where everyone wears hats",
      choice2: "World where everyone wears sunglasses",
      category: "silly",
    },

    // WOULD YOU RATHER QUESTIONS - PETS & CREATURES
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Pet unicorn",
      choice2: "Pet phoenix",
      category: "pets",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "World with no mirrors",
      choice2: "World with no clocks",
      category: "pets",
    },

    // WOULD YOU RATHER QUESTIONS - MALAYSIAN FOOD
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Nasi lemak daily",
      choice2: "Roti canai daily",
      category: "malaysian_food",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Unlimited teh tarik",
      choice2: "Unlimited kopi O",
      category: "malaysian_food",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Durian Musang King",
      choice2: "Durian D24",
      category: "malaysian_food",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Laksa",
      choice2: "Char kuey teow",
      category: "malaysian_food",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Eat at mamak stall",
      choice2: "Eat at kopitiam",
      category: "malaysian_food",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Durian ice cream",
      choice2: "Cendol",
      category: "malaysian_food",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Rojak at street vendor",
      choice2: "Rojak at fancy restaurant",
      category: "malaysian_food",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Durian party",
      choice2: "Seafood feast",
      category: "malaysian_food",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Wantan mee",
      choice2: "Hokkien mee",
      category: "malaysian_food",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Michelin restaurant in KL",
      choice2: "Street food in Kota Kinabalu",
      category: "malaysian_food",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Nasi lemak breakfast",
      choice2: "Kaya toast with kopi breakfast",
      category: "malaysian_food",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Malaysian fusion food",
      choice2: "Classic Malay dishes",
      category: "malaysian_food",
    },

    // WOULD YOU RATHER QUESTIONS - MALAYSIAN PLACES
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Shop at Pavilion KL",
      choice2: "Shop at Suria KLCC",
      category: "malaysian_places",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Watch movie at GSC",
      choice2: "Watch movie at TGV",
      category: "malaysian_places",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Weekend in Langkawi",
      choice2: "Weekend in Penang",
      category: "malaysian_places",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "MRT during rush hour",
      choice2: "Drive in KL traffic",
      category: "malaysian_places",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Hike Cameron Highlands",
      choice2: "Relax Port Dickson beach",
      category: "malaysian_places",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Shop at Jalan TAR",
      choice2: "Shop at Bukit Bintang",
      category: "malaysian_places",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Stay in kampung house",
      choice2: "Stay in KL condo",
      category: "malaysian_places",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Take ferry to Penang",
      choice2: "Fly to Penang",
      category: "malaysian_places",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Drive Proton Saga",
      choice2: "Drive Perodua Myvi",
      category: "malaysian_places",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Weekend at pasar malam",
      choice2: "Weekend at shopping mall",
      category: "malaysian_places",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Explore Batu Caves",
      choice2: "Explore Kek Lok Si",
      category: "malaysian_places",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Live in George Town",
      choice2: "Live in Johor Bahru",
      category: "malaysian_places",
    },

    // WOULD YOU RATHER QUESTIONS - MALAYSIAN CULTURE & ACTIVITIES
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Hari Raya open house",
      choice2: "Chinese New Year reunion",
      category: "malaysian_culture",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Deepavali in Ipoh",
      choice2: "Christmas in Sabah",
      category: "malaysian_culture",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Celebrate Wesak Day",
      choice2: "Celebrate Thaipusam",
      category: "malaysian_culture",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Watch Istana Budaya",
      choice2: "Watch local indie band",
      category: "malaysian_culture",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Make kuih",
      choice2: "Bake cake",
      category: "malaysian_culture",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Wedding nasi minyak feast",
      choice2: "Buffet local delicacies",
      category: "malaysian_culture",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Picnic Taman Tasik Perdana",
      choice2: "Beach at Tanjung Bungah",
      category: "malaysian_culture",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Road trip North-South Expressway",
      choice2: "Road trip East Coast Highway",
      category: "malaysian_culture",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Night at Langkawi Sky Bridge",
      choice2: "Climb Mount Kinabalu",
      category: "malaysian_culture",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Sunrise at Penang Hill",
      choice2: "Sunset at Melaka River",
      category: "malaysian_culture",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Local food festival",
      choice2: "Traditional craft fair",
      category: "malaysian_culture",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Learn sepak takraw",
      choice2: "Learn wau bulan",
      category: "malaysian_culture",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Visit batik workshop",
      choice2: "Visit pewter factory",
      category: "malaysian_culture",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Listen to Malay pop",
      choice2: "Listen to Chinese rock",
      category: "malaysian_culture",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Formula 1 in Sepang",
      choice2: "Malaysian Open tennis",
      category: "malaysian_culture",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Traditional dance class",
      choice2: "Modern Zumba session",
      category: "malaysian_culture",
    },

    // WOULD YOU RATHER QUESTIONS - MALAYSIAN EXPERIENCES
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Scuba dive Perhentian Islands",
      choice2: "Jungle trek Taman Negara",
      category: "malaysian_experiences",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Shop for batik",
      choice2: "Shop for songket",
      category: "malaysian_experiences",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Legoland Malaysia",
      choice2: "Sunway Lagoon",
      category: "malaysian_experiences",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Local comedy show",
      choice2: "Magic performance",
      category: "malaysian_experiences",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Chinese opera",
      choice2: "Wayang kulit show",
      category: "malaysian_experiences",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Durian hunting",
      choice2: "Mangosteen picking",
      category: "malaysian_experiences",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Langkawi boat tour",
      choice2: "KL food tour",
      category: "malaysian_experiences",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Jungle thunderstorm",
      choice2: "Sunny beach day",
      category: "malaysian_experiences",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Nasi kandar Penang",
      choice2: "Banana leaf restaurant KL",
      category: "malaysian_experiences",
    },
    {
      type: "would_you_rather",
      question: "Would you rather:",
      choice1: "Highlands weekend getaway",
      choice2: "Beach resort weekend",
      category: "malaysian_experiences",
    },
  ];

  try {
    // First, delete all existing daily questions
    console.log("Clearing existing daily questions...");
    const existingQuestions = await getDocs(collection(db, "daily_questions"));
    for (const questionDoc of existingQuestions.docs) {
      await deleteDoc(doc(db, "daily_questions", questionDoc.id));
    }
    console.log(`Deleted ${existingQuestions.size} existing questions`);

    // Add new daily questions
    console.log("Adding your new daily questions...");
    for (const question of dailyQuestions) {
      await addDoc(collection(db, "daily_questions"), {
        text: question.text,
        category: question.category,
        active: true,
        createdAt: new Date(),
      });
      console.log("Added daily question:", question.text);
    }

    // Clear and replace choice questions
    console.log("Clearing existing choice questions...");
    const existingChoiceQuestions = await getDocs(
      collection(db, "choice_questions")
    );
    for (const questionDoc of existingChoiceQuestions.docs) {
      await deleteDoc(doc(db, "choice_questions", questionDoc.id));
    }
    console.log(
      `Deleted ${existingChoiceQuestions.size} existing choice questions`
    );

    // Add new choice questions
    console.log("Adding your new choice questions...");
    for (const question of choiceQuestions) {
      await addDoc(collection(db, "choice_questions"), {
        ...question,
        active: true,
        createdAt: new Date(),
      });
      console.log("Added choice question:", question.question);
    }

    console.log("All questions seeded successfully!");
  } catch (error) {
    console.error("Error seeding questions:", error);
  }
}

// Remove direct execution - function should be called from the app when needed
// seedQuestions();
