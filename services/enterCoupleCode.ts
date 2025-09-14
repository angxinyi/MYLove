import { auth, db } from "@/firebase/config";
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

export interface ValidateCodeResult {
  inviterUid: string;
  inviterName: string;
}

export interface AcceptInviteResult {
  coupleId: string;
  anniversary: string;
}

export async function validateCoupleCode(
  code: string
): Promise<ValidateCodeResult> {
  if (!auth.currentUser) {
    throw new Error("Please log in to enter a code");
  }

  if (!code || code.length !== 6) {
    throw new Error("Please enter a valid code");
  }

  try {
    // Check if current user is already paired
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.coupleId) {
        throw new Error("You are already paired with someone");
      }
    }

    // Get invite document
    const inviteDoc = await getDoc(doc(db, "couple_invites", code));
    if (!inviteDoc.exists()) {
      throw new Error("Invalid code. Please check and try again");
    }

    const inviteData = inviteDoc.data();

    // Check if code has expired
    const expiresAt =
      inviteData.expiresAt?.toDate() || new Date(inviteData.expiresAt);
    if (expiresAt < new Date()) {
      throw new Error("This code has expired. Please request a new one");
    }

    // Check if code has been used
    if (inviteData.used) {
      throw new Error("This code has already been used");
    }

    // Check if user is trying to use their own code
    if (inviteData.createdBy === auth.currentUser.uid) {
      throw new Error("You cannot use your own invitation code");
    }

    // Check if inviter is still unpaired
    const inviterDoc = await getDoc(doc(db, "users", inviteData.createdBy));
    if (!inviterDoc.exists()) {
      throw new Error("Invalid code. The inviter no longer exists");
    }

    const inviterData = inviterDoc.data();
    if (inviterData.coupleId) {
      throw new Error("This person is already paired with someone else");
    }

    return {
      inviterUid: inviteData.createdBy,
      inviterName: inviterData.displayName || "Unknown User",
    };
  } catch (error: any) {
    console.error("Error validating couple code:", error);
    throw new Error(error.message || "Failed to validate code");
  }
}

export async function acceptCoupleInvite(
  code: string,
  anniversary: string
): Promise<AcceptInviteResult> {
  if (!auth.currentUser) {
    throw new Error("Please log in to complete pairing");
  }

  if (!code || code.length !== 6) {
    throw new Error("Please provide a valid code");
  }

  if (!anniversary) {
    throw new Error("Please provide a valid anniversary date");
  }

  try {
    return await runTransaction(db, async (transaction) => {
      // Re-validate the invite (to ensure it's still valid in the transaction)
      const inviteRef = doc(db, "couple_invites", code);
      const inviteDoc = await transaction.get(inviteRef);

      if (!inviteDoc.exists()) {
        throw new Error("Invalid code or code has expired");
      }

      const inviteData = inviteDoc.data();

      // Check expiration
      const expiresAt =
        inviteData.expiresAt?.toDate() || new Date(inviteData.expiresAt);
      if (expiresAt < new Date()) {
        throw new Error("This code has expired. Please request a new one");
      }

      // Check if used
      if (inviteData.used) {
        throw new Error("This code has already been used");
      }

      // Verify both users are still unpaired
      const currentUserRef = doc(db, "users", auth.currentUser!.uid);
      const currentUserDoc = await transaction.get(currentUserRef);

      const inviterRef = doc(db, "users", inviteData.createdBy);
      const inviterDoc = await transaction.get(inviterRef);

      if (currentUserDoc.exists() && currentUserDoc.data().coupleId) {
        throw new Error("You are already paired with someone");
      }

      if (inviterDoc.exists() && inviterDoc.data().coupleId) {
        throw new Error("The inviter is already paired with someone else");
      }

      // Generate couple ID
      const coupleId = `couple_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Create couple document
      const coupleRef = doc(db, "couples", coupleId);
      const coupleData = {
        members: [inviteData.createdBy, auth.currentUser!.uid],
        createdAt: serverTimestamp(),
        anniversary: anniversary,
        // Initialize game state
        dailyRemaining: 1,
        ticketsRemaining: 3,
        streak: 0,
        hasPendingDaily: false,
        hasPendingChoice: 0,
        lastReset: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
      };

      transaction.set(coupleRef, coupleData);

      // Update both users with coupleId
      transaction.update(currentUserRef, {
        coupleId: coupleId,
        pairedAt: serverTimestamp(),
      });

      transaction.update(inviterRef, {
        coupleId: coupleId,
        pairedAt: serverTimestamp(),
      });

      // Mark invite as used
      transaction.update(inviteRef, {
        used: true,
        usedBy: auth.currentUser!.uid,
        usedAt: serverTimestamp(),
      });

      return {
        coupleId,
        anniversary,
      };
    });
  } catch (error: any) {
    console.error("Error accepting couple invite:", error);
    throw new Error(error.message || "Failed to complete pairing");
  }
}
