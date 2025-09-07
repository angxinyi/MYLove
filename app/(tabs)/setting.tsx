import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function ChatScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
        <Text>Settings Screen</Text>
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
