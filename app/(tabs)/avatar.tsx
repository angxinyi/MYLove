import { auth, db } from "@/firebase/config";
import { checkPairingStatus } from "@/services/coupleLogic";
import { useFocusEffect, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface UserData {
  displayName: string;
  dob: string;
  defaultLanguage?: string;
  points?: number;
  selectedOutfit?: {
    hair: string;
    top: string;
    bottom: string;
    accessory?: string;
    shoe?: string;
  };
}

interface PairingStatus {
  isPaired: boolean;
  coupleId?: string;
  partnerName?: string;
  anniversary?: string;
  partnerOutfit?: {
    hair: string;
    top: string;
    bottom: string;
    accessory?: string;
    shoe?: string;
  };
}

export default function AvatarPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [pairingStatus, setPairingStatus] = useState<PairingStatus>({
    isPaired: false,
  });
  const [loading, setLoading] = useState(true);

  // One-time population of user outfits (runs discretely in background)
  const populateUserOutfits = async () => {
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);

      const defaultOutfit = {
        hair: "hair_space-bun_black",
        top: "top_basic_white",
        bottom: "bottom_basic_white",
      };

      let updateCount = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        if (!userData.selectedOutfit) {
          try {
            await updateDoc(doc(db, "users", userDoc.id), {
              selectedOutfit: defaultOutfit,
            });
            updateCount++;
          } catch (error) {
            // Silently continue if individual update fails
          }
        }
      }

      if (updateCount > 0) {
        console.log(`Updated ${updateCount} users with default outfits`);
      }
    } catch (error) {
      // Silently fail - this is a background operation
    }
  };

  useEffect(() => {
    // Run population check once (doesn't affect UI)
    populateUserOutfits();

    let userUnsubscribe: (() => void) | null = null;
    let partnerUnsubscribe: (() => void) | null = null;
    let authUnsubscribe: (() => void) | null = null;

    // Set up authentication state listener
    authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, set up listeners
        fetchUserData();
        fetchPairingStatus();
        setupUserListener();
      } else {
        // User is signed out, clean up listeners
        if (userUnsubscribe) {
          userUnsubscribe();
          userUnsubscribe = null;
        }
        if (partnerUnsubscribe) {
          partnerUnsubscribe();
          partnerUnsubscribe = null;
        }
        setUserData(null);
        setUserName(null);
        setPairingStatus({ isPaired: false });
        setLoading(false);
      }
    });

    function setupUserListener() {
      if (!auth.currentUser) return;

      userUnsubscribe = onSnapshot(
        doc(db, "users", auth.currentUser.uid),
        async (userDoc) => {
          try {
            // Check if user is still authenticated
            if (!auth.currentUser) {
              return;
            }

            if (!userDoc.exists()) {
              setPairingStatus({ isPaired: false });
              if (partnerUnsubscribe) {
                partnerUnsubscribe();
                partnerUnsubscribe = null;
              }
              return;
            }

            const data = userDoc.data();

            // Update user data including outfit changes
            const updatedUserData = {
              displayName: data.displayName || data.name || "User",
              dob: data.dob || data.formattedAnniversary || "01/01/2000",
              defaultLanguage: data.defaultLanguage || "en",
              points: data.points || 0, // Get points from main user document
              selectedOutfit: data.selectedOutfit || {
                hair: "hair_space-bun_black",
                top: "top_basic_white",
                bottom: "bottom_basic_white",
              },
            };
            setUserData(updatedUserData);
            setUserName(updatedUserData.displayName);

            if (!data.coupleId) {
              setPairingStatus({ isPaired: false });
              if (partnerUnsubscribe) {
                partnerUnsubscribe();
                partnerUnsubscribe = null;
              }
              return;
            }

            // User is paired, get full pairing status including partner outfit
            const status = await checkPairingStatus();
            setPairingStatus(status);

            // Set up listener for partner's outfit changes
            if (status.isPaired && status.coupleId) {
              // Clean up existing partner listener
              if (partnerUnsubscribe) {
                partnerUnsubscribe();
                partnerUnsubscribe = null;
              }

              // Get couple data to find partner ID
              const coupleDoc = await getDoc(
                doc(db, "couples", status.coupleId)
              );
              if (coupleDoc.exists()) {
                const coupleData = coupleDoc.data();
                const members = coupleData.members || [];
                const partnerId = members.find(
                  (id: string) => id !== auth.currentUser?.uid
                );

                if (partnerId) {
                  // Listen to partner's document for outfit changes
                  partnerUnsubscribe = onSnapshot(
                    doc(db, "users", partnerId),
                    async (partnerDoc) => {
                      if (partnerDoc.exists()) {
                        const partnerData = partnerDoc.data();

                        // Update pairing status with new partner outfit
                        const updatedStatus = await checkPairingStatus();
                        setPairingStatus(updatedStatus);
                      }
                    },
                    (error) => {
                      console.error(
                        "Error listening to partner document:",
                        error
                      );
                    }
                  );
                }
              }
            }
          } catch (error) {
            console.error("Error checking pairing status:", error);
          }
        },
        (error) => {
          // Only log error if user is still authenticated
          if (auth.currentUser) {
            console.error("Error listening to user document in avatar:", error);
          }
        }
      );
    }

    return () => {
      if (authUnsubscribe) {
        authUnsubscribe();
      }
      if (userUnsubscribe) {
        userUnsubscribe();
      }
      if (partnerUnsubscribe) {
        partnerUnsubscribe();
      }
    };
  }, []);

  // Add focus effect to refresh data when returning from other screens
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

  const fetchUserData = async () => {
    try {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));

      if (userDoc.exists()) {
        const data = userDoc.data();

        const userData = {
          displayName: data.displayName || data.name || "User",
          dob: data.dob || data.formattedAnniversary || "01/01/2000",
          defaultLanguage: data.defaultLanguage || "en",
          points: data.points || 0,
          selectedOutfit: data.selectedOutfit || {
            hair: "hair_space-bun_black",
            top: "top_basic_white",
            bottom: "bottom_basic_white",
          },
        };
        setUserData(userData);
        setUserName(userData.displayName);
      } else {
        const defaultData = {
          displayName: "User",
          dob: "01/01/2000",
          defaultLanguage: "en",
          points: 0,
          selectedOutfit: {
            hair: "hair_space-bun_black",
            top: "top_basic_white",
            bottom: "bottom_basic_white",
          },
        };
        setUserData(defaultData);
        setUserName("User");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      const fallbackData = {
        displayName: "User",
        dob: "01/01/2000",
        defaultLanguage: "en",
        points: 0,
        selectedOutfit: {
          hair: "hair_space-bun_black",
          top: "top_basic_white",
          bottom: "bottom_basic_white",
        },
      };
      setUserData(fallbackData);
      setUserName("User");
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

  const getOutfitImageSource = (itemId: string, category: string) => {
    const outfitImages = {
      hair: {
        "hair_space-bun_black": require("@/assets/images/avatar/outfit/hair/hair_space-bun_black.png"),
        "hair_short-2_brown": require("@/assets/images/avatar/outfit/hair/hair_short-2_brown.png"),
        "hair_short-1_black": require("@/assets/images/avatar/outfit/hair/hair_short-1_black.png"),
        "hair_short-1_gray": require("@/assets/images/avatar/outfit/hair/hair_short-1_gray.png"),
        hair_medium_white: require("@/assets/images/avatar/outfit/hair/hair_medium_white.png"),
        hair_ponytail_brown: require("@/assets/images/avatar/outfit/hair/hair_ponytail_brown.png"),
        hair_buzz_black: require("@/assets/images/avatar/outfit/hair/hair_buzz_black.png"),
        hair_buzz_blonde: require("@/assets/images/avatar/outfit/hair/hair_buzz_blonde.png"),
        "hair_hijab_light-blue": require("@/assets/images/avatar/outfit/hair/hair_hijab_light-blue.png"),
        hair_hijab_purple: require("@/assets/images/avatar/outfit/hair/hair_hijab_purple.png"),
        hair_hijab_pink: require("@/assets/images/avatar/outfit/hair/hair_hijab_pink.png"),
        hair_hijab_yellow: require("@/assets/images/avatar/outfit/hair/hair_hijab_yellow.png"),
      },
      top: {
        top_basic_white: require("@/assets/images/avatar/outfit/top/top_basic_white.png"),
        "top_cheong-same_red": require("@/assets/images/avatar/outfit/top/top_cheong-same_red.png"),
        top_hijab_yellow: require("@/assets/images/avatar/outfit/top/top_hijab_yellow.png"),
        top_hijab_purple: require("@/assets/images/avatar/outfit/top/top_hijab_purple.png"),
      },
      bottom: {
        bottom_basic_white: require("@/assets/images/avatar/outfit/bottom/bottom_basic_white.png"),
        "bottom_cheong-sam_red": require("@/assets/images/avatar/outfit/bottom/bottom_cheong-sam_red.png"),
        bottom_hijab_yellow: require("@/assets/images/avatar/outfit/bottom/bottom_hijab_yellow.png"),
        bottom_hijab_purple: require("@/assets/images/avatar/outfit/bottom/bottom_hijab_purple.png"),
      },
    };

    try {
      const categoryImages =
        outfitImages[category as keyof typeof outfitImages];
      if (
        categoryImages &&
        categoryImages[itemId as keyof typeof categoryImages]
      ) {
        return categoryImages[itemId as keyof typeof categoryImages];
      }

      // Fallback to default images if item not found
      switch (category) {
        case "hair":
          return outfitImages.hair["hair_space-bun_black"];
        case "top":
          return outfitImages.top["top_basic_white"];
        case "bottom":
          return outfitImages.bottom["bottom_basic_white"];
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error loading ${category} image ${itemId}:`, error);
      return null;
    }
  };

  const handleCustomizeAvatar = () => {
    router.push("/(pages)/avatar-customise");
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
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/avatar/background/background_scenary_sunny.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Header Row - Currency & Customize Button */}
          <View style={styles.headerRow}>
            {/* HibisCoin Counter */}
            <View style={styles.currencyContainer}>
              <Text style={styles.currencyCount}>{userData?.points || 0}</Text>
              <View style={styles.currencyBadge}>
                <Image
                  source={require("@/assets/images/icons/hibiscoin.png")}
                  style={styles.hibiscoinIcon}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Customize Button */}
            <TouchableOpacity
              style={styles.customizeButton}
              onPress={handleCustomizeAvatar}
              activeOpacity={0.7}
            >
              <Image
                source={require("@/assets/images/icons/paint-brush.png")}
                style={styles.paintBrushIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* User Info Section - Positioned on the right */}
          <View style={styles.userInfoSection}>
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

          {/* Avatar House Section */}
          <View style={styles.avatarSection}>
            <View style={styles.house}>
              {/* House Background Image */}
              <Image
                source={require("@/assets/images/avatar/background/background_house_base.png")}
                style={styles.houseImage}
                resizeMode="contain"
              />

              {/* Two Avatar Images positioned above the house */}
              <View style={styles.avatarsContainer}>
                <View style={styles.individualAvatarContainer}>
                  <View style={styles.layeredAvatarContainer}>
                    {/* Base skin layer */}
                    <Image
                      source={require("@/assets/images/avatar/skin/skin_body_full.png")}
                      style={styles.avatarLayerImage}
                      resizeMode="contain"
                    />
                    {/* Hair layer (non-hijab only) */}
                    {userData?.selectedOutfit?.hair &&
                      !userData.selectedOutfit.hair.includes("hijab") && (
                        <Image
                          source={getOutfitImageSource(
                            userData.selectedOutfit.hair,
                            "hair"
                          )}
                          style={styles.avatarHairImage}
                          resizeMode="contain"
                        />
                      )}
                    {/* Bottom clothing layer */}
                    <Image
                      source={getOutfitImageSource(
                        userData?.selectedOutfit?.bottom ||
                          "bottom_basic_white",
                        "bottom"
                      )}
                      style={styles.avatarBottomImage}
                      resizeMode="contain"
                    />
                    {/* Top clothing layer */}
                    <Image
                      source={getOutfitImageSource(
                        userData?.selectedOutfit?.top || "top_basic_white",
                        "top"
                      )}
                      style={styles.avatarTopImage}
                      resizeMode="contain"
                    />
                    {/* Hijab hair layer (above top clothing) */}
                    {userData?.selectedOutfit?.hair &&
                      userData.selectedOutfit.hair.includes("hijab") && (
                        <Image
                          source={getOutfitImageSource(
                            userData.selectedOutfit.hair,
                            "hair"
                          )}
                          style={styles.avatarHairImage}
                          resizeMode="contain"
                        />
                      )}
                  </View>
                  <Text style={styles.avatarName}>
                    {userData?.displayName || "You"}
                  </Text>
                </View>
                <View style={styles.individualAvatarContainer}>
                  {pairingStatus.isPaired ? (
                    <View style={styles.layeredAvatarContainer}>
                      {/* Base skin layer for partner */}
                      <Image
                        source={require("@/assets/images/avatar/skin/skin_body_full.png")}
                        style={styles.avatarLayerImage}
                        resizeMode="contain"
                      />
                      {/* Partner Hair layer (non-hijab only) */}
                      {pairingStatus.partnerOutfit?.hair &&
                        !pairingStatus.partnerOutfit.hair.includes("hijab") && (
                          <Image
                            source={getOutfitImageSource(
                              pairingStatus.partnerOutfit.hair,
                              "hair"
                            )}
                            style={styles.avatarHairImage}
                            resizeMode="contain"
                          />
                        )}
                      {/* Partner Bottom clothing layer */}
                      <Image
                        source={getOutfitImageSource(
                          pairingStatus.partnerOutfit?.bottom ||
                            "bottom_basic_white",
                          "bottom"
                        )}
                        style={styles.avatarBottomImage}
                        resizeMode="contain"
                      />
                      {/* Partner Top clothing layer */}
                      <Image
                        source={getOutfitImageSource(
                          pairingStatus.partnerOutfit?.top || "top_basic_white",
                          "top"
                        )}
                        style={styles.avatarTopImage}
                        resizeMode="contain"
                      />
                      {/* Partner Hijab hair layer (above top clothing) */}
                      {pairingStatus.partnerOutfit?.hair &&
                        pairingStatus.partnerOutfit.hair.includes("hijab") && (
                          <Image
                            source={getOutfitImageSource(
                              pairingStatus.partnerOutfit.hair,
                              "hair"
                            )}
                            style={styles.avatarHairImage}
                            resizeMode="contain"
                          />
                        )}
                    </View>
                  ) : (
                    <Image
                      source={require("@/assets/images/avatar/skin/skin_body_torso.png")}
                      style={styles.avatarUnpairImage}
                      resizeMode="contain"
                    />
                  )}
                  <Text style={styles.avatarName}>
                    {pairingStatus.partnerName || "Partner"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Connect Partner Button - Only show if not paired */}
          {!pairingStatus.isPaired && (
            <TouchableOpacity
              style={styles.connectButton}
              onPress={handleCoupleConnection}
              activeOpacity={0.7}
            >
              <Text style={styles.connectButtonText}>
                Please connect with your partner
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fef9f2",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  backgroundImage: {
    position: "absolute",
    top: "-15%",
    left: "-10%",
    width: "130%",
    height: "130%",
    zIndex: 0,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "transparent", // Transparent to show background image
  },
  loadingText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },

  // Header Row Styles
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },

  // Currency Counter Styles
  currencyContainer: {
    position: "relative",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 156,
  },
  currencyCount: {
    fontSize: 18,
    color: "#2E2E2E",
    fontWeight: "600",
  },
  currencyBadge: {
    position: "absolute",
    top: -13,
    left: "25%",
    marginLeft: -12,
    justifyContent: "center",
    alignItems: "center",
  },
  hibiscoinIcon: {
    width: 30,
    height: 30,
  },

  // Customize Button Styles
  customizeButton: {
    backgroundColor: "#ff9197",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  paintBrushIcon: {
    width: 24,
    height: 24,
    tintColor: "#fff",
  },

  // User Info Section Styles
  userInfoSection: {
    alignItems: "flex-end",
    marginBottom: 78,
    paddingRight: 5,
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

  // Avatar House Section Styles
  avatarSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  house: {
    position: "relative",
    alignItems: "center",
  },
  houseImage: {
    width: "105%",
    height: undefined,
    aspectRatio: 1,
    opacity: 0.8,
    transform: [{ scale: 1.1 }],
  },
  avatarsContainer: {
    position: "absolute",
    top: "49%",
    left: "5%",
    right: "5%",
    bottom: "1%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  individualAvatarContainer: {
    padding: 0,
    alignItems: "center",
    justifyContent: "center",
    width: "35%",
  },
  avatarUnpairImage: {
    width: 154,
    height: 154,
    maxWidth: 154,
    maxHeight: 154,
  },
  layeredAvatarContainer: {
    position: "relative",
    width: 154,
    height: 154,
  },
  avatarLayerImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 154,
    height: 154,
    maxWidth: 154,
    maxHeight: 154,
  },
  avatarOutfitImage: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 138,
    height: 138,
    maxWidth: 138,
    maxHeight: 138,
  },
  avatarHairImage: {
    position: "absolute",
    top: -29,
    left: 1,
    width: 152,
    height: 152,
    maxWidth: 152,
    maxHeight: 152,
  },
  avatarBottomImage: {
    position: "absolute",
    top: 2,
    left: 5,
    width: 147,
    height: 147,
    maxWidth: 147,
    maxHeight: 147,
  },
  avatarTopImage: {
    position: "absolute",
    top: 2,
    left: 4,
    width: 147,
    height: 147,
    maxWidth: 147,
    maxHeight: 147,
  },
  avatarName: {
    fontSize: 12,
    color: "#2E2E2E",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 8,
    marginLeft: 5,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  // Connect Button Styles
  connectButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ff9197",
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  connectButtonText: {
    fontSize: 16,
    color: "#ff9197",
    fontWeight: "600",
  },
});
