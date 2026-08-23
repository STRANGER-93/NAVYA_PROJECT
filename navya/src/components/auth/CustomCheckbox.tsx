import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  checked: boolean;
  onPress: () => void;
};

export default function CustomCheckbox({
  checked,
  onPress,
}: Props) {
  return (
    <Pressable
      style={[
        styles.checkbox,
        checked && styles.checked,
      ]}
      onPress={onPress}
    >
      {checked && (
        <Ionicons
          name="checkmark"
          size={16}
          color="white"
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#C58AF9",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },

  checked: {
    backgroundColor: "#C58AF9",
  },
});