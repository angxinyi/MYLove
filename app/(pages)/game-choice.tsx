import { auth } from "@/firebase/config";
import { getCoupleMembers, submitGameAnswer } from "@/services/coupleLogic";
import type { ChoiceGameType } from "@/types/game";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function GameChoicePage() {
  const router = useRouter();
  const {
    sessionId,
    questionId,
    gameType,
    questionText,
    choice1,
    choice2,
    gameLabel,
    isPending,
    isPurchased,
  } = useLocalSearchParams<{
    sessionId: string;
    questionId: string;
    gameType: ChoiceGameType;
    questionText: string;
    choice1: string;
    choice2: string;
    gameLabel?: string;
    isPending?: string;
    isPurchased?: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<1 | 2 | null>(null);
  const [userNames, setUserNames] = useState<{ [userId: string]: string }>({});
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [questionFontSize, setQuestionFontSize] = useState(22);

  // Fetch user names for "more_likely" games to replace Partner A/B
  useEffect(() => {
    const fetchCoupleMembers = async () => {
      if (gameType === "more_likely" && auth.currentUser) {
        try {
          const members = await getCoupleMembers();
          setUserNames(members.userNames);
          setMemberIds(members.memberIds);
        } catch (error) {
          console.error("Error fetching couple members:", error);
        }
      }
    };

    fetchCoupleMembers();
  }, [gameType]);

  // Reset selected choice when starting a new game session
  useEffect(() => {
    setSelectedChoice(null);
    setLoading(false);
  }, [sessionId]);

  // Dynamically adjust question font size based on text length
  useEffect(() => {
    if (questionText) {
      const textLength = questionText.length;
      let fontSize = 22; // Default font size

      if (textLength > 100) {
        fontSize = 16;
      } else if (textLength > 80) {
        fontSize = 18;
      } else if (textLength > 60) {
        fontSize = 20;
      }

      setQuestionFontSize(fontSize);
    }
  }, [questionText]);

  const handleChoiceSelection = async (choice: 1 | 2) => {
    if (!auth.currentUser || !sessionId) {
      Alert.alert("Error", "Missing required information to record choice.");
      return;
    }

    setSelectedChoice(choice);
    setLoading(true);

    try {
      const result = await submitGameAnswer(sessionId, choice);

      // Show success message
      const message = result.completed
        ? "Both of you have answered! Check your game history to see both answers."
        : "Your choice has been recorded. Waiting for your partner to answer.";

      Alert.alert("Choice Recorded!", message, [
        {
          text: "OK",
          onPress: () => {
            router.push("/game-selection");
          },
        },
      ]);
    } catch (error) {
      console.error("Error recording choice play:", error);
      Alert.alert("Error", "Failed to record your choice. Please try again.");
      setSelectedChoice(null);
    } finally {
      setLoading(false);
    }
  };

  const getGameTypeTitle = (type: ChoiceGameType): string => {
    switch (type) {
      case "this_or_that":
        return "This or That";
      case "more_likely":
        return "Who's more likely to?";
      case "would_you_rather":
        return "Would you rather...";
      default:
        return gameLabel || "Choice Game";
    }
  };

  const getDisplayChoice = (choice: string, choiceNumber: 1 | 2): string => {
    if (gameType === "more_likely" && memberIds.length === 2) {
      // Replace Partner A with first member name, Partner B with second member name
      if (choice === "Partner A") {
        return userNames[memberIds[0]] || "Partner A";
      } else if (choice === "Partner B") {
        return userNames[memberIds[1]] || "Partner B";
      }
    }
    return choice;
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="#fef9f2" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerCentered}>
            <Text style={styles.title}>
              {isPending === "true"
                ? "Answer Partner's Question"
                : getGameTypeTitle(gameType)}
            </Text>
          </View>

          {/* Question */}
          <View style={styles.questionContainer}>
            <Text style={[styles.questionText, { fontSize: questionFontSize }]}>
              {gameType === "would_you_rather" && questionText?.includes(":")
                ? questionText.replace(":", "...")
                : questionText}
            </Text>
          </View>

          {/* Choices */}
          <View style={styles.choicesContainer}>
            {/* Choice 1 */}
            <TouchableOpacity
              style={[
                styles.choiceButton,
                isPurchased === "true"
                  ? styles.purchasedChoice1Button
                  : styles.choice1Button,
                selectedChoice === 1 && styles.selectedChoice,
                loading && styles.disabledChoice,
              ]}
              onPress={() => handleChoiceSelection(1)}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.choiceText,
                  selectedChoice === 1 && styles.selectedChoiceText,
                ]}
              >
                {getDisplayChoice(choice1, 1)}
              </Text>
              {selectedChoice === 1 && loading && (
                <Text style={styles.processingText}>Processing...</Text>
              )}
            </TouchableOpacity>

            {/* OR Divider */}
            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>OR</Text>
            </View>

            {/* Choice 2 */}
            <TouchableOpacity
              style={[
                styles.choiceButton,
                isPurchased === "true"
                  ? styles.purchasedChoice2Button
                  : styles.choice2Button,
                { marginTop: 10 },
                selectedChoice === 2 && styles.selectedChoice,
                loading && styles.disabledChoice,
              ]}
              onPress={() => handleChoiceSelection(2)}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.choiceText,
                  selectedChoice === 2 && styles.selectedChoiceText,
                ]}
              >
                {getDisplayChoice(choice2, 2)}
              </Text>
              {selectedChoice === 2 && loading && (
                <Text style={styles.processingText}>Processing...</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              💭 Tap on your choice to make your selection
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fef9f2",
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  headerCentered: {
    alignItems: "center",
    marginBottom: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2E2E2E",
    textAlign: "center",
  },
  questionContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 30,
    marginBottom: 40,
    borderWidth: 2,
    borderColor: "#ff9197",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 180,
    justifyContent: "center",
  },
  questionText: {
    fontSize: 22,
    color: "#2E2E2E",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 32,
  },
  choicesContainer: {
    flex: 1,
    justifyContent: "center",
    marginBottom: 30,
  },
  choiceButton: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 10,
    borderWidth: 2,
    minHeight: 80,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
  },
  choice1Button: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196f3",
  },
  choice2Button: {
    backgroundColor: "#fce4ec",
    borderColor: "#e91e63",
  },
  purchasedChoice1Button: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196F3",
    borderWidth: 3,
  },
  purchasedChoice2Button: {
    backgroundColor: "#fce4ec",
    borderColor: "#e91e63",
    borderWidth: 3,
  },
  selectedChoice: {
    backgroundColor: "#4caf50",
    borderColor: "#2e7d32",
    transform: [{ scale: 1.02 }],
  },
  disabledChoice: {
    opacity: 0.7,
  },
  choiceText: {
    fontSize: 24,
    color: "#2E2E2E",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 28,
  },
  selectedChoiceText: {
    color: "#fff",
  },
  processingText: {
    fontSize: 14,
    color: "#fff",
    marginTop: 10,
    fontStyle: "italic",
  },
  vsContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  vsText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
  },
  instructionsContainer: {
    backgroundColor: "#fff3cd",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ffeaa7",
  },
  instructionsText: {
    fontSize: 14,
    color: "#856404",
    textAlign: "center",
    lineHeight: 20,
  },
});
