import { acceptCoupleInvite } from "@/services/enterCoupleCode";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PairingAnniversaryPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { code, inviterName } = params as { code: string; inviterName: string };

  const [day, setDay] = useState("Day");
  const [month, setMonth] = useState("Month");
  const [year, setYear] = useState("Year");
  const [completing, setCompleting] = useState(false);

  const handleCompletePairing = async () => {
    if (day === "Day" || month === "Month" || year === "Year") {
      Alert.alert("Incomplete Date", "Please select your anniversary date");
      return;
    }

    try {
      setCompleting(true);

      // Convert month string to index for Date
      const monthIndex = [
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
      ].indexOf(month);

      // Create Date object
      const anniversary = new Date(parseInt(year), monthIndex, parseInt(day));

      // Format as dd/mm/yyyy
      const formattedAnniversary = `${("0" + anniversary.getDate()).slice(
        -2
      )}/${("0" + (anniversary.getMonth() + 1)).slice(
        -2
      )}/${anniversary.getFullYear()}`;

      await acceptCoupleInvite(code, formattedAnniversary);

      Alert.alert(
        "Successfully Paired!",
        `You are now connected with ${inviterName}. You can start playing games together!`,
        [
          {
            text: "Continue",
            onPress: () => {
              router.replace("/(tabs)/setting");
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Error completing pairing:", error);
      Alert.alert("Pairing Failed", error.message);
    } finally {
      setCompleting(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Set Your Anniversary</Text>

        {/* Info section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            You're about to pair with {inviterName}!
          </Text>
          <Text style={styles.subText}>
            Please set when your love story began
          </Text>
        </View>

        {/* Date Pickers */}
        <View style={styles.dateSection}>
          <Text style={styles.dateLabel}>Anniversary Date</Text>

          <View style={styles.dateContainer}>
            {/* Date */}
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

            {/* Month */}
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

            {/* Year */}
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
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            (day === "Day" ||
              month === "Month" ||
              year === "Year" ||
              completing) &&
              styles.disabledButton,
          ]}
          onPress={handleCompletePairing}
          disabled={
            day === "Day" || month === "Month" || year === "Year" || completing
          }
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.buttonText,
              styles.primaryText,
              (day === "Day" ||
                month === "Month" ||
                year === "Year" ||
                completing) &&
                styles.disabledText,
            ]}
          >
            {completing ? "Pairing..." : "Complete Pairing"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleGoBack}
          disabled={completing}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, styles.secondaryText]}>Go Back</Text>
        </TouchableOpacity>

        <View style={styles.warningSection}>
          <Text style={styles.warningTitle}>Important:</Text>
          <Text style={styles.warningText}>
            This anniversary date will be shared between you and {inviterName}.
            It will be used to calculate how many days you've been together.
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
    marginBottom: 20,
    textAlign: "center",
  },
  infoSection: {
    backgroundColor: "#f0f8ff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#87ceeb",
  },
  infoText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#2E2E2E",
    textAlign: "center",
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  dateSection: {
    marginBottom: 30,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2E2E2E",
    marginBottom: 15,
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  warningSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#fff8dc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f0e68c",
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 5,
  },
  warningText: {
    fontSize: 12,
    color: "#856404",
    lineHeight: 18,
  },
});
