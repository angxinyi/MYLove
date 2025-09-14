import { validateCoupleCode } from "@/services/enterCoupleCode";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function PairingEnterCodePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);

  const handleCodeChange = (text: string) => {
    // Convert to uppercase and limit to 6 characters
    const cleanCode = text
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
    setCode(cleanCode);
  };

  const handleValidateCode = async () => {
    if (code.length !== 6) {
      Alert.alert("Invalid Code", "Please enter a 6-character code");
      return;
    }

    try {
      setValidating(true);
      const result = await validateCoupleCode(code);

      // Code is valid, navigate to anniversary setting
      router.push({
        pathname: "/(pages)/pairing-anniversary",
        params: {
          code,
          inviterName: result.inviterName,
          inviterUid: result.inviterUid,
        },
      });
    } catch (error: any) {
      console.error("Error validating code:", error);
      Alert.alert("Invalid Code", error.message);
    } finally {
      setValidating(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Enter Pairing Code</Text>

        <Text style={styles.description}>
          Enter the 6-character code your partner shared with you
        </Text>

        {/* Input section */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Pairing Code</Text>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={handleCodeChange}
            placeholder="ABC123"
            placeholderTextColor="#999"
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
            textAlign="center"
            letterSpacing={4}
          />
          <Text style={styles.inputHint}>{code.length}/6 characters</Text>
        </View>

        {/* Confirmation button */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            (code.length !== 6 || validating) && styles.disabledButton,
          ]}
          onPress={handleValidateCode}
          disabled={code.length !== 6 || validating}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.buttonText,
              styles.primaryText,
              (code.length !== 6 || validating) && styles.disabledText,
            ]}
          >
            {validating ? "Validating..." : "Continue"}
          </Text>
        </TouchableOpacity>

        {/* Back button */}
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, styles.secondaryText]}>Go Back</Text>
        </TouchableOpacity>

        {/* Tip section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Having trouble?</Text>
          <Text style={styles.infoText}>
            • Make sure you're entering the correct 6-character code
          </Text>
          <Text style={styles.infoText}>
            • Codes expire after 1 hour - ask for a new one if needed
          </Text>
          <Text style={styles.infoText}>
            • You cannot use your own invitation code
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fef9f2",
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E2E2E",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  inputSection: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2E2E2E",
    marginBottom: 8,
  },
  codeInput: {
    borderWidth: 2,
    borderColor: "#ff9197",
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E2E2E",
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: "#fcd7d7",
    borderColor: "#ff9197",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderColor: "#ddd",
  },
  disabledButton: {
    backgroundColor: "#f5f5f5",
    borderColor: "#ccc",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  primaryText: {
    color: "#2E2E2E",
  },
  secondaryText: {
    color: "#666",
  },
  disabledText: {
    color: "#999",
  },
  infoSection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E2E2E",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
    lineHeight: 20,
  },
});
