import React from "react";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onPress: () => void;
};

export default function BackButton({
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 40,
      }}
    >
      <Ionicons
        name="arrow-back"
        size={28}
        color="#8B6BAE"
      />
    </Pressable>
  );
}