import { auth } from "@/firebase/config";
import {
  getGameHistory,
  subscribeToCoupleGameState,
} from "@/services/coupleLogic";
import { useFocusEffect } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface GameHistoryItem {
  sessionId: string;
  type: string;
  questionText: string;
  choice1?: string;
  choice2?: string;
  answers: Record<string, { answer: string | number; answeredAt: any }>;
  createdAt: any;
  malaysiaDate: string;
  memberNames: Record<string, string>;
  completed: boolean;
  canAnswer: boolean;
  isPurchased?: boolean;
}

export default function GameHistoryPage() {
  const router = useRouter();
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGameHistory();
  }, []);

  // Refresh game history when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (auth.currentUser) {
        fetchGameHistory();
      }
    }, [])
  );

  // Subscribe to real-time game state updates to refresh history
  useEffect(() => {
    if (auth.currentUser) {
      const unsubscribe = subscribeToCoupleGameState(async (state) => {
        // Refresh game history when game state changes (indicates games completed/updated)
        try {
          await fetchGameHistory();
        } catch (error) {
          console.error("Error refreshing game history:", error);
        }
      });
      return unsubscribe;
    }
  }, []);

  const fetchGameHistory = async () => {
    try {
      setLoading(true);
      const history = await getGameHistory();
      setGameHistory(history);
    } catch (error: any) {
      console.error("Error fetching game history:", error);
      Alert.alert("Error", error.message || "Failed to load game history");
    } finally {
      setLoading(false);
    }
  };

  const formatGameType = (type: string): string => {
    switch (type) {
      case "daily":
        return "Daily Question";
      case "this_or_that":
        return "This or That";
      case "more_likely":
        return "Who's more likely to?";
      case "would_you_rather":
        return "Would you rather...";
      default:
        return type;
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const [year, month, day] = dateString.split("-");
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  const formatChoiceAnswer = (
    answer: string | number,
    choice1?: string,
    choice2?: string
  ): string => {
    if (typeof answer === "number") {
      if (answer === 1 && choice1) return choice1;
      if (answer === 2 && choice2) return choice2;
      return `Choice ${answer}`;
    }
    return String(answer);
  };

  const handleAnswerQuestion = (item: GameHistoryItem) => {
    if (item.type === "daily") {
      router.push({
        pathname: "/(pages)/game-question",
        params: {
          sessionId: item.sessionId,
          questionId: "unknown",
          questionText: item.questionText,
          isPending: "true",
        },
      });
    } else {
      router.push({
        pathname: "/(pages)/game-choice",
        params: {
          sessionId: item.sessionId,
          questionId: "unknown",
          gameType: item.type,
          questionText: item.questionText,
          choice1: item.choice1,
          choice2: item.choice2,
          isPending: "true",
        },
      });
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, styles.centered]}>
          <Text style={styles.loadingText}>Loading game history...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Game History</Text>
        </View>

        {gameHistory.length === 0 ? (
          <View style={styles.centeredEmptyState}>
            <Text style={styles.emptyTitle}>No Game History Yet</Text>
            <Text style={styles.emptyText}>
              Complete some games together to see your history here!
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.historyContainer}>
            <View style={styles.historyContent}>
              <View style={styles.historyList}>
                {gameHistory.map((item) => (
                  <View key={item.sessionId} style={styles.gameCard}>
                    {/* Game title */}
                    <View style={styles.gameHeader}>
                      <Text
                        style={[
                          styles.gameType,
                          item.isPurchased
                            ? styles.purchasedGameType
                            : styles.normalGameType,
                        ]}
                      >
                        {formatGameType(item.type)}
                      </Text>
                      <Text style={styles.gameDate}>
                        {formatDate(item.malaysiaDate)}
                      </Text>
                    </View>

                    {/* Game question */}
                    <View style={styles.questionSection}>
                      <Text style={styles.questionText}>
                        {item.questionText}
                      </Text>
                    </View>

                    {/* Answers section */}
                    <View style={styles.answersSection}>
                      {Object.entries(item.memberNames).map(
                        ([userId, userName]) => {
                          const answerData = item.answers[userId];

                          if (answerData) {
                            // User has answered - show their answer
                            const formattedAnswer =
                              item.type === "daily"
                                ? String(answerData.answer)
                                : formatChoiceAnswer(
                                    answerData.answer,
                                    item.choice1,
                                    item.choice2
                                  );

                            return (
                              <View key={userId} style={styles.answerRow}>
                                <Text style={styles.userName}>{userName}:</Text>
                                <Text style={styles.userAnswer}>
                                  {formattedAnswer}
                                </Text>
                              </View>
                            );
                          } else {
                            // User hasn't answered - show placeholder
                            return (
                              <View key={userId} style={styles.answerRow}>
                                <Text style={styles.userName}>{userName}:</Text>
                                <Text style={styles.pendingAnswer}>
                                  Pending answer...
                                </Text>
                              </View>
                            );
                          }
                        }
                      )}
                    </View>

                    {/* Show answer button if user can answer */}
                    {item.canAnswer && (
                      <TouchableOpacity
                        style={styles.answerButton}
                        onPress={() => handleAnswerQuestion(item)}
                      >
                        <Text style={styles.answerButtonText}>
                          Complete Question
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fef9f2",
  },
  titleSection: {
    padding: 20,
    paddingTop: 60,
  },
  historyContainer: {
    flex: 1,
  },
  historyContent: {
    padding: 20,
  },
  centeredEmptyState: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 100,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#888",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E2E2E",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E2E2E",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E2E2E",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  historyList: {
    gap: 15,
  },
  gameCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  gameType: {
    fontSize: 16,
    fontWeight: "bold",
  },
  normalGameType: {
    color: "#ff9197",
  },
  purchasedGameType: {
    color: "#2196f3",
  },
  gameDate: {
    fontSize: 12,
    color: "#999",
  },
  questionSection: {
    marginBottom: 12,
  },
  questionText: {
    fontSize: 14,
    color: "#2E2E2E",
    lineHeight: 20,
    fontStyle: "italic",
  },
  answersSection: {
    gap: 8,
  },
  answerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E2E2E",
    minWidth: 60,
    flexShrink: 0,
  },
  userAnswer: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    lineHeight: 18,
  },
  pendingAnswer: {
    fontSize: 14,
    color: "#999",
    flex: 1,
    lineHeight: 18,
    fontStyle: "italic",
  },
  answerButton: {
    backgroundColor: "#4caf50",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 12,
    alignSelf: "center",
  },
  answerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
});
