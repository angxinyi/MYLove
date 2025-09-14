import { auth, db } from "@/firebase/config";
import type {
  ChoiceGameType,
  ChoiceQuestion,
  DailyQuestion,
  GameState,
} from "@/types/game";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

// Admin user ID with unlimited plays
const ADMIN_USER_ID = "0ecr8GVKN5Sii064HqwhX3GfO5C3";

// Get today's date in Malaysia timezone
function getTodayMY(): string {
  const now = new Date();
  // Convert to Malaysia time (UTC+8)
  const malaysiaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return malaysiaTime.toISOString().split("T")[0];
}

// Get yesterday's date in Malaysia timezone
function getYesterdayMY(): string {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  // Convert to Malaysia time (UTC+8)
  const malaysiaTime = new Date(yesterday.getTime() + 8 * 60 * 60 * 1000);
  return malaysiaTime.toISOString().split("T")[0];
}

// Ensure game state is reset if needed
async function ensureResetIfNeeded(uid: string): Promise<void> {
  const todayMY = getTodayMY();
  const yesterdayMY = getYesterdayMY();
  const gameStateRef = doc(db, `users/${uid}/meta/gameState`);

  await runTransaction(db, async (transaction) => {
    const gameStateDoc = await transaction.get(gameStateRef);

    if (!gameStateDoc.exists()) {
      // Initialize new game state
      const isAdmin = uid === ADMIN_USER_ID;
      transaction.set(gameStateRef, {
        lastResetDateMY: todayMY,
        dailyRemaining: isAdmin ? 999 : 1, // Admin gets 999 daily questions
        ticketsRemaining: isAdmin ? 999 : 3, // Admin gets 999 tickets
        streak: 0,
        points: 0, // Initialize with 0 points
      });
    } else {
      const gameState = gameStateDoc.data() as GameState;

      if (gameState.lastResetDateMY !== todayMY) {
        // Reset quotas for new day
        const isAdmin = uid === ADMIN_USER_ID;
        const updateData: any = {
          lastResetDateMY: todayMY,
          dailyRemaining: isAdmin ? 999 : 1, // Admin gets 999 daily questions
          ticketsRemaining: isAdmin ? 999 : 3, // Admin gets 999 tickets
        };

        // Initialize points for existing users who don't have it
        if (gameState.points === undefined) {
          updateData.points = 0;
        }

        // Check if streak should be reset due to skipping days
        if (
          gameState.lastStreakEarnedDateMY &&
          gameState.lastStreakEarnedDateMY !== yesterdayMY &&
          gameState.lastStreakEarnedDateMY !== todayMY
        ) {
          // User skipped at least one day, reset streak to 0
          updateData.streak = 0;
        }

        transaction.update(gameStateRef, updateData);
      } else if (gameState.points === undefined) {
        // Initialize points for existing users who don't have it
        transaction.update(gameStateRef, { points: 0 });
      }
    }
  });
}

// Get current game state
export async function getGameState(): Promise<GameState> {
  if (!auth.currentUser) {
    throw new Error("Must be authenticated");
  }

  const uid = auth.currentUser.uid;

  try {
    await ensureResetIfNeeded(uid);

    const gameStateDoc = await getDoc(doc(db, `users/${uid}/meta/gameState`));

    if (!gameStateDoc.exists()) {
      throw new Error("Failed to initialize game state");
    }

    return gameStateDoc.data() as GameState;
  } catch (error) {
    console.error("Error getting game state:", error);
    throw error;
  }
}

// Spend daily quota and fetch a random daily question
export async function spendDailyAndFetchQuestion(): Promise<{
  question: DailyQuestion & { id: string };
  gameStateAfter: GameState;
}> {
  if (!auth.currentUser) {
    throw new Error("Must be authenticated");
  }

  const uid = auth.currentUser.uid;

  try {
    await ensureResetIfNeeded(uid);

    const gameStateRef = doc(db, `users/${uid}/meta/gameState`);

    // Use transaction to ensure atomicity
    const result = await runTransaction(db, async (transaction) => {
      const gameStateDoc = await transaction.get(gameStateRef);

      if (!gameStateDoc.exists()) {
        throw new Error("Game state not found");
      }

      const gameState = gameStateDoc.data() as GameState;
      const isAdmin = uid === ADMIN_USER_ID;

      if (!isAdmin && gameState.dailyRemaining <= 0) {
        throw new Error("No daily questions remaining");
      }

      // Decrement daily remaining (admin keeps their high number)
      const newDailyRemaining = isAdmin ? gameState.dailyRemaining : 0;
      transaction.update(gameStateRef, {
        dailyRemaining: newDailyRemaining,
      });

      return { ...gameState, dailyRemaining: newDailyRemaining };
    });

    // Fetch random daily question
    const question = await getRandomQuestion("daily_questions");

    return {
      question: question as DailyQuestion & { id: string },
      gameStateAfter: result,
    };
  } catch (error) {
    console.error("Error spending daily and fetching question:", error);
    throw error;
  }
}

// Spend ticket and fetch a random choice question
export async function spendTicketAndFetchChoiceQuestion(
  type: ChoiceGameType
): Promise<{
  question: ChoiceQuestion & { id: string };
  gameStateAfter: GameState;
}> {
  if (!auth.currentUser) {
    throw new Error("Must be authenticated");
  }

  if (!["this_or_that", "more_likely", "would_you_rather"].includes(type)) {
    throw new Error("Invalid game type");
  }

  const uid = auth.currentUser.uid;

  try {
    await ensureResetIfNeeded(uid);

    const gameStateRef = doc(db, `users/${uid}/meta/gameState`);

    // Use transaction to ensure atomicity
    const result = await runTransaction(db, async (transaction) => {
      const gameStateDoc = await transaction.get(gameStateRef);

      if (!gameStateDoc.exists()) {
        throw new Error("Game state not found");
      }

      const gameState = gameStateDoc.data() as GameState;
      const isAdmin = uid === ADMIN_USER_ID;

      if (!isAdmin && gameState.ticketsRemaining <= 0) {
        throw new Error("No tickets remaining");
      }

      // Decrement tickets (admin keeps their high number)
      const newTicketsRemaining = isAdmin
        ? gameState.ticketsRemaining
        : gameState.ticketsRemaining - 1;
      transaction.update(gameStateRef, {
        ticketsRemaining: newTicketsRemaining,
      });

      return { ...gameState, ticketsRemaining: newTicketsRemaining };
    });

    // Fetch random choice question of the specified type
    const question = await getRandomChoiceQuestion(type);

    return {
      question: question as ChoiceQuestion & { id: string },
      gameStateAfter: result,
    };
  } catch (error) {
    console.error("Error spending ticket and fetching choice question:", error);
    throw error;
  }
}

// Submit daily answer and update streak
export async function submitDailyAnswer(
  qid: string,
  answer: string
): Promise<{ success: boolean }> {
  if (!auth.currentUser) {
    throw new Error("Must be authenticated");
  }

  if (!qid || !answer || typeof answer !== "string") {
    throw new Error("Invalid question ID or answer");
  }

  const uid = auth.currentUser.uid;
  const todayMY = getTodayMY();

  try {
    // Create response document
    const responseRef = doc(collection(db, `users/${uid}/responses`));
    const responseData = {
      qid,
      type: "daily",
      answer: answer.trim(),
      createdAt: serverTimestamp(),
      malaysiaDate: todayMY,
    };

    // Update streak in transaction
    const gameStateRef = doc(db, `users/${uid}/meta/gameState`);

    await runTransaction(db, async (transaction) => {
      // IMPORTANT: Do all reads first, then all writes

      // First, read game state to calculate streak
      const gameStateDoc = await transaction.get(gameStateRef);

      if (!gameStateDoc.exists()) {
        throw new Error("Game state not found");
      }

      const gameState = gameStateDoc.data() as GameState;
      const yesterdayMY = getYesterdayMY();

      // Calculate new streak
      let newStreak = gameState.streak || 0;
      let shouldUpdateStreak = false;

      // Check if streak was already earned today
      if (gameState.lastStreakEarnedDateMY !== todayMY) {
        shouldUpdateStreak = true;
        newStreak = 1; // First game completion gives streak of 1

        if (gameState.lastStreakEarnedDateMY) {
          if (gameState.lastStreakEarnedDateMY === yesterdayMY) {
            // Consecutive day - increment streak
            newStreak = (gameState.streak || 0) + 1;
          } else {
            // Gap in days - reset streak to 1
            newStreak = 1;
          }
        }
      }

      // Now do all writes

      // Write response
      transaction.set(responseRef, responseData);

      // Update streak if needed
      if (shouldUpdateStreak) {
        transaction.update(gameStateRef, {
          streak: newStreak,
          lastStreakEarnedDateMY: todayMY,
        });
      }

      // Award points and update lastDailyAnswerDateMY
      const currentPoints = gameState.points || 0;
      transaction.update(gameStateRef, {
        lastDailyAnswerDateMY: todayMY,
        points: currentPoints + 10, // Award 10 points for completing daily question
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Error submitting daily answer:", error);
    throw error;
  }
}

// Record choice play and update streak
export async function recordChoicePlay(
  qid: string,
  type: ChoiceGameType,
  selected: 1 | 2
): Promise<{ success: boolean }> {
  if (!auth.currentUser) {
    throw new Error("Must be authenticated");
  }

  if (!qid || !type || ![1, 2].includes(selected)) {
    throw new Error("Invalid play data");
  }

  if (!["this_or_that", "more_likely", "would_you_rather"].includes(type)) {
    throw new Error("Invalid game type");
  }

  const uid = auth.currentUser.uid;
  const todayMY = getTodayMY();

  try {
    const playRef = doc(collection(db, `users/${uid}/plays`));
    const playData = {
      qid,
      type,
      selected,
      createdAt: serverTimestamp(),
      malaysiaDate: todayMY,
    };

    // Update streak in transaction along with recording the play
    const gameStateRef = doc(db, `users/${uid}/meta/gameState`);

    await runTransaction(db, async (transaction) => {
      // IMPORTANT: Do all reads first, then all writes

      // First, read game state to calculate streak
      const gameStateDoc = await transaction.get(gameStateRef);

      if (!gameStateDoc.exists()) {
        throw new Error("Game state not found");
      }

      const gameState = gameStateDoc.data() as GameState;
      const todayMY = getTodayMY();
      const yesterdayMY = getYesterdayMY();

      // Calculate new streak
      let newStreak = gameState.streak || 0;
      let shouldUpdateStreak = false;

      // Check if streak was already earned today
      if (gameState.lastStreakEarnedDateMY !== todayMY) {
        shouldUpdateStreak = true;
        newStreak = 1; // First game completion gives streak of 1

        if (gameState.lastStreakEarnedDateMY) {
          if (gameState.lastStreakEarnedDateMY === yesterdayMY) {
            // Consecutive day - increment streak
            newStreak = (gameState.streak || 0) + 1;
          } else {
            // Gap in days - reset streak to 1
            newStreak = 1;
          }
        }
      }

      // Now do all writes

      // Record the play
      transaction.set(playRef, playData);

      // Update streak if needed
      if (shouldUpdateStreak) {
        transaction.update(gameStateRef, {
          streak: newStreak,
          lastStreakEarnedDateMY: todayMY,
        });
      }

      // Award points for completing choice game
      const currentPoints = gameState.points || 0;
      transaction.update(gameStateRef, {
        points: currentPoints + 10, // Award 10 points for completing choice game
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Error recording choice play:", error);
    throw error;
  }
}

// Helper function to get random question using simple random selection
async function getRandomQuestion(collectionName: string) {
  try {
    // Get all active questions
    const q = query(
      collection(db, collectionName),
      where("active", "==", true)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error("No active questions found");
    }

    // Pick random question from results
    const docs = snapshot.docs;
    const randomIndex = Math.floor(Math.random() * docs.length);
    const doc = docs[randomIndex];

    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error("Error getting random question:", error);
    throw error;
  }
}

// Helper function to get random choice question of specific type
async function getRandomChoiceQuestion(type: string) {
  try {
    const q = query(
      collection(db, "choice_questions"),
      where("active", "==", true),
      where("type", "==", type)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error(`No active ${type} questions found`);
    }

    // Pick random question from results
    const docs = snapshot.docs;
    const randomIndex = Math.floor(Math.random() * docs.length);
    const doc = docs[randomIndex];

    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error("Error getting random choice question:", error);
    throw error;
  }
}

// Force reset admin quotas (for testing/admin purposes)
export async function forceResetAdminQuotas(): Promise<{
  success: boolean;
  message: string;
}> {
  if (!auth.currentUser) {
    throw new Error("Must be authenticated");
  }

  const uid = auth.currentUser.uid;

  if (uid !== ADMIN_USER_ID) {
    throw new Error("Only admin can use this function");
  }

  try {
    const gameStateRef = doc(db, `users/${uid}/meta/gameState`);
    const todayMY = getTodayMY();

    await setDoc(
      gameStateRef,
      {
        lastResetDateMY: todayMY,
        dailyRemaining: 999,
        ticketsRemaining: 999,
        streak: 0, // You can keep your current streak if you prefer
        lastStreakEarnedDateMY: null,
      },
      { merge: true }
    );

    return { success: true, message: "Admin quotas reset successfully" };
  } catch (error) {
    console.error("Error resetting admin quotas:", error);
    throw error;
  }
}

// Seed sample questions for testing
export async function seedQuestions(): Promise<{
  success: boolean;
  message: string;
}> {
  if (!auth.currentUser) {
    throw new Error("Must be authenticated");
  }

  try {
    // Sample daily questions
    const dailyQuestions = [
      "What's the most important lesson you've learned this year?",
      "If you could have dinner with anyone, who would it be and why?",
      "What's your biggest dream for the next 5 years?",
      "What makes you feel most grateful today?",
      "What's one thing you'd change about the world if you could?",
    ];

    for (const text of dailyQuestions) {
      await addDoc(collection(db, "daily_questions"), {
        text,
        active: true,
        rand: Math.random(),
      });
    }

    // Sample choice questions
    const choiceQuestions = [
      {
        type: "this_or_that",
        question: "For your ideal vacation:",
        choice1: "Beach paradise",
        choice2: "Mountain adventure",
      },
      {
        type: "this_or_that",
        question: "For a perfect evening:",
        choice1: "Netflix and chill",
        choice2: "Going out dancing",
      },
      {
        type: "more_likely",
        question: "Who is more likely to forget their anniversary?",
        choice1: "Partner A",
        choice2: "Partner B",
      },
      {
        type: "more_likely",
        question: "Who is more likely to get lost while driving?",
        choice1: "Partner A",
        choice2: "Partner B",
      },
      {
        type: "would_you_rather",
        question: "Would you rather:",
        choice1: "Have the ability to fly",
        choice2: "Have the ability to read minds",
      },
      {
        type: "would_you_rather",
        question: "Would you rather:",
        choice1: "Always be 10 minutes late",
        choice2: "Always be 20 minutes early",
      },
    ];

    for (const question of choiceQuestions) {
      await addDoc(collection(db, "choice_questions"), {
        ...question,
        active: true,
        rand: Math.random(),
      });
    }

    return { success: true, message: "Sample questions seeded successfully" };
  } catch (error) {
    console.error("Error seeding questions:", error);
    throw error;
  }
}
