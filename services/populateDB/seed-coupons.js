import { addDoc, collection, deleteDoc, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase/config";

// Clear all existing couple coupons from the database
async function clearCoupleCoupons() {
  console.log("Clearing existing couple coupons...");
  const couponsRef = collection(db, "couple_coupons");
  const snapshot = await getDocs(couponsRef);

  const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);

  console.log(`Cleared ${snapshot.docs.length} existing couple coupons`);
}

// Seed couple coupons collection with sample data (for testing - call this from your app)
export async function seedCoupleCoupons() {
  if (!auth.currentUser) {
    throw new Error("Must be authenticated");
  }

  console.log("Starting to seed couple coupons from authenticated user...");

  try {
    // Clear existing couple coupons first
    await clearCoupleCoupons();

    const sampleCoupons = [
      // Romantic Coupons
      { text: "A love letter sent by mail or email", category: "Romantic" },
      {
        text: "A surprise voice note telling you why I love you",
        category: "Romantic",
      },
      { text: "A heartfelt video message just for you", category: "Romantic" },
      {
        text: "A custom playlist that reminds me of you",
        category: "Romantic",
      },
      {
        text: "A photo collage or scrapbook page of our favorite memories",
        category: "Romantic",
      },
      {
        text: 'A late night "I miss you" phone call, no matter the time',
        category: "Romantic",
      },
      {
        text: 'A text only "love bomb" with 20 sweet messages in a row',
        category: "Romantic",
      },
      {
        text: "A digital slideshow of our moments set to our song",
        category: "Romantic",
      },
      {
        text: "One day of surprise good morning and goodnight videos",
        category: "Romantic",
      },
      {
        text: "A poem or short story written just for you",
        category: "Romantic",
      },

      // Playful Coupons
      {
        text: "A virtual game night with your choice of game",
        category: "Playful",
      },
      {
        text: 'A 10 question "about us" trivia challenge',
        category: "Playful",
      },
      {
        text: "A Netflix watch party or movie sync session",
        category: "Playful",
      },
      {
        text: 'A virtual "dress up and dine" date via video call',
        category: "Playful",
      },
      {
        text: "A couples quiz where I'll answer anything you ask",
        category: "Playful",
      },
      {
        text: "A TikTok or short video challenge where we duet",
        category: "Playful",
      },
      {
        text: "A coordinated phone wallpaper set for both of us",
        category: "Playful",
      },
      {
        text: "A digital scavenger hunt with clues I'll leave online",
        category: "Playful",
      },
      {
        text: 'A shared "bucket list" brainstorming session',
        category: "Playful",
      },
      {
        text: "A themed selfie challenge where you pick the theme",
        category: "Playful",
      },

      // Connection Coupons
      {
        text: "A deep question night with 10 meaningful questions via call or chat",
        category: "Connection",
      },
      {
        text: "A full hour of uninterrupted attention with no multitasking",
        category: "Connection",
      },
      { text: "A shared dream journaling session", category: "Connection" },
      {
        text: 'A "memory lane" call to talk about a favorite past moment',
        category: "Connection",
      },
      {
        text: "A voice note chain where we only use voice notes for a full day",
        category: "Connection",
      },
      {
        text: "A compliment exchange of 5 things we love about each other",
        category: "Connection",
      },
      {
        text: 'A "no screens, just talk" phone call with audio only and no distractions',
        category: "Connection",
      },
      {
        text: "A mini debate night where you pick a silly topic and defend your side",
        category: "Connection",
      },
      {
        text: 'A "this or that" challenge with rapid fire preferences to learn more',
        category: "Connection",
      },
      {
        text: 'A virtual "journal swap" where we write a page and read it to each other',
        category: "Connection",
      },

      // Creative Coupons
      {
        text: "A digital care package with memes, songs, and messages",
        category: "Creative",
      },
      {
        text: "A surprise online order like food delivery or a small gift",
        category: "Creative",
      },
      {
        text: "A custom phone wallpaper made just for you",
        category: "Creative",
      },
      {
        text: "A handwritten note scanned or photographed",
        category: "Creative",
      },
      {
        text: "A love filled Pinterest board or mood board",
        category: "Creative",
      },
      {
        text: "I'll draw or design something just for you",
        category: "Creative",
      },
      {
        text: "A shared recipe and virtual cook together session",
        category: "Creative",
      },
      {
        text: "A surprise Amazon or Shopee wishlist treat",
        category: "Creative",
      },
      { text: "A letter to your future self from me", category: "Creative" },
      {
        text: "A story or memory I've never told you before",
        category: "Creative",
      },

      // Supportive Coupons
      {
        text: "A motivational pep talk recording from me",
        category: "Supportive",
      },
      {
        text: 'A "stay strong" reminder day where I check in every few hours',
        category: "Supportive",
      },
      {
        text: "A daily goal accountability check in with your goals and my support",
        category: "Supportive",
      },
      {
        text: 'A digital "hug in a message" when you\'re feeling down',
        category: "Supportive",
      },
      {
        text: "A stress relief playlist made just for your mood",
        category: "Supportive",
      },
      {
        text: "A reminder of 10 reasons why you're amazing",
        category: "Supportive",
      },
      {
        text: "A custom affirmation or mantra just for you",
        category: "Supportive",
      },
      {
        text: "A screenshot collage of all the things that made me smile today",
        category: "Supportive",
      },
      {
        text: 'A "no negativity" day with only positive thoughts between us',
        category: "Supportive",
      },
      {
        text: "I'll remind you how proud I am of you in detail",
        category: "Supportive",
      },
    ];

    for (const coupon of sampleCoupons) {
      await addDoc(collection(db, "couple_coupons"), {
        text: coupon.text,
        category: coupon.category,
        active: true,
        rand: Math.random(),
      });
    }

    return {
      success: true,
      message: `Successfully seeded ${sampleCoupons.length} couple coupons`,
    };
  } catch (error) {
    console.error("Error seeding couple coupons:", error);
    throw error;
  }
}
