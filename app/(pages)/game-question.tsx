import { auth } from "@/firebase/config";
import { submitGameAnswer } from "@/services/coupleLogic";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function GameQuestionPage() {
  const router = useRouter();
  const { sessionId, questionId, questionText, isPending, isPurchased } =
    useLocalSearchParams<{
      sessionId: string;
      questionId: string;
      questionText: string;
      isPending?: string;
      isPurchased?: string;
    }>();

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      Alert.alert(
        "Empty Answer",
        "Please write your answer before submitting."
      );
      return;
    }

    if (!auth.currentUser || !sessionId) {
      Alert.alert("Error", "Missing required information to submit answer.");
      return;
    }

    try {
      setLoading(true);

      const result = await submitGameAnswer(sessionId, answer.trim());

      // Show success message
      const message = result.completed
        ? "Both of you have answered! Check your game history to see both answers."
        : "Your answer has been saved. Waiting for your partner to answer.";

      Alert.alert("Answer Submitted!", message, [
        {
          text: "OK",
          onPress: () => {
            router.push("/game-selection");
          },
        },
      ]);
    } catch (error) {
      console.error("Error submitting daily answer:", error);
      Alert.alert("Error", "Failed to save your answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="#fef9f2" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.headerCentered}>
              <Text style={styles.title}>
                {isPending === "true"
                  ? "Answer Partner's Question"
                  : "Daily Question"}
              </Text>
            </View>

            {/* Question */}
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>{questionText}</Text>
            </View>

            {/* Answer Input */}
            <View style={styles.answerContainer}>
              <Text style={styles.answerLabel}>Your Answer:</Text>
              <TextInput
                style={styles.answerInput}
                multiline
                numberOfLines={6}
                placeholder="Share your thoughts here..."
                placeholderTextColor="#999"
                value={answer}
                onChangeText={setAnswer}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {answer.length}/500 characters
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                isPurchased === "true" && styles.purchasedButton,
                (!answer.trim() || loading) && styles.disabledButton,
              ]}
              onPress={handleSubmitAnswer}
              disabled={!answer.trim() || loading}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.submitButtonText,
                  (!answer.trim() || loading) && styles.disabledButtonText,
                ]}
              >
                {loading ? "Saving..." : "Submit Answer"}
              </Text>
            </TouchableOpacity>

            {/* Streak Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                💭 Complete daily questions to build your streak and unlock
                special rewards!
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fef9f2",
  },
  scrollContainer: {
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
    fontSize: 24,
    fontWeight: "700",
    color: "#2E2E2E",
    textAlign: "center",
  },
  questionContainer: {
    backgroundColor: "#e8f5e8",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#4caf50",
  },
  questionText: {
    fontSize: 20,
    color: "#2E2E2E",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 28,
  },
  answerContainer: {
    marginBottom: 30,
  },
  answerLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E2E2E",
    marginBottom: 10,
  },
  answerInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    fontSize: 16,
    color: "#2E2E2E",
    minHeight: 120,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: "#4caf50",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    marginBottom: 20,
  },
  purchasedButton: {
    backgroundColor: "#2196F3",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  disabledButtonText: {
    color: "#999",
  },
  infoContainer: {
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ffeaa7",
  },
  infoText: {
    fontSize: 14,
    color: "#856404",
    textAlign: "center",
    lineHeight: 20,
  },
});
