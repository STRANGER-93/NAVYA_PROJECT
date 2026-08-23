import React, { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import Colors from "../../constants/colors";

type TabName = "Home" | "Cycle" | "Mood" | "Journal" | "Profile";
type IconName = ComponentProps<typeof Ionicons>["name"];

const tabs: { name: TabName; icon: IconName }[] = [
  { name: "Home", icon: "home-outline" },
  { name: "Cycle", icon: "sync-outline" },
  { name: "Mood", icon: "happy-outline" },
  { name: "Journal", icon: "book-outline" },
  { name: "Profile", icon: "person-outline" },
];

export default function BottomNavigation({ activeTab }: { activeTab: TabName }) {
  const router = useRouter();

  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const active = tab.name === activeTab;
        const isAvailable = true;

        return (
          <Pressable
            key={tab.name}
            accessibilityRole="tab"
            accessibilityState={{ selected: active, disabled: !isAvailable }}
            disabled={!isAvailable}
            onPress={() => router.replace(tab.name === "Profile" ? "/profile" : tab.name === "Mood" ? "/mood" : tab.name === "Journal" ? "/journal" : tab.name === "Cycle" ? "/cycle" : "/dashboard")}
            style={[styles.tab, active ? styles.activeTab : null]}
          >
            <Ionicons name={tab.icon} size={27} color={active ? "#C878F3" : "#C4A3DD"} />
            <Text style={[styles.label, active ? styles.activeLabel : null]}>{tab.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", minHeight: 78, paddingHorizontal: 7, paddingVertical: 9, borderTopWidth: 1, borderTopColor: "#E9D9F6", backgroundColor: Colors.white },
  tab: { width: 68, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 6, borderRadius: 18 },
  activeTab: { backgroundColor: "#EFDEFF" },
  label: { color: "#C4A3DD", fontSize: 12, fontWeight: "500" },
  activeLabel: { color: "#BD70EC", fontWeight: "700" },
});
