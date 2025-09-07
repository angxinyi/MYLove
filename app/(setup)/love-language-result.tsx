import { auth, db } from "@/firebase/config";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ResultPage() {
  const router = useRouter();
  const { loveLanguage } = useLocalSearchParams(); // gets param passed from quiz

  // State to store love language
  const [userLang, setUserLang] = useState<string | null>(
    (loveLanguage as string) || null
  );

  // Fetch from Firestore if no param
  useEffect(() => {
    const fetchUserLang = async () => {
      if (!userLang) {
        const user = auth.currentUser;
        if (user) {
          try {
            const docRef = doc(db, "users", user.uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
              setUserLang(snap.data().loveLanguage || null);
            }
          } catch (err) {
            console.error("Error fetching love language:", err);
          }
        }
      }
    };
    fetchUserLang();
  }, []);

  // Brief descriptions for each love language
  const descriptions: Record<string, string> = {
    "Quality Time":
      "You feel most loved when your partner spends meaningful and undivided time with you.",
    "Acts of Service":
      "Actions speak louder than words for you, thoughtful help and effort show love best.",
    "Receiving Gifts":
      "Gifts are symbols of love to you, showing thoughtfulness and care behind each present.",
    "Words of Affirmation":
      "Kind, encouraging, and loving words make you feel deeply appreciated.",
    "Physical Touch":
      "Affection through hugs, kisses, and closeness makes you feel most connected.",
  };

  const brief = userLang ? descriptions[userLang] || "" : "";

  // Background colors for each love language (from your bubbles)
  const bgColors: Record<string, string> = {
    "Quality Time": "#F5E4C3",
    "Acts of Service": "#A6C5F7",
    "Words of Affirmation": "#B8E0D2",
    "Receiving Gifts": "#F9C6D1",
    "Physical Touch": "#D5C3F7",
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require("@/assets/images/logo-name.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      {/* Title */}
      <Text style={styles.title}>Your Love Language is:</Text>
      <Text
        style={[
          styles.loveLanguage,
          { color: userLang ? bgColors[userLang] || "#fff" : "#fff" },
        ]}
      >
        {userLang || "Loading..."}
      </Text>
      {/* Description Box */}
      <View
        style={[
          styles.descriptionBox,
          { backgroundColor: userLang ? bgColors[userLang] || "#fff" : "#fff" },
        ]}
      >
        <Text style={styles.description}>{brief}</Text>
      </View>
      {/* Closing Text */}
      <Text style={styles.text}>
        Now you know what makes you feel most loved,{"\n"} keep it close to your
        heart{"\n"}
      </Text>
      <Text style={styles.text}>Are you ready to begin your journey?</Text>
      {/* Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(tabs)/explore")}
      >
        <Text style={styles.buttonText}>Let’s Go!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fef9f2",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    width: 140,
    height: 50,
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2E2E2E",
    marginBottom: 30,
    textAlign: "center",
  },
  loveLanguage: {
    fontSize: 28,
    fontWeight: "600",
    color: "#a83434ff",
    marginBottom: 30,
    textAlign: "center",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    width: "100%",
  },
  descriptionBox: {
    borderWidth: 1,
    borderColor: "#2E2E2E",
    borderRadius: 10,
    padding: 15,
    backgroundColor: "#fff",
    width: "100%",
    marginBottom: 35,
    paddingVertical: 50,
  },
  description: {
    fontSize: 18,
    textAlign: "center",
    color: "#2E2E2E",
    width: "90%",
    alignSelf: "center",
  },
  text: {
    fontSize: 14,
    textAlign: "center",
    color: "#333",
    marginBottom: 5,
  },
  button: {
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 45,
    borderColor: "#ff9197",
    backgroundColor: "#fcd7d7",
    width: "100%",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E2E2E",
    textAlign: "center",
  },
});
