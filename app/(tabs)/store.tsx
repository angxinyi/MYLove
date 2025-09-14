import { auth, db } from "@/firebase/config";
import { sendMessage } from "@/services/chatServices";
import {
  checkPairingStatus,
  getCoupleGameState,
  startChoiceGame,
  startDailyQuestion,
} from "@/services/coupleLogic";
import { getSurpriseDate, getTailoredDate } from "@/services/dateRecommender";
import { seedChallenges } from "@/services/populateDB/seed-challenges";
import { seedCoupleCoupons } from "@/services/populateDB/seed-coupons";
import { seedDateIdeas } from "@/services/populateDB/seed-dates";
import { seedQuestions } from "@/services/populateDB/seed-questions";
import {
  redeemChallenge,
  redeemCoupleCoupon,
  seedDates,
} from "@/services/storeLogic";
import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
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
  points?: number;
  ownedItems?: string[];
}

interface OutfitItem {
  id: string;
  name: string;
  category: string;
  imagePath: any;
  isOwned: boolean;
  price?: number;
}

export default function StorePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<
    "style-studio" | "playground" | "date-quest"
  >("style-studio");
  const [activeCategory, setActiveCategory] = useState<string>("Hair");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState<string | null>(null);

  // Available outfit categories
  const outfitCategories = ["Hair", "Top", "Bottom", "Accessory", "Shoe"];

  // Outfit items with prices for store
  const outfitItems: OutfitItem[] = [
    // Hair items
    {
      id: "hair_space-bun_black",
      name: "Space Bun",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_space-bun_black.png"),
      isOwned: true,
      price: 50,
    },
    {
      id: "hair_buzz_black",
      name: "Buzz Cut",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_buzz_black.png"),
      isOwned: true,
      price: 50,
    },
    {
      id: "hair_buzz_blonde",
      name: "Buzz Blonde",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_buzz_blonde.png"),
      isOwned: false,
      price: 50,
    },
    {
      id: "hair_ponytail_brown",
      name: "Ponytail",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_ponytail_brown.png"),
      isOwned: false,
      price: 50,
    },
    {
      id: "hair_short-2_brown",
      name: "Short Hair",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_short-2_brown.png"),
      isOwned: false,
      price: 50,
    },
    {
      id: "hair_short-1_black",
      name: "Short Black",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_short-1_black.png"),
      isOwned: false,
      price: 50,
    },
    {
      id: "hair_short-1_gray",
      name: "Short Gray",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_short-1_gray.png"),
      isOwned: false,
      price: 50,
    },
    {
      id: "hair_medium_white",
      name: "Medium White",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_medium_white.png"),
      isOwned: false,
      price: 50,
    },
    {
      id: "hair_hijab_light-blue",
      name: "Hijab Blue",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_hijab_light-blue.png"),
      isOwned: false,
      price: 50,
    },
    {
      id: "hair_hijab_pink",
      name: "Hijab Pink",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_hijab_pink.png"),
      isOwned: false,
      price: 50,
    },
    {
      id: "hair_hijab_purple",
      name: "Hijab Purple",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_hijab_purple.png"),
      isOwned: false,
      price: 50,
    },
    {
      id: "hair_hijab_yellow",
      name: "Hijab Yellow",
      category: "Hair",
      imagePath: require("@/assets/images/avatar/outfit/hair/hair_hijab_yellow.png"),
      isOwned: false,
      price: 50,
    },

    // Top items
    {
      id: "top_basic_white",
      name: "Basic White",
      category: "Top",
      imagePath: require("@/assets/images/avatar/outfit/top/top_basic_white.png"),
      isOwned: true,
      price: 50,
    },
    {
      id: "top_cheong-same_red",
      name: "Cheongsam Red",
      category: "Top",
      imagePath: require("@/assets/images/avatar/outfit/top/top_cheong-same_red.png"),
      isOwned: false,
      price: 50,
    },
    {
      id: "top_hijab_purple",
      name: "Hijab Purple",
      category: "Top",
      imagePath: require("@/assets/images/avatar/outfit/top/top_hijab_purple.png"),
      isOwned: false,
      price: 50,
    },
    {
      id: "top_hijab_yellow",
      name: "Hijab Yellow",
      category: "Top",
      imagePath: require("@/assets/images/avatar/outfit/top/top_hijab_yellow.png"),
      isOwned: false,
      price: 50,
    },

    // Bottom items
    {
      id: "bottom_basic_white",
      name: "Basic White",
      category: "Bottom",
      imagePath: require("@/assets/images/avatar/outfit/bottom/bottom_basic_white.png"),
      isOwned: true,
      price: 50,
    },
    {
      id: "bottom_cheong-sam_red",
      name: "Cheongsam Red",
      category: "Bottom",
      imagePath: require("@/assets/images/avatar/outfit/bottom/bottom_cheong-sam_red.png"),
      isOwned: false,
      price: 50,
    },
    {
      id: "bottom_hijab_purple",
      name: "Hijab Purple",
      category: "Bottom",
      imagePath: require("@/assets/images/avatar/outfit/bottom/bottom_hijab_purple.png"),
      isOwned: false,
      price: 50,
    },
    {
      id: "bottom_hijab_yellow",
      name: "Hijab Yellow",
      category: "Bottom",
      imagePath: require("@/assets/images/avatar/outfit/bottom/bottom_hijab_yellow.png"),
      isOwned: false,
      price: 50,
    },
  ];

  const tabs = [
    { id: "style-studio", label: "Style Studio" },
    { id: "playground", label: "Playground" },
    { id: "date-quest", label: "Date Quest" },
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
          points: data.points || 0, // Get points from main user document
          ownedItems: data.ownedItems || [
            "hair_space-bun_black",
            "top_basic_white",
            "bottom_basic_white",
          ], // Default owned items
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleChallengeRedeem = async () => {
    if (isRedeeming) return;

    // Check if user is paired
    try {
      const pairingStatus = await checkPairingStatus();
      if (!pairingStatus.isPaired) {
        Alert.alert(
          "Pairing Required",
          "You need to pair with your partner to redeem challenges!",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Pair Now",
              onPress: () => router.push("/(pages)/pairing"),
            },
          ]
        );
        return;
      }
    } catch (error) {
      console.error("Error checking pairing status:", error);
      Alert.alert("Error", "Unable to verify pairing status");
      return;
    }

    // Check if user has enough points
    if (!userData || userData.points < 80) {
      Alert.alert(
        "Insufficient HibisCoins",
        "You need 80 HibisCoins to redeem a challenge."
      );
      return;
    }

    Alert.alert(
      "Redeem Challenge?",
      "Are you sure you want to redeem a random challenge for 80 HibisCoins?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Redeem",
          style: "default",
          onPress: async () => {
            setIsRedeeming(true);

            try {
              // Deduct points first
              const newPoints = userData!.points - 80;
              await updateDoc(doc(db, "users", auth.currentUser!.uid), {
                points: newPoints,
              });

              // Update local state
              setUserData({
                ...userData!,
                points: newPoints,
              });

              const result = await redeemChallenge();

              if (result.success) {
                Alert.alert(
                  "Challenge Redeemed!",
                  `${result.challenge?.text}`,
                  [{ text: "OK", style: "default" }]
                );
              } else {
                Alert.alert(
                  "Unable to Redeem",
                  result.message || "Please try again later."
                );
              }
            } catch (error) {
              console.error("Error redeeming challenge:", error);
              Alert.alert(
                "Error",
                "Something went wrong. Please try again later."
              );
            } finally {
              setIsRedeeming(false);
            }
          },
        },
      ]
    );
  };

  // TEMPORARY: Seed dates function
  const handleSeedDates = async () => {
    try {
      const result = await seedDates();
      if (result.success) {
        Alert.alert("Success", result.message);
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      console.error("Error seeding dates:", error);
      Alert.alert("Error", "Failed to seed dates");
    }
  };

  // TEMPORARY: Seed challenges function
  const handleSeedChallenges = async () => {
    try {
      const result = await seedChallenges();
      if (result.success) {
        Alert.alert("Success", result.message);
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      console.error("Error seeding challenges:", error);
      Alert.alert("Error", "Failed to seed challenges");
    }
  };

  // TEMPORARY: Seed couple coupons function
  const handleSeedCoupleCoupons = async () => {
    try {
      const result = await seedCoupleCoupons();
      if (result.success) {
        Alert.alert("Success", result.message);
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      console.error("Error seeding couple coupons:", error);
      Alert.alert("Error", "Failed to seed couple coupons");
    }
  };

  // TEMPORARY: Seed date ideas function
  const handleSeedDateIdeas = async () => {
    try {
      const result = await seedDateIdeas();
      if (result.success) {
        Alert.alert("Success", result.message);
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      console.error("Error seeding date ideas:", error);
      Alert.alert("Error", "Failed to seed date ideas");
    }
  };

  // TEMPORARY: Seed questions function
  const handleSeedQuestions = async () => {
    try {
      const result = await seedQuestions();
      if (result.success) {
        Alert.alert("Success", result.message);
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      console.error("Error seeding questions:", error);
      Alert.alert("Error", "Failed to seed questions");
    }
  };

  // Handle tailored date recommendation with confirmation
  const handleTailoredDate = async () => {
    // Check if user is paired
    try {
      const pairingStatus = await checkPairingStatus();
      if (!pairingStatus.isPaired) {
        Alert.alert(
          "Pairing Required",
          "You need to pair with your partner to redeem dates!",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Pair Now",
              onPress: () => router.push("/(pages)/pairing"),
            },
          ]
        );
        return;
      }
    } catch (error) {
      console.error("Error checking pairing status:", error);
      Alert.alert("Error", "Unable to verify pairing status");
      return;
    }

    // Check if user has enough points
    if (!userData || userData.points < 120) {
      Alert.alert(
        "Insufficient HibisCoins",
        "You need 120 HibisCoins to get a tailored date idea."
      );
      return;
    }

    Alert.alert(
      "Get Tailored Date?",
      "This will give you a date idea based on your love languages for 120 HibisCoins.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Get Date",
          style: "default",
          onPress: async () => {
            try {
              // Deduct points
              const newPoints = userData!.points - 120;
              await updateDoc(doc(db, "users", auth.currentUser!.uid), {
                points: newPoints,
              });

              // Update local state
              setUserData({
                ...userData!,
                points: newPoints,
              });

              const result = await getTailoredDate();
              if (result.success && result.date) {
                Alert.alert("Tailored Date Idea!", result.date.text, [
                  { text: "Got it!", style: "default" },
                ]);
              } else {
                Alert.alert(
                  "Unable to Get Date",
                  result.message || "Please try again later."
                );
              }
            } catch (error) {
              console.error("Error getting tailored date:", error);
              Alert.alert(
                "Error",
                "Something went wrong. Please try again later."
              );
            }
          },
        },
      ]
    );
  };

  // Handle surprise date recommendation with confirmation
  const handleSurpriseDate = async () => {
    // Check if user is paired
    try {
      const pairingStatus = await checkPairingStatus();
      if (!pairingStatus.isPaired) {
        Alert.alert(
          "Pairing Required",
          "You need to pair with your partner to redeem dates!",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Pair Now",
              onPress: () => router.push("/(pages)/pairing"),
            },
          ]
        );
        return;
      }
    } catch (error) {
      console.error("Error checking pairing status:", error);
      Alert.alert("Error", "Unable to verify pairing status");
      return;
    }

    // Check if user has enough points
    if (!userData || userData.points < 100) {
      Alert.alert(
        "Insufficient HibisCoins",
        "You need 100 HibisCoins to get a surprise date idea."
      );
      return;
    }

    Alert.alert(
      "Get Surprise Date?",
      "This will give you a random date idea from any category for 100 HibisCoins.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Surprise Me",
          style: "default",
          onPress: async () => {
            try {
              // Deduct points first
              const newPoints = userData!.points - 100;
              await updateDoc(doc(db, "users", auth.currentUser!.uid), {
                points: newPoints,
              });

              // Update local state
              setUserData({
                ...userData!,
                points: newPoints,
              });

              const result = await getSurpriseDate();
              if (result.success && result.date) {
                Alert.alert("Surprise Date Idea!", result.date.text, [
                  { text: "Sounds fun!", style: "default" },
                ]);
              } else {
                Alert.alert(
                  "Unable to Get Date",
                  result.message || "Please try again later."
                );
              }
            } catch (error) {
              console.error("Error getting surprise date:", error);
              Alert.alert(
                "Error",
                "Something went wrong. Please try again later."
              );
            }
          },
        },
      ]
    );
  };

  // Handle mini game purchase with game selection
  const handleMiniGameRedeem = async () => {
    if (isPurchasing) return;

    // Check if user is paired
    try {
      const pairingStatus = await checkPairingStatus();
      if (!pairingStatus.isPaired) {
        Alert.alert(
          "Pairing Required",
          "You need to pair with your partner to redeem mini games!",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Pair Now",
              onPress: () => router.push("/(pages)/pairing"),
            },
          ]
        );
        return;
      }
    } catch (error) {
      console.error("Error checking pairing status:", error);
      Alert.alert("Error", "Unable to verify pairing status");
      return;
    }

    // Check if a game is selected
    if (!selectedGameType) {
      Alert.alert(
        "No Game Selected",
        "Please select a game type before redeeming."
      );
      return;
    }

    // Check if user has enough points
    if (!userData || userData.points < 35) {
      Alert.alert(
        "Insufficient HibisCoins",
        "You need 35 HibisCoins to purchase a mini game."
      );
      return;
    }

    // Map game type to display label
    const gameLabels: { [key: string]: string } = {
      daily_question: "Daily Question",
      this_or_that: "This or That",
      would_you_rather: "Would You Rather",
      more_likely: "Who's More Likely To",
    };

    const gameLabel = gameLabels[selectedGameType];

    // Show confirmation alert
    Alert.alert(
      "Purchase Game?",
      `Purchase "${gameLabel}" for \n35 HibisCoins?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Purchase",
          style: "default",
          onPress: () => handleGamePurchase(selectedGameType, gameLabel),
        },
      ]
    );
  };

  // Handle game purchase
  const handleGamePurchase = async (gameType: string, gameLabel: string) => {
    if (!userData || userData.points < 35) {
      Alert.alert(
        "Insufficient HibisCoins",
        "You need 35 HibisCoins to purchase this game."
      );
      return;
    }

    // Directly execute purchase since confirmation is handled in handleMiniGameRedeem
    executePurchase(gameType, gameLabel);
  };

  // Execute the game purchase
  const executePurchase = async (gameType: string, gameLabel: string) => {
    if (isPurchasing) return;

    try {
      setIsPurchasing(true);

      // Check pairing status
      const pairingStatus = await checkPairingStatus();
      if (!pairingStatus.isPaired) {
        Alert.alert(
          "Error",
          "You must be paired with a partner to purchase games."
        );
        return;
      }

      // Check if game slots are full (3 pending games limit)
      const gameState = await getCoupleGameState();
      const totalPendingGames =
        (gameState.hasPendingDaily ? 1 : 0) + gameState.hasPendingChoice;

      if (totalPendingGames >= 3) {
        Alert.alert(
          "Game Slots Full",
          "You have reached the maximum of 3 pending games.\n\nComplete pending games before purchasing new ones.",
          [{ text: "OK" }]
        );
        return;
      }

      // Check if trying to purchase daily question when one is already pending
      if (gameType === "daily_question" && gameState.hasPendingDaily) {
        Alert.alert(
          "Daily Question Pending",
          "You already have a daily question waiting to be answered.\nPlease complete it before purchasing a new one.",
          [{ text: "OK" }]
        );
        return;
      }

      // Deduct points
      const newPoints = userData!.points - 35;
      await updateDoc(doc(db, "users", auth.currentUser!.uid), {
        points: newPoints,
      });

      // Update local state
      setUserData({
        ...userData!,
        points: newPoints,
      });

      // Send system message to chat
      const userDoc = await getDoc(doc(db, "users", auth.currentUser!.uid));
      const displayName = userDoc.exists()
        ? userDoc.data().displayName || "Someone"
        : "Someone";
      const systemMessage = `${displayName} purchased a "${gameLabel}" game!`;

      await sendMessage(
        pairingStatus.coupleId!,
        systemMessage,
        true, // isSystemMessage
        "game_purchased" // systemMessageType
      );

      // Start the purchased game
      let result;
      if (gameType === "daily_question") {
        result = await startDailyQuestion(true);

        // Navigate to daily question page
        router.push({
          pathname: "/(pages)/game-question",
          params: {
            sessionId: result.sessionId,
            questionId: result.question.id,
            questionText: result.question.text,
            isPurchased: "true",
          },
        });
      } else {
        result = await startChoiceGame(gameType, true);

        // Navigate to choice game page
        router.push({
          pathname: "/(pages)/game-choice",
          params: {
            sessionId: result.sessionId,
            questionId: result.question.id,
            gameType: gameType,
            questionText: result.question.question,
            choice1: result.question.choice1 || "",
            choice2: result.question.choice2 || "",
            isPurchased: "true",
          },
        });
      }

      Alert.alert("Success!", `"${gameLabel}" purchased! \nEnjoy the game!`);
    } catch (error) {
      console.error("Game purchase failed:", error);
      Alert.alert("Error", "Failed to purchase game. Please try again.");
    } finally {
      setIsPurchasing(false);
    }
  };

  // Handle couple coupon redemption with confirmation
  const handleCouponRedeem = async () => {
    // Check if user is paired
    try {
      const pairingStatus = await checkPairingStatus();
      if (!pairingStatus.isPaired) {
        Alert.alert(
          "Pairing Required",
          "You need to pair with your partner to redeem couple coupons!",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Pair Now",
              onPress: () => router.push("/(pages)/pairing"),
            },
          ]
        );
        return;
      }
    } catch (error) {
      console.error("Error checking pairing status:", error);
      Alert.alert("Error", "Unable to verify pairing status");
      return;
    }

    // Check if user has enough points
    if (!userData || userData.points < 200) {
      Alert.alert(
        "Insufficient HibisCoins",
        "You need 200 HibisCoins to redeem a couple coupon."
      );
      return;
    }

    Alert.alert(
      "Redeem Couple Coupon?",
      "Are you sure you want to redeem a couple coupon for heartfelt surprises for 200 HibisCoins?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Redeem",
          style: "default",
          onPress: async () => {
            try {
              // Deduct points first
              const newPoints = userData!.points - 200;
              await updateDoc(doc(db, "users", auth.currentUser!.uid), {
                points: newPoints,
              });

              // Update local state
              setUserData({
                ...userData!,
                points: newPoints,
              });

              const result = await redeemCoupleCoupon();
              if (result.success && result.coupon) {
                Alert.alert("Couple Coupon Redeemed!", result.coupon.text, [
                  { text: "Sweet!", style: "default" },
                ]);
              } else {
                Alert.alert(
                  "Unable to Redeem",
                  result.message || "Please try again later."
                );
              }
            } catch (error) {
              console.error("Error redeeming couple coupon:", error);
              Alert.alert(
                "Error",
                "Something went wrong. Please try again later."
              );
            }
          },
        },
      ]
    );
  };

  // Filter items by category and hide owned items
  const getItemsForCategory = (category: string) => {
    return outfitItems
      .filter((item) => item.category === category)
      .map((item) => ({
        ...item,
        isOwned: userData?.ownedItems?.includes(item.id),
      }))
      .filter((item) => !item.isOwned); // Only show items user doesn't own
  };

  // Format outfit name for display
  const formatOutfitName = (itemId: string): string => {
    const parts = itemId.split("_");
    if (parts.length !== 3) return itemId;

    const [category, style, color] = parts;

    // Reverse order and format
    const formattedParts = [color, style.replace(/-/g, " "), category];

    // Capitalize each word
    return formattedParts
      .map((part) =>
        part
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      )
      .join(" ");
  };

  // Handle outfit item purchase
  const handleItemPurchase = async (item: OutfitItem) => {
    if (!userData || userData.points < (item.price || 0)) {
      Alert.alert(
        "Insufficient HibisCoins",
        `You need ${item.price} HibisCoins to purchase this item.`
      );
      return;
    }

    const formattedName = formatOutfitName(item.id);

    Alert.alert(
      "Purchase Item?",
      `Do you want to purchase \n"${formattedName}" for ${item.price} HibisCoins?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Purchase",
          style: "default",
          onPress: async () => {
            try {
              if (!auth.currentUser) return;

              // Update user document with new points and owned items
              const newPoints = userData.points - (item.price || 0);
              const newOwnedItems = [...(userData.ownedItems || []), item.id];

              await updateDoc(doc(db, "users", auth.currentUser.uid), {
                points: newPoints,
                ownedItems: newOwnedItems,
              });

              // Update local state
              setUserData({
                ...userData,
                points: newPoints,
                ownedItems: newOwnedItems,
              });

              Alert.alert(
                "Success!",
                `You have purchased ${formattedName}, try it on!`
              );
            } catch (error) {
              console.error("Purchase failed:", error);
              Alert.alert("Error", "Purchase failed. Please try again.");
            }
          },
        },
      ]
    );
  };

  const renderStyleStudio = () => (
    <ScrollView
      style={styles.contentScrollView}
      showsVerticalScrollIndicator={false}
    >
      {/* Random Outfit Section */}
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          style={styles.randomOutfitButton}
          onPress={() =>
            Alert.alert(
              "Coming Soon!",
              "Low clothing stock.\nNew clothes in the making!!"
            )
          }
        >
          <Text style={styles.randomOutfitText}>Random Outfit</Text>
        </TouchableOpacity>
      </View>

      {/* Category Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScrollView}
        contentContainerStyle={styles.categoryContainer}
      >
        {outfitCategories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              activeCategory === category && styles.categoryButtonActive,
            ]}
            onPress={() => setActiveCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                activeCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Outfit Grid */}
      <View style={styles.outfitGrid}>
        {getItemsForCategory(activeCategory).map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.outfitItem}
            onPress={() => handleItemPurchase(item)}
          >
            <View style={styles.outfitImageContainer}>
              <Image
                source={item.imagePath}
                style={styles.outfitImage}
                resizeMode="contain"
              />
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>{item.price}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderPlayground = () => (
    <ScrollView
      style={styles.contentScrollView}
      showsVerticalScrollIndicator={false}
    >
      {/* Mini Game Section */}
      <View style={styles.miniGameSection}>
        <View style={styles.miniGameSectionButton}>
          <Text style={styles.gameSectionTitle}>Mini Game</Text>
        </View>
        <Text style={[styles.gameSectionDescription, { marginTop: 25 }]}>
          Unlock 1 extra game every day from your favorite fun categories:
        </Text>

        <View style={styles.gameTypeContainer}>
          {[
            {
              name: "Daily Questions",
              type: "daily_question",
              backgroundColor: "#FFE0B2",
              borderColor: "#FF9800",
            },
            {
              name: "Would You Rather...",
              type: "would_you_rather",
              backgroundColor: "#E8F5E8",
              borderColor: "#4CAF50",
            },
            {
              name: "Who's More Likely To?",
              type: "more_likely",
              backgroundColor: "#F3E5F5",
              borderColor: "#9C27B0",
            },
            {
              name: "This or That",
              type: "this_or_that",
              backgroundColor: "#E1F5FE",
              borderColor: "#2196F3",
            },
          ].map((gameType) => (
            <TouchableOpacity
              key={gameType.name}
              style={[
                styles.gameTypeButton,
                {
                  backgroundColor: gameType.backgroundColor,
                  borderColor: gameType.borderColor,
                },
                selectedGameType === gameType.type && styles.selectedGameType,
              ]}
              onPress={() =>
                setSelectedGameType(
                  selectedGameType === gameType.type ? null : gameType.type
                )
              }
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.gameTypeText,
                  selectedGameType === gameType.type &&
                    styles.selectedGameTypeText,
                ]}
              >
                {gameType.name}
              </Text>
              {selectedGameType === gameType.type && (
                <Text style={styles.selectedIndicator}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.redeemButton}
          onPress={handleMiniGameRedeem}
        >
          <Text style={styles.redeemButtonText}>Redeem</Text>
        </TouchableOpacity>
      </View>

      {/* Challenge Section */}
      <View style={styles.gameSection}>
        <View style={styles.challengeSectionButton}>
          <Text style={styles.gameSectionTitle}>Challenge</Text>
        </View>
        <Text style={[styles.gameSectionDescription, { marginTop: 25 }]}>
          Unlock Challenges anytime to keep the fun and excitement going!!
        </Text>
        <Text style={styles.gameSectionDescription}>
          No limits, just bold moments and endless laughs!
        </Text>

        <TouchableOpacity
          style={[
            styles.redeemButton,
            isRedeeming && styles.redeemButtonDisabled,
          ]}
          onPress={handleChallengeRedeem}
          disabled={isRedeeming}
        >
          <Text style={styles.redeemButtonText}>
            {isRedeeming ? "Redeeming..." : "Redeem"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderDateQuest = () => (
    <ScrollView
      style={styles.contentScrollView}
      showsVerticalScrollIndicator={false}
    >
      {/* Date Roulette Section */}
      <View style={styles.dateSection}>
        <View style={styles.dateSectionButton}>
          <Text style={styles.sectionButtonText}>Date Roulette</Text>
        </View>
        <Text style={[styles.dateSectionDescription, { marginTop: 25 }]}>
          Discover date ideas tailored just for you and your partner's love
          languages!
        </Text>
        <Text style={styles.dateSectionDescription}>
          Choose how you want your date ideas:
        </Text>

        <View style={styles.dateChoiceContainer}>
          <TouchableOpacity
            style={styles.dateChoiceButton}
            onPress={handleTailoredDate}
          >
            <Text style={styles.dateChoiceText}>Tailored Date</Text>
          </TouchableOpacity>
          <Text style={styles.orText}>or</Text>
          <TouchableOpacity
            style={styles.dateChoiceButton}
            onPress={handleSurpriseDate}
          >
            <Text style={styles.dateChoiceText}>Surprise Me</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Couple Coupons Section */}
      <View style={styles.dateSection}>
        <View style={styles.couponSectionButton}>
          <Text style={styles.sectionButtonText}>Couple Coupons</Text>
        </View>
        <Text style={[styles.dateSectionDescription, { marginTop: 25 }]}>
          Use coupons to unlock heartfelt surprises for you and your partner!
        </Text>

        <TouchableOpacity
          style={styles.redeemButton}
          onPress={handleCouponRedeem}
        >
          <Text style={styles.redeemButtonText}>Redeem</Text>
        </TouchableOpacity>
      </View>

      {/* Couple Pack Section */}
      <View style={styles.dateSection}>
        <View style={styles.couplePackSectionButton}>
          <Text style={styles.sectionButtonText}>Couple Pack</Text>
        </View>
        <Text style={[styles.comingSoonText, { marginTop: 25 }]}>
          Coming Soon!
        </Text>
        <Text style={styles.comingSoonDescription}>
          We're working hard to bring this feature to life. Stay tuned!
        </Text>
      </View>

      {/* Development Section - TEMPORARY - COMMENTED OUT FOR PRODUCTION */}
      {/*
      <View style={styles.dateSection}>
        <TouchableOpacity style={styles.devSectionButton}>
          <Text style={styles.sectionButtonText}>Development Tools</Text>
        </TouchableOpacity>
        <Text style={[styles.dateSectionDescription, { marginTop: 25 }]}>
          Database seeding functions for development and testing
        </Text>
        
        <View style={styles.devButtonContainer}>
          <TouchableOpacity
            style={[styles.redeemButton, { backgroundColor: "#2196F3", marginBottom: 8 }]}
            onPress={handleSeedQuestions}
          >
            <Text style={styles.redeemButtonText}>Seed Questions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.redeemButton, { backgroundColor: "#FF9800", marginBottom: 8 }]}
            onPress={handleSeedChallenges}
          >
            <Text style={styles.redeemButtonText}>Seed Challenges</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.redeemButton, { backgroundColor: "#F44336", marginBottom: 8 }]}
            onPress={handleSeedDateIdeas}
          >
            <Text style={styles.redeemButtonText}>Seed Date Ideas</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.redeemButton, { backgroundColor: "#4CAF50", marginBottom: 8 }]}
            onPress={handleSeedCoupleCoupons}
          >
            <Text style={styles.redeemButtonText}>Seed Couple Coupons</Text>
          </TouchableOpacity>
        </View>
      </View>
      */}
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "style-studio":
        return renderStyleStudio();
      case "playground":
        return renderPlayground();
      case "date-quest":
        return renderDateQuest();
      default:
        return renderStyleStudio();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with HibisCoin Counter */}
      <View style={styles.headerRow}>
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
      </View>

      {/* Tab Section */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id as typeof activeTab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fef9f2",
    paddingTop: 60,
  },

  // Header Styles
  headerRow: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: "flex-start",
  },
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
    marginLeft: -62,
    justifyContent: "center",
    alignItems: "center",
  },
  hibiscoinIcon: {
    width: 30,
    height: 30,
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

  // Content Styles
  contentScrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Style Studio Styles
  sectionContainer: {
    marginBottom: 20,
  },
  randomOutfitButton: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  randomOutfitText: {
    fontSize: 16,
    color: "#2E2E2E",
    fontWeight: "500",
  },

  // Category Styles
  categoryScrollView: {
    marginBottom: 20,
  },
  categoryContainer: {
    paddingHorizontal: 0,
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  categoryText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },

  // Outfit Grid Styles
  outfitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 30,
  },
  outfitItem: {
    width: (screenWidth - 60) / 3,
    aspectRatio: 1,
    marginBottom: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  outfitImagePlaceholder: {
    width: "80%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderX: {
    fontSize: 24,
    color: "#ccc",
    fontWeight: "300",
  },

  // Playground Styles
  gameSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginTop: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    position: "relative",
  },
  miniGameSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginTop: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    position: "relative",
  },
  miniGameSectionButton: {
    position: "absolute",
    top: -17,
    left: 70,
    width: "70%",
    borderWidth: 2,
    borderColor: "#0277BD",
    backgroundColor: "#E0F7FA",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    zIndex: 1,
  },
  challengeSectionButton: {
    position: "absolute",
    top: -17,
    left: 70,
    width: "70%",
    borderWidth: 2,
    borderColor: "#E65100",
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    zIndex: 1,
  },
  dateSectionButton: {
    position: "absolute",
    top: -17,
    left: 70,
    width: "70%",
    borderWidth: 2,
    borderColor: "#C2185B",
    backgroundColor: "#FCE4EC",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    zIndex: 1,
  },
  couponSectionButton: {
    position: "absolute",
    top: -17,
    left: 70,
    width: "70%",
    borderWidth: 2,
    borderColor: "#2E7D32",
    backgroundColor: "#E8F5E8",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    zIndex: 1,
  },
  couplePackSectionButton: {
    position: "absolute",
    top: -17,
    left: 70,
    width: "70%",
    borderWidth: 2,
    borderColor: "#9C27B0",
    backgroundColor: "#F3E5F5",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    zIndex: 1,
  },
  gameSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E2E2E",
    marginBottom: 5,
  },
  sectionButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E2E2E",
    marginBottom: 5,
  },
  gameSectionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    lineHeight: 20,
    textAlign: "center",
  },
  gameTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    marginBottom: 20,
    justifyContent: "center",
  },
  gameTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
    position: "relative",
  },
  selectedGameType: {
    borderWidth: 3,
    transform: [{ scale: 1.05 }],
  },
  gameTypeText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  selectedGameTypeText: {
    fontWeight: "700",
    color: "#2E2E2E",
  },
  selectedIndicator: {
    fontSize: 14,
    color: "#2E2E2E",
    fontWeight: "bold",
    marginLeft: 4,
  },
  redeemButton: {
    backgroundColor: "#ff9197",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  redeemButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  redeemButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },

  // Date Quest Styles
  dateSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginTop: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    position: "relative",
  },
  dateSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E2E2E",
    marginBottom: 5,
  },
  dateSectionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    lineHeight: 20,
    textAlign: "center",
  },
  dateChoiceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 15,
  },
  dateChoiceButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#ff9197",
    minWidth: 120,
    alignItems: "center",
  },
  dateChoiceText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  orText: {
    fontSize: 14,
    color: "#999",
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ff9197",
    textAlign: "center",
    marginBottom: 10,
  },
  comingSoonDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  devSectionButton: {
    position: "absolute",
    top: -17,
    left: 70,
    width: "70%",
    borderWidth: 2,
    borderColor: "#607D8B",
    backgroundColor: "#ECEFF1",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    zIndex: 1,
  },
  devButtonContainer: {
    marginTop: 15,
  },

  // New outfit display styles
  outfitImageContainer: {
    width: "100%",
    height: 100,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  ownedItem: {
    borderColor: "#4CAF50",
    backgroundColor: "#f8fff8",
  },
  outfitImage: {
    width: "80%",
    height: "80%",
  },
  ownedBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  ownedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  priceBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "#ff9197",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priceText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  itemName: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
    marginTop: 4,
  },
  categoryButtonActive: {
    backgroundColor: "#ff9197",
  },
  categoryTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
});
