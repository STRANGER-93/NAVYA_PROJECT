import React from "react";
import { StyleSheet, Text, View } from "react-native";

import Colors from "../../../constants/colors";

type SetupProgressProps = {
  currentStep: number;
  totalSteps: number;
};

export default function SetupProgress({ currentStep, totalSteps }: SetupProgressProps) {
  const completion = Math.round((currentStep / totalSteps) * 100);

  return (
    <View>
      <View style={styles.labels}>
        <Text style={styles.label}>Step {currentStep} of {totalSteps}</Text>
        <Text style={styles.label}>{completion}% complete</Text>
      </View>
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: totalSteps, now: currentStep }} style={styles.track}>
        <View style={[styles.fill, { width: `${completion}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  label: {
    color: "#A277C5",
    fontSize: 16,
  },
  track: {
    height: 10,
    overflow: "hidden",
    borderRadius: 10,
    backgroundColor: "#EBDCF9",
  },
  fill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#CA79F5",
  },
});
