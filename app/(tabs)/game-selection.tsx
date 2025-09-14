import { auth } from "@/firebase/config";
import {
  checkPairingStatus,
  getCoupleGameState,
  getNextDailyQuestionResetTime,
  getNextResetTime,
  getPendingGames,
  startChoiceGame,
  startDailyQuestion,
  subscribeToCoupleGameState,
  type CoupleGameState,
  type PendingGame,
} from "@/services/coupleLogic";
import type { ChoiceGameType } from "@/types/game";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function GameSelectionPage() {
  const router = useRouter();
  const [gameState, setGameState] = useState<CoupleGameState | null>(null);
  const [isPaired, setIsPaired] = useState(false);
  const [pendingGames, setPendingGames] = useState<PendingGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeUntilReset, setTimeUntilReset] = useState<string>("");
  const [timeUntilDailyReset, setTimeUntilDailyReset] = useState<string>("");

  useEffect(() => {
    checkPairingAndFetchGameState();
  }, []);

  // Refresh game state when screen comes into focus (after completing games)
  useFocusEffect(
    useCallback(() => {
      if (auth.currentUser) {
        checkPairingAndFetchGameState();
        fetchPendingGames();
      }
    }, [])
  );

  // Subscribe to real-time game state updates
  useEffect(() => {
    if (isPaired) {
      const unsubscribe = subscribeToCoupleGameState(async (state) => {
        setGameState(state);

        //Update pending games when game state changes
        if (state && (state.hasPendingDaily || state.hasPendingChoice > 0)) {
          try {
            const pending = await getPendingGames();
            setPendingGames(pending);
          } catch (error) {
            console.error("Error updating pending games:", error);
          }
        } else {
          // Clear pending games if no pending state
          setPendingGames([]);
        }
      });
      return unsubscribe;
    }
  }, [isPaired]);

  // Countdown timer for reset
  useEffect(() => {
    const updateCountdown = () => {
      const nextReset = getNextResetTime();
      const now = new Date();
      const timeDiff = nextReset.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setTimeUntilReset("Resetting...");
        // Refresh game state when reset time is reached
        if (isPaired) {
          checkPairingAndFetchGameState();
        }
        return;
      }

      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeUntilReset(`${minutes}m ${seconds}s`);
      } else {
        setTimeUntilReset(`${seconds}s`);
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [isPaired]);

  // Countdown timer for daily question reset (midnight)
  useEffect(() => {
    const updateDailyCountdown = () => {
      const nextDailyReset = getNextDailyQuestionResetTime();
      const now = new Date();
      const timeDiff = nextDailyReset.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setTimeUntilDailyReset("Resetting...");
        // Refresh game state when reset time is reached
        if (isPaired) {
          checkPairingAndFetchGameState();
        }
        return;
      }

      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeUntilDailyReset(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeUntilDailyReset(`${minutes}m ${seconds}s`);
      } else {
        setTimeUntilDailyReset(`${seconds}s`);
      }
    };

    // Update immediately
    updateDailyCountdown();

    // Update every second
    const dailyInterval = setInterval(updateDailyCountdown, 1000);

    return () => clearInterval(dailyInterval);
  }, [isPaired]);

  const checkPairingAndFetchGameState = async () => {
    if (!auth.currentUser) {
      Alert.alert("Error", "Please log in to play games");
      return;
    }

    try {
      setLoading(true);

      // Check pairing status first
      const pairingStatus = await checkPairingStatus();
      setIsPaired(pairingStatus.isPaired);

      if (pairingStatus.isPaired) {
        // Fetch game state if paired
        const state = await getCoupleGameState();
        setGameState(state);

        // Fetch pending games
        await fetchPendingGames();
      } else {
        setGameState(null);
      }
    } catch (error) {
      console.error("Error fetching game state:", error);
      Alert.alert("Error", "Failed to load game data");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingGames = async () => {
    try {
      const pending = await getPendingGames();
      setPendingGames(pending);
    } catch (error) {
      console.error("Error fetching pending games:", error);
    }
  };

  const handleDailyQuestion = () => {
    if (!isPaired) {
      showPairingRequiredAlert();
      return;
    }

    if (!gameState) return;

    if (gameState.dailyRemaining <= 0) {
      Alert.alert(
        "Daily Question Used",
        `Daily questions reset in ${timeUntilDailyReset}.\n\nDaily questions reset once daily at midnight (Malaysia time).`
      );
      return;
    }

    if (gameState.hasPendingDaily) {
      Alert.alert(
        "Wait for partner",
        "Your partner needs to answer the current daily question before you can start a new one."
      );
      return;
    }

    Alert.alert(
      "Start Daily Question?",
      "Ready to answer today's question together?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: async () => {
            try {
              setLoading(true);
              const result = await startDailyQuestion();
              setGameState(result.gameStateAfter);

              router.push({
                pathname: "/(pages)/game-question",
                params: {
                  sessionId: result.sessionId,
                  questionId: result.question.id,
                  questionText: result.question.text,
                },
              });
            } catch (error: any) {
              console.error("Error starting daily question:", error);
              Alert.alert(
                "Error",
                error.message || "Failed to start daily question"
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleChoiceGame = (type: ChoiceGameType, gameLabel: string) => {
    if (!isPaired) {
      showPairingRequiredAlert();
      return;
    }

    if (!gameState) return;

    if (gameState.hasPendingChoice >= 3) {
      Alert.alert(
        "Wait for partner",
        "Your partner needs to answer some pending choice games before you can start new ones."
      );
      return;
    }

    const remaining = gameState.ticketsRemaining - 1;
    Alert.alert(
      `Start "${gameLabel}"?`,
      `This will use 1 ticket\nYou'll have ${remaining} tickets remaining`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Play",
          onPress: async () => {
            try {
              setLoading(true);
              const result = await startChoiceGame(type);
              setGameState(result.gameStateAfter);

              router.push({
                pathname: "/(pages)/game-choice",
                params: {
                  sessionId: result.sessionId,
                  questionId: result.question.id,
                  gameType: result.question.type,
                  questionText: result.question.question,
                  choice1: result.question.choice1,
                  choice2: result.question.choice2,
                  gameLabel,
                },
              });
            } catch (error: any) {
              console.error("Error starting choice game:", error);
              Alert.alert(
                "Error",
                error.message || `Failed to start ${gameLabel}`
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const showPairingRequiredAlert = () => {
    Alert.alert(
      "Pairing Required",
      "You need to pair with your partner to play games together!",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pair Now",
          onPress: () => router.push("/(pages)/pairing"),
        },
      ]
    );
  };

  const handlePendingGame = (game: PendingGame) => {
    if (game.type === "daily") {
      router.push({
        pathname: "/(pages)/game-question",
        params: {
          sessionId: game.sessionId,
          questionId: game.questionId || "unknown",
          questionText: game.questionText,
          isPending: "true",
        },
      });
    } else {
      router.push({
        pathname: "/(pages)/game-choice",
        params: {
          sessionId: game.sessionId,
          questionId: game.questionId || "unknown",
          gameType: game.type,
          questionText: game.questionText,
          choice1: game.choice1,
          choice2: game.choice2,
          isPending: "true",
        },
      });
    }
  };

  const getGameTypeLabel = (type: ChoiceGameType): string => {
    switch (type) {
      case "this_or_that":
        return "This or That";
      case "more_likely":
        return "Who's more likely to?";
      case "would_you_rather":
        return "Would you rather...";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading game data...</Text>
      </View>
    );
  }

  // Show pairing required screen if not paired
  if (!isPaired) {
    return (
      <View style={styles.container}>
        <View style={styles.notPairedContainer}>
          <Image
            source={require("@/assets/images/icons/heart.png")}
            style={styles.notPairedIcon}
          />
          <Text style={styles.notPairedTitle}>Pairing Required</Text>
          <Text style={styles.notPairedText}>
            You need to pair with your partner to play games together!
          </Text>
          <TouchableOpacity
            style={styles.pairButton}
            onPress={() => router.push("/(pages)/pairing")}
            activeOpacity={0.7}
          >
            <Text style={styles.pairButtonText}>Pair Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={styles.streak}>
            Streak <Text style={styles.fire}>🔥</Text>: {gameState?.streak ?? 0}
          </Text>
          <View style={styles.ticketContainer}>
            <Text style={styles.ticketCount}>
              {gameState?.ticketsRemaining ?? 0}
            </Text>
            <View style={styles.ticketBadge}>
              <Text style={styles.ticket}>🎟️</Text>
            </View>
          </View>
        </View>

        {/* Pending Games Section */}
        {pendingGames.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Answer Your Partner's Questions
            </Text>
            {pendingGames.map((game) => (
              <TouchableOpacity
                key={game.sessionId}
                style={[
                  styles.button,
                  game.isPurchased
                    ? styles.purchasedPendingButton
                    : styles.pendingButton,
                ]}
                onPress={() => handlePendingGame(game)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.buttonText,
                    game.isPurchased
                      ? styles.purchasedPendingButtonText
                      : styles.pendingButtonText,
                  ]}
                >
                  {game.type === "daily"
                    ? "Daily Question"
                    : getGameTypeLabel(game.type as ChoiceGameType)}
                </Text>
                <Text style={styles.buttonSubtext}>
                  Waiting for your answer
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Daily Question Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Challenge</Text>
          <TouchableOpacity
            style={[
              styles.button,
              styles.dailyButton,
              (gameState?.dailyRemaining === 0 || gameState?.hasPendingDaily) &&
                styles.disabledButton,
            ]}
            onPress={handleDailyQuestion}
            disabled={
              loading ||
              gameState?.dailyRemaining === 0 ||
              gameState?.hasPendingDaily
            }
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.buttonText,
                (gameState?.dailyRemaining === 0 ||
                  gameState?.hasPendingDaily) &&
                  styles.disabledButtonText,
              ]}
            >
              Daily Question
            </Text>
            <Text style={styles.buttonSubtext}>
              {gameState?.dailyRemaining === 0
                ? `Resets in ${timeUntilDailyReset}`
                : gameState?.hasPendingDaily
                ? "Wait for partner to answer"
                : "Answer to build streak!"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Choice Games Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choice Games</Text>

          <TouchableOpacity
            style={[
              styles.button,
              (gameState?.ticketsRemaining === 0 ||
                gameState?.hasPendingChoice >= 3) &&
                styles.disabledButton,
            ]}
            onPress={() => handleChoiceGame("this_or_that", "This or That")}
            disabled={
              loading ||
              gameState?.ticketsRemaining === 0 ||
              gameState?.hasPendingChoice >= 3
            }
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.buttonText,
                (gameState?.ticketsRemaining === 0 ||
                  gameState?.hasPendingChoice >= 3) &&
                  styles.disabledButtonText,
              ]}
            >
              This or That
            </Text>
            <Text style={styles.buttonSubtext}>
              {gameState?.ticketsRemaining === 0
                ? `Resets in ${timeUntilReset}`
                : gameState?.hasPendingChoice >= 3
                ? "Wait for partner to answer"
                : "Quick choice game"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              (gameState?.ticketsRemaining === 0 ||
                gameState?.hasPendingChoice >= 3) &&
                styles.disabledButton,
            ]}
            onPress={() =>
              handleChoiceGame("more_likely", "Who's more likely to?")
            }
            disabled={
              loading ||
              gameState?.ticketsRemaining === 0 ||
              gameState?.hasPendingChoice >= 3
            }
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.buttonText,
                (gameState?.ticketsRemaining === 0 ||
                  gameState?.hasPendingChoice >= 3) &&
                  styles.disabledButtonText,
              ]}
            >
              Who&apos;s more likely to?
            </Text>
            <Text style={styles.buttonSubtext}>
              {gameState?.ticketsRemaining === 0
                ? `Resets in ${timeUntilReset}`
                : gameState?.hasPendingChoice >= 3
                ? "Wait for partner to answer"
                : "Fun personality game"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              (gameState?.ticketsRemaining === 0 ||
                gameState?.hasPendingChoice >= 3) &&
                styles.disabledButton,
            ]}
            onPress={() =>
              handleChoiceGame("would_you_rather", "Would you rather...")
            }
            disabled={
              loading ||
              gameState?.ticketsRemaining === 0 ||
              gameState?.hasPendingChoice >= 3
            }
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.buttonText,
                (gameState?.ticketsRemaining === 0 ||
                  gameState?.hasPendingChoice >= 3) &&
                  styles.disabledButtonText,
              ]}
            >
              Would you rather..
            </Text>
            <Text style={styles.buttonSubtext}>
              {gameState?.ticketsRemaining === 0
                ? `Resets in ${timeUntilReset}`
                : gameState?.hasPendingChoice >= 3
                ? "Wait for partner to answer"
                : "Dilemma challenge"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fef9f2",
    padding: 20,
    paddingTop: 60,
    flexGrow: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#2E2E2E",
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
    fontWeight: "600",
  },
  fire: {
    fontSize: 24,
  },
  ticketContainer: {
    position: "relative",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 100,
  },
  ticketBadge: {
    position: "absolute",
    top: -16,
    left: "50%",
    marginLeft: -24,
    justifyContent: "center",
    alignItems: "center",
  },
  ticket: {
    fontSize: 24,
  },
  ticketCount: {
    fontSize: 18,
    color: "#2E2E2E",
    fontWeight: "600",
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2E2E2E",
    marginBottom: 15,
  },
  button: {
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 25,
    width: "100%",
    borderRadius: 12,
    marginBottom: 15,
    borderColor: "#ff9197",
    backgroundColor: "#fcd7d7",
  },
  dailyButton: {
    backgroundColor: "#e8f5e8",
    borderColor: "#4caf50",
  },
  disabledButton: {
    backgroundColor: "#f5f5f5",
    borderColor: "#cccccc",
  },
  buttonText: {
    fontSize: 22,
    color: "#2E2E2E",
    textAlign: "center",
    fontWeight: "600",
  },
  buttonSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
  },
  disabledButtonText: {
    color: "#999",
  },
  notPairedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  notPairedIcon: {
    width: 80,
    height: 80,
    marginBottom: 20,
    opacity: 0.6,
  },
  notPairedTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E2E2E",
    marginBottom: 10,
    textAlign: "center",
  },
  notPairedText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  pairButton: {
    backgroundColor: "#ff9197",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  pairButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  pendingButton: {
    backgroundColor: "#fff8dc",
    borderColor: "#f0ad4e",
  },
  purchasedPendingButton: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196f3",
    borderWidth: 1,
  },
  pendingButtonText: {
    color: "#856404",
  },
  purchasedPendingButtonText: {
    color: "#1976d2",
  },
});
