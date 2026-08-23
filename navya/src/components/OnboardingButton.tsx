import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import Colors from "../constants/colors";

type Props = {
  title: string;
  onPress: () => void;
};

export default function OnboardingButton({
  title,
  onPress,
}: Props) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 60,
    borderRadius: 30,

    justifyContent: "center",
    alignItems: "center",

    backgroundColor: Colors.primary,
  },

  text: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
});