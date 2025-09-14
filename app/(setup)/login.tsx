import { auth } from "@/firebase/config";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in:", userCred.user.uid);

      // Navigate to home page (fix)
      router.push("../(tabs)/avatar");
    } catch (err: any) {
      console.error("Login error:", err.message);
      alert(err.message);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Logo */}
      <Image
        source={require("@/assets/images/logo/logo_name.png")}
        style={styles.logoName}
        resizeMode="cover"
      />

      {/* Title */}
      <Text style={styles.title}>Welcome Back!!</Text>

      {/* Input Fields */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={styles.input}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      {/* Login Button */}
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginText}>Login</Text>
      </TouchableOpacity>

      {/* Sign Up Link */}
      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Don’t have an account? </Text>
        <TouchableOpacity onPress={() => router.push("/signup")}>
          <Text style={styles.signupLink}>Sign up</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2E2E2E",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  label: {
    alignSelf: "flex-start",
    marginBottom: 4,
    marginTop: 4,
    fontSize: 16,
    color: "#2E2E2E",
  },
  loginButton: {
    borderWidth: 1,
    paddingVertical: 14,
    width: "100%",
    borderRadius: 10,
    marginBottom: 25,
    marginTop: 10,
    borderColor: "#ff9197",
    backgroundColor: "#fcd7d7",
  },
  loginText: {
    fontSize: 16,
    fontWeight: "600",
    alignSelf: "center",
    color: "#2E2E2E",
  },
  signupContainer: {
    flexDirection: "row",
    alignSelf: "flex-start",
    marginBottom: 100,
  },
  signupText: {
    fontSize: 14,
    color: "#2E2E2E",
  },
  signupLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ff9197",
  },
});
