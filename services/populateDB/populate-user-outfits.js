import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/config";

// Default outfit configuration
const defaultOutfit = {
  hair: "hair_space-bun_black",
  top: "top_basic_white",
  bottom: "bottom_basic_white",
};

// Populate user outfits collection with default outfits (for testing - call this from your app)
export async function populateUserOutfits() {
  if (!auth.currentUser) {
    throw new Error("Must be authenticated");
  }

  console.log("Starting to populate user outfits from authenticated user...");

  try {
    // Get all users from the 'users' collection
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);

    let updateCount = 0;
    let totalUsers = usersSnapshot.size;
    let skippedUsers = 0;

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
        skippedUsers++;
        console.log(`User ${userId} already has outfit data, skipping`);
      }
    }

    return {
      success: true,
      message: `Population complete! Updated ${updateCount} users, skipped ${skippedUsers} users (total: ${totalUsers})`,
    };
  } catch (error) {
    console.error("Error populating user outfits:", error);
    throw error;
  }
}
