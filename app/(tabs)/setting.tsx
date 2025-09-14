import { auth, db } from "@/firebase/config";
import type { LangCode } from "@/services/chatServices";
import {
  clearProfileCache,
  sendLanguageChangeNotification,
} from "@/services/chatServices";
import { checkPairingStatus } from "@/services/coupleLogic";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface UserData {
  displayName: string;
  dob: string;
  defaultLanguage?: LangCode;
}

interface PairingStatus {
  isPaired: boolean;
  coupleId?: string;
  partnerName?: string;
  anniversary?: string;
}

const LANGUAGE_OPTIONS: { code: LangCode; name: string; nativeName: string }[] =
  [
    { code: "en", name: "English", nativeName: "English" },
    { code: "zh", name: "Mandarin", nativeName: "中文" },
    { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  ];

export default function SettingPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [pairingStatus, setPairingStatus] = useState<PairingStatus>({
    isPaired: false,
  });
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [changingLanguage, setChangingLanguage] = useState(false);

  useEffect(() => {
    fetchUserData();

    // Set up real-time listener for pairing status
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", auth.currentUser.uid),
      async (userDoc) => {
        try {
          if (!userDoc.exists()) {
            setPairingStatus({ isPaired: false });
            return;
          }

          const userData = userDoc.data();
          if (!userData.coupleId) {
            setPairingStatus({ isPaired: false });
            return;
          }

          // User is paired, get full pairing status
          const status = await checkPairingStatus();
          setPairingStatus(status);
        } catch (error) {
          console.error("Error checking pairing status:", error);
        }
      },
      (error) => {
        console.error("Error listening to user document in settings:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const fetchUserData = async () => {
    try {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));

      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData({
          displayName: data.displayName || data.name || "User",
          dob: data.dob || data.formattedAnniversary || "01/01/2000",
          defaultLanguage: data.defaultLanguage || "en",
        });
      } else {
        setUserData({
          displayName: "User",
          dob: "01/01/2000",
          defaultLanguage: "en",
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData({
        displayName: "User",
        dob: "01/01/2000",
        defaultLanguage: "en",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPairingStatus = async () => {
    try {
      const status = await checkPairingStatus();
      setPairingStatus(status);
    } catch (error) {
      console.error("Error checking pairing status:", error);
    }
  };

  const calculateDaysTogether = (anniversaryDate: string): number => {
    try {
      const [day, month, year] = anniversaryDate.split("/");
      const anniversary = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - anniversary.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      console.error("Error calculating days:", error);
      return 0;
    }
  };

  const handleGameHistory = () => {
    if (!pairingStatus.isPaired) {
      Alert.alert("Not Paired", "You need to be paired to view game history");
      return;
    }
    router.push("/(pages)/game-history");
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: confirmSignOut,
      },
    ]);
  };

  const confirmSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut(auth);
      router.replace("/(setup)/welcome");
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  };

  const handleLanguageSetting = () => {
    setLanguageModalVisible(true);
  };

  const handleLanguageChange = async (newLanguage: LangCode) => {
    if (!auth.currentUser || newLanguage === userData?.defaultLanguage) {
      setLanguageModalVisible(false);
      return;
    }

    try {
      setChangingLanguage(true);

      // Update in Firestore
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        defaultLanguage: newLanguage,
      });

      // Send notification to chat if user is paired
      if (
        pairingStatus.isPaired &&
        pairingStatus.coupleId &&
        userData?.displayName
      ) {
        try {
          await sendLanguageChangeNotification(
            pairingStatus.coupleId,
            userData.displayName,
            newLanguage
          );
        } catch (notificationError) {
          console.error(
            "Error sending language change notification:",
            notificationError
          );
          // Don't show error to user - notification is nice-to-have
        }
      }

      // Update local state
      setUserData((prev) =>
        prev ? { ...prev, defaultLanguage: newLanguage } : null
      );

      // Clear profile cache so chat uses updated language
      await clearProfileCache();

      setLanguageModalVisible(false);

      const selectedLang = LANGUAGE_OPTIONS.find(
        (lang) => lang.code === newLanguage
      );
      Alert.alert(
        "Language Updated",
        `Your language has been changed to ${selectedLang?.name}`
      );
    } catch (error) {
      console.error("Error updating language:", error);
      Alert.alert(
        "Error",
        "Failed to update language setting. Please try again."
      );
    } finally {
      setChangingLanguage(false);
    }
  };

  const getCurrentLanguageName = (): string => {
    const currentLang = LANGUAGE_OPTIONS.find(
      (lang) => lang.code === userData?.defaultLanguage
    );
    return currentLang
      ? `${currentLang.name} (${currentLang.nativeName})`
      : "English";
  };

  const handleCoupleConnection = () => {
    router.push("/(pages)/pairing");
  };

  if (loading) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </ScrollView>
    );
  }

  const daysTogether =
    pairingStatus.isPaired && pairingStatus.anniversary
      ? calculateDaysTogether(pairingStatus.anniversary)
      : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.header}>Setting</Text>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={require("@/assets/images/icons/heart.png")}
              style={styles.profileImage}
            />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileText}>
              {pairingStatus.isPaired
                ? `${userData?.displayName || "You"} ♡ ${
                    pairingStatus.partnerName || "Partner"
                  }`
                : userData?.displayName || "User"}
            </Text>
            {pairingStatus.isPaired && daysTogether !== null && (
              <Text style={styles.daysText}>
                Together for {daysTogether} days
              </Text>
            )}
          </View>
        </View>

        {/* Game History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game History</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleGameHistory}
            activeOpacity={0.7}
          >
            <Text style={styles.settingText}>Past Game Answers</Text>
            <Text style={styles.arrow}>{">"}</Text>
          </TouchableOpacity>
        </View>

        {/* System Setting */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Setting</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleLanguageSetting}
            activeOpacity={0.7}
          >
            <View style={styles.settingItemContent}>
              <Text style={styles.settingText}>Language Setting</Text>
              <Text style={styles.settingValue}>
                {getCurrentLanguageName()}
              </Text>
            </View>
            <Text style={styles.arrow}>{">"}</Text>
          </TouchableOpacity>
        </View>

        {/* Personal / Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal / Privacy</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleCoupleConnection}
            activeOpacity={0.7}
          >
            <Text style={styles.settingText}>Couple Connection</Text>
            <Text style={styles.arrow}>{">"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleSignOut}
            disabled={signingOut}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.settingText, signingOut && styles.disabledText]}
            >
              {signingOut ? "Signing Out..." : "Sign Out"}
            </Text>
            <Text style={styles.arrow}>{">"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <Text style={styles.modalSubtitle}>
              Choose your preferred language
            </Text>

            {LANGUAGE_OPTIONS.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageOption,
                  userData?.defaultLanguage === language.code &&
                    styles.selectedLanguageOption,
                ]}
                onPress={() => handleLanguageChange(language.code)}
                disabled={changingLanguage}
                activeOpacity={0.7}
              >
                <View style={styles.languageInfo}>
                  <Text
                    style={[
                      styles.languageName,
                      userData?.defaultLanguage === language.code &&
                        styles.selectedLanguageText,
                    ]}
                  >
                    {language.name}
                  </Text>
                  <Text
                    style={[
                      styles.languageNative,
                      userData?.defaultLanguage === language.code &&
                        styles.selectedLanguageText,
                    ]}
                  >
                    {language.nativeName}
                  </Text>
                </View>
                {userData?.defaultLanguage === language.code && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setLanguageModalVisible(false)}
              disabled={changingLanguage}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fef9f2",
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  loadingText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E2E2E",
    marginBottom: 30,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
    paddingVertical: 10,
  },
  profileImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  profileImage: {
    width: 30,
    height: 30,
    tintColor: "#888",
  },
  profileInfo: {
    flex: 1,
  },
  profileText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E2E2E",
    marginBottom: 4,
  },
  daysText: {
    fontSize: 14,
    color: "#888",
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E2E2E",
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
  },
  settingItemContent: {
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: "#2E2E2E",
  },
  settingValue: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  disabledText: {
    color: "#888",
  },
  arrow: {
    fontSize: 18,
    color: "#888",
    fontWeight: "bold",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E2E2E",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 20,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f8f8f8",
  },
  selectedLanguageOption: {
    backgroundColor: "#e8f5e8",
    borderColor: "#4caf50",
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E2E2E",
  },
  languageNative: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  selectedLanguageText: {
    color: "#2e7d32",
  },
  checkmark: {
    fontSize: 20,
    color: "#4caf50",
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
});
