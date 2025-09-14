import { auth } from "@/firebase/config";
import {
  ensureMessageCollectionExists,
  getTranslationQuotaStatus,
  getUserProfile,
  sendMessage,
  subscribeToMessages,
  subscribeToUserProfile,
  translateMessageIfNeeded,
  type Message,
  type UserProfile,
} from "@/services/chatServices";
import { checkPairingStatus } from "@/services/coupleLogic";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChatTestPage() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const processedTranslations = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);
  const unsubscribeMessagesRef = useRef<(() => void) | null>(null);
  const unsubscribeProfileRef = useRef<(() => void) | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const userProfileRef = useRef<UserProfile | null>(null);
  const [isPaired, setIsPaired] = useState(false);

  useEffect(() => {
    initializeChat();

    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // User signed out - clean up listeners
        if (unsubscribeMessagesRef.current) {
          unsubscribeMessagesRef.current();
          unsubscribeMessagesRef.current = null;
        }
        if (unsubscribeProfileRef.current) {
          unsubscribeProfileRef.current();
          unsubscribeProfileRef.current = null;
        }
        // Reset state
        setMessages([]);
        setCurrentUser(null);
        setCoupleId(null);
        setUserProfile(null);
        processedTranslations.current.clear();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current();
      }
      if (unsubscribeProfileRef.current) {
        unsubscribeProfileRef.current();
      }
    };
  }, []);

  // Keep ref synchronized with state
  useEffect(() => {
    userProfileRef.current = userProfile;
  }, [userProfile]);

  const initializeChat = async () => {
    try {
      if (!auth.currentUser) {
        Alert.alert("Error", "Please log in to access chat");
        router.back();
        return;
      }

      // TEMPORARY CLEANUP - UNCOMMENT TO RUN ONCE, THEN REMOVE
      // const cleanup = await clearAllChatHistory();

      // Check pairing status
      const pairingStatus = await checkPairingStatus();
      setIsPaired(pairingStatus.isPaired);

      if (!pairingStatus.isPaired || !pairingStatus.coupleId) {
        setLoading(false);
        return;
      }

      setCoupleId(pairingStatus.coupleId);

      // Get user profile
      const initialUserProfile = await getUserProfile(auth.currentUser.uid);
      if (!initialUserProfile) {
        Alert.alert("Error", "Failed to load user profile");
        router.back();
        return;
      }

      setCurrentUser(initialUserProfile);
      setUserProfile(initialUserProfile);

      // Ensure message collection exists
      await ensureMessageCollectionExists(pairingStatus.coupleId);

      // Start real-time profile listener for language changes
      unsubscribeProfileRef.current = subscribeToUserProfile(
        auth.currentUser.uid,
        (updatedProfile) => {
          if (updatedProfile) {
            setUserProfile(updatedProfile);
          }
        }
      );

      // Start listening to messages
      unsubscribeMessagesRef.current = subscribeToMessages(
        pairingStatus.coupleId,
        async (newMessages) => {
          setMessages(newMessages);

          // Get the latest user profile from ref
          const latestUserProfile = userProfileRef.current;

          // Only process translations after initial load
          if (!isInitialLoad.current && latestUserProfile?.defaultLanguage) {
            // Find new messages that haven't been processed yet
            const trulyNewMessages = newMessages.filter(
              (message) =>
                !message.isSystemMessage &&
                message.senderId !== auth.currentUser?.uid &&
                !processedTranslations.current.has(message.id)
            );

            for (const message of trulyNewMessages) {
              processedTranslations.current.add(message.id);

              try {
                await translateMessageIfNeeded(
                  message,
                  latestUserProfile.defaultLanguage
                );
              } catch (error) {
                console.error("Translation error:", error);
              }
            }
          } else if (isInitialLoad.current) {
            // Mark all existing messages as processed on first load
            for (const message of newMessages) {
              processedTranslations.current.add(message.id);
            }
            isInitialLoad.current = false;
          }

          // Scroll to bottom after a brief delay
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      );

      setLoading(false);
    } catch (error) {
      console.error("Error initializing chat:", error);
      Alert.alert("Error", "Failed to initialize chat");
      router.back();
    }
  };

  // Function to get system message colors
  const getSystemMessageColors = (systemMessageType?: string) => {
    switch (systemMessageType) {
      case "challenge_redeemed":
        return {
          background: "#FFF3E0",
          text: "#E65100",
        };
      case "mini_game_redeemed":
        return {
          background: "#E0F7FA",
          text: "#0277BD",
        };
      case "date_redeemed":
        return {
          background: "#FCE4EC",
          text: "#C2185B",
        };
      case "couple_coupon_redeemed":
        return {
          background: "#E8F5E8",
          text: "#2E7D32",
        };
      case "couple_pack_redeemed":
        return {
          background: "#F3E5F5",
          text: "#9C27B0",
        };
      case "game_purchased":
        return {
          background: "#E3F2FD",
          text: "#1976D2",
        };
      case "welcome":
        return {
          background: "#E8F5E8",
          text: "#2E7D32",
        };
      case "language_change":
      case "translation_quota_exceeded":
      default:
        return {
          background: "#f0f0f0",
          text: "#666",
        };
    }
  };

  const showPairingRequiredAlert = () => {
    Alert.alert(
      "Pairing Required",
      "You need to pair with your partner to access chat!",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pair Now",
          onPress: () => router.push("/(pages)/pairing"),
        },
      ]
    );
  };

  const handleSendMessage = async () => {
    if (!isPaired) {
      showPairingRequiredAlert();
      return;
    }

    if (!newMessage.trim() || !coupleId || sending) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      await sendMessage(coupleId, messageText);
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = (message: Message, index: number) => {
    // Handle system messages
    if (message.isSystemMessage) {
      const systemColors = getSystemMessageColors(message.systemMessageType);

      return (
        <View key={message.id} style={styles.systemMessageContainer}>
          <View
            style={[
              styles.systemMessageBubble,
              { backgroundColor: systemColors.background },
            ]}
          >
            <Text
              style={[styles.systemMessageText, { color: systemColors.text }]}
            >
              {message.text}
            </Text>
          </View>
        </View>
      );
    }

    // Handle regular messages
    const isMyMessage = message.senderId === auth.currentUser?.uid;

    // Show translation to both users
    const hasTranslation =
      message.translation && message.translation.trim() !== "";

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isMyMessage
            ? styles.myMessageContainer
            : styles.partnerMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.partnerMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.partnerMessageText,
            ]}
          >
            {message.text}
          </Text>

          {hasTranslation && (
            <Text
              style={[
                styles.translatedText,
                isMyMessage
                  ? styles.myTranslatedText
                  : styles.partnerTranslatedText,
              ]}
            >
              {message.translation}
            </Text>
          )}

          <Text
            style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.partnerMessageTime,
            ]}
          >
            {message.createdAt?.toDate?.()
              ? message.createdAt.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Sending..."}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </View>
    );
  }

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
            You need to pair with your partner to access chat!
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

  const quotaStatus = getTranslationQuotaStatus();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.partnerAvatar}>
            <Image
              source={require("@/assets/images/icons/heart.png")}
              style={styles.avatarImage}
            />
          </View>
          <Text style={styles.partnerName}>
            {currentUser?.displayName || "Chat"}
          </Text>
        </View>
        <Text style={styles.quotaStatus}>
          {quotaStatus.used}/{quotaStatus.limit}
        </Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Start your first conversation! 💬
            </Text>
            <Text style={styles.quotaText}>
              Translation quota protection active - translations limited to 50
              per day.
            </Text>
          </View>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
      </ScrollView>

      {/* Message Composer */}
      <View style={styles.composer}>
        <TextInput
          style={styles.messageInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          multiline
          maxLength={500}
          editable={!sending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sending}
        >
          <Ionicons
            name="send"
            size={20}
            color={!newMessage.trim() || sending ? "#ccc" : "#fff"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fef9f2",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fef9f2",
  },
  loadingText: {
    fontSize: 16,
    color: "#888",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  partnerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  avatarImage: {
    width: 18,
    height: 18,
    tintColor: "#888",
  },
  partnerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E2E2E",
  },
  quotaStatus: {
    fontSize: 12,
    color: "#666",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
  quotaText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  messageContainer: {
    marginBottom: 12,
  },
  myMessageContainer: {
    alignItems: "flex-end",
  },
  partnerMessageContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: "#ff9197",
    borderBottomRightRadius: 4,
  },
  partnerMessageBubble: {
    backgroundColor: "#A6C5F7",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: "#fff",
  },
  partnerMessageText: {
    color: "#2E2E2E",
  },
  translatedText: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#888888",
    marginTop: 4,
    lineHeight: 18,
  },
  myTranslatedText: {
    textAlign: "left",
    color: "#cececeff",
  },
  partnerTranslatedText: {
    textAlign: "left",
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "right",
    alignSelf: "flex-end",
  },
  partnerMessageTime: {
    color: "#888888",
    alignSelf: "flex-end",
  },
  systemMessageContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  systemMessageBubble: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    maxWidth: "80%",
  },
  systemMessageText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: "#f8f8f8",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ff9197",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#f0f0f0",
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
});
