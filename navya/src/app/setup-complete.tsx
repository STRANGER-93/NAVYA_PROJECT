import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "../components/buttons/PrimaryButton";
import Colors from "../constants/colors";

export default function SetupCompleteScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={62} color={Colors.white} />
        </View>
        <Text style={styles.title}>You{"'"}re all set!</Text>
        <Text style={styles.message}>Your personalized cycle journey starts here.{"\n"}NAVYA{"'"}s ready to learn from you.{"\n\n"}You can always change dynamic setup info from the Edit Profile section.</Text>
        <PrimaryButton title="Go to Dashboard" onPress={() => router.replace("/dashboard")} style={styles.button} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingBottom: 42 },
  checkCircle: { width: 141, height: 141, alignItems: "center", justifyContent: "center", borderRadius: 71, backgroundColor: "#CD7DF5" },
  title: { marginTop: 39, color: Colors.darkPurple, fontSize: 38, fontWeight: "700", letterSpacing: -0.7 },
  message: { marginTop: 17, color: "#917399", fontSize: 19, lineHeight: 31, textAlign: "center" },
  button: { width: 255, marginTop: 50 },
});
