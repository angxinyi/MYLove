import { auth, db } from "@/firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

export interface CoupleGameState {
  dailyRemaining: number;
  ticketsRemaining: number;
  streak: number;
  points: number; // Individual user points
  hasPendingDaily: boolean;
  hasPendingChoice: number;
}

export interface GameQuestion {
  id: string;
  text?: string;
  question?: string;
  choice1?: string;
  choice2?: string;
  type?: string;
}

export interface GameResult {
  sessionId: string;
  question: GameQuestion;
  gameStateAfter: CoupleGameState;
}

export interface PendingGame {
  sessionId: string;
  type: string;
  questionText: string;
  choice1?: string;
  choice2?: string;
  questionId?: string;
  initiatorUid: string;
  isPurchased?: boolean;
}

export interface GameHistoryItem {
  sessionId: string;
  type: string;
  questionText: string;
  choice1?: string;
  choice2?: string;
  answers: Record<string, { answer: string | number; answeredAt: any }>;
  createdAt: any;
  malaysiaDate: string;
  memberNames: Record<string, string>;
  completed: boolean;
  canAnswer: boolean;
  isPurchased?: boolean;
}

// Get current Malaysia date string
export function getMalaysiaDateString(): string {
  const now = new Date();
  // Get Malaysian date using proper timezone
  const malaysiaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return malaysiaDate; // YYYY-MM-DD format
}

// Get Malaysia date string for daily question reset tracking
function getMalaysiaDateStringWithCutoff(): string {
  const now = new Date();
  // Get Malaysian date using proper timezone
  const malaysiaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return malaysiaDate;
}

// Get current Malaysia reset period
export function getCurrentMalaysiaResetPeriod(): string {
  const now = new Date();
  // Get Malaysian date using proper timezone
  const malaysiaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  // Get Malaysian hour using proper timezone
  const malaysiaHour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kuala_Lumpur",
      hour: "2-digit",
      hour12: false,
    }).format(now)
  );

  let period: string;
  if (malaysiaHour >= 0 && malaysiaHour < 8) {
    period = "00"; // 12:00 AM - 7:59 AM
  } else if (malaysiaHour >= 8 && malaysiaHour < 16) {
    period = "08"; // 8:00 AM - 3:59 PM
  } else {
    period = "16"; // 4:00 PM - 11:59 PM
  }

  return `${malaysiaDate}_${period}`;
}

// Get next reset time in Malaysian timezone
export function getNextResetTime(): Date {
  const now = new Date();

  // Get current Malaysian date and hour
  const malaysiaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const malaysiaHour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kuala_Lumpur",
      hour: "2-digit",
      hour12: false,
    }).format(now)
  );

  const [year, month, day] = malaysiaDate.split("-");

  // Mini games reset at 12 AM, 8 AM, and 4 PM Malaysian time
  let nextReset: Date;

  if (malaysiaHour >= 0 && malaysiaHour < 8) {
    // Current period: 00:00-07:59, next reset: 08:00 (8 AM) today
    nextReset = new Date(`${year}-${month}-${day}T08:00:00+08:00`);
  } else if (malaysiaHour >= 8 && malaysiaHour < 16) {
    // Current period: 08:00-15:59, next reset: 16:00 (4 PM) today
    nextReset = new Date(`${year}-${month}-${day}T16:00:00+08:00`);
  } else {
    // Current period: 16:00-23:59, next reset: 00:00 tomorrow (12 AM)
    const nextDay = String(parseInt(day) + 1).padStart(2, "0");
    nextReset = new Date(`${year}-${month}-${nextDay}T00:00:00+08:00`);
  }

  return nextReset;
}

// Get next daily question reset time (midnight Malaysian timezone)
export function getNextDailyQuestionResetTime(): Date {
  const now = new Date();

  // Get current Malaysian date
  const malaysiaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  // Get current Malaysian hour
  const malaysiaHour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kuala_Lumpur",
      hour: "2-digit",
      hour12: false,
    }).format(now)
  );

  const [year, month, day] = malaysiaDate.split("-");

  // If it's past midnight (0:xx), next reset is tonight at midnight
  // If it's before midnight, next reset is today at midnight
  let nextMidnight: Date;
  if (malaysiaHour === 0) {
    // It's after midnight, so next reset is tomorrow
    nextMidnight = new Date(
      `${year}-${month}-${String(parseInt(day) + 1).padStart(
        2,
        "0"
      )}T00:00:00+08:00`
    );
  } else {
    // It's before midnight, so next reset is today
    nextMidnight = new Date(
      `${year}-${month}-${String(parseInt(day) + 1).padStart(
        2,
        "0"
      )}T00:00:00+08:00`
    );
  }

  return nextMidnight;
}

// Get random question
async function getRandomQuestion(
  collectionName: string,
  gameType?: string
): Promise<GameQuestion | null> {
  try {
    // First, get total count to calculate random offset
    let countQuery = query(
      collection(db, collectionName),
      where("active", "==", true)
    );

    if (gameType) {
      countQuery = query(countQuery, where("type", "==", gameType));
    }

    const countSnapshot = await getDocs(countQuery);
    const totalQuestions = countSnapshot.size;

    if (totalQuestions === 0) {
      throw new Error(`No ${collectionName} available`);
    }

    // 50 or fewer questions, use all of them
    if (totalQuestions <= 50) {
      const questions = countSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const randomIndex = Math.floor(Math.random() * questions.length);
      return questions[randomIndex] as GameQuestion;
    }

    // More than 50 questions, use random offset approach
    const randomOffset = Math.floor(Math.random() * (totalQuestions - 50));

    // Get 50 random questions starting from random offset
    const questions = countSnapshot.docs
      .slice(randomOffset, randomOffset + 50)
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

    // Return random question from the 50 selected
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex] as GameQuestion;
  } catch (error) {
    console.error("Error getting random question:", error);
    return null;
  }
}

// Get couple game state
export async function getCoupleGameState(): Promise<CoupleGameState> {
  if (!auth.currentUser) {
    throw new Error("Please log in to play games");
  }

  // Wait a moment to ensure authentication is fully loaded
  await new Promise((resolve) => setTimeout(resolve, 100));

  try {
    // Get user's coupleId
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (!userDoc.exists()) {
      throw new Error("User document not found");
    }

    const userData = userDoc.data();
    if (!userData.coupleId) {
      throw new Error("You need to be paired to play games");
    }

    // Get user's individual game state for points
    let userPoints = 0;
    try {
      const userGameStateDoc = await getDoc(
        doc(db, `users/${auth.currentUser.uid}/meta/gameState`)
      );
      if (userGameStateDoc.exists()) {
        const gameStateData = userGameStateDoc.data();
        userPoints = gameStateData?.points || 0;
      }
    } catch (pointsError) {
      console.log("Could not fetch user points, defaulting to 0:", pointsError);
      userPoints = 0;
    }

    // Get couple game state
    const coupleDoc = await getDoc(doc(db, "couples", userData.coupleId));
    if (!coupleDoc.exists()) {
      // Initialize couple document with default game state
      const defaultState: CoupleGameState = {
        dailyRemaining: 1,
        ticketsRemaining: 3,
        streak: 0,
        points: userPoints, // Individual user points
        hasPendingDaily: false,
        hasPendingChoice: 0,
      };

      await setDoc(doc(db, "couples", userData.coupleId), {
        members: [auth.currentUser.uid],
        createdAt: serverTimestamp(),
        lastReset: getCurrentMalaysiaResetPeriod(),
        lastDailyReset: getMalaysiaDateString(),
        dailyRemaining: 1,
        ticketsRemaining: 3,
        streak: 0,
        hasPendingDaily: false,
        hasPendingChoice: 0,
      });

      return defaultState;
    }

    const coupleData = coupleDoc.data();
    if (!coupleData) {
      throw new Error("Couple data not found");
    }

    // Check if we need to reset limits
    const lastReset = coupleData.lastReset || "";
    const lastDailyReset = coupleData.lastDailyReset || "";
    const currentPeriod = getCurrentMalaysiaResetPeriod();
    const currentDate = getMalaysiaDateString();

    let needsUpdate = false;
    const resetState: any = {};

    // Mini games reset 3 times daily (12am, 8am, 4pm) - tickets reset to 3 each time
    if (lastReset !== currentPeriod) {
      resetState.ticketsRemaining = 3;
      resetState.lastReset = currentPeriod;
      needsUpdate = true;
    }

    // Daily questions reset at midnight Malaysian time
    const currentDateWithCutoff = getMalaysiaDateStringWithCutoff();
    if (lastDailyReset !== currentDateWithCutoff) {
      resetState.dailyRemaining = 1;
      resetState.lastDailyReset = currentDateWithCutoff;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await updateDoc(doc(db, "couples", userData.coupleId), resetState);

      return {
        dailyRemaining:
          resetState.dailyRemaining ?? Number(coupleData.dailyRemaining || 0),
        ticketsRemaining:
          resetState.ticketsRemaining ??
          Number(coupleData.ticketsRemaining || 0),
        streak: Number(coupleData.streak || 0),
        points: Number(userPoints), // Individual user points
        hasPendingDaily: Boolean(coupleData.hasPendingDaily || false),
        hasPendingChoice: Number(coupleData.hasPendingChoice || 0),
      };
    }

    return {
      dailyRemaining: Number(coupleData.dailyRemaining || 0),
      ticketsRemaining: Number(coupleData.ticketsRemaining || 0),
      streak: Number(coupleData.streak || 0),
      points: Number(userPoints), // Individual user points
      hasPendingDaily: Boolean(coupleData.hasPendingDaily || false),
      hasPendingChoice: Number(coupleData.hasPendingChoice || 0),
    };
  } catch (error: any) {
    console.error("Error getting couple game state:", error);
    throw new Error(error.message || "Failed to load game data");
  }
}

// Start daily question
export async function startDailyQuestion(
  isPurchased?: boolean
): Promise<GameResult> {
  if (!auth.currentUser) {
    throw new Error("Please log in to play");
  }

  try {
    return await runTransaction(db, async (transaction) => {
      // Get user's coupleId
      const userRef = doc(db, "users", auth.currentUser!.uid);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error("User document not found");
      }

      const userData = userDoc.data();
      if (!userData.coupleId) {
        throw new Error("You need to be paired to play");
      }

      // Check couple game state
      const coupleRef = doc(db, "couples", userData.coupleId);
      const coupleDoc = await transaction.get(coupleRef);

      if (!coupleDoc.exists()) {
        throw new Error("Couple document not found");
      }

      const coupleData = coupleDoc.data();

      // Validate can start daily question (skip for purchased games)
      if (!isPurchased && coupleData.dailyRemaining <= 0) {
        throw new Error("No daily questions remaining today");
      }

      if (coupleData.hasPendingDaily) {
        throw new Error("Daily question already pending");
      }

      // Get random daily question
      const question = await getRandomQuestion("daily_questions");
      if (!question) {
        throw new Error("No questions available");
      }

      // Create game session
      const sessionRef = doc(
        collection(db, "couples", userData.coupleId, "game_sessions")
      );
      const sessionData = {
        type: "daily",
        questionId: question.id,
        questionText: question.text || question.question,
        initiatorUid: auth.currentUser!.uid,
        createdAt: serverTimestamp(),
        malaysiaDate: getCurrentMalaysiaResetPeriod(),
        completed: false,
        answers: {},
        ...(isPurchased && { isPurchased: true }),
      };

      transaction.set(sessionRef, sessionData);

      // Update couple state (skip dailyRemaining deduction for purchased games)
      const updateData: any = {
        hasPendingDaily: true,
      };

      if (!isPurchased) {
        updateData.dailyRemaining = coupleData.dailyRemaining - 1;
      }

      transaction.update(coupleRef, updateData);

      const gameStateAfter: CoupleGameState = {
        dailyRemaining: isPurchased
          ? coupleData.dailyRemaining || 0
          : coupleData.dailyRemaining - 1,
        ticketsRemaining: coupleData.ticketsRemaining || 0,
        streak: coupleData.streak || 0,
        hasPendingDaily: true,
        hasPendingChoice: coupleData.hasPendingChoice || 0,
      };

      return {
        sessionId: sessionRef.id,
        question: {
          id: question.id,
          text: question.text || question.question,
        },
        gameStateAfter,
      };
    });
  } catch (error: any) {
    console.error("Error starting daily question:", error);
    throw new Error(error.message || "Failed to start daily question");
  }
}

// Start choice game
export async function startChoiceGame(
  gameType: string,
  isPurchased?: boolean
): Promise<GameResult> {
  if (!auth.currentUser) {
    throw new Error("Please log in to play");
  }

  try {
    return await runTransaction(db, async (transaction) => {
      // Get user's coupleId
      const userRef = doc(db, "users", auth.currentUser!.uid);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error("User document not found");
      }

      const userData = userDoc.data();
      if (!userData.coupleId) {
        throw new Error("You need to be paired to play");
      }

      // Check couple game state
      const coupleRef = doc(db, "couples", userData.coupleId);
      const coupleDoc = await transaction.get(coupleRef);

      if (!coupleDoc.exists()) {
        throw new Error("Couple document not found");
      }

      const coupleData = coupleDoc.data();

      // Validate can start choice game (skip for purchased games)
      if (!isPurchased && coupleData.ticketsRemaining <= 0) {
        throw new Error("No tickets remaining today");
      }

      if (coupleData.hasPendingChoice >= 3) {
        throw new Error("Too many pending games. Wait for partner to answer");
      }

      // Get random choice question
      const question = await getRandomQuestion("choice_questions", gameType);
      if (!question) {
        throw new Error(`No questions available for ${gameType}`);
      }

      // Create game session
      const sessionRef = doc(
        collection(db, "couples", userData.coupleId, "game_sessions")
      );
      const sessionData = {
        type: gameType,
        questionId: question.id,
        questionText: question.question,
        choice1: question.choice1,
        choice2: question.choice2,
        initiatorUid: auth.currentUser!.uid,
        createdAt: serverTimestamp(),
        malaysiaDate: getCurrentMalaysiaResetPeriod(),
        completed: false,
        answers: {},
        ...(isPurchased && { isPurchased: true }),
      };

      transaction.set(sessionRef, sessionData);

      // Update couple state (skip ticketsRemaining deduction for purchased games)
      const updateData: any = {
        hasPendingChoice: (coupleData.hasPendingChoice || 0) + 1,
      };

      if (!isPurchased) {
        updateData.ticketsRemaining = coupleData.ticketsRemaining - 1;
      }

      transaction.update(coupleRef, updateData);

      const gameStateAfter: CoupleGameState = {
        dailyRemaining: coupleData.dailyRemaining || 0,
        ticketsRemaining: isPurchased
          ? coupleData.ticketsRemaining || 0
          : coupleData.ticketsRemaining - 1,
        streak: coupleData.streak || 0,
        hasPendingDaily: coupleData.hasPendingDaily || false,
        hasPendingChoice: (coupleData.hasPendingChoice || 0) + 1,
      };

      return {
        sessionId: sessionRef.id,
        question: {
          id: question.id,
          question: question.question,
          choice1: question.choice1,
          choice2: question.choice2,
          type: gameType,
        },
        gameStateAfter,
      };
    });
  } catch (error: any) {
    console.error("Error starting choice game:", error);
    throw new Error(error.message || "Failed to start game");
  }
}

// Submit game answer
export async function submitGameAnswer(
  sessionId: string,
  answer: string | number
): Promise<{ success: boolean; completed: boolean }> {
  if (!auth.currentUser) {
    throw new Error("Please log in to submit answer");
  }

  try {
    return await runTransaction(db, async (transaction) => {
      // IMPORTANT: All reads must be done first before any writes in Firestore transactions

      // Get user's coupleId
      const userRef = doc(db, "users", auth.currentUser!.uid);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error("User document not found");
      }

      const userData = userDoc.data();
      if (!userData.coupleId) {
        throw new Error("You need to be paired to submit answers");
      }

      // Get session
      const sessionRef = doc(
        db,
        "couples",
        userData.coupleId,
        "game_sessions",
        sessionId
      );
      const sessionDoc = await transaction.get(sessionRef);

      if (!sessionDoc.exists()) {
        throw new Error("Game session not found");
      }

      const sessionData = sessionDoc.data();

      // Get couple data
      const coupleRef = doc(db, "couples", userData.coupleId);
      const coupleDoc = await transaction.get(coupleRef);
      const coupleData = coupleDoc.data();

      // Get current user data for points update
      const currentUserData = userDoc.data();
      const currentPoints = currentUserData.points || 0;

      if (sessionData.completed) {
        throw new Error("This game has already been completed");
      }

      // Check if user already answered
      if (sessionData.answers && sessionData.answers[auth.currentUser!.uid]) {
        throw new Error("You have already answered this question");
      }

      // For more_likely games, convert choice number to actual display name
      let finalAnswer = answer;
      if (sessionData.type === "more_likely" && typeof answer === "number") {
        // Get couple members to convert Partner A/B to actual names
        const coupleRef = doc(db, "couples", userData.coupleId);
        const coupleDoc = await transaction.get(coupleRef);

        if (coupleDoc.exists()) {
          const coupleData = coupleDoc.data();
          const memberIds = coupleData.members || [];

          if (memberIds.length === 2) {
            // Get display names for both members
            const member1Ref = doc(db, "users", memberIds[0]);
            const member2Ref = doc(db, "users", memberIds[1]);
            const member1Doc = await transaction.get(member1Ref);
            const member2Doc = await transaction.get(member2Ref);

            if (member1Doc.exists() && member2Doc.exists()) {
              const member1Name = member1Doc.data().displayName || "Partner A";
              const member2Name = member2Doc.data().displayName || "Partner B";

              // Convert choice number to actual name
              finalAnswer = answer === 1 ? member1Name : member2Name;
            }
          }
        }
      }

      // Add user's answer
      const updatedAnswers = {
        ...sessionData.answers,
        [auth.currentUser!.uid]: {
          answer: finalAnswer,
          answeredAt: serverTimestamp(),
        },
      };

      // Check if both users have answered
      const members = coupleData?.members || [];

      const allAnswered = members.every(
        (memberId: string) => updatedAnswers[memberId] !== undefined
      );

      // Update session
      const sessionUpdate: any = {
        answers: updatedAnswers,
      };

      if (allAnswered) {
        sessionUpdate.completed = true;
        sessionUpdate.completedAt = serverTimestamp();
      }

      transaction.update(sessionRef, sessionUpdate);

      // Award 10 points to current user immediately upon answering
      transaction.update(userRef, {
        points: currentPoints + 10,
      });

      // Update couple state if completed
      if (allAnswered) {
        const coupleUpdate: any = {};

        if (sessionData.type === "daily") {
          coupleUpdate.hasPendingDaily = false;
          // Ensure dailyRemaining stays at 0 after completion
          coupleUpdate.dailyRemaining = 0;

          // Increase streak only once per day
          const currentDate = getMalaysiaDateString();
          const lastStreakDate = coupleData?.lastStreakDate || "";

          if (lastStreakDate !== currentDate) {
            // Streak hasn't been increased today, so increase it
            coupleUpdate.streak = (coupleData?.streak || 0) + 1;
            coupleUpdate.lastStreakDate = currentDate;
          } else {
            // Streak already increased today, keep current streak
            coupleUpdate.streak = coupleData?.streak || 0;
          }
        } else {
          // Decrease pending choice games count
          coupleUpdate.hasPendingChoice = Math.max(
            0,
            (coupleData?.hasPendingChoice || 0) - 1
          );
        }

        transaction.update(coupleRef, coupleUpdate);
      }

      return {
        success: true,
        completed: allAnswered,
      };
    });
  } catch (error: any) {
    console.error("Error submitting game answer:", error);
    throw new Error(error.message || "Failed to submit answer");
  }
}

// Get couple members info
export async function getCoupleMembers(): Promise<{
  memberIds: string[];
  userNames: { [userId: string]: string };
}> {
  if (!auth.currentUser) {
    throw new Error("Please log in to get couple members");
  }

  try {
    // Get user's coupleId
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (!userDoc.exists()) {
      throw new Error("User document not found");
    }

    const userData = userDoc.data();
    if (!userData.coupleId) {
      throw new Error("User is not paired");
    }

    // Get couple document to get member IDs
    const coupleDoc = await getDoc(doc(db, "couples", userData.coupleId));
    if (!coupleDoc.exists()) {
      throw new Error("Couple document not found");
    }

    const coupleData = coupleDoc.data();
    const memberIds = coupleData.members || [];

    // Get user names for each member
    const userNames: { [userId: string]: string } = {};

    for (const memberId of memberIds) {
      const memberDoc = await getDoc(doc(db, "users", memberId));
      if (memberDoc.exists()) {
        const memberData = memberDoc.data();
        userNames[memberId] = memberData.displayName || "Unknown";
      }
    }

    return { memberIds, userNames };
  } catch (error: any) {
    console.error("Error getting couple members:", error);
    throw new Error(error.message || "Failed to get couple members");
  }
}

// Get pending games
export async function getPendingGames(): Promise<PendingGame[]> {
  if (!auth.currentUser) {
    throw new Error("Please log in to view games");
  }

  // Wait a moment to ensure authentication is fully loaded
  await new Promise((resolve) => setTimeout(resolve, 100));

  try {
    // Get user's coupleId
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (!userDoc.exists()) {
      return [];
    }

    const userData = userDoc.data();
    if (!userData.coupleId) {
      return [];
    }

    // Get pending game sessions where current user hasn't answered yet (temporary fix: remove orderBy to avoid composite index requirement)
    const sessionsQuery = query(
      collection(db, "couples", userData.coupleId, "game_sessions"),
      where("completed", "==", false)
    );

    let sessionsSnapshot;
    try {
      sessionsSnapshot = await getDocs(sessionsQuery);
    } catch (error: any) {
      // Handle permission errors gracefully (e.g., when user unpairs)
      if (error.code === "permission-denied") {
        console.log(
          "User no longer has access to game sessions (likely unpaired)"
        );
        return [];
      }
      throw error; // Re-throw other errors
    }

    const pendingGames: PendingGame[] = [];

    sessionsSnapshot.forEach((doc) => {
      const sessionData = doc.data();
      const answers = sessionData.answers || {};

      // Check if current user hasn't answered (regardless of who initiated)
      if (!answers[auth.currentUser!.uid]) {
        pendingGames.push({
          sessionId: doc.id,
          type: sessionData.type,
          questionText: sessionData.questionText,
          choice1: sessionData.choice1,
          choice2: sessionData.choice2,
          questionId: sessionData.questionId,
          initiatorUid: sessionData.initiatorUid,
          isPurchased: sessionData.isPurchased || false,
        });
      }
    });

    // Sort by createdAt in memory (newest first) since we removed orderBy to avoid composite index
    pendingGames.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    return pendingGames;
  } catch (error: any) {
    console.error("Error getting pending games:", error);
    return [];
  }
}

// Get game history
export async function getGameHistory(): Promise<GameHistoryItem[]> {
  if (!auth.currentUser) {
    throw new Error("Please log in to view history");
  }

  try {
    // Get user's coupleId
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (!userDoc.exists()) {
      return [];
    }

    const userData = userDoc.data();
    if (!userData.coupleId) {
      return [];
    }

    // Get all game sessions (both completed and pending)
    const sessionsQuery = query(
      collection(db, "couples", userData.coupleId, "game_sessions"),
      limit(50)
    );

    let sessionsSnapshot;
    let coupleDoc;

    try {
      sessionsSnapshot = await getDocs(sessionsQuery);
      // Get couple info for member names
      coupleDoc = await getDoc(doc(db, "couples", userData.coupleId));
    } catch (error: any) {
      // Handle permission errors gracefully (e.g., when user unpairs)
      if (error.code === "permission-denied") {
        console.log(
          "User no longer has access to game sessions (likely unpaired)"
        );
        return [];
      }
      throw error; // Re-throw other errors
    }

    const gameHistory: GameHistoryItem[] = [];
    const coupleData = coupleDoc.data();
    const members = coupleData?.members || [];

    // Get member names
    const memberNames: Record<string, string> = {};
    for (const memberId of members) {
      const memberDoc = await getDoc(doc(db, "users", memberId));
      if (memberDoc.exists()) {
        memberNames[memberId] = memberDoc.data().displayName || "Unknown";
      }
    }

    sessionsSnapshot.forEach((doc) => {
      const sessionData = doc.data();
      const answers = sessionData.answers || {};
      const currentUserHasAnswered = answers[auth.currentUser!.uid];
      const isCompleted = sessionData.completed || false;

      gameHistory.push({
        sessionId: doc.id,
        type: sessionData.type,
        questionText: sessionData.questionText,
        choice1: sessionData.choice1,
        choice2: sessionData.choice2,
        answers: answers,
        createdAt: sessionData.createdAt,
        malaysiaDate: sessionData.malaysiaDate,
        memberNames,
        completed: isCompleted,
        canAnswer: !currentUserHasAnswered && !isCompleted, // User can answer if they haven't answered and game isn't completed
        isPurchased: sessionData.isPurchased || false,
      });
    });

    // Sort by createdAt in memory (newest first) since we removed orderBy to avoid composite index
    gameHistory.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    return gameHistory;
  } catch (error: any) {
    console.error("Error getting game history:", error);
    throw new Error(error.message || "Failed to load game history");
  }
}

// Unpair couple
export async function unpairCouple(): Promise<{ success: boolean }> {
  if (!auth.currentUser) {
    throw new Error("Please log in to unpair");
  }

  try {
    // First, get the couple information outside the transaction
    const userRef = doc(db, "users", auth.currentUser.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User document not found");
    }

    const userData = userDoc.data();
    if (!userData.coupleId) {
      throw new Error("You are not currently paired");
    }

    const coupleId = userData.coupleId;

    // Delete all game sessions first (outside transaction due to query limitations)
    try {
      const sessionsQuery = query(
        collection(db, "couples", coupleId, "game_sessions")
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);

      // Delete all game sessions in batches
      const batch = writeBatch(db);
      sessionsSnapshot.docs.forEach((sessionDoc) => {
        batch.delete(sessionDoc.ref);
      });

      if (!sessionsSnapshot.empty) {
        await batch.commit();
        console.log(`Deleted ${sessionsSnapshot.size} game sessions`);
      }
    } catch (error) {
      console.warn(
        "Could not delete game sessions (user may not have permission):",
        error
      );
      // Continue with unpairing even if game sessions can't be deleted
    }

    // Now handle the main couple document and user updates in a transaction
    return await runTransaction(db, async (transaction) => {
      // Get couple document
      const coupleRef = doc(db, "couples", coupleId);
      const coupleDoc = await transaction.get(coupleRef);

      if (!coupleDoc.exists()) {
        throw new Error("Couple document not found");
      }

      const coupleData = coupleDoc.data();
      const members = coupleData?.members || [];

      // Remove coupleId from all members
      for (const memberId of members) {
        const memberRef = doc(db, "users", memberId);
        transaction.update(memberRef, {
          coupleId: null,
        });
      }

      // Delete the couple document
      transaction.delete(coupleRef);

      return { success: true };
    });
  } catch (error: any) {
    console.error("Error unpairing couple:", error);
    throw new Error(error.message || "Failed to unpair");
  }
}

// Check if user is paired
export async function checkPairingStatus(): Promise<{
  isPaired: boolean;
  coupleId?: string;
  partnerName?: string;
  anniversary?: string;
  partnerOutfit?: {
    hair: string;
    top: string;
    bottom: string;
    accessory?: string;
    shoe?: string;
  };
}> {
  try {
    if (!auth.currentUser) {
      return { isPaired: false };
    }

    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (!userDoc.exists()) {
      return { isPaired: false };
    }

    const userData = userDoc.data();
    if (!userData.coupleId) {
      return { isPaired: false };
    }

    // Get couple info
    const coupleDoc = await getDoc(doc(db, "couples", userData.coupleId));
    if (!coupleDoc.exists()) {
      return { isPaired: false };
    }

    const coupleData = coupleDoc.data();
    const members = coupleData.members || [];
    const partnerId = members.find(
      (id: string) => id !== auth.currentUser?.uid
    );

    let partnerName = "Partner";
    let partnerOutfit = {
      hair: "hair_space-bun_black",
      top: "top_basic_white",
      bottom: "bottom_basic_white",
    };

    if (partnerId) {
      const partnerDoc = await getDoc(doc(db, "users", partnerId));
      if (partnerDoc.exists()) {
        const partnerData = partnerDoc.data();
        partnerName = partnerData.displayName || "Partner";

        // Get partner's outfit or use default
        if (partnerData.selectedOutfit) {
          partnerOutfit = {
            hair: partnerData.selectedOutfit.hair || "hair_space-bun_black",
            top: partnerData.selectedOutfit.top || "top_basic_white",
            bottom: partnerData.selectedOutfit.bottom || "bottom_basic_white",
            accessory: partnerData.selectedOutfit.accessory,
            shoe: partnerData.selectedOutfit.shoe,
          };
        }
      }
    }

    return {
      isPaired: true,
      coupleId: userData.coupleId,
      partnerName,
      anniversary: coupleData.anniversary,
      partnerOutfit,
    };
  } catch (error) {
    console.error("Error checking pairing status:", error);
    return { isPaired: false };
  }
}

// Listen to couple game state changes (for real-time updates)
export function subscribeToCoupleGameState(
  callback: (gameState: CoupleGameState | null) => void
): () => void {
  if (!auth.currentUser) {
    callback(null);
    return () => {};
  }

  let currentCoupleListener: (() => void) | null = null;

  // Listen to user document for coupleId changes
  const unsubscribeUser = onSnapshot(
    doc(db, "users", auth.currentUser.uid),
    (userDoc) => {
      // Clean up any existing couple listener
      if (currentCoupleListener) {
        currentCoupleListener();
        currentCoupleListener = null;
      }

      if (!userDoc.exists()) {
        callback(null);
        return;
      }

      const userData = userDoc.data();
      if (!userData.coupleId) {
        callback(null);
        return;
      }

      // Set up new couple document listener
      currentCoupleListener = onSnapshot(
        doc(db, "couples", userData.coupleId),
        async (coupleDoc) => {
          if (!coupleDoc.exists()) {
            callback(null);
            return;
          }

          // Get individual points from user document
          let userPoints = 0;
          try {
            const currentUserPoints = await getDoc(
              doc(db, "users", auth.currentUser!.uid)
            );
            if (currentUserPoints.exists()) {
              userPoints = currentUserPoints.data().points || 0;
            }
          } catch (error) {
            console.error("Error fetching user points:", error);
          }

          const coupleData = coupleDoc.data();
          callback({
            dailyRemaining: coupleData.dailyRemaining || 0,
            ticketsRemaining: coupleData.ticketsRemaining || 0,
            streak: coupleData.streak || 0,
            points: userPoints,
            hasPendingDaily: coupleData.hasPendingDaily || false,
            hasPendingChoice: coupleData.hasPendingChoice || 0,
          });
        },
        (error) => {
          // Handle permission errors gracefully (e.g., when user unpairs)
          if (error.code === "permission-denied") {
            console.log(
              "User no longer has access to couple state (likely unpaired)"
            );
          } else {
            console.error("Error listening to couple state:", error);
          }
          callback(null);
        }
      );
    },
    (error) => {
      // Handle permission errors gracefully (e.g., when user unpairs)
      if (error.code === "permission-denied") {
        console.log(
          "User no longer has access to user document (likely unpaired)"
        );
      } else {
        console.error("Error listening to user doc:", error);
      }
      callback(null);
    }
  );

  // Return cleanup function that unsubscribes both listeners
  return () => {
    if (currentCoupleListener) {
      currentCoupleListener();
    }
    unsubscribeUser();
  };
}
