import React from "react";
import { View, StyleSheet } from "react-native";
import Colors from "../constants/colors";

export default function PageIndicator() {
  return (
    <View style={styles.container}>
      <View style={styles.dot} />
      <View style={styles.activeDot} />
      <View style={styles.dot} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E7C8FF",
  },

  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
});