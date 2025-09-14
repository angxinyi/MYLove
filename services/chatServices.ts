import { auth, db } from "@/firebase/config";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

// Types
export type LangCode = "en" | "zh" | "ms" | "ta";

export type UserProfile = {
  uid: string;
  displayName: string;
  photoURL?: string;
  defaultLanguage: LangCode;
  coupleId?: string;
};

export type Message = {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  coupleId: string;
  createdAt: Timestamp;
  detectedLang?: string;
  translation: string; // Single translation string, empty "" if no translation needed
  isSystemMessage?: boolean;
  systemMessageType?: string;
};

// Translation quota tracking
let translationCount = 0;
const DAILY_TRANSLATION_LIMIT = 50;

// Microsoft Translator API config
const TRANSLATOR_CONFIG = {
  endpoint: "https://api.cognitive.microsofttranslator.com",
  key: "4wvWsefTnaWai6i8CL64awd8wVgYNEJtml0qkGOnIemtdG8DCh4zJQQJ99BIACqBBLyXJ3w3AAAbACOGzMK2",
  region: "southeastasia",
};

// Language detection using Microsoft Translator API
async function detectLanguageAPI(text: string): Promise<LangCode> {
  try {
    const apiConfig = {
      endpoint: "https://api.cognitive.microsofttranslator.com",
      key: "4wvWsefTnaWai6i8CL64awd8wVgYNEJtml0qkGOnIemtdG8DCh4zJQQJ99BIACqBBLyXJ3w3AAAbACOGzMK2",
      region: "southeastasia",
    };

    const response = await fetch(
      `${apiConfig.endpoint}/detect?api-version=3.0`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": apiConfig.key,
          "Ocp-Apim-Subscription-Region": apiConfig.region,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify([{ text }]),
      }
    );

    if (!response.ok) {
      throw new Error(`Language detection API error: ${response.status}`);
    }

    const result = await response.json();
    const detectedLang = result[0]?.language;

    // Map Microsoft's language codes to our codes
    let mappedLang: LangCode;
    switch (detectedLang) {
      case "zh":
      case "zh-cn":
      case "zh-tw":
      case "zh-Hans":
      case "zh-Hant":
        mappedLang = "zh";
        break;
      case "ta":
        mappedLang = "ta";
        break;
      case "ms":
        mappedLang = "ms";
        break;
      case "en":
      default:
        mappedLang = "en";
        break;
    }

    return mappedLang;
  } catch (error) {
    console.error("Language detection API error:", error);
    const fallbackResult = detectLanguageFallback(text);
    return fallbackResult;
  }
}

// Fallback language detection function (simple patterns)
function detectLanguageFallback(text: string): LangCode {
  // Simple language detection based on character patterns
  if (/[\u4e00-\u9fff]/.test(text)) return "zh"; // Chinese characters
  if (/[\u0b80-\u0bff]/.test(text)) return "ta"; // Tamil characters

  // Common Malay words (basic detection)
  const malayWords = [
    "saya",
    "anda",
    "dengan",
    "untuk",
    "dalam",
    "ini",
    "itu",
    "yang",
    "adalah",
    "ada",
    "selamat",
    "pagi",
    "petang",
    "malam",
    "terima",
    "kasih",
    "tolong",
    "maaf",
    "nama",
  ];
  const lowerText = text.toLowerCase();
  const malayMatches = malayWords.filter((word) =>
    lowerText.includes(word)
  ).length;

  if (malayMatches >= 1) return "ms";

  return "en"; // Default to English
}

// Check message collection existence and initialize
export async function ensureMessageCollectionExists(
  coupleId: string
): Promise<void> {
  try {
    const messagesRef = collection(db, "couples", coupleId, "messages");
    const snapshot = await getDocs(query(messagesRef, limit(1)));

    if (snapshot.empty) {
      // Add a welcome system message
      const currentUserId = auth.currentUser?.uid;
      if (currentUserId) {
        await addDoc(messagesRef, {
          text: "Welcome to your couple chat! 💕",
          senderId: currentUserId, // Use current user ID instead of 'system'
          senderName: "MyLove System",
          coupleId: coupleId,
          createdAt: serverTimestamp(),
          detectedLang: "en",
          translation: "", // No translation for system messages
          isSystemMessage: true,
          systemMessageType: "welcome",
        });
      }
    } else {
    }
  } catch (error) {
    console.error("Error ensuring message collection exists:", error);
  }
}

// Get user profile by UID
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid: uid,
        displayName: data.displayName || "User",
        photoURL: data.photoURL,
        defaultLanguage: data.defaultLanguage || "en",
        coupleId: data.coupleId,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

// Real-time listener for user profile changes (language switching)
export function subscribeToUserProfile(
  userId: string,
  callback: (profile: UserProfile | null) => void
): () => void {
  if (!userId) {
    callback(null);
    return () => {};
  }

  const userDocRef = doc(db, "users", userId);

  // Set up Firestore listener
  const unsubscribe = onSnapshot(
    userDocRef,
    (userDoc) => {
      if (userDoc.exists()) {
        const data = userDoc.data();
        const profile: UserProfile = {
          uid: userId,
          displayName: data.displayName || "User",
          photoURL: data.photoURL,
          defaultLanguage: data.defaultLanguage || "en",
          coupleId: data.coupleId,
        };
        callback(profile);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("Error listening to user profile:", error);
      callback(null);
    }
  );

  return unsubscribe;
}

// Translation API call
async function callTranslationAPI(
  text: string,
  targetLang: LangCode
): Promise<string> {
  // Check quota
  if (translationCount >= DAILY_TRANSLATION_LIMIT) {
    console.warn("Translation quota exceeded");
    return text; // Return original if quota exceeded
  }

  // Define config locally to avoid any scope issues
  const apiConfig = {
    endpoint: "https://api.cognitive.microsofttranslator.com",
    key: "4wvWsefTnaWai6i8CL64awd8wVgYNEJtml0qkGOnIemtdG8DCh4zJQQJ99BIACqBBLyXJ3w3AAAbACOGzMK2",
    region: "southeastasia",
  };

  try {
    const response = await fetch(
      `${apiConfig.endpoint}/translate?api-version=3.0&to=${targetLang}`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": apiConfig.key,
          "Ocp-Apim-Subscription-Region": apiConfig.region,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify([{ text }]),
      }
    );

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const result = await response.json();
    const translatedText = result[0]?.translations[0]?.text || text;

    translationCount++;

    return translatedText;
  } catch (error) {
    console.error("Translation API error:", error);
    return text; // Return original on error
  }
}

// Separate translation function to be called after message is sent
export async function translateMessageIfNeeded(
  message: Message,
  viewerLang: LangCode
): Promise<void> {
  // Skip if already translated
  if (message.translation && message.translation !== "") {
    return;
  }

  // Skip system messages
  if (message.isSystemMessage) {
    return;
  }

  // Skip if no detected language
  if (!message.detectedLang) {
    return;
  }

  // Skip if same language
  if (message.detectedLang === viewerLang) {
    return;
  }

  // Check quota before proceeding
  if (translationCount >= DAILY_TRANSLATION_LIMIT) {
    console.warn("Translation quota exceeded");
    return;
  }

  try {
    const messageRef = doc(
      db,
      "couples",
      message.coupleId,
      "messages",
      message.id
    );

    // Translate the message
    const translatedText = await callTranslationAPI(message.text, viewerLang);

    // Only update if translation is different from original
    if (translatedText !== message.text) {
      await updateDoc(messageRef, {
        translation: translatedText,
      });
    } else {
    }
  } catch (error) {
    console.error("Error translating message:", error);
  }
}

// Get partner profile for translation target language
async function getPartnerLanguage(
  coupleId: string,
  currentUserId: string
): Promise<LangCode> {
  try {
    const coupleDoc = await getDoc(doc(db, "couples", coupleId));
    if (!coupleDoc.exists()) return "en";

    const members = coupleDoc.data().members || [];
    const partnerUid = members.find((uid: string) => uid !== currentUserId);

    if (!partnerUid) return "en";

    const partnerProfile = await getUserProfile(partnerUid);
    return partnerProfile?.defaultLanguage || "en";
  } catch (error) {
    console.error("Error getting partner language:", error);
    return "en";
  }
}

// Listen to messages in real-time
export function subscribeToMessages(
  coupleId: string,
  callback: (messages: Message[]) => void,
  messageLimit: number = 25 // Default to last 25 messages
): () => void {
  const messagesRef = collection(db, "couples", coupleId, "messages");
  const messagesQuery = query(
    messagesRef,
    orderBy("createdAt", "desc"), // Get newest first
    limit(messageLimit) // Limit number of messages
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          text: data.text,
          senderId: data.senderId,
          senderName: data.senderName,
          coupleId: data.coupleId,
          createdAt: data.createdAt,
          detectedLang: data.detectedLang,
          translation: data.translation || "",
          isSystemMessage: data.isSystemMessage || false,
          systemMessageType: data.systemMessageType,
        } as Message);
      });

      // Reverse to show oldest first (normal chat order)
      callback(messages.reverse());
    },
    (error) => {
      console.error("Error listening to messages:", error);
    }
  );
}

// Send message
export async function sendMessage(
  coupleId: string,
  text: string,
  isSystemMessage: boolean = false,
  systemMessageType?: string
): Promise<void> {
  if (!auth.currentUser || !text.trim()) return;

  try {
    const messagesRef = collection(db, "couples", coupleId, "messages");

    let messageData: any = {
      text: text.trim(),
      senderId: auth.currentUser.uid,
      senderName: auth.currentUser.displayName || "User",
      coupleId: coupleId,
      createdAt: serverTimestamp(),
      isSystemMessage: isSystemMessage,
    };

    if (isSystemMessage) {
      // For system messages, don't detect language or translate
      messageData.detectedLang = "en";
      messageData.translation = "";
      if (systemMessageType) {
        messageData.systemMessageType = systemMessageType;
      }
    } else {
      // For regular messages, detect language
      const detectedLang = await detectLanguageAPI(text.trim());
      messageData.detectedLang = detectedLang;
      messageData.translation = ""; // Initialize empty translation
    }

    await addDoc(messagesRef, messageData);
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

// Get translation quota status
export function getTranslationQuotaStatus() {
  return {
    used: translationCount,
    limit: DAILY_TRANSLATION_LIMIT,
    remaining: Math.max(0, DAILY_TRANSLATION_LIMIT - translationCount),
    percentage: (translationCount / DAILY_TRANSLATION_LIMIT) * 100,
  };
}

// Send language change notification (for compatibility with settings page)
export async function sendLanguageChangeNotification(
  coupleId: string,
  userDisplayName: string,
  newLanguage: LangCode
): Promise<void> {
  if (!auth.currentUser) {
    throw new Error("User not authenticated");
  }

  // Get language display name
  const languageNames = {
    en: "English",
    zh: "Mandarin",
    ms: "Malay",
    ta: "Tamil",
  };
  const languageName = languageNames[newLanguage] || newLanguage;

  try {
    // Create system message about language change
    const messagesRef = collection(db, "couples", coupleId, "messages");
    await addDoc(messagesRef, {
      text: `${userDisplayName} has changed their language to ${languageName}`,
      senderId: auth.currentUser.uid,
      senderName: userDisplayName,
      coupleId: coupleId,
      createdAt: serverTimestamp(),
      detectedLang: "en",
      translation: "",
      isSystemMessage: true,
      systemMessageType: "language_change",
    });
  } catch (error) {
    console.error("Error sending language change notification:", error);
  }
}

// Clear profile cache
export async function clearProfileCache(): Promise<void> {
  try {
    // In the test version, we don't use AsyncStorage cache
    // This is a no-op function for compatibility
  } catch (error) {
    console.error("Error clearing profile cache:", error);
  }
}
