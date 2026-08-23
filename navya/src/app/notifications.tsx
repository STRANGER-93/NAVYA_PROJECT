import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import BackButton from "../components/auth/BackButton";
import BottomNavigation from "../components/navigation/BottomNavigation";
import Colors from "../constants/colors";

const notifications = [
  { emoji: "🩸", message: "Your predicted period may start in 3 days.", time: "2h ago" },
  { emoji: "💭", message: "Take a moment to record how you're feeling today.", time: "9:00 AM" },
  { emoji: "📊", message: "Your weekly mood insight is ready to view.", time: "Yesterday" },
];

export default function NotificationsScreen() {
  const router = useRouter();
  return <SafeAreaView style={styles.screen} edges={["top"]}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic"><BackButton onPress={() => router.back()} /><Text style={styles.title}>Notifications</Text><View style={styles.list}>{notifications.map((notification) => <View key={notification.message} style={styles.notificationCard}><Text style={styles.emoji}>{notification.emoji}</Text><View style={styles.messageContainer}><Text style={styles.message}>{notification.message}</Text><Text style={styles.time}>{notification.time}</Text></View></View>)}</View></ScrollView><BottomNavigation activeTab="Home" /></SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background }, content: { flexGrow: 1, paddingHorizontal: 17, paddingTop: 42, paddingBottom: 26 }, title: { marginTop: 37, color: Colors.darkPurple, fontSize: 28, fontWeight: "700" }, list: { gap: 16, marginTop: 27 }, notificationCard: { flexDirection: "row", minHeight: 95, paddingHorizontal: 21, paddingVertical: 21, borderWidth: 1, borderColor: "#E8D9F5", borderRadius: 21, backgroundColor: Colors.white }, emoji: { fontSize: 28, marginRight: 17 }, messageContainer: { flex: 1, justifyContent: "center" }, message: { color: Colors.darkPurple, fontSize: 17, lineHeight: 26 }, time: { marginTop: 7, color: "#C2A1DC", fontSize: 15 },
});
