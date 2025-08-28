import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";

export default function SignUpScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [day, setDay] = useState("Day");
  const [month, setMonth] = useState("Month");
  const [year, setYear] = useState("Year");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Logo */}
      <Image
        source={require("@/assets/images/logo.png")} // Replace with your actual logo path
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Title */}
      <Text style={styles.title}>Let’s Get Started</Text>

      {/* Input Fields */}
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      {/* Date Picker */}
      <Text style={styles.dateLabel}>When did your love story begin?</Text>
      {/* <View style={styles.dateContainer}>
        <Picker
          selectedValue={day}
          style={styles.picker}
          onValueChange={(itemValue) => setDay(itemValue)}
        >
          <Picker.Item label="Day" value="Day" />
          {[...Array(31)].map((_, i) => (
            <Picker.Item key={i} label={`${i + 1}`} value={`${i + 1}`} />
          ))}
        </Picker>

        <Picker
          selectedValue={month}
          style={styles.picker}
          onValueChange={(itemValue) => setMonth(itemValue)}
        >
          <Picker.Item label="Month" value="Month" />
          {[
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ].map((m, i) => (
            <Picker.Item key={i} label={m} value={m} />
          ))}
        </Picker>

        <Picker
          selectedValue={year}
          style={styles.picker}
          onValueChange={(itemValue) => setYear(itemValue)}
        >
          <Picker.Item label="Year" value="Year" />
          {[...Array(50)].map((_, i) => {
            const y = new Date().getFullYear() - i;
            return <Picker.Item key={i} label={`${y}`} value={`${y}`} />;
          })}
        </Picker>
      </View> */}

      {/* Sign Up Button */}
      <TouchableOpacity style={styles.signUpButton}>
        <Text style={styles.signUpText}>Sign Up</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.line} />
        <Text style={styles.or}>or</Text>
        <View style={styles.line} />
      </View>

      {/* Login Button */}
      <TouchableOpacity
        style={styles.loginButton}
        // onPress={() => router.push("/login")} // Update route as needed
      >
        <Text style={styles.loginText}>Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    flexGrow: 1,
  },
  logo: {
    width: 130,
    height: 50,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  dateLabel: {
    alignSelf: "flex-start",
    marginBottom: 8,
    fontSize: 16,
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
    width: "100%",
  },
  picker: {
    flex: 1,
    height: 50,
    marginHorizontal: 5,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  signUpButton: {
    backgroundColor: "#fff",
    borderColor: "#000",
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 10,
  },
  signUpText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 30,
    width: "100%",
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#aaa",
  },
  or: {
    marginHorizontal: 10,
    fontSize: 16,
    color: "#333",
  },
  loginButton: {
    borderColor: "#000",
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 90,
    borderRadius: 10,
  },
  loginText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
