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
    backgroundColor: "#fff",
  },
  logo: {
    width: 170,
    height: 170,
    marginBottom: 35,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 45,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 10,
  },
  button: {
    marginTop: 70,
    paddingVertical: 14,
    paddingHorizontal: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#000",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
});
