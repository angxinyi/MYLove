// TEMPORARY CLEANUP FUNCTION - ADD TO EXISTING SERVICE FILE TEMPORARILY

import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

// TEMPORARY FUNCTION - REMOVE AFTER RUNNING ONCE
export async function clearAllChatHistory() {
  console.log("🗑️ Starting chat history cleanup...");

  try {
    // Get all couples
    const couplesSnapshot = await getDocs(collection(db, "couples"));
    console.log(`Found ${couplesSnapshot.size} couples`);

    let totalMessagesDeleted = 0;

    for (const coupleDoc of couplesSnapshot.docs) {
      const coupleId = coupleDoc.id;
      console.log(`Clearing messages for couple: ${coupleId}`);

      // Get all messages for this couple
      const messagesRef = collection(db, "couples", coupleId, "messages");
      const messagesSnapshot = await getDocs(messagesRef);

      console.log(`  Found ${messagesSnapshot.size} messages`);

      // Delete each message
      const deletePromises = messagesSnapshot.docs.map((messageDoc) =>
        deleteDoc(doc(db, "couples", coupleId, "messages", messageDoc.id))
      );

      await Promise.all(deletePromises);
      totalMessagesDeleted += messagesSnapshot.size;

      console.log(`Deleted ${messagesSnapshot.size} messages`);
    }

    console.log(
      `SUCCESS: Deleted ${totalMessagesDeleted} total messages from ${couplesSnapshot.size} couples`
    );
    console.log("IMPORTANT: Remove this function after running!");
    return { success: true, deletedCount: totalMessagesDeleted };
  } catch (error) {
    console.error("Error clearing chat history:", error);
    return { success: false, error };
  }
}

// Instructions:
// 1. Import this into a component temporarily
// 2. Call clearAllChatHistory() once
// 3. Remove this file after successful cleanup
