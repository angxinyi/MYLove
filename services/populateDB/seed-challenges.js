import { addDoc, collection, deleteDoc, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase/config";

// Clear all existing challenges from the database
async function clearChallenges() {
  console.log("Clearing existing challenges...");
  const challengesRef = collection(db, "challenges");
  const snapshot = await getDocs(challengesRef);

  const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);

  console.log(`Cleared ${snapshot.docs.length} existing challenges`);
}

// Seed challenges collection with sample data (for testing - call this from your app)
export async function seedChallenges() {
  if (!auth.currentUser) {
    throw new Error("Must be authenticated");
  }

  console.log("Starting to seed challenges from authenticated user...");

  try {
    // Clear existing challenges first
    await clearChallenges();

    const challenges = [
      "Share one childhood memory you've never told your partner before.",
      "Describe your ideal lazy Sunday and compare it with your partner's.",
      "Describe in detail the first time you realised you liked/loved your partner.",
      "Make a top-3 list (e.g., 3 foods, movies, or places you want to try with your partner).",
      'Send a "top 3" list: your 3 favorite things about your relationship.',
      "Reveal one embarrassing or funny childhood memory.",
      'Write a short "thank you" letter and send it through chat.',
      "Tell your partner one thing you want to do together in the next year.",
      "Imagine your dream holiday together and describe it in detail.",
      "Mini-language dare: teach your partner one funny/cute phrase in your language today.",
      "Share something you're proud of that happened this week, no matter how small.",
      "Only reply in emojis for the next 5 messages.",
      "Type a message with no vowels and make your partner guess the words.",
      "Share 3 things you admire about your partner today.",
      "Tell your partner the funniest dream you've ever had.",
      "Write one memory you want to relive with them.",
      "Imagine your partner is a superhero — give them a name and describe their powers.",
      "Imagine your future weekend together and describe it in detail.",
      "Pretend you're both superheroes — give each other names and powers.",
    ];

    for (const challengeText of challenges) {
      await addDoc(collection(db, "challenges"), {
        text: challengeText,
        active: true,
        rand: Math.random(),
      });
    }

    return {
      success: true,
      message: `Successfully seeded ${challenges.length} challenges`,
    };
  } catch (error) {
    console.error("Error seeding challenges:", error);
    throw error;
  }
}
