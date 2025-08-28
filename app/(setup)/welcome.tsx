import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* App Logo */}
      <Image
        source={require("@/assets/images/logo.png")}
        style={styles.logo}
        resizeMode="cover"
      />

      {/* Welcome Text */}
      <Text style={styles.title}>Welcome to MYLove!</Text>
      <Text style={styles.subtitle}>
        Your space to grow, play and stay connected no matter the distance!
      </Text>
      <Text style={styles.subtitle}>
        Enjoy chats, fun challenges with a touch of Malaysian culture and build
        your unique avatar with your partner.
      </Text>

      {/* Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("../signup")}
      >
        <Text style={styles.buttonText}>Let the journey begin!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    paddingTop: 90,
    backgroundColor: "#fef9f2",
  },
  logo: {
    width: 190,
    height: 190,
    marginBottom: 35,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2E2E2E",
    marginBottom: 70,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#888888",
    textAlign: "center",
    marginBottom: 25,
  },
  button: {
    marginTop: 90,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    width: "100%",
    borderColor: "#ff9197",
    backgroundColor: "#fcd7d7",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E2E2E",
    alignSelf: "center",
  },
});
