import { db } from "@/firebase/config";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";

// Default outfit configuration
const defaultOutfit = {
  hair: "hair_space-bun_black",
  top: "top_basic_white",
  bottom: "bottom_basic_white",
};

export async function populateUserOutfits(): Promise<{
  updated: number;
  total: number;
  skipped: number;
}> {
  try {
    console.log("Starting to populate user outfits...");

    // Get all users from the 'users' collection
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);

    let updateCount = 0;
    let totalUsers = usersSnapshot.size;

    console.log(`Found ${totalUsers} users to update`);

    // Iterate through each user document
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Check if user already has selectedOutfit
      if (!userData.selectedOutfit) {
        try {
          // Update user document with default outfit
          await updateDoc(doc(db, "users", userId), {
            selectedOutfit: defaultOutfit,
          });

          updateCount++;
          console.log(`Updated user ${userId} with default outfit`);
        } catch (error) {
          console.error(`Failed to update user ${userId}:`, error);
        }
      } else {
        console.log(`User ${userId} already has outfit data, skipping`);
      }
    }

    const results = {
      updated: updateCount,
      total: totalUsers,
      skipped: totalUsers - updateCount,
    };

    console.log(`\nPopulation complete!`);
    console.log(`Summary:`);
    console.log(`   - Total users found: ${results.total}`);
    console.log(`   - Users updated: ${results.updated}`);
    console.log(`   - Users skipped: ${results.skipped}`);

    return results;
  } catch (error) {
    console.error("Error populating user outfits:", error);
    throw error;
  }
}
