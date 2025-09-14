import { auth, db } from "@/firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { sendMessage } from "./chatServices-test";
import { checkPairingStatus } from "./coupleLogic";

// Rule-based date recommendations based on love language combinations
export async function getTailoredDate(): Promise<{
  success: boolean;
  date?: { text: string; love_language: string[] };
  message?: string;
}> {
  if (!auth.currentUser) {
    throw new Error("Must be authenticated");
  }

  try {
    // Check if user is paired
    const pairingStatus = await checkPairingStatus();
    if (!pairingStatus.isPaired || !pairingStatus.coupleId) {
      return {
        success: false,
        message: "You must be paired with a partner to get tailored dates",
      };
    }

    // Get both users' love languages
    const coupleDoc = await getDoc(doc(db, "couples", pairingStatus.coupleId));
    if (!coupleDoc.exists()) {
      return { success: false, message: "Couple data not found" };
    }

    const coupleData = coupleDoc.data();
    const members = coupleData.members;

    // Get love languages for both users
    const userPromises = members.map((uid: string) =>
      getDoc(doc(db, "users", uid))
    );
    const userDocs = await Promise.all(userPromises);

    const loveLanguages = userDocs
      .map((userDoc) => {
        if (userDoc.exists()) {
          return userDoc.data().loveLanguage;
        }
        return null;
      })
      .filter((lang) => lang !== null);

    if (loveLanguages.length !== 2) {
      return {
        success: false,
        message: "Both partners need to complete the love language quiz first",
      };
    }

    // Use rule-based logic to determine the combination
    const combinedLoveLanguages = getLoveLanguageCombination(
      loveLanguages[0],
      loveLanguages[1]
    );

    // Query for dates matching this specific combination
    const q = query(
      collection(db, "date_ideas"),
      where("love_language", "==", combinedLoveLanguages),
      where("active", "==", true)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return {
        success: false,
        message: "No tailored dates found for your love language combination",
      };
    }

    // Pick random date from matching results
    const docs = snapshot.docs;
    const randomIndex = Math.floor(Math.random() * docs.length);
    const selectedDoc = docs[randomIndex];

    const dateIdea = {
      text: selectedDoc.data().text,
      love_language: selectedDoc.data().love_language,
    };

    // Get current user's display name for chat message
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    const displayName = userData.displayName || userData.name || "Someone";

    // Send system message to chat notifying both users
    const systemMessage = `${displayName} got a tailored date idea:\n${dateIdea.text}`;

    await sendMessage(
      pairingStatus.coupleId!,
      systemMessage,
      true, // isSystemMessage
      "date_redeemed" // systemMessageType
    );

    return {
      success: true,
      date: dateIdea,
    };
  } catch (error) {
    console.error("Error getting tailored date:", error);
    throw error;
  }
}

// Get surprise date from any category regardless of love language
export async function getSurpriseDate(): Promise<{
  success: boolean;
  date?: { text: string; love_language: string[] };
  message?: string;
}> {
  if (!auth.currentUser) {
    throw new Error("Must be authenticated");
  }

  try {
    // Check if user is paired
    const pairingStatus = await checkPairingStatus();
    if (!pairingStatus.isPaired) {
      return {
        success: false,
        message: "You must be paired with a partner to get surprise dates",
      };
    }

    // Get all active dates regardless of love language
    const q = query(collection(db, "date_ideas"), where("active", "==", true));

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, message: "No dates available at the moment" };
    }

    // Pick completely random date from all dates
    const docs = snapshot.docs;
    const randomIndex = Math.floor(Math.random() * docs.length);
    const selectedDoc = docs[randomIndex];

    const dateIdea = {
      text: selectedDoc.data().text,
      love_language: selectedDoc.data().love_language,
    };

    // Get current user's display name for chat message
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    const displayName = userData.displayName || userData.name || "Someone";

    // Send system message to chat notifying both users
    const systemMessage = `${displayName} got a surprise date idea:\n${dateIdea.text}`;

    await sendMessage(
      pairingStatus.coupleId!,
      systemMessage,
      true, // isSystemMessage
      "date_redeemed" // systemMessageType
    );

    return {
      success: true,
      date: dateIdea,
    };
  } catch (error) {
    console.error("Error getting surprise date:", error);
    throw error;
  }
}

// Rule-based function to determine love language combination using if/else logic
function getLoveLanguageCombination(lang1: string, lang2: string): string[] {
  const loveLanguages = [
    "Quality Time",
    "Words of Affirmation",
    "Acts of Service",
    "Receiving Gifts",
    "Physical Touch",
  ];

  // Normalize inputs
  const normalizedLang1 = loveLanguages.find((lang) => lang === lang1);
  const normalizedLang2 = loveLanguages.find((lang) => lang === lang2);

  if (!normalizedLang1 || !normalizedLang2) {
    throw new Error("Invalid love language provided");
  }

  // Rule-based matching using if/else logic
  // Quality Time combinations
  if (
    normalizedLang1 === "Quality Time" &&
    normalizedLang2 === "Quality Time"
  ) {
    return ["Quality Time", "Quality Time"];
  } else if (
    (normalizedLang1 === "Quality Time" &&
      normalizedLang2 === "Words of Affirmation") ||
    (normalizedLang1 === "Words of Affirmation" &&
      normalizedLang2 === "Quality Time")
  ) {
    return ["Quality Time", "Words of Affirmation"];
  } else if (
    (normalizedLang1 === "Quality Time" &&
      normalizedLang2 === "Acts of Service") ||
    (normalizedLang1 === "Acts of Service" &&
      normalizedLang2 === "Quality Time")
  ) {
    return ["Acts of Service", "Quality Time"];
  } else if (
    (normalizedLang1 === "Quality Time" &&
      normalizedLang2 === "Receiving Gifts") ||
    (normalizedLang1 === "Receiving Gifts" &&
      normalizedLang2 === "Quality Time")
  ) {
    return ["Quality Time", "Receiving Gifts"];
  } else if (
    (normalizedLang1 === "Quality Time" &&
      normalizedLang2 === "Physical Touch") ||
    (normalizedLang1 === "Physical Touch" && normalizedLang2 === "Quality Time")
  ) {
    return ["Quality Time", "Physical Touch"];
  }

  // Words of Affirmation combinations
  else if (
    normalizedLang1 === "Words of Affirmation" &&
    normalizedLang2 === "Words of Affirmation"
  ) {
    return ["Words of Affirmation", "Words of Affirmation"];
  } else if (
    (normalizedLang1 === "Words of Affirmation" &&
      normalizedLang2 === "Acts of Service") ||
    (normalizedLang1 === "Acts of Service" &&
      normalizedLang2 === "Words of Affirmation")
  ) {
    return ["Acts of Service", "Words of Affirmation"];
  } else if (
    (normalizedLang1 === "Words of Affirmation" &&
      normalizedLang2 === "Receiving Gifts") ||
    (normalizedLang1 === "Receiving Gifts" &&
      normalizedLang2 === "Words of Affirmation")
  ) {
    return ["Receiving Gifts", "Words of Affirmation"];
  } else if (
    (normalizedLang1 === "Words of Affirmation" &&
      normalizedLang2 === "Physical Touch") ||
    (normalizedLang1 === "Physical Touch" &&
      normalizedLang2 === "Words of Affirmation")
  ) {
    return ["Words of Affirmation", "Physical Touch"];
  }

  // Acts of Service combinations
  else if (
    normalizedLang1 === "Acts of Service" &&
    normalizedLang2 === "Acts of Service"
  ) {
    return ["Acts of Service", "Acts of Service"];
  } else if (
    (normalizedLang1 === "Acts of Service" &&
      normalizedLang2 === "Receiving Gifts") ||
    (normalizedLang1 === "Receiving Gifts" &&
      normalizedLang2 === "Acts of Service")
  ) {
    return ["Acts of Service", "Receiving Gifts"];
  } else if (
    (normalizedLang1 === "Acts of Service" &&
      normalizedLang2 === "Physical Touch") ||
    (normalizedLang1 === "Physical Touch" &&
      normalizedLang2 === "Acts of Service")
  ) {
    return ["Acts of Service", "Physical Touch"];
  }

  // Receiving Gifts combinations
  else if (
    normalizedLang1 === "Receiving Gifts" &&
    normalizedLang2 === "Receiving Gifts"
  ) {
    return ["Receiving Gifts", "Receiving Gifts"];
  } else if (
    (normalizedLang1 === "Receiving Gifts" &&
      normalizedLang2 === "Physical Touch") ||
    (normalizedLang1 === "Physical Touch" &&
      normalizedLang2 === "Receiving Gifts")
  ) {
    return ["Receiving Gifts", "Physical Touch"];
  }

  // Physical Touch combinations
  else if (
    normalizedLang1 === "Physical Touch" &&
    normalizedLang2 === "Physical Touch"
  ) {
    return ["Physical Touch", "Physical Touch"];
  }

  // Fallback (should never reach here with valid inputs)
  else {
    throw new Error(
      `Unhandled love language combination: ${normalizedLang1} + ${normalizedLang2}`
    );
  }
}
