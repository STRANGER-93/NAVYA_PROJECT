import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";

type Props = {
  onPress: () => void;
};

export default function SkipButton({ onPress }: Props) {
  return (
    <Pressable onPress={onPress}>
      <Text style={styles.skip}>Skip</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  skip: {
    fontSize: 18,
    color: "#888",
    fontWeight: "500",
  },
});