import { auth, db } from "@/firebase/config";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";

export interface MiniGameQuestion {
  id: string;
  text: string;
  type: "daily_question" | "choice_question" | "would_rather" | "likely_to";
  choices?: string[];
  active: boolean;
  rand: number;
}

export interface MiniGameSession {
  id: string;
  coupleId: string;
  questionId: string;
  type: string;
  question: string;
  choices?: string[];
  answers: Record<string, any>;
  createdAt: any;
  completedAt?: any;
  initiatorUid: string;
}

// Start a new mini game session
export async function startMiniGameSession(
  type: "daily_question" | "choice_question" | "would_rather" | "likely_to"
): Promise<{
  success: boolean;
  session?: MiniGameSession;
  message?: string;
}> {
  if (!auth.currentUser) {
    throw new Error("Must be authenticated");
  }

  const uid = auth.currentUser.uid;

  try {
    // Check if user is paired
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const userData = userDoc.data();
    if (!userData.coupleId) {
      return {
        success: false,
        message: "You must be paired with a partner to play mini games",
      };
    }

    // Get random question of the specified type
    const question = await getRandomQuestion(type);
    if (!question) {
      return {
        success: false,
        message: "No questions available for this game type",
      };
    }

    // Create game session
    const sessionData = {
      coupleId: userData.coupleId,
      questionId: question.id,
      type: question.type,
      question: question.text,
      choices: question.choices || [],
      answers: {},
      createdAt: serverTimestamp(),
      initiatorUid: uid,
    };

    const sessionsRef = collection(
      db,
      "couples",
      userData.coupleId,
      "game_sessions"
    );
    const sessionDoc = await addDoc(sessionsRef, sessionData);

    const session: MiniGameSession = {
      id: sessionDoc.id,
      ...sessionData,
      createdAt: new Date(),
    };

    return {
      success: true,
      session,
      message: "Mini game session started successfully!",
    };
  } catch (error) {
    console.error("Error starting mini game session:", error);
    throw error;
  }
}

// Get random question from database
async function getRandomQuestion(
  type: "daily_question" | "choice_question" | "would_rather" | "likely_to"
): Promise<MiniGameQuestion | null> {
  try {
    let collectionName = "";
    switch (type) {
      case "daily_question":
        collectionName = "daily_questions";
        break;
      case "choice_question":
        collectionName = "choice_questions";
        break;
      case "would_rather":
        collectionName = "would_rather_questions";
        break;
      case "likely_to":
        collectionName = "likely_to_questions";
        break;
      default:
        return null;
    }

    const q = query(
      collection(db, collectionName),
      where("active", "==", true),
      orderBy("rand"),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      text: doc.data().text,
      type: type,
      choices: doc.data().choices || [],
      active: doc.data().active,
      rand: doc.data().rand,
    };
  } catch (error) {
    console.error("Error getting random question:", error);
    return null;
  }
}

// Submit answer to mini game session
export async function submitMiniGameAnswer(
  sessionId: string,
  coupleId: string,
  answer: any
): Promise<{
  success: boolean;
  message?: string;
}> {
  if (!auth.currentUser) {
    throw new Error("Must be authenticated");
  }

  const uid = auth.currentUser.uid;

  try {
    const sessionRef = doc(db, "couples", coupleId, "game_sessions", sessionId);

    await runTransaction(db, async (transaction) => {
      const sessionDoc = await transaction.get(sessionRef);

      if (!sessionDoc.exists()) {
        throw new Error("Game session not found");
      }

      const sessionData = sessionDoc.data();
      const answers = sessionData.answers || {};

      // Add user's answer
      answers[uid] = {
        answer,
        submittedAt: new Date(),
      };

      // Check if both partners have answered
      const coupleDoc = await transaction.get(doc(db, "couples", coupleId));
      const members = coupleDoc.data()?.members || [];
      const allAnswered = members.every(
        (memberId: string) => answers[memberId]
      );

      const updateData: any = {
        answers,
      };

      if (allAnswered) {
        updateData.completedAt = serverTimestamp();
      }

      transaction.update(sessionRef, updateData);
    });

    return {
      success: true,
      message: "Answer submitted successfully!",
    };
  } catch (error) {
    console.error("Error submitting mini game answer:", error);
    throw error;
  }
}

// Get mini game session details
export async function getMiniGameSession(
  sessionId: string,
  coupleId: string
): Promise<MiniGameSession | null> {
  try {
    const sessionDoc = await getDoc(
      doc(db, "couples", coupleId, "game_sessions", sessionId)
    );

    if (!sessionDoc.exists()) {
      return null;
    }

    return {
      id: sessionDoc.id,
      ...sessionDoc.data(),
    } as MiniGameSession;
  } catch (error) {
    console.error("Error getting mini game session:", error);
    return null;
  }
}

// Get recent mini game sessions for a couple
export async function getRecentMiniGameSessions(
  coupleId: string,
  limitCount: number = 10
): Promise<MiniGameSession[]> {
  try {
    const q = query(
      collection(db, "couples", coupleId, "game_sessions"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const sessions: MiniGameSession[] = [];

    snapshot.forEach((doc) => {
      sessions.push({
        id: doc.id,
        ...doc.data(),
      } as MiniGameSession);
    });

    return sessions;
  } catch (error) {
    console.error("Error getting recent mini game sessions:", error);
    return [];
  }
}
