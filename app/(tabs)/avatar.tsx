import { auth, db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function HomePage() {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserName = async () => {
      // Get the currently authenticated user
      const user = auth.currentUser;

      if (user) {
        try {
          // Get user document using the user ID
          const userDoc = await getDoc(doc(db, "users", user.uid));

          if (userDoc.exists()) {
            setUserName(userDoc.data().name || "User");
          } else {
            console.log("No user document found");
          }
        } catch (error) {
          console.error("Error fetching user name: ", error);
        }
      }
    };

    fetchUserName();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
        <Text>Avatar/Home Screen</Text>
        <Text>{userName ? `Hello, ${userName}!` : "Loading..."}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fef9f2",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    flexGrow: 1,
  },
});
