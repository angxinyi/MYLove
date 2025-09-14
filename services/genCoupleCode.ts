import { auth, db } from "@/firebase/config";
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

export interface GenerateCodeResult {
  code: string;
  expiresAt: string;
}

// Generate a random 6-character code
export function generateRandomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Check if a code already exists
async function codeExists(code: string): Promise<boolean> {
  const codeDoc = await getDoc(doc(db, "couple_invites", code));
  return codeDoc.exists();
}

export async function generateCoupleCode(): Promise<GenerateCodeResult> {
  if (!auth.currentUser) {
    throw new Error("Please log in to generate a code");
  }

  try {
    return await runTransaction(db, async (transaction) => {
      // Check if user is already paired
      const userRef = doc(db, "users", auth.currentUser!.uid);
      const userDoc = await transaction.get(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.coupleId) {
          throw new Error("You are already paired with someone");
        }
      }

      // Generate unique code
      let code: string;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        code = generateRandomCode();
        attempts++;

        if (attempts > maxAttempts) {
          throw new Error("Failed to generate unique code. Please try again");
        }
      } while (await codeExists(code));

      // Create expiration time (30 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      // Save the invite code
      const inviteRef = doc(db, "couple_invites", code);
      const inviteData = {
        createdBy: auth.currentUser!.uid,
        createdAt: serverTimestamp(),
        expiresAt: expiresAt,
        used: false,
      };

      transaction.set(inviteRef, inviteData);

      return {
        code,
        expiresAt: expiresAt.toISOString(),
      };
    });
  } catch (error: any) {
    console.error("Error generating couple code:", error);
    throw new Error(error.message || "Failed to generate couple code");
  }
}
