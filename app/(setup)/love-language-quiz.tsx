import { auth, db } from "@/firebase/config";
import { useRouter } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const questions = [
  {
    q: "I feel most loved when ...",
    a: {
      text: "Someone spends uninterrupted time with me",
      type: "Quality Time",
    },
    b: { text: "Someone gives me a thoughtful gift", type: "Receiving Gifts" },
  },
  {
    q: "I feel appreciated when ...",
    a: {
      text: "Someone helps me with tasks or chores",
      type: "Acts of Service",
    },
    b: {
      text: "Someone says kind and encouraging words",
      type: "Words of Affirmation",
    },
  },
  {
    q: "I feel connected when ...",
    a: {
      text: "I get hugs and kisses",
      type: "Physical Touch",
    },
    b: {
      text: "Someone surprises me with a meaningful present",
      type: "Receiving Gifts",
    },
  },
  {
    q: "I feel loved when ...",
    a: {
      text: "Someone takes time to listen and talk with me",
      type: "Quality Time",
    },
    b: {
      text: "Someone compliments me or says 'I love you'",
      type: "Words of Affirmation",
    },
  },
  {
    q: "I like it when ...",
    a: {
      text: "Someone offers to help me without being asked",
      type: "Acts of Service",
    },
    b: { text: "Someone holds my hand or cuddles", type: "Physical Touch" },
  },
  {
    q: "I feel valued when ...",
    a: {
      text: "Someone tells me 'You’re amazing' or 'I appreciate you'",
      type: "Words of Affirmation",
    },
    b: {
      text: "Someone spends a whole day doing things just with me",
      type: "Quality Time",
    },
  },
  {
    q: "I feel cared for when ...",
    a: {
      text: "Someone cooks for me",
      type: "Acts of Service",
    },
    b: {
      text: "Someone gives me a thoughtful gift just because",
      type: "Receiving Gifts",
    },
  },
  {
    q: "I feel special when ...",
    a: {
      text: "Someone gives me a hug after a long day",
      type: "Physical Touch",
    },
    b: {
      text: "Someone writes me a heartfelt note or message",
      type: "Words of Affirmation",
    },
  },
  {
    q: "I feel secure when ...",
    a: {
      text: "Someone helps me out when I’m overwhelmed",
      type: "Acts of Service",
    },
    b: {
      text: "Someone spends time with me even if we’re just doing nothing",
      type: "Quality Time",
    },
  },
  {
    q: "I feel happy when ...",
    a: {
      text: "Someone surprises me with a small gift",
      type: "Receiving Gifts",
    },
    b: {
      text: "Someone takes the time to listen carefully to me",
      type: "Quality Time",
    },
  },
  {
    q: "I feel loved when ...",
    a: {
      text: "Someone says 'I love you' or praises me",
      type: "Words of Affirmation",
    },
    b: {
      text: "Someone gives me a comforting hug",
      type: "Physical Touch",
    },
  },
  {
    q: "I feel grateful ...",
    a: {
      text: "Someone does something helpful for me without being asked",
      type: "Acts of Service",
    },
    b: {
      text: "Someone spends time just talking and sharing with me",
      type: "Quality Time",
    },
  },
  {
    q: "I feel joyful when ...",
    a: {
      text: "I receive a gift that shows someone knows me well",
      type: "Receiving Gifts",
    },
    b: { text: "Someone physically holds me close", type: "Physical Touch" },
  },
  {
    q: "I feel comforted when ...",
    a: {
      text: "Someone tells me encouraging and loving words",
      type: "Words of Affirmation",
    },
    b: {
      text: "Someone helps me take care of errands or chores",
      type: "Acts of Service",
    },
  },
  {
    q: "I feel connected when my partner gives ...",
    a: { text: "gives me their full attention", type: "Quality Time" },
    b: { text: "hugs or kisses me unexpectedly", type: "Physical Touch" },
  },
];

export default function LoveLanguageQuiz() {
  const router = useRouter();
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState({
    "Quality Time": 0,
    "Acts of Service": 0,
    "Receiving Gifts": 0,
    "Words of Affirmation": 0,
    "Physical Touch": 0,
  });

  const handleAnswer = async (lang: string) => {
    // Update scores
    const newScores = { ...scores, [lang]: (scores[lang] || 0) + 1 };

    if (currentQ < questions.length - 1) {
      setScores(newScores);
      setCurrentQ(currentQ + 1);
    } else {
      // Quiz finished
      const topLang = Object.entries(newScores).sort(
        (a, b) => b[1] - a[1]
      )[0][0];

      const user = auth.currentUser;
      if (user) {
        try {
          await setDoc(
            doc(db, "users", user.uid),
            { loveLanguage: topLang },
            { merge: true }
          );
          console.log("Saved love language:", topLang);
        } catch (err) {
          console.error("Error saving love language:", err);
        }
      }

      // Go to result page
      router.push({
        pathname: "/love-language-result",
        params: { loveLanguage: topLang },
      });
    }
  };

  const q = questions[currentQ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Logo */}
      <Image
        source={require("@/assets/images/logo/logo_name.png")}
        style={styles.logoName}
        resizeMode="cover"
      />

      {/* Progress */}
      <Text style={styles.progress}>
        Question {currentQ + 1} of {questions.length}
      </Text>

      {/* Question Box */}
      <View style={styles.questionBox}>
        <Text style={styles.question}>{q.q}</Text>
      </View>

      {/* Choices */}
      <View style={styles.choiceBox}>
        <TouchableOpacity
          style={styles.choice1}
          onPress={() => handleAnswer(q.a.type)}
        >
          <Text style={styles.choiceText}>{q.a.text}</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.choice2}
          onPress={() => handleAnswer(q.b.type)}
        >
          <Text style={styles.choiceText}>{q.b.text}</Text>
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
  progress: {
    fontSize: 30,
    fontWeight: "500",
    marginBottom: 50,
    color: "#2E2E2E",
  },
  questionBox: {
    borderWidth: 1,
    borderColor: "#2E2E2E",
    borderRadius: 15,
    padding: 20,
    marginBottom: 70,
    width: "100%",
    paddingVertical: 80,
    backgroundColor: "#FCFCFC",
  },
  question: {
    fontSize: 25,
    color: "#2E2E2E",
    textAlign: "center",
  },
  choiceBox: {
    borderWidth: 1,
    borderColor: "#2E2E2E",
    borderRadius: 15,
    width: "80%",
    backgroundColor: "#fff",
    marginBottom: 70,
  },
  choice1: {
    paddingVertical: 40,
    backgroundColor: "#F9C6D1",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  choice2: {
    paddingVertical: 40,
    backgroundColor: "#A6C5F7",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  choiceText: {
    fontSize: 18,
    color: "#2E2E2E",
    textAlign: "center",
    width: "80%",
    alignSelf: "center",
  },
  divider: {
    height: 2,
    backgroundColor: "#929090ff",
  },
});
