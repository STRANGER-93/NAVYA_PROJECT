import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import Colors from "../../../constants/colors";

type NumberStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit: string;
};

export default function NumberStepper({ value, onChange, min, max, unit }: NumberStepperProps) {
  return (
    <View style={styles.card}>
      <Text selectable style={styles.value}>{value}</Text>
      <Text style={styles.unit}>{unit}</Text>
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease to ${value - 1} ${unit}`}
          disabled={value <= min}
          onPress={() => onChange(Math.max(min, value - 1))}
          style={[styles.control, styles.decrease, value <= min ? styles.disabled : null]}
        >
          <Text style={styles.decreaseText}>−</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase to ${value + 1} ${unit}`}
          disabled={value >= max}
          onPress={() => onChange(Math.min(max, value + 1))}
          style={[styles.control, styles.increase, value >= max ? styles.disabled : null]}
        >
          <Text style={styles.increaseText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    paddingTop: 29,
    paddingBottom: 29,
    borderWidth: 1,
    borderColor: "#E6CFFF",
    borderRadius: 31,
    backgroundColor: Colors.white,
  },
  value: {
    color: Colors.darkPurple,
    fontSize: 80,
    fontWeight: "700",
    lineHeight: 88,
    fontVariant: ["tabular-nums"],
  },
  unit: {
    color: "#A277C5",
    fontSize: 18,
  },
  controls: {
    flexDirection: "row",
    gap: 26,
    marginTop: 28,
  },
  control: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 35,
  },
  decrease: {
    backgroundColor: "#ECDDFF",
  },
  increase: {
    backgroundColor: "#DD91F8",
  },
  decreaseText: {
    color: "#8D54B5",
    fontSize: 31,
    fontWeight: "300",
  },
  increaseText: {
    color: Colors.darkPurple,
    fontSize: 31,
    fontWeight: "300",
  },
  disabled: {
    opacity: 0.4,
  },
});
