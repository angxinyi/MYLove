import { auth, db } from "@/firebase/config";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { sendMessage } from "./chatServices";
import { checkPairingStatus } from "./coupleLogic";

export interface Challenge {
  id: string;
  text: string;
  active: boolean;
  rand: number;
}

export interface CoupleCoupon {
  id: string;
  text: string;
  category: string;
  active: boolean;
  rand: number;
}

// Redeem a challenge for couples
export async function redeemChallenge(): Promise<{
  success: boolean;
  challenge?: Challenge;
  message?: string;
}> {
  if (!auth.currentUser) {
    throw new Error("Must be authenticated");
  }

  const uid = auth.currentUser.uid;

  try {
    // Check if user is paired
    const pairingStatus = await checkPairingStatus();
    if (!pairingStatus.isPaired) {
      return {
        success: false,
        message: "You must be paired with a partner to redeem challenges",
      };
    }

    // Get random challenge from database
    const challenge = await getRandomChallenge();
    if (!challenge) {
      return {
        success: false,
        message: "No challenges available at the moment",
      };
    }

    // Get current user's display name
    const userDoc = await getDoc(doc(db, "users", uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    const displayName = userData.displayName || userData.name || "Someone";

    // Send system message to chat notifying both users
    const systemMessage = `${displayName} has redeemed a challenge:\n${challenge.text}`;

    await sendMessage(
      pairingStatus.coupleId!,
      systemMessage,
      true, // isSystemMessage
      "challenge_redeemed" // systemMessageType
    );

    return {
      success: true,
      challenge,
      message: "Challenge redeemed successfully!",
    };
  } catch (error) {
    console.error("Error redeeming challenge:", error);
    throw error;
  }
}

// Get random challenge using simple random selection
async function getRandomChallenge(): Promise<Challenge | null> {
  try {
    // Get all active challenges
    const q = query(collection(db, "challenges"), where("active", "==", true));

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    // Pick random challenge from results
    const docs = snapshot.docs;
    const randomIndex = Math.floor(Math.random() * docs.length);
    const doc = docs[randomIndex];

    return {
      id: doc.id,
      text: doc.data().text,
      active: doc.data().active,
      rand: doc.data().rand,
    };
  } catch (error) {
    console.error("Error getting random challenge:", error);
    return null;
  }
}

// Redeem a couple coupon for couples
export async function redeemCoupleCoupon(): Promise<{
  success: boolean;
  coupon?: CoupleCoupon;
  message?: string;
}> {
  if (!auth.currentUser) {
    throw new Error("Must be authenticated");
  }

  const uid = auth.currentUser.uid;

  try {
    // Check if user is paired
    const pairingStatus = await checkPairingStatus();
    if (!pairingStatus.isPaired) {
      return {
        success: false,
        message: "You must be paired with a partner to redeem couple coupons",
      };
    }

    // Get random couple coupon from database
    const coupon = await getRandomCoupleCoupon();
    if (!coupon) {
      return {
        success: false,
        message: "No couple coupons available at the moment",
      };
    }

    // Get current user's display name
    const userDoc = await getDoc(doc(db, "users", uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    const displayName = userData.displayName || userData.name || "Someone";

    // Send system message to chat notifying both users
    const systemMessage = `${displayName} redeemed a couple coupon:\n${coupon.text}`;

    await sendMessage(
      pairingStatus.coupleId!,
      systemMessage,
      true, // isSystemMessage
      "couple_coupon_redeemed" // systemMessageType
    );

    return {
      success: true,
      coupon,
    };
  } catch (error) {
    console.error("Error redeeming couple coupon:", error);
    throw error;
  }
}

// Get random couple coupon using simple random selection
async function getRandomCoupleCoupon(): Promise<CoupleCoupon | null> {
  try {
    // Get all active couple coupons
    const q = query(
      collection(db, "couple_coupons"),
      where("active", "==", true)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    // Pick random couple coupon from results
    const docs = snapshot.docs;
    const randomIndex = Math.floor(Math.random() * docs.length);
    const doc = docs[randomIndex];

    return {
      id: doc.id,
      text: doc.data().text,
      category: doc.data().category,
      active: doc.data().active,
      rand: doc.data().rand,
    };
  } catch (error) {
    console.error("Error getting random couple coupon:", error);
    return null;
  }
}

// Seed dates collection with all love language combinations
export async function seedDates(): Promise<{
  success: boolean;
  message: string;
}> {
  if (!auth.currentUser) {
    throw new Error("Must be authenticated");
  }

  console.log("Starting to seed dates from authenticated user...");

  try {
    const dateIdeas = {
      "Quality Time + Words of Affirmation": [
        "Plan a virtual date where you both cook the same recipe and compliment each other's cooking skills throughout.",
        "Have a video call book club session where you read chapters together and share your favorite quotes.",
        "Create a shared playlist and spend time listening to it together while sharing what each song means to you.",
        "Plan a virtual museum or art gallery tour and discuss your favorite pieces with encouraging words.",
        "Have a 'compliment marathon' during a long video call where you take turns sharing specific things you appreciate.",
        "Watch a documentary together and have deep conversations about it, affirming each other's insights.",
        "Plan a virtual stargazing date and share encouraging words about your future together.",
        "Have a video call while both of you work on personal projects, offering motivation and praise throughout.",
        "Create a shared journal where you write daily affirmations for each other and read them together weekly.",
        "Plan a virtual workout session and encourage each other with positive words throughout the exercise.",
      ],

      "Acts of Service + Quality Time": [
        "Cook the same meal step-by-step on a video call.",
        "Clean or organize your space together while chatting.",
        "Create and review shared wellness or fitness plans.",
        "Take on a mini productivity challenge and motivate each other.",
        "Co-design morning routines or self-care rituals.",
        "Tech declutter sessions, supporting each other live.",
        "Prepare simple meals and eat 'together' online.",
        "Make a shared care calendar planning thoughtful acts.",
        "Record and exchange guided self-care or meditation audios.",
        "Track and celebrate completing helpful or growth goals.",
      ],

      "Receiving Gifts + Words of Affirmation": [
        "Create custom phone wallpapers with encouraging quotes for each other.",
        "Write and exchange daily affirmation cards with small meaningful tokens.",
        "Surprise each other with personalized playlists accompanied by heartfelt messages about why each song reminds you of them.",
        "Create 'encouragement packages' with motivational quotes and small symbolic gifts.",
        "Exchange handwritten letters with pressed flowers or small keepsakes.",
        "Give each other digital photo albums with captions full of loving affirmations.",
        "Create personalized calendars with daily compliments and small surprise dates marked.",
        "Exchange 'gratitude jars' filled with notes about what you appreciate about each other.",
        "Create custom bookmarks with encouraging quotes and give them with books you think they'd enjoy.",
        "Design and give each other personalized certificates celebrating their unique qualities and achievements.",
      ],

      "Words of Affirmation + Words of Affirmation": [
        "Write daily love letters focusing on specific qualities you admire about each other.",
        "Record encouraging voice messages for each other to listen to during difficult times.",
        "Create a shared document where you add compliments and affirmations throughout the day.",
        "Have weekly video calls dedicated entirely to sharing what you're proud of about each other.",
        "Write and exchange personal poems celebrating each other's strengths and dreams.",
        "Create encouraging social media posts about each other (with permission) highlighting their amazing qualities.",
        "Send surprise text messages throughout the day with specific compliments and loving observations.",
        "Record bedtime stories or guided meditations with personalized affirmations for each other.",
        "Create a 'reasons why I love you' jar and share one reason each day through messages or calls.",
        "Write encouraging notes for each other to find in unexpected places (lunch boxes, mirrors, books, etc.).",
      ],

      "Acts of Service + Acts of Service": [
        "Make a 'to-do swap' list — each helps motivate the other.",
        "Hold each other accountable on one daily task.",
        "Set reminders for each other with kind notes.",
        "Create a 7-day productivity challenge and check in.",
        "Share study or work 'focus time' together on call.",
        "Research something useful your partner wants to learn.",
        "Write step-by-step 'how-to' guide for a task they've been putting off.",
        "Exchange self-care checklists and complete them.",
        "Make mini-guides for each other (e.g., recipes, routines).",
        "Be each other's 'accountability buddy' for a week.",
      ],

      "Receiving Gifts + Receiving Gifts": [
        "Surprise each other with a digital gift (playlist, e-card, wallpaper).",
        "Share a 'dream gift' list you'd love to receive one day.",
        "Create a wish list for future birthdays and compare.",
        "Pick one item under $10 and send it.",
        "Write about the most meaningful gift you've ever received.",
        "Gift each other 'time' by dedicating 1 hour to focus only on chatting.",
        "Send each other a digital 'coupon' for a future activity together.",
        "Create a virtual 'friendship/love certificate' and exchange.",
        "Imagine a 'mystery box' — describe what items you'd put inside for your partner.",
        "Gift each other your favorite quote of the week.",
      ],

      "Physical Touch + Physical Touch": [
        "Synchronize bedtime and say goodnight together.",
        "Both hug a pillow at the same time while on call.",
        "Send each other descriptions of a comforting hug.",
        "Wear matching cozy clothes for a call.",
        "Do a 'mirror movement' game on video (copy each other's gestures).",
        "Describe a moment of physical closeness you remember or dream of.",
        "Hold your own hand and imagine it's your partner's.",
        "Exchange 'virtual cuddles' every morning/night.",
        "Count to 10 while imagining holding hands.",
        "Send 'touch emoji' (like 🤗💞✋) as a symbolic hug.",
      ],

      "Quality Time + Physical Touch": [
        "Virtual cuddle movie night with matching blankets or hoodies.",
        "Fall asleep on video call hugging a plushie or pillow.",
        "Watch sunrise/sunset together wrapped in cozy items.",
        "Do partner stretches or yoga moves via video call.",
        "Share warm drinks while holding a comforting object.",
        "Use long-distance touch lamps or bracelets during calls.",
        "Exchange 'virtual hugs' during video walks.",
        "Have a virtual sleepover with matching PJs and bedtime stories.",
        "Read a book aloud together while holding something cozy.",
        "Record and share a 'touch letter' describing affectionate gestures.",
      ],

      "Acts of Service + Words of Affirmation": [
        "Cook meals while giving each other motivational pep talks.",
        "Clean spaces together, complimenting progress.",
        "Create self-care audios with positive affirmations.",
        "Make shared goal trackers with encouraging notes.",
        "Record guided meditations combining support and affirmations.",
        "Exchange motivational letters accompanying helpful gifts.",
        "Help each other plan routines with uplifting reminders.",
        "Encourage productivity challenges with praise and cheers.",
        "Make gratitude lists and share supportive feedback.",
        "Send 'care calendars' with loving, action-oriented messages.",
      ],

      "Receiving Gifts + Physical Touch": [
        "Mail a 'hug in a box' (plushie, blanket) with scented notes.",
        "Send wearable gifts to use during video calls (bracelets, hoodies).",
        "Gift massage tools or spa kits and guide usage over call.",
        "Send scented candles or essential oils for shared relaxation.",
        "Create 'care packs' with comfort items to open together.",
        "Mail personalized pillows or blankets with recorded voice notes.",
        "Exchange cozy slippers and show them off on video.",
        "Send stuffed animals to cuddle on calls.",
        "Mail scented letters and describe the scent's meaning during calls.",
        "Record calming videos for self-massage or comforting rituals.",
      ],

      "Words of Affirmation + Physical Touch": [
        "Send 'audio hugs' describing affectionate touches.",
        "Write 'touch letters' with detailed affectionate language.",
        "Whisper affirmations while simulating cuddles or hand-holding on video.",
        "Play compliments-for-kisses games during calls.",
        "Record love poems describing touch and closeness.",
        "Record soothing 'verbal massage' sessions.",
        "Exchange whispered affirmations during video cuddles.",
        "Hold your hand while listening to partner's loving voice messages.",
        "Describe affectionate gestures after giving compliments.",
        "Write scripts of physical closeness to read to each other.",
      ],

      "Acts of Service + Receiving Gifts": [
        "Send care packages with practical self-care items.",
        "Gift subscriptions to services that help ease their day.",
        "Mail DIY gift kits and do the project 'together' on video.",
        "Send personalized planners or wellness journals.",
        "Deliver healthy snacks or meal kits for their busy days.",
        "Mail productivity tools with encouraging notes.",
        "Gift books on topics they want to improve in and discuss progress.",
        "Send comfort items with handwritten instructions on self-care.",
        "Create surprise 'help boxes' for stressful times.",
        "Plan virtual 'help sessions' where you assist with tasks online.",
      ],

      "Quality Time + Receiving Gifts": [
        "Watch each other open small surprise gifts over video.",
        "Gift each other an e-book to read and discuss together.",
        "Send each other a favorite snack and have a virtual snack date.",
        "Surprise your partner with a 'digital mixtape' and listen together.",
        "Plan a virtual unboxing session with online orders.",
        "Exchange 'digital care packages' (links, wallpapers, quotes).",
        "Send each other mystery items and play a guessing game.",
        "Choose a 'gift theme' (cozy, funny, artistic) and send matching items.",
        "Buy identical inexpensive items (like mugs) and use them on calls.",
        "Create a DIY 'coupon book' (movie night, quiz challenge, love letter) and gift it digitally.",
      ],

      "Acts of Service + Physical Touch": [
        "Guide each other through a 5-minute stretch or relaxation routine on call.",
        "Create a 'self-massage' script with supportive words and swap them.",
        "Remind your partner to take a break, drink water, or stretch — then both do it together.",
        "Be each other's 'comfort coach': describe calming actions like hugs or hand-holding while encouraging them through tasks.",
        "Write a short bedtime routine for your partner that ends with a 'virtual hug.'",
        "Create a soothing audio note combining encouragement and imagined touch.",
        "Walk them through a 'comfort visualization' (e.g., 'Imagine I'm hugging you while you take a deep breath').",
        "Plan a mutual pampering session (face masks, cozy clothes) and talk each other through it.",
        "Offer to be their 'relaxation buddy' — remind them to get comfy with a blanket or plushie while you chat.",
        "Write a short 'comfort checklist' mixing service and touch (e.g., Drink tea, stretch, hug pillow, listen to me).",
      ],

      "Quality Time + Quality Time": [
        "Schedule a weekly 'virtual date night' ritual.",
        "Pick a random topic and discuss it for 20 minutes like a podcast.",
        "Share a 'silent call' where you just do your own thing together.",
        "Create a bucket list of experiences you want to do together.",
        "Have a digital journaling session and read entries aloud.",
        "Watch the same movie at the same time and discuss after.",
        "Play a 20-question game about each other's life experiences.",
        "Spend 10 minutes describing your perfect day together.",
        "Do a simultaneous online puzzle or word game.",
        "Plan a virtual weekend 'trip' (pick a city and research together).",
      ],
    };

    let totalSeeded = 0;

    for (const [combination, dates] of Object.entries(dateIdeas)) {
      // Split combination into two love languages
      const loveLanguages = combination.split(" + ");

      for (const dateText of dates) {
        await addDoc(collection(db, "date_ideas"), {
          text: dateText,
          love_language: loveLanguages,
          active: true,
          rand: Math.random(),
        });
        totalSeeded++;
      }
    }

    return {
      success: true,
      message: `Successfully seeded ${totalSeeded} date ideas across ${
        Object.keys(dateIdeas).length
      } love language combinations`,
    };
  } catch (error) {
    console.error("Error seeding dates:", error);
    throw error;
  }
}
