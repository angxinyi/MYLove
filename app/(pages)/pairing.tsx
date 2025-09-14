import { auth, db } from "@/firebase/config";
import { checkPairingStatus, unpairCouple } from "@/services/coupleLogic";
import { generateCoupleCode } from "@/services/genCoupleCode";
import { Stack, useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface PairingStatus {
  isPaired: boolean;
  coupleId?: string;
  partnerName?: string;
  anniversary?: string;
}

export default function PairingPage() {
  const router = useRouter();
  const [pairingStatus, setPairingStatus] = useState<PairingStatus>({
    isPaired: false,
  });
  const [loading, setLoading] = useState(true);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [hasShownSuccessAlert, setHasShownSuccessAlert] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    // Set up real-time listener for user's pairing status
    const unsubscribe = onSnapshot(
      doc(db, "users", auth.currentUser.uid),
      async (userDoc) => {
        try {
          if (!userDoc.exists()) {
            setPairingStatus({ isPaired: false });
            setLoading(false);
            return;
          }

          const userData = userDoc.data();
          if (!userData.coupleId) {
            // If user was previously paired and now unpaired, show unpair notification
            if (!isInitialLoad && pairingStatus.isPaired) {
              Alert.alert(
                "Partnership Ended",
                "You have been unpaired. You can now pair with someone new.",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      router.replace("/(tabs)/setting");
                    },
                  },
                ]
              );
            }
            setPairingStatus({ isPaired: false });
            // Reset flag when user becomes unpaired
            setHasShownSuccessAlert(false);
            setIsInitialLoad(false);
            setLoading(false);
            return;
          }

          // User is paired, get full pairing status
          const status = await checkPairingStatus();

          // Only show success message if:
          // 1. Not initial load (user was already on page)
          // 2. User just became paired (transition from unpaired to paired)
          // 3. Haven't shown success alert yet
          if (
            !isInitialLoad &&
            status.isPaired &&
            !pairingStatus.isPaired &&
            !hasShownSuccessAlert
          ) {
            setHasShownSuccessAlert(true);
            Alert.alert(
              "Successfully Paired!",
              `You are now connected with ${status.partnerName}. You can start playing games together!`,
              [
                {
                  text: "Continue",
                  onPress: () => {
                    router.replace("/(tabs)/setting");
                  },
                },
              ]
            );
          }

          setPairingStatus(status);
          setIsInitialLoad(false);

          setLoading(false);
        } catch (error) {
          console.error("Error checking pairing status:", error);
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error listening to user document:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [pairingStatus.isPaired, hasShownSuccessAlert, isInitialLoad, router]);

  const handleGenerateCode = async () => {
    try {
      setGeneratingCode(true);
      const result = await generateCoupleCode();
      setCurrentCode(result.code);

      // Show share sheet
      try {
        await Share.share({
          message: `Join me on MyLove! Use this code to pair with me: ${result.code}\n\nThis code expires in 1 hour.`,
          title: "MyLove Pairing Code",
        });
      } catch (shareError) {
        console.log("Share cancelled or failed:", shareError);
      }
    } catch (error: any) {
      console.error("Error generating code:", error);
      Alert.alert("Error", error.message || "Failed to generate code");
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleEnterCode = () => {
    router.push("/(pages)/pairing-enter-code");
  };

  const handleUnpair = () => {
    Alert.alert(
      "Unpair Warning",
      "Unpairing will permanently delete all game history, streaks, and reset your anniversary. This cannot be undone.\n\nAre you sure you want to unpair?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unpair",
          style: "destructive",
          onPress: confirmUnpair,
        },
      ]
    );
  };

  const confirmUnpair = async () => {
    try {
      setLoading(true);
      await unpairCouple();
      setPairingStatus({ isPaired: false });
      Alert.alert(
        "Success",
        "Successfully unpaired. You can now pair with someone new.",
        [
          {
            text: "Continue",
            onPress: () => {
              router.replace("/(tabs)/setting");
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Error unpairing:", error);
      Alert.alert("Error", error.message || "Failed to unpair");
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysTogether = (anniversary: string): number => {
    try {
      const [day, month, year] = anniversary.split("/");
      const anniversaryDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - anniversaryDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return 0;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Couple Connection</Text>
        </View>
        <View style={styles.centeredContent}>
          {pairingStatus.isPaired ? (
            // Paired State
            <View>
              <View style={styles.pairedSection}>
                <Text style={styles.pairedTitle}>Connected!</Text>
                <Text style={styles.pairedText}>
                  You are paired with {pairingStatus.partnerName}
                </Text>
                {pairingStatus.anniversary && (
                  <Text style={styles.daysText}>
                    Together for{" "}
                    {calculateDaysTogether(pairingStatus.anniversary)} days
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.button, styles.dangerButton]}
                onPress={handleUnpair}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, styles.dangerText]}>
                  Unpair
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Unpaired State
            <View>
              <Text style={styles.description}>
                Connect with your partner to start playing games together!
              </Text>

              {currentCode && (
                <View style={styles.codeSection}>
                  <Text style={styles.codeLabel}>Your pairing code:</Text>
                  <Text style={styles.codeText}>{currentCode}</Text>
                  <Text style={styles.codeExpiry}>Expires in 1 hour</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.button}
                onPress={handleGenerateCode}
                disabled={generatingCode}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>
                  {generatingCode ? "Generating..." : "Generate Pairing Code"}
                </Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleEnterCode}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, styles.secondaryText]}>
                  Enter Partner's Code
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
  centeredContent: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
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
    marginBottom: 30,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E2E2E",
    marginBottom: 20,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  pairedSection: {
    backgroundColor: "#e8f5e8",
    padding: 25,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4caf50",
  },
  pairedTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E2E2E",
    marginBottom: 8,
  },
  pairedText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  daysText: {
    fontSize: 14,
    color: "#4caf50",
    fontWeight: "500",
  },
  codeSection: {
    backgroundColor: "#f0f8ff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#87ceeb",
  },
  codeLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  codeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2E2E2E",
    letterSpacing: 4,
    marginBottom: 8,
  },
  codeExpiry: {
    fontSize: 12,
    color: "#f39c12",
    fontStyle: "italic",
  },
  button: {
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 15,
    borderColor: "#ff9197",
    backgroundColor: "#fcd7d7",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderColor: "#ddd",
  },
  dangerButton: {
    backgroundColor: "#ffe6e6",
    borderColor: "#ff6b6b",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    color: "#2E2E2E",
  },
  secondaryText: {
    color: "#666",
  },
  dangerText: {
    color: "#ff6b6b",
    fontSize: 18,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 14,
    color: "#999",
  },
});
