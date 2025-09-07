import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function GameMenuPage() {
  const router = useRouter();
  const [streak] = useState<number | null>(null);
  const [playsLeft, setPlaysLeft] = useState<number>(3);

  function handlePlay(path: string, gameLabel: string) {
    if (playsLeft <= 0) {
      Alert.alert("No plays left", "You've used all your plays for today.");
      return;
    }

    Alert.alert(
      "Confirm Play",
      `Do you want to use 1 play to start \n"${gameLabel}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          style: "default",
          onPress: () => {
            setPlaysLeft((prev) => prev - 1);
            router.push(path);
          },
        },
      ]
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={styles.streak}>
            Streak <Text style={styles.fire}>🔥</Text> :{" "}
            {streak === null ? "--" : streak}
          </Text>
          <Text style={styles.plays}>
            <Text style={styles.ticket}>🎟️</Text> {playsLeft} plays left
          </Text>
        </View>

        {/* Game buttons */}
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            handlePlay("/games/daily-questions", "Daily Questions")
          }
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Daily Questions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => handlePlay("/games/this-or-that", "This or That")}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>This or That</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            handlePlay("/games/more-likely", "Who's more likely to?")
          }
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Who's more likely to?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            handlePlay("/games/would-you-rather", "Would you rather..")
          }
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Would you rather..</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// function MenuButton({
//   label,
//   onPress,
// }: {
//   label: string;
//   onPress: () => void;
// }) {
//   return (
//     <TouchableOpacity
//       style={styles.button}
//       activeOpacity={0.85}
//       onPress={onPress}
//       accessibilityRole="button"
//       accessibilityLabel={label}
//     >
//       <Text style={styles.buttonText}>{label}</Text>
//     </TouchableOpacity>
//   );
// }

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fef9f2",
    padding: 20,
    justifyContent: "center",
    paddingTop: 60,
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  streak: {
    fontSize: 24,
    color: "#2E2E2E",
    alignSelf: "center",
  },
  fire: { fontSize: 24 },
  ticket: { fontSize: 20 },
  plays: {
    fontSize: 18,
    color: "#2E2E2E",
  },
  button: {
    borderWidth: 1,
    paddingVertical: 25,
    paddingHorizontal: 30,
    width: "100%",
    borderRadius: 8,
    marginBottom: 25,
    marginTop: 10,
    borderColor: "#ff9197",
    backgroundColor: "#fcd7d7",
  },
  buttonText: {
    fontSize: 28,
    color: "#2E2E2E",
    textAlign: "center",
  },
});
