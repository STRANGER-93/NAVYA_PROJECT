import React from "react";
import { View, StyleSheet } from "react-native";
import Colors from "../constants/colors";

type Props = {
  currentIndex: number;
};

export default function OnboardingIndicator({
  currentIndex,
}: Props) {
  return (
    <View style={styles.container}>
      {[0, 1, 2, 3].map((item) => (
        <View
          key={item}
          style={[
            styles.dot,
            currentIndex === item && styles.activeDot,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E6D8F7",
  },

  activeDot: {
    width: 28,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
});