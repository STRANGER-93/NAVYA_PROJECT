import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import Colors from "../../../constants/colors";

const stressLevels = [
  { value: 1, label: "Very Low", emoji: "😌" },
  { value: 2, label: "Low", emoji: "😊" },
  { value: 3, label: "Moderate", emoji: "😐" },
  { value: 4, label: "High", emoji: "😟" },
  { value: 5, label: "Very High", emoji: "😫" },
];

type StressLevelSelectorProps = {
  value: number;
  onChange: (value: number) => void;
};

export default function StressLevelSelector({ value, onChange }: StressLevelSelectorProps) {
  const selectedLevel = stressLevels.find((level) => level.value === value) ?? stressLevels[2];

  return (
    <View style={styles.card}>
      <Text style={styles.selectionText}>Select your stress level</Text>
      <View style={styles.selectionPill}>
        <Text style={styles.selectionPillText}>{selectedLevel.label}</Text>
      </View>

      <View style={styles.scale}>
        <View pointerEvents="none" style={styles.line} />
        {stressLevels.map((level) => {
          const selected = level.value === value;

          return (
            <Pressable
              key={level.value}
              accessibilityRole="radio"
              accessibilityLabel={`${level.label}, level ${level.value}`}
              accessibilityState={{ selected }}
              onPress={() => onChange(level.value)}
              style={[styles.levelButton, selected ? styles.selectedLevelButton : null]}
            >
              <Text style={[styles.levelNumber, selected ? styles.selectedLevelNumber : null]}>{level.value}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.labelsRow}>
        {stressLevels.map((level) => (
          <Pressable key={level.value} accessibilityRole="radio" accessibilityState={{ selected: level.value === value }} onPress={() => onChange(level.value)} style={styles.labelButton}>
            <Text style={styles.emoji}>{level.emoji}</Text>
            <Text style={[styles.levelLabel, level.value === value ? styles.selectedLabel : null]}>{level.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: "#E6CFFF",
    borderRadius: 20,
    backgroundColor: "#FEFCFF",
  },
  selectionText: {
    color: "#8A55B5",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  selectionPill: {
    alignSelf: "center",
    marginTop: 15,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 7,
    backgroundColor: "#B75BE6",
  },
  selectionPillText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  scale: {
    position: "relative",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 21,
  },
  line: {
    position: "absolute",
    top: 18,
    right: 20,
    left: 20,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E7D8F7",
  },
  levelButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E4D2F5",
    borderRadius: 19,
    backgroundColor: "#F0E4FC",
  },
  selectedLevelButton: {
    borderColor: "#C36EF1",
    backgroundColor: "#B75BE6",
    boxShadow: "0 0 0 6px rgba(212, 147, 248, 0.28)",
  },
  levelNumber: {
    color: "#9A6EC0",
    fontSize: 16,
    fontWeight: "600",
  },
  selectedLevelNumber: {
    color: Colors.white,
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  labelButton: {
    width: "20%",
    alignItems: "center",
  },
  emoji: {
    fontSize: 25,
  },
  levelLabel: {
    marginTop: 7,
    color: "#75518E",
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  selectedLabel: {
    color: "#A14DCD",
    fontWeight: "700",
  },
});
