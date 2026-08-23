import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import Colors from "../../constants/colors";

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={[styles.pressable, style, isDisabled ? styles.disabled : null]}
    >
      <LinearGradient
        colors={["#DD92F8", "#BE70F4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.button}
      >
        {loading ? (
          <ActivityIndicator color={Colors.darkPurple} />
        ) : (
          <Text style={styles.title}>{title}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    overflow: "hidden",
    borderRadius: 20,
  },
  button: {
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  title: {
    color: Colors.darkPurple,
    fontSize: 20,
    fontWeight: "500",
  },
  disabled: {
    opacity: 0.55,
  },
});
