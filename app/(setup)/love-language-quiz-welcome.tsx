import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function QuizIntro() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Logo */}
      <Image
        source={require("@/assets/images/logo-name.png")}
        style={styles.logoName}
        resizeMode="cover"
      />

      {/* Title */}
      <Text style={styles.title}>Discover Your Love Language!</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Answer 15 quick questions to discover which love language fits you best
      </Text>

      {/* Love Language Bubbles */}
      <View style={styles.bubbleContainer}>
        <View style={styles.bubbleRow}>
          <View style={styles.bubbleQuality}>
            <Text style={styles.bubbleText}>Quality Time</Text>
          </View>
          <View style={styles.bubbleAct}>
            <Text style={styles.bubbleText}>Acts of Service</Text>
          </View>
        </View>

        <View style={styles.bubbleRow}>
          <View style={styles.bubbleTouch}>
            <Text style={styles.bubbleText}>Physical Touch</Text>
          </View>
        </View>

        <View style={styles.bubbleRow}>
          <View style={styles.bubbleWords}>
            <Text style={styles.bubbleText}>Words of Affirmation</Text>
          </View>
          <View style={styles.bubbleGifts}>
            <Text style={styles.bubbleText}>Receiving Gifts</Text>
          </View>
        </View>
      </View>

      {/* Start Quiz Button */}
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => router.push("/love-language-quiz")}
      >
        <Text style={styles.startText}>Start Quiz</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fef9f2",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    flexGrow: 1,
  },
  logoName: {
    width: 140,
    height: 50,
    marginBottom: 30,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2E2E2E",
    marginBottom: 55,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#2E2E2E",
    textAlign: "center",
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  bubbleContainer: {
    marginBottom: 60,
  },
  bubbleRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  bubbleQuality: {
    borderWidth: 1,
    borderColor: "#2E2E2E",
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    backgroundColor: "#F5E4C3",
  },
  bubbleAct: {
    borderWidth: 1,
    borderColor: "#2E2E2E",
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    backgroundColor: "#A6C5F7",
  },
  bubbleWords: {
    borderWidth: 1,
    borderColor: "#2E2E2E",
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    backgroundColor: "#B8E0D2",
  },
  bubbleGifts: {
    borderWidth: 1,
    borderColor: "#2E2E2E",
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    backgroundColor: "#F9C6D1",
  },
  bubbleTouch: {
    borderWidth: 1,
    borderColor: "#2E2E2E",
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: "#D5C3F7",
  },
  bubbleText: {
    fontSize: 14,
    color: "#2E2E2E",
    textAlign: "center",
  },
  startButton: {
    borderWidth: 1,
    borderColor: "#ff9197",
    backgroundColor: "#fcd7d7",
    borderRadius: 10,
    paddingVertical: 14,
    width: "100%",
    marginBottom: 50,
  },
  startText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    color: "#2E2E2E",
  },
});
