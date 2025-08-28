import { Picker } from "@react-native-picker/picker";
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

export default function SignupPage() {
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
        source={require("@/assets/images/logo-name.png")}
        style={styles.logo}
        resizeMode="cover"
      />

      {/* Title */}
      <Text style={styles.title}>Let’s Get Started</Text>

      {/* Input Fields */}
      <Text style={styles.label}>Name</Text>
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

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

      {/* Date Picker */}
      <Text style={styles.label}>When did your love story begin?</Text>
      <View style={styles.dateContainer}>
        <View style={styles.pickerDay}>
          <Picker
            selectedValue={day}
            style={styles.pickerInner}
            onValueChange={(itemValue) => setDay(itemValue)}
          >
            <Picker.Item label="Day" value="Day" />
            {[...Array(31)].map((_, i) => (
              <Picker.Item key={i} label={`${i + 1}`} value={`${i + 1}`} />
            ))}
          </Picker>
        </View>
        <View style={styles.pickerMonth}>
          <Picker
            selectedValue={month}
            style={styles.pickerInner}
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
        </View>
        <View style={styles.pickerYear}>
          <Picker
            selectedValue={year}
            style={styles.pickerInner}
            onValueChange={(itemValue) => setYear(itemValue)}
          >
            <Picker.Item label="Year" value="Year" />
            {[...Array(50)].map((_, i) => {
              const y = new Date().getFullYear() - i;
              return <Picker.Item key={i} label={`${y}`} value={`${y}`} />;
            })}
          </Picker>
        </View>
      </View>

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
    backgroundColor: "#fef9f2",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    flexGrow: 1,
  },
  logo: {
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
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    width: "100%",
  },
  pickerDay: {
    height: 55,
    width: 93,
    borderColor: "#ccc",
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  pickerMonth: {
    height: 55,
    width: 120,
    marginHorizontal: 3,
    borderColor: "#ccc",
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  pickerYear: {
    height: 55,
    width: 110,
    borderColor: "#ccc",
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  pickerInner: {
    width: "100%",
    height: 55,
  },
  signUpButton: {
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignSelf: "flex-end",
    borderColor: "#ff9197",
    backgroundColor: "#fcd7d7",
  },
  signUpText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E2E2E",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
    width: "100%",
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#aaa",
  },
  or: {
    marginHorizontal: 10,
    fontSize: 20,
    color: "#333",
  },
  loginButton: {
    borderWidth: 1,
    paddingVertical: 14,
    width: "100%",
    borderRadius: 10,
    marginBottom: 50,
    borderColor: "#ff9197",
    backgroundColor: "#fcd7d7",
  },
  loginText: {
    fontSize: 16,
    fontWeight: "600",
    alignSelf: "center",
    color: "#2E2E2E",
  },
});
