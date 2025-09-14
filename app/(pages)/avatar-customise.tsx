import { auth, db } from "@/firebase/config";
import { Stack, useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

interface UserData {
  displayName: string;
  ownedItems?: string[];
}

interface OutfitItem {
  id: string;
  name: string;
  category: string;
  imagePath: any;
  isOwned: boolean;
}

export default function AvatarCustomisePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<"fashion" | "avatar">("fashion");
  const [activeCategory, setActiveCategory] = useState<string>("Hair");
  const [selectedOutfit, setSelectedOutfit] = useState<{
    hair: string;
    top: string;
    bottom: string;
    accessory?: string;
    shoe?: string;
  }>({
    hair: "hair_space-bun_black",
    top: "top_basic_white",
    bottom: "bottom_basic_white",
  });

  const [originalOutfit, setOriginalOutfit] = useState<{
    hair: string;
    top: string;
    bottom: string;
    accessory?: string;
    shoe?: string;
  }>({
    hair: "hair_space-bun_black",
    top: "top_basic_white",
    bottom: "bottom_basic_white",
  });

  // Available categories for each tab
  const fashionCategories = ["Hair", "Top", "Bottom", "Accessory", "Shoe"];
  const avatarCategories = ["Skin"];

  // Sample outfit items
  const outfitItems: OutfitItem[] = [
    // Hair items
    {
      id: "hair_space-bun_black",
      name: "Space Bun",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_space-bun_black.png"),
      isOwned: true,
    },
    {
      id: "hair_buzz_black",
      name: "Buzz Cut",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_buzz_black.png"),
      isOwned: true,
    },
    {
      id: "hair_buzz_blonde",
      name: "Buzz Blonde",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_buzz_blonde.png"),
      isOwned: true,
    },
    {
      id: "hair_ponytail_brown",
      name: "Ponytail",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_ponytail_brown.png"),
      isOwned: true,
    },
    {
      id: "hair_short-2_brown",
      name: "Short Hair",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_short-2_brown.png"),
      isOwned: true,
    },
    {
      id: "hair_short-1_black",
      name: "Short Black",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_short-1_black.png"),
      isOwned: true,
    },
    {
      id: "hair_short-1_gray",
      name: "Short Gray",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_short-1_gray.png"),
      isOwned: true,
    },
    {
      id: "hair_medium_white",
      name: "Medium White",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_medium_white.png"),
      isOwned: true,
    },
    {
      id: "hair_hijab_light-blue",
      name: "Hijab Blue",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_hijab_light-blue.png"),
      isOwned: true,
    },
    {
      id: "hair_hijab_pink",
      name: "Hijab Pink",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_hijab_pink.png"),
      isOwned: true,
    },
    {
      id: "hair_hijab_purple",
      name: "Hijab Purple",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_hijab_purple.png"),
      isOwned: true,
    },
    {
      id: "hair_hijab_yellow",
      name: "Hijab Yellow",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_hijab_yellow.png"),
      isOwned: true,
    },

    // Top items
    {
      id: "top_basic_white",
      name: "Basic White",
      category: "Top",
      imagePath: require("@/assets/images/avatar/outfit/top/top_basic_white.png"),
      isOwned: true,
    },
    {
      id: "top_cheong-same_red",
      name: "Cheongsam Red",
      category: "Top",
      imagePath: require("@/assets/images/avatar/outfit/top/top_cheong-same_red.png"),
      isOwned: true,
    },
    {
      id: "top_hijab_purple",
      name: "Hijab Purple",
      category: "Top",
      imagePath: require("@/assets/images/avatar/outfit/top/top_hijab_purple.png"),
      isOwned: true,
    },
    {
      id: "top_hijab_yellow",
      name: "Hijab Yellow",
      category: "Top",
      imagePath: require("@/assets/images/avatar/outfit/top/top_hijab_yellow.png"),
      isOwned: true,
    },

    // Bottom items
    {
      id: "bottom_basic_white",
      name: "Basic White",
      category: "Bottom",
      imagePath: require("@/assets/images/avatar/outfit/bottom/bottom_basic_white.png"),
      isOwned: true,
    },
    {
      id: "bottom_cheong-sam_red",
      name: "Cheongsam Red",
      category: "Bottom",
      imagePath: require("@/assets/images/avatar/outfit/bottom/bottom_cheong-sam_red.png"),
      isOwned: true,
    },
    {
      id: "bottom_hijab_purple",
      name: "Hijab Purple",
      category: "Bottom",
      imagePath: require("@/assets/images/avatar/outfit/bottom/bottom_hijab_purple.png"),
      isOwned: true,
    },
    {
      id: "bottom_hijab_yellow",
      name: "Hijab Yellow",
      category: "Bottom",
      imagePath: require("@/assets/images/avatar/outfit/bottom/bottom_hijab_yellow.png"),
      isOwned: true,
    },
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      if (!auth.currentUser) return;

      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));

      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData({
          displayName: data.displayName || data.name || "User",
          ownedItems: data.ownedItems || [
            "hair_space-bun_black",
            "top_basic_white",
            "bottom_basic_white",
          ], // Default owned items
        });

        // Load saved outfit if it exists
        if (data.selectedOutfit) {
          const savedOutfit = {
            hair: data.selectedOutfit.hair || "hair_space-bun_black",
            top: data.selectedOutfit.top || "top_basic_white",
            bottom: data.selectedOutfit.bottom || "bottom_basic_white",
            accessory: data.selectedOutfit.accessory,
            shoe: data.selectedOutfit.shoe,
          };
          setSelectedOutfit(savedOutfit);
          setOriginalOutfit(savedOutfit);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData({
        displayName: "User",
        ownedItems: ["top_basic_white", "bottom_basic_white"],
      });
    }
  };

  const handleItemSelect = (item: OutfitItem) => {
    if (!item.isOwned) return; // Can't select items user doesn't own

    const categoryKey =
      item.category.toLowerCase() as keyof typeof selectedOutfit;
    setSelectedOutfit((prev) => ({
      ...prev,
      [categoryKey]: item.id,
    }));
  };

  // Optimized tab switching handlers
  const handleFashionTabPress = useCallback(() => {
    setActiveTab("fashion");
    setActiveCategory("Hair");
  }, []);

  const handleAvatarTabPress = useCallback(() => {
    setActiveTab("avatar");
    setActiveCategory("Skin");
  }, []);

  // Memoize categories for each tab to avoid re-computation
  const currentCategories = useMemo(() => {
    return activeTab === "fashion" ? fashionCategories : avatarCategories;
  }, [activeTab]);

  // Memoize category button handler
  const handleCategoryPress = useCallback((category: string) => {
    setActiveCategory(category);
  }, []);

  // Memoize outfit change detection result
  const outfitHasChanged = useMemo(() => {
    return JSON.stringify(selectedOutfit) !== JSON.stringify(originalOutfit);
  }, [selectedOutfit, originalOutfit]);

  const handleSaveOutfit = async () => {
    try {
      if (!auth.currentUser) return;

      // Filter out undefined values for Firestore
      const outfitToSave: any = {
        hair: selectedOutfit.hair,
        top: selectedOutfit.top,
        bottom: selectedOutfit.bottom,
      };

      // Only add accessory and shoe if they have values
      if (selectedOutfit.accessory) {
        outfitToSave.accessory = selectedOutfit.accessory;
      }
      if (selectedOutfit.shoe) {
        outfitToSave.shoe = selectedOutfit.shoe;
      }

      // Save outfit to user's document in Firestore
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        selectedOutfit: outfitToSave,
      });

      // Update original outfit to reflect saved state
      setOriginalOutfit(selectedOutfit);

      // Show success feedback and redirect
      Alert.alert("Success!", "Your outfit has been saved successfully.", [
        {
          text: "OK",
          onPress: () => router.back(), // Navigate back to avatar page
        },
      ]);
    } catch (error) {
      console.error("Error saving outfit:", error);
      Alert.alert("Error", "Failed to save outfit. Please try again.");
    }
  };

  const filteredItems = useMemo(() => {
    return outfitItems.filter(
      (item) =>
        item.category === activeCategory &&
        (userData?.ownedItems?.includes(item.id) || false)
    );
  }, [activeCategory, userData?.ownedItems]);

  const renderOutfitGrid = useCallback(() => {
    const itemWidth = (screenWidth - 40) / 3 - 10 + 9; // 3 items per row

    return (
      <View style={styles.outfitGrid}>
        {filteredItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.outfitItem,
              { width: itemWidth, height: itemWidth },
              !item.isOwned && styles.lockedItem,
              selectedOutfit[
                activeCategory.toLowerCase() as keyof typeof selectedOutfit
              ] === item.id && styles.selectedItem,
            ]}
            onPress={() => handleItemSelect(item)}
            disabled={!item.isOwned}
          >
            {item.imagePath ? (
              <Image
                source={item.imagePath}
                style={styles.outfitImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.placeholderItem}>
                <Text style={styles.placeholderText}>?</Text>
              </View>
            )}
            {!item.isOwned && (
              <View style={styles.lockOverlay}>
                <Text style={styles.lockIcon}>🔒</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [filteredItems, selectedOutfit, activeCategory]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Top Half - Avatar Display */}
        <View style={styles.topHalfContainer}>
          <Image
            source={require("@/assets/images/avatar/background/background_house_wardrobe.png")}
            style={styles.wardrobeBackgroundImage}
            resizeMode="contain"
          />

          <ScrollView
            style={styles.avatarScrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.avatarDisplayContainer}>
              <View style={styles.layeredAvatarContainer}>
                {/* Base skin layer */}
                <Image
                  source={require("@/assets/images/avatar/skin/skin_body_full.png")}
                  style={styles.avatarLayerImage}
                  resizeMode="contain"
                />

                {/* Hair layer (non-hijab only) */}
                {selectedOutfit.hair &&
                  !selectedOutfit.hair.includes("hijab") && (
                    <Image
                      source={
                        outfitItems.find(
                          (item) => item.id === selectedOutfit.hair
                        )?.imagePath
                      }
                      style={styles.avatarHairImage}
                      resizeMode="contain"
                    />
                  )}

                {/* Bottom clothing layer */}
                {selectedOutfit.bottom && (
                  <Image
                    source={
                      outfitItems.find(
                        (item) => item.id === selectedOutfit.bottom
                      )?.imagePath
                    }
                    style={styles.avatarBottomImage}
                    resizeMode="contain"
                  />
                )}

                {/* Top clothing layer */}
                {selectedOutfit.top && (
                  <Image
                    source={
                      outfitItems.find((item) => item.id === selectedOutfit.top)
                        ?.imagePath
                    }
                    style={styles.avatarTopImage}
                    resizeMode="contain"
                  />
                )}

                {/* Hijab hair layer (above top clothing) */}
                {selectedOutfit.hair &&
                  selectedOutfit.hair.includes("hijab") && (
                    <Image
                      source={
                        outfitItems.find(
                          (item) => item.id === selectedOutfit.hair
                        )?.imagePath
                      }
                      style={styles.avatarHairImage}
                      resizeMode="contain"
                    />
                  )}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Bottom Half - Customization Menu */}
        <View style={styles.bottomHalfContainer}>
          {/* Tab Section */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "fashion" && styles.activeTab]}
              onPress={handleFashionTabPress}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "fashion" && styles.activeTabText,
                ]}
              >
                Fashion
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "avatar" && styles.activeTab]}
              onPress={handleAvatarTabPress}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "avatar" && styles.activeTabText,
                ]}
              >
                Avatar
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.customizationScrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Category Buttons */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScrollView}
              contentContainerStyle={styles.categoryContainer}
            >
              {currentCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    activeCategory === category && styles.activeCategoryButton,
                  ]}
                  onPress={() => handleCategoryPress(category)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      activeCategory === category && styles.activeCategoryText,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Outfit Grid */}
            {renderOutfitGrid()}
          </ScrollView>
        </View>

        {/* Save Button - Only show when outfit has changed */}
        {outfitHasChanged && (
          <View style={styles.saveButtonContainer}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveOutfit}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>Save Outfit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fef9f2",
    paddingTop: 0,
    marginTop: 0,
  },

  // Top Half - Avatar Display
  topHalfContainer: {
    paddingTop: 0,
    position: "relative",
    minHeight: 450,
  },
  wardrobeBackgroundImage: {
    position: "absolute",
    top: -205,
    left: -148,
    width: "175%",
    height: "175%",
    zIndex: 0,
  },
  avatarScrollView: {
    zIndex: 1,
  },

  // Bottom Half - Customization Menu
  bottomHalfContainer: {
    flex: 1,
    backgroundColor: "#fef9f2",
    marginTop: -30,
  },
  customizationScrollView: {
    flex: 1,
  },

  // Avatar Display Styles
  avatarDisplayContainer: {
    alignItems: "center",
    paddingTop: 145,
    paddingBottom: 135,
  },
  layeredAvatarContainer: {
    position: "relative",
    width: 216,
    height: 216,
  },
  avatarLayerImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 216,
    height: 216,
    maxWidth: 216,
    maxHeight: 216,
  },
  avatarHairImage: {
    position: "absolute",
    top: -41,
    left: 1,
    width: 213,
    height: 213,
    maxWidth: 213,
    maxHeight: 213,
  },
  avatarBottomImage: {
    position: "absolute",
    top: 9,
    left: 7,
    width: 206,
    height: 206,
    maxWidth: 206,
    maxHeight: 206,
  },
  avatarTopImage: {
    position: "absolute",
    top: 3,
    left: 6,
    width: 206,
    height: 206,
    maxWidth: 206,
    maxHeight: 206,
  },
  avatarName: {
    fontSize: 14,
    color: "#2E2E2E",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 15,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  // Tab Styles
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fef9f2",
    marginHorizontal: 0,
    borderRadius: 0,
    padding: 4,
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#ff9197",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "600",
  },

  // Category Styles
  categoryScrollView: {
    marginBottom: 20,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    gap: 5,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginRight: 5,
  },
  activeCategoryButton: {
    backgroundColor: "#ff9197",
    borderColor: "#ff9197",
  },
  categoryText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeCategoryText: {
    color: "#fff",
    fontWeight: "600",
  },

  // Outfit Grid Styles
  outfitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    gap: 10,
    paddingBottom: 30,
    backgroundColor: "#fef9f2",
  },
  outfitItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    position: "relative",
  },
  selectedItem: {
    borderColor: "#ff9197",
    backgroundColor: "#fff5f5",
  },
  lockedItem: {
    opacity: 0.6,
  },
  outfitImage: {
    width: "80%",
    height: "80%",
  },
  placeholderItem: {
    width: "80%",
    height: "80%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  placeholderText: {
    fontSize: 24,
    color: "#ccc",
  },
  lockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  lockIcon: {
    fontSize: 20,
  },

  // Save Button Styles
  saveButtonContainer: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  saveButton: {
    backgroundColor: "#ff9197",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
