import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function StorePage() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
        <Text>Store Screen</Text>
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
});
